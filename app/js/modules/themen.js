// Themenseite (Vertrag InfoLabs §9: „Themenseite /themen ohne Lösungen“): Welten, Level (= Doppelstunden) und die
// Module, mit denen jedes Level geübt wird. Erreichbar als #/themen und über den Server-Pfad /themen.
// Abschnitt „Was ist für welches Niveau?“ (Vertrag v1.2 §9, Manifest urls.niveaus = /niveaus → #/themen?teil=niveaus).

import { h, clear } from '../core/dom.js';
import { WORLDS, LEVELS, BOSS_LEVELS, LEVEL_TYPE, LEVEL_TYPE_LABEL } from '../data/worlds.js';
import { LEVEL_NIVEAU, LEVEL_NIVEAU_HINWEIS, BOSS_NIVEAU, MODUL_NIVEAU, KC_KOMPETENZEN, MERKBLAETTER, ABSCHLUSS_MATERIAL, NIVEAU_IDS, NIVEAUS } from '../data/niveaus.js';
import { niveauPille } from '../components/niveau.js';
import { MODULES } from './manifest.js';
import { api } from '../core/api.js';
import { materialLinks } from '../components/material-links.js';

const ds = (n) => `DS${String(n).padStart(2, '0')}`;
const levelListe = (ns) => ns.map((n) => `${n}`).join(', ');

export default {
  title: 'Themen',
  mount(el, ctx) {
    const bereit = MODULES.filter((m) => m.load);
    // Arbeitsblätter, Folien, Merkblätter je Level (wie in Algo Quest) – nachgeladen, Rechte entscheidet der Server
    const materialSlots = new Map();
    const slot = (id) => { const e = h('div', { class: 'themen-material' }); materialSlots.set(id, e); return e; };
    const welt = (w) => h('section', { class: 'themen-welt', 'aria-labelledby': `themen-welt-${w.id}` },
      h('h2', { id: `themen-welt-${w.id}` }, `Welt ${w.id}: ${w.title}`),
      h('ol', { class: 'themen-level' }, w.levels.map((n) => {
        const module = bereit.filter((m) => m.levels.includes(n));
        return h('li', { value: String(n) },
          h('div', { class: 'themen-level-kopf' },
            h('strong', null, `Level ${n}: ${LEVELS[n]}`),
            niveauPille(LEVEL_NIVEAU[n]),
            h('span', { class: ['level-chip', `typ-${LEVEL_TYPE[n]}`] }, LEVEL_TYPE_LABEL[LEVEL_TYPE[n]]),
            BOSS_LEVELS.includes(n) ? h('span', { class: 'level-chip' }, 'Boss-Level') : null),
          LEVEL_NIVEAU_HINWEIS[n] ? h('p', { class: 'themen-hinweis' }, LEVEL_NIVEAU_HINWEIS[n]) : null,
          module.length
            ? h('p', { class: 'themen-module' }, 'Üben mit: ',
              module.flatMap((m, i) => [i ? ', ' : null, h('a', { href: ctx.link(m.route) }, m.title)]))
            : null,
          slot(`level-${n}`),
          BOSS_LEVELS.includes(n) ? slot(`boss-${w.id.toLowerCase()}`) : null);
      })));

    const niveaus = niveauUebersicht(ctx, bereit);
    const einheit = h('section', { class: 'themen-welt themen-einheit' });
    clear(el, h('section', { class: 'page narrow themen' },
      h('a', { class: 'back-link', href: '#/' }, h('span', { 'aria-hidden': 'true' }, '‹ '), 'Übersicht'),
      h('h1', null, 'Themen der Einheit'),
      h('p', { class: 'lead' }, '„Maschinen, die Sprache verstehen“: 16 Level (eine Doppelstunde je Level) in vier Welten – von endlichen Automaten bis zur Turingmaschine. Zu jedem Level gibt es Arbeitsblatt, Folien und Merkblatt als PDF.'),
      h('p', { class: 'notice niveau-hinweis' }, h('strong', null, 'Grundkurs (gA) oder Leistungskurs (eA)? '),
        'Endliche Automaten (Welt A ohne Level 5 und Level 7) sind für beide Kurse. Kellerautomaten und formale Sprachen sind nur im Leistungskurs Abiturthema. ',
        h('a', { href: ctx.link('themen', { teil: 'niveaus' }) }, 'Zur Niveau-Übersicht')),
      WORLDS.map(welt),
      einheit,
      niveaus));
    api('GET', '/api/material').then((m) => {
      let gesperrt = false;
      for (const a of m.akten) {
        const ziel = materialSlots.get(a.id);
        if (!ziel) continue;
        gesperrt ||= a.dateien.some((d) => d.gesperrt);
        clear(ziel, h('span', { class: 'themen-material-titel' }, a.id.startsWith('boss-') ? `${a.titel}:` : 'Material:'), materialLinks(a.dateien));
      }
      const rest = m.akten.filter((a) => !materialSlots.has(a.id));
      clear(einheit, rest.length ? [h('h2', null, 'Zur ganzen Einheit'), h('ul', { class: 'themen-level' }, rest.map((a) => h('li', null, h('div', { class: 'themen-level-kopf' }, h('strong', null, a.titel), niveauPille(a.niveau)), materialLinks(a.dateien))))] : null,
        h('p', null, h('a', { class: 'btn btn-ghost', href: ctx.link('material') }, 'Alle Arbeitsblätter und Materialien'),
          gesperrt ? h('span', { class: 'muted' }, ' – mit 🔒 markiertes Material gibt es nach der Anmeldung über InfoLabs.') : null));
    }).catch(() => { /* ohne Server: Themen ohne Material */ });
    if (ctx.params.get('teil') === 'niveaus') {
      requestAnimationFrame(() => { niveaus.scrollIntoView({ block: 'start' }); niveaus.querySelector('h2').focus({ preventScroll: true }); });
    }
  },
};

/** Übersicht „Was ist für welches Niveau?“: Welten-Tabelle, Kurswege, KC-Kompetenzen, Materialien. */
function niveauUebersicht(ctx, bereit) {
  const zelle = (eintraege) => h('td', null, eintraege.length ? h('ul', { class: 'niveau-liste' }, eintraege.map((e) => h('li', null, e))) : h('span', { class: 'muted' }, '–'));
  const zeilen = WORLDS.map((w) => {
    const sp = Object.fromEntries(NIVEAU_IDS.map((n) => [n, []]));
    for (const n of w.levels) sp[LEVEL_NIVEAU[n]].push(`Level ${n}: ${LEVELS[n]}`);
    if (BOSS_NIVEAU[w.id]) sp[BOSS_NIVEAU[w.id]].push(`Boss-Level ${w.id}`);
    for (const m of bereit.filter((x) => x.world === w.id)) {
      if (MODUL_NIVEAU[m.route] && sp[MODUL_NIVEAU[m.route]]) sp[MODUL_NIVEAU[m.route]].push(h('a', { href: ctx.link(m.route) }, m.title));
    }
    return h('tr', null, h('th', { scope: 'row' }, `Welt ${w.id}`, h('div', { class: 'muted klein' }, w.title)), ...NIVEAU_IDS.map((n) => zelle(sp[n])));
  });
  const nach = (niveau) => Object.keys(LEVEL_NIVEAU).map(Number).filter((n) => LEVEL_NIVEAU[n] === niveau);

  const material = WORLDS.flatMap((w) => w.levels.map((n) => {
    const mb = MERKBLAETTER.filter((m) => m.level === n || (m.auch ?? []).includes(n)).map((m) => `Merkblatt ${m.id} ${m.titel}`);
    return h('tr', null, h('td', null, `${ds(n)} · ${LEVELS[n]}`), h('td', null, niveauPille(LEVEL_NIVEAU[n])),
      h('td', null, ['Arbeitsblatt, Lehrkraft-Handreichung, Folien', ...mb].join(' · ')));
  }));
  for (const w of WORLDS) if (BOSS_NIVEAU[w.id]) material.push(h('tr', null, h('td', null, `Boss-Level ${w.id}`), h('td', null, niveauPille(BOSS_NIVEAU[w.id])), h('td', null, 'Aufgabe und Erwartungshorizont (Papier)')));
  for (const m of ABSCHLUSS_MATERIAL) material.push(h('tr', null, h('td', null, 'Abschluss'), h('td', null, niveauPille(m.niveau)), h('td', null, m.titel, m.hinweis ? ` (${m.hinweis})` : '')));

  return h('section', { class: 'themen-niveaus', id: 'niveaus', 'aria-labelledby': 'niveaus-h' },
    h('h2', { id: 'niveaus-h', tabindex: '-1' }, 'Was ist für welches Niveau?'),
    h('p', null, 'Grundlage ist das Kerncurriculum Informatik Niedersachsen (2017), Lernfeld „Automaten und Sprachen“: Der Kern gilt für ',
      h('strong', null, 'Grund- und Leistungskurs'), ', die Spalte „Erweiterung eA“ ist im Abitur ', h('strong', null, 'nur im Leistungskurs'),
      ' gefordert. Was das KC nur als Ergänzung nennt oder gar nicht, ist hier ', h('strong', null, 'Zusatz'), ' – freiwillig, für Neugierige oder als Brücke.'),
    h('p', { class: 'niveau-legende' }, NIVEAU_IDS.map((n) => [niveauPille(n), ` ${NIVEAUS[n].lang}`, h('br')])),
    h('div', { class: 'tabelle-scroll' }, h('table', { class: 'niveau-tabelle' },
      h('caption', { class: 'sr-only' }, 'Welten, Level, Boss-Level und Module nach Niveau'),
      h('thead', null, h('tr', null, h('th', { scope: 'col' }, 'Welt'), ...NIVEAU_IDS.map((n) => h('th', { scope: 'col' }, niveauPille(n))))),
      h('tbody', null, zeilen))),
    h('h3', null, 'Wege durch die Einheit'),
    h('ul', { class: 'niveau-wege' },
      h('li', null, h('strong', null, 'Grundkurs (gA): '), `Level ${levelListe(nach('alle'))} mit Boss-Level A und der Übungsklausur „Fahrradverleih“ – DEA beschreiben, analysieren und entwickeln, Mealy-Automaten, Grenzen endlicher Automaten.`),
      h('li', null, h('strong', null, 'Leistungskurs (eA): '), `zusätzlich Level ${levelListe(nach('eA'))} mit Boss-Level B und C – Kellerautomaten und formale Sprachen (Grammatiken).`),
      h('li', null, h('strong', null, 'Zusatz: '), `Level ${levelListe(nach('plus'))} – Minimierung, NEA und Turingmaschine. Im Leistungskurs ist Level 8 (NEA) eine gute Hinleitung zum Kellerautomaten.`)),
    h('h3', null, 'Kompetenzen des Kerncurriculums'),
    h('div', { class: 'tabelle-scroll' }, h('table', { class: 'niveau-tabelle' },
      h('thead', null, h('tr', null, h('th', { scope: 'col' }, 'Kompetenz'), h('th', { scope: 'col' }, 'Niveau'), h('th', { scope: 'col' }, 'Level'))),
      h('tbody', null, KC_KOMPETENZEN.map((k) => h('tr', null, h('td', null, k.text), h('td', null, niveauPille(k.niveau)), h('td', null, levelListe(k.level))))))),
    h('h3', null, 'Materialien'),
    h('div', { class: 'tabelle-scroll' }, h('table', { class: 'niveau-tabelle' },
      h('thead', null, h('tr', null, h('th', { scope: 'col' }, 'Level'), h('th', { scope: 'col' }, 'Niveau'), h('th', { scope: 'col' }, 'Material'))),
      h('tbody', null, material))),
    h('p', { class: 'muted' }, 'In der App tragen Level-Knoten das Etikett „LK“ (nur eA) oder „+“ (Zusatz), Module eine Niveau-Pille. Jedes Arbeitsblatt, jedes Merkblatt und jede Handreichung nennt das Niveau im Kopf. Das Level-Quiz hat je Level ein Exit-Ticket im Niveau dieses Levels.'));
}
