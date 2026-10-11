const __MAT = require('path').resolve(__dirname, '../..'); // Wurzel: materials/
// Vorschau: DOCX/PPTX → PNG/JPG + Kontaktbogen.  Aufruf: node preview.js <datei …>
const D = require((__MAT + '/lib/docstyle.js'));
const S = require((__MAT + '/lib/deckstyle.js'));
const path = require('path');
const PREV = (__MAT + '/build/prev/');
for (const f of process.argv.slice(2)) {
  const base = path.basename(f).replace(/\.(docx|pptx)$/, '');
  for (const old of require('fs').readdirSync(PREV)) if (old.startsWith(base + '-') || old.startsWith(base + '.') || old.startsWith(base + '_sheet')) require('fs').unlinkSync(PREV + old);
  const imgs = f.endsWith('.pptx') ? S.preview(f, PREV) : D.preview(f, PREV);
  const cols = f.endsWith('.pptx') ? 4 : 4;
  const sheet = S.contactSheet(imgs, PREV + base + '_sheet.jpg', cols);
  console.log(imgs.length + ' Seiten → ' + sheet);
}
