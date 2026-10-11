// StackView – Kellerspeicher (oberstes Zeichen oben) mit Animation beim Ablegen/Entfernen.
//
//   const sv = new StackView(container, { label: 'Kellerspeicher' });
//   sv.set(['#']);                 // Index 0 = oberstes Zeichen (wie in engine/pda.js)
//   sv.set(['A', '#']);            // A wird „abgelegt“ (Animation von oben)
//   sv.set(['#']);                 // A wird „entfernt“
//   sv.text → 'A#' (oberstes links, Abi-Format)

import { h, reducedMotion } from '../core/dom.js';

export class StackView {
  constructor(container, { label = 'Kellerspeicher' } = {}) {
    this.el = h('div', { class: 'stack-view', role: 'group', 'aria-label': label });
    this.list = h('ol', { class: 'stack-items', 'aria-live': 'polite' });
    this.el.append(h('span', { class: 'stack-top-label', 'aria-hidden': 'true' }, 'oben'), this.list, h('span', { class: 'stack-floor', 'aria-hidden': 'true' }));
    container.append(this.el);
    this.items = [];
  }

  get text() { return this.items.length ? this.items.join('') : 'ε'; }

  set(stack, { animate = true } = {}) {
    const next = [...stack];
    // gemeinsamer „Boden“ (Ende der Arrays) bleibt stehen
    let common = 0;
    while (common < this.items.length && common < next.length
      && this.items[this.items.length - 1 - common] === next[next.length - 1 - common]) common++;
    const removeCount = this.items.length - common;
    const addCount = next.length - common;
    const anim = animate && !reducedMotion();
    const children = [...this.list.children];
    const doAdd = () => {
      for (let i = addCount - 1; i >= 0; i--) {
        const li = h('li', { class: ['stack-item', anim && 'is-entering'] }, next[i]);
        this.list.prepend(li);
        if (anim) requestAnimationFrame(() => requestAnimationFrame(() => li.classList.remove('is-entering')));
      }
      this.list.setAttribute('aria-label', `Kellerinhalt von oben: ${next.join(' ') || 'leer'}`);
    };
    const removed = children.slice(0, removeCount);
    if (anim && removed.length) {
      removed.forEach((li) => { li.classList.add('is-leaving'); });
      setTimeout(() => { removed.forEach((li) => li.remove()); doAdd(); }, 180);
    } else { removed.forEach((li) => li.remove()); doAdd(); }
    this.items = next;
  }
}
