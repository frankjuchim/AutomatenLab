// Abschluss-QA: ALLE Deep-Links aus app/README.md aufrufen (zwei Viewports), Konsolen-/Seitenfehler,
// externe/fehlgeschlagene Anfragen, horizontales Überlaufen, 404/„bald verfügbar“, leere Seiten und
// „Deep-Link landet nur in der Übersicht“ erkennen; Screenshot je Route.
// Aufruf: PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node qa-routes.mjs [baseUrl]
import { chromium } from 'playwright';
import fs from 'node:fs';

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
const GLEICH_UEBERSICHT = new Set(['#/turing?programm=binaer-plus-1', '#/arena?stufe=1']); // Stufe 1 ist Standard
const FILTER = process.env.ROUTE_FILTER ? new RegExp(process.env.ROUTE_FILTER) : null;
const ROUTES = [...routes].sort((a, b) => a.localeCompare(b)).filter((r) => !FILTER || FILTER.test(r));

const results = []; const fails = [];
const browser = await chromium.launch();
const t0 = Date.now();
for (const vp of [{ w: 1366, h: 768, tag: 'desk' }, { w: 820, h: 1180, tag: 'ipad' }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
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
    const info = await page.evaluate(() => ({
      title: document.title,
      h1: document.querySelector('main h1')?.textContent ?? '',
      len: (document.querySelector('main')?.innerText ?? '').trim().length,
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      svgs: document.querySelectorAll('main svg').length,
      soon: !!document.querySelector('.tile-soon, .coming-soon'),
      error: !!document.querySelector('main .notice-error') && /schiefgelaufen|nicht geladen/.test(document.querySelector('main').innerText),
    }));
    const route = r.match(/^#\/([a-z]*)/)[1];
    const probs = [...errs];
    if (/nicht gefunden/i.test(info.title)) probs.push('404');
    if (info.soon) probs.push('„bald verfügbar“ angezeigt');
    if (info.error) probs.push('Fehlermeldung im Modul');
    if (info.len < 150) probs.push(`wenig Inhalt (${info.len} Zeichen)`);
    if (info.overflow > 1) probs.push(`horizontaler Überlauf ${info.overflow}px`);
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
console.log(`${ROUTES.length} Routen × 2 Viewports = ${results.length} Aufrufe in ${Math.round((Date.now() - t0) / 1000)} s`);
console.log(fails.length ? fails.join('\n') : 'Keine Fehler.');
process.exit(fails.length ? 1 : 0);
