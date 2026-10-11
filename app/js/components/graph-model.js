// Reine Funktionen (ohne DOM): Automat → Graph-Modell → DOT-Text im Abi-Stil.
// Wird von GraphView benutzt und ist in Node testbar (tests/graph.test.js).
//
// Graph-Modell (gemeinsam für alle Automatentypen):
// {
//   states:   ['S0','S1'],          // Reihenfolge = Reihenfolge im DOT (beeinflusst das Layout leicht)
//   start:    'S0' | null,          // null → kein Startpfeil
//   accepting:['S1'],               // Doppelkreis
//   edges:    [{ from, to, label }] // EINE Kante je (from,to); label darf '\n' enthalten (mehrzeilig)
//   implicitError: bool             // Hinweis „nicht eingezeichnete Übergänge …“
// }

import { EPS } from '../engine/tokenize.js';

/** Fasst Übergänge je (from,to) zusammen. items: [{from,to,text}] → edges mit label. */
function mergeEdges(items, sep) {
  const map = new Map();
  for (const it of items) {
    const k = `${it.from}\u0000${it.to}`;
    if (!map.has(k)) map.set(k, { from: it.from, to: it.to, parts: [] });
    const e = map.get(k);
    if (!e.parts.includes(it.text)) e.parts.push(it.text);
  }
  return [...map.values()].map((e) => ({ from: e.from, to: e.to, label: e.parts.join(sep), parts: e.parts }));
}

/** DEA → Graph-Modell. Kantenbeschriftungen „a, b“ (Reihenfolge wie in Σ). */
export function dfaToGraph(A) {
  const items = [];
  for (const s of A.states) for (const a of A.alphabet) {
    const t = A.delta[s]?.[a];
    if (t != null) items.push({ from: s, to: t, text: a });
  }
  // Hinweis auf den Fehlerzustand nur, wenn wirklich Übergänge fehlen
  const incomplete = A.states.some((s) => A.alphabet.some((a) => A.delta[s]?.[a] == null));
  return { kind: 'dfa', states: [...A.states], start: A.start, accepting: [...A.accepting], edges: mergeEdges(items, ', '), implicitError: !!A.implicitError && incomplete };
}

/** NEA → Graph-Modell (ε-Kanten mit „ε“). */
export function nfaToGraph(N) {
  const items = [];
  const syms = [...N.alphabet, EPS];
  for (const s of N.states) for (const a of syms) for (const t of N.delta[s]?.[a] ?? []) items.push({ from: s, to: t, text: a });
  return { kind: 'nfa', states: [...N.states], start: N.start, starts: N.starts, accepting: [...N.accepting], edges: mergeEdges(items, ', '), implicitError: false };
}

/** Mealy → Graph-Modell, Beschriftung „a / A“, leere Ausgabe „ε“; mehrere Übergänge je Kante mit Komma. */
export function mealyToGraph(M) {
  const items = [];
  for (const s of M.states) for (const a of M.inputAlphabet) {
    const tr = M.delta[s]?.[a];
    if (tr) items.push({ from: s, to: tr.to, text: `${a} / ${tr.out === '' ? EPS : tr.out}` });
  }
  return { kind: 'mealy', states: [...M.states], start: M.start, accepting: [], edges: mergeEdges(items, '\n'), implicitError: false };
}

/** NKA → Graph-Modell, Beschriftung „(#, a) : A#“, mehrere Übergänge je Kante untereinander. */
export function pdaToGraph(P) {
  const items = P.transitions.map((t) => ({ from: t.from, to: t.to, text: `(${t.top}, ${t.input}) : ${t.pushLabel}` }));
  return { kind: 'pda', states: [...P.states], start: P.start, accepting: [...P.accepting], edges: mergeEdges(items, '\n'), implicitError: false };
}

/** Wählt den passenden Konverter anhand von A.type. */
export function toGraph(A) {
  switch (A.type) {
    case 'nfa': return nfaToGraph(A);
    case 'mealy': return mealyToGraph(A);
    case 'pda': return pdaToGraph(A);
    default: return dfaToGraph(A);
  }
}

const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
/** Mehrzeilige Labels: '\n' → DOT '\l' (linksbündig) bzw. '\n' (zentriert). */
const label = (s, align) => esc(s).replace(/\n/g, align === 'left' ? '\\l' : '\\n') + (align === 'left' && s.includes('\n') ? '\\l' : '');

/**
 * „Sauberer“ DOT-Text zum Exportieren (z. B. für Graphviz-Online-Editoren oder Arbeitsblätter):
 * Knotennamen = Zustandsnamen, keine internen IDs/Klassen.
 */
export function exportDot(g, { name = 'Automat' } = {}) {
  const q = (s) => `"${esc(s)}"`;
  const lines = [`digraph ${q(name)} {`, '  rankdir=LR;', '  node [shape=circle];'];
  const starts = g.starts ?? (g.start != null ? [g.start] : []);
  starts.forEach((s, i) => lines.push(`  start${i} [shape=plaintext, label="Start"];`, `  start${i} -> ${q(s)};`));
  for (const s of g.states) lines.push(`  ${q(s)}${g.accepting.includes(s) ? ' [shape=doublecircle]' : ''};`);
  for (const e of g.edges) lines.push(`  ${q(e.from)} -> ${q(e.to)} [label=${q(e.label).replace(/\n/g, '\\n')}];`);
  if (g.implicitError) lines.push('  // Alle nicht eingezeichneten Übergänge führen in einen Fehlerzustand.');
  lines.push('}');
  return lines.join('\n');
}

/**
 * Graph-Modell → DOT.
 * @param {object} g          Graph-Modell
 * @param {object} opts
 *   prefix    Präfix für SVG-IDs (eindeutig je GraphView)
 *   rankdir   'LR' (Standard) | 'TB'
 *   fontsize  Standard 15
 * @returns {{dot:string, nodeIds:Map<string,string>, edgeIds:Map<string,string>}}
 *   nodeIds: Zustand → SVG-ID, edgeIds: 'from\u0000to' → SVG-ID
 */
export function graphToDot(g, { prefix = 'g', rankdir = 'LR', fontsize = 15 } = {}) {
  const nodeIds = new Map();
  const edgeIds = new Map();
  g.states.forEach((s, i) => nodeIds.set(s, `${prefix}-n${i}`));
  const multiLine = g.edges.some((e) => e.label.includes('\n'));
  const lines = [
    'digraph A {',
    `  rankdir=${rankdir}; bgcolor="transparent"; pad="0.15"; nodesep="0.45"; ranksep="${multiLine ? 0.7 : 0.55}";`,
    `  node [shape=circle, fontname="Helvetica", fontsize=${fontsize}, width="0.6", height="0.6", margin="0.04", penwidth=1.6];`,
    `  edge [fontname="Helvetica", fontsize=${fontsize - 1}, arrowsize=0.8, penwidth=1.4];`,
  ];
  const starts = g.starts ?? (g.start != null ? [g.start] : []);
  starts.forEach((s, i) => {
    const sid = `${prefix}-start${i}`;
    lines.push(`  "${sid}" [id="${sid}", class="start-label", shape=plaintext, label="Start", width="0.3", height="0.3", margin="0"];`);
  });
  for (const s of g.states) {
    const acc = g.accepting.includes(s);
    const cls = ['state', acc ? 'is-accepting' : ''].filter(Boolean).join(' ');
    lines.push(`  "${esc(nodeIds.get(s))}" [id="${esc(nodeIds.get(s))}", class="${cls}", label="${esc(s)}"${acc ? ', shape=doublecircle, width="0.5", height="0.5"' : ''}];`);
  }
  starts.forEach((s, i) => {
    if (nodeIds.has(s)) lines.push(`  "${prefix}-start${i}" -> "${esc(nodeIds.get(s))}" [id="${prefix}-startedge${i}", class="start-edge"];`);
  });
  g.edges.forEach((e, i) => {
    const id = `${prefix}-e${i}`;
    edgeIds.set(`${e.from}\u0000${e.to}`, id);
    const align = e.label.includes('\n') ? 'left' : 'center';
    lines.push(`  "${esc(nodeIds.get(e.from))}" -> "${esc(nodeIds.get(e.to))}" [id="${id}", class="trans", label="${label(e.label, align)}"];`);
  });
  lines.push('}');
  return { dot: lines.join('\n'), nodeIds, edgeIds };
}
