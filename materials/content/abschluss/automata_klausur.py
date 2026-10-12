import os as _os_mat
__MAT = _os_mat.path.abspath(_os_mat.path.join(_os_mat.path.dirname(__file__), '../..'))  # Wurzel: materials/
"""Übungsklausur „Smart-Home-Befehle“ – alle Automaten und Grammatiken verifiziert."""
import sys; sys.path.insert(0, (__MAT + '/lib'))
from automata import *
IMG = (__MAT + '/build/img/abschluss/')

# ---------------------------------------------------------------------------------------------
# Teil 1: Befehlsketten über Σ1 = {L, H, R, +, -}
#   Befehl = Gerät (L Licht, H Heizung, R Rollladen) gefolgt von mindestens einem Aktionszeichen (+ oder -).
#   Befehlskette = mindestens ein Befehl, direkt hintereinander.  Beispiel: L+R--H+
SIG1 = "LHR+-"
DEV, ACT = "LHR", "+-"
def is_kette(w):
    if not w or w[0] not in DEV: return False
    i, n = 0, len(w)
    while i < n:
        if w[i] not in DEV: return False
        i += 1
        if i >= n or w[i] not in ACT: return False
        while i < n and w[i] in ACT: i += 1
    return True

# Automat A (Material, Abbildung 1): Licht/Rollladen und Heizung werden getrennt behandelt – S1/S2 und S3/S4 sind äquivalent
A = DFA(SIG1, "S0", {"S3", "S4"}, {
    ("S0", "L"): "S1", ("S0", "R"): "S1", ("S0", "H"): "S2",
    ("S1", "+"): "S3", ("S1", "-"): "S3", ("S2", "+"): "S4", ("S2", "-"): "S4",
    ("S3", "+"): "S3", ("S3", "-"): "S3", ("S3", "L"): "S1", ("S3", "R"): "S1", ("S3", "H"): "S2",
    ("S4", "+"): "S4", ("S4", "-"): "S4", ("S4", "L"): "S1", ("S4", "R"): "S1", ("S4", "H"): "S2",
})
check(A, predicate=is_kette, maxlen=7, name="A")
rounds, eq = A.minimize_pairs()
print("Äquivalente Paare in A:", eq, "– Runden:", [sorted(tuple(sorted(p)) for p in r) for r in rounds])
assert set(eq) == {("S1", "S2"), ("S3", "S4")}
render(A, IMG + "klausur_A", chain=["S0", "S1", "S3"], nodesep=0.5, ranksep=1.1)

# Lösung c): Jede akzeptierte Befehlskette endet mit einem Aktionszeichen (alle Kanten in Endzustände tragen + oder -),
# und genau 12 Befehlsketten der Länge 3 werden akzeptiert (Gerät + zwei Aktionszeichen: 3 · 2 · 2).
assert all(a in ACT for (p, a), q in A.delta.items() if q in A.finals)
len3 = ["".join(w) for w in words(SIG1, 3) if len(w) == 3 and A.accepts("".join(w))]
assert len(len3) == 12 and all(w[0] in DEV and w[1] in ACT and w[2] in ACT for w in len3), len3
print("c) Länge 3:", len(len3), len3[:4])

# Automat mit drei Zuständen (Grundlage für die Grammatik in Lösung j)
# (früher Lösung c) 
Amin = DFA(SIG1, "S0", {"S2"}, {("S0", "L"): "S1", ("S0", "H"): "S1", ("S0", "R"): "S1",
                                 ("S1", "+"): "S2", ("S1", "-"): "S2",
                                 ("S2", "+"): "S2", ("S2", "-"): "S2", ("S2", "L"): "S1", ("S2", "H"): "S1", ("S2", "R"): "S1"})
check(Amin, predicate=is_kette, maxlen=7, name="Amin")
assert dfa_equivalent(A, Amin) is None
render(Amin, IMG + "klausur_Amin", chain=["S0", "S1", "S2"], nodesep=0.6, ranksep=1.0)

# Lösung d): Heizung höchstens einmal pro Befehlskette
def is_kette_H1(w): return is_kette(w) and w.count("H") <= 1
AH = DFA(SIG1, "S0", {"S2", "S4"}, {
    ("S0", "L"): "S1", ("S0", "R"): "S1", ("S0", "H"): "S3",
    ("S1", "+"): "S2", ("S1", "-"): "S2",
    ("S2", "+"): "S2", ("S2", "-"): "S2", ("S2", "L"): "S1", ("S2", "R"): "S1", ("S2", "H"): "S3",
    ("S3", "+"): "S4", ("S3", "-"): "S4",
    ("S4", "+"): "S4", ("S4", "-"): "S4", ("S4", "L"): "S3", ("S4", "R"): "S3",
})
check(AH, predicate=is_kette_H1, maxlen=7, name="AH")
r2, eq2 = AH.minimize_pairs(); assert eq2 == [], eq2   # minimal
render(AH, IMG + "klausur_AH", chain=["S0", "S1", "S2"], ranks=[["S1", "S3"], ["S2", "S4"]], nodesep=0.6, ranksep=1.2)

# Zustandsfolgen für a)
for w in ["L+R--", "H+L", "R-+H"]:
    print(w, A.accepts(w), A.path_str(w))

# ---------------------------------------------------------------------------------------------
# Teil 2a: Mealy-Automat M (Material, Abbildung 2): Rollladen-Position, Σ = {+, -}, Ω = {0, 1, 2, 3, !}
#   Positionen P0 (ganz unten) … P3 (ganz oben), Start P3; + = hoch, - = runter; Ausgabe = neue Position, am Anschlag „!“
dP = {}
for i in range(4):
    dP[(f"P{i}", "+")] = (f"P{i+1}", str(i + 1)) if i < 3 else ("P3", "!")
    dP[(f"P{i}", "-")] = (f"P{i-1}", str(i - 1)) if i > 0 else ("P0", "!")
M = Mealy("+-", "0123!", "P3", dP)
assert not M.error_hint
def M_ref(w):
    s, out = 3, ""
    for c in w:
        if c == "+": out += "!" if s == 3 else str(s := s + 1)
        else: out += "!" if s == 0 else str(s := s - 1)
    return out
for w in words("+-", 8):
    w = "".join(w); assert M.translate(w)[0] == M_ref(w), w
print("Mealy Rollladen ok")
render(M, IMG + "klausur_M", chain=["P3", "P2", "P1", "P0"], nodesep=0.6, ranksep=1.0)
for w in ["--+---", "-+++", "---+"]:
    o, st = M.translate(w); print(w, "→", o, " | ", " ".join(f"{p} –{a}/{q or 'ε'}→ {r}" for p, a, q, r in st))

# Teil 2b (Lösung f): Mealy-Automat „Steuersignale“, Σ1 = {L, H, R, +, -}, Ω = {e, a, w, k, o, u}
#   Licht ein/aus, Heizung wärmer/kälter, Rollladen oben/unten; Gerätezeichen erzeugen keine Ausgabe (ε).
OUT = {"L": ("e", "a"), "H": ("w", "k"), "R": ("o", "u")}
dS = {("M0", "+"): ("M0", ""), ("M0", "-"): ("M0", "")}
for dv in DEV:
    dS[("M0", dv)] = ("M" + dv, "")
    for dv2 in DEV: dS[("M" + dv, dv2)] = ("M" + dv2, "")
    dS[("M" + dv, "+")] = ("M" + dv, OUT[dv][0]); dS[("M" + dv, "-")] = ("M" + dv, OUT[dv][1])
MS = Mealy(SIG1, "eawkou", "M0", dS)
assert not MS.error_hint
def MS_ref(w):
    dev, out = None, ""
    for c in w:
        if c in DEV: dev = c
        elif dev: out += OUT[dev][0 if c == "+" else 1]
    return out
for w in words(SIG1, 6):
    w = "".join(w); assert MS.translate(w)[0] == MS_ref(w), w
print("Mealy Steuersignale ok")
# Graph mit festen Positionen (neato): planare Anordnung (MH im Inneren des Dreiecks M0–ML–MR) ohne Kantenkreuzungen;
# Beschriftungen als Textknoten auf der Seite „ihrer“ Kante (bei Kantenpaaren: links/oben die eine, rechts/unten die andere Richtung).
_k = 1.15
_P = {"M0": (0, 0), "MH": (2.9, 0), "ML": (5, 3), "MR": (5, -3)}
_out = lambda q, a: MS.delta[(q, a)][1] or "ε"
_loop = lambda q: "\\n".join(f"{a} / {_out(q, a)}" for a in ["L", "H", "R", "+", "-"] if MS.delta[(q, a)][0] == q)
_labs = [("L / ε", (3.72, 1.66)), ("H / ε", (4.2, 1.32)), ("H / ε", (3.72, -1.66)), ("R / ε", (4.2, -1.32)),
         ("L / ε", (4.72, 0.35)), ("R / ε", (5.3, 0.35)), ("H / ε", (1.83, 0.2)), ("L / ε", (1.95, 2.05)), ("R / ε", (1.95, -2.05)),
         (_loop("M0"), (0.83, 0.42)), (_loop("ML"), (5.85, 3.0)), (_loop("MH"), (3.85, 0.02)), (_loop("MR"), (5.85, -3.0))]
# Kontrolle: Die Kanten zwischen verschiedenen Zuständen tragen genau die Beschriftungen aus MS.delta
for (p, q), lab in {("MH", "ML"): "L / ε", ("ML", "MH"): "H / ε", ("MR", "MH"): "H / ε", ("MH", "MR"): "R / ε", ("MR", "ML"): "L / ε",
                    ("ML", "MR"): "R / ε", ("M0", "MH"): "H / ε", ("M0", "ML"): "L / ε", ("M0", "MR"): "R / ε"}.items():
    a = lab[0]; assert MS.delta[(p, a)] == (q, ""), (p, q, lab)
_nodes = "".join(f'  {n} [pos="{x * _k:.2f},{y * _k:.2f}!"];\n' for n, (x, y) in _P.items())
_ln = "".join(f'  l{i} [label="{t}", pos="{x * _k:.2f},{y * _k:.2f}!"];\n' for i, (t, (x, y)) in enumerate(_labs))
MS_DOT = f"""digraph G {{
  layout=neato; bgcolor="transparent"; splines=curved;
  node [shape=circle, fontname="Calibri", fontsize=16, color="#1F2A2E", fontcolor="#1F2A2E", penwidth=1.6, width=0.6, margin=0.04];
  edge [fontname="Calibri", fontsize=14, color="#1F2A2E", fontcolor="#1F2A2E", penwidth=1.3, arrowsize=0.8];
  __start [shape=plaintext, label="Start", fontsize=15, pos="-1.4,0!"];
{_nodes}  __start -> M0;
  M0 -> ML; M0 -> MR; M0 -> MH; ML -> MH; MH -> ML; MR -> MH; MH -> MR; ML -> MR; MR -> ML;
  M0 -> M0; ML -> ML; MH -> MH; MR -> MR;
  node [shape=plaintext, fontsize=14, width=0, height=0, margin=0];
{_ln}}}"""
render(MS_DOT, IMG + "klausur_MS")
print("Steuersignale L+H--R+ →", MS.translate("L+H--R+")[0])
# Übergangstabelle für den Erwartungshorizont
print([[q] + [f"{MS.delta[(q,a)][0]} / {MS.delta[(q,a)][1] or 'ε'}" for a in SIG1] for q in MS.states])

# ---------------------------------------------------------------------------------------------
# Teil 3: Szenen mit Gruppen über Σ3 = {B, (, )}  –  B steht für einen vollständigen Befehl.
#   Szene = mindestens ein Element; Element = B oder ( Szene )   (Gruppen sind nicht leer, beliebig verschachtelt)
SIG3 = "B()"
G2 = Grammar("S → BS | B | (S)S | (S)")
def is_szene(w):
    # rekursiver Abstieg
    i = 0
    def elem():
        nonlocal i
        if i < len(w) and w[i] == "B": i += 1; return True
        if i < len(w) and w[i] == "(":
            i += 1
            if not szene(): return False
            if i < len(w) and w[i] == ")": i += 1; return True
            return False
        return False
    def szene():
        if not elem(): return False
        while i < len(w) and w[i] in "B(":
            if not elem(): return False
        return True
    ok = szene()
    return ok and i == len(w)
for w in words(SIG3, 8):
    w = "".join(w); assert G2.accepts(w) == is_szene(w), w
assert not G2.is_right_regular()
print("G2 ok (bis Länge 8)")
print("Ableitung B((B)B):", G2.derivation_str("B((B)B)"))

# Kellerautomat K (Material, Abbildung 3)
K = PDA(SIG3, "#K", "S0", {"S2"}, [
    ("S0", "#", "B", "#", "S1"), ("S0", "K", "B", "K", "S1"),
    ("S0", "#", "(", "K#", "S0"), ("S0", "K", "(", "KK", "S0"),
    ("S1", "#", "B", "#", "S1"), ("S1", "K", "B", "K", "S1"),
    ("S1", "#", "(", "K#", "S0"), ("S1", "K", "(", "KK", "S0"),
    ("S1", "K", ")", "", "S1"),
    ("S1", "#", EPS, "#", "S2"),
])
check(K, predicate=is_szene, maxlen=8, name="K")
render(K, IMG + "klausur_K", chain=["S0", "S1", "S2"], nodesep=0.7, ranksep=1.4)
print("Tabelle B((B)B):")
for r in K.search("B((B)B)"): print("  ", r)
print("Tabelle (B)(B):")
for r in K.search("(B)(B)"): print("  ", r)

# Lösung j): rechtsreguläre Grammatik für Befehlsketten
G1 = Grammar("""S → LA | HA | RA
A → +B | -B
B → +B | -B | LA | HA | RA | ε""")
assert G1.is_right_regular()
for w in words(SIG1, 6):
    w = "".join(w); assert G1.accepts(w) == is_kette(w), w
print("G1 ok;", G1.derivation_str("L+R--"))

# Lösung m): jede Gruppe enthält mindestens zwei Elemente
G3 = Grammar("""S → ES | E
E → B | (ES)""")
def is_szene2(w):
    i = 0
    def elem():
        nonlocal i
        if i < len(w) and w[i] == "B": i += 1; return True
        if i < len(w) and w[i] == "(":
            i += 1
            n = szene()
            if n < 2: return False
            if i < len(w) and w[i] == ")": i += 1; return True
            return False
        return False
    def szene():
        cnt = 0
        if not elem(): return -1
        cnt = 1
        while i < len(w) and w[i] in "B(":
            if not elem(): return -1
            cnt += 1
        return cnt
    n = szene()
    return n >= 1 and i == len(w)
for w in words(SIG3, 9):
    w = "".join(w); assert G3.accepts(w) == is_szene2(w), w
print("G3 ok (bis Länge 9)")
print("Beispiele G3:", [("".join(w)) for w in words(SIG3, 6) if is_szene2("".join(w))][:12])
