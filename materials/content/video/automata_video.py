import os as _os_mat
__MAT = _os_mat.path.abspath(_os_mat.path.join(_os_mat.path.dirname(__file__), '../..'))  # Wurzel: materials/
"""Erklärvideo-Reihe: alle Beispiele der Videos verifizieren und (Schritt-)Grafiken rendern.
Ausgabe: materials/build/img/video/*.png + video_data.json"""
import sys, json
sys.path.insert(0, (__MAT + '/content/ds07'))
from weltb import *

IMG = (__MAT + '/build/img/video/')
os.makedirs(IMG, exist_ok=True)
D = {}
def R(A, path_noext, **kw):
    """Wie render(), aber mit größerer Schrift (Video: auf dem Handy lesbar)."""
    dot = to_dot(A, **kw).replace('fontsize=13', 'fontsize=19').replace('fontsize=15', 'fontsize=19').replace('fontsize=14', 'fontsize=17').replace('fontsize=12', 'fontsize=16')
    return render(dot, path_noext)


HL = 'color="#B26A0F", fontcolor="#B26A0F", penwidth=3.2'


def dfa_steps(A, word, name, **kw):
    """Je Schritt eine Grafik: aktueller Zustand ocker, zuletzt benutzte Kante ocker."""
    w = tokenize(word, A.sigma)
    q = A.start; files = [R(A, IMG + f'{name}_0', highlight={q}, **kw)]
    for i, a in enumerate(w, 1):
        p, q = q, A.delta.get((q, a))
        if q is None: break
        files.append(R(A, IMG + f'{name}_{i}', highlight={q}, edge_style={(p, q): HL}, **kw))
    return files


def mealy_run(M, word):
    q, out, steps = M.start, [], []
    for a in tokenize(word, M.sigma):
        p, (q, o) = q, M.delta[(q, a)]
        steps.append((p, a, o or 'ε', q)); out.append(o)
    return steps, ''.join(out) or 'ε'


# ============================================================ V1 DEA lesen (LOL-Erkenner, Kaffeeautomat)
lol = DFA("LOX", "S0", {"S3"}, {
    ("S0", "L"): "S1", ("S0", "O"): "S0", ("S0", "X"): "S0",
    ("S1", "L"): "S1", ("S1", "O"): "S2", ("S1", "X"): "S0",
    ("S2", "L"): "S3", ("S2", "O"): "S0", ("S2", "X"): "S0",
    ("S3", "L"): "S3", ("S3", "O"): "S3", ("S3", "X"): "S3"})
check(lol, predicate=lambda w: "LOL" in w, maxlen=8, name="LOL")
R(lol, IMG + 'lol', chain=["S0", "S1", "S2", "S3"])
dfa_steps(lol, "XLOL", "lol_xlol", chain=["S0", "S1", "S2", "S3"])
D['v1'] = {w: {'path': lol.path_str(w), 'acc': lol.accepts(w)} for w in ["XLOL", "LOOL", "LOLO", "LLOXL", "OLOL", "LOXL"]}
assert D['v1']['XLOL']['acc'] and not D['v1']['LOOL']['acc'] and D['v1']['LOLO']['acc'] and not D['v1']['LLOXL']['acc'] and D['v1']['OLOL']['acc']

kaffee = DFA(["10", "20"], "S0", {"S4"}, {
    ("S0", "10"): "S1", ("S0", "20"): "S2", ("S1", "10"): "S2", ("S1", "20"): "S3",
    ("S2", "10"): "S3", ("S2", "20"): "S4", ("S3", "10"): "S4"})
check(kaffee, predicate=lambda w: sum(int(x) for x in w) == 40, maxlen=5, sigma=["10", "20"], name="Kaffee")
R(kaffee, IMG + 'kaffee')
R(kaffee, IMG + 'kaffee_komplett', error_state=True)
D['v1_kaffee'] = {"10 10 20": kaffee.accepts(["10", "10", "20"]), "20 10 20": kaffee.accepts(["20", "10", "20"]), "20 20": kaffee.accepts(["20", "20"])}
assert D['v1_kaffee'] == {"10 10 20": True, "20 10 20": False, "20 20": True}

# Detektiv Fall 1 (App): endet auf b
det1 = DFA("ab", "S0", {"S1"}, {("S0", "a"): "S0", ("S0", "b"): "S1", ("S1", "a"): "S0", ("S1", "b"): "S1"})
check(det1, predicate=lambda w: w.endswith("b"), maxlen=8, name="Detektiv 1")

# ============================================================ V2 DEA entwickeln: endet auf ab
eab3 = DFA("ab", "S0", {"S2"}, {("S0", "a"): "S1", ("S0", "b"): "S0", ("S1", "a"): "S1", ("S1", "b"): "S2",
                                  ("S2", "a"): "S1", ("S2", "b"): "S0"})
check(eab3, predicate=lambda w: w.endswith("ab"), maxlen=9, name="endet ab")
CH = ["S0", "S1", "S2"]
lab = {"S0": "S0", "S1": "S1", "S2": "S2"}
# Stufe 1: nur Zustände
INV = 'style=invis'
R(eab3, IMG + 'eab_schritt2', chain=CH, edge_style={k: INV for k in [("S0", "S1"), ("S1", "S2"), ("S0", "S0"), ("S1", "S1"), ("S2", "S1"), ("S2", "S0")]})
R(eab3, IMG + 'eab_schritt3a', chain=CH, edge_style={k: INV for k in [("S0", "S0"), ("S1", "S1"), ("S2", "S1"), ("S2", "S0")]})
R(eab3, IMG + 'eab_komplett', chain=CH)
falsch = DFA("ab", "S0", {"S2"}, {("S0", "a"): "S1", ("S0", "b"): "S0", ("S1", "a"): "S0", ("S1", "b"): "S2",
                                    ("S2", "a"): "S1", ("S2", "b"): "S0"})
R(falsch, IMG + 'eab_falsch', chain=CH, edge_style={("S1", "S0"): HL})
assert not falsch.accepts("aab") and eab3.accepts("aab")
D['v2'] = {'aab_falsch': falsch.path_str("aab"), 'aab_richtig': eab3.path_str("aab"),
           'tests': {w: eab3.accepts(w) for w in ["", "ab", "aab", "bab", "abab", "ba", "abb", "aba"]}}
# Pause-Aufgabe: enthält bb
bb = DFA("ab", "S0", {"S2"}, {("S0", "a"): "S0", ("S0", "b"): "S1", ("S1", "a"): "S0", ("S1", "b"): "S2",
                               ("S2", "a"): "S2", ("S2", "b"): "S2"})
check(bb, predicate=lambda w: "bb" in w, maxlen=9, name="enthält bb")
R(bb, IMG + 'bb', chain=CH)
GBB = Grammar("S0 → aS0 | bS1\nS1 → aS0 | bS2\nS2 → aS2 | bS2 | ε", start="S0")
assert GBB.is_right_regular()
for w in words("ab", 8):
    w = "".join(w); assert GBB.accepts(w) == ("bb" in w), w

# ============================================================ V3 Mealy: Kartoffelautomat
E = ""
kart = Mealy("12", ["1", "K"], "S0", {
    ("S0", "1"): ("S1", E), ("S0", "2"): ("S2", E), ("S1", "1"): ("S2", E), ("S1", "2"): ("S3", E),
    ("S2", "1"): ("S3", E), ("S2", "2"): ("S0", "K"), ("S3", "1"): ("S0", "K"), ("S3", "2"): ("S0", "K1")})


def kart_spec(w):
    s, o = 0, ""
    for c in w:
        s += int(c)
        if s >= 4: o += "K1" if s == 5 else "K"; s = 0
    return o


for w in words("12", 7):
    assert kart.translate("".join(w))[0] == kart_spec(w), w
R(kart, IMG + 'kart', chain=["S0", "S1", "S2", "S3"], nodesep=0.5, ranksep=0.9)
D['v3'] = {}
for w in ["212", "1212", "11111", "2222"]:
    st, out = mealy_run(kart, w)
    assert out == (kart_spec(w) or 'ε')
    D['v3'][w] = {'steps': st, 'out': out}
# Schrittbilder für 2 1 2
q = "S0"; R(kart, IMG + 'kart_212_0', chain=["S0", "S1", "S2", "S3"], nodesep=0.5, ranksep=0.9, highlight={"S0"})
for i, a in enumerate("212", 1):
    p, (q, o) = q, kart.delta[(q, a)]
    R(kart, IMG + f'kart_212_{i}', chain=["S0", "S1", "S2", "S3"], nodesep=0.5, ranksep=0.9, highlight={q}, edge_style={(p, q): HL})

# ============================================================ V4 Grenzen: aⁿbⁿ
anbn_pred = lambda w: (n := len(w) // 2) >= 1 and w == "a" * n + "b" * n
witness_check(anbn_pred, lambda i: "a" * i, lambda i: "b" * i, n=10, name="anbn")


def bau_anbn(c):  # wie app/js/data/ueberliste.js
    d = {("S0", "a"): "A1"}
    for i in range(1, c + 1):
        d[(f"A{i}", "a")] = f"A{min(i + 1, c)}"; d[(f"A{i}", "b")] = "B0" if i == 1 else f"B{i - 1}"
    for j in range(1, c): d[(f"B{j}", "b")] = f"B{j - 1}"
    return DFA("ab", "S0", {"B0"}, d)


z2 = bau_anbn(2)
assert len(z2.states) == 5
falsch_z = [w for w in ["aaabb", "aaabbb", "aabb", "ab"] if z2.accepts(w) != anbn_pred(w)]
assert falsch_z == ["aaabb", "aaabbb"], falsch_z
R(z2, IMG + 'zaehler5', chain=["S0", "A1", "A2", "B1", "B0"])
D['v4'] = {'aaabb': z2.path_str("aaabb"), 'aaabbb': z2.path_str("aaabbb"), 'aab': z2.path_str('aab')}
z10 = bau_anbn(10); assert len(z10.states) == 21 and z10.accepts("a" * 11 + "b" * 10)

# ============================================================ V5 Kellerautomat aⁿbⁿ
anbn = PDA("ab", "#A", "S0", {"S2"}, [
    ("S0", "#", "a", "A#", "S0"), ("S0", "A", "a", "AA", "S0"),
    ("S0", "A", "b", EPS, "S1"), ("S1", "A", "b", EPS, "S1"), ("S1", "#", EPS, "#", "S2")])
check(anbn, predicate=anbn_pred, maxlen=12, name="anbn PDA")
R(anbn, IMG + 'anbn_pda', ranksep=1.1)
D['v5'] = {w: pda_table(anbn, w) for w in ["aabb", "aab", "abb"]}
print("abb:", D['v5']['abb'])
assert D['v5']['aabb']['accepted'] and not D['v5']['aab']['accepted'] and not D['v5']['abb']['accepted']

# ============================================================ V6 Grammatik: Glal + Mini-Deutsch
G2 = Grammar("S → laA | leA | luA\nA → laB | leB | luB\nB → lu", terminals=['la', 'le', 'lu'])
assert G2.accepts(['lu', 'la', 'lu']) and not G2.accepts(['la', 'lu', 'le'])
D['v6_pause'] = G2.derivation_str(['lu', 'la', 'lu'])
assert G2.accepts(['le', 'la', 'lu']) and not G2.accepts(['la', 'lu', 'le']) and not G2.accepts(['la', 'la', 'la', 'lu'])
D['v6'] = {'lelalu': G2.derivation_str(['le', 'la', 'lu']), 'lulelu': G2.derivation_str(['lu', 'le', 'lu'])}
d11 = json.load(open((__MAT + '/build/img/ds11/data.json')))
D['v6']['schaf'] = d11['g1_folie_deriv']; D['v6']['schaf_rules'] = d11['g1_folie_rules']

# ============================================================ V7 Reguläre Grammatik ↔ Automat
duell = DFA("ab", "S0", {"S2"}, {("S0", "a"): "S1", ("S1", "a"): "S1", ("S1", "b"): "S2", ("S2", "a"): "S1", ("S2", "b"): "S2"})
check(duell, predicate=lambda w: len(w) >= 2 and w[0] == 'a' and w[-1] == 'b', maxlen=8, name="Duell")
R(duell, IMG + 'duell', chain=["S0", "S1", "S2"])
GD = Grammar("S0 → aS1\nS1 → aS1 | bS2\nS2 → aS1 | bS2 | ε", start="S0")
assert GD.is_right_regular()
for w in words("ab", 7):
    w = "".join(w); assert GD.accepts(w) == duell.accepts(w), w
D['v7'] = {'abab_deriv': GD.derivation_str("abab"), 'abab_path': duell.path_str("abab")}
GE = Grammar("S → aS | bS | aA\nA → b")
assert GE.is_right_regular()
for w in words("ab", 8):
    w = "".join(w); assert GE.accepts(w) == w.endswith("ab"), w
nea = NFA("ab", "S", {"Z"}, {("S", "a"): {"S", "A"}, ("S", "b"): {"S"}, ("A", "b"): {"Z"}})
check(nea, predicate=lambda w: w.endswith("ab"), maxlen=8, name="NEA endet ab")
R(nea, IMG + 'nea_endet_ab', chain=["S", "A", "Z"])
dea, order = subset_construction(nea, names=lambda S: {frozenset({"S"}): "S0", frozenset({"S", "A"}): "S1", frozenset({"S", "Z"}): "S2"}[frozenset(S)])
check(dea, predicate=lambda w: w.endswith("ab"), maxlen=8, name="DEA aus NEA")
R(dea, IMG + 'dea_endet_ab', chain=["S0", "S1", "S2"])
D['v7']['sets'] = [sorted(S) for S in order]
D['v7']['nea_aab'] = nfa_sets_str(nea, "aab")

# ============================================================ V8 kontextfreie Grammatiken
GA = Grammar("S → aSb | ab")
for w in words("ab", 10):
    w = "".join(w); assert GA.accepts(w) == anbn_pred(w), w
D['v8'] = {'aaabbb': GA.derivation_str("aaabbb")}
GK = Grammar("S → (S)S | ε")
D['v8']['klammer'] = GK.derivation_str("(())()")
GEM = Grammar("E → E+E | E*E | (E) | a", start='E')
assert GEM.accepts("a+a*a")
GP = Grammar("S → 0S0 | 1S1 | 0 | 1 | ε")
for w in words("01", 8):
    w = "".join(w); assert GP.accepts(w) == (w == w[::-1]), w
assert not GP.is_right_regular()
assert not GA.is_right_regular() and not GK.is_right_regular()

# ============================================================ O1 Minimierung: endet auf ab 5 → 3
eab5 = DFA("ab", "S0", {"S2"}, {
    ("S0", "a"): "S1", ("S0", "b"): "S0", ("S1", "a"): "S3", ("S1", "b"): "S2",
    ("S2", "a"): "S4", ("S2", "b"): "S0", ("S3", "a"): "S3", ("S3", "b"): "S2",
    ("S4", "a"): "S3", ("S4", "b"): "S2"})
check(eab5, predicate=lambda w: w.endswith("ab"), maxlen=8, name="endet ab 5")
rounds, eq = eab5.minimize_pairs()
assert eq == [("S1", "S3"), ("S1", "S4"), ("S3", "S4")], eq
D['o1'] = {'rounds': [[list(p) for p in r] for r in rounds], 'eq': eq}

# ============================================================ O2 NKA Palindrome w wᴿ
pal_push = [("S0", "#", "a", "A#", "S0"), ("S0", "#", "b", "B#", "S0"), ("S0", "A", "a", "AA", "S0"), ("S0", "A", "b", "BA", "S0"), ("S0", "B", "a", "AB", "S0"), ("S0", "B", "b", "BB", "S0")]
pal_pop = [("S1", "A", "a", EPS, "S1"), ("S1", "B", "b", EPS, "S1"), ("S1", "#", EPS, "#", "S2")]
pal = PDA("ab", "#AB", "S0", {"S2"}, pal_push + [("S0", "#", EPS, "#", "S1"), ("S0", "A", EPS, "A", "S1"), ("S0", "B", EPS, "B", "S1")] + pal_pop)
check(pal, predicate=lambda w: len(w) % 2 == 0 and w == w[::-1], maxlen=8, name="Palindrom NKA")
R(pal, IMG + 'pal_nka', ranksep=0.9)
palc = PDA("abc", "#AB", "S0", {"S2"}, pal_push + [("S0", "#", "c", "#", "S1"), ("S0", "A", "c", "A", "S1"), ("S0", "B", "c", "B", "S1")] + pal_pop)
check(palc, predicate=lambda w: w.count("c") == 1 and w == w[::-1] and len(w) % 2 == 1 and w[len(w) // 2] == "c", maxlen=7, name="w c wR")
assert palc.accepts("abcba") and palc.accepts("aabcbaa")
R(palc, IMG + 'palc', ranksep=0.9)
D['o2'] = {'abba': pda_table(pal, "abba")}
assert D['o2']['abba']['accepted'] and not pal.accepts("abab")

json.dump(D, open(IMG + 'video_data.json', 'w'), ensure_ascii=False, indent=1)
print("OK – alle Video-Beispiele verifiziert")
print(json.dumps({k: D[k] for k in ['v1', 'v2', 'v4', 'v7']}, ensure_ascii=False, indent=0)[:3000])
print(D['v3']); print(D['v5']['aabb']); print(D['v6']['lelalu'], D['v8']); print(D['o1']); print(D['o2'])

# ============================================================ V9 Abi-Check: Zusatzprüfungen
for w in (["10", "20"], ["20", "10"], ["10", "10", "10"]):
    assert kaffee.run(w)[-1] == "S3" if isinstance(kaffee.run(w), list) else True
assert lol.path_str("LOOL") == "S0 –L→ S1 –O→ S2 –O→ S0 –L→ S1"
GPL = Grammar("A → +xA | +yA | ε", start="A", terminals=["+", "x", "y"])
GPL2 = Grammar("A → +B | ε\nB → xA | yA", start="A", terminals=["+", "x", "y"])
assert not GPL.is_right_regular() and GPL2.is_right_regular()
for w in words(["+", "x", "y"], 6):
    assert GPL.accepts(list(w)) == GPL2.accepts(list(w)), w
assert not pal.accepts("abab") and pal.accepts("abba") and pal.accepts("")
print("V9/O2-Zusatzprüfungen OK")
