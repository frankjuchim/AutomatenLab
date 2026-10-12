'use strict';
// Gemeinsame Test-Helfer (node:test + supertest), Aufbau wie in Algo Quest und im Portal.

const { createApp } = require('../src/app');
const { ladeKatalog } = require('../src/inhalte');

const HOST = 'automatenlab.test';
let katalog = null;

async function makeApp(extra = {}) {
  katalog = katalog || (await ladeKatalog());
  return createApp({ dbFile: ':memory:', katalog, plattformUrl: 'https://automatenlab.example', portalUrl: 'https://labs.example', trustProxy: false, ...extra });
}

module.exports = { makeApp, HOST };
