// Abnahme-Hilfe: legt auf einem lokalen Testserver einen Beispielkurs mit Fantasie-Schülern an, spielt typische Abläufe
// durch und speichert Screenshots aller Seiten der Abnahme-Checkliste (docs/ABNAHME.md) nach docs/abnahme/.
// So sieht Frank vorab, was ihn im echten Verbund erwartet. Keine echten Personendaten (CLAUDE.md Regel 4).
//
// Aufruf (Server mit PORTAL_URL=http://portal.test und passendem PORTAL_PUBLIC_KEY, frische Datenbank):
//   QA_PORTAL_KEY=<privater Testschlüssel> node qa/abnahme.mjs http://localhost:8091/

import { chromium } from 'playwright';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const require = createRequire(import.meta.url);
const { signiere } = require('../src/jwt.js');
const B = process.argv[2] ?? 'http://localhost:8091/';
const KEY = fs.readFileSync(process.env.QA_PORTAL_KEY, 'utf8');
const ZIEL = new URL('../docs/abnahme/', import.meta.url).pathname;
fs.mkdirSync(ZIEL, { recursive: true });
for (const f of fs.readdirSync(ZIEL)) if (f.endsWith('.png')) fs.unlinkSync(ZIEL + f);

const KURS = { id: 'k:900', name: 'LK Informatik 13 (Beispiel)' };
const SCHUELER = ['Mika R.', 'Ada L.', 'Ben K.', 'Lea S.', 'Tom W.', 'Nia P.'];
const DESKTOP = { width: 1280, height: 800 };
const PHONE = { width: 390, height: 844 };
const b = await chromium.launch();
const fehler = [];

async function login(inhalt, viewport = DESKTOP) {
  const ctx = await b.newContext({ viewport, deviceScaleFactor: 1 });
  const s = await ctx.request.get(B + 'sso/start', { maxRedirects: 0 });
  const state = new URL(s.headers().location).searchParams.get('state');
  const iat = Math.floor(Date.now() / 1000);
  const t = signiere({ iss: 'http://portal.test', aud: 'automatenlab', iat, exp: iat + 90, jti: crypto.randomBytes(16).toString('hex'), v: 1, ...inhalt }, KEY);
  await ctx.request.get(B + `sso/ende?token=${t}&state=${state}&ziel=%2F`, { maxRedirects: 0 });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => fehler.push(e.message));
  p.on('dialog', (d) => d.accept());
  return p;
}
const gast = async (viewport = DESKTOP) => { const p = await (await b.newContext({ viewport })).newPage(); p.on('pageerror', (e) => fehler.push(e.message)); return p; };
const api = (p, method, pfad, body) => p.evaluate(async ([m, u, d]) => {
  const r = await fetch(u, { method: m, headers: { 'Content-Type': 'application/json' }, ...(d ? { body: JSON.stringify(d) } : {}) });
  return r.json();
}, [method, pfad, body]);
let nr = 0;
async function bild(p, name, { route = null, warte = 1200, voll = false, element = null } = {}) {
  if (route) { await p.goto(B + route); }
  await p.waitForTimeout(warte);
  const datei = `${String(++nr).padStart(2, '0')}-${name}.png`;
  if (element) await p.locator(element).first().screenshot({ path: ZIEL + datei });
  else await p.screenshot({ path: ZIEL + datei, fullPage: voll });
  console.log(datei);
}

/* ---------- Beispielkurs aufbauen ---------- */
const lk = await login({ sub: 'l:900', rolle: 'lehrkraft', name: 'Frau Beispiel', kurse: [{ ...KURS, rolle: 'lehrkraft' }, { id: 'k:901', name: 'GK Informatik 12 (Beispiel)', rolle: 'lehrkraft' }] });
await lk.goto(B + '#/');
await api(lk, 'PATCH', '/api/lehrer/kurse/k%3A900', { einstellungen: { scoreboard: true, beamer: { aktiv: true }, boss: 'offen', auftrag: { text: 'Bis Freitag: Baukasten Stufe 1 und das Exit-Ticket zu Level 3.', level: [3] } } });
const eigQuiz = await api(lk, 'POST', '/api/lehrer/kurse/k%3A900/eigene', { art: 'quiz', titel: 'Mini-Test: Startzustand', aktiv: true, daten: { fragen: [
  { typ: 'mc', frage: 'Wie wird der Startzustand im Zustandsgraphen markiert?', optionen: ['Doppelkreis', 'Pfeil „Start“', 'Quadrat'], richtig: 1, erklaerung: 'Der Pfeil „Start“ zeigt auf den Startzustand.' },
  { typ: 'wf', aussage: 'ε ist ein Zeichen des Eingabealphabets.', wahr: false, begruendungen: ['Ja, jedes Alphabet enthält ε.', 'Nein, ε ist das leere Wort, kein Zeichen.'], richtig: 1 }] } });
await api(lk, 'POST', '/api/lehrer/kurse/k%3A900/eigene', { art: 'grammatik', titel: 'aⁿbⁿ', aktiv: true, daten: { aufgabe: 'Entwirf eine Grammatik für L = {aⁿbⁿ | n ≥ 1} über Σ = {a, b}.', stufe: 2, alphabet: ['a', 'b'], referenz: 'S → aSb | ab', tipps: ['Jede Regel setzt außen ein a und ein b.'] } });
const detektiv = await api(lk, 'POST', '/api/lehrer/kurse/k%3A900/eigene', { art: 'detektiv', titel: 'Der Schlusspunkt', aktiv: true, daten: { automat: { alphabet: ['a', 'b'], start: 'S0', accepting: ['S1'], delta: { S0: { a: 'S0', b: 'S1' }, S1: { a: 'S0', b: 'S1' } } }, optionen: ['Alle Wörter, die mit b beginnen', 'Alle Wörter, die auf b enden', 'Alle Wörter mit mindestens einem b', 'Alle Wörter mit genau einem b'], richtig: 1, erklaerung: 'S1 bedeutet: zuletzt wurde b gelesen.' } });
const jetzt = Date.now();
await api(lk, 'POST', '/api/lehrer/kurse/k%3A900/challenges', { titel: 'Sortier-Woche', art: 'training', modul: 'sortierer', wertung: 'team', teams: 2, start: new Date(jetzt).toISOString(), ende: new Date(jetzt + 7 * 864e5).toISOString() });

// Schüler arbeiten: Exit-Tickets, Sortierer, Detektiv; einer kämpft gegen den Boss A
const schueler = [];
for (const [i, name] of SCHUELER.entries()) {
  const p = await login({ sub: `s:${600 + i}`, rolle: 'schueler', name, kurse: [{ ...KURS, rolle: 'mitglied' }] }, PHONE);
  await p.goto(B + '#/');
  await p.waitForTimeout(300);
  await p.evaluate(async (k) => {
    const h = { 'Content-Type': 'application/json' };
    for (const q of ['quiz%3Ads-1', 'quiz%3Ads-2', 'quiz%3Ads-3'].slice(0, 1 + (k % 3))) {
      const a = await (await fetch('/api/aufgaben/' + q)).json();
      for (const [n, f] of a.aufgabe.fragen.entries()) if (f.typ === 'mc') await fetch(`/api/aufgaben/${q}/pruefen`, { method: 'POST', headers: h, body: JSON.stringify({ antwort: { frage: n, wahl: f.optionen[(n + k) % f.optionen.length].id } }) });
    }
    const r = await (await fetch('/api/training/sortierer/neu', { method: 'POST', headers: h, body: '{}' })).json();
    for (let n = 0; n < r.items.length; n++) await fetch(`/api/training/runde/${r.id}/antwort`, { method: 'POST', headers: h, body: JSON.stringify({ i: n, typ: [3, 2, 0][(n + k) % 3] }) });
    await fetch(`/api/training/runde/${r.id}/ende`, { method: 'POST', headers: h, body: '{}' });
  }, i);
  schueler.push(p);
}
const mika = schueler[0];

/* ---------- Gast ---------- */
const g = await gast();
await bild(g, 'gast-startseite', { route: '#/' });
await bild(g, 'gast-demo-aufgaben', { route: '#/gast' });
await bild(g, 'gast-turing-demo', { route: '#/turing?demo=1' });

/* ---------- Schüler (Smartphone) ---------- */
await bild(mika, 'schueler-startseite', { route: '#/', warte: 2000 });
await mika.evaluate(() => document.querySelector('.eigene-aufgaben')?.scrollIntoView());
await bild(mika, 'schueler-aufgaben-der-lehrkraft', { warte: 400 });
await bild(mika, 'schueler-baukasten', { route: '#/baukasten?level=3' });
await bild(mika, 'schueler-rangliste', { route: '#/rangliste' });
await bild(mika, 'schueler-challenge-team', { route: '#/challenge?id=1' });
await bild(mika, 'schueler-boss-uebersicht', { route: '#/boss', voll: true });
await mika.goto(B + '#/boss?welt=A'); await mika.waitForTimeout(1000);
await mika.click('text=Kampf starten'); await mika.waitForTimeout(1500);
for (let n = 0; n < 8; n++) { // einige Antworten geben (die erste Option bzw. „Wahr“ + erste Begründung)
  const opt = mika.locator('.boss-aufgabe .option').first(); const dec = mika.locator('.boss-aufgabe .decide').nth(1);
  if (await dec.count()) { await dec.click(); await opt.click(); } else if (await opt.count()) await opt.click();
  else { const sel = mika.locator('.boss-aufgabe select'); for (let j = 0; j < await sel.count(); j++) await sel.nth(j).selectOption({ index: 1 + j }); }
  if (n === 0) await bild(mika, 'schueler-boss-kampf', { warte: 500 });
  const weiter = mika.locator('text=Weiter ›'); if (await weiter.count()) await weiter.click();
  await mika.waitForTimeout(300);
}
await mika.click('text=Abgeben und auswerten'); await mika.waitForTimeout(1500);
await bild(mika, 'schueler-boss-auswertung', { warte: 300 });
await bild(mika, 'schueler-detektiv-der-lehrkraft', { route: `#/detektiv?eigen=${detektiv.nr}`, warte: 1600 });
await bild(mika, 'schueler-quiz-der-lehrkraft', { route: `#/quiz?eigen=${eigQuiz.nr}` });

/* ---------- Lehrkraft (Desktop) ---------- */
await bild(lk, 'lehrkraft-kurse', { route: '#/lehrkraft' });
await bild(lk, 'lehrkraft-schueler', { route: '#/lehrkraft?kurs=k%3A900' });
await bild(lk, 'lehrkraft-auswertung', { route: '#/lehrkraft?kurs=k%3A900&tab=auswertung' });
await bild(lk, 'lehrkraft-boss-ergebnisse', { element: '.lk-karte:has(h3:text("Boss-Ergebnisse"))', warte: 200 });
await bild(lk, 'lehrkraft-fallen-profil', { element: '.lk-karte:has(h3:text("Fallen-Profil"))', warte: 200 });
await bild(lk, 'lehrkraft-rangliste', { route: '#/lehrkraft?kurs=k%3A900&tab=rangliste' });
await bild(lk, 'lehrkraft-challenges', { route: '#/lehrkraft?kurs=k%3A900&tab=challenges', voll: true });
await bild(lk, 'lehrkraft-challenge-zwischenstand', { route: '#/lehrkraft?kurs=k%3A900&tab=challenges&challenge=1' });
await bild(lk, 'lehrkraft-einstellungen', { route: '#/lehrkraft?kurs=k%3A900&tab=einstellungen', voll: true });
await bild(lk, 'lehrkraft-urkunden', { route: '#/lehrkraft?teil=urkunden&kurs=k%3A900' });
await bild(lk, 'lehrkraft-aufgaben', { route: '#/lehrkraft?teil=aufgaben' });
await lk.goto(B + '#/lehrkraft?teil=aufgaben'); await lk.waitForTimeout(1000);
await lk.locator('.lk-boss-pool summary').first().click(); await lk.waitForTimeout(1000);
await bild(lk, 'lehrkraft-boss-pool', { element: '.lk-boss-pool', warte: 200 });
await bild(lk, 'lehrkraft-vorschau-turing', { route: '#/turing?challenge=1&vorschau=1', warte: 1800 });
await bild(lk, 'lehrkraft-eigene-aufgaben', { route: '#/lehrkraft?teil=eigene&kurs=k%3A900' });
await bild(lk, 'lehrkraft-editor-quiz', { route: `#/lehrkraft?teil=eigene&kurs=k%3A900&aufgabe=${eigQuiz.nr}`, voll: true });
await bild(lk, 'lehrkraft-editor-detektiv', { route: `#/lehrkraft?teil=eigene&kurs=k%3A900&aufgabe=${detektiv.nr}`, voll: true, warte: 1800 });
await bild(lk, 'lehrkraft-materialien', { route: '#/material' });
const e = await api(lk, 'GET', '/api/lehrer/kurse/k%3A900');
const beamer = await gast({ width: 1366, height: 768 });
await bild(beamer, 'beamer-board', { route: `#/board?t=${e.einstellungen.beamer.token}`, warte: 1800 });

await b.close();
if (fehler.length) { console.error('Fehler im Browser:', fehler); process.exit(1); }
// Bilder verkleinern (256-Farben-Palette), damit das Repository schlank bleibt – nur, wenn Python mit Pillow da ist
try {
  execFileSync('python3', ['-c', 'import sys,glob\nfrom PIL import Image\nfor f in glob.glob(sys.argv[1]+"*.png"):\n  Image.open(f).convert("RGB").quantize(colors=256, method=Image.Quantize.MEDIANCUT).save(f, optimize=True)', ZIEL]);
} catch { console.log('Hinweis: Bilder nicht verkleinert (python3 mit Pillow fehlt).'); }
console.log(`${nr} Screenshots in docs/abnahme/`);
