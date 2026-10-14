'use strict';
// Lernstand auf dem Server (Vertrag §9, Muster: Algo Quest src/services/lernen.js):
// Aufgabe abrufen (ohne Lösung), prüfen, Tipp holen, „Lösung zeigen“. Punkte nur beim ERSTEN Lösen:
//   round(punkte × max(0.25, 1 − 0.25·Fehlversuche − 0.2·Tipps)); nach „Lösung zeigen“ 0 Punkte.
// Ausnahme Exit-Tickets (Quiz): Punkte = Anteil richtiger Antworten im ersten Durchgang × Quizpunkte.

function punkteFuer(punkte, fehlversuche, tipps) {
  const faktor = Math.max(0.25, 1 - 0.25 * fehlversuche - 0.2 * tipps);
  return Math.round(punkte * faktor);
}

const fehler = (status, text) => Object.assign(new Error(text), { status });

function createLernen(ctx, { aufgaben, training = null }) {
  const { db } = ctx;
  const iso = () => new Date(ctx.now()).toISOString();
  const titelAbzeichen = aufgaben.abzeichen; // Titel und Text aus app/js/data/badges.js

  function aufgabe(id) {
    const a = aufgaben.map.get(String(id));
    if (!a) throw fehler(404, 'Aufgabe nicht gefunden.');
    return a;
  }

  const zeile = (sub, id) => db.prepare('SELECT * FROM fortschritt WHERE sub = ? AND aufgabe_id = ?').get(sub, id);
  function sichereZeile(sub, id) {
    db.prepare("INSERT OR IGNORE INTO fortschritt (sub, aufgabe_id, status, updated_at) VALUES (?, ?, 'offen', ?)").run(sub, id, iso());
    return zeile(sub, id);
  }
  const daten = (r) => {
    try {
      return r ? JSON.parse(r.daten) : {};
    } catch {
      return {};
    }
  };

  /** Zustand für den Browser: Status, Versuche, abgerufene Tipps, mögliche Punkte. */
  function zustand(a, r) {
    const status = r ? r.status : 'offen';
    const tipps = r ? Math.min(r.tipps, a.tipps.length) : 0;
    return {
      status,
      nachgeloest: !!(r && r.nachgeloest),
      fehlversuche: r ? r.fehlversuche : 0,
      tippsGenutzt: tipps,
      tippsAnzahl: a.tipps.length,
      tipps: a.tipps.slice(0, status === 'offen' ? tipps : a.tipps.length),
      punkte: r ? r.punkte : 0,
      maxPunkte: a.punkte,
      moeglich: status === 'offen' ? punkteFuer(a.punkte, r ? r.fehlversuche : 0, tipps) : 0
    };
  }

  const zinfo = (r) => ({ offen: !r || r.status === 'offen', daten: daten(r), zeile: r });

  /** Aufgabe für den Browser: öffentlicher Teil + Zustand (+ Lösung, wenn nicht mehr offen). */
  function abrufen(sub, id) {
    const a = aufgabe(id);
    const r = zeile(sub, a.id);
    const z = zustand(a, r);
    return {
      id: a.id,
      modul: a.modul,
      aufgabe: a.typ.oeffentlich(a),
      zustand: z,
      ...(z.status !== 'offen' ? { loesung: a.typ.loesungsteil(a, zinfo(r)) } : {})
    };
  }

  function vergibAbzeichen(sub, liste) {
    const neu = [];
    for (const k of liste) {
      const info = db.prepare('INSERT OR IGNORE INTO abzeichen (sub, schluessel, at) VALUES (?, ?, ?)').run(sub, k, iso());
      if (info.changes) neu.push({ id: k, titel: titelAbzeichen.get(k)?.titel || k, text: titelAbzeichen.get(k)?.text || '' });
    }
    return neu;
  }

  /** Antwort prüfen. Fehlversuche zählen nur, solange die Aufgabe offen ist; Punkte nur beim ersten Lösen. */
  function pruefen(sub, id, antwort) {
    const a = aufgabe(id);
    const vorher = zeile(sub, a.id);
    const erg = a.typ.pruefe(a, antwort, zinfo(vorher), {});
    const fertig = erg.fertig ?? erg.ok;
    const zaehltFehler = erg.zaehltFehler ?? !erg.ok;
    const neu = { geloest: false, nachgeloest: false, punkte: 0, abzeichen: [] };
    let ersterVersuch = false;
    db.transaction(() => {
      const r = sichereZeile(sub, a.id);
      if (erg.daten !== undefined) db.prepare('UPDATE fortschritt SET daten = ?, updated_at = ? WHERE sub = ? AND aufgabe_id = ?').run(JSON.stringify(erg.daten), iso(), sub, a.id);
      if (r.status === 'offen') {
        if (fertig) {
          const p = erg.anteil !== undefined ? Math.round(a.punkte * erg.anteil) : punkteFuer(a.punkte, r.fehlversuche, Math.min(r.tipps, a.tipps.length));
          db.prepare("UPDATE fortschritt SET status = 'geloest', punkte = ?, geloest_at = ?, updated_at = ? WHERE sub = ? AND aufgabe_id = ?").run(p, iso(), iso(), sub, a.id);
          neu.geloest = true;
          neu.punkte = p;
          ersterVersuch = r.fehlversuche === 0;
        } else if (zaehltFehler) {
          db.prepare('UPDATE fortschritt SET fehlversuche = fehlversuche + 1, updated_at = ? WHERE sub = ? AND aufgabe_id = ?').run(iso(), sub, a.id);
        }
      } else if (r.status === 'angesehen' && erg.ok && !r.nachgeloest && erg.anteil === undefined) {
        db.prepare('UPDATE fortschritt SET nachgeloest = 1, updated_at = ? WHERE sub = ? AND aufgabe_id = ?').run(iso(), sub, a.id);
        neu.nachgeloest = true; // zählt als gelöst (Stufen-/Modul-Abzeichen), ohne Punkte und ohne Erstversuch
      }
    })();
    if (neu.geloest || neu.nachgeloest) {
      const zeilen = db.prepare('SELECT * FROM fortschritt WHERE sub = ? AND aufgabe_id LIKE ?').all(sub, `${a.modul}:%`);
      const geloest = new Set(zeilen.filter((z) => z.status === 'geloest' || z.nachgeloest).map((z) => z.aufgabe_id));
      const alleGeloest = aufgaben.liste.filter((x) => x.modul === a.modul).every((x) => geloest.has(x.id));
      neu.abzeichen = vergibAbzeichen(sub, a.typ.abzeichen({ a, erg, anteil: erg.anteil, ersterVersuch, zeilen, alleGeloest, katalog: aufgaben.liste }) || []);
    }
    const r2 = zeile(sub, a.id);
    const z = zustand(a, r2);
    const out = { ok: erg.ok, fertig, rueckmeldung: erg.rueckmeldung, zustand: z, geloest: neu.geloest, nachgeloest: neu.nachgeloest, punkteErhalten: neu.punkte, neueAbzeichen: neu.abzeichen };
    if (z.status !== 'offen' && (neu.geloest || erg.ok || fertig)) out.loesung = a.typ.loesungsteil(a, zinfo(r2));
    return out;
  }

  function tipp(sub, id) {
    const a = aufgabe(id);
    if (!a.tipps.length) throw fehler(400, 'Zu dieser Aufgabe gibt es keine Tipps.');
    const r = sichereZeile(sub, a.id);
    if (r.status === 'offen' && r.tipps < a.tipps.length) {
      db.prepare('UPDATE fortschritt SET tipps = tipps + 1, updated_at = ? WHERE sub = ? AND aufgabe_id = ?').run(iso(), sub, a.id);
    }
    return { zustand: zustand(a, zeile(sub, a.id)) };
  }

  function aufdecken(sub, id) {
    const a = aufgabe(id);
    if (a.modul === 'quiz' || a.id.endsWith(':vorhersage') || a.id.endsWith(':raetsel') || a.id === 'ueberliste:bonus') throw fehler(400, 'Hier gibt es kein „Lösung zeigen“ – die Lösung erscheint nach jeder Antwort.');
    const r = sichereZeile(sub, a.id);
    if (r.status === 'offen') db.prepare("UPDATE fortschritt SET status = 'angesehen', punkte = 0, updated_at = ? WHERE sub = ? AND aufgabe_id = ?").run(iso(), sub, a.id);
    const r2 = zeile(sub, a.id);
    return { zustand: zustand(a, r2), loesung: a.typ.loesungsteil(a, zinfo(r2)) };
  }

  /**
   * Lernstand eines Kontos im Format von progress.js (Schlüssel „modul:id“) – nur für Module mit Prüfung auf dem
   * Server. Quiz-Ergebnisse als Bestwert „quiz:<id>“ in Prozent (wie bisher im Browser).
   */
  function lernstand(sub) {
    const zeilen = db.prepare('SELECT * FROM fortschritt WHERE sub = ?').all(sub);
    const solved = {};
    const best = {};
    let punkte = 0;
    for (const r of zeilen) {
      const a = aufgaben.map.get(r.aufgabe_id);
      if (!a) continue;
      punkte += r.punkte;
      if (r.status === 'geloest' || r.nachgeloest) solved[a.id] = Date.parse(r.geloest_at || r.updated_at) || 0;
      if (a.modul === 'quiz' && r.status === 'geloest') best[a.id] = a.typ.loesungsteil(a, zinfo(r)).ergebnis.prozent;
    }
    // Training (Arena, „Unterscheide!“): Trainingspunkte und Arena-Rekorde je Stufe
    if (training) {
      const t = training.stand(sub);
      punkte += t.punkte;
      Object.assign(best, t.best);
    }
    const badges = db.prepare('SELECT schluessel FROM abzeichen WHERE sub = ? ORDER BY at').all(sub).map((r) => r.schluessel);
    return { module: [...aufgaben.module], punkte, solved, best, badges };
  }

  /** Öffentliche Aufgabenliste je Modul (für Übersichten): ohne Lösungen. */
  function katalog(modul) {
    return aufgaben.liste
      .filter((a) => !modul || a.modul === modul)
      .map((a) => ({ id: a.id, modul: a.modul, nr: a.nr ?? null, titel: a.titel, stufe: a.stufe, punkte: a.punkte, levels: a.levels, ...(a.art ? { art: a.art } : {}), ...(['baukasten', 'minimierer', 'ueberliste', 'parallelwelten', 'keller', 'rallye'].includes(a.modul) ? { schluessel: a.id.slice(a.modul.length + 1) } : {}), ...(a.modul === 'mealy' ? { schluessel: a.id.slice('mealy:'.length), art: a.id.endsWith(':vorhersage') ? 'vorhersage' : 'bugjagd' } : {}) }));
  }

  return { abrufen, pruefen, tipp, aufdecken, lernstand, katalog, punkteFuer };
}

module.exports = { createLernen, punkteFuer };
