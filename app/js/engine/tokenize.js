// Tokenisierung von Wörtern über einem Eingabealphabet Σ.
// Symbole dürfen aus mehreren Zeichen bestehen (z. B. „10“, „20“, „la“).
// Es wird per Longest-Match zerlegt; Leerzeichen und Kommas trennen nur und werden ignoriert.

export const EPS = 'ε';

/** Ist s eine Schreibweise des leeren Wortes? */
export function isEpsilon(s) {
  if (s == null) return true;
  const t = String(s).trim();
  return t === '' || t === EPS || t.toLowerCase() === 'eps' || t.toLowerCase() === 'epsilon';
}

/**
 * Zerlegt ein Wort in Symbole des Alphabets.
 * @param {string|string[]} word  Wort als Text („aab“, „10 20 10“) oder bereits als Symbol-Array
 * @param {string[]} alphabet     Σ
 * @returns {{ok:true, tokens:string[]} | {ok:false, tokens:string[], position:number, rest:string, message:string}}
 */
export function tokenize(word, alphabet) {
  if (Array.isArray(word)) {
    const bad = word.find((s) => !alphabet.includes(s));
    if (bad !== undefined) {
      return { ok: false, tokens: [], position: word.indexOf(bad), rest: bad,
        message: `„${bad}“ gehört nicht zum Eingabealphabet Σ = {${alphabet.join(', ')}}.` };
    }
    return { ok: true, tokens: [...word] };
  }
  const text = String(word ?? '');
  if (isEpsilon(text)) return { ok: true, tokens: [] };
  const sorted = [...alphabet].sort((x, y) => y.length - x.length);
  const tokens = [];
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (ch === ' ' || ch === ',' || ch === '\t' || ch === '\n' || ch === '·') { i++; continue; }
    const hit = sorted.find((sym) => sym.length > 0 && text.startsWith(sym, i));
    if (!hit) {
      // Komfort: Groß-/Kleinschreibung tolerieren, wenn eindeutig
      const alt = sorted.find((sym) => text.substr(i, sym.length).toLowerCase() === sym.toLowerCase());
      if (alt && !sorted.some((s) => s !== alt && s.toLowerCase() === alt.toLowerCase())) {
        tokens.push(alt); i += alt.length; continue;
      }
      return { ok: false, tokens, position: i, rest: text.slice(i),
        message: `„${text[i]}“ gehört nicht zum Eingabealphabet Σ = {${alphabet.join(', ')}}.` };
    }
    tokens.push(hit);
    i += hit.length;
  }
  return { ok: true, tokens };
}

/** Wandelt eine Symbolfolge in Anzeigetext um (mehrstellige Symbole mit Leerzeichen getrennt). */
export function wordToString(tokens, alphabet = null) {
  if (!tokens || tokens.length === 0) return EPS;
  const multi = (alphabet ?? tokens).some((s) => s.length > 1);
  return tokens.join(multi ? ' ' : '');
}

/** Alle Wörter über Σ bis zur Länge maxLen (Breitensuche, kürzeste zuerst). */
export function* enumerateWords(alphabet, maxLen) {
  let layer = [[]];
  yield [];
  for (let len = 1; len <= maxLen; len++) {
    const next = [];
    for (const w of layer) for (const a of alphabet) { const v = [...w, a]; next.push(v); yield v; }
    layer = next;
  }
}

/** Kleiner, seedbarer Zufallsgenerator (mulberry32), damit Tests reproduzierbar sind. */
export function makeRng(seed = Date.now()) {
  let t = seed >>> 0;
  const rng = () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
  rng.int = (n) => Math.floor(rng() * n);
  rng.pick = (arr) => arr[Math.floor(rng() * arr.length)];
  rng.shuffle = (arr) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  return rng;
}
