'use strict';
// Boss-Kämpfe (Muster: Algo Quest src/services/boss.js): Am Ende der Welten A–C eine Prüfung auf Zeit aus zufällig
// gezogenen Aufgaben (inhalte/boss.js). Während des Kampfes keine Rückmeldung; Antworten werden nur gespeichert,
// gewertet wird am Ende (Abgabe oder Zeitablauf, 30 s Kulanz). Je Aufgabe Stufenpunkte × Wert (1, ½ oder 0).
// Es zählt der beste Versuch je Welt; nach jedem Kampf 12 Stunden Pause. Besiegt ab 50 % der möglichen Punkte.
//
// Freischaltung je Kurs (kurse.einstellungen.boss): 'auto' (Standard: ab 60 % der Level-Punkte der Welt im
// Kursumfang), 'offen' oder 'gesperrt'. Wer in mehreren Kursen ist, bekommt die günstigste Einstellung.
// Lehrkräfte dürfen jederzeit üben (wie alle Aufgaben).

const crypto = require('node:crypto');

const AUTO_ANTEIL = 0.6;
const BESIEGT_ANTEIL = 0.5;
const SPERRE_MS = 12 * 60 * 60 * 1000;
const KULANZ_MS = 30 * 1000;
const BOSS_MODI = ['auto', 'offen', 'gesperrt'];

const fehler = (status, text) => Object.assign(new Error(text), { status });

function createBoss(ctx, { aufgaben, konten, katalog, auswertung }) {
  const { db } = ctx;
  const B = aufgaben.boss;
  const iso = (ms = ctx.now()) => new Date(ms).toISOString();
  const zufall = ctx.random ?? ((n) => crypto.randomInt(n));
  const levelInfo = new Map(katalog.welten.flatMap((w) => w.levels.map((l) => [l.nr, { ...l, welt: w.kennung }])));
  const hauptLevel = (a) => { const l = a.levels || []; return l.length ? (a.modul === 'quiz' && l.length > 1 ? l[l.length - 1] : l[0]) : null; };

  function welt(kennung) {
    const b = B.welten[String(kennung)];
    if (!b) throw fehler(404, 'Diesen Boss gibt es nicht.');
    return b;
  }

  const json = (s, ersatz) => { try { return JSON.parse(s); } catch { return ersatz; } };

  /** Kurse des Schülers mit Kursart und Boss-Einstellung (Lehrkräfte: keine). */
  function kurseVon(sub) {
    return konten.kurseVon(sub).filter((k) => k.rolle === 'mitglied').map((k) => {
      const e = auswertung.einstellungen(konten.kurs(k.id));
      return { kursart: e.kursart, boss: e.boss };
    });
  }

  /** Anteil der Level-Punkte einer Welt im Kursumfang (eA: Niveau alle + eA, gA: nur alle). */
  function levelAnteil(sub, kennung, kursart) {
    const imUmfang = (n) => { const niv = levelInfo.get(n)?.niveau; return niv === 'alle' || (kursart === 'eA' && niv === 'eA'); };
    const auswahl = aufgaben.liste.filter((a) => { const l = hauptLevel(a); return l != null && levelInfo.get(l)?.welt === kennung && imUmfang(l); });
    const max = auswahl.reduce((n, a) => n + a.punkte, 0);
    if (!max) return 0;
    const pkt = new Map(db.prepare('SELECT aufgabe_id, punkte FROM fortschritt WHERE sub = ?').all(sub).map((r) => [r.aufgabe_id, r.punkte]));
    return auswahl.reduce((n, a) => n + (pkt.get(a.id) ?? 0), 0) / max;
  }

  /** Darf der Kampf beginnen? { frei, grund } */
  function zugang(konto, b) {
    if (konto.rolle !== 'schueler') return { frei: true, grund: null };
    const kurse = kurseVon(konto.sub);
    if (kurse.some((k) => k.boss === 'offen')) return { frei: true, grund: null };
    const auto = kurse.filter((k) => k.boss === 'auto');
    if (!auto.length) return { frei: false, grund: 'Deine Lehrkraft hat die Boss-Kämpfe für deinen Kurs gesperrt.' };
    const anteil = Math.max(...auto.map((k) => levelAnteil(konto.sub, b.welt, k.kursart)));
    if (anteil >= AUTO_ANTEIL) return { frei: true, grund: null };
    return { frei: false, grund: `Der Boss erscheint, wenn du ${Math.round(AUTO_ANTEIL * 100)} % der Punkte in den Leveln der Welt ${b.welt} hast – bisher ${Math.floor(anteil * 100)} %.`, anteil };
  }

  /** Aufgaben ziehen: je Stufe laut Mix zufällig, Rest auffüllen, leichte zuerst. Im Grundkurs nur Niveau „alle“, wenn genug da sind. */
  function ziehe(b, nurGrundkurs) {
    let pool = b.pool.map((id) => B.aufgabe(id));
    const alle = pool.filter((a) => a.niveau === 'alle');
    if (nurGrundkurs && alle.length >= b.anzahl) pool = alle;
    const mische = (l) => { const a = [...l]; for (let i = a.length - 1; i > 0; i--) { const j = zufall(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    const gezogen = [];
    for (const [st, n] of Object.entries(b.mix || {})) gezogen.push(...mische(pool.filter((a) => a.stufe === Number(st))).slice(0, n));
    for (const a of mische(pool)) { if (gezogen.length >= b.anzahl) break; if (!gezogen.includes(a)) gezogen.push(a); }
    return gezogen.slice(0, b.anzahl).sort((x, y) => x.stufe - y.stufe);
  }

  /** Abgelaufenen bzw. abgegebenen Kampf werten (nur einmal: ende_at IS NULL). */
  function auswerten(v, endeMs) {
    const ids = json(v.aufgaben, []);
    const antworten = json(v.antworten, {});
    const ergebnis = ids.map((id) => {
      const a = B.aufgabe(id);
      const wert = a ? B.werte(a, antworten[id]) : 0;
      return { id, wert, punkte: a ? Math.round(a.punkte * wert) : 0 };
    });
    const punkte = ergebnis.reduce((n, e) => n + e.punkte, 0);
    const info = db.prepare('UPDATE boss_versuche SET ende_at = ?, punkte = ?, ergebnis = ? WHERE id = ? AND ende_at IS NULL').run(iso(endeMs), punkte, JSON.stringify(ergebnis), v.id);
    if (!info.changes) return [];
    const neu = [];
    const vergib = (k) => { if (db.prepare('INSERT OR IGNORE INTO abzeichen (sub, schluessel, at) VALUES (?, ?, ?)').run(v.sub, k, iso()).changes) neu.push({ id: k, titel: aufgaben.abzeichen.get(k)?.titel ?? k, text: aufgaben.abzeichen.get(k)?.text ?? '' }); };
    if (v.max_punkte && punkte >= BESIEGT_ANTEIL * v.max_punkte) vergib(`boss-${v.welt}`);
    if (v.max_punkte && punkte === v.max_punkte) vergib('boss-makellos');
    return neu;
  }

  /** Abgelaufene offene Kämpfe eines Kontos werten (Deadline + Kulanz vorbei). */
  function raeumeAuf(sub) {
    const jetzt = ctx.now();
    for (const v of db.prepare('SELECT * FROM boss_versuche WHERE sub = ? AND ende_at IS NULL').all(sub)) {
      if (Date.parse(v.deadline_at) + KULANZ_MS < jetzt) auswerten(v, Date.parse(v.deadline_at));
    }
  }

  const bester = (sub, kennung) => db.prepare('SELECT id, punkte, max_punkte FROM boss_versuche WHERE sub = ? AND welt = ? AND ende_at IS NOT NULL ORDER BY punkte DESC, id LIMIT 1').get(sub, kennung);
  const anteilVon = (p, max) => (max ? Math.round((100 * p) / max) / 100 : 0);

  /** Überblick über einen Boss für die Startseite des Kampfes. */
  function status(konto, kennung) {
    const b = welt(kennung);
    raeumeAuf(konto.sub);
    const z = zugang(konto, b);
    const laufend = db.prepare('SELECT id, deadline_at FROM boss_versuche WHERE sub = ? AND welt = ? AND ende_at IS NULL ORDER BY id DESC LIMIT 1').get(konto.sub, b.welt);
    const letzter = db.prepare('SELECT ende_at FROM boss_versuche WHERE sub = ? AND welt = ? AND ende_at IS NOT NULL ORDER BY ende_at DESC LIMIT 1').get(konto.sub, b.welt);
    const gesperrtBis = letzter && Date.parse(letzter.ende_at) + SPERRE_MS > ctx.now() ? iso(Date.parse(letzter.ende_at) + SPERRE_MS) : null;
    const best = bester(konto.sub, b.welt);
    const grundkurs = konto.rolle === 'schueler' && (() => { const k = kurseVon(konto.sub); return k.length > 0 && k.every((x) => x.kursart === 'gA'); })();
    return {
      welt: b.welt,
      titel: b.titel,
      niveau: b.niveau,
      dauerMin: b.dauerMin,
      anzahl: b.anzahl,
      grundkurs,
      frei: z.frei,
      grund: z.grund,
      laufend: laufend ? { id: laufend.id, deadline: laufend.deadline_at } : null,
      gesperrtBis,
      bester: best ? { id: best.id, punkte: best.punkte, maxPunkte: best.max_punkte, anteil: anteilVon(best.punkte, best.max_punkte), besiegt: best.punkte >= BESIEGT_ANTEIL * best.max_punkte } : null,
      versuche: db.prepare('SELECT id, start_at, ende_at, punkte, max_punkte FROM boss_versuche WHERE sub = ? AND welt = ? ORDER BY id DESC LIMIT 20').all(konto.sub, b.welt)
        .map((v) => ({ id: v.id, start: v.start_at, ende: v.ende_at, punkte: v.ende_at ? v.punkte : null, maxPunkte: v.max_punkte })),
      serverZeit: iso()
    };
  }

  const uebersicht = (konto) => ({ bosse: Object.keys(B.welten).map((k) => status(konto, k)) });

  function starten(konto, kennung) {
    const b = welt(kennung);
    raeumeAuf(konto.sub);
    const laufend = db.prepare('SELECT id FROM boss_versuche WHERE sub = ? AND welt = ? AND ende_at IS NULL').get(konto.sub, b.welt);
    if (laufend) return ansicht(konto, laufend.id);
    const z = zugang(konto, b);
    if (!z.frei) throw fehler(403, z.grund);
    const s = status(konto, kennung);
    if (s.gesperrtBis) throw fehler(409, 'Der Boss erholt sich noch – der nächste Kampf ist 12 Stunden nach dem letzten möglich.');
    const gezogen = ziehe(b, s.grundkurs);
    const max = gezogen.reduce((n, a) => n + a.punkte, 0);
    const jetzt = ctx.now();
    const info = db.prepare('INSERT INTO boss_versuche (sub, welt, aufgaben, antworten, start_at, deadline_at, max_punkte) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(konto.sub, b.welt, JSON.stringify(gezogen.map((a) => a.id)), '{}', iso(jetzt), iso(jetzt + b.dauerMin * 60000), max);
    return ansicht(konto, Number(info.lastInsertRowid));
  }

  function versuch(konto, id) {
    const v = db.prepare('SELECT * FROM boss_versuche WHERE id = ? AND sub = ?').get(Number(id) || 0, konto.sub);
    if (!v) throw fehler(404, 'Diesen Kampf gibt es nicht.');
    return v;
  }

  /** Kampf ansehen: während des Kampfes die Aufgaben ohne Lösung und die eigenen Antworten, danach die Auswertung. */
  function ansicht(konto, id, neueAbzeichen = []) {
    let v = versuch(konto, id);
    if (!v.ende_at && Date.parse(v.deadline_at) + KULANZ_MS < ctx.now()) { neueAbzeichen = auswerten(v, Date.parse(v.deadline_at)); v = versuch(konto, id); }
    const b = welt(v.welt);
    const ids = json(v.aufgaben, []);
    const antworten = json(v.antworten, {});
    const kopf = { id: v.id, welt: v.welt, titel: b.titel, dauerMin: b.dauerMin, start: v.start_at, deadline: v.deadline_at, maxPunkte: v.max_punkte, serverZeit: iso() };
    if (!v.ende_at) {
      return { ...kopf, laeuft: true, aufgaben: ids.map((aid) => ({ ...B.oeffentlich(B.aufgabe(aid)), antwort: antworten[aid] ?? null })) };
    }
    const ergebnis = new Map(json(v.ergebnis, []).map((e) => [e.id, e]));
    return {
      ...kopf,
      laeuft: false,
      ende: v.ende_at,
      punkte: v.punkte,
      anteil: anteilVon(v.punkte, v.max_punkte),
      besiegt: v.punkte >= BESIEGT_ANTEIL * v.max_punkte,
      neueAbzeichen,
      aufgaben: ids.map((aid) => {
        const a = B.aufgabe(aid);
        const e = ergebnis.get(aid) ?? { wert: 0, punkte: 0 };
        return { ...B.oeffentlich(a), antwort: antworten[aid] ?? null, wert: e.wert, erreicht: e.punkte, loesung: B.loesung(a) };
      })
    };
  }

  /** Antwort speichern (ohne Wertung). Nach dem Ende bzw. nach Ablauf: 409. */
  function antworten(konto, id, body) {
    const v = versuch(konto, id);
    if (v.ende_at) throw fehler(409, 'Dieser Kampf ist schon vorbei.');
    if (Date.parse(v.deadline_at) + KULANZ_MS < ctx.now()) { auswerten(v, Date.parse(v.deadline_at)); throw fehler(409, 'Die Zeit ist abgelaufen.'); }
    const aid = String(body?.aufgabeId ?? '');
    if (!json(v.aufgaben, []).includes(aid)) throw fehler(400, 'Diese Aufgabe gehört nicht zu diesem Kampf.');
    const antwort = bereinige(B.aufgabe(aid), body?.antwort);
    const alle = { ...json(v.antworten, {}), [aid]: antwort };
    db.prepare('UPDATE boss_versuche SET antworten = ? WHERE id = ? AND ende_at IS NULL').run(JSON.stringify(alle), v.id);
    return { gespeichert: true, anzahl: Object.values(alle).filter((x) => x != null).length };
  }

  /** Nur die Form der Antwort prüfen (kurze Kennungen, passende Länge) – gewertet wird erst am Ende. */
  function bereinige(a, antwort) {
    if (antwort == null) return null;
    const kurz = (x) => typeof x === 'string' && x.length > 0 && x.length <= 200;
    const f = a.frage;
    if (f.typ === 'mc' && kurz(antwort.wahl)) return { wahl: antwort.wahl };
    if (f.typ === 'wf' && typeof antwort.wahr === 'boolean') return { wahr: antwort.wahr, ...(kurz(antwort.begruendung) ? { begruendung: antwort.begruendung } : {}) };
    if (f.typ === 'zuordnung' && Array.isArray(antwort.zuordnung) && antwort.zuordnung.length === f.paare.length && antwort.zuordnung.every((x) => x === '' || kurz(x))) return { zuordnung: antwort.zuordnung };
    throw fehler(400, 'Diese Antwort passt nicht zur Aufgabe.');
  }

  function beenden(konto, id) {
    const v = versuch(konto, id);
    let neu = [];
    if (!v.ende_at) neu = auswerten(v, Math.min(ctx.now(), Date.parse(v.deadline_at) + KULANZ_MS));
    return ansicht(konto, id, neu);
  }

  /** Beste Boss-Punkte je Konto (Summe über die Welten bzw. nur eine Welt) – für Punkte, Ranglisten und Portal. */
  function bestePunkte(subs, kennung = null) {
    const m = new Map(subs.map((s) => [s, 0]));
    if (!subs.length) return m;
    const sql = `SELECT sub, welt, MAX(punkte) AS p FROM boss_versuche WHERE ende_at IS NOT NULL AND sub IN (${subs.map(() => '?').join(',')})${kennung ? ' AND welt = ?' : ''} GROUP BY sub, welt`;
    for (const r of db.prepare(sql).all(...subs, ...(kennung ? [kennung] : []))) m.set(r.sub, (m.get(r.sub) ?? 0) + (r.p ?? 0));
    return m;
  }

  /** Boss-Ergebnisse eines Kurses für die Lehrkraft: je Schüler und Welt bester Versuch und Zahl der Versuche. */
  function kursErgebnisse(mitglieder) {
    const welten = Object.values(B.welten).map((b) => ({ welt: b.welt, titel: b.titel }));
    return {
      welten,
      zeilen: mitglieder.map((m) => ({
        sub: m.sub,
        name: m.name,
        werte: welten.map((w) => {
          const z = db.prepare('SELECT MAX(punkte) AS p, MAX(max_punkte) AS max, COUNT(*) AS n FROM boss_versuche WHERE sub = ? AND welt = ? AND ende_at IS NOT NULL').get(m.sub, w.welt);
          return z.n ? { punkte: z.p, max: z.max, versuche: z.n, besiegt: z.p >= BESIEGT_ANTEIL * z.max } : null;
        })
      }))
    };
  }

  /** Pool eines Bosses für die Vorschau der Lehrkraft (mit richtigen Antworten). */
  function pool(kennung) {
    const b = welt(kennung);
    return { welt: b.welt, titel: b.titel, niveau: b.niveau, dauerMin: b.dauerMin, anzahl: b.anzahl, mix: b.mix, aufgaben: b.pool.map((id) => B.lehrkraft(B.aufgabe(id))) };
  }

  const info = () => Object.values(B.welten).map((b) => ({ welt: b.welt, titel: b.titel, niveau: b.niveau, dauerMin: b.dauerMin, anzahl: b.anzahl, pool: b.pool.length }));

  return { status, uebersicht, starten, ansicht, antworten, beenden, bestePunkte, kursErgebnisse, pool, info, BOSS_MODI };
}

module.exports = { createBoss, AUTO_ANTEIL, BESIEGT_ANTEIL, SPERRE_MS, KULANZ_MS, BOSS_MODI };
