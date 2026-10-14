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
  assert.equal((await patch({ einstellungen: { kursart: 'gA' } })).body.einstellungen.kursart, 'gA');
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

test('Kurs-Einstellungen: Level-Art und Auftrag; Schüler sehen sie über /api/meine-kurse', async () => {
  const { app, lk } = await kursMitLernstand();
  const patch = (einstellungen) => lk.patch('/api/lehrer/kurse/k%3A17').set(ORIGIN).send({ einstellungen });
  const e0 = (await lk.get('/api/lehrer/kurse/k%3A17')).body.einstellungen;
  assert.deepEqual([e0.levelArt[1], e0.levelArt[5], e0.levelArt[4], e0.auftrag], ['pflicht', 'vertiefung', 'bonus', null], 'Vorgabe aus worlds.js');
  assert.equal((await patch({ levelArt: { 17: 'pflicht' } })).status, 400);
  assert.equal((await patch({ levelArt: { 3: 'quatsch' } })).status, 400);
  assert.equal((await patch({ auftrag: { text: 'x'.repeat(401) } })).status, 400);
  assert.equal((await patch({ auftrag: { text: 'Hallo', level: [1, 2, 3, 4, 5] } })).status, 400);
  const e = (await patch({ levelArt: { 9: 'spaeter', 4: 'pflicht' }, auftrag: { text: '  Bis Freitag: Baukasten Stufe 1  ', level: [3, 3, 4] } })).body.einstellungen;
  assert.deepEqual([e.levelArt[9], e.levelArt[4], e.levelArt[1]], ['spaeter', 'pflicht', 'pflicht']);
  assert.deepEqual([e.auftrag.text, e.auftrag.level], ['Bis Freitag: Baukasten Stufe 1', [3, 4]]);
  // Schüler: nur eigene Kurse als Mitglied; Lehrkraft-Kurse nicht
  const mika = await H.angemeldet(app);
  const mk = (await mika.get('/api/meine-kurse')).body;
  assert.deepEqual(mk.map((k) => k.id), ['k:17']);
  assert.equal(mk[0].auftrag.text, 'Bis Freitag: Baukasten Stufe 1');
  assert.equal(mk[0].levelArt[9], 'spaeter');
  assert.deepEqual((await lk.get('/api/meine-kurse')).body, []);
  assert.equal((await request(app).get('/api/meine-kurse')).status, 401);
  // Auftrag löschen
  assert.equal((await patch({ auftrag: null })).body.einstellungen.auftrag, null);
});

test('Löschung über die Verbund-API vollständig: jede Tabelle mit Konto-Bezug, Kurs samt Einstellungen', async () => {
  const { app, lk } = await kursMitLernstand();
  const db = app.locals.db;
  const mika = await H.angemeldet(app);
  // Daten in allen Bereichen erzeugen: Lernstand (schon da), falsche Antwort, Training, Abzeichen
  const { DETEKTIV_FAELLE } = await import('../inhalte/detektiv.js');
  const auf = (await mika.get('/api/aufgaben/detektiv%3Afall-1')).body;
  const falsch = auf.aufgabe.optionen.find((o) => o.text !== DETEKTIV_FAELLE[0].optionen[0].text); // Optionen sind gemischt
  await mika.post('/api/aufgaben/detektiv%3Afall-1/pruefen').set(ORIGIN).send({ antwort: { wahl: falsch.id } });
  const r = (await mika.post('/api/training/sortierer/neu').set(ORIGIN).send({})).body;
  await mika.post(`/api/training/runde/${r.id}/antwort`).set(ORIGIN).send({ i: 0, typ: 3 });
  await mika.post(`/api/training/runde/${r.id}/ende`).set(ORIGIN).send({});
  await lk.patch('/api/lehrer/kurse/k%3A17').set(ORIGIN).send({ einstellungen: { auftrag: { text: 'Test' }, boss: 'offen' } });
  assert.equal((await mika.post('/api/boss/A/start').set(ORIGIN).send({})).status, 201); // Boss-Kampf
  const tabellen = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'").all().map((t) => t.name)
    .filter((t) => db.prepare(`PRAGMA table_info(${t})`).all().some((c) => c.name === 'sub'));
  assert.deepEqual(tabellen.sort(), ['abzeichen', 'boss_versuche', 'falsche_antworten', 'fortschritt', 'konten', 'kurs_mitglieder', 'training'].sort(), 'neue Tabelle mit sub? Dann auch in konten.loescheKonto aufnehmen');
  const zaehle = (sub) => Object.fromEntries(tabellen.map((t) => [t, db.prepare(`SELECT COUNT(*) AS n FROM ${t} WHERE sub = ?`).get(sub).n]));
  assert.ok(Object.values(zaehle('s:1042')).every((n) => n > 0), JSON.stringify(zaehle('s:1042')));
  const loeschen = (body) => request(app).post('/api/verbund/loeschen').set('Authorization', `Bearer ${H.verbundToken(app.now, 'loeschen')}`).send(body);
  // Kurs löschen: Kurs und Mitgliedschaften weg, Lernstand der Konten bleibt
  assert.equal((await loeschen({ kurs: 'k:17' })).status, 200);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM kurse WHERE id = 'k:17'").get().n, 0);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM kurs_mitglieder WHERE kurs_id = 'k:17'").get().n, 0);
  assert.ok(zaehle('s:1042').fortschritt > 0);
  // Konto löschen: überall weg, andere Konten unberührt
  const vorher = zaehle('s:7');
  assert.equal((await loeschen({ sub: 's:1042' })).status, 200);
  assert.ok(Object.values(zaehle('s:1042')).every((n) => n === 0), JSON.stringify(zaehle('s:1042')));
  assert.deepEqual(zaehle('s:7'), vorher);
});

test('Fallen-Profil: P1–P10, Fehlversuche je Falle, betroffene Schüler; Fallen im Katalog und im CSV', async () => {
  const { app, lk } = await kursMitLernstand();
  const { FALLEN, FALLEN_JE_TYP } = await import('../app/js/data/fallen.js');
  assert.deepEqual(FALLEN.map((f) => f.p), ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9', 'P10']);
  for (const l of Object.values(FALLEN_JE_TYP)) for (const p of l) assert.ok(FALLEN.some((f) => f.p === p), p);
  // Mika: zwei Fehlversuche im Detektiv (P3, P10)
  const { DETEKTIV_FAELLE } = await import('../inhalte/detektiv.js');
  const mika = await H.angemeldet(app);
  const auf = (await mika.get('/api/aufgaben/detektiv%3Afall-2')).body;
  const falsch = auf.aufgabe.optionen.find((o) => o.text !== DETEKTIV_FAELLE[1].optionen[0].text);
  for (let i = 0; i < 2; i++) await mika.post('/api/aufgaben/detektiv%3Afall-2/pruefen').set(ORIGIN).send({ antwort: { wahl: falsch.id } });
  const a = (await lk.get('/api/lehrer/kurse/k%3A17/auswertung')).body;
  const f = Object.fromEntries(a.fallen.map((x) => [x.p, x]));
  assert.equal(a.fallen.length, 10);
  assert.deepEqual([f.P10.fehlversuche, f.P10.schueler, f.P10.schuelerGesamt], [2, 1, 2]);
  // Ada hat die Baukasten-Lösung angesehen (P1, P3): zählt bei „betrifft“
  assert.equal(f.P1.angesehen, 1);
  assert.equal(f.P3.schueler, 2);
  assert.equal(f.P7.fehlversuche, 0);
  assert.deepEqual(a.aufgaben.find((x) => x.id === 'detektiv:fall-2').fallen, ['P3', 'P10']);
  const kat = (await lk.get('/api/katalog?modul=keller')).body.aufgaben;
  assert.deepEqual(kat.find((x) => x.art === 'tabelle').fallen, ['P7', 'P8', 'P2']);
  const c = (await lk.get('/api/lehrer/kurse/k%3A17/export.csv?art=fallen')).text;
  assert.ok(c.includes('P10;Operator verfehlt;'));
});

test('Fallen je Quizfrage: Zuordnung passt zu jeder Frage; falsche Antwort im ersten Durchgang zählt im Profil', async () => {
  const quiz = await import('../inhalte/quiz.js');
  const { FALLEN } = await import('../app/js/data/fallen.js');
  const gueltig = new Set(FALLEN.map((f) => f.p));
  for (const [teil, quelle] of [['welt', quiz.QUIZ_WELTEN], ['ds', quiz.QUIZ_DS]]) {
    for (const [k, q] of Object.entries(quelle)) {
      const l = quiz.QUIZ_FALLEN[teil][k];
      assert.equal(l?.length, q.fragen.length, `${teil} ${k}: eine Fallen-Liste je Frage`);
      for (const f of l) for (const p of f) assert.ok(gueltig.has(p), `${teil} ${k}: ${p}`);
    }
  }
  const { app, lk } = await kursMitLernstand();
  const mika = await H.angemeldet(app);
  // Exit-Ticket DS05 (alle drei Fragen P4): Frage 1 falsch, Frage 2 richtig
  const q = quiz.QUIZ_DS[5];
  const auf = (await mika.get('/api/aufgaben/quiz%3Ads-5')).body;
  assert.deepEqual((await lk.get('/api/katalog?modul=quiz')).body.aufgaben.find((x) => x.id === 'quiz:ds-5').fallen, ['P4']);
  const wahl = (i, richtig) => auf.aufgabe.fragen[i].optionen.find((o) => (o.text === q.fragen[i].optionen[0]) === richtig).id;
  await mika.post('/api/aufgaben/quiz%3Ads-5/pruefen').set(ORIGIN).send({ antwort: { frage: 0, wahl: wahl(0, false) } });
  await mika.post('/api/aufgaben/quiz%3Ads-5/pruefen').set(ORIGIN).send({ antwort: { frage: 1, wahl: wahl(1, true) } });
  const p4 = (await lk.get('/api/lehrer/kurse/k%3A17/auswertung')).body.fallen.find((f) => f.p === 'P4');
  assert.deepEqual([p4.quizFalsch, p4.schueler], [1, 1]);
  assert.ok((await lk.get('/api/lehrer/kurse/k%3A17/export.csv?art=fallen')).text.includes('falsch im Level-Quiz'));
});
