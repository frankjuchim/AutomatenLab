// Ableitungs-Rallye (#/rallye): Grammatik + Zielwort, Regeln auf das linkeste Nichtterminal anwenden.
// Deep-Link: #/rallye?aufgabe=n (n = Position im Array, 1 …). Neue Aufgaben hinten anhängen.
//
//   id, titel          Kurzname
//   kontext            ein Satz zur Einordnung
//   grammatik          Text in Abi-Notation (siehe engine/grammar.js; Deklarationen N = {…}, T = {…} erlaubt)
//   ziel               Zielwort als Text (bei mehrstelligen Terminalen durch Leerzeichen getrennt)
//   modus              'ableiten' (Standard) | 'baum' (Mehrdeutigkeit: zwei verschiedene Ableitungsbäume finden)
//   sep                Trennzeichen für die Anzeige der Satzformen ('' oder ' ')
//   stufe              1 Basis, 2 Standard, 3 Profi (Punkte 10/20/30, Vertrag §9)
//
// Liegt in inhalte/ (nur Server, Vertrag InfoLabs §9): Grammatik und Zielwort kommen über die Aufgaben-API; die
// fertige Ableitung prüft und punktet der Server.

export const RALLYE_AUFGABEN = [
  {
    id: 'glal-1', titel: 'Glal-Sprache I', kontext: 'Die Glal-Sprache besteht aus den Silben la, le, lu. Jedes Wort hat drei Silben und endet auf lu.',
    grammatik: 'T = {la, le, lu}\nS → laA | leA | luA\nA → laB | leB | luB\nB → lu',
    ziel: 'le la lu', sep: ' ', stufe: 1,
  },
  {
    id: 'anbn', titel: 'aⁿbⁿ', kontext: 'Die Sprache, an der jeder endliche Automat scheitert – für eine Grammatik ist sie leicht.',
    grammatik: 'S → aSb | ab', ziel: 'aaabbb', stufe: 1,
  },
  {
    id: 'glal-2', titel: 'Glal-Sprache II', kontext: 'Dieselbe Grammatik – aber ein anderes Ziel. Achte darauf, welche Alternative wirklich zum Ziel führt.',
    grammatik: 'T = {la, le, lu}\nS → laA | leA | luA\nA → laB | leB | luB\nB → lu',
    ziel: 'lu lu lu', sep: ' ', stufe: 1,
  },
  {
    id: 'mini-deutsch', titel: 'Mini-Deutsch', kontext: 'Eine Grammatik für sehr einfache deutsche Sätze (Terminale sind ganze Wörter). Ziel: „Die Maus trinkt Schokolade.“',
    grammatik: 'N = {<Satz>, <Subjekt>, <Prädikat>, <Objekt>, <Artikel>, <Nomen>, <Verb>}\nT = {Die, Das, Der, Maus, Nilpferd, Hund, trinkt, knabbert, Schokolade, Nüsse, .}\n<Satz> → <Subjekt> <Prädikat> <Objekt> .\n<Subjekt> → <Artikel> <Nomen>\n<Artikel> → Die | Das | Der\n<Nomen> → Maus | Nilpferd | Hund\n<Prädikat> → <Verb>\n<Verb> → trinkt | knabbert\n<Objekt> → Schokolade | Nüsse',
    ziel: 'Die Maus trinkt Schokolade .', sep: ' ', stufe: 2,
  },
  {
    id: 'klammern', titel: 'Klammern', kontext: 'Korrekt geklammerte Ausdrücke: S → (S)S | ε. Ziel: (()()) – zähle deine Schritte.',
    grammatik: 'S → (S)S | ε', ziel: '(()())', stufe: 2,
  },
  {
    id: 'palindrom', titel: 'Palindrome', kontext: 'Palindrome über {0, 1}: vorwärts wie rückwärts gleich. Die Grammatik baut von außen nach innen.',
    grammatik: 'S → 0S0 | 1S1 | 0 | 1 | ε', ziel: '10101', stufe: 2,
  },
  {
    id: 'term', titel: 'Terme', kontext: 'Einfache Terme mit +, * und Klammern. Punkt vor Strich steckt in der Grammatik.',
    grammatik: 'E → E+T | T\nT → T*F | F\nF → (E) | a', ziel: 'a+a*a', stufe: 3,
  },
  {
    id: 'term-klammer', titel: 'Terme mit Klammern', kontext: 'Dieselbe Term-Grammatik, jetzt mit Klammern im Ziel.',
    grammatik: 'E → E+T | T\nT → T*F | F\nF → (E) | a', ziel: '(a+a)*a', stufe: 3,
  },
  {
    id: 'roboter', titel: 'Roboter-Befehle', kontext: 'Befehlssprache: f = vorwärts, d = drehen, s = stopp; jede Fahrt endet mit s. Ziel: ffdfs',
    grammatik: 'S → fS | dS | s', ziel: 'ffdfs', stufe: 1,
  },
  {
    id: 'anb2n', titel: 'aⁿb²ⁿ', kontext: 'Doppelt so viele b wie a. Welche Regel erzeugt pro a genau zwei b?',
    grammatik: 'S → aSbb | abb', ziel: 'aabbbb', stufe: 1,
  },
  {
    id: 'wiederholung', titel: 'Frosch-Sprache', kontext: 'Verschachtelte Wiederholungen: n(…) wiederholt die Befehle in der Klammer. Ziel: 2(h3(d))',
    grammatik: 'T = {h, d, (, ), 2, 3}\nS → BS | B\nB → h | d | 2(S) | 3(S)',
    ziel: '2(h3(d))', stufe: 3,
  },
  {
    id: 'if-then-else', titel: 'if-then-else (Baum-Modus)', modus: 'baum',
    kontext: 'Dangling else: Zu welchem if gehört das else? Finde zwei verschiedene Ableitungsbäume für dasselbe Programm.',
    grammatik: 'T = {if, then, else, p, q, a, b}\nS → a | b | V\nV → if B then S | if B then S else S\nB → p | q',
    ziel: 'if p then if q then a else b', sep: ' ', stufe: 3,
  },
  {
    id: 'term-mehrdeutig', titel: 'Mehrdeutige Terme (Baum-Modus)', modus: 'baum',
    kontext: 'Diese Term-Grammatik kennt keine Vorrangregeln. Zeige die Mehrdeutigkeit: zwei Bäume für a+a*a.',
    grammatik: 'E → E+E | E*E | (E) | a', ziel: 'a+a*a', stufe: 3,
  },
];
