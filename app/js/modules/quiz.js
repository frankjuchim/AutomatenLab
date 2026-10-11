// Level-Quiz (#/quiz): Exit-Tickets je Welt (8–10 Fragen) und Mini-Exit-Tickets je Doppelstunde (3 Fragen).
// Fragetypen: Multiple Choice, Wahr/Falsch mit Begründung, Zuordnung. Ergebnisseite zum Vorzeigen.
// Deep-Links: #/quiz?welt=A|B|C|D, #/quiz?ds=1…16

import { h, clear } from '../core/dom.js';
import { QUIZ_WELTEN, QUIZ_DS } from '../data/quiz.js';
import { LEVELS } from '../data/worlds.js';
import { makeRng } from '../engine/tokenize.js';

const PUNKTE_WELT = 30;
const PUNKTE_DS = 10;

export default {
  title: 'Level-Quiz',
  mount(el, ctx) {
    const welt = (ctx.params.get('welt') ?? '').toUpperCase();
    const ds = Number(ctx.params.get('ds'));
    if (QUIZ_WELTEN[welt]) return run({ key: `welt-${welt}`, titel: QUIZ_WELTEN[welt].titel, fragen: QUIZ_WELTEN[welt].fragen, punkte: PUNKTE_WELT, art: 'welt', back: ctx.link('quiz') });
    if (QUIZ_DS[ds]) return run({ key: `ds-${ds}`, titel: `Exit-Ticket ${QUIZ_DS[ds].titel}`, fragen: QUIZ_DS[ds].fragen, punkte: PUNKTE_DS, art: 'ds', back: ctx.link('quiz') });
    overview();
    return null;

    function overview() {
      ctx.setSubtitle('Kurz, knapp, abiturnah: Zeig am Ende der Stunde, was sitzt.');
      const bestOf = (key) => ctx.progress.best(`quiz:${key}`);
      clear(el,
        h('section', { class: 'stufe-section' },
          h('h2', null, 'Quiz je Welt'),
          h('ol', { class: 'challenge-grid' }, Object.entries(QUIZ_WELTEN).map(([id, q]) => {
            const best = bestOf(`welt-${id}`);
            return h('li', null, h('a', { class: ['challenge-card', best === 100 && 'is-solved', 'stufe-2'], href: ctx.link('quiz', { welt: id }) },
              h('span', { class: 'case-nr' }, `Welt ${id} · ${q.fragen.length} Fragen`),
              h('span', { class: 'case-title' }, q.titel.replace(/^Welt .: /, '')),
              h('span', { class: 'case-state' }, best != null ? `Bestes Ergebnis: ${best} %` : `${PUNKTE_WELT} Punkte`)));
          }))),
        h('section', { class: 'stufe-section' },
          h('h2', null, 'Mini-Exit-Tickets je Level (3 Fragen)'),
          h('ol', { class: 'challenge-grid quiz-ds-grid' }, Object.keys(QUIZ_DS).map((n) => {
            const best = bestOf(`ds-${n}`);
            return h('li', null, h('a', { class: ['challenge-card', best === 100 && 'is-solved', 'stufe-1'], href: ctx.link('quiz', { ds: n }) },
              h('span', { class: 'case-nr' }, `Level ${n}`),
              h('span', { class: 'case-title' }, LEVELS[n]),
              h('span', { class: 'case-state' }, best != null ? `${best} %` : 'offen')));
          }))));
    }

    function run(q) {
      ctx.setSubtitle(q.titel);
      const rng = makeRng();
      const fragen = q.fragen.map((f) => prepare(f, rng));
      const st = { i: 0, score: 0, t0: performance.now(), log: [] };
      const box = h('div', { class: 'panel quiz-box' });
      const bar = h('div', { class: 'quiz-progress', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': String(fragen.length), 'aria-valuenow': '0' }, h('span', { class: 'quiz-progress-fill' }));

      function show() {
        const f = fragen[st.i];
        bar.setAttribute('aria-valuenow', String(st.i));
        bar.firstChild.style.transform = `scaleX(${st.i / fragen.length})`;
        const head = h('p', { class: 'muted' }, `Frage ${st.i + 1} von ${fragen.length} · ${{ mc: 'Multiple Choice', wf: 'Wahr oder falsch – mit Begründung', zuordnung: 'Zuordnung' }[f.typ]}`);
        const verdict = h('div', { class: 'quiz-verdict', 'aria-live': 'polite' });
        const nextBtn = () => h('div', { class: 'start-actions' }, h('button', { type: 'button', class: 'btn btn-primary', onclick: () => { st.i++; st.i < fragen.length ? show() : finish(); } }, st.i + 1 < fragen.length ? 'Nächste Frage' : 'Zur Auswertung'));
        const done = (earned, text) => {
          st.score += earned; st.log.push({ f, earned });
          clear(verdict, h('div', { class: ['notice', earned === 1 ? 'notice-success' : earned > 0 ? 'notice-warn' : 'notice-error'] },
            h('p', null, h('strong', null, earned === 1 ? 'Richtig. ' : earned > 0 ? 'Teilweise richtig. ' : 'Leider nicht. '), text ?? ''), f.erklaerung ? h('p', { class: 'muted' }, f.erklaerung) : null), nextBtn());
          verdict.querySelector('.btn-primary')?.focus({ preventScroll: true });
        };

        if (f.typ === 'mc') {
          const buttons = f.opts.map((o, i) => h('button', { type: 'button', class: 'option', onclick: () => {
            buttons.forEach((b) => { b.disabled = true; });
            buttons[i].classList.add(o.correct ? 'is-correct' : 'is-wrong');
            if (!o.correct) buttons[f.opts.findIndex((x) => x.correct)].classList.add('is-correct');
            done(o.correct ? 1 : 0, o.correct ? null : `Richtig wäre: ${f.opts.find((x) => x.correct).text}`);
          } }, h('span', { class: 'option-key', 'aria-hidden': 'true' }, 'ABCD'[i]), h('span', { class: 'option-text' }, o.text)));
          clear(box, head, h('h2', { class: 'question' }, f.frage), h('ul', { class: 'option-list' }, buttons.map((b) => h('li', null, b))), verdict);
        } else if (f.typ === 'wf') {
          const begr = h('div', { class: 'quiz-begr' });
          let wfRight = null;
          const wfBtns = [true, false].map((v) => h('button', { type: 'button', class: ['decide', v ? 'decide-yes' : 'decide-no', 'decide-small'], onclick: () => {
            wfBtns.forEach((b) => { b.disabled = true; });
            wfRight = v === f.wahr;
            wfBtns[v ? 0 : 1].classList.add(wfRight ? 'is-correct' : 'is-wrong');
            clear(begr, h('p', null, h('strong', null, wfRight ? 'Stimmt. ' : `Nein, die Aussage ist ${f.wahr ? 'wahr' : 'falsch'}. `), 'Welche Begründung passt?'),
              h('ul', { class: 'option-list' }, f.opts.map((o, i) => { const b = h('button', { type: 'button', class: 'option', onclick: () => {
                begr.querySelectorAll('.option').forEach((x) => { x.disabled = true; });
                b.classList.add(o.correct ? 'is-correct' : 'is-wrong');
                done((wfRight ? 0.5 : 0) + (o.correct ? 0.5 : 0), o.correct ? null : `Passende Begründung: ${f.opts.find((x) => x.correct).text}`);
              } }, h('span', { class: 'option-key', 'aria-hidden': 'true' }, 'ABC'[i]), h('span', { class: 'option-text' }, o.text)); return h('li', null, b); })));
          } }, v ? 'Wahr' : 'Falsch'));
          clear(box, head, h('h2', { class: 'question' }, f.aussage), h('div', { class: 'decide-row quiz-wf' }, wfBtns[1], wfBtns[0]), begr, verdict);
        } else {
          const rights = rng.shuffle(f.paare.map((p) => p[1]));
          const selects = f.paare.map((p) => h('select', { class: 'quiz-select', 'aria-label': p[0] }, h('option', { value: '' }, '– wählen –'), rights.map((r) => h('option', { value: r }, r))));
          const list = h('ul', { class: 'zuordnung-list' }, f.paare.map((p, i) => h('li', null, h('span', { class: 'zu-left' }, p[0]), selects[i])));
          const checkBtn = h('button', { type: 'button', class: 'btn btn-primary', onclick: () => {
            if (selects.some((s) => !s.value)) { clear(verdict, h('p', { class: 'notice notice-warn' }, 'Ordne erst alles zu.')); return; }
            let ok = 0;
            selects.forEach((s, i) => { const right = s.value === f.paare[i][1]; if (right) ok++; s.disabled = true; s.parentElement.classList.add(right ? 'is-yes' : 'is-no'); if (!right) s.parentElement.append(h('span', { class: 'zu-fix muted' }, ` → ${f.paare[i][1]}`)); });
            checkBtn.disabled = true;
            done(ok === f.paare.length ? 1 : ok >= f.paare.length / 2 ? 0.5 : 0, `${ok} von ${f.paare.length} Zuordnungen richtig.`);
          } }, 'Prüfen');
          clear(box, head, h('h2', { class: 'question' }, f.frage), list, h('p', null, checkBtn), verdict);
        }
      }

      function finish() {
        bar.firstChild.style.transform = 'scaleX(1)';
        const total = fragen.length;
        const pct = Math.round((100 * st.score) / total);
        const secs = Math.round((performance.now() - st.t0) / 1000);
        const key = `quiz:${q.key}`;
        const prev = ctx.progress.best(key) ?? 0;
        const record = ctx.progress.setBest(key, pct);
        if (record) ctx.progress.addPoints(Math.round(((pct - prev) / 100) * q.punkte));
        ctx.progress.award('quiz-erstes');
        if (q.art === 'welt' && pct === 100) ctx.progress.award('quiz-welt-perfekt');
        const fmt = (x) => String(x).replace('.', ',');
        const stamp = new Date().toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' });
        clear(box,
          h('div', { class: 'quiz-result' },
            h('p', { class: 'muted' }, 'Ergebnis zum Vorzeigen'),
            h('h2', null, q.titel),
            h('p', { class: 'result-big' }, h('span', { class: ['num', pct >= 80 ? 'is-top' : ''] }, `${pct} %`)),
            h('p', { class: 'quiz-result-line' }, `${fmt(st.score)} von ${total} Punkten · ${secs} s · ${stamp}`),
            pct === 100 ? h('p', { class: 'record' }, 'Alles richtig!') : pct >= 80 ? h('p', { class: 'record' }, 'Sehr gut – fast alles sitzt.') : h('p', { class: 'muted' }, 'Schau dir die markierten Fragen noch einmal an.'),
            h('ol', { class: 'quiz-log' }, st.log.map((e) => h('li', { class: e.earned === 1 ? 'is-yes' : e.earned > 0 ? 'is-half' : 'is-no' },
              h('span', { class: 'quiz-log-mark', 'aria-label': e.earned === 1 ? 'richtig' : e.earned > 0 ? 'teilweise' : 'falsch' }, e.earned === 1 ? '✓' : e.earned > 0 ? '½' : '✗'),
              h('span', null, e.f.frage ?? e.f.aussage)))),
            h('div', { class: 'start-actions' },
              h('button', { type: 'button', class: 'btn btn-primary', onclick: () => run(q) }, 'Nochmal'),
              h('a', { class: 'btn', href: q.back }, 'Alle Quizze'))));
      }

      clear(el, bar, box);
      show();
      return null;
    }
  },
};

/** Optionen mischen, Korrektheit merken (Datenkonvention: erste Option/Begründung ist richtig). */
function prepare(f, rng) {
  if (f.typ === 'mc') return { ...f, opts: rng.shuffle(f.optionen.map((text, i) => ({ text, correct: i === 0 }))) };
  if (f.typ === 'wf') return { ...f, opts: rng.shuffle(f.begruendungen.map((text, i) => ({ text, correct: i === 0 }))) };
  return { ...f };
}
