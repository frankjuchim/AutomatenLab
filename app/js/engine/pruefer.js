// Prüffunktionen der Aufgabentypen – DOM-frei, ohne Lösungsdaten. Genutzt vom Server (echte Aufgaben, Lösungen in
// inhalte/) und im Browser nur für die Demo-Aufgaben des Gastmodus. So prüfen beide genau gleich.

import { dfa, runDFA, normalizeDFA, equivalent, minimizeDFA } from './dfa.js';
import * as MK from './markierung.js';
import { mealy, runMealy, mealyEquivalent } from './mealy.js';
import { tokenize as tokenizeWort, isEpsilon } from './tokenize.js';
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

/* ───────────── Mealy-Maschine ───────────── */

const ungueltig400 = (t) => Object.assign(new Error(t), { status: 400 });

/** Mealy-Automat (normalisiert) zurück ins Datenformat { delta: { S0: { M: ['S1', 'ε'] } } } – JSON-sicher. */
export function mealySpec(M) {
  const delta = {};
  for (const s of M.states) { delta[s] = {}; for (const c of M.inputAlphabet) { const t = M.delta[s]?.[c]; if (t) delta[s][c] = [t.to, t.out === '' ? 'ε' : t.out]; } }
  return { inputAlphabet: M.inputAlphabet, outputAlphabet: M.outputAlphabet, states: M.states, start: M.start, delta };
}

/** Bug-Jagd: fehlerhafte Variante der Referenz (Liste { von, zeichen, ausgabe }) im Datenformat. */
export function mealyFehlerVariante(automat, fehler) {
  const F = mealy(automat);
  for (const f of fehler) F.delta[f.von][f.zeichen] = { ...F.delta[f.von][f.zeichen], out: f.ausgabe === 'ε' ? '' : f.ausgabe };
  return mealySpec(F);
}

/** Ausgabe-Eingabe lesen: Leerzeichen egal, ε/leer = leere Ausgabe, sonst Wort über Ω. → { ok, text } | { ok: false, message } */
export function leseMealyAusgabe(raw, outputAlphabet) {
  const t = String(raw ?? '').replace(/\s+/g, '');
  if (isEpsilon(t)) return { ok: true, text: '' };
  const tk = tokenizeWort(t, outputAlphabet);
  if (!tk.ok) return { ok: false, message: tk.message.replace('Eingabealphabet Σ', 'Ausgabealphabet Ω') };
  return { ok: true, text: tk.tokens.join('') };
}

/**
 * „Was kommt raus?“: Ausgabe zu Wort Nr. i vorhersagen. Gewertet wird der erste Versuch je Wort (wie beim Quiz);
 * nach dem zweiten falschen Versuch erscheint die richtige Ausgabe. stand = { antworten: { i: 0|1 }, versuche: { i: n } }.
 */
export function pruefeMealyVorhersage(automat, worte, stand0, antwort) {
  const i = Number.isInteger(antwort?.wort) ? antwort.wort : -1;
  if (!worte[i] && worte[i] !== '') throw ungueltig400('Dieses Wort gibt es nicht.');
  const M = mealy(automat);
  const r = leseMealyAusgabe(antwort.ausgabe, M.outputAlphabet);
  if (!r.ok) throw ungueltig400(r.message);
  const soll = runMealy(M, worte[i]).output;
  const richtig = r.text === soll;
  const stand = { antworten: { ...(stand0?.antworten ?? {}) }, versuche: { ...(stand0?.versuche ?? {}) } };
  const k = String(i);
  if (!(k in stand.antworten)) stand.antworten[k] = richtig ? 1 : 0;
  stand.versuche[k] = (stand.versuche[k] ?? 0) + 1;
  const zeigen = richtig || stand.versuche[k] >= 2;
  const fertig = Object.keys(stand.antworten).length === worte.length && worte.every((_, j) => stand.antworten[j] === 1 || (stand.versuche[j] ?? 0) >= 2);
  const summe = Object.values(stand.antworten).reduce((a, b) => a + b, 0);
  return { richtig, fertig, anteil: summe / worte.length, stand,
    rueckmeldung: { wort: i, richtig, versuche: stand.versuche[k], ...(zeigen ? { ausgabe: soll } : {}), fertig, ersterVersuch: summe, von: worte.length } };
}

/** Bug-Jagd: Arbeitsstand = fehlerhafter Automat mit den (teilweise) reparierten Ausgaben { S0: { M: 'B' } }. */
function mealyArbeit(fehlerhaft, outputAlphabet, ausgaben) {
  const W = mealy(fehlerhaft);
  if (ausgaben === undefined || ausgaben === null) return W;
  if (typeof ausgaben !== 'object' || JSON.stringify(ausgaben).length > 20000) throw ungueltig400('Die Ausgaben fehlen.');
  for (const s of W.states) for (const c of W.inputAlphabet) {
    if (!W.delta[s][c]) continue;
    const raw = ausgaben[s]?.[c];
    if (raw === undefined) continue;
    const r = leseMealyAusgabe(raw, outputAlphabet);
    if (!r.ok) throw ungueltig400(`Ausgabe bei ${s} mit ${c}: ${r.message}`);
    W.delta[s][c] = { ...W.delta[s][c], out: r.text };
  }
  return W;
}

/**
 * Bug-Jagd Schritt 1: Eingabewort am Arbeitsstand testen und urteilen („bug“ oder „stimmt“). Ohne Wertung; die
 * richtige Ausgabe kommt erst mit dem Urteil zurück. antwort = { test, urteil, ausgaben? }.
 */
export function pruefeMealyTest(referenz, fehlerhaft, antwort) {
  const R = mealy(referenz);
  if (typeof antwort?.test !== 'string' || antwort.test.length > 60) throw ungueltig400('Bitte gib ein Eingabewort ein.');
  if (!['bug', 'stimmt'].includes(antwort.urteil)) throw ungueltig400('Bitte urteile: Bug oder richtig?');
  const tk = tokenizeWort(antwort.test, R.inputAlphabet);
  if (!tk.ok) throw ungueltig400(tk.message);
  const W = mealyArbeit(fehlerhaft, R.outputAlphabet, antwort.ausgaben);
  const ist = runMealy(W, tk.tokens).output; const soll = runMealy(R, tk.tokens).output;
  const bug = ist !== soll;
  return { bug, rueckmeldung: { test: tk.tokens, ausgabe: ist, richtigeAusgabe: soll, bug, urteilRichtig: bug === (antwort.urteil === 'bug') } };
}

/** Bug-Jagd Schritt 2: reparierte Ausgaben { S0: { M: 'B' } } gegen die Referenz (kürzestes Gegenbeispiel). */
export function pruefeMealyReparatur(referenz, fehlerhaft, ausgaben) {
  const R = mealy(referenz);
  if (!ausgaben || typeof ausgaben !== 'object') throw ungueltig400('Die Ausgaben fehlen.');
  const W = mealyArbeit(fehlerhaft, R.outputAlphabet, ausgaben);
  const d = mealyEquivalent(W, R);
  if (d.equivalent) return { ok: true, rueckmeldung: { richtig: true } };
  return { ok: false, rueckmeldung: { richtig: false, gegenbeispiel: { wort: d.word, deine: d.outA, richtig: d.outB } } };
}

/** Bug-Jagd: Lösungsteil – die falschen Kanten mit richtiger Ausgabe. */
export function mealyLoesung(referenz, fehler) {
  const R = mealy(referenz);
  return { fehler: fehler.map((f) => ({ von: f.von, zeichen: f.zeichen, falsch: f.ausgabe, richtig: R.delta[f.von][f.zeichen].out === '' ? 'ε' : R.delta[f.von][f.zeichen].out })) };
}

/* ───────────── Überliste den Automaten ───────────── */

/** Testwort dem (sichtbaren) Automaten vorlegen und mit der Wahrheit (Prädikat) vergleichen. ok = überlistet. */
export function pruefeUeberliste(automat, pruefe, antwort) {
  const A = dfa(automat);
  const tk = tokenizeWort(antwort?.wort ?? '', A.alphabet);
  if (!tk.ok) throw ungueltig400(tk.message);
  if (tk.tokens.length > 200) throw ungueltig400('Das Wort ist zu lang (höchstens 200 Zeichen).');
  const akzeptiert = runDFA(A, tk.tokens).accepted;
  const gehoertDazu = !!pruefe(tk.tokens);
  const ueberlistet = akzeptiert !== gehoertDazu;
  return { ok: ueberlistet, zaehltFehler: false, rueckmeldung: { wort: tk.tokens, akzeptiert, gehoertDazu, ueberlistet } };
}

/** Lösungsteil: ein Wort, bei dem sich der Automat irrt (Form präfixⁿ fortsetzungᵐ, kürzestes zuerst). */
export function ueberlisteBeispiel(automat, pruefe, praefix, fortsetzung) {
  const A = dfa(automat);
  for (let laenge = 1; laenge <= 2 * A.states.length + 6; laenge++) {
    for (let n = laenge; n >= 0; n--) {
      const w = [...Array(n).fill(praefix), ...Array(laenge - n).fill(fortsetzung)];
      if (runDFA(A, w).accepted !== !!pruefe(w)) return w;
    }
  }
  return null;
}
