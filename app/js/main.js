// Einstieg: Kopfzeile, Routing, Modul-Lebenszyklus.
// Ein Modul ist ein ES-Modul mit default-Export { mount(el, ctx) } (siehe ARCHITECTURE.md).

import { h, clear, stateGlyph } from './core/dom.js';
import { parseHash, link, navigate } from './core/router.js';
import { progress } from './core/progress.js';
import { MODULES, findModule } from './modules/manifest.js';
import { LEVELS } from './data/worlds.js';
import { toast } from './components/toast.js';
import { sitzung, anmeldeLink, istLehrkraft } from './core/sitzung.js';
import { serverQuelle, demoQuelle } from './core/aufgaben.js';
import { api } from './core/api.js';
import { gastErlaubt } from './data/gast.js';

const SPECIAL = {
  '': () => import('./modules/home.js'),
  komponenten: () => import('./modules/komponenten.js'), // Entwickler-Seite (nicht verlinkt)
  themen: () => import('./modules/themen.js'), // auch Server-Pfad /themen (Vertrag InfoLabs)
  datenschutz: () => import('./modules/datenschutz.js'), // auch /datenschutz
  lehrkraft: () => import('./modules/lehrkraft.js'), // auch /lehrer
  gast: () => import('./modules/gast.js'), // auch /gast: Demo-Aufgaben ohne Anmeldung
  material: () => import('./modules/material.js'), // Zusatzmaterial (PDF), nur angemeldet; auch /material
};

const app = document.getElementById('app');
let cleanup = null;
let navSeq = 0;

// ───── Kopfzeile ─────
const pointsEl = h('span', { class: 'points-value' }, String(progress.points));
const bigToggle = h('button', {
  type: 'button', class: 'btn btn-ghost btn-big-toggle', 'aria-pressed': String(!!progress.pref('gross')),
  title: 'Großansicht für Beamer', onclick: () => {
    const on = !progress.pref('gross');
    progress.setPref('gross', on);
    applyPrefs();
  },
}, h('span', { 'aria-hidden': 'true' }, 'A'), h('span', { class: 'big-a', 'aria-hidden': 'true' }, 'A'), h('span', { class: 'sr-only' }, 'Großansicht'));

function applyPrefs() {
  const on = !!progress.pref('gross');
  document.documentElement.classList.toggle('is-gross', on);
  bigToggle.setAttribute('aria-pressed', String(on));
}

const header = h('header', { class: 'site-header' },
  h('a', { class: 'brand', href: '#/', 'aria-label': 'AutomatenLab – zur Übersicht' },
    h('span', { class: 'brand-mark', 'aria-hidden': 'true' }, h('span', { class: 'brand-arrow' }), stateGlyph({ accepting: true, size: 30 })),
    h('span', { class: 'brand-name' }, 'Automaten', h('span', { class: 'brand-lab' }, 'Lab'))),
  h('div', { class: 'header-tools' },
    h('a', { class: 'points-chip', href: '#/', title: 'Deine Punkte (nur auf diesem Gerät gespeichert)' }, pointsEl, h('span', { class: 'points-label' }, ' Punkte')),
    h('span', { class: 'konto-tools' }),
    bigToggle));
const main = h('main', { id: 'main', tabindex: '-1' });
const footerText = h('p', null, 'AutomatenLab für Grund- und Leistungskurs Informatik. Ohne Anmeldung bleibt dein Fortschritt nur auf diesem Gerät.');
const footer = h('footer', { class: 'site-footer' },
  footerText,
  h('p', { class: 'footer-links' }, h('a', { href: '#/themen' }, 'Themen'), ' · ', h('a', { href: '#/lehrkraft' }, 'Für Lehrkräfte'), ' · ', h('a', { href: '#/datenschutz' }, 'Datenschutz')));
clear(app, h('a', { class: 'skip-link', href: '#main', onclick: (e) => { e.preventDefault(); main.focus(); } }, 'Zum Inhalt springen'), header, main, footer);

progress.subscribe(() => {
  const old = Number(pointsEl.textContent);
  pointsEl.textContent = String(progress.points);
  if (progress.points > old) { pointsEl.parentElement.classList.remove('is-bump'); void pointsEl.offsetWidth; pointsEl.parentElement.classList.add('is-bump'); }
});
progress.onBadge((b) => toast(b.text ?? '', { type: 'badge', title: `Abzeichen: ${b.titel}`, timeout: 6000 }));
applyPrefs();

// ───── Anmeldung über das Portal InfoLabs (Vertrag §5, §9: Link „⌂ Portal“) ─────
const kontoTools = header.querySelector('.konto-tools');
// Angemeldet: Lernstand der Module mit Prüfung auf dem Server laden (Punkte, gelöst, Abzeichen) – die erste Seite
// wartet darauf, damit sie nicht kurz einen veralteten Stand aus dem Browser zeigt.
const lernstandBereit = sitzung().then(({ konto }) => (konto ? api('GET', '/api/lernstand').then((ls) => progress._server(ls)).catch(() => {}) : null));
sitzung().then(({ konto, anmeldung, portal }) => {
  const teile = [];
  if (portal) teile.push(h('a', { class: 'btn btn-ghost header-btn', href: portal + '/', title: 'Zum Portal InfoLabs' }, h('span', { 'aria-hidden': 'true' }, '⌂'), h('span', { class: 'header-btn-text' }, ' Portal')));
  if (konto) {
    footerText.textContent = `AutomatenLab für Grund- und Leistungskurs Informatik. Angemeldet über InfoLabs als ${konto.name}.`;
    teile.push(h('details', { class: 'konto-menu' },
      h('summary', { class: 'btn btn-ghost header-btn', title: 'Konto' }, h('span', { class: 'konto-name' }, konto.name)),
      h('ul', { class: 'konto-liste' },
        istLehrkraft(konto) ? h('li', null, h('a', { href: '#/lehrkraft' }, 'Lehrkraft-Bereich')) : null,
        h('li', null, h('a', { href: '#/material' }, 'Material (PDF)')),
        h('li', null, h('a', { href: '/abmelden' }, 'Abmelden')),
        portal ? h('li', null, h('a', { href: '/abmelden/ueberall' }, 'Überall abmelden')) : null)));
  } else if (anmeldung) {
    const login = h('a', { class: 'btn btn-ghost header-btn header-login', href: anmeldeLink() }, 'Anmelden');
    window.addEventListener('hashchange', () => { login.href = anmeldeLink(); });
    teile.push(login);
  }
  clear(kontoTools, teile);
});
// Menü schließen bei Klick daneben oder Escape
document.addEventListener('click', (e) => { for (const d of document.querySelectorAll('.konto-menu[open]')) if (!d.contains(e.target)) d.open = false; });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') for (const d of document.querySelectorAll('.konto-menu[open]')) { d.open = false; d.querySelector('summary').focus(); } });

// ───── Routing ─────
async function route() {
  const seq = ++navSeq;
  const { route: r, params } = parseHash();
  if (cleanup) { try { cleanup(); } catch (e) { console.error(e); } cleanup = null; }
  clear(main);
  // Gastmodus (Vertrag §4, Entscheidung V2): ohne Sitzung nur Demo-Aufgaben – sonst still zur Portal-Anmeldung,
  // danach zurück genau auf diese Route (QR-Codes bleiben gültig). Ohne eingerichtete Anmeldung und für Schüler ohne
  // freigeschalteten Kurs (Vertrag §4, die Prüf-API antwortet dann 403) bleiben ebenfalls nur die Demo-Aufgaben offen.
  const sess = await sitzung();
  await lernstandBereit;
  if (seq !== navSeq) return;
  if (!gastErlaubt(r, params) && !volleNutzung(sess.konto)) {
    if (sess.anmeldung && !sess.konto) { location.replace(anmeldeLink(location.pathname + location.hash)); return; }
    renderGesperrt(sess); finishNav('Nur Demo-Aufgaben'); return;
  }
  const meta = findModule(r);
  let loader = SPECIAL[r] ?? meta?.load;
  let mod;
  try {
    if (!loader) {
      if (meta) { renderComingSoon(meta); finishNav(meta.title); return; }
      renderNotFound(r); finishNav('Seite nicht gefunden'); return;
    }
    mod = (await loader()).default;
  } catch (e) {
    console.error(e);
    clear(main, h('section', { class: 'page narrow' }, h('h1', null, 'Das Modul konnte nicht geladen werden.'),
      h('p', null, 'Lade die Seite neu. Wenn das nicht hilft, ist die Verbindung zum Schulserver gestört.'),
      h('p', null, h('a', { class: 'btn', href: '#/' }, 'Zur Übersicht'))));
    return;
  }
  if (seq !== navSeq) return;
  const body = meta ? modulePage(meta) : main;
  const ctx = {
    route: r, params, meta,
    navigate, link, toast, progress,
    /** Aufgaben und Prüfung: Server (angemeldet) oder Demo-Aufgaben im Browser (?demo=1, Gastmodus). */
    quelle: params.get('demo') === '1' ? demoQuelle() : serverQuelle(),
    /** Untertitel unter der Modulüberschrift setzen (z. B. Challenge-Name). */
    setSubtitle: (t) => { const s = main.querySelector('.module-subtitle'); if (s) s.textContent = t ?? ''; },
  };
  try {
    const ret = mod.mount(body, ctx);
    cleanup = typeof ret === 'function' ? ret : null;
  } catch (e) {
    console.error(e);
    clear(body, h('p', { class: 'notice notice-error' }, 'Hier ist etwas schiefgelaufen. Lade die Seite neu.'));
  }
  finishNav(meta?.title ?? mod.title ?? 'Übersicht');
}

function finishNav(title) {
  document.title = title && title !== 'Übersicht' ? `${title} – AutomatenLab` : 'AutomatenLab';
  window.scrollTo(0, 0);
  // Fokus für Screenreader an den Seitenanfang, ohne sichtbaren Sprung
  if (document.activeElement && document.activeElement !== document.body && !main.contains(document.activeElement)) main.focus({ preventScroll: true });
}

function levelChips(levels) {
  // Module für alle 16 Level (Quiz) bekommen einen Sammel-Chip statt 16 einzelner
  if (levels.length >= Object.keys(LEVELS).length) return h('ul', { class: 'level-chips', 'aria-label': 'Eingesetzt in' }, h('li', null, h('span', { class: 'level-chip' }, 'Alle Level')));
  return h('ul', { class: 'level-chips', 'aria-label': 'Eingesetzt in' },
    levels.map((n) => h('li', null, h('span', { class: 'level-chip', title: LEVELS[n] }, `Level ${n}`))));
}

function modulePage(meta) {
  const body = h('div', { class: 'module-body' });
  main.append(h('section', { class: ['module-page', `module-${meta.route}`] },
    h('div', { class: 'module-head' },
      h('a', { class: 'back-link', href: '#/' }, h('span', { 'aria-hidden': 'true' }, '‹ '), 'Übersicht'),
      h('div', { class: 'module-title-row' },
        h('h1', { class: 'module-title' }, meta.title),
        meta.levels.length ? levelChips(meta.levels) : null),
      h('p', { class: 'module-subtitle' })),
    body));
  return body;
}

function renderComingSoon(meta) {
  const ready = MODULES.filter((m) => m.load);
  main.append(h('section', { class: 'page narrow coming-soon' },
    h('a', { class: 'back-link', href: '#/' }, h('span', { 'aria-hidden': 'true' }, '‹ '), 'Übersicht'),
    h('h1', null, meta.title),
    meta.levels.length ? levelChips(meta.levels) : null,
    h('p', { class: 'lead' }, meta.blurb),
    h('p', { class: 'notice' }, 'Dieses Modul ist bald verfügbar. Bis dahin kannst du hier üben:'),
    h('ul', { class: 'link-list' }, ready.map((m) => h('li', null, h('a', { href: link(m.route) }, m.title))))));
}

/** Volle Nutzung: Lehrkraft/Superadmin immer, Schüler nur mit mindestens einem freigeschalteten Kurs (§4). */
const volleNutzung = (konto) => !!konto && (konto.rolle !== 'schueler' || (konto.kurse ?? []).length > 0);

function renderGesperrt(sess) {
  main.append(h('section', { class: 'page narrow' },
    h('h1', null, sess.konto ? 'AutomatenLab ist für deinen Kurs noch nicht freigeschaltet.' : 'Die Anmeldung ist hier nicht eingerichtet.'),
    h('p', null, sess.konto
      ? 'Deine Lehrkraft schaltet AutomatenLab im Portal InfoLabs für euren Kurs frei. Bis dahin kannst du die Demo-Aufgaben ausprobieren.'
      : 'Ohne Anmeldung über das Portal InfoLabs gibt es nur die Demo-Aufgaben.'),
    h('p', null, h('a', { class: 'btn', href: '#/gast' }, 'Zu den Demo-Aufgaben'), ' ', h('a', { class: 'btn btn-ghost', href: '#/' }, 'Zur Übersicht'))));
}

function renderNotFound(r) {
  main.append(h('section', { class: 'page narrow' },
    h('h1', null, 'Diese Seite gibt es nicht.'),
    h('p', null, `Die Adresse „#/${r}“ gehört zu keinem Modul. Prüfe den Link oder den QR-Code.`),
    h('p', null, h('a', { class: 'btn', href: '#/' }, 'Zur Übersicht'))));
}

window.addEventListener('hashchange', route);
route();
