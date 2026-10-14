'use strict';
// Auswertungen (Muster: Algo Quest src/services/auswertung.js):
// • Lehrkraft-Bereich: Schülerliste, Lernstand-Matrix Level × Schüler, Aufgabenstatistik, CSV-Export.
// • Kursübersicht für das Portal (Vertrag §6) – nur Kennzahlen, keine Namen.
// Grundlage sind die Tabellen fortschritt (je Konto und Aufgabe), training und abzeichen. Der Lernstand hängt am Konto,
// nicht am Kurs: Wer in zwei Kursen ist, erscheint in beiden mit demselben Stand.
//
// Kursart (kurse.einstellungen.kursart, wie Algo Quest): 'eA' (Leistungskurs, Standard) oder 'gA' (Grundkurs).
// Der Kursumfang (Anteil in der Portal-Übersicht) umfasst die Level des Kurses: eA = Niveau „alle“ und „eA“, gA = nur
// „alle“; Zusatz-Level (plus) zählen nie zum Umfang, ihre Punkte aber zu den Punkten.
// Jede Aufgabe zählt zu genau einem Level (hauptLevel): dem ersten ihrer Level; das Welt-Quiz (Exit-Ticket einer ganzen
// Welt) zum letzten Level der Welt – sonst verzerrten Aufgaben mit mehreren Leveln die Matrix.

const KURSARTEN = ['eA', 'gA'];
const LEVEL_ARTEN = ['pflicht', 'vertiefung', 'bonus', 'spaeter'];
const AUFTRAG_MAX = 400;
const hauptLevel = (a) => { const l = a.levels || []; return l.length ? (a.modul === 'quiz' && l.length > 1 ? l[l.length - 1] : l[0]) : null; };

function createAuswertung(ctx, { konten, katalog, aufgaben, training = null }) {
  const { db } = ctx;
  const iso = () => new Date(ctx.now()).toISOString();
  const levelInfo = new Map(katalog.welten.flatMap((w) => w.levels.map((l) => [l.nr, { ...l, welt: w.kennung }])));
  const LEVELS = [...levelInfo.keys()].sort((a, b) => a - b);
  const liste = aufgaben ? aufgaben.liste : [];

  /**
   * Kurs-Einstellungen (PR 7): kursart; levelArt = Art je Level (pflicht | vertiefung | bonus | spaeter, Vorgabe aus
   * worlds.js LEVEL_TYPE); auftrag = { text, level: [n …] } für die Startseite der Schüler (oder null).
   * Sie ändern nur die Anzeige – Deep-Links bleiben immer offen (CLAUDE.md Regel 1).
   */
  function einstellungen(kurs) {
    let e = {};
    try { e = JSON.parse(kurs.einstellungen || '{}'); } catch { /* leer */ }
    const levelArt = {};
    for (const n of LEVELS) levelArt[n] = LEVEL_ARTEN.includes(e.levelArt?.[n]) ? e.levelArt[n] : levelInfo.get(n).typ || 'pflicht';
    const auftrag = e.auftrag && typeof e.auftrag.text === 'string' && e.auftrag.text.trim() ? { text: e.auftrag.text, level: Array.isArray(e.auftrag.level) ? e.auftrag.level : [], at: e.auftrag.at ?? null } : null;
    return { kursart: KURSARTEN.includes(e.kursart) ? e.kursart : 'eA', levelArt, auftrag };
  }

  /** Einstellungen eines Kurses ändern (nur bekannte Felder, geprüft). */
  function einstellungenSetzen(kurs, body) {
    const e = einstellungen(kurs);
    const ungueltig = (t) => Object.assign(new Error(t), { status: 400 });
    if (body && body.kursart !== undefined) {
      if (!KURSARTEN.includes(body.kursart)) throw ungueltig('Diese Kursart gibt es nicht.');
      e.kursart = body.kursart;
    }
    if (body && body.levelArt !== undefined) {
      if (!body.levelArt || typeof body.levelArt !== 'object') throw ungueltig('Die Level-Einstellungen passen nicht.');
      for (const [k, v] of Object.entries(body.levelArt)) {
        if (!levelInfo.has(Number(k)) || !LEVEL_ARTEN.includes(v)) throw ungueltig('Die Level-Einstellungen passen nicht.');
        e.levelArt[Number(k)] = v;
      }
    }
    if (body && body.auftrag !== undefined) {
      if (body.auftrag === null || (typeof body.auftrag?.text === 'string' && !body.auftrag.text.trim())) e.auftrag = null;
      else {
        const text = typeof body.auftrag?.text === 'string' ? body.auftrag.text.trim() : '';
        const level = Array.isArray(body.auftrag.level) ? [...new Set(body.auftrag.level.map(Number))] : [];
        if (text.length > AUFTRAG_MAX) throw ungueltig(`Der Auftrag ist zu lang (höchstens ${AUFTRAG_MAX} Zeichen).`);
        if (level.length > 4 || level.some((n) => !levelInfo.has(n))) throw ungueltig('Wählen Sie höchstens vier Level.');
        e.auftrag = { text, level: level.sort((a, b) => a - b), at: iso() };
      }
    }
    db.prepare('UPDATE kurse SET einstellungen = ?, updated_at = ? WHERE id = ?').run(JSON.stringify(e), iso(), kurs.id);
    return e;
  }

  const imUmfang = (kursart) => (n) => {
    const niveau = levelInfo.get(n)?.niveau;
    return niveau === 'alle' || (kursart === 'eA' && niveau === 'eA');
  };
  const umfangAufgaben = (kursart) => liste.filter((a) => hauptLevel(a) != null && imUmfang(kursart)(hauptLevel(a)));

  /** Fortschritt aller Mitglieder: Map sub → Map aufgabe_id → Zeile. */
  function fortschrittVon(subs) {
    const m = new Map(subs.map((s) => [s, new Map()]));
    if (!subs.length) return m;
    const zeilen = db.prepare(`SELECT * FROM fortschritt WHERE sub IN (${subs.map(() => '?').join(',')})`).all(...subs);
    for (const r of zeilen) m.get(r.sub).set(r.aufgabe_id, r);
    return m;
  }
  const geloest = (r) => !!r && (r.status === 'geloest' || !!r.nachgeloest);
  const zahlenVon = (subs, sql) => {
    const m = new Map();
    if (!subs.length) return m;
    for (const z of db.prepare(sql.replace('?', subs.map(() => '?').join(','))).all(...subs)) m.set(z.sub, z.n);
    return m;
  };

  /** Schülerliste eines Kurses: Punkte (Aufgaben + Training), gelöst, Abzeichen, Rang, zuletzt aktiv. */
  function schueler(kurs) {
    const mitglieder = konten.mitglieder(kurs.id);
    const subs = mitglieder.map((m) => m.sub);
    const fp = fortschrittVon(subs);
    const trainingP = zahlenVon(subs, 'SELECT sub, COALESCE(SUM(punkte), 0) AS n FROM training WHERE sub IN (?) GROUP BY sub');
    const abz = zahlenVon(subs, 'SELECT sub, COUNT(*) AS n FROM abzeichen WHERE sub IN (?) GROUP BY sub');
    const zeilen = mitglieder.map((m) => {
      const rows = [...fp.get(m.sub).values()].filter((r) => aufgaben?.map.has(r.aufgabe_id) ?? true);
      const aufgabenPunkte = rows.reduce((s, r) => s + r.punkte, 0);
      const t = trainingP.get(m.sub) || 0;
      return {
        sub: m.sub,
        name: m.name,
        punkte: aufgabenPunkte + t,
        aufgabenPunkte,
        trainingPunkte: t,
        geloest: rows.filter(geloest).length,
        angesehen: rows.filter((r) => r.status === 'angesehen').length,
        abzeichen: abz.get(m.sub) || 0,
        zuletztAktiv: m.last_active_at || null
      };
    });
    // Rang wie Algo Quest: gleiche Punktzahl, gleicher Platz
    const sortiert = [...zeilen].sort((a, b) => b.punkte - a.punkte);
    for (const z of zeilen) z.rang = 1 + sortiert.filter((y) => y.punkte > z.punkte).length;
    return zeilen;
  }

  /** Lernstand-Matrix (Anteil der Level-Punkte je Schüler) und Aufgabenstatistik eines Kurses. */
  function kursAuswertung(kurs) {
    const { kursart } = einstellungen(kurs);
    const mitglieder = konten.mitglieder(kurs.id);
    const subs = mitglieder.map((m) => m.sub);
    const fp = fortschrittVon(subs);
    const jeLevel = new Map(LEVELS.map((n) => [n, liste.filter((a) => hauptLevel(a) === n)]));
    const levels = LEVELS.map((n) => {
      const l = levelInfo.get(n);
      const a = jeLevel.get(n);
      return { nr: n, titel: l.titel, welt: l.welt, niveau: l.niveau, imKurs: imUmfang(kursart)(n), aufgaben: a.length, maxPunkte: a.reduce((s, x) => s + x.punkte, 0) };
    });
    const matrix = {
      levels,
      zeilen: mitglieder.map((m) => ({
        sub: m.sub,
        name: m.name,
        werte: levels.map((l) => {
          let punkte = 0; let gel = 0; let ang = 0;
          for (const a of jeLevel.get(l.nr)) {
            const r = fp.get(m.sub).get(a.id);
            if (!r) continue;
            punkte += r.punkte;
            if (geloest(r)) gel++;
            if (r.status === 'angesehen') ang++;
          }
          return { anteil: l.maxPunkte ? Math.round((100 * punkte) / l.maxPunkte) / 100 : null, punkte, geloest: gel, angesehen: ang };
        })
      }))
    };
    // häufige falsche Antworten der Kursmitglieder je Aufgabe (höchstens drei, wie Algo Quest)
    const falsche = new Map();
    if (subs.length) {
      const zeilen = db.prepare(`SELECT aufgabe_id, antwort, COUNT(*) AS n FROM falsche_antworten WHERE sub IN (${subs.map(() => '?').join(',')}) GROUP BY aufgabe_id, antwort ORDER BY n DESC, antwort`).all(...subs);
      for (const z of zeilen) {
        const l = falsche.get(z.aufgabe_id) ?? [];
        if (l.length < 3) l.push({ antwort: z.antwort, anzahl: z.n });
        falsche.set(z.aufgabe_id, l);
      }
    }
    const aufgabenStat = liste.map((a) => {
      const rows = subs.map((s) => fp.get(s).get(a.id)).filter(Boolean);
      const n = rows.length;
      const gel = rows.filter(geloest).length;
      const level = hauptLevel(a);
      return {
        id: a.id,
        modul: a.modul,
        titel: a.titel,
        stufe: a.stufe,
        punkte: a.punkte,
        level,
        fallen: a.fallen || [],
        welt: level != null ? levelInfo.get(level)?.welt ?? null : null,
        versucht: n,
        geloest: gel,
        angesehen: rows.filter((r) => r.status === 'angesehen').length,
        quote: n ? Math.round((100 * gel) / n) / 100 : null,
        fehlversucheSchnitt: n ? Math.round((10 * rows.reduce((s, r) => s + r.fehlversuche, 0)) / n) / 10 : null,
        tippsSchnitt: n ? Math.round((10 * rows.reduce((s, r) => s + r.tipps, 0)) / n) / 10 : null,
        falscheAntworten: falsche.get(a.id) ?? []
      };
    });
    // Fallen-Profil (wie Algo Quest): je Falle die Fehlversuche und „Lösung angesehen“ in Aufgaben mit dieser Falle,
    // betroffen = Schüler mit mindestens einem Fehlversuch oder einer angesehenen Lösung dort
    const fallen = (aufgaben?.fallen ?? []).map((f) => {
      const mit = liste.filter((a) => (a.fallen || []).includes(f.p));
      let fehlversuche = 0; let angesehen = 0; let betroffen = 0;
      for (const s of subs) {
        let trifft = false;
        for (const a of mit) {
          const r = fp.get(s).get(a.id);
          if (!r) continue;
          fehlversuche += r.fehlversuche;
          if (r.status === 'angesehen') angesehen++;
          if (r.fehlversuche > 0 || r.status === 'angesehen') trifft = true;
        }
        if (trifft) betroffen++;
      }
      return { p: f.p, titel: f.titel, text: f.text, aufgaben: mit.length, fehlversuche, angesehen, schueler: betroffen, schuelerGesamt: subs.length };
    });
    return { kurs: { id: kurs.id, name: kurs.name, kursart }, schueler: subs.length, matrix, fallen, aufgaben: aufgabenStat };
  }

  /* ---------- CSV-Export (Semikolon, UTF-8 mit BOM – öffnet direkt in Excel/LibreOffice) ---------- */
  const zelle = (v) => {
    let s = v == null ? '' : String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // keine Formeln aus selbst gewählten Namen
    return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = (zeilen) => '﻿' + zeilen.map((z) => z.map(zelle).join(';')).join('\r\n') + '\r\n';
  const prozent = (x) => (x == null ? '' : String(Math.round(x * 100)));

  function export_(kurs, art) {
    if (art === 'matrix') {
      const a = kursAuswertung(kurs);
      return csv([['Name', ...a.matrix.levels.map((l) => `Level ${l.nr} (%)`)], ...a.matrix.zeilen.map((z) => [z.name, ...z.werte.map((w) => prozent(w.anteil))])]);
    }
    if (art === 'fallen') {
      const a = kursAuswertung(kurs);
      return csv([['Falle', 'Titel', 'Aufgaben', 'Fehlversuche', 'Lösung angesehen', 'betroffene Schüler', 'Schüler im Kurs'],
        ...a.fallen.map((f) => [f.p, f.titel, f.aufgaben, f.fehlversuche, f.angesehen, f.schueler, f.schuelerGesamt])]);
    }
    if (art === 'aufgaben') {
      const a = kursAuswertung(kurs);
      return csv([['Aufgabe', 'ID', 'Modul', 'Welt', 'Level', 'Stufe', 'Punkte', 'versucht', 'gelöst', 'Lösungsquote (%)', 'Ø Fehlversuche', 'Ø Tipps', 'Lösung angesehen', 'Fallen', 'häufige falsche Antworten'],
        ...a.aufgaben.map((x) => [x.titel, x.id, x.modul, x.welt, x.level ?? '', x.stufe, x.punkte, x.versucht, x.geloest, prozent(x.quote), x.fehlversucheSchnitt ?? '', x.tippsSchnitt ?? '', x.angesehen, x.fallen.join(' '), x.falscheAntworten.map((f) => `${f.antwort} (${f.anzahl}×)`).join(' | ')])]);
    }
    if (art === 'uebersicht') {
      return csv([['Name', 'Punkte', 'davon Training', 'gelöst', 'Lösung angesehen', 'Abzeichen', 'Rang', 'zuletzt aktiv'],
        ...schueler(kurs).map((s) => [s.name, s.punkte, s.trainingPunkte, s.geloest, s.angesehen, s.abzeichen, s.rang, s.zuletztAktiv ?? ''])]);
    }
    throw Object.assign(new Error('Diesen Export gibt es nicht.'), { status: 404 });
  }

  /** Kennzahlen eines Kurses für das Portal: je Schüler Punkte, gelöste Aufgaben, Anteil, zuletzt aktiv; je Welt der Anteil. */
  function kursUebersicht(kurs) {
    const { kursart } = einstellungen(kurs);
    const umfang = umfangAufgaben(kursart);
    const mitglieder = konten.mitglieder(kurs.id);
    const fp = fortschrittVon(mitglieder.map((m) => m.sub));
    const anteil = (sub, auswahl) => (auswahl.length ? auswahl.filter((a) => geloest(fp.get(sub).get(a.id))).length / auswahl.length : 0);
    const runde = (x) => Math.round(x * 100) / 100;
    const s = schueler(kurs);
    return {
      kurs: kurs.id,
      stand: iso(),
      schueler: s.map((z) => ({ sub: z.sub, punkte: z.punkte, geloest: z.geloest, anteil: runde(anteil(z.sub, umfang)), zuletzt: z.zuletztAktiv })),
      welten: katalog.welten.map((w) => {
        const auswahl = umfang.filter((a) => levelInfo.get(hauptLevel(a))?.welt === w.kennung);
        const werte = mitglieder.map((m) => anteil(m.sub, auswahl));
        return { nr: w.nr, kennung: w.kennung, titel: w.titel, anteil: werte.length ? runde(werte.reduce((a, b) => a + b, 0) / werte.length) : 0 };
      })
    };
  }

  /** Für Schüler: Einstellungen ihrer Kurse (nur, was die Startseite braucht). */
  function meineKurse(sub) {
    return konten.kurseVon(sub).filter((k) => k.rolle === 'mitglied').map((k) => ({ id: k.id, name: k.name, ...einstellungen(konten.kurs(k.id)) }));
  }

  return { kursUebersicht, schueler, kursAuswertung, einstellungen, einstellungenSetzen, meineKurse, export: export_, KURSARTEN, LEVEL_ARTEN };
}

module.exports = { createAuswertung, KURSARTEN, LEVEL_ARTEN, hauptLevel };
