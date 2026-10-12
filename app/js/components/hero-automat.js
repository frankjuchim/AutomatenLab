// Kleiner animierter Automat für die Startseite (rein dekorativ, Animation nur per CSS, ruhig bei
// „Bewegung reduzieren“). DEA über Σ = {a, b} für „enthält ab“: S0 –a→ S1 –b→ S2, Schleifen S0: b, S1: a, S2: a, b.
// Er liest das Wort „aab“: S0 → S1 → S1 → S2 – Endzustand nach vollständiger Eingabe, also akzeptiert.

import { h, reducedMotion } from '../core/dom.js';

const NS = 'http://www.w3.org/2000/svg';
function s(tag, attrs = {}, ...kinder) {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  for (const k of kinder) el.append(k);
  return el;
}

const Y = 128;
const ZUSTAENDE = [{ id: 's0', x: 80, name: 'S0' }, { id: 's1', x: 210, name: 'S1' }, { id: 's2', x: 340, name: 'S2', end: true }];
const WORT = ['a', 'a', 'b'];

/** Schleife unter einem Zustand mit Beschriftung. */
const schleife = (x, text, cls) => s('g', { class: `ha-kante ${cls}` },
  s('path', { d: `M ${x - 13} ${Y + 25} C ${x - 34} ${Y + 72}, ${x + 34} ${Y + 72}, ${x + 13} ${Y + 25}`, 'marker-end': 'url(#ha-pfeil)' }),
  s('text', { x, y: Y + 78, 'text-anchor': 'middle' }, text));

const kante = (x1, x2, text, cls) => s('g', { class: `ha-kante ${cls}` },
  s('path', { d: `M ${x1 + 29} ${Y} L ${x2 - 31} ${Y}`, 'marker-end': 'url(#ha-pfeil)' }),
  s('text', { x: (x1 + x2) / 2, y: Y - 9, 'text-anchor': 'middle' }, text));

export function heroAutomat() {
  const svg = s('svg', { viewBox: '0 0 420 222', class: 'ha-svg', 'aria-hidden': 'true', focusable: 'false' },
    s('defs', {}, s('marker', { id: 'ha-pfeil', viewBox: '0 0 10 10', refX: '9', refY: '5', markerWidth: '7', markerHeight: '7', orient: 'auto-start-reverse' },
      s('path', { d: 'M 0 0 L 10 5 L 0 10 z', class: 'ha-spitze' }))),
    // Eingabeband mit Lesekopf
    s('g', { class: 'ha-band' },
      ...WORT.map((z, i) => s('g', { class: `ha-zelle ha-z${i + 1}` },
        s('rect', { x: 156 + i * 38, y: 8, width: 34, height: 34, rx: 6 }),
        s('text', { x: 173 + i * 38, y: 31, 'text-anchor': 'middle' }, z))),
      s('path', { class: 'ha-kopf', d: 'M 173 47 l -7 10 h 14 z' })),
    // Start, Kanten, Zustände
    s('g', { class: 'ha-kante ha-start' }, s('text', { x: 6, y: Y - 9 }, 'Start'), s('path', { d: `M 8 ${Y} L ${80 - 31} ${Y}`, 'marker-end': 'url(#ha-pfeil)' })),
    kante(80, 210, 'a', 'ha-k01'), kante(210, 340, 'b', 'ha-k12'),
    schleife(80, 'b', 'ha-l0'), schleife(210, 'a', 'ha-l1'), schleife(340, 'a, b', 'ha-l2'),
    ...ZUSTAENDE.map((z) => s('g', { class: `ha-zustand ha-${z.id}` },
      s('circle', { cx: z.x, cy: Y, r: 27, class: 'ha-kreis' }),
      z.end ? s('circle', { cx: z.x, cy: Y, r: 21, class: 'ha-innen' }) : '',
      s('text', { x: z.x, y: Y + 6, 'text-anchor': 'middle' }, z.name))),
    s('g', { class: 'ha-urteil' }, s('text', { x: 340, y: Y - 44, 'text-anchor': 'middle' }, 'akzeptiert ✓')));
  // Läuft dreimal und bleibt dann im Endbild stehen; anhalten und neu abspielen per Knopf (WCAG 2.2.2).
  const fig = h('figure', { class: 'hero-automat' });
  const knopf = h('button', { type: 'button', class: 'btn btn-ghost btn-small hero-automat-knopf', onclick: () => (fig.classList.contains('is-laeuft') ? stopp() : start()) });
  const start = () => {
    fig.classList.remove('is-laeuft');
    void fig.offsetWidth; // Animation von vorn
    fig.classList.add('is-laeuft');
    knopf.textContent = 'Anhalten';
  };
  const stopp = () => { fig.classList.remove('is-laeuft'); knopf.textContent = 'Nochmal abspielen'; };
  svg.querySelector('.ha-urteil').addEventListener('animationend', stopp);
  h(fig, null, svg, h('figcaption', { class: 'hero-automat-text' }, 'Ein DEA für „enthält ab“ liest „aab“ – und landet im Endzustand. ', knopf));
  if (reducedMotion()) stopp(); else start();
  return fig;
}
