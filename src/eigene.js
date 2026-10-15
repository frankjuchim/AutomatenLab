'use strict';
// Eigene Aufgaben der Lehrkräfte (PR 10/12, Aufgaben-Editor): je Kurs eigene Quizfragen (Multiple Choice, Wahr/Falsch mit
// Begründung), Baukasten-Challenges (Musterautomat als DEA, geprüft wird die Sprache), Detektiv-Fälle (Automat + vier
// Beschreibungen) und Grammatik-Challenges (Mustergrammatik, geprüft wird die Sprache bis zu einer Wortlänge). Sie laufen in den
// vorhandenen Modulen (#/quiz?eigen=<nr>, #/baukasten?eigen=<nr>) über dieselbe Prüf-API wie alle Aufgaben
// (ID „eigen:<nr>“). Lösungen liegen nur auf dem Server (Vertrag §9). Eigene Aufgaben geben keine Punkte und keine
// Abzeichen – sie gehören zu einem Kurs, Punkte aber zum Konto (sonst zählten sie in fremden Kursen mit).
// Sichtbar für Schüler erst, wenn die Lehrkraft sie freigibt („aktiv“).

const MAX_JE_KURS = 60;
const fehler = (status, text) => Object.assign(new Error(text), { status });
const ungueltig = (text) => fehler(400, text);

/** Text prüfen: Pflicht, Länge, keine Steuerzeichen. */
function text(v, name, { min = 1, max = 300, pflicht = true } = {}) {
  if (v == null || v === '') { if (pflicht) throw ungueltig(`${name} fehlt.`); return ''; }
  if (typeof v !== 'string') throw ungueltig(`${name} passt nicht.`);
  const t = v.replace(/\r\n?/g, '\n').trim();
  if (/[\u0000-\u0008\u000B-\u001F\u007F]/.test(t)) throw ungueltig(`${name} enthält ungültige Zeichen.`);
  if (t.length < min && pflicht) throw ungueltig(`${name} ist zu kurz.`);
  if (t.length > max) throw ungueltig(`${name} ist zu lang (höchstens ${max} Zeichen).`);
  return t;
}

function createEigene(ctx, { aufgaben, konten }) {
  const { db } = ctx;
  const T = aufgaben.typen;
  const iso = () => new Date(ctx.now()).toISOString();
  const nummer = (id) => { const m = /^eigen:(\d{1,9})$/.exec(String(id)); return m ? Number(m[1]) : null; };
  const zeile = (nr) => db.prepare('SELECT * FROM eigene_aufgaben WHERE id = ?').get(nr);
  const daten = (r) => { try { return JSON.parse(r.daten); } catch { return {}; } };

  /* ---------- Prüfen der Eingaben aus dem Editor ---------- */

  function pruefeQuiz(d) {
    if (!d || !Array.isArray(d.fragen) || d.fragen.length < 1 || d.fragen.length > 12) throw ungueltig('Ein Quiz hat 1 bis 12 Fragen.');
    const fragen = d.fragen.map((f, i) => {
      const n = `Frage ${i + 1}`;
      const erklaerung = text(f?.erklaerung, `${n}: Erklärung`, { pflicht: false, max: 400 }) || null;
      if (f?.typ === 'mc') {
        const optionen = (Array.isArray(f.optionen) ? f.optionen : []).map((o, j) => text(o, `${n}: Antwort ${j + 1}`, { max: 200 }));
        if (optionen.length < 2 || optionen.length > 4) throw ungueltig(`${n}: 2 bis 4 Antworten.`);
        if (new Set(optionen).size !== optionen.length) throw ungueltig(`${n}: Zwei Antworten sind gleich.`);
        if (!Number.isInteger(f.richtig) || f.richtig < 0 || f.richtig >= optionen.length) throw ungueltig(`${n}: Markieren Sie die richtige Antwort.`);
        // gespeichert wie im Level-Quiz: die richtige Antwort zuerst (die App mischt)
        return { typ: 'mc', frage: text(f.frage, `${n}: Frage`, { max: 400 }), optionen: [optionen[f.richtig], ...optionen.filter((_, j) => j !== f.richtig)], erklaerung };
      }
      if (f?.typ === 'wf') {
        const begr = (Array.isArray(f.begruendungen) ? f.begruendungen : []).map((o, j) => text(o, `${n}: Begründung ${j + 1}`, { max: 200 }));
        if (begr.length < 2 || begr.length > 3) throw ungueltig(`${n}: 2 bis 3 Begründungen.`);
        if (new Set(begr).size !== begr.length) throw ungueltig(`${n}: Zwei Begründungen sind gleich.`);
        if (typeof f.wahr !== 'boolean') throw ungueltig(`${n}: Ist die Aussage wahr oder falsch?`);
        if (!Number.isInteger(f.richtig) || f.richtig < 0 || f.richtig >= begr.length) throw ungueltig(`${n}: Markieren Sie die passende Begründung.`);
        return { typ: 'wf', aussage: text(f.aussage, `${n}: Aussage`, { max: 400 }), wahr: f.wahr, begruendungen: [begr[f.richtig], ...begr.filter((_, j) => j !== f.richtig)], erklaerung };
      }
      throw ungueltig(`${n}: Unbekannter Fragetyp.`);
    });
    return { fragen };
  }

  function pruefeBaukasten(d) {
    if (!d || typeof d !== 'object') throw ungueltig('Die Challenge fehlt.');
    const stufe = [1, 2, 3].includes(d.stufe) ? d.stufe : null;
    if (!stufe) throw ungueltig('Wählen Sie eine Stufe (Basis, Standard, Profi).');
    let ref;
    try {
      if (!d.referenz || JSON.stringify(d.referenz).length > 20000) throw new Error('fehlt');
      ref = T.normalizeDFA(d.referenz);
    } catch (e) { throw ungueltig(`Der Musterautomat ist nicht lesbar (${e.message}).`); }
    if (ref.alphabet.length < 1 || ref.alphabet.length > 6 || ref.alphabet.some((a) => !/^[^\s,;]{1,4}$/.test(a))) throw ungueltig('Das Alphabet hat 1 bis 6 Zeichen (je höchstens 4 Buchstaben, ohne Leerzeichen und Komma).');
    if (ref.states.length > 25) throw ungueltig('Der Musterautomat hat zu viele Zustände (höchstens 25).');
    if (!ref.accepting.length) throw ungueltig('Der Musterautomat braucht mindestens einen Endzustand.');
    const tipps = (Array.isArray(d.tipps) ? d.tipps : []).map((t, j) => text(t, `Tipp ${j + 1}`, { max: 300 })).slice(0, 3);
    return { aufgabe: text(d.aufgabe, 'Der Aufgabentext', { max: 800, min: 10 }), stufe, referenz: d.referenz, tipps };
  }

  /** Automat aus dem Editor prüfen (DEA, Alphabet, Größe). */
  function pruefeAutomat(spec, name) {
    let ref;
    try {
      if (!spec || JSON.stringify(spec).length > 20000) throw new Error('fehlt');
      ref = T.normalizeDFA(spec);
    } catch (e) { throw ungueltig(`${name} ist nicht lesbar (${e.message}).`); }
    if (ref.alphabet.length < 1 || ref.alphabet.length > 6 || ref.alphabet.some((a) => !/^[^\s,;]{1,4}$/.test(a))) throw ungueltig('Das Alphabet hat 1 bis 6 Zeichen (je höchstens 4 Buchstaben, ohne Leerzeichen und Komma).');
    if (ref.states.length > 25) throw ungueltig(`${name} hat zu viele Zustände (höchstens 25).`);
    return ref;
  }

  function pruefeDetektiv(d) {
    if (!d || typeof d !== 'object') throw ungueltig('Der Fall fehlt.');
    const ref = pruefeAutomat(d.automat, 'Der Automat');
    if (!ref.accepting.length) throw ungueltig('Der Automat braucht mindestens einen Endzustand.');
    const optionen = (Array.isArray(d.optionen) ? d.optionen : []).map((o, j) => text(o, `Beschreibung ${j + 1}`, { max: 200 }));
    if (optionen.length !== 4) throw ungueltig('Ein Fall hat genau vier Beschreibungen.');
    if (new Set(optionen).size !== 4) throw ungueltig('Zwei Beschreibungen sind gleich.');
    if (!Number.isInteger(d.richtig) || d.richtig < 0 || d.richtig > 3) throw ungueltig('Markieren Sie die richtige Beschreibung.');
    return { automat: d.automat, optionen: [optionen[d.richtig], ...optionen.filter((_, j) => j !== d.richtig)], erklaerung: text(d.erklaerung, 'Die Erklärung', { pflicht: false, max: 400 }) || null };
  }

  /** Vergleichslänge für Grammatiken: je größer Σ, desto kürzer (Zahl der Wörter bleibt klein). */
  const vergleichsLaenge = (sigma) => (sigma.length <= 2 ? 8 : sigma.length === 3 ? 6 : 5);

  function pruefeGrammatik(d) {
    if (!d || typeof d !== 'object') throw ungueltig('Die Challenge fehlt.');
    const stufe = [1, 2, 3].includes(d.stufe) ? d.stufe : null;
    if (!stufe) throw ungueltig('Wählen Sie eine Stufe (Basis, Standard, Profi).');
    const alphabet = Array.isArray(d.alphabet) ? [...new Set(d.alphabet.map((x) => String(x).trim()).filter(Boolean))] : [];
    if (alphabet.length < 1 || alphabet.length > 5 || alphabet.some((a) => !/^[a-z0-9()+*.;#[\]]{1}$/.test(a))) throw ungueltig('Das Alphabet hat 1 bis 5 Zeichen (Kleinbuchstaben, Ziffern oder Klammern, je ein Zeichen).');
    const referenz = text(d.referenz, 'Die Mustergrammatik', { max: 1000 });
    const g = T.parseGrammar(referenz);
    if (!g.ok) throw ungueltig(`Die Mustergrammatik hat Fehler: ${g.errors.join(' ')}`);
    if (g.terminals.some((t) => !alphabet.includes(t))) throw ungueltig(`Die Mustergrammatik benutzt Zeichen außerhalb von Σ = {${alphabet.join(', ')}}.`);
    const regulaer = d.regulaer === true;
    if (regulaer && !T.isRightRegular(g).regular) throw ungueltig('Die Mustergrammatik ist nicht rechtsregulär – dann kann das auch niemand verlangen.');
    const l = T.languageUpTo(g, vergleichsLaenge(alphabet), { maxNodes: 60000 });
    if (!l.complete) throw ungueltig('Die Mustergrammatik ist zu aufwendig zum Prüfen – bitte vereinfachen.');
    if (!l.words.length) throw ungueltig('Die Mustergrammatik erzeugt keine kurzen Wörter.');
    const tipps = (Array.isArray(d.tipps) ? d.tipps : []).map((t, j) => text(t, `Tipp ${j + 1}`, { max: 300 })).slice(0, 3);
    return { aufgabe: text(d.aufgabe, 'Der Aufgabentext', { max: 800, min: 10 }), stufe, alphabet, referenz, regulaer, tipps };
  }

  const PRUEFE = { quiz: pruefeQuiz, baukasten: pruefeBaukasten, detektiv: pruefeDetektiv, grammatik: pruefeGrammatik };
  const ARTEN = Object.keys(PRUEFE);
  const MODUL = { quiz: 'quiz', baukasten: 'baukasten', detektiv: 'detektiv', grammatik: 'grammatik' };
  const linkVon = (r) => `#/${MODUL[r.art]}?eigen=${r.id}`;

  /** Beispielwörter aus dem Musterautomaten (je bis zu vier kürzeste akzeptierte und verworfene Wörter). */
  function beispiele(ref) {
    const ja = []; const nein = [];
    const woerter = [[]];
    for (let i = 0; i < woerter.length && woerter.length < 4000 && (ja.length < 4 || nein.length < 4); i++) {
      const w = woerter[i];
      let s = ref.start;
      for (const a of w) s = s == null ? null : (ref.delta[s]?.[a] ?? null);
      const anzeige = w.length ? w.join(ref.alphabet.some((a) => a.length > 1) ? ' ' : '') : 'ε';
      if (s != null && ref.accepting.includes(s)) { if (ja.length < 4) ja.push(anzeige); } else if (nein.length < 4) nein.push(anzeige);
      if (w.length < 6) for (const a of ref.alphabet) woerter.push([...w, a]);
    }
    return { ja, nein };
  }

  /** Aufgabe im Format des Katalogs (für src/lernen.js) – null, wenn es sie nicht gibt. */
  function aufgabe(id) {
    const nr = nummer(id);
    const r = nr != null ? zeile(nr) : null;
    if (!r) return null;
    const d = daten(r);
    if (r.art === 'quiz') {
      return { id: `eigen:${r.id}`, typ: T.quiz, modul: 'eigen', art: 'eigen-quiz', titel: r.titel, stufe: 1, punkte: 0, levels: [], fallen: [], daten: { titel: r.titel, fragen: d.fragen }, tipps: [] };
    }
    if (r.art === 'detektiv') {
      return { id: `eigen:${r.id}`, typ: T.detektiv, modul: 'eigen', art: 'eigen-detektiv', nr: 0, titel: r.titel, stufe: 1, punkte: 0, levels: [], fallen: [],
        daten: { titel: r.titel, automat: d.automat, optionen: d.optionen.map((text) => ({ text })), vorschlaege: beispiele(T.normalizeDFA(d.automat)).ja.slice(0, 2).concat(beispiele(T.normalizeDFA(d.automat)).nein.slice(0, 3)), bedeutung: d.erklaerung ? { Hinweis: d.erklaerung } : null }, tipps: [] };
    }
    if (r.art === 'grammatik') {
      const g = T.parseGrammar(d.referenz);
      const maxLen = vergleichsLaenge(d.alphabet);
      const sprache = new Set(T.languageUpTo(g, maxLen, { maxNodes: 60000 }).words.map((w) => w.join('\u0001')));
      const pruefe = (w) => sprache.has(w.join('\u0001'));
      const ja = [...sprache].slice(0, 4).map((w) => (w === '' ? 'ε' : w.split('\u0001').join('')));
      const nein = [];
      const woerter = [[]];
      for (let i = 0; i < woerter.length && nein.length < 4 && woerter.length < 3000; i++) {
        if (!pruefe(woerter[i])) nein.push(woerter[i].length ? woerter[i].join('') : 'ε');
        if (woerter[i].length < maxLen) for (const a of d.alphabet) woerter.push([...woerter[i], a]);
      }
      return { id: `eigen:${r.id}`, typ: T.grammatik, modul: 'eigen', art: 'eigen-grammatik', nr: 0, titel: r.titel, stufe: d.stufe, punkte: 0, levels: [], fallen: [],
        daten: { id: `eigen-${r.id}`, titel: r.titel, aufgabe: d.aufgabe, stufe: d.stufe, alphabet: d.alphabet, maxLen, regulaer: d.regulaer, pruefe, musterloesung: d.referenz, beispiele: { ja, nein } }, tipps: d.tipps ?? [] };
    }
    const ref = T.normalizeDFA(d.referenz);
    return {
      id: `eigen:${r.id}`, typ: T.baukasten, modul: 'eigen', art: 'eigen-baukasten', nr: 0, titel: r.titel, stufe: d.stufe, punkte: 0, levels: [], fallen: [],
      daten: { id: `eigen-${r.id}`, titel: r.titel, aufgabe: d.aufgabe, stufe: d.stufe, referenz: d.referenz, beispiele: beispiele(ref) }, ref, tipps: d.tipps ?? []
    };
  }

  /* ---------- Rechte ---------- */
  const lehrkraftVon = (konto, kursId) => konten.kurseVon(konto.sub).some((k) => k.id === kursId && k.rolle === 'lehrkraft');
  /** Darf das Konto die Aufgabe lösen? Schüler: Mitglied des Kurses und freigegeben; Lehrkräfte: eigener Kurs. */
  function darfLoesen(konto, id) {
    const nr = nummer(id);
    const r = nr != null ? zeile(nr) : null;
    if (!r || !konto) return false;
    if (lehrkraftVon(konto, r.kurs_id)) return true;
    return !!r.aktiv && konten.kurseVon(konto.sub).some((k) => k.id === r.kurs_id && k.rolle === 'mitglied');
  }
  function fuerLehrkraft(konto, nr) {
    const r = zeile(Number(nr) || 0);
    if (!r || !lehrkraftVon(konto, r.kurs_id)) throw fehler(404, 'Diese Aufgabe gibt es nicht.');
    return r;
  }

  /* ---------- Verwaltung ---------- */
  function statistik(nr) {
    const id = `eigen:${nr}`;
    const z = db.prepare("SELECT COUNT(*) AS versucht, SUM(CASE WHEN status = 'geloest' OR nachgeloest = 1 THEN 1 ELSE 0 END) AS geloest FROM fortschritt WHERE aufgabe_id = ?").get(id);
    return { versucht: z.versucht, geloest: z.geloest ?? 0 };
  }
  const ansicht = (r, mitDaten = false) => ({
    nr: r.id, id: `eigen:${r.id}`, kurs: r.kurs_id, art: r.art, titel: r.titel, aktiv: !!r.aktiv, geaendert: r.updated_at,
    link: linkVon(r),
    ...(r.art === 'quiz' ? { fragen: (daten(r).fragen ?? []).length } : r.art === 'detektiv' ? {} : { stufe: daten(r).stufe }),
    ...statistik(r.id),
    ...(mitDaten ? { daten: editorDaten(r) } : {})
  });
  /** Daten für den Editor: richtige Antwort wieder als Index 0 kennzeichnen. */
  function editorDaten(r) {
    const d = daten(r);
    if (r.art === 'quiz') return { fragen: d.fragen.map((f) => ({ ...f, richtig: 0 })) };
    if (r.art === 'detektiv') return { ...d, richtig: 0 };
    return d;
  }

  function liste(kursId) {
    return db.prepare('SELECT * FROM eigene_aufgaben WHERE kurs_id = ? ORDER BY id').all(kursId).map((r) => ansicht(r));
  }

  function anlegen(konto, kursId, body) {
    if (!lehrkraftVon(konto, kursId)) throw fehler(404, 'Diesen Kurs gibt es nicht.');
    if (db.prepare('SELECT COUNT(*) AS n FROM eigene_aufgaben WHERE kurs_id = ?').get(kursId).n >= MAX_JE_KURS) throw ungueltig(`Höchstens ${MAX_JE_KURS} eigene Aufgaben je Kurs.`);
    const art = body?.art;
    if (!ARTEN.includes(art)) throw ungueltig('Diese Aufgabenart gibt es nicht.');
    const titel = text(body.titel, 'Der Titel', { min: 3, max: 80 });
    const d = PRUEFE[art](body.daten);
    const info = db.prepare('INSERT INTO eigene_aufgaben (kurs_id, autor_sub, art, titel, daten, aktiv, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(kursId, konto.sub, art, titel, JSON.stringify(d), body.aktiv ? 1 : 0, iso(), iso());
    return ansicht(zeile(Number(info.lastInsertRowid)), true);
  }

  function aendern(konto, nr, body) {
    const r = fuerLehrkraft(konto, nr);
    const titel = body?.titel !== undefined ? text(body.titel, 'Der Titel', { min: 3, max: 80 }) : r.titel;
    const d = body?.daten !== undefined ? PRUEFE[r.art](body.daten) : daten(r);
    const aktiv = body?.aktiv !== undefined ? (body.aktiv ? 1 : 0) : r.aktiv;
    // Inhalt geändert → bisherige Ergebnisse passen nicht mehr (Quizwertung je Frage, gelöst mit altem Automaten)
    if (body?.daten !== undefined && JSON.stringify(d) !== r.daten) loescheErgebnisse(r.id);
    db.prepare('UPDATE eigene_aufgaben SET titel = ?, daten = ?, aktiv = ?, updated_at = ? WHERE id = ?').run(titel, JSON.stringify(d), aktiv, iso(), r.id);
    return ansicht(zeile(r.id), true);
  }

  function loescheErgebnisse(nr) {
    db.prepare('DELETE FROM fortschritt WHERE aufgabe_id = ?').run(`eigen:${nr}`);
    db.prepare('DELETE FROM falsche_antworten WHERE aufgabe_id = ?').run(`eigen:${nr}`);
  }

  function loeschen(konto, nr) {
    const r = fuerLehrkraft(konto, nr);
    db.transaction(() => { loescheErgebnisse(r.id); db.prepare('DELETE FROM eigene_aufgaben WHERE id = ?').run(r.id); })();
    return { geloescht: true };
  }

  const lesen = (konto, nr) => ansicht(fuerLehrkraft(konto, nr), true);

  /** In einen anderen eigenen Kurs kopieren (als Entwurf, ohne Ergebnisse). */
  function kopieren(konto, nr, zielKurs) {
    const r = fuerLehrkraft(konto, nr);
    const ziel = String(zielKurs ?? '');
    if (!lehrkraftVon(konto, ziel)) throw fehler(404, 'Diesen Kurs gibt es nicht.');
    if (db.prepare('SELECT COUNT(*) AS n FROM eigene_aufgaben WHERE kurs_id = ?').get(ziel).n >= MAX_JE_KURS) throw ungueltig(`Höchstens ${MAX_JE_KURS} eigene Aufgaben je Kurs.`);
    const info = db.prepare('INSERT INTO eigene_aufgaben (kurs_id, autor_sub, art, titel, daten, aktiv, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 0, ?, ?)')
      .run(ziel, konto.sub, r.art, r.titel, r.daten, iso(), iso());
    return ansicht(zeile(Number(info.lastInsertRowid)));
  }

  /** Für Schüler: freigegebene Aufgaben ihrer Kurse mit eigenem Stand. */
  function fuerSchueler(sub) {
    const kurse = konten.kurseVon(sub).filter((k) => k.rolle === 'mitglied');
    if (!kurse.length) return [];
    const namen = new Map(kurse.map((k) => [k.id, k.name]));
    return db.prepare(`SELECT * FROM eigene_aufgaben WHERE aktiv = 1 AND kurs_id IN (${kurse.map(() => '?').join(',')}) ORDER BY kurs_id, id`).all(...kurse.map((k) => k.id)).map((r) => {
      const f = db.prepare('SELECT status, nachgeloest FROM fortschritt WHERE sub = ? AND aufgabe_id = ?').get(sub, `eigen:${r.id}`);
      return { nr: r.id, art: r.art, titel: r.titel, kurs: namen.get(r.kurs_id), link: linkVon(r), status: f ? (f.status === 'geloest' || f.nachgeloest ? 'geloest' : f.status) : 'offen' };
    });
  }

  return { aufgabe, darfLoesen, liste, anlegen, aendern, loeschen, lesen, kopieren, fuerSchueler, nummer, MAX_JE_KURS, ARTEN };
}

module.exports = { createEigene };
