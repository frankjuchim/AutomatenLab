// Challenges für den Automaten-Baukasten. Deep-Links: #/baukasten?level=n (n = Position im Array, 1 …),
// #/baukasten?aufgabe=<id>, #/baukasten?stufe=1|2|3. Neue Challenges hinten anhängen, damit ?level=n-Links stabil bleiben.
//
// So ergänzt du eine Challenge (Reihenfolge im Array = Aufgabennummer):
//   id         eindeutiger Kurzname (auch als Deep-Link ?aufgabe=<id> nutzbar)
//   stufe      1 = Basis, 2 = Standard, 3 = Profi
//   titel      Kurztitel
//   aufgabe    Aufgabentext (Du-Ansprache, Fachbegriffe gemäß KC)
//   referenz   Musterlösung als DEA (Engine-Format). Geprüft wird nur die SPRACHE, nicht die Bauweise:
//              Jeder äquivalente Automat gilt als richtig.
//   beispiele  Wörter, die zur Sprache gehören (ja) bzw. nicht (nein) – werden in der App als Hilfe
//              angezeigt und in tests/data.test.js gegen die Referenz geprüft.
//   tipp       optionaler Hinweis (aufklappbar)
//   pruefe     optional: Prädikat auf dem Wort (Array von Symbolen) – nur für die automatischen Tests

import { nfa, subsetConstruction } from '../app/js/engine/nfa.js';
import { minimalWithImplicitError, complementDFA, normalizeDFA } from '../app/js/engine/dfa.js';

export const STUFEN = {
  1: { name: 'Basis', text: 'Ein Baustein: Präfix, Teilwort, Endung, Zählen' },
  2: { name: 'Standard', text: 'Modulo zählen, Endungen mit Rückkanten, Komplement, Kontexte' },
  3: { name: 'Profi', text: 'Zwei Bedingungen kombinieren, Abi-Kontexte' },
};

const count = (w, s) => w.filter((x) => x === s).length;
const str = (w) => w.join('');

const enthaeltAA = { alphabet: ['a', 'b'], start: 'S0', accepting: ['S2'],
  delta: { S0: { a: 'S1', b: 'S0' }, S1: { a: 'S2', b: 'S0' }, S2: { 'a, b': 'S2' } } };

// PIN 42x00: per NEA beschrieben („rate, wo 42 beginnt“), dann per Teilmengenkonstruktion in einen DEA übersetzt.
const pinNEA = nfa({ alphabet: ['0', '2', '4'], start: 'S0', accepting: ['S5'],
  delta: { S0: { '0, 2, 4': 'S0', 4: 'S1' }, S1: { 2: 'S2' }, S2: { '0, 2, 4': 'S3' }, S3: { 0: 'S4' }, S4: { 0: 'S5' } } });
const pinDEA = minimalWithImplicitError(normalizeDFA(subsetConstruction(pinNEA).dfa));

export const BAUKASTEN_CHALLENGES = [
  // ───────────── Stufe 1: Basis ─────────────
  {
    id: 'enthaelt-aa', stufe: 1, titel: 'Enthält „aa“',
    aufgabe: 'Entwickle einen DEA über Σ = {a, b}, der genau die Wörter akzeptiert, die das Teilwort „aa“ enthalten.',
    referenz: enthaeltAA,
    beispiele: { ja: ['aa', 'baab', 'abaa', 'aaa'], nein: ['ε', 'a', 'abab', 'bab'] },
    tipp: 'Merke dir, ob du zuletzt ein a gelesen hast. Ist „aa“ einmal gefunden, ändert sich nichts mehr.',
    pruefe: (w) => str(w).includes('aa'),
  },
  {
    id: 'endet-b', stufe: 1, titel: 'Endet auf b',
    aufgabe: 'Entwickle einen DEA über Σ = {a, b}, der genau die Wörter akzeptiert, die auf b enden.',
    referenz: { alphabet: ['a', 'b'], start: 'S0', accepting: ['S1'], delta: { S0: { a: 'S0', b: 'S1' }, S1: { a: 'S0', b: 'S1' } } },
    beispiele: { ja: ['b', 'ab', 'aab', 'bb'], nein: ['ε', 'a', 'ba', 'bba'] },
    tipp: 'Der Automat muss sich nur das zuletzt gelesene Zeichen merken.',
    pruefe: (w) => w.at(-1) === 'b',
  },
  {
    id: 'beginnt-ab', stufe: 1, titel: 'Beginnt mit „ab“',
    aufgabe: 'Entwickle einen DEA über Σ = {a, b}, der genau die Wörter akzeptiert, die mit „ab“ beginnen.',
    referenz: { alphabet: ['a', 'b'], start: 'S0', accepting: ['S2'], implicitError: true, delta: { S0: { a: 'S1' }, S1: { b: 'S2' }, S2: { 'a, b': 'S2' } } },
    beispiele: { ja: ['ab', 'aba', 'abbb'], nein: ['ε', 'a', 'ba', 'aab'] },
    tipp: 'Ein festes Präfix: Jeder falsche Anfang führt in den Fehlerzustand.',
    pruefe: (w) => str(w).startsWith('ab'),
  },
  {
    id: 'gerade-a', stufe: 1, titel: 'Gerade Anzahl a',
    aufgabe: 'Entwickle einen DEA über Σ = {a, b}, der genau die Wörter mit einer geraden Anzahl a akzeptiert (0 ist gerade).',
    referenz: { alphabet: ['a', 'b'], start: 'S0', accepting: ['S0'], delta: { S0: { a: 'S1', b: 'S0' }, S1: { a: 'S0', b: 'S1' } } },
    beispiele: { ja: ['ε', 'aa', 'baba', 'bbb'], nein: ['a', 'ab', 'aaa'] },
    tipp: 'Zwei Erinnerungen genügen: „bisher gerade“ und „bisher ungerade“.',
    pruefe: (w) => count(w, 'a') % 2 === 0,
  },
  {
    id: 'mind-zwei-b', stufe: 1, titel: 'Mindestens zwei b',
    aufgabe: 'Entwickle einen DEA über Σ = {a, b}, der genau die Wörter akzeptiert, in denen mindestens zwei b vorkommen.',
    referenz: { alphabet: ['a', 'b'], start: 'S0', accepting: ['S2'], delta: { S0: { a: 'S0', b: 'S1' }, S1: { a: 'S1', b: 'S2' }, S2: { 'a, b': 'S2' } } },
    beispiele: { ja: ['bb', 'bab', 'abbb'], nein: ['ε', 'b', 'aba'] },
    tipp: 'Zähle die b – aber nur bis 2. Danach ist es egal.',
    pruefe: (w) => count(w, 'b') >= 2,
  },
  {
    id: 'genau-drei-a', stufe: 1, titel: 'Genau drei a',
    aufgabe: 'Entwickle einen DEA über Σ = {a, b}, der genau die Wörter mit genau drei a akzeptiert.',
    referenz: { alphabet: ['a', 'b'], start: 'S0', accepting: ['S3'], implicitError: true,
      delta: { S0: { a: 'S1', b: 'S0' }, S1: { a: 'S2', b: 'S1' }, S2: { a: 'S3', b: 'S2' }, S3: { b: 'S3' } } },
    beispiele: { ja: ['aaa', 'ababa', 'baaab'], nein: ['aa', 'aaaa', 'bbb'] },
    tipp: 'Zähle bis 3. Was passiert beim vierten a?',
    pruefe: (w) => count(w, 'a') === 3,
  },
  {
    id: 'barcode-110', stufe: 1, titel: 'Barcode-Startzeichen 110',
    aufgabe: 'Ein Barcode-Scanner akzeptiert nur Bitfolgen, die mit dem Startzeichen 110 beginnen. Entwickle einen DEA über Σ = {0, 1}.',
    referenz: { alphabet: ['0', '1'], start: 'S0', accepting: ['S3'], implicitError: true, delta: { S0: { 1: 'S1' }, S1: { 1: 'S2' }, S2: { 0: 'S3' }, S3: { '0, 1': 'S3' } } },
    beispiele: { ja: ['110', '1101', '110000'], nein: ['ε', '11', '0110', '111'] },
    pruefe: (w) => str(w).startsWith('110'),
  },
  // ───────────── Stufe 2: Standard ─────────────
  {
    id: 'a-mod-3', stufe: 2, titel: 'Anzahl a durch 3 teilbar',
    aufgabe: 'Entwickle einen DEA über Σ = {a, b}, der genau die Wörter akzeptiert, deren Anzahl a durch 3 teilbar ist.',
    referenz: { alphabet: ['a', 'b'], start: 'S0', accepting: ['S0'], delta: { S0: { a: 'S1', b: 'S0' }, S1: { a: 'S2', b: 'S1' }, S2: { a: 'S0', b: 'S2' } } },
    beispiele: { ja: ['ε', 'aaa', 'abaab', 'b'], nein: ['a', 'aa', 'aaaa'] },
    tipp: 'Zählen modulo 3: Die Zustände bilden einen Kreis.',
    pruefe: (w) => count(w, 'a') % 3 === 0,
  },
  {
    id: 'endet-ab', stufe: 2, titel: 'Endet auf „ab“',
    aufgabe: 'Entwickle einen DEA über Σ = {a, b}, der genau die Wörter akzeptiert, die auf „ab“ enden.',
    referenz: { alphabet: ['a', 'b'], start: 'S0', accepting: ['S2'], delta: { S0: { a: 'S1', b: 'S0' }, S1: { a: 'S1', b: 'S2' }, S2: { a: 'S1', b: 'S0' } } },
    beispiele: { ja: ['ab', 'aab', 'bab', 'abab'], nein: ['ε', 'a', 'abb', 'aba'] },
    tipp: 'Teste besonders „aab“ und „abab“: Wohin führt ein a, wenn du gerade „ab“ gelesen hast?',
    pruefe: (w) => str(w).endsWith('ab'),
  },
  {
    id: 'komplement-aa', stufe: 2, titel: 'Komplement: kein „aa“',
    aufgabe: 'Entwickle einen DEA über Σ = {a, b}, der genau die Wörter akzeptiert, die „aa“ NICHT enthalten. Nutze die Komplement-Idee aus Aufgabe 1.',
    referenz: complementDFA(normalizeDFA(enthaeltAA)),
    beispiele: { ja: ['ε', 'a', 'abab', 'bab'], nein: ['aa', 'baab', 'abaa'] },
    tipp: 'End- und Nicht-Endzustände tauschen – aber nur bei einem VOLLSTÄNDIGEN Automaten. Ein impliziter Fehlerzustand würde sonst zum Endzustand!',
    pruefe: (w) => !str(w).includes('aa'),
  },
  {
    id: 'kaffee-40', stufe: 2, titel: 'Kaffeeautomat 40 ct',
    aufgabe: 'Ein Kaffee kostet 40 ct. Der Automat nimmt 10- und 20-ct-Münzen an (Σ = {10, 20}) und akzeptiert, wenn genau passend bezahlt wurde. Zu viel Geld führt in den Fehlerzustand.',
    referenz: { alphabet: ['10', '20'], start: 'S0', accepting: ['S4'], implicitError: true,
      delta: { S0: { 10: 'S1', 20: 'S2' }, S1: { 10: 'S2', 20: 'S3' }, S2: { 10: 'S3', 20: 'S4' }, S3: { 10: 'S4' } } },
    beispiele: { ja: ['20 20', '10 10 20', '10 20 10', '10 10 10 10'], nein: ['ε', '20', '20 20 10', '10 10 10'] },
    tipp: 'Zustand = bisher eingeworfener Betrag. Wörter schreibst du mit Leerzeichen: „10 20 10“.',
    pruefe: (w) => w.reduce((s, x) => s + Number(x), 0) === 40 && w.every((_, i) => w.slice(0, i).reduce((s, x) => s + Number(x), 0) < 40),
  },
  {
    id: 'anfang-ende', stufe: 2, titel: 'Anfang gleich Ende',
    aufgabe: 'Entwickle einen DEA über Σ = {a, b}, der genau die nichtleeren Wörter akzeptiert, die mit demselben Zeichen beginnen und enden.',
    referenz: { alphabet: ['a', 'b'], start: 'S0', accepting: ['S1', 'S3'], delta: { S0: { a: 'S1', b: 'S3' }, S1: { a: 'S1', b: 'S2' }, S2: { a: 'S1', b: 'S2' }, S3: { a: 'S4', b: 'S3' }, S4: { a: 'S4', b: 'S3' } } },
    beispiele: { ja: ['a', 'aba', 'bb', 'babb'], nein: ['ε', 'ab', 'ba', 'abab'] },
    tipp: 'Das erste Zeichen teilt den Automaten in zwei Hälften.',
    pruefe: (w) => w.length > 0 && w[0] === w.at(-1),
  },
  {
    id: 'lol', stufe: 2, titel: 'LOL-Erkenner',
    aufgabe: 'Ein Chatfilter soll Nachrichten erkennen, die „LOL“ enthalten. Σ = {L, O, X}, wobei X für jedes andere Zeichen steht.',
    referenz: { alphabet: ['L', 'O', 'X'], start: 'S0', accepting: ['S3'],
      delta: { S0: { L: 'S1', 'O, X': 'S0' }, S1: { L: 'S1', O: 'S2', X: 'S0' }, S2: { L: 'S3', 'O, X': 'S0' }, S3: { 'L, O, X': 'S3' } } },
    beispiele: { ja: ['LOL', 'XLOLX', 'LLOL', 'LOLOL'], nein: ['LOOL', 'OLLO', 'LOXL'] },
    tipp: 'Teste „LLOL“: Nach „LL“ ist das zweite L ein neuer Anfang.',
    pruefe: (w) => str(w).includes('LOL'),
  },
  // ───────────── Stufe 3: Profi ─────────────
  {
    id: 'gerade-a-endet-b', stufe: 3, titel: 'Gerade Anzahl a UND endet auf b',
    aufgabe: 'Entwickle einen DEA über Σ = {a, b}, der genau die Wörter akzeptiert, die eine gerade Anzahl a enthalten UND auf b enden.',
    referenz: { alphabet: ['a', 'b'], start: 'S0', accepting: ['S1'], delta: { S0: { a: 'S2', b: 'S1' }, S1: { a: 'S2', b: 'S1' }, S2: { a: 'S0', b: 'S3' }, S3: { a: 'S0', b: 'S3' } } },
    beispiele: { ja: ['b', 'aab', 'abab', 'bb'], nein: ['ε', 'ab', 'aa', 'aaba'] },
    tipp: 'Produkt-Idee: Jeder Zustand merkt sich ein Paar (Anzahl a gerade/ungerade, zuletzt b ja/nein).',
    pruefe: (w) => count(w, 'a') % 2 === 0 && w.at(-1) === 'b',
  },
  {
    id: 'konsole', stufe: 3, titel: 'Spielekonsolen-Code',
    aufgabe: 'Tasten A, B (blau) sowie X, O (rot); der Code endet mit E. Gültig ist ein Code, wenn (1) A oder X vorkommt, (2) beide Farben vorkommen und (3) er mit E endet (nach Abitur 2024). Σ = {A, B, X, O, E}.',
    referenz: { alphabet: ['A', 'B', 'X', 'O', 'E'], start: 'S0', accepting: ['S7'], implicitError: true,
      delta: { S0: { A: 'S3', B: 'S1', X: 'S4', O: 'S2' }, S1: { A: 'S3', B: 'S1', X: 'S6', O: 'S5' }, S2: { A: 'S6', B: 'S5', X: 'S4', O: 'S2' },
        S3: { 'A, B': 'S3', 'X, O': 'S6' }, S4: { 'A, B': 'S6', 'X, O': 'S4' }, S5: { 'A, X': 'S6', 'B, O': 'S5' }, S6: { 'A, B, X, O': 'S6', E: 'S7' } } },
    beispiele: { ja: ['AAXOE', 'AOE', 'XBE'], nein: ['BOBOE', 'AAE', 'AXO', 'AXEE'] },
    tipp: 'Was muss sich der Automat merken? „A/X schon da?“, „Blau schon da?“, „Rot schon da?“ – nicht alle Kombinationen sind möglich.',
    pruefe: (w) => {
      if (w.at(-1) !== 'E' || w.slice(0, -1).includes('E')) return false;
      const body = w.slice(0, -1);
      return (body.includes('A') || body.includes('X')) && (body.includes('A') || body.includes('B')) && (body.includes('X') || body.includes('O'));
    },
  },
  {
    id: 'trainer', stufe: 3, titel: 'Trainerentlassung',
    aufgabe: 'Pro Spiel gibt es 3, 1 oder 0 Punkte (Σ = {0, 1, 3}). Der Trainer wird entlassen, sobald er in drei aufeinanderfolgenden Spielen jeweils weniger als 3 Punkte holt. Akzeptiert werden die Ergebnisfolgen, nach denen er entlassen ist.',
    referenz: { alphabet: ['0', '1', '3'], start: 'S0', accepting: ['S3'],
      delta: { S0: { '0, 1': 'S1', 3: 'S0' }, S1: { '0, 1': 'S2', 3: 'S0' }, S2: { '0, 1': 'S3', 3: 'S0' }, S3: { '0, 1, 3': 'S3' } } },
    beispiele: { ja: ['000', '3101', '10033013', '011'], nein: ['ε', '00', '30', '1031033'] },
    tipp: 'Einmal entlassen, immer entlassen. Ein Sieg (3) setzt die „Pechsträhne“ zurück.',
    pruefe: (w) => /[01]{3}/.test(str(w)),
  },
  {
    id: 'binaer-3', stufe: 3, titel: 'Binärzahl durch 3 teilbar',
    aufgabe: 'Eine Binärzahl wird Bit für Bit gelesen (höchstwertiges Bit zuerst). Akzeptiere genau die Zahlen, deren Wert durch 3 teilbar ist (ε zählt als 0).',
    referenz: { alphabet: ['0', '1'], start: 'S0', accepting: ['S0'], delta: { S0: { 0: 'S0', 1: 'S1' }, S1: { 0: 'S2', 1: 'S0' }, S2: { 0: 'S1', 1: 'S2' } } },
    beispiele: { ja: ['ε', '0', '11', '110', '1001'], nein: ['1', '10', '100', '111'] },
    tipp: 'Zustand = Rest der bisher gelesenen Zahl bei Division durch 3. Ein neues Bit b macht aus dem Wert n den Wert 2n + b.',
    pruefe: (w) => (w.length ? parseInt(str(w), 2) : 0) % 3 === 0,
  },
  {
    id: 'pin-42x00', stufe: 3, titel: 'PIN-Muster 42x00',
    aufgabe: 'Vereinfachte PIN-Eingabe über Σ = {0, 2, 4}: Vor dem Muster dürfen beliebige Ziffern stehen; dann folgt 42, genau eine beliebige Ziffer und 00 – danach nichts mehr. Akzeptiere genau diese Eingaben.',
    referenz: pinDEA,
    beispiele: { ja: ['42000', '42400', '442200', '0042200'], nein: ['4200', '420000', '42020', '24200'] },
    tipp: 'Denke zuerst an einen NEA („rate, wo 42 beginnt“). Beim DEA musst du dir merken, welche Anfänge des Musters gerade „laufen“ – auch mehrere gleichzeitig.',
    pruefe: (w) => /42[024]00$/.test(str(w)),
  },
];
