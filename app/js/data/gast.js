// Gastmodus (#/gast, Vertrag InfoLabs §4/§9; Entscheidung V2): Ohne Anmeldung gibt es je Modul genau EINE Aufgabe
// zum Ausprobieren. Alle anderen Routen führen ohne Sitzung zur Anmeldung beim Portal (und danach genau dorthin).
//
// • Module mit Prüfung auf dem Server (quiz, detektiv, baukasten): eigene Demo-Aufgaben aus data/demo.js (?demo=1).
// • Module, die noch im Browser prüfen: vorerst die erste Aufgabe des Moduls. Sobald ein Modul auf den Server
//   umzieht (Roadmap Phase 4), bekommt es hier eine eigene Demo-Aufgabe.
//
//   route   Modul-Route   params  Parameter, die genau so passen müssen   erlaubt  zusätzlich erlaubte Parameter
export const GAST = [
  { route: 'arena', titel: 'Akzeptor-Arena', text: 'Eine Übungsrunde ohne Zeitlimit (Stufe 1).', params: { stufe: '1', ueben: '1' } },
  { route: 'detektiv', titel: 'Sprach-Detektiv', text: 'Ein Demo-Fall: Welche Sprache erkennt der Automat?', params: { demo: '1' } },
  { route: 'baukasten', titel: 'Automaten-Baukasten', text: 'Eine Demo-Challenge: DEA für Wörter gerader Länge.', params: { demo: '1' } },
  { route: 'minimierer', titel: 'Minimierer', text: 'Markierungsverfahren am Smiley-Erkenner.', params: { aufgabe: '1' }, erlaubt: ['modus'] },
  { route: 'mealy', titel: 'Mealy-Maschine', text: 'Der Süßigkeitenautomat.', params: { aufgabe: '1' }, erlaubt: ['modus'] },
  { route: 'parallelwelten', titel: 'Parallelwelten', text: 'NEA „LOL-Suche“ simulieren.', params: { aufgabe: '1' }, erlaubt: ['modus', 'wort'] },
  { route: 'keller', titel: 'Keller-Labor', text: 'Kellerautomat für aⁿbⁿ Schritt für Schritt.', params: { automat: 'anbn' }, erlaubt: ['modus', 'wort'] },
  { route: 'ueberliste', titel: 'Überliste den Automaten', text: 'Stufe 1: Der Zähler.', params: { stufe: '1' } },
  { route: 'rallye', titel: 'Ableitungs-Rallye', text: 'Glal I – die erste Ableitung.', params: { aufgabe: '1' } },
  { route: 'grammatik', titel: 'Grammatik-Tester', text: 'Challenge 1: aⁿbⁿ.', params: { challenge: '1' } },
  { route: 'sortierer', titel: 'Chomsky-Sortierer', text: 'Eine Runde mit zehn Karten.', params: { runde: '1' } },
  { route: 'turing', titel: 'Turing-Labor', text: 'Die Turingmaschine „Binärzahl + 1“.', params: {} },
  { route: 'quiz', titel: 'Level-Quiz', text: 'Ein Demo-Quiz mit drei Fragen.', params: { demo: '1' } },
];

/** Material-Demo ohne Anmeldung (Franks Entscheidung 2026-10-12): nur die Akte Level 1 – Schülerfassungen (Arbeitsblatt,
 *  Folien-Handout, Merkblatt) und als Beispiel die Lehrkraftfassungen (Handreichung, Folien mit Notizen); Originale nie.
 *  materials/scripts/export_pdf.mjs schreibt das als `demo` in verzeichnis.json, der Server (src/material.js) prüft es. */
export const GAST_MATERIAL = { akten: ['level-1'], stufen: ['schueler', 'lehrkraft'] };

/** Darf ein Gast diese Route öffnen? (Startseite, Themen, Datenschutz, Gastseite sind immer frei.) */
export function gastErlaubt(route, params) {
  if (['', 'gast', 'themen', 'datenschutz'].includes(route)) return true;
  if (route === 'material' && [...params.keys()].length === 0) return true; // nur die Material-Demo (Server prüft)
  return GAST.some((g) => g.route === route
    && Object.entries(g.params).every(([k, v]) => params.get(k) === v)
    && [...params.keys()].every((k) => k in g.params || (g.erlaubt ?? []).includes(k)));
}

/** Link auf die Demo-Aufgabe eines Eintrags. */
export const gastLink = (g, link) => link(g.route, g.params);
