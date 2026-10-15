// Lehrkraft-Bereich (Vertrag InfoLabs §7: urls.lehrkraft = /lehrer → #/lehrkraft). Anmeldung nur über das Portal.
// Aufbau wie der Lehrkraft-Bereich von Algo Quest, damit sich Lehrkräfte in allen Labs gleich zurechtfinden:
//   Navigation  📚 Kurse · 📖 Aufgaben · 📂 Materialien · 🗺️ Themen · ⌂ Portal
//   #/lehrkraft                          Meine Kurse (Tabelle, „Öffnen“)
//   #/lehrkraft?kurs=<id>&tab=<reiter>   Kursseite mit Reitern 👥 Schüler · 🔗 Beitritt · 📊 Auswertung · 🏆 Rangliste ·
//                                        🎯 Challenges · ⚙️ Einstellungen (reiter: schueler | beitritt | auswertung | rangliste |
//                                        challenges [&challenge=<nr>] | einstellungen)
//   #/lehrkraft?teil=aufgaben            Aufgaben der Welten (nach Level, mit Link ins Modul)
//   #/lehrkraft?teil=urkunden&kurs=<id>  Urkunden des Kurses zum Drucken (wie Algo Quest)
//   #/lehrkraft?teil=eigene[&kurs=<id>][&neu=quiz|baukasten|&aufgabe=<nr>]  Aufgaben-Editor: eigene Aufgaben je Kurs
// Was das Portal verwaltet (Kurse anlegen/löschen, Kurscode, Schülerkonten), steht hier nur als Hinweis.
// Ohne Sitzung leitet die Seite still zum Portal (INTEGRATION.md §3.1).

import { h, clear } from '../core/dom.js';
import { api } from '../core/api.js';
import { sitzung, anmeldeLink, istLehrkraft } from '../core/sitzung.js';
import { WORLDS, LEVELS, LEVEL_TYPE_LABEL } from '../data/worlds.js';
import { LEVEL_NIVEAU, NIVEAUS } from '../data/niveaus.js';
import { MODULES } from './manifest.js';
import { FALLEN } from '../data/fallen.js';
import { DfaEditor } from '../components/dfa-editor.js';
import { GraphView } from '../components/graph-view.js';

const REITER = [
  ['schueler', '👥 Schüler'],
  ['beitritt', '🔗 Beitritt'],
  ['auswertung', '📊 Auswertung'],
  ['rangliste', '🏆 Rangliste'],
  ['challenges', '🎯 Challenges'],
  ['einstellungen', '⚙️ Einstellungen'],
];
const KURSART = { eA: 'Leistungskurs (eA)', gA: 'Grundkurs (gA)' };
const MODUL_TITEL = Object.fromEntries(MODULES.map((m) => [m.route, m.title]));
const STUFE = { 1: 'Basis', 2: 'Standard', 3: 'Profi' };
const FALLE = Object.fromEntries(FALLEN.map((f) => [f.p, f]));

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
    const navAktiv = teil === 'aufgaben' ? 'aufgaben' : teil === 'eigene' ? 'eigene' : 'kurse';

    /** Rahmen jeder Seite: Überschrift und Navigation des Bereichs (wie die Kopfzeile von Algo Quest). */
    function seite(...inhalt) {
      const punkt = (id, href, text) => h('li', null, h('a', { href, ...(id === navAktiv ? { 'aria-current': 'page' } : {}) }, text));
      clear(el, h('section', { class: 'page lk-page' },
        h('a', { class: 'back-link', href: '#/' }, h('span', { 'aria-hidden': 'true' }, '‹ '), 'Übersicht'),
        h('h1', null, 'Bereich für Lehrkräfte'),
        h('nav', { class: 'lk-nav', 'aria-label': 'Lehrkraft-Bereich' }, h('ul', null,
          punkt('kurse', '#/lehrkraft', '📚 Kurse'),
          punkt('aufgaben', '#/lehrkraft?teil=aufgaben', '📖 Aufgaben'),
          punkt('eigene', '#/lehrkraft?teil=eigene', '✏️ Eigene Aufgaben'),
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
        else if (teil === 'urkunden' && kursId) await urkundenSeite(kursId);
        else if (teil === 'eigene') await eigeneSeite(konto);
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
          h('h2', null, kurs.name, ' ', h('span', { class: 'niveau-pille niveau-alle' }, KURSART[kurs.einstellungen.kursart])),
          h('a', { class: 'btn btn-small', href: `#/lehrkraft?${new URLSearchParams({ teil: 'urkunden', kurs: id })}` }, '🏅 Urkunden')),
        h('nav', { class: 'mode-tabs lk-reiter', 'aria-label': 'Kurs' }, REITER.map(([r, text]) =>
          h('a', { href: kurslink(id, r), ...(r === tab ? { 'aria-current': 'page', class: 'is-active' } : {}) }, text))),
        inhalt);
      const zeige = (...x) => { if (aktiv) clear(inhalt, ...x); };
      try {
        if (tab === 'schueler') zeige(...reiterSchueler(await api('GET', `/api/lehrer/kurse/${encodeURIComponent(id)}/schueler`)));
        else if (tab === 'beitritt') zeige(...reiterBeitritt(kurs));
        else if (tab === 'auswertung') zeige(...reiterAuswertung(id, await api('GET', `/api/lehrer/kurse/${encodeURIComponent(id)}/auswertung`)));
        else if (tab === 'challenges') zeige(...(await reiterChallenges(id, kurs)));
        else if (tab === 'rangliste') zeige(...reiterRangliste(await api('GET', `/api/lehrer/kurse/${encodeURIComponent(id)}/schueler`), kurs));
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
        h('td', null, x.fallen.length ? x.fallen.map((p) => h('span', { class: 'lk-falle', title: FALLE[p]?.titel ?? p }, p)) : '–'),
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
        h('div', { class: 'panel lk-karte' }, h('h3', null, 'Export'), h('p', { class: 'start-actions' }, csv('uebersicht', 'Übersicht (CSV)'), csv('matrix', 'Matrix (CSV)'), csv('aufgaben', 'Aufgaben (CSV)'), csv('fallen', 'Fallen (CSV)'))),
        h('div', { class: 'panel lk-karte' },
          h('h3', null, 'Lernstand-Matrix (% der Level-Punkte)'),
          h('p', { class: 'muted klein' }, 'Zeile = Schüler, Spalte = Level (Doppelstunde). Ohne Zahl: noch nichts erreicht. Trainingspunkte (Arena, Unterscheide!, Sortierer) zählen hier nicht.',
            gA ? ' Gestrichelte Level gehören nicht zum Grundkurs-Umfang (freiwillig).' : ' Gestrichelte Level sind Zusatz über das Kerncurriculum hinaus.'),
          matrix,
          h('p', { class: 'lk-legende muted klein', 'aria-hidden': 'true' }, 'Legende: ', [0, 1, 2, 3, 4].map((s, i) => h('span', { class: ['lk-heat', `heat-${s}`] }, ['nichts', '< 25', '< 50', '< 75', '≥ 75'][i])))),
        bossErgebnisse(a.boss),
        fallenProfil(a.fallen),
        h('div', { class: 'panel lk-karte' },
          h('h3', null, 'Aufgabenstatistik'),
          filter,
          h('div', { class: 'tabelle-scroll' }, h('table', { class: 'lk-tabelle' },
            h('thead', null, h('tr', null, ['Aufgabe', 'Level', 'Fallen', 'Stufe', 'versucht', 'Lösungsquote', 'Ø Fehlversuche', 'Ø Tipps', 'angesehen', 'häufige falsche Antworten'].map((k) => h('th', { scope: 'col' }, k)))),
            statBody)),
          h('p', { class: 'muted klein' }, '„versucht“ = mindestens einmal geprüft oder einen Tipp geholt; „angesehen“ = „Lösung zeigen“ benutzt (0 Punkte).')),
      ];
    }

    /** Boss-Ergebnisse (bester Versuch je Welt, wie Algo Quest). */
    function bossErgebnisse(b) {
      if (!b?.zeilen?.length) return null;
      return h('div', { class: 'panel lk-karte' },
        h('h3', null, '⚔️ Boss-Ergebnisse (bester Versuch)'),
        tabelle(['Name', ...b.welten.map((w) => `Boss ${w.welt}`)], b.zeilen.map((z) => h('tr', null,
          h('th', { scope: 'row' }, z.name),
          z.werte.map((w) => h('td', null, w ? `${w.punkte}/${w.max} (${Math.round((100 * w.punkte) / w.max)} %)${w.besiegt ? ' 🏆' : ''} · ${w.versuche}×` : '–'))))),
        h('p', { class: 'muted klein' }, '🏆 = besiegt (ab 50 %). n× = Zahl der Kämpfe. Die Boss-Punkte zählen zu den Punkten (nur der beste Versuch je Welt).'));
    }

    /** Fallen-Profil des Kurses (wie Algo Quest): Balken je Falle P1–P10 mit Fehlversuchen und betroffenen Schülern. */
    function fallenProfil(fallen) {
      if (!fallen?.length) return null;
      const fehler = (f) => f.fehlversuche + (f.quizFalsch ?? 0);
      const max = Math.max(1, ...fallen.map(fehler));
      return h('div', { class: 'panel lk-karte' },
        h('h3', null, 'Fallen-Profil des Kurses'),
        h('p', { class: 'muted klein' }, 'Fehlversuche in Aufgaben, die diese typische Abitur-Falle üben (P1–P10, ',
          h('a', { href: '#/lehrkraft?teil=aufgaben' }, 'Zuordnung bei den Aufgaben'), '), dazu im Level-Quiz die im ersten Durchgang falsch beantworteten Fragen zu dieser Falle. „Betrifft“ zählt Schülerinnen und Schüler mit mindestens einem Fehler oder einer angesehenen Lösung dort.'),
        h('ul', { class: 'lk-fallen' }, fallen.map((f) => h('li', { title: f.text },
          h('span', { class: 'lk-falle-kopf' }, h('strong', null, f.p), ' ', f.titel),
          h('span', { class: 'lk-balken', role: 'img', 'aria-label': `${fehler(f)} Fehler` },
            h('span', { class: 'lk-balken-fuellung', style: { width: `${Math.round((100 * fehler(f)) / max)}%` } })),
          h('span', { class: 'lk-falle-zahl' }, `${f.fehlversuche} Fehlversuche${f.quizFalsch ? ` · ${f.quizFalsch} falsch im Quiz` : ''}${f.angesehen ? ` · ${f.angesehen} × Lösung angesehen` : ''} · betrifft ${f.schueler} von ${f.schuelerGesamt}`)))));
    }

    /* 🏆 Rangliste */
    function reiterRangliste(liste, kurs) {
      const sortiert = [...liste].sort((x, y) => x.rang - y.rang || x.name.localeCompare(y.name, 'de'));
      const e = kurs.einstellungen;
      return [h('div', { class: 'panel lk-karte' },
        h('h3', null, 'Rangliste nach Punkten'),
        h('p', { class: 'muted klein' }, e.scoreboard
          ? 'Ihre Schülerinnen und Schüler sehen diese Rangliste ebenfalls (Startseite → „🏆 Rangliste“), gesamt oder je Welt. Punkte aus Aufgaben und Training.'
          : 'Nur für Sie sichtbar. Unter ⚙️ Einstellungen können Sie die Rangliste für Ihre Schülerinnen und Schüler einschalten. Punkte aus Aufgaben und Training.'),
        e.beamer.aktiv ? h('p', null, h('a', { class: 'btn btn-small', href: `/board/${e.beamer.token}`, target: '_blank', rel: 'noopener' }, '📽️ Beamer-Board öffnen')) : null,
        sortiert.length
          ? tabelle(['Platz', 'Name', 'Punkte', 'Abzeichen', 'gelöst'], sortiert.map((s) => h('tr', null,
            h('td', { class: 'zahl' }, `${s.rang}.`), h('td', null, s.name), h('td', { class: 'zahl' }, String(s.punkte)), h('td', { class: 'zahl' }, String(s.abzeichen)), h('td', { class: 'zahl' }, String(s.geloest)))))
          : leer())];
    }

    /* 🎯 Challenges (PR 11): Einzel- oder Team-Wertung, nur in der Challenge-Liste */
    async function reiterChallenges(id, kurs) {
      const cid = ctx.params.get('challenge');
      if (/^\d{1,9}$/.test(cid ?? '')) return challengeDetail(id, await api('GET', `/api/lehrer/challenges/${cid}`));
      const [liste, { aufgaben: katalog }, eigeneListe] = await Promise.all([
        api('GET', `/api/lehrer/kurse/${encodeURIComponent(id)}/challenges`), api('GET', '/api/katalog'),
        api('GET', `/api/lehrer/kurse/${encodeURIComponent(id)}/eigene`).catch(() => [])]);
      const status = h('p', { class: 'lk-status', 'aria-live': 'polite' });
      const PHASE = { geplant: '🗓 geplant', laeuft: '🎯 läuft', beendet: '🏁 beendet' };
      const datum = (iso) => new Date(iso).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
      const lokal = (ms) => { const d = new Date(ms - new Date(ms).getTimezoneOffset() * 60000); return d.toISOString().slice(0, 16); };
      const tabelleListe = liste.length ? tabelle(['Challenge', 'Wertung', 'Zeitraum', 'Status', ''], liste.map((c) => h('tr', null,
        h('td', null, h('a', { href: `${kurslink(id, 'challenges')}&challenge=${c.id}` }, h('strong', null, c.titel)), h('br'), h('span', { class: 'muted klein' }, c.zaehlt)),
        h('td', null, c.wertung === 'team' ? `Team (${c.teamAnzahl})` : 'Einzel'),
        h('td', null, `${datum(c.start)} – ${datum(c.ende)}`),
        h('td', null, PHASE[c.phase]),
        h('td', { class: 'lk-aktionen' },
          h('a', { class: 'btn btn-small', href: `${kurslink(id, 'challenges')}&challenge=${c.id}` }, 'Ansehen'),
          h('button', { type: 'button', class: 'btn btn-small', onclick: async () => {
            if (!window.confirm(`„${c.titel}“ löschen? Die Wertung verschwindet (Abzeichen bleiben).`)) return;
            try { await api('DELETE', `/api/lehrer/challenges/${c.id}`); kursSeite(id, 'challenges'); } catch (e) { status.textContent = e.message; }
          } }, 'Löschen'))))) : h('p', { class: 'muted' }, 'Noch keine Challenge in diesem Kurs.');

      // Formular „Neue Challenge“
      const titel = h('input', { type: 'text', id: 'ch-titel', maxlength: 80, placeholder: 'z. B. „Arena-Woche“' });
      const wertung = (v) => h('input', { type: 'radio', name: 'ch-wertung', value: v, checked: v === 'einzel', onchange: () => { teams.disabled = v !== 'team'; } });
      const teams = h('select', { id: 'ch-teams', disabled: true }, [2, 3, 4, 5, 6].map((n) => h('option', { value: String(n) }, `${n} Teams`)));
      const artWahl = (v) => h('input', { type: 'radio', name: 'ch-art', value: v, checked: v === 'training', onchange: () => { trainingBox.hidden = v !== 'training'; aufgabenBox.hidden = v !== 'aufgaben'; } });
      const modul = h('select', { id: 'ch-modul' }, [['arena', 'Akzeptor-Arena'], ['unterscheide', 'Unterscheide!'], ['sortierer', 'Chomsky-Sortierer']].map(([k, t]) => h('option', { value: k }, t)));
      const trainingBox = h('div', null, h('label', { for: 'ch-modul' }, 'Training '), modul, h('p', { class: 'muted klein' }, 'Es zählen die richtigen Antworten in beendeten Runden.'));
      const haupt = (a) => { const l = a.levels || []; return a.modul === 'quiz' && l.length > 1 ? l[l.length - 1] : l[0]; };
      const box = (wert, text) => h('label', { class: 'check lk-check-klein' }, h('input', { type: 'checkbox', name: 'ch-aufgabe', value: wert }), ` ${text}`);
      const aufgabenBox = h('div', { hidden: true },
        h('p', { class: 'muted klein' }, 'Es zählen Aufgaben, die im Zeitraum zum ersten Mal gelöst werden.'),
        eigeneListe.length ? h('details', { class: 'ch-gruppe' }, h('summary', null, `✏️ Eigene Aufgaben (${eigeneListe.length})`), h('div', { class: 'lk-check-reihe' }, eigeneListe.map((x) => box(x.id, x.titel)))) : null,
        WORLDS.map((w) => h('details', { class: 'ch-gruppe' }, h('summary', null, `Welt ${w.id} – ${w.title}`),
          w.levels.map((n) => { const l = katalog.filter((a) => haupt(a) === n); return l.length ? h('div', null, h('p', { class: 'muted klein' }, `Level ${n}: ${LEVELS[n]}`), h('div', { class: 'lk-check-reihe' }, l.map((a) => box(a.id, `${a.titel} (${MODUL_TITEL[a.modul] ?? a.modul})`)))) : null; }))));
      const jetzt = Date.now();
      const start = h('input', { type: 'datetime-local', id: 'ch-start', value: lokal(jetzt) });
      const ende = h('input', { type: 'datetime-local', id: 'ch-ende', value: lokal(jetzt + 7 * 86400000) });
      const form = h('form', { class: 'lk-form ed-form', onsubmit: async (e) => {
        e.preventDefault();
        const art = form.querySelector('input[name=ch-art]:checked').value;
        const body = {
          titel: titel.value, art, wertung: form.querySelector('input[name=ch-wertung]:checked').value, teams: Number(teams.value),
          start: new Date(start.value).toISOString(), ende: new Date(ende.value).toISOString(),
          ...(art === 'training' ? { modul: modul.value } : { aufgaben: [...form.querySelectorAll('input[name=ch-aufgabe]:checked')].map((x) => x.value) }),
        };
        status.textContent = 'Speichere …';
        try { const c = await api('POST', `/api/lehrer/kurse/${encodeURIComponent(id)}/challenges`, body); ctx.navigate('lehrkraft', { kurs: id, tab: 'challenges', challenge: String(c.id) }); } catch (err) { status.textContent = err.message; }
      } },
        h('label', { for: 'ch-titel' }, 'Titel'), titel,
        h('fieldset', null, h('legend', null, 'Wertung'),
          h('label', { class: 'check' }, wertung('einzel'), ' Einzeln – Rangliste mit Anzeigenamen'), h('br'),
          h('label', { class: 'check' }, wertung('team'), ' Im Team – der Kurs wird zufällig in gleich große Teams geteilt; sichtbar sind nur die Team-Summen '), teams),
        h('fieldset', null, h('legend', null, 'Was zählt'),
          h('label', { class: 'check' }, artWahl('training'), ' Training'), ' ', h('label', { class: 'check' }, artWahl('aufgaben'), ' Ausgewählte Aufgaben'),
          trainingBox, aufgabenBox),
        h('fieldset', null, h('legend', null, 'Zeitraum'),
          h('label', { for: 'ch-start' }, 'Beginn'), start, h('label', { for: 'ch-ende' }, 'Ende'), ende),
        h('p', { class: 'muted klein' }, 'Die Wertung steht nur in der Challenge-Liste und auf dem Beamer-Board – sie gibt keine zusätzlichen Punkte. Nach dem Ende bekommen die Plätze 1–3 (bzw. das Gewinnerteam) ein Abzeichen.'),
        h('button', { type: 'submit', class: 'btn btn-primary' }, 'Challenge anlegen'), status);
      return [h('div', { class: 'panel lk-karte' }, h('h3', null, '🎯 Challenges'), tabelleListe),
        h('details', { class: 'panel lk-karte', open: !liste.length }, h('summary', null, h('strong', null, '＋ Neue Challenge')), form)];
    }

    function challengeDetail(id, c) {
      const status = h('p', { class: 'lk-status', 'aria-live': 'polite' });
      const MED = { 1: '🥇', 2: '🥈', 3: '🥉' };
      const ergebnis = c.liste
        ? tabelle(['Platz', 'Name', c.art === 'training' ? 'richtige Antworten' : 'gelöste Aufgaben'], c.liste.map((z) => h('tr', null, h('td', { class: 'zahl' }, `${z.wert > 0 && MED[z.platz] ? MED[z.platz] + ' ' : ''}${z.platz}.`), h('td', null, z.name), h('td', { class: 'zahl' }, String(z.wert)))))
        : tabelle(['Platz', 'Team', 'Summe', 'Ø', 'Mitglieder'], c.teams.map((t) => h('tr', null, h('td', { class: 'zahl' }, `${t.wert > 0 && MED[t.platz] ? MED[t.platz] + ' ' : ''}${t.platz}.`), h('td', null, h('strong', null, t.name)),
          h('td', { class: 'zahl' }, String(t.wert)), h('td', { class: 'zahl' }, String(t.schnitt).replace('.', ',')), h('td', null, t.namen.join(', ') || '–'))));
      const einheit = c.art === 'training' ? 'richtige Antworten' : 'gelöste Aufgaben';
      const sieger = c.liste ? c.liste.filter((z) => z.wert > 0 && z.platz <= 3).map((z) => ({ name: z.name, zeile: `${z.platz}. Platz · ${z.wert} ${einheit}` }))
        : c.teams.filter((t) => t.wert > 0 && t.platz === 1).flatMap((t) => t.namen.map((n) => ({ name: n, zeile: `Gewinnerteam „${t.name}“ · ${t.wert} ${einheit}` })));
      const blaetter = h('div', { class: 'urkunden' });
      const urkunden = () => {
        document.documentElement.classList.add('druck-urkunden');
        clear(blaetter, sieger.map((s) => h('article', { class: 'urkunde' }, h('div', { class: 'urkunde-rahmen' },
          h('p', { class: 'urkunde-marke', 'aria-hidden': 'true' }, '→◎'), h('h2', { class: 'urkunde-titel' }, 'Urkunde'),
          h('p', { class: 'urkunde-lab' }, 'AutomatenLab – Klassen-Challenge'),
          h('p', { class: 'urkunde-text' }, `„${c.titel}“`), h('p', { class: 'urkunde-name' }, s.name),
          h('p', { class: 'urkunde-rang' }, s.zeile), h('p', { class: 'urkunde-text' }, `Gezählt: ${c.zaehlt}`),
          h('div', { class: 'urkunde-fuss' }, h('p', null, new Date(c.ende).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })),
            h('p', { class: 'urkunde-unterschrift' }, h('span', { class: 'urkunde-linie' }), 'Kursleitung'))))));
        setTimeout(() => window.print(), 300);
      };
      return [
        h('p', { class: 'no-print' }, h('a', { href: kurslink(id, 'challenges') }, '‹ Alle Challenges')),
        h('div', { class: 'panel lk-karte no-print' },
          h('h3', null, `🎯 ${c.titel}`),
          h('p', { class: 'muted' }, `${{ geplant: '🗓 geplant', laeuft: '🎯 läuft', beendet: '🏁 beendet' }[c.phase]} · ${c.wertung === 'team' ? `Team-Wertung (${c.teamAnzahl} Teams)` : 'Einzel-Wertung'} · ${new Date(c.start).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' })} – ${new Date(c.ende).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' })}`),
          h('p', null, `Zählt: ${c.zaehlt}.`),
          c.aufgaben ? h('details', null, h('summary', null, `Aufgaben (${c.aufgaben.length})`), h('ul', null, c.aufgaben.map((a) => h('li', null, a.titel)))) : null,
          h('h4', null, c.phase === 'beendet' ? 'Ergebnis' : 'Zwischenstand'), ergebnis,
          h('p', { class: 'start-actions' },
            c.phase !== 'beendet' ? h('button', { type: 'button', class: 'btn', onclick: async () => {
              if (!window.confirm('Challenge jetzt beenden? Danach zählt nichts mehr, und die Abzeichen werden vergeben.')) return;
              try { await api('POST', `/api/lehrer/challenges/${c.id}/beenden`, {}); kursSeite(id, 'challenges'); } catch (e) { status.textContent = e.message; }
            } }, 'Jetzt beenden') : null,
            sieger.length ? h('button', { type: 'button', class: 'btn btn-primary', onclick: urkunden }, `🏅 Urkunden drucken (${sieger.length})`) : null),
          status),
        blaetter];
    }

    /* ⚙️ Einstellungen */
    function reiterEinstellungen(id, kurs) {
      const e0 = kurs.einstellungen;
      const status = h('p', { class: 'lk-status', 'aria-live': 'polite' });
      const auswahl = Object.entries(KURSART).map(([k, text]) => h('label', { class: 'check' },
        h('input', { type: 'radio', name: 'kursart', value: k, checked: e0.kursart === k }), ` ${text}`));
      // Level-Art je Level (Pflicht/Vertiefung/Bonus/Später) – ändert nur die Startseite, Deep-Links bleiben offen
      const levelZeilen = WORLDS.flatMap((w) => w.levels.map((n) => h('tr', null,
        h('th', { scope: 'row' }, `${n}`), h('td', null, LEVELS[n], ' ', h('span', { class: ['niveau-pille', `niveau-${LEVEL_NIVEAU[n] === 'eA' ? 'ea' : LEVEL_NIVEAU[n]}`] }, NIVEAUS[LEVEL_NIVEAU[n]].kurz)),
        h('td', null, h('select', { name: `level-${n}`, 'aria-label': `Level ${n}: ${LEVELS[n]}` },
          Object.entries(LEVEL_TYPE_LABEL).map(([k, text]) => h('option', { value: k, selected: e0.levelArt[n] === k }, text)))))));
      const auftragText = h('textarea', { id: 'lk-auftrag', rows: 3, maxlength: 400, placeholder: 'z. B. „Bis Freitag: Baukasten Stufe 1 und das Exit-Ticket DS03“' }, e0.auftrag?.text ?? '');
      const auftragLevel = WORLDS.flatMap((w) => w.levels).map((n) => h('label', { class: 'check lk-check-klein' },
        h('input', { type: 'checkbox', name: 'auftrag-level', value: String(n), checked: (e0.auftrag?.level ?? []).includes(n) }), ` ${n}`));
      // Rangliste für Schüler und Beamer-Board (wie Algo Quest; beide standardmäßig aus)
      const bossWahl = h('select', { name: 'boss', id: 'lk-boss' }, [['auto', 'automatisch ab 60 % der Level-Punkte der Welt (Standard)'], ['offen', 'sofort offen'], ['gesperrt', 'gesperrt']]
        .map(([k, text]) => h('option', { value: k, selected: (e0.boss ?? 'auto') === k }, text)));
      const scoreboardBox = h('input', { type: 'checkbox', name: 'scoreboard', checked: !!e0.scoreboard });
      const beamerBox = h('input', { type: 'checkbox', name: 'beamer', checked: !!e0.beamer?.aktiv });
      const boardLink = h('p', { class: 'lk-board-link' });
      const zeigeBoardLink = (b) => clear(boardLink, b?.aktiv && b.token
        ? [h('span', { class: 'muted klein' }, 'Link für den Beamer (ohne Anmeldung): '), h('a', { href: `/board/${b.token}`, target: '_blank', rel: 'noopener' }, h('code', null, `${location.origin}/board/${b.token}`)), ' ',
          h('button', { type: 'button', class: 'btn btn-small', onclick: async () => {
            if (!window.confirm('Neuen Link erzeugen? Der bisherige Link funktioniert danach nicht mehr.')) return;
            try {
              const r = await api('PATCH', `/api/lehrer/kurse/${encodeURIComponent(id)}`, { einstellungen: { beamer: { aktiv: true, neu: true } } });
              kurs.einstellungen = r.einstellungen; zeigeBoardLink(r.einstellungen.beamer);
              status.textContent = 'Neuer Link erzeugt.';
            } catch (err) { status.textContent = err.message; }
          } }, 'Neuen Link erzeugen')]
        : []);
      zeigeBoardLink(e0.beamer);
      const form = h('form', { class: 'lk-form', onsubmit: async (e) => {
        e.preventDefault();
        const einstellungen = {
          kursart: form.querySelector('input[name=kursart]:checked')?.value,
          levelArt: Object.fromEntries([...form.querySelectorAll('select[name^="level-"]')].map((x) => [x.name.slice(6), x.value])),
          auftrag: auftragText.value.trim() ? { text: auftragText.value.trim(), level: [...form.querySelectorAll('input[name=auftrag-level]:checked')].map((x) => Number(x.value)) } : null,
          scoreboard: scoreboardBox.checked,
          boss: bossWahl.value,
          beamer: { aktiv: beamerBox.checked },
        };
        status.textContent = 'Speichere …';
        try {
          const r = await api('PATCH', `/api/lehrer/kurse/${encodeURIComponent(id)}`, { einstellungen });
          kurs.einstellungen = r.einstellungen;
          status.textContent = 'Gespeichert. Ihre Schülerinnen und Schüler sehen die Änderungen beim nächsten Öffnen der Startseite.';
          const pille = el.querySelector('.lk-kurskopf .niveau-pille');
          if (pille) pille.textContent = KURSART[r.einstellungen.kursart];
          zeigeBoardLink(r.einstellungen.beamer);
        } catch (err) { status.textContent = err.message; }
      } },
        h('fieldset', null, h('legend', null, 'Kursart'), ...auswahl,
          h('p', { class: 'muted klein' }, 'Im Grundkurs gehören nur die Level „gA + eA“ zum Kursumfang; eA-Level (Kellerautomaten, Grammatiken) sehen Ihre Schülerinnen und Schüler als „freiwillig“. Die Kursart bestimmt auch die Kennzahlen, die das Portal für diesen Kurs anzeigt, und die Markierung in der Lernstand-Matrix. Zusatz-Level zählen in keinem Kurs zum Umfang.')),
        h('fieldset', null, h('legend', null, 'Auftrag auf der Startseite'),
          h('label', { for: 'lk-auftrag', class: 'muted klein' }, 'Erscheint oben auf der Startseite Ihrer Schülerinnen und Schüler (höchstens 400 Zeichen; leer = kein Auftrag).'),
          auftragText,
          h('p', { class: 'muted klein' }, 'Dazu passende Level hervorheben (höchstens vier):'),
          h('div', { class: 'lk-check-reihe' }, auftragLevel)),
        h('fieldset', null, h('legend', null, 'Boss-Kämpfe'),
          h('label', { for: 'lk-boss' }, 'Bosse der Welten A–C: '), bossWahl,
          h('p', { class: 'muted klein' }, 'Ein Boss-Kampf ist eine Prüfung auf Zeit (20–25 Minuten, 8 zufällige Aufgaben im Abitur-Stil, Auswertung erst am Ende, danach 12 Stunden Pause). „Automatisch“ öffnet den Boss einer Welt, sobald jemand 60 % der Punkte in deren Leveln hat. Den Aufgabenpool sehen Sie unter 📖 Aufgaben.')),
        h('fieldset', null, h('legend', null, 'Rangliste und Beamer-Board'),
          h('label', { class: 'check' }, scoreboardBox, ' Rangliste für Schülerinnen und Schüler sichtbar'),
          h('p', { class: 'muted klein' }, 'Zeigt allen im Kurs Platz, Anzeigename und Punkte (gesamt oder je Welt). Die Anzeigenamen wählen die Schülerinnen und Schüler im Portal selbst.'),
          h('label', { class: 'check' }, beamerBox, ' Beamer-Board eingeschaltet'),
          h('p', { class: 'muted klein' }, 'Eine Seite für den Beamer mit den 15 Besten, dem Fortschritt des Kurses je Welt und den letzten Abzeichen. Sie ist ohne Anmeldung über einen zufälligen Link erreichbar – nur wer den Link kennt, sieht sie. Ausschalten sperrt den Link sofort.'),
          boardLink),
        h('fieldset', null, h('legend', null, 'Level: Pflicht, Vertiefung, Bonus oder später'),
          h('p', { class: 'muted klein' }, 'So erscheinen die Level auf der Level-Karte Ihrer Schülerinnen und Schüler. „Später“ graut ein Level aus – gesperrt wird nichts: QR-Codes und Links auf Arbeitsblättern führen immer zur Aufgabe.'),
          tabelle(['Level', 'Thema', 'Art'], levelZeilen, { klasse: 'lk-level-tabelle' })),
        h('button', { type: 'submit', class: 'btn btn-primary' }, 'Speichern'), status);
      return [
        h('div', { class: 'panel lk-karte' }, h('h3', null, 'Einstellungen'), form),
        h('div', { class: 'panel lk-karte lk-gefahr' }, h('h3', null, '⚠️ Löschen'),
          h('p', null, 'Kurse und Schülerkonten löschen Sie im Portal InfoLabs. Das Portal meldet die Löschung an AutomatenLab; der Lernstand wird dann auch hier gelöscht.'),
          portal ? h('p', null, h('a', { class: 'btn', href: portal + '/' }, '⌂ Zum Portal')) : null),
      ];
    }

    /** Pool des Bosses einer Welt (aufklappbar, lädt beim Öffnen; richtige Antwort markiert). */
    function bossPool(welt) {
      if (!['A', 'B', 'C', 'D'].includes(welt)) return null;
      const inhalt = h('div', null, h('p', { class: 'muted' }, 'Lade …'));
      let geladen = false;
      return h('details', { class: 'panel lk-karte lk-boss-pool', ontoggle: async (e) => {
        if (!e.currentTarget.open || geladen) return;
        geladen = true;
        try {
          const p = await api('GET', `/api/lehrer/boss/${welt}`);
          const antwort = (f) => (f.typ === 'mc' ? f.optionen[0] : f.typ === 'wf' ? `${f.wahr ? 'wahr' : 'falsch'} – ${f.begruendungen[0]}` : f.paare.map((x) => `${x[0]} → ${x[1]}`).join('; '));
          clear(inhalt,
            h('p', null, `${p.anzahl} von ${p.aufgaben.length} Aufgaben je Kampf (Basis ${p.mix[1]}, Standard ${p.mix[2]}, Profi ${p.mix[3]}), ${p.dauerMin} Minuten. Im Grundkurs werden nur Aufgaben „gA + eA“ gezogen, wenn genug da sind.`),
            h('ol', { class: 'lk-boss-liste' }, p.aufgaben.map((a) => h('li', null,
              h('p', null, h('strong', null, a.frage.frage ?? a.frage.aussage), ' ', h('span', { class: 'muted klein' }, `${STUFE[a.stufe]} · ${a.punkte} P. · ${NIVEAUS[a.niveau]?.kurz ?? a.niveau}`), ' ',
                a.fallen.map((x) => h('span', { class: 'lk-falle', title: FALLE[x]?.titel ?? x }, x))),
              a.bild?.art === 'grammatik' ? h('pre', { class: 'boss-grammatik' }, a.bild.text) : a.bild ? h('p', { class: 'muted klein' }, `(mit abgebildetem ${{ dea: 'DEA', nea: 'NEA', mealy: 'Mealy-Automaten', nka: 'Kellerautomaten', tm: 'Turingmaschine' }[a.bild.typ]})`) : null,
              h('p', { class: 'lk-boss-antwort' }, '✓ ', antwort(a.frage)),
              a.frage.erklaerung ? h('p', { class: 'muted klein' }, a.frage.erklaerung) : null))));
        } catch (err) { clear(inhalt, h('p', { class: 'notice notice-error' }, err.message)); }
      } }, h('summary', null, h('strong', null, `⚔️ Boss der Welt ${welt}: Aufgabenpool mit Lösungen`)), inhalt);
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
          bossPool(w.id),
          w.levels.map((n) => {
            const liste = jeLevel(n);
            return h('div', { class: 'panel lk-karte' },
              h('h4', null, `Level ${n}: ${LEVELS[n]} `, h('span', { class: ['niveau-pille', `niveau-${LEVEL_NIVEAU[n] === 'eA' ? 'ea' : LEVEL_NIVEAU[n]}`] }, NIVEAUS[LEVEL_NIVEAU[n]].kurz)),
              h('p', { class: 'muted klein' }, 'Module: ', module(n).map((m, i) => [i ? ', ' : '', h('a', { href: ctx.link(m.route) }, m.title)])),
              liste.length
                ? tabelle(['Aufgabe', 'Modul', 'Fallen', 'Stufe', 'Punkte', ''], liste.map((a) => h('tr', null,
                  h('td', null, a.titel), h('td', null, h('a', { href: ctx.link(a.modul) }, MODUL_TITEL[a.modul] ?? a.modul)),
                  h('td', null, (a.fallen ?? []).length ? a.fallen.map((p) => h('span', { class: 'lk-falle', title: FALLE[p]?.titel ?? p }, p)) : '–'),
                  h('td', null, STUFE[a.stufe] ?? String(a.stufe)), h('td', { class: 'zahl' }, String(a.punkte)),
                  h('td', null, h('a', { class: 'btn btn-small', href: aufgabenLink(a) }, 'Vorschau mit Lösung')))))
                : h('p', { class: 'muted' }, 'Keine Aufgaben mit Punkten (Simulatoren, Training oder Material).'));
          }))));
    }

    /* ───────────── ✏️ Eigene Aufgaben (Aufgaben-Editor, PR 10) ───────────── */
    async function eigeneSeite(konto) {
      const kurse = await api('GET', '/api/lehrer/kurse');
      if (!aktiv) return;
      const id = kursId ?? (kurse.length === 1 ? kurse[0].id : null);
      const link = (p = {}) => `#/lehrkraft?${new URLSearchParams({ teil: 'eigene', ...(id ? { kurs: id } : {}), ...p })}`;
      const kopf = [h('h2', null, '✏️ Eigene Aufgaben'),
        h('p', { class: 'lead' }, 'Erstellen Sie eigene Quizfragen, Baukasten-Challenges, Detektiv-Fälle und Grammatik-Challenges für einen Kurs. Ihre Schülerinnen und Schüler sehen freigegebene Aufgaben auf der Startseite unter „Aufgaben deiner Lehrkraft“. Geprüft wird auf dem Server – Lösungen erreichen den Browser erst nach der Antwort. Eigene Aufgaben geben keine Punkte; Ergebnisse sehen Sie in der Liste.')];
      if (!kurse.length) { seite(...kopf, h('p', { class: 'notice' }, 'Noch kein Kurs mit AutomatenLab – legen Sie im Portal einen Kurs an.')); return; }
      if (!id) {
        seite(...kopf, h('div', { class: 'panel lk-karte' }, h('h3', null, 'Kurs wählen'),
          h('ul', null, kurse.map((k) => h('li', null, h('a', { href: `#/lehrkraft?${new URLSearchParams({ teil: 'eigene', kurs: k.id })}` }, k.name))))));
        return;
      }
      const kurs = kurse.find((k) => k.id === id);
      if (!kurs) throw Object.assign(new Error('Kurs'), { status: 404 });
      const kursWahl = kurse.length > 1 ? h('p', null, 'Kurs: ', kurse.map((k, i) => [i ? ' · ' : '', k.id === id ? h('strong', null, k.name) : h('a', { href: `#/lehrkraft?${new URLSearchParams({ teil: 'eigene', kurs: k.id })}` }, k.name)])) : h('p', null, 'Kurs: ', h('strong', null, kurs.name));
      const neuArt = ctx.params.get('neu');
      const nr = ctx.params.get('aufgabe');
      if (['quiz', 'baukasten', 'detektiv', 'grammatik'].includes(neuArt)) { editor(kopf, kursWahl, id, link, { art: neuArt, titel: '', aktiv: false, daten: null }); return; }
      if (nr) { const x = await api('GET', `/api/lehrer/eigene/${encodeURIComponent(nr)}`); if (aktiv) editor(kopf, kursWahl, id, link, x); return; }

      const liste = await api('GET', `/api/lehrer/kurse/${encodeURIComponent(id)}/eigene`);
      if (!aktiv) return;
      const status = h('p', { class: 'lk-status', 'aria-live': 'polite' });
      const zeilen = liste.map((x) => h('tr', null,
        h('td', null, h('strong', null, x.titel)),
        h('td', null, x.art === 'quiz' ? `Quiz (${x.fragen} ${x.fragen === 1 ? 'Frage' : 'Fragen'})` : x.art === 'detektiv' ? 'Detektiv-Fall' : `${x.art === 'grammatik' ? 'Grammatik' : 'Baukasten'} (${STUFE[x.stufe] ?? '–'})`),
        h('td', null, x.aktiv ? h('span', { class: 'niveau-pille niveau-alle' }, 'freigegeben') : h('span', { class: 'muted' }, 'Entwurf')),
        h('td', { class: 'zahl' }, String(x.versucht)),
        h('td', { class: 'zahl' }, String(x.geloest)),
        h('td', { class: 'lk-aktionen' },
          h('a', { class: 'btn btn-small', href: link({ aufgabe: String(x.nr) }) }, 'Bearbeiten'),
          h('a', { class: 'btn btn-small', href: `${x.link}&vorschau=1` }, 'Vorschau'),
          kurse.length > 1 ? h('select', { class: 'btn btn-small', 'aria-label': `„${x.titel}“ in einen anderen Kurs kopieren`, onchange: async (e) => {
            const ziel = e.target.value; e.target.value = '';
            if (!ziel) return;
            try { await api('POST', `/api/lehrer/eigene/${x.nr}/kopieren`, { kurs: ziel }); status.textContent = `„${x.titel}“ wurde als Entwurf in ${kurse.find((k) => k.id === ziel)?.name} kopiert.`; } catch (err) { status.textContent = err.message; }
          } }, h('option', { value: '' }, 'Kopieren nach …'), kurse.filter((k) => k.id !== id).map((k) => h('option', { value: k.id }, k.name))) : null,
          h('button', { type: 'button', class: 'btn btn-small', onclick: async () => {
            try { await api('PATCH', `/api/lehrer/eigene/${x.nr}`, { aktiv: !x.aktiv }); eigeneSeite(konto); } catch (e) { status.textContent = e.message; }
          } }, x.aktiv ? 'Zurückziehen' : 'Freigeben'),
          h('button', { type: 'button', class: 'btn btn-small', onclick: async () => {
            if (!window.confirm(`„${x.titel}“ löschen? Die Ergebnisse Ihrer Schülerinnen und Schüler zu dieser Aufgabe werden mitgelöscht.`)) return;
            try { await api('DELETE', `/api/lehrer/eigene/${x.nr}`); eigeneSeite(konto); } catch (e) { status.textContent = e.message; }
          } }, 'Löschen'))));
      seite(...kopf, kursWahl,
        h('p', { class: 'start-actions' },
          h('a', { class: 'btn btn-primary', href: link({ neu: 'quiz' }) }, '＋ Quiz'),
          h('a', { class: 'btn btn-primary', href: link({ neu: 'baukasten' }) }, '＋ Baukasten-Challenge'),
          h('a', { class: 'btn btn-primary', href: link({ neu: 'detektiv' }) }, '＋ Detektiv-Fall'),
          h('a', { class: 'btn btn-primary', href: link({ neu: 'grammatik' }) }, '＋ Grammatik-Challenge')),
        h('div', { class: 'panel lk-karte' },
          h('h3', null, `Aufgaben im Kurs ${kurs.name} (${liste.length})`),
          liste.length ? tabelle(['Titel', 'Art', 'Status', 'versucht', 'gelöst', ''], zeilen) : h('p', { class: 'muted' }, 'Noch keine eigenen Aufgaben.'),
          status));
    }

    /** Editor für eine eigene Aufgabe (neu oder bearbeiten). */
    function editor(kopf, kursWahl, kurs, link, x) {
      const status = h('p', { class: 'lk-status', 'aria-live': 'polite' });
      const titel = h('input', { type: 'text', id: 'ed-titel', maxlength: 80, value: x.titel ?? '', required: true });
      const freigabe = h('input', { type: 'checkbox', id: 'ed-aktiv', checked: !!x.aktiv });
      let sammle;
      let inhalt;
      if (x.art === 'quiz') {
        const leer = (typ = 'mc') => ({ typ, frage: '', aussage: '', optionen: ['', '', '', ''], begruendungen: ['', '', ''], richtig: 0, wahr: true, erklaerung: '' });
        const fragen = (x.daten?.fragen ?? [leer()]).map((f) => ({ ...leer(f.typ), ...f, optionen: [...(f.optionen ?? []), '', '', '', ''].slice(0, 4), begruendungen: [...(f.begruendungen ?? []), '', '', ''].slice(0, 3) }));
        const box = h('div', { class: 'ed-fragen' });
        const zeichne = () => clear(box, fragen.map((f, i) => {
          const name = `ed-f${i}`;
          const feld = (liste, key, j, rot) => h('div', { class: 'ed-option' },
            h('input', { type: 'radio', name: `${name}-${key}`, checked: f.richtig === j, 'aria-label': `${rot} ${j + 1} ist richtig`, onchange: () => { f.richtig = j; } }),
            h('input', { type: 'text', maxlength: 200, value: liste[j], placeholder: j === 0 ? `${rot} ${j + 1}` : `${rot} ${j + 1}${j > 1 ? ' (optional)' : ''}`, 'aria-label': `${rot} ${j + 1}`, oninput: (e) => { liste[j] = e.target.value; } }));
          return h('fieldset', { class: 'ed-frage' },
            h('legend', null, `Frage ${i + 1}`),
            h('p', null, h('label', null, 'Typ ', h('select', { onchange: (e) => { f.typ = e.target.value; f.richtig = 0; zeichne(); } },
              h('option', { value: 'mc', selected: f.typ === 'mc' }, 'Multiple Choice (eine richtige Antwort)'),
              h('option', { value: 'wf', selected: f.typ === 'wf' }, 'Wahr oder falsch – mit Begründung')))),
            f.typ === 'mc'
              ? [h('label', null, 'Frage', h('textarea', { rows: 2, maxlength: 400, oninput: (e) => { f.frage = e.target.value; } }, f.frage)),
                h('p', { class: 'muted klein' }, 'Antworten (2 bis 4) – markieren Sie die richtige:'), [0, 1, 2, 3].map((j) => feld(f.optionen, 'opt', j, 'Antwort'))]
              : [h('label', null, 'Aussage', h('textarea', { rows: 2, maxlength: 400, oninput: (e) => { f.aussage = e.target.value; } }, f.aussage)),
                h('p', null, 'Die Aussage ist ',
                  h('label', { class: 'check' }, h('input', { type: 'radio', name: `${name}-wahr`, checked: f.wahr === true, onchange: () => { f.wahr = true; } }), ' wahr'), ' ',
                  h('label', { class: 'check' }, h('input', { type: 'radio', name: `${name}-wahr`, checked: f.wahr === false, onchange: () => { f.wahr = false; } }), ' falsch')),
                h('p', { class: 'muted klein' }, 'Begründungen (2 bis 3) – markieren Sie die passende:'), [0, 1, 2].map((j) => feld(f.begruendungen, 'begr', j, 'Begründung'))],
            h('label', null, 'Erklärung nach der Antwort (optional)', h('textarea', { rows: 2, maxlength: 400, oninput: (e) => { f.erklaerung = e.target.value; } }, f.erklaerung ?? '')),
            fragen.length > 1 ? h('p', null, h('button', { type: 'button', class: 'btn btn-small', onclick: () => { fragen.splice(i, 1); zeichne(); } }, 'Frage entfernen')) : null);
        }), fragen.length < 12 ? h('p', null, h('button', { type: 'button', class: 'btn', onclick: () => { fragen.push(leer()); zeichne(); } }, '＋ Frage hinzufügen')) : null);
        zeichne();
        inhalt = [box];
        sammle = () => ({ fragen: fragen.map((f) => {
          const liste = (f.typ === 'mc' ? f.optionen : f.begruendungen).map((t, j) => ({ t: t.trim(), j })).filter((o) => o.t);
          const richtig = liste.findIndex((o) => o.j === f.richtig);
          const basis = { typ: f.typ, richtig, ...(f.erklaerung?.trim() ? { erklaerung: f.erklaerung.trim() } : {}) };
          return f.typ === 'mc' ? { ...basis, frage: f.frage, optionen: liste.map((o) => o.t) } : { ...basis, aussage: f.aussage, wahr: f.wahr, begruendungen: liste.map((o) => o.t) };
        }) });
      } else if (x.art === 'detektiv') {
        const d = x.daten ?? { automat: null, optionen: ['', '', '', ''], richtig: 0, erklaerung: '' };
        const optionen = [...(d.optionen ?? []), '', '', '', ''].slice(0, 4);
        let richtig = d.richtig ?? 0;
        const startAlphabet = d.automat?.alphabet ?? ['a', 'b'];
        const alphabet = h('input', { type: 'text', id: 'ed-alphabet', value: startAlphabet.join(', '), maxlength: 40 });
        const edBox = h('div');
        const graphBox = h('div', { class: 'ed-graph' });
        const gv = new GraphView(graphBox, { label: 'Automat des Falls' });
        const zeigeGraph = (ed) => { try { gv.render(ed.toDFA()); } catch { /* unvollständig */ } };
        const ed = new DfaEditor(edBox, { alphabet: startAlphabet, value: d.automat, onChange: zeigeGraph });
        zeigeGraph(ed);
        const erklaerung = h('textarea', { id: 'ed-erklaerung', rows: 2, maxlength: 400, placeholder: 'z. B. Bedeutung der Zustände – erscheint nach dem Lösen' }, d.erklaerung ?? '');
        inhalt = [
          h('p', null, h('label', { for: 'ed-alphabet' }, 'Eingabealphabet Σ (durch Kommas getrennt) '), alphabet, ' ',
            h('button', { type: 'button', class: 'btn btn-small', onclick: () => ed.setAlphabet(alphabet.value.split(',').map((t) => t.trim()).filter(Boolean)) }, 'Übernehmen')),
          h('h4', null, 'Automat des Falls (DEA – Schülerinnen und Schüler sehen ihn und können Wörter testen)'),
          edBox, graphBox,
          h('h4', null, 'Vier Beschreibungen – markieren Sie die, die genau zur Sprache passt'),
          h('p', { class: 'muted klein' }, 'Ohne Prüfprädikat gibt es bei einer falschen Wahl kein Gegenbeispiel, nur „passt nicht“. Gute falsche Beschreibungen unterscheiden sich schon bei kurzen Wörtern.'),
          [0, 1, 2, 3].map((j) => h('div', { class: 'ed-option' },
            h('input', { type: 'radio', name: 'ed-det-richtig', checked: richtig === j, 'aria-label': `Beschreibung ${j + 1} ist richtig`, onchange: () => { richtig = j; } }),
            h('input', { type: 'text', maxlength: 200, value: optionen[j], placeholder: `Beschreibung ${j + 1}`, 'aria-label': `Beschreibung ${j + 1}`, oninput: (e) => { optionen[j] = e.target.value; } }))),
          h('label', { for: 'ed-erklaerung' }, 'Erklärung nach dem Lösen (optional)'), erklaerung];
        sammle = () => ({ automat: ed.toJSON(), optionen: optionen.map((t) => t.trim()), richtig, erklaerung: erklaerung.value });
      } else if (x.art === 'grammatik') {
        const d = x.daten ?? { aufgabe: '', stufe: 2, alphabet: ['a', 'b'], referenz: '', regulaer: false, tipps: [] };
        const stufe = h('select', { id: 'ed-stufe' }, [1, 2, 3].map((n) => h('option', { value: String(n), selected: d.stufe === n }, STUFE[n])));
        const aufgabe = h('textarea', { id: 'ed-aufgabe', rows: 3, maxlength: 800, placeholder: 'z. B. „Entwirf eine Grammatik für L = {aⁿbⁿ | n ≥ 1} über Σ = {a, b}.“' }, d.aufgabe ?? '');
        const alphabet = h('input', { type: 'text', id: 'ed-alphabet', value: (d.alphabet ?? []).join(', '), maxlength: 30 });
        const referenz = h('textarea', { id: 'ed-referenz', rows: 4, maxlength: 1000, class: 'ed-mono', placeholder: 'S → aSb | ab' }, d.referenz ?? '');
        const regulaer = h('input', { type: 'checkbox', id: 'ed-regulaer', checked: !!d.regulaer });
        const vorschau = h('p', { class: 'muted klein', 'aria-live': 'polite' });
        const tipps = h('textarea', { id: 'ed-tipps', rows: 3, maxlength: 950, placeholder: 'ein Tipp je Zeile, höchstens drei' }, (d.tipps ?? []).join('\n'));
        const testen = async () => {
          const G = await import('../engine/grammar.js');
          const g = G.parseGrammar(referenz.value);
          if (!g.ok) { vorschau.textContent = `Fehler: ${g.errors.join(' ')}`; return; }
          const w = G.shortestWords(g, { count: 8, maxLen: 8 });
          vorschau.textContent = `Kürzeste Wörter: ${w.map((x) => (x.length ? x.join('') : 'ε')).join(', ') || '–'}${G.isRightRegular(g).regular ? ' · rechtsregulär' : ''}`;
        };
        inhalt = [
          h('p', null, h('label', { for: 'ed-stufe' }, 'Stufe '), stufe),
          h('label', { for: 'ed-aufgabe' }, 'Aufgabentext (Du-Ansprache)'), aufgabe,
          h('label', { for: 'ed-alphabet' }, 'Terminale Σ (je ein Zeichen, durch Kommas getrennt)'), alphabet,
          h('label', { for: 'ed-referenz' }, 'Mustergrammatik (Startsymbol S, Pfeil →, Alternativen mit |, ε für das leere Wort)'), referenz,
          h('p', null, h('button', { type: 'button', class: 'btn btn-small', onclick: testen }, 'Mustergrammatik testen')), vorschau,
          h('label', { class: 'check', for: 'ed-regulaer' }, regulaer, ' Rechtsreguläre Grammatik verlangen'),
          h('p', { class: 'muted klein' }, 'Geprüft wird die Sprache bis zu einer Wortlänge (Σ mit 2 Zeichen: 8, mit 3: 6, sonst 5): Jede Grammatik, die bis dahin dieselben Wörter erzeugt, gilt als richtig. Bei einem Fehler sehen Ihre Schülerinnen und Schüler ein Wort, das zu viel oder zu wenig erzeugt wird.'),
          h('label', { for: 'ed-tipps' }, 'Tipps (optional)'), tipps];
        sammle = () => ({ aufgabe: aufgabe.value, stufe: Number(stufe.value), alphabet: alphabet.value.split(',').map((t) => t.trim()).filter(Boolean), referenz: referenz.value, regulaer: regulaer.checked, tipps: tipps.value.split('\n').map((t) => t.trim()).filter(Boolean).slice(0, 3) });
      } else {
        const d = x.daten ?? { aufgabe: '', stufe: 1, referenz: null, tipps: [] };
        const stufe = h('select', { id: 'ed-stufe' }, [1, 2, 3].map((n) => h('option', { value: String(n), selected: d.stufe === n }, STUFE[n])));
        const aufgabe = h('textarea', { id: 'ed-aufgabe', rows: 3, maxlength: 800, placeholder: 'z. B. „Entwickle einen DEA über Σ = {a, b}, der genau die Wörter akzeptiert, die auf b enden.“' }, d.aufgabe ?? '');
        const startAlphabet = d.referenz?.alphabet ?? ['a', 'b'];
        const alphabet = h('input', { type: 'text', id: 'ed-alphabet', value: startAlphabet.join(', '), maxlength: 40 });
        const edBox = h('div');
        const graphBox = h('div', { class: 'ed-graph' });
        const gv = new GraphView(graphBox, { label: 'Musterautomat' });
        const zeigeGraph = (ed) => { try { gv.render(ed.toDFA()); } catch { /* unvollständig */ } };
        const ed = new DfaEditor(edBox, { alphabet: startAlphabet, value: d.referenz, onChange: zeigeGraph });
        zeigeGraph(ed);
        const tipps = h('textarea', { id: 'ed-tipps', rows: 3, maxlength: 950, placeholder: 'ein Tipp je Zeile, höchstens drei' }, (d.tipps ?? []).join('\n'));
        inhalt = [
          h('p', null, h('label', { for: 'ed-stufe' }, 'Stufe '), stufe),
          h('label', { for: 'ed-aufgabe' }, 'Aufgabentext (Du-Ansprache, so wie Ihre Schülerinnen und Schüler ihn lesen)'), aufgabe,
          h('p', null, h('label', { for: 'ed-alphabet' }, 'Eingabealphabet Σ (durch Kommas getrennt) '), alphabet, ' ',
            h('button', { type: 'button', class: 'btn btn-small', onclick: () => ed.setAlphabet(alphabet.value.split(',').map((t) => t.trim()).filter(Boolean)) }, 'Übernehmen')),
          h('h4', null, 'Musterautomat (DEA)'),
          h('p', { class: 'muted klein' }, 'Geprüft wird die Sprache: Jeder Automat, der dieselben Wörter akzeptiert, gilt als richtig. Beispielwörter erzeugt der Server aus Ihrem Automaten.'),
          edBox, graphBox,
          h('label', { for: 'ed-tipps' }, 'Tipps (optional, kosten beim Abrufen nichts – eigene Aufgaben geben keine Punkte)'), tipps];
        sammle = () => ({ aufgabe: aufgabe.value, stufe: Number(stufe.value), referenz: ed.toJSON(), tipps: tipps.value.split('\n').map((t) => t.trim()).filter(Boolean).slice(0, 3) });
      }
      const form = h('form', { class: 'lk-form ed-form', onsubmit: async (e) => {
        e.preventDefault();
        const body = { titel: titel.value, aktiv: freigabe.checked, daten: sammle() };
        status.textContent = 'Speichere …';
        try {
          const r = x.nr ? await api('PATCH', `/api/lehrer/eigene/${x.nr}`, body) : await api('POST', `/api/lehrer/kurse/${encodeURIComponent(kurs)}/eigene`, { ...body, art: x.art });
          status.textContent = 'Gespeichert.';
          if (!x.nr) ctx.navigate('lehrkraft', { teil: 'eigene', kurs, aufgabe: String(r.nr) }, { replace: true });
          else x.versucht = r.versucht;
        } catch (err) { status.textContent = err.message; }
      } },
        h('label', { for: 'ed-titel' }, 'Titel'), titel,
        ...inhalt,
        h('label', { class: 'check', for: 'ed-aktiv' }, freigabe, ' Für Schülerinnen und Schüler freigeben'),
        x.nr && x.versucht ? h('p', { class: 'notice' }, `Schon ${x.versucht}× bearbeitet: Ändern Sie Fragen oder Automat, werden diese Ergebnisse zurückgesetzt (der Titel allein nicht).`) : null,
        h('p', { class: 'start-actions' },
          h('button', { type: 'submit', class: 'btn btn-primary' }, 'Speichern'),
          x.nr ? h('a', { class: 'btn', href: `${x.link}&vorschau=1` }, 'Vorschau') : null,
          h('a', { class: 'btn', href: link() }, 'Zur Liste')),
        status);
      seite(...kopf, kursWahl, h('div', { class: 'panel lk-karte' }, h('h3', null, x.nr ? `Bearbeiten: ${x.titel}` : { quiz: 'Neues Quiz', baukasten: 'Neue Baukasten-Challenge', detektiv: 'Neuer Detektiv-Fall', grammatik: 'Neue Grammatik-Challenge' }[x.art]), form));
    }

    /* ───────────── 🏅 Urkunden (wie Algo Quest: im Browser drucken, kein PDF auf dem Server) ───────────── */
    async function urkundenSeite(id) {
      const u = await api('GET', `/api/lehrer/kurse/${encodeURIComponent(id)}/urkunden`);
      if (!aktiv) return;
      document.documentElement.classList.add('druck-urkunden');
      const heute = new Date().toISOString().slice(0, 10);
      const wahl = new Set(u.schueler.map((s) => s.id));
      const opt = { platz: 'alle', datum: heute, unterschrift: 'Kursleitung', namenszeile: false };
      const blaetter = h('div', { class: 'urkunden' });
      const datumText = () => (opt.datum ? new Date(`${opt.datum}T12:00:00`).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' }) : '');

      const urkunde = (s) => h('article', { class: 'urkunde' },
        h('div', { class: 'urkunde-rahmen' },
          h('p', { class: 'urkunde-marke', 'aria-hidden': 'true' }, '→◎'),
          h('h2', { class: 'urkunde-titel' }, 'Urkunde'),
          h('p', { class: 'urkunde-lab' }, 'AutomatenLab – Maschinen, die Sprache verstehen'),
          h('p', { class: 'urkunde-text' }, `Im Kurs ${u.kurs.name} hat`),
          h('p', { class: 'urkunde-name' }, s.name),
          opt.namenszeile ? h('p', { class: 'urkunde-namenszeile' }, 'Name: ', h('span', { class: 'urkunde-linie' })) : null,
          h('p', { class: 'urkunde-text' }, 'den Rang erreicht'),
          h('p', { class: 'urkunde-rang' }, s.rang),
          h('ol', { class: 'urkunde-leiter', 'aria-label': 'Ränge' }, u.raenge.map((r) => h('li', { class: r === s.rang ? 'is-aktuell' : null }, r))),
          h('ul', { class: 'urkunde-fakten' },
            h('li', null, h('strong', null, String(s.punkte)), ' Punkte'),
            h('li', null, h('strong', null, String(s.geloest)), s.geloest === 1 ? ' Aufgabe gelöst' : ' Aufgaben gelöst'),
            opt.platz === 'alle' || (opt.platz === 'top3' && s.platz <= 3) ? h('li', null, h('strong', null, `${s.platz}.`), ` Platz von ${u.anzahl}`) : null,
            h('li', null, h('strong', null, String(s.abzeichen.length)), ' Abzeichen')),
          s.abzeichen.length ? h('p', { class: 'urkunde-abzeichen' }, s.abzeichen.join(' · ')) : null,
          h('div', { class: 'urkunde-fuss' },
            h('p', null, datumText()),
            h('p', { class: 'urkunde-unterschrift' }, h('span', { class: 'urkunde-linie' }), opt.unterschrift))));
      const zeichne = () => clear(blaetter, u.schueler.filter((s) => wahl.has(s.id)).map(urkunde));

      const liste = h('div', { class: 'lk-check-reihe urkunden-auswahl' }, u.schueler.map((s) => h('label', { class: 'check' },
        h('input', { type: 'checkbox', checked: true, onchange: (e) => { if (e.target.checked) wahl.add(s.id); else wahl.delete(s.id); zeichne(); } }), ` ${s.name}`)));
      const optionen = h('div', { class: 'panel lk-karte no-print' },
        h('h3', null, 'Urkunden drucken'),
        h('p', { class: 'muted klein' }, 'Je Schülerin und Schüler eine A4-Seite mit Anzeigename, Rang (Anteil der Level-Punkte im Kursumfang), Punkten, gelösten Aufgaben, Platz und Abzeichen. Drucken Sie mit 100 % und eingeschalteten Hintergrundgrafiken. Eine Namenszeile lässt Platz für den echten Namen von Hand – er wird nirgends gespeichert.'),
        u.schueler.length ? liste : leer(),
        h('div', { class: 'lk-form urkunden-optionen' },
          h('label', null, 'Platz zeigen ', h('select', { onchange: (e) => { opt.platz = e.target.value; zeichne(); } },
            h('option', { value: 'alle' }, 'bei allen'), h('option', { value: 'top3' }, 'nur Plätze 1–3'), h('option', { value: 'keiner' }, 'nie'))),
          h('label', null, 'Datum ', h('input', { type: 'date', value: heute, onchange: (e) => { opt.datum = e.target.value; zeichne(); } })),
          h('label', null, 'Unterschrift ', h('input', { type: 'text', value: opt.unterschrift, maxlength: 60, oninput: (e) => { opt.unterschrift = e.target.value; zeichne(); } })),
          h('label', { class: 'check' }, h('input', { type: 'checkbox', onchange: (e) => { opt.namenszeile = e.target.checked; zeichne(); } }), ' Namenszeile zum Ausfüllen')),
        h('p', null, h('button', { type: 'button', class: 'btn btn-primary', onclick: () => window.print() }, '🖨 Drucken')));
      seite(
        h('p', { class: 'lk-krumen no-print' }, h('a', { href: '#/lehrkraft' }, 'Kurse'), ' › ', h('a', { href: kurslink(id) }, u.kurs.name), ' › Urkunden'),
        optionen, blaetter);
      zeichne();
    }

    return () => { aktiv = false; document.documentElement.classList.remove('druck-urkunden'); };
  },
};
