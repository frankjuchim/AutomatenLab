'use strict';
// Rangliste für Schüler, Beamer-Board und Urkunden (PR 8, wie Algo Quest): Sichtbarkeit nur nach Einstellung der
// Lehrkraft, gleiche Punkte = gleicher Platz, keine Konto-IDs bei Schülern und auf dem Board, Board über Zufallslink.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const H = require('./helpers');

const ORIGIN = { Origin: 'http://127.0.0.1', Host: '127.0.0.1' };
const KURS = [{ id: 'k:17', name: 'LK', rolle: 'mitglied' }];
const LK = { sub: 'l:5', rolle: 'lehrkraft', name: 'Frau Beispiel', kurse: [{ id: 'k:17', name: 'LK', rolle: 'lehrkraft' }] };

async function kurs() {
  const app = await H.verbundApp();
  const mika = await H.angemeldet(app); // s:1042 „Mika R.“ in k:17
  const ada = await H.angemeldet(app, { sub: 's:7', name: 'Ada L.', kurse: KURS });
  const ben = await H.angemeldet(app, { sub: 's:8', name: 'Ben K.', kurse: KURS });
  const lk = await H.angemeldet(app, LK);
  // Mika löst Baukasten-Challenge 1 (Welt A) mit der Musterlösung → Abzeichen „Erster Bauplan“
  const { BAUKASTEN_CHALLENGES } = await import('../inhalte/baukasten.js');
  const c = BAUKASTEN_CHALLENGES[0];
  const p = await mika.post(`/api/aufgaben/${encodeURIComponent('baukasten:' + c.id)}/pruefen`).set(ORIGIN).send({ antwort: { automat: c.referenz } });
  assert.equal(p.body.geloest, true);
  return { app, mika, ada, ben, lk, punkte: p.body.punkteErhalten };
}
const setze = (lk, einstellungen) => lk.patch('/api/lehrer/kurse/k%3A17').set(ORIGIN).send({ einstellungen });

test('Rangliste für Schüler: standardmäßig aus, nach Einschalten mit Platz, eigenem Eintrag und ohne Konto-IDs', async () => {
  const { mika, ada, lk, punkte } = await kurs();
  assert.deepEqual((await mika.get('/api/rangliste')).body.kurse, [], 'aus, solange die Lehrkraft sie nicht einschaltet');
  assert.equal((await setze(lk, { scoreboard: true })).status, 200);
  const r = (await ada.get('/api/rangliste')).body;
  assert.equal(r.kurse.length, 1);
  const l = r.kurse[0].liste;
  assert.deepEqual(l.map((z) => [z.name, z.punkte, z.platz]), [['Mika R.', punkte, 1], ['Ada L.', 0, 2], ['Ben K.', 0, 2]], 'gleiche Punkte = gleicher Platz');
  assert.deepEqual(l.filter((z) => z.ich).map((z) => z.name), ['Ada L.']);
  assert.doesNotMatch(JSON.stringify(r), /s:\d|sub/, 'keine Konto-IDs');
  // je Welt: Welt A zählt die Baukasten-Punkte, Welt C nicht
  assert.equal((await ada.get('/api/rangliste?welt=A')).body.kurse[0].liste[0].punkte, punkte);
  assert.equal((await ada.get('/api/rangliste?welt=C')).body.kurse[0].liste[0].punkte, 0);
  assert.equal((await ada.get('/api/rangliste?welt=X')).status, 400);
  // Schüler bekommen den Board-Link nie
  await setze(lk, { beamer: { aktiv: true } });
  assert.doesNotMatch(JSON.stringify((await ada.get('/api/meine-kurse')).body), /beamer|token/);
});

test('Beamer-Board: nur eingeschaltet, über zufälligen Link ohne Anmeldung; neuer Link macht den alten ungültig', async () => {
  const { app, lk, punkte } = await kurs();
  const e0 = (await lk.get('/api/lehrer/kurse/k%3A17')).body.einstellungen;
  assert.deepEqual([e0.scoreboard, e0.beamer.aktiv], [false, false]);
  const e1 = (await setze(lk, { beamer: { aktiv: true } })).body.einstellungen;
  assert.match(e1.beamer.token, /^[A-Za-z0-9_-]{16}$/);
  const b = await request(app).get(`/api/board/${e1.beamer.token}`);
  assert.equal(b.status, 200);
  assert.match(b.headers['x-robots-tag'], /noindex/);
  assert.equal(b.body.kurs.name, 'LK');
  assert.equal(b.body.schueler, 3);
  assert.deepEqual(b.body.liste[0], { name: 'Mika R.', punkte, abzeichen: 1, geloest: 1, platz: 1 });
  assert.ok(b.body.welten.some((w) => w.kennung === 'A' && w.anteil > 0));
  assert.match(b.body.erfolge[0].text, /^Mika R\. hat das Abzeichen „Erster Bauplan“ erhalten$/);
  assert.doesNotMatch(JSON.stringify(b.body), /s:\d|"sub"|k:17/, 'keine IDs auf dem Board');
  // Kurzlink für den Beamer
  const k = await request(app).get(`/board/${e1.beamer.token}`);
  assert.equal(k.status, 302);
  assert.equal(k.headers.location, `/#/board?t=${e1.beamer.token}`);
  // ausschalten → 404; wieder ein → gleicher Link; neuer Link → alter 404
  await setze(lk, { beamer: { aktiv: false } });
  assert.equal((await request(app).get(`/api/board/${e1.beamer.token}`)).status, 404);
  const e2 = (await setze(lk, { beamer: { aktiv: true } })).body.einstellungen;
  assert.equal(e2.beamer.token, e1.beamer.token);
  const e3 = (await setze(lk, { beamer: { aktiv: true, neu: true } })).body.einstellungen;
  assert.notEqual(e3.beamer.token, e1.beamer.token);
  assert.equal((await request(app).get(`/api/board/${e1.beamer.token}`)).status, 404);
  assert.equal((await request(app).get(`/api/board/${e3.beamer.token}`)).status, 200);
  for (const t of ['kurz', 'x'.repeat(16) + '/../', '%27%20OR%201%3D1']) assert.equal((await request(app).get(`/api/board/${t}`)).status, 404, t);
  assert.equal((await setze(lk, { beamer: { aktiv: 'ja' } })).status, 400);
  assert.equal((await setze(lk, { scoreboard: 1 })).status, 400);
});

test('Urkunden: je Schüler Name, Rang, Punkte, Platz, Abzeichen; nur Lehrkräfte des Kurses', async () => {
  const { app, mika, lk, punkte } = await kurs();
  const u = (await lk.get('/api/lehrer/kurse/k%3A17/urkunden')).body;
  assert.equal(u.kurs.name, 'LK');
  assert.equal(u.anzahl, 3);
  assert.equal(u.raenge.length, 5);
  const m = u.schueler[0];
  assert.deepEqual([m.name, m.punkte, m.geloest, m.platz, m.abzeichen], ['Mika R.', punkte, 1, 1, ['Erster Bauplan']]);
  assert.ok(u.raenge.includes(m.rang));
  assert.equal(u.schueler[1].rang, u.raenge[0]);
  assert.equal((await mika.get('/api/lehrer/kurse/k%3A17/urkunden')).status, 403);
  assert.equal((await request(app).get('/api/lehrer/kurse/k%3A17/urkunden')).status, 401);
  const fremd = await H.angemeldet(app, { sub: 'l:6', rolle: 'lehrkraft', name: 'Herr Fremd', kurse: [{ id: 'k:18', name: 'GK', rolle: 'lehrkraft' }] });
  assert.equal((await fremd.get('/api/lehrer/kurse/k%3A17/urkunden')).status, 404);
});

test('Manifest nennt Rangliste, Beamer-Board, Urkunden, Fallen-Profil und Bosse', async () => {
  const app = await H.verbundApp();
  const f = (await request(app).get('/api/plattform')).body.faehigkeiten;
  for (const x of ['scoreboard', 'beamer', 'urkunden', 'fallen-profil', 'boss']) assert.ok(f.includes(x), x);
  assert.equal((await request(app).get('/api/plattform')).body.umfang.bosse, 4);
});
