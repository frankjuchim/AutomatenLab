const __MAT = require('path').resolve(__dirname, '../..'); // Wurzel: materials/
// Gemeinsame Bausteine für Kellerautomaten-Material (DS09/DS10/Boss-Level B)
const D = require((__MAT + '/lib/docstyle.js'));
const HEAD = ['Zustand', 'Belegung Kellerspeicher', 'oberstes Kellersymbol', 'verarbeitetes Eingabezeichen'];
const W = [3.0, 5.2, 4.4, 4.8];

/** Ausgefüllte Abi-Tabelle aus pda_table()-JSON {rows, accepted}. */
function solved(t, o = {}) {
  return [
    ...D.table([HEAD, ...t.rows], { widthsCm: o.widthsCm || W, size: o.size || 19, center: [0, 1, 2, 3] }).slice(0, 1),
    D.p(`Eingabe wird akzeptiert:  ${t.accepted ? '☒ ja   ☐ nein' : '☐ ja   ☒ nein'}${o.grund && t.grund ? `   (${t.grund})` : ''}`, { size: 19, after: 160 }),
  ];
}
/** Leere Abi-Tabelle mit erster Zeile S0 | # | – | –. n = Anzahl Leerzeilen insgesamt (inkl. erster Zeile). */
function blank(n, o = {}) {
  return [
    ...D.fillTable(HEAD, n, { prefill: [['S0', '#', '–', '–']], widthsCm: o.widthsCm || W, size: 19, rowHeightCm: o.rowHeightCm || 0.62 }).slice(0, 1),
    D.p('Eingabe wird akzeptiert:  ☐ ja   ☐ nein', { size: 19, after: 160 }),
  ];
}
module.exports = { HEAD, W, solved, blank };
