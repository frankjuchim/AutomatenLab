const __MAT = require('path').resolve(__dirname, '../..'); // Wurzel: materials/
// M02 – Merkblatt „DEA entwickeln – Bausteine & Vorgehen“ (Level 3–4). Grafiken aus automata_ds03.py (verifiziert).
const D = require((__MAT + '/lib/docstyle.js'));
const IMG = (__MAT + '/build/img/ds03/');
const OUT = (__MAT + '/out/');
const SOL = require('./solutions.json');

const baustein = (name, merkt, file, bsp, w = 6.6) => [
  D.p(`**${name}**`, { size: 21, color: D.C.teal, after: 20 }),
  D.p(`Merkt sich: ${merkt}`, { size: 18, color: D.C.muted, after: 0 }),
  ...D.img(IMG + file, { widthCm: w }),
  D.p(bsp, { size: 18, after: 0 }),
];

(async () => {
  const body = [
    D.h2('1  Vorgehen in 5 Schritten'),
    ...D.numbered([
      '**Erinnerungen sammeln:** Was muss der Automat über das bisher Gelesene wissen, um am Ende zu entscheiden? (So wenig wie möglich!)',
      '**Zustände festlegen:** Für jede mögliche Erinnerung ein Zustand – Bedeutung daneben notieren („S2: zuletzt ab gelesen“).',
      '**Übergänge eintragen:** Für **jeden** Zustand und **jedes** Zeichen aus Σ fragen: Welche Erinnerung gilt danach?',
      '**Start- und Endzustände:** Start = Erinnerung „noch nichts gelesen“; Endzustände = Erinnerungen, bei denen das Wort zur Sprache gehört.',
      '**Testen:** ε, einzelne Zeichen, Beispiel- und Gegenbeispielwörter, Wörter mit Überlappung (z. B. `ababa`).',
    ], { ref: 'numbers', size: 21 }),
    D.h2('2  Bausteine (Beispiele über Σ = {a, b})'),
    D.table([
      [baustein('Festes Präfix', 'wie viel vom Anfang passt', 'b_praefix.png', 'beginnt mit „ab“ · falscher Anfang → Fehlerzustand¹'),
        baustein('Teilwort enthalten', 'wie viel vom Muster gerade passt; gefunden bleibt gefunden', 'b_teilwort.png', 'enthält „ab“ · Endzustand mit Schleife')],
      [baustein('Endung', 'wie viel vom Muster am Ende passt', 'b_endung.png', 'endet auf „ab“ · kein Fehlerzustand, Rückkanten'),
        baustein('Zählen: genau n', 'Anzahl bis n', 'b_genau.png', 'genau zwei a · (n+1)-tes a → Fehlerzustand¹')],
      [baustein('Zählen: mindestens n', 'Anzahl bis n, danach „genug“', 'b_mindestens.png', 'mindestens zwei a · ab n Schleife im Endzustand'),
        baustein('Zählen modulo k', 'Rest der Anzahl bei Division durch k', 'b_modulo.png', 'Anzahl a durch 3 teilbar · Zustände im Kreis')],
      [baustein('Kombination (Produkt)', 'ein **Paar** von Erinnerungen', 'b_produkt.png', 'gerade Anzahl a UND endet auf b · S0 = (gerade, nein), S1 = (gerade, ja), S2 = (ungerade, nein), S3 = (ungerade, ja)', 4.6),
        baustein('Komplement', 'dasselbe wie das Original', 'b_komplement.png', 'enthält **nicht** „ab“ · aus „enthält ab“ durch Tauschen von End- und Nicht-Endzuständen')],
    ], { header: false, widthsCm: [8.7, 8.7] }),
    D.small('¹ Alle nicht eingezeichneten Übergänge führen in einen Fehlerzustand. – UND/ODER zweier Bedingungen: gleicher Produkt-Graph, nur die Endzustände ändern sich. Komplement nur bei **vollständigem** Automaten bilden (Fehlerzustand vorher einzeichnen – er wird zum Endzustand).'),
    D.h2('3  Abi-Check: Automaten entwickeln'),
    D.table([
      ['Operator', 'So gehst du vor'],
      ['Entwickeln / Entwerfen Sie einen (vollständigen) DEA …', 'Σ angeben, 5 Schritte. „Vollständig“: Fehlerzustand einzeichnen – weglassen nur, wenn erlaubt, und dann mit Hinweis.'],
      ['Ergänzen / Vervollständigen Sie die Beschriftungen …', 'Zuerst die Bedeutung jedes Zustands erschließen, dann pro Zustand jedes Zeichen zuordnen (genau ein Übergang je Zeichen).'],
      ['Verändern Sie den Automaten so, dass …', 'Braucht die neue Regel eine neue Erinnerung? Wenn nein: nur Übergänge/Endzustände ändern.'],
      ['Begründen Sie, dass sich der Automat nach x und y in verschiedenen Zuständen befinden muss.', 'Fortsetzung z angeben, sodass genau eines der Wörter xz, yz akzeptiert wird. Gleicher Zustand ⇒ gleiche Entscheidung – Widerspruch.'],
      ['Begründen Sie, dass mindestens n Zustände nötig sind.', 'n Wörter angeben, die paarweise durch eine Fortsetzung unterschieden werden (Vertiefung: Level 5).'],
    ], { widthsCm: [6.0, 11.4], size: 19, firstColBold: true }),
    ...D.tip('Antwortmuster „verschiedene Zustände“', [D.p('Sprache: alle Wörter über {a, b}, die auf „aba“ enden; x = ab, y = b. Mit der Fortsetzung z = a ist xz = aba ∈ L, aber yz = ba ∉ L. Befände sich der Automat nach „ab“ und nach „b“ im selben Zustand, müsste er nach dem Lesen von a in beiden Fällen gleich entscheiden – Widerspruch. Also muss er nach „ab“ und „b“ in verschiedenen Zuständen sein.', { size: 20 })]),
    ...D.warn({ titel: 'Typische Fehler', fallen: ['P3', 'P1'] }, [...D.bullets([
      '**Neuanfang vergessen:** Bei „enthält“/„endet auf“ führt ein unpassendes Zeichen nicht automatisch nach S0 – es kann schon der Anfang eines neuen Treffers sein (Test: `ababa` für „endet auf aba“).',
      '**Unvollständig:** Ein Zustand hat für ein Zeichen keinen Übergang – und es fehlt der Hinweis zum Fehlerzustand.',
      '**Nicht deterministisch:** Zwei Pfeile mit demselben Zeichen aus einem Zustand.',
      '**ε nicht bedacht:** S0 ist Endzustand ⇔ ε wird akzeptiert.',
    ], { size: 20 })]),
  ];
  const f = await D.save(D.doc({ kind: 'MB', niveau: 'alle', title: 'DEA entwickeln – Bausteine & Vorgehen', subtitle: 'Merkblatt M02 · Level 3–4 · Konstruktion, Testen, Abi-Check', metaText: 'M02  ·  Welt A', code: 'M02 · Merkblatt DEA entwickeln', body }), OUT + 'M02_Merkblatt_DEA-entwickeln.docx');
  console.log(f);
})();
