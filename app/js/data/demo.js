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

// Parallelwelten-Demo: ein eigener NEA mit ε-Übergängen (ODER-Baustein), für Rätsel und Teilmengenkonstruktion
const ODER = {
  id: 'demo-oder', titel: 'Beginnt mit 1 oder endet auf 0',
  kontext: 'Zwei ε-Übergänge teilen die Figur gleich am Anfang: Eine prüft „beginnt mit 1“ (S1, S2), die andere „endet auf 0“ (S3, S4).',
  automat: { alphabet: ['0', '1'], start: 'S0', accepting: ['S2', 'S4'],
    delta: { S0: { ε: ['S1', 'S3'] }, S1: { 1: 'S2' }, S2: { '0, 1': 'S2' }, S3: { '0, 1': 'S3', 0: 'S4' }, S4: {} } },
  beispiele: { ja: ['1', '10', '0', '110', '0010'], nein: ['ε', '01', '011', '0111'] },
  pruefe: (w) => w[0] === '1' || w.at(-1) === '0',
  raetsel: ['ε', '1', '0', '10', '01'],
  teilmengen: true,
};
DEMO.push(
  { modul: 'parallelwelten', art: 'raetsel', id: 'demo:parallelwelten:raetsel', titel: 'Demo: Beginnt mit 1 oder endet auf 0 – Wo stehen die Figuren?', daten: ODER },
  { modul: 'parallelwelten', art: 'teilmengen', id: 'demo:parallelwelten', titel: 'Demo: Beginnt mit 1 oder endet auf 0 – Teilmengenkonstruktion', daten: ODER },
);

// Keller-Demo: ein eigener Kellerautomat aⁿ c bⁿ (n ≥ 0) für Simulator, Tabellen-Trainer und Rückwärts
const ACB = {
  id: 'demo-acb', titel: 'aⁿ c bⁿ (n ≥ 0)',
  kontext: 'Einige a, dann genau ein c als Mitte, dann genauso viele b wie a. L = {aⁿcbⁿ | n ≥ 0}, z. B. c, acb, aacbb.',
  automat: { inputAlphabet: ['a', 'b', 'c'], stackAlphabet: ['#', 'A'], states: ['S0', 'S1', 'S2'], start: 'S0', accepting: ['S2'],
    transitions: ['S0 -> S0 : (#, a) : A#', 'S0 -> S0 : (A, a) : AA', 'S0 -> S1 : (#, c) : #', 'S0 -> S1 : (A, c) : A', 'S1 -> S1 : (A, b) : ε', 'S1 -> S2 : (#, ε) : #'] },
  pruefe: (w) => { const s = w.join(''); const m = /^(a*)c(b*)$/.exec(s); return !!m && m[1].length === m[2].length; },
  beispiele: { ja: ['c', 'acb', 'aacbb'], nein: ['ε', 'ab', 'acbb', 'aacb', 'cb'] },
  keller: 'Für jedes a liegt ein A im Keller. Das c wechselt nur den Zustand. Jedes b entfernt ein A; liegt danach wieder # oben, waren es gleich viele.',
  sim: ['aacbb', 'acbb', 'c'], tabelle: ['acb', 'aacb'], rueckwaerts: ['aacbb'],
};
DEMO.push(
  { modul: 'keller', art: 'tabelle', id: 'demo:keller:tabelle', titel: 'Demo: aⁿ c bⁿ – Tabellen-Trainer', daten: ACB },
  { modul: 'keller', art: 'rueckwaerts', id: 'demo:keller:rueckwaerts', titel: 'Demo: aⁿ c bⁿ – Rückwärts', daten: ACB },
);

// Rallye-Demo: eine eigene kleine Grammatik (Binärzahlen ohne führende Null)
DEMO.push({
  modul: 'rallye', id: 'demo:rallye', titel: 'Demo: Binärzahlen ohne führende Null',
  daten: {
    id: 'demo-binaer', stufe: 1, titel: 'Binärzahlen ohne führende Null',
    kontext: 'Die Grammatik erzeugt alle Binärzahlen ohne führende Null: 0 allein oder eine 1 mit beliebigen weiteren Ziffern.',
    grammatik: 'S → 1A | 0\nA → 0A | 1A | ε', ziel: '101',
  },
});

// Grammatik-Demo: eine eigene rechtsreguläre Challenge
DEMO.push({
  modul: 'grammatik', id: 'demo:grammatik', titel: 'Demo: Beginnt mit a',
  daten: {
    id: 'demo-beginnt-a', stufe: 2, titel: 'Beginnt mit a',
    aufgabe: 'Entwirf eine rechtsreguläre Grammatik für alle Wörter über Σ = {a, b}, die mit a beginnen.',
    alphabet: ['a', 'b'], regulaer: true, maxLen: 8,
    pruefe: (w) => w[0] === 'a',
    beispiele: { ja: ['a', 'ab', 'aba', 'abbb'], nein: ['ε', 'b', 'ba', 'bab'] },
    tipp: 'Die erste Regel legt das a fest; danach darf ein zweites Nichtterminal beliebig viele a und b erzeugen – und mit ε aufhören.',
    musterloesung: 'S → aA\nA → aA | bA | ε',
  },
});

// Turing-Demo: Challenge am Fleißigen Biber (2 Zustände) – eine Regel fehlt
DEMO.push({
  modul: 'turing', id: 'demo:turing', titel: 'Demo: Fleißiger Biber – die fehlende Regel',
  daten: {
    id: 'demo-biber', stufe: 1, titel: 'Fleißiger Biber: die fehlende Regel', programm: 'biber-2',
    fehlt: { from: 'B', read: '□' },
    aufgabe: 'Beim Fleißigen Biber mit zwei Zuständen fehlt die Regel für B, wenn ein leeres Feld (□) gelesen wird. Die fertige Maschine schreibt auf leerem Band vier Einsen und hält.',
    tests: [''],
  },
});
