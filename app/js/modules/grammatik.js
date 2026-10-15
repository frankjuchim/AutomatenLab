// Grammatik-Tester (#/grammatik): eigene Grammatik in Abi-Notation eingeben, prüfen, klassifizieren,
// Wörter erzeugen, Wörter ableiten, als Automat anzeigen (rechtsregulär), zwei Grammatiken vergleichen.
// Challenges „Entwirf eine Grammatik für …“ mit automatischer Prüfung gegen ein Referenzprädikat.
// Deep-Links: #/grammatik?challenge=n (n = 1 …), #/grammatik?modus=frei, #/grammatik?demo=1 (Demo-Challenge)
// Challenges prüft die Quelle (Server bzw. Demo) – Prädikat, Tipp und Musterlösung kennt nur sie; Punkte vergibt nur der
// Server. Der freie Modus (Klassifikation, Wörter erzeugen, Automat, Vergleich) läuft vollständig im Browser.

import { h, clear, quote } from '../core/dom.js';
import { parseGrammar, derive, derivationToString, isRightRegular, shortestWords, randomWord, rightRegularToNFA, languageUpTo } from '../engine/grammar.js';
import { nfa, subsetConstruction } from '../engine/nfa.js';
import { renameStates, normalizeDFA } from '../engine/dfa.js';
import { enumerateWords, makeRng } from '../engine/tokenize.js';
import { GraphView } from '../components/graph-view.js';

const BEISPIEL = 'S → aSb | ab';

export default {
  title: 'Grammatik-Tester',
  mount(el, ctx) {
    const q = ctx.quelle; // Server (angemeldet) oder Demo (Gastmodus)
    const p = ctx.params;
    if (p.get('modus') === 'frei') return editor(null);
    let aktiv = true;
    let aufraeumen = null;
    let CHALLENGES = [];
    const fehler = (e) => { if (aktiv) clear(el, h('p', { class: 'notice notice-error' }, e.message)); };
    clear(el, h('p', { class: 'muted' }, 'Lade …'));
    (async () => {
      // Challenge der Lehrkraft (Aufgaben-Editor, #/grammatik?eigen=<nr>), ohne Punkte
      const eigen = p.get('eigen');
      if (!q.demo && /^\d{1,9}$/.test(eigen ?? '')) {
        const d = await q.aufgabe(`eigen:${eigen}`);
        if (aktiv) aufraeumen = editor({ ...d.aufgabe, aufgabeId: `eigen:${eigen}`, nr: 0, eigen: true, zustand: d.zustand, loesung: d.loesung ?? null });
        return;
      }
      CHALLENGES = await q.liste('grammatik');
      if (!aktiv) return;
      const n = Number(p.get('challenge'));
      const e = q.demo ? CHALLENGES[0] : CHALLENGES.find((x) => x.nr === n);
      if (!e) { showList(); return; }
      const d = await q.aufgabe(e.id);
      if (aktiv) aufraeumen = editor({ ...d.aufgabe, aufgabeId: e.id, nr: e.nr ?? 0, zustand: d.zustand, loesung: d.loesung ?? null });
    })().catch(fehler);
    return () => { aktiv = false; aufraeumen?.(); };

    function showList() {
      ctx.setSubtitle('Grammatik eingeben – Regeln prüfen, Wörter erzeugen, Wörter ableiten, Automat ableiten.');
      clear(el,
        h('section', { class: 'stufe-section sandbox-teaser panel' },
          h('h2', null, 'Freier Modus'),
          h('p', null, 'Eigene Grammatik in Abi-Notation (S → aSb | ab). Klassifikation rechtsregulär/kontextfrei, Wörter erzeugen und prüfen, Vergleich zweier Grammatiken – ideal zur Selbstkontrolle.'),
          h('a', { class: 'btn btn-primary', href: ctx.link('grammatik', { modus: 'frei' }) }, 'Freien Modus öffnen')),
        h('section', { class: 'stufe-section' },
          h('div', { class: 'stufe-head' }, h('h2', null, 'Challenges: Entwirf eine Grammatik für …'), h('span', { class: 'muted' }, `${CHALLENGES.filter((c) => ctx.progress.isSolved('grammatik', c.schluessel)).length} von ${CHALLENGES.length} gelöst`)),
          h('p', { class: 'muted' }, 'Geprüft wird die erzeugte Sprache (alle Wörter bis zu einer Länge) – jede richtige Grammatik zählt.'),
          h('ol', { class: 'challenge-grid' }, CHALLENGES.map((c) => {
            const solved = ctx.progress.isSolved('grammatik', c.schluessel);
            return h('li', null, h('a', { class: ['challenge-card', solved && 'is-solved', `stufe-${c.stufe}`], href: ctx.link('grammatik', { challenge: c.nr }) },
              h('span', { class: 'case-nr' }, `Challenge ${c.nr}`),
              h('span', { class: 'case-title' }, c.titel),
              h('span', { class: 'case-state' }, solved ? 'gelöst' : `${c.punkte} Punkte`)));
          }))));
    }

    function editor(c) {
      ctx.setSubtitle(c ? (q.demo ? `Demo-Challenge: ${c.titel} (ohne Punkte)` : c.eigen ? `Aufgabe deiner Lehrkraft: ${c.titel} (ohne Punkte)` : `Challenge ${c.nr}: ${c.titel}`) : 'Freier Modus');
      let zustand = c?.zustand ?? null;
      let loesung = c?.loesung ?? null;
      // Vorschau für Lehrkräfte (?vorschau=1): Lösung gleich einsetzen, sobald die Aufgabe aufgebaut ist
      if (q.vorschau && loesung) setTimeout(() => { if (aktiv) aufdecken(); }, 0);
      const draftKey = `grammatik:${c ? c.id : 'frei'}`;
      let g = null; let attempts = 0; let parseTimer = null; let saveTimer = null;
      const gvs = [];

      const ta = h('textarea', { class: 'grammar-input', rows: 6, spellcheck: 'false', autocapitalize: 'off', 'aria-label': 'Grammatik', placeholder: `${BEISPIEL}\nA → aB | ε` });
      ta.value = ctx.progress.getDraft(draftKey) ?? (c ? '' : BEISPIEL);
      const startSel = h('select', { class: 'delta-select', 'aria-label': 'Startsymbol', onchange: () => parse() });
      const info = h('div', { class: 'grammar-info', 'aria-live': 'polite' });
      const classBox = h('div', { class: 'grammar-class' });

      function parse() {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => ctx.progress.setDraft(draftKey, ta.value), 400);
        const text = ta.value;
        const chosen = startSel.value;
        g = parseGrammar(text);
        if (chosen && g.nonterminals.includes(chosen) && chosen !== g.start) g = parseGrammar(`${text}\nStart: ${chosen}`);
        // Startsymbol-Auswahl
        const opts = g.nonterminals;
        clear(startSel, opts.map((N) => h('option', { value: N, selected: N === g.start }, N)));
        startSel.disabled = opts.length < 2;
        if (!text.trim()) { clear(info, h('p', { class: 'muted' }, 'Gib Regeln ein, z. B. S → aSb | ab. Mehrere Alternativen mit |, ε oder eps für das leere Wort.')); clear(classBox); return; }
        if (!g.ok) {
          clear(info, h('div', { class: 'notice notice-error' }, h('p', null, h('strong', null, 'Die Grammatik hat Fehler:')), h('ul', null, g.errors.map((e) => h('li', null, e)))));
          clear(classBox);
          return;
        }
        const unproductive = g.nonterminals.filter((N) => !g.productive.includes(N));
        clear(info,
          h('div', { class: 'grammar-sets' },
            h('p', null, h('strong', null, 'N = '), h('span', { class: 'word' }, `{${g.nonterminals.join(', ')}}`)),
            h('p', null, h('strong', null, 'T = '), h('span', { class: 'word' }, `{${g.terminals.join(', ')}}`)),
            h('p', null, h('strong', null, 'Startsymbol: '), h('span', { class: 'word' }, g.start)),
            h('p', null, h('strong', null, 'P: '), `${g.rules.length} Regeln`)),
          unproductive.length ? h('p', { class: 'notice notice-warn' }, `Aus ${unproductive.join(', ')} entsteht nie ein Terminalwort (unproduktiv) – prüfe die Regeln.`) : null,
          !(g.minLen.get(g.start) < Infinity) ? h('p', { class: 'notice notice-error' }, 'Die Sprache ist leer: Vom Startsymbol aus entsteht nie ein Wort aus Terminalen.') : null);
        const rr = isRightRegular(g);
        clear(classBox, rr.regular
          ? h('div', { class: 'notice notice-success' }, h('p', null, h('strong', null, 'Rechtsregulär (Typ 3). '), 'Alle Regeln haben die Form A → aB, A → a oder A → ε. Die Sprache ist regulär – ein endlicher Automat existiert.'))
          : h('div', { class: 'notice' }, h('p', null, h('strong', null, 'Kontextfrei (Typ 2), nicht rechtsregulär. '), 'Diese Regeln verletzen die rechtsreguläre Form:'),
            h('ul', null, rr.violations.slice(0, 6).map((v) => h('li', null, h('code', { class: 'word' }, v.rule), ` – ${v.reason}`))),
            h('p', { class: 'muted' }, 'Achtung: Daraus folgt nicht, dass die Sprache nicht regulär ist – vielleicht gibt es eine andere, rechtsreguläre Grammatik dafür.')));
        refreshTools();
      }
      ta.addEventListener('input', () => { clearTimeout(parseTimer); parseTimer = setTimeout(parse, 250); });

      // ── Werkzeuge ──
      const genOut = h('div', { class: 'gen-out', 'aria-live': 'polite' });
      const genBtn = h('button', { type: 'button', class: 'btn btn-small', onclick: () => generate() }, 'Kürzeste Wörter');
      const rndBtn = h('button', { type: 'button', class: 'btn btn-small', onclick: () => generate(true) }, 'Zufallswörter');
      function generate(random = false) {
        if (!g?.ok) return;
        const sep = g.terminals.some((t) => t.length > 1) ? ' ' : '';
        if (random) {
          const rng = makeRng();
          const ws = []; const seen = new Set();
          for (let i = 0; i < 40 && ws.length < 8; i++) { const r = randomWord(g, { rng, maxLen: 14 }); if (r && !seen.has(r.word.join('\u0001'))) { seen.add(r.word.join('\u0001')); ws.push(r.word); } }
          clear(genOut, ws.length ? h('ul', { class: 'word-list' }, ws.map((w) => h('li', null, h('code', { class: 'word' }, w.length ? w.join(sep) : 'ε')))) : h('p', { class: 'muted' }, 'Kein Wort erzeugbar.'));
        } else {
          const ws = shortestWords(g, { count: 12, maxLen: 14 });
          clear(genOut, ws.length ? h('ul', { class: 'word-list' }, ws.map((w) => h('li', null, h('code', { class: 'word' }, w.length ? w.join(sep) : 'ε')))) : h('p', { class: 'muted' }, 'Kein Wort erzeugbar.'),
            h('p', { class: 'muted' }, 'Die 12 kürzesten Wörter (bei gleicher Länge in Suchreihenfolge).'));
        }
      }

      const wordIn = h('input', { type: 'text', id: 'gr-word', class: 'word-input', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', placeholder: 'z. B. aabb' });
      const wordOut = h('div', { class: 'check-out', 'aria-live': 'polite' });
      const wordForm = h('form', { class: 'word-form', onsubmit: (e) => { e.preventDefault(); checkWord(); } },
        h('label', { for: 'gr-word' }, 'Wort prüfen (Ableitung finden)'),
        h('div', { class: 'input-row' }, wordIn, h('button', { type: 'submit', class: 'btn btn-small' }, 'Ableiten')), wordOut);
      function checkWord() {
        if (!g?.ok) { wordOut.textContent = 'Erst die Grammatik korrigieren.'; return; }
        const r = derive(g, wordIn.value);
        const sep = g.terminals.some((t) => t.length > 1) ? ' ' : '';
        if (!r.ok) { clear(wordOut, h('p', { class: 'notice notice-error' }, r.error)); return; }
        const shown = quote(r.tokens.length ? r.tokens.join(sep) : '');
        if (r.member) clear(wordOut, h('div', { class: 'notice notice-success' }, h('p', null, h('strong', null, `${shown} ist ableitbar `), `(${r.derivation.length - 1} Schritte):`), h('p', { class: 'word deriv' }, derivationToString(r.derivation, sep))));
        else if (r.member === false) clear(wordOut, h('p', { class: 'notice notice-error' }, `${shown} ist nicht ableitbar – es gehört nicht zur Sprache der Grammatik.`));
        else clear(wordOut, h('p', { class: 'notice notice-warn' }, `${shown}: nicht ableitbar (bis zur Suchgrenze). Die Suche wurde abgebrochen – bei sehr langen Wörtern oder vielen ε-Regeln keine sichere Aussage.`));
      }

      const autoBox = h('div', { class: 'auto-box' });
      const autoBtn = h('button', { type: 'button', class: 'btn btn-small', onclick: () => showAutomaton() }, 'Als Automat anzeigen');
      async function showAutomaton() {
        if (!g?.ok) return;
        const rr = isRightRegular(g);
        clear(autoBox);
        if (!rr.regular) { autoBox.append(h('p', { class: 'notice notice-warn' }, 'Nur für rechtsreguläre Grammatiken: Nichtterminal → Zustand, A → aB → Kante, A → ε → Endzustand, A → a → Kante in einen zusätzlichen Endzustand.')); return; }
        const N = nfa(rightRegularToNFA(g));
        const dead = N.states.filter((s) => s !== g.start && !N.accepting.includes(s) && Object.keys(N.delta[s] ?? {}).length === 0);
        autoBox.append(h('p', { class: 'muted' }, 'Übersetzung: Nichtterminal → Zustand, Startsymbol → Startzustand, A → aB → Kante A –a→ B, A → ε → A ist Endzustand, A → a → Kante in den Endzustand S_end. Das Ergebnis ist im Allgemeinen ein NEA.'));
        const box1 = h('div'); autoBox.append(box1);
        const gv1 = new GraphView(box1, { label: 'NEA aus der Grammatik' }); gvs.push(gv1);
        await gv1.render(N);
        if (dead.length) autoBox.append(h('p', { class: 'muted' }, `Hinweis: ${dead.join(', ')} hat keine ausgehenden Kanten und ist kein Endzustand – wirkt wie ein Fehlerzustand.`));
        const dfaBtn = h('button', { type: 'button', class: 'btn btn-small btn-ghost', onclick: async () => {
          dfaBtn.disabled = true;
          const D = renameStates(normalizeDFA(subsetConstruction(N).dfa));
          const box2 = h('div'); autoBox.append(h('p', { class: 'muted' }, 'DEA per Teilmengenkonstruktion (Zustände umbenannt):'), box2);
          const gv2 = new GraphView(box2, { label: 'DEA aus dem NEA' }); gvs.push(gv2);
          await gv2.render({ ...D, implicitError: true });
        } }, 'Auch als DEA (Teilmengenkonstruktion)');
        autoBox.append(h('p', null, dfaBtn));
      }

      // Vergleich
      const cmpTa = h('textarea', { class: 'grammar-input', rows: 4, spellcheck: 'false', autocapitalize: 'off', 'aria-label': 'Zweite Grammatik', placeholder: 'Zweite Grammatik, z. B. S → aSb | ε' });
      const cmpLen = h('select', { class: 'delta-select', 'aria-label': 'Vergleichslänge' }, [4, 5, 6, 7, 8].map((k) => h('option', { value: k, selected: k === 6 }, `bis Länge ${k}`)));
      const cmpOut = h('div', { class: 'cmp-out', 'aria-live': 'polite' });
      const cmpBtn = h('button', { type: 'button', class: 'btn btn-small', onclick: () => compare() }, 'Vergleichen');
      function compare() {
        if (!g?.ok) { cmpOut.textContent = 'Erst die erste Grammatik korrigieren.'; return; }
        const g2 = parseGrammar(cmpTa.value);
        if (!g2.ok) { clear(cmpOut, h('div', { class: 'notice notice-error' }, h('p', null, 'Zweite Grammatik:'), h('ul', null, g2.errors.map((e) => h('li', null, e))))); return; }
        const L = Number(cmpLen.value);
        const l1 = languageUpTo(g, L); const l2 = languageUpTo(g2, L);
        const k1 = new Set(l1.words.map((w) => w.join('\u0001'))); const k2 = new Set(l2.words.map((w) => w.join('\u0001')));
        const only1 = l1.words.filter((w) => !k2.has(w.join('\u0001'))).slice(0, 8);
        const only2 = l2.words.filter((w) => !k1.has(w.join('\u0001'))).slice(0, 8);
        const sep = [...g.terminals, ...g2.terminals].some((t) => t.length > 1) ? ' ' : '';
        const show = (ws) => h('span', null, ws.map((w) => h('code', { class: 'word' }, w.length ? w.join(sep) : 'ε')));
        const hint = (!l1.complete || !l2.complete) ? h('p', { class: 'muted' }, 'Hinweis: Suchgrenze erreicht – Aussage nicht vollständig sicher.') : null;
        if (!only1.length && !only2.length) clear(cmpOut, h('div', { class: 'notice notice-success' }, h('p', null, h('strong', null, 'Gleiche Wörter bis Länge ' + L + '. '), `Beide Grammatiken erzeugen dieselben ${l1.words.length} Wörter bis zu dieser Länge.`), hint));
        else clear(cmpOut, h('div', { class: 'notice notice-error' },
          h('p', null, h('strong', null, 'Unterschied gefunden.')),
          only1.length ? h('p', null, 'Nur Grammatik 1 erzeugt: ', show(only1)) : null,
          only2.length ? h('p', null, 'Nur Grammatik 2 erzeugt: ', show(only2)) : null, hint));
      }

      function refreshTools() { clear(genOut); clear(autoBox); }

      // ── Challenge-Prüfung ──
      const checkResult = h('div', { class: 'check-result', 'aria-live': 'polite' });
      async function checkChallenge() {
        if (!g?.ok) { clear(checkResult, h('p', { class: 'notice notice-error' }, 'Die Grammatik hat noch Fehler (siehe oben).')); return; }
        attempts++;
        let r;
        try { r = await q.pruefen(c.aufgabeId, { grammatik: ta.value, start: startSel.value || undefined }); } catch (e) { clear(checkResult, h('p', { class: 'notice notice-error' }, e.message)); return; }
        zustand = r.zustand ?? zustand;
        if (r.loesung) loesung = r.loesung;
        const res = r.rueckmeldung;
        const sep = c.alphabet.some((t) => t.length > 1) ? ' ' : '';
        const show = (w) => quote(w.length ? w.join(sep) : '');
        if (res.richtig) {
          if (r.punkteErhalten) ctx.toast(`+${r.punkteErhalten} Punkte`, { type: 'success' });
          const next = q.demo ? null : CHALLENGES.find((x) => x.nr === c.nr + 1);
          clear(checkResult, h('div', { class: 'notice notice-success' },
            h('p', null, h('strong', null, 'Richtig! '), `Deine Grammatik erzeugt genau die gesuchten Wörter (geprüft bis Länge ${res.maxLen}: ${res.anzahl} Wörter)${res.regulaer ? ' und ist rechtsregulär' : ''}.`),
            h('div', { class: 'start-actions' },
              next ? h('a', { class: 'btn btn-primary', href: ctx.link('grammatik', { challenge: next.nr }) }, `Weiter zu Challenge ${next.nr}`) : null,
              loesung ? h('button', { type: 'button', class: 'btn', onclick: () => showSolution() }, 'Musterlösung vergleichen') : null,
              q.demo ? h('a', { class: 'btn btn-ghost', href: ctx.link('gast') }, 'Weitere Demo-Aufgaben') : h('a', { class: 'btn btn-ghost', href: ctx.link('grammatik') }, 'Alle Challenges'))));
          return;
        }
        let body;
        if (res.grund === 'alphabet') body = h('p', null, `Die Terminale ${res.fremd.map((t) => `„${t}“`).join(', ')} gehören nicht zu Σ = {${c.alphabet.join(', ')}}.`);
        else if (res.grund === 'regulaer') body = h('div', null, h('p', null, 'Die Sprache stimmt – aber die Grammatik ist noch nicht rechtsregulär. Diese Regeln stören:'), h('ul', null, res.violations.slice(0, 5).map((v) => h('li', null, h('code', { class: 'word' }, v.rule), ` – ${v.reason}`))));
        else body = h('p', null, res.zuviel ? `Deine Grammatik erzeugt ${show(res.zuviel)} – das gehört nicht zur Sprache.` : `Deine Grammatik erzeugt ${show(res.fehlt)} nicht – das gehört aber zur Sprache.`);
        clear(checkResult, h('div', { class: 'notice notice-error' }, h('p', null, h('strong', null, 'Noch nicht. ')), body,
          h('p', { class: 'muted' }, !q.demo && !c.eigen && zustand?.status === 'offen' ? `Versuch ${zustand.fehlversuche} – jetzt noch ${zustand.moeglich} Punkte möglich.` : `Versuch ${attempts}.`),
          attempts >= 3 ? h('p', null, h('button', { type: 'button', class: 'btn btn-small btn-ghost', onclick: () => aufdecken() }, 'Musterlösung zeigen')) : null));
      }
      /** „Musterlösung zeigen“: danach gibt es für diese Challenge keine Punkte mehr. */
      async function aufdecken() {
        if (!loesung) {
          if (!q.demo && zustand?.status === 'offen' && !window.confirm('Wenn du die Musterlösung ansiehst, bekommst du für diese Challenge keine Punkte mehr. Trotzdem anzeigen?')) return;
          try { const r = await q.aufdecken(c.aufgabeId); zustand = r.zustand; loesung = r.loesung; } catch (e) { ctx.toast(e.message, { type: 'error' }); return; }
        }
        showSolution();
      }
      function showSolution() {
        clear(checkResult, h('div', { class: 'notice' }, h('p', null, h('strong', null, 'Eine mögliche Lösung: ')), h('pre', { class: 'word grammar-pre' }, loesung.musterloesung), h('p', { class: 'muted' }, 'Es gibt viele richtige Grammatiken – geprüft wird nur die Sprache.'),
          h('button', { type: 'button', class: 'btn btn-small', onclick: () => { ta.value = loesung.musterloesung; parse(); } }, 'In den Editor übernehmen')));
      }
      /** Tipp von der Quelle (kostet Punkte, Vertrag §9). */
      const tippBox = h('div', { class: 'tipp' });
      function zeigeTipp() {
        const t = zustand?.tipps ?? [];
        clear(tippBox, t.length ? h('p', null, h('strong', null, 'Tipp: '), t[0])
          : c.tippsAnzahl ? h('button', { type: 'button', class: 'btn btn-small btn-ghost', onclick: async () => {
            try { zustand = (await q.tipp(c.aufgabeId)).zustand; } catch (e) { ctx.toast(e.message, { type: 'error' }); return; }
            zeigeTipp();
          } }, q.demo || c.eigen || zustand?.status !== 'offen' ? 'Tipp anzeigen' : 'Tipp anzeigen (kostet Punkte)') : null);
      }
      if (c) zeigeTipp();

      const taskPanel = c ? h('div', { class: 'bench-task panel' },
        h('p', { class: 'task-text' }, c.aufgabe),
        h('div', { class: 'task-side' },
          h('p', { class: 'sigma' }, `Σ = {${c.alphabet.join(', ')}}`),
          h('div', { class: 'examples' },
            h('p', null, h('span', { class: 'ex-label ex-yes' }, 'gehört dazu'), ' ', c.beispiele.ja.map((w) => h('code', { class: 'word' }, w))),
            h('p', null, h('span', { class: 'ex-label ex-no' }, 'gehört nicht dazu'), ' ', c.beispiele.nein.map((w) => h('code', { class: 'word' }, w)))),
          tippBox)) : null;

      const notation = h('details', { class: 'tipp notation-help' }, h('summary', null, 'Schreibweise'),
        h('ul', null,
          h('li', null, 'Eine Regel je Zeile: ', h('code', { class: 'word' }, 'S → aSb | ab'), ' (auch ', h('code', { class: 'word' }, '->'), '). Alternativen mit |.'),
          h('li', null, 'Nichtterminale: Großbuchstaben (A, B, S1) oder <Name>. Terminale: Kleinbuchstaben, Ziffern, Sonderzeichen.'),
          h('li', null, 'Leeres Wort: ε oder eps. Mehrstellige Terminale deklarieren: ', h('code', { class: 'word' }, 'T = {la, le, lu}')),
          h('li', null, 'Startsymbol: linke Seite der ersten Regel (oder unten wählen).')));

      clear(el, taskPanel,
        h('div', { class: 'bench gr-bench' },
          h('div', { class: 'bench-left' },
            h('div', { class: 'panel' },
              h('label', { for: 'gr-ta' }, 'Produktionsregeln P'), h(ta, { id: 'gr-ta' }),
              h('div', { class: 'input-row gr-start' }, h('label', { for: 'gr-start' }, 'Startsymbol'), h(startSel, { id: 'gr-start' })),
              notation, info, classBox,
              c ? h('div', { class: 'check-row' }, h('button', { type: 'button', class: 'btn btn-primary btn-large', onclick: () => checkChallenge() }, 'Prüfen'), zustand && zustand.status !== 'offen' && !q.demo ? h('span', { class: 'muted' }, zustand.status === 'geloest' ? 'Schon gelöst.' : 'Musterlösung angesehen – Punkte gibt es hier nicht mehr.') : null) : null,
              checkResult)),
          h('div', { class: 'bench-right' },
            h('div', { class: 'panel' }, h('h3', null, 'Wörter erzeugen'), h('div', { class: 'editor-actions' }, genBtn, rndBtn), genOut),
            h('div', { class: 'panel' }, wordForm),
            h('div', { class: 'panel' }, h('h3', null, 'Grammatik → Automat'), h('p', { class: 'muted' }, 'Bei rechtsregulären Grammatiken: Nichtterminal = Zustand, Regel = Kante.'), h('p', null, autoBtn), autoBox),
            h('div', { class: 'panel' }, h('h3', null, 'Vergleichen'), h('p', { class: 'muted' }, 'Erzeugen zwei Grammatiken dieselben Wörter? Hilft beim Selbstkontrollieren eigener Lösungen.'),
              cmpTa, h('div', { class: 'editor-actions' }, cmpLen, cmpBtn), cmpOut))),
        c && q.demo ? h('p', { class: 'notice gast-hinweis' }, h('strong', null, 'Demo. '), 'Eine eigene Challenge zum Ausprobieren – ohne Punkte. Die elf Challenges gibt es nach der Anmeldung.')
          : c ? h('nav', { class: 'case-nav', 'aria-label': 'Challenges' },
          c.nr > 1 ? h('a', { class: 'btn btn-ghost', href: ctx.link('grammatik', { challenge: c.nr - 1 }) }, `‹ Challenge ${c.nr - 1}`) : h('span'),
          h('a', { class: 'btn btn-ghost', href: ctx.link('grammatik') }, 'Alle Challenges'),
          c.nr < CHALLENGES.length ? h('a', { class: 'btn btn-ghost', href: ctx.link('grammatik', { challenge: c.nr + 1 }) }, `Challenge ${c.nr + 1} ›`) : h('span'))
          : h('nav', { class: 'case-nav' }, h('a', { class: 'btn btn-ghost', href: ctx.link('grammatik') }, '‹ Übersicht')));
      parse();
      return () => { clearTimeout(parseTimer); clearTimeout(saveTimer); ctx.progress.setDraft(draftKey, ta.value); gvs.forEach((v) => v.destroy()); };
    }
  },
};
