// Ableitungs-Rallye (#/rallye): Regeln auf das linkeste Nichtterminal anwenden, bis das Zielwort dasteht.
// Ableitungsfolge (S ⇒ …) und Ableitungsbaum wachsen live. Sackgassen-Erkennung über die Engine.
// Modus „Baum“ (Mehrdeutigkeit): zwei verschiedene Ableitungsbäume für dasselbe Wort finden.
// Deep-Link: #/rallye?aufgabe=n (n = 1 …), #/rallye?demo=1 (Demo-Aufgabe im Gastmodus)
// Die fertige Ableitung prüft die Quelle (Server bzw. Demo); Punkte vergibt nur der Server. Sackgassen und die kürzeste
// Ableitungslänge rechnet die Engine im Browser (Grammatik und Zielwort sind Gegenstand der Aufgabe).

import { h, clear } from '../core/dom.js';
import { parseGrammar, derive, symbolsToString, ruleToString, tokenizeWord } from '../engine/grammar.js';
import { EPS } from '../engine/tokenize.js';
import { DerivationTree } from '../components/derivation-tree.js';

/** Aufgabe aus der Quelle für das Spiel vorbereiten (Grammatik parsen, Zielwort zerlegen, kürzeste Ableitung). */
function vorbereiten(a) {
  const g = parseGrammar(a.grammatik);
  if (!g.ok) throw new Error(`Rallye ${a.id}: ${g.errors.join(' ')}`);
  const tk = tokenizeWord(g, a.ziel);
  if (!tk.ok) throw new Error(`Rallye ${a.id}: Zielwort passt nicht zu T.`);
  const sep = a.sep ?? (g.terminals.some((t) => t.length > 1) ? ' ' : '');
  const best = derive(g, a.ziel);
  return { ...a, g, ziel: tk.tokens, sep, optimal: best.derivation ? best.derivation.length - 1 : null, modus: a.modus ?? 'ableiten' };
}

export default {
  title: 'Ableitungs-Rallye',
  mount(el, ctx) {
    const q = ctx.quelle; // Server (angemeldet) oder Demo (Gastmodus)
    let aktiv = true;
    let aufraeumen = null;
    let LISTE = [];
    const fehler = (e) => { if (aktiv) clear(el, h('p', { class: 'notice notice-error' }, e.message)); };
    clear(el, h('p', { class: 'muted' }, 'Lade …'));
    (async () => {
      LISTE = await q.liste('rallye');
      if (!aktiv) return;
      const n = Number(ctx.params.get('aufgabe'));
      const e = q.demo ? LISTE[0] : LISTE.find((x) => x.nr === n);
      if (!e) { showList(); return; }
      const d = await q.aufgabe(e.id);
      if (aktiv) aufraeumen = play({ ...vorbereiten(d.aufgabe), aufgabeId: e.id, nr: e.nr ?? 0, zustand: d.zustand });
    })().catch(fehler);
    return () => { aktiv = false; aufraeumen?.(); };

    function showList() {
      ctx.setSubtitle('Wähle Regel für Regel – immer für das linkeste Nichtterminal – bis das Zielwort dasteht.');
      clear(el,
        h('p', { class: 'lead' }, 'Die Ableitung wird mitgeschrieben (S ⇒ … ⇒ Wort), der Ableitungsbaum wächst mit. Schaffst du es in der kürzesten Ableitung?'),
        h('ol', { class: 'challenge-grid' }, LISTE.map((a) => {
          const solved = ctx.progress.isSolved('rallye', a.schluessel);
          return h('li', null, h('a', { class: ['challenge-card', solved && 'is-solved', `stufe-${a.stufe}`], href: ctx.link('rallye', { aufgabe: a.nr }) },
            h('span', { class: 'case-nr' }, `Aufgabe ${a.nr}`),
            h('span', { class: 'case-title' }, a.titel),
            h('span', { class: 'case-state' }, solved ? 'gelöst' : `${a.punkte} Punkte`)));
        })));
    }

    function play(a) {
      const g = a.g;
      ctx.setSubtitle(q.demo ? `Demo: ${a.titel} (ohne Punkte)` : `Aufgabe ${a.nr}: ${a.titel}`);
      const zielText = a.ziel.length ? a.ziel.join(a.sep) : EPS;
      const st = { root: null, history: [], steps: 0, t0: performance.now(), done: false, trees: [], timer: null };
      const baum = a.modus === 'baum';

      // ── Baum & Satzform ──
      const treeBox = h('div', { class: 'rallye-tree panel' });
      const tree = new DerivationTree(treeBox);
      const formEl = h('p', { class: 'rallye-form', 'aria-live': 'polite' });
      const derivEl = h('p', { class: 'rallye-deriv' });
      const stepsEl = h('span', { class: 'stat-value' }, '0');
      const timeEl = h('span', { class: 'stat-value' }, '0 s');
      const notice = h('div', { class: 'rallye-notice', 'aria-live': 'polite' });
      const rulesBox = h('div', { class: 'rallye-rules' });
      const savedBox = h('div', { class: 'rallye-saved' });

      const leaves = (node, out = []) => { if (!node.children?.length) { if (node.symbol.v !== EPS || node.symbol.t === 'N') out.push(node); } else node.children.forEach((c) => leaves(c, out)); return out; };
      const form = () => leaves(st.root).filter((n) => !(n.symbol.t === 'T' && n.symbol.v === EPS)).map((n) => n.symbol);
      const nextNode = () => leaves(st.root).find((n) => n.symbol.t === 'N');

      function reset() {
        st.root = { symbol: { t: 'N', v: g.start }, children: [] };
        st.history = []; st.steps = 0; st.t0 = performance.now();
        clear(notice);
        render();
      }

      function apply(rule) {
        const node = nextNode();
        if (!node || st.done) return;
        node.children = rule.rhs.length ? rule.rhs.map((s) => ({ symbol: { t: s.t, v: s.v }, children: [] })) : [{ symbol: { t: 'T', v: EPS }, children: [] }];
        node.rule = rule;
        st.history.push(node);
        st.steps++;
        render();
        check();
      }

      function undo() {
        const node = st.history.pop();
        if (!node) return;
        node.children = []; delete node.rule;
        st.steps = Math.max(0, st.steps - 1);
        clear(notice);
        render();
      }

      function render() {
        const f = form();
        const next = nextNode();
        tree.set(st.root, { next });
        // Satzform mit hervorgehobenem linkesten Nichtterminal
        let marked = false;
        clear(formEl, h('span', { class: 'muted' }, 'Satzform: '), f.length === 0 ? h('span', { class: 'word' }, EPS) : f.map((s, i) => {
          const isNext = !marked && s.t === 'N'; if (isNext) marked = true;
          return [i > 0 && a.sep ? ' ' : null, h('span', { class: ['sym', s.t === 'N' ? 'sym-n' : 'sym-t', isNext && 'is-next'] }, String(s.v))];
        }));
        // Ableitungsfolge
        // Ableitungsfolge aus der History rekonstruieren (Linksableitung)
        const forms = [[{ t: 'N', v: g.start }]];
        let cur = forms[0];
        for (const node of st.history) {
          const idx = cur.findIndex((s) => s.t === 'N');
          cur = [...cur.slice(0, idx), ...node.rule.rhs, ...cur.slice(idx + 1)];
          forms.push(cur);
        }
        clear(derivEl, forms.map((fm, i) => [i > 0 ? h('span', { class: 'trace-arrow' }, ' ⇒ ') : null, h('span', { class: 'word' }, symbolsToString(fm, a.sep))]));
        stepsEl.textContent = String(st.steps);
        // Regel-Buttons
        clear(rulesBox, g.nonterminals.map((N) => {
          const rules = g.byLhs.get(N) ?? [];
          const active = next?.symbol.v === N;
          return h('div', { class: ['rule-group', active && 'is-active'] },
            h('span', { class: 'rule-lhs word' }, `${N} →`),
            h('div', { class: 'rule-buttons' }, rules.map((r) => h('button', { type: 'button', class: ['btn btn-small rule-btn', active && 'is-enabled'], disabled: !active || st.done, 'aria-label': ruleToString(r), onclick: () => apply(r) }, symbolsToString(r.rhs, a.sep)))));
        }));
      }

      function check() {
        const f = form();
        const open = f.some((s) => s.t === 'N');
        if (!open) {
          const ok = f.length === a.ziel.length && f.every((s, i) => s.v === a.ziel[i]);
          if (ok) return finish();
          clear(notice, h('div', { class: 'notice notice-error' }, h('p', null, h('strong', null, 'Das ist ein anderes Wort. '), 'Alle Nichtterminale sind ersetzt, aber das Ziel ist nicht erreicht. Nimm Schritte zurück.')));
          return;
        }
        const r = derive(g, a.ziel, { from: f, maxNodes: 40000 });
        if (r.member === false) clear(notice, h('div', { class: 'notice notice-warn' }, h('p', null, h('strong', null, 'Sackgasse: '), 'Aus dieser Satzform kann das Zielwort nicht mehr entstehen. Geh einen Schritt zurück.')));
        else clear(notice);
      }

      async function finish() {
        const seq = st.history.map((nd) => ruleToString(nd.rule)).join(' ; ');
        const regeln = st.history.map((nd) => [nd.rule.lhs, g.byLhs.get(nd.rule.lhs).indexOf(nd.rule)]);
        const secs = Math.round((performance.now() - st.t0) / 1000);
        if (baum) {
          if (st.trees.length === 0) {
            st.trees.push(seq); st.regeln = regeln;
            clear(savedBox, h('h3', null, 'Baum 1 gespeichert'), h('div', { class: 'tree-mini' }, tree.svgClone()),
              h('p', { class: 'muted' }, 'Jetzt dasselbe Wort noch einmal ableiten – aber mit einem anderen Baum. Wähle an einer Stelle eine andere Regel.'));
            clear(notice, h('div', { class: 'notice notice-success' }, h('p', null, h('strong', null, 'Ziel erreicht – Baum 1 steht. '), 'Nochmal von vorn: Finde einen zweiten, verschiedenen Ableitungsbaum.'),
              h('div', { class: 'start-actions' }, h('button', { type: 'button', class: 'btn btn-primary', onclick: () => reset() }, 'Zweiten Baum ableiten'))));
            return;
          }
          if (st.trees.includes(seq)) {
            clear(notice, h('div', { class: 'notice notice-warn' }, h('p', null, h('strong', null, 'Derselbe Baum. '), 'Die Regelfolge ist identisch mit Baum 1. Wähle an einer Stelle eine andere Alternative – zum Beispiel, wo zwei Regeln dasselbe Terminal beginnen.'),
              h('div', { class: 'start-actions' }, h('button', { type: 'button', class: 'btn', onclick: () => reset() }, 'Nochmal versuchen'))));
            return;
          }
          savedBox.append(h('h3', null, 'Baum 2'), h('div', { class: 'tree-mini' }, tree.svgClone()));
        }
        let res;
        try { res = await q.pruefen(a.aufgabeId, baum ? { baeume: [st.regeln, regeln] } : { regeln }); } catch (e) { clear(notice, h('p', { class: 'notice notice-error' }, e.message)); return; }
        if (!res.rueckmeldung.richtig) { clear(notice, h('p', { class: 'notice notice-error' }, 'Die Ableitung wurde nicht anerkannt. Prüfe die Schritte und versuche es noch einmal.')); return; }
        st.done = true;
        clearInterval(st.timer);
        const perfect = !baum && a.optimal != null && st.steps <= a.optimal;
        if (res.punkteErhalten) ctx.toast(`+${res.punkteErhalten} Punkte`, { type: 'success' });
        const next = q.demo ? null : LISTE.find((x) => x.nr === a.nr + 1);
        clear(notice, h('div', { class: 'notice notice-success' },
          h('p', null, h('strong', null, baum ? 'Mehrdeutigkeit gezeigt! ' : 'Ziel erreicht! '),
            baum ? `Zwei verschiedene Ableitungsbäume für „${zielText}“ – die Grammatik ist mehrdeutig.` : `${st.steps} Schritte in ${secs} s.${a.optimal != null ? perfect ? ' Das ist die kürzeste Ableitung!' : ` Kürzeste Ableitung: ${a.optimal} Schritte.` : ''}`),
          h('div', { class: 'start-actions' },
            next ? h('a', { class: 'btn btn-primary', href: ctx.link('rallye', { aufgabe: next.nr }) }, `Weiter zu Aufgabe ${next.nr}`) : null,
            h('button', { type: 'button', class: 'btn', onclick: () => { st.done = false; st.trees = []; clear(savedBox); st.timer = setInterval(tick, 1000); reset(); } }, 'Nochmal'),
            q.demo ? h('a', { class: 'btn btn-ghost', href: ctx.link('gast') }, 'Weitere Demo-Aufgaben') : h('a', { class: 'btn btn-ghost', href: ctx.link('rallye') }, 'Alle Aufgaben'))));
        render();
      }

      const tick = () => { if (!st.done) timeEl.textContent = `${Math.round((performance.now() - st.t0) / 1000)} s`; };
      st.timer = setInterval(tick, 1000);

      const grammarPanel = h('div', { class: 'rallye-grammar panel' },
        h('p', { class: 'task-text' }, a.kontext),
        h('p', null, h('strong', null, 'Zielwort: '), h('code', { class: 'word rallye-ziel' }, zielText)),
        h('div', { class: 'rallye-meta' },
          h('span', null, 'N = {', g.nonterminals.join(', '), '}'), h('span', null, 'T = {', g.terminals.join(', '), '}'), h('span', null, `Startsymbol: ${g.start}`)),
        h('h3', null, 'Regeln – wähle für das linkeste Nichtterminal'),
        rulesBox);

      clear(el,
        h('div', { class: 'rallye-hud' },
          h('span', { class: 'stat' }, h('span', { class: 'stat-label' }, 'Schritte'), stepsEl),
          h('span', { class: 'stat' }, h('span', { class: 'stat-label' }, 'Zeit'), timeEl),
          a.optimal != null && !baum ? h('span', { class: 'stat' }, h('span', { class: 'stat-label' }, 'Minimum'), h('span', { class: 'stat-value' }, String(a.optimal))) : null,
          h('span', { class: 'rallye-actions' },
            h('button', { type: 'button', class: 'btn btn-small', onclick: () => undo() }, 'Schritt zurück'),
            h('button', { type: 'button', class: 'btn btn-small btn-ghost', onclick: () => reset() }, 'Neu beginnen'))),
        h('div', { class: 'rallye-layout' },
          h('div', { class: 'rallye-left' }, grammarPanel),
          h('div', { class: 'rallye-right' },
            h('div', { class: 'panel' }, formEl, derivEl, notice),
            treeBox, savedBox)),
        q.demo ? h('p', { class: 'notice gast-hinweis' }, h('strong', null, 'Demo. '), 'Eine eigene Grammatik zum Ausprobieren – ohne Punkte. Die 13 Rallye-Aufgaben gibt es nach der Anmeldung.') : h('nav', { class: 'case-nav', 'aria-label': 'Aufgaben' },
          a.nr > 1 ? h('a', { class: 'btn btn-ghost', href: ctx.link('rallye', { aufgabe: a.nr - 1 }) }, `‹ Aufgabe ${a.nr - 1}`) : h('span'),
          h('a', { class: 'btn btn-ghost', href: ctx.link('rallye') }, 'Alle Aufgaben'),
          a.nr < LISTE.length ? h('a', { class: 'btn btn-ghost', href: ctx.link('rallye', { aufgabe: a.nr + 1 }) }, `Aufgabe ${a.nr + 1} ›`) : h('span')));
      reset();
      return () => clearInterval(st.timer);
    }
  },
};
