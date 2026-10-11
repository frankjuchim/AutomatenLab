// Entwickler-Hilfe: Screenshot einer Route.  node shot.mjs '<hash>' name [breite] [höhe] [full] [js-Aktionen]
import { chromium } from 'playwright';
const [hash, name, w = '1366', hgt = '768', full = '1', actions = ''] = process.argv.slice(2);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: Number(w), height: Number(hgt) } });
const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => (m.type() === 'error' || m.type() === 'warning') && errs.push(m.text()));
await p.goto(`http://localhost:8080/${hash}`); await p.waitForTimeout(1200);
if (actions) { const fn = new Function('p', `return (async () => { ${actions} })()`); await fn(p); await p.waitForTimeout(800); }
await p.screenshot({ path: new URL(`./shots/${name}.png`, import.meta.url).pathname, fullPage: full === '1' });
console.log('Fehler:', errs.length ? errs : 'keine'); await b.close();
