// Gastmodus (#/gast, auch Server-Pfad /gast): je Modul eine Aufgabe zum Ausprobieren – ohne Anmeldung, ohne Punkte.
import { h, clear } from '../core/dom.js';
import { GAST, gastLink } from '../data/gast.js';
import { sitzung, anmeldeLink } from '../core/sitzung.js';

export default {
  title: 'Ausprobieren',
  mount(el, ctx) {
    const login = h('p', { class: 'start-actions' });
    clear(el, h('section', { class: 'page' },
      h('a', { class: 'back-link', href: '#/' }, h('span', { 'aria-hidden': 'true' }, '‹ '), 'Übersicht'),
      h('h1', null, 'Ausprobieren ohne Anmeldung'),
      h('p', { class: 'lead' }, 'Hier kannst du jedes Modul an einer Aufgabe testen. Punkte, Fortschritt auf allen Geräten und alle Aufgaben gibt es mit der Anmeldung über InfoLabs – die Zugangsdaten bekommst du von deiner Lehrkraft.'),
      login,
      h('ul', { class: 'gast-liste' }, GAST.map((g) => h('li', null,
        h('a', { class: 'gast-karte', href: gastLink(g, ctx.link) }, h('strong', null, g.titel), h('span', null, g.text)))))));
    sitzung().then(({ konto, anmeldung }) => {
      if (konto) clear(login, h('span', { class: 'notice' }, `Du bist angemeldet als ${konto.name} – alle Aufgaben stehen dir offen.`), h('a', { class: 'btn', href: '#/' }, 'Zur Übersicht'));
      else if (anmeldung) clear(login, h('a', { class: 'btn btn-primary', href: anmeldeLink('/') }, 'Anmelden über InfoLabs'));
    });
  },
};
