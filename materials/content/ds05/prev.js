const __MAT = require('path').resolve(__dirname, '../..'); // Wurzel: materials/
// Vorschau: node prev.js <datei.docx|pptx> ... → PNG/JPG in build/prev + Kontaktbogen
const D = require((__MAT + '/lib/docstyle.js'));
const S = require((__MAT + '/lib/deckstyle.js'));
const path = require('path');
const PREV = (__MAT + '/build/prev');
for (const f of process.argv.slice(2)) {
  const base = path.basename(f).replace(/\.(docx|pptx)$/, '');
  for (const old of require('fs').readdirSync(PREV)) if (old.startsWith(base)) require('fs').unlinkSync(path.join(PREV, old));
  if (f.endsWith('.pptx')) {
    const imgs = S.preview(f, PREV);
    S.contactSheet(imgs, `${PREV}/${base}_sheet.jpg`, 4);
    console.log(base, imgs.length, 'Folien');
  } else {
    const imgs = D.preview(f, PREV);
    S.contactSheet(imgs, `${PREV}/${base}_sheet.png`, Math.min(imgs.length, 4));
    console.log(base, imgs.length, 'Seiten');
  }
}
