const __MAT = require('path').resolve(__dirname, '../..'); // Wurzel: materials/
// M11 – Merkblatt „Turingmaschine (Ausblick)“ (Level 16)
const D = require((__MAT + '/lib/docstyle.js'));
const fs = require('fs');
const IMG = (__MAT + '/build/img/ds16/');
const OUT = (__MAT + '/out/');
const TR = JSON.parse(fs.readFileSync(IMG + 'traces.json', 'utf8'));

(async () => {
  const body = [
    D.h2('1  Aufbau'),
    D.table([
      ['Bestandteil', 'Bedeutung'],
      ['Band', 'beidseitig unbegrenzte Folge von Feldern; die Eingabe steht am Anfang auf dem Band, alle anderen Felder enthalten das Blank □'],
      ['Schreib-Lese-Kopf', 'steht auf genau einem Feld; liest das Zeichen, überschreibt es und bewegt sich um ein Feld nach links (L), rechts (R) oder bleibt stehen (N)'],
      ['Zustände Q', 'endlich viele, Startzustand S0, Endzustände F (Doppelkreis)'],
      ['Eingabealphabet Σ, Bandalphabet Γ', 'Σ ⊂ Γ; Γ enthält zusätzlich □ und Hilfszeichen (z. B. X, Y, Z als Markierungen). □ ist kein Zeichen von Σ.'],
      ['Übergangsfunktion δ', '**(Zustand, gelesenes Zeichen) → (Folgezustand, geschriebenes Zeichen, Bewegung)**'],
    ], { widthsCm: [4.2, 13.2], size: 19, firstColBold: true }),
    ...D.bullets([
      'Start: Zustand S0, Kopf auf dem **ersten Zeichen** der Eingabe.',
      'Gibt es für (Zustand, gelesenes Zeichen) keinen Übergang, **hält** die Maschine. Hält sie in einem Endzustand, ist die Eingabe **akzeptiert**; der Bandinhalt ist die **Ausgabe**.',
      'Kantenbeschriftung im Zustandsgraphen: **gelesen / geschrieben, Bewegung** – z. B. „1 / 0, L“: lies 1, schreibe 0, gehe nach links.',
    ], { size: 20 }),
    D.h2('2  Mini-Beispiel: Binärzahl + 1'),
    D.img(IMG + 'tm_binplus.png', { widthCm: 8.5, caption: 'Σ = {0, 1}, Γ = {0, 1, □}. S0: ans rechte Ende laufen · S1: Übertrag nach links tragen (1 → 0), erste 0 oder □ wird zur 1 · S2: fertig' }),
    D.small(`**Konfigurationsfolge** (Verarbeitung darstellen: Zustand, Bandinhalt, Kopfposition in eckigen Klammern). Eingabe 1011 (= 11) → Ausgabe ${TR.bin_1011.output} (= 12) nach ${TR.bin_1011.steps} Schritten; Halt in S2 (Endzustand). Bei 111 wird das Blank links der Zahl zur führenden 1: 1000.`),
    D.table([['Schritt', 'Zustand', 'Band', 'Übergang'], ...TR.bin_1011.rows.map((r) => [r[0], r[1], r[2], r[3] || '–'])], { widthsCm: [1.6, 1.8, 9.0, 5.0], size: 17, center: [0, 1] }),
    D.h2('3  Was die Turingmaschine mehr kann'),
    D.table([
      ['Modell', 'Gedächtnis', 'liest', 'typische Sprache', 'Grammatik'],
      ['DEA / NEA', 'nur der Zustand', 'einmal, von links nach rechts', 'regulär (Typ 3): enthält LOL, Vielfache von 3', 'rechtsregulär A → aB | a | ε'],
      ['Kellerautomat', 'Zustand + Keller (LIFO)', 'einmal, von links nach rechts', 'kontextfrei (Typ 2): aⁿbⁿ, Klammern, Palindrome', 'kontextfrei S → aSb | ε'],
      ['Turingmaschine', 'Zustand + Band (lesen und schreiben, beliebig bewegen)', 'beliebig oft, hin und her', 'Typ 1: aⁿbⁿcⁿ; Typ 0: alles Berechenbare', 'kontextsensitive bzw. allgemeine Regeln'],
    ], { widthsCm: [2.8, 4.2, 3.0, 4.4, 3.0], size: 17, firstColBold: true }),
    D.p('**aⁿbⁿcⁿ:** Der Keller kann nur einmal abgezählt werden – nach dem Vergleich der b ist die Anzahl der a verbraucht. Die Turingmaschine **markiert** stattdessen in jeder Runde ein a, ein b und ein c (X, Y, Z) und läuft zurück; die Markierungen bleiben auf dem Band erhalten.', { size: 20 }),
    ...D.merke('Church-Turing-These und Halteproblem', [
      D.p('**Church-Turing-These:** Alles, was mit einem Algorithmus berechenbar ist, kann eine Turingmaschine berechnen. Jeder Computer und jede Programmiersprache ist genauso mächtig wie dieses Modell – nicht mächtiger. (Eine These, kein beweisbarer Satz.)', { size: 20 }),
      D.p('**Halteproblem (Turing 1936):** Es gibt keinen Algorithmus, der für **jedes** Programm mit **jeder** Eingabe entscheidet, ob es hält. Beweisidee: Ein Programm TROTZ fragt das angebliche Prüfprogramm HALT nach sich selbst und tut das Gegenteil – HALT irrt sich in jedem Fall. Das ist keine Frage der Rechenzeit, sondern eine prinzipielle Grenze.', { size: 20 }),
    ]),
    D.h2('4  Fleißiger Biber (Rätsel)'),
    D.p('Der fleißige Biber mit n Zuständen ist die haltende Maschine, die auf leerem Band die meisten Einsen schreibt: BB(1) = 1, BB(2) = 4, BB(3) = 6, BB(4) = 13, BB(5) = 4098 (bewiesen 2024). BB(6) ist unbekannt (mindestens 10↑↑15). Die Funktion wächst schneller als jede berechenbare Funktion – ein Beispiel für die Grenzen der Berechenbarkeit.', { size: 20 }),
    D.h2('5  Abi-Check'),
    D.table([
      ['Hinweis', 'So gehst du vor'],
      ['Die Turingmaschine ist **nicht prüfungsrelevant** – aber die Grenzen der anderen Modelle sind es.', '„Begründen Sie die Verwendung eines Kellerautomaten“: Zeigen, dass unbeschränkt gezählt oder verglichen werden muss (DEA scheitert), und dass ein Keller genau **einen** Vergleich leistet (aⁿbⁿ, Klammern). Für zwei gekoppelte Vergleiche (aⁿbⁿcⁿ) reicht auch der Keller nicht – Ausblick auf die Turingmaschine.'],
      ['Verarbeitung darstellen', 'Bei Automaten: Zustandsfolge bzw. Kellertabelle; bei der Turingmaschine (nur im Unterricht): Konfigurationsfolge mit Band und Kopfposition.'],
    ], { widthsCm: [5.4, 12.0], size: 18, firstColBold: true }),
  ];
  const f = await D.save(D.doc({ kind: 'MB', niveau: 'plus', title: 'Turingmaschine (Ausblick)', subtitle: 'Merkblatt M11 · Level 16 · Band, Kopf, Übergänge, Grenzen der Berechenbarkeit', metaText: 'M11  ·  Welt D', code: 'M11 · Merkblatt Turingmaschine', body }), OUT + 'M11_Merkblatt_Turingmaschine.docx');
  console.log(f);
})();
