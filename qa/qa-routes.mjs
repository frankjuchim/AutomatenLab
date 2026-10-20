// Abschluss-QA: ALLE Deep-Links aus app/README.md aufrufen (zwei Viewports), Konsolen-/Seitenfehler,
// externe/fehlgeschlagene Anfragen, horizontales Überlaufen, 404/„bald verfügbar“, leere Seiten und
// „Deep-Link landet nur in der Übersicht“ erkennen; Screenshot je Route.
// Aufruf: PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node qa-routes.mjs [baseUrl]
import { chromium } from 'playwright';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { gastErlaubt } from '../app/js/data/gast.js';
const require = createRequire(import.meta.url);

// Anmeldung (Vertrag InfoLabs §5): Mit QA_PORTAL_KEY (Pfad zu einem privaten Ed25519-Testschlüssel, PKCS#8-PEM) meldet
// sich jeder Browser-Kontext vorab als Lehrkraft mit Kurs an – der Server muss mit PORTAL_URL = QA_PORTAL (Standard
// http://portal.test) und dem passenden PORTAL_PUBLIC_KEY laufen. Mit QA_GAST=1 läuft die Prüfung als Gast: nur die
// Gast-Routen (app/js/data/gast.js) dürfen öffnen, alle anderen müssen zur Anmeldung führen.
const QA_KEY = process.env.QA_PORTAL_KEY ? fs.readFileSync(process.env.QA_PORTAL_KEY, 'utf8') : null;
const QA_PORTAL = process.env.QA_PORTAL ?? 'http://portal.test';
const QA_GAST = process.env.QA_GAST === '1';
// iPad-Prüfung (Schülerinnen und Schüler arbeiten meist am iPad): QA_GERAET=ipad prüft Hochformat, Querformat und
// iPad mini mit Touch und meldet zusätzlich zu kleine Bedienelemente (< 44 × 44 px, Textlinks im Fließtext ausgenommen).
// QA_ROLLE=schueler meldet sich als Schüler im QA-Kurs an (Lehrkraft-Seiten entfallen dann).
const QA_IPAD = process.env.QA_GERAET === 'ipad';
const QA_SCHUELER = process.env.QA_ROLLE === 'schueler';
const VIEWPORTS = QA_IPAD
  ? [{ w: 820, h: 1180, tag: 'ipad-hoch' }, { w: 1180, h: 820, tag: 'ipad-quer' }, { w: 744, h: 1133, tag: 'ipad-mini' }]
  : [{ w: 1366, h: 768, tag: 'desk' }, { w: 820, h: 1180, tag: 'ipad' }];

const BASE = process.argv[2] ?? 'http://localhost:8080/';
const OUT = new URL('./shots-routes/', import.meta.url).pathname;
fs.mkdirSync(OUT, { recursive: true });
const README = fs.readFileSync(new URL('../app/README.md', import.meta.url), 'utf8');

// ── Routenliste aus der README ableiten ──
const routes = new Set();
const add = (r) => routes.add(r);
const range = (n) => Array.from({ length: n }, (_, i) => i + 1);
const idsIn = (prefix) => [...(README.split('\n').find((l) => l.startsWith(prefix)) ?? '').matchAll(/`([a-z0-9-]+)`/g)].map((m) => m[1]);
// 1. alle wörtlichen Links (`#/…` ohne Platzhalter)
for (const m of README.matchAll(/`(#\/[^`<…]*)`/g)) if (!/=n(&|$)/.test(m[1])) add(m[1]);
// 2. Bereiche und ID-Listen expandieren
['1', '2', '3'].forEach((s) => add(`#/arena?stufe=${s}`));
idsIn('| `#/arena?automat=<id>`').forEach((id) => add(`#/arena?automat=${id}`));
range(12).forEach((n) => add(`#/detektiv?fall=${n}`));
['1', '2', '3'].forEach((s) => add(`#/baukasten?stufe=${s}`));
range(18).forEach((n) => add(`#/baukasten?level=${n}`));
for (const m of README.matchAll(/^\| (\d+) \| ([a-z0-9-]+) \|/gm)) add(`#/baukasten?aufgabe=${m[2]}`);
range(7).forEach((n) => { add(`#/minimierer?aufgabe=${n}`); add(`#/minimierer?aufgabe=${n}&modus=unterscheide`); });
range(7).forEach((n) => ['', '&modus=vorhersage', '&modus=bugjagd', '&modus=frei'].forEach((m) => add(`#/mealy?aufgabe=${n}${m}`)));
const nea = idsIn('| `#/parallelwelten?aufgabe=1`').filter((x) => !/^\d/.test(x));
range(6).forEach((n) => { add(`#/parallelwelten?aufgabe=${n}`); add(`#/parallelwelten?aufgabe=${n}&modus=sim`); add(`#/parallelwelten?aufgabe=${n}&modus=spiel`); if (n !== 4) add(`#/parallelwelten?aufgabe=${n}&modus=teilmengen`); });
nea.forEach((id) => add(`#/parallelwelten?automat=${id}`));
add('#/parallelwelten?aufgabe=1&modus=sim&wort=XLOLX');
// Kursseite des Lehrkraft-Bereichs: nur angemeldet sinnvoll (die QA-Lehrkraft hat den Kurs k:900)
if (QA_KEY) ['', '&tab=beitritt', '&tab=auswertung', '&tab=rangliste', '&tab=einstellungen'].forEach((t) => add(`#/lehrkraft?kurs=k%3A900${t}`));
idsIn('| `#/keller?automat=<id>`').forEach((id) => ['', '&modus=sim', '&modus=tabelle', '&modus=rueckwaerts'].forEach((m) => add(`#/keller?automat=${id}${m}`)));
add('#/keller?automat=anbn&modus=sim&wort=aabb');
range(5).forEach((n) => add(`#/ueberliste?stufe=${n}`));
add('#/ueberliste?stufe=bonus');
add('#/sortierer?runde=1'); add('#/sortierer?alle=1');
range(2).forEach((n) => add(`#/turing?challenge=${n}`));
range(13).forEach((n) => add(`#/rallye?aufgabe=${n}`));
range(11).forEach((n) => add(`#/grammatik?challenge=${n}`));
idsIn('| `#/turing?programm=<id>`').forEach((id) => add(`#/turing?programm=${id}`));
['A', 'B', 'C', 'D'].forEach((w) => add(`#/quiz?welt=${w}`));
range(16).forEach((n) => add(`#/quiz?ds=${n}`));
// Bewusst gleich der Übersicht (laut README): #/turing zeigt bereits das Programm „Binärzahl + 1“
const GLEICH_UEBERSICHT = new Set(['#/turing?programm=binaer-plus-1', '#/arena?stufe=1', '#/themen?teil=niveaus']); // Stufe 1 ist Standard; teil=niveaus springt nur zum Abschnitt
// Geschützte Seiten: ohne Sitzung leiten sie still zur Portal-Anmeldung (/sso/start, Vertrag InfoLabs §5) – das ist
// hier der erwartete Ausgang. /sso/start wird abgefangen, damit kein Aufruf ans Portal hinausgeht.
const GESCHUETZT = new Set(['#/lehrkraft']);
const routeTeile = (r) => { const m = /^#\/([a-z]*)\??(.*)$/.exec(r); return { route: m[1], params: new URLSearchParams(m[2]) }; };
const istGeschuetzt = (r) => GESCHUETZT.has(r) || routeTeile(r).route === 'lehrkraft' || (QA_GAST && !gastErlaubt(routeTeile(r).route, routeTeile(r).params));

async function anmelden(ctx) {
  if (!QA_KEY) return;
  const { signiere } = require('../src/jwt.js');
  const start = await ctx.request.get(new URL('sso/start', BASE).href, { maxRedirects: 0 });
  const state = new URL(start.headers().location).searchParams.get('state');
  const iat = Math.floor(Date.now() / 1000);
  const token = signiere({ iss: QA_PORTAL, aud: 'automatenlab', ...(QA_SCHUELER ? { sub: 's:901', rolle: 'schueler', name: 'QA Schüler', kurse: [{ id: 'k:900', name: 'QA-Kurs', rolle: 'mitglied' }] } : { sub: 'l:900', rolle: 'lehrkraft', name: 'QA Lehrkraft', kurse: [{ id: 'k:900', name: 'QA-Kurs', rolle: 'lehrkraft' }] }), iat, exp: iat + 90, jti: crypto.randomBytes(16).toString('hex'), v: 1 }, QA_KEY);
  const ende = await ctx.request.get(new URL(`sso/ende?token=${token}&state=${state}&ziel=%2F`, BASE).href, { maxRedirects: 0 });
  if (ende.status() !== 302) throw new Error(`QA-Anmeldung fehlgeschlagen (${ende.status()})`);
}
const FILTER = process.env.ROUTE_FILTER ? new RegExp(process.env.ROUTE_FILTER) : null;
const ROUTES = [...routes].sort((a, b) => a.localeCompare(b)).filter((r) => !FILTER || FILTER.test(r))
  .filter((r) => !(QA_SCHUELER && /^#\/lehrkraft/.test(r)));

const results = []; const fails = [];
const browser = await chromium.launch();
const t0 = Date.now();
for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 1, ...(QA_IPAD ? { hasTouch: true } : {}) });
  await anmelden(ctx);
  const page = await ctx.newPage();
  const origin = new URL(BASE).origin;
  await page.route((u) => u.origin === origin && u.pathname === '/sso/start', (rt) => rt.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>Anmeldung (QA)</title><main><h1>Anmeldung (QA)</h1></main>' }));
  let errs = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(`console.${m.type()}: ${m.text()}`); });
  page.on('pageerror', (e) => errs.push(`pageerror: ${e.message}`));
  page.on('requestfailed', (r) => errs.push(`requestfailed: ${r.url()}`));
  page.on('request', (r) => { const u = r.url(); if (!u.startsWith(BASE) && !u.startsWith('data:') && !u.startsWith('blob:')) errs.push(`externe Anfrage: ${u}`); });
  const overviewText = new Map();
  // Text + Auswahlzustand (z. B. vorgewählte Stufe), damit Vorauswahl-Links nicht als „nur Übersicht“ gelten
  const textOf = async () => page.evaluate(() => (document.querySelector('main')?.innerText ?? '') + JSON.stringify(
    [...document.querySelectorAll('main [aria-checked="true"], main .is-selected, main input:checked')].map((e) => e.id || e.textContent.trim())));
  for (const r of ROUTES) {
    errs = [];
    // frischer Seitenaufbau je Route (wie beim Scannen eines QR-Codes)
    await page.goto('about:blank');
    await page.goto(`${BASE}${r}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    if (new URL(page.url()).pathname === '/sso/start') {
      const ziel = new URL(page.url()).searchParams.get('ziel');
      const zielOk = GESCHUETZT.has(r) || ziel === `/${r}`; // QR-Code: nach der Anmeldung genau auf diese Route
      const ok = istGeschuetzt(r) && zielOk && !errs.length;
      const line = `${ok ? 'OK  ' : 'FAIL'} [${vp.tag}] ${r}  ·  → Portal-Anmeldung (ziel ${ziel})${ok ? '' : `  →  ${!istGeschuetzt(r) ? 'unerwartete Weiterleitung zur Anmeldung' : !zielOk ? 'falsches ziel' : errs.join(' | ')}`}`;
      results.push(line); if (!ok) fails.push(line);
      continue;
    }
    if (QA_GAST && istGeschuetzt(r)) { const line = `FAIL [${vp.tag}] ${r}  →  Gast sieht geschützte Route ohne Anmeldung`; results.push(line); fails.push(line); continue; }
    const info = await page.evaluate(() => ({
      title: document.title,
      h1: document.querySelector('main h1')?.textContent ?? '',
      len: (document.querySelector('main')?.innerText ?? '').trim().length,
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      svgs: document.querySelectorAll('main svg').length,
      soon: !!document.querySelector('.tile-soon, .coming-soon'),
      error: !!document.querySelector('main .notice-error') && /schiefgelaufen|nicht geladen/.test(document.querySelector('main').innerText),
      // Bedienelemente kleiner als 44 × 44 px (WCAG 2.5.5 / Apple HIG); Textlinks im Fließtext sind ausgenommen
      klein: [...document.querySelectorAll('header a, header button, header summary, main a, main button, main select, main input, main summary, main [role="button"], main [tabindex="0"]')]
        .filter((e) => {
          const r = e.getBoundingClientRect();
          if (!r.width || !r.height || getComputedStyle(e).visibility === 'hidden') return false;
          if (e.matches('input[type="checkbox"], input[type="radio"]')) { const l = e.closest('label'); if (l) { const lr = l.getBoundingClientRect(); return lr.height < 44; } }
          if (e.matches('input[type="hidden"]') || e.closest('svg') || e.closest('.sr-only')) return false;
          if (e.tagName === 'A' && !e.matches('.btn, [role="button"]') && e.closest('p, li, td, figcaption, dd') && (e.closest('p, li, td, figcaption, dd').innerText.trim().length > e.innerText.trim().length + 3)) return false;
          return r.height < 43.5 || r.width < 43.5;
        })
        .map((e) => `${e.tagName.toLowerCase()}${e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/).join('.') : ''}„${(e.innerText || e.getAttribute('aria-label') || e.value || '').trim().slice(0, 20)}“ ${Math.round(e.getBoundingClientRect().width)}×${Math.round(e.getBoundingClientRect().height)}`),
    }));
    const route = r.match(/^#\/([a-z]*)/)[1];
    const probs = [...errs];
    if (/nicht gefunden/i.test(info.title)) probs.push('404');
    if (info.soon) probs.push('„bald verfügbar“ angezeigt');
    if (info.error) probs.push('Fehlermeldung im Modul');
    if (info.len < 150) probs.push(`wenig Inhalt (${info.len} Zeichen)`);
    if (info.overflow > 1) probs.push(`horizontaler Überlauf ${info.overflow}px`);
    if (QA_IPAD && info.klein.length) probs.push(`zu klein für Touch: ${[...new Set(info.klein)].slice(0, 6).join(', ')}${info.klein.length > 6 ? ` (+${info.klein.length - 6})` : ''}`);
    if (!r.includes('?')) overviewText.set(route, await textOf());
    else if (overviewText.has(route) && route !== '' && !GLEICH_UEBERSICHT.has(r) && (await textOf()) === overviewText.get(route)) probs.push('Deep-Link zeigt nur die Modul-Übersicht');
    const name = `${vp.tag}-${r.replace(/^#\/?/, '').replace(/[?&=]/g, '_') || 'home'}`;
    await page.screenshot({ path: `${OUT}${name}.png` });
    const line = `${probs.length ? 'FAIL' : 'OK  '} [${vp.tag}] ${r}  ·  ${info.h1.trim()}  ·  ${info.len} Z., ${info.svgs} SVG${probs.length ? `  →  ${probs.join(' | ')}` : ''}`;
    results.push(line); if (probs.length) fails.push(line);
  }
  await ctx.close();
}
await browser.close();
fs.writeFileSync(new URL('./qa-routes.log', import.meta.url), results.join('\n') + '\n');
console.log(`${ROUTES.length} Routen × ${VIEWPORTS.length} Viewports = ${results.length} Aufrufe in ${Math.round((Date.now() - t0) / 1000)} s`);
console.log(fails.length ? fails.join('\n') : 'Keine Fehler.');
process.exit(fails.length ? 1 : 0);
