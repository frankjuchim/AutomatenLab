const __MAT = require('path').resolve(__dirname, '../..'); // Wurzel: materials/
// M04 – Merkblatt „Mealy-Automaten“ (Level 6)
const D = require((__MAT + '/lib/docstyle.js'));
const { side } = require((__MAT + '/content/ds05/local.js'));
const DATA = require((__MAT + '/content/ds06/ds06_data.json'));
const IMG = (__MAT + '/build/img/ds06/');
const OUT = (__MAT + '/out/');
const K = DATA.kart;

(async () => {
  const body = [
    D.h2('1  Aufbau und Notation'),
    ...D.table([
      ['Bestandteil', 'Bedeutung', 'im Zustandsgraphen'],
      ['Eingabealphabet Σ', 'Zeichen, die gelesen werden', 'vor dem Schrägstrich'],
      ['Ausgabealphabet Ω', 'Zeichen, aus denen die Ausgaben bestehen', 'hinter dem Schrägstrich'],
      ['Zustände, Startzustand', 'endlich viele; „Gedächtnis“; Start in S0', 'Kreise, Pfeil „Start“'],
      ['Übergang e / a', 'liest e, gibt das Wort a über Ω aus, wechselt den Zustand', 'Pfeil, z. B. 2 / K1'],
      ['leere Ausgabe', 'keine Ausgabe bei diesem Übergang', 'ε, z. B. 1 / ε'],
      ['Endzustände', 'gibt es **nicht** – das Ergebnis ist das Ausgabewort', '–'],
    ], { widthsCm: [4.0, 7.6, 5.8], size: 19, firstColBold: true }),
    D.p('Mealy-Automaten werden mit Σ, Ω und **vollständigem** Übergangsgraphen angegeben: Jeder Zustand hat für jedes Eingabezeichen genau einen Übergang.', { size: 20 }),
    D.h2('2  Beispiel: Kartoffelautomat'),
    ...side([...D.img(IMG + 'kartoffel.png', { widthCm: 9.6, caption: 'Preis 4 €; Σ = {1, 2}, Ω = {1, K}' })], [
      D.p('**Verarbeitung darstellen:**', { size: 20 }),
      D.p(`\`212\`: ${K['212'].steps}`, { size: 19 }),
      D.p(`Ausgabe: **${K['212'].out}** (Sack + 1 € Rückgeld)`, { size: 19 }),
      D.p('**Bedeutung der Zustände:** S0 … S3 = bisher bezahlter Betrag 0 € … 3 €.', { size: 19 }),
    ], [10.0, 7.4]),
    D.h2('3  DEA und Mealy-Automat im Vergleich'),
    ...D.table([
      ['Merkmal', 'DEA', 'Mealy-Automat'],
      ['Aufgabe', 'Eingaben prüfen (Akzeptor)', 'Eingaben übersetzen / steuern'],
      ['Kantenbeschriftung', 'Eingabezeichen', 'Eingabe / Ausgabe'],
      ['Ergebnis', 'akzeptiert / abgelehnt nach dem letzten Zeichen', 'Ausgabewort, entsteht Schritt für Schritt'],
      ['Endzustände', 'ja', 'nein'],
      ['Vollständigkeit', 'Fehlerzustand darf mit Hinweis fehlen', 'vollständiger Übergangsgraph'],
    ], { widthsCm: [4.0, 6.7, 6.7], size: 19, firstColBold: true }),
    D.p('**Gemeinsamkeiten:** endlich viele Zustände, ein Startzustand, deterministisch (pro Zustand und Zeichen genau ein Übergang), kein Speicher außer dem Zustand – daher dieselben Grenzen (z. B. kein unbeschränktes Zählen, Level 7).', { size: 20 }),
    D.pageBreak(),
    D.h2('4  Mealy-Automaten entwickeln'),
    ...D.numbered([
      '**Erinnerungen sammeln:** Was muss sich der Automat merken, um später richtig auszugeben? (bezahlter Betrag, erste Ziffer, bisherige Bits …) → Zustände.',
      '**Übergänge:** Für jeden Zustand und jedes Eingabezeichen Folgezustand **und** Ausgabe festlegen (ggf. ε).',
      '**Ausgabe so früh wie möglich:** Was schon feststeht, kann sofort ausgegeben werden – das spart oft Zustände.',
      '**Testen:** Ausgaben für Beispiel- und Grenzfälle (kurze Eingaben, Wiederholungen, Abschlusszeichen) bestimmen.',
    ], { size: 20 }),
    ...side([...D.img(IMG + 'palindrom.png', { widthCm: 7.0, caption: '3 Bit → 5-stelliges Palindrom' })], [
      D.p('**Beispiel Palindrom-Generator:** Die ersten beiden Bits werden sofort ausgegeben, aber gemerkt (S1–S6). Beim dritten Bit c folgt die Ausgabe c, zweites Bit, erstes Bit – zurück nach S0.', { size: 19 }),
      D.p(`\`011\` → \`${DATA.pal.ex['011']}\`,  \`110\` → \`${DATA.pal.ex['110']}\``, { size: 19 }),
      D.p('Zustände: 1 + 2 + 4 = 7 (nach 0, 1, 2 Bits alle Möglichkeiten merken).', { size: 19 }),
    ], [7.6, 9.8]),
    D.h2('5  Abi-Check: Operatoren und Antwortmuster'),
    ...D.table([
      ['Aufgabenstellung', 'So gehst du vor'],
      ['Geben Sie die Ausgabe für … an.', 'Zustandsfolge mit „e / a“ verfolgen, Teilausgaben aneinanderhängen (ε weglassen).'],
      ['Erläutern Sie die Bedeutung von Zustand Si / der Ausgabe …', 'Was ist bisher passiert, wenn der Automat in Si ist? Welche Situation führt zu dieser Ausgabe? – immer im Sachzusammenhang.'],
      ['Erläutern Sie den Fehler … Verändern Sie den Automaten …', 'Falsche Ausgabe mit korrekter vergleichen, verantwortliche Kante(n) benennen, Kantenbeschriftung bzw. Folgezustand korrigieren.'],
      ['Beschreiben Sie Gemeinsamkeiten und Unterschiede zum DEA.', 'Tabelle aus Abschnitt 3: Alphabete, Kanten, Endzustände, Ergebnis; Gemeinsamkeiten nicht vergessen.'],
      ['Untersuchen Sie, wie viele Zustände mindestens nötig sind.', 'Zeigen, was sich der Automat merken muss (z. B. alle k bisher gelesenen Bits ⇒ 2^k^ Möglichkeiten) und die Anzahlen addieren.'],
    ], { widthsCm: [6.2, 11.2], size: 19, firstColBold: true }),
    ...D.warn({ titel: 'Typische Fehler', fallen: ['P5', 'P1'] }, [D.p('Endzustände (Doppelkreise) einzeichnen · fehlende Übergänge (nicht vollständig) · „N“ oder „–“ statt **ε** für keine Ausgabe · Ausgabe an den Zustand statt an die Kante schreiben.', { size: 20 })]),
  ];
  const f = await D.save(D.doc({ kind: 'MB', niveau: 'alle', title: 'Mealy-Automaten', subtitle: 'Merkblatt M04 · Level 6 · Notation, Vergleich mit DEA, Entwickeln', metaText: 'M04  ·  Welt A', code: 'M04 · Merkblatt Mealy-Automaten', body }), OUT + 'M04_Merkblatt_Mealy-Automaten.docx');
  console.log(f);
})();
