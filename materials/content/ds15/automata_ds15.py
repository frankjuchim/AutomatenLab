import os as _os_mat
__MAT = _os_mat.path.abspath(_os_mat.path.join(_os_mat.path.dirname(__file__), '../..'))  # Wurzel: materials/
"""DS15 – Sprachdesign-Studio: Beispielprojekt „Drohnen-Sprache“ (Lehrkraft-Handreichung).
Alle Automaten/Grammatiken werden verifiziert, bevor sie gerendert werden."""
import sys; sys.path.insert(0, (__MAT + '/lib'))
from automata import *
IMG = (__MAT + '/build/img/ds15/')

# ---------------------------------------------------------------------------------------------
# Sprache D (Flugprogramme):  s  (Start)  –  danach Bewegungsbefehle h (hoch), t (tiefer), v (vor), d (drehen)
# – zum Schluss l (landen).  Regel: Nach dem Start muss der erste Bewegungsbefehl ein h sein (die Drohne
# muss zuerst steigen) – oder es wird sofort gelandet (s l).
#   L_D = { s l } ∪ { s h w l | w ∈ {h,t,v,d}* }
SIG = "shtvdl"
def in_D(w):
    if len(w) < 2 or w[0] != "s" or w[-1] != "l": return False
    mid = w[1:-1]
    if mid == "": return True
    return mid[0] == "h" and all(c in "htvd" for c in mid)

# 1) DEA zur Syntaxprüfung
drohne = DFA(SIG, "S0", {"S3"}, {
    ("S0", "s"): "S1",
    ("S1", "l"): "S3", ("S1", "h"): "S2",
    ("S2", "h"): "S2", ("S2", "t"): "S2", ("S2", "v"): "S2", ("S2", "d"): "S2", ("S2", "l"): "S3",
})
check(drohne, predicate=in_D, maxlen=7, name="Drohne-DEA")
render(drohne, IMG + "drohne_dea", chain=["S0", "S1", "S2", "S3"])
render(drohne, IMG + "drohne_dea_komplett", chain=["S0", "S1", "S2", "S3"], error_state=True)

# 2) Rechtsreguläre Grammatik (aus dem DEA abgeleitet: Zustand ↔ Nichtterminal)
g_drohne = Grammar("""S → sA
A → l | hB
B → hB | tB | vB | dB | l""")
assert g_drohne.is_right_regular(), "Grammatik muss rechtsregulär sein"
for w in words(SIG, 6):
    w = "".join(w)
    assert g_drohne.accepts(w) == in_D(w), f"Grammatik-Fehler bei {w!r}"
print("Grammatik Drohne ok (alle Wörter bis Länge 6)")
print(g_drohne.derivation_str("shvdl"))
print(g_drohne.derivation_str("sl"))

# 3) Mealy-Übersetzer „Höhenanzeige“: Σ = {h, t, v, d}, Ω = {0, 1, 2, !}
#    Zustände = Höhenstufe (0 = Boden, 1, 2 = Maximalhöhe). h/t ändern die Stufe und geben die neue Stufe aus,
#    am Anschlag wird „!“ ausgegeben (Befehl ignoriert); v und d ändern die Höhe nicht (Ausgabe ε).
hoehe = Mealy("htvd", "012!", "H0", {
    ("H0", "h"): ("H1", "1"), ("H0", "t"): ("H0", "!"), ("H0", "v"): ("H0", ""), ("H0", "d"): ("H0", ""),
    ("H1", "h"): ("H2", "2"), ("H1", "t"): ("H0", "0"), ("H1", "v"): ("H1", ""), ("H1", "d"): ("H1", ""),
    ("H2", "h"): ("H2", "!"), ("H2", "t"): ("H1", "1"), ("H2", "v"): ("H2", ""), ("H2", "d"): ("H2", ""),
})
assert not hoehe.error_hint, "Mealy muss vollständig sein"
def hoehe_ref(w):
    lvl, out = 0, ""
    for c in w:
        if c == "h": out += "!" if lvl == 2 else str(lvl := lvl + 1)
        elif c == "t": out += "!" if lvl == 0 else str(lvl := lvl - 1)
    return out
for w in words("htvd", 7):
    w = "".join(w)
    assert hoehe.translate(w)[0] == hoehe_ref(w), f"Mealy-Fehler bei {w!r}"
print("Mealy Höhenanzeige ok")
render(hoehe, IMG + "drohne_mealy", chain=["H0", "H1", "H2"], rankdir="LR")
for w in ["hhvth", "thhhvtt", "hvdtl"[:-1]]:
    out, steps = hoehe.translate(w)
    print(w, "→", out, " ".join(f"{p}-{a}/{o or 'ε'}->{q}" for p, a, o, q in steps))

# 4) Erweiterung (kontextfrei): Wiederholungsblöcke in Klammern, z. B. s h ( v d ) ( v ( t h ) ) l
#    W → hW | tW | vW | dW | (W)W | ε        S → sl | shWl
g_klammer = Grammar("""S → sl | shWl
W → hW | tW | vW | dW | (W)W | ε""")
assert not g_klammer.is_right_regular()
SIG2 = "shtvdl()"
def balanced(m):
    depth = 0
    for c in m:
        if c == "(": depth += 1
        elif c == ")":
            depth -= 1
            if depth < 0: return False
    return depth == 0
def in_D2(w):
    if len(w) < 2 or w[0] != "s" or w[-1] != "l": return False
    mid = w[1:-1]
    if mid == "": return True
    return mid[0] == "h" and all(c in "htvd()" for c in mid) and balanced(mid[1:])
for w in words(SIG2, 7):
    w = "".join(w)
    assert g_klammer.accepts(w) == in_D2(w), f"Klammer-Grammatik-Fehler bei {w!r}"
print("Grammatik Klammer-Erweiterung ok (bis Länge 7)")
print(g_klammer.derivation_str("sh(vd)l"))

# 5) NKA zur Syntaxprüfung der Erweiterung: Keller zählt offene Klammern
nka = PDA(SIG2, "#K", "S0", {"S3"}, [
    ("S0", "#", "s", "#", "S1"),
    ("S1", "#", "l", "#", "S3"), ("S1", "#", "h", "#", "S2"),
    ("S2", "#", "h", "#", "S2"), ("S2", "#", "t", "#", "S2"), ("S2", "#", "v", "#", "S2"), ("S2", "#", "d", "#", "S2"),
    ("S2", "K", "h", "K", "S2"), ("S2", "K", "t", "K", "S2"), ("S2", "K", "v", "K", "S2"), ("S2", "K", "d", "K", "S2"),
    ("S2", "#", "(", "K#", "S2"), ("S2", "K", "(", "KK", "S2"), ("S2", "K", ")", "", "S2"),
    ("S2", "#", "l", "#", "S3"),
])
assert nka.is_deterministic()
check(nka, predicate=in_D2, maxlen=7, name="Drohne-NKA")
# Lesbares Layout: Die 11 Schleifen an S2 werden zweispaltig (Kellerzeichen # | K) unter dem Zustand notiert.
# Die Beschriftungen werden aus nka.trans erzeugt (keine Handarbeit).
def _lab(t):
    k, a, z = t[1], t[2], (t[3] or "ε")
    return f"({k}, {a}) : {z}"
def _esc(s): return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
_by = {}
for t in nka.trans: _by.setdefault((t[0], t[4]), []).append(t)
_loop = _by[("S2", "S2")]
_col1 = [_lab(t) for t in _loop if t[1] == "#"]; _col2 = [_lab(t) for t in _loop if t[1] == "K"]
_rows = "".join(f'<TR><TD ALIGN="LEFT">{_esc(a)}</TD><TD WIDTH="18"></TD><TD ALIGN="LEFT">{_esc(b)}</TD></TR>'
                for a, b in zip(_col1 + [""] * (len(_col2) - len(_col1)), _col2 + [""] * (len(_col1) - len(_col2))))
_one = lambda p, q: "\\n".join(_lab(t) for t in _by[(p, q)])
assert sum(len(v) for v in _by.values()) == len(nka.trans)
NKA_DOT = f"""digraph G {{
  rankdir=LR; bgcolor="transparent"; nodesep=0.5; ranksep=1.1;
  node [shape=circle, fontname="Calibri", fontsize=17, color="#1F2A2E", fontcolor="#1F2A2E", penwidth=1.6, width=0.6, margin=0.04];
  edge [fontname="Calibri", fontsize=15, color="#1F2A2E", fontcolor="#1F2A2E", penwidth=1.3, arrowsize=0.8];
  __start [shape=plaintext, label="Start", fontsize=16];
  S3 [shape=doublecircle];
  __start -> S0;
  S0 -> S1 [label="{_one('S0', 'S1')}", weight=10];
  S1 -> S2 [label="{_one('S1', 'S2')}", weight=10];
  S2 -> S3 [label="{_one('S2', 'S3')}", weight=10];
  S1 -> S3 [label="{_one('S1', 'S3')}", constraint=false];
  S2 -> S2 [label=<<TABLE BORDER="0" CELLSPACING="0" CELLPADDING="1">{_rows}</TABLE>>];
}}"""
render(NKA_DOT, IMG + "drohne_nka")
print("NKA Tabelle sh(v(d))l:")
for r in nka.search("sh(v(d))l"): print("  ", r)

# Zustandsfolgen für die Musteraufgabe
for w in ["shvdl", "stvl", "sl", "shhtl"]:
    print(w, drohne.accepts(w), drohne.path_str(w))
print("Abgeleitet shhtl:", g_drohne.derivation_str("shhtl"))
