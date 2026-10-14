'use strict';
// Klassen-Challenges (PR 11, Franks Entscheidung 14.10.2026): Die Lehrkraft legt im Kurs eine Challenge an – Titel,
// Zeitraum, Inhalt und Wertung. Gewertet wird nur, was im Zeitraum passiert; das Ergebnis steht nur in der
// Challenge-Liste (keine zusätzlichen Punkte). Wertung wählbar:
//   einzel – Rangliste mit Anzeigenamen (gleiche Werte = gleicher Platz)
//   team   – der Kurs wird in 2–6 Teams geteilt (zufällig, gleich groß; Neue kommen ins kleinste Team);
//            sichtbar sind nur die Team-Summen und der eigene Beitrag, keine Einzelwerte anderer.
// Inhalt:
//   training – richtige Antworten im Training (arena | unterscheide | sortierer), nur beendete Runden
//   aufgaben – im Zeitraum (erstmals) gelöste Aufgaben aus einer Auswahl (Katalog-IDs und eigene Aufgaben des Kurses)
// Nach dem Ende: Abzeichen für die Plätze 1–3 bzw. für das Gewinnerteam (nur mit Wert > 0).

const crypto = require('node:crypto');

const TRAINING = { arena: 'Akzeptor-Arena', unterscheide: 'Unterscheide!', sortierer: 'Chomsky-Sortierer' };
const TEAMNAMEN = ['Team Akzeptor', 'Team Keller', 'Team Mealy', 'Team Grammatik', 'Team Turing', 'Team Teilmenge'];
const MAX_AKTIV = 10;
const MAX_TAGE = 60;
const fehler = (status, text) => Object.assign(new Error(text), { status });
const ungueltig = (t) => fehler(400, t);

function createChallenges(ctx, { konten, aufgaben, eigene = null }) {
  const { db } = ctx;
  const iso = (ms = ctx.now()) => new Date(ms).toISOString();
  const zufall = ctx.random ?? ((n) => crypto.randomInt(n));
  const json = (s, e) => { try { return JSON.parse(s); } catch { return e; } };

  const lehrkraftVon = (konto, kursId) => konten.kurseVon(konto.sub).some((k) => k.id === kursId && k.rolle === 'lehrkraft');
  const mitgliedVon = (konto, kursId) => konten.kurseVon(konto.sub).some((k) => k.id === kursId && k.rolle === 'mitglied');
  const zeile = (id) => db.prepare('SELECT * FROM challenges WHERE id = ?').get(Number(id) || 0);
  const phase = (c) => (ctx.now() < Date.parse(c.start_at) ? 'geplant' : ctx.now() < Date.parse(c.ende_at) ? 'laeuft' : 'beendet');

  /* ---------- Eingaben ---------- */
  function pruefe(kursId, body) {
    const titel = typeof body?.titel === 'string' ? body.titel.trim() : '';
    if (titel.length < 3 || titel.length > 80 || /[\u0000-\u001F\u007F]/.test(titel)) throw ungueltig('Der Titel hat 3 bis 80 Zeichen.');
    const start = Date.parse(body?.start); const ende = Date.parse(body?.ende);
    if (!Number.isFinite(start) || !Number.isFinite(ende)) throw ungueltig('Bitte Beginn und Ende angeben.');
    if (ende <= start) throw ungueltig('Das Ende muss nach dem Beginn liegen.');
    if (ende - start > MAX_TAGE * 86400000) throw ungueltig(`Eine Challenge dauert höchstens ${MAX_TAGE} Tage.`);
    if (ende <= ctx.now()) throw ungueltig('Das Ende liegt in der Vergangenheit.');
    const wertung = body?.wertung;
    if (!['einzel', 'team'].includes(wertung)) throw ungueltig('Wählen Sie Einzel- oder Team-Wertung.');
    const teams = wertung === 'team' ? Number(body.teams) : 0;
    if (wertung === 'team' && !(Number.isInteger(teams) && teams >= 2 && teams <= TEAMNAMEN.length)) throw ungueltig(`2 bis ${TEAMNAMEN.length} Teams.`);
    const art = body?.art;
    let inhalt;
    if (art === 'training') {
      if (!TRAINING[body.modul]) throw ungueltig('Wählen Sie ein Training.');
      inhalt = { modul: body.modul };
    } else if (art === 'aufgaben') {
      const ids = Array.isArray(body.aufgaben) ? [...new Set(body.aufgaben.map(String))] : [];
      if (ids.length < 1 || ids.length > 100) throw ungueltig('Wählen Sie 1 bis 100 Aufgaben.');
      for (const id of ids) {
        const ok = aufgaben.map.has(id) || (id.startsWith('eigen:') && eigene && db.prepare('SELECT 1 FROM eigene_aufgaben WHERE id = ? AND kurs_id = ?').get(eigene.nummer(id), kursId));
        if (!ok) throw ungueltig('Eine der gewählten Aufgaben gibt es nicht (eigene Aufgaben nur aus diesem Kurs).');
      }
      inhalt = { aufgaben: ids };
    } else throw ungueltig('Wählen Sie, was zählt: Training oder Aufgaben.');
    return { titel, start: iso(start), ende: iso(ende), wertung, teams, art, inhalt };
  }

  function anlegen(konto, kursId, body) {
    if (!lehrkraftVon(konto, kursId)) throw fehler(404, 'Diesen Kurs gibt es nicht.');
    const d = pruefe(kursId, body);
    const offen = db.prepare('SELECT COUNT(*) AS n FROM challenges WHERE kurs_id = ? AND ende_at > ?').get(kursId, iso()).n;
    if (offen >= MAX_AKTIV) throw ungueltig(`Höchstens ${MAX_AKTIV} laufende oder geplante Challenges je Kurs.`);
    const info = db.prepare('INSERT INTO challenges (kurs_id, autor_sub, titel, art, inhalt, wertung, teams, start_at, ende_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(kursId, konto.sub, d.titel, d.art, JSON.stringify(d.inhalt), d.wertung, d.teams, d.start, d.ende, iso());
    const c = zeile(Number(info.lastInsertRowid));
    if (c.wertung === 'team') teamsZuordnen(c);
    return detail(c, { lehrkraft: true });
  }

  /** Teams gleich groß und zufällig; wer später in den Kurs kommt, landet im kleinsten Team. */
  function teamsZuordnen(c) {
    const mitglieder = konten.mitglieder(c.kurs_id).map((m) => m.sub);
    const schon = new Map(db.prepare('SELECT sub, team FROM challenge_teams WHERE challenge_id = ?').all(c.id).map((r) => [r.sub, r.team]));
    const neu = mitglieder.filter((s) => !schon.has(s));
    for (let i = neu.length - 1; i > 0; i--) { const j = zufall(i + 1); [neu[i], neu[j]] = [neu[j], neu[i]]; }
    const groesse = Array.from({ length: c.teams }, (_, t) => [...schon.values()].filter((x) => x === t).length);
    const ins = db.prepare('INSERT OR IGNORE INTO challenge_teams (challenge_id, sub, team) VALUES (?, ?, ?)');
    for (const s of neu) { const t = groesse.indexOf(Math.min(...groesse)); groesse[t]++; ins.run(c.id, s, t); schon.set(s, t); }
    return schon;
  }

  /** Wert je Mitglied im Zeitraum. */
  function werte(c) {
    const subs = konten.mitglieder(c.kurs_id).map((m) => m.sub);
    const m = new Map(subs.map((s) => [s, 0]));
    if (!subs.length) return m;
    const inhalt = json(c.inhalt, {});
    const q = subs.map(() => '?').join(',');
    if (c.art === 'training') {
      for (const r of db.prepare(`SELECT sub, COALESCE(SUM(richtig), 0) AS n FROM training WHERE status = 'fertig' AND modul = ? AND ended_at >= ? AND ended_at <= ? AND sub IN (${q}) GROUP BY sub`).all(inhalt.modul, c.start_at, c.ende_at, ...subs)) m.set(r.sub, r.n);
    } else {
      const ids = inhalt.aufgaben ?? [];
      if (ids.length) {
        for (const r of db.prepare(`SELECT sub, COUNT(*) AS n FROM fortschritt WHERE status = 'geloest' AND geloest_at >= ? AND geloest_at <= ? AND sub IN (${q}) AND aufgabe_id IN (${ids.map(() => '?').join(',')}) GROUP BY sub`).all(c.start_at, c.ende_at, ...subs, ...ids)) m.set(r.sub, r.n);
      }
    }
    return m;
  }

  const mitPlatz = (zeilen) => {
    const s = [...zeilen].sort((a, b) => b.wert - a.wert || String(a.name).localeCompare(String(b.name), 'de'));
    return s.map((z) => ({ ...z, platz: 1 + s.filter((y) => y.wert > z.wert).length }));
  };

  /** Ergebnis einer Challenge: Einzel-Rangliste bzw. Team-Summen. ich = sub des Betrachters (Schüler). */
  function ergebnis(c, ich = null, { lehrkraft = false } = {}) {
    const w = werte(c);
    const namen = new Map(konten.mitglieder(c.kurs_id).map((m) => [m.sub, m.name]));
    if (c.wertung === 'einzel') {
      return { liste: mitPlatz([...w].map(([sub, wert]) => ({ sub, name: namen.get(sub), wert }))).map(({ sub, ...z }) => ({ ...z, ...(sub === ich ? { ich: true } : {}), ...(lehrkraft ? { sub } : {}) })) };
    }
    const zuordnung = phase(c) === 'beendet' ? new Map(db.prepare('SELECT sub, team FROM challenge_teams WHERE challenge_id = ?').all(c.id).map((r) => [r.sub, r.team])) : teamsZuordnen(c);
    const teams = Array.from({ length: c.teams }, (_, t) => ({ team: t, name: TEAMNAMEN[t], wert: 0, mitglieder: 0, ...(lehrkraft ? { namen: [] } : {}) }));
    for (const [sub, t] of zuordnung) {
      if (!namen.has(sub) || !teams[t]) continue;
      teams[t].wert += w.get(sub) ?? 0; teams[t].mitglieder++;
      if (lehrkraft) teams[t].namen.push(namen.get(sub));
    }
    for (const t of teams) t.schnitt = t.mitglieder ? Math.round((10 * t.wert) / t.mitglieder) / 10 : 0;
    const liste = mitPlatz(teams.map((t) => ({ ...t, name: t.name })));
    const meins = ich != null && zuordnung.has(ich) ? { team: TEAMNAMEN[zuordnung.get(ich)], beitrag: w.get(ich) ?? 0 } : null;
    return { teams: liste, ...(meins ? { ich: meins } : {}) };
  }

  /** Nach dem Ende einmalig Abzeichen vergeben (Plätze 1–3 bzw. Gewinnerteam, nur mit Wert > 0). */
  function abschliessen(c) {
    if (phase(c) !== 'beendet' || c.abgeschlossen) return;
    const e = ergebnis(c, null, { lehrkraft: true });
    const vergib = db.prepare('INSERT OR IGNORE INTO abzeichen (sub, schluessel, at) VALUES (?, ?, ?)');
    db.transaction(() => {
      const info = db.prepare('UPDATE challenges SET abgeschlossen = 1 WHERE id = ? AND abgeschlossen = 0').run(c.id);
      if (!info.changes) return;
      if (e.liste) for (const z of e.liste) { if (z.wert > 0 && z.platz <= 3) vergib.run(z.sub, z.platz === 1 ? 'challenge-sieg' : 'challenge-podium', iso()); }
      else {
        const sieger = e.teams.filter((t) => t.platz === 1 && t.wert > 0).map((t) => t.team);
        for (const r of db.prepare('SELECT sub, team FROM challenge_teams WHERE challenge_id = ?').all(c.id)) if (sieger.includes(r.team)) vergib.run(r.sub, 'challenge-team', iso());
      }
    })();
  }

  function kopf(c) {
    const inhalt = json(c.inhalt, {});
    return {
      id: c.id, titel: c.titel, art: c.art, wertung: c.wertung, teamAnzahl: c.teams || null, start: c.start_at, ende: c.ende_at, phase: phase(c),
      zaehlt: c.art === 'training' ? `richtige Antworten im Training „${TRAINING[inhalt.modul]}“` : `gelöste Aufgaben aus einer Auswahl von ${inhalt.aufgaben.length}`,
      ...(c.art === 'training' ? { modul: inhalt.modul } : { aufgaben: inhalt.aufgaben.map((id) => {
        const k = aufgaben.map.get(id);
        if (k) return { id, titel: k.titel, modul: k.modul };
        const e = id.startsWith('eigen:') ? eigene?.aufgabe(id) : null;
        const nr = id.slice('eigen:'.length);
        return { id, titel: e?.titel ?? 'gelöschte Aufgabe', modul: 'eigen', ...(e ? { link: e.art === 'eigen-quiz' ? `#/quiz?eigen=${nr}` : `#/baukasten?eigen=${nr}` } : {}) };
      }) })
    };
  }

  function detail(c, { ich = null, lehrkraft = false } = {}) {
    abschliessen(c);
    return { ...kopf(c), ...(phase(c) === 'geplant' && !lehrkraft ? {} : ergebnis(c, ich, { lehrkraft })) };
  }

  /* ---------- Lehrkraft ---------- */
  function liste(kursId) {
    return db.prepare('SELECT * FROM challenges WHERE kurs_id = ? ORDER BY ende_at DESC').all(kursId).map((c) => kopf(c));
  }
  function fuerLehrkraft(konto, id) {
    const c = zeile(id);
    if (!c || !lehrkraftVon(konto, c.kurs_id)) throw fehler(404, 'Diese Challenge gibt es nicht.');
    return c;
  }
  const lehrkraftDetail = (konto, id) => detail(fuerLehrkraft(konto, id), { lehrkraft: true });
  function beenden(konto, id) {
    const c = fuerLehrkraft(konto, id);
    if (phase(c) === 'beendet') return detail(c, { lehrkraft: true });
    const jetzt = iso();
    db.prepare('UPDATE challenges SET ende_at = ?, start_at = MIN(start_at, ?) WHERE id = ?').run(jetzt, jetzt, c.id);
    return detail(zeile(c.id), { lehrkraft: true });
  }
  function loeschen(konto, id) {
    const c = fuerLehrkraft(konto, id);
    db.prepare('DELETE FROM challenges WHERE id = ?').run(c.id);
    return { geloescht: true };
  }

  /* ---------- Schüler ---------- */
  function fuerSchueler(sub) {
    const kurse = konten.kurseVon(sub).filter((k) => k.rolle === 'mitglied');
    if (!kurse.length) return [];
    const namen = new Map(kurse.map((k) => [k.id, k.name]));
    const grenze = iso(ctx.now() - 14 * 86400000); // beendete noch zwei Wochen zeigen
    return db.prepare(`SELECT * FROM challenges WHERE kurs_id IN (${kurse.map(() => '?').join(',')}) AND ende_at >= ? ORDER BY start_at`).all(...kurse.map((k) => k.id), grenze)
      .map((c) => ({ ...kopf(c), kurs: namen.get(c.kurs_id) }));
  }
  function schuelerDetail(konto, id) {
    const c = zeile(id);
    if (!c || !(mitgliedVon(konto, c.kurs_id) || lehrkraftVon(konto, c.kurs_id))) throw fehler(404, 'Diese Challenge gibt es nicht.');
    return detail(c, { ich: konto.sub });
  }

  /** Für das Beamer-Board: laufende Challenges des Kurses (ohne IDs). */
  function fuerBoard(kursId) {
    return db.prepare('SELECT * FROM challenges WHERE kurs_id = ? AND start_at <= ? AND ende_at >= ? ORDER BY ende_at').all(kursId, iso(), iso()).map((c) => {
      const e = ergebnis(c);
      return { titel: c.titel, ende: c.ende_at, zaehlt: kopf(c).zaehlt, ...(e.liste ? { liste: e.liste.slice(0, 10).map(({ ich, ...z }) => z) } : { teams: e.teams }) };
    });
  }

  return { anlegen, liste, lehrkraftDetail, beenden, loeschen, fuerSchueler, schuelerDetail, fuerBoard, TRAINING, TEAMNAMEN };
}

module.exports = { createChallenges, TEAMNAMEN };
