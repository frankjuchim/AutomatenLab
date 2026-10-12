'use strict';
// Zusätzliche Materialien (Arbeitsblätter, Folien, Merkblätter, Klausuren) als Download – zählen nicht für Punkte.
// Grundlage: materials/pdf/verzeichnis.json (materials/scripts/export_pdf.mjs). Ausgeliefert werden NUR dort
// verzeichnete Dateien (Whitelist, Vertrag InfoLabs §9):
//   Schüler-PDF   angemeldet; Schüler nur mit freigeschaltetem Kurs (§4) – ohne Lösungen
//   Lehrkraft-PDF Lehrkräfte und Admin – mit Lösungen, Notizseiten, Erwartungshorizonten, Klausuren
//   Original      docx/pptx nur für den Admin (Rolle superadmin), einzeln oder als ZIP je Akte
//   Demo          einzelne Dateien mit `demo` (app/js/data/gast.js) auch ohne Anmeldung – Gastmodus, nie Originale
const fs = require('node:fs');
const path = require('node:path');
const { zip } = require('./zip');

const STUFEN = ['schueler', 'lehrkraft', 'original'];
const istLehrkraft = (k) => !!k && (k.rolle === 'lehrkraft' || k.rolle === 'superadmin');
const istAdmin = (k) => !!k && k.rolle === 'superadmin';

/** Welche Stufen darf ein Konto sehen? kurse: freigeschaltete Kurse des Kontos (Schüler ohne Kurs: nichts). */
function stufenFuer(konto, kurse) {
  if (!konto) return [];
  if (istAdmin(konto)) return ['schueler', 'lehrkraft', 'original'];
  if (istLehrkraft(konto)) return ['schueler', 'lehrkraft'];
  return kurse > 0 ? ['schueler'] : [];
}

/**
 * @param {{dir: string|null, log?: Function}} opts  dir: Ordner mit verzeichnis.json (null = keine Materialien)
 */
function createMaterial({ dir, log = () => {} }) {
  let akten = [];
  const datei = dir && path.join(dir, 'verzeichnis.json');
  if (datei && fs.existsSync(datei)) {
    try {
      akten = JSON.parse(fs.readFileSync(datei, 'utf8')).akten || [];
    } catch (e) {
      log(`materials/pdf/verzeichnis.json nicht lesbar: ${e.message}`);
    }
  }
  // Whitelist: „stufe/dateiname“ → absolute Datei (nur existierende, nur ohne Pfadtricks)
  const erlaubt = new Map();
  const demo = new Set(); // „stufe/dateiname“, die ohne Anmeldung offen sind
  for (const a of akten) {
    for (const d of a.dateien || []) {
      for (const s of STUFEN) {
        const rel = d[s];
        if (typeof rel !== 'string' || !rel.startsWith(s + '/') || rel.includes('..') || rel.split('/').length !== 2) continue;
        const abs = path.join(dir, rel);
        if (fs.existsSync(abs)) {
          erlaubt.set(rel, abs);
          if (s !== 'original' && Array.isArray(d.demo) && d.demo.includes(s)) demo.add(rel);
        } else d[s] = null;
      }
    }
  }
  const url = (rel) => '/material/' + rel.split('/').map(encodeURIComponent).join('/');

  /** Übersicht für ein Konto: nur Dateien der erlaubten Stufen, Akten ohne sichtbare Datei entfallen. */
  function uebersicht(konto, kurse) {
    const st = stufenFuer(konto, kurse);
    // Ohne Rechte (Gast, Schüler ohne Kurs): nur die Demo-Dateien
    const nurDemo = !st.length;
    const sichtbar = (rel, s) => !!rel && erlaubt.has(rel) && (nurDemo ? demo.has(rel) : st.includes(s));
    const liste = akten
      .map((a) => ({
        id: a.id, titel: a.titel, welt: a.welt ?? null, level: a.level ?? null, niveau: a.niveau || 'alle',
        dateien: (a.dateien || []).map((d) => {
          const e = { titel: d.titel, art: d.art, ...(d.hinweis ? { hinweis: d.hinweis } : {}) };
          for (const s of STUFEN) if (sichtbar(d[s], s)) e[s] = { url: url(d[s]), bytes: (d.bytes || {})[s] ?? null };
          return e;
        }).filter((e) => STUFEN.some((s) => e[s])),
        ...(st.includes('original') ? { zip: `/material/zip/${encodeURIComponent(a.id)}.zip` } : {})
      }))
      .filter((a) => a.dateien.length);
    return { stufen: nurDemo ? [] : st, demo: nurDemo, akten: liste };
  }

  /** Datei zu „stufe/name“, wenn das Konto sie sehen darf; sonst { status } (401/403/404). */
  function dateiFuer(rel, konto, kurse) {
    const abs = erlaubt.get(rel);
    if (!abs) return { status: 404 };
    if (demo.has(rel)) return { abs };
    if (!konto) return { status: 401 };
    return stufenFuer(konto, kurse).includes(rel.split('/')[0]) ? { abs } : { status: 403 };
  }

  /** ZIP der Originale einer Akte (nur Admin). */
  function zipFuer(id, konto) {
    const a = akten.find((x) => x.id === id);
    if (!a) return { status: 404 };
    if (!konto) return { status: 401 };
    if (!istAdmin(konto)) return { status: 403 };
    const eintraege = (a.dateien || []).filter((d) => d.original && erlaubt.has(d.original))
      .map((d) => ({ name: path.basename(d.original), daten: fs.readFileSync(erlaubt.get(d.original)) }));
    if (!eintraege.length) return { status: 404 };
    return { name: `AutomatenLab_${a.id}.zip`, daten: zip(eintraege) };
  }

  return { uebersicht, dateiFuer, zipFuer, anzahl: () => akten.length };
}

module.exports = { createMaterial, stufenFuer };
