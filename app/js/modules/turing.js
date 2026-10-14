// Turing-Labor (#/turing): Turingmaschinen-Simulator mit Band, Schreib-Lese-Kopf, Zustandsgraph („gelesen / geschrieben, Bewegung“),
// Übergangstabelle, Schritt/Play/Tempo. Programme: Binär + 1, aⁿbⁿcⁿ, unärer Addierer, Fleißige Biber.
// Challenge „Vervollständige die Übergangstabelle“. Deep-Links: #/turing?programm=<id>, #/turing?challenge=n,
// #/turing?demo=1 (Demo-Challenge). Die Challenges prüft die Quelle (Server bzw. Demo): Welche Regel fehlt, kennt nur sie.

import { h, clear, quote, reducedMotion } from '../core/dom.js';
import { TURING_PROGRAMME } from '../data/turing.js';
import { tm, runTM, tmToGraph, tmTable, countOnes, tapeContent, BLANK, MOVES } from '../engine/turing.js';
import { GraphView } from '../components/graph-view.js';
import { TmTape } from '../components/tm-tape.js';

const PROGRAMME = TURING_PROGRAMME.map((p) => ({ ...p, T: tm(p.maschine) }));
const TEMPI = [{ ms: 900, label: 'langsam' }, { ms: 450, label: 'normal' }, { ms: 160, label: 'schnell' }, { ms: 40, label: 'turbo' }];
const MAX_STEPS = 3000;

export default {
  title: 'Turing-Labor',
  mount(el, ctx) {
    const p = ctx.params;
    const q = ctx.quelle; // Challenges: Server (angemeldet) oder Demo (Gastmodus)
    const cn = Number(p.get('challenge'));
    if (q.demo || cn >= 1) {
      let aktiv = true; let aufraeumen = null; let LISTE = [];
      clear(el, h('p', { class: 'muted' }, 'Lade …'));
      (async () => {
        LISTE = await q.liste('turing');
        const e = q.demo ? LISTE[0] : LISTE.find((x) => x.nr === cn);
        if (!aktiv) return;
        if (!e) { aufraeumen = lab(PROGRAMME[0]); return; }
        const d = await q.aufgabe(e.id);
        if (aktiv) aufraeumen = challenge({ ...d.aufgabe, aufgabeId: e.id, nr: e.nr ?? 0, anzahl: LISTE.length, zustand: d.zustand, loesung: d.loesung ?? null });
      })().catch((e) => { if (aktiv) clear(el, h('p', { class: 'notice notice-error' }, e.message)); });
      return () => { aktiv = false; aufraeumen?.(); };
    }
    const prog = PROGRAMME.find((x) => x.id === p.get('programm')) ?? PROGRAMME[0];
    return lab(prog);

    function lab(prog) {
      ctx.setSubtitle('Band, Kopf, Zustände – die Maschine, die alles berechnen kann, was berechenbar ist.');
      const T = prog.T;
      const st = { run: null, k: 0, timer: null, tempo: 1 };

      // ── Programmwahl ──
      const chooser = h('div', { class: 'tm-programs', role: 'tablist', 'aria-label': 'Programm' },
        PROGRAMME.map((q) => h('a', { class: ['chip tm-chip', q.id === prog.id && 'is-selected'], role: 'tab', 'aria-selected': String(q.id === prog.id), href: ctx.link('turing', { programm: q.id }) }, q.titel)),
        h('a', { class: 'chip tm-chip tm-chip-challenge', href: ctx.link('turing', { challenge: 1 }) }, 'Challenge: Tabelle vervollständigen'));

      // ── Band & Steuerung ──
      const tapeBox = h('div');
      const tape = new TmTape(tapeBox, { cells: 15 });
      const say = h('p', { class: 'run-say tm-say', 'aria-live': 'polite' });
      const stepsEl = h('span', { class: 'stat-value' }, '0');
      const onesEl = h('span', { class: 'stat-value' }, '0');
      const input = h('input', { type: 'text', id: 'tm-word', class: 'word-input', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', value: prog.eingaben[0] ?? '', placeholder: prog.biber ? 'leeres Band' : `Eingabe über {${T.alphabet.join(', ')}}` });
      const msg = h('p', { class: 'field-msg', 'aria-live': 'polite' });
      const graphBox = h('div', { class: 'tm-graph panel' });
      const gv = new GraphView(graphBox, { label: `Zustandsgraph ${prog.titel}` });
      gv.render(tmToGraph(T));

      const btn = (label, icon, fn) => h('button', { type: 'button', class: 'btn btn-icon', 'aria-label': label, title: label, onclick: fn }, icon);
      const bStart = btn('Zum Anfang', '⏮', () => goto(0));
      const bPrev = btn('Schritt zurück', '◀', () => { pause(); goto(st.k - 1); });
      const bPlay = h('button', { type: 'button', class: 'btn btn-play', onclick: () => (st.timer ? pause() : play()) }, 'Abspielen');
      const bNext = btn('Schritt vor', '▶', () => { pause(); goto(st.k + 1); });
      const bEnd = btn('Zum Ende', '⏭', () => { pause(); goto(st.run.run.length - 1); });
      const tempoSel = h('select', { class: 'delta-select', 'aria-label': 'Tempo', onchange: (e) => { st.tempo = Number(e.target.value); if (st.timer) { pause(); play(); } } },
        TEMPI.map((t, i) => h('option', { value: i, selected: i === 1 }, t.label)));

      function load(word) {
        pause();
        const r = runTM(T, word, { maxSteps: MAX_STEPS });
        if (!r.ok) { msg.textContent = r.error; input.setAttribute('aria-invalid', 'true'); return; }
        msg.textContent = ''; input.removeAttribute('aria-invalid');
        st.run = r;
        goto(0);
      }

      function goto(k) {
        if (!st.run) return;
        const n = st.run.run.length - 1;
        st.k = Math.max(0, Math.min(k, n));
        const step = st.run.run[st.k];
        const c = step.config;
        tape.set(c);
        stepsEl.textContent = String(st.k);
        onesEl.textContent = String(countOnes(c.tape));
        gv.highlight({ active: c.state, edge: step.t ? [step.t.from, step.t.to] : null, visited: st.run.run.slice(0, st.k).map((x) => x.config.state) });
        tableHighlight(step.t);
        let text;
        if (st.k === 0) text = `Start in ${c.state}, Kopf auf dem ersten Feld.${prog.bedeutung?.[c.state] ? ` (${prog.bedeutung[c.state]})` : ''}`;
        else text = `${step.t.from} liest „${step.t.read}“ → schreibt „${step.t.write}“, geht nach ${step.t.move === 'L' ? 'links' : step.t.move === 'R' ? 'rechts' : 'nirgends (N)'}, Zustand ${step.t.to}.${prog.bedeutung?.[c.state] ? ` (${prog.bedeutung[c.state]})` : ''}`;
        if (st.k === n) {
          if (st.run.halted) {
            const out = tapeContent(c.tape).join('');
            text += T.accepting.includes(c.state)
              ? ` Keine Regel für (${c.state}, „${tapeRead(c)}“) – die Maschine hält in einem Endzustand: akzeptiert.${prog.biber ? '' : ` Bandinhalt: ${out || BLANK}.`}`
              : ` Keine Regel für (${c.state}, „${tapeRead(c)}“) – die Maschine hält, ${c.state} ist kein Endzustand: abgelehnt.`;
          } else text += ` Nach ${MAX_STEPS} Schritten abgebrochen – hält diese Maschine überhaupt?`;
        }
        say.textContent = text;
        buttons();
      }
      const tapeRead = (c) => c.tape.get(c.head) ?? BLANK;
      function buttons() {
        const n = st.run ? st.run.run.length - 1 : 0;
        bPlay.textContent = st.timer ? 'Pause' : (st.run && st.k >= n ? 'Nochmal' : 'Abspielen');
        bPlay.disabled = !st.run;
        bStart.disabled = bPrev.disabled = !st.run || st.k === 0;
        bNext.disabled = bEnd.disabled = !st.run || st.k >= n;
      }
      function play() {
        if (!st.run) return;
        const n = st.run.run.length - 1;
        if (st.k >= n) goto(0);
        st.timer = setInterval(() => { if (st.k >= n) { pause(); return; } goto(st.k + 1); if (st.k >= n) pause(); }, reducedMotion() ? Math.max(TEMPI[st.tempo].ms, 400) : TEMPI[st.tempo].ms);
        buttons();
      }
      function pause() { clearInterval(st.timer); st.timer = null; buttons(); }

      // ── Tabelle ──
      const rows = tmTable(T);
      const tbody = h('tbody', null, rows.map((r) => h('tr', { dataset: { from: r.from, read: r.read } },
        h('td', null, r.from), h('td', null, r.read), h('td', null, r.to), h('td', null, r.write), h('td', null, r.move))));
      const table = h('table', { class: 'abi-table tm-table' },
        h('caption', null, 'Übergangstabelle: (Zustand, gelesen) → (Folgezustand, geschrieben, Bewegung)'),
        h('thead', null, h('tr', null, ['Zustand', 'gelesen', 'Folgezustand', 'geschrieben', 'Bewegung'].map((t) => h('th', null, t)))), tbody);
      function tableHighlight(t) {
        tbody.querySelectorAll('tr').forEach((tr) => tr.classList.toggle('is-active', !!t && tr.dataset.from === t.from && tr.dataset.read === t.read));
      }

      const form = h('form', { class: 'word-form', onsubmit: (e) => { e.preventDefault(); load(input.value); } },
        h('label', { for: 'tm-word' }, prog.biber ? 'Eingabe (für den Biber leer lassen)' : 'Eingabe'),
        h('div', { class: 'input-row' }, input, h('button', { type: 'submit', class: 'btn btn-primary' }, 'Laden')), msg,
        h('div', { class: 'chip-row' }, prog.eingaben.filter((w) => w !== '').map((w) => h('button', { type: 'button', class: 'chip', onclick: () => { input.value = w; load(w); } }, w))));

      clear(el, chooser,
        h('div', { class: 'panel tm-intro' }, h('h2', null, prog.titel), h('p', { class: 'task-text' }, prog.kontext),
          h('p', { class: 'sigma' }, `Σ = {${T.alphabet.join(', ')}} · Γ = {${T.tapeAlphabet.join(', ')}} · Start ${T.start} · Endzustände {${T.accepting.join(', ')}}`)),
        h('div', { class: 'tm-layout' },
          h('div', { class: 'panel tm-stage' },
            h('div', { class: 'arena-hud' },
              h('span', { class: 'stat' }, h('span', { class: 'stat-label' }, 'Schritte'), stepsEl),
              prog.biber ? h('span', { class: 'stat' }, h('span', { class: 'stat-label' }, 'Einsen'), onesEl) : null,
              h('label', { class: 'tm-tempo' }, 'Tempo ', tempoSel)),
            tapeBox,
            h('div', { class: 'run-controls' }, bStart, bPrev, bPlay, bNext, bEnd),
            say, form),
          h('div', { class: 'tm-right' }, graphBox, h('div', { class: 'panel table-scroll' }, table))),
        infoBox());
      load(input.value);
      buttons();
      return () => { pause(); gv.destroy(); };
    }

    function challenge(c) {
      ctx.setSubtitle(q.demo ? `Demo-Challenge: ${c.titel} (ohne Punkte)` : `Challenge ${c.nr}: ${c.titel}`);
      const partial = tm(c.maschine);
      let zustand = c.zustand; let loesung = c.loesung;
      // Vorschau für Lehrkräfte (?vorschau=1): Lösung gleich einsetzen, sobald die Aufgabe aufgebaut ist
      if (q.vorschau && loesung) setTimeout(() => { if (el.isConnected) aufdecken(); }, 0);
      const graphBox = h('div', { class: 'tm-graph panel' });
      const gv = new GraphView(graphBox, { label: 'Unvollständiger Zustandsgraph' });
      gv.render(tmToGraph(partial));
      const toSel = h('select', { class: 'delta-select', 'aria-label': 'Folgezustand' }, h('option', { value: '' }, '?'), c.zustaende.map((s) => h('option', { value: s }, s)));
      const writeSel = h('select', { class: 'delta-select', 'aria-label': 'geschrieben' }, h('option', { value: '' }, '?'), c.bandalphabet.map((s) => h('option', { value: s }, s)));
      const moveSel = h('select', { class: 'delta-select', 'aria-label': 'Bewegung' }, h('option', { value: '' }, '?'), MOVES.map((m) => h('option', { value: m }, m)));
      const result = h('div', { class: 'check-result', 'aria-live': 'polite' });
      let attempts = 0;
      const rows = tmTable(partial);
      const table = h('table', { class: 'abi-table tm-table' },
        h('thead', null, h('tr', null, ['Zustand', 'gelesen', 'Folgezustand', 'geschrieben', 'Bewegung'].map((t) => h('th', null, t)))),
        h('tbody', null, rows.map((r) => h('tr', null, h('td', null, r.from), h('td', null, r.read), h('td', null, r.to), h('td', null, r.write), h('td', null, r.move))),
          h('tr', { class: 'is-missing' }, h('td', null, c.fehlt.from), h('td', null, c.fehlt.read), h('td', null, toSel), h('td', null, writeSel), h('td', null, moveSel))));
      const next = () => (q.demo ? null : (c.nr < c.anzahl ? c.nr + 1 : null));
      async function check() {
        if (!toSel.value || !writeSel.value || !moveSel.value) { clear(result, h('p', { class: 'notice notice-warn' }, 'Fülle alle drei Felder der fehlenden Regel aus.')); return; }
        attempts++;
        let r;
        try { r = await q.pruefen(c.aufgabeId, { to: toSel.value, write: writeSel.value, move: moveSel.value }); } catch (e) { clear(result, h('p', { class: 'notice notice-error' }, e.message)); return; }
        zustand = r.zustand ?? zustand;
        if (r.loesung) loesung = r.loesung;
        const rm = r.rueckmeldung;
        if (rm.richtig) {
          if (r.punkteErhalten) ctx.toast(`+${r.punkteErhalten} Punkte`, { type: 'success' });
          clear(result, h('div', { class: 'notice notice-success' },
            h('p', null, h('strong', null, 'Richtig! '), `Die Regel (${c.fehlt.from}, ${c.fehlt.read}) → (${toSel.value}, ${writeSel.value}, ${moveSel.value}) macht die Maschine wieder korrekt – geprüft mit ${rm.tests.map((w) => quote(w)).join(', ')}.`),
            h('div', { class: 'start-actions' },
              h('a', { class: 'btn btn-primary', href: ctx.link('turing', { programm: c.programm }) }, 'Im Simulator ansehen'),
              next() ? h('a', { class: 'btn', href: ctx.link('turing', { challenge: next() }) }, `Challenge ${next()}`) : null)));
        } else {
          const grund = rm.endlos ? `Bei Eingabe ${quote(rm.wort)} hält die Maschine nicht (Endlosschleife).` : `Bei Eingabe ${quote(rm.wort)} steht am Ende „${rm.band}“ auf dem Band – erwartet „${rm.erwartet}“.`;
          clear(result, h('div', { class: 'notice notice-error' }, h('p', null, h('strong', null, 'Noch nicht. '), grund),
            h('p', { class: 'muted' }, !q.demo && zustand?.status === 'offen' ? `Versuch ${zustand.fehlversuche} – jetzt noch ${zustand.moeglich} Punkte möglich.` : `Versuch ${attempts}.`),
            attempts >= 3 ? h('p', null, h('button', { type: 'button', class: 'btn btn-small btn-ghost', onclick: () => aufdecken() }, 'Lösung zeigen')) : null));
        }
      }
      /** „Lösung zeigen“: danach gibt es für diese Challenge keine Punkte mehr. */
      async function aufdecken() {
        if (!loesung) {
          if (!q.demo && zustand?.status === 'offen' && !window.confirm('Wenn du die Lösung ansiehst, bekommst du für diese Challenge keine Punkte mehr. Trotzdem anzeigen?')) return;
          try { const r = await q.aufdecken(c.aufgabeId); zustand = r.zustand; loesung = r.loesung; } catch (e) { ctx.toast(e.message, { type: 'error' }); return; }
        }
        const rg = loesung.regel;
        toSel.value = rg.to; writeSel.value = rg.write; moveSel.value = rg.move;
        clear(result, h('div', { class: 'notice' }, h('p', null, h('strong', null, 'Lösung: '), `(${c.fehlt.from}, ${c.fehlt.read}) → (${rg.to}, ${rg.write}, ${rg.move}). Prüfe sie – selbst geprüft zählt als gelöst.`)));
      }
      clear(el,
        h('div', { class: 'panel tm-intro' }, h('h2', null, c.programmTitel), h('p', { class: 'task-text' }, c.aufgabe), h('p', { class: 'muted' }, c.kontext),
          q.demo ? h('p', { class: 'notice gast-hinweis' }, h('strong', null, 'Demo. '), 'Eine eigene Challenge zum Ausprobieren – ohne Punkte.') : null),
        h('div', { class: 'tm-layout' },
          h('div', { class: 'panel' }, h('div', { class: 'table-scroll' }, table),
            h('div', { class: 'check-row' }, h('button', { type: 'button', class: 'btn btn-primary btn-large', onclick: () => check() }, 'Prüfen'), h('span', { class: 'muted' }, 'Geprüft wird mit Testeingaben gegen die korrekte Maschine.')),
            result),
          h('div', { class: 'tm-right' }, graphBox)),
        h('nav', { class: 'case-nav' },
          h('a', { class: 'btn btn-ghost', href: ctx.link('turing') }, '‹ Zum Simulator'),
          next() ? h('a', { class: 'btn btn-ghost', href: ctx.link('turing', { challenge: next() }) }, `Challenge ${next()} ›`) : h('span')));
      return () => gv.destroy();
    }

    function infoBox() {
      return h('details', { class: 'panel tm-info' },
        h('summary', null, 'Church-Turing-These und Halteproblem – kurz erklärt'),
        h('p', null, h('strong', null, 'Church-Turing-These: '), 'Alles, was sich überhaupt mit einem mechanischen Verfahren berechnen lässt, kann auch eine Turingmaschine berechnen. Jeder Computer, jede Programmiersprache ist genau so mächtig wie dieses einfache Modell aus Band, Kopf und Zuständen – nur schneller.'),
        h('p', null, h('strong', null, 'Halteproblem: '), 'Es gibt kein Programm, das für jedes beliebige Programm und jede Eingabe sicher entscheidet, ob es irgendwann anhält. Alan Turing hat 1936 bewiesen, dass ein solcher „Halte-Tester“ zu einem Widerspruch führt. Manche Fragen bleiben also für jede Maschine unentscheidbar – egal, wie viel Rechenzeit man hat.'),
        h('p', { class: 'muted' }, 'Zum Ausprobieren: Der Fleißige Biber hält nach wenigen Schritten – aber für etwas größere Maschinen weiß niemand, wie lange die fleißigste läuft.'));
    }
  },
};

