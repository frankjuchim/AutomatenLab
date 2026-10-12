// Level-Quiz (#/quiz): Exit-Tickets je Welt (8–10 Fragen) und Mini-Exit-Tickets je Doppelstunde (3 Fragen).
// Fragetypen: Multiple Choice, Wahr/Falsch mit Begründung, Zuordnung. Ergebnisseite zum Vorzeigen.
// Deep-Links: #/quiz?welt=A|B|C|D, #/quiz?ds=1…16

import { h, clear } from '../core/dom.js';
import { LEVELS } from '../data/worlds.js';

export default {
  title: 'Level-Quiz',
  mount(el, ctx) {
    const q = ctx.quelle; // Server (angemeldet) oder Demo (Gastmodus) – Prüfung nie mit Lösungen im Browser
    let aktiv = true;
    const welt = (ctx.params.get('welt') ?? '').toUpperCase();
    const ds = Number(ctx.params.get('ds'));
    const fehler = (e) => { if (aktiv) clear(el, h('p', { class: 'notice notice-error' }, e.message)); };
    clear(el, h('p', { class: 'muted' }, 'Lade …'));
    if (q.demo) q.liste('quiz').then((l) => aktiv && run(l[0].id, ctx.link('gast'))).catch(fehler);
    else if (/^[A-D]$/.test(welt)) run(`quiz:welt-${welt}`, ctx.link('quiz'));
    else if (ds >= 1 && ds <= 16) run(`quiz:ds-${ds}`, ctx.link('quiz'));
    else overview().catch(fehler);
    return () => { aktiv = false; };

    async function overview() {
      ctx.setSubtitle('Kurz, knapp, abiturnah: Zeig am Ende der Stunde, was sitzt.');
      const liste = await q.liste('quiz');
      if (!aktiv) return;
      const bestOf = (id) => ctx.progress.best(id);
      const welten = liste.filter((a) => a.id.startsWith('quiz:welt-'));
      const dss = liste.filter((a) => a.id.startsWith('quiz:ds-'));
      clear(el,
        h('section', { class: 'stufe-section' },
          h('h2', null, 'Quiz je Welt'),
          h('ol', { class: 'challenge-grid' }, welten.map((a) => {
            const id = a.id.slice('quiz:welt-'.length);
            const best = bestOf(a.id);
            return h('li', null, h('a', { class: ['challenge-card', best === 100 && 'is-solved', 'stufe-2'], href: ctx.link('quiz', { welt: id }) },
              h('span', { class: 'case-nr' }, `Welt ${id}`),
              h('span', { class: 'case-title' }, a.titel.replace(/^Welt .: /, '')),
              h('span', { class: 'case-state' }, best != null ? `Ergebnis: ${best} %` : `${a.punkte} Punkte`)));
          }))),
        h('section', { class: 'stufe-section' },
          h('h2', null, 'Mini-Exit-Tickets je Level (3 Fragen)'),
          h('ol', { class: 'challenge-grid quiz-ds-grid' }, dss.map((a) => {
            const n = a.id.slice('quiz:ds-'.length);
            const best = bestOf(a.id);
            return h('li', null, h('a', { class: ['challenge-card', best === 100 && 'is-solved', 'stufe-1'], href: ctx.link('quiz', { ds: n }) },
              h('span', { class: 'case-nr' }, `Level ${n}`),
              h('span', { class: 'case-title' }, LEVELS[n]),
              h('span', { class: 'case-state' }, best != null ? `${best} %` : 'offen')));
          }))));
    }

    async function run(id, back) {
      let daten;
      try { daten = await q.aufgabe(id); } catch (e) { fehler(e); return; }
      if (!aktiv) return;
      const quiz = daten.aufgabe;
      const gewertet = daten.zustand.status === 'offen'; // erster Durchgang zählt, danach ist es Übung
      ctx.setSubtitle(quiz.titel + (q.demo ? ' (Demo – ohne Punkte)' : gewertet ? '' : ' (Wiederholung – zählt nicht mehr)'));
      const fragen = quiz.fragen;
      const st = { i: 0, score: 0, t0: performance.now(), log: [], letzte: null };
      const box = h('div', { class: 'panel quiz-box' });
      const bar = h('div', { class: 'quiz-progress', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': String(fragen.length), 'aria-valuenow': '0' }, h('span', { class: 'quiz-progress-fill' }));

      async function senden(antwort) {
        try { return await q.pruefen(id, { frage: st.i, ...antwort }); } catch (e) { ctx.toast(e.message, { type: 'error' }); return null; }
      }

      function show() {
        const f = fragen[st.i];
        bar.setAttribute('aria-valuenow', String(st.i));
        bar.firstChild.style.transform = `scaleX(${st.i / fragen.length})`;
        const head = h('p', { class: 'muted' }, `Frage ${st.i + 1} von ${fragen.length} · ${{ mc: 'Multiple Choice', wf: 'Wahr oder falsch – mit Begründung', zuordnung: 'Zuordnung' }[f.typ]}`);
        const verdict = h('div', { class: 'quiz-verdict', 'aria-live': 'polite' });
        const nextBtn = () => h('div', { class: 'start-actions' }, h('button', { type: 'button', class: 'btn btn-primary', onclick: () => { st.i++; st.i < fragen.length ? show() : finish(); } }, st.i + 1 < fragen.length ? 'Nächste Frage' : 'Zur Auswertung'));
        const done = (r, text) => {
          const earned = r.rueckmeldung.wert;
          st.score += earned; st.log.push({ f, earned }); st.letzte = r;
          clear(verdict, h('div', { class: ['notice', earned === 1 ? 'notice-success' : earned > 0 ? 'notice-warn' : 'notice-error'] },
            h('p', null, h('strong', null, earned === 1 ? 'Richtig. ' : earned > 0 ? 'Teilweise richtig. ' : 'Leider nicht. '), text ?? ''), r.rueckmeldung.erklaerung ? h('p', { class: 'muted' }, r.rueckmeldung.erklaerung) : null), nextBtn());
          verdict.querySelector('.btn-primary')?.focus({ preventScroll: true });
        };

        if (f.typ === 'mc') {
          const buttons = f.optionen.map((o, i) => h('button', { type: 'button', class: 'option', onclick: async () => {
            buttons.forEach((b) => { b.disabled = true; });
            const r = await senden({ wahl: o.id });
            if (!r) { buttons.forEach((b) => { b.disabled = false; }); return; }
            const richtig = r.rueckmeldung.wert === 1;
            buttons[i].classList.add(richtig ? 'is-correct' : 'is-wrong');
            if (!richtig) buttons[f.optionen.findIndex((x) => x.id === r.rueckmeldung.richtig)]?.classList.add('is-correct');
            done(r, richtig ? null : `Richtig wäre: ${r.rueckmeldung.richtigText}`);
          } }, h('span', { class: 'option-key', 'aria-hidden': 'true' }, 'ABCD'[i]), h('span', { class: 'option-text' }, o.text)));
          clear(box, head, h('h2', { class: 'question' }, f.frage), h('ul', { class: 'option-list' }, buttons.map((b) => h('li', null, b))), verdict);
        } else if (f.typ === 'wf') {
          // Erst entscheiden, dann begründen – geprüft wird beides zusammen (die Lösung kennt nur der Server)
          const begr = h('div', { class: 'quiz-begr' });
          const wfBtns = [true, false].map((v) => h('button', { type: 'button', class: ['decide', v ? 'decide-yes' : 'decide-no', 'decide-small'], onclick: () => {
            wfBtns.forEach((b) => { b.disabled = true; });
            wfBtns[v ? 0 : 1].classList.add('is-selected');
            clear(begr, h('p', null, h('strong', null, `Du sagst: ${v ? 'wahr' : 'falsch'}. `), 'Welche Begründung passt?'),
              h('ul', { class: 'option-list' }, f.begruendungen.map((o, i) => { const b = h('button', { type: 'button', class: 'option', onclick: async () => {
                begr.querySelectorAll('.option').forEach((x) => { x.disabled = true; });
                const r = await senden({ wahr: v, begruendung: o.id });
                if (!r) { begr.querySelectorAll('.option').forEach((x) => { x.disabled = false; }); return; }
                const wahrOk = v === r.rueckmeldung.wahr;
                wfBtns[v ? 0 : 1].classList.add(wahrOk ? 'is-correct' : 'is-wrong');
                b.classList.add(o.id === r.rueckmeldung.richtig ? 'is-correct' : 'is-wrong');
                const teile = [wahrOk ? 'Stimmt.' : `Die Aussage ist ${r.rueckmeldung.wahr ? 'wahr' : 'falsch'}.`];
                if (o.id !== r.rueckmeldung.richtig) teile.push(`Passende Begründung: ${r.rueckmeldung.richtigText}`);
                done(r, teile.join(' '));
              } }, h('span', { class: 'option-key', 'aria-hidden': 'true' }, 'ABC'[i]), h('span', { class: 'option-text' }, o.text)); return h('li', null, b); })));
          } }, v ? 'Wahr' : 'Falsch'));
          clear(box, head, h('h2', { class: 'question' }, f.aussage), h('div', { class: 'decide-row quiz-wf' }, wfBtns[1], wfBtns[0]), begr, verdict);
        } else {
          const selects = f.links.map((l) => h('select', { class: 'quiz-select', 'aria-label': l }, h('option', { value: '' }, '– wählen –'), f.rechts.map((r) => h('option', { value: r }, r))));
          const list = h('ul', { class: 'zuordnung-list' }, f.links.map((l, i) => h('li', null, h('span', { class: 'zu-left' }, l), selects[i])));
          const checkBtn = h('button', { type: 'button', class: 'btn btn-primary', onclick: async () => {
            if (selects.some((s) => !s.value)) { clear(verdict, h('p', { class: 'notice notice-warn' }, 'Ordne erst alles zu.')); return; }
            checkBtn.disabled = true;
            const r = await senden({ zuordnung: selects.map((s) => s.value) });
            if (!r) { checkBtn.disabled = false; return; }
            selects.forEach((s, i) => { const right = s.value === r.rueckmeldung.loesung[i]; s.disabled = true; s.parentElement.classList.add(right ? 'is-yes' : 'is-no'); if (!right) s.parentElement.append(h('span', { class: 'zu-fix muted' }, ` → ${r.rueckmeldung.loesung[i]}`)); });
            done(r, `${r.rueckmeldung.richtigeZuordnungen} von ${f.links.length} Zuordnungen richtig.`);
          } }, 'Prüfen');
          clear(box, head, h('h2', { class: 'question' }, f.frage), list, h('p', null, checkBtn), verdict);
        }
      }

      function finish() {
        bar.firstChild.style.transform = 'scaleX(1)';
        const total = fragen.length;
        const pct = Math.round((100 * st.score) / total);
        const secs = Math.round((performance.now() - st.t0) / 1000);
        const r = st.letzte;
        const gewertetPct = r?.loesung?.ergebnis?.prozent;
        const fmt = (x) => String(x).replace('.', ',');
        const stamp = new Date().toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' });
        clear(box,
          h('div', { class: 'quiz-result' },
            h('p', { class: 'muted' }, 'Ergebnis zum Vorzeigen'),
            h('h2', null, quiz.titel),
            h('p', { class: 'result-big' }, h('span', { class: ['num', pct >= 80 ? 'is-top' : ''] }, `${pct} %`)),
            h('p', { class: 'quiz-result-line' }, `${fmt(st.score)} von ${total} Punkten · ${secs} s · ${stamp}`),
            q.demo ? h('p', { class: 'notice' }, 'Das war die Demo. Mit Anmeldung über InfoLabs gibt es Punkte und alle Quizze.')
              : r?.punkteErhalten ? h('p', { class: 'record' }, `+${r.punkteErhalten} Punkte`)
                : !gewertet && gewertetPct != null ? h('p', { class: 'muted' }, `Gewertet bleibt dein erster Durchgang (${gewertetPct} %).`) : null,
            pct === 100 ? h('p', { class: 'record' }, 'Alles richtig!') : pct >= 80 ? h('p', { class: 'record' }, 'Sehr gut – fast alles sitzt.') : h('p', { class: 'muted' }, 'Schau dir die markierten Fragen noch einmal an.'),
            h('ol', { class: 'quiz-log' }, st.log.map((e) => h('li', { class: e.earned === 1 ? 'is-yes' : e.earned > 0 ? 'is-half' : 'is-no' },
              h('span', { class: 'quiz-log-mark', 'aria-label': e.earned === 1 ? 'richtig' : e.earned > 0 ? 'teilweise' : 'falsch' }, e.earned === 1 ? '✓' : e.earned > 0 ? '½' : '✗'),
              h('span', null, e.f.frage ?? e.f.aussage)))),
            h('div', { class: 'start-actions' },
              h('button', { type: 'button', class: 'btn btn-primary', onclick: () => run(id, back) }, 'Nochmal'),
              h('a', { class: 'btn', href: back }, q.demo ? 'Zu den Demo-Aufgaben' : 'Alle Quizze'))));
      }

      clear(el, bar, box);
      show();
    }
  },
};
