'use strict';
// Prüfung und Lernstand auf dem Server (Vertrag §9): Punkteformel, Tipps, „Lösung zeigen“, Abzeichen, Rechte.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const H = require('./helpers');
const { punkteFuer } = require('../src/lernen');

const ORIGIN = { Origin: 'http://127.0.0.1', Host: '127.0.0.1' };
const post = (agent, pfad, body = {}) => agent.post(pfad).set(ORIGIN).send(body);

test('Punkteformel wie §9: round(p × max(0.25, 1 − 0.25·F − 0.2·T))', () => {
  assert.equal(punkteFuer(30, 0, 0), 30);
  assert.equal(punkteFuer(30, 1, 0), 23);
  assert.equal(punkteFuer(30, 0, 1), 24);
  assert.equal(punkteFuer(30, 1, 1), 17);
  assert.equal(punkteFuer(20, 9, 9), 5);
});

test('Katalog öffentlich und ohne Lösungen; Aufgabe ohne Lösung, solange offen', async () => {
  const app = await H.verbundApp();
  const k = (await request(app).get('/api/katalog')).body.aufgaben;
  assert.ok(k.some((a) => a.id === 'baukasten:enthaelt-aa') && k.some((a) => a.id === 'detektiv:fall-1') && k.some((a) => a.id === 'quiz:ds-1'));
  assert.doesNotMatch(JSON.stringify(k), /referenz|pruefe|delta|optionen|bedeutung|tipp"/i);
  const s = await H.angemeldet(app);
  for (const id of ['baukasten:enthaelt-aa', 'detektiv:fall-1', 'quiz:welt-A']) {
    const r = (await s.get(`/api/aufgaben/${id}`)).body;
    assert.equal(r.zustand.status, 'offen');
    assert.equal(r.loesung, undefined);
    assert.doesNotMatch(JSON.stringify(r.aufgabe), /referenz|"accepting":\["S2"\],"implicitError|bedeutung|erklaerung|"wahr"|Merke dir/);
  }
  assert.equal((await s.get('/api/aufgaben/gibts:nicht')).status, 404);
});

test('Rechte: Gast 401, Schüler ohne freigeschalteten Kurs 403, Lehrkraft darf ausprobieren', async () => {
  const app = await H.verbundApp();
  assert.equal((await request(app).get('/api/aufgaben/detektiv:fall-1')).status, 401);
  assert.equal((await request(app).get('/api/lernstand')).status, 401);
  const ohne = await H.angemeldet(app, { sub: 's:9', kurse: [] });
  assert.equal((await ohne.get('/api/aufgaben/detektiv:fall-1')).status, 403);
  assert.equal((await post(ohne, '/api/aufgaben/detektiv:fall-1/pruefen', { antwort: { wahl: 'x' } })).status, 403);
  const lk = await H.angemeldet(app, { sub: 'l:5', rolle: 'lehrkraft', name: 'Frau Beispiel', kurse: [] });
  assert.equal((await lk.get('/api/aufgaben/detektiv:fall-1')).status, 200);
  // CSRF auch hier
  const s = await H.angemeldet(app);
  assert.equal((await s.post('/api/aufgaben/detektiv:fall-1/pruefen').send({ antwort: {} })).status, 403);
});

test('Detektiv: falsche Wahl → Gegenbeispiel + Fehlversuch, richtige → Punkte nach Formel, Lösung danach sichtbar', async () => {
  const app = await H.verbundApp();
  const s = await H.angemeldet(app);
  const a = (await s.get('/api/aufgaben/detektiv:fall-1')).body.aufgabe;
  assert.equal(a.optionen.length, 4);
  // richtige Option finden wir nur über die Antwort des Servers
  const antworten = [];
  for (const o of a.optionen) {
    const r = (await post(s, '/api/aufgaben/detektiv:fall-1/pruefen', { antwort: { wahl: o.id } })).body;
    antworten.push(r);
    if (r.ok) break;
    assert.equal(r.rueckmeldung.richtig, false);
    assert.ok(r.rueckmeldung.gegenbeispiel && typeof r.rueckmeldung.gegenbeispiel.wort === 'string');
    assert.equal(r.loesung, undefined);
  }
  const letzte = antworten.at(-1);
  assert.equal(letzte.ok, true);
  assert.equal(letzte.geloest, true);
  const fehl = antworten.length - 1;
  assert.equal(letzte.punkteErhalten, punkteFuer(10, fehl, 0));
  assert.match(letzte.loesung.richtigText, /enden/);
  assert.ok(letzte.loesung.bedeutung.S1);
  assert.ok(letzte.neueAbzeichen.some((b) => b.id === 'detektiv-erster-fall' && b.titel === 'Fall gelöst'));
  // erneutes Prüfen ändert nichts mehr
  const nochmal = (await post(s, '/api/aufgaben/detektiv:fall-1/pruefen', { antwort: { wahl: letzte.loesung.richtig } })).body;
  assert.equal(nochmal.geloest, false);
  assert.equal(nochmal.punkteErhalten, 0);
  const ls = (await s.get('/api/lernstand')).body;
  assert.ok(ls.solved['detektiv:fall-1']);
  assert.equal(ls.punkte, letzte.punkteErhalten);
  assert.deepEqual(ls.badges, ['detektiv-erster-fall']);
  assert.equal((await post(s, '/api/aufgaben/detektiv:fall-1/pruefen', { antwort: { wahl: 'unsinn' } })).status, 400);
});

test('Baukasten: Gegenbeispiel, Tipp kostet Punkte, richtiger DEA → Punkte; ungültige Automaten 400', async () => {
  const app = await H.verbundApp();
  const s = await H.angemeldet(app);
  const id = 'baukasten:endet-b';
  const a = (await s.get(`/api/aufgaben/${id}`)).body;
  assert.deepEqual(a.aufgabe.alphabet, ['a', 'b']);
  assert.equal(a.zustand.tippsAnzahl, 1);
  assert.deepEqual(a.zustand.tipps, []);
  const falsch = { alphabet: ['a', 'b'], start: 'S0', accepting: ['S0'], delta: { S0: { 'a, b': 'S0' } } };
  const r1 = (await post(s, `/api/aufgaben/${id}/pruefen`, { antwort: { automat: falsch } })).body;
  assert.equal(r1.ok, false);
  assert.equal(r1.rueckmeldung.gegenbeispiel.wort, 'ε');
  assert.equal(r1.rueckmeldung.gegenbeispiel.akzeptiertVonDir, true);
  const t = (await post(s, `/api/aufgaben/${id}/tipp`)).body;
  assert.equal(t.zustand.tipps.length, 1);
  assert.equal(t.zustand.moeglich, punkteFuer(10, 1, 1));
  const richtig = { alphabet: ['a', 'b'], start: 'Q0', accepting: ['Q1'], delta: { Q0: { a: 'Q0', b: 'Q1' }, Q1: { a: 'Q0', b: 'Q1' } } };
  const r2 = (await post(s, `/api/aufgaben/${id}/pruefen`, { antwort: { automat: richtig } })).body;
  assert.equal(r2.ok, true);
  assert.equal(r2.punkteErhalten, punkteFuer(10, 1, 1));
  assert.ok(r2.loesung.musterloesung.delta);
  for (const automat of [null, { alphabet: ['a', 'c'], start: 'S0', accepting: [], delta: {} }, { kaputt: true }]) {
    assert.equal((await post(s, `/api/aufgaben/${id}/pruefen`, { antwort: { automat } })).status, 400, JSON.stringify(automat));
  }
});

test('„Lösung zeigen“: 0 Punkte, Lösung sichtbar, danach selbst gelöst = nachgelöst ohne Punkte', async () => {
  const app = await H.verbundApp();
  const s = await H.angemeldet(app);
  const id = 'baukasten:endet-b';
  const d = (await post(s, `/api/aufgaben/${id}/aufdecken`)).body;
  assert.equal(d.zustand.status, 'angesehen');
  assert.ok(d.loesung.musterloesung);
  assert.deepEqual(d.zustand.tipps, ['Der Automat muss sich nur das zuletzt gelesene Zeichen merken.']);
  const r = (await post(s, `/api/aufgaben/${id}/pruefen`, { antwort: { automat: { alphabet: ['a', 'b'], start: 'S0', accepting: ['S1'], delta: { S0: { a: 'S0', b: 'S1' }, S1: { a: 'S0', b: 'S1' } } } } })).body;
  assert.equal(r.ok, true);
  assert.equal(r.punkteErhalten, 0);
  assert.equal(r.geloest, false, 'kein erstes Lösen');
  assert.equal(r.nachgeloest, true, 'Signal für den Browser: Lernstand neu laden');
  assert.deepEqual(r.neueAbzeichen.map((b) => b.id), ['baukasten-erster']);
  const ls = (await s.get('/api/lernstand')).body;
  assert.ok(ls.solved[id], 'nachgelöst zählt als gelöst');
  assert.equal(ls.punkte, 0);
  const r2 = (await post(s, `/api/aufgaben/${id}/pruefen`, { antwort: { automat: d.loesung.musterloesung } })).body;
  assert.equal(r2.nachgeloest, false, 'nur einmal nachgelöst');
  assert.equal((await post(s, '/api/aufgaben/quiz:ds-1/aufdecken')).status, 400, 'Quiz ohne Aufdecken');
});

test('Nachgelöst zählt für Stufen-Abzeichen (ohne Punkte, ohne Volltreffer)', async () => {
  const app = await H.verbundApp();
  const s = await H.angemeldet(app);
  const stufe1 = (await s.get('/api/katalog?modul=baukasten')).body.aufgaben.filter((a) => a.stufe === 1);
  assert.ok(stufe1.length > 1);
  let letzte;
  for (const a of stufe1) {
    const d = (await post(s, `/api/aufgaben/${a.id}/aufdecken`)).body;
    letzte = (await post(s, `/api/aufgaben/${a.id}/pruefen`, { antwort: { automat: d.loesung.musterloesung } })).body;
    assert.equal(letzte.nachgeloest, true, a.id);
  }
  assert.ok(letzte.neueAbzeichen.some((b) => b.id === 'baukasten-stufe-1'), 'Stufen-Abzeichen nach der letzten nachgelösten Challenge');
  const ls = (await s.get('/api/lernstand')).body;
  assert.ok(ls.badges.includes('baukasten-stufe-1'));
  assert.equal(ls.punkte, 0);
});

test('Quiz: jede Frage einmal gewertet, Punkte = Anteil richtig im ersten Durchgang; Wiederholen ist Übung', async () => {
  const app = await H.verbundApp();
  const s = await H.angemeldet(app);
  const id = 'quiz:ds-1';
  const q = (await s.get(`/api/aufgaben/${id}`)).body.aufgabe;
  assert.equal(q.fragen.length, 3);
  // Frage 0 (mc): zuerst falsch raten, dann richtig – gewertet wird nur die erste Antwort
  const f0 = q.fragen[0];
  let r = (await post(s, `/api/aufgaben/${id}/pruefen`, { antwort: { frage: 0, wahl: f0.optionen[0].id } })).body;
  const richtig0 = r.rueckmeldung.richtig;
  const ersteWertung = r.rueckmeldung.wert;
  r = (await post(s, `/api/aufgaben/${id}/pruefen`, { antwort: { frage: 0, wahl: richtig0 } })).body;
  assert.equal(r.rueckmeldung.wert, 1);
  assert.equal(r.fertig, false);
  // Frage 1 (mc) richtig (Text aus inhalte/quiz.js)
  const f1 = q.fragen[1];
  r = (await post(s, `/api/aufgaben/${id}/pruefen`, { antwort: { frage: 1, wahl: f1.optionen.find((o) => o.text === 'Mit einem Pfeil „Start“').id } })).body;
  assert.equal(r.rueckmeldung.wert, 1);
  // Frage 2 (wf): Aussage ist wahr, Begründung richtig
  const f2 = q.fragen[2];
  const begr = f2.begruendungen.find((b) => /Schleifen für alle Zeichen/.test(b.text)).id;
  r = (await post(s, `/api/aufgaben/${id}/pruefen`, { antwort: { frage: 2, wahr: true, begruendung: begr } })).body;
  assert.equal(r.rueckmeldung.wert, 1);
  assert.equal(r.fertig, true);
  assert.equal(r.geloest, true);
  const anteil = (ersteWertung + 1 + 1) / 3;
  assert.equal(r.punkteErhalten, Math.round(10 * anteil));
  assert.equal(r.loesung.ergebnis.prozent, Math.round(100 * anteil));
  assert.ok(r.neueAbzeichen.some((b) => b.id === 'quiz-erstes'));
  const ls = (await s.get('/api/lernstand')).body;
  assert.equal(ls.best[id], Math.round(100 * anteil));
  // Wiederholen: Rückmeldung ja, Wertung bleibt
  r = (await post(s, `/api/aufgaben/${id}/pruefen`, { antwort: { frage: 0, wahl: richtig0 } })).body;
  assert.equal(r.punkteErhalten, 0);
  assert.equal((await s.get('/api/lernstand')).body.best[id], Math.round(100 * anteil));
  // ungültige Antworten
  assert.equal((await post(s, `/api/aufgaben/${id}/pruefen`, { antwort: { frage: 7, wahl: 'x' } })).status, 400);
  assert.equal((await post(s, `/api/aufgaben/${id}/pruefen`, { antwort: { frage: 2, wahr: 'ja' } })).status, 400);
});

test('Quiz-Zuordnung: Teilpunkte ab der Hälfte, Lösung nach der Antwort', async () => {
  const app = await H.verbundApp();
  const s = await H.angemeldet(app);
  const id = 'quiz:welt-A';
  const q = (await s.get(`/api/aufgaben/${id}`)).body.aufgabe;
  const i = q.fragen.findIndex((f) => f.typ === 'zuordnung');
  assert.ok(i >= 0);
  const f = q.fragen[i];
  const r = (await post(s, `/api/aufgaben/${id}/pruefen`, { antwort: { frage: i, zuordnung: f.links.map(() => f.rechts[0]) } })).body;
  assert.equal(r.rueckmeldung.loesung.length, f.links.length);
  assert.ok([0, 0.5, 1].includes(r.rueckmeldung.wert));
});

test('Löschung über die Verbund-API entfernt auch Lernstand und Abzeichen', async () => {
  const app = await H.verbundApp();
  const s = await H.angemeldet(app);
  await post(s, '/api/aufgaben/baukasten:endet-b/aufdecken');
  const t = H.verbundToken(app.now, 'loeschen');
  const r = await request(app).post('/api/verbund/loeschen').set('Authorization', `Bearer ${t}`).send({ sub: 's:1042' });
  assert.equal(r.status, 200);
  assert.ok(r.body.geloescht >= 3);
  assert.equal(app.locals.db.prepare('SELECT COUNT(*) AS n FROM fortschritt').get().n, 0);
});
