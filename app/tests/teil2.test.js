// Tests für Minimierer, Mealy-Maschine, Parallelwelten (NEA) und Keller-Labor (NKA):
//   • alle Referenzautomaten gegen Beispielwörter und Prädikate (alle Wörter bis Länge ~8)
//   • Markierungsverfahren-Logik (Runden, großzügige Prüfung), Bug-Jagd-Varianten, Rückwärts-Aufgaben
// Ausführen:  cd app && npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dfa, runDFA, minimizeDFA, equivalent } from '../js/engine/dfa.js';
import { enumerateWords } from '../js/engine/tokenize.js';
import { mealy, runMealy, mealyEquivalent, mealyCompleteness, outputLabel } from '../js/engine/mealy.js';
import { nfa, runNFA, moveSet, epsilonClosure, subsetConstruction } from '../js/engine/nfa.js';
import { pda, runPDA, searchFrom, initialConfig, matchesConfigSequence, isDeterministic, successors } from '../js/engine/pda.js';
import * as MK from '../js/engine/markierung.js';
import { MINIMIERER_AUFGABEN, MINIMIERER_BEDEUTUNG } from '../../inhalte/minimierer.js';
import { MEALY_AUFGABEN } from '../../inhalte/mealy.js';
import { PARALLELWELTEN } from '../js/data/parallelwelten.js';
import { KELLER_AUTOMATEN } from '../js/data/keller.js';
import { BADGES } from '../js/data/badges.js';

const maxLenFor = (alphabet, budget = 30000) => { let n = 0; while (alphabet.length ** (n + 1) < budget && n < 8) n++; return n; };
const uniqueIds = (list) => { const ids = list.map((x) => x.id); assert.equal(new Set(ids).size, ids.length, 'IDs eindeutig'); };

// ───────────────────────── Minimierer ─────────────────────────
test('Minimierer: ≥ 6 Aufgaben, Beispiele, erwartete Klassen = Markierungsverfahren', () => {
  assert.ok(MINIMIERER_AUFGABEN.length >= 6);
  uniqueIds(MINIMIERER_AUFGABEN);
  for (const a of MINIMIERER_AUFGABEN) {
    const A = dfa(a.automat);
    for (const w of a.beispiele.ja) assert.equal(runDFA(A, w).accepted, true, `${a.id}: ${w}`);
    for (const w of a.beispiele.nein) assert.equal(runDFA(A, w).accepted, false, `${a.id}: ${w}`);
    const m = minimizeDFA(A);
    const got = m.classes.filter((c) => c.length > 1).map((c) => [...c].sort().join(',')).sort();
    assert.deepEqual(got, a.klassen.map((c) => [...c].sort().join(',')).sort(), `${a.id}: Klassen`);
    assert.equal(equivalent(A, m.dfa).equivalent, true, `${a.id}: Minimalautomat gleichwertig`);
    // Spiel-Logik liefert dieselben unmarkierten Paare wie die Engine
    const T = MK.markierungsTabelle(A);
    const L = MK.loesung(T);
    const engineUnmarked = m.pairs.filter((p) => !p.marked).map((p) => T.key(p.p, p.q)).sort();
    assert.deepEqual([...L.unmarkiert].sort(), engineUnmarked, `${a.id}: unmarkierte Paare`);
    // äquivalente Paare haben kein unterscheidendes Wort, markierte schon (und es unterscheidet wirklich)
    for (const pr of T.pairs) {
      const w = MK.unterscheidendesWort(T.A, pr.p, pr.q);
      assert.equal(w === null, L.unmarkiert.includes(pr.key), `${a.id}: ${pr.key}`);
      if (w) assert.notEqual(MK.laufAb(T.A, pr.p, w).accepted, MK.laufAb(T.A, pr.q, w).accepted);
    }
    for (const s of Object.keys(MINIMIERER_BEDEUTUNG[a.id] ?? {})) assert.ok(A.states.includes(s));
  }
});

test('Minimierer: Smiley 6 → 5, Barcode 7 → 5, Quersumme S3–S8 → 3 Zustände', () => {
  const by = (id) => dfa(MINIMIERER_AUFGABEN.find((a) => a.id === id).automat);
  assert.equal(MK.markierungsTabelle(by('smiley')).states.length, 6);
  assert.equal(minimizeDFA(by('smiley')).dfa.states.length, 5);
  assert.equal(by('barcode').states.length, 7);
  assert.equal(minimizeDFA(by('barcode')).dfa.states.length, 5);
  const q = minimizeDFA(by('quersumme'));
  const rest = new Set(q.classes.filter((c) => c.some((s) => ['S3', 'S4', 'S5', 'S6', 'S7', 'S8'].includes(s))).map((c) => c.join()));
  assert.equal(rest.size, 3);
});

test('Markierungsverfahren-Spiel: Runde 0, fehlende/falsche Paare, vorgezogene Paare, Ende', () => {
  const A = dfa(MINIMIERER_AUFGABEN.find((a) => a.id === 'endet-ab').automat);
  const T = MK.markierungsTabelle(A);
  const r0 = MK.pruefeRunde(T, new Set(), new Set(['S0|S2']), 0);
  assert.equal(r0.ok, false);
  assert.ok(r0.fehlend.includes('S1|S2'));
  const all0 = new Set(r0.pflicht);
  assert.equal(MK.pruefeRunde(T, new Set(), all0, 0).ok, true);
  // Runde 1: S0|S1 muss markiert werden (b führt nach S0|S2), S1|S3 wäre falsch
  const r1bad = MK.pruefeRunde(T, all0, new Set(['S0|S1', 'S1|S3']), 1);
  assert.deepEqual(r1bad.falsch, ['S1|S3']);
  assert.ok(r1bad.fehlend.includes('S0|S3'));
  const r1 = MK.pruefeRunde(T, all0, new Set(r1bad.pflicht), 1);
  assert.equal(r1.ok, true); assert.equal(r1.fertig, false);
  const done = MK.pruefeRunde(T, new Set([...all0, ...r1.pflicht]), new Set(), 2);
  assert.equal(done.ok && done.fertig, true);
  // „vorgezogen“: Smiley – in Runde 1 schon ein Paar markieren, das erst durch ein Runde-1-Paar begründet ist
  const S = MK.markierungsTabelle(dfa(MINIMIERER_AUFGABEN[0].automat));
  const base = new Set(MK.pruefeRunde(S, new Set(), new Set(), 0).pflicht);
  const p1 = MK.pruefeRunde(S, base, new Set(), 1).pflicht;
  const later = [...MK.loesung(S).marked].filter(([, r]) => r === 2).map(([k]) => k);
  assert.ok(later.length > 0);
  const lenient = MK.pruefeRunde(S, base, new Set([...p1, later[0]]), 1);
  assert.equal(lenient.ok, true);
  assert.deepEqual(lenient.vorgezogen, [later[0]]);
});

// ───────────────────────── Mealy ─────────────────────────
const buggy = (a) => {
  const F = mealy(a.automat);
  for (const f of a.fehler) F.delta[f.von][f.zeichen] = { ...F.delta[f.von][f.zeichen], out: f.ausgabe };
  return F;
};

test('Mealy: ≥ 6 Automaten, vollständig, Beispiele und Prädikat (alle Wörter bis Länge 8)', () => {
  assert.ok(MEALY_AUFGABEN.length >= 6);
  uniqueIds(MEALY_AUFGABEN);
  for (const a of MEALY_AUFGABEN) {
    const M = mealy(a.automat);
    assert.equal(mealyCompleteness(M).complete, true, `${a.id}: vollständig`);
    assert.equal(M.accepting, undefined, `${a.id}: Mealy hat keine Endzustände`);
    for (const [ein, aus] of a.beispiele) assert.equal(outputLabel(runMealy(M, ein).output), aus, `${a.id}: ${ein}`);
    const n = maxLenFor(M.inputAlphabet, 70000);
    for (const w of enumerateWords(M.inputAlphabet, n)) assert.equal(runMealy(M, w).output, a.pruefe(w), `${a.id}: ${w.join('')}`);
    for (const w of a.vorhersage) assert.ok(runMealy(M, w).ok, `${a.id}: Vorhersage-Wort ${w}`);
    // Ausgaben nur aus Ω
    for (const s of M.states) for (const t of Object.values(M.delta[s])) for (const ch of t.out) assert.ok(M.outputAlphabet.includes(ch), `${a.id}: ${ch} ∉ Ω`);
    for (const s of Object.keys(a.bedeutung ?? {})) assert.ok(M.states.includes(s));
  }
});

test('Mealy: Lauflängen-Kompressor hdddhhhhhdhh# → 1h3d3h2h1d2h#', () => {
  const M = mealy(MEALY_AUFGABEN.find((a) => a.id === 'frog').automat);
  assert.equal(runMealy(M, 'hdddhhhhhdhh#').output, '1h3d3h2h1d2h#');
  const P = mealy(MEALY_AUFGABEN.find((a) => a.id === 'palindrom').automat);
  assert.equal(runMealy(P, '011').output, '01110');
});

test('Mealy Bug-Jagd: jede Fehlervariante weicht ab, Korrektur aller Fehlerkanten repariert sie', () => {
  for (const a of MEALY_AUFGABEN) {
    const M = mealy(a.automat);
    const F = buggy(a);
    const d = mealyEquivalent(F, M);
    assert.equal(d.equivalent, false, `${a.id}: Fehler sichtbar`);
    assert.notEqual(d.outA, d.outB);
    for (const f of a.fehler) assert.notEqual(M.delta[f.von][f.zeichen].out, f.ausgabe, `${a.id}: Fehler ${f.von}/${f.zeichen} ist keiner`);
    for (const f of a.fehler) F.delta[f.von][f.zeichen].out = M.delta[f.von][f.zeichen].out;
    assert.equal(mealyEquivalent(F, M).equivalent, true, `${a.id}: repariert`);
  }
  // Abi-Wörter: der fehlerhafte Kompressor irrt bei hdddh# und ddhhh#
  const fr = MEALY_AUFGABEN.find((a) => a.id === 'frog');
  const B = buggy(fr); const R = mealy(fr.automat);
  for (const w of ['hdddh#', 'ddhhh#']) assert.notEqual(runMealy(B, w).output, runMealy(R, w).output, w);
});

// ───────────────────────── NEA ─────────────────────────
test('Parallelwelten: NEAs gegen Beispiele und Prädikat, ε nicht in Σ, Teilmengenkonstruktion gleichwertig', () => {
  assert.ok(PARALLELWELTEN.length >= 5);
  uniqueIds(PARALLELWELTEN);
  assert.ok(PARALLELWELTEN.some((p) => Object.values(nfa(p.automat).delta).some((row) => row['ε'])), 'mind. ein NEA mit ε-Übergängen');
  for (const p of PARALLELWELTEN) {
    const N = nfa(p.automat);
    assert.ok(!N.alphabet.includes('ε'));
    for (const w of p.beispiele.ja) assert.equal(runNFA(N, w).accepted, true, `${p.id}: ${w}`);
    for (const w of p.beispiele.nein) assert.equal(runNFA(N, w).accepted, false, `${p.id}: ${w}`);
    const n = maxLenFor(N.alphabet, 70000);
    for (const w of enumerateWords(N.alphabet, n)) assert.equal(runNFA(N, w).accepted, !!p.pruefe(w), `${p.id}: ${w.join('')}`);
    const D = subsetConstruction(N).dfa;
    for (const w of enumerateWords(N.alphabet, Math.min(n, 6))) assert.equal(runDFA(dfa(D), w).accepted, !!p.pruefe(w), `${p.id} (DEA): ${w.join('')}`);
    for (const w of p.raetsel) assert.ok(runNFA(N, w).ok, `${p.id}: Rätselwort ${w}`);
    // Schrittweise Simulation (erst lesen, dann ε-Abschluss) = runNFA
    for (const w of p.raetsel) {
      const r = runNFA(N, w);
      let cur = epsilonClosure(N, N.starts);
      r.tokens.forEach((a, i) => { cur = epsilonClosure(N, moveSet(N, cur, a)); assert.deepEqual(cur, r.sets[i + 1]); });
    }
  }
  const third = nfa(PARALLELWELTEN.find((p) => p.id === 'drittletztes').automat);
  assert.equal(third.states.length, 4);
  assert.equal(subsetConstruction(third).dfa.states.length, 8);
});

// ───────────────────────── Keller ─────────────────────────
test('Keller-Labor: alle NKA gegen Beispiele und Prädikat (alle Wörter bis Länge 7–8)', () => {
  uniqueIds(KELLER_AUTOMATEN);
  const ids = KELLER_AUTOMATEN.map((k) => k.id);
  for (const id of ['anbn', 'klammern', 'klammern-x', 'anb2n', 'gleich-ab', 'palindrom-c', 'palindrom', 'kriterium-y', 'code-ox']) assert.ok(ids.includes(id), id);
  for (const k of KELLER_AUTOMATEN) {
    const P = pda(k.automat);
    for (const w of k.beispiele.ja) assert.equal(runPDA(P, w).accepted, true, `${k.id}: ${w}`);
    for (const w of k.beispiele.nein) assert.equal(runPDA(P, w).accepted, false, `${k.id}: ${w}`);
    const n = maxLenFor(P.inputAlphabet, 25000);
    for (const w of enumerateWords(P.inputAlphabet, n)) {
      const r = runPDA(P, w);
      assert.equal(r.exhausted, false, `${k.id}: Schranke bei ${w.join('')}`);
      assert.equal(r.accepted, !!k.pruefe(w), `${k.id}: ${w.join('')}`);
    }
    for (const w of [...k.sim, ...k.tabelle]) assert.ok(runPDA(P, w).ok, `${k.id}: ${w}`);
    for (const w of k.rueckwaerts) assert.equal(runPDA(P, w).accepted, true, `${k.id}: Rückwärts-Wort ${w}`);
  }
  assert.equal(isDeterministic(pda(KELLER_AUTOMATEN.find((k) => k.id === 'palindrom-c').automat)), true);
  assert.equal(isDeterministic(pda(KELLER_AUTOMATEN.find((k) => k.id === 'palindrom').automat)), false);
});

test('Keller: Notation – rechtes Zeichen zuerst abgelegt, Akzeptanz über Endzustand, Kriterium Y', () => {
  const Y = pda(KELLER_AUTOMATEN.find((k) => k.id === 'kriterium-y').automat);
  const r = runPDA(Y, '32-12211');
  assert.equal(r.accepted, true);
  assert.deepEqual(r.table[1], { zustand: 'S0', keller: 'AAA#', oberstes: '#', eingabe: '3' });
  assert.equal(r.table.at(-1).zustand, 'S2');
  // Klammern-Parser: „)“ als Eingabezeichen
  const K = pda(KELLER_AUTOMATEN.find((k) => k.id === 'klammern').automat);
  assert.ok(K.transitions.some((t) => t.input === ')'));
  // gemischt: (R, [) : ER → E liegt oben
  const G = pda(KELLER_AUTOMATEN.find((k) => k.id === 'klammern-gemischt').automat);
  assert.deepEqual(runPDA(G, '([])').table[2].keller, 'ER#');
});

test('Keller: searchFrom ab Zwischenkonfiguration, Rückwärts-Aufgaben eindeutig lösbar', () => {
  const W = pda(KELLER_AUTOMATEN.find((k) => k.id === 'palindrom').automat);
  const tokens = ['a', 'b', 'b', 'a'];
  // falsch geraten: sofort in S1 → von dort kein akzeptierender Lauf
  const wrong = successors(W, initialConfig(W), tokens).find((s) => s.t.to === 'S1');
  assert.equal(searchFrom(W, tokens, wrong.config).accepted, false);
  const right = successors(W, initialConfig(W), tokens).find((s) => s.t.input === 'a');
  const res = searchFrom(W, tokens, right.config);
  assert.equal(res.accepted, true);
  assert.equal(res.run.at(-1).config.state, 'S2');
  for (const k of KELLER_AUTOMATEN) {
    const P = pda(k.automat);
    for (const w of k.rueckwaerts) {
      const run = runPDA(P, w).run;
      const seq = run.map((x) => ({ state: x.config.state, stack: x.config.stack }));
      assert.equal(matchesConfigSequence(P, runPDA(P, w).tokens, seq).ok, true, `${k.id}: ${w}`);
      // ein Zeichen zu wenig passt nicht
      assert.equal(matchesConfigSequence(P, runPDA(P, w).tokens.slice(1), seq).ok, false, `${k.id}: ${w} gekürzt`);
    }
  }
});

test('Teil 2: Abzeichen vorhanden', () => {
  const ids = BADGES.map((b) => b.id);
  for (const p of ['minimierer-', 'mealy-', 'parallelwelten-', 'keller-']) assert.ok(ids.some((i) => i.startsWith(p)), p);
});
