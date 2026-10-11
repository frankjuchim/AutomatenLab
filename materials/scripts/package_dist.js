// Stellt aus out/ das Lehrkräfte-Paket dist/Automaten_LK zusammen (gleiche Struktur wie die ausgelieferte Version 1.0).
const fs = require('fs');
const path = require('path');
const MAT = path.resolve(__dirname, '..');
const OUT = path.join(MAT, 'out');
const DIST = path.join(MAT, 'dist', 'Automaten_LK');
const PFLICHT = [1, 2, 3, 6, 7, 9, 11, 12, 13], VERTIEFUNG = [5, 10, 14], BONUS = [4, 8, 15, 16];

fs.rmSync(DIST, { recursive: true, force: true });
const cp = (src, dst) => { fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.copyFileSync(src, dst); };
const files = fs.existsSync(OUT) ? fs.readdirSync(OUT) : [];
const missing = [];

function level(nr, ordner) {
  const dd = 'DS' + String(nr).padStart(2, '0');
  const ab = files.find((f) => f.startsWith(dd + '_AB_'));
  if (!ab) { missing.push(dd); return; }
  const slug = ab.slice(dd.length + 4).replace(/\.docx$/, '');
  for (const f of files.filter((x) => x.startsWith(dd + '_'))) cp(path.join(OUT, f), path.join(DIST, ordner, `${dd}_${slug}`, f));
}
PFLICHT.forEach((n) => level(n, '1_Pflicht'));
VERTIEFUNG.forEach((n) => level(n, '2_Vertiefung'));
BONUS.forEach((n) => level(n, '3_Bonus_und_Extra-Uebungen'));
for (const f of files.filter((x) => /^(BossLevel_|Uebungsklausur_)/.test(x))) cp(path.join(OUT, f), path.join(DIST, '3_Bonus_und_Extra-Uebungen', 'Boss-Level_und_Uebungsklausur', f));
for (const f of files.filter((x) => /^M\d\d_Merkblatt_.*\.docx$/.test(x))) cp(path.join(OUT, f), path.join(DIST, 'Merkblaetter', f));
for (const f of files.filter((x) => /^00_.*\.docx$/.test(x))) cp(path.join(OUT, f), path.join(DIST, f));

const V = path.join(OUT, 'video');
if (fs.existsSync(V)) {
  const VD = path.join(DIST, '4_Videoreihe');
  if (fs.existsSync(path.join(V, '00_Videoreihe_Planung.docx'))) cp(path.join(V, '00_Videoreihe_Planung.docx'), path.join(VD, '00_Videoreihe_Planung.docx'));
  for (const f of fs.readdirSync(V).filter((x) => x.endsWith('_Folien.pptx'))) cp(path.join(V, f), path.join(VD, 'Folien', f));
  for (const [sub, to] of [['OBS', 'OBS-Overlays'], ['Thumbnails', 'Thumbnails']]) {
    const d = path.join(V, sub);
    if (fs.existsSync(d)) for (const f of fs.readdirSync(d)) cp(path.join(d, f), path.join(VD, to, f));
  }
} else missing.push('video');
cp(path.join(MAT, 'templates', 'LIESMICH.txt'), path.join(DIST, 'LIESMICH.txt'));

const count = (d) => fs.readdirSync(d, { withFileTypes: true }).reduce((n, e) => n + (e.isDirectory() ? count(path.join(d, e.name)) : 1), 0);
console.log(`Paket: ${path.relative(process.cwd(), DIST)} (${count(DIST)} Dateien)` + (missing.length ? ` – fehlt: ${missing.join(', ')}` : ''));
