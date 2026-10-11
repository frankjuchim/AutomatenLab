import os as _os_mat
__MAT = _os_mat.path.abspath(_os_mat.path.join(_os_mat.path.dirname(__file__), '../..'))  # Wurzel: materials/
"""gtools.py – eigene Hilfsfunktionen für Welt C (DS11–DS14), aufbauend auf lib/automata.py.

* Ableitungsbaum aus einer (Links-)Ableitung erzeugen und mit Graphviz zeichnen
* Sprache einer Grammatik bis zu einer Wortlänge aufzählen (Verifikation gegen Prädikat)
* Anzahl der Linksableitungen zählen (Mehrdeutigkeit)
* rechtsreguläre Grammatik → NEA → DEA (Teilmengenkonstruktion)
* DEA → rechtsreguläre Grammatik (Übersetzungsrezept)
* Abi-Darstellung einer Grammatik (N, T, Startsymbol, Produktionsregeln)
"""
import sys, os, subprocess, itertools, json
sys.path.insert(0, (__MAT + '/lib'))
from automata import Grammar, DFA, NFA, check, words, EPS, TEAL, OCKER, INK, GRAY, FONT

# ------------------------------------------------------------------------------------------ Hilfen
def is_nt(g, s):
    return s in g.N


def join(form, sep=None):
    """Satzform/Wort als Text. sep=None: automatisch (ohne Leerzeichen, wenn alle Symbole einstellig)."""
    if not form:
        return "ε"
    if sep is None:
        sep = "" if all(len(s) == 1 for s in form) else " "
    return sep.join(form)


def derivation(g, word, sep=None):
    """Linksableitung als Text 'S ⇒ … ⇒ w' (über Grammar.derive)."""
    seq = g.derive(word)
    assert seq is not None, f"'{word}' ist nicht ableitbar"
    return " ⇒ ".join(join(f, sep) for f in seq)


def derivation_rules(g, word, sep=None):
    """Linksableitung mit angewandter Regel je Schritt: Liste [satzform, regel_für_nächsten_schritt]."""
    seq = g.derive(word)
    assert seq is not None, f"'{word}' ist nicht ableitbar"
    out = []
    for f, nf in zip(seq, seq[1:]):
        k = next(i for i, s in enumerate(f) if is_nt(g, s))
        alt = nf[k:k + len(nf) - len(f) + 1]
        rs = sep if sep is not None else ("" if all(len(x) == 1 for x in alt) else " ")
        out.append([join(f, sep), f"{f[k]} → " + (rs.join(alt) if alt else "ε")])
    out.append([join(seq[-1], sep), ""])
    return out


def derivation_steps(g, word, sep=None):
    seq = g.derive(word)
    assert seq is not None, f"'{word}' ist nicht ableitbar"
    return [join(f, sep) for f in seq]


# ------------------------------------------------------------------------------------------ Bäume
class Node:
    def __init__(self, sym):
        self.sym = sym; self.kids = []


def tree_from_seq(g, seq):
    """Baut den Ableitungsbaum aus einer Folge von Satzformen einer Linksableitung."""
    root = Node(seq[0][0])
    frontier = [root]  # Blätter/offene Knoten in Reihenfolge der Satzform
    for f, nf in zip(seq, seq[1:]):
        k = next(i for i, s in enumerate(f) if is_nt(g, s))
        alt = list(nf[k:k + len(nf) - len(f) + 1])
        node = frontier[k]
        node.kids = [Node(s) for s in alt] if alt else [Node(EPS)]
        new = [c for c in node.kids if c.sym != EPS]
        frontier = frontier[:k] + new + frontier[k + 1:]
    return root


def all_leftmost(g, word, limit=10, slack=6):
    """Alle Linksableitungen (bis limit) für word – Liste von Satzform-Folgen."""
    target = list(word) if isinstance(word, (list, tuple)) else _tok(g, word)
    L = len(target); res = []

    def rec(seq):
        if len(res) >= limit: return
        f = seq[-1]
        k = next((i for i, s in enumerate(f) if is_nt(g, s)), None)
        if k is None:
            if list(f) == target: res.append([list(x) for x in seq])
            return
        if list(f[:k]) != target[:k]: return
        if sum(1 for s in f if not is_nt(g, s)) > L or len(f) > L + slack: return
        for alt in g.rules.get(f[k], []):
            rec(seq + [f[:k] + tuple(alt) + f[k + 1:]])
    rec([(g.start,)])
    return res


def count_leftmost(g, word, slack=6):
    target = list(word) if isinstance(word, (list, tuple)) else _tok(g, word)
    L = len(target); memo = {}

    def rec(f):
        if f in memo: return memo[f]
        k = next((i for i, s in enumerate(f) if is_nt(g, s)), None)
        if k is None:
            r = 1 if list(f) == target else 0
        elif list(f[:k]) != target[:k] or sum(1 for s in f if not is_nt(g, s)) > L or len(f) > L + slack:
            r = 0
        else:
            r = sum(rec(f[:k] + tuple(alt) + f[k + 1:]) for alt in g.rules.get(f[k], []))
        memo[f] = r; return r
    return rec((g.start,))


def _tok(g, w):
    from automata import tokenize
    return tokenize(w, g.T)


def tree_dot(root, g, leaves_bottom=True, nt_color=TEAL, highlight=None, fontsize=15, nodesep=0.25, ranksep=0.42):
    lines = ['graph T {', f'  bgcolor="transparent"; nodesep={nodesep}; ranksep={ranksep}; ordering=out;',
             f'  node [fontname="{FONT}", fontsize={fontsize}, fontcolor="{INK}"];',
             f'  edge [color="{INK}", penwidth=1.1];']
    ids = itertools.count(); leaves = []

    def walk(n):
        i = next(ids); name = f"n{i}"
        if n.sym == EPS:
            lines.append(f'  {name} [label="ε", shape=plaintext, fontcolor="{GRAY}"];'); leaves.append(name)
        elif is_nt(g, n.sym) and (n.kids or True) and n.sym in g.N:
            lab = n.sym.replace('"', '\\"')
            lines.append(f'  {name} [label="{lab}", shape=plaintext, fontcolor="{nt_color}", fontname="{FONT} Bold", margin="0.02,0.01", height=0.3];')
        else:
            lab = n.sym.replace('"', '\\"')
            lines.append(f'  {name} [label="{lab}", shape=box, style="rounded,filled", fillcolor="#F6E7CF", color="{OCKER}", margin="0.06,0.03", height=0.32, width=0.3];')
            leaves.append(name)
        for c in n.kids:
            cn = walk(c)
            lines.append(f'  {name} -- {cn};')
        return name
    walk(root)
    if leaves_bottom and len(leaves) > 1:
        lines.append('  { rank=same; ' + ' '.join(leaves) + '; }')
        lines.append('  ' + ' -- '.join(leaves) + ' [style=invis];')
    lines.append('}')
    return '\n'.join(lines)


def render_dot(dot, path_noext, dpi=300):
    os.makedirs(os.path.dirname(path_noext), exist_ok=True)
    with open(path_noext + '.dot', 'w') as f: f.write(dot)
    subprocess.run(['dot', f'-Gdpi={dpi}', '-Tpng', '-o', path_noext + '.png'], input=dot.encode(), check=True)
    return path_noext + '.png'


def render_tree(g, word, path_noext, seq=None, **kw):
    seq = seq or g.derive(word)
    assert seq is not None, f"'{word}' nicht ableitbar"
    return render_dot(tree_dot(tree_from_seq(g, seq), g, **kw), path_noext)


# ------------------------------------------------------------------------------------------ Sprache aufzählen
def language(g, maxlen, slack=6, max_forms=2_000_000):
    """Menge aller Wörter (Tupel) mit höchstens maxlen Terminalsymbolen."""
    out = set(); seen = {(g.start,)}; stack = [(g.start,)]
    while stack:
        f = stack.pop()
        k = next((i for i, s in enumerate(f) if is_nt(g, s)), None)
        if k is None:
            out.add(f); continue
        for alt in g.rules.get(f[k], []):
            nf = f[:k] + tuple(alt) + f[k + 1:]
            if sum(1 for s in nf if not is_nt(g, s)) > maxlen or len(nf) > maxlen + slack: continue
            if nf not in seen:
                seen.add(nf); stack.append(nf)
                assert len(seen) < max_forms, "zu viele Satzformen"
    return out


def verify(g, sigma, pred, maxlen, name, lib_maxlen=None, slack=6):
    """Vergleicht L(g) mit dem Prädikat für alle Wörter über sigma bis maxlen (Aufzählung)
    und zusätzlich mit automata.check (Grammar.accepts) bis lib_maxlen."""
    L = language(g, maxlen, slack)
    for w in words(sigma, maxlen):
        exp = bool(pred(list(w)))
        assert exp == (tuple(w) in L), f"{name}: Wort {' '.join(w) or 'ε'} – erwartet {exp}, Grammatik {tuple(w) in L}"
    assert all(set(w) <= set(sigma) for w in L), f"{name}: fremde Symbole"
    if lib_maxlen:
        class Wrap:  # check() übergibt Listen -> Grammar.accepts
            def __init__(s): s.sigma = list(sigma)
            def accepts(s, w): return g.accepts(list(w))
        check(Wrap(), predicate=lambda w: pred(list(w) if not isinstance(w, list) else w), maxlen=lib_maxlen, sigma=list(sigma) if any(len(x) > 1 for x in sigma) else None, name=name)
    print(f"  ✓ {name}: {len(L)} Wörter bis Länge {maxlen} stimmen mit Prädikat überein")
    return True


# ------------------------------------------------------------------------------------------ Grammatik ↔ Automat
def grammar_to_nfa(g, final_name="Z"):
    """Rechtsreguläre Grammatik → NEA (Zustände = Nichtterminale + neuer Endzustand für A → a)."""
    assert g.is_right_regular()
    assert final_name not in g.N, f"Name {final_name} ist schon ein Nichtterminal"
    delta = {}; finals = set(); used_final = False
    for A, alts in g.rules.items():
        for r in alts:
            if len(r) == 0: finals.add(A)
            elif len(r) == 1:
                delta.setdefault((A, r[0]), set()).add(final_name); used_final = True
            else:
                delta.setdefault((A, r[0]), set()).add(r[1])
    if used_final: finals.add(final_name)
    states = [A for A in g.N] + ([final_name] if used_final else [])
    return NFA(g.T, g.start, finals, delta, states=states)


def nfa_to_dfa(nfa, names=None, order=None):
    """Teilmengenkonstruktion. Liefert (DFA mit Zuständen S0, S1, … , Zuordnung name → Teilmenge)."""
    start = frozenset(nfa.closure({nfa.start}))
    sets = [start]; trans = {}
    i = 0
    while i < len(sets):
        S = sets[i]; i += 1
        for a in nfa.sigma:
            T = set()
            for q in S: T |= nfa.delta.get((q, a), set())
            T = frozenset(nfa.closure(T))
            if not T: continue
            if T not in sets: sets.append(T)
            trans[(S, a)] = T
    nm = {S: (names or {}).get(S, f"S{j}") for j, S in enumerate(sets)}
    delta = {(nm[S], a): nm[T] for (S, a), T in trans.items()}
    finals = {nm[S] for S in sets if S & nfa.finals}
    return DFA(nfa.sigma, nm[start], finals, delta, states=[nm[S] for S in sets]), {nm[S]: sorted(S) for S in sets}


def dfa_to_grammar_text(A, rename=None):
    """Übersetzungsrezept DEA → rechtsreguläre Grammatik (Fehlerzustand entfällt)."""
    rn = rename or {q: q for q in A.states}
    lines = []
    for q in sorted(A.states, key=lambda x: (len(x), x)):
        alts = [f"{a}{rn[A.delta[(q, a)]]}" for a in A.sigma if (q, a) in A.delta]
        if q in A.finals: alts.append("ε")
        if alts: lines.append(f"{rn[q]} → " + " | ".join(alts))
    return "\n".join(lines)


def abi_block(g, N=None, T=None, start=None, rules=None):
    """Grammatik als Zeilen im Abi-Format."""
    N = N or g.N; T = T or g.T
    out = [f"N = {{{', '.join(N)}}}", f"T = {{{', '.join(T)}}}", f"Startsymbol: {start or g.start}", "Produktionsregeln:"]
    out += (rules or g.text()).splitlines()
    return out


def save_json(obj, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w') as f: json.dump(obj, f, ensure_ascii=False, indent=1)
    print("  → Daten:", path)
