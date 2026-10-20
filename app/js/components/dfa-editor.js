// DfaEditor – DEA über eine Übergangstabelle bearbeiten (Zustände hinzufügen/umbenennen/löschen,
// Start-/Endzustände, Übergänge per Dropdown, Option „impliziter Fehlerzustand“).
//
//   const ed = new DfaEditor(container, { alphabet: ['a','b'], value: jsonOderNull, onChange: (ed) => … });
//   ed.toDFA()       → normalisierter DEA (engine/dfa.js), Zustandsnamen wie eingegeben
//   ed.toJSON()      → Engine-Format (für Export/Entwürfe)
//   ed.load(json)    → Engine-Format laden (alphabet wird übernommen)
//   ed.setAlphabet(['0','1'])  → Spalten ändern (vorhandene Übergänge für gebliebene Symbole bleiben)
//   ed.missing()     → [[zustand, symbol], …] fehlende Übergänge

import { h, clear } from '../core/dom.js';
import { normalizeDFA } from '../engine/dfa.js';

let edCounter = 0;
const NAME_OK = /^[^\s,;"'(){}|\\/]{1,12}$/;

export class DfaEditor {
  constructor(container, { alphabet = ['a', 'b'], value = null, onChange = () => {} } = {}) {
    this.uid = `ed${++edCounter}`;
    this.onChange = onChange;
    this.nextId = 0;
    this.el = h('div', { class: 'dfa-editor' });
    this.tableWrap = h('div', { class: 'table-scroll' });
    this.msg = h('p', { class: 'field-msg', 'aria-live': 'polite' });
    this.implicitBox = h('input', { type: 'checkbox', id: `${this.uid}-impl`, onchange: (e) => { this.m.implicitError = e.target.checked; this._changed(); } });
    this.missingInfo = h('p', { class: 'missing-info', 'aria-live': 'polite' });
    this.el.append(
      this.tableWrap,
      h('div', { class: 'editor-actions' },
        h('button', { type: 'button', class: 'btn', onclick: () => this.addState() }, '+ Zustand hinzufügen')),
      this.msg,
      h('label', { class: 'check', for: `${this.uid}-impl` }, this.implicitBox, ' Alle nicht eingezeichneten Übergänge führen in einen Fehlerzustand'),
      this.missingInfo);
    container.append(this.el);
    if (value) this.load(value);
    else this._init(alphabet);
  }

  _init(alphabet) {
    const id = this._id();
    this.m = { alphabet: [...alphabet], states: [{ id, name: 'S0' }], start: id, accepting: new Set(), delta: { [id]: {} }, implicitError: false };
    this._render(); this._changed(false);
  }

  _id() { return `q${this.nextId++}`; }
  _name(id) { return this.m.states.find((s) => s.id === id)?.name; }

  load(json) {
    const A = normalizeDFA(json);
    this.nextId = 0;
    const ids = new Map(A.states.map((s) => [s, this._id()]));
    const delta = {};
    for (const s of A.states) {
      delta[ids.get(s)] = {};
      for (const a of A.alphabet) if (A.delta[s][a] != null) delta[ids.get(s)][a] = ids.get(A.delta[s][a]);
    }
    this.m = { alphabet: [...A.alphabet], states: A.states.map((s) => ({ id: ids.get(s), name: s })), start: ids.get(A.start),
      accepting: new Set(A.accepting.map((s) => ids.get(s))), delta, implicitError: !!A.implicitError };
    this._render(); this._changed(false);
  }

  setAlphabet(alphabet) {
    this.m.alphabet = [...alphabet];
    for (const row of Object.values(this.m.delta)) for (const k of Object.keys(row)) if (!alphabet.includes(k)) delete row[k];
    this._render(); this._changed();
  }

  toJSON() {
    const n = (id) => this._name(id);
    const delta = {};
    for (const s of this.m.states) {
      delta[s.name] = {};
      for (const a of this.m.alphabet) { const t = this.m.delta[s.id]?.[a]; if (t) delta[s.name][a] = n(t); }
    }
    return { alphabet: [...this.m.alphabet], states: this.m.states.map((s) => s.name), start: n(this.m.start),
      accepting: this.m.states.filter((s) => this.m.accepting.has(s.id)).map((s) => s.name), delta, implicitError: this.m.implicitError };
  }

  toDFA() { return normalizeDFA(this.toJSON()); }

  missing() {
    const out = [];
    for (const s of this.m.states) for (const a of this.m.alphabet) if (!this.m.delta[s.id]?.[a]) out.push([s.name, a]);
    return out;
  }

  addState() {
    const used = new Set(this.m.states.map((s) => s.name));
    let k = 0; while (used.has(`S${k}`)) k++;
    const id = this._id();
    this.m.states.push({ id, name: `S${k}` });
    this.m.delta[id] = {};
    this._render(); this._changed();
    this.tableWrap.querySelector(`[data-id="${id}"] .state-name`)?.focus();
  }

  removeState(id) {
    if (this.m.states.length <= 1) return;
    const name = this._name(id);
    this.m.states = this.m.states.filter((s) => s.id !== id);
    delete this.m.delta[id];
    this.m.accepting.delete(id);
    for (const row of Object.values(this.m.delta)) for (const [a, t] of Object.entries(row)) if (t === id) delete row[a];
    if (this.m.start === id) this.m.start = this.m.states[0].id;
    this.msg.textContent = `${name} wurde gelöscht. Übergänge, die nach ${name} führten, fehlen jetzt.`;
    this._render(); this._changed();
  }

  rename(id, raw, input) {
    const name = raw.trim();
    const old = this._name(id);
    if (name === old) return;
    if (!NAME_OK.test(name)) {
      this.msg.textContent = 'Zustandsnamen: 1–12 Zeichen, ohne Leerzeichen, Kommas oder Klammern (z. B. S3).';
      input.value = old; return;
    }
    if (this.m.states.some((s) => s.name === name)) {
      this.msg.textContent = `Den Namen ${name} gibt es schon.`;
      input.value = old; return;
    }
    this.m.states.find((s) => s.id === id).name = name;
    this.msg.textContent = '';
    this._render(); this._changed();
  }

  _render() {
    const { alphabet, states } = this.m;
    const head = h('tr', null,
      h('th', { scope: 'col' }, 'Zustand'),
      h('th', { scope: 'col', class: 'col-flag' }, 'Start'),
      h('th', { scope: 'col', class: 'col-flag' }, 'End­zustand'),
      alphabet.map((a) => h('th', { scope: 'col', class: 'col-sym' }, h('span', { class: 'sym' }, a))),
      h('th', { scope: 'col', class: 'col-del' }, h('span', { class: 'sr-only' }, 'Löschen')));
    const rows = states.map((s) => {
      const nameInput = h('input', { type: 'text', class: 'state-name', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', value: s.name, 'aria-label': `Name von Zustand ${s.name}`, maxlength: 12,
        onchange: (e) => this.rename(s.id, e.target.value, e.target),
        onkeydown: (e) => { if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); } } });
      return h('tr', { dataset: { id: s.id } },
        h('th', { scope: 'row' }, nameInput),
        h('td', { class: 'col-flag' }, h('label', { class: 'flag-hit' }, h('input', { type: 'radio', name: `${this.uid}-start`, checked: this.m.start === s.id, 'aria-label': `${s.name} ist Startzustand`,
          onchange: () => { this.m.start = s.id; this._changed(); } }))),
        h('td', { class: 'col-flag' }, h('label', { class: 'flag-hit' }, h('input', { type: 'checkbox', checked: this.m.accepting.has(s.id), 'aria-label': `${s.name} ist Endzustand`,
          onchange: (e) => { if (e.target.checked) this.m.accepting.add(s.id); else this.m.accepting.delete(s.id); this._changed(); } }))),
        alphabet.map((a) => {
          const cur = this.m.delta[s.id]?.[a] ?? '';
          return h('td', { class: 'col-sym' }, h('select', {
            class: ['delta-select', !cur && 'is-empty'], 'aria-label': `δ(${s.name}, ${a})`,
            onchange: (e) => { const v = e.target.value; if (v) this.m.delta[s.id][a] = v; else delete this.m.delta[s.id][a]; e.target.classList.toggle('is-empty', !v); this._changed(); },
          }, h('option', { value: '' }, '–'), states.map((t) => h('option', { value: t.id, selected: t.id === cur }, t.name))));
        }),
        h('td', { class: 'col-del' }, h('button', { type: 'button', class: 'btn btn-icon btn-ghost', 'aria-label': `${s.name} löschen`, title: `${s.name} löschen`,
          disabled: states.length <= 1, onclick: () => this.removeState(s.id) }, '×')));
    });
    clear(this.tableWrap, h('table', { class: 'delta-table' },
      h('caption', null, 'Übergangstabelle δ: In jeder Zelle steht der Folgezustand.'),
      h('thead', null, head), h('tbody', null, rows)));
    this.implicitBox.checked = this.m.implicitError;
  }

  _changed(notify = true) {
    const miss = this.missing();
    if (!miss.length) this.missingInfo.textContent = 'Der Automat ist vollständig: Jeder Zustand hat zu jedem Zeichen einen Übergang.';
    else if (this.m.implicitError) this.missingInfo.textContent = `${miss.length} ${miss.length === 1 ? 'Übergang führt' : 'Übergänge führen'} in den (nicht gezeichneten) Fehlerzustand.`;
    else this.missingInfo.textContent = `Noch ${miss.length} ${miss.length === 1 ? 'Übergang fehlt' : 'Übergänge fehlen'}, z. B. von ${miss[0][0]} mit ${miss[0][1]}.`;
    this.missingInfo.classList.toggle('is-warn', miss.length > 0 && !this.m.implicitError);
    if (notify) this.onChange(this);
  }
}
