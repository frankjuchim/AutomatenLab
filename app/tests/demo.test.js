// Demo-Aufgaben des Gastmodus: fachlich gegen die Engine geprüft, unabhängig von den echten Aufgaben.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEMO } from '../js/data/demo.js';
import { dfa, runDFA, normalizeDFA } from '../js/engine/dfa.js';
import { enumerateWords, tokenize } from '../js/engine/tokenize.js';
import { pruefeQuizFrage, pruefeDetektiv, pruefeBaukasten, unterscheidendesWort, pruefeMinimiererRunde, minimiererLoesung, mealyFehlerVariante, pruefeMealyVorhersage, pruefeMealyTest, pruefeMealyReparatur, mealyLoesung, pruefeUeberliste, ueberlisteBeispiel, pruefeNeaRaetsel, pruefeTeilmengenZeile } from '../js/engine/pruefer.js';
import { nfa, runNFA, subsetConstruction } from '../js/engine/nfa.js';
import { mealy, runMealy } from '../js/engine/mealy.js';
import { markierungsTabelle, loesung } from '../js/engine/markierung.js';

test('je Modul eine Demo-Aufgabe (Mealy: je Modus), IDs eindeutig mit Präfix „demo:“', () => {
  assert.deepEqual([...new Set(DEMO.map((d) => d.modul))].sort(), ['baukasten', 'detektiv', 'mealy', 'minimierer', 'parallelwelten', 'quiz', 'ueberliste']);
  assert.deepEqual(DEMO.filter((d) => d.modul === 'mealy').map((d) => d.art).sort(), ['bugjagd', 'vorhersage']);
  assert.equal(new Set(DEMO.map((d) => d.id)).size, DEMO.length);
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

test('Demo-Mealy: Beispiele und Prädikat passen, Vorhersage und Bug-Jagd wie auf dem Server', () => {
  const x = DEMO.find((d) => d.id === 'demo:mealy').daten;
  const M = mealy(x.automat);
  for (const [ein, aus] of x.beispiele) assert.equal(runMealy(M, ein).output || 'ε', aus, ein);
  for (const w of enumerateWords(M.inputAlphabet, 8)) assert.equal(runMealy(M, w).output, x.pruefe(w), w.join(''));
  // Vorhersage: erster Versuch zählt, nach zwei Versuchen kommt die Lösung
  let r = pruefeMealyVorhersage(x.automat, x.vorhersage, null, { wort: 0, ausgabe: 'GGG' });
  assert.equal(r.richtig, false); assert.equal(r.rueckmeldung.ausgabe, undefined);
  r = pruefeMealyVorhersage(x.automat, x.vorhersage, r.stand, { wort: 0, ausgabe: 'U U U' });
  assert.equal(r.rueckmeldung.ausgabe, 'GUG');
  r = pruefeMealyVorhersage(x.automat, x.vorhersage, r.stand, { wort: 1, ausgabe: 'UGGU' });
  r = pruefeMealyVorhersage(x.automat, x.vorhersage, r.stand, { wort: 2, ausgabe: runMealy(M, '100').output });
  assert.equal(r.fertig, true); assert.equal(r.anteil, 2 / 3);
  // Bug-Jagd: fehlerhafte Variante unterscheidet sich, Reparatur mit den Lösungs-Ausgaben ist richtig
  const F = mealyFehlerVariante(x.automat, x.fehler);
  assert.equal(pruefeMealyTest(x.automat, F, { test: '10', urteil: 'bug' }).bug, true);
  assert.equal(pruefeMealyTest(x.automat, F, { test: '011', urteil: 'stimmt' }).rueckmeldung.urteilRichtig, true);
  assert.equal(pruefeMealyReparatur(x.automat, F, {}).ok, false);
  const fix = {}; for (const f of mealyLoesung(x.automat, x.fehler).fehler) (fix[f.von] ??= {})[f.zeichen] = f.richtig;
  assert.equal(pruefeMealyReparatur(x.automat, F, fix).ok, true);
  assert.equal(pruefeMealyTest(x.automat, F, { test: '10', urteil: 'bug', ausgaben: fix }).bug, false);
});

test('Demo-Überliste: Automat zählt bis ±2 richtig, irrt danach; Beispiel aus der Lösung überlistet ihn', () => {
  const x = DEMO.find((d) => d.modul === 'ueberliste').daten;
  const A = dfa(x.automat);
  for (const w of enumerateWords(A.alphabet, 4)) assert.equal(runDFA(A, w).accepted, x.pruefe(w), w.join(''));
  const w = ueberlisteBeispiel(x.automat, x.pruefe, x.praefix, x.fortsetzung);
  assert.equal(pruefeUeberliste(x.automat, x.pruefe, { wort: w.join('') }).ok, true);
  assert.equal(pruefeUeberliste(x.automat, x.pruefe, { wort: '+-' }).ok, false);
  assert.equal(pruefeUeberliste(x.automat, x.pruefe, { wort: '+++---' }).ok, true, 'Tipp 3 stimmt');
});

test('Demo-Parallelwelten: NEA = Prädikat, Rätsel und Teilmengen wie auf dem Server', () => {
  const x = DEMO.find((d) => d.id === 'demo:parallelwelten').daten;
  const N = nfa(x.automat);
  for (const w of enumerateWords(N.alphabet, 8)) assert.equal(runNFA(N, w).accepted, x.pruefe(w), w.join(''));
  for (const w of x.beispiele.ja) assert.equal(runNFA(N, w === 'ε' ? '' : w).accepted, true, w);
  for (const w of x.beispiele.nein) assert.equal(runNFA(N, w === 'ε' ? '' : w).accepted, false, w);
  let stand = null; let r;
  x.raetsel.forEach((w, i) => { r = pruefeNeaRaetsel(x.automat, x.raetsel, stand, { wort: i, zustaende: runNFA(N, w === 'ε' ? '' : w).sets.at(-1) }); stand = r.stand; });
  assert.equal(r.fertig, true); assert.equal(r.anteil, 1);
  let st = null;
  for (const z of subsetConstruction(N).table) { r = pruefeTeilmengenZeile(x.automat, st, { menge: z.set, ziele: z.targets }); st = r.stand; }
  assert.equal(r.ok, true);
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
