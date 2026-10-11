// Sprach-Detektiv (#/detektiv): Welche Sprache erkennt der Automat?
// Testwörter eingeben (Lauf wird gezeigt), dann aus vier Beschreibungen die richtige wählen.
// Deep-Link: #/detektiv?fall=n (n = 1 …)

import { h, clear, quote } from '../core/dom.js';
import { DETEKTIV_FAELLE } from '../data/detektiv.js';
import { dfa, runDFA } from '../engine/dfa.js';
import { makeRng, wordToString, enumerateWords, tokenize } from '../engine/tokenize.js';
import { RunPlayer } from '../components/run-player.js';

const FAELLE = DETEKTIV_FAELLE.map((f, i) => ({ ...f, nr: i + 1, id: `fall-${i + 1}`, A: dfa(f.automat) }));

/** Kürzestes Wort, bei dem Automat und Beschreibung verschieden urteilen (oder null). */
export function unterscheidendesWort(A, pruefe, maxLen = 8) {
  for (const w of enumerateWords(A.alphabet, maxLen)) if (runDFA(A, w).accepted !== !!pruefe(w)) return w;
  return null;
}

export default {
  title: 'Sprach-Detektiv',
  mount(el, ctx) {
    const n = Number(ctx.params.get('fall'));
    if (n >= 1 && n <= FAELLE.length) return showCase(FAELLE[n - 1]);
    showList();
    return null;

    function showList() {
      ctx.setSubtitle('Ein Automat, vier Verdächtige: Welche Beschreibung passt genau zu seiner Sprache?');
      clear(el, h('div', { class: 'case-intro' },
        h('p', { class: 'lead' }, 'So ermittelst du: Teste Wörter, beobachte den Lauf und überlege, was sich der Automat in jedem Zustand „merkt“. Erst dann entscheidest du dich.')),
      h('ol', { class: 'case-grid' }, FAELLE.map((f) => {
        const solved = ctx.progress.isSolved('detektiv', f.id);
        return h('li', null, h('a', { class: ['case-card', solved && 'is-solved'], href: ctx.link('detektiv', { fall: f.nr }) },
          h('span', { class: 'case-nr' }, `Fall ${f.nr}`),
          h('span', { class: 'case-title' }, f.titel),
          h('span', { class: 'case-state' }, solved ? 'gelöst' : 'offen')));
      })));
    }

    function showCase(f) {
      ctx.setSubtitle(`Fall ${f.nr} von ${FAELLE.length}: ${f.titel}`);
      const rng = makeRng();
      const options = rng.shuffle(f.optionen.map((o, i) => ({ ...o, correct: i === 0 })));
      let attempts = 0;
      let solved = false;

      const left = h('div', { class: 'case-lab panel' });
      const playerBox = h('div', { class: 'case-player' });
      const rp = new RunPlayer(playerBox, { automat: f.A, label: `Mystery-Automat für Fall ${f.nr}` });

      const input = h('input', { type: 'text', id: 'testwort', class: 'word-input', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false',
        placeholder: f.A.alphabet.some((s) => s.length > 1) ? 'z. B. 10 20' : `z. B. ${f.vorschlaege?.[1] ?? f.A.alphabet.join('')}` });
      const inputMsg = h('p', { class: 'field-msg', 'aria-live': 'polite' });
      const log = h('ul', { class: 'test-log', 'aria-label': 'Getestete Wörter' });
      const tested = new Map();

      function test(word) {
        const tk = tokenize(word, f.A.alphabet);
        if (!tk.ok) { inputMsg.textContent = tk.message; input.setAttribute('aria-invalid', 'true'); return; }
        input.removeAttribute('aria-invalid'); inputMsg.textContent = '';
        const run = rp.load(tk.tokens);
        rp.play();
        const key = tk.tokens.join('\u0001');
        if (!tested.has(key)) {
          tested.set(key, run.accepted);
          const shown = wordToString(tk.tokens, f.A.alphabet);
          log.prepend(h('li', { class: run.accepted ? 'is-yes' : 'is-no' },
            h('button', { type: 'button', class: 'log-word', onclick: () => { rp.load(tk.tokens); rp.play(); }, 'aria-label': `${shown} erneut abspielen` }, shown),
            h('span', { class: 'log-verdict' }, run.accepted ? 'akzeptiert' : 'abgelehnt')));
        }
      }

      const form = h('form', { class: 'word-form', onsubmit: (e) => { e.preventDefault(); test(input.value); input.select(); } },
        h('label', { for: 'testwort' }, 'Testwort'),
        h('div', { class: 'input-row' }, input, h('button', { type: 'submit', class: 'btn btn-primary' }, 'Testen')),
        inputMsg,
        h('div', { class: 'chip-row', 'aria-label': 'Vorschläge' },
          (f.vorschlaege ?? []).map((w) => h('button', { type: 'button', class: 'chip', onclick: () => { input.value = w; test(w); } }, w))));

      const blackbox = h('input', { type: 'checkbox', id: 'blackbox', onchange: (e) => left.classList.toggle('is-blackbox', e.target.checked) });
      left.append(
        h('div', { class: 'lab-head' },
          h('p', { class: 'sigma' }, `Σ = {${f.A.alphabet.join(', ')}}`),
          h('label', { class: 'check', for: 'blackbox' }, blackbox, ' Black-Box: Graph verbergen')),
        playerBox, form,
        h('h3', { class: 'log-title' }, 'Deine Testwörter'), log);

      // ── Optionen ──
      const right = h('div', { class: 'case-question panel' });
      const verdict = h('div', { class: 'case-verdict', 'aria-live': 'polite' });
      const optList = h('ul', { class: 'option-list', role: 'list' });
      const optButtons = options.map((o, i) => {
        const b = h('button', { type: 'button', class: 'option', onclick: () => choose(o, b) },
          h('span', { class: 'option-key', 'aria-hidden': 'true' }, 'ABCD'[i]), h('span', { class: 'option-text' }, o.text));
        optList.append(h('li', null, b));
        return b;
      });

      function choose(o, b) {
        if (solved || b.disabled) return;
        attempts++;
        if (o.correct) {
          solved = true;
          b.classList.add('is-correct');
          optButtons.forEach((x) => { x.disabled = true; });
          const punkte = attempts === 1 ? 30 : attempts === 2 ? 20 : 10;
          const { first } = ctx.progress.solve('detektiv', f.id, punkte);
          if (attempts === 1) ctx.progress.solve('detektiv-erstversuch', f.id, 0);
          ctx.progress.award('detektiv-erster-fall');
          if (ctx.progress.solvedIds('detektiv-erstversuch').length >= 5) ctx.progress.award('detektiv-spuernase');
          if (FAELLE.every((x) => ctx.progress.isSolved('detektiv', x.id))) ctx.progress.award('detektiv-alle');
          if (first) ctx.toast(`+${punkte} Punkte`, { type: 'success' });
          const next = FAELLE[f.nr];
          clear(verdict, h('div', { class: 'notice notice-success' },
            h('p', null, h('strong', null, 'Fall gelöst! '), attempts === 1 ? 'Gleich im ersten Versuch.' : `Nach ${attempts} Versuchen.`),
            h('p', null, 'So „denkt“ der Automat – die Bedeutung der Zustände:'),
            h('dl', { class: 'meaning-list' }, Object.entries(f.bedeutung ?? {}).flatMap(([s, m]) => [h('dt', null, s), h('dd', null, m)])),
            f.A.implicitError ? h('p', { class: 'muted' }, 'Nicht eingezeichnete Übergänge führen in einen Fehlerzustand.') : null),
          h('div', { class: 'start-actions' },
            next ? h('a', { class: 'btn btn-primary', href: ctx.link('detektiv', { fall: next.nr }) }, `Weiter zu Fall ${next.nr}`) : h('p', null, 'Das war der letzte Fall.'),
            h('a', { class: 'btn', href: ctx.link('detektiv') }, 'Alle Fälle')));
          verdict.querySelector('.btn-primary')?.focus({ preventScroll: true });
        } else {
          b.classList.add('is-wrong'); b.disabled = true;
          const w = unterscheidendesWort(f.A, o.pruefe);
          const acc = w ? runDFA(f.A, w).accepted : null;
          const shown = w ? quote(wordToString(w, f.A.alphabet)) : null;
          clear(verdict, h('div', { class: 'notice notice-error' },
            h('p', null, h('strong', null, 'Noch nicht. '), w
              ? (acc ? `Der Automat akzeptiert ${shown} – nach dieser Beschreibung gehört das Wort aber nicht zur Sprache.`
                : `Der Automat lehnt ${shown} ab – nach dieser Beschreibung müsste das Wort aber dazugehören.`)
              : 'Diese Beschreibung passt nicht.'),
            w ? h('button', { type: 'button', class: 'btn btn-small', onclick: () => { left.classList.remove('is-blackbox'); blackbox.checked = false; rp.load(w); rp.play(); playerBox.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } }, `Lauf für ${shown} ansehen`) : null));
        }
      }

      right.append(h('h2', { class: 'question' }, 'Welche Sprache erkennt der Automat?'), optList, verdict);

      clear(el, h('div', { class: 'case-layout' }, left, right),
        h('nav', { class: 'case-nav', 'aria-label': 'Fälle' },
          f.nr > 1 ? h('a', { class: 'btn btn-ghost', href: ctx.link('detektiv', { fall: f.nr - 1 }) }, `‹ Fall ${f.nr - 1}`) : h('span'),
          h('a', { class: 'btn btn-ghost', href: ctx.link('detektiv') }, 'Alle Fälle'),
          f.nr < FAELLE.length ? h('a', { class: 'btn btn-ghost', href: ctx.link('detektiv', { fall: f.nr + 1 }) }, `Fall ${f.nr + 1} ›`) : h('span')));

      rp.ready.then(() => { const first = f.vorschlaege?.[0] ?? ''; rp.load(first); });
      return () => rp.destroy();
    }
  },
};
