'use strict';
// Zusätzliche Materialien: Schüler-PDF (angemeldet, Schüler mit Kurs), Lehrkraft-PDF (Lehrkräfte), Originale und
// ZIP (nur Admin); nur verzeichnete Dateien (Whitelist), keine Pfadtricks. Rechte für jede Rolle.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const request = require('supertest');
const H = require('./helpers');

function fixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'al-material-'));
  for (const d of ['schueler', 'lehrkraft', 'original']) fs.mkdirSync(path.join(dir, d));
  fs.writeFileSync(path.join(dir, 'schueler', 'DS01_AB.pdf'), '%PDF-schueler');
  fs.writeFileSync(path.join(dir, 'lehrkraft', 'DS01_Lehrkraft.pdf'), '%PDF-lehrkraft');
  fs.writeFileSync(path.join(dir, 'original', 'DS01_AB.docx'), 'docx-original');
  fs.writeFileSync(path.join(dir, 'original', 'DS01_Lehrkraft.docx'), 'docx-lehrkraft');
  fs.writeFileSync(path.join(dir, 'geheim.txt'), 'nicht verzeichnet');
  fs.writeFileSync(path.join(dir, 'schueler', 'DS02_AB.pdf'), '%PDF-demo');
  fs.writeFileSync(path.join(dir, 'lehrkraft', 'DS02_Lehrkraft.pdf'), '%PDF-demo-lk');
  fs.writeFileSync(path.join(dir, 'original', 'DS02_AB.docx'), 'docx-demo');
  fs.writeFileSync(path.join(dir, 'verzeichnis.json'), JSON.stringify({ version: 1, akten: [
    { id: 'level-1', titel: 'Level 1: Ein Automat hört zu', welt: 'A', level: 1, niveau: 'alle', dateien: [
      { titel: 'Arbeitsblatt', art: 'arbeitsblatt', schueler: 'schueler/DS01_AB.pdf', original: 'original/DS01_AB.docx', bytes: { schueler: 13 } },
      { titel: 'Lehrkraft-Handreichung mit Lösungen', art: 'loesung', lehrkraft: 'lehrkraft/DS01_Lehrkraft.pdf', original: 'original/DS01_Lehrkraft.docx' },
      { titel: 'Kaputt', art: 'x', schueler: '../geheim.txt', lehrkraft: 'lehrkraft/fehlt.pdf' }
    ] },
    { id: 'level-2', titel: 'Level 2', welt: 'A', level: 2, niveau: 'alle', dateien: [
      { titel: 'Arbeitsblatt', art: 'arbeitsblatt', schueler: 'schueler/DS02_AB.pdf', lehrkraft: 'lehrkraft/DS02_Lehrkraft.pdf', original: 'original/DS02_AB.docx',
        demo: ['schueler', 'lehrkraft', 'original'] }
    ] },
    { id: 'klausur-ea', titel: 'Übungsklausur', welt: null, niveau: 'eA', dateien: [
      { titel: 'Klausur', art: 'klausur', lehrkraft: 'lehrkraft/DS01_Lehrkraft.pdf' }
    ] }
  ] }));
  return dir;
}

async function rollen() {
  const app = await H.verbundApp({ materialDir: fixture() });
  return {
    app,
    gast: request(app),
    schuelerOhneKurs: await H.angemeldet(app, { sub: 's:7', kurse: [] }),
    schueler: await H.angemeldet(app),
    lehrkraft: await H.angemeldet(app, { sub: 'l:5', rolle: 'lehrkraft', name: 'Frau Beispiel', kurse: [{ id: 'k:17', name: 'LK', rolle: 'lehrkraft' }] }),
    superadmin: await H.angemeldet(app, { sub: 'a:1', rolle: 'superadmin', name: 'Admin', kurse: [] })
  };
}

test('Rechte je Rolle: Schüler-PDF, Lehrkraft-PDF, Original, ZIP, Übersicht', async () => {
  const r = await rollen();
  const faelle = [
    ['/api/material', { gast: 200, schuelerOhneKurs: 200, schueler: 200, lehrkraft: 200, superadmin: 200 }],
    // Demo (Gastmodus): ausgewählte Schüler- und Lehrkraft-PDFs für alle – Originale nie
    ['/material/schueler/DS02_AB.pdf', { gast: 200, schuelerOhneKurs: 200, schueler: 200, lehrkraft: 200, superadmin: 200 }],
    ['/material/lehrkraft/DS02_Lehrkraft.pdf', { gast: 200, schuelerOhneKurs: 200, schueler: 200 }],
    ['/material/original/DS02_AB.docx', { gast: 401, schuelerOhneKurs: 403, schueler: 403, lehrkraft: 403, superadmin: 200 }],
    ['/material/schueler/DS01_AB.pdf', { gast: 401, schuelerOhneKurs: 403, schueler: 200, lehrkraft: 200, superadmin: 200 }],
    ['/material/lehrkraft/DS01_Lehrkraft.pdf', { gast: 401, schuelerOhneKurs: 403, schueler: 403, lehrkraft: 200, superadmin: 200 }],
    ['/material/original/DS01_AB.docx', { gast: 401, schuelerOhneKurs: 403, schueler: 403, lehrkraft: 403, superadmin: 200 }],
    ['/material/zip/level-1.zip', { gast: 401, schuelerOhneKurs: 403, schueler: 403, lehrkraft: 403, superadmin: 200 }],
    // nicht verzeichnet, fehlend oder Pfadtricks: immer 404 – auch für den Admin
    ['/material/schueler/geheim.txt', { gast: 404, schueler: 404, lehrkraft: 404, superadmin: 404 }],
    ['/material/lehrkraft/fehlt.pdf', { gast: 404, lehrkraft: 404, superadmin: 404 }],
    ['/material/schueler/..%2Fgeheim.txt', { gast: 404, superadmin: 404 }],
    ['/material/verzeichnis.json/x', { superadmin: 404 }],
    ['/material/zip/gibtsnicht.zip', { gast: 404, superadmin: 404 }]
  ];
  for (const [pfad, erwartet] of faelle) {
    for (const [rolle, status] of Object.entries(erwartet)) {
      const res = await r[rolle].get(pfad);
      assert.equal(res.status, status, `${rolle} ${pfad}`);
      if (pfad.startsWith('/material/')) assert.equal(res.headers['cache-control'], 'private, no-store', pfad);
    }
  }
});

test('Gast und Schüler ohne Kurs: Übersicht nur mit den Demo-Dateien (Schüler- und Lehrkraftfassung, ohne Original)', async () => {
  const r = await rollen();
  for (const rolle of ['gast', 'schuelerOhneKurs']) {
    const g = (await r[rolle].get('/api/material')).body;
    assert.equal(g.demo, true, rolle);
    assert.deepEqual(g.stufen, []);
    assert.deepEqual(g.akten.map((a) => a.id), ['level-2'], rolle);
    const d = g.akten[0].dateien[0];
    assert.equal(d.schueler.url, '/material/schueler/DS02_AB.pdf');
    assert.equal(d.lehrkraft.url, '/material/lehrkraft/DS02_Lehrkraft.pdf');
    assert.ok(!d.original && !g.akten[0].zip, 'Originale nie in der Demo');
  }
});

test('Übersicht zeigt je Rolle nur erlaubte Dateien; Schüler sehen keine Lösungen und keine Lehrkraft-Akten', async () => {
  const r = await rollen();
  const s = (await r.schueler.get('/api/material')).body;
  assert.deepEqual(s.stufen, ['schueler']);
  assert.deepEqual(s.akten.map((a) => a.id), ['level-1', 'level-2'], 'Klausur-Akte nur für Lehrkräfte');
  assert.deepEqual(s.akten[0].dateien.map((d) => d.titel), ['Arbeitsblatt']);
  assert.equal(s.akten[0].dateien[0].schueler.url, '/material/schueler/DS01_AB.pdf');
  assert.equal(s.demo, false);
  assert.ok(!JSON.stringify(s).includes('lehrkraft/') && !JSON.stringify(s).includes('original/') && !s.akten[0].zip);

  const l = (await r.lehrkraft.get('/api/material')).body;
  assert.deepEqual(l.stufen, ['schueler', 'lehrkraft']);
  assert.deepEqual(l.akten.map((a) => a.id), ['level-1', 'level-2', 'klausur-ea']);
  assert.ok(!JSON.stringify(l).includes('original/') && !l.akten[0].zip, 'Originale nur für den Admin');
  assert.ok(!JSON.stringify(l).includes('geheim') && !JSON.stringify(l).includes('fehlt.pdf'), 'nicht verzeichnete/fehlende Dateien erscheinen nicht');

  const a = (await r.superadmin.get('/api/material')).body;
  assert.deepEqual(a.stufen, ['schueler', 'lehrkraft', 'original']);
  assert.equal(a.akten[0].zip, '/material/zip/level-1.zip');
  assert.equal(a.akten[0].dateien[0].original.url, '/material/original/DS01_AB.docx');
});

test('Downloads: PDF inline, Original als Anhang, ZIP enthält alle Originale der Akte', async () => {
  const r = await rollen();
  const pdf = await r.schueler.get('/material/schueler/DS01_AB.pdf');
  assert.match(pdf.headers['content-type'], /application\/pdf/);
  assert.match(pdf.headers['content-disposition'], /^inline/);
  const orig = await r.superadmin.get('/material/original/DS01_AB.docx');
  assert.match(orig.headers['content-disposition'], /^attachment/);
  const z = await r.superadmin.get('/material/zip/level-1.zip').buffer(true).parse((res, cb) => { const b = []; res.on('data', (c) => b.push(c)); res.on('end', () => cb(null, Buffer.concat(b))); });
  assert.match(z.headers['content-type'], /application\/zip/);
  assert.match(z.headers['content-disposition'], /AutomatenLab_level-1\.zip/);
  const text = z.body.toString('latin1');
  assert.ok(text.startsWith('PK\u0003\u0004'));
  assert.ok(text.includes('DS01_AB.docx') && text.includes('DS01_Lehrkraft.docx') && text.includes('docx-original'));
});

test('Ohne Materialordner: leere Übersicht, Manifest ohne Fähigkeit lehrkraft-materialien', async () => {
  const app = await H.verbundApp({ materialDir: null });
  const l = await H.angemeldet(app, { sub: 'l:5', rolle: 'lehrkraft', name: 'Frau Beispiel', kurse: [] });
  assert.deepEqual((await l.get('/api/material')).body.akten, []);
  assert.ok(!(await request(app).get('/api/plattform')).body.faehigkeiten.includes('lehrkraft-materialien'));
  const mit = await H.verbundApp({ materialDir: fixture() });
  assert.ok((await request(mit).get('/api/plattform')).body.faehigkeiten.includes('lehrkraft-materialien'));
});

test('Echtes Materialverzeichnis (materials/pdf): jede verzeichnete Datei existiert, Schüler-PDFs nie aus lehrkraft/', () => {
  const dir = path.join(__dirname, '..', 'materials', 'pdf');
  const v = JSON.parse(fs.readFileSync(path.join(dir, 'verzeichnis.json'), 'utf8'));
  assert.ok(v.akten.length >= 20);
  assert.ok(v.akten.find((a) => a.id === 'level-1').dateien.some((d) => d.demo), 'Level 1 hat Demo-Dateien');
  assert.equal(v.akten.flatMap((a) => a.dateien).filter((d) => d.demo).length, 4);
  for (const a of v.akten) {
    for (const d of a.dateien) {
      for (const s of ['schueler', 'lehrkraft', 'original']) if (d[s]) assert.ok(d[s].startsWith(s + '/') && fs.existsSync(path.join(dir, d[s])), d[s]);
      if (d.art === 'loesung' || d.art === 'klausur') assert.ok(!d.schueler, `${a.id}: ${d.titel} darf keine Schülerfassung haben`);
      if (d.demo) {
        assert.equal(a.id, 'level-1', 'Demo nur in der Akte Level 1 (app/js/data/gast.js)');
        assert.ok(!d.demo.includes('original'), 'Originale nie in der Demo');
      }
    }
  }
});
