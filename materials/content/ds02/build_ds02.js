const __MAT = require('path').resolve(__dirname, '../..'); // Wurzel: materials/
// DS02 – Level 2 „Was macht dieser Automat?“ – Arbeitsblatt, Lehrkraft-Handreichung, Folien
// Lösungen stammen aus automata_ds02.py (solutions.json) – vorher `python3 automata_ds02.py` ausführen.
const D = require((__MAT + '/lib/docstyle.js'));
const S = require((__MAT + '/lib/deckstyle.js'));
const SOL = require('./solutions.json');
const H = require('./helpers.js');
const IMG = (__MAT + '/build/img/ds02/');
const OUT = (__MAT + '/out/');
const T = 'Was macht dieser Automat?';
const SUB = 'Automaten analysieren – formale Definition, Sprache, Bedeutung von Zuständen';
const KF = 'Wie finde ich heraus, welche Sprache ein Automat erkennt – und was seine Zustände „bedeuten“?';
const FEHLER = 'Alle nicht eingezeichneten Übergänge führen in einen Fehlerzustand.';
const tbl = (rows) => rows.map((r) => [...r]);

// Die vier Mystery-Automaten des Einstiegs (= App-Fälle 3, 1, 8, 6)
const FAELLE = [
  { nr: 1, titel: 'Der Pendler', img: 'm1.png', app: 3, sprache: 'alle Wörter mit einer **geraden Anzahl a** (auch 0 a)', menge: 'L = {w ∈ {a, b}* | w enthält eine gerade Anzahl a}',
    bed: 'S0: bisher gerade Anzahl a gelesen · S1: bisher ungerade Anzahl a gelesen' },
  { nr: 2, titel: 'Der Schlusspunkt', img: 'm2.png', app: 1, sprache: 'alle Wörter, die **auf b enden**', menge: 'L = {w ∈ {a, b}* | w endet auf b}',
    bed: 'S0: zuletzt kein b gelesen (oder noch nichts) · S1: zuletzt b gelesen' },
  { nr: 3, titel: 'Spiegelbild?', img: 'm3.png', app: 8, sprache: 'alle **nichtleeren** Wörter, die mit **demselben Zeichen beginnen und enden**', menge: 'L = {w ∈ {a, b}* | w ≠ ε und erstes Zeichen = letztes Zeichen}',
    bed: 'S0: noch nichts gelesen · S1: begann mit a, zuletzt a · S2: begann mit a, zuletzt b · S3: begann mit b, zuletzt b · S4: begann mit b, zuletzt a' },
  { nr: 4, titel: 'Abstand halten', img: 'm4.png', app: 6, sprache: 'alle Wörter, in denen **nie zwei a direkt hintereinander** stehen', menge: 'L = {w ∈ {a, b}* | w enthält nicht das Teilwort aa}',
    bed: 'S0: zuletzt kein a gelesen (oder noch nichts) · S1: zuletzt ein a gelesen – ein weiteres a führt in den Fehlerzustand', fehler: true },
];
const TESTW = ['ε', 'a', 'b', 'aa', 'ab', 'ba', 'bb', 'aba', 'bab', 'abba', 'baab', 'aab'];

// =====================================================================================  Arbeitsblatt
async function ab() {
  const body = [
    D.p('In Level 1 hast du Automaten benutzt, deren Aufgabe du schon kanntest. Im Abitur ist es oft umgekehrt: Du bekommst einen Automaten und sollst herausfinden, **was er tut** und **was seine Zustände bedeuten**. Dafür brauchst du ein paar präzise Begriffe – Details findest du im Merkblatt **M01** (Abschnitte 1, 4 und 5).'),
    ...D.info('Fachbegriffe für die Analyse', [
      ...D.bullets([
        '**Formale Definition:** Ein DEA ist ein 5-Tupel **A = (Q, Σ, δ, S0, F)** – Zustandsmenge Q, Eingabealphabet Σ, Übergangsfunktion δ: Q × Σ → Q, Startzustand S0, Menge der Endzustände F ⊆ Q.',
        '**Übergangstabelle:** In Zeile Si und Spalte x steht δ(Si, x). → markiert den Startzustand, * die Endzustände.',
        '**Wort** = endliche Zeichenfolge über Σ; **ε** = leeres Wort; **Σ*** = Menge aller Wörter über Σ.',
        '**Sprache L(A)** = Menge aller Wörter, die A akzeptiert, z. B. L(A) = {w ∈ {a, b}* | w endet auf b}.',
      ]),
    ]),
    D.task({ nr: 1, title: 'Graph – Tabelle – Definition', niveau: 'Basis', afb: 'I', body: [
      D.sub('a', '**Gib** die formale Definition des Automaten A aus Abbildung 1 **an**: Nenne Q, Σ, den Startzustand und F und **stelle** δ als Übergangstabelle **dar**.'),
      ...H.cols([
        D.img(IMG + 'a1_zweib.png', { widthCm: 8.2, caption: 'Abbildung 1: Automat A mit Σ = {a, b}' }),
        [D.p('Q = ……………………………………', { after: 120 }), D.p('Σ = ………………   S0 ist Startzustand', { after: 120 }), D.p('F = ………………', { after: 120 }),
          ...D.fillTable(['δ', 'a', 'b'], 3, { widthsCm: [2.2, 2.2, 2.2], rowHeightCm: 0.6, noSpacer: false })],
      ], [9.6, 7.8]),
      D.sub('b', 'Ein Automat B über Σ = {0, 1} ist durch die folgende Übergangstabelle gegeben. **Zeichne** den Zustandsgraphen.'),
      ...H.cols([
        D.table(tbl(SOL.a1b_table), { widthsCm: [1.7, 1.5, 1.5], center: [0, 1, 2], noSpacer: true }),
        D.drawBox(3.4, 'Platz für deinen Zustandsgraphen', { widthCm: 12.2 }),
      ], [4.9, 12.5]),
      D.sub('c', '**Untersuche**, welche Wörter der Automat B akzeptiert. **Beschreibe** L(B) in Worten und **gib an**, ob ε ∈ L(B) gilt.'),
      ...D.lines(2),
    ] }),
    D.task({ nr: 2, title: 'Das Barcode-Startzeichen', niveau: 'Basis', afb: 'I–II', body: [
      D.p('Ein Lagerscanner liest Barcodes als Bitfolgen. Ein gültiger Code beginnt immer mit dem **Startzeichen 110**, danach folgen die Datenbits. Der Automat in Abbildung 2 prüft das Startzeichen.'),
      D.img(IMG + 'barcode.png', { widthCm: 10, caption: 'Abbildung 2: Startzeichen-Prüfer, Σ = {0, 1}. ' + FEHLER }),
      D.sub('a', '**Stelle** die Verarbeitung der Bitfolgen `1101`, `1110` und `0110` **dar** und **gib** jeweils **an**, ob sie akzeptiert werden.'),
      ...D.lines(3),
      D.sub('b', '**Erläutere** die Bedeutung der Zustände S1, S2 und S3 im Sachzusammenhang.'),
      ...D.lines(3),
      D.sub('c', '**Gib** die akzeptierte Sprache L in Mengenschreibweise **an** und **begründe**, dass ε nicht akzeptiert wird.'),
      ...D.lines(2),
      D.sub('d', 'Der Scanner soll nur noch Codes akzeptieren, bei denen nach dem Startzeichen **mindestens ein Datenbit** folgt. **Verändere** den Automaten entsprechend (Fehlerzustand darf weggelassen werden).'),
      ...D.drawBox(2.6),
    ] }),
    D.task({ nr: 3, title: 'Prüfnummer: Quersumme gerade?', niveau: 'Standard', afb: 'II', app: '#/arena?automat=quersumme', body: [
      ...H.cols([
        D.p('Bestellnummern eines Versandhändlers bestehen nur aus den Ziffern 1, 2 und 3. Eine Nummer gilt als gültig, wenn ihre **Quersumme gerade** ist. Der Automat in Abbildung 3 überprüft das.'),
        D.img(IMG + 'quersumme.png', { widthCm: 6.6, caption: 'Abbildung 3: Quersummen-Prüfer, Σ = {1, 2, 3}' }),
      ], [10.2, 7.2]),
      D.sub('a', '**Stelle** die Verarbeitung der Bestellnummern `1232` und `3112` **dar**.'),
      ...D.lines(2),
      D.sub('b', '**Erläutere** die Bedeutung der Zustände S0 und S1 in Bezug auf die Problemstellung.'),
      ...D.lines(2),
      D.sub('c', '**Erläutere**, warum die Ziffer 2 niemals einen Zustandswechsel bewirkt.'),
      ...D.lines(2),
      D.sub('d', 'Das Eingabealphabet wird zu Σ = {0, 1, 2, 3, 4, 5, 6, 7} erweitert. **Begründe**, dass der Automat keine weiteren Zustände benötigt, und **gib an**, wie die Beschriftungen der Übergänge lauten.'),
      ...D.lines(3),
    ] }),
    D.task({ nr: 4, title: 'Prüfnummer mit Trennzeichen', niveau: 'Profi', afb: 'II–III', body: [
      H.pk('Eine andere Art von Prüfnummern besteht aus zwei Ziffernfolgen über {1, 2, 3}, die durch ein Trennzeichen „-“ getrennt sind, z. B. `22-13`. Der Automat in Abbildung 4 entscheidet, ob eine Prüfnummer gültig ist – nach welchem Kriterium, sollst du herausfinden.'),
      D.img(IMG + 'pruefnummer.png', { widthCm: 12.5, caption: 'Abbildung 4: Prüfnummern-Automat, Σ = {1, 2, 3, -}. ' + FEHLER }),
      D.sub('a', '**Stelle** die Verarbeitung der Prüfnummern `2-12` und `13-22` **dar**.'),
      ...D.lines(2),
      D.sub('b', '**Erläutere** die Bedeutung der Zustände S2 und S3 in Bezug auf die Problemstellung.'),
      ...D.lines(2),
      D.sub('c', '**Untersuche**, welche Prüfnummern akzeptiert werden, und **formuliere** das Kriterium, das der Automat überprüft.'),
      ...D.lines(2),
      D.sub('d', '**Untersuche**, ob zwei Zustände zusammengefasst werden können, ohne die Funktion des Automaten zu verändern. (Vertiefung: Level 5)'),
      ...D.lines(2),
    ] }),
    ...D.qr({ route: '#/detektiv', title: 'Sprach-Detektiv', text: 'Neue Fälle! Löse die Fälle 2, 4, 7, 9 und 12 (die Fälle 1, 3, 6 und 8 kennst du schon aus dem Einstieg). Teste Wörter, bevor du dich festlegst – nach dem Lösen siehst du die Bedeutung der Zustände.' }),
    ...D.qr({ route: '#/arena?stufe=2', title: 'Akzeptor-Arena · Stufe 2', text: 'Längere Wörter, Graphen mit Rückkanten: Entscheide schnell, ob akzeptiert wird. Wer schafft eine Serie von 15?' }),
    D.h3('Selbstcheck – Level 2 geschafft, wenn …'),
    ...D.checklist([
      'ich einen DEA formal als A = (Q, Σ, δ, S0, F) angeben und zwischen Graph und Übergangstabelle übersetzen kann.',
      'ich die Begriffe Wort, ε, Σ* und Sprache L(A) korrekt verwende.',
      'ich durch gezieltes Testen herausfinde, welche Sprache ein Automat akzeptiert, und sie in Worten und in Mengenschreibweise angebe.',
      'ich die Bedeutung von Zuständen im Sachzusammenhang erläutern kann („Der Automat ist genau dann in Si, wenn …“).',
    ]),
    D.pageBreak(),
    D.h2('Boss-Training (Hausaufgabe): Was macht er?'),
    D.p('Bearbeiten Sie die Aufgaben im Stil des Abiturs auf einem separaten Blatt. Die Operatoren entsprechen der Abi-Operatorenliste.', { size: 21 }),
    D.task({ nr: 'H1', title: 'Der Passwort-Prüfer', punkte: 9, body: [
      D.p('Ein Webdienst prüft neue Passwörter mit einem endlichen Automaten. Jedes Zeichen eines Passworts wird dabei durch seine Zeichenart ersetzt: **k** für einen Kleinbuchstaben, **g** für einen Großbuchstaben, **z** für eine Ziffer. Aus `Abc7` wird so `gkkz`.'),
      D.img(IMG + 'passwort.png', { widthCm: 9.5, caption: 'Abbildung 5: Zustandsgraph des Passwort-Prüfers, Σ = {k, g, z}' }),
      D.sub('a', 'Stellen Sie die Verarbeitung der Eingaben `kgzz` und `gzk` dar. [2\u00a0BE]'),
      D.sub('b', 'Geben Sie zwei unterschiedlich lange Eingaben an, die akzeptiert werden und alle drei Zeichenarten enthalten. [2\u00a0BE]'),
      D.sub('c', 'Erläutern Sie die Bedeutung der Zustände S1 und S2 im Sachzusammenhang. [3\u00a0BE]'),
      D.sub('d', 'Geben Sie die Regel an, nach der der Automat ein Passwort akzeptiert. [2\u00a0BE]'),
    ] }),
    D.task({ nr: 'H2', title: 'Der geheimnisvolle Automat', punkte: 10, body: [
      D.img(IMG + 'vorletztes.png', { widthCm: 9.5, caption: 'Abbildung 6: Zustandsgraph eines Automaten mit Σ = {a, b}' }),
      D.sub('a', 'Stellen Sie die Verarbeitung der Wörter `abba` und `baab` dar. [2\u00a0BE]'),
      D.sub('b', 'Erläutern Sie die Bedeutung aller vier Zustände. [4\u00a0BE]'),
      D.sub('c', 'Beschreiben Sie die vom Automaten akzeptierte Sprache und geben Sie sie in Mengenschreibweise an. [2\u00a0BE]'),
      D.sub('d', 'Begründen Sie, dass S3 ein Endzustand sein muss, obwohl der Automat in S3 zuletzt ein b gelesen hat. [2\u00a0BE]'),
    ] }),
  ];
  return D.save(D.doc({ kind: 'AB', ds: 2, title: T, subtitle: SUB, kernfrage: KF, body }), OUT + 'DS02_AB_Was-macht-dieser-Automat.docx');
}

// =====================================================================================  Lehrkraft
async function lk() {
  const fallkarte = (f) => [
    D.p(`**Fall ${f.nr}: „${f.titel}“**`, { size: 24, color: D.C.teal, after: 40 }),
    ...D.img(IMG + f.img, { widthCm: f.nr === 3 ? 7.4 : 6.2 }),
    D.p('Σ = {a, b}' + (f.fehler ? '  ·  ' + FEHLER : ''), { size: 17, color: D.C.muted, after: 60 }),
    D.p('**Ermittlungsauftrag:** Testet verdächtige Wörter (ε, a, b, aa, ab, ba, aba, abba …). Welche Wörter akzeptiert der Automat?', { size: 19, after: 40 }),
    D.p('L = { w ∈ {a, b}* | ……………………………………… }', { size: 19, after: 40 }),
    D.p('Was „weiß“ der Automat in jedem Zustand?', { size: 19, after: 0 }),
  ];
  const body = [
    D.h2('Überblick'),
    D.table([
      ['Aspekt', 'Inhalt'],
      ['Lernziele', 'Die SuS geben einen DEA formal als A = (Q, Σ, δ, S0, F) an, übersetzen zwischen Zustandsgraph und Übergangstabelle, verwenden die Begriffe Wort, ε, Σ*, Sprache L(A), ermitteln durch systematisches Testen die akzeptierte Sprache und erläutern die Bedeutung von Zuständen im Sachzusammenhang.'],
      ['KC-Bezug', 'Automatenmodelle: Aufbau und Funktionsweise eines DEA beschreiben (K1); Funktion gegebener Automaten analysieren (K4). PK1.1 (Fachbegriffe), PK2.2 (Modelle analysieren), PK3.1 (Darstellungsformen wechseln).'],
      ['Abi-Bezug', 'Operatoren „darstellen“ (Verarbeitung), „erläutern“ (Bedeutung von Zuständen), „untersuchen“ (akzeptierte Eingaben), „angeben“ (Regel/Sprache). Zur Vertiefung: **Abi 2025 eA Aufgabe B, Teile a und b** (Prüfnummern, Kriterium X; AB-Aufgaben 3/4 sind daran angelehnt, Teile c und d als Ausblick auf Level 5), **Abi 2021 Nachschreibtermin eA Aufgabe D, Teil a** (RobProg: Zustandsfolge zeigen, Bedeutung von S4), **Abi 2022 eA Aufgabe C, Teil a** (Regel des Automaten angeben, Folgen angeben).'],
      ['Material', 'Folien DS02, AB02 (inkl. Boss-Training als HA), Merkblatt M01 (Abschnitte 1, 4, 5), Fallkarten (Kopiervorlage unten), AutomatenLab „Sprach-Detektiv“ (#/detektiv) und „Akzeptor-Arena“ (#/arena?stufe=2, #/arena?automat=quersumme)'],
      ['Vorbereitung', 'Fallkarten je Gruppe einmal kopieren (4 Karten pro Umschlag), Punkte-Tabelle an der Tafel vorbereiten, App-Links/QR-Codes prüfen. Optional: Fallkarten laminieren und mit abwischbaren Stiften bearbeiten lassen.'],
    ], { widthsCm: [3.2, 14.2], firstColBold: true, firstColFill: true }),
    D.h2('Verlaufsplan (90 Minuten)'),
    D.table([
      ['Zeit', 'Phase', 'Unterrichtsgeschehen', 'Sozialform / Medien'],
      ['0–5', 'Einstieg', 'Rückblick HA: zwei Alltagsautomaten (Zustände, Eingaben) kurz vorstellen lassen. Überleitung: „Heute bekommt ihr Automaten ohne Beschreibung – was tun sie?“', 'UG, Folie 1'],
      ['5–25', 'Einstieg', 'Wettbewerb „Sprach-Detektiv“ (Folien 3–6): Gruppen (3–4 SuS) erhalten einen Umschlag mit vier Fallkarten und ermitteln jeweils die Sprache und die Bedeutung der Zustände. 12 Minuten Ermittlung, dann Auflösung mit Punktevergabe.', 'GA, Fallkarten, Tafel'],
      ['25–45', 'Erarbeitung', 'Fachsprache für die Analyse (Folien 8–13): formale Definition A = (Q, Σ, δ, S0, F) am „Pendler“, Übergangstabelle ↔ Graph, Wort, ε, Σ*, L(A). „Zustand = Gedächtnis“ am Fall „Spiegelbild?“, Satzbausteine für „Erläutern Sie die Bedeutung …“.', 'LV/UG, Folien, M01'],
      ['45–80', 'Übung', 'AB02 nach Niveau (Basis 1–2, Standard 3, Profi 4). Zwischensicherung nach ca. 20 Minuten: Aufgabe 2b (Bedeutung der Zustände) mit Satzbausteinen. Schnelle SuS: Sprach-Detektiv Fälle 2, 4, 7, 9, 12 bzw. Arena Stufe 2.', 'EA/PA, AB02, iPads'],
      ['80–90', 'Sicherung', 'Merke-Folie und M01 (Abschnitte 1, 4, 5) lesen, Abi-Check „Bedeutung von Zuständen erläutern“. Exit-Frage: „Warum wird ε genau dann akzeptiert, wenn S0 ein Endzustand ist?“ HA: Boss-Training.', 'UG, M01'],
    ], { widthsCm: [1.6, 2.4, 10.2, 3.2], size: 19 }),
    D.h2('Wettbewerb „Sprach-Detektiv“'),
    D.p('Jede Gruppe erhält einen Umschlag mit den vier Fallkarten. Die Gruppen dürfen die Fälle in beliebiger Reihenfolge bearbeiten. Sobald eine Gruppe einen Fall gelöst zu haben glaubt, schreibt sie die Sprache auf einen Zettel und gibt ihn bei der Lehrkraft ab (Zeitstempel). Nach 12 Minuten folgt die Auflösung mit Folie 6 und der Tabelle unten.'),
    D.table([
      ['Punkte pro Fall', 'Kriterium'],
      ['2', 'Sprache korrekt in Worten beschrieben (Grenzfälle wie ε beachtet)'],
      ['1', 'Sprache korrekt in Mengenschreibweise L = {w ∈ {a, b}* | …}'],
      ['1', 'Bedeutung aller Zustände korrekt angegeben'],
      ['+1', 'Bonus: erste Gruppe mit vollständig korrekter Lösung des Falls'],
    ], { widthsCm: [3.2, 14.2], size: 19, center: [0] }),
    ...D.tip('Hinweise zur Moderation', [...D.bullets([
      'Typische Fehlvermutung bei Fall 3: „Palindrome“ oder „beginnt und endet mit a“. Gegenbeispiel bereithalten: `abaa` ist kein Palindrom, wird aber akzeptiert. Wichtig: ε wird **nicht** akzeptiert, obwohl ε „mit sich selbst übereinstimmt“.',
      'Bei Fall 4 wird oft „höchstens ein a“ vermutet – Gegenbeispiel `aba` (akzeptiert).',
      'Nachfrage, die auf die Erarbeitung vorbereitet: „Wie habt ihr die Sprache gefunden?“ → Strategie: kurze Wörter systematisch testen, Wege zu den Endzuständen verfolgen, **Bedeutung der Zustände** formulieren.',
    ], { size: 20 })]),
    D.h3('Kopiervorlage: Fallkarten (Umschlag pro Gruppe)'),
    D.table([
      [fallkarte(FAELLE[0]), fallkarte(FAELLE[1])],
      [fallkarte(FAELLE[2]), fallkarte(FAELLE[3])],
    ], { widthsCm: [8.7, 8.7], header: false }),
    D.h3('Lösung der Fälle'),
    D.table([
      ['Fall', 'Sprache', 'Bedeutung der Zustände', 'Kontrolle (Simulation)'],
      ...FAELLE.map((f, i) => [`${f.nr} „${f.titel}“`, f.sprache[0].toUpperCase() + f.sprache.slice(1) + '. ' + f.menge, f.bed,
        ['**akzeptiert:** ' + TESTW.filter((w) => SOL.mtest['m' + (i + 1)][w]).join(', '), '**abgelehnt:** ' + TESTW.filter((w) => !SOL.mtest['m' + (i + 1)][w]).join(', ')]]),
    ], { widthsCm: [2.3, 5.2, 5.6, 4.3], size: 17 }),
    D.p(`Die vier Fälle sind in der App als Fälle ${FAELLE.map((f) => f.app).join(', ')} hinterlegt; für die Übungsphase eignen sich die übrigen Fälle (2, 4, 7, 9, 12).`, { size: 19, color: D.C.muted }),

    D.h2('Lösungen AB02'),
    D.h3('Aufgabe 1 – Graph, Tabelle, Definition'),
    D.p('a) A = (Q, Σ, δ, S0, F) mit Q = {S0, S1, S2}, Σ = {a, b}, Startzustand S0, F = {S2} und'),
    ...D.table(tbl(SOL.a1_table), { widthsCm: [2.6, 2.6, 2.6], align: 'center', center: [0, 1, 2], size: 19 }),
    D.p('b) Zustandsgraph zur Übergangstabelle:'),
    ...D.img(IMG + 'a1_endet00.png', { widthCm: 7.2 }),
    D.p('c) B akzeptiert genau die Bitfolgen, die auf **00** enden: L(B) = {w ∈ {0, 1}* | w endet auf 00}. Bedeutung: S1 „zuletzt genau eine 0“, S2 „zuletzt mindestens zwei Nullen“. ε ∉ L(B), da S0 kein Endzustand ist.'),
    D.h3('Aufgabe 2 – Barcode-Startzeichen'),
    D.table([['Bitfolge', 'Verarbeitung'], ...Object.entries(SOL.bar)], { widthsCm: [2.4, 15.0], size: 19 }),
    ...D.bullets([
      'b) **S1:** Das erste Bit war 1 – der Anfang des Startzeichens passt. **S2:** Bisher wurde „11“ gelesen; es fehlt noch die 0 des Startzeichens. **S3:** Das Startzeichen 110 wurde vollständig erkannt; beliebige Datenbits dürfen folgen, der Code ist gültig.',
      'c) L = {w ∈ {0, 1}* | w beginnt mit 110}. ε wird nicht akzeptiert, weil S0 kein Endzustand ist – im Sachzusammenhang: Ohne Startzeichen ist kein Code gültig.',
      'd) Es wird ein zusätzlicher Zustand benötigt („Startzeichen gelesen, noch kein Datenbit“):',
    ]),
    ...D.img(IMG + 'barcode2.png', { widthCm: 10 }),
    D.h3('Aufgabe 3 – Quersumme gerade?'),
    D.table([['Nummer', 'Verarbeitung'], ...Object.entries(SOL.qs).map(([w, s]) => [w, s + (w === '1232' ? '  (Quersumme 8)' : '  (Quersumme 7)')])], { widthsCm: [2.4, 15.0], size: 19 }),
    ...D.bullets([
      'b) **S0:** Die Quersumme der bisher gelesenen Ziffern ist gerade (zu Beginn: noch keine Ziffer, Quersumme 0). **S1:** Die bisherige Quersumme ist ungerade. Nur S0 ist Endzustand, weil die Bestellnummer genau dann gültig ist, wenn die Quersumme am Ende gerade ist.',
      'c) Eine gerade Zahl ändert die Parität einer Summe nicht: gerade + 2 = gerade, ungerade + 2 = ungerade. Deshalb hat die Ziffer 2 in beiden Zuständen eine Schleife. Die Ziffern 1 und 3 sind ungerade und wechseln die Parität.',
      'd) Der Automat merkt sich nur die **Parität** der Quersumme, und es gibt nur zwei Paritäten. Neue Ziffern sind entweder gerade (0, 2, 4, 6 → Schleife) oder ungerade (1, 3, 5, 7 → Zustandswechsel). Beschriftungen:',
    ]),
    ...D.img(IMG + 'quersumme07.png', { widthCm: 6.4 }),
    D.h3('Aufgabe 4 – Prüfnummer mit Trennzeichen (Profi)'),
    D.table([['Prüfnummer', 'Verarbeitung'], ...Object.entries(SOL.pn).filter(([w]) => w !== '21-3')], { widthsCm: [2.4, 15.0], size: 19 }),
    ...D.bullets([
      'b) **S2:** In der ersten Ziffernfolge wurde mindestens eine Ziffer gelesen, ihre Quersumme ist bisher **ungerade**. Ein Trennzeichen führt hier in den Fehlerzustand. **S3:** Das Trennzeichen wurde gelesen, die erste Ziffernfolge hatte eine **gerade** Quersumme; von der zweiten Ziffernfolge wurde noch keine Ziffer gelesen.',
      'c) Akzeptiert werden genau die Prüfnummern aus zwei nichtleeren Ziffernfolgen über {1, 2, 3} mit genau einem Trennzeichen, bei denen die Quersumme der **ersten Folge gerade** und die der **zweiten Folge ungerade** ist (z. B. `2-12`: 2 und 3; `22-1`: 4 und 1). `21-3` wird abgelehnt (erste Quersumme 3): ' + SOL.pn['21-3'] + '.',
      `d) Die Zustände **${SOL.pn_eq.map((p) => p.join(' und ')).join(', ')}** können zusammengefasst werden: Beide sind keine Endzustände, und von beiden führen 1 und 3 nach S4 sowie 2 nach S5 (bzw. in sich selbst). Bedeutung beider: „erste Folge gerade, zweite Folge bisher gerade“ – ob in S3 schon eine Ziffer gelesen wurde, ist unerheblich, da eine leere zweite Folge (Quersumme 0) ohnehin abgelehnt wird. Alle anderen Paare sind unterscheidbar (z. B. S1/S3 durch „-1“) – Markierungsverfahren in der Vertiefung Level 5.`,
    ]),
    D.h3('Boss-Training (Hausaufgabe) – Erwartungshorizont'),
    D.table([
      ['Teil', 'Erwartung', 'BE'],
      ['H1 a', `${SOL.pw.kgzz}; ${SOL.pw.gzk}`, '2'],
      ['H1 b', `z. B. \`${SOL.pw_bsp[0]}\` (3 Zeichen) und \`${SOL.pw_bsp[1]}\` (5 Zeichen)`, '2'],
      ['H1 c', 'S1: Es wurde mindestens ein Großbuchstabe gelesen, das zuletzt gelesene Zeichen ist aber keine Ziffer. S2: Mindestens ein Großbuchstabe wurde gelesen und das zuletzt gelesene Zeichen ist eine Ziffer – das Passwort wäre jetzt gültig.', '3'],
      ['H1 d', 'Ein Passwort wird akzeptiert, wenn es mindestens einen Großbuchstaben enthält und mit einer Ziffer endet.', '2'],
      ['H2 a', `${SOL.v.abba}; ${SOL.v.baab}`, '2'],
      ['H2 b', 'S0: Unter den letzten beiden Zeichen ist kein a (zuletzt „bb“, oder es wurde noch nichts bzw. nur b gelesen). S1: Das letzte Zeichen ist a, das davor war b oder fehlt („ba“ bzw. Wort „a“). S2: Die letzten beiden Zeichen sind „aa“. S3: Die letzten beiden Zeichen sind „ab“.', '4'],
      ['H2 c', 'Akzeptiert werden alle Wörter, deren **vorletztes Zeichen ein a** ist: L = {w ∈ {a, b}* | das vorletzte Zeichen von w ist a}.', '2'],
      ['H2 d', 'In S3 sind die letzten beiden Zeichen „ab“ – das vorletzte Zeichen ist also a. Endet die Eingabe hier, erfüllt sie die Bedingung und muss akzeptiert werden (z. B. `bab`).', '2'],
    ], { widthsCm: [1.5, 14.6, 1.3], size: 18, center: [2] }),
    D.h2('Typische Schwierigkeiten'),
    ...D.warn({ titel: 'Darauf achten', fallen: ['P10', 'P3', 'P1'] }, [...D.bullets([
      '**Bedeutung = Wiederholung des Graphen:** „In S1 wurde 1 gelesen.“ reicht nicht. Gefordert ist, was der Automat über **das gesamte bisher gelesene Wort** weiß – im Sachzusammenhang („erste Bit des Startzeichens korrekt“).',
      '**ε vergessen:** Bei der Sprachbeschreibung prüfen, ob S0 Endzustand ist (Fall 1: ε ∈ L, Fall 3: ε ∉ L).',
      '**Zu enge Vermutungen:** Sprache nur aus akzeptierten Beispielen ableiten. Immer auch Gegenbeispiele testen (Fall 3: Die Vermutung „Palindrome“ scheitert an `abaa`.).',
      '**Formale Definition:** δ ist eine **Funktion** Q × Σ → Q; F ist eine **Menge** (auch bei nur einem Endzustand: F = {S2}). Ein Fehlerzustand gehört zu Q, wenn der Automat vollständig angegeben wird.',
    ], { size: 20 })]),
    D.h2('Differenzierung'),
    ...D.bullets([
      '**Basis:** Aufgaben 1 und 2; Hilfe: Satzbausteine aus M01 (Abschnitt 5) nutzen, Zustandsfolgen mit dem Finger ablaufen.',
      '**Standard:** Aufgaben 1–3, App-Arena mit `#/arena?automat=quersumme`. **Profi:** Aufgabe 4, danach Original Abi 2025 eA B, Teile a–d.',
      'Für Schnelle: Sprach-Detektiv Fälle 9 („Gemischtes Doppel“) und 12 („Vier Ecken“) – Vorbereitung auf die Produkt-Idee in Level 3.',
    ]),
    D.p('**Hausaufgabe: Boss-Training „Was macht er?“** (AB02, letzte Seite, ca. 30 min, 19 BE). Erwartungshorizont oben ggf. zur Selbstkontrolle ausgeben.'),
  ];
  return D.save(D.doc({ kind: 'LK', ds: 2, title: T, subtitle: SUB, kernfrage: KF, body }), OUT + 'DS02_Lehrkraft_Was-macht-dieser-Automat.docx');
}

// =====================================================================================  Folien
async function folien() {
  const d = S.deck({ ds: 2, title: T });
  d.title({ title: T, subtitle: SUB, kernfrage: KF, notes: 'Level 2. Heute drehen wir die Perspektive um: Nicht wir bauen den Automaten, sondern wir bekommen einen und müssen herausfinden, was er tut – genau so beginnen die meisten Abi-Aufgaben.' });
  d.section({ phase: 'Einstieg', title: 'Sprach-Detektiv' });
  d.question({ text: 'Ein Automat ohne Beschreibung: Wie findet ihr heraus, welche Wörter er akzeptiert?', sub: 'Ihr seid Detektive – die Wörter sind eure Zeugen.', notes: 'Kurze Ideensammlung: Wörter ausprobieren, Wege zu den Endzuständen verfolgen, überlegen, was die Zustände „wissen“. Dann Wettbewerb starten.' });
  d.task({ title: 'Wettbewerb: Vier ungelöste Fälle', phase: 'Einstieg', steps: [
    'Jede Gruppe erhält einen Umschlag mit **vier Fallkarten**.',
    'Testet verdächtige Wörter: ε, a, b, aa, ab, ba, aba, abba …',
    'Notiert die **Sprache** in Worten und als L = {w ∈ {a, b}* | …}.',
    'Notiert für jeden Zustand, was der Automat dort **weiß**.',
    'Fall gelöst? Zettel abgeben – die schnellste korrekte Gruppe erhält einen Bonuspunkt.',
  ], zeit: '12 min', sozialform: 'Gruppen (3–4)', material: 'Fallkarten', notes: 'Punkte: 2 Sprache in Worten, 1 Mengenschreibweise, 1 Bedeutung aller Zustände, +1 Bonus für die erste vollständig richtige Gruppe pro Fall. Punktestand an der Tafel.' });
  {
    const s4 = d.blank({ title: 'Die vier Fälle', phase: 'Einstieg', notes: 'Zum Mitprojizieren während der Ermittlung. Fall 4: Hinweis zum Fehlerzustand betonen.' });
    FAELLE.forEach((f, i) => {
      const x = 0.6 + (i % 2) * 6.15, y = 1.45 + Math.floor(i / 2) * 2.85, w = 5.95, h = 2.7;
      s4.addShape(d.pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: S.H.tealTint2 }, line: { color: S.H.tealTint }, rectRadius: 0.08 });
      d.tb(s4, [{ text: `Fall ${f.nr}: ${f.titel}`, options: { bold: true, fontFace: 'Cambria', fontSize: 19, color: S.H.tealDark, breakLine: true } },
        { text: f.fehler ? 'Fehlende Übergänge → Fehlerzustand' : 'Σ = {a, b}', options: { fontSize: 14, color: S.H.muted } }], { x: x + 0.2, y: y + 0.15, w: 2.2, h: 1.2 });
      const ft = d.fit(IMG + f.img, w - 2.5, h - 0.3);
      s4.addImage({ path: IMG + f.img, x: x + w - ft.w - 0.15, y: y + (h - ft.h) / 2, w: ft.w, h: ft.h });
    });
  }
  d.table({ title: 'Auflösung', phase: 'Einstieg', size: 18, colW: [2.6, 5.0, 4.5], rows: [
    ['Fall', 'Sprache L', 'Bedeutung der Zustände'],
    ...FAELLE.map((f) => [`${f.nr} ${f.titel}`, f.sprache.replace(/\*\*/g, ''), f.bed.replace(/ · /g, '\n')]),
  ], notes: 'Häufige Fehlvermutungen: Fall 3 „Palindrome“ – Gegenbeispiel abaa (kein Palindrom, wird aber akzeptiert). Fall 4 „höchstens ein a“ – Gegenbeispiel aba (wird akzeptiert). Bei Fall 1 und 4 ist ε in L, bei Fall 2 und 3 nicht.' });
  d.section({ phase: 'Erarbeitung', title: 'Die Sprache der Analyse' });
  d.bullets({ title: 'Formale Definition eines DEA', items: [
    '**A = (Q, Σ, δ, S0, F)**',
    '**Q** = {S0, S1}: endliche Menge der Zustände',
    '**Σ** = {a, b}: Eingabealphabet',
    '**δ**: Q × Σ → Q, z. B. δ(S0, a) = S1',
    '**S0**: Startzustand',
    '**F** = {S0}: Menge der Endzustände',
  ], img: IMG + 'm1.png', imgW: 4.8, notes: 'Am Fall 1 „Der Pendler“. Betonen: δ ist eine Funktion – für jedes Paar (Zustand, Zeichen) genau ein Ergebnis. Das ist „deterministisch“.' });
  const sTab = d.table({ title: 'Graph ↔ Übergangstabelle', size: 24, colW: [2.2, 2.2, 2.2], rows: tbl(SOL.m1_table), notes: 'Lesen: Zeile = aktueller Zustand, Spalte = gelesenes Zeichen, Zelle = Folgezustand. → Startzustand, * Endzustand. Gemeinsam die Tabelle für Fall 2 an der Tafel aufstellen lassen.' });
  { const ft = d.fit(IMG + 'm1.png', 5.4, 3.5); sTab.addImage({ path: IMG + 'm1.png', x: 13.333 - 0.6 - ft.w, y: 1.8, w: ft.w, h: ft.h });
    d.tb(sTab, [{ text: 'Zeile = aktueller Zustand · Spalte = gelesenes Zeichen · Zelle = Folgezustand', options: { fontSize: 18, color: S.H.muted } }], { x: 0.6, y: 3.6, w: 6.6, h: 1.0 });
    d.tb(sTab, [{ text: '→ Startzustand    * Endzustand', options: { fontSize: 18, color: S.H.muted } }], { x: 0.6, y: 4.6, w: 6.6, h: 0.5 }); }
  d.cards({ title: 'Wörter und Sprachen', cards: [
    { head: 'Wort', text: 'endliche Folge von Zeichen aus Σ, z. B. abba', icon: 'LuType' },
    { head: 'ε', text: 'das leere Wort – akzeptiert genau dann, wenn S0 Endzustand ist', icon: 'LuCircleDashed' },
    { head: 'Σ*', text: 'Menge aller Wörter über Σ, einschließlich ε', icon: 'LuInfinity' },
    { head: 'L(A)', text: 'die Sprache von A: alle Wörter, die A akzeptiert', icon: 'LuFilter' },
  ], notes: 'Mengenschreibweise üben: L(A) = {w ∈ {a, b}* | w endet auf b}. Frage: Ist ε ∈ L für Fall 2? (Nein, S0 ist kein Endzustand.)' });
  d.question({ text: 'Was „weiß“ der Automat, wenn er sich in S2 befindet?', sub: 'Fall 3 „Spiegelbild?“ – Zustand = Gedächtnis über das **gesamte** bisher gelesene Wort', img: IMG + 'm3.png', imgH: 3.2, notes: 'Antwort: Das Wort begann mit a, das zuletzt gelesene Zeichen war b. Herausarbeiten: Ein Zustand fasst ALLE Wörter zusammen, die dorthin führen – die Bedeutung muss für alle diese Wörter stimmen.' });
  d.image({ title: 'Barcode-Startzeichen 110', img: IMG + 'barcode.png', sigma: 'Σ = {0, 1}', caption: FEHLER, maxH: 4.4, notes: 'Gemeinsam: Bedeutung von S1 formulieren. Schlechte Antwort: „In S1 wurde eine 1 gelesen.“ Gute Antwort: „Das erste Bit des Startzeichens (1) wurde korrekt gelesen, es fehlen noch 1 und 0.“' });
  d.table({ title: 'Abi-Check: Bedeutung von Zuständen erläutern', size: 18, colW: [4.2, 7.9], rows: [
    ['Baustein', 'Beispiel'],
    ['Der Automat befindet sich genau dann in Si, wenn …', '… die bisherige Quersumme ungerade ist.'],
    ['In Si wurde bisher … gelesen / ist bekannt, dass …', '… das Startzeichen 110 vollständig gelesen wurde.'],
    ['Si ist (k)ein Endzustand, weil …', '… eine Bestellnummer mit ungerader Quersumme ungültig ist.'],
    ['Aus Si führt x nach Sj, weil …', '… eine gerade Ziffer die Parität nicht ändert.'],
  ], notes: 'Diese Satzbausteine stehen auch auf M01 (Abschnitt 5). Abi 2025 eA B b und Abi 2021 Nach D a verlangen genau das.' });
  d.section({ phase: 'Übung', title: 'Arbeitsblatt Level 2' });
  d.task({ title: 'Auftrag: AB02', steps: [
    '**Basis:** Aufgaben 1 und 2',
    '**Standard:** Aufgabe 3 (Quersumme gerade?)',
    '**Profi:** Aufgabe 4 (Prüfnummer mit Trennzeichen)',
    'Fertig? **Sprach-Detektiv**: Fälle 2, 4, 7, 9, 12',
  ], zeit: '35 min', sozialform: 'Einzel → Partner', material: 'AB02, Merkblatt M01', app: '#/detektiv', notes: 'Zwischensicherung nach ca. 20 Minuten: Aufgabe 2b mit Satzbausteinen. Profis vergleichen Aufgabe 4d untereinander.' });
  d.app({ title: 'Sprach-Detektiv', route: '#/detektiv', text: 'Welche Sprache erkennt der Automat? Teste Wörter, wähle eine von vier Beschreibungen. Falsch geraten? Die App zeigt dir ein **Gegenbeispiel**.', notes: 'Die Fälle 1, 3, 6, 8 entsprechen den Fallkarten aus dem Einstieg.' });
  d.app({ title: 'Akzeptor-Arena · Stufe 2', route: '#/arena?stufe=2', text: 'Längere Wörter, Graphen mit Rückkanten. Mit `#/arena?automat=quersumme` trainierst du gezielt den Quersummen-Prüfer aus Aufgabe 3.', notes: 'Für SuS, die mit dem AB fertig sind; Bestwerte notieren.' });
  d.section({ phase: 'Sicherung', title: 'Was wir heute gelernt haben' });
  d.merke({ title: 'Merke: Automaten analysieren', items: [
    'Ein DEA ist ein 5-Tupel **A = (Q, Σ, δ, S0, F)** mit δ: Q × Σ → Q.',
    '**L(A)** ist die Menge aller Wörter aus Σ*, die A akzeptiert. ε ∈ L(A) ⇔ S0 ∈ F.',
    'Sprache finden: kurze Wörter **systematisch testen**, Wege zu Endzuständen verfolgen, mit **Gegenbeispielen** absichern.',
    'Bedeutung eines Zustands: Was gilt für **jedes** Wort, das in diesen Zustand führt? – im Sachzusammenhang formulieren.',
  ], img: IMG + 'quersumme.png', imgW: 4.4 });
  d.end({ items: ['Formale Definition A = (Q, Σ, δ, S0, F) und Übergangstabelle', 'Wort, ε, Σ*, Sprache L(A)', 'Sprache eines Automaten untersuchen', 'Bedeutung von Zuständen im Sachzusammenhang erläutern'], hausaufgabe: 'Boss-Training „Was macht er?“ (AB02, letzte Seite): zwei Automaten im Abi-Format analysieren.' });
  return d.save(OUT + 'DS02_Folien_Was-macht-dieser-Automat.pptx');
}

(async () => {
  const files = [await ab(), await lk(), await folien()];
  console.log(files.join('\n'));
})();
