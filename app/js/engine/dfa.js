// Deterministische endliche Automaten (DEA)
// Datenformat (siehe ARCHITECTURE.md):
// {
//   alphabet: ['a','b'],                 // Eingabealphabet Σ (Symbole dürfen mehrstellig sein)
//   states:   ['S0','S1'],               // Zustände Q (Reihenfolge = Darstellungsreihenfolge)
//   start:    'S0',                      // Startzustand
//   accepting:['S1'],                    // Endzustände F
//   delta: { S0: { a:'S1', b:'S0' }, … } // Übergangsfunktion δ; fehlende Einträge = Fehlerzustand
//   implicitError: true                  // optional: Hinweis „nicht eingezeichnete Übergänge → Fehlerzustand“
// }
// In delta dürfen Schlüssel mehrere Symbole zusammenfassen: { S0: { 'a, b': 'S1' } }.

import { tokenize, wordToString, makeRng } from './tokenize.js';

export const ERROR_STATE = 'F_err';

/** Normalisiert eine (ggf. kompakt notierte) DEA-Beschreibung und prüft sie. Wirft bei Fehlern. */
export function normalizeDFA(spec) {
  const alphabet = [...spec.alphabet].map(String);
  const states = [...(spec.states ?? Object.keys(spec.delta ?? {}))].map(String);
  const delta = {};
  for (const s of states) delta[s] = {};
  for (const [from, row] of Object.entries(spec.delta ?? {})) {
    if (!delta[from]) { states.push(from); delta[from] = {}; }
    for (const [key, to] of Object.entries(row ?? {})) {
      if (to == null || to === '') continue;
      const syms = key.includes(',') ? key.split(',').map((x) => x.trim()).filter(Boolean) : [key];
      for (const sym of syms) {
        if (!alphabet.includes(sym)) throw new Error(`DEA: Symbol „${sym}“ (bei ${from}) ist nicht in Σ.`);
        if (delta[from][sym] && delta[from][sym] !== to) throw new Error(`DEA: ${from} hat mit „${sym}“ zwei Übergänge.`);
        delta[from][sym] = String(to);
        if (!delta[to]) { states.push(String(to)); delta[to] = {}; }
      }
    }
  }
  const start = String(spec.start ?? states[0]);
  if (!delta[start]) throw new Error(`DEA: Startzustand „${start}“ existiert nicht.`);
  const accepting = [...(spec.accepting ?? [])].map(String);
  for (const f of accepting) if (!delta[f]) throw new Error(`DEA: Endzustand „${f}“ existiert nicht.`);
  return { ...spec, type: 'dfa', alphabet, states, start, accepting, delta, implicitError: !!spec.implicitError };
}

/** Bequemer Konstruktor: dfa({ alphabet, start, accepting, delta }) */
export const dfa = (spec) => normalizeDFA(spec);

/** Ein Schritt: Folgezustand oder null (= Fehlerzustand). */
export function step(A, state, sym) {
  if (state == null) return null;
  return A.delta[state]?.[sym] ?? null;
}

/**
 * Simuliert den DEA auf einem Wort.
 * @returns {{ok:boolean, accepted:boolean, tokens:string[], path:(string|null)[], steps:{from,symbol,to}[], error?:string, deadAt:number|null}}
 * path[0] = Startzustand, path[i] = Zustand nach i Symbolen; null = Fehlerzustand.
 */
export function runDFA(A, word) {
  const tk = tokenize(word, A.alphabet);
  if (!tk.ok) return { ok: false, accepted: false, tokens: tk.tokens, path: [A.start], steps: [], error: tk.message, deadAt: null };
  const path = [A.start];
  const steps = [];
  let cur = A.start;
  let deadAt = null;
  tk.tokens.forEach((sym, i) => {
    const next = step(A, cur, sym);
    steps.push({ from: cur, symbol: sym, to: next });
    if (next == null && deadAt == null) deadAt = i;
    cur = next;
    path.push(cur);
  });
  return { ok: true, accepted: cur != null && A.accepting.includes(cur), tokens: tk.tokens, path, steps, deadAt };
}

export const accepts = (A, word) => runDFA(A, word).accepted;

/** Zustandsfolge als Text im Stil „S0 –a→ S1 –b→ S2“. */
export function runToText(run, errorName = 'Fehlerzustand') {
  let s = run.path[0] ?? errorName;
  run.steps.forEach((st) => { s += ` –${st.symbol}→ ${st.to ?? errorName}`; });
  return s;
}

/** Vollständigkeit: fehlende (Zustand, Symbol)-Paare. */
export function completeness(A) {
  const missing = [];
  for (const s of A.states) for (const a of A.alphabet) if (A.delta[s]?.[a] == null) missing.push([s, a]);
  return { complete: missing.length === 0, missing };
}

/** Liefert einen vollständigen DEA (Fehlerzustand explizit ergänzt, falls nötig). */
export function completeDFA(A, errorName = ERROR_STATE) {
  const { complete } = completeness(A);
  if (complete) return A;
  let name = errorName; let k = 1;
  while (A.states.includes(name)) name = `${errorName}${k++}`;
  const delta = {};
  for (const s of A.states) delta[s] = { ...A.delta[s] };
  delta[name] = {};
  for (const s of [...A.states, name]) for (const a of A.alphabet) if (delta[s][a] == null) delta[s][a] = name;
  return { ...A, states: [...A.states, name], delta, implicitError: false, errorState: name };
}

/** Komplement: End- und Nicht-Endzustände tauschen (vorher vervollständigen!). */
export function complementDFA(A) {
  const C = completeDFA(A);
  return { ...C, accepting: C.states.filter((s) => !C.accepting.includes(s)) };
}

/** Vom Startzustand erreichbare Zustände. */
export function reachableStates(A) {
  const seen = new Set([A.start]);
  const queue = [A.start];
  while (queue.length) {
    const s = queue.shift();
    for (const a of A.alphabet) { const t = A.delta[s]?.[a]; if (t != null && !seen.has(t)) { seen.add(t); queue.push(t); } }
  }
  return A.states.filter((s) => seen.has(s));
}

/**
 * Äquivalenzprüfung per Breitensuche im Produktautomaten.
 * Fehlende Übergänge führen jeweils in einen (impliziten) Fehlerzustand.
 * @returns {{equivalent:boolean, counterexample?:string[], word?:string, acceptedByA?:boolean, acceptedByB?:boolean}}
 * Das Gegenbeispiel ist ein kürzestes Wort, auf dem sich A und B unterscheiden.
 */
export function equivalent(A, B) {
  const alphabet = [...new Set([...A.alphabet, ...B.alphabet])];
  const key = (p, q) => `${p ?? '∅'}\u0000${q ?? '∅'}`;
  const acc = (M, s) => s != null && M.accepting.includes(s);
  const start = [A.start, B.start];
  const prev = new Map([[key(...start), null]]);
  const queue = [start];
  while (queue.length) {
    const [p, q] = queue.shift();
    if (acc(A, p) !== acc(B, q)) {
      const word = [];
      let k = key(p, q);
      while (prev.get(k)) { const { from, sym } = prev.get(k); word.unshift(sym); k = from; }
      return { equivalent: false, counterexample: word, word: wordToString(word, alphabet), acceptedByA: acc(A, p), acceptedByB: acc(B, q) };
    }
    for (const a of alphabet) {
      const np = A.alphabet.includes(a) ? step(A, p, a) : null;
      const nq = B.alphabet.includes(a) ? step(B, q, a) : null;
      const k2 = key(np, nq);
      if (!prev.has(k2)) { prev.set(k2, { from: key(p, q), sym: a }); queue.push([np, nq]); }
    }
  }
  return { equivalent: true };
}

/**
 * Minimierung per Markierungsverfahren (Tabellenverfahren).
 * 1. nicht erreichbare Zustände entfernen, 2. vervollständigen, 3. Paare (End/Nicht-End) markieren,
 * 4. wiederholt Folgepaare prüfen, 5. unmarkierte Paare zusammenfassen.
 * @returns {{ dfa, removedUnreachable:string[], addedErrorState:string|null, pairs:{p,q,marked,round,reason,symbol,via}[],
 *            steps:{round,p,q,reason,symbol?,via?}[], rounds:number, classes:string[][] }}
 */
export function minimizeDFA(A0, { mergedName = (members) => members.join('') } = {}) {
  const reach = reachableStates(A0);
  const removedUnreachable = A0.states.filter((s) => !reach.includes(s));
  let A = { ...A0, states: reach, accepting: A0.accepting.filter((s) => reach.includes(s)), delta: Object.fromEntries(reach.map((s) => [s, { ...A0.delta[s] }])) };
  const C = completeDFA(A);
  const addedErrorState = C.errorState ?? null;
  A = C;
  const S = A.states;
  const isF = (s) => A.accepting.includes(s);
  const pairKey = (p, q) => (S.indexOf(p) < S.indexOf(q) ? `${p}|${q}` : `${q}|${p}`);
  const pairs = new Map();
  for (let i = 0; i < S.length; i++) for (let j = i + 1; j < S.length; j++) pairs.set(pairKey(S[i], S[j]), { p: S[i], q: S[j], marked: false, round: null, reason: null });
  const steps = [];
  for (const pr of pairs.values()) {
    if (isF(pr.p) !== isF(pr.q)) { Object.assign(pr, { marked: true, round: 0, reason: 'endzustand' }); steps.push({ round: 0, p: pr.p, q: pr.q, reason: 'endzustand' }); }
  }
  let round = 0; let changed = true;
  while (changed) {
    changed = false; round++;
    const newly = [];
    for (const pr of pairs.values()) {
      if (pr.marked) continue;
      for (const a of A.alphabet) {
        const x = A.delta[pr.p][a]; const y = A.delta[pr.q][a];
        if (x === y) continue;
        const other = pairs.get(pairKey(x, y));
        if (other && other.marked && other.round < round) {
          newly.push([pr, a, [x, y]]);
          break;
        }
      }
    }
    for (const [pr, a, via] of newly) {
      Object.assign(pr, { marked: true, round, reason: 'folgepaar', symbol: a, via });
      steps.push({ round, p: pr.p, q: pr.q, reason: 'folgepaar', symbol: a, via });
      changed = true;
    }
  }
  // Klassen bilden (Union-Find über unmarkierte Paare)
  const parent = Object.fromEntries(S.map((s) => [s, s]));
  const find = (s) => (parent[s] === s ? s : (parent[s] = find(parent[s])));
  for (const pr of pairs.values()) if (!pr.marked) { const a = find(pr.p); const b = find(pr.q); if (a !== b) parent[b] = a; }
  const groups = new Map();
  for (const s of S) { const r = find(s); if (!groups.has(r)) groups.set(r, []); groups.get(r).push(s); }
  const classes = [...groups.values()];
  const nameOf = new Map();
  for (const c of classes) { const n = c.length === 1 ? c[0] : mergedName(c); for (const s of c) nameOf.set(s, n); }
  const delta = {};
  for (const c of classes) { const n = nameOf.get(c[0]); delta[n] = {}; for (const a of A.alphabet) delta[n][a] = nameOf.get(A.delta[c[0]][a]); }
  const states = classes.map((c) => nameOf.get(c[0]));
  const minimal = { type: 'dfa', alphabet: A.alphabet, states, start: nameOf.get(A.start), accepting: [...new Set(A.accepting.map((s) => nameOf.get(s)))], delta, implicitError: false };
  return { dfa: minimal, removedUnreachable, addedErrorState, pairs: [...pairs.values()], steps, rounds: round - 1, classes };
}

/** Anzahl der Zustände des Minimalautomaten (inkl. Fehlerzustand, falls nötig). */
export const minimalStateCount = (A) => minimizeDFA(A).dfa.states.length;

/**
 * Erzeugt Wörter, die akzeptiert (wantAccept=true) bzw. abgelehnt werden, mit vorgegebener Länge.
 * Nutzt Erreichbarkeitstabellen, damit die Erzeugung nie „hängen“ bleibt. Liefert null, wenn unmöglich.
 */
export function randomWord(A, { length, wantAccept, rng = makeRng() }) {
  // can[k][s]: von s aus in genau k Schritten ein gewünschter Zustand erreichbar? (s = null → Fehlerzustand)
  const all = [...A.states, null];
  const goal = (s) => (s != null && A.accepting.includes(s)) === wantAccept;
  const can = [new Map(all.map((s) => [s, goal(s)]))];
  for (let k = 1; k <= length; k++) {
    const m = new Map();
    for (const s of all) m.set(s, A.alphabet.some((a) => can[k - 1].get(step(A, s, a))));
    can.push(m);
  }
  if (!can[length].get(A.start)) return null;
  const word = [];
  let cur = A.start;
  for (let i = length; i > 0; i--) {
    const options = A.alphabet.filter((a) => can[i - 1].get(step(A, cur, a)));
    const a = rng.pick(options);
    word.push(a);
    cur = step(A, cur, a);
  }
  return word;
}

/** Kürzestes akzeptiertes Wort (oder null bei leerer Sprache). */
export function shortestAccepted(A) {
  const prev = new Map([[A.start, null]]);
  const q = [A.start];
  while (q.length) {
    const s = q.shift();
    if (A.accepting.includes(s)) {
      const w = []; let k = s;
      while (prev.get(k)) { w.unshift(prev.get(k).sym); k = prev.get(k).from; }
      return w;
    }
    for (const a of A.alphabet) { const t = step(A, s, a); if (t != null && !prev.has(t)) { prev.set(t, { from: s, sym: a }); q.push(t); } }
  }
  return null;
}

/** Wandelt eine Übergangstabelle (Array von Zeilen) in das delta-Format um – Hilfe für Datenautoren. */
export function fromTable(alphabet, rows, { start, accepting, implicitError } = {}) {
  // rows: [['S0', 'S1', 'S0'], …] – erste Spalte Zustand, danach je Symbol in Σ-Reihenfolge; '-' = fehlt
  const delta = {};
  for (const [s, ...targets] of rows) {
    delta[s] = {};
    targets.forEach((t, i) => { if (t && t !== '-' && t !== '–') delta[s][alphabet[i]] = t; });
  }
  return normalizeDFA({ alphabet, states: rows.map((r) => r[0]), start: start ?? rows[0][0], accepting, delta, implicitError });
}

/**
 * Benennt die Zustände in Breitensuche-Reihenfolge ab dem Startzustand um (S0, S1, …).
 * Nicht erreichbare Zustände werden entfernt. Praktisch nach Teilmengenkonstruktion/Minimierung.
 */
export function renameStates(A, prefix = 'S') {
  const order = [];
  const seen = new Set([A.start]);
  const q = [A.start];
  while (q.length) {
    const s = q.shift(); order.push(s);
    for (const a of A.alphabet) { const t = A.delta[s]?.[a]; if (t != null && !seen.has(t)) { seen.add(t); q.push(t); } }
  }
  const name = new Map(order.map((s, i) => [s, `${prefix}${i}`]));
  const delta = {};
  for (const s of order) {
    delta[name.get(s)] = {};
    for (const a of A.alphabet) { const t = A.delta[s]?.[a]; if (t != null) delta[name.get(s)][a] = name.get(t); }
  }
  return { ...A, states: order.map((s) => name.get(s)), start: name.get(A.start), accepting: A.accepting.filter((s) => name.has(s)).map((s) => name.get(s)), delta, renamedFrom: Object.fromEntries([...name].map(([k, v]) => [v, k])) };
}

/** Minimaler DEA ohne expliziten Fehlerzustand (falls einer nötig ist, wird er implizit). */
export function minimalWithImplicitError(A) {
  const m = minimizeDFA(A).dfa;
  // „toten“ Zustand (nicht End-, alle Übergänge auf sich selbst) entfernen
  const dead = m.states.filter((s) => !m.accepting.includes(s) && m.alphabet.every((a) => m.delta[s][a] === s));
  if (!dead.length || dead.includes(m.start)) return renameStates(m);
  const delta = {};
  for (const s of m.states) if (!dead.includes(s)) { delta[s] = {}; for (const a of m.alphabet) if (!dead.includes(m.delta[s][a])) delta[s][a] = m.delta[s][a]; }
  return renameStates({ ...m, states: m.states.filter((s) => !dead.includes(s)), delta, implicitError: true });
}

/** Serialisierung für Export/Import (Sandbox). */
export function toJSON(A) {
  return { alphabet: A.alphabet, states: A.states, start: A.start, accepting: A.accepting, delta: A.delta, implicitError: !!A.implicitError };
}
