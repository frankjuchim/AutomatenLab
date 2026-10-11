// NEAs für „Parallelwelten“ (#/parallelwelten, DS08 „Raten erlaubt“).
// ε ist KEIN Zeichen des Eingabealphabets – ε-Übergänge werden ohne Lesen eines Zeichens ausgeführt.
//
// So ergänzt du einen NEA (hinten anhängen, damit ?aufgabe=n-Links stabil bleiben):
//   id, titel, kontext
//   automat     NEA im Engine-Format: delta: { S0: { 'L, O, X': 'S0', L: 'S1' }, S1: { 'ε': ['S2'] } }
//   beispiele   { ja: […], nein: […] } – getestet
//   pruefe(w)   Prädikat (Wort als Symbol-Array) – Test gegen alle Wörter bis Länge ~8
//   raetsel     Wörter für „Wo stehen die Figuren?“ (kurz halten: 2–6 Zeichen)
//   teilmengen  true → Vertiefung Teilmengenkonstruktion anbieten (nur kleine Alphabete!)

export const PARALLELWELTEN = [
  {
    id: 'lol', titel: 'LOL-Suche',
    kontext: 'Ein Chatfilter sucht „LOL“ irgendwo in der Nachricht. X steht für jedes andere Zeichen. Der NEA „rät“, wo LOL beginnt: In S0 bleibt immer eine Figur zurück.',
    automat: { alphabet: ['L', 'O', 'X'], start: 'S0', accepting: ['S3'],
      delta: { S0: { 'L, O, X': 'S0', L: 'S1' }, S1: { O: 'S2' }, S2: { L: 'S3' }, S3: { 'L, O, X': 'S3' } } },
    beispiele: { ja: ['LOL', 'XLOLX', 'LLOL', 'LOLOL'], nein: ['ε', 'LOOL', 'OLLO', 'LOXL', 'LO'] },
    pruefe: (w) => w.join('').includes('LOL'),
    raetsel: ['LO', 'LLO', 'LOL', 'XLOO', 'LOLX'],
    teilmengen: true,
  },
  {
    id: 'endet-ab', titel: 'Endet auf ab',
    kontext: 'Akzeptiert werden alle Wörter über {a, b}, die auf „ab“ enden. Beim Lesen eines a rät der NEA: „Das könnte das vorletzte Zeichen sein.“',
    automat: { alphabet: ['a', 'b'], start: 'S0', accepting: ['S2'],
      delta: { S0: { 'a, b': 'S0', a: 'S1' }, S1: { b: 'S2' } } },
    beispiele: { ja: ['ab', 'aab', 'bab', 'abab'], nein: ['ε', 'a', 'ba', 'abb', 'aba'] },
    pruefe: (w) => w.length >= 2 && w.at(-2) === 'a' && w.at(-1) === 'b',
    raetsel: ['a', 'ab', 'aa', 'abb', 'bab'],
    teilmengen: true,
  },
  {
    id: 'drittletztes', titel: 'Drittletztes Zeichen ist 1',
    kontext: 'Akzeptiert werden alle Bitfolgen, deren drittletztes Zeichen eine 1 ist. Der NEA hat 4 Zustände – ein DEA braucht 8. Probiere die Teilmengenkonstruktion!',
    automat: { alphabet: ['0', '1'], start: 'S0', accepting: ['S3'],
      delta: { S0: { '0, 1': 'S0', 1: 'S1' }, S1: { '0, 1': 'S2' }, S2: { '0, 1': 'S3' } } },
    beispiele: { ja: ['100', '111', '0101', '10100'], nein: ['ε', '1', '10', '011', '0001'] },
    pruefe: (w) => w.length >= 3 && w.at(-3) === '1',
    raetsel: ['1', '10', '101', '0110', '1100'],
    teilmengen: true,
  },
  {
    id: 'gratis', titel: 'Spamfilter „GRATIS“ (Ausschnitt)',
    kontext: 'Ein Spamfilter markiert Nachrichten, die das Wort „GRATIS“ enthalten. Ausschnitt mit kleinem Alphabet: X steht für jedes andere Zeichen.',
    automat: { alphabet: ['G', 'R', 'A', 'T', 'I', 'S', 'X'], start: 'S0', accepting: ['S6'],
      delta: { S0: { 'G, R, A, T, I, S, X': 'S0', G: 'S1' }, S1: { R: 'S2' }, S2: { A: 'S3' }, S3: { T: 'S4' }, S4: { I: 'S5' }, S5: { S: 'S6' },
        S6: { 'G, R, A, T, I, S, X': 'S6' } } },
    beispiele: { ja: ['GRATIS', 'XGRATISX', 'GGRATIS', 'GRAGRATIS'], nein: ['ε', 'GRATI', 'GRAXTIS', 'SITARG', 'GRATXS'] },
    pruefe: (w) => w.join('').includes('GRATIS'),
    raetsel: ['GR', 'GRG', 'XGRA', 'GRATI', 'GGR'],
    teilmengen: false,
  },
  {
    id: 'vorzeichen', titel: 'Zahl mit optionalem Vorzeichen (ε-Übergang)',
    kontext: 'Eine Binärzahl darf mit + oder - beginnen, muss aber nicht. Der ε-Übergang von S0 nach S1 bedeutet: „Ohne ein Zeichen zu lesen, darf eine Figur nach S1 springen.“',
    automat: { alphabet: ['+', '-', '0', '1'], start: 'S0', accepting: ['S2'],
      delta: { S0: { '+, -': 'S1', ε: 'S1' }, S1: { '0, 1': 'S2' }, S2: { '0, 1': 'S2' } } },
    beispiele: { ja: ['1', '+10', '-0', '0110'], nein: ['ε', '+', '-+1', '1+', '+-'] },
    pruefe: (w) => { const s = w.join(''); return /^[+-]?[01]+$/.test(s); },
    raetsel: ['ε', '+', '1', '-1', '+0+'],
    teilmengen: true,
  },
  {
    id: 'abc', titel: 'Erst a, dann b, dann c (ε-Kette)',
    kontext: 'Akzeptiert werden Wörter der Form a…ab…bc…c – jede Gruppe darf auch fehlen (z. B. ε, ac, bbc). Mit zwei ε-Übergängen wird das ganz kurz.',
    automat: { alphabet: ['a', 'b', 'c'], start: 'S0', accepting: ['S2'],
      delta: { S0: { a: 'S0', ε: 'S1' }, S1: { b: 'S1', ε: 'S2' }, S2: { c: 'S2' } } },
    beispiele: { ja: ['ε', 'a', 'abc', 'aabbcc', 'ac', 'bbc'], nein: ['ba', 'cb', 'abca', 'aca'] },
    pruefe: (w) => /^a*b*c*$/.test(w.join('')),
    raetsel: ['ε', 'a', 'b', 'ab', 'ac'],
    teilmengen: true,
  },
];
