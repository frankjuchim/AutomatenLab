'use strict';
// Live-Runden (Vertrag v1.3 §7 Fähigkeit „live“, Franks Entscheidung 15.10.2026): Die Lehrkraft startet im Kurs eine
// Runde wie ein Klassen-Quiz. Fragen kommen aus dem Level-Quiz einer Welt, der Akzeptor-Arena oder dem
// Chomsky-Sortierer. Die Schülerinnen und Schüler antworten am eigenen Gerät; Beamer und Handys werden über
// Server-Sent Events aktualisiert. Keine Auswirkung auf Lab-Punkte, Lernstand oder Ranglisten.
//
// Ablauf (die Lehrkraft schaltet weiter): lobby → frage → aufgedeckt → frage → … → ende.
// Datensparsam und flüchtig: Runden liegen nur im Arbeitsspeicher (nichts in der Datenbank), werden nach dem Ende
// oder nach LEERLAUF_MS ohne Aktion verworfen und beim Löschen eines Kontos bzw. Kurses sofort bereinigt (§10).
// Die richtige Antwort verlässt den Server erst beim Aufdecken (§9). Auf dem Beamer stehen keine Namen,
// nur Zahlen; jede und jeder sieht das eigene Ergebnis.

const crypto = require('node:crypto');

const FRAGEN = [5, 8, 10];
const SEKUNDEN = [15, 20, 30, 45, 60, 0]; // 0 = ohne Zeitlimit
const LEERLAUF_MS = 3 * 3600 * 1000;
const MAX_VERBINDUNGEN_KURS = 300;
const MAX_VERBINDUNGEN_KONTO = 4;
const HERZSCHLAG_MS = 25000;
// Drei Fächer wie im Chomsky-Sortierer (app/js/data/sortierer.js FAECHER, Engine SORTIERER_TYPEN = [3, 2, 0])
const SORTIERER_OPTIONEN = [
  { id: '3', text: 'DEA reicht (Typ 3)' },
  { id: '2', text: 'Kellerautomat nötig (Typ 2)' },
  { id: '0', text: 'Mehr nötig – Turingmaschine (Typ 0/1)' }
];
const WELTEN = ['A', 'B', 'C', 'D'];
const fehler = (status, text) => Object.assign(new Error(text), { status });

function createLive(ctx, { konten, aufgaben }) {
  const zufall = ctx.random ?? ((n) => crypto.randomInt(n));
  const mische = (liste) => {
    const a = [...liste];
    for (let i = a.length - 1; i > 0; i--) {
      const j = zufall(i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  /** kursId → Runde */
  const runden = new Map();
  /** kursId → Set von { res, sub, lehrkraft } */
  const hoerer = new Map();

  const rolleIm = (sub, kursId) => konten.kurseVon(sub).find((k) => k.id === kursId)?.rolle ?? null;

  /* ---------- Fragen erzeugen (mit Lösung, nur im Arbeitsspeicher) ---------- */
  const QUELLEN = {
    quiz(body, anzahl) {
      const welt = WELTEN.includes(body.welt) ? body.welt : null;
      if (!welt) throw fehler(400, 'Wählen Sie eine Welt (A–D).');
      const a = aufgaben.map.get(`quiz:welt-${welt}`);
      const pool = (a?.daten.fragen ?? []).filter((f) => f.typ === 'mc' || f.typ === 'wf');
      return {
        titel: `Level-Quiz Welt ${welt}`,
        fragen: mische(pool).slice(0, anzahl).map((f) => {
          if (f.typ === 'wf') {
            return { art: 'quiz', text: f.aussage, hinweis: 'Wahr oder falsch?', optionen: [{ id: 'w', text: 'wahr' }, { id: 'f', text: 'falsch' }], richtig: f.wahr ? 'w' : 'f', erklaerung: f.begruendungen[0] };
          }
          // Kennungen erst nach dem Mischen in Anzeigereihenfolge vergeben – sonst verriete die Kennung die Lösung
          const gemischt = mische(f.optionen.map((text, j) => ({ text, richtig: j === 0 })));
          const optionen = gemischt.map((o, k) => ({ id: 'abcdef'[k], text: o.text }));
          return { art: 'quiz', text: f.frage, optionen, richtig: 'abcdef'[gemischt.findIndex((o) => o.richtig)], erklaerung: f.erklaerung ?? null };
        })
      };
    },
    arena(body, anzahl) {
      const stufe = [1, 2, 3].includes(body.stufe) ? body.stufe : null;
      if (!stufe) throw fehler(400, 'Wählen Sie eine Arena-Stufe (1–3).');
      const { T, arena } = aufgaben.training;
      return {
        titel: `Akzeptor-Arena Stufe ${stufe}`,
        fragen: T.erzeugeArenaRunde(arena, { stufe, anzahl }).map((x) => ({
          art: 'arena', text: 'Akzeptiert der Automat das Wort?', automat: x.automat, wort: x.wort,
          optionen: [{ id: 'ja', text: 'Ja, akzeptiert' }, { id: 'nein', text: 'Nein, abgelehnt' }], richtig: x.akzeptiert ? 'ja' : 'nein', erklaerung: null
        }))
      };
    },
    sortierer(body, anzahl) {
      const { T, sortierer } = aufgaben.training;
      return {
        titel: 'Chomsky-Sortierer',
        fragen: T.erzeugeSortiererRunde(sortierer, {}).slice(0, anzahl).map((x) => ({
          art: 'sortierer', text: x.text, hinweis: 'Welche Maschine braucht man mindestens? Immer die einfachste wählen, die ausreicht.',
          optionen: SORTIERER_OPTIONEN, richtig: String(x.typ), erklaerung: x.warum
        }))
      };
    }
  };

  /* ---------- Zustand für die Anzeige ---------- */
  const jetzt = () => ctx.now();
  const offen = (r) => r.phase === 'frage' && (!r.bis || jetzt() < r.bis);

  function frageOeffentlich(f) {
    return { art: f.art, text: f.text, hinweis: f.hinweis ?? null, optionen: f.optionen, ...(f.art === 'arena' ? { automat: f.automat, wort: f.wort } : {}) };
  }

  /** Antworten der aktuellen Frage: Map sub → { wahl, ms } */
  const antwortenZu = (r, nr) => r.antworten[nr] ?? new Map();

  function auswertungFrage(r, nr) {
    const f = r.fragen[nr];
    const a = antwortenZu(r, nr);
    const verteilung = Object.fromEntries(f.optionen.map((o) => [o.id, 0]));
    for (const x of a.values()) verteilung[x.wahl] = (verteilung[x.wahl] ?? 0) + 1;
    return { richtig: f.richtig, erklaerung: f.erklaerung, verteilung, antworten: a.size, richtigAnzahl: verteilung[f.richtig] ?? 0 };
  }

  /** Punkte der Runde (nur zur Anzeige): richtig 100 + bis zu 50 für Schnelligkeit. */
  function punkteVon(r, sub) {
    let p = 0; let richtig = 0;
    r.fragen.forEach((f, nr) => {
      if (nr > r.aufgedecktBis) return;
      const x = antwortenZu(r, nr).get(sub);
      if (!x || x.wahl !== f.richtig) return;
      richtig++;
      const dauer = r.dauer[nr];
      p += 100 + (dauer ? Math.round(50 * Math.max(0, 1 - x.ms / dauer)) : 0);
    });
    return { punkte: p, richtig };
  }

  function kopf(r) {
    return { aktiv: true, id: r.id, titel: r.titel, phase: r.phase, nr: r.nr, anzahl: r.fragen.length, sekunden: r.sekunden, bis: r.bis, jetzt: jetzt(), teilnehmer: r.teilnehmer.size };
  }

  function fuerLehrkraft(r) {
    if (!r) return { aktiv: false };
    const z = kopf(r);
    if (r.phase === 'frage' || r.phase === 'aufgedeckt') {
      z.frage = frageOeffentlich(r.fragen[r.nr]);
      z.beantwortet = antwortenZu(r, r.nr).size;
      if (r.phase === 'aufgedeckt') z.auswertung = auswertungFrage(r, r.nr);
    }
    if (r.phase === 'ende') {
      z.fragen = r.fragen.map((f, nr) => {
        const a = auswertungFrage(r, nr);
        return { text: f.text, art: f.art, antworten: a.antworten, richtigAnzahl: a.richtigAnzahl };
      });
      // Verteilung „wie viele hatten k Fragen richtig“ – ohne Namen
      const verteilung = Array.from({ length: r.fragen.length + 1 }, () => 0);
      for (const sub of r.teilnehmer) verteilung[punkteVon(r, sub).richtig]++;
      z.richtigVerteilung = verteilung;
    }
    return z;
  }

  function fuerSchueler(r, sub) {
    if (!r) return { aktiv: false };
    const z = kopf(r);
    if (r.phase === 'frage' || r.phase === 'aufgedeckt') {
      z.frage = frageOeffentlich(r.fragen[r.nr]);
      z.meineWahl = antwortenZu(r, r.nr).get(sub)?.wahl ?? null;
      if (r.phase === 'aufgedeckt') {
        const f = r.fragen[r.nr];
        z.auswertung = { richtig: f.richtig, erklaerung: f.erklaerung };
      }
    }
    z.ich = punkteVon(r, sub);
    return z;
  }

  /* ---------- Server-Sent Events ---------- */
  function senden(eintrag) {
    const r = runden.get(eintrag.kursId);
    const z = eintrag.lehrkraft ? fuerLehrkraft(r) : fuerSchueler(r, eintrag.sub);
    eintrag.res.write(`event: zustand\ndata: ${JSON.stringify(z)}\n\n`);
    if (typeof eintrag.res.flush === 'function') eintrag.res.flush();
  }
  function verteilen(kursId) {
    for (const e of hoerer.get(kursId) ?? []) {
      try { senden(e); } catch { /* Verbindung weg – close räumt auf */ }
    }
  }

  /** Abo eines Kurses (Lehrkraft oder Mitglied). Gibt eine Aufräumfunktion zurück. */
  function abonnieren(konto, kursId, res, kopfSchreiben = () => {}) {
    const rolle = rolleIm(konto.sub, kursId);
    if (!rolle) throw fehler(404, 'Diesen Kurs gibt es nicht.');
    const liste = hoerer.get(kursId) ?? new Set();
    if (liste.size >= MAX_VERBINDUNGEN_KURS) throw fehler(429, 'Zu viele Verbindungen in diesem Kurs.');
    if ([...liste].filter((e) => e.sub === konto.sub).length >= MAX_VERBINDUNGEN_KONTO) throw fehler(429, 'Zu viele offene Fenster mit der Live-Runde.');
    hoerer.set(kursId, liste);
    kopfSchreiben();
    const eintrag = { res, sub: konto.sub, kursId, lehrkraft: rolle === 'lehrkraft' };
    liste.add(eintrag);
    const r = runden.get(kursId);
    if (r && !eintrag.lehrkraft && !r.teilnehmer.has(konto.sub) && r.phase !== 'ende') {
      r.teilnehmer.add(konto.sub);
      verteilen(kursId);
    } else senden(eintrag);
    const herz = setInterval(() => { try { res.write(': ping\n\n'); if (typeof res.flush === 'function') res.flush(); } catch { /* egal */ } }, HERZSCHLAG_MS);
    herz.unref?.();
    return () => {
      clearInterval(herz);
      liste.delete(eintrag);
      if (!liste.size) hoerer.delete(kursId);
    };
  }

  /* ---------- Lehrkraft ---------- */
  function aufraeumen() {
    for (const [kursId, r] of runden) if (jetzt() - r.zuletzt > LEERLAUF_MS) { runden.delete(kursId); verteilen(kursId); }
  }

  function starten(kursId, body) {
    aufraeumen();
    const b = body || {};
    const quelle = QUELLEN[b.art];
    if (!quelle) throw fehler(400, 'Wählen Sie, woher die Fragen kommen: Level-Quiz, Akzeptor-Arena oder Chomsky-Sortierer.');
    const anzahl = Number(b.anzahl);
    if (!FRAGEN.includes(anzahl)) throw fehler(400, `Anzahl der Fragen: ${FRAGEN.join(', ')}.`);
    const sekunden = Number(b.sekunden);
    if (!SEKUNDEN.includes(sekunden)) throw fehler(400, 'Zeit je Frage: 15, 20, 30, 45 oder 60 Sekunden oder ohne Zeitlimit.');
    const alt = runden.get(kursId);
    if (alt && alt.phase !== 'ende') throw fehler(409, 'In diesem Kurs läuft schon eine Live-Runde. Beenden Sie sie zuerst.');
    const { titel, fragen } = quelle(b, anzahl);
    if (!fragen.length) throw fehler(400, 'Für diese Auswahl gibt es keine Fragen.');
    const r = {
      id: crypto.randomBytes(6).toString('base64url'), kursId, titel, fragen, sekunden, phase: 'lobby', nr: -1, bis: null, start: null,
      aufgedecktBis: -1, antworten: [], dauer: [], teilnehmer: new Set(), zuletzt: jetzt()
    };
    // Wer schon zuschaut, ist dabei
    for (const e of hoerer.get(kursId) ?? []) if (!e.lehrkraft) r.teilnehmer.add(e.sub);
    runden.set(kursId, r);
    verteilen(kursId);
    return fuerLehrkraft(r);
  }

  function weiter(kursId) {
    const r = runden.get(kursId);
    if (!r) throw fehler(404, 'In diesem Kurs läuft keine Live-Runde.');
    r.zuletzt = jetzt();
    if (r.phase === 'lobby' || r.phase === 'aufgedeckt') {
      if (r.nr + 1 >= r.fragen.length) r.phase = 'ende';
      else {
        r.nr++;
        r.phase = 'frage';
        r.start = jetzt();
        r.bis = r.sekunden ? r.start + r.sekunden * 1000 : null;
        r.antworten[r.nr] = new Map();
      }
    } else if (r.phase === 'frage') {
      r.phase = 'aufgedeckt';
      r.dauer[r.nr] = r.sekunden ? r.sekunden * 1000 : 0;
      r.aufgedecktBis = r.nr;
      r.bis = null;
    } else throw fehler(409, 'Die Live-Runde ist schon zu Ende.');
    verteilen(kursId);
    return fuerLehrkraft(r);
  }

  function beenden(kursId) {
    const da = runden.delete(kursId);
    verteilen(kursId);
    return { ok: true, beendet: da };
  }

  /* ---------- Schüler ---------- */
  function antworten(konto, kursId, body) {
    if (rolleIm(konto.sub, kursId) !== 'mitglied') throw fehler(404, 'Diesen Kurs gibt es nicht.');
    const r = runden.get(kursId);
    if (!r) throw fehler(404, 'In deinem Kurs läuft gerade keine Live-Runde.');
    const b = body || {};
    if (b.nr !== r.nr || r.phase !== 'frage') throw fehler(409, 'Diese Frage ist schon vorbei.');
    if (!offen(r)) throw fehler(409, 'Die Zeit ist abgelaufen.');
    const f = r.fragen[r.nr];
    if (!f.optionen.some((o) => o.id === b.wahl)) throw fehler(400, 'Bitte wähle eine Antwort.');
    const a = r.antworten[r.nr];
    if (a.has(konto.sub)) throw fehler(409, 'Du hast schon geantwortet.');
    a.set(konto.sub, { wahl: b.wahl, ms: jetzt() - r.start });
    r.teilnehmer.add(konto.sub);
    r.zuletzt = jetzt();
    verteilen(kursId);
    return { ok: true, meineWahl: b.wahl };
  }

  /** Laufende Runden in den Kursen eines Kontos (für Startseite und #/live ohne Kurs). */
  function meine(sub) {
    aufraeumen();
    return konten.kurseVon(sub).filter((k) => runden.has(k.id) && runden.get(k.id).phase !== 'ende').map((k) => ({ kurs: k.id, kursName: k.name, rolle: k.rolle, titel: runden.get(k.id).titel }));
  }

  function zustand(konto, kursId) {
    const rolle = rolleIm(konto.sub, kursId);
    if (!rolle) throw fehler(404, 'Diesen Kurs gibt es nicht.');
    return rolle === 'lehrkraft' ? fuerLehrkraft(runden.get(kursId)) : fuerSchueler(runden.get(kursId), konto.sub);
  }

  /* ---------- Löschung (Verbund §10) ---------- */
  function vergissKonto(sub) {
    for (const [kursId, r] of runden) {
      r.teilnehmer.delete(sub);
      for (const a of r.antworten) a?.delete(sub);
      verteilen(kursId);
    }
    for (const liste of hoerer.values()) for (const e of [...liste]) if (e.sub === sub) { try { e.res.end(); } catch { /* egal */ } liste.delete(e); }
  }
  function vergissKurs(kursId) {
    runden.delete(kursId);
    for (const e of hoerer.get(kursId) ?? []) { try { e.res.end(); } catch { /* egal */ } }
    hoerer.delete(kursId);
  }

  return { starten, weiter, beenden, antworten, meine, zustand, abonnieren, vergissKonto, vergissKurs, fuerLehrkraft: (kursId) => fuerLehrkraft(runden.get(kursId)), FRAGEN, SEKUNDEN, LEERLAUF_MS };
}

module.exports = { createLive };
