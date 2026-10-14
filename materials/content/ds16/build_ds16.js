const __MAT = require('path').resolve(__dirname, '../..'); // Wurzel: materials/
// DS16 – Level 16 „Ausblick: Die Turingmaschine“ + Abschluss – AB, Lehrkraft-Handreichung, Folien
const D = require((__MAT + '/lib/docstyle.js'));
const S = require((__MAT + '/lib/deckstyle.js'));
const fs = require('fs');
const IMG = (__MAT + '/build/img/ds16/');
const OUT = (__MAT + '/out/');
const TR = JSON.parse(fs.readFileSync(IMG + 'traces.json', 'utf8'));
const T = 'Ausblick: Die Turingmaschine';
const SUB = 'Aufgabenbörse · Band, Kopf und Übergänge · Church-Turing-These und Halteproblem · Abschluss der Einheit';
const KF = 'Was kann eine Maschine, die auf ihr Band schreiben darf – und gibt es Grenzen, die keine Maschine überwindet?';

const subK = (letter, text) => new D.Paragraph({ children: [new D.TextRun({ text: `${letter})  `, font: D.FONT_BODY, bold: true, size: 22, color: D.C.teal }), ...D.runs(text)], indent: { left: 360, hanging: 360 }, spacing: { after: 80, line: 276 }, keepNext: true });
const traceRows = (t, max) => [['Schritt', 'Zustand', 'Band (Kopfposition in eckigen Klammern)', 'Übergang'], ...t.rows.slice(0, max || t.rows.length).map((r) => [r[0], r[1], r[2], r[3] || '–'])];
const traceTable = (t, o = {}) => D.table(traceRows(t, o.max), { widthsCm: [1.6, 1.8, 10.0, 4.0], size: 18, center: [0, 1], ...o });

// =====================================================================================  Arbeitsblatt
async function ab() {
  const body = [
    D.p('Letztes Level! Zuerst löst ihr in der **Aufgabenbörse** die Aufgabe eines anderen Teams. Dann lernst du die mächtigste Maschine dieser Einheit kennen: die **Turingmaschine** – und erfährst, dass selbst sie Grenzen hat.'),
    D.task({ nr: 1, title: 'Aufgabenbörse', niveau: 'Basis', afb: 'I–III', body: [
      D.p('Ihr erhaltet die Aufgabe von Team ________ (Kurzversion). **Löst** sie im Team in 20 Minuten auf einem eigenen Blatt – wie im Abitur: Operatoren beachten, Notation einhalten. Vergleicht danach mit dem Erwartungshorizont des Autorenteams.'),
      D.sub('a', '**Gib** dem Autorenteam eine Rückmeldung: Was war klar formuliert? Wo fehlten Angaben (Σ, Hinweis zum Fehlerzustand, BE)?'),
      ...D.lines(2),
    ] }),
    D.info('Warum der Kellerautomat an aⁿbⁿcⁿ scheitert', [
      D.p('Für L = {aⁿbⁿ | n ≥ 1} legt der Kellerautomat für jedes a ein A auf den Keller und nimmt für jedes b eines herunter. Der Keller ist ein **Zähler, der beim Vergleichen verbraucht wird**: Nach den b ist er leer – die Information „wie viele a?“ ist weg, für die c gibt es nichts mehr zu vergleichen. Auch Tricks (zwei A pro a) helfen nicht: Beim ersten b weiß der Automat nicht, wann die b aufhören. Anschaulich: **Ein Keller kann nur einmal abgezählt werden** (ein strenger Beweis braucht mehr Theorie). Eine Maschine, die ihre Eingabe **verändern** und beliebig oft **hin- und herlaufen** darf, hat dieses Problem nicht.', { size: 21 }),
    ]),
    D.task({ nr: 2, title: 'Die Turingmaschine liest, schreibt und bewegt sich', niveau: 'Basis', afb: 'I–II', body: [
      D.p('Eine **Turingmaschine (TM)** hat ein beidseitig unbegrenztes **Band** aus Feldern, einen **Schreib-Lese-Kopf** und endlich viele Zustände. Leere Felder enthalten das **Blank □**. In jedem Schritt liest der Kopf das Zeichen unter sich und führt genau einen Übergang aus:'),
      D.p('**(Zustand, gelesenes Zeichen) → (Folgezustand, geschriebenes Zeichen, Bewegung L / R / N)**', { align: 'center', size: 22 }),
      D.p('Im Zustandsgraphen steht an der Kante „gelesen / geschrieben, Bewegung“, z. B. „1 / 0, L“. Gibt es keinen passenden Übergang, **hält** die Maschine. Hält sie in einem Endzustand, ist die Eingabe akzeptiert; der Bandinhalt ist die Ausgabe.'),
      D.img(IMG + 'band_aufbau.png', { widthCm: 7.2, caption: 'Abbildung 1: Band, Kopf und Zustand – die Maschine liest gerade die 1 am Anfang von 1011' }),
      D.img(IMG + 'tm_binplus.png', { widthCm: 10.5, caption: 'Abbildung 2: Turingmaschine „Binärzahl + 1“, Σ = {0, 1}. Der Kopf startet auf der ersten Ziffer.' }),
      D.sub('a', '**Beschreibe** die Bedeutung der Zustände S0, S1 und S2: Was tut die Maschine jeweils?'),
      ...D.lines(3),
      D.sub('b', '**Stelle** die Verarbeitung der Eingabe `1011` als Konfigurationsfolge **dar**. Notiere pro Schritt Zustand, Bandinhalt und Kopfposition (in eckigen Klammern).'),
      D.fillTable(['Schritt', 'Zustand', 'Band (Kopfposition in eckigen Klammern)', 'Übergang'], 9, { widthsCm: [1.6, 1.8, 10.0, 4.0], size: 18, rowHeightCm: 0.62, prefill: [['0', 'S0', '□ [1] 0 1 1 □ □', '–'], ['1', 'S0', '□ 1 [0] 1 1 □ □', '1 / 1, R']] }),
      D.sub('c', '**Gib an**, was die Maschine bei der Eingabe `111` ausgibt, und **erläutere**, warum sie dafür ein Feld links vom ersten Zeichen beschreibt.'),
      ...D.lines(2),
    ] }),
    D.task({ nr: 3, title: 'Unplugged: Du bist der Schreib-Lese-Kopf', niveau: 'Standard', afb: 'II', body: [
      D.p('Partnerarbeit mit dem Papierstreifen-Band und der Regelkarte (von der Lehrkraft). Eine Person ist der **Kopf**: Sie schiebt die Kopf-Marke, liest vor, radiert und schreibt. Die andere Person ist die **Steuerung**: Sie hält die Zustandskarte hoch und sagt nach jeder Regel den neuen Zustand an. Nach jedem Schritt wird getauscht.'),
      D.sub('a', '**Führe** die Maschine „Binärzahl + 1“ für die Eingabe `1101` **aus**. Zähle die Schritte und notiere das Ergebnis. **Prüfe** es durch Umrechnen ins Dezimalsystem.'),
      ...D.lines(2),
      subK('b', '**Entwickle** eine Turingmaschine über Σ = {a, b}, die jedes a durch b ersetzt und am Ende der Eingabe hält. Teste sie auf dem Papierband mit `abab`.'),
      ...D.drawBox(2.8),
    ] }),
    D.task({ nr: 4, title: 'aⁿbⁿcⁿ – was kein Kellerautomat schafft', niveau: 'Standard', afb: 'II', body: [
      D.p('Die Turingmaschine in Abbildung 3 erkennt L = {aⁿbⁿcⁿ | n ≥ 1}. Sie darf das Band verändern und beliebig oft hin- und herlaufen.'),
      D.img(IMG + 'tm_anbncn.png', { widthCm: 15.5, caption: 'Abbildung 3: Turingmaschine für aⁿbⁿcⁿ, Σ = {a, b, c}, Bandalphabet Γ = {a, b, c, X, Y, Z, □}' }),
      D.sub('a', '**Erläutere** die Strategie der Maschine: Wozu dienen die Markierungen X, Y, Z, und was passiert in den Zuständen S0 bis S4?'),
      ...D.lines(3),
      D.sub('b', '**Gib** für die Eingabe `aabbcc` den Bandinhalt und den Zustand nach der ersten Runde **an** (eine Runde endet, wenn die Maschine in S3 ein X liest und nach S0 wechselt).'),
      ...D.lines(1),
      D.sub('c', '**Begründe** anhand der Eingabe `aabbc`, dass die Maschine diese Eingabe ablehnt: In welchem Zustand hält sie, und warum?'),
      ...D.lines(2),
    ] }),
    D.qr({ route: '#/turing?programm=anbncn', title: 'Turing-Labor', text: 'Schritt für Schritt durch „Binärzahl + 1“ und „aⁿbⁿcⁿ“ laufen (programm=binaer-plus-1 | anbncn), Band beobachten, eigene Eingaben testen. Challenge 1: fehlende Regel ergänzen.' }),
    D.task({ nr: 5, title: 'Rätsel: Der fleißige Biber', niveau: 'Profi', afb: 'II–III', body: [
      D.p('Zwei Maschinen mit den Zuständen A, B und dem Haltezustand H starten auf einem **leeren Band**. Welche schreibt mehr Einsen, bevor sie hält? (Σ = {1}; Zustandsnamen wie in der Fachliteratur.)'),
      D.table([[D.img(IMG + 'tm_kandidat.png', { widthCm: 6.6, caption: 'Abbildung 4: Maschine K' }), D.img(IMG + 'tm_biber2.png', { widthCm: 9.6, caption: 'Abbildung 5: Maschine B' })]], { header: false, widthsCm: [7.2, 10.2] }),
      D.sub('a', '**Bestimme** für beide Maschinen die Anzahl der Einsen auf dem Band und die Anzahl der Schritte bis zum Halten.'),
      ...D.lines(2),
      D.sub('b', 'Der **fleißige Biber** mit n Zuständen ist die Maschine, die unter allen haltenden Maschinen mit n Zuständen (plus H) die meisten Einsen schreibt. **Beurteile**, ob es eine Maschine mit zwei Zuständen gibt, die mehr Einsen schreibt als Maschine B. Recherchiere, was über den fleißigen Biber mit 5 und 6 Zuständen bekannt ist.'),
      ...D.lines(2),
    ] }),
    D.task({ nr: 6, title: 'Unärer Addierer', niveau: 'Profi', afb: 'III', body: [
      D.p('Zahlen werden als Strichlisten geschrieben: 3 + 2 ist die Eingabe `111+11`. **Entwickle** eine Turingmaschine über Σ = {1, +}, die die Summe als Strichliste ausgibt (hier `11111`). Idee: Das + durch eine 1 ersetzen, ans Ende laufen und dort eine 1 löschen. Selbstkontrolle: Turing-Labor, Challenge 2.', { keepNext: true }),
      ...D.drawBox(2.8),
    ] }),
    D.task({ nr: 7, title: 'Zwei große Ideen: Grenzen jeder Maschine', niveau: 'Standard', afb: 'III', body: [
      D.p('**Church-Turing-These:** Alles, was sich überhaupt mit einem Algorithmus berechnen lässt, kann eine Turingmaschine berechnen. Jeder Computer, jede Programmiersprache ist genau so mächtig wie dieses einfache Modell – nicht mächtiger. (Eine These, kein Satz: Sie lässt sich nicht beweisen, hat sich aber seit 1936 in jedem Fall bestätigt.)', { size: 20 }),
      D.p('**Das Halteproblem – eine Geschichte:** Eine Firma verspricht das Programm HALT: Man gibt ihm ein beliebiges Programm P und eine Eingabe, und HALT sagt nach endlicher Zeit korrekt „hält“ oder „läuft ewig“. Eine Informatikerin baut daraus das Programm TROTZ: Es fragt HALT, ob das Programm TROTZ selbst (mit der eigenen Beschreibung als Eingabe) hält – und tut dann **das Gegenteil**: Sagt HALT „hält“, läuft TROTZ in eine Endlosschleife; sagt HALT „läuft ewig“, hält TROTZ sofort. Egal, was HALT antwortet, es irrt sich. Also kann HALT nicht existieren. Alan Turing zeigte 1936: **Kein Algorithmus kann für alle Programme entscheiden, ob sie halten.** Es gibt Grenzen, die keine Maschine überwindet.', { size: 20 }),
      D.sub('a', '**Erläutere** in eigenen Worten, warum das Programm TROTZ das Programm HALT in jedem Fall widerlegt.'),
      ...D.lines(2),
      D.sub('b', '**Beurteile** die Aussage: „Mit einem schnelleren Rechner ist das Halteproblem irgendwann lösbar.“'),
      ...D.lines(2),
    ] }),
    D.h2('Abschluss der Einheit'),
    D.qr({ route: '#/quiz?welt=D', title: 'Level-Quiz Welt D', text: 'Abschluss-Quiz zu Sprachdesign und Turingmaschine (#/quiz?welt=D) – oder das Mini-Exit-Ticket zu Level 16 (#/quiz?ds=16).' }),
    ...D.tip('Lernlandkarte-Selbstcheck', [D.p('Nimm deine **Lernlandkarte** (Kompetenzraster „Ich kann …“) zur Hand und markiere für jedes Level: sicher / unsicher / noch üben. Für jedes „noch üben“ notierst du eine konkrete Aufgabe (Merkblatt, Boss-Level, App-Modul), mit der du es nachholst – das ist dein Plan für die Übungsklausur.', { size: 21 })]),
    D.h3('Feedback zur Einheit'),
    D.table([['Das hat mir beim Verstehen am meisten geholfen (Rollenspiel, App, Boss-Level, Merkblätter, Projekt …):', 'Das hätte ich mir anders gewünscht:', 'Eine Frage, die mir noch offen ist:'], ['', '', '']], { header: false, widthsCm: [5.8, 5.8, 5.8], size: 18, rowHeightCm: 1.9 }),
    D.h3('Selbstcheck – Level 16 geschafft, wenn …'),
    ...D.checklist([
      'ich den Aufbau einer Turingmaschine (Band, Kopf, Zustände, Blank) und die Form eines Übergangs angeben kann.',
      'ich eine kleine Turingmaschine Schritt für Schritt ausführen und die Konfigurationsfolge darstellen kann.',
      'ich anschaulich erklären kann, warum ein Kellerautomat an aⁿbⁿcⁿ scheitert und eine Turingmaschine nicht.',
      'ich die Church-Turing-These und die Idee des Halteproblems in eigenen Worten wiedergeben kann.',
    ]),
  ];
  return D.save(D.doc({ kind: 'AB', ds: 16, title: T, subtitle: SUB, kernfrage: KF, body }), OUT + 'DS16_AB_Ausblick-Turingmaschine.docx');
}

// =====================================================================================  Lehrkraft
async function lk() {
  const strip = () => D.table([Array.from({ length: 13 }, () => '')], { header: false, rowHeightCm: 1.3, widthsCm: Array(13).fill(17.4 / 13), noSpacer: false });
  const body = [
    D.h2('Überblick'),
    D.table([
      ['Aspekt', 'Inhalt'],
      ['Lernziele', 'Die SuS lösen eine Abi-artige Aufgabe eines anderen Teams und geben Rückmeldung (Aufgabenbörse). Sie beschreiben Aufbau und Arbeitsweise einer Turingmaschine (Band, Schreib-Lese-Kopf, Übergänge mit Schreiben und Bewegung, Blank), führen kleine Maschinen aus, stellen Konfigurationsfolgen dar und erläutern anschaulich, warum die Turingmaschine mächtiger ist als der Kellerautomat (aⁿbⁿcⁿ). Sie kennen die Church-Turing-These und die Idee des Halteproblems. Abschluss: Quiz, Lernlandkarte-Selbstcheck, Feedback.'],
      ['KC-Bezug', 'Ergänzung über den Kern hinaus (Turingmaschine, Berechenbarkeit); Vernetzung K5/K6 (Grenzen von Automatenmodellen), PK2.2 (Modelle vergleichen), PK3.1. Die Aufgabenbörse trainiert alle Operatoren des Abiturs (K1–K6, F1–F4).'],
      ['Abi-Bezug', 'Die Turingmaschine ist nicht prüfungsrelevant; relevant sind die Grenzen des Kellerautomaten als Abschluss der Hierarchie (vgl. „Begründen Sie die Verwendung eines Kellerautomaten“, Abi 2025 eA B g). Aufgabenbörse: Aufgaben der Teams im Abi-Format.'],
      ['Material', 'AB16, Folien DS16, Merkblatt M11, Kopiervorlagen (Papierstreifen-Band, Zustandskarten, Regelkarte „Binärzahl + 1“), Aufgaben der Teams aus Level 15, Lernlandkarte (00_Lernlandkarte), AutomatenLab „Turing-Labor“ (#/turing?programm=binaer-plus-1 | anbncn | biber-2, ?challenge=1) und Level-Quiz (#/quiz?welt=D bzw. ?ds=16).'],
      ['Vorbereitung', 'Aufgaben der Teams prüfen und rotierend zuordnen (Team 1 löst Aufgabe von Team 2 usw.); pro Tandem ein Papierstreifen-Band (Kopiervorlage, ggf. laminieren), Zustandskarten, Regelkarte, Bleistift + Radiergummi, eine Münze als Kopf-Marke; Lernlandkarten austeilen; App-Links prüfen.'],
    ], { widthsCm: [3.2, 14.2], firstColBold: true, firstColFill: true }),
    D.h2('Verlaufsplan (90 Minuten)'),
    D.table([
      ['Zeit', 'Phase', 'Unterrichtsgeschehen', 'Sozialform / Medien'],
      ['0–20', 'Einstieg', 'Aufgabenbörse (Folie 3): Jedes Team löst die Kurzversion der Aufgabe eines anderen Teams (AB16, Aufgabe 1), vergleicht mit dem Erwartungshorizont und gibt dem Autorenteam Rückmeldung. Lehrkraft sammelt zwei gelungene Aufgabenformulierungen für das Plenum.', 'GA, Aufgaben aus DS15'],
      ['20–30', 'Erarbeitung', 'Folien 5–6: Kann ein Kellerautomat aⁿbⁿcⁿ erkennen? Anschauliche Begründung (Keller wird beim Vergleichen verbraucht). Überleitung: Was wäre, wenn die Maschine auf ihre Eingabe schreiben dürfte?', 'UG, Folien'],
      ['30–45', 'Erarbeitung', 'Turingmaschine (Folien 8–11): Band, Kopf, Blank, Übergang (Zustand, gelesen) → (Zustand, geschrieben, Bewegung). Maschine „Binärzahl + 1“ gemeinsam auf 1011 ausführen (Konfigurationsfolge an der Tafel). AB16 Aufgabe 2 a–c.', 'LV/UG, Folien, AB16, M11'],
      ['45–60', 'Übung', 'Unplugged (Folie 12): Tandems führen „Binärzahl + 1“ auf dem Papierstreifen-Band für 1101 aus und entwerfen die Ersetzer-Maschine (AB16 Aufgabe 3). Schnelle Tandems: Aufgabe 4 (aⁿbⁿcⁿ) mit dem Turing-Labor.', 'PA, Kopiervorlagen, iPads'],
      ['60–70', 'Erarbeitung', 'Folien 13–16: aⁿbⁿcⁿ-Maschine (Strategie), fleißiger Biber als Rätsel (Folie 14, Aufgabe 5 als Angebot), Church-Turing-These und Halteproblem als Geschichte (5 min, Folien 15–16).', 'UG, Folien'],
      ['70–90', 'Abschluss', 'Level-Quiz Welt D in der App (8 min, Folie 18), Lernlandkarte-Selbstcheck mit Übungsplan (7 min), Feedback auf AB16 (5 min). Ausblick: Übungsklausur im Abi-Format.', 'EA, App, Lernlandkarte, AB16'],
    ], { widthsCm: [1.6, 2.4, 10.2, 3.2], size: 19 }),
    D.h2('Organisation der Aufgabenbörse'),
    ...D.bullets([
      'Kurzversion = die ersten zwei bis drei Teilaufgaben (ca. 8 BE), damit 20 Minuten reichen. Der Erwartungshorizont bleibt beim Autorenteam und wird erst nach der Bearbeitung ausgetauscht.',
      'Rückmeldebogen (AB16, 1a): Was war klar? Was fehlte (Σ, Fehlerzustand-Hinweis, BE)? Diese Rückmeldung fließt in die Bewertung „Aufgabe für die Börse“ (DS15-Raster) ein.',
      'Zwei gelungene Formulierungen im Plenum zeigen – insbesondere korrekte Operatorverwendung und einen vollständigen Erwartungshorizont.',
    ]),
    D.pageBreak(),
    D.h2('Kopiervorlage: Papierstreifen-Band (unplugged)'),
    D.p('Pro Tandem einen Streifen ausschneiden (ggf. zwei Streifen aneinanderkleben). Leere Felder bedeuten □. Die Eingabe wird mit Bleistift eingetragen, der Kopf ist eine Münze; geschrieben wird durch Radieren und Neuschreiben. Zustandskarten und Regelkarte liegen daneben.', { size: 20 }),
    ...strip(), ...strip(), ...strip(), ...strip(),
    D.h3('Zustandskarten'),
    D.table([['S0', 'S1', 'S2']], { header: false, allCenter: true, size: 44, rowHeightCm: 2.4 }),
    D.h3('Regelkarte „Binärzahl + 1“ (Übergangstabelle)'),
    D.table([['Zustand', 'liest 0', 'liest 1', 'liest □'], ...TR.binplus_table.map((r) => r.map((c, i) => (i === 0 ? r[0] : c)))], { widthsCm: [3.0, 4.8, 4.8, 4.8], size: 21, allCenter: true, firstColBold: true }),
    D.small('Lesart „1 / N → S2“: schreibe 1, bewege nicht, wechsle nach S2. S2 hat keine Übergänge – die Maschine hält (Endzustand). Start: S0, Kopf auf der ersten Ziffer.'),
    D.h3('Spielregeln'),
    ...D.numbered([
      'Die **Steuerung** hält die Zustandskarte S0 hoch. Der **Kopf** liest das Zeichen unter der Münze laut vor.',
      'Die Steuerung sucht die Regel (Zustand, gelesenes Zeichen) und sagt an: „Schreibe …, gehe …, neuer Zustand …“.',
      'Der Kopf schreibt (radiert und ersetzt), schiebt die Münze und die Steuerung wechselt die Zustandskarte. Jeder Schritt wird gezählt.',
      'Gibt es keine Regel, ruft die Steuerung „Halt!“ – Zustand und Bandinhalt werden notiert. Dann Rollentausch.',
    ], { ref: 'numbers2' }),
    D.pageBreak(),
    D.h2('Lösungen AB16'),
    D.h3('Aufgabe 2 – Binärzahl + 1'),
    ...D.bullets([
      'a) **S0:** nach rechts bis zum Ende der Zahl laufen (Ziffern unverändert lassen). **S1:** Übertrag nach links tragen – jede 1 wird zur 0; die erste 0 (oder das Blank links der Zahl) wird zur 1. **S2:** fertig, Maschine hält (Endzustand).',
      'b) Konfigurationsfolge für 1011 (8 Schritte, Ausgabe 1100 = 12, Probe: 11 + 1 = 12):',
    ]),
    traceTable(TR.bin_1011),
    ...D.bullets([
      `c) Eingabe 111 → Ausgabe ${TR.bin_111.output} (7 + 1 = 8, ${TR.bin_111.steps} Schritte). Alle Ziffern sind 1, der Übertrag läuft bis vor die Zahl; dort steht ein Blank, das zur führenden 1 wird. Die Zahl wird eine Stelle länger – deshalb muss die Maschine links vom ersten Zeichen schreiben dürfen.`,
    ]),
    D.h3('Aufgabe 3 – Unplugged'),
    ...D.bullets([
      `a) 1101 → ${TR.bin_1101.output} in ${TR.bin_1101.steps} Schritten (13 + 1 = 14). Typischer Fehler: In S1 bei gelesener 0 nach links weiterlaufen – richtig ist 0 → 1 und Halt (N).`,
      'b) Ersetzer-Maschine: S0 –a / b, R→ S0; S0 –b / b, R→ S0; S0 –□ / □, N→ S1 (Endzustand). abab → bbbb in 5 Schritten.',
    ]),
    D.img(IMG + 'tm_ersetzer.png', { widthCm: 8.5, caption: 'Lösung 3b: Jedes a wird durch b ersetzt; am Blank hält die Maschine.' }),
    D.h3('Aufgabe 4 – aⁿbⁿcⁿ'),
    ...D.bullets([
      'a) Strategie: In jeder Runde wird ein a als X, dann das erste noch unmarkierte b als Y und das erste unmarkierte c als Z markiert; danach läuft die Maschine nach links zum letzten X zurück (S3) und beginnt die nächste Runde (S0). **S1** sucht nach rechts das nächste b (überliest a und Y), **S2** sucht das nächste c (überliest b und Z), **S3** läuft zurück. Liest S0 ein Y, sind alle a verbraucht: **S4** prüft, ob bis zum Blank nur noch Y und Z folgen – dann wird in S5 akzeptiert. Fehlt ein passendes b oder c, gibt es keinen Übergang und die Maschine hält in einem Nicht-Endzustand.',
      'b) Nach der ersten Runde (9 Schritte): Band □ X a Y b Z c □, Kopf auf dem a, Zustand S0.',
      `c) aabbc: Runde 1 markiert X, Y, Z; in Runde 2 wird das zweite a zu X, das zweite b zu Y, dann sucht S2 ein c – findet aber Z und dann das Blank. Für (S2, □) gibt es keinen Übergang: Die Maschine hält nach ${TR.anbncn_aabbc.steps} Schritten in ${TR.anbncn_aabbc.rows[TR.anbncn_aabbc.rows.length - 1][1]}, einem Nicht-Endzustand – abgelehnt.`,
    ]),
    D.img(IMG + 'band_anbncn.png', { widthCm: 9, caption: 'Lösung 4b: Band und Zustand nach der ersten Runde für aabbcc' }),
    D.h3('Aufgabe 5 – Fleißiger Biber'),
    ...D.bullets([
      `a) Maschine K: ${TR.kandidat.rows[TR.kandidat.rows.length - 1][2].replace(/[\[\]]/g, '').split(' ').filter((x) => x === '1').length} Einsen in ${TR.kandidat.steps} Schritten. Maschine B: 4 Einsen in ${TR.biber2.steps} Schritten (Band □ 1 1 1 1 □).`,
      'b) Nein: Maschine B ist der fleißige Biber mit 2 Zuständen – 4 Einsen sind das Maximum (Radó 1962, durch Ausprobieren aller Maschinen bewiesen). Werte: BB(1) = 1, BB(2) = 4, BB(3) = 6, BB(4) = 13, BB(5) = 4098 Einsen (47 176 870 Schritte; erst 2024 vollständig bewiesen). Für 6 Zustände ist der Wert unbekannt; die beste bekannte Maschine schreibt mehr als 10↑↑15 Einsen – eine Zahl, die man nicht mehr ausschreiben kann. Die Biber-Funktion wächst schneller als jede berechenbare Funktion.',
    ]),
    traceTable(TR.biber2, { widthsCm: [1.6, 1.8, 10.0, 4.0] }),
    D.h3('Aufgabe 6 – Unärer Addierer'),
    D.img(IMG + 'tm_unaer.png', { widthCm: 13, caption: 'Lösung 6: + wird zur 1 (S0 → S1), S1 läuft ans Ende, S2 löscht die letzte 1, S3 hält. 111+11 → 11111 in 8 Schritten.' }),
    D.h3('Aufgabe 7 – Grenzen jeder Maschine'),
    ...D.bullets([
      'a) TROTZ nutzt die Antwort von HALT über sich selbst und handelt genau entgegengesetzt. Behauptet HALT „TROTZ hält“, läuft TROTZ ewig – HALT hat sich geirrt. Behauptet HALT „TROTZ läuft ewig“, hält TROTZ – wieder ein Irrtum. Da HALT bei TROTZ in jedem Fall falsch liegt, kann es kein Programm geben, das für alle Programme korrekt entscheidet. (Beweis durch Widerspruch; Diagonalargument.)',
      'b) Die Aussage ist falsch: Es geht nicht um Rechenzeit, sondern um prinzipielle Unentscheidbarkeit – kein Algorithmus existiert, egal wie schnell die Hardware ist (Church-Turing-These: jeder Rechner ist höchstens so mächtig wie eine Turingmaschine). Für einzelne Programme kann man die Frage oft beantworten, aber nicht mit einem Verfahren für alle.',
    ]),
    D.h2('Typische Schwierigkeiten'),
    ...D.warn('Darauf achten', [
      ...D.bullets([
        '**Kopfbewegung vergessen:** SuS schreiben, bewegen aber nicht – jeder Übergang hat drei Teile (schreiben, bewegen, Zustand).',
        '**Halten = Fehler?** Bei der TM ist Halten normal (kein Übergang). Entscheidend ist, ob sie in einem Endzustand hält.',
        '**Blank als Eingabezeichen:** □ gehört zum Bandalphabet, nicht zu Σ (wie ε nicht zu Σ gehört).',
        '**„Der Keller könnte doch zweimal zählen“:** Die anschauliche Begründung ist kein Beweis – das ehrlich sagen (strenger Beweis: Pumping-Lemma für kontextfreie Sprachen, Universität).',
        '**Halteproblem als Rechenzeit-Problem** missverstehen – Aufgabe 7b thematisiert das gezielt.',
      ]),
    ]),
    D.h2('Differenzierung'),
    ...D.bullets([
      '**Basis:** Aufgaben 1–3a; Konfigurationsfolge mit Hilfe des Turing-Labors (Schrittmodus) abschreiben und erklären.',
      '**Standard:** Aufgaben 1–4 und 7.',
      '**Profi:** Aufgaben 5 und 6 (Challenge 2 im Turing-Labor zur Selbstkontrolle), Recherche fleißiger Biber (bbchallenge.org).',
    ]),
    D.h2('Abschluss der Einheit'),
    ...D.bullets([
      'Level-Quiz Welt D (#/quiz?welt=D, 8–10 Fragen) oder Mini-Exit-Ticket (#/quiz?ds=16, 3 Fragen) – Ergebnisse anonym, Fehlerfragen kurz besprechen.',
      'Lernlandkarte: Die SuS markieren sicher / unsicher / noch üben und notieren je einen Übungsschritt (Merkblatt, Boss-Level, App-Modul). Lehrkraft sammelt häufige „noch üben“-Felder für die Wiederholungsstunde vor der Übungsklausur.',
      'Feedback (AB16): drei offene Fragen; Auswertung in der nächsten Stunde.',
      'Hausaufgabe / Ausblick: Übungsklausur im Abi-Format (Uebungsklausur_Automaten-und-Sprachen.docx, 135 min, 45 BE) mit Erwartungshorizont zur Selbstkontrolle; Merkblatt M12 „Abi-Spickzettel“ zur Vorbereitung.',
    ]),
  ];
  return D.save(D.doc({ kind: 'LK', ds: 16, title: T, subtitle: SUB, kernfrage: KF, body }), OUT + 'DS16_Lehrkraft_Ausblick-Turingmaschine.docx');
}

// =====================================================================================  Folien
async function folien() {
  const d = S.deck({ ds: 16, title: T });
  d.title({ title: T, subtitle: SUB, kernfrage: KF, notes: 'Letztes Level: Aufgabenbörse (20 min), Turingmaschine (45 min), Abschluss (25 min). Aufgaben der Teams und Papierstreifen bereitlegen.' });
  d.section({ phase: 'Einstieg', title: 'Die Aufgabenbörse' });
  d.task({ title: 'Aufgabenbörse: Löst die Aufgabe eines anderen Teams', phase: 'Einstieg', steps: [
    'Jedes Team erhält die **Kurzversion** der Aufgabe eines anderen Teams.',
    'Löst sie wie im Abitur: **Operatoren** beachten, Notation einhalten, eigenes Blatt.',
    'Nach 15 Minuten: Erwartungshorizont vom Autorenteam holen und **vergleichen**.',
    '**Rückmeldung** an das Autorenteam (AB16, Aufgabe 1a): Was war klar? Was fehlte?',
  ], zeit: '20 min', sozialform: 'Teams', material: 'Aufgaben aus Level 15, AB16', notes: 'Lehrkraft sammelt zwei gelungene Aufgabenformulierungen für das Plenum. Zeit streng begrenzen.' });
  d.section({ phase: 'Erarbeitung', title: 'Wo der Keller an seine Grenze kommt' });
  d.question({ text: 'Kann ein Kellerautomat die Sprache aⁿbⁿcⁿ erkennen?', sub: 'aⁿbⁿ war kein Problem: Für jedes a ein A auf den Keller, für jedes b eines herunter. Und jetzt kommen noch genauso viele c …', phase: 'Erarbeitung', notes: 'Vermutungen sammeln. Viele SuS schlagen vor, zwei A pro a abzulegen – dann weiß der Automat beim ersten b nicht, wann die c beginnen.' });
  d.bullets({ title: 'Der Keller wird beim Vergleichen verbraucht', phase: 'Erarbeitung', items: [
    'Nach den b ist der Keller **leer** – die Information „wie viele a?“ ist weg',
    'Zwei A pro a? Beim ersten b weiß der Automat nicht, **wann die b aufhören**',
    'Anschaulich: **Ein Keller kann nur einmal abgezählt werden** (strenger Beweis: Universität)',
    'Was fehlt, ist eine Maschine, die ihre Eingabe **verändern** darf und beliebig oft **hin- und herläuft**',
    '→ Alan Turing, 1936: die **Turingmaschine**',
  ], size: 24, notes: 'Überleitung: Statt eines Stapels bekommt die Maschine ein Band, auf dem sie lesen UND schreiben darf.' });
  d.section({ phase: 'Erarbeitung', title: 'Die Turingmaschine' });
  d.image({ title: 'Aufbau: Band, Schreib-Lese-Kopf, Zustand', phase: 'Erarbeitung', img: IMG + 'band_aufbau.png', maxH: 4.2, caption: 'Das Band ist beidseitig unbegrenzt, leere Felder enthalten das Blank □. Der Kopf liest ein Feld, schreibt und bewegt sich um ein Feld.', notes: 'Vergleich: DEA liest nur (einmal, von links nach rechts); NKA hat zusätzlich einen Stapel; TM darf auf die Eingabe schreiben und sich frei bewegen.' });
  d.bullets({ title: 'Ein Übergang hat drei Teile', phase: 'Erarbeitung', items: [
    '**(Zustand, gelesenes Zeichen) → (Folgezustand, geschriebenes Zeichen, Bewegung)**',
    'Bewegung: **L** (links), **R** (rechts), **N** (bleibt stehen)',
    'Kantenbeschriftung im Graphen: „gelesen / geschrieben, Bewegung“, z. B. **1 / 0, L**',
    'Kein passender Übergang → die Maschine **hält**',
    'Hält sie in einem **Endzustand**, ist die Eingabe akzeptiert; der Bandinhalt ist die **Ausgabe**',
    'Start: Zustand S0, Kopf auf dem ersten Zeichen der Eingabe',
  ], size: 23, notes: 'Parallel das Merkblatt M11 markieren lassen. Blank gehört zum Bandalphabet Γ, nicht zu Σ.' });
  d.image({ title: 'Beispiel: Binärzahl + 1', phase: 'Erarbeitung', img: IMG + 'tm_binplus.png', sigma: 'Σ = {0, 1} · S0: ans Ende laufen · S1: Übertrag nach links tragen · S2: fertig', caption: 'Eingabe 1011 (= 11) → Ausgabe 1100 (= 12). Was passiert bei 111?', notes: 'Gemeinsam Schritt für Schritt auf 1011 ausführen (nächste Folie). Dann 111: Übertrag läuft bis vor die Zahl – das Blank wird zur 1.' });
  d.table({ title: 'Konfigurationsfolge für 1011', phase: 'Erarbeitung', rows: traceRows(TR.bin_1011), colW: [1.3, 1.5, 6.3, 3.0], size: 18, notes: '[NUR LEHRKRAFT] Kopfposition in eckigen Klammern. Schritt 4: Blank gelesen → Richtungswechsel nach links (S1). Schritte 6–7: Übertrag. Schritt 8: 0 wird zur 1, Halt in S2.' });
  d.task({ title: 'Unplugged: Du bist der Schreib-Lese-Kopf', phase: 'Übung', steps: [
    '**Kopf:** liest das Feld unter der Münze vor, radiert, schreibt, schiebt die Münze.',
    '**Steuerung:** sucht die Regel auf der Regelkarte, sagt sie an, wechselt die Zustandskarte.',
    'Nach jedem Schritt **Rollentausch**; Schritte zählen.',
    '„Binärzahl + 1“ für **1101** ausführen (AB16, Aufgabe 3a), Ergebnis dezimal prüfen.',
    'Dann: eigene Maschine „jedes a wird zu b“ entwerfen und testen (3b).',
  ], zeit: '15 min', sozialform: 'Tandem', material: 'Papierstreifen-Band, Zustands- und Regelkarten, AB16', app: '#/turing?challenge=1', notes: 'Schnelle Tandems: Aufgabe 4 mit dem Turing-Labor (programm=anbncn). Challenge 1 der App: fehlende Regel ergänzen.' });
  d.image({ title: 'aⁿbⁿcⁿ: Markieren, zurücklaufen, wiederholen', phase: 'Erarbeitung', img: IMG + 'tm_anbncn.png', maxH: 4.6, sigma: 'Pro Runde: ein a → X, ein b → Y, ein c → Z, zurück zum letzten X. Sind alle a verbraucht (S0 liest Y), prüft S4, ob nur noch Y und Z folgen.', caption: 'Das Band ist das Gedächtnis: Markierungen bleiben erhalten und können beliebig oft gelesen werden.', notes: 'Im Turing-Labor vorführen (aabbcc, dann aabbc → hält in S2, kein Endzustand).' });
  d.cards({ title: 'Rätsel: Der fleißige Biber', phase: 'Erarbeitung', cards: [
    { head: 'Die Frage', text: 'Welche Maschine mit n Zuständen schreibt auf leerem Band die meisten Einsen – und hält trotzdem?', icon: 'LuTrophy' },
    { head: 'Bekannt', text: ['BB(1) = 1, BB(2) = 4', 'BB(3) = 6, BB(4) = 13', 'BB(5) = 4098 (bewiesen 2024)'], icon: 'LuListChecks' },
    { head: 'Unbekannt', text: 'BB(6) ≥ 10↑↑15 – eine Zahl, die man nicht mehr ausschreiben kann. Die Biber-Funktion wächst schneller als jede berechenbare Funktion.', icon: 'LuInfinity' },
  ], size: 18, notes: 'AB16, Aufgabe 5: Maschine K (2 Einsen) vs. Maschine B (4 Einsen). Im Turing-Labor: programm=biber-2 und biber-3.' });
  d.bullets({ title: 'Church-Turing-These', phase: 'Erarbeitung', items: [
    '**Alles, was ein Algorithmus berechnen kann, kann eine Turingmaschine berechnen.**',
    'Jeder Computer, jede Programmiersprache ist **genauso mächtig** wie dieses einfache Modell – nicht mächtiger',
    'Eine **These**, kein Satz: nicht beweisbar, aber seit 1936 in jedem Fall bestätigt',
    'Deshalb ist die Turingmaschine **das** Modell, um über Berechenbarkeit zu sprechen',
    '  Chomsky-Hierarchie: Typ 3 DEA · Typ 2 NKA · Typ 0 Turingmaschine',
  ], size: 23, notes: 'Bezug zu DS14: Die Landkarte der Sprachen bekommt ihre äußerste Stufe.' });
  d.bullets({ title: 'Das Halteproblem – eine Geschichte', phase: 'Erarbeitung', items: [
    'Eine Firma verspricht das Programm **HALT**: Für jedes Programm P sagt es korrekt „hält“ oder „läuft ewig“',
    'Eine Informatikerin baut **TROTZ**: Es fragt HALT „Halte ich selbst?“ – und tut das **Gegenteil**',
    'Sagt HALT „hält“ → TROTZ läuft ewig.  Sagt HALT „läuft ewig“ → TROTZ hält sofort',
    'HALT irrt sich in jedem Fall → **HALT kann nicht existieren**',
    'Alan Turing, 1936: **Kein Algorithmus** entscheidet für alle Programme, ob sie halten',
    'Es gibt Grenzen, die keine Maschine überwindet – egal wie schnell',
  ], size: 22, notes: 'Erzählen, nicht beweisen. AB16, Aufgabe 7: Erläutern und Beurteilen („schnellerer Rechner“ hilft nicht – Unentscheidbarkeit ist keine Frage der Rechenzeit).' });
  d.app({ title: 'Turing-Labor', route: '#/turing?programm=binaer-plus-1', text: 'Maschinen Schritt für Schritt ausführen: **Binärzahl + 1**, **aⁿbⁿcⁿ**, **Fleißiger Biber**. Band beobachten, eigene Eingaben testen. Challenge: die fehlende Regel ergänzen.', phase: 'Übung', notes: 'Deep-Links: ?programm=binaer-plus-1 | anbncn | biber-2 | biber-3, ?challenge=1 | 2.' });
  d.task({ title: 'Abschluss: Quiz, Lernlandkarte, Feedback', phase: 'Abschluss', steps: [
    '**Level-Quiz Welt D** in der App (8 min).',
    '**Lernlandkarte:** jedes Level markieren – sicher / unsicher / noch üben; für jedes „noch üben“ eine konkrete Übung notieren (7 min).',
    '**Feedback** auf AB16: Was hat geholfen? Was anders? Welche Frage ist offen? (5 min)',
  ], zeit: '20 min', sozialform: 'Einzelarbeit', material: 'App, Lernlandkarte, AB16', app: '#/quiz?welt=D', notes: 'Quiz-Ergebnisse anonym; häufige Fehlerfragen kurz besprechen. Lernlandkarte liefert die Agenda für die Wiederholungsstunde.' });
  d.merke({ title: 'Merke: Turingmaschine', phase: 'Abschluss', items: [
    'Band + Schreib-Lese-Kopf + endlich viele Zustände; Übergang **(Zustand, gelesen) → (Zustand, geschrieben, L/R/N)**',
    'Sie darf **schreiben** und **hin- und herlaufen** – deshalb schafft sie aⁿbⁿcⁿ, woran der Keller scheitert',
    '**Church-Turing-These:** Jeder Algorithmus ist eine Turingmaschine',
    '**Halteproblem:** Kein Algorithmus entscheidet für alle Programme, ob sie halten',
  ], img: IMG + 'tm_binplus.png', imgW: 5.0 });
  d.end({ title: 'Was ihr aus dem AutomatenLab mitnehmt', items: ['Welt A: Automaten analysieren, entwickeln, minimieren, übersetzen (Mealy)', 'Welt B: Grenzen begründen, Kellerautomaten dokumentieren', 'Welt C: Grammatiken entwerfen, regulär ↔ kontextfrei, Chomsky-Hierarchie', 'Welt D: eigene Sprachen entwerfen – und die Turingmaschine als Ausblick'], hausaufgabe: 'Übungsklausur im Abi-Format (135 min, 45 BE) bearbeiten und mit dem Erwartungshorizont kontrollieren. Merkblatt M12 „Abi-Spickzettel“ nutzen.' });
  return d.save(OUT + 'DS16_Folien_Ausblick-Turingmaschine.pptx');
}

(async () => {
  const files = [await ab(), await lk(), await folien()];
  console.log(files.join('\n'));
})();
