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
  `,
  `
  -- Konten aus dem Portal (Vertrag §5): nur sub, Rolle, Anzeigename – keine Passwörter, Codes oder E-Mail-Adressen
  CREATE TABLE konten (
    sub            TEXT PRIMARY KEY CHECK (sub GLOB '[asl]:[0-9]*'),
    rolle          TEXT NOT NULL CHECK (rolle IN ('schueler', 'lehrkraft', 'superadmin')),
    name           TEXT NOT NULL,
    session_gen    INTEGER NOT NULL DEFAULT 1,
    created_at     TEXT NOT NULL,
    last_login_at  TEXT,
    last_active_at TEXT
  );

  -- Kurse aus dem Portal (Kurs-ID k:<n>); Einstellungen je Kurs gehören der Plattform (§3)
  CREATE TABLE kurse (
    id            TEXT PRIMARY KEY CHECK (id GLOB 'k:[0-9]*'),
    name          TEXT NOT NULL,
    aktiv         INTEGER NOT NULL DEFAULT 1,
    einstellungen TEXT NOT NULL DEFAULT '{}',
    created_at    TEXT NOT NULL,
    updated_at    TEXT NOT NULL
  );

  -- Mitgliedschaften laut letztem Token: mitglied (Schüler) oder lehrkraft (Inhaberin, Mitlehrkraft, Superadmin)
  CREATE TABLE kurs_mitglieder (
    kurs_id TEXT NOT NULL REFERENCES kurse(id) ON DELETE CASCADE,
    sub     TEXT NOT NULL REFERENCES konten(sub) ON DELETE CASCADE,
    rolle   TEXT NOT NULL CHECK (rolle IN ('mitglied', 'lehrkraft')),
    seit    TEXT NOT NULL,
    PRIMARY KEY (kurs_id, sub)
  );
  CREATE INDEX idx_mitglieder_sub ON kurs_mitglieder(sub);
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
