// Zusätzliches Material (#/material): Arbeitsblätter, Folien, Merkblätter als PDF – zum Nachlesen und Ausdrucken,
// zählt nicht für Punkte. Was jemand sieht, entscheidet der Server (GET /api/material):
//   Schüler: Schülerfassungen ohne Lösungen · Lehrkräfte: zusätzlich Lösungen, Folien mit Notizen, Klausuren
//   Admin: zusätzlich die docx/pptx-Originale (einzeln oder als ZIP je Akte)

import { h, clear } from '../core/dom.js';
import { api } from '../core/api.js';
import { anmeldeLink } from '../core/sitzung.js';
import { WORLDS } from '../data/worlds.js';
import { niveauPille } from '../components/niveau.js';

const groesse = (b) => (b == null ? '' : b >= 1e6 ? ` · ${(b / 1e6).toFixed(1).replace('.', ',')} MB` : ` · ${Math.max(1, Math.round(b / 1e3))} kB`);
const endung = (url) => (url.match(/\.([a-z]+)$/i)?.[1] || '').toUpperCase();

export default {
  title: 'Material',
  mount(el, ctx) {
    let aktiv = true;
    const seite = (...inhalt) => clear(el, h('section', { class: 'page narrow material' },
      h('a', { class: 'back-link', href: '#/' }, h('span', { 'aria-hidden': 'true' }, '‹ '), 'Übersicht'),
      h('h1', null, 'Zusätzliches Material'), ...inhalt));
    seite(h('p', { class: 'muted' }, 'Lade …'));

    api('GET', '/api/material').then((m) => {
      if (!aktiv) return;
      const lk = m.stufen.includes('lehrkraft');
      const admin = m.stufen.includes('original');
      const knopf = (d, stufe, text, cls) => (d[stufe]
        ? h('a', { class: ['btn', 'btn-small', cls], href: d[stufe].url, ...(stufe === 'original' ? { download: '' } : { target: '_blank', rel: 'noopener' }),
          'aria-label': `${d.titel}: ${text} (${endung(d[stufe].url)})` }, text, h('span', { class: 'material-groesse' }, text === endung(d[stufe].url) ? groesse(d[stufe].bytes).replace(' · ', ' ') : ` ${endung(d[stufe].url)}${groesse(d[stufe].bytes)}`))
        : null);
      const akte = (a) => h('li', { class: 'material-akte', 'data-welt': a.welt ?? 'alle' },
        h('div', { class: 'material-kopf' }, h('h3', null, a.titel), niveauPille(a.niveau),
          a.zip ? h('a', { class: 'btn btn-ghost btn-small material-zip', href: a.zip, download: '' }, 'Alle Originale als ZIP') : null),
        h('ul', { class: 'material-dateien' }, a.dateien.map((d) => h('li', null,
          h('span', { class: 'material-titel' }, d.titel, d.hinweis && lk ? h('span', { class: 'material-hinweis' }, ` (${d.hinweis})`) : null),
          h('span', { class: 'material-knoepfe' },
            knopf(d, 'schueler', lk ? 'Schülerfassung' : 'PDF', 'btn-primary'),
            knopf(d, 'lehrkraft', d.art === 'folien' ? 'mit Notizen' : 'Lehrkraftfassung', ''),
            knopf(d, 'original', 'Original', 'btn-ghost'))))));
      const gruppen = [...WORLDS.map((w) => ({ titel: `Welt ${w.id}: ${w.title}`, akten: m.akten.filter((a) => a.welt === w.id) })),
        { titel: lk ? 'Klausuren und ganze Einheit' : 'Zur ganzen Einheit', akten: m.akten.filter((a) => !a.welt) }].filter((g) => g.akten.length);
      seite(
        h('p', { class: 'lead' }, lk
          ? 'Arbeitsblätter, Folien und Merkblätter für den Unterricht – zusätzlich Lösungen, Folien mit Sprechernotizen, Erwartungshorizonte und Übungsklausuren.'
          : 'Arbeitsblätter, Folien und Merkblätter zum Nachlesen und Ausdrucken – passend zu den Leveln im Lab.'),
        h('p', { class: 'notice' }, h('strong', null, 'Zusatzmaterial: '), 'Es zählt nicht für Punkte. ',
          lk ? 'Schülerinnen und Schüler sehen hier nur die Schülerfassungen – ohne Lösungen und ohne Lösungsfolien.' : 'Lösungen bekommst du von deiner Lehrkraft.',
          admin ? ' Als Admin laden Sie zusätzlich die Word- und PowerPoint-Originale herunter.' : ''),
        lk ? h('p', null, h('a', { href: ctx.link('themen', { teil: 'niveaus' }) }, 'Welches Material ist für Grund- und Leistungskurs?')) : null,
        m.akten.length ? null : h('p', { class: 'muted' }, 'Auf diesem Server sind noch keine Materialien hinterlegt.'),
        gruppen.map((g) => h('section', { class: 'material-gruppe' }, h('h2', null, g.titel), h('ul', { class: 'material-liste' }, g.akten.map(akte)))));
    }).catch((e) => {
      if (!aktiv) return;
      if (e.status === 401) { location.replace(anmeldeLink(location.pathname + location.hash)); return; }
      seite(h('p', { class: e.status === 403 ? 'notice' : 'notice notice-error' }, e.message),
        h('p', null, h('a', { class: 'btn', href: '#/' }, 'Zur Übersicht')));
    });
    return () => { aktiv = false; };
  },
};
