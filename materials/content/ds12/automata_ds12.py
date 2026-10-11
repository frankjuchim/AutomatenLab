import os as _os_mat
__MAT = _os_mat.path.abspath(_os_mat.path.join(_os_mat.path.dirname(__file__), '../..'))  # Wurzel: materials/
"""DS12 – Level 12 „Grammatik trifft Automat“ – Verifikation, Übersetzungen DEA ↔ Grammatik, Grafiken."""
import sys, re
sys.path.insert(0, (__MAT + '/content/ds11'))
from gtools import *
from automata import render, dfa_equivalent

IMG = (__MAT + '/build/img/ds12/')
data = {}

def dfa_check_grammar(A, g, sigma, maxlen, name):
    """DEA und Grammatik erzeugen/akzeptieren dieselben Wörter (bis maxlen)."""
    L = language(g, maxlen)
    for w in words(sigma, maxlen):
        assert A.accepts(list(w)) == (tuple(w) in L), f"{name}: Unterschied bei {''.join(w)}"
    print(f"  ✓ {name}: DEA und Grammatik stimmen bis Länge {maxlen} überein")

# ---------------------------------------------------------------------------------------------- Einstieg: Übersetzer-Duell
duell = DFA("ab", "S0", {"S2"}, {("S0", "a"): "S1", ("S1", "a"): "S1", ("S1", "b"): "S2", ("S2", "a"): "S1", ("S2", "b"): "S2"})
check(duell, predicate=lambda w: len(w) >= 2 and w[0] == 'a' and w[-1] == 'b', maxlen=8, name="Duell")
render(duell, IMG + 'duell', chain=["S0", "S1", "S2"])
gd_text = dfa_to_grammar_text(duell)
GD = Grammar(gd_text, start="S0")
assert GD.is_right_regular()
verify(GD, 'ab', lambda w: len(w) >= 2 and w[0] == 'a' and w[-1] == 'b', 9, 'Duell-Grammatik', lib_maxlen=6)
data['duell_rules'] = gd_text.splitlines()
data['duell_words'] = {w: duell.accepts(w) for w in ['ab', 'aab', 'abab', 'ba', 'aba', 'abb', 'b', 'aabbab']}
data['duell_deriv_abab'] = derivation_steps(GD, 'abab', sep='')
data['duell_path_abab'] = duell.path_str('abab')

# ---------------------------------------------------------------------------------------------- Aufgabe 1: MähBot
SIGR = list("vdmz#")
def robo_ok(w):
    return re.fullmatch(r'(([vd]z+|m)#)+', ''.join(w)) is not None
d = {("S0", "v"): "S1", ("S0", "d"): "S1", ("S0", "m"): "S3", ("S1", "z"): "S2", ("S2", "z"): "S2", ("S2", "#"): "S4",
     ("S3", "#"): "S4", ("S4", "v"): "S1", ("S4", "d"): "S1", ("S4", "m"): "S3"}
robo = DFA(SIGR, "S0", {"S4"}, d)
check(robo, predicate=robo_ok, maxlen=7, name="MähBot")
render(robo, IMG + 'maehbot', chain=["S0", "S1", "S2", "S4"], ranks=[["S2", "S3"]])
gr_text = dfa_to_grammar_text(robo)
GR = Grammar(gr_text, start="S0")
assert GR.is_right_regular()
verify(GR, SIGR, robo_ok, 7, 'MähBot-Grammatik', lib_maxlen=5)
dfa_check_grammar(robo, GR, SIGR, 7, 'MähBot')
data['robo_rules'] = gr_text.splitlines()
data['robo_deriv'] = derivation_steps(GR, 'vzz#m#', sep='')
data['robo_path'] = robo.path_str('vzz#m#')
data['robo_words'] = {w: robo_ok(list(w)) for w in ['vz#', 'm#dzz#', 'vzz#m#', 'v#', 'mz#', 'dz#m']}

# Erweiterung: nicht geschachtelte Wiederholung w z…( Befehle )
SIGW = list("vdmz#w()")
def robo_w_ok(w):
    cmd = r'(?:[vd]z+|m)#'
    return re.fullmatch(rf'(?:{cmd}|wz+\((?:{cmd})+\))+', ''.join(w)) is not None
GW_TEXT = gr_text.replace("S0 → vS1 | dS1 | mS3", "S0 → vS1 | dS1 | mS3 | wW1").replace("S4 → vS1 | dS1 | mS3 | ε", "S4 → vS1 | dS1 | mS3 | wW1 | ε") + """
W1 → zW2
W2 → zW2 | (B0
B0 → vB1 | dB1 | mB3
B1 → zB2
B2 → zB2 | #B4
B3 → #B4
B4 → vB1 | dB1 | mB3 | )S4"""
GW = Grammar(GW_TEXT, start="S0")
assert GW.is_right_regular()
verify(GW, SIGW, robo_w_ok, 7, 'MähBot mit Wiederholung', lib_maxlen=4)
for w in ['wz(vz#)m#', 'wzz(m#dz#)']:
    assert GW.accepts(w), w
data['robo_w_rules'] = GW_TEXT.splitlines()[-7:]
data['robo_w_deriv'] = derivation_steps(GW, 'wz(m#)', sep='')

# ---------------------------------------------------------------------------------------------- Aufgabe 2: Musik-Takte
SIGM = list("vhgt")
VAL = {'v': 1, 'h': 2, 'g': 4}
def takt_ok(w):
    if not w or w[-1] != 't': return False
    s = 0
    for x in w:
        if x == 't':
            if s != 4: return False
            s = 0
        else:
            s += VAL[x]
            if s > 4: return False
    return s == 0
GM_TEXT = """S → vC | hB | gT
C → vB | hA
B → vA | hT
A → vT
T → t | tS"""
GM = Grammar(GM_TEXT)
assert GM.is_right_regular()
verify(GM, SIGM, takt_ok, 9, 'Musik-Takte', lib_maxlen=6)
data['gm_rules'] = GM_TEXT.splitlines()
for w in ['hvvt', 'vhvt', 'vhht', 'gtvvhtgt']:
    print('  Takt', w, GM.accepts(w))
assert not GM.accepts('vhht')
data['gm_deriv_ex1'] = derivation_steps(GM, 'hvvtgt', sep='')
data['gm_deriv_ex2'] = derivation_steps(GM, 'vhvtgt', sep='')
data['gm_deriv_bad'] = ['S', 'vC', 'vhA']  # Sackgasse, siehe Lösung
assert GM.derive('vhht') is None
nfa = grammar_to_nfa(GM)
check(nfa, predicate=lambda w: takt_ok(list(w)), maxlen=9, name='Musik-NEA')
render(nfa, IMG + 'takt_nea', chain=['S', 'C', 'B', 'A', 'T', 'Z'])
fz = lambda *x: frozenset(x)
dfa, sets = nfa_to_dfa(nfa, names={fz('S'): 'S0', fz('C'): 'S1', fz('B'): 'S2', fz('A'): 'S3', fz('T'): 'S4', fz('S', 'Z'): 'S5'})
check(dfa, predicate=lambda w: takt_ok(list(w)), maxlen=9, name='Musik-DEA')
print('  Teilmengen:', sets)
data['takt_sets'] = sets
render(dfa, IMG + 'takt_dea', chain=['S0', 'S1', 'S2', 'S3', 'S4', 'S5'])
data['takt_dea_table'] = dfa.table()
# punktierte Halbe p (3 Schläge)
SIGP = list("vhgpt"); VAL['p'] = 3
GP_TEXT = """S → vC | hB | gT | pA
C → vB | hA | pT
B → vA | hT
A → vT
T → t | tS"""
GP = Grammar(GP_TEXT)
verify(GP, SIGP, takt_ok, 7, 'Musik mit punktierter Halber', lib_maxlen=5)
data['gp_rules'] = GP_TEXT.splitlines()

# ---------------------------------------------------------------------------------------------- Aufgabe 3: Gäste-WLAN-Codes
SIGC = list("ab12#")
def code_ok(w):
    return len(w) >= 1 and w[-1] == '#' and '#' not in w[:-1] and 'a' in w and '2' in w
GC_TEXT = """S → aA | 2Z | bS | 1S
A → aA | bA | 1A | 2B
Z → 2Z | bZ | 1Z | aB
B → aB | bB | 1B | 2B | #"""
GC = Grammar(GC_TEXT)
assert GC.is_right_regular()
verify(GC, SIGC, code_ok, 6, 'WLAN-Codes', lib_maxlen=4)
data['gc_rules'] = GC_TEXT.splitlines()
data['gc_deriv'] = derivation_steps(GC, 'b2a1#', sep='')
for w in ['a2#', '2ba#', 'b2a1#', 'a1#', '2a#b', '#']:
    print('  Code', w, GC.accepts(w), code_ok(list(w)))
cnfa = grammar_to_nfa(GC, final_name='X')
cdfa, csets = nfa_to_dfa(cnfa)
check(cdfa, predicate=lambda w: code_ok(list(w)), maxlen=6, name='WLAN-DEA')
render(cnfa, IMG + 'codes_nea', ranks=[['A', 'Z']])

# ---------------------------------------------------------------------------------------------- Aufgabe 4: Grammatik vs. Sprache
SIGT = list("xy+-")
def term_ok(w):
    return re.fullmatch(r'[xy]([+-][xy])*', ''.join(w)) is not None
GT_TEXT = "S → xA | yA\nA → +xA | +yA | -xA | -yA | ε"
GT = Grammar(GT_TEXT)
assert not GT.is_right_regular()
verify(GT, SIGT, term_ok, 7, 'Terme (nicht rechtsregulär)', lib_maxlen=5)
GT2_TEXT = "S → xA | yA\nA → +B | -B | ε\nB → xA | yA"
GT2 = Grammar(GT2_TEXT)
assert GT2.is_right_regular()
verify(GT2, SIGT, term_ok, 7, 'Terme (rechtsregulär)', lib_maxlen=5)
data['gt_rules'] = GT_TEXT.splitlines(); data['gt2_rules'] = GT2_TEXT.splitlines()
data['gt_deriv'] = derivation_steps(GT, 'x+y-x', sep='')
assert GT.accepts('x+y-x') and not GT.accepts('x+-y')
tdfa, tsets = nfa_to_dfa(grammar_to_nfa(GT2))
check(tdfa, predicate=lambda w: term_ok(list(w)), maxlen=7, name='Terme-DEA')
render(tdfa, IMG + 'terme_dea', chain=tdfa.states)
data['terme_sets'] = tsets

GL = Grammar("S → Sa | b")
assert not GL.is_right_regular()
verify(GL, 'ab', lambda w: len(w) >= 1 and w[0] == 'b' and all(x == 'a' for x in w[1:]), 8, 'S → Sa | b', lib_maxlen=6)
GL2 = Grammar("S → bA\nA → aA | ε")
assert GL2.is_right_regular()
verify(GL2, 'ab', lambda w: len(w) >= 1 and w[0] == 'b' and all(x == 'a' for x in w[1:]), 8, 'S → bA (rechtsregulär)', lib_maxlen=6)
data['gl_deriv'] = derivation_steps(GL, 'baa', sep='')
GN = Grammar("S → aSb | ab")
assert not GN.is_right_regular()
verify(GN, 'ab', lambda w: (n := len(w) // 2) >= 1 and w == ['a'] * n + ['b'] * n, 10, 'aⁿbⁿ', lib_maxlen=6)

# Merkblatt M09: endet auf ab
GE = Grammar("S → aS | bS | aA\nA → b")
verify(GE, 'ab', lambda w: len(w) >= 2 and w[-2:] == ['a', 'b'], 9, 'endet auf ab', lib_maxlen=6)
enfa = grammar_to_nfa(GE)
render(enfa, IMG + 'endet_ab_nea', chain=['S', 'A', 'Z'])
fz = lambda *x: frozenset(x)
edfa, esets = nfa_to_dfa(enfa, names={fz('S'): 'S0', fz('S', 'A'): 'S1', fz('S', 'Z'): 'S2'})
check(edfa, predicate=lambda w: w.endswith('ab'), maxlen=8, name='endet-ab-DEA')
render(edfa, IMG + 'endet_ab_dea', chain=['S0', 'S1', 'S2'])
data['ge_rules'] = GE.text().splitlines()
data['ge_sets'] = esets

save_json(data, IMG + 'data.json')
print('DS12 ok')
