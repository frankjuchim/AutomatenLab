// Parallelwelten (#/parallelwelten, DS08): NEA-Simulator mit „Spielfiguren“ (Menge aktiver Zustände),
// ε-Abschluss als eigener Schritt, Rätsel „Wo stehen die Figuren?“ und Teilmengenkonstruktion.
// Deep-Links: #/parallelwelten?aufgabe=n (oder ?automat=<id>) &modus=sim|spiel|teilmengen  &wort=… (sim)

import { h, clear, quote } from '../core/dom.js';
import { PARALLELWELTEN } from '../data/parallelwelten.js';
import { nfa, runNFA, epsilonClosure, moveSet, stepSet, subsetConstruction, setName } from '../engine/nfa.js';
import { tokenize, wordToString, EPS } from '../engine/tokenize.js';
import { GraphView } from '../components/graph-view.js';
import { WordTape } from '../components/word-tape.js';

const AUFGABEN = PARALLELWELTEN.map((a, i) => ({ ...a, nr: i + 1, N: nfa(a.automat) }));
const MODI = { sim: 'Simulieren', spiel: 'Wo stehen die Figuren?', teilmengen: 'Teilmengenkonstruktion' };
const SVG = 'http://www.w3.org/2000/svg';
const hasEps = (N) => N.states.some((s) => N.delta[s]?.[EPS]?.length);
const fmt = (set) => setName(set);

/** Spielfiguren als kleine Kreise an die aktiven Zustände setzen. */
function placeFigures(gv, states) {
  if (!gv.svg) return;
  gv.svg.querySelectorAll('.pw-figur').forEach((n) => n.remove());
  for (const s of states) {
    const node = gv._node(s);
    const e = node?.querySelector('ellipse');
    if (!e) continue;
    const cx = +e.getAttribute('cx'); const cy = +e.getAttribute('cy'); const rx = +e.getAttribute('rx'); const ry = +e.getAttribute('ry');
    const c = document.createElementNS(SVG, 'circle');
    c.setAttribute('class', 'pw-figur'); c.setAttribute('r', '7');
    c.setAttribute('cx', String(cx + rx * 0.78)); c.setAttribute('cy', String(cy - ry * 0.78));
    node.append(c);
  }
}

/** Schritte für die Anzeige: Start, je Zeichen „lesen“ und ggf. „ε-Abschluss“. */
export function nfaFrames(N, tokens) {
  const frames = [];
  const epsEdges = (set) => set.flatMap((s) => (N.delta[s]?.[EPS] ?? []).filter((t) => set.includes(t)).map((t) => [s, t]));
  const start = N.states.filter((s) => N.starts.includes(s));
  frames.push({ set: start, read: 0, edges: [], kind: 'start', text: `Start: Eine Figur steht im Startzustand ${start.join(', ')}.` });
  let cur = start;
  const close = (read) => {
    const cl = epsilonClosure(N, cur);
    if (cl.length > cur.length) {
      const neu = cl.filter((s) => !cur.includes(s));
      frames.push({ set: cl, read, edges: epsEdges(cl), kind: 'eps', text: `ε-Übergänge: Ohne ein Zeichen zu lesen, kommen Figuren nach ${neu.join(', ')} dazu.` });
      cur = cl;
    }
  };
  close(0);
  tokens.forEach((a, i) => {
    const moved = moveSet(N, cur, a);
    const edges = cur.flatMap((s) => (N.delta[s]?.[a] ?? []).map((t) => [s, t]));
    const dead = cur.filter((s) => !(N.delta[s]?.[a] ?? []).length);
    const moves = cur.filter((s) => !dead.includes(s)).map((s) => `${s} → ${N.delta[s][a].join(', ')}`);
    let text = `Alle Figuren lesen „${a}“. `;
    text += moves.length ? `${moves.join('; ')}.` : '';
    if (dead.length) text += ` ${dead.length === 1 ? 'Die Figur in' : 'Die Figuren in'} ${dead.join(', ')} ${dead.length === 1 ? 'hat' : 'haben'} keinen Übergang mit „${a}“ und ${dead.length === 1 ? 'scheidet' : 'scheiden'} aus.`;
    if (!moved.length) text += ' Keine Figur ist mehr übrig.';
    frames.push({ set: moved, read: i + 1, edges, kind: 'lesen', text });
    cur = moved;
    close(i + 1);
  });
  return frames;
}

export default {
  title: 'Parallelwelten',
  mount(el, ctx) {
    const p = ctx.params;
    const n = Number(p.get('aufgabe'));
    const a = (n >= 1 && n <= AUFGABEN.length ? AUFGABEN[n - 1] : null) ?? AUFGABEN.find((x) => x.id === p.get('automat')) ?? null;
    let modus = MODI[p.get('modus')] ? p.get('modus') : 'sim';
    if (!a) { overview(); return null; }
    if (modus === 'teilmengen' && !a.teilmengen) modus = 'sim';
    ctx.setSubtitle(`${MODI[modus]} · ${a.titel}`);
    const head = [modeTabs(a, modus), taskPanel(a)];
    if (modus === 'spiel') return spiel(a, head);
    if (modus === 'teilmengen') return teilmengen(a, head);
    return sim(a, head, p.get('wort'));

    // ───────────────────────── Übersicht ─────────────────────────
    function overview() {
      ctx.setSubtitle('Ein NEA darf raten: Bei mehreren Möglichkeiten teilt sich die Spielfigur auf – wie in Parallelwelten.');
      clear(el,
        h('div', { class: 'panel me-intro' },
          h('p', { class: 'lead' }, 'Ein nichtdeterministischer endlicher Automat (NEA) kann von einem Zustand mit demselben Zeichen in mehrere Zustände übergehen – oder in keinen. Stell dir vor, auf jedem aktiven Zustand steht eine Spielfigur.'),
          h('p', null, 'Ein Wort wird akzeptiert, wenn nach dem Lesen mindestens eine Figur in einem Endzustand steht. ε-Übergänge darf eine Figur nehmen, ohne ein Zeichen zu lesen. ε ist kein Zeichen des Eingabealphabets.')),
        h('ol', { class: 'case-grid' }, AUFGABEN.map((x) => {
          const r = x.raetsel.filter((w) => ctx.progress.isSolved('parallelwelten-r', `${x.id}:${w}`)).length;
          const done = r === x.raetsel.length;
          return h('li', null, h('a', { class: ['case-card', done && 'is-solved'], href: ctx.link('parallelwelten', { aufgabe: x.nr }) },
            h('span', { class: 'case-nr' }, `NEA ${x.nr} · ${x.N.states.length} Zustände${hasEps(x.N) ? ' · mit ε' : ''}`),
            h('span', { class: 'case-title' }, x.titel),
            h('span', { class: 'case-state' }, `Rätsel ${r}/${x.raetsel.length}${ctx.progress.isSolved('parallelwelten', x.id) ? ' · Teilmengen gelöst' : ''}`)));
        })));
    }

    function modeTabs(x, active) {
      return h('nav', { class: 'mode-tabs', 'aria-label': 'Modus' }, Object.entries(MODI).filter(([k]) => k !== 'teilmengen' || x.teilmengen).map(([k, label]) =>
        h('a', { href: ctx.link('parallelwelten', { aufgabe: x.nr, modus: k }), 'aria-current': k === active ? 'page' : null }, label)));
    }

    function taskPanel(x) {
      return h('div', { class: 'panel task-panel' },
        h('p', { class: 'task-text' }, x.kontext),
        h('p', { class: 'sigma' }, `Σ = {${x.N.alphabet.join(', ')}} · Startzustand ${x.N.start} · Endzustände ${x.N.accepting.join(', ')}`),
        h('p', { class: 'eps-note' }, hasEps(x.N)
          ? 'Hinweis: ε ist kein Zeichen des Eingabealphabets. Eine ε-Kante wird ohne Lesen eines Zeichens benutzt.'
          : 'Hinweis: ε ist kein Zeichen des Eingabealphabets. Dieser NEA hat keine ε-Übergänge – sein Nichtdeterminismus steckt in mehreren Kanten mit demselben Zeichen.'));
    }

    function caseNav(x, mod) {
      const next = AUFGABEN[x.nr];
      const prev = AUFGABEN[x.nr - 2];
      const m = (y) => (mod === 'teilmengen' && !y.teilmengen ? 'sim' : mod);
      return h('nav', { class: 'case-nav', 'aria-label': 'NEAs' },
        prev ? h('a', { class: 'btn btn-ghost', href: ctx.link('parallelwelten', { aufgabe: prev.nr, modus: m(prev) }) }, `‹ NEA ${prev.nr}`) : h('span'),
        h('a', { class: 'btn btn-ghost', href: ctx.link('parallelwelten') }, 'Alle NEAs'),
        next ? h('a', { class: 'btn btn-ghost', href: ctx.link('parallelwelten', { aufgabe: next.nr, modus: m(next) }) }, `NEA ${next.nr} ›`) : h('span'));
    }

    // ───────────────────────── Simulation ─────────────────────────
    function sim(x, headEls, wort) {
      const N = x.N;
      const left = h('div', { class: 'panel pw-stage' });
      const gv = new GraphView(left, { label: `NEA: ${x.titel}` });
      const ready = gv.render(N);
      const tapeBox = h('div', { class: 'pw-tape', hidden: true });
      const tape = new WordTape(tapeBox, { size: 'l', label: 'Eingabeband' });
      const figs = h('p', { class: 'pw-figs', 'aria-live': 'polite' });
      const say = h('p', { class: 'run-say pw-say' });
      const verdict = h('p', { class: 'pw-verdict', 'aria-live': 'polite' });
      const btn = (label, icon, fn) => h('button', { type: 'button', class: 'btn btn-icon', 'aria-label': label, title: label, onclick: fn }, icon);
      const bStart = btn('Zum Anfang', '⏮', () => { pause(); go(0); });
      const bPrev = btn('Schritt zurück', '◀', () => { pause(); go(k - 1); });
      const bPlay = h('button', { type: 'button', class: 'btn btn-play', onclick: () => (timer ? pause() : play()) }, 'Abspielen');
      const bNext = btn('Schritt vor', '▶', () => go(k + 1));
      const bEnd = btn('Zum Ende', '⏭', () => { pause(); go(frames.length - 1); });
      const controls = h('div', { class: 'run-controls', hidden: true }, bStart, bPrev, bPlay, bNext, bEnd);
      left.append(tapeBox, figs, controls, say, verdict);
      const trace = h('ol', { class: 'pw-trace', 'aria-label': 'Mengen aktiver Zustände' });

      let frames = []; let k = 0; let timer = null; let tokens = [];
      function go(i) {
        if (!frames.length) return;
        k = Math.max(0, Math.min(i, frames.length - 1));
        const f = frames[k];
        ready.then(() => { gv.highlight({ active: f.set, edge: f.edges }); placeFigures(gv, f.set); });
        tape.setHead(f.read);
        clear(figs, h('span', { class: 'muted' }, `${f.set.length === 1 ? 'Figur' : 'Figuren'}: `), f.set.length ? f.set.map((s) => h('span', { class: ['pw-fig-chip', N.accepting.includes(s) && 'is-acc'] }, s)) : h('strong', null, '∅ – keine Figur mehr'));
        say.textContent = f.text;
        const last = k === frames.length - 1;
        if (last) {
          const accIn = f.set.filter((s) => N.accepting.includes(s));
          const empty = tokens.length === 0;
          clear(verdict, accIn.length
            ? h('span', { class: 'verdict-yes' }, `${empty ? 'Leeres Wort ε' : 'Wort zu Ende gelesen'}: Eine Figur steht im Endzustand ${accIn.join(', ')} → akzeptiert.`)
            : h('span', { class: 'verdict-no' }, f.set.length ? `${empty ? 'Leeres Wort ε' : 'Wort zu Ende gelesen'}: Keine Figur steht in einem Endzustand → abgelehnt.` : 'Alle Figuren sind ausgeschieden → abgelehnt.'));
          tape.setVerdict(accIn.length ? 'accept' : 'reject');
        } else { clear(verdict); tape.setVerdict(null); }
        bStart.disabled = bPrev.disabled = k === 0;
        bNext.disabled = bEnd.disabled = last;
        bPlay.textContent = timer ? 'Pause' : last ? 'Nochmal' : 'Abspielen';
      }
      function play() { if (k >= frames.length - 1) go(0); timer = setInterval(() => { if (k >= frames.length - 1) { pause(); return; } go(k + 1); if (k >= frames.length - 1) pause(); }, 1000); go(k); }
      function pause() { clearInterval(timer); timer = null; if (frames.length) bPlay.textContent = k >= frames.length - 1 ? 'Nochmal' : 'Abspielen'; }

      const input = h('input', { type: 'text', id: 'pw-word', class: 'word-input', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', placeholder: `z. B. ${x.beispiele.ja[0]}` });
      const msg = h('p', { class: 'field-msg', 'aria-live': 'polite' });
      function load(w, autoplay = true) {
        const tk = tokenize(w, N.alphabet);
        if (!tk.ok) { msg.textContent = tk.message; input.setAttribute('aria-invalid', 'true'); return; }
        msg.textContent = ''; input.removeAttribute('aria-invalid');
        pause();
        tokens = tk.tokens;
        frames = nfaFrames(N, tokens);
        tape.set(tokens); tapeBox.hidden = false; controls.hidden = false;
        const r = runNFA(N, tokens);
        clear(trace, r.sets.map((s, i) => h('li', null, i === 0 ? 'Start' : `nach „${tokens[i - 1]}“`, ': ', h('code', null, fmt(s)))));
        go(0);
        if (autoplay) play();
      }
      const chips = [...new Set([...x.beispiele.ja, ...x.beispiele.nein])];
      const right = h('div', { class: 'stack-col' },
        h('div', { class: 'panel' },
          h('form', { class: 'word-form', onsubmit: (e) => { e.preventDefault(); load(input.value); } },
            h('label', { for: 'pw-word' }, 'Eingabewort'),
            h('div', { class: 'input-row' }, input, h('button', { type: 'submit', class: 'btn btn-primary' }, 'Simulieren')), msg,
            h('div', { class: 'chip-row' }, chips.map((w) => h('button', { type: 'button', class: 'chip', onclick: () => { input.value = w === 'ε' ? '' : w; load(w); } }, w))))),
        h('div', { class: 'panel' }, h('h2', { class: 'me-h2' }, 'Menge der aktiven Zustände'),
          h('p', { class: 'muted' }, 'So notierst du den Lauf eines NEA: nach jedem Zeichen die Menge aller Zustände, in denen eine Figur steht (inklusive ε-Abschluss).'),
          trace));
      clear(el, ...headEls, h('div', { class: 'two-col' }, left, right), caseNav(x, 'sim'));
      const start = wort ?? x.beispiele.ja[0];
      input.value = start === 'ε' ? '' : start;
      load(start, false);
      return () => pause();
    }

    // ───────────────────────── Spiel: Wo stehen die Figuren? ─────────────────────────
    function spiel(x, headEls) {
      const N = x.N;
      let idx = 0; let firstTry = 0;
      const left = h('div', { class: 'panel pw-stage' });
      const gv = new GraphView(left, { label: `NEA: ${x.titel}. Tippe Zustände an, um Figuren zu setzen.` });
      const ready = gv.render(N);
      gv.canvas.classList.add('is-clickable');
      const right = h('div', { class: 'panel pw-quiz' });
      let toggle = () => {};
      gv.canvas.addEventListener('click', (e) => {
        const node = e.target.closest?.('.state');
        if (!node) return;
        const s = [...gv.nodeIds].find(([, id]) => id === node.id)?.[0];
        if (s) toggle(s);
      });

      function item() {
        if (idx >= x.raetsel.length) return done();
        const w = x.raetsel[idx];
        const r = runNFA(N, w);
        const target = r.sets.at(-1);
        const chosen = new Set();
        let tries = 0; let over = false;
        const tapeBox = h('div');
        const tape = new WordTape(tapeBox, { size: 'l', label: 'Eingabewort' });
        tape.set(r.tokens); tape.setHead(-1);
        const chipEls = new Map();
        const chipRow = h('div', { class: 'chip-row pw-state-chips', role: 'group', 'aria-label': 'Zustände' }, N.states.map((s) => {
          const c = h('button', { type: 'button', class: 'chip', 'aria-pressed': 'false', onclick: () => toggle(s) }, s);
          chipEls.set(s, c); return c;
        }));
        const fb = h('div', { 'aria-live': 'polite', class: 'pw-fb' });
        const nextBtn = h('button', { type: 'button', class: 'btn btn-primary', hidden: true, onclick: () => { idx++; item(); } }, idx + 1 < x.raetsel.length ? 'Nächstes Rätsel' : 'Auswertung');
        const simLink = h('a', { class: 'btn', hidden: true, href: ctx.link('parallelwelten', { aufgabe: x.nr, modus: 'sim', wort: w }) }, 'Lauf Schritt für Schritt ansehen');
        const show = () => {
          for (const [s, c] of chipEls) c.setAttribute('aria-pressed', String(chosen.has(s)));
          ready.then(() => { gv.highlight({ active: [...chosen] }); placeFigures(gv, [...chosen]); });
          sel.textContent = chosen.size ? fmt(N.states.filter((s) => chosen.has(s))) : '∅ (keine Figur)';
        };
        toggle = (s) => { if (over) return; if (chosen.has(s)) chosen.delete(s); else chosen.add(s); show(); };
        const sel = h('code', { class: 'pw-sel' });
        const check = () => {
          if (over) return;
          tries++;
          const mine = N.states.filter((s) => chosen.has(s));
          const ok = mine.length === target.length && mine.every((s, i) => s === target[i]);
          if (ok) {
            over = true; if (tries === 1) firstTry++;
            const { first } = ctx.progress.solve('parallelwelten-r', `${x.id}:${w}`, 10);
            if (ctx.progress.solvedIds('parallelwelten-r').length >= 5) ctx.progress.award('parallelwelten-figuren');
            clear(fb, h('div', { class: 'notice notice-success' }, h('p', null, h('strong', null, 'Richtig! '), `Nach ${w === 'ε' ? 'dem leeren Wort' : quote(w)} stehen die Figuren auf ${fmt(target)}. ${target.some((s) => N.accepting.includes(s)) ? 'Mindestens eine steht in einem Endzustand → akzeptiert.' : 'Keine steht in einem Endzustand → abgelehnt.'}`),
              first ? h('p', { class: 'points-note' }, '+10 Punkte') : null));
            nextBtn.hidden = false; simLink.hidden = false; nextBtn.focus({ preventScroll: true });
          } else {
            const missing = target.filter((s) => !chosen.has(s)); const extra = mine.filter((s) => !target.includes(s));
            const parts = [];
            if (extra.length) parts.push(`In ${extra.join(', ')} steht keine Figur.`);
            if (missing.length) parts.push(tries >= 2 ? `Es fehlt eine Figur in ${missing.join(', ')}.` : `Es ${missing.length === 1 ? 'fehlt eine Figur' : `fehlen ${missing.length} Figuren`}.`);
            if (tries >= 3) { over = true; parts.push(`Richtig wäre ${fmt(target)}.`); nextBtn.hidden = false; simLink.hidden = false; }
            clear(fb, h('div', { class: 'notice notice-error' }, h('p', null, h('strong', null, 'Noch nicht. '), parts.join(' ')),
              hasEps(N) ? h('p', { class: 'muted' }, 'Denk an den ε-Abschluss: Figuren dürfen ohne Lesen über ε-Kanten weiterziehen.') : null));
          }
        };
        clear(right, h('p', { class: 'case-nr' }, `Rätsel ${idx + 1} von ${x.raetsel.length}`),
          h('h2', { class: 'me-h2' }, 'Wo stehen die Figuren nach diesem Wort?'), tapeBox,
          h('p', { class: 'muted pw-hint' }, 'Tippe im Graphen oder hier auf die Zustände, in denen nach dem Lesen eine Figur steht. Keine Figur mehr? Dann wähle keinen Zustand.'),
          chipRow, h('p', null, 'Deine Auswahl: ', sel),
          h('div', { class: 'start-actions' }, h('button', { type: 'button', class: 'btn btn-primary', onclick: check }, 'Prüfen'), simLink, nextBtn), fb);
        show();
      }
      function done() {
        toggle = () => {};
        ready.then(() => { gv.clearHighlight(); placeFigures(gv, []); });
        clear(right, h('h2', null, 'Alle Rätsel gelöst'),
          h('p', { class: 'result-big' }, h('span', { class: 'num' }, String(firstTry)), ` von ${x.raetsel.length} im ersten Versuch`),
          h('div', { class: 'start-actions' },
            x.teilmengen ? h('a', { class: 'btn btn-primary', href: ctx.link('parallelwelten', { aufgabe: x.nr, modus: 'teilmengen' }) }, 'Weiter: Teilmengenkonstruktion') : null,
            AUFGABEN[x.nr] ? h('a', { class: 'btn', href: ctx.link('parallelwelten', { aufgabe: x.nr + 1, modus: 'spiel' }) }, `Rätsel zu NEA ${x.nr + 1}`) : null));
      }
      clear(el, ...headEls, h('div', { class: 'two-col' }, left, right), caseNav(x, 'spiel'));
      item();
      return null;
    }

    // ───────────────────────── Teilmengenkonstruktion ─────────────────────────
    function teilmengen(x, headEls) {
      const N = x.N;
      const S = subsetConstruction(N);
      const key = (set) => set.join(',');
      const rows = [{ set: epsilonClosure(N, N.starts), done: false }];
      const known = new Set([key(rows[0].set)]);
      let revealed = 0;
      const left = h('div', { class: 'panel pw-stage' });
      const gv = new GraphView(left, { label: `NEA: ${x.titel}` });
      const ready = gv.render(N);
      const tableBody = h('tbody');
      const work = h('div', { class: 'pw-work' });
      const resultSlot = h('div');

      function renderTable() {
        clear(tableBody, rows.map((r) => h('tr', { class: r.done ? 'is-done' : 'is-open' },
          h('th', { scope: 'row' }, h('code', null, fmt(r.set)), r.done && r.set.some((s) => N.accepting.includes(s)) ? h('span', { class: 'pw-acc' }, ' Endzustand') : null),
          N.alphabet.map((a) => h('td', null, r.done ? h('code', null, fmt(stepSet(N, r.set, a))) : h('span', { class: 'muted' }, '?'))))));
      }

      function current() {
        const r = rows.find((y) => !y.done);
        if (!r) return finish();
        ready.then(() => { gv.highlight({ active: r.set }); placeFigures(gv, r.set); });
        const picks = Object.fromEntries(N.alphabet.map((a) => [a, new Set()]));
        const groups = N.alphabet.map((a) => h('div', { class: 'pw-pick' },
          h('p', { class: 'pw-pick-label' }, `Von ${fmt(r.set)} mit „${a}“ (inkl. ε-Abschluss):`),
          h('div', { class: 'chip-row', role: 'group', 'aria-label': `Zielmenge mit ${a}` }, N.states.map((s) => {
            const c = h('button', { type: 'button', class: 'chip', 'aria-pressed': 'false', onclick: () => { if (picks[a].has(s)) picks[a].delete(s); else picks[a].add(s); c.setAttribute('aria-pressed', String(picks[a].has(s))); } }, s);
            return c;
          }))));
        const fb = h('div', { 'aria-live': 'polite' });
        const accept = (wasReveal) => {
          r.done = true; if (wasReveal) revealed++;
          for (const a of N.alphabet) {
            const t = stepSet(N, r.set, a);
            if (t.length && !known.has(key(t))) { known.add(key(t)); rows.push({ set: t, done: false }); }
          }
          renderTable(); current();
        };
        clear(work, h('h2', { class: 'me-h2' }, `Zeile ${rows.indexOf(r) + 1}: ${fmt(r.set)}`), ...groups,
          h('p', { class: 'muted' }, 'Kein Zustand gewählt = ∅ (Fehlerzustand, wird nicht gezeichnet).'),
          h('div', { class: 'start-actions' },
            h('button', { type: 'button', class: 'btn btn-primary', onclick: () => {
              const wrong = N.alphabet.filter((a) => key(stepSet(N, r.set, a)) !== key(N.states.filter((s) => picks[a].has(s))));
              if (!wrong.length) accept(false);
              else {
                const a = wrong[0];
                const moved = moveSet(N, r.set, a);
                clear(fb, h('div', { class: 'notice notice-error' }, h('p', null, h('strong', null, 'Noch nicht. '), `Prüfe die Spalte „${wrong.join('“, „')}“.`),
                  h('p', null, `Tipp zu „${a}“: Figuren aus ${fmt(r.set)} ziehen mit „${a}“ nach ${fmt(moved)}${hasEps(N) ? ', danach kommt der ε-Abschluss dazu' : ''}.`)));
              }
            } }, 'Zeile prüfen'),
            h('button', { type: 'button', class: 'btn btn-ghost', onclick: () => accept(true) }, 'Zeile aufdecken')), fb);
      }

      function finish() {
        clear(work);
        work.closest('.panel').hidden = true;
        ready.then(() => { gv.clearHighlight(); placeFigures(gv, []); });
        if (!revealed) {
          const { first } = ctx.progress.solve('parallelwelten', x.id, 30);
          ctx.progress.award('parallelwelten-teilmengen');
          if (first) ctx.toast('+30 Punkte', { type: 'success' });
        }
        const D = S.dfa;
        const box = h('div', { class: 'pw-result-graph' });
        clear(resultSlot, h('section', { class: 'panel pw-done' },
          h('h2', null, 'Fertig: der DEA'),
          h('p', null, `Der NEA hat ${N.states.length} Zustände, der DEA aus der Teilmengenkonstruktion hat ${D.states.length}${D.implicitError ? ' (plus Fehlerzustand ∅)' : ''}.${D.states.length > N.states.length * 1.5 ? ' Das ist die Größenexplosion: Im schlimmsten Fall braucht der DEA 2ⁿ Zustände.' : ''}`),
          revealed ? h('p', { class: 'muted' }, `${revealed} ${revealed === 1 ? 'Zeile wurde' : 'Zeilen wurden'} aufgedeckt – für Punkte alle Zeilen selbst ausfüllen.`) : null,
          h('p', { class: 'muted' }, 'Endzustände des DEA sind alle Mengen, die einen Endzustand des NEA enthalten.'),
          box));
        if (D.states.length > 5) box.classList.add('is-dense');
        new GraphView(box, { label: 'DEA aus der Teilmengenkonstruktion', minScale: 0.75 }).render(D);
      }

      renderTable();
      clear(el, ...headEls, h('div', { class: 'two-col' }, left,
        h('div', { class: 'stack-col' },
          h('div', { class: 'panel' },
            h('p', null, 'Jeder Zustand des DEA ist eine Menge von NEA-Zuständen (wo können Figuren stehen?). Start: ε-Abschluss des Startzustands. Für jede neue Menge kommt eine Zeile hinzu.'),
            h('div', { class: 'table-scroll' }, h('table', { class: 'mini-table pw-table' },
              h('thead', null, h('tr', null, h('th', null, 'Zustandsmenge'), N.alphabet.map((a) => h('th', null, a)))), tableBody))),
          h('div', { class: 'panel' }, work))),
      resultSlot, caseNav(x, 'teilmengen'));
      current();
      return null;
    }
  },
};
