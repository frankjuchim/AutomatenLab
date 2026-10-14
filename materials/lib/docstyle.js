const __MAT = require('path').resolve(__dirname, '..'); // Wurzel: materials/
/* docstyle.js – Designsystem für alle Word-Materialien (Arbeitsblätter, Lehrkraft-Handreichungen,
 * Merkblätter, Klausur) der Einheit „Maschinen, die Sprache verstehen“.
 *
 * Farben/Schriften angelehnt an die Schulvorlage: Teal #0E6455, Ocker #B26A0F, Cambria + Calibri.
 *
 * Nutzung (CommonJS):
 *   const D = require((__MAT + '/lib/docstyle.js'));
 *   const body = [ D.h2('Einstieg'), D.p('Text mit **fett**, *kursiv* und `Code`.'), D.task({...}) ];
 *   await D.save(D.doc({ kind:'AB', ds:1, title:'Ein Automat hört zu', subtitle:'…', kernfrage:'…', body }),
 *                (__MAT + '/out/DS01_AB_Ein-Automat-hoert-zu.docx'));
 *
 * kind: 'AB' (Arbeitsblatt), 'LK' (Lehrkraft-Handreichung), 'MB' (Merkblatt), 'KL' (Klausur/Übung), 'PL' (Planung)
 */
const fs = require('fs');
const NIV = require('./niveau.js');
const path = require('path');
const { execFileSync } = require('child_process');
const {
  Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell, WidthType, ShadingType,
  BorderStyle, AlignmentType, Header, Footer, PageNumber, TabStopType, VerticalAlign, HeightRule,
  LevelFormat, PageBreak, TableLayoutType, ExternalHyperlink,
} = require('docx');

// ---------------------------------------------------------------------------------- Tokens
const C = {
  teal: '0E6455', tealDark: '0A4A3F', tealTint: 'E4F0EE', tealTint2: 'F1F7F6',
  ocker: 'B26A0F', ockerTint: 'F8ECDB', ockerTint2: 'FCF6EE',
  ink: '1F2A2E', muted: '5B6770', line: 'C9D3D6', white: 'FFFFFF',
  basis: '2E7D4F', standard: '1F5F99', profi: '6B3FA0',
  red: 'A83232', redTint: 'F7E3E3',
};
const FONT_BODY = 'Calibri';
const FONT_HEAD = 'Cambria';
const FONT_MONO = 'Consolas';
const PAGE_W = 11906, PAGE_H = 16838;              // A4 in DXA
const MARGIN = 1020;                                 // 1,8 cm
const CONTENT_W = PAGE_W - 2 * MARGIN;               // 9866 DXA ≈ 17,4 cm
const cm = (x) => Math.round(x * 567);               // cm → DXA
const pxFromCm = (x) => Math.round(x * 37.795);      // cm → px (96 dpi) für ImageRun

const BASE_URL = process.env.AUTOMATENLAB_URL || '';  // z. B. https://automatenlab.example.de/

const KIND_LABEL = {
  AB: 'Arbeitsblatt', LK: 'Lehrkraft-Handreichung', MB: 'Merkblatt', KL: 'Übungsklausur', PL: 'Planung', LL: 'Lernlandkarte',
};
const WELT = (ds) => (ds <= 6 ? 'A' : ds <= 10 ? 'B' : ds <= 14 ? 'C' : 'D');
const WELT_NAME = { A: 'Endliche Automaten', B: 'Grenzen & Keller', C: 'Formale Sprachen', D: 'Sprachdesign & Ausblick' };

// ---------------------------------------------------------------------------------- Inline-Markup
/** Wandelt '**fett** *kursiv* `code` ^hoch^ ~tief~' in TextRuns um. opts: Basis-Formatierung. */
function runs(text, opts = {}) {
  if (Array.isArray(text)) return text.flatMap((t) => (typeof t === 'string' ? runs(t, opts) : [t]));
  const out = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\^[^^]+\^|~[^~]+~)/g;
  let last = 0, m;
  const base = { font: FONT_BODY, size: opts.size || 22, color: opts.color || C.ink, bold: opts.bold, italics: opts.italics };
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(new TextRun({ ...base, text: text.slice(last, m.index) }));
    const t = m[0];
    if (t.startsWith('**')) out.push(new TextRun({ ...base, text: t.slice(2, -2), bold: true }));
    else if (t.startsWith('`')) out.push(new TextRun({ ...base, text: t.slice(1, -1), font: FONT_MONO, size: (base.size || 22) - 1, color: C.tealDark }));
    else if (t.startsWith('^')) out.push(new TextRun({ ...base, text: t.slice(1, -1), superScript: true }));
    else if (t.startsWith('~')) out.push(new TextRun({ ...base, text: t.slice(1, -1), subScript: true }));
    else out.push(new TextRun({ ...base, text: t.slice(1, -1), italics: true }));
    last = m.index + t.length;
  }
  if (last < text.length) out.push(new TextRun({ ...base, text: text.slice(last) }));
  return out;
}

// ---------------------------------------------------------------------------------- Grundbausteine
function p(text, o = {}) {
  return new Paragraph({
    children: runs(text, o),
    alignment: o.align === 'center' ? AlignmentType.CENTER : o.align === 'right' ? AlignmentType.RIGHT : o.justify ? AlignmentType.JUSTIFIED : AlignmentType.LEFT,
    spacing: { before: o.before ?? 0, after: o.after ?? 100, line: o.line ?? 276 },
    keepNext: o.keepNext, indent: o.indent ? { left: o.indent } : undefined,
  });
}
const small = (text, o = {}) => p(text, { size: 18, color: C.muted, ...o });
function h1(text) {
  return new Paragraph({ children: [new TextRun({ text, font: FONT_HEAD, size: 34, bold: true, color: C.teal })], spacing: { before: 240, after: 120 }, keepNext: true });
}
function h2(text) {
  return new Paragraph({ children: [new TextRun({ text, font: FONT_HEAD, size: 27, bold: true, color: C.teal })], spacing: { before: 260, after: 100 }, keepNext: true });
}
function h3(text) {
  return new Paragraph({ children: [new TextRun({ text, font: FONT_BODY, size: 23, bold: true, color: C.ocker })], spacing: { before: 160, after: 60 }, keepNext: true });
}
function spacer(after = 120) { return new Paragraph({ children: [], spacing: { before: 0, after } }); }
function pageBreak() { return new Paragraph({ children: [new PageBreak()] }); }

function bullets(items, o = {}) {
  return items.map((it) => new Paragraph({ children: runs(it, o), numbering: { reference: 'bullets', level: o.level || 0 }, spacing: { after: 60, line: 264 } }));
}
function numbered(items, o = {}) {
  const ref = o.ref || 'numbers';
  return items.map((it) => new Paragraph({ children: runs(it, o), numbering: { reference: ref, level: 0 }, spacing: { after: 60, line: 264 } }));
}
function checklist(items, o = {}) {
  return items.map((it) => new Paragraph({ children: [new TextRun({ text: '☐  ', font: 'Segoe UI Symbol', size: 22, color: C.teal }), ...runs(it, o)], spacing: { after: 60 }, indent: { left: 200 } }));
}

// ---------------------------------------------------------------------------------- Tabellen
const NONE = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const noBorders = { top: NONE, bottom: NONE, left: NONE, right: NONE, insideHorizontal: NONE, insideVertical: NONE };
const thin = (color = C.line, size = 4) => ({ style: BorderStyle.SINGLE, size, color });

function cell(children, o = {}) {
  const kids = [children].flat(Infinity).flatMap((c) => (typeof c === 'string' ? [p(c, { after: o.pAfter ?? 40, size: o.size, bold: o.bold, color: o.color, align: o.align })] : [c]));
  return new TableCell({
    children: kids.length ? kids : [p('')],
    width: { size: o.w, type: WidthType.DXA },
    shading: o.fill ? { fill: o.fill, type: ShadingType.CLEAR, color: 'auto' } : undefined,
    margins: { top: o.mt ?? 80, bottom: o.mb ?? 80, left: o.ml ?? 120, right: o.mr ?? 120 },
    verticalAlign: o.valign === 'center' ? VerticalAlign.CENTER : VerticalAlign.TOP,
    borders: o.borders, columnSpan: o.span, rowSpan: o.rowSpan,
  });
}

/** Datentabelle. rows: Array von Arrays (Strings oder Paragraph-Arrays). opts.widthsCm, opts.header (default true),
 *  opts.size (Schrift halbe pt), opts.center (Spaltenindizes zentriert), opts.firstColBold, opts.zebra */
function table(rows, o = {}) {
  const n = rows[0].length;
  const total = o.widthCm ? cm(o.widthCm) : CONTENT_W;
  let widths = o.widthsCm ? o.widthsCm.map(cm) : Array(n).fill(Math.floor(total / n));
  const sum = widths.reduce((a, b) => a + b, 0);
  const header = o.header !== false;
  const center = new Set(o.center || []);
  const trs = rows.map((r, i) => new TableRow({
    tableHeader: header && i === 0,
    cantSplit: true,
    height: o.rowHeightCm ? { value: cm(o.rowHeightCm), rule: HeightRule.ATLEAST } : undefined,
    children: r.map((c, j) => cell(c, {
      w: widths[j], fill: header && i === 0 ? C.teal : (o.zebra && i % 2 === 0 ? C.tealTint2 : (o.firstColFill && j === 0 ? C.tealTint2 : undefined)),
      bold: (header && i === 0) || (o.firstColBold && j === 0), color: header && i === 0 ? C.white : undefined,
      size: o.size || 20, align: center.has(j) || o.allCenter ? 'center' : undefined, valign: 'center', mt: 50, mb: 50,
    })),
  }));
  const tbl = new Table({
    rows: trs, width: { size: sum, type: WidthType.DXA }, columnWidths: widths, layout: TableLayoutType.FIXED,
    borders: { top: thin(), bottom: thin(), left: thin(), right: thin(), insideHorizontal: thin(), insideVertical: thin() },
    alignment: o.align === 'center' ? AlignmentType.CENTER : undefined,
  });
  return o.noSpacer ? tbl : [tbl, spacer(140)];
}

/** Leere Tabelle zum Ausfüllen (z. B. Abi-Kellertabelle). headers: Spaltenköpfe, nRows: Leerzeilen, prefill: erste Zeilen. */
function fillTable(headers, nRows, o = {}) {
  const rows = [headers, ...(o.prefill || [])];
  while (rows.length < nRows + 1) rows.push(headers.map(() => ''));
  return table(rows, { ...o, rowHeightCm: o.rowHeightCm || 0.75, center: headers.map((_, i) => i) });
}

// ---------------------------------------------------------------------------------- Kästen
function box(children, o = {}) {
  const kids = [children].flat(Infinity).map((c) => (typeof c === 'string' ? p(c) : c));
  const w = o.widthCm ? cm(o.widthCm) : CONTENT_W;
  return new Table({
    width: { size: w, type: WidthType.DXA }, columnWidths: [w], layout: TableLayoutType.FIXED,
    borders: { top: thin(o.border || o.fill, o.borderSize || 6), bottom: thin(o.border || o.fill, o.borderSize || 6), left: thin(o.border || o.fill, o.borderSize || 6), right: thin(o.border || o.fill, o.borderSize || 6), insideHorizontal: NONE, insideVertical: NONE },
    rows: [new TableRow({ cantSplit: o.cantSplit !== false, children: [cell(kids, { w, fill: o.fill, mt: 120, mb: 100, ml: 200, mr: 200 })] })],
  });
}
const boxTitle = (t, color) => new Paragraph({ children: [new TextRun({ text: t, font: FONT_HEAD, bold: true, size: 23, color })], spacing: { after: 80 }, keepNext: true });

/** Info-Kasten (teal). */
function info(title, body, o = {}) { return [box([boxTitle(title, C.teal), ...body], { fill: C.tealTint, border: C.tealTint, ...o }), spacer(140)]; }
/** Merke-Kasten (ocker) – für Sicherungen. */
function merke(title, body, o = {}) { return [box([boxTitle(title, C.ocker), ...body], { fill: C.ockerTint, border: C.ocker, borderSize: 8, ...o }), spacer(140)]; }
/** Tipp/Hilfe-Kasten (dezent). */
function tip(title, body, o = {}) { return [box([boxTitle(title, C.muted), ...body], { fill: 'F4F6F7', border: C.line, ...o }), spacer(140)]; }
/** Achtung-Kasten (rot) – typische Fehler. title = Text oder { titel, fallen: ['P1', …] }: Mit Fallen steht am Ende
 *  „Abitur-Fallen: P1 Kurztitel · …“ (Liste und Nummern aus app/js/data/fallen.js, Übersicht auf Merkblatt M12). */
function warn(title, body, o = {}) {
  const t = typeof title === 'string' ? { titel: title } : title;
  const extra = t.fallen?.length ? [fallenZeile(t.fallen)] : [];
  return [box([boxTitle(t.titel, C.red), ...body, ...extra], { fill: C.redTint, border: C.redTint, ...o }), spacer(140)];
}
const FALLEN = require('../../app/js/data/fallen.js').FALLEN; // ES-Modul, require() geht ab Node 22.12
/** Zeile „Abitur-Fallen: P1 … · P3 …“ (nach Nummer sortiert). */
function fallenZeile(liste) {
  const nr = (p) => Number(p.slice(1));
  const fs_ = [...liste].sort((a, b) => nr(a) - nr(b)).map((p) => {
    const f = FALLEN.find((x) => x.p === p);
    if (!f) throw new Error(`Unbekannte Falle ${p}`);
    return f;
  });
  const runs = [new TextRun({ text: 'Abitur-Fallen: ', font: FONT_BODY, bold: true, size: 17, color: C.red })];
  fs_.forEach((f, i) => runs.push(new TextRun({ text: `${i ? '  ·  ' : ''}${f.p} `, font: FONT_BODY, bold: true, size: 17, color: C.red }), new TextRun({ text: f.titel, font: FONT_BODY, size: 17, color: C.muted })));
  return new Paragraph({ children: runs, spacing: { before: 100, after: 0 } });
}
/** Kernfrage-Banner. */
function kernfrage(text) {
  return [box([new Paragraph({ children: [new TextRun({ text: 'Kernfrage  ', font: FONT_BODY, bold: true, size: 20, color: C.ocker }), new TextRun({ text, font: FONT_HEAD, italics: true, size: 24, color: C.tealDark })], spacing: { after: 0 } })], { fill: C.ockerTint2, border: C.ockerTint }), spacer(160)];
}

// ---------------------------------------------------------------------------------- Aufgaben
const LEVEL_COLOR = { Basis: C.basis, Standard: C.standard, Profi: C.profi };
/** Aufgabe mit Nummern-Badge.
 *  {nr, title, afb:'I'|'II'|'III'|'I–II', niveau:'Basis'|'Standard'|'Profi', punkte, app:'#/route', body:[...]}
 *  Gibt ein Array zurück (Kopfzeile + Inhalt), Inhalt volle Breite. */
function task(t) {
  const kids = [
    new TextRun({ text: ` ${t.nr} `, font: FONT_HEAD, bold: true, size: 26, color: C.white, shading: { type: ShadingType.CLEAR, fill: C.ocker, color: 'auto' } }),
    new TextRun({ text: '  ' + (t.title || ''), font: FONT_HEAD, bold: true, size: 25, color: C.ink }),
  ];
  if (t.niveau) kids.push(new TextRun({ text: '   ' }), new TextRun({ text: ` ${t.niveau} `, font: FONT_BODY, bold: true, size: 16, color: C.white, shading: { type: ShadingType.CLEAR, fill: LEVEL_COLOR[t.niveau] || C.muted, color: 'auto' } }));
  if (t.afb) kids.push(new TextRun({ text: `   AFB ${t.afb}`, font: FONT_BODY, size: 17, color: C.muted }));
  if (t.punkte) kids.push(new TextRun({ text: `   [${t.punkte} BE]`, font: FONT_BODY, size: 17, color: C.muted }));
  if (t.app) kids.push(new TextRun({ text: `   ▸ AutomatenLab ${t.app}`, font: FONT_BODY, size: 17, color: C.teal, bold: true }));
  const head = new Paragraph({ children: kids, spacing: { before: 200, after: 100 }, keepNext: true,
    border: { top: { style: BorderStyle.SINGLE, size: 4, color: C.line, space: 8 } } });
  return [head, ...(t.body || []).map((c) => (typeof c === 'string' ? p(c) : c)), spacer(80)];
}
/** Teilaufgabe a), b) … innerhalb einer Aufgabe. */
function sub(letter, text, o = {}) {
  return new Paragraph({ children: [new TextRun({ text: `${letter})  `, font: FONT_BODY, bold: true, size: 22, color: C.teal }), ...runs(text, o)], indent: { left: 360, hanging: 360 }, spacing: { after: 80, line: 276 } });
}

// ---------------------------------------------------------------------------------- Schreib-/Zeichenflächen
function lines(n = 3) {
  return Array.from({ length: n }, () => new Paragraph({ tabStops: [{ type: TabStopType.RIGHT, position: CONTENT_W - 20, leader: 'dot' }], children: [new TextRun({ text: '\t', size: 22, color: 'A8B4B8' })], spacing: { before: 120, after: 120, line: 300 } }));
}
/** Leerer Rahmen (z. B. für Zustandsgraphen). */
function drawBox(heightCm = 5, label = 'Platz für deinen Zustandsgraphen', o = {}) {
  const w = o.widthCm ? cm(o.widthCm) : CONTENT_W;
  return [new Table({
    width: { size: w, type: WidthType.DXA }, columnWidths: [w], layout: TableLayoutType.FIXED,
    borders: { top: { style: BorderStyle.DASHED, size: 6, color: 'A8B4B8' }, bottom: { style: BorderStyle.DASHED, size: 6, color: 'A8B4B8' }, left: { style: BorderStyle.DASHED, size: 6, color: 'A8B4B8' }, right: { style: BorderStyle.DASHED, size: 6, color: 'A8B4B8' } },
    rows: [new TableRow({ height: { value: cm(heightCm), rule: HeightRule.EXACT }, cantSplit: true, children: [cell([small(label, { color: 'A8B4B8' })], { w })] })],
  }), spacer(120)];
}

// ---------------------------------------------------------------------------------- Bilder
/** Bild einfügen. widthCm (Default 12), max. Höhe maxHeightCm; caption optional. */
function img(file, o = {}) {
  const data = fs.readFileSync(file);
  let wpx, hpx;
  try { const { w, h } = pngSize(data); wpx = w; hpx = h; } catch (e) { wpx = 4; hpx = 3; }
  let widthCm = o.widthCm || 12;
  let heightCm = widthCm * hpx / wpx;
  if (o.maxHeightCm && heightCm > o.maxHeightCm) { heightCm = o.maxHeightCm; widthCm = heightCm * wpx / hpx; }
  const out = [new Paragraph({ alignment: o.align === 'left' ? AlignmentType.LEFT : AlignmentType.CENTER, spacing: { before: 60, after: o.caption ? 20 : 120 }, keepNext: !!o.caption,
    children: [new ImageRun({ type: 'png', data, transformation: { width: pxFromCm(widthCm), height: pxFromCm(heightCm) }, altText: { title: o.alt || o.caption || 'Abbildung', description: o.alt || o.caption || 'Abbildung', name: path.basename(file) } })] })];
  if (o.caption) out.push(p(o.caption, { size: 18, color: C.muted, align: o.align === 'left' ? 'left' : 'center', italics: true, after: 140 }));
  return out;
}
function pngSize(buf) {
  if (buf.readUInt32BE(12) !== 0x49484452) throw new Error('kein PNG');
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

// ---------------------------------------------------------------------------------- QR / App-Link
/** QR-Kasten für AutomatenLab-Links. route z. B. '#/arena?stufe=1'.
 *  Ist AUTOMATENLAB_URL gesetzt, wird ein echter QR-Code erzeugt, sonst ein Platzhalter. */
function qr({ route, title, text }) {
  const qrW = cm(3.0), textW = CONTENT_W - qrW - cm(0.3);
  let qrContent;
  const url = BASE_URL ? BASE_URL.replace(/\/?$/, '/') + route : '';
  if (url) {
    const tmp = path.join(require('os').tmpdir(), 'qr_' + Buffer.from(route).toString('hex').slice(0, 40) + '.png');
    execFileSync('python3', ['-c', `import segno; segno.make(${JSON.stringify(url)}, error='m').save(${JSON.stringify(tmp)}, scale=12, border=1, dark='#0A4A3F')`]);
    qrContent = [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [new ImageRun({ type: 'png', data: fs.readFileSync(tmp), transformation: { width: pxFromCm(2.6), height: pxFromCm(2.6) }, altText: { title: 'QR-Code', description: url, name: 'qr' } })] })];
  } else {
    qrContent = [p('QR-Code', { align: 'center', size: 18, color: C.muted, bold: true, after: 0 }), p('folgt', { align: 'center', size: 16, color: C.muted, after: 0 })];
  }
  const dashed = { style: BorderStyle.DASHED, size: 6, color: C.teal };
  return [new Table({
    width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: [qrW, cm(0.3), textW], layout: TableLayoutType.FIXED, borders: noBorders,
    rows: [new TableRow({ cantSplit: true, height: { value: cm(3.0), rule: HeightRule.ATLEAST }, children: [
      new TableCell({ children: qrContent, width: { size: qrW, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, borders: url ? noBorders : { top: dashed, bottom: dashed, left: dashed, right: dashed }, margins: { top: 40, bottom: 40, left: 40, right: 40 } }),
      new TableCell({ children: [p('')], width: { size: cm(0.3), type: WidthType.DXA }, borders: noBorders }),
      new TableCell({ children: [
        new Paragraph({ children: [new TextRun({ text: 'AutomatenLab  ', font: FONT_BODY, bold: true, size: 18, color: C.ocker }), new TextRun({ text: title, font: FONT_HEAD, bold: true, size: 24, color: C.teal })], spacing: { after: 60 } }),
        ...(text ? [p(text, { size: 20, after: 60 })] : []),
        p(`Link: ${url || '[AutomatenLab-Adresse]/' + route}`, { size: 16, color: C.muted, after: 0 }),
      ], width: { size: textW, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, borders: noBorders, shading: { fill: C.tealTint2, type: ShadingType.CLEAR, color: 'auto' }, margins: { top: 100, bottom: 100, left: 200, right: 160 } }),
    ] })],
  }), spacer(160)];
}

// ---------------------------------------------------------------------------------- Kopf / Fuß
function titleBlock(o) {
  const kind = KIND_LABEL[o.kind] || o.kind;
  const welt = o.ds ? WELT(o.ds) : null;
  const leftW = cm(12.4), rightW = CONTENT_W - leftW;
  const meta = [];
  if (o.ds) meta.push(`Level ${o.ds}`);
  if (welt) meta.push(`Welt ${welt} · ${WELT_NAME[welt]}`);
  const niv = NIV.niveauVon(o);
  const metaText = [o.metaText || meta.join('  ·  '), `Niveau: ${NIV.NIVEAU_TEXT[niv]}`].filter(Boolean).join('  ·  ');
  const rows = [new TableRow({ children: [
    new TableCell({ width: { size: leftW, type: WidthType.DXA }, borders: noBorders, margins: { top: 0, bottom: 0, left: 0, right: 0 }, children: [
      new Paragraph({ children: [new TextRun({ text: kind, font: FONT_BODY, bold: true, size: 18, color: C.ocker }), new TextRun({ text: metaText ? '   ' + metaText : '', font: FONT_BODY, size: 18, color: C.muted })], spacing: { after: 40 } }),
      new Paragraph({ children: [new TextRun({ text: o.title, font: FONT_HEAD, bold: true, size: o.titleSize || 40, color: C.teal })], spacing: { before: 20, after: 40 } }),
      ...(o.subtitle ? [new Paragraph({ children: [new TextRun({ text: o.subtitle, font: FONT_BODY, size: 22, color: C.muted })], spacing: { after: 0 } })] : []),
    ] }),
    new TableCell({ width: { size: rightW, type: WidthType.DXA }, borders: noBorders, verticalAlign: VerticalAlign.BOTTOM, margins: { top: 0, bottom: 0, left: 120, right: 0 }, children:
      o.kind === 'AB' || o.kind === 'KL' || o.kind === 'LL' ? [
        new Paragraph({ children: [new TextRun({ text: 'Name', font: FONT_BODY, size: 16, color: C.muted })], spacing: { after: 0 }, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C.line, space: 14 } } }),
        new Paragraph({ children: [new TextRun({ text: 'Datum', font: FONT_BODY, size: 16, color: C.muted })], spacing: { before: 120, after: 0 }, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C.line, space: 14 } } }),
      ] : [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: o.rightNote || NIV.NIVEAU_KURS[niv], font: FONT_BODY, size: 18, color: C.muted })] })] }),
  ] })];
  return [new Table({ width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: [leftW, rightW], layout: TableLayoutType.FIXED, borders: noBorders, rows }),
    new Paragraph({ children: [], border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: C.teal, space: 1 } }, spacing: { before: 60, after: 200 } })];
}

function header(o) {
  return new Header({ children: [new Paragraph({
    tabStops: [{ type: TabStopType.RIGHT, position: CONTENT_W }],
    children: [new TextRun({ text: 'Maschinen, die Sprache verstehen', font: FONT_BODY, size: 16, color: C.muted }),
      new TextRun({ text: `\t${NIV.NIVEAU_KURS[NIV.niveauVon(o)]} · Automaten & formale Sprachen`, font: FONT_BODY, size: 16, color: C.muted })],
  })] });
}
// Lizenzvermerk der Unterrichtsmaterialien (siehe materials/LIZENZ.md)
const LIZENZ = 'CC BY-SA 4.0 Frank Juchim';

function footer(o) {
  const code = o.code || (o.ds ? `DS${String(o.ds).padStart(2, '0')} · ${KIND_LABEL[o.kind]}` : KIND_LABEL[o.kind]);
  return new Footer({ children: [new Paragraph({
    tabStops: [{ type: TabStopType.RIGHT, position: CONTENT_W }],
    children: [new TextRun({ text: `Max-Planck-Gymnasium Delmenhorst  ·  ${code}  ·  ${LIZENZ}`, font: FONT_BODY, size: 16, color: C.muted }),
      new TextRun({ children: ['\tSeite ', PageNumber.CURRENT, ' von ', PageNumber.TOTAL_PAGES], font: FONT_BODY, size: 16, color: C.muted })],
  })] });
}

// ---------------------------------------------------------------------------------- Dokument
/** o: {kind, ds, title, subtitle, kernfrage, body:[...], landscape?, code?, metaText?, rightNote?} */
function doc(o) {
  const children = [...titleBlock(o), ...(o.kernfrage ? kernfrage(o.kernfrage) : []), ...o.body.flat(Infinity)];
  return new Document({
    creator: 'Frank Juchim', title: o.title, description: 'Informatik gA/eA – Automaten und formale Sprachen',
    styles: { default: { document: { run: { font: FONT_BODY, size: 22, color: C.ink } } } },
    numbering: { config: [
      { reference: 'bullets', levels: [
        { level: 0, format: LevelFormat.BULLET, text: '▪', alignment: AlignmentType.LEFT, style: { run: { color: C.teal }, paragraph: { indent: { left: 400, hanging: 260 } } } },
        { level: 1, format: LevelFormat.BULLET, text: '–', alignment: AlignmentType.LEFT, style: { run: { color: C.muted }, paragraph: { indent: { left: 800, hanging: 260 } } } }] },
      ...['numbers', 'numbers2', 'numbers3', 'numbers4', 'numbers5', 'numbers6'].map((ref) => ({ reference: ref, levels: [
        { level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { run: { color: C.teal, bold: true }, paragraph: { indent: { left: 420, hanging: 320 } } } }] })),
    ] },
    sections: [{
      properties: { page: { size: { width: PAGE_W, height: PAGE_H, orientation: o.landscape ? 'landscape' : undefined }, margin: { top: 900, bottom: 900, left: MARGIN, right: MARGIN, header: 450, footer: 450 } } },
      headers: { default: header(o) }, footers: { default: footer(o) },
      children,
    }],
  });
}

async function save(d, file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const buf = await Packer.toBuffer(d);
  fs.writeFileSync(file, buf);
  return file;
}

/** Rendert DOCX → PDF → PNG-Seiten (für die visuelle Prüfung). Gibt Liste der PNG-Pfade zurück. */
function preview(file, outDir) {
  outDir = outDir || path.join(path.dirname(file), '_preview');
  fs.mkdirSync(outDir, { recursive: true });
  execFileSync(require('./pptx-theme.js').soffice(), ['--headless', '--convert-to', 'pdf', '--outdir', outDir, file], { stdio: 'pipe' });
  const pdf = path.join(outDir, path.basename(file).replace(/\.docx$/, '.pdf'));
  const prefix = path.join(outDir, path.basename(file).replace(/\.docx$/, ''));
  execFileSync('pdftoppm', ['-png', '-r', '70', pdf, prefix]);
  return fs.readdirSync(outDir).filter((f) => f.startsWith(path.basename(prefix)) && f.endsWith('.png')).map((f) => path.join(outDir, f)).sort();
}

module.exports = {
  C, cm, CONTENT_W, FONT_BODY, FONT_HEAD, runs, p, small, h1, h2, h3, spacer, pageBreak, bullets, numbered, checklist,
  table, fillTable, cell, box, info, merke, tip, warn, fallenZeile, FALLEN, kernfrage, task, sub, lines, drawBox, img, qr, doc, save, preview,
  TextRun, Paragraph, Table, TableRow, TableCell, WidthType, ShadingType, AlignmentType, BorderStyle,
};
