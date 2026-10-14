// Prüffunktionen der Aufgabentypen – DOM-frei, ohne Lösungsdaten. Genutzt vom Server (echte Aufgaben, Lösungen in
// inhalte/) und im Browser nur für die Demo-Aufgaben des Gastmodus. So prüfen beide genau gleich.

import { dfa, runDFA, normalizeDFA, equivalent, minimizeDFA } from './dfa.js';
import * as MK from './markierung.js';
import { enumerateWords, wordToString } from './tokenize.js';

/**
 * Quizfrage bewerten. f = Frage im Datenformat (mc/wf/zuordnung, erste Option bzw. Begründung richtig),
 * antwort = { wahl } | { wahr, begruendung } | { zuordnung: [rechts je links] }, idVon(j) = Kennung der Option j.
 * Liefert { wert: 0 | 0.5 | 1, rueckmeldung } oder wirft einen Fehler mit deutscher Meldung (status 400).
 */
export function pruefeQuizFrage(f, antwort, idVon) {
  const ungueltig = (t) => Object.assign(new Error(t), { status: 400 });
  const rm = {};
  let wert = 0;
  if (f.typ === 'mc') {
    if (typeof antwort?.wahl !== 'string') throw ungueltig('Bitte wähle eine Antwort.');
    wert = antwort.wahl === idVon(0) ? 1 : 0;
    Object.assign(rm, { richtig: idVon(0), richtigText: f.optionen[0] });
  } else if (f.typ === 'wf') {
    if (typeof antwort?.wahr !== 'boolean' || typeof antwort?.begruendung !== 'string') throw ungueltig('Bitte entscheide und wähle eine Begründung.');
    wert = (antwort.wahr === f.wahr ? 0.5 : 0) + (antwort.begruendung === idVon(0) ? 0.5 : 0);
    Object.assign(rm, { wahr: f.wahr, richtig: idVon(0), richtigText: f.begruendungen[0] });
  } else {
    const z = antwort?.zuordnung;
    if (!Array.isArray(z) || z.length !== f.paare.length || z.some((x) => typeof x !== 'string' || !x)) throw ungueltig('Ordne erst alles zu.');
    const ok = f.paare.filter((p, k) => z[k] === p[1]).length;
    wert = ok === f.paare.length ? 1 : ok >= f.paare.length / 2 ? 0.5 : 0;
    Object.assign(rm, { loesung: f.paare.map((p) => p[1]), richtigeZuordnungen: ok });
  }
  rm.wert = wert;
  if (f.erklaerung) rm.erklaerung = f.erklaerung;
  return { wert, rueckmeldung: rm };
}

/** Kürzestes Wort, bei dem Automat A und das Prädikat pruefe verschieden urteilen (oder null). */
export function unterscheidendesWort(A, pruefe, maxLen = 8) {
  for (const w of enumerateWords(A.alphabet, maxLen)) if (runDFA(A, w).accepted !== !!pruefe(w)) return w;
  return null;
}

/** Sprach-Detektiv: gewählte Option j (0 = richtig) → Rückmeldung mit Gegenbeispiel. */
export function pruefeDetektiv(fall, j) {
  if (j === 0) return { ok: true, rueckmeldung: { richtig: true } };
  const A = dfa(fall.automat);
  const w = unterscheidendesWort(A, fall.optionen[j].pruefe);
  return { ok: false, rueckmeldung: { richtig: false, gegenbeispiel: w ? { wort: wordToString(w, A.alphabet), symbole: w, akzeptiert: runDFA(A, w).accepted } : null } };
}

/** Baukasten: eingereichter DEA gegen die Referenz (Vergleich der Sprache, kürzestes Gegenbeispiel). */
export function pruefeBaukasten(referenz, automat) {
  const ungueltig = (t) => Object.assign(new Error(t), { status: 400 });
  const ref = normalizeDFA(referenz);
  let A;
  try {
    if (!automat || typeof automat !== 'object' || JSON.stringify(automat).length > 20000) throw new Error('Automat fehlt.');
    A = normalizeDFA(automat);
  } catch (e) {
    throw ungueltig(`Der Automat ist nicht lesbar: ${e.message}`);
  }
  if (A.states.length > 40) throw ungueltig('Der Automat hat zu viele Zustände (höchstens 40).');
  if (A.alphabet.some((s) => !ref.alphabet.includes(s))) throw ungueltig(`Das Eingabealphabet passt nicht zur Aufgabe (Σ = {${ref.alphabet.join(', ')}}).`);
  const r = equivalent(A, ref);
  if (r.equivalent) return { ok: true, rueckmeldung: { richtig: true, zustaende: A.states.length } };
  return { ok: false, rueckmeldung: { richtig: false, gegenbeispiel: { wort: wordToString(r.counterexample, A.alphabet), symbole: r.counterexample, akzeptiertVonDir: r.acceptedByA } } };
}

/**
 * Minimierer: eine Runde des Markierungsverfahrens prüfen.
 * stand = { runde, bestaetigt: { "p|q": Runde }, versuche, fertig } (gespeichert vom Server bzw. von der Demo-Quelle),
 * antwort = { runde, markiert: ["p|q", …] } – die in dieser Runde neu markierten Paare. Runde 0 beginnt neu.
 * Liefert { ok (= Verfahren beendet), fertig, zaehltFehler, stand, rueckmeldung } oder wirft (400; 409 = Stand passt nicht).
 */
export function pruefeMinimiererRunde(automat, stand0, antwort) {
  const ungueltig = (t, status = 400) => Object.assign(new Error(t), { status });
  const runde = antwort?.runde;
  if (!Number.isInteger(runde) || runde < 0) throw ungueltig('Die Runde fehlt.');
  if (!Array.isArray(antwort.markiert) || antwort.markiert.length > 500) throw ungueltig('Die Markierungen fehlen.');
  const T = MK.markierungsTabelle(dfa(automat));
  const stand = runde === 0 ? { runde: 0, bestaetigt: {}, versuche: 0, fertig: false }
    : { runde: stand0?.runde ?? 0, bestaetigt: { ...(stand0?.bestaetigt ?? {}) }, versuche: stand0?.versuche ?? 0, fertig: !!stand0?.fertig };
  if (stand.fertig || runde !== stand.runde) throw ungueltig('Der Stand passt nicht mehr zu dieser Aufgabe – bitte beginne neu.', 409);
  const markiert = new Set();
  for (const k of antwort.markiert) {
    const [p, q] = typeof k === 'string' ? k.split('|') : [];
    if (!p || !q || p === q || !T.states.includes(p) || !T.states.includes(q)) throw ungueltig('Unbekanntes Zustandspaar.');
    const key = T.key(p, q);
    if (!(key in stand.bestaetigt)) markiert.add(key);
  }
  const r = MK.pruefeRunde(T, new Set(Object.keys(stand.bestaetigt)), markiert, runde);
  stand.versuche++;
  if (r.ok) {
    for (const k of markiert) stand.bestaetigt[k] = runde;
    stand.fertig = r.fertig || Object.keys(stand.bestaetigt).length === T.pairs.length;
    stand.runde = runde + 1;
    stand.versuche = 0;
  }
  return {
    ok: stand.fertig, fertig: stand.fertig, zaehltFehler: !r.ok, stand,
    rueckmeldung: { runde, richtig: r.ok, fertig: stand.fertig, naechsteRunde: stand.runde, bestaetigt: stand.bestaetigt, neu: r.ok ? markiert.size : 0,
      vorgezogen: r.ok ? r.vorgezogen.length : 0, falsch: r.ok ? [] : r.falsch, fehlendAnzahl: r.ok ? 0 : r.fehlend.length,
      fehlend: !r.ok && stand.versuche >= 2 ? r.fehlend : [] },
  };
}

/** Minimierer: Lösungsteil – vollständige Markierung, Klassen, zusammengefasster Automat (Fehlerzustand wieder implizit). */
export function minimiererLoesung(automat, merke) {
  const A = dfa(automat);
  const T = MK.markierungsTabelle(A);
  const m = minimizeDFA(A, { mergedName: (c) => c.join('/') });
  let M = m.dfa;
  const err = m.addedErrorState;
  if (err && M.states.includes(err)) {
    const delta = {};
    for (const s of M.states) if (s !== err) { delta[s] = {}; for (const c of M.alphabet) if (M.delta[s][c] !== err) delta[s][c] = M.delta[s][c]; }
    M = { ...M, states: M.states.filter((s) => s !== err), delta, implicitError: true };
  }
  return { klassen: m.classes.filter((c) => c.length > 1), vorher: T.states.length, nachher: m.dfa.states.length, mitFehlerzustand: !!err,
    automat: M, markierung: Object.fromEntries(MK.loesung(T).marked), merke: merke ?? null };
}
