// Gesamt-Konsistenz: Manifest ↔ PLAN.md (Abschnitt 4), README-Routenliste ↔ Manifest und Daten.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { MODULES } from '../js/modules/manifest.js';
import { WORLDS } from '../js/data/worlds.js';
import { BAUKASTEN_CHALLENGES } from '../../inhalte/baukasten.js';
import { ARENA_AUTOMATEN } from '../js/data/arena.js';
import { KELLER_AUTOMATEN } from '../js/data/keller.js';
import { TURING_PROGRAMME } from '../js/data/turing.js';
import { PARALLELWELTEN } from '../../inhalte/parallelwelten.js';

const ALLE = WORLDS.flatMap((w) => w.levels);

// PLAN.md Abschnitt 4: Route → Doppelstunden
const PLAN = {
  arena: [1, 2], detektiv: [2], baukasten: [3, 4, 12], minimierer: [5], mealy: [6], ueberliste: [7],
  parallelwelten: [8], keller: [9, 10], rallye: [11, 13], grammatik: [12, 13, 15], sortierer: [14], turing: [16], quiz: ALLE,
};

test('Manifest: alle 13 Module verfügbar, Level-Zuordnung wie in PLAN.md', () => {
  assert.deepEqual(MODULES.map((m) => m.route).sort(), Object.keys(PLAN).sort());
  for (const m of MODULES) {
    assert.equal(typeof m.load, 'function', `${m.route}: nicht verfügbar`);
    assert.deepEqual(m.levels, PLAN[m.route], `${m.route}: Level-Zuordnung`);
  }
  for (const n of ALLE) assert.ok(MODULES.some((m) => m.levels.includes(n)), `Level ${n} ohne Modul`);
});

test('README: Routenliste vollständig, IDs existieren', () => {
  const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8');
  const routes = new Set([...readme.matchAll(/`#\/([a-z]*)/g)].map((m) => m[1]));
  for (const m of MODULES) assert.ok(routes.has(m.route), `README: #/${m.route} fehlt`);
  // Sonderseiten ohne Manifest-Eintrag (Themen, Datenschutz, Lehrkräfte) müssen in main.js (SPECIAL) registriert sein
  const mainJs = readFileSync(new URL('../js/main.js', import.meta.url), 'utf8');
  const special = (r) => new RegExp(`^\\s*${r}: \\(\\) => import\\(`, 'm').test(mainJs);
  for (const r of routes) assert.ok(r === '' || MODULES.some((m) => m.route === r) || special(r), `README nennt unbekannte Route #/${r}`);
  for (const r of ['themen', 'datenschutz', 'lehrkraft', 'gast', 'material']) assert.ok(routes.has(r) && special(r), `Sonderseite #/${r}`);
  // Deep-Link-IDs aus der README gegen die Daten prüfen
  const zeile = (prefix) => readme.split('\n').find((l) => l.startsWith(prefix)) ?? '';
  const ids = (l) => [...l.matchAll(/`([a-z0-9-]+)`/g)].map((m) => m[1]);
  for (const id of ids(zeile('| `#/arena?automat=<id>`'))) assert.ok(ARENA_AUTOMATEN.some((a) => a.id === id), `Arena-ID ${id}`);
  for (const id of ids(zeile('| `#/keller?automat=<id>`'))) assert.ok(KELLER_AUTOMATEN.some((a) => a.id === id), `Keller-ID ${id}`);
  for (const id of ids(zeile('| `#/turing?programm=<id>`'))) assert.ok(TURING_PROGRAMME.some((a) => a.id === id), `Turing-ID ${id}`);
  for (const id of ids(zeile('| `#/parallelwelten?aufgabe=1`')).filter((x) => !/^\d/.test(x))) assert.ok(PARALLELWELTEN.some((a) => a.id === id), `NEA-ID ${id}`);
  BAUKASTEN_CHALLENGES.forEach((c, i) => assert.match(readme, new RegExp(`\\| ${i + 1} \\| ${c.id} \\|`), `Baukasten-Tabelle: ${c.id}`));
});
