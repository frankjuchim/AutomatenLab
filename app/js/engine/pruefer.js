// Prüffunktionen der Aufgabentypen – DOM-frei, ohne Lösungsdaten. Genutzt vom Server (echte Aufgaben, Lösungen in
// inhalte/) und im Browser nur für die Demo-Aufgaben des Gastmodus. So prüfen beide genau gleich.

import { dfa, runDFA, normalizeDFA, equivalent, minimizeDFA } from './dfa.js';
import * as MK from './markierung.js';
import { mealy, runMealy, mealyEquivalent } from './mealy.js';
import { tokenize as tokenizeWort, isEpsilon } from './tokenize.js';
import { nfa, runNFA, epsilonClosure, subsetConstruction } from './nfa.js';
import { pda, runPDA, successors, initialConfig, runToTable, matchesConfigSequence } from './pda.js';
import { parseGrammar, derive, symbolsToString, tokenizeWord, languageUpTo, isRightRegular } from './grammar.js';
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

/* ───────────── Parallelwelten (NEA) ───────────── */

/** Zustandsmenge aus der Antwort lesen: nur Zustände des NEA, in Zustandsreihenfolge. */
function leseMenge(N, liste) {
  if (!Array.isArray(liste) || liste.some((x) => typeof x !== 'string' || !N.states.includes(x))) throw ungueltig400('Unbekannter Zustand.');
  return N.states.filter((x) => liste.includes(x));
}
const gleicheMenge = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

/**
 * „Wo stehen die Figuren?“: Menge aktiver Zustände nach Wort Nr. i. Gewertet wird der erste Versuch je Wort; nach dem
 * zweiten Versuch werden fehlende Zustände genannt, nach dem dritten die Lösung. stand = { antworten, versuche }.
 */
export function pruefeNeaRaetsel(automat, worte, stand0, antwort) {
  const i = Number.isInteger(antwort?.wort) ? antwort.wort : -1;
  if (typeof worte[i] !== 'string') throw ungueltig400('Dieses Rätsel gibt es nicht.');
  const N = nfa(automat);
  const mine = leseMenge(N, antwort.zustaende);
  const soll = runNFA(N, worte[i] === 'ε' ? '' : worte[i]).sets.at(-1);
  const richtig = gleicheMenge(mine, soll);
  const stand = { antworten: { ...(stand0?.antworten ?? {}) }, versuche: { ...(stand0?.versuche ?? {}) }, erledigt: { ...(stand0?.erledigt ?? {}) } };
  const k = String(i);
  if (!(k in stand.antworten)) stand.antworten[k] = richtig ? 1 : 0;
  stand.versuche[k] = (stand.versuche[k] ?? 0) + 1;
  const v = stand.versuche[k];
  if (richtig || v >= 3) stand.erledigt[k] = true;
  const fertig = worte.every((_, j) => stand.erledigt[j]);
  const summe = Object.values(stand.antworten).reduce((a, b) => a + b, 0);
  const fehlend = soll.filter((x) => !mine.includes(x));
  return { richtig, fertig, anteil: summe / worte.length, stand,
    rueckmeldung: { wort: i, richtig, versuche: v, zuViel: mine.filter((x) => !soll.includes(x)), fehlendAnzahl: fehlend.length,
      ...(v >= 2 && !richtig ? { fehlend } : {}), ...(richtig || v >= 3 ? { loesung: soll, akzeptiert: soll.some((x) => N.accepting.includes(x)) } : {}),
      fertig, ersterVersuch: summe, von: worte.length } };
}

/**
 * Teilmengenkonstruktion Zeile für Zeile: antwort = { menge: [...], ziele: { a: [...] } } – eine Zeile der Tabelle.
 * stand = { fertig: ["S0,S1", …] } (richtig ausgefüllte Zeilen). Falsche Zeile = Fehlversuch.
 */
export function pruefeTeilmengenZeile(automat, stand0, antwort) {
  const N = nfa(automat);
  const { table } = subsetConstruction(N);
  const menge = leseMenge(N, antwort?.menge);
  const zeile = table.find((r) => gleicheMenge(r.set, menge));
  if (!zeile) throw ungueltig400('Diese Zustandsmenge kommt in der Teilmengenkonstruktion nicht vor.');
  const falsch = [];
  for (const a of N.alphabet) if (!gleicheMenge(leseMenge(N, antwort.ziele?.[a] ?? []), zeile.targets[a])) falsch.push(a);
  const stand = { fertig: [...new Set(stand0?.fertig ?? [])] };
  const key = menge.join(',');
  if (!falsch.length && !stand.fertig.includes(key)) stand.fertig.push(key);
  const alle = table.every((r) => stand.fertig.includes(r.set.join(',')));
  return { ok: !falsch.length && alle, fertig: !falsch.length && alle, zaehltFehler: falsch.length > 0, stand,
    rueckmeldung: { richtig: !falsch.length, falsch, ...(falsch.length ? { gelesen: Object.fromEntries(falsch.map((a) => [a, [...new Set(menge.flatMap((x) => N.delta[x]?.[a] ?? []))]])) } : {}), erledigt: stand.fertig.length, von: table.length, fertig: alle } };
}

/** Teilmengenkonstruktion: Lösungsteil – alle Zeilen und der DEA. */
export function teilmengenLoesung(automat) {
  const N = nfa(automat);
  const { table, dfa: D } = subsetConstruction(N);
  return { zeilen: table.map((r) => ({ menge: r.set, ziele: r.targets, endzustand: r.accepting })), dea: D, start: epsilonClosure(N, N.starts) };
}

/* ───────────── Keller-Labor (Kellerautomaten) ───────────── */

/** Rückwärts-Aufgabe: Folge der Konfigurationen (Zustand, Keller) eines akzeptierenden Laufs – ohne das Eingabewort. */
export function kellerFolge(automat, wort) {
  const run = runPDA(pda(automat), wort).run;
  return run.map((r) => ({ state: r.config.state, stack: r.config.stack }));
}

/**
 * Tabellen-Trainer: vollständige Abi-Tabelle zu Wort Nr. i prüfen. antwort = { wort, zeilen: [{ zustand, keller,
 * oberstes, eingabe }], akzeptiert }. Gültig ist jeder Lauf nach den Übergängen (beim NKA genügt ein akzeptierender);
 * akzeptiert → letzte Zeile: Eingabe gelesen, Endzustand; nicht akzeptiert → Lauf endet ohne weiteren Übergang.
 * stand = { erledigt: { i: true } }. Eine falsche Tabelle ist ein Fehlversuch.
 */
export function pruefeKellerTabelle(automat, worte, stand0, antwort) {
  const i = Number.isInteger(antwort?.wort) ? antwort.wort : -1;
  if (typeof worte[i] !== 'string') throw ungueltig400('Dieses Wort gibt es nicht.');
  if (!Array.isArray(antwort.zeilen) || !antwort.zeilen.length || antwort.zeilen.length > 200) throw ungueltig400('Die Tabelle fehlt.');
  if (typeof antwort.akzeptiert !== 'boolean') throw ungueltig400('Bitte entscheide: Wird die Eingabe akzeptiert?');
  const P = pda(automat);
  const tokens = tokenizeWort(worte[i], P.inputAlphabet).tokens;
  const keller = (txt) => { const t = String(txt ?? '').replace(/\s+/g, ''); if (isEpsilon(t)) return []; const tk = tokenizeWort(t, P.stackAlphabet); return tk.ok ? tk.tokens : null; };
  const gleich = (a, b) => a && a.length === b.length && a.every((x, k) => x === b[k]);
  let fehler = null;
  let cur = initialConfig(P);
  const z0 = antwort.zeilen[0];
  if (z0?.zustand !== cur.state || !gleich(keller(z0?.keller), cur.stack)) fehler = { zeile: 0, grund: 'start' };
  for (let k = 1; !fehler && k < antwort.zeilen.length; k++) {
    const z = antwort.zeilen[k];
    const st = keller(z?.keller);
    const hit = successors(P, cur, tokens).find((x) => x.t.top === z?.oberstes && x.t.input === z?.eingabe && x.config.state === z?.zustand && gleich(st, x.config.stack));
    if (!hit) fehler = { zeile: k, grund: 'uebergang' };
    else cur = hit.config;
  }
  const akzeptiert = runPDA(P, tokens).accepted;
  if (!fehler && antwort.akzeptiert !== akzeptiert) fehler = { grund: 'akzeptanz' };
  if (!fehler && akzeptiert && !(cur.pos === tokens.length && P.accepting.includes(cur.state))) fehler = { grund: 'unvollstaendig' };
  if (!fehler && !akzeptiert && successors(P, cur, tokens).length) fehler = { grund: 'unvollstaendig' };
  const stand = { erledigt: { ...(stand0?.erledigt ?? {}) } };
  if (!fehler) stand.erledigt[String(i)] = true;
  const fertig = worte.every((_, j) => stand.erledigt[j]);
  return { ok: !fehler && fertig, fertig: !fehler && fertig, zaehltFehler: !!fehler, stand,
    rueckmeldung: { wort: i, richtig: !fehler, ...(fehler ? { fehler } : {}), erledigt: Object.keys(stand.erledigt).length, von: worte.length, fertig } };
}

/** Tabellen-Trainer: Lösungsteil – je Wort eine Tabelle (akzeptierender bzw. längster Lauf) und die Entscheidung. */
export function kellerTabellenLoesung(automat, worte) {
  const P = pda(automat);
  return { tabellen: worte.map((w) => {
    const r = runPDA(P, w);
    if (r.accepted) return { wort: w, akzeptiert: true, zeilen: r.table };
    // abgelehnt: längsten Lauf weiterführen, bis kein Übergang mehr möglich ist (wie im Abitur dokumentiert)
    const run = [...r.longest];
    for (let k = 0; k < 100; k++) { const next = successors(P, run.at(-1).config, r.tokens)[0]; if (!next) break; run.push({ config: next.config, t: next.t }); }
    return { wort: w, akzeptiert: false, zeilen: runToTable(run) };
  }) };
}

/** Rückwärts: passt das Wort zur Folge? → ok, at (bis zu welchem Schritt es passt). Falsch = Fehlversuch. */
export function pruefeKellerRueckwaerts(automat, folge, antwort) {
  const P = pda(automat);
  const tk = tokenizeWort(antwort?.wort ?? '', P.inputAlphabet);
  if (!tk.ok) throw ungueltig400(tk.message);
  const r = matchesConfigSequence(P, tk.tokens, folge);
  return r.ok ? { ok: true, rueckmeldung: { richtig: true, wort: tk.tokens, zeilen: runToTable(folge.map((c, k) => ({ config: c, t: k ? r.transitions[k - 1] : null }))) } }
    : { ok: false, rueckmeldung: { richtig: false, at: r.at } };
}

/** Rückwärts: Lösungsteil – ein passendes Eingabewort mit Tabelle. */
export function kellerRueckwaertsLoesung(automat, wort) {
  const r = runPDA(pda(automat), wort);
  return { wort, zeilen: r.table };
}

/* ───────────── Ableitungs-Rallye ───────────── */

/** Linksableitung nachspielen: regeln = [[linke Seite, Index der Alternative], …] → Satzform am Ende (oder Fehler). */
function linksableitung(g, regeln) {
  if (!Array.isArray(regeln) || regeln.length > 400) throw ungueltig400('Die Ableitung fehlt.');
  let form = [{ t: 'N', v: g.start }];
  for (let k = 0; k < regeln.length; k++) {
    const [lhs, idx] = Array.isArray(regeln[k]) ? regeln[k] : [];
    const pos = form.findIndex((x) => x.t === 'N');
    const r = g.byLhs.get(lhs)?.[idx];
    if (pos < 0 || !r || form[pos].v !== lhs) return { fehler: k };
    form = [...form.slice(0, pos), ...r.rhs, ...form.slice(pos + 1)];
  }
  return { form };
}

/**
 * Rallye prüfen. Modus „ableiten“: antwort = { regeln } – Linksableitung bis zum Zielwort.
 * Modus „baum“: antwort = { baeume: [regeln1, regeln2] } – zwei verschiedene Linksableitungen (= Bäume) des Zielworts.
 */
export function pruefeRallye(grammatik, ziel, modus, antwort) {
  const g = parseGrammar(grammatik);
  const w = tokenizeWord(g, ziel).tokens;
  const trifft = (regeln) => { const r = linksableitung(g, regeln); return !r.fehler && r.form.length === w.length && r.form.every((x, k) => x.t === 'T' && x.v === w[k]); };
  if (modus === 'baum') {
    const b = antwort?.baeume;
    if (!Array.isArray(b) || b.length !== 2) throw ungueltig400('Es fehlen die zwei Ableitungen.');
    const ok = trifft(b[0]) && trifft(b[1]) && JSON.stringify(b[0]) !== JSON.stringify(b[1]);
    return { ok, rueckmeldung: { richtig: ok } };
  }
  const ok = trifft(antwort?.regeln);
  return { ok, rueckmeldung: { richtig: ok, schritte: Array.isArray(antwort?.regeln) ? antwort.regeln.length : 0 } };
}

/** Rallye: Lösungsteil – eine kürzeste Ableitung als Folge von Satzformen. */
export function rallyeLoesung(grammatik, ziel, sep = '') {
  const g = parseGrammar(grammatik);
  const r = derive(g, ziel);
  return { ableitung: r.derivation ? r.derivation.map((d) => symbolsToString(d.form, sep)) : null, schritte: r.derivation ? r.derivation.length - 1 : null };
}

/* ───────────── Grammatik-Tester ───────────── */

/**
 * Grammatik gegen die Zielsprache: alle Wörter über Σ bis maxLen mit dem Prädikat vergleichen; bei regulaer zusätzlich
 * rechtsreguläre Form verlangt. c = { alphabet, maxLen, regulaer, pruefe }. antwort = { grammatik: Text, start? }.
 */
export function pruefeGrammatikChallenge(c, antwort) {
  const text = antwort?.grammatik;
  if (typeof text !== 'string' || !text.trim() || text.length > 4000) throw ungueltig400('Die Grammatik fehlt.');
  let g = parseGrammar(text);
  const start = antwort.start;
  if (g.ok && typeof start === 'string' && g.nonterminals.includes(start) && start !== g.start) g = parseGrammar(`${text}\nStart: ${start}`);
  if (!g.ok) throw ungueltig400(`Die Grammatik hat Fehler: ${g.errors.join(' ')}`);
  const maxLen = c.maxLen ?? 8;
  const fremd = g.terminals.filter((t) => !c.alphabet.includes(t));
  if (fremd.length) return { ok: false, rueckmeldung: { richtig: false, grund: 'alphabet', fremd } };
  const lang = languageUpTo(g, maxLen, { maxNodes: 60000 });
  const have = new Set(lang.words.map((w) => w.join('\u0001')));
  let zuviel = null; let fehlt = null;
  for (const w of lang.words) if (!c.pruefe(w)) { zuviel = w; break; }
  if (!zuviel) for (const w of enumerateWords(c.alphabet, maxLen)) if (c.pruefe(w) && !have.has(w.join('\u0001'))) { fehlt = w; break; }
  if (zuviel || fehlt) return { ok: false, rueckmeldung: { richtig: false, grund: 'sprache', zuviel, fehlt, vollstaendig: lang.complete } };
  if (c.regulaer) { const rr = isRightRegular(g); if (!rr.regular) return { ok: false, rueckmeldung: { richtig: false, grund: 'regulaer', violations: rr.violations.slice(0, 6) } }; }
  return { ok: true, rueckmeldung: { richtig: true, anzahl: lang.words.length, maxLen, regulaer: !!c.regulaer } };
}
