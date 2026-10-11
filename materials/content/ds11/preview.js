const __MAT = require('path').resolve(__dirname, '../..'); // Wurzel: materials/
// Vorschau für Welt-C-Dateien: node preview.js <datei.docx|pptx> … → PNG/JPG-Seiten + Kontaktbogen in build/prev/
const D = require((__MAT + '/lib/docstyle.js'));
const S = require((__MAT + '/lib/deckstyle.js'));
const path = require('path');
const fs = require('fs');
const PREV = (__MAT + '/build/prev/');
for (const f of process.argv.slice(2)) {
  const base = path.basename(f).replace(/\.(docx|pptx)$/, '');
  fs.readdirSync(PREV).filter((x) => x.startsWith(base + '-') && /\.(png|jpg)$/.test(x)).forEach((x) => fs.unlinkSync(PREV + x));
  const pages = f.endsWith('.pptx') ? S.preview(f, PREV) : D.preview(f, PREV);
  const mine = pages.filter((p) => path.basename(p).startsWith(base + '-'));
  const sheet = S.contactSheet(mine, PREV + base + '_sheet.jpg', f.endsWith('.pptx') ? 4 : Math.min(4, mine.length));
  console.log(`${base}: ${mine.length} Seiten → ${sheet}`);
}
