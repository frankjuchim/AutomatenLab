// Markierungsverfahren als Spiel (Minimierer, DS05) – reine Logik, DOM-frei, in Node testbar.
//
//   const T = markierungsTabelle(A);         // A: normalisierter DEA (darf unvollständig sein)
//   T.states, T.pairs ([{key, p, q}]), T.A (erreichbar + vervollständigt), T.addedErrorState
//   folgepaare(T, key)                       // Hilfe: je Zeichen das Folgepaar (oder „gleicher Zustand“)
//   pruefeRunde(T, vorher, spieler, runde)   // Runde prüfen (siehe unten)
//
// Runden wie im Unterricht: Runde 0 = Paare (Endzustand, Nicht-Endzustand); Runde r ≥ 1 = alle noch
// unmarkierten Paare, die mit einem Zeichen in ein (bis Runde r−1) markiertes Paar übergehen.
// Großzügig: Ein Paar, das erst durch ein in DERSELBEN Runde markiertes Paar begründet ist, gilt
// nicht als Fehler („vorgezogen“) – fehlen darf aber keines der Pflichtpaare.

import { reachableStates, completeDFA } from './dfa.js';

export function markierungsTabelle(A0) {
  const reach = reachableStates(A0);
  const A1 = { ...A0, states: reach, accepting: A0.accepting.filter((s) => reach.includes(s)),
    delta: Object.fromEntries(reach.map((s) => [s, { ...A0.delta[s] }])) };
  const A = completeDFA(A1);
  const S = A.states;
  const key = (p, q) => (S.indexOf(p) < S.indexOf(q) ? `${p}|${q}` : `${q}|${p}`);
  const pairs = [];
  for (let i = 0; i < S.length; i++) for (let j = i + 1; j < S.length; j++) pairs.push({ key: `${S[i]}|${S[j]}`, p: S[i], q: S[j] });
  return { A, states: S, pairs, key, byKey: new Map(pairs.map((x) => [x.key, x])),
    addedErrorState: A.errorState ?? null, removedUnreachable: A0.states.filter((s) => !reach.includes(s)) };
}

const isF = (T, s) => T.A.accepting.includes(s);

/** Folgepaare je Zeichen: [{symbol, x, y, key|null}] (key null = beide im selben Zustand). */
export function folgepaare(T, pairKey) {
  const { p, q } = T.byKey.get(pairKey);
  return T.A.alphabet.map((a) => {
    const x = T.A.delta[p][a]; const y = T.A.delta[q][a];
    return { symbol: a, x, y, key: x === y ? null : T.key(x, y) };
  });
}

/** Begründung: erstes Zeichen, das in ein Paar aus `marked` führt (oder null). */
export function begruendung(T, pairKey, marked) {
  return folgepaare(T, pairKey).find((f) => f.key && marked.has(f.key)) ?? null;
}

/**
 * Prüft eine Runde.
 * @param {object} T
 * @param {Set<string>} vorher   in früheren Runden (bestätigt) markierte Paare
 * @param {Set<string>} spieler  in dieser Runde neu markierte Paare
 * @param {number} runde         0, 1, 2, …
 * @returns {{ok, falsch:string[], fehlend:string[], vorgezogen:string[], fertig:boolean, pflicht:string[]}}
 *   fertig = true, wenn in dieser Runde nichts mehr zu markieren war (Verfahren beendet)
 */
export function pruefeRunde(T, vorher, spieler, runde) {
  let pflicht; const gueltig = new Set();
  if (runde === 0) {
    pflicht = T.pairs.filter((x) => isF(T, x.p) !== isF(T, x.q)).map((x) => x.key);
    for (const k of spieler) if (pflicht.includes(k)) gueltig.add(k);
  } else {
    pflicht = T.pairs.filter((x) => !vorher.has(x.key) && begruendung(T, x.key, vorher)).map((x) => x.key);
    let changed = true;
    while (changed) {
      changed = false;
      const basis = new Set([...vorher, ...gueltig]);
      for (const k of spieler) if (!gueltig.has(k) && !vorher.has(k) && begruendung(T, k, basis)) { gueltig.add(k); changed = true; }
    }
  }
  const falsch = [...spieler].filter((k) => !gueltig.has(k));
  const fehlend = pflicht.filter((k) => !spieler.has(k));
  const vorgezogen = [...gueltig].filter((k) => !pflicht.includes(k));
  const ok = falsch.length === 0 && fehlend.length === 0;
  return { ok, falsch, fehlend, vorgezogen, pflicht, fertig: ok && runde > 0 && pflicht.length === 0 && spieler.size === 0 };
}

/** Vollständige Lösung (synchrone Runden) – für Tests und „Lösung zeigen“. */
export function loesung(T) {
  const marked = new Map(); // key → Runde
  let runde = 0;
  for (;;) {
    const vorher = new Set(marked.keys());
    const r = pruefeRunde(T, vorher, new Set(), runde);
    if (!r.pflicht.length) break;
    for (const k of r.pflicht) marked.set(k, runde);
    runde++;
  }
  return { marked, runden: runde, unmarkiert: T.pairs.map((x) => x.key).filter((k) => !marked.has(k)) };
}

/** Lauf ab einem beliebigen Zustand (für „Unterscheide!“): {path, end, accepted}. Fehlende Übergänge → Fehlerzustand. */
export function laufAb(A, state, tokens) {
  const path = [state]; let cur = state;
  for (const a of tokens) { cur = cur == null ? null : (A.delta[cur]?.[a] ?? null); path.push(cur); }
  return { path, end: cur, accepted: cur != null && A.accepting.includes(cur) };
}

/** Kürzestes unterscheidendes Wort für p, q (oder null bei äquivalenten Zuständen). */
export function unterscheidendesWort(A, p, q) {
  const k = (x, y) => `${x ?? '∅'}\u0000${y ?? '∅'}`;
  const acc = (s) => s != null && A.accepting.includes(s);
  const prev = new Map([[k(p, q), null]]);
  const queue = [[p, q]];
  while (queue.length) {
    const [x, y] = queue.shift();
    if (acc(x) !== acc(y)) {
      const w = []; let kk = k(x, y);
      while (prev.get(kk)) { const { from, sym } = prev.get(kk); w.unshift(sym); kk = from; }
      return w;
    }
    for (const a of A.alphabet) {
      const nx = x == null ? null : (A.delta[x]?.[a] ?? null);
      const ny = y == null ? null : (A.delta[y]?.[a] ?? null);
      const k2 = k(nx, ny);
      if (!prev.has(k2)) { prev.set(k2, { from: k(x, y), sym: a }); queue.push([nx, ny]); }
    }
  }
  return null;
}
