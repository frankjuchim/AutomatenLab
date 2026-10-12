// Sprach-Detektiv (#/detektiv): Welche Sprache erkennt der Automat?
// Testwörter eingeben (Lauf wird gezeigt), dann aus vier Beschreibungen die richtige wählen.
// Deep-Link: #/detektiv?fall=n (n = 1 …)

import { h, clear, quote } from '../core/dom.js';
import { dfa } from '../engine/dfa.js';
import { wordToString, tokenize } from '../engine/tokenize.js';
import { RunPlayer } from '../components/run-player.js';

const ANZAHL = 12; // Fälle 1–12 (Deep-Links #/detektiv?fall=n bleiben stabil)

export default {
  title: 'Sprach-Detektiv',
  mount(el, ctx) {
    const q = ctx.quelle; // Server (angemeldet) oder Demo (Gastmodus): Welche Option richtig ist, weiß nur die Quelle
    let aktiv = true;
    let aufraeumen = null;
    const fehler = (e) => { if (aktiv) clear(el, h('p', { class: 'notice notice-error' }, e.message)); };
    const n = Number(ctx.params.get('fall'));
    clear(el, h('p', { class: 'muted' }, 'Lade …'));
    if (q.demo) q.liste('detektiv').then((l) => aktiv && showCase(l[0].id)).catch(fehler);
    else if (n >= 1 && n <= ANZAHL) showCase(`detektiv:fall-${n}`).catch(fehler);
    else showList().catch(fehler);
    return () => { aktiv = false; aufraeumen?.(); };

    async function showList() {
      ctx.setSubtitle('Ein Automat, vier Verdächtige: Welche Beschreibung passt genau zu seiner Sprache?');
      const faelle = await q.liste('detektiv');
      if (!aktiv) return;
      clear(el, h('div', { class: 'case-intro' },
        h('p', { class: 'lead' }, 'So ermittelst du: Teste Wörter, beobachte den Lauf und überlege, was sich der Automat in jedem Zustand „merkt“. Erst dann entscheidest du dich.')),
      h('ol', { class: 'case-grid' }, faelle.map((f) => {
        const solved = ctx.progress.isSolved('detektiv', `fall-${f.nr}`);
        return h('li', null, h('a', { class: ['case-card', solved && 'is-solved'], href: ctx.link('detektiv', { fall: f.nr }) },
          h('span', { class: 'case-nr' }, `Fall ${f.nr}`),
          h('span', { class: 'case-title' }, f.titel),
          h('span', { class: 'case-state' }, solved ? 'gelöst' : `${f.punkte} Punkte`)));
      })));
    }

    async function showCase(id) {
      const daten = await q.aufgabe(id);
      if (!aktiv) return;
      const f = { ...daten.aufgabe, A: dfa(daten.aufgabe.automat) };
      ctx.setSubtitle(q.demo ? `Demo-Fall: ${f.titel} (ohne Punkte)` : `Fall ${f.nr} von ${ANZAHL}: ${f.titel}`);
      let solved = daten.zustand.status !== 'offen';

      const left = h('div', { class: 'case-lab panel' });
      const playerBox = h('div', { class: 'case-player' });
      const rp = new RunPlayer(playerBox, { automat: f.A, label: q.demo ? 'Mystery-Automat (Demo)' : `Mystery-Automat für Fall ${f.nr}` });

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
      const optButtons = f.optionen.map((o, i) => {
        const b = h('button', { type: 'button', class: 'option', onclick: () => choose(o, b) },
          h('span', { class: 'option-key', 'aria-hidden': 'true' }, 'ABCD'[i]), h('span', { class: 'option-text' }, o.text));
        optList.append(h('li', null, b));
        return b;
      });

      function zeigeGeloest(r, loesung) {
        solved = true;
        optButtons.forEach((x, i) => { x.disabled = true; if (f.optionen[i].id === loesung?.richtig) x.classList.add('is-correct'); });
        const next = !q.demo && f.nr < ANZAHL ? f.nr + 1 : null;
        const versuche = r ? r.zustand.fehlversuche + 1 : null;
        clear(verdict, h('div', { class: 'notice notice-success' },
          h('p', null, h('strong', null, r ? 'Fall gelöst! ' : 'Schon gelöst. '), r ? (versuche === 1 ? 'Gleich im ersten Versuch.' : `Nach ${versuche} Versuchen.`) : ''),
          h('p', null, 'So „denkt“ der Automat – die Bedeutung der Zustände:'),
          h('dl', { class: 'meaning-list' }, Object.entries(loesung?.bedeutung ?? {}).flatMap(([s, m]) => [h('dt', null, s), h('dd', null, m)])),
          f.A.implicitError ? h('p', { class: 'muted' }, 'Nicht eingezeichnete Übergänge führen in einen Fehlerzustand.') : null,
          q.demo ? h('p', null, 'Das war die Demo. Mit Anmeldung über InfoLabs gibt es zwölf Fälle und Punkte.') : null),
        h('div', { class: 'start-actions' },
          next ? h('a', { class: 'btn btn-primary', href: ctx.link('detektiv', { fall: next }) }, `Weiter zu Fall ${next}`) : null,
          h('a', { class: 'btn', href: q.demo ? ctx.link('gast') : ctx.link('detektiv') }, q.demo ? 'Zu den Demo-Aufgaben' : 'Alle Fälle')));
        if (r) verdict.querySelector('.btn-primary, .btn')?.focus({ preventScroll: true });
      }

      async function choose(o, b) {
        if (solved || b.disabled) return;
        optButtons.forEach((x) => { x.disabled = true; });
        let r;
        try { r = await q.pruefen(id, { wahl: o.id }); } catch (e) {
          optButtons.forEach((x) => { if (!x.classList.contains('is-wrong')) x.disabled = false; });
          ctx.toast(e.message, { type: 'error' });
          return;
        }
        if (r.ok) {
          b.classList.add('is-correct');
          if (r.punkteErhalten) ctx.toast(`+${r.punkteErhalten} Punkte`, { type: 'success' });
          zeigeGeloest(r, r.loesung);
          return;
        }
        optButtons.forEach((x) => { if (!x.classList.contains('is-wrong')) x.disabled = false; });
        b.classList.add('is-wrong'); b.disabled = true;
        const g = r.rueckmeldung.gegenbeispiel;
        const w = g?.symbole ?? null;
        const shown = w ? quote(wordToString(w, f.A.alphabet)) : null;
        clear(verdict, h('div', { class: 'notice notice-error' },
          h('p', null, h('strong', null, 'Noch nicht. '), w
            ? (g.akzeptiert ? `Der Automat akzeptiert ${shown} – nach dieser Beschreibung gehört das Wort aber nicht zur Sprache.`
              : `Der Automat lehnt ${shown} ab – nach dieser Beschreibung müsste das Wort aber dazugehören.`)
            : 'Diese Beschreibung passt nicht.'),
          w ? h('button', { type: 'button', class: 'btn btn-small', onclick: () => { left.classList.remove('is-blackbox'); blackbox.checked = false; rp.load(w); rp.play(); playerBox.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } }, `Lauf für ${shown} ansehen`) : null));
      }

      right.append(h('h2', { class: 'question' }, 'Welche Sprache erkennt der Automat?'), optList, verdict);

      clear(el, h('div', { class: 'case-layout' }, left, right),
        q.demo ? null : h('nav', { class: 'case-nav', 'aria-label': 'Fälle' },
          f.nr > 1 ? h('a', { class: 'btn btn-ghost', href: ctx.link('detektiv', { fall: f.nr - 1 }) }, `‹ Fall ${f.nr - 1}`) : h('span'),
          h('a', { class: 'btn btn-ghost', href: ctx.link('detektiv') }, 'Alle Fälle'),
          f.nr < ANZAHL ? h('a', { class: 'btn btn-ghost', href: ctx.link('detektiv', { fall: f.nr + 1 }) }, `Fall ${f.nr + 1} ›`) : h('span')));
      if (solved) zeigeGeloest(null, daten.loesung);

      rp.ready.then(() => { const first = f.vorschlaege?.[0] ?? ''; rp.load(first); });
      aufraeumen = () => rp.destroy();
    }
  },
};
