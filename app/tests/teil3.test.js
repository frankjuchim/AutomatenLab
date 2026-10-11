// Tests für Teil 3: Überliste (Automaten irren wirklich), Rallye (Grammatiken + Zielwörter), Grammatik-Tester
// (Musterlösungen = Prädikate, Vergleichsfunktion), Sortierer, Turing-Programme (erwartete Ergebnisse), Quiz (Konsistenz).
//   cd app && npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dfa, runDFA } from '../js/engine/dfa.js';
import { enumerateWords } from '../js/engine/tokenize.js';
import { parseGrammar, derive, derivationToTree, languageUpTo, isRightRegular, tokenizeWord } from '../js/engine/grammar.js';
import { tm, runTM, countOnes, tmToGraph } from '../js/engine/turing.js';
import { UEBERLISTE_STUFEN, UEBERLISTE_BONUS, bauAutomat } from '../js/data/ueberliste.js';
import { RALLYE_AUFGABEN } from '../js/data/rallye.js';
import { GRAMMATIK_CHALLENGES } from '../js/data/grammatik.js';
import { SORTIERER_KARTEN, FAECHER } from '../js/data/sortierer.js';
import { TURING_PROGRAMME, TURING_CHALLENGES } from '../js/data/turing.js';
import { QUIZ_WELTEN, QUIZ_DS } from '../js/data/quiz.js';
import { MODULES } from '../js/modules/manifest.js';
import { BADGES } from '../js/data/badges.js';

test('Überliste: jeder Automat zählt bis zur Kapazität richtig und irrt sich danach', () => {
  assert.ok(UEBERLISTE_STUFEN.length >= 5);
  for (const s of UEBERLISTE_STUFEN) {
    const A = dfa(bauAutomat(s));
    const c = s.kapazitaet;
    // bis Länge 2c: alles richtig
    for (const w of enumerateWords(A.alphabet, Math.min(2 * c, 8))) {
      assert.equal(runDFA(A, w).accepted, !!s.pruefe(w), `${s.id}: irrt schon bei „${w.join('')}“ (Länge ≤ 2c)`);
    }
    // es gibt ein Wort, bei dem er sich irrt (Präfix^(c+1) Fortsetzung^(c+1))
    const bad = [...Array(c + 1).fill(s.praefix), ...Array(c + 1).fill(s.fortsetzung)];
    assert.notEqual(runDFA(A, bad).accepted, !!s.pruefe(bad), `${s.id}: müsste sich bei ${bad.join('')} irren`);
    assert.ok(s.tipps.length >= 3 && s.punkte > 0);
  }
  // Zustandsanzahl wächst mit der Stufe innerhalb derselben Sprache
  const anbn = UEBERLISTE_STUFEN.filter((s) => s.sprache.includes('aⁿbⁿ')).map((s) => dfa(bauAutomat(s)).states.length);
  for (let i = 1; i < anbn.length; i++) assert.ok(anbn[i] > anbn[i - 1]);
  for (const q of UEBERLISTE_BONUS) assert.equal(q.optionen.length, 4);
});

test('Rallye: Grammatiken parsen, Zielwörter ableitbar, Baum-Aufgaben mehrdeutig', () => {
  assert.ok(RALLYE_AUFGABEN.length >= 10);
  const ids = new Set();
  for (const a of RALLYE_AUFGABEN) {
    assert.ok(!ids.has(a.id), `doppelte id ${a.id}`); ids.add(a.id);
    const g = parseGrammar(a.grammatik);
    assert.ok(g.ok, `${a.id}: ${g.errors.join(' ')}`);
    const r = derive(g, a.ziel);
    assert.equal(r.member, true, `${a.id}: Ziel „${a.ziel}“ nicht ableitbar`);
    assert.ok(r.derivation.length >= 2);
    const tree = derivationToTree(g, r.derivation);
    assert.equal(tree.symbol.v, g.start);
    // Sackgassen-Erkennung: Startform mit falschem Terminal-Präfix
    const tk = tokenizeWord(g, a.ziel);
    const wrong = [{ t: 'T', v: tk.tokens[0] }, { t: 'T', v: tk.tokens[0] }, { t: 'T', v: tk.tokens[0] }, { t: 'T', v: tk.tokens[0] }, { t: 'T', v: tk.tokens[0] }, { t: 'T', v: tk.tokens[0] }, { t: 'T', v: tk.tokens[0] }, { t: 'T', v: tk.tokens[0] }, { t: 'N', v: g.start }];
    assert.equal(derive(g, a.ziel, { from: wrong }).member, false, `${a.id}: Sackgasse nicht erkannt`);
    if (a.modus === 'baum') {
      // Mehrdeutig: zwei verschiedene Linksableitungen (per Suche über alle Ableitungen bis Tiefe)
      assert.ok(countLeftmost(g, tk.tokens) >= 2, `${a.id}: Zielwort hat nur einen Ableitungsbaum`);
    }
  }
});

/** Anzahl verschiedener Linksableitungen eines Wortes (Tiefensuche mit Pruning, gedeckelt). */
function countLeftmost(g, w, cap = 5) {
  let count = 0;
  const maxForm = 2 * w.length + 6;
  const rec = (form) => {
    if (count >= cap) return;
    const idx = form.findIndex((s) => s.t === 'N');
    if (idx < 0) { if (form.length === w.length && form.every((s, i) => s.v === w[i])) count++; return; }
    // Terminal-Präfix muss passen
    for (let i = 0; i < idx; i++) if (form[i].v !== w[i]) return;
    let min = 0; for (const s of form) min += s.t === 'T' ? 1 : g.minLen.get(s.v);
    if (min > w.length || form.length > maxForm) return;
    for (const r of g.byLhs.get(form[idx].v)) rec([...form.slice(0, idx), ...r.rhs, ...form.slice(idx + 1)]);
  };
  rec([{ t: 'N', v: g.start }]);
  return count;
}

test('Grammatik-Tester: Musterlösungen stimmen mit Prädikaten überein, Beispiele passen, rechtsregulär wo gefordert', () => {
  assert.ok(GRAMMATIK_CHALLENGES.length >= 8);
  const ids = new Set();
  for (const c of GRAMMATIK_CHALLENGES) {
    assert.ok(!ids.has(c.id), `doppelte id ${c.id}`); ids.add(c.id);
    const g = parseGrammar(c.musterloesung);
    assert.ok(g.ok, `${c.id}: Musterlösung fehlerhaft: ${g.errors.join(' ')}`);
    for (const t of g.terminals) assert.ok(c.alphabet.includes(t), `${c.id}: Terminal ${t} nicht in Σ`);
    const maxLen = c.maxLen ?? 8;
    const lang = languageUpTo(g, maxLen);
    assert.ok(lang.complete, `${c.id}: Suchschranke erreicht`);
    const have = new Set(lang.words.map((w) => w.join('\u0001')));
    for (const w of lang.words) assert.ok(c.pruefe(w), `${c.id}: Musterlösung erzeugt „${w.join(' ')}“ – nicht in der Sprache`);
    for (const w of enumerateWords(c.alphabet, maxLen)) assert.equal(have.has(w.join('\u0001')), !!c.pruefe(w), `${c.id}: Abweichung bei „${w.join(' ')}“`);
    if (c.regulaer) assert.ok(isRightRegular(g).regular, `${c.id}: Musterlösung nicht rechtsregulär`);
    const tok = (w) => (w === 'ε' ? [] : tokenizeWord(g, w).tokens);
    for (const w of c.beispiele.ja) assert.ok(c.pruefe(tok(w)), `${c.id}: Beispiel „${w}“ sollte dazugehören`);
    for (const w of c.beispiele.nein) assert.ok(!c.pruefe(tok(w)), `${c.id}: Beispiel „${w}“ sollte nicht dazugehören`);
  }
  // Vergleich: zwei Grammatiken für dieselbe Sprache
  const g1 = parseGrammar('S → aSb | ab'); const g2 = parseGrammar('S → aT\nT → Sb | b');
  const l1 = languageUpTo(g1, 8).words.map((w) => w.join('')); const l2 = languageUpTo(g2, 8).words.map((w) => w.join(''));
  assert.deepEqual(l1, l2);
  assert.deepEqual(languageUpTo(parseGrammar('S → SS | ε'), 4).words, [[]]);
});

test('Sortierer: ≥ 24 Karten, alle Fächer vertreten, Begründungen vorhanden', () => {
  assert.ok(SORTIERER_KARTEN.length >= 24);
  const ids = new Set();
  for (const k of SORTIERER_KARTEN) {
    assert.ok(!ids.has(k.id), `doppelte id ${k.id}`); ids.add(k.id);
    assert.ok(FAECHER[k.typ], `${k.id}: unbekannter Typ ${k.typ}`);
    assert.ok(k.warum && k.warum.length > 20, `${k.id}: Begründung fehlt`);
  }
  for (const t of [3, 2, 0]) assert.ok(SORTIERER_KARTEN.filter((k) => k.typ === t).length >= 4, `zu wenige Karten für Typ ${t}`);
});

test('Turing: Programme liefern erwartete Ergebnisse, Fleißige Biber halten mit richtiger Einsenzahl', () => {
  assert.ok(TURING_PROGRAMME.length >= 5);
  for (const p of TURING_PROGRAMME) {
    const T = tm(p.maschine);
    assert.ok(tmToGraph(T).edges.length > 0);
    if (p.erwartet.ausgabe) for (const [inp, out] of Object.entries(p.erwartet.ausgabe)) {
      const r = runTM(T, inp);
      assert.ok(r.ok && r.halted, `${p.id}: hält nicht bei ${inp}`);
      assert.equal(r.output.join(''), out, `${p.id}: Ausgabe bei ${inp}`);
      assert.ok(r.accepted, `${p.id}: hält nicht im Endzustand bei ${inp}`);
    }
    if (p.erwartet.akzeptiert) for (const [inp, acc] of Object.entries(p.erwartet.akzeptiert)) {
      const r = runTM(T, inp);
      assert.ok(r.halted, `${p.id}: hält nicht bei ${inp}`);
      assert.equal(r.accepted, acc, `${p.id}: ${inp} sollte ${acc ? '' : 'nicht '}akzeptiert werden`);
    }
    if (p.biber) {
      const r = runTM(T, '');
      assert.ok(r.halted);
      assert.equal(countOnes(r.run.at(-1).config.tape), p.erwartet.einsen, `${p.id}: Einsen`);
      assert.equal(r.steps, p.erwartet.schritte, `${p.id}: Schritte`);
    }
  }
  // aⁿbⁿcⁿ: alle Wörter bis Länge 6 korrekt
  const anbncn = tm(TURING_PROGRAMME.find((p) => p.id === 'anbncn').maschine);
  for (const w of enumerateWords(['a', 'b', 'c'], 6)) {
    const n = w.length / 3;
    const want = w.length >= 3 && Number.isInteger(n) && w.join('') === 'a'.repeat(n) + 'b'.repeat(n) + 'c'.repeat(n);
    const r = runTM(anbncn, w);
    assert.ok(r.halted); assert.equal(r.accepted, want, `aⁿbⁿcⁿ bei ${w.join('')}`);
  }
  // Challenges: fehlende Regel existiert in der Referenz, Tests laufen
  for (const c of TURING_CHALLENGES) {
    const p = TURING_PROGRAMME.find((x) => x.id === c.programm);
    assert.ok(p && p.maschine.delta[c.fehlt.from]?.[c.fehlt.read], `${c.id}: fehlende Regel existiert nicht`);
    for (const w of c.tests) assert.ok(runTM(tm(p.maschine), w).halted);
  }
});

test('Quiz: je Welt 8–10 Fragen, je DS 3 Fragen, Optionen eindeutig, Zuordnungen eindeutig', () => {
  const check = (f, where) => {
    if (f.typ === 'mc') { assert.ok(f.optionen.length >= 3, where); assert.equal(new Set(f.optionen).size, f.optionen.length, `${where}: doppelte Option`); }
    else if (f.typ === 'wf') { assert.equal(typeof f.wahr, 'boolean', where); assert.ok(f.begruendungen.length >= 2, where); }
    else if (f.typ === 'zuordnung') { const r = f.paare.map((p) => p[1]); assert.equal(new Set(r).size, r.length, `${where}: rechte Seiten nicht eindeutig`); assert.ok(f.paare.length >= 3, where); }
    else assert.fail(`${where}: unbekannter Typ ${f.typ}`);
  };
  for (const [id, q] of Object.entries(QUIZ_WELTEN)) {
    assert.ok(q.fragen.length >= 8 && q.fragen.length <= 10, `Welt ${id}: ${q.fragen.length} Fragen`);
    q.fragen.forEach((f, i) => check(f, `Welt ${id} Frage ${i + 1}`));
  }
  for (let n = 1; n <= 16; n++) {
    assert.ok(QUIZ_DS[n], `DS${n} fehlt`);
    assert.equal(QUIZ_DS[n].fragen.length, 3, `DS${n}: 3 Fragen erwartet`);
    QUIZ_DS[n].fragen.forEach((f, i) => check(f, `DS${n} Frage ${i + 1}`));
  }
  // Notation 2025: Stichproben
  const all = [...Object.values(QUIZ_WELTEN).flatMap((q) => q.fragen), ...Object.values(QUIZ_DS).flatMap((q) => q.fragen)];
  const text = JSON.stringify(all);
  assert.ok(text.includes('Endzustand'));
  assert.ok(!/\(a, #\)/.test(text), 'Kellernotation: zuerst Kellerzeichen, dann Eingabe');
});

test('Manifest & Abzeichen Teil 3: Module verfügbar, Abzeichen eindeutig', () => {
  for (const r of ['ueberliste', 'rallye', 'grammatik', 'sortierer', 'turing', 'quiz']) {
    const m = MODULES.find((x) => x.route === r);
    assert.ok(m && typeof m.load === 'function', `${r} nicht verfügbar`);
  }
  const ids = BADGES.map((b) => b.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ['ueberliste-erster', 'rallye-erste', 'grammatik-erste', 'sortierer-perfekt', 'turing-regel', 'quiz-erstes']) assert.ok(ids.includes(id), `Abzeichen ${id} fehlt`);
});
