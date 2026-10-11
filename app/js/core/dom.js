// Mini-Hilfen für DOM-Aufbau ohne Framework.
//
//   h('button', { class: 'btn', onclick: () => …, 'aria-label': 'Weiter' }, 'Weiter')
//   h('ul', null, items.map((x) => h('li', null, x)))
// Attribute: class, style (String oder Objekt), dataset (Objekt), on<event> (Funktion),
// boolesche Attribute (true/false), alles andere als setAttribute. Kinder: Strings, Nodes, Arrays, null.

export function h(tag, attrs, ...children) {
  const el = tag instanceof Element ? tag : document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = Array.isArray(v) ? v.filter(Boolean).join(' ') : v;
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k === 'dataset') Object.assign(el.dataset, v);
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'value' && 'value' in el) el.value = v;
      else if (k === 'checked' || k === 'selected' || k === 'disabled') el[k] = !!v;
      else if (v === true) el.setAttribute(k, '');
      else el.setAttribute(k, String(v));
    }
  }
  append(el, children);
  return el;
}

export function append(el, children) {
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

/** Inhalt ersetzen. */
export function clear(el, ...children) { el.replaceChildren(); return append(el, children); }

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/** Bevorzugt der Nutzer reduzierte Bewegung? */
export const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

/** Wort für die Anzeige in Anführungszeichen: „ab“, leeres Wort als ε (ohne Anführungszeichen). */
export const quote = (w) => (w === '' || w === 'ε' ? 'ε' : `„${w}“`);

/** Kleines Inline-SVG-Symbol (Zustandskreis), z. B. für Logo und Abzeichen. */
export function stateGlyph({ accepting = false, size = 28, label = '' } = {}) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 32 32');
  svg.setAttribute('width', size); svg.setAttribute('height', size);
  svg.setAttribute('aria-hidden', 'true');
  svg.classList.add('glyph');
  const c = (r) => { const e = document.createElementNS(ns, 'circle'); e.setAttribute('cx', 16); e.setAttribute('cy', 16); e.setAttribute('r', r); return e; };
  svg.append(c(14));
  if (accepting) svg.append(c(10));
  if (label) { const t = document.createElementNS(ns, 'text'); t.setAttribute('x', 16); t.setAttribute('y', 20.5); t.setAttribute('text-anchor', 'middle'); t.textContent = label; svg.append(t); }
  return svg;
}
