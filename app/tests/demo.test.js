// Demo-Aufgaben des Gastmodus: fachlich gegen die Engine geprüft, unabhängig von den echten Aufgaben.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEMO } from '../js/data/demo.js';
import { dfa, runDFA, normalizeDFA } from '../js/engine/dfa.js';
import { enumerateWords, tokenize } from '../js/engine/tokenize.js';
import { pruefeQuizFrage, pruefeDetektiv, pruefeBaukasten, unterscheidendesWort, pruefeMinimiererRunde, minimiererLoesung } from '../js/engine/pruefer.js';
import { markierungsTabelle, loesung } from '../js/engine/markierung.js';

test('je Modul eine Demo-Aufgabe, IDs mit Präfix „demo:“', () => {
  assert.deepEqual(DEMO.map((d) => d.modul).sort(), ['baukasten', 'detektiv', 'minimierer', 'quiz']);
  assert.ok(DEMO.every((d) => d.id.startsWith('demo:')));
});

test('Demo-Detektiv: erste Option = Sprache des Automaten, jede andere unterscheidbar', () => {
  const f = DEMO.find((d) => d.modul === 'detektiv').daten;
  const A = dfa(f.automat);
  for (const w of enumerateWords(A.alphabet, 8)) assert.equal(runDFA(A, w).accepted, f.optionen[0].pruefe(w), w.join(''));
  for (const o of f.optionen.slice(1)) assert.ok(unterscheidendesWort(A, o.pruefe), o.text);
  assert.equal(pruefeDetektiv(f, 0).ok, true);
  assert.ok(pruefeDetektiv(f, 2).rueckmeldung.gegenbeispiel);
});

test('Demo-Baukasten: Beispiele und Prädikat passen zur Referenz', () => {
  const c = DEMO.find((d) => d.modul === 'baukasten').daten;
  const A = normalizeDFA(c.referenz);
  const lauf = (w) => runDFA(A, tokenize(w === 'ε' ? '' : w, A.alphabet).tokens).accepted;
  for (const w of c.beispiele.ja) assert.equal(lauf(w), true, w);
  for (const w of c.beispiele.nein) assert.equal(lauf(w), false, w);
  for (const w of enumerateWords(A.alphabet, 8)) assert.equal(runDFA(A, w).accepted, c.pruefe(w));
  assert.equal(pruefeBaukasten(c.referenz, c.referenz).ok, true);
});

test('Demo-Minimierer: erwartete Klassen = Markierungsverfahren, Runden wie auf dem Server', () => {
  const x = DEMO.find((d) => d.modul === 'minimierer').daten;
  const L = minimiererLoesung(x.automat, x.merke);
  assert.deepEqual(L.klassen.map((c) => [...c].sort().join()).sort(), x.klassen.map((c) => [...c].sort().join()).sort());
  const M = loesung(markierungsTabelle(dfa(x.automat)));
  let stand = null; let r;
  for (let runde = 0; ; runde++) {
    r = pruefeMinimiererRunde(x.automat, stand, { runde, markiert: [...M.marked].filter(([, k]) => k === runde).map(([key]) => key) });
    stand = r.stand;
    assert.equal(r.rueckmeldung.richtig, true);
    if (r.fertig) break;
  }
  assert.equal(r.ok, true);
  assert.throws(() => pruefeMinimiererRunde(x.automat, stand, { runde: 5, markiert: [] }), (e) => e.status === 409);
  const falsch = pruefeMinimiererRunde(x.automat, null, { runde: 0, markiert: ['S0|S2'] });
  assert.equal(falsch.zaehltFehler, true);
  assert.equal(falsch.ok, false);
});

test('Demo-Quiz: Bewertung wie auf dem Server', () => {
  const [mc, wf, zu] = DEMO.find((d) => d.modul === 'quiz').daten.fragen;
  const id = (j) => `o${j}`;
  assert.equal(pruefeQuizFrage(mc, { wahl: 'o0' }, id).wert, 1);
  assert.equal(pruefeQuizFrage(mc, { wahl: 'o1' }, id).wert, 0);
  assert.equal(pruefeQuizFrage(wf, { wahr: true, begruendung: 'o0' }, id).wert, 1);
  assert.equal(pruefeQuizFrage(wf, { wahr: false, begruendung: 'o0' }, id).wert, 0.5);
  assert.equal(pruefeQuizFrage(zu, { zuordnung: zu.paare.map((p) => p[1]) }, id).wert, 1);
});

test('Gastmodus: Material-Demo ohne Parameter offen, sonst nur Demo-Routen', async () => {
  const { gastErlaubt, GAST_MATERIAL } = await import('../js/data/gast.js');
  const p = (q = '') => new URLSearchParams(q);
  assert.equal(gastErlaubt('material', p()), true);
  assert.equal(gastErlaubt('material', p('x=1')), false);
  assert.equal(gastErlaubt('lehrkraft', p()), false);
  assert.deepEqual(GAST_MATERIAL.akten, ['level-1']);
  assert.ok(!GAST_MATERIAL.stufen.includes('original'), 'Originale nie im Gastmodus');
});
