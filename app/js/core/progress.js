// Fortschritt (gelöste Challenges, Punkte, Abzeichen, Bestwerte).
// • Gäste und Module mit Prüfung im Browser: lokal (localStorage). Funktioniert auch ohne localStorage (bis zum Neuladen).
// • Angemeldet (Portal InfoLabs): Für Module mit Prüfung auf dem Server (Vertrag §9) kommt der Stand vom Server
//   (GET /api/lernstand, intern über progress._server()). Diese Module lösen nur über die Prüf-API; solve()/award()
//   rufen sie nicht auf. Die öffentliche API unten bleibt unverändert.
//
// API:
//   progress.points                        aktuelle Punktzahl
//   progress.isSolved(modul, id)           true/false
//   progress.solve(modul, id, punkte)      markiert als gelöst; Punkte nur beim ERSTEN Lösen → {first:boolean}
//   progress.solvedIds(modul)              Array der gelösten IDs
//   progress.addPoints(n)                  Punkte gutschreiben (z. B. Arena-Runde)
//   progress.best(key) / progress.setBest(key, wert)   Bestwert; setBest → true, wenn neuer Rekord
//   progress.hasBadge(id) / progress.award(id)         award → true, wenn neu (zeigt Toast über onBadge)
//   progress.getDraft(key) / progress.setDraft(key, obj)  Zwischenstände (z. B. Baukasten-Entwurf)
//   progress.pref(key, fallback) / progress.setPref(key, wert)   Einstellungen (z. B. Großansicht)
//   progress.reset()                       alles löschen
//   progress.subscribe(fn)                 fn(state) bei jeder Änderung; liefert Abmeldefunktion

import { BADGES } from '../data/badges.js';

const KEY = 'automatenlab.v1';
const empty = () => ({ v: 1, points: 0, solved: {}, badges: [], best: {}, drafts: {}, prefs: {} });

function load() {
  try {
    const raw = window.localStorage?.getItem(KEY);
    if (!raw) return empty();
    const s = JSON.parse(raw);
    return { ...empty(), ...s };
  } catch { return empty(); }
}

let state = load();
const listeners = new Set();
const badgeListeners = new Set();
// Lernstand vom Server (nur angemeldet): { module: Set, punkte, solved, best, badges }
let server = null;
const vomServer = (modul) => !!server && server.module.has(modul);
const badgeModul = (id) => String(id).split('-')[0];

function save() {
  try { window.localStorage?.setItem(KEY, JSON.stringify(state)); } catch { /* privater Modus o. Ä. – egal */ }
  for (const fn of listeners) { try { fn(state); } catch (e) { console.error(e); } }
}

export const progress = {
  // Angemeldet zählen die Punkte des Servers (die einzigen, die das Portal und die Lehrkraft sehen)
  get points() { return server ? server.punkte : state.points; },
  get badges() { return server ? [...new Set([...state.badges.filter((b) => !vomServer(badgeModul(b))), ...server.badges])] : [...state.badges]; },
  isSolved: (modul, id) => (vomServer(modul) ? !!server.solved[`${modul}:${id}`] : !!state.solved[`${modul}:${id}`]),
  solvedIds: (modul) => Object.keys(vomServer(modul) ? server.solved : state.solved).filter((k) => k.startsWith(`${modul}:`)).map((k) => k.slice(modul.length + 1)),
  solve(modul, id, punkte = 0) {
    const k = `${modul}:${id}`;
    const first = !state.solved[k];
    if (first) { state.solved[k] = Date.now(); state.points += punkte; save(); }
    return { first };
  },
  addPoints(n) { if (n > 0) { state.points += n; save(); } },
  best: (key) => (vomServer(String(key).split(':')[0]) ? server.best[key] ?? null : state.best[key] ?? null),
  setBest(key, value) {
    if (state.best[key] == null || value > state.best[key]) { state.best[key] = value; save(); return true; }
    return false;
  },
  hasBadge: (id) => (vomServer(badgeModul(id)) ? server.badges.includes(id) : state.badges.includes(id)),
  award(id) {
    if (state.badges.includes(id)) return false;
    state.badges.push(id); save();
    const b = BADGES.find((x) => x.id === id);
    for (const fn of badgeListeners) fn(b ?? { id, titel: id });
    return true;
  },
  getDraft: (key) => state.drafts[key] ?? null,
  setDraft(key, obj) { if (obj == null) delete state.drafts[key]; else state.drafts[key] = obj; save(); },
  pref: (key, fallback = null) => state.prefs[key] ?? fallback,
  setPref(key, value) { state.prefs[key] = value; save(); },
  reset() { const prefs = state.prefs; state = { ...empty(), prefs }; save(); },
  subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  onBadge(fn) { badgeListeners.add(fn); return () => badgeListeners.delete(fn); },

  // ── intern (Kern der App, nicht für Module) ──
  /** Lernstand vom Server übernehmen (null = abgemeldet/Gast). */
  _server(ls) {
    server = ls ? { module: new Set(ls.module), punkte: ls.punkte, solved: ls.solved, best: ls.best, badges: ls.badges } : null;
    for (const fn of listeners) { try { fn(state); } catch (e) { console.error(e); } }
  },
  get _angemeldet() { return !!server; },
  /** Neu verdiente Abzeichen aus einer Server-Antwort anzeigen. */
  _abzeichen(liste) {
    for (const b of liste ?? []) for (const fn of badgeListeners) fn({ id: b.id, titel: b.titel, text: b.text });
  },
};
