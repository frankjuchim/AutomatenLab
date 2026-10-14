// Überliste den Automaten (#/ueberliste): Ein DEA mit k Zuständen behauptet, eine nicht-reguläre Sprache zu erkennen.
// Finde ein Wort, bei dem er sich irrt – und lerne daraus das Schubfachargument (DS07).
// Deep-Links: #/ueberliste?stufe=1…5, #/ueberliste?stufe=bonus (Multiple Choice „Warum hilft k+1 nicht?“),
//             #/ueberliste?demo=1 (Demo-Stufe im Gastmodus)
// Die „Wahrheit“ (gehört das Wort zur Sprache?), die Tipps und die Bonus-Antworten kennt nur die Quelle (Server bzw.
// Demo); Punkte vergibt nur der Server. Testen kostet nichts, Tipps kosten Punkte (Vertrag §9).

import { h, clear, quote } from '../core/dom.js';
import { dfa, runDFA } from '../engine/dfa.js';
import { tokenize, wordToString } from '../engine/tokenize.js';
import { GraphView } from '../components/graph-view.js';
import { WordTape } from '../components/word-tape.js';

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
    const q = ctx.quelle; // Server (angemeldet) oder Demo (Gastmodus)
    const p = ctx.params.get('stufe');
    let aktiv = true;
    let aufraeumen = null;
    let LISTE = [];
    const STUFEN = () => LISTE.filter((x) => x.art !== 'bonus');
    const fehler = (e) => { if (aktiv) clear(el, h('p', { class: 'notice notice-error' }, e.message)); };
    clear(el, h('p', { class: 'muted' }, 'Lade …'));
    (async () => {
      LISTE = await q.liste('ueberliste');
      if (!aktiv) return;
      const bonusEintrag = LISTE.find((x) => x.art === 'bonus');
      if (!q.demo && (p === 'bonus' || p === '6') && bonusEintrag) {
        const d = await q.aufgabe(bonusEintrag.id);
        if (aktiv) bonus({ ...d.aufgabe, aufgabeId: bonusEintrag.id, zustand: d.zustand, punkte: bonusEintrag.punkte });
        return;
      }
      const n = Number(p);
      const e = q.demo ? LISTE[0] : STUFEN().find((x) => x.nr === n);
      if (!e) { showList(); return; }
      const d = await q.aufgabe(e.id);
      if (!aktiv) return;
      aufraeumen = play({ ...d.aufgabe, aufgabeId: e.id, nr: e.nr ?? 0, punkte: e.punkte ?? 0, A: dfa(d.aufgabe.automat), zustand: d.zustand, loesung: d.loesung ?? null });
    })().catch(fehler);
    return () => { aktiv = false; aufraeumen?.(); };

    function showList() {
      ctx.setSubtitle('Ein Automat mit endlich vielen Zuständen behauptet Unmögliches. Finde das Wort, bei dem er sich verrät.');
      clear(el,
        h('p', { class: 'lead' }, 'Jeder Automat hier zählt richtig – bis zu einer Grenze. Dein Ziel: ein Wort, das er akzeptiert, obwohl es nicht zur Sprache gehört, oder ablehnt, obwohl es dazugehört.'),
        h('ol', { class: 'challenge-grid' }, LISTE.map((x) => {
          const solved = ctx.progress.isSolved('ueberliste', x.schluessel);
          const bonusKarte = x.art === 'bonus';
          return h('li', null, h('a', { class: ['challenge-card', solved && 'is-solved', `stufe-${x.stufe}`], href: ctx.link('ueberliste', { stufe: bonusKarte ? 'bonus' : x.nr }) },
            h('span', { class: 'case-nr' }, bonusKarte ? 'Bonus' : `Stufe ${x.nr}`),
            h('span', { class: 'case-title' }, bonusKarte ? 'Warum hilft ein Zustand mehr nicht?' : x.titel),
            h('span', { class: 'case-state' }, solved ? (bonusKarte ? 'gelöst' : 'überlistet') : `${x.punkte} Punkte`)));
        })));
    }

    function play(s) {
      ctx.setSubtitle(q.demo ? `Demo: ${s.titel} (ohne Punkte)` : `Stufe ${s.nr}: ${s.titel}`);
      const A = s.A;
      const k = A.states.length;
      let zustand = s.zustand;
      const st = { tries: 0, won: zustand && zustand.status !== 'offen', prefixes: false, revealed: false, busy: false };
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

      async function test(word) {
        const tk = tokenize(word, A.alphabet);
        if (!tk.ok) { msg.textContent = tk.message; input.setAttribute('aria-invalid', 'true'); return; }
        input.removeAttribute('aria-invalid'); msg.textContent = '';
        if (st.busy) return;
        st.busy = true;
        let r;
        try { r = await q.pruefen(s.aufgabeId, { wort: wordToString(tk.tokens, A.alphabet).replace(/^ε$/, '') }); } catch (e) { st.busy = false; msg.textContent = e.message; return; }
        st.busy = false;
        zustand = r.zustand ?? zustand;
        const run = runDFA(A, tk.tokens);
        lastRun = run;
        const truth = r.rueckmeldung.gehoertDazu;
        const wrong = r.rueckmeldung.ueberlistet;
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
        if (wrong && (!st.won || r.geloest || r.nachgeloest)) win(tk.tokens, run, r);
        else if (wrong) win(tk.tokens, run, r, true);
      }

      // ── Tipps (von der Quelle, jeder Tipp kostet Punkte) ──
      const tippList = h('ol', { class: 'ul-tipps' });
      const tippBtn = h('button', { type: 'button', class: 'btn btn-small', onclick: async () => {
        if ((zustand?.tippsGenutzt ?? 0) >= s.tippsAnzahl && zustand?.status === 'offen') return;
        try { zustand = (await q.tipp(s.aufgabeId)).zustand; } catch (e) { ctx.toast(e.message, { type: 'error' }); return; }
        zeigeTipps();
      } }, 'Tipp anzeigen');
      const tippHinweis = h('p', { class: 'muted' });
      function zeigeTipps() {
        clear(tippList, (zustand?.tipps ?? []).map((t) => h('li', null, t)));
        const alle = (zustand?.tipps ?? []).length >= s.tippsAnzahl;
        tippBtn.disabled = alle;
        tippBtn.textContent = alle ? 'Keine weiteren Tipps' : (zustand?.tipps ?? []).length ? 'Nächster Tipp' : 'Tipp anzeigen';
        tippHinweis.textContent = q.demo || !zustand ? 'Jeder Tipp hilft – aber die Idee dahinter ist das, was im Abitur zählt.'
          : zustand.status === 'offen' ? `Jeder Tipp kostet Punkte – jetzt noch ${zustand.moeglich} von ${zustand.maxPunkte} möglich. Testen kostet nichts.`
            : zustand.status === 'geloest' ? 'Diese Stufe hast du schon überlistet – zum Üben kannst du weiter testen.' : 'Punkte gibt es hier nicht mehr.';
      }

      const result = h('div', { class: 'ul-result' });

      function win(tokens, run, r, schonGeloest = false) {
        st.won = true;
        if (r.punkteErhalten) ctx.toast(`+${r.punkteErhalten} Punkte`, { type: 'success' });
        zeigeTipps();
        if (schonGeloest && result.childElementCount) return;
        const sf = schubfach(A, s.praefix);
        const pre = (m) => (m === 0 ? 'ε' : s.praefix.repeat(m));
        const sup = (m) => `${s.praefix}${toSup(m)}`;
        const shown = quote(wordToString(tokens, A.alphabet));
        const what = run.accepted ? `akzeptiert ${shown}, obwohl das Wort nicht zur Sprache gehört` : `lehnt ${shown} ab, obwohl das Wort zur Sprache gehört`;
        const next = q.demo ? null : STUFEN().find((x) => x.nr === s.nr + 1);
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
            q.demo ? h('a', { class: 'btn btn-primary', href: ctx.link('gast') }, 'Weitere Demo-Aufgaben')
              : next ? h('a', { class: 'btn btn-primary', href: ctx.link('ueberliste', { stufe: next.nr }) }, `Weiter: Stufe ${next.nr}`) : h('a', { class: 'btn btn-primary', href: ctx.link('ueberliste', { stufe: 'bonus' }) }, 'Zum Bonus'),
            q.demo ? null : h('a', { class: 'btn', href: ctx.link('ueberliste') }, 'Alle Stufen'))));
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
            h('h3', null, 'Tipps'), tippHinweis,
            tippList, h('p', null, tippBtn),
            h('h3', { class: 'log-title' }, 'Deine Testwörter'), log)),
        result,
        q.demo ? h('nav', { class: 'case-nav', 'aria-label': 'Stufen' }, h('a', { class: 'btn btn-ghost', href: ctx.link('gast') }, 'Weitere Demo-Aufgaben')) : h('nav', { class: 'case-nav', 'aria-label': 'Stufen' },
          s.nr > 1 ? h('a', { class: 'btn btn-ghost', href: ctx.link('ueberliste', { stufe: s.nr - 1 }) }, `‹ Stufe ${s.nr - 1}`) : h('span'),
          h('a', { class: 'btn btn-ghost', href: ctx.link('ueberliste') }, 'Alle Stufen'),
          s.nr < STUFEN().length ? h('a', { class: 'btn btn-ghost', href: ctx.link('ueberliste', { stufe: s.nr + 1 }) }, `Stufe ${s.nr + 1} ›`) : h('a', { class: 'btn btn-ghost', href: ctx.link('ueberliste', { stufe: 'bonus' }) }, 'Bonus ›')));
      zeigeTipps();
      if (q.demo) claim.prepend(h('p', { class: 'notice gast-hinweis' }, h('strong', null, 'Demo. '), 'Ein eigener Automat zum Ausprobieren – ohne Punkte. Die fünf Stufen und der Bonus gibt es nach der Anmeldung.'));
      input.focus({ preventScroll: true });
      return () => gv?.destroy();
    }

    function bonus(b) {
      ctx.setSubtitle('Bonus: Warum hilft ein Zustand mehr nicht?');
      const qs = b.fragen;
      let idx = 0; let zustand = b.zustand;
      const box = h('div', { class: 'panel narrow-panel' });
      const render = () => {
        if (idx >= qs.length) {
          clear(box, h('h2', null, 'Bonus geschafft'),
            h('p', null, 'Das Argument funktioniert für jede Zustandsanzahl k – deshalb gibt es überhaupt keinen endlichen Automaten für diese Sprachen.'),
            zustand && zustand.status !== 'offen' ? h('p', { class: 'muted' }, `Gewertet wurde dein erster Durchgang: ${zustand.punkte} von ${b.punkte} Punkten.`) : null,
            h('div', { class: 'start-actions' }, h('a', { class: 'btn btn-primary', href: ctx.link('ueberliste') }, 'Zurück zur Übersicht')));
          return;
        }
        const fr = qs[idx];
        const verdict = h('div', { 'aria-live': 'polite' });
        let fertig = false;
        const buttons = fr.optionen.map((o, i) => h('button', { type: 'button', class: 'option', 'data-id': o.id, onclick: async () => {
          if (fertig) return;
          fertig = true;
          let r;
          try { r = await q.pruefen(b.aufgabeId, { frage: idx, wahl: o.id }); } catch (e) { fertig = false; clear(verdict, h('p', { class: 'notice notice-error' }, e.message)); return; }
          zustand = r.zustand ?? zustand;
          if (r.punkteErhalten) ctx.toast(`+${r.punkteErhalten} Punkte`, { type: 'success' });
          const rm = r.rueckmeldung;
          buttons.forEach((x) => { x.disabled = true; if (x.dataset.id === rm.richtig) x.classList.add('is-correct'); else if (x.dataset.id === o.id) x.classList.add('is-wrong'); });
          clear(verdict, h('div', { class: ['notice', rm.wert === 1 ? 'notice-success' : 'notice-error'] },
            h('p', null, h('strong', null, rm.wert === 1 ? 'Richtig. ' : 'Das passt nicht. '), rm.wert === 1 ? '' : `Richtig ist: ${rm.richtigText}`),
            h('div', { class: 'start-actions' }, h('button', { type: 'button', class: 'btn btn-primary', onclick: () => { idx++; render(); } }, idx + 1 < qs.length ? 'Nächste Frage' : 'Auswertung'))));
        } }, h('span', { class: 'option-key', 'aria-hidden': 'true' }, 'ABCD'[i]), h('span', { class: 'option-text' }, o.text)));
        clear(box, h('p', { class: 'muted' }, `Frage ${idx + 1} von ${qs.length}`), h('h2', { class: 'question' }, fr.frage),
          h('ul', { class: 'option-list' }, buttons.map((x) => h('li', null, x))), verdict,
          idx === 0 && zustand?.status === 'offen' ? h('p', { class: 'muted' }, `Gewertet wird dein erster Durchgang (bis zu ${b.punkte} Punkte).`) : null);
      };
      render();
      clear(el, box, h('nav', { class: 'case-nav' }, h('a', { class: 'btn btn-ghost', href: ctx.link('ueberliste') }, '‹ Alle Stufen')));
      return null;
    }
  },
};

const SUP = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹', i: 'ⁱ', j: 'ʲ', n: 'ⁿ', k: 'ᵏ', '+': '⁺' };
export const toSup = (x) => String(x).split('').map((c) => SUP[c] ?? c).join('');
