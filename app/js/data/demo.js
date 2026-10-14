// Demo-Aufgaben für den Gastmodus (#/gast, Vertrag InfoLabs §4/§9): eigene Aufgaben zum Ausprobieren, im Browser
// geprüft (app/js/engine/pruefer.js), ohne Punkte und ohne Speicherung auf dem Server. Sie gehören NICHT zum
// Aufgabenkatalog – echte Aufgaben und ihre Lösungen liegen nur auf dem Server (inhalte/).
// Notation nach docs/einheit/PLAN.md Abschnitt 1. Tests: app/tests/demo.test.js (gegen die Engine).
//
// Format wie in inhalte/: modul, id (Präfix „demo:“), titel, daten (Quiz: fragen; Detektiv: Fall; Baukasten: Challenge;
// Minimierer: Aufgabe mit Automat; Mealy: Automat mit vorhersage und fehler, art = vorhersage | bugjagd).

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
  {
    modul: 'minimierer', id: 'demo:minimierer', titel: 'Demo: Endet auf a – doppelt gemerkt',
    daten: {
      id: 'demo-endet-a', stufe: 1, titel: 'Endet auf a – doppelt gemerkt',
      kontext: 'Der Automat akzeptiert alle Wörter über {a, b}, die auf a enden. Er unterscheidet aber, ob vor dem letzten a schon ein b kam.',
      frage: 'Bestimme mit dem Markierungsverfahren, welche Zustände zusammengefasst werden können.',
      automat: { alphabet: ['a', 'b'], start: 'S0', accepting: ['S1', 'S3'],
        delta: { S0: { a: 'S1', b: 'S2' }, S1: { a: 'S1', b: 'S2' }, S2: { a: 'S3', b: 'S2' }, S3: { a: 'S1', b: 'S2' } } },
      klassen: [['S0', 'S2'], ['S1', 'S3']],
      merke: 'Für die Sprache zählt nur das letzte Zeichen: S1 und S3 bedeuten beide „zuletzt a“, S0 und S2 „nicht auf a“. Zwei Zustände reichen.',
    },
  },
];

// Mealy-Demo: ein Automat für beide Modi („Was kommt raus?“ und Bug-Jagd)
const PARITAET = {
  id: 'demo-paritaet', stufe: 1, titel: 'Paritäts-Melder',
  kontext: 'Nach jedem gelesenen Bit meldet der Automat, ob er bisher eine gerade (G) oder ungerade (U) Anzahl Einsen gelesen hat.',
  automat: { inputAlphabet: ['0', '1'], outputAlphabet: ['G', 'U'], start: 'S0',
    delta: { S0: { 0: ['S0', 'G'], 1: ['S1', 'U'] }, S1: { 0: ['S1', 'U'], 1: ['S0', 'G'] } } },
  bedeutung: { S0: 'bisher gerade Anzahl Einsen', S1: 'bisher ungerade Anzahl Einsen' },
  beispiele: [['011', 'GUG'], ['1101', 'UGGU'], ['000', 'GGG'], ['10', 'UU'], ['', 'ε']],
  vorhersage: ['011', '1101', '100'],
  fehler: [{ von: 'S1', zeichen: '0', ausgabe: 'G' }],
  fehlerText: 'Der Automat soll nach jedem Bit melden, ob bisher gerade (G) oder ungerade (U) viele Einsen gelesen wurden. Bei manchen Eingaben meldet er das Falsche.',
  pruefe: (w) => { let n = 0; return w.map((c) => { if (c === '1') n++; return n % 2 ? 'U' : 'G'; }).join(''); },
};
DEMO.push(
  { modul: 'mealy', art: 'vorhersage', id: 'demo:mealy:vorhersage', titel: 'Demo: Paritäts-Melder – Was kommt raus?', daten: PARITAET },
  { modul: 'mealy', art: 'bugjagd', id: 'demo:mealy', titel: 'Demo: Paritäts-Melder – Bug-Jagd', daten: PARITAET },
);

// Überliste-Demo: ein eigener „Kontostand“-Automat (Bilanz bis ±2, danach sättigt er)
DEMO.push({
  modul: 'ueberliste', id: 'demo:ueberliste', titel: 'Demo: Der Kontostand',
  daten: {
    id: 'demo-kontostand', stufe: 1, titel: 'Der Kontostand',
    kontext: 'Auf ein Konto wird eingezahlt (+) und abgehoben (-), immer derselbe Betrag. Der Automat behauptet zu erkennen, ob der Kontostand am Ende wieder 0 ist.',
    sprache: 'L = Wörter über {+, -} mit gleich vielen + wie -',
    automat: { alphabet: ['+', '-'], start: 'S0', accepting: ['S0'],
      delta: { M2: { '+': 'M1', '-': 'M2' }, M1: { '+': 'S0', '-': 'M2' }, S0: { '+': 'P1', '-': 'M1' }, P1: { '+': 'P2', '-': 'S0' }, P2: { '+': 'P2', '-': 'P1' } } },
    praefix: '+', fortsetzung: '-',
    pruefe: (w) => count(w, '+') === count(w, '-'),
    tipps: [
      'Der Automat hat nur fünf Zustände – der Kontostand kann aber beliebig groß werden.',
      'Lies +, ++, +++ … und lass dir den Zustand nach jedem Präfix zeigen. Wann bleibt er gleich?',
      'Konkret: Probiere +++--- (dreimal einzahlen, dreimal abheben).',
    ],
  },
});
