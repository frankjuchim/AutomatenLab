// Live-Runden (Fähigkeit „live“, Vertrag v1.3 §7): Klassen-Quiz in Echtzeit, ohne Lab-Punkte.
//   #/live              laufende Live-Runde der eigenen Kurse (bei mehreren: Auswahl)
//   #/live?kurs=<id>    Live-Runde eines Kurses – Lehrkraft: Beamer-Ansicht mit Steuerung; Schüler: Antworten am Gerät
// Aktualisierung über Server-Sent Events (/api/live/<kurs>/strom); bricht die Verbindung ab, verbindet der Browser
// sich selbst neu. Auf dem Beamer stehen nur Zahlen, keine Namen; jede und jeder sieht das eigene Ergebnis.
// Die richtige Antwort schickt der Server erst beim Aufdecken.

import { h, clear } from '../core/dom.js';
import { api } from '../core/api.js';
import { anmeldeLink } from '../core/sitzung.js';
import { ARENA_AUTOMATEN } from '../data/arena.js';
import { dfa } from '../engine/dfa.js';
import { wordToString } from '../engine/tokenize.js';
import { GraphView } from '../components/graph-view.js';

const ARENA = new Map(ARENA_AUTOMATEN.map((a) => [a.id, a]));
const enc = encodeURIComponent;

/** Restzeit in Sekunden (Serverzeit über den Versatz zur eigenen Uhr). */
function restSek(z, versatz) {
  if (!z.bis) return null;
  return Math.max(0, Math.ceil((z.bis - (Date.now() + versatz)) / 1000));
}

export default {
  title: 'Live-Runde',
  mount(el, ctx) {
    let aktiv = true;
    let quelle = null;
    let uhr = null;
    let z = null;
    let versatz = 0;
    let frageSchluessel = null;
    let graph = null;
    let zeichnen = null; // Graph erst zeichnen, wenn er im Dokument steht
    const kurs = ctx.params.get('kurs');
    const status = h('p', { class: 'live-status', 'aria-live': 'polite' });
    const titel = (t) => h('h1', null, '📡 ', t);
    const lehrkraft = (zust) => !('ich' in zust); // nur Schüler bekommen ihr eigenes Ergebnis „ich“

    const fehler = (e) => {
      if (!aktiv) return;
      if (e.status === 401) { location.replace(anmeldeLink(location.pathname + location.hash)); return; }
      clear(el, h('section', { class: 'page live-page' }, titel('Live-Runde'), h('p', { class: 'notice notice-error' }, e.message)));
    };

    if (kurs && /^k:\d{1,12}$/.test(kurs)) verbinden();
    else auswahl();
    return () => { aktiv = false; quelle?.close(); clearInterval(uhr); };

    /* ---------- ohne Kurs: laufende Runden der eigenen Kurse ---------- */
    async function auswahl() {
      clear(el, h('section', { class: 'page live-page' }, titel('Live-Runde'), h('p', { class: 'muted' }, 'Lade …')));
      try {
        const liste = await api('GET', '/api/live');
        if (!aktiv) return;
        const fuerMich = liste.filter((r) => r.rolle === 'mitglied');
        if (fuerMich.length === 1) { ctx.navigate('live', { kurs: fuerMich[0].kurs }); return; }
        clear(el, h('section', { class: 'page live-page' },
          h('a', { class: 'back-link', href: '#/' }, h('span', { 'aria-hidden': 'true' }, '‹ '), 'Übersicht'),
          titel('Live-Runde'),
          h('p', { class: 'lead' }, 'Deine Lehrkraft startet eine Live-Runde im Unterricht. Du antwortest hier, die Ergebnisse erscheinen auf dem Beamer – ohne Namen und ohne Auswirkung auf deine Punkte.'),
          liste.length
            ? h('ul', { class: 'boss-karten' }, liste.map((r) => h('li', null, h('a', { class: ['panel', 'boss-karte'], href: ctx.link('live', { kurs: r.kurs }) },
              h('span', { class: 'boss-karte-welt' }, r.rolle === 'lehrkraft' ? '📡 Ihre Runde' : '📡 läuft'),
              h('strong', { class: 'boss-karte-titel' }, r.titel),
              h('span', { class: 'muted' }, r.kursName)))))
            : h('p', { class: 'notice' }, 'Gerade läuft in deinen Kursen keine Live-Runde. Sobald deine Lehrkraft eine startet, erscheint sie hier und auf der Startseite.'),
          h('p', null, h('button', { type: 'button', class: 'btn', onclick: () => auswahl() }, '↻ Neu laden'))));
      } catch (e) { fehler(e); }
    }

    /* ---------- mit Kurs: Zustand laden, Strom abonnieren ---------- */
    async function verbinden() {
      clear(el, h('section', { class: 'page live-page' }, titel('Live-Runde'), h('p', { class: 'muted' }, 'Verbinde …')));
      try {
        zeige(await api('GET', `/api/live/${enc(kurs)}`));
      } catch (e) { fehler(e); return; }
      if (!aktiv) return;
      quelle = new EventSource(`/api/live/${enc(kurs)}/strom`);
      quelle.addEventListener('zustand', (ev) => { try { status.textContent = ''; zeige(JSON.parse(ev.data)); } catch { /* ungültig: ignorieren */ } });
      quelle.onerror = () => { if (aktiv) status.textContent = 'Verbindung unterbrochen – wird neu aufgebaut …'; };
      uhr = setInterval(tick, 250);
    }

    function tick() {
      if (!z || z.phase !== 'frage') return;
      const rest = restSek(z, versatz);
      const anzeige = el.querySelector('.live-uhr');
      if (anzeige && rest != null) {
        anzeige.textContent = rest > 0 ? `${rest} s` : 'Zeit!';
        anzeige.classList.toggle('is-knapp', rest <= 5);
      }
      if (rest === 0 && !z.lehrkraft) for (const b of el.querySelectorAll('.live-option')) b.disabled = true;
    }

    function zeige(neu) {
      if (!aktiv) return;
      z = { ...neu, lehrkraft: neu.aktiv ? lehrkraft(neu) : z?.lehrkraft ?? false };
      if (neu.jetzt) versatz = neu.jetzt - Date.now();
      if (!neu.aktiv) {
        clear(el, h('section', { class: 'page live-page' },
          h('a', { class: 'back-link', href: z.lehrkraft ? `#/lehrkraft?kurs=${enc(kurs)}&tab=live` : '#/' }, h('span', { 'aria-hidden': 'true' }, '‹ '), z.lehrkraft ? 'Zum Kurs' : 'Übersicht'),
          titel('Live-Runde'), status,
          h('p', { class: 'notice' }, z.lehrkraft ? 'In diesem Kurs läuft keine Live-Runde. Starten Sie eine im Lehrkraft-Bereich unter 📡 Live.' : 'Gerade läuft keine Live-Runde. Diese Seite aktualisiert sich von selbst, sobald deine Lehrkraft eine startet.')));
        frageSchluessel = null;
        return;
      }
      // Nur bei neuer Frage, Phase oder eigener Antwort neu zeichnen; Zählerstände an Ort und Stelle
      const schluessel = `${neu.id}:${neu.nr}:${neu.phase}:${z.lehrkraft ? '' : neu.meineWahl}:${neu.phase === 'lobby' || neu.phase === 'ende' ? neu.teilnehmer : ''}`;
      if (schluessel === frageSchluessel) {
        for (const x of el.querySelectorAll('.live-teilnehmer')) x.textContent = `👥 ${neu.teilnehmer}`;
        const b = el.querySelector('.live-beantwortet');
        if (b) b.textContent = `${neu.beantwortet} von ${neu.teilnehmer} haben geantwortet.`;
        return;
      }
      frageSchluessel = schluessel;
      status.textContent = '';
      zeichnen = null;
      clear(el, z.lehrkraft ? beamer(z) : schueler(z));
      zeichnen?.();
      tick();
    }

    /* ---------- gemeinsame Teile ---------- */
    function kopf(zust) {
      const nr = zust.phase === 'lobby' ? 'Gleich geht es los' : zust.phase === 'ende' ? 'Ergebnis' : `Frage ${zust.nr + 1} von ${zust.anzahl}`;
      return h('header', { class: 'live-kopf' },
        h('div', null, h('p', { class: 'live-titel' }, '📡 ', zust.titel), h('h1', null, nr)),
        h('div', { class: 'live-kopf-rechts' },
          zust.phase === 'frage' && zust.bis ? h('span', { class: 'live-uhr', role: 'timer', 'aria-label': 'Restzeit' }) : null,
          h('span', { class: 'live-teilnehmer', title: 'dabei' }, `👥 ${zust.teilnehmer}`)));
    }

    function frageBlock(f) {
      const teile = [h('p', { class: 'live-frage' }, f.art === 'sortierer' ? `Sprache: ${f.text}` : f.text)];
      if (f.hinweis) teile.push(h('p', { class: 'muted' }, f.hinweis));
      if (f.art === 'arena') {
        const a = ARENA.get(f.automat);
        if (a) {
          const box = h('div', { class: 'live-graph' });
          const A = dfa(a.automat);
          graph = new GraphView(box, { label: `Zustandsgraph: ${a.titel}` });
          zeichnen = () => graph.render(A).catch(() => {});
          teile.unshift(h('p', { class: 'live-titel' }, a.titel));
          teile.push(box, h('p', { class: 'live-wort' }, 'Wort: ', h('strong', null, f.wort.length ? `„${wordToString(f.wort, A.alphabet)}“` : 'ε (leeres Wort)')));
        }
      }
      return teile;
    }

    /* ---------- Beamer-Ansicht der Lehrkraft (mit Steuerung) ---------- */
    function beamer(zust) {
      const steuern = async (pfad) => {
        try { zeige(await api('POST', `/api/lehrer/kurse/${enc(kurs)}/live${pfad}`, {})); } catch (e) { status.textContent = e.message; }
      };
      const weiterText = { lobby: '▶ Erste Frage', frage: '👁 Auflösen', aufgedeckt: zust.nr + 1 >= zust.anzahl ? '🏁 Ergebnis zeigen' : '▶ Nächste Frage' }[zust.phase];
      const leiste = h('div', { class: 'live-steuerung' },
        weiterText ? h('button', { type: 'button', class: 'btn btn-primary', onclick: () => steuern('/weiter') }, weiterText) : null,
        h('button', { type: 'button', class: 'btn btn-ghost', onclick: () => { if (zust.phase === 'ende' || confirm('Live-Runde beenden?')) steuern('/beenden'); } }, zust.phase === 'ende' ? 'Runde schließen' : 'Beenden'),
        h('a', { class: 'btn btn-ghost', href: `#/lehrkraft?kurs=${enc(kurs)}&tab=live` }, 'Zum Kurs'));
      let inhalt;
      if (zust.phase === 'lobby') {
        inhalt = h('div', { class: 'panel live-lobby' },
          h('p', { class: 'lead' }, 'Öffnet AutomatenLab auf eurem Gerät und tippt auf der Startseite auf „📡 Live-Runde“.'),
          h('p', { class: 'live-adresse' }, `${location.origin}/#/live`),
          h('p', null, zust.teilnehmer === 1 ? '1 Person ist dabei.' : `${zust.teilnehmer} Personen sind dabei.`));
      } else if (zust.phase === 'ende') {
        const max = Math.max(1, ...zust.richtigVerteilung);
        inhalt = h('div', { class: 'live-raster' },
          h('div', { class: 'panel' }, h('h2', null, 'Wie viele Fragen richtig?'),
            h('ul', { class: 'live-balken-liste' }, zust.richtigVerteilung.map((n, k) => h('li', null,
              h('span', { class: 'live-balken-text' }, `${k} von ${zust.anzahl}`),
              h('span', { class: 'lk-balken', role: 'img', 'aria-label': `${n} Personen` }, h('span', { class: 'lk-balken-fuellung', style: { width: `${Math.round((100 * n) / max)}%` } })),
              h('span', { class: 'live-balken-zahl' }, String(n)))).reverse())),
          h('div', { class: 'panel' }, h('h2', null, 'Fragen'),
            h('ol', { class: 'live-fragen-liste' }, zust.fragen.map((f) => h('li', null,
              h('span', null, f.art === 'arena' ? 'Akzeptiert der Automat das Wort?' : f.text.split('\n')[0]),
              h('span', { class: 'muted' }, f.antworten ? ` – ${Math.round((100 * f.richtigAnzahl) / f.antworten)} % richtig (${f.antworten} Antworten)` : ' – keine Antworten'))))));
      } else {
        const aus = zust.auswertung;
        const max = Math.max(1, ...(aus ? Object.values(aus.verteilung) : [1]));
        inhalt = h('div', { class: 'panel live-buehne' },
          ...frageBlock(zust.frage),
          h('ol', { class: 'live-optionen live-optionen-beamer' }, zust.frage.optionen.map((o, k) => h('li', { class: aus ? (o.id === aus.richtig ? 'is-richtig' : 'is-falsch') : null },
            h('span', { class: 'live-buchstabe', 'aria-hidden': 'true' }, 'ABCDEF'[k]),
            h('span', { class: 'live-option-text' }, o.text),
            aus ? h('span', { class: 'live-option-zahl' },
              h('span', { class: 'lk-balken', role: 'img', 'aria-label': `${aus.verteilung[o.id]} Antworten` }, h('span', { class: 'lk-balken-fuellung', style: { width: `${Math.round((100 * aus.verteilung[o.id]) / max)}%` } })),
              ` ${aus.verteilung[o.id]}`, o.id === aus.richtig ? ' ✔' : '') : null))),
          aus
            ? h('p', { class: 'lead' }, `${aus.richtigAnzahl} von ${aus.antworten} richtig.`, aus.erklaerung ? h('span', { class: 'live-erklaerung' }, ` ${aus.erklaerung}`) : null)
            : h('p', { class: 'lead live-beantwortet', 'aria-live': 'polite' }, `${zust.beantwortet} von ${zust.teilnehmer} haben geantwortet.`));
      }
      return h('section', { class: 'page live-page live-beamer' }, kopf(zust), status, inhalt, leiste);
    }

    /* ---------- Ansicht der Schülerinnen und Schüler ---------- */
    function schueler(zust) {
      let inhalt;
      if (zust.phase === 'lobby') {
        inhalt = h('div', { class: 'panel live-lobby' }, h('p', { class: 'lead' }, '✔ Du bist dabei. Gleich zeigt deine Lehrkraft die erste Frage.'));
      } else if (zust.phase === 'ende') {
        inhalt = h('div', { class: 'panel live-lobby' },
          h('p', { class: 'lead' }, `Du hattest ${zust.ich.richtig} von ${zust.anzahl} Fragen richtig – ${zust.ich.punkte} Punkte in dieser Runde.`),
          h('p', { class: 'muted' }, 'Live-Runden zählen nicht für deine Punkte im Lab. Danke fürs Mitmachen!'),
          h('p', null, h('a', { class: 'btn', href: '#/' }, 'Zur Übersicht')));
      } else {
        const aus = zust.auswertung;
        const antworten = async (wahl) => {
          for (const b of el.querySelectorAll('.live-option')) b.disabled = true;
          try { await api('POST', `/api/live/${enc(kurs)}/antwort`, { nr: zust.nr, wahl }); status.textContent = 'Antwort gespeichert.'; } catch (e) { status.textContent = e.message; }
        };
        inhalt = h('div', { class: 'panel live-buehne' },
          ...frageBlock(zust.frage),
          h('div', { class: 'live-optionen live-optionen-knoepfe' }, zust.frage.optionen.map((o, k) => {
            const gewaehlt = zust.meineWahl === o.id;
            const klasse = ['btn', 'live-option', gewaehlt ? 'is-gewaehlt' : null, aus ? (o.id === aus.richtig ? 'is-richtig' : gewaehlt ? 'is-falsch' : null) : null];
            return h('button', { type: 'button', class: klasse, disabled: !!(zust.meineWahl || aus), 'aria-pressed': gewaehlt ? 'true' : 'false', onclick: () => antworten(o.id) },
              h('span', { class: 'live-buchstabe', 'aria-hidden': 'true' }, 'ABCDEF'[k]), ' ', o.text);
          })),
          aus
            ? h('p', { class: ['lead', zust.meineWahl === aus.richtig ? 'live-gut' : 'live-schlecht'] },
              zust.meineWahl == null ? 'Diesmal keine Antwort.' : zust.meineWahl === aus.richtig ? '✔ Richtig!' : '✘ Leider falsch.',
              aus.erklaerung ? h('span', { class: 'live-erklaerung' }, ` ${aus.erklaerung}`) : null)
            : h('p', { class: 'muted' }, zust.meineWahl ? 'Warte auf die Auflösung …' : 'Tippe auf deine Antwort.'));
      }
      return h('section', { class: 'page live-page' }, kopf(zust), status, inhalt,
        h('p', { class: 'muted klein' }, `Deine Punkte in dieser Runde: ${zust.ich.punkte}`));
    }
  },
};
