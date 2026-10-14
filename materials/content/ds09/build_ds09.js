const __MAT = require('path').resolve(__dirname, '../..'); // Wurzel: materials/
// DS09 – Level 9 „Der Automat bekommt ein Gedächtnis“ (Kellerautomat I) – AB, Lehrkraft, Folien
const D = require((__MAT + '/lib/docstyle.js'));
const S = require((__MAT + '/lib/deckstyle.js'));
const K = require((__MAT + '/content/ds09/kt.js'));
const J = require((__MAT + '/content/ds09/ds09.json'));
const IMG = (__MAT + '/build/img/ds09/');
const OUT = (__MAT + '/out/');
const T = 'Der Automat bekommt ein Gedächtnis';
const SUB = 'Kellerautomaten I: Stapel, Notation, Verarbeitung dokumentieren';
const KF = 'Wie muss man den endlichen Automaten erweitern, damit er unbeschränkt zählen kann?';
const FN = 'Der-Automat-bekommt-ein-Gedaechtnis';
const HINT = 'Alle nicht eingezeichneten Übergänge führen in einen Fehlerzustand.';

// =====================================================================================  Arbeitsblatt
async function ab() {
  const body = [
    D.p('In Level 7 hast du bewiesen: **Kein** DEA erkennt L = {a^n^b^n^ | n ≥ 1}, weil er sich die Anzahl der a nicht unbegrenzt merken kann. Heute bekommt der Automat einen **Notizstapel ohne Grenze** – den **Kellerspeicher**.'),
    ...D.info('Der Kellerspeicher ist ein Stapel (LIFO)', [
      ...D.bullets([
        '**LIFO** – *last in, first out*: Was zuletzt abgelegt wurde, wird zuerst wieder entnommen (wie ein Tellerstapel).',
        'Operationen wie bei der Datenstruktur Stapel: **push(x)** legt x oben ab, **pop()** entfernt das oberste Zeichen, **top()** liest es, ohne es zu entfernen.',
        'Zu Beginn liegt nur das Vorbelegungszeichen **#** im Keller („Boden“). Die **Belegung** wird als Zeichenkette notiert, das **oberste Zeichen steht links**: `BA#` heißt „B liegt oben, darunter A, dann #“.',
      ]),
    ]),
    D.task({ nr: 1, title: 'Aufwärmen: Stapeln wie ein Kellerautomat', niveau: 'Basis', afb: 'I', body: [
      D.sub('a', 'Der Keller enthält zu Beginn nur #. **Gib** nach jeder Operation die Belegung **an** und – bei pop() und top() – das gelieferte Zeichen.'),
      D.table([
        ['Operation', 'push(A)', 'push(B)', 'pop()', 'push(C)', 'push(C)', 'top()', 'pop()'],
        ['Belegung', 'A#', '', '', '', '', '', ''],
        ['geliefert', '–', '', '', '', '', '', ''],
      ], { widthsCm: [2.6, 2.1, 2.1, 2.1, 2.1, 2.1, 2.1, 2.1], size: 19, center: [1, 2, 3, 4, 5, 6, 7], firstColBold: true, rowHeightCm: 0.8 }),
      D.p('Ein Kellerautomat macht bei **jedem** Übergang beides: Er **entfernt** das oberste Kellerzeichen und **legt** eine Zeichenkette **ab**. Notation an der Kante: **(oberstes Kellerzeichen, Eingabezeichen) : abzulegende Zeichen**. Das **rechte** Zeichen wird zuerst abgelegt – bei `A#` liegt danach also A oben.'),
      D.img(IMG + 'uebergang_stapel.png', { widthCm: 9.5 }),
      D.sub('b', '**Bestimme** die Belegung nach dem Übergang.'),
      D.table([
        ['Übergang', 'Belegung vorher', 'Belegung nachher'],
        ...J.ablage.map((r, i) => [r[0], r[1], i === 0 ? r[2] : '']),
      ], { widthsCm: [5.8, 5.8, 5.8], size: 19, center: [0, 1, 2], rowHeightCm: 0.7 }),
    ] }),
    ...D.info('Kellerautomat – so liest du den Zustandsgraphen', [
      ...D.bullets([
        'Eingabealphabet **Σ**, Kelleralphabet **Γ** (Zeichen, die im Keller liegen dürfen, inkl. #), Zustände S0, S1, …, Startzustand, Endzustände.',
        'Kante **(A, b) : ε**: Liegt A oben und wird b gelesen, wird A entfernt und nichts abgelegt. **(#, ε) : #**: Ohne ein Eingabezeichen zu lesen, wird # entfernt und wieder abgelegt – der Keller bleibt unverändert (ε-Übergang).',
        '**Akzeptanz:** Eine Eingabe wird genau dann akzeptiert, wenn es eine Möglichkeit gibt, dass sich der Automat nach **vollständiger** Verarbeitung der Eingabe in einem **Endzustand** befindet. (Der Keller muss dafür **nicht** leer sein!)',
      ]),
    ]),
    D.task({ nr: 2, title: 'Der aⁿbⁿ-Kellerautomat', niveau: 'Basis', afb: 'I–II', body: [
      D.p('Σ = {a, b}, Γ = {#, A}.', { keepNext: true }),
      D.img(IMG + 'anbn.png', { widthCm: 13, caption: `Abbildung 1: Kellerautomat für L = {aⁿbⁿ | n ≥ 1}. ${HINT}` }),
      D.sub('a', '**Dokumentiere** die Verarbeitung der Eingabe `aabb` in der Tabelle.'),
      ...K.blank(7),
      D.sub('b', '**Dokumentiere** ebenso die Verarbeitung der Eingabe `aab`.'),
      ...K.blank(5),
      D.sub('c', '**Erläutere** die Bedeutung des Kellerspeichers und die Funktion des Übergangs von S1 nach S2.'),
      ...D.lines(3),
    ] }),
    D.qr({ route: '#/keller?automat=anbn&modus=tabelle&wort=aabb', title: 'Keller-Labor', text: 'Tabellen-Trainer im Abi-Format: Fülle Zeile für Zeile aus und erhalte sofort Rückmeldung. Im Modus „Simulator“ siehst du den Stapel wachsen und schrumpfen.' }),
    D.task({ nr: 3, title: 'Klammer-Check', niveau: 'Standard', afb: 'II', body: [
      D.p('Wie im Einstieg mit dem Kartenstapel: Jede öffnende Klammer kommt auf den Stapel, jede schließende muss eine offene Klammer entfernen. Σ = {(, )}, Γ = {#, K}.', { keepNext: true }),
      D.img(IMG + 'klammern.png', { widthCm: 7.5, caption: `Abbildung 2: Kellerautomat für korrekte Klammerausdrücke. ${HINT}` }),
      D.sub('a', '**Dokumentiere** die Verarbeitung von `(())` in Form einer Tabelle (im Heft).'),
      D.sub('b', 'Die Eingaben `()(` und `())` werden abgelehnt – aus **unterschiedlichen** Gründen. **Erläutere** beide Gründe.'),
      ...D.lines(3),
      D.sub('c', '**Begründe**, warum S0 zugleich Start- und Endzustand ist.'),
      ...D.lines(2),
      D.sub('d', '(Profi) **Erweitere** den Automaten so, dass auch eckige Klammern [ ] korrekt geprüft werden: `([()])` korrekt, `([)]` nicht. **Gib** Γ **an**.'),
      ...D.drawBox(3.6),
    ] }),
    D.pageBreak(),
    D.task({ nr: 4, title: 'Doppelt so viele b', niveau: 'Standard', afb: 'II–III', body: [
      D.sub('a', '**Entwickle** einen Kellerautomaten für L = {a^n^b^2n^ | n ≥ 1} (z. B. `abb`, `aabbbb`). **Gib** Σ und Γ **an**.'),
      ...D.drawBox(3.8),
      D.sub('b', '**Dokumentiere** die Verarbeitung von `abb` durch deinen Automaten (im Heft) und **teste** ihn im Keller-Labor (Automat „a^n^b^2n^“).'),
    ] }),
    D.task({ nr: 5, title: 'Gleich viele a und b', niveau: 'Profi', afb: 'III', body: [
      D.p('Jetzt dürfen a und b in **beliebiger Reihenfolge** vorkommen, z. B. `abba`, `bbaa`, `ε` – aber gleich oft.'),
      D.sub('a', '**Entwickle** einen Kellerautomaten für diese Sprache. Tipp: Was soll im Keller liegen, wenn bisher mehr b als a gelesen wurden?'),
      ...D.drawBox(3.8),
      D.sub('b', '**Erläutere** die Bedeutung des Kellerinhalts nach dem Lesen von `bba`.'),
      ...D.lines(2),
    ] }),
    D.h3('Selbstcheck – Level 9 geschafft, wenn …'),
    ...D.checklist([
      'ich push, pop und top am Kellerspeicher erklären kann (LIFO).',
      'ich Kantenbeschriftungen (Kellerzeichen, Eingabe) : Ablage lesen und die neue Belegung bestimmen kann (rechtes Zeichen zuerst abgelegt).',
      'ich eine Verarbeitung in der Abi-Tabelle dokumentieren und über Akzeptanz entscheiden kann.',
      'ich die Bedeutung des Kellerspeichers im Sachzusammenhang erläutern kann.',
      'ich einfache Kellerautomaten (a^n^b^n^, Klammern, a^n^b^2n^) selbst entwickeln kann.',
    ]),
  ];
  return D.save(D.doc({ kind: 'AB', ds: 9, title: T, subtitle: SUB, kernfrage: KF, body }), OUT + `DS09_AB_${FN}.docx`);
}

// =====================================================================================  Lehrkraft
async function lk() {
  const card = (c) => D.p(c, { size: 120, bold: true, align: 'center', color: D.C.tealDark, after: 0 });
  const body = [
    D.h2('Überblick'),
    D.table([
      ['Aspekt', 'Inhalt'],
      ['Lernziele', 'Die SuS beschreiben den Kellerautomaten als Erweiterung des endlichen Automaten (Kellerspeicher als Stapel, LIFO, push/pop/top), lesen und verwenden die Notation (Kellerzeichen, Eingabe) : Ablage mit Γ und #, dokumentieren Verarbeitungen im Abi-Tabellenformat, entscheiden über Akzeptanz (Endzustand nach vollständiger Eingabe) und entwickeln Kellerautomaten für a^n^b^n^, Klammerausdrücke, a^n^b^2n^ und „gleich viele a und b“.'],
      ['KC-Bezug', 'K6 (eA): Kellerautomat als Erweiterung beschreiben; K3/K4 für Kellerautomaten. Bezug zur Datenstruktur Stapel (Q-Phase Datenstrukturen). PK1.5, PK3.1, IK3.2'],
      ['Abi-Bezug', 'Operatoren „dokumentieren“ (Tabelle), „erläutern“ (Bedeutung des Kellerspeichers), „entwickeln“. Vertiefung mit Originalen: Abi 2025 eA Aufgabe B, Teile g und h (Kriterium Y, Dokumentation 32-12211); Abi 2024 eA Aufgabe B, Teile f und g (Kellerautomat O/X/E); Abi 2023 eA Aufgabe D, Teil b; Abi 2022 eA Aufgabe C, Teil c; Abi 2021 Nachschreibtermin eA Aufgabe E, Teil b (Tabellen 3 und 4).'],
      ['Material', 'Folien DS09, AB09, Merkblatt M07, Klammerkarten (Kopiervorlage unten, je Gruppe 2× „(“, 2× „)“, 2× „[“, 2× „]“), AutomatenLab „Keller-Labor“ (#/keller?automat=anbn&modus=tabelle&wort=aabb; modus=sim)'],
      ['Vorbereitung', 'Klammerkarten kopieren/schneiden; Wortstreifen „( [ ( ) ] )“ und „( [ ) ]“ an die Tafel; App-Tabellentrainer testen.'],
    ], { widthsCm: [3.2, 14.2], firstColBold: true, firstColFill: true }),
    ...D.warn('Achtung: ältere Materialien', [D.p('Ältere Materialien und Schulbücher definieren teils „akzeptiert, wenn der Keller leer ist bzw. nur noch # enthält“. **Verbindlich (Ergänzende Hinweise 2025):** akzeptiert, wenn es eine Möglichkeit gibt, dass sich der Automat nach vollständiger Verarbeitung der Eingabe in einem **Endzustand** befindet – der Kellerinhalt spielt keine Rolle. Außerdem: in der Klammer **zuerst das Kellerzeichen, dann das Eingabezeichen**.', { size: 20 })]),
    D.h2('Verlaufsplan (90 Minuten)'),
    D.table([
      ['Zeit', 'Phase', 'Unterrichtsgeschehen', 'Sozialform / Medien'],
      ['0–15', 'Einstieg', 'Unplugged „Klammer-Check mit Kartenstapel“: Paare erhalten Klammerkarten. Die Lehrkraft liest „( [ ( ) ] )“ Zeichen für Zeichen vor: Öffnende Klammer → Karte auf den Stapel; schließende Klammer → oberste Karte muss passen, dann weg. Am Ende muss der Stapel leer sein. Dann „( [ ) ]“ (scheitert beim „)“). Frage: „Warum reicht hier kein DEA?“ (Rückbezug Level 7: unbeschränkte Tiefe).', 'PA, Klammerkarten'],
      ['15–30', 'Erarbeitung I', 'Stapel als Datenstruktur: LIFO, push/pop/top, Notation der Belegung (oberstes Zeichen links, # unten). AB09 Aufgabe 1a. Übergangsnotation (Kellerzeichen, Eingabe) : Ablage, Ablageregel (rechtes Zeichen zuerst), Aufgabe 1b.', 'LV/UG, Folien 5–9, AB09'],
      ['30–50', 'Erarbeitung II', 'Kellerautomat für a^n^b^n^ Schritt für Schritt (Folien 10–13): Idee „ein A je a, ein A weg je b“, Zustandsgraph, Γ, Akzeptanz über Endzustand, ε-Übergang am Ende. Gemeinsam: Tabelle für aabb im Abi-Format (Aufgabe 2a).', 'UG, Tafel, Folien'],
      ['50–80', 'Übung', 'AB09 Aufgaben 2b–5 nach Niveau; Tabellen-Trainer im Keller-Labor zur Selbstkontrolle; eigene Automaten im Simulator testen.', 'EA/PA, AB09, App'],
      ['80–90', 'Sicherung', 'Merkblatt M07; Exit-Frage: „Was steht nach dem Übergang (A, a) : BA oben im Keller?“ (B). Hausaufgabe.', 'UG, M07'],
    ], { widthsCm: [1.6, 2.4, 10.2, 3.2], size: 19 }),
    D.h2('Kopiervorlage: Klammerkarten'),
    D.table([[card('('), card(')'), card('['), card(']')], [card('('), card(')'), card('['), card(']')]], { header: false, rowHeightCm: 3.4, widthsCm: [4.35, 4.35, 4.35, 4.35] }),
    D.p('Erweiterung für schnelle Paare: „( ( [ ] ) [ ] )“ (korrekt), „( ( ]“ (falsch), „[ ] )“ (falsch: Stapel leer beim „)“).', { size: 19, color: D.C.muted }),
    D.h2('Lösungen AB09'),
    D.h3('Aufgabe 1 – Aufwärmen'),
    D.table([['Operation', ...J.stapel.map((r) => r[0])], ['Belegung', ...J.stapel.map((r) => r[1])], ['geliefert', ...J.stapel.map((r) => r[2])]], { widthsCm: [2.6, 2.1, 2.1, 2.1, 2.1, 2.1, 2.1, 2.1], size: 19, center: [1, 2, 3, 4, 5, 6, 7], firstColBold: true }),
    D.table([['Übergang', 'Belegung vorher', 'Belegung nachher'], ...J.ablage], { widthsCm: [5.8, 5.8, 5.8], size: 19, center: [0, 1, 2] }),
    D.h3('Aufgabe 2 – aⁿbⁿ'),
    D.p('a) `aabb`:', { size: 20, keepNext: true }),
    ...K.solved(J.anbn.aabb),
    D.p('b) `aab`:', { size: 20, keepNext: true }),
    ...K.solved(J.anbn.aab),
    D.p('Nach dem Lesen des letzten b liegt noch A oben; der ε-Übergang nach S2 verlangt # oben. S1 ist kein Endzustand ⇒ abgelehnt.', { size: 20 }),
    ...D.bullets([
      'c) Für jedes gelesene a liegt ein A im Keller; die Anzahl der A ist die Anzahl der a, die noch nicht durch ein b „ausgeglichen“ wurden. Jedes b entfernt ein A. Der Übergang (#, ε) : # von S1 nach S2 prüft, ob alle A entfernt wurden (# liegt oben) – nur dann wird der Endzustand erreicht, ohne ein Zeichen zu lesen und ohne den Keller zu verändern.',
    ]),
    D.h3('Aufgabe 3 – Klammer-Check'),
    D.p('a) `(())`:', { size: 20, keepNext: true }),
    ...K.solved(J.kl['(())']),
    ...D.bullets([
      `b) \`()(\`: Die Eingabe wird vollständig gelesen, danach liegt aber K oben (eine Klammer ist offen); der Automat bleibt in S1, kein Endzustand. – \`())\`: Nach \`()\` ist der Automat über (#, ε) : # wieder in S0; für „)“ mit # oben gibt es keinen Übergang (Fehlerzustand) – die Eingabe kann nicht vollständig verarbeitet werden.`,
      'c) Das leere Wort ε ist ein korrekter Klammerausdruck und muss akzeptiert werden; außerdem dürfen mehrere korrekte Ausdrücke hintereinanderstehen (()()): Nach jedem abgeschlossenen Teil kehrt der Automat nach S0 zurück.',
      'd) Γ = {#, R, E} (R = offene runde, E = offene eckige Klammer). Eine schließende Klammer darf nur das **passende** Zeichen entfernen:',
    ]),
    D.img(IMG + 'klammern_gemischt.png', { widthCm: 8.5, caption: `Lösung 3d (mit check() gegen die Definition bis Länge 8 geprüft). ${HINT}` }),
    ...K.solved(J.klg['([()])']),
    D.h3('Aufgabe 4 – aⁿb²ⁿ'),
    D.img(IMG + 'anb2n.png', { widthCm: 11, caption: 'Lösung A: Je a werden zwei A abgelegt, je b ein A entfernt. Σ = {a, b}, Γ = {#, A}.' }),
    D.p('b) Verarbeitung von `abb` durch Lösung A:', { size: 19, keepNext: true }),
    ...K.solved(J.anb2n.abb),
    D.img(IMG + 'anb2n_alt.png', { widthCm: 12, caption: 'Lösung B (ebenfalls korrekt): Ein A je a; nur jedes zweite b entfernt ein A (S1: „erstes b eines Paares gelesen“).' }),
    D.h3('Aufgabe 5 – Gleich viele a und b'),
    D.img(IMG + 'gleich_ab.png', { widthCm: 8.5, caption: `Σ = {a, b}, Γ = {#, A, B}. ${HINT}` }),
    D.p('a) Zur Kontrolle: Verarbeitung von `abba` (über S0 zurück, sobald der Keller wieder ausgeglichen ist):', { size: 19, keepNext: true }),
    ...K.solved(J.gab.abba),
    ...D.bullets(['b) Nach `bba` liegt `B#` im Keller: Es wurde **ein b mehr** als a gelesen. Allgemein enthält der Keller nur A (Überschuss an a) oder nur B (Überschuss an b); die Anzahl ist die Differenz.']),
    D.h2('Typische Schwierigkeiten'),
    ...D.warn('Darauf achten', [
      ...D.bullets([
        '**Ablagereihenfolge:** Bei (A, a) : BA liegt danach **B** oben. SuS legen oft „von links nach rechts“ ab.',
        '**Gelesenes Kellerzeichen wird entfernt:** (A, a) : A bedeutet „A bleibt liegen“, nicht „A dazulegen“.',
        '**Akzeptanz:** Nicht „Keller leer“, sondern **Endzustand nach vollständiger Eingabe** (ältere Materialien weichen hier ab!). Der Kellerinhalt ist egal.',
        '**Tabelle:** Spalte „oberstes Kellersymbol“ = das Zeichen, das **vor** dem Übergang oben lag; ε-Übergänge bekommen eine eigene Zeile mit Eingabezeichen ε.',
        '**# vergessen:** Das Vorbelegungszeichen wird in (#, a) : A# wieder abgelegt – sonst ist der Keller leer und es gibt keinen Übergang mehr.',
      ]),
    ]),
    ...D.tip('Hinweis zum Abi-Tabellenformat', [D.p('Im Original-Material (z. B. Abi 2021 Nachschreibtermin E, Abi 2025 Nachschreibtermin B) stehen die Spalten „oberstes Kellersymbol“ und „verarbeitetes Eingabezeichen“ teils versetzt **zwischen** zwei Zeilen (sie gehören zum Übergang zwischen zwei Konfigurationen). Inhaltlich ist das identisch mit unserem Format (eine Zeile pro Schritt, erste Zeile S0 | # | – | –) – kurz vor dem Abi einmal am Original zeigen.', { size: 20 })]),
    D.h2('Differenzierung'),
    ...D.bullets([
      '**Basis:** Aufgaben 1–2, Tabellen-Trainer im Keller-Labor (anbn, klammern).',
      '**Standard:** Aufgaben 1–4.',
      '**Profi:** Aufgaben 3d und 5; Zusatz: Kellerautomat für {a^n^b^m^ | m ≥ n ≥ 1}.',
    ]),
    D.h2('Hausaufgabe'),
    D.p('Dokumentiere die Verarbeitung von `aaabbb` und `abb` durch den Automaten aus Abbildung 1 (Abi-Tabelle) und bearbeite im Keller-Labor den Tabellen-Trainer zu „gleich viele a und b“ (abba, bbaa, aab).'),
    D.p('Lösung (zur Kontrolle):', { size: 19, color: D.C.muted, keepNext: true }),
    D.p('`aaabbb`:', { size: 19, keepNext: true }),
    ...K.solved(J.anbn.aaabbb),
    D.p('`abb`:', { size: 19, keepNext: true }),
    ...K.solved(J.anbn.abb, { grund: true }),
  ];
  return D.save(D.doc({ kind: 'LK', ds: 9, title: T, subtitle: SUB, kernfrage: KF, body }), OUT + `DS09_Lehrkraft_${FN}.docx`);
}

// =====================================================================================  Folien
async function folien() {
  const d = S.deck({ ds: 9, title: T });
  const rows = (t) => [K.HEAD, ...t.rows];
  d.title({ title: T, subtitle: SUB, kernfrage: KF, notes: 'Rückbezug Level 7: aⁿbⁿ und Klammern beliebiger Tiefe kann kein DEA. Heute: Wir geben dem Automaten einen unbegrenzten Speicher.' });
  d.section({ phase: 'Einstieg', title: 'Klammer-Check mit Kartenstapel' });
  d.task({ title: 'Klammer-Check: ( [ ( ) ] )', phase: 'Einstieg', steps: [
    'Öffnende Klammer gelesen: Karte **oben auf den Stapel**.',
    'Schließende Klammer gelesen: Die **oberste** Karte muss die passende öffnende sein – dann weg damit.',
    'Passt sie nicht oder ist der Stapel leer: **Fehler!**',
    'Am Ende muss der Stapel **leer** sein.',
    'Danach: ( [ ) ]  und  [ ] )',
  ], zeit: '10 min', sozialform: 'Partnerarbeit', material: 'Klammerkarten', notes: 'Lehrkraft liest Zeichen für Zeichen vor. Bei ( [ ) ] scheitert es beim „)“, weil „[“ oben liegt. Frage: Warum reicht kein DEA? → beliebige Tiefe (Level 7).' });
  d.question({ text: 'Warum funktioniert der Kartenstapel – und der DEA nicht?', sub: 'Der Stapel kann **beliebig hoch** werden und wir sehen immer nur die **oberste** Karte.', notes: 'Kernaussagen: unbegrenzter Speicher, aber eingeschränkter Zugriff (nur oben). Genau das ist ein Kellerspeicher.' });
  d.section({ phase: 'Erarbeitung', title: 'Der Kellerspeicher' });
  d.cards({ title: 'Stapel: last in, first out', phase: 'Erarbeitung', cards: [
    { head: 'push(x)', text: 'x wird oben abgelegt.', icon: 'LuArrowDownToLine' },
    { head: 'pop()', text: 'Das oberste Zeichen wird entfernt.', icon: 'LuArrowUpFromLine' },
    { head: 'top()', text: 'Das oberste Zeichen wird gelesen (bleibt liegen).', icon: 'LuEye' },
    { head: 'Notation', text: 'Belegung als Zeichenkette, **oben = links**: BA# heißt B liegt oben, # ganz unten.', icon: 'LuLayers' },
  ], notes: 'Bezug zur Datenstruktur Stapel aus dem Q-Phasen-Unterricht. # = Vorbelegungszeichen, markiert den Boden.' });
  d.table({ title: 'Aufwärmen: Stapeln (AB09, Aufgabe 1a)', phase: 'Erarbeitung', rows: [['Operation', ...J.stapel.map((r) => r[0])], ['Belegung', ...J.stapel.map((r) => r[1])], ['geliefert', ...J.stapel.map((r) => r[2])]], colW: [1.9, 1.46, 1.46, 1.46, 1.46, 1.46, 1.46, 1.46], size: 20, notes: '[NUR LEHRKRAFT] Erst ausfüllen lassen, dann aufdecken. Belegung immer mit # am Ende.' });
  const sU = d.bullets({ title: 'Ein Übergang des Kellerautomaten', phase: 'Erarbeitung', size: 22, items: [
    'Kantenbeschriftung: **(oberstes Kellerzeichen, Eingabezeichen) : Ablage**',
    'Das gelesene Kellerzeichen wird **entfernt**, dann wird die Ablage abgelegt – **rechtes Zeichen zuerst**',
    '(#, a) : A#   →   A liegt oben, darunter #',
    '(A, b) : ε   →   A wird entfernt, nichts abgelegt',
    '(#, ε) : #   →   ε-Übergang: kein Eingabezeichen, # bleibt',
  ], notes: 'Typischer Fehler: Ablage von links nach rechts. Merkhilfe: Die Ablage steht so da, wie sie danach oben im Keller aussieht (oben = links).' });
  { const f = d.fit(IMG + 'uebergang_stapel.png', 8.6, 2.5); sU.addImage({ path: IMG + 'uebergang_stapel.png', x: 13.333 - 0.6 - f.w, y: 4.35, w: f.w, h: f.h }); }
  d.table({ title: 'Ablageregel üben (AB09, Aufgabe 1b)', phase: 'Erarbeitung', rows: [['Übergang', 'Belegung vorher', 'Belegung nachher'], ...J.ablage], colW: [4.04, 4.04, 4.05], size: 22, notes: '[NUR LEHRKRAFT] Zeilenweise aufdecken. (A, c) : BCA auf AB#: A weg → B#; dann A, C, B ablegen → BCAB#.' });
  d.image({ title: 'Kellerautomat für aⁿbⁿ (n ≥ 1)', phase: 'Erarbeitung', img: (__MAT + '/build/img/ds09/anbn.png'), sigma: 'Σ = {a, b}   ·   Γ = {#, A}   ·   Vorbelegung #', caption: HINT, notes: 'Idee: Für jedes a ein A in den Keller, jedes b entfernt ein A. Am Ende muss # oben liegen → ε-Übergang in den Endzustand S2.' });
  d.merke({ title: 'Akzeptanz (Abitur-Definition)', phase: 'Erarbeitung', items: [
    'Eine Eingabe wird genau dann **akzeptiert**, wenn es **eine Möglichkeit** gibt, dass sich der Automat nach **vollständiger Verarbeitung** der Eingabe in einem **Endzustand** befindet.',
    'Der Kellerinhalt ist dabei **egal** – „Keller leer“ ist **keine** Bedingung.',
    'Kein passender Übergang ⇒ dieser Lauf scheitert (Fehlerzustand). Abgelehnt, wenn **kein** Lauf akzeptiert.',
  ], notes: 'Ältere Materialien definieren die Akzeptanz teils über „Keller enthält nur noch #“. Verbindlich sind die Ergänzenden Hinweise 2025: Endzustand nach vollständiger Eingabe.' });
  const kSlide = (title, t, text, notes) => {
    const sl = d.table({ title, phase: 'Erarbeitung', rows: rows(t), colW: [2.2, 3.6, 3.1, 3.23], size: 20, notes });
    d.tb(sl, d.rich(text, { fontSize: 22, color: S.H.tealDark }), { x: 0.6, y: 2.75 + 0.5 * t.rows.length, w: 12.1, h: 0.8 });
    return sl;
  };
  kSlide('Verarbeitung dokumentieren: aabb', J.anbn.aabb, 'Eingabe wird akzeptiert: **ja** – die Eingabe ist vollständig gelesen und S2 ist ein Endzustand.', '[NUR LEHRKRAFT] Erste Zeile: S0 | # | – | –. Spalte 3 = Zeichen, das VOR dem Schritt oben lag. Letzte Zeile: ε-Übergang.');
  kSlide('Verarbeitung dokumentieren: aab', J.anbn.aab, 'Eingabe wird akzeptiert: **nein** – A liegt noch oben, (#, ε) : # ist nicht möglich, S1 ist kein Endzustand.', '[NUR LEHRKRAFT] Bei einem NKA müsste man alle Möglichkeiten prüfen; dieser Automat ist deterministisch, es gibt genau einen Lauf.');
  if (0) d.table({ title: 'Verarbeitung dokumentieren: aabb', phase: 'Erarbeitung', rows: rows(J.anbn.aabb), colW: [2.2, 3.6, 3.1, 3.23], size: 20, notes: 'Erste Zeile: S0 | # | – | –. Spalte 3 = Zeichen, das VOR dem Schritt oben lag. Letzte Zeile: ε-Übergang. Ergebnis: akzeptiert, S2 ist Endzustand.' });
  if (0) d.table({ title: 'Verarbeitung dokumentieren: aab', phase: 'Erarbeitung', rows: rows(J.anbn.aab), colW: [2.2, 3.6, 3.1, 3.23], size: 20, notes: 'Eingabe vollständig gelesen, aber A oben und S1 ist kein Endzustand. Kein weiterer Übergang ⇒ abgelehnt.' });
  d.section({ phase: 'Übung', title: 'Arbeitsblatt Level 9' });
  d.task({ title: 'Auftrag: AB09', steps: [
    '**Aufgabe 2**: Tabellen für aabb und aab im Abi-Format.',
    '**Aufgabe 3**: Klammer-Check analysieren.',
    '**Aufgabe 4**: Kellerautomat für aⁿb²ⁿ entwickeln.',
    'Profis: **3d** (runde und eckige Klammern) und **Aufgabe 5** (gleich viele a und b).',
    'Kontrolle im **Keller-Labor** (Tabellen-Trainer, Simulator).',
  ], zeit: '30 min', sozialform: 'Einzel → Partner', material: 'AB09, Merkblatt M07', app: '#/keller?automat=anbn&modus=tabelle&wort=aabb', notes: 'Tabellen-Trainer gibt zeilenweise Rückmeldung. Eigene Automaten im Simulator testen: #/keller?automat=anb2n&modus=sim.' });
  d.app({ title: 'Keller-Labor', route: '#/keller?automat=klammern&modus=sim', text: 'Schrittsimulator mit **Stapel-Animation**: Wähle den nächsten Übergang oder lass den Automaten laufen. Modus **Tabelle**: Abi-Tabelle Zeile für Zeile mit Sofort-Feedback.', notes: 'Automaten im Labor: anbn, klammern, klammern-gemischt, anb2n, gleich-ab (passend zu AB09).' });
  d.section({ phase: 'Sicherung', title: 'Was wir heute gelernt haben' });
  d.merke({ title: 'Merke: Kellerautomat', items: [
    'Kellerautomat = endlicher Automat + **Kellerspeicher** (Stapel, LIFO, unbegrenzt)',
    'Kante **(Kellerzeichen, Eingabe) : Ablage** – oberstes Zeichen wird entfernt, Ablage rechts zuerst',
    'Kelleralphabet **Γ**, Vorbelegung **#**, ε-Übergänge erlaubt',
    '**Akzeptiert**, wenn der Automat nach vollständiger Eingabe in einem **Endzustand** sein kann',
    'Der Keller kann **unbeschränkt zählen** – deshalb klappt aⁿbⁿ',
  ], img: (__MAT + '/build/img/ds09/klammern.png'), imgW: 4.2 });
  d.end({ items: ['Stapel: push, pop, top – oben = links', 'Notation und Ablageregel', 'Abi-Tabelle: Zustand | Belegung | oberstes Kellersymbol | Eingabezeichen', 'Akzeptanz über Endzustand'], hausaufgabe: 'Tabellen für aaabbb und abb (Automat aus Abbildung 1); Tabellen-Trainer „gleich viele a und b“ im Keller-Labor.' });
  return d.save(OUT + `DS09_Folien_${FN}.pptx`);
}

(async () => {
  const files = [await ab(), await lk(), await folien()];
  console.log(files.join('\n'));
})();
