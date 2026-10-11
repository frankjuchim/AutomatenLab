// Automaten für die Akzeptor-Arena (#/arena).
//
// So ergänzt du einen Automaten:
//   id          eindeutiger Kurzname (ohne Leerzeichen)
//   titel       Kontext-Titel, der über dem Graphen steht
//   kontext     ein Satz zur Sprache (wird in der Auswertung gezeigt)
//   level       in welchen Arena-Stufen der Automat vorkommt (1 = Basis, 2 = Standard, 3 = Profi)
//   automat     DEA im Engine-Format (siehe ARCHITECTURE.md). Schlüssel wie 'a, b' fassen Symbole zusammen.
//               implicitError: true → fehlende Übergänge führen in einen Fehlerzustand (Hinweis wird angezeigt)
//   bedeutung   optional: Bedeutung der Zustände (wird bei „Zeig mir warum“ eingeblendet)
//   beispiele   je einige Wörter, die akzeptiert (ja) bzw. abgelehnt (nein) werden – werden automatisch getestet
//
// Mehrstellige Symbole (z. B. Münzen „10“, „20“) sind erlaubt; Wörter werden dann mit Leerzeichen notiert.

export const ARENA_LEVELS = {
  1: { titel: 'Level 1', text: 'Kurze Wörter, übersichtliche Automaten', laenge: [1, 5] },
  2: { titel: 'Level 2', text: 'Längere Wörter, Rückkanten im Graphen', laenge: [2, 7] },
  3: { titel: 'Level 3', text: 'Bis zu acht Zustände, lange Wörter', laenge: [3, 9] },
};

export const ARENA_AUTOMATEN = [
  {
    id: 'kaffee', titel: 'Kaffeeautomat (40 ct)', level: [1],
    kontext: 'Ein Kaffee kostet 40 ct. Bezahlt wird mit 10- und 20-ct-Münzen; akzeptiert wird, wenn genau passend bezahlt wurde.',
    automat: { alphabet: ['10', '20'], start: 'S0', accepting: ['S4'], implicitError: true,
      delta: { S0: { 10: 'S1', 20: 'S2' }, S1: { 10: 'S2', 20: 'S3' }, S2: { 10: 'S3', 20: 'S4' }, S3: { 10: 'S4' }, S4: {} } },
    bedeutung: { S0: '0 ct eingeworfen', S1: '10 ct eingeworfen', S2: '20 ct eingeworfen', S3: '30 ct eingeworfen', S4: 'genau 40 ct – Kaffee!' },
    beispiele: { ja: ['20 20', '10 10 20', '10 10 10 10', '10 20 10'], nein: ['ε', '20', '20 20 10', '10 10 10'] },
  },
  {
    id: 'barcode', titel: 'Barcode-Startzeichen 110', level: [1],
    kontext: 'Ein gültiger Barcode beginnt mit dem Startzeichen 110; danach dürfen beliebige Bits folgen.',
    automat: { alphabet: ['0', '1'], start: 'S0', accepting: ['S3'], implicitError: true,
      delta: { S0: { 1: 'S1' }, S1: { 1: 'S2' }, S2: { 0: 'S3' }, S3: { '0, 1': 'S3' } } },
    bedeutung: { S0: 'noch nichts gelesen', S1: '„1“ gelesen', S2: '„11“ gelesen', S3: 'Startzeichen 110 vollständig' },
    beispiele: { ja: ['110', '1100', '110101'], nein: ['ε', '11', '011', '1010', '111'] },
  },
  {
    id: 'gerade-a', titel: 'Gerade Anzahl a', level: [1],
    kontext: 'Akzeptiert werden alle Wörter über {a, b} mit einer geraden Anzahl a (0 zählt als gerade).',
    automat: { alphabet: ['a', 'b'], start: 'S0', accepting: ['S0'],
      delta: { S0: { a: 'S1', b: 'S0' }, S1: { a: 'S0', b: 'S1' } } },
    bedeutung: { S0: 'bisher gerade Anzahl a', S1: 'bisher ungerade Anzahl a' },
    beispiele: { ja: ['ε', 'b', 'aa', 'abab', 'baab'], nein: ['a', 'ab', 'aaa', 'babaa' ] },
  },
  {
    id: 'mind-zwei-b', titel: 'Mindestens zwei b', level: [1],
    kontext: 'Akzeptiert werden alle Wörter über {a, b}, in denen mindestens zwei b vorkommen.',
    automat: { alphabet: ['a', 'b'], start: 'S0', accepting: ['S2'],
      delta: { S0: { a: 'S0', b: 'S1' }, S1: { a: 'S1', b: 'S2' }, S2: { 'a, b': 'S2' } } },
    bedeutung: { S0: 'noch kein b', S1: 'genau ein b', S2: 'mindestens zwei b' },
    beispiele: { ja: ['bb', 'abab', 'bbb', 'aabab'], nein: ['ε', 'b', 'aaba', 'aaa'] },
  },
  {
    id: 'lol', titel: 'LOL-Erkenner', level: [2],
    kontext: 'Ein Chatfilter erkennt Nachrichten, die „LOL“ enthalten. X steht für jedes andere Zeichen.',
    automat: { alphabet: ['L', 'O', 'X'], start: 'S0', accepting: ['S3'],
      delta: { S0: { L: 'S1', 'O, X': 'S0' }, S1: { L: 'S1', O: 'S2', X: 'S0' }, S2: { L: 'S3', 'O, X': 'S0' }, S3: { 'L, O, X': 'S3' } } },
    bedeutung: { S0: 'kein Anfang von LOL in Sicht', S1: 'zuletzt „L“ gelesen', S2: 'zuletzt „LO“ gelesen', S3: '„LOL“ gefunden' },
    beispiele: { ja: ['LOL', 'XLOLX', 'LLOL', 'LOLOL'], nein: ['ε', 'LOOL', 'OLLO', 'LOXL', 'LO'] },
  },
  {
    id: 'endet-ab', titel: 'Endet auf ab', level: [2],
    kontext: 'Akzeptiert werden alle Wörter über {a, b}, die auf „ab“ enden.',
    automat: { alphabet: ['a', 'b'], start: 'S0', accepting: ['S2'],
      delta: { S0: { a: 'S1', b: 'S0' }, S1: { a: 'S1', b: 'S2' }, S2: { a: 'S1', b: 'S0' } } },
    bedeutung: { S0: 'Ende passt nicht zu „ab“', S1: 'zuletzt „a“ gelesen', S2: 'zuletzt „ab“ gelesen' },
    beispiele: { ja: ['ab', 'aab', 'bab', 'abab'], nein: ['ε', 'a', 'ba', 'abb', 'aba'] },
  },
  {
    id: 'quersumme', titel: 'Quersumme gerade', level: [2],
    kontext: 'Eine Ziffernfolge aus 1, 2 und 3 wird akzeptiert, wenn ihre Quersumme gerade ist.',
    automat: { alphabet: ['1', '2', '3'], start: 'S0', accepting: ['S0'],
      delta: { S0: { '1, 3': 'S1', 2: 'S0' }, S1: { '1, 3': 'S0', 2: 'S1' } } },
    bedeutung: { S0: 'Quersumme bisher gerade', S1: 'Quersumme bisher ungerade' },
    beispiele: { ja: ['ε', '2', '13', '1122', '333 3'], nein: ['1', '3', '12', '222 1'] },
  },
  {
    id: 'kein-aa', titel: 'Kein „aa“', level: [2],
    kontext: 'Akzeptiert werden alle Wörter über {a, b}, in denen nie zwei a direkt hintereinander stehen.',
    automat: { alphabet: ['a', 'b'], start: 'S0', accepting: ['S0', 'S1'], implicitError: true,
      delta: { S0: { a: 'S1', b: 'S0' }, S1: { b: 'S0' } } },
    bedeutung: { S0: 'zuletzt kein a gelesen', S1: 'zuletzt ein a gelesen' },
    beispiele: { ja: ['ε', 'a', 'abab', 'bab', 'babba'], nein: ['aa', 'baab', 'abaa'] },
  },
  {
    id: 'konsole', titel: 'Spielekonsolen-Code', level: [3],
    kontext: 'Tasten A, B (blau) und X, O (rot), Abschluss mit E. Gültig: A oder X kommt vor, beide Farben kommen vor, der Code endet mit E (nach Abitur 2024).',
    automat: { alphabet: ['A', 'B', 'X', 'O', 'E'], start: 'S0', accepting: ['S7'], implicitError: true,
      delta: {
        S0: { A: 'S3', B: 'S1', X: 'S4', O: 'S2' },
        S1: { A: 'S3', B: 'S1', X: 'S6', O: 'S5' },
        S2: { A: 'S6', B: 'S5', X: 'S4', O: 'S2' },
        S3: { 'A, B': 'S3', 'X, O': 'S6' },
        S4: { 'A, B': 'S6', 'X, O': 'S4' },
        S5: { 'A, X': 'S6', 'B, O': 'S5' },
        S6: { 'A, B, X, O': 'S6', E: 'S7' },
        S7: {},
      } },
    bedeutung: { S0: 'noch keine Taste', S1: 'nur B gedrückt (blau, ohne A/X)', S2: 'nur O gedrückt (rot, ohne A/X)', S3: 'A dabei, aber noch kein Rot', S4: 'X dabei, aber noch kein Blau', S5: 'Blau und Rot, aber weder A noch X', S6: 'alle Regeln erfüllt – fehlt nur E', S7: 'gültiger Code' },
    beispiele: { ja: ['AAXOE', 'AOE', 'XBE', 'BOAE'], nein: ['BOBOE', 'AAE', 'AXO', 'E', 'AXEE'] },
  },
  {
    id: 'anfang-ende', titel: 'Anfang = Ende', level: [3],
    kontext: 'Akzeptiert werden alle nichtleeren Wörter über {a, b}, die mit demselben Zeichen beginnen und enden.',
    automat: { alphabet: ['a', 'b'], start: 'S0', accepting: ['S1', 'S3'],
      delta: { S0: { a: 'S1', b: 'S3' }, S1: { a: 'S1', b: 'S2' }, S2: { a: 'S1', b: 'S2' }, S3: { a: 'S4', b: 'S3' }, S4: { a: 'S4', b: 'S3' } } },
    bedeutung: { S0: 'noch nichts gelesen', S1: 'beginnt mit a, endet (bisher) auf a', S2: 'beginnt mit a, endet (bisher) auf b', S3: 'beginnt mit b, endet (bisher) auf b', S4: 'beginnt mit b, endet (bisher) auf a' },
    beispiele: { ja: ['a', 'b', 'aba', 'bab', 'abba'], nein: ['ε', 'ab', 'ba', 'aab', 'bba'] },
  },
  {
    id: 'a-mod-3', titel: 'Anzahl a durch 3 teilbar', level: [3],
    kontext: 'Akzeptiert werden alle Wörter über {a, b}, deren Anzahl a durch 3 teilbar ist (auch 0).',
    automat: { alphabet: ['a', 'b'], start: 'S0', accepting: ['S0'],
      delta: { S0: { a: 'S1', b: 'S0' }, S1: { a: 'S2', b: 'S1' }, S2: { a: 'S0', b: 'S2' } } },
    bedeutung: { S0: 'Anzahl a ≡ 0 (mod 3)', S1: 'Anzahl a ≡ 1 (mod 3)', S2: 'Anzahl a ≡ 2 (mod 3)' },
    beispiele: { ja: ['ε', 'aaa', 'babaa', 'bbb', 'aaaaaa'], nein: ['a', 'aa', 'abab', 'aaaa'] },
  },
  {
    id: 'binaer-3', titel: 'Binärzahl durch 3 teilbar', level: [3],
    kontext: 'Gelesen wird eine Binärzahl (höchstwertiges Bit zuerst). Akzeptiert, wenn ihr Wert durch 3 teilbar ist; ε zählt als 0.',
    automat: { alphabet: ['0', '1'], start: 'S0', accepting: ['S0'],
      delta: { S0: { 0: 'S0', 1: 'S1' }, S1: { 0: 'S2', 1: 'S0' }, S2: { 0: 'S1', 1: 'S2' } } },
    bedeutung: { S0: 'bisheriger Wert ≡ 0 (mod 3)', S1: 'bisheriger Wert ≡ 1 (mod 3)', S2: 'bisheriger Wert ≡ 2 (mod 3)' },
    beispiele: { ja: ['ε', '0', '11', '110', '1001'], nein: ['1', '10', '100', '111'] },
  },
  {
    id: 'tresor', titel: 'Tresor 4-2-0-0', level: [3],
    kontext: 'Der Tresor öffnet, wenn die eingetippte Ziffernfolge auf 4200 endet – egal, was vorher getippt wurde.',
    automat: { alphabet: ['0', '2', '4'], start: 'S0', accepting: ['S4'],
      delta: { S0: { 4: 'S1', '0, 2': 'S0' }, S1: { 4: 'S1', 2: 'S2', 0: 'S0' }, S2: { 0: 'S3', 4: 'S1', 2: 'S0' }, S3: { 0: 'S4', 4: 'S1', 2: 'S0' }, S4: { 4: 'S1', '0, 2': 'S0' } } },
    bedeutung: { S0: 'kein passender Anfang', S1: 'zuletzt „4“', S2: 'zuletzt „42“', S3: 'zuletzt „420“', S4: 'zuletzt „4200“ – offen' },
    beispiele: { ja: ['4200', '44200', '24200', '42004200'], nein: ['ε', '420', '42000', '4020', '42400'] },
  },
];
