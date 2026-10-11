// „Überliste den Automaten“ (#/ueberliste): Grenzen endlicher Automaten (DS07).
// Jede Stufe beschreibt eine NICHT-reguläre Sprache und baut dazu einen „bestmöglichen“ DEA mit k Zuständen:
// Er zählt korrekt bis zu einer Kapazität c und sättigt dann (bleibt im letzten Zählzustand).
// Dadurch irrt er sich genau bei Wörtern, die „weiter zählen“ als c. Deep-Link: #/ueberliste?stufe=n
//
//   id, titel, kontext     Anzeige
//   sprache                Beschreibung der behaupteten Sprache (für die Karte)
//   alphabet               Σ
//   kapazitaet             c (Zählgrenze) → k = Zustandsanzahl (ohne Fehlerzustand)
//   bau(c)                 erzeugt den DEA (Engine-Format)
//   pruefe(tokens)         Referenz: gehört das Wort wirklich zur Sprache?
//   tipps                  gestufte Hinweise (allgemein → konkret)
//   praefix                Symbol, mit dem die Präfixe a, aa, aaa … gebildet werden (Schubfachargument)
//   fortsetzung            Symbol für die Fortsetzung bⁱ
//   punkte                 Punkte bei Sieg ohne Tipps (jeder Tipp kostet etwas)

const count = (w, s) => w.filter((x) => x === s).length;

/** aⁿbⁿ-Zähler: S0 = Start, A1…Ac = i a gelesen, B(c-1)…B1 = noch j b nötig, B0 = fertig (Endzustand). k = 2c + 1 */
function bauAnBn(c, a = 'a', b = 'b') {
  const delta = {};
  const A = (i) => (i === 0 ? 'S0' : `A${i}`);
  const B = (j) => `B${j}`;
  delta.S0 = { [a]: A(1) };
  for (let i = 1; i <= c; i++) delta[A(i)] = { [a]: A(Math.min(i + 1, c)), [b]: i === 1 ? B(0) : B(i - 1) };
  for (let j = 1; j < c; j++) delta[B(j)] = { [b]: B(j - 1) };
  delta[B(0)] = {};
  return { alphabet: [a, b], start: 'S0', accepting: [B(0)], implicitError: true, delta };
}

/** Klammer-Tiefenzähler: D0 … Dc; „(“ erhöht (sättigt bei c), „)“ verringert; D0 Endzustand. k = c + 1 */
function bauKlammern(c, auf = '(', zu = ')') {
  const delta = {};
  const D = (i) => (i === 0 ? 'S0' : `S${i}`);
  for (let i = 0; i <= c; i++) {
    delta[D(i)] = { [auf]: D(Math.min(i + 1, c)) };
    if (i > 0) delta[D(i)][zu] = D(i - 1);
  }
  return { alphabet: [auf, zu], start: 'S0', accepting: ['S0'], implicitError: true, delta };
}

/** Bilanzzähler (Türsteher): Zustände für Bilanz −c … +c (sättigend); Endzustand = Bilanz 0. k = 2c + 1 */
function bauBilanz(c, plus = 'E', minus = 'A') {
  const delta = {};
  const name = (d) => (d === 0 ? 'S0' : d > 0 ? `P${d}` : `M${-d}`);
  for (let d = -c; d <= c; d++) delta[name(d)] = { [plus]: name(Math.min(d + 1, c)), [minus]: name(Math.max(d - 1, -c)) };
  return { alphabet: [plus, minus], start: 'S0', accepting: ['S0'], implicitError: false, delta };
}

const pruefeAnBn = (w) => { const n = count(w, 'a'); return n >= 1 && w.length === 2 * n && w.slice(0, n).every((x) => x === 'a'); };
const pruefeKlammern = (w) => { let d = 0; for (const x of w) { d += x === '(' ? 1 : -1; if (d < 0) return false; } return d === 0; };
const pruefeBilanz = (w) => count(w, 'E') === count(w, 'A');

const TIPPS_ANBN = (c) => [
  'Der Automat hat nur endlich viele Zustände – aber die Sprache verlangt, beliebig weit zu zählen. Suche ein Wort, bei dem er „den Überblick verliert“.',
  'Lass dir den Zustand nach jedem Präfix anzeigen und lies a, aa, aaa, … Irgendwann landen zwei verschiedene Präfixe im selben Zustand (Schubfachprinzip).',
  'Zwei Präfixe aⁱ und aʲ im selben Zustand kann der Automat nie mehr auseinanderhalten. Hänge an beide dieselbe Fortsetzung bⁱ an: Eines der Wörter gehört zur Sprache, das andere nicht – der Automat antwortet aber gleich.',
  `Konkret: Probiere ${'a'.repeat(c + 1)}${'b'.repeat(c)} oder ${'a'.repeat(c + 1)}${'b'.repeat(c + 1)}.`,
];

export const UEBERLISTE_STUFEN = [
  {
    id: 'anbn-klein', titel: 'Der Zähler', kontext: 'Ein Automat behauptet, genau die Wörter aⁿbⁿ (n ≥ 1) zu erkennen – erst n-mal a, dann n-mal b.',
    sprache: 'L = {aⁿbⁿ | n ≥ 1}', alphabet: ['a', 'b'], kapazitaet: 2, bau: bauAnBn, pruefe: pruefeAnBn,
    praefix: 'a', fortsetzung: 'b', tipps: TIPPS_ANBN(2), punkte: 30,
  },
  {
    id: 'anbn-mittel', titel: 'Der bessere Zähler', kontext: 'Dieser Automat hat mehr Zustände und zählt weiter – aber immer noch nicht unbegrenzt.',
    sprache: 'L = {aⁿbⁿ | n ≥ 1}', alphabet: ['a', 'b'], kapazitaet: 4, bau: bauAnBn, pruefe: pruefeAnBn,
    praefix: 'a', fortsetzung: 'b', tipps: TIPPS_ANBN(4), punkte: 40,
  },
  {
    id: 'klammern', titel: 'Der Klammer-Prüfer', kontext: 'Ein Automat behauptet, korrekt geklammerte Ausdrücke über { (, ) } zu erkennen (auch das leere Wort). Er merkt sich die Klammertiefe – aber nur bis zu einer Grenze.',
    sprache: 'L = korrekt geklammerte Ausdrücke, z. B. (()()), ε', alphabet: ['(', ')'], kapazitaet: 3, bau: bauKlammern, pruefe: pruefeKlammern,
    praefix: '(', fortsetzung: ')', punkte: 40,
    tipps: [
      'Die Klammertiefe kann beliebig groß werden. Wie viele verschiedene Tiefen kann sich ein Automat mit k Zuständen merken?',
      'Lies (, ((, (((, … und beobachte den Zustand. Ab einer Tiefe bleibt der Automat im selben Zustand hängen.',
      'Zwei Präfixe (ⁱ und (ʲ im selben Zustand: Schließe nun genau i Klammern. Ein Wort ist korrekt, das andere nicht.',
      'Konkret: Probiere (((( ))) – also vier öffnende und drei schließende Klammern.',
    ],
  },
  {
    id: 'tuersteher', titel: 'Der Türsteher', kontext: 'Am Club-Eingang: E = jemand kommt rein, A = jemand geht raus. Der Automat behauptet zu erkennen, ob am Ende genauso viele rein wie raus sind (Reihenfolge egal).',
    sprache: 'L = Wörter über {E, A} mit gleich vielen E wie A', alphabet: ['E', 'A'], kapazitaet: 3, bau: bauBilanz, pruefe: pruefeBilanz,
    praefix: 'E', fortsetzung: 'A', punkte: 40,
    tipps: [
      'Der Automat merkt sich die Bilanz (rein minus raus) – aber eine Bilanz kann beliebig groß werden, Zustände gibt es nur k.',
      'Lass E, EE, EEE, … kommen. Wann bleibt der Zustand gleich? Dann hat der Türsteher aufgehört zu zählen.',
      'Zwei Präfixe Eⁱ und Eʲ im selben Zustand: Lass danach genau i Leute gehen (Aⁱ). Einmal ist der Club leer, einmal nicht.',
      'Konkret: Probiere EEEEAAAA (vier rein, vier raus) – der Automat lehnt es ab, obwohl der Club leer ist.',
    ],
  },
  {
    id: 'anbn-gross', titel: 'Der Riesen-Zähler', kontext: 'Dieser Automat hat viele Zustände. Blindes Raten dauert jetzt lange – mit der richtigen Idee brauchst du nur ein Wort.',
    sprache: 'L = {aⁿbⁿ | n ≥ 1}', alphabet: ['a', 'b'], kapazitaet: 10, bau: bauAnBn, pruefe: pruefeAnBn,
    praefix: 'a', fortsetzung: 'b', tipps: TIPPS_ANBN(10), punkte: 50,
  },
];

/** Fertiger DEA (Engine-Format) für eine Stufe. */
export const bauAutomat = (stufe) => stufe.bau(stufe.kapazitaet);

// Bonus: Warum hilft ein Zustand mehr nicht? (Multiple Choice, erste Option ist jeweils richtig – wird gemischt)
export const UEBERLISTE_BONUS = [
  {
    frage: 'Du schenkst dem Automaten für aⁿbⁿ einen Zustand mehr (k + 1 statt k). Warum ist die Sprache trotzdem nicht erkennbar?',
    optionen: [
      'Das Argument funktioniert für jede feste Zahl k: Man betrachtet k + 2 Präfixe a, aa, …, und wieder landen zwei im selben Zustand.',
      'Weil der neue Zustand kein Endzustand sein darf.',
      'Weil ein DEA höchstens 10 Zustände haben darf.',
      'Weil der Automat dann nichtdeterministisch wird.',
    ],
  },
  {
    frage: 'Welcher Satz beschreibt das Schubfachprinzip in diesem Argument richtig?',
    optionen: [
      'Liest ein DEA mit k Zuständen k + 1 verschiedene Präfixe, dann führen mindestens zwei davon in denselben Zustand.',
      'Ein DEA mit k Zuständen kann höchstens k verschiedene Wörter akzeptieren.',
      'Jeder Zustand kann höchstens ein Präfix speichern, deshalb braucht man k + 1 Endzustände.',
      'Zwei Präfixe im selben Zustand bedeuten, dass der Automat sie beide akzeptiert.',
    ],
  },
  {
    frage: 'Die Präfixe aⁱ und aʲ (i ≠ j) führen in denselben Zustand. Warum ergibt sich daraus ein Widerspruch?',
    optionen: [
      'Nach der gleichen Fortsetzung bⁱ ist der Automat in beiden Fällen im selben Zustand – aber aⁱbⁱ gehört zur Sprache und aʲbⁱ nicht.',
      'Weil ein Zustand nie von zwei verschiedenen Wörtern erreicht werden darf.',
      'Weil der Automat dann das leere Wort akzeptieren müsste.',
      'Weil aⁱ und aʲ verschieden lang sind und der Automat die Länge nicht lesen kann.',
    ],
  },
  {
    frage: 'Welche dieser Sprachen kann ein endlicher Automat erkennen?',
    optionen: [
      'Wörter aⁿbᵐ mit n ≤ 3 und beliebigem m – beschränktes Zählen reicht.',
      'Wörter aⁿbⁿ für alle n ≥ 1 – unbeschränktes Zählen.',
      'Korrekt geklammerte Ausdrücke beliebiger Tiefe.',
      'Wörter über {E, A} mit gleich vielen E wie A.',
    ],
  },
];
