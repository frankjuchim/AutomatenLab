import os as _os_mat
__MAT = _os_mat.path.abspath(_os_mat.path.join(_os_mat.path.dirname(__file__), '../..'))  # Wurzel: materials/
"""DS03 – Level 3 „Bauplan gesucht“ + Merkblatt M02 – alle Automaten verifiziert, Grafiken nach build/img/ds03."""
import sys, json; sys.path.insert(0, (__MAT + '/lib'))
from automata import *
IMG = (__MAT + '/build/img/ds03/')
ab = "ab"
cnt = lambda w, c: sum(1 for x in w if x == c)
def P(A, w):
    return A.path_str(w) + ("  ⇒  akzeptiert" if A.accepts(w) else "  ⇒  abgelehnt")
def complete(A, err="F_err"):
    """Vollständiger Automat mit explizitem Fehlerzustand err (für Komplementbildung)."""
    d = dict(A.delta)
    if not A.is_complete():
        for q in list(A.states) + [err]:
            for a in A.sigma:
                d.setdefault((q, a), err)
    return DFA(A.sigma, A.start, A.finals, d)
def minimal(A):
    return not A.minimize_pairs()[1]
SOL = {}

# ======================================================================= Bausteine (M02, Folien)
B = {}
B['praefix'] = DFA(ab, "S0", {"S2"}, {("S0","a"):"S1", ("S1","b"):"S2", ("S2","a"):"S2", ("S2","b"):"S2"})
check(B['praefix'], predicate=lambda w: w.startswith("ab"), maxlen=8, name="Präfix ab")
B['teilwort'] = DFA(ab, "S0", {"S2"}, {("S0","a"):"S1", ("S0","b"):"S0", ("S1","a"):"S1", ("S1","b"):"S2", ("S2","a"):"S2", ("S2","b"):"S2"})
check(B['teilwort'], predicate=lambda w: "ab" in w, maxlen=8, name="enthält ab")
B['endung'] = DFA(ab, "S0", {"S2"}, {("S0","a"):"S1", ("S0","b"):"S0", ("S1","a"):"S1", ("S1","b"):"S2", ("S2","a"):"S1", ("S2","b"):"S0"})
check(B['endung'], predicate=lambda w: w.endswith("ab"), maxlen=8, name="endet ab")
B['genau'] = DFA(ab, "S0", {"S2"}, {("S0","a"):"S1", ("S0","b"):"S0", ("S1","a"):"S2", ("S1","b"):"S1", ("S2","b"):"S2"})
check(B['genau'], predicate=lambda w: cnt(w, "a") == 2, maxlen=8, name="genau 2 a")
B['mindestens'] = DFA(ab, "S0", {"S2"}, {("S0","a"):"S1", ("S0","b"):"S0", ("S1","a"):"S2", ("S1","b"):"S1", ("S2","a"):"S2", ("S2","b"):"S2"})
check(B['mindestens'], predicate=lambda w: cnt(w, "a") >= 2, maxlen=8, name="mind 2 a")
B['modulo'] = DFA(ab, "S0", {"S0"}, {("S0","a"):"S1", ("S0","b"):"S0", ("S1","a"):"S2", ("S1","b"):"S1", ("S2","a"):"S0", ("S2","b"):"S2"})
check(B['modulo'], predicate=lambda w: cnt(w, "a") % 3 == 0, maxlen=8, name="a mod 3")
# Produkt: gerade Anzahl a UND endet auf b (Zustandsnamen wie Baukasten-Challenge gerade-a-endet-b)
B['produkt'] = DFA(ab, "S0", {"S1"}, {("S0","a"):"S2", ("S0","b"):"S1", ("S1","a"):"S2", ("S1","b"):"S1",
                                      ("S2","a"):"S0", ("S2","b"):"S3", ("S3","a"):"S0", ("S3","b"):"S3"})
check(B['produkt'], predicate=lambda w: cnt(w, "a") % 2 == 0 and w.endswith("b"), maxlen=8, name="Produkt")
B['komplement'] = DFA(ab, "S0", {"S0","S1"}, dict(B['teilwort'].delta))
check(B['komplement'], predicate=lambda w: "ab" not in w, maxlen=8, name="Komplement enthält nicht ab")
for k in ['praefix','teilwort','endung','genau','mindestens','modulo','komplement']:
    assert minimal(B[k]), k
chainB = {'praefix': ["S0","S1","S2"], 'teilwort': ["S0","S1","S2"], 'endung': ["S0","S1","S2"], 'genau': ["S0","S1","S2"],
          'mindestens': ["S0","S1","S2"], 'komplement': ["S0","S1","S2"]}
for k, A in B.items():
    if k == 'produkt':
        render(A, IMG+'b_produkt', ranks=[["S0","S2"],["S1","S3"]], rankdir="LR", nodesep=1.0, ranksep=1.2,
               edge_style={("S1","S1"):'headport=e, tailport=e', ("S3","S3"):'headport=e, tailport=e'})
    elif k == 'modulo':
        render(A, IMG+'b_modulo', chain=["S0","S1","S2"])
    else:
        render(A, IMG+'b_'+k, chain=chainB[k])
# Testtabelle für das 5-Schritte-Beispiel (Produkt)
SOL['produkt_eq'] = B['produkt'].minimize_pairs()[1]   # Produkt-Automat ist nicht minimal: S2 ~ S3 (Hinweis für LK)
SOL['produkt_tests'] = {w or "ε": P(B['produkt'], w) for w in ["", "b", "ab", "aab", "abab", "aaba"]}

# ======================================================================= Aufgabe 1 (Basis)
a1a = DFA(ab, "S0", {"S2"}, {("S0","b"):"S1", ("S1","a"):"S2", ("S2","a"):"S2", ("S2","b"):"S2"})
check(a1a, predicate=lambda w: w.startswith("ba"), maxlen=8, name="beginnt ba")
a1b = DFA(ab, "S0", {"S3"}, {("S0","a"):"S0", ("S0","b"):"S1", ("S1","a"):"S1", ("S1","b"):"S2", ("S2","a"):"S2", ("S2","b"):"S3", ("S3","a"):"S3", ("S3","b"):"S3"})
check(a1b, predicate=lambda w: cnt(w, "b") >= 3, maxlen=8, name="mind 3 b")
a1c = DFA(ab, "S0", {"S1"}, {("S0","b"):"S0", ("S0","a"):"S1", ("S1","b"):"S1"})
check(a1c, predicate=lambda w: cnt(w, "a") == 1, maxlen=8, name="genau ein a")
for A in (a1a, a1b, a1c): assert minimal(A)
render(a1a, IMG+'a1a', chain=["S0","S1","S2"])
render(a1b, IMG+'a1b', chain=["S0","S1","S2","S3"])
render(a1c, IMG+'a1c', chain=["S0","S1"])

# ======================================================================= Aufgabe 2 (Standard): endet auf aba
a2 = DFA(ab, "S0", {"S3"}, {("S0","a"):"S1", ("S0","b"):"S0", ("S1","a"):"S1", ("S1","b"):"S2",
                            ("S2","a"):"S3", ("S2","b"):"S0", ("S3","a"):"S1", ("S3","b"):"S2"})
check(a2, predicate=lambda w: w.endswith("aba"), maxlen=9, name="endet aba")
assert minimal(a2)
render(a2, IMG+'a2_aba', chain=["S0","S1","S2","S3"])
A2W = ["", "aba", "aaba", "abab", "ababa", "abba"]
SOL['a2_tests'] = [[w or "ε", "ja" if w.endswith("aba") else "nein", P(a2, w)] for w in A2W]
# typischer Fehler: nach "aba" mit b zurück nach S0 bzw. bei a aus S1 nach S0
a2_bug = DFA(ab, "S0", {"S3"}, {**a2.delta, ("S3","b"):"S0"})
cex = dfa_equivalent(a2, a2_bug)
SOL['a2_bug_cex'] = "".join(cex)
print("A2 Fehlerbeispiel (S3 –b→ S0) – Gegenbeispiel:", SOL['a2_bug_cex'])

# ======================================================================= Aufgabe 3 (Standard): Komplement
a3 = DFA(ab, "S0", {"S2"}, {("S0","a"):"S0", ("S0","b"):"S1", ("S1","a"):"S0", ("S1","b"):"S2", ("S2","a"):"S2", ("S2","b"):"S2"})
check(a3, predicate=lambda w: "bb" in w, maxlen=8, name="enthält bb")
a3k = DFA(ab, "S0", {"S0","S1"}, dict(a3.delta))
check(a3k, predicate=lambda w: "bb" not in w, maxlen=8, name="enthält nicht bb")
render(a3, IMG+'a3_bb', chain=["S0","S1","S2"])
render(a3k, IMG+'a3_nichtbb', chain=["S0","S1","S2"])
# 3b) falsches Komplement eines UNvollständigen Automaten („beginnt mit ab“)
wrong = DFA(ab, "S0", {"S0","S1"}, dict(B['praefix'].delta))   # Fehlerzustand bleibt implizit Nicht-Endzustand
bad = [("".join(w) or "ε") for w in words(ab, 3) if wrong.accepts(list(w)) != (not "".join(w).startswith("ab"))]
SOL['a3_falsch'] = bad
print("3b falsch klassifiziert:", bad)
right = complete(B['praefix'], 'S3'); right = DFA(ab, right.start, set(right.states) - right.finals, right.delta)
check(right, predicate=lambda w: not w.startswith("ab"), maxlen=8, name="beginnt nicht mit ab")
render(right, IMG+'a3_praefix_komplement', chain=["S0","S1","S2"])
render(wrong, IMG+'a3_praefix_falsch', chain=["S0","S1","S2"])

# ======================================================================= Aufgabe 4 (Standard): a gerade UND b ungerade
pairs = {"S0": ("g","g"), "S1": ("g","u"), "S2": ("u","g"), "S3": ("u","u")}
inv = {v: k for k, v in pairs.items()}
flip = lambda x: "u" if x == "g" else "g"
d4 = {}
for q, (pa, pb) in pairs.items():
    d4[(q, "a")] = inv[(flip(pa), pb)]; d4[(q, "b")] = inv[(pa, flip(pb))]
a4 = DFA(ab, "S0", {"S1"}, d4)
check(a4, predicate=lambda w: cnt(w, "a") % 2 == 0 and cnt(w, "b") % 2 == 1, maxlen=8, name="a gerade UND b ungerade")
a4o = DFA(ab, "S0", {q for q, (pa, pb) in pairs.items() if pa == "g" or pb == "u"}, d4)
check(a4o, predicate=lambda w: cnt(w, "a") % 2 == 0 or cnt(w, "b") % 2 == 1, maxlen=8, name="a gerade ODER b ungerade")
SOL['a4_oder_finals'] = sorted(a4o.finals)
SQUARE = {("S0","S2"):'label=" a "', }
render(a4, IMG+'a4_und', ranks=[["S0","S2"],["S1","S3"]], nodesep=0.9, ranksep=1.0)
render(a4o, IMG+'a4_oder', ranks=[["S0","S2"],["S1","S3"]], nodesep=0.9, ranksep=1.0)

# ======================================================================= Aufgabe 5 (Profi): Retro-Konsole (Variante zu Abi 2024 eA B)
# Tasten A, B (blau), X, O (rot), E = Bestätigung. Variante: (1) A oder X kommt vor, (2) mindestens ZWEI rote Tasten, (3) Code endet mit E.
def konsole_var(w):
    if not w.endswith("E") or "E" in w[:-1]: return False
    body = w[:-1]
    return any(c in body for c in "AX") and sum(1 for c in body if c in "XO") >= 2
K = "ABXOE"
# Zustand = Paar (A/X schon da?, Anzahl roter Tasten 0/1/≥2)
KV_PAIRS = {"S0": (0, 0), "S1": (0, 1), "S2": (0, 2), "S3": (1, 0), "S4": (1, 1), "S5": (1, 2)}
kinv = {v: k for k, v in KV_PAIRS.items()}
dk = {}
for q, (ax, r) in KV_PAIRS.items():
    dk[(q, "A")] = kinv[(1, r)]; dk[(q, "B")] = q
    dk[(q, "X")] = kinv[(1, min(r + 1, 2))]; dk[(q, "O")] = kinv[(ax, min(r + 1, 2))]
dk[("S5", "E")] = "S6"
kv = DFA(K, "S0", {"S6"}, dk)
check(kv, predicate=konsole_var, maxlen=6, name="Konsole Variante")
assert minimal(kv)
render(kv, IMG+'konsole_var', ranks=[["S0","S3"],["S1","S4"],["S2","S5"]], nodesep=0.9, ranksep=1.0,
       edge_style={("S3","S3"):'headport=s, tailport=s', ("S4","S4"):'headport=s, tailport=s', ("S5","S5"):'headport=s, tailport=s'})
SOL['kv_tests'] = {w: P(kv, w) for w in ["AOXE", "OOBE", "XXE", "BXOE", "AOE"]}
# Abitur-Regel (1) „A oder X“ = Baukasten-Challenge „konsole“ (Referenz aus der App nachgebaut)
def konsole_abi(w):
    if not w.endswith("E") or "E" in w[:-1]: return False
    body = w[:-1]
    return any(c in body for c in "AX") and any(c in body for c in "AB") and any(c in body for c in "XO")
ka = DFA(K, "S0", {"S7"}, {
    ("S0","A"):"S3", ("S0","B"):"S1", ("S0","X"):"S4", ("S0","O"):"S2",
    ("S1","A"):"S3", ("S1","B"):"S1", ("S1","X"):"S6", ("S1","O"):"S5",
    ("S2","A"):"S6", ("S2","B"):"S5", ("S2","X"):"S4", ("S2","O"):"S2",
    ("S3","A"):"S3", ("S3","B"):"S3", ("S3","X"):"S6", ("S3","O"):"S6",
    ("S4","A"):"S6", ("S4","B"):"S6", ("S4","X"):"S4", ("S4","O"):"S4",
    ("S5","A"):"S6", ("S5","X"):"S6", ("S5","B"):"S5", ("S5","O"):"S5",
    ("S6","A"):"S6", ("S6","B"):"S6", ("S6","X"):"S6", ("S6","O"):"S6", ("S6","E"):"S7"})
check(ka, predicate=konsole_abi, maxlen=6, name="Konsole Abi-Regel")
assert minimal(ka)
render(ka, IMG+'konsole_abi', ranks=[["S1","S2"],["S3","S4","S5"]], nodesep=0.5, ranksep=0.9)
SOL['ka_states'] = len(ka.states); SOL['kv_states'] = len(kv.states)
# unterscheidendes Wort für „B“ vs. „A“ (Aufgabe 5a): kürzestes z mit Bz ∉ L, Az ∈ L
z = next("".join(w) for w in words(K, 3) if konsole_var("X" + "".join(w)) != konsole_var("O" + "".join(w)))
assert kv.run("X")[-1] != kv.run("O")[-1]
SOL['kv_unterscheide'] = z
print("5a: unterscheidendes Wort nach X bzw. O:", z, "| X+z:", P(kv, "X"+z), "| O+z:", P(kv, "O"+z))
SOL["kv_z_paths"] = [P(kv, "X"+z), P(kv, "O"+z)]

json.dump(SOL, open((__MAT + '/content/ds03/solutions.json'), 'w'), ensure_ascii=False, indent=1)
print("OK DS03")
# Merkblatt M02, Antwortmuster: nach „ab“ und „b“ verschiedene Zustände (Sprache „endet auf aba“), z = a
assert a2.accepts("aba") and not a2.accepts("ba") and a2.run("ab")[-1] != a2.run("b")[-1]
SOL['m02_muster'] = [P(a2, "aba"), P(a2, "ba")]
json.dump(SOL, open((__MAT + '/content/ds03/solutions.json'), 'w'), ensure_ascii=False, indent=1)
