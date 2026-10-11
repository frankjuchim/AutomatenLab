import os as _os_mat
__MAT = _os_mat.path.abspath(_os_mat.path.join(_os_mat.path.dirname(__file__), '../..'))  # Wurzel: materials/
"""DS11 – Level 11 „Sprache – natürlich oder formal?“ – Verifikation aller Grammatiken, Ableitungen, Bäume."""
import sys, itertools
sys.path.insert(0, (__MAT + '/content/ds11'))
from gtools import *

IMG = (__MAT + '/build/img/ds11/')
data = {}

# ---------------------------------------------------------------------------------------------- G1 Mini-Deutsch
ART = ['Der', 'Die', 'Das']
NOM = {'Hund': 'Der', 'Igel': 'Der', 'Katze': 'Die', 'Ziege': 'Die', 'Pferd': 'Das', 'Schaf': 'Das'}
VERB = ['frisst', 'knabbert', 'trinkt', 'liest']
OBJ = ['Wasser', 'Möhren', 'Äpfel', 'Zeitung']
T1 = ART + list(NOM) + VERB + OBJ + ['.']
N1 = ['Start', 'Subjekt', 'Prädikat', 'Objekt', 'Punkt', 'Artikel', 'Nomen']
G1_RULES = """Start → Subjekt Prädikat Objekt Punkt | Subjekt Prädikat Punkt
Subjekt → Artikel Nomen
Artikel → Der | Die | Das
Nomen → Hund | Igel | Katze | Ziege | Pferd | Schaf
Prädikat → frisst | knabbert | trinkt | liest
Objekt → Wasser | Möhren | Äpfel | Zeitung
Punkt → ."""
G1 = Grammar(G1_RULES, start='Start', nonterminals=N1, terminals=T1)
exp_all = {tuple([a, n, v] + o + ['.']) for a in ART for n in NOM for v in VERB for o in ([[x] for x in OBJ] + [[]])}
assert language(G1, 5) == exp_all, "G1: Sprache weicht ab"
print(f"  ✓ G1: genau {len(exp_all)} Sätze")
s_ok = 'Die Ziege trinkt Wasser .'.split()
s_bad = ['Die Igel knabbert Möhren .'.split(), 'Das Hund liest .'.split(), 'Der Katze frisst Zeitung .'.split()]
check(type('W', (), {'sigma': T1, 'accepts': lambda s, w: G1.accepts(list(w))})(),
      accept=[s_ok, 'Die Igel knabbert Möhren .'.split(), 'Das Schaf trinkt Zeitung .'.split()],
      reject=['Die Ziege trinkt Wasser'.split(), 'Ziege Die trinkt Wasser .'.split(), 'Die Ziege Wasser .'.split()], name='G1')
data['g1_rules'] = G1_RULES.splitlines()
data['g1_deriv'] = derivation_steps(G1, s_ok, sep=' ')
render_tree(G1, s_ok, IMG + 'baum_ziege')
s_folie = 'Das Schaf frisst Möhren .'.split()
data['g1_folie_deriv'] = derivation_steps(G1, s_folie, sep=' ')
render_tree(G1, s_folie, IMG + 'baum_schaf')
data['g1_folie_rules'] = derivation_rules(G1, s_folie, sep=' ')
ok_genus = lambda w: NOM.get(w[1]) == w[0]
bad = [w for w in exp_all if not ok_genus(w)]
print(f"  G1: {len(bad)} von {len(exp_all)} Sätzen verletzen die Genus-Kongruenz")
data['g1_counts'] = {'alle': len(exp_all), 'falsch': len(bad), 'richtig': len(exp_all) - len(bad)}

# ---------------------------------------------------------------------------------------------- G1' korrigiert
G1K_RULES = """Start → Subjekt Prädikat Objekt Punkt | Subjekt Prädikat Punkt
Subjekt → Der NomenM | Die NomenF | Das NomenN
NomenM → Hund | Igel
NomenF → Katze | Ziege
NomenN → Pferd | Schaf
Prädikat → frisst | knabbert | trinkt | liest
Objekt → Wasser | Möhren | Äpfel | Zeitung
Punkt → ."""
N1K = ['Start', 'Subjekt', 'Prädikat', 'Objekt', 'Punkt', 'NomenM', 'NomenF', 'NomenN']
G1K = Grammar(G1K_RULES, start='Start', nonterminals=N1K, terminals=T1)
LK = language(G1K, 5)
assert LK == {w for w in exp_all if ok_genus(w)}, "G1': nicht genau die genus-korrekten Sätze"
print(f"  ✓ G1': genau die {len(LK)} genus-korrekten Sätze")
data['g1k_rules'] = G1K_RULES.splitlines()
data['g1k_deriv'] = derivation_steps(G1K, s_ok, sep=' ')
render_tree(G1K, s_ok, IMG + 'baum_ziege_korrigiert')

# ---------------------------------------------------------------------------------------------- G2 Glal
G2_RULES = "S → laA | leA | luA\nA → laB | leB | luB\nB → lu"
G2 = Grammar(G2_RULES, terminals=['la', 'le', 'lu'])
SIG = ['la', 'le', 'lu']
verify(G2, SIG, lambda w: len(w) == 3 and w[-1] == 'lu', 5, 'G2 Glal', lib_maxlen=4)
assert G2.is_right_regular()
data['g2_rules'] = G2_RULES.splitlines()
data['g2_words'] = sorted(''.join(w) for w in language(G2, 5))
data['g2_deriv_lulelu'] = derivation_steps(G2, ['lu', 'le', 'lu'], sep='')
data['g2_deriv_lelalu'] = derivation_steps(G2, ['le', 'la', 'lu'], sep='')
for w in [['lu', 'la', 'lu'], ['la', 'lu', 'le'], ['la', 'la', 'la', 'lu']]:
    print('  Glal', ''.join(w), G2.accepts(w))
assert G2.accepts(['lu', 'la', 'lu']) and not G2.accepts(['la', 'lu', 'le']) and not G2.accepts(['la', 'la', 'la', 'lu'])
data['g2_deriv_lulalu'] = derivation_steps(G2, ['lu', 'la', 'lu'], sep='')
render_tree(G2, ['le', 'la', 'lu'], IMG + 'baum_glal')
data['g2_rules_lelalu'] = derivation_rules(G2, ['le', 'la', 'lu'], sep='')
render_tree(G2, ['lu', 'le', 'lu'], IMG + 'baum_glal_lulelu')

# Glal unendlich (Profi)
G2U = Grammar("S → laS | leS | luS | lu", terminals=SIG)
verify(G2U, SIG, lambda w: len(w) >= 1 and w[-1] == 'lu', 6, 'Glal beliebig', lib_maxlen=4)
data['g2u_deriv'] = derivation_steps(G2U, ['la', 'la', 'le', 'lu'], sep='')

# ---------------------------------------------------------------------------------------------- Aufgabe 5: Sprache beschreiben
G4 = Grammar("S → aS | bS | b")
verify(G4, 'ab', lambda w: len(w) >= 1 and w[-1] == 'b', 9, 'G4 endet auf b', lib_maxlen=7)
G5 = Grammar("S → aSa | b")
verify(G5, 'ab', lambda w: (n := len(w) // 2) >= 0 and len(w) % 2 == 1 and w == ['a'] * n + ['b'] + ['a'] * n, 11, 'G5 a^n b a^n', lib_maxlen=7)
G6 = Grammar("S → aT | bT | ε\nT → aS | bS")
verify(G6, 'ab', lambda w: len(w) % 2 == 0, 8, 'G6 gerade Länge', lib_maxlen=6)
data['g4_deriv'] = derivation_steps(G4, 'abab')
data['g5_deriv'] = derivation_steps(G5, 'aabaa')
data['g6_deriv'] = derivation_steps(G6, 'abba')
render_tree(G5, 'aabaa', IMG + 'baum_g5')
for w in ['ab', 'b', 'aaa', 'bba']:
    print('  G4', w, G4.accepts(w))
for w in ['aba', 'aabaa', 'ab', 'abaa']:
    print('  G5', w, G5.accepts(w))

save_json(data, IMG + 'data.json')
print('DS11 ok')
