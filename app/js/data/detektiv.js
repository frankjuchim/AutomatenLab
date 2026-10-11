// Fälle für den Sprach-Detektiv (#/detektiv?fall=n).
//
// So ergänzt du einen Fall:
//   titel       kurzer Name des Falls (verrät nicht die Lösung!)
//   automat     DEA im Engine-Format (siehe ARCHITECTURE.md)
//   optionen    genau 4 Sprachbeschreibungen; die ERSTE ist richtig (die App mischt die Reihenfolge).
//               pruefe(w) bekommt das Wort als Array von Symbolen und liefert true, wenn w zur beschriebenen
//               Sprache gehört. Daraus berechnet die App bei falscher Wahl ein Gegenbeispiel.
//   bedeutung   Bedeutung der Zustände – wird nach dem Lösen gezeigt (Abi: „Bedeutung der Zustände erläutern“)
//   vorschlaege Testwörter, die als Schnellwahl angeboten werden
// Die Tests (tests/data.test.js) prüfen automatisch: richtige Option = Sprache des Automaten,
// jede falsche Option unterscheidet sich durch ein kurzes Wort.

const count = (w, s) => w.filter((x) => x === s).length;
const str = (w) => w.join('');

export const DETEKTIV_FAELLE = [
  {
    titel: 'Der Schlusspunkt',
    automat: { alphabet: ['a', 'b'], start: 'S0', accepting: ['S1'], delta: { S0: { a: 'S0', b: 'S1' }, S1: { a: 'S0', b: 'S1' } } },
    optionen: [
      { text: 'Alle Wörter, die auf b enden.', pruefe: (w) => w.at(-1) === 'b' },
      { text: 'Alle Wörter, die mindestens ein b enthalten.', pruefe: (w) => w.includes('b') },
      { text: 'Alle Wörter, die mit b beginnen.', pruefe: (w) => w[0] === 'b' },
      { text: 'Alle Wörter mit genau einem b.', pruefe: (w) => count(w, 'b') === 1 },
    ],
    bedeutung: { S0: 'das zuletzt gelesene Zeichen war kein b (oder es wurde noch nichts gelesen)', S1: 'das zuletzt gelesene Zeichen war b' },
    vorschlaege: ['ε', 'b', 'ab', 'ba', 'bab'],
  },
  {
    titel: 'Der erste Eindruck',
    automat: { alphabet: ['a', 'b'], start: 'S0', accepting: ['S1'], delta: { S0: { a: 'S1', b: 'S2' }, S1: { 'a, b': 'S1' }, S2: { 'a, b': 'S2' } } },
    optionen: [
      { text: 'Alle Wörter, die mit a beginnen.', pruefe: (w) => w[0] === 'a' },
      { text: 'Alle Wörter, die auf a enden.', pruefe: (w) => w.at(-1) === 'a' },
      { text: 'Alle Wörter, die mindestens ein a enthalten.', pruefe: (w) => w.includes('a') },
      { text: 'Alle Wörter mit mehr a als b.', pruefe: (w) => count(w, 'a') > count(w, 'b') },
    ],
    bedeutung: { S0: 'noch nichts gelesen', S1: 'das erste Zeichen war a – egal, was folgt', S2: 'das erste Zeichen war b – das Wort kann nicht mehr akzeptiert werden (Fehlerzustand)' },
    vorschlaege: ['ε', 'a', 'ba', 'abb', 'bba'],
  },
  {
    titel: 'Der Pendler',
    automat: { alphabet: ['a', 'b'], start: 'S0', accepting: ['S0'], delta: { S0: { a: 'S1', b: 'S0' }, S1: { a: 'S0', b: 'S1' } } },
    optionen: [
      { text: 'Alle Wörter mit einer geraden Anzahl a.', pruefe: (w) => count(w, 'a') % 2 === 0 },
      { text: 'Alle Wörter mit gerader Länge.', pruefe: (w) => w.length % 2 === 0 },
      { text: 'Alle Wörter mit einer geraden Anzahl b.', pruefe: (w) => count(w, 'b') % 2 === 0 },
      { text: 'Alle Wörter mit gleich vielen a und b.', pruefe: (w) => count(w, 'a') === count(w, 'b') },
    ],
    bedeutung: { S0: 'bisher gerade Anzahl a gelesen', S1: 'bisher ungerade Anzahl a gelesen' },
    vorschlaege: ['ε', 'a', 'aa', 'ab', 'bab'],
  },
  {
    titel: 'Die Spur',
    automat: { alphabet: ['a', 'b'], start: 'S0', accepting: ['S2'], delta: { S0: { a: 'S1', b: 'S0' }, S1: { a: 'S1', b: 'S2' }, S2: { 'a, b': 'S2' } } },
    optionen: [
      { text: 'Alle Wörter, die das Teilwort „ab“ enthalten.', pruefe: (w) => str(w).includes('ab') },
      { text: 'Alle Wörter, die auf „ab“ enden.', pruefe: (w) => str(w).endsWith('ab') },
      { text: 'Alle Wörter, die mit a beginnen und ein b enthalten.', pruefe: (w) => w[0] === 'a' && w.includes('b') },
      { text: 'Alle Wörter, die sowohl a als auch b enthalten.', pruefe: (w) => w.includes('a') && w.includes('b') },
    ],
    bedeutung: { S0: 'noch kein a gelesen, auf das ein b folgen könnte', S1: 'zuletzt a gelesen – ein b würde „ab“ vervollständigen', S2: '„ab“ wurde gefunden' },
    vorschlaege: ['ab', 'ba', 'aba', 'bba', 'bab'],
  },
  {
    titel: 'Der Dreitakt',
    automat: { alphabet: ['0', '1'], start: 'S0', accepting: ['S0'], delta: { S0: { '0, 1': 'S1' }, S1: { '0, 1': 'S2' }, S2: { '0, 1': 'S0' } } },
    optionen: [
      { text: 'Alle Bitfolgen, deren Länge durch 3 teilbar ist.', pruefe: (w) => w.length % 3 === 0 },
      { text: 'Alle Bitfolgen, deren Anzahl an Einsen durch 3 teilbar ist.', pruefe: (w) => count(w, '1') % 3 === 0 },
      { text: 'Alle Bitfolgen, deren Binärwert durch 3 teilbar ist.', pruefe: (w) => (w.length ? parseInt(str(w), 2) : 0) % 3 === 0 },
      { text: 'Alle Bitfolgen ungerader Länge.', pruefe: (w) => w.length % 2 === 1 },
    ],
    bedeutung: { S0: 'Länge ≡ 0 (mod 3)', S1: 'Länge ≡ 1 (mod 3)', S2: 'Länge ≡ 2 (mod 3)' },
    vorschlaege: ['ε', '000', '111', '11', '1001'],
  },
  {
    titel: 'Abstand halten',
    automat: { alphabet: ['a', 'b'], start: 'S0', accepting: ['S0', 'S1'], implicitError: true, delta: { S0: { a: 'S1', b: 'S0' }, S1: { b: 'S0' } } },
    optionen: [
      { text: 'Alle Wörter, in denen nie zwei a direkt hintereinander stehen.', pruefe: (w) => !str(w).includes('aa') },
      { text: 'Alle Wörter mit höchstens einem a.', pruefe: (w) => count(w, 'a') <= 1 },
      { text: 'Alle Wörter, in denen auf jedes a direkt ein b folgt.', pruefe: (w) => /^(b|ab)*$/.test(str(w)) },
      { text: 'Alle Wörter mit einer geraden Anzahl a.', pruefe: (w) => count(w, 'a') % 2 === 0 },
    ],
    bedeutung: { S0: 'zuletzt kein a gelesen', S1: 'zuletzt ein a gelesen – ein weiteres a führt in den Fehlerzustand' },
    vorschlaege: ['a', 'aa', 'aba', 'baab', 'abab'],
  },
  {
    titel: 'Das Paar',
    automat: { alphabet: ['a', 'b'], start: 'S0', accepting: ['S2'], implicitError: true, delta: { S0: { a: 'S1', b: 'S0' }, S1: { a: 'S2', b: 'S1' }, S2: { b: 'S2' } } },
    optionen: [
      { text: 'Alle Wörter mit genau zwei a.', pruefe: (w) => count(w, 'a') === 2 },
      { text: 'Alle Wörter mit mindestens zwei a.', pruefe: (w) => count(w, 'a') >= 2 },
      { text: 'Alle Wörter mit höchstens zwei a.', pruefe: (w) => count(w, 'a') <= 2 },
      { text: 'Alle Wörter, die das Teilwort „aa“ enthalten.', pruefe: (w) => str(w).includes('aa') },
    ],
    bedeutung: { S0: 'noch kein a gelesen', S1: 'genau ein a gelesen', S2: 'genau zwei a gelesen – ein drittes a führt in den Fehlerzustand' },
    vorschlaege: ['aa', 'aba', 'aaa', 'baab', 'abab'],
  },
  {
    titel: 'Spiegelbild?',
    automat: { alphabet: ['a', 'b'], start: 'S0', accepting: ['S1', 'S3'], delta: { S0: { a: 'S1', b: 'S3' }, S1: { a: 'S1', b: 'S2' }, S2: { a: 'S1', b: 'S2' }, S3: { a: 'S4', b: 'S3' }, S4: { a: 'S4', b: 'S3' } } },
    optionen: [
      { text: 'Alle nichtleeren Wörter, die mit demselben Zeichen beginnen und enden.', pruefe: (w) => w.length > 0 && w[0] === w.at(-1) },
      { text: 'Alle Palindrome (vorwärts wie rückwärts gleich).', pruefe: (w) => str(w) === [...w].reverse().join('') },
      { text: 'Alle Wörter, die mit a beginnen und mit a enden.', pruefe: (w) => w[0] === 'a' && w.at(-1) === 'a' },
      { text: 'Alle Wörter ungerader Länge.', pruefe: (w) => w.length % 2 === 1 },
    ],
    bedeutung: { S0: 'noch nichts gelesen', S1: 'begann mit a, zuletzt a', S2: 'begann mit a, zuletzt b', S3: 'begann mit b, zuletzt b', S4: 'begann mit b, zuletzt a' },
    vorschlaege: ['a', 'ab', 'aba', 'abba', 'aaba'],
  },
  {
    titel: 'Gemischtes Doppel',
    automat: { alphabet: ['a', 'b'], start: 'S0', accepting: ['S3'], delta: { S0: { a: 'S1', b: 'S2' }, S1: { a: 'S1', b: 'S3' }, S2: { a: 'S3', b: 'S2' }, S3: { 'a, b': 'S3' } } },
    optionen: [
      { text: 'Alle Wörter, die mindestens ein a und mindestens ein b enthalten.', pruefe: (w) => w.includes('a') && w.includes('b') },
      { text: 'Alle Wörter, die das Teilwort „ab“ enthalten.', pruefe: (w) => str(w).includes('ab') },
      { text: 'Alle Wörter mit mindestens zwei Zeichen.', pruefe: (w) => w.length >= 2 },
      { text: 'Alle Wörter, die mit a beginnen und auf b enden.', pruefe: (w) => w[0] === 'a' && w.at(-1) === 'b' },
    ],
    bedeutung: { S0: 'noch nichts gelesen', S1: 'bisher nur a', S2: 'bisher nur b', S3: 'a und b kamen beide vor' },
    vorschlaege: ['ab', 'ba', 'aa', 'bba', 'aab'],
  },
  {
    titel: 'Der Begleitschutz',
    automat: { alphabet: ['a', 'b'], start: 'S0', accepting: ['S0'], implicitError: true, delta: { S0: { a: 'S1', b: 'S0' }, S1: { b: 'S0' } } },
    optionen: [
      { text: 'Alle Wörter, in denen auf jedes a direkt ein b folgt.', pruefe: (w) => /^(b|ab)*$/.test(str(w)) },
      { text: 'Alle Wörter, in denen nie zwei a direkt hintereinander stehen.', pruefe: (w) => !str(w).includes('aa') },
      { text: 'Alle Wörter, die auf b enden.', pruefe: (w) => w.at(-1) === 'b' },
      { text: 'Alle Wörter mit höchstens so vielen a wie b.', pruefe: (w) => count(w, 'a') <= count(w, 'b') },
    ],
    bedeutung: { S0: 'jedes bisher gelesene a wurde von einem b „begleitet“', S1: 'ein a wartet noch auf sein b' },
    vorschlaege: ['ε', 'a', 'ab', 'ba', 'abb'],
  },
  {
    titel: 'Der Rechenkünstler',
    automat: { alphabet: ['0', '1'], start: 'S0', accepting: ['S0'], delta: { S0: { 0: 'S0', 1: 'S1' }, S1: { 0: 'S2', 1: 'S0' }, S2: { 0: 'S1', 1: 'S2' } } },
    optionen: [
      { text: 'Alle Binärzahlen, deren Wert durch 3 teilbar ist (ε zählt als 0).', pruefe: (w) => (w.length ? parseInt(str(w), 2) : 0) % 3 === 0 },
      { text: 'Alle Bitfolgen mit einer geraden Anzahl an Einsen.', pruefe: (w) => count(w, '1') % 2 === 0 },
      { text: 'Alle Bitfolgen, deren Länge durch 3 teilbar ist.', pruefe: (w) => w.length % 3 === 0 },
      { text: 'Alle geraden Binärzahlen (ε zählt als 0).', pruefe: (w) => w.length === 0 || w.at(-1) === '0' },
    ],
    bedeutung: { S0: 'Wert der bisher gelesenen Binärzahl ≡ 0 (mod 3)', S1: 'Wert ≡ 1 (mod 3)', S2: 'Wert ≡ 2 (mod 3)' },
    vorschlaege: ['11', '110', '101', '1001', '1111'],
  },
  {
    titel: 'Vier Ecken',
    automat: { alphabet: ['a', 'b'], start: 'S0', accepting: ['S1'],
      delta: { S0: { a: 'S2', b: 'S1' }, S1: { a: 'S3', b: 'S0' }, S2: { a: 'S0', b: 'S3' }, S3: { a: 'S1', b: 'S2' } } },
    optionen: [
      { text: 'Alle Wörter mit gerader Anzahl a und ungerader Anzahl b.', pruefe: (w) => count(w, 'a') % 2 === 0 && count(w, 'b') % 2 === 1 },
      { text: 'Alle Wörter mit gerader Anzahl a oder ungerader Anzahl b.', pruefe: (w) => count(w, 'a') % 2 === 0 || count(w, 'b') % 2 === 1 },
      { text: 'Alle Wörter ungerader Länge.', pruefe: (w) => w.length % 2 === 1 },
      { text: 'Alle Wörter mit gerader Anzahl a, die auf b enden.', pruefe: (w) => count(w, 'a') % 2 === 0 && w.at(-1) === 'b' },
    ],
    bedeutung: { S0: 'a gerade, b gerade', S1: 'a gerade, b ungerade', S2: 'a ungerade, b gerade', S3: 'a ungerade, b ungerade' },
    vorschlaege: ['b', 'bab', 'aab', 'ba', 'bbb'],
  },
];
