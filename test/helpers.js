'use strict';
// Gemeinsame Test-Helfer (node:test + supertest), Aufbau wie in Algo Quest und im Portal.

const { createApp } = require('../src/app');
const { ladeKatalog } = require('../src/inhalte');
const { ladeAufgaben } = require('../src/aufgaben');

const HOST = 'automatenlab.test';
const SECRET = 'test-geheimnis-0123456789abcdef';
let katalog = null;
let aufgaben = null;

async function makeApp(extra = {}) {
  katalog = katalog || (await ladeKatalog());
  aufgaben = aufgaben || (await ladeAufgaben(SECRET));
  return createApp({
    dbFile: ':memory:',
    katalog,
    aufgaben,
    plattformUrl: 'https://automatenlab.example',
    portalUrl: 'https://labs.example',
    sessionSecret: SECRET,
    trustProxy: false,
    ...extra
  });
}

module.exports = { makeApp, HOST };

/* ---------- Verbund: Testschlüssel, Tokens, Uhr (wie test/sso.test.js im Portal) ---------- */
const crypto = require('node:crypto');
const { signiere } = require('../src/jwt');

const PORTAL = 'https://labs.example';
const ID = 'automatenlab';
const paar = crypto.generateKeyPairSync('ed25519');
const fremd = crypto.generateKeyPairSync('ed25519');
const PUBLIC_PEM = paar.publicKey.export({ type: 'spki', format: 'pem' });

/** Steuerbare Uhr in ms. */
function uhr(start = Date.parse('2026-10-12T08:00:00Z')) {
  let t = start;
  const f = () => t;
  f.vor = (ms) => (t += ms);
  return f;
}

const jtiNeu = () => crypto.randomBytes(16).toString('hex');

/** SSO-Token nach §5 (exp − iat = 90 s). */
function ssoToken(now, felder = {}, { schluessel = paar.privateKey } = {}) {
  const iat = Math.floor(now() / 1000);
  return signiere({ iss: PORTAL, aud: ID, sub: 's:1042', rolle: 'schueler', name: 'Mika R.', kurse: [{ id: 'k:17', name: 'LK Informatik 13', rolle: 'mitglied' }], iat, exp: iat + 90, jti: jtiNeu(), v: 1, ...felder }, schluessel);
}

/** Verbund-Token nach §6 (exp − iat = 60 s, sub „portal“). */
function verbundToken(now, zweck, felder = {}, { schluessel = paar.privateKey } = {}) {
  const iat = Math.floor(now() / 1000);
  return signiere({ iss: PORTAL, aud: ID, sub: 'portal', zweck, iat, exp: iat + 60, jti: jtiNeu(), v: 1, ...felder }, schluessel);
}

/** App mit eingerichteter Portal-Anmeldung. */
async function verbundApp(extra = {}) {
  const now = extra.now || uhr();
  const app = await makeApp({ portalPublicKey: PUBLIC_PEM, authModus: 'portal', now, ...extra });
  app.now = now;
  return app;
}

/** Browser-Agent: /sso/start aufrufen (state-Cookie), liefert {agent, state}. */
async function ssoStart(app, ziel = '/') {
  const request = require('supertest');
  const agent = request.agent(app);
  const r = await agent.get('/sso/start').query({ ziel });
  const state = new URL(r.headers.location).searchParams.get('state');
  return { agent, state, start: r };
}

/** Vollständige Anmeldung als Konto (Standard: Schüler s:1042 im Kurs k:17). */
async function angemeldet(app, felder = {}) {
  const { agent, state } = await ssoStart(app);
  const r = await agent.get('/sso/ende').query({ token: ssoToken(app.now, felder), state, ziel: '/' });
  if (r.status !== 302) throw new Error('SSO fehlgeschlagen: ' + r.status);
  return agent;
}

module.exports.uhr = uhr;
module.exports.ssoToken = ssoToken;
module.exports.verbundToken = verbundToken;
module.exports.verbundApp = verbundApp;
module.exports.ssoStart = ssoStart;
module.exports.angemeldet = angemeldet;
module.exports.PORTAL = PORTAL;
module.exports.ID = ID;
module.exports.PUBLIC_PEM = PUBLIC_PEM;
module.exports.fremdSchluessel = fremd.privateKey;
