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

const crypto = require('node:crypto');

const KURSARTEN = ['eA', 'gA'];
const LEVEL_ARTEN = ['pflicht', 'vertiefung', 'bonus', 'spaeter'];
const BOSS_MODI = ['auto', 'offen', 'gesperrt']; // wie src/boss.js
const AUFTRAG_MAX = 400;
const hauptLevel = (a) => { const l = a.levels || []; return l.length ? (a.modul === 'quiz' && l.length > 1 ? l[l.length - 1] : l[0]) : null; };

function createAuswertung(ctx, { konten, katalog, aufgaben, training = null, bossPunkte = () => new Map() }) {
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
    // Rangliste für Schüler und Beamer-Board (PR 8, wie Algo Quest): beide standardmäßig aus. Das Board ist ohne
    // Anmeldung unter /board/<token> erreichbar – ein zufälliger Link statt des Kurscodes, den die Plattform nicht kennt.
    const beamer = { aktiv: !!(e.beamer && e.beamer.aktiv && e.beamer.token), token: typeof e.beamer?.token === 'string' ? e.beamer.token : null };
    return { kursart: KURSARTEN.includes(e.kursart) ? e.kursart : 'eA', levelArt, auftrag, scoreboard: e.scoreboard === true, beamer, boss: BOSS_MODI.includes(e.boss) ? e.boss : 'auto' };
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
    if (body && body.boss !== undefined) {
      if (!BOSS_MODI.includes(body.boss)) throw ungueltig('Diese Einstellung für die Boss-Kämpfe gibt es nicht.');
      e.boss = body.boss;
    }
    if (body && body.scoreboard !== undefined) {
      if (typeof body.scoreboard !== 'boolean') throw ungueltig('Die Einstellung zur Rangliste passt nicht.');
      e.scoreboard = body.scoreboard;
    }
    if (body && body.beamer !== undefined) {
      const b = body.beamer;
      if (!b || typeof b !== 'object' || typeof b.aktiv !== 'boolean' || (b.neu !== undefined && typeof b.neu !== 'boolean')) throw ungueltig('Die Einstellung zum Beamer-Board passt nicht.');
      // neuer Link beim ersten Einschalten oder auf Wunsch („Neuen Link erzeugen“ – der alte gilt dann nicht mehr)
      const token = !e.beamer.token || b.neu ? crypto.randomBytes(12).toString('base64url') : e.beamer.token;
      e.beamer = { aktiv: b.aktiv, token };
    }
    db.prepare('UPDATE kurse SET einstellungen = ?, updated_at = ? WHERE id = ?').run(JSON.stringify(e), iso(), kurs.id);
    return einstellungen({ einstellungen: JSON.stringify(e) });
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
    const bossP = bossPunkte(subs);
    const zeilen = mitglieder.map((m) => {
      const rows = [...fp.get(m.sub).values()].filter((r) => aufgaben?.map.has(r.aufgabe_id) ?? true);
      const aufgabenPunkte = rows.reduce((s, r) => s + r.punkte, 0);
      const t = trainingP.get(m.sub) || 0;
      const bp = bossP.get(m.sub) || 0;
      return {
        sub: m.sub,
        name: m.name,
        punkte: aufgabenPunkte + t + bp,
        aufgabenPunkte,
        trainingPunkte: t,
        bossPunkte: bp,
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
    // beim Level-Quiz die im ersten Durchgang falsch beantworteten Fragen mit dieser Falle (fragenFallen);
    // betroffen = Schüler mit mindestens einem davon
    const fallen = (aufgaben?.fallen ?? []).map((f) => {
      const mit = liste.filter((a) => (a.fallen || []).includes(f.p));
      let fehlversuche = 0; let angesehen = 0; let quizFalsch = 0; let betroffen = 0;
      for (const s of subs) {
        let trifft = false;
        for (const a of mit) {
          const r = fp.get(s).get(a.id);
          if (!r) continue;
          if (a.fragenFallen) {
            let antworten = {};
            try { antworten = JSON.parse(r.daten || '{}').antworten || {}; } catch { /* leer */ }
            for (const [i, wert] of Object.entries(antworten)) {
              if (wert < 1 && (a.fragenFallen[Number(i)] || []).includes(f.p)) { quizFalsch++; trifft = true; }
            }
            continue;
          }
          fehlversuche += r.fehlversuche;
          if (r.status === 'angesehen') angesehen++;
          if (r.fehlversuche > 0 || r.status === 'angesehen') trifft = true;
        }
        if (trifft) betroffen++;
      }
      return { p: f.p, titel: f.titel, text: f.text, aufgaben: mit.length, fehlversuche, quizFalsch, angesehen, schueler: betroffen, schuelerGesamt: subs.length };
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
      return csv([['Falle', 'Titel', 'Aufgaben', 'Fehlversuche', 'falsch im Level-Quiz', 'Lösung angesehen', 'betroffene Schüler', 'Schüler im Kurs'],
        ...a.fallen.map((f) => [f.p, f.titel, f.aufgaben, f.fehlversuche, f.quizFalsch, f.angesehen, f.schueler, f.schuelerGesamt])]);
    }
    if (art === 'aufgaben') {
      const a = kursAuswertung(kurs);
      return csv([['Aufgabe', 'ID', 'Modul', 'Welt', 'Level', 'Stufe', 'Punkte', 'versucht', 'gelöst', 'Lösungsquote (%)', 'Ø Fehlversuche', 'Ø Tipps', 'Lösung angesehen', 'Fallen', 'häufige falsche Antworten'],
        ...a.aufgaben.map((x) => [x.titel, x.id, x.modul, x.welt, x.level ?? '', x.stufe, x.punkte, x.versucht, x.geloest, prozent(x.quote), x.fehlversucheSchnitt ?? '', x.tippsSchnitt ?? '', x.angesehen, x.fallen.join(' '), x.falscheAntworten.map((f) => `${f.antwort} (${f.anzahl}×)`).join(' | ')])]);
    }
    if (art === 'uebersicht') {
      return csv([['Name', 'Punkte', 'davon Training', 'davon Boss (beste Versuche)', 'gelöst', 'Lösung angesehen', 'Abzeichen', 'Rang', 'zuletzt aktiv'],
        ...schueler(kurs).map((s) => [s.name, s.punkte, s.trainingPunkte, s.bossPunkte, s.geloest, s.angesehen, s.abzeichen, s.rang, s.zuletztAktiv ?? ''])]);
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
    return konten.kurseVon(sub).filter((k) => k.rolle === 'mitglied').map((k) => {
      const { beamer, ...e } = einstellungen(konten.kurs(k.id)); // der Board-Link bleibt bei der Lehrkraft
      return { id: k.id, name: k.name, ...e };
    });
  }

  /* ---------- Rangliste, Beamer-Board, Urkunden (PR 8, wie Algo Quest) ---------- */

  const WELTEN = katalog.welten.map((w) => w.kennung);
  const weltVon = (a) => levelInfo.get(hauptLevel(a))?.welt ?? null;

  /** Platz wie Algo Quest: gleiche Punkte, gleicher Platz; bei Gleichstand nach Namen sortiert. */
  function mitPlatz(zeilen) {
    const sortiert = [...zeilen].sort((x, y) => y.punkte - x.punkte || x.name.localeCompare(y.name, 'de'));
    return sortiert.map((z) => ({ ...z, platz: 1 + sortiert.filter((y) => y.punkte > z.punkte).length }));
  }

  /** Punkte je Schüler: gesamt (Aufgaben + Training) oder nur die Aufgaben einer Welt (ohne Training). */
  function punkteListe(kurs, welt) {
    const s = schueler(kurs);
    if (!welt) return s.map((z) => ({ sub: z.sub, name: z.name, punkte: z.punkte, abzeichen: z.abzeichen, geloest: z.geloest }));
    const fp = fortschrittVon(s.map((z) => z.sub));
    const inWelt = new Set(liste.filter((a) => weltVon(a) === welt).map((a) => a.id));
    const bossW = bossPunkte(s.map((z) => z.sub), welt);
    return s.map((z) => {
      const rows = [...fp.get(z.sub).values()].filter((r) => inWelt.has(r.aufgabe_id));
      return { sub: z.sub, name: z.name, punkte: rows.reduce((n, r) => n + r.punkte, 0) + (bossW.get(z.sub) || 0), abzeichen: z.abzeichen, geloest: rows.filter(geloest).length };
    });
  }

  /** Rangliste für Schüler: je eigenem Kurs mit eingeschalteter Rangliste; eigener Eintrag markiert, keine Konto-IDs. */
  function rangliste(sub, welt = null) {
    if (welt != null && !WELTEN.includes(welt)) throw Object.assign(new Error('Diese Welt gibt es nicht.'), { status: 400 });
    const kurse = konten.kurseVon(sub).filter((k) => k.rolle === 'mitglied').map((k) => konten.kurs(k.id)).filter((k) => einstellungen(k).scoreboard);
    return {
      welt,
      welten: katalog.welten.map((w) => ({ kennung: w.kennung, titel: w.titel })),
      kurse: kurse.map((k) => ({
        id: k.id,
        name: k.name,
        liste: mitPlatz(punkteListe(k, welt)).map(({ sub: s, ...z }) => ({ ...z, ...(s === sub ? { ich: true } : {}) }))
      }))
    };
  }

  /** Anteil der Level-Punkte im Kursumfang (je Schüler), optional nur für eine Welt. */
  function levelAnteile(kurs, welt = null) {
    const { kursart } = einstellungen(kurs);
    const auswahl = umfangAufgaben(kursart).filter((a) => !welt || weltVon(a) === welt);
    const max = auswahl.reduce((n, a) => n + a.punkte, 0);
    const subs = konten.mitglieder(kurs.id).map((m) => m.sub);
    const fp = fortschrittVon(subs);
    return new Map(subs.map((s) => [s, max ? Math.min(1, auswahl.reduce((n, a) => n + (fp.get(s).get(a.id)?.punkte ?? 0), 0) / max) : 0]));
  }

  /** Letzte Erfolge der Kursmitglieder (Abzeichen), Text mit dem aktuellen Anzeigenamen. */
  function erfolge(kurs, n = 8) {
    const m = konten.mitglieder(kurs.id);
    if (!m.length) return [];
    const namen = new Map(m.map((x) => [x.sub, x.name]));
    return db.prepare(`SELECT sub, schluessel, at FROM abzeichen WHERE sub IN (${m.map(() => '?').join(',')}) ORDER BY at DESC, schluessel LIMIT ?`).all(...m.map((x) => x.sub), n)
      .map((r) => ({ text: `${namen.get(r.sub)} hat das Abzeichen „${aufgaben?.abzeichen?.get(r.schluessel)?.titel ?? r.schluessel}“ erhalten`, at: r.at }));
  }

  /** Beamer-Board (öffentlich über den zufälligen Link, nur wenn eingeschaltet): Top 15, Fortschritt je Welt, Erfolge. */
  function board(token) {
    const nichtDa = () => Object.assign(new Error('Kein Beamer-Board unter dieser Adresse.'), { status: 404 });
    if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{16}$/.test(token)) throw nichtDa();
    const kurs = db.prepare("SELECT * FROM kurse WHERE aktiv = 1 AND json_extract(einstellungen, '$.beamer.token') = ?").get(token);
    if (!kurs || !einstellungen(kurs).beamer.aktiv) throw nichtDa();
    const { kursart } = einstellungen(kurs);
    const welten = katalog.welten.filter((w) => umfangAufgaben(kursart).some((a) => weltVon(a) === w.kennung)).map((w) => {
      const anteile = [...levelAnteile(kurs, w.kennung).values()];
      return { kennung: w.kennung, titel: w.titel, farbe: w.farbe, anteil: anteile.length ? Math.round((1000 * anteile.reduce((a, b) => a + b, 0)) / anteile.length) / 1000 : 0 };
    });
    return {
      kurs: { name: kurs.name },
      schueler: konten.mitglieder(kurs.id).length,
      liste: mitPlatz(punkteListe(kurs)).slice(0, 15).map(({ sub, ...z }) => z),
      welten,
      erfolge: erfolge(kurs),
      challenges: api.challengesFuerBoard(kurs.id),
      stand: iso()
    };
  }

  // Ränge der Urkunde nach dem Anteil der Level-Punkte im Kursumfang (Schwellen wie Algo Quest)
  const RAENGE = ['Startzustand', 'Zwischenzustand', 'Übergangsprofi', 'Endzustand in Sicht', 'Akzeptiert!'];
  const SCHWELLEN = [0, 0.1, 0.3, 0.55, 0.8];
  const rangVon = (anteil) => RAENGE[SCHWELLEN.reduce((r, x, i) => (anteil >= x ? i : r), 0)];

  /** Urkunden eines Kurses: je Schüler Name, Rang, Punkte, gelöst, Platz, Abzeichen – gedruckt im Browser. */
  function urkunden(kurs) {
    const anteile = levelAnteile(kurs);
    const zeilen = mitPlatz(punkteListe(kurs));
    const titel = (sub) => db.prepare('SELECT schluessel FROM abzeichen WHERE sub = ? ORDER BY at').all(sub).map((r) => aufgaben?.abzeichen?.get(r.schluessel)?.titel ?? r.schluessel);
    return {
      kurs: { id: kurs.id, name: kurs.name, kursart: einstellungen(kurs).kursart },
      raenge: RAENGE,
      anzahl: zeilen.length,
      schueler: zeilen.map((z) => ({ id: z.sub, name: z.name, punkte: z.punkte, geloest: z.geloest, platz: z.platz, anteil: Math.round(100 * (anteile.get(z.sub) ?? 0)) / 100, rang: rangVon(anteile.get(z.sub) ?? 0), abzeichen: titel(z.sub) }))
    };
  }

  const api = { challengesFuerBoard: () => [] }; // wird in src/app.js gesetzt (Klassen-Challenges)
  return Object.assign(api, { kursUebersicht, schueler, kursAuswertung, einstellungen, einstellungenSetzen, meineKurse, rangliste, board, urkunden, export: export_, KURSARTEN, LEVEL_ARTEN, RAENGE });
}

module.exports = { createAuswertung, KURSARTEN, LEVEL_ARTEN, hauptLevel };
