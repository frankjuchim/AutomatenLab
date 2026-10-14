// Aufgaben für den Minimierer (#/minimierer, DS05 „Weniger ist mehr“).
//
// So ergänzt du eine Aufgabe (hinten anhängen, damit ?aufgabe=n-Links stabil bleiben):
//   id        eindeutiger Kurzname
//   titel     Überschrift
//   kontext   ein bis zwei Sätze zur Sprache / Situation
//   frage     Arbeitsauftrag im Abi-Stil (Operator fett im UI)
//   automat   DEA im Engine-Format. Darf unvollständig sein (implicitError: true) – für das
//             Markierungsverfahren ergänzt die App dann den Fehlerzustand F_err.
//   klassen   erwartete Zusammenfassung (nur Klassen mit ≥ 2 Zuständen) – wird in tests/teil2.test.js geprüft
//   beispiele Wörter, die akzeptiert (ja) bzw. abgelehnt (nein) werden – ebenfalls getestet
//   merke     Satz, der nach dem Lösen erscheint (Bezug zum Abitur)
//   stufe     1 Basis, 2 Standard, 3 Profi (Punkte 10/20/30, Vertrag §9)
//
// Liegt in inhalte/ (nur Server, Vertrag InfoLabs §9): Geprüft wird jede Runde auf dem Server (src/aufgaben).

export const MINIMIERER_AUFGABEN = [
  {
    id: 'smiley', stufe: 1, titel: 'Smiley-Erkenner',
    kontext: 'Der Automat erkennt genau die beiden Smileys „:-)“ und „:)“. Mit dem Fehlerzustand hat er sechs Zustände.',
    frage: 'Untersuche, ob es einen Automaten mit weniger Zuständen gibt, der dieselbe Aufgabe löst.',
    automat: { alphabet: [':', '-', ')'], start: 'S0', accepting: ['S3', 'S4'], implicitError: true,
      delta: { S0: { ':': 'S1' }, S1: { '-': 'S2', ')': 'S4' }, S2: { ')': 'S3' }, S3: {}, S4: {} } },
    klassen: [['S3', 'S4']],
    beispiele: { ja: [':-)', ':)'], nein: ['ε', ':', ':-', ':--)', ':))', '-)'] },
    merke: 'S3 und S4 sind beide Endzustände, aus denen jedes weitere Zeichen in den Fehlerzustand führt. Kein Wort kann sie unterscheiden – also reicht ein Zustand.',
  },
  {
    id: 'gerade-a', stufe: 1, titel: 'Doppelt gemoppelt: gerade Anzahl a',
    kontext: 'Der Automat akzeptiert alle Wörter über {a, b} mit einer geraden Anzahl a. Er merkt sich aber mehr, als er braucht.',
    frage: 'Bestimme mit dem Markierungsverfahren einen minimalen Automaten.',
    automat: { alphabet: ['a', 'b'], start: 'S0', accepting: ['S0', 'S2'],
      delta: { S0: { a: 'S1', b: 'S2' }, S1: { a: 'S2', b: 'S3' }, S2: { a: 'S3', b: 'S0' }, S3: { a: 'S0', b: 'S1' } } },
    klassen: [['S0', 'S2'], ['S1', 'S3']],
    beispiele: { ja: ['ε', 'aa', 'baba', 'bb'], nein: ['a', 'ab', 'aaa', 'bba'] },
    merke: 'Der Automat zählt zusätzlich die b mit – für die Sprache ist das egal. Zwei Zustände (gerade/ungerade Anzahl a) reichen.',
  },
  {
    id: 'barcode', stufe: 2, titel: 'Barcode 110 mit Ballast',
    kontext: 'Ein gültiger Barcode beginnt mit dem Startzeichen 110, danach folgen beliebige Bits. Der Entwurf hat zwei Fehlerzustände und zwei „Alles-gut“-Zustände.',
    frage: 'Untersuche, inwieweit Zustände zusammengefasst werden können, ohne die Funktionalität einzuschränken.',
    automat: { alphabet: ['0', '1'], start: 'S0', accepting: ['S3', 'S4'],
      delta: { S0: { 1: 'S1', 0: 'S5' }, S1: { 1: 'S2', 0: 'S6' }, S2: { 0: 'S3', 1: 'S6' }, S3: { 0: 'S3', 1: 'S4' },
        S4: { 0: 'S3', 1: 'S4' }, S5: { '0, 1': 'S5' }, S6: { '0, 1': 'S6' } } },
    klassen: [['S3', 'S4'], ['S5', 'S6']],
    beispiele: { ja: ['110', '1100', '1101', '110111'], nein: ['ε', '11', '111', '0110', '1010'] },
    merke: 'Zwei Zustände, aus denen man nie wieder einen Endzustand erreicht, sind immer äquivalent – ein Fehlerzustand genügt.',
  },
  {
    id: 'binaer-3', stufe: 2, titel: 'Binärzahl durch 3 teilbar',
    kontext: 'Gelesen wird eine Binärzahl (höchstwertiges Bit zuerst). Akzeptiert wird, wenn ihr Wert durch 3 teilbar ist.',
    frage: 'Begründe mit dem Markierungsverfahren, dass der Automat bereits minimal ist.',
    automat: { alphabet: ['0', '1'], start: 'S0', accepting: ['S0'],
      delta: { S0: { 0: 'S0', 1: 'S1' }, S1: { 0: 'S2', 1: 'S0' }, S2: { 0: 'S1', 1: 'S2' } } },
    klassen: [],
    beispiele: { ja: ['ε', '0', '11', '110', '1001'], nein: ['1', '10', '100', '111'] },
    merke: 'Am Ende sind alle Paare markiert: Je zwei Zustände sind unterscheidbar. Also braucht man mindestens drei Zustände.',
  },
  {
    id: 'endet-ab', stufe: 2, titel: 'Endet auf ab – zu viele Erinnerungen',
    kontext: 'Akzeptiert werden alle Wörter über {a, b}, die auf „ab“ enden. Der Entwurf unterscheidet, wie das letzte a erreicht wurde.',
    frage: 'Bestimme die Zustände, die zusammengefasst werden können, und gib den minimalen Automaten an.',
    automat: { alphabet: ['a', 'b'], start: 'S0', accepting: ['S2'],
      delta: { S0: { a: 'S1', b: 'S0' }, S1: { a: 'S3', b: 'S2' }, S2: { a: 'S4', b: 'S0' }, S3: { a: 'S3', b: 'S2' }, S4: { a: 'S3', b: 'S2' } } },
    klassen: [['S1', 'S3', 'S4']],
    beispiele: { ja: ['ab', 'aab', 'bab', 'abab'], nein: ['ε', 'a', 'ba', 'abb', 'aba'] },
    merke: 'S1, S3 und S4 bedeuten alle „zuletzt ein a gelesen“. Mehr muss sich der Automat dafür nicht merken.',
  },
  {
    id: 'kaffee', stufe: 2, titel: 'Kaffeeautomat 40 ct',
    kontext: 'Bezahlt wird mit 10- und 20-ct-Münzen, akzeptiert wird bei genau 40 ct. Der Entwurf unterscheidet, ob 20 ct als eine Münze oder als 10 + 10 eingeworfen wurden.',
    frage: 'Begründe, welche Zustände zusammengefasst werden können.',
    automat: { alphabet: ['10', '20'], start: 'S0', accepting: ['S5'], implicitError: true,
      delta: { S0: { 10: 'S1', 20: 'S2' }, S1: { 10: 'S3', 20: 'S4' }, S2: { 10: 'S4', 20: 'S5' }, S3: { 10: 'S4', 20: 'S5' }, S4: { 10: 'S5' }, S5: {} } },
    klassen: [['S2', 'S3']],
    beispiele: { ja: ['20 20', '10 10 20', '10 20 10', '10 10 10 10'], nein: ['ε', '20', '10 10 10', '20 20 10'] },
    merke: 'Für den Automaten zählt nur der bisher bezahlte Betrag, nicht die Münzen. 20 ct ist 20 ct.',
  },
  {
    id: 'quersumme', stufe: 3, titel: 'Prüfnummern: Kriterium X (angelehnt an Abitur 2025)',
    kontext: 'Prüfnummern bestehen aus zwei Ziffernfolgen über {1, 2, 3}, getrennt durch „-“. Kriterium X: Die Quersummen beider Ziffernfolgen sind beide gerade oder beide ungerade (z. B. 113-22133).',
    frage: 'Untersuche, inwieweit die Zustände S3 bis S8 zusammengefasst werden können, ohne die Funktionalität des Automaten einzuschränken.',
    automat: { alphabet: ['1', '2', '3', '-'], start: 'S0', accepting: ['S4', 'S8'], implicitError: true,
      delta: {
        S0: { '1, 3': 'S1', 2: 'S2' },
        S1: { '1, 3': 'S2', 2: 'S1', '-': 'S3' },
        S2: { '1, 3': 'S1', 2: 'S2', '-': 'S6' },
        S3: { '1, 3': 'S4', 2: 'S5' },
        S4: { '1, 3': 'S5', 2: 'S4' },
        S5: { '1, 3': 'S4', 2: 'S5' },
        S6: { '1, 3': 'S7', 2: 'S8' },
        S7: { '1, 3': 'S8', 2: 'S7' },
        S8: { '1, 3': 'S7', 2: 'S8' },
      } },
    klassen: [['S3', 'S5', 'S7'], ['S4', 'S8']],
    beispiele: { ja: ['113-22133', '1-1', '2-2', '22-321', '22-2'], nein: ['12332-1223', '1-2', '2-1', '-', '12', '1-', '1--1'] },
    merke: 'Nach dem Trennzeichen zählt nur noch: „Würde die Eingabe jetzt akzeptiert?“ und „Was passiert mit einer ungeraden Ziffer?“ Darum fallen S3, S5, S7 und S4, S8 zusammen – S6 bleibt allein.',
  },
];

/** Bedeutungen der Zustände (Hilfe im „Unterscheide!“-Spiel). */
export const MINIMIERER_BEDEUTUNG = {
  quersumme: { S0: 'noch nichts gelesen', S1: 'erste Folge: Quersumme ungerade', S2: 'erste Folge: Quersumme gerade', S3: 'erste ungerade, zweite noch leer', S4: 'erste ungerade, zweite ungerade', S5: 'erste ungerade, zweite gerade', S6: 'erste gerade, zweite noch leer', S7: 'erste gerade, zweite ungerade', S8: 'erste gerade, zweite gerade' },
};
