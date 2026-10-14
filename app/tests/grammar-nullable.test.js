// Regressionstests: Ableitungssuche bei Grammatiken mit ε-Regeln („löschbare“ Nichtterminale).
// Früher wurden Satzformen pauschal nach Länge (≤ 2n + 6) abgeschnitten – bei ε-Regeln gingen so Wörter
// verloren (z. B. S → (S)SSS | ε, Wort „(((((())))))“ wurde als „nicht ableitbar“ gemeldet).
// Orakel: Earley-Erkenner (unabhängige, exakte Entscheidung, auch mit ε-Regeln).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseGrammar, derive, languageUpTo, shortestWords, derivationToString, nullableBudget } from '../js/engine/grammar.js';
import { enumerateWords, makeRng } from '../js/engine/tokenize.js';
import { pruefeGrammatikChallenge } from '../js/engine/pruefer.js';

/** Earley-Erkenner mit Aycock-Horspool-Behandlung löschbarer Nichtterminale. */
function earley(g, w) {
  const rules = [{ lhs: '\u0000', rhs: [{ t: 'N', v: g.start }] }, ...g.rules];
  const sets = Array.from({ length: w.length + 1 }, () => new Map());
  const add = (i, r, d, o) => { const k = `${r}|${d}|${o}`; if (!sets[i].has(k)) sets[i].set(k, [r, d, o]); };
  add(0, 0, 0, 0);
  for (let i = 0; i <= w.length; i++) {
    const done = new Set();
    let changed = true;
    while (changed) {
      changed = false;
      for (const [k, [r, d, o]] of [...sets[i]]) {
        if (done.has(k)) continue;
        done.add(k); changed = true;
        const rhs = rules[r].rhs;
        if (d < rhs.length) {
          const s = rhs[d];
          if (s.t === 'N') {
            rules.forEach((rr, j) => { if (rr.lhs === s.v) add(i, j, 0, i); });
            if (g.nullable.has(s.v)) add(i, r, d + 1, o);
          } else if (i < w.length && w[i] === s.v) add(i + 1, r, d + 1, o);
        } else {
          for (const [r2, d2, o2] of [...sets[o].values()]) {
            const s2 = rules[r2].rhs[d2];
            if (s2 && s2.t === 'N' && s2.v === rules[r].lhs) add(i, r2, d2 + 1, o2);
          }
        }
      }
    }
  }
  return sets[w.length].has(`0|1|0`);
}

test('ε-Regeln: bekannte Problemfälle werden gefunden (inkl. gültiger Linksableitung)', () => {
  const faelle = [
    ['S → (S)S | ε', '(((())))'],
    ['S → (S)S | ε', '((((((((()))))))))'],
    ['S → (S)SSS | ε', '(((((())))))'],
    ['S → (S)SSSSS | ε', '(((())))'],
    ['S → aSbS | bSaS | ε', 'aaaabbbb'],
    ['S → ABS | c\nA → a | ε\nB → b | ε', 'c'],
    ['S → AAAAAAS | a\nA → ε | b', 'bba'],
  ];
  for (const [gt, w] of faelle) {
    const g = parseGrammar(gt);
    assert.ok(g.ok, gt);
    const r = derive(g, w);
    assert.equal(r.member, true, `${gt} / ${w}`);
    // Ableitung prüfen: jeder Schritt ersetzt das linkeste Nichtterminal gemäß einer Regel, Ende = Wort
    const d = r.derivation;
    assert.equal(d.at(-1).form.map((s) => s.v).join(''), w);
    for (let i = 1; i < d.length; i++) {
      const prev = d[i - 1].form; const idx = prev.findIndex((s) => s.t === 'N');
      const exp = [...prev.slice(0, idx), ...d[i].rule.rhs, ...prev.slice(idx + 1)];
      assert.equal(prev[idx].v, d[i].rule.lhs);
      assert.deepEqual(d[i].form.map((s) => s.v), exp.map((s) => s.v));
    }
    assert.ok(derivationToString(d).startsWith('S ⇒ '));
  }
  // Nicht-Wörter bleiben sicher „nicht ableitbar“ (keine Suchschranke)
  const k = parseGrammar('S → (S)SSS | ε');
  for (const w of ['(((((()))))', '())(', ')(']) assert.equal(derive(k, w).member, false, w);
});

test('ε-Regeln: derive und languageUpTo stimmen mit Earley überein (Zufallsgrammatiken)', () => {
  const rng = makeRng(2027);
  const NTS = ['S', 'A', 'B'];
  const sym = () => (rng.int(0, 2) === 0 ? rng.pick(['a', 'b']) : rng.pick(NTS));
  let gepr = 0;
  for (let t = 0; t < 120; t++) {
    const lines = NTS.map((n) => {
      const alts = Array.from({ length: rng.int(1, 3) }, () => {
        const len = rng.int(0, 5);
        return len === 0 ? 'ε' : Array.from({ length: len }, sym).join('');
      });
      if (rng.int(0, 1) === 0) alts.push('ε'); // viele löschbare Nichtterminale
      if (n === 'S' && !alts.some((a) => !/[SAB]/.test(a))) alts.push(rng.pick(['a', 'b', 'ε']));
      return `${n} → ${alts.join(' | ')}`;
    });
    const g = parseGrammar(lines.join('\n'));
    if (!g.ok) continue;
    const lang = languageUpTo(g, 5, { maxNodes: 200000 });
    assert.ok(lang.complete, `${lines.join('; ')}: Schranke`);
    const have = new Set(lang.words.map((w) => w.join('')));
    for (const w of enumerateWords(['a', 'b'], 5)) {
      const s = w.join('');
      const soll = earley(g, w);
      assert.equal(have.has(s), soll, `languageUpTo ${lines.join('; ')} / „${s}“`);
      const r = derive(g, s, { maxNodes: 200000 });
      assert.equal(r.member, soll, `derive ${lines.join('; ')} / „${s}“`);
    }
    gepr++;
  }
  assert.ok(gepr >= 60, `nur ${gepr} Grammatiken geprüft`);
});

test('ε-Regeln: kürzeste Wörter, Sackgassen-Erkennung, Challenge-Prüfung', () => {
  const g = parseGrammar('S → (S)SSSSS | ε');
  const ws = shortestWords(g, { count: 30, maxLen: 8 }).map((w) => w.join(''));
  assert.ok(ws.includes('(((())))'), 'tief geschachteltes Wort fehlt');
  // Rallye „ab einer Satzform“: lange Satzform mit vielen löschbaren S ist KEINE Sackgasse
  const k = parseGrammar('S → (S)S | ε');
  let form = [{ t: 'N', v: 'S' }];
  for (let i = 0; i < 6; i++) { const idx = form.findIndex((s) => s.t === 'N'); form = [...form.slice(0, idx), ...k.rules[0].rhs, ...form.slice(idx + 1)]; }
  assert.equal(derive(k, '(((((())))))', { from: form }).member, true);
  assert.equal(derive(k, '((()))', { from: form }).member, false);
  // Challenge „Klammerausdrücke“ mit einer ungewöhnlichen, aber richtigen Grammatik
  const c = { alphabet: ['(', ')'], maxLen: 8, pruefe: (w) => { let d = 0; for (const x of w) { d += x === '(' ? 1 : -1; if (d < 0) return false; } return d === 0; } };
  const res = pruefeGrammatikChallenge(c, { grammatik: 'S → (S)SSSSS | ε' });
  assert.equal(res.ok, true, JSON.stringify(res));
  assert.equal(nullableBudget(parseGrammar('S → aSb | ab'), 10), 0);
});
