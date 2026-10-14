// Startseite: Level-Karte (die Einheit als Automat: Level = Zustände, Boss-Level = Endzustände)
// und alle Module nach Welten. Auswahl eines Levels hebt die passenden Module hervor.
// Angemeldete Schüler sehen die Kurs-Einstellungen ihrer Lehrkraft (GET /api/meine-kurse): Auftrag oben, Level-Art je
// Level (Pflicht/Vertiefung/Bonus/Später), im Grundkurs eA-Level als „freiwillig“ – nur Anzeige, Links bleiben offen.

import { h, clear, stateGlyph } from '../core/dom.js';
import { WORLDS, LEVELS, BOSS_LEVELS, LEVEL_TYPE, LEVEL_TYPE_LABEL } from '../data/worlds.js';

const ALL_LEVELS = WORLDS.flatMap((w) => w.levels);
import { MODULES } from './manifest.js';
import { BADGES } from '../data/badges.js';
import { progress } from '../core/progress.js';
import { api } from '../core/api.js';
import { sitzung, anmeldeLink } from '../core/sitzung.js';
import { heroAutomat } from '../components/hero-automat.js';
import { LEVEL_NIVEAU, MODUL_NIVEAU, NIVEAUS, BOSS_NIVEAU } from '../data/niveaus.js';
import { niveauEtikett, niveauPille } from '../components/niveau.js';
import { materialLinks } from '../components/material-links.js';

let katalogCache = null;
/** Öffentlicher Aufgabenkatalog des Servers (Titel, Stufe, Punkte – keine Lösungen); offline: leer. */
const katalog = async (modul) => {
  katalogCache ??= api('GET', '/api/katalog').then((r) => r.aufgaben).catch(() => []);
  return (await katalogCache).filter((a) => a.modul === modul);
};

/** Fortschrittszeile je Modul: wie viel schon gelöst ist (nur IDs zählen, die es in den Daten gibt). */
const solvedOf = (modul, ids) => ids.filter((id) => progress.isSolved(modul, id)).length;
const geloest = (n, total, was = 'gelöst') => `${n} von ${total} ${was}`;
const STATUS = {
  arena: async () => { const best = Math.max(...[1, 2, 3].map((s) => progress.best(`arena:${s}`) ?? 0)); return best ? `Rekord ${best} Punkte` : ''; },
  // Module mit Prüfung auf dem Server: Aufgabenliste aus dem öffentlichen Katalog (ohne Lösungen)
  detektiv: async () => { const F = await katalog('detektiv'); return geloest(solvedOf('detektiv', F.map((f) => `fall-${f.nr}`)), F.length); },
  baukasten: async () => { const C = await katalog('baukasten'); return geloest(solvedOf('baukasten', C.map((c) => c.schluessel)), C.length); },
  minimierer: async () => { const A = await katalog('minimierer'); return geloest(solvedOf('minimierer', A.map((x) => x.schluessel)), A.length); },
  mealy: async () => { const A = (await katalog('mealy')).filter((a) => a.art === 'bugjagd'); return geloest(solvedOf('mealy', A.map((x) => x.schluessel)), A.length, 'repariert'); },
  ueberliste: async () => {
    const S = (await katalog('ueberliste')).filter((a) => a.art !== 'bonus');
    return geloest(solvedOf('ueberliste', S.map((x) => x.schluessel)), S.length, 'überlistet') + (progress.isSolved('ueberliste', 'bonus') ? ' · Bonus' : '');
  },
  parallelwelten: async () => {
    const K = await katalog('parallelwelten');
    const r = K.filter((a) => a.art === 'raetsel').map((a) => a.schluessel);
    const t = K.filter((a) => a.art === 'teilmengen').map((a) => a.schluessel);
    return `Rätsel ${solvedOf('parallelwelten', r)}/${r.length} · Teilmengen ${solvedOf('parallelwelten', t)}/${t.length}`;
  },
  keller: async () => {
    const K = await katalog('keller');
    const t = K.filter((a) => a.art === 'tabelle').map((a) => a.schluessel);
    const r = K.filter((a) => a.art === 'rueckwaerts').map((a) => a.schluessel);
    return `Tabellen ${solvedOf('keller', t)}/${t.length} · Rückwärts ${solvedOf('keller', r)}/${r.length}`;
  },
  rallye: async () => { const A = await katalog('rallye'); return geloest(solvedOf('rallye', A.map((x) => x.schluessel)), A.length); },
  grammatik: async () => { const A = await katalog('grammatik'); return geloest(solvedOf('grammatik', A.map((x) => x.schluessel)), A.length); },
  sortierer: async () => { const b = progress.best('sortierer:runde'); return b != null ? `Rekord ${b} richtig einsortiert` : ''; },
  turing: async () => { const A = await katalog('turing'); return geloest(solvedOf('turing', A.map((x) => x.schluessel)), A.length); },
  quiz: async () => {
    const Q = await katalog('quiz');
    const done = (keys) => keys.filter((k) => progress.best(k) != null).length;
    const w = Q.filter((a) => a.id.startsWith('quiz:welt-')).map((a) => a.id); const d = Q.filter((a) => a.id.startsWith('quiz:ds-')).map((a) => a.id);
    return `Welten ${done(w)}/${w.length} · Exit-Tickets ${done(d)}/${d.length}`;
  },
};

export default {
  title: 'Übersicht',
  mount(el, ctx) {
    let selected = null;
    const levelButtons = new Map();
    const levelNamen = new Map();
    // Kurs-Einstellungen (Standard: worlds.js); bei mehreren Kursen gilt die „verbindlichste“ Art je Level
    let kursArt = null; let grundkurs = false; let auftragLevel = new Set();
    const artVon = (n) => kursArt?.[n] ?? LEVEL_TYPE[n] ?? 'pflicht';
    const freiwillig = (n) => grundkurs && LEVEL_NIVEAU[n] === 'eA';
    const tiles = [];

    const info = h('p', { class: 'map-info', 'aria-live': 'polite' });

    function select(n) {
      selected = selected === n ? null : n;
      for (const [k, b] of levelButtons) { b.classList.toggle('is-active', k === selected); b.setAttribute('aria-pressed', String(k === selected)); }
      for (const t of tiles) t.el.classList.toggle('is-dim', selected != null && !t.meta.levels.includes(selected));
      const matching = MODULES.filter((m) => m.levels.includes(selected));
      clear(info);
      if (selected != null) {
        info.append(h('strong', null, `Level ${selected}: ${LEVELS[selected]} (${LEVEL_TYPE_LABEL[artVon(selected)]}${freiwillig(selected) ? ', im Grundkurs freiwillig' : ''}). `),
          `${NIVEAUS[LEVEL_NIVEAU[selected]].lang}. `,
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
        const btn = h('button', { type: 'button', 'aria-pressed': 'false', onclick: () => select(n) },
          h('span', { class: 'level-num' }, String(n)), niveauEtikett(LEVEL_NIVEAU[n]));
        btn.dataset.basis = ['level-node', boss && 'is-boss', ready ? 'is-ready' : 'is-sketch'].filter(Boolean).join(' ');
        const name = h('span', { class: 'level-name', 'aria-hidden': 'true' });
        levelButtons.set(n, btn);
        levelNamen.set(n, name);
        zeichneLevel(n);
        chain.append(h('li', { class: ['level-step', wi === 0 && i === 0 && 'is-first', i === 0 && wi > 0 && 'is-continued'] }, btn, name));
      });
      map.append(h('section', { class: 'world-row', 'data-welt': w.id, role: 'listitem', 'aria-labelledby': `welt-${w.id}` },
        // Thema vorn, Buchstabe als Kurzname (Manifest welten[].kennung, Boss-Level A–C, Kopfzeilen der Materialien)
        h('h3', { class: 'world-label', id: `welt-${w.id}` }, h('span', { class: 'world-title' }, w.title), h('span', { class: 'world-letter' }, `Welt ${w.id} · Level ${w.levels[0]}–${w.levels.at(-1)}`)),
        h('div', { class: 'chain-scroller' }, chain)));
    });

    /** Level-Knoten und -Name nach der aktuellen Level-Art zeichnen (auch nach dem Laden der Kurs-Einstellungen). */
    function zeichneLevel(n) {
      const btn = levelButtons.get(n); const name = levelNamen.get(n);
      const typ = artVon(n); const boss = BOSS_LEVELS.includes(n); const dran = auftragLevel.has(n);
      btn.className = `${btn.dataset.basis} is-${typ}${dran ? ' is-auftrag' : ''}${selected === n ? ' is-active' : ''}`;
      btn.setAttribute('aria-label', `Level ${n}: ${LEVELS[n]} (${LEVEL_TYPE_LABEL[typ]}${freiwillig(n) ? ', im Grundkurs freiwillig' : ''}, ${NIVEAUS[LEVEL_NIVEAU[n]].lang})${dran ? ', im Auftrag deiner Lehrkraft' : ''}${boss ? ', mit Boss-Level als Extra-Training' : ''}`);
      clear(name, LEVELS[n],
        typ !== 'pflicht' ? h('span', { class: `type-tag type-${typ}` }, LEVEL_TYPE_LABEL[typ]) : null,
        freiwillig(n) ? h('span', { class: 'type-tag type-freiwillig' }, 'freiwillig (eA)') : null,
        dran ? h('span', { class: 'type-tag type-auftrag' }, 'Auftrag') : null,
        boss ? h('span', { class: 'boss-tag' }, 'Boss-Level (Extra)') : null);
    }

    // ───── Auftrag der Lehrkraft und Kurs-Einstellungen (nur angemeldete Schüler mit Kurs) ─────
    const auftragSlot = h('div');
    const RANG = { pflicht: 0, vertiefung: 1, bonus: 2, spaeter: 3 };
    async function kursEinstellungen() {
      let kurse = [];
      try { kurse = await api('GET', '/api/meine-kurse'); } catch { return; }
      if (!kurse.length) return;
      kursArt = {};
      for (const n of ALL_LEVELS) kursArt[n] = kurse.map((k) => k.levelArt?.[n] ?? LEVEL_TYPE[n] ?? 'pflicht').sort((a, b) => RANG[a] - RANG[b])[0];
      grundkurs = kurse.every((k) => k.kursart === 'gA');
      const auftraege = kurse.filter((k) => k.auftrag);
      auftragLevel = new Set(auftraege.flatMap((k) => k.auftrag.level ?? []));
      for (const n of ALL_LEVELS) zeichneLevel(n);
      // Aufgaben der Lehrkraft (Aufgaben-Editor, PR 10): freigegebene eigene Quizze und Baukasten-Challenges
      api('GET', '/api/eigene').then((eigene) => {
        if (!eigene.length || !auftragSlot.isConnected) return;
        auftragSlot.after(h('section', { class: 'eigene-aufgaben panel', 'aria-labelledby': 'eigene-h' },
          h('h2', { id: 'eigene-h' }, '✏️ Aufgaben deiner Lehrkraft'),
          h('ul', { class: 'eigene-liste' }, eigene.map((x) => h('li', { class: x.status === 'geloest' ? 'is-geloest' : null },
            h('a', { href: x.link }, x.art === 'quiz' ? '❓ ' : '🧩 ', x.titel),
            h('span', { class: 'muted klein' }, ` · ${x.art === 'quiz' ? 'Quiz' : 'Baukasten'}${kurse.length > 1 ? ` · ${x.kurs}` : ''}${x.status === 'geloest' ? ' · ✓ gelöst' : ''}`)))),
          h('p', { class: 'muted klein' }, 'Diese Aufgaben hat deine Lehrkraft selbst erstellt. Sie geben keine Punkte – üben lohnt sich trotzdem.')));
      }).catch(() => {});
      // Rangliste, wenn eine Lehrkraft sie für einen der Kurse eingeschaltet hat (PR 8)
      if (kurse.some((k) => k.scoreboard)) auftragSlot.after(h('p', { class: 'rangliste-link' }, h('a', { class: 'btn', href: ctx.link('rangliste') }, '🏆 Rangliste deines Kurses')));
      if (auftraege.length) clear(auftragSlot, h('section', { class: 'auftrag', 'aria-labelledby': 'auftrag-h' },
        h('h2', { id: 'auftrag-h' }, auftraege.length === 1 ? 'Auftrag deiner Lehrkraft' : 'Aufträge deiner Lehrkräfte'),
        auftraege.map((k) => h('div', { class: 'auftrag-eintrag' },
          kurse.length > 1 ? h('p', { class: 'auftrag-kurs' }, k.name) : null,
          h('p', { class: 'auftrag-text' }, k.auftrag.text),
          k.auftrag.level?.length ? h('p', { class: 'auftrag-level' }, 'Dazu: ', k.auftrag.level.map((n, i) => [i ? ' · ' : '',
            h('button', { type: 'button', class: 'link-button', onclick: () => { if (selected !== n) select(n); levelButtons.get(n)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); } }, `Level ${n}: ${LEVELS[n]}`)])) : null))));
    }

    // ───── Module nach Welten ─────
    const catalogue = h('div', { class: 'catalogue' });
    // Arbeitsblätter je Welt (aufklappbar, nachgeladen aus GET /api/material – der Server entscheidet je Rolle)
    const materialSlots = new Map();
    const groups = [...WORLDS.map((w) => ({ id: w.id, title: `Welt ${w.id}: ${w.title}` })), { id: null, title: 'Für alle Welten' }];
    for (const g of groups) {
      const mods = MODULES.filter((m) => m.world === g.id);
      if (!mods.length) continue;
      const grid = h('ul', { class: 'tile-grid' });
      for (const m of mods) {
        const status = h('span', { class: 'tile-status' });
        const tile = h('li', { class: ['tile', m.load ? 'is-ready' : 'is-sketch'], 'data-welt': m.world ?? 'alle' },
          h('a', { class: 'tile-link', href: ctx.link(m.route) },
            h('span', { class: 'tile-title' }, m.title, ' ', niveauPille(MODUL_NIVEAU[m.route])),
            h('span', { class: 'tile-blurb' }, m.blurb),
            h('span', { class: 'tile-foot' },
              h('span', { class: 'tile-levels' }, m.levels.length && m.levels.length < ALL_LEVELS.length ? `Level ${m.levels.join(', ')}` : 'Alle Level'),
              m.load ? status : h('span', { class: 'tile-soon' }, 'bald verfügbar'))));
        tiles.push({ el: tile, meta: m });
        grid.append(tile);
        if (m.load && STATUS[m.route]) STATUS[m.route]().then((text) => { status.textContent = text; }).catch(() => {});
      }
      // Boss-Kampf am Ende der Welten A–C (PR 9, wie Algo Quest) – nur mit Anmeldung
      if (BOSS_NIVEAU[g.id]) grid.append(h('li', { class: ['tile', 'is-ready', 'tile-boss'], 'data-welt': g.id },
        h('a', { class: 'tile-link', href: ctx.link('boss', { welt: g.id }) },
          h('span', { class: 'tile-title' }, `⚔️ Boss der Welt ${g.id}`, ' ', niveauPille(BOSS_NIVEAU[g.id])),
          h('span', { class: 'tile-blurb' }, 'Prüfung auf Zeit: zufällige Aufgaben im Abitur-Stil, Auswertung am Ende. Ab 50 % ist der Boss besiegt.'),
          h('span', { class: 'tile-foot' }, h('span', { class: 'tile-levels' }, 'Ende der Welt'), h('span', { class: 'tile-status' }, 'mit Anmeldung')))));
      const slot = h('div', { class: 'welt-material-slot' });
      materialSlots.set(g.id, slot);
      catalogue.append(h('section', { class: 'catalogue-group', 'data-welt': g.id ?? 'alle' }, h('h3', null, g.title), grid, slot));
    }

    api('GET', '/api/material').then((m) => {
      for (const [id, slot] of materialSlots) {
        const akten = m.akten.filter((a) => (a.welt ?? null) === id);
        if (!akten.length) continue;
        const gesperrt = akten.some((a) => a.dateien.some((d) => d.gesperrt));
        clear(slot, h('details', { class: 'welt-material' },
          h('summary', null, id ? `Arbeitsblätter, Folien & Merkblätter zu Welt ${id} (PDF)` : 'Klausuren und Material zur ganzen Einheit (PDF)'),
          h('ul', { class: 'welt-material-akten' }, akten.map((a) => h('li', null,
            h('div', { class: 'welt-material-kopf' }, h('strong', null, a.titel), niveauPille(a.niveau)), materialLinks(a.dateien)))),
          gesperrt ? h('p', { class: 'muted klein' }, 'Mit 🔒 markiertes Material gibt es nach der Anmeldung über InfoLabs.') : null));
      }
    }).catch(() => { /* ohne Server: keine Materialien */ });

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

    // Gespeichert wird je nach Sitzung: angemeldet auf dem Server (Prüf-Module), sonst nur im Browser dieses Geräts.
    const speicherText = h('p', { class: 'muted' }, 'Gespeichert wird nur auf diesem Gerät, ohne Namen und ohne Cookies. Auf einem anderen iPad beginnst du bei null.');
    const resetSlot = h('p');
    const resetBtn = (angemeldet) => h('button', { type: 'button', class: 'btn btn-danger-ghost', onclick: () => {
      const frage = angemeldet
        ? 'Den Fortschritt auf diesem Gerät löschen (Module, die noch im Browser prüfen, und Entwürfe)? Punkte und Abzeichen auf dem Server bleiben erhalten.'
        : 'Wirklich alle Punkte, gelösten Challenges und Abzeichen auf diesem Gerät löschen?';
      if (window.confirm(frage)) {
        progress.reset();
        ctx.toast(angemeldet ? 'Der Fortschritt auf diesem Gerät wurde zurückgesetzt.' : 'Dein Fortschritt wurde zurückgesetzt.', { type: 'info' });
        ctx.navigate('', {}, { replace: true });
      }
    } }, angemeldet ? 'Fortschritt auf diesem Gerät zurücksetzen' : 'Fortschritt zurücksetzen');
    clear(resetSlot, resetBtn(false));

    // Gastmodus: Hinweis auf Demo-Aufgaben und Anmeldung (nur wenn die Portal-Anmeldung eingerichtet ist)
    const gastSlot = h('div');
    sitzung().then(({ konto, anmeldung }) => {
      if (anmeldung && !konto) clear(gastSlot, h('div', { class: 'notice gast-hinweis' },
        h('span', null, h('strong', null, 'Du bist nicht angemeldet. '), 'Ohne Anmeldung kannst du je Modul eine Aufgabe ausprobieren.'),
        h('a', { class: 'btn btn-primary', href: ctx.link('gast') }, 'Ausprobieren'),
        h('a', { class: 'btn', href: anmeldeLink('/') }, 'Anmelden über InfoLabs')));
      // Lehrkräfte und Admins: Weg in den Lehrkraft-Bereich (wie Algo Quest)
      if (konto && konto.rolle !== 'schueler') clear(gastSlot, h('div', { class: 'notice gast-hinweis' },
        h('span', null, h('strong', null, 'Sie sind als Lehrkraft angemeldet. '), 'Kurse, Auswertung und Aufgaben-Vorschau finden Sie im Lehrkraft-Bereich.'),
        h('a', { class: 'btn btn-primary', href: ctx.link('lehrkraft') }, 'Zum Lehrkraft-Bereich')));
      if (konto?.rolle === 'schueler' && (konto.kurse ?? []).length) kursEinstellungen();
      else if (konto?.rolle === 'schueler' && !(konto.kurse ?? []).length) clear(gastSlot, h('div', { class: 'notice gast-hinweis' },
        h('span', null, h('strong', null, 'Noch nicht freigeschaltet. '), 'Deine Lehrkraft schaltet AutomatenLab im Portal für euren Kurs frei – bis dahin gibt es die Demo-Aufgaben.'),
        h('a', { class: 'btn btn-primary', href: ctx.link('gast') }, 'Ausprobieren')));
      if (konto) {
        speicherText.textContent = 'Punkte und Abzeichen der Aufgaben mit Prüfung speichert der Server unter deinem Konto – sie zählen im Portal und für deine Lehrkraft. Module, die noch im Browser prüfen, speichern vorerst nur auf diesem Gerät.';
        clear(resetSlot, resetBtn(true));
      }
    });

    clear(el,
      gastSlot,
      auftragSlot,
      h('section', { class: 'hero' },
        h('div', { class: 'hero-top' },
          h('div', { class: 'hero-text' },
            h('h1', { class: 'hero-title' }, 'Maschinen, die ', h('span', { class: 'hero-mark' }, 'Sprache'), ' verstehen'),
            h('p', { class: 'hero-lead' }, 'Für Grund- und Leistungskurs: endliche Automaten für alle, Kellerautomaten und Grammatiken für den Leistungskurs, Bonus-Level für Neugierige – ein Ziel: so sicher werden, dass dich im Abitur nichts überrascht. Tippe auf ein Level, um die passenden Module zu sehen.')),
          heroAutomat()),
        h('div', { class: 'map-panel' }, map,
          h('p', { class: 'map-legend' }, h('span', { class: 'legend-item legend-pflicht' }, 'Pflicht'), h('span', { class: 'legend-item legend-vertiefung' }, 'Vertiefung'), h('span', { class: 'legend-item legend-bonus' }, 'Bonus'),
            h('span', { class: 'legend-niveau' }, h('span', { class: 'niveau-etikett niveau-ea' }, 'LK'), ' nur Leistungskurs (eA)'),
            h('span', { class: 'legend-niveau' }, h('span', { class: 'niveau-etikett niveau-plus' }, '+'), ' Zusatz über das KC hinaus'),
            h('span', { class: 'legend-niveau' }, 'ohne Etikett: Grund- und Leistungskurs · ', h('a', { href: ctx.link('themen', { teil: 'niveaus' }) }, 'Was ist für welches Niveau?'))),
          info)),
      h('section', { class: 'page-section', 'aria-labelledby': 'module-h' },
        h('div', { class: 'module-kopf' }, h('h2', { id: 'module-h' }, 'Module'),
          h('a', { class: 'btn btn-ghost btn-small', href: ctx.link('material') }, 'Arbeitsblätter, Folien & Merkblätter (PDF)')),
        catalogue),
      h('section', { class: 'page-section progress-section', 'aria-labelledby': 'fortschritt-h' },
        h('div', { class: 'progress-head' },
          h('h2', { id: 'fortschritt-h' }, 'Dein Fortschritt'), pointsBig),
        speicherText,
        badgeList,
        resetSlot));

    return () => unsub();
  },
};
