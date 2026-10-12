// Lehrkraft-Bereich (Vertrag InfoLabs §7: urls.lehrkraft = /lehrer → #/lehrkraft). Anmeldung nur über das Portal.
// Ohne Sitzung leitet die Seite still zum Portal (INTEGRATION.md §3.1); Lernstand und Aufträge folgen in Phase 5.

import { h, clear } from '../core/dom.js';
import { sitzung, anmeldeLink, istLehrkraft } from '../core/sitzung.js';

export default {
  title: 'Lehrkräfte',
  mount(el, ctx) {
    let aktiv = true;
    const seite = (...inhalt) => clear(el, h('section', { class: 'page narrow' },
      h('a', { class: 'back-link', href: '#/' }, h('span', { 'aria-hidden': 'true' }, '‹ '), 'Übersicht'),
      h('h1', null, 'Bereich für Lehrkräfte'), ...inhalt));
    seite(h('p', { class: 'muted' }, 'Lade …'));

    sitzung().then(async ({ konto, anmeldung, portal }) => {
      if (!aktiv) return;
      if (!konto) {
        if (anmeldung) { location.replace(anmeldeLink('/lehrer')); return; }
        seite(h('p', { class: 'lead' }, 'Hier sehen Sie den Lernstand Ihrer Kurse, vergeben Aufträge und schalten Level frei. Die Anmeldung läuft über das Portal InfoLabs.'),
          h('p', { class: 'notice' }, 'Die Anmeldung über das Portal ist auf diesem Server noch nicht eingerichtet.'),
          h('p', null, h('a', { href: ctx.link('themen') }, 'Themen der Einheit ansehen')));
        return;
      }
      if (!istLehrkraft(konto)) {
        seite(h('p', { class: 'notice' }, 'Dieser Bereich ist nur für Lehrkräfte.'), h('p', null, h('a', { class: 'btn', href: '#/' }, 'Zur Übersicht')));
        return;
      }
      let kurse = [];
      try {
        const r = await fetch('/api/lehrer/kurse', { credentials: 'same-origin' });
        if (r.ok) kurse = await r.json();
      } catch { /* Netzfehler: leere Liste mit Hinweis */ }
      if (!aktiv) return;
      seite(
        h('p', { class: 'lead' }, `Angemeldet als ${konto.name}. Kurse legen Sie im Portal InfoLabs an und schalten dort AutomatenLab frei.`),
        h('h2', null, 'Ihre Kurse'),
        kurse.length
          ? h('ul', { class: 'kurs-liste' }, kurse.map((k) => h('li', null, h('strong', null, k.name), ` – ${k.schueler} ${k.schueler === 1 ? 'Schülerin/Schüler' : 'Schülerinnen und Schüler'} angemeldet`)))
          : h('p', { class: 'notice' }, 'Noch kein Kurs mit AutomatenLab. Legen Sie im Portal einen Kurs an und wählen Sie AutomatenLab als Plattform; nach der nächsten Anmeldung erscheint er hier.'),
        h('p', { class: 'notice' }, 'Lernstand-Übersicht, Aufträge und Freischaltungen folgen.'),
        portal ? h('p', null, h('a', { class: 'btn', href: portal + '/' }, '⌂ Zum Portal')) : null);
    });
    return () => { aktiv = false; };
  },
};
