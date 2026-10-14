'use strict';
// Training (Arena, „Unterscheide!“): Runde vom Server, Antworten am Ende, 1 Punkt je richtiger Antwort, höchstens 30 je
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
