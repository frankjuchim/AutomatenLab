// Hash-Routing: #/<route>?<parameter>   z. B. #/baukasten?level=3
// Deep-Links funktionieren ohne Server-Konfiguration (alles hinter dem #).

/** '#/baukasten?level=3' → { route:'baukasten', params: URLSearchParams } */
export function parseHash(hash = window.location.hash) {
  const raw = String(hash).replace(/^#\/?/, '');
  const qi = raw.indexOf('?');
  const path = qi < 0 ? raw : raw.slice(0, qi);
  const query = qi < 0 ? '' : raw.slice(qi + 1);
  const parts = path.split('/').filter(Boolean).map(decodeURIComponent);
  return { route: parts[0] ?? '', sub: parts.slice(1), params: new URLSearchParams(query) };
}

/** link('baukasten', { level: 3 }) → '#/baukasten?level=3' */
export function link(route, params = {}) {
  const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v != null && v !== '')).toString();
  return `#/${route}${q ? `?${q}` : ''}`;
}

export function navigate(route, params = {}, { replace = false } = {}) {
  const target = link(route, params);
  if (replace) window.history.replaceState(null, '', target);
  if (window.location.hash === target && !replace) window.dispatchEvent(new HashChangeEvent('hashchange'));
  else if (replace) window.dispatchEvent(new HashChangeEvent('hashchange'));
  else window.location.hash = target;
}
