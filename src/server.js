'use strict';
// Start von AutomatenLab. Konfiguration über Umgebungsvariablen nach Vertrag §8 (siehe .env.example, docs/VERBUND.md).

const path = require('node:path');
const { createApp, VERSION } = require('./app');
const { ladeKatalog } = require('./inhalte');

const log = (m) => console.log(`[${new Date().toISOString()}] ${m}`);

const PORT = Number(process.env.PORT) || 80;
const DATA_DIR = process.env.DATA_DIR || '/app/data';
const AUTH_MODI = ['lokal', 'beides', 'portal'];
const authModus = AUTH_MODI.includes(process.env.AUTH_MODUS) ? process.env.AUTH_MODUS : 'portal';
const trustProxyEnv = process.env.TRUST_PROXY;
const trustProxy = trustProxyEnv === undefined ? 1 : /^\d+$/.test(trustProxyEnv) ? Number(trustProxyEnv) : trustProxyEnv === 'true';

async function start() {
  const katalog = await ladeKatalog();
  const app = createApp({
    dbFile: path.join(DATA_DIR, 'automatenlab.db'),
    katalog,
    plattformId: process.env.PLATTFORM_ID,
    plattformUrl: process.env.PLATTFORM_URL,
    portalUrl: process.env.PORTAL_URL,
    authModus,
    trustProxy,
    log
  });
  const server = app.listen(PORT, () =>
    log(`AutomatenLab ${VERSION} läuft auf Port ${PORT} (Daten: ${DATA_DIR}, ${katalog.umfang.aufgaben} Aufgaben, Auth-Modus laut Konfiguration: ${authModus}).`)
  );
  const beenden = (sig) => {
    log(`${sig} empfangen, fahre herunter …`);
    server.close(() => {
      try {
        app.locals.db.close();
      } catch {
        /* egal */
      }
      process.exit(0);
    });
    setTimeout(() => process.exit(0), 5000).unref();
  };
  process.on('SIGTERM', () => beenden('SIGTERM'));
  process.on('SIGINT', () => beenden('SIGINT'));
}

start().catch((e) => {
  log(`Start fehlgeschlagen: ${e.stack || e.message}`);
  process.exit(1);
});
