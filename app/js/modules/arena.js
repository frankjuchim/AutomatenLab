// Akzeptor-Arena (#/arena): Graph + Wort → „akzeptiert“ oder „abgelehnt“? 60-Sekunden-Runden.
// Deep-Links: #/arena?stufe=1|2|3 (alias ?level=), #/arena?automat=<id> (nur dieser Automat),
//             &ueben=1 (ohne Zeitlimit)
// Training (docs/AUFGABENFORMAT.md): Angemeldet erzeugt der Server die Runde und zählt am Ende die Antworten
// (1 Punkt je richtiger Antwort, Tageshöchstwert; Rekord je Stufe nur für Zeitrunden). Gäste spielen lokal ohne Punkte.

import { h, clear, reducedMotion } from '../core/dom.js';
import { ARENA_AUTOMATEN, ARENA_LEVELS } from '../data/arena.js';
import { dfa, runDFA } from '../engine/dfa.js';
import { wordToString } from '../engine/tokenize.js';
import { arenaPunkte, RUNDE_SEK } from '../engine/training.js';
import { lokalesTraining } from '../core/aufgaben.js';
import { sitzung } from '../core/sitzung.js';
import { GraphView } from '../components/graph-view.js';
import { WordTape } from '../components/word-tape.js';
import { RunPlayer } from '../components/run-player.js';
import { openDialog } from '../components/dialog.js';

// Automaten einmal normalisieren
const AUTOMATEN = ARENA_AUTOMATEN.map((a) => ({ ...a, A: dfa(a.automat) }));

export default {
  title: 'Akzeptor-Arena',
  mount(el, ctx) {
    const p = ctx.params;
    const onlyId = p.get('automat');
    const only = onlyId ? AUTOMATEN.find((a) => a.id === onlyId) : null;
    let stufe = clampStufe(p.get('stufe') ?? p.get('level') ?? (only ? only.level[0] : 1));
    let ueben = p.get('ueben') === '1';
    let cleanupRound = null;
    let aktiv = true;
    // Training: Server (angemeldet) oder lokal im Browser (Gast, Demo) – gleiche Runden, lokal ohne Punkte
    let T = null;
    const training = async () => (T ??= (ctx.quelle.demo || !(await sitzung()).konto) ? lokalesTraining({ arena: ARENA_AUTOMATEN }) : ctx.quelle.training);
    const BY_ID = new Map(AUTOMATEN.map((a) => [a.id, a]));

    ctx.setSubtitle('Lies das Wort, verfolge den Graphen und entscheide schnell.');

    function startScreen() {
      cleanupRound?.(); cleanupRound = null;
      const choices = h('div', { class: 'choice-row', role: 'radiogroup', 'aria-label': 'Stufe wählen' });
      const renderChoices = () => clear(choices, [1, 2, 3].map((s) => {
        const best = ctx.progress.best(`arena:${s}`);
        return h('button', {
          type: 'button', role: 'radio', 'aria-checked': String(s === stufe), class: ['choice', s === stufe && 'is-selected'],
          onclick: () => { stufe = s; renderChoices(); },
        }, h('span', { class: 'choice-title' }, `Stufe ${s}`), h('span', { class: 'choice-text' }, ARENA_LEVELS[s].text),
        h('span', { class: 'choice-meta' }, best ? `Dein Rekord: ${best}` : 'Noch kein Rekord'));
      }));
      renderChoices();
      const uebenBox = h('input', { type: 'checkbox', id: 'arena-ueben', checked: ueben, onchange: (e) => { ueben = e.target.checked; } });
      clear(el, h('div', { class: 'arena-start panel' },
        only ? h('p', { class: 'notice' }, `Diese Runde läuft nur mit dem Automaten „${only.titel}“.`) : null,
        h('div', { class: 'how-to' },
          h('p', { class: 'lead' }, `${RUNDE_SEK} Sekunden. Zu jedem Wort entscheidest du: Akzeptiert der Automat oder lehnt er ab?`),
          h('ul', { class: 'key-hints' },
            h('li', null, h('kbd', null, '←'), ' oder linke Taste: abgelehnt'),
            h('li', null, h('kbd', null, '→'), ' oder rechte Taste: akzeptiert'),
            h('li', null, 'Richtige Antworten in Serie geben Bonuspunkte. Nach der Runde siehst du bei jedem Fehler, warum.'))),
        only ? null : choices,
        h('div', { class: 'start-actions' },
          h('label', { class: 'check', for: 'arena-ueben' }, uebenBox, ' Ohne Zeitlimit üben'),
          h('button', { type: 'button', class: 'btn btn-primary btn-large', onclick: () => play() }, 'Runde starten'))));
      el.querySelector('.btn-primary')?.focus({ preventScroll: true });
    }

    async function play() {
      cleanupRound?.(); cleanupRound = null;
      clear(el, h('p', { class: 'muted' }, 'Runde wird vorbereitet …'));
      let runde;
      try {
        const t = await training();
        runde = await t.neu('arena', { stufe, ...(only ? { automat: only.id } : {}), ...(ueben ? { ueben: true } : {}) });
      } catch (e) {
        if (aktiv) clear(el, h('p', { class: 'notice notice-error' }, e.message), h('button', { type: 'button', class: 'btn', onclick: () => startScreen() }, 'Zurück'));
        return;
      }
      if (!aktiv) return;
      const items = runde.items.map((x) => ({ automat: BY_ID.get(x.automat), tokens: x.wort }));
      const antworten = [];
      const st = { score: 0, streak: 0, bestStreak: 0, right: 0, wrong: 0, mistakes: [], item: null, cur: null, k: -1, locked: false, timeLeft: RUNDE_SEK, over: false };

      const timeFill = h('span', { class: 'time-fill' });
      const timeText = h('span', { class: 'time-text' });
      const scoreEl = h('span', { class: 'stat-value' }, '0');
      const streakEl = h('span', { class: 'stat-value' }, '0');
      const titleEl = h('h2', { class: 'arena-automat-title' });
      const sigmaEl = h('p', { class: 'sigma' });
      const graphBox = h('div', { class: 'arena-graph' });
      const gv = new GraphView(graphBox);
      const tapeBox = h('div', { class: 'arena-tape' });
      const tape = new WordTape(tapeBox, { size: 'l', label: 'Eingabewort' });
      const feedback = h('p', { class: 'arena-feedback', 'aria-live': 'polite' });
      const bNo = h('button', { type: 'button', class: 'decide decide-no', onclick: () => answer(false) }, h('kbd', { 'aria-hidden': 'true' }, '←'), h('span', null, 'abgelehnt'));
      const bYes = h('button', { type: 'button', class: 'decide decide-yes', onclick: () => answer(true) }, h('span', null, 'akzeptiert'), h('kbd', { 'aria-hidden': 'true' }, '→'));

      const hud = h('div', { class: 'arena-hud' },
          ueben ? h('span', { class: 'time-text' }, 'Übungsmodus') : h('div', { class: 'timebar', role: 'timer', 'aria-label': 'Restzeit' }, timeFill, timeText),
          h('span', { class: 'stat' }, h('span', { class: 'stat-label' }, 'Punkte'), scoreEl),
          h('span', { class: 'stat' }, h('span', { class: 'stat-label' }, 'Serie'), streakEl),
          h('button', { type: 'button', class: 'btn btn-ghost btn-small', onclick: () => finish() }, 'Runde beenden'));
      clear(el, h('div', { class: 'arena-play' }, hud,
        h('div', { class: 'arena-stage panel' },
          h('div', { class: 'arena-stage-head' }, titleEl, sigmaEl),
          graphBox, tapeBox, feedback),
        h('div', { class: 'decide-row' }, bNo, bYes)));

      function nextItem() {
        st.k++;
        if (st.k >= items.length) { finish(); return; }
        const it = items[st.k];
        if (it.automat !== st.cur) {
          st.cur = it.automat;
          titleEl.textContent = st.cur.titel;
          sigmaEl.textContent = `Σ = {${st.cur.A.alphabet.join(', ')}}`;
          gv.render(st.cur.A, { label: `${st.cur.titel}. ${st.cur.kontext}` });
          if (st.right + st.wrong > 0) { feedback.textContent = 'Neuer Automat!'; }
        }
        // sofortige Rückmeldung aus dem sichtbaren Automaten; gezählt wird am Ende von der Quelle
        st.item = { automat: st.cur, tokens: it.tokens, accepted: runDFA(st.cur.A, it.tokens).accepted };
        tape.set(it.tokens); tape.setHead(-1);
        st.locked = false;
      }

      function answer(saysYes) {
        if (st.locked || st.over || !st.item) return;
        st.locked = true;
        antworten.push(saysYes);
        const ok = saysYes === st.item.accepted;
        if (ok) {
          st.right++; st.streak++;
          st.bestStreak = Math.max(st.bestStreak, st.streak);
          st.score += arenaPunkte(st.streak);
          tape.flash('good');
          feedback.textContent = st.streak >= 3 ? `Richtig! Serie ${st.streak}` : 'Richtig!';
        } else {
          st.wrong++; st.streak = 0;
          st.mistakes.push(st.item);
          tape.flash('bad');
          const correct = st.item.accepted ? 'akzeptiert' : 'abgelehnt';
          clear(feedback, `Falsch: Das Wort wird ${correct}. `,
            ueben ? h('button', { type: 'button', class: 'link-button', onclick: () => explain(st.mistakes.at(-1)) }, 'Zeig mir warum') : 'Nach der Runde siehst du, warum.');
        }
        scoreEl.textContent = String(st.score);
        streakEl.textContent = String(st.streak);
        tape.setVerdict(st.item.accepted ? 'accept' : 'reject');
        setTimeout(() => { if (!st.over) nextItem(); }, ok ? (reducedMotion() ? 350 : 450) : (ueben ? 1400 : 900));
      }

      const onKey = (e) => {
        if (e.target.closest?.('input, textarea, select, dialog')) return;
        if (e.key === 'ArrowLeft') { e.preventDefault(); answer(false); }
        if (e.key === 'ArrowRight') { e.preventDefault(); answer(true); }
      };
      window.addEventListener('keydown', onKey);

      let timer = null;
      const t0 = performance.now();
      if (!ueben) {
        const tick = () => {
          const left = Math.max(0, RUNDE_SEK - (performance.now() - t0) / 1000);
          st.timeLeft = left;
          timeFill.style.transform = `scaleX(${left / RUNDE_SEK})`;
          timeText.textContent = `${Math.ceil(left)} s`;
          timeFill.parentElement.classList.toggle('is-low', left < 10);
          if (left <= 0) finish();
        };
        tick();
        timer = setInterval(tick, 200);
      }

      function stop() { st.over = true; clearInterval(timer); window.removeEventListener('keydown', onKey); }
      cleanupRound = stop;

      async function finish() {
        if (st.over) return;
        stop();
        cleanupRound = null;
        let erg = null;
        try { erg = await (await training()).ende(runde.id, antworten); } catch (e) { erg = { fehler: e.message }; }
        if (aktiv) result(st, erg);
      }

      nextItem();
      bYes.focus({ preventScroll: true });
      // Spielfläche (Zeit, Graph, Wort, Knöpfe) vollständig in den sichtbaren Bereich holen
      requestAnimationFrame(() => hud.scrollIntoView({ block: 'start', behavior: 'instant' }));
    }

    function result(st, erg) {
      const total = st.right + st.wrong;
      const lokal = T?.lokal !== false;
      const record = !!erg?.rekord;
      const prevBest = erg?.rekordVorher ?? 0;

      const list = h('ul', { class: 'mistake-list' }, st.mistakes.map((m) =>
        h('li', null,
          h('span', { class: 'mistake-word' }, wordToString(m.tokens, m.automat.A.alphabet)),
          h('span', { class: 'mistake-info' }, `${m.automat.titel}: wird ${m.accepted ? 'akzeptiert' : 'abgelehnt'}`),
          h('button', { type: 'button', class: 'btn btn-small', onclick: () => explain(m) }, 'Zeig mir warum'))));

      clear(el, h('div', { class: 'arena-result panel' },
        h('h2', null, ueben ? 'Übungsrunde beendet' : 'Zeit ist um!'),
        h('div', { class: 'result-stats' },
          h('p', { class: 'result-big' }, h('span', { class: 'num' }, String(st.score)), ' Punkte'),
          h('p', null, `${st.right} von ${total} richtig`, total ? ` (${Math.round((100 * st.right) / total)} %)` : ''),
          h('p', null, `Längste Serie: ${st.bestStreak}`),
          record && prevBest > 0 ? h('p', { class: 'record' }, `Neuer Rekord in Stufe ${stufe}! Vorher: ${prevBest}`) : null,
          record && prevBest === 0 && st.score > 0 ? h('p', { class: 'record' }, `Dein erster Rekord in Stufe ${stufe}.`) : null,
          erg?.fehler ? h('p', { class: 'notice notice-error' }, `Die Runde konnte nicht gezählt werden: ${erg.fehler}`) : null,
          erg?.zuSpaet ? h('p', { class: 'muted' }, 'Die Runde wurde zu spät beendet – sie zählt nicht für den Rekord.') : null,
          !lokal && erg && !erg.fehler ? h('p', { class: 'muted' }, `+${erg.punkteErhalten} Trainingspunkte (heute ${erg.heute} von höchstens ${erg.maxProTag}).`) : null,
          lokal && !ctx.quelle.demo ? h('p', { class: 'muted' }, 'Ohne Anmeldung zählt die Runde nicht – Punkte und Rekorde gibt es nach der Anmeldung über InfoLabs.') : null),
        st.mistakes.length
          ? h('section', { class: 'mistakes' }, h('h3', null, 'Deine Fehler – schau dir den Lauf an'), list)
          : (total ? h('p', { class: 'notice notice-success' }, 'Kein einziger Fehler. Stark!') : null),
        h('div', { class: 'start-actions' },
          h('button', { type: 'button', class: 'btn btn-primary btn-large', onclick: () => play() }, `Nochmal: Stufe ${stufe}`),
          only ? null : h('button', { type: 'button', class: 'btn', onclick: () => startScreen() }, 'Andere Stufe wählen'))));
      el.querySelector('.btn-primary')?.focus({ preventScroll: true });
    }

    function explain(item) {
      const body = h('div', { class: 'explain' },
        h('p', { class: 'explain-context' }, item.automat.kontext));
      let rp;
      openDialog({ title: `Warum wird ${quoteWord(item)} ${item.accepted ? 'akzeptiert' : 'abgelehnt'}?`, body, onClose: () => rp?.destroy() });
      rp = new RunPlayer(body, { automat: item.automat.A, meanings: item.automat.bedeutung, speed: reducedMotion() ? 1100 : 800 });
      rp.ready.then(() => { rp.load(item.tokens); rp.play(); });
    }

    const quoteWord = (item) => (item.tokens.length ? `„${wordToString(item.tokens, item.automat.A.alphabet)}“` : 'ε');

    startScreen();
    return () => { aktiv = false; cleanupRound?.(); };
  },
};

function clampStufe(x) { const n = Number(x); return n >= 1 && n <= 3 ? Math.floor(n) : 1; }
