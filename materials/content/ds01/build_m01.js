const __MAT = require('path').resolve(__dirname, '../..'); // Wurzel: materials/
// M01 – Merkblatt „Deterministische endliche Automaten (DEA)“ (Level 1–2)
const D = require((__MAT + '/lib/docstyle.js'));
const IMG = (__MAT + '/build/img/ds01/');
const OUT = (__MAT + '/out/');

(async () => {
  const body = [
    D.h2('1  Aufbau'),
    D.table([
      ['Bestandteil', 'Bedeutung', 'im Zustandsgraphen'],
      ['Eingabealphabet Σ', 'endliche Menge der Zeichen, die gelesen werden', 'Beschriftungen der Pfeile'],
      ['Zustände Q', 'endlich viele; das „Gedächtnis“ des Automaten', 'Kreise S0, S1, …'],
      ['Startzustand S0', 'hier beginnt jede Verarbeitung', 'Pfeil „Start“'],
      ['Endzustände F', 'Teilmenge von Q; Ende hier ⇒ akzeptiert', 'Doppelkreis'],
      ['Übergangsfunktion δ', 'δ(Zustand, Zeichen) = Folgezustand', 'Pfeile; mehrere Zeichen mit Komma'],
    ], { widthsCm: [3.8, 8.0, 5.6], size: 19, firstColBold: true }),
    D.p('Formale Schreibweise: **A = (Q, Σ, δ, S0, F)** mit δ: Q × Σ → Q. *Deterministisch* heißt: Für jeden Zustand und jedes Zeichen gibt es **genau einen** Folgezustand.', { size: 21 }),
    D.h2('2  Darstellung'),
    D.img(IMG + 'lol.png', { widthCm: 10.5, caption: 'LOL-Erkenner, Σ = {L, O, X}: akzeptiert alle Wörter, in denen LOL vorkommt.' }),
    D.table([
      ['δ', 'L', 'O', 'X'],
      ['→ S0', 'S1', 'S0', 'S0'],
      ['S1', 'S1', 'S2', 'S0'],
      ['S2', 'S3', 'S0', 'S0'],
      ['* S3', 'S3', 'S3', 'S3'],
    ], { widthsCm: [2.4, 1.8, 1.8, 1.8], size: 19, center: [1, 2, 3], align: 'center' }),
    D.small('Übergangstabelle: → markiert den Startzustand, * markiert Endzustände.', { align: 'center' }),
    ...D.merke('Vollständigkeit & Fehlerzustand (Abitur)', [
      D.p('Endliche Automaten werden im Abitur **vollständig** angegeben: Jeder Zustand hat für jedes Zeichen aus Σ einen Übergang. Der **Fehlerzustand** (kein Endzustand, alle Übergänge führen in ihn selbst) darf **weggelassen** werden, wenn ein Hinweis dabeisteht:', { size: 21 }),
      D.p('*„Alle nicht eingezeichneten Übergänge führen in einen Fehlerzustand.“*', { size: 21, align: 'center' }),
    ]),
    D.h2('3  Verarbeitung und Akzeptanz'),
    ...D.bullets([
      'Der Automat liest das Wort **Zeichen für Zeichen** von links nach rechts und folgt jeweils dem passenden Pfeil.',
      'Ein Wort wird **akzeptiert**, wenn der Automat **nach dem letzten Zeichen** in einem Endzustand ist – sonst **abgelehnt**.',
      'Zwischendurch einen Endzustand zu „besuchen“, reicht nicht.',
    ], { size: 21 }),
    D.p('**Verarbeitung darstellen** (Zustandsfolge):  `S0 –X→ S0 –L→ S1 –O→ S2 –L→ S3 –X→ S3`  ⇒  akzeptiert', { size: 21 }),
    D.h2('4  Begriffe rund um Sprachen'),
    D.table([
      ['Begriff', 'Bedeutung', 'Beispiel (Σ = {a, b})'],
      ['Wort', 'endliche Folge von Zeichen aus Σ', 'abba, b, aaab'],
      ['leeres Wort ε', 'Wort ohne Zeichen (Länge 0)', 'ε wird akzeptiert ⇔ S0 ist Endzustand'],
      ['Σ*', 'Menge aller Wörter über Σ (inkl. ε)', '{ε, a, b, aa, ab, …}'],
      ['Sprache L(A)', 'Menge aller Wörter, die A akzeptiert', 'L(A) = {w ∈ Σ* | w enthält „ab“}'],
    ], { widthsCm: [3.4, 7.0, 7.0], size: 19, firstColBold: true }),
    D.h2('5  Abi-Check: Automaten analysieren'),
    D.table([
      ['Operator', 'So gehst du vor'],
      ['Stellen Sie die Verarbeitung … dar.', 'Zustandsfolge mit gelesenen Zeichen notieren (oder Tabelle); Ergebnis „akzeptiert/abgelehnt“ mit Begründung (End- oder kein Endzustand / Fehlerzustand).'],
      ['Erläutern Sie die Bedeutung des Zustands Si.', 'Sagen, was der Automat bisher gelesen hat, **wenn** er in Si ist – im Sachzusammenhang: „In S3 wurden bisher genau 30 ct eingeworfen.“ / „S2: Die letzten Zeichen waren L, O.“'],
      ['Untersuchen Sie, welche Eingaben akzeptiert werden.', 'Wege vom Start zu den Endzuständen verfolgen; Sprache in Worten beschreiben; mit Beispiel- und Gegenbeispielwörtern absichern.'],
      ['Ergänzen Sie die Beschriftungen.', 'Für jeden Zustand prüfen: Gibt es für jedes Zeichen genau einen Übergang? Fehlende Zeichen dorthin, wo die Bedeutung des Zustands es verlangt.'],
    ], { widthsCm: [5.4, 12.0], size: 19, firstColBold: true }),
    ...D.tip('Satzbausteine', [D.p('„Der Automat befindet sich genau dann in Si, wenn …“  ·  „Der Zustand Si steht dafür, dass bisher …“  ·  „Da Si kein Endzustand ist, wird die Eingabe abgelehnt.“', { size: 20 })]),
  ];
  const f = await D.save(D.doc({ kind: 'MB', niveau: 'alle', title: 'Deterministische endliche Automaten', subtitle: 'Merkblatt M01 · Level 1–2 · Aufbau, Darstellung, Analyse', metaText: 'M01  ·  Welt A', code: 'M01 · Merkblatt DEA', body }), OUT + 'M01_Merkblatt_DEA.docx');
  console.log(f);
})();
