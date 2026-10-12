// JSON-Anfragen an den eigenen Server (gleiche Herkunft; schreibende Anfragen als JSON, Vertrag/CSRF wie Algo Quest).

/** Liefert die JSON-Antwort oder wirft einen Fehler mit deutscher Meldung und .status. */
export async function api(method, url, body) {
  const opts = { method, credentials: 'same-origin', headers: { Accept: 'application/json' } };
  if (body !== undefined) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
  let res;
  try { res = await fetch(url, opts); } catch {
    throw Object.assign(new Error('Keine Verbindung zum Server. Prüfe das Netzwerk und versuche es noch einmal.'), { status: 0 });
  }
  const data = (res.headers.get('content-type') ?? '').includes('application/json') ? await res.json().catch(() => null) : null;
  if (!res.ok) throw Object.assign(new Error(data?.error ?? `Fehler ${res.status}`), { status: res.status, data });
  return data;
}
