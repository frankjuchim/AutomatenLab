// Turing-Labor (#/turing): Programme für den Simulator (DS16). Deep-Link: #/turing?programm=<id>, #/turing?challenge=1
//
//   id, titel, kontext   Anzeige
//   maschine             TM im Engine-Format (js/engine/turing.js); Übergang: [Folgezustand, geschrieben, Bewegung]
//   eingaben             Vorschläge (Chips)
//   bedeutung            Bedeutung der Zustände (optional)
//   erwartet             für die Tests: { eingabe: ausgabe } (Bandinhalt nach dem Halten) bzw. akzeptiert: {…: true/false}
//   biber                true → Zähler „Einsen auf dem Band“ und Schrittzahl im Vordergrund

export const TURING_PROGRAMME = [
  {
    id: 'binaer-plus-1', titel: 'Binärzahl + 1', kontext: 'Der Kopf steht auf der ersten Ziffer. Die Maschine läuft ans Ende, addiert 1 und trägt Überträge nach links.',
    maschine: {
      alphabet: ['0', '1'], start: 'S0', accepting: ['S2'],
      delta: {
        S0: { '0': ['S0', '0', 'R'], '1': ['S0', '1', 'R'], '□': ['S1', '□', 'L'] },
        S1: { '1': ['S1', '0', 'L'], '0': ['S2', '1', 'N'], '□': ['S2', '1', 'N'] },
        S2: {},
      },
    },
    bedeutung: { S0: 'ans rechte Ende laufen', S1: 'Übertrag nach links tragen (1 → 0), erste 0 oder □ wird zur 1', S2: 'fertig' },
    eingaben: ['1011', '111', '0', '1111'],
    erwartet: { ausgabe: { 1011: '1100', 111: '1000', 0: '1', 1111: '10000', 10: '11' } },
  },
  {
    id: 'anbncn', titel: 'aⁿbⁿcⁿ erkennen', kontext: 'Was kein Kellerautomat schafft: Die Maschine markiert in jeder Runde ein a (X), ein b (Y) und ein c (Z) und läuft zurück. Bleibt nichts übrig, wird akzeptiert.',
    maschine: {
      alphabet: ['a', 'b', 'c'], tapeAlphabet: ['X', 'Y', 'Z'], start: 'S0', accepting: ['S5'],
      delta: {
        S0: { a: ['S1', 'X', 'R'], Y: ['S4', 'Y', 'R'] },
        S1: { a: ['S1', 'a', 'R'], Y: ['S1', 'Y', 'R'], b: ['S2', 'Y', 'R'] },
        S2: { b: ['S2', 'b', 'R'], Z: ['S2', 'Z', 'R'], c: ['S3', 'Z', 'L'] },
        S3: { a: ['S3', 'a', 'L'], b: ['S3', 'b', 'L'], Y: ['S3', 'Y', 'L'], Z: ['S3', 'Z', 'L'], X: ['S0', 'X', 'R'] },
        S4: { Y: ['S4', 'Y', 'R'], Z: ['S4', 'Z', 'R'], '□': ['S5', '□', 'N'] },
        S5: {},
      },
    },
    bedeutung: { S0: 'nächstes a markieren (oder: alle a verbraucht → prüfen)', S1: 'nach rechts bis zum nächsten b', S2: 'nach rechts bis zum nächsten c', S3: 'zurück zum letzten X', S4: 'prüfen, ob nur noch Y und Z übrig sind', S5: 'akzeptiert' },
    eingaben: ['abc', 'aabbcc', 'aabbc', 'abcabc', 'aaabbbccc'],
    erwartet: { akzeptiert: { abc: true, aabbcc: true, aaabbbccc: true, aabbc: false, abcabc: false, ab: false, acb: false, '': false, aabcc: false } },
  },
  {
    id: 'unaer-plus', titel: 'Unärer Addierer', kontext: 'Zahlen als Strichliste: 111 + 11 = 11111. Die Maschine ersetzt das Plus durch eine 1 und löscht am Ende eine 1.',
    maschine: {
      alphabet: ['1', '+'], start: 'S0', accepting: ['S3'],
      delta: {
        S0: { '1': ['S0', '1', 'R'], '+': ['S1', '1', 'R'] },
        S1: { '1': ['S1', '1', 'R'], '□': ['S2', '□', 'L'] },
        S2: { '1': ['S3', '□', 'N'] },
        S3: {},
      },
    },
    bedeutung: { S0: 'bis zum + laufen und es durch 1 ersetzen', S1: 'ans rechte Ende laufen', S2: 'letzte 1 löschen', S3: 'fertig' },
    eingaben: ['111+11', '1+1', '1111+', '+111'],
    erwartet: { ausgabe: { '111+11': '11111', '1+1': '11', '1111+': '1111', '+111': '111' } },
  },
  {
    id: 'biber-2', titel: 'Fleißiger Biber (2 Zustände)', kontext: 'Start auf leerem Band. Welche Maschine mit 2 Zuständen schreibt die meisten Einsen und hält trotzdem? Diese: 4 Einsen in 6 Schritten.',
    biber: true,
    maschine: {
      alphabet: ['1'], start: 'A', accepting: ['H'],
      delta: {
        A: { '□': ['B', '1', 'R'], '1': ['B', '1', 'L'] },
        B: { '□': ['A', '1', 'L'], '1': ['H', '1', 'R'] },
        H: {},
      },
    },
    eingaben: [''],
    erwartet: { einsen: 4, schritte: 6 },
  },
  {
    id: 'biber-3', titel: 'Fleißiger Biber (3 Zustände)', kontext: 'Mit 3 Zuständen: 6 Einsen in 14 Schritten – mehr Einsen schafft keine Maschine mit 3 Zuständen, die hält. Für 5 Zustände sind es schon über 47 Millionen Schritte, für 6 ist die Zahl unvorstellbar groß.',
    biber: true,
    maschine: {
      alphabet: ['1'], start: 'A', accepting: ['H'],
      delta: {
        A: { '□': ['B', '1', 'R'], '1': ['H', '1', 'R'] },
        B: { '□': ['C', '□', 'R'], '1': ['B', '1', 'R'] },
        C: { '□': ['C', '1', 'L'], '1': ['A', '1', 'L'] },
        H: {},
      },
    },
    eingaben: [''],
    erwartet: { einsen: 6, schritte: 14 },
  },
];

// Die Challenges „Übergangstabelle vervollständigen“ (fehlende Regel, Testeingaben) liegen in inhalte/turing.js (nur Server).
