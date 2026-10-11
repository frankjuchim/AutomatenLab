import os as _os_mat
__MAT = _os_mat.path.abspath(_os_mat.path.join(_os_mat.path.dirname(__file__), '../..'))  # Wurzel: materials/
import sys; sys.path.insert(0, (__MAT + '/content/ds07'))
from weltb import *
IMG = (__MAT + '/build/img/ds10/')
OUT = {}


def sequence_of(rows):
    return [(r[0], r[1]) for r in rows]


def words_for_sequence(P, seq, maxdepth=40):
    """Alle Eingabewörter, für die ein Lauf GENAU die Folge (Zustand, Belegung) erzeugt – für Rückwärts-Aufgaben."""
    found = set()
    def dfs(i, conf, word):
        if i == len(seq) - 1:
            found.add(" ".join(word) if any(len(x) > 1 for x in word) else "".join(word)); return
        q, st = conf
        top = st[0] if st else None
        for (p, k, a, z, r) in P.trans:
            if p != q or k != top: continue
            nst = z + st[1:]
            if (r, nst) == seq[i + 1]:
                dfs(i + 1, (r, nst), word + ([] if a == EPS else [a]))
    dfs(0, seq[0], [])
    return found


def guess_table(P, word, sigma_len=1):
    """NKA „Mitte raten“: Für jede Position k (ε-Übergang nach k Zeichen) prüfen, ob der Lauf akzeptiert.
    Simulation erzwingt den ε-Übergang S0→S1 genau nach k gelesenen Zeichen."""
    rows = []
    w = list(word)
    for k in range(len(w) + 1):
        # Konfigurationen deterministisch weiterführen (S0 liest nur, S1 vergleicht)
        q, st, i = "S0", "#", 0
        ok = True; why = ""
        while i < k:
            st = (w[i].upper()) + st; i += 1
        q = "S1"
        while i < len(w):
            if st[0] == w[i].upper(): st = st[1:]; i += 1
            else: ok = False; why = f"{i+1}. Zeichen {w[i]} passt nicht zu {st[0]} oben"; break
        if ok and st[0] != "#": ok = False; why = f"Eingabe gelesen, aber {st[0]} liegt oben"
        if ok: why = "Keller wieder bei #, S2 erreicht"
        rows.append([f"nach {k} Zeichen", "ja" if ok else "nein", why])
    return rows


# ------------------------------------------------------------------ 1) Palindrome w c wᴿ (DKA) und w wᴿ (NKA) – App: palindrom-c / palindrom
pal_push = [("S0", "#", "a", "A#", "S0"), ("S0", "#", "b", "B#", "S0"), ("S0", "A", "a", "AA", "S0"), ("S0", "A", "b", "BA", "S0"), ("S0", "B", "a", "AB", "S0"), ("S0", "B", "b", "BB", "S0")]
pal_pop = [("S1", "A", "a", EPS, "S1"), ("S1", "B", "b", EPS, "S1"), ("S1", "#", EPS, "#", "S2")]
palc = PDA("abc", "#AB", "S0", {"S2"}, pal_push + [("S0", "#", "c", "#", "S1"), ("S0", "A", "c", "A", "S1"), ("S0", "B", "c", "B", "S1")] + pal_pop)
def palc_pred(w):
    i = w.find("c")
    return i >= 0 and w.count("c") == 1 and len(w) == 2 * i + 1 and w == w[::-1]
check(palc, predicate=palc_pred, maxlen=9, name="w c wR")
assert palc.is_deterministic()
render(palc, IMG + 'palindrom_c', ranksep=0.9)
OUT["palc"] = {w: pda_table(palc, w) for w in ["abcba", "abcab", "bacab"]}

pal = PDA("ab", "#AB", "S0", {"S2"}, pal_push + [("S0", "#", EPS, "#", "S1"), ("S0", "A", EPS, "A", "S1"), ("S0", "B", EPS, "B", "S1")] + pal_pop)
pal_pred = lambda w: len(w) % 2 == 0 and w == w[::-1]
check(pal, predicate=pal_pred, maxlen=12, name="w wR")
assert not pal.is_deterministic()
render(pal, IMG + 'palindrom', ranksep=0.9)
OUT["pal"] = {"abba": pda_table(pal, "abba"), "aaaa": pda_table(pal, "aaaa")}
for w in ["abba", "abab", "aaaa"]:
    g = guess_table(pal, w)
    assert any(r[1] == "ja" for r in g) == pal.accepts(w), w
    OUT.setdefault("guess", {})[w] = g
# Rate-Tabellen-Logik für alle Wörter bis Länge 8 gegen den NKA prüfen
for t in words("ab", 8):
    w = "".join(t)
    assert any(r[1] == "ja" for r in guess_table(pal, w)) == pal.accepts(w), w

# ------------------------------------------------------------------ 2) Fall 1: Trainer-Keller (angelehnt Abi 2022 eA C c) – NKA
tr = PDA("310", "#SN", "S0", {"S1"}, [
    ("S0", "#", "3", "S#", "S0"), ("S0", "#", "0", "N#", "S0"), ("S0", "#", "1", "#", "S0"),
    ("S0", "S", "3", "SS", "S0"), ("S0", "S", "0", EPS, "S0"), ("S0", "S", "1", "S", "S0"),
    ("S0", "N", "0", "NN", "S0"), ("S0", "N", "3", EPS, "S0"), ("S0", "N", "1", "N", "S0"),
    ("S0", "N", EPS, "N", "S1")])
tr_pred = lambda w: w.count("0") > w.count("3")
check(tr, predicate=tr_pred, maxlen=9, name="Trainer-Keller")
assert not tr.is_deterministic()
_d = to_dot(tr, ranksep=1.0)
_d = split_loops(_d, "S0", [["(#, 3) : S#", "(#, 0) : N#", "(#, 1) : #", "(N, 0) : NN", "(N, 3) : ε", "(N, 1) : N"], ["(S, 3) : SS", "(S, 0) : ε", "(S, 1) : S"]], ports=("n", "s"))
render(_d, IMG + 'trainer')
tr_word = "30010"
tr_rows = pda_table(tr, tr_word)
OUT["trainer"] = {"table": tr_rows, "seq": sequence_of(tr_rows["rows"])}
cand = words_for_sequence(tr, OUT["trainer"]["seq"])
assert cand == {tr_word}, cand
OUT["trainer"]["unique"] = sorted(cand)

# ------------------------------------------------------------------ 3) Fall 2: Spielfeld mit Seen (angelehnt Abi 2022 Nachschreibtermin eA C) – DKA
BS = "\\"
sf = PDA([BS, "/", "_"], "#T", "S0", {"S0"}, [
    ("S0", "#", "_", "#", "S0"), ("S0", "#", BS, "T#", "S1"),
    ("S1", "T", BS, "TT", "S1"), ("S1", "T", "/", EPS, "S1"), ("S1", "T", "_", "T", "S1"), ("S1", "#", EPS, "#", "S0")])
def sf_pred(w):
    d = 0
    for x in w:
        if x == BS: d += 1
        elif x == "/":
            d -= 1
            if d < 0: return False
    return d == 0
check(sf, predicate=sf_pred, maxlen=9, name="Spielfeld")
assert sf.is_deterministic()
_dot = to_dot(sf, ranksep=0.8).replace(', ' + BS + ')', ', ' + BS + BS + ')')   # Backslash im DOT-Label maskieren
assert (', ' + BS + BS + ')') in _dot
render(_dot, IMG + 'spielfeld')
sf_word = "_" + BS + BS + "_/" + "/_"
sf_rows = pda_table(sf, sf_word)
OUT["spielfeld"] = {"table": sf_rows, "seq": sequence_of(sf_rows["rows"]), "word": sf_word}
cand = words_for_sequence(sf, OUT["spielfeld"]["seq"])
assert cand == {sf_word}, cand
OUT["spielfeld"]["doc"] = pda_table(sf, BS + "_" + BS + "//")
OUT["spielfeld"]["huegel"] = pda_table(sf, "_/" + BS + "_")

# ------------------------------------------------------------------ 4) Fall 3: Prüfnummern Kriterium V (angelehnt Abi 2025 eA B g–h) – DKA mit ε-Abbau
pv = PDA("123-", "#A", "S0", {"S5"}, [
    ("S0", "#", "1", "A#", "S1"), ("S0", "#", "2", "A#", "S1"), ("S0", "#", "3", "A#", "S1"),
    ("S1", "A", "1", "AA", "S1"), ("S1", "A", "2", "AA", "S1"), ("S1", "A", "3", "AA", "S1"),
    ("S1", "A", "-", "A", "S2"),
    ("S2", "A", "1", EPS, "S2"), ("S2", "A", "2", EPS, "S3"), ("S2", "A", "3", EPS, "S4"),
    ("S3", "A", EPS, EPS, "S2"), ("S4", "A", EPS, EPS, "S3"),
    ("S2", "#", EPS, "#", "S5")])
def krit_v(w):
    if w.count("-") != 1: return False
    a, b = w.split("-")
    return len(a) >= 1 and len(b) >= 1 and len(a) == sum(int(c) for c in b)
check(pv, predicate=krit_v, maxlen=8, name="Kriterium V")
assert pv.is_deterministic()
assert krit_v("2131-31") and krit_v("111-21") and not krit_v("12-3")
render(pv, IMG + 'kriterium_v', ranksep=0.8)
OUT["kritv"] = {w: pda_table(pv, w) for w in ["111-21", "12-3", "2131-31"]}

# ------------------------------------------------------------------ 5) Fall 4: Kartoffel-Vorgangsprotokolle (angelehnt Abi 2021 Nachschreibtermin eA E b) – DKA
kp = PDA("12KE", "#er", "S0", {"S4"}, [
    ("S0", "#", EPS, "eeee#", "S1"),
    ("S1", "e", "1", EPS, "S1"), ("S1", "e", "2", EPS, "S2"),
    ("S2", "e", EPS, EPS, "S1"), ("S2", "#", EPS, "r#", "S1"),
    ("S1", "#", "K", "#", "S3"), ("S1", "r", "K", "r", "S3"),
    ("S3", "r", "E", EPS, "S3"), ("S3", "#", EPS, "#", "S4")])
def kart(w, price=4):
    if w.count("K") != 1: return False
    pay, rest = w.split("K")
    if not pay or any(c not in "12" for c in pay): return False
    tot = sum(int(c) for c in pay); before = tot - int(pay[-1])
    return before < price <= tot and rest == "E" * (tot - price)
check(kp, predicate=kart, maxlen=8, name="Kartoffel-Protokolle")
assert kp.is_deterministic()
render(kp, IMG + 'kartoffel_keller', ranksep=0.8)
OUT["kart"] = {w: pda_table(kp, w) for w in ["1112KE", "22K", "212KE", "122KE", "211K"]}

# ------------------------------------------------------------------ 6) Boss-Level B: vereinfachte HTML-Tags
TAGS = ["b", "/b", "i", "/i"]
def tags_ok(w, allowed=("b", "i")):
    st = []
    for x in w:
        if x in allowed: st.append(x)
        elif x.startswith("/") and x[1:] in allowed:
            if not st or st.pop() != x[1:]: return False
        else: return False
    return not st
html = PDA(TAGS, "#BI", "S0", {"S0"}, [
    ("S0", "#", "b", "B#", "S1"), ("S0", "#", "i", "I#", "S1"),
    ("S1", "B", "b", "BB", "S1"), ("S1", "B", "i", "IB", "S1"), ("S1", "I", "b", "BI", "S1"), ("S1", "I", "i", "II", "S1"),
    ("S1", "B", "/b", EPS, "S1"), ("S1", "I", "/i", EPS, "S1"),
    ("S1", "#", EPS, "#", "S0")])
check(html, predicate=lambda w: tags_ok(w), maxlen=8, sigma=TAGS, name="HTML-Tags")
render(html, IMG + 'html', ranksep=0.8)
boss_doc = ["b", "i", "/i", "b", "/b", "/b"]
OUT["boss_doc"] = pda_table(html, boss_doc)
boss_rw = ["i", "b", "/b", "/i", "b", "/b"]
rw = pda_table(html, boss_rw)
OUT["boss_rw"] = {"table": rw, "seq": sequence_of(rw["rows"])}
cand = words_for_sequence(html, OUT["boss_rw"]["seq"])
assert cand == {" ".join(boss_rw)}, cand
OUT["boss_wrong"] = pda_table(html, ["b", "i", "/b", "/i"]) if html.search(["b", "i", "/b", "/i"]) else None
# d) DEA: nur b-Tags, Tiefe ≤ 2
def depth_ok(w, cap=2):
    d = 0
    for x in w:
        d += 1 if x == "b" else -1
        if d < 0 or d > cap: return False
    return d == 0
dea2 = DFA(["b", "/b"], "S0", {"S0"}, {("S0", "b"): "S1", ("S1", "b"): "S2", ("S1", "/b"): "S0", ("S2", "/b"): "S1"})
check(dea2, predicate=depth_ok, maxlen=10, sigma=["b", "/b"], name="Tiefe 2")
render(dea2, IMG + 'boss_dea2')
# e) Schubfach-Zeuge
witness_check(lambda w: tags_ok(w, ("b",)), lambda i: ["b"] * i, lambda i: ["/b"] * i, name="b-Tags")
# f) Erweiterung: u-Tags und br nur direkt in b
EXT = ["b", "/b", "i", "/i", "u", "/u", "br"]
def ext_ok(w):
    st = []
    for x in w:
        if x in ("b", "i", "u"): st.append(x)
        elif x == "br":
            if not st or st[-1] != "b": return False
        elif x.startswith("/"):
            if not st or st.pop() != x[1:]: return False
    return not st
G = {"b": "B", "i": "I", "u": "U"}
tr_ext = [("S0", "#", t, G[t] + "#", "S1") for t in G]
tr_ext += [("S1", G[o], t, G[t] + G[o], "S1") for o in G for t in G]
tr_ext += [("S1", G[t], "/" + t, EPS, "S1") for t in G]
tr_ext += [("S1", "B", "br", "B", "S1"), ("S1", "#", EPS, "#", "S0")]
html2 = PDA(EXT, "#BIU", "S0", {"S0"}, tr_ext)
check(html2, predicate=ext_ok, maxlen=6, sigma=EXT, name="HTML erweitert ≤6")
check(html2, predicate=ext_ok, maxlen=8, sigma=["b", "/b", "u", "/u", "br"], name="HTML erweitert ≤8 (Teilalphabet)")
_d = to_dot(html2, ranksep=0.8)
_d = split_loops(_d, "S1", [["(B, b) : BB", "(B, i) : IB", "(B, u) : UB", "(B, /b) : ε", "(B, br) : B"], ["(I, b) : BI", "(I, i) : II", "(I, u) : UI", "(I, /i) : ε"],
                            ["(U, b) : BU", "(U, i) : IU", "(U, u) : UU", "(U, /u) : ε"]], ports=("n", "s", "e"))
render(_d, IMG + 'html_ext')
# g) Anzahl Kellerinhalte bis Tiefe 10 mit 2 Tag-Sorten → so viele DEA-Zustände (+ Fehlerzustand)
OUT["boss_g"] = sum(2 ** d for d in range(11))
assert OUT["boss_g"] == 2047

witness_check(tr_pred, lambda i: "0" * i, lambda i: "3" * i, name="Trainer kein DEA")
witness_check(sf_pred, lambda i: BS * i, lambda i: "/" * i, name="Spielfeld kein DEA")
witness_check(krit_v, lambda i: "1" * i, lambda i: "-" + "1" * i, name="Kriterium V kein DEA")
OUT["kart"].update({w: pda_table(kp, w) for w in ["1122KE", "122K"]})
OUT["kritv"]["12-3"] = pda_table(pv, "12-3")
for k, v in OUT.items():
    print(k, json.dumps(v, ensure_ascii=False)[:200])
dump(OUT, (__MAT + '/content/ds10/ds10.json'))
print("DS10 ok")
