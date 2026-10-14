// Lehrkraft-Bereich (Vertrag InfoLabs §7: urls.lehrkraft = /lehrer → #/lehrkraft). Anmeldung nur über das Portal.
// Aufbau wie der Lehrkraft-Bereich von Algo Quest, damit sich Lehrkräfte in allen Labs gleich zurechtfinden:
//   Navigation  📚 Kurse · 📖 Aufgaben · 📂 Materialien · 🗺️ Themen · ⌂ Portal
//   #/lehrkraft                          Meine Kurse (Tabelle, „Öffnen“)
//   #/lehrkraft?kurs=<id>&tab=<reiter>   Kursseite mit Reitern 👥 Schüler · 🔗 Beitritt · 📊 Auswertung · 🏆 Rangliste ·
//                                        ⚙️ Einstellungen (reiter: schueler | beitritt | auswertung | rangliste | einstellungen)
//   #/lehrkraft?teil=aufgaben            Aufgaben der Welten (nach Level, mit Link ins Modul)
// Was das Portal verwaltet (Kurse anlegen/löschen, Kurscode, Schülerkonten), steht hier nur als Hinweis.
// Ohne Sitzung leitet die Seite still zum Portal (INTEGRATION.md §3.1).

import { h, clear } from '../core/dom.js';
import { api } from '../core/api.js';
import { sitzung, anmeldeLink, istLehrkraft } from '../core/sitzung.js';
import { WORLDS, LEVELS } from '../data/worlds.js';
import { LEVEL_NIVEAU, NIVEAUS } from '../data/niveaus.js';
import { MODULES } from './manifest.js';

const REITER = [
  ['schueler', '👥 Schüler'],
  ['beitritt', '🔗 Beitritt'],
  ['auswertung', '📊 Auswertung'],
  ['rangliste', '🏆 Rangliste'],
  ['einstellungen', '⚙️ Einstellungen'],
];
const KURSART = { eA: 'Leistungskurs (eA)', gA: 'Grundkurs (gA)' };
const MODUL_TITEL = Object.fromEntries(MODULES.map((m) => [m.route, m.title]));
const STUFE = { 1: 'Basis', 2: 'Standard', 3: 'Profi' };

/** Deep-Link einer Katalog-Aufgabe (Parameter wie in app/README.md) – für die Vorschau mit &vorschau=1. */
export function aufgabenLink(a) {
  const k = a.schluessel ?? a.id.split(':')[1];
  const p = {
    quiz: () => (/^welt-/.test(k) ? { welt: k.slice(5) } : { ds: k.replace(/^ds-?0*/, '') }),
    detektiv: () => ({ fall: a.nr }),
    baukasten: () => ({ aufgabe: k }),
    minimierer: () => ({ aufgabe: a.nr }),
    mealy: () => ({ aufgabe: a.nr, modus: a.art === 'vorhersage' ? 'vorhersage' : 'bugjagd' }),
    ueberliste: () => ({ stufe: a.id === 'ueberliste:bonus' ? 'bonus' : a.nr }),
    parallelwelten: () => ({ aufgabe: a.nr, modus: a.art === 'raetsel' ? 'spiel' : 'teilmengen' }),
    keller: () => ({ aufgabe: a.nr, modus: a.art === 'rueckwaerts' ? 'rueckwaerts' : 'tabelle' }),
    rallye: () => ({ aufgabe: a.nr }),
    grammatik: () => ({ challenge: a.nr }),
    turing: () => ({ challenge: a.nr }),
  }[a.modul];
  const q = new URLSearchParams({ ...(p ? p() : {}), vorschau: '1' });
  return `#/${a.modul}?${q}`;
}

const zeit = (iso) => {
  if (!iso) return '–';
  const d = new Date(iso);
  const heute = new Date();
  const uhr = d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  return d.toDateString() === heute.toDateString() ? `heute, ${uhr}` : d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
};
const prozent = (x) => (x == null ? '–' : `${Math.round(x * 100)} %`);
const kurslink = (id, tab) => `#/lehrkraft?${new URLSearchParams({ kurs: id, ...(tab && tab !== 'schueler' ? { tab } : {}) })}`;
/** Heatmap-Stufe 0–4 für eine Zelle (Anteil der Level-Punkte). */
const heat = (x) => (x == null ? 'leer' : x <= 0 ? 0 : x < 0.25 ? 1 : x < 0.5 ? 2 : x < 0.75 ? 3 : 4);

function tabelle(kopf, zeilen, { klasse = '' } = {}) {
  return h('div', { class: 'tabelle-scroll' }, h('table', { class: ['lk-tabelle', klasse] },
    h('thead', null, h('tr', null, kopf.map((k) => h('th', { scope: 'col' }, k)))),
    h('tbody', null, zeilen)));
}

export default {
  title: 'Lehrkräfte',
  mount(el, ctx) {
    let aktiv = true;
    let portal = null;
    const kursId = ctx.params.get('kurs');
    const teil = ctx.params.get('teil');
    const navAktiv = teil === 'aufgaben' ? 'aufgaben' : 'kurse';

    /** Rahmen jeder Seite: Überschrift und Navigation des Bereichs (wie die Kopfzeile von Algo Quest). */
    function seite(...inhalt) {
      const punkt = (id, href, text) => h('li', null, h('a', { href, ...(id === navAktiv ? { 'aria-current': 'page' } : {}) }, text));
      clear(el, h('section', { class: 'page lk-page' },
        h('a', { class: 'back-link', href: '#/' }, h('span', { 'aria-hidden': 'true' }, '‹ '), 'Übersicht'),
        h('h1', null, 'Bereich für Lehrkräfte'),
        h('nav', { class: 'lk-nav', 'aria-label': 'Lehrkraft-Bereich' }, h('ul', null,
          punkt('kurse', '#/lehrkraft', '📚 Kurse'),
          punkt('aufgaben', '#/lehrkraft?teil=aufgaben', '📖 Aufgaben'),
          punkt('material', ctx.link('material'), '📂 Materialien'),
          punkt('themen', ctx.link('themen'), '🗺️ Themen'),
          portal ? punkt('portal', portal + '/', '⌂ Portal') : null)),
        ...inhalt));
    }
    const fehlerSeite = (e) => {
      if (e?.status === 401) { location.replace(anmeldeLink(location.pathname + location.hash)); return; }
      seite(h('p', { class: 'notice notice-error' }, e?.status === 404 ? 'Diesen Kurs gibt es nicht – oder Sie unterrichten ihn nicht.' : `Das konnte nicht geladen werden: ${e?.message ?? 'unbekannter Fehler'}. Bitte laden Sie die Seite neu.`),
        h('p', null, h('a', { class: 'btn', href: '#/lehrkraft' }, 'Zu den Kursen')));
    };

    clear(el, h('section', { class: 'page lk-page' }, h('h1', null, 'Bereich für Lehrkräfte'), h('p', { class: 'muted' }, 'Lade …')));

    sitzung().then(async ({ konto, anmeldung, portal: p }) => {
      if (!aktiv) return;
      portal = p;
      if (!konto) {
        if (anmeldung) { location.replace(anmeldeLink(location.pathname + location.hash)); return; }
        seite(h('p', { class: 'lead' }, 'Hier sehen Sie den Lernstand Ihrer Kurse, werten Aufgaben aus und stellen die Kursart ein. Die Anmeldung läuft über das Portal InfoLabs.'),
          h('p', { class: 'notice' }, 'Die Anmeldung über das Portal ist auf diesem Server noch nicht eingerichtet.'));
        return;
      }
      if (!istLehrkraft(konto)) {
        seite(h('p', { class: 'notice' }, 'Dieser Bereich ist nur für Lehrkräfte.'), h('p', null, h('a', { class: 'btn', href: '#/' }, 'Zur Übersicht')));
        return;
      }
      try {
        if (teil === 'aufgaben') await aufgabenSeite();
        else if (kursId) await kursSeite(kursId, ctx.params.get('tab') || 'schueler');
        else await kursListe(konto);
      } catch (e) { if (aktiv) fehlerSeite(e); }
    });

    /* ───────────── 📚 Meine Kurse ───────────── */
    async function kursListe(konto) {
      const kurse = await api('GET', '/api/lehrer/kurse');
      if (!aktiv) return;
      seite(
        h('h2', null, konto.rolle === 'superadmin' ? 'Alle Kurse' : 'Meine Kurse'),
        kurse.length
          ? tabelle(['Kurs', 'Kursart', 'Schüler', 'zuletzt aktiv', ''], kurse.map((k) => h('tr', null,
            h('td', null, h('a', { href: kurslink(k.id) }, h('strong', null, k.name))),
            h('td', null, KURSART[k.kursart] ?? '–'),
            h('td', { class: 'zahl' }, String(k.schueler)),
            h('td', null, zeit(k.zuletztAktiv)),
            h('td', null, h('a', { class: 'btn btn-small', href: kurslink(k.id) }, 'Öffnen')))))
          : h('p', { class: 'notice' }, 'Noch kein Kurs mit AutomatenLab. Legen Sie im Portal einen Kurs an und schalten Sie AutomatenLab frei; nach der nächsten Anmeldung erscheint er hier.'),
        h('div', { class: 'panel lk-karte' },
          h('h3', null, 'Neuen Kurs anlegen'),
          h('p', null, 'Kurse, Kurscodes und Schülerkonten verwalten Sie zentral im Portal InfoLabs – für alle Labs gemeinsam. Hier erscheinen die Kurse, für die AutomatenLab freigeschaltet ist.'),
          portal ? h('p', null, h('a', { class: 'btn', href: portal + '/' }, '⌂ Zum Portal')) : null));
    }

    /* ───────────── Kursseite mit Reitern ───────────── */
    async function kursSeite(id, tab) {
      if (!REITER.some(([r]) => r === tab)) tab = 'schueler';
      const kurs = await api('GET', `/api/lehrer/kurse/${encodeURIComponent(id)}`);
      if (!aktiv) return;
      const inhalt = h('div', { class: 'lk-reiter-inhalt' }, h('p', { class: 'muted' }, 'Lade …'));
      seite(
        h('p', { class: 'lk-krumen' }, h('a', { href: '#/lehrkraft' }, 'Kurse'), ' › ', kurs.name),
        h('div', { class: 'lk-kurskopf' },
          h('h2', null, kurs.name, ' ', h('span', { class: 'niveau-pille niveau-alle' }, KURSART[kurs.einstellungen.kursart]))),
        h('nav', { class: 'mode-tabs lk-reiter', 'aria-label': 'Kurs' }, REITER.map(([r, text]) =>
          h('a', { href: kurslink(id, r), ...(r === tab ? { 'aria-current': 'page', class: 'is-active' } : {}) }, text))),
        inhalt);
      const zeige = (...x) => { if (aktiv) clear(inhalt, ...x); };
      try {
        if (tab === 'schueler') zeige(...reiterSchueler(await api('GET', `/api/lehrer/kurse/${encodeURIComponent(id)}/schueler`)));
        else if (tab === 'beitritt') zeige(...reiterBeitritt(kurs));
        else if (tab === 'auswertung') zeige(...reiterAuswertung(id, await api('GET', `/api/lehrer/kurse/${encodeURIComponent(id)}/auswertung`)));
        else if (tab === 'rangliste') zeige(...reiterRangliste(await api('GET', `/api/lehrer/kurse/${encodeURIComponent(id)}/schueler`)));
        else zeige(...reiterEinstellungen(id, kurs));
      } catch (e) {
        if (e.status === 401) { location.replace(anmeldeLink(location.pathname + location.hash)); return; }
        zeige(h('p', { class: 'notice notice-error' }, e.message));
      }
    }

    const leer = () => h('p', { class: 'notice' }, 'Noch niemand in diesem Kurs. Ihre Schülerinnen und Schüler treten dem Kurs im Portal mit dem Kurscode bei und öffnen AutomatenLab einmal – dann erscheinen sie hier (siehe Reiter „Beitritt“).');

    /* 👥 Schüler */
    function reiterSchueler(liste) {
      return [h('div', { class: 'panel lk-karte' },
        h('h3', null, `Schüler (${liste.length})`),
        liste.length
          ? tabelle(['Name', 'Punkte', 'davon Training', 'gelöst', 'Lösung angesehen', 'Abzeichen', 'Rang', 'zuletzt aktiv'], liste.map((s) => h('tr', null,
            h('td', null, s.name), h('td', { class: 'zahl' }, String(s.punkte)), h('td', { class: 'zahl' }, String(s.trainingPunkte)),
            h('td', { class: 'zahl' }, String(s.geloest)), h('td', { class: 'zahl' }, String(s.angesehen)), h('td', { class: 'zahl' }, String(s.abzeichen)),
            h('td', { class: 'zahl' }, String(s.rang)), h('td', null, zeit(s.zuletztAktiv)))))
          : leer(),
        h('p', { class: 'muted klein' }, 'Namen ändern, Konten löschen oder neue persönliche Codes vergeben Sie im Portal. Der Lernstand gehört zum Konto: Wer in mehreren Ihrer Kurse ist, hat überall denselben Stand.'))];
    }

    /* 🔗 Beitritt */
    function reiterBeitritt(kurs) {
      const start = `${location.origin}/`;
      return [
        h('div', { class: 'panel lk-karte' },
          h('h3', null, 'Beitritt über das Portal'),
          h('ol', { class: 'lk-schritte' },
            h('li', null, 'Schülerinnen und Schüler treten Ihrem Kurs „', kurs.name, '“ im Portal InfoLabs mit dem Kurscode bei (Kurscode und QR-Code finden Sie dort in der Kursverwaltung).'),
            h('li', null, 'Im Portal tippen sie auf AutomatenLab – die Anmeldung läuft automatisch, ohne eigenes Passwort.'),
            h('li', null, 'Nach dem ersten Öffnen erscheinen sie unter „👥 Schüler“.')),
          portal ? h('p', null, h('a', { class: 'btn btn-primary', href: portal + '/' }, '⌂ Kursverwaltung im Portal')) : null),
        h('div', { class: 'panel lk-karte' },
          h('h3', null, 'Direkt zu einer Aufgabe'),
          h('p', null, 'Die QR-Codes auf den Arbeitsblättern führen direkt zur passenden Aufgabe; ohne Sitzung geht es erst über die Anmeldung im Portal und dann genau dorthin. Startseite von AutomatenLab:'),
          h('p', null, h('code', null, start))),
      ];
    }

    /* 📊 Auswertung */
    function reiterAuswertung(id, a) {
      const csv = (art, text) => h('a', { class: 'btn btn-small', href: `/api/lehrer/kurse/${encodeURIComponent(id)}/export.csv?art=${art}`, download: '' }, `⬇ ${text}`);
      const lv = a.matrix.levels;
      const gA = a.kurs.kursart === 'gA';
      const matrix = a.matrix.zeilen.length
        ? h('div', { class: 'tabelle-scroll' }, h('table', { class: 'lk-tabelle lk-matrix' },
          h('thead', null,
            h('tr', null, h('th', { scope: 'col', rowspan: 2 }, 'Name'), WORLDS.map((w) => h('th', { scope: 'colgroup', colspan: w.levels.length, class: 'lk-welt' }, `Welt ${w.id}`))),
            h('tr', null, lv.map((l) => h('th', { scope: 'col', class: [!l.imKurs && 'lk-freiwillig'], title: `Level ${l.nr}: ${l.titel} · ${NIVEAUS[l.niveau]?.kurz ?? ''}${l.imKurs ? '' : ' · nicht im Kursumfang'}` }, String(l.nr))))),
          h('tbody', null, a.matrix.zeilen.map((z) => h('tr', null,
            h('th', { scope: 'row' }, z.name),
            z.werte.map((w, i) => h('td', { class: ['lk-heat', `heat-${heat(w.anteil)}`], title: `${z.name} · Level ${lv[i].nr}: ${w.punkte} von ${lv[i].maxPunkte} Punkten, ${w.geloest} gelöst${w.angesehen ? `, ${w.angesehen} × Lösung angesehen` : ''}` },
              w.anteil ? String(Math.round(w.anteil * 100)) : '')))))))
        : leer();

      let welt = 'A'; // wie die Matrix nach Welten; „Alle Welten“ zeigt alle Aufgaben
      const statBody = h('tbody');
      const zeichneStat = () => clear(statBody, a.aufgaben.filter((x) => !welt || x.welt === welt).map((x) => h('tr', null,
        h('td', null, x.titel, h('span', { class: 'muted klein' }, ` · ${MODUL_TITEL[x.modul] ?? x.modul}`)),
        h('td', null, x.level == null ? '–' : String(x.level)),
        h('td', null, STUFE[x.stufe] ?? String(x.stufe)),
        h('td', { class: 'zahl' }, String(x.versucht)),
        h('td', { class: 'zahl' }, prozent(x.quote)),
        h('td', { class: 'zahl' }, x.fehlversucheSchnitt == null ? '–' : String(x.fehlversucheSchnitt).replace('.', ',')),
        h('td', { class: 'zahl' }, x.tippsSchnitt == null ? '–' : String(x.tippsSchnitt).replace('.', ',')),
        h('td', { class: 'zahl' }, String(x.angesehen)),
        h('td', { class: 'lk-falsch' }, x.falscheAntworten.length ? h('ul', null, x.falscheAntworten.map((f) => h('li', null, f.antwort, h('span', { class: 'muted' }, ` (${f.anzahl}×)`)))) : '–'))));
      const filter = h('div', { class: 'chip-row', role: 'group', 'aria-label': 'Welt filtern' }, [['', 'Alle Welten'], ...WORLDS.map((w) => [w.id, `Welt ${w.id}`])].map(([k, text]) =>
        h('button', { type: 'button', class: 'chip', 'aria-pressed': String(k === welt), onclick: (e) => {
          welt = k; e.currentTarget.parentElement.querySelectorAll('.chip').forEach((b) => b.setAttribute('aria-pressed', String(b === e.currentTarget))); zeichneStat();
        } }, text)));
      zeichneStat();

      return [
        h('div', { class: 'panel lk-karte' }, h('h3', null, 'Export'), h('p', { class: 'start-actions' }, csv('uebersicht', 'Übersicht (CSV)'), csv('matrix', 'Matrix (CSV)'), csv('aufgaben', 'Aufgaben (CSV)'))),
        h('div', { class: 'panel lk-karte' },
          h('h3', null, 'Lernstand-Matrix (% der Level-Punkte)'),
          h('p', { class: 'muted klein' }, 'Zeile = Schüler, Spalte = Level (Doppelstunde). Ohne Zahl: noch nichts erreicht. Trainingspunkte (Arena, Unterscheide!, Sortierer) zählen hier nicht.',
            gA ? ' Gestrichelte Level gehören nicht zum Grundkurs-Umfang (freiwillig).' : ' Gestrichelte Level sind Zusatz über das Kerncurriculum hinaus.'),
          matrix,
          h('p', { class: 'lk-legende muted klein', 'aria-hidden': 'true' }, 'Legende: ', [0, 1, 2, 3, 4].map((s, i) => h('span', { class: ['lk-heat', `heat-${s}`] }, ['nichts', '< 25', '< 50', '< 75', '≥ 75'][i])))),
        h('div', { class: 'panel lk-karte' },
          h('h3', null, 'Aufgabenstatistik'),
          filter,
          h('div', { class: 'tabelle-scroll' }, h('table', { class: 'lk-tabelle' },
            h('thead', null, h('tr', null, ['Aufgabe', 'Level', 'Stufe', 'versucht', 'Lösungsquote', 'Ø Fehlversuche', 'Ø Tipps', 'angesehen', 'häufige falsche Antworten'].map((k) => h('th', { scope: 'col' }, k)))),
            statBody)),
          h('p', { class: 'muted klein' }, '„versucht“ = mindestens einmal geprüft oder einen Tipp geholt; „angesehen“ = „Lösung zeigen“ benutzt (0 Punkte).')),
      ];
    }

    /* 🏆 Rangliste */
    function reiterRangliste(liste) {
      const sortiert = [...liste].sort((x, y) => x.rang - y.rang || x.name.localeCompare(y.name, 'de'));
      return [h('div', { class: 'panel lk-karte' },
        h('h3', null, 'Rangliste nach Punkten'),
        h('p', { class: 'muted klein' }, 'Nur für Sie sichtbar – Schülerinnen und Schüler sehen in AutomatenLab keine Rangliste. Punkte aus Aufgaben und Training.'),
        sortiert.length
          ? tabelle(['Platz', 'Name', 'Punkte', 'Abzeichen', 'gelöst'], sortiert.map((s) => h('tr', null,
            h('td', { class: 'zahl' }, `${s.rang}.`), h('td', null, s.name), h('td', { class: 'zahl' }, String(s.punkte)), h('td', { class: 'zahl' }, String(s.abzeichen)), h('td', { class: 'zahl' }, String(s.geloest)))))
          : leer())];
    }

    /* ⚙️ Einstellungen */
    function reiterEinstellungen(id, kurs) {
      const status = h('p', { class: 'lk-status', 'aria-live': 'polite' });
      const auswahl = Object.entries(KURSART).map(([k, text]) => h('label', { class: 'check' },
        h('input', { type: 'radio', name: 'kursart', value: k, checked: kurs.einstellungen.kursart === k }), ` ${text}`));
      const form = h('form', { class: 'lk-form', onsubmit: async (e) => {
        e.preventDefault();
        const kursart = form.querySelector('input[name=kursart]:checked')?.value;
        status.textContent = 'Speichere …';
        try {
          const r = await api('PATCH', `/api/lehrer/kurse/${encodeURIComponent(id)}`, { einstellungen: { kursart } });
          kurs.einstellungen = r.einstellungen;
          status.textContent = 'Gespeichert.';
          const pille = el.querySelector('.lk-kurskopf .niveau-pille');
          if (pille) pille.textContent = KURSART[r.einstellungen.kursart];
        } catch (err) { status.textContent = err.message; }
      } },
        h('fieldset', null, h('legend', null, 'Kursart'), ...auswahl,
          h('p', { class: 'muted klein' }, 'Im Grundkurs gehören nur die Level „gA + eA“ zum Kursumfang; eA-Level (Kellerautomaten, Grammatiken) gelten als freiwillig. Die Kursart bestimmt die Kennzahlen, die das Portal für diesen Kurs anzeigt, und die Markierung in der Lernstand-Matrix. Zusatz-Level zählen in keinem Kurs zum Umfang.')),
        h('button', { type: 'submit', class: 'btn btn-primary' }, 'Speichern'), status);
      return [
        h('div', { class: 'panel lk-karte' }, h('h3', null, 'Einstellungen'), form),
        h('div', { class: 'panel lk-karte' }, h('h3', null, 'Freischaltungen und Aufträge'),
          h('p', null, 'Welten freischalten und Aufträge auf der Startseite folgen. Bis dahin sehen alle Schülerinnen und Schüler alle Welten.')),
        h('div', { class: 'panel lk-karte lk-gefahr' }, h('h3', null, '⚠️ Löschen'),
          h('p', null, 'Kurse und Schülerkonten löschen Sie im Portal InfoLabs. Das Portal meldet die Löschung an AutomatenLab; der Lernstand wird dann auch hier gelöscht.'),
          portal ? h('p', null, h('a', { class: 'btn', href: portal + '/' }, '⌂ Zum Portal')) : null),
      ];
    }

    /* ───────────── 📖 Aufgaben der Welten ───────────── */
    async function aufgabenSeite() {
      const { aufgaben } = await api('GET', '/api/katalog');
      if (!aktiv) return;
      // wie hauptLevel() in src/auswertung.js: erstes Level, Welt-Quiz beim letzten Level der Welt
      const haupt = (a) => { const l = a.levels || []; return a.modul === 'quiz' && l.length > 1 ? l[l.length - 1] : l[0]; };
      const jeLevel = (n) => aufgaben.filter((a) => haupt(a) === n);
      const module = (n) => MODULES.filter((m) => m.load && m.levels.includes(n));
      seite(
        h('h2', null, '📖 Aufgaben der Welten'),
        h('p', { class: 'lead' }, 'Alle Aufgaben mit Prüfung auf dem Server, nach Level. „Vorschau mit Lösung“ öffnet die Aufgabe so, wie Ihre Schülerinnen und Schüler sie sehen – nichts wird gespeichert, „Lösung zeigen“ ist jederzeit möglich (auch beim Quiz über die Antworten). Erwartungshorizonte und Folien mit Notizen stehen unter „📂 Materialien“.'),
        h('p', { class: 'lk-sprung' }, 'Welten: ', WORLDS.map((w, i) => [i ? ' · ' : '', h('a', { href: `#/lehrkraft?teil=aufgaben`, onclick: (e) => { e.preventDefault(); el.querySelector(`#lk-welt-${w.id}`)?.scrollIntoView({ behavior: 'smooth' }); } }, `Welt ${w.id}`)])),
        WORLDS.map((w) => h('section', { class: 'lk-welt-abschnitt', id: `lk-welt-${w.id}` },
          h('h3', null, `Welt ${w.id} – ${w.title}`),
          w.levels.map((n) => {
            const liste = jeLevel(n);
            return h('div', { class: 'panel lk-karte' },
              h('h4', null, `Level ${n}: ${LEVELS[n]} `, h('span', { class: ['niveau-pille', `niveau-${LEVEL_NIVEAU[n] === 'eA' ? 'ea' : LEVEL_NIVEAU[n]}`] }, NIVEAUS[LEVEL_NIVEAU[n]].kurz)),
              h('p', { class: 'muted klein' }, 'Module: ', module(n).map((m, i) => [i ? ', ' : '', h('a', { href: ctx.link(m.route) }, m.title)])),
              liste.length
                ? tabelle(['Aufgabe', 'Modul', 'Stufe', 'Punkte', ''], liste.map((a) => h('tr', null,
                  h('td', null, a.titel), h('td', null, h('a', { href: ctx.link(a.modul) }, MODUL_TITEL[a.modul] ?? a.modul)),
                  h('td', null, STUFE[a.stufe] ?? String(a.stufe)), h('td', { class: 'zahl' }, String(a.punkte)),
                  h('td', null, h('a', { class: 'btn btn-small', href: aufgabenLink(a) }, 'Vorschau mit Lösung')))))
                : h('p', { class: 'muted' }, 'Keine Aufgaben mit Punkten (Simulatoren, Training oder Material).'));
          }))));
    }

    return () => { aktiv = false; };
  },
};
