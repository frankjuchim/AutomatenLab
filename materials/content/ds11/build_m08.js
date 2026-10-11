const __MAT = require('path').resolve(__dirname, '../..'); // Wurzel: materials/
// M08 – Merkblatt „Grammatiken & Ableitungen“ (Level 11)
const D = require((__MAT + '/lib/docstyle.js'));
const W = require((__MAT + '/content/ds11/wc.js'));
const IMG = (__MAT + '/build/img/ds11/');
const OUT = (__MAT + '/out/');
const J = W.load(11);

(async () => {
  const body = [
    D.h2('1  Begriffe'),
    D.table([
      ['Begriff', 'Bedeutung', 'Beispiel: Glal-Sprache'],
      ['Terminalsymbole T (Alphabet)', 'endliche Menge der Zeichen, aus denen die Wörter der Sprache bestehen (Kleinbuchstaben, Ziffern, Sonderzeichen)', 'T = {la, le, lu}'],
      ['Nichtterminalsymbole N', 'Platzhalter, die bei der Ableitung ersetzt werden (Großbuchstaben oder Namen)', 'N = {S, A, B}'],
      ['Startsymbol', 'Nichtterminal, mit dem jede Ableitung beginnt', 'S'],
      ['Produktionsregeln P', 'A → w: A darf durch w ersetzt werden; Alternativen mit |; ε als rechte Seite erlaubt', 'A → laB | leB | luB'],
      ['Wort', 'endliche Folge von Terminalsymbolen (auch das leere Wort ε)', 'lelalu'],
      ['Sprache L(G)', 'Menge aller Wörter, die sich aus dem Startsymbol ableiten lassen', '9 Wörter aus 3 Silben, Ende lu'],
    ], { widthsCm: [4.0, 9.0, 4.4], size: 19, firstColBold: true }),
    D.h2('2  Grammatik angeben (Abitur-Format)'),
    W.side([...W.gram(W.abi(['S', 'A', 'B'], ['la', 'le', 'lu'], 'S', J.g2_rules), { widthCm: 8.2 }),
      D.p('Kurz: **G = (N, T, S, P)**. „Grammatik“ ohne Zusatz meint im Abitur eine kontextfreie Grammatik: links steht genau **ein** Nichtterminal.', { size: 20 })],
    [D.img(IMG + 'baum_glal.png', { widthCm: 3.0, caption: 'Ableitungsbaum zu lelalu' })], 9.2),
    D.h2('3  Ableitung und Ableitungsbaum'),
    D.table([['Satzform', 'angewandte Regel'], ...J.g2_rules_lelalu.map((r, i) => [(i ? '⇒ ' : '') + r[0], r[1] || '– fertig: nur Terminalsymbole –'])], { widthsCm: [5.0, 6.0], size: 19 }),
    ...D.bullets([
      'In jedem Schritt wird **ein** Nichtterminal durch die rechte Seite einer seiner Regeln ersetzt. Zwischen Satzformen steht **⇒**, in Regeln steht **→**.',
      'Die Ableitung endet, wenn **nur noch Terminalsymbole** übrig sind. Kurzform: S ⇒ leA ⇒ lelaB ⇒ lelalu.',
      'Im **Ableitungsbaum** steht das Startsymbol oben, jede Regelanwendung erzeugt die Kinder eines Knotens; die Blätter ergeben – von links nach rechts gelesen – das Wort.',
    ], { size: 21 }),
    D.h2('4  Die Sprache einer Grammatik beschreiben'),
    ...D.numbered([
      '**Ausprobieren:** die kürzesten Wörter ableiten (Welche Regel beendet die Ableitung?).',
      '**Rekursion finden:** Welche Regeln enthalten ihr eigenes Nichtterminal (S → aSa)? Sie können beliebig oft angewendet werden – so entstehen unendlich viele Wörter.',
      '**Bedeutung der Nichtterminale** formulieren: „In A ist schon eine Silbe erzeugt, B erzeugt die letzte Silbe.“',
      '**Beschreiben:** in Worten und, wo möglich, als Menge, z. B. L = {aⁿbaⁿ | n ≥ 0}.',
      '**Prüfen:** Beispiel- und Gegenbeispielwörter testen.',
    ], { size: 21 }),
    D.h2('5  Formale und natürliche Sprachen'),
    D.table([
      ['Aspekt', 'formale Sprache', 'natürliche Sprache'],
      ['Regeln', 'vollständig festgelegt, keine Ausnahmen', 'gewachsen, Ausnahmen, Sprachwandel'],
      ['Eindeutigkeit', 'eindeutig interpretierbar', 'oft mehrdeutig („Ich sah den Mann mit dem Fernglas.“)'],
      ['Bedeutung (Semantik)', 'exakt definiert', 'kontextabhängig (Ironie, Betonung)'],
      ['Wortschatz', 'festes, endliches Alphabet', 'offen, neue Wörter entstehen'],
    ], { widthsCm: [3.8, 6.4, 7.2], size: 19, firstColBold: true }),
    D.p('**Syntax** = Regeln für die Form, **Semantik** = Bedeutung. Grammatiken legen die Syntax fest: „Die Ziege liest Zeitung.“ ist syntaktisch korrekt, aber semantisch unsinnig.', { size: 21 }),
    D.h2('6  Abi-Check: Grammatiken'),
    D.table([
      ['Operator', 'So gehst du vor'],
      ['Zeigen Sie, dass w erzeugt wird. / Stellen Sie mithilfe der Produktionsregeln dar …', 'Vollständige Ableitung vom Startsymbol bis w, jeder Schritt mit ⇒; pro Schritt ein Nichtterminal ersetzen.'],
      ['Untersuchen Sie, ob w erzeugt werden kann.', 'Ja: Ableitung angeben. Nein: begründen, an welcher Stelle keine Regel passt („Die letzte Silbe entsteht nur durch B → lu, daher …“).'],
      ['Beschreiben Sie die Sprache / die Struktur.', 'Aufbau der Wörter in Worten (Anfang, Wiederholung, Ende, Anzahlen) oder als Menge; Bedeutung der Nichtterminale nennen.'],
      ['Verändern Sie die Grammatik so, dass …', 'Nur die nötigen Regeln ändern, Vorgaben beachten (z. B. Terminalalphabet unverändert); mit Beispiel und Gegenbeispiel prüfen.'],
      ['Vergleichen Sie formale und natürliche Sprachen.', 'Je Aspekt beide Seiten gegenüberstellen – mit Beispiel.'],
    ], { widthsCm: [6.2, 11.2], size: 19, firstColBold: true }),
    ...D.warn('Typische Fehler', [
      ...D.bullets([
        '→ und ⇒ verwechselt; mehrere Ersetzungen in einem Schritt; Ableitung endet mit Nichtterminalen („… Wasser Punkt“).',
        '„Nicht ableitbar“ ohne Begründung – im Abitur muss die Stelle benannt werden, an der keine Regel passt.',
      ], { size: 20 }),
    ]),
  ];
  const f = await D.save(D.doc({ kind: 'MB', title: 'Grammatiken & Ableitungen', subtitle: 'Merkblatt M08 · Level 11 · Begriffe, Notation, Ableitung', metaText: 'M08  ·  Welt C', code: 'M08 · Merkblatt Grammatiken', body }), OUT + 'M08_Merkblatt_Grammatiken.docx');
  console.log(f);
})();
