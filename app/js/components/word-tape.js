// WordTape – Eingabeband mit Lesekopf.
//
//   const tape = new WordTape(container, { label: 'Eingabe' });
//   tape.set(['a','b','b']);       // Symbole (mehrstellige erlaubt), [] = leeres Wort ε
//   tape.setHead(1);               // Anzahl bereits gelesener Symbole (0 … n); Kopf steht über Symbol Nr. 1
//   tape.setVerdict('accept'|'reject'|null);
//   tape.flash('good'|'bad');      // kurzes Farbsignal (Arena)

import { h, clear } from '../core/dom.js';

export class WordTape {
  constructor(container, { label = 'Eingabeband', size = 'm' } = {}) {
    this.el = h('div', { class: `word-tape size-${size}`, role: 'group', 'aria-label': label });
    this.cells = h('ol', { class: 'tape-cells' });
    this.status = h('p', { class: 'tape-status', 'aria-live': 'polite' });
    this.el.append(this.cells, this.status);
    container.append(this.el);
    this.tokens = [];
    this.head = 0;
  }

  set(tokens) {
    this.tokens = [...tokens];
    this.head = -1;
    this.setVerdict(null);
    clear(this.cells, this.tokens.length === 0
      ? h('li', { class: 'tape-cell is-empty', 'aria-label': 'leeres Wort' }, 'ε')
      : this.tokens.map((t, i) => h('li', { class: ['tape-cell', t.length > 1 && 'is-wide'], dataset: { i } }, t)));
    this.cells.append(h('li', { class: 'tape-end', 'aria-hidden': 'true' }));
    this.status.textContent = '';
  }

  /** k = Anzahl gelesener Symbole. -1 = kein Kopf anzeigen. */
  setHead(k) {
    this.head = k;
    [...this.cells.children].forEach((li, i) => {
      li.classList.toggle('is-read', k >= 0 && i < k && li.classList.contains('tape-cell') && !li.classList.contains('is-empty'));
      li.classList.toggle('is-head', k >= 0 && (i === k || (this.tokens.length === 0 && i === 0 && k === 0)));
    });
  }

  setStatus(text) { this.status.textContent = text ?? ''; }

  setVerdict(v) {
    this.el.classList.toggle('is-accept', v === 'accept');
    this.el.classList.toggle('is-reject', v === 'reject');
  }

  flash(kind) {
    this.el.classList.remove('flash-good', 'flash-bad');
    void this.el.offsetWidth; // Animation neu starten
    this.el.classList.add(kind === 'good' ? 'flash-good' : 'flash-bad');
  }
}
