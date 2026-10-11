const __MAT = require('path').resolve(__dirname, '../..'); // Wurzel: materials/
// Lokale Layout-Helfer für DS02–DS04 (ergänzen docstyle.js, ohne die Bibliothek zu verändern).
const D = require((__MAT + '/lib/docstyle.js'));
const { Table, TableRow, TableCell, WidthType, BorderStyle } = D;
const { VerticalAlign, TableLayoutType } = require('docx');

const NONE = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const noBorders = { top: NONE, bottom: NONE, left: NONE, right: NONE, insideHorizontal: NONE, insideVertical: NONE };

/** Zwei (oder mehr) Spalten ohne Rahmen. cols: Array von Arrays (Paragraphs/Tables), widthsCm: Spaltenbreiten. */
function cols(columns, widthsCm, o = {}) {
  const ws = widthsCm.map(D.cm);
  const total = ws.reduce((a, b) => a + b, 0);
  const row = new TableRow({ cantSplit: o.cantSplit !== false, children: columns.map((c, i) => new TableCell({
    children: [c].flat(Infinity).length ? [c].flat(Infinity) : [D.p('')],
    width: { size: ws[i], type: WidthType.DXA }, borders: noBorders,
    verticalAlign: o.valign === 'top' ? VerticalAlign.TOP : VerticalAlign.CENTER,
    margins: { top: 0, bottom: 0, left: i ? 100 : 0, right: i < columns.length - 1 ? 100 : 0 },
  })) });
  return [new Table({ rows: [row], width: { size: total, type: WidthType.DXA }, columnWidths: ws, layout: TableLayoutType.FIXED, borders: noBorders }), D.spacer(o.after ?? 80)];
}

/** Absatz, der mit dem folgenden zusammengehalten wird. */
const pk = (text, o = {}) => D.p(text, { ...o, keepNext: true });

module.exports = { cols, pk, noBorders };

/** Teilaufgabe wie D.sub, aber mit dem Folgeelement (z. B. Zeichenfläche) zusammengehalten. */
function subk(letter, text, o = {}) {
  const { Paragraph, TextRun } = D;
  return new Paragraph({ keepNext: true, children: [new TextRun({ text: `${letter})  `, font: D.FONT_BODY, bold: true, size: 22, color: D.C.teal }), ...D.runs(text, o)], indent: { left: 360, hanging: 360 }, spacing: { after: 80, line: 276 } });
}
module.exports.subk = subk;

/** Folie mit 2–4 Bildkarten nebeneinander (Kopf, kurzer Text, großes Bild). d = deck(), S = deckstyle. */
function gallery(d, S, { title, phase, items, notes, textH = 0.9, rows = false }) {
  const s = d.blank({ title, phase, notes });
  if (rows) {
    const W = 13.333, M = 0.6, gap = 0.2, k = items.length, y0 = 1.45, rh = (5.4 - gap * (k - 1)) / k, tw = 4.4;
    items.forEach((it, i) => {
      const y = y0 + i * (rh + gap);
      s.addShape(d.pres.shapes.ROUNDED_RECTANGLE, { x: M, y, w: W - 2 * M, h: rh, fill: { color: S.H.tealTint2 }, line: { color: S.H.tealTint }, rectRadius: 0.08 });
      d.tb(s, [{ text: it.head, options: { fontSize: 21, bold: true, fontFace: 'Cambria', color: S.H.tealDark, breakLine: true } }, ...d.rich(it.text, { fontSize: 18 })], { x: M + 0.25, y: y + 0.15, w: tw, h: rh - 0.3, valign: 'middle' });
      const f = d.fit(it.img, W - 2 * M - tw - 0.8, rh - 0.2);
      s.addImage({ path: it.img, x: M + tw + 0.5 + (W - 2 * M - tw - 0.8 - f.w) / 2, y: y + (rh - f.h) / 2, w: f.w, h: f.h });
    });
    return s;
  }
  const W = 13.333, M = 0.6, gap = 0.3, k = items.length, cw = (W - 2 * M - gap * (k - 1)) / k, y = 1.5, h = 5.3;
  items.forEach((it, i) => {
    const x = M + i * (cw + gap);
    s.addShape(d.pres.shapes.ROUNDED_RECTANGLE, { x, y, w: cw, h, fill: { color: S.H.tealTint2 }, line: { color: S.H.tealTint }, rectRadius: 0.08 });
    d.tb(s, it.head, { x: x + 0.25, y: y + 0.2, w: cw - 0.5, h: 0.5, fontSize: 21, bold: true, fontFace: 'Cambria', color: S.H.tealDark });
    d.tb(s, d.rich(it.text, { fontSize: 18 }), { x: x + 0.25, y: y + 0.75, w: cw - 0.5, h: textH });
    const top = y + 0.85 + textH, avail = h - (top - y) - 0.2;
    const f = d.fit(it.img, cw - 0.4, avail);
    s.addImage({ path: it.img, x: x + (cw - f.w) / 2, y: top + (avail - f.h) / 2, w: f.w, h: f.h });
  });
  return s;
}
module.exports.gallery = gallery;
