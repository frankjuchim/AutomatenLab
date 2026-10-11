// Engine-Tests:  cd app && npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tokenize, wordToString, enumerateWords, makeRng } from '../js/engine/tokenize.js';
import * as D from '../js/engine/dfa.js';
import * as N from '../js/engine/nfa.js';
import * as M from '../js/engine/mealy.js';
import * as P from '../js/engine/pda.js';
import * as G from '../js/engine/grammar.js';

const evenA = D.dfa({ alphabet: ['a', 'b'], start: 'S0', accepting: ['S0'], delta: { S0: { a: 'S1', b: 'S0' }, S1: { a: 'S0', b: 'S1' } } });

test('tokenize: Longest-Match mit mehrstelligen Symbolen', () => {
  assert.deepEqual(tokenize('102010', ['10', '20']).tokens, ['10', '20', '10']);
  assert.deepEqual(tokenize('10 20', ['10', '20', '1']).tokens, ['10', '20']);
  assert.deepEqual(tokenize('lalelu', ['la', 'le', 'lu', 'l']).tokens, ['la', 'le', 'lu']);
  assert.deepEqual(tokenize('ε', ['a']).tokens, []);
  assert.deepEqual(tokenize('', ['a']).tokens, []);
  assert.equal(tokenize('abc', ['a', 'b']).ok, false);
  assert.equal(tokenize('abc', ['a', 'b']).position, 2);
  assert.deepEqual(tokenize('lol', ['L', 'O', 'X']).tokens, ['L', 'O', 'L']);
  assert.equal(wordToString(['10', '20'], ['10', '20']), '10 20');
  assert.equal(wordToString([], ['a']), 'ε');
  assert.equal([...enumerateWords(['a', 'b'], 2)].length, 7);
});

test('DEA: Simulation, Pfad und Fehlerzustand', () => {
  const r = D.runDFA(evenA, 'abab');
  assert.equal(r.accepted, true);
  assert.deepEqual(r.path, ['S0', 'S1', 'S1', 'S0', 'S0']);
  assert.equal(D.runToText(r), 'S0 –a→ S1 –b→ S1 –a→ S0 –b→ S0');
  const pre = D.dfa({ alphabet: ['0', '1'], start: 'S0', accepting: ['S3'], implicitError: true,
    delta: { S0: { 1: 'S1' }, S1: { 1: 'S2' }, S2: { 0: 'S3' }, S3: { '0,1': 'S3' } } });
  assert.equal(D.runDFA(pre, '1101').accepted, true);
  const r2 = D.runDFA(pre, '0110');
  assert.equal(r2.accepted, false);
  assert.equal(r2.deadAt, 0);
  assert.equal(r2.path[1], null);
  assert.equal(D.completeness(pre).complete, false);
  const c = D.completeDFA(pre);
  assert.equal(D.completeness(c).complete, true);
  assert.ok(c.states.includes('F_err'));
  assert.equal(D.runDFA(D.dfa({ ...pre }), 'x').ok, false);
});

test('DEA: normalize meldet Fehler', () => {
  assert.throws(() => D.dfa({ alphabet: ['a'], start: 'S0', accepting: [], delta: { S0: { b: 'S0' } } }), /nicht in Σ/);
  assert.throws(() => D.dfa({ alphabet: ['a'], start: 'X', accepting: [], delta: { S0: { a: 'S0' } } }), /Startzustand/);
});

test('DEA: Äquivalenz mit kürzestem Gegenbeispiel', () => {
  const evenA2 = D.dfa({ alphabet: ['a', 'b'], start: 'A', accepting: ['A', 'C'], delta: { A: { a: 'B', b: 'C' }, B: { a: 'C', b: 'B' }, C: { a: 'B', b: 'A' } } });
  assert.equal(D.equivalent(evenA, evenA2).equivalent, true);
  const endsB = D.dfa({ alphabet: ['a', 'b'], start: 'S0', accepting: ['S1'], delta: { S0: { a: 'S0', b: 'S1' }, S1: { a: 'S0', b: 'S1' } } });
  const res = D.equivalent(evenA, endsB);
  assert.equal(res.equivalent, false);
  assert.equal(res.word, 'ε'); // ε: evenA akzeptiert, endsB nicht
  assert.equal(res.acceptedByA, true);
  // gleiche Sprache, einer mit implizitem Fehlerzustand
  const p1 = D.dfa({ alphabet: ['a', 'b'], start: 'S0', accepting: ['S1'], implicitError: true, delta: { S0: { a: 'S1' } } });
  const p2 = D.completeDFA(p1);
  assert.equal(D.equivalent(p1, p2).equivalent, true);
  const p3 = D.dfa({ alphabet: ['a', 'b'], start: 'S0', accepting: ['S1'], delta: { S0: { a: 'S1' }, S1: { a: 'S1' } } });
  const r3 = D.equivalent(p1, p3);
  assert.equal(r3.word, 'aa');
  assert.equal(r3.acceptedByB, true);
});

test('DEA: Minimierung per Markierungsverfahren', () => {
  // 6 Zustände, minimal 2 (gerade Anzahl a), mit unerreichbarem Zustand
  const big = D.dfa({ alphabet: ['a', 'b'], start: 'S0', accepting: ['S0', 'S2'],
    delta: { S0: { a: 'S1', b: 'S2' }, S1: { a: 'S2', b: 'S3' }, S2: { a: 'S3', b: 'S0' }, S3: { a: 'S0', b: 'S1' }, S4: { a: 'S4', b: 'S4' } } });
  const m = D.minimizeDFA(big);
  assert.deepEqual(m.removedUnreachable, ['S4']);
  assert.equal(m.dfa.states.length, 2);
  assert.equal(D.equivalent(m.dfa, big).equivalent, true);
  assert.ok(m.steps.every((s) => s.round === 0)); // hier reicht die Endzustands-Markierung
  // Beispiel mit Folgepaar-Markierung: endet auf „ab“ (3 Zustände) mit Duplikat
  const ab = D.dfa({ alphabet: ['a', 'b'], start: 'S0', accepting: ['S2'],
    delta: { S0: { a: 'S1', b: 'S0' }, S1: { a: 'S3', b: 'S2' }, S2: { a: 'S1', b: 'S0' }, S3: { a: 'S3', b: 'S2' } } });
  const m2 = D.minimizeDFA(ab);
  assert.equal(m2.dfa.states.length, 3);
  assert.ok(m2.classes.some((c) => c.includes('S1') && c.includes('S3')));
  assert.ok(m2.steps.some((s) => s.reason === 'folgepaar' && s.round === 1));
  assert.equal(D.equivalent(m2.dfa, ab).equivalent, true);
  // unvollständiger Automat → Fehlerzustand wird ergänzt
  const inc = D.dfa({ alphabet: ['a', 'b'], start: 'S0', accepting: ['S1'], delta: { S0: { a: 'S1' } } });
  const m3 = D.minimizeDFA(inc);
  assert.equal(m3.addedErrorState, 'F_err');
  assert.equal(m3.dfa.states.length, 3);
});

test('DEA: zufällige Wörter mit gewünschtem Ergebnis', () => {
  const rng = makeRng(42);
  for (let len = 0; len < 8; len++) {
    for (const want of [true, false]) {
      const w = D.randomWord(evenA, { length: len, wantAccept: want, rng });
      if (w) { assert.equal(w.length, len); assert.equal(D.runDFA(evenA, w).accepted, want); }
    }
  }
  assert.equal(D.randomWord(evenA, { length: 0, wantAccept: false, rng }), null);
  assert.deepEqual(D.shortestAccepted(D.dfa({ alphabet: ['a', 'b'], start: 'S0', accepting: ['S2'], delta: { S0: { a: 'S1' }, S1: { b: 'S2' } } })), ['a', 'b']);
});

test('DEA: Komplement und fromTable', () => {
  const t = D.fromTable(['a', 'b'], [['S0', 'S1', 'S0'], ['S1', 'S0', 'S1']], { accepting: ['S0'] });
  assert.equal(D.equivalent(t, evenA).equivalent, true);
  const c = D.complementDFA(evenA);
  for (const w of enumerateWords(['a', 'b'], 5)) assert.notEqual(D.runDFA(c, w).accepted, D.runDFA(evenA, w).accepted);
});

test('NEA: ε-Abschluss, Simulation, Teilmengenkonstruktion', () => {
  // enthält „LOL“ (rate den Anfang)
  const lol = N.nfa({ alphabet: ['L', 'O', 'X'], start: 'S0', accepting: ['S3'],
    delta: { S0: { 'L,O,X': 'S0', L: 'S1' }, S1: { O: 'S2' }, S2: { L: 'S3' }, S3: { 'L,O,X': 'S3' } } });
  const r = N.runNFA(lol, 'XLOLX');
  assert.equal(r.accepted, true);
  assert.deepEqual(r.sets[2], ['S0', 'S1']);
  const { dfa: d, table } = N.subsetConstruction(lol);
  assert.ok(table.length >= 4);
  for (const w of enumerateWords(['L', 'O', 'X'], 6)) assert.equal(D.runDFA(d, w).accepted, N.runNFA(lol, w).accepted);
  // ε-Übergänge
  const e = N.nfa({ alphabet: ['a', 'b'], start: 'S0', accepting: ['S2'], delta: { S0: { 'ε': 'S1', a: 'S0' }, S1: { b: 'S2', eps: 'S2' } } });
  assert.deepEqual(N.epsilonClosure(e, ['S0']), ['S0', 'S1', 'S2']);
  assert.equal(N.runNFA(e, '').accepted, true);
  assert.equal(N.runNFA(e, 'aab').accepted, true);
  assert.equal(N.runNFA(e, 'ba').accepted, false);
  const sc = N.subsetConstruction(e);
  for (const w of enumerateWords(['a', 'b'], 5)) assert.equal(D.runDFA(sc.dfa, w).accepted, N.runNFA(e, w).accepted);
  assert.throws(() => N.nfa({ alphabet: ['a', 'ε'], delta: {} }), /ε ist kein Zeichen/);
});

test('Mealy: Ausgabe, ε als leere Ausgabe', () => {
  // Süßigkeitenautomat: Münze M, Hebel H → Bonbon B
  const s = M.mealy({ inputAlphabet: ['M', 'H'], outputAlphabet: ['B'], start: 'S0',
    delta: { S0: { M: ['S1', 'ε'], H: 'S0 / ε' }, S1: { M: ['S1', 'ε'], H: ['S0', 'B'] } } });
  const r = M.runMealy(s, 'MHHMMH');
  assert.equal(r.output, 'BB');
  assert.equal(r.steps[0].output, '');
  assert.equal(M.outputLabel(''), 'ε');
  assert.equal(M.mealyCompleteness(s).complete, true);
  const k = M.mealy({ inputAlphabet: ['1', '2'], outputAlphabet: ['K', '1'], start: 'S0', delta: { S0: { 2: ['S2', 'ε'] } } });
  assert.equal(M.runMealy(k, '21').stuck, true);
  // Mehrzeichen-Ausgabe
  const t = M.mealy({ inputAlphabet: ['a', 'b'], outputAlphabet: ['A', 'B'], start: 'S0', delta: { S0: { a: ['S0', 'A'], b: ['S0', 'AB'] } } });
  assert.equal(M.runMealy(t, 'ab').output, 'AAB');
});

const anbn = P.pda({ inputAlphabet: ['a', 'b'], stackAlphabet: ['#', 'A'], states: ['S0', 'S1', 'S2'], start: 'S0', accepting: ['S2'],
  transitions: ['S0 -> S0 : (#, a) : A#', 'S0 -> S0 : (A, a) : AA', 'S0 -> S1 : (A, b) : ε', 'S1 -> S1 : (A, b) : ε', 'S1 -> S2 : (#, ε) : #'] });

test('NKA: aⁿbⁿ (n ≥ 1), Notation und Abi-Tabelle', () => {
  assert.equal(P.runPDA(anbn, 'ab').accepted, true);
  assert.equal(P.runPDA(anbn, 'aaabbb').accepted, true);
  assert.equal(P.runPDA(anbn, '').accepted, false);
  assert.equal(P.runPDA(anbn, 'aab').accepted, false);
  assert.equal(P.runPDA(anbn, 'abb').accepted, false);
  assert.equal(P.runPDA(anbn, 'ba').accepted, false);
  const r = P.runPDA(anbn, 'aabb');
  assert.deepEqual(r.table[0], { zustand: 'S0', keller: '#', oberstes: '–', eingabe: '–' });
  assert.deepEqual(r.table[1], { zustand: 'S0', keller: 'A#', oberstes: '#', eingabe: 'a' });
  assert.deepEqual(r.table[2], { zustand: 'S0', keller: 'AA#', oberstes: 'A', eingabe: 'a' });
  assert.deepEqual(r.table[3], { zustand: 'S1', keller: 'A#', oberstes: 'A', eingabe: 'b' });
  assert.deepEqual(r.table.at(-1), { zustand: 'S2', keller: '#', oberstes: '#', eingabe: 'ε' });
  assert.equal(P.transitionLabel(anbn.transitions[0]), '(#, a) : A#');
  assert.equal(P.isDeterministic(anbn), true);
});

test('NKA: Ablage-Reihenfolge – rechtes Zeichen zuerst', () => {
  const p = P.pda({ inputAlphabet: ['x'], stackAlphabet: ['#', 'A', 'B'], states: ['S0', 'S1'], start: 'S0', accepting: ['S1'],
    transitions: ['S0 -> S1 : (#, x) : AB#'] });
  const r = P.runPDA(p, 'x');
  assert.equal(r.table[1].keller, 'AB#'); // A oben
  assert.equal(r.run[1].config.stack[0], 'A');
});

test('NKA: Nichtdeterminismus – Palindrome w c wᴿ und w wᴿ', () => {
  const pal = P.pda({ inputAlphabet: ['a', 'b'], stackAlphabet: ['#', 'A', 'B'], states: ['S0', 'S1', 'S2'], start: 'S0', accepting: ['S2'],
    transitions: [
      ...['#', 'A', 'B'].flatMap((g) => [`S0 -> S0 : (${g}, a) : A${g}`, `S0 -> S0 : (${g}, b) : B${g}`, `S0 -> S1 : (${g}, ε) : ${g}`]),
      'S1 -> S1 : (A, a) : ε', 'S1 -> S1 : (B, b) : ε', 'S1 -> S2 : (#, ε) : #',
    ] });
  assert.equal(P.isDeterministic(pal), false);
  for (const w of enumerateWords(['a', 'b'], 6)) {
    const s = w.join('');
    const isPal = s.length % 2 === 0 && s === [...s].reverse().join('');
    assert.equal(P.runPDA(pal, w).accepted, isPal, s);
  }
});

test('NKA: Schranke bei endlosen ε-Ablagen', () => {
  const loop = P.pda({ inputAlphabet: ['a'], stackAlphabet: ['#', 'A'], states: ['S0', 'S1'], start: 'S0', accepting: ['S1'],
    transitions: ['S0 -> S0 : (#, ε) : A#', 'S0 -> S0 : (A, ε) : AA'] });
  const r = P.runPDA(loop, 'a');
  assert.equal(r.accepted, false);
  assert.equal(r.exhausted, true);
  assert.throws(() => P.parsePdaTransition('S0 S1 # a'), /nicht lesbar/);
});

test('Grammatik: Parser, Notationen, Fehler', () => {
  const g = G.parseGrammar('S → aSb | ab');
  assert.equal(g.ok, true);
  assert.equal(g.start, 'S');
  assert.deepEqual(g.terminals.sort(), ['a', 'b']);
  const g2 = G.parseGrammar('S -> A1 B\nA1 -> a A1 | eps\nB -> b');
  assert.equal(g2.ok, true);
  assert.deepEqual(g2.nonterminals, ['S', 'A1', 'B']);
  assert.equal(G.parseGrammar('S → aX').ok, false); // X ohne Regel
  assert.equal(G.parseGrammar('S = ab').ok, false);
  const g3 = G.parseGrammar('T = {la, le, lu}\nS → la S | lu');
  assert.deepEqual(g3.rules[0].rhs.map((s) => s.v), ['la', 'S']);
  const g4 = G.parseGrammar('<Satz> → <Nomen> "bellt"\n<Nomen> → "der Hund" | "Bello"');
  assert.equal(g4.ok, true);
  assert.equal(G.derive(g4, 'Bellobellt').member, true);
});

test('Grammatik: Wort-Prüfung mit Linksableitung', () => {
  const g = G.parseGrammar('S → aSb | ab');
  const d = G.derive(g, 'aaabbb');
  assert.equal(d.member, true);
  assert.equal(G.derivationToString(d.derivation), 'S ⇒ aSb ⇒ aaSbb ⇒ aaabbb');
  assert.equal(G.derive(g, 'aabbb').member, false);
  assert.equal(G.derive(g, '').member, false);
  const k = G.parseGrammar('S → (S)S | ε');
  for (const w of ['', '()', '(())()', '((()))']) assert.equal(G.derive(k, w).member, true, w);
  for (const w of [')(', '(()', '())(']) assert.equal(G.derive(k, w).member, false, w);
  // linksrekursiv
  const lr = G.parseGrammar('S → Sa | b');
  assert.equal(G.derive(lr, 'baaa').member, true);
  assert.equal(G.derive(lr, 'aab').member, false);
  // Ableitungsbaum
  const tree = G.derivationToTree(g, d.derivation);
  assert.equal(tree.symbol.v, 'S');
  assert.deepEqual(tree.children.map((c) => c.symbol.v), ['a', 'S', 'b']);
  // Palindrome über {0,1}: vollständiger Abgleich bis Länge 6
  const pal = G.parseGrammar('S → 0S0 | 1S1 | 0 | 1 | ε');
  for (const w of enumerateWords(['0', '1'], 6)) {
    const s = w.join('');
    assert.equal(G.derive(pal, s).member, s === [...s].reverse().join(''), s);
  }
});

test('Grammatik: kürzeste und zufällige Wörter', () => {
  const g = G.parseGrammar('S → aSb | ab');
  assert.deepEqual(G.shortestWords(g, { count: 3 }).map((w) => w.join('')), ['ab', 'aabb', 'aaabbb']);
  const k = G.parseGrammar('S → (S)S | ε');
  const ws = G.shortestWords(k, { count: 4 }).map((w) => w.join(''));
  assert.equal(ws[0], '');
  assert.deepEqual(ws.slice(1, 2), ['()']);
  const rng = makeRng(7);
  for (let i = 0; i < 20; i++) {
    const r = G.randomWord(g, { rng });
    assert.ok(r);
    const s = r.word.join('');
    assert.match(s, /^(a+)(b+)$/);
    assert.equal(s.indexOf('b'), s.length / 2);
  }
});

test('Grammatik: rechtsregulär erkennen und in NEA übersetzen', () => {
  const reg = G.parseGrammar('S → aS | bA\nA → aA | bA | ε');
  assert.equal(G.isRightRegular(reg).regular, true);
  const nonreg = G.parseGrammar('S → 1A\nA → 0A | 1A | +1A | *1A | ε');
  const v = G.isRightRegular(nonreg);
  assert.equal(v.regular, false);
  assert.equal(v.violations.length, 2);
  assert.equal(G.isRightRegular(G.parseGrammar('S → aSb | ab')).regular, false);
  const n = N.nfa(G.rightRegularToNFA(reg));
  for (const w of enumerateWords(['a', 'b'], 5)) assert.equal(N.runNFA(n, w).accepted, w.includes('b'));
  const reg2 = G.parseGrammar('S → aS | b');
  const n2 = N.nfa(G.rightRegularToNFA(reg2));
  assert.equal(N.runNFA(n2, 'aab').accepted, true);
  assert.equal(N.runNFA(n2, 'aa').accepted, false);
});
