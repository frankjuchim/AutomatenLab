// Mealy-Automaten für die Mealy-Maschine (#/mealy, DS06 „Automaten, die antworten“).
// Notation (Ergänzende Hinweise 2025): Kante „Eingabezeichen / Ausgabe“, Ausgabe darf ein Wort über Ω
// sein, leere Ausgabe = ε. Mealy-Automaten haben KEINE Endzustände.
//
// So ergänzt du einen Automaten (hinten anhängen, damit ?aufgabe=n-Links stabil bleiben):
//   id, titel, kontext   wie in den anderen Datendateien
//   automat              Engine-Format: delta: { S0: { M: ['S1', 'ε'] } }  (Ziel, Ausgabe)
//   bedeutung            optional: Bedeutung der Zustände
//   beispiele            [[Eingabe, erwartete Ausgabe], …] – wird getestet
//   vorhersage           Eingabewörter für „Was kommt raus?“
//   fehler               Bug-Jagd: Liste falscher Kantenausgaben { von, zeichen, ausgabe } – der
//                        fehlerhafte Automat entsteht aus der Referenz, indem diese Ausgaben ersetzt werden
//   fehlerText           Auftrag zur Bug-Jagd (was der Automat eigentlich tun soll)
//   pruefe(w)            optional: Funktion Eingabewort (Array) → erwartete Ausgabe (String) – Test bis Länge ~8
//   stufe                Bug-Jagd: 1 Basis, 2 Standard, 3 Profi (Punkte 10/20/30, Vertrag §9)
//
// Liegt in inhalte/ (nur Server, Vertrag InfoLabs §9): Die Bug-Jagd-Fehler sind die Lösung. Die Referenz selbst ist in
// „Was kommt raus?“ ohnehin sichtbar (sie ist dort Gegenstand der Aufgabe).

const D = (n) => String(n);

export const MEALY_AUFGABEN = [
  {
    id: 'suessigkeiten', stufe: 1, titel: 'Süßigkeitenautomat',
    kontext: 'Erst eine Münze einwerfen (M), dann den Hebel ziehen (H): Dann kommt ein Bonbon (B). Weitere Münzen werden ohne Wirkung geschluckt; Hebelziehen ohne Münze bewirkt nichts.',
    automat: { inputAlphabet: ['M', 'H'], outputAlphabet: ['B'], start: 'S0',
      delta: { S0: { M: ['S1', 'ε'], H: ['S0', 'ε'] }, S1: { M: ['S1', 'ε'], H: ['S0', 'B'] } } },
    bedeutung: { S0: 'keine Münze im Automaten', S1: 'Münze eingeworfen' },
    beispiele: [['MH', 'B'], ['HMH', 'B'], ['MHMH', 'BB'], ['MMH', 'B'], ['HH', 'ε'], ['M', 'ε']],
    vorhersage: ['MH', 'HMHH', 'MHMHM', 'MMHH'],
    fehler: [{ von: 'S0', zeichen: 'H', ausgabe: 'B' }],
    fehlerText: 'Der Automat soll nur nach Münze und Hebel ein Bonbon ausgeben. Der Betreiber beschwert sich aber über verschwundene Bonbons.',
    pruefe: (w) => { let m = false; let o = ''; for (const c of w) { if (c === 'M') m = true; else if (m) { o += 'B'; m = false; } } return o; },
  },
  {
    id: 'kartoffel', stufe: 1, titel: 'Kartoffelautomat (4 €)',
    kontext: 'Ein Sack Kartoffeln kostet 4 €. Der Automat nimmt 1-€- und 2-€-Münzen. Sobald 4 € erreicht sind, gibt er Kartoffeln (K) aus; bei 5 € zusätzlich 1 € Rückgeld (1).',
    automat: { inputAlphabet: ['1', '2'], outputAlphabet: ['1', 'K'], start: 'S0',
      delta: { S0: { 1: ['S1', 'ε'], 2: ['S2', 'ε'] }, S1: { 1: ['S2', 'ε'], 2: ['S3', 'ε'] },
        S2: { 1: ['S3', 'ε'], 2: ['S0', 'K'] }, S3: { 1: ['S0', 'K'], 2: ['S0', 'K1'] } } },
    bedeutung: { S0: '0 € bezahlt', S1: '1 € bezahlt', S2: '2 € bezahlt', S3: '3 € bezahlt' },
    beispiele: [['22', 'K'], ['1111', 'K'], ['122', 'K1'], ['212', 'K1'], ['2222', 'KK'], ['2', 'ε']],
    vorhersage: ['112', '1212', '2221', '1122'],
    fehler: [{ von: 'S3', zeichen: '2', ausgabe: 'K' }],
    fehlerText: 'Bei 4 € soll es Kartoffeln geben, bei 5 € zusätzlich 1 € Rückgeld. Einige Kundinnen fühlen sich betrogen.',
    pruefe: (w) => { let s = 0; let o = ''; for (const c of w) { s += Number(c); if (s >= 4) { o += s === 5 ? 'K1' : 'K'; s = 0; } } return o; },
  },
  {
    id: 'addierer', stufe: 2, titel: 'Ziffernaddierer',
    kontext: 'Der Automat liest immer zwei Ziffern aus {0, 1, 2, 3} und gibt nach der zweiten Ziffer deren Summe aus. Beispiel: 13 liefert 4, 30 liefert 3.',
    automat: { inputAlphabet: ['0', '1', '2', '3'], outputAlphabet: ['0', '1', '2', '3', '4', '5', '6'], start: 'S0',
      delta: Object.fromEntries([
        ['S0', Object.fromEntries([0, 1, 2, 3].map((d) => [D(d), [`S${d + 1}`, 'ε']]))],
        ...[0, 1, 2, 3].map((d) => [`S${d + 1}`, Object.fromEntries([0, 1, 2, 3].map((e) => [D(e), ['S0', D(d + e)]]))]),
      ]) },
    bedeutung: { S0: 'Warten auf die erste Ziffer', S1: 'erste Ziffer 0', S2: 'erste Ziffer 1', S3: 'erste Ziffer 2', S4: 'erste Ziffer 3' },
    beispiele: [['13', '4'], ['30', '3'], ['33', '6'], ['1322', '44'], ['2', 'ε'], ['00', '0']],
    vorhersage: ['21', '3312', '0321', '123'],
    fehler: [{ von: 'S4', zeichen: '3', ausgabe: '5' }, { von: 'S3', zeichen: '2', ausgabe: '5' }],
    fehlerText: 'Der Automat soll je zwei Ziffern addieren. Ein Schüler hat ihn abgetippt – dabei sind zwei Ausgaben falsch geworden.',
    pruefe: (w) => { let o = ''; for (let i = 0; i + 1 < w.length; i += 2) o += String(Number(w[i]) + Number(w[i + 1])); return o; },
  },
  {
    id: 'frog', stufe: 3, titel: 'Lauflängen-Kompressor (Frog, angelehnt an Abitur 2022)',
    kontext: 'Ein Frosch hüpft (h) und dreht sich (d), # schließt die Befehlsfolge ab. Bis zu drei gleiche Befehle in Folge werden zusammengefasst: Aus hdddhhhhhdhh# wird 1h3d3h2h1d2h#. Die Zahl bezieht sich auf den folgenden Buchstaben.',
    automat: { inputAlphabet: ['h', 'd', '#'], outputAlphabet: ['1', '2', '3', 'h', 'd', '#'], start: 'S0',
      states: ['S0', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6'],
      delta: {
        S0: { h: ['S1', 'ε'], d: ['S4', 'ε'], '#': ['S0', '#'] },
        S1: { h: ['S2', 'ε'], d: ['S4', '1h'], '#': ['S0', '1h#'] },
        S2: { h: ['S3', 'ε'], d: ['S4', '2h'], '#': ['S0', '2h#'] },
        S3: { h: ['S1', '3h'], d: ['S4', '3h'], '#': ['S0', '3h#'] },
        S4: { d: ['S5', 'ε'], h: ['S1', '1d'], '#': ['S0', '1d#'] },
        S5: { d: ['S6', 'ε'], h: ['S1', '2d'], '#': ['S0', '2d#'] },
        S6: { d: ['S4', '3d'], h: ['S1', '3d'], '#': ['S0', '3d#'] },
      } },
    bedeutung: { S0: 'kein Befehl offen', S1: 'ein h noch nicht ausgegeben', S2: 'zwei h offen', S3: 'drei h offen', S4: 'ein d offen', S5: 'zwei d offen', S6: 'drei d offen' },
    beispiele: [['hdddhhhhhdhh#', '1h3d3h2h1d2h#'], ['hdddh#', '1h3d1h#'], ['ddhhh#', '2d3h#'], ['#', '#'], ['dddd#', '3d1d#']],
    vorhersage: ['hhd#', 'dhhhh#', 'hdddh#', 'ddhhh#'],
    fehler: [{ von: 'S6', zeichen: 'h', ausgabe: '3h' }, { von: 'S3', zeichen: '#', ausgabe: '3h' }],
    fehlerText: 'Wie in der Abituraufgabe arbeitet der Kompressor noch fehlerhaft. Teste z. B. hdddh# und ddhhh# – und repariere die Kantenbeschriftungen.',
    pruefe: (w) => {
      let o = ''; let cur = null; let n = 0;
      const flush = () => { if (cur) o += `${n}${cur}`; cur = null; n = 0; };
      for (const c of w) {
        if (c === '#') { flush(); o += '#'; continue; }
        if (c === cur && n < 3) n++;
        else { flush(); cur = c; n = 1; }
      }
      return o;
    },
  },
  {
    id: 'palindrom', stufe: 3, titel: 'Palindrom-Generator (angelehnt an Abitur 2024 Nachtermin)',
    kontext: 'Der Automat liest jeweils 3 Bit und gibt ein 5-stelliges Palindrom aus: erst die drei Bits, dann die ersten beiden in umgekehrter Reihenfolge. Aus 011 wird 01110.',
    automat: { inputAlphabet: ['0', '1'], outputAlphabet: ['0', '1'], start: 'S0',
      delta: {
        S0: { 0: ['S1', '0'], 1: ['S2', '1'] },
        S1: { 0: ['S3', '0'], 1: ['S4', '1'] },
        S2: { 0: ['S5', '0'], 1: ['S6', '1'] },
        S3: { 0: ['S0', '000'], 1: ['S0', '100'] },
        S4: { 0: ['S0', '010'], 1: ['S0', '110'] },
        S5: { 0: ['S0', '001'], 1: ['S0', '101'] },
        S6: { 0: ['S0', '011'], 1: ['S0', '111'] },
      } },
    bedeutung: { S0: 'neuer Block beginnt', S1: 'erstes Bit 0', S2: 'erstes Bit 1', S3: 'bisher 00', S4: 'bisher 01', S5: 'bisher 10', S6: 'bisher 11' },
    beispiele: [['011', '01110'], ['100', '10001'], ['000111', '0000011111'], ['01', '01']],
    vorhersage: ['110', '001', '101010', '1110'],
    fehler: [{ von: 'S5', zeichen: '0', ausgabe: '100' }],
    fehlerText: 'Jeder 3-Bit-Block soll zu einem 5-stelligen Palindrom werden. Für einen der acht Blöcke stimmt das nicht.',
    pruefe: (w) => { let o = ''; for (let i = 0; i < w.length; i++) { o += w[i]; if (i % 3 === 2) o += w[i - 1] + w[i - 2]; } return o; },
  },
  {
    id: 'caesar', stufe: 1, titel: 'Caesar-Verschiebung',
    kontext: 'Jeder Buchstabe aus {A, B, C, D} wird um eine Stelle verschoben: A → B, B → C, C → D und D → A (das Alphabet ist ein Kreis).',
    automat: { inputAlphabet: ['A', 'B', 'C', 'D'], outputAlphabet: ['A', 'B', 'C', 'D'], start: 'S0',
      delta: { S0: { A: ['S0', 'B'], B: ['S0', 'C'], C: ['S0', 'D'], D: ['S0', 'A'] } } },
    bedeutung: { S0: 'ein Zustand genügt: die Verschiebung hängt nicht von der Vorgeschichte ab' },
    beispiele: [['ABCD', 'BCDA'], ['DAD', 'ABA'], ['', 'ε']],
    vorhersage: ['CAB', 'DDA', 'BAD'],
    fehler: [{ von: 'S0', zeichen: 'D', ausgabe: 'D' }],
    fehlerText: 'Jeder Buchstabe soll um eine Stelle verschoben werden – auch der letzte Buchstabe des Alphabets.',
    pruefe: (w) => w.map((c) => 'ABCD'['ABCD'.indexOf(c) + 1] ?? 'A').join(''),
  },
  {
    id: 'vigenere', stufe: 2, titel: 'Wechselnde Verschiebung (1, 2, 1, 2, …)',
    kontext: 'Wie Caesar, aber die Verschiebung wechselt: Das 1., 3., 5. … Zeichen wird um 1 verschoben, das 2., 4., 6. … um 2. Dafür muss sich der Automat etwas merken.',
    automat: { inputAlphabet: ['A', 'B', 'C', 'D'], outputAlphabet: ['A', 'B', 'C', 'D'], start: 'S0',
      delta: { S0: { A: ['S1', 'B'], B: ['S1', 'C'], C: ['S1', 'D'], D: ['S1', 'A'] },
        S1: { A: ['S0', 'C'], B: ['S0', 'D'], C: ['S0', 'A'], D: ['S0', 'B'] } } },
    bedeutung: { S0: 'nächstes Zeichen: +1', S1: 'nächstes Zeichen: +2' },
    beispiele: [['AAAA', 'BCBC'], ['DD', 'AB'], ['CC', 'DA']],
    vorhersage: ['ABAB', 'DCBA', 'CAD'],
    fehler: [{ von: 'S1', zeichen: 'D', ausgabe: 'A' }],
    fehlerText: 'Abwechselnd um 1 und um 2 verschieben. Bei einem Buchstaben verrechnet sich der Automat.',
    pruefe: (w) => w.map((c, i) => 'ABCD'[('ABCD'.indexOf(c) + (i % 2 ? 2 : 1)) % 4]).join(''),
  },
];
