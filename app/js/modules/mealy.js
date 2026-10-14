// Mealy-Maschine (#/mealy, DS06): Simulation mit Eingabe- und Ausgabeband.
// Modi: „Was kommt raus?“ (Ausgabe vorhersagen), „Bug-Jagd“ (fehlerhafte Kantenausgaben finden und
// reparieren, Prüfung gegen die Referenz), „Freie Simulation“.
// Deep-Links: #/mealy?aufgabe=n&modus=vorhersage|bugjagd|frei  (n = 1 …; ohne modus: vorhersage),
//             #/mealy?demo=1[&modus=…] (Demo-Automat im Gastmodus)
// Geprüft wird von der Quelle (Server, angemeldet; Demo im Gastmodus): Die Bug-Jagd-Fehler kennt nur die Quelle, Punkte
// vergibt nur der Server. Die Referenz ist in „Was kommt raus?“ und in der freien Simulation sichtbar (Gegenstand der Aufgabe).

import { h, clear, quote } from '../core/dom.js';
import { mealy, runMealy, outputLabel } from '../engine/mealy.js';
import { leseMealyAusgabe } from '../engine/pruefer.js';
import { tokenize, wordToString } from '../engine/tokenize.js';
import { GraphView } from '../components/graph-view.js';
import { WordTape } from '../components/word-tape.js';
import { MealyPlayer } from '../components/mealy-player.js';

const MODI = { vorhersage: 'Was kommt raus?', bugjagd: 'Bug-Jagd', frei: 'Freie Simulation' };
const clone = (M) => ({ ...M, delta: Object.fromEntries(Object.entries(M.delta).map(([s, row]) => [s, Object.fromEntries(Object.entries(row).map(([a, t]) => [a, { ...t }]))])) });
const shownWord = (tokens, alphabet) => (tokens.length ? quote(wordToString(tokens, alphabet)) : 'ε');
const label = (o) => outputLabel(o === 'ε' ? '' : o);

export default {
  title: 'Mealy-Maschine',
  mount(el, ctx) {
    const q = ctx.quelle; // Server (angemeldet) oder Demo (Gastmodus)
    const p = ctx.params;
    const modus = MODI[p.get('modus')] ? p.get('modus') : null;
    const n = Number(p.get('aufgabe'));
    let aktiv = true;
    let aufraeumen = null;
    let GRUPPEN = []; // [{ nr, titel, v, b }] – je Automat die Aufgaben „Was kommt raus?“ (v) und Bug-Jagd (b)
    const fehler = (e) => { if (aktiv) clear(el, h('p', { class: 'notice notice-error' }, e.message)); };
    clear(el, h('p', { class: 'muted' }, 'Lade …'));
    (async () => {
      const liste = await q.liste('mealy');
      if (!aktiv) return;
      const byNr = new Map();
      for (const e of liste) {
        const nr = e.nr ?? 0;
        if (!byNr.has(nr)) byNr.set(nr, { nr, titel: e.titel.replace(/: (Was kommt raus\?|Bug-Jagd)$/, '').replace(/^Demo: /, '').replace(/ – (Was kommt raus\?|Bug-Jagd)$/, '') });
        byNr.get(nr)[e.art === 'vorhersage' ? 'v' : 'b'] = e;
      }
      GRUPPEN = [...byNr.values()].sort((a, b) => a.nr - b.nr);
      const g = q.demo ? GRUPPEN[0] : (GRUPPEN.find((x) => x.nr === n) ?? (modus ? GRUPPEN[0] : null));
      if (!g) { overview(); return; }
      const m = modus ?? 'vorhersage';
      const d = await q.aufgabe(m === 'bugjagd' ? g.b.id : g.v.id);
      if (!aktiv) return;
      const x = { ...d.aufgabe, aufgabeId: d.id, nr: g.nr, gruppe: g, M: mealy(d.aufgabe.automat), zustand: d.zustand, loesung: d.loesung ?? null };
      ctx.setSubtitle(q.demo ? `${MODI[m]} · Demo: ${g.titel} (ohne Punkte)` : `${MODI[m]} · Aufgabe ${g.nr}: ${g.titel}`);
      const headEls = [modeTabs(g, m), taskPanel(x)];
      aufraeumen = m === 'bugjagd' ? bugjagd(x, headEls) : m === 'frei' ? frei(x, headEls) : vorhersage(x, headEls);
    })().catch(fehler);
    return () => { aktiv = false; aufraeumen?.(); };

    // ───────────────────────── Übersicht ─────────────────────────
    function overview() {
      ctx.setSubtitle('Automaten, die nicht nur prüfen, sondern antworten: Zu jedem gelesenen Zeichen gibt es eine Ausgabe.');
      clear(el,
        h('div', { class: 'panel me-intro' },
          h('p', { class: 'lead' }, 'Ein Mealy-Automat liest ein Eingabewort und schreibt dabei ein Ausgabewort. Jede Kante trägt „Eingabezeichen / Ausgabe“ – zum Beispiel „H / B“. Steht dort ε, gibt der Automat bei diesem Übergang nichts aus.'),
          h('p', null, 'Mealy-Automaten haben keine Endzustände: Es geht nicht um „akzeptiert oder abgelehnt“, sondern um die Ausgabe.')),
        h('ol', { class: 'case-grid' }, GRUPPEN.map((g) => {
          const v = ctx.progress.isSolved('mealy', g.v.schluessel);
          const bug = ctx.progress.isSolved('mealy', g.b.schluessel);
          return h('li', null, h('a', { class: ['case-card', v && bug && 'is-solved'], href: ctx.link('mealy', { aufgabe: g.nr }) },
            h('span', { class: 'case-nr' }, `Aufgabe ${g.nr}`),
            h('span', { class: 'case-title' }, g.titel),
            h('span', { class: 'case-state' }, `Vorhersage ${v ? '✓' : `${g.v.punkte} P.`} · Bug-Jagd ${bug ? '✓' : `${g.b.punkte} P.`}`)));
        })),
        h('div', { class: 'start-actions' },
          h('a', { class: 'btn btn-primary', href: ctx.link('mealy', { aufgabe: 1, modus: 'frei' }) }, 'Freie Simulation'),
          h('a', { class: 'btn', href: ctx.link('mealy', { aufgabe: 4, modus: 'bugjagd' }) }, 'Bug-Jagd: Frog-Kompressor (Abi 2022)')));
    }

    function modeTabs(g, active) {
      return h('nav', { class: 'mode-tabs', 'aria-label': 'Modus' }, Object.entries(MODI).map(([k, text]) =>
        h('a', { href: ctx.link('mealy', q.demo ? { demo: 1, modus: k } : { aufgabe: g.nr, modus: k }), 'aria-current': k === active ? 'page' : null }, text)));
    }

    function taskPanel(x) {
      return h('div', { class: 'panel task-panel' },
        q.demo ? h('p', { class: 'notice gast-hinweis' }, h('strong', null, 'Demo. '), 'Ein eigener Automat zum Ausprobieren – ohne Punkte. Die sieben Mealy-Aufgaben gibt es nach der Anmeldung.') : null,
        h('p', { class: 'task-text' }, x.kontext),
        h('p', { class: 'sigma' }, `Σ = {${x.M.inputAlphabet.join(', ')}} · Ω = {${x.M.outputAlphabet.join(', ')}} · Startzustand ${x.M.start} · keine Endzustände`));
    }

    function caseNav(x, mod) {
      if (q.demo) return h('nav', { class: 'case-nav', 'aria-label': 'Aufgaben' }, h('a', { class: 'btn btn-ghost', href: ctx.link('gast') }, 'Weitere Demo-Aufgaben'));
      return h('nav', { class: 'case-nav', 'aria-label': 'Aufgaben' },
        x.nr > 1 ? h('a', { class: 'btn btn-ghost', href: ctx.link('mealy', { aufgabe: x.nr - 1, modus: mod }) }, `‹ Aufgabe ${x.nr - 1}`) : h('span'),
        h('a', { class: 'btn btn-ghost', href: ctx.link('mealy') }, 'Alle Aufgaben'),
        x.nr < GRUPPEN.length ? h('a', { class: 'btn btn-ghost', href: ctx.link('mealy', { aufgabe: x.nr + 1, modus: mod }) }, `Aufgabe ${x.nr + 1} ›`) : h('span'));
    }

    function statusText(z, was) {
      return !z || q.demo ? ''
        : z.status === 'geloest' ? `${was} hast du schon gelöst – zum Üben kannst du sie wiederholen.`
          : z.status === 'angesehen' ? 'Du hast dir die Lösung schon angesehen – Punkte gibt es hier nicht mehr, selbst lösen zählt aber als gelöst.' : '';
    }

    // ───────────────────────── Was kommt raus? ─────────────────────────
    function vorhersage(x, headEls) {
      const left = h('div', { class: ['panel me-stage', x.M.states.length > 5 && 'is-dense'] });
      const gv = new GraphView(left, { label: `Mealy-Automat: ${x.titel}`, minScale: 0.75 });
      gv.render(x.M);
      const mp = new MealyPlayer(left, { automat: x.M, graph: gv, meanings: x.bedeutung, idleText: 'Nach deiner Antwort kannst du hier den Lauf ansehen.' });
      const right = h('div', { class: 'panel me-quiz' });
      const worte = x.worte;
      let idx = 0; let right1 = 0;
      let zustand = x.zustand;

      function item() {
        if (idx >= worte.length) return done();
        const w = worte[idx];
        const run = runMealy(x.M, w); // nur für Band und „Lauf ansehen“ – gewertet wird von der Quelle
        const tapeBox = h('div');
        const tape = new WordTape(tapeBox, { size: 'l', label: 'Eingabewort' });
        tape.set(run.tokens); tape.setHead(-1);
        const input = h('input', { type: 'text', id: 'me-out', class: 'word-input', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', placeholder: 'Ausgabe, z. B. B oder ε' });
        const msg = h('p', { class: 'field-msg', 'aria-live': 'polite' });
        const fb = h('div', { class: 'me-fb', 'aria-live': 'polite' });
        let tries = 0; let solved = false; let busy = false;
        const nextBtn = h('button', { type: 'button', class: 'btn btn-primary', hidden: true, onclick: () => { idx++; item(); } }, idx + 1 < worte.length ? 'Nächstes Wort' : 'Auswertung');
        const watch = h('button', { type: 'button', class: 'btn', hidden: true, onclick: () => { mp.load(run.tokens); mp.play(); left.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } }, 'Lauf ansehen');
        const form = h('form', { class: 'word-form', onsubmit: async (e) => {
          e.preventDefault();
          if (solved || busy) return;
          const r = leseMealyAusgabe(input.value, x.M.outputAlphabet);
          if (!r.ok) { msg.textContent = r.message; input.setAttribute('aria-invalid', 'true'); return; }
          msg.textContent = ''; input.removeAttribute('aria-invalid');
          busy = true;
          let res;
          try { res = await q.pruefen(x.aufgabeId, { wort: idx, ausgabe: input.value }); } catch (err) { busy = false; msg.textContent = err.message; return; }
          busy = false;
          tries++;
          zustand = res.zustand ?? zustand;
          const rm = res.rueckmeldung;
          if (res.punkteErhalten) ctx.toast(`+${res.punkteErhalten} Punkte`, { type: 'success' });
          if (rm.richtig) {
            solved = true; right1 += tries === 1 ? 1 : 0;
            clear(fb, h('div', { class: 'notice notice-success' }, h('p', null, h('strong', null, 'Richtig! '), `Ausgabe: ${outputLabel(rm.ausgabe)}`)));
            nextBtn.hidden = false; watch.hidden = false;
            input.disabled = true;
            nextBtn.focus({ preventScroll: true });
          } else {
            clear(fb, h('div', { class: 'notice notice-error' },
              h('p', null, h('strong', null, 'Noch nicht. '), `Deine Ausgabe ${outputLabel(r.text)} stimmt nicht.`),
              rm.ausgabe !== undefined ? h('p', null, `Richtig wäre ${outputLabel(rm.ausgabe)}. Sieh dir den Lauf an – achte auf die Kanten mit ε.`) : h('p', null, 'Verfolge das Wort Kante für Kante und schreib bei jedem Übergang die Ausgabe hinter dem Schrägstrich auf.')));
            if (rm.ausgabe !== undefined) { solved = true; nextBtn.hidden = false; watch.hidden = false; input.disabled = true; }
          }
        } },
        h('label', { for: 'me-out' }, 'Welche Ausgabe erzeugt der Automat?'),
        h('div', { class: 'input-row' }, input, h('button', { type: 'submit', class: 'btn btn-primary' }, 'Prüfen')), msg);
        clear(right, h('p', { class: 'case-nr' }, `Wort ${idx + 1} von ${worte.length}`), h('p', { class: 'me-q' }, 'Eingabe:'), tapeBox, form, fb,
          h('div', { class: 'start-actions' }, watch, nextBtn),
          idx === 0 && statusText(zustand, 'Diese Vorhersage') ? h('p', { class: 'muted' }, statusText(zustand, 'Diese Vorhersage')) : null,
          idx === 0 && !q.demo && zustand?.status === 'offen' ? h('p', { class: 'muted' }, `Gewertet wird dein erster Versuch je Wort (bis zu ${zustand.maxPunkte} Punkte).`) : null);
        input.focus({ preventScroll: true });
      }

      function done() {
        const next = GRUPPEN.find((y) => y.nr === x.nr + 1);
        clear(right, h('h2', null, 'Geschafft!'),
          h('p', { class: 'result-big' }, h('span', { class: 'num' }, String(right1)), ` von ${worte.length} im ersten Versuch`),
          h('div', { class: 'start-actions' },
            h('a', { class: 'btn btn-primary', href: ctx.link('mealy', q.demo ? { demo: 1, modus: 'bugjagd' } : { aufgabe: x.nr, modus: 'bugjagd' }) }, 'Weiter zur Bug-Jagd'),
            next && !q.demo ? h('a', { class: 'btn', href: ctx.link('mealy', { aufgabe: next.nr }) }, `Aufgabe ${next.nr}`) : null));
      }

      clear(el, ...headEls, h('div', { class: 'two-col' }, left, right), caseNav(x, 'vorhersage'));
      item();
      return () => mp.destroy();
    }

    // ───────────────────────── Bug-Jagd ─────────────────────────
    function bugjagd(x, headEls) {
      const F = x.M; // fehlerhafter Automat (Gegenstand der Aufgabe)
      const work = clone(F);
      let zustand = x.zustand;
      let loesung = x.loesung;
      // Vorschau für Lehrkräfte (?vorschau=1): Lösung gleich einsetzen, sobald die Aufgabe aufgebaut ist
      if (q.vorschau && loesung) setTimeout(() => { if (aktiv) aufdecken(); }, 0);
      let renderTimer = null;
      let checks = 0;

      const left = h('div', { class: ['panel me-stage', F.states.length > 5 && 'is-dense'] });
      const gv = new GraphView(left, { label: `Fehlerhafter Mealy-Automat: ${x.titel}`, minScale: 0.75 });
      const mp = new MealyPlayer(left, { graph: gv, meanings: x.bedeutung, idleText: 'Teste in Schritt 1 ein Eingabewort – hier siehst du dann den Lauf.' });
      mp.M = work;
      gv.render(work);
      /** aktuelle Ausgaben des Arbeitsstands { S0: { M: 'B' } } */
      const ausgaben = () => Object.fromEntries(work.states.map((s) => [s, Object.fromEntries(Object.entries(work.delta[s]).map(([c, t]) => [c, t.out === '' ? 'ε' : t.out]))]));

      // Schritt 1: Fehler finden
      const input = h('input', { type: 'text', id: 'me-test', class: 'word-input', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', placeholder: `z. B. ${x.worte[0]}` });
      const msg = h('p', { class: 'field-msg', 'aria-live': 'polite' });
      const judge = h('div', { class: 'me-judge', 'aria-live': 'polite' });
      const test = (w) => {
        const tk = tokenize(w, work.inputAlphabet);
        if (!tk.ok) { msg.textContent = tk.message; return; }
        msg.textContent = '';
        mp.M = work; mp.load(tk.tokens); mp.toEnd();
        const out = runMealy(work, tk.tokens).output;
        const say = (ok, text) => clear(judge, h('div', { class: ['notice', ok ? 'notice-success' : 'notice-error'] }, h('p', null, text)));
        const urteil = async (u) => {
          let r;
          try { r = await q.pruefen(x.aufgabeId, { test: wordToString(tk.tokens, work.inputAlphabet), urteil: u, ausgaben: ausgaben() }); } catch (e) { say(false, e.message); return; }
          const rm = r.rueckmeldung;
          if (u === 'bug') say(rm.bug, rm.bug ? `Bug gefunden! Richtig wäre ${outputLabel(rm.richtigeAusgabe)}. Jetzt die Kantenbeschriftung reparieren (Schritt 2).` : `Die Ausgabe ${outputLabel(rm.ausgabe)} ist korrekt. Such weiter!`);
          else say(!rm.bug, rm.bug ? `Schau genauer hin: Richtig wäre ${outputLabel(rm.richtigeAusgabe)}. Das ist ein Bug!` : 'Stimmt, diese Ausgabe ist richtig. Probier eine andere Eingabe.');
        };
        clear(judge, h('p', null, `Für ${shownWord(tk.tokens, work.inputAlphabet)} gibt der Automat `, h('strong', { class: 'me-out' }, outputLabel(out)), ' aus. Ist das richtig?'),
          h('div', { class: 'start-actions' },
            h('button', { type: 'button', class: 'btn btn-danger-ghost', onclick: () => urteil('bug') }, 'Falsch – Bug!'),
            h('button', { type: 'button', class: 'btn', onclick: () => urteil('stimmt') }, 'Stimmt')));
      };
      const findForm = h('form', { class: 'word-form', onsubmit: (e) => { e.preventDefault(); test(input.value); } },
        h('label', { for: 'me-test' }, 'Eingabewort testen'),
        h('div', { class: 'input-row' }, input, h('button', { type: 'submit', class: 'btn btn-primary' }, 'Ausprobieren')), msg,
        h('div', { class: 'chip-row' }, x.worte.map((w) => h('button', { type: 'button', class: 'chip', onclick: () => { input.value = w; test(w); } }, w))));

      // Schritt 2: Reparieren
      const rows = [];
      const felder = new Map();
      for (const s of work.states) for (const c of work.inputAlphabet) {
        const t = work.delta[s][c];
        if (!t) continue;
        const field = h('input', { type: 'text', class: 'me-edit', value: outputLabel(t.out), autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', 'aria-label': `Ausgabe bei ${s} mit ${c}` });
        felder.set(`${s}|${c}`, field);
        const orig = t.out;
        field.addEventListener('input', () => {
          const r = leseMealyAusgabe(field.value, work.outputAlphabet);
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
      const statusLine = h('p', { class: 'muted' }, statusText(zustand, 'Diese Bug-Jagd'));
      const showBtn = h('button', { type: 'button', class: 'btn btn-ghost btn-small', hidden: !loesung, onclick: () => aufdecken() }, 'Lösung zeigen');
      const checkBtn = h('button', { type: 'button', class: 'btn btn-primary', onclick: async () => {
        if (el.querySelector('.me-edit[aria-invalid]')) { status.textContent = 'Korrigiere zuerst die rot markierten Felder.'; return; }
        let r;
        checkBtn.disabled = true;
        try { r = await q.pruefen(x.aufgabeId, { ausgaben: ausgaben() }); } catch (e) { checkBtn.disabled = false; status.textContent = e.message; return; } finally { checkBtn.disabled = false; }
        checks++;
        zustand = r.zustand ?? zustand;
        statusLine.textContent = statusText(zustand, 'Diese Bug-Jagd');
        const rm = r.rueckmeldung;
        if (r.loesung) loesung = r.loesung;
        if (rm.richtig) {
          if (r.punkteErhalten) ctx.toast(`+${r.punkteErhalten} Punkte`, { type: 'success' });
          const next = GRUPPEN.find((y) => y.nr === x.nr + 1);
          clear(result, h('div', { class: 'notice notice-success' },
            h('p', null, h('strong', null, 'Repariert! '), `Dein Automat erzeugt jetzt für jede Eingabe die richtige Ausgabe${checks === 1 ? ' – im ersten Versuch' : ''}.`),
            rm.gefunden ? null : h('p', { class: 'muted' }, 'Tipp für die Klausur: Gib immer auch eine Eingabe an, an der man den Fehler sieht.')),
          h('div', { class: 'start-actions' }, next && !q.demo ? h('a', { class: 'btn btn-primary', href: ctx.link('mealy', { aufgabe: next.nr, modus: 'bugjagd' }) }, `Nächste Bug-Jagd: ${next.titel}`) : null));
        } else {
          const g = rm.gegenbeispiel;
          if (checks >= 2) showBtn.hidden = false;
          clear(result, h('div', { class: 'notice notice-error' },
            h('p', null, h('strong', null, 'Noch nicht. '), `Für die Eingabe ${shownWord(g.wort, work.inputAlphabet)} gibt dein Automat ${outputLabel(g.deine)} aus, richtig wäre ${outputLabel(g.richtig)}.`),
            !q.demo && zustand?.status === 'offen' ? h('p', { class: 'muted' }, `Versuch ${zustand.fehlversuche} – jetzt noch ${zustand.moeglich} Punkte möglich.`) : null,
            h('button', { type: 'button', class: 'btn btn-small', onclick: () => { input.value = wordToString(g.wort, work.inputAlphabet); test(g.wort); left.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } }, 'Lauf ansehen')));
        }
      } }, 'Prüfen');

      /** „Lösung zeigen“: die falschen Kanten mit richtiger Ausgabe – danach keine Punkte mehr für diese Bug-Jagd. */
      async function aufdecken() {
        if (!loesung) {
          if (!q.demo && zustand?.status === 'offen' && !window.confirm('Wenn du die Lösung ansiehst, bekommst du für diese Bug-Jagd keine Punkte mehr. Trotzdem anzeigen?')) return;
          try { const r = await q.aufdecken(x.aufgabeId); zustand = r.zustand; loesung = r.loesung; } catch (e) { ctx.toast(e.message, { type: 'error' }); return; }
          statusLine.textContent = statusText(zustand, 'Diese Bug-Jagd');
        }
        for (const f of loesung.fehler) felder.get(`${f.von}|${f.zeichen}`)?.classList.add('is-missing');
        clear(result, h('div', { class: 'notice' }, h('p', null, h('strong', null, 'Lösung: '), 'Falsch beschriftet sind ',
          loesung.fehler.map((f, i) => [i ? ', ' : '', h('code', null, `${f.von} –${f.zeichen} / ${label(f.falsch)}→`), ` (richtig: ${label(f.richtig)})`]), '. Trag die richtigen Ausgaben ein und prüfe – selbst repariert zählt als gelöst.')));
      }

      const right = h('div', { class: 'stack-col' },
        h('div', { class: 'panel' },
          h('h2', { class: 'me-h2' }, 'Auftrag'),
          h('p', null, x.fehlerText),
          x.beispiele.length ? h('div', null, h('p', { class: 'muted' }, 'So soll es sein (diese Beispiele klappen schon):'),
            h('ul', { class: 'me-examples' }, x.beispiele.map(([ein, aus]) => h('li', null, h('code', { class: 'word' }, ein || 'ε'), ' → ', h('code', { class: 'word' }, aus))))) : null),
        h('div', { class: 'panel' }, h('h2', { class: 'me-h2' }, '1. Finde eine Eingabe mit falscher Ausgabe'), findForm, judge),
        h('div', { class: 'panel' }, h('h2', { class: 'me-h2' }, '2. Repariere die Kantenbeschriftungen'),
          h('p', { class: 'muted' }, 'Ändere die Ausgaben (hinter dem Schrägstrich). ε oder leer = keine Ausgabe. Die Folgezustände sind richtig.'),
          h('div', { class: 'table-scroll' }, h('table', { class: 'mini-table me-table' },
            h('thead', null, h('tr', null, h('th', null, 'Zustand'), h('th', null, 'Eingabe'), h('th', null, 'Folgezustand'), h('th', null, 'Ausgabe'))),
            h('tbody', null, rows))),
          status,
          h('div', { class: 'check-row' }, checkBtn,
            h('button', { type: 'button', class: 'btn btn-ghost btn-small', onclick: () => ctx.navigate('mealy', q.demo ? { demo: 1, modus: 'bugjagd' } : { aufgabe: x.nr, modus: 'bugjagd' }) }, 'Zurücksetzen'),
            showBtn),
          statusLine,
          result));

      clear(el, ...headEls, h('div', { class: 'two-col me-bug' }, h('div', { class: 'me-sticky' }, left), right), caseNav(x, 'bugjagd'));
      return () => { clearTimeout(renderTimer); mp.destroy(); };
    }

    // ───────────────────────── Freie Simulation ─────────────────────────
    function frei(x, headEls) {
      const left = h('div', { class: ['panel me-stage', x.M.states.length > 5 && 'is-dense'] });
      const mp = new MealyPlayer(left, { automat: x.M, meanings: x.bedeutung, graph: new GraphView(left, { label: `Mealy-Automat: ${x.titel}`, minScale: 0.75 }) });
      mp.graph.render(x.M);
      const select = h('select', { id: 'me-select', disabled: q.demo, onchange: (e) => ctx.navigate('mealy', { aufgabe: e.target.value, modus: 'frei' }) },
        GRUPPEN.map((y) => h('option', { value: y.nr, selected: y.nr === x.nr }, q.demo ? y.titel : `${y.nr}: ${y.titel}`)));
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
