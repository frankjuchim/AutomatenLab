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
        h('li', null, 'Mit Anmeldung über InfoLabs: die pseudonyme Kennung des Portals, der Anzeigename, die Kurse, der Zeitpunkt der letzten Aktivität und der Lernstand in AutomatenLab (je Aufgabe: gelöst, angesehen, Zahl der Fehlversuche und Tipps, Punkte, Zeitpunkt; beim Quiz die Wertung der Antworten; Abzeichen). Geprüft wird auf dem Server, damit Ergebnisse vergleichbar sind. Keine Passwörter, keine persönlichen Codes, keine E-Mail-Adressen. Kennzahlen (Punkte, gelöste Aufgaben, Anteil) gehen nur an das Portal, damit die Lehrkraft eine Übersicht über alle Plattformen hat. Löscht das Portal ein Konto oder einen Kurs, löscht AutomatenLab die zugehörigen Daten sofort.')),
      h('h2', null, 'Technik'),
      h('ul', null,
        h('li', null, 'Ohne Anmeldung keine Cookies. Mit Anmeldung ein technisch notwendiges Sitzungs-Cookie (signiert, httpOnly, SameSite=Lax; Schülerinnen und Schüler höchstens 30 Tage, Lehrkräfte höchstens 8 Stunden) und während der Anmeldung ein kurzlebiges Prüf-Cookie (10 Minuten). Kein Tracking, keine externen Schriften, Skripte oder CDNs; Suchmaschinen werden an der Indexierung gehindert.'),
        h('li', null, 'Das Server-Protokoll enthält nur technische Meldungen (Start, Fehler).'))));
    // Portal-Adresse aus dem Manifest übernehmen, falls abweichend konfiguriert
    fetch('/api/plattform').then((r) => (r.ok ? r.json() : null)).then((m) => {
      const p = m?.auth?.portal;
      if (p && /^https?:\/\//.test(p)) { portalLink.href = `${p}/datenschutz`; portalLink.textContent = `${p}/datenschutz`; }
    }).catch(() => {});
  },
};
