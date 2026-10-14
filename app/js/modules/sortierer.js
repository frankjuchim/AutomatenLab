// Chomsky-Sortierer (#/sortierer): Sprachkarten per Drag & Drop oder Tippen in die Fächer
// „DEA reicht“ (Typ 3), „Kellerautomat nötig“ (Typ 2), „mehr nötig“ (Turingmaschine) einordnen.
// Runde mit 10 Karten, kurze Begründung nach jeder Karte, Chomsky-Hierarchie als verschachtelte Mengen füllt sich.
// Deep-Link: #/sortierer?runde=1 (direkt starten), #/sortierer?alle=1 (alle Karten in zufälliger Reihenfolge)
// Training (docs/AUFGABENFORMAT.md): Angemeldet erzeugt der Server die Runde; Fach und Begründung kommen erst nach der
// Antwort (je Karte zählt die erste Antwort, 1 Punkt je richtiger Karte, Tageshöchstwert; Rekord nur für Zehnerrunden).
// Gäste spielen lokal mit eigenen Demo-Karten (DEMO_SORTIERER) ohne Punkte.

import { h, clear, reducedMotion } from '../core/dom.js';
import { FAECHER } from '../data/sortierer.js';
import { DEMO_SORTIERER } from '../data/demo.js';
import { SORTIERER_RUNDE as RUNDE } from '../engine/training.js';
import { lokalesTraining } from '../core/aufgaben.js';
import { sitzung } from '../core/sitzung.js';

const NS = 'http://www.w3.org/2000/svg';
const ORDER = [3, 2, 0];

export default {
  title: 'Chomsky-Sortierer',
  mount(el, ctx) {
    let cleanupRound = null;
    let aktiv = true;
    const direct = ctx.params.get('runde') === '1';
    const alle = ctx.params.get('alle') === '1';
    // Training: Server (angemeldet) oder lokal im Browser mit Demo-Karten (Gast, Demo) – lokal ohne Punkte
    let T = null;
    const training = async () => (T ??= (ctx.quelle.demo || !(await sitzung()).konto) ? lokalesTraining({ sortierer: DEMO_SORTIERER }) : ctx.quelle.training);
    ctx.setSubtitle('Welche Maschine braucht diese Sprache? Sortiere – möglichst speziell.');

    function start() {
      cleanupRound?.(); cleanupRound = null;
      const best = ctx.progress.best('sortierer:runde');
      clear(el, h('div', { class: 'panel arena-start' },
        h('p', { class: 'lead' }, `${RUNDE} Sprachkarten, drei Fächer. Ziehe jede Karte in das passende Fach oder tippe das Fach an. Regel: immer die einfachste Maschine wählen, die ausreicht.`),
        h('ul', { class: 'key-hints' },
          h('li', null, h('strong', null, 'DEA reicht (Typ 3): '), 'kein unbeschränktes Zählen, keine Verschachtelung – auch jede endliche Sprache.'),
          h('li', null, h('strong', null, 'Kellerautomat nötig (Typ 2): '), 'ein Vergleich oder eine Verschachtelung mit unbegrenzter Tiefe.'),
          h('li', null, h('strong', null, 'Mehr nötig (Turingmaschine): '), 'mehrere gekreuzte Vergleiche, Kopien, Rechnen.')),
        best != null ? h('p', { class: 'record' }, `Dein Rekord: ${best} von ${RUNDE}`) : null,
        h('div', { class: 'start-actions' },
          h('button', { type: 'button', class: 'btn btn-primary btn-large', onclick: () => play(false) }, 'Runde starten'),
          h('button', { type: 'button', class: 'btn', onclick: () => play(true) }, 'Alle Karten'))));
    }

    async function play(all) {
      cleanupRound?.(); cleanupRound = null;
      clear(el, h('p', { class: 'muted' }, 'Runde wird vorbereitet …'));
      let runde;
      try {
        runde = await (await training()).neu('sortierer', all ? { alle: true } : {});
      } catch (e) {
        if (aktiv) clear(el, h('p', { class: 'notice notice-error' }, e.message), h('button', { type: 'button', class: 'btn', onclick: () => start() }, 'Zurück'));
        return;
      }
      if (!aktiv) return;
      const deck = runde.items;
      const st = { i: 0, right: 0, answered: false, busy: false, over: false, log: [] };
      const total = deck.length;

      const progressEl = h('span', { class: 'stat-value' }, `1 / ${total}`);
      const scoreEl = h('span', { class: 'stat-value' }, '0');
      const cardEl = h('div', { class: 'lang-card', draggable: 'true', tabindex: '0', role: 'group', 'aria-label': 'Sprachkarte' });
      const feedback = h('div', { class: 'sort-feedback', 'aria-live': 'polite' });
      const nextBtn = h('button', { type: 'button', class: 'btn btn-primary', hidden: true, onclick: () => next() }, 'Nächste Karte');
      const bins = ORDER.map((typ) => {
        const b = h('button', { type: 'button', class: ['bin', `bin-${typ}`], dataset: { typ }, onclick: () => answer(typ) },
          h('span', { class: 'bin-kurz' }, FAECHER[typ].kurz), h('span', { class: 'bin-name' }, FAECHER[typ].name), h('span', { class: 'bin-text' }, FAECHER[typ].text));
        b.addEventListener('dragover', (e) => { e.preventDefault(); b.classList.add('is-over'); });
        b.addEventListener('dragleave', () => b.classList.remove('is-over'));
        b.addEventListener('drop', (e) => { e.preventDefault(); b.classList.remove('is-over'); answer(typ); });
        return b;
      });
      cardEl.addEventListener('dragstart', (e) => { e.dataTransfer?.setData('text/plain', String(st.i)); cardEl.classList.add('is-dragging'); });
      cardEl.addEventListener('dragend', () => cardEl.classList.remove('is-dragging'));
      // Tastatur: 1/2/3 wählt ein Fach
      const onKey = (e) => { if (e.target.closest?.('input, textarea, select, dialog')) return; const k = { 1: 3, 2: 2, 3: 0 }[e.key]; if (k != null && !st.answered) { e.preventDefault(); answer(k); } };
      window.addEventListener('keydown', onKey);
      cleanupRound = () => window.removeEventListener('keydown', onKey);

      // Hierarchie-Bild
      const hier = hierarchy();

      function showCard() {
        const c = deck[st.i];
        st.answered = false;
        clear(cardEl, h('span', { class: 'lang-card-label' }, 'Sprache'), h('span', { class: 'lang-card-text' }, c.text), h('span', { class: 'lang-card-hint muted' }, 'ziehen oder Fach antippen (Tasten 1, 2, 3)'));
        cardEl.classList.remove('is-right', 'is-wrong');
        progressEl.textContent = `${st.i + 1} / ${total}`;
        clear(feedback); nextBtn.hidden = true;
        bins.forEach((b) => { b.disabled = false; b.classList.remove('is-correct', 'is-wrong'); });
        cardEl.focus({ preventScroll: true });
      }

      async function answer(typ) {
        if (st.answered || st.busy || st.over) return;
        st.busy = true;
        bins.forEach((b) => { b.disabled = true; });
        const c = deck[st.i];
        let r;
        try {
          r = await (await training()).antwort(runde.id, st.i, typ);
        } catch (e) {
          st.busy = false;
          if (!aktiv) return;
          bins.forEach((b) => { b.disabled = false; });
          clear(feedback, h('p', { class: 'notice notice-error' }, e.message));
          return;
        }
        st.busy = false;
        if (!aktiv || st.over) return;
        st.answered = true;
        const ok = r.richtig;
        if (ok) st.right++;
        st.log.push({ text: c.text, typ: r.typ, warum: r.warum, ok });
        scoreEl.textContent = String(st.right);
        cardEl.classList.add(ok ? 'is-right' : 'is-wrong');
        bins.forEach((b) => { if (Number(b.dataset.typ) === r.typ) b.classList.add('is-correct'); else if (Number(b.dataset.typ) === typ) b.classList.add('is-wrong'); });
        hier.add(r.typ, ok);
        clear(feedback, h('div', { class: ['notice', ok ? 'notice-success' : 'notice-error'] },
          h('p', null, h('strong', null, ok ? 'Richtig. ' : `Nein – ${FAECHER[r.typ].kurz}: ${FAECHER[r.typ].name}. `), r.warum)));
        nextBtn.hidden = false;
        nextBtn.textContent = st.i + 1 < total ? 'Nächste Karte' : 'Auswertung';
        nextBtn.focus({ preventScroll: true });
      }

      function next() {
        st.i++;
        if (st.i >= total) return finish();
        showCard();
      }

      async function finish() {
        if (st.over) return;
        st.over = true;
        cleanupRound?.(); cleanupRound = null;
        clear(el, h('p', { class: 'muted' }, 'Runde wird ausgewertet …'));
        let erg = null;
        try { erg = await (await training()).ende(runde.id, []); } catch (e) { erg = { fehler: e.message }; }
        if (aktiv) result(erg);
      }

      function result(erg) {
        const lokal = T?.lokal !== false;
        const gespielt = st.log.length;
        clear(el, h('div', { class: 'panel arena-result' },
          h('h2', null, 'Runde beendet'),
          h('div', { class: 'result-stats' },
            h('p', { class: 'result-big' }, h('span', { class: 'num' }, String(st.right)), ` von ${gespielt < total ? `${gespielt} gespielten (${total})` : total} richtig`),
            erg?.rekord ? h('p', { class: 'record' }, 'Neuer Rekord!') : null,
            erg?.fehler ? h('p', { class: 'notice notice-error' }, `Die Runde konnte nicht gezählt werden: ${erg.fehler}`) : null,
            !lokal && erg && !erg.fehler ? h('p', { class: 'muted' }, `+${erg.punkteErhalten} Trainingspunkte (heute ${erg.heute} von höchstens ${erg.maxProTag}).`) : null,
            lokal && !ctx.quelle.demo ? h('p', { class: 'muted' }, 'Ohne Anmeldung spielst du mit Demo-Karten – Punkte, Rekorde und alle Karten gibt es nach der Anmeldung über InfoLabs.') : null),
          h('div', { class: 'sort-result-layout' },
            h('div', null, h('h3', null, 'Die Landkarte deiner Runde'), hier.el),
            h('div', null, h('h3', null, 'Alle Karten dieser Runde'),
              h('ul', { class: 'sort-log' }, st.log.map((e) => h('li', { class: e.ok ? 'is-yes' : 'is-no' },
                h('span', { class: 'sort-log-text' }, e.text),
                h('span', { class: 'sort-log-typ' }, `${FAECHER[e.typ].kurz} · ${FAECHER[e.typ].name}`),
                e.ok ? null : h('span', { class: 'sort-log-why muted' }, e.warum)))))),
          h('div', { class: 'start-actions' },
            h('button', { type: 'button', class: 'btn btn-primary btn-large', onclick: () => play(all) }, 'Nochmal'),
            h('button', { type: 'button', class: 'btn', onclick: () => start() }, 'Zum Start'))));
        el.querySelector('.btn-primary')?.focus({ preventScroll: true });
      }

      clear(el, h('div', { class: 'sort-play' },
        h('div', { class: 'arena-hud' },
          h('span', { class: 'stat' }, h('span', { class: 'stat-label' }, 'Karte'), progressEl),
          h('span', { class: 'stat' }, h('span', { class: 'stat-label' }, 'Richtig'), scoreEl),
          h('button', { type: 'button', class: 'btn btn-ghost btn-small', onclick: () => finish() }, 'Runde beenden')),
        h('div', { class: 'sort-layout' },
          h('div', { class: 'sort-main' },
            cardEl,
            h('div', { class: 'bin-row' }, bins),
            feedback,
            h('div', { class: 'start-actions' }, nextBtn)),
          h('div', { class: 'sort-side panel' }, h('h3', null, 'Chomsky-Hierarchie'), h('p', { class: 'muted' }, 'Jede Sprachklasse enthält die kleineren. Richtig sortierte Karten erscheinen als Punkte.'), hier.el))));
      showCard();
    }

    if (direct || alle) play(alle); else start();
    return () => { aktiv = false; cleanupRound?.(); };
  },
};

/** Verschachtelte Mengen Typ 3 ⊂ Typ 2 ⊂ Typ 0/1 als SVG; add(typ, ok) setzt einen Punkt in die passende Zone. */
function hierarchy() {
  const W = 360; const H = 250;
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('class', 'chomsky'); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', 'Chomsky-Hierarchie als verschachtelte Mengen');
  const rect = (x, y, w, hh, cls) => { const r = document.createElementNS(NS, 'rect'); r.setAttribute('x', x); r.setAttribute('y', y); r.setAttribute('width', w); r.setAttribute('height', hh); r.setAttribute('rx', 18); r.setAttribute('class', cls); return r; };
  const text = (x, y, t, cls) => { const e = document.createElementNS(NS, 'text'); e.setAttribute('x', x); e.setAttribute('y', y); e.setAttribute('class', cls); e.textContent = t; return e; };
  svg.append(rect(6, 6, W - 12, H - 12, 'zone zone-0'), text(16, 26, 'Typ 0/1 · Turingmaschine', 'zone-label'),
    rect(40, 50, W - 80, H - 70, 'zone zone-2'), text(50, 70, 'Typ 2 · kontextfrei · Kellerautomat', 'zone-label'),
    rect(80, 95, W - 160, H - 125, 'zone zone-3'), text(90, 115, 'Typ 3 · regulär · DEA', 'zone-label'));
  const dots = document.createElementNS(NS, 'g'); svg.append(dots);
  const slots = {
    3: [[110, 160], [140, 160], [170, 160], [200, 160], [230, 160], [260, 160], [110, 190], [140, 190], [170, 190], [200, 190], [230, 190], [260, 190], [125, 135], [155, 135], [185, 135], [215, 135]],
    2: [[60, 105], [60, 135], [60, 165], [60, 195], [300, 105], [300, 135], [300, 165], [300, 195], [110, 215], [150, 215], [190, 215], [230, 215], [270, 215]],
    0: [[25, 60], [25, 95], [25, 130], [25, 165], [25, 200], [335, 60], [335, 95], [335, 130], [335, 165], [335, 200], [120, 238], [180, 238], [240, 238]],
  };
  const used = { 3: 0, 2: 0, 0: 0 };
  return {
    el: svg,
    add(typ, ok) {
      const s = slots[typ][used[typ] % slots[typ].length]; used[typ]++;
      const d = document.createElementNS(NS, 'circle');
      d.setAttribute('cx', s[0]); d.setAttribute('cy', s[1]); d.setAttribute('r', 8);
      d.setAttribute('class', `dot ${ok ? 'is-ok' : 'is-bad'}${reducedMotion() ? '' : ' is-new'}`);
      dots.append(d);
    },
  };
}
