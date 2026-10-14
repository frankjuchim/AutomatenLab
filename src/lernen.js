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

function createLernen(ctx, { aufgaben, training = null, bossPunkte = null }) {
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

  /** Falsche Antwort in Kurzform merken (für „häufige falsche Antworten“ der Lehrkraft); Fehler hier stören das Prüfen nie. */
  function merkeFalsch(sub, a, antwort) {
    let text = null;
    try { text = a.typ.falsch(a, antwort); } catch { return; }
    if (typeof text !== 'string' || !text.trim()) return;
    db.prepare('INSERT INTO falsche_antworten (sub, aufgabe_id, antwort, at) VALUES (?, ?, ?, ?)').run(sub, a.id, text.trim().slice(0, 160), iso());
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
      if (!erg.ok && r.status === 'offen' && a.typ.falsch) merkeFalsch(sub, a, antwort);
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

  /** Aufgaben ohne „Lösung zeigen“: Die Lösung erscheint dort nach jeder Antwort (Quiz-artig). */
  const ohneAufdecken = (a) => a.modul === 'quiz' || a.id.endsWith(':vorhersage') || a.id.endsWith(':raetsel') || a.id === 'ueberliste:bonus';

  function aufdecken(sub, id) {
    const a = aufgabe(id);
    if (ohneAufdecken(a)) throw fehler(400, 'Hier gibt es kein „Lösung zeigen“ – die Lösung erscheint nach jeder Antwort.');
    const r = sichereZeile(sub, a.id);
    if (r.status === 'offen') db.prepare("UPDATE fortschritt SET status = 'angesehen', punkte = 0, updated_at = ? WHERE sub = ? AND aufgabe_id = ?").run(iso(), sub, a.id);
    const r2 = zeile(sub, a.id);
    return { zustand: zustand(a, r2), loesung: a.typ.loesungsteil(a, zinfo(r2)) };
  }

  /* ---------- Vorschau für Lehrkräfte (wie die Aufgaben-Vorschau von Algo Quest) ----------
   * Dieselben Prüfungen, aber ohne Speichern: Den Stand (status, fehlversuche, tipps, daten) hält der Browser und schickt
   * ihn mit; der Server rechnet nur. „Lösung zeigen“ geht bei jeder Aufgabe (auch Quiz) und kostet nichts. */
  function vorschauZeile(stand) {
    const st = stand && typeof stand === 'object' ? stand : {};
    const status = ['offen', 'geloest', 'angesehen'].includes(st.status) ? st.status : 'offen';
    const n = (x) => (Number.isInteger(x) && x >= 0 && x < 1000 ? x : 0);
    let daten = '{}';
    try { daten = JSON.stringify(st.daten && typeof st.daten === 'object' ? st.daten : {}); } catch { /* leer */ }
    if (daten.length > 50000) throw fehler(400, 'Der Vorschau-Stand ist zu groß.');
    return { status, nachgeloest: st.nachgeloest ? 1 : 0, fehlversuche: n(st.fehlversuche), tipps: n(st.tipps), punkte: 0, daten };
  }
  const standVon = (r) => ({ status: r.status, nachgeloest: !!r.nachgeloest, fehlversuche: r.fehlversuche, tipps: r.tipps, daten: daten(r) });

  function vorschau(id, aktion, body = {}) {
    const a = aufgabe(id);
    const r = vorschauZeile(body.stand);
    if (ohneAufdecken(a) && r.status === 'angesehen') r.status = 'offen'; // Lösung kommt hier mit jeder Antwort
    const mitLoesung = () => a.typ.loesungsteil(a, zinfo(r));
    if (aktion === 'abrufen') {
      return { id: a.id, modul: a.modul, aufgabe: a.typ.oeffentlich(a), zustand: zustand(a, r), stand: standVon(r), vorschau: true, ...(r.status !== 'offen' ? { loesung: mitLoesung() } : {}) };
    }
    if (aktion === 'tipp') {
      if (!a.tipps.length) throw fehler(400, 'Zu dieser Aufgabe gibt es keine Tipps.');
      if (r.status === 'offen' && r.tipps < a.tipps.length) r.tipps += 1;
      return { zustand: zustand(a, r), stand: standVon(r) };
    }
    if (aktion === 'aufdecken') {
      if (r.status === 'offen') r.status = 'angesehen';
      return { zustand: zustand(a, r), loesung: mitLoesung(), stand: standVon(r) };
    }
    if (aktion === 'pruefen') {
      const erg = a.typ.pruefe(a, body.antwort, zinfo(r), {});
      const fertig = erg.fertig ?? erg.ok;
      const zaehltFehler = erg.zaehltFehler ?? !erg.ok;
      if (erg.daten !== undefined) r.daten = JSON.stringify(erg.daten);
      if (r.status === 'offen') {
        if (fertig) r.status = 'geloest';
        else if (zaehltFehler) r.fehlversuche += 1;
      } else if (r.status === 'angesehen' && erg.ok && erg.anteil === undefined) r.nachgeloest = 1;
      const z = zustand(a, r);
      const out = { ok: erg.ok, fertig, rueckmeldung: erg.rueckmeldung, zustand: z, geloest: false, nachgeloest: false, punkteErhalten: 0, neueAbzeichen: [], stand: standVon(r) };
      if (z.status !== 'offen' && (erg.ok || fertig)) out.loesung = mitLoesung();
      return out;
    }
    throw fehler(404, 'Diese Vorschau-Aktion gibt es nicht.');
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
    // Boss-Kämpfe: bester Versuch je Welt
    if (bossPunkte) punkte += bossPunkte([sub]).get(sub) ?? 0;
    const badges = db.prepare('SELECT schluessel FROM abzeichen WHERE sub = ? ORDER BY at').all(sub).map((r) => r.schluessel);
    return { module: [...aufgaben.module], punkte, solved, best, badges };
  }

  /** Öffentliche Aufgabenliste je Modul (für Übersichten): ohne Lösungen. */
  function katalog(modul) {
    return aufgaben.liste
      .filter((a) => !modul || a.modul === modul)
      .map((a) => ({ id: a.id, modul: a.modul, nr: a.nr ?? null, titel: a.titel, stufe: a.stufe, punkte: a.punkte, levels: a.levels, fallen: a.fallen ?? [], ...(a.art ? { art: a.art } : {}), ...(['baukasten', 'minimierer', 'ueberliste', 'parallelwelten', 'keller', 'rallye', 'grammatik', 'turing'].includes(a.modul) ? { schluessel: a.id.slice(a.modul.length + 1) } : {}), ...(a.modul === 'mealy' ? { schluessel: a.id.slice('mealy:'.length), art: a.id.endsWith(':vorhersage') ? 'vorhersage' : 'bugjagd' } : {}) }));
  }

  return { abrufen, pruefen, tipp, aufdecken, vorschau, lernstand, katalog, punkteFuer };
}

module.exports = { createLernen, punkteFuer };
