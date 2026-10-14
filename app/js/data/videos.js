// Erklärvideo-Reihe (Roadmap Phase 6): je Video die Module, auf deren Seite der Knopf „▶ Erklärvideo“ erscheint.
// Titel und IDs wie in materials/content/video/videos.js und videos_b.js (Test app/tests/videos.test.js hält beide gleich).
// url: Adresse des hochgeladenen Videos – solange null, zeigt die App nichts an. Nur verlinken, nie einbetten
// (keine externen Ressourcen in der App, CLAUDE.md Regel 4); der Link öffnet in einem neuen Tab.

export const ERKLAERVIDEOS = [
  { id: 'V1', titel: 'Wie ein Automat ein Wort prüft', level: [1, 2], module: ['arena', 'detektiv'], url: null },
  { id: 'V2', titel: 'DEA entwickeln in 5 Schritten', level: [3], module: ['baukasten'], url: null },
  { id: 'V3', titel: 'Mealy-Automaten: Automaten, die antworten', level: [6], module: ['mealy'], url: null },
  { id: 'V4', titel: 'Grenzen: Was ein endlicher Automat nicht kann', level: [7], module: ['ueberliste'], url: null },
  { id: 'V5', titel: 'Kellerautomaten: Notation und Abi-Tabelle', level: [9], module: ['keller'], url: null },
  { id: 'V6', titel: 'Grammatiken: Wie man eine Sprache erzeugt', level: [11], module: ['rallye'], url: null },
  { id: 'V7', titel: 'Reguläre Grammatik und endlicher Automat', level: [12], module: ['grammatik', 'parallelwelten'], url: null },
  { id: 'V8', titel: 'Kontextfreie Grammatiken und Mehrdeutigkeit', level: [13, 14], module: ['rallye', 'sortierer'], url: null },
  { id: 'V9', titel: 'Abi-Check: Antworten, die volle Punkte bringen', level: [14], module: ['quiz'], url: null },
  { id: 'O1', titel: 'Minimierung: weniger Zustände, gleiche Sprache', level: [5], module: ['minimierer'], url: null },
  { id: 'O2', titel: 'Kellerautomat mit Raten: Palindrome', level: [10], module: ['keller'], url: null },
];

/** Videos mit Adresse zu einem Modul (für den Knopf auf der Modulseite). */
export const videosZuModul = (route) => ERKLAERVIDEOS.filter((v) => v.url && v.module.includes(route));
/** Videos mit Adresse zu einem Level (Themenseite). */
export const videosZuLevel = (n) => ERKLAERVIDEOS.filter((v) => v.url && v.level.includes(n));
