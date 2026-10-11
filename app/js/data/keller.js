// Kellerautomaten für das Keller-Labor (#/keller, DS09–10).
// Notation (Ergänzende Hinweise 2025, siehe PLAN.md Abschnitt 1):
//   Kante „(oberstes Kellerzeichen, Eingabezeichen) : abzulegende Zeichen“, z. B. (#, a) : A#
//   • das gelesene oberste Kellerzeichen wird entfernt; das am weitesten RECHTS notierte Zeichen wird
//     zuerst abgelegt (bei „A#“ liegt danach A oben); ε = nichts ablegen
//   • Vorbelegung #, ε-Übergänge möglich, Akzeptanz: Endzustand nach vollständig gelesener Eingabe
//
// So ergänzt du einen Automaten (Deep-Link ?automat=<id> – id nie ändern):
//   id, titel, kontext
//   automat      Engine-Format (transitions als Text 'S0 -> S1 : (#, a) : A#')
//   pruefe(w)    Prädikat (Wort als Symbol-Array) – Test gegen alle Wörter bis Länge ~8
//   beispiele    { ja, nein } – getestet
//   keller       Bedeutung des Kellerspeichers im Sachzusammenhang (Abi: „Erläutern Sie …“)
//   sim          Vorschlagswörter für den Simulator
//   tabelle      Wörter für den Tabellen-Trainer (Abi-Tabelle)
//   rueckwaerts  akzeptierte Wörter, aus deren Lauf die Rückwärts-Aufgabe erzeugt wird

const count = (w, c) => w.filter((x) => x === c).length;
const isPal = (w) => w.join('') === [...w].reverse().join('');

export const KELLER_AUTOMATEN = [
  {
    id: 'anbn', titel: 'aⁿbⁿ (n ≥ 1)',
    kontext: 'Erst einige a, dann genauso viele b – mindestens ein a. L = {aⁿbⁿ | n ≥ 1}.',
    automat: { inputAlphabet: ['a', 'b'], stackAlphabet: ['#', 'A'], states: ['S0', 'S1', 'S2'], start: 'S0', accepting: ['S2'],
      transitions: ['S0 -> S0 : (#, a) : A#', 'S0 -> S0 : (A, a) : AA', 'S0 -> S1 : (A, b) : ε', 'S1 -> S1 : (A, b) : ε', 'S1 -> S2 : (#, ε) : #'] },
    pruefe: (w) => { const s = w.join(''); const n = s.length / 2; return n >= 1 && s === 'a'.repeat(n) + 'b'.repeat(n); },
    beispiele: { ja: ['ab', 'aabb', 'aaabbb'], nein: ['ε', 'a', 'abb', 'aab', 'abab', 'ba'] },
    keller: 'Für jedes gelesene a liegt ein A im Keller. Jedes b entfernt ein A. Liegt nach den b wieder # oben, waren es gleich viele.',
    sim: ['aabb', 'aab', 'abab'], tabelle: ['aabb', 'aab', 'abb'], rueckwaerts: ['aaabbb'],
  },
  {
    id: 'klammern', titel: 'Korrekte Klammerausdrücke ( )',
    kontext: 'Jede öffnende Klammer wird später geschlossen, nie wird mehr geschlossen als geöffnet. Auch ε ist korrekt.',
    automat: { inputAlphabet: ['(', ')'], stackAlphabet: ['#', 'K'], states: ['S0', 'S1'], start: 'S0', accepting: ['S0'],
      transitions: ['S0 -> S1 : (#, () : K#', 'S1 -> S1 : (K, () : KK', 'S1 -> S1 : (K, )) : ε', 'S1 -> S0 : (#, ε) : #'] },
    pruefe: (w) => { let d = 0; for (const c of w) { d += c === '(' ? 1 : -1; if (d < 0) return false; } return d === 0; },
    beispiele: { ja: ['ε', '()', '(())', '()()', '(()())'], nein: ['(', ')', ')(', '(()', '())'] },
    keller: 'Jedes K im Keller steht für eine noch offene Klammer. Eine schließende Klammer entfernt ein K; liegt # oben, ist alles geschlossen.',
    sim: ['(()())', '())', '(('], tabelle: ['(())', '()(', '())'], rueckwaerts: ['(()())'],
  },
  {
    id: 'klammern-x', titel: 'Klammerausdrücke mit Inhalt [ x ]',
    kontext: 'Eckige Klammern dürfen verschachtelt sein, dazwischen beliebig viele x. Beispiele: x[x], [x[xx]x], [][].',
    automat: { inputAlphabet: ['[', ']', 'x'], stackAlphabet: ['#', 'K'], states: ['S0', 'S1'], start: 'S0', accepting: ['S0'],
      transitions: ['S0 -> S0 : (#, x) : #', 'S0 -> S1 : (#, [) : K#', 'S1 -> S1 : (K, [) : KK', 'S1 -> S1 : (K, x) : K', 'S1 -> S1 : (K, ]) : ε', 'S1 -> S0 : (#, ε) : #'] },
    pruefe: (w) => { let d = 0; for (const c of w) { if (c === 'x') continue; d += c === '[' ? 1 : -1; if (d < 0) return false; } return d === 0; },
    beispiele: { ja: ['ε', 'x', '[x]', '[x[xx]x]', '[][]x'], nein: ['[', ']', '[x', 'x]', '[]]'] },
    keller: 'Wie bei runden Klammern: ein K je offener Klammer. Ein x ändert den Keller nicht – es wird gelesen und das oberste Zeichen wieder abgelegt.',
    sim: ['[x[xx]x]', '[x]]', 'x[]x'], tabelle: ['[x]', 'x[[]]', '[]]'], rueckwaerts: ['[x[x]]'],
  },
  {
    id: 'klammern-gemischt', titel: 'Runde und eckige Klammern',
    kontext: 'Klammer-Check wie mit dem Kartenstapel aus der Stunde: Jede schließende Klammer muss zur zuletzt geöffneten passen. ( [ ( ) ] ) ist korrekt, ( [ ) ] nicht.',
    automat: { inputAlphabet: ['(', ')', '[', ']'], stackAlphabet: ['#', 'R', 'E'], states: ['S0', 'S1'], start: 'S0', accepting: ['S0'],
      transitions: ['S0 -> S1 : (#, () : R#', 'S0 -> S1 : (#, [) : E#',
        'S1 -> S1 : (R, () : RR', 'S1 -> S1 : (R, [) : ER', 'S1 -> S1 : (E, () : RE', 'S1 -> S1 : (E, [) : EE',
        'S1 -> S1 : (R, )) : ε', 'S1 -> S1 : (E, ]) : ε', 'S1 -> S0 : (#, ε) : #'] },
    pruefe: (w) => { const st = []; for (const c of w) { if (c === '(' || c === '[') st.push(c); else if (st.pop() !== (c === ')' ? '(' : '[')) return false; } return st.length === 0; },
    beispiele: { ja: ['ε', '([()])', '()[]', '[()()]'], nein: ['([)]', '(]', '[[]', ')('] },
    keller: 'R steht für eine offene runde, E für eine offene eckige Klammer. Oben liegt immer die zuletzt geöffnete – nur die darf geschlossen werden.',
    sim: ['([()])', '([)]'], tabelle: ['([])', '(]'], rueckwaerts: ['[()]()'],
  },
  {
    id: 'anb2n', titel: 'aⁿb²ⁿ (n ≥ 1)',
    kontext: 'Auf n a folgen doppelt so viele b. L = {aⁿb²ⁿ | n ≥ 1}, z. B. abb, aabbbb.',
    automat: { inputAlphabet: ['a', 'b'], stackAlphabet: ['#', 'A'], states: ['S0', 'S1', 'S2'], start: 'S0', accepting: ['S2'],
      transitions: ['S0 -> S0 : (#, a) : AA#', 'S0 -> S0 : (A, a) : AAA', 'S0 -> S1 : (A, b) : ε', 'S1 -> S1 : (A, b) : ε', 'S1 -> S2 : (#, ε) : #'] },
    pruefe: (w) => { const s = w.join(''); const n = s.length / 3; return n >= 1 && Number.isInteger(n) && s === 'a'.repeat(n) + 'b'.repeat(2 * n); },
    beispiele: { ja: ['abb', 'aabbbb'], nein: ['ε', 'ab', 'abbb', 'aabb', 'abba'] },
    keller: 'Für jedes a werden zwei A abgelegt – „AA“ ersetzt beim Lesen das oberste Zeichen. Jedes b entfernt ein A.',
    sim: ['aabbbb', 'aabbb'], tabelle: ['abb', 'aabbbb', 'abbb'], rueckwaerts: ['aabbbb'],
  },
  {
    id: 'gleich-ab', titel: 'Gleich viele a und b',
    kontext: 'a und b in beliebiger Reihenfolge, aber gleich oft (z. B. abba, bbaa, ε).',
    automat: { inputAlphabet: ['a', 'b'], stackAlphabet: ['#', 'A', 'B'], states: ['S0', 'S1'], start: 'S0', accepting: ['S0'],
      transitions: ['S0 -> S1 : (#, a) : A#', 'S0 -> S1 : (#, b) : B#', 'S1 -> S1 : (A, a) : AA', 'S1 -> S1 : (B, b) : BB',
        'S1 -> S1 : (A, b) : ε', 'S1 -> S1 : (B, a) : ε', 'S1 -> S0 : (#, ε) : #'] },
    pruefe: (w) => count(w, 'a') === count(w, 'b'),
    beispiele: { ja: ['ε', 'ab', 'ba', 'abba', 'bbaa', 'aabbba'], nein: ['a', 'aab', 'bbb', 'abbab'] },
    keller: 'Der Keller enthält den „Überschuss“: lauter A (mehr a gelesen) oder lauter B (mehr b gelesen). Ein Zeichen der anderen Sorte hebt eines davon auf.',
    sim: ['abba', 'bbaab'], tabelle: ['abba', 'bbaa', 'aab'], rueckwaerts: ['bbaaab'],
  },
  {
    id: 'palindrom-c', titel: 'Palindrome mit Mittelzeichen: w c wᴿ',
    kontext: 'Ein Wort w aus a und b, dann c, dann w rückwärts (z. B. abcba). Das c markiert die Mitte – der Automat muss nicht raten (deterministisch).',
    automat: { inputAlphabet: ['a', 'b', 'c'], stackAlphabet: ['#', 'A', 'B'], states: ['S0', 'S1', 'S2'], start: 'S0', accepting: ['S2'],
      transitions: ['S0 -> S0 : (#, a) : A#', 'S0 -> S0 : (#, b) : B#', 'S0 -> S0 : (A, a) : AA', 'S0 -> S0 : (A, b) : BA', 'S0 -> S0 : (B, a) : AB', 'S0 -> S0 : (B, b) : BB',
        'S0 -> S1 : (#, c) : #', 'S0 -> S1 : (A, c) : A', 'S0 -> S1 : (B, c) : B',
        'S1 -> S1 : (A, a) : ε', 'S1 -> S1 : (B, b) : ε', 'S1 -> S2 : (#, ε) : #'] },
    pruefe: (w) => { const i = w.indexOf('c'); return i >= 0 && count(w, 'c') === 1 && w.length === 2 * i + 1 && isPal(w); },
    beispiele: { ja: ['c', 'aca', 'abcba', 'bbcbb'], nein: ['ε', 'ab', 'abcab', 'acaa', 'acca'] },
    keller: 'Bis zum c wird w Zeichen für Zeichen abgelegt; oben liegt das zuletzt gelesene. Nach dem c muss jedes Zeichen zum obersten passen – so wird w rückwärts geprüft.',
    sim: ['abcba', 'abcab'], tabelle: ['abcba', 'acb'], rueckwaerts: ['abbcbba'],
  },
  {
    id: 'palindrom', titel: 'Gerade Palindrome: w wᴿ (nichtdeterministisch)',
    kontext: 'Wörter aus a und b, die vorwärts und rückwärts gleich sind und gerade Länge haben (z. B. abba). Ohne Mittelzeichen muss der Automat die Mitte raten: ε-Übergang von S0 nach S1.',
    automat: { inputAlphabet: ['a', 'b'], stackAlphabet: ['#', 'A', 'B'], states: ['S0', 'S1', 'S2'], start: 'S0', accepting: ['S2'],
      transitions: ['S0 -> S0 : (#, a) : A#', 'S0 -> S0 : (#, b) : B#', 'S0 -> S0 : (A, a) : AA', 'S0 -> S0 : (A, b) : BA', 'S0 -> S0 : (B, a) : AB', 'S0 -> S0 : (B, b) : BB',
        'S0 -> S1 : (#, ε) : #', 'S0 -> S1 : (A, ε) : A', 'S0 -> S1 : (B, ε) : B',
        'S1 -> S1 : (A, a) : ε', 'S1 -> S1 : (B, b) : ε', 'S1 -> S2 : (#, ε) : #'] },
    pruefe: (w) => w.length % 2 === 0 && isPal(w),
    beispiele: { ja: ['ε', 'aa', 'abba', 'baab', 'abbbba'], nein: ['a', 'ab', 'aba', 'abab', 'aabb'] },
    keller: 'Wie bei w c wᴿ – nur weiß der Automat nicht, wo die Mitte ist. Er rät sie mit einem ε-Übergang. Akzeptiert wird, wenn EINE der Möglichkeiten zum Endzustand führt.',
    sim: ['abba', 'abab', 'aaaa'], tabelle: ['abba', 'baab'], rueckwaerts: ['abbbba'],
  },
  {
    id: 'kriterium-y', titel: 'Prüfnummern: Kriterium Y (angelehnt an Abitur 2025)',
    kontext: 'Zwei Ziffernfolgen über {1, 2, 3}, getrennt durch „-“. Kriterium Y: Die Quersumme der ersten Ziffernfolge ist gleich der Anzahl der Zeichen der zweiten. Beispiel: 32-12211 (3 + 2 = 5 Zeichen).',
    automat: { inputAlphabet: ['1', '2', '3', '-'], stackAlphabet: ['#', 'A'], states: ['S0', 'S1', 'S2'], start: 'S0', accepting: ['S2'],
      transitions: ['S0 -> S0 : (#, 1) : A#', 'S0 -> S0 : (#, 2) : AA#', 'S0 -> S0 : (#, 3) : AAA#',
        'S0 -> S0 : (A, 1) : AA', 'S0 -> S0 : (A, 2) : AAA', 'S0 -> S0 : (A, 3) : AAAA',
        'S0 -> S1 : (A, -) : A', 'S1 -> S1 : (A, 1) : ε', 'S1 -> S1 : (A, 2) : ε', 'S1 -> S1 : (A, 3) : ε', 'S1 -> S2 : (#, ε) : #'] },
    pruefe: (w) => { const i = w.indexOf('-'); if (i < 1 || count(w, '-') !== 1) return false; const qs = w.slice(0, i).reduce((s, d) => s + Number(d), 0); return qs === w.length - i - 1; },
    beispiele: { ja: ['32-12211', '1-1', '2-31', '11-22', '3-123'], nein: ['ε', '-', '1-', '-1', '2-1', '12-11', '1-1-1'] },
    keller: 'Die Anzahl der A im Keller ist die Quersumme der ersten Ziffernfolge (Ziffer d legt d A ab). In der zweiten Folge entfernt jedes Zeichen ein A – egal welche Ziffer.',
    sim: ['32-12211', '21-11'], tabelle: ['2-31', '12-111', '3-11'], rueckwaerts: ['21-213'],
  },
  {
    id: 'code-ox', titel: 'Code-Prüfung: gleich viele O wie X, Ende E',
    kontext: 'Codes aus den Tasten O und X werden mit E abgeschlossen. Gültig ist ein Code, wenn vor dem E gleich viele O wie X stehen (angelehnt an Abitur 2024, z. B. OOXOXXE).',
    automat: { inputAlphabet: ['O', 'X', 'E'], stackAlphabet: ['#', 'O', 'X'], states: ['S0', 'S1', 'S2'], start: 'S0', accepting: ['S2'],
      transitions: ['S0 -> S1 : (#, O) : O#', 'S0 -> S1 : (#, X) : X#', 'S0 -> S2 : (#, E) : #',
        'S1 -> S1 : (O, O) : OO', 'S1 -> S1 : (X, X) : XX', 'S1 -> S1 : (O, X) : ε', 'S1 -> S1 : (X, O) : ε', 'S1 -> S0 : (#, ε) : #'] },
    pruefe: (w) => w.length >= 1 && w.at(-1) === 'E' && count(w, 'E') === 1 && count(w, 'O') === count(w, 'X'),
    beispiele: { ja: ['E', 'OXE', 'XOE', 'OOXOXXE', 'XXOOE'], nein: ['ε', 'OX', 'OE', 'OXEE', 'EOX', 'OOXE'] },
    keller: 'Der Keller speichert, wie viele O bzw. X „zu viel“ getippt wurden. E ist nur erlaubt, wenn nichts übrig ist (# oben).',
    sim: ['OOXOXXE', 'OXXE'], tabelle: ['OOXOXXE', 'XOE', 'OXXE'], rueckwaerts: ['XXOXOOE'],
  },
];
