const __MAT = require('path').resolve(__dirname, '../..'); // Wurzel: materials/
// DS06 – Level 6 „Automaten, die antworten“ (Mealy) – Arbeitsblatt, Lehrkraft-Handreichung, Folien
const D = require((__MAT + '/lib/docstyle.js'));
const S = require((__MAT + '/lib/deckstyle.js'));
const { side } = require((__MAT + '/content/ds05/local.js'));
const DATA = require((__MAT + '/content/ds06/ds06_data.json'));
const IMG = (__MAT + '/build/img/ds06/');
const OUT = (__MAT + '/out/');
const T = 'Automaten, die antworten';
const SUB = 'Mealy-Automaten: übersetzen statt nur prüfen';
const KF = 'Wie modelliert man Automaten, die nicht nur prüfen, sondern übersetzen und reagieren?';
const FN = 'Automaten-die-antworten';
const STATES = ['S0', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6'];
const FH = DATA.frog_hash; const FR = DATA.frog;

const VERGLEICH = [
  ['Merkmal', 'DEA', 'Mealy-Automat'],
  ['Alphabete', 'Eingabealphabet Σ', 'Eingabealphabet Σ und Ausgabealphabet Ω'],
  ['Kantenbeschriftung', 'Eingabezeichen, z. B. a', 'Eingabe / Ausgabe, z. B. a / AB oder a / ε'],
  ['Ergebnis einer Verarbeitung', 'nur „akzeptiert“ oder „abgelehnt“ – nach dem letzten Zeichen', 'ein Ausgabewort, das Schritt für Schritt entsteht'],
  ['Endzustände', 'ja (Doppelkreis)', 'keine – nur ein Startzustand'],
  ['Vollständigkeit', 'Fehlerzustand darf mit Hinweis fehlen', 'vollständiger Übergangsgraph'],
  ['Gemeinsam', 'endlich viele Zustände, Startzustand, deterministisch, kein weiterer Speicher', ''],
];
const vergleichRows = VERGLEICH.slice(0, 6);
const hashTable = (h, cap) => [
  D.table([['Zustand', ...STATES], ['Ausgabe mit #', ...STATES.map((q) => h[q])]], { widthsCm: [3.0, ...STATES.map(() => 2.0)], size: 19, allCenter: true, firstColBold: true, noSpacer: true }),
  D.small(cap, { align: 'center', after: 140 }),
];

// =====================================================================================  Arbeitsblatt
async function ab() {
  const body = [
    D.p('Bisher konnten unsere Automaten nur eines: am Ende „ja“ oder „nein“ sagen. Ein Getränkeautomat, eine Ampelsteuerung oder ein Übersetzungsprogramm müssen aber **während** der Eingabe reagieren. Dafür gibt es den **Mealy-Automaten**: Jeder Übergang liefert zusätzlich eine Ausgabe.'),
    ...D.info('So liest du einen Mealy-Automaten', [
      ...side([
        ...D.bullets([
          'Eingabealphabet **Σ**, Ausgabealphabet **Ω**',
          'Kante **e / a**: Liest der Automat e, gibt er a aus und wechselt den Zustand. a darf ein **Wort** über Ω sein (z. B. `K1`).',
          'Keine Ausgabe: **ε**',
          '**Keine Endzustände** – das Ergebnis ist die Ausgabe. Der Übergangsgraph ist **vollständig**.',
        ], { size: 20 }),
      ], [...D.img(IMG + 'suess.png', { widthCm: 5.0, caption: 'Süßigkeitenautomat: M = Münze, H = Hebel, B = Bonbon' })], [11.2, 5.8]),
    ]),
    D.task({ nr: 1, title: 'Der Kartoffelautomat', niveau: 'Basis', afb: 'I–II', body: [
      D.p('Ein Hofladen verkauft Kartoffeln für **4 €** pro Sack. Der Automat nimmt 1-€- und 2-€-Münzen an: Σ = {1, 2}. Sobald 4 € erreicht sind, gibt er einen Sack aus (K); wurden 5 € eingeworfen, zusätzlich 1 € Rückgeld (1): Ω = {1, K}.'),
      D.img(IMG + 'kartoffel.png', { widthCm: 12.5, caption: 'Abbildung 1: Kartoffelautomat' }),
      D.sub('a', '**Gib** die Ausgaben für die Eingaben `1212`, `2221` und `212` **an** und **stelle** die Verarbeitung von `212` **dar** (z. B. S0 –2 / ε→ S2 …).'),
      ...D.lines(2),
      D.sub('b', '**Erläutere** die Bedeutung des Zustands S3 und der Ausgabe K1 im Sachzusammenhang.'),
      ...D.lines(2),
      D.sub('c', 'Nach der Eingabe `1212` geht die Kundin. **Beschreibe**, was die nächste Kundin vorfindet.'),
      ...D.lines(1),
      D.p('**d)**  **Vergleiche** DEA und Mealy-Automat, indem du die Tabelle ausfüllst.', { keepNext: true, after: 80 }),
      ...D.fillTable(['Merkmal', 'DEA', 'Mealy-Automat'], 4, { widthsCm: [4.2, 6.6, 6.6], size: 19, rowHeightCm: 0.8, prefill: [['Alphabete', '', ''], ['Kantenbeschriftung', '', ''], ['Ergebnis einer Verarbeitung', '', ''], ['Endzustände', '', '']] }),
    ] }),
    D.task({ nr: 2, title: 'Der Ziffernaddierer', niveau: 'Standard', afb: 'II', body: [
      D.p('Ein Mealy-Automat liest immer **zwei Ziffern** aus Σ = {0, 1, 2, 3} und gibt nach der zweiten Ziffer deren **Summe** aus, Ω = {0, 1, …, 6}. Danach beginnt das nächste Ziffernpaar. Beispiele: `13` → 4, `30` → 3, `2133` → 36.'),
      D.sub('a', '**Entwickle** den Zustandsgraphen eines solchen Mealy-Automaten mit fünf Zuständen.'),
      ...D.drawBox(6.4),
      D.sub('b', '**Gib** die Ausgabe für `0321` und für `123` **an** und **erläutere**, in welchem Zustand sich dein Automat nach `123` befindet.'),
      ...D.lines(3),
    ] }),
    D.task({ nr: 3, title: 'Bug-Jagd: Der Lauflängen-Kompressor', niveau: 'Standard', afb: 'II–III', body: [
      D.p('In einer Lern-App steuern Kinder eine Spielfigur mit **h** (hüpfen), **d** (drehen) und **#** (Ende der Befehlsfolge). Ein Mealy-Automat soll Befehlsfolgen verkürzen: **Bis zu drei** gleiche Befehle in Folge werden zusammengefasst, die Zahl steht vor dem Buchstaben. Aus `hdddhhhhhdhh#` wird `1h3d3h2h1d2h#`. Der Automat in Abbildung 2 arbeitet noch **fehlerhaft**.', { keepNext: true }),
      D.img(IMG + 'kompressor_bug.png', { widthCm: 16.0, caption: 'Abbildung 2: Kompressor – Übergänge mit h und d' }),
      ...hashTable(FH.bug, 'Tabelle: Übergänge mit # – sie führen aus jedem Zustand nach S0'),
      D.sub('a', '**Gib** die Ausgaben des fehlerhaften Automaten für die Eingaben `hdddh#` und `ddhhh#` **an**.'),
      ...D.lines(2),
      D.sub('b', '**Erläutere** die Fehler bei der Umwandlung dieser beiden Eingaben.'),
      ...D.lines(2),
      D.sub('c', '**Verändere** den Automaten so, dass er korrekt arbeitet (korrigiere direkt in Abbildung 2 bzw. in der Tabelle).'),
    ] }),
    D.qr({ route: '#/mealy?aufgabe=4&modus=bugjagd', title: 'Mealy-Maschine – Bug-Jagd', text: 'Teste Eingaben am Ein- und Ausgabeband, finde die falschen Kantenausgaben und repariere sie. Zum Aufwärmen: „Was kommt raus?“ mit dem Kartoffelautomaten (#/mealy?aufgabe=2&modus=vorhersage).' }),
    D.task({ nr: 4, title: 'Der Palindrom-Generator', niveau: 'Profi', afb: 'II–III', body: [
      D.p('Ein **Palindrom** liest sich vorwärts und rückwärts gleich, z. B. `01110`. Ein Mealy-Automat über Σ = Ω = {0, 1} soll aus jeweils **drei Bits** ein **fünfstelliges Palindrom** erzeugen: Aus `011` wird `01110`. Danach beginnt der nächste Dreierblock.', { keepNext: true }),
      D.p('**a)**  **Entwickle** einen solchen Mealy-Automaten. (Tipp: Gib die ersten Bits sofort aus – was muss sich der Automat trotzdem merken?)', { keepNext: true, after: 80 }),
      ...D.drawBox(4.6),
      D.sub('b', '**Gib** die Ausgabe deines Automaten für `011110` **an**.'),
      ...D.lines(1),
      D.sub('c', '**Untersuche**, wie viele Zustände ein Mealy-Automat mindestens benötigt, der aus jeweils **vier** Bits ein **siebenstelliges** Palindrom erzeugt.'),
      ...D.lines(3),
    ] }),
    ...D.tip('Boss-Level A', [D.p('Welt A ist fast geschafft! Das **Boss-Level A** (Abi-artige Aufgabe zu DEA, Minimierung und Mealy) ist ein freiwilliges Abi-Training für zu Hause – der Erwartungshorizont liegt zur Selbstkontrolle bei.', { size: 20 })]),
    D.h3('Selbstcheck – Level 6 geschafft, wenn …'),
    ...D.checklist([
      'ich Aufbau und Notation eines Mealy-Automaten (Σ, Ω, e / a, ε, keine Endzustände) beschreiben kann.',
      'ich Ausgaben eines Mealy-Automaten bestimmen und Zustände sowie Ausgaben im Sachzusammenhang erläutern kann.',
      'ich Gemeinsamkeiten und Unterschiede von DEA und Mealy-Automat nennen kann.',
      'ich Mealy-Automaten entwickeln und fehlerhafte Mealy-Automaten korrigieren kann.',
    ]),
  ];
  return D.save(D.doc({ kind: 'AB', ds: 6, title: T, subtitle: SUB, kernfrage: KF, body }), OUT + `DS06_AB_${FN}.docx`);
}

// =====================================================================================  Lehrkraft
async function lk() {
  const K = DATA.kart; const P = DATA.pal;
  const card = (q, rules) => [D.p(`**Zustand ${q}**`, { size: 24, color: D.C.teal }), ...rules.map((r) => D.p(r, { size: 21, after: 40 }))];
  const body = [
    D.h2('Überblick'),
    ...D.table([
      ['Aspekt', 'Inhalt'],
      ['Lernziele', 'Die SuS beschreiben Aufbau und Funktionsweise von Mealy-Automaten (Σ, Ω, Übergänge e / a, ε, keine Endzustände), vergleichen DEA und Mealy-Automat, bestimmen Ausgaben, erläutern Zustände im Sachzusammenhang, entwickeln Mealy-Automaten und korrigieren fehlerhafte.'],
      ['KC-Bezug', 'Automatenmodelle: Aufbau und Funktionsweise von Mealy-Automaten beschreiben (K2); Automatenmodelle als Zustandsgraphen entwickeln (K3); Funktion gegebener Automaten analysieren (K4). PK1.1, PK3.2, IK3.1'],
      ['Abi-Bezug', 'Abi 2024 eA Aufgabe B (Nachschreibtermin), Teile a–c (Gemeinsamkeiten/Unterschiede Mealy–DEA; Palindrom-Generator 3 → 5 Bit; Mindestzahl der Zustände für 5 → 9 Bit) → AB-Aufgaben 1d und 4 (eigene Variante 4 → 7 Bit). Abi 2022 eA Aufgabe D, Teil b (fehlerhafter Mealy-Automat Frog1 → Frog2: Ausgaben angeben, Fehler erläutern, Automat verändern) → AB-Aufgabe 3 (eigener fehlerhafter Automat). Notation nach Ergänzenden Hinweisen 2025: „e / a“, ε, keine Endzustände.'],
      ['Material', 'Folien DS06, AB06, Merkblatt M04, Rollenspiel-Karten (unten), AutomatenLab „Mealy-Maschine“ (#/mealy?aufgabe=1, ?aufgabe=2&modus=vorhersage, ?aufgabe=4&modus=bugjagd), Boss-Level A mit Erwartungshorizont'],
      ['Vorbereitung', 'Zwei Zustandskarten S0/S1, Münzkarten (M), eine „Hebel“-Karte (H), Tüte Bonbons; Tafel: Protokolltabelle Eingabe | Zustand | Ausgabe; Boss-Level A kopieren.'],
    ], { widthsCm: [3.2, 14.2], firstColBold: true, firstColFill: true }),
    D.h2('Verlaufsplan (90 Minuten)'),
    ...D.table([
      ['Zeit', 'Phase', 'Unterrichtsgeschehen', 'Sozialform / Medien'],
      ['0–15', 'Einstieg', 'Rollenspiel „Süßigkeitenautomat“: Eine Schülerin ist der Automat (Zustandskarte S0/S1, Regelkarte), die Klasse „bedient“ mit M und H. Protokoll an der Tafel. Impuls: „Wie würde ein DEA das modellieren? Was fehlt ihm?“ → Ein DEA kann nur am Ende akzeptieren, nicht unterwegs Bonbons ausgeben.', 'Rollenspiel, Tafel'],
      ['15–35', 'Erarbeitung', 'Notation (Folien 6–9): Σ, Ω, „e / a“, ε, Ausgabewörter, keine Endzustände, Vollständigkeit. Kartoffelautomat gemeinsam lesen: Ausgabe für 212. Vergleichstabelle DEA – Mealy (Folie 10) gemeinsam füllen (= AB 1d).', 'LV/UG, Folien, M04'],
      ['35–75', 'Übung', 'AB06 nach Niveau; Aufgabe 3 mit App „Bug-Jagd“ kontrollieren. Zwischensicherung Aufgabe 2a (ein Zustandsgraph unter Dokumentenkamera). Profis: Aufgabe 4.', 'EA/PA, AB06, iPads'],
      ['75–85', 'Sicherung', 'Merkblatt M04, Vergleich DEA – Mealy; Mealy kommt mit weniger Zuständen aus, wenn die „Entscheidung“ auf der Kante ausgegeben wird (Vorbereitung Boss-Level).', 'UG, M04'],
      ['85–90', 'Ausblick', 'Boss-Level A als Extra-Training anbieten (freiwillig oder als Hausaufgabe, ca. 60–75 min), Selbstkontrolle mit Erwartungshorizont. Teil d setzt die Vertiefung Level 5 voraus – sonst weglassen.', 'Boss-Level A'],
    ], { widthsCm: [1.6, 2.4, 10.2, 3.2], size: 19 }),
    D.h2('Rollenspiel „Süßigkeitenautomat“'),
    D.p('Eine Person spielt den Automaten und hält die Zustandskarte (Startzustand S0) sowie die Bonbontüte. Die Klasse gibt nacheinander Eingaben: Münzkarte (M) einwerfen oder „Hebel ziehen“ (H). Der Automat reagiert nach der Regelkarte, nennt laut seine Ausgabe (Bonbon oder „nichts“ = ε) und dreht ggf. die Zustandskarte um.', { size: 21 }),
    ...D.table([[card('S0', ['M → nichts ausgeben, Karte auf **S1** drehen', 'H → nichts ausgeben, bei **S0** bleiben']), card('S1', ['M → Münze schlucken, nichts ausgeben, bei **S1** bleiben', 'H → **Bonbon ausgeben**, Karte auf **S0** drehen'])]], { widthsCm: [8.7, 8.7], header: false, rowHeightCm: 2.4 }),
    D.p(`Protokoll-Beispiele (aus dem Code): \`MHMH\` → Ausgabe ${DATA.suess.MHMH}; \`MMHH\` → ${DATA.suess_steps.MMHH} (Ausgabe B). \`HH\` → ε.`, { size: 20 }),
    D.pageBreak(),
    D.h2('Lösungen AB06'),
    D.h3('Aufgabe 1 – Kartoffelautomat'),
    ...D.bullets([
      `a) \`1212\` → ${K['1212'].out}; \`2221\` → ${K['2221'].out}; \`212\` → ${K['212'].out}. Verarbeitung: ${K['212'].steps}.`,
      'b) S3: „Es wurden bisher 3 € bezahlt (noch kein Sack ausgegeben).“ K1: Bei 3 € Guthaben wird eine 2-€-Münze eingeworfen, also 5 € – Ausgabe Sack (K) und 1 € Rückgeld (1).',
      `c) ${K['1212'].steps}: Nach 1 + 2 + 1 = 4 € gibt es den Sack; die letzte 2-€-Münze zählt schon für den nächsten Kauf. Die nächste Kundin startet in S2 mit 2 € Guthaben.`,
      'd) Vergleichstabelle:',
    ]),
    ...D.table(vergleichRows, { widthsCm: [4.2, 6.6, 6.6], size: 19, firstColBold: true }),
    D.h3('Aufgabe 2 – Ziffernaddierer'),
    D.img(IMG + 'addierer.png', { widthCm: 8.0 }),
    ...D.bullets([
      `b) \`0321\` → ${DATA.add['0321']} (0 + 3 = 3, 2 + 1 = 3); \`123\` → ${DATA.add['123']}. Nach \`123\` befindet sich der Automat in S4: Die erste Ziffer (3) des nächsten Paares ist gelesen, ihre Summe kann erst nach der zweiten Ziffer ausgegeben werden.`,
      'Bedeutung: S0 „warte auf die erste Ziffer“, Si (i = 1 … 4) „erste Ziffer ist i − 1“.',
    ]),
    D.h3('Aufgabe 3 – Lauflängen-Kompressor (eigene Variante zu Abi 2022 eA D b)'),
    ...D.bullets([
      `a) \`hdddh#\` → \`${FR['hdddh#'].bug}\` (korrekt: \`${FR['hdddh#'].ok}\`); \`ddhhh#\` → \`${FR['ddhhh#'].bug}\` (korrekt: \`${FR['ddhhh#'].ok}\`).`,
      `b) Fehler 1: Nach drei d (Zustand S6) gibt der Übergang mit h die Ausgabe 3h statt 3d aus – die drei Drehungen werden als Hüpfer ausgegeben. Verarbeitung: ${FR['hdddh#'].steps_bug}. Fehler 2: Bei drei h (Zustand S3) und anschließendem # fehlt das abschließende #: Ausgabe 3h statt 3h#.`,
      'c) Korrektur: S6 –h / **3d**→ S1 und S3 –# / **3h#**→ S0. Alle übrigen Übergänge sind korrekt (mit dem Code für alle Eingaben bis Länge 8 gegen die Spezifikation geprüft).',
    ]),
    D.img(IMG + 'kompressor.png', { widthCm: 15.0, caption: 'Korrigierter Kompressor – Übergänge mit h und d' }),
    ...hashTable(FH.ok, 'Korrigierte #-Übergänge (alle nach S0)'),
    D.h3('Aufgabe 4 – Palindrom-Generator (eigene Variante zu Abi 2024 eA B Nachschreibtermin)'),
    D.img(IMG + 'palindrom.png', { widthCm: 8.6 }),
    ...D.bullets([
      'a) Die ersten beiden Bits werden sofort ausgegeben und gemerkt (S1/S2: erstes Bit 0/1; S3–S6: erste beiden Bits 00, 01, 10, 11). Beim dritten Bit c gibt der Automat c, dann das zweite und das erste Bit aus und kehrt nach S0 zurück.',
      `b) \`011110\` → \`${P.ex['011110']}\` (011 → 01110, 110 → 11011).`,
      `c) Nach k gelesenen Bits eines Blocks (k = 0, 1, 2, 3) muss sich der Automat alle k Bits merken, denn sie werden am Blockende in umgekehrter Reihenfolge ausgegeben; verschiedene Bitfolgen derselben Länge führen zu verschiedenen späteren Ausgaben. Auch Zustände nach verschieden vielen Bits sind unterscheidbar, weil der Blockabschluss (drei Ausgabezeichen) zu verschiedenen Zeitpunkten erfolgt (z. B. S0 und S1 mit \`00\`: Ausgabe \`00\` bzw. \`0000\`). Also mindestens 1 + 2 + 4 + 8 = **${P.n4}** Zustände (für 3 → 5 Bit: 1 + 2 + 4 = ${P.n3}). Der konstruierte Automat hat genau ${P.n4} Zustände; eine Mealy-Minimierung im Code bestätigt, dass keine zwei davon zusammengefasst werden können.`,
      'Zum Vergleich Original (5 → 9 Bit): 1 + 2 + 4 + 8 + 16 = 31 Zustände.',
    ]),
    D.h2('Typische Schwierigkeiten'),
    ...D.warn({ titel: 'Darauf achten', fallen: ['P5', 'P1'] }, [
      ...D.bullets([
        '**Endzustände eingezeichnet:** Mealy-Automaten haben keine Endzustände (Ergänzende Hinweise 2025). Doppelkreise sind falsch.',
        '**Fehlende Übergänge:** Der Übergangsgraph muss vollständig sein – jeder Zustand braucht für jedes Eingabezeichen eine Kante (ggf. mit Ausgabe ε).',
        '**ε vergessen oder „N“ geschrieben:** Leere Ausgabe wird mit ε notiert (ältere Materialien nutzen teils „N“ für „nichts“ – nicht mehr verwenden).',
        '**Ausgabe zum falschen Zeitpunkt:** Die Ausgabe gehört zur Kante, nicht zum Zustand (kein Moore-Automat).',
        '**Kompressor:** Nach drei gleichen Befehlen beginnt beim vierten ein neuer Block (S3 –h / 3h→ S1, nicht S0).',
      ]),
    ]),
    D.h2('Differenzierung'),
    ...D.bullets([
      '**Basis:** Aufgabe 1 und 2a (Hilfe: Bedeutung der Zustände vorgeben: „S1: erste Ziffer 0“ …); App „Was kommt raus?“.',
      '**Standard:** Aufgaben 1–3.',
      '**Profi:** Aufgabe 4; Zusatz: Original Abi 2024 eA B (Nachschreibtermin) c für 5 → 9 Bit.',
    ]),
    D.h2('Hausaufgabe und Extra-Training Boss-Level A'),
    ...D.bullets([
      '**Boss-Level A** (BossLevel_A_Endliche-Automaten.docx, 25 BE, ca. 60–75 min) als freiwilliges Extra-Training oder Hausaufgabe; Teil d (Zustände zusammenfassen) setzt die Vertiefung Level 5 voraus. Selbstkontrolle mit BossLevel_A_Erwartungshorizont.docx (BE und AFB je Teilaufgabe).',
      'Empfehlung: Erwartungshorizont erst nach vollständiger Bearbeitung austeilen oder digital bereitstellen; SuS markieren erreichte BE und notieren ihre „Schwachstelle“ für die Lernlandkarte.',
      'Nächste Stunde (Level 7): ggf. 10 Minuten Fragen zum Boss-Level, besonders Teil f (Mealy mit weniger Zuständen als DEA).',
    ]),
  ];
  return D.save(D.doc({ kind: 'LK', ds: 6, title: T, subtitle: SUB, kernfrage: KF, body }), OUT + `DS06_Lehrkraft_${FN}.docx`);
}

// =====================================================================================  Folien
async function folien() {
  const d = S.deck({ ds: 6, title: T });
  const K = DATA.kart;
  d.title({ title: T, subtitle: SUB, kernfrage: KF, notes: 'Level 6 schließt Welt A ab. Neu: Automaten mit Ausgabe. Am Ende: Boss-Level A als Hausaufgabe.' });
  d.section({ phase: 'Einstieg', title: 'Der Süßigkeitenautomat' });
  d.task({ title: 'Rollenspiel: Der Süßigkeitenautomat', phase: 'Einstieg', steps: [
    'Eine Person ist der **Automat**: Zustandskarte S0, Regelkarte, Bonbontüte.',
    'Die Klasse bedient ihn: **M** (Münze einwerfen) oder **H** (Hebel ziehen).',
    'Der Automat nennt laut seine **Ausgabe**: „Bonbon“ oder „nichts“.',
    'An der Tafel: Protokoll **Eingabe | Zustand | Ausgabe**.',
  ], zeit: '12 min', sozialform: 'Plenum', material: 'Zustands- und Regelkarte, Bonbons', notes: 'Eingabefolgen vorschlagen: MH, HMH, MMH, MHMH, HH. Nachfragen: Was passiert bei MM? (Münze geschluckt – Automat merkt sich nur „Münze drin“.)' });
  d.question({ text: 'Wie würde ein DEA den Süßigkeitenautomaten modellieren – und was fehlt ihm?', sub: 'Ein DEA sagt erst **am Ende** „akzeptiert“ oder „abgelehnt“. Der Süßigkeitenautomat muss **unterwegs** reagieren.', notes: 'Ziel: Wir brauchen Ausgaben an den Übergängen → Mealy-Automat (George H. Mealy, 1955).' });
  d.section({ phase: 'Erarbeitung', title: 'Mealy-Automaten' });
  d.bullets({ title: 'Der Süßigkeitenautomat als Mealy-Automat', items: [
    'Eingabealphabet **Σ = {M, H}**',
    'Ausgabealphabet **Ω = {B}**',
    'Kante **e / a**: lies e, gib a aus',
    '**ε** = keine Ausgabe',
    '**Keine Endzustände** – nur Startzustand',
  ], img: IMG + 'suess.png', imgW: 5.6, notes: 'Mit Rollenspiel-Protokoll vergleichen: Regelkarte = ausgehende Kanten. Ältere Materialien nutzen teils „N“ für keine Ausgabe – nach den Ergänzenden Hinweisen 2025 schreiben wir ε.' });
  d.merke({ title: 'Notation (Abitur ab 2027)', phase: 'Erarbeitung', items: [
    'Angabe: **Σ**, **Ω** und **vollständiger** Übergangsgraph.',
    'Kantenbeschriftung **Eingabezeichen / Ausgabe**, z. B. `a / A`.',
    'Die Ausgabe darf ein **Wort** über Ω sein: `2 / K1`.',
    'Leere Ausgabe: **ε**, z. B. `M / ε`.',
    'Mealy-Automaten haben **keine Endzustände**.',
  ], img: IMG + 'suess.png', imgW: 4.6, notes: 'Ergänzende Hinweise 2025, Abschnitt Mealy-Automaten. Im Merkblatt M04 nachlesen.' });
  d.image({ title: 'Der Kartoffelautomat', img: IMG + 'kartoffel.png', sigma: 'Σ = {1, 2} (Münzen in €), Ω = {1, K}: K = Sack Kartoffeln, 1 = 1 € Rückgeld · Preis 4 €', caption: 'Zustand = bisher bezahlter Betrag (0 €, 1 €, 2 €, 3 €)', notes: 'Gemeinsam: Ausgabe für 212? Erst die SuS rechnen lassen.' });
  d.table({ title: 'Verarbeitung darstellen', rows: [
    ['Eingabe', 'Verarbeitung', 'Ausgabe'],
    ['212', K['212'].steps, K['212'].out],
    ['1212', K['1212'].steps, K['1212'].out],
    ['2221', K['2221'].steps, K['2221'].out],
    ['11111', K['11111'].steps, K['11111'].out],
  ], colW: [1.6, 8.6, 1.9], size: 22, notes: '[NUR LEHRKRAFT] Bei 1212 endet der Automat in S2: Die letzte Münze bleibt als Guthaben für die nächste Kundin (AB 1c).' });
  d.table({ title: 'DEA und Mealy-Automat im Vergleich', rows: vergleichRows, colW: [3.1, 4.5, 4.5], size: 18, notes: 'Gemeinsamkeiten: endlich viele Zustände, Startzustand, deterministisch, kein weiterer Speicher. Abi 2024 Nachschreibtermin a: „Beschreiben Sie Gemeinsamkeiten und Unterschiede …“.' });
  d.section({ phase: 'Übung', title: 'Arbeitsblatt Level 6' });
  d.task({ title: 'Auftrag: AB06', steps: [
    '**Aufgabe 1** (Basis): Kartoffelautomat analysieren, Vergleichstabelle.',
    '**Aufgabe 2**: Ziffernaddierer entwickeln.',
    '**Aufgabe 3**: Bug-Jagd im Kompressor – prüfe mit der App.',
    'Profis: **Aufgabe 4** – Palindrom-Generator.',
  ], zeit: '40 min', sozialform: 'Einzel → Partner', material: 'AB06, Merkblatt M04', app: '#/mealy?aufgabe=4&modus=bugjagd', notes: 'Zwischensicherung 2a nach ca. 15 Minuten.' });
  d.image({ title: 'Bug-Jagd: Wo steckt der Fehler?', img: IMG + 'kompressor_bug.png', caption: 'Mit # geht es aus jedem Zustand nach S0 (Ausgaben siehe AB, Tabelle). Teste hdddh# und ddhhh#.', notes: `Fehlerhafte Ausgaben: hdddh# → ${DATA.frog['hdddh#'].bug}, ddhhh# → ${DATA.frog['ddhhh#'].bug}. Angelehnt an Abi 2022 eA D b (Frog).` });
  d.app({ title: 'Mealy-Maschine', route: '#/mealy?aufgabe=4&modus=bugjagd', text: 'Ein- und Ausgabeband Schritt für Schritt. **Bug-Jagd**: falsche Kantenausgaben finden und reparieren. Weitere Modi: **Was kommt raus?** (vorhersage) und freie Simulation.', notes: 'Weitere Routen: #/mealy?aufgabe=2&modus=vorhersage (Kartoffel), #/mealy?aufgabe=5 (Palindrom).' });
  d.section({ phase: 'Sicherung', title: 'Was wir heute gelernt haben' });
  d.merke({ title: 'Merke: Mealy-Automat', items: [
    'Ein Mealy-Automat **übersetzt**: Jeder Übergang liest ein Zeichen und gibt ein Wort über Ω aus (ggf. ε).',
    'Notation **e / a**, vollständiger Übergangsgraph, **keine Endzustände**.',
    'Zustände sind wie beim DEA das **Gedächtnis** – z. B. bisher bezahlter Betrag.',
    'Die „Entscheidung“ steht auf der Kante: Ein Mealy-Automat braucht oft **weniger Zustände** als ein vergleichbarer DEA.',
  ], img: IMG + 'kartoffel.png', imgW: 5.4 });
  d.cards({ title: 'Boss-Level A: Pixel-Ninja', phase: 'Sicherung', cards: [
    { head: 'Was?', text: 'Abi-artige Aufgabe, 25 BE: DEA analysieren und entwickeln, Zustände zusammenfassen, Mindestzahl begründen, Mealy.', icon: 'LuSwords' },
    { head: 'Wie?', text: 'Als Hausaufgabe, ca. 60–75 Minuten, Hilfsmittel: Merkblätter M01–M04.', icon: 'LuClock' },
    { head: 'Kontrolle', text: 'Erwartungshorizont mit BE und Anforderungsbereichen – markiere deine Punkte und Schwachstellen.', icon: 'LuListChecks' },
  ], notes: 'Boss-Level A und Erwartungshorizont austeilen bzw. digital bereitstellen. Fragen zu Beginn von Level 7.' });
  d.end({ items: ['Mealy-Automat: Σ, Ω, Kanten e / a, ε, keine Endzustände', 'Ausgaben bestimmen und Zustände im Sachzusammenhang erläutern', 'DEA und Mealy-Automat vergleichen', 'Mealy-Automaten entwickeln und korrigieren'], hausaufgabe: 'Extra-Training: Boss-Level A „Pixel-Ninja“ bearbeiten (ca. 60–75 min) und mit dem Erwartungshorizont selbst kontrollieren. Offene Fragen notieren.' });
  return d.save(OUT + `DS06_Folien_${FN}.pptx`);
}

(async () => {
  const files = [await ab(), await lk(), await folien()];
  console.log(files.join('\n'));
})();
