// Themenseite (Vertrag InfoLabs §9: „Themenseite /themen ohne Lösungen“): Welten, Level (= Doppelstunden) und die
// Module, mit denen jedes Level geübt wird. Erreichbar als #/themen und über den Server-Pfad /themen.

import { h, clear } from '../core/dom.js';
import { WORLDS, LEVELS, BOSS_LEVELS, LEVEL_TYPE, LEVEL_TYPE_LABEL } from '../data/worlds.js';
import { MODULES } from './manifest.js';

export default {
  title: 'Themen',
  mount(el, ctx) {
    const bereit = MODULES.filter((m) => m.load);
    const welt = (w) => h('section', { class: 'themen-welt', 'aria-labelledby': `themen-welt-${w.id}` },
      h('h2', { id: `themen-welt-${w.id}` }, `Welt ${w.id}: ${w.title}`),
      h('ol', { class: 'themen-level' }, w.levels.map((n) => {
        const module = bereit.filter((m) => m.levels.includes(n));
        return h('li', { value: String(n) },
          h('div', { class: 'themen-level-kopf' },
            h('strong', null, `Level ${n}: ${LEVELS[n]}`),
            h('span', { class: ['level-chip', `typ-${LEVEL_TYPE[n]}`] }, LEVEL_TYPE_LABEL[LEVEL_TYPE[n]]),
            BOSS_LEVELS.includes(n) ? h('span', { class: 'level-chip' }, 'Boss-Level') : null),
          module.length
            ? h('p', { class: 'themen-module' }, 'Üben mit: ',
              module.flatMap((m, i) => [i ? ', ' : null, h('a', { href: ctx.link(m.route) }, m.title)]))
            : null);
      })));
    clear(el, h('section', { class: 'page narrow themen' },
      h('a', { class: 'back-link', href: '#/' }, h('span', { 'aria-hidden': 'true' }, '‹ '), 'Übersicht'),
      h('h1', null, 'Themen der Einheit'),
      h('p', { class: 'lead' }, '„Maschinen, die Sprache verstehen“: 16 Level (eine Doppelstunde je Level) in vier Welten – von endlichen Automaten bis zur Turingmaschine.'),
      WORLDS.map(welt)));
  },
};
