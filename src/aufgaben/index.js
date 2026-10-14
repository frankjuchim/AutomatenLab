'use strict';
// Aufgabenkatalog mit Prüfung auf dem Server (Vertrag §9): Die Daten samt Lösungen liegen in inhalte/ (nie
// ausgeliefert). Jeder Aufgabentyp liefert
//   oeffentlich(a, h)        → was der Browser sehen darf (keine Lösung, keine ungenutzten Tipps)
//   pruefe(a, antwort, z, h) → { ok, fertig?, zaehltFehler?, anteil?, daten?, rueckmeldung }
//   loesungsteil(a, h)       → Lösung/Erklärung (erst nach dem Lösen oder „Lösung zeigen“)
//   tipps                    → Liste der Tipps (werden einzeln abgerufen und kosten Punkte)
//   abzeichen(ctx)           → neu verdiente Abzeichen (Schlüssel aus app/js/data/badges.js)
// Formatbeschreibung: docs/AUFGABENFORMAT.md.

const path = require('node:path');
const crypto = require('node:crypto');
const { pathToFileURL } = require('node:url');

const INHALTE = path.join(__dirname, '..', '..', 'inhalte');
const ENGINE = path.join(__dirname, '..', '..', 'app', 'js', 'engine');
const lade = (datei) => import(pathToFileURL(datei).href);

/** Standardpunkte je Stufe (Vertrag §9). */
const PUNKTE_STUFE = { 1: 10, 2: 20, 3: 30 };

/** Fehler mit HTTP-Status und deutscher Meldung. */
const fehler = (status, text) => Object.assign(new Error(text), { status });

/**
 * Undurchsichtige Kennungen für Antwortoptionen: Der Browser sieht nie die Position in den Daten (dort ist die
 * erste Option die richtige), sondern nur einen HMAC-Wert. Die Reihenfolge wird bei jeder Anzeige gemischt.
 */
function createHilfe(secret) {
  const oid = (...teile) => crypto.createHmac('sha256', secret).update(teile.join('\u0000')).digest('base64url').slice(0, 12);
  const mische = (liste) => {
    const a = [...liste];
    for (let i = a.length - 1; i > 0; i--) {
      const j = crypto.randomInt(i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  return { oid, mische };
}

async function ladeAufgaben(secret) {
  const h = createHilfe(secret);
  const [quiz, detektiv, baukasten, minimierer, dfaM, pruefer, badgesM] = await Promise.all([
    lade(path.join(INHALTE, 'quiz.js')),
    lade(path.join(INHALTE, 'detektiv.js')),
    lade(path.join(INHALTE, 'baukasten.js')),
    lade(path.join(INHALTE, 'minimierer.js')),
    lade(path.join(ENGINE, 'dfa.js')),
    lade(path.join(ENGINE, 'pruefer.js')),
    lade(path.join(__dirname, '..', '..', 'app', 'js', 'data', 'badges.js'))
  ]);
  const { dfa, normalizeDFA } = dfaM;
  const { pruefeQuizFrage, pruefeDetektiv, pruefeBaukasten, pruefeMinimiererRunde, minimiererLoesung } = pruefer;
  const liste = [];

  /* ---------- Level-Quiz: Exit-Tickets (eine Aufgabe je Quiz, Fragen einzeln beantwortet) ---------- */
  const QUIZ = {
    modul: 'quiz',
    oeffentlich(a) {
      return {
        titel: a.titel,
        art: a.art,
        fragen: a.daten.fragen.map((f, i) => {
          if (f.typ === 'mc') return { typ: 'mc', frage: f.frage, optionen: h.mische(f.optionen.map((text, j) => ({ id: h.oid(a.id, i, j), text }))) };
          if (f.typ === 'wf') return { typ: 'wf', aussage: f.aussage, begruendungen: h.mische(f.begruendungen.map((text, j) => ({ id: h.oid(a.id, i, j), text }))) };
          return { typ: 'zuordnung', frage: f.frage, links: f.paare.map((p) => p[0]), rechts: h.mische(f.paare.map((p) => p[1])) };
        })
      };
    },
    /** antwort: { frage: Index, wahl?: id (mc), wahr?: bool + begruendung?: id (wf), zuordnung?: [rechts je links] } */
    pruefe(a, antwort, z) {
      const fragen = a.daten.fragen;
      const i = antwort && Number.isInteger(antwort.frage) ? antwort.frage : -1;
      const f = fragen[i];
      if (!f) throw fehler(400, 'Diese Frage gibt es nicht.');
      const { wert, rueckmeldung } = pruefeQuizFrage(f, antwort, (j) => h.oid(a.id, i, j));
      const rm = { frage: i, ...rueckmeldung };
      // Gewertet wird der erste Durchgang: jede Frage zählt einmal, Wiederholen ist Übung
      const daten = { antworten: { ...(z.daten.antworten || {}) } };
      if (z.offen && !(String(i) in daten.antworten)) daten.antworten[String(i)] = wert;
      const beantwortet = Object.keys(daten.antworten).length;
      const fertig = z.offen && beantwortet === fragen.length;
      const summe = Object.values(daten.antworten).reduce((s, x) => s + x, 0);
      return { ok: wert === 1, fertig, zaehltFehler: false, anteil: fertig ? summe / fragen.length : undefined, daten: z.offen ? daten : undefined, rueckmeldung: rm };
    },
    loesungsteil(a, z) {
      const antworten = z.daten.antworten || {};
      const summe = Object.values(antworten).reduce((s, x) => s + x, 0);
      return { ergebnis: { prozent: Math.round((100 * summe) / a.daten.fragen.length), punkte: summe, von: a.daten.fragen.length } };
    },
    abzeichen({ a, anteil }) {
      const neu = ['quiz-erstes'];
      if (a.art === 'welt' && anteil === 1) neu.push('quiz-welt-perfekt');
      return neu;
    }
  };
  for (const [k, q] of Object.entries(quiz.QUIZ_WELTEN)) {
    liste.push({ id: `quiz:welt-${k}`, typ: QUIZ, modul: 'quiz', titel: q.titel, art: 'welt', stufe: 3, punkte: 30, levels: q.levels, daten: q, tipps: [] });
  }
  for (const [n, q] of Object.entries(quiz.QUIZ_DS)) {
    liste.push({ id: `quiz:ds-${n}`, typ: QUIZ, modul: 'quiz', titel: `Exit-Ticket ${q.titel}`, art: 'ds', stufe: 1, punkte: 10, levels: [Number(n)], daten: q, tipps: [] });
  }

  /* ---------- Sprach-Detektiv: Welche Beschreibung passt zur Sprache des (sichtbaren) Automaten? ---------- */
  const DETEKTIV = {
    modul: 'detektiv',
    oeffentlich(a) {
      const f = a.daten;
      return { titel: f.titel, nr: a.nr, automat: f.automat, vorschlaege: f.vorschlaege || [], optionen: h.mische(f.optionen.map((o, j) => ({ id: h.oid(a.id, j), text: o.text }))) };
    },
    pruefe(a, antwort) {
      const f = a.daten;
      const j = f.optionen.findIndex((_, k) => h.oid(a.id, k) === (antwort && antwort.wahl));
      if (j < 0) throw fehler(400, 'Bitte wähle eine Beschreibung.');
      return pruefeDetektiv(f, j);
    },
    loesungsteil(a) {
      return { richtig: h.oid(a.id, 0), richtigText: a.daten.optionen[0].text, bedeutung: a.daten.bedeutung || null };
    },
    abzeichen({ alleGeloest, ersterVersuch, zeilen }) {
      const neu = ['detektiv-erster-fall'];
      const erst = zeilen.filter((z) => z.status === 'geloest' && z.fehlversuche === 0).length;
      if (ersterVersuch && erst >= 5) neu.push('detektiv-spuernase');
      if (alleGeloest) neu.push('detektiv-alle');
      return neu;
    }
  };
  detektiv.DETEKTIV_FAELLE.forEach((f, i) => {
    const stufe = i < 4 ? 1 : i < 8 ? 2 : 3;
    dfa(f.automat); // wirft früh, falls ein Automat in inhalte/ fehlerhaft ist
    liste.push({ id: `detektiv:fall-${i + 1}`, typ: DETEKTIV, modul: 'detektiv', nr: i + 1, titel: f.titel, stufe, punkte: PUNKTE_STUFE[stufe], levels: [2], daten: f, tipps: [] });
  });

  /* ---------- Automaten-Baukasten: eigener DEA → Vergleich der Sprache mit der Referenz ---------- */
  const BAUKASTEN = {
    modul: 'baukasten',
    oeffentlich(a) {
      const c = a.daten;
      return { id: c.id, nr: a.nr, stufe: c.stufe, titel: c.titel, aufgabe: c.aufgabe, alphabet: a.ref.alphabet, beispiele: c.beispiele, tippsAnzahl: a.tipps.length };
    },
    /** antwort: { automat } im Engine-Format (wie DfaEditor.toJSON). */
    pruefe(a, antwort) {
      return pruefeBaukasten(a.daten.referenz, antwort && antwort.automat);
    },
    loesungsteil(a) {
      return { musterloesung: a.daten.referenz };
    },
    abzeichen({ a, ersterVersuch, zeilen, katalog }) {
      const neu = ['baukasten-erster'];
      const geloest = new Set(zeilen.filter((z) => z.status === 'geloest' || z.nachgeloest).map((z) => z.aufgabe_id));
      for (const s of [1, 2, 3]) {
        const ids = katalog.filter((x) => x.modul === 'baukasten' && x.daten.stufe === s).map((x) => x.id);
        if (ids.every((id) => geloest.has(id))) neu.push(`baukasten-stufe-${s}`);
      }
      if (a.daten.stufe === 3 && ersterVersuch) neu.push('baukasten-volltreffer');
      return neu;
    }
  };
  baukasten.BAUKASTEN_CHALLENGES.forEach((c, i) => {
    liste.push({ id: `baukasten:${c.id}`, typ: BAUKASTEN, modul: 'baukasten', nr: i + 1, titel: c.titel, stufe: c.stufe, punkte: PUNKTE_STUFE[c.stufe], levels: c.stufe === 3 ? [4, 12] : [3, 4], daten: c, ref: normalizeDFA(c.referenz), tipps: c.tipp ? [c.tipp] : [] });
  });

  /* ---------- Minimierer: Markierungsverfahren Runde für Runde (Stand auf dem Server) ---------- */
  const MINIMIERER = {
    modul: 'minimierer',
    oeffentlich(a) {
      const x = a.daten;
      return { id: x.id, nr: a.nr, stufe: x.stufe, titel: x.titel, kontext: x.kontext, frage: x.frage, automat: x.automat };
    },
    /** antwort: { runde, markiert: ["p|q", …] } – Runde 0 beginnt neu; der Stand liegt in fortschritt.daten. */
    pruefe(a, antwort, z) {
      const erg = pruefeMinimiererRunde(a.daten.automat, z.daten.stand, antwort);
      return { ...erg, daten: { stand: erg.stand } };
    },
    loesungsteil(a) {
      return minimiererLoesung(a.daten.automat, a.daten.merke);
    },
    abzeichen({ alleGeloest }) {
      return ['minimierer-erste', ...(alleGeloest ? ['minimierer-alle'] : [])];
    }
  };
  minimierer.MINIMIERER_AUFGABEN.forEach((x, i) => {
    dfa(x.automat);
    liste.push({ id: `minimierer:${x.id}`, typ: MINIMIERER, modul: 'minimierer', nr: i + 1, titel: x.titel, stufe: x.stufe, punkte: PUNKTE_STUFE[x.stufe], levels: [5], daten: x, tipps: [] });
  });

  const map = new Map(liste.map((a) => [a.id, a]));
  return { liste, map, module: new Set(liste.map((a) => a.modul)), STUFEN: baukasten.STUFEN, abzeichen: new Map(badgesM.BADGES.map((b) => [b.id, b])) };
}

module.exports = { ladeAufgaben, PUNKTE_STUFE };
