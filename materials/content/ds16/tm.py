import os as _os_mat
__MAT = _os_mat.path.abspath(_os_mat.path.join(_os_mat.path.dirname(__file__), '../..'))  # Wurzel: materials/
"""Kleiner Turingmaschinen-Simulator für DS16 (automata.py enthält keinen).
Semantik wie in der App (js/engine/turing.js): beidseitig unendliches Band, Blank □, Kopf startet auf dem
ersten Eingabezeichen; gibt es keinen Übergang, hält die Maschine; Halten in einem Endzustand = akzeptiert.
delta: {(zustand, gelesen): (folgezustand, geschrieben, bewegung L|R|N)} – kompatibel mit to_dot(kind='tm')."""
import sys; sys.path.insert(0, (__MAT + '/lib'))
BLANK = "□"


class TM:
    kind = "tm"

    def __init__(self, sigma, start, finals, delta, states=None):
        self.sigma = list(sigma)
        self.start = start
        self.finals = set(finals)
        self.delta = dict(delta)
        st = [start]
        for (p, r), (q, w, m) in self.delta.items():
            assert m in ("L", "R", "N"), f"Bewegung {m!r} ungültig"
            for x in (p, q):
                if x not in st: st.append(x)
        for f in self.finals:
            if f not in st: st.append(f)
        self.states = list(states) if states else st
        self.error_hint = False

    def run(self, word, max_steps=5000):
        """Liefert (konfigurationen, gehalten, akzeptiert, ausgabe).
        konfigurationen: Liste von (zustand, band_dict, kopf, übergang_oder_None)."""
        tape = {i: c for i, c in enumerate(word) if c != BLANK}
        q, head = self.start, 0
        confs = [(q, dict(tape), head, None)]
        halted = False
        for _ in range(max_steps):
            r = tape.get(head, BLANK)
            tr = self.delta.get((q, r))
            if tr is None:
                halted = True; break
            q2, w, m = tr
            if w == BLANK: tape.pop(head, None)
            else: tape[head] = w
            head += 1 if m == "R" else -1 if m == "L" else 0
            confs.append((q2, dict(tape), head, (q, r, q2, w, m)))
            q = q2
        return confs, halted, halted and q in self.finals, self.output(tape)

    @staticmethod
    def output(tape):
        if not tape: return ""
        lo, hi = min(tape), max(tape)
        return "".join(tape.get(i, BLANK) for i in range(lo, hi + 1))

    def accepts(self, word):
        return self.run(word)[2]

    def steps(self, word):
        return len(self.run(word)[0]) - 1

    def ones(self, word=""):
        confs = self.run(word)[0]
        return sum(1 for v in confs[-1][1].values() if v == "1")

    @staticmethod
    def band_str(tape, head, lo=None, hi=None, pad=1):
        """Band als Text, Kopfposition in eckigen Klammern: □ 1 0 [1] 1 □"""
        keys = list(tape.keys()) + [head]
        lo = min(keys) - pad if lo is None else lo
        hi = max(keys) + pad if hi is None else hi
        out = []
        for i in range(lo, hi + 1):
            c = tape.get(i, BLANK)
            out.append(f"[{c}]" if i == head else c)
        return " ".join(out)

    def trace(self, word, pad=1):
        """Zeilen (Schritt, Zustand, Band mit Kopf, Übergang-Text) für Lösungstabellen."""
        confs, halted, acc, out = self.run(word)
        allkeys = [k for c in confs for k in c[1]] + [c[2] for c in confs] + [0, len(word) - 1]
        lo, hi = min(allkeys) - pad, max(allkeys) + pad
        rows = []
        for i, (q, tape, head, tr) in enumerate(confs):
            t = "" if tr is None else f"{tr[1]} / {tr[3]}, {tr[4]}"
            rows.append((i, q, self.band_str(tape, head, lo, hi), t))
        return rows, halted, acc, out


def check_tm(tm, outputs=None, accept=(), reject=(), name=""):
    for w, exp in (outputs or {}).items():
        confs, halted, acc, out = tm.run(w)
        assert halted, f"{name}: {w!r} hält nicht"
        assert out == exp, f"{name}: {w!r} → {out!r}, erwartet {exp!r}"
    for w in accept:
        assert tm.accepts(w), f"{name}: {w!r} sollte akzeptiert werden"
    for w in reject:
        confs, halted, acc, _ = tm.run(w)
        assert halted and not acc, f"{name}: {w!r} sollte abgelehnt werden (hält: {halted})"
    return True
