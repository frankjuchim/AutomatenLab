import os as _os_mat
__MAT = _os_mat.path.abspath(_os_mat.path.join(_os_mat.path.dirname(__file__), '../..'))  # Wurzel: materials/
import sys; sys.path.insert(0, (__MAT + '/lib'))
from automata import *
IMG = (__MAT + '/build/img/ds01/')

# 1) LOL-Erkenner
lol = DFA("LOX", "S0", {"S3"}, {
    ("S0","L"):"S1", ("S0","O"):"S0", ("S0","X"):"S0",
    ("S1","L"):"S1", ("S1","O"):"S2", ("S1","X"):"S0",
    ("S2","L"):"S3", ("S2","O"):"S0", ("S2","X"):"S0",
    ("S3","L"):"S3", ("S3","O"):"S3", ("S3","X"):"S3"})
check(lol, predicate=lambda w: "LOL" in w, maxlen=8, name="LOL")
render(lol, IMG+'lol')

# 2) Zahlenschloss: Eingabe endet auf 4200, Σ = {4,2,0,x}
d = {}
for q in ["S0","S1","S2","S3","S4"]:
    for a in "420x": d[(q,a)] = "S1" if a=="4" else "S0"
d[("S1","2")]="S2"; d[("S2","0")]="S3"; d[("S3","0")]="S4"
schloss = DFA("420x", "S0", {"S4"}, d)
check(schloss, predicate=lambda w: w.endswith("4200"), maxlen=8, name="Schloss")
render(schloss, IMG+"schloss", chain=["S0","S1","S2","S3","S4"])
# Lückenversion für AB (einige Beschriftungen fehlen)
gap = {("S2","S3"):'label=" ? "', ("S3","S0"):'label=" ? "', ("S4","S1"):'label=" ? "', ("S1","S1"):'label=" ? "'}
render(schloss, IMG+"schloss_luecke", edge_style=gap, chain=["S0","S1","S2","S3","S4"])

# 3) Kaffeeautomat 40 ct, Münzen 10 und 20, passend; Überzahlung -> Fehlerzustand (Münzen zurück)
kaffee = DFA(["10","20"], "S0", {"S4"}, {
    ("S0","10"):"S1", ("S0","20"):"S2", ("S1","10"):"S2", ("S1","20"):"S3",
    ("S2","10"):"S3", ("S2","20"):"S4", ("S3","10"):"S4"})
def sum40(w): return sum(int(x) for x in w) == 40
check(kaffee, predicate=sum40, maxlen=5, sigma=["10","20"], name="Kaffee")
render(kaffee, IMG+'kaffee', label_override={"S0":"S0","S1":"S1","S2":"S2","S3":"S3","S4":"S4"})
render(kaffee, IMG+'kaffee_komplett', error_state=True)
acc = sorted("".join(f"{x}+" for x in w)[:-1] for w in words(["10","20"],4) if sum40(w))
print("Kaffee akzeptiert:", acc)

# 4) Kaffee 50 ct (Lösung Profi-Aufgabe)
k50 = DFA(["10","20"], "S0", {"S5"}, {(f"S{i}", "10"): f"S{i+1}" for i in range(5)} | {(f"S{i}", "20"): f"S{i+2}" for i in range(4)})
check(k50, predicate=lambda w: sum(int(x) for x in w)==50, maxlen=6, sigma=["10","20"], name="K50")
render(k50, IMG+'kaffee50')

# Zustandsfolgen für Lösungen
for w in ["XLOLX","LOOL","LLOL","OLOXL"]:
    print(w, lol.accepts(w), lol.path_str(w))
for w in ["24200","42004200","42000","4420"]:
    print(w, schloss.accepts(w), schloss.path_str(w))
for w in [["10","20","10"],["20","20","10"],["20","10","10"]]:
    print(w, kaffee.accepts(w), kaffee.path_str(w))
