'use strict';
// Single Sign-on (Vertrag §5) – alle Testfälle aus docs/INTEGRATION.md §5 (frankjuchim/labs).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const H = require('./helpers');
const { pruefeManifest } = require('../scripts/vertrag_pruefen');

test('/sso/start: Weiterleitung zum Portal mit state (≥ 22 Zeichen), Rücksprung, ziel; state-Cookie httpOnly/Lax', async () => {
  const app = await H.verbundApp();
  const { start, state } = await H.ssoStart(app, '/#/arena?stufe=2');
  assert.equal(start.status, 302);
  const u = new URL(start.headers.location);
  assert.equal(u.origin + u.pathname, `${H.PORTAL}/sso/autorisieren`);
  assert.equal(u.searchParams.get('plattform'), 'automatenlab');
  assert.equal(u.searchParams.get('ruecksprung'), 'https://automatenlab.example/sso/ende');
  assert.equal(u.searchParams.get('ziel'), '/#/arena?stufe=2');
  assert.match(state, /^[A-Za-z0-9\-_.~]{22,}$/);
  const cookie = start.headers['set-cookie'].join(';');
  assert.match(cookie, /al_sso_state=/);
  assert.match(cookie, /HttpOnly/i);
  assert.match(cookie, /SameSite=Lax/i);
  assert.match(cookie, /Max-Age=600/);
  // unsicheres ziel wird zu „/“
  for (const ziel of ['//boese.example', '/\\boese.example', 'https://boese.example', 'x']) {
    const r = await request(app).get('/sso/start').query({ ziel });
    assert.equal(new URL(r.headers.location).searchParams.get('ziel'), '/', ziel);
  }
});

test('gültiges Token, richtiger state: 302 auf ziel, Sitzung gesetzt, Konto nach sub angelegt, Kurse übernommen', async () => {
  const app = await H.verbundApp();
  const { agent, state } = await H.ssoStart(app);
  const r = await agent.get('/sso/ende').query({ token: H.ssoToken(app.now), state, ziel: '/#/arena?stufe=2' });
  assert.equal(r.status, 302);
  assert.equal(r.headers.location, '/#/arena?stufe=2');
  assert.equal(r.headers['referrer-policy'], 'no-referrer');
  assert.equal(r.headers['cache-control'], 'no-store');
  const cookie = r.headers['set-cookie'].join(';');
  assert.match(cookie, /al_s=[^;]+;.*HttpOnly/i);
  assert.match(cookie, /al_sso_state=;/, 'state-Cookie gelöscht');
  const s = (await agent.get('/api/sitzung')).body;
  assert.deepEqual(s.konto, { sub: 's:1042', rolle: 'schueler', name: 'Mika R.', kurse: [{ id: 'k:17', name: 'LK Informatik 13', rolle: 'mitglied' }] });
  // Sitzungsdauer: Schüler 30 Tage
  assert.match(cookie, /al_s=[^;]+;[^,]*Max-Age=2592000/);
});

test('Lehrkraft: Sitzung höchstens 8 Stunden; Superadmin mit allen Kursen als Lehrkraft', async () => {
  const app = await H.verbundApp();
  const { agent, state } = await H.ssoStart(app);
  const r = await agent.get('/sso/ende').query({ token: H.ssoToken(app.now, { sub: 'l:5', rolle: 'lehrkraft', name: 'Frau Beispiel', kurse: [{ id: 'k:17', name: 'LK', rolle: 'lehrkraft' }] }), state });
  assert.equal(r.status, 302);
  assert.match(r.headers['set-cookie'].join(';'), /al_s=[^;]+;[^,]*Max-Age=28800/);
  const a = await H.angemeldet(app, { sub: 'a:1', rolle: 'superadmin', name: 'Superadmin', kurse: [{ id: 'k:17', name: 'LK', rolle: 'lehrkraft' }, { id: 'k:18', name: 'GK', rolle: 'lehrkraft' }] });
  assert.equal((await a.get('/api/lehrer/kurse')).body.length, 2);
});

test('Ziel passt zur Rolle: Lehrkraft von der Startseite in den Lehrkraft-Bereich, Schüler nie dorthin, Deep-Links bleiben', async () => {
  const app = await H.verbundApp();
  const lk = { sub: 'l:5', rolle: 'lehrkraft', name: 'Frau Beispiel', kurse: [{ id: 'k:17', name: 'LK', rolle: 'lehrkraft' }] };
  const admin = { sub: 'a:1', rolle: 'superadmin', name: 'Admin', kurse: [] };
  const faelle = [
    [lk, '/', '/#/lehrkraft'],
    [admin, '/', '/#/lehrkraft'],
    [lk, '/#/baukasten?level=3', '/#/baukasten?level=3'],
    [lk, '/#/lehrkraft?kurs=k%3A17', '/#/lehrkraft?kurs=k%3A17'],
    [{}, '/', '/'],
    [{}, '/#/lehrkraft', '/'],
    [{}, '/lehrer', '/'],
    [{}, '/#/arena?stufe=2', '/#/arena?stufe=2']
  ];
  for (const [inhalt, ziel, erwartet] of faelle) {
    const { agent, state } = await H.ssoStart(app);
    const r = await agent.get('/sso/ende').query({ token: H.ssoToken(app.now, inhalt), state, ziel });
    assert.equal(r.status, 302, ziel);
    assert.equal(r.headers.location, erwartet, `${inhalt.rolle ?? 'schueler'} ${ziel}`);
  }
});

test('Ablehnung mit 401: falsche Signatur, falsches aud, abgelaufen, exp − iat > 120 s, falsches iss, wiederverwendet, falsches v', async () => {
  const app = await H.verbundApp();
  const jetzt = Math.floor(app.now() / 1000);
  const faelle = {
    'falsche Signatur': H.ssoToken(app.now, {}, { schluessel: H.fremdSchluessel }),
    'falsches aud': H.ssoToken(app.now, { aud: 'algoquest' }),
    abgelaufen: H.ssoToken(app.now, { iat: jetzt - 200, exp: jetzt - 110 }),
    'exp − iat > 120 s': H.ssoToken(app.now, { exp: jetzt + 121 }),
    'falsches iss': H.ssoToken(app.now, { iss: 'https://boese.example' }),
    'falsches v': H.ssoToken(app.now, { v: 2 }),
    'falscher Inhalt (Rolle passt nicht zu sub)': H.ssoToken(app.now, { sub: 'l:5' }),
    'falscher Inhalt (Kurs-ID)': H.ssoToken(app.now, { kurse: [{ id: '17', name: 'X', rolle: 'mitglied' }] }),
    'kein Token': undefined
  };
  for (const [fall, token] of Object.entries(faelle)) {
    const { agent, state } = await H.ssoStart(app);
    const r = await agent.get('/sso/ende').query({ ...(token ? { token } : {}), state });
    assert.equal(r.status, 401, fall);
    assert.equal(r.headers['referrer-policy'], 'no-referrer', fall);
    assert.equal((await agent.get('/api/sitzung')).body.konto, null, fall);
  }
  // wiederverwendet
  const token = H.ssoToken(app.now);
  const eins = await H.ssoStart(app);
  assert.equal((await eins.agent.get('/sso/ende').query({ token, state: eins.state })).status, 302);
  const zwei = await H.ssoStart(app);
  assert.equal((await zwei.agent.get('/sso/ende').query({ token, state: zwei.state })).status, 401, 'wiederverwendet');
});

test('state fehlt, ≠ Cookie oder Cookie fehlt → 401; state ist nur einmal verwendbar', async () => {
  const app = await H.verbundApp();
  const { agent, state } = await H.ssoStart(app);
  assert.equal((await agent.get('/sso/ende').query({ token: H.ssoToken(app.now) })).status, 401, 'state fehlt');
  const b = await H.ssoStart(app);
  assert.equal((await b.agent.get('/sso/ende').query({ token: H.ssoToken(app.now), state: b.state + 'x' })).status, 401, 'state ≠ Cookie');
  assert.equal((await request(app).get('/sso/ende').query({ token: H.ssoToken(app.now), state })).status, 401, 'ohne Cookie');
  // agent hat sein Cookie beim ersten Versuch verbraucht
  assert.equal((await agent.get('/sso/ende').query({ token: H.ssoToken(app.now), state })).status, 401, 'state verbraucht');
});

test('fehler=keine_berechtigung → verständliche Seite, fehler=abgebrochen → Startseite; keine Sitzung', async () => {
  const app = await H.verbundApp();
  const a = await H.ssoStart(app);
  const r = await a.agent.get('/sso/ende').query({ fehler: 'keine_berechtigung', state: a.state });
  assert.equal(r.status, 403);
  assert.match(r.text, /Kein Zugang/);
  assert.match(r.text, /nicht freigeschaltet/);
  assert.equal((await a.agent.get('/api/sitzung')).body.konto, null);
  const b = await H.ssoStart(app);
  const r2 = await b.agent.get('/sso/ende').query({ fehler: 'abgebrochen', state: b.state });
  assert.equal(r2.status, 302);
  assert.equal(r2.headers.location, '/');
  assert.equal((await b.agent.get('/api/sitzung')).body.konto, null);
});

test('ziel=//boese.example → Weiterleitung auf /', async () => {
  const app = await H.verbundApp();
  for (const ziel of ['//boese.example', '/\\boese.example', 'https://boese.example']) {
    const { agent, state } = await H.ssoStart(app);
    const r = await agent.get('/sso/ende').query({ token: H.ssoToken(app.now), state, ziel });
    assert.equal(r.status, 302);
    assert.equal(r.headers.location, '/', ziel);
  }
});

test('Mitgliedschaften folgen dem Token: fehlender Kurs → kein Zugang mehr, Name wird aktualisiert', async () => {
  const app = await H.verbundApp();
  await H.angemeldet(app, { kurse: [{ id: 'k:17', name: 'LK', rolle: 'mitglied' }, { id: 'k:18', name: 'AG', rolle: 'mitglied' }] });
  const a = await H.angemeldet(app, { name: 'Mika R. (neu)', kurse: [{ id: 'k:18', name: 'AG Automaten', rolle: 'mitglied' }] });
  const k = (await a.get('/api/sitzung')).body.konto;
  assert.equal(k.name, 'Mika R. (neu)');
  assert.deepEqual(k.kurse.map((x) => [x.id, x.name]), [['k:18', 'AG Automaten']]);
  assert.ok(app.locals.svc.konten.kurs('k:17'), 'Kurs bleibt bestehen');
});

test('Abmelden: nur Plattform bzw. überall (Portal-Rücksprung auf die eigene Basis)', async () => {
  const app = await H.verbundApp();
  const a = await H.angemeldet(app);
  const r = await a.get('/abmelden');
  assert.equal(r.status, 302);
  assert.equal(r.headers.location, '/');
  assert.equal((await a.get('/api/sitzung')).body.konto, null);
  const b = await H.angemeldet(app);
  const u = await b.get('/abmelden/ueberall');
  assert.equal(u.headers.location, `${H.PORTAL}/sso/abmelden?ruecksprung=${encodeURIComponent('https://automatenlab.example/')}`);
  assert.equal((await b.get('/api/sitzung')).body.konto, null);
});

test('Auf allen Geräten abmelden beendet alle Sitzungen dieses Kontos', async () => {
  const app = await H.verbundApp();
  const a = await H.angemeldet(app);
  const b = await H.angemeldet(app);
  const r = await a.post('/api/sitzung/beenden').set('Origin', 'http://127.0.0.1').set('Host', '127.0.0.1').send({});
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.equal((await b.get('/api/sitzung')).body.konto, null);
});

test('Manifest mit Portal-Anmeldung: auth.modus portal, sso true, ssoStart/ssoEnde; vertragsgemäß', async () => {
  const app = await H.verbundApp();
  const m = (await request(app).get('/api/plattform')).body;
  assert.deepEqual(m.auth, { modus: 'portal', portal: H.PORTAL, sso: true });
  assert.equal(m.urls.ssoStart, '/sso/start');
  assert.equal(m.urls.ssoEnde, '/sso/ende');
  assert.deepEqual(pruefeManifest(m), []);
});

test('Ohne Schlüssel oder mit AUTH_MODUS=lokal: keine Anmeldung, Manifest „lokal“, SSO-Seiten 503', async () => {
  const rsa = require('node:crypto').generateKeyPairSync('rsa', { modulusLength: 2048 }).publicKey.export({ type: 'spki', format: 'pem' });
  for (const extra of [{ portalPublicKey: '' }, { authModus: 'lokal' }, { portalPublicKey: 'kein Schlüssel' }, { portalPublicKey: rsa }]) {
    const app = await H.verbundApp(extra);
    const m = (await request(app).get('/api/plattform')).body;
    assert.deepEqual(m.auth, { modus: 'lokal', portal: H.PORTAL, sso: false });
    assert.equal(m.urls.ssoStart, undefined);
    assert.equal((await request(app).get('/sso/start')).status, 503);
    assert.equal((await request(app).get('/sso/ende').query({ token: H.ssoToken(app.now), state: 'x'.repeat(22) })).status, 503);
    assert.equal((await request(app).get('/api/sitzung')).body.anmeldung, false);
    assert.match((await request(app).get('/healthz')).body.anmeldung, /^aus: /);
  }
  assert.equal((await request(await H.verbundApp()).get('/healthz')).body.anmeldung, 'portal');
});

test('Ein gelöschtes Konto ist sofort abgemeldet, auch die Aktivitätsmarke im Arbeitsspeicher ist weg', async () => {
  const app = await H.verbundApp();
  const a = await H.angemeldet(app);
  await a.get('/api/sitzung');
  assert.equal(app.locals.svc.konten.hatAktivitaetsmarke('s:1042'), true);
  app.locals.svc.konten.loescheKonto('s:1042');
  assert.equal(app.locals.svc.konten.hatAktivitaetsmarke('s:1042'), false);
  assert.equal((await a.get('/api/sitzung')).body.konto, null);
});

test('Mehrere Schlüssel (Schlüsselwechsel): RSA-Block wird ignoriert, Ed25519-Block gilt', async () => {
  const rsa = require('node:crypto').generateKeyPairSync('rsa', { modulusLength: 2048 }).publicKey.export({ type: 'spki', format: 'pem' });
  const app = await H.verbundApp({ portalPublicKey: rsa + H.PUBLIC_PEM });
  assert.equal(app.locals.sso.aktiv, true);
  await H.angemeldet(app);
});

test('PORTAL_PUBLIC_KEY wird tolerant eingelesen (CapRover-Formate)', async () => {
  const { normalisiereSchluessel } = require('../src/app');
  const pem = H.PUBLIC_PEM.trim();
  const b64 = pem.replace(/-----(BEGIN|END) PUBLIC KEY-----/g, '').replace(/\s+/g, '');
  const varianten = {
    'PEM mehrzeilig': pem,
    'einzeilig mit \\n': pem.replace(/\n/g, '\\n'),
    'Leerzeichen statt Zeilenumbrüchen': pem.replace(/\n/g, ' '),
    'in Anführungszeichen': `"${pem.replace(/\n/g, '\\n')}"`,
    'nur Base64': b64,
    'Windows-Zeilenenden': pem.replace(/\n/g, '\r\n')
  };
  for (const [fall, wert] of Object.entries(varianten)) {
    const app = await H.verbundApp({ portalPublicKey: wert });
    assert.equal(app.locals.sso.aktiv, true, fall);
    await H.angemeldet(app);
  }
  assert.equal(normalisiereSchluessel('kein Schlüssel'), 'keinSchlüssel');
});
