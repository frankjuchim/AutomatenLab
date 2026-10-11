import os as _os_mat
__MAT = _os_mat.path.abspath(_os_mat.path.join(_os_mat.path.dirname(__file__), '../..'))  # Wurzel: materials/
import sys, re; sys.path.insert(0, (__MAT + '/content/ds07'))
from weltb import *
IMG = (__MAT + '/build/img/ds08/')
OUT = {}
ALL = "LOX"

# ------------------------------------------------------------------ 1) LOL: DEA (aus DS01) vs. NEA (App #/parallelwelten?aufgabe=1)
lol_dea = DFA("LOX", "S0", {"S3"}, {
    ("S0","L"):"S1", ("S0","O"):"S0", ("S0","X"):"S0",
    ("S1","L"):"S1", ("S1","O"):"S2", ("S1","X"):"S0",
    ("S2","L"):"S3", ("S2","O"):"S0", ("S2","X"):"S0",
    ("S3","L"):"S3", ("S3","O"):"S3", ("S3","X"):"S3"})
check(lol_dea, predicate=lambda w: "LOL" in w, maxlen=8, name="LOL DEA")
render(lol_dea, IMG + 'lol_dea')
lol = NFA("LOX", "S0", {"S3"}, {("S0", "L"): {"S0", "S1"}, ("S0", "O"): {"S0"}, ("S0", "X"): {"S0"},
                                 ("S1", "O"): {"S2"}, ("S2", "L"): {"S3"},
                                 ("S3", "L"): {"S3"}, ("S3", "O"): {"S3"}, ("S3", "X"): {"S3"}})
check(lol, predicate=lambda w: "LOL" in w, maxlen=9, name="LOL NEA")
render(lol, IMG + 'lol_nea', chain=["S0", "S1", "S2", "S3"])
OUT["lol"] = {w: [lol.accepts(w), nfa_sets_str(lol, w)] for w in ["LLOL", "XLOLO", "LOOL", "LOLOL"]}
D_lol, order = subset_construction(lol)
check(D_lol, predicate=lambda w: "LOL" in w, maxlen=9, name="LOL Teilmengen")
OUT["lol_dea_states"] = len(D_lol.states)

# ------------------------------------------------------------------ 2) Spamfilter GRATIS (App #/parallelwelten?aufgabe=4)
SG = list("GRATISX")
d = {("S0", a): {"S0"} for a in SG}; d[("S0", "G")] = {"S0", "S1"}
for i, a in enumerate("RATIS", start=1): d[(f"S{i}", a)] = {f"S{i+1}"}
for a in SG: d[("S6", a)] = {"S6"}
gratis = NFA(SG, "S0", {"S6"}, d)
check(gratis, predicate=lambda w: "GRATIS" in w, maxlen=7, name="GRATIS ≤7")
check(gratis, accept=["GRATIS", "XGRATISX", "GGRATIS", "GRAGRATIS", "GRATGRATIS", "XXXXGRATIS"], reject=["GRATI", "GRAXTIS", "SITARG", "GRATXS", "GRAGRATI", "GRATTIS"], name="GRATIS Liste")
# zusätzlich: alle Wörter bis Länge 8 über reduziertem Alphabet {G, R, A, X} + Fortsetzung TIS (deckt Rücksprünge ab)
for w in words("GRAX", 6):
    s = "".join(w) + "TIS"
    assert gratis.accepts(s) == ("GRATIS" in s), s
render(gratis, IMG + 'gratis', chain=[f"S{i}" for i in range(7)])
OUT["gratis"] = {w: [gratis.accepts(w), nfa_sets_str(gratis, w)] for w in ["GGRATIS", "GRAGRATIS"]}
D_gr, _ = subset_construction(gratis)
check(D_gr, predicate=lambda w: "GRATIS" in w, maxlen=5, name="GRATIS DEA")
OUT["gratis_dea_states"] = len(D_gr.states)

# ------------------------------------------------------------------ 3) ε-Übergänge: Vorzeichen (App aufgabe=5) und ODER-Baustein
vz = NFA("+-01", "S0", {"S2"}, {("S0", "+"): {"S1"}, ("S0", "-"): {"S1"}, ("S0", EPS): {"S1"}, ("S1", "0"): {"S2"}, ("S1", "1"): {"S2"}, ("S2", "0"): {"S2"}, ("S2", "1"): {"S2"}})
check(vz, predicate=lambda w: re.fullmatch(r"[+-]?[01]+", w) is not None, maxlen=8, name="Vorzeichen")
render(vz, IMG + 'vorzeichen')
OUT["vz"] = {w: [vz.accepts(w), nfa_sets_str(vz, w)] for w in ["+101", "10", "-", "+-1"]}
D_vz, order_vz = subset_construction(vz)
check(D_vz, predicate=lambda w: re.fullmatch(r"[+-]?[01]+", w) is not None, maxlen=8, name="Vorzeichen DEA")
# ODER-NEA: gerade Anzahl a  ODER  endet auf b
oder = NFA("ab", "S0", {"S1", "S4"}, {("S0", EPS): {"S1", "S3"},
          ("S1", "a"): {"S2"}, ("S1", "b"): {"S1"}, ("S2", "a"): {"S1"}, ("S2", "b"): {"S2"},
          ("S3", "a"): {"S3"}, ("S3", "b"): {"S3", "S4"}})
oder_pred = lambda w: w.count("a") % 2 == 0 or w.endswith("b")
check(oder, predicate=oder_pred, maxlen=10, name="ODER")
render(oder, IMG + 'oder', ranks=[["S1", "S3"]] and None)
OUT["oder"] = {w: oder.accepts(w) for w in ["aab", "aba", "ba", "aaa", "abab"]}
OUT["oder"]["ε"] = oder.accepts("")

# ------------------------------------------------------------------ 4) Teilmengenkonstruktion: endet auf ab (App aufgabe=2)
eab = NFA("ab", "S0", {"S2"}, {("S0", "a"): {"S0", "S1"}, ("S0", "b"): {"S0"}, ("S1", "b"): {"S2"}})
eab_pred = lambda w: w.endswith("ab")
check(eab, predicate=eab_pred, maxlen=10, name="endet ab NEA")
render(eab, IMG + 'endet_ab_nea')
D_eab, order_eab = subset_construction(eab)
check(D_eab, predicate=eab_pred, maxlen=10, name="endet ab DEA")
nm = lambda S: ("{" + ", ".join(sorted(S)) + "}") if S else "∅"
OUT["eab_table"] = [[nm(S), D_eab.delta[(nm(S), "a")], D_eab.delta[(nm(S), "b")], "ja" if S & eab.finals else "nein"] for S in order_eab]
render(D_eab, IMG + 'endet_ab_dea')
OUT["eab"] = {w: nfa_sets_str(eab, w) for w in ["abab", "aab", "aba"]}
# drittletztes Zeichen 1 (App aufgabe=3): NEA 4 Zustände, DEA 8 Zustände
d3 = NFA("01", "S0", {"S3"}, {("S0", "0"): {"S0"}, ("S0", "1"): {"S0", "S1"}, ("S1", "0"): {"S2"}, ("S1", "1"): {"S2"}, ("S2", "0"): {"S3"}, ("S2", "1"): {"S3"}})
check(d3, predicate=lambda w: len(w) >= 3 and w[-3] == "1", maxlen=10, name="drittletztes")
render(d3, IMG + 'drittletztes')
D_d3, order_d3 = subset_construction(d3)
check(D_d3, predicate=lambda w: len(w) >= 3 and w[-3] == "1", maxlen=10, name="drittletztes DEA")
r, eq = D_d3.minimize_pairs(); assert eq == [], "DEA zu drittletztes ist minimal"
OUT["d3_states"] = len(D_d3.states)
# Vorzeichen-Teilmengentabelle (mit ε-Hülle)
OUT["vz_table"] = [[nm(S), *[D_vz.delta[(nm(S), a)] for a in "+-01"], "ja" if S & vz.finals else "nein"] for S in order_vz]

for k, v in OUT.items(): print(k, v)
dump(OUT, (__MAT + '/content/ds08/ds08.json'))
print("DS08 ok")
# minimale Zustandszahlen (für Lösungstexte)
def min_count(D):
    r, eq = D.minimize_pairs()
    import itertools
    parent = {q: q for q in D.states}
    def f(x):
        while parent[x] != x: x = parent[x]
        return x
    for a, b in eq: parent[f(a)] = f(b)
    return len({f(q) for q in D.states}) + (0 if D.is_complete() else 1)
OUT["lol_min"] = min_count(D_lol); OUT["gratis_min"] = min_count(D_gr)
print("min:", OUT["lol_min"], OUT["gratis_min"])
dump(OUT, (__MAT + '/content/ds08/ds08.json'))
