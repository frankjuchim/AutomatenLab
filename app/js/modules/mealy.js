// Mealy-Maschine (#/mealy, DS06): Simulation mit Eingabe- und Ausgabeband.
// Modi: „Was kommt raus?“ (Ausgabe vorhersagen), „Bug-Jagd“ (fehlerhafte Kantenausgaben finden und
// reparieren, Prüfung gegen die Referenz), „Freie Simulation“.
// Deep-Links: #/mealy?aufgabe=n&modus=vorhersage|bugjagd|frei  (n = 1 …; ohne modus: vorhersage)

import { h, clear, quote } from '../core/dom.js';
import { MEALY_AUFGABEN } from '../data/mealy.js';
import { mealy, runMealy, mealyEquivalent, outputLabel } from '../engine/mealy.js';
import { tokenize, isEpsilon, wordToString } from '../engine/tokenize.js';
import { GraphView } from '../components/graph-view.js';
import { WordTape } from '../components/word-tape.js';
import { MealyPlayer } from '../components/mealy-player.js';

const AUFGABEN = MEALY_AUFGABEN.map((a, i) => ({ ...a, nr: i + 1, M: mealy(a.automat) }));
const MODI = { vorhersage: 'Was kommt raus?', bugjagd: 'Bug-Jagd', frei: 'Freie Simulation' };
const PUNKTE = { wort: 10, gefunden: 10, repariert: 30 };

/** Fehlerhafte Variante: Kopie der Referenz mit ersetzten Ausgaben. */
function fehlerVariante(a) {
  const F = mealy(a.automat);
  for (const f of a.fehler) F.delta[f.von][f.zeichen] = { ...F.delta[f.von][f.zeichen], out: f.ausgabe };
  return F;
}
const clone = (M) => ({ ...M, delta: Object.fromEntries(Object.entries(M.delta).map(([s, row]) => [s, Object.fromEntries(Object.entries(row).map(([a, t]) => [a, { ...t }]))])) });
const shownWord = (tokens, alphabet) => (tokens.length ? quote(wordToString(tokens, alphabet)) : 'ε');

export default {
  title: 'Mealy-Maschine',
  mount(el, ctx) {
    const p = ctx.params;
    const modus = MODI[p.get('modus')] ? p.get('modus') : null;
    const n = Number(p.get('aufgabe'));
    const a = n >= 1 && n <= AUFGABEN.length ? AUFGABEN[n - 1] : (modus ? AUFGABEN[0] : null);
    if (!a) { overview(); return null; }
    const m = modus ?? 'vorhersage';
    ctx.setSubtitle(`${MODI[m]} · Aufgabe ${a.nr}: ${a.titel}`);
    const head = [modeTabs(a, m), taskPanel(a)];
    if (m === 'bugjagd') return bugjagd(a, head);
    if (m === 'frei') return frei(a, head);
    return vorhersage(a, head);

    // ───────────────────────── Übersicht ─────────────────────────
    function overview() {
      ctx.setSubtitle('Automaten, die nicht nur prüfen, sondern antworten: Zu jedem gelesenen Zeichen gibt es eine Ausgabe.');
      clear(el,
        h('div', { class: 'panel me-intro' },
          h('p', { class: 'lead' }, 'Ein Mealy-Automat liest ein Eingabewort und schreibt dabei ein Ausgabewort. Jede Kante trägt „Eingabezeichen / Ausgabe“ – zum Beispiel „H / B“. Steht dort ε, gibt der Automat bei diesem Übergang nichts aus.'),
          h('p', null, 'Mealy-Automaten haben keine Endzustände: Es geht nicht um „akzeptiert oder abgelehnt“, sondern um die Ausgabe.')),
        h('ol', { class: 'case-grid' }, AUFGABEN.map((x) => {
          const v = x.vorhersage.filter((w) => ctx.progress.isSolved('mealy-v', `${x.id}:${w}`)).length;
          const bug = ctx.progress.isSolved('mealy', x.id);
          return h('li', null, h('a', { class: ['case-card', bug && 'is-solved'], href: ctx.link('mealy', { aufgabe: x.nr }) },
            h('span', { class: 'case-nr' }, `Aufgabe ${x.nr}`),
            h('span', { class: 'case-title' }, x.titel),
            h('span', { class: 'case-state' }, `Vorhersage ${v}/${x.vorhersage.length} · ${bug ? 'Bug repariert' : 'Bug offen'}`)));
        })),
        h('div', { class: 'start-actions' },
          h('a', { class: 'btn btn-primary', href: ctx.link('mealy', { aufgabe: 1, modus: 'frei' }) }, 'Freie Simulation'),
          h('a', { class: 'btn', href: ctx.link('mealy', { aufgabe: 4, modus: 'bugjagd' }) }, 'Bug-Jagd: Frog-Kompressor (Abi 2022)')));
    }

    function modeTabs(x, active) {
      return h('nav', { class: 'mode-tabs', 'aria-label': 'Modus' }, Object.entries(MODI).map(([k, label]) =>
        h('a', { href: ctx.link('mealy', { aufgabe: x.nr, modus: k }), 'aria-current': k === active ? 'page' : null }, label)));
    }

    function taskPanel(x) {
      return h('div', { class: 'panel task-panel' },
        h('p', { class: 'task-text' }, x.kontext),
        h('p', { class: 'sigma' }, `Σ = {${x.M.inputAlphabet.join(', ')}} · Ω = {${x.M.outputAlphabet.join(', ')}} · Startzustand ${x.M.start} · keine Endzustände`));
    }

    function caseNav(x, mod) {
      return h('nav', { class: 'case-nav', 'aria-label': 'Aufgaben' },
        x.nr > 1 ? h('a', { class: 'btn btn-ghost', href: ctx.link('mealy', { aufgabe: x.nr - 1, modus: mod }) }, `‹ Aufgabe ${x.nr - 1}`) : h('span'),
        h('a', { class: 'btn btn-ghost', href: ctx.link('mealy') }, 'Alle Aufgaben'),
        x.nr < AUFGABEN.length ? h('a', { class: 'btn btn-ghost', href: ctx.link('mealy', { aufgabe: x.nr + 1, modus: mod }) }, `Aufgabe ${x.nr + 1} ›`) : h('span'));
    }

    /** Liest eine Ausgabe-Eingabe: Leerzeichen egal, ε/leer = leere Ausgabe. → {ok, text} */
    function parseOutput(raw, M) {
      const t = String(raw ?? '').replace(/\s+/g, '');
      if (isEpsilon(t)) return { ok: true, text: '' };
      const tk = tokenize(t, M.outputAlphabet);
      if (!tk.ok) return { ok: false, message: tk.message.replace('Eingabealphabet Σ', 'Ausgabealphabet Ω') };
      return { ok: true, text: tk.tokens.join('') };
    }

    // ───────────────────────── Was kommt raus? ─────────────────────────
    function vorhersage(x, headEls) {
      const left = h('div', { class: ['panel me-stage', x.M.states.length > 5 && 'is-dense'] });
      const gv = new GraphView(left, { label: `Mealy-Automat: ${x.titel}`, minScale: 0.75 });
      gv.render(x.M);
      const mp = new MealyPlayer(left, { automat: x.M, graph: gv, meanings: x.bedeutung, idleText: 'Nach deiner Antwort kannst du hier den Lauf ansehen.' });
      const right = h('div', { class: 'panel me-quiz' });
      let idx = 0; let allFirst = true; let right1 = 0;

      function item() {
        if (idx >= x.vorhersage.length) return done();
        const w = x.vorhersage[idx];
        const run = runMealy(x.M, w);
        const tapeBox = h('div');
        const tape = new WordTape(tapeBox, { size: 'l', label: 'Eingabewort' });
        tape.set(run.tokens); tape.setHead(-1);
        const input = h('input', { type: 'text', id: 'me-out', class: 'word-input', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', placeholder: 'Ausgabe, z. B. B oder ε' });
        const msg = h('p', { class: 'field-msg', 'aria-live': 'polite' });
        const fb = h('div', { class: 'me-fb', 'aria-live': 'polite' });
        let tries = 0; let solved = false;
        const nextBtn = h('button', { type: 'button', class: 'btn btn-primary', hidden: true, onclick: () => { idx++; item(); } }, idx + 1 < x.vorhersage.length ? 'Nächstes Wort' : 'Auswertung');
        const watch = h('button', { type: 'button', class: 'btn', hidden: true, onclick: () => { mp.load(run.tokens); mp.play(); left.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } }, 'Lauf ansehen');
        const form = h('form', { class: 'word-form', onsubmit: (e) => {
          e.preventDefault();
          if (solved) return;
          const r = parseOutput(input.value, x.M);
          if (!r.ok) { msg.textContent = r.message; input.setAttribute('aria-invalid', 'true'); return; }
          msg.textContent = ''; input.removeAttribute('aria-invalid');
          tries++;
          if (r.text === run.output) {
            solved = true; right1 += tries === 1 ? 1 : 0;
            const { first } = ctx.progress.solve('mealy-v', `${x.id}:${w}`, PUNKTE.wort);
            clear(fb, h('div', { class: 'notice notice-success' }, h('p', null, h('strong', null, 'Richtig! '), `Ausgabe: ${outputLabel(run.output)}`),
              first ? h('p', { class: 'points-note' }, `+${PUNKTE.wort} Punkte`) : null));
            nextBtn.hidden = false; watch.hidden = false;
            input.disabled = true;
            nextBtn.focus({ preventScroll: true });
          } else {
            allFirst = false;
            clear(fb, h('div', { class: 'notice notice-error' },
              h('p', null, h('strong', null, 'Noch nicht. '), `Deine Ausgabe ${outputLabel(r.text)} stimmt nicht.`),
              tries >= 2 ? h('p', null, `Richtig wäre ${outputLabel(run.output)}. Sieh dir den Lauf an – achte auf die Kanten mit ε.`) : h('p', null, 'Verfolge das Wort Kante für Kante und schreib bei jedem Übergang die Ausgabe hinter dem Schrägstrich auf.')));
            if (tries >= 2) { solved = true; nextBtn.hidden = false; watch.hidden = false; input.disabled = true; }
          }
        } },
        h('label', { for: 'me-out' }, 'Welche Ausgabe erzeugt der Automat?'),
        h('div', { class: 'input-row' }, input, h('button', { type: 'submit', class: 'btn btn-primary' }, 'Prüfen')), msg);
        clear(right, h('p', { class: 'case-nr' }, `Wort ${idx + 1} von ${x.vorhersage.length}`), h('p', { class: 'me-q' }, 'Eingabe:'), tapeBox, form, fb,
          h('div', { class: 'start-actions' }, watch, nextBtn));
        input.focus({ preventScroll: true });
      }

      function done() {
        if (allFirst) ctx.progress.award('mealy-hellseher');
        clear(right, h('h2', null, 'Geschafft!'),
          h('p', { class: 'result-big' }, h('span', { class: 'num' }, String(right1)), ` von ${x.vorhersage.length} im ersten Versuch`),
          h('div', { class: 'start-actions' },
            h('a', { class: 'btn btn-primary', href: ctx.link('mealy', { aufgabe: x.nr, modus: 'bugjagd' }) }, 'Weiter zur Bug-Jagd'),
            AUFGABEN[x.nr] ? h('a', { class: 'btn', href: ctx.link('mealy', { aufgabe: x.nr + 1 }) }, `Aufgabe ${x.nr + 1}`) : null));
      }

      clear(el, ...headEls, h('div', { class: 'two-col' }, left, right), caseNav(x, 'vorhersage'));
      item();
      return () => mp.destroy();
    }

    // ───────────────────────── Bug-Jagd ─────────────────────────
    function bugjagd(x, headEls) {
      const F = fehlerVariante(x);
      const work = clone(F);
      let found = ctx.progress.isSolved('mealy-b', x.id);
      let renderTimer = null;

      const left = h('div', { class: ['panel me-stage', x.M.states.length > 5 && 'is-dense'] });
      const gv = new GraphView(left, { label: `Fehlerhafter Mealy-Automat: ${x.titel}`, minScale: 0.75 });
      const mp = new MealyPlayer(left, { graph: gv, meanings: x.bedeutung, idleText: 'Teste in Schritt 1 ein Eingabewort – hier siehst du dann den Lauf.' });
      mp.M = work;
      gv.render(work);

      const okExamples = x.beispiele.filter(([ein]) => runMealy(F, ein).output === runMealy(x.M, ein).output).slice(0, 3);

      // Schritt 1: Fehler finden
      const input = h('input', { type: 'text', id: 'me-test', class: 'word-input', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', placeholder: `z. B. ${x.vorhersage[0]}` });
      const msg = h('p', { class: 'field-msg', 'aria-live': 'polite' });
      const judge = h('div', { class: 'me-judge', 'aria-live': 'polite' });
      const test = (w) => {
        const tk = tokenize(w, work.inputAlphabet);
        if (!tk.ok) { msg.textContent = tk.message; return; }
        msg.textContent = '';
        mp.M = work; mp.load(tk.tokens); mp.toEnd();
        const out = runMealy(work, tk.tokens).output;
        const ref = runMealy(x.M, tk.tokens).output;
        const say = (ok, text) => clear(judge, h('div', { class: ['notice', ok ? 'notice-success' : 'notice-error'] }, h('p', null, text)));
        clear(judge, h('p', null, `Für ${shownWord(tk.tokens, work.inputAlphabet)} gibt der Automat `, h('strong', { class: 'me-out' }, outputLabel(out)), ' aus. Ist das richtig?'),
          h('div', { class: 'start-actions' },
            h('button', { type: 'button', class: 'btn btn-danger-ghost', onclick: () => {
              if (out !== ref) {
                found = true;
                const { first } = ctx.progress.solve('mealy-b', x.id, PUNKTE.gefunden);
                say(true, `Bug gefunden! Richtig wäre ${outputLabel(ref)}.${first ? ` +${PUNKTE.gefunden} Punkte.` : ''} Jetzt die Kantenbeschriftung reparieren (Schritt 2).`);
              } else say(false, `Die Ausgabe ${outputLabel(out)} ist korrekt. Such weiter!`);
            } }, 'Falsch – Bug!'),
            h('button', { type: 'button', class: 'btn', onclick: () => {
              if (out === ref) say(true, 'Stimmt, diese Ausgabe ist richtig. Probier eine andere Eingabe.');
              else say(false, `Schau genauer hin: Richtig wäre ${outputLabel(ref)}. Das ist ein Bug!`);
            } }, 'Stimmt')));
      };
      const findForm = h('form', { class: 'word-form', onsubmit: (e) => { e.preventDefault(); test(input.value); } },
        h('label', { for: 'me-test' }, 'Eingabewort testen'),
        h('div', { class: 'input-row' }, input, h('button', { type: 'submit', class: 'btn btn-primary' }, 'Ausprobieren')), msg,
        h('div', { class: 'chip-row' }, x.vorhersage.map((w) => h('button', { type: 'button', class: 'chip', onclick: () => { input.value = w; test(w); } }, w))));

      // Schritt 2: Reparieren
      const rows = [];
      for (const s of work.states) for (const c of work.inputAlphabet) {
        const t = work.delta[s][c];
        if (!t) continue;
        const field = h('input', { type: 'text', class: 'me-edit', value: outputLabel(t.out), autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', 'aria-label': `Ausgabe bei ${s} mit ${c}` });
        const orig = t.out;
        field.addEventListener('input', () => {
          const r = parseOutput(field.value, work);
          field.toggleAttribute('aria-invalid', !r.ok);
          field.classList.toggle('is-changed', r.ok && r.text !== orig);
          if (!r.ok) { status.textContent = r.message; return; }
          status.textContent = '';
          work.delta[s][c].out = r.text;
          clearTimeout(renderTimer);
          renderTimer = setTimeout(() => { gv.render(work).then(() => { if (mp.word != null) { mp.M = work; mp.load(mp.word); mp.toEnd(); } }); }, 250);
        });
        rows.push(h('tr', null, h('td', { class: 'mono' }, s), h('td', { class: 'mono' }, c), h('td', { class: 'mono' }, t.to), h('td', null, field)));
      }
      const status = h('p', { class: 'field-msg', 'aria-live': 'polite' });
      const result = h('div', { class: 'me-result', 'aria-live': 'polite' });
      let checks = 0;
      const checkBtn = h('button', { type: 'button', class: 'btn btn-primary', onclick: () => {
        if (el.querySelector('.me-edit[aria-invalid]')) { status.textContent = 'Korrigiere zuerst die rot markierten Felder.'; return; }
        checks++;
        const d = mealyEquivalent(work, x.M);
        if (d.equivalent) {
          const { first } = ctx.progress.solve('mealy', x.id, PUNKTE.repariert);
          ctx.progress.award('mealy-bugjaeger');
          if (AUFGABEN.every((y) => ctx.progress.isSolved('mealy', y.id))) ctx.progress.award('mealy-alle-bugs');
          if (first) ctx.toast(`+${PUNKTE.repariert} Punkte`, { type: 'success' });
          const next = AUFGABEN[x.nr];
          clear(result, h('div', { class: 'notice notice-success' },
            h('p', null, h('strong', null, 'Repariert! '), `Dein Automat erzeugt jetzt für jede Eingabe die richtige Ausgabe${checks === 1 ? ' – im ersten Versuch' : ''}.`),
            found ? null : h('p', { class: 'muted' }, 'Tipp für die Klausur: Gib immer auch eine Eingabe an, an der man den Fehler sieht.')),
          h('div', { class: 'start-actions' }, next ? h('a', { class: 'btn btn-primary', href: ctx.link('mealy', { aufgabe: next.nr, modus: 'bugjagd' }) }, `Nächste Bug-Jagd: ${next.titel}`) : null));
        } else {
          clear(result, h('div', { class: 'notice notice-error' },
            h('p', null, h('strong', null, 'Noch nicht. '), `Für die Eingabe ${shownWord(d.word, work.inputAlphabet)} gibt dein Automat ${outputLabel(d.outA)} aus, richtig wäre ${outputLabel(d.outB)}.`),
            h('button', { type: 'button', class: 'btn btn-small', onclick: () => { input.value = wordToString(d.word, work.inputAlphabet); test(d.word); left.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } }, 'Lauf ansehen')));
        }
      } }, 'Prüfen');

      const right = h('div', { class: 'stack-col' },
        h('div', { class: 'panel' },
          h('h2', { class: 'me-h2' }, 'Auftrag'),
          h('p', null, x.fehlerText),
          okExamples.length ? h('div', null, h('p', { class: 'muted' }, 'So soll es sein (diese Beispiele klappen schon):'),
            h('ul', { class: 'me-examples' }, okExamples.map(([ein, aus]) => h('li', null, h('code', { class: 'word' }, ein), ' → ', h('code', { class: 'word' }, aus))))) : null),
        h('div', { class: 'panel' }, h('h2', { class: 'me-h2' }, '1. Finde eine Eingabe mit falscher Ausgabe'), findForm, judge),
        h('div', { class: 'panel' }, h('h2', { class: 'me-h2' }, '2. Repariere die Kantenbeschriftungen'),
          h('p', { class: 'muted' }, 'Ändere die Ausgaben (hinter dem Schrägstrich). ε oder leer = keine Ausgabe. Die Folgezustände sind richtig.'),
          h('div', { class: 'table-scroll' }, h('table', { class: 'mini-table me-table' },
            h('thead', null, h('tr', null, h('th', null, 'Zustand'), h('th', null, 'Eingabe'), h('th', null, 'Folgezustand'), h('th', null, 'Ausgabe'))),
            h('tbody', null, rows))),
          status,
          h('div', { class: 'check-row' }, checkBtn,
            h('button', { type: 'button', class: 'btn btn-ghost btn-small', onclick: () => ctx.navigate('mealy', { aufgabe: x.nr, modus: 'bugjagd' }) }, 'Zurücksetzen')),
          result));

      clear(el, ...headEls, h('div', { class: 'two-col me-bug' }, h('div', { class: 'me-sticky' }, left), right), caseNav(x, 'bugjagd'));
      return () => { clearTimeout(renderTimer); mp.destroy(); };
    }

    // ───────────────────────── Freie Simulation ─────────────────────────
    function frei(x, headEls) {
      const left = h('div', { class: ['panel me-stage', x.M.states.length > 5 && 'is-dense'] });
      const mp = new MealyPlayer(left, { automat: x.M, meanings: x.bedeutung, graph: new GraphView(left, { label: `Mealy-Automat: ${x.titel}`, minScale: 0.75 }) });
      mp.graph.render(x.M);
      const select = h('select', { id: 'me-select', onchange: (e) => ctx.navigate('mealy', { aufgabe: e.target.value, modus: 'frei' }) },
        AUFGABEN.map((y) => h('option', { value: y.nr, selected: y.nr === x.nr }, `${y.nr}: ${y.titel}`)));
      const input = h('input', { type: 'text', id: 'me-word', class: 'word-input', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', placeholder: `z. B. ${x.beispiele[0][0]}` });
      const msg = h('p', { class: 'field-msg', 'aria-live': 'polite' });
      const sim = (w) => {
        const tk = tokenize(w, x.M.inputAlphabet);
        if (!tk.ok) { msg.textContent = tk.message; input.setAttribute('aria-invalid', 'true'); return; }
        msg.textContent = ''; input.removeAttribute('aria-invalid');
        mp.load(tk.tokens); mp.play();
      };
      const right = h('div', { class: 'stack-col' },
        h('div', { class: 'panel' },
          h('label', { for: 'me-select' }, 'Automat'), h('div', { class: 'input-row' }, select),
          h('form', { class: 'word-form me-sim-form', onsubmit: (e) => { e.preventDefault(); sim(input.value); } },
            h('label', { for: 'me-word' }, 'Eingabewort'),
            h('div', { class: 'input-row' }, input, h('button', { type: 'submit', class: 'btn btn-primary' }, 'Simulieren')), msg,
            h('div', { class: 'chip-row' }, x.beispiele.map(([ein]) => h('button', { type: 'button', class: 'chip', onclick: () => { input.value = ein; sim(ein); } }, ein || 'ε'))))),
        h('div', { class: 'panel' },
          h('h2', { class: 'me-h2' }, 'Beispiele'),
          h('table', { class: 'mini-table' }, h('thead', null, h('tr', null, h('th', null, 'Eingabe'), h('th', null, 'Ausgabe'))),
            h('tbody', null, x.beispiele.map(([ein, aus]) => h('tr', null, h('td', { class: 'mono' }, ein || 'ε'), h('td', { class: 'mono' }, aus))))),
          x.bedeutung ? h('dl', { class: 'meaning-list' }, Object.entries(x.bedeutung).flatMap(([s, b]) => [h('dt', null, s), h('dd', null, b)])) : null));
      clear(el, ...headEls, h('div', { class: 'two-col' }, left, right), caseNav(x, 'frei'));
      mp.ready.then(() => { input.value = x.beispiele[0][0]; sim(x.beispiele[0][0]); });
      return () => mp.destroy();
    }
  },
};
