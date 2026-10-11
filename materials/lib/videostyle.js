/* videostyle.js – Folien für die Erklärvideo-Reihe (16:9, 13,33" × 7,5").
 * Gleiches Design wie deckstyle.js, aber mit fester KAMERA-FLÄCHE unten rechts (Webcam-Overlay):
 *   Kamera:     x 9,6 … 13,1"  ·  y 5,0 … 7,25"   (bei 1920 × 1080: x ≥ 1383 px, y ≥ 720 px)
 *   Hauptfläche: x 0,6 … 9,2"  ·  y 1,45 … 6,95"
 *   Seitenleiste (über der Kamera): x 9,6 … 13,1" · y 1,45 … 4,7"
 * Schrift ≥ 20 pt (Handy-tauglich), Sprechimpulse in den Notizen (Referentenansicht).
 */
const pptxgen = require('pptxgenjs');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { applyTheme, soffice } = require('./pptx-theme.js');
const S = require('./deckstyle.js');
const { H, THEME, icon, appName } = S;

const W = 13.333, HT = 7.5, M = 0.6;
const CAM = { x: 9.6, y: 5.0, w: 3.5, h: 2.25 };
const MAIN = { x: M, y: 1.45, w: 8.6, h: 5.5 };
const RAIL = { x: 9.6, y: 1.45, w: 3.5, h: 3.25 };
const BASE_URL = process.env.AUTOMATENLAB_URL || 'https://automatenlab.frankjuchim.de/';
const HOST = BASE_URL.replace(/^https?:\/\//, '').replace(/\/$/, '');

function rich(text, base = {}) {
  const out = []; const re = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\^[^^]+\^|~[^~]+~)/g; let last = 0, m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push({ text: text.slice(last, m.index), options: { ...base } });
    const t = m[0];
    if (t.startsWith('**')) out.push({ text: t.slice(2, -2), options: { ...base, bold: true } });
    else if (t.startsWith('`')) out.push({ text: t.slice(1, -1), options: { ...base, fontFace: 'Consolas', color: H.tealDark } });
    else if (t.startsWith('^')) out.push({ text: t.slice(1, -1), options: { ...base, superscript: true } });
    else if (t.startsWith('~')) out.push({ text: t.slice(1, -1), options: { ...base, subscript: true } });
    else out.push({ text: t.slice(1, -1), options: { ...base, italic: true } });
    last = m.index + t.length;
  }
  if (last < text.length) out.push({ text: text.slice(last), options: { ...base } });
  if (!out.length) out.push({ text: '', options: { ...base } });
  return out;
}
const SUP = { n: 'ⁿ', i: 'ⁱ', j: 'ʲ', k: 'ᵏ', '2': '²', '3': '³', '+': '⁺', '1': '¹', R: 'ᴿ' };
const supT = (t) => String(t).replace(/\^([^^]+)\^/g, (m, x) => [...x].map((c) => SUP[c] || c).join(''));
function bullets(items, size = 22, color = H.ink, gap = 10) {
  const out = [];
  items.forEach((it, i) => {
    const sub = it.startsWith('  ');
    const r = rich(it.trim(), { fontSize: sub ? size - 2 : size, color: sub ? H.muted : color });
    r[0].options = { ...r[0].options, bullet: sub ? { indent: 18 } : { code: '25AA', indent: 22 }, indentLevel: sub ? 1 : 0, paraSpaceAfter: gap };
    r[r.length - 1].options = { ...r[r.length - 1].options, breakLine: i < items.length - 1 };
    out.push(...r);
  });
  return out;
}
function lines(items, size = 20, color = H.ink, gap = 6, align) {
  const out = [];
  items.forEach((it, i) => {
    const r = rich(it, { fontSize: size, color });
    r[0].options = { ...r[0].options, paraSpaceAfter: gap, ...(align ? { align } : {}) };
    r[r.length - 1].options = { ...r[r.length - 1].options, breakLine: i < items.length - 1 };
    out.push(...r);
  });
  return out;
}
function imgSize(file) { const b = fs.readFileSync(file); return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) }; }
function fit(file, maxW, maxH) {
  const { w, h } = imgSize(file); let iw = maxW, ih = maxW * h / w;
  if (ih > maxH) { ih = maxH; iw = maxH * w / h; }
  return { w: iw, h: ih };
}
function qrData(route, dark = '#0A4A3F') {
  const url = BASE_URL.replace(/\/?$/, '/') + (route || '');
  const tmp = path.join(require('os').tmpdir(), 'vqr_' + Buffer.from(url + dark).toString('hex').slice(-40) + '.png');
  execFileSync('python3', ['-c', `import segno; segno.make(${JSON.stringify(url)}, error='m').save(${JSON.stringify(tmp)}, scale=12, border=1, dark=${JSON.stringify(dark)}, light='#FFFFFF')`]);
  return 'image/png;base64,' + fs.readFileSync(tmp).toString('base64');
}

function camMarks(fillColor, markColor) {
  const o = [{ rect: { x: CAM.x, y: CAM.y, w: CAM.w, h: CAM.h, fill: { color: fillColor } } }];
  const L = 0.35, t = 2.5;
  const c = [[CAM.x, CAM.y, 1, 1], [CAM.x + CAM.w, CAM.y, -1, 1], [CAM.x, CAM.y + CAM.h, 1, -1], [CAM.x + CAM.w, CAM.y + CAM.h, -1, -1]];
  c.forEach(([x, y, dx, dy]) => {
    o.push({ line: { x: dx > 0 ? x : x - L, y, w: L, h: 0, line: { color: markColor, width: t } } });
    o.push({ line: { x, y: dy > 0 ? y : y - L, w: 0, h: L, line: { color: markColor, width: t } } });
  });
  return o;
}

function video({ nr, code, title, short }) {
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_WIDE';
  pres.theme = { headFontFace: 'Cambria', bodyFontFace: 'Calibri' };
  pres.author = 'Frank Juchim'; pres.title = `${code} – ${title}`;
  const C = pres.SchemeColor;
  const footer = `${code}  ·  ${short}  ·  ${HOST}`;
  const titlePh = { placeholder: { options: { name: 'title', type: 'title', x: M, y: 0.35, w: W - 2 * M, h: 0.9, fontFace: 'Cambria', fontSize: 32, bold: true, color: C.accent1, valign: 'middle', align: 'left', margin: 0 }, text: '' } };
  const foot = { text: { text: footer, options: { x: M, y: 7.0, w: 8.6, h: 0.3, fontSize: 12, color: H.muted, fontFace: 'Calibri', margin: 0 } } };
  pres.defineSlideMaster({ title: 'V_TITEL', background: { color: H.teal }, objects: [...camMarks('0B574A', 'F3D9B5')] });
  pres.defineSlideMaster({ title: 'V_INHALT', background: { color: H.white }, objects: [titlePh, foot, ...camMarks(H.tealTint2, '9FC3BC')] });
  pres.defineSlideMaster({ title: 'V_AKZENT', background: { color: H.tealTint2 }, objects: [titlePh, foot, ...camMarks('E4EEEC', '9FC3BC')] });
  pres.defineSlideMaster({ title: 'V_DUNKEL', background: { color: H.tealDark }, objects: [...camMarks('083D34', 'F3D9B5')] });

  const add = (master) => pres.addSlide({ masterName: master });
  const tb = (s, content, o) => s.addText(content, { isTextBox: true, fontFace: 'Calibri', color: H.ink, valign: 'top', margin: 0, ...o });
  const note = (s, n) => { if (n) s.addNotes(Array.isArray(n) ? n.join('\n') : n); };
  const card = (s, x, y, w, h, fill = H.tealTint2, line = H.tealTint) => s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: fill }, line: { color: line, width: 1 }, rectRadius: 0.1 });
  const image = (s, img, box) => { const f = fit(img, box.w, box.h); s.addImage({ path: img, x: box.x + (box.w - f.w) / 2, y: box.y + (box.h - f.h) / 2, w: f.w, h: f.h }); return f; };

  /** Seitenleiste über der Kamera: { head, items | lines | text, tone: 'teal'|'ocker', word, pos } */
  function rail(s, r) {
    if (!r) return;
    const ock = r.tone === 'ocker';
    const y0 = RAIL.y, h = r.h || RAIL.h;
    card(s, RAIL.x, y0, RAIL.w, h, ock ? H.ockerTint : H.tealTint2, ock ? H.ocker : H.tealTint);
    let y = y0 + 0.18;
    if (r.head) { tb(s, r.head.toUpperCase(), { x: RAIL.x + 0.22, y, w: RAIL.w - 0.44, h: 0.35, fontSize: 14, bold: true, color: ock ? H.ocker : H.teal, charSpacing: 1 }); y += 0.45; }
    if (r.word) { y = wordStrip(s, r.word, r.pos, RAIL.x + 0.22, y, RAIL.w - 0.44) + 0.15; }
    const size = r.size || 19;
    if (r.items) tb(s, bullets(r.items, size, H.ink, 6), { x: RAIL.x + 0.22, y, w: RAIL.w - 0.44, h: y0 + h - y - 0.12 });
    if (r.lines) tb(s, lines(r.lines, size, H.ink, 6), { x: RAIL.x + 0.22, y, w: RAIL.w - 0.44, h: y0 + h - y - 0.12 });
  }
  /** Eingabewort als Kästchen; pos = Index des zuletzt gelesenen Zeichens (ocker), -1 = noch nichts gelesen. */
  function wordStrip(s, word, pos, x, y, w) {
    const n = word.length, bw = Math.min(0.62, (w - 0.05 * (n - 1)) / n);
    word.forEach((ch, i) => {
      const done = i <= pos, cur = i === pos;
      s.addShape(pres.shapes.RECTANGLE, { x: x + i * (bw + 0.05), y, w: bw, h: 0.62, fill: { color: cur ? H.ocker : done ? 'F6E7CF' : H.white }, line: { color: cur ? H.ocker : H.line, width: 1.2 } });
      tb(s, ch, { x: x + i * (bw + 0.05), y, w: bw, h: 0.62, align: 'center', valign: 'middle', fontSize: ch.length > 1 ? 16 : 22, bold: true, fontFace: 'Consolas', color: cur ? H.white : H.ink });
    });
    return y + 0.62;
  }
  /** Kellerspeicher als Stapel (oberstes Zeichen oben); content: 'AA#' (oberstes links, wie in der Abi-Tabelle) */
  function stack(s, content, x, yBottom, { w = 0.9, h = 0.55, label, hl } = {}) {
    const ch = [...content];
    ch.forEach((c, i) => {
      const y = yBottom - (ch.length - i) * h;
      const top = i === 0;
      s.addShape(pres.shapes.RECTANGLE, { x, y, w, h, fill: { color: c === '#' ? 'D7E4E1' : (top && hl ? H.ocker : 'F6E7CF') }, line: { color: H.tealDark, width: 1.2 } });
      tb(s, c, { x, y, w, h, align: 'center', valign: 'middle', fontSize: 22, bold: true, fontFace: 'Consolas', color: top && hl && c !== '#' ? H.white : H.ink });
    });
    if (label) tb(s, label, { x: x - 0.6, y: yBottom + 0.08, w: w + 1.2, h: 0.4, align: 'center', fontSize: 15, color: H.muted });
  }

  const api = {
    pres, tb, card, image, rich, bullets, lines, stack, wordStrip, rail, MAIN, RAIL, CAM, W, HT, M, H,
    title({ kicker, title: t, frage, notes: n }) {
      const s = add('V_TITEL');
      tb(s, kicker || `Erklärvideo ${nr}  ·  Maschinen, die Sprache verstehen`, { x: M + 0.1, y: 1.0, w: 8.8, h: 0.4, fontSize: 18, color: 'F3D9B5', bold: true });
      tb(s, supT(t), { x: M + 0.1, y: 1.6, w: 8.6, h: 2.3, fontSize: 46, bold: true, fontFace: 'Cambria', color: H.white, valign: 'bottom' });
      if (frage) {
        s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: M + 0.1, y: 4.35, w: 8.5, h: 1.6, fill: { color: H.tealDark }, line: { color: H.tealDark }, rectRadius: 0.12 });
        tb(s, [{ text: 'Leitfrage', options: { fontSize: 15, bold: true, color: 'F3D9B5', breakLine: true } }, ...rich(frage, { fontSize: 23, italic: true, color: H.white, fontFace: 'Cambria' })], { x: M + 0.35, y: 4.5, w: 8.0, h: 1.35, valign: 'middle' });
      }
      tb(s, HOST, { x: M + 0.1, y: 6.6, w: 8, h: 0.35, fontSize: 14, color: 'BFD9D4' });
      // Motiv rechts oben (über der Kamera)
      const cx = 10.0;
      [[cx, 1.0], [cx + 1.55, 1.0], [cx + 0.78, 2.55]].forEach(([x, y], i) => {
        s.addShape(pres.shapes.OVAL, { x, y, w: 1.05, h: 1.05, fill: { color: H.teal }, line: { color: i === 2 ? 'F3D9B5' : 'D7EAE6', width: 2.5 } });
        if (i === 2) s.addShape(pres.shapes.OVAL, { x: x + 0.1, y: y + 0.1, w: 0.85, h: 0.85, fill: { color: H.teal }, line: { color: 'F3D9B5', width: 1.5 } });
        tb(s, `S${i}`, { x, y, w: 1.05, h: 1.05, align: 'center', valign: 'middle', fontSize: 19, bold: true, color: H.white, fontFace: 'Cambria' });
      });
      s.addShape(pres.shapes.LINE, { x: cx + 1.07, y: 1.52, w: 0.46, h: 0, line: { color: 'D7EAE6', width: 2, endArrowType: 'triangle' } });
      s.addShape(pres.shapes.LINE, { x: cx + 1.65, y: 2.05, w: 0.28, h: 0.52, flipH: true, line: { color: 'D7EAE6', width: 2, endArrowType: 'triangle' } });
      note(s, n); return s;
    },
    chapter({ nr: k, title: t, sub, notes: n }) {
      const s = add('V_DUNKEL');
      s.addShape(pres.shapes.OVAL, { x: 1.0, y: 2.35, w: 1.7, h: 1.7, fill: { color: H.ocker }, line: { color: H.ocker } });
      tb(s, String(k), { x: 1.0, y: 2.35, w: 1.7, h: 1.7, align: 'center', valign: 'middle', fontSize: 54, bold: true, fontFace: 'Cambria', color: H.white });
      tb(s, 'Kapitel', { x: 3.1, y: 2.3, w: 6, h: 0.45, fontSize: 18, bold: true, color: 'F3D9B5' });
      tb(s, t, { x: 3.1, y: 2.75, w: 6.2, h: 1.4, fontSize: 40, bold: true, fontFace: 'Cambria', color: H.white, valign: 'top' });
      if (sub) tb(s, rich(sub, { fontSize: 22, color: 'D7EAE6' }), { x: 3.1, y: 4.2, w: 6.2, h: 1.0 });
      note(s, n); return s;
    },
    /** Hauptfolie: img und/oder items im Hauptbereich, optional rail; wide = Bild über volle Breite (nur bis y 4,75) */
    main({ title: t, img, items, size = 24, caption, sigma, rail: r, wide, imgBox, notes: n, master = 'V_INHALT', below }) {
      const s = add(master); s.addText(supT(t), { placeholder: 'title' });
      let y = MAIN.y;
      if (sigma) { tb(s, rich(sigma, { fontSize: 19, color: H.muted }), { x: MAIN.x, y, w: MAIN.w, h: 0.4 }); y += 0.45; }
      const bottom = MAIN.y + MAIN.h - (caption ? 0.5 : 0) - (below ? (below.h || 1.3) + 0.15 : 0);
      if (img && items) {
        const box = imgBox || { x: MAIN.x, y, w: MAIN.w, h: 2.9 };
        const f = image(s, img, box);
        tb(s, bullets(items, size), { x: MAIN.x, y: box.y + Math.max(f.h, box.h) + 0.2, w: MAIN.w, h: bottom - box.y - box.h - 0.2 });
      } else if (img) {
        const box = imgBox || (wide ? { x: M, y, w: W - 2 * M, h: 4.7 - y } : { x: MAIN.x, y, w: MAIN.w, h: bottom - y });
        image(s, img, box);
      } else if (items) tb(s, bullets(items, size), { x: MAIN.x, y: y + 0.05, w: MAIN.w, h: bottom - y });
      if (caption) tb(s, rich(caption, { fontSize: 19, color: H.muted, italic: true }), { x: MAIN.x, y: MAIN.y + MAIN.h - 0.45, w: MAIN.w, h: 0.42, align: 'center' });
      if (below) {
        const bh = below.h || 1.3, by = MAIN.y + MAIN.h - bh - (caption ? 0.5 : 0);
        card(s, MAIN.x, by, MAIN.w, bh, below.tone === 'ocker' ? H.ockerTint : H.tealTint2, below.tone === 'ocker' ? H.ocker : H.tealTint);
        tb(s, lines(below.lines, below.size || 21, H.ink, 4), { x: MAIN.x + 0.25, y: by + 0.1, w: MAIN.w - 0.5, h: bh - 0.2, valign: 'middle' });
      }
      rail(s, r);
      note(s, n); return s;
    },
    /** Zwei Spalten im Hauptbereich */
    two({ title: t, left, right, rail: r, notes: n, size = 21, master = 'V_INHALT' }) {
      const s = add(master); s.addText(supT(t), { placeholder: 'title' });
      const cw = (MAIN.w - 0.35) / 2;
      [left, right].forEach((col, i) => {
        const x = MAIN.x + i * (cw + 0.35); let y = MAIN.y;
        if (col.head) { tb(s, rich(col.head, { fontSize: 22, bold: true, fontFace: 'Cambria', color: col.color || (i ? H.ocker : H.teal) }), { x, y, w: cw, h: 0.5 }); y += 0.6; }
        if (col.img) { const f = image(s, col.img, { x, y, w: cw, h: col.imgH || 2.6 }); y += (col.imgH || 2.6) + 0.15; }
        if (col.items) tb(s, bullets(col.items, size, H.ink, 6), { x, y, w: cw, h: MAIN.y + MAIN.h - y });
        if (col.lines) tb(s, lines(col.lines, size, H.ink, 6), { x, y, w: cw, h: MAIN.y + MAIN.h - y });
      });
      rail(s, r);
      note(s, n); return s;
    },
    table({ title: t, rows, colW, size = 19, rail: r, notes: n, after, y: y0, hl = [] }) {
      const s = add('V_INHALT'); s.addText(supT(t), { placeholder: 'title' });
      const data = rows.map((row, i) => row.map((c) => ({ text: rich(String(c), { fontSize: size, bold: i === 0, color: i === 0 ? H.white : H.ink }), options: { fill: { color: i === 0 ? H.teal : hl.includes(i) ? 'F6E7CF' : (i % 2 ? H.white : H.tealTint2) }, valign: 'middle', fontFace: 'Calibri' } })));
      const w = colW ? colW.reduce((a, b) => a + b, 0) : MAIN.w;
      s.addTable(data, { x: MAIN.x, y: y0 || MAIN.y, w, colW, border: { type: 'solid', pt: 0.75, color: H.line }, margin: 0.07, autoPage: false });
      if (after) tb(s, lines(after.lines, after.size || 20, H.ink, 4), { x: MAIN.x, y: after.y, w: MAIN.w, h: after.h || 0.9 });
      rail(s, r);
      note(s, n); return s;
    },
    pause({ title: t = 'Pausiere jetzt!', task, items, img, imgH = 2.4, notes: n }) {
      const s = add('V_AKZENT'); s.addText(supT(t), { placeholder: 'title' });
      s.addShape(pres.shapes.OVAL, { x: MAIN.x, y: MAIN.y + 0.05, w: 0.95, h: 0.95, fill: { color: H.ocker }, line: { color: H.ocker } });
      s.addImage({ data: icon('LuPause', 'FFFFFF'), x: MAIN.x + 0.2, y: MAIN.y + 0.25, w: 0.55, h: 0.55 });
      tb(s, rich(task, { fontSize: 25, bold: true, fontFace: 'Cambria', color: H.tealDark }), { x: MAIN.x + 1.2, y: MAIN.y, w: MAIN.w - 1.2, h: 1.1, valign: 'middle' });
      let y = MAIN.y + 1.35;
      if (img) { image(s, img, { x: MAIN.x, y, w: MAIN.w, h: imgH }); y += imgH + 0.2; }
      if (items) tb(s, bullets(items, 23), { x: MAIN.x + 0.1, y, w: MAIN.w - 0.1, h: MAIN.y + MAIN.h - y });
      rail(s, { head: 'So geht’s', tone: 'ocker', lines: ['Video anhalten,', 'auf Papier lösen,', 'dann weiter: Die Auflösung kommt sofort.'], size: 19 });
      note(s, n); return s;
    },
    solution({ title: t = 'Auflösung', items, img, imgH = 2.6, rail: r, notes: n, size = 23 }) {
      const s = add('V_INHALT'); s.addText(supT(t), { placeholder: 'title' });
      let y = MAIN.y;
      if (img) { image(s, img, { x: MAIN.x, y, w: MAIN.w, h: imgH }); y += imgH + 0.2; }
      if (items) tb(s, bullets(items, size), { x: MAIN.x, y, w: MAIN.w, h: MAIN.y + MAIN.h - y });
      rail(s, r);
      note(s, n); return s;
    },
    live({ title: t = 'Live im AutomatenLab', route, todo, notes: n }) {
      const s = add('V_AKZENT'); s.addText(supT(t), { placeholder: 'title' });
      card(s, MAIN.x, MAIN.y, 3.4, 4.6, H.white, H.teal);
      s.addImage({ data: qrData(route), x: MAIN.x + 0.35, y: MAIN.y + 0.35, w: 2.7, h: 2.7 });
      tb(s, [{ text: 'AutomatenLab', options: { fontSize: 15, bold: true, color: H.ocker, breakLine: true } }, { text: appName(route), options: { fontSize: 20, bold: true, color: H.tealDark, fontFace: 'Cambria' } }], { x: MAIN.x + 0.15, y: MAIN.y + 3.2, w: 3.1, h: 1.2, align: 'center' });
      tb(s, [{ text: 'Wir machen gleich:', options: { fontSize: 20, bold: true, color: H.teal, breakLine: true } }, ...bullets(todo, 22)], { x: MAIN.x + 3.8, y: MAIN.y, w: MAIN.w - 3.8, h: 4.6 });
      tb(s, HOST + '/' + route, { x: MAIN.x, y: MAIN.y + 4.8, w: MAIN.w, h: 0.4, fontSize: 16, fontFace: 'Consolas', color: H.tealDark });
      note(s, n); return s;
    },
    /** Antwort A vs. B (V9) */
    compare({ title: t, task, A, B, reveal, notes: n }) {
      const s = add('V_INHALT'); s.addText(supT(t), { placeholder: 'title' });
      tb(s, rich(task, { fontSize: 21, italic: true, color: H.tealDark }), { x: MAIN.x, y: MAIN.y, w: MAIN.w, h: 0.8 });
      const cw = (MAIN.w - 0.3) / 2, y = MAIN.y + 0.95, h = 4.5;
      [[A, 'A'], [B, 'B']].forEach(([txt, lab], i) => {
        const win = reveal === lab, lose = reveal && !win;
        const x = MAIN.x + i * (cw + 0.3);
        card(s, x, y, cw, h, win ? 'EAF4EA' : lose ? 'F7F7F7' : H.tealTint2, win ? '2E7D32' : lose ? H.line : H.tealTint);
        s.addShape(pres.shapes.OVAL, { x: x + 0.2, y: y + 0.2, w: 0.6, h: 0.6, fill: { color: win ? '2E7D32' : lose ? '9AA5A9' : (i ? H.ocker : H.teal) }, line: { color: H.white } });
        tb(s, lab, { x: x + 0.2, y: y + 0.2, w: 0.6, h: 0.6, align: 'center', valign: 'middle', fontSize: 22, bold: true, color: H.white });
        if (reveal) tb(s, win ? 'volle Punkte' : 'Punktabzug', { x: x + 0.95, y: y + 0.27, w: cw - 1.1, h: 0.45, fontSize: 17, bold: true, color: win ? '2E7D32' : H.red });
        tb(s, rich(txt, { fontSize: 20, color: lose ? H.muted : H.ink }), { x: x + 0.25, y: y + 1.0, w: cw - 0.5, h: h - 1.15 });
      });
      note(s, n); return s;
    },
    end({ items, route, routeText, merkblatt, next, notes: n }) {
      const s = add('V_TITEL');
      tb(s, 'Das nimmst du mit', { x: M + 0.1, y: 0.55, w: 8.6, h: 0.8, fontSize: 36, bold: true, fontFace: 'Cambria', color: H.white });
      tb(s, bullets(items, 22, H.white, 8), { x: M + 0.1, y: 1.5, w: 8.5, h: 2.75 });
      // zwei Karten unten links: hier können YouTube-Endscreen-Elemente liegen
      const cw = 4.1, y = 4.55, h = 2.4;
      [[`Als Nächstes`, next || ''], ['Zum Nachlesen', merkblatt || '']].forEach(([head, txt], i) => {
        const x = M + 0.1 + i * (cw + 0.3);
        s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: cw, h, fill: { color: H.tealDark }, line: { color: '3E8E7E', width: 1 }, rectRadius: 0.12 });
        tb(s, [{ text: head, options: { fontSize: 15, bold: true, color: 'F3D9B5', breakLine: true } }, ...rich(txt, { fontSize: 21, color: H.white, fontFace: 'Cambria' })], { x: x + 0.25, y: y + 0.2, w: cw - 0.5, h: h - 0.4 });
      });
      // Weiter üben (über der Kamera)
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: RAIL.x, y: 0.55, w: RAIL.w, h: 4.15, fill: { color: H.white }, line: { color: H.white }, rectRadius: 0.12 });
      tb(s, 'WEITER ÜBEN', { x: RAIL.x, y: 0.7, w: RAIL.w, h: 0.35, align: 'center', fontSize: 14, bold: true, color: H.ocker, charSpacing: 1 });
      s.addImage({ data: qrData(route), x: RAIL.x + 0.6, y: 1.1, w: 2.3, h: 2.3 });
      tb(s, [{ text: appName(route), options: { fontSize: 18, bold: true, color: H.tealDark, fontFace: 'Cambria', breakLine: true } }, { text: routeText || '', options: { fontSize: 15, color: H.muted } }], { x: RAIL.x + 0.15, y: 3.5, w: RAIL.w - 0.3, h: 1.1, align: 'center' });
      note(s, n); return s;
    },
    blank({ title: t, notes: n, master = 'V_INHALT' }) { const s = add(master); if (t) s.addText(supT(t), { placeholder: 'title' }); note(s, n); return s; },
    async save(file) {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      await pres.writeFile({ fileName: file });
      await fixParagraphProps(file);
      await applyTheme(file, THEME);
      return file;
    },
  };
  return api;
}

async function fixParagraphProps(file) {
  const JSZip = require('jszip');
  const zip = await JSZip.loadAsync(fs.readFileSync(file));
  for (const name of Object.keys(zip.files).filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))) {
    let xml = await zip.file(name).async('string');
    xml = xml.replace(/<a:p>([\s\S]*?)<\/a:p>/g, (m, inner) => {
      let first = true;
      const fixed = inner.replace(/<a:pPr\b[^>]*?(?:\/>|>[\s\S]*?<\/a:pPr>)/g, (pp) => { if (first) { first = false; return pp; } return ''; });
      return '<a:p>' + fixed + '</a:p>';
    });
    zip.file(name, xml);
  }
  fs.writeFileSync(file, await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }));
}

module.exports = { video, qrData, CAM, MAIN, RAIL, W, HT, HOST, BASE_URL, preview: S.preview, contactSheet: S.contactSheet, H };
