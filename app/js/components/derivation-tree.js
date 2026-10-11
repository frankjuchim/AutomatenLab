// DerivationTree – zeichnet einen Ableitungsbaum als SVG (wächst live mit der Ableitung).
//
//   const tree = new DerivationTree(container, { label });
//   tree.set(root);                 // root = { symbol:{t:'N'|'T', v}, children:[…] } (engine: derivationToTree)
//   tree.set(root, { next: node })  // next = Knoten, der als Nächstes expandiert wird (ocker)
//   tree.svgClone()                 // Kopie des SVG (z. B. „Baum 1 gespeichert“)
//
// Blätter mit symbol.v === 'ε' werden als ε gezeichnet. Nichtterminale als Kreis, Terminale als Kasten.

import { h, clear } from '../core/dom.js';
import { EPS } from '../engine/tokenize.js';

const NS = 'http://www.w3.org/2000/svg';
const X_GAP = 46; const Y_GAP = 60; const R = 17;

export class DerivationTree {
  constructor(container, { label = 'Ableitungsbaum' } = {}) {
    this.el = h('div', { class: 'tree-view', role: 'img', 'aria-label': label });
    container.append(this.el);
    this.root = null;
  }

  set(root, { next = null } = {}) {
    this.root = root;
    clear(this.el);
    if (!root) return;
    // Layout: Blätter von links nach rechts, innere Knoten mittig über ihren Kindern
    let leafX = 0; let maxDepth = 0;
    const place = (node, depth) => {
      node._depth = depth; maxDepth = Math.max(maxDepth, depth);
      if (!node.children?.length) { node._x = leafX++; return; }
      node.children.forEach((c) => place(c, depth + 1));
      node._x = (node.children[0]._x + node.children.at(-1)._x) / 2;
    };
    place(root, 0);
    const width = Math.max(1, leafX) * X_GAP + X_GAP;
    const height = (maxDepth + 1) * Y_GAP + 10;
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('width', width); svg.setAttribute('height', height);
    svg.setAttribute('focusable', 'false');
    const px = (n) => n._x * X_GAP + X_GAP;
    const py = (n) => n._depth * Y_GAP + R + 8;
    const edges = document.createElementNS(NS, 'g'); edges.setAttribute('class', 'tree-edges');
    const nodes = document.createElementNS(NS, 'g'); nodes.setAttribute('class', 'tree-nodes');
    const walk = (node) => {
      for (const c of node.children ?? []) {
        const line = document.createElementNS(NS, 'line');
        line.setAttribute('x1', px(node)); line.setAttribute('y1', py(node) + R);
        line.setAttribute('x2', px(c)); line.setAttribute('y2', py(c) - R);
        edges.append(line);
        walk(c);
      }
      const g = document.createElementNS(NS, 'g');
      const isT = node.symbol.t === 'T';
      const isEps = node.symbol.v === EPS;
      g.setAttribute('class', ['tree-node', isT ? 'is-terminal' : 'is-nonterminal', isEps && 'is-eps', node === next && 'is-next', !isT && !node.children?.length && 'is-open'].filter(Boolean).join(' '));
      g.setAttribute('transform', `translate(${px(node)} ${py(node)})`);
      const shape = document.createElementNS(NS, isT ? 'rect' : 'circle');
      if (isT) { shape.setAttribute('x', -R); shape.setAttribute('y', -R + 2); shape.setAttribute('width', 2 * R); shape.setAttribute('height', 2 * R - 4); shape.setAttribute('rx', 5); } else shape.setAttribute('r', R);
      const text = document.createElementNS(NS, 'text');
      text.setAttribute('text-anchor', 'middle'); text.setAttribute('dominant-baseline', 'central');
      const label = String(node.symbol.v).replace(/^<(.*)>$/, '$1');
      text.textContent = label.length > 4 ? label.slice(0, 4) + '…' : label;
      if (label.length > 4) { const t = document.createElementNS(NS, 'title'); t.textContent = label; g.append(t); }
      if (label.length > 2) text.setAttribute('font-size', label.length > 3 ? '10' : '12');
      g.append(shape, text);
      nodes.append(g);
    };
    walk(root);
    svg.append(edges, nodes);
    this.el.append(svg);
    this.svg = svg;
    // Neu gewachsene Stelle sichtbar halten
    if (next && this.el.scrollWidth > this.el.clientWidth) this.el.scrollLeft = Math.max(0, px(next) - this.el.clientWidth / 2);
  }

  svgClone() { return this.svg ? this.svg.cloneNode(true) : null; }
}
