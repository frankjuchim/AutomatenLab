// Welten und Level der Unterrichtseinheit (siehe PLAN.md, Abschnitt 0 und 3).
// Level = Doppelstunde. Das letzte Level einer Welt ist das Boss-Level (im Graphen als Endzustand gezeichnet).

export const WORLDS = [
  { id: 'A', title: 'Endliche Automaten', levels: [1, 2, 3, 4, 5, 6] },
  { id: 'B', title: 'Grenzen & Keller', levels: [7, 8, 9, 10] },
  { id: 'C', title: 'Formale Sprachen', levels: [11, 12, 13, 14] },
  { id: 'D', title: 'Sprachdesign & Ausblick', levels: [15, 16] },
];

export const LEVELS = {
  1: 'Ein Automat hört zu',
  2: 'Was macht dieser Automat?',
  3: 'Bauplan gesucht',
  4: 'Modellierungswerkstatt',
  5: 'Weniger ist mehr',
  6: 'Automaten, die antworten',
  7: 'Der Automat stößt an Grenzen',
  8: 'Raten erlaubt',
  9: 'Der Automat bekommt ein Gedächtnis',
  10: 'Keller-Profis',
  11: 'Sprache – natürlich oder formal?',
  12: 'Grammatik trifft Automat',
  13: 'Klammern, Spiegel, Programme',
  14: 'Die Landkarte der Sprachen',
  15: 'Sprachdesign-Studio',
  16: 'Ausblick: Die Turingmaschine',
};

/** Boss-Level am Ende jeder Welt (Abi-artige Aufgabe, freiwilliges Extra-Training). */
export const BOSS_LEVELS = [6, 10, 14];

/** Pflichtweg (3 Wochen à 3 Doppelstunden), Vertiefung (4. Woche) und Bonus-Level.
 *  Lehrkräfte können die Zuordnung hier anpassen. */
export const LEVEL_TYPE = {
  1: 'pflicht', 2: 'pflicht', 3: 'pflicht', 4: 'bonus', 5: 'vertiefung', 6: 'pflicht',
  7: 'pflicht', 8: 'bonus', 9: 'pflicht', 10: 'vertiefung',
  11: 'pflicht', 12: 'pflicht', 13: 'pflicht', 14: 'vertiefung',
  15: 'bonus', 16: 'bonus',
};
export const LEVEL_TYPE_LABEL = { pflicht: 'Pflicht', vertiefung: 'Vertiefung', bonus: 'Bonus' };
