// Überliste den Automaten (#/ueberliste): Ein DEA mit k Zuständen behauptet, eine nicht-reguläre Sprache zu erkennen.
// Finde ein Wort, bei dem er sich irrt – und lerne daraus das Schubfachargument (DS07).
// Deep-Links: #/ueberliste?stufe=1…5, #/ueberliste?stufe=bonus (Multiple Choice „Warum hilft k+1 nicht?“)

import { h, clear, quote } from '../core/dom.js';
import { UEBERLISTE_STUFEN, UEBERLISTE_BONUS, bauAutomat } from '../data/ueberliste.js';
import { dfa, runDFA } from '../engine/dfa.js';
import { tokenize, wordToString, makeRng } from '../engine/tokenize.js';
import { GraphView } from '../components/graph-view.js';
import { WordTape } from '../components/word-tape.js';

const STUFEN = UEBERLISTE_STUFEN.map((s, i) => ({ ...s, nr: i + 1, A: dfa(bauAutomat(s)) }));
const TIPP_KOSTEN = 5;
const BONUS_PUNKTE = 20;

/** Erste Wiederholung eines Zustands beim Lesen von Präfixen aⁱ: {i, j, state} mit i < j. */
export function schubfach(A, sym, max = 60) {
  const seen = new Map([[A.start, 0]]);
  let cur = A.start;
  for (let n = 1; n <= max; n++) {
    cur = A.delta[cur]?.[sym] ?? null;
    if (cur == null) return null;
    if (seen.has(cur)) return { i: seen.get(cur), j: n, state: cur };
    seen.set(cur, n);
  }
  return null;
}

export default {
  title: 'Überliste den Automaten',
  mount(el, ctx) {
    const p = ctx.params.get('stufe');
    if (p === 'bonus' || p === '6') return bonus();
    const n = Number(p);
    if (n >= 1 && n <= STUFEN.length) return play(STUFEN[n - 1]);
    showList();
    return null;

    function showList() {
      ctx.setSubtitle('Ein Automat mit endlich vielen Zuständen behauptet Unmögliches. Finde das Wort, bei dem er sich verrät.');
      const bonusDone = ctx.progress.isSolved('ueberliste', 'bonus');
      clear(el,
        h('p', { class: 'lead' }, 'Jeder Automat hier zählt richtig – bis zu einer Grenze. Dein Ziel: ein Wort, das er akzeptiert, obwohl es nicht zur Sprache gehört, oder ablehnt, obwohl es dazugehört.'),
        h('ol', { class: 'challenge-grid' }, STUFEN.map((s) => {
          const solved = ctx.progress.isSolved('ueberliste', s.id);
          return h('li', null, h('a', { class: ['challenge-card', solved && 'is-solved', `stufe-${Math.min(3, Math.ceil(s.nr / 2))}`], href: ctx.link('ueberliste', { stufe: s.nr }) },
            h('span', { class: 'case-nr' }, `Stufe ${s.nr} · ${s.A.states.length} Zustände`),
            h('span', { class: 'case-title' }, s.titel),
            h('span', { class: 'case-state' }, solved ? 'überlistet' : `${s.punkte} Punkte`)));
        }),
        h('li', null, h('a', { class: ['challenge-card', 'stufe-3', bonusDone && 'is-solved'], href: ctx.link('ueberliste', { stufe: 'bonus' }) },
          h('span', { class: 'case-nr' }, 'Bonus'),
          h('span', { class: 'case-title' }, 'Warum hilft ein Zustand mehr nicht?'),
          h('span', { class: 'case-state' }, bonusDone ? 'gelöst' : `${BONUS_PUNKTE} Punkte`)))));
    }

    function play(s) {
      ctx.setSubtitle(`Stufe ${s.nr}: ${s.titel}`);
      const A = s.A;
      const k = A.states.length;
      const st = { tries: 0, tipps: 0, won: false, prefixes: false, revealed: false };
      const tested = new Map();

      // ── Behauptung ──
      const claim = h('div', { class: 'ul-claim panel' },
        h('div', { class: 'ul-machine' },
          h('div', { class: 'ul-k' }, h('span', { class: 'ul-k-num' }, String(k)), h('span', { class: 'ul-k-label' }, k === 1 ? 'Zustand' : 'Zustände')),
          h('div', null,
            h('p', { class: 'task-text' }, `Ich erkenne ${s.sprache}.`),
            h('p', { class: 'muted' }, s.kontext),
            h('p', { class: 'sigma' }, `Σ = {${A.alphabet.join(', ')}}`, A.implicitError ? ' · nicht eingezeichnete Übergänge führen in einen Fehlerzustand (zählt nicht als Zustand)' : ''))));

      // ── Eingabe ──
      const input = h('input', { type: 'text', id: 'ul-word', class: 'word-input', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', placeholder: `Wort über {${A.alphabet.join(', ')}}` });
      const msg = h('p', { class: 'field-msg', 'aria-live': 'polite' });
      const symButtons = h('div', { class: 'chip-row', 'aria-label': 'Zeichen anhängen' },
        A.alphabet.map((a) => h('button', { type: 'button', class: 'chip', onclick: () => { input.value += a; input.focus(); } }, a)),
        h('button', { type: 'button', class: 'chip chip-ghost', onclick: () => { input.value = input.value.slice(0, -1); input.focus(); } }, '⌫'),
        h('button', { type: 'button', class: 'chip chip-ghost', onclick: () => { input.value = ''; input.focus(); } }, 'leer'));
      const form = h('form', { class: 'word-form', onsubmit: (e) => { e.preventDefault(); test(input.value); } },
        h('label', { for: 'ul-word' }, 'Dein Testwort'),
        h('div', { class: 'input-row' }, input, h('button', { type: 'submit', class: 'btn btn-primary' }, 'Dem Automaten vorlegen')),
        msg, symButtons);

      // ── Antwort ──
      const tapeBox = h('div');
      const tape = new WordTape(tapeBox, { size: 'l', label: 'Testwort' });
      const verdict = h('div', { class: 'ul-verdict', 'aria-live': 'polite' });
      const prefixBox = h('div', { class: 'ul-prefixes' });
      const prefixToggle = h('input', { type: 'checkbox', id: 'ul-prefix', onchange: (e) => { st.prefixes = e.target.checked; renderPrefixes(); } });
      const graphBox = h('div', { class: 'ul-graph' });
      let gv = null;
      const revealBtn = h('button', { type: 'button', class: 'btn btn-small', onclick: () => reveal() }, 'Graph aufdecken');
      const log = h('ul', { class: 'test-log', 'aria-label': 'Getestete Wörter' });

      let lastRun = null;
      function renderPrefixes() {
        clear(prefixBox);
        if (!st.prefixes || !lastRun) return;
        const rows = lastRun.path.map((state, i) => {
          const pre = lastRun.tokens.slice(0, i);
          return h('tr', null, h('td', { class: 'word' }, pre.length ? wordToString(pre, A.alphabet) : 'ε'), h('td', { class: 'word' }, state ?? 'Fehlerzustand'));
        });
        prefixBox.append(h('table', { class: 'abi-table ul-table' },
          h('thead', null, h('tr', null, h('th', null, 'Präfix gelesen'), h('th', null, 'Zustand danach'))),
          h('tbody', null, rows)));
        // Wiederholung hervorheben
        const seen = new Map();
        lastRun.path.forEach((state, i) => {
          if (state == null) return;
          const tr = prefixBox.querySelectorAll('tbody tr')[i];
          if (seen.has(state)) { tr.classList.add('is-repeat'); prefixBox.querySelectorAll('tbody tr')[seen.get(state)].classList.add('is-repeat'); } else seen.set(state, i);
        });
        if (seen.size < lastRun.path.filter(Boolean).length) prefixBox.append(h('p', { class: 'muted ul-repeat-note' }, 'Markiert: Zwei verschiedene Präfixe, ein Zustand. Von hier an kann der Automat sie nicht mehr unterscheiden.'));
      }

      async function reveal() {
        st.revealed = true;
        revealBtn.disabled = true;
        gv = new GraphView(graphBox, { label: `Automat mit ${k} Zuständen` });
        await gv.render(A);
        if (lastRun) highlightRun(lastRun);
      }
      function highlightRun(run) {
        const last = run.path.at(-1);
        gv?.highlight({ active: last ?? run.path.filter(Boolean).at(-1), visited: run.path.filter(Boolean), error: last == null });
      }

      function test(word) {
        const tk = tokenize(word, A.alphabet);
        if (!tk.ok) { msg.textContent = tk.message; input.setAttribute('aria-invalid', 'true'); return; }
        input.removeAttribute('aria-invalid'); msg.textContent = '';
        const run = runDFA(A, tk.tokens);
        lastRun = run;
        const truth = !!s.pruefe(tk.tokens);
        const wrong = run.accepted !== truth;
        st.tries++;
        tape.set(tk.tokens); tape.setHead(-1); tape.setVerdict(run.accepted ? 'accept' : 'reject');
        tape.flash(wrong ? 'good' : 'bad');
        const shown = quote(wordToString(tk.tokens, A.alphabet));
        const key = tk.tokens.join('\u0001');
        if (!tested.has(key)) {
          tested.set(key, run.accepted);
          log.prepend(h('li', { class: [run.accepted ? 'is-yes' : 'is-no', wrong && 'is-wrong'] },
            h('button', { type: 'button', class: 'log-word', onclick: () => { input.value = wordToString(tk.tokens, A.alphabet).replace(/^ε$/, ''); test(tk.tokens); } }, shown),
            h('span', { class: 'log-verdict' }, run.accepted ? 'akzeptiert' : 'abgelehnt', wrong ? ' – falsch!' : '')));
        }
        clear(verdict,
          h('p', { class: 'ul-says' }, h('span', { class: 'ul-who' }, 'Automat: '), h('strong', { class: run.accepted ? 'ex-yes' : 'ex-no' }, run.accepted ? 'akzeptiert' : 'abgelehnt')),
          h('p', { class: 'ul-says' }, h('span', { class: 'ul-who' }, 'Wahrheit: '), h('strong', null, truth ? `${shown} gehört zur Sprache.` : `${shown} gehört nicht zur Sprache.`)),
          wrong ? null : h('p', { class: 'muted' }, 'Der Automat hat recht. Weiter suchen!'));
        renderPrefixes();
        highlightRun(run);
        if (wrong && !st.won) win(tk.tokens, run, truth);
      }

      // ── Tipps ──
      const tippList = h('ol', { class: 'ul-tipps' });
      const tippBtn = h('button', { type: 'button', class: 'btn btn-small', onclick: () => {
        if (st.tipps >= s.tipps.length) return;
        tippList.append(h('li', null, s.tipps[st.tipps]));
        st.tipps++;
        tippBtn.textContent = st.tipps >= s.tipps.length ? 'Keine weiteren Tipps' : `Nächster Tipp (−${TIPP_KOSTEN} Punkte)`;
        tippBtn.disabled = st.tipps >= s.tipps.length;
      } }, `Tipp anzeigen (−${TIPP_KOSTEN} Punkte)`);

      const result = h('div', { class: 'ul-result' });

      function win(tokens, run, truth) {
        st.won = true;
        const pts = Math.max(10, s.punkte - st.tipps * TIPP_KOSTEN);
        const { first } = ctx.progress.solve('ueberliste', s.id, pts);
        ctx.progress.award('ueberliste-erster');
        if (st.tipps === 0 && s.nr >= 3) ctx.progress.award('ueberliste-ohne-tipp');
        if (STUFEN.every((x) => ctx.progress.isSolved('ueberliste', x.id))) ctx.progress.award('ueberliste-alle');
        if (first) ctx.toast(`+${pts} Punkte`, { type: 'success' });
        const sf = schubfach(A, s.praefix);
        const pre = (m) => (m === 0 ? 'ε' : s.praefix.repeat(m));
        const sup = (m) => `${s.praefix}${toSup(m)}`;
        const shown = quote(wordToString(tokens, A.alphabet));
        const what = run.accepted ? `akzeptiert ${shown}, obwohl das Wort nicht zur Sprache gehört` : `lehnt ${shown} ab, obwohl das Wort zur Sprache gehört`;
        const next = STUFEN[s.nr];
        clear(result, h('div', { class: 'notice notice-success ul-win' },
          h('p', null, h('strong', null, 'Überlistet! '), `Der Automat ${what}. ${st.tries === 1 ? 'Im ersten Versuch.' : `Versuch ${st.tries}.`}`),
          h('h3', null, 'Warum das immer klappt – das Argument in 5 Schritten'),
          h('ol', { class: 'ul-schema' },
            h('li', null, h('strong', null, 'Annahme: '), `Es gibt einen DEA mit k = ${k} Zuständen, der ${s.sprache} erkennt.`),
            h('li', null, h('strong', null, 'Präfixe: '), `Betrachte die k + 1 = ${k + 1} Präfixe ${sup(1)}, ${sup(2)}, …, ${sup(k + 1)}.`),
            h('li', null, h('strong', null, 'Schubfachprinzip: '), `${k + 1} Präfixe, aber nur ${k} Zustände – zwei verschiedene Präfixe landen im selben Zustand.`,
              sf ? ` Hier: ${pre(sf.i)} und ${pre(sf.j)} führen beide nach ${sf.state}.` : ''),
            h('li', null, h('strong', null, 'Gleiche Fortsetzung: '), `Hängt man an beide dieselbe Fortsetzung an (z. B. ${s.fortsetzung}${toSup('i')}), ist der Automat danach wieder im selben Zustand – er antwortet bei beiden Wörtern gleich.`),
            h('li', null, h('strong', null, 'Widerspruch: '), `Eines der beiden Wörter gehört zur Sprache, das andere nicht. Der Automat kann also nicht beide richtig beantworten. Da das für jedes k gilt, gibt es keinen DEA für ${s.sprache}.`)),
          h('p', { class: 'muted' }, 'Merke: Beschränkt zählen kann ein DEA, unbeschränkt zählen nicht.'),
          h('div', { class: 'start-actions' },
            next ? h('a', { class: 'btn btn-primary', href: ctx.link('ueberliste', { stufe: next.nr }) }, `Weiter: Stufe ${next.nr}`) : h('a', { class: 'btn btn-primary', href: ctx.link('ueberliste', { stufe: 'bonus' }) }, 'Zum Bonus'),
            h('a', { class: 'btn', href: ctx.link('ueberliste') }, 'Alle Stufen'))));
        result.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }

      clear(el, claim,
        h('div', { class: 'ul-layout' },
          h('div', { class: 'panel ul-left' }, form, tapeBox, verdict,
            h('div', { class: 'ul-tools' },
              h('label', { class: 'check', for: 'ul-prefix' }, prefixToggle, ' Zustand nach jedem Präfix zeigen'),
              revealBtn),
            prefixBox, graphBox),
          h('div', { class: 'panel ul-right' },
            h('h3', null, 'Tipps'), h('p', { class: 'muted' }, 'Jeder Tipp kostet Punkte – aber die Idee dahinter ist das, was im Abitur zählt.'),
            tippList, h('p', null, tippBtn),
            h('h3', { class: 'log-title' }, 'Deine Testwörter'), log)),
        result,
        h('nav', { class: 'case-nav', 'aria-label': 'Stufen' },
          s.nr > 1 ? h('a', { class: 'btn btn-ghost', href: ctx.link('ueberliste', { stufe: s.nr - 1 }) }, `‹ Stufe ${s.nr - 1}`) : h('span'),
          h('a', { class: 'btn btn-ghost', href: ctx.link('ueberliste') }, 'Alle Stufen'),
          s.nr < STUFEN.length ? h('a', { class: 'btn btn-ghost', href: ctx.link('ueberliste', { stufe: s.nr + 1 }) }, `Stufe ${s.nr + 1} ›`) : h('a', { class: 'btn btn-ghost', href: ctx.link('ueberliste', { stufe: 'bonus' }) }, 'Bonus ›')));
      input.focus({ preventScroll: true });
      return () => gv?.destroy();
    }

    function bonus() {
      ctx.setSubtitle('Bonus: Warum hilft ein Zustand mehr nicht?');
      const rng = makeRng();
      const qs = UEBERLISTE_BONUS.map((q) => ({ ...q, opts: rng.shuffle(q.optionen.map((text, i) => ({ text, correct: i === 0 }))) }));
      let idx = 0; let correctFirst = 0; let attemptsHere = 0;
      const box = h('div', { class: 'panel narrow-panel' });
      const render = () => {
        if (idx >= qs.length) {
          const all = correctFirst === qs.length;
          const pts = all ? BONUS_PUNKTE : Math.round((BONUS_PUNKTE * correctFirst) / qs.length);
          const { first } = ctx.progress.solve('ueberliste', 'bonus', pts);
          if (first && pts) ctx.toast(`+${pts} Punkte`, { type: 'success' });
          clear(box, h('h2', null, 'Bonus geschafft'), h('p', { class: 'lead' }, `${correctFirst} von ${qs.length} Fragen im ersten Versuch richtig.`),
            h('p', null, 'Das Argument funktioniert für jede Zustandsanzahl k – deshalb gibt es überhaupt keinen endlichen Automaten für diese Sprachen.'),
            h('div', { class: 'start-actions' }, h('a', { class: 'btn btn-primary', href: ctx.link('ueberliste') }, 'Zurück zur Übersicht')));
          return;
        }
        const q = qs[idx]; attemptsHere = 0;
        const verdict = h('div', { 'aria-live': 'polite' });
        const buttons = q.opts.map((o, i) => h('button', { type: 'button', class: 'option', onclick: (e) => {
          const b = e.currentTarget;
          if (b.disabled) return;
          attemptsHere++;
          if (o.correct) {
            if (attemptsHere === 1) correctFirst++;
            b.classList.add('is-correct'); buttons.forEach((x) => { x.disabled = true; });
            clear(verdict, h('div', { class: 'notice notice-success' }, h('p', null, h('strong', null, 'Richtig. ')),
              h('div', { class: 'start-actions' }, h('button', { type: 'button', class: 'btn btn-primary', onclick: () => { idx++; render(); } }, idx + 1 < qs.length ? 'Nächste Frage' : 'Auswertung'))));
          } else { b.classList.add('is-wrong'); b.disabled = true; clear(verdict, h('p', { class: 'notice notice-error' }, 'Das passt nicht. Überlege, wo das Schubfachprinzip ansetzt.')); }
        } }, h('span', { class: 'option-key', 'aria-hidden': 'true' }, 'ABCD'[i]), h('span', { class: 'option-text' }, o.text)));
        clear(box, h('p', { class: 'muted' }, `Frage ${idx + 1} von ${qs.length}`), h('h2', { class: 'question' }, q.frage),
          h('ul', { class: 'option-list' }, buttons.map((b) => h('li', null, b))), verdict);
      };
      render();
      clear(el, box, h('nav', { class: 'case-nav' }, h('a', { class: 'btn btn-ghost', href: ctx.link('ueberliste') }, '‹ Alle Stufen')));
      return null;
    }
  },
};

const SUP = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹', i: 'ⁱ', j: 'ʲ', n: 'ⁿ', k: 'ᵏ', '+': '⁺' };
export const toSup = (x) => String(x).split('').map((c) => SUP[c] ?? c).join('');
