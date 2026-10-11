const __MAT = require('path').resolve(__dirname, '../..'); // Wurzel: materials/
// Baut die Folien aller Erklärvideos und schreibt video_index.json (Folien-Nummern je Segment, Zeiten) für die Planung.
const fs = require('fs');
const VS = require((__MAT + '/lib/videostyle.js'));
const A = require('./videos.js');
let B = {}; try { B = require('./videos_b.js'); } catch (e) { if (!/Cannot find module/.test(e.message)) throw e; }
const ALL = [A.v1, A.v2, A.v3, A.v4, A.v5, B.v6, B.v7, B.v8, B.v9, B.o1, B.o2].filter(Boolean);
const OUT = (__MAT + '/out/video/');
const only = process.argv[2];
const mmss = (t) => `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;

(async () => {
  const index = fs.existsSync(OUT + 'video_index.json') ? JSON.parse(fs.readFileSync(OUT + 'video_index.json')) : {};
  for (const v of ALL) {
    if (only && v.id !== only) continue;
    const d = VS.video({ nr: v.id.replace(/^V/, ''), code: v.id.startsWith('O') ? `Extra ${v.id.slice(1)}` : `Video ${v.id.slice(1)}`, title: v.title, short: v.short });
    let n = 0, t = 0; const segs = [];
    for (const sg of v.segs) {
      const first = n + 1;
      sg.slides.forEach((mk, i) => {
        const s = mk(d); n++;
        if (i === 0) s.addNotes([`[${mmss(t)}–${mmss(t + sg.s)}] ${sg.kapitel}`, ...sg.sprech].join('\n'));
      });
      segs.push({ start: mmss(t), end: mmss(t + sg.s), first, last: n });
      t += sg.s;
    }
    const file = `${OUT}${v.file}_Folien.pptx`;
    await d.save(file);
    index[v.id] = { file, slides: n, dauer: mmss(t), segs };
    console.log(v.id, n, 'Folien', mmss(t));
  }
  fs.writeFileSync(OUT + 'video_index.json', JSON.stringify(index, null, 1));
})();
