import os as _os_mat
__MAT = _os_mat.path.abspath(_os_mat.path.join(_os_mat.path.dirname(__file__), '../..'))  # Wurzel: materials/
"""Übungsklausur Grundkurs (gA) „Fahrradverleih“ – alle Automaten verifiziert (DEA, Mealy, Grenzen endlicher Automaten)."""
import sys, json; sys.path.insert(0, (__MAT + '/lib'))
from automata import *
IMG = (__MAT + '/build/img/abschluss/')
OUT_JSON = (__MAT + '/build/klausur_ga.json')
loes = {}

# ---------------------------------------------------------------------------------------------
# Teil 1: Ausleihcodes über Σ = {R, E, 0, 1}
#   Code = Radart (R normales Rad, E E-Bike), danach mindestens zwei Ziffern 0/1; die Anzahl der Ziffer 1 ist gerade
#   (Prüfregel gegen Tippfehler).  Beispiele: R00, E0110, R11 – keine Codes: E1, R, R010.
SIG = "RE01"
def is_code(w):
    if len(w) < 3 or w[0] not in "RE": return False
    z = w[1:]
    return all(c in "01" for c in z) and z.count("1") % 2 == 0

# S1: Radart gelesen, noch keine Ziffer · S2: genau eine Ziffer (0) · S3: Anzahl der 1 ungerade · S4: ≥ 2 Ziffern, Anzahl der 1 gerade
A = DFA(SIG, "S0", {"S4"}, {
    ("S0", "R"): "S1", ("S0", "E"): "S1",
    ("S1", "0"): "S2", ("S1", "1"): "S3",
    ("S2", "0"): "S4", ("S2", "1"): "S3",
    ("S3", "0"): "S3", ("S3", "1"): "S4",
    ("S4", "0"): "S4", ("S4", "1"): "S3",
})
check(A, predicate=is_code, maxlen=7, name="A")
_, eq = A.minimize_pairs(); assert eq == [], eq   # keine überflüssigen Zustände (Zusammenfassen ist hier nicht gefragt)
render(A, IMG + "klausur_ga_A", chain=["S0", "S1", "S2", "S4"], nodesep=0.6, ranksep=1.1)
loes["a"] = {w: {"akzeptiert": A.accepts(w), "folge": A.path_str(w)} for w in ["R0110", "E1", "E101", "E1011"]}
assert loes["a"]["E101"]["akzeptiert"] and not loes["a"]["E1011"]["akzeptiert"]
loes["a_beispiele"] = sorted("".join(w) for w in words(SIG, 4) if len(w) == 4 and is_code("".join(w)))[:8]
print("a)", loes["a"])

# Lösung d): Codes = Radart, danach mindestens eine Ziffer; bei E-Bikes (E) ist die letzte Ziffer eine 1
def is_code_d(w):
    if len(w) < 2 or w[0] not in "RE" or not all(c in "01" for c in w[1:]): return False
    return w[0] == "R" or w[-1] == "1"
AD = DFA(SIG, "S0", {"S2", "S4"}, {
    ("S0", "R"): "S1", ("S0", "E"): "S3",
    ("S1", "0"): "S2", ("S1", "1"): "S2", ("S2", "0"): "S2", ("S2", "1"): "S2",
    ("S3", "0"): "S5", ("S3", "1"): "S4",
    ("S4", "0"): "S5", ("S4", "1"): "S4", ("S5", "0"): "S5", ("S5", "1"): "S4",
})
check(AD, predicate=is_code_d, maxlen=7, name="AD")
render(AD, IMG + "klausur_ga_AD", chain=["S0", "S3", "S5"], ranks=[["S1", "S3"], ["S2", "S5"]], nodesep=0.6, ranksep=1.1)

# ---------------------------------------------------------------------------------------------
# Teil 2: Mealy-Automat M „Ausleihkasse“: Ausleihe kostet 3 €, Münzen 1 € und 2 €
#   Σ = {1, 2}, Ω = {F, 1}: F = Fahrrad wird freigegeben, 1 = 1 € Rückgeld. Zustand Pi: i € eingeworfen.
M = Mealy("12", "F1", "P0", {
    ("P0", "1"): ("P1", ""), ("P0", "2"): ("P2", ""),
    ("P1", "1"): ("P2", ""), ("P1", "2"): ("P0", "F"),
    ("P2", "1"): ("P0", "F"), ("P2", "2"): ("P0", "F1"),
})
assert not M.error_hint
def kasse_ref(w, preis=3):
    s, out = 0, ""
    for c in w:
        s += int(c)
        if s >= preis: out += "F" + "1" * (s - preis); s = 0
    return out
for w in words("12", 8):
    w = "".join(w); assert M.translate(w)[0] == kasse_ref(w), w
render(M, IMG + "klausur_ga_M", chain=["P0", "P1", "P2"], nodesep=0.6, ranksep=1.2)
o, st = M.translate("2212")
loes["e"] = {"ausgabe": o, "folge": st[0][0] + "".join(f" –{a} / {q or 'ε'}→ {r}" for p, a, q, r in st)}
print("e)", loes["e"])

# Lösung f): Preis 4 €
M4 = Mealy("12", "F1", "P0", {
    ("P0", "1"): ("P1", ""), ("P0", "2"): ("P2", ""),
    ("P1", "1"): ("P2", ""), ("P1", "2"): ("P3", ""),
    ("P2", "1"): ("P3", ""), ("P2", "2"): ("P0", "F"),
    ("P3", "1"): ("P0", "F"), ("P3", "2"): ("P0", "F1"),
})
assert not M4.error_hint
for w in words("12", 8):
    w = "".join(w); assert M4.translate(w)[0] == kasse_ref(w, 4), w
render(M4, IMG + "klausur_ga_M4", chain=["P0", "P1", "P2", "P3"], nodesep=0.6, ranksep=1.1)
loes["f_tabelle"] = [[q] + [f"{M4.delta[(q, a)][0]} / {M4.delta[(q, a)][1] or 'ε'}" for a in "12"] for q in M4.states]

# ---------------------------------------------------------------------------------------------
# Teil 3: Tagesprotokolle einer Station über Σ = {A, R} (A Ausleihe, R Rückgabe)
#   gültig: nie mehr Rückgaben als Ausleihen, nie mehr als k Räder gleichzeitig unterwegs, am Ende alle zurück.
def is_protokoll(w, k=None):
    n = 0
    for c in w:
        n += 1 if c == "A" else -1
        if n < 0 or (k is not None and n > k): return False
    return n == 0
P2 = DFA("AR", "S0", {"S0"}, {("S0", "A"): "S1", ("S1", "A"): "S2", ("S1", "R"): "S0", ("S2", "R"): "S1"})
check(P2, predicate=lambda w: is_protokoll(w, 2), maxlen=10, name="P2")
render(P2, IMG + "klausur_ga_P2", chain=["S0", "S1", "S2"], nodesep=0.6, ranksep=1.2)
# Grenze: ohne Obergrenze ist die Sprache nicht regulär – Beleg für den Erwartungshorizont: Aⁱ Rⁱ gültig, Aʲ Rⁱ (j ≠ i) nicht
for i in range(1, 6):
    for j in range(1, 6):
        assert is_protokoll("A" * j + "R" * i) == (i == j)

with open(OUT_JSON, "w", encoding="utf-8") as f:
    json.dump(loes, f, ensure_ascii=False, indent=1)
print("Klausur gA: alle Automaten geprüft →", OUT_JSON)
