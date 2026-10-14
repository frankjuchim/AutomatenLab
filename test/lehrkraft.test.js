'use strict';
// Lehrkraft-Bereich (Aufbau wie Algo Quest): Schülerliste, Lernstand-Matrix, Aufgabenstatistik, CSV, Kursart,
// Aufgaben-Vorschau ohne Speichern, häufige falsche Antworten;
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

test('Vorschau für Lehrkräfte: prüfen, Tipp, Lösung zeigen – ohne Speichern; Schüler 403', async () => {
  const { app, lk } = await kursMitLernstand();
  const { BAUKASTEN_CHALLENGES } = await import('../inhalte/baukasten.js');
  const c = BAUKASTEN_CHALLENGES[1];
  const id = encodeURIComponent(`baukasten:${c.id}`);
  const vor = (aktion, body = {}) => lk.post(`/api/lehrer/vorschau/${id}/${aktion}`).set(ORIGIN).send(body);
  const zeilen = () => app.locals.db.prepare("SELECT COUNT(*) AS n FROM fortschritt WHERE sub = 'l:5'").get().n;
  const a = (await vor('abrufen')).body;
  assert.equal(a.vorschau, true);
  assert.equal(a.zustand.status, 'offen');
  assert.equal(a.loesung, undefined);
  const p = (await vor('pruefen', { antwort: { automat: { ...c.referenz, accepting: [] } }, stand: a.stand })).body; // akzeptiert nichts
  assert.equal(p.ok, false);
  assert.equal(p.stand.fehlversuche, 1);
  const d = (await vor('aufdecken', { stand: p.stand })).body;
  assert.equal(d.zustand.status, 'angesehen');
  assert.ok(d.loesung.musterloesung);
  const ok = (await vor('pruefen', { antwort: { automat: c.referenz }, stand: d.stand })).body;
  assert.equal(ok.ok, true);
  assert.equal(zeilen(), 0, 'nichts gespeichert');
  assert.equal((await vor('quatsch')).status, 404);
  const schueler = await H.angemeldet(app);
  assert.equal((await schueler.post(`/api/lehrer/vorschau/${id}/abrufen`).set(ORIGIN).send({})).status, 403);
});

test('Häufige falsche Antworten: Kurzform je Aufgabe, nur Kursmitglieder, gelöscht mit dem Konto', async () => {
  const { app, lk } = await kursMitLernstand();
  const { DETEKTIV_FAELLE } = await import('../inhalte/detektiv.js');
  const mika = await H.angemeldet(app);
  const id = 'detektiv:fall-1';
  const auf = (await mika.get(`/api/aufgaben/${encodeURIComponent(id)}`)).body;
  const falsch = auf.aufgabe.optionen.find((o) => o.text !== DETEKTIV_FAELLE[0].optionen[0].text);
  for (let i = 0; i < 2; i++) await mika.post(`/api/aufgaben/${encodeURIComponent(id)}/pruefen`).set(ORIGIN).send({ antwort: { wahl: falsch.id } });
  const stat = (await lk.get('/api/lehrer/kurse/k%3A17/auswertung')).body.aufgaben.find((x) => x.id === id);
  assert.deepEqual(stat.falscheAntworten, [{ antwort: falsch.text, anzahl: 2 }]);
  assert.ok((await lk.get('/api/lehrer/kurse/k%3A17/export.csv?art=aufgaben')).text.includes(`(2×)`));
  const t = H.verbundToken(app.now, 'loeschen');
  await request(app).post('/api/verbund/loeschen').set('Authorization', `Bearer ${t}`).send({ sub: 's:1042' });
  assert.equal(app.locals.db.prepare('SELECT COUNT(*) AS n FROM falsche_antworten').get().n, 0);
});
