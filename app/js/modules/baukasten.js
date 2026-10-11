// Automaten-Baukasten (#/baukasten): DEA in der Übergangstabelle bauen, live als Graph sehen,
// Wörter testen und gegen die Zielsprache prüfen (kürzestes Gegenbeispiel).
// Deep-Links: #/baukasten?level=n (Challenge Nr. n, 1 …), #/baukasten?aufgabe=<id>,
//             #/baukasten?stufe=1|2|3 (Liste gefiltert), #/baukasten?modus=frei (Sandbox mit Export)

import { h, clear, quote } from '../core/dom.js';
import { BAUKASTEN_CHALLENGES, STUFEN } from '../data/baukasten.js';
import { normalizeDFA, equivalent } from '../engine/dfa.js';
import { tokenize, wordToString } from '../engine/tokenize.js';
import { GraphView } from '../components/graph-view.js';
import { RunPlayer } from '../components/run-player.js';
import { DfaEditor } from '../components/dfa-editor.js';
import { toGraph, exportDot } from '../components/graph-model.js';
import { openDialog } from '../components/dialog.js';

const CHALLENGES = BAUKASTEN_CHALLENGES.map((c, i) => ({ ...c, nr: i + 1, ref: normalizeDFA(c.referenz) }));
const PUNKTE = { 1: 20, 2: 30, 3: 40 };

export default {
  title: 'Automaten-Baukasten',
  mount(el, ctx) {
    const p = ctx.params;
    if (p.get('modus') === 'frei') return workbench(null);
    const byLevel = Number(p.get('level'));
    const ch = (byLevel >= 1 && byLevel <= CHALLENGES.length) ? CHALLENGES[byLevel - 1] : CHALLENGES.find((c) => c.id === p.get('aufgabe'));
    if (ch) return workbench(ch);
    showList(Number(p.get('stufe')) || null);
    return null;

    // ───────────────────────── Liste ─────────────────────────
    function showList(onlyStufe) {
      ctx.setSubtitle('Entwickle DEAs für vorgegebene Sprachen. Beim Prüfen bekommst du das kürzeste Gegenbeispiel.');
      const sections = [1, 2, 3].filter((s) => !onlyStufe || s === onlyStufe).map((s) => {
        const list = CHALLENGES.filter((c) => c.stufe === s);
        const done = list.filter((c) => ctx.progress.isSolved('baukasten', c.id)).length;
        return h('section', { class: 'stufe-section' },
          h('div', { class: 'stufe-head' }, h('h2', null, `Stufe ${s}: ${STUFEN[s].name}`), h('span', { class: 'muted' }, `${done} von ${list.length} gelöst`)),
          h('p', { class: 'muted' }, STUFEN[s].text),
          h('ol', { class: 'challenge-grid' }, list.map((c) => {
            const solved = ctx.progress.isSolved('baukasten', c.id);
            return h('li', null, h('a', { class: ['challenge-card', solved && 'is-solved', `stufe-${s}`], href: ctx.link('baukasten', { level: c.nr }) },
              h('span', { class: 'case-nr' }, `Challenge ${c.nr}`),
              h('span', { class: 'case-title' }, c.titel),
              h('span', { class: 'case-state' }, solved ? 'gelöst' : `${PUNKTE[s]} Punkte`)));
          })));
      });
      clear(el,
        onlyStufe ? h('p', null, h('a', { href: ctx.link('baukasten') }, 'Alle Stufen anzeigen')) : null,
        ...sections,
        h('section', { class: 'stufe-section sandbox-teaser panel' },
          h('h2', null, 'Freier Modus'),
          h('p', null, 'Eigenes Alphabet, eigener Automat – zum Ausprobieren, für Stationsarbeit und Bug-Bounty. Mit Export als JSON und DOT.'),
          h('a', { class: 'btn btn-primary', href: ctx.link('baukasten', { modus: 'frei' }) }, 'Freien Modus öffnen')));
    }

    // ───────────────────────── Werkbank ─────────────────────────
    function workbench(c) {
      const draftKey = `baukasten:${c ? c.id : 'frei'}`;
      ctx.setSubtitle(c ? `Challenge ${c.nr}: ${c.titel}` : 'Freier Modus');
      let attempts = 0;
      let lastWord = null;
      let saveTimer = null;
      let renderTimer = null;

      const graphPanel = h('div', { class: 'bench-graph panel' });
      const gv = new GraphView(graphPanel, { label: 'Dein Automat' });
      const testBox = h('div', { class: 'bench-test' });
      const rp = new RunPlayer(testBox, { graph: gv });

      const editorPanel = h('div', { class: 'bench-editor panel' });
      let draft = null;
      try { draft = ctx.progress.getDraft(draftKey); if (draft) normalizeDFA(draft); } catch { draft = null; }
      const alphabet = c ? c.ref.alphabet : (draft?.alphabet ?? ['a', 'b']);

      // Aufgabe / Alphabet
      let taskPanel = null;
      if (c) {
        taskPanel = h('div', { class: 'bench-task panel' },
          h('p', { class: 'task-text' }, c.aufgabe),
          h('div', { class: 'task-side' },
          h('p', { class: 'sigma' }, `Σ = {${c.ref.alphabet.join(', ')}}`),
          c.beispiele ? h('div', { class: 'examples' },
            h('p', null, h('span', { class: 'ex-label ex-yes' }, 'gehört dazu'), ' ', c.beispiele.ja.map((w) => h('code', { class: 'word' }, w))),
            h('p', null, h('span', { class: 'ex-label ex-no' }, 'gehört nicht dazu'), ' ', c.beispiele.nein.map((w) => h('code', { class: 'word' }, w)))) : null,
          c.tipp ? h('details', { class: 'tipp' }, h('summary', null, 'Tipp anzeigen'), h('p', null, c.tipp)) : null));
      } else {
        const sigmaInput = h('input', { type: 'text', id: 'sigma-input', class: 'word-input', value: alphabet.join(', '), autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false' });
        const sigmaMsg = h('p', { class: 'field-msg', 'aria-live': 'polite' });
        editorPanel.append(h('form', { class: 'sigma-form', onsubmit: (e) => {
          e.preventDefault();
          const syms = [...new Set(sigmaInput.value.split(/[,\s]+/).map((s) => s.trim()).filter(Boolean))];
          if (!syms.length) { sigmaMsg.textContent = 'Gib mindestens ein Zeichen an.'; return; }
          if (syms.some((s) => /^(ε|eps)$/i.test(s))) { sigmaMsg.textContent = 'ε ist kein Zeichen des Eingabealphabets.'; return; }
          if (syms.length > 8) { sigmaMsg.textContent = 'Höchstens 8 Zeichen, sonst wird die Tabelle unübersichtlich.'; return; }
          sigmaMsg.textContent = `Σ = {${syms.join(', ')}} übernommen.`;
          editor.setAlphabet(syms);
        } },
        h('label', { for: 'sigma-input' }, 'Eingabealphabet Σ (durch Kommas getrennt, mehrstellige Zeichen erlaubt)'),
        h('div', { class: 'input-row' }, sigmaInput, h('button', { type: 'submit', class: 'btn' }, 'Übernehmen')), sigmaMsg));
      }

      const editor = new DfaEditor(editorPanel, { alphabet, value: draft && (!c || sameAlphabet(draft.alphabet, alphabet)) ? draft : null, onChange: () => changed() });

      // Testen
      const wordInput = h('input', { type: 'text', id: 'bench-word', class: 'word-input', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', placeholder: 'Wort, z. B. abba' });
      const wordMsg = h('p', { class: 'field-msg', 'aria-live': 'polite' });
      const runWord = (w) => {
        const A = editor.toDFA();
        const tk = tokenize(w, A.alphabet);
        if (!tk.ok) { wordMsg.textContent = tk.message; return; }
        wordMsg.textContent = '';
        lastWord = tk.tokens;
        rp.setAutomat(A).then(() => { rp.load(tk.tokens); rp.play(); });
      };
      const testForm = h('form', { class: 'word-form', onsubmit: (e) => { e.preventDefault(); runWord(wordInput.value); } },
        h('label', { for: 'bench-word' }, 'Testen: Wort eingeben'),
        h('div', { class: 'input-row' }, wordInput, h('button', { type: 'submit', class: 'btn' }, 'Simulieren')), wordMsg);

      // Prüfen
      const checkResult = h('div', { class: 'check-result', 'aria-live': 'polite' });
      const solutionSlot = h('div');
      const checkBtn = c ? h('button', { type: 'button', class: 'btn btn-primary btn-large', onclick: () => check() }, 'Prüfen') : null;

      function check() {
        let A;
        try { A = editor.toDFA(); } catch (e) { clear(checkResult, h('p', { class: 'notice notice-error' }, e.message)); return; }
        const miss = editor.missing();
        if (miss.length && !A.implicitError) {
          clear(checkResult, h('div', { class: 'notice notice-warn' },
            h('p', null, h('strong', null, 'Dein Automat ist noch nicht vollständig. '),
              `Es fehlen ${miss.length === 1 ? 'ein Übergang' : `${miss.length} Übergänge`}, z. B. von ${miss[0][0]} mit „${miss[0][1]}“.`),
            h('p', null, 'Ergänze die Übergänge oder setze den Haken „Alle nicht eingezeichneten Übergänge führen in einen Fehlerzustand“.')));
          return;
        }
        attempts++;
        const res = equivalent(A, c.ref);
        if (res.equivalent) {
          const { first } = ctx.progress.solve('baukasten', c.id, PUNKTE[c.stufe]);
          ctx.progress.award('baukasten-erster');
          for (const s of [1, 2, 3]) if (CHALLENGES.filter((x) => x.stufe === s).every((x) => ctx.progress.isSolved('baukasten', x.id))) ctx.progress.award(`baukasten-stufe-${s}`);
          if (c.stufe === 3 && attempts === 1) ctx.progress.award('baukasten-volltreffer');
          if (first) ctx.toast(`+${PUNKTE[c.stufe]} Punkte`, { type: 'success' });
          const next = CHALLENGES[c.nr];
          clear(checkResult, h('div', { class: 'notice notice-success' },
            h('p', null, h('strong', null, 'Richtig! '), `Dein Automat erkennt genau die gesuchte Sprache${attempts === 1 ? ' – im ersten Versuch' : ''}.`),
            h('p', null, `Er hat ${A.states.length} ${A.states.length === 1 ? 'Zustand' : 'Zustände'}${A.implicitError && miss.length ? ' plus den nicht gezeichneten Fehlerzustand' : ''}. Kannst du begründen, was sich jeder Zustand merkt?`)),
          h('div', { class: 'start-actions' },
            next ? h('a', { class: 'btn btn-primary', href: ctx.link('baukasten', { level: next.nr }) }, `Weiter zu Challenge ${next.nr}`) : null,
            h('button', { type: 'button', class: 'btn', onclick: () => showSolution() }, 'Musterlösung vergleichen'),
            h('a', { class: 'btn btn-ghost', href: ctx.link('baukasten') }, 'Alle Challenges')));
        } else {
          const w = res.counterexample;
          const shown = quote(wordToString(w, A.alphabet));
          const wortText = w.length ? shown : 'das leere Wort ε';
          const msg = res.acceptedByA
            ? `Dein Automat akzeptiert ${wortText} – das gehört nicht zur Sprache.`
            : `Dein Automat lehnt ${wortText} ab – das gehört aber zur Sprache.`;
          clear(checkResult, h('div', { class: 'notice notice-error' },
            h('p', null, h('strong', null, 'Noch nicht. '), msg),
            h('p', { class: 'muted' }, `Das ist ein kürzestes Gegenbeispiel. Versuch ${attempts}.`),
            h('div', { class: 'start-actions' },
              h('button', { type: 'button', class: 'btn btn-small', onclick: () => { wordInput.value = wordToString(w, A.alphabet).replace(/^ε$/, ''); runWord(w); graphPanel.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } }, 'Lauf ansehen'),
              attempts >= 3 ? h('button', { type: 'button', class: 'btn btn-small btn-ghost', onclick: () => showSolution() }, 'Musterlösung zeigen') : null)));
        }
      }

      function showSolution() {
        const body = h('div', null, h('p', null, 'Eine mögliche Lösung. Es gibt viele richtige Automaten – geprüft wird nur, ob die Sprache stimmt.'));
        openDialog({ title: `Musterlösung: ${c.titel}`, body });
        new GraphView(body).render(c.ref);
      }

      // Export / Import (freier Modus)
      const exportBox = c ? null : buildExport();
      function buildExport() {
        const jsonOut = h('textarea', { class: 'code-out', readonly: true, rows: 8, 'aria-label': 'Export als JSON' });
        const dotOut = h('textarea', { class: 'code-out', readonly: true, rows: 8, 'aria-label': 'Export als DOT' });
        const importIn = h('textarea', { class: 'code-out', rows: 5, 'aria-label': 'JSON zum Importieren', placeholder: '{"alphabet":["a","b"], …}' });
        const importMsg = h('p', { class: 'field-msg', 'aria-live': 'polite' });
        const copy = async (ta, label) => {
          try { await navigator.clipboard.writeText(ta.value); ctx.toast(`${label} kopiert.`, { type: 'success' }); } catch { ta.select(); ctx.toast('Text ist markiert – kopiere ihn mit Strg/Cmd + C.', { type: 'info' }); }
        };
        const box = h('details', { class: 'export panel' },
          h('summary', null, 'Exportieren und Importieren'),
          h('div', { class: 'export-grid' },
            h('div', null, h('h3', null, 'JSON (Engine-Format)'), jsonOut, h('button', { type: 'button', class: 'btn btn-small', onclick: () => copy(jsonOut, 'JSON') }, 'JSON kopieren')),
            h('div', null, h('h3', null, 'DOT (Graphviz)'), dotOut, h('button', { type: 'button', class: 'btn btn-small', onclick: () => copy(dotOut, 'DOT') }, 'DOT kopieren')),
            h('div', null, h('h3', null, 'JSON laden'), importIn,
              h('button', { type: 'button', class: 'btn btn-small', onclick: () => {
                try { const obj = JSON.parse(importIn.value); normalizeDFA(obj); editor.load(obj); importMsg.textContent = 'Automat geladen.'; changed(); } catch (e) { importMsg.textContent = `Das ging nicht: ${e.message}`; }
              } }, 'Laden'), importMsg)));
        box.update = (A) => { jsonOut.value = JSON.stringify(editor.toJSON(), null, 1); dotOut.value = exportDot(toGraph(A)); };
        return box;
      }

      const resetBtn = h('button', { type: 'button', class: 'btn btn-ghost btn-small', onclick: () => {
        if (!window.confirm('Automat leeren und neu beginnen?')) return;
        ctx.progress.setDraft(draftKey, null);
        editor.load({ alphabet: editor.m.alphabet, states: ['S0'], start: 'S0', accepting: [], delta: {} });
        clear(checkResult); changed();
      } }, 'Neu beginnen');

      function changed() {
        clearTimeout(renderTimer);
        renderTimer = setTimeout(async () => {
          let A;
          try { A = editor.toDFA(); } catch { return; }
          await gv.render(A);
          await rp.setAutomat(A);
          if (lastWord) { rp.load(lastWord); rp.toEnd(); }
          exportBox?.update(A);
        }, 120);
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => ctx.progress.setDraft(draftKey, editor.toJSON()), 400);
      }

      const solved = c && ctx.progress.isSolved('baukasten', c.id);
      clear(el, taskPanel,
        h('div', { class: 'bench' },
          h('div', { class: 'bench-left' }, editorPanel,
            c ? h('div', { class: 'check-panel panel' }, h('div', { class: 'check-row' }, checkBtn, resetBtn), solved ? h('p', { class: 'muted' }, 'Diese Challenge hast du schon gelöst.') : null, checkResult) : h('div', { class: 'check-row' }, resetBtn),
            exportBox),
          h('div', { class: 'bench-right' }, graphPanel, h('div', { class: 'panel' }, testForm, testBox), solutionSlot)),
        h('nav', { class: 'case-nav', 'aria-label': 'Challenges' },
          c && c.nr > 1 ? h('a', { class: 'btn btn-ghost', href: ctx.link('baukasten', { level: c.nr - 1 }) }, `‹ Challenge ${c.nr - 1}`) : h('span'),
          h('a', { class: 'btn btn-ghost', href: ctx.link('baukasten') }, 'Alle Challenges'),
          c && c.nr < CHALLENGES.length ? h('a', { class: 'btn btn-ghost', href: ctx.link('baukasten', { level: c.nr + 1 }) }, `Challenge ${c.nr + 1} ›`) : h('span')));
      changed();
      return () => { clearTimeout(saveTimer); clearTimeout(renderTimer); rp.pause(); ctx.progress.setDraft(draftKey, editor.toJSON()); };
    }
  },
};

const sameAlphabet = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
