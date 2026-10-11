// Prüft ALLE Inhalte (Arena, Detektiv, Baukasten) automatisch gegen die Engine:
//   • Automaten lassen sich normalisieren
//   • Beispielwörter werden wie angegeben akzeptiert/abgelehnt
//   • Detektiv: richtige Option = Sprache des Automaten, falsche Optionen unterscheiden sich durch kurze Wörter
//   • Baukasten: Referenz-DEA stimmt mit dem Prädikat „pruefe“ überein (alle Wörter bis Länge 7)
// Ausführen:  cd app && npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dfa, runDFA, randomWord, equivalent } from '../js/engine/dfa.js';
import { enumerateWords, makeRng } from '../js/engine/tokenize.js';
import { ARENA_AUTOMATEN, ARENA_LEVELS } from '../js/data/arena.js';
import { DETEKTIV_FAELLE } from '../js/data/detektiv.js';
import { BAUKASTEN_CHALLENGES } from '../js/data/baukasten.js';
import { MODULES } from '../js/modules/manifest.js';
import { BADGES } from '../js/data/badges.js';

const maxLenFor = (alphabet, budget = 20000) => { let n = 0; while (alphabet.length ** (n + 1) * 2 < budget && n < 9) n++; return n; };

test('Arena: ≥ 8 Automaten, Beispiele korrekt, jede Stufe spielbar', () => {
  assert.ok(ARENA_AUTOMATEN.length >= 8);
  const ids = new Set();
  for (const a of ARENA_AUTOMATEN) {
    assert.ok(!ids.has(a.id), `doppelte id ${a.id}`); ids.add(a.id);
    const A = dfa(a.automat);
    for (const w of a.beispiele.ja) assert.equal(runDFA(A, w).accepted, true, `${a.id}: ${w} sollte akzeptiert werden`);
    for (const w of a.beispiele.nein) assert.equal(runDFA(A, w).accepted, false, `${a.id}: ${w} sollte abgelehnt werden`);
    for (const s of Object.keys(a.bedeutung ?? {})) assert.ok(A.states.includes(s), `${a.id}: Bedeutung für unbekannten Zustand ${s}`);
  }
  // Für jede Stufe müssen akzeptierte UND abgelehnte Wörter der geforderten Längen erzeugbar sein
  const rng = makeRng(1);
  for (const s of [1, 2, 3]) {
    const pool = ARENA_AUTOMATEN.filter((a) => a.level.includes(s));
    assert.ok(pool.length >= 3, `Stufe ${s} hat zu wenige Automaten`);
    const [lo, hi] = ARENA_LEVELS[s].laenge;
    for (const a of pool) {
      const A = dfa(a.automat);
      let yes = 0; let no = 0;
      for (let len = lo; len <= hi; len++) { if (randomWord(A, { length: len, wantAccept: true, rng })) yes++; if (randomWord(A, { length: len, wantAccept: false, rng })) no++; }
      assert.ok(yes > 0 && no > 0, `${a.id}: in Stufe ${s} nicht beide Antworten möglich`);
    }
  }
});

test('Detektiv: ≥ 10 Fälle, richtige Option passt exakt, falsche unterscheidbar', () => {
  assert.ok(DETEKTIV_FAELLE.length >= 10);
  for (const f of DETEKTIV_FAELLE) {
    const A = dfa(f.automat);
    assert.equal(f.optionen.length, 4, f.titel);
    const n = maxLenFor(A.alphabet);
    for (const w of enumerateWords(A.alphabet, n)) {
      assert.equal(runDFA(A, w).accepted, !!f.optionen[0].pruefe(w), `${f.titel}: richtige Option weicht bei „${w.join('')}“ ab`);
    }
    for (const o of f.optionen.slice(1)) {
      let diff = null;
      for (const w of enumerateWords(A.alphabet, 6)) if (runDFA(A, w).accepted !== !!o.pruefe(w)) { diff = w; break; }
      assert.ok(diff, `${f.titel}: Option „${o.text}“ ist nicht von der richtigen unterscheidbar`);
    }
    for (const s of Object.keys(f.bedeutung ?? {})) assert.ok(A.states.includes(s), `${f.titel}: Bedeutung für unbekannten Zustand ${s}`);
    for (const w of f.vorschlaege ?? []) assert.ok(runDFA(A, w).ok, `${f.titel}: Vorschlag „${w}“ passt nicht zu Σ`);
  }
});

test('Baukasten: ≥ 15 Challenges in 3 Stufen, Referenzen stimmen mit Beispielen und Prädikat', () => {
  assert.ok(BAUKASTEN_CHALLENGES.length >= 15);
  for (const s of [1, 2, 3]) assert.ok(BAUKASTEN_CHALLENGES.some((c) => c.stufe === s));
  const ids = new Set();
  for (const c of BAUKASTEN_CHALLENGES) {
    assert.ok(!ids.has(c.id), `doppelte id ${c.id}`); ids.add(c.id);
    const A = dfa(c.referenz);
    for (const w of c.beispiele.ja) assert.equal(runDFA(A, w).accepted, true, `${c.id}: ${w} gehört dazu`);
    for (const w of c.beispiele.nein) assert.equal(runDFA(A, w).accepted, false, `${c.id}: ${w} gehört nicht dazu`);
    if (c.pruefe) {
      const n = maxLenFor(A.alphabet, 40000);
      for (const w of enumerateWords(A.alphabet, n)) assert.equal(runDFA(A, w).accepted, !!c.pruefe(w), `${c.id}: Referenz weicht bei „${w.join(' ')}“ vom Prädikat ab`);
    }
    // Referenz ist zu sich selbst äquivalent (Sanity-Check der Prüf-Funktion)
    assert.equal(equivalent(A, dfa(c.referenz)).equivalent, true);
  }
});

test('Manifest & Abzeichen: Routen eindeutig, alle PLAN-Routen vorhanden', () => {
  const routes = MODULES.map((m) => m.route);
  assert.equal(new Set(routes).size, routes.length);
  for (const r of ['arena', 'detektiv', 'baukasten', 'minimierer', 'mealy', 'ueberliste', 'parallelwelten', 'keller', 'rallye', 'grammatik', 'sortierer', 'turing', 'quiz']) {
    assert.ok(routes.includes(r), `Route ${r} fehlt im Manifest`);
  }
  const bid = BADGES.map((b) => b.id);
  assert.equal(new Set(bid).size, bid.length);
});
