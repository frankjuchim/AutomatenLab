import os as _os_mat
__MAT = _os_mat.path.abspath(_os_mat.path.join(_os_mat.path.dirname(__file__), '../..'))  # Wurzel: materials/
"""Hilfsfunktionen für Welt B (DS07–DS10): Schubfach-Zeugen, Kellertabellen, Teilmengenkonstruktion, JSON-Export.
Wird von automata_ds07.py … automata_ds10.py importiert (sys.path auf diesen Ordner)."""
import sys, json, itertools
sys.path.insert(0, (__MAT + '/lib'))
from automata import *


def witness_check(pred, prefix, suffix, n=8, name=""):
    """Prüft das Schubfach-Argument: Für alle 1 ≤ i < j ≤ n unterscheidet die Fortsetzung suffix(i)
    die Präfixe prefix(i) und prefix(j) (genau eines der beiden Wörter liegt in der Sprache).
    Damit sind die Präfixe paarweise unterscheidbar ⇒ kein DEA mit endlich vielen Zuständen."""
    for i in range(1, n + 1):
        for j in range(i + 1, n + 1):
            wi, wj = prefix(i) + suffix(i), prefix(j) + suffix(i)
            assert pred(wi) != pred(wj), f"{name}: Fortsetzung {suffix(i)!r} trennt {prefix(i)!r}/{prefix(j)!r} nicht"
    return True


def pda_trace(P, word):
    """Lauf eines DETERMINISTISCHEN Kellerautomaten bis zum Ende oder Steckenbleiben.
    Rückgabe: (rows, accepted, grund). rows wie PDA.search."""
    assert P.is_deterministic(), "pda_trace nur für DKA"
    w = tokenize(word, P.sigma)
    q, i, st = P.start, 0, P.bottom
    rows = [(q, st, "", "")]
    while True:
        nxt = None
        for c, lab in P._succ((q, i, st), w):
            nxt = (c, lab); break
        if nxt is None: break
        (q, i, st), (top, a) = nxt
        rows.append((q, st, top, a))
        if len(rows) > 200: break
    acc = i == len(w) and q in P.finals
    if acc: grund = "Eingabe vollständig gelesen, Endzustand erreicht"
    elif i < len(w): grund = f"kein Übergang für ({st[0] if st else '–'}, {w[i]}) in {q} – Eingabe nicht vollständig gelesen"
    else: grund = f"Eingabe gelesen, aber {q} ist kein Endzustand und kein weiterer Übergang möglich"
    return rows, acc, grund


def pda_table(P, word):
    """Tabelle im Abi-Format: [[Zustand, Belegung, oberstes, Eingabe], …] + akzeptiert.
    Akzeptierte Wörter: akzeptierender Lauf aus PDA.search (BFS). Abgelehnte (nur DKA): Lauf bis zum Steckenbleiben."""
    rows = P.search(word)
    acc = rows is not None
    grund = "Eingabe vollständig gelesen, Endzustand erreicht"
    if rows is None:
        rows, acc2, grund = pda_trace(P, word)
        assert not acc2
    tab = [[q, st, top or "–", a or "–"] for (q, st, top, a) in rows]
    return {"rows": tab, "accepted": acc, "grund": grund, "word": word if isinstance(word, str) else " ".join(word)}


def subset_construction(N, names=None):
    """Teilmengenkonstruktion (mit ε-Hülle). Liefert (DFA, order) – order: Liste der Teilmengen in Entdeckungsreihenfolge.
    names: Funktion frozenset -> Name (Default: '{S0,S1}')."""
    start = frozenset(N.closure({N.start}))
    order, todo, delta = [start], [start], {}
    nm = names or (lambda S: "{" + ", ".join(sorted(S)) + "}" if S else "∅")
    while todo:
        S = todo.pop(0)
        for a in N.sigma:
            T = set()
            for q in S: T |= N.delta.get((q, a), set())
            T = frozenset(N.closure(T))
            if T not in order: order.append(T); todo.append(T)
            delta[(nm(S), a)] = nm(T)
    finals = {nm(S) for S in order if S & N.finals}
    D = DFA(N.sigma, nm(start), finals, delta, states=[nm(S) for S in order])
    return D, order


def nfa_sets_str(N, word):
    """Folge der Mengen aktiver Zustände als Text."""
    seq = N.run(word)
    w = tokenize(word, N.sigma)
    s = "{" + ", ".join(sorted(seq[0])) + "}"
    for a, S in zip(w, seq[1:]):
        s += f" –{a}→ " + ("{" + ", ".join(sorted(S)) + "}" if S else "∅")
    return s


def dump(obj, path):
    with open(path, "w") as f: json.dump(obj, f, ensure_ascii=False, indent=1)
    print("JSON:", path)


def split_loops(dot, state, groups, ports=("n", "s", "e", "w")):
    """Ersetzt die Schleifenkante state→state im DOT-Text durch mehrere Schleifen mit je einer Gruppe von
    Beschriftungen (bessere Lesbarkeit bei vielen Kellerübergängen). groups: Liste von Listen von Labelzeilen."""
    import re as _re
    q = '"' + state + '"'
    m = _re.search(r'  ' + _re.escape(q) + r' -> ' + _re.escape(q) + r' \[label="([^"]*)"\];', dot)
    assert m, "Schleife nicht gefunden"
    have = [x for x in m.group(1).split("\\l") if x]
    flat = [x for g in groups for x in g]
    assert sorted(have) == sorted(flat), (have, flat)
    new = "\n".join(f'  {q}:{p} -> {q}:{p} [label="' + "\\l".join(g) + '\\l"];' for g, p in zip(groups, ports))
    return dot.replace(m.group(0), new)
