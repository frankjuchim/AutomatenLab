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
  `,
  `
  -- Lernstand je Konto und Aufgabe (wie Algo Quest): nur der Server prüft und vergibt Punkte (Vertrag §9)
  CREATE TABLE fortschritt (
    sub          TEXT NOT NULL REFERENCES konten(sub) ON DELETE CASCADE,
    aufgabe_id   TEXT NOT NULL,
    status       TEXT NOT NULL DEFAULT 'offen' CHECK (status IN ('offen', 'geloest', 'angesehen')),
    nachgeloest  INTEGER NOT NULL DEFAULT 0,   -- nach „Lösung zeigen“ selbst gelöst (0 Punkte)
    fehlversuche INTEGER NOT NULL DEFAULT 0,
    tipps        INTEGER NOT NULL DEFAULT 0,
    punkte       INTEGER NOT NULL DEFAULT 0,
    daten        TEXT NOT NULL DEFAULT '{}',  -- Zwischenstand der Aufgabe (z. B. beantwortete Quizfragen)
    geloest_at   TEXT,
    updated_at   TEXT NOT NULL,
    PRIMARY KEY (sub, aufgabe_id)
  );

  CREATE TABLE abzeichen (
    sub        TEXT NOT NULL REFERENCES konten(sub) ON DELETE CASCADE,
    schluessel TEXT NOT NULL,
    at         TEXT NOT NULL,
    PRIMARY KEY (sub, schluessel)
  );
  `,
  `
  -- Training (wie der Trainingsplatz von Algo Quest): Spielrunden der Akzeptor-Arena und von „Unterscheide!“.
  -- Der Server erzeugt die Runde (daten, mit Lösungen), zählt die Antworten und vergibt 1 Punkt je richtiger Antwort,
  -- höchstens TRAINING_MAX_TAG Punkte je Kalendertag (Europe/Berlin).
  CREATE TABLE training (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    sub        TEXT NOT NULL REFERENCES konten(sub) ON DELETE CASCADE,
    modul      TEXT NOT NULL CHECK (modul IN ('arena', 'unterscheide')),
    art        TEXT NOT NULL DEFAULT '',      -- z. B. „stufe-2“, „stufe-1-ueben“, „automat-lol“, „aufgabe-smiley“
    daten      TEXT NOT NULL,                 -- erzeugte Runde samt Lösungen
    status     TEXT NOT NULL DEFAULT 'offen' CHECK (status IN ('offen', 'fertig')),
    richtig    INTEGER NOT NULL DEFAULT 0,
    score      INTEGER NOT NULL DEFAULT 0,    -- Arena: Rundenpunkte (Rekord je Stufe), sonst 0
    serie      INTEGER NOT NULL DEFAULT 0,    -- längste Serie richtiger Antworten
    wertung    INTEGER NOT NULL DEFAULT 0,    -- 1 = zählt für Rekorde (Arena: Zeitrunde einer Stufe, rechtzeitig beendet)
    punkte     INTEGER NOT NULL DEFAULT 0,    -- vergebene Trainingspunkte
    tag        TEXT NOT NULL,
    created_at TEXT NOT NULL,
    ended_at   TEXT
  );
  CREATE INDEX idx_training_sub ON training(sub, tag);
  `,
  `
  -- Chomsky-Sortierer als Training (PR 5): Tabelle neu anlegen, weil CHECK sich in SQLite nicht ändern lässt
  CREATE TABLE training_neu (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    sub        TEXT NOT NULL REFERENCES konten(sub) ON DELETE CASCADE,
    modul      TEXT NOT NULL CHECK (modul IN ('arena', 'unterscheide', 'sortierer')),
    art        TEXT NOT NULL DEFAULT '',      -- z. B. „stufe-2“, „stufe-1-ueben“, „automat-lol“, „aufgabe-smiley“, „runde“, „alle“
    daten      TEXT NOT NULL,                 -- erzeugte Runde samt Lösungen (Sortierer: auch die Antworten je Karte)
    status     TEXT NOT NULL DEFAULT 'offen' CHECK (status IN ('offen', 'fertig')),
    richtig    INTEGER NOT NULL DEFAULT 0,
    score      INTEGER NOT NULL DEFAULT 0,    -- Arena: Rundenpunkte, Sortierer: richtige Karten (Rekord), sonst 0
    serie      INTEGER NOT NULL DEFAULT 0,    -- längste Serie richtiger Antworten
    wertung    INTEGER NOT NULL DEFAULT 0,    -- 1 = zählt für Rekorde (Arena: rechtzeitige Zeitrunde; Sortierer: Zehnerrunde)
    punkte     INTEGER NOT NULL DEFAULT 0,    -- vergebene Trainingspunkte
    tag        TEXT NOT NULL,
    created_at TEXT NOT NULL,
    ended_at   TEXT
  );
  INSERT INTO training_neu (id, sub, modul, art, daten, status, richtig, score, serie, wertung, punkte, tag, created_at, ended_at)
    SELECT id, sub, modul, art, daten, status, richtig, score, serie, wertung, punkte, tag, created_at, ended_at FROM training;
  DROP TABLE training;
  ALTER TABLE training_neu RENAME TO training;
  CREATE INDEX idx_training_sub ON training(sub, tag);
  `,
  `
  -- Häufige falsche Antworten für die Aufgabenstatistik der Lehrkraft (wie Algo Quest): nur Kurzform aus festen
  -- Auswahlen bzw. kurzen Eingaben (Quiz-Option, Detektiv-Beschreibung, Turing-Regel, Mealy-Ausgabe), nie Freitext
  CREATE TABLE falsche_antworten (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    sub        TEXT NOT NULL REFERENCES konten(sub) ON DELETE CASCADE,
    aufgabe_id TEXT NOT NULL,
    antwort    TEXT NOT NULL,
    at         TEXT NOT NULL
  );
  CREATE INDEX idx_falsche_aufgabe ON falsche_antworten(aufgabe_id);
  CREATE INDEX idx_falsche_sub ON falsche_antworten(sub);
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
