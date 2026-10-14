'use strict';
// Konten und Kurse aus dem Portal (Vertrag §5): Upsert nach sub beim SSO, Mitgliedschaften abgleichen,
// Löschung und Kursänderungen über die Verbund-API (§6). Gespeichert werden nur sub, Rolle, Anzeigename, Kurs-IDs.

const SUB = /^[asl]:\d{1,12}$/;
const KURS = /^k:\d{1,12}$/;
const ROLLEN = ['schueler', 'lehrkraft', 'superadmin'];
const KURS_ROLLEN = ['mitglied', 'lehrkraft'];

/** Anzeigename aus dem Token: Text, getrimmt, höchstens 80 Zeichen, keine Steuerzeichen. */
function anzeigename(v) {
  // eslint-disable-next-line no-control-regex
  const s = String(v ?? '').replace(/[\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim();
  return s.slice(0, 80) || 'Ohne Namen';
}

function createKonten(ctx) {
  const { db } = ctx;
  const iso = () => new Date(ctx.now()).toISOString();

  /**
   * Prüft den Inhalt eines (schon signaturgeprüften) SSO-Tokens. Liefert null bei ungültigem Inhalt.
   * @returns {{sub, rolle, name, kurse: {id, name, rolle}[]} | null}
   */
  function tokenInhalt(t) {
    if (!t || !SUB.test(t.sub) || !ROLLEN.includes(t.rolle) || !Array.isArray(t.kurse) || t.kurse.length > 500) return null;
    if ((t.rolle === 'schueler') !== t.sub.startsWith('s:')) return null;
    if ((t.rolle === 'superadmin') !== t.sub.startsWith('a:')) return null;
    const kurse = [];
    for (const k of t.kurse) {
      if (!k || !KURS.test(k.id) || !KURS_ROLLEN.includes(k.rolle)) return null;
      kurse.push({ id: k.id, name: anzeigename(k.name).slice(0, 80), rolle: k.rolle });
    }
    return { sub: t.sub, rolle: t.rolle, name: anzeigename(t.name), kurse };
  }

  /** Konto anlegen bzw. aktualisieren, Kurse anlegen/umbenennen, Mitgliedschaften wie im Token setzen. */
  const anmelden = db.transaction((inhalt) => {
    const jetzt = iso();
    db.prepare(
      `INSERT INTO konten (sub, rolle, name, created_at, last_login_at, last_active_at) VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(sub) DO UPDATE SET rolle = excluded.rolle, name = excluded.name, last_login_at = excluded.last_login_at, last_active_at = excluded.last_active_at`
    ).run(inhalt.sub, inhalt.rolle, inhalt.name, jetzt, jetzt, jetzt);
    for (const k of inhalt.kurse) {
      // Steht der Kurs im Token, hat er die Plattform freigeschaltet → aktiv
      db.prepare(
        `INSERT INTO kurse (id, name, aktiv, created_at, updated_at) VALUES (?, ?, 1, ?, ?)
         ON CONFLICT(id) DO UPDATE SET name = excluded.name, aktiv = 1, updated_at = excluded.updated_at`
      ).run(k.id, k.name, jetzt, jetzt);
    }
    // Fehlt ein Kurs im Token, verliert das Konto den Zugang dazu (Lernstand bleibt bis zur Löschung)
    const ids = new Set(inhalt.kurse.map((k) => k.id));
    for (const m of db.prepare('SELECT kurs_id FROM kurs_mitglieder WHERE sub = ?').all(inhalt.sub)) {
      if (!ids.has(m.kurs_id)) db.prepare('DELETE FROM kurs_mitglieder WHERE sub = ? AND kurs_id = ?').run(inhalt.sub, m.kurs_id);
    }
    for (const k of inhalt.kurse) {
      db.prepare(
        `INSERT INTO kurs_mitglieder (kurs_id, sub, rolle, seit) VALUES (?, ?, ?, ?)
         ON CONFLICT(kurs_id, sub) DO UPDATE SET rolle = excluded.rolle`
      ).run(k.id, inhalt.sub, k.rolle, jetzt);
    }
    return db.prepare('SELECT * FROM konten WHERE sub = ?').get(inhalt.sub);
  });

  function konto(sub) {
    return typeof sub === 'string' ? db.prepare('SELECT * FROM konten WHERE sub = ?').get(sub) || null : null;
  }

  /** Konto zur Sitzung (null, wenn gelöscht oder abgemeldet). */
  function ausSitzung(sub, gen) {
    const k = konto(sub);
    return k && k.session_gen === gen ? k : null;
  }

  /** „Zuletzt aktiv“ höchstens einmal pro Minute schreiben. */
  let letzte = new Map();
  function aktiv(sub) {
    const t = ctx.now();
    if ((letzte.get(sub) || 0) > t - 60000) return;
    letzte.set(sub, t);
    if (letzte.size > 5000) letzte = new Map();
    db.prepare('UPDATE konten SET last_active_at = ? WHERE sub = ?').run(iso(), sub);
  }

  /** Kurse eines Kontos, auf die es Zugriff hat (nur aktive Kurse). */
  function kurseVon(sub) {
    return db
      .prepare(
        `SELECT k.id, k.name, m.rolle FROM kurs_mitglieder m JOIN kurse k ON k.id = m.kurs_id
         WHERE m.sub = ? AND k.aktiv = 1 ORDER BY k.name COLLATE NOCASE, k.id`
      )
      .all(sub);
  }

  function ansicht(k) {
    if (!k) return null;
    return { sub: k.sub, rolle: k.rolle, name: k.name, kurse: kurseVon(k.sub) };
  }

  /** Abmelden auf allen Geräten dieser Plattform (Sitzungen ungültig). */
  function sitzungenBeenden(sub) {
    db.prepare('UPDATE konten SET session_gen = session_gen + 1 WHERE sub = ?').run(sub);
  }

  /* ---------- Verbund-API (§6) ---------- */

  /** Alle Daten eines Kontos löschen; idempotent. Liefert die Zahl gelöschter Datensätze. */
  const loescheKonto = (sub) => {
    letzte.delete(sub); // auch die Aktivitätsmarke im Arbeitsspeicher (vollständige Löschung, §10)
    return db.transaction(() => {
      let n = db.prepare('DELETE FROM kurs_mitglieder WHERE sub = ?').run(sub).changes;
      n += db.prepare('DELETE FROM fortschritt WHERE sub = ?').run(sub).changes;
      n += db.prepare('DELETE FROM abzeichen WHERE sub = ?').run(sub).changes;
      n += db.prepare('DELETE FROM training WHERE sub = ?').run(sub).changes;
      n += db.prepare('DELETE FROM falsche_antworten WHERE sub = ?').run(sub).changes;
      n += db.prepare('DELETE FROM konten WHERE sub = ?').run(sub).changes;
      return n;
    })();
  };

  /** Alle Daten eines Kurses löschen (Einstellungen, Mitgliedschaften); Lernstände hängen an sub, nicht am Kurs. */
  const loescheKurs = db.transaction((kursId) => {
    let n = db.prepare('DELETE FROM kurs_mitglieder WHERE kurs_id = ?').run(kursId).changes;
    n += db.prepare('DELETE FROM kurse WHERE id = ?').run(kursId).changes;
    return n;
  });

  function kurs(kursId) {
    return KURS.test(String(kursId)) ? db.prepare('SELECT * FROM kurse WHERE id = ?').get(kursId) || null : null;
  }

  /** Kurs umbenennen bzw. sperren/entsperren; ein unbekannter Kurs wird angelegt (Name kann vor der ersten Anmeldung kommen). */
  function kursAendern(kursId, { name, aktiv }) {
    const jetzt = iso();
    const k = kurs(kursId);
    if (!k) {
      db.prepare('INSERT INTO kurse (id, name, aktiv, created_at, updated_at) VALUES (?, ?, ?, ?, ?)').run(
        kursId,
        typeof name === 'string' ? anzeigename(name) : kursId,
        aktiv === false ? 0 : 1,
        jetzt,
        jetzt
      );
    } else {
      db.prepare('UPDATE kurse SET name = ?, aktiv = ?, updated_at = ? WHERE id = ?').run(
        typeof name === 'string' ? anzeigename(name) : k.name,
        typeof aktiv === 'boolean' ? (aktiv ? 1 : 0) : k.aktiv,
        jetzt,
        kursId
      );
    }
    return kurs(kursId);
  }

  /** Schüler (Mitglieder) eines Kurses mit Zeitpunkt der letzten Aktivität. */
  function mitglieder(kursId) {
    return db
      .prepare(
        `SELECT k.sub, k.name, k.last_active_at FROM kurs_mitglieder m JOIN konten k ON k.sub = m.sub
         WHERE m.kurs_id = ? AND m.rolle = 'mitglied' ORDER BY k.name COLLATE NOCASE, k.sub`
      )
      .all(kursId);
  }

  /** Nur für Tests: Aktivitätsmarke im Arbeitsspeicher vorhanden? */
  const hatAktivitaetsmarke = (sub) => letzte.has(sub);

  return { hatAktivitaetsmarke, tokenInhalt, anmelden, konto, ausSitzung, aktiv, kurseVon, ansicht, sitzungenBeenden, loescheKonto, loescheKurs, kurs, kursAendern, mitglieder, SUB, KURS };
}

module.exports = { createKonten, anzeigename };
