// Entwickler-Seite #/komponenten (nicht verlinkt): zeigt alle gemeinsamen Komponenten mit Beispieldaten.
// Dient weiteren Modul-Autoren als Spielwiese und dem Playwright-Test als Sichtprüfung.

import { h, clear } from '../core/dom.js';
import { GraphView } from '../components/graph-view.js';
import { WordTape } from '../components/word-tape.js';
import { StackView } from '../components/stack-view.js';
import { RunPlayer } from '../components/run-player.js';
import { pda, runPDA } from '../engine/pda.js';
import { mealy } from '../engine/mealy.js';
import { nfa } from '../engine/nfa.js';
import { dfa } from '../engine/dfa.js';

export default {
  title: 'Komponenten',
  mount(el, ctx) {
    const sec = (title) => { const s = h('section', { class: 'panel dev-section' }, h('h2', null, title)); el.append(s); return s; };
    clear(el, h('h1', null, 'Komponenten-Galerie'), h('p', { class: 'muted' }, 'Interne Seite für Modul-Autoren.'));

    const anbn = pda({ inputAlphabet: ['a', 'b'], stackAlphabet: ['#', 'A'], states: ['S0', 'S1', 'S2'], start: 'S0', accepting: ['S2'],
      transitions: ['S0 -> S0 : (#, a) : A#', 'S0 -> S0 : (A, a) : AA', 'S0 -> S1 : (A, b) : ε', 'S1 -> S1 : (A, b) : ε', 'S1 -> S2 : (#, ε) : #'] });
    const s1 = sec('GraphView: Kellerautomat aⁿbⁿ + StackView + Abi-Tabelle');
    const gv = new GraphView(s1);
    gv.render(anbn);
    const row = h('div', { class: 'dev-row' });
    s1.append(row);
    const sv = new StackView(row);
    sv.set(['#'], { animate: false });
    const run = runPDA(anbn, 'aabb');
    const table = h('table', { class: 'abi-table' },
      h('thead', null, h('tr', null, ['Zustand', 'Belegung Kellerspeicher', 'oberstes Kellersymbol', 'verarbeitetes Eingabezeichen'].map((t) => h('th', null, t)))),
      h('tbody', null, run.table.map((r) => h('tr', null, h('td', null, r.zustand), h('td', null, r.keller), h('td', null, r.oberstes), h('td', null, r.eingabe)))));
    row.append(table);
    let k = 0;
    s1.append(h('button', { type: 'button', class: 'btn', onclick: () => {
      k = (k + 1) % run.run.length;
      const step = run.run[k];
      sv.set(step.config.stack);
      gv.highlight({ active: step.config.state, edge: step.t ? [step.t.from, step.t.to] : null });
    } }, 'Nächster Schritt'));

    const s2 = sec('GraphView: Mealy (Süßigkeitenautomat)');
    new GraphView(s2).render(mealy({ inputAlphabet: ['M', 'H'], outputAlphabet: ['B'], start: 'S0',
      delta: { S0: { M: ['S1', 'ε'], H: ['S0', 'ε'] }, S1: { M: ['S1', 'ε'], H: ['S0', 'B'] } } }));

    const s3 = sec('GraphView: NEA mit mehreren aktiven Zuständen');
    const gN = new GraphView(s3);
    gN.render(nfa({ alphabet: ['L', 'O', 'X'], start: 'S0', accepting: ['S3'],
      delta: { S0: { 'L, O, X': 'S0', L: 'S1' }, S1: { O: 'S2' }, S2: { L: 'S3' }, S3: { 'L, O, X': 'S3' } } }))
      .then(() => gN.highlight({ active: ['S0', 'S1'], edge: [['S0', 'S0'], ['S0', 'S1']] }));

    const s4 = sec('WordTape + RunPlayer (DEA)');
    const t = new WordTape(s4, { size: 'l' });
    t.set(['10', '20', '10']); t.setHead(1);
    const rp = new RunPlayer(s4, { automat: dfa({ alphabet: ['a', 'b'], start: 'S0', accepting: ['S0'], delta: { S0: { a: 'S1', b: 'S0' }, S1: { a: 'S0', b: 'S1' } } }) });
    rp.ready.then(() => rp.load('abab'));
    s4.append(h('button', { type: 'button', class: 'btn', onclick: () => ctx.toast('So sieht ein Toast aus.', { type: 'success' }) }, 'Toast zeigen'));
    return () => rp.destroy();
  },
};
