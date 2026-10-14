'use strict';
// Vertrag §9 / CLAUDE.md Regel 9: Lösungen, Prüffunktionen, Tipps und Erklärungen der Module mit Prüfung auf dem
// Server liegen nur in inhalte/ – keine ausgelieferte Datei (app/) darf sie enthalten.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const request = require('supertest');
const H = require('./helpers');

const APP = path.join(__dirname, '..', 'app');
function dateien(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === 'tests' ? [] : dateien(p); // Tests werden nicht ausgeliefert
    return /\.(js|html|css|json)$/.test(e.name) ? [p] : [];
  });
}

test('Keine ausgelieferte Datei enthält Lösungstexte, Tipps oder Erklärungen aus inhalte/', async () => {
  const lade = (n) => import(pathToFileURL(path.join(__dirname, '..', 'inhalte', `${n}.js`)).href);
  const [quiz, detektiv, baukasten, minimierer, ueberliste] = await Promise.all([lade('quiz'), lade('detektiv'), lade('baukasten'), lade('minimierer'), lade('ueberliste')]);
  const geheim = new Set();
  for (const q of [...Object.values(quiz.QUIZ_WELTEN), ...Object.values(quiz.QUIZ_DS)]) {
    for (const f of q.fragen) {
      if (f.typ === 'mc') geheim.add(f.optionen[0]);
      if (f.typ === 'wf') geheim.add(f.begruendungen[0]);
      if (f.erklaerung) geheim.add(f.erklaerung);
    }
  }
  for (const f of detektiv.DETEKTIV_FAELLE) for (const b of Object.values(f.bedeutung || {})) geheim.add(b);
  for (const c of baukasten.BAUKASTEN_CHALLENGES) if (c.tipp) geheim.add(c.tipp);
  for (const x of minimierer.MINIMIERER_AUFGABEN) geheim.add(x.merke);
  for (const x of ueberliste.UEBERLISTE_STUFEN) for (const t of x.tipps) geheim.add(t);
  for (const b of ueberliste.UEBERLISTE_BONUS) geheim.add(b.optionen[0]);
  for (const b of Object.values(minimierer.MINIMIERER_BEDEUTUNG)) for (const t of Object.values(b)) geheim.add(t);
  const lang = [...geheim].filter((t) => t.length >= 30); // kurze Texte („Genau einen“) können zufällig vorkommen
  assert.ok(lang.length > 60, 'genug Prüftexte');
  const inhalt = dateien(APP).map((p) => [p, fs.readFileSync(p, 'utf8')]);
  for (const t of lang) for (const [p, text] of inhalt) assert.ok(!text.includes(t), `${path.relative(APP, p)} enthält „${t.slice(0, 50)}…“`);
});

test('Die Datendateien der Server-Module werden nicht ausgeliefert', async () => {
  const app = await H.makeApp();
  for (const p of ['/js/data/quiz.js', '/js/data/detektiv.js', '/js/data/baukasten.js', '/js/data/minimierer.js', '/js/data/mealy.js', '/js/data/ueberliste.js', '/inhalte/quiz.js', '/../inhalte/quiz.js']) {
    assert.equal((await request(app).get(p)).status, 404, p);
  }
});
