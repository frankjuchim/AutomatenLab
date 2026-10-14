const __MAT = require('path').resolve(__dirname, '../..'); // Wurzel: materials/
// DS01 – Level 1 „Ein Automat hört zu“ – Arbeitsblatt, Lehrkraft-Handreichung, Folien
const D = require((__MAT + '/lib/docstyle.js'));
const S = require((__MAT + '/lib/deckstyle.js'));
const IMG = (__MAT + '/build/img/ds01/');
const OUT = (__MAT + '/out/');
const T = 'Ein Automat hört zu';
const SUB = 'Einstieg in deterministische endliche Automaten (DEA)';
const KF = 'Wie kann eine Maschine erkennen, ob eine Eingabe „richtig“ ist – ohne sich alles zu merken?';

// =====================================================================================  Arbeitsblatt
async function ab() {
  const body = [
    D.p('Willkommen im **AutomatenLab**! In den nächsten Wochen lernst du Maschinen kennen, die Eingaben Zeichen für Zeichen lesen und dabei nur das Nötigste im Kopf behalten. Level 1 beginnt mit dem einfachsten Modell: dem **deterministischen endlichen Automaten (DEA)**.'),
    D.info('So liest du einen Zustandsgraphen', [
      ...D.bullets([
        '**Zustände** (Kreise, z. B. S0, S1) – das „Gedächtnis“ des Automaten.',
        'Der **Startzustand** ist mit dem Pfeil „Start“ markiert.',
        '**Endzustände** sind doppelt umrandet. Endet die Verarbeitung dort, wird die Eingabe **akzeptiert**.',
        '**Übergänge** (Pfeile) sind mit Zeichen des **Eingabealphabets Σ** beschriftet. Pro Zeichen wird genau ein Übergang ausgeführt.',
      ]),
    ]),
    D.task({ nr: 1, title: 'Der LOL-Erkenner', niveau: 'Basis', afb: 'I', body: [
      D.p('Ein Chat-Filter soll erkennen, ob in einer Nachricht das Wort „LOL“ vorkommt. Alle Zeichen außer L und O werden dabei durch X ersetzt. Der folgende Automat übernimmt diese Aufgabe.'),
      D.img(IMG + 'lol.png', { widthCm: 11.5, caption: 'Abbildung 1: LOL-Erkenner mit Σ = {L, O, X}' }),
      D.sub('a', '**Stelle** die Verarbeitung der Wörter `XLOLX`, `LOOL`, `LLOL` und `OLOXL` jeweils als Zustandsfolge **dar** (z. B. S0 –X→ S0 –L→ S1 …) und **gib an**, ob das Wort akzeptiert wird.'),
      ...D.lines(4),
      D.sub('b', '**Nenne** zwei Wörter der Länge 5, die akzeptiert werden, und ein Wort der Länge 5, das die Buchstaben L, O, L enthält, aber trotzdem abgelehnt wird.'),
      ...D.lines(2),
      D.sub('c', '**Beschreibe**, was der Automat „weiß“, wenn er sich im Zustand S2 befindet.'),
      ...D.lines(2),
    ] }),
    D.task({ nr: 2, title: 'Der Kaffeeautomat', niveau: 'Standard', afb: 'I–II', body: [
      D.p('Ein Kaffee kostet 40 ct. Der Automat nimmt nur 10-ct- und 20-ct-Münzen an, der Betrag muss **passend** eingeworfen werden. Wer zu viel einwirft, bekommt alle Münzen zurück. Das Eingabealphabet ist Σ = {10, 20}.'),
      D.img(IMG + 'kaffee.png', { widthCm: 11, caption: 'Abbildung 2: Kaffeeautomat. Alle nicht eingezeichneten Übergänge führen in einen Fehlerzustand.' }),
      D.sub('a', '**Bestimme** alle Münzfolgen, die vom Automaten akzeptiert werden.'),
      ...D.lines(2),
      D.sub('b', '**Begründe** anhand des Zustandsgraphen, dass die Eingabe 20, 20, 10 abgelehnt wird.'),
      ...D.lines(2),
      D.sub('c', 'Eine Kundin wirft 10, 10, 10 ein und geht dann weg. **Gib an**, in welchem Zustand sich der Automat befindet, und **erläutere** die Bedeutung dieses Zustands im Sachzusammenhang.'),
      ...D.lines(2),
      D.sub('d', '**Zeichne** den Automaten **vollständig**, also mit Fehlerzustand und allen Übergängen.'),
      ...D.drawBox(4.6),
    ] }),
    D.task({ nr: 3, title: 'Das Zahlenschloss', niveau: 'Standard', afb: 'II', body: [
      D.p('Ein Tresor öffnet sich, sobald die zuletzt eingegebenen Ziffern **4 2 0 0** lauten – egal, was vorher getippt wurde. Die Ziffern 4, 2 und 0 bilden eigene Zeichen, alle anderen Ziffern werden durch x dargestellt: Σ = {4, 2, 0, x}. Im Zustandsgraphen fehlen einige Beschriftungen (?).'),
      D.img(IMG + 'schloss_luecke.png', { widthCm: 14, caption: 'Abbildung 3: Zahlenschloss (unvollständig beschriftet)' }),
      D.sub('a', '**Ergänze** die fehlenden Beschriftungen direkt in Abbildung 3.'),
      D.sub('b', '**Stelle** die Verarbeitung der Eingaben `24200` und `42000` **dar**.'),
      ...D.lines(2),
      D.sub('c', 'Aus S3 führt die Eingabe 4 nach S1 und nicht nach S0. **Erläutere**, warum das nötig ist.'),
      ...D.lines(2),
    ] }),
    D.task({ nr: 4, title: 'Preiserhöhung', niveau: 'Profi', afb: 'III', body: [
      D.sub('a', 'Der Kaffee kostet jetzt 50 ct (weiterhin nur 10- und 20-ct-Münzen, passend). **Entwickle** den Zustandsgraphen des neuen Automaten (Fehlerzustand darf weggelassen werden).'),
      ...D.drawBox(3.6),
      D.sub('b', '**Bestimme**, wie viele Zustände (ohne Fehlerzustand) ein solcher Automat bei einem Preis von p ct benötigt (p ist ein Vielfaches von 10).'),
      D.sub('c', '**Beurteile**: Kann es einen endlichen Automaten geben, der für *jeden beliebigen* Preis funktioniert? Halte deine Vermutung fest – in Level 7 kommen wir darauf zurück.'),
      ...D.lines(3),
    ] }),
    D.qr({ route: '#/arena?stufe=1', title: 'Akzeptor-Arena', text: 'Graph ansehen, Wort lesen, entscheiden: akzeptiert oder abgelehnt? 60 Sekunden, Stufe 1. Bei Fehlern zeigt dir „Zeig mir warum“ den Lauf Schritt für Schritt.' }),
    D.h3('Selbstcheck – Level 1 geschafft, wenn …'),
    ...D.checklist([
      'ich die Bestandteile eines DEA (Σ, Zustände, Start-, Endzustände, Übergänge) im Graphen benennen kann.',
      'ich die Verarbeitung eines Wortes als Zustandsfolge darstellen und über Akzeptanz entscheiden kann.',
      'ich erklären kann, was ein Zustand im Sachzusammenhang „bedeutet“.',
      'ich weiß, was ein Fehlerzustand ist und wann man ihn weglassen darf.',
    ]),
  ];
  return D.save(D.doc({ kind: 'AB', ds: 1, title: T, subtitle: SUB, kernfrage: KF, body }), OUT + 'DS01_AB_Ein-Automat-hoert-zu.docx');
}

// =====================================================================================  Lehrkraft
async function lk() {
  const card = (q, rules) => [D.p(`**Du bist ${q}**${q === 'S0' ? '  (Startzustand)' : ''}${q === 'S3' ? '  (Endzustand)' : ''}`, { size: 24, color: D.C.teal }), ...rules.map((r) => D.p(r, { size: 21, after: 40 }))];
  const body = [
    D.h2('Überblick'),
    D.table([
      ['Aspekt', 'Inhalt'],
      ['Lernziele', 'Die SuS beschreiben Aufbau und Funktionsweise eines DEA (Eingabealphabet, Zustände, Start-/Endzustände, Übergänge), stellen Verarbeitungen als Zustandsfolge dar, entscheiden über Akzeptanz und erläutern die Bedeutung von Zuständen im Sachzusammenhang.'],
      ['KC-Bezug', 'Automatenmodelle: Aufbau und Funktionsweise DEA beschreiben; Funktion eines gegebenen Automaten analysieren. PK1.1, PK3.1, IK3.1'],
      ['Abi-Bezug', 'Operatoren „darstellen“ (Verarbeitung), „ergänzen“ (Beschriftungen, vgl. Abi 2024 eA B a), „erläutern“ (Bedeutung eines Zustands, vgl. Abi 2025 eA B b). Notation nach Ergänzenden Hinweisen 2025.'],
      ['Material', 'Folien DS01, AB01, Merkblatt M01, Rollenspiel-Karten (Kopiervorlage unten), AutomatenLab „Akzeptor-Arena“ (#/arena?stufe=1)'],
      ['Vorbereitung', '4 Regelkarten + 6–8 Wortkarten kopieren und schneiden; 4 Schilder S0–S3; Tafelbild Zustandsgraph vorbereiten; App-Link/QR-Code prüfen.'],
    ], { widthsCm: [3.2, 14.2], firstColBold: true, firstColFill: true }),
    D.h2('Verlaufsplan (90 Minuten)'),
    D.table([
      ['Zeit', 'Phase', 'Unterrichtsgeschehen', 'Sozialform / Medien'],
      ['0–10', 'Einstieg', 'Rätsel „Das Zahlenschloss“ (Folien 3–4): Der Tresor öffnet nur, wenn die letzten Ziffern 4-2-0-0 sind. Wie „weiß“ er das, ohne alle Ziffern zu speichern? SuS sammeln Ideen. Ziel: „Er merkt sich nur, wie viel vom Code schon passt.“', 'UG, Folien'],
      ['10–25', 'Einstieg', 'Rollenspiel „Menschlicher Automat“: 4 SuS als S0–S3 mit Regelkarten (LOL-Erkenner). Eine Wortkarte wird Zeichen für Zeichen „weitergereicht“. Die Klasse protokolliert die Zustandsfolge an der Tafel. Mindestens 4 Wortkarten.', 'Rollenspiel, Tafel'],
      ['25–45', 'Erarbeitung', 'Vom Rollenspiel zum Zustandsgraphen (Folien 7–13): Fachbegriffe, Zustandsfolge, Akzeptanz. Zweites Modell: Kaffeeautomat (40 ct). Vollständigkeit und Fehlerzustand (Abi-Konvention).', 'LV/UG, Folien, M01'],
      ['45–80', 'Übung', 'AB01 in Einzel-/Partnerarbeit, Aufgaben nach Niveau (Basis → Standard → Profi). Schnelle SuS: Akzeptor-Arena (Stufe 1, dann 2). Lehrkraft unterstützt; Zwischensicherung Aufgabe 2c im Plenum (Bedeutung eines Zustands).', 'EA/PA, AB01, iPads'],
      ['80–90', 'Sicherung', 'Merkblatt M01 (Teil „Aufbau & Darstellung“) gemeinsam lesen, Exit-Frage: „Was ist der Unterschied zwischen einem Zustand und einem Übergang?“ Hausaufgabe erteilen.', 'UG, M01'],
    ], { widthsCm: [1.6, 2.4, 10.2, 3.2], size: 19 }),
    D.h2('Rollenspiel „Menschlicher Automat“'),
    D.p('Vier SuS stehen nebeneinander vor der Klasse und halten Schilder S0, S1, S2, S3. S3 bekommt zusätzlich einen „Doppelkreis“ (z. B. ein Hut, ein Stern am Schild). Jede Person erhält ihre Regelkarte. Die Lehrkraft gibt der Person **S0** eine Wortkarte. Wer die Karte hält, liest das **nächste noch nicht gelesene Zeichen** laut vor (Zeichen mit Büroklammer abdecken oder abhaken) und gibt die Karte gemäß Regelkarte weiter. Nach dem letzten Zeichen ruft die Person, die die Karte hält: „Ich bin (k)ein Endzustand – Wort akzeptiert/abgelehnt!“'),
    ...D.bullets([
      'Die Klasse protokolliert die Zustandsfolge an der Tafel – das ist bereits die Abi-Darstellung „Verarbeitung darstellen“.',
      'Nachfragen: „Was weiß S2 über das bisher Gelesene?“ → „Die letzten Zeichen waren L, O.“ So wird die Bedeutung von Zuständen vorbereitet.',
      'Variante für Fortgeschrittene: Ein SuS-Paar erfindet einen eigenen „menschlichen Automaten“ (z. B. „gerade Anzahl O“) für die nächste Stunde.',
    ]),
    D.h3('Kopiervorlage: Regelkarten (Σ = {L, O, X})'),
    D.table([
      [card('S0', ['L → gib an **S1** weiter', 'O → behalte die Karte (S0)', 'X → behalte die Karte (S0)']), card('S1', ['L → behalte die Karte (S1)', 'O → gib an **S2** weiter', 'X → gib an **S0** weiter'])],
      [card('S2', ['L → gib an **S3** weiter', 'O → gib an **S0** weiter', 'X → gib an **S0** weiter']), card('S3', ['L, O, X → behalte die Karte (S3)', 'Du bist der Endzustand: Wenn du am Ende die Karte hältst, ist das Wort **akzeptiert**.'])],
    ], { widthsCm: [8.7, 8.7], header: false, rowHeightCm: 3.2 }),
    D.h3('Kopiervorlage: Wortkarten'),
    D.table([['XLOLX', 'LOOL', 'LLOL', 'OLOXL'], ['LOLOL', 'OOLXL', 'LXOL', 'LOL']], { header: false, allCenter: true, size: 32, rowHeightCm: 1.6 }),
    D.p('Erwartung: akzeptiert werden XLOLX, LLOL, LOLOL, LOL; abgelehnt werden LOOL, OLOXL, OOLXL, LXOL.', { size: 19, color: D.C.muted }),
    D.h2('Lösungen AB01'),
    D.h3('Aufgabe 1 – LOL-Erkenner'),
    D.table([
      ['Wort', 'Zustandsfolge', 'Ergebnis'],
      ['XLOLX', 'S0 –X→ S0 –L→ S1 –O→ S2 –L→ S3 –X→ S3', 'akzeptiert'],
      ['LOOL', 'S0 –L→ S1 –O→ S2 –O→ S0 –L→ S1', 'abgelehnt'],
      ['LLOL', 'S0 –L→ S1 –L→ S1 –O→ S2 –L→ S3', 'akzeptiert'],
      ['OLOXL', 'S0 –O→ S0 –L→ S1 –O→ S2 –X→ S0 –L→ S1', 'abgelehnt'],
    ], { widthsCm: [2.4, 11.6, 3.4], size: 19 }),
    ...D.bullets([
      'b) z. B. akzeptiert: `LOLXX`, `OOLOL`, `LOLOL`; abgelehnt trotz L, O, L: `LOXLX`, `LXOLO`, `OLLOX`.',
      'c) In S2 hat der Automat als letzte Zeichen „L, O“ gelesen (und „LOL“ noch nicht gefunden). Ein weiteres L würde „LOL“ vollenden.',
    ]),
    D.h3('Aufgabe 2 – Kaffeeautomat'),
    ...D.bullets([
      'a) Akzeptiert werden genau die fünf Folgen 10-10-10-10, 10-10-20, 10-20-10, 20-10-10, 20-20 (Summe exakt 40 ct).',
      'b) S0 –20→ S2 –20→ S4; aus S4 gibt es keinen Übergang mit 10, die Eingabe führt in den Fehlerzustand und endet dort ⇒ abgelehnt (Überzahlung).',
      'c) S3: „Es wurden bisher 30 ct eingeworfen.“ S3 ist kein Endzustand, daher kein Kaffee; im Sachzusammenhang wartet der Automat auf genau 10 ct.',
      'd) Vollständiger Automat:',
    ]),
    D.img(IMG + 'kaffee_komplett.png', { widthCm: 12 }),
    D.h3('Aufgabe 3 – Zahlenschloss'),
    D.img(IMG + 'schloss.png', { widthCm: 13.5, caption: 'Vollständig beschrifteter Automat (Lösung zu 3a)' }),
    ...D.bullets([
      'a) S1 → S1: 4;  S2 → S3: 0;  S3 → S0: 2, x;  S4 → S1: 4.',
      'b) `24200`: S0 –2→ S0 –4→ S1 –2→ S2 –0→ S3 –0→ S4 ⇒ akzeptiert.  `42000`: S0 –4→ S1 –2→ S2 –0→ S3 –0→ S4 –0→ S0 ⇒ abgelehnt.',
      'c) Eine 4 kann der **Beginn eines neuen Codes** sein. In S3 wurde „420“ gelesen; nach einer 4 sind die letzten Zeichen „…4“ – also passt der Anfang „4“ des Codes bereits. Ginge der Automat nach S0, würde er z. B. `4204200` (…420 gefolgt von 4200) fälschlich ablehnen.',
    ]),
    D.h3('Aufgabe 4 – Preiserhöhung'),
    D.img(IMG + 'kaffee50.png', { widthCm: 12 }),
    ...D.bullets([
      'b) Zustände für 0, 10, …, p ct: p/10 + 1 Zustände (ohne Fehlerzustand). Bei 50 ct also 6.',
      'c) Für **jeden festen** Preis gibt es einen endlichen Automaten. Ein einziger Automat, der für **beliebig hohe** Preise funktioniert, müsste beliebig viele Beträge unterscheiden – das geht mit endlich vielen Zuständen nicht. (Vorgriff auf Level 7: Grenzen endlicher Automaten.)',
    ]),
    D.h2('Typische Schwierigkeiten'),
    ...D.warn({ titel: 'Darauf achten', fallen: ['P1', 'P2', 'P3'] }, [
      ...D.bullets([
        '**Zustand vs. Übergang:** SuS beschriften Zustände mit Zeichen. Klarstellen: Zeichen stehen an Pfeilen, Zustände sind „Gedächtnis“.',
        '**Akzeptanz zu früh:** „Der Automat war doch in S3!“ – entscheidend ist der Zustand **nach dem letzten Zeichen**.',
        '**Rücksprung nach S0:** In Aufgabe 3 springen viele bei 4 nach S0. Wort `4204200` als Gegenbeispiel bereithalten.',
        '**Fehlerzustand:** Im Abitur werden Automaten vollständig angegeben; der Fehlerzustand darf nur mit Hinweis weggelassen werden (Ergänzende Hinweise 2025, Abschnitt 12).',
      ]),
    ]),
    D.h2('Differenzierung'),
    ...D.bullets([
      '**Basis:** Aufgabe 1 und 2a–c; Hilfe: Zustandsfolge zunächst mit dem Finger auf dem Graphen „ablaufen“.',
      '**Standard:** Aufgaben 1–3.',
      '**Profi:** Aufgabe 4 und Akzeptor-Arena Stufe 3.',
      'Für Schnelle: eigenen „menschlichen Automaten“ für die nächste Stunde entwerfen.',
    ]),
    D.h2('Hausaufgabe'),
    D.p('Beschreibe drei Automaten aus deinem Alltag (z. B. Drehkreuz, Ampel, Waschmaschine, Getränkeautomat): Welche Zustände gibt es, welche Eingaben lösen Übergänge aus? Zeichne für einen davon einen Zustandsgraphen.'),
  ];
  return D.save(D.doc({ kind: 'LK', ds: 1, title: T, subtitle: SUB, kernfrage: KF, body }), OUT + 'DS01_Lehrkraft_Ein-Automat-hoert-zu.docx');
}

// =====================================================================================  Folien
async function folien() {
  const d = S.deck({ ds: 1, title: T });
  d.title({ title: T, subtitle: SUB, kernfrage: KF, notes: 'Begrüßung, Einordnung: Neues Halbjahresthema „Maschinen, die Sprache verstehen“. Pflichtweg aus 9 Leveln in 3 Welten, dazu Vertiefungs- und Bonus-Level; App AutomatenLab. Heute: Level 1.' });
  d.cards({ title: 'Deine Reise durch das AutomatenLab', phase: 'Einstieg', cards: [
    { head: 'Welt A', text: 'Endliche Automaten: prüfen, modellieren, minimieren, übersetzen', icon: 'LuCpu' },
    { head: 'Welt B', text: 'Grenzen & Keller: Was endliche Automaten nicht können', icon: 'LuLayers' },
    { head: 'Welt C', text: 'Formale Sprachen: Grammatiken erzeugen Sprachen', icon: 'LuLanguages' },
    { head: 'Bonus-Welt D', text: 'Für Neugierige: Sprachdesign-Studio und die Turingmaschine', icon: 'LuRocket' },
  ], notes: 'Überblick über die Einheit. Am Ende der Welten A–C gibt es ein Boss-Level (Abi-artige Aufgabe) als freiwilliges Extra-Training. Pflichtweg: Level 1, 2, 3, 6, 7, 9, 11, 12, 13; Vertiefung: 5, 10, 14; Bonus: 4, 8, 15, 16.' });
  d.table({ title: 'Dein Weg durch das AutomatenLab', phase: 'Einstieg', rows: [
    ['', 'Pflicht-Level', 'Vertiefung', 'Bonus & Extra'],
    ['Woche 1', '1 Ein Automat hört zu · 2 Was macht dieser Automat? · 3 Bauplan gesucht', '5 Weniger ist mehr', '4 Modellierungswerkstatt'],
    ['Woche 2', '6 Automaten, die antworten · 7 Grenzen · 9 Kellerautomat', '10 Keller-Profis', '8 Raten erlaubt (NEA)'],
    ['Woche 3', '11 Sprache · 12 Grammatik trifft Automat · 13 Kontextfreie Grammatiken', '14 Landkarte der Sprachen', '15 Sprachdesign · 16 Turingmaschine'],
    ['jederzeit', 'Merkblätter, App-Challenges', '', 'Boss-Level A–C, Übungsklausur'],
  ], colW: [1.4, 5.3, 2.5, 2.9], size: 18, notes: 'Pflichtweg: 9 Doppelstunden (3 Wochen). Bei 4 Wochen kommen die drei Vertiefungs-Level als 4. Woche bzw. eingeschoben dazu. Bonus-Level und Boss-Level sind freiwillige Extra-Angebote (in der App als Bonus markiert).' });
  d.section({ phase: 'Einstieg', title: 'Das Zahlenschloss' });
  d.question({ text: 'Ein Tresor öffnet sich, sobald die letzten vier Ziffern 4-2-0-0 lauten. Wie „weiß“ er das?', sub: 'Er hat **keinen** Speicher für die bisher getippten Ziffern – nur eine Handvoll Zustände.', notes: 'Ideen sammeln. Zielaussage: Er merkt sich nur, wie viel vom Code bisher passt: nichts, „4“, „42“, „420“, „4200“. Genau das sind die Zustände.' });
  d.cards({ title: 'Was muss sich das Schloss merken?', phase: 'Einstieg', cards: [
    { head: 'S0', text: 'Noch nichts vom Code passt.' },
    { head: 'S1', text: 'Zuletzt: „4“' },
    { head: 'S2', text: 'Zuletzt: „42“' },
    { head: 'S3', text: 'Zuletzt: „420“' },
    { head: 'S4', text: 'Zuletzt: „4200“ – Tür auf!' },
  ], notes: 'Aufdecken nach der Ideensammlung. Fünf Zustände genügen – egal wie lang die Eingabe ist.' });
  d.task({ title: 'Rollenspiel: Der menschliche Automat', phase: 'Einstieg', steps: [
    'Vier Freiwillige werden zu den Zuständen **S0, S1, S2, S3** und erhalten Regelkarten.',
    'S0 bekommt eine Wortkarte und liest das erste Zeichen vor.',
    'Die Karte wandert nach der Regel weiter – Zeichen für Zeichen.',
    'Wer am Ende die Karte hält, verkündet: **akzeptiert** oder **abgelehnt**.',
    'Alle anderen protokollieren die **Zustandsfolge** an der Tafel.',
  ], zeit: '15 min', sozialform: 'Plenum', material: 'Regel- und Wortkarten', notes: 'Wortkarten: XLOLX, LOOL, LLOL, OLOXL, LOLOL, OOLXL, LXOL, LOL. Nachfrage: Was weiß S2? Was weiß S1?' });
  d.section({ phase: 'Erarbeitung', title: 'Vom Rollenspiel zum Zustandsgraphen' });
  d.image({ title: 'Der LOL-Erkenner als Zustandsgraph', img: IMG + 'lol.png', sigma: 'Eingabealphabet Σ = {L, O, X}   (X steht für alle anderen Zeichen)', caption: 'Akzeptiert werden genau die Wörter, in denen LOL vorkommt.', notes: 'Rollenspiel und Graph vergleichen: Person = Zustand, Regelkarte = ausgehende Pfeile.' });
  d.bullets({ title: 'Die Bausteine eines DEA', items: [
    '**Eingabealphabet Σ**: die Zeichen, die gelesen werden können',
    '**Zustände** S0, S1, …: endlich viele, sie bilden das „Gedächtnis“',
    '**Startzustand**: markiert mit dem Pfeil „Start“',
    '**Endzustände**: Doppelkreis',
    '**Übergänge**: Pfeile, beschriftet mit Zeichen aus Σ',
    '**deterministisch**: Für jeden Zustand und jedes Zeichen gibt es **genau einen** Folgezustand',
  ], img: IMG + 'lol.png', imgW: 5.2, notes: 'Begriffe parallel im Merkblatt M01 markieren lassen.' });
  d.table({ title: 'Verarbeitung darstellen: die Zustandsfolge', rows: [
    ['Wort', 'Zustandsfolge', 'Ergebnis'],
    ['XLOLX', 'S0 –X→ S0 –L→ S1 –O→ S2 –L→ S3 –X→ S3', 'akzeptiert (S3 ist Endzustand)'],
    ['LOOL', 'S0 –L→ S1 –O→ S2 –O→ S0 –L→ S1', 'abgelehnt (S1 ist kein Endzustand)'],
  ], colW: [1.7, 6.6, 3.8], size: 20, notes: '[NUR LEHRKRAFT] Wichtig: Entscheidend ist der Zustand NACH dem letzten Zeichen. Im Abitur: „Stellen Sie die Verarbeitung … dar“.' });
  d.bullets({ title: 'Zweites Modell: der Kaffeeautomat', items: [
    'Ein Kaffee kostet **40 ct**',
    'Akzeptiert werden nur **10-ct- und 20-ct-Münzen**: Σ = {10, 20}',
    'Der Betrag muss **passend** eingeworfen werden – sonst gibt es alle Münzen zurück',
    'Was muss sich der Automat merken?',
  ], notes: 'SuS schlagen Zustände vor: bisher eingeworfener Betrag 0, 10, 20, 30, 40.' });
  d.image({ title: 'Kaffeeautomat: Zustand = bisher eingeworfener Betrag', img: IMG + 'kaffee.png', sigma: 'Σ = {10, 20}', caption: 'Alle nicht eingezeichneten Übergänge führen in einen Fehlerzustand.', notes: 'Bedeutung der Zustände im Sachzusammenhang formulieren lassen: „S3: Es wurden bisher 30 ct eingeworfen.“' });
  d.twoCol({ title: 'Vollständig – oder mit Hinweis', left: { head: 'Mit Hinweis (Abi-Konvention)', items: ['Fehlerzustand weggelassen', 'Pflicht: Hinweis „Alle nicht eingezeichneten Übergänge führen in einen Fehlerzustand.“'], img: IMG + 'kaffee.png' }, right: { head: 'Vollständig', items: ['Jeder Zustand hat für jedes Zeichen einen Übergang', 'Fehlerzustand: kein Endzustand, kommt nie wieder heraus'], img: IMG + 'kaffee_komplett.png' }, notes: 'Ergänzende Hinweise 2025, Abschnitt 12: Endliche Automaten werden vollständig angegeben, wenn nicht anders vermerkt.' });
  d.section({ phase: 'Übung', title: 'Arbeitsblatt Level 1' });
  d.task({ title: 'Auftrag: AB01', steps: [
    'Bearbeite **Aufgabe 1** (Basis) und **Aufgabe 2** (Standard).',
    'Vergleiche deine Zustandsfolgen mit deiner Nachbarin / deinem Nachbarn.',
    'Weiter mit **Aufgabe 3**, Profis mit **Aufgabe 4**.',
    'Fertig? Ab in die **Akzeptor-Arena** (Stufe 1, dann 2).',
  ], zeit: '35 min', sozialform: 'Einzel → Partner', material: 'AB01, Merkblatt M01', app: '#/arena?stufe=1', notes: 'Zwischensicherung zu 2c (Bedeutung eines Zustands) nach ca. 20 Minuten.' });
  d.app({ title: 'Akzeptor-Arena', route: '#/arena?stufe=1', text: 'Graph ansehen, Wort lesen, entscheiden: **akzeptiert** oder **abgelehnt**? Du hast 60 Sekunden. Bei Fehlern zeigt „Zeig mir warum“ den Lauf Schritt für Schritt.', notes: 'Wettbewerb: Wer schafft die längste Serie? Bestwerte an der Tafel notieren.' });
  d.section({ phase: 'Sicherung', title: 'Was wir heute gelernt haben' });
  d.merke({ title: 'Merke: Deterministischer endlicher Automat', items: [
    'Ein DEA liest ein Wort **Zeichen für Zeichen** und wechselt bei jedem Zeichen in **genau einen** Folgezustand.',
    'Ein Wort wird **akzeptiert**, wenn der Automat **nach dem letzten Zeichen** in einem Endzustand ist.',
    'Zustände sind das **Gedächtnis**: Sie speichern nur das, was für die Entscheidung wichtig ist.',
    'Im Abitur: Automat **vollständig** oder Fehlerzustand mit Hinweis weglassen.',
  ], img: IMG + 'lol.png', imgW: 4.6 });
  d.end({ items: ['Zustände, Übergänge, Start- und Endzustände', 'Verarbeitung als Zustandsfolge darstellen', 'Bedeutung eines Zustands im Sachzusammenhang', 'Vollständigkeit und Fehlerzustand'], hausaufgabe: 'Beschreibe drei Automaten aus deinem Alltag (Zustände und Eingaben). Zeichne für einen davon einen Zustandsgraphen.' });
  return d.save(OUT + 'DS01_Folien_Ein-Automat-hoert-zu.pptx');
}

(async () => {
  const files = [await ab(), await lk(), await folien()];
  console.log(files.join('\n'));
})();
