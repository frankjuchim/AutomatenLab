// Kontextfreie Grammatiken G = (N, T, S, P)
//
// Texteingabe (eine oder mehrere Regeln pro Zeile, Alternativen mit |):
//   S → aSb | ab            oder   S -> aSb | ab        (auch ::=)
//   A → ε                   ε auch als „eps“ oder leere Alternative
// Nichtterminale: Großbuchstabe, optional gefolgt von Ziffern/Index (A1, C0, S_2, S') oder <Name> in spitzen Klammern.
// Terminale: alle übrigen Zeichen (einzeln), 'mehrere Zeichen' in Anführungszeichen, oder per T-Deklaration.
// Optionale Deklarationszeilen:
//   N = {S, A, B}        → genau diese Symbole sind Nichtterminale (dann dürfen Terminale auch Großbuchstaben sein)
//   T = {la, le, lu}     → Terminale (mehrstellige werden per Longest-Match erkannt)
//   Startsymbol: S       (Standard: linke Seite der ersten Regel)
// Zeilen, die mit // beginnen, sind Kommentare.

import { tokenize, isEpsilon, EPS, makeRng } from './tokenize.js';

const ARROW = /\s*(?:→|->|::=|⟶)\s*/;

/**
 * @returns {{ok:boolean, errors:string[], start:string, nonterminals:string[], terminals:string[],
 *            rules:{lhs:string, rhs:{t:'N'|'T', v:string}[]}[], byLhs:Map<string, rule[]>}}
 */
export function parseGrammar(text, { terminals: givenT = null, nonterminals: givenN = null } = {}) {
  const errors = [];
  const lines = String(text).split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('//'));
  let declN = givenN ? [...givenN] : null;
  let declT = givenT ? [...givenT] : null;
  let start = null;
  const raw = [];
  for (const line of lines) {
    let m;
    if ((m = line.match(/^N\s*=\s*\{(.*)\}\s*$/))) { declN = splitSet(m[1]); continue; }
    if ((m = line.match(/^(?:T|Σ)\s*=\s*\{(.*)\}\s*$/))) { declT = splitSet(m[1]); continue; }
    if ((m = line.match(/^Start(?:symbol)?\s*[:=]\s*(\S+)\s*$/i))) { start = m[1]; continue; }
    if (/^P\s*=\s*\{?\s*$/.test(line) || line === '}') continue;
    const parts = line.split(ARROW);
    if (parts.length !== 2) { errors.push(`Zeile „${line}“: Erwartet „A → …“.`); continue; }
    raw.push({ lhs: parts[0].trim(), rhs: parts[1], line });
  }
  const isNTName = (s) => (declN ? declN.includes(s) : /^(<[^>]+>|[A-ZÄÖÜ](?:_?\d+|'+)?)$/.test(s));
  const rules = [];
  const lhsSet = new Set(raw.map((r) => r.lhs));
  for (const r of raw) {
    if (!isNTName(r.lhs)) { errors.push(`„${r.lhs}“ ist kein Nichtterminal (linke Seite von „${r.line}“).`); continue; }
    for (const alt of r.rhs.split('|')) {
      const res = tokenizeRhs(alt, declN, declT, lhsSet);
      if (res.error) errors.push(`Regel „${r.line}“: ${res.error}`);
      else rules.push({ lhs: r.lhs, rhs: res.symbols });
    }
  }
  const nonterminals = [...new Set([...(declN ?? []), ...rules.map((r) => r.lhs), ...rules.flatMap((r) => r.rhs.filter((s) => s.t === 'N').map((s) => s.v))])];
  const terminals = [...new Set([...(declT ?? []), ...rules.flatMap((r) => r.rhs.filter((s) => s.t === 'T').map((s) => s.v))])];
  start = start ?? rules[0]?.lhs ?? 'S';
  for (const n of nonterminals) if (!rules.some((r) => r.lhs === n)) errors.push(`Für das Nichtterminal ${n} gibt es keine Regel.`);
  if (rules.length === 0 && errors.length === 0) errors.push('Keine Regeln gefunden.');
  const byLhs = new Map(nonterminals.map((n) => [n, rules.filter((r) => r.lhs === n)]));
  const g = { ok: errors.length === 0, errors, start, nonterminals, terminals, rules, byLhs };
  annotate(g);
  return g;
}

function splitSet(s) { return s.split(',').map((x) => x.trim()).filter(Boolean); }

function tokenizeRhs(alt, declN, declT, lhsSet = new Set()) {
  const s = alt.trim();
  if (isEpsilon(s)) return { symbols: [] };
  const symbols = [];
  const Ns = declN ? [...declN].sort((a, b) => b.length - a.length) : null;
  const Ts = declT ? [...declT].sort((a, b) => b.length - a.length) : null;
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === ' ' || c === '\t') { i++; continue; }
    if (c === EPS) { i++; continue; }
    if (c === '"' || c === "'" || c === '„' || c === '“') {
      const close = c === '„' ? '“' : c;
      const j = s.indexOf(close, i + 1);
      if (j < 0) return { error: 'fehlendes schließendes Anführungszeichen' };
      symbols.push({ t: 'T', v: s.slice(i + 1, j) });
      i = j + 1; continue;
    }
    if (Ns) {
      const n = Ns.find((x) => s.startsWith(x, i));
      if (n) { symbols.push({ t: 'N', v: n }); i += n.length; continue; }
    } else {
      if (c === '<') {
        const j = s.indexOf('>', i);
        if (j > i + 1) { symbols.push({ t: 'N', v: s.slice(i, j + 1) }); i = j + 1; continue; }
      }
      const m = s.slice(i).match(/^[A-ZÄÖÜ](?:_?\d+|'+)?/);
      if (m) {
        // „S0“ ist ein indiziertes Nichtterminal – außer es gibt keine Regel für S0, wohl aber für S
        // (dann ist z. B. in „0S0“ die zweite 0 ein Terminal).
        const name = m[0].length > 1 && !lhsSet.has(m[0]) && lhsSet.has(m[0][0]) ? m[0][0] : m[0];
        symbols.push({ t: 'N', v: name }); i += name.length; continue;
      }
    }
    if (Ts) {
      const t = Ts.find((x) => s.startsWith(x, i));
      if (t) { symbols.push({ t: 'T', v: t }); i += t.length; continue; }
    }
    symbols.push({ t: 'T', v: c }); i++;
  }
  return { symbols };
}

// minLen: kürzeste ableitbare Terminalwortlänge je Nichtterminal (∞ = unproduktiv)
// height: minimale Ableitungstiefe bis zum Terminalwort (für zufälliges Erzeugen)
function annotate(g) {
  const minLen = new Map(g.nonterminals.map((n) => [n, Infinity]));
  const height = new Map(g.nonterminals.map((n) => [n, Infinity]));
  let changed = true;
  while (changed) {
    changed = false;
    for (const r of g.rules) {
      const len = r.rhs.reduce((acc, s) => acc + (s.t === 'T' ? 1 : minLen.get(s.v) ?? Infinity), 0);
      if (len < minLen.get(r.lhs)) { minLen.set(r.lhs, len); changed = true; }
      const h = 1 + Math.max(0, ...r.rhs.filter((s) => s.t === 'N').map((s) => height.get(s.v) ?? Infinity));
      if (h < height.get(r.lhs)) { height.set(r.lhs, h); changed = true; }
    }
  }
  g.minLen = minLen; g.height = height;
  g.productive = g.nonterminals.filter((n) => minLen.get(n) < Infinity);
  // löschbare („nullable“) Nichtterminale: A ⇒* ε  ⇔  minLen(A) = 0
  g.nullable = new Set(g.nonterminals.filter((n) => minLen.get(n) === 0));
  g.maxRhs = Math.max(1, ...g.rules.map((r) => r.rhs.length));
}

/**
 * Wie viele löschbare Nichtterminale darf eine Satzform (bei Linksableitung) höchstens enthalten,
 * damit kein Wort der Länge ≤ n verloren geht?
 * Begründung: Zu jedem Wort w gibt es einen knotenminimalen Ableitungsbaum. Darin kommt auf einem Pfad
 * dasselbe Nichtterminal mit derselben Teilwort-Spanne höchstens einmal vor (sonst ließe sich der Baum
 * verkürzen); verschachtelte Spannen gibt es höchstens n + 1. Also ist die Pfadtiefe ≤ (n + 1)·|N|, und eine
 * Satzform der Linksableitung enthält außer dem aktuellen Nichtterminal nur die rechten Geschwister der
 * Pfadknoten (je ≤ maxRhs − 1). Terminale und NICHT löschbare Nichtterminale beschränkt die Mindestlänge
 * (≤ n), die löschbaren beschränkt diese Schranke. Die frühere feste Grenze „Formlänge ≤ 2n + 6“ war bei
 * ε-Regeln falsch (z. B. S → (S)SSS | ε: „(((((())))))“ wurde als „nicht ableitbar“ gemeldet).
 */
export function nullableBudget(g, n) {
  if (!g.nullable?.size) return 0;
  return (n + 1) * Math.max(1, g.nonterminals.length) * Math.max(1, g.maxRhs - 1) + 1;
}

const countNullable = (g, form) => form.reduce((a, s) => a + (s.t === 'N' && g.nullable.has(s.v) ? 1 : 0), 0);

export const symbolsToString = (syms, sep = '') => (syms.length === 0 ? EPS : syms.map((s) => s.v).join(sep));
export const ruleToString = (r) => `${r.lhs} → ${symbolsToString(r.rhs)}`;

/** Grammatik als Text (eine Zeile je Nichtterminal). */
export function grammarToString(g) {
  return g.nonterminals.filter((n) => g.byLhs.get(n)?.length).map((n) => `${n} → ${g.byLhs.get(n).map((r) => symbolsToString(r.rhs)).join(' | ')}`).join('\n');
}

/**
 * Rechtsregulär? Erlaubt: A → aB, A → a, A → ε (a Terminal, B Nichtterminal).
 * @returns {{regular:boolean, violations:{rule:string, reason:string}[]}}
 */
export function isRightRegular(g) {
  const violations = [];
  for (const r of g.rules) {
    const k = r.rhs;
    const ok = k.length === 0 || (k.length === 1 && k[0].t === 'T') || (k.length === 2 && k[0].t === 'T' && k[1].t === 'N');
    if (!ok) {
      let reason = 'Rechte Seite hat nicht die Form aB, a oder ε.';
      if (k.length === 1 && k[0].t === 'N') reason = 'Rechte Seite besteht nur aus einem Nichtterminal.';
      else if (k.some((s, i) => s.t === 'N' && i < k.length - 1)) reason = 'Nichtterminal steht nicht ganz rechts.';
      else if (k.filter((s) => s.t === 'T').length > 1) reason = 'Mehr als ein Terminal auf der rechten Seite.';
      else if (k.filter((s) => s.t === 'N').length > 1) reason = 'Mehr als ein Nichtterminal auf der rechten Seite.';
      violations.push({ rule: ruleToString(r), reason });
    }
  }
  return { regular: violations.length === 0, violations };
}

/** Wort in Terminalsymbole zerlegen (Longest-Match, Leerzeichen trennen). */
export function tokenizeWord(g, word) {
  return tokenize(word, g.terminals);
}

/**
 * Wort-Prüfung per Suche über Linksableitungen (Breitensuche mit Pruning).
 * Pruning: Terminal-Präfix/-Suffix müssen zum Wort passen; Terminale + Mindestlängen der nicht löschbaren
 * Nichtterminale ≤ |w|; Anzahl löschbarer Nichtterminale ≤ nullableBudget (beweisbar verlustfrei, s. o.).
 * @returns {{ok, member:true|false|null, derivation:{form:symbol[], rule:rule|null}[]|null, explored:number, error?}}
 *   member = null → Suchschranke erreicht, keine sichere Aussage.
 */
export function derive(g, word, { maxNodes = 150000, from = null } = {}) {
  const tk = tokenizeWord(g, word);
  if (!tk.ok) return { ok: false, member: false, derivation: null, explored: 0, error: tk.message };
  const w = tk.tokens; const n = w.length;
  // from: optionale Start-Satzform (z. B. Rallye: „Kann das Zielwort von hier aus noch entstehen?“)
  const startForm = from ? from.map((s) => ({ t: s.t, v: s.v })) : [{ t: 'N', v: g.start }];
  // Ab einer Satzform: deren eigene löschbare Nichtterminale kommen zur Schranke hinzu (Wald statt Baum).
  const budget = nullableBudget(g, n) + countNullable(g, startForm);
  if (from && !viable(g, startForm, w, budget)) return { ok: true, member: false, derivation: null, explored: 0, tokens: w };
  const keyOf = (f) => f.map((s) => (s.t === 'N' ? `\u0002${s.v}` : s.v)).join('\u0001');
  const nodes = [{ form: startForm, rule: null, parent: -1 }];
  const seen = new Set([keyOf(startForm)]);
  let limited = false;
  for (let i = 0; i < nodes.length; i++) {
    const form = nodes[i].form;
    const idx = form.findIndex((s) => s.t === 'N');
    if (idx < 0) {
      if (form.length === n && form.every((s, j) => s.v === w[j])) return { ok: true, member: true, derivation: chainForms(nodes, i), explored: nodes.length, tokens: w };
      continue;
    }
    for (const r of g.byLhs.get(form[idx].v) ?? []) {
      const nf = [...form.slice(0, idx), ...r.rhs, ...form.slice(idx + 1)];
      if (!viable(g, nf, w, budget)) continue;
      const k = keyOf(nf);
      if (seen.has(k)) continue;
      if (nodes.length >= maxNodes) { limited = true; break; }
      seen.add(k);
      nodes.push({ form: nf, rule: r, parent: i });
    }
    if (limited) break;
  }
  return { ok: true, member: limited ? null : false, derivation: null, explored: nodes.length, tokens: w };
}

function viable(g, form, w, budget) {
  let min = 0; let i = 0; let nul = 0;
  // Präfix aus Terminalen muss passen
  while (i < form.length && form[i].t === 'T') { if (form[i].v !== w[i]) return false; i++; }
  // Suffix aus Terminalen muss passen
  let j = form.length - 1; let k = w.length - 1;
  while (j >= i && form[j].t === 'T') { if (k < i || form[j].v !== w[k]) return false; j--; k--; }
  // Terminale + nicht löschbare Nichtterminale (mit ihrer Mindestlänge) dürfen |w| nicht überschreiten
  for (const s of form) {
    if (s.t === 'T') min += 1;
    else { const m = g.minLen.get(s.v) ?? Infinity; min += m; if (m === 0 && ++nul > budget) return false; }
    if (min > w.length) return false;
  }
  return true;
}

function chainForms(nodes, i) {
  const out = [];
  while (i >= 0) { out.unshift({ form: nodes[i].form, rule: nodes[i].rule }); i = nodes[i].parent; }
  return out;
}

/** Ableitung als Text: S ⇒ aSb ⇒ aabb */
export const derivationToString = (der, sep = '') => der.map((d) => symbolsToString(d.form, sep)).join(' ⇒ ');

/**
 * Ableitungsbaum aus einer Linksableitung. Knoten: {symbol:{t,v}, children:[…]} (ε-Regel → ein ε-Blatt).
 */
export function derivationToTree(g, der) {
  const rules = der.slice(1).map((d) => d.rule);
  let k = 0;
  const build = (sym) => {
    if (sym.t === 'T') return { symbol: sym, children: [] };
    const r = rules[k++];
    if (!r) return { symbol: sym, children: [] };
    const children = r.rhs.length === 0 ? [{ symbol: { t: 'T', v: EPS }, children: [] }] : r.rhs.map(build);
    return { symbol: sym, children };
  };
  return build({ t: 'N', v: g.start });
}

/**
 * Kürzeste Wörter der Sprache (Best-First nach Mindestlänge → aufsteigend nach Länge).
 * @returns {string[][]} Liste von Terminalfolgen
 */
export function shortestWords(g, { count = 10, maxLen = 12, maxNodes = 60000 } = {}) {
  const startForm = [{ t: 'N', v: g.start }];
  const minOf = (f) => f.reduce((a, s) => a + (s.t === 'T' ? 1 : g.minLen.get(s.v) ?? Infinity), 0);
  const heap = new MinHeap((a, b) => a.prio - b.prio || a.seq - b.seq);
  let seq = 0;
  heap.push({ form: startForm, prio: minOf(startForm), seq: seq++ });
  const seen = new Set();
  const words = []; const wordKeys = new Set();
  let explored = 0;
  const budget = nullableBudget(g, maxLen);
  while (heap.size && words.length < count && explored < maxNodes) {
    const { form } = heap.pop();
    explored++;
    const idx = form.findIndex((s) => s.t === 'N');
    if (idx < 0) {
      const key = form.map((s) => s.v).join('\u0001');
      if (!wordKeys.has(key)) { wordKeys.add(key); words.push(form.map((s) => s.v)); }
      continue;
    }
    for (const r of g.byLhs.get(form[idx].v) ?? []) {
      const nf = [...form.slice(0, idx), ...r.rhs, ...form.slice(idx + 1)];
      const p = minOf(nf);
      if (p > maxLen || countNullable(g, nf) > budget) continue;
      const k = nf.map((s) => (s.t === 'N' ? `\u0002${s.v}` : s.v)).join('\u0001');
      if (seen.has(k)) continue;
      seen.add(k);
      heap.push({ form: nf, prio: p, seq: seq++ });
    }
  }
  return words;
}

/**
 * Alle Wörter der Sprache bis zur Länge maxLen (Breitensuche über Linksableitungen; Pruning über Mindestlänge
 * = Terminale + nicht löschbare Nichtterminale und über nullableBudget für löschbare Nichtterminale).
 * @returns {{words:string[][], complete:boolean}}  complete = false, wenn die Knotenschranke erreicht wurde
 */
export function languageUpTo(g, maxLen, { maxNodes = 40000 } = {}) {
  const minOf = (f) => f.reduce((a, s) => a + (s.t === 'T' ? 1 : g.minLen.get(s.v) ?? Infinity), 0);
  const keyOf = (f) => f.map((s) => (s.t === 'N' ? `\u0002${s.v}` : s.v)).join('\u0001');
  const startForm = [{ t: 'N', v: g.start }];
  const queue = [startForm];
  const seen = new Set([keyOf(startForm)]);
  const words = []; const wordKeys = new Set();
  let complete = true;
  const budget = nullableBudget(g, maxLen);
  for (let i = 0; i < queue.length; i++) {
    const form = queue[i];
    const idx = form.findIndex((s) => s.t === 'N');
    if (idx < 0) {
      const k = form.map((s) => s.v).join('\u0001');
      if (!wordKeys.has(k)) { wordKeys.add(k); words.push(form.map((s) => s.v)); }
      continue;
    }
    for (const r of g.byLhs.get(form[idx].v) ?? []) {
      const nf = [...form.slice(0, idx), ...r.rhs, ...form.slice(idx + 1)];
      if (minOf(nf) > maxLen || countNullable(g, nf) > budget) continue;
      const k = keyOf(nf);
      if (seen.has(k)) continue;
      if (queue.length >= maxNodes) { complete = false; break; }
      seen.add(k); queue.push(nf);
    }
    if (!complete) break;
  }
  words.sort((a, b) => a.length - b.length || a.join('').localeCompare(b.join('')));
  return { words, complete };
}

/**
 * Zufälliges Wort per zufälliger Linksableitung. Ab einer Tiefe werden „terminierende“ Regeln bevorzugt.
 * @returns {{word:string[], derivation:{form,rule}[]}|null}
 */
export function randomWord(g, { rng = makeRng(), maxLen = 12, depth = 8, attempts = 40 } = {}) {
  if (!(g.minLen.get(g.start) < Infinity)) return null;
  for (let a = 0; a < attempts; a++) {
    let form = [{ t: 'N', v: g.start }];
    const der = [{ form, rule: null }];
    let steps = 0; let failed = false;
    while (true) {
      const idx = form.findIndex((s) => s.t === 'N');
      if (idx < 0) break;
      let options = (g.byLhs.get(form[idx].v) ?? []).filter((r) => r.rhs.every((s) => s.t === 'T' || g.minLen.get(s.v) < Infinity));
      if (steps > depth) {
        const h = (r) => Math.max(0, ...r.rhs.filter((s) => s.t === 'N').map((s) => g.height.get(s.v)));
        const best = Math.min(...options.map(h));
        options = options.filter((r) => h(r) === best);
      }
      const r = rng.pick(options);
      form = [...form.slice(0, idx), ...r.rhs, ...form.slice(idx + 1)];
      der.push({ form, rule: r });
      if (++steps > 400) { failed = true; break; }
    }
    if (!failed && form.length <= maxLen) return { word: form.map((s) => s.v), derivation: der };
  }
  return null;
}

/**
 * Rechtsreguläre Grammatik → NEA (Nichtterminal = Zustand; A → aB = Übergang; A → ε = Endzustand;
 * A → a = Übergang in einen zusätzlichen Endzustand).
 */
export function rightRegularToNFA(g, { endName = 'S_end' } = {}) {
  let end = endName; let k = 1;
  while (g.nonterminals.includes(end)) end = `${endName}${k++}`;
  const delta = {};
  const states = [...g.nonterminals];
  const accepting = new Set();
  let needEnd = false;
  for (const n of states) delta[n] = {};
  for (const r of g.rules) {
    if (r.rhs.length === 0) accepting.add(r.lhs);
    else if (r.rhs.length === 1 && r.rhs[0].t === 'T') { (delta[r.lhs][r.rhs[0].v] ??= []).push(end); needEnd = true; }
    else if (r.rhs.length === 2) (delta[r.lhs][r.rhs[0].v] ??= []).push(r.rhs[1].v);
  }
  if (needEnd) { states.push(end); delta[end] = {}; accepting.add(end); }
  return { type: 'nfa', alphabet: [...g.terminals], states, start: g.start, starts: [g.start], accepting: [...accepting], delta };
}

class MinHeap {
  constructor(cmp) { this.cmp = cmp; this.a = []; }
  get size() { return this.a.length; }
  push(x) { const a = this.a; a.push(x); let i = a.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (this.cmp(a[i], a[p]) >= 0) break; [a[i], a[p]] = [a[p], a[i]]; i = p; } }
  pop() {
    const a = this.a; const top = a[0]; const last = a.pop();
    if (a.length) {
      a[0] = last; let i = 0;
      for (;;) { const l = 2 * i + 1; const r = l + 1; let m = i; if (l < a.length && this.cmp(a[l], a[m]) < 0) m = l; if (r < a.length && this.cmp(a[r], a[m]) < 0) m = r; if (m === i) break; [a[i], a[m]] = [a[m], a[i]]; i = m; }
    }
    return top;
  }
}
