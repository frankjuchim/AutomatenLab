const __MAT = require('path').resolve(__dirname, '../..'); // Wurzel: materials/
// Vorschau: node prev.js <datei.docx|pptx> … → PNG/JPG in build/prev + Kontaktbogen
const D = require((__MAT + '/lib/docstyle.js'));
const S = require((__MAT + '/lib/deckstyle.js'));
const path = require('path');
const PREV = (__MAT + '/build/prev/');
const fs = require('fs');
for (const f of process.argv.slice(2)) {
  const base = path.basename(f).replace(/\.(docx|pptx)$/, '');
  for (const o of fs.readdirSync(PREV)) if (o.startsWith(base + '-') && /\.(png|jpg)$/.test(o)) fs.unlinkSync(PREV + o);
  const imgs = f.endsWith('.pptx') ? S.preview(f, PREV) : D.preview(f, PREV);
  const mine = imgs.filter((p) => path.basename(p).startsWith(base + '-'));
  const sheet = PREV + base + (f.endsWith('.pptx') ? '_sheet.jpg' : '_sheet.png');
  S.contactSheet(mine, sheet, f.endsWith('.pptx') ? 4 : Math.min(4, mine.length));
  console.log(sheet, mine.length);
}
