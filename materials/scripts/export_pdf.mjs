// Materialien für die Plattform: aus materials/out (Word/PowerPoint) die Download-Fassungen nach materials/pdf erzeugen.
//   schueler/   PDFs ohne Lösungen: Arbeitsblätter, Merkblätter, Folien-Handout (ohne Notizen, ohne Lösungsfolien),
//               Boss-Level-Aufgaben, Lernlandkarte, Abi-Spickzettel
//   lehrkraft/  PDFs nur für Lehrkräfte: Lehrkraft-Handreichungen (Verlauf, Lösungen), Folien mit Notizseiten,
//               Erwartungshorizonte, Übungsklausuren, Einheitsplanung, Videoplanung, Erklärvideo-Folien mit Sprechertext
// Erklärvideos: die Folien jedes Videos der Reihe (out/video) liegen beim passenden Level (app/js/data/videos.js);
// die Aufnahmen selbst kommen später an dieselbe Stelle.
//   original/   die docx/pptx-Originale (Download nur für den Admin)
//   verzeichnis.json  Akten (je Level, Boss-Level, Klausuren, Einheit) mit allen Dateien – der Server liefert NUR
//                     Dateien aus, die hier verzeichnet sind (Whitelist, Vertrag InfoLabs §9).
// Aufruf (nach build_all.sh): node materials/scripts/export_pdf.mjs   – braucht LibreOffice (soffice) und Python pypdf.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { WORLDS, LEVELS } from '../../app/js/data/worlds.js';
import { LEVEL_NIVEAU, BOSS_NIVEAU, MERKBLAETTER } from '../../app/js/data/niveaus.js';
import { GAST_MATERIAL } from '../../app/js/data/gast.js';
import { ERKLAERVIDEOS } from '../../app/js/data/videos.js';

const MAT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(MAT, 'out');
const ZIEL = path.join(MAT, 'pdf');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'al-pdf-'));
const dateien = fs.readdirSync(OUT);
const videoMeta = fs.existsSync(path.join(OUT, 'video', 'video_meta.json')) ? JSON.parse(fs.readFileSync(path.join(OUT, 'video', 'video_meta.json'), 'utf8')) : [];
const finde = (re) => dateien.find((f) => re.test(f)) || null;
const ds = (n) => 'DS' + String(n).padStart(2, '0');

/* ---------- Akten zusammenstellen (welche Datei wohin) ---------- */
const akten = [];
const datei = (titel, art, quelle, ziel) => ({ titel, art, quelle, ...ziel });
for (const w of WORLDS) {
  for (const n of w.levels) {
    const ab = finde(new RegExp(`^${ds(n)}_AB_.*\\.docx$`));
    const lk = finde(new RegExp(`^${ds(n)}_Lehrkraft_.*\\.docx$`));
    const fo = finde(new RegExp(`^${ds(n)}_Folien_.*\\.pptx$`));
    const liste = [];
    if (ab) liste.push(datei('Arbeitsblatt', 'arbeitsblatt', ab, { schueler: true }));
    if (fo) liste.push(datei('Folien', 'folien', fo, { schueler: 'handout', lehrkraft: 'notizen' }));
    for (const m of MERKBLAETTER.filter((x) => x.level === n)) {
      const mb = finde(new RegExp(`^${m.id}_Merkblatt_.*\\.docx$`));
      if (mb) liste.push(datei(`Merkblatt ${m.id}: ${m.titel}`, 'merkblatt', mb, { schueler: true }));
    }
    if (lk) liste.push(datei('Lehrkraft-Handreichung mit Lösungen', 'loesung', lk, { lehrkraft: true }));
    for (const v of ERKLAERVIDEOS.filter((x) => x.level[0] === n)) {
      const m = videoMeta.find((x) => x.id === v.id);
      if (m && fs.existsSync(path.join(OUT, 'video', `${m.file}_Folien.pptx`))) {
        liste.push(datei(`Erklärvideo ${v.id}: ${v.titel}`, 'video', `video/${m.file}_Folien.pptx`, { schueler: true, lehrkraft: 'notizen' }));
      }
    }
    akten.push({ id: `level-${n}`, titel: `Level ${n}: ${LEVELS[n]}`, welt: w.id, level: n, niveau: LEVEL_NIVEAU[n], dateien: liste });
  }
  if (BOSS_NIVEAU[w.id]) {
    const auf = finde(new RegExp(`^BossLevel_${w.id}_(?!Erwartungshorizont).*\\.docx$`));
    const eh = finde(new RegExp(`^BossLevel_${w.id}_Erwartungshorizont\\.docx$`));
    akten.push({ id: `boss-${w.id.toLowerCase()}`, titel: `Boss-Level ${w.id}`, welt: w.id, niveau: BOSS_NIVEAU[w.id], dateien: [
      ...(auf ? [datei('Aufgabe', 'aufgabe', auf, { schueler: true })] : []),
      ...(eh ? [datei('Erwartungshorizont', 'loesung', eh, { lehrkraft: true })] : []),
    ] });
  }
}
const kl = (re) => finde(re);
akten.push({ id: 'klausur-ga', titel: 'Übungsklausur Grundkurs „Fahrradverleih“', welt: null, niveau: 'alle', dateien: [
  datei('Klausur', 'klausur', kl(/^Uebungsklausur_Grundkurs_Endliche-Automaten\.docx$/), { lehrkraft: true }),
  datei('Erwartungshorizont', 'loesung', kl(/^Uebungsklausur_Grundkurs_Erwartungshorizont\.docx$/), { lehrkraft: true }),
] });
akten.push({ id: 'klausur-ea', titel: 'Übungsklausur Leistungskurs „Smart-Home-Befehle“', welt: null, niveau: 'eA', dateien: [
  datei('Klausur', 'klausur', kl(/^Uebungsklausur_Automaten-und-Sprachen\.docx$/), { lehrkraft: true }),
  datei('Erwartungshorizont', 'loesung', kl(/^Uebungsklausur_Erwartungshorizont\.docx$/), { lehrkraft: true }),
] });
const m12 = finde(/^M12_Merkblatt_.*\.docx$/);
const video = fs.existsSync(path.join(OUT, 'video', '00_Videoreihe_Planung.docx')) ? 'video/00_Videoreihe_Planung.docx' : null;
akten.push({ id: 'einheit', titel: 'Zur ganzen Einheit', welt: null, niveau: 'alle', dateien: [
  ...(finde(/^00_Lernlandkarte\.docx$/) ? [datei('Lernlandkarte', 'arbeitsblatt', '00_Lernlandkarte.docx', { schueler: true })] : []),
  ...(m12 ? [datei('Merkblatt M12: Abi-Spickzettel', 'merkblatt', m12, { schueler: true })] : []),
  ...(finde(/^00_Einheitsplanung\.docx$/) ? [datei('Einheitsplanung und Ablaufplan', 'planung', '00_Einheitsplanung.docx', { lehrkraft: true })] : []),
  ...(video ? [datei('Planung der Erklärvideo-Reihe', 'planung', video, { lehrkraft: true })] : []),
] });
for (const a of akten) for (const d of a.dateien) if (!d.quelle) throw new Error(`Quelle fehlt in Akte ${a.id}: ${d.titel}`);

/* ---------- Umwandeln ---------- */
const soffice = (args, outdir) => execFileSync('soffice', ['--headless', ...args, '--outdir', outdir], { stdio: 'ignore' });
const alle = akten.flatMap((a) => a.dateien);
const docx = [...new Set(alle.filter((d) => d.quelle.endsWith('.docx')).map((d) => path.join(OUT, d.quelle)))];
const pptx = [...new Set(alle.filter((d) => d.quelle.endsWith('.pptx')).map((d) => path.join(OUT, d.quelle)))];
fs.mkdirSync(path.join(TMP, 'voll')); fs.mkdirSync(path.join(TMP, 'notizen'));
soffice(['--convert-to', 'pdf', ...docx, ...pptx], path.join(TMP, 'voll'));
soffice(['--convert-to', 'pdf:impress_pdf_Export:{"ExportNotesPages":{"type":"boolean","value":"true"},"ExportOnlyNotesPages":{"type":"boolean","value":"true"}}', ...pptx], path.join(TMP, 'notizen'));

fs.rmSync(ZIEL, { recursive: true, force: true });
for (const d of ['schueler', 'lehrkraft', 'original']) fs.mkdirSync(path.join(ZIEL, d), { recursive: true });
const pdfName = (q) => path.basename(q).replace(/\.(docx|pptx)$/, '.pdf');
const kopiere = (von, nach) => { fs.copyFileSync(von, path.join(ZIEL, nach)); return nach; };

/** Handout: Folien-PDF ohne die Lösungsfolien (Foliennummern aus der Begleitdatei von deckstyle.js). */
function handout(quelle, nach) {
  const info = JSON.parse(fs.readFileSync(path.join(OUT, quelle.replace(/\.pptx$/, '.folien.json')), 'utf8'));
  const py = 'import sys, json, pypdf\nr = pypdf.PdfReader(sys.argv[1]); w = pypdf.PdfWriter(); weg = set(json.loads(sys.argv[3]))\n'
    + 'assert len(r.pages) == int(sys.argv[4]), (len(r.pages), sys.argv[4])\n'
    + 'for i, p in enumerate(r.pages, 1):\n    if i not in weg: w.add_page(p)\nw.write(sys.argv[2])\n';
  execFileSync('python3', ['-c', py, path.join(TMP, 'voll', pdfName(quelle)), path.join(ZIEL, nach), JSON.stringify(info.nurLehrkraft), String(info.folien)]);
  return { nach, ohne: info.nurLehrkraft.length };
}

const groesse = (rel) => (rel ? fs.statSync(path.join(ZIEL, rel)).size : undefined);
for (const a of akten) {
  a.dateien = a.dateien.map((d) => {
    const basis = pdfName(d.quelle).replace(/\.pdf$/, '');
    const e = { titel: d.titel, art: d.art };
    if (d.schueler === 'handout') {
      const h = handout(d.quelle, `schueler/${basis}_Handout.pdf`);
      e.schueler = h.nach; if (h.ohne) e.hinweis = `${h.ohne === 1 ? 'eine Lösungsfolie' : `${h.ohne} Lösungsfolien`} nur in der Lehrkraftfassung`;
    } else if (d.schueler) e.schueler = kopiere(path.join(TMP, 'voll', pdfName(d.quelle)), `schueler/${basis}.pdf`);
    if (d.lehrkraft === 'notizen') e.lehrkraft = kopiere(path.join(TMP, 'notizen', pdfName(d.quelle)), `lehrkraft/${basis}_Notizen.pdf`);
    else if (d.lehrkraft) e.lehrkraft = kopiere(path.join(TMP, 'voll', pdfName(d.quelle)), `lehrkraft/${basis}.pdf`);
    e.original = kopiere(path.join(OUT, d.quelle), `original/${path.basename(d.quelle)}`);
    e.bytes = { schueler: groesse(e.schueler), lehrkraft: groesse(e.lehrkraft), original: groesse(e.original) };
    // Demo ohne Anmeldung (app/js/data/gast.js): nur ausgewählte Akten und Stufen, nie Originale
    if (GAST_MATERIAL.akten.includes(a.id)) { const demo = GAST_MATERIAL.stufen.filter((s) => s !== 'original' && e[s]); if (demo.length) e.demo = demo; }
    return e;
  });
}
fs.writeFileSync(path.join(ZIEL, 'verzeichnis.json'), JSON.stringify({ version: 1, akten }, null, 1) + '\n');
fs.rmSync(TMP, { recursive: true, force: true });
const n = (d) => fs.readdirSync(path.join(ZIEL, d)).length;
console.log(`Materialien: ${akten.length} Akten · ${n('schueler')} Schüler-PDFs · ${n('lehrkraft')} Lehrkraft-PDFs · ${n('original')} Originale → ${path.relative(process.cwd(), ZIEL)}`);
