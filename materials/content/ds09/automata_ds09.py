import os as _os_mat
__MAT = _os_mat.path.abspath(_os_mat.path.join(_os_mat.path.dirname(__file__), '../..'))  # Wurzel: materials/
import sys; sys.path.insert(0, (__MAT + '/content/ds07'))
from weltb import *
IMG = (__MAT + '/build/img/ds09/')
OUT = {}

def pal_ok(w): return w == w[::-1]
def klam(w, auf="(", zu=")"):
    d = 0
    for x in w:
        if x == auf: d += 1
        elif x == zu:
            d -= 1
            if d < 0: return False
    return d == 0

# ------------------------------------------------------------------ 1) aⁿbⁿ (App: anbn)
anbn = PDA("ab", "#A", "S0", {"S2"}, [
    ("S0", "#", "a", "A#", "S0"), ("S0", "A", "a", "AA", "S0"),
    ("S0", "A", "b", EPS, "S1"), ("S1", "A", "b", EPS, "S1"), ("S1", "#", EPS, "#", "S2")])
anbn_pred = lambda w: (n := len(w) // 2) >= 1 and w == "a" * n + "b" * n
check(anbn, predicate=anbn_pred, maxlen=12, name="anbn")
assert anbn.is_deterministic()
render(anbn, IMG + 'anbn', ranksep=1.1)
OUT["anbn"] = {w: pda_table(anbn, w) for w in ["aabb", "aaabbb", "aab", "abb", "aaabbb"]}

# ------------------------------------------------------------------ 2) Klammern ( ) (App: klammern)
kl = PDA("()", "#K", "S0", {"S0"}, [
    ("S0", "#", "(", "K#", "S1"), ("S1", "K", "(", "KK", "S1"), ("S1", "K", ")", EPS, "S1"), ("S1", "#", EPS, "#", "S0")])
check(kl, predicate=klam, maxlen=12, name="Klammern")
render(kl, IMG + 'klammern', ranksep=0.7)
OUT["kl"] = {w: pda_table(kl, w) for w in ["(())", "()(", "())", "(()())"]}
# gemischte Klammern ( ) [ ] (App: klammern-gemischt) – Lösung Profi
def gem(w):
    st = []
    for c in w:
        if c in "([": st.append(c)
        elif not st or st.pop() != {")": "(", "]": "["}[c]: return False
    return not st
klg = PDA("()[]", "#RE", "S0", {"S0"}, [
    ("S0", "#", "(", "R#", "S1"), ("S0", "#", "[", "E#", "S1"),
    ("S1", "R", "(", "RR", "S1"), ("S1", "R", "[", "ER", "S1"), ("S1", "E", "(", "RE", "S1"), ("S1", "E", "[", "EE", "S1"),
    ("S1", "R", ")", EPS, "S1"), ("S1", "E", "]", EPS, "S1"), ("S1", "#", EPS, "#", "S0")])
check(klg, predicate=gem, maxlen=8, name="Klammern gemischt")
render(klg, IMG + 'klammern_gemischt', ranksep=0.7)
OUT["klg"] = {w: pda_table(klg, w) for w in ["([()])", "([)]"]}

# ------------------------------------------------------------------ 3) aⁿb²ⁿ (App: anb2n)
anb2n = PDA("ab", "#A", "S0", {"S2"}, [
    ("S0", "#", "a", "AA#", "S0"), ("S0", "A", "a", "AAA", "S0"),
    ("S0", "A", "b", EPS, "S1"), ("S1", "A", "b", EPS, "S1"), ("S1", "#", EPS, "#", "S2")])
anb2n_pred = lambda w: len(w) % 3 == 0 and (n := len(w) // 3) >= 1 and w == "a" * n + "b" * (2 * n)
check(anb2n, predicate=anb2n_pred, maxlen=12, name="anb2n")
render(anb2n, IMG + 'anb2n', ranksep=1.1)
OUT["anb2n"] = {w: pda_table(anb2n, w) for w in ["abb", "aabbbb", "aabbb"]}
# Alternative: ein A je a, je zwei b ein A entfernen (Zwischenzustand)
anb2n_alt = PDA("ab", "#A", "S0", {"S3"}, [
    ("S0", "#", "a", "A#", "S0"), ("S0", "A", "a", "AA", "S0"),
    ("S0", "A", "b", "A", "S1"), ("S1", "A", "b", EPS, "S2"), ("S2", "A", "b", "A", "S1"), ("S2", "#", EPS, "#", "S3")])
check(anb2n_alt, predicate=anb2n_pred, maxlen=12, name="anb2n alt")
render(anb2n_alt, IMG + 'anb2n_alt', ranksep=1.0)

# ------------------------------------------------------------------ 4) gleich viele a und b (App: gleich-ab)
gab = PDA("ab", "#AB", "S0", {"S0"}, [
    ("S0", "#", "a", "A#", "S1"), ("S0", "#", "b", "B#", "S1"),
    ("S1", "A", "a", "AA", "S1"), ("S1", "B", "b", "BB", "S1"), ("S1", "A", "b", EPS, "S1"), ("S1", "B", "a", EPS, "S1"),
    ("S1", "#", EPS, "#", "S0")])
check(gab, predicate=lambda w: w.count("a") == w.count("b"), maxlen=12, name="gleich ab")
render(gab, IMG + 'gleich_ab', ranksep=0.7)
OUT["gab"] = {w: pda_table(gab, w) for w in ["abba", "bbaa", "aab"]}

# ------------------------------------------------------------------ Stapel-Aufwärmübung: Belegungen nach Operationen (oberstes links)
st = []; ops = [("push", "A"), ("push", "B"), ("pop", None), ("push", "C"), ("push", "C"), ("top", None), ("pop", None)]
trace = []
for op, x in ops:
    if op == "push": st.append(x); r = ""
    elif op == "pop": r = st.pop()
    else: r = st[-1]
    trace.append([f"{op}({x})" if x else f"{op}()", "".join(reversed(st)) + "#", r or "–"])
OUT["stapel"] = trace
# Übergang (A, a) : BA auf Keller ACA# → BACA#? Kontrolle der Ablageregel
def apply(stack, top, push):
    assert stack[0] == top
    return push + stack[1:]
OUT["ablage"] = [["(#, a) : A#", "#", apply("#", "#", "A#")], ["(A, a) : AA", "A#", apply("A#", "A", "AA")], ["(A, b) : ε", "AA#", apply("AA#", "A", "")], ["(B, a) : AB", "BA#", apply("BA#", "B", "AB")], ["(A, c) : BCA", "AB#", apply("AB#", "A", "BCA")]]

for k, v in OUT.items():
    print(k, json.dumps(v, ensure_ascii=False)[:300])
dump(OUT, (__MAT + '/content/ds09/ds09.json'))
print("DS09 ok")

# ------------------------------------------------------------------ Grafik: ein Übergang am Keller, (A, a) : BA
def stack_html(cells, cap, hl_top=False, pad=0):
    rows = "".join('<TR><TD BORDER="0" HEIGHT="34"> </TD></TR>' for _ in range(pad))
    rows += "".join(f'<TR><TD WIDTH="70" HEIGHT="34" BGCOLOR="{"#F6E7CF" if (i == 0 and hl_top) else "#E4F0EE"}" BORDER="1" COLOR="#0E6455"><FONT POINT-SIZE="18">{c}</FONT></TD></TR>' for i, c in enumerate(cells))
    rows += f'<TR><TD BORDER="0" HEIGHT="30"><FONT POINT-SIZE="15" COLOR="#5B6770">{cap}</FONT></TD></TR>'
    return f'<<TABLE BORDER="0" CELLSPACING="0" CELLPADDING="4">{rows}</TABLE>>'
before, after = "A#", apply("A#", "A", "BA")
assert after == "BA#"
dot = f'''digraph G {{ rankdir=LR; bgcolor="transparent"; nodesep=0.3; ranksep=0.4;
 label="Übergang (A, a) : BA"; labelloc=t; fontname="Cambria"; fontsize=20; fontcolor="#0E6455";
 node [shape=plaintext, fontname="Calibri", fontcolor="#1F2A2E"]; edge [color="#B26A0F", penwidth=2, arrowsize=0.9, fontname="Calibri", fontsize=16, fontcolor="#1F2A2E"];
 v [label={stack_html(list(before), "vorher: A#", True, 1)}];
 m [label={stack_html(list(before[1:]), "A entfernt: #", False, 2)}];
 n [label={stack_html(list(after), "nachher: BA#", True, 0)}];
 v -> m [label=" 1. A entfernen "]; m -> n [label=" 2. erst A, dann B ablegen "];
}}'''
render(dot, IMG + 'uebergang_stapel')
