import os as _os_mat
__MAT = _os_mat.path.abspath(_os_mat.path.join(_os_mat.path.dirname(__file__), '../..'))  # Wurzel: materials/
"""DS13 – Level 13 „Klammern, Spiegel, Programme“ – kontextfreie Grammatiken: Verifikation, Ableitungen, Bäume."""
import sys, re, itertools
sys.path.insert(0, (__MAT + '/content/ds11'))
from gtools import *
from automata import render, PDA, tokenize

IMG = (__MAT + '/build/img/ds13/')
data = {}
pal = lambda w: w == w[::-1]
def balanced(w, o='(', c=')'):
    d = 0
    for x in w:
        if x == o: d += 1
        elif x == c:
            d -= 1
            if d < 0: return False
    return d == 0

# ---------------------------------------------------------------------------------------------- Grundmuster
GP = Grammar("S → 0S0 | 1S1 | 0 | 1 | ε")
verify(GP, '01', pal, 10, 'Palindrome', lib_maxlen=7)
assert not GP.is_right_regular()
data['gp_deriv'] = derivation_steps(GP, '0110')
render_tree(GP, '0110', IMG + 'baum_0110')
data['gp_deriv_10101'] = derivation_steps(GP, '10101')
render_tree(GP, '10101', IMG + 'baum_10101')

GK = Grammar("S → (S)S | ε")
verify(GK, '()', balanced, 10, 'Klammern', lib_maxlen=8)  # mit verbessertem Grammar.derive (ε-Regeln) auch über Grammar.accepts geprüft
data['gk_deriv'] = derivation_steps(GK, '(())()')
render_tree(GK, '(())()', IMG + 'baum_klammern')

GA = Grammar("S → aSb | ab")
verify(GA, 'ab', lambda w: (n := len(w) // 2) >= 1 and w == ['a'] * n + ['b'] * n, 12, 'aⁿbⁿ', lib_maxlen=8)
data['ga_deriv'] = derivation_steps(GA, 'aaabbb')
render_tree(GA, 'aaabbb', IMG + 'baum_anbn')

GC = Grammar("S → aSb | c")
verify(GC, 'abc', lambda w: (n := (len(w) - 1) // 2) >= 0 and w == ['a'] * n + ['c'] + ['b'] * n, 9, 'aⁿcbⁿ', lib_maxlen=7)
data['gc_deriv'] = derivation_steps(GC, 'aacbb')

# Terme mit Vorrang (eindeutig) und ohne Vorrang (mehrdeutig)
def term_ok(w):
    s = ''.join(w); i = 0
    def E():
        nonlocal i
        if not F(): return False
        while i < len(s) and s[i] in '+*':
            i += 1
            if not F(): return False
        return True
    def F():
        nonlocal i
        if i < len(s) and s[i] == 'a': i += 1; return True
        if i < len(s) and s[i] == '(':
            i += 1
            if not E(): return False
            if i < len(s) and s[i] == ')': i += 1; return True
        return False
    return E() and i == len(s)
GE = Grammar("E → E+T | T\nT → T*F | F\nF → (E) | a", start='E')
verify(GE, 'a+*()', term_ok, 7, 'Terme mit Vorrang', lib_maxlen=5, slack=8)
data['ge_deriv'] = derivation_steps(GE, 'a+a*a')
render_tree(GE, 'a+a*a', IMG + 'baum_term')
GEM = Grammar("E → E+E | E*E | (E) | a", start='E')
verify(GEM, 'a+*()', term_ok, 7, 'Terme ohne Vorrang', lib_maxlen=5, slack=8)
trees = all_leftmost(GEM, 'a+a*a', limit=5)
assert len(trees) == 2 and count_leftmost(GEM, 'a+a*a') == 2 and count_leftmost(GE, 'a+a*a') == 1
for i, seq in enumerate(trees):
    render_dot(tree_dot(tree_from_seq(GEM, seq), GEM), IMG + f'term_mehrdeutig_{i + 1}')
data['gem_derivs'] = [[join(f) for f in seq] for seq in trees]

# ---------------------------------------------------------------------------------------------- Aufgabe 2: Tanz-Roboter (verschachtelte Wiederholungen)
SIGT = list("sd23()#")
def tanz_parse(w):
    """Gibt die ausgeschriebene Folge zurück oder None."""
    s = ''.join(w); i = 0
    def P():
        nonlocal i
        out = B()
        if out is None: return None
        while i < len(s) and s[i] in 'sd23':
            x = B()
            if x is None: return None
            out += x
        return out
    def B():
        nonlocal i
        if i < len(s) and s[i] in 'sd': i += 1; return s[i - 1]
        if i + 1 < len(s) and s[i] in '23' and s[i + 1] == '(':
            k = int(s[i]); i += 2
            inner = P()
            if inner is None or i >= len(s) or s[i] != ')': return None
            i += 1; return inner * k
        return None
    r = P()
    if r is None or i != len(s) - 1 or s[-1] != '#': return None
    return r + '#'
GTZ_TEXT = "S → P#\nP → BP | B\nB → s | d | 2(P) | 3(P)"
GTZ = Grammar(GTZ_TEXT)
verify(GTZ, SIGT, lambda w: tanz_parse(w) is not None, 7, 'Tanz-Roboter', lib_maxlen=5)
data['gtz_rules'] = GTZ_TEXT.splitlines()
data['tz_expand'] = tanz_parse('2(s3(d))#')
data['tz_expand2'] = tanz_parse('3(s2(d))s#')
data['tz_deriv'] = derivation_steps(GTZ, '3(s2(d))s#')
render_tree(GTZ, '3(s2(d))s#', IMG + 'baum_tanz', leaves_bottom=False)
print('  Tanz:', data['tz_expand'], data['tz_expand2'])

# ---------------------------------------------------------------------------------------------- Aufgabe 3: Hostnamen (abstrakt: b = Buchstabe, z = Ziffer)
SIGH = list("bz-.")
GH_TEXT = "S → L.S | L.E\nL → DR\nR → DR | ZR | -R | ε\nE → DD\nD → b\nZ → z"
GH = Grammar(GH_TEXT)
host_alt = lambda w: re.fullmatch(r'(b[bz-]*\.)+bb', ''.join(w)) is not None
host_neu = lambda w: re.fullmatch(r'(b([bz-]*[bz])?\.)+bb', ''.join(w)) is not None
verify(GH, SIGH, host_alt, 8, 'Hostnamen (Original)', lib_maxlen=6)
GH2_TEXT = "S → L.S | L.E\nL → D | DM\nM → DM | ZM | -M | D | Z\nE → DD\nD → b\nZ → z"
GH2 = Grammar(GH2_TEXT)
verify(GH2, SIGH, host_neu, 8, 'Hostnamen (korrigiert)', lib_maxlen=6)
assert GH.accepts('bbb-.bb') and not GH2.accepts('bbb-.bb') and GH2.accepts('bb-z.bb')
# Ableitung mit echten Buchstaben/Ziffern
LET = 'abcdefghijklmnopqrstuvwxyz'; DIG = '0123456789'
GHF_TEXT = f"S → L.S | L.E\nL → DR\nR → DR | ZR | -R | ε\nE → DD\nD → {' | '.join(LET)}\nZ → {' | '.join(DIG)}"
GHF = Grammar(GHF_TEXT)
data['gh_deriv'] = derivation_steps(GHF, 'lk-2.de')
GH2F = Grammar(GH2_TEXT.replace('D → b', 'D → ' + ' | '.join(LET)).replace('Z → z', 'Z → ' + ' | '.join(DIG)))
data['gh2_deriv'] = derivation_steps(GH2F, 'lk-2.de')
assert GHF.accepts('mpg-.de') and not GH2F.accepts('mpg-.de')
data['gh_rules'] = ["S → L.S | L.E", "L → DR", "R → DR | ZR | -R | ε", "E → DD", "D → a | b | … | z", "Z → 0 | 1 | … | 9"]
data['gh2_rules'] = ["S → L.S | L.E", "L → D | DM", "M → DM | ZM | -M | D | Z", "E → DD", "D → a | b | … | z", "Z → 0 | 1 | … | 9"]
# Hostnamen sind regulär: DEA (abstrakt) für die korrigierte Sprache
hd = DFA(SIGH, "S0", {"S5"}, {
    ("S0", "b"): "S1",
    ("S1", "b"): "S1", ("S1", "z"): "S1", ("S1", "-"): "S2", ("S1", "."): "S3",
    ("S2", "b"): "S1", ("S2", "z"): "S1", ("S2", "-"): "S2",
    ("S3", "b"): "S4",
    ("S4", "b"): "S5", ("S4", "z"): "S1", ("S4", "-"): "S2", ("S4", "."): "S3",
    ("S5", "b"): "S1", ("S5", "z"): "S1", ("S5", "-"): "S2", ("S5", "."): "S3"})
check(hd, predicate=lambda w: host_neu(list(w)), maxlen=8, name='Hostnamen-DEA')
GH3 = Grammar(dfa_to_grammar_text(hd), start="S0")
assert GH3.is_right_regular()
verify(GH3, SIGH, host_neu, 8, 'Hostnamen (rechtsregulär)', lib_maxlen=5)
data['gh3_rules'] = GH3.text().splitlines()

# ---------------------------------------------------------------------------------------------- Aufgabe 4: wenn – dann – sonst
TW = ['wenn', 'dann', 'sonst', 'h', 'k', 'an', 'aus']
GW_TEXT = "S → an | aus | V\nV → wenn B dann S | wenn B dann S sonst S\nB → h | k"
GW = Grammar(GW_TEXT, nonterminals=['S', 'V', 'B'], terminals=TW)
prog = 'wenn h dann wenn k dann an sonst aus'.split()
assert count_leftmost(GW, prog) == 2
wtrees = all_leftmost(GW, prog, limit=5)
assert len(wtrees) == 2
for i, seq in enumerate(wtrees):
    render_dot(tree_dot(tree_from_seq(GW, seq), GW, fontsize=19, nodesep=0.06, ranksep=0.3), IMG + f'wenn_baum_{i + 1}')
data['gw_derivs'] = [[join(f, ' ') for f in seq] for seq in wtrees]
data['gw_rules'] = GW_TEXT.splitlines()
# Eindeutig 1: Endmarke „ende“ (Alphabet erweitert)
GW1_TEXT = "S → an | aus | V\nV → wenn B dann S ende | wenn B dann S sonst S ende\nB → h | k"
GW1 = Grammar(GW1_TEXT, nonterminals=['S', 'V', 'B'], terminals=TW + ['ende'])
L1 = language(GW1, 14)
assert all(count_leftmost(GW1, list(w)) == 1 for w in L1), 'GW1 mehrdeutig'
print(f'  ✓ wenn-dann-sonst mit ende: alle {len(L1)} Programme bis Länge 14 eindeutig')
data['gw1_rules'] = GW1_TEXT.splitlines()
p1 = 'wenn h dann wenn k dann an sonst aus ende ende'.split()
p2 = 'wenn h dann wenn k dann an ende sonst aus ende'.split()
assert GW1.accepts(p1) and GW1.accepts(p2)
# Eindeutig 2: else gehört zum nächsten if (Alphabet unverändert)
GW2_TEXT = "S → M | U\nM → wenn B dann M sonst M | an | aus\nU → wenn B dann S | wenn B dann M sonst U\nB → h | k"
GW2 = Grammar(GW2_TEXT, nonterminals=['S', 'M', 'U', 'B'], terminals=TW)
L0 = language(GW, 13); L2 = language(GW2, 13)
assert L0 == L2, 'GW2 erzeugt andere Sprache'
assert all(count_leftmost(GW2, list(w)) == 1 for w in L2), 'GW2 mehrdeutig'
print(f'  ✓ wenn-dann-sonst M/U: gleiche Sprache ({len(L2)} Programme bis Länge 13), eindeutig')
data['gw2_rules'] = GW2_TEXT.splitlines()
data['gw2_deriv'] = derivation_steps(GW2, prog, sep=' ')

# ---------------------------------------------------------------------------------------------- Aufgabe 5: Kommentare im Kommentar
TK = ['z', 'n', '//', '(∗', '∗)']
def kom_ok(w):
    depth = 0; line = False
    for x in w:
        if line:
            if x == 'n': line = False
            elif x != 'z': return False
        elif x == '//': line = True
        elif x == '(∗': depth += 1
        elif x == '∗)':
            depth -= 1
            if depth < 0: return False
    return depth == 0 and not line
GKM_TEXT = "S → zS | nS | KS | ZS | ε\nK → (∗S∗)\nZ → //Ln\nL → zL | ε"
GKM = Grammar(GKM_TEXT, nonterminals=['S', 'K', 'Z', 'L'], terminals=TK)
verify(GKM, TK, kom_ok, 7, 'Kommentare', lib_maxlen=5)
ex = ['(∗', 'z', '//', 'z', 'z', 'n', '∗)']
assert GKM.accepts(ex)
data['gkm_rules'] = ["S → zS | nS | KS | ZS | ε", "K → (∗ S ∗)", "Z → // L n", "L → zL | ε"]
data['gkm_deriv'] = derivation_steps(GKM, ex, sep=' ')
render_tree(GKM, ex, IMG + 'baum_kommentar', leaves_bottom=False)
# Kellerautomat für Kommentare (Akzeptanz über Endzustand)
km = PDA(TK, ['#', 'K'], 'S0', {'S2'}, [
    ('S0', '#', 'z', '#', 'S0'), ('S0', 'K', 'z', 'K', 'S0'), ('S0', '#', 'n', '#', 'S0'), ('S0', 'K', 'n', 'K', 'S0'),
    ('S0', '#', '(∗', 'K#', 'S0'), ('S0', 'K', '(∗', 'KK', 'S0'), ('S0', 'K', '∗)', '', 'S0'),
    ('S0', '#', '//', '#', 'S1'), ('S0', 'K', '//', 'K', 'S1'),
    ('S1', '#', 'z', '#', 'S1'), ('S1', 'K', 'z', 'K', 'S1'), ('S1', '#', 'n', '#', 'S0'), ('S1', 'K', 'n', 'K', 'S0'),
    ('S0', '#', EPS, '#', 'S2')])
check(km, predicate=kom_ok, maxlen=6, sigma=TK, name='Kommentar-NKA')
render(km, IMG + 'kommentar_nka', chain=['S0', 'S2'])
data['km_table'] = [list(r) for r in km.search(['(∗', 'z', '(∗', 'n', '∗)', '∗)'])]

# ---------------------------------------------------------------------------------------------- Kellerautomat aⁿbⁿ (Folien/Merkblatt)
anbn = PDA("ab", "A#", "S0", {"S2"}, [
    ("S0", "#", "a", "A#", "S0"), ("S0", "A", "a", "AA", "S0"),
    ("S0", "A", "b", "", "S1"), ("S1", "A", "b", "", "S1"), ("S1", "#", EPS, "#", "S2")])
check(anbn, predicate=lambda w: (n := len(w) // 2) >= 1 and w == "a" * n + "b" * n, maxlen=8, name="anbn-NKA")
render(anbn, IMG + 'anbn_nka', chain=["S0", "S1", "S2"])

save_json(data, IMG + 'data.json')
print('DS13 ok')
