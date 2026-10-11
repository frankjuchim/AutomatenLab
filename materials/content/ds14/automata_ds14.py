import os as _os_mat
__MAT = _os_mat.path.abspath(_os_mat.path.join(_os_mat.path.dirname(__file__), '../..'))  # Wurzel: materials/
"""DS14 – Level 14 „Die Landkarte der Sprachen“ + Boss-Level C – Verifikation, Grafiken, Lösungsdaten."""
import sys, re
sys.path.insert(0, (__MAT + '/content/ds11'))
from gtools import *
from automata import render, PDA, TEAL, OCKER, INK, GRAY, FONT

IMG = (__MAT + '/build/img/ds14/')
data = {}

# ---------------------------------------------------------------------------------------------- Chomsky-Hierarchie (Mengenbild)
dot = f'''digraph C {{
  bgcolor="transparent"; compound=true; fontname="{FONT}"; margin=0;
  node [shape=plaintext, fontname="{FONT}", fontsize=15, fontcolor="{INK}"];
  subgraph cluster0 {{ label="Typ 0/1 – Turingmaschine (Ausblick)"; labeljust=l; fontsize=17; fontcolor="{GRAY}"; style="rounded"; color="{GRAY}"; penwidth=1.4; margin=14;
    subgraph cluster2 {{ label="Typ 2 – kontextfrei: Kellerautomat (NKA), kontextfreie Grammatik"; labeljust=l; fontsize=17; fontcolor="{OCKER}"; style="rounded,filled"; fillcolor="#FCF6EE"; color="{OCKER}"; penwidth=1.6; margin=14;
      subgraph cluster3 {{ label="Typ 3 – regulär: DEA/NEA, rechtsreguläre Grammatik"; labeljust=l; fontsize=17; fontcolor="{TEAL}"; style="rounded,filled"; fillcolor="#E4F0EE"; color="{TEAL}"; penwidth=1.6; margin=14;
        r1 [label="endet auf ab\\ngerade Anzahl a\\nPaketcodes, Hostnamen"]; }}
      c1 [label="aⁿbⁿ   Palindrome\\nKlammerausdrücke\\nverschachtelte Kommentare"]; }}
    t1 [label="aⁿbⁿcⁿ\\nww"]; }}
  r1 -> c1 -> t1 [style=invis];
}}'''
render_dot(dot, IMG + 'chomsky')

# ---------------------------------------------------------------------------------------------- Begriffsnetz (Musterlösung)
E = [
    ('DEA', 'reguläre Sprachen\\n(Typ 3)', 'erkennt'), ('NEA', 'DEA', 'gleich mächtig wie\\n(Teilmengenkonstruktion)'),
    ('rechtsreguläre\\nGrammatik', 'reguläre Sprachen\\n(Typ 3)', 'erzeugt'), ('rechtsreguläre\\nGrammatik', 'NEA', 'übersetzbar in\\n(Rezept)'),
    ('Mealy-Automat', 'DEA', 'erweitert um\\nAusgabe'), ('Kellerautomat\\n(NKA)', 'DEA', 'erweitert um\\nKeller'),
    ('Kellerautomat\\n(NKA)', 'kontextfreie Sprachen\\n(Typ 2)', 'erkennt'), ('kontextfreie\\nGrammatik', 'kontextfreie Sprachen\\n(Typ 2)', 'erzeugt'),
    ('reguläre Sprachen\\n(Typ 3)', 'kontextfreie Sprachen\\n(Typ 2)', 'Spezialfall von'), ('kontextfreie Sprachen\\n(Typ 2)', 'Typ 1 / Typ 0', 'Spezialfall von'),
    ('Turingmaschine', 'Typ 1 / Typ 0', 'erkennt'), ('endet auf ab', 'reguläre Sprachen\\n(Typ 3)', 'Beispiel für'),
    ('aⁿbⁿ, Palindrome,\\nKlammern', 'kontextfreie Sprachen\\n(Typ 2)', 'Beispiel für'), ('aⁿbⁿcⁿ', 'Typ 1 / Typ 0', 'Beispiel für'),
    ('Schubfachprinzip', 'aⁿbⁿ, Palindrome,\\nKlammern', 'zeigt: nicht\\nregulär'), ('Mehrdeutigkeit', 'kontextfreie\\nGrammatik', 'mögliche\\nEigenschaft'),
    ('Ableitung /\\nAbleitungsbaum', 'kontextfreie\\nGrammatik', 'zeigt, was\\nerzeugt wird'),
]
nodes = sorted({x for e in E for x in e[:2]})
col = {n: (TEAL if 'Sprachen' in n or 'Typ' in n else OCKER if ('Grammatik' in n or 'Ableitung' in n or 'Mehrdeut' in n) else INK) for n in nodes}
lines = ['digraph M {', '  bgcolor="transparent"; rankdir=LR; nodesep=0.12; ranksep=0.45;',
         f'  node [shape=box, style="rounded", fontname="{FONT}", fontsize=21, penwidth=1.6, margin="0.1,0.05"];',
         f'  edge [fontname="{FONT}", fontsize=16, color="{GRAY}", fontcolor="{INK}", arrowsize=0.7];']
for n in nodes:
    fill = '#E4F0EE' if col[n] == TEAL else '#F8ECDB' if col[n] == OCKER else 'white'
    lines.append(f'  "{n}" [color="{col[n]}", style="rounded,filled", fillcolor="{fill}"];')
for a, b, l in E:
    lines.append(f'  "{a}" -> "{b}" [label="{l}"];')
lines.append('  { rank=same; "reguläre Sprachen\\n(Typ 3)"; "kontextfreie Sprachen\\n(Typ 2)"; "Typ 1 / Typ 0"; }')
lines.append('}')
render_dot('\n'.join(lines), IMG + 'begriffsnetz')
data['karten'] = [n.replace('\\n', ' ') for n in nodes] + ['Zustand', 'Endzustand', 'Keller (Γ, #)', 'Nichtterminal', 'Startsymbol', 'Teilmengenkonstruktion']
data['verbindungen'] = sorted({l.replace('\\n', ' ') for _, _, l in E})

# ---------------------------------------------------------------------------------------------- Station 1/3/4: Lagerroboter
SIGL = list("afc")
def lager_ok(w):
    m = re.fullmatch(r'(a*)(f+)(c*)', ''.join(w))
    return bool(m) and len(m.group(1)) == len(m.group(3))
GL_TEXT = "S → aSc | F\nF → fF | f"
GL = Grammar(GL_TEXT)
verify(GL, SIGL, lager_ok, 10, 'Lagerroboter', lib_maxlen=7)
assert not GL.is_right_regular()
data['gl_rules'] = GL_TEXT.splitlines()
for w in ['aaffcc', 'affcc', 'ff', 'acfc']:
    print('  Lager', w, GL.accepts(w))
assert GL.accepts('aaffcc') and not GL.accepts('affcc') and GL.accepts('ff') and not GL.accepts('acfc')
data['gl_deriv_aaffcc'] = derivation_steps(GL, 'aaffcc')
data['gl_deriv_aafcc'] = derivation_steps(GL, 'aafcc')
render_tree(GL, 'aafcc', IMG + 'baum_aafcc')
lag = PDA(SIGL, ['#', 'A'], 'S0', {'S3'}, [
    ('S0', '#', 'a', 'A#', 'S0'), ('S0', 'A', 'a', 'AA', 'S0'),
    ('S0', '#', 'f', '#', 'S1'), ('S0', 'A', 'f', 'A', 'S1'),
    ('S1', '#', 'f', '#', 'S1'), ('S1', 'A', 'f', 'A', 'S1'),
    ('S1', 'A', 'c', '', 'S2'), ('S2', 'A', 'c', '', 'S2'),
    ('S1', '#', EPS, '#', 'S3'), ('S2', '#', EPS, '#', 'S3')])
check(lag, predicate=lambda w: lager_ok(list(w)), maxlen=8, name='Lager-NKA')
render(lag, IMG + 'lager_nka', chain=['S0', 'S1', 'S2', 'S3'])
data['lag_table'] = [list(r) for r in lag.search('aafcc')]
data['lag_table_bad'] = lag.search('afcc')
print('  Kellertabelle aafcc:', data['lag_table'])

# ---------------------------------------------------------------------------------------------- Station 2: Paketcodes
SIGP = list("kgzp")
paket_ok = lambda w: re.fullmatch(r'[kg]zz+p', ''.join(w)) is not None
GPK_TEXT = "S → kA | gA\nA → zB\nB → zC\nC → zC | p"
GPK = Grammar(GPK_TEXT)
assert GPK.is_right_regular()
verify(GPK, SIGP, paket_ok, 8, 'Paketcodes', lib_maxlen=6)
data['gpk_rules'] = GPK_TEXT.splitlines()
data['gpk_deriv'] = derivation_steps(GPK, 'kzzzp')
pn = grammar_to_nfa(GPK, final_name='Z')
fz = lambda *x: frozenset(x)
pd, ps = nfa_to_dfa(pn, names={fz('S'): 'S0', fz('A'): 'S1', fz('B'): 'S2', fz('C'): 'S3', fz('Z'): 'S4'})
check(pd, predicate=lambda w: paket_ok(list(w)), maxlen=7, name='Paket-DEA')
render(pd, IMG + 'paket_dea', chain=['S0', 'S1', 'S2', 'S3', 'S4'])

# ---------------------------------------------------------------------------------------------- Boss-Level C: Bühnenlicht-Skripte
SIGB = list("rgbhd;")
szene = r'[rgb][hd]+;'
b1_ok = lambda w: re.fullmatch(rf'({szene})+', ''.join(w)) is not None
B1_TEXT = "S → rA | gA | bA\nA → hB | dB\nB → hB | dB | ;C\nC → rA | gA | bA | ε"
B1 = Grammar(B1_TEXT)
assert B1.is_right_regular()
verify(B1, SIGB, b1_ok, 7, 'Boss G1', lib_maxlen=5)
data['b1_rules'] = B1_TEXT.splitlines()
for w in ['rhd;bh;', 'gh;;', 'r;h;']:
    print('  Boss G1', w, B1.accepts(w))
assert B1.accepts('rhd;bh;') and not B1.accepts('gh;;') and not B1.accepts('r;h;')
data['b1_deriv'] = derivation_steps(B1, 'rhd;bh;')
bn = grammar_to_nfa(B1)
bd, bs = nfa_to_dfa(bn, names={fz('S'): 'S0', fz('A'): 'S1', fz('B'): 'S2', fz('C'): 'S3'})
check(bd, predicate=lambda w: b1_ok(list(w)), maxlen=7, name='Boss DEA')
render(bd, IMG + 'boss_dea', chain=['S0', 'S1', 'S2', 'S3'])
data['b1_sets'] = bs
# d) höchstens drei Helligkeitsänderungen
b1d_ok = lambda w: re.fullmatch(r'([rgb][hd]{1,3};)+', ''.join(w)) is not None
B1D_TEXT = "S → rA | gA | bA\nA → hB1 | dB1\nB1 → hB2 | dB2 | ;C\nB2 → hB3 | dB3 | ;C\nB3 → ;C\nC → rA | gA | bA | ε"
B1D = Grammar(B1D_TEXT)
assert B1D.is_right_regular()
verify(B1D, SIGB, b1d_ok, 8, 'Boss G1 (max. drei)', lib_maxlen=5)
data['b1d_rules'] = B1D_TEXT.splitlines()
# e)–g) verschachtelte Blöcke
SIGB2 = list("rgbhd;[]")
def b2_ok(w):
    s = ''.join(w); i = 0
    def S():
        nonlocal i
        if not T(): return False
        while i < len(s) and s[i] in 'rgb[':
            if not T(): return False
        return True
    def T():
        nonlocal i
        if i < len(s) and s[i] in 'rgb':
            i += 1; k = i
            while i < len(s) and s[i] in 'hd': i += 1
            if i == k or i >= len(s) or s[i] != ';': return False
            i += 1; return True
        if i < len(s) and s[i] == '[':
            i += 1
            if not S() or i >= len(s) or s[i] != ']': return False
            i += 1; return True
        return False
    return S() and i == len(s)
B2_TEXT = "S → KS | K\nK → FH; | [S]\nF → r | g | b\nH → hH | dH | h | d"
B2 = Grammar(B2_TEXT)
verify(B2, SIGB2, b2_ok, 7, 'Boss G2', lib_maxlen=5)
data['b2_rules'] = B2_TEXT.splitlines()
wex = '[rh;[gd;]]bh;'
assert b2_ok(list(wex)) and B2.accepts(wex)
data['b2_deriv'] = derivation_steps(B2, wex)
render_tree(B2, wex, IMG + 'boss_baum', leaves_bottom=False)
B3 = Grammar("S → SS | K\nK → FH; | [S]\nF → r | g | b\nH → hH | dH | h | d")
assert language(B3, 7) == language(B2, 7)
amb = 'rh;gh;bh;'
assert count_leftmost(B2, amb) == 1 and count_leftmost(B3, amb) == 2
bt = all_leftmost(B3, amb, limit=3)
for i, seq in enumerate(bt):
    render_dot(tree_dot(tree_from_seq(B3, seq), B3, fontsize=17, nodesep=0.12, ranksep=0.32), IMG + f'boss_mehrdeutig_{i + 1}')
data['b3_derivs'] = [[join(f) for f in seq] for seq in bt]
print('  ✓ Boss: S → SS | T mehrdeutig für', amb)

save_json(data, IMG + 'data.json')
print('DS14 ok')
