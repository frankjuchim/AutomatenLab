const __MAT = require('path').resolve(__dirname, '../..'); // Wurzel: materials/
// DS10 – Level 10 „Keller-Profis“ (Abi-Werkstatt im Tandem) – AB, Lehrkraft-Handreichung, Folien
const D = require((__MAT + '/lib/docstyle.js'));
const S = require((__MAT + '/lib/deckstyle.js'));
const K = require((__MAT + '/content/ds09/kt.js'));
const J = require((__MAT + '/content/ds10/ds10.json'));
const IMG = (__MAT + '/build/img/ds10/');
const OUT = (__MAT + '/out/');
const T = 'Keller-Profis';
const SUB = 'Nichtdeterminismus im Keller, Analyse im Sachzusammenhang – Abi-Werkstatt';
const KF = 'Wann muss ein Kellerautomat „raten“ – und wie analysiere ich Kellerautomaten in Abi-Aufgaben?';
const FN = 'Keller-Profis';
const HINT = 'Alle nicht eingezeichneten Übergänge führen in einen Fehlerzustand.';
const BS = '\\';

/** Rückwärts-Tabelle (horizontal wie im Abitur): Zustand / Kellerspeicher / Eingabezeichen (leer oder Lösung). */
function rwTable(seq, solution) {
  const n = seq.length;
  const w = [3.2, ...Array(n).fill((17.4 - 3.2) / n)];
  return D.table([
    ['Zustand', ...seq.map((x) => x[0])],
    ['Kellerspeicher', ...seq.map((x) => x[1])],
    ['Eingabezeichen', '–', ...(solution ? solution : Array(n - 1).fill(''))],
  ], { widthsCm: w, size: 19, header: false, firstColBold: true, firstColFill: true, center: [...Array(n + 1).keys()].slice(1), rowHeightCm: 0.75 });
}
const raster = (rows) => {
  const tot = rows.reduce((x, r) => x + r[1], 0);
  const n = rows.length;
  return [
    ...D.table([
      ['Korrektor', ...rows.map((r) => `${r[0]})`), 'Summe'].map((c) => D.p(c, { size: 18, bold: true, color: D.C.white, keepNext: true, align: c === 'Korrektor' ? undefined : 'center', after: 0 })),
      ['BE (max.)', ...rows.map((r) => String(r[1])), String(tot)].map((c, i) => D.p(c, { size: 18, bold: i === 0, keepNext: true, align: i ? 'center' : undefined, after: 0 })),
      ['BE erreicht', ...rows.map(() => ''), ''],
    ], { widthsCm: [3.0, ...Array(n).fill((17.4 - 3.0 - 2.4) / n), 2.4], size: 18, header: true, firstColBold: true, center: [...Array(n + 2).keys()].slice(1), rowHeightCm: 0.6 }),
  ];
};

// =====================================================================================  Arbeitsblatt
async function ab() {
  const body = [
    D.p('Im Abitur werden Kellerautomaten fast immer **im Sachzusammenhang** geprüft: Verarbeitung dokumentieren, Bedeutung des Kellers erläutern, Eingabewort aus einer Zustandsfolge bestimmen, Grenzen begründen. Heute wirst du zum **Keller-Profi** – erst mit einem Blick auf Automaten, die raten müssen, dann in der **Abi-Werkstatt** im Tandem.'),
    D.h2('Teil A – Raten im Keller'),
    D.task({ nr: 1, title: 'Palindrome mit Mittelzeichen', niveau: 'Basis', afb: 'I–II', body: [
      D.p('Gesucht sind Wörter der Form w c w^R^: ein Wort w aus a und b, dann c, dann w rückwärts (z. B. `abcba`). Σ = {a, b, c}, Γ = {#, A, B}.', { keepNext: true }),
      D.img(IMG + 'palindrom_c.png', { widthCm: 10.5, caption: `Abbildung 1: Kellerautomat (DKA) für w c wᴿ. ${HINT}` }),
      D.sub('a', '**Dokumentiere** die Verarbeitung der Eingabe `abcba`.'),
      ...K.blank(7),
      D.sub('b', '**Erläutere** die Bedeutung des Kellerspeichers und **begründe**, warum dieser Automat deterministisch ist (DKA).'),
      ...D.lines(2),
    ] }),
    D.task({ nr: 2, title: 'Ohne Mittelzeichen: Mitte raten', niveau: 'Standard', afb: 'II–III', app: '#/keller?automat=palindrom', body: [
      D.p('Jetzt fehlt das c: Gesucht sind Palindrome **gerader Länge** w w^R^ (z. B. `abba`). Der Automat **rät** die Mitte mit einem ε-Übergang von S0 nach S1. Σ = {a, b}, Γ = {#, A, B}.', { keepNext: true }),
      D.img(IMG + 'palindrom.png', { widthCm: 10.5, caption: `Abbildung 2: Kellerautomat (NKA) für w wᴿ. ${HINT}` }),
      D.sub('a', 'Der Automat kann nach 0, 1, 2, 3 oder 4 gelesenen Zeichen nach S1 wechseln. **Untersuche** für die Eingabe `abba` jede Möglichkeit.'),
      D.table([['Wechsel nach S1 …', 'akzeptierender Lauf?', 'Begründung'], ...[0, 1, 2, 3, 4].map((k) => [`nach ${k} Zeichen`, '', ''])], { widthsCm: [4.0, 3.6, 9.8], size: 19, center: [0, 1], rowHeightCm: 0.75 }),
      D.sub('b', '**Begründe** mithilfe der Akzeptanzdefinition, dass `abba` akzeptiert und `abab` abgelehnt wird.'),
      ...D.lines(2),
      D.sub('c', 'Für w w^R^ gibt es **keinen** deterministischen Kellerautomaten (das lässt sich beweisen). **Erläutere** anschaulich, warum ein DKA hier überfordert ist, beim w c w^R^ aber nicht.'),
      ...D.lines(1),
    ] }),
    D.task({ nr: 3, title: 'Ausblick: Wo auch der Keller aufgibt', niveau: 'Profi', afb: 'III', body: [
      D.p('L = {a^n^b^n^c^n^ | n ≥ 1}, z. B. `aabbcc`. Idee: Für jedes a ein A ablegen, mit den b abbauen – und dann? (Man kann beweisen, dass **kein** Kellerautomat L erkennt; in Level 16 lernst du eine Maschine kennen, die es kann.)'),
      D.sub('a', '**Erläutere**, warum diese Idee für die c nicht mehr funktioniert. Probiere auch: „Für jedes a zwei Zeichen ablegen“.'),
      ...D.lines(2),
    ] }),
    D.qr({ route: '#/keller?automat=anbn&modus=rueckwaerts', title: 'Keller-Labor: Rückwärts-Aufgaben', text: 'Eingabewort aus einer Folge von Zuständen und Kellerbelegungen bestimmen – wie im Abitur. Über die Navigation unten („Nächste Rückwärts-Aufgabe“) wechselst du den Automaten (z. B. Prüfnummern, Palindrome).' }),
    D.h2('Teil B – Abi-Werkstatt im Tandem: Prüfling & Korrektor'),
    ...D.info('So läuft die Werkstatt', [
      ...D.numbered([
        '**Runde 1 (20 min):** Partner A bearbeitet als **Prüfling** Fall 1, Partner B Fall 2 – in Einzelarbeit, schriftlich, ohne Hilfen (Merkblatt M07 erlaubt).',
        '**Korrektur (10 min):** Heft tauschen. Jeder ist jetzt **Korrektor** für den Fall des anderen: Korrektorkarte (Erwartungshorizont) bei der Lehrkraft holen, BE vergeben, Kommentar ins Raster schreiben.',
        '**Feedback (5 min):** Korrektor erklärt dem Prüfling seine Bewertung (Kommentare direkt ins Heft) – Rückfragen erwünscht.',
        '**Runde 2 – Rollentausch (20 min):** Partner A bearbeitet Fall 3, Partner B Fall 4 – im Unterricht drei Teilaufgaben nach Wahl (12 min), dann Korrektur und Feedback (8 min). Den Rest bearbeitet ihr zu Hause.',
      ], { ref: 'numbers2' }),
      D.p('Die Aufgaben sind im **Abi-Format** (Sie-Form, BE). Fehlerzustände sind in allen Abbildungen weggelassen: *' + HINT + '*', { size: 20 }),
    ]),
    // ---------------- Fall 1
    D.task({ nr: 'F1', title: 'Fall 1 – Der Trainer-Keller', punkte: 11, body: [
      D.p('In einem Fußballmanager-Spiel werden die Ergebnisse einer Saison in chronologischer Reihenfolge eingelesen: **3** = Sieg, **1** = Unentschieden, **0** = Niederlage. Wird die Ergebnisfolge vom Kellerautomaten in Abbildung F1 akzeptiert, wird der Trainer entlassen. Σ = {3, 1, 0}, Γ = {#, S, N}.', { keepNext: true }),
      D.img(IMG + 'trainer.png', { widthCm: 9, caption: 'Abbildung F1: Kellerautomat zur Trainerentlassung' }),
      D.p('Abbildung F2: Folge von Zuständen und Kellerbelegungen', { size: 18, color: D.C.muted, keepNext: true }),
      ...rwTable(J.trainer.seq),
      D.sub('a', '**Bestimmen** Sie das Eingabewort für die in Abbildung F2 angegebene Folge von Zuständen und Kellerbelegungen. [3 BE]'),
      D.sub('b', '**Geben** Sie die hier zugrunde liegende Regel für eine Trainerentlassung **an**. [2 BE]'),
      D.sub('c', '**Erläutern** Sie die Bedeutung des Kellerspeichers im Sachzusammenhang. [3 BE]'),
      D.sub('d', '**Untersuchen** Sie, ob sich statt des Kellerautomaten auch ein deterministischer endlicher Automat verwenden lässt, um diese Regel umzusetzen. [3 BE]'),
      ...raster([['a', 3], ['b', 2], ['c', 3], ['d', 3]]),
    ] }),
    // ---------------- Fall 2
    D.task({ nr: 'F2', title: 'Fall 2 – Landschaften mit Seen', punkte: 11, body: [
      D.p(`Ein Jump-and-Run-Spiel erzeugt Landschaften aus Zeichenfolgen: **_** = ebenes Stück, **${BS}** = eine Stufe abwärts, **/** = eine Stufe aufwärts. Eine gültige Landschaft beginnt und endet auf Grundhöhe und liegt nie über der Grundhöhe – sie enthält also nur Seen, die auch Stufen haben dürfen, z. B. \`_${BS}${BS}_//_\`. Σ = {_, ${BS}, /}, Γ = {#, T}.`, { keepNext: true }),
      D.img(IMG + 'spielfeld.png', { widthCm: 5.8, caption: 'Abbildung F3: Kellerautomat zur Prüfung der Landschaften' }),
      D.sub('a', `**Dokumentieren** Sie die Verarbeitung der Eingabe \`${BS}_${BS}//\` in Form einer Tabelle. [3 BE]`),
      D.sub('b', '**Beschreiben** Sie im Sachzusammenhang, welche Bedeutung der Kellerspeicher des Automaten hat. [2 BE]'),
      D.sub('c', '**Erläutern** Sie die Funktion des Übergangs von Zustand S1 zu Zustand S0. [2 BE]'),
      D.sub('d', `**Begründen** Sie, dass der Automat keine Landschaften mit Hügeln akzeptiert, z. B. \`_/${BS}_\`. [2 BE]`),
      D.sub('e', '**Erörtern** Sie, welche Vorteile die Verwendung eines Kellerautomaten im Vergleich zu einem DEA für die Prüfung der Landschaften bietet. [2 BE]'),
      ...raster([['a', 3], ['b', 2], ['c', 2], ['d', 2], ['e', 2]]),
    ] }),
    // ---------------- Fall 3
    D.task({ nr: 'F3', title: 'Fall 3 – Prüfnummern mit Kriterium V', punkte: 12, body: [
      D.p('Prüfnummern über Σ = {1, 2, 3, -} bestehen aus zwei nichtleeren Ziffernfolgen, getrennt durch „-“. **Kriterium V:** Die Anzahl der Zeichen der ersten Ziffernfolge ist gleich der Quersumme der zweiten Ziffernfolge. Beispiel: `2131-31` erfüllt Kriterium V (4 Zeichen, 3 + 1 = 4). Der Kellerautomat in Abbildung F4 akzeptiert genau diese Prüfnummern. Γ = {#, A}.', { keepNext: true }),
      D.img(IMG + 'kriterium_v.png', { widthCm: 12, caption: 'Abbildung F4: Kellerautomat für Kriterium V' }),
      D.sub('a', '**Begründen** Sie in Bezug auf die Problemstellung die Verwendung eines Kellerautomaten. [3 BE]'),
      D.sub('b', '**Dokumentieren** Sie die Verarbeitung der Prüfnummer `111-21` in Form einer Tabelle. [4 BE]'),
      D.sub('c', '**Erläutern** Sie die Funktion der Zustände S3 und S4. [3 BE]'),
      D.sub('d', '**Untersuchen** Sie, ob die Prüfnummer `12-3` akzeptiert wird. [2 BE]'),
      ...raster([['a', 3], ['b', 4], ['c', 3], ['d', 2]]),
    ] }),
    // ---------------- Fall 4
    D.task({ nr: 'F4', title: 'Fall 4 – Vorgangsprotokolle am Kartoffelautomaten', punkte: 13, body: [
      D.p('Ein Kartoffelautomat verkauft einen Sack für **4 €** und nimmt 1-€- und 2-€-Münzen an. Wird zu viel gezahlt, gibt er 1 € zurück. Vorgänge: **1** / **2** = Einwurf einer 1-€- / 2-€-Münze, **K** = Ausgabe eines Sacks, **E** = Ausgabe einer 1-€-Münze. Ein **Vorgangsprotokoll** ist eine Folge dieser Symbole, z. B. `212KE`. Der Kellerautomat in Abbildung F5 akzeptiert genau die Protokolle, die zu einer korrekten Arbeitsweise gehören. Σ = {1, 2, K, E}, Γ = {#, e, r}.', { keepNext: true }),
      D.img(IMG + 'kartoffel_keller.png', { widthCm: 13, caption: 'Abbildung F5: Kellerautomat zur Prüfung der Vorgangsprotokolle' }),
      D.sub('a', '**Analysieren** Sie, ob die Vorgangsprotokolle `212KE` und `1122KE` zu einer korrekten Arbeitsweise gehören. [2 BE]'),
      D.sub('b', '**Beschreiben** Sie die Arbeitsschritte des Kellerautomaten beim Übergang von S0 nach S1. [2 BE]'),
      D.sub('c', '**Dokumentieren** Sie die Verarbeitung des Protokolls `1112KE` in Form einer Tabelle. [4 BE]'),
      D.sub('d', '**Erläutern** Sie im Sachzusammenhang die Funktion des Kellerspeichers. [2 BE]'),
      D.sub('e', '**Untersuchen** Sie, an welchen Stellen der Automat verändert werden muss, wenn sich der Preis ändert, und **beurteilen** Sie, ob für einen festen Preis auch ein DEA genügen würde. [3 BE]'),
      ...raster([['a', 2], ['b', 2], ['c', 4], ['d', 2], ['e', 3]]),
    ] }),
    D.h3('Selbstcheck – Level 10 geschafft, wenn …'),
    ...D.checklist([
      'ich erklären kann, wann ein Kellerautomat raten muss (w w^R^) und wann nicht (w c w^R^).',
      'ich die Akzeptanz eines NKA mit „es gibt einen akzeptierenden Lauf“ begründen kann.',
      'ich aus einer Folge von Zuständen und Kellerbelegungen das Eingabewort bestimme.',
      'ich die Bedeutung des Kellers im Sachzusammenhang präzise erläutern kann.',
      'ich beurteilen kann, ob ein DEA genügt oder ein Kellerautomat nötig ist.',
    ]),
  ];
  return D.save(D.doc({ kind: 'AB', ds: 10, title: T, subtitle: SUB, kernfrage: KF, body }), OUT + `DS10_AB_${FN}.docx`);
}

// =====================================================================================  Lehrkraft
async function lk() {
  const eh = (rows) => D.table([['Teil', 'Erwartete Leistung', 'BE', 'AFB'], ...rows], { widthsCm: [1.3, 13.1, 1.4, 1.6], size: 18, center: [0, 2, 3] });
  const tSeq = J.trainer.table.rows.slice(1).map((r) => r[3]);
  const sSeq = J.spielfeld.table.rows.slice(1).map((r) => r[3]);
  const body = [
    D.h2('Überblick'),
    D.table([
      ['Aspekt', 'Inhalt'],
      ['Lernziele', 'Die SuS unterscheiden DKA und NKA (Palindrome mit/ohne Mittelzeichen, ε-Übergang „Mitte raten“), begründen Akzeptanz/Ablehnung beim NKA über die Existenz eines akzeptierenden Laufs, bestimmen Eingabewörter aus Zustands-/Kellerfolgen, erläutern die Bedeutung des Kellers im Sachzusammenhang, beurteilen „DEA oder Kellerautomat?“ und kennen die Grenze a^n^b^n^c^n^ als Ausblick. Sie üben Abi-Aufgaben unter Prüfungsbedingungen und bewerten mit Erwartungshorizont.'],
      ['KC-Bezug', 'K6 (eA) vertieft, K4, K5; PK1.5 (Argumentieren), PK3.2 (Fachsprache), PK3.4 (kooperatives Arbeiten, Feedback)'],
      ['Abi-Bezug', 'Eigene Varianten, angelehnt an: Fall 1 – Abi 2022 eA Aufgabe C, Teil c (Trainerentlassung mit Kellerautomat: Eingabewort bestimmen, Regel angeben, Keller beschreiben, DEA untersuchen); Fall 2 – Abi 2022 Nachschreibtermin eA Aufgabe C, Teile b/c (Spielfeldgenerator mit \\ /, Bedeutung des Kellers, Vorteil gegenüber DEA, Übergang S1→S2, Bergseen); Fall 3 – Abi 2025 eA Aufgabe B, Teile g und h (Kriterium Y: Verwendung eines Kellerautomaten begründen, Verarbeitung 32-12211 dokumentieren; Teil i mit Grammatik folgt in Welt C); Fall 4 – Abi 2021 Nachschreibtermin eA Aufgabe E, Teil b (Vorgangsprotokolle 152KE/211K, Preis 7 €). Die Originale eignen sich als Hausaufgabe/Vertiefung.'],
      ['Material', 'Folien DS10, AB10 (Teil A + Werkstatt), Korrektorkarten (Kopiervorlage unten, je Fall 2–4 Exemplare), Merkblatt M07, AutomatenLab „Keller-Labor“ (#/keller?automat=palindrom-c&modus=tabelle, ?automat=palindrom&modus=sim, ?automat=anbn&modus=rueckwaerts), Boss-Level B + Erwartungshorizont'],
      ['Vorbereitung', 'Korrektorkarten kopieren und nach Fällen sortieren (Lehrerpult); Tandems festlegen (A/B); Boss-Level B kopieren (Erwartungshorizont separat, z. B. zum späteren Download).'],
    ], { widthsCm: [3.2, 14.2], firstColBold: true, firstColFill: true }),
    D.h2('Verlaufsplan (90 Minuten)'),
    D.table([
      ['Zeit', 'Phase', 'Unterrichtsgeschehen', 'Sozialform / Medien'],
      ['0–10', 'Einstieg', 'Rätsel „Spiegelwörter“ (Folie 3): abcba vs. abba – „Woran erkennt der Keller die Mitte?“ Kurze Wiederholung Notation/Tabelle (M07).', 'UG, Folien'],
      ['10–30', 'Erarbeitung', 'Teil A: Aufgabe 1 (DKA w c w^R^) in EA, Vergleich mit Keller-Labor-Tabellentrainer. Aufgabe 2 gemeinsam: „Mitte raten“ – Rate-Tabelle für abba an der Tafel, Akzeptanzdefinition („es gibt eine Möglichkeit“). DKA vs. NKA. Kurz Aufgabe 3 (a^n^b^n^c^n^) als Ausblick.', 'EA/UG, Folien 5–9, App'],
      ['30–65', 'Werkstatt Runde 1', 'Tandems: A = Fall 1, B = Fall 2 (20 min), Korrektur mit Korrektorkarten (10 min), Feedback (5 min).', 'PA, AB10, Korrektorkarten'],
      ['65–85', 'Werkstatt Runde 2', 'Rollentausch: A = Fall 3, B = Fall 4 (gekürzt: je 3 Teilaufgaben nach Wahl, 12 min), Korrektur + Feedback (8 min). Rest als Hausaufgabe.', 'PA, AB10'],
      ['85–90', 'Sicherung', 'Blitzlicht: „Welcher Operator war am schwierigsten?“ Typische Fehler (Folie 16). Boss-Level B als Hausaufgabe ausgeben.', 'UG, Boss-Level B'],
    ], { widthsCm: [1.6, 2.4, 10.2, 3.2], size: 19 }),
    D.h2('Lösungen Teil A'),
    D.h3('Aufgabe 1 – w c wᴿ (DKA)'),
    ...K.solved(J.palc.abcba),
    ...D.bullets([
      'b) Bis zum c wird w Zeichen für Zeichen abgelegt (A für a, B für b); oben liegt das zuletzt gelesene Zeichen. Nach dem c muss jedes Zeichen zum obersten Kellerzeichen passen – so wird w rückwärts verglichen. Liegt am Ende # oben, führt (#, ε) : # in den Endzustand. Deterministisch: In jedem Zustand gibt es für jedes Paar (oberstes Kellerzeichen, Eingabezeichen) höchstens einen Übergang, und ε-Übergänge (S1, #) konkurrieren mit keinem Übergang mit gleichem Kellerzeichen.',
      `Gegenprobe \`abcab\`: ${J.palc.abcab.grund} ⇒ abgelehnt.`,
    ]),
    D.h3('Aufgabe 2 – w wᴿ (NKA, Mitte raten)'),
    D.table([['Wechsel nach S1 …', 'akzeptierender Lauf?', 'Begründung'], ...J.guess.abba], { widthsCm: [4.0, 3.6, 9.8], size: 19, center: [0, 1] }),
    D.p('Akzeptierender Lauf (Wechsel nach 2 Zeichen) im Abi-Format:', { size: 20, keepNext: true }),
    ...K.solved(J.pal.abba),
    ...D.bullets([
      'b) `abba`: Es gibt **eine** Möglichkeit (Wechsel nach 2 Zeichen), nach vollständiger Verarbeitung in S2 zu sein ⇒ akzeptiert (Ergänzende Hinweise 2025). `abab`: Für keine der 5 Möglichkeiten gibt es einen solchen Lauf (siehe Tabelle) ⇒ abgelehnt.',
      'c) Ein DKA müsste beim Lesen von links nach rechts **sofort** entscheiden, ob er noch ablegt oder schon vergleicht – ohne Mittelzeichen weiß er nicht, wo die Mitte ist (bei abba … oder abbaabba … kann jede Stelle die Mitte sein). Beim w c w^R^ zeigt das c die Mitte an. (Dass es für w w^R^ keinen DKA gibt, wird nur mitgeteilt.)',
    ]),
    D.table([['abab: Wechsel nach S1 …', 'Lauf?', 'Grund'], ...J.guess.abab], { widthsCm: [4.0, 2.4, 11.0], size: 18, center: [0, 1] }),
    D.h3('Aufgabe 3 – aⁿbⁿcⁿ (Ausblick)'),
    D.p('Nach den b sind die A abgebaut – die Information „n“ ist verbraucht, für die c bleibt nichts zum Vergleichen. Legt man je a zwei Zeichen ab, kann man mit den b die Hälfte abbauen, aber nicht prüfen, ob die b genau die Hälfte und die c genau die andere Hälfte sind **und** die Reihenfolge stimmt: Der Keller erlaubt nur Zugriff auf das oberste Zeichen; zwei Vergleiche mit derselben Anzahl sind nicht möglich. (Beweis über das Pumping-Lemma für kontextfreie Sprachen – kein KC-Inhalt.) → Level 16: Turingmaschine.', { size: 20 }),
    D.pageBreak(),
    D.h2('Kopiervorlage: Korrektorkarten (Erwartungshorizonte)'),
    D.h3('Korrektorkarte Fall 1 – Der Trainer-Keller (11 BE)'),
    eh([
      ['a', `Eingabewort **${J.trainer.unique[0]}**. Begründung: S# nach Sieg 3; # (S entfernt) ⇒ Niederlage 0; N# ⇒ 0; Belegung unverändert N# ⇒ 1; NN# ⇒ 0; letzter Schritt ε-Übergang (N, ε) : N nach S1. Zeichenfolge: ${tSeq.join(', ')}.`, '3', 'II'],
      ['b', 'Der Trainer wird entlassen, wenn die Mannschaft (in der eingelesenen Folge) **mehr Niederlagen als Siege** hat; Unentschieden spielen keine Rolle.', '2', 'II'],
      ['c', 'Der Keller speichert die **Differenz** zwischen Siegen und Niederlagen: k Zeichen S = k Siege mehr als Niederlagen, k Zeichen N = k Niederlagen mehr. Ein Sieg baut ein N ab bzw. legt ein S ab, eine Niederlage umgekehrt; ein Unentschieden lässt den Keller unverändert. Nur wenn am Ende N oben liegt (Überschuss an Niederlagen), ist (N, ε) : N in den Endzustand möglich.', '3', 'II'],
      ['d', 'Nein. Die Differenz kann beliebig groß werden; ein DEA hat nur endlich viele Zustände. Schubfach: Unter 0, 00, …, 0^k+1^ enden zwei Präfixe 0^i^, 0^j^ (i < j) im selben Zustand; mit Fortsetzung 3^i^ ist 0^i^3^i^ keine Entlassung, 0^j^3^i^ aber schon – Widerspruch.', '3', 'III'],
    ]),
    ...D.tip('Hinweis für den Korrektor', [D.p('Der Automat ist nichtdeterministisch: Der ε-Übergang nach S1 könnte auch „zu früh“ gewählt werden – dann bleibt Eingabe übrig, und dieser Lauf zählt nicht. Akzeptiert wird, wenn **ein** Lauf nach vollständiger Eingabe in S1 endet.', { size: 19 })]),
    D.h3('Korrektorkarte Fall 2 – Landschaften mit Seen (11 BE)'),
    eh([
      ['a', 'Tabelle siehe unten; Eingabe wird akzeptiert.', '3', 'I'],
      ['b', 'Jedes T im Keller steht für eine Stufe unter Grundhöhe; die Anzahl der T ist die **aktuelle Tiefe**. \\ legt ein T ab, / entfernt eines, _ ändert nichts.', '2', 'II'],
      ['c', 'Der ε-Übergang (#, ε) : # prüft ohne Lesen eines Zeichens, ob # oben liegt, d. h. ob die Landschaft wieder die Grundhöhe erreicht hat. Nur dann ist der Endzustand S0 erreichbar und es darf wieder auf Grundhöhe weitergehen (_ oder neuer See).', '2', 'II'],
      ['d', 'Hügel beginnen auf Grundhöhe mit /. Auf Grundhöhe liegt # oben; in S0 gibt es keinen Übergang mit (#, /) (und in S1 führt (#, ε) : # vorher nach S0). Die Eingabe kann nicht vollständig verarbeitet werden ⇒ abgelehnt.', '2', 'II'],
      ['e', 'Der Keller kann **beliebig tiefe** Seen prüfen (unbeschränktes Zählen). Ein DEA könnte nur bis zu einer festen Maximaltiefe zählen (für jede Tiefe ein Zustand) und müsste bei größerer Tiefe erweitert werden; Vorteil Keller: ein kleiner, fester Automat für alle Tiefen.', '2', 'III'],
    ]),
    ...K.solved(J.spielfeld.doc, { size: 18 }),
    D.h3('Korrektorkarte Fall 3 – Prüfnummern mit Kriterium V (12 BE)'),
    eh([
      ['a', 'Es muss die Anzahl der Zeichen der ersten Folge mit der Quersumme der zweiten verglichen werden; beide können beliebig groß werden. Ein endlicher Automat kann sich nur endlich viele Werte merken (Schubfach: 1^i^ / 1^j^ mit Fortsetzung -1^i^). Der Kellerautomat speichert die Anzahl als A im Keller (ein A je Zeichen der ersten Folge).', '3', 'II'],
      ['b', 'Tabelle siehe unten; Eingabe wird akzeptiert.', '4', 'I'],
      ['c', 'Eine Ziffer 2 bzw. 3 muss **zwei** bzw. **drei** A entfernen, ein Übergang entfernt aber nur ein Kellerzeichen. S3 bedeutet „ein weiteres A muss noch entfernt werden“, S4 „noch zwei weitere A“. Mit ε-Übergängen (A, ε) : ε werden diese ohne Lesen entfernt (S4 → S3 → S2). Fehlt dabei ein A (# oben), bleibt der Automat stecken.', '3', 'II'],
      ['d', `\`12-3\`: Nach 12- liegen zwei A im Keller; die 3 entfernt ein A (S4), ε entfernt das zweite (S3) – dann liegt # oben, aus S3 gibt es keinen Übergang mit #. ${J.kritv['12-3'].grund}; nicht akzeptiert (2 Zeichen, Quersumme 3).`, '2', 'II'],
    ]),
    ...K.solved(J.kritv['111-21'], { size: 18 }),
    D.h3('Korrektorkarte Fall 4 – Kartoffel-Vorgangsprotokolle (13 BE)'),
    eh([
      ['a', `\`212KE\`: 2 + 1 = 3 € < 4 €, nach der letzten 2 sind 5 € bezahlt ⇒ Sack und 1 € zurück: korrekt (wird ${J.kart['212KE'].accepted ? 'akzeptiert' : 'abgelehnt'}). \`1122KE\`: Nach 1, 1, 2 sind bereits 4 € bezahlt; die weitere 2 dürfte nicht angenommen werden bzw. der Sack hätte schon ausgegeben werden müssen: nicht korrekt (${J.kart['1122KE'].grund}).`, '2', 'II'],
      ['b', 'Ohne ein Eingabezeichen zu lesen (ε), wird # entfernt und eeee# abgelegt: vier e (je ein noch zu zahlender Euro) über dem #. Danach ist der Automat in S1.', '2', 'I'],
      ['c', 'Tabelle siehe unten; Protokoll wird akzeptiert.', '4', 'I'],
      ['d', 'Jedes e steht für einen Euro, der **noch bezahlt werden muss**. 1 entfernt ein e, 2 entfernt zwei e (zweites über S2 mit ε). Ist nur noch ein e übrig und wird 2 eingeworfen, wird r („1 € Rückgeld geschuldet“) abgelegt. K ist nur möglich, wenn alles bezahlt ist (# oder r oben); E entfernt das r.', '2', 'II'],
      ['e', 'Bei einer Preisänderung muss nur der Übergang S0 → S1 geändert werden (Anzahl der e in der Ablage, z. B. 7 € ⇒ eeeeeee#). Für einen **festen** Preis genügt auch ein DEA, da nur endlich viele Beträge (0 … Preis) und höchstens 1 € Rückgeld unterschieden werden müssen (beschränktes Zählen). Der Kellerautomat ist aber leichter anzupassen.', '3', 'III'],
    ]),
    ...K.solved(J.kart['1112KE'], { size: 18 }),
    D.h2('Typische Schwierigkeiten'),
    ...D.warn('Darauf achten', [
      ...D.bullets([
        '**Rückwärts-Aufgaben:** Unveränderte Belegung heißt nicht „nichts passiert“ – es kann ein Zeichen wie 1 oder _ gelesen worden sein **oder** ein ε-Übergang (Zustandswechsel beachten!).',
        '**NKA-Akzeptanz:** „Der Automat kann auch falsch raten, also wird abgelehnt“ – falsch. Es genügt **ein** akzeptierender Lauf; bei Ablehnung müssen **alle** Läufe scheitern.',
        '**Bedeutung des Kellers:** Nicht nur „speichert Zeichen“, sondern **was** ein Kellerzeichen im Kontext bedeutet, **wann** es abgelegt/entfernt wird und **wie** am Ende entschieden wird.',
        '**DEA oder Keller?** Bei festen Grenzen (Preis, Tiefe ≤ 3) genügt ein DEA – Begründung mit beschränktem Zählen (Fall 4e).',
      ]),
    ]),
    D.h2('Differenzierung'),
    ...D.bullets([
      '**Basis:** Teil A Aufgabe 1; in der Werkstatt Fall 2 (kürzeste Tabellen); Keller-Labor Rückwärts-Modus als Training.',
      '**Standard:** Teil A 1–2, Fälle 1–3.',
      '**Profi:** Teil A 3, Fall 4 vollständig; Zusatz: Kellerautomat für {a^n^b^m^c^n^ | n, m ≥ 1}.',
    ]),
    D.h2('Hausaufgabe und Boss-Level B'),
    D.p('Nicht bearbeitete Fälle der Werkstatt fertigstellen (Selbstkorrektur mit den Korrektorkarten). **Boss-Level B** (Abi-artige Aufgabe „Tags im Web-Editor“, 25 BE, ca. 60 min) als Hausaufgabe bis zur nächsten Woche; Erwartungshorizont zur Selbstkontrolle nach Abgabe ausgeben oder digital bereitstellen.'),
    ...D.tip('Hinweise zum Einsatz des Boss-Levels', [
      ...D.bullets([
        'Deckt Welt B vollständig ab: Kellertabelle (a), Bedeutung des Kellers (b), Rückwärts-Aufgabe (c), DEA bei beschränkter Tiefe (d), Grenzen/Schubfach (e), Erweitern eines Kellerautomaten (f), Beurteilung DEA vs. Keller (g).',
        'Bewertung nach BE wie im Abitur; Notenschlüssel optional (z. B. ab 95 % = 15 P.). Auswertung in der nächsten Stunde: häufigste Fehler sammeln.',
        'Als Lernstandsdiagnose vor Welt C geeignet: Wer bei (c) und (f) unter 50 % liegt, wiederholt mit dem Keller-Labor (Rückwärts, Simulator).',
      ], { size: 20 }),
    ]),
  ];
  return D.save(D.doc({ kind: 'LK', ds: 10, title: T, subtitle: SUB, kernfrage: KF, body }), OUT + `DS10_Lehrkraft_${FN}.docx`);
}

// =====================================================================================  Folien
async function folien() {
  const d = S.deck({ ds: 10, title: T });
  d.title({ title: T, subtitle: SUB, kernfrage: KF, notes: 'Letzte Doppelstunde in Welt B. Ziel: Abi-Sicherheit bei Kellerautomaten. Am Ende: Boss-Level B.' });
  d.section({ phase: 'Einstieg', title: 'Spiegelwörter' });
  d.question({ text: 'abcba  oder  abba – woran erkennt ein Kellerautomat, wo die Mitte ist?', sub: 'Bei **abcba** verrät das c die Mitte. Bei **abba** … muss er **raten**.', notes: 'Kurzes UG. Wiederholung: Keller als Stapel, oben = links, Ablage rechts zuerst (M07).' });
  d.section({ phase: 'Erarbeitung', title: 'Raten im Keller' });
  d.image({ title: 'w c wᴿ – deterministisch (DKA)', img: IMG + 'palindrom_c.png', sigma: 'Σ = {a, b, c}   ·   Γ = {#, A, B}', caption: HINT, notes: 'Bis c: ablegen (oben = zuletzt gelesen). Nach c: vergleichen und abbauen. Tabelle für abcba in AB10, Aufgabe 1.' });
  d.image({ title: 'w wᴿ – nichtdeterministisch (NKA)', img: IMG + 'palindrom.png', sigma: 'Unterschied: ε-Übergänge von S0 nach S1 – „Hier ist die Mitte“', caption: HINT, notes: 'Der Automat darf in S0 jederzeit raten, dass die Mitte erreicht ist. Gleiche Kellerzeichen – deshalb mehrere Möglichkeiten.' });
  d.table({ title: 'Rate-Tabelle für abba', phase: 'Erarbeitung', rows: [['Wechsel nach S1 …', 'Lauf akzeptiert?', 'Grund'], ...J.guess.abba], colW: [2.8, 2.4, 6.93], size: 20, notes: 'Gemeinsam an der Tafel. Nur der Wechsel nach 2 Zeichen führt zum Ziel – und das reicht.' });
  d.merke({ title: 'Akzeptanz beim NKA', phase: 'Erarbeitung', items: [
    'Akzeptiert, wenn es **eine Möglichkeit** gibt, nach vollständiger Eingabe in einem Endzustand zu sein.',
    'Dokumentation im Abi: **einen** akzeptierenden Lauf als Tabelle angeben.',
    'Abgelehnt erst, wenn **alle** Möglichkeiten scheitern.',
    'Für w wᴿ gibt es **keinen** DKA – NKA können mehr als DKA (anders als bei NEA/DEA!).',
  ], notes: 'Wichtiger Unterschied zu Level 8: NEA und DEA sind gleich mächtig, bei Kellerautomaten nicht. Nur mitteilen, nicht beweisen.' });
  d.twoCol({ title: 'Ausblick: aⁿbⁿcⁿ', phase: 'Erarbeitung', left: { head: 'Idee mit dem Keller', items: ['Je a ein A ablegen', 'Je b ein A entfernen', 'Und die c? – Die Anzahl ist **verbraucht**'] }, right: { head: 'Ergebnis', items: ['**Kein** Kellerautomat erkennt aⁿbⁿcⁿ', 'Der Keller erlaubt nur **einen** Vergleich mit derselben Anzahl', 'Level 16: Die **Turingmaschine** schafft es'] }, notes: 'Beweis (Pumping-Lemma) ist kein KC-Inhalt. Hierarchie andeuten: regulär ⊂ kontextfrei ⊂ …' });
  d.section({ phase: 'Werkstatt', title: 'Abi-Werkstatt: Prüfling & Korrektor' });
  d.task({ title: 'So läuft die Werkstatt', phase: 'Werkstatt', steps: [
    '**Runde 1:** A bearbeitet Fall 1, B Fall 2 – allein, wie in der Prüfung (20 min).',
    '**Korrektur:** Hefte tauschen, Korrektorkarte holen, BE vergeben, Kommentar schreiben (10 min).',
    '**Feedback:** Korrektor erklärt seine Bewertung (5 min).',
    '**Runde 2 – Rollentausch (20 min):** A bearbeitet Fall 3, B Fall 4 – drei Teilaufgaben nach Wahl, Rest zu Hause.',
  ], zeit: '35 + 20 min', sozialform: 'Tandem', material: 'AB10 Teil B, Korrektorkarten, M07', notes: 'Korrektorkarten liegen sortiert am Pult. Darauf achten, dass ehrlich bewertet wird: Teilpunkte nur bei Teilleistung laut Karte.' });
  d.cards({ title: 'Vier Fälle – vier Abi-Klassiker', phase: 'Werkstatt', cards: [
    { head: 'Fall 1', text: 'Trainer-Keller: Eingabewort aus Zustandsfolge, Regel, DEA?', icon: 'LuTrophy' },
    { head: 'Fall 2', text: 'Landschaften mit Seen: Tabelle, Bedeutung des Kellers, Hügel', icon: 'LuMountain' },
    { head: 'Fall 3', text: 'Prüfnummern, Kriterium V: Keller begründen, ε-Abbau', icon: 'LuHash' },
    { head: 'Fall 4', text: 'Kartoffel-Protokolle: Keller als Restbetrag, Preisänderung', icon: 'LuShoppingBasket' },
  ], notes: 'Angelehnt an Abi 2022 eA C c, Abi 2022 Nachschreibtermin C, Abi 2025 eA B g–h, Abi 2021 Nachschreibtermin E b. Originale als Vertiefung.' });
  d.bullets({ title: 'Rückwärts: Eingabewort bestimmen', phase: 'Werkstatt', items: [
    'Spalte für Spalte vergleichen: Was wurde **entfernt**, was **abgelegt**?',
    'Den **passenden Übergang** im Graphen suchen – Zustand **und** Belegung müssen stimmen.',
    'Belegung unverändert? Zeichen, das nur liest (z. B. 1, _) – **oder** ε-Übergang (Zustandswechsel!).',
    'Zum Schluss das Wort **vorwärts** durchspielen (Probe).',
  ], img: IMG + 'spielfeld.png', imgW: 4.8, notes: `Beispiel Fall 1 (Lösung nur für die Lehrkraft): ${J.trainer.unique[0]}.` });
  d.app({ title: 'Keller-Labor: Rückwärts', route: '#/keller?automat=anbn&modus=rueckwaerts', phase: 'Werkstatt', text: 'Training für schnelle Tandems: Aus der Folge von Zuständen und Kellerbelegungen das Eingabewort bestimmen. Über die Navigation unten den Automaten wechseln: **Prüfnummern**, **Palindrome**, **Code O/X**.', notes: 'Alternativ: #/keller?automat=palindrom&modus=sim zur Visualisierung des Ratens.' });
  d.section({ phase: 'Sicherung', title: 'Typische Fehler & Boss-Level B' });
  d.cards({ title: 'Typische Fehler aus der Werkstatt', phase: 'Sicherung', cards: [
    { head: 'Zu vage', text: '„Speichert Zeichen“ reicht nicht: **Was** bedeutet ein Kellerzeichen, wann wird es abgelegt?', icon: 'LuMessageSquareWarning' },
    { head: 'Falsch geraten = abgelehnt', text: 'Beim NKA genügt **ein** akzeptierender Lauf.', icon: 'LuShuffle' },
    { head: 'ε übersehen', text: 'Unveränderte Belegung kann ein ε-Übergang sein.', icon: 'LuEyeOff' },
    { head: 'Immer Keller?', text: 'Feste Grenze (Preis, Tiefe) ⇒ ein DEA genügt.', icon: 'LuScale' },
  ], notes: 'Blitzlicht: Welcher Operator war am schwierigsten? Fehler aus den Korrekturen ergänzen.' });
  d.merke({ title: 'Merke: Kellerautomaten im Abitur', items: [
    '**Dokumentieren:** Tabelle Zeile für Zeile, bei NKA ein akzeptierender Lauf',
    '**Erläutern (Keller):** Bedeutung der Kellerzeichen + Ablegen/Entfernen + Abschlussprüfung',
    '**Bestimmen (Eingabewort):** rückwärts über Belegungsänderungen, Probe vorwärts',
    '**Begründen/Untersuchen:** unbeschränkt ⇒ Keller nötig; beschränkt ⇒ DEA genügt',
  ] });
  d.end({ items: ['DKA vs. NKA: Mitte raten mit ε', 'Akzeptanz: es gibt eine Möglichkeit', 'Rückwärts-Aufgaben und Bedeutung des Kellers', 'Grenze aⁿbⁿcⁿ'], hausaufgabe: 'Werkstatt-Fälle fertigstellen (Korrektorkarten). Boss-Level B „Tags im Web-Editor“ (25 BE) bis nächste Woche.' });
  return d.save(OUT + `DS10_Folien_${FN}.pptx`);
}

(async () => {
  const files = [await ab(), await lk(), await folien()];
  console.log(files.join('\n'));
})();
