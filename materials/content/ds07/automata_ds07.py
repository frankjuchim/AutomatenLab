import os as _os_mat
__MAT = _os_mat.path.abspath(_os_mat.path.join(_os_mat.path.dirname(__file__), '../..'))  # Wurzel: materials/
import sys; sys.path.insert(0, (__MAT + '/content/ds07'))
from weltb import *
IMG = (__MAT + '/build/img/ds07/')
OUT = {}

# ------------------------------------------------------------------ 1) Türsteher mit Kapazität 3
def club_ok(w, cap=3):
    d = 0
    for x in w:
        d += 1 if x == "E" else -1
        if d < 0 or d > cap: return False
    return d == 0
tuer = DFA("EA", "S0", {"S0"}, {
    ("S0", "E"): "S1", ("S1", "E"): "S2", ("S2", "E"): "S3",
    ("S1", "A"): "S0", ("S2", "A"): "S1", ("S3", "A"): "S2"})
check(tuer, predicate=club_ok, maxlen=12, name="Türsteher 3")
render(tuer, IMG + 'tuer3', chain=["S0", "S1", "S2", "S3"], edge_style={("S1", "S0"): 'constraint=false', ("S2", "S1"): 'constraint=false', ("S3", "S2"): 'constraint=false'})
render(tuer, IMG + 'tuer3_komplett', error_state=True, chain=["S0", "S1", "S2", "S3"])
OUT["tuer"] = {w: [tuer.accepts(w), tuer.path_str(w)] for w in ["EEAA", "EAEA", "EEEEAAAA", "AEEA", "EEA", "EEEAAA"]}
# Kapazität c → c + 2 Zustände (inkl. Fehler)
for c in range(1, 7):
    dc = {}
    for i in range(c):
        dc[(f"S{i}", "E")] = f"S{i+1}"; dc[(f"S{i+1}", "A")] = f"S{i}"
    Tc = DFA("EA", "S0", {"S0"}, dc)
    check(Tc, predicate=lambda w, c=c: club_ok(w, c), maxlen=10, name=f"Türsteher {c}")
    assert len(Tc.states) == c + 1

# ------------------------------------------------------------------ 2) „Der Zähler“ (App #/ueberliste?stufe=1, Kapazität 2, k = 5)
anbn = lambda w: (n := len(w) // 2) >= 1 and w == "a" * n + "b" * n
zaehler = DFA("ab", "S0", {"S4"}, {
    ("S0", "a"): "S1", ("S1", "a"): "S2", ("S2", "a"): "S2",
    ("S1", "b"): "S4", ("S2", "b"): "S3", ("S3", "b"): "S4"})
fehler = ["".join(w) for w in words("ab", 8) if zaehler.accepts("".join(w)) != anbn("".join(w))]
print("Zähler irrt bei:", fehler[:8], "…", len(fehler))
assert "aaabb" in fehler and "aaabbb" in fehler
check(zaehler, accept=["ab", "aabb", "aaabb"], reject=["aaabbb", "abb", "ba"], name="Zähler (bewusst fehlerhaft)")
render(zaehler, IMG + 'zaehler', chain=["S0", "S1", "S2", "S3", "S4"], ranks=[["S1", "S2"]] and None)
render(zaehler, IMG + 'zaehler_hl', chain=["S0", "S1", "S2", "S3", "S4"], highlight={"S2"})
OUT["zaehler"] = {w: [zaehler.accepts(w), zaehler.path_str(w)] for w in ["aabb", "aaabb", "aaabbb", "aab"]}

# ------------------------------------------------------------------ 3) Schubfach-Grafik (Präfixe → Zustände)
dot = r'''digraph G { layout=neato; bgcolor="transparent"; splines=true;
 node [fontname="Calibri", fontsize=16, color="#1F2A2E", fontcolor="#1F2A2E", penwidth=1.5];
 edge [color="#0E6455", penwidth=1.5, arrowsize=0.8];
 h1 [shape=plaintext, fontcolor="#5B6770", fontsize=15, label="k + 1 = 5 Präfixe", pos="0,0.75!"];
 h2 [shape=plaintext, fontcolor="#5B6770", fontsize=15, label="nur k = 4 Zustände", pos="3.4,0.75!"];
 p1 [shape=box, style="rounded", label="a", pos="0,0!", width=1.1];
 p2 [shape=box, style="rounded", label="aa", pos="0,-0.75!", width=1.1];
 p3 [shape=box, style="rounded,filled", fillcolor="#F6E7CF", color="#B26A0F", label="aaa", pos="0,-1.5!", width=1.1];
 p4 [shape=box, style="rounded", label="aaaa", pos="0,-2.25!", width=1.1];
 p5 [shape=box, style="rounded,filled", fillcolor="#F6E7CF", color="#B26A0F", label="aaaaa", pos="0,-3.0!", width=1.1];
 q0 [shape=circle, label="S0", pos="3.4,-0.1!"]; q1 [shape=circle, label="S1", pos="3.4,-1.0!"];
 q2 [shape=circle, style=filled, fillcolor="#F6E7CF", color="#B26A0F", label="S2", pos="3.4,-1.9!"]; q3 [shape=circle, label="S3", pos="3.4,-2.8!"];
 p1 -> q1; p2 -> q3; p3 -> q2 [color="#B26A0F", penwidth=2.4]; p4 -> q0; p5 -> q2 [color="#B26A0F", penwidth=2.4];
}'''
render(dot, IMG + 'schubfach')

# ------------------------------------------------------------------ 4) Entscheidungstabelle: reguläre Fälle mit DEA belegen
# A: {aⁿbⁿ | 1 ≤ n ≤ 3} (endlich)
dA = {}
names = {}
# Baum: S0 -a-> A1 -a-> A2 -a-> A3; Ai -b-> B(i-1) … ; eigener DEA
dA = {("S0", "a"): "S1", ("S1", "a"): "S2", ("S2", "a"): "S3",
      ("S1", "b"): "S6", ("S2", "b"): "S5", ("S3", "b"): "S4", ("S4", "b"): "S5", ("S5", "b"): "S6"}
LA = DFA("ab", "S0", {"S6"}, dA)
check(LA, predicate=lambda w: anbn(w) and len(w) <= 6, maxlen=10, name="L_A endlich")
render(LA, IMG + 'LA', chain=["S0", "S1", "S2", "S3", "S4", "S5", "S6"])
# B: a⁺b⁺
LB = DFA("ab", "S0", {"S2"}, {("S0", "a"): "S1", ("S1", "a"): "S1", ("S1", "b"): "S2", ("S2", "b"): "S2"})
check(LB, predicate=lambda w: len(w) >= 2 and w == "a" * w.count("a") + "b" * w.count("b") and w.count("a") >= 1 and w.count("b") >= 1, maxlen=10, name="a+b+")
render(LB, IMG + 'LB')
# D: (#a − #b) durch 3 teilbar
LD = DFA("ab", "S0", {"S0"}, {(f"S{i}", "a"): f"S{(i+1)%3}" for i in range(3)} | {(f"S{i}", "b"): f"S{(i-1)%3}" for i in range(3)})
check(LD, predicate=lambda w: (w.count("a") - w.count("b")) % 3 == 0, maxlen=10, name="mod 3")
render(LD, IMG + 'LD')
# F: korrekte Klammerausdrücke mit Tiefe ≤ 3 (= Türsteher!)
def kl(w, cap=None):
    d = 0
    for x in w:
        d += 1 if x == "(" else -1
        if d < 0 or (cap is not None and d > cap): return False
    return d == 0
LF = DFA("()", "S0", {"S0"}, {("S0", "("): "S1", ("S1", "("): "S2", ("S2", "("): "S3", ("S1", ")"): "S0", ("S2", ")"): "S1", ("S3", ")"): "S2"})
check(LF, predicate=lambda w: kl(w, 3), maxlen=12, name="Klammern Tiefe 3")
# H: gleich viele „ab“ wie „ba“  ⇔  ε oder erstes = letztes Zeichen
cnt = lambda w, s: sum(1 for i in range(len(w) - 1) if w[i:i+2] == s)
LH = DFA("ab", "S0", {"S0", "S1", "S3"}, {("S0", "a"): "S1", ("S0", "b"): "S3", ("S1", "a"): "S1", ("S1", "b"): "S2", ("S2", "a"): "S1", ("S2", "b"): "S2",
                                         ("S3", "b"): "S3", ("S3", "a"): "S4", ("S4", "b"): "S3", ("S4", "a"): "S4"})
check(LH, predicate=lambda w: cnt(w, "ab") == cnt(w, "ba"), maxlen=12, name="ab = ba")
render(LH, IMG + 'LH', ranks=[["S1", "S3"], ["S2", "S4"]])

# nicht reguläre Fälle: Schubfach-Zeugen prüfen
witness_check(lambda w: w.count("a") == w.count("b"), lambda i: "a" * i, lambda i: "b" * i, name="C gleich viele")
witness_check(lambda w: w == w[::-1], lambda i: "a" * i + "b", lambda i: "a" * i, name="E Palindrome")
witness_check(lambda w: (n := w.count("a")) > (m := w.count("b")) and w == "a" * n + "b" * m, lambda i: "a" * i, lambda i: "b" * i, name="G n>m")
witness_check(anbn, lambda i: "a" * i, lambda i: "b" * i, n=10, name="aⁿbⁿ")
witness_check(kl, lambda i: "(" * i, lambda i: ")" * i, n=10, name="Klammern")
# Prüfnummern „Kriterium Q“: Quersumme der ersten Ziffernfolge = Anzahl Zeichen der zweiten (Σ = {1,2,3,-})
def krit_q(w):
    if w.count("-") != 1: return False
    a, b = w.split("-")
    return len(a) >= 1 and len(b) >= 1 and sum(int(c) for c in a) == len(b)
witness_check(krit_q, lambda i: "1" * i, lambda i: "-" + "1" * i, name="Kriterium Q")
assert krit_q("32-12211") is True and krit_q("3-12") is False and krit_q("21-322") is True
# Codes: gleich viele O wie X, Abschluss E
code = lambda w: len(w) >= 1 and w[-1] == "E" and w.count("E") == 1 and w.count("O") == w.count("X")
witness_check(code, lambda i: "O" * i, lambda i: "X" * i + "E", name="Code O/X")
# Variante: höchstens 2 O mehr als X und umgekehrt zu jedem Zeitpunkt → DEA möglich (Bilanz −2…2)
def code2(w):
    if not (len(w) >= 1 and w[-1] == "E" and w.count("E") == 1): return False
    d = 0
    for x in w[:-1]:
        d += 1 if x == "O" else -1
        if abs(d) > 2: return False
    return d == 0
dd = {}
for v in range(-2, 3):
    nm = lambda v: {-2: "S4", -1: "S3", 0: "S0", 1: "S1", 2: "S2"}[v]
    if v < 2: dd[(nm(v), "O")] = nm(v + 1)
    if v > -2: dd[(nm(v), "X")] = nm(v - 1)
dd[("S0", "E")] = "S5"
C2 = DFA("OXE", "S0", {"S5"}, dd)
check(C2, predicate=code2, maxlen=10, name="Code beschränkt")
render(C2, IMG + 'code2', chain=["S2", "S1", "S0", "S3", "S4"] and None, ranks=[["S0", "S5"]])

# ------------------------------------------------------------------ 5) Mealy-Grenze: Kartoffelautomat, Preis p €, Münzen 1 € und 2 €
def kartoffel(p):
    d = {}
    for i in range(p):
        for m in (1, 2):
            s = i + m
            d[(f"S{i}", str(m))] = (f"S{s}", "") if s < p else ("S0", "K" + "1" * (s - p))
    return Mealy("12", "K1", "S0", d)
def sim(w, p):
    paid, out = 0, ""
    for c in w:
        paid += int(c)
        if paid >= p: out += "K" + "1" * (paid - p); paid = 0
    return out
for p in range(2, 9):
    M = kartoffel(p)
    assert len(M.states) == p
    for w in words("12", 8):
        assert M.translate("".join(w))[0] == sim("".join(w), p), (p, w)
M3 = kartoffel(3)
render(M3, IMG + 'kartoffel3')
M5 = kartoffel(5)
render(M5, IMG + 'kartoffel5', chain=["S0", "S1", "S2", "S3", "S4"])
OUT["kartoffel3"] = {w: M3.translate(w)[0] or "ε" for w in ["12", "111", "22", "2211", "1221"]}
print(OUT["kartoffel3"])

# Zustandsfolgen
for k, v in OUT.items(): print(k, v)
dump(OUT, (__MAT + '/content/ds07/ds07.json'))
print("DS07 ok")
