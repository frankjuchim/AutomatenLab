import os as _os_mat
__MAT = _os_mat.path.abspath(_os_mat.path.join(_os_mat.path.dirname(__file__), '../..'))  # Wurzel: materials/
"""DS06 – Level 6 „Automaten, die antworten“ (Mealy) + Boss-Level A.
Alle Mealy-Automaten werden mit Mealy.translate gegen eine Spezifikation (Python-Funktion) für alle
Eingaben bis zu einer Mindestlänge geprüft; DEA mit check(). Ergebnisse → ds06_data.json."""
import sys, json, itertools
sys.path.insert(0, (__MAT + '/lib'))
sys.path.insert(0, (__MAT + '/content/ds05'))
from automata import *
from minhelp import render_pos, dist_word, complete, rounds_table, classes_from_pairs, render_triangle

IMG = (__MAT + '/build/img/ds06/')
DATA = {}
L = lambda p: f'tailport={p}, headport={p}'
E = ""   # leere Ausgabe (wird als ε gezeichnet)


def check_mealy(M, spec, maxlen, name):
    """Vergleicht M.translate(w) mit spec(w) für alle Wörter bis maxlen."""
    n = 0
    for w in words(M.sigma, maxlen):
        got = M.translate(list(w))[0]
        exp = spec(list(w))
        assert got == exp, f"{name}: {''.join(w)} → {got!r}, erwartet {exp!r}"
        n += 1
    return n


def mealy_min_states(M):
    """Anzahl Zustände nach Minimierung (Partitionsverfeinerung über Ausgaben und Folgezustände)."""
    part = {q: tuple(M.delta[(q, a)][1] for a in M.sigma) for q in M.states}
    while True:
        new = {q: (part[q],) + tuple(part[M.delta[(q, a)][0]] for a in M.sigma) for q in M.states}
        if len(set(new.values())) == len(set(part.values())):
            return len(set(part.values()))
        part = new


def tr(M, w):
    out, steps = M.translate(w)
    return out if out else "ε"


def steps_str(M, w):
    out, steps = M.translate(w)
    s = steps[0][0] if steps else M.start
    for (q, a, o, q2) in steps:
        s += f" –{a} / {o if o else 'ε'}→ {q2}"
    return s

# ------------------------------------------------------------------------------------------
# 1) Süßigkeitenautomat (Einstieg, App-Aufgabe 1)
# ------------------------------------------------------------------------------------------
suess = Mealy("MH", "B", "S0", {("S0", "M"): ("S1", E), ("S0", "H"): ("S0", E),
                                ("S1", "M"): ("S1", E), ("S1", "H"): ("S0", "B")})
def suess_spec(w):
    m, o = False, ""
    for c in w:
        if c == "M": m = True
        elif m: o += "B"; m = False
    return o
check_mealy(suess, suess_spec, 8, "Süßigkeiten")
render_pos(suess, IMG + 'suess', {"S0": (0, 0), "S1": (2.2, 0)}, edge_style={("S0", "S0"): L("n"), ("S1", "S1"): L("n")})
DATA['suess'] = {w: tr(suess, w) for w in ["MH", "HMH", "MMH", "MHMH", "HH", "MHH"]}
DATA['suess_steps'] = {w: steps_str(suess, w) for w in ["MHMH", "MMHH"]}

# ------------------------------------------------------------------------------------------
# 2) Kartoffelautomat 4 € (App-Aufgabe 2): Σ = {1, 2}, Ω = {1, K}
# ------------------------------------------------------------------------------------------
kart = Mealy("12", ["1", "K"], "S0", {
    ("S0", "1"): ("S1", E), ("S0", "2"): ("S2", E), ("S1", "1"): ("S2", E), ("S1", "2"): ("S3", E),
    ("S2", "1"): ("S3", E), ("S2", "2"): ("S0", "K"), ("S3", "1"): ("S0", "K"), ("S3", "2"): ("S0", "K1")})
def kart_spec(w):
    s, o = 0, ""
    for c in w:
        s += int(c)
        if s >= 4: o += "K1" if s == 5 else "K"; s = 0
    return o
check_mealy(kart, kart_spec, 8, "Kartoffel")
render(kart, IMG + 'kartoffel', chain=["S0", "S1", "S2", "S3"], nodesep=0.5, ranksep=0.9)
DATA['kart'] = {w: {'out': tr(kart, w), 'steps': steps_str(kart, w)} for w in ["1212", "2221", "1122", "212", "11111"]}

# ------------------------------------------------------------------------------------------
# 3) Ziffernaddierer (zwei Ziffern 0–3, Ausgabe der Summe) – App-Aufgabe 3
# ------------------------------------------------------------------------------------------
dig = "0123"
dd = {("S0", d): (f"S{int(d)+1}", E) for d in dig}
dd |= {(f"S{int(d)+1}", e): ("S0", str(int(d) + int(e))) for d in dig for e in dig}
add = Mealy(dig, list("0123456"), "S0", dd)
def add_spec(w):
    return "".join(str(int(w[i]) + int(w[i + 1])) for i in range(0, len(w) - 1, 2))
check_mealy(add, add_spec, 6, "Addierer")
assert mealy_min_states(add) == 5
render(add, IMG + 'addierer', nodesep=0.3, ranksep=1.8)
DATA['add'] = {w: tr(add, w) for w in ["13", "30", "2133", "0321", "123"]}

# ------------------------------------------------------------------------------------------
# 4) Lauflängen-Kompressor h/d (angelehnt Abi 2022 eA D b) – korrekte Referenz + fehlerhafte Version
#    Bis zu drei gleiche Befehle werden zusammengefasst; # beendet die Befehlsfolge.
# ------------------------------------------------------------------------------------------
fd = {
    ("S0", "h"): ("S1", E), ("S0", "d"): ("S4", E), ("S0", "#"): ("S0", "#"),
    ("S1", "h"): ("S2", E), ("S1", "d"): ("S4", "1h"), ("S1", "#"): ("S0", "1h#"),
    ("S2", "h"): ("S3", E), ("S2", "d"): ("S4", "2h"), ("S2", "#"): ("S0", "2h#"),
    ("S3", "h"): ("S1", "3h"), ("S3", "d"): ("S4", "3h"), ("S3", "#"): ("S0", "3h#"),
    ("S4", "d"): ("S5", E), ("S4", "h"): ("S1", "1d"), ("S4", "#"): ("S0", "1d#"),
    ("S5", "d"): ("S6", E), ("S5", "h"): ("S1", "2d"), ("S5", "#"): ("S0", "2d#"),
    ("S6", "d"): ("S4", "3d"), ("S6", "h"): ("S1", "3d"), ("S6", "#"): ("S0", "3d#")}
frog = Mealy("hd#", list("123hd#"), "S0", fd)
def frog_spec(w):
    o, cur, n = "", None, 0
    for c in w:
        if c == "#":
            if cur: o += f"{n}{cur}"
            o += "#"; cur, n = None, 0; continue
        if c == cur and n < 3: n += 1
        else:
            if cur: o += f"{n}{cur}"
            cur, n = c, 1
    return o
check_mealy(frog, frog_spec, 8, "Kompressor")
assert frog.translate("hdddhhhhhdhh#")[0] == "1h3d3h2h1d2h#"
# fehlerhafte Version (wie App #/mealy?aufgabe=4&modus=bugjagd): zwei falsche Kantenausgaben
fbug = dict(fd); fbug[("S6", "h")] = ("S1", "3h"); fbug[("S3", "#")] = ("S0", "3h")
frogbug = Mealy("hd#", list("123hd#"), "S0", fbug)
DATA['frog'] = {w: {'bug': tr(frogbug, w), 'ok': tr(frog, w), 'steps_bug': steps_str(frogbug, w)}
                for w in ["hdddh#", "ddhhh#", "hhd#", "dddd#", "hdddhhhhhdhh#"]}
assert DATA['frog']['hdddh#']['bug'] != DATA['frog']['hdddh#']['ok']
assert DATA['frog']['ddhhh#']['bug'] != DATA['frog']['ddhhh#']['ok']
FPOS = {"S0": (0, 0), "S1": (2.2, 1.4), "S2": (4.4, 2.3), "S3": (6.6, 1.4), "S4": (2.2, -1.4), "S5": (4.4, -2.3), "S6": (6.6, -1.4)}
# Graph ohne #-Übergänge (diese stehen übersichtlich in einer Tabelle)
for nm, M in (("kompressor_bug", frogbug), ("kompressor", frog)):
    nb = Mealy("hd#", list("123hd#"), "S0", {k: v for k, v in M.delta.items() if k[1] != "#"})
    big_e = {(p, q2): "fontsize=21" for (p, a), (q2, o) in nb.delta.items()}
    render(nb, IMG + nm, nodesep=0.25, ranksep=0.55, edge_style=big_e, node_style={q: "fontsize=21" for q in nb.states})
DATA['frog_hash'] = {'bug': {q: (fbug[(q, '#')][1] or 'ε') for q in frog.states}, 'ok': {q: (fd[(q, '#')][1] or 'ε') for q in frog.states}}

# ------------------------------------------------------------------------------------------
# 5) Palindrom-Generator (angelehnt Abi 2024 Nachschreibtermin): 3 Bit → 5-stelliges Palindrom
#    Variante 4 Bit → 7-stelliges Palindrom (Mindestzahl der Zustände)
# ------------------------------------------------------------------------------------------
def pal_mealy(k):
    """Mealy für k Bit → (2k−1)-stelliges Palindrom; Zustände = bisher gelesene Bits des Blocks."""
    names = {"": "S0"}
    for n in range(1, k):
        for b in itertools.product("01", repeat=n):
            names["".join(b)] = f"S{len(names)}"
    d = {}
    for pre, q in names.items():
        for c in "01":
            if len(pre) < k - 1:
                d[(q, c)] = (names[pre + c], c)
            else:
                blk = pre + c
                d[(q, c)] = ("S0", c + blk[:-1][::-1])
    return Mealy("01", "01", "S0", d), names
def pal_spec(k):
    def f(w):
        o = ""
        for i, c in enumerate(w):
            o += c
            if i % k == k - 1:
                blk = "".join(w[i - k + 1:i + 1]); o += blk[:-1][::-1]
        return o
    return f
pal3, n3 = pal_mealy(3)
check_mealy(pal3, pal_spec(3), 9, "Palindrom 3")
for w in map("".join, itertools.product("01", repeat=3)):
    o = pal3.translate(w)[0]; assert len(o) == 5 and o == o[::-1] and o.startswith(w)
pal4, n4 = pal_mealy(4)
check_mealy(pal4, pal_spec(4), 8, "Palindrom 4")
assert len(pal3.states) == 7 and mealy_min_states(pal3) == 7
assert len(pal4.states) == 15 and mealy_min_states(pal4) == 15
DATA['pal'] = {'names3': n3, 'n3': 7, 'n4': 15, 'ex': {w: tr(pal3, w) for w in ["011", "110", "100", "011110"]}}
render(pal3, IMG + 'palindrom', nodesep=0.3, ranksep=1.3)

# ------------------------------------------------------------------------------------------
# 6) Boss-Level A: „Pixel-Ninja“ – Σ = {u, v, A}
# ------------------------------------------------------------------------------------------
SG = ["u", "v", "A"]
W = DFA(SG, "S0", {"S3"}, {("S0", "u"): "S1", ("S0", "v"): "S0", ("S0", "A"): "S0",
                           ("S1", "u"): "S1", ("S1", "v"): "S2", ("S1", "A"): "S0",
                           ("S2", "u"): "S1", ("S2", "v"): "S0", ("S2", "A"): "S3",
                           ("S3", "u"): "S1", ("S3", "v"): "S0", ("S3", "A"): "S0"})
check(W, predicate=lambda w: w.endswith("uvA"), maxlen=8, name="Wirbelwind")
rW, eqW = W.minimize_pairs(); assert eqW == []
def run_end(A, w): return A.run(w)[-1]
preW = ["", "u", "uv", "uvA"]
DATA['W'] = {'paths': {w: W.path_str(w) for w in ["uuvA", "uvuA", "AuvAuvA"]},
             'acc': {w: W.accepts(w) for w in ["uuvA", "uvuA", "AuvAuvA"]},
             'pairs': {f"{a}|{b}": dist_word(W, run_end(W, a), run_end(W, b)) for a, b in itertools.combinations(preW, 2)}}
assert all(v is not None for v in DATA['W']['pairs'].values())
WPOS = {"S0": (0, 0), "S1": (1.8, 0), "S2": (3.6, 0), "S3": (5.4, 0)}
render(W, IMG + 'boss_W', chain=["S0", "S1", "S2", "S3"], nodesep=0.5, ranksep=0.9)

# Automat T (Entwurf mit 6 Zuständen): mind. zwei A und endet auf v
tpred = lambda w: w.count("A") >= 2 and w.endswith("v")
T = DFA(SG, "S0", {"S5"}, {
    ("S0", "u"): "S0", ("S0", "v"): "S0", ("S0", "A"): "S1",
    ("S1", "u"): "S2", ("S1", "v"): "S2", ("S1", "A"): "S3",
    ("S2", "u"): "S2", ("S2", "v"): "S2", ("S2", "A"): "S3",
    ("S3", "u"): "S4", ("S3", "v"): "S5", ("S3", "A"): "S3",
    ("S4", "u"): "S4", ("S4", "v"): "S5", ("S4", "A"): "S3",
    ("S5", "u"): "S4", ("S5", "v"): "S5", ("S5", "A"): "S3"})
check(T, predicate=tpred, maxlen=8, name="Training T")
rT, eqT = T.minimize_pairs()
assert eqT == [("S1", "S2"), ("S3", "S4")], eqT
DATA['T'] = rounds_table(T, rT); DATA['T']['eq'] = eqT
DATA['T']['dist'] = {f"{p}|{q}": dist_word(T, p, q) for p, q in itertools.combinations(T.states, 2)}
DATA['T']['paths'] = {w: T.path_str(w) for w in ["AuAv", "vAAu"]}
render_pos(T, IMG + 'boss_T', {"S0": (0, 0), "S1": (2.0, 1.2), "S2": (2.0, -1.2), "S3": (4.2, 1.2), "S4": (4.2, -1.2), "S5": (6.2, 0)},
           edge_style={("S0", "S0"): L("s"), ("S1", "S2"): "", ("S2", "S2"): L("s"), ("S3", "S3"): L("n"), ("S4", "S4"): L("s"), ("S5", "S5"): L("e")})
render_triangle(T, rT, ["S0", "S1", "S2", "S3", "S4", "S5"], IMG + 'boss_T_tabelle.png', upto=len(rT))
# zusammengefasster Automat mit den ursprünglichen Namen: {S1, S2} → S1, {S3, S4} → S3
Tm = DFA(SG, "S0", {"S5"}, {("S0", "u"): "S0", ("S0", "v"): "S0", ("S0", "A"): "S1",
                            ("S1", "u"): "S1", ("S1", "v"): "S1", ("S1", "A"): "S3",
                            ("S3", "u"): "S3", ("S3", "v"): "S5", ("S3", "A"): "S3",
                            ("S5", "u"): "S3", ("S5", "v"): "S5", ("S5", "A"): "S3"})
check(Tm, predicate=tpred, maxlen=8, name="Training T minimal")
assert dfa_equivalent(T, Tm) is None and Tm.minimize_pairs()[1] == []
render(Tm, IMG + 'boss_T_min', chain=["S0", "S1", "S3", "S5"], nodesep=0.5, ranksep=0.9)

# Entwicklung: endet auf uvA oder vvA
dpred = lambda w: w.endswith("uvA") or w.endswith("vvA")
Dv = DFA(SG, "S0", {"S3"}, {("S0", "u"): "S1", ("S0", "v"): "S1", ("S0", "A"): "S0",
                            ("S1", "u"): "S1", ("S1", "v"): "S2", ("S1", "A"): "S0",
                            ("S2", "u"): "S1", ("S2", "v"): "S2", ("S2", "A"): "S3",
                            ("S3", "u"): "S1", ("S3", "v"): "S1", ("S3", "A"): "S0"})
check(Dv, predicate=dpred, maxlen=8, name="uvA oder vvA")
assert Dv.minimize_pairs()[1] == []
render(Dv, IMG + 'boss_D', chain=["S0", "S1", "S2", "S3"], nodesep=0.5, ranksep=0.9)

# Mealy M (Controller-Treiber): u/d, v/s, A/a bzw. A/W bei abgeschlossener Kombination
OM = ["d", "s", "a", "W"]
M = Mealy(SG, OM, "S0", {("S0", "u"): ("S1", "d"), ("S0", "v"): ("S0", "s"), ("S0", "A"): ("S0", "a"),
                         ("S1", "u"): ("S1", "d"), ("S1", "v"): ("S2", "s"), ("S1", "A"): ("S0", "a"),
                         ("S2", "u"): ("S1", "d"), ("S2", "v"): ("S0", "s"), ("S2", "A"): ("S0", "W")})
def m_spec(w):
    o = ""
    for i, c in enumerate(w):
        if c == "u": o += "d"
        elif c == "v": o += "s"
        else: o += "W" if w[max(0, i - 2):i] == ["u", "v"] else "a"
    return o
check_mealy(M, m_spec, 7, "Mealy M")
assert mealy_min_states(M) == 3
DATA['W']['M_vs_W'] = {'W_S3_like_S0': all(W.delta[("S3", a)] == W.delta[("S0", a)] for a in SG)}
assert DATA['W']['M_vs_W']['W_S3_like_S0']
DATA['M'] = {w: {'out': tr(M, w), 'steps': steps_str(M, w)} for w in ["uvAvuvA", "uuvAA", "vuvA"]}
render(M, IMG + 'boss_M', chain=["S0", "S1", "S2", "S3"], nodesep=0.5, ranksep=0.9)

# Mealy M2 mit Pause: nach einem Wirbelwind wird das nächste A ignoriert (Ausgabe ε)
M2 = Mealy(SG, OM, "S0", {**{k: v for k, v in M.delta.items()}, ("S2", "A"): ("S3", "W"),
                          ("S3", "u"): ("S3", "d"), ("S3", "v"): ("S3", "s"), ("S3", "A"): ("S0", E)})
def m2_spec(w):
    o, pause = "", False
    for i, c in enumerate(w):
        if c == "u": o += "d"
        elif c == "v": o += "s"
        elif pause: pause = False
        elif w[max(0, i - 2):i] == ["u", "v"]: o += "W"; pause = True
        else: o += "a"
    return o
check_mealy(M2, m2_spec, 8, "Mealy M2")
assert mealy_min_states(M2) == 4
DATA['M2'] = {w: tr(M2, w) for w in ["uvAAA", "uvAuvAA", "uvAvAuvA"]}
render(M2, IMG + 'boss_M2', chain=["S0", "S1", "S2", "S3"], nodesep=0.5, ranksep=0.9)

json.dump(DATA, open((__MAT + '/content/ds06/ds06_data.json'), 'w'), ensure_ascii=False, indent=1)
print(json.dumps(DATA, ensure_ascii=False)[:5000])
print("ALLE CHECKS GRÜN")
