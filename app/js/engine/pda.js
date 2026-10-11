// Nichtdeterministische Kellerautomaten (NKA) – Notation nach den Ergänzenden Hinweisen 2025:
//   Kante „(oberstes Kellerzeichen, Eingabezeichen) : abzulegende Zeichen“, z. B. (#, a) : A#
//   • Das gelesene oberste Kellerzeichen wird entfernt.
//   • Die abzulegenden Zeichen werden so abgelegt, dass das am weitesten rechts notierte zuerst
//     abgelegt wird → bei „A#“ liegt danach A oben.  „ε“ = nichts ablegen.
//   • Vorbelegung des Kellers: #.  ε-Übergänge (ohne Eingabezeichen) sind möglich: (#, ε) : #
//   • Akzeptanz: Es gibt einen Lauf, nach dem die Eingabe vollständig verarbeitet ist und der
//     Automat in einem Endzustand steht (NICHT „Keller leer“).
// Datenformat:
// {
//   inputAlphabet: ['a','b'], stackAlphabet: ['#','A'], initial: '#',
//   states: ['S0','S1','S2'], start: 'S0', accepting: ['S2'],
//   transitions: [
//     'S0 -> S0 : (#, a) : A#',                 // Kurzform als Text
//     { from:'S0', to:'S1', top:'A', input:'b', push:'ε' },   // oder als Objekt
//   ]
// }

import { tokenize, isEpsilon, EPS } from './tokenize.js';

/** Liest „S0 -> S1 : (#, a) : A#“ (auch „→“). */
export function parsePdaTransition(text) {
  const m = String(text).match(/^\s*([^\s:>→-]+)\s*(?:->|→)\s*([^\s:]+)\s*:\s*\(\s*([^,\s]+)\s*,\s*(\S+?)\s*\)\s*:\s*(\S*)\s*$/); // Eingabezeichen darf auch „)“ sein
  if (!m) throw new Error(`NKA: Übergang „${text}“ nicht lesbar. Erwartet z. B. „S0 -> S1 : (#, a) : A#“.`);
  return { from: m[1], to: m[2], top: m[3], input: m[4], push: m[5] };
}

export function normalizePDA(spec) {
  const inputAlphabet = [...(spec.inputAlphabet ?? spec.alphabet)].map(String);
  if (inputAlphabet.some(isEpsilon)) throw new Error('NKA: ε ist kein Zeichen des Eingabealphabets.');
  const initial = String(spec.initial ?? '#');
  const stackAlphabet = [...new Set([initial, ...(spec.stackAlphabet ?? [])].map(String))];
  const states = [...(spec.states ?? [])].map(String);
  const transitions = (spec.transitions ?? []).map((t, i) => {
    const o = typeof t === 'string' ? parsePdaTransition(t) : { ...t };
    const input = isEpsilon(o.input) ? EPS : String(o.input);
    if (input !== EPS && !inputAlphabet.includes(input)) throw new Error(`NKA: Eingabezeichen „${input}“ (Übergang ${i + 1}) ist nicht in Σ.`);
    const top = String(o.top);
    if (!stackAlphabet.includes(top)) throw new Error(`NKA: Kellerzeichen „${top}“ (Übergang ${i + 1}) ist nicht in Γ.`);
    const pushText = isEpsilon(o.push) ? '' : String(o.push);
    const tk = tokenize(pushText, stackAlphabet);
    if (!tk.ok) throw new Error(`NKA: Ablage „${pushText}“ (Übergang ${i + 1}) enthält Zeichen außerhalb von Γ.`);
    for (const s of [o.from, o.to]) if (!states.includes(String(s))) states.push(String(s));
    return { id: i, from: String(o.from), to: String(o.to), top, input, push: tk.tokens, pushLabel: pushText === '' ? EPS : pushText };
  });
  return { ...spec, type: 'pda', inputAlphabet, alphabet: inputAlphabet, stackAlphabet, initial, states,
    start: String(spec.start ?? states[0]), accepting: [...(spec.accepting ?? [])].map(String), transitions };
}

export const pda = (spec) => normalizePDA(spec);

/** Kantenbeschriftung im Abi-Format. */
export const transitionLabel = (t) => `(${t.top}, ${t.input}) : ${t.pushLabel}`;

/** Startkonfiguration. Keller als Array, Index 0 = oberstes Zeichen. */
export const initialConfig = (P) => ({ state: P.start, pos: 0, stack: [P.initial] });

/** Alle Nachfolgekonfigurationen (mit verwendetem Übergang). */
export function successors(P, config, tokens) {
  const out = [];
  if (config.stack.length === 0) return out; // ohne oberstes Kellerzeichen ist kein Übergang möglich
  const top = config.stack[0];
  for (const t of P.transitions) {
    if (t.from !== config.state || t.top !== top) continue;
    if (t.input === EPS) out.push({ t, config: { state: t.to, pos: config.pos, stack: [...t.push, ...config.stack.slice(1)] } });
    else if (config.pos < tokens.length && tokens[config.pos] === t.input) out.push({ t, config: { state: t.to, pos: config.pos + 1, stack: [...t.push, ...config.stack.slice(1)] } });
  }
  return out;
}

/** Ist der Automat deterministisch (DKA)? Je (Zustand, Kellerzeichen) höchstens eine Wahl, ε-Übergang schließt Eingabe-Übergänge aus. */
export function isDeterministic(P) {
  const seen = new Map();
  for (const t of P.transitions) {
    const k = `${t.from}|${t.top}`;
    if (!seen.has(k)) seen.set(k, []);
    seen.get(k).push(t.input);
  }
  for (const inputs of seen.values()) {
    if (new Set(inputs).size !== inputs.length) return false;
    if (inputs.includes(EPS) && inputs.length > 1) return false;
  }
  return true;
}

/**
 * Akzeptanzprüfung per Breitensuche über Konfigurationen (mit Schranke).
 * @param {object} P   normalisierter NKA
 * @param {string|string[]} word
 * @param {{maxConfigs?:number, maxStack?:number}} opts
 * @returns {{ok, accepted, tokens, run:{config,t}[]|null, table:{zustand,keller,oberstes,eingabe}[]|null,
 *            exhausted:boolean, explored:number, longest:{config,t}[], error?}}
 *   run   = akzeptierender Lauf (Startkonfiguration zuerst; t = verwendeter Übergang, beim Start null)
 *   table = derselbe Lauf im Abi-Tabellenformat
 *   exhausted = true, wenn die Schranke erreicht wurde (Ergebnis „nicht akzeptiert“ dann nicht sicher)
 *   longest = ein Lauf, der möglichst viel der Eingabe verarbeitet (zur Erklärung bei Ablehnung)
 */
export function runPDA(P, word, { maxConfigs = 50000, maxStack } = {}) {
  const tk = tokenize(word, P.inputAlphabet);
  if (!tk.ok) return { ok: false, accepted: false, tokens: tk.tokens, run: null, table: null, exhausted: false, explored: 0, longest: [], error: tk.message };
  const tokens = tk.tokens;
  const limitStack = maxStack ?? Math.max(16, 3 * tokens.length + 8);
  const key = (c) => `${c.state}|${c.pos}|${c.stack.join('\u0001')}`;
  const start = initialConfig(P);
  const nodes = [{ config: start, t: null, parent: -1 }];
  const seen = new Set([key(start)]);
  let exhausted = false;
  let best = 0;
  for (let i = 0; i < nodes.length; i++) {
    const { config } = nodes[i];
    if (config.pos === tokens.length && P.accepting.includes(config.state)) {
      const run = chain(nodes, i);
      return { ok: true, accepted: true, tokens, run, table: runToTable(run), exhausted: false, explored: nodes.length, longest: run };
    }
    if (config.pos > nodes[best].config.pos) best = i;
    for (const s of successors(P, config, tokens)) {
      if (s.config.stack.length > limitStack) { exhausted = true; continue; }
      const k = key(s.config);
      if (seen.has(k)) continue;
      if (nodes.length >= maxConfigs) { exhausted = true; break; }
      seen.add(k);
      nodes.push({ config: s.config, t: s.t, parent: i });
    }
  }
  const longest = chain(nodes, best);
  return { ok: true, accepted: false, tokens, run: null, table: null, exhausted, explored: nodes.length, longest, longestTable: runToTable(longest) };
}

function chain(nodes, i) {
  const out = [];
  while (i >= 0) { out.unshift({ config: nodes[i].config, t: nodes[i].t }); i = nodes[i].parent; }
  return out;
}

/**
 * Lauf → Tabelle im Abi-Format:
 * | Zustand | Belegung Kellerspeicher (oberstes links) | oberstes Kellersymbol | verarbeitetes Eingabezeichen |
 * Erste Zeile: S0 | # | – | –
 */
export function runToTable(run) {
  return run.map(({ config, t }) => ({
    zustand: config.state,
    keller: config.stack.length ? config.stack.join('') : EPS,
    oberstes: t ? t.top : '–',
    eingabe: t ? t.input : '–',
  }));
}

export const accepts = (P, word, opts) => runPDA(P, word, opts).accepted;

/** Eindeutiger Schlüssel einer Konfiguration (Zustand, gelesene Zeichen, Keller). */
export const configKey = (c) => `${c.state}|${c.pos}|${c.stack.join('\u0001')}`;

/**
 * Wie runPDA, aber ab einer beliebigen Konfiguration (z. B. mitten im Lauf im Keller-Labor:
 * „Gibt es von hier aus noch einen akzeptierenden Lauf?“). tokens = bereits zerlegtes Wort.
 * @returns {{accepted:boolean, run:{config,t}[]|null, exhausted:boolean}}  run beginnt mit der Startkonfiguration
 */
export function searchFrom(P, tokens, config, { maxConfigs = 50000, maxStack } = {}) {
  const limitStack = maxStack ?? Math.max(16, 3 * tokens.length + 8);
  const nodes = [{ config, t: null, parent: -1 }];
  const seen = new Set([configKey(config)]);
  let exhausted = false;
  for (let i = 0; i < nodes.length; i++) {
    const c = nodes[i].config;
    if (c.pos === tokens.length && P.accepting.includes(c.state)) return { accepted: true, run: chain(nodes, i), exhausted: false };
    for (const s of successors(P, c, tokens)) {
      if (s.config.stack.length > limitStack) { exhausted = true; continue; }
      const k = configKey(s.config);
      if (seen.has(k)) continue;
      if (nodes.length >= maxConfigs) { exhausted = true; break; }
      seen.add(k);
      nodes.push({ config: s.config, t: s.t, parent: i });
    }
  }
  return { accepted: false, run: null, exhausted };
}

/**
 * Rückwärts-Aufgabe (Abi 2022 C c): Passt das Eingabewort zur gegebenen Folge von
 * Konfigurationen [{state, stack}] (stack: Array, Index 0 = oben)? Sucht per Tiefensuche Übergänge,
 * die jeweils von einer Konfiguration zur nächsten führen und dabei genau das Wort verbrauchen.
 * @returns {{ok:boolean, transitions?:object[], reason?:string, at?:number}}
 */
export function matchesConfigSequence(P, tokens, seq) {
  const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
  let deepest = 0;
  const dfs = (i, pos, used) => {
    deepest = Math.max(deepest, i);
    if (i === seq.length - 1) return pos === tokens.length ? used : null;
    const cur = { state: seq[i].state, pos, stack: seq[i].stack };
    for (const s of successors(P, cur, tokens)) {
      if (s.config.state !== seq[i + 1].state || !same(s.config.stack, seq[i + 1].stack)) continue;
      const r = dfs(i + 1, s.config.pos, [...used, s.t]);
      if (r) return r;
    }
    return null;
  };
  const r = dfs(0, 0, []);
  return r ? { ok: true, transitions: r } : { ok: false, at: deepest };
}
