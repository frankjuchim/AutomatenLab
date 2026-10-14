// Kompakte Material-Links je Akte (Themenseite): Schülerfassung, Lehrkraftfassung, gesperrte Einträge (nach Anmeldung).
// Daten aus GET /api/material – der Server entscheidet je Rolle, was sichtbar ist.
import { h } from '../core/dom.js';

const pdf = (url, text, label, cls = '') => h('a', { class: ['material-link', cls], href: url, target: '_blank', rel: 'noopener', 'aria-label': label }, text);

/** Liste der Dateien einer Akte als Inline-Links. */
export function materialLinks(dateien) {
  return h('ul', { class: 'material-links' }, dateien.map((d) => {
    if (d.gesperrt) return h('li', { class: 'material-gesperrt', title: 'nach Anmeldung über InfoLabs' }, h('span', { 'aria-hidden': 'true' }, '🔒 '), d.titel, h('span', { class: 'sr-only' }, ' (nach Anmeldung)'));
    const teile = [];
    if (d.schueler) teile.push(pdf(d.schueler.url, d.titel, `${d.titel} (PDF)`));
    if (d.lehrkraft) {
      const t = d.art === 'folien' ? 'mit Notizen' : d.art === 'video' ? 'mit Sprechertext' : 'Lehrkraftfassung';
      teile.push(d.schueler ? [' ', pdf(d.lehrkraft.url, `(${t})`, `${d.titel}: ${t} (PDF)`, 'material-link-lk')] : pdf(d.lehrkraft.url, d.titel, `${d.titel} (PDF, Lehrkraft)`, 'material-link-lk'));
    }
    return h('li', null, teile);
  }));
}
