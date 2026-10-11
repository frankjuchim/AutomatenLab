// QA-Durchlauf für AutomatenLab: jede Route laden, Konsolenfehler sammeln, Interaktionen prüfen, Screenshots.
// Aufruf: PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node qa.mjs [baseUrl]
import { chromium } from 'playwright';
import fs from 'node:fs';

const BASE = process.argv[2] ?? 'http://localhost:8080/';
const OUT = new URL('./shots/', import.meta.url).pathname;
fs.mkdirSync(OUT, { recursive: true });
const errors = [];
const results = [];
const ok = (name, cond, extra = '') => { results.push(`${cond ? 'OK  ' : 'FAIL'} ${name}${extra ? ` – ${extra}` : ''}`); };

const browser = await chromium.launch();
for (const vp of [{ w: 1366, h: 768, tag: 'desk' }, { w: 820, h: 1180, tag: 'ipad' }, { w: 390, h: 844, tag: 'phone' }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`[${vp.tag}] console.${m.type()}: ${m.text()}`); });
  page.on('pageerror', (e) => errors.push(`[${vp.tag}] pageerror: ${e.message}`));
  page.on('requestfailed', (r) => errors.push(`[${vp.tag}] requestfailed: ${r.url()}`));
  page.on('request', (r) => { if (!r.url().startsWith(BASE) && !r.url().startsWith('data:')) errors.push(`[${vp.tag}] externe Anfrage: ${r.url()}`); });
  const go = async (hash) => { await page.goto(`${BASE}${hash}`); await page.waitForTimeout(250); };
  const shot = async (name) => page.screenshot({ path: `${OUT}${vp.tag}-${name}.png`, fullPage: vp.tag !== 'desk' ? false : false });
  const full = async (name) => page.screenshot({ path: `${OUT}${vp.tag}-${name}-full.png`, fullPage: true });

  // Startseite
  await go('#/');
  await page.waitForSelector('.level-node');
  ok(`${vp.tag} home: 16 Level-Knoten`, (await page.locator('.level-node').count()) === 16);
  ok(`${vp.tag} home: 13 Modul-Kacheln`, (await page.locator('.tile').count()) === 13);
  await shot('home');
  await page.locator('.level-node').nth(2).click();
  ok(`${vp.tag} home: Level 3 aktiv`, (await page.locator('.level-node.is-active').count()) === 1);
  await full('home');

  // Arena
  await go('#/arena?stufe=2');
  await shot('arena-start');
  await page.click('text=Runde starten');
  await page.waitForSelector('.arena-graph svg', { timeout: 15000 });
  ok(`${vp.tag} arena: Graph gerendert`, (await page.locator('.arena-graph svg .state').count()) >= 2);
  await shot('arena-play');
  for (let i = 0; i < 6; i++) { await page.keyboard.press(i % 2 ? 'ArrowLeft' : 'ArrowRight'); await page.waitForTimeout(1000); }
  const answered = await page.locator('.stat-value').first().textContent();
  ok(`${vp.tag} arena: Tastatur-Antworten zählen`, true, `Punkte ${answered}`);
  await page.click('text=Runde beenden');
  await page.waitForSelector('.arena-result');
  await shot('arena-result');
  if (await page.locator('.mistake-list button').count()) {
    await page.locator('.mistake-list button').first().click();
    await page.waitForSelector('dialog .graph-canvas svg');
    await page.waitForTimeout(1500);
    ok(`${vp.tag} arena: „Zeig mir warum“ hebt Zustand hervor`, (await page.locator('dialog .state.is-active').count()) === 1);
    await shot('arena-why');
    await page.keyboard.press('Escape');
  } else ok(`${vp.tag} arena: keine Fehler zum Erklären`, true);

  // Detektiv
  await go('#/detektiv');
  ok(`${vp.tag} detektiv: ≥ 10 Fälle`, (await page.locator('.case-card').count()) >= 10);
  await go('#/detektiv?fall=4');
  await page.waitForSelector('.case-player svg');
  await page.fill('#testwort', 'bab');
  await page.click('text=Testen');
  await page.waitForTimeout(400);
  ok(`${vp.tag} detektiv: Testwort im Log`, (await page.locator('.test-log li').count()) >= 1);
  // falsche Option (endet auf ab) wählen
  const wrong = page.locator('.option', { hasText: 'auf „ab“ enden' });
  await wrong.click();
  const msg = await page.locator('.case-verdict').textContent();
  ok(`${vp.tag} detektiv: Gegenbeispiel bei falscher Wahl`, /akzeptiert|lehnt/.test(msg), msg.slice(0, 90));
  await page.waitForTimeout(2500);
  await shot('detektiv-wrong');
  await page.locator('.option', { hasText: 'Teilwort „ab“ enthalten' }).click();
  ok(`${vp.tag} detektiv: richtige Wahl gelöst`, (await page.locator('.notice-success').count()) === 1);
  await full('detektiv-solved');

  // Baukasten
  await go('#/baukasten');
  ok(`${vp.tag} baukasten: ≥ 15 Challenges`, (await page.locator('.challenge-card').count()) >= 15);
  await full('baukasten-list');
  await go('#/baukasten?level=2'); // endet auf b
  await page.waitForSelector('.delta-table');
  await page.click('text=+ Zustand hinzufügen');
  // S0: a→S0, b→S1 ; S1: a→S0, b→S1 ; S1 Endzustand
  const sel = (row, col) => page.locator('.delta-table tbody tr').nth(row).locator('select').nth(col);
  await sel(0, 0).selectOption({ label: 'S0' });
  await sel(0, 1).selectOption({ label: 'S1' });
  await sel(1, 0).selectOption({ label: 'S0' });
  // erst falsch prüfen (S1 mit b fehlt)
  await page.locator('.delta-table tbody tr').nth(1).locator('input[type=checkbox]').check();
  await page.click('text=Prüfen');
  ok(`${vp.tag} baukasten: Hinweis „nicht vollständig“`, (await page.locator('.notice-warn').count()) === 1);
  await page.locator('label.check', { hasText: 'Fehlerzustand' }).click();
  await page.click('text=Prüfen');
  const ce = await page.locator('.check-result').textContent();
  ok(`${vp.tag} baukasten: Gegenbeispiel`, /lehnt „bb“ ab|lehnt/.test(ce), ce.slice(0, 100));
  await page.waitForTimeout(400);
  await shot('baukasten-wrong');
  await sel(1, 1).selectOption({ label: 'S1' });
  await page.click('text=Prüfen');
  ok(`${vp.tag} baukasten: richtige Lösung erkannt`, (await page.locator('.check-result .notice-success').count()) === 1);
  await page.fill('#bench-word', 'abab');
  await page.click('text=Simulieren');
  await page.waitForTimeout(3800);
  ok(`${vp.tag} baukasten: Simulation hebt Zustand hervor`, (await page.locator('.bench-graph .state.is-active').count()) === 1);
  await shot('baukasten-solved');
  await full('baukasten-solved');
  // Umbenennen
  await page.locator('.state-name').nth(1).fill('Sb');
  await page.locator('.state-name').nth(1).press('Enter');
  await page.waitForTimeout(500);
  ok(`${vp.tag} baukasten: Umbenennen im Graph`, (await page.locator('.bench-graph svg text', { hasText: 'Sb' }).count()) === 1);

  await go('#/baukasten?modus=frei');
  await page.waitForSelector('.delta-table');
  await page.fill('#sigma-input', '10, 20');
  await page.click('text=Übernehmen');
  await page.click('summary:has-text("Exportieren")');
  await page.waitForTimeout(400);
  const json = await page.locator('.code-out').first().inputValue();
  ok(`${vp.tag} sandbox: JSON-Export mit Σ`, json.includes('"10"'), json.slice(0, 60).replace(/\s+/g, ' '));
  await full('sandbox');

  // Weitere Routen
  await go('#/keller'); // seit Teil 2 fertig (früher „bald verfügbar“) – eigene Prüfung in qa-teil2.mjs
  ok(`${vp.tag} keller: Modul lädt`, (await page.locator('.module-keller .case-card').count()) >= 9);
  await go('#/gibtsnicht');
  ok(`${vp.tag} 404`, (await page.locator('h1', { hasText: 'gibt es nicht' }).count()) === 1);
  await go('#/komponenten');
  await page.waitForTimeout(1500);
  ok(`${vp.tag} komponenten: 4 Graphen`, (await page.locator('.graph-canvas svg').count()) >= 4);
  await page.click('text=Nächster Schritt');
  await page.waitForTimeout(400);
  await full('komponenten');
  await ctx.close();
}

// ohne localStorage (privater Modus simuliert)
{
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  await ctx.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } }); });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`[nols] pageerror: ${e.message}`));
  await page.goto(`${BASE}#/baukasten?level=1`);
  await page.waitForSelector('.delta-table');
  ok('ohne localStorage: Baukasten lädt', true);
  await ctx.close();
}
await browser.close();
console.log(results.join('\n'));
console.log(errors.length ? `\nFEHLER (${errors.length}):\n${[...new Set(errors)].join('\n')}` : '\nKeine Konsolenfehler.');
