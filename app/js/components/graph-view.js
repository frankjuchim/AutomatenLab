// GraphView – zeichnet Automaten als Zustandsgraph (Graphviz im Browser, lokal aus vendor/viz.js)
// und erlaubt Hervorhebungen (aktiver Zustand, aktive Kante) nach dem Rendern.
//
//   const gv = new GraphView(container, { caption: true });
//   await gv.render(automat);               // DEA/NEA/Mealy/NKA (normalisiert) ODER fertiges Graph-Modell
//   gv.highlight({ active: 'S1', edge: ['S0','S1'], visited: ['S0'], error: false });
//   gv.clearHighlight();
//
// Optionen: caption (Hinweis zum Fehlerzustand anzeigen, Standard true), rankdir ('LR'), label (aria-label),
//           minScale (z. B. 0.8: SVG nie schmaler als 80 % der natürlichen Breite → Rahmen scrollt seitlich).

import { h, clear } from '../core/dom.js';
import { toGraph, graphToDot } from './graph-model.js';

let vizPromise = null;
/** Lädt Graphviz (WASM, ca. 1,2 MB) einmalig. */
export function getViz() {
  vizPromise ??= import('../../vendor/viz.js').then((m) => m.instance());
  return vizPromise;
}

let counter = 0;
const svgCache = new Map();

export class GraphView {
  constructor(container, opts = {}) {
    this.opts = { caption: true, rankdir: 'LR', ...opts };
    this.prefix = `gv${++counter}`;
    this.root = h('figure', { class: 'graph-view' });
    this.canvas = h('div', { class: 'graph-canvas', role: 'img', 'aria-label': opts.label ?? 'Zustandsgraph' });
    this.caption = h('figcaption', { class: 'graph-caption', hidden: true });
    this.root.append(this.canvas, this.caption);
    container.append(this.root);
    this.nodeIds = new Map();
    this.edgeIds = new Map();
    this._token = 0;
  }

  /** Zeichnet den Automaten. Gibt ein Promise zurück, das nach dem Einfügen des SVG erfüllt ist. */
  async render(automatOrGraph, opts = {}) {
    const g = automatOrGraph.edges && !automatOrGraph.delta && !automatOrGraph.transitions ? automatOrGraph : toGraph(automatOrGraph);
    this.graph = g;
    const { dot, nodeIds, edgeIds } = graphToDot(g, { prefix: this.prefix, rankdir: opts.rankdir ?? this.opts.rankdir });
    const token = ++this._token;
    this.root.classList.add('is-loading');
    let svgText = svgCache.get(dot);
    if (!svgText) {
      try {
        const viz = await getViz();
        svgText = viz.renderString(dot, { format: 'svg', engine: 'dot' });
        if (svgCache.size > 80) svgCache.clear();
        svgCache.set(dot, svgText);
      } catch (e) {
        console.error(e);
        if (token === this._token) clear(this.canvas, h('p', { class: 'graph-error' }, 'Der Graph konnte nicht gezeichnet werden.'));
        this.root.classList.remove('is-loading');
        return;
      }
    }
    if (token !== this._token) return; // inzwischen neu gerendert
    this.nodeIds = nodeIds; this.edgeIds = edgeIds;
    const tpl = document.createElement('template');
    tpl.innerHTML = svgText.replace(/^[\s\S]*?(<svg)/, '$1');
    const svg = tpl.content.querySelector('svg');
    // Größe responsiv: viewBox behalten, feste Breite/Höhe als Obergrenze (nicht über 1,6-fach skalieren)
    const w = parseFloat(svg.getAttribute('width')); const hgt = parseFloat(svg.getAttribute('height'));
    svg.removeAttribute('width'); svg.removeAttribute('height');
    svg.style.maxWidth = `${Math.round(w * 1.6)}px`;
    svg.style.aspectRatio = `${w} / ${hgt}`;
    // Option minScale: dichte Graphen nicht unlesbar klein stauchen – lieber im Rahmen seitlich scrollen
    if (this.opts.minScale) svg.style.minWidth = `${Math.round(Math.min(w * this.opts.minScale, 820))}px`;
    svg.setAttribute('focusable', 'false');
    svg.querySelector('g.graph > polygon')?.remove(); // weißer Hintergrund
    svg.querySelectorAll('title').forEach((t) => t.remove()); // keine Tooltips mit internen IDs
    clear(this.canvas, svg);
    this.svg = svg;
    this.caption.hidden = !(this.opts.caption && g.implicitError);
    this.caption.textContent = 'Alle nicht eingezeichneten Übergänge führen in einen Fehlerzustand.';
    this.canvas.setAttribute('aria-label', opts.label ?? this.opts.label ?? describe(g));
    this.root.classList.remove('is-loading');
    if (this._pending) { const p = this._pending; this._pending = null; this.highlight(p); }
  }

  _node(state) { const id = this.nodeIds.get(state); return id ? this.svg?.querySelector(`[id="${id}"]`) : null; }
  _edge(from, to) { const id = this.edgeIds.get(`${from}\u0000${to}`); return id ? this.svg?.querySelector(`[id="${id}"]`) : null; }

  /**
   * Hervorhebung setzen (ersetzt die vorherige).
   * @param {{active?:string|string[], edge?:[string,string]|[string,string][], visited?:string[], error?:boolean, dim?:boolean}} hl
   *   active  – aktiver Zustand (oder mehrere, z. B. NEA)  → ocker gefüllt
   *   edge    – zuletzt benutzte Kante(n)                  → ocker
   *   visited – bereits besuchte Zustände                  → hell getönt
   *   error   – Lauf ist im (impliziten) Fehlerzustand     → Graph rot umrandet
   */
  highlight(hl = {}) {
    if (!this.svg) { this._pending = hl; return; }
    this.clearHighlight();
    for (const s of hl.visited ?? []) this._node(s)?.classList.add('is-visited');
    for (const s of [].concat(hl.active ?? [])) this._node(s)?.classList.add('is-active');
    const edges = hl.edge ? (Array.isArray(hl.edge[0]) ? hl.edge : [hl.edge]) : [];
    for (const [f, t] of edges) this._edge(f, t)?.classList.add('is-active');
    this.root.classList.toggle('is-error', !!hl.error);
  }

  clearHighlight() {
    if (!this.svg) return;
    this.svg.querySelectorAll('.is-active, .is-visited').forEach((n) => n.classList.remove('is-active', 'is-visited'));
    this.root.classList.remove('is-error');
  }

  destroy() { this.root.remove(); }
}

function describe(g) {
  const acc = g.accepting.length ? `Endzustände: ${g.accepting.join(', ')}` : 'keine Endzustände';
  const edges = g.edges.map((e) => `${e.from} nach ${e.to} mit ${e.label.replace(/\n/g, '; ')}`).join('. ');
  return `Zustandsgraph mit den Zuständen ${g.states.join(', ')}. Startzustand ${g.start ?? '–'}. ${acc}. Übergänge: ${edges}.`;
}
