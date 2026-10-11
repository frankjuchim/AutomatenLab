import os as _os_mat
__MAT = _os_mat.path.abspath(_os_mat.path.join(_os_mat.path.dirname(__file__), '../..'))  # Wurzel: materials/
"""DS02 – Level 2 „Was macht dieser Automat?“ – alle Automaten, verifiziert mit check(), gerendert nach build/img/ds02."""
import sys; sys.path.insert(0, (__MAT + '/lib'))
from automata import *
IMG = (__MAT + '/build/img/ds02/')
ab = "ab"
cnt = lambda w, c: sum(1 for x in w if x == c)

# ---------------------------------------------------------------- Einstieg: 4 Mystery-Automaten (= App-Fälle 3, 1, 8, 6)
m1 = DFA(ab, "S0", {"S0"}, {("S0","a"):"S1", ("S0","b"):"S0", ("S1","a"):"S0", ("S1","b"):"S1"})
check(m1, predicate=lambda w: cnt(w,"a") % 2 == 0, maxlen=8, name="M1 gerade a")
m2 = DFA(ab, "S0", {"S1"}, {("S0","a"):"S0", ("S0","b"):"S1", ("S1","a"):"S0", ("S1","b"):"S1"})
check(m2, predicate=lambda w: w.endswith("b"), maxlen=8, name="M2 endet b")
m3 = DFA(ab, "S0", {"S1","S3"}, {("S0","a"):"S1", ("S0","b"):"S3", ("S1","a"):"S1", ("S1","b"):"S2",
        ("S2","a"):"S1", ("S2","b"):"S2", ("S3","a"):"S4", ("S3","b"):"S3", ("S4","a"):"S4", ("S4","b"):"S3"})
check(m3, predicate=lambda w: len(w) > 0 and w[0] == w[-1], maxlen=8, name="M3 Anfang=Ende")
m4 = DFA(ab, "S0", {"S0","S1"}, {("S0","a"):"S1", ("S0","b"):"S0", ("S1","b"):"S0"})
check(m4, predicate=lambda w: "aa" not in w, maxlen=8, name="M4 kein aa")
render(m1, IMG+'m1')
render(m2, IMG+'m2')
render(m3, IMG+'m3', ranks=[["S1","S3"],["S2","S4"]])
render(m4, IMG+'m4')

# ---------------------------------------------------------------- Aufgabe 1: Graph -> formale Definition; Tabelle -> Graph
a1 = DFA(ab, "S0", {"S2"}, {("S0","a"):"S0", ("S0","b"):"S1", ("S1","a"):"S1", ("S1","b"):"S2", ("S2","a"):"S2", ("S2","b"):"S2"})
check(a1, predicate=lambda w: cnt(w,"b") >= 2, maxlen=8, name="A1a mind. zwei b")
render(a1, IMG+'a1_zweib', chain=["S0","S1","S2"])
a1b = DFA("01", "S0", {"S2"}, {("S0","0"):"S1", ("S0","1"):"S0", ("S1","0"):"S2", ("S1","1"):"S0", ("S2","0"):"S2", ("S2","1"):"S0"})
check(a1b, predicate=lambda w: w.endswith("00"), maxlen=8, name="A1b endet 00")
render(a1b, IMG+'a1_endet00', chain=["S0","S1","S2"])
print("A1b Tabelle:", a1b.table())

# ---------------------------------------------------------------- Aufgabe 2: Barcode-Startzeichen 110
bar = DFA("01", "S0", {"S3"}, {("S0","1"):"S1", ("S1","1"):"S2", ("S2","0"):"S3", ("S3","0"):"S3", ("S3","1"):"S3"})
check(bar, predicate=lambda w: w.startswith("110"), maxlen=8, name="Barcode")
render(bar, IMG+'barcode', chain=["S0","S1","S2","S3"])
render(bar, IMG+'barcode_komplett', error_state=True, chain=["S0","S1","S2","S3"])
for w in ["1101", "1110", "0110", "110"]:
    print("Barcode", w, bar.accepts(w), bar.path_str(w))
# 2d) Veränderung: nach dem Startzeichen muss mindestens ein Datenbit folgen
bar2 = DFA("01", "S0", {"S4"}, {("S0","1"):"S1", ("S1","1"):"S2", ("S2","0"):"S3", ("S3","0"):"S4", ("S3","1"):"S4", ("S4","0"):"S4", ("S4","1"):"S4"})
check(bar2, predicate=lambda w: w.startswith("110") and len(w) >= 4, maxlen=8, name="Barcode+1")
render(bar2, IMG+'barcode2', chain=["S0","S1","S2","S3","S4"])

# ---------------------------------------------------------------- Aufgabe 3: Quersumme gerade über {1,2,3} (angelehnt Abi 2025 eA B)
qs = DFA("123", "S0", {"S0"}, {("S0","1"):"S1", ("S0","3"):"S1", ("S0","2"):"S0", ("S1","1"):"S0", ("S1","3"):"S0", ("S1","2"):"S1"})
check(qs, predicate=lambda w: sum(int(c) for c in w) % 2 == 0, maxlen=7, name="Quersumme")
render(qs, IMG+'quersumme')
for w in ["1232", "3112", "2"]:
    print("QS", w, qs.accepts(w), qs.path_str(w), sum(int(c) for c in w))
# 3d) Σ = {0,…,7}: gleiche zwei Zustände, gerade Ziffern = Schleife, ungerade = Wechsel
qs7 = DFA("01234567", "S0", {"S0"}, {(q, d): (q if int(d) % 2 == 0 else ("S1" if q == "S0" else "S0")) for q in ["S0","S1"] for d in "01234567"})
check(qs7, predicate=lambda w: sum(int(c) for c in w) % 2 == 0, maxlen=4, name="Quersumme 0-7")
render(qs7, IMG+'quersumme07')

# ---------------------------------------------------------------- Aufgabe 4 (Profi): Prüfnummer mit Trennzeichen, Kriterium Z
def kritZ(w):
    if w.count("-") != 1: return False
    x, y = w.split("-")
    return len(x) >= 1 and len(y) >= 1 and sum(map(int, x)) % 2 == 0 and sum(map(int, y)) % 2 == 1
pn = DFA("123-", "S0", {"S4"}, {
    ("S0","2"):"S1", ("S0","1"):"S2", ("S0","3"):"S2",
    ("S1","2"):"S1", ("S1","1"):"S2", ("S1","3"):"S2", ("S1","-"):"S3",
    ("S2","2"):"S2", ("S2","1"):"S1", ("S2","3"):"S1",
    ("S3","1"):"S4", ("S3","3"):"S4", ("S3","2"):"S5",
    ("S4","2"):"S4", ("S4","1"):"S5", ("S4","3"):"S5",
    ("S5","2"):"S5", ("S5","1"):"S4", ("S5","3"):"S4"})
check(pn, predicate=kritZ, maxlen=7, name="Prüfnummer Z")
PN_STYLE = {("S1","S1"):'headport=w, tailport=w', ("S4","S4"):'headport=w, tailport=w', ("S2","S2"):'headport=e, tailport=e', ("S5","S5"):'headport=e, tailport=e',
            ("S1","S3"):'label=" - ", fontsize=18'}
render(pn, IMG+'pruefnummer', rankdir="TB", ranks=[["S1","S2"],["S4","S5"]], edge_style=PN_STYLE, nodesep=1.3, ranksep=0.55)
for w in ["21-3", "13-22", "2-12", "22-1"]:
    print("PN", w, pn.accepts(w), pn.path_str(w))
rounds, eq = pn.minimize_pairs()
print("PN äquivalente Paare:", eq)

# ---------------------------------------------------------------- Hausaufgabe Boss-Training
# H1: Passwort-Prüfer, Σ = {k, g, z}: mindestens ein Großbuchstabe UND endet auf Ziffer
pw = DFA("kgz", "S0", {"S2"}, {("S0","k"):"S0", ("S0","z"):"S0", ("S0","g"):"S1",
        ("S1","k"):"S1", ("S1","g"):"S1", ("S1","z"):"S2", ("S2","z"):"S2", ("S2","k"):"S1", ("S2","g"):"S1"})
check(pw, predicate=lambda w: "g" in w and w.endswith("z"), maxlen=7, name="Passwort")
render(pw, IMG+'passwort', chain=["S0","S1","S2"])
for w in ["kgzz", "zgkz", "gzk", "kkzz"]:
    print("PW", w, pw.accepts(w), pw.path_str(w))
# H2: vorletztes Zeichen ist a
v = DFA(ab, "S0", {"S2","S3"}, {("S0","a"):"S1", ("S0","b"):"S0", ("S1","a"):"S2", ("S1","b"):"S3",
        ("S2","a"):"S2", ("S2","b"):"S3", ("S3","a"):"S1", ("S3","b"):"S0"})
check(v, predicate=lambda w: len(w) >= 2 and w[-2] == "a", maxlen=8, name="vorletztes a")
render(v, IMG+'vorletztes', chain=["S0","S1","S2"], ranks=[["S3"]])
for w in ["abba", "baab", "bab", "aab"]:
    print("V", w, v.accepts(w), v.path_str(w))
print("H2 äquivalente Paare (sollte leer sein):", v.minimize_pairs()[1])
print("OK DS02")

# ---------------------------------------------------------------- Lösungen für die Build-Skripte (aus dem Code, nicht von Hand)
import json
def P(A, w):
    s = A.path_str(w).replace("–-→", "–„-“→")
    return s + ("  ⇒  akzeptiert" if A.accepts(w) else "  ⇒  abgelehnt")
SOL = {
    "bar": {w: P(bar, w) for w in ["1101", "1110", "0110"]},
    "qs": {w: P(qs, w) for w in ["1232", "3112"]},
    "pn": {w: P(pn, w) for w in ["2-12", "13-22", "21-3"]},
    "pw": {w: P(pw, w) for w in ["kgzz", "zgkz", "gzk", "kkzz"]},
    "v": {w: P(v, w) for w in ["abba", "baab", "bab"]},
    "a1b_table": a1b.table(),
    "a1_table": a1.table(),
    "m1_table": m1.table(),
    "pn_eq": pn.minimize_pairs()[1],
    "m": {"m1": [w for w in ["ε","a","aa","ab","bab","abab","aaa"]], },
}
for w in ["gkz", "kgkzz"]: assert pw.accepts(w)
SOL["pw_bsp"] = ["gkz", "kgkzz"]
SOL["mtest"] = {name: {w: A.accepts("" if w == "ε" else w) for w in ["ε","a","b","aa","ab","ba","bb","aba","bab","abba","baab","aab"]}
               for name, A in [("m1", m1), ("m2", m2), ("m3", m3), ("m4", m4)]}
json.dump(SOL, open((__MAT + '/content/ds02/solutions.json'), 'w'), ensure_ascii=False, indent=1)
