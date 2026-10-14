const __MAT = require('path').resolve(__dirname, '../..'); // Wurzel: materials/
// M07 – Merkblatt „Kellerautomaten“ (Level 9–10)
const D = require((__MAT + '/lib/docstyle.js'));
const K = require((__MAT + '/content/ds09/kt.js'));
const J = require((__MAT + '/content/ds09/ds09.json'));
const IMG = (__MAT + '/build/img/ds09/');
const OUT = (__MAT + '/out/');

(async () => {
  const body = [
    D.h2('1  Aufbau'),
    D.p('Ein Kellerautomat ist ein endlicher Automat (Zustände, Startzustand S0, Endzustände) mit einem zusätzlichen **Kellerspeicher**.', { size: 20 }),
    D.table([
      ['Bestandteil', 'Bedeutung'],
      ['Eingabealphabet Σ', 'Zeichen, die gelesen werden (ε gehört **nicht** dazu)'],
      ['Kelleralphabet Γ', 'Zeichen, die im Kellerspeicher liegen dürfen, z. B. Γ = {#, A}'],
      ['Vorbelegungszeichen #', 'liegt zu Beginn allein im Keller („Boden“)'],
      ['Kellerspeicher', 'Stapel (LIFO), unbegrenzt groß; nur das **oberste** Zeichen ist sichtbar'],
    ], { widthsCm: [6.0, 11.4], size: 19, firstColBold: true }),
    D.h2('2  Notation eines Übergangs'),
    D.p('Kante von Si nach Sj mit **(oberstes Kellerzeichen, Eingabezeichen) : abzulegende Zeichen**', { size: 21, align: 'center' }),
    ...D.bullets([
      'Der Übergang ist nur möglich, wenn das angegebene Zeichen **oben** liegt und das Eingabezeichen gelesen wird (bei **ε**: ohne zu lesen).',
      'Das oberste Kellerzeichen wird **entfernt**; dann wird die Ablage abgelegt – das **am weitesten rechts** notierte Zeichen **zuerst**. Danach liegt also das **linke** Zeichen oben.',
      'Belegungen werden mit dem obersten Zeichen **links** notiert.',
    ], { size: 20 }),
    D.table([
      ['Übergang', 'vorher', 'nachher', 'Wirkung'],
      ['(#, a) : A#', '#', 'A#', 'A auf # legen (push)'],
      ['(A, a) : AA', 'A#', 'AA#', 'ein weiteres A ablegen'],
      ['(A, b) : ε', 'AA#', 'A#', 'oberstes A entfernen (pop)'],
      ['(A, x) : A', 'A#', 'A#', 'Keller unverändert (nur lesen)'],
      ['(#, ε) : #', '#', '#', 'ohne Lesen prüfen, ob # oben liegt'],
    ], { widthsCm: [4.0, 3.0, 3.0, 7.4], size: 19, center: [0, 1, 2] }),
    ...D.merke('Akzeptanz (Ergänzende Hinweise 2025)', [D.p('Eine Eingabe wird **genau dann akzeptiert**, wenn es **eine Möglichkeit** gibt, dass sich der Automat nach **vollständiger Verarbeitung** der Eingabe in einem **Endzustand** befindet. Der Kellerinhalt spielt dabei keine Rolle. Fehlt ein passender Übergang, endet dieser Lauf im Fehlerzustand.', { size: 20 })]),
    D.h2('3  Beispiel: L = {aⁿbⁿ | n ≥ 1}'),
    D.img(IMG + 'anbn.png', { widthCm: 12, caption: 'Σ = {a, b}, Γ = {#, A}. Alle nicht eingezeichneten Übergänge führen in einen Fehlerzustand.' }),
    D.p('**Verarbeitung dokumentieren** (Abi-Format, erste Zeile S0 | # | – | –, dann eine Zeile pro Übergang):', { size: 20, keepNext: true }),
    ...K.solved(J.anbn.aabb, { size: 18 }),
    D.h2('4  Bedeutung des Kellers im Sachzusammenhang'),
    ...D.bullets([
      'Sagen, **was ein Kellerzeichen bedeutet**: „Jedes A steht für ein a, zu dem noch kein b gelesen wurde.“ / „Jedes K steht für eine noch offene Klammer.“',
      'Sagen, **was die Anzahl** bedeutet und **welche Übergänge** sie verändern: „Die Anzahl der A ist die Quersumme der ersten Ziffernfolge; jedes Zeichen der zweiten Folge entfernt ein A.“',
      'Sagen, **woran die Entscheidung hängt**: „Liegt am Ende # oben, waren es gleich viele; nur dann führt (#, ε) : # in den Endzustand.“',
    ], { size: 20 }),
    D.h2('5  Abi-Check'),
    D.table([
      ['Operator / Aufgabe', 'So gehst du vor'],
      ['Dokumentieren Sie die Verarbeitung der Eingabe … (Tabelle).', 'Zeile für Zeile: neuer Zustand, neue Belegung (oben links), gelesenes oberstes Kellersymbol, Eingabezeichen bzw. ε. Am Ende „akzeptiert: ja/nein“ ankreuzen; bei NKA genügt **ein** akzeptierender Lauf.'],
      ['Erläutern Sie die Bedeutung des Kellerspeichers im Sachzusammenhang.', 'Kellerzeichen ↔ Bedeutung im Kontext, Anzahl, Ablegen/Entfernen, Abschlussprüfung (siehe 4).'],
      ['Bestimmen Sie das Eingabewort zu der Folge von Zuständen und Kellerbelegungen.', 'Rückwärts denken: Von Zeile zu Zeile vergleichen, welches Zeichen entfernt/abgelegt wurde, und den passenden Übergang im Graphen suchen. Unveränderte Belegung ⇒ Übergang wie (A, x) : A oder ε-Übergang.'],
      ['Begründen Sie die Verwendung eines Kellerautomaten.', 'Grenze des DEA (unbeschränktes Zählen/Vergleichen, Schubfach) + was der Keller speichert.'],
      ['Entwickeln Sie einen Kellerautomaten …', 'Idee „Was lege ich ab, was entferne ich?“ – Γ angeben – Graph – mit kurzen Wörtern, ε und Grenzfällen testen.'],
    ], { widthsCm: [6.2, 11.2], size: 19, firstColBold: true }),
    ...D.warn({ titel: 'Typische Fehler', fallen: ['P7', 'P2'] }, [...D.bullets([
      'Ablage falsch herum: Bei (A, a) : BA liegt **B** oben.',
      '„Akzeptiert, weil der Keller leer ist“ – falsch: Es zählt nur der **Endzustand** nach vollständiger Eingabe.',
      'Das gelesene Kellerzeichen vergessen zu entfernen: (A, a) : A lässt den Keller **unverändert**.',
    ], { size: 20 })]),
  ];
  const f = await D.save(D.doc({ kind: 'MB', niveau: 'eA', title: 'Kellerautomaten', subtitle: 'Merkblatt M07 · Level 9–10 · Notation, Tabelle, Akzeptanz', metaText: 'M07  ·  Welt B', code: 'M07 · Merkblatt Kellerautomaten', body }), OUT + 'M07_Merkblatt_Kellerautomaten.docx');
  console.log(f);
})();
