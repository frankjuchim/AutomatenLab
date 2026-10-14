'use strict';
// Prüfung und Lernstand auf dem Server (Vertrag §9): Punkteformel, Tipps, „Lösung zeigen“, Abzeichen, Rechte.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const H = require('./helpers');
const { punkteFuer } = require('../src/lernen');

const ORIGIN = { Origin: 'http://127.0.0.1', Host: '127.0.0.1' };
const post = (agent, pfad, body = {}) => agent.post(pfad).set(ORIGIN).send(body);

test('Punkteformel wie §9: round(p × max(0.25, 1 − 0.25·F − 0.2·T))', () => {
  assert.equal(punkteFuer(30, 0, 0), 30);
  assert.equal(punkteFuer(30, 1, 0), 23);
  assert.equal(punkteFuer(30, 0, 1), 24);
  assert.equal(punkteFuer(30, 1, 1), 17);
  assert.equal(punkteFuer(20, 9, 9), 5);
});

test('Katalog öffentlich und ohne Lösungen; Aufgabe ohne Lösung, solange offen', async () => {
  const app = await H.verbundApp();
  const k = (await request(app).get('/api/katalog')).body.aufgaben;
  assert.ok(k.some((a) => a.id === 'baukasten:enthaelt-aa') && k.some((a) => a.id === 'detektiv:fall-1') && k.some((a) => a.id === 'quiz:ds-1'));
  assert.doesNotMatch(JSON.stringify(k), /referenz|pruefe|delta|optionen|bedeutung|tipp"/i);
  const s = await H.angemeldet(app);
  for (const id of ['baukasten:enthaelt-aa', 'detektiv:fall-1', 'quiz:welt-A']) {
    const r = (await s.get(`/api/aufgaben/${id}`)).body;
    assert.equal(r.zustand.status, 'offen');
    assert.equal(r.loesung, undefined);
    assert.doesNotMatch(JSON.stringify(r.aufgabe), /referenz|"accepting":\["S2"\],"implicitError|bedeutung|erklaerung|"wahr"|Merke dir/);
  }
  assert.equal((await s.get('/api/aufgaben/gibts:nicht')).status, 404);
});

test('Rechte: Gast 401, Schüler ohne freigeschalteten Kurs 403, Lehrkraft darf ausprobieren', async () => {
  const app = await H.verbundApp();
  assert.equal((await request(app).get('/api/aufgaben/detektiv:fall-1')).status, 401);
  assert.equal((await request(app).get('/api/lernstand')).status, 401);
  const ohne = await H.angemeldet(app, { sub: 's:9', kurse: [] });
  assert.equal((await ohne.get('/api/aufgaben/detektiv:fall-1')).status, 403);
  assert.equal((await post(ohne, '/api/aufgaben/detektiv:fall-1/pruefen', { antwort: { wahl: 'x' } })).status, 403);
  const lk = await H.angemeldet(app, { sub: 'l:5', rolle: 'lehrkraft', name: 'Frau Beispiel', kurse: [] });
  assert.equal((await lk.get('/api/aufgaben/detektiv:fall-1')).status, 200);
  // CSRF auch hier
  const s = await H.angemeldet(app);
  assert.equal((await s.post('/api/aufgaben/detektiv:fall-1/pruefen').send({ antwort: {} })).status, 403);
});

test('Detektiv: falsche Wahl → Gegenbeispiel + Fehlversuch, richtige → Punkte nach Formel, Lösung danach sichtbar', async () => {
  const app = await H.verbundApp();
  const s = await H.angemeldet(app);
  const a = (await s.get('/api/aufgaben/detektiv:fall-1')).body.aufgabe;
  assert.equal(a.optionen.length, 4);
  // richtige Option finden wir nur über die Antwort des Servers
  const antworten = [];
  for (const o of a.optionen) {
    const r = (await post(s, '/api/aufgaben/detektiv:fall-1/pruefen', { antwort: { wahl: o.id } })).body;
    antworten.push(r);
    if (r.ok) break;
    assert.equal(r.rueckmeldung.richtig, false);
    assert.ok(r.rueckmeldung.gegenbeispiel && typeof r.rueckmeldung.gegenbeispiel.wort === 'string');
    assert.equal(r.loesung, undefined);
  }
  const letzte = antworten.at(-1);
  assert.equal(letzte.ok, true);
  assert.equal(letzte.geloest, true);
  const fehl = antworten.length - 1;
  assert.equal(letzte.punkteErhalten, punkteFuer(10, fehl, 0));
  assert.match(letzte.loesung.richtigText, /enden/);
  assert.ok(letzte.loesung.bedeutung.S1);
  assert.ok(letzte.neueAbzeichen.some((b) => b.id === 'detektiv-erster-fall' && b.titel === 'Fall gelöst'));
  // erneutes Prüfen ändert nichts mehr
  const nochmal = (await post(s, '/api/aufgaben/detektiv:fall-1/pruefen', { antwort: { wahl: letzte.loesung.richtig } })).body;
  assert.equal(nochmal.geloest, false);
  assert.equal(nochmal.punkteErhalten, 0);
  const ls = (await s.get('/api/lernstand')).body;
  assert.ok(ls.solved['detektiv:fall-1']);
  assert.equal(ls.punkte, letzte.punkteErhalten);
  assert.deepEqual(ls.badges, ['detektiv-erster-fall']);
  assert.equal((await post(s, '/api/aufgaben/detektiv:fall-1/pruefen', { antwort: { wahl: 'unsinn' } })).status, 400);
});

test('Baukasten: Gegenbeispiel, Tipp kostet Punkte, richtiger DEA → Punkte; ungültige Automaten 400', async () => {
  const app = await H.verbundApp();
  const s = await H.angemeldet(app);
  const id = 'baukasten:endet-b';
  const a = (await s.get(`/api/aufgaben/${id}`)).body;
  assert.deepEqual(a.aufgabe.alphabet, ['a', 'b']);
  assert.equal(a.zustand.tippsAnzahl, 1);
  assert.deepEqual(a.zustand.tipps, []);
  const falsch = { alphabet: ['a', 'b'], start: 'S0', accepting: ['S0'], delta: { S0: { 'a, b': 'S0' } } };
  const r1 = (await post(s, `/api/aufgaben/${id}/pruefen`, { antwort: { automat: falsch } })).body;
  assert.equal(r1.ok, false);
  assert.equal(r1.rueckmeldung.gegenbeispiel.wort, 'ε');
  assert.equal(r1.rueckmeldung.gegenbeispiel.akzeptiertVonDir, true);
  const t = (await post(s, `/api/aufgaben/${id}/tipp`)).body;
  assert.equal(t.zustand.tipps.length, 1);
  assert.equal(t.zustand.moeglich, punkteFuer(10, 1, 1));
  const richtig = { alphabet: ['a', 'b'], start: 'Q0', accepting: ['Q1'], delta: { Q0: { a: 'Q0', b: 'Q1' }, Q1: { a: 'Q0', b: 'Q1' } } };
  const r2 = (await post(s, `/api/aufgaben/${id}/pruefen`, { antwort: { automat: richtig } })).body;
  assert.equal(r2.ok, true);
  assert.equal(r2.punkteErhalten, punkteFuer(10, 1, 1));
  assert.ok(r2.loesung.musterloesung.delta);
  for (const automat of [null, { alphabet: ['a', 'c'], start: 'S0', accepting: [], delta: {} }, { kaputt: true }]) {
    assert.equal((await post(s, `/api/aufgaben/${id}/pruefen`, { antwort: { automat } })).status, 400, JSON.stringify(automat));
  }
});

test('Minimierer: Runden auf dem Server, falsche Runde = Fehlversuch, Stand-Fehler 409, Lösung erst danach', async () => {
  const app = await H.verbundApp();
  const s = await H.angemeldet(app);
  const id = 'minimierer:smiley';
  const k = (await s.get('/api/katalog?modul=minimierer')).body.aufgaben;
  assert.equal(k.length, 7);
  assert.deepEqual(k[0], { id, modul: 'minimierer', nr: 1, titel: 'Smiley-Erkenner', stufe: 1, punkte: 10, levels: [5], fallen: ['P4', 'P1'], schluessel: 'smiley' });
  const a = (await s.get(`/api/aufgaben/${id}`)).body;
  assert.ok(a.aufgabe.automat && a.aufgabe.frage);
  assert.doesNotMatch(JSON.stringify(a), /klassen|merke|Kein Wort kann sie unterscheiden/);
  const pr = (antwort) => post(s, `/api/aufgaben/${id}/pruefen`, { antwort });
  // Runde 0 mit einem falschen Paar: Fehlversuch, keine Lösung
  let r = (await pr({ runde: 0, markiert: ['S3|S4'] })).body;
  assert.equal(r.rueckmeldung.richtig, false);
  assert.deepEqual(r.rueckmeldung.falsch, ['S3|S4']);
  assert.ok(r.rueckmeldung.fehlendAnzahl > 0);
  assert.equal(r.zustand.fehlversuche, 1);
  assert.equal(r.loesung, undefined);
  // falsche Runde → 409, unbekanntes Paar → 400
  assert.equal((await pr({ runde: 3, markiert: [] })).status, 409);
  assert.equal((await pr({ runde: 0, markiert: ['S0|X9'] })).status, 400);
  // richtige Runden: Paare aus der Rückmeldung des Servers (Runde 0) und per Engine (Folgerunden)
  const { markierungsTabelle, loesung } = await import('../app/js/engine/markierung.js');
  const { dfa } = await import('../app/js/engine/dfa.js');
  const L = loesung(markierungsTabelle(dfa(a.aufgabe.automat)));
  let runde = 0;
  for (;;) {
    const markiert = [...L.marked].filter(([, x]) => x === runde).map(([key]) => key);
    r = (await pr({ runde, markiert })).body;
    assert.equal(r.rueckmeldung.richtig, true, `Runde ${runde}`);
    if (r.rueckmeldung.fertig) break;
    assert.equal(r.loesung, undefined);
    runde = r.rueckmeldung.naechsteRunde;
  }
  assert.equal(r.geloest, true);
  assert.equal(r.punkteErhalten, punkteFuer(10, 1, 0));
  assert.deepEqual(r.loesung.klassen, [['S3', 'S4']]);
  assert.equal(r.loesung.nachher, 5);
  assert.match(r.loesung.merke, /S3 und S4/);
  assert.ok(r.neueAbzeichen.some((b) => b.id === 'minimierer-erste'));
  // nach dem Lösen: neuer Durchgang ab Runde 0 ist Übung ohne Punkte
  r = (await pr({ runde: 0, markiert: L.marked.size ? [...L.marked].filter(([, x]) => x === 0).map(([key]) => key) : [] })).body;
  assert.equal(r.rueckmeldung.richtig, true);
  assert.equal(r.punkteErhalten, 0);
  assert.ok((await s.get('/api/lernstand')).body.solved[id]);
});

test('Mealy: Vorhersage wie ein Quiz (erster Versuch zählt), Bug-Jagd mit Test ohne Wertung und Reparatur', async () => {
  const app = await H.verbundApp();
  const s = await H.angemeldet(app);
  const k = (await s.get('/api/katalog?modul=mealy')).body.aufgaben;
  assert.equal(k.length, 14);
  const v = k.find((a) => a.id === 'mealy:suessigkeiten:vorhersage');
  assert.deepEqual([v.art, v.schluessel, v.punkte], ['vorhersage', 'suessigkeiten:vorhersage', 10]);
  const pr = (id, antwort) => post(s, `/api/aufgaben/${id}/pruefen`, { antwort });
  // Vorhersage: Süßigkeitenautomat, Wörter MH, HMHH, MHMHM, MMHH → B, B, BB, B
  const va = (await s.get('/api/aufgaben/mealy:suessigkeiten:vorhersage')).body.aufgabe;
  assert.deepEqual(va.worte, ['MH', 'HMHH', 'MHMHM', 'MMHH']);
  let r = (await pr(v.id, { wort: 0, ausgabe: 'ε' })).body;
  assert.equal(r.rueckmeldung.richtig, false);
  assert.equal(r.rueckmeldung.ausgabe, undefined, 'Lösung erst nach dem zweiten Versuch');
  assert.equal(r.zustand.fehlversuche, 0, 'Vorhersage zählt keine Fehlversuche');
  r = (await pr(v.id, { wort: 0, ausgabe: 'B' })).body;
  assert.equal(r.rueckmeldung.richtig, true);
  for (const [i, aus] of [[1, 'B'], [2, 'BB']]) assert.equal((await pr(v.id, { wort: i, ausgabe: aus })).body.rueckmeldung.richtig, true);
  r = (await pr(v.id, { wort: 3, ausgabe: 'B' })).body;
  assert.equal(r.geloest, true);
  assert.equal(r.punkteErhalten, Math.round(10 * 3 / 4));
  assert.deepEqual(r.loesung.ergebnis, { ersterVersuch: 3, von: 4 });
  assert.equal((await post(s, `/api/aufgaben/${v.id}/aufdecken`)).status, 400);
  assert.equal((await pr(v.id, { wort: 9, ausgabe: 'B' })).status, 400);
  assert.equal((await pr(v.id, { wort: 0, ausgabe: 'X' })).status, 400);
  // Bug-Jagd: öffentlich nur der fehlerhafte Automat (S0 –H / B→), keine Fehlerliste
  const id = 'mealy:suessigkeiten';
  const b = (await s.get(`/api/aufgaben/${id}`)).body;
  assert.deepEqual(b.aufgabe.automat.delta.S0.H, ['S0', 'B']);
  assert.doesNotMatch(JSON.stringify(b.aufgabe), /fehler"|"ausgabe"/);
  r = (await pr(id, { test: 'HH', urteil: 'bug' })).body;
  assert.equal(r.rueckmeldung.bug, true); assert.equal(r.rueckmeldung.richtigeAusgabe, '');
  assert.equal(r.zustand.fehlversuche, 0, 'Testen kostet nichts');
  r = (await pr(id, { ausgaben: {} })).body;
  assert.equal(r.ok, false); assert.deepEqual(r.rueckmeldung.gegenbeispiel.wort, ['H']);
  assert.equal(r.zustand.fehlversuche, 1);
  r = (await pr(id, { ausgaben: { S0: { H: 'ε' } } })).body;
  assert.equal(r.geloest, true);
  assert.equal(r.punkteErhalten, punkteFuer(10, 1, 0));
  assert.deepEqual(r.loesung.fehler, [{ von: 'S0', zeichen: 'H', falsch: 'B', richtig: 'ε' }]);
  assert.ok(r.neueAbzeichen.some((x) => x.id === 'mealy-bugjaeger'));
  assert.equal(r.rueckmeldung.gefunden, true);
  assert.equal((await pr(id, { ausgaben: { S0: { H: 'Q' } } })).status, 400);
  const ls = (await s.get('/api/lernstand')).body;
  assert.ok(ls.solved[id] && ls.solved[v.id]);
});

test('Überliste: Testen kostet nichts, Tipps kosten Punkte, gelöst sobald der Automat irrt; Bonus wie ein Quiz', async () => {
  const app = await H.verbundApp();
  const s = await H.angemeldet(app);
  const k = (await s.get('/api/katalog?modul=ueberliste')).body.aufgaben;
  assert.deepEqual(k.map((a) => a.schluessel), ['anbn-klein', 'anbn-mittel', 'klammern', 'tuersteher', 'anbn-gross', 'bonus']);
  assert.equal(k.at(-1).art, 'bonus');
  const id = 'ueberliste:anbn-klein';
  const a = (await s.get(`/api/aufgaben/${id}`)).body;
  assert.equal(a.aufgabe.tippsAnzahl, 4);
  assert.doesNotMatch(JSON.stringify(a), /pruefe|Schubfach/);
  const pr = (antwort) => post(s, `/api/aufgaben/${id}/pruefen`, { antwort });
  let r = (await pr({ wort: 'aabb' })).body;
  assert.deepEqual([r.rueckmeldung.akzeptiert, r.rueckmeldung.gehoertDazu, r.rueckmeldung.ueberlistet], [true, true, false]);
  assert.equal(r.zustand.fehlversuche, 0);
  const t = (await post(s, `/api/aufgaben/${id}/tipp`)).body;
  assert.equal(t.zustand.tipps.length, 1);
  r = (await pr({ wort: 'aaabb' })).body;
  assert.equal(r.rueckmeldung.ueberlistet, true);
  assert.equal(r.geloest, true);
  assert.equal(r.punkteErhalten, punkteFuer(10, 0, 1));
  assert.ok(r.loesung.beispiel.length > 0);
  assert.ok(r.neueAbzeichen.some((b) => b.id === 'ueberliste-erster'));
  assert.equal((await pr({ wort: 'abc' })).status, 400);
  // Bonus: erster Durchgang zählt
  const b = (await s.get('/api/aufgaben/ueberliste:bonus')).body.aufgabe;
  assert.equal(b.fragen.length, 4);
  let letzte;
  for (let i = 0; i < b.fragen.length; i++) letzte = (await post(s, '/api/aufgaben/ueberliste:bonus/pruefen', { antwort: { frage: i, wahl: b.fragen[i].optionen[0].id } })).body;
  assert.equal(letzte.geloest, true);
  assert.ok(letzte.punkteErhalten >= 0 && letzte.punkteErhalten <= 20);
  assert.equal((await post(s, '/api/aufgaben/ueberliste:bonus/aufdecken')).status, 400);
});

test('Parallelwelten: Rätsel wie ein Quiz, Teilmengenkonstruktion Zeile für Zeile, falsche Zeile = Fehlversuch', async () => {
  const app = await H.verbundApp();
  const s = await H.angemeldet(app);
  const k = (await s.get('/api/katalog?modul=parallelwelten')).body.aufgaben;
  assert.equal(k.filter((a) => a.art === 'raetsel').length, 6);
  assert.equal(k.filter((a) => a.art === 'teilmengen').length, 5);
  const { nfa, runNFA } = await import('../app/js/engine/nfa.js');
  const { subsetConstruction } = await import('../app/js/engine/nfa.js');
  // Rätsel „endet-ab“: a, ab, aa, abb, bab
  const rid = 'parallelwelten:endet-ab:raetsel';
  const ra = (await s.get(`/api/aufgaben/${rid}`)).body.aufgabe;
  const N = nfa(ra.automat);
  const pr = (id, antwort) => post(s, `/api/aufgaben/${id}/pruefen`, { antwort });
  let r = (await pr(rid, { wort: 0, zustaende: ['S2'] })).body;
  assert.equal(r.rueckmeldung.richtig, false);
  assert.deepEqual(r.rueckmeldung.zuViel, ['S2']);
  assert.equal(r.rueckmeldung.loesung, undefined);
  for (let i = 0; i < ra.worte.length; i++) r = (await pr(rid, { wort: i, zustaende: runNFA(N, ra.worte[i]).sets.at(-1) })).body;
  assert.equal(r.geloest, true);
  assert.equal(r.punkteErhalten, 8, '4 von 5 im ersten Versuch → 10 × 0,8');
  assert.equal((await pr(rid, { wort: 0, zustaende: ['X9'] })).status, 400);
  // Teilmengenkonstruktion „lol“
  const tid = 'parallelwelten:lol';
  const ta = (await s.get(`/api/aufgaben/${tid}`)).body.aufgabe;
  const { table } = subsetConstruction(nfa(ta.automat));
  const falsch = (await pr(tid, { menge: table[0].set, ziele: {} })).body;
  assert.equal(falsch.rueckmeldung.richtig, false);
  assert.ok(falsch.rueckmeldung.falsch.length > 0);
  assert.equal(falsch.zustand.fehlversuche, 1);
  for (const z of table) r = (await pr(tid, { menge: z.set, ziele: z.targets })).body;
  assert.equal(r.geloest, true);
  assert.equal(r.punkteErhalten, punkteFuer(20, 1, 0));
  assert.equal(r.loesung.zeilen.length, table.length);
  assert.ok(r.neueAbzeichen.some((b) => b.id === 'parallelwelten-teilmengen'));
  assert.equal((await pr(tid, { menge: ['S1', 'S3'], ziele: {} })).status, 400, 'Menge kommt nicht vor');
});

test('Keller-Labor: Tabelle vollständig geprüft (Lauf + Entscheidung), Rückwärts nur mit Folge, Wort bleibt auf dem Server', async () => {
  const app = await H.verbundApp();
  const s = await H.angemeldet(app);
  const k = (await s.get('/api/katalog?modul=keller')).body.aufgaben;
  assert.equal(k.length, 20);
  const { kellerTabellenLoesung } = await import('../app/js/engine/pruefer.js');
  const pr = (id, antwort) => post(s, `/api/aufgaben/${id}/pruefen`, { antwort });
  // Tabellen-Trainer aⁿbⁿ: aabb, aab, abb
  const tid = 'keller:anbn:tabelle';
  const ta = (await s.get(`/api/aufgaben/${tid}`)).body.aufgabe;
  assert.deepEqual(ta.worte, ['aabb', 'aab', 'abb']);
  const L = kellerTabellenLoesung(ta.automat, ta.worte).tabellen;
  const tabelle = (w) => L.find((t) => t.wort === w);
  const t0 = tabelle('aabb');
  let r = (await pr(tid, { wort: 0, zeilen: t0.zeilen, akzeptiert: false })).body;
  assert.equal(r.rueckmeldung.richtig, false);
  assert.equal(r.rueckmeldung.fehler.grund, 'akzeptanz');
  assert.equal(r.zustand.fehlversuche, 1);
  r = (await pr(tid, { wort: 0, zeilen: t0.zeilen.slice(0, 3), akzeptiert: true })).body;
  assert.equal(r.rueckmeldung.fehler.grund, 'unvollstaendig');
  const kaputt = t0.zeilen.map((z, i) => (i === 2 ? { ...z, keller: 'A#' } : z));
  r = (await pr(tid, { wort: 0, zeilen: kaputt, akzeptiert: true })).body;
  assert.deepEqual(r.rueckmeldung.fehler, { zeile: 2, grund: 'uebergang' });
  for (let i = 0; i < 3; i++) r = (await pr(tid, { wort: i, zeilen: tabelle(ta.worte[i]).zeilen, akzeptiert: tabelle(ta.worte[i]).akzeptiert })).body;
  assert.equal(r.geloest, true);
  assert.equal(r.punkteErhalten, punkteFuer(10, 3, 0));
  assert.equal(r.loesung.tabellen.length, 3);
  // Rückwärts: öffentlich nur die Folge
  const rid = 'keller:anbn:rueckwaerts';
  const ra = (await s.get(`/api/aufgaben/${rid}`)).body.aufgabe;
  assert.ok(Array.isArray(ra.folge) && ra.folge.length > 3);
  assert.doesNotMatch(JSON.stringify(ra), /aaabbb/);
  r = (await pr(rid, { wort: 'aabb' })).body;
  assert.equal(r.rueckmeldung.richtig, false);
  assert.equal(r.zustand.fehlversuche, 1);
  r = (await pr(rid, { wort: 'aaabbb' })).body;
  assert.equal(r.geloest, true);
  assert.ok(r.rueckmeldung.zeilen.length === ra.folge.length);
  assert.equal(r.loesung.wort, 'aaabbb');
});

test('Rallye: Linksableitung auf dem Server nachgespielt, Baum-Modus braucht zwei verschiedene Ableitungen', async () => {
  const app = await H.verbundApp();
  const s = await H.angemeldet(app);
  const pr = (id, antwort) => post(s, `/api/aufgaben/${id}/pruefen`, { antwort });
  // aⁿbⁿ: S → aSb | ab, Ziel aaabbb
  let r = (await pr('rallye:anbn', { regeln: [['S', 0], ['S', 1]] })).body;
  assert.equal(r.rueckmeldung.richtig, false);
  assert.equal(r.zustand.fehlversuche, 1);
  r = (await pr('rallye:anbn', { regeln: [['S', 0], ['S', 0], ['S', 1]] })).body;
  assert.equal(r.geloest, true);
  assert.equal(r.punkteErhalten, punkteFuer(10, 1, 0));
  assert.equal(r.loesung.schritte, 3);
  assert.equal((await pr('rallye:anbn', { regeln: 'x' })).status, 400);
  // Baum-Modus: zweimal dieselbe Ableitung genügt nicht
  const k = (await s.get('/api/katalog?modul=rallye')).body.aufgaben;
  const baum = k.find((a) => a.schluessel === 'term-mehrdeutig');
  const ba = (await s.get(`/api/aufgaben/${baum.id}`)).body.aufgabe;
  assert.equal(ba.modus, 'baum');
  const { parseGrammar, tokenizeWord } = await import('../app/js/engine/grammar.js');
  const g = parseGrammar(ba.grammatik);
  const w = tokenizeWord(g, ba.ziel).tokens;
  // alle Linksableitungen per Tiefensuche (klein)
  const alle = [];
  const dfs = (form, regeln) => {
    if (alle.length >= 2 || regeln.length > 20) return;
    const pos = form.findIndex((x) => x.t === 'N');
    if (pos < 0) { if (form.length === w.length && form.every((x, i) => x.v === w[i])) alle.push(regeln); return; }
    if (form.filter((x) => x.t === 'T').length > w.length) return;
    (g.byLhs.get(form[pos].v) ?? []).forEach((rg, idx) => dfs([...form.slice(0, pos), ...rg.rhs, ...form.slice(pos + 1)], [...regeln, [form[pos].v, idx]]));
  };
  dfs([{ t: 'N', v: g.start }], []);
  assert.equal(alle.length, 2);
  assert.equal((await pr(baum.id, { baeume: [alle[0], alle[0]] })).body.rueckmeldung.richtig, false);
  r = (await pr(baum.id, { baeume: alle })).body;
  assert.equal(r.geloest, true);
  assert.ok(r.neueAbzeichen.some((b) => b.id === 'rallye-mehrdeutig'));
});

test('Grammatik-Tester: Sprache bis maxLen, rechtsregulär verlangt, Tipp kostet, Musterlösung erst danach', async () => {
  const app = await H.verbundApp();
  const s = await H.angemeldet(app);
  const k = (await s.get('/api/katalog?modul=grammatik')).body.aufgaben;
  assert.ok(k.length >= 8);
  const id = 'grammatik:anbn';
  const a = (await s.get(`/api/aufgaben/${id}`)).body;
  assert.doesNotMatch(JSON.stringify(a), /musterloesung|aSb/);
  const pr = (antwort) => post(s, `/api/aufgaben/${id}/pruefen`, { antwort });
  let r = (await pr({ grammatik: 'S → aSb | ε' })).body;
  assert.equal(r.rueckmeldung.richtig, false);
  assert.equal(r.rueckmeldung.grund, 'sprache');
  assert.deepEqual(r.rueckmeldung.zuviel, []);
  assert.equal((await pr({ grammatik: 'S → → x' })).status, 400);
  assert.equal((await post(s, `/api/aufgaben/${id}/tipp`)).body.zustand.tipps.length, 1);
  r = (await pr({ grammatik: 'S → aSb | ab' })).body;
  assert.equal(r.geloest, true);
  assert.equal(r.punkteErhalten, punkteFuer(20, 1, 1));
  assert.equal(r.loesung.musterloesung, 'S → aSb | ab');
  // rechtsregulär verlangt: kontextfreie Grammatik der richtigen Sprache reicht nicht
  const reg = k.find((x) => x.stufe === 2 && x.schluessel !== 'anbn' && x.schluessel !== 'palindrome');
  const ra = (await s.get(`/api/aufgaben/${reg.id}`)).body.aufgabe;
  if (ra.regulaer) {
    const { GRAMMATIK_CHALLENGES } = await import('../inhalte/grammatik.js');
    const mu = GRAMMATIK_CHALLENGES.find((c) => c.id === reg.schluessel).musterloesung;
    assert.equal((await post(s, `/api/aufgaben/${reg.id}/pruefen`, { antwort: { grammatik: mu } })).body.rueckmeldung.richtig, true);
  }
});

test('Turing-Labor: fehlende Regel auf dem Server gegen die Referenz geprüft, Regel bleibt verborgen', async () => {
  const app = await H.verbundApp();
  const s = await H.angemeldet(app);
  const id = 'turing:binaer-luecke';
  const a = (await s.get(`/api/aufgaben/${id}`)).body.aufgabe;
  assert.equal(a.maschine.delta.S1['1'], undefined, 'fehlende Regel nicht ausgeliefert');
  const pr = (antwort) => post(s, `/api/aufgaben/${id}/pruefen`, { antwort });
  let r = (await pr({ to: 'S1', write: '1', move: 'L' })).body;
  assert.equal(r.rueckmeldung.richtig, false);
  assert.equal(r.zustand.fehlversuche, 1);
  assert.equal((await pr({ to: 'X', write: '1', move: 'L' })).status, 400);
  const { TURING_PROGRAMME } = await import('../app/js/data/turing.js');
  const [to, write, move] = TURING_PROGRAMME.find((p) => p.id === 'binaer-plus-1').maschine.delta.S1['1'];
  r = (await pr({ to, write, move })).body;
  assert.equal(r.geloest, true);
  assert.equal(r.punkteErhalten, punkteFuer(20, 1, 0));
  assert.deepEqual(r.loesung.regel, { to, write, move });
});

test('„Lösung zeigen“: 0 Punkte, Lösung sichtbar, danach selbst gelöst = nachgelöst ohne Punkte', async () => {
  const app = await H.verbundApp();
  const s = await H.angemeldet(app);
  const id = 'baukasten:endet-b';
  const d = (await post(s, `/api/aufgaben/${id}/aufdecken`)).body;
  assert.equal(d.zustand.status, 'angesehen');
  assert.ok(d.loesung.musterloesung);
  assert.deepEqual(d.zustand.tipps, ['Der Automat muss sich nur das zuletzt gelesene Zeichen merken.']);
  const r = (await post(s, `/api/aufgaben/${id}/pruefen`, { antwort: { automat: { alphabet: ['a', 'b'], start: 'S0', accepting: ['S1'], delta: { S0: { a: 'S0', b: 'S1' }, S1: { a: 'S0', b: 'S1' } } } } })).body;
  assert.equal(r.ok, true);
  assert.equal(r.punkteErhalten, 0);
  assert.equal(r.geloest, false, 'kein erstes Lösen');
  assert.equal(r.nachgeloest, true, 'Signal für den Browser: Lernstand neu laden');
  assert.deepEqual(r.neueAbzeichen.map((b) => b.id), ['baukasten-erster']);
  const ls = (await s.get('/api/lernstand')).body;
  assert.ok(ls.solved[id], 'nachgelöst zählt als gelöst');
  assert.equal(ls.punkte, 0);
  const r2 = (await post(s, `/api/aufgaben/${id}/pruefen`, { antwort: { automat: d.loesung.musterloesung } })).body;
  assert.equal(r2.nachgeloest, false, 'nur einmal nachgelöst');
  assert.equal((await post(s, '/api/aufgaben/quiz:ds-1/aufdecken')).status, 400, 'Quiz ohne Aufdecken');
});

test('Nachgelöst zählt für Stufen-Abzeichen (ohne Punkte, ohne Volltreffer)', async () => {
  const app = await H.verbundApp();
  const s = await H.angemeldet(app);
  const stufe1 = (await s.get('/api/katalog?modul=baukasten')).body.aufgaben.filter((a) => a.stufe === 1);
  assert.ok(stufe1.length > 1);
  let letzte;
  for (const a of stufe1) {
    const d = (await post(s, `/api/aufgaben/${a.id}/aufdecken`)).body;
    letzte = (await post(s, `/api/aufgaben/${a.id}/pruefen`, { antwort: { automat: d.loesung.musterloesung } })).body;
    assert.equal(letzte.nachgeloest, true, a.id);
  }
  assert.ok(letzte.neueAbzeichen.some((b) => b.id === 'baukasten-stufe-1'), 'Stufen-Abzeichen nach der letzten nachgelösten Challenge');
  const ls = (await s.get('/api/lernstand')).body;
  assert.ok(ls.badges.includes('baukasten-stufe-1'));
  assert.equal(ls.punkte, 0);
});

test('Quiz: jede Frage einmal gewertet, Punkte = Anteil richtig im ersten Durchgang; Wiederholen ist Übung', async () => {
  const app = await H.verbundApp();
  const s = await H.angemeldet(app);
  const id = 'quiz:ds-1';
  const q = (await s.get(`/api/aufgaben/${id}`)).body.aufgabe;
  assert.equal(q.fragen.length, 3);
  // Frage 0 (mc): zuerst falsch raten, dann richtig – gewertet wird nur die erste Antwort
  const f0 = q.fragen[0];
  let r = (await post(s, `/api/aufgaben/${id}/pruefen`, { antwort: { frage: 0, wahl: f0.optionen[0].id } })).body;
  const richtig0 = r.rueckmeldung.richtig;
  const ersteWertung = r.rueckmeldung.wert;
  r = (await post(s, `/api/aufgaben/${id}/pruefen`, { antwort: { frage: 0, wahl: richtig0 } })).body;
  assert.equal(r.rueckmeldung.wert, 1);
  assert.equal(r.fertig, false);
  // Frage 1 (mc) richtig (Text aus inhalte/quiz.js)
  const f1 = q.fragen[1];
  r = (await post(s, `/api/aufgaben/${id}/pruefen`, { antwort: { frage: 1, wahl: f1.optionen.find((o) => o.text === 'Mit einem Pfeil „Start“').id } })).body;
  assert.equal(r.rueckmeldung.wert, 1);
  // Frage 2 (wf): Aussage ist wahr, Begründung richtig
  const f2 = q.fragen[2];
  const begr = f2.begruendungen.find((b) => /Schleifen für alle Zeichen/.test(b.text)).id;
  r = (await post(s, `/api/aufgaben/${id}/pruefen`, { antwort: { frage: 2, wahr: true, begruendung: begr } })).body;
  assert.equal(r.rueckmeldung.wert, 1);
  assert.equal(r.fertig, true);
  assert.equal(r.geloest, true);
  const anteil = (ersteWertung + 1 + 1) / 3;
  assert.equal(r.punkteErhalten, Math.round(10 * anteil));
  assert.equal(r.loesung.ergebnis.prozent, Math.round(100 * anteil));
  assert.ok(r.neueAbzeichen.some((b) => b.id === 'quiz-erstes'));
  const ls = (await s.get('/api/lernstand')).body;
  assert.equal(ls.best[id], Math.round(100 * anteil));
  // Wiederholen: Rückmeldung ja, Wertung bleibt
  r = (await post(s, `/api/aufgaben/${id}/pruefen`, { antwort: { frage: 0, wahl: richtig0 } })).body;
  assert.equal(r.punkteErhalten, 0);
  assert.equal((await s.get('/api/lernstand')).body.best[id], Math.round(100 * anteil));
  // ungültige Antworten
  assert.equal((await post(s, `/api/aufgaben/${id}/pruefen`, { antwort: { frage: 7, wahl: 'x' } })).status, 400);
  assert.equal((await post(s, `/api/aufgaben/${id}/pruefen`, { antwort: { frage: 2, wahr: 'ja' } })).status, 400);
});

test('Quiz-Zuordnung: Teilpunkte ab der Hälfte, Lösung nach der Antwort', async () => {
  const app = await H.verbundApp();
  const s = await H.angemeldet(app);
  const id = 'quiz:welt-A';
  const q = (await s.get(`/api/aufgaben/${id}`)).body.aufgabe;
  const i = q.fragen.findIndex((f) => f.typ === 'zuordnung');
  assert.ok(i >= 0);
  const f = q.fragen[i];
  const r = (await post(s, `/api/aufgaben/${id}/pruefen`, { antwort: { frage: i, zuordnung: f.links.map(() => f.rechts[0]) } })).body;
  assert.equal(r.rueckmeldung.loesung.length, f.links.length);
  assert.ok([0, 0.5, 1].includes(r.rueckmeldung.wert));
});

test('Löschung über die Verbund-API entfernt auch Lernstand und Abzeichen', async () => {
  const app = await H.verbundApp();
  const s = await H.angemeldet(app);
  await post(s, '/api/aufgaben/baukasten:endet-b/aufdecken');
  const t = H.verbundToken(app.now, 'loeschen');
  const r = await request(app).post('/api/verbund/loeschen').set('Authorization', `Bearer ${t}`).send({ sub: 's:1042' });
  assert.equal(r.status, 200);
  assert.ok(r.body.geloescht >= 3);
  assert.equal(app.locals.db.prepare('SELECT COUNT(*) AS n FROM fortschritt').get().n, 0);
});
