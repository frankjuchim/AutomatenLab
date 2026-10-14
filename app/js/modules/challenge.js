// Klassen-Challenges für Schüler (PR 11): Challenges der eigenen Kurse, die die Lehrkraft angelegt hat.
//   #/challenge          laufende, geplante und kürzlich beendete Challenges
//   #/challenge?id=<n>   eine Challenge: was zählt, Zeitraum, Rangliste (Einzel) bzw. Team-Summen und eigener Beitrag
// Die Wertung steht nur hier (und auf dem Beamer-Board) – sie gibt keine zusätzlichen Punkte.

import { h, clear } from '../core/dom.js';
import { api } from '../core/api.js';
import { aufgabenLink } from './lehrkraft.js';

const MEDAILLE = { 1: '🥇', 2: '🥈', 3: '🥉' };
const PHASE = { geplant: '🗓 geplant', laeuft: '🎯 läuft', beendet: '🏁 beendet' };
const TRAINING_LINK = { arena: '#/arena', unterscheide: '#/minimierer?modus=unterscheide', sortierer: '#/sortierer' };
const datum = (iso) => new Date(iso).toLocaleString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

export default {
  title: 'Challenges',
  mount(el, ctx) {
    let aktiv = true;
    const id = ctx.params.get('id');
    const fehler = (e) => { if (aktiv) clear(el, h('section', { class: 'page' }, h('h1', null, '🎯 Challenges'), h('p', { class: 'notice notice-error' }, e.message))); };
    clear(el, h('section', { class: 'page' }, h('h1', null, '🎯 Challenges'), h('p', { class: 'muted' }, 'Lade …')));
    if (/^\d{1,9}$/.test(id ?? '')) Promise.all([api('GET', `/api/challenges/${id}`), api('GET', '/api/katalog')]).then(([c, k]) => zeige(c, k.aufgaben)).catch(fehler);
    else api('GET', '/api/challenges').then(liste).catch(fehler);
    return () => { aktiv = false; };

    function liste(cs) {
      if (!aktiv) return;
      clear(el, h('section', { class: 'page challenge-page' },
        h('a', { class: 'back-link', href: '#/' }, h('span', { 'aria-hidden': 'true' }, '‹ '), 'Übersicht'),
        h('h1', null, '🎯 Challenges'),
        h('p', { class: 'lead' }, 'Deine Lehrkraft stellt eine Aufgabe für einen bestimmten Zeitraum – allein oder im Team. Es zählt nur, was in diesem Zeitraum passiert. Die Wertung gibt keine zusätzlichen Punkte.'),
        cs.length
          ? h('ul', { class: 'boss-karten' }, cs.map((c) => h('li', null, h('a', { class: ['panel', 'boss-karte', `challenge-${c.phase}`], href: ctx.link('challenge', { id: String(c.id) }) },
            h('span', { class: 'boss-karte-welt' }, `${PHASE[c.phase]} · ${c.wertung === 'team' ? 'Team' : 'Einzel'}`),
            h('strong', { class: 'boss-karte-titel' }, c.titel),
            h('span', { class: 'muted' }, `${datum(c.start)} – ${datum(c.ende)}`),
            h('span', null, `Zählt: ${c.zaehlt}`)))))
          : h('p', { class: 'notice' }, 'Gerade gibt es keine Challenge in deinen Kursen.')));
    }

    function zeige(c, katalog) {
      if (!aktiv) return;
      const was = c.art === 'training'
        ? h('p', null, h('a', { class: 'btn btn-primary', href: TRAINING_LINK[c.modul] }, 'Zum Training'))
        : h('ul', { class: 'challenge-aufgaben' }, c.aufgaben.map((a) => {
          const k = katalog.find((x) => x.id === a.id);
          const href = a.link ?? (k ? aufgabenLink(k).replace(/[?&]vorschau=1$/, '') : null);
          return h('li', null, href ? h('a', { href }, a.titel) : a.titel);
        }));
      const ergebnis = c.phase === 'geplant' ? h('p', { class: 'notice' }, `Die Challenge beginnt am ${datum(c.start)}.`)
        : c.liste ? h('div', { class: 'tabelle-scroll' }, h('table', { class: 'lk-tabelle rangliste-tabelle' },
          h('thead', null, h('tr', null, ['Platz', 'Name', c.art === 'training' ? 'richtige Antworten' : 'gelöste Aufgaben'].map((t) => h('th', { scope: 'col' }, t)))),
          h('tbody', null, c.liste.map((z) => h('tr', { class: z.ich ? 'is-ich' : null },
            h('td', { class: 'zahl' }, z.wert > 0 && MEDAILLE[z.platz] ? `${MEDAILLE[z.platz]} ${z.platz}.` : `${z.platz}.`),
            h('td', null, z.name, z.ich ? h('span', { class: 'muted' }, ' (du)') : null),
            h('td', { class: 'zahl' }, String(z.wert)))))))
          : h('div', null,
            c.ich ? h('p', { class: 'lead' }, `Du bist im ${c.ich.team}. Dein Beitrag: ${c.ich.beitrag}.`) : null,
            h('ol', { class: 'challenge-teams' }, c.teams.map((t) => h('li', { class: c.ich?.team === t.name ? 'is-ich' : null },
              h('span', { class: 'board-platz' }, t.wert > 0 && MEDAILLE[t.platz] ? MEDAILLE[t.platz] : `${t.platz}.`),
              h('strong', null, t.name),
              h('span', { class: 'muted' }, `${t.mitglieder} ${t.mitglieder === 1 ? 'Mitglied' : 'Mitglieder'} · Ø ${String(t.schnitt).replace('.', ',')}`),
              h('span', { class: 'board-punkte' }, String(t.wert))))));
      clear(el, h('section', { class: 'page challenge-page' },
        h('a', { class: 'back-link', href: ctx.link('challenge') }, h('span', { 'aria-hidden': 'true' }, '‹ '), 'Alle Challenges'),
        h('h1', null, `🎯 ${c.titel}`),
        h('p', { class: 'muted' }, `${PHASE[c.phase]} · ${c.wertung === 'team' ? `Team-Wertung (${c.teamAnzahl} Teams)` : 'Einzel-Wertung'} · ${datum(c.start)} – ${datum(c.ende)}`),
        h('div', { class: 'panel lk-karte' }, h('h2', null, 'Was zählt'), h('p', null, `${c.zaehlt[0].toUpperCase()}${c.zaehlt.slice(1)} – nur im Zeitraum der Challenge.`), was),
        h('div', { class: 'panel lk-karte' }, h('h2', null, c.phase === 'beendet' ? 'Ergebnis' : 'Zwischenstand'), ergebnis,
          c.phase === 'beendet' ? h('p', { class: 'muted klein' }, c.wertung === 'team' ? 'Das Gewinnerteam bekommt das Abzeichen „Teamsieg“.' : 'Platz 1 bekommt „Challenge gewonnen“, Platz 2 und 3 „Auf dem Podest“.') : null)));
    }
  },
};
