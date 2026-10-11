// Schreibt out/video/video_meta.json (Titel, Lab-Routen) für make_overlays.py
const path = require('path');
const fs = require('fs');
const OUT = path.resolve(__dirname, '../../out/video/');
const A = require('./videos.js');
const B = require('./videos_b.js');
const all = [A.v1, A.v2, A.v3, A.v4, A.v5, B.v6, B.v7, B.v8, B.v9, B.o1, B.o2];
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'video_meta.json'), JSON.stringify(all.map((v) => ({
  id: v.id, file: v.file, title: v.title, short: v.short, kurs: v.kurs,
  labs: v.segs.flatMap((s) => s.lab || []).map((l) => l.route),
})), null, 1));
console.log('video_meta.json geschrieben');
