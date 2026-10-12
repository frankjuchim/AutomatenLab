'use strict';
// Datenbank (SQLite über better-sqlite3). Schema-Änderungen nur als neue Migration am Ende von MIGRATIONEN
// (gleiches Verfahren wie im Portal frankjuchim/labs, src/db.js).

const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');

const APP_KENNUNG = 'automatenlab';

/** Migrationen: Index + 1 = Schema-Version. Nie bestehende Einträge ändern, nur neue anhängen. */
const MIGRATIONEN = [
  `
  CREATE TABLE meta (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  `
];

const SCHEMA_VERSION = MIGRATIONEN.length;

function getMeta(db, key) {
  const r = db.prepare('SELECT value FROM meta WHERE key = ?').get(key);
  return r ? r.value : null;
}

function setMeta(db, key, value) {
  db.prepare('INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(key, String(value));
}

/** Datenbank öffnen bzw. anlegen und auf den neuesten Stand migrieren. */
function openDatabase(file, { log = () => {} } = {}) {
  if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new Database(file);
  if (file !== ':memory:') db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000');
  const hatMeta = db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'meta'").get();
  // Nur eine neue bzw. leere Datei wird angelegt – eine fremde Datenbank (z. B. falsches DATA_DIR) bleibt unangetastet
  const tabellen = db.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'").get().n;
  if ((!hatMeta && tabellen > 0) || (hatMeta && getMeta(db, 'app') !== APP_KENNUNG)) {
    db.close();
    throw new Error('Die Datenbank gehört nicht zu AutomatenLab.');
  }
  let version = hatMeta ? Number(getMeta(db, 'schema_version') || 0) : 0;
  if (version > SCHEMA_VERSION) throw new Error(`Datenbank-Schema ${version} ist neuer als diese Version (${SCHEMA_VERSION}).`);
  while (version < SCHEMA_VERSION) {
    const sql = MIGRATIONEN[version];
    db.transaction(() => {
      db.exec(sql);
      setMeta(db, 'schema_version', version + 1);
      setMeta(db, 'app', APP_KENNUNG);
    })();
    version += 1;
    log(`Datenbank: Migration ${version} ausgeführt.`);
  }
  return db;
}

module.exports = { openDatabase, getMeta, setMeta, SCHEMA_VERSION, APP_KENNUNG, MIGRATIONEN };
