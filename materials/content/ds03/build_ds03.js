const __MAT = require('path').resolve(__dirname, '../..'); // Wurzel: materials/
// DS03 – Level 3 „Bauplan gesucht“ – Arbeitsblatt, Lehrkraft-Handreichung, Folien
// Lösungen stammen aus automata_ds03.py (solutions.json) – vorher `python3 automata_ds03.py` ausführen.
const D = require((__MAT + '/lib/docstyle.js'));
const S = require((__MAT + '/lib/deckstyle.js'));
const H = require('../ds02/helpers.js');
const SOL = require('./solutions.json');
const IMG = (__MAT + '/build/img/ds03/');
const OUT = (__MAT + '/out/');
const T = 'Bauplan gesucht';
const SUB = 'DEA systematisch entwickeln – Bausteine und Vorgehen';
const KF = 'Wie entwickle ich systematisch einen Automaten für eine gegebene Sprache?';
const FEHLER = 'Alle nicht eingezeichneten Übergänge führen in einen Fehlerzustand.';
const SCHRITTE = [
  '**Erinnerungen sammeln:** Was muss sich der Automat über das bisher Gelesene merken?',
  '**Zustände festlegen:** je Erinnerung ein Zustand – Bedeutung notieren.',
  '**Übergänge eintragen:** für **jeden** Zustand und **jedes** Zeichen aus Σ.',
  '**Start- und Endzustände** bestimmen: Wo beginnt man? Welche Erinnerungen bedeuten „akzeptieren“?',
  '**Testen** mit Grenzfällen: ε, sehr kurze Wörter, Beispiel- und Gegenbeispielwörter.',
];

// =====================================================================================  Arbeitsblatt
async function ab() {
  const body = [
    D.p('Bisher hast du Automaten gelesen – jetzt baust du sie selbst. Gute Automaten entstehen nicht durch Probieren, sondern nach einem **Bauplan**: Du überlegst, was sich der Automat merken muss, und setzt bekannte **Bausteine** zusammen. Alle Bausteine mit Mini-Graphen findest du im Merkblatt **M02**.'),
    ...D.info('Vorgehen in 5 Schritten', [...D.numbered(SCHRITTE, { ref: 'numbers', size: 20 })]),
    D.task({ nr: 1, title: 'Bausteine anwenden', niveau: 'Basis', afb: 'I–II', app: '#/baukasten?stufe=1', body: [
      D.p('**Entwickle** jeweils einen DEA über Σ = {a, b} und **nenne** den verwendeten Baustein. Der Fehlerzustand darf weggelassen werden – dann gehört der Hinweis dazu.'),
      ...H.cols([
        [D.sub('a', 'Alle Wörter, die mit „ba“ beginnen.'), ...D.drawBox(3.0, 'Baustein: ……………………', { widthCm: 8.5 })],
        [D.sub('b', 'Alle Wörter mit genau einem a.'), ...D.drawBox(3.0, 'Baustein: ……………………', { widthCm: 8.5 })],
      ], [8.7, 8.7], { valign: 'top' }),
      H.subk('c', 'Alle Wörter, die mindestens drei b enthalten.'),
      ...D.drawBox(2.5, 'Baustein: ……………………'),
    ] }),
    D.pageBreak(),
    D.task({ nr: 2, title: 'Neuanfang nicht vergessen', niveau: 'Standard', afb: 'II', app: '#/baukasten?aufgabe=endet-ab', body: [
      D.p('Gesucht ist ein DEA über Σ = {a, b}, der genau die Wörter akzeptiert, die auf **„aba“** enden.'),
      H.subk('a', '**Entwickle** den Zustandsgraphen. Gib den Automaten **vollständig** an und notiere die Bedeutung jedes Zustands.'),
      ...D.drawBox(3.2),
      H.subk('b', '**Teste** deinen Automaten: Trage für jedes Wort ein, ob es akzeptiert werden **soll**, und **stelle** die Verarbeitung durch deinen Automaten **dar**.'),
      ...D.table([
        ['Wort', 'soll akzeptiert werden?', 'Zustandsfolge in deinem Automaten', 'stimmt?'],
        ...SOL.a2_tests.map(([w]) => [w, '', '', '']),
      ], { widthsCm: [2.0, 3.4, 9.8, 2.2], center: [0, 1, 3], rowHeightCm: 0.6 }),
      D.sub('c', 'Nach „aba“ wird ein b gelesen. **Erläutere**, in welchen Zustand dein Automat dann wechseln muss, und **begründe** deine Entscheidung mit einem Testwort.'),
      ...D.lines(2),
    ] }),
    D.task({ nr: 3, title: 'Das Gegenteil', niveau: 'Standard', afb: 'II', app: '#/baukasten?aufgabe=komplement-aa', body: [
      ...H.cols([
        [D.sub('a', 'Abbildung 1 zeigt einen vollständigen DEA für alle Wörter über {a, b}, die „bb“ enthalten. **Entwickle** daraus einen DEA für alle Wörter, die „bb“ **nicht** enthalten.')],
        D.img(IMG + 'a3_bb.png', { widthCm: 7.6, caption: 'Abbildung 1: „enthält bb“' }),
      ], [9.6, 7.8]),
      ...D.drawBox(2.3),
      H.pk('Lena möchte einen DEA für alle Wörter, die **nicht** mit „ab“ beginnen. Sie nimmt den Automaten für „beginnt mit ab“ (Fehlerzustand weggelassen) und tauscht End- und Nicht-Endzustände. Ergebnis: Abbildung 2.'),
      D.img(IMG + 'a3_praefix_falsch.png', { widthCm: 7.6, caption: 'Abbildung 2: Lenas Automat. ' + FEHLER }),
      D.sub('b', '**Zeige** mit einem Gegenbeispiel, dass Lenas Automat nicht korrekt arbeitet, **erläutere** die Fehlerursache und **zeichne** einen korrekten Automaten.'),
      ...D.lines(1),
      ...D.drawBox(2.3),
    ] }),
    D.task({ nr: 4, title: 'Zwei Bedingungen gleichzeitig', niveau: 'Standard', afb: 'II', app: '#/baukasten?aufgabe=gerade-a-endet-b', body: [
      D.p('Gesucht ist ein DEA über Σ = {a, b} für alle Wörter, in denen die **Anzahl der a gerade** UND die **Anzahl der b ungerade** ist.'),
      D.sub('a', '**Ergänze** die Tabelle der „Erinnerungspaare“.'),
      ...D.table([
        ['Zustand', 'Anzahl a bisher', 'Anzahl b bisher', 'Endzustand?'],
        ['S0', 'gerade', 'gerade', ''], ['S1', '', '', ''], ['S2', '', '', ''], ['S3', '', '', ''],
      ], { widthsCm: [2.4, 4.0, 4.0, 3.0], center: [0, 1, 2, 3], rowHeightCm: 0.65, align: 'center' }),
      H.subk('b', '**Entwickle** den Zustandsgraphen.'),
      ...D.drawBox(3.0),
      D.sub('c', 'Nun sollen alle Wörter akzeptiert werden, in denen die Anzahl der a gerade **ODER** die Anzahl der b ungerade ist. **Gib an**, was du am Automaten ändern musst, und **begründe**, dass keine neuen Übergänge nötig sind.'),
      ...D.lines(2),
    ] }),
    D.task({ nr: 5, title: 'Der Retro-Controller', niveau: 'Profi', afb: 'III', app: '#/baukasten?aufgabe=konsole', body: [
      D.p('Ein Retro-Controller hat die blauen Tasten **A** und **B** und die roten Tasten **X** und **O**. Mit der Taste **E** wird ein Code bestätigt. Ein selbst gewählter Entsperrcode ist gültig, wenn gilt:'),
      ...D.numbered([
        'Mindestens eins der Zeichen A oder X kommt im Code vor.',
        'Es werden **mindestens zwei rote** Tasten gedrückt.',
        'Der Code endet mit E (E kommt nur am Ende vor).',
      ], { ref: 'numbers2' }),
      D.p('Gültig sind z. B. `AOXE` und `XXE`, ungültig sind `OOBE` und `AOE`. Σ = {A, B, X, O, E}.'),
      D.sub('a', '**Begründe**, dass sich ein Automat für diese Codes nach der Eingabe X und nach der Eingabe O in verschiedenen Zuständen befinden muss.'),
      ...D.lines(2),
      H.subk('b', '**Entwickle** einen DEA, der genau die gültigen Codes akzeptiert (Fehlerzustand darf weggelassen werden). *Tipp:* Zustand = Paar (A oder X schon da? · Anzahl roter Tasten 0 / 1 / mindestens 2).'),
      ...D.drawBox(3.5),
      D.sub('c', '**Gib** für jeden deiner Zustände die Bedeutung im Sachzusammenhang **an**.'),
      ...D.lines(2),
      D.sub('d', 'Im Original (Abitur 2024) lautet Regel (2): „Jede der Farben Blau und Rot kommt mindestens einmal vor.“ **Entwickle** diesen Automaten im Baukasten (Challenge „Spielekonsolen-Code“) und **vergleiche** die Anzahl der Zustände.'),
      ...D.lines(1),
    ] }),
    ...D.qr({ route: '#/baukasten', title: 'Automaten-Baukasten', text: 'Baue deinen Automaten und lass ihn prüfen. Ist er falsch, bekommst du ein **Gegenbeispiel** – das kürzeste Wort, bei dem er irrt. An den Aufgaben 2–4 stehen **verwandte** Challenges zum selben Baustein (z. B. „endet auf ab“ statt „aba“) – ideal zum Aufwärmen oder als Zusatz.' }),
    D.h3('Selbstcheck – Level 3 geschafft, wenn …'),
    ...D.checklist([
      'ich zu einer Sprachbeschreibung die nötigen Erinnerungen finde und daraus Zustände ableite.',
      'ich die Bausteine (Präfix, Teilwort, Endung, Zählen, Produkt, Komplement) sicher anwende.',
      'ich meinen Automaten mit Grenzfällen (ε, kurze Wörter) und Gegenbeispielen teste.',
    ]),
    D.h3('Hausaufgabe'),
    ...D.bullets([
      'Baukasten: **„Anzahl a durch 3 teilbar“** (`?aufgabe=a-mod-3`) und **„Anfang gleich Ende“** (`?aufgabe=anfang-ende`); Profis zusätzlich **„Binärzahl durch 3 teilbar“** (`?aufgabe=binaer-3`).',
      'Erfinde eine **eigene Challenge** für deine Sitznachbarin / deinen Sitznachbarn: Σ, Sprache, je drei Ja- und Nein-Wörter, Musterlösung auf der Rückseite.',
    ], { size: 20 }),
  ];
  return D.save(D.doc({ kind: 'AB', ds: 3, title: T, subtitle: SUB, kernfrage: KF, body }), OUT + 'DS03_AB_Bauplan-gesucht.docx');
}

// =====================================================================================  Lehrkraft
async function lk() {
  const body = [
    D.h2('Überblick'),
    D.table([
      ['Aspekt', 'Inhalt'],
      ['Lernziele', 'Die SuS entwickeln DEAs systematisch nach einem 5-Schritte-Vorgehen, wenden die Konstruktionsbausteine festes Präfix, Teilwort, Endung, Zählen (genau / mindestens / modulo), Produkt („Paare von Erinnerungen“) und Komplement an und überprüfen ihre Automaten mit Grenzfällen und Gegenbeispielen.'],
      ['KC-Bezug', 'Automatenmodelle als Zustandsgraphen entwickeln und implementieren (K3); „implementieren“ über den Automaten-Baukasten bzw. flaci.com. PK1.5 (Modelle entwickeln), PK3.2 (Lösungen überprüfen), IK3.2.'],
      ['Abi-Bezug', 'Operatoren „entwickeln/entwerfen“, „ergänzen/verändern“, „begründen“ (Zustände müssen verschieden sein). Zur Vertiefung: **Abi 2024 eA Aufgabe B, Teile a–c** (Spielekonsolen-Code; AB-Aufgabe 5 ist eine Variante mit veränderter Regel (2)), **Abi 2022 eA Aufgabe C, Teil b** (Begründen, dass 30 und 03 in verschiedene Zustände führen; vollständigen DEA entwerfen), **Abi 2025 eA Aufgabe B, Teil f** (Zustandsgraph ergänzen).'],
      ['Material', 'Folien DS03, AB03, Merkblatt M02 „DEA entwickeln – Bausteine & Vorgehen“, AutomatenLab „Automaten-Baukasten“ (#/baukasten, Challenges per ?aufgabe=…)'],
      ['Vorbereitung', 'M02 kopieren (beidseitig), iPads/App-Zugang prüfen; ggf. Folienstift für die gemeinsame Konstruktion am Einstiegsbeispiel.'],
    ], { widthsCm: [3.2, 14.2], firstColBold: true, firstColFill: true }),
    D.h2('Verlaufsplan (90 Minuten)'),
    D.table([
      ['Zeit', 'Phase', 'Unterrichtsgeschehen', 'Sozialform / Medien'],
      ['0–10', 'Einstieg', 'Denkfrage (Folien 3–4): „Gerade Anzahl a UND endet auf b – was muss sich der Automat merken?“ Think-Pair-Share; Ergebnis: zwei unabhängige Erinnerungen → vier Paare.', 'EA → PA → UG'],
      ['10–35', 'Erarbeitung', 'Bausteine-Galerie (Folien 6–8): Präfix, Teilwort, Endung, Zählen genau/mindestens, modulo, Produkt, Komplement. 5-Schritte-Vorgehen am Einstiegsbeispiel gemeinsam durchführen inkl. Testtabelle und typischen Fallen (Folien 9–12). M02 austeilen.', 'LV/UG, Folien, M02'],
      ['35–80', 'Übung', 'AB03 gestuft: Basis 1, Standard 2–4, Profi 5. Kontrolle eigenständig im Baukasten (Gegenbeispiel-Feedback). Lehrkraft berät; Zwischenstopp nach ca. 20 min: typischer Fehler „Neuanfang“ (Aufgabe 2) am Beispiel `ababa`.', 'EA/PA, AB03, iPads'],
      ['80–90', 'Sicherung', 'Abi-Check (Folie 17): „Begründen Sie, dass sich der Automat nach x und y in verschiedenen Zuständen befinden muss.“ Antwortmuster an Aufgabe 5a. Merke-Folie, HA.', 'UG, M02'],
    ], { widthsCm: [1.6, 2.4, 10.2, 3.2], size: 19 }),
    ...D.tip('Hinweis zum Einstiegsbeispiel', [D.p(`Die Produktkonstruktion liefert vier Zustände. Der Automat ist korrekt, aber nicht minimal: Die Zustände ${SOL.produkt_eq.map((p) => p.join(' und ')).join(', ')} („ungerade Anzahl a“ mit bzw. ohne b am Ende) sind gleichwertig, weil bei ungerader Anzahl a das letzte Zeichen keine Rolle spielt. Das ist kein Fehler – die Produkt-Idee ist ein sicherer Bauplan; das Zusammenfassen folgt in Level 5 (Vertiefung). Die Baukasten-Challenge „gerade-a-endet-b“ prüft nur die Sprache und akzeptiert beide Varianten.`, { size: 20 })]),

    D.h2('Lösungen AB03'),
    D.h3('Aufgabe 1 – Bausteine anwenden'),
    ...H.cols([
      [D.p('a) Festes Präfix „ba“:', { size: 20 }), ...D.img(IMG + 'a1a.png', { widthCm: 7.4 })],
      [D.p('b) Zählen genau (ein a):', { size: 20 }), ...D.img(IMG + 'a1c.png', { widthCm: 5.4 })],
    ], [8.7, 8.7]),
    D.p('c) Zählen mindestens (drei b):', { size: 20 }),
    ...D.img(IMG + 'a1b.png', { widthCm: 10 }),
    D.small('Bei a) und b) führen alle nicht eingezeichneten Übergänge in einen Fehlerzustand (Hinweis muss notiert sein).'),
    D.h3('Aufgabe 2 – Endet auf „aba“'),
    ...D.img(IMG + 'a2_aba.png', { widthCm: 11.5 }),
    D.p('Bedeutung: S0 – kein passender Anfang; S1 – zuletzt „a“; S2 – zuletzt „ab“; S3 – zuletzt „aba“ (Endzustand).', { size: 20 }),
    D.table([['Wort', 'soll?', 'Zustandsfolge (Musterlösung)'], ...SOL.a2_tests], { widthsCm: [2.0, 1.8, 13.6], size: 19 }),
    D.p(`c) Nach „aba“ + b sind die letzten Zeichen „ab“ – das ist schon wieder der Anfang von „aba“. Der Automat muss nach **S2** (nicht nach S0) wechseln. Ein Automat mit S3 –b→ S0 lehnt z. B. \`${SOL.a2_bug_cex}\` fälschlich ab.`, { size: 20 }),
    D.h3('Aufgabe 3 – Das Gegenteil'),
    ...H.cols([
      [D.p('a) Vollständigen Automaten nehmen und End- und Nicht-Endzustände tauschen:', { size: 20 }), ...D.img(IMG + 'a3_nichtbb.png', { widthCm: 7.6 })],
      [D.p('b) Korrekt: zuerst den Fehlerzustand explizit machen (hier S3), dann tauschen:', { size: 20 }), ...D.img(IMG + 'a3_praefix_komplement.png', { widthCm: 7.6 })],
    ], [8.7, 8.7], { valign: 'top' }),
    D.p(`b) Gegenbeispiel: \`${SOL.a3_falsch[0]}\` beginnt nicht mit „ab“, wird von Lenas Automat aber abgelehnt (weitere: ${SOL.a3_falsch.slice(1, 5).map((w) => '`' + w + '`').join(', ')}). Ursache: Der weggelassene Fehlerzustand ist **kein Endzustand** und bleibt es beim Tauschen – alle Wörter, die dort landen, werden weiterhin abgelehnt. Komplementbildung funktioniert nur bei **vollständigen** Automaten.`, { size: 20 }),
    D.h3('Aufgabe 4 – Zwei Bedingungen gleichzeitig'),
    ...H.cols([
      D.table([
        ['Zustand', 'Anzahl a', 'Anzahl b', 'End?'],
        ['S0', 'gerade', 'gerade', 'nein'], ['S1', 'gerade', 'ungerade', 'ja'], ['S2', 'ungerade', 'gerade', 'nein'], ['S3', 'ungerade', 'ungerade', 'nein'],
      ], { widthsCm: [1.7, 2.1, 2.1, 1.4], size: 18, center: [0, 3], noSpacer: true }),
      D.img(IMG + 'a4_und.png', { widthCm: 6.0, caption: 'b) a gerade UND b ungerade' }),
    ], [7.6, 9.8]),
    D.p(`c) Gleicher Graph, nur andere Endzustände: F = {${SOL.a4_oder_finals.join(', ')}} (alle Paare, in denen „a gerade“ oder „b ungerade“ gilt). Die Übergänge hängen nur davon ab, wie sich die Erinnerungen ändern – nicht davon, welche Kombination akzeptiert wird.`, { size: 20 }),
    D.h3('Aufgabe 5 – Der Retro-Controller (Profi)'),
    D.p(`a) Nach X ist Regel (1) bereits erfüllt, nach O nicht. Mit dem Zusatz „${SOL.kv_unterscheide}“ wird XOE akzeptiert, OOE dagegen abgelehnt. Wären beide Eingaben im selben Zustand, müsste der Automat beide Wörter gleich behandeln. Musterlösung: ${SOL.kv_z_paths[0]}; ${SOL.kv_z_paths[1]}.`, { size: 20 }),
    ...D.img(IMG + 'konsole_var.png', { widthCm: 10.2, caption: 'b) Musterlösung mit 7 Zuständen. ' + FEHLER }),
    D.table([
      ['Zustand', 'Bedeutung (c)'],
      ['S0', 'Weder A noch X gedrückt, noch keine rote Taste (höchstens B).'],
      ['S1', 'Weder A noch X, genau eine rote Taste (ein O).'],
      ['S2', 'Weder A noch X, mindestens zwei rote Tasten (nur O).'],
      ['S3', 'A gedrückt, aber noch keine rote Taste.'],
      ['S4', 'Regel (1) erfüllt, genau eine rote Taste.'],
      ['S5', 'Regeln (1) und (2) erfüllt – es fehlt nur noch E.'],
      ['S6', 'Gültiger Code (mit E abgeschlossen); jede weitere Taste führt in den Fehlerzustand.'],
    ], { widthsCm: [2.0, 15.4], size: 18, center: [0] }),
    D.table([['Code', 'Verarbeitung durch die Musterlösung'], ...Object.entries(SOL.kv_tests)], { widthsCm: [2.2, 15.2], size: 18 }),
    D.p(`d) Die Abitur-Regel („beide Farben“) benötigt **${SOL.ka_states} Zustände** ohne Fehlerzustand (Variante: ${SOL.kv_states}). Musterlösung zum Vergleich (entspricht der Referenz der Baukasten-Challenge „konsole“):`, { size: 20 }),
    ...D.img(IMG + 'konsole_abi.png', { widthCm: 11, caption: FEHLER }),
    D.h2('Typische Schwierigkeiten'),
    ...D.warn('Darauf achten', [...D.bullets([
      '**Neuanfang vergessen:** Bei „endet auf“ und „enthält“ springen viele bei einem „falschen“ Zeichen immer nach S0. Testwort mit Überlappung (`ababa`, `aaba`) bereithalten.',
      '**Unvollständige Automaten:** Bei „endet auf“ darf es keinen Fehlerzustand geben – jedes Zeichen kann noch zu einem akzeptierten Wort führen.',
      '**Komplement:** Tauschen nur bei vollständigem Automaten (Aufgabe 3b).',
      '**Produkt:** SuS bauen zwei getrennte Automaten nebeneinander. Klarstellen: Ein Zustand speichert **beide** Erinnerungen gleichzeitig (Paar).',
      '**Testen:** ε wird oft vergessen – ist S0 Endzustand, wird ε akzeptiert.',
    ], { size: 20 })]),
    D.h2('Differenzierung'),
    ...D.bullets([
      '**Basis:** Aufgabe 1 mit M02 als Vorlage; Baukasten Stufe 1 (`#/baukasten?stufe=1`).',
      '**Standard:** Aufgaben 2–4; verwandte Baukasten-Challenges zum selben Baustein: „endet-ab“, „komplement-aa“, „gerade-a-endet-b“ (die AB-Sprachen selbst – aba, nicht bb, a gerade UND b ungerade – sind keine Challenges; Kontrolle über die Testtabellen bzw. den freien Modus).',
      '**Profi:** Aufgabe 5 und anschließend Original Abi 2024 eA B a–c; Zusatz: Abi 2022 eA C b (Trainer, Summenregel).',
      'Hilfekarten: Für Aufgabe 2 die Bedeutungen „zuletzt a / ab / aba“ vorgeben; für Aufgabe 5 die Paar-Tabelle (2 × 3) vorgeben.',
    ]),
    D.p('**Hausaufgabe:** Baukasten-Challenges „a-mod-3“ und „anfang-ende“ (Profis: „binaer-3“) sowie eine eigene Challenge für die Sitznachbarin / den Sitznachbarn (Σ, Sprache, je drei Ja-/Nein-Wörter, Musterlösung). Die Paare tauschen ihre Challenges zu Beginn der nächsten Stunde als Warm-up (in Bonus-Level 4 oder 5 Minuten zu Beginn von Level 6).'),
  ];
  return D.save(D.doc({ kind: 'LK', ds: 3, title: T, subtitle: SUB, kernfrage: KF, body }), OUT + 'DS03_Lehrkraft_Bauplan-gesucht.docx');
}

// =====================================================================================  Folien
async function folien() {
  const d = S.deck({ ds: 3, title: T });
  d.title({ title: T, subtitle: SUB, kernfrage: KF, notes: 'Level 3: vom Lesen zum Bauen. Ziel: ein verlässlicher Bauplan statt Ausprobieren.' });
  d.section({ phase: 'Einstieg', title: 'Was muss sich der Automat merken?' });
  d.question({ text: 'Ein DEA soll alle Wörter über {a, b} akzeptieren, die eine gerade Anzahl a enthalten UND auf b enden.', sub: 'Was muss er sich **mindestens** merken? Erst allein (1 min), dann zu zweit (2 min).', notes: 'Think-Pair-Share. Erwartete Antworten: „Anzahl a“ (→ nur gerade/ungerade nötig!), „letztes Zeichen“ (→ nur: war es b?).' });
  d.cards({ title: 'Zwei Erinnerungen – vier Paare', phase: 'Einstieg', cards: [
    { head: 'Erinnerung 1', text: 'Anzahl a bisher: **gerade** oder **ungerade**', icon: 'LuHash' },
    { head: 'Erinnerung 2', text: 'Zuletzt gelesenes Zeichen war **b**: ja oder nein', icon: 'LuHistory' },
    { head: 'Zustände', text: 'Jedes **Paar** von Erinnerungen ist ein Zustand: 2 · 2 = 4', icon: 'LuGrid2X2' },
    { head: 'Endzustand', text: 'nur das Paar (gerade, ja)', icon: 'LuFlag' },
  ], notes: 'Hier wird die Produkt-Idee vorbereitet. Wir konstruieren den Automaten gleich mit dem 5-Schritte-Vorgehen.' });
  d.section({ phase: 'Erarbeitung', title: 'Bausteine-Galerie' });
  H.gallery(d, S, { title: 'Bausteine I: Anfang, Mitte, Ende', rows: true, items: [
    { head: 'Festes Präfix', text: 'beginnt mit „ab“ – falscher Anfang → Fehlerzustand', img: IMG + 'b_praefix.png' },
    { head: 'Teilwort enthalten', text: 'enthält „ab“ – gefunden ist gefunden', img: IMG + 'b_teilwort.png' },
    { head: 'Endung', text: 'endet auf „ab“ – kein Fehlerzustand, Rückkanten!', img: IMG + 'b_endung.png' },
  ], notes: 'Präfix: Bei falschem Anfang Fehlerzustand (Hinweis!). Teilwort: Endzustand mit Schleife. Endung: Zustand = „wie viel vom Muster passt am Ende gerade“ – jedes Zeichen kann alles noch ändern.' });
  H.gallery(d, S, { title: 'Bausteine II: Zählen', rows: true, items: [
    { head: 'genau n', text: 'genau zwei a – das dritte a → Fehlerzustand', img: IMG + 'b_genau.png' },
    { head: 'mindestens n', text: 'mindestens zwei a – ab n bleibt man im Endzustand', img: IMG + 'b_mindestens.png' },
    { head: 'modulo k', text: 'Anzahl a durch 3 teilbar – Zustände im Kreis', img: IMG + 'b_modulo.png' },
  ], notes: 'Zählen geht nur beschränkt: genau/mindestens n braucht n+1 Zustände (plus ggf. Fehler); modulo k braucht k Zustände. Unbeschränktes Zählen → Level 7.' });
  H.gallery(d, S, { title: 'Bausteine III: Kombinieren und Umkehren', textH: 1.2, items: [
    { head: 'Produkt: Paare von Erinnerungen', text: 'gerade Anzahl a UND endet auf b · Zustand = (Parität a, zuletzt b?)', img: IMG + 'b_produkt.png' },
    { head: 'Komplement: Endzustände tauschen', text: 'enthält **nicht** „ab“ – nur bei **vollständigem** Automaten!', img: IMG + 'b_komplement.png' },
  ], notes: 'Produkt: S0 = (gerade, nein), S1 = (gerade, ja), S2 = (ungerade, nein), S3 = (ungerade, ja). Komplement: aus „enthält ab“ – S2 war Endzustand, jetzt S0 und S1.' });
  d.bullets({ title: 'Das 5-Schritte-Vorgehen', items: SCHRITTE.map((x, i) => x.replace('**', `**${i + 1}  `)), size: 22, notes: 'Gemeinsam am Einstiegsbeispiel durchführen. Schritt 3 betonen: für JEDEN Zustand JEDES Zeichen.' });
  d.image({ title: 'Ergebnis: gerade Anzahl a UND endet auf b', img: IMG + 'b_produkt.png', sigma: 'S0 = (gerade, nein) · S1 = (gerade, ja) · S2 = (ungerade, nein) · S3 = (ungerade, ja)', maxH: 4.9, notes: 'Für Interessierte: S2 und S3 verhalten sich gleich (bei ungerader Anzahl a ist das Ende egal) – zusammenfassen lernen wir in Level 5 (Vertiefung).' });
  d.table({ title: 'Schritt 5: Testen mit Grenzfällen', size: 20, colW: [1.6, 8.3, 2.2], rows: [
    ['Wort', 'Zustandsfolge', 'soll?'],
    ...Object.entries(SOL.produkt_tests).map(([w, p]) => [w, p, /akzeptiert$/.test(p) ? 'ja' : 'nein']),
  ], notes: 'Alle Ergebnisse stimmen mit der Sprachbeschreibung überein. ε: S0 ist kein Endzustand – richtig, denn ε endet nicht auf b.' });
  d.merke({ title: 'Achtung: zwei typische Fallen', phase: 'Erarbeitung', items: [
    '**Neuanfang:** Bei „enthält“ und „endet auf“ kann ein „falsches“ Zeichen schon der Anfang eines neuen Treffers sein – nicht blind nach S0 springen.',
    '  Test: `ababa` muss für „endet auf aba“ akzeptiert werden.',
    '**Komplement:** Fehlerzustand vorher einzeichnen – er wird beim Tauschen zum Endzustand.',
  ], img: IMG + 'a3_praefix_komplement.png', imgW: 4.8, notes: 'Bild: korrektes Komplement von „beginnt mit ab“ mit explizitem S3 (ehemaliger Fehlerzustand).' });
  d.section({ phase: 'Übung', title: 'Arbeitsblatt Level 3' });
  d.task({ title: 'Auftrag: AB03', steps: [
    '**Basis:** Aufgabe 1 (Bausteine anwenden)',
    '**Standard:** Aufgaben 2–4 (Neuanfang, Komplement, Produkt)',
    '**Profi:** Aufgabe 5 (Retro-Controller)',
    'Im **Baukasten** üben (verwandte Challenges, freier Modus) – Gegenbeispiele nutzen!',
  ], zeit: '45 min', sozialform: 'Einzel → Partner', material: 'AB03, Merkblatt M02', app: '#/baukasten', notes: 'Zwischenstopp nach ca. 20 Minuten: häufigster Fehler in Aufgabe 2 (S3 –b→ S0) mit Gegenbeispiel ababa besprechen.' });
  d.app({ title: 'Automaten-Baukasten', route: '#/baukasten', text: 'Graph oder Tabelle bauen, **Prüfen** drücken. Ist dein Automat falsch, zeigt die App das kürzeste Wort, bei dem er sich irrt. Verwandte Challenges zu den Aufgaben 2–5: `endet-ab`, `komplement-aa`, `gerade-a-endet-b`, `konsole`.', notes: 'Deep-Links für einzelne Challenges: #/baukasten?aufgabe=<id>; Stufen: ?stufe=1|2|3.' });
  d.section({ phase: 'Sicherung', title: 'Abi-Check' });
  d.table({ title: 'Abi-Check: Zustände müssen verschieden sein', size: 20, colW: [3.4, 8.7], rows: [
    ['„Begründen Sie, dass sich der Automat nach x und y in verschiedenen Zuständen befinden muss.“', 'Beispiel Retro-Controller: x = X, y = O'],
    ['1. Fortsetzung z finden', `z = ${SOL.kv_unterscheide}`],
    ['2. Wirkung zeigen', 'XOE ist gültig (A/X da, zwei rote Tasten), OOE nicht (weder A noch X).'],
    ['3. Schluss ziehen', 'Ein DEA im selben Zustand müsste beide Wörter gleich behandeln ⇒ verschiedene Zustände.'],
  ], notes: 'Dieses Antwortmuster kommt im Abitur regelmäßig (2022 eA C b: 30 vs. 03; 2024 eA B c). In der Vertiefung Level 5 (Minimierung) wird daraus das Unterscheiden von Zuständen.' });
  d.merke({ title: 'Merke: DEA entwickeln', items: [
    'Erst **Erinnerungen**, dann Zustände: Jeder Zustand hat eine klare **Bedeutung**.',
    '**Bausteine:** Präfix, Teilwort, Endung, Zählen (genau / mindestens / modulo).',
    '**Zwei Bedingungen:** Zustände = **Paare** von Erinnerungen; UND/ODER ändert nur die Endzustände.',
    '**Komplement:** vollständiger Automat, End- und Nicht-Endzustände tauschen.',
    'Immer **testen**: ε, kurze Wörter, Gegenbeispiele.',
  ] });
  d.end({ items: ['Konstruktionsbausteine kennen und anwenden', 'Zwei Bedingungen mit Paaren von Erinnerungen kombinieren', 'Komplement korrekt bilden', 'Automaten systematisch testen'], hausaufgabe: 'Baukasten-Challenges „a-mod-3“ und „anfang-ende“ (Profis: „binaer-3“) + eigene Challenge für deine Sitznachbarin / deinen Sitznachbarn erfinden (mit Musterlösung).' });
  return d.save(OUT + 'DS03_Folien_Bauplan-gesucht.pptx');
}

(async () => {
  const files = [await ab(), await lk(), await folien()];
  console.log(files.join('\n'));
})();
