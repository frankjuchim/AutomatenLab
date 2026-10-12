// Sitzung im Browser: Wer ist über das Portal InfoLabs angemeldet? (GET /api/sitzung)
// Ohne Server (z. B. statischer Testserver) oder ohne Anmeldung: Gast.

let laden = null;

/** Liefert { konto: {sub, rolle, name, kurse} | null, anmeldung: boolean, portal: string|null }. */
export function sitzung() {
  if (!laden) {
    laden = fetch('/api/sitzung', { credentials: 'same-origin', headers: { Accept: 'application/json' } })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
      .then((s) => ({ konto: s?.konto ?? null, anmeldung: !!s?.anmeldung, portal: s?.portal ?? null }));
  }
  return laden;
}

/** Anmeldelink zum Portal, der nach der Anmeldung genau hierher zurückführt (Vertrag §5: ziel = relativer Pfad). */
export const anmeldeLink = (ziel = location.pathname + location.hash) => `/sso/start?ziel=${encodeURIComponent(ziel.startsWith('/') ? ziel : '/')}`;

export const istLehrkraft = (konto) => konto?.rolle === 'lehrkraft' || konto?.rolle === 'superadmin';
