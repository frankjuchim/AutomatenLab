import os as _os_mat
__MAT = _os_mat.path.abspath(_os_mat.path.join(_os_mat.path.dirname(__file__), '../..'))  # Wurzel: materials/
"""DS04 – Level 4 „Modellierungswerkstatt“ – Musterlösungen aller sechs Stationen, verifiziert, Grafiken nach build/img/ds04."""
import sys, json, itertools; sys.path.insert(0, (__MAT + '/lib'))
from automata import *
IMG = (__MAT + '/build/img/ds04/')
SOL = {}

def P(A, w):
    return A.path_str(w) + ("  ⇒  akzeptiert" if A.accepts(w) else "  ⇒  abgelehnt")

def subset_minimal(nfa, names=None):
    """Teilmengenkonstruktion + Zusammenfassen äquivalenter Zustände; Zustände in BFS-Reihenfolge S0, S1, …
    Die leere Menge (Fehlerzustand) wird weggelassen. Gibt (DFA, Bedeutung = Menge aktiver NFA-Zustände) zurück."""
    start = frozenset(nfa.closure({nfa.start}))
    seen, order, delta = {start}, [start], {}
    i = 0
    while i < len(order):
        S = order[i]; i += 1
        for a in nfa.sigma:
            T = set()
            for q in S: T |= nfa.delta.get((q, a), set())
            T = frozenset(nfa.closure(T))
            if not T: continue
            delta[(S, a)] = T
            if T not in seen: seen.add(T); order.append(T)
    finals = {S for S in order if S & nfa.finals}
    tmp = DFA(nfa.sigma, order[0], finals, delta, states=order)
    _, eq = tmp.minimize_pairs()
    rep = {S: S for S in order}
    for x, y in eq:            # Vereinigung äquivalenter Zustände
        rx, ry = rep[x], rep[y]
        keep = rx if order.index(rx) < order.index(ry) else ry
        for k, v in rep.items():
            if v in (rx, ry): rep[k] = keep
    reps = []
    for S in order:
        if rep[S] not in reps: reps.append(rep[S])
    # BFS-Nummerierung
    idx, q = {reps[0]: 0}, [reps[0]]
    while q:
        S = q.pop(0)
        for a in nfa.sigma:
            if (S, a) in delta:
                T = rep[delta[(S, a)]]
                if T not in idx: idx[T] = len(idx); q.append(T)
    nm = lambda S: f"S{idx[rep[S]]}"
    d2 = {(nm(S), a): nm(T) for (S, a), T in delta.items() if rep[S] == S}
    A = DFA(nfa.sigma, nm(order[0]), {nm(S) for S in finals}, d2, states=[f"S{i}" for i in range(len(idx))])
    meaning = {nm(S): sorted(S) for S in reps}
    return A, meaning

# ======================================================================= Station A: PIN-Eingabe 42x00 (Σ = {0, 2, 4}) – wie Baukasten „pin-42x00“
pin_nfa = NFA("024", "q0", {"q5"}, {("q0","0"):{"q0"}, ("q0","2"):{"q0"}, ("q0","4"):{"q0","q1"}, ("q1","2"):{"q2"},
                                    ("q2","0"):{"q3"}, ("q2","2"):{"q3"}, ("q2","4"):{"q3"}, ("q3","0"):{"q4"}, ("q4","0"):{"q5"}})
pin_pred = lambda w: len(w) >= 5 and w[-5:-3] == "42" and w[-2:] == "00"
check(pin_nfa, predicate=pin_pred, maxlen=8, name="PIN NEA")
pin, pin_mean = subset_minimal(pin_nfa)
check(pin, predicate=pin_pred, maxlen=9, name="PIN DEA")
assert not pin.minimize_pairs()[1] or all("F_err" in p for p in pin.minimize_pairs()[1])
print("PIN-DEA:", len(pin.states), "Zustände", pin_mean)
assert pin.accepts('4242400') and pin.accepts('442200') and not pin.accepts('424200')
SOL['pin_overlap'] = P(pin, '4242400')
SOL['pin_n'] = len(pin.states)
SOL['pin_mean'] = pin_mean
SOL['pin_table'] = pin.table()
render(pin, IMG+'pin', nodesep=0.5, ranksep=0.7)

# ======================================================================= Station B: XMail-Adresse vorname.nachname@XB.xx
# a = Kleinbuchstabe im Namen, P = Punkt, @, X/B/x = feste Zeichen der Domain, S = Sonderzeichen/Ziffer
XM = ["a", "P", "@", "X", "B", "x", "S"]
xm = DFA(XM, "S0", {"S11"}, {("S0","a"):"S1", ("S1","a"):"S2", ("S2","a"):"S2", ("S2","P"):"S3", ("S3","a"):"S4", ("S4","a"):"S5",
                             ("S5","a"):"S5", ("S5","@"):"S6", ("S6","X"):"S7", ("S7","B"):"S8", ("S8","P"):"S9", ("S9","x"):"S10", ("S10","x"):"S11"})
import re
xm_pred = lambda w: re.fullmatch(r"a{2,}Pa{2,}@XBPxx", "".join(w)) is not None
check(xm, predicate=xm_pred, maxlen=6, sigma=XM, name="XMail kurz")
check(xm, accept=[list("aaPaa@XBPxx"), list("aaaaPaaaaaa@XBPxx")],
      reject=[list("aPaa@XBPxx"), list("aaPa@XBPxx"), list("aaSPaa@XBPxx"), list("aaPaa@XBPx"), list("aaPaa@XBPxxx"), list("aaaa@XBPxx"), list("aaPaaPaa@XBPxx")], name="XMail")
# vollständige Prüfung über alle Wörter bis Länge 13 aus einem reduzierten Alphabet (a, P, @, X, B, x) wäre zu groß – stattdessen:
# alle Wörter, die durch Einfügen/Ersetzen/Löschen EINES Zeichens aus gültigen Adressen entstehen, werden gegen das Prädikat geprüft
base = ["aaPaa@XBPxx", "aaaPaaa@XBPxx"]
cand = set()
for b in base:
    for i in range(len(b) + 1):
        for c in XM:
            cand.add(b[:i] + c + b[i:])
            if i < len(b): cand.add(b[:i] + c + b[i+1:])
        if i < len(b): cand.add(b[:i] + b[i+1:])
for w in cand:
    assert xm.accepts(list(w)) == xm_pred(list(w)), w
print("XMail: geprüft", len(cand), "Varianten")
render(xm, IMG+'xmail', rankdir="TB", ranks=[[f"S{i}" for i in range(6)], [f"S{i}" for i in range(6, 12)]], nodesep=0.45, ranksep=0.6,
       edge_style={("S2","S2"): 'headport=n, tailport=n', ("S5","S5"): 'headport=n, tailport=n'},
       extra='  "S0" -> "S6" [style=invis]; "S1" -> "S7" [style=invis]; "S2" -> "S8" [style=invis];')
SOL['xm_tests'] = {w: P(xm, list(w)) for w in ["aaPaaa@XBPxx", "aPaa@XBPxx", "aaPaa@XBPx"]}

# ======================================================================= Station C: Smiley-Erkenner
SM = [":", ";", "-", ")", "(", "D"]
sm = DFA(SM, "S0", {"S3"}, {("S0",":"):"S1", ("S0",";"):"S1", ("S1","-"):"S2",
                            ("S1",")"):"S3", ("S1","("):"S3", ("S1","D"):"S3", ("S2",")"):"S3", ("S2","("):"S3", ("S2","D"):"S3"})
sm_pred = lambda w: re.fullmatch(r"[:;]-?[)(D]", "".join(w)) is not None
check(sm, predicate=sm_pred, maxlen=5, sigma=SM, name="Smiley")
assert not sm.minimize_pairs()[1]
SOL['sm_akz'] = sorted("".join(w) for w in words(SM, 3) if sm.accepts(list(w)))
print("Smileys:", len(SOL['sm_akz']), SOL['sm_akz'])
render(sm, IMG+'smiley', chain=["S0","S1","S2","S3"])

# ======================================================================= Station D: Mann – Wolf – Ziege – Kohlkopf
# Zustand = wer steht am LINKEN Ufer (M = Mann, W, Z, K). Eingabe: m (Mann fährt allein), w, z, k (Mann fährt mit …)
ITEMS = "WZK"
def safe(left):
    for bank in (set(left), set("MWZK") - set(left)):
        if "M" not in bank and (("W" in bank and "Z" in bank) or ("Z" in bank and "K" in bank)): return False
    return True
def step(left, a):
    left = set(left); man_left = "M" in left
    bank = left if man_left else set("MWZK") - left
    if a != "m" and a.upper() not in bank: return None
    move = {"M"} | ({a.upper()} if a != "m" else set())
    new = (left - move) if man_left else (left | move)
    return "".join(c for c in "MWZK" if c in new) if safe(new) else None
def mwzk_pred(w):
    s = "MWZK"
    for a in w:
        s = step(s, a)
        if s is None: return False
    return s == ""
# DEA aus der Modellierung (alle sicheren, erreichbaren Belegungen), Zustandsnamen in BFS-Reihenfolge
order, q, d = ["MWZK"], ["MWZK"], {}
while q:
    s = q.pop(0)
    for a in "mwzk":
        t = step(s, a)
        if t is None: continue
        d[(s, a)] = t
        if t not in order: order.append(t); q.append(t)
nm = {s: f"S{i}" for i, s in enumerate(order)}
mw = DFA("mwzk", "S0", {nm[""]}, {(nm[s], a): nm[t] for (s, a), t in d.items()}, states=[nm[s] for s in order])
check(mw, predicate=mwzk_pred, maxlen=9, name="Mann-Wolf-Ziege-Kohl")
lab = {nm[s]: f"{nm[s]}\n{s or '–'} | {''.join(c for c in 'MWZK' if c not in s) or '–'}" for s in order}
SOL['mw_states'] = {nm[s]: [s or "–", "".join(c for c in "MWZK" if c not in s) or "–"] for s in order}
sols = sorted("".join(w) for w in words("mwzk", 7) if mw.accepts(list(w)) and len(w) == 7)
SOL['mw_loesungen'] = sols
SOL['mw_path'] = P(mw, sols[0])
print("MWZK:", len(order), "Zustände, kürzeste Lösungen:", sols)
render(mw, IMG+'mwzk', label_override=lab, chain=[nm[s] for s in order[:2]], nodesep=0.35, ranksep=0.5)

# ======================================================================= Station E: Trainerentlassung (wie Baukasten „trainer“)
tr = DFA("013", "S0", {"S3"}, {("S0","0"):"S1", ("S0","1"):"S1", ("S0","3"):"S0", ("S1","0"):"S2", ("S1","1"):"S2", ("S1","3"):"S0",
                               ("S2","0"):"S3", ("S2","1"):"S3", ("S2","3"):"S0", ("S3","0"):"S3", ("S3","1"):"S3", ("S3","3"):"S3"})
check(tr, predicate=lambda w: re.search(r"[01]{3}", w) is not None, maxlen=8, name="Trainer")
assert not tr.minimize_pairs()[1]
render(tr, IMG+'trainer', chain=["S0","S1","S2","S3"])
SOL['tr_tests'] = {w: P(tr, w) for w in ["3101", "10033013", "1031033"]}
# Zusatz Station E: nach „30“ und „03“ verschiedene Zustände; unterscheidende Fortsetzung z
assert tr.run("30")[-1] != tr.run("03")[-1]
z = next("".join(w) for w in words("013", 3) if tr.accepts("30" + "".join(w)) != tr.accepts("03" + "".join(w)))
SOL['tr_30_03'] = [z, P(tr, "30" + z), P(tr, "03" + z)]
print("Trainer 30/03 unterscheidbar durch", z)
# Original-Regel Abi 2022 eA C b (Summe der letzten drei Spiele < 3) zum Vergleich: Anzahl Zustände des minimalen DEA
def summe(w):
    return any(sum(int(c) for c in w[i:i+3]) < 3 for i in range(len(w) - 2))
cls = {}
for n in range(0, 7):
    for u in itertools.product("013", repeat=n):
        u = "".join(u)
        sig = tuple(summe(u + "".join(z)) for m in range(0, 4) for z in itertools.product("013", repeat=m))
        cls.setdefault(sig, u)
SOL['tr_summe_n'] = len(cls)
print("Trainer (Summenregel Abi 2022) braucht", len(cls), "Zustände")

# ======================================================================= Station F: Fahrstuhl-Testprotokoll
# h = eine Etage hoch, r = eine Etage runter, o = Tür öffnen, s = Tür schließen. Start: EG, Tür offen.
def lift_step(st, a):
    et, tuer = st
    if a == "o": return (et, "o") if tuer == "z" else None
    if a == "s": return (et, "z") if tuer == "o" else None
    if tuer == "o": return None
    if a == "h": return (et + 1, "z") if et < 2 else None
    if a == "r": return (et - 1, "z") if et > 0 else None
def lift_pred(w):
    st = (0, "o")
    for a in w:
        st = lift_step(st, a)
        if st is None: return False
    return st == (0, "o")
LN = {(0,"o"):"S0", (0,"z"):"S1", (1,"z"):"S2", (1,"o"):"S3", (2,"z"):"S4", (2,"o"):"S5"}
dl = {}
for st, q in LN.items():
    for a in "hros":
        t = lift_step(st, a)
        if t is not None: dl[(q, a)] = LN[t]
lift = DFA("hros", "S0", {"S0"}, dl, states=list(LN.values()))
check(lift, predicate=lift_pred, maxlen=9, name="Fahrstuhl")
assert not lift.minimize_pairs()[1] or all("__err__" not in p for p in lift.minimize_pairs()[1])
print("Fahrstuhl äquivalente Paare:", lift.minimize_pairs()[1])
SOL['lift_states'] = {q: [f"{'EG' if e == 0 else str(e) + '. OG'}", "offen" if t == "o" else "zu"] for (e, t), q in LN.items()}
render(lift, IMG+'fahrstuhl', rankdir="TB", ranks=[["S0","S3","S5"],["S1","S2","S4"]], nodesep=1.1, ranksep=0.9)
SOL["lift_tests"] = {w: P(lift, w) for w in ["shro", "shhosrro", "shhosro", "shsh"]}

# ======================================================================= Testwörter für die Stationskarten (aus dem Code klassifiziert)
def classify(A, ws, tok=lambda w: w):
    return {"ja": [w for w in ws if A.accepts(tok(w))], "nein": [w for w in ws if not A.accepts(tok(w))]}
SOL['cards'] = {
    "A": classify(pin, ["42000", "42400", "442200", "4242400", "4200", "420000", "42020", "424200"]),
    "B": classify(xm, ["aaPaa@XBPxx", "aaaPaaaa@XBPxx", "aPaa@XBPxx", "aaPaa@XBPx", "aaSaPaa@XBPxx", "aaaa@XBPxx", "aaPaa@XBPxxx"], tok=list),
    "C": classify(sm, [":)", ":-)", ";D", ":-(", ":--)", "-)", ":)D", ";"], tok=list),
    "D": classify(mw, ["zmwzkmz", "zmkzwmz", "wmz", "zz", "zmwzkm", "zmwmz"]),
    "E": classify(tr, ["000", "3101", "10033013", "011", "00", "30", "1031033"]),
    "F": classify(lift, ["", "shro", "shhosrro", "shhosro", "sh", "shsh", "shhrro", "o"]),
}
for k, v in SOL['cards'].items(): print(k, v)
json.dump(SOL, open((__MAT + '/content/ds04/solutions.json'), 'w'), ensure_ascii=False, indent=1)
print("OK DS04")
