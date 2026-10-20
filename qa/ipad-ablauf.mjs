// iPad-Abläufe mit Touch: Schülerinnen und Schüler arbeiten meist am iPad. Spielt die wichtigsten Abläufe mit
// Tippen (tap) statt Klicken durch – Hoch- und Querformat – und meldet Fehler, Überlauf und nicht antippbare Stellen.
// Aufruf (Server mit PORTAL_URL=http://portal.test und passendem PORTAL_PUBLIC_KEY):
//   QA_PORTAL_KEY=<privater Testschlüssel> node qa/ipad-ablauf.mjs http://localhost:8092/ [Screenshot-Ordner]
import { chromium } from 'playwright';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import crypto from 'node:crypto';

const require = createRequire(import.meta.url);
const { signiere } = require('../src/jwt.js');
const B = process.argv[2] ?? 'http://localhost:8092/';
const OUT = process.argv[3] ?? new URL('./shots-ipad/', import.meta.url).pathname;
fs.mkdirSync(OUT, { recursive: true });
const KEY = fs.readFileSync(process.env.QA_PORTAL_KEY, 'utf8');
const b = await chromium.launch();
const fehler = [];

async function anmelden(inhalt, viewport) {
  const ctx = await b.newContext({ viewport, hasTouch: true, deviceScaleFactor: 1 });
  const s = await ctx.request.get(B + 'sso/start', { maxRedirects: 0 });
  const state = new URL(s.headers().location).searchParams.get('state');
  const iat = Math.floor(Date.now() / 1000);
  const t = signiere({ iss: 'http://portal.test', aud: 'automatenlab', iat, exp: iat + 90, jti: crypto.randomBytes(16).toString('hex'), v: 1, ...inhalt }, KEY);
  await ctx.request.get(B + `sso/ende?token=${t}&state=${state}&ziel=%2F`, { maxRedirects: 0 });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => fehler.push(`${viewport.tag}: ${e.message}`));
  p.on('dialog', (d) => d.accept());
  return p;
}

const KURS = [{ id: 'k:950', name: 'iPad-Kurs', rolle: 'mitglied' }];
for (const vp of [{ width: 820, height: 1180, tag: 'hoch' }, { width: 1180, height: 820, tag: 'quer' }]) {
  const p = await anmelden({ sub: 's:951', rolle: 'schueler', name: 'Lea S.', kurse: KURS }, vp);
  const schritt = async (name, fn) => {
    try { await fn(); } catch (e) { fehler.push(`${vp.tag} · ${name}: ${e.message.split('\n')[0]}`); }
    const w = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (w > 1) fehler.push(`${vp.tag} · ${name}: horizontaler Überlauf ${w}px`);
    await p.screenshot({ path: `${OUT}${vp.tag}-${name}.png` });
  };
  await schritt('themen-link', async () => {
    await p.goto(B + '#/'); await p.waitForSelector('.header-themen');
    await p.tap('.header-themen'); await p.waitForSelector('.themen-welt');
    if (!p.url().endsWith('#/themen')) throw new Error('Themen-Link führt nicht zu #/themen');
    await p.waitForSelector('.material-link', { timeout: 8000 });
  });
  await schritt('quiz', async () => {
    await p.goto(B + '#/quiz?welt=A'); await p.waitForSelector('button.option, button.decide');
    await p.tap('button.option >> nth=0').catch(() => p.tap('button.decide >> nth=0'));
    await p.waitForSelector('.feedback, .is-correct, .is-wrong, [class*="richtig"], [class*="falsch"]', { timeout: 8000 });
  });
  await schritt('sortierer', async () => {
    await p.goto(B + '#/sortierer'); await p.tap('text=Runde starten');
    await p.waitForSelector('.lang-card'); await p.tap('.bin >> nth=0');
    await p.waitForFunction(() => /Richtig|Nein –/.test(document.querySelector('main').innerText), null, { timeout: 8000 });
  });
  await schritt('arena', async () => {
    await p.goto(B + '#/arena?stufe=1'); await p.tap('text=Runde starten');
    await p.waitForSelector('.decide-yes'); await p.waitForTimeout(800);
    const vorher = await p.textContent('.arena-hud');
    await p.tap('.decide-yes'); await p.waitForTimeout(600);
    if ((await p.textContent('.arena-hud')) === vorher && !(await p.$('.arena-feedback:not(:empty)'))) throw new Error('Antippen in der Arena ohne Wirkung');
  });
  await schritt('baukasten', async () => {
    await p.goto(B + '#/baukasten?level=3'); await p.waitForSelector('.flag-hit');
    const box = p.locator('.flag-hit input[type="checkbox"]').first();
    const vorher = await box.isChecked();
    await p.locator('.flag-hit').nth(1).tap(); // Zelle „Endzustand“ der ersten Zeile antippen (nicht nur das Kästchen)
    if ((await box.isChecked()) === vorher) throw new Error('Antippen der Endzustand-Zelle ändert nichts');
  });
  await schritt('kontomenue', async () => {
    await p.goto(B + '#/'); await p.tap('.konto-menu > summary');
    await p.waitForSelector('.konto-liste a', { state: 'visible' });
  });
  await p.context().close();
}
await b.close();
console.log(fehler.length ? 'FEHLER:\n' + fehler.join('\n') : 'iPad-Abläufe ohne Fehler (Hoch- und Querformat).');
process.exit(fehler.length ? 1 : 0);
