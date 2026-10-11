// Screenshots der im Video gezeigten Lab-Ansichten (1920x1080, Zoom 125 %) mit eingezeichneter Kamera-Zone unten rechts
import { chromium } from 'playwright';
import fs from 'node:fs';
const BASE = process.argv[2] ?? 'https://automatenlab.frankjuchim.de/';
const OUT = new URL('../materials/build/img/video/shots/', import.meta.url).pathname;
fs.mkdirSync(OUT, { recursive: true });
const R = {
  v1_arena: '#/arena?automat=lol', v1_detektiv: '#/detektiv?fall=1', v2_baukasten: '#/baukasten?aufgabe=endet-ab',
  v3_mealy: '#/mealy?aufgabe=2&modus=vorhersage', v4_ueberliste: '#/ueberliste?stufe=1',
  v5_keller: '#/keller?automat=anbn&modus=sim&wort=aabb', v5_tabelle: '#/keller?automat=anbn&modus=tabelle&wort=aabb',
  v6_rallye: '#/rallye?aufgabe=1', v7_grammatik: '#/grammatik?challenge=8', v7_nea: '#/parallelwelten?aufgabe=2&modus=sim&wort=aab',
  v8_rallye13: '#/rallye?aufgabe=13', v8_sortierer: '#/sortierer?runde=1', v9_quiz: '#/quiz?welt=C',
  o1_minimierer: '#/minimierer?aufgabe=5', o2_keller: '#/keller?automat=palindrom&modus=sim',
};
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1536, height: 864 }, deviceScaleFactor: 1.25 });
for (const [k, r] of Object.entries(R)) {
  for (let i = 0; i < 3; i++) { try { await p.goto(BASE + r, { waitUntil: 'networkidle', timeout: 30000 }); break; } catch (e) { if (i === 2) throw e; } }
  await p.waitForTimeout(1200);
  await p.evaluate(() => { const d = document.createElement('div'); d.style.cssText = 'position:fixed;right:0;bottom:0;width:27%;height:32%;border:4px dashed #B26A0F;background:rgba(178,106,15,.18);z-index:99999;pointer-events:none'; document.body.appendChild(d); });
  await p.screenshot({ path: OUT + k + '.png' });
}
await b.close();
