// Turingmaschinen (Ausblick DS16): beidseitig unendliches Band, Blank = □, Kopf liest/schreibt ein Feld.
// Datenformat:
// {
//   alphabet: ['0', '1'],                  // Eingabealphabet Σ
//   tapeAlphabet: ['0', '1', '□'],         // Bandalphabet Γ (Σ ⊂ Γ, □ ∈ Γ) – optional, wird sonst ergänzt
//   start: 'S0', accepting: ['S2'],        // Endzustände (Halten in einem Endzustand = akzeptiert)
//   delta: { S0: { '0': ['S0', '0', 'R'], '□': ['S1', '□', 'L'] }, … }
//          Übergang (Zustand, gelesen) → [Folgezustand, geschrieben, Bewegung L|R|N]
// }
// Es gibt keinen Übergang → die Maschine hält. Hält sie in einem Endzustand, ist die Eingabe akzeptiert.
// Konfiguration: { state, tape: Map<index, symbol>, head }. Nicht beschriebene Felder enthalten □.

export const BLANK = '□';
export const MOVES = ['L', 'R', 'N'];

export function normalizeTM(spec) {
  const alphabet = [...spec.alphabet].map(String);
  if (alphabet.includes(BLANK)) throw new Error('TM: □ ist kein Zeichen des Eingabealphabets.');
  const states = [...(spec.states ?? Object.keys(spec.delta ?? {}))].map(String);
  const delta = {};
  const ensure = (s) => { if (!delta[s]) { delta[s] = {}; if (!states.includes(s)) states.push(s); } };
  states.forEach(ensure);
  const tapeAlphabet = new Set([...alphabet, ...(spec.tapeAlphabet ?? []).map(String), BLANK]);
  for (const [from, row] of Object.entries(spec.delta ?? {})) {
    ensure(from);
    for (const [key, tr] of Object.entries(row ?? {})) {
      if (!tr) continue;
      const parts = Array.isArray(tr) ? tr : String(tr).split(/\s*[,/]\s*/);
      if (parts.length !== 3) throw new Error(`TM: Übergang ${from} / „${key}“ braucht (Zustand, Zeichen, Bewegung).`);
      const [to, write, move] = parts.map(String);
      if (!MOVES.includes(move)) throw new Error(`TM: Bewegung „${move}“ (bei ${from}) muss L, R oder N sein.`);
      ensure(to);
      for (const sym of key.split(',').map((x) => x.trim()).filter(Boolean)) {
        tapeAlphabet.add(sym); tapeAlphabet.add(write);
        delta[from][sym] = { to, write, move };
      }
    }
  }
  const start = String(spec.start ?? states[0]);
  if (!delta[start]) throw new Error(`TM: Startzustand „${start}“ existiert nicht.`);
  return { ...spec, type: 'tm', alphabet, tapeAlphabet: [...tapeAlphabet], states, start, accepting: [...(spec.accepting ?? [])].map(String), delta };
}

export const tm = (spec) => normalizeTM(spec);

/** Startkonfiguration: Eingabe ab Feld 0, Kopf auf Feld 0. */
export function initialConfig(T, tokens) {
  const tape = new Map();
  tokens.forEach((s, i) => { if (s !== BLANK) tape.set(i, s); });
  return { state: T.start, tape, head: 0 };
}

export const readCell = (tape, i) => tape.get(i) ?? BLANK;

/** Ein Schritt. Liefert { config, t: { from, read, to, write, move } } oder null, wenn die Maschine hält. */
export function stepTM(T, c) {
  const read = readCell(c.tape, c.head);
  const tr = T.delta[c.state]?.[read];
  if (!tr) return null;
  const tape = new Map(c.tape);
  if (tr.write === BLANK) tape.delete(c.head); else tape.set(c.head, tr.write);
  const head = c.head + (tr.move === 'R' ? 1 : tr.move === 'L' ? -1 : 0);
  return { config: { state: tr.to, tape, head }, t: { from: c.state, read, to: tr.to, write: tr.write, move: tr.move } };
}

/**
 * Lauf bis zum Halten (oder maxSteps).
 * @returns {{ok, tokens, run:{config,t}[], halted:boolean, accepted:boolean, steps:number, output:string[], error?}}
 *   output = Bandinhalt ohne führende/abschließende Blanks nach dem Halten
 */
export function runTM(T, word, { maxSteps = 5000 } = {}) {
  const tokens = Array.isArray(word) ? [...word] : tokenizeTape(word, T);
  if (tokens === null) return { ok: false, tokens: [], run: [], halted: false, accepted: false, steps: 0, output: [], error: `Die Eingabe enthält Zeichen außerhalb von Σ = {${T.alphabet.join(', ')}}.` };
  let c = initialConfig(T, tokens);
  const run = [{ config: c, t: null }];
  let halted = false;
  for (let i = 0; i < maxSteps; i++) {
    const s = stepTM(T, c);
    if (!s) { halted = true; break; }
    c = s.config; run.push(s);
  }
  return { ok: true, tokens, run, halted, accepted: halted && T.accepting.includes(c.state), steps: run.length - 1, output: tapeContent(c.tape) };
}

/** Eingabetext → Symbole (Longest-Match über Σ, Leerzeichen trennen). null bei fremden Zeichen. */
export function tokenizeTape(text, T) {
  const s = String(text ?? '').trim();
  if (s === '' || s === 'ε') return [];
  const sorted = [...T.alphabet].sort((a, b) => b.length - a.length);
  const out = [];
  let i = 0;
  while (i < s.length) {
    if (s[i] === ' ') { i++; continue; }
    const hit = sorted.find((x) => s.startsWith(x, i));
    if (!hit) return null;
    out.push(hit); i += hit.length;
  }
  return out;
}

/** Bandinhalt vom kleinsten bis zum größten beschriebenen Feld (innere Blanks bleiben als □). */
export function tapeContent(tape) {
  const idx = [...tape.keys()];
  if (!idx.length) return [];
  const lo = Math.min(...idx); const hi = Math.max(...idx);
  const out = [];
  for (let i = lo; i <= hi; i++) out.push(readCell(tape, i));
  return out;
}

export const tapeToString = (tape) => tapeContent(tape).join('');

/** Kantenbeschriftung im Stil „0 / 1, R“ (gelesen / geschrieben, Bewegung). */
export const transitionLabel = (read, write, move) => `${read} / ${write}, ${move}`;

/** Zählt die Einsen auf dem Band (Fleißiger Biber). */
export const countOnes = (tape) => [...tape.values()].filter((v) => v === '1').length;

/** TM → Graph-Modell für GraphView (eine Kante je (from, to), mehrzeilig). */
export function tmToGraph(T) {
  const map = new Map();
  for (const s of T.states) for (const [read, tr] of Object.entries(T.delta[s] ?? {})) {
    const k = `${s}\u0000${tr.to}`;
    if (!map.has(k)) map.set(k, { from: s, to: tr.to, parts: [] });
    map.get(k).parts.push(transitionLabel(read, tr.write, tr.move));
  }
  return { kind: 'tm', states: [...T.states], start: T.start, accepting: [...T.accepting], edges: [...map.values()].map((e) => ({ from: e.from, to: e.to, label: e.parts.join('\n'), parts: e.parts })), implicitError: false };
}

/** Übergänge als Tabellenzeilen [{from, read, to, write, move}]. */
export function tmTable(T) {
  const rows = [];
  for (const s of T.states) for (const [read, tr] of Object.entries(T.delta[s] ?? {})) rows.push({ from: s, read, to: tr.to, write: tr.write, move: tr.move });
  return rows;
}
