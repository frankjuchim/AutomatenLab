// TmTape – Band einer Turingmaschine mit Schreib-Lese-Kopf (Ausschnitt um den Kopf, „unendlich“ nach beiden Seiten).
//
//   const tape = new TmTape(container, { cells: 15 });
//   tape.set(config);            // config = { state, tape: Map<index, symbol>, head }
//   tape.setCells(n)             // Breite des Ausschnitts (ungerade)

import { h, clear } from '../core/dom.js';
import { readCell, BLANK } from '../engine/turing.js';

export class TmTape {
  constructor(container, { cells = 15, label = 'Band der Turingmaschine' } = {}) {
    this.cells = cells;
    this.el = h('div', { class: 'tm-tape', role: 'group', 'aria-label': label });
    this.row = h('ol', { class: 'tm-cells' });
    this.state = h('div', { class: 'tm-head-state', 'aria-live': 'polite' });
    this.el.append(this.row, this.state);
    container.append(this.el);
    this.center = 0;
  }

  setCells(n) { this.cells = n; if (this.config) this.set(this.config); }

  /** Anzahl Zellen, die in die verfügbare Breite passen (ungerade, mindestens 7). */
  fit() {
    const w = this.el.clientWidth;
    if (!w) return this.cells;
    const cell = this.row.firstElementChild?.getBoundingClientRect().width || 44;
    const n = Math.max(7, Math.min(this.cells, Math.floor(w / cell)));
    return n % 2 ? n : n - 1;
  }

  set(config) {
    this.config = config;
    const cells = this.fit();
    const half = Math.floor(cells / 2);
    // Ausschnitt verschiebt sich nur, wenn der Kopf an den Rand kommt (ruhigeres Bild)
    if (Math.abs(config.head - this.center) > half - 2) this.center = config.head;
    const lo = this.center - half;
    clear(this.row);
    for (let i = lo; i < lo + cells; i++) {
      const sym = readCell(config.tape, i);
      this.row.append(h('li', { class: ['tm-cell', i === config.head && 'is-head', sym === BLANK && 'is-blank'], dataset: { i } },
        h('span', { class: 'tm-sym' }, sym), h('span', { class: 'tm-idx', 'aria-hidden': 'true' }, String(i))));
    }
    clear(this.state, h('span', { class: 'tm-state-chip' }, config.state));
  }
}
