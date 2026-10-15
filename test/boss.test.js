'use strict';
// Boss-Kämpfe (PR 9, wie Algo Quest test/boss.test.js): Freischaltung (auto 60 % / offen / gesperrt), Ziehen nach Mix,
// keine Lösungen während des Kampfes, Wertung erst am Ende, Kulanz, 12-Stunden-Pause, bester Versuch zählt,
// Abzeichen, fremde Kämpfe 404, Vorschau des Pools für Lehrkräfte, Boss-Ergebnisse in der Auswertung.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const H = require('./helpers');

const ORIGIN = { Origin: 'http://127.0.0.1', Host: '127.0.0.1' };
const LK = { sub: 'l:5', rolle: 'lehrkraft', name: 'Frau Beispiel', kurse: [{ id: 'k:17', name: 'LK', rolle: 'lehrkraft' }] };
const STUNDE = 60 * 60 * 1000;

async function start(boss = 'offen') {
  const app = await H.verbundApp();
  const mika = await H.angemeldet(app);
  const lk = await H.angemeldet(app, LK);
  if (boss) await lk.patch('/api/lehrer/kurse/k%3A17').set(ORIGIN).send({ einstellungen: { boss } });
  return { app, mika, lk };
}

/** Richtige Antwort zu einer öffentlichen Boss-Aufgabe (aus inhalte/boss.js über den Text der Option). */
async function richtig(a) {
  const { BOSSE } = await import('../inhalte/boss.js');
  const q = Object.values(BOSSE).flatMap((b) => b.pool).find((x) => x.id === a.id).frage;
  const f = a.frage;
  if (f.typ === 'mc') return { wahl: f.optionen.find((o) => o.text === q.optionen[0]).id };
  if (f.typ === 'wf') return { wahr: q.wahr, begruendung: f.begruendungen.find((o) => o.text === q.begruendungen[0]).id };
  return { zuordnung: q.paare.map((p) => p[1]) };
}

test('Freischaltung: auto erst ab 60 % der Level-Punkte, offen sofort, gesperrt nie; Lehrkräfte immer', async () => {
  const { mika, lk } = await start(null);
  const s = (await mika.get('/api/boss/A')).body;
  assert.equal(s.frei, false);
  assert.match(s.grund, /60 %/);
  assert.equal((await mika.post('/api/boss/A/start').set(ORIGIN).send({})).status, 403);
  await lk.patch('/api/lehrer/kurse/k%3A17').set(ORIGIN).send({ einstellungen: { boss: 'gesperrt' } });
  assert.match((await mika.get('/api/boss/A')).body.grund, /gesperrt/);
  await lk.patch('/api/lehrer/kurse/k%3A17').set(ORIGIN).send({ einstellungen: { boss: 'offen' } });
  assert.equal((await mika.get('/api/boss/A')).body.frei, true);
  assert.equal((await lk.get('/api/boss/B')).body.frei, true, 'Lehrkräfte dürfen üben');
  assert.equal((await lk.patch('/api/lehrer/kurse/k%3A17').set(ORIGIN).send({ einstellungen: { boss: 'immer' } })).status, 400);
  assert.equal((await mika.get('/api/boss/E')).status, 404);
  assert.deepEqual((await mika.get('/api/boss')).body.bosse.map((b) => b.welt), ['A', 'B', 'C', 'D']);
});

test('Kampf: Ziehen nach Mix, leichte zuerst, keine Lösungen; Antworten speichern ohne Rückmeldung; Wertung am Ende', async () => {
  const { app, mika } = await start();
  const r = await mika.post('/api/boss/A/start').set(ORIGIN).send({});
  assert.equal(r.status, 201);
  const k = r.body;
  assert.equal(k.laeuft, true);
  assert.equal(k.aufgaben.length, 8);
  assert.deepEqual(k.aufgaben.map((a) => a.stufe), [1, 1, 1, 2, 2, 2, 3, 3]);
  assert.equal(k.maxPunkte, 3 * 10 + 3 * 20 + 2 * 30);
  const text = JSON.stringify(k);
  assert.doesNotMatch(text, /"(kontrolle|erklaerung|richtig|richtigText|wahr|loesung|paare|niveau|fallen)":/, 'keine Lösungen im laufenden Kampf');
  // zweiter Start liefert denselben Kampf
  assert.equal((await mika.post('/api/boss/A/start').set(ORIGIN).send({})).body.id, k.id);
  // alle richtig beantworten bis auf die erste Aufgabe
  for (const a of k.aufgaben.slice(1)) {
    const s = await mika.put(`/api/boss/kampf/${k.id}/antwort`).set(ORIGIN).send({ aufgabeId: a.id, antwort: await richtig(a) });
    assert.equal(s.status, 200);
    assert.deepEqual(Object.keys(s.body).sort(), ['anzahl', 'gespeichert'], 'keine Rückmeldung zur Richtigkeit');
  }
  assert.equal((await mika.put(`/api/boss/kampf/${k.id}/antwort`).set(ORIGIN).send({ aufgabeId: 'BOSS-C-01', antwort: { wahl: 'x' } })).status, 400);
  const ansicht = (await mika.get(`/api/boss/kampf/${k.id}`)).body;
  assert.equal(ansicht.aufgaben.filter((a) => a.antwort).length, 7);
  app.now.vor(5 * 60 * 1000);
  const e = (await mika.post(`/api/boss/kampf/${k.id}/beenden`).set(ORIGIN).send({})).body;
  assert.equal(e.laeuft, false);
  assert.equal(e.punkte, k.maxPunkte - 10);
  assert.equal(e.besiegt, true);
  assert.deepEqual(e.neueAbzeichen.map((b) => b.id), ['boss-A']);
  assert.ok(e.aufgaben.every((a) => a.loesung), 'nach dem Ende mit Lösung');
  assert.equal(e.aufgaben[0].erreicht, 0);
  // nach dem Ende keine Antworten mehr
  assert.equal((await mika.put(`/api/boss/kampf/${k.id}/antwort`).set(ORIGIN).send({ aufgabeId: k.aufgaben[0].id, antwort: await richtig(k.aufgaben[0]) })).status, 409);
  // Punkte zählen im Lernstand, in der Schülerliste und der Auswertung der Lehrkraft
  assert.equal((await mika.get('/api/lernstand')).body.punkte, e.punkte);
  const lk = await H.angemeldet(app, LK);
  const zeile = (await lk.get('/api/lehrer/kurse/k%3A17/schueler')).body.find((x) => x.sub === 's:1042');
  assert.deepEqual([zeile.punkte, zeile.bossPunkte], [e.punkte, e.punkte]);
  const aw = (await lk.get('/api/lehrer/kurse/k%3A17/auswertung')).body.boss;
  assert.deepEqual(aw.welten.map((w) => w.welt), ['A', 'B', 'C', 'D']);
  assert.deepEqual(aw.zeilen.find((z) => z.sub === 's:1042').werte[0], { punkte: e.punkte, max: k.maxPunkte, versuche: 1, besiegt: true });
  assert.match((await lk.get('/api/lehrer/kurse/k%3A17/export.csv?art=uebersicht')).text, /davon Boss/);
});

test('12 Stunden Pause, bester Versuch zählt, Makellos bei voller Punktzahl', async () => {
  const { app, mika } = await start();
  const k1 = (await mika.post('/api/boss/A/start').set(ORIGIN).send({})).body;
  const e1 = (await mika.post(`/api/boss/kampf/${k1.id}/beenden`).set(ORIGIN).send({})).body;
  assert.equal(e1.punkte, 0);
  const s = (await mika.get('/api/boss/A')).body;
  assert.ok(s.gesperrtBis);
  assert.equal((await mika.post('/api/boss/A/start').set(ORIGIN).send({})).status, 409);
  app.now.vor(12 * STUNDE + 1000);
  const k2 = (await mika.post('/api/boss/A/start').set(ORIGIN).send({})).body;
  for (const a of k2.aufgaben) await mika.put(`/api/boss/kampf/${k2.id}/antwort`).set(ORIGIN).send({ aufgabeId: a.id, antwort: await richtig(a) });
  const e2 = (await mika.post(`/api/boss/kampf/${k2.id}/beenden`).set(ORIGIN).send({})).body;
  assert.equal(e2.punkte, k2.maxPunkte);
  assert.deepEqual(e2.neueAbzeichen.map((b) => b.id).sort(), ['boss-A', 'boss-makellos']);
  app.now.vor(12 * STUNDE + 1000);
  const k3 = (await mika.post('/api/boss/A/start').set(ORIGIN).send({})).body;
  await mika.post(`/api/boss/kampf/${k3.id}/beenden`).set(ORIGIN).send({});
  const st = (await mika.get('/api/boss/A')).body;
  assert.equal(st.bester.punkte, k2.maxPunkte);
  assert.equal(st.versuche.length, 3);
  assert.equal((await mika.get('/api/lernstand')).body.punkte, k2.maxPunkte, 'nur der beste Versuch zählt');
});

test('Zeit: 30 s Kulanz beim Speichern, danach 409 und automatische Wertung; abgelaufene Kämpfe werden beim Abruf gewertet', async () => {
  const { app, mika } = await start();
  const k = (await mika.post('/api/boss/A/start').set(ORIGIN).send({})).body;
  const a = k.aufgaben[0];
  app.now.vor(20 * 60 * 1000 + 20 * 1000); // 20 s nach Ablauf: Kulanz
  assert.equal((await mika.put(`/api/boss/kampf/${k.id}/antwort`).set(ORIGIN).send({ aufgabeId: a.id, antwort: await richtig(a) })).status, 200);
  app.now.vor(20 * 1000); // 40 s nach Ablauf
  assert.equal((await mika.put(`/api/boss/kampf/${k.id}/antwort`).set(ORIGIN).send({ aufgabeId: k.aufgaben[1].id, antwort: await richtig(k.aufgaben[1]) })).status, 409);
  const e = (await mika.get(`/api/boss/kampf/${k.id}`)).body;
  assert.equal(e.laeuft, false);
  assert.equal(e.punkte, a.punkte, 'die rechtzeitig gespeicherte Antwort zählt');
  // ein zweiter Schüler startet und lässt die Zeit verstreichen → Status wertet aus
  const ada = await H.angemeldet(app, { sub: 's:7', name: 'Ada L.', kurse: [{ id: 'k:17', name: 'LK', rolle: 'mitglied' }] });
  const k2 = (await ada.post('/api/boss/B/start').set(ORIGIN).send({})).body;
  assert.equal(k2.aufgaben.length, 8);
  app.now.vor(26 * 60 * 1000);
  const st = (await ada.get('/api/boss/B')).body;
  assert.equal(st.laufend, null);
  assert.equal(st.versuche[0].punkte, 0);
  // fremde Kämpfe sind unsichtbar
  assert.equal((await ada.get(`/api/boss/kampf/${k.id}`)).status, 404);
  assert.equal((await ada.post(`/api/boss/kampf/${k.id}/beenden`).set(ORIGIN).send({})).status, 404);
});

test('Grundkurs: Boss A zieht nur Aufgaben für gA und eA; Vorschau des Pools nur für Lehrkräfte', async () => {
  const { mika, lk, app } = await start();
  await lk.patch('/api/lehrer/kurse/k%3A17').set(ORIGIN).send({ einstellungen: { kursart: 'gA' } });
  const { BOSSE } = await import('../inhalte/boss.js');
  const niveau = new Map(BOSSE.A.pool.map((a) => [a.id, a.niveau]));
  const k = (await mika.post('/api/boss/A/start').set(ORIGIN).send({})).body;
  assert.ok(k.aufgaben.every((a) => niveau.get(a.id) === 'alle'));
  const p = (await lk.get('/api/lehrer/boss/A')).body;
  assert.equal(p.aufgaben.length, 15);
  assert.ok(p.aufgaben[0].frage.optionen || p.aufgaben[0].frage.begruendungen || p.aufgaben[0].frage.paare);
  assert.equal((await mika.get('/api/lehrer/boss/A')).status, 403);
  assert.equal((await request(app).get('/api/lehrer/boss/A')).status, 401);
  assert.equal((await request(app).get('/api/boss/A')).status, 401);
});
