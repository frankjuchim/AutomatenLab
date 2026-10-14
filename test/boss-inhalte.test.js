'use strict';
// Aufgabenpool der Boss-Kämpfe (inhalte/boss.js): Aufbau und fachliche Kontrolle jeder Aufgabe gegen die Engine
// (CLAUDE.md Regel 3) – richtige Option stimmt, jede falsche ist wirklich falsch.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const ENGINE = path.join(__dirname, '..', 'app', 'js', 'engine');
const lade = (datei) => import(pathToFileURL(path.join(ENGINE, datei)).href);

async function engine() {
  const [D, N, M, P, G, K] = await Promise.all(['dfa.js', 'nfa.js', 'mealy.js', 'pda.js', 'grammar.js', 'markierung.js'].map(lade));
  const automat = (bild) => ({ dea: D.dfa, nea: N.nfa, mealy: M.mealy, nka: P.pda }[bild.typ])(bild.automat);
  const alphabet = (A) => A.inputAlphabet ?? A.alphabet;
  const woerter = (sigma, max) => {
    const out = [[]];
    for (let i = 0; i < out.length; i++) if (out[i].length < max) for (const a of sigma) out.push([...out[i], a]);
    return out;
  };
  const akzeptiert = (bild, w) => {
    const A = automat(bild);
    if (bild.typ === 'dea') return D.runDFA(A, w).accepted;
    if (bild.typ === 'nea') return N.runNFA(A, w).accepted;
    const r = P.runPDA(A, w);
    assert.ok(!r.exhausted, 'Suchschranke des Kellerautomaten erreicht');
    return r.accepted;
  };
  const grammatik = (text) => { const g = G.parseGrammar(text); assert.ok(g.ok, g.errors?.join(' ')); return g; };
  /** Anzahl der Nerode-Klassen (Präfixe bis Länge lp, Fortsetzungen bis Länge ls) – für reguläre Sprachen = minimaler DEA. */
  const klassen = (sigma, p, lp = 6, ls = 6) => new Set(woerter(sigma, lp).map((u) => woerter(sigma, ls).map((v) => (p([...u, ...v]) ? 1 : 0)).join(''))).size;
  return {
    akzeptiert,
    gleicheSprache: (bild, p) => woerter(alphabet(automat(bild)), 8).every((w) => akzeptiert(bild, w) === !!p(w)),
    mealyAusgabe: (bild, wort) => M.runMealy(automat(bild), [...wort]).output,
    minimal: (spec) => D.minimalStateCount(D.dfa(spec)),
    unterscheidet: (spec, p, q, w) => K.laufAb(D.dfa(spec), p, w).accepted !== K.laufAb(D.dfa(spec), q, w).accepted,
    unterscheidbar: (spec, p, q) => K.unterscheidendesWort(D.dfa(spec), p, q) != null,
    minimalVonPraedikat: (sigma, p, lp = 6) => {
      const n = klassen(sigma, p, lp);
      assert.equal(klassen(sigma, p, lp + 2), n, 'Die Zahl der Klassen ist nicht stabil – Sprache nicht regulär?');
      return n;
    },
    mengeNach: (spec, wort) => {
      const A = N.nfa(spec);
      let menge = N.epsilonClosure(A, A.starts);
      for (const a of wort) menge = N.stepSet(A, menge, a);
      return `{${A.states.filter((s) => menge.includes(s)).join(', ')}}`;
    },
    kellerZustaende: (spec, wort) => P.runPDA(P.pda(spec), [...wort]).run.map((x) => x.config.state).join(', '),
    rechtsregulaer: (text) => G.isRightRegular(grammatik(text)).regular,
    ableitbar: (text, wort) => G.derive(grammatik(text), wort === 'ε' ? [] : [...wort]).member === true,
    ableitungsSchritte: (text, wort) => G.derive(grammatik(text), [...wort]).derivation.length - 1,
    grammatikGleich: (text, sigma, p) => {
      const g = grammatik(text);
      if (g.terminals.some((t) => !sigma.includes(t))) return false;
      const l = G.languageUpTo(g, 8);
      assert.ok(l.complete, `Sprache von „${text}“ nicht vollständig aufgezählt`);
      const erzeugt = new Set(l.words.map((w) => w.join('\u0001')));
      return woerter(sigma, 8).every((w) => erzeugt.has(w.join('\u0001')) === !!p(w));
    }
  };
}

test('Boss-Pool: je Welt A–C 15 eigene Aufgaben, Mix ziehbar, IDs eindeutig, Format wie das Level-Quiz', async () => {
  const { BOSSE } = await import('../inhalte/boss.js');
  const { FALLEN } = await import('../app/js/data/fallen.js');
  const { BOSS_NIVEAU } = await import('../app/js/data/niveaus.js');
  const fallen = new Set(FALLEN.map((f) => f.p));
  const ids = new Set();
  assert.deepEqual(Object.keys(BOSSE), ['A', 'B', 'C']);
  for (const [welt, b] of Object.entries(BOSSE)) {
    assert.equal(b.niveau, BOSS_NIVEAU[welt], `Niveau des Bosses ${welt} wie in niveaus.js`);
    assert.equal(b.pool.length, 15, welt);
    assert.equal(Object.values(b.mix).reduce((x, y) => x + y, 0), b.anzahl);
    for (const [st, n] of Object.entries(b.mix)) assert.ok(b.pool.filter((a) => a.stufe === Number(st)).length >= n, `${welt}: genug Aufgaben der Stufe ${st}`);
    for (const a of b.pool) {
      assert.match(a.id, new RegExp(`^BOSS-${welt}-\\d\\d$`));
      assert.ok(!ids.has(a.id), a.id); ids.add(a.id);
      assert.ok([1, 2, 3].includes(a.stufe), a.id);
      assert.ok(['alle', 'eA', 'plus'].includes(a.niveau), a.id);
      assert.ok(a.fallen.length && a.fallen.every((p) => fallen.has(p)), a.id);
      const f = a.frage;
      if (f.typ === 'mc') { assert.equal(f.optionen.length, 4, a.id); assert.equal(new Set(f.optionen).size, 4, a.id); }
      else if (f.typ === 'wf') { assert.equal(typeof f.wahr, 'boolean'); assert.equal(f.begruendungen.length, 3, a.id); }
      else { assert.equal(f.typ, 'zuordnung'); assert.equal(new Set(f.paare.map((x) => x[1])).size, f.paare.length, a.id); }
    }
  }
});

test('Boss-Pool: jede Kontrolle stimmt mit der Engine überein (richtige Option richtig, falsche falsch)', async () => {
  const { BOSSE } = await import('../inhalte/boss.js');
  const E = await engine();
  let n = 0;
  for (const b of Object.values(BOSSE)) {
    for (const a of b.pool) {
      if (a.bild?.art === 'automat' && a.bild.typ !== 'mealy') assert.doesNotThrow(() => E.akzeptiert(a.bild, []), a.id);
      if (!a.kontrolle) continue;
      assert.equal(a.kontrolle(E, a), true, `${a.id}: Kontrolle schlägt fehl`);
      n++;
    }
  }
  assert.ok(n >= 25, `mindestens 25 Aufgaben mit Engine-Kontrolle (${n})`);
});
