'use strict';
// Klassen-Challenges (PR 11): Zeitraum zählt, Einzel-Rangliste bzw. Team-Summen ohne Einzelwerte, nur Challenge-Liste
// (keine Punkte), Abzeichen nach dem Ende, Rechte, Beamer-Board.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const H = require('./helpers');

const ORIGIN = { Origin: 'http://127.0.0.1', Host: '127.0.0.1' };
const KURS = [{ id: 'k:17', name: 'LK', rolle: 'mitglied' }];
const LK = { sub: 'l:5', rolle: 'lehrkraft', name: 'Frau Beispiel', kurse: [{ id: 'k:17', name: 'LK', rolle: 'lehrkraft' }] };
const TAG = 86400000;

async function start() {
  const app = await H.verbundApp();
  const mika = await H.angemeldet(app);
  const ada = await H.angemeldet(app, { sub: 's:7', name: 'Ada L.', kurse: KURS });
  const ben = await H.angemeldet(app, { sub: 's:8', name: 'Ben K.', kurse: KURS });
  const lea = await H.angemeldet(app, { sub: 's:9', name: 'Lea S.', kurse: KURS });
  const lk = await H.angemeldet(app, LK);
  const zeit = (ms) => new Date(app.now() + ms).toISOString();
  const neu = (body) => lk.post('/api/lehrer/kurse/k%3A17/challenges').set(ORIGIN).send({ start: zeit(0), ende: zeit(7 * TAG), ...body });
  return { app, mika, ada, ben, lea, lk, zeit, neu };
}

/** Baukasten-Challenge 1 mit der Musterlösung lösen. */
async function loese(agent, nr = 0) {
  const { BAUKASTEN_CHALLENGES } = await import('../inhalte/baukasten.js');
  const c = BAUKASTEN_CHALLENGES[nr];
  return agent.post(`/api/aufgaben/${encodeURIComponent('baukasten:' + c.id)}/pruefen`).set(ORIGIN).send({ antwort: { automat: c.referenz } });
}

test('Einzel-Wertung mit Aufgaben: nur im Zeitraum gelöste zählen, Platz wie Rangliste, keine Punkte, Abzeichen am Ende', async () => {
  const { app, mika, ada, ben, lk, neu } = await start();
  const { BAUKASTEN_CHALLENGES } = await import('../inhalte/baukasten.js');
  const ids = BAUKASTEN_CHALLENGES.slice(0, 3).map((c) => `baukasten:${c.id}`);
  await loese(ben, 0); // vor der Challenge: zählt nicht
  app.now.vor(1000);
  const r = await neu({ titel: 'Baukasten-Woche', art: 'aufgaben', aufgaben: ids, wertung: 'einzel' });
  assert.equal(r.status, 201);
  const id = r.body.id;
  app.now.vor(1000);
  await loese(mika, 0); await loese(mika, 1); await loese(ada, 0);
  const punkteVorher = (await mika.get('/api/lernstand')).body.punkte;
  const d = (await ada.get(`/api/challenges/${id}`)).body;
  assert.equal(d.phase, 'laeuft');
  assert.match(d.zaehlt, /gelöste Aufgaben aus einer Auswahl von 3/);
  assert.deepEqual(d.liste.map((z) => [z.name, z.wert, z.platz]), [['Mika R.', 2, 1], ['Ada L.', 1, 2], ['Ben K.', 0, 3], ['Lea S.', 0, 3]]);
  assert.deepEqual(d.liste.filter((z) => z.ich).map((z) => z.name), ['Ada L.']);
  assert.doesNotMatch(JSON.stringify(d), /s:\d/);
  assert.equal((await mika.get('/api/lernstand')).body.punkte, punkteVorher, 'Challenge gibt keine Punkte');
  // nach dem Ende gelöst: zählt nicht; Abzeichen für Platz 1 und 2, nicht für 0
  app.now.vor(8 * TAG);
  await loese(ben, 1);
  const e = (await mika.get(`/api/challenges/${id}`)).body;
  assert.equal(e.phase, 'beendet');
  assert.equal(e.liste.find((z) => z.name === 'Ben K.').wert, 0);
  assert.ok((await mika.get('/api/lernstand')).body.badges.includes('challenge-sieg'));
  assert.ok((await ada.get('/api/lernstand')).body.badges.includes('challenge-podium'));
  assert.ok(!(await ben.get('/api/lernstand')).body.badges.includes('challenge-podium'));
  // Liste für Schüler
  assert.deepEqual((await ada.get('/api/challenges')).body.map((c) => [c.titel, c.phase, c.kurs]), [['Baukasten-Woche', 'beendet', 'LK']]);
  assert.equal((await lk.get('/api/lehrer/kurse/k%3A17/challenges')).body.length, 1);
});

test('Team-Wertung mit Training: Teams gleich groß, nur Summen und eigener Beitrag sichtbar; Board zeigt laufende Challenge', async () => {
  const { app, mika, ada, lk, neu } = await start();
  const r = await neu({ titel: 'Arena-Duell', art: 'training', modul: 'sortierer', wertung: 'team', teams: 2 });
  assert.equal(r.status, 201);
  const id = r.body.id;
  const lkSicht = (await lk.get(`/api/lehrer/challenges/${id}`)).body;
  assert.deepEqual(lkSicht.teams.map((t) => t.mitglieder).sort(), [2, 2]);
  assert.equal(lkSicht.teams.flatMap((t) => t.namen).length, 4, 'Lehrkraft sieht die Teams');
  // Mika spielt eine Sortierer-Runde mit einer richtigen Karte
  const { SORTIERER_KARTEN } = await import('../inhalte/sortierer.js');
  app.now.vor(1000);
  const runde = (await mika.post('/api/training/sortierer/neu').set(ORIGIN).send({})).body;
  for (let i = 0; i < runde.items.length; i++) {
    const typ = SORTIERER_KARTEN.find((k) => k.text === runde.items[i].text).typ; // alle richtig
    await mika.post(`/api/training/runde/${runde.id}/antwort`).set(ORIGIN).send({ i, typ });
  }
  await mika.post(`/api/training/runde/${runde.id}/ende`).set(ORIGIN).send({});
  const richtig = app.locals.db.prepare('SELECT richtig FROM training WHERE id = ?').get(runde.id).richtig;
  const s = (await mika.get(`/api/challenges/${id}`)).body;
  assert.equal(s.liste, undefined, 'keine Einzel-Rangliste im Team-Modus');
  assert.equal(s.teams.reduce((n, t) => n + t.wert, 0), richtig);
  assert.equal(s.ich.beitrag, richtig);
  assert.ok(['Team Akzeptor', 'Team Keller'].includes(s.ich.team));
  assert.doesNotMatch(JSON.stringify(s), /namen|Ada L\.|s:\d/, 'keine Namen anderer');
  // Beamer-Board zeigt die laufende Challenge
  const e = (await lk.patch('/api/lehrer/kurse/k%3A17').set(ORIGIN).send({ einstellungen: { beamer: { aktiv: true } } })).body.einstellungen;
  const b = (await request(app).get(`/api/board/${e.beamer.token}`)).body;
  assert.equal(b.challenges[0].titel, 'Arena-Duell');
  assert.equal(b.challenges[0].teams.length, 2);
  assert.doesNotMatch(JSON.stringify(b.challenges), /namen|s:\d/);
  // vorzeitig beenden → Teamsieg-Abzeichen, wenn das Siegerteam etwas hat
  const fertig = (await lk.post(`/api/lehrer/challenges/${id}/beenden`).set(ORIGIN).send({})).body;
  assert.equal(fertig.phase, 'beendet');
  const badges = (await mika.get('/api/lernstand')).body.badges;
  assert.ok(richtig > 0);
  assert.ok(badges.includes('challenge-team'));
  assert.equal((await ada.get(`/api/challenges/${id}`)).status, 200);
});

test('Eingaben und Rechte: Fehlertexte auf Deutsch, fremde Kurse 404, Schüler dürfen nichts anlegen; geplant zeigt keine Liste', async () => {
  const { app, mika, lk, neu, zeit } = await start();
  const f = async (body) => { const r = await neu(body); assert.equal(r.status, 400, JSON.stringify(body)); return r.body.error; };
  assert.match(await f({ titel: 'x', art: 'training', modul: 'arena', wertung: 'einzel' }), /Titel/);
  assert.match(await f({ titel: 'Test', art: 'training', modul: 'schach', wertung: 'einzel' }), /Training/);
  assert.match(await f({ titel: 'Test', art: 'aufgaben', aufgaben: [], wertung: 'einzel' }), /1 bis 100/);
  assert.match(await f({ titel: 'Test', art: 'aufgaben', aufgaben: ['gibt:es-nicht'], wertung: 'einzel' }), /gibt es nicht/);
  assert.match(await f({ titel: 'Test', art: 'training', modul: 'arena', wertung: 'team', teams: 9 }), /2 bis 6/);
  assert.match(await f({ titel: 'Test', art: 'training', modul: 'arena', wertung: 'einzel', ende: zeit(-1000), start: zeit(-5000) }), /Vergangenheit/);
  assert.match(await f({ titel: 'Test', art: 'training', modul: 'arena', wertung: 'einzel', ende: zeit(90 * TAG) }), /höchstens 60 Tage/);
  const g = (await neu({ titel: 'Nächste Woche', art: 'training', modul: 'arena', wertung: 'einzel', start: zeit(TAG), ende: zeit(2 * TAG) })).body;
  const sicht = (await mika.get(`/api/challenges/${g.id}`)).body;
  assert.equal(sicht.phase, 'geplant');
  assert.equal(sicht.liste, undefined);
  assert.equal((await mika.post('/api/lehrer/kurse/k%3A17/challenges').set(ORIGIN).send({})).status, 403);
  const fremd = await H.angemeldet(app, { sub: 's:30', name: 'Lou F.', kurse: [{ id: 'k:30', name: 'GK', rolle: 'mitglied' }] });
  assert.equal((await fremd.get(`/api/challenges/${g.id}`)).status, 404);
  const lk2 = await H.angemeldet(app, { sub: 'l:6', rolle: 'lehrkraft', name: 'Herr Anders', kurse: [{ id: 'k:30', name: 'GK', rolle: 'lehrkraft' }] });
  assert.equal((await lk2.get(`/api/lehrer/challenges/${g.id}`)).status, 404);
  assert.equal((await lk2.delete(`/api/lehrer/challenges/${g.id}`).set(ORIGIN)).status, 404);
  assert.equal((await lk.delete(`/api/lehrer/challenges/${g.id}`).set(ORIGIN)).status, 200);
  assert.equal((await mika.get(`/api/challenges/${g.id}`)).status, 404);
  assert.equal((await request(app).get('/api/challenges')).status, 401);
});
