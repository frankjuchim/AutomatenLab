const __MAT = require('path').resolve(__dirname, '../..'); // Wurzel: materials/
// M05 – Merkblatt „Grenzen endlicher Automaten – so begründest du“ (Level 7)
const D = require((__MAT + '/lib/docstyle.js'));
const IMG = (__MAT + '/build/img/ds07/');
const OUT = (__MAT + '/out/');

(async () => {
  const body = [
    D.h2('1  Was ein DEA kann – und was nicht'),
    D.p('Ein DEA hat **endlich viele Zustände**. Jeder Zustand ist eine „Erinnerung“ an das bisher Gelesene. Deshalb kann ein DEA nur **endlich viele Situationen** unterscheiden.', { size: 21 }),
    D.table([
      ['DEA möglich (beschränkt)', 'Kein DEA (unbeschränkt)'],
      ['Zählen bis zu einer festen Grenze (Club mit 3 Plätzen, Klammertiefe ≤ 3)', 'Zählen ohne Grenze (Club ohne Kapazitätsgrenze, Klammern beliebiger Tiefe)'],
      ['Zählen modulo k (Anzahl a gerade, Quersumme durch 3 teilbar)', 'Zwei Anzahlen vergleichen: a^n^b^n^, gleich viele O wie X'],
      ['endliche Sprachen (z. B. a^n^b^n^ mit n ≤ 3)', 'ganze erste Hälfte merken: Palindrome, w c w^R^'],
    ], { widthsCm: [8.7, 8.7], size: 19 }),
    D.h2('2  Das Schubfach-Argument in 5 Schritten'),
    D.table([
      ['Schritt', 'Was du tust', 'Beispiel L = {a^n^b^n^ | n ≥ 1}'],
      ['1  Annahme', 'Nimm an, es gibt einen DEA mit k Zuständen für L.', 'DEA A mit k Zuständen erkennt L.'],
      ['2  Präfixe', 'Wähle k + 1 Präfixe, die der Automat unterscheiden **müsste**.', 'a, a^2^, …, a^k+1^'],
      ['3  Schubfach', 'k + 1 Präfixe, k Zustände ⇒ zwei Präfixe enden im selben Zustand.', 'a^i^ und a^j^ (i < j) enden in Zustand S.'],
      ['4  Fortsetzung', 'Hänge an **beide** dieselbe Fortsetzung an. Deterministisch ⇒ wieder gleicher Zustand.', 'a^i^b^i^ und a^j^b^i^ enden im selben Zustand.'],
      ['5  Widerspruch', 'Ein Wort liegt in L, das andere nicht – der Zustand müsste End- **und** Nicht-Endzustand sein.', 'a^i^b^i^ ∈ L, a^j^b^i^ ∉ L – also kein DEA für L.'],
    ], { widthsCm: [2.9, 7.6, 6.9], size: 19, firstColBold: true }),
    ...D.merke('Musterformulierung (Abi-Langform)', [
      D.p('„Angenommen, ein DEA mit k Zuständen erkennt L. Nach dem Lesen der k + 1 Wörter a, a^2^, …, a^k+1^ befindet er sich nach dem Schubfachprinzip bei zwei verschiedenen Wörtern a^i^ und a^j^ (i < j) im selben Zustand. Da der Automat deterministisch ist, befindet er sich auch nach a^i^b^i^ und a^j^b^i^ im selben Zustand und akzeptiert entweder beide Wörter oder keines. Es gilt aber a^i^b^i^ ∈ L und a^j^b^i^ ∉ L. Widerspruch – es gibt keinen DEA, der L erkennt.“', { size: 20 }),
    ]),
    ...D.tip('Abi-Kurzform (häufig 3 BE: „Entscheiden Sie begründet …“)', [
      D.p('„Ein endlicher Automat hat nur endlich viele Zustände und kann sich daher nur **endlich viele** verschiedene Werte merken. Zur Prüfung müsste er sich hier aber **die Anzahl der O gegenüber den X** merken, die **beliebig groß** werden kann. Daher ist kein endlicher Automat möglich; ein Kellerautomat kann diese Anzahl im Keller speichern.“  – immer den **Sachzusammenhang** nennen: Was müsste gezählt werden, und warum ist es unbeschränkt?', { size: 20 }),
    ]),
    D.h2('3  Präfixe und Fortsetzungen – Spickzettel'),
    D.table([
      ['Sprache', 'Präfixe (i = 1 … k + 1)', 'Fortsetzung', 'in L', 'nicht in L'],
      ['a^n^b^n^ (n ≥ 1)', 'a^i^', 'b^i^', 'a^i^b^i^', 'a^j^b^i^'],
      ['gleich viele a wie b', 'a^i^', 'b^i^', 'a^i^b^i^', 'a^j^b^i^'],
      ['korrekte Klammerausdrücke', '(^i^', ')^i^', '(^i^)^i^', '(^j^)^i^'],
      ['Palindrome über {a, b}', 'a^i^b', 'a^i^', 'a^i^ba^i^', 'a^j^ba^i^'],
      ['Quersumme 1. Folge = Länge 2. Folge', '1^i^', '-1^i^', '1^i^-1^i^', '1^j^-1^i^'],
    ], { widthsCm: [5.0, 3.3, 2.6, 3.2, 3.3], size: 19, center: [1, 2, 3, 4] }),
    D.img(IMG + 'schubfach.png', { widthCm: 5.0, caption: 'k + 1 Präfixe, k Zustände: Zwei Präfixe müssen sich einen Zustand teilen.' }),
    D.h2('4  Abi-Check'),
    D.table([
      ['Operator / Aufgabe', 'So gehst du vor'],
      ['Begründen Sie, dass kein endlicher Automat L erkennen kann.', 'Schubfach-Argument (Langform) oder – bei wenigen BE – Kurzform mit Sachbezug: Was muss unbeschränkt gezählt bzw. verglichen werden?'],
      ['Entscheiden Sie begründet, ob man die Eigenschaft auch mit einem endlichen Automaten überprüfen könnte.', 'Erst prüfen: endlich? modulo? Obergrenze? ⇒ Dann DEA-Idee angeben (Was merkt er sich?). Sonst: kein DEA + Begründung.'],
      ['Begründen Sie die Verwendung eines Kellerautomaten.', 'Grenze des DEA nennen (unbeschränktes Zählen) **und** sagen, was der Keller speichert (z. B. „ein A je Einheit der Quersumme“).'],
      ['Analysieren Sie, wie die Anzahl der Zustände von p abhängt.', 'Bedeutung der Zustände angeben (z. B. „bisher bezahlter Betrag 0 … p − 1“) ⇒ Formel (p Zustände) ⇒ für unbeschränktes p kein endlicher Automat.'],
    ], { widthsCm: [6.6, 10.8], size: 19, firstColBold: true }),
    ...D.warn({ titel: 'Typischer Fehler', fallen: ['P6'] }, [
      D.p('„Mein DEA erkennt aaabbb nicht, also geht es nicht.“ – Ein **Beispiel** zeigt nur, dass **ein** Automat falsch ist. Die Begründung muss für **jeden** DEA gelten (beliebiges k). Und: Die Fortsetzung muss an **beide** Präfixe dieselbe sein.', { size: 20 }),
    ]),
  ];
  const f = await D.save(D.doc({ kind: 'MB', niveau: 'alle', title: 'Grenzen endlicher Automaten', subtitle: 'Merkblatt M05 · Level 7 · So begründest du', metaText: 'M05  ·  Welt B', code: 'M05 · Merkblatt Grenzen endlicher Automaten', body }), OUT + 'M05_Merkblatt_Grenzen-endlicher-Automaten.docx');
  console.log(f);
})();
