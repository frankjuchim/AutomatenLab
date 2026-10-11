// Mealy-Automaten (Übersetzer): keine Endzustände, jede Kante „Eingabe / Ausgabe“.
// Datenformat:
// {
//   inputAlphabet: ['M','H'],          // Σ
//   outputAlphabet: ['B'],             // Ω
//   states: ['S0','S1'], start: 'S0',
//   delta: { S0: { M: ['S1', 'ε'], H: ['S0', 'ε'] }, S1: { H: ['S0', 'B'] } }
//      // Ziel: [Folgezustand, Ausgabewort]; Ausgabe 'ε' oder '' = leere Ausgabe
//      // Kurzform als String: 'S1 / B'  (Folgezustand / Ausgabe)
// }

import { tokenize, isEpsilon, EPS } from './tokenize.js';

export function normalizeMealy(spec) {
  const inputAlphabet = [...(spec.inputAlphabet ?? spec.alphabet)].map(String);
  const outputAlphabet = [...(spec.outputAlphabet ?? [])].map(String);
  const states = [...(spec.states ?? Object.keys(spec.delta ?? {}))].map(String);
  const delta = {};
  const ensure = (s) => { if (!delta[s]) { delta[s] = {}; if (!states.includes(s)) states.push(s); } };
  states.forEach(ensure);
  for (const [from, row] of Object.entries(spec.delta ?? {})) {
    ensure(from);
    for (const [key, val] of Object.entries(row ?? {})) {
      let to; let out;
      if (Array.isArray(val)) [to, out] = val;
      else { const m = String(val).split('/'); to = m[0].trim(); out = (m[1] ?? '').trim(); }
      out = isEpsilon(out) ? '' : String(out);
      for (const sym of key.split(',').map((x) => x.trim()).filter(Boolean)) {
        if (!inputAlphabet.includes(sym)) throw new Error(`Mealy: Eingabezeichen „${sym}“ ist nicht in Σ.`);
        ensure(String(to));
        delta[from][sym] = { to: String(to), out };
      }
    }
  }
  return { ...spec, type: 'mealy', inputAlphabet, alphabet: inputAlphabet, outputAlphabet, states, start: String(spec.start ?? states[0]), delta };
}

export const mealy = (spec) => normalizeMealy(spec);

/**
 * Simulation.
 * @returns {{ok, tokens, steps:{from,input,output,to}[], output:string, outputTokens:string[], stuck:boolean, error?}}
 * output = verkettete Ausgabe ('' = ε). stuck=true, wenn ein Übergang fehlt (unvollständiger Automat).
 */
export function runMealy(M, word) {
  const tk = tokenize(word, M.inputAlphabet);
  if (!tk.ok) return { ok: false, tokens: tk.tokens, steps: [], output: '', outputTokens: [], stuck: false, error: tk.message };
  let cur = M.start;
  const steps = [];
  const outs = [];
  for (const a of tk.tokens) {
    const tr = M.delta[cur]?.[a];
    if (!tr) return { ok: true, tokens: tk.tokens, steps, output: outs.join(''), outputTokens: outs, stuck: true, stuckAt: steps.length };
    steps.push({ from: cur, input: a, output: tr.out, to: tr.to });
    if (tr.out !== '') outs.push(tr.out);
    cur = tr.to;
  }
  return { ok: true, tokens: tk.tokens, steps, output: outs.join(''), outputTokens: outs, stuck: false, end: cur };
}

export const outputLabel = (out) => (out === '' ? EPS : out);

export function mealyCompleteness(M) {
  const missing = [];
  for (const s of M.states) for (const a of M.inputAlphabet) if (!M.delta[s]?.[a]) missing.push([s, a]);
  return { complete: missing.length === 0, missing };
}

/**
 * Verhaltensgleichheit zweier Mealy-Automaten (gleiches Eingabealphabet) per Breitensuche im Produkt.
 * Vergleicht die Ausgabe jedes einzelnen Schritts – das ist genau dann überall gleich, wenn alle
 * Ausgaben aller Eingabewörter gleich sind.
 * @returns {{equivalent:true} | {equivalent:false, word:string[], outA:string, outB:string, stepA, stepB}}
 *   word = kürzestes Eingabewort, nach dessen letztem Zeichen sich die Ausgaben unterscheiden;
 *   outA/outB = vollständige Ausgaben von A bzw. B für dieses Wort.
 */
export function mealyEquivalent(A, B) {
  const key = (p, q) => `${p}\u0000${q}`;
  const prev = new Map([[key(A.start, B.start), null]]);
  const queue = [[A.start, B.start]];
  const wordTo = (k) => { const w = []; while (prev.get(k)) { const { from, sym } = prev.get(k); w.unshift(sym); k = from; } return w; };
  while (queue.length) {
    const [p, q] = queue.shift();
    for (const a of A.inputAlphabet) {
      const ta = A.delta[p]?.[a] ?? null;
      const tb = B.delta[q]?.[a] ?? null;
      if (!ta && !tb) continue;
      if (!ta || !tb || ta.out !== tb.out) {
        const word = [...wordTo(key(p, q)), a];
        return { equivalent: false, word, outA: runMealy(A, word).output, outB: runMealy(B, word).output, stepA: ta, stepB: tb };
      }
      const k2 = key(ta.to, tb.to);
      if (!prev.has(k2)) { prev.set(k2, { from: key(p, q), sym: a }); queue.push([ta.to, tb.to]); }
    }
  }
  return { equivalent: true };
}
