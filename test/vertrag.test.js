'use strict';
// Vertrag des Plattform-Verbunds InfoLabs (https://github.com/frankjuchim/labs/blob/main/VERTRAG.md, v1.1):
// Manifest §7, Healthcheck §6, Pflicht-URLs. scripts/vertrag_pruefen.js ist eine unveränderte Kopie aus frankjuchim/labs.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const H = require('./helpers');
const { pruefeManifest } = require('../scripts/vertrag_pruefen');

test('Manifest erfüllt den Vertrag (pruefeManifest ohne Fehler), öffentlich mit CORS *', async () => {
  const app = await H.makeApp();
  const r = await request(app).get('/api/plattform');
  assert.equal(r.status, 200);
  assert.equal(r.headers['access-control-allow-origin'], '*');
  assert.deepEqual(pruefeManifest(r.body), []);
  assert.equal(r.body.id, 'automatenlab');
  assert.equal(r.body.vertrag, '1.1');
  assert.equal(r.body.basis, 'https://automatenlab.example');
  assert.equal(r.body.auth.portal, 'https://labs.example');
  assert.ok(r.body.faehigkeiten.includes('gast'));
});

test('Manifest: Welten 1–4 mit Kennung A–D, Umfang aus den Inhalten, keine Kurs- oder Lösungsdaten', async () => {
  const app = await H.makeApp();
  const m = (await request(app).get('/api/plattform')).body;
  assert.deepEqual(m.welten.map((w) => [w.nr, w.kennung]), [[1, 'A'], [2, 'B'], [3, 'C'], [4, 'D']]);
  assert.equal(m.umfang.welten, 4);
  assert.equal(m.umfang.level, 16);
  assert.equal(m.umfang.bosse, 3);
  assert.ok(m.umfang.aufgaben > 100);
  assert.equal(m.welten.reduce((n, w) => n + w.level, 0), 16);
  const text = JSON.stringify(m);
  assert.doesNotMatch(text, /referenz|loesung|pruefe|delta|"sub"|kurse/i);
});

test('Ohne PLATTFORM_URL: basis aus der Anfrage; ohne PORTAL_URL: portal null', async () => {
  const app = await H.makeApp({ plattformUrl: '', portalUrl: '' });
  const m = (await request(app).get('/api/plattform').set('Host', H.HOST)).body;
  assert.equal(m.basis, `http://${H.HOST}`);
  assert.equal(m.auth.portal, null);
  assert.deepEqual(pruefeManifest(m), []);
});

test('Healthcheck: status ok, Version wie im Manifest', async () => {
  const app = await H.makeApp();
  const h = await request(app).get('/healthz');
  assert.equal(h.status, 200);
  assert.equal(h.body.status, 'ok');
  assert.equal(h.body.version, (await request(app).get('/api/plattform')).body.version);
  assert.equal(h.body.version, require('../package.json').version);
});

test('Pflicht-URLs aus dem Manifest antworten (< 400); Vertragspfade führen auf die Hash-Routen', async () => {
  const app = await H.makeApp();
  const m = (await request(app).get('/api/plattform')).body;
  for (const k of ['start', 'gast', 'themen', 'lehrkraft', 'datenschutz', 'healthz']) {
    const r = await request(app).get(m.urls[k]);
    assert.ok(r.status < 400, `${k} ${m.urls[k]} → ${r.status}`);
  }
  assert.equal((await request(app).get('/themen')).headers.location, '/#/themen');
  assert.equal((await request(app).get('/gast')).headers.location, '/#/gast');
  assert.equal((await request(app).get('/lehrer')).headers.location, '/#/lehrkraft');
  assert.equal((await request(app).get('/datenschutz')).headers.location, '/#/datenschutz');
});

test('Themen-API: Welten, Level mit Modulen, ohne Lösungen', async () => {
  const app = await H.makeApp();
  const t = (await request(app).get('/api/themen')).body;
  assert.equal(t.welten.length, 4);
  const level = t.welten.flatMap((w) => w.levels);
  assert.deepEqual(level.map((l) => l.nr), Array.from({ length: 16 }, (_, i) => i + 1));
  assert.ok(level.every((l) => l.titel && ['pflicht', 'vertiefung', 'bonus'].includes(l.typ)));
  assert.ok(level.find((l) => l.nr === 1).module.includes('arena'));
  assert.doesNotMatch(JSON.stringify(t), /referenz|loesung|delta/i);
});

test('vertrag_pruefen.js ist eine unveränderte Kopie (Kennzeichen der maßgeblichen Fassung)', () => {
  const fs = require('node:fs');
  const text = fs.readFileSync(require.resolve('../scripts/vertrag_pruefen.js'), 'utf8');
  assert.match(text, /Maßgebliche Fassung: frankjuchim\/labs\/scripts\/vertrag_pruefen\.js/);
  assert.match(text, /Diese Datei wird unverändert in jede Plattform des Verbunds kopiert\./);
});
