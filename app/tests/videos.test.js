// Erklärvideos: App-Liste passt zur Videoreihe der Materialien (gleiche IDs und Titel), Module existieren,
// Adressen (falls eingetragen) sind https und zeigen nicht auf die App selbst.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { ERKLAERVIDEOS, videosZuModul } from '../js/data/videos.js';
import { MODULES } from '../js/modules/manifest.js';
const require = createRequire(import.meta.url);

test('Erklärvideos: gleiche IDs und Titel wie die Videoreihe in materials/, gültige Module und Adressen', () => {
  const A = require('../../materials/content/video/videos.js');
  const B = require('../../materials/content/video/videos_b.js');
  const reihe = [...Object.values(A), ...Object.values(B)].filter((v) => v && v.id && v.title);
  assert.deepEqual(ERKLAERVIDEOS.map((v) => [v.id, v.titel]).sort(), reihe.map((v) => [v.id, v.title]).sort());
  const routen = new Set(MODULES.map((m) => m.route));
  for (const v of ERKLAERVIDEOS) {
    for (const m of v.module) assert.ok(routen.has(m), `${v.id}: unbekanntes Modul ${m}`);
    assert.ok(v.level.every((n) => n >= 1 && n <= 16), v.id);
    if (v.url) assert.match(v.url, /^https:\/\/(?!automatenlab\.)/, `${v.id}: Adresse`);
  }
  assert.deepEqual(videosZuModul('keller'), ERKLAERVIDEOS.filter((v) => v.url && v.module.includes('keller')));
});
