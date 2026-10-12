// Anforderungsniveaus (KC 2017, Vertrag InfoLabs v1.2 §9): vollständige Zuordnung, App und Materialien gleich.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { WORLDS, LEVELS, BOSS_LEVELS } from '../js/data/worlds.js';
import { MODULES } from '../js/modules/manifest.js';
import { LEVEL_NIVEAU, BOSS_NIVEAU, MODUL_NIVEAU, KC_KOMPETENZEN, MERKBLAETTER, NIVEAU_IDS } from '../js/data/niveaus.js';

const require = createRequire(import.meta.url);
const material = require('../../materials/lib/niveau.js');

test('Jedes Level und jedes Boss-Level hat ein gültiges Niveau', () => {
  for (const n of Object.keys(LEVELS)) assert.ok(NIVEAU_IDS.includes(LEVEL_NIVEAU[n]), `Level ${n}`);
  assert.deepEqual(Object.keys(LEVEL_NIVEAU).sort(), Object.keys(LEVELS).sort());
  const bossWelten = WORLDS.filter((w) => w.levels.some((l) => BOSS_LEVELS.includes(l))).map((w) => w.id);
  assert.deepEqual(Object.keys(BOSS_NIVEAU).sort(), bossWelten.sort());
});

test('Jedes Modul hat ein Niveau; kein eA- oder Zusatz-Modul hängt an einem reinen Kern-Level und umgekehrt', () => {
  for (const m of MODULES.filter((x) => x.load)) {
    const n = MODUL_NIVEAU[m.route];
    assert.ok(NIVEAU_IDS.includes(n) || n === 'je-level', m.route);
    if (NIVEAU_IDS.includes(n) && m.route !== 'baukasten') {
      // Baukasten: Challenges zu Level 12 bauen ebenfalls DEA (Kern), daher „alle“
      assert.ok(m.levels.every((l) => LEVEL_NIVEAU[l] === n), `${m.route}: Level ${m.levels} passen nicht zu ${n}`);
    }
  }
});

test('KC-Kompetenzen: Kern K1–K5 für beide Kurse, K6 und F1–F4 nur eA, Level passen', () => {
  const nach = Object.fromEntries(KC_KOMPETENZEN.map((k) => [k.id, k.niveau]));
  for (const k of ['K1', 'K2', 'K3', 'K4', 'K5']) assert.equal(nach[k], 'alle', k);
  for (const k of ['K6', 'F1', 'F2', 'F3', 'F4']) assert.equal(nach[k], 'eA', k);
  for (const k of KC_KOMPETENZEN.filter((x) => x.niveau !== 'plus')) {
    assert.ok(k.level.some((l) => LEVEL_NIVEAU[l] === k.niveau), `${k.id}: kein Level mit Niveau ${k.niveau}`);
  }
  for (const m of MERKBLAETTER) assert.ok(LEVELS[m.level], m.id);
});

test('Materialien nutzen dieselbe Zuordnung wie die App', () => {
  assert.deepEqual(material.LEVEL_NIVEAU, Object.fromEntries(Object.entries(LEVEL_NIVEAU).map(([k, v]) => [k, v])));
  assert.deepEqual(material.BOSS_NIVEAU, BOSS_NIVEAU);
  assert.equal(material.niveauVon({ ds: 9 }), 'eA');
  assert.equal(material.niveauVon({ ds: 1 }), 'alle');
  assert.equal(material.niveauVon({}), 'gemischt');
  assert.equal(material.niveauVon({ ds: 1, niveau: 'eA' }), 'eA');
});
