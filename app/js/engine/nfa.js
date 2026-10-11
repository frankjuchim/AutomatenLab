// Nichtdeterministische endliche Automaten (NEA) mit ε-Übergängen
// Datenformat:
// {
//   alphabet: ['a','b'],                    // Σ (ε gehört NICHT dazu)
//   states: ['S0','S1','S2'],
//   start: 'S0',                            // (oder starts: ['S0','S3'] für mehrere Startzustände)
//   accepting: ['S2'],
//   delta: { S0: { a: ['S0','S1'], 'ε': ['S2'] }, … }   // Ziel: Zustand oder Array von Zuständen
// }
// Schlüssel dürfen Symbole zusammenfassen: { 'a, b': 'S0' }. ε darf auch als „eps“ notiert werden.

import { tokenize, EPS, isEpsilon } from './tokenize.js';

export function normalizeNFA(spec) {
  const alphabet = [...spec.alphabet].map(String);
  if (alphabet.some(isEpsilon)) throw new Error('NEA: ε ist kein Zeichen des Eingabealphabets.');
  const states = [...(spec.states ?? Object.keys(spec.delta ?? {}))].map(String);
  const delta = {};
  const ensure = (s) => { if (!delta[s]) { delta[s] = {}; if (!states.includes(s)) states.push(s); } };
  states.forEach(ensure);
  for (const [from, row] of Object.entries(spec.delta ?? {})) {
    ensure(from);
    for (const [key, to] of Object.entries(row ?? {})) {
      const syms = key.split(',').map((x) => x.trim()).filter((x) => x !== '' || key.trim() === '');
      for (let sym of syms) {
        if (isEpsilon(sym)) sym = EPS;
        else if (!alphabet.includes(sym)) throw new Error(`NEA: Symbol „${sym}“ ist nicht in Σ.`);
        const targets = (Array.isArray(to) ? to : [to]).map(String);
        targets.forEach(ensure);
        delta[from][sym] = [...new Set([...(delta[from][sym] ?? []), ...targets])];
      }
    }
  }
  const starts = (spec.starts ?? [spec.start ?? states[0]]).map(String);
  return { ...spec, type: 'nfa', alphabet, states, starts, start: starts[0], accepting: [...(spec.accepting ?? [])].map(String), delta };
}

export const nfa = (spec) => normalizeNFA(spec);

/** ε-Abschluss einer Zustandsmenge (als sortiertes Array in Zustandsreihenfolge). */
export function epsilonClosure(N, set) {
  const seen = new Set(set);
  const stack = [...set];
  while (stack.length) {
    const s = stack.pop();
    for (const t of N.delta[s]?.[EPS] ?? []) if (!seen.has(t)) { seen.add(t); stack.push(t); }
  }
  return N.states.filter((s) => seen.has(s));
}

/** Menge der Zustände nach Lesen von sym (inkl. ε-Abschluss). */
export function stepSet(N, set, sym) {
  const next = new Set();
  for (const s of set) for (const t of N.delta[s]?.[sym] ?? []) next.add(t);
  return epsilonClosure(N, [...next]);
}

/**
 * Simulation mit Menge aktiver Zustände („Parallelwelten“).
 * @returns {{ok, accepted, tokens, sets:string[][], error?}} sets[0] = ε-Abschluss der Startzustände
 */
export function runNFA(N, word) {
  const tk = tokenize(word, N.alphabet);
  if (!tk.ok) return { ok: false, accepted: false, tokens: tk.tokens, sets: [], error: tk.message };
  let cur = epsilonClosure(N, N.starts);
  const sets = [cur];
  for (const a of tk.tokens) { cur = stepSet(N, cur, a); sets.push(cur); }
  return { ok: true, accepted: cur.some((s) => N.accepting.includes(s)), tokens: tk.tokens, sets };
}

export const setName = (set) => (set.length === 0 ? '∅' : `{${set.join(',')}}`);

/**
 * Teilmengenkonstruktion (Potenzmengenkonstruktion).
 * @param {object} N
 * @param {{includeEmpty?:boolean}} opts  includeEmpty: ∅ als expliziten (Fehler-)Zustand aufnehmen (Standard: nein → implizit)
 * @returns {{dfa, table:{set:string[], name:string, accepting:boolean, targets:Object<string,string[]>}[]}}
 */
export function subsetConstruction(N, { includeEmpty = false } = {}) {
  const startSet = epsilonClosure(N, N.starts);
  const key = (set) => set.join('\u0000');
  const sets = new Map([[key(startSet), startSet]]);
  const queue = [startSet];
  const table = [];
  while (queue.length) {
    const set = queue.shift();
    const row = { set, name: setName(set), accepting: set.some((s) => N.accepting.includes(s)), targets: {} };
    for (const a of N.alphabet) {
      const t = stepSet(N, set, a);
      row.targets[a] = t;
      if (t.length === 0 && !includeEmpty) continue;
      if (!sets.has(key(t))) { sets.set(key(t), t); queue.push(t); }
    }
    table.push(row);
  }
  const delta = {};
  for (const row of table) {
    delta[row.name] = {};
    for (const a of N.alphabet) {
      const t = row.targets[a];
      if (t.length === 0 && !includeEmpty) continue;
      delta[row.name][a] = setName(t);
    }
  }
  const dfaOut = {
    type: 'dfa', alphabet: N.alphabet, states: table.map((r) => r.name), start: setName(startSet),
    accepting: table.filter((r) => r.accepting).map((r) => r.name), delta,
    implicitError: !includeEmpty && table.some((r) => N.alphabet.some((a) => r.targets[a].length === 0)),
  };
  return { dfa: dfaOut, table };
}

/**
 * Nur „Figuren ziehen“: Zielmenge nach Lesen von sym OHNE ε-Abschluss (für die Schrittanzeige
 * „erst lesen, dann ε-Übergänge folgen“). Liefert die Zustände in Zustandsreihenfolge.
 */
export function moveSet(N, set, sym) {
  const next = new Set();
  for (const s of set) for (const t of N.delta[s]?.[sym] ?? []) next.add(t);
  return N.states.filter((s) => next.has(s));
}
