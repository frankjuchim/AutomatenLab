// Anforderungsniveaus nach dem Kerncurriculum Informatik Niedersachsen (2017), Lernfeld „Automaten und Sprachen“
// (Vertrag InfoLabs v1.2 §9: jede Plattform zeigt, was für gA und was für eA ist).
//   alle  – Kern: Grund- und Leistungskurs (gA und eA)
//   eA    – Spalte „Erweiterung eA“: im Abitur nur im Leistungskurs gefordert
//   plus  – über das Kerncurriculum hinaus (freiwilliger Zusatz; im KC als „Ergänzungen“ genannt oder gar nicht)
// Gleiche Zuordnung für die Materialien: materials/lib/niveau.js (Test app/tests/niveaus.test.js prüft Gleichstand).

export const NIVEAUS = {
  alle: { kurz: 'gA + eA', lang: 'Grund- und Leistungskurs (gA und eA)' },
  eA: { kurz: 'nur eA', lang: 'nur Leistungskurs (eA)' },
  plus: { kurz: 'Zusatz', lang: 'Zusatz – über das Kerncurriculum hinaus' },
};
export const NIVEAU_IDS = Object.keys(NIVEAUS);

/** Niveau je Level (= Doppelstunde). */
export const LEVEL_NIVEAU = {
  1: 'alle', 2: 'alle', 3: 'alle', 4: 'alle', 5: 'plus', 6: 'alle',
  7: 'alle', 8: 'plus', 9: 'eA', 10: 'eA',
  11: 'eA', 12: 'eA', 13: 'eA', 14: 'eA',
  15: 'eA', 16: 'plus',
};

/** Kurze Begründung, wo die Zuordnung nicht von selbst klar ist. */
export const LEVEL_NIVEAU_HINWEIS = {
  5: 'Minimierung steht nicht im KC – Zusatz zum Analysieren von DEA (im LK-Abitur wurde schon nach dem Zusammenfassen von Zuständen gefragt).',
  8: 'NEA steht nicht im KC – im Leistungskurs aber eine gute Hinleitung zum (nichtdeterministischen) Kellerautomaten.',
  14: 'Zusammenhang Grammatik ↔ Automat ist eA; die Chomsky-Hierarchie selbst nennt das KC als Ergänzung.',
  15: 'Mini-Projekt mit Grammatik und Automat – setzt Welt C voraus.',
  16: 'Die Turingmaschine nennt das KC als Ergänzung.',
};

/** Boss-Level je Welt (Abi-artige Übung am Ende der Welt). */
export const BOSS_NIVEAU = { A: 'alle', B: 'eA', C: 'eA' };

/** Boss-Kämpfe der App (#/boss): wie die Boss-Level, dazu ein Bonus-Boss für Welt D (Sprachdesign, Turingmaschine). */
export const APP_BOSS_NIVEAU = { ...BOSS_NIVEAU, D: 'eA' };

/** Niveau je App-Modul; „je Level“ = Aufgaben haben das Niveau ihres Levels. */
export const MODUL_NIVEAU = {
  arena: 'alle', detektiv: 'alle', baukasten: 'alle', minimierer: 'plus', mealy: 'alle',
  ueberliste: 'alle', parallelwelten: 'plus', keller: 'eA',
  rallye: 'eA', grammatik: 'eA', sortierer: 'eA', turing: 'plus',
  quiz: 'je-level', komponenten: null,
};

/** Kompetenzen des KC (Lernfeld Automaten und Sprachen) mit Niveau und den Leveln, in denen sie erarbeitet werden. */
export const KC_KOMPETENZEN = [
  { id: 'K1', niveau: 'alle', text: 'Aufbau und Funktionsweise eines DEA beschreiben', level: [1, 2] },
  { id: 'K2', niveau: 'alle', text: 'Aufbau und Funktionsweise eines Mealy-Automaten beschreiben', level: [6] },
  { id: 'K3', niveau: 'alle', text: 'Automatenmodelle als Zustandsgraphen entwickeln und implementieren', level: [3, 4, 6] },
  { id: 'K4', niveau: 'alle', text: 'die Funktion eines gegebenen Automaten analysieren', level: [2, 4] },
  { id: 'K5', niveau: 'alle', text: 'Grenzen endlicher Automaten erläutern', level: [7] },
  { id: 'K6', niveau: 'eA', text: 'Kellerautomat als Erweiterung des endlichen Automaten beschreiben', level: [9, 10] },
  { id: 'F1', niveau: 'eA', text: 'Eigenschaften formaler Sprachen im Vergleich zu natürlichen nennen', level: [11] },
  { id: 'F2', niveau: 'eA', text: 'die von einer Grammatik erzeugte Sprache beschreiben', level: [11, 13] },
  { id: 'F3', niveau: 'eA', text: 'reguläre und kontextfreie Grammatiken entwerfen', level: [12, 13] },
  { id: 'F4', niveau: 'eA', text: 'Zusammenhang reguläre Grammatik ↔ endlicher Automat erläutern', level: [12, 14] },
  { id: 'Z', niveau: 'plus', text: 'Ergänzungen: Minimierung, NEA, Chomsky-Hierarchie, Turingmaschine', level: [5, 8, 14, 16] },
];

/** Welt-Niveau für Übersichten: Niveaus aller Level der Welt (ohne Doppelte, in der Reihenfolge alle, eA, plus). */
export const niveausVon = (levels) => NIVEAU_IDS.filter((n) => levels.some((l) => LEVEL_NIVEAU[l] === n));

/** Merkblätter (Level, in dem sie eingeführt werden; `auch`: weitere Level, die sie nutzen) und Abschluss-Materialien mit Niveau – für die Übersicht und die Kopfzeilen der Materialien. */
export const MERKBLAETTER = [
  { id: 'M01', titel: 'DEA', level: 1 }, { id: 'M02', titel: 'DEA entwickeln', level: 3 },
  { id: 'M03', titel: 'Minimierung', level: 5 }, { id: 'M04', titel: 'Mealy-Automaten', level: 6 },
  { id: 'M05', titel: 'Grenzen endlicher Automaten', level: 7 }, { id: 'M06', titel: 'NEA', level: 8 },
  { id: 'M07', titel: 'Kellerautomaten', level: 9 }, { id: 'M08', titel: 'Grammatiken', level: 11 },
  { id: 'M09', titel: 'Reguläre Grammatik', level: 12 }, { id: 'M10', titel: 'Kontextfreie Grammatiken', level: 13, auch: [14] },
  { id: 'M11', titel: 'Turingmaschine', level: 16 },
];
export const ABSCHLUSS_MATERIAL = [
  { titel: 'M12 Abi-Spickzettel (Operatoren & Antwortmuster)', niveau: 'alle', hinweis: 'Abschnitte zu Keller und Grammatik nur eA' },
  { titel: 'Übungsklausur „Smart-Home-Befehle“ (eA, 135 min) mit Erwartungshorizont', niveau: 'eA' },
  { titel: 'Übungsklausur „Fahrradverleih“ (gA, 90 min, endliche Automaten) mit Erwartungshorizont', niveau: 'alle' },
];
