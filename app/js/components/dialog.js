// Modaler Dialog (natives <dialog>): Fokusfalle, Esc schließt, Fokus kehrt zurück; ein Routenwechsel schließt ihn.
//   const dlg = openDialog({ title: 'Zeig mir warum', body: element, onClose: () => … });
//   dlg.close();

import { h } from '../core/dom.js';

export function openDialog({ title, body, onClose, wide = true }) {
  const opener = document.activeElement;
  const closeBtn = h('button', { type: 'button', class: 'btn btn-ghost dialog-close', 'aria-label': 'Schließen' }, '×');
  const titleId = `dlg-${Math.random().toString(36).slice(2, 8)}`;
  const dlg = h('dialog', { class: ['dialog', wide && 'is-wide'], 'aria-labelledby': titleId },
    h('div', { class: 'dialog-head' }, h('h2', { id: titleId }, title), closeBtn),
    h('div', { class: 'dialog-body' }, body));
  document.body.append(dlg);
  let closed = false;
  const close = () => {
    if (closed) return; closed = true;
    window.removeEventListener('hashchange', close);
    try { dlg.close(); } catch { /* ignore */ }
    dlg.remove();
    onClose?.();
    if (opener && document.contains(opener)) opener.focus();
  };
  closeBtn.addEventListener('click', close);
  window.addEventListener('hashchange', close); // sonst bliebe er über der nächsten Seite stehen (z. B. „Zurück“ im Browser)
  dlg.addEventListener('cancel', (e) => { e.preventDefault(); close(); });
  dlg.addEventListener('click', (e) => { if (e.target === dlg) close(); }); // Klick auf den Hintergrund
  if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
  closeBtn.focus();
  return { el: dlg, close };
}
