// Aufgaben mit Prüfung auf dem Server (Vertrag InfoLabs §9). Module holen Aufgaben und prüfen Antworten über eine
// „Quelle“ mit immer gleicher Schnittstelle:
//   liste(modul) · aufgabe(id) · pruefen(id, antwort) · tipp(id) · aufdecken(id)
// • serverQuelle(): angemeldet – Lösungen bleiben auf dem Server, Punkte vergibt nur der Server.
// • demoQuelle(): Gastmodus – eigene Demo-Aufgaben (app/js/data/demo.js), im Browser geprüft, ohne Punkte.

import { api as apiRoh } from './api.js';
import { anmeldeLink } from './sitzung.js';
import { progress } from './progress.js';
import { DEMO } from '../data/demo.js';
import { pruefeQuizFrage, pruefeDetektiv, pruefeBaukasten } from '../engine/pruefer.js';

const pfad = (id, was = '') => `/api/aufgaben/${encodeURIComponent(id)}${was}`;

/** Wie api(), aber eine abgelaufene Sitzung (401) startet still die Anmeldung neu (INTEGRATION.md §3.1). */
async function api(method, url, body) {
  try { return await apiRoh(method, url, body); } catch (e) {
    if (e.status === 401) { location.replace(anmeldeLink(location.pathname + location.hash)); e.message = 'Deine Anmeldung ist abgelaufen – du wirst neu angemeldet …'; }
    throw e;
  }
}

/** Nach dem Lösen den Lernstand neu laden (Punkte, gelöst, Abzeichen) und neue Abzeichen anzeigen. */
async function nachPruefen(r) {
  if (r?.geloest || r?.nachgeloest || r?.neueAbzeichen?.length) {
    try { progress._server(await api('GET', '/api/lernstand')); } catch { /* nächste Anzeige lädt neu */ }
  }
  progress._abzeichen(r?.neueAbzeichen);
  return r;
}

export function serverQuelle() {
  return {
    demo: false,
    liste: async (modul) => (await api('GET', `/api/katalog?modul=${encodeURIComponent(modul)}`)).aufgaben,
    aufgabe: (id) => api('GET', pfad(id)),
    pruefen: async (id, antwort) => nachPruefen(await api('POST', pfad(id, '/pruefen'), { antwort })),
    tipp: (id) => api('POST', pfad(id, '/tipp'), {}),
    aufdecken: (id) => api('POST', pfad(id, '/aufdecken'), {}),
  };
}

/* ───────────── Gastmodus: Demo-Aufgaben im Browser ───────────── */

const zufallsId = () => Math.random().toString(36).slice(2, 10);
const mische = (a) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

/** Demo-Aufgabe in dieselbe Form bringen, die der Server liefert (Optionen mit zufälligen Kennungen). */
function vorbereiten(d) {
  const ids = new Map(); // "frage:j" → Kennung
  const idVon = (i, j) => { const k = `${i}:${j}`; if (!ids.has(k)) ids.set(k, zufallsId()); return ids.get(k); };
  let oeffentlich;
  if (d.modul === 'quiz') {
    oeffentlich = { titel: d.titel, art: 'demo', fragen: d.daten.fragen.map((f, i) => (f.typ === 'mc'
      ? { typ: 'mc', frage: f.frage, optionen: mische(f.optionen.map((text, j) => ({ id: idVon(i, j), text }))) }
      : f.typ === 'wf' ? { typ: 'wf', aussage: f.aussage, begruendungen: mische(f.begruendungen.map((text, j) => ({ id: idVon(i, j), text }))) }
        : { typ: 'zuordnung', frage: f.frage, links: f.paare.map((p) => p[0]), rechts: mische(f.paare.map((p) => p[1])) })) };
  } else if (d.modul === 'detektiv') {
    const f = d.daten;
    oeffentlich = { titel: f.titel, nr: 0, automat: f.automat, vorschlaege: f.vorschlaege ?? [], optionen: mische(f.optionen.map((o, j) => ({ id: idVon(0, j), text: o.text }))) };
  } else {
    const c = d.daten;
    oeffentlich = { id: c.id, nr: 0, stufe: c.stufe, titel: c.titel, aufgabe: c.aufgabe, alphabet: c.referenz.alphabet, beispiele: c.beispiele, tippsAnzahl: c.tipp ? 1 : 0 };
  }
  return { d, idVon, oeffentlich, tipps: d.daten.tipp ? [d.daten.tipp] : [], angesehen: false, geloest: false, fehlversuche: 0, tippsGenutzt: 0, antworten: {} };
}

export function demoQuelle() {
  const cache = new Map();
  const get = (id) => {
    if (!cache.has(id)) { const d = DEMO.find((x) => x.id === id); if (!d) throw Object.assign(new Error('Diese Demo-Aufgabe gibt es nicht.'), { status: 404 }); cache.set(id, vorbereiten(d)); }
    return cache.get(id);
  };
  const zustand = (s) => ({ status: s.geloest ? 'geloest' : s.angesehen ? 'angesehen' : 'offen', fehlversuche: s.fehlversuche, tippsGenutzt: s.tippsGenutzt, tippsAnzahl: s.tipps.length,
    tipps: s.tipps.slice(0, s.geloest || s.angesehen ? s.tipps.length : s.tippsGenutzt), punkte: 0, maxPunkte: 0, moeglich: 0 });
  const loesung = (s) => (s.d.modul === 'detektiv' ? { richtig: s.idVon(0, 0), richtigText: s.d.daten.optionen[0].text, bedeutung: s.d.daten.bedeutung ?? null }
    : s.d.modul === 'baukasten' ? { musterloesung: s.d.daten.referenz }
      : { ergebnis: { prozent: Math.round((100 * Object.values(s.antworten).reduce((a, b) => a + b, 0)) / s.d.daten.fragen.length) } });
  return {
    demo: true,
    liste: async (modul) => DEMO.filter((d) => d.modul === modul).map((d) => ({ id: d.id, modul, titel: d.titel, stufe: d.daten.stufe ?? 1, punkte: 0 })),
    aufgabe: async (id) => { const s = get(id); return { id, modul: s.d.modul, aufgabe: s.oeffentlich, zustand: zustand(s), ...(s.geloest || s.angesehen ? { loesung: loesung(s) } : {}) }; },
    async pruefen(id, antwort) {
      const s = get(id);
      let erg;
      if (s.d.modul === 'quiz') {
        const i = Number.isInteger(antwort?.frage) ? antwort.frage : -1;
        const f = s.d.daten.fragen[i];
        if (!f) throw Object.assign(new Error('Diese Frage gibt es nicht.'), { status: 400 });
        const r = pruefeQuizFrage(f, antwort, (j) => s.idVon(i, j));
        if (!(String(i) in s.antworten)) s.antworten[String(i)] = r.wert;
        const fertig = Object.keys(s.antworten).length === s.d.daten.fragen.length;
        if (fertig) s.geloest = true;
        erg = { ok: r.wert === 1, fertig, rueckmeldung: { frage: i, ...r.rueckmeldung } };
      } else if (s.d.modul === 'detektiv') {
        const j = s.d.daten.optionen.findIndex((_, k) => s.idVon(0, k) === antwort?.wahl);
        if (j < 0) throw Object.assign(new Error('Bitte wähle eine Beschreibung.'), { status: 400 });
        erg = pruefeDetektiv(s.d.daten, j);
      } else {
        erg = pruefeBaukasten(s.d.daten.referenz, antwort?.automat);
      }
      if (s.d.modul !== 'quiz') { if (erg.ok) s.geloest = true; else if (!s.geloest && !s.angesehen) s.fehlversuche++; }
      const fertig = erg.fertig ?? erg.ok;
      return { ...erg, fertig, zustand: zustand(s), geloest: fertig, punkteErhalten: 0, neueAbzeichen: [], ...(fertig || s.angesehen ? { loesung: loesung(s) } : {}) };
    },
    async tipp(id) { const s = get(id); if (s.tippsGenutzt < s.tipps.length) s.tippsGenutzt++; return { zustand: zustand(s) }; },
    async aufdecken(id) { const s = get(id); s.angesehen = true; return { zustand: zustand(s), loesung: loesung(s) }; },
  };
}
