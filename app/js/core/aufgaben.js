// Aufgaben mit Prüfung auf dem Server (Vertrag InfoLabs §9). Module holen Aufgaben und prüfen Antworten über eine
// „Quelle“ mit immer gleicher Schnittstelle:
//   liste(modul) · aufgabe(id) · pruefen(id, antwort) · tipp(id) · aufdecken(id)
// • serverQuelle(): angemeldet – Lösungen bleiben auf dem Server, Punkte vergibt nur der Server.
// • demoQuelle(): Gastmodus – eigene Demo-Aufgaben (app/js/data/demo.js), im Browser geprüft, ohne Punkte.
// Training (Arena, „Unterscheide!“): quelle.training = { lokal, neu(modul, optionen), ende(id, antworten) } – auf dem
// Server gezählt (1 Punkt je richtiger Antwort, Tageshöchstwert) bzw. mit lokalesTraining() im Browser ohne Punkte.

import { api as apiRoh } from './api.js';
import { anmeldeLink } from './sitzung.js';
import { progress } from './progress.js';
import { DEMO } from '../data/demo.js';
import { erzeugeArenaRunde, werteArenaRunde, erzeugeUnterscheideRunde, werteUnterscheideRunde } from '../engine/training.js';
import { pruefeQuizFrage, pruefeDetektiv, pruefeBaukasten, pruefeMinimiererRunde, minimiererLoesung, pruefeMealyVorhersage, pruefeMealyTest, pruefeMealyReparatur, mealyLoesung, mealyFehlerVariante, pruefeUeberliste, ueberlisteBeispiel, pruefeNeaRaetsel, pruefeTeilmengenZeile, teilmengenLoesung, kellerFolge, pruefeKellerTabelle, kellerTabellenLoesung, pruefeKellerRueckwaerts, kellerRueckwaertsLoesung, pruefeRallye, rallyeLoesung, pruefeGrammatikChallenge } from '../engine/pruefer.js';

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

/** Nach einer Trainingsrunde: Lernstand neu laden (Punkte, Rekorde, Abzeichen) und neue Abzeichen anzeigen. */
async function nachTraining(r) {
  try { progress._server(await api('GET', '/api/lernstand')); } catch { /* nächste Anzeige lädt neu */ }
  progress._abzeichen(r?.neueAbzeichen);
  return r;
}

export function serverQuelle() {
  return {
    demo: false,
    training: {
      lokal: false,
      neu: (modul, optionen = {}) => api('POST', `/api/training/${encodeURIComponent(modul)}/neu`, optionen),
      ende: async (id, antworten) => nachTraining(await api('POST', `/api/training/runde/${encodeURIComponent(id)}/ende`, { antworten })),
    },
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
  } else if (d.modul === 'mealy') {
    const x = d.daten;
    if (d.art === 'vorhersage') oeffentlich = { id: x.id, nr: 0, titel: x.titel, kontext: x.kontext, automat: x.automat, bedeutung: x.bedeutung ?? null, beispiele: x.beispiele, worte: x.vorhersage };
    else {
      const fehlerhaft = mealyFehlerVariante(x.automat, x.fehler);
      const beispiele = x.beispiele.filter(([ein]) => !pruefeMealyTest(x.automat, fehlerhaft, { test: ein, urteil: 'stimmt' }).bug).slice(0, 3);
      oeffentlich = { id: x.id, nr: 0, stufe: x.stufe, titel: x.titel, kontext: x.kontext, fehlerText: x.fehlerText, automat: fehlerhaft, bedeutung: x.bedeutung ?? null, beispiele, worte: x.vorhersage };
    }
  } else if (d.modul === 'grammatik') {
    const x = d.daten;
    oeffentlich = { id: x.id, nr: 0, stufe: x.stufe, titel: x.titel, aufgabe: x.aufgabe, alphabet: x.alphabet, beispiele: x.beispiele, maxLen: x.maxLen ?? 8, regulaer: !!x.regulaer, tippsAnzahl: x.tipp ? 1 : 0 };
  } else if (d.modul === 'rallye') {
    const x = d.daten;
    oeffentlich = { id: x.id, nr: 0, stufe: x.stufe, titel: x.titel, kontext: x.kontext, grammatik: x.grammatik, ziel: x.ziel, sep: x.sep ?? null, modus: x.modus ?? 'ableiten' };
  } else if (d.modul === 'keller') {
    const x = d.daten;
    oeffentlich = d.art === 'rueckwaerts'
      ? { id: x.id, nr: 0, titel: x.titel, kontext: x.kontext, automat: x.automat, keller: x.keller, worte: x.tabelle, folge: kellerFolge(x.automat, x.rueckwaerts[0]) }
      : { id: x.id, nr: 0, titel: x.titel, kontext: x.kontext, automat: x.automat, beispiele: x.beispiele, keller: x.keller, sim: x.sim, worte: x.tabelle };
  } else if (d.modul === 'parallelwelten') {
    const x = d.daten;
    oeffentlich = { id: x.id, nr: 0, titel: x.titel, kontext: x.kontext, automat: x.automat, beispiele: x.beispiele, worte: x.raetsel, teilmengen: !!x.teilmengen };
  } else if (d.modul === 'ueberliste') {
    const x = d.daten;
    oeffentlich = { id: x.id, nr: 0, stufe: x.stufe, titel: x.titel, kontext: x.kontext, sprache: x.sprache, automat: x.automat, praefix: x.praefix, fortsetzung: x.fortsetzung, tippsAnzahl: x.tipps.length };
  } else if (d.modul === 'minimierer') {
    const x = d.daten;
    oeffentlich = { id: x.id, nr: 0, stufe: x.stufe, titel: x.titel, kontext: x.kontext, frage: x.frage, automat: x.automat };
  } else {
    const c = d.daten;
    oeffentlich = { id: c.id, nr: 0, stufe: c.stufe, titel: c.titel, aufgabe: c.aufgabe, alphabet: c.referenz.alphabet, beispiele: c.beispiele, tippsAnzahl: c.tipp ? 1 : 0 };
  }
  return { d, idVon, oeffentlich, tipps: d.daten.tipps ?? (d.daten.tipp ? [d.daten.tipp] : []), angesehen: false, geloest: false, fehlversuche: 0, tippsGenutzt: 0, antworten: {} };
}

/**
 * Training im Browser (Gastmodus, ohne Anmeldung): dieselben Runden und dieselbe Auswertung wie auf dem Server, aber
 * ohne Punkte und ohne Speicherung. daten = { arena: ARENA_AUTOMATEN } bzw. { minimierer: [{ id, automat }] }.
 */
export function lokalesTraining(daten) {
  const runden = new Map();
  let naechste = 1;
  return {
    lokal: true,
    async neu(modul, o = {}) {
      const items = modul === 'arena'
        ? erzeugeArenaRunde(daten.arena, { stufe: o.stufe ?? 1, nurId: o.automat ?? null })
        : erzeugeUnterscheideRunde(daten.minimierer, { nurId: o.aufgabe ?? null });
      const id = naechste++;
      runden.set(id, { modul, items });
      return { id, modul, items: items.map(({ akzeptiert, aequivalent, wort, ...rest }) => (modul === 'arena' ? { ...rest, wort } : rest)), heute: 0, maxProTag: 0 };
    },
    async ende(id, antworten) {
      const r = runden.get(id);
      if (!r) throw Object.assign(new Error('Diese Runde gibt es nicht (mehr).'), { status: 404 });
      runden.delete(id);
      const erg = r.modul === 'arena' ? werteArenaRunde(r.items, antworten) : werteUnterscheideRunde(daten.minimierer, r.items, antworten);
      return { ...erg, punkteErhalten: 0, wertung: false, neueAbzeichen: [], heute: 0, maxProTag: 0 };
    },
  };
}

export function demoQuelle() {
  const cache = new Map();
  const get = (id) => {
    if (!cache.has(id)) { const d = DEMO.find((x) => x.id === id); if (!d) throw Object.assign(new Error('Diese Demo-Aufgabe gibt es nicht.'), { status: 404 }); cache.set(id, vorbereiten(d)); }
    return cache.get(id);
  };
  const zustand = (s) => ({ status: s.geloest ? 'geloest' : s.angesehen ? 'angesehen' : 'offen', fehlversuche: s.fehlversuche, tippsGenutzt: s.tippsGenutzt, tippsAnzahl: s.tipps.length,
    tipps: s.tipps.slice(0, s.geloest || s.angesehen ? s.tipps.length : s.tippsGenutzt), punkte: 0, maxPunkte: 0, moeglich: 0 });
  const loesung = (s) => (s.d.modul === 'grammatik' ? { musterloesung: s.d.daten.musterloesung }
    : s.d.modul === 'rallye' ? rallyeLoesung(s.d.daten.grammatik, s.d.daten.ziel, s.d.daten.sep ?? '')
    : s.d.modul === 'keller' ? (s.d.art === 'tabelle' ? kellerTabellenLoesung(s.d.daten.automat, s.d.daten.tabelle) : kellerRueckwaertsLoesung(s.d.daten.automat, s.d.daten.rueckwaerts[0]))
    : s.d.modul === 'parallelwelten' ? (s.d.art === 'raetsel'
    ? { ergebnis: { ersterVersuch: Object.values(s.stand?.antworten ?? {}).reduce((a, b) => a + b, 0), von: s.d.daten.raetsel.length } }
    : teilmengenLoesung(s.d.daten.automat))
    : s.d.modul === 'ueberliste' ? { beispiel: ueberlisteBeispiel(s.d.daten.automat, s.d.daten.pruefe, s.d.daten.praefix, s.d.daten.fortsetzung) }
    : s.d.modul === 'mealy' ? (s.d.art === 'vorhersage'
    ? { ergebnis: { ersterVersuch: Object.values(s.stand?.antworten ?? {}).reduce((a, b) => a + b, 0), von: s.d.daten.vorhersage.length } }
    : mealyLoesung(s.d.daten.automat, s.d.daten.fehler))
    : s.d.modul === 'minimierer' ? minimiererLoesung(s.d.daten.automat, s.d.daten.merke) : s.d.modul === 'detektiv' ? { richtig: s.idVon(0, 0), richtigText: s.d.daten.optionen[0].text, bedeutung: s.d.daten.bedeutung ?? null }
    : s.d.modul === 'baukasten' ? { musterloesung: s.d.daten.referenz }
      : { ergebnis: { prozent: Math.round((100 * Object.values(s.antworten).reduce((a, b) => a + b, 0)) / s.d.daten.fragen.length) } });
  return {
    demo: true,
    training: null, // Module wählen lokalesTraining() mit ihren Daten
    liste: async (modul) => DEMO.filter((d) => d.modul === modul).map((d) => ({ id: d.id, modul, titel: d.titel, stufe: d.daten.stufe ?? 1, punkte: 0, ...(d.art ? { art: d.art, schluessel: d.daten.id } : {}) })),
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
      } else if (s.d.modul === 'grammatik') {
        erg = pruefeGrammatikChallenge(s.d.daten, antwort);
      } else if (s.d.modul === 'rallye') {
        erg = pruefeRallye(s.d.daten.grammatik, s.d.daten.ziel, s.d.daten.modus ?? 'ableiten', antwort);
      } else if (s.d.modul === 'keller' && s.d.art === 'tabelle') {
        erg = pruefeKellerTabelle(s.d.daten.automat, s.d.daten.tabelle, s.stand, antwort);
        s.stand = erg.stand;
      } else if (s.d.modul === 'keller') {
        erg = pruefeKellerRueckwaerts(s.d.daten.automat, s.oeffentlich.folge, antwort);
      } else if (s.d.modul === 'parallelwelten' && s.d.art === 'raetsel') {
        const r = pruefeNeaRaetsel(s.d.daten.automat, s.d.daten.raetsel, s.stand, antwort);
        s.stand = r.stand;
        erg = { ok: r.richtig, fertig: !s.geloest && r.fertig, zaehltFehler: false, rueckmeldung: r.rueckmeldung };
      } else if (s.d.modul === 'parallelwelten') {
        erg = pruefeTeilmengenZeile(s.d.daten.automat, s.stand, antwort);
        s.stand = erg.stand;
      } else if (s.d.modul === 'ueberliste') {
        erg = pruefeUeberliste(s.d.daten.automat, s.d.daten.pruefe, antwort);
      } else if (s.d.modul === 'minimierer') {
        erg = pruefeMinimiererRunde(s.d.daten.automat, s.stand, antwort);
        s.stand = erg.stand;
      } else if (s.d.modul === 'mealy' && s.d.art === 'vorhersage') {
        const r = pruefeMealyVorhersage(s.d.daten.automat, s.d.daten.vorhersage, s.stand, antwort);
        s.stand = r.stand;
        erg = { ok: r.richtig, fertig: !s.geloest && r.fertig, zaehltFehler: false, rueckmeldung: r.rueckmeldung };
      } else if (s.d.modul === 'mealy') {
        if (antwort?.test !== undefined) {
          const r = pruefeMealyTest(s.d.daten.automat, s.oeffentlich.automat, antwort);
          s.gefunden = s.gefunden || (r.bug && antwort.urteil === 'bug');
          erg = { ok: false, fertig: false, zaehltFehler: false, rueckmeldung: { ...r.rueckmeldung, gefunden: !!s.gefunden } };
        } else {
          erg = pruefeMealyReparatur(s.d.daten.automat, s.oeffentlich.automat, antwort?.ausgaben);
          erg.rueckmeldung.gefunden = !!s.gefunden;
        }
      } else {
        erg = pruefeBaukasten(s.d.daten.referenz, antwort?.automat);
      }
      const fertig = erg.fertig ?? erg.ok;
      if (s.d.modul !== 'quiz') { if (fertig) s.geloest = true; else if (!s.geloest && !s.angesehen && (erg.zaehltFehler ?? !erg.ok)) s.fehlversuche++; }
      return { ...erg, fertig, zustand: zustand(s), geloest: fertig, punkteErhalten: 0, neueAbzeichen: [], ...(fertig || s.angesehen ? { loesung: loesung(s) } : {}) };
    },
    async tipp(id) { const s = get(id); if (s.tippsGenutzt < s.tipps.length) s.tippsGenutzt++; return { zustand: zustand(s) }; },
    async aufdecken(id) { const s = get(id); s.angesehen = true; return { zustand: zustand(s), loesung: loesung(s) }; },
  };
}
