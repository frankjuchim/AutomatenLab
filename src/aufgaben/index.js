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
  const [quiz, detektiv, baukasten, minimierer, mealyD, dfaM, pruefer, badgesM, arenaD, trainingM, ueberlisteD, pwD, kellerD, rallyeD, grammatikD, turingC, turingP] = await Promise.all([
    lade(path.join(INHALTE, 'quiz.js')),
    lade(path.join(INHALTE, 'detektiv.js')),
    lade(path.join(INHALTE, 'baukasten.js')),
    lade(path.join(INHALTE, 'minimierer.js')),
    lade(path.join(INHALTE, 'mealy.js')),
    lade(path.join(ENGINE, 'dfa.js')),
    lade(path.join(ENGINE, 'pruefer.js')),
    lade(path.join(__dirname, '..', '..', 'app', 'js', 'data', 'badges.js')),
    lade(path.join(__dirname, '..', '..', 'app', 'js', 'data', 'arena.js')),
    lade(path.join(ENGINE, 'training.js')),
    lade(path.join(INHALTE, 'ueberliste.js')),
    lade(path.join(INHALTE, 'parallelwelten.js')),
    lade(path.join(INHALTE, 'keller.js')),
    lade(path.join(INHALTE, 'rallye.js')),
    lade(path.join(INHALTE, 'grammatik.js')),
    lade(path.join(INHALTE, 'turing.js')),
    lade(path.join(__dirname, '..', '..', 'app', 'js', 'data', 'turing.js'))
  ]);
  const { dfa, normalizeDFA } = dfaM;
  const { pruefeQuizFrage, pruefeDetektiv, pruefeBaukasten, pruefeMinimiererRunde, minimiererLoesung, pruefeMealyVorhersage, pruefeMealyTest, pruefeMealyReparatur, mealyLoesung, mealyFehlerVariante, pruefeUeberliste, ueberlisteBeispiel, pruefeNeaRaetsel, pruefeTeilmengenZeile, teilmengenLoesung, kellerFolge, pruefeKellerTabelle, kellerTabellenLoesung, pruefeKellerRueckwaerts, kellerRueckwaertsLoesung, pruefeRallye, rallyeLoesung, pruefeGrammatikChallenge, pruefeTuringRegel, turingOhneRegel } = pruefer;
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

  /* ---------- Mealy-Maschine: „Was kommt raus?“ (wie ein Quiz) und Bug-Jagd (Reparatur gegen die Referenz) ---------- */
  const MEALY_V = {
    modul: 'mealy',
    oeffentlich(a) {
      const x = a.daten;
      return { id: x.id, nr: a.nr, titel: x.titel, kontext: x.kontext, automat: x.automat, bedeutung: x.bedeutung ?? null, beispiele: x.beispiele, worte: x.vorhersage };
    },
    /** antwort: { wort: Index, ausgabe } – gewertet wird der erste Versuch je Wort. */
    pruefe(a, antwort, z) {
      const erg = pruefeMealyVorhersage(a.daten.automat, a.daten.vorhersage, z.daten.stand, antwort);
      return { ok: erg.richtig, fertig: z.offen && erg.fertig, zaehltFehler: false, anteil: z.offen && erg.fertig ? erg.anteil : undefined, daten: z.offen ? { stand: erg.stand } : undefined, rueckmeldung: erg.rueckmeldung };
    },
    loesungsteil(a, z) {
      const st = z.daten.stand ?? {};
      const summe = Object.values(st.antworten ?? {}).reduce((s, x) => s + x, 0);
      return { ergebnis: { ersterVersuch: summe, von: a.daten.vorhersage.length } };
    },
    abzeichen({ anteil }) {
      return anteil === 1 ? ['mealy-hellseher'] : [];
    }
  };
  const MEALY_BUG = {
    modul: 'mealy',
    oeffentlich(a) {
      const x = a.daten;
      return { id: x.id, nr: a.nr, stufe: x.stufe, titel: x.titel, kontext: x.kontext, fehlerText: x.fehlerText, automat: a.fehlerhaft, bedeutung: x.bedeutung ?? null, beispiele: a.okBeispiele, worte: x.vorhersage };
    },
    /** antwort: { test, urteil: 'bug' | 'stimmt' } (Schritt 1, ohne Wertung) oder { ausgaben: { S0: { M: 'B' } } } (Reparatur). */
    pruefe(a, antwort, z) {
      if (antwort && antwort.test !== undefined) {
        const erg = pruefeMealyTest(a.daten.automat, a.fehlerhaft, antwort);
        const gefunden = !!z.daten.gefunden || (erg.bug && antwort.urteil === 'bug');
        return { ok: false, fertig: false, zaehltFehler: false, daten: { ...z.daten, gefunden }, rueckmeldung: { ...erg.rueckmeldung, gefunden } };
      }
      const erg = pruefeMealyReparatur(a.daten.automat, a.fehlerhaft, antwort && antwort.ausgaben);
      return { ...erg, rueckmeldung: { ...erg.rueckmeldung, gefunden: !!z.daten.gefunden } };
    },
    loesungsteil(a) {
      return mealyLoesung(a.daten.automat, a.daten.fehler);
    },
    abzeichen({ zeilen, katalog }) {
      const geloest = new Set(zeilen.filter((r) => r.status === 'geloest' || r.nachgeloest).map((r) => r.aufgabe_id));
      const bugs = katalog.filter((x) => x.typ === MEALY_BUG).map((x) => x.id);
      return ['mealy-bugjaeger', ...(bugs.every((id) => geloest.has(id)) ? ['mealy-alle-bugs'] : [])];
    }
  };
  mealyD.MEALY_AUFGABEN.forEach((x, i) => {
    const fehlerhaft = mealyFehlerVariante(x.automat, x.fehler);
    const okBeispiele = x.beispiele.filter(([ein]) => pruefeMealyTest(x.automat, fehlerhaft, { test: ein, urteil: 'stimmt' }).bug === false).slice(0, 3);
    liste.push({ id: `mealy:${x.id}:vorhersage`, typ: MEALY_V, modul: 'mealy', nr: i + 1, titel: `${x.titel}: Was kommt raus?`, stufe: 1, punkte: PUNKTE_STUFE[1], levels: [6], daten: x, tipps: [] });
    liste.push({ id: `mealy:${x.id}`, typ: MEALY_BUG, modul: 'mealy', nr: i + 1, titel: `${x.titel}: Bug-Jagd`, stufe: x.stufe, punkte: PUNKTE_STUFE[x.stufe], levels: [6], daten: x, fehlerhaft, okBeispiele, tipps: [] });
  });

  /* ---------- Überliste den Automaten: Wort finden, bei dem der (sichtbare) Automat irrt; Bonus wie ein Quiz ---------- */
  const UEBERLISTE = {
    modul: 'ueberliste',
    oeffentlich(a) {
      const x = a.daten;
      return { id: x.id, nr: a.nr, stufe: x.stufe, titel: x.titel, kontext: x.kontext, sprache: x.sprache, automat: a.automat, praefix: x.praefix, fortsetzung: x.fortsetzung, tippsAnzahl: a.tipps.length };
    },
    /** antwort: { wort } – Testen ist erlaubt und kostet nichts; gelöst, sobald der Automat irrt. */
    pruefe(a, antwort) {
      return pruefeUeberliste(a.automat, a.daten.pruefe, antwort);
    },
    loesungsteil(a) {
      return { beispiel: ueberlisteBeispiel(a.automat, a.daten.pruefe, a.daten.praefix, a.daten.fortsetzung) };
    },
    abzeichen({ a, zeilen, katalog }) {
      const neu = ['ueberliste-erster'];
      const z = zeilen.find((r) => r.aufgabe_id === a.id);
      if (z && z.tipps === 0 && a.nr >= 3 && z.status === 'geloest') neu.push('ueberliste-ohne-tipp');
      const geloest = new Set(zeilen.filter((r) => r.status === 'geloest' || r.nachgeloest).map((r) => r.aufgabe_id));
      if (katalog.filter((x) => x.typ === UEBERLISTE).every((x) => geloest.has(x.id))) neu.push('ueberliste-alle');
      return neu;
    }
  };
  ueberlisteD.UEBERLISTE_STUFEN.forEach((x, i) => {
    const automat = ueberlisteD.bauAutomat(x);
    dfa(automat);
    liste.push({ id: `ueberliste:${x.id}`, typ: UEBERLISTE, modul: 'ueberliste', nr: i + 1, titel: x.titel, stufe: x.stufe, punkte: PUNKTE_STUFE[x.stufe], levels: [7], daten: x, automat, tipps: x.tipps });
  });
  const BONUS = { ...QUIZ, modul: 'ueberliste', abzeichen: () => [] };
  liste.push({ id: 'ueberliste:bonus', typ: BONUS, modul: 'ueberliste', nr: ueberlisteD.UEBERLISTE_STUFEN.length + 1, titel: 'Bonus: Warum hilft ein Zustand mehr nicht?', art: 'bonus', stufe: 2, punkte: PUNKTE_STUFE[2], levels: [7],
    daten: { titel: 'Bonus: Warum hilft ein Zustand mehr nicht?', fragen: ueberlisteD.UEBERLISTE_BONUS.map((q) => ({ typ: 'mc', frage: q.frage, optionen: q.optionen })) }, tipps: [] });

  /* ---------- Parallelwelten: „Wo stehen die Figuren?“ (wie ein Quiz) und Teilmengenkonstruktion (Zeile für Zeile) ---------- */
  const pwOeffentlich = (a) => {
    const x = a.daten;
    return { id: x.id, nr: a.nr, titel: x.titel, kontext: x.kontext, automat: x.automat, beispiele: x.beispiele, worte: x.raetsel, teilmengen: !!x.teilmengen };
  };
  const PW_RAETSEL = {
    modul: 'parallelwelten',
    oeffentlich: pwOeffentlich,
    /** antwort: { wort: Index, zustaende: [...] } – gewertet wird der erste Versuch je Wort. */
    pruefe(a, antwort, z) {
      const erg = pruefeNeaRaetsel(a.daten.automat, a.daten.raetsel, z.daten.stand, antwort);
      return { ok: erg.richtig, fertig: z.offen && erg.fertig, zaehltFehler: false, anteil: z.offen && erg.fertig ? erg.anteil : undefined, daten: z.offen ? { stand: erg.stand } : undefined, rueckmeldung: erg.rueckmeldung };
    },
    loesungsteil(a, z) {
      const st = z.daten.stand ?? {};
      return { ergebnis: { ersterVersuch: Object.values(st.antworten ?? {}).reduce((s, x) => s + x, 0), von: a.daten.raetsel.length } };
    },
    abzeichen({ zeilen }) {
      let richtig = 0;
      for (const r of zeilen) if (r.aufgabe_id.endsWith(':raetsel')) { try { richtig += Object.values(JSON.parse(r.daten).stand?.antworten ?? {}).reduce((s, x) => s + x, 0); } catch { /* leer */ } }
      return richtig >= 5 ? ['parallelwelten-figuren'] : [];
    }
  };
  const PW_TEILMENGEN = {
    modul: 'parallelwelten',
    oeffentlich: pwOeffentlich,
    /** antwort: { menge: [...], ziele: { a: [...] } } – eine Zeile; falsche Zeile = Fehlversuch. */
    pruefe(a, antwort, z) {
      const erg = pruefeTeilmengenZeile(a.daten.automat, z.daten.stand, antwort);
      return { ...erg, daten: { stand: erg.stand } };
    },
    loesungsteil(a) {
      return teilmengenLoesung(a.daten.automat);
    },
    abzeichen({ erg }) {
      return erg && erg.ok ? ['parallelwelten-teilmengen'] : [];
    }
  };
  pwD.PARALLELWELTEN.forEach((x, i) => {
    liste.push({ id: `parallelwelten:${x.id}:raetsel`, typ: PW_RAETSEL, modul: 'parallelwelten', nr: i + 1, titel: `${x.titel}: Wo stehen die Figuren?`, art: 'raetsel', stufe: 1, punkte: PUNKTE_STUFE[1], levels: [8], daten: x, tipps: [] });
    if (x.teilmengen) liste.push({ id: `parallelwelten:${x.id}`, typ: PW_TEILMENGEN, modul: 'parallelwelten', nr: i + 1, titel: `${x.titel}: Teilmengenkonstruktion`, art: 'teilmengen', stufe: 2, punkte: PUNKTE_STUFE[2], levels: [8], daten: x, tipps: [] });
  });

  /* ---------- Keller-Labor: Tabellen-Trainer (je Automat alle Wörter) und Rückwärts (Wort aus der Folge) ---------- */
  const kellerOeffentlich = (a) => {
    const x = a.daten;
    return { id: x.id, nr: a.nr, titel: x.titel, kontext: x.kontext, automat: x.automat, beispiele: x.beispiele, keller: x.keller, sim: x.sim, worte: x.tabelle };
  };
  const KELLER_TABELLE = {
    modul: 'keller',
    oeffentlich: kellerOeffentlich,
    /** antwort: { wort: Index, zeilen, akzeptiert } – vollständige Tabelle; falsch = Fehlversuch. */
    pruefe(a, antwort, z) {
      const erg = pruefeKellerTabelle(a.daten.automat, a.daten.tabelle, z.daten.stand, antwort);
      return { ...erg, daten: { stand: erg.stand } };
    },
    loesungsteil(a) {
      return kellerTabellenLoesung(a.daten.automat, a.daten.tabelle);
    },
    abzeichen({ zeilen }) {
      const n = zeilen.filter((r) => r.aufgabe_id.startsWith('keller:') && (r.status === 'geloest' || r.nachgeloest)).length;
      return ['keller-tabelle', ...(n >= 10 ? ['keller-profi'] : [])];
    }
  };
  const KELLER_RUECKWAERTS = {
    modul: 'keller',
    // ohne Beispiele und Simulator-Wörter: dort kann das gesuchte Wort stehen
    oeffentlich: (a) => { const { beispiele, sim, ...rest } = kellerOeffentlich(a); return { ...rest, folge: a.folge }; },
    /** antwort: { wort } – passt es zur Folge der Konfigurationen? */
    pruefe(a, antwort) {
      return pruefeKellerRueckwaerts(a.daten.automat, a.folge, antwort);
    },
    loesungsteil(a) {
      return kellerRueckwaertsLoesung(a.daten.automat, a.daten.rueckwaerts[0]);
    },
    abzeichen({ zeilen }) {
      const n = zeilen.filter((r) => r.aufgabe_id.startsWith('keller:') && (r.status === 'geloest' || r.nachgeloest)).length;
      return ['keller-rueckwaerts', ...(n >= 10 ? ['keller-profi'] : [])];
    }
  };
  kellerD.KELLER_AUTOMATEN.forEach((x, i) => {
    liste.push({ id: `keller:${x.id}:tabelle`, typ: KELLER_TABELLE, modul: 'keller', nr: i + 1, titel: `${x.titel}: Tabellen-Trainer`, art: 'tabelle', stufe: 1, punkte: PUNKTE_STUFE[1], levels: [9, 10], daten: x, tipps: [] });
    liste.push({ id: `keller:${x.id}:rueckwaerts`, typ: KELLER_RUECKWAERTS, modul: 'keller', nr: i + 1, titel: `${x.titel}: Rückwärts`, art: 'rueckwaerts', stufe: 2, punkte: PUNKTE_STUFE[2], levels: [9, 10], daten: x, folge: kellerFolge(x.automat, x.rueckwaerts[0]), tipps: [] });
  });

  /* ---------- Ableitungs-Rallye: Linksableitung bis zum Zielwort (Baum-Modus: zwei verschiedene Ableitungen) ---------- */
  const RALLYE = {
    modul: 'rallye',
    oeffentlich(a) {
      const x = a.daten;
      return { id: x.id, nr: a.nr, stufe: x.stufe, titel: x.titel, kontext: x.kontext, grammatik: x.grammatik, ziel: x.ziel, sep: x.sep ?? null, modus: x.modus ?? 'ableiten' };
    },
    /** antwort: { regeln: [[lhs, index], …] } bzw. { baeume: [regeln1, regeln2] } */
    pruefe(a, antwort) {
      return pruefeRallye(a.daten.grammatik, a.daten.ziel, a.daten.modus ?? 'ableiten', antwort);
    },
    loesungsteil(a) {
      return rallyeLoesung(a.daten.grammatik, a.daten.ziel, a.daten.sep ?? '');
    },
    abzeichen({ a, alleGeloest }) {
      return ['rallye-erste', ...((a.daten.modus === 'baum') ? ['rallye-mehrdeutig'] : []), ...(alleGeloest ? ['rallye-alle'] : [])];
    }
  };
  rallyeD.RALLYE_AUFGABEN.forEach((x, i) => {
    liste.push({ id: `rallye:${x.id}`, typ: RALLYE, modul: 'rallye', nr: i + 1, titel: x.titel, stufe: x.stufe, punkte: PUNKTE_STUFE[x.stufe], levels: [11, 13], daten: x, tipps: [] });
  });

  /* ---------- Grammatik-Tester: eigene Grammatik → Vergleich der Sprache bis maxLen (ggf. rechtsregulär) ---------- */
  const GRAMMATIK = {
    modul: 'grammatik',
    oeffentlich(a) {
      const x = a.daten;
      return { id: x.id, nr: a.nr, stufe: x.stufe, titel: x.titel, aufgabe: x.aufgabe, alphabet: x.alphabet, beispiele: x.beispiele, maxLen: x.maxLen ?? 8, regulaer: !!x.regulaer, tippsAnzahl: a.tipps.length };
    },
    /** antwort: { grammatik: Text, start? } */
    pruefe(a, antwort) {
      return pruefeGrammatikChallenge(a.daten, antwort);
    },
    loesungsteil(a) {
      return { musterloesung: a.daten.musterloesung };
    },
    abzeichen({ alleGeloest }) {
      return ['grammatik-erste', ...(alleGeloest ? ['grammatik-alle'] : [])];
    }
  };
  grammatikD.GRAMMATIK_CHALLENGES.forEach((x, i) => {
    liste.push({ id: `grammatik:${x.id}`, typ: GRAMMATIK, modul: 'grammatik', nr: i + 1, titel: x.titel, stufe: x.stufe, punkte: PUNKTE_STUFE[x.stufe], levels: [12, 13, 15], daten: x, tipps: x.tipp ? [x.tipp] : [] });
  });

  /* ---------- Turing-Labor: fehlende Regel ergänzen (Prüfung mit Testeingaben gegen die Referenz) ---------- */
  const TURING = {
    modul: 'turing',
    oeffentlich(a) {
      const x = a.daten; const p = a.programm;
      return { id: x.id, nr: a.nr, stufe: x.stufe, titel: x.titel, aufgabe: x.aufgabe, programm: x.programm, programmTitel: p.titel, kontext: p.kontext,
        maschine: turingOhneRegel(p.maschine, x.fehlt), fehlt: x.fehlt, zustaende: a.zustaende, bandalphabet: a.bandalphabet, tests: x.tests };
    },
    /** antwort: { to, write, move } */
    pruefe(a, antwort) {
      return pruefeTuringRegel(a.programm.maschine, a.daten.fehlt, a.daten.tests, antwort);
    },
    loesungsteil(a) {
      const [to, write, move] = a.programm.maschine.delta[a.daten.fehlt.from][a.daten.fehlt.read];
      return { regel: { to, write, move } };
    },
    abzeichen() {
      return ['turing-regel'];
    }
  };
  const { tm } = await lade(path.join(ENGINE, 'turing.js'));
  turingC.TURING_CHALLENGES.forEach((x, i) => {
    const programm = turingP.TURING_PROGRAMME.find((p) => p.id === x.programm);
    const T = tm(programm.maschine);
    liste.push({ id: `turing:${x.id}`, typ: TURING, modul: 'turing', nr: i + 1, titel: x.titel, stufe: x.stufe, punkte: PUNKTE_STUFE[x.stufe], levels: [16], daten: x, programm, zustaende: T.states, bandalphabet: T.tapeAlphabet, tipps: [] });
  });

  const map = new Map(liste.map((a) => [a.id, a]));

  // Training (src/training.js): Arena-Automaten (öffentlich) und Minimierer-Automaten für „Unterscheide!“
  const training = { T: trainingM, arena: arenaD.ARENA_AUTOMATEN, minimierer: minimierer.MINIMIERER_AUFGABEN.map((x) => ({ id: x.id, automat: x.automat })) };
  return { liste, map, module: new Set([...liste.map((a) => a.modul), 'arena']), STUFEN: baukasten.STUFEN, abzeichen: new Map(badgesM.BADGES.map((b) => [b.id, b])), training };
}

module.exports = { ladeAufgaben, PUNKTE_STUFE };
