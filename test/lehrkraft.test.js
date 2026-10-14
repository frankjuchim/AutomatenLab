'use strict';
// Lehrkraft-Bereich (Aufbau wie Algo Quest): Schülerliste, Lernstand-Matrix, Aufgabenstatistik, CSV, Kursart;
// Kursübersicht für das Portal mit echten Kennzahlen (nur Kursumfang je Kursart).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const H = require('./helpers');

const ORIGIN = { Origin: 'http://127.0.0.1', Host: '127.0.0.1' };
const KURS = [{ id: 'k:17', name: 'LK', rolle: 'mitglied' }];

async function kursMitLernstand() {
  const app = await H.verbundApp();
  const mika = await H.angemeldet(app); // s:1042 „Mika R.“ in k:17
  const ada = await H.angemeldet(app, { sub: 's:7', name: 'Ada L.', kurse: KURS });
  const lk = await H.angemeldet(app, { sub: 'l:5', rolle: 'lehrkraft', name: 'Frau Beispiel', kurse: [{ id: 'k:17', name: 'LK', rolle: 'lehrkraft' }] });
  // Mika löst die Baukasten-Challenge 1 (Level 3) mit der Musterlösung, Ada sieht die Lösung an
  const { BAUKASTEN_CHALLENGES } = await import('../inhalte/baukasten.js');
  const c = BAUKASTEN_CHALLENGES[0];
  const id = `baukasten:${c.id}`;
  const p = await mika.post(`/api/aufgaben/${encodeURIComponent(id)}/pruefen`).set(ORIGIN).send({ antwort: { automat: c.referenz } });
  assert.equal(p.body.geloest, true);
  await ada.post(`/api/aufgaben/${encodeURIComponent(id)}/aufdecken`).set(ORIGIN).send({});
  return { app, lk, id, punkte: p.body.punkteErhalten };
}

test('Schülerliste und Rangliste: Punkte, gelöst, angesehen, Rang', async () => {
  const { lk, punkte } = await kursMitLernstand();
  const r = (await lk.get('/api/lehrer/kurse/k%3A17/schueler')).body;
  const mika = r.find((s) => s.sub === 's:1042');
  const ada = r.find((s) => s.sub === 's:7');
  assert.deepEqual([mika.punkte, mika.geloest, mika.rang], [punkte, 1, 1]);
  assert.deepEqual([ada.punkte, ada.angesehen, ada.rang], [0, 1, 2]);
  const kurse = (await lk.get('/api/lehrer/kurse')).body;
  assert.equal(kurse[0].kursart, 'eA');
  assert.ok(kurse[0].zuletztAktiv);
});

test('Auswertung: Matrix Level × Schüler und Aufgabenstatistik; CSV mit BOM und ohne Formeln', async () => {
  const { app, lk, id, punkte } = await kursMitLernstand();
  const a = (await lk.get('/api/lehrer/kurse/k%3A17/auswertung')).body;
  assert.deepEqual(a.matrix.levels.map((l) => l.nr), [...Array(16)].map((_, i) => i + 1));
  const l3 = a.matrix.levels.findIndex((l) => l.nr === 3);
  const mika = a.matrix.zeilen.find((z) => z.sub === 's:1042');
  assert.equal(mika.werte[l3].punkte, punkte);
  assert.ok(mika.werte[l3].anteil > 0 && mika.werte[l3].anteil <= 1);
  const stat = a.aufgaben.find((x) => x.id === id);
  assert.deepEqual([stat.versucht, stat.geloest, stat.angesehen, stat.quote, stat.welt], [2, 1, 1, 0.5, 'A']);
  assert.doesNotMatch(JSON.stringify(a), /referenz|musterloesung/i, 'keine Lösungen in der Auswertung');
  for (const art of ['uebersicht', 'matrix', 'aufgaben']) {
    const r = await lk.get(`/api/lehrer/kurse/k%3A17/export.csv?art=${art}`);
    assert.equal(r.status, 200);
    assert.match(r.headers['content-type'], /text\/csv/);
    assert.ok(r.text.startsWith('﻿'));
    if (art !== 'aufgaben') assert.ok(r.text.includes('Mika R.'), art);
  }
  assert.equal((await lk.get('/api/lehrer/kurse/k%3A17/export.csv?art=quatsch')).status, 404);
  // Name, der wie eine Formel aussieht, wird entschärft
  await H.angemeldet(app, { sub: 's:8', name: '=SUMME(A1)', kurse: KURS });
  assert.ok((await lk.get('/api/lehrer/kurse/k%3A17/export.csv?art=uebersicht')).text.includes("'=SUMME(A1)"));
});

test('Kursart: speichern, ungültig 400; Portal-Kennzahlen nur über den Kursumfang', async () => {
  const { app, lk } = await kursMitLernstand();
  const patch = (body) => lk.patch('/api/lehrer/kurse/k%3A17').set(ORIGIN).send(body);
  assert.equal((await patch({ einstellungen: { kursart: 'xy' } })).status, 400);
  assert.deepEqual((await patch({ einstellungen: { kursart: 'gA' } })).body.einstellungen, { kursart: 'gA' });
  assert.equal((await lk.get('/api/lehrer/kurse/k%3A17')).body.einstellungen.kursart, 'gA');
  const a = (await lk.get('/api/lehrer/kurse/k%3A17/auswertung')).body;
  assert.equal(a.matrix.levels.find((l) => l.nr === 9).imKurs, false, 'Level 9 (eA) nicht im Grundkurs');
  assert.equal(a.matrix.levels.find((l) => l.nr === 3).imKurs, true);
  const u = (await request(app).get('/api/verbund/kurse/k%3A17/uebersicht').set('Authorization', `Bearer ${H.verbundToken(app.now, 'kurs-uebersicht')}`)).body;
  const mika = u.schueler.find((s) => s.sub === 's:1042');
  assert.ok(mika.punkte > 0 && mika.geloest === 1 && mika.anteil > 0 && mika.anteil < 1);
  assert.ok(u.welten.find((w) => w.kennung === 'A').anteil > 0);
  assert.equal(u.welten.find((w) => w.kennung === 'C').anteil, 0);
});
