// Feedback-Toasts (unten mittig, aria-live).
//   toast('Richtig!', { type: 'success' });   type: 'success' | 'error' | 'info' | 'badge'
//   toast(text, { timeout: 5000 })            0 = bleibt bis zum Klick

import { h } from '../core/dom.js';

let region = null;
function ensureRegion() {
  if (region && document.body.contains(region)) return region;
  region = h('div', { class: 'toast-region', role: 'status', 'aria-live': 'polite' });
  document.body.append(region);
  return region;
}

export function toast(message, { type = 'info', timeout = 3800, title = null } = {}) {
  const r = ensureRegion();
  const el = h('div', { class: `toast toast-${type}` },
    title ? h('strong', { class: 'toast-title' }, title) : null,
    h('span', null, message),
    h('button', { class: 'toast-close', type: 'button', 'aria-label': 'Meldung schließen', onclick: () => close() }, '×'));
  r.append(el);
  while (r.children.length > 3) r.firstElementChild.remove();
  let timer = null;
  const close = () => { clearTimeout(timer); el.classList.add('is-leaving'); setTimeout(() => el.remove(), 200); };
  if (timeout) timer = setTimeout(close, timeout);
  return close;
}
