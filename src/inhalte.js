'use strict';
// Inhaltskatalog des Servers: liest Welten, Level und Module aus den ES-Modulen der App (app/js/data, app/js/modules)
// – eine Quelle der Wahrheit für App, Manifest (Vertrag §7) und Themenseite. Keine Lösungen.

const path = require('node:path');
const { pathToFileURL } = require('node:url');

const APP_JS = path.join(__dirname, '..', 'app', 'js');
const INHALTE = path.join(__dirname, '..', 'inhalte');
// Module mit Prüfung auf dem Server: Daten samt Lösungen liegen in inhalte/ (nie ausgeliefert)
const SERVER_DATEN = new Set(['baukasten', 'detektiv', 'quiz']);
const lade = (rel) => {
  const m = /^data\/(\w+)\.js$/.exec(rel);
  const datei = m && SERVER_DATEN.has(m[1]) ? path.join(INHALTE, `${m[1]}.js`) : path.join(APP_JS, rel);
  return import(pathToFileURL(datei).href);
};

/** Welten A–D: im Verbund als Zahl `nr` 1–4 mit Anzeigekennung `kennung` (Vertragsvorschlag V4). */
const WELT_FARBEN = { A: '#0E6455', B: '#B26A0F', C: '#3D5A99', D: '#7A3E65' };

async function ladeKatalog() {
  const [welten, manifest, d] = await Promise.all([
    lade('data/worlds.js'),
    lade('modules/manifest.js'),
    Promise.all(
      ['baukasten', 'detektiv', 'minimierer', 'mealy', 'parallelwelten', 'keller', 'ueberliste', 'rallye', 'grammatik', 'turing', 'quiz'].map((n) => lade(`data/${n}.js`))
    )
  ]);
  const [baukasten, detektiv, minimierer, mealy, parallelwelten, keller, ueberliste, rallye, grammatik, turing, quiz] = d;

  // Lösbare Aufgaben je Modul (vorläufige Zählung; der Aufgabenkatalog mit Prüfung auf dem Server ersetzt sie)
  const aufgabenJeModul = {
    baukasten: baukasten.BAUKASTEN_CHALLENGES.length,
    detektiv: detektiv.DETEKTIV_FAELLE.length,
    minimierer: minimierer.MINIMIERER_AUFGABEN.length,
    mealy: mealy.MEALY_AUFGABEN.length,
    parallelwelten: parallelwelten.PARALLELWELTEN.length,
    keller: keller.KELLER_AUTOMATEN.reduce((n, k) => n + (k.tabelle || []).length + (k.rueckwaerts || []).length, 0),
    ueberliste: ueberliste.UEBERLISTE_STUFEN.length,
    rallye: rallye.RALLYE_AUFGABEN.length,
    grammatik: grammatik.GRAMMATIK_CHALLENGES.length,
    turing: turing.TURING_CHALLENGES.length,
    quiz: Object.keys(quiz.QUIZ_WELTEN).length + Object.keys(quiz.QUIZ_DS).length
  };

  const weltListe = welten.WORLDS.map((w, i) => ({
    nr: i + 1,
    kennung: w.id,
    titel: w.title,
    farbe: WELT_FARBEN[w.id] || '#0E6455',
    level: w.levels.length,
    levels: w.levels.map((n) => ({
      nr: n,
      titel: welten.LEVELS[n],
      typ: welten.LEVEL_TYPE[n],
      boss: welten.BOSS_LEVELS.includes(n),
      module: manifest.MODULES.filter((m) => m.load && m.levels.includes(n)).map((m) => m.route)
    }))
  }));

  return {
    welten: weltListe,
    module: manifest.MODULES.filter((m) => m.load).map((m) => ({ route: m.route, titel: m.title, welt: m.world, levels: m.levels, kurz: m.blurb })),
    umfang: {
      welten: weltListe.length,
      level: Object.keys(welten.LEVELS).length,
      aufgaben: Object.values(aufgabenJeModul).reduce((a, b) => a + b, 0),
      bosse: welten.BOSS_LEVELS.length
    },
    aufgabenJeModul
  };
}

module.exports = { ladeKatalog, WELT_FARBEN };
