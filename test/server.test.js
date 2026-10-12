'use strict';
// Auslieferung der App: gleiche Regeln wie bisher app/nginx.conf (Cache, Sicherheits-Header, gzip, keine Testdateien).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const request = require('supertest');
const H = require('./helpers');
const { openDatabase, SCHEMA_VERSION, getMeta } = require('../src/db');

test('Startseite: index.html ohne langen Cache, CSP nur eigene Dateien, noindex', async () => {
  const app = await H.makeApp();
  const r = await request(app).get('/');
  assert.equal(r.status, 200);
  assert.match(r.text, /<div id="app">|id="app"/);
  assert.equal(r.headers['cache-control'], 'no-cache');
  const csp = r.headers['content-security-policy'];
  assert.match(csp, /default-src 'self'/);
  assert.match(csp, /script-src 'self' 'wasm-unsafe-eval'(;|$)/, 'keine Inline-Skripte');
  assert.doesNotMatch(csp, /script-src[^;]*unsafe-inline/);
  assert.doesNotMatch(csp, /https?:/, 'keine externen Quellen');
  assert.equal(r.headers['referrer-policy'], 'no-referrer');
  assert.equal(r.headers['x-content-type-options'], 'nosniff');
  assert.match(r.headers['x-robots-tag'], /noindex/);
  assert.equal(r.headers['x-powered-by'], undefined);
});

test('Cache-Regeln wie bisher: JS/CSS 1 h, Schriften/Bilder 30 Tage, Graphviz 30 Tage', async () => {
  const app = await H.makeApp();
  assert.equal((await request(app).get('/js/main.js')).headers['cache-control'], 'public, max-age=3600, must-revalidate');
  assert.equal((await request(app).get('/css/app.css')).headers['cache-control'], 'public, max-age=3600, must-revalidate');
  assert.equal((await request(app).get('/assets/favicon.svg')).headers['cache-control'], 'public, max-age=2592000, immutable');
  const font = fs.readdirSync(path.join(__dirname, '..', 'app', 'assets', 'fonts')).find((f) => f.endsWith('.woff2'));
  assert.equal((await request(app).get('/assets/fonts/' + font)).headers['cache-control'], 'public, max-age=2592000, immutable');
  assert.equal((await request(app).get('/vendor/viz.js')).headers['cache-control'], 'public, max-age=2592000');
  assert.match((await request(app).get('/js/main.js')).headers['content-type'], /javascript/);
});

test('gzip für große Dateien (Graphviz)', async () => {
  const app = await H.makeApp();
  const r = await request(app).get('/vendor/viz.js').set('Accept-Encoding', 'gzip');
  assert.equal(r.status, 200);
  assert.equal(r.headers['content-encoding'], 'gzip');
});

test('Nur die App wird ausgeliefert: keine Tests, Doku, Quellen des Servers', async () => {
  const app = await H.makeApp();
  for (const p of ['/tests/engine.test.js', '/README.md', '/ARCHITECTURE.md', '/package.json', '/nginx.conf', '/../src/app.js', '/js/../../src/app.js', '/.env', '/css/gibtsnicht.css', '/js/gibtsnicht.js']) {
    const r = await request(app).get(p);
    assert.ok(r.status === 404 || (r.status === 200 && /id="app"/.test(r.text) && !/\.(js|md|json|css|conf|env)$/.test(p)), `${p} → ${r.status}`);
    assert.notEqual(r.status, 500);
  }
});

test('Unbekannte Pfade ohne Dateiendung liefern wie bisher die App (QR-Codes: BASE_URL + #/route)', async () => {
  const app = await H.makeApp();
  for (const p of ['/index.html', '/irgendwas', '/arena']) {
    const r = await request(app).get(p);
    assert.equal(r.status, 200, p);
    assert.equal(r.headers['cache-control'], 'no-cache');
  }
  assert.equal((await request(app).get('/api/gibtsnicht')).status, 404);
});

test('Datenbank: Migrationen beim ersten Start, Daten bleiben beim Neustart erhalten', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'al-db-'));
  const datei = path.join(dir, 'unter', 'automatenlab.db');
  let db = openDatabase(datei);
  assert.equal(Number(getMeta(db, 'schema_version')), SCHEMA_VERSION);
  assert.equal(getMeta(db, 'app'), 'automatenlab');
  db.prepare("INSERT INTO meta (key, value) VALUES ('probe', '42')").run();
  db.close();
  db = openDatabase(datei);
  assert.equal(getMeta(db, 'probe'), '42');
  db.close();
  // fremde Datenbank wird nicht angefasst
  const fremd = path.join(dir, 'fremd.db');
  const f = openDatabase(fremd);
  f.prepare("UPDATE meta SET value = 'infolabs-portal' WHERE key = 'app'").run();
  f.close();
  assert.throws(() => openDatabase(fremd), /nicht zu AutomatenLab/);
  // fremde Datenbank ohne meta-Tabelle wird weder migriert noch gestempelt
  const Database = require('better-sqlite3');
  const ohneMeta = path.join(dir, 'ohne-meta.db');
  const o = new Database(ohneMeta);
  o.exec('CREATE TABLE notizen (id INTEGER PRIMARY KEY)');
  o.close();
  assert.throws(() => openDatabase(ohneMeta), /nicht zu AutomatenLab/);
  const pruef = new Database(ohneMeta);
  assert.deepEqual(pruef.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map((r) => r.name), ['notizen']);
  pruef.close();
});
