'use strict';
// Verbund-API (Vertrag §6) – Testfälle aus docs/INTEGRATION.md §5 (frankjuchim/labs).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const H = require('./helpers');

const mit = (app, methode, pfad, token) => request(app)[methode](pfad).set('Authorization', `Bearer ${token}`);

test('Verbund-API: ohne Token, falsches aud, falscher zweck, falsches sub, exp − iat > 60 s, wiederverwendet, fremder Schlüssel → 401', async () => {
  const app = await H.verbundApp();
  await H.angemeldet(app);
  const jetzt = Math.floor(app.now() / 1000);
  const endpunkte = [
    ['post', '/api/verbund/loeschen', 'loeschen', { sub: 's:1042' }],
    ['get', '/api/verbund/kurse/k%3A17/uebersicht', 'kurs-uebersicht'],
    ['post', '/api/verbund/kurse/k%3A17', 'kurs-aendern', { name: 'Neu' }]
  ];
  for (const [m, pfad, zweck, body] of endpunkte) {
    assert.equal((await request(app)[m](pfad).send(body)).status, 401, `${pfad} ohne Token`);
    const falsch = {
      'falsches aud': H.verbundToken(app.now, zweck, { aud: 'algoquest' }),
      'falscher zweck': H.verbundToken(app.now, zweck === 'loeschen' ? 'kurs-aendern' : 'loeschen'),
      'falsches sub': H.verbundToken(app.now, zweck, { sub: 's:1042' }),
      'exp − iat > 60 s': H.verbundToken(app.now, zweck, { exp: jetzt + 61 }),
      'falsches iss': H.verbundToken(app.now, zweck, { iss: 'https://boese.example' }),
      'fremder Schlüssel': H.verbundToken(app.now, zweck, {}, { schluessel: H.fremdSchluessel }),
      abgelaufen: H.verbundToken(app.now, zweck, { iat: jetzt - 100, exp: jetzt - 40 })
    };
    for (const [fall, token] of Object.entries(falsch)) {
      const r = await mit(app, m, pfad, token).send(body);
      assert.equal(r.status, 401, `${pfad}: ${fall}`);
      assert.deepEqual(r.body, { error: 'Token ungültig.' }, 'keine Details');
    }
    const t = H.verbundToken(app.now, zweck);
    assert.notEqual((await mit(app, m, pfad, t).send(body)).status, 401, `${pfad}: gültig`);
    assert.equal((await mit(app, m, pfad, t).send(body)).status, 401, `${pfad}: wiederverwendet`);
  }
  // Browser-Sitzung reicht nie für die Verbund-API
  const a = await H.angemeldet(app);
  assert.equal((await a.get('/api/verbund/kurse/k%3A17/uebersicht')).status, 401);
});

test('loeschen: Konto zweimal → beide 200, zweites Mal geloescht 0; Sitzung danach ungültig', async () => {
  const app = await H.verbundApp();
  const a = await H.angemeldet(app);
  const r1 = await mit(app, 'post', '/api/verbund/loeschen', H.verbundToken(app.now, 'loeschen')).send({ sub: 's:1042' });
  assert.equal(r1.status, 200);
  assert.ok(r1.body.geloescht >= 1);
  const r2 = await mit(app, 'post', '/api/verbund/loeschen', H.verbundToken(app.now, 'loeschen')).send({ sub: 's:1042' });
  assert.equal(r2.status, 200);
  assert.deepEqual(r2.body, { geloescht: 0 });
  assert.equal((await a.get('/api/sitzung')).body.konto, null);
  assert.equal(app.locals.db.prepare("SELECT COUNT(*) AS n FROM konten WHERE sub = 's:1042'").get().n, 0);
  assert.equal(app.locals.db.prepare("SELECT COUNT(*) AS n FROM kurs_mitglieder WHERE sub = 's:1042'").get().n, 0);
});

test('loeschen: Kurs → Kurs und Mitgliedschaften weg, Konten bleiben; idempotent; ungültige Angaben 400', async () => {
  const app = await H.verbundApp();
  const a = await H.angemeldet(app);
  const r = await mit(app, 'post', '/api/verbund/loeschen', H.verbundToken(app.now, 'loeschen')).send({ kurs: 'k:17' });
  assert.equal(r.status, 200);
  assert.equal(r.body.geloescht, 2);
  assert.deepEqual((await mit(app, 'post', '/api/verbund/loeschen', H.verbundToken(app.now, 'loeschen')).send({ kurs: 'k:17' })).body, { geloescht: 0 });
  assert.deepEqual((await a.get('/api/sitzung')).body.konto.kurse, []);
  for (const body of [{}, { sub: 'x:1' }, { kurs: '17' }]) {
    assert.equal((await mit(app, 'post', '/api/verbund/loeschen', H.verbundToken(app.now, 'loeschen')).send(body)).status, 400, JSON.stringify(body));
  }
});

test('Schreibende Verbund-Aufrufe nur als JSON: 415 nach gültigem Token, ohne Token weiterhin 401', async () => {
  const app = await H.verbundApp();
  await H.angemeldet(app);
  for (const [pfad, zweck] of [['/api/verbund/loeschen', 'loeschen'], ['/api/verbund/kurse/k%3A17', 'kurs-aendern']]) {
    const r = await mit(app, 'post', pfad, H.verbundToken(app.now, zweck)).type('text').send('name=X');
    assert.equal(r.status, 415, pfad);
    assert.equal((await request(app).post(pfad).type('text').send('x')).status, 401, pfad + ' ohne Token');
  }
  assert.equal(app.locals.svc.konten.kurs('k:17').name, 'LK Informatik 13', 'nichts geändert');
});

test('Kursübersicht: Format nach §6 (nur Mitglieder, Welten mit nr und kennung); unbekannter Kurs 404', async () => {
  const app = await H.verbundApp();
  await H.angemeldet(app);
  await H.angemeldet(app, { sub: 's:7', name: 'Ada L.' });
  await H.angemeldet(app, { sub: 'l:5', rolle: 'lehrkraft', name: 'Frau Beispiel', kurse: [{ id: 'k:17', name: 'LK', rolle: 'lehrkraft' }] });
  const r = await mit(app, 'get', '/api/verbund/kurse/k%3A17/uebersicht', H.verbundToken(app.now, 'kurs-uebersicht'));
  assert.equal(r.status, 200);
  assert.equal(r.body.kurs, 'k:17');
  assert.ok(!Number.isNaN(Date.parse(r.body.stand)));
  assert.deepEqual(r.body.schueler.map((s) => s.sub).sort(), ['s:1042', 's:7']);
  for (const s of r.body.schueler) {
    assert.deepEqual(Object.keys(s).sort(), ['anteil', 'geloest', 'punkte', 'sub', 'zuletzt']);
    assert.ok(s.anteil >= 0 && s.anteil <= 1);
  }
  assert.deepEqual(r.body.welten.map((w) => [w.nr, w.kennung]), [[1, 'A'], [2, 'B'], [3, 'C'], [4, 'D']]);
  assert.doesNotMatch(JSON.stringify(r.body), /Mika|Ada/, 'keine Namen – die ergänzt das Portal');
  assert.equal((await mit(app, 'get', '/api/verbund/kurse/k%3A99/uebersicht', H.verbundToken(app.now, 'kurs-uebersicht'))).status, 404);
});

test('Kursänderung: umbenennen, sperren (Mitglieder verlieren Zugang), entsperren; unbekannter Kurs wird angelegt', async () => {
  const app = await H.verbundApp();
  const a = await H.angemeldet(app);
  const aendern = (body, id = 'k%3A17') => mit(app, 'post', `/api/verbund/kurse/${id}`, H.verbundToken(app.now, 'kurs-aendern')).send(body);
  assert.deepEqual((await aendern({ name: 'LK Informatik 13 (neu)' })).body, { ok: true });
  assert.equal((await a.get('/api/sitzung')).body.konto.kurse[0].name, 'LK Informatik 13 (neu)');
  assert.equal((await aendern({ aktiv: false })).status, 200);
  assert.deepEqual((await a.get('/api/sitzung')).body.konto.kurse, [], 'gesperrter Kurs');
  assert.equal((await aendern({ aktiv: true })).status, 200);
  assert.equal((await a.get('/api/sitzung')).body.konto.kurse.length, 1);
  assert.equal((await aendern({ name: 'Neuer Kurs' }, 'k%3A99')).status, 200);
  assert.equal(app.locals.svc.konten.kurs('k:99').name, 'Neuer Kurs');
  assert.equal((await aendern({ aktiv: 'nein' })).status, 400);
  assert.equal((await aendern({ name: 'X' }, 'abc')).status, 404);
});
