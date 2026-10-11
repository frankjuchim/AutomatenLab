"""
automata.py – gemeinsame Automaten-Bibliothek für alle Unterrichtsmaterialien.

* Simulation & Verifikation: DEA, NEA, Mealy, NKA (Kellerautomat), Grammatik
* Grafik im Abi-Stil (Graphviz `dot` CLI) → PNG (300 dpi) und SVG

Notation gemäß Ergänzenden Hinweisen 2025 (siehe PLAN.md, Abschnitt 1).

Kurzbeispiel:
    from automata import DFA, render
    A = DFA(sigma="LOX", start="S0", finals={"S3"}, delta={
        ("S0","L"):"S1", ("S0","O"):"S0", ("S0","X"):"S0", ...})
    assert A.accepts("XLOLX")
    render(A, "build/img/lol")   # -> lol.png, lol.svg

Wörter dürfen Strings (Ein-Zeichen-Symbole) oder Listen von Symbolen sein.
Mehrzeichen-Symbole (z. B. "10", "20", "la") werden mit tokenize() zerlegt.
"""
from __future__ import annotations
import os as _os_mat
__MAT = _os_mat.path.abspath(_os_mat.path.join(_os_mat.path.dirname(__file__), '..'))  # Wurzel: materials/
import subprocess, itertools, os, re, html
from collections import deque

EPS = "ε"

# ----------------------------------------------------------------------------
# Hilfsfunktionen
# ----------------------------------------------------------------------------

def tokenize(word, sigma):
    """Zerlegt word (str) per Longest-Match in Symbole aus sigma. Listen werden durchgereicht."""
    if isinstance(word, (list, tuple)):
        return list(word)
    syms = sorted(sigma, key=len, reverse=True)
    out, i = [], 0
    while i < len(word):
        for s in syms:
            if s and word.startswith(s, i):
                out.append(s); i += len(s); break
        else:
            raise ValueError(f"Zeichen {word[i]!r} in {word!r} nicht im Alphabet {sorted(sigma)}")
    return out


def words(sigma, maxlen):
    """Alle Wörter (als Tupel) über sigma bis Länge maxlen."""
    sigma = list(sigma)
    for n in range(maxlen + 1):
        for w in itertools.product(sigma, repeat=n):
            yield w


def check(automaton, accept=(), reject=(), predicate=None, maxlen=0, sigma=None, name=""):
    """Prüft Akzeptanzlisten und optional ein Prädikat für alle Wörter bis maxlen.
    Wirft AssertionError mit verständlicher Meldung. Gibt True zurück."""
    for w in accept:
        assert automaton.accepts(w), f"{name}: '{w}' sollte akzeptiert werden"
    for w in reject:
        assert not automaton.accepts(w), f"{name}: '{w}' sollte abgelehnt werden"
    if predicate is not None:
        sig = sigma or automaton.sigma
        for w in words(sig, maxlen):
            exp = bool(predicate("".join(w) if all(len(s) == 1 for s in sig) else list(w)))
            got = automaton.accepts(list(w))
            assert exp == got, f"{name}: Wort '{''.join(w)}' – erwartet {exp}, Automat {got}"
    return True


# ----------------------------------------------------------------------------
# DEA
# ----------------------------------------------------------------------------
class DFA:
    """Deterministischer endlicher Automat. delta: {(zustand, symbol): folgezustand}.
    Fehlende Übergänge = (impliziter) Fehlerzustand."""
    kind = "dfa"

    def __init__(self, sigma, start, finals, delta, states=None, error_hint=None):
        self.sigma = list(sigma) if not isinstance(sigma, str) else list(sigma)
        self.start = start
        self.finals = set(finals)
        self.delta = dict(delta)
        st = [start]
        for (p, a), q in self.delta.items():
            for x in (p, q):
                if x not in st: st.append(x)
        for f in self.finals:
            if f not in st: st.append(f)
        self.states = list(states) if states else st
        # error_hint: None = automatisch (True, wenn unvollständig)
        self.error_hint = (not self.is_complete()) if error_hint is None else error_hint

    def is_complete(self):
        return all((q, a) in self.delta for q in self.states for a in self.sigma)

    def run(self, word):
        """Liefert Zustandsfolge [S0, S1, ...]; None-Eintrag = Fehlerzustand erreicht."""
        w = tokenize(word, self.sigma)
        path, q = [self.start], self.start
        for a in w:
            q = self.delta.get((q, a)) if q is not None else None
            path.append(q)
        return path

    def accepts(self, word):
        return self.run(word)[-1] in self.finals

    def path_str(self, word):
        """Zustandsfolge als Text: S0 –a→ S1 –b→ S2 (Fehlerzustand: ‚Fehler‘)."""
        w = tokenize(word, self.sigma)
        p = self.run(word)
        s = p[0]
        for a, q in zip(w, p[1:]):
            s += f" –{a}→ " + (q if q is not None else "Fehlerzustand")
            if q is None: break
        return s

    def table(self):
        """Übergangstabelle als Liste von Zeilen (für Arbeitsblätter)."""
        rows = [["δ"] + self.sigma]
        for q in self.states:
            mark = ("→ " if q == self.start else "") + ("* " if q in self.finals else "")
            rows.append([mark + q] + [self.delta.get((q, a), "–") for a in self.sigma])
        return rows

    def minimize_pairs(self):
        """Markierungsverfahren. Gibt (rounds, equivalent_pairs) zurück.
        rounds: Liste von Mengen markierter Paare je Runde (Runde 0 = End/Nicht-End)."""
        st = list(self.states)
        TRAP = "__err__"
        allst = st + ([TRAP] if not self.is_complete() else [])
        d = lambda q, a: (self.delta.get((q, a), TRAP) if q != TRAP else TRAP)
        fin = lambda q: q in self.finals
        pairs = [frozenset(p) for p in itertools.combinations(allst, 2)]
        marked = {p for p in pairs if fin(min(p, key=str)) != fin(max(p, key=str))}
        rounds = [set(marked)]
        while True:
            new = set()
            for p in pairs:
                if p in marked: continue
                x, y = tuple(p)
                for a in self.sigma:
                    qx, qy = d(x, a), d(y, a)
                    if qx != qy and frozenset((qx, qy)) in marked:
                        new.add(p); break
            if not new: break
            marked |= new; rounds.append(new)
        eq = [tuple(sorted(p)) for p in pairs if p not in marked and TRAP not in p]
        return rounds, eq


def dfa_equivalent(A, B, maxlen=10):
    """Sucht kürzestes Gegenbeispiel (BFS). None = äquivalent (bis maxlen)."""
    sigma = sorted(set(A.sigma) | set(B.sigma))
    seen = set(); dq = deque([((A.start, B.start), [])])
    while dq:
        (p, q), w = dq.popleft()
        if (p, q) in seen or len(w) > maxlen: continue
        seen.add((p, q))
        if (p in A.finals) != (q in B.finals): return w
        for a in sigma:
            dq.append(((A.delta.get((p, a)) if p else None, B.delta.get((q, a)) if q else None), w + [a]))
    return None


# ----------------------------------------------------------------------------
# NEA
# ----------------------------------------------------------------------------
class NFA:
    """delta: {(zustand, symbol_or_EPS): {folgezustände}}"""
    kind = "nfa"

    def __init__(self, sigma, start, finals, delta, states=None):
        self.sigma = list(sigma)
        self.start = start; self.finals = set(finals)
        self.delta = {k: set(v) if not isinstance(v, str) else {v} for k, v in delta.items()}
        st = [start]
        for (p, a), qs in self.delta.items():
            for x in [p, *sorted(qs)]:
                if x not in st: st.append(x)
        self.states = list(states) if states else st
        self.error_hint = False

    def closure(self, S):
        S = set(S); stack = list(S)
        while stack:
            q = stack.pop()
            for r in self.delta.get((q, EPS), ()):
                if r not in S: S.add(r); stack.append(r)
        return S

    def run(self, word):
        w = tokenize(word, self.sigma)
        cur = self.closure({self.start}); seq = [cur]
        for a in w:
            nxt = set()
            for q in cur: nxt |= self.delta.get((q, a), set())
            cur = self.closure(nxt); seq.append(cur)
        return seq

    def accepts(self, word):
        return bool(self.run(word)[-1] & self.finals)


# ----------------------------------------------------------------------------
# Mealy
# ----------------------------------------------------------------------------
class Mealy:
    """delta: {(zustand, eingabe): (folgezustand, ausgabe)}; ausgabe '' oder 'ε' = leer."""
    kind = "mealy"

    def __init__(self, sigma, omega, start, delta, states=None):
        self.sigma = list(sigma); self.omega = list(omega)
        self.start = start
        self.delta = {k: (v[0], "" if v[1] in ("", EPS) else v[1]) for k, v in delta.items()}
        st = [start]
        for (p, a), (q, o) in self.delta.items():
            for x in (p, q):
                if x not in st: st.append(x)
        self.states = list(states) if states else st
        self.finals = set()
        self.error_hint = not all((q, a) in self.delta for q in self.states for a in self.sigma)

    def translate(self, word):
        w = tokenize(word, self.sigma); q = self.start; out = []
        steps = []
        for a in w:
            if (q, a) not in self.delta:
                raise ValueError(f"Kein Übergang aus {q} mit {a}")
            q2, o = self.delta[(q, a)]
            steps.append((q, a, o, q2)); out.append(o); q = q2
        return "".join(out), steps

    def accepts(self, word):  # für check(): definiert = übersetzbar
        try: self.translate(word); return True
        except ValueError: return False


# ----------------------------------------------------------------------------
# NKA (Kellerautomat), Notation (Kellerzeichen, Eingabe) : Ablage
# ----------------------------------------------------------------------------
class PDA:
    """trans: Liste von (von, kellerzeichen, eingabe_oder_EPS, ablage, nach).
    ablage: String/Liste; das RECHTESTE Zeichen wird zuerst abgelegt (oben liegt das linke).
    Keller wird als String notiert, oberstes Zeichen LINKS (wie in der Abi-Tabelle).
    Akzeptanz: es gibt einen Lauf, der nach vollständiger Eingabe in einem Endzustand ist."""
    kind = "pda"

    def __init__(self, sigma, gamma, start, finals, trans, bottom="#", states=None):
        self.sigma = list(sigma); self.gamma = list(gamma)
        self.start = start; self.finals = set(finals); self.bottom = bottom
        self.trans = [(p, k, a, ("" if z in (EPS,) else z), q) for (p, k, a, z, q) in trans]
        st = [start]
        for p, k, a, z, q in self.trans:
            for x in (p, q):
                if x not in st: st.append(x)
        self.states = list(states) if states else st
        self.error_hint = True

    def _succ(self, conf, w):
        q, i, stack = conf
        if not stack: return
        top = stack[0]
        for (p, k, a, z, r) in self.trans:
            if p != q or k != top: continue
            if a == EPS:
                yield (r, i, z + stack[1:]), (top, EPS)
            elif i < len(w) and w[i] == a:
                yield (r, i + 1, z + stack[1:]), (top, a)

    def search(self, word, max_stack=60, max_conf=200000):
        """BFS über Konfigurationen. Gibt akzeptierenden Lauf zurück:
        Liste von Zeilen (zustand, keller, oberstes_kellersymbol, eingabezeichen) oder None."""
        w = tokenize(word, self.sigma)
        start = (self.start, 0, self.bottom)
        parent = {start: None}; dq = deque([start])
        while dq:
            c = dq.popleft()
            q, i, stack = c
            if i == len(w) and q in self.finals:
                rows = []; x = c
                while x is not None:
                    prev = parent[x]
                    if prev is None: rows.append((x[0], x[2], "", ""))
                    else: rows.append((x[0], x[2], prev[1][0], prev[1][1]))
                    x = prev[0] if prev else None
                return list(reversed(rows))
            for nc, lab in self._succ(c, w):
                if len(nc[2]) > max_stack or nc in parent: continue
                parent[nc] = (c, lab); dq.append(nc)
                if len(parent) > max_conf: return None
        return None

    def accepts(self, word):
        return self.search(word) is not None

    def is_deterministic(self):
        for i, t in enumerate(self.trans):
            for u in self.trans[i + 1:]:
                if t[0] == u[0] and t[1] == u[1] and (t[2] == u[2] or EPS in (t[2], u[2])):
                    return False
        return True


# ----------------------------------------------------------------------------
# Grammatik
# ----------------------------------------------------------------------------
class Grammar:
    """Grammatik aus Text:  'S → aSb | ab\\nA → ...'.
    Nichtterminale: Großbuchstabe ggf. mit Ziffern (A, A1, C0) oder explizit über nonterminals=.
    Terminale: alles andere; Mehrzeichen-Terminale über terminals= (Longest-Match)."""
    kind = "grammar"

    def __init__(self, text, start="S", nonterminals=None, terminals=None):
        self.start = start
        self.rules = {}
        lines = [l.strip() for l in text.strip().splitlines() if l.strip()]
        lhs_names = [re.split(r"→|->", l)[0].strip() for l in lines]
        self.N = list(nonterminals) if nonterminals else lhs_names
        self.T_given = list(terminals) if terminals else None
        for l in lines:
            lhs, rhs = re.split(r"→|->", l, maxsplit=1)
            lhs = lhs.strip()
            for alt in rhs.split("|"):
                self.rules.setdefault(lhs, []).append(self._sym(alt.strip()))
        self.T = self.T_given or sorted({s for alts in self.rules.values() for a in alts for s in a if s not in self.N})

    def _sym(self, s):
        if s in ("ε", "eps", ""): return []
        s = s.replace(" ", "") if not self.T_given else s
        toks = sorted(self.N + (self.T_given or []), key=len, reverse=True)
        out, i = [], 0
        while i < len(s):
            if s[i] == " ": i += 1; continue
            for t in toks:
                if s.startswith(t, i):
                    out.append(t); i += len(t); break
            else:
                if self.T_given:
                    raise ValueError(f"Unbekanntes Symbol bei {s[i:]!r}")
                out.append(s[i]); i += 1
        return out

    def is_right_regular(self):
        for A, alts in self.rules.items():
            for r in alts:
                if len(r) == 0: continue
                if len(r) == 1 and r[0] not in self.N: continue
                if len(r) == 2 and r[0] not in self.N and r[1] in self.N: continue
                return False
        return True

    def derive(self, word, max_len_slack=4, max_nodes=300000):
        """Linksableitung (BFS). Liefert Liste von Satzformen (Listen) oder None."""
        target = tokenize(word, self.T)
        nullable = set()
        changed = True
        while changed:
            changed = False
            for A, alts in self.rules.items():
                if A not in nullable and any(all(x in nullable for x in r) for r in alts):
                    nullable.add(A); changed = True
        start = (self.start,)
        parent = {start: None}; dq = deque([start])
        L = len(target)
        while dq:
            f = dq.popleft()
            if list(f) == target:
                seq = []; x = f
                while x is not None: seq.append(list(x)); x = parent[x]
                return list(reversed(seq))
            # Präfix-Pruning
            k = next((i for i, s in enumerate(f) if s in self.N), None)
            if k is None: continue
            if list(f[:k]) != target[:k]: continue
            nterm = sum(1 for s in f if s not in self.N)
            if nterm > L: continue
            for alt in self.rules.get(f[k], []):
                nf = f[:k] + tuple(alt) + f[k + 1:]
                # Mindestlänge: Terminale + nicht löschbare Nichtterminale
                if sum(1 for s in nf if s not in nullable) > L: continue
                if len(nf) > L + max_len_slack and not nullable: continue
                if nf not in parent:
                    parent[nf] = f; dq.append(nf)
                    if len(parent) > max_nodes: return None
        return None

    def accepts(self, word):
        return self.derive(word) is not None

    def derivation_str(self, word):
        seq = self.derive(word)
        if seq is None: return None
        j = lambda f: "".join(f) if all(len(s) == 1 for s in f) else " ".join(f)
        return " ⇒ ".join(j(f) if f else "ε" for f in seq)

    def text(self, arrow="→"):
        lines = []
        for A in self.N:
            if A in self.rules:
                alts = [("".join(r) if r else "ε") for r in self.rules[A]]
                lines.append(f"{A} {arrow} " + " | ".join(alts))
        return "\n".join(lines)


# ----------------------------------------------------------------------------
# Grafik (Graphviz)
# ----------------------------------------------------------------------------
TEAL = "#0E6455"; OCKER = "#B26A0F"; INK = "#1F2A2E"; GRAY = "#7A8A8F"
FONT = "Calibri"   # in Word/LibreOffice: Calibri bzw. metrisch gleiches Carlito


def _q(s):
    return '"' + str(s).replace('"', '\\"') + '"'


def _join_labels(labels):
    return ", ".join(labels)


def to_dot(A, rankdir="LR", highlight=None, size=None, ranks=None, error_state=False,
           node_style=None, edge_style=None, label_override=None, nodesep=0.45, ranksep=0.6,
           color=INK, hide_start_label=False, splines=None, extra="", chain=None):
    """Erzeugt DOT im Abi-Stil.
    highlight: Menge von Zuständen, die ocker hinterlegt werden.
    ranks: Liste von Listen gleicher Rangstufe (rank=same).
    error_state: True → expliziten Fehlerzustand zeichnen (alle fehlenden Übergänge).
    chain: Liste von Zuständen, die als „Hauptkette“ von links nach rechts liegen sollen
           (Vorwärtskanten bekommen hohes Gewicht, Rückkanten beeinflussen das Layout nicht)."""
    highlight = set(highlight or [])
    lines = [f"digraph G {{", f'  rankdir={rankdir}; bgcolor="transparent"; nodesep={nodesep}; ranksep={ranksep};',
             f'  node [shape=circle, fontname="{FONT}", fontsize=15, color="{color}", fontcolor="{INK}", penwidth=1.6, width=0.55, fixedsize=false, margin=0.04];',
             f'  edge [fontname="{FONT}", fontsize=13, color="{color}", fontcolor="{INK}", penwidth=1.3, arrowsize=0.75];']
    if splines: lines.append(f"  splines={splines};")
    lines.append(f'  __start [shape=plaintext, label="{"" if hide_start_label else "Start"}", fontsize=14];')
    edges = {}
    kind = getattr(A, "kind", "dfa")
    states = list(A.states)
    if kind == "dfa":
        for (p, a), q in A.delta.items(): edges.setdefault((p, q), []).append(a)
        if error_state:
            missing = [(q, a) for q in states for a in A.sigma if (q, a) not in A.delta]
            if missing:
                for q, a in missing: edges.setdefault((q, "F_err"), []).append(a)
                for a in A.sigma: edges.setdefault(("F_err", "F_err"), []).append(a)
                states.append("F_err")
    elif kind == "nfa":
        for (p, a), qs in A.delta.items():
            for q in qs: edges.setdefault((p, q), []).append(a)
    elif kind == "mealy":
        for (p, a), (q, o) in A.delta.items(): edges.setdefault((p, q), []).append(f"{a} / {o if o else EPS}")
    elif kind == "pda":
        for (p, k, a, z, q) in A.trans: edges.setdefault((p, q), []).append(f"({k}, {a}) : {z if z else EPS}")
    elif kind == "tm":
        for (p, r), (q, w, m) in A.delta.items(): edges.setdefault((p, q), []).append(f"{r} / {w}, {m}")
    for q in states:
        attrs = []
        if q in getattr(A, "finals", set()): attrs.append("shape=doublecircle")
        if q in highlight: attrs.append(f'style=filled, fillcolor="#F6E7CF", color="{OCKER}"')
        if q == "F_err": attrs.append(f'label="Fehler", fontsize=12, style=dashed, color="{GRAY}", fontcolor="{GRAY}"')
        if node_style and q in node_style: attrs.append(node_style[q])
        lab = (label_override or {}).get(q)
        if lab: attrs.append(f"label={_q(lab)}")
        lines.append(f"  {_q(q)} [{', '.join(attrs)}];")
    lines.append(f"  __start -> {_q(A.start)} [penwidth=1.3];")
    sep = "\\l" if kind == "pda" else ", "
    for (p, q), labs in edges.items():
        if kind == "pda":
            lab = "\\l".join(labs) + "\\l"
        elif kind == "mealy" or kind == "tm":
            lab = "\\n".join(labs)
        else:
            lab = _join_labels(labs)
        st = (edge_style or {}).get((p, q), "")
        gray = f', color="{GRAY}", fontcolor="{GRAY}", style=dashed' if q == "F_err" else ""
        if chain and p in chain and q in chain and p != q:
            gray += ", weight=10" if chain.index(q) == chain.index(p) + 1 else ", constraint=false"
        lines.append(f"  {_q(p)} -> {_q(q)} [label={_q(' ' + lab + ' ') if kind!='pda' else _q(lab)}{gray}{(', ' + st) if st else ''}];")
    for r in (ranks or []):
        lines.append("  { rank=same; " + "; ".join(_q(x) for x in r) + "; }")
    if extra: lines.append(extra)
    lines.append("}")
    return "\n".join(lines)


def render(A, path_noext, dpi=300, fmt=("png", "svg"), **kw):
    """Rendert Automat nach path_noext.png/.svg. Gibt Pfad zum PNG zurück."""
    os.makedirs(os.path.dirname(path_noext) or ".", exist_ok=True)
    dot = to_dot(A, **kw) if not isinstance(A, str) else A
    with open(path_noext + ".dot", "w") as f: f.write(dot)
    for ft in fmt:
        args = ["dot", f"-T{ft}", "-o", f"{path_noext}.{ft}"]
        if ft == "png": args.insert(1, f"-Gdpi={dpi}")
        subprocess.run(args, input=dot.encode(), check=True)
    return path_noext + ".png"


def png_size(path):
    """(breite, höhe) in Pixel."""
    from PIL import Image
    with Image.open(path) as im: return im.size


# ----------------------------------------------------------------------------
# Selbsttest
# ----------------------------------------------------------------------------
if __name__ == "__main__":
    lol = DFA("LOX", "S0", {"S3"}, {
        ("S0", "L"): "S1", ("S0", "O"): "S0", ("S0", "X"): "S0",
        ("S1", "L"): "S1", ("S1", "O"): "S2", ("S1", "X"): "S0",
        ("S2", "L"): "S3", ("S2", "O"): "S0", ("S2", "X"): "S0",
        ("S3", "L"): "S3", ("S3", "O"): "S3", ("S3", "X"): "S3"})
    check(lol, predicate=lambda w: "LOL" in w, maxlen=7, name="LOL")
    print(lol.path_str("XLOLX"))
    anbn = PDA("ab", "A#", "S0", {"S2"}, [
        ("S0", "#", "a", "A#", "S0"), ("S0", "A", "a", "AA", "S0"),
        ("S0", "A", "b", "", "S1"), ("S1", "A", "b", "", "S1"), ("S1", "#", EPS, "#", "S2")])
    check(anbn, predicate=lambda w: (n := len(w) // 2) >= 1 and w == "a" * n + "b" * n, maxlen=8, name="anbn")
    print(anbn.search("aabb"))
    g = Grammar("S → aSb | ab")
    print(g.derivation_str("aaabbb"), g.is_right_regular())
    m = Mealy("MH", "B", "S0", {("S0", "M"): ("S1", ""), ("S0", "H"): ("S0", ""),
                                ("S1", "M"): ("S1", ""), ("S1", "H"): ("S0", "B")})
    print(m.translate("MHHMMH")[0])
    r, eq = lol.minimize_pairs(); print("äquiv. Paare:", eq)
    render(lol, (__MAT + '/build/test/lol'))
    render(anbn, (__MAT + '/build/test/anbn'))
    render(m, (__MAT + '/build/test/mealy'))
    print("ok")
