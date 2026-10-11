const __MAT = require('path').resolve(__dirname, '../..'); // Wurzel: materials/
// Lokale Layout-Helfer für DS05/DS06 (docstyle.js bleibt unverändert)
const D = require((__MAT + '/lib/docstyle.js'));
// Klassen aus docstyle verwenden (gleiche docx-Instanz, sonst wird die Tabelle nicht serialisiert)
const { Table, TableRow, TableCell, WidthType, BorderStyle } = D;

const NONE = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const noB = { top: NONE, bottom: NONE, left: NONE, right: NONE, insideHorizontal: NONE, insideVertical: NONE };

/** Zwei Spalten ohne Rahmen nebeneinander (z. B. Abbildung links, Teilaufgaben rechts).
 *  left/right: Arrays von Paragraphs/Tables; widthsCm: [links, rechts]. */
function side(left, right, widthsCm = [7, 10.4], o = {}) {
  const w = widthsCm.map(D.cm);
  const mk = (kids, width) => new TableCell({
    children: [kids].flat(Infinity), width: { size: width, type: WidthType.DXA }, borders: noB,
    margins: { top: 0, bottom: 0, left: 60, right: 60 },
  });
  return [new Table({ width: { size: w[0] + w[1], type: WidthType.DXA }, columnWidths: w, borders: noB,
    rows: [new TableRow({ cantSplit: true, children: [mk(left, w[0]), mk(right, w[1])] })] }), D.spacer(80)];
}

module.exports = { side };
