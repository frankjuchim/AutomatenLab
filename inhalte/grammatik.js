// Grammatik-Tester (#/grammatik): Challenges „Entwirf eine Grammatik für …“ mit automatischer Prüfung.
// Geprüft wird die SPRACHE: Alle Wörter über Σ bis zur Länge maxLen werden mit dem Prädikat verglichen.
// Deep-Link: #/grammatik?challenge=n (n = Position im Array, 1 …), #/grammatik?modus=frei
//
//   id, titel          Kurzname
//   aufgabe            Aufgabentext (Du-Ansprache)
//   alphabet           Σ (Terminale der Lösung müssen darin liegen)
//   pruefe(tokens)     Referenzprädikat
//   maxLen             Vergleichslänge (Standard 8; bei großem Σ kleiner)
//   regulaer           true → zusätzlich wird verlangt, dass die Grammatik rechtsregulär ist
//   beispiele          { ja: [...], nein: [...] } zur Anzeige (werden im Test gegen pruefe geprüft)
//   tipp               optionaler Hinweis
//   musterloesung      Grammatik-Text (wird nach drei Fehlversuchen angeboten; im Test gegen pruefe geprüft)
//   stufe              2 Standard, 3 Profi (Punkte 20/30, Vertrag §9)
//
// Liegt in inhalte/ (nur Server, Vertrag InfoLabs §9): Prädikat, Tipp und Musterlösung kennt nur der Server.

const count = (w, s) => w.filter((x) => x === s).length;
const str = (w) => w.join('');

export const GRAMMATIK_CHALLENGES = [
  {
    id: 'anbn', titel: 'aⁿbⁿ', aufgabe: 'Entwirf eine Grammatik für L = {aⁿbⁿ | n ≥ 1} über Σ = {a, b}.',
    alphabet: ['a', 'b'], pruefe: (w) => { const n = count(w, 'a'); return n >= 1 && w.length === 2 * n && w.slice(0, n).every((x) => x === 'a'); },
    beispiele: { ja: ['ab', 'aabb', 'aaabbb'], nein: ['ε', 'a', 'abab', 'aab'] },
    tipp: 'Jede Regelanwendung soll außen ein a und ein b erzeugen – und irgendwann muss es ein Ende geben.',
    musterloesung: 'S → aSb | ab', stufe: 2,
  },
  {
    id: 'palindrome', titel: 'Palindrome', aufgabe: 'Entwirf eine Grammatik für alle Palindrome über Σ = {0, 1} (einschließlich ε).',
    alphabet: ['0', '1'], pruefe: (w) => str(w) === [...w].reverse().join(''),
    beispiele: { ja: ['ε', '0', '11', '101', '0110'], nein: ['01', '100', '0011'] },
    tipp: 'Baue von außen nach innen: Links und rechts dasselbe Zeichen. In der Mitte bleibt ε oder ein einzelnes Zeichen.',
    musterloesung: 'S → 0S0 | 1S1 | 0 | 1 | ε', stufe: 2,
  },
  {
    id: 'gerade-a', titel: 'Gerade Anzahl a', aufgabe: 'Entwirf eine rechtsreguläre Grammatik für alle Wörter über Σ = {a, b} mit gerader Anzahl a (auch 0).',
    alphabet: ['a', 'b'], pruefe: (w) => count(w, 'a') % 2 === 0, regulaer: true,
    beispiele: { ja: ['ε', 'b', 'aa', 'abab', 'baab'], nein: ['a', 'ba', 'aaa', 'abb'] },
    tipp: 'Denk an den DEA mit zwei Zuständen (gerade/ungerade) und übersetze: Zustand → Nichtterminal, Übergang Si –a→ Sj → Regel Si → aSj, Endzustand → Si → ε.',
    musterloesung: 'S → aU | bS | ε\nU → aS | bU', stufe: 2,
  },
  {
    id: 'genau-zwei-b', titel: 'Genau zwei b', aufgabe: 'Entwirf eine rechtsreguläre Grammatik für alle Wörter über Σ = {a, b}, die genau zwei b enthalten.',
    alphabet: ['a', 'b'], pruefe: (w) => count(w, 'b') === 2, regulaer: true,
    beispiele: { ja: ['bb', 'abab', 'bba', 'aabaab'], nein: ['ε', 'b', 'bbb', 'aaa'] },
    tipp: 'Drei Nichtterminale: noch kein b gelesen, ein b gelesen, zwei b gelesen. Nur das letzte darf mit ε enden.',
    musterloesung: 'S → aS | bA\nA → aA | bB\nB → aB | ε', stufe: 2,
  },
  {
    id: 'systemcode', titel: 'System-Codes', aufgabe: 'Entwirf eine Grammatik für die System-Codes über Σ = {a, b, o, x, e}: Ein Code enthält mindestens ein a und mindestens ein x, endet auf e und ist mindestens 3 Zeichen lang.',
    alphabet: ['a', 'b', 'o', 'x', 'e'], maxLen: 6,
    pruefe: (w) => w.length >= 3 && w.includes('a') && w.includes('x') && w.at(-1) === 'e',
    beispiele: { ja: ['axe', 'xae', 'abxe', 'xoaee'], nein: ['ae', 'xe', 'axeb', 'aax', 'ε'] },
    tipp: 'Die Grammatik muss sich merken, ob schon ein a, ein x oder beides vorkam (wie die Zustände eines DEA). Ein Wort mit a, x und e am Ende ist automatisch mindestens 3 Zeichen lang.',
    musterloesung: 'S → aA | xX | bS | oS | eS\nA → aA | bA | oA | eA | xB\nX → xX | bX | oX | eX | aB\nB → aB | bB | oB | xB | eB | e', stufe: 3,
  },
  {
    id: 'klammern', titel: 'Klammerausdrücke', aufgabe: 'Entwirf eine Grammatik für alle korrekt geklammerten Ausdrücke über Σ = {(, )} – einschließlich ε.',
    alphabet: ['(', ')'], pruefe: (w) => { let d = 0; for (const x of w) { d += x === '(' ? 1 : -1; if (d < 0) return false; } return d === 0; },
    beispiele: { ja: ['ε', '()', '(())', '()()', '(()())'], nein: ['(', ')(', '(()', '())'] },
    tipp: 'Ein Klammerausdruck ist leer – oder eine geklammerte Gruppe gefolgt von einem Klammerausdruck: S → (S)S | ε.',
    musterloesung: 'S → (S)S | ε', stufe: 2,
  },
  {
    id: 'ip', titel: 'Mini-Adressen', aufgabe: 'Entwirf eine rechtsreguläre Grammatik für vereinfachte Adressen über Σ = {0, 1, .}: zwei Blöcke aus je genau zwei Ziffern (0 oder 1), getrennt durch einen Punkt, z. B. 01.10',
    alphabet: ['0', '1', '.'], maxLen: 6, regulaer: true,
    pruefe: (w) => /^[01]{2}\.[01]{2}$/.test(str(w)),
    beispiele: { ja: ['00.00', '01.10', '11.01'], nein: ['0.1', '01.', '011.10', '01.10.11'] },
    tipp: 'Rechtsregulär: Jede Regel erzeugt genau ein Terminal und hängt rechts ein Nichtterminal an – eine Kette S → 0A | 1A, A → …',
    musterloesung: 'S → 0A | 1A\nA → 0B | 1B\nB → .C\nC → 0D | 1D\nD → 0 | 1', stufe: 3,
  },
  {
    id: 'endet-ab', titel: 'Endet auf ab', aufgabe: 'Entwirf eine rechtsreguläre Grammatik für alle Wörter über Σ = {a, b}, die auf „ab“ enden.',
    alphabet: ['a', 'b'], regulaer: true, pruefe: (w) => w.length >= 2 && w.at(-2) === 'a' && w.at(-1) === 'b',
    beispiele: { ja: ['ab', 'aab', 'bab', 'abab'], nein: ['ε', 'a', 'ba', 'abb'] },
    tipp: 'Erzeuge zuerst beliebig viele Zeichen (S → aS | bS) und zum Schluss das feste Ende.',
    musterloesung: 'S → aS | bS | aA\nA → b', stufe: 2,
  },
  {
    id: 'glal', titel: 'Glal-Sprache', aufgabe: 'Entwirf eine rechtsreguläre Grammatik für die Glal-Sprache: Silben la, le, lu (das sind die Terminale – deklariere sie mit T = {la, le, lu}), jedes Wort hat genau drei Silben und endet auf lu.',
    alphabet: ['la', 'le', 'lu'], maxLen: 4, regulaer: true,
    pruefe: (w) => w.length === 3 && w[2] === 'lu',
    beispiele: { ja: ['la le lu', 'lu lu lu', 'le la lu'], nein: ['la lu', 'la le la', 'la la la lu'] },
    tipp: 'Drei Silben = drei Schritte in der Kette. Die letzte Regel darf nur lu erzeugen.',
    musterloesung: 'T = {la, le, lu}\nS → laA | leA | luA\nA → laB | leB | luB\nB → lu', stufe: 2,
  },
  {
    id: 'anb2n', titel: 'aⁿb²ⁿ', aufgabe: 'Entwirf eine Grammatik für L = {aⁿb²ⁿ | n ≥ 1} über Σ = {a, b}.',
    alphabet: ['a', 'b'], maxLen: 9,
    pruefe: (w) => { const n = count(w, 'a'); return n >= 1 && w.length === 3 * n && w.slice(0, n).every((x) => x === 'a'); },
    beispiele: { ja: ['abb', 'aabbbb'], nein: ['ab', 'aabb', 'abbb'] },
    tipp: 'Wie bei aⁿbⁿ – nur erzeugt jeder Schritt rechts zwei b.',
    musterloesung: 'S → aSbb | abb', stufe: 2,
  },
  {
    id: 'gleich-viele', titel: 'Gleich viele a und b', aufgabe: 'Entwirf eine Grammatik für alle Wörter über Σ = {a, b} mit gleich vielen a wie b (in beliebiger Reihenfolge, auch ε).',
    alphabet: ['a', 'b'], pruefe: (w) => count(w, 'a') === count(w, 'b'),
    beispiele: { ja: ['ε', 'ab', 'ba', 'abba', 'baab', 'aabb'], nein: ['a', 'aab', 'abb'] },
    tipp: 'Ein Wort mit gleich vielen a und b beginnt mit a oder b – und das passende Gegenstück kommt irgendwo später: S → aSbS | bSaS | ε.',
    musterloesung: 'S → aSbS | bSaS | ε', stufe: 3,
  },
];
