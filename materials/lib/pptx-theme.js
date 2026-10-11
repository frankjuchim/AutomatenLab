/* pptx-theme.js – schreibt die Farbpalette der Einheit in ppt/theme/theme1.xml einer von pptxgenjs erzeugten Datei.
 * pptxgenjs setzt nur die Schriften des Designs; ohne diesen Schritt zeigen Designfarben (z. B. in PowerPoints
 * Farbauswahl) die Office-Standardpalette.
 *   await applyTheme('deck.pptx', { name: 'Automaten LK', colors: { dk1, lt1, dk2, lt2, accent1 … accent6, hlink, folHlink } });
 */
const fs = require('fs');
const JSZip = require('jszip');

const SLOTS = ['dk1', 'lt1', 'dk2', 'lt2', 'accent1', 'accent2', 'accent3', 'accent4', 'accent5', 'accent6', 'hlink', 'folHlink'];
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

async function applyTheme(file, theme) {
  const zip = await JSZip.loadAsync(fs.readFileSync(file));
  const part = 'ppt/theme/theme1.xml';
  if (!zip.file(part)) throw new Error(`${file}: ${part} fehlt`);
  for (const k of SLOTS) if (!/^[0-9A-Fa-f]{6}$/.test(String(theme.colors[k]))) throw new Error(`Farbe ${k} ungültig: ${theme.colors[k]}`);
  const name = esc(theme.name || 'Design');
  const scheme = `<a:clrScheme name="${name}">${SLOTS.map((k) => `<a:${k}><a:srgbClr val="${theme.colors[k].toUpperCase()}"/></a:${k}>`).join('')}</a:clrScheme>`;
  let xml = await zip.file(part).async('string');
  xml = xml.replace(/<a:clrScheme\b[\s\S]*?<\/a:clrScheme>/, () => scheme).replace(/(<a:(?:theme|fontScheme)\b[^>]*?\bname=")[^"]*"/g, (_, h) => `${h}${name}"`);
  zip.file(part, xml);
  fs.writeFileSync(file, await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }));
}

/** LibreOffice-Aufruf für Vorschauen (Umgebungsvariable SOFFICE überschreibt den Pfad). */
function soffice() {
  if (process.env.SOFFICE) return process.env.SOFFICE;
  const mac = '/Applications/LibreOffice.app/Contents/MacOS/soffice';
  return fs.existsSync(mac) ? mac : 'soffice';
}

module.exports = { applyTheme, soffice };
