// Beamer-Board (PR 8, wie Algo Quest): öffentliche Ansicht eines Kurses für den Beamer, ohne Anmeldung, nur über den
// zufälligen Link aus den Kurs-Einstellungen der Lehrkraft (/board/<link> → #/board?t=<link>). Zeigt die Top 15,
// den Fortschritt des Kurses je Welt und die letzten Erfolge; lädt alle 20 Sekunden neu (nicht im Hintergrund-Tab).

import { h, clear } from '../core/dom.js';

const AKTUALISIERUNG_MS = 20000;
const MEDAILLE = { 1: '🥇', 2: '🥈', 3: '🥉' };
const prozent = (x) => (x > 0 && x < 0.005 ? '< 1 %' : `${Math.round(x * 100)} %`);

export default {
  title: 'Beamer-Board',
  mount(el, ctx) {
    const token = ctx.params.get('t') ?? '';
    let timer = null;
    let letzte = null;
    let aktiv = true;
    const hinweis = h('p', { class: 'board-hinweis', 'aria-live': 'polite' });

    const zeigeFehlt = () => clear(el, h('section', { class: 'page board-page' },
      h('h1', null, 'Beamer-Board'),
      h('p', { class: 'notice' }, 'Unter dieser Adresse ist kein Beamer-Board eingeschaltet. Lehrkräfte schalten es im Lehrkraft-Bereich unter ⚙️ Einstellungen ein und finden dort den Link.')));

    function zeichne(d) {
      const zeit = new Date(d.stand).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
      clear(el, h('section', { class: 'page board-page' },
        h('header', { class: 'board-kopf' },
          h('h1', null, d.kurs.name),
          h('p', { class: 'muted' }, `${d.schueler} ${d.schueler === 1 ? 'Mitglied' : 'Mitglieder'} · Stand ${zeit} Uhr`)),
        hinweis,
        h('div', { class: 'board-raster' },
          h('div', { class: 'panel board-liste' },
            h('h2', null, '🏆 Top 15'),
            d.liste.length
              ? h('ol', { class: 'board-plaetze' }, d.liste.map((z) => h('li', { class: z.platz <= 3 && z.punkte > 0 ? `board-platz-${z.platz}` : null },
                h('span', { class: 'board-platz' }, (z.punkte > 0 && MEDAILLE[z.platz]) || `${z.platz}.`),
                h('span', { class: 'board-name' }, z.name),
                h('span', { class: 'board-punkte' }, `${z.punkte} P.`))))
              : h('p', { class: 'muted' }, 'Noch niemand im Kurs.')),
          h('div', { class: 'board-rechts' },
            ...(d.challenges ?? []).map((c) => h('div', { class: 'panel board-challenge' },
              h('h2', null, `🎯 ${c.titel}`),
              h('p', { class: 'muted' }, `Zählt: ${c.zaehlt} · bis ${new Date(c.ende).toLocaleString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} Uhr`),
              c.teams
                ? h('ol', { class: 'board-plaetze' }, c.teams.map((t) => h('li', null,
                  h('span', { class: 'board-platz' }, (t.wert > 0 && MEDAILLE[t.platz]) || `${t.platz}.`),
                  h('span', { class: 'board-name' }, `${t.name} (${t.mitglieder})`),
                  h('span', { class: 'board-punkte' }, String(t.wert)))))
                : h('ol', { class: 'board-plaetze' }, c.liste.map((z) => h('li', null,
                  h('span', { class: 'board-platz' }, (z.wert > 0 && MEDAILLE[z.platz]) || `${z.platz}.`),
                  h('span', { class: 'board-name' }, z.name),
                  h('span', { class: 'board-punkte' }, String(z.wert))))))),
            h('div', { class: 'panel' },
              h('h2', null, '🗺️ Fortschritt des Kurses'),
              h('ul', { class: 'board-welten' }, d.welten.map((w) => h('li', null,
                h('span', { class: 'board-welt-titel' }, `Welt ${w.kennung} · ${w.titel}`),
                h('span', { class: 'lk-balken', role: 'img', 'aria-label': `${Math.round(w.anteil * 100)} Prozent` },
                  h('span', { class: 'lk-balken-fuellung', style: { width: `${Math.max(w.anteil > 0 ? 1 : 0, Math.round(w.anteil * 100))}%`, background: w.farbe } })),
                h('span', { class: 'board-welt-zahl' }, prozent(w.anteil)))))),
            h('div', { class: 'panel' },
              h('h2', null, '✨ Letzte Erfolge'),
              d.erfolge.length
                ? h('ul', { class: 'board-erfolge' }, d.erfolge.map((e) => h('li', null, e.text)))
                : h('p', { class: 'muted' }, 'Noch keine Abzeichen – das ändert sich gleich.'))))));
    }

    async function laden() {
      if (!aktiv) return;
      try {
        const r = await fetch(`/api/board/${encodeURIComponent(token)}`, { headers: { Accept: 'application/json' } });
        if (!aktiv) return;
        if (r.status === 404) { letzte = null; zeigeFehlt(); return; }
        if (!r.ok) throw new Error(String(r.status));
        letzte = await r.json();
        zeichne(letzte);
        hinweis.textContent = '';
      } catch {
        if (letzte) hinweis.textContent = 'Verbindung unterbrochen – die Anzeige wird neu geladen, sobald das Netz wieder da ist.';
        else zeigeFehlt();
      }
    }
    const planen = () => { clearInterval(timer); timer = setInterval(() => { if (!document.hidden) laden(); }, AKTUALISIERUNG_MS); };
    const sichtbar = () => { if (!document.hidden) laden(); };
    document.addEventListener('visibilitychange', sichtbar);
    clear(el, h('section', { class: 'page board-page' }, h('h1', null, 'Beamer-Board'), h('p', { class: 'muted' }, 'Lade …')));
    if (/^[A-Za-z0-9_-]{16}$/.test(token)) { laden(); planen(); } else zeigeFehlt();
    return () => { aktiv = false; clearInterval(timer); document.removeEventListener('visibilitychange', sichtbar); };
  },
};
