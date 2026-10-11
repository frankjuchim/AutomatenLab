import os as _os_mat
__MAT = _os_mat.path.abspath(_os_mat.path.join(_os_mat.path.dirname(__file__), '../..'))  # Wurzel: materials/
"""DS16 – Ausblick Turingmaschine: Maschinen definieren, verifizieren, rendern; Band-Grafiken erzeugen."""
import sys, os; sys.path.insert(0, (__MAT + '/lib')); sys.path.insert(0, os.path.dirname(__file__))
from automata import *
from tm import TM, BLANK, check_tm
from PIL import Image, ImageDraw, ImageFont
IMG = (__MAT + '/build/img/ds16/')
os.makedirs(IMG, exist_ok=True)

# ---------------------------------------------------------------------------------------------
# 1) Binärzahl + 1 (identisch mit App-Programm binaer-plus-1)
binplus = TM("01", "S0", {"S2"}, {
    ("S0", "0"): ("S0", "0", "R"), ("S0", "1"): ("S0", "1", "R"), ("S0", BLANK): ("S1", BLANK, "L"),
    ("S1", "1"): ("S1", "0", "L"), ("S1", "0"): ("S2", "1", "N"), ("S1", BLANK): ("S2", "1", "N"),
})
check_tm(binplus, outputs={"1011": "1100", "111": "1000", "0": "1", "1111": "10000", "10": "11", "1001": "1010", "": "1"}, name="Binär+1")
# allgemeiner Test: alle Binärzahlen bis 6 Bit
for n in range(64):
    b = format(n, "b")
    confs, halted, acc, out = binplus.run(b)
    assert halted and acc and out == format(n + 1, "b"), (b, out)
print("Binär+1 ok")
render(binplus, IMG + "tm_binplus", chain=["S0", "S1", "S2"], nodesep=0.7, ranksep=1.1)

# 2) aⁿbⁿcⁿ (identisch mit App-Programm anbncn)
anbncn = TM("abc", "S0", {"S5"}, {
    ("S0", "a"): ("S1", "X", "R"), ("S0", "Y"): ("S4", "Y", "R"),
    ("S1", "a"): ("S1", "a", "R"), ("S1", "Y"): ("S1", "Y", "R"), ("S1", "b"): ("S2", "Y", "R"),
    ("S2", "b"): ("S2", "b", "R"), ("S2", "Z"): ("S2", "Z", "R"), ("S2", "c"): ("S3", "Z", "L"),
    ("S3", "a"): ("S3", "a", "L"), ("S3", "b"): ("S3", "b", "L"), ("S3", "Y"): ("S3", "Y", "L"), ("S3", "Z"): ("S3", "Z", "L"), ("S3", "X"): ("S0", "X", "R"),
    ("S4", "Y"): ("S4", "Y", "R"), ("S4", "Z"): ("S4", "Z", "R"), ("S4", BLANK): ("S5", BLANK, "N"),
})
def is_anbncn(w):
    n = len(w) // 3
    return n >= 1 and w == "a" * n + "b" * n + "c" * n
for w in words("abc", 7):
    w = "".join(w)
    confs, halted, acc, out = anbncn.run(w)
    assert halted, w
    assert acc == is_anbncn(w), (w, acc)
print("aⁿbⁿcⁿ ok (alle Wörter bis Länge 7)")
render(anbncn, IMG + "tm_anbncn", chain=["S0", "S1", "S2", "S3"], ranks=[["S1", "S4"], ["S3", "S5"]], nodesep=0.6, ranksep=1.0, edge_style={("S0", "S4"): "minlen=2"})

# 3) Fleißiger Biber mit 2 Zuständen (App: biber-2): 4 Einsen in 6 Schritten
biber2 = TM("1", "A", {"H"}, {
    ("A", BLANK): ("B", "1", "R"), ("A", "1"): ("B", "1", "L"),
    ("B", BLANK): ("A", "1", "L"), ("B", "1"): ("H", "1", "R"),
})
assert biber2.ones() == 4 and biber2.steps("") == 6, (biber2.ones(), biber2.steps(""))
print("Biber-2 ok: 4 Einsen, 6 Schritte")
render(biber2, IMG + "tm_biber2", chain=["A", "B", "H"], nodesep=0.7, ranksep=1.1)
# Rätsel-Variante „Biber-Kandidat“ (falscher Kandidat für das Rätsel): hält nach 2 Einsen
kandidat = TM("1", "A", {"H"}, {
    ("A", BLANK): ("B", "1", "R"), ("A", "1"): ("H", "1", "N"),
    ("B", BLANK): ("A", "1", "L"), ("B", "1"): ("B", "1", "R"),
})
print("Kandidat:", kandidat.ones(), "Einsen,", kandidat.steps(""), "Schritte")
render("""digraph G {
  layout=neato; bgcolor="transparent"; splines=true;
  node [shape=circle, fontname="Calibri", fontsize=15, color="#1F2A2E", fontcolor="#1F2A2E", penwidth=1.6, width=0.55, margin=0.04];
  edge [fontname="Calibri", fontsize=13, color="#1F2A2E", fontcolor="#1F2A2E", penwidth=1.3, arrowsize=0.75];
  __start [shape=plaintext, label="Start", fontsize=14, pos="0,1.4!"];
  A [pos="1.3,1.4!"]; B [pos="3.6,1.4!"]; H [shape=doublecircle, pos="3.6,0!"];
  __start -> A;
  A -> B [label="□ / 1, R", tailport=ne, headport=nw];
  B -> A [label="□ / 1, L", tailport=sw, headport=se];
  B -> B [label="1 / 1, R", headport=n, tailport=n];
  A -> H;
  l1 [shape=plaintext, label="1 / 1, N", fontsize=13, width=0, height=0, margin=0, pos="1.75,0.55!"];
}""", IMG + "tm_kandidat")

# 4) Unärer Addierer (Lösung Profi-Aufgabe; App: unaer-plus, challenge=2)
unaer = TM("1+", "S0", {"S3"}, {
    ("S0", "1"): ("S0", "1", "R"), ("S0", "+"): ("S1", "1", "R"),
    ("S1", "1"): ("S1", "1", "R"), ("S1", BLANK): ("S2", BLANK, "L"),
    ("S2", "1"): ("S3", BLANK, "N"),
})
check_tm(unaer, outputs={"111+11": "11111", "1+1": "11", "1111+": "1111", "+111": "111", "11+111": "11111"}, name="Unär+")
print("Unärer Addierer ok")
render(unaer, IMG + "tm_unaer", chain=["S0", "S1", "S2", "S3"], nodesep=0.7, ranksep=1.1)

# 5) Basis-Aufgabe: „Alle a durch b ersetzen“ (Lösung)
ersetzer = TM("ab", "S0", {"S1"}, {
    ("S0", "a"): ("S0", "b", "R"), ("S0", "b"): ("S0", "b", "R"), ("S0", BLANK): ("S1", BLANK, "N"),
})
check_tm(ersetzer, outputs={"abab": "bbbb", "aaa": "bbb", "b": "b"}, name="Ersetzer")
render(ersetzer, IMG + "tm_ersetzer", chain=["S0", "S1"], nodesep=0.7, ranksep=1.1)

# Lösungs-Traces
for w in ["1011", "111"]:
    rows, halted, acc, out = binplus.trace(w)
    print(f"--- Binär+1, Eingabe {w} → {out} ({len(rows)-1} Schritte)")
    for r in rows: print("   ", r)
rows, halted, acc, out = anbncn.trace("aabbcc")
print(f"--- anbncn aabbcc: {len(rows)-1} Schritte, akzeptiert={acc}")
for r in rows[:14]: print("   ", r)
rows, halted, acc, out = anbncn.trace("aabbc")
print(f"--- anbncn aabbc: {len(rows)-1} Schritte, akzeptiert={acc}, Endzustand {rows[-1][1]}")
rows, halted, acc, out = biber2.trace("")
print("--- Biber 2:")
for r in rows: print("   ", r)
rows, halted, acc, out = unaer.trace("111+11")
print("--- Unär 111+11:")
for r in rows: print("   ", r)

# ---------------------------------------------------------------------------------------------
# Band-Grafiken (PIL): Band mit Zellen, Schreib-Lese-Kopf, Zustandsanzeige
FONT = "/usr/share/fonts/truetype/crosextra/Carlito-Regular.ttf"
FONTB = "/usr/share/fonts/truetype/crosextra/Carlito-Bold.ttf"
INKc = (31, 42, 46); TEALc = (14, 100, 85); OCKERc = (178, 106, 15); GRAYc = (160, 172, 176); TINT = (246, 231, 207)

def band_png(path, cells, head, state=None, label=None, cell=110, scale=1, highlight=None, show_index=False):
    n = len(cells); W = n * cell + 40; H = 320 if state else 250
    im = Image.new("RGBA", (W, H), (255, 255, 255, 0)); d = ImageDraw.Draw(im)
    f = ImageFont.truetype(FONT, 46); fs = ImageFont.truetype(FONT, 26); fb = ImageFont.truetype(FONTB, 30)
    y0 = 110 if state else 40
    for i, c in enumerate(cells):
        x = 20 + i * cell
        fill = TINT if (highlight is not None and i in highlight) else (255, 255, 255, 255)
        d.rectangle([x, y0, x + cell, y0 + cell], fill=fill, outline=INKc, width=3)
        txt = c
        col = GRAYc if c == BLANK else INKc
        bb = d.textbbox((0, 0), txt, font=f)
        d.text((x + cell / 2 - (bb[2] - bb[0]) / 2 - bb[0], y0 + cell / 2 - (bb[3] - bb[1]) / 2 - bb[1]), txt, font=f, fill=col)
        if show_index:
            d.text((x + 6, y0 + cell + 4), str(i), font=fs, fill=GRAYc)
    # Band läuft weiter: Punkte links/rechts
    d.text((2, y0 + cell / 2 - 20), "…", font=f, fill=GRAYc); d.text((W - 26, y0 + cell / 2 - 20), "…", font=f, fill=GRAYc)
    # Kopf: Dreieck + Rechteck unterhalb
    hx = 20 + head * cell + cell / 2
    yk = y0 + cell + 8
    d.polygon([(hx - 22, yk + 30), (hx + 22, yk + 30), (hx, yk + 4)], fill=OCKERc)
    d.rounded_rectangle([hx - 70, yk + 30, hx + 70, yk + 78], radius=10, fill=OCKERc)
    t = "Kopf" if not label else label
    bb = d.textbbox((0, 0), t, font=fb)
    d.text((hx - (bb[2] - bb[0]) / 2 - bb[0], yk + 54 - (bb[3] - bb[1]) / 2 - bb[1]), t, font=fb, fill=(255, 255, 255))
    if state:
        d.rounded_rectangle([hx - 90, 20, hx + 90, 90], radius=14, fill=TEALc)
        bb = d.textbbox((0, 0), state, font=fb)
        d.text((hx - (bb[2] - bb[0]) / 2 - bb[0], 55 - (bb[3] - bb[1]) / 2 - bb[1]), state, font=fb, fill=(255, 255, 255))
        d.line([(hx, 90), (hx, y0 - 2)], fill=TEALc, width=3)
    im.save(path)
    return path

band_png(IMG + "band_aufbau.png", [BLANK, "1", "0", "1", "1", BLANK, BLANK], 1, state="Zustand S0", label="liest 1")
band_png(IMG + "band_1011_start.png", [BLANK, "1", "0", "1", "1", BLANK], 1, state="S0")
band_png(IMG + "band_1011_ende.png", [BLANK, "1", "1", "0", "0", BLANK], 2, state="S2 (hält)")
band_png(IMG + "band_anbncn.png", [BLANK, "X", "a", "Y", "b", "Z", "c", BLANK], 2, state="S0", highlight={1, 3, 5})
band_png(IMG + "band_leer.png", [BLANK] * 7, 3, state="A")
band_png(IMG + "band_biber_ende.png", [BLANK, "1", "1", "1", "1", BLANK], 4, state="H (hält)")
print("Band-Grafiken erzeugt")

# ---------------------------------------------------------------------------------------------
# Traces als JSON für die Build-Skripte (Lösungen werden aus dem Simulator erzeugt)
import json
def tr(tm, w, maxrows=None):
    rows, halted, acc, out = tm.trace(w)
    return {"rows": [[str(i), q, band, t] for i, q, band, t in rows][: (maxrows or len(rows))], "steps": len(rows) - 1, "halted": halted, "accepted": acc, "output": out}
json.dump({
    "bin_1011": tr(binplus, "1011"), "bin_111": tr(binplus, "111"), "bin_1101": tr(binplus, "1101"),
    "anbncn_aabbcc": tr(anbncn, "aabbcc"), "anbncn_aabbc": tr(anbncn, "aabbc"), "anbncn_abc": tr(anbncn, "abc"),
    "biber2": tr(biber2, ""), "kandidat": tr(kandidat, ""), "unaer": tr(unaer, "111+11"), "ersetzer": tr(ersetzer, "abab"),
    "binplus_table": [[q] + [(" / ".join([binplus.delta[(q, a)][1], binplus.delta[(q, a)][2]]) + " → " + binplus.delta[(q, a)][0]) if (q, a) in binplus.delta else "–" for a in ["0", "1", BLANK]] for q in binplus.states],
}, open(IMG + "traces.json", "w"), ensure_ascii=False, indent=1)
print("traces.json geschrieben")
