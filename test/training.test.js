'use strict';
// Training (Arena, „Unterscheide!“, Sortierer): Runde vom Server, Antworten am Ende, 1 Punkt je richtiger Antwort, höchstens 30 je
// Tag, Arena-Rekorde nur für rechtzeitig beendete Zeitrunden, Abzeichen serverseitig, Löschung.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const H = require('./helpers');

const ORIGIN = { Origin: 'http://127.0.0.1', Host: '127.0.0.1' };
const post = (agent, pfad, body = {}) => agent.post(pfad).set(ORIGIN).send(body);

/** Richtige Antworten aus den öffentlichen Daten (der Automat ist Gegenstand der Aufgabe). */
async function arenaLoesung(items) {
  const { ARENA_AUTOMATEN } = await import('../app/js/data/arena.js');
  const { dfa, runDFA } = await import('../app/js/engine/dfa.js');
  const A = new Map(ARENA_AUTOMATEN.map((a) => [a.id, dfa(a.automat)]));
  return items.map((x) => runDFA(A.get(x.automat), x.wort).accepted);
}

test('Arena: Runde ohne Lösungen, Punkte = richtige Antworten, Rekord und Abzeichen; zweites Beenden 409', async () => {
  const app = await H.verbundApp();
  const s = await H.angemeldet(app);
  const r = (await post(s, '/api/training/arena/neu', { stufe: 3 })).body;
  assert.equal(r.items.length, 150);
  assert.equal(r.art, 'stufe-3');
  assert.ok(r.items.every((x) => typeof x.automat === 'string' && Array.isArray(x.wort) && !('akzeptiert' in x)));
  assert.deepEqual([r.heute, r.maxProTag], [0, 30]);
  const loes = await arenaLoesung(r.items);
  const antworten = loes.slice(0, 14);
  antworten[12] = !antworten[12]; // ein Fehler nach einer Zwölferserie
  const e = (await post(s, `/api/training/runde/${r.id}/ende`, { antworten })).body;
  assert.equal(e.richtig, 13);
  assert.equal(e.besteSerie, 12);
  assert.equal(e.punkteErhalten, 13);
  assert.equal(e.wertung, true);
  assert.equal(e.rekord, true);
  const score = e.score;
  assert.ok(score >= 120);
  assert.deepEqual(e.neueAbzeichen.map((b) => b.id).sort(), ['arena-100', 'arena-erste-runde', 'arena-profi', 'arena-serie-10']);
  assert.equal((await post(s, `/api/training/runde/${r.id}/ende`, { antworten })).status, 409);
  const ls = (await s.get('/api/lernstand')).body;
  assert.equal(ls.punkte, 13);
  assert.equal(ls.best['arena:3'], score);
  assert.ok(ls.module.includes('arena'));
  // Übungsrunde: Punkte ja, aber kein Rekord
  const u = (await post(s, '/api/training/arena/neu', { stufe: 1, ueben: true })).body;
  const eu = (await post(s, `/api/training/runde/${u.id}/ende`, { antworten: (await arenaLoesung(u.items)).slice(0, 3) })).body;
  assert.deepEqual([eu.punkteErhalten, eu.wertung, eu.rekord], [3, false, undefined]);
  // ungültige Antworten
  const x = (await post(s, '/api/training/arena/neu', { stufe: 2 })).body;
  assert.equal((await post(s, `/api/training/runde/${x.id}/ende`, { antworten: ['ja'] })).status, 400);
  assert.equal((await post(s, '/api/training/arena/neu', { automat: 'gibts-nicht' })).status, 404);
  assert.equal((await post(s, '/api/training/quatsch/neu')).status, 404);
});

test('Tageshöchstwert 30 Punkte; zu spät beendete Zeitrunde zählt nicht für den Rekord', async () => {
  let jetzt = Date.parse('2026-10-14T08:00:00Z');
  const app = await H.verbundApp({ now: () => jetzt });
  const s = await H.angemeldet(app);
  let summe = 0;
  for (let i = 0; i < 3; i++) {
    const r = (await post(s, '/api/training/arena/neu', { stufe: 1 })).body;
    const e = (await post(s, `/api/training/runde/${r.id}/ende`, { antworten: (await arenaLoesung(r.items)).slice(0, 14) })).body;
    summe += e.punkteErhalten;
  }
  assert.equal(summe, 30);
  assert.equal((await s.get('/api/training')).body.heute, 30);
  // am nächsten Tag wieder Punkte; eine Runde, die nach 2 Minuten endet, ist „zu spät“
  jetzt += 24 * 3600 * 1000;
  const r = (await post(s, '/api/training/arena/neu', { stufe: 2 })).body;
  jetzt += 120 * 1000;
  const e = (await post(s, `/api/training/runde/${r.id}/ende`, { antworten: (await arenaLoesung(r.items)).slice(0, 5) })).body;
  assert.deepEqual([e.punkteErhalten, e.wertung, e.zuSpaet], [5, false, true]);
  assert.equal((await s.get('/api/lernstand')).body.best['arena:2'], undefined);
});

test('Unterscheide!: Paare ohne Lösung, unterscheidendes Wort oder „äquivalent“, Abzeichen ab 10 richtigen Paaren', async () => {
  const app = await H.verbundApp();
  const s = await H.angemeldet(app);
  const { MINIMIERER_AUFGABEN } = await import('../inhalte/minimierer.js');
  const MK = await import('../app/js/engine/markierung.js');
  const { dfa } = await import('../app/js/engine/dfa.js');
  let gesamt = 0;
  let letzte;
  for (let runde = 0; runde < 3; runde++) {
    const r = (await post(s, '/api/training/unterscheide/neu', { aufgabe: 'quersumme' })).body;
    assert.equal(r.items.length, 6);
    assert.ok(r.items.every((x) => x.aufgabe === 'quersumme' && !('aequivalent' in x) && !('wort' in x)));
    const A = dfa(MINIMIERER_AUFGABEN.find((a) => a.id === 'quersumme').automat);
    const antworten = r.items.map((x) => { const w = MK.unterscheidendesWort(A, x.p, x.q); return w ? { wort: w } : { aequivalent: true }; });
    letzte = (await post(s, `/api/training/runde/${r.id}/ende`, { antworten })).body;
    assert.equal(letzte.richtig, 6);
    gesamt += 6;
  }
  assert.ok(gesamt >= 10);
  assert.ok((await s.get('/api/lernstand')).body.badges.includes('minimierer-unterscheider'));
  // falsche Antworten: ein Wort, das nicht unterscheidet, bzw. „äquivalent“ bei unterscheidbaren Zuständen
  const r = (await post(s, '/api/training/unterscheide/neu', { aufgabe: 'smiley' })).body;
  const e = (await post(s, `/api/training/runde/${r.id}/ende`, { antworten: r.items.map(() => ({ aequivalent: true })) })).body;
  assert.ok(e.falsch > 0 && e.ergebnisse.some((x) => !x.richtig && x.beispielWort));
  assert.equal((await post(s, '/api/training/unterscheide/neu', { aufgabe: 'gibts-nicht' })).status, 404);
});

test('Sortierer: Karten ohne Fach, Antwort je Karte mit Begründung, erste Antwort zählt, Rekord nur in Zehnerrunden', async () => {
  const app = await H.verbundApp();
  const s = await H.angemeldet(app);
  const { SORTIERER_KARTEN } = await import('../inhalte/sortierer.js');
  const typVon = new Map(SORTIERER_KARTEN.map((k) => [k.text, k.typ]));
  const r = (await post(s, '/api/training/sortierer/neu')).body;
  assert.equal(r.art, 'runde');
  assert.equal(r.items.length, 10);
  assert.ok(r.items.every((x) => Object.keys(x).join() === 'text'));
  const typen = r.items.map((x) => typVon.get(x.text));
  assert.deepEqual([3, 2, 0].map((t) => typen.filter((y) => y === t).length), [4, 3, 3]);
  // erste Karte falsch, dann richtig versucht: es bleibt bei falsch
  const falsch = typen[0] === 3 ? 2 : 3;
  const a0 = (await post(s, `/api/training/runde/${r.id}/antwort`, { i: 0, typ: falsch })).body;
  assert.deepEqual([a0.richtig, a0.typ], [false, typen[0]]);
  assert.ok(a0.warum.length > 20);
  const a0b = (await post(s, `/api/training/runde/${r.id}/antwort`, { i: 0, typ: typen[0] })).body;
  assert.deepEqual([a0b.richtig, a0b.wiederholt], [false, true]);
  for (let i = 1; i < 10; i++) assert.equal((await post(s, `/api/training/runde/${r.id}/antwort`, { i, typ: typen[i] })).body.richtig, true);
  assert.equal((await post(s, `/api/training/runde/${r.id}/antwort`, { i: 10, typ: 3 })).status, 400);
  assert.equal((await post(s, `/api/training/runde/${r.id}/antwort`, { i: 1, typ: 1 })).status, 200); // schon beantwortet
  const e = (await post(s, `/api/training/runde/${r.id}/ende`)).body;
  assert.deepEqual([e.richtig, e.falsch, e.punkteErhalten, e.wertung, e.rekord], [9, 1, 9, true, true]);
  assert.deepEqual(e.neueAbzeichen.map((b) => b.id), ['sortierer-erste']);
  assert.equal((await post(s, `/api/training/runde/${r.id}/antwort`, { i: 0, typ: 3 })).status, 409);
  // perfekte Zehnerrunde → Abzeichen; ungültiges Fach → 400
  const r2 = (await post(s, '/api/training/sortierer/neu')).body;
  assert.equal((await post(s, `/api/training/runde/${r2.id}/antwort`, { i: 0, typ: 1 })).status, 400);
  for (let i = 0; i < 10; i++) await post(s, `/api/training/runde/${r2.id}/antwort`, { i, typ: typVon.get(r2.items[i].text) });
  const e2 = (await post(s, `/api/training/runde/${r2.id}/ende`)).body;
  assert.deepEqual([e2.richtig, e2.rekord, e2.rekordVorher], [10, true, 9]);
  assert.deepEqual(e2.neueAbzeichen.map((b) => b.id), ['sortierer-perfekt']);
  // alle Karten: Punkte, aber kein Rekord
  const r3 = (await post(s, '/api/training/sortierer/neu', { alle: true })).body;
  assert.deepEqual([r3.art, r3.items.length], ['alle', SORTIERER_KARTEN.length]);
  for (let i = 0; i < 3; i++) await post(s, `/api/training/runde/${r3.id}/antwort`, { i, typ: typVon.get(r3.items[i].text) });
  const e3 = (await post(s, `/api/training/runde/${r3.id}/ende`)).body;
  assert.deepEqual([e3.richtig, e3.punkteErhalten, e3.wertung], [3, 3, false]);
  const ls = (await s.get('/api/lernstand')).body;
  assert.equal(ls.best['sortierer:runde'], 10);
  assert.equal(ls.punkte, 22);
  assert.ok(ls.module.includes('sortierer'));
  // Einzelantworten gibt es nur beim Sortierer
  const u = (await post(s, '/api/training/arena/neu', { stufe: 1 })).body;
  assert.equal((await post(s, `/api/training/runde/${u.id}/antwort`, { i: 0, typ: 3 })).status, 400);
});

test('Löschung über die Verbund-API entfernt auch die Trainingsrunden', async () => {
  const app = await H.verbundApp();
  const s = await H.angemeldet(app);
  const r = (await post(s, '/api/training/arena/neu', { stufe: 1 })).body;
  await post(s, `/api/training/runde/${r.id}/ende`, { antworten: (await arenaLoesung(r.items)).slice(0, 2) });
  const n = () => app.locals.db.prepare("SELECT COUNT(*) AS n FROM training WHERE sub = 's:1042'").get().n;
  assert.equal(n(), 1);
  const t = H.verbundToken(app.now, 'loeschen');
  const del = await request(app).post('/api/verbund/loeschen').set('Authorization', `Bearer ${t}`).send({ sub: 's:1042' });
  assert.equal(del.status, 200);
  assert.equal(n(), 0);
});
