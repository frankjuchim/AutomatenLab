// Minimierer (#/minimierer, DS05): Markierungsverfahren interaktiv + Spiel „Unterscheide!“.
// Deep-Links: #/minimierer?aufgabe=n (Markierungsverfahren, n = 1 …),
//             #/minimierer?aufgabe=n&modus=unterscheide (Spiel zu dieser Aufgabe),
//             #/minimierer?modus=unterscheide (gemischte Runde aus allen Aufgaben)

import { h, clear, quote } from '../core/dom.js';
import { MINIMIERER_AUFGABEN } from '../data/minimierer.js';
import { dfa, minimizeDFA, runToText } from '../engine/dfa.js';
import { tokenize, wordToString, makeRng } from '../engine/tokenize.js';
import * as MK from '../engine/markierung.js';
import { GraphView } from '../components/graph-view.js';

const AUFGABEN = MINIMIERER_AUFGABEN.map((a, i) => ({ ...a, nr: i + 1, A: dfa(a.automat) }));
const PUNKTE = 30;
const PUNKTE_PAAR = 5;
const pairText = (k) => `{${k.split('|').join(', ')}}`;
const mergedName = (members) => members.join('/');

export default {
  title: 'Minimierer',
  mount(el, ctx) {
    const p = ctx.params;
    const n = Number(p.get('aufgabe'));
    const a = n >= 1 && n <= AUFGABEN.length ? AUFGABEN[n - 1] : null;
    const modus = p.get('modus');
    if (modus === 'unterscheide') return unterscheide(a);
    if (a) return markieren(a);
    overview();
    return null;

    // ───────────────────────── Übersicht ─────────────────────────
    function overview() {
      ctx.setSubtitle('Wann sind zwei Zustände „gleich“ – und wie viele Zustände braucht ein Automat mindestens?');
      clear(el,
        h('p', { class: 'lead' }, 'Zwei Zustände sind unterscheidbar, wenn es ein Wort gibt, das vom einen in einen Endzustand und vom anderen in einen Nicht-Endzustand führt. Nicht unterscheidbare (äquivalente) Zustände dürfen zusammengefasst werden.'),
        h('h2', { class: 'mz-h2' }, 'Markierungsverfahren'),
        h('ol', { class: 'case-grid' }, AUFGABEN.map((x) => {
          const solved = ctx.progress.isSolved('minimierer', x.id);
          const T = MK.markierungsTabelle(x.A);
          return h('li', null, h('a', { class: ['case-card', solved && 'is-solved'], href: ctx.link('minimierer', { aufgabe: x.nr }) },
            h('span', { class: 'case-nr' }, `Aufgabe ${x.nr} · ${T.states.length} Zustände${T.addedErrorState ? ' (mit Fehlerzustand)' : ''}`),
            h('span', { class: 'case-title' }, x.titel),
            h('span', { class: 'case-state' }, solved ? 'gelöst' : `${PUNKTE} Punkte`)));
        })),
        h('section', { class: 'panel mz-teaser' },
          h('h2', null, 'Spiel: Unterscheide!'),
          h('p', null, 'Zwei Zustände leuchten auf. Finde ein Wort, das sie unterscheidet – oder begründe, dass sie äquivalent sind.'),
          h('a', { class: 'btn btn-primary', href: ctx.link('minimierer', { modus: 'unterscheide' }) }, 'Gemischte Runde starten')));
    }

    function modeTabs(x, active) {
      return h('nav', { class: 'mode-tabs', 'aria-label': 'Modus' },
        h('a', { href: ctx.link('minimierer', { aufgabe: x.nr }), 'aria-current': active === 'markieren' ? 'page' : null }, 'Markierungsverfahren'),
        h('a', { href: ctx.link('minimierer', { aufgabe: x.nr, modus: 'unterscheide' }), 'aria-current': active === 'unterscheide' ? 'page' : null }, 'Unterscheide!'));
    }

    function caseNav(x, modusParam) {
      const q = (nr) => ({ aufgabe: nr, modus: modusParam });
      return h('nav', { class: 'case-nav', 'aria-label': 'Aufgaben' },
        x.nr > 1 ? h('a', { class: 'btn btn-ghost', href: ctx.link('minimierer', q(x.nr - 1)) }, `‹ Aufgabe ${x.nr - 1}`) : h('span'),
        h('a', { class: 'btn btn-ghost', href: ctx.link('minimierer') }, 'Alle Aufgaben'),
        x.nr < AUFGABEN.length ? h('a', { class: 'btn btn-ghost', href: ctx.link('minimierer', q(x.nr + 1)) }, `Aufgabe ${x.nr + 1} ›`) : h('span'));
    }

    // ───────────────────────── Markierungsverfahren ─────────────────────────
    function markieren(x) {
      ctx.setSubtitle(`Aufgabe ${x.nr} von ${AUFGABEN.length}: ${x.titel}`);
      const T = MK.markierungsTabelle(x.A);
      const S = T.states;
      const confirmed = new Map(); // key → Runde
      let pending = new Set();
      let round = 0;
      let attempts = 0;
      let totalAttempts = 0;
      let selected = null;
      let finished = false;
      let lookOnly = false;
      let showMissing = new Set();
      let wrongMarks = new Set();

      const graphPanel = h('div', { class: 'panel mz-graph' });
      const gv = new GraphView(graphPanel, { label: `Automat: ${x.titel}` });
      gv.render(x.A);

      const roundHead = h('p', { class: 'mz-round', 'aria-live': 'polite' });
      const table = h('table', { class: 'mz-table' });
      const help = h('div', { class: 'mz-help', 'aria-live': 'polite' });
      const feedback = h('div', { class: 'mz-feedback', 'aria-live': 'polite' });
      const checkBtn = h('button', { type: 'button', class: 'btn btn-primary', onclick: () => check() }, 'Runde prüfen');
      const lookBox = h('input', { type: 'checkbox', id: 'mz-look', onchange: (e) => { lookOnly = e.target.checked; } });
      const resultSlot = h('div', { class: 'mz-result' });
      const cells = new Map();

      // Dreieckstabelle: Zeilen S1 … Sn-1, Spalten S0 … Sn-2 (Beschriftung unten, wie im Unterricht)
      const tbody = h('tbody');
      for (let i = 1; i < S.length; i++) {
        const tr = h('tr', null, h('th', { scope: 'row' }, S[i]));
        for (let j = 0; j < S.length - 1; j++) {
          if (j >= i) { tr.append(h('td', { class: 'mz-void', 'aria-hidden': 'true' })); continue; }
          const key = T.key(S[i], S[j]);
          const btn = h('button', { type: 'button', class: 'mz-cell', onclick: () => tap(key) });
          cells.set(key, btn);
          tr.append(h('td', null, btn));
        }
        tbody.append(tr);
      }
      const tfoot = h('tfoot', null, h('tr', null, h('td'), S.slice(0, -1).map((s) => h('th', { scope: 'col' }, s))));
      table.append(h('caption', { class: 'sr-only' }, 'Tabelle aller Zustandspaare'), tbody, tfoot);

      function paint() {
        for (const [key, btn] of cells) {
          const r = confirmed.get(key);
          const isPending = pending.has(key);
          btn.className = ['mz-cell', r != null && 'is-marked', isPending && 'is-pending', key === selected && 'is-selected',
            wrongMarks.has(key) && 'is-wrong', showMissing.has(key) && 'is-missing'].filter(Boolean).join(' ');
          clear(btn, r != null ? ['×', h('sub', null, String(r))] : isPending ? '×' : '');
          const [pp, qq] = key.split('|');
          btn.setAttribute('aria-label', `Paar ${pp} und ${qq}: ${r != null ? `markiert in Runde ${r}` : isPending ? 'in dieser Runde markiert' : 'nicht markiert'}`);
        }
        roundHead.textContent = finished ? 'Fertig: Keine weiteren Paare lassen sich markieren.'
          : round === 0 ? 'Runde 0: Markiere alle Paare aus einem Endzustand und einem Nicht-Endzustand.'
            : `Runde ${round}: Markiere alle noch freien Paare, die mit einem Zeichen in ein bereits markiertes Paar übergehen. Kannst du keins mehr markieren, prüfe ohne neue Markierung.`;
        checkBtn.textContent = round > 0 && pending.size === 0 ? 'Prüfen: kein weiteres Paar' : 'Runde prüfen';
        checkBtn.hidden = finished;
      }

      function tap(key) {
        selected = key;
        if (!finished && !lookOnly && !confirmed.has(key)) {
          if (pending.has(key)) pending.delete(key); else pending.add(key);
          wrongMarks.delete(key); showMissing.delete(key);
        }
        const [pp, qq] = key.split('|');
        gv.highlight({ active: [pp, qq].filter((s) => s !== T.addedErrorState) });
        showHelp(key);
        paint();
      }

      function showHelp(key) {
        const [pp, qq] = key.split('|');
        const rows = MK.folgepaare(T, key).map((f) => {
          let status;
          if (!f.key) status = h('span', { class: 'muted' }, 'gleicher Zustand');
          else if (confirmed.has(f.key)) status = h('strong', { class: 'mz-yes' }, `${pairText(f.key)} markiert (Runde ${confirmed.get(f.key)})`);
          else status = h('span', null, `${pairText(f.key)} noch frei`);
          return h('tr', null, h('td', { class: 'sym' }, f.symbol), h('td', null, f.x), h('td', null, f.y), h('td', null, status));
        });
        const accP = T.A.accepting.includes(pp); const accQ = T.A.accepting.includes(qq);
        clear(help, h('p', { class: 'mz-help-title' }, h('strong', null, `Paar {${pp}, ${qq}}`), ' – ',
          accP === accQ ? `beide ${accP ? 'Endzustände' : 'keine Endzustände'}` : 'ein Endzustand und ein Nicht-Endzustand'),
        h('div', { class: 'table-scroll' }, h('table', { class: 'mz-follow' },
          h('thead', null, h('tr', null, h('th', null, 'Zeichen'), h('th', null, `${pp} →`), h('th', null, `${qq} →`), h('th', null, 'Folgepaar'))),
          h('tbody', null, rows))));
      }

      function check() {
        if (finished) return;
        attempts++; totalAttempts++;
        const r = MK.pruefeRunde(T, new Set(confirmed.keys()), pending, round);
        wrongMarks = new Set(r.falsch);
        showMissing = new Set();
        if (r.ok) {
          for (const k of pending) confirmed.set(k, round);
          const n0 = pending.size;
          pending = new Set(); attempts = 0;
          if (r.fertig || confirmed.size === T.pairs.length) { finish(); return; }
          clear(feedback, h('div', { class: 'notice notice-success' },
            h('p', null, h('strong', null, `Runde ${round} stimmt. `), n0 ? `${n0} ${n0 === 1 ? 'Paar' : 'Paare'} markiert${r.vorgezogen.length ? ` (davon ${r.vorgezogen.length} schon vorgezogen – auch richtig)` : ''}.` : 'In dieser Runde war nichts zu markieren.'),
            h('p', null, 'Weiter mit der nächsten Runde: Prüfe für jedes freie Paar die Folgepaare.')));
          round++;
        } else {
          const parts = [];
          if (r.falsch.length) {
            const k = r.falsch[0];
            const why = round === 0 ? 'Beide Zustände sind Endzustände oder beide sind keine.'
              : `Mit keinem Zeichen geht es in ein markiertes Paar: ${MK.folgepaare(T, k).map((f) => `${f.symbol} → ${f.key ? pairText(f.key) : 'gleicher Zustand'}`).join(', ')}.`;
            parts.push(h('p', null, h('strong', null, `${r.falsch.length === 1 ? 'Ein Paar ist' : `${r.falsch.length} Paare sind`} zu Unrecht markiert`), ` (rot umrandet), z. B. ${pairText(k)}. ${why}`));
          }
          if (r.fehlend.length) {
            parts.push(h('p', null, h('strong', null, r.fehlend.length === 1 ? 'Es fehlt noch ein Paar.' : `Es fehlen noch ${r.fehlend.length} Paare.`),
              attempts >= 2 ? ' Die fehlenden Paare sind jetzt gestrichelt markiert.' : ' Tipp: Tippe ein freies Paar an und sieh dir die Folgepaare an.'));
            if (attempts >= 2) showMissing = new Set(r.fehlend);
          }
          clear(feedback, h('div', { class: 'notice notice-error' }, parts));
        }
        paint();
      }

      function finish() {
        finished = true;
        selected = null;
        gv.clearHighlight();
        const m = minimizeDFA(x.A, { mergedName });
        const classes = m.classes.filter((c) => c.length > 1);
        const { first } = ctx.progress.solve('minimierer', x.id, PUNKTE);
        ctx.progress.award('minimierer-erste');
        if (AUFGABEN.every((y) => ctx.progress.isSolved('minimierer', y.id))) ctx.progress.award('minimierer-alle');
        if (first) ctx.toast(`+${PUNKTE} Punkte`, { type: 'success' });
        // Anzeige: zusammengefasster Automat; ergänzten Fehlerzustand wieder implizit machen
        let M = m.dfa;
        const err = m.addedErrorState;
        if (err && M.states.includes(err)) {
          const delta = {};
          for (const s of M.states) if (s !== err) { delta[s] = {}; for (const c of M.alphabet) if (M.delta[s][c] !== err) delta[s][c] = M.delta[s][c]; }
          M = { ...M, states: M.states.filter((s) => s !== err), delta, implicitError: true };
        }
        const before = T.states.length; const after = m.dfa.states.length;
        clear(feedback); clear(help);
        const next = AUFGABEN[x.nr];
        const resultGraph = h('div', { class: 'mz-result-graph' });
        clear(resultSlot, h('section', { class: 'panel mz-done' },
          h('h2', null, classes.length ? 'Zusammenfassen' : 'Schon minimal!'),
          h('p', null, classes.length
            ? `Nicht markierte Paare sind äquivalent. Zusammengefasst werden: ${classes.map((c) => `${c.join(', ')} → ${mergedName(c)}`).join(' · ')}. Aus ${before} werden ${after} Zustände${err ? ' (jeweils mit Fehlerzustand gezählt)' : ''}.`
            : `Alle Paare sind markiert: Je zwei Zustände sind unterscheidbar. Der Automat braucht mindestens ${after} Zustände${err ? ' (mit Fehlerzustand)' : ''}.`),
          h('p', { class: 'muted' }, `${round} ${round === 1 ? 'Runde' : 'Runden'} mit Markierungen, ${totalAttempts} ${totalAttempts === 1 ? 'Prüfung' : 'Prüfungen'}.`),
          resultGraph,
          h('p', { class: 'notice' }, x.merke),
          h('div', { class: 'start-actions' },
            next ? h('a', { class: 'btn btn-primary', href: ctx.link('minimierer', { aufgabe: next.nr }) }, `Weiter zu Aufgabe ${next.nr}`) : null,
            h('a', { class: 'btn', href: ctx.link('minimierer', { aufgabe: x.nr, modus: 'unterscheide' }) }, 'Unterscheide! mit diesem Automaten'),
            h('button', { type: 'button', class: 'btn btn-ghost', onclick: () => ctx.navigate('minimierer', { aufgabe: x.nr }) }, 'Nochmal'))));
        if (classes.length) new GraphView(resultGraph, { label: 'Zusammengefasster Automat' }).render(M);
        paint();
        resultSlot.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }

      const errNote = T.addedErrorState
        ? h('p', { class: 'notice notice-warn mz-err-note' }, `Das Verfahren braucht einen vollständigen Automaten. Darum steht in der Tabelle zusätzlich der Fehlerzustand ${T.addedErrorState}: Alle nicht eingezeichneten Übergänge führen dorthin, er ist kein Endzustand.`)
        : null;

      clear(el, modeTabs(x, 'markieren'),
        h('div', { class: 'panel mz-task' },
          h('p', { class: 'task-text' }, x.kontext),
          h('p', null, h('strong', null, 'Auftrag: '), x.frage),
          h('p', { class: 'sigma' }, `Σ = {${x.A.alphabet.join(', ')}} · Startzustand ${x.A.start} · Endzustände ${x.A.accepting.join(', ')}`)),
        h('div', { class: 'mz-layout' },
          h('div', { class: 'mz-left' }, graphPanel, errNote),
          h('div', { class: 'panel mz-work' },
            roundHead,
            h('div', { class: 'table-scroll mz-scroll' }, table),
            h('div', { class: 'check-row mz-actions' }, checkBtn,
              h('label', { class: 'check', for: 'mz-look' }, lookBox, ' Nur ansehen (nicht markieren)')),
            feedback, help)),
        resultSlot,
        caseNav(x, null));
      if (ctx.progress.isSolved('minimierer', x.id)) feedback.append(h('p', { class: 'muted' }, 'Diese Aufgabe hast du schon gelöst – zum Üben kannst du sie wiederholen.'));
      clear(help, h('p', { class: 'muted' }, 'Tippe ein Feld an: Es wird markiert, und unten siehst du, wohin beide Zustände mit jedem Zeichen übergehen.'));
      paint();
      return null;
    }

    // ───────────────────────── Unterscheide! ─────────────────────────
    function unterscheide(only) {
      ctx.setSubtitle(only ? `Unterscheide! – Aufgabe ${only.nr}: ${only.titel}` : 'Unterscheide! – gemischte Runde');
      const rng = makeRng();
      const items = [];
      const pool = only ? [only] : AUFGABEN;
      for (const x of pool) {
        const st = x.A.states;
        const pairs = [];
        for (let i = 0; i < st.length; i++) for (let j = i + 1; j < st.length; j++) {
          const w = MK.unterscheidendesWort(x.A, st[i], st[j]);
          pairs.push({ x, p: st[i], q: st[j], word: w, equiv: w === null });
        }
        const eq = rng.shuffle(pairs.filter((y) => y.equiv));
        const ne = rng.shuffle(pairs.filter((y) => !y.equiv));
        if (only) items.push(...eq.slice(0, 2), ...ne.slice(0, 4));
        else items.push(...rng.shuffle([...eq.slice(0, 1), ...ne.slice(0, 1)]).slice(0, 1 + (rng() < 0.4 ? 1 : 0)));
      }
      const round = rng.shuffle(items).slice(0, 8);
      let idx = 0; let right = 0;

      const stage = h('div', { class: 'mz-u-stage' });
      clear(el, only ? modeTabs(only, 'unterscheide') : h('p', null, h('a', { href: ctx.link('minimierer') }, '‹ Zur Aufgabenübersicht')),
        h('p', { class: 'lead mz-u-lead' }, 'Unterscheidbar heißt: Es gibt ein Wort, das von einem der beiden Zustände in einen Endzustand führt, vom anderen aber nicht. Gibt es kein solches Wort, sind die Zustände äquivalent.'),
        stage,
        only ? caseNav(only, 'unterscheide') : null);

      function show() {
        if (idx >= round.length) return summary();
        const it = round[idx];
        const A = it.x.A;
        const gBox = h('div', { class: 'mz-u-graph' });
        const gv = new GraphView(gBox, { label: `${it.x.titel}: Zustände ${it.p} und ${it.q} hervorgehoben` });
        gv.render(A).then(() => gv.highlight({ active: [it.p, it.q] }));
        const input = h('input', { type: 'text', id: 'mz-word', class: 'word-input', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', placeholder: A.alphabet.some((s) => s.length > 1) ? 'z. B. 10 20' : `z. B. ${A.alphabet.slice(0, 2).join('')}` });
        const msg = h('p', { class: 'field-msg', 'aria-live': 'polite' });
        const out = h('div', { class: 'mz-u-out', 'aria-live': 'polite' });
        let done = false;
        const nextBtn = h('button', { type: 'button', class: 'btn btn-primary', hidden: true, onclick: () => { idx++; show(); } }, idx + 1 < round.length ? 'Nächstes Paar' : 'Auswertung');

        const lauf = (s, w) => {
          const r = MK.laufAb(A, s, w);
          const text = runToText({ path: r.path, steps: w.map((c, i) => ({ symbol: c, to: r.path[i + 1] })) });
          return h('li', null, h('code', null, text), ' → ', r.accepted ? h('strong', { class: 'mz-yes' }, 'Endzustand') : h('strong', { class: 'mz-no' }, r.end == null ? 'Fehlerzustand' : 'kein Endzustand'));
        };
        const solved = (ok) => {
          done = true;
          if (ok) {
            right++;
            const { first } = ctx.progress.solve('minimierer-u', `${it.x.id}:${it.p}|${it.q}`, PUNKTE_PAAR);
            if (first) out.querySelector('.notice')?.append(h('p', { class: 'mz-points' }, `+${PUNKTE_PAAR} Punkte`));
            if (ctx.progress.solvedIds('minimierer-u').length >= 10) ctx.progress.award('minimierer-unterscheider');
          }
          nextBtn.hidden = false; nextBtn.focus({ preventScroll: true });
          input.disabled = true; form.querySelectorAll('button').forEach((b) => { b.disabled = true; });
        };
        const tryWord = () => {
          if (done) return;
          const tk = tokenize(input.value, A.alphabet);
          if (!tk.ok) { msg.textContent = tk.message; input.setAttribute('aria-invalid', 'true'); return; }
          msg.textContent = ''; input.removeAttribute('aria-invalid');
          const w = tk.tokens;
          const rp = MK.laufAb(A, it.p, w); const rq = MK.laufAb(A, it.q, w);
          const shown = w.length ? quote(wordToString(w, A.alphabet)) : 'das leere Wort ε';
          if (rp.accepted !== rq.accepted) {
            clear(out, h('div', { class: 'notice notice-success' },
              h('p', null, h('strong', null, 'Richtig! '), `${shown} unterscheidet ${it.p} und ${it.q}:`),
              h('ul', { class: 'mz-runs' }, lauf(it.p, w), lauf(it.q, w))));
            solved(true);
          } else {
            clear(out, h('div', { class: 'notice notice-error' },
              h('p', null, h('strong', null, 'Das unterscheidet sie nicht. '), `Mit ${shown} landen beide ${rp.accepted ? 'in einem Endzustand' : 'nicht in einem Endzustand'}:`),
              h('ul', { class: 'mz-runs' }, lauf(it.p, w), lauf(it.q, w)),
              h('p', null, 'Versuch ein anderes Wort – oder sind die beiden vielleicht äquivalent?')));
          }
        };
        const claimEquiv = () => {
          if (done) return;
          if (it.equiv) {
            clear(out, h('div', { class: 'notice notice-success' },
              h('p', null, h('strong', null, 'Richtig, äquivalent! '), `Von ${it.p} und von ${it.q} aus führt jedes Wort entweder in beiden Fällen in einen Endzustand oder in beiden nicht. Die beiden Zustände können zusammengefasst werden.`)));
            solved(true);
          } else {
            const w = it.word;
            clear(out, h('div', { class: 'notice notice-error' },
              h('p', null, h('strong', null, 'Nicht äquivalent. '), `Das Wort ${w.length ? quote(wordToString(w, A.alphabet)) : 'ε'} unterscheidet ${it.p} und ${it.q}:`),
              h('ul', { class: 'mz-runs' }, lauf(it.p, w), lauf(it.q, w))));
            solved(false);
          }
        };
        const form = h('form', { class: 'word-form', onsubmit: (e) => { e.preventDefault(); tryWord(); } },
          h('label', { for: 'mz-word' }, 'Unterscheidendes Wort'),
          h('div', { class: 'input-row' }, input, h('button', { type: 'submit', class: 'btn btn-primary' }, 'Prüfen')),
          msg,
          h('div', { class: 'start-actions mz-u-actions' }, h('button', { type: 'button', class: 'btn', onclick: () => claimEquiv() }, `${it.p} und ${it.q} sind äquivalent`)));
        clear(stage, h('div', { class: 'mz-u-layout' },
          h('div', { class: 'panel' },
            h('div', { class: 'mz-u-head' }, h('span', { class: 'case-nr' }, `Paar ${idx + 1} von ${round.length} · ${it.x.titel}`), h('span', { class: 'muted' }, `${right} richtig`)),
            h('h2', { class: 'mz-u-q' }, 'Sind ', h('span', { class: 'mz-state' }, it.p), ' und ', h('span', { class: 'mz-state' }, it.q), ' unterscheidbar?'),
            h('p', { class: 'sigma' }, `Σ = {${A.alphabet.join(', ')}}`),
            gBox),
          h('div', { class: 'panel' }, form, out, h('div', { class: 'start-actions' }, nextBtn))));
        input.focus({ preventScroll: true });
      }

      function summary() {
        clear(stage, h('div', { class: 'panel arena-result' },
          h('h2', null, 'Runde beendet'),
          h('p', { class: 'result-big' }, h('span', { class: 'num' }, `${right}`), ` von ${round.length} richtig`),
          h('p', { class: 'muted' }, 'Für jedes Paar, das du zum ersten Mal richtig beurteilst, gibt es Punkte.'),
          h('div', { class: 'start-actions' },
            h('button', { type: 'button', class: 'btn btn-primary btn-large', onclick: () => ctx.navigate('minimierer', { aufgabe: only?.nr, modus: 'unterscheide' }) }, 'Neue Runde'),
            h('a', { class: 'btn', href: ctx.link('minimierer') }, 'Zur Übersicht'))));
      }

      show();
      return null;
    }
  },
};
