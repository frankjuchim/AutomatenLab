'use strict';
// Live-Runden (Fähigkeit „live“, Vertrag v1.3 §7): Ablauf lobby → frage → aufgedeckt → … → ende, Lösung erst beim
// Aufdecken, Zeitlimit, keine Lab-Punkte, keine Namen auf dem Beamer, Server-Sent Events, Löschung über den Verbund.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const H = require('./helpers');

const ORIGIN = { Origin: 'http://127.0.0.1', Host: '127.0.0.1' };
const KURS = [{ id: 'k:17', name: 'LK', rolle: 'mitglied' }];
const LK = { sub: 'l:5', rolle: 'lehrkraft', name: 'Frau Beispiel', kurse: [{ id: 'k:17', name: 'LK', rolle: 'lehrkraft' }] };

async function start(body = { art: 'quiz', welt: 'A', anzahl: 5, sekunden: 20 }) {
  const app = await H.verbundApp();
  const mika = await H.angemeldet(app);
  const ada = await H.angemeldet(app, { sub: 's:7', name: 'Ada L.', kurse: KURS });
  const lk = await H.angemeldet(app, LK);
  const r = await lk.post('/api/lehrer/kurse/k%3A17/live').set(ORIGIN).send(body);
  const weiter = () => lk.post('/api/lehrer/kurse/k%3A17/live/weiter').set(ORIGIN).send({});
  const antwort = (agent, nr, wahl) => agent.post('/api/live/k%3A17/antwort').set(ORIGIN).send({ nr, wahl });
  return { app, mika, ada, lk, r, weiter, antwort };
}

test('Ablauf: Lobby, Frage ohne Lösung, Antwort einmal, Aufdecken mit Lösung und Verteilung, Ende ohne Namen', async () => {
  const { app, mika, ada, lk, r, weiter, antwort } = await start();
  assert.equal(r.status, 201);
  assert.equal(r.body.phase, 'lobby');
  assert.equal(r.body.anzahl, 5);
  assert.deepEqual((await mika.get('/api/live')).body, [{ kurs: 'k:17', kursName: 'LK', rolle: 'mitglied', titel: 'Level-Quiz Welt A' }]);

  const f = (await weiter()).body;
  assert.equal(f.phase, 'frage');
  assert.equal(f.nr, 0);
  const s = (await mika.get('/api/live/k%3A17')).body;
  assert.equal(s.frage.text, f.frage.text);
  assert.equal(s.auswertung, undefined);
  assert.equal(f.auswertung, undefined);
  assert.doesNotMatch(JSON.stringify(s) + JSON.stringify(f), /erklaerung|"richtig":"/, 'keine Lösung vor dem Aufdecken');
  const ids = s.frage.optionen.map((o) => o.id);
  if (ids[0] === 'w') assert.deepEqual(ids, ['w', 'f'], 'wahr/falsch');
  else assert.deepEqual(ids, ['a', 'b', 'c', 'd'].slice(0, ids.length), 'Kennungen in Anzeigereihenfolge');

  const optionen = s.frage.optionen.map((o) => o.id);
  assert.equal((await antwort(mika, 0, optionen[0])).status, 200);
  assert.equal((await antwort(mika, 0, optionen[1])).status, 409, 'nur eine Antwort je Frage');
  assert.equal((await antwort(ada, 0, 'zz')).status, 400);
  assert.equal((await antwort(ada, 1, optionen[0])).status, 409, 'falsche Frage');
  assert.equal((await lk.get('/api/lehrer/kurse/k%3A17/live')).body.beantwortet, 1);

  const auf = (await weiter()).body;
  assert.equal(auf.phase, 'aufgedeckt');
  assert.ok(optionen.includes(auf.auswertung.richtig));
  assert.equal(auf.auswertung.antworten, 1);
  const sm = (await mika.get('/api/live/k%3A17')).body;
  assert.equal(sm.auswertung.richtig, auf.auswertung.richtig);
  assert.equal(sm.meineWahl, optionen[0]);
  assert.equal(sm.ich.richtig, optionen[0] === auf.auswertung.richtig ? 1 : 0);
  assert.equal((await antwort(ada, 0, optionen[0])).status, 409, 'nach dem Aufdecken keine Antwort mehr');

  for (let i = 1; i < 5; i++) { await weiter(); await weiter(); }
  const ende = (await weiter()).body;
  assert.equal(ende.phase, 'ende');
  assert.equal(ende.fragen.length, 5);
  assert.equal(ende.richtigVerteilung.reduce((a, b) => a + b, 0), ende.teilnehmer);
  assert.doesNotMatch(JSON.stringify(ende), /Mika|Ada|s:1042|s:7/, 'keine Namen oder sub auf dem Beamer');
  assert.equal((await weiter()).status, 409);
  // keine Lab-Punkte
  const db = app.locals.db;
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM fortschritt').get().n, 0);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM training').get().n, 0);
  assert.deepEqual((await mika.get('/api/live')).body, [], 'beendete Runde nicht mehr auf der Startseite');
  assert.deepEqual((await lk.post('/api/lehrer/kurse/k%3A17/live/beenden').set(ORIGIN).send({})).body, { ok: true, beendet: true });
  assert.equal((await mika.get('/api/live/k%3A17')).body.aktiv, false);
});

test('Zeitlimit: nach Ablauf keine Antwort; schneller richtig = mehr Punkte der Runde', async () => {
  const { app, mika, ada, lk, weiter, antwort } = await start({ art: 'sortierer', anzahl: 5, sekunden: 20 });
  await weiter();
  const auf0 = async () => {
    const s = (await mika.get('/api/live/k%3A17')).body;
    return s;
  };
  const s = await auf0();
  assert.deepEqual(s.frage.optionen.map((o) => o.id), ['3', '2', '0'], 'drei Fächer wie im Sortierer');
  // Lehrkraft-Ansicht verrät die Lösung vor dem Aufdecken ebenfalls nicht
  assert.equal((await lk.get('/api/lehrer/kurse/k%3A17/live')).body.auswertung, undefined);
  app.now.vor(2000);
  // Mika wählt nacheinander nicht – wir wissen die Lösung nicht; also beide gleich wählen, Mika schneller
  assert.equal((await antwort(mika, 0, '3')).status, 200);
  app.now.vor(10000);
  assert.equal((await antwort(ada, 0, '3')).status, 200);
  await weiter(); // aufdecken
  const pm = (await mika.get('/api/live/k%3A17')).body.ich;
  const pa = (await ada.get('/api/live/k%3A17')).body.ich;
  if (pm.richtig) assert.ok(pm.punkte > pa.punkte && pa.punkte >= 100);
  else assert.deepEqual([pm.punkte, pa.punkte], [0, 0]);
  await weiter(); // Frage 2
  app.now.vor(21000);
  assert.equal((await antwort(mika, 1, '3')).status, 409, 'Zeit abgelaufen');
});

test('Eingaben: Quelle, Anzahl, Zeit; nur eine Runde je Kurs; Arena mit Automat und Wort', async () => {
  const { lk, mika, weiter } = await start({ art: 'arena', stufe: 2, anzahl: 8, sekunden: 0 });
  const neu = (body) => lk.post('/api/lehrer/kurse/k%3A17/live').set(ORIGIN).send(body);
  assert.equal((await neu({ art: 'quiz', welt: 'A', anzahl: 5, sekunden: 20 })).status, 409, 'schon eine Runde');
  await weiter();
  const s = (await mika.get('/api/live/k%3A17')).body;
  assert.equal(s.frage.art, 'arena');
  assert.equal(typeof s.frage.automat, 'string');
  assert.ok(Array.isArray(s.frage.wort));
  assert.equal(s.bis, null, 'ohne Zeitlimit');
  await lk.post('/api/lehrer/kurse/k%3A17/live/beenden').set(ORIGIN).send({});
  for (const body of [{}, { art: 'quiz', welt: 'E', anzahl: 5, sekunden: 20 }, { art: 'quiz', welt: 'A', anzahl: 7, sekunden: 20 }, { art: 'arena', stufe: 4, anzahl: 5, sekunden: 20 }, { art: 'sortierer', anzahl: 5, sekunden: 17 }]) {
    assert.equal((await neu(body)).status, 400, JSON.stringify(body));
  }
});

test('Server-Sent Events: Zustand sofort und bei jeder Änderung, je Rolle passend', async () => {
  const { app, mika, weiter } = await start();
  const server = app.listen(0, '127.0.0.1');
  await new Promise((ok) => server.once('listening', ok));
  const basis = `http://127.0.0.1:${server.address().port}`;
  // Sitzungs-Cookie des Agenten übernehmen
  const cookie = (await mika.get('/api/sitzung')).request.cookies;
  const ab = new AbortController();
  try {
    const r = await fetch(basis + '/api/live/k%3A17/strom', { headers: { Cookie: cookie }, signal: ab.signal });
    assert.equal(r.status, 200);
    assert.match(r.headers.get('content-type'), /text\/event-stream/);
    assert.equal(r.headers.get('content-encoding'), null, 'nicht komprimiert');
    const leser = r.body.getReader();
    let puffer = '';
    const naechstes = async () => {
      for (;;) {
        const i = puffer.indexOf('\n\n');
        if (i >= 0) {
          const block = puffer.slice(0, i); puffer = puffer.slice(i + 2);
          const daten = block.split('\n').find((z) => z.startsWith('data: '));
          if (daten) return JSON.parse(daten.slice(6));
          continue;
        }
        const { value, done } = await leser.read();
        if (done) throw new Error('Strom zu Ende');
        puffer += Buffer.from(value).toString('utf8');
      }
    };
    const z1 = await naechstes();
    assert.equal(z1.phase, 'lobby');
    assert.equal(z1.teilnehmer, 1);
    await weiter();
    const z2 = await naechstes();
    assert.equal(z2.phase, 'frage');
    assert.ok(z2.frage.text);
    assert.equal(z2.ich.punkte, 0);
  } finally {
    ab.abort();
    await new Promise((ok) => server.close(ok));
  }
  // ohne Mitgliedschaft: 404 statt Strom
  const fremd = await H.angemeldet(app, { sub: 's:99', name: 'Ola F.', kurse: [{ id: 'k:30', name: 'GK', rolle: 'mitglied' }] });
  assert.equal((await fremd.get('/api/live/k%3A17/strom')).status, 404);
  assert.equal((await request(app).get('/api/live/k%3A17/strom')).status, 401);
});

test('Löschung über den Verbund: Konto und Kurs verschwinden auch aus laufenden Runden', async () => {
  const { app, mika, weiter, antwort } = await start();
  await weiter();
  const s = (await mika.get('/api/live/k%3A17')).body;
  await antwort(mika, 0, s.frage.optionen[0].id);
  const lk = app.locals.svc.live;
  assert.equal(lk.fuerLehrkraft('k:17').beantwortet, 1);
  const loeschen = (body) => request(app).post('/api/verbund/loeschen').set('Authorization', `Bearer ${H.verbundToken(app.now, 'loeschen')}`).send(body);
  assert.equal((await loeschen({ sub: 's:1042' })).status, 200);
  assert.equal(lk.fuerLehrkraft('k:17').beantwortet, 0);
  assert.equal((await loeschen({ kurs: 'k:17' })).status, 200);
  assert.equal(lk.fuerLehrkraft('k:17').aktiv, false);
});

test('Manifest nennt die Fähigkeit live', async () => {
  const app = await H.verbundApp();
  assert.ok((await request(app).get('/api/plattform')).body.faehigkeiten.includes('live'));
});

test('Kennung der richtigen Option ist zufällig verteilt (verrät die Lösung nicht)', async () => {
  const app = await H.verbundApp();
  const lk = await H.angemeldet(app, LK);
  const richtige = new Set();
  for (let i = 0; i < 12 && richtige.size < 2; i++) {
    await lk.post('/api/lehrer/kurse/k%3A17/live').set(ORIGIN).send({ art: 'quiz', welt: 'B', anzahl: 10, sekunden: 0 });
    for (let n = 0; n < 10; n++) {
      await lk.post('/api/lehrer/kurse/k%3A17/live/weiter').set(ORIGIN).send({});
      const z = (await lk.post('/api/lehrer/kurse/k%3A17/live/weiter').set(ORIGIN).send({})).body;
      if (z.frage.optionen.length > 2) richtige.add(z.auswertung.richtig);
    }
    await lk.post('/api/lehrer/kurse/k%3A17/live/beenden').set(ORIGIN).send({});
  }
  assert.ok(richtige.size >= 2, [...richtige].join());
});
