// RunPlayer – spielt den Lauf eines DEA auf einem Wort Schritt für Schritt ab:
// Graph-Hervorhebung + Eingabeband + Zustandsfolge (S0 –a→ S1 …) + Steuerung.
//
//   const rp = new RunPlayer(container, { automat: A, meanings: { S0: '…' } });
//   await rp.ready;                  // Graph gezeichnet
//   rp.load('abba');                 // liefert das Ergebnis von runDFA (oder {ok:false, error})
//   rp.play(); rp.pause(); rp.next(); rp.prev(); rp.goto(k); rp.toEnd();
//
// Optionen:
//   graph      vorhandene GraphView mitbenutzen (dann zeichnet RunPlayer keinen eigenen Graphen)
//   meanings   Bedeutung der Zustände (wird beim aktuellen Zustand angezeigt)
//   speed      ms pro Schritt beim Abspielen (Standard 750)
//   hideGraph  true → nur Band + Text (Black-Box-Modus)
//   onEnd      Callback(run) beim Erreichen des Endes

import { h, clear } from '../core/dom.js';
import { GraphView } from './graph-view.js';
import { WordTape } from './word-tape.js';
import { runDFA } from '../engine/dfa.js';

const ERR = 'Fehlerzustand';

export class RunPlayer {
  constructor(container, opts = {}) {
    this.opts = { speed: 750, ...opts };
    this.el = h('div', { class: 'run-player is-idle' });
    this.idleHint = h('p', { class: 'run-idle muted' }, opts.idleText ?? 'Gib ein Wort ein und starte die Simulation.');
    container.append(this.el);
    this.ownGraph = !opts.graph;
    this.graph = opts.graph ?? null;
    if (this.ownGraph && !opts.hideGraph) this.graph = new GraphView(this.el, { label: opts.label });
    this.tape = new WordTape(this.el);
    this.controls = h('div', { class: 'run-controls', role: 'group', 'aria-label': 'Lauf steuern' });
    const btn = (label, icon, fn) => h('button', { type: 'button', class: 'btn btn-icon', 'aria-label': label, title: label, onclick: fn }, icon);
    this.bStart = btn('Zum Anfang', '⏮', () => this.goto(0));
    this.bPrev = btn('Schritt zurück', '◀', () => this.prev());
    this.bPlay = h('button', { type: 'button', class: 'btn btn-play', onclick: () => (this.timer ? this.pause() : this.play()) }, 'Abspielen');
    this.bNext = btn('Schritt vor', '▶', () => this.next());
    this.bEnd = btn('Zum Ende', '⏭', () => this.toEnd());
    this.controls.append(this.bStart, this.bPrev, this.bPlay, this.bNext, this.bEnd);
    this.say = h('p', { class: 'run-say', 'aria-live': 'polite' });
    this.trace = h('p', { class: 'run-trace' });
    this.el.append(this.idleHint, this.controls, this.say, this.trace);
    this.run = null; this.k = 0; this.timer = null;
    this.ready = opts.automat ? this.setAutomat(opts.automat) : Promise.resolve();
  }

  async setAutomat(A, meanings = this.opts.meanings) {
    this.A = A; this.opts.meanings = meanings;
    this.pause(); this.run = null;
    if (this.ownGraph && this.graph) await this.graph.render(A);
  }

  load(word) {
    this.pause();
    this.el.classList.remove('is-idle');
    const run = runDFA(this.A, word);
    this.run = run;
    if (!run.ok) {
      this.tape.set(run.tokens ?? []); this.tape.setHead(-1);
      this.say.textContent = run.error; this.trace.textContent = '';
      this.graph?.clearHighlight();
      this._buttons();
      return run;
    }
    this.tape.set(run.tokens);
    this.goto(0);
    return run;
  }

  get n() { return this.run?.ok ? this.run.tokens.length : 0; }
  get atEnd() { return !this.run?.ok || this.k >= this.lastIndex; }
  /** Letzter sinnvoller Schritt: Ende des Worts oder erster Schritt in den Fehlerzustand. */
  get lastIndex() { return this.run?.deadAt != null ? this.run.deadAt + 1 : this.n; }

  goto(k) {
    if (!this.run?.ok) return;
    this.k = Math.max(0, Math.min(k, this.lastIndex));
    const { path, tokens, steps } = this.run;
    const cur = path[this.k];
    const prev = this.k > 0 ? path[this.k - 1] : null;
    const dead = cur == null;
    this.graph?.highlight({
      active: dead ? prev : cur,
      edge: this.k > 0 && !dead ? [prev, cur] : null,
      visited: path.slice(0, this.k).filter(Boolean),
      error: dead,
    });
    this.tape.setHead(this.k);
    const finished = this.k === this.lastIndex;
    const m = this.opts.meanings ?? {};
    let text;
    if (this.k === 0) text = `Start in ${cur}.${m[cur] ? ` Bedeutung: ${m[cur]}.` : ''}`;
    else if (dead) text = `Von ${prev} gibt es keinen Übergang mit „${tokens[this.k - 1]}“ → ${ERR}. Den verlässt der Automat nie wieder.`;
    else text = `${prev} liest „${tokens[this.k - 1]}“ → ${cur}.${m[cur] ? ` Bedeutung: ${m[cur]}.` : ''}`;
    if (finished) {
      const acc = this.run.accepted;
      if (dead) text += ' Ergebnis: abgelehnt.';
      else if (tokens.length === 0) text += acc ? ' Das leere Wort ε: Der Startzustand ist ein Endzustand → akzeptiert.' : ' Das leere Wort ε: Der Startzustand ist kein Endzustand → abgelehnt.';
      else text += acc ? ` Wort zu Ende gelesen, ${cur} ist ein Endzustand → akzeptiert.` : ` Wort zu Ende gelesen, ${cur} ist kein Endzustand → abgelehnt.`;
      this.tape.setVerdict(acc ? 'accept' : 'reject');
    } else this.tape.setVerdict(null);
    this.say.textContent = text;
    // Zustandsfolge bis hierher
    clear(this.trace, h('span', { class: 'sr-only' }, 'Zustandsfolge: '), path[0]);
    for (let i = 0; i < this.k; i++) {
      this.trace.append(h('span', { class: 'trace-arrow' }, ` –${steps[i].symbol}→ `), steps[i].to ?? ERR);
    }
    this._buttons();
    if (finished && this.opts.onEnd) this.opts.onEnd(this.run);
  }

  next() { if (!this.atEnd) this.goto(this.k + 1); }
  prev() { this.pause(); if (this.k > 0) this.goto(this.k - 1); }
  toEnd() { this.pause(); this.goto(this.lastIndex); }

  play() {
    if (!this.run?.ok) return;
    if (this.atEnd) this.goto(0);
    this.timer = setInterval(() => {
      if (this.atEnd) { this.pause(); return; }
      this.next();
      if (this.atEnd) this.pause();
    }, this.opts.speed);
    this._buttons();
  }

  pause() { clearInterval(this.timer); this.timer = null; this._buttons(); }

  _buttons() {
    const ok = !!this.run?.ok;
    this.bPlay.textContent = this.timer ? 'Pause' : (ok && this.atEnd ? 'Nochmal' : 'Abspielen');
    this.bPlay.disabled = !ok;
    this.bStart.disabled = this.bPrev.disabled = !ok || this.k === 0;
    this.bNext.disabled = this.bEnd.disabled = !ok || this.atEnd;
  }

  destroy() { this.pause(); this.el.remove(); }
}
