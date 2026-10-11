// GraphView-Logik ohne Browser: Graph-Modelle und DOT im Abi-Stil; DOT wird mit viz.js gerendert.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dfa } from '../js/engine/dfa.js';
import { nfa } from '../js/engine/nfa.js';
import { mealy } from '../js/engine/mealy.js';
import { pda } from '../js/engine/pda.js';
import { toGraph, graphToDot, exportDot } from '../js/components/graph-model.js';

const lol = dfa({ alphabet: ['L', 'O', 'X'], start: 'S0', accepting: ['S3'],
  delta: { S0: { L: 'S1', 'O, X': 'S0' }, S1: { L: 'S1', O: 'S2', X: 'S0' }, S2: { L: 'S3', 'O, X': 'S0' }, S3: { 'L, O, X': 'S3' } } });

test('DEA: Kanten zusammengefasst „a, b“, Doppelkreis, Startpfeil', () => {
  const g = toGraph(lol);
  assert.equal(g.edges.find((e) => e.from === 'S0' && e.to === 'S0').label, 'O, X');
  assert.equal(g.edges.find((e) => e.from === 'S3' && e.to === 'S3').label, 'L, O, X');
  const { dot, nodeIds, edgeIds } = graphToDot(g, { prefix: 't' });
  assert.match(dot, /rankdir=LR/);
  assert.match(dot, /label="Start"/);
  assert.match(dot, new RegExp(`"${nodeIds.get('S3')}" \\[[^\\]]*shape=doublecircle`));
  assert.ok(edgeIds.has('S1\u0000S2'));
  assert.equal(g.implicitError, false);
});

test('Mealy „a / A“ mit ε, NKA mehrzeilig, NEA mit ε', () => {
  const m = mealy({ inputAlphabet: ['M', 'H'], outputAlphabet: ['B'], start: 'S0', delta: { S0: { M: ['S1', 'ε'], H: ['S0', 'ε'] }, S1: { M: ['S1', 'ε'], H: ['S0', 'B'] } } });
  const gm = toGraph(m);
  assert.equal(gm.edges.find((e) => e.from === 'S1' && e.to === 'S0').label, 'H / B');
  assert.equal(gm.edges.find((e) => e.from === 'S0' && e.to === 'S1').label, 'M / ε');
  assert.deepEqual(gm.accepting, []);
  const p = pda({ inputAlphabet: ['a', 'b'], stackAlphabet: ['#', 'A'], states: ['S0', 'S1'], start: 'S0', accepting: ['S1'],
    transitions: ['S0 -> S0 : (#, a) : A#', 'S0 -> S0 : (A, a) : AA', 'S0 -> S1 : (A, b) : ε'] });
  const gp = toGraph(p);
  assert.equal(gp.edges.find((e) => e.from === 'S0' && e.to === 'S0').label, '(#, a) : A#\n(A, a) : AA');
  assert.match(graphToDot(gp).dot, /\(#, a\) : A#\\l\(A, a\) : AA\\l/);
  const n = nfa({ alphabet: ['a'], start: 'S0', accepting: ['S1'], delta: { S0: { a: ['S0', 'S1'], eps: 'S1' } } });
  assert.equal(toGraph(n).edges.find((e) => e.from === 'S0' && e.to === 'S1').label, 'a, ε');
});

test('Export-DOT ist sauber und viz.js rendert alle Varianten', async () => {
  const ex = exportDot(toGraph(dfa({ ...lol, implicitError: true })));
  assert.match(ex, /"S0" -> "S1" \[label="L"\]/);
  assert.doesNotMatch(ex, /Fehlerzustand/); // vollständig → kein Hinweis nötig
  const pre = dfa({ alphabet: ['0', '1'], start: 'S0', accepting: ['S1'], implicitError: true, delta: { S0: { 1: 'S1' }, S1: { '0, 1': 'S1' } } });
  assert.match(exportDot(toGraph(pre)), /Fehlerzustand/);
  assert.equal(toGraph(pre).implicitError, true);
  const { instance } = await import('../vendor/viz.js');
  const viz = await instance();
  const svg = viz.renderString(graphToDot(toGraph(lol), { prefix: 'x' }).dot, { format: 'svg' }).replace(/&#45;/g, '-'); // Graphviz kodiert „-“ als Entity
  assert.match(svg, /id="x-n0"/);
  assert.match(svg, /class="node state is-accepting"/);
  assert.match(svg, /class="edge trans"/);
  assert.ok(viz.renderString(ex, { format: 'svg' }).includes('<svg'));
});
