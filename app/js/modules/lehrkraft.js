// Lehrkraft-Bereich (Vertrag InfoLabs §7: urls.lehrkraft = /lehrer → #/lehrkraft). Platzhalter, bis die Anmeldung
// über das Portal (Phase 3) und das Dashboard (Phase 5) da sind.

import { h, clear } from '../core/dom.js';

export default {
  title: 'Lehrkräfte',
  mount(el, ctx) {
    clear(el, h('section', { class: 'page narrow' },
      h('a', { class: 'back-link', href: '#/' }, h('span', { 'aria-hidden': 'true' }, '‹ '), 'Übersicht'),
      h('h1', null, 'Bereich für Lehrkräfte'),
      h('p', { class: 'lead' }, 'Hier sehen Sie bald den Lernstand Ihrer Kurse, vergeben Aufträge und schalten Level frei. Die Anmeldung läuft über das Portal InfoLabs.'),
      h('p', { class: 'notice' }, 'Dieser Bereich ist noch im Aufbau.'),
      h('p', null, h('a', { href: ctx.link('themen') }, 'Themen der Einheit ansehen'))));
  },
};
