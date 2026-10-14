'use strict';
// Rechte-Matrix: jede Route × jede Rolle (Gast, Schüler, Lehrkraft, fremde Lehrkraft, Superadmin), CSRF, Header.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const H = require('./helpers');

async function rollen(app) {
  return {
    gast: request.agent(app),
    schueler: await H.angemeldet(app),
    lehrkraft: await H.angemeldet(app, { sub: 'l:5', rolle: 'lehrkraft', name: 'Frau Beispiel', kurse: [{ id: 'k:17', name: 'LK', rolle: 'lehrkraft' }] }),
    fremdeLehrkraft: await H.angemeldet(app, { sub: 'l:6', rolle: 'lehrkraft', name: 'Herr Anders', kurse: [{ id: 'k:30', name: 'GK', rolle: 'lehrkraft' }] }),
    superadmin: await H.angemeldet(app, { sub: 'a:1', rolle: 'superadmin', name: 'Superadmin', kurse: [{ id: 'k:17', name: 'LK', rolle: 'lehrkraft' }, { id: 'k:30', name: 'GK', rolle: 'lehrkraft' }] })
  };
}

test('Matrix: erwarteter Status je Route und Rolle', async () => {
  const app = await H.verbundApp();
  const r = await rollen(app);
  // [Methode, Pfad, {rolle: status}]
  const MATRIX = [
    ['get', '/api/sitzung', { gast: 200, schueler: 200, lehrkraft: 200, fremdeLehrkraft: 200, superadmin: 200 }],
    ['get', '/api/plattform', { gast: 200, schueler: 200, lehrkraft: 200, fremdeLehrkraft: 200, superadmin: 200 }],
    ['get', '/api/themen', { gast: 200, schueler: 200, lehrkraft: 200, fremdeLehrkraft: 200, superadmin: 200 }],
    ['get', '/api/training', { gast: 401, schueler: 200, lehrkraft: 200, fremdeLehrkraft: 200, superadmin: 200 }],
    ['post', '/api/training/arena/neu', { gast: 401, schueler: 200, lehrkraft: 200, fremdeLehrkraft: 200, superadmin: 200 }],
    ['post', '/api/training/unterscheide/neu', { gast: 401, schueler: 200, lehrkraft: 200, fremdeLehrkraft: 200, superadmin: 200 }],
    ['post', '/api/training/runde/999999/ende', { gast: 401, schueler: 404, lehrkraft: 404, fremdeLehrkraft: 404, superadmin: 404 }],
    ['post', '/api/training/sortierer/neu', { gast: 401, schueler: 200, lehrkraft: 200, fremdeLehrkraft: 200, superadmin: 200 }],
    ['post', '/api/training/runde/999999/antwort', { gast: 401, schueler: 404, lehrkraft: 404, fremdeLehrkraft: 404, superadmin: 404 }],
    ['get', '/api/lehrer/kurse', { gast: 401, schueler: 403, lehrkraft: 200, fremdeLehrkraft: 200, superadmin: 200 }],
    ['post', '/api/sitzung/beenden', { gast: 401, schueler: 200, lehrkraft: 200, fremdeLehrkraft: 200, superadmin: 200 }],
    ['get', '/api/verbund/kurse/k%3A17/uebersicht', { gast: 401, schueler: 401, lehrkraft: 401, fremdeLehrkraft: 401, superadmin: 401 }],
    ['post', '/api/verbund/loeschen', { gast: 401, schueler: 401, lehrkraft: 401, fremdeLehrkraft: 401, superadmin: 401 }],
    ['post', '/api/verbund/kurse/k%3A17', { gast: 401, schueler: 401, lehrkraft: 401, fremdeLehrkraft: 401, superadmin: 401 }]
  ];
  for (const [m, pfad, erwartet] of MATRIX) {
    for (const [rolle, status] of Object.entries(erwartet)) {
      const anfrage = r[rolle][m](pfad);
      if (m !== 'get') anfrage.set('Origin', 'http://127.0.0.1').set('Host', '127.0.0.1').send({ sub: 's:1042' });
      const antwort = await anfrage;
      assert.equal(antwort.status, status, `${m.toUpperCase()} ${pfad} als ${rolle}`);
    }
    // Sitzungen nach „beenden“ wiederherstellen
    if (pfad === '/api/sitzung/beenden') Object.assign(r, await rollen(app));
  }
});

test('Lehrkraft sieht nur Kurse, in denen sie laut Token Lehrkraft ist; Superadmin alle aus seinem Token', async () => {
  const app = await H.verbundApp();
  const r = await rollen(app);
  assert.deepEqual((await r.lehrkraft.get('/api/lehrer/kurse')).body.map((k) => k.id), ['k:17']);
  assert.deepEqual((await r.fremdeLehrkraft.get('/api/lehrer/kurse')).body.map((k) => k.id), ['k:30']);
  assert.deepEqual((await r.superadmin.get('/api/lehrer/kurse')).body.map((k) => k.id).sort(), ['k:17', 'k:30']);
  assert.equal((await r.lehrkraft.get('/api/lehrer/kurse')).body[0].schueler, 1);
});

test('CSRF: schreibende API-Anfragen nur mit passender Herkunft und als JSON', async () => {
  const app = await H.verbundApp();
  const s = await H.angemeldet(app);
  assert.equal((await s.post('/api/sitzung/beenden').send({})).status, 403, 'ohne Origin');
  assert.equal((await s.post('/api/sitzung/beenden').set('Host', '127.0.0.1').set('Origin', 'http://boese.example').send({})).status, 403, 'fremde Herkunft');
  assert.equal((await s.post('/api/sitzung/beenden').set('Host', '127.0.0.1').set('Origin', 'http://127.0.0.1').type('form').send('a=1')).status, 415, 'kein JSON');
  assert.equal((await s.post('/api/sitzung/beenden').set('Host', '127.0.0.1').set('Referer', 'http://127.0.0.1/').send({})).status, 200, 'Referer reicht');
});

test('Gefälschtes oder fremd signiertes Sitzungs-Cookie wird ignoriert', async () => {
  const app = await H.verbundApp();
  const S = require('../src/security');
  const falsch = S.sign({ k: 'a:1', g: 1, exp: Date.now() + 3600e3 }, 'anderes-geheimnis-0123456789');
  const r = await request(app).get('/api/sitzung').set('Cookie', `al_s=${falsch}`);
  assert.equal(r.body.konto, null);
});
