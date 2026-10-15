'use strict';
// Aufgaben-Editor (PR 10): eigene Quizfragen und Baukasten-Challenges je Kurs – Eingaben geprüft, Lösungen nur auf dem
// Server, sichtbar für Schüler erst nach Freigabe und nur im eigenen Kurs, keine Punkte, Löschen räumt Ergebnisse auf.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const H = require('./helpers');

const ORIGIN = { Origin: 'http://127.0.0.1', Host: '127.0.0.1' };
const LK = { sub: 'l:5', rolle: 'lehrkraft', name: 'Frau Beispiel', kurse: [{ id: 'k:17', name: 'LK', rolle: 'lehrkraft' }] };
const QUIZ = {
  art: 'quiz', titel: 'Mini-Test Startzustand',
  daten: { fragen: [
    { typ: 'mc', frage: 'Wie wird der Startzustand markiert?', optionen: ['Doppelkreis', 'Pfeil „Start“', 'Quadrat'], richtig: 1, erklaerung: 'Der Pfeil zeigt auf den Startzustand.' },
    { typ: 'wf', aussage: 'ε ist ein Zeichen des Alphabets.', wahr: false, begruendungen: ['Ja, immer.', 'Nein, ε ist das leere Wort.'], richtig: 1 }
  ] }
};
const ENDET_B = { alphabet: ['a', 'b'], start: 'S0', accepting: ['S1'], delta: { S0: { a: 'S0', b: 'S1' }, S1: { a: 'S0', b: 'S1' } } };
const BAU = { art: 'baukasten', titel: 'Endet auf b', daten: { aufgabe: 'Entwickle einen DEA für alle Wörter über {a, b}, die auf b enden.', stufe: 1, referenz: ENDET_B, tipps: ['Merke dir das letzte Zeichen.'] } };

async function start() {
  const app = await H.verbundApp();
  const lk = await H.angemeldet(app, LK);
  const mika = await H.angemeldet(app); // Mitglied in k:17
  const fremd = await H.angemeldet(app, { sub: 's:9', name: 'Lou F.', kurse: [{ id: 'k:30', name: 'GK', rolle: 'mitglied' }] });
  return { app, lk, mika, fremd };
}
const neu = (lk, body) => lk.post('/api/lehrer/kurse/k%3A17/eigene').set(ORIGIN).send(body);

test('Quiz anlegen, freigeben, lösen: Lösung nur auf dem Server, keine Punkte; Schüler anderer Kurse sehen nichts', async () => {
  const { lk, mika, fremd } = await start();
  const r = await neu(lk, QUIZ);
  assert.equal(r.status, 201);
  const { nr, id, link } = r.body;
  assert.equal(link, `#/quiz?eigen=${nr}`);
  // Entwurf: für Schüler unsichtbar
  assert.deepEqual((await mika.get('/api/eigene')).body, []);
  assert.equal((await mika.get(`/api/aufgaben/${encodeURIComponent(id)}`)).status, 404);
  // freigeben
  assert.equal((await lk.patch(`/api/lehrer/eigene/${nr}`).set(ORIGIN).send({ aktiv: true })).body.aktiv, true);
  assert.deepEqual((await mika.get('/api/eigene')).body.map((x) => [x.titel, x.status, x.kurs]), [['Mini-Test Startzustand', 'offen', 'LK Informatik 13']]);
  assert.equal((await fremd.get(`/api/aufgaben/${encodeURIComponent(id)}`)).status, 404, 'fremder Kurs');
  const a = (await mika.get(`/api/aufgaben/${encodeURIComponent(id)}`)).body;
  assert.equal(a.aufgabe.fragen.length, 2);
  assert.doesNotMatch(JSON.stringify(a), /erklaerung|richtig|"wahr"|Der Pfeil zeigt/, 'keine Lösung vor dem Antworten');
  const richtigeOption = a.aufgabe.fragen[0].optionen.find((o) => o.text === 'Pfeil „Start“');
  const p1 = (await mika.post(`/api/aufgaben/${encodeURIComponent(id)}/pruefen`).set(ORIGIN).send({ antwort: { frage: 0, wahl: richtigeOption.id } })).body;
  assert.equal(p1.ok, true);
  assert.equal(p1.rueckmeldung.erklaerung, 'Der Pfeil zeigt auf den Startzustand.');
  const begr = a.aufgabe.fragen[1].begruendungen.find((o) => o.text === 'Nein, ε ist das leere Wort.');
  const p2 = (await mika.post(`/api/aufgaben/${encodeURIComponent(id)}/pruefen`).set(ORIGIN).send({ antwort: { frage: 1, wahr: false, begruendung: begr.id } })).body;
  assert.equal(p2.geloest, true);
  assert.equal(p2.punkteErhalten, 0, 'eigene Aufgaben geben keine Punkte');
  assert.deepEqual(p2.neueAbzeichen, []);
  assert.equal((await mika.get('/api/lernstand')).body.punkte, 0);
  assert.equal((await mika.get('/api/eigene')).body[0].status, 'geloest');
  const l = (await lk.get('/api/lehrer/kurse/k%3A17/eigene')).body;
  assert.deepEqual([l[0].versucht, l[0].geloest, l[0].fragen], [1, 1, 2]);
});

test('Baukasten-Challenge: Sprache des Musterautomaten wird geprüft, Beispiele kommen vom Server, Vorschau für die Lehrkraft', async () => {
  const { lk, mika, app } = await start();
  const { nr, id } = (await neu(lk, { ...BAU, aktiv: true })).body;
  const a = (await mika.get(`/api/aufgaben/${encodeURIComponent(id)}`)).body;
  assert.deepEqual(a.aufgabe.alphabet, ['a', 'b']);
  assert.deepEqual(a.aufgabe.beispiele, { ja: ['b', 'ab', 'bb', 'aab'], nein: ['ε', 'a', 'aa', 'ba'] });
  assert.equal(a.zustand.tippsAnzahl, 1);
  assert.doesNotMatch(JSON.stringify(a), /referenz|musterloesung|S1/);
  const falsch = { alphabet: ['a', 'b'], start: 'S0', accepting: ['S0'], delta: { S0: { a: 'S0', b: 'S0' } } };
  const p1 = (await mika.post(`/api/aufgaben/${encodeURIComponent(id)}/pruefen`).set(ORIGIN).send({ antwort: { automat: falsch } })).body;
  assert.equal(p1.ok, false);
  assert.ok(p1.rueckmeldung.gegenbeispiel);
  // anderer, äquivalenter Automat ist richtig
  const anders = { alphabet: ['a', 'b'], start: 'X', accepting: ['Y', 'Z'], delta: { X: { a: 'X', b: 'Y' }, Y: { a: 'X', b: 'Z' }, Z: { a: 'X', b: 'Y' } } };
  assert.equal((await mika.post(`/api/aufgaben/${encodeURIComponent(id)}/pruefen`).set(ORIGIN).send({ antwort: { automat: anders } })).body.ok, true);
  // Vorschau mit Lösung nur für Lehrkräfte des Kurses
  const v = await lk.post(`/api/lehrer/vorschau/${encodeURIComponent(id)}/aufdecken`).set(ORIGIN).send({});
  assert.deepEqual(v.body.loesung.musterloesung, ENDET_B);
  const lk2 = await H.angemeldet(app, { sub: 'l:6', rolle: 'lehrkraft', name: 'Herr Anders', kurse: [{ id: 'k:30', name: 'GK', rolle: 'lehrkraft' }] });
  assert.equal((await lk2.post(`/api/lehrer/vorschau/${encodeURIComponent(id)}/abrufen`).set(ORIGIN).send({})).status, 404);
  assert.equal((await lk2.get(`/api/lehrer/eigene/${nr}`)).status, 404);
  assert.equal((await lk2.patch(`/api/lehrer/eigene/${nr}`).set(ORIGIN).send({ aktiv: false })).status, 404);
  // Lehrkraft liest die Aufgabe zum Bearbeiten
  assert.deepEqual((await lk.get(`/api/lehrer/eigene/${nr}`)).body.daten.referenz, ENDET_B);
});

test('Eingaben werden geprüft (Fehlertexte auf Deutsch); Ändern des Inhalts setzt Ergebnisse zurück; Löschen räumt auf', async () => {
  const { lk, mika, app } = await start();
  const fehler = async (body) => { const r = await neu(lk, body); assert.equal(r.status, 400, JSON.stringify(body)); return r.body.error; };
  assert.match(await fehler({ ...QUIZ, titel: 'x' }), /Titel/);
  assert.match(await fehler({ ...QUIZ, daten: { fragen: [] } }), /1 bis 12/);
  assert.match(await fehler({ ...QUIZ, daten: { fragen: [{ typ: 'mc', frage: 'F?', optionen: ['a', 'a'], richtig: 0 }] } }), /gleich/);
  assert.match(await fehler({ ...QUIZ, daten: { fragen: [{ typ: 'mc', frage: 'F?', optionen: ['a', 'b'], richtig: 5 }] } }), /richtige Antwort/);
  assert.match(await fehler({ ...QUIZ, daten: { fragen: [{ typ: 'wf', aussage: 'A', begruendungen: ['x', 'y'], richtig: 0 }] } }), /wahr oder falsch/);
  assert.match(await fehler({ ...BAU, daten: { ...BAU.daten, referenz: { alphabet: ['a'], start: 'S0', accepting: [], delta: { S0: { a: 'S0' } } } } }), /Endzustand/);
  assert.match(await fehler({ ...BAU, daten: { ...BAU.daten, stufe: 7 } }), /Stufe/);
  assert.match(await fehler({ art: 'turing', titel: 'Test', daten: {} }), /Aufgabenart/);
  assert.match(await fehler({ ...QUIZ, titel: 'Steuer\u0007zeichen' }), /ungültige Zeichen/);
  const { nr, id } = (await neu(lk, { ...QUIZ, aktiv: true })).body;
  const a = (await mika.get(`/api/aufgaben/${encodeURIComponent(id)}`)).body;
  await mika.post(`/api/aufgaben/${encodeURIComponent(id)}/pruefen`).set(ORIGIN).send({ antwort: { frage: 0, wahl: a.aufgabe.fragen[0].optionen[0].id } });
  // nur Titel ändern: Ergebnisse bleiben; Inhalt ändern: Ergebnisse weg
  await lk.patch(`/api/lehrer/eigene/${nr}`).set(ORIGIN).send({ titel: 'Neuer Titel' });
  assert.equal((await lk.get('/api/lehrer/kurse/k%3A17/eigene')).body[0].versucht, 1);
  await lk.patch(`/api/lehrer/eigene/${nr}`).set(ORIGIN).send({ daten: { fragen: [QUIZ.daten.fragen[0]] } });
  assert.equal((await lk.get('/api/lehrer/kurse/k%3A17/eigene')).body[0].versucht, 0);
  const wahl = (await mika.get(`/api/aufgaben/${encodeURIComponent(id)}`)).body.aufgabe.fragen[0].optionen[0].id;
  await mika.post(`/api/aufgaben/${encodeURIComponent(id)}/pruefen`).set(ORIGIN).send({ antwort: { frage: 0, wahl } });
  const db = app.locals.db;
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM fortschritt WHERE aufgabe_id = ?').get(id).n, 1);
  assert.equal((await lk.delete(`/api/lehrer/eigene/${nr}`).set(ORIGIN)).status, 200);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM fortschritt WHERE aufgabe_id = ?').get(id).n, 0);
  assert.equal((await mika.get(`/api/aufgaben/${encodeURIComponent(id)}`)).status, 404);
  // Kurs im Portal gelöscht → eigene Aufgaben samt Ergebnissen weg; Konto der Lehrkraft gelöscht → Autor geleert
  const b = (await neu(lk, { ...BAU, aktiv: true })).body;
  await mika.post(`/api/aufgaben/${encodeURIComponent(b.id)}/pruefen`).set(ORIGIN).send({ antwort: { automat: ENDET_B } });
  const loeschen = (body) => request(app).post('/api/verbund/loeschen').set('Authorization', `Bearer ${H.verbundToken(app.now, 'loeschen')}`).send(body);
  assert.equal((await loeschen({ sub: 'l:5' })).status, 200);
  assert.equal(db.prepare('SELECT autor_sub FROM eigene_aufgaben WHERE id = ?').get(b.nr).autor_sub, null);
  assert.equal((await loeschen({ kurs: 'k:17' })).status, 200);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM eigene_aufgaben').get().n, 0);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM fortschritt WHERE aufgabe_id LIKE ?').get('eigen:%').n, 0);
});

test('Rechte: Schüler und Gäste dürfen nichts verwalten; höchstens 60 Aufgaben je Kurs', async () => {
  const { lk, mika, app } = await start();
  assert.equal((await mika.get('/api/lehrer/kurse/k%3A17/eigene')).status, 403);
  assert.equal((await mika.post('/api/lehrer/kurse/k%3A17/eigene').set(ORIGIN).send(QUIZ)).status, 403);
  assert.equal((await request(app).get('/api/eigene')).status, 401);
  assert.equal((await lk.post('/api/lehrer/kurse/k%3A99/eigene').set(ORIGIN).send(QUIZ)).status, 404);
  const db = app.locals.db;
  const ins = db.prepare("INSERT INTO eigene_aufgaben (kurs_id, autor_sub, art, titel, daten, aktiv, created_at, updated_at) VALUES ('k:17', 'l:5', 'quiz', 'x', '{}', 0, 'a', 'a')");
  for (let i = 0; i < 60; i++) ins.run();
  assert.match((await neu(lk, QUIZ)).body.error, /Höchstens 60/);
});

test('Detektiv-Fall und Grammatik-Challenge der Lehrkraft; Kopieren in einen anderen Kurs (als Entwurf)', async () => {
  const app = await H.verbundApp();
  const lk = await H.angemeldet(app, { sub: 'l:5', rolle: 'lehrkraft', name: 'Frau Beispiel', kurse: [{ id: 'k:17', name: 'LK', rolle: 'lehrkraft' }, { id: 'k:18', name: 'GK', rolle: 'lehrkraft' }] });
  const mika = await H.angemeldet(app);
  const neu = (body) => lk.post('/api/lehrer/kurse/k%3A17/eigene').set(ORIGIN).send({ aktiv: true, ...body });
  // Detektiv: vier Beschreibungen, die markierte ist richtig
  const det = await neu({ art: 'detektiv', titel: 'Der Schlusspunkt', daten: { automat: ENDET_B, optionen: ['beginnt mit b', 'endet auf b', 'enthält b', 'genau ein b'], richtig: 1, erklaerung: 'S1 heißt: zuletzt b gelesen.' } });
  assert.equal(det.status, 201, JSON.stringify(det.body));
  assert.equal(det.body.link, `#/detektiv?eigen=${det.body.nr}`);
  const a = (await mika.get(`/api/aufgaben/${encodeURIComponent(det.body.id)}`)).body;
  assert.deepEqual(a.aufgabe.automat, ENDET_B);
  assert.equal(a.aufgabe.optionen.length, 4);
  assert.doesNotMatch(JSON.stringify(a), /S1 heißt/);
  const falsch = a.aufgabe.optionen.find((o) => o.text === 'enthält b');
  const p1 = (await mika.post(`/api/aufgaben/${encodeURIComponent(det.body.id)}/pruefen`).set(ORIGIN).send({ antwort: { wahl: falsch.id } })).body;
  assert.deepEqual([p1.ok, p1.rueckmeldung.gegenbeispiel], [false, null]);
  const richtig = a.aufgabe.optionen.find((o) => o.text === 'endet auf b');
  const p2 = (await mika.post(`/api/aufgaben/${encodeURIComponent(det.body.id)}/pruefen`).set(ORIGIN).send({ antwort: { wahl: richtig.id } })).body;
  assert.deepEqual([p2.ok, p2.geloest, p2.punkteErhalten], [true, true, 0]);
  assert.match(JSON.stringify(p2.loesung), /S1 heißt/);
  // Grammatik: Sprache der Mustergrammatik bis Länge 8 (|Σ| = 2)
  const gr = await neu({ art: 'grammatik', titel: 'aⁿbⁿ', daten: { aufgabe: 'Entwirf eine Grammatik für {aⁿbⁿ | n ≥ 1} über Σ = {a, b}.', stufe: 2, alphabet: ['a', 'b'], referenz: 'S → aSb | ab', tipps: ['Außen a und b.'] } });
  assert.equal(gr.status, 201, JSON.stringify(gr.body));
  assert.equal(gr.body.link, `#/grammatik?eigen=${gr.body.nr}`);
  const g = (await mika.get(`/api/aufgaben/${encodeURIComponent(gr.body.id)}`)).body;
  assert.deepEqual(g.aufgabe.alphabet, ['a', 'b']);
  assert.deepEqual(g.aufgabe.beispiele.ja.slice(0, 2), ['ab', 'aabb']);
  assert.doesNotMatch(JSON.stringify(g), /aSb/);
  const zuviel = (await mika.post(`/api/aufgaben/${encodeURIComponent(gr.body.id)}/pruefen`).set(ORIGIN).send({ antwort: { grammatik: 'S → aSb | ε' } })).body;
  assert.equal(zuviel.ok, false);
  assert.deepEqual(zuviel.rueckmeldung.zuviel, []);
  const ok = (await mika.post(`/api/aufgaben/${encodeURIComponent(gr.body.id)}/pruefen`).set(ORIGIN).send({ antwort: { grammatik: 'S → aA\nA → Sb | b' } })).body;
  assert.equal(ok.ok, true);
  // Fehler in der Mustergrammatik
  const fehler = async (daten) => (await neu({ art: 'grammatik', titel: 'Test', daten: { aufgabe: 'Eine Aufgabe mit Text.', stufe: 1, alphabet: ['a', 'b'], ...daten } })).body.error;
  assert.match(await fehler({ referenz: 'S → aSc' }), /außerhalb/);
  assert.match(await fehler({ referenz: 'S → aSb | ab', regulaer: true }), /nicht rechtsregulär/);
  assert.match(await fehler({ referenz: 'S → → a' }), /Fehler/);
  assert.match((await neu({ art: 'detektiv', titel: 'Test', daten: { automat: ENDET_B, optionen: ['a', 'b', 'c'], richtig: 0 } })).body.error, /genau vier/);
  // Kopieren: Entwurf im anderen Kurs, ohne Ergebnisse; fremder Kurs 404
  const k = await lk.post(`/api/lehrer/eigene/${det.body.nr}/kopieren`).set(ORIGIN).send({ kurs: 'k:18' });
  assert.equal(k.status, 201);
  assert.deepEqual([k.body.kurs, k.body.aktiv, k.body.versucht, k.body.titel], ['k:18', false, 0, 'Der Schlusspunkt']);
  assert.equal((await lk.post(`/api/lehrer/eigene/${det.body.nr}/kopieren`).set(ORIGIN).send({ kurs: 'k:99' })).status, 404);
  assert.equal((await mika.post(`/api/lehrer/eigene/${det.body.nr}/kopieren`).set(ORIGIN).send({ kurs: 'k:18' })).status, 403);
});
