// Anforderungsniveaus für die Materialien (Kopfzeile jedes Dokuments und jeder Foliensatz).
// Gleiche Zuordnung wie in der App: app/js/data/niveaus.js (Test app/tests/niveaus.test.js prüft Gleichstand).
//   alle – Grund- und Leistungskurs · eA – nur Leistungskurs · plus – über das Kerncurriculum hinaus
'use strict';

const LEVEL_NIVEAU = {
  1: 'alle', 2: 'alle', 3: 'alle', 4: 'alle', 5: 'plus', 6: 'alle',
  7: 'alle', 8: 'plus', 9: 'eA', 10: 'eA',
  11: 'eA', 12: 'eA', 13: 'eA', 14: 'eA',
  15: 'eA', 16: 'plus',
};
const BOSS_NIVEAU = { A: 'alle', B: 'eA', C: 'eA' };

/** Text in der Kopfzeile, z. B. „Niveau: gA und eA“. */
const NIVEAU_TEXT = {
  alle: 'gA und eA',
  eA: 'nur eA (Leistungskurs)',
  plus: 'Zusatz (über das KC hinaus)',
  gemischt: 'gA und eA (Teile nur eA)',
};
/** Kurzform für die rechte Seite der Seitenkopfzeile. */
const NIVEAU_KURS = {
  alle: 'Informatik gA und eA',
  eA: 'Informatik eA (Leistungskurs)',
  plus: 'Informatik · Zusatz',
  gemischt: 'Informatik gA und eA',
};

/** Niveau eines Dokuments: ausdrücklich angegeben (o.niveau) oder aus dem Level (o.ds); sonst „gemischt“. */
function niveauVon(o = {}) {
  if (o.niveau) return o.niveau;
  if (o.ds && LEVEL_NIVEAU[o.ds]) return LEVEL_NIVEAU[o.ds];
  return 'gemischt';
}

module.exports = { LEVEL_NIVEAU, BOSS_NIVEAU, NIVEAU_TEXT, NIVEAU_KURS, niveauVon };
