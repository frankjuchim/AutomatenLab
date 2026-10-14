'use strict';
// Training (Umsetzung des Vertrags, docs/VERBUND.md §6; Muster: Trainingsplatz von Algo Quest src/services/training.js):
// Akzeptor-Arena, „Unterscheide!“ und Chomsky-Sortierer sind Spielrunden. Der Server erzeugt die Runde (mit Lösungen,
// gespeichert in training.daten), die App spielt sie und schickt am Ende alle Antworten (Sortierer: jede Karte einzeln,
// weil die Begründung sofort kommt – es zählt die erste Antwort je Karte); der Server zählt sie und vergibt 1 Punkt je
// richtiger Antwort, höchstens TRAINING_MAX_TAG Punkte je Kalendertag (Europe/Berlin). Arena-Rekorde je Stufe zählen
// nur für Zeitrunden, die rechtzeitig beendet wurden; Sortierer-Rekorde nur für Zehnerrunden.

const TRAINING_MAX_TAG = 30;
const ARENA_FRIST_MS = (60 + 30) * 1000; // 60 s Spielzeit + Puffer für Laden und Netz
const ARENA_ANZAHL = 150;

const fehler = (status, text) => Object.assign(new Error(text), { status });

/** Kalendertag in Deutschland (für das Tageslimit) – wie Algo Quest. */
function tagBerlin(t) {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(t));
}

function createTraining(ctx, { aufgaben }) {
  const { db } = ctx;
  const { T, arena, minimierer, sortierer } = aufgaben.training;
  const titelAbzeichen = aufgaben.abzeichen;
  const iso = () => new Date(ctx.now()).toISOString();

  const punkteHeute = (sub) => db.prepare('SELECT COALESCE(SUM(punkte), 0) AS p FROM training WHERE sub = ? AND tag = ?').get(sub, tagBerlin(ctx.now())).p;
  const info = (sub) => ({ heute: punkteHeute(sub), maxProTag: TRAINING_MAX_TAG });

  /**
   * Neue Runde. modul arena: { stufe 1–3, automat?, ueben? }; modul unterscheide: { aufgabe? } (Minimierer-Schlüssel);
   * modul sortierer: { alle? } (alle Karten statt einer Zehnerrunde).
   */
  function neu(sub, modul, body) {
    const b = body || {};
    let items;
    let art;
    let oeffentlich;
    if (modul === 'arena') {
      const stufe = [1, 2, 3].includes(b.stufe) ? b.stufe : 1;
      const nurId = typeof b.automat === 'string' && b.automat ? b.automat : null;
      if (nurId && !arena.some((a) => a.id === nurId)) throw fehler(404, 'Diesen Automaten gibt es in der Arena nicht.');
      items = T.erzeugeArenaRunde(arena, { stufe, nurId, anzahl: ARENA_ANZAHL });
      art = nurId ? `automat-${nurId}` : `stufe-${stufe}${b.ueben === true ? '-ueben' : ''}`;
      oeffentlich = items.map((x) => ({ automat: x.automat, wort: x.wort }));
    } else if (modul === 'unterscheide') {
      const nurId = typeof b.aufgabe === 'string' && b.aufgabe ? b.aufgabe : null;
      items = T.erzeugeUnterscheideRunde(minimierer, { nurId });
      art = nurId ? `aufgabe-${nurId}` : 'gemischt';
      oeffentlich = items.map((x) => ({ aufgabe: x.aufgabe, p: x.p, q: x.q }));
    } else if (modul === 'sortierer') {
      items = T.erzeugeSortiererRunde(sortierer, { alle: b.alle === true });
      art = b.alle === true ? 'alle' : 'runde';
      oeffentlich = items.map((x) => ({ text: x.text }));
    } else throw fehler(404, 'Dieses Training gibt es nicht.');
    // Nur eine offene Runde je Modul: ältere, nicht beendete Runden verfallen ohne Wertung
    db.prepare("DELETE FROM training WHERE sub = ? AND modul = ? AND status = 'offen'").run(sub, modul);
    const r = db.prepare('INSERT INTO training (sub, modul, art, daten, tag, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(sub, modul, art, JSON.stringify(modul === 'sortierer' ? { items, antworten: items.map(() => null) } : { items }), tagBerlin(ctx.now()), iso());
    return { id: Number(r.lastInsertRowid), modul, art, items: oeffentlich, ...info(sub) };
  }

  function vergibAbzeichen(sub, liste) {
    const neu = [];
    for (const k of liste) {
      if (db.prepare('INSERT OR IGNORE INTO abzeichen (sub, schluessel, at) VALUES (?, ?, ?)').run(sub, k, iso()).changes) {
        neu.push({ id: k, titel: titelAbzeichen.get(k)?.titel || k, text: titelAbzeichen.get(k)?.text || '' });
      }
    }
    return neu;
  }

  const offeneRunde = (sub, id) => {
    const r = db.prepare('SELECT * FROM training WHERE id = ? AND sub = ?').get(Number(id), sub);
    if (!r) throw fehler(404, 'Diese Runde gibt es nicht (mehr).');
    if (r.status !== 'offen') throw fehler(409, 'Diese Runde ist schon beendet.');
    return r;
  };

  /** Sortierer: eine Karte einsortieren { i, typ } → { richtig, typ, warum }. Es zählt die erste Antwort je Karte. */
  function antwort(sub, id, body) {
    const r = offeneRunde(sub, id);
    if (r.modul !== 'sortierer') throw fehler(400, 'Diese Runde nimmt keine Einzelantworten an.');
    const d = JSON.parse(r.daten);
    const { i, typ } = body || {};
    if (!Number.isInteger(i) || i < 0 || i >= d.items.length) throw fehler(400, 'Diese Karte gibt es in der Runde nicht.');
    if (d.antworten[i] != null) return { ...T.pruefeSortiererKarte(d.items[i], d.antworten[i]), wiederholt: true };
    const erg = T.pruefeSortiererKarte(d.items[i], typ);
    d.antworten[i] = typ;
    db.prepare('UPDATE training SET daten = ? WHERE id = ?').run(JSON.stringify(d), r.id);
    return erg;
  }

  /**
   * Runde beenden: Antworten zählen, Trainingspunkte und Rekord vergeben. antworten wie in app/js/engine/training.js;
   * beim Sortierer zählen die gespeicherten Einzelantworten (body wird nicht gebraucht).
   */
  function ende(sub, id, body) {
    const r = offeneRunde(sub, id);
    const d = JSON.parse(r.daten);
    const { items } = d;
    const antworten = r.modul === 'sortierer' ? d.antworten : (body || {}).antworten;
    const erg = r.modul === 'arena' ? T.werteArenaRunde(items, antworten)
      : r.modul === 'sortierer' ? T.werteSortiererRunde(items, antworten)
        : T.werteUnterscheideRunde(minimierer, items, antworten);
    const zeitrunde = r.modul === 'arena' && /^stufe-\d$/.test(r.art);
    const rechtzeitig = ctx.now() - Date.parse(r.created_at) <= ARENA_FRIST_MS;
    const wertung = (zeitrunde && rechtzeitig) || (r.modul === 'sortierer' && r.art === 'runde') ? 1 : 0;
    const stufe = zeitrunde ? Number(r.art.slice(6)) : null;
    const score = r.modul === 'sortierer' ? erg.richtig : erg.score ?? 0;
    let punkte = 0;
    let rekordVorher = null;
    db.transaction(() => {
      punkte = Math.max(0, Math.min(erg.richtig, TRAINING_MAX_TAG - punkteHeute(sub)));
      if (wertung) {
        rekordVorher = db.prepare('SELECT MAX(score) AS m FROM training WHERE sub = ? AND modul = ? AND art = ? AND wertung = 1').get(sub, r.modul, r.art).m;
      }
      db.prepare("UPDATE training SET status = 'fertig', richtig = ?, score = ?, serie = ?, wertung = ?, punkte = ?, tag = ?, ended_at = ? WHERE id = ?")
        .run(erg.richtig, score, erg.besteSerie ?? 0, wertung, punkte, tagBerlin(ctx.now()), iso(), r.id);
    })();
    const neuAb = [];
    if (r.modul === 'arena') {
      if (antworten.length > 0) neuAb.push('arena-erste-runde');
      if (erg.besteSerie >= 10) neuAb.push('arena-serie-10');
      if (wertung && erg.score >= 100) neuAb.push('arena-100');
      if (wertung && stufe === 3 && erg.score >= 120) neuAb.push('arena-profi');
    } else if (r.modul === 'sortierer') {
      if (erg.richtig + erg.falsch > 0) neuAb.push('sortierer-erste');
      if (wertung && erg.richtig === items.length) neuAb.push('sortierer-perfekt');
    } else {
      const gesamt = db.prepare("SELECT COALESCE(SUM(richtig), 0) AS n FROM training WHERE sub = ? AND modul = 'unterscheide'").get(sub).n;
      if (gesamt >= 10) neuAb.push('minimierer-unterscheider');
    }
    return {
      ...erg,
      punkteErhalten: punkte,
      wertung: !!wertung,
      ...(zeitrunde && !rechtzeitig ? { zuSpaet: true } : {}),
      ...(wertung ? { rekord: score > (rekordVorher ?? 0), rekordVorher: rekordVorher ?? 0 } : {}),
      neueAbzeichen: vergibAbzeichen(sub, neuAb),
      ...info(sub)
    };
  }

  /** Für den Lernstand: Trainingspunkte gesamt, Arena-Rekorde je Stufe („arena:1“ …) und Sortierer-Rekord („sortierer:runde“). */
  function stand(sub) {
    const punkte = db.prepare('SELECT COALESCE(SUM(punkte), 0) AS p FROM training WHERE sub = ?').get(sub).p;
    const best = {};
    for (const z of db.prepare("SELECT art, MAX(score) AS m FROM training WHERE sub = ? AND modul = 'arena' AND wertung = 1 GROUP BY art").all(sub)) {
      best[`arena:${z.art.slice(6)}`] = z.m;
    }
    const s = db.prepare("SELECT MAX(score) AS m FROM training WHERE sub = ? AND modul = 'sortierer' AND art = 'runde' AND wertung = 1").get(sub).m;
    if (s != null) best['sortierer:runde'] = s;
    return { punkte, best };
  }

  return { neu, antwort, ende, info, stand, punkteHeute };
}

module.exports = { createTraining, tagBerlin, TRAINING_MAX_TAG };
