'use strict';
// AutomatenLab-Server: liefert die Web-App aus app/ unverändert aus (Cache- und Sicherheitsregeln wie bisher
// app/nginx.conf), dazu Healthcheck und Manifest nach dem Vertrag des Plattform-Verbunds InfoLabs
// (https://github.com/frankjuchim/labs/blob/main/VERTRAG.md, Version 1.2).

const path = require('node:path');
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const { openDatabase } = require('./db');
const S = require('./security');
const { schluesselListe } = require('./jwt');
const { createKonten } = require('./konten');
const { createAuswertung } = require('./auswertung');
const { createLernen } = require('./lernen');
const { createTraining } = require('./training');
const { ssoRoutes } = require('./routes/sso');
const { verbundRoutes } = require('./routes/verbund');
const { apiRoutes } = require('./routes/api');
const { materialRoutes } = require('./routes/material');
const { createMaterial } = require('./material');

const APP_DIR = path.join(__dirname, '..', 'app');
const MATERIAL_DIR = process.env.MATERIAL_DIR || path.join(__dirname, '..', 'materials', 'pdf');
const VERSION = require('../package.json').version;
const VERTRAG = '1.2';
const PLATTFORM_ID_STANDARD = 'automatenlab';

// Content-Security-Policy wie bisher in app/nginx.conf: nur eigene Dateien; Graphviz läuft als WASM
// ('wasm-unsafe-eval'), die App setzt Stile per Attribut ('unsafe-inline' nur für style-src, nie für Skripte).
const CSP = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'wasm-unsafe-eval'"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:'],
  'font-src': ["'self'"],
  'connect-src': ["'self'", 'data:'],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'self'"],
  'upgrade-insecure-requests': null
};

/**
 * PORTAL_PUBLIC_KEY tolerant einlesen, bevor src/jwt.js (unverändert) ihn prüft: Anführungszeichen, „\\n“ statt
 * Zeilenumbrüchen, Leerzeichen statt Zeilenumbrüchen (so speichern manche Oberflächen mehrzeilige Werte) oder nur die
 * Base64-Zeile ohne BEGIN/END werden in sauberes PEM übersetzt. Mehrere Blöcke (Schlüsselwechsel) bleiben erhalten.
 */
function normalisiereSchluessel(roh) {
  let t = String(roh || '').trim().replace(/^(['"])([\s\S]*)\1$/, '$2').replace(/\\n/g, '\n');
  const pem = (b64) => `-----BEGIN PUBLIC KEY-----\n${b64.match(/.{1,64}/g).join('\n')}\n-----END PUBLIC KEY-----\n`;
  const bloecke = [...t.matchAll(/-----BEGIN PUBLIC KEY-----([\s\S]*?)-----END PUBLIC KEY-----/g)].map((m) => m[1].replace(/\s+/g, ''));
  if (bloecke.length) return bloecke.filter(Boolean).map(pem).join('');
  t = t.replace(/\s+/g, '');
  return /^[A-Za-z0-9+/]{40,}={0,2}$/.test(t) ? pem(t) : t;
}

/** Vertragspfade (§7 urls) → Hash-Routen der App. Die bisherigen Hash-Routen bleiben unverändert. */
const WEITERLEITUNGEN = {
  '/gast': '/#/gast',
  '/themen': '/#/themen',
  '/lehrer': '/#/lehrkraft',
  '/datenschutz': '/#/datenschutz',
  // Niveau-Übersicht (Vertrag v1.2 §7 urls.niveaus): ein Fragment wie /themen#niveaus ginge bei der Weiterleitung verloren
  '/niveaus': '/#/themen?teil=niveaus',
  '/material': '/#/material'
};

/**
 * Express-App erzeugen.
 * @param {object} opts
 * @param {string} opts.dbFile              SQLite-Datei oder ':memory:'
 * @param {object} opts.katalog             Ergebnis von ladeKatalog() (src/inhalte.js)
 * @param {object} opts.aufgaben            Ergebnis von ladeAufgaben(sessionSecret) (src/aufgaben)
 * @param {string} [opts.plattformId]       PLATTFORM_ID (Standard „automatenlab“)
 * @param {string} [opts.plattformUrl]      PLATTFORM_URL (sonst aus der Anfrage)
 * @param {string} [opts.portalUrl]         PORTAL_URL (leer = Plattform läuft allein)
 * @param {string} [opts.authModus]         AUTH_MODUS (lokal | beides | portal); AutomatenLab hat keine lokale Anmeldung
 * @param {string} [opts.portalPublicKey]   PORTAL_PUBLIC_KEY (PEM, auch einzeilig mit \n, ggf. mehrere Blöcke)
 * @param {string} opts.sessionSecret       Geheimnis zum Signieren der Cookies (≥ 16 Zeichen)
 * @param {string|number|boolean} [opts.trustProxy]
 * @param {Function} [opts.log]
 * @param {Function} [opts.now]             Uhr (ms) – für Tests
 * @param {string|null} [opts.materialDir]  Ordner mit verzeichnis.json der Materialien (Standard materials/pdf; null = keine)
 */
function createApp(opts) {
  const log = opts.log || (() => {});
  const db = openDatabase(opts.dbFile, { log });
  const plattformId = opts.plattformId || PLATTFORM_ID_STANDARD;
  const plattformUrl = String(opts.plattformUrl || '').replace(/\/+$/, '');
  const portalUrl = String(opts.portalUrl || '').replace(/\/+$/, '');
  const katalog = opts.katalog;
  const now = opts.now || (() => Date.now());
  if (!opts.sessionSecret || opts.sessionSecret.length < 16) throw new Error('SESSION_SECRET fehlt oder ist zu kurz (mind. 16 Zeichen).');
  const secret = opts.sessionSecret;

  // Anmeldung über das Portal (Vertrag §5): nur mit PORTAL_URL, gültigem PORTAL_PUBLIC_KEY und AUTH_MODUS ≠ lokal
  let publicKey = [];
  try {
    // Nur Ed25519-Schlüssel zählen (Vertrag §5) – ein anderer parsebarer Schlüssel (z. B. RSA) würde jedes Token ablehnen
    publicKey = opts.portalPublicKey ? schluesselListe(normalisiereSchluessel(opts.portalPublicKey)).filter((k) => k.asymmetricKeyType === 'ed25519') : [];
  } catch (e) {
    log(`FEHLER: PORTAL_PUBLIC_KEY ist ungültig (${e.message}) – Anmeldung über das Portal abgeschaltet.`);
  }
  const authModus = ['lokal', 'beides', 'portal'].includes(opts.authModus) ? opts.authModus : 'portal';
  const basis = (req) => plattformUrl || `${req.protocol}://${req.get('host')}`;
  const sso = {
    aktiv: !!portalUrl && publicKey.length > 0 && authModus !== 'lokal',
    modus: authModus,
    portalUrl,
    plattformId,
    publicKey,
    basis,
    ruecksprung: (req) => `${basis(req)}/sso/ende`
  };
  // Grund für eine abgeschaltete Anmeldung (ohne Geheimnisse) – im Log und in /healthz, damit Fehlkonfigurationen auffallen
  sso.grund = sso.aktiv ? null
    : !portalUrl ? 'PORTAL_URL fehlt'
      : authModus === 'lokal' ? 'AUTH_MODUS ist lokal'
        : !opts.portalPublicKey ? 'PORTAL_PUBLIC_KEY fehlt'
          : 'PORTAL_PUBLIC_KEY enthält keinen gültigen Ed25519-Schlüssel';
  if (!sso.aktiv) log(`Hinweis: Anmeldung über das Portal ist aus (${sso.grund}).`);

  const ctx = { db, now, log };
  const konten = createKonten(ctx);
  const training = createTraining(ctx, { aufgaben: opts.aufgaben });
  const svc = { konten, auswertung: createAuswertung(ctx, { konten, katalog, aufgaben: opts.aufgaben, training }), training, lernen: createLernen(ctx, { aufgaben: opts.aufgaben, training }) };

  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', opts.trustProxy ?? 1);

  app.use(
    helmet({
      contentSecurityPolicy: { useDefaults: false, directives: CSP },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'same-origin' },
      referrerPolicy: { policy: 'no-referrer' },
      strictTransportSecurity: false // HTTPS und HSTS regelt CapRover
    })
  );
  app.use((req, res, next) => {
    res.set('X-Robots-Tag', 'noindex, nofollow');
    res.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');
    next();
  });
  // gzip wie bisher (Graphviz 1,2 MB → ca. 470 KB)
  app.use(compression());

  // Sitzung lesen (signiertes Cookie {k: sub, g: session_gen}); gelöschte Konten sind sofort abgemeldet
  app.use((req, res, next) => {
    const c = S.parseCookies(req.headers.cookie)[S.COOKIE_SITZUNG];
    const s = c ? S.verify(c, secret) : null;
    req.konto = s && typeof s.k === 'string' && Number.isInteger(s.g) ? konten.ausSitzung(s.k, s.g) : null;
    if (req.konto) konten.aktiv(req.konto.sub);
    next();
  });

  /* ---------- Vertrag: Healthcheck und Manifest ---------- */

  app.get('/healthz', (req, res) => {
    try {
      db.prepare('SELECT 1').get();
      res.set('Cache-Control', 'no-store').json({ status: 'ok', version: VERSION, anmeldung: sso.aktiv ? 'portal' : `aus: ${sso.grund}` });
    } catch {
      res.status(500).json({ status: 'error' });
    }
  });

  // Auth-Modus im Manifest: ohne eingerichtete Portal-Anmeldung ehrlich „lokal“ ohne SSO – sonst würde das Portal
  // Aufträge an eine Plattform schicken, die Tokens nicht prüfen kann.
  const manifest = (req) => ({
    vertrag: VERTRAG,
    id: plattformId,
    name: 'AutomatenLab',
    titel: 'AutomatenLab – Maschinen, die Sprache verstehen',
    themenfeld: 'Automaten und formale Sprachen',
    kurs: 'Informatik eA und gA, Niedersachsen, Abitur ab 2027',
    niveaus: ['eA', 'gA'],
    beschreibung:
      'Interaktive Übungsmodule zu endlichen Automaten, Mealy-Maschinen, Kellerautomaten, Grammatiken und Turingmaschinen – mit Simulatoren, Baukasten und Abitur-Tabellen.',
    farbe: '#0E6455',
    version: VERSION,
    basis: basis(req),
    icon: '/assets/favicon.svg',
    urls: {
      start: '/',
      gast: '/gast',
      themen: '/themen',
      lehrkraft: '/lehrer',
      datenschutz: '/datenschutz',
      healthz: '/healthz',
      niveaus: '/niveaus',
      ...(sso.aktiv ? { ssoStart: '/sso/start', ssoEnde: '/sso/ende' } : {})
    },
    auth: { modus: sso.aktiv ? authModus : 'lokal', portal: portalUrl || null, sso: sso.aktiv },
    umfang: katalog.umfang,
    welten: katalog.welten.map((w) => ({ nr: w.nr, kennung: w.kennung, titel: w.titel, farbe: w.farbe, level: w.level })),
    faehigkeiten: ['gast', 'themen', 'training', ...(material.anzahl() ? ['lehrkraft-materialien'] : [])]
  });

  app.get('/api/plattform', (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cache-Control', 'no-cache');
    res.json(manifest(req));
  });

  /* ---------- Öffentliche API für die App ---------- */

  // Themenübersicht ohne Lösungen (Vertrag §9): Welten, Level, Module
  app.get('/api/themen', (req, res) => {
    res.set('Cache-Control', 'no-cache');
    res.json({ welten: katalog.welten, module: katalog.module, portal: portalUrl || null });
  });

  // Zusätzliche Materialien (PDF/Originale): materials/pdf, in Tests über opts.materialDir (null = keine)
  const material = createMaterial({ dir: opts.materialDir !== undefined ? opts.materialDir : MATERIAL_DIR, log });
  const h = { svc, secret, sso, now, log, katalog, material };
  verbundRoutes(app, h);
  materialRoutes(app, h);
  apiRoutes(app, h);
  ssoRoutes(app, h);
  app.use('/api', (req, res) => res.status(404).json({ error: 'Unbekannte API-Route.' }));

  /* ---------- Vertragspfade → Hash-Routen ---------- */

  for (const [pfad, ziel] of Object.entries(WEITERLEITUNGEN)) {
    app.get(pfad, (req, res) => res.redirect(302, ziel));
  }

  /* ---------- Statische App (Regeln wie app/nginx.conf) ---------- */

  const statisch = (dir, cache) =>
    express.static(path.join(APP_DIR, dir), {
      index: false,
      dotfiles: 'deny',
      fallthrough: true,
      setHeaders: (res) => res.set('Cache-Control', cache)
    });
  const LANG = 'public, max-age=2592000, immutable';
  app.use('/css', statisch('css', 'public, max-age=3600, must-revalidate'));
  app.use('/js', statisch('js', 'public, max-age=3600, must-revalidate'));
  app.use('/vendor', statisch('vendor', 'public, max-age=2592000'));
  app.use('/assets', statisch('assets', LANG));

  // index.html nie lange cachen, damit Updates sofort ankommen; wie bisher (try_files … /index.html) liefern auch
  // unbekannte Pfade die App aus – QR-Codes zeigen auf BASE_URL + #/route.
  const index = (req, res) => {
    res.set('Cache-Control', 'no-cache');
    res.sendFile(path.join(APP_DIR, 'index.html'));
  };
  app.get('/', index);
  app.get('/index.html', index);
  app.get(/^\/(?!(?:css|js|vendor|assets|api|sso)\/).*/, (req, res, next) => {
    // Dateien mit Endung, die es nicht gibt, sind echte 404 (kein HTML statt Bild/Skript)
    if (/\.[a-z0-9]{2,5}$/i.test(req.path)) return next();
    index(req, res);
  });

  app.use((req, res) => res.status(404).type('text').send('Nicht gefunden.'));

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err && err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Ungültiges JSON.' });
    if (err && err.type === 'entity.too.large') return res.status(413).json({ error: 'Anfrage zu groß.' });
    const status = err && Number.isInteger(err.status) ? err.status : 500;
    if (status >= 500) log(err && err.stack ? err.stack : String(err));
    const text = status >= 500 ? 'Interner Fehler.' : err.message || 'Fehler.';
    if (req.path.startsWith('/api/')) return res.status(status).json({ error: text });
    res.status(status).type('text').send(text);
  });

  app.locals.db = db;
  app.locals.manifest = manifest;
  app.locals.svc = svc;
  app.locals.sso = sso;
  return app;
}

module.exports = { createApp, normalisiereSchluessel, VERSION, VERTRAG, WEITERLEITUNGEN, PLATTFORM_ID_STANDARD };
