import os as _os_mat
__MAT = _os_mat.path.abspath(_os_mat.path.join(_os_mat.path.dirname(__file__), '../..'))  # Wurzel: materials/
"""DS05 – Level 5 „Weniger ist mehr“: Minimierung & Unterscheidbarkeit.
Alle Automaten werden mit automata.py verifiziert; Minimierungsrunden kommen aus minimize_pairs().
Ergebnisse (Runden, unterscheidende Wörter, Zustandsfolgen) werden nach ds05_data.json geschrieben
und von build_ds05.js / build_m03.js gelesen."""
import sys, json, itertools
sys.path.insert(0, (__MAT + '/lib'))
sys.path.insert(0, (__MAT + '/content/ds05'))
from automata import *
from minhelp import complete, dist_word, rounds_table, render_triangle, classes_from_pairs, render_pos
L = lambda p: f'tailport={p}, headport={p}'

IMG = (__MAT + '/build/img/ds05/')
DATA = {}

# ------------------------------------------------------------------------------------------
# 1) Smiley-Erkenner ":-)" und ":)" – Entwurf A (6 Zustände inkl. Fehlerzustand) und B (5)
# ------------------------------------------------------------------------------------------
SIG = [":", "-", ")"]
smA_inc = DFA(SIG, "S0", {"S3", "S4"}, {("S0", ":"): "S1", ("S1", "-"): "S2", ("S1", ")"): "S4", ("S2", ")"): "S3"})
check(smA_inc, accept=[":-)", ":)"], predicate=lambda w: w in (":-)", ":)"), maxlen=6, name="Smiley A")
smA = complete(smA_inc)           # expliziter Fehlerzustand F_err
check(smA, predicate=lambda w: w in (":-)", ":)"), maxlen=6, name="Smiley A komplett")
smB_inc = DFA(SIG, "S0", {"S3"}, {("S0", ":"): "S1", ("S1", "-"): "S2", ("S1", ")"): "S3", ("S2", ")"): "S3"})
smB = complete(smB_inc)
check(smB, predicate=lambda w: w in (":-)", ":)"), maxlen=6, name="Smiley B komplett")
assert dfa_equivalent(smA, smB) is None
assert len(smA.states) == 6 and len(smB.states) == 5
LO = {"F_err": "F_err"}
NS = {"F_err": 'style=dashed, color="#7A8A8F", fontcolor="#7A8A8F", fontsize=12'}
LOOP = {("F_err", "F_err"): "tailport=e, headport=s"}
render(smA, IMG + 'smileyA', label_override=LO, node_style=NS, edge_style=LOOP,
       ranks=[["S2", "S4"], ["S3", "F_err"]], chain=["S0", "S1", "S2", "S3"], nodesep=0.6, ranksep=0.8)
render(smB, IMG + 'smileyB', label_override=LO, node_style=NS,
       edge_style={**LOOP, ("S0", "S1"): "weight=10", ("S1", "S2"): "weight=10", ("S0", "F_err"): "constraint=false"},
       ranks=[["S2", "S3"]], nodesep=0.9, ranksep=0.9)
rA, eqA = smA.minimize_pairs()
assert eqA == [("S3", "S4")], eqA
DATA['smiley'] = rounds_table(smA, rA)
DATA['smiley']['eq'] = eqA
DATA['smiley']['dist'] = {f"{p}|{q}": dist_word(smA, p, q) for p, q in itertools.combinations(smA.states, 2)}
order = ["S0", "S1", "S2", "S3", "S4", "F_err"]
for k in range(len(rA) + 1):   # Runde 0..n und Endstand
    render_triangle(smA, rA, order, IMG + f'smiley_runde{k}.png', upto=k)
render_triangle(smA, rA, order, IMG + 'smiley_leer.png', upto=-1)

# ------------------------------------------------------------------------------------------
# 2) AB Aufgabe 1: gerade Anzahl a (4 Zustände, merkt sich zusätzlich b) – App-Aufgabe 2
# ------------------------------------------------------------------------------------------
ga = DFA("ab", "S0", {"S0", "S2"}, {
    ("S0", "a"): "S1", ("S0", "b"): "S2", ("S1", "a"): "S2", ("S1", "b"): "S3",
    ("S2", "a"): "S3", ("S2", "b"): "S0", ("S3", "a"): "S0", ("S3", "b"): "S1"})
check(ga, predicate=lambda w: w.count("a") % 2 == 0, maxlen=8, name="gerade a")
render_pos(ga, IMG + 'gerade_a', {"S0": (0, 1.7), "S2": (2.4, 1.7), "S1": (0, 0), "S3": (2.4, 0)},
           edge_style={("S1", "S2"): 'label="", taillabel="a", labeldistance=3.2, labelangle=25, labelfontsize=13',
                       ("S3", "S0"): 'label="", taillabel="a", labeldistance=3.2, labelangle=-25, labelfontsize=13'})
rG, eqG = ga.minimize_pairs()
assert eqG == [("S0", "S2"), ("S1", "S3")], eqG
DATA['gerade_a'] = {'dist': {f"{p}|{q}": dist_word(ga, p, q) for p, q in itertools.combinations(ga.states, 2)}, 'eq': eqG}
DATA['gerade_a'].update(rounds_table(ga, rG))
gam = DFA("ab", "S0", {"S0"}, {("S0", "a"): "S1", ("S0", "b"): "S0", ("S1", "a"): "S0", ("S1", "b"): "S1"})
check(gam, predicate=lambda w: w.count("a") % 2 == 0, maxlen=8, name="gerade a minimal")
render(gam, IMG + 'gerade_a_min')

# ------------------------------------------------------------------------------------------
# 3) AB Aufgabe 2: Markierungsverfahren „endet auf ab“ 5 → 3 (App-Aufgabe 5)
# ------------------------------------------------------------------------------------------
eab = DFA("ab", "S0", {"S2"}, {
    ("S0", "a"): "S1", ("S0", "b"): "S0", ("S1", "a"): "S3", ("S1", "b"): "S2",
    ("S2", "a"): "S4", ("S2", "b"): "S0", ("S3", "a"): "S3", ("S3", "b"): "S2",
    ("S4", "a"): "S3", ("S4", "b"): "S2"})
check(eab, predicate=lambda w: w.endswith("ab"), maxlen=8, name="endet ab")
render_pos(eab, IMG + 'endet_ab', {"S0": (0, 0), "S1": (1.5, 0), "S2": (3, 0), "S4": (4.5, 0), "S3": (2.25, 1.3)},
           edge_style={("S0", "S0"): L("n"), ("S3", "S3"): L("n"), ("S2", "S0"): "tailport=s, headport=s"})
rE, eqE = eab.minimize_pairs()
render_triangle(eab, rE, ["S0", "S1", "S2", "S3", "S4"], IMG + 'endet_ab_leer.png', upto=-1)
assert eqE == [("S1", "S3"), ("S1", "S4"), ("S3", "S4")], eqE
DATA['endet_ab'] = rounds_table(eab, rE); DATA['endet_ab']['eq'] = eqE
for k in range(len(rE) + 1):
    render_triangle(eab, rE, ["S0", "S1", "S2", "S3", "S4"], IMG + f'endet_ab_runde{k}.png', upto=k)
eabm = DFA("ab", "S0", {"S2"}, {("S0", "a"): "S1", ("S0", "b"): "S0", ("S1", "a"): "S1", ("S1", "b"): "S2",
                               ("S2", "a"): "S1", ("S2", "b"): "S0"})
check(eabm, predicate=lambda w: w.endswith("ab"), maxlen=8, name="endet ab minimal")
assert dfa_equivalent(eab, eabm) is None
render(eabm, IMG + 'endet_ab_min', chain=["S0", "S1", "S2"])

# ------------------------------------------------------------------------------------------
# 4) AB Aufgabe 3: E-Sport-Coach (angelehnt Abi 2022 eA C b) – eigene Variante
#    Ergebnisse 2 (Sieg), 1 (Unentschieden), 0 (Niederlage). Coach wird ausgewechselt (= akzeptiert),
#    sobald das Team in drei aufeinanderfolgenden Spielen insgesamt höchstens 1 Punkt holt.
#    Danach bleibt die Entscheidung bestehen (akzeptierender Zustand wird nicht mehr verlassen).
# ------------------------------------------------------------------------------------------
def coach_pred(w):
    g = [int(c) for c in w]
    return any(sum(g[i:i + 3]) <= 1 for i in range(len(g) - 2))

# DEA systematisch aus der „Erinnerung“ (letzte beiden Ergebnisse) erzeugen und minimieren
from minhelp import build_from_memory, minimize_dfa
coach_full = build_from_memory("012", coach_pred, maxlen=7)
check(coach_full, predicate=coach_pred, maxlen=8, name="Coach (voll)")
coach, cmap = minimize_dfa(coach_full)
check(coach, predicate=coach_pred, maxlen=9, name="Coach (minimal)")
DATA['coach'] = {'n_min': len(coach.states)}
def run_end(A, w):
    return A.run(w)[-1]
def dist_after(A, u, v):
    return dist_word(A, run_end(A, u), run_end(A, v))
DATA['coach']['20_02'] = dist_after(coach, "20", "02")
DATA['coach']['11_21'] = dist_after(coach, "11", "21")
DATA['coach']['10_01'] = dist_after(coach, "10", "01")
assert DATA['coach']['20_02'] is not None and DATA['coach']['11_21'] is None
# Gegenprobe ohne Automat: 2000 / 0200 bzw. 1100 vs 2100 …
assert coach_pred("2000") and not coach_pred("0200")
for w in map("".join, itertools.product("012", repeat=5)):
    assert coach_pred("11" + w) == coach_pred("21" + w)
coach_draw = DFA("012", "S0", coach.finals, {k: v for k, v in coach.delta.items() if not (k[1] == "2" and v == "S0")})
render_pos(coach_draw, IMG + 'coach_min', {"S0": (0, 0), "S1": (2, 0.9), "S2": (2, -0.9), "S3": (4, 1.8), "S4": (4, 0),
           "S5": (4, -1.8), "S6": (6, 0)}, edge_style={("S2", "S2"): L("s"), ("S6", "S6"): L("e")})
DATA['coach']['states'] = coach.states
DATA['coach']['ends'] = {w: coach.run(w)[-1] for w in ["", "0", "1", "2", "00", "01", "02", "10", "11", "12", "20", "21", "22"]}
DATA['coach']['paths'] = {w: coach.path_str(w) for w in ["2000", "0200", "2100", "1100"]}

# ------------------------------------------------------------------------------------------
# 5) AB Aufgabe 4: Gutscheincodes – Kriterium W (angelehnt Abi 2025 eA B c) – eigene Variante
#    Zwei Ziffernblöcke über {0, 1, 5}, getrennt durch #, jeder Block mind. eine Ziffer.
#    Kriterium W: Die Quersummen der beiden Blöcke haben VERSCHIEDENE Parität.
# ------------------------------------------------------------------------------------------
def gut_pred(w):
    if w.count("#") != 1: return False
    a, b = w.split("#")
    if not a or not b: return False
    return (sum(map(int, a)) % 2) != (sum(map(int, b)) % 2)
odd, even = ["1", "5"], ["0"]
d = {("S0", x): "S1" for x in odd} | {("S0", x): "S2" for x in even}
d |= {("S1", x): "S2" for x in odd} | {("S1", x): "S1" for x in even} | {("S1", "#"): "S3"}
d |= {("S2", x): "S1" for x in odd} | {("S2", x): "S2" for x in even} | {("S2", "#"): "S6"}
# erster Block ungerade: S3 (zweiter leer), S4 (zweiter ungerade), S5 (zweiter gerade)
d |= {("S3", x): "S4" for x in odd} | {("S3", x): "S5" for x in even}
d |= {("S4", x): "S5" for x in odd} | {("S4", x): "S4" for x in even}
d |= {("S5", x): "S4" for x in odd} | {("S5", x): "S5" for x in even}
# erster Block gerade: S6 (zweiter leer), S7 (zweiter ungerade), S8 (zweiter gerade)
d |= {("S6", x): "S7" for x in odd} | {("S6", x): "S8" for x in even}
d |= {("S7", x): "S8" for x in odd} | {("S7", x): "S7" for x in even}
d |= {("S8", x): "S7" for x in odd} | {("S8", x): "S8" for x in even}
gut = DFA(["0", "1", "5", "#"], "S0", {"S5", "S7"}, d)
check(gut, accept=["10#0", "0#5", "15#1", "0#100"], reject=["1#1", "0#0", "1#", "#1", "15#15", "1#1#0"],
      predicate=gut_pred, maxlen=6, name="Gutschein")
GPOS = {"S0": (0, 0), "S2": (1.5, 1.1), "S1": (1.5, -1.1), "S6": (3.2, 1.1), "S3": (3.2, -1.1),
        "S7": (4.9, 1.9), "S8": (4.9, 0.4), "S4": (4.9, -0.4), "S5": (4.9, -1.9)}
GES = {("S1", "S1"): L("s"), ("S2", "S2"): L("n"), **{(q, q): L("e") for q in ["S4", "S5", "S7", "S8"]}}
render_pos(gut, IMG + 'gutschein', GPOS, edge_style=GES)
rW, eqW = gut.minimize_pairs()
clsW = classes_from_pairs(gut.states, eqW)
DATA['gutschein'] = {'eq': eqW, 'classes': clsW,
                     'dist': {f"{p}|{q}": dist_word(gut, p, q) for p, q in itertools.combinations(["S3", "S4", "S5", "S6", "S7", "S8"], 2)},
                     'paths': {w: gut.path_str(w) for w in ["10#0", "05#51", "1#15"]},
                     'acc': {w: gut.accepts(w) for w in ["10#0", "05#51", "1#15"]}}
assert [c for c in clsW if len(c) > 1] == [["S4", "S6", "S8"], ["S5", "S7"]], clsW
gutm = DFA(["0", "1", "5", "#"], "S0", {"S5"}, {
    **{("S0", x): "S1" for x in odd}, **{("S0", x): "S2" for x in even},
    **{("S1", x): "S2" for x in odd}, **{("S1", x): "S1" for x in even}, ("S1", "#"): "S3",
    **{("S2", x): "S1" for x in odd}, **{("S2", x): "S2" for x in even}, ("S2", "#"): "S4",
    **{("S3", x): "S4" for x in odd}, **{("S3", x): "S5" for x in even},
    **{("S4", x): "S5" for x in odd}, **{("S4", x): "S4" for x in even},
    **{("S5", x): "S4" for x in odd}, **{("S5", x): "S5" for x in even}})
check(gutm, predicate=gut_pred, maxlen=6, name="Gutschein minimal")
assert dfa_equivalent(gut, gutm) is None
render_pos(gutm, IMG + 'gutschein_min', {"S0": (0, 0), "S2": (1.5, 1.0), "S1": (1.5, -1.0), "S4": (3.2, 1.0), "S3": (3.2, -1.0),
           "S5": (4.9, 0)}, edge_style={("S1", "S1"): L("s"), ("S2", "S2"): L("n"), ("S4", "S4"): L("n"), ("S5", "S5"): L("e")})

# ------------------------------------------------------------------------------------------
# 6) AB Aufgabe 5: Mindestzahl begründen (angelehnt Abi 2024 eA B c)
#    a) genau drei a über {a, b}: mind. 5 Zustände (vollständig)
#    b) Türcode über {A, B}: endet auf B; neu zusätzlich Länge ≥ 4 → mind. 5 Zustände (also +3)
# ------------------------------------------------------------------------------------------
drei = DFA("ab", "S0", {"S3"}, {**{(f"S{i}", "a"): f"S{i+1}" for i in range(4)}, ("S4", "a"): "S4",
                                **{(f"S{i}", "b"): f"S{i}" for i in range(5)}})
check(drei, predicate=lambda w: w.count("a") == 3, maxlen=8, name="genau drei a")
r3, eq3 = drei.minimize_pairs(); assert eq3 == []
pre3 = ["", "a", "aa", "aaa", "aaaa"]
DATA['drei_a'] = {'pairs': {f"{u}|{v}": dist_after(drei, u, v) for u, v in itertools.combinations(pre3, 2)}}
assert all(x is not None for x in DATA['drei_a']['pairs'].values())
render(drei, IMG + 'drei_a', chain=["S0", "S1", "S2", "S3", "S4"])

tuer_alt = DFA("AB", "S0", {"S1"}, {("S0", "A"): "S0", ("S0", "B"): "S1", ("S1", "A"): "S0", ("S1", "B"): "S1"})
check(tuer_alt, predicate=lambda w: w.endswith("B"), maxlen=7, name="Tür alt")
tpred = lambda w: w.endswith("B") and len(w) >= 4
tuer = DFA("AB", "S0", {"S4"}, {("S0", "A"): "S1", ("S0", "B"): "S1", ("S1", "A"): "S2", ("S1", "B"): "S2",
                               ("S2", "A"): "S3", ("S2", "B"): "S3", ("S3", "A"): "S3", ("S3", "B"): "S4",
                               ("S4", "A"): "S3", ("S4", "B"): "S4"})
check(tuer, predicate=tpred, maxlen=8, name="Tür neu")
rT, eqT = tuer.minimize_pairs(); assert eqT == []
preT = ["", "A", "AA", "AAA", "AAAB"]
DATA['tuer'] = {'pairs': {f"{u}|{v}": dist_after(tuer, u, v) for u, v in itertools.combinations(preT, 2)}}
assert all(x is not None for x in DATA['tuer']['pairs'].values())
render(tuer, IMG + 'tuer', chain=["S0", "S1", "S2", "S3", "S4"])
render(tuer_alt, IMG + 'tuer_alt')

def follow_table(A, rounds):
    key = lambda x: (int(x[1:]) if x[1:].isdigit() else 999)
    r_of = {}
    for r, R in enumerate(rounds):
        for p in R: r_of[frozenset(p)] = r
    rows = []
    for p in sorted([sorted(p, key=key) for p in __import__('itertools').combinations(A.states, 2)], key=lambda x: (key(x[1]), key(x[0]))):
        if r_of.get(frozenset(p)) == 0: continue
        fl = []
        for a in A.sigma:
            x, y = A.delta[(p[0], a)], A.delta[(p[1], a)]
            fl.append("gleich (" + x + ")" if x == y else "(" + ", ".join(sorted([x, y], key=key)) + ")")
        rows.append([p, fl, r_of.get(frozenset(p))])
    return rows
DATA['endet_ab']['follow'] = follow_table(eab, rE)
DATA['smiley']['follow'] = follow_table(smA, rA)
DATA['smiley']['sigma'] = smA.sigma
json.dump(DATA, open((__MAT + '/content/ds05/ds05_data.json'), 'w'), ensure_ascii=False, indent=1)
print(json.dumps({k: (v if k != 'smiley' else {kk: vv for kk, vv in v.items() if kk != 'dist'}) for k, v in DATA.items()}, ensure_ascii=False, indent=1)[:6000])
print("Smiley dist:", DATA['smiley']['dist'])
print("ALLE CHECKS GRÜN")
