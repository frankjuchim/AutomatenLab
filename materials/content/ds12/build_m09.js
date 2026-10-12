const __MAT = require('path').resolve(__dirname, '../..'); // Wurzel: materials/
// M09 – Merkblatt „Reguläre Grammatik ↔ Automat“ (Level 12)
const D = require((__MAT + '/lib/docstyle.js'));
const W = require((__MAT + '/content/ds11/wc.js'));
const IMG = (__MAT + '/build/img/ds12/');
const OUT = (__MAT + '/out/');
const J = W.load(12);
const FEHLER = 'Alle nicht eingezeichneten Übergänge führen in einen Fehlerzustand.';

(async () => {
  const body = [
    D.h2('1  Rechtsreguläre Grammatik'),
    D.p('Eine Grammatik ist **rechtsregulär** (im Abitur: *regulär*), wenn **jede** Regel eine der Formen **A → aB**, **A → a** oder **A → ε** hat (a Terminalsymbol, B Nichtterminal).', { size: 21 }),
    D.table([
      ['Regel', 'rechtsregulär?', 'Grund'],
      ['S → aS  |  bA  |  ε', 'ja', 'genau ein Terminal, ggf. gefolgt von genau einem Nichtterminal – oder ε'],
      ['S → aSb', 'nein', 'Nichtterminal in der Mitte (Terminal rechts davon)'],
      ['S → Sa', 'nein', 'Nichtterminal links vom Terminal (linksregulär)'],
      ['A → +xA', 'nein', 'zwei Terminale vor dem Nichtterminal'],
      ['A → BC', 'nein', 'zwei Nichtterminale'],
    ], { widthsCm: [4.4, 3.0, 10.0], size: 19, center: [1] }),
    D.h2('2  Übersetzungsrezept: vom DEA zur Grammatik'),
    W.side([
      ...D.numbered([
        'Jeder Zustand wird ein **Nichtterminal** (gleicher Name), der Startzustand das **Startsymbol**.',
        'Jeder Übergang Si –a→ Sj wird die Regel **Si → aSj**.',
        'Jeder Endzustand Si bekommt zusätzlich **Si → ε**.',
        'Der **Fehlerzustand** entfällt (keine Regeln).',
        'N, T (= Σ), Startsymbol und Produktionsregeln angeben.',
      ], { size: 20 }),
    ], [...D.img(IMG + 'duell.png', { widthCm: 6.8, caption: 'Σ = {a, b}. ' + FEHLER }), ...W.gram(J.duell_rules, { size: 20, widthCm: 6.8 })], 10.2),
    D.p('**Ableitung = Lauf:** S0 ⇒ aS1 ⇒ abS2 ⇒ abaS1 ⇒ ababS2 ⇒ abab entspricht S0 –a→ S1 –b→ S2 –a→ S1 –b→ S2. Das Nichtterminal am Ende jeder Satzform ist der aktuelle Zustand.', { size: 20 }),
    D.h2('3  Rückweg: von der Grammatik über den NEA zum DEA'),
    ...D.numbered([
      'Jedes Nichtterminal wird ein **Zustand**, das Startsymbol der **Startzustand**.',
      '**A → aB** wird der Übergang A –a→ B;  **A → ε** macht A zum **Endzustand**.',
      '**A → a** wird ein Übergang A –a→ Z in einen **neuen Endzustand** Z (ohne ausgehende Übergänge).',
      'Gibt es aus einem Zustand zwei Übergänge mit demselben Zeichen, ist das Ergebnis ein **NEA** → mit der **Teilmengenkonstruktion** in einen DEA umwandeln.',
    ], { size: 20, ref: 'numbers2' }),
    W.side([...W.gram(W.abi(['S', 'A'], ['a', 'b'], 'S', J.ge_rules), { widthCm: 5.4 }), D.p('alle Wörter, die auf ab enden', { size: 18, color: D.C.muted, align: 'center' })],
      [...D.img(IMG + 'endet_ab_nea.png', { widthCm: 7.0, caption: 'NEA nach Rezept (aus S zwei a-Übergänge)' }), ...D.img(IMG + 'endet_ab_dea.png', { widthCm: 8.4, caption: 'DEA: S0 = {S}, S1 = {S, A}, S2 = {S, Z}' })], 5.8),
    D.h2('4  Grammatik nicht regulär – Sprache regulär?'),
    ...D.bullets([
      '**„Die Grammatik ist nicht regulär“**: Eine *bestimmte* Grammatik verletzt die Regelform (Regel nennen!).',
      '**„Die Sprache ist regulär“**: Es gibt *irgendeine* reguläre Grammatik bzw. einen DEA für sie → angeben.',
      'Beispiel: A → +xA | +yA | ε ist nicht regulär, aber mit A → +B | ε, B → xA | yA entsteht eine reguläre Grammatik derselben Sprache.',
      '**Sprache nicht regulär** (z. B. {aⁿbⁿ | n ≥ 1}): *keine* reguläre Grammatik möglich – Begründung wie bei DEA (unbeschränkt zählen, Schubfachprinzip).',
    ], { size: 20 }),
    D.h2('5  Abi-Check'),
    D.table([
      ['Operator', 'So gehst du vor'],
      ['Entwickeln Sie eine reguläre Grammatik …', 'Erst überlegen, was man sich merken muss (wie Zustände) → Nichtterminale mit Bedeutung; dann Regeln der Form A → aB / a / ε. Mit Beispiel- und Gegenbeispielwort prüfen.'],
      ['Begründen Sie, dass die Grammatik regulär ist.', '„Alle Regeln haben die Form A → aB, A → a oder A → ε.“ – ggf. Regeln exemplarisch nennen.'],
      ['Begründen Sie, dass G nicht regulär, die Sprache aber regulär ist.', 'Regel nennen, die die Form verletzt, **und** eine reguläre Grammatik (oder einen DEA) für dieselbe Sprache angeben.'],
      ['Entwickeln Sie einen DEA zur Grammatik.', 'Rezept anwenden; bei Nichtdeterminismus Teilmengenkonstruktion; Hinweis zum Fehlerzustand nicht vergessen.'],
      ['Erläutern Sie, wie sichergestellt wird, dass …', 'Bedeutung der Nichtterminale im Sachzusammenhang („In C sind noch 3 Schläge frei“) und welche Regeln fehlen bzw. vorhanden sind.'],
      ['Geben Sie eine Regel an, sodass keine reguläre Grammatik möglich ist.', 'Regel, die unbeschränktes Zählen oder Vergleichen verlangt („gleich viele … wie …“), kurz begründen.'],
    ], { widthsCm: [6.2, 11.2], size: 19, firstColBold: true }),
    ...D.warn('Typische Fehler', [
      ...D.bullets([
        'ε-Regeln für Endzustände vergessen; bei A → a den neuen Endzustand vergessen.',
        'S → Sa für regulär halten; Nichtdeterminismus nach der Übersetzung übersehen.',
      ], { size: 20 }),
    ]),
  ];
  const f = await D.save(D.doc({ kind: 'MB', niveau: 'eA', title: 'Reguläre Grammatik und Automat', subtitle: 'Merkblatt M09 · Level 12 · Übersetzungsrezept in beide Richtungen', metaText: 'M09  ·  Welt C', code: 'M09 · Merkblatt Reguläre Grammatik', body }), OUT + 'M09_Merkblatt_Regulaere-Grammatik.docx');
  console.log(f);
})();
