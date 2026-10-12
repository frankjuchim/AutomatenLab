// Demo-Aufgaben für den Gastmodus (#/gast, Vertrag InfoLabs §4/§9): eigene Aufgaben zum Ausprobieren, im Browser
// geprüft (app/js/engine/pruefer.js), ohne Punkte und ohne Speicherung auf dem Server. Sie gehören NICHT zum
// Aufgabenkatalog – echte Aufgaben und ihre Lösungen liegen nur auf dem Server (inhalte/).
// Notation nach docs/einheit/PLAN.md Abschnitt 1. Tests: app/tests/demo.test.js (gegen die Engine).
//
// Format wie in inhalte/: modul, id (Präfix „demo:“), titel, daten (Quiz: fragen; Detektiv: Fall; Baukasten: Challenge).

const count = (w, s) => w.filter((x) => x === s).length;

export const DEMO = [
  {
    modul: 'quiz', id: 'demo:quiz', titel: 'Demo-Quiz: Endliche Automaten',
    daten: {
      fragen: [
        { typ: 'mc', frage: 'Wie viele Folgezustände legt ein DEA für ein Paar (Zustand, Eingabezeichen) fest?',
          optionen: ['Genau einen', 'Beliebig viele', 'Höchstens zwei', 'Keinen, wenn der Zustand ein Endzustand ist'],
          erklaerung: 'Deterministisch heißt: Die Übergangsfunktion δ ordnet jedem Paar (Zustand, Eingabezeichen) genau einen Folgezustand zu – notfalls den Fehlerzustand.' },
        { typ: 'wf', aussage: 'Ein DEA über Σ = {a, b}, dessen Startzustand S0 zugleich Endzustand ist, akzeptiert das leere Wort ε.', wahr: true,
          begruendungen: [
            'Bei ε wird kein Zeichen gelesen: Der Automat bleibt in S0 – und S0 ist Endzustand.',
            'Falsch, ε ist kein Wort und kann deshalb nicht akzeptiert werden.',
            'Falsch, ein DEA muss mindestens ein Zeichen lesen, bevor er akzeptiert.',
          ] },
        { typ: 'zuordnung', frage: 'Ordne die Zeichen ihrer Bedeutung zu.',
          paare: [['ε', 'das leere Wort'], ['Σ', 'das Eingabealphabet'], ['δ', 'die Übergangsfunktion']] },
      ],
    },
  },
  {
    modul: 'detektiv', id: 'demo:detektiv', titel: 'Demo-Fall: Der Anfänger',
    daten: {
      titel: 'Der Anfänger',
      automat: { alphabet: ['a', 'b'], start: 'S0', accepting: ['S1'], delta: { S0: { a: 'S0', b: 'S1' }, S1: { 'a, b': 'S1' } } },
      optionen: [
        { text: 'Alle Wörter, die mindestens ein b enthalten.', pruefe: (w) => w.includes('b') },
        { text: 'Alle Wörter mit genau einem b.', pruefe: (w) => count(w, 'b') === 1 },
        { text: 'Alle Wörter, die mit b beginnen.', pruefe: (w) => w[0] === 'b' },
        { text: 'Alle Wörter, die auf b enden.', pruefe: (w) => w.at(-1) === 'b' },
      ],
      bedeutung: { S0: 'bisher wurde kein b gelesen', S1: 'mindestens ein b wurde gelesen – egal, was danach kommt' },
      vorschlaege: ['ε', 'a', 'b', 'ba', 'abb'],
    },
  },
  {
    modul: 'baukasten', id: 'demo:baukasten', titel: 'Demo-Challenge: Gerade Länge',
    daten: {
      id: 'demo-gerade-laenge', stufe: 1, titel: 'Gerade Länge',
      aufgabe: 'Entwickle einen DEA über Σ = {a, b}, der genau die Wörter mit gerader Länge akzeptiert (auch ε).',
      referenz: { alphabet: ['a', 'b'], start: 'S0', accepting: ['S0'], delta: { S0: { 'a, b': 'S1' }, S1: { 'a, b': 'S0' } } },
      beispiele: { ja: ['ε', 'ab', 'ba', 'aaaa'], nein: ['a', 'b', 'aba'] },
      tipp: 'Zwei Zustände genügen: „bisher gerade viele Zeichen gelesen“ und „bisher ungerade viele“.',
      pruefe: (w) => w.length % 2 === 0,
    },
  },
];
