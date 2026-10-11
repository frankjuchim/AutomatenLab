import os as _os_mat
__MAT = _os_mat.path.abspath(_os_mat.path.join(_os_mat.path.dirname(__file__), '../..'))  # Wurzel: materials/
"""Lokale Hilfsfunktionen für DS05 (Minimierung). automata.py bleibt unverändert."""
import sys, itertools
from collections import deque
sys.path.insert(0, (__MAT + '/lib'))
from automata import DFA, words

TEAL = "#0E6455"; TEAL_T = "#E4F0EE"; OCKER = "#B26A0F"; OCKER_T = "#F8ECDB"; INK = "#1F2A2E"; GRAY = "#7A8A8F"; LINE = "#C9D3D6"


def complete(A, err="F_err"):
    """Vervollständigt einen DEA mit explizitem Fehlerzustand err (nur falls nötig)."""
    if A.is_complete():
        return A
    d = dict(A.delta)
    for q in A.states:
        for a in A.sigma:
            d.setdefault((q, a), err)
    for a in A.sigma:
        d[(err, a)] = err
    st = sorted(A.states, key=lambda s: int(s[1:]) if s[1:].isdigit() else 999)
    return DFA(A.sigma, A.start, A.finals, d, states=st + [err])


def _step(A, q, a):
    if q is None:
        return None
    return A.delta.get((q, a))


def dist_word(A, p, q):
    """Kürzestes unterscheidendes Wort für die Zustände p, q (BFS). 'ε' für das leere Wort, None = äquivalent."""
    fin = lambda x: x in A.finals
    seen = {(p, q)}
    dq = deque([((p, q), [])])
    while dq:
        (x, y), w = dq.popleft()
        if fin(x) != fin(y):
            return "".join(w) if w else "ε"
        for a in A.sigma:
            nx, ny = _step(A, x, a), _step(A, y, a)
            if (nx, ny) not in seen:
                seen.add((nx, ny)); dq.append(((nx, ny), w + [a]))
    return None


def _order(A):
    return lambda s: (int(s[1:]) if s[1:].isdigit() else 999)


def rounds_table(A, rounds):
    """Aufbereitung der Runden aus minimize_pairs(): Paare (geordnet) und Begründung (Zeichen + Folgepaar)."""
    o = _order(A)
    nm = lambda s: "F_err" if s == "__err__" else s
    srt = lambda pr: sorted(pr, key=o)
    out = {'rounds': [], 'reason': {}}
    marked = set()
    for r, R in enumerate(rounds):
        lst = sorted([srt(p) for p in R], key=lambda x: (o(x[1]), o(x[0])))
        out['rounds'].append([[nm(x) for x in pr] for pr in lst])
        if r > 0:
            for pr in lst:
                x, y = pr
                for a in A.sigma:
                    nx = A.delta.get((x, a), "__err__") if x != "__err__" else "__err__"
                    ny = A.delta.get((y, a), "__err__") if y != "__err__" else "__err__"
                    if nx != ny and frozenset((nx, ny)) in marked:
                        f = srt([nx, ny])
                        out['reason'][f"{nm(x)}|{nm(y)}"] = [a, nm(f[0]), nm(f[1])]
                        break
        marked |= set(R)
    return out


def classes_from_pairs(states, eq):
    parent = {s: s for s in states}
    def find(x):
        while parent[x] != x: x = parent[x]
        return x
    for p, q in eq:
        rp, rq = find(p), find(q)
        if rp != rq: parent[rq] = rp
    cls = {}
    for s in states:
        cls.setdefault(find(s), []).append(s)
    key = lambda s: (0, int(s[1:])) if s[1:].isdigit() else (1, 0)
    return sorted([sorted(c, key=key) for c in cls.values()], key=lambda c: key(c[0]))


def build_from_memory(sigma, pred, maxlen=6, L=4):
    """DEA aus einer Sprache (Prädikat) über Signaturen (Akzeptanz aller Suffixe bis Länge L).
    Muss anschließend mit check() gegen das Prädikat verifiziert werden."""
    sigma = list(sigma)
    suff = ["".join(s) for s in words(sigma, L)]
    sig = lambda p: tuple(pred(p + s) for s in suff)
    names, rep, d, finals = {}, [], {}, set()
    def name(p):
        s = sig(p)
        if s not in names:
            names[s] = f"S{len(names)}"; rep.append(p)
            if pred(p): finals.add(names[s])
        return names[s]
    name("")
    i = 0
    while i < len(rep):
        p = rep[i]; q = names[sig(p)]
        for a in sigma:
            d[(q, a)] = name(p + a)
        i += 1
    return DFA(sigma, "S0", finals, d)


def minimize_dfa(A):
    """Partitionsverfeinerung + Umbenennung S0, S1, … in BFS-Reihenfolge (nur vollständige DEA)."""
    assert A.is_complete()
    part = {q: (q in A.finals) for q in A.states}
    while True:
        new = {q: (part[q],) + tuple(part[A.delta[(q, a)]] for a in A.sigma) for q in A.states}
        if len(set(new.values())) == len(set(part.values())):
            break
        part = new
    blocks = {}
    for q in A.states: blocks.setdefault(part[q], []).append(q)
    rep = {q: blocks[part[q]][0] for q in A.states}
    order, dq = [], deque([rep[A.start]])
    while dq:
        q = dq.popleft()
        if q in order: continue
        order.append(q)
        for a in A.sigma: dq.append(rep[A.delta[(q, a)]])
    nm = {q: f"S{i}" for i, q in enumerate(order)}
    d = {(nm[q], a): nm[rep[A.delta[(q, a)]]] for q in order for a in A.sigma}
    return DFA(A.sigma, nm[rep[A.start]], {nm[rep[f]] for f in A.finals if rep[f] in nm}, d), nm


def render_triangle(A, rounds, order, file, upto=0, scale=1.0):
    """Dreieckstabelle als PNG. upto = letzte angezeigte Runde (−1: leer; len(rounds): Endstand mit
    hervorgehobenen unmarkierten (äquivalenten) Paaren)."""
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    from matplotlib import font_manager as fm
    for f in ["/usr/share/fonts/truetype/crosextra/Carlito-Regular.ttf", "/usr/share/fonts/truetype/crosextra/Carlito-Bold.ttf"]:
        fm.fontManager.addfont(f)
    plt.rcParams["font.family"] = "Carlito"
    nm = lambda s: "__err__" if s == "F_err" and "F_err" not in A.states else s
    rnd = {}
    for r, R in enumerate(rounds):
        for p in R:
            rnd[frozenset("F_err" if x == "__err__" else x for x in p)] = r
    n = len(order)
    cw = 1.0
    fig, ax = plt.subplots(figsize=(0.9 * n * scale, 0.75 * n * scale), dpi=200)
    ax.set_xlim(-1.0, n - 1 + 0.05); ax.set_ylim(n - 1 + 0.75, -0.05); ax.axis("off")
    final = upto >= len(rounds)
    for i in range(1, n):            # Zeilen
        ax.text(-0.15, i - 1 + 0.5, order[i], ha="right", va="center", fontsize=15, color=INK, fontweight="bold")
        for j in range(i):           # Spalten
            key = frozenset((order[i], order[j]))
            r = rnd.get(key)
            fill, txt, col = "white", "", INK
            if r is not None and r <= upto:
                txt = "X"; col = INK
                if r == upto and not final:
                    fill = OCKER_T; col = OCKER
            elif final and r is None:
                fill = TEAL_T; txt = "≡"; col = TEAL
            ax.add_patch(plt.Rectangle((j, i - 1), cw, 1, facecolor=fill, edgecolor=LINE, lw=1.2))
            if txt == "X":
                ax.text(j + 0.45, i - 0.5, "X", ha="center", va="center", fontsize=17, color=col, fontweight="bold")
                ax.text(j + 0.72, i - 0.32, str(r), ha="center", va="center", fontsize=10, color=col)
            elif txt:
                ax.text(j + 0.5, i - 0.5, txt, ha="center", va="center", fontsize=18, color=col, fontweight="bold")
    for j in range(n - 1):
        ax.text(j + 0.5, n - 1 + 0.35, order[j], ha="center", va="center", fontsize=15, color=INK, fontweight="bold")
    plt.savefig(file, bbox_inches="tight", transparent=True, pad_inches=0.05)
    plt.close(fig)
    return file


def render_pos(A, path_noext, pos, dpi=300, scale=1.0, **kw):
    """Wie automata.render, aber mit festen Knotenpositionen (neato -n). pos: {zustand: (x, y)} in Zoll."""
    import subprocess, re, os
    from automata import to_dot
    os.makedirs(os.path.dirname(path_noext), exist_ok=True)
    ns = dict(kw.pop("node_style", {}) or {})
    for q, (x, y) in pos.items():
        ns[q] = (ns.get(q, "") + ", " if ns.get(q) else "") + f'pos="{x*72*scale:.1f},{y*72*scale:.1f}!"'
    dot = to_dot(A, node_style=ns, **kw)
    sx, sy = pos[A.start]
    dot = dot.replace('__start [shape=plaintext', f'__start [pos="{(sx*scale-0.75)*72:.1f},{sy*72*scale:.1f}!", shape=plaintext')
    dot = dot.replace("rankdir=LR;", "rankdir=LR; splines=true; overlap=false; outputorder=edgesfirst;")
    with open(path_noext + ".dot", "w") as f: f.write(dot)
    for ft in ("png", "svg"):
        args = ["neato", "-n", f"-T{ft}", "-o", f"{path_noext}.{ft}"]
        if ft == "png": args.insert(1, f"-Gdpi={dpi}")
        subprocess.run(args, input=dot.encode(), check=True)
    return path_noext + ".png"
