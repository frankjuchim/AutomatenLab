// Keller-Labor (#/keller, DS09–10): NKA-Schrittsimulator mit Kellerspeicher, Tabellen-Trainer (Abi-Format)
// und Rückwärts-Aufgaben (Eingabewort aus Zustands-/Kellerfolge bestimmen, wie Abi 2022 C c).
// Notation: (oberstes Kellerzeichen, Eingabezeichen) : Ablage – rechtes Zeichen zuerst abgelegt, Vorbelegung #,
// Akzeptanz: Endzustand nach vollständig gelesener Eingabe.
// Deep-Links: #/keller?automat=<id>&modus=sim|tabelle|rueckwaerts  (&wort=… für sim/tabelle),
//             #/keller?demo=1[&modus=…] (Demo-Automat im Gastmodus)
// Tabellen und Rückwärts-Aufgaben prüft die Quelle (Server bzw. Demo), Punkte vergibt nur der Server. Die Zeilen des
// Tabellen-Trainers gibt die Engine sofort zurück (der Automat ist Gegenstand der Aufgabe); gewertet wird die fertige
// Tabelle. Ein eigenes Wort (&wort= außerhalb der Liste) ist Übung ohne Punkte.

import { h, clear, quote } from '../core/dom.js';
import { pda, runPDA, successors, initialConfig, searchFrom, runToTable, transitionLabel, isDeterministic, matchesConfigSequence } from '../engine/pda.js';
import { tokenize, wordToString, isEpsilon, EPS } from '../engine/tokenize.js';
import { GraphView } from '../components/graph-view.js';
import { WordTape } from '../components/word-tape.js';
import { StackView } from '../components/stack-view.js';

const MODI = { sim: 'Simulator', tabelle: 'Tabellen-Trainer', rueckwaerts: 'Rückwärts' };
const stackText = (st) => (st.length ? st.join('') : EPS);
const shown = (tokens, P) => (tokens.length ? quote(wordToString(tokens, P.inputAlphabet)) : 'ε');
const TABLE_HEAD = ['Zustand', 'Belegung Kellerspeicher', 'oberstes Kellersymbol', 'verarbeitetes Eingabezeichen'];
const SHORT_HEAD = ['Zustand', 'Keller', 'oben', 'Eingabe'];
/** Kopfzeile: lange Abi-Bezeichnung, auf schmalen Bildschirmen Kurzform. */
const headRow = () => h('tr', null, TABLE_HEAD.map((t, i) => h('th', { scope: 'col' }, h('span', { class: 'th-long' }, t), h('span', { class: 'th-short', 'aria-hidden': 'true' }, SHORT_HEAD[i]))));

/** Erklärt einen Übergang in Worten (für Simulator und Tabellen-Tipps). */
function explain(t, before) {
  const push = t.push.length ? `„${t.pushLabel}“ abgelegt${t.push.length > 1 ? ` (rechtes Zeichen zuerst, also liegt ${t.push[0]} oben)` : ''}` : 'nichts abgelegt (ε)';
  const read = t.input === EPS ? 'ohne ein Zeichen zu lesen (ε-Übergang)' : `„${t.input}“ gelesen`;
  return `In ${t.from} mit ${before.stack[0]} oben: Übergang ${transitionLabel(t)} – ${t.top} wird entfernt, ${push}, ${read} → ${t.to}.`;
}

/** Zelle; „–“ (erste Zeile: nichts gelesen) gedämpft, damit es nicht mit einem Eingabezeichen „-“ verwechselt wird. */
const cell = (v) => h('td', { class: v === '–' ? 'kl-none' : null }, v);

function abiTable(rows, extra) {
  return h('div', { class: 'table-scroll' }, h('table', { class: 'abi-table kl-abi' },
    h('thead', null, headRow()),
    h('tbody', null, rows.map((r) => h('tr', null, h('td', null, r.zustand), h('td', null, r.keller), cell(r.oberstes), cell(r.eingabe))), extra ?? null)));
}

export default {
  title: 'Keller-Labor',
  mount(el, ctx) {
    const q = ctx.quelle; // Server (angemeldet) oder Demo (Gastmodus)
    const p = ctx.params;
    let aktiv = true;
    let aufraeumen = null;
    let GRUPPEN = []; // [{ nr, schluessel, titel, t: Tabellen-Eintrag, r: Rückwärts-Eintrag }]
    const fehler = (e) => { if (aktiv) clear(el, h('p', { class: 'notice notice-error' }, e.message)); };
    const par = (x, extra = {}) => (q.demo ? { demo: 1, ...extra } : { automat: x.schluessel ?? x.id, ...extra });
    clear(el, h('p', { class: 'muted' }, 'Lade …'));
    (async () => {
      const liste = await q.liste('keller');
      if (!aktiv) return;
      const byNr = new Map();
      for (const e of liste) {
        const nr = e.nr ?? 0;
        if (!byNr.has(nr)) byNr.set(nr, { nr, schluessel: (e.schluessel ?? '').split(':')[0], titel: e.titel.replace(/^Demo: /, '').replace(/(: | – )(Tabellen-Trainer|Rückwärts)$/, '') });
        byNr.get(nr)[e.art === 'rueckwaerts' ? 'r' : 't'] = e;
      }
      GRUPPEN = [...byNr.values()].sort((x, y) => x.nr - y.nr);
      const g = q.demo ? GRUPPEN[0] : (GRUPPEN.find((x) => x.schluessel === p.get('automat')) ?? GRUPPEN.find((x) => x.nr === Number(p.get('aufgabe'))) ?? null);
      if (!g) { overview(); return; }
      const modus = MODI[p.get('modus')] ? p.get('modus') : 'sim';
      const d = await q.aufgabe(modus === 'rueckwaerts' ? g.r.id : g.t.id);
      if (!aktiv) return;
      const P = pda(d.aufgabe.automat);
      const k = { ...d.aufgabe, id: g.schluessel, schluessel: g.schluessel, aufgabeId: d.id, nr: g.nr, gruppe: g, P, det: isDeterministic(P), tabelle: d.aufgabe.worte, zustand: d.zustand, loesung: d.loesung ?? null };
      ctx.setSubtitle(q.demo ? `${MODI[modus]} · Demo: ${g.titel} (ohne Punkte)` : `${MODI[modus]} · ${g.titel}`);
      const head = [modeTabs(k, modus), taskPanel(k)];
      aufraeumen = modus === 'tabelle' ? tabelle(k, head, p.get('wort')) : modus === 'rueckwaerts' ? rueckwaerts(k, head) : sim(k, head, p.get('wort'));
    })().catch(fehler);
    return () => { aktiv = false; aufraeumen?.(); };

    // ───────────────────────── Übersicht ─────────────────────────
    function overview() {
      ctx.setSubtitle('Kellerautomaten Schritt für Schritt – mit Stapel, Abi-Tabelle und Rückwärts-Rätseln.');
      clear(el,
        h('div', { class: 'panel me-intro' },
          h('p', { class: 'lead' }, 'Ein Kellerautomat ist ein endlicher Automat mit Gedächtnis: einem Stapel (Kellerspeicher), auf den er Zeichen ablegen und von dem er das oberste Zeichen lesen und entfernen kann.'),
          notation()),
        h('ol', { class: 'case-grid' }, GRUPPEN.map((g) => {
          const t = ctx.progress.isSolved('keller', g.t.schluessel);
          const r = ctx.progress.isSolved('keller', g.r.schluessel);
          return h('li', null, h('a', { class: ['case-card', t && r && 'is-solved'], href: ctx.link('keller', { automat: g.schluessel }) },
            h('span', { class: 'case-nr' }, `Automat ${g.nr}`),
            h('span', { class: 'case-title' }, g.titel),
            h('span', { class: 'case-state' }, `Tabellen ${t ? '✓' : `${g.t.punkte} P.`} · Rückwärts ${r ? '✓' : `${g.r.punkte} P.`}`)));
        })));
    }

    function notation() {
      return h('details', { class: 'tipp kl-notation' }, h('summary', null, 'So liest du die Kanten'),
        h('ul', null,
          h('li', null, h('code', null, '(A, b) : ε'), ' – oben liegt A, gelesen wird b: A wird entfernt, nichts abgelegt.'),
          h('li', null, h('code', null, '(#, a) : A#'), ' – # wird entfernt, dann wird „A#“ abgelegt: das rechte Zeichen zuerst, danach liegt A oben.'),
          h('li', null, h('code', null, '(#, ε) : #'), ' – ε-Übergang: Es wird kein Zeichen gelesen.'),
          h('li', null, 'Akzeptiert wird, wenn es einen Lauf gibt, nach dem die Eingabe vollständig gelesen ist und der Automat in einem Endzustand steht.')));
    }

    function modeTabs(x, active) {
      return h('nav', { class: 'mode-tabs', 'aria-label': 'Modus' }, Object.entries(MODI).map(([m, label]) =>
        h('a', { href: ctx.link('keller', par(x, { modus: m })), 'aria-current': m === active ? 'page' : null }, label)));
    }

    function taskPanel(x) {
      const P = x.P;
      return h('div', { class: 'panel task-panel' },
        q.demo ? h('p', { class: 'notice gast-hinweis' }, h('strong', null, 'Demo. '), 'Ein eigener Kellerautomat zum Ausprobieren – ohne Punkte. Die zehn Automaten gibt es nach der Anmeldung.') : null,
        h('p', { class: 'task-text' }, x.kontext),
        h('p', { class: 'sigma' }, `Σ = {${P.inputAlphabet.join(', ')}} · Γ = {${P.stackAlphabet.join(', ')}} · Vorbelegung ${P.initial} · Startzustand ${P.start} · Endzustände ${P.accepting.join(', ')} · ${x.det ? 'deterministisch (DKA)' : 'nichtdeterministisch (NKA)'}`),
        h('div', { class: 'kl-details' }, notation(),
          h('details', { class: 'tipp' }, h('summary', null, 'Bedeutung des Kellerspeichers'), h('p', null, x.keller))));
    }

    function caseNav(x, mod) {
      if (q.demo) return h('nav', { class: 'case-nav', 'aria-label': 'Automaten' }, h('a', { class: 'btn btn-ghost', href: ctx.link('gast') }, 'Weitere Demo-Aufgaben'));
      const prev = GRUPPEN.find((y) => y.nr === x.nr - 1); const next = GRUPPEN.find((y) => y.nr === x.nr + 1);
      return h('nav', { class: 'case-nav', 'aria-label': 'Automaten' },
        prev ? h('a', { class: 'btn btn-ghost', href: ctx.link('keller', { automat: prev.schluessel, modus: mod }) }, `‹ ${prev.titel}`) : h('span'),
        h('a', { class: 'btn btn-ghost', href: ctx.link('keller') }, 'Alle Automaten'),
        next ? h('a', { class: 'btn btn-ghost', href: ctx.link('keller', { automat: next.schluessel, modus: mod }) }, `${next.titel} ›`) : h('span'));
    }

    function graphPanel(x, extraClass) {
      const box = h('div', { class: ['panel kl-stage', x.P.transitions.length > 8 && 'is-dense', extraClass] });
      const gv = new GraphView(box, { label: `Kellerautomat: ${x.titel}`, minScale: 0.75 });
      const ready = gv.render(x.P);
      return { box, gv, ready };
    }

    // ───────────────────────── Simulator ─────────────────────────
    function sim(x, headEls, wort) {
      const P = x.P;
      const { box: left, gv, ready } = graphPanel(x);
      const machine = h('div', { class: 'kl-machine' });
      const tapeBox = h('div', { class: 'kl-tape' });
      const tape = new WordTape(tapeBox, { size: 'l', label: 'Eingabeband' });
      const stackBox = h('div', { class: 'kl-stack' });
      const stack = new StackView(stackBox);
      const stateEl = h('p', { class: 'kl-state' });
      machine.append(h('div', { class: 'kl-tape-col' }, h('span', { class: 'tape-label' }, 'Eingabeband'), tapeBox, stateEl), h('div', { class: 'kl-stack-col' }, h('span', { class: 'tape-label' }, 'Kellerspeicher'), stackBox));
      left.append(machine);
      const say = h('p', { class: 'run-say kl-say', 'aria-live': 'polite' });
      const options = h('div', { class: 'kl-options' });
      const verdict = h('div', { class: 'kl-verdict', 'aria-live': 'polite' });
      const tableSlot = h('div');

      let tokens = []; let hist = []; let timer = null; let overall = null; let mode = null;

      const input = h('input', { type: 'text', id: 'kl-word', class: 'word-input', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', placeholder: `z. B. ${x.sim[0]}` });
      const msg = h('p', { class: 'field-msg', 'aria-live': 'polite' });
      const bBack = h('button', { type: 'button', class: 'btn btn-small', onclick: () => { stop(); if (hist.length > 1) { hist.pop(); render(); } } }, '◀ Schritt zurück');
      const bReset = h('button', { type: 'button', class: 'btn btn-small btn-ghost', onclick: () => { stop(); hist = hist.slice(0, 1); render(); } }, 'Neu starten');
      const bPlay = h('button', { type: 'button', class: 'btn btn-small', onclick: () => (timer ? stop() : play()) }, 'Abspielen');
      const bAuto = h('button', { type: 'button', class: 'btn btn-small', onclick: () => auto() }, 'Automatisch: akzeptierenden Lauf finden');

      function load(w) {
        const tk = tokenize(w, P.inputAlphabet);
        if (!tk.ok) { msg.textContent = tk.message; input.setAttribute('aria-invalid', 'true'); return; }
        msg.textContent = ''; input.removeAttribute('aria-invalid');
        stop();
        tokens = tk.tokens;
        hist = [{ config: initialConfig(P), t: null }];
        overall = runPDA(P, tokens);
        tape.set(tokens);
        stack.set(hist[0].config.stack, { animate: false });
        render();
      }

      function render() {
        const { config, t } = hist.at(-1);
        tape.setHead(config.pos);
        stack.set(config.stack);
        ready.then(() => gv.highlight({ active: config.state, edge: t ? [t.from, t.to] : null, visited: hist.slice(0, -1).map((y) => y.config.state) }));
        stateEl.textContent = `Zustand: ${config.state}`;
        say.textContent = t ? explain(t, hist.at(-2).config) : `Start in ${P.start}, im Keller liegt nur die Vorbelegung ${P.initial}.`;
        const succ = successors(P, config, tokens);
        const done = config.pos === tokens.length && P.accepting.includes(config.state);
        clear(options);
        if (succ.length) {
          options.append(h('p', { class: 'kl-opt-title' }, succ.length === 1 ? 'Möglicher Übergang:' : `${succ.length} mögliche Übergänge – der Automat muss raten. Wähle einen:`),
            h('div', { class: 'kl-opt-list' }, succ.map((s) => h('button', { type: 'button', class: ['btn', succ.length === 1 && 'btn-primary', 'kl-opt'], onclick: () => { stop(); step(s); } },
              h('code', null, transitionLabel(s.t)), h('span', null, ` → ${s.t.to}`)))));
        }
        clear(verdict);
        if (done) {
          tape.setVerdict('accept');
          verdict.append(h('div', { class: 'notice notice-success' }, h('p', null, h('strong', null, 'Akzeptiert. '), `Die Eingabe ist vollständig gelesen und ${config.state} ist ein Endzustand.${succ.length ? ' (Weitere ε-Übergänge wären möglich, sind aber nicht nötig.)' : ''}`)));
        } else if (!succ.length) {
          tape.setVerdict('reject');
          const why = config.pos < tokens.length
            ? `Von ${config.state} mit ${config.stack[0] ?? 'leerem Keller'} oben gibt es keinen Übergang für das nächste Zeichen „${tokens[config.pos]}“ – die Eingabe wird nicht vollständig gelesen.`
            : `Die Eingabe ist gelesen, aber ${config.state} ist kein Endzustand und es gibt keinen weiteren Übergang.`;
          const total = x.det ? 'Der Automat ist deterministisch – es gibt keinen anderen Lauf: Das Wort wird nicht akzeptiert.'
            : overall.accepted ? 'Dieser Lauf führt nicht zum Ziel – es gibt aber einen anderen, akzeptierenden Lauf. Geh zurück und rate anders (oder lass ihn automatisch suchen).'
              : 'Auch kein anderer Lauf führt zum Ziel: Das Wort wird nicht akzeptiert.';
          verdict.append(h('div', { class: 'notice notice-error' }, h('p', null, h('strong', null, 'Steckt fest. '), why), h('p', null, total)));
        } else tape.setVerdict(null);
        clear(tableSlot, h('h2', { class: 'me-h2' }, 'Verarbeitung als Tabelle (Abi-Format)'), abiTable(runToTable(hist)),
          done ? h('p', { class: 'kl-acc' }, 'Eingabe wird akzeptiert: ja') : (!succ.length ? h('p', { class: 'kl-acc' }, `Eingabe wird akzeptiert: ${overall.accepted ? 'ja (auf einem anderen Lauf)' : 'nein'}`) : null));
        bBack.disabled = hist.length <= 1; bReset.disabled = hist.length <= 1;
        bPlay.disabled = succ.length !== 1;
        bAuto.disabled = done;
        if (mode === 'play' && (succ.length !== 1 || done)) stop();
      }

      function step(s) { hist.push({ config: s.config, t: s.t }); render(); }
      function stop() { clearInterval(timer); timer = null; mode = null; bPlay.textContent = 'Abspielen'; }
      function play() {
        mode = 'play';
        bPlay.textContent = 'Pause';
        timer = setInterval(() => {
          const c = hist.at(-1).config;
          const succ = successors(P, c, tokens);
          if (succ.length !== 1 || (c.pos === tokens.length && P.accepting.includes(c.state))) { stop(); render(); return; }
          step(succ[0]);
        }, 900);
      }
      function auto() {
        stop();
        const r = searchFrom(P, tokens, hist.at(-1).config);
        if (!r.accepted) {
          clear(verdict, h('div', { class: 'notice notice-error' }, h('p', null, h('strong', null, 'Von hier aus gibt es keinen akzeptierenden Lauf. '),
            overall.accepted ? 'Geh ein paar Schritte zurück – irgendwo wurde falsch geraten.' : 'Das Wort wird von diesem Automaten nicht akzeptiert.')));
          return;
        }
        const rest = r.run.slice(1);
        if (!rest.length) return;
        mode = 'auto'; bPlay.textContent = 'Pause';
        timer = setInterval(() => { const s = rest.shift(); if (!s) { stop(); return; } step(s); if (!rest.length) stop(); }, 700);
      }

      const right = h('div', { class: 'stack-col' },
        h('div', { class: 'panel kl-p-form' },
          h('form', { class: 'word-form', onsubmit: (e) => { e.preventDefault(); load(input.value); } },
            h('label', { for: 'kl-word' }, 'Eingabewort'),
            h('div', { class: 'input-row' }, input, h('button', { type: 'submit', class: 'btn btn-primary' }, 'Laden')), msg,
            h('div', { class: 'chip-row' }, [...x.sim, ...x.beispiele.ja.slice(0, 2), ...x.beispiele.nein.slice(0, 2)].filter((w, i, a) => a.indexOf(w) === i)
              .map((w) => h('button', { type: 'button', class: 'chip', onclick: () => { input.value = isEpsilon(w) ? '' : w; load(w); } }, w))))),
        h('div', { class: 'panel kl-control' }, say, options, h('div', { class: 'kl-buttons' }, bPlay, bBack, bReset, x.det ? null : bAuto), verdict),
        h('div', { class: 'panel kl-p-table' }, tableSlot));
      clear(el, ...headEls, h('div', { class: 'two-col kl-sim' }, h('div', { class: 'kl-sticky' }, left), right), caseNav(x, 'sim'));
      const start = wort ?? x.sim[0];
      input.value = isEpsilon(start) ? '' : start;
      load(start);
      return () => stop();
    }

    // ───────────────────────── Tabellen-Trainer ─────────────────────────
    function tabelle(x, headEls, wort) {
      const P = x.P;
      const words = [...new Set([...(wort != null ? [wort] : []), ...x.tabelle])];
      const w = words[0];
      const wortNr = x.tabelle.indexOf(w); // −1 = eigenes Wort: Übung ohne Punkte
      let zustand = x.zustand;
      const tk = tokenize(w, P.inputAlphabet);
      if (!tk.ok) { clear(el, ...headEls, h('p', { class: 'notice notice-error' }, tk.message)); return null; }
      const tokens = tk.tokens;
      const overall = runPDA(P, tokens);
      const { box: left, gv, ready } = graphPanel(x);
      const stackBox = h('div', { class: 'kl-stack' });
      const stack = new StackView(stackBox);
      const tapeBox = h('div');
      const tape = new WordTape(tapeBox, { label: 'Eingabeband' });
      tape.set(tokens);
      left.append(h('div', { class: 'kl-machine' }, h('div', { class: 'kl-tape-col' }, h('span', { class: 'tape-label' }, 'Eingabewort'), tapeBox), h('div', { class: 'kl-stack-col' }, h('span', { class: 'tape-label' }, 'Keller (letzte Zeile)'), stackBox)));
      const hist = [{ config: initialConfig(P), t: null }];
      let wrongTries = 0; let finished = false;
      const tbody = h('tbody');
      const fb = h('div', { class: 'kl-fb', 'aria-live': 'polite' });
      const sel = (id, label, opts) => h('select', { id, 'aria-label': label }, h('option', { value: '' }, '–'), opts.map((o) => h('option', { value: o }, o)));
      const fZ = sel('kl-z', 'Zustand', P.states);
      const fK = h('input', { type: 'text', id: 'kl-k', class: 'word-input kl-k', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', placeholder: 'z. B. AA#', 'aria-label': 'Belegung Kellerspeicher, oberstes Zeichen links' });
      const fO = sel('kl-o', 'oberstes Kellersymbol', P.stackAlphabet);
      const fE = sel('kl-e', 'verarbeitetes Eingabezeichen', [...P.inputAlphabet, EPS]);
      const rowForm = h('tr', { class: 'kl-input-row' }, h('td', null, fZ), h('td', null, fK), h('td', null, fO), h('td', null, fE));

      function paint() {
        clear(tbody, runToTable(hist).map((r) => h('tr', null, h('td', null, r.zustand), h('td', null, r.keller), cell(r.oberstes), cell(r.eingabe))), finished ? null : rowForm);
        const c = hist.at(-1).config;
        tape.setHead(c.pos);
        stack.set(c.stack);
        ready.then(() => gv.highlight({ active: c.state, edge: hist.at(-1).t ? [hist.at(-1).t.from, hist.at(-1).t.to] : null }));
      }

      function checkRow() {
        if (finished) return;
        const prev = hist.at(-1).config;
        const z = fZ.value; const o = fO.value; const e = fE.value;
        const kt = tokenize(fK.value.replace(/\s+/g, ''), P.stackAlphabet);
        if (!z || !o || !e) { clear(fb, h('p', { class: 'notice notice-warn' }, 'Fülle alle vier Felder der Zeile aus.')); return; }
        if (!kt.ok) { clear(fb, h('p', { class: 'notice notice-error' }, `Belegung: ${kt.message.replace('Eingabealphabet Σ', 'Kelleralphabet Γ')}`)); return; }
        const kel = kt.tokens;
        const succ = successors(P, prev, tokens);
        const hit = succ.find((s) => s.t.top === o && s.t.input === e && s.config.state === z && s.config.stack.join('\u0001') === kel.join('\u0001'));
        if (hit) {
          hist.push({ config: hit.config, t: hit.t }); wrongTries = 0;
          clear(fb, h('p', { class: 'notice notice-success' }, `Richtig: ${transitionLabel(hit.t)} von ${hit.t.from} nach ${hit.t.to}.`));
          fZ.value = ''; fK.value = ''; fO.value = ''; fE.value = '';
          paint(); fZ.focus({ preventScroll: true });
          return;
        }
        wrongTries++;
        const tips = [];
        if (!succ.length) tips.push('Von dieser Konfiguration aus gibt es keinen Übergang mehr. Schließe die Tabelle ab: Wird die Eingabe akzeptiert?');
        else if (o !== prev.stack[0]) tips.push(`Das oberste Kellersymbol ist das Zeichen, das vor dem Schritt oben liegt: ${prev.stack[0]} (Belegung der vorigen Zeile, linkes Zeichen).`);
        else if (e !== EPS && e !== tokens[prev.pos]) tips.push(prev.pos >= tokens.length ? 'Die Eingabe ist schon vollständig gelesen – jetzt sind nur noch ε-Übergänge möglich.' : `Als nächstes steht „${tokens[prev.pos]}“ auf dem Band (oder ein ε-Übergang).`);
        else {
          const cand = succ.filter((s) => s.t.top === o && s.t.input === e);
          if (!cand.length) tips.push(`Von ${prev.state} gibt es keinen Übergang mit (${o}, ${e}). ${succ.length ? `Möglich ist: ${succ.map((s) => transitionLabel(s.t)).join(' oder ')}.` : ''}`);
          else {
            const c0 = cand[0];
            if (!cand.some((s) => s.config.state === z)) tips.push(`Der Übergang ${transitionLabel(c0.t)} führt nach ${wrongTries >= 2 ? c0.t.to : '… schau im Graphen nach'}.`);
            if (!cand.some((s) => s.config.stack.join('\u0001') === kel.join('\u0001'))) tips.push(`Belegung: ${o} wird entfernt, dann „${c0.t.pushLabel}“ abgelegt (rechtes Zeichen zuerst, oberstes steht links).${wrongTries >= 2 ? ` Ergebnis: ${stackText(c0.config.stack)}.` : ''}`);
          }
        }
        clear(fb, h('div', { class: 'notice notice-error' }, h('p', null, h('strong', null, 'Diese Zeile stimmt nicht. '), tips.join(' '))));
      }

      async function finish(saysYes) {
        if (finished) return;
        const c = hist.at(-1).config;
        const accRow = c.pos === tokens.length && P.accepting.includes(c.state);
        const stuck = successors(P, c, tokens).length === 0;
        if (saysYes !== overall.accepted) {
          clear(fb, h('div', { class: 'notice notice-error' }, h('p', null, h('strong', null, 'Nicht ganz. '), overall.accepted
            ? 'Das Wort wird akzeptiert – es gibt einen Lauf, nach dem die Eingabe vollständig gelesen ist und der Automat in einem Endzustand steht.'
            : 'Das Wort wird nicht akzeptiert: Kein Lauf endet nach vollständig gelesener Eingabe in einem Endzustand.')));
          return;
        }
        if (saysYes && !accRow) { clear(fb, h('p', { class: 'notice notice-warn' }, 'Richtig, das Wort wird akzeptiert – aber deine Tabelle zeigt den akzeptierenden Lauf noch nicht bis zum Ende. Ergänze die fehlenden Zeilen.')); return; }
        if (!saysYes && !stuck) { clear(fb, h('p', { class: 'notice notice-warn' }, 'Richtig, das Wort wird nicht akzeptiert – dokumentiere aber den Lauf, bis kein Übergang mehr möglich ist.')); return; }
        finished = true;
        paint();
        let r = null;
        if (wortNr >= 0) {
          try { r = await q.pruefen(x.aufgabeId, { wort: wortNr, zeilen: runToTable(hist), akzeptiert: saysYes }); } catch (e) { clear(fb, h('p', { class: 'notice notice-error' }, e.message)); return; }
          zustand = r.zustand ?? zustand;
          if (r.punkteErhalten) ctx.toast(`+${r.punkteErhalten} Punkte`, { type: 'success' });
          if (!r.rueckmeldung.richtig) { finished = false; paint(); clear(fb, h('p', { class: 'notice notice-error' }, 'Die Tabelle wurde nicht anerkannt – prüfe Zeilen und Entscheidung.')); return; }
        }
        const nextW = x.tabelle[wortNr + 1];
        clear(fb, h('div', { class: 'notice notice-success' }, h('p', null, h('strong', null, 'Tabelle vollständig! '), `Eingabe wird akzeptiert: ${saysYes ? 'ja' : 'nein'}.`),
          !x.det ? h('p', { class: 'muted' }, 'Bei einem NKA genügt es, einen akzeptierenden Lauf zu dokumentieren.') : null,
          wortNr < 0 ? h('p', { class: 'muted' }, 'Eigenes Wort: Übung ohne Punkte.') : r && !q.demo ? h('p', { class: 'muted' }, `${r.rueckmeldung.erledigt} von ${r.rueckmeldung.von} Tabellen zu diesem Automaten geschafft${r.rueckmeldung.fertig ? ' – Aufgabe gelöst' : ''}.`) : null),
        h('div', { class: 'start-actions' },
          nextW ? h('a', { class: 'btn btn-primary', href: ctx.link('keller', par(x, { modus: 'tabelle', wort: nextW })) }, `Nächstes Wort: ${nextW}`) : null,
          h('a', { class: 'btn', href: ctx.link('keller', par(x, { modus: 'rueckwaerts' })) }, 'Rückwärts-Aufgabe')));
      }

      const right = h('div', { class: 'stack-col' },
        h('div', { class: 'panel' },
          h('p', { class: 'kl-task' }, h('strong', null, 'Dokumentiere '), `die Verarbeitung der Eingabe ${shown(tokens, P)} in Form einer Tabelle.`),
          h('div', { class: 'chip-row', 'aria-label': 'Andere Wörter' }, x.tabelle.map((v) => h('a', { class: ['chip', v === w && 'is-on'], href: ctx.link('keller', par(x, { modus: 'tabelle', wort: v })) }, v))),
          !q.demo && zustand ? h('p', { class: 'muted' }, zustand.status === 'geloest' ? 'Alle Tabellen zu diesem Automaten hast du schon geschafft – zum Üben kannst du sie wiederholen.'
            : zustand.status === 'offen' ? `Die Aufgabe ist gelöst, wenn alle ${x.tabelle.length} Tabellen stimmen. Eine abgegebene falsche Tabelle kostet Punkte (jetzt noch ${zustand.moeglich} von ${zustand.maxPunkte}).` : '') : null,
          h('form', { class: 'kl-table-form', onsubmit: (e) => { e.preventDefault(); checkRow(); } },
            h('div', { class: 'table-scroll' }, h('table', { class: 'abi-table kl-abi kl-trainer' },
              h('thead', null, headRow()), tbody)),
            h('p', { class: 'muted kl-help' }, 'Belegung mit dem obersten Zeichen links, z. B. AA# (leerer Keller: ε). Die erste Zeile ist vorgegeben.'),
            h('div', { class: 'start-actions' }, h('button', { type: 'submit', class: 'btn btn-primary' }, 'Zeile prüfen'))),
          h('div', { class: 'kl-final' }, h('span', { class: 'kl-final-label' }, 'Eingabe wird akzeptiert:'),
            h('button', { type: 'button', class: 'btn', onclick: () => finish(true) }, 'ja'),
            h('button', { type: 'button', class: 'btn', onclick: () => finish(false) }, 'nein')),
          fb));
      clear(el, ...headEls, h('div', { class: 'two-col' }, h('div', { class: 'kl-sticky' }, left), right), caseNav(x, 'tabelle'));
      stack.set(hist[0].config.stack, { animate: false });
      paint();
      return null;
    }

    // ───────────────────────── Rückwärts ─────────────────────────
    function rueckwaerts(x, headEls) {
      const P = x.P;
      const seq = x.folge;
      let zustand = x.zustand;
      let loesung = x.loesung;
      // Mehrdeutig? (verschiedene Eingabezeichen führen zur selben nächsten Konfiguration)
      const ambiguous = seq.slice(0, -1).some((c, i) => {
        const inputs = new Set(P.transitions.filter((t) => t.from === c.state && t.top === c.stack[0] && t.to === seq[i + 1].state
          && [...t.push, ...c.stack.slice(1)].join('\u0001') === seq[i + 1].stack.join('\u0001')).map((t) => t.input));
        return inputs.size > 1;
      });
      const { box: left } = graphPanel(x);
      const film = h('ol', { class: 'kl-film', 'aria-label': 'Folge von Zuständen und Kellerbelegungen' }, seq.map((c, i) =>
        h('li', { class: 'kl-frame' },
          h('span', { class: 'kl-frame-nr' }, i === 0 ? 'Start' : `${i}.`),
          h('ol', { class: 'kl-mini-stack', 'aria-label': `Keller von oben: ${stackText(c.stack)}` }, c.stack.length ? c.stack.map((s) => h('li', null, s)) : h('li', { class: 'is-empty' }, 'ε')),
          h('span', { class: 'kl-frame-state' }, c.state))));
      const input = h('input', { type: 'text', id: 'kl-rw', class: 'word-input', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', placeholder: 'Eingabewort' });
      const msg = h('p', { class: 'field-msg', 'aria-live': 'polite' });
      const fb = h('div', { 'aria-live': 'polite' });
      let tries = 0;
      const showBtn = h('button', { type: 'button', class: 'btn btn-ghost btn-small', hidden: !loesung, onclick: () => aufdecken() }, 'Lösung zeigen');
      const erfolg = (tokens, zeilen, text) => clear(fb, h('div', { class: 'notice notice-success' },
        h('p', null, h('strong', null, text), `${shown(tokens, P)} passt zur Folge.${ambiguous ? ' Hier gibt es mehrere mögliche Eingabewörter: An mindestens einer Stelle führen verschiedene Eingabezeichen zur selben Konfiguration.' : ''}`)),
      h('h3', { class: 'me-h2' }, 'Die Verarbeitung als Tabelle'), abiTable(zeilen),
      h('div', { class: 'start-actions' }, h('a', { class: 'btn', href: ctx.link('keller', par(x, { modus: 'sim', wort: wordToString(tokens, P.inputAlphabet) })) }, 'Im Simulator ansehen'),
        !q.demo && GRUPPEN.find((y) => y.nr === x.nr + 1) ? h('a', { class: 'btn btn-primary', href: ctx.link('keller', { automat: GRUPPEN.find((y) => y.nr === x.nr + 1).schluessel, modus: 'rueckwaerts' }) }, 'Nächste Rückwärts-Aufgabe') : null));
      const check = async () => {
        const tk = tokenize(input.value, P.inputAlphabet);
        if (!tk.ok) { msg.textContent = tk.message; input.setAttribute('aria-invalid', 'true'); return; }
        msg.textContent = ''; input.removeAttribute('aria-invalid');
        let res;
        try { res = await q.pruefen(x.aufgabeId, { wort: wordToString(tk.tokens, P.inputAlphabet).replace(/^ε$/, '') }); } catch (e) { msg.textContent = e.message; return; }
        tries++;
        zustand = res.zustand ?? zustand;
        if (res.loesung) loesung = res.loesung;
        const r = res.rueckmeldung;
        if (r.richtig) {
          if (res.punkteErhalten) ctx.toast(`+${res.punkteErhalten} Punkte`, { type: 'success' });
          erfolg(tk.tokens, r.zeilen, 'Richtig! ');
        } else {
          if (tries >= 3) showBtn.hidden = false;
          clear(fb, h('div', { class: 'notice notice-error' },
            h('p', null, h('strong', null, 'Passt nicht. '), r.at === 0 ? 'Schon der erste Schritt lässt sich mit deinem Wort nicht erklären.' : `Bis Schritt ${r.at} passt dein Wort, danach führt kein Übergang mit dem nächsten Zeichen zur angegebenen Konfiguration.`),
            h('p', null, 'Vergleiche je zwei benachbarte Bilder: Welches Kellerzeichen lag oben, was wurde abgelegt, welcher Zustand folgt? Daraus ergibt sich der Übergang – und sein Eingabezeichen (ε-Übergänge lesen keins).'),
            !q.demo && zustand?.status === 'offen' ? h('p', { class: 'muted' }, `Versuch ${zustand.fehlversuche} – jetzt noch ${zustand.moeglich} Punkte möglich.`) : null));
        }
      };
      /** „Lösung zeigen“: ein passendes Eingabewort – danach gibt es für diese Rückwärts-Aufgabe keine Punkte mehr. */
      async function aufdecken() {
        if (!loesung) {
          if (!q.demo && zustand?.status === 'offen' && !window.confirm('Wenn du die Lösung ansiehst, bekommst du für diese Aufgabe keine Punkte mehr. Trotzdem anzeigen?')) return;
          try { const r = await q.aufdecken(x.aufgabeId); zustand = r.zustand; loesung = r.loesung; } catch (e) { ctx.toast(e.message, { type: 'error' }); return; }
        }
        const tk = tokenize(loesung.wort, P.inputAlphabet);
        erfolg(tk.tokens, loesung.zeilen, 'Eine Lösung: ');
      }
      const right = h('div', { class: 'stack-col' },
        h('div', { class: 'panel' },
          h('p', { class: 'kl-task' }, h('strong', null, 'Bestimme '), 'das Eingabewort für die angegebene Folge von Zuständen und Kellerbelegungen (oberstes Zeichen oben).'),
          h('div', { class: 'kl-film-scroll' }, film),
          h('form', { class: 'word-form', onsubmit: (e) => { e.preventDefault(); check(); } },
            h('label', { for: 'kl-rw' }, 'Eingabewort'),
            h('div', { class: 'input-row' }, input, h('button', { type: 'submit', class: 'btn btn-primary' }, 'Prüfen')), msg),
          h('p', null, showBtn),
          fb));
      clear(el, ...headEls, h('div', { class: 'two-col kl-rw' }, h('div', { class: 'kl-sticky' }, left), right), caseNav(x, 'rueckwaerts'));
      return null;
    }
  },
};
