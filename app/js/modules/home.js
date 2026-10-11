// Startseite: Level-Karte (die Einheit als Automat: Level = Zustände, Boss-Level = Endzustände)
// und alle Module nach Welten. Auswahl eines Levels hebt die passenden Module hervor.

import { h, clear, stateGlyph } from '../core/dom.js';
import { WORLDS, LEVELS, BOSS_LEVELS, LEVEL_TYPE, LEVEL_TYPE_LABEL } from '../data/worlds.js';

const ALL_LEVELS = WORLDS.flatMap((w) => w.levels);
import { MODULES } from './manifest.js';
import { BADGES } from '../data/badges.js';
import { progress } from '../core/progress.js';

/** Fortschrittszeile je Modul: wie viel schon gelöst ist (nur IDs zählen, die es in den Daten gibt). */
const solvedOf = (modul, ids) => ids.filter((id) => progress.isSolved(modul, id)).length;
const geloest = (n, total, was = 'gelöst') => `${n} von ${total} ${was}`;
const STATUS = {
  arena: async () => { const best = Math.max(...[1, 2, 3].map((s) => progress.best(`arena:${s}`) ?? 0)); return best ? `Rekord ${best} Punkte` : ''; },
  detektiv: async () => { const { DETEKTIV_FAELLE: F } = await import('../data/detektiv.js'); return geloest(solvedOf('detektiv', F.map((_, i) => `fall-${i + 1}`)), F.length); },
  baukasten: async () => { const { BAUKASTEN_CHALLENGES: C } = await import('../data/baukasten.js'); return geloest(solvedOf('baukasten', C.map((c) => c.id)), C.length); },
  minimierer: async () => { const { MINIMIERER_AUFGABEN: A } = await import('../data/minimierer.js'); return geloest(solvedOf('minimierer', A.map((x) => x.id)), A.length); },
  mealy: async () => { const { MEALY_AUFGABEN: A } = await import('../data/mealy.js'); return geloest(solvedOf('mealy', A.map((x) => x.id)), A.length, 'repariert'); },
  ueberliste: async () => {
    const { UEBERLISTE_STUFEN: S } = await import('../data/ueberliste.js');
    return geloest(solvedOf('ueberliste', S.map((x) => x.id)), S.length, 'überlistet') + (progress.isSolved('ueberliste', 'bonus') ? ' · Bonus' : '');
  },
  parallelwelten: async () => {
    const { PARALLELWELTEN: P } = await import('../data/parallelwelten.js');
    const r = P.flatMap((x) => x.raetsel.map((w) => `${x.id}:${w}`));
    const t = P.filter((x) => x.teilmengen).map((x) => x.id);
    return `Rätsel ${solvedOf('parallelwelten-r', r)}/${r.length} · Teilmengen ${solvedOf('parallelwelten', t)}/${t.length}`;
  },
  keller: async () => {
    const { KELLER_AUTOMATEN: K } = await import('../data/keller.js');
    const t = K.flatMap((x) => x.tabelle.map((w) => `${x.id}:${w}`));
    const r = K.flatMap((x) => x.rueckwaerts.map((w) => `${x.id}:${w}`));
    return `Tabellen ${solvedOf('keller-t', t)}/${t.length} · Rückwärts ${solvedOf('keller-r', r)}/${r.length}`;
  },
  rallye: async () => { const { RALLYE_AUFGABEN: A } = await import('../data/rallye.js'); return geloest(solvedOf('rallye', A.map((x) => x.id)), A.length); },
  grammatik: async () => { const { GRAMMATIK_CHALLENGES: C } = await import('../data/grammatik.js'); return geloest(solvedOf('grammatik', C.map((x) => x.id)), C.length); },
  sortierer: async () => { const b = progress.best('sortierer:runde'); return b != null ? `Rekord ${b} richtig einsortiert` : ''; },
  turing: async () => { const { TURING_CHALLENGES: C } = await import('../data/turing.js'); return geloest(solvedOf('turing', C.map((x) => x.id)), C.length); },
  quiz: async () => {
    const { QUIZ_WELTEN: W, QUIZ_DS: D } = await import('../data/quiz.js');
    const done = (keys) => keys.filter((k) => progress.best(`quiz:${k}`) != null).length;
    const w = Object.keys(W).map((k) => `welt-${k}`); const d = Object.keys(D).map((k) => `ds-${k}`);
    return `Welten ${done(w)}/${w.length} · Exit-Tickets ${done(d)}/${d.length}`;
  },
};

export default {
  title: 'Übersicht',
  mount(el, ctx) {
    let selected = null;
    const levelButtons = new Map();
    const tiles = [];

    const info = h('p', { class: 'map-info', 'aria-live': 'polite' });

    function select(n) {
      selected = selected === n ? null : n;
      for (const [k, b] of levelButtons) { b.classList.toggle('is-active', k === selected); b.setAttribute('aria-pressed', String(k === selected)); }
      for (const t of tiles) t.el.classList.toggle('is-dim', selected != null && !t.meta.levels.includes(selected));
      const matching = MODULES.filter((m) => m.levels.includes(selected));
      clear(info);
      if (selected != null) {
        info.append(h('strong', null, `Level ${selected}: ${LEVELS[selected]} (${LEVEL_TYPE_LABEL[LEVEL_TYPE[selected] || 'pflicht']}). `),
          matching.length ? `${matching.length === 1 ? 'Passendes Modul' : 'Passende Module'}: ${matching.map((m) => m.title).join(', ')}.` : 'In diesem Level arbeitest du ohne App.',
          ' ', h('a', { href: ctx.link('quiz', { ds: selected }) }, `Exit-Ticket DS${String(selected).padStart(2, '0')}`),
          ' · ', h('button', { type: 'button', class: 'link-button', onclick: () => select(selected) }, 'Auswahl aufheben'));
      }
    }

    // ───── Level-Karte ─────
    const map = h('div', { class: 'level-map', role: 'list', 'aria-label': 'Level-Karte' });
    WORLDS.forEach((w, wi) => {
      const chain = h('ol', { class: 'level-chain' });
      w.levels.forEach((n, i) => {
        const mods = MODULES.filter((m) => m.levels.includes(n));
        const ready = mods.some((m) => m.load);
        const boss = BOSS_LEVELS.includes(n);
        const typ = LEVEL_TYPE[n] || 'pflicht';
        const btn = h('button', {
          type: 'button', class: ['level-node', boss && 'is-boss', ready ? 'is-ready' : 'is-sketch', `is-${typ}`],
          'aria-pressed': 'false',
          'aria-label': `Level ${n}: ${LEVELS[n]} (${LEVEL_TYPE_LABEL[typ]})${boss ? ', mit Boss-Level als Extra-Training' : ''}`,
          onclick: () => select(n),
        }, h('span', { class: 'level-num' }, String(n)));
        levelButtons.set(n, btn);
        chain.append(h('li', { class: ['level-step', wi === 0 && i === 0 && 'is-first', i === 0 && wi > 0 && 'is-continued'] },
          btn, h('span', { class: 'level-name', 'aria-hidden': 'true' }, LEVELS[n], typ !== 'pflicht' ? h('span', { class: `type-tag type-${typ}` }, LEVEL_TYPE_LABEL[typ]) : null, boss ? h('span', { class: 'boss-tag' }, 'Boss-Level (Extra)') : null)));
      });
      map.append(h('section', { class: 'world-row', role: 'listitem', 'aria-labelledby': `welt-${w.id}` },
        h('h3', { class: 'world-label', id: `welt-${w.id}` }, h('span', { class: 'world-letter' }, `Welt ${w.id}`), h('span', { class: 'world-title' }, w.title)),
        h('div', { class: 'chain-scroller' }, chain)));
    });

    // ───── Module nach Welten ─────
    const catalogue = h('div', { class: 'catalogue' });
    const groups = [...WORLDS.map((w) => ({ id: w.id, title: `Welt ${w.id}: ${w.title}` })), { id: null, title: 'Für alle Welten' }];
    for (const g of groups) {
      const mods = MODULES.filter((m) => m.world === g.id);
      if (!mods.length) continue;
      const grid = h('ul', { class: 'tile-grid' });
      for (const m of mods) {
        const status = h('span', { class: 'tile-status' });
        const tile = h('li', { class: ['tile', m.load ? 'is-ready' : 'is-sketch'] },
          h('a', { class: 'tile-link', href: ctx.link(m.route) },
            h('span', { class: 'tile-title' }, m.title),
            h('span', { class: 'tile-blurb' }, m.blurb),
            h('span', { class: 'tile-foot' },
              h('span', { class: 'tile-levels' }, m.levels.length && m.levels.length < ALL_LEVELS.length ? `Level ${m.levels.join(', ')}` : 'Alle Level'),
              m.load ? status : h('span', { class: 'tile-soon' }, 'bald verfügbar'))));
        tiles.push({ el: tile, meta: m });
        grid.append(tile);
        if (m.load && STATUS[m.route]) STATUS[m.route]().then((text) => { status.textContent = text; }).catch(() => {});
      }
      catalogue.append(h('section', { class: 'catalogue-group' }, h('h3', null, g.title), grid));
    }

    // ───── Fortschritt ─────
    const badgeList = h('ul', { class: 'badge-list' });
    const pointsBig = h('p', { class: 'points-big' });
    const renderProgress = () => {
      clear(pointsBig, h('span', { class: 'points-num' }, String(progress.points)), ' Punkte');
      clear(badgeList, BADGES.map((b) => {
        const have = progress.hasBadge(b.id);
        return h('li', { class: ['badge', have ? 'is-earned' : 'is-locked'] },
          stateGlyph({ accepting: true, size: 34 }),
          h('span', { class: 'badge-text' }, h('strong', null, b.titel), h('span', null, b.text),
            h('span', { class: 'sr-only' }, have ? ' (erreicht)' : ' (noch nicht erreicht)')));
      }));
    };
    renderProgress();
    const unsub = progress.subscribe(renderProgress);

    const resetBtn = h('button', { type: 'button', class: 'btn btn-danger-ghost', onclick: () => {
      if (window.confirm('Wirklich alle Punkte, gelösten Challenges und Abzeichen auf diesem Gerät löschen?')) {
        progress.reset();
        ctx.toast('Dein Fortschritt wurde zurückgesetzt.', { type: 'info' });
        ctx.navigate('', {}, { replace: true });
      }
    } }, 'Fortschritt zurücksetzen');

    clear(el,
      h('section', { class: 'hero' },
        h('div', { class: 'hero-text' },
          h('h1', { class: 'hero-title' }, 'Maschinen, die Sprache verstehen'),
          h('p', { class: 'hero-lead' }, 'Neun Pflicht-Level, drei Vertiefungen und Bonus-Level für Neugierige – ein Ziel: Automaten und formale Sprachen so sicher beherrschen, dass dich im Abitur nichts überrascht. Tippe auf ein Level, um die passenden Module zu sehen.')),
        h('div', { class: 'map-panel' }, map,
          h('p', { class: 'map-legend' }, h('span', { class: 'legend-item legend-pflicht' }, 'Pflicht'), h('span', { class: 'legend-item legend-vertiefung' }, 'Vertiefung'), h('span', { class: 'legend-item legend-bonus' }, 'Bonus')),
          info)),
      h('section', { class: 'page-section', 'aria-labelledby': 'module-h' },
        h('h2', { id: 'module-h' }, 'Module'),
        catalogue),
      h('section', { class: 'page-section progress-section', 'aria-labelledby': 'fortschritt-h' },
        h('div', { class: 'progress-head' },
          h('h2', { id: 'fortschritt-h' }, 'Dein Fortschritt'), pointsBig),
        h('p', { class: 'muted' }, 'Gespeichert wird nur auf diesem Gerät, ohne Namen und ohne Cookies. Auf einem anderen iPad beginnst du bei null.'),
        badgeList,
        h('p', null, resetBtn)));

    return () => unsub();
  },
};
