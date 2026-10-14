// Boss-Kämpfe (#/boss?welt=A|B|C, wie die Bosse von Algo Quest): Am Ende jeder Welt eine Prüfung auf Zeit aus
// zufällig gezogenen Aufgaben – ohne Rückmeldung während des Kampfes, Auswertung erst am Ende.
// Liegt in inhalte/ (nur Server, Vertrag InfoLabs §9): richtige Antworten, Erklärungen und Kontrollen kennt nur der Server.
//
// Je Welt:  titel, niveau (wie BOSS_NIVEAU in app/js/data/niveaus.js), dauerMin, anzahl (gezogen), mix {Stufe: Anzahl},
//           pool (Aufgaben, nicht in Leveln – eigene Aufgaben, keine Original-Abituraufgaben)
// Aufgabe:  id (BOSS-<Welt>-<nn>, nie ändern), stufe 1–3 (Punkte 10/20/30), niveau (alle | eA | plus), fallen (P1–P10),
//           frage im Format des Level-Quiz (mc: ERSTE Option richtig; wf: erste Begründung richtig; zuordnung: Paare),
//           bild (optional, Gegenstand der Aufgabe – wird gezeigt): { art: 'automat', typ: dea|nea|mealy|nka, automat }
//           oder { art: 'grammatik', text },
//           kontrolle (optional, nur für den Test test/boss.test.js): (E) => true, wenn die richtige Antwort laut
//           Engine stimmt und jede falsche Option wirklich falsch ist.
// Fachnotation nach PLAN.md Abschnitt 1 (Notation 2025).

const mc = (frage, optionen, erklaerung) => ({ typ: 'mc', frage, optionen, erklaerung });
const wf = (aussage, wahr, begruendungen, erklaerung) => ({ typ: 'wf', aussage, wahr, begruendungen, erklaerung });
const zu = (frage, paare, erklaerung) => ({ typ: 'zuordnung', frage, paare, erklaerung });
const count = (w, s) => w.filter((x) => x === s).length;
const str = (w) => w.join('');
/** Anzeige eines Wortes (leeres Wort = ε) und zurück in Zeichen. */
const zeichen = (text) => (text === 'ε' ? [] : [...text]);

/* ---------- Kontrollen (nur im Test ausgeführt, E = Engine-Funktionen) ---------- */
/** Genau die erste Option ist ein akzeptiertes Wort (bzw. bei gesucht = false: genau die erste wird verworfen). */
const nurErsteAkzeptiert = (gesucht = true) => (E, a) => a.frage.optionen.every((o, i) => E.akzeptiert(a.bild, zeichen(o)) === (i === 0 ? gesucht : !gesucht));
/** Die erste Option beschreibt die Sprache des Bildes (alle Wörter bis Länge 8), jede andere unterscheidet sich. */
const sprache = (praedikate) => (E, a) => praedikate.every((p, i) => E.gleicheSprache(a.bild, p) === (i === 0));
/** Grammatik-Optionen: die erste erzeugt genau die Sprache des Prädikats (bis Länge 8), jede andere nicht. */
const grammatikOptionen = (alphabet, p) => (E, a) => a.frage.optionen.every((g, i) => E.grammatikGleich(g, alphabet, p) === (i === 0));

/* ---------- Automaten der Aufgaben (Engine-Format) ---------- */
const ENDET_B = { alphabet: ['a', 'b'], start: 'S0', accepting: ['S1'], delta: { S0: { a: 'S0', b: 'S1' }, S1: { a: 'S0', b: 'S1' } } };
const BEGINNT_A = { alphabet: ['a', 'b'], start: 'S0', accepting: ['S1'], implicitError: true, delta: { S0: { a: 'S1' }, S1: { 'a, b': 'S1' } } };
const GERADE_A = { alphabet: ['a', 'b'], start: 'S0', accepting: ['S0'], delta: { S0: { a: 'S1', b: 'S0' }, S1: { a: 'S0', b: 'S1' } } };
const ENTHAELT_AB = { alphabet: ['a', 'b'], start: 'S0', accepting: ['S2'], delta: { S0: { a: 'S1', b: 'S0' }, S1: { a: 'S1', b: 'S2' }, S2: { 'a, b': 'S2' } } };
const ENDET_A_REDUNDANT = { alphabet: ['a', 'b'], start: 'S0', accepting: ['S1'], delta: { S0: { a: 'S1', b: 'S2' }, S1: { a: 'S1', b: 'S2' }, S2: { a: 'S1', b: 'S2' } } };
const MEALY_AB = { inputAlphabet: ['a', 'b'], outputAlphabet: ['x'], states: ['S0', 'S1'], start: 'S0', delta: { S0: { a: 'S1/ε', b: 'S0/ε' }, S1: { a: 'S1/ε', b: 'S0/x' } } };
const NEA_ENDET_AB = { alphabet: ['a', 'b'], states: ['S0', 'S1', 'S2'], start: 'S0', accepting: ['S2'], delta: { S0: { a: ['S0', 'S1'], b: ['S0'] }, S1: { b: ['S2'] } } };
const NKA_ANBN = { inputAlphabet: ['a', 'b'], stackAlphabet: ['#', 'A'], states: ['S0', 'S1', 'S2'], start: 'S0', accepting: ['S2'],
  transitions: ['S0 -> S0 : (#, a) : A#', 'S0 -> S0 : (A, a) : AA', 'S0 -> S1 : (A, b) : ε', 'S1 -> S1 : (A, b) : ε', 'S1 -> S2 : (#, ε) : #'] };
const NKA_KLAMMERN = { inputAlphabet: ['(', ')'], stackAlphabet: ['#', 'K'], states: ['S0', 'S1'], start: 'S0', accepting: ['S0'],
  transitions: ['S0 -> S1 : (#, () : K#', 'S1 -> S1 : (K, () : KK', 'S1 -> S1 : (K, )) : ε', 'S1 -> S0 : (#, ε) : #'] };
const NKA_SPIEGEL = { inputAlphabet: ['a', 'b', 'c'], stackAlphabet: ['#', 'A', 'B'], states: ['S0', 'S1', 'S2'], start: 'S0', accepting: ['S2'],
  transitions: ['S0 -> S0 : (#, a) : A#', 'S0 -> S0 : (#, b) : B#', 'S0 -> S0 : (A, a) : AA', 'S0 -> S0 : (A, b) : BA', 'S0 -> S0 : (B, a) : AB', 'S0 -> S0 : (B, b) : BB',
    'S0 -> S1 : (#, c) : #', 'S0 -> S1 : (A, c) : A', 'S0 -> S1 : (B, c) : B', 'S1 -> S1 : (A, a) : ε', 'S1 -> S1 : (B, b) : ε', 'S1 -> S2 : (#, ε) : #'] };

const dea = (automat) => ({ art: 'automat', typ: 'dea', automat });
const gram = (text) => ({ art: 'grammatik', text });

export const BOSSE = {
  A: {
    titel: 'Boss der Welt A: Der Automaten-Wächter',
    niveau: 'alle', dauerMin: 20, anzahl: 8, mix: { 1: 3, 2: 3, 3: 2 },
    pool: [
      { id: 'BOSS-A-01', stufe: 1, niveau: 'alle', fallen: ['P2'], bild: dea(ENDET_B),
        frage: mc('Welches Wort akzeptiert der abgebildete DEA?', ['aab', 'aba', 'baa', 'ε'], 'Akzeptiert wird, wenn der Automat nach dem letzten Zeichen in einem Endzustand ist: aab endet in S1.'),
        kontrolle: nurErsteAkzeptiert() },
      { id: 'BOSS-A-02', stufe: 1, niveau: 'alle', fallen: ['P2', 'P8'], bild: dea(ENDET_B),
        frage: mc('Der abgebildete DEA liest das Wort ba. Welche Dokumentation ist richtig?', [
          'S0 –b→ S1 –a→ S0; nicht akzeptiert, weil S0 kein Endzustand ist.',
          'S0 –b→ S1 –a→ S0; akzeptiert, weil der Automat unterwegs den Endzustand S1 erreicht hat.',
          'S0 –b→ S1; akzeptiert, weil S1 ein Endzustand ist.',
          'S0 –a→ S0 –b→ S1; akzeptiert, weil das Wort ein b enthält.',
        ], 'Entscheidend ist nur der Zustand nach dem letzten Zeichen – unterwegs erreichte Endzustände zählen nicht.') },
      { id: 'BOSS-A-03', stufe: 1, niveau: 'alle', fallen: ['P1'],
        frage: wf('Ein DEA darf zu einem Zustand und einem Eingabezeichen zwei verschiedene Folgezustände haben.', false, [
          'Die Übergangsfunktion δ ordnet jedem Paar (Zustand, Eingabezeichen) genau einen Folgezustand zu – sonst wäre der Automat nichtdeterministisch.',
          'Das ist erlaubt, wenn einer der beiden Folgezustände ein Endzustand ist.',
          'Das ist erlaubt, solange der Automat vollständig ist.',
        ]) },
      { id: 'BOSS-A-04', stufe: 1, niveau: 'alle', fallen: ['P1', 'P2'], bild: dea(BEGINNT_A),
        frage: mc('Alle nicht eingezeichneten Übergänge führen in einen Fehlerzustand. Welches Wort akzeptiert der abgebildete DEA?', ['abba', 'ba', 'bab', 'b'],
          'Beginnt das Wort mit b, geht der Automat sofort in den Fehlerzustand und kommt dort nie wieder heraus.'),
        kontrolle: nurErsteAkzeptiert() },
      { id: 'BOSS-A-05', stufe: 1, niveau: 'alle', fallen: ['P10'],
        frage: zu('Ordne jedem Bestandteil eines DEA A = (Q, Σ, δ, S0, F) seine Bedeutung zu.', [
          ['Q', 'endliche Menge der Zustände'],
          ['Σ', 'Eingabealphabet'],
          ['δ', 'Übergangsfunktion Q × Σ → Q'],
          ['F', 'Menge der Endzustände'],
        ]) },
      { id: 'BOSS-A-06', stufe: 2, niveau: 'alle', fallen: ['P10', 'P3'], bild: dea(GERADE_A),
        frage: mc('Welche Sprache akzeptiert der abgebildete DEA?', [
          'Alle Wörter über {a, b} mit einer geraden Anzahl a (auch ε).',
          'Alle Wörter über {a, b} mit einer ungeraden Anzahl a.',
          'Alle Wörter über {a, b} mit gerader Länge.',
          'Alle Wörter über {a, b} mit gleich vielen a und b.',
        ], 'S0 bedeutet „bisher gerade Anzahl a“, S1 „ungerade Anzahl a“; b ändert daran nichts.'),
        kontrolle: sprache([(w) => count(w, 'a') % 2 === 0, (w) => count(w, 'a') % 2 === 1, (w) => w.length % 2 === 0, (w) => count(w, 'a') === count(w, 'b')]) },
      { id: 'BOSS-A-07', stufe: 2, niveau: 'alle', fallen: ['P5'], bild: { art: 'automat', typ: 'mealy', automat: MEALY_AB },
        frage: mc('Welche Ausgabe erzeugt der abgebildete Mealy-Automat bei der Eingabe abaab?', ['xx', 'x', 'xxx', 'ε'],
          'S0 –a / ε→ S1 –b / x→ S0 –a / ε→ S1 –a / ε→ S1 –b / x→ S0: Ausgabe xx.'),
        kontrolle: (E, a) => a.frage.optionen.every((o, i) => (E.mealyAusgabe(a.bild, 'abaab') === (o === 'ε' ? '' : o)) === (i === 0)) },
      { id: 'BOSS-A-08', stufe: 2, niveau: 'alle', fallen: ['P5'],
        frage: wf('Ein Mealy-Automat akzeptiert ein Wort, wenn er nach dem Lesen in einem Endzustand ist.', false, [
          'Ein Mealy-Automat hat keine Endzustände – er akzeptiert nicht, sondern übersetzt jede Eingabe in eine Ausgabe (Kante „e / a“).',
          'Er akzeptiert, wenn die Ausgabe nicht leer ist.',
          'Das stimmt, nur heißen die Endzustände dort Ausgabezustände.',
        ]) },
      { id: 'BOSS-A-09', stufe: 2, niveau: 'alle', fallen: ['P3', 'P4'],
        frage: mc('Ein vollständiger DEA soll alle Wörter über {a, b} erkennen, die ab enthalten. Wie viele Zustände hat ein minimaler solcher DEA?', ['3', '2', '4', '5'],
          'Der Automat muss sich merken: noch nichts gefunden, zuletzt a gelesen, ab gefunden – drei paarweise unterscheidbare Situationen.'),
        kontrolle: (E) => E.minimal(ENTHAELT_AB) === 3 && E.gleicheSprache(dea(ENTHAELT_AB), (w) => str(w).includes('ab')) },
      { id: 'BOSS-A-10', stufe: 2, niveau: 'alle', fallen: ['P4'], bild: dea(ENTHAELT_AB),
        frage: mc('Welches Wort unterscheidet die Zustände S0 und S1 des abgebildeten DEA?', ['b', 'a', 'aa', 'ε'],
          'Von S0 aus führt b nach S0 (kein Endzustand), von S1 aus nach S2 (Endzustand) – also sind S0 und S1 unterscheidbar.'),
        kontrolle: (E, a) => a.frage.optionen.every((o, i) => E.unterscheidet(ENTHAELT_AB, 'S0', 'S1', zeichen(o)) === (i === 0)) },
      { id: 'BOSS-A-11', stufe: 3, niveau: 'alle', fallen: ['P3', 'P4'],
        frage: mc('Wie viele Zustände hat ein minimaler vollständiger DEA für „gerade Anzahl a und endet auf b“ über {a, b}?', ['3', '4', '2', '6'],
          'Das Produkt aus gerade/ungerade und „endet auf b“ ergibt 4 Zustände – aber bei ungerader Anzahl a ist egal, was zuletzt kam: Das nächste Zeichen überschreibt es. Übrig bleiben „gerade, endet auf b“ (Endzustand), „gerade, sonst“ und „ungerade“.'),
        kontrolle: (E) => E.minimalVonPraedikat(['a', 'b'], (w) => count(w, 'a') % 2 === 0 && w.at(-1) === 'b') === 3 },
      { id: 'BOSS-A-12', stufe: 3, niveau: 'plus', fallen: ['P4'], bild: dea(ENDET_A_REDUNDANT),
        frage: mc('Welche Zustände des abgebildeten DEA lassen sich zusammenfassen?', ['S0 und S2', 'S0 und S1', 'S1 und S2', 'keine – der Automat ist schon minimal'],
          'S0 und S2 bedeuten beide „das letzte Zeichen war kein a“ – kein Wort unterscheidet sie. S1 ist Endzustand und damit von beiden unterscheidbar (Wort ε).'),
        kontrolle: (E) => !E.unterscheidbar(ENDET_A_REDUNDANT, 'S0', 'S2') && E.unterscheidbar(ENDET_A_REDUNDANT, 'S0', 'S1') && E.unterscheidbar(ENDET_A_REDUNDANT, 'S1', 'S2') },
      { id: 'BOSS-A-13', stufe: 3, niveau: 'alle', fallen: ['P4'],
        frage: mc('Mindestens wie viele Zustände braucht jeder DEA für „das drittletzte Zeichen ist a“ über {a, b}?', ['8', '3', '4', '6'],
          'Der Automat muss sich die letzten drei Zeichen merken: Die 2³ = 8 Präfixe aaa, aab, …, bbb sind paarweise unterscheidbar.'),
        kontrolle: (E) => E.minimalVonPraedikat(['a', 'b'], (w) => w.length >= 3 && w.at(-3) === 'a', 3) === 8 },
      { id: 'BOSS-A-14', stufe: 3, niveau: 'alle', fallen: ['P5'],
        frage: zu('Ordne zu: Was bedeutet das beim Mealy-Automaten?', [
          ['a / x an einer Kante', 'beim Lesen von a wird x ausgegeben'],
          ['b / ε an einer Kante', 'beim Lesen von b wird nichts ausgegeben'],
          ['Ω', 'Ausgabealphabet'],
          ['Endzustände', 'gibt es beim Mealy-Automaten nicht'],
        ]) },
      { id: 'BOSS-A-15', stufe: 3, niveau: 'alle', fallen: ['P1'],
        frage: wf('Vertauscht man bei einem vollständigen DEA Endzustände und Nicht-Endzustände, erkennt er genau das Komplement seiner Sprache.', true, [
          'Jedes Wort endet in genau einem Zustand; durch das Vertauschen kehrt sich die Entscheidung für jedes Wort um. Ohne Vollständigkeit (Fehlerzustand) ginge das schief.',
          'Zusätzlich muss man den Startzustand zu einem Endzustand machen.',
          'Das klappt auch bei unvollständigen Automaten, denn fehlende Übergänge verwerfen ohnehin.',
        ]) },
    ],
  },
  B: {
    titel: 'Boss der Welt B: Der Keller-Golem',
    niveau: 'eA', dauerMin: 25, anzahl: 8, mix: { 1: 3, 2: 3, 3: 2 },
    pool: [
      { id: 'BOSS-B-01', stufe: 1, niveau: 'alle', fallen: ['P6'],
        frage: wf('Die Sprache {aⁿbⁿ | n ≥ 1} ist regulär.', false, [
          'Ein DEA mit k Zuständen landet mit zwei der Präfixe a, a², …, aᵏ⁺¹ im selben Zustand (Schubfachprinzip) und muss dann ein falsches Wort akzeptieren oder ein richtiges verwerfen.',
          'Sie ist regulär, weil man sie mit einer Grammatik beschreiben kann.',
          'Sie ist nicht regulär, weil sie unendlich viele Wörter enthält.',
        ]) },
      { id: 'BOSS-B-02', stufe: 1, niveau: 'alle', fallen: ['P6'],
        frage: mc('Welche Sprache über {a, b} ist regulär?', [
          'Alle Wörter, in denen die Anzahl der a durch 3 teilbar ist.',
          '{aⁿbⁿ | n ≥ 0}',
          'Alle Palindrome',
          'Alle Wörter mit gleich vielen a und b',
        ], 'Für „Anzahl a durch 3 teilbar“ reicht ein Zähler modulo 3 – drei Zustände. Die anderen Sprachen verlangen unbegrenztes Zählen bzw. Vergleichen.') },
      { id: 'BOSS-B-03', stufe: 1, niveau: 'eA', fallen: ['P7'],
        frage: mc('Was bedeutet die Kantenbeschriftung (A, b) : ε an einem Kellerautomaten?', [
          'Liegt A oben und wird b gelesen, wird A entfernt und nichts abgelegt.',
          'Liegt A oben und wird b gelesen, bleibt der Keller unverändert.',
          'Wird A gelesen, wird b abgelegt.',
          'Liegt b oben, wird A ohne Eingabe entfernt.',
        ], 'Notation (oberstes Kellerzeichen, Eingabe) : Ablage – das gelesene Kellerzeichen wird immer entfernt, ε heißt: nichts ablegen.') },
      { id: 'BOSS-B-04', stufe: 1, niveau: 'eA', fallen: ['P2'],
        frage: mc('Wann akzeptiert ein Kellerautomat (Notation der Ergänzenden Hinweise 2025) ein Wort?', [
          'Wenn er nach dem Lesen der vollständigen Eingabe in einem Endzustand ist (auf mindestens einem Weg).',
          'Wenn der Keller am Ende leer ist.',
          'Wenn am Ende # oben im Keller liegt.',
          'Wenn er während des Lesens irgendwann einen Endzustand erreicht.',
        ]) },
      { id: 'BOSS-B-05', stufe: 1, niveau: 'plus', fallen: ['P2'], bild: { art: 'automat', typ: 'nea', automat: NEA_ENDET_AB },
        frage: mc('Welches Wort akzeptiert der abgebildete NEA?', ['bab', 'aba', 'ba', 'b'],
          'Ein NEA akzeptiert, wenn mindestens ein Lauf nach dem letzten Zeichen in einem Endzustand endet – hier genau bei Wörtern, die auf ab enden.'),
        kontrolle: nurErsteAkzeptiert() },
      { id: 'BOSS-B-06', stufe: 2, niveau: 'eA', fallen: ['P2', 'P7'], bild: { art: 'automat', typ: 'nka', automat: NKA_ANBN },
        frage: mc('Welches Wort akzeptiert der abgebildete Kellerautomat?', ['aabb', 'aab', 'abab', 'ε'],
          'Jedes a legt ein A ab, jedes b entfernt eines; liegt danach wieder # oben, führt der ε-Übergang in den Endzustand S2.'),
        kontrolle: nurErsteAkzeptiert() },
      { id: 'BOSS-B-07', stufe: 2, niveau: 'eA', fallen: ['P7'],
        frage: mc('Ein Kellerautomat ist in S0, im Keller liegt A# (A oben). Er liest a und benutzt den Übergang (A, a) : AA. Wie sieht der Keller danach aus?', [
          'AA# – A oben',
          'A# – A oben',
          'AAA# – A oben',
          '#AA – # oben',
        ], 'Das oberste A wird entfernt, dann wird AA abgelegt (rechtes Zeichen zuerst): AA#.') },
      { id: 'BOSS-B-08', stufe: 2, niveau: 'alle', fallen: ['P6'],
        frage: mc('Ein DEA mit 5 Zuständen soll {aⁿbⁿ | n ≥ 1} erkennen. Welches Argument zeigt, dass er sich irren muss?', [
          'Von den sechs Präfixen a, a², …, a⁶ führen zwei (aⁱ und aʲ, i ≠ j) in denselben Zustand; dann enden aⁱbⁱ und aʲbⁱ im selben Zustand, obwohl nur aⁱbⁱ zur Sprache gehört.',
          'Ein Wort wie a⁵b⁵ ist zehn Zeichen lang, der DEA hat aber nur fünf Zustände.',
          'Ein DEA kann nach einem a kein b mehr lesen.',
          'Die Sprache ist unendlich, und unendliche Sprachen sind nie regulär.',
        ], 'Schubfachprinzip: mehr Präfixe als Zustände, dieselbe Fortsetzung, verschiedene Zugehörigkeit – Widerspruch.') },
      { id: 'BOSS-B-09', stufe: 2, niveau: 'plus', fallen: ['P2'], bild: { art: 'automat', typ: 'nea', automat: NEA_ENDET_AB },
        frage: mc('Teilmengenkonstruktion zum abgebildeten NEA: Welche Zustandsmenge erreicht man von {S0} aus mit dem Wort ab?', ['{S0, S2}', '{S2}', '{S0, S1}', '{S0, S1, S2}'],
          '{S0} –a→ {S0, S1} –b→ {S0, S2}: von S0 mit b nach S0, von S1 mit b nach S2.'),
        kontrolle: (E, a) => E.mengeNach(NEA_ENDET_AB, 'ab') === a.frage.optionen[0] && a.frage.optionen.slice(1).every((o) => o !== a.frage.optionen[0]) },
      { id: 'BOSS-B-10', stufe: 2, niveau: 'eA', fallen: ['P10'], bild: { art: 'automat', typ: 'nka', automat: NKA_KLAMMERN },
        frage: mc('Welche Sprache erkennt der abgebildete Kellerautomat?', [
          'Alle korrekt geklammerten Ausdrücke aus ( und ) – auch ε.',
          'Alle Wörter mit gleich vielen ( und ) in beliebiger Reihenfolge.',
          'Alle Wörter der Form (ⁿ)ⁿ mit n ≥ 1.',
          'Alle Wörter gerader Länge über {(, )}.',
        ], 'Jedes K steht für eine offene Klammer; eine schließende Klammer ohne K oben führt zu keinem Übergang – )( wird verworfen.'),
        kontrolle: sprache([
          (w) => { let d = 0; for (const c of w) { d += c === '(' ? 1 : -1; if (d < 0) return false; } return d === 0; },
          (w) => count(w, '(') === count(w, ')'),
          (w) => { const n = w.length / 2; return n >= 1 && str(w) === '('.repeat(n) + ')'.repeat(n); },
          (w) => w.length % 2 === 0,
        ]) },
      { id: 'BOSS-B-11', stufe: 3, niveau: 'eA', fallen: ['P7', 'P2'], bild: { art: 'automat', typ: 'nka', automat: NKA_SPIEGEL },
        frage: mc('Welches Wort akzeptiert der abgebildete Kellerautomat?', ['abcba', 'abcab', 'abc', 'acba'],
          'Vor dem c wird jedes Zeichen als A bzw. B abgelegt, nach dem c muss es in umgekehrter Reihenfolge wieder gelesen werden: w c wᴿ.'),
        kontrolle: nurErsteAkzeptiert() },
      { id: 'BOSS-B-12', stufe: 3, niveau: 'eA', fallen: ['P8'], bild: { art: 'automat', typ: 'nka', automat: NKA_ANBN },
        frage: mc('Welche Zustandsfolge durchläuft der abgebildete Kellerautomat beim Wort aabb bis zur Akzeptanz?', [
          'S0, S0, S0, S1, S1, S2',
          'S0, S0, S1, S1, S2',
          'S0, S0, S0, S1, S1',
          'S0, S1, S1, S2, S2, S2',
        ], 'Zwei a in S0, zwei b nach S1, dann der ε-Übergang (#, ε) : # nach S2 – in der Abi-Tabelle eine eigene Zeile.'),
        kontrolle: (E, a) => E.kellerZustaende(NKA_ANBN, 'aabb') === a.frage.optionen[0] },
      { id: 'BOSS-B-13', stufe: 3, niveau: 'alle', fallen: ['P6'],
        frage: mc('L = {aⁿbᵐ | n, m ≥ 0 und n ≤ 3}. Welche Aussage trifft zu?', [
          'L ist regulär: Ein DEA zählt die a nur bis 3 und lässt danach beliebig viele b zu.',
          'L ist nicht regulär, weil m beliebig groß werden kann.',
          'L ist nicht regulär, weil die Anzahl der a mit der Anzahl der b verglichen werden muss.',
          'L ist nur regulär, wenn zusätzlich m ≤ 3 gilt.',
        ], 'Eine Obergrenze macht das Zählen endlich – „endlich/modulo/Obergrenze“ ist regulär.'),
        kontrolle: (E) => E.minimalVonPraedikat(['a', 'b'], (w) => { const s = str(w); const n = s.length - s.replace(/^a*/, '').length; return /^a*b*$/.test(s) && n <= 3; }) > 0 },
      { id: 'BOSS-B-14', stufe: 3, niveau: 'eA', fallen: ['P6'],
        frage: zu('Ordne jeder Sprache über {a, b, c} das schwächste Modell zu, das sie erkennt.', [
          ['Alle Wörter, die auf ab enden', 'DEA'],
          ['{aⁿbⁿ | n ≥ 1}', 'Kellerautomat'],
          ['{aⁿbⁿcⁿ | n ≥ 1}', 'weder DEA noch Kellerautomat'],
        ]) },
      { id: 'BOSS-B-15', stufe: 3, niveau: 'plus', fallen: ['P2'],
        frage: wf('Ein NEA kann Sprachen erkennen, die kein DEA erkennt.', false, [
          'Mit der Teilmengenkonstruktion gibt es zu jedem NEA einen DEA für dieselbe Sprache – der NEA ist oft nur kleiner.',
          'Ein NEA kann raten und deshalb auch {aⁿbⁿ} erkennen.',
          'Ein NEA hat ε-Übergänge und ist deshalb mächtiger.',
        ]) },
    ],
  },
  C: {
    titel: 'Boss der Welt C: Die Grammatik-Sphinx',
    niveau: 'eA', dauerMin: 25, anzahl: 8, mix: { 1: 3, 2: 3, 3: 2 },
    pool: [
      { id: 'BOSS-C-01', stufe: 1, niveau: 'eA', fallen: ['P9'],
        frage: mc('Eine Grammatik wird als G = (N, T, S, P) angegeben. Was bedeuten die vier Teile?', [
          'Nichtterminale, Terminale, Startsymbol, Produktionsregeln',
          'Nullwort, Terminale, Satzformen, Pfeile',
          'Nachfolger, Tabelle, Startzustand, Programm',
          'Nichtterminale, Teilwörter, Satzzeichen, Prioritäten',
        ]) },
      { id: 'BOSS-C-02', stufe: 1, niveau: 'eA', fallen: ['P9'], bild: gram('S → aS | b'),
        frage: wf('Die abgebildete Grammatik ist rechtsregulär.', true, [
          'Jede Regel hat die Form A → aB oder A → a: ein Terminal, höchstens ein Nichtterminal und das ganz rechts.',
          'Sie ist nicht rechtsregulär, weil S auf der rechten Seite vorkommt.',
          'Sie ist nicht rechtsregulär, weil eine Regel ohne Nichtterminal endet.',
        ]),
        kontrolle: (E, a) => E.rechtsregulaer(a.bild.text) === true },
      { id: 'BOSS-C-03', stufe: 1, niveau: 'eA', fallen: ['P9'], bild: gram('S → aSb | ab'),
        frage: mc('Welches Wort ist aus der abgebildeten Grammatik ableitbar?', ['aabb', 'abab', 'aab', 'ε'],
          'S ⇒ aSb ⇒ aabb. Jede Regelanwendung setzt außen ein a und ein b dazu.'),
        kontrolle: (E, a) => a.frage.optionen.every((o, i) => E.ableitbar(a.bild.text, o) === (i === 0)) },
      { id: 'BOSS-C-04', stufe: 1, niveau: 'eA', fallen: ['P9'],
        frage: mc('Welche Schreibweise ist richtig?', [
          'Regeln mit →, Ableitungen mit ⇒: S → aSb und S ⇒ aSb ⇒ aabb',
          'Regeln mit ⇒, Ableitungen mit →: S ⇒ aSb und S → aSb → aabb',
          'Beides mit =: S = aSb = aabb',
          'Beides mit →: S → aSb → aabb',
        ]) },
      { id: 'BOSS-C-05', stufe: 1, niveau: 'eA', fallen: ['P6'],
        frage: zu('Ordne jedem Typ der Chomsky-Hierarchie das passende Automatenmodell zu.', [
          ['Typ 3 (regulär)', 'endlicher Automat'],
          ['Typ 2 (kontextfrei)', 'Kellerautomat'],
          ['Typ 0 (aufzählbar)', 'Turingmaschine'],
        ]) },
      { id: 'BOSS-C-06', stufe: 2, niveau: 'eA', fallen: ['P9', 'P10'], bild: gram('S → aS | bA\nA → aA | bS | ε'),
        frage: mc('Welche Sprache erzeugt die abgebildete Grammatik?', [
          'Alle Wörter über {a, b} mit ungerader Anzahl b',
          'Alle Wörter über {a, b} mit gerader Anzahl b',
          'Alle Wörter über {a, b}, die auf b enden',
          'Alle Wörter über {a, b} mit genau einem b',
        ], 'S steht für „bisher gerade Anzahl b“, A für „ungerade“; nur A darf mit ε enden.'),
        kontrolle: (E, a) => [(w) => count(w, 'b') % 2 === 1, (w) => count(w, 'b') % 2 === 0, (w) => w.at(-1) === 'b', (w) => count(w, 'b') === 1]
          .every((p, i) => E.grammatikGleich(a.bild.text, ['a', 'b'], p) === (i === 0)) },
      { id: 'BOSS-C-07', stufe: 2, niveau: 'eA', fallen: ['P9'], bild: gram('S → aSb | ab'),
        frage: mc('Wie viele Ableitungsschritte braucht man mit der abgebildeten Grammatik für aaabbb?', ['3', '6', '4', '2'],
          'S ⇒ aSb ⇒ aaSbb ⇒ aaabbb – je Schritt genau eine Regel.'),
        kontrolle: (E, a) => E.ableitungsSchritte(a.bild.text, 'aaabbb') === Number(a.frage.optionen[0]) },
      { id: 'BOSS-C-08', stufe: 2, niveau: 'eA', fallen: ['P3', 'P9'],
        frage: mc('Welche Grammatik erzeugt {aⁿbⁿ | n ≥ 0}?', ['S → aSb | ε', 'S → aSb | ab', 'S → aS | bS | ε', 'S → aA | ε\nA → bS'],
          'Mit ab statt ε fehlt das leere Wort (n = 0). Die anderen erzeugen beliebige bzw. abwechselnde Folgen.'),
        kontrolle: grammatikOptionen(['a', 'b'], (w) => { const n = w.length / 2; return str(w) === 'a'.repeat(n) + 'b'.repeat(n); }) },
      { id: 'BOSS-C-09', stufe: 2, niveau: 'eA', fallen: ['P9'], bild: gram('S → S+S | x'),
        frage: mc('Warum ist die abgebildete Grammatik mehrdeutig?', [
          'Für x+x+x gibt es zwei verschiedene Ableitungsbäume.',
          'Weil S auf beiden Seiten einer Regel vorkommt.',
          'Weil sie unendlich viele Wörter erzeugt.',
          'Weil + ein Terminal ist.',
        ], 'Mehrdeutig heißt: ein Wort mit zwei verschiedenen Ableitungsbäumen – (x+x)+x und x+(x+x).') },
      { id: 'BOSS-C-10', stufe: 2, niveau: 'eA', fallen: ['P6'],
        frage: wf('Ist eine Grammatik nicht rechtsregulär, dann ist die erzeugte Sprache nicht regulär.', false, [
          'Eine Sprache ist regulär, wenn es irgendeine rechtsreguläre Grammatik (oder einen DEA) für sie gibt: S → Sa | a ist nicht rechtsregulär, erzeugt aber a⁺.',
          'Das stimmt, denn nur rechtsreguläre Grammatiken erzeugen reguläre Sprachen.',
          'Das stimmt, wenn die Grammatik mehr als ein Nichtterminal hat.',
        ]),
        kontrolle: (E) => E.rechtsregulaer('S → Sa | a') === false && E.grammatikGleich('S → Sa | a', ['a'], (w) => w.length >= 1) },
      { id: 'BOSS-C-11', stufe: 3, niveau: 'eA', fallen: ['P3'], bild: gram('S → (S)S | ε'),
        frage: mc('Welches Wort ist aus der abgebildeten Grammatik NICHT ableitbar?', ['())(', '(()())', '()()', 'ε'],
          'Die Grammatik erzeugt genau die korrekt geklammerten Ausdrücke; in ())( wird vor dem Öffnen geschlossen.'),
        kontrolle: (E, a) => a.frage.optionen.every((o, i) => E.ableitbar(a.bild.text, o) === (i !== 0)) },
      { id: 'BOSS-C-12', stufe: 3, niveau: 'eA', fallen: ['P3', 'P9'],
        frage: mc('Welche Grammatik erzeugt genau die Palindrome gerader Länge über {a, b} (auch ε)?', ['S → aSa | bSb | ε', 'S → aSa | bSb | a | b | ε', 'S → aSb | bSa | ε', 'S → aS | bS | ε'],
          'a | b in der Mitte erzeugt auch Palindrome ungerader Länge; aSb | bSa erzeugt keine Palindrome.'),
        kontrolle: grammatikOptionen(['a', 'b'], (w) => w.length % 2 === 0 && str(w) === [...w].reverse().join('')) },
      { id: 'BOSS-C-13', stufe: 3, niveau: 'eA', fallen: ['P9'], bild: gram('S → aA | b\nA → bS'),
        frage: mc('Aus der abgebildeten rechtsregulären Grammatik wird ein NEA gebaut. Welcher Übergang gehört zur Regel S → aA?', [
          'S –a→ A',
          'A –a→ S',
          'S –a→ Endzustand',
          'S –ε→ A',
        ], 'Nichtterminal = Zustand: Die Regel S → aA wird zum Übergang von S mit a nach A; S → b führt mit b in einen Endzustand.') },
      { id: 'BOSS-C-14', stufe: 3, niveau: 'eA', fallen: ['P6'],
        frage: mc('Wo steht die Sprache {aⁿbⁿcⁿ | n ≥ 1} in der Chomsky-Hierarchie?', [
          'Kontextsensitiv (Typ 1), aber nicht kontextfrei',
          'Regulär (Typ 3)',
          'Kontextfrei (Typ 2)',
          'Nicht einmal Typ 0',
        ], 'Ein Keller kann nur einen Vergleich führen (a mit b), nicht zusätzlich c – die Sprache ist nicht kontextfrei, aber kontextsensitiv.') },
      { id: 'BOSS-C-15', stufe: 3, niveau: 'eA', fallen: ['P9', 'P3'],
        frage: zu('Ordne jeder Sprache über {a, b} eine Grammatik zu, die genau sie erzeugt.', [
          ['alle Wörter gerader Länge', 'S → aaS | abS | baS | bbS | ε'],
          ['{aⁿbⁿ | n ≥ 1}', 'S → aSb | ab'],
          ['alle Palindrome', 'S → aSa | bSb | a | b | ε'],
        ]),
        kontrolle: (E, a) => {
          const p = [(w) => w.length % 2 === 0, (w) => { const n = w.length / 2; return n >= 1 && str(w) === 'a'.repeat(n) + 'b'.repeat(n); }, (w) => str(w) === [...w].reverse().join('')];
          return a.frage.paare.every(([, g], i) => p.every((q, j) => E.grammatikGleich(g, ['a', 'b'], q) === (i === j)));
        } },
    ],
  },
};
