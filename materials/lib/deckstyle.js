const __MAT = require('path').resolve(__dirname, '..'); // Wurzel: materials/
/* deckstyle.js – Designsystem für alle PowerPoint-Folien der Einheit „Maschinen, die Sprache verstehen“.
 * Farben/Schriften der Schulvorlage: Teal #0E6455, Ocker #B26A0F, Cambria (Überschriften) + Calibri (Text).
 * Format: 16:9 (LAYOUT_WIDE, 13,33" × 7,5"). Mindestschrift 18 pt für Fließtext auf Folien.
 *
 * Nutzung:
 *   const S = require((__MAT + '/lib/deckstyle.js'));
 *   const d = S.deck({ ds: 1, title: 'Ein Automat hört zu' });
 *   d.title({ title, subtitle, kernfrage, notes });
 *   d.section({ phase: 'Einstieg', title: 'Das Zahlenschloss', notes });
 *   d.question({ text: 'Wie weiß das Schloss …?', sub: '…', notes });
 *   d.bullets({ title, items: ['…', '**fett** …'], notes, img, imgW });
 *   d.image({ title, img, caption, notes });
 *   d.cards({ title, cards: [{ head, text, icon: 'LuCpu' }], notes });
 *   d.twoCol({ title, left: { head, items | img }, right: { head, items | img }, notes });
 *   d.task({ title, steps: [...], zeit: '15 min', sozialform: 'Partnerarbeit', material: 'AB01, Aufgabe 1–3', app: '#/arena', notes });
 *   d.merke({ title, items: [...], notes });
 *   d.table({ title, rows: [[...]], colW: [...], notes });
 *   d.app({ title, route, text, notes });
 *   d.end({ title, items, notes });
 *   await d.save((__MAT + '/out/DS01_Folien_….pptx'));
 */
const pptxgen = require('pptxgenjs');
const fs = require('fs');
const path = require('path');
const NIV = require('./niveau.js');
const { execFileSync } = require('child_process');
const { applyTheme, soffice } = require('./pptx-theme.js');

const THEME = {
  name: 'Automaten LK', headFontFace: 'Cambria', bodyFontFace: 'Calibri',
  colors: { dk1: '1F2A2E', lt1: 'FFFFFF', dk2: '0E6455', lt2: 'E4F0EE', accent1: '0E6455', accent2: 'B26A0F', accent3: '3E8E7E', accent4: 'D9A45B', accent5: '5B6770', accent6: 'A83232', hlink: '0E6455', folHlink: '0A4A3F' },
};
const H = { teal: '0E6455', tealDark: '0A4A3F', tealTint: 'E4F0EE', tealTint2: 'F1F7F6', ocker: 'B26A0F', ockerTint: 'F8ECDB', ink: '1F2A2E', muted: '5B6770', line: 'C9D3D6', white: 'FFFFFF', red: 'A83232' };
const W = 13.333, HT = 7.5, M = 0.6;
const BASE_URL = process.env.AUTOMATENLAB_URL || '';
const WELT = (ds) => (ds <= 6 ? 'A' : ds <= 10 ? 'B' : ds <= 14 ? 'C' : 'D');
const WELT_NAME = { A: 'Endliche Automaten', B: 'Grenzen & Keller', C: 'Formale Sprachen', D: 'Sprachdesign & Ausblick' };
const PHASE = { Einstieg: 'LuSparkles', Erarbeitung: 'LuLightbulb', 'Übung': 'LuPencilLine', Sicherung: 'LuBookmarkCheck', Ausblick: 'LuTelescope', Werkstatt: 'LuWrench', Projekt: 'LuRocket', Abschluss: 'LuFlag' };

// ------------------------------------------------------------------------- Icons (react-icons → PNG)
const iconCache = {};
function icon(name, color = H.teal, size = 256) {
  const key = name + color;
  if (iconCache[key]) return iconCache[key];
  const React = require('react'); const RDS = require('react-dom/server');
  const lib = name.startsWith('Lu') ? require('react-icons/lu') : require('react-icons/fa6');
  const Comp = lib[name] || require('react-icons/lu').LuCircle;
  const svg = RDS.renderToStaticMarkup(React.createElement(Comp, { color: '#' + color, size }));
  const tmp = path.join(require('os').tmpdir(), `ic_${name}_${color}.png`);
  execFileSync('node', ['-e', `require('sharp')(Buffer.from(process.argv[1])).png().toFile(process.argv[2]).then(()=>{})`, svg, tmp]);
  iconCache[key] = 'image/png;base64,' + fs.readFileSync(tmp).toString('base64');
  return iconCache[key];
}

// ------------------------------------------------------------------------- Inline-Markup → TextProps
function rich(text, base = {}) {
  const out = []; const re = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g; let last = 0, m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push({ text: text.slice(last, m.index), options: { ...base } });
    const t = m[0];
    if (t.startsWith('**')) out.push({ text: t.slice(2, -2), options: { ...base, bold: true } });
    else if (t.startsWith('`')) out.push({ text: t.slice(1, -1), options: { ...base, fontFace: 'Consolas', color: H.tealDark } });
    else out.push({ text: t.slice(1, -1), options: { ...base, italic: true } });
    last = m.index + t.length;
  }
  if (last < text.length) out.push({ text: text.slice(last), options: { ...base } });
  return out;
}
function bulletRuns(items, size = 20, color = H.ink) {
  const out = [];
  items.forEach((it, i) => {
    const sub = typeof it === 'string' && it.startsWith('  ');
    const txt = typeof it === 'string' ? it.trim() : it.text;
    const r = rich(txt, { fontSize: sub ? size - 2 : size, color: sub ? H.muted : color });
    r[0].options = { ...r[0].options, bullet: sub ? { indent: 18 } : { code: '25AA', indent: 20 }, indentLevel: sub ? 1 : 0, paraSpaceAfter: 8 };
    r[r.length - 1].options = { ...r[r.length - 1].options, breakLine: i < items.length - 1 };
    out.push(...r);
  });
  return out;
}
function imgSize(file) {
  const b = fs.readFileSync(file); return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}
function fit(file, maxW, maxH) {
  const { w, h } = imgSize(file); let iw = maxW, ih = maxW * h / w;
  if (ih > maxH) { ih = maxH; iw = maxH * w / h; }
  return { w: iw, h: ih };
}

// ------------------------------------------------------------------------- Deck
function deck({ ds, title, niveau }) {
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_WIDE';
  pres.theme = { headFontFace: 'Cambria', bodyFontFace: 'Calibri' };
  pres.author = 'Frank Juchim'; pres.company = 'Max-Planck-Gymnasium Delmenhorst'; pres.title = title;
  const C = pres.SchemeColor;
  const welt = ds ? WELT(ds) : null;
  const niv = NIV.niveauVon({ ds, niveau });
  const footerText = ds ? `Level ${ds} · Welt ${welt} · ${WELT_NAME[welt]} · ${NIV.NIVEAU_TEXT[niv]}` : `${NIV.NIVEAU_KURS[niv]} · Automaten & formale Sprachen`;

  // Layouts
  pres.defineSlideMaster({ title: 'TITEL', background: { color: H.teal }, objects: [
    { placeholder: { options: { name: 'title', type: 'title', x: M + 0.1, y: 2.2, w: 9.6, h: 1.8, fontFace: 'Cambria', fontSize: 48, bold: true, color: C.background1, valign: 'bottom', align: 'left', margin: 0 }, text: '' } },
  ] });
  pres.defineSlideMaster({ title: 'ABSCHNITT', background: { color: H.tealDark }, objects: [
    { placeholder: { options: { name: 'title', type: 'title', x: 3.3, y: 2.6, w: 9.2, h: 1.4, fontFace: 'Cambria', fontSize: 44, bold: true, color: C.background1, valign: 'middle', align: 'left', margin: 0 }, text: '' } },
  ] });
  pres.defineSlideMaster({ title: 'INHALT', background: { color: H.white }, objects: [
    { placeholder: { options: { name: 'title', type: 'title', x: M, y: 0.35, w: W - 2 * M, h: 0.95, fontFace: 'Cambria', fontSize: 32, bold: true, color: C.accent1, valign: 'middle', align: 'left', margin: 0 }, text: '' } },
    { text: { text: footerText, options: { x: M, y: HT - 0.42, w: 8, h: 0.3, fontSize: 11, color: H.muted, fontFace: 'Calibri', margin: 0 } } },
  ], slideNumber: { x: W - M - 0.6, y: HT - 0.42, w: 0.6, h: 0.3, fontSize: 11, color: H.muted, align: 'right' } });
  pres.defineSlideMaster({ title: 'AUFTRAG', background: { color: H.tealTint2 }, objects: [
    { placeholder: { options: { name: 'title', type: 'title', x: M, y: 0.35, w: W - 2 * M, h: 0.95, fontFace: 'Cambria', fontSize: 32, bold: true, color: C.accent1, valign: 'middle', align: 'left', margin: 0 }, text: '' } },
    { text: { text: footerText, options: { x: M, y: HT - 0.42, w: 8, h: 0.3, fontSize: 11, color: H.muted, fontFace: 'Calibri', margin: 0 } } },
  ], slideNumber: { x: W - M - 0.6, y: HT - 0.42, w: 0.6, h: 0.3, fontSize: 11, color: H.muted, align: 'right' } });

  let section = null;
  // Folien nur für Lehrkräfte (Lösungen): fehlen im Schüler-Handout (scripts/export_pdf.py). Erkannt am Titel
  // („Auflösung …“, „Lösung …“, „Ergebnis: …“, „Ein mögliches …“) oder am Vermerk [NUR LEHRKRAFT] in den Notizen.
  let anzahl = 0;
  const nurLehrkraft = new Set();
  const LK_TITEL = /^(Auflösung|Lösung|Musterlösung|Ergebnis:|Ein mögliches)/;
  const add = (master, sec) => {
    if (sec && sec !== section) { pres.addSection({ title: sec }); section = sec; }
    const s = pres.addSlide({ masterName: master, sectionTitle: section || undefined });
    const nr = ++anzahl;
    const addText = s.addText.bind(s);
    s.addText = (c, o) => { if (o && o.placeholder === 'title' && typeof c === 'string' && LK_TITEL.test(c)) nurLehrkraft.add(nr); return addText(c, o); };
    const addNotes = s.addNotes.bind(s);
    s.addNotes = (n) => { if (typeof n === 'string' && n.includes('[NUR LEHRKRAFT]')) nurLehrkraft.add(nr); return addNotes(n); };
    return s;
  };
  const notes = (s, n) => { if (n) s.addNotes(n); };
  const tb = (s, content, o) => s.addText(content, { isTextBox: true, fontFace: 'Calibri', color: H.ink, valign: 'top', margin: 0, ...o });

  const api = {
    pres, icon, H,
    title({ title: t, subtitle, kernfrage, notes: n }) {
      const s = add('TITEL', 'Start');
      tb(s, `${NIV.NIVEAU_KURS[niv]}  ·  Level ${ds}  ·  Welt ${welt}: ${WELT_NAME[welt]}`, { x: M + 0.1, y: 1.35, w: 10, h: 0.4, fontSize: 16, color: 'F3D9B5', bold: true });
      s.addText(t, { placeholder: 'title' });
      if (subtitle) tb(s, subtitle, { x: M + 0.1, y: 4.15, w: 9.6, h: 0.6, fontSize: 22, color: 'D7EAE6' });
      if (kernfrage) {
        s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: M + 0.1, y: 5.15, w: 9.8, h: 1.25, fill: { color: H.tealDark }, line: { color: H.tealDark }, rectRadius: 0.12 });
        tb(s, [{ text: 'Kernfrage', options: { fontSize: 14, bold: true, color: 'F3D9B5', breakLine: true } }, { text: kernfrage, options: { fontSize: 20, italic: true, color: H.white, fontFace: 'Cambria' } }], { x: M + 0.35, y: 5.28, w: 9.4, h: 1.05, valign: 'middle' });
      }
      // Automaten-Motiv rechts: Zustandskette
      const cx = 11.0;
      [[cx, 1.4], [cx + 0.9, 3.0], [cx, 4.6]].forEach(([x, y], i) => {
        s.addShape(pres.shapes.OVAL, { x, y, w: 1.1, h: 1.1, fill: { color: H.teal }, line: { color: i === 2 ? 'F3D9B5' : 'D7EAE6', width: 2.5 } });
        if (i === 2) s.addShape(pres.shapes.OVAL, { x: x + 0.1, y: y + 0.1, w: 0.9, h: 0.9, fill: { color: H.teal }, line: { color: 'F3D9B5', width: 1.5 } });
        tb(s, `S${i}`, { x, y, w: 1.1, h: 1.1, align: 'center', valign: 'middle', fontSize: 20, bold: true, color: H.white, fontFace: 'Cambria' });
      });
      s.addShape(pres.shapes.LINE, { x: cx + 0.85, y: 2.4, w: 0.45, h: 0.62, line: { color: 'D7EAE6', width: 2, endArrowType: 'triangle' } });
      s.addShape(pres.shapes.LINE, { x: cx + 0.85, y: 4.0, w: 0.45, h: 0.62, flipH: true, line: { color: 'D7EAE6', width: 2, endArrowType: 'triangle' } });
      notes(s, n);
      return s;
    },
    section({ phase = 'Erarbeitung', title: t, nr, notes: n }) {
      const s = add('ABSCHNITT', phase);
      s.addShape(pres.shapes.OVAL, { x: 1.05, y: 2.35, w: 1.9, h: 1.9, fill: { color: H.ocker }, line: { color: H.ocker } });
      s.addImage({ data: icon(PHASE[phase] || 'LuSparkles', 'FFFFFF'), x: 1.5, y: 2.8, w: 1.0, h: 1.0 });
      tb(s, phase, { x: 3.3, y: 1.95, w: 9, h: 0.55, fontSize: 20, bold: true, color: 'F3D9B5' });
      s.addText(t, { placeholder: 'title' });
      notes(s, n);
      return s;
    },
    question({ text, sub, phase, notes: n, img, imgH = 3.0 }) {
      const s = add('INHALT', phase);
      s.addImage({ data: icon('LuMessageCircleQuestion', H.ocker), x: M, y: 0.6, w: 0.9, h: 0.9 });
      tb(s, text, { x: M, y: 1.75, w: W - 2 * M, h: img ? 1.7 : 2.6, fontSize: 36, bold: true, fontFace: 'Cambria', color: H.tealDark, valign: img ? 'top' : 'middle' });
      if (sub) tb(s, rich(sub, { fontSize: 22, color: H.muted }), { x: M, y: img ? 3.35 : 4.5, w: W - 2 * M, h: 0.9 });
      if (img) { const f = fit(img, W - 2 * M, imgH); s.addImage({ path: img, x: (W - f.w) / 2, y: 6.95 - f.h - 0.1 - (sub ? 0 : 0), w: f.w, h: f.h }); }
      notes(s, n); return s;
    },
    bullets({ title: t, items, img, imgW = 5.6, phase, notes: n, size = 24 }) {
      const s = add('INHALT', phase); s.addText(t, { placeholder: 'title' });
      const textW = img ? W - 2 * M - imgW - 0.4 : W - 2 * M;
      tb(s, bulletRuns(items, size), { x: M, y: 1.55, w: textW, h: 5.2 });
      if (img) { const f = fit(img, imgW, 5.2); s.addImage({ path: img, x: W - M - f.w, y: 1.55 + (5.2 - f.h) / 2, w: f.w, h: f.h }); }
      notes(s, n); return s;
    },
    image({ title: t, img, caption, phase, notes: n, maxH = 4.9, sigma }) {
      const s = add('INHALT', phase); s.addText(t, { placeholder: 'title' });
      const top = sigma ? 1.95 : 1.6;
      if (sigma) tb(s, sigma, { x: M, y: 1.4, w: W - 2 * M, h: 0.45, fontSize: 18, color: H.muted });
      const f = fit(img, W - 2 * M, maxH - (sigma ? 0.35 : 0));
      s.addImage({ path: img, x: (W - f.w) / 2, y: top + (maxH - (sigma ? 0.35 : 0) - f.h) / 2, w: f.w, h: f.h });
      if (caption) tb(s, rich(caption, { fontSize: 18, color: H.muted, italic: true }), { x: M, y: 6.55, w: W - 2 * M, h: 0.4, align: 'center' });
      notes(s, n); return s;
    },
    cards({ title: t, cards, phase, notes: n, size = 20, h }) {
      const s = add('INHALT', phase); s.addText(t, { placeholder: 'title' });
      const k = cards.length, gap = 0.3, cw = (W - 2 * M - gap * (k - 1)) / k;
      const maxLen = Math.max(...cards.map((c) => (Array.isArray(c.text) ? c.text.join(' ') : c.text || '').length));
      const anyIcon = cards.some((c) => c.icon), anyImg = cards.some((c) => c.img);
      const ch = h || Math.min(4.9, (anyIcon ? 1.3 : 0.3) + 0.8 + Math.ceil(maxLen * size / 18 / (cw * 6.5)) * 0.42 + 0.5 + (anyImg ? 2.2 : 0));
      cards.forEach((c, i) => {
        const x = M + i * (cw + gap), y = 1.6;
        s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: cw, h: ch, fill: { color: H.tealTint2 }, line: { color: H.tealTint }, rectRadius: 0.1 });
        if (c.icon) { s.addShape(pres.shapes.OVAL, { x: x + 0.3, y: y + 0.3, w: 0.8, h: 0.8, fill: { color: i % 2 ? H.ocker : H.teal }, line: { color: i % 2 ? H.ocker : H.teal } }); s.addImage({ data: icon(c.icon, 'FFFFFF'), x: x + 0.45, y: y + 0.45, w: 0.5, h: 0.5 }); }
        const ty = c.icon ? y + 1.3 : y + 0.3;
        tb(s, c.head, { x: x + 0.3, y: ty, w: cw - 0.6, h: 0.75, fontSize: 21, bold: true, fontFace: 'Cambria', color: H.tealDark, valign: 'top' });
        tb(s, Array.isArray(c.text) ? bulletRuns(c.text, size) : rich(c.text, { fontSize: size }), { x: x + 0.3, y: ty + 0.8, w: cw - 0.6, h: ch - (ty - y) - 1.0 });
        if (c.img) { const f = fit(c.img, cw - 0.6, 2.0); s.addImage({ path: c.img, x: x + (cw - f.w) / 2, y: y + ch - f.h - 0.25, w: f.w, h: f.h }); }
      });
      notes(s, n); return s;
    },
    twoCol({ title: t, left, right, phase, notes: n, size = 20 }) {
      const s = add('INHALT', phase); s.addText(t, { placeholder: 'title' });
      const cw = (W - 2 * M - 0.5) / 2;
      [left, right].forEach((col, i) => {
        const x = M + i * (cw + 0.5); let y = 1.6;
        if (col.head) { tb(s, col.head, { x, y, w: cw, h: 0.55, fontSize: 22, bold: true, color: i ? H.ocker : H.teal, fontFace: 'Cambria' }); y += 0.65; }
        if (col.items) { tb(s, bulletRuns(col.items, size), { x, y, w: cw, h: col.img ? 2.2 : 5.0 - (y - 1.6) }); if (col.img) y += 2.3; }
        if (col.img) { const f = fit(col.img, cw, 6.8 - y); s.addImage({ path: col.img, x: x + (cw - f.w) / 2, y, w: f.w, h: f.h }); }
      });
      notes(s, n); return s;
    },
    task({ title: t, steps, zeit, sozialform, material, app, phase = 'Übung', notes: n }) {
      const s = add('AUFTRAG', phase); s.addText(t, { placeholder: 'title' });
      const chips = [[zeit, 'LuClock'], [sozialform, 'LuUsers'], [material, 'LuFileText']].filter((c) => c[0]);
      let cx = M;
      chips.forEach(([txt, ic]) => {
        const w = Math.min(4.2, 0.75 + txt.length * 0.115);
        s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: cx, y: 1.45, w, h: 0.55, fill: { color: H.white }, line: { color: H.line }, rectRadius: 0.27 });
        s.addImage({ data: icon(ic, H.ocker), x: cx + 0.17, y: 1.57, w: 0.3, h: 0.3 });
        tb(s, txt, { x: cx + 0.55, y: 1.45, w: w - 0.65, h: 0.55, fontSize: 16, color: H.ink, valign: 'middle' });
        cx += w + 0.25;
      });
      const listW = app ? W - 2 * M - 3.4 : W - 2 * M;
      const r = [];
      steps.forEach((st, i) => {
        const rr = rich(st, { fontSize: 22, color: H.ink });
        rr[0].options = { ...rr[0].options, bullet: { type: 'number', style: 'arabicPeriod' }, indentLevel: 0, paraSpaceAfter: 10 };
        rr[rr.length - 1].options = { ...rr[rr.length - 1].options, breakLine: i < steps.length - 1 };
        r.push(...rr);
      });
      tb(s, r, { x: M, y: 2.35, w: listW, h: 4.4 });
      if (app) {
        const x = W - M - 3.1;
        s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 2.35, w: 3.1, h: 3.9, fill: { color: H.white }, line: { color: H.teal, width: 1.5, dashType: 'dash' }, rectRadius: 0.12 });
        s.addImage({ data: qrData(app) || icon('LuQrCode', H.teal), x: x + 0.55, y: 2.6, w: 2.0, h: 2.0 });
        tb(s, [{ text: 'AutomatenLab', options: { bold: true, color: H.ocker, fontSize: 15, breakLine: true } }, { text: appName(app), options: { fontSize: 16, color: H.tealDark, bold: true } }], { x: x + 0.15, y: 4.8, w: 2.8, h: 1.2, align: 'center' });
      }
      notes(s, n); return s;
    },
    merke({ title: t = 'Merke', items, phase = 'Sicherung', notes: n, img, imgW = 5 }) {
      const s = add('INHALT', phase); s.addText(t, { placeholder: 'title' });
      const w = img ? W - 2 * M - imgW - 0.4 : W - 2 * M;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: M, y: 1.55, w, h: 5.15, fill: { color: H.ockerTint }, line: { color: H.ocker, width: 1.5 }, rectRadius: 0.1 });
      s.addImage({ data: icon('LuBookmarkCheck', H.ocker), x: M + 0.3, y: 1.8, w: 0.55, h: 0.55 });
      tb(s, bulletRuns(items, 22), { x: M + 1.1, y: 1.8, w: w - 1.4, h: 4.7 });
      if (img) { const f = fit(img, imgW, 5.1); s.addImage({ path: img, x: W - M - f.w, y: 1.55 + (5.15 - f.h) / 2, w: f.w, h: f.h }); }
      notes(s, n); return s;
    },
    table({ title: t, rows, colW, phase, notes: n, size = 18 }) {
      const s = add('INHALT', phase); s.addText(t, { placeholder: 'title' });
      const data = rows.map((r, i) => r.map((c) => ({ text: String(c), options: { fontSize: size, bold: i === 0, color: i === 0 ? H.white : H.ink, fill: { color: i === 0 ? H.teal : (i % 2 ? H.white : H.tealTint2) }, fontFace: 'Calibri', valign: 'middle' } })));
      s.addTable(data, { x: M, y: 1.6, w: W - 2 * M, colW, border: { type: 'solid', pt: 0.75, color: H.line }, margin: 0.08, autoPage: false });
      notes(s, n); return s;
    },
    app({ title: t, route, text, phase = 'Übung', notes: n }) {
      const s = add('AUFTRAG', phase); s.addText(t, { placeholder: 'title' });
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: M, y: 1.7, w: 4.2, h: 4.6, fill: { color: H.white }, line: { color: H.teal, width: 1.5, dashType: 'dash' }, rectRadius: 0.15 });
      s.addImage({ data: qrData(route) || icon('LuQrCode', H.teal), x: M + 0.6, y: 2.0, w: 3.0, h: 3.0 });
      tb(s, BASE_URL ? '' : 'QR-Code folgt', { x: M, y: 5.25, w: 4.2, h: 0.4, align: 'center', fontSize: 14, color: H.muted });
      tb(s, [{ text: 'AutomatenLab', options: { fontSize: 18, bold: true, color: H.ocker, breakLine: true } }, { text: appName(route), options: { fontSize: 34, bold: true, fontFace: 'Cambria', color: H.tealDark, breakLine: true } }, { text: ' ', options: { fontSize: 12, breakLine: true } }, ...rich(text || '', { fontSize: 22 })], { x: M + 4.7, y: 1.9, w: W - 2 * M - 4.7, h: 3.8 });
      tb(s, (BASE_URL || '[AutomatenLab-Adresse]/') + route, { x: M + 4.7, y: 5.8, w: 7, h: 0.4, fontSize: 14, color: H.muted, fontFace: 'Consolas' });
      notes(s, n); return s;
    },
    end({ title: t = 'Zum Mitnehmen', items, hausaufgabe, notes: n }) {
      const s = add('TITEL', 'Abschluss');
      tb(s, t, { x: M + 0.1, y: 0.8, w: 11, h: 0.9, fontSize: 40, bold: true, fontFace: 'Cambria', color: H.white });
      tb(s, bulletRuns(items, 22, H.white), { x: M + 0.1, y: 1.9, w: 11.5, h: 3.3 });
      if (hausaufgabe) {
        s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: M + 0.1, y: 5.3, w: W - 2 * M - 0.2, h: 1.4, fill: { color: H.tealDark }, line: { color: H.tealDark }, rectRadius: 0.12 });
        tb(s, [{ text: 'Hausaufgabe', options: { fontSize: 15, bold: true, color: 'F3D9B5', breakLine: true } }, ...rich(hausaufgabe, { fontSize: 19, color: H.white })], { x: M + 0.4, y: 5.42, w: W - 2 * M - 0.8, h: 1.2, valign: 'middle' });
      }
      notes(s, n); return s;
    },
    /** Freie Folie (INHALT-Layout) für Sonderfälle; gibt Slide zurück. */
    blank({ title: t, phase, notes: n, master = 'INHALT' }) { const s = add(master, phase); if (t) s.addText(t, { placeholder: 'title' }); notes(s, n); return s; },
    tb, rich, bulletRuns, fit,
    async save(file) {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      await pres.writeFile({ fileName: file });
      await fixParagraphProps(file);
      await applyTheme(file, THEME);
      // Begleitdatei für den PDF-Export: Foliennummern, die im Schüler-Handout fehlen
      fs.writeFileSync(file.replace(/\.pptx$/, '.folien.json'), JSON.stringify({ folien: anzahl, nurLehrkraft: [...nurLehrkraft].sort((a, b) => a - b) }) + '\n');
      return file;
    },
  };
  return api;
}

const APP_NAMES = { arena: 'Akzeptor-Arena', detektiv: 'Sprach-Detektiv', baukasten: 'Automaten-Baukasten', minimierer: 'Minimierer', mealy: 'Mealy-Maschine', ueberliste: 'Überliste den Automaten', parallelwelten: 'Parallelwelten', keller: 'Keller-Labor', rallye: 'Ableitungs-Rallye', grammatik: 'Grammatik-Tester', sortierer: 'Chomsky-Sortierer', turing: 'Turing-Labor', quiz: 'Level-Quiz' };
function appName(route) { const m = /#\/([a-z]+)/.exec(route || ''); return (m && APP_NAMES[m[1]]) || 'AutomatenLab'; }
function qrData(route) {
  if (!BASE_URL || !route) return null;
  const url = BASE_URL.replace(/\/?$/, '/') + route;
  const tmp = path.join(require('os').tmpdir(), 'qrd_' + Buffer.from(route).toString('hex').slice(0, 40) + '.png');
  execFileSync('python3', ['-c', `import segno; segno.make(${JSON.stringify(url)}, error='m').save(${JSON.stringify(tmp)}, scale=12, border=1, dark='#0A4A3F')`]);
  return 'image/png;base64,' + fs.readFileSync(tmp).toString('base64');
}

/** pptxgenjs schreibt bei mehreren Runs pro Absatz mehrere <a:pPr> – nur das erste behalten. */
async function fixParagraphProps(file) {
  const JSZip = require('jszip') ;
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

/** Folien → PNG (Vorschau). */
function preview(file, outDir) {
  outDir = outDir || path.join(path.dirname(file), '_preview');
  fs.mkdirSync(outDir, { recursive: true });
  execFileSync(require('./pptx-theme.js').soffice(), ['--headless', '--convert-to', 'pdf', '--outdir', outDir, file], { stdio: 'pipe' });
  const pdf = path.join(outDir, path.basename(file).replace(/\.pptx$/, '.pdf'));
  const prefix = path.join(outDir, path.basename(file).replace(/\.pptx$/, ''));
  execFileSync('pdftoppm', ['-jpeg', '-r', '55', pdf, prefix]);
  return fs.readdirSync(outDir).filter((f) => f.startsWith(path.basename(prefix)) && f.endsWith('.jpg')).map((f) => path.join(outDir, f)).sort();
}
/** Mehrere Vorschaubilder zu einem Kontaktbogen (Raster) zusammenfügen → ein JPG zum Ansehen. */
function contactSheet(images, out, cols = 3) {
  execFileSync('python3', ['-c', `
import sys
from PIL import Image
ims=[Image.open(p) for p in sys.argv[2:]]
w,h=ims[0].size; cols=${cols}; rows=(len(ims)+cols-1)//cols
sheet=Image.new('RGB',(cols*w+(cols+1)*10, rows*h+(rows+1)*10),'#888')
for i,im in enumerate(ims):
    sheet.paste(im.resize((w,h)),(10+(i%cols)*(w+10),10+(i//cols)*(h+10)))
sheet.save(sys.argv[1],quality=85)
`, out, ...images]);
  return out;
}

module.exports = { deck, preview, contactSheet, icon, H, THEME, appName };
