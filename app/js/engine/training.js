// Training (wie der Trainingsplatz von Algo Quest): Spielrunden erzeugen und auswerten – DOM-frei, ohne Lösungsdaten.
// Genutzt vom Server (Runde erzeugen, Antworten zählen, Punkte vergeben) und im Gastmodus (lokal, ohne Punkte).
//
//   Akzeptor-Arena:  erzeugeArenaRunde(automaten, { stufe, nurId, anzahl, rng }) → [{ automat, wort, akzeptiert }]
//                    werteArenaRunde(items, antworten)                        → { richtig, falsch, score, besteSerie, … }
//   Unterscheide!:   erzeugeUnterscheideRunde(aufgaben, { nurId, rng })       → [{ aufgabe, p, q, aequivalent, wort }]
//                    werteUnterscheideRunde(aufgaben, items, antworten)        → { richtig, falsch, ergebnisse }
//   Chomsky-Sortierer: erzeugeSortiererRunde(karten, { alle, rng })          → [{ id, text, typ, warum }]
//                    pruefeSortiererKarte(item, typ)                         → { richtig, typ, warum }
//                    werteSortiererRunde(items, antworten)                   → { richtig, falsch, ergebnisse }

import { dfa, runDFA, randomWord } from './dfa.js';
import { makeRng, tokenize } from './tokenize.js';
import * as MK from './markierung.js';

/** Wortlängen je Arena-Stufe (wie ARENA_LEVELS in data/arena.js). */
export const ARENA_LAENGE = { 1: [1, 5], 2: [2, 7], 3: [3, 9] };
export const WOERTER_PRO_AUTOMAT = 4;
export const RUNDE_SEK = 60;
/** Punkte einer richtigen Antwort in der Arena-Runde: 10 + Serienbonus (bis +10). */
export const arenaPunkte = (serie) => 10 + 2 * Math.min(serie - 1, 5);

/**
 * Arena-Runde: je Automat vier Wörter, ausgewogen akzeptiert/abgelehnt, kein Wort zweimal hintereinander.
 * automaten: [{ id, level: [stufen], automat }] (Engine-Format).
 */
export function erzeugeArenaRunde(automaten, { stufe = 1, nurId = null, anzahl = 150, rng = makeRng() } = {}) {
  const pool = (nurId ? automaten.filter((a) => a.id === nurId) : automaten.filter((a) => a.level.includes(stufe))).map((a) => ({ ...a, A: dfa(a.automat) }));
  if (!pool.length) throw Object.assign(new Error('Diese Arena-Runde gibt es nicht.'), { status: 404 });
  const [minL, maxL] = ARENA_LAENGE[stufe] ?? ARENA_LAENGE[1];
  const items = [];
  let cur = null; let left = 0; let balance = 0; let last = null;
  while (items.length < anzahl) {
    if (left <= 0 || !cur) {
      const others = pool.filter((a) => a !== cur);
      cur = rng.pick(others.length ? others : pool);
      left = WOERTER_PRO_AUTOMAT;
    }
    left--;
    const A = cur.A;
    let want = balance >= 2 ? false : balance <= -2 ? true : rng() < 0.5;
    let tokens = null;
    for (let tries = 0; tries < 30 && !tokens; tries++) {
      const len = (stufe < 3 && rng() < 0.06) ? 0 : minL + rng.int(maxL - minL + 1);
      const w = randomWord(A, { length: len, wantAccept: want, rng });
      if (w && (!last || w.join('\u0001') !== last.join('\u0001'))) tokens = w;
      if (tries === 15) want = !want;
    }
    if (!tokens) tokens = randomWord(A, { length: minL, wantAccept: !want, rng }) ?? [];
    const akzeptiert = runDFA(A, tokens).accepted;
    balance += akzeptiert ? 1 : -1;
    last = tokens;
    items.push({ automat: cur.id, wort: tokens, akzeptiert });
  }
  return items;
}

/**
 * Arena-Runde auswerten. antworten: [true|false, …] in der Reihenfolge der Items (true = „akzeptiert“).
 * Gezählt wird nur ein lückenloser Anfang (höchstens so viele Antworten wie Items).
 */
export function werteArenaRunde(items, antworten) {
  if (!Array.isArray(antworten) || antworten.length > items.length || antworten.some((x) => typeof x !== 'boolean')) {
    throw Object.assign(new Error('Die Antworten passen nicht zu dieser Runde.'), { status: 400 });
  }
  let richtig = 0; let falsch = 0; let serie = 0; let besteSerie = 0; let score = 0;
  const ergebnisse = antworten.map((x, i) => {
    const ok = x === items[i].akzeptiert;
    if (ok) { richtig++; serie++; besteSerie = Math.max(besteSerie, serie); score += arenaPunkte(serie); } else { falsch++; serie = 0; }
    return { i, richtig: ok, akzeptiert: items[i].akzeptiert };
  });
  return { richtig, falsch, score, besteSerie, ergebnisse };
}

/**
 * Unterscheide!-Runde aus den Minimierer-Automaten: zu einer Aufgabe 2 äquivalente + 4 unterscheidbare Paare,
 * gemischt aus allen Aufgaben je ein Paar (gelegentlich zwei), höchstens 8 Paare.
 * aufgaben: [{ id (Schlüssel), automat }].
 */
export function erzeugeUnterscheideRunde(aufgaben, { nurId = null, rng = makeRng() } = {}) {
  const pool = nurId ? aufgaben.filter((a) => a.id === nurId) : aufgaben;
  if (!pool.length) throw Object.assign(new Error('Diese Runde gibt es nicht.'), { status: 404 });
  const items = [];
  for (const x of pool) {
    const A = dfa(x.automat);
    const pairs = [];
    for (let i = 0; i < A.states.length; i++) for (let j = i + 1; j < A.states.length; j++) {
      const w = MK.unterscheidendesWort(A, A.states[i], A.states[j]);
      pairs.push({ aufgabe: x.id, p: A.states[i], q: A.states[j], aequivalent: w === null, wort: w });
    }
    const eq = rng.shuffle(pairs.filter((y) => y.aequivalent));
    const ne = rng.shuffle(pairs.filter((y) => !y.aequivalent));
    if (nurId) items.push(...eq.slice(0, 2), ...ne.slice(0, 4));
    else items.push(...rng.shuffle([...eq.slice(0, 1), ...ne.slice(0, 1)]).slice(0, 1 + (rng() < 0.4 ? 1 : 0)));
  }
  return rng.shuffle(items).slice(0, 8);
}

/**
 * Unterscheide!-Antwort prüfen: { wort } (Text oder Symbole) oder { aequivalent: true }.
 * → { richtig, unterscheidet?, beispielWort? } – beispielWort = ein unterscheidendes Wort, falls „äquivalent“ falsch war.
 */
export function pruefeUnterscheidePaar(automat, item, antwort) {
  const A = dfa(automat);
  if (antwort?.aequivalent === true) return { richtig: item.aequivalent, ...(item.aequivalent ? {} : { beispielWort: MK.unterscheidendesWort(A, item.p, item.q) }) };
  const tk = tokenize(antwort?.wort ?? '', A.alphabet);
  if (!tk.ok || tk.tokens.length > 40) throw Object.assign(new Error(tk.ok ? 'Das Wort ist zu lang.' : tk.message), { status: 400 });
  const unterscheidet = MK.laufAb(A, item.p, tk.tokens).accepted !== MK.laufAb(A, item.q, tk.tokens).accepted;
  return { richtig: unterscheidet, unterscheidet };
}

/**
 * Unterscheide!-Runde auswerten. antworten: [{ wort } | { aequivalent: true }, …] je Paar (höchstens so viele wie Paare);
 * je Paar zählt die letzte Antwort (die App schickt die gültige: das erste unterscheidende Wort bzw. „äquivalent“).
 */
export function werteUnterscheideRunde(aufgaben, items, antworten) {
  if (!Array.isArray(antworten) || antworten.length > items.length) throw Object.assign(new Error('Die Antworten passen nicht zu dieser Runde.'), { status: 400 });
  const byId = new Map(aufgaben.map((a) => [a.id, a]));
  let richtig = 0;
  const ergebnisse = antworten.map((ant, i) => {
    const r = ant == null ? { richtig: false } : pruefeUnterscheidePaar(byId.get(items[i].aufgabe).automat, items[i], ant);
    if (r.richtig) richtig++;
    return { i, ...r };
  });
  return { richtig, falsch: ergebnisse.length - richtig, ergebnisse };
}

/** Fächer des Chomsky-Sortierers (Typ 3, Typ 2, Typ 0/1) und Kartenzahl einer normalen Runde (4 + 3 + 3). */
export const SORTIERER_TYPEN = [3, 2, 0];
export const SORTIERER_RUNDE = 10;

/**
 * Sortierer-Runde: ausgewogen 4 Karten Typ 3, 3 Karten Typ 2, 3 Karten Typ 0/1 – oder alle Karten (alle = true),
 * jeweils gemischt. karten: [{ id, text, typ, warum }].
 */
export function erzeugeSortiererRunde(karten, { alle = false, rng = makeRng() } = {}) {
  if (!karten.length) throw Object.assign(new Error('Diese Runde gibt es nicht.'), { status: 404 });
  if (alle) return rng.shuffle(karten).map(({ id, text, typ, warum }) => ({ id, text, typ, warum }));
  const von = (t) => rng.shuffle(karten.filter((k) => k.typ === t));
  return rng.shuffle([...von(3).slice(0, 4), ...von(2).slice(0, 3), ...von(0).slice(0, 3)]).map(({ id, text, typ, warum }) => ({ id, text, typ, warum }));
}

/** Eine Karte einsortieren: typ ∈ SORTIERER_TYPEN → { richtig, typ (richtiges Fach), warum }. */
export function pruefeSortiererKarte(item, typ) {
  if (!SORTIERER_TYPEN.includes(typ)) throw Object.assign(new Error('Dieses Fach gibt es nicht.'), { status: 400 });
  return { richtig: typ === item.typ, typ: item.typ, warum: item.warum };
}

/** Sortierer-Runde auswerten. antworten: [typ | null, …] je Karte (null = nicht beantwortet). */
export function werteSortiererRunde(items, antworten) {
  if (!Array.isArray(antworten) || antworten.length > items.length) throw Object.assign(new Error('Die Antworten passen nicht zu dieser Runde.'), { status: 400 });
  let richtig = 0;
  let falsch = 0;
  const ergebnisse = antworten.map((t, i) => {
    if (t == null) return { i, richtig: false, offen: true };
    const r = pruefeSortiererKarte(items[i], t);
    if (r.richtig) richtig++; else falsch++;
    return { i, ...r };
  });
  return { richtig, falsch, ergebnisse };
}
