// Fortschritt (gelöste Challenges, Punkte, Abzeichen, Bestwerte) – NUR lokal im Browser (localStorage).
// Keine Cookies, kein Server. Funktioniert auch ohne localStorage (dann nur bis zum Neuladen).
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

function save() {
  try { window.localStorage?.setItem(KEY, JSON.stringify(state)); } catch { /* privater Modus o. Ä. – egal */ }
  for (const fn of listeners) { try { fn(state); } catch (e) { console.error(e); } }
}

export const progress = {
  get points() { return state.points; },
  get badges() { return [...state.badges]; },
  isSolved: (modul, id) => !!state.solved[`${modul}:${id}`],
  solvedIds: (modul) => Object.keys(state.solved).filter((k) => k.startsWith(`${modul}:`)).map((k) => k.slice(modul.length + 1)),
  solve(modul, id, punkte = 0) {
    const k = `${modul}:${id}`;
    const first = !state.solved[k];
    if (first) { state.solved[k] = Date.now(); state.points += punkte; save(); }
    return { first };
  },
  addPoints(n) { if (n > 0) { state.points += n; save(); } },
  best: (key) => state.best[key] ?? null,
  setBest(key, value) {
    if (state.best[key] == null || value > state.best[key]) { state.best[key] = value; save(); return true; }
    return false;
  },
  hasBadge: (id) => state.badges.includes(id),
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
};
