// Modul-Register: Hier wird jedes Modul der App eingetragen.
// • route   – Hash-Route (#/<route>), auch für QR-Codes
// • world   – Welt, in der das Modul auf der Übersicht erscheint ('A'–'D' oder null = welt-übergreifend)
// • levels  – Level (Doppelstunden), in denen das Modul eingesetzt wird (alle 16 → Kachel zeigt „Alle Level“)
// • load    – Funktion, die das Modul lazy lädt (default-Export = Modulobjekt, siehe ARCHITECTURE.md)
//             null → Kachel „bald verfügbar“
// Neues Modul: Datei js/modules/<route>.js anlegen und hier `load: () => import('./<route>.js')` setzen.

export const MODULES = [
  { route: 'arena', title: 'Akzeptor-Arena', world: 'A', levels: [1, 2],
    blurb: 'Wort lesen, Graph verfolgen, schnell entscheiden: akzeptiert oder abgelehnt?',
    load: () => import('./arena.js') },
  { route: 'detektiv', title: 'Sprach-Detektiv', world: 'A', levels: [2],
    blurb: 'Teste einen unbekannten Automaten mit eigenen Wörtern und finde heraus, welche Sprache er erkennt.',
    load: () => import('./detektiv.js') },
  { route: 'baukasten', title: 'Automaten-Baukasten', world: 'A', levels: [3, 4, 12],
    blurb: 'Baue DEAs in der Übergangstabelle. Beim Prüfen bekommst du das kürzeste Gegenbeispiel.',
    load: () => import('./baukasten.js') },
  { route: 'minimierer', title: 'Minimierer', world: 'A', levels: [5],
    blurb: 'Markierungsverfahren Schritt für Schritt und das Spiel „Unterscheide!“.',
    load: () => import('./minimierer.js') },
  { route: 'mealy', title: 'Mealy-Maschine', world: 'A', levels: [6],
    blurb: 'Automaten mit Ausgabe simulieren und fehlerhafte Übersetzer reparieren.',
    load: () => import('./mealy.js') },
  { route: 'ueberliste', title: 'Überliste den Automaten', world: 'B', levels: [7],
    blurb: 'Finde das Wort, an dem ein endlicher Automat für aⁿbⁿ scheitern muss.', load: () => import('./ueberliste.js') },
  { route: 'parallelwelten', title: 'Parallelwelten', world: 'B', levels: [8],
    blurb: 'NEA simulieren: Welche Zustände sind gerade gleichzeitig aktiv?',
    load: () => import('./parallelwelten.js') },
  { route: 'keller', title: 'Keller-Labor', world: 'B', levels: [9, 10],
    blurb: 'Kellerautomaten Schritt für Schritt und Verarbeitungstabellen im Abi-Format.',
    load: () => import('./keller.js') },
  { route: 'rallye', title: 'Ableitungs-Rallye', world: 'C', levels: [11, 13],
    blurb: 'Leite Wörter ab, indem du Regeln wählst – mit Ableitungsbaum.', load: () => import('./rallye.js') },
  { route: 'grammatik', title: 'Grammatik-Tester', world: 'C', levels: [12, 13, 15],
    blurb: 'Eigene Grammatik eingeben, Wörter erzeugen und prüfen.', load: () => import('./grammatik.js') },
  { route: 'sortierer', title: 'Chomsky-Sortierer', world: 'C', levels: [14],
    blurb: 'Ordne Sprachen der passenden Maschine und Grammatik zu.', load: () => import('./sortierer.js') },
  { route: 'turing', title: 'Turing-Labor', world: 'D', levels: [16],
    blurb: 'Band, Schreib-Lese-Kopf und die Grenzen des Berechenbaren.', load: () => import('./turing.js') },
  { route: 'quiz', title: 'Level-Quiz', world: null, levels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
    blurb: 'Exit-Tickets zu jeder Welt – kurz, knapp, abiturnah.', load: () => import('./quiz.js') },
];

export const findModule = (route) => MODULES.find((m) => m.route === route);
