// MealyPlayer – spielt einen Mealy-Lauf Schritt für Schritt ab: Graph-Hervorhebung, Eingabeband,
// Ausgabeband, Steuerung (auch Autoplay), Erklärsatz und Folge „S0 –M / ε→ S1 –H / B→ S0“.
//
//   const mp = new MealyPlayer(container, { automat: M, meanings: { S0: '…' } });
//   await mp.ready;
//   mp.load('MHMH');            // Ergebnis von runMealy (oder {ok:false, error})
//   mp.play(); mp.pause(); mp.next(); mp.prev(); mp.goto(k); mp.toEnd();
//   await mp.setAutomat(M2);    // z. B. nach dem Bearbeiten einer Kantenausgabe
//
// Optionen: graph (vorhandene GraphView mitbenutzen), meanings, speed (ms, Standard 900), onEnd(run)

import { h, clear } from '../core/dom.js';
import { GraphView } from './graph-view.js';
import { WordTape } from './word-tape.js';
import { runMealy, outputLabel } from '../engine/mealy.js';
import { tokenize } from '../engine/tokenize.js';

export class MealyPlayer {
  constructor(container, opts = {}) {
    this.opts = { speed: 900, ...opts };
    this.el = h('div', { class: 'run-player mealy-player is-idle' });
    this.idleHint = h('p', { class: 'run-idle muted' }, opts.idleText ?? 'Gib ein Eingabewort ein und starte die Simulation.');
    container.append(this.el);
    this.ownGraph = !opts.graph;
    this.graph = opts.graph ?? new GraphView(this.el, { label: opts.label });
    const tapes = h('div', { class: 'tape-pair' });
    tapes.append(h('span', { class: 'tape-label' }, 'Eingabeband'));
    this.tape = new WordTape(tapes, { label: 'Eingabeband' });
    tapes.append(h('span', { class: 'tape-label' }, 'Ausgabeband'));
    this.outTape = new WordTape(tapes, { label: 'Ausgabeband' });
    this.outTape.el.classList.add('is-output');
    this.controls = h('div', { class: 'run-controls', role: 'group', 'aria-label': 'Lauf steuern' });
    const btn = (label, icon, fn) => h('button', { type: 'button', class: 'btn btn-icon', 'aria-label': label, title: label, onclick: fn }, icon);
    this.bStart = btn('Zum Anfang', '⏮', () => { this.pause(); this.goto(0); });
    this.bPrev = btn('Schritt zurück', '◀', () => this.prev());
    this.bPlay = h('button', { type: 'button', class: 'btn btn-play', onclick: () => (this.timer ? this.pause() : this.play()) }, 'Abspielen');
    this.bNext = btn('Schritt vor', '▶', () => this.next());
    this.bEnd = btn('Zum Ende', '⏭', () => this.toEnd());
    this.controls.append(this.bStart, this.bPrev, this.bPlay, this.bNext, this.bEnd);
    this.say = h('p', { class: 'run-say', 'aria-live': 'polite' });
    this.trace = h('p', { class: 'run-trace' });
    this.el.append(this.idleHint, tapes, this.controls, this.say, this.trace);
    this.run = null; this.k = 0; this.timer = null;
    this.ready = opts.automat ? this.setAutomat(opts.automat) : Promise.resolve();
  }

  async setAutomat(M, meanings = this.opts.meanings) {
    this.M = M; this.opts.meanings = meanings;
    this.pause();
    if (this.ownGraph) await this.graph.render(M);
    if (this.word != null) { this.load(this.word); this.toEnd(); }
  }

  load(word) {
    this.pause();
    this.word = word;
    this.el.classList.remove('is-idle');
    const run = runMealy(this.M, word);
    this.run = run;
    if (!run.ok) {
      this.tape.set(run.tokens ?? []); this.tape.setHead(-1); this.outTape.set([]);
      this.say.textContent = run.error; this.trace.textContent = '';
      this.graph?.clearHighlight();
      this._buttons();
      return run;
    }
    this.tape.set(run.tokens);
    this.goto(0);
    return run;
  }

  get lastIndex() { return this.run?.ok ? this.run.steps.length : 0; }
  get atEnd() { return !this.run?.ok || this.k >= this.lastIndex; }

  _outTokens(text) {
    const tk = tokenize(text, this.M.outputAlphabet.length ? this.M.outputAlphabet : [...new Set(text)]);
    return tk.ok ? tk.tokens : [...text];
  }

  goto(k) {
    if (!this.run?.ok) return;
    this.k = Math.max(0, Math.min(k, this.lastIndex));
    const { steps, tokens } = this.run;
    const cur = this.k === 0 ? this.M.start : steps[this.k - 1].to;
    const last = this.k > 0 ? steps[this.k - 1] : null;
    this.graph?.highlight({ active: cur, edge: last ? [last.from, last.to] : null, visited: steps.slice(0, this.k).map((s) => s.from) });
    this.tape.setHead(this.k);
    const outSoFar = steps.slice(0, this.k).map((s) => s.output).join('');
    const outTokens = this._outTokens(outSoFar);
    this.outTape.set(outTokens);
    const newCount = last ? this._outTokens(last.output).length : 0;
    [...this.outTape.cells.querySelectorAll('.tape-cell')].forEach((li, i) => li.classList.toggle('is-new', i >= outTokens.length - newCount && outTokens.length > 0));
    const m = this.opts.meanings ?? {};
    let text;
    if (this.k === 0) text = `Start in ${cur}.${m[cur] ? ` Bedeutung: ${m[cur]}.` : ''}`;
    else text = `${last.from} liest „${last.input}“ und gibt ${last.output === '' ? 'nichts aus (ε)' : `„${last.output}“ aus`} → ${last.to}.${m[last.to] ? ` Bedeutung: ${m[last.to]}.` : ''}`;
    if (this.atEnd) {
      if (this.run.stuck) text += ` Von ${cur} gibt es keinen Übergang mit „${tokens[this.k]}“ – der Automat ist unvollständig.`;
      else text += ` Eingabe zu Ende. Gesamte Ausgabe: ${outputLabel(this.run.output)}.`;
    }
    this.say.textContent = text;
    clear(this.trace, h('span', { class: 'sr-only' }, 'Zustandsfolge: '), this.M.start);
    for (let i = 0; i < this.k; i++) this.trace.append(h('span', { class: 'trace-arrow' }, ` –${steps[i].input} / ${outputLabel(steps[i].output)}→ `), steps[i].to);
    this._buttons();
    if (this.atEnd && this.opts.onEnd) this.opts.onEnd(this.run);
  }

  next() { if (!this.atEnd) this.goto(this.k + 1); }
  prev() { this.pause(); if (this.k > 0) this.goto(this.k - 1); }
  toEnd() { this.pause(); this.goto(this.lastIndex); }

  play() {
    if (!this.run?.ok) return;
    if (this.atEnd) this.goto(0);
    this.timer = setInterval(() => { if (this.atEnd) { this.pause(); return; } this.next(); if (this.atEnd) this.pause(); }, this.opts.speed);
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

