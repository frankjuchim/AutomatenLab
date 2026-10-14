// Training-Engine (Arena, „Unterscheide!“): Runden passen zu den Automaten, Auswertung wie in der App.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ARENA_AUTOMATEN, ARENA_LEVELS } from '../js/data/arena.js';
import { DEMO } from '../js/data/demo.js';
import { dfa, runDFA } from '../js/engine/dfa.js';
import { makeRng } from '../js/engine/tokenize.js';
import * as MK from '../js/engine/markierung.js';
import { erzeugeArenaRunde, werteArenaRunde, erzeugeUnterscheideRunde, werteUnterscheideRunde, arenaPunkte, ARENA_LAENGE, WOERTER_PRO_AUTOMAT } from '../js/engine/training.js';

test('Arena-Runde: Automaten der Stufe, je vier Wörter, Länge passend, ausgewogen, richtige Lösung', () => {
  for (const stufe of [1, 2, 3]) {
    assert.deepEqual(ARENA_LAENGE[stufe], ARENA_LEVELS[stufe].laenge);
    const items = erzeugeArenaRunde(ARENA_AUTOMATEN, { stufe, anzahl: 120, rng: makeRng(stufe) });
    assert.equal(items.length, 120);
    const byId = new Map(ARENA_AUTOMATEN.map((a) => [a.id, a]));
    let ja = 0;
    items.forEach((x, i) => {
      const a = byId.get(x.automat);
      assert.ok(a.level.includes(stufe), x.automat);
      assert.equal(runDFA(dfa(a.automat), x.wort).accepted, x.akzeptiert);
      assert.ok(x.wort.length <= ARENA_LAENGE[stufe][1], 'Wortlänge');
      if (i % WOERTER_PRO_AUTOMAT) assert.equal(x.automat, items[i - 1].automat, 'vier Wörter je Automat');
      ja += x.akzeptiert ? 1 : 0;
    });
    assert.ok(ja > 40 && ja < 80, `ausgewogen (${ja} von 120 akzeptiert)`);
  }
  assert.ok(erzeugeArenaRunde(ARENA_AUTOMATEN, { stufe: 1, nurId: 'lol', anzahl: 8 }).every((x) => x.automat === 'lol'));
  assert.throws(() => erzeugeArenaRunde(ARENA_AUTOMATEN, { nurId: 'gibts-nicht' }), (e) => e.status === 404);
});

test('Arena-Auswertung: Punkte mit Serienbonus wie in der App, ungültige Antworten 400', () => {
  const items = erzeugeArenaRunde(ARENA_AUTOMATEN, { stufe: 1, anzahl: 10, rng: makeRng(7) });
  const richtig = items.map((x) => x.akzeptiert);
  const e = werteArenaRunde(items, richtig);
  assert.equal(e.richtig, 10); assert.equal(e.besteSerie, 10);
  assert.equal(e.score, [...Array(10)].reduce((s, _, i) => s + arenaPunkte(i + 1), 0));
  assert.equal(arenaPunkte(1), 10); assert.equal(arenaPunkte(6), 20); assert.equal(arenaPunkte(20), 20);
  const f = werteArenaRunde(items, [!richtig[0], richtig[1]]);
  assert.deepEqual([f.richtig, f.falsch, f.score], [1, 1, 10]);
  assert.throws(() => werteArenaRunde(items, new Array(11).fill(true)), (x) => x.status === 400);
  assert.throws(() => werteArenaRunde(items, ['ja']), (x) => x.status === 400);
});

test('Unterscheide!-Runde: Paare und Auswertung passen zum Markierungsverfahren (Demo-Automat)', () => {
  const x = DEMO.find((d) => d.modul === 'minimierer').daten;
  const aufgaben = [{ id: x.id, automat: x.automat }];
  const items = erzeugeUnterscheideRunde(aufgaben, { nurId: x.id, rng: makeRng(3) });
  assert.ok(items.length >= 4 && items.length <= 6);
  const A = dfa(x.automat);
  for (const it of items) assert.equal(it.aequivalent, MK.unterscheidendesWort(A, it.p, it.q) === null);
  const gut = werteUnterscheideRunde(aufgaben, items, items.map((it) => (it.aequivalent ? { aequivalent: true } : { wort: it.wort })));
  assert.equal(gut.richtig, items.length);
  const schlecht = werteUnterscheideRunde(aufgaben, items, items.map(() => ({ aequivalent: true })));
  assert.equal(schlecht.richtig, items.filter((it) => it.aequivalent).length);
  assert.equal(werteUnterscheideRunde(aufgaben, items, [null]).richtig, 0);
});
