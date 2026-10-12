// Prüffunktionen der Aufgabentypen – DOM-frei, ohne Lösungsdaten. Genutzt vom Server (echte Aufgaben, Lösungen in
// inhalte/) und im Browser nur für die Demo-Aufgaben des Gastmodus. So prüfen beide genau gleich.

import { dfa, runDFA, normalizeDFA, equivalent } from './dfa.js';
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
