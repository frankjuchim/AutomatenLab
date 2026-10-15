'use strict';
// Single Sign-on mit dem Portal InfoLabs (Vertrag §5, docs/INTEGRATION.md §3 in frankjuchim/labs).
// Ablauf: /sso/start → Portal → /sso/ende?token=…&state=…&ziel=… → eigene Sitzung → ziel.
// Tokens werden nie geloggt; /sso/ende antwortet mit Referrer-Policy no-referrer und Cache-Control no-store.

const crypto = require('node:crypto');
const S = require('../security');
const { pruefe, JtiSpeicher } = require('../jwt');

const STATE_COOKIE = 'al_sso_state';
const STATE_MS = 10 * 60 * 1000;
const SCHUELER_SITZUNG_MS = 30 * 24 * 3600 * 1000; // höchstens 30 Tage (§5)
const LEHRKRAFT_SITZUNG_MS = 8 * 3600 * 1000; // höchstens 8 Stunden (§5)

/** Nur relative Pfade mit genau einem „/“ am Anfang (kein //, kein \) – sonst „/“. */
function sicheresZiel(z) {
  return typeof z === 'string' && z.length <= 2000 && /^\/(?![/\\])/.test(z) && !/[\r\n]/.test(z) ? z : '/';
}

/** Ziel passend zur Rolle (wie Algo Quest 2.8.3): Lehrkräfte und Admins kommen von der Startseite in den
 *  Lehrkraft-Bereich, Schüler nie dorthin. Deep-Links auf Aufgaben (QR-Codes) bleiben für alle unverändert. */
function zielFuerRolle(ziel, rolle) {
  const lehrkraftZiel = ziel.startsWith('/lehrer') || ziel.startsWith('/#/lehrkraft');
  if (rolle === 'schueler') return lehrkraftZiel ? '/' : ziel;
  return ziel === '/' ? '/#/lehrkraft' : ziel;
}

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ESC[c]);

// Rollenneutraler Text bei fehler=keine_berechtigung (Vertrag v1.3, docs/INTEGRATION.md §3.2 in frankjuchim/labs) –
// die Plattform weiß hier nicht, wer anfragt. Wortlaut wie in der Test-Plattform des Portals.
const KEIN_ZUGANG = [
  'Kein Zugang.',
  'Diese Plattform ist für dieses Konto noch nicht freigeschaltet.',
  'Schülerinnen und Schüler: Die Lehrkraft muss die Plattform im Portal für den Kurs freischalten.',
  'Lehrkräfte: Die Freischaltung der Plattform erteilt die Administration im Portal; danach die Plattform beim Kurs ankreuzen.'
];

/** Kleine Hinweisseite ohne Skripte im Stil der App (nur feste Texte; text als Liste = mehrere Absätze). */
function seite(res, status, titel, text, links = [['/', 'Zur Startseite']]) {
  const absaetze = Array.isArray(text) ? text : [text];
  res
    .status(status)
    .type('html')
    .send(
      `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">` +
        `<meta name="robots" content="noindex, nofollow"><title>${esc(titel)} – AutomatenLab</title>` +
        `<link rel="stylesheet" href="/css/app.css"><link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"></head>` +
        `<body><main id="main" class="page narrow" style="margin:3rem auto;padding:0 1rem"><h1>${esc(titel)}</h1>` +
        absaetze.map((t, i) => `<p${i ? '' : ' class="lead"'}>${esc(t)}</p>`).join('') +
        `<p>${links.map(([href, t]) => `<a class="btn" href="${esc(href)}">${esc(t)}</a>`).join(' ')}</p></main></body></html>`
    );
}

/**
 * @param {import('express').Express} app
 * @param {object} h  { svc, secret, sso: {aktiv, portalUrl, plattformId, publicKey, ruecksprung(req)}, now, log }
 */
function ssoRoutes(app, h) {
  const { svc, secret, sso } = h;
  const jti = new JtiSpeicher();
  const jetztSek = () => Math.floor(h.now() / 1000);
  const startIp = new S.Limiter({ max: 120, windowMs: 10 * 60 * 1000 });

  const nichtEingerichtet = (res) =>
    seite(res, 503, 'Anmeldung nicht eingerichtet', 'Die Anmeldung über das Portal InfoLabs ist auf diesem Server noch nicht eingerichtet. Die Demo-Aufgaben kannst du ohne Anmeldung ausprobieren.');

  // Einstieg aus dem Portal (Vertrag v1.3 §5): startet IMMER neu, auch mit bestehender Sitzung – nie direkt auf ziel.
  // Die bestehende Sitzung bleibt unangetastet, bis /sso/ende ein neues Token vollständig geprüft hat.
  app.get('/sso/start', (req, res) => {
    res.set('Cache-Control', 'no-store');
    if (!sso.aktiv) return nichtEingerichtet(res);
    const key = 'ip:' + req.ip;
    if (!startIp.take(key)) return seite(res, 429, 'Zu viele Anmeldungen', 'Von diesem Netzwerk kamen gerade sehr viele Anmeldungen. Bitte warte ein paar Minuten.');
    const state = crypto.randomBytes(16).toString('base64url'); // 22 Zeichen, ≥ 128 bit (§5)
    S.setCookie(req, res, STATE_COOKIE, { st: state }, secret, STATE_MS);
    const u = new URL(sso.portalUrl + '/sso/autorisieren');
    u.searchParams.set('plattform', sso.plattformId);
    u.searchParams.set('ruecksprung', sso.ruecksprung(req));
    u.searchParams.set('state', state);
    u.searchParams.set('ziel', sicheresZiel(req.query.ziel));
    res.redirect(302, u.href);
  });

  app.get('/sso/ende', (req, res) => {
    res.set('Referrer-Policy', 'no-referrer');
    res.set('Cache-Control', 'no-store');
    if (!sso.aktiv) return nichtEingerichtet(res);
    const cookies = S.parseCookies(req.headers.cookie);
    const gemerkt = cookies[STATE_COOKIE] ? S.verify(cookies[STATE_COOKIE], secret) : null;
    S.clearCookie(req, res, STATE_COOKIE); // state ist genau einmal verwendbar
    const abgelehnt = () =>
      seite(res, 401, 'Anmeldung fehlgeschlagen', 'Die Anmeldung konnte nicht bestätigt werden (abgelaufen oder ungültig). Bitte melde dich erneut an.', [
        ['/sso/start', 'Erneut anmelden'],
        ['/', 'Zur Startseite']
      ]);
    if (!gemerkt || typeof gemerkt.st !== 'string' || typeof req.query.state !== 'string' || !S.safeEqual(gemerkt.st, req.query.state)) return abgelehnt();
    // Ohne Sitzung zu setzen oder zu ändern (eine bestehende bleibt, wie sie war)
    if (req.query.fehler === 'keine_berechtigung') return seite(res, 403, KEIN_ZUGANG[0], KEIN_ZUGANG.slice(1), [[sso.portalUrl + '/', '⌂ Zurück zum Portal']]);
    if (req.query.fehler) return res.redirect(302, '/');
    const p = pruefe(req.query.token, sso.publicKey, { iss: sso.portalUrl, aud: sso.plattformId, maxDauerSek: 120, jetztSek: jetztSek() });
    if (!p.ok) return abgelehnt();
    if (!jti.merke(p.nutzlast.jti, p.nutzlast.exp, jetztSek())) return abgelehnt(); // wiederverwendet
    const inhalt = svc.konten.tokenInhalt(p.nutzlast);
    if (!inhalt) return abgelehnt();
    // Erst jetzt (alles geprüft) Konto und Kurse abgleichen und eine bestehende Sitzung ersetzen
    const k = svc.konten.anmelden(inhalt);
    S.setCookie(req, res, S.COOKIE_SITZUNG, { k: k.sub, g: k.session_gen }, secret, k.rolle === 'schueler' ? SCHUELER_SITZUNG_MS : LEHRKRAFT_SITZUNG_MS);
    res.redirect(302, zielFuerRolle(sicheresZiel(req.query.ziel), k.rolle));
  });

  // Abmelden nur auf dieser Plattform
  app.get('/abmelden', (req, res) => {
    S.clearCookie(req, res, S.COOKIE_SITZUNG);
    res.set('Cache-Control', 'no-store');
    res.redirect(302, '/');
  });

  // „Überall abmelden“: eigene Sitzung beenden, dann Portal (leitet nur auf eingetragene Plattformen zurück)
  app.get('/abmelden/ueberall', (req, res) => {
    S.clearCookie(req, res, S.COOKIE_SITZUNG);
    res.set('Cache-Control', 'no-store');
    if (!sso.portalUrl) return res.redirect(302, '/');
    res.redirect(302, `${sso.portalUrl}/sso/abmelden?ruecksprung=${encodeURIComponent(sso.basis(req) + '/')}`);
  });
}

module.exports = { ssoRoutes, sicheresZiel, KEIN_ZUGANG, STATE_COOKIE, SCHUELER_SITZUNG_MS, LEHRKRAFT_SITZUNG_MS };
