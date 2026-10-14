// Rangliste für Schüler (PR 8, wie das Scoreboard von Algo Quest): je eigenem Kurs, in dem die Lehrkraft die Rangliste
// eingeschaltet hat; gesamt (Aufgaben + Training) oder je Welt (nur Aufgaben). Gleiche Punkte = gleicher Platz.
//   #/rangliste            gesamt
//   #/rangliste?welt=A     nur Welt A (A–D)

import { h, clear } from '../core/dom.js';
import { api } from '../core/api.js';

const MEDAILLE = { 1: '🥇', 2: '🥈', 3: '🥉' };

export default {
  title: 'Rangliste',
  mount(el, ctx) {
    let aktiv = true;
    const welt = ctx.params.get('welt');
    clear(el, h('section', { class: 'page rangliste-page' }, h('h1', null, '🏆 Rangliste'), h('p', { class: 'muted' }, 'Lade …')));

    api('GET', `/api/rangliste${welt ? `?welt=${encodeURIComponent(welt)}` : ''}`).then((r) => {
      if (!aktiv) return;
      const chips = h('div', { class: 'chip-row', role: 'group', 'aria-label': 'Welt wählen' },
        [[null, 'Gesamt'], ...r.welten.map((w) => [w.kennung, `Welt ${w.kennung}`])].map(([k, text]) =>
          h('a', { class: 'chip', href: ctx.link('rangliste', k ? { welt: k } : {}), ...((k ?? null) === (r.welt ?? null) ? { 'aria-current': 'page' } : {}) }, text)));
      const weltTitel = r.welt ? r.welten.find((w) => w.kennung === r.welt)?.titel : null;
      clear(el, h('section', { class: 'page rangliste-page' },
        h('a', { class: 'back-link', href: '#/' }, h('span', { 'aria-hidden': 'true' }, '‹ '), 'Übersicht'),
        h('h1', null, '🏆 Rangliste'),
        h('p', { class: 'lead' }, r.welt ? `Punkte aus den Aufgaben der Welt ${r.welt} (${weltTitel}) – Training zählt hier nicht.` : 'Punkte aus Aufgaben und Training. Gleiche Punkte, gleicher Platz.'),
        chips,
        r.kurse.length
          ? r.kurse.map((k) => h('div', { class: 'panel lk-karte' },
            h('h2', null, k.name),
            h('div', { class: 'tabelle-scroll' }, h('table', { class: 'lk-tabelle rangliste-tabelle' },
              h('thead', null, h('tr', null, ['Platz', 'Name', 'Punkte', 'gelöst', 'Abzeichen'].map((t) => h('th', { scope: 'col' }, t)))),
              h('tbody', null, k.liste.map((z) => h('tr', { class: z.ich ? 'is-ich' : null, ...(z.ich ? { 'aria-current': 'true' } : {}) },
                h('td', { class: 'zahl' }, z.punkte > 0 && MEDAILLE[z.platz] ? `${MEDAILLE[z.platz]} ${z.platz}.` : `${z.platz}.`),
                h('td', null, z.name, z.ich ? h('span', { class: 'muted' }, ' (du)') : null),
                h('td', { class: 'zahl' }, String(z.punkte)),
                h('td', { class: 'zahl' }, String(z.geloest)),
                h('td', { class: 'zahl' }, String(z.abzeichen)))))))))
          : h('p', { class: 'notice' }, 'In deinen Kursen ist die Rangliste ausgeschaltet. Deine Lehrkraft kann sie im Lehrkraft-Bereich einschalten.')));
    }).catch((e) => {
      if (aktiv) clear(el, h('section', { class: 'page' }, h('h1', null, '🏆 Rangliste'), h('p', { class: 'notice notice-error' }, e.message)));
    });
    return () => { aktiv = false; };
  },
};
