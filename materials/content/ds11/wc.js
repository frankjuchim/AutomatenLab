const __MAT = require('path').resolve(__dirname, '../..'); // Wurzel: materials/
// wc.js – gemeinsame Bausteine für Welt C (DS11–DS14): Grammatik-Kästen, Ableitungen, Grammatik-Folien.
const fs = require('fs');
const D = require((__MAT + '/lib/docstyle.js'));

const load = (ds) => JSON.parse(fs.readFileSync(`${__MAT}/build/img/ds${ds}/data.json`, 'utf8'));

/** Grammatik im Abi-Format als Kasten. lines: ['N = {…}', 'T = {…}', 'Startsymbol: S', 'Produktionsregeln:', 'S → …', …] */
function gram(lines, o = {}) {
  const kids = [];
  if (o.title) kids.push(D.p(`**${o.title}**`, { size: 21, after: 60, color: D.C.tealDark }));
  lines.forEach((l) => {
    const isRule = /→/.test(l);
    kids.push(D.p(l, { size: o.size || 21, after: 30, indent: isRule ? 280 : 0 }));
  });
  const out = [D.box(kids, { fill: 'F6F8F8', border: D.C.line, widthCm: o.widthCm, cantSplit: true })];
  if (o.caption) out.push(D.p(o.caption, { size: 18, color: D.C.muted, align: 'center', after: 140, before: 60 }));
  else out.push(D.spacer(120));
  return out;
}
/** Kopf einer Grammatik (N, T, Startsymbol) + Regeln. */
const abi = (N, T, S, rules) => [`N = {${N.join(', ')}}`, `T = {${T.join(', ')}}`, `Startsymbol: ${S}`, 'Produktionsregeln:', ...rules];

/** Ableitung: kurz → eine Zeile; lang (block) → jede Satzform in eigener Zeile. */
function deriv(steps, o = {}) {
  if (!o.block) return D.p(steps.join(' ⇒ '), { size: o.size || 21, after: o.after ?? 80, indent: o.indent });
  return steps.map((s, i) => D.p((i ? '⇒ ' : '     ') + s, { size: o.size || 20, after: 20, indent: o.indent ?? 360 }));
}

/** Folie mit Grammatik links und Bild/Stichpunkten rechts. */
function sGram(d, S, { title, phase, lines, caption, img, imgW = 5.4, items, notes, size = 20, leftW }) {
  const s = d.blank({ title, phase, notes });
  const M = 0.6, W = 13.333;
  const lw = leftW || (img || items ? 6.6 : W - 2 * M);
  const h = 0.42 * lines.length + 0.5;
  s.addShape(d.pres.shapes.ROUNDED_RECTANGLE, { x: M, y: 1.6, w: lw, h: Math.min(5.0, h), fill: { color: 'F1F7F6' }, line: { color: 'C9D3D6' }, rectRadius: 0.08 });
  const runs = [];
  lines.forEach((l, i) => runs.push({ text: l, options: { fontSize: size, color: '1F2A2E', breakLine: i < lines.length - 1, indentLevel: /→/.test(l) ? 1 : 0, paraSpaceAfter: 4 } }));
  d.tb(s, runs, { x: M + 0.25, y: 1.75, w: lw - 0.4, h: Math.min(4.8, h - 0.2) });
  if (caption) d.tb(s, d.rich(caption, { fontSize: 18, color: '5B6770', italic: true }), { x: M, y: Math.min(6.65, 1.7 + Math.min(5.0, h)), w: lw, h: 0.45 });
  const rx = M + lw + 0.4, rw = W - M - rx;
  if (img) { const f = d.fit(img, Math.min(imgW, rw), 5.1); s.addImage({ path: img, x: rx + (rw - f.w) / 2, y: 1.6 + (5.1 - f.h) / 2, w: f.w, h: f.h }); }
  if (items) d.tb(s, d.bulletRuns(items, 20), { x: rx, y: 1.6, w: rw, h: 5.1 });
  return s;
}

/** Kopiervorlage: Karten als Tabelle mit Schnittlinien. */
function cards(texts, o = {}) {
  const cols = o.cols || 3; const rows = [];
  for (let i = 0; i < texts.length; i += cols) {
    const r = texts.slice(i, i + cols); while (r.length < cols) r.push('');
    rows.push(r);
  }
  return D.table(rows, { header: false, allCenter: true, size: o.size || 30, rowHeightCm: o.h || 1.7 });
}

/** Zwei Spalten ohne Rahmen (z. B. Grammatik links, Zeichenfläche rechts). */
function side(left, right, leftCm, totalCm) {
  const { Table, TableRow, TableCell, WidthType, BorderStyle } = D;
  const N = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  const b = { top: N, bottom: N, left: N, right: N };
  const TW = totalCm ? D.cm(totalCm) : D.CONTENT_W;
  const lw = D.cm(leftCm), rw = TW - lw;
  const kids = (x) => [x].flat(Infinity);
  return new Table({ width: { size: TW, type: WidthType.DXA }, columnWidths: [lw, rw],
    borders: { ...b, insideHorizontal: N, insideVertical: N },
    rows: [new TableRow({ cantSplit: true, children: [
      new TableCell({ children: kids(left), width: { size: lw, type: WidthType.DXA }, borders: b, margins: { left: 0, right: 80, top: 0, bottom: 0 } }),
      new TableCell({ children: kids(right), width: { size: rw, type: WidthType.DXA }, borders: b, margins: { left: 80, right: 0, top: 0, bottom: 0 } }),
    ] })] });
}

module.exports = { side, load, gram, abi, deriv, sGram, cards };
