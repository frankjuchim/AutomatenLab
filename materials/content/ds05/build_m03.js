const __MAT = require('path').resolve(__dirname, '../..'); // Wurzel: materials/
// M03 – Merkblatt „Minimierung & Zustandsanzahl begründen“ (Level 5)
const D = require((__MAT + '/lib/docstyle.js'));
const { side } = require((__MAT + '/content/ds05/local.js'));
const DATA = require((__MAT + '/content/ds05/ds05_data.json'));
const IMG = (__MAT + '/build/img/ds05/');
const OUT = (__MAT + '/out/');
const SM = DATA.smiley;
const pairs = (lst) => lst.map((p) => `(${p[0]}, ${p[1]})`).join(', ');

(async () => {
  const body = [
    D.h2('1  Unterscheidbar oder äquivalent?'),
    ...D.table([
      ['Begriff', 'Bedeutung'],
      ['unterscheidbar', 'Es gibt ein Wort w, das von p aus in einen Endzustand führt, von q aus aber nicht (oder umgekehrt).'],
      ['unterscheidendes Wort', 'ein solches Wort w; für End- und Nicht-Endzustand genügt ε'],
      ['äquivalent', 'kein Wort unterscheidet p und q: Der Automat verhält sich ab p und ab q immer gleich ⇒ zusammenfassen'],
      ['minimaler DEA', 'kein Automat mit weniger Zuständen akzeptiert dieselbe Sprache; er enthält keine zwei äquivalenten Zustände'],
    ], { widthsCm: [4.2, 13.2], size: 19, firstColBold: true }),
    D.p('Achtung: Äquivalente Zustände müssen **nicht** in dieselben Zustände führen – entscheidend ist nur, ob jedes Wort von beiden aus gleich behandelt wird (akzeptiert/abgelehnt).', { size: 20 }),
    D.h2('2  Markierungsverfahren (Dreieckstabelle)'),
    ...side([
      ...D.numbered([
        '**Vorbereiten:** Automat vollständig machen (ggf. Fehlerzustand ergänzen). Dreieckstabelle mit allen Zustandspaaren anlegen.',
        '**Runde 0:** Alle Paare aus einem End- und einem Nicht-Endzustand markieren (X~0~).',
        '**Runde 1, 2, …:** Für jedes freie Paar (p, q) und jedes Zeichen a die Folgepaare bestimmen. Ist (δ(p, a), δ(q, a)) bereits markiert, wird (p, q) markiert (X mit Rundennummer).',
        '**Wiederholen**, bis in einer Runde nichts Neues markiert wird.',
        '**Zusammenfassen:** Alle freien Paare sind äquivalent. Zustände verschmelzen, Pfeile umlenken.',
      ], { size: 20 }),
    ], [
      ...D.img(IMG + 'smiley_runde3.png', { widthCm: 5.2, caption: 'Smiley-Erkenner :-) / :) (Team A)' }),
    ], [11.6, 5.8]),
    D.p(`**Beispiel Smiley-Erkenner:** Runde 0: ${SM.rounds[0].length} Paare · Runde 1: ${pairs(SM.rounds[1])} · Runde 2: ${pairs(SM.rounds[2])} · frei bleibt (S3, S4) ⇒ S3 und S4 zusammenfassen: 6 → 5 Zustände.`, { size: 19 }),
    ...D.tip('Warum funktioniert das?', [D.p('Jede Markierung liefert ein unterscheidendes Wort: Zeichen a, gefolgt vom Wort des Folgepaares. Beispiel (S1, S2): mit „-“ nach (S2, F_err), dieses mit „)“ ⇒ Wort `-)`. Was nie markiert wird, kann kein Wort unterscheiden.', { size: 20 })]),
    D.h2('3  Mindestzahl von Zuständen begründen'),
    ...D.bullets([
      'Ein konkreter Automat mit n Zuständen zeigt nur: **höchstens** n Zustände sind nötig.',
      '**Mindestens** n: Gib n Eingaben (Präfixe) an, die **paarweise unterscheidbar** sind, und nenne für jedes Paar ein unterscheidendes Wort. Nach diesen Eingaben muss sich jeder Automat in n verschiedenen Zuständen befinden.',
    ], { size: 20 }),
    D.p('**Beispiel:** „genau drei a“ über {a, b}: ε, a, aa, aaa, aaaa sind paarweise unterscheidbar (z. B. a/aa durch `a`, aaa/aaaa durch ε, ε/aaaa durch `aaa`) ⇒ mindestens 5 Zustände (mit Fehlerzustand).', { size: 20 }),
    D.h2('4  Abi-Check: Operatoren und Antwortmuster'),
    ...D.table([
      ['Aufgabenstellung', 'So gehst du vor'],
      ['Begründen Sie, dass sich der Automat nach den Eingaben u und v in verschiedenen Zuständen befinden muss.', 'Ein Wort w angeben, sodass uw akzeptiert und vw abgelehnt wird (beide Verarbeitungen im Sachzusammenhang kurz begründen). Schluss: „Wäre der Automat in demselben Zustand, müsste er beide Eingaben gleich behandeln.“'],
      ['… allerdings nicht nach x und y.', 'Zeigen, dass jede Fortsetzung gleich behandelt wird: Die für die Entscheidung relevante Information (z. B. letzte Ergebnisse) ist nach x und y gleich.'],
      ['Untersuchen Sie, inwieweit Zustände zusammengefasst werden können.', 'Äquivalente Zustände nennen und begründen (gleiche Bedeutung für die weitere Entscheidung oder Markierungsverfahren); für nicht zusammenfassbare Paare je ein unterscheidendes Wort.'],
      ['Begründen Sie, dass mindestens n Zustände (bzw. n zusätzliche Zustände) nötig sind.', 'n paarweise unterscheidbare Präfixe angeben; je Paar ein unterscheidendes Wort.'],
    ], { widthsCm: [6.4, 11.0], size: 19, firstColBold: true }),
    D.h2('5  Vorher – nachher: „endet auf ab“'),
    ...side([...D.img(IMG + 'endet_ab.png', { widthCm: 7.4, caption: 'Entwurf: 5 Zustände' })], [...D.img(IMG + 'endet_ab_min.png', { widthCm: 7.4, caption: 'Minimal: S1, S3, S4 zusammengefasst (Bedeutung: „zuletzt ein a“)' })], [8.7, 8.7]),
    ...D.warn('Typischer Fehler', [D.p('„S3 und S4 sind verschieden, weil sie verschiedene Namen haben / in verschiedene Zustände führen“ – das ist **keine** Begründung. Unterscheidbarkeit wird immer mit einem **konkreten Wort** gezeigt, Äquivalenz mit dem Verhalten für **alle** Wörter.', { size: 20 })]),
  ];
  const f = await D.save(D.doc({ kind: 'MB', niveau: 'plus', title: 'Minimierung & Zustandsanzahl begründen', subtitle: 'Merkblatt M03 · Level 5 · Unterscheidbarkeit, Markierungsverfahren, Mindestzahl', metaText: 'M03  ·  Welt A', code: 'M03 · Merkblatt Minimierung', body }), OUT + 'M03_Merkblatt_Minimierung.docx');
  console.log(f);
})();
