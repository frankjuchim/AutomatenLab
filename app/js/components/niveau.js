// Kennzeichnung der Anforderungsniveaus (gA/eA, Vertrag InfoLabs v1.2 §9) – Etikett an Level-Knoten und Pillen.
import { h } from '../core/dom.js';
import { NIVEAUS } from '../data/niveaus.js';

/** Kleines Etikett für Level-Knoten: „LK“ (nur eA) bzw. „+“ (Zusatz); Kern (gA + eA) ohne Etikett. */
export function niveauEtikett(n) {
  if (n === 'eA') return h('span', { class: 'niveau-etikett niveau-ea', 'aria-hidden': 'true', title: NIVEAUS.eA.lang }, 'LK');
  if (n === 'plus') return h('span', { class: 'niveau-etikett niveau-plus', 'aria-hidden': 'true', title: NIVEAUS.plus.lang }, '+');
  return null;
}

const PILLE = { alle: 'GK + LK', eA: 'nur LK (eA)', plus: 'Zusatz', 'je-level': 'je Level' };
const TITEL = { ...Object.fromEntries(Object.entries(NIVEAUS).map(([k, v]) => [k, v.lang])), 'je-level': 'Aufgaben haben das Niveau ihres Levels' };

/** Pille mit Text, z. B. an Modul-Kacheln und in der Themenübersicht. */
export function niveauPille(n, zusatz = '') {
  if (!n || !PILLE[n]) return null;
  return h('span', { class: ['niveau-pille', `niveau-${n === 'eA' ? 'ea' : n}`], title: TITEL[n] }, PILLE[n] + zusatz);
}
