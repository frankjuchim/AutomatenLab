// Datenschutzhinweise der Plattform (Vertrag InfoLabs §3/§10): AutomatenLab ergänzt nur seine Besonderheiten und
// verweist auf die zentrale Datenschutzerklärung des Portals.

import { h, clear } from '../core/dom.js';

const PORTAL_STANDARD = 'https://labs.frankjuchim.de';

export default {
  title: 'Datenschutz',
  mount(el) {
    const portalLink = h('a', { href: `${PORTAL_STANDARD}/datenschutz` }, `${PORTAL_STANDARD}/datenschutz`);
    clear(el, h('section', { class: 'page narrow' },
      h('a', { class: 'back-link', href: '#/' }, h('span', { 'aria-hidden': 'true' }, '‹ '), 'Übersicht'),
      h('h1', null, 'Datenschutz'),
      h('p', { class: 'lead' }, 'AutomatenLab ist eine Plattform des Verbunds InfoLabs. Die zentrale Datenschutzerklärung (Konten, Kurse, Anmeldung) steht im Portal: ', portalLink, '.'),
      h('h2', null, 'Was AutomatenLab selbst speichert'),
      h('ul', null,
        h('li', null, 'Ohne Anmeldung: nichts auf dem Server. Fortschritt und Einstellungen (z. B. Großansicht) bleiben nur im Browser dieses Geräts (localStorage) und lassen sich dort jederzeit löschen.'),
        h('li', null, 'Mit Anmeldung über InfoLabs (folgt): nur die pseudonyme Kennung des Portals, der Anzeigename, die Kurse und der Lernstand in AutomatenLab. Keine Passwörter, keine persönlichen Codes, keine E-Mail-Adressen von Schülerinnen und Schülern.')),
      h('h2', null, 'Technik'),
      h('ul', null,
        h('li', null, 'Keine Cookies ohne Anmeldung, kein Tracking, keine externen Schriften, Skripte oder CDNs; Suchmaschinen werden an der Indexierung gehindert.'),
        h('li', null, 'Das Server-Protokoll enthält nur technische Meldungen (Start, Fehler).'))));
    // Portal-Adresse aus dem Manifest übernehmen, falls abweichend konfiguriert
    fetch('/api/plattform').then((r) => (r.ok ? r.json() : null)).then((m) => {
      const p = m?.auth?.portal;
      if (p && /^https?:\/\//.test(p)) { portalLink.href = `${p}/datenschutz`; portalLink.textContent = `${p}/datenschutz`; }
    }).catch(() => {});
  },
};
