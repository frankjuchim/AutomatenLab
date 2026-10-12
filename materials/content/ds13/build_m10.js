const __MAT = require('path').resolve(__dirname, '../..'); // Wurzel: materials/
// M10 – Merkblatt „Kontextfreie Grammatiken & Chomsky-Hierarchie“ (Level 13–14)
const D = require((__MAT + '/lib/docstyle.js'));
const W = require((__MAT + '/content/ds11/wc.js'));
const IMG = (__MAT + '/build/img/ds13/');
const IMG14 = (__MAT + '/build/img/ds14/');
const OUT = (__MAT + '/out/');
const J = W.load(13);

(async () => {
  const body = [
    D.h2('1  Kontextfreie Grammatik'),
    D.p('Jede Regel hat die Form **A → w**: links **genau ein** Nichtterminal, rechts eine beliebige Folge aus Terminalen und Nichtterminalen (auch ε). „Grammatik“ ohne Zusatz meint im Abitur eine kontextfreie Grammatik; rechtsreguläre Grammatiken sind ein Spezialfall.', { size: 21 }),
    D.table([
      ['Muster', 'Regel(n)', 'erzeugt'],
      ['Paare von außen nach innen', 'S → aSb | ab', 'aⁿbⁿ (n ≥ 1)'],
      ['Spiegel', 'S → 0S0 | 1S1 | 0 | 1 | ε', 'Palindrome über {0, 1}'],
      ['Verschachteln + Aneinanderreihen', 'S → (S)S | ε', 'korrekte Klammerausdrücke'],
      ['Wiederholung / Verkettung', 'A → xA | ε  ·  S → AB', 'beliebig viele x · erst A-, dann B-Teil'],
      ['Block enthält wieder alles', 'K → (∗ S ∗)', 'beliebig tief verschachtelte Kommentare'],
    ], { widthsCm: [5.0, 5.6, 6.8], size: 19 }),
    D.h2('2  Ableitungsbaum und Mehrdeutigkeit'),
    D.p('Eine Grammatik ist **mehrdeutig**, wenn es ein Wort mit **zwei verschiedenen Ableitungsbäumen** (gleichwertig: zwei verschiedenen Linksableitungen) gibt. Beispiel E → E+E | E∗E | (E) | a mit dem Wort a+a∗a:', { size: 21 }),
    W.side([...D.img(IMG + 'term_mehrdeutig_1.png', { widthCm: 4.4, caption: 'a+(a∗a)' })], [...D.img(IMG + 'term_mehrdeutig_2.png', { widthCm: 4.4, caption: '(a+a)∗a' })], 8.7),
    ...D.bullets([
      '**Auflösen** durch zusätzliche Nichtterminale, die eine Struktur erzwingen (Punkt vor Strich: E → E+T | T,  T → T∗F | F,  F → (E) | a) oder durch **Endmarken** (wenn … dann … sonst … ende).',
          ], { size: 20 }),
    D.h2('3  Kontextfreie Grammatik und Kellerautomat'),
    W.side([
      ...D.bullets([
        'Zu jeder kontextfreien Grammatik gibt es einen **Kellerautomaten** (NKA), der genau ihre Sprache akzeptiert – und umgekehrt.',
        'Der Keller übernimmt die Rolle der „offenen“ Regelteile: S → aSb – jedes a legt ein A ab, jedes b nimmt eines weg.',
        'Regulär ↔ DEA, kontextfrei ↔ NKA.',
      ], { size: 20 }),
    ], [...D.img(IMG + 'anbn_nka.png', { widthCm: 7.2, caption: 'NKA für aⁿbⁿ (Akzeptanz über Endzustand)' })], 9.6),
    D.h2('4  Begründen: Es gibt keine reguläre Grammatik'),
    ...D.numbered([
      '**Annahme:** Es gibt eine reguläre Grammatik, also auch einen DEA mit k Zuständen.',
      '**Präfixe wählen**, die sich der Automat „merken“ müsste: aⁱ für i = 1, …, k + 1 (bzw. „(“ⁱ bei Klammern).',
      '**Schubfachprinzip:** k + 1 Präfixe, k Zustände → zwei Präfixe aⁱ, aʲ (i ≠ j) enden im selben Zustand.',
      '**Fortsetzung** bⁱ: aⁱbⁱ gehört zur Sprache, aʲbⁱ nicht – der DEA verhält sich bei beiden gleich.',
      '**Widerspruch** – die Sprache ist nicht regulär, es gibt keine reguläre Grammatik.',
    ], { size: 20 }),
    D.p('Achtung: Eine **kontextfreie Grammatik** beweist nicht, dass die **Sprache** nicht regulär ist (Hostnamen: kontextfreie Grammatik, aber reguläre Sprache).', { size: 20 }),
    D.h2('5  Die Chomsky-Hierarchie'),
    D.table([
      ['Typ', 'Sprachklasse', 'Grammatik (Regelform)', 'Maschine', 'Beispiele'],
      ['3', 'regulär', 'rechtsregulär: A → aB | a | ε', 'DEA / NEA', 'endet auf ab, Codes, Hostnamen'],
      ['2', 'kontextfrei', 'A → w (ein Nichtterminal links)', 'Kellerautomat (NKA)', 'aⁿbⁿ, Palindrome, Klammern'],
      ['1', 'kontextsensitiv', 'u → v mit |u| ≤ |v| (Ausblick)', 'linear beschränkter Automat', 'aⁿbⁿcⁿ'],
      ['0', 'rekursiv aufzählbar', 'beliebige Regeln (Ausblick)', 'Turingmaschine', '(Level 16)'],
    ], { widthsCm: [1.1, 2.9, 5.0, 3.6, 4.8], size: 18, center: [0] }),
    W.side([
      ...D.bullets([
        'Die Klassen sind **ineinander enthalten**: Typ 3 ⊂ Typ 2 ⊂ Typ 1 ⊂ Typ 0. Jede reguläre Sprache ist auch kontextfrei.',
        '**Möglichst speziell wählen:** Ist die Sprache regulär, gib eine rechtsreguläre Grammatik bzw. einen DEA an – keinen Kellerautomaten.',
        'Jede **endliche** Sprache ist regulär (z. B. aⁿbⁿ mit n ≤ 3).',
      ], { size: 20 }),
    ], [...D.img(IMG14 + 'chomsky.png', { widthCm: 6.6 })], 10.4),
    D.h2('6  Abi-Check'),
    D.table([
      ['Operator', 'So gehst du vor'],
      ['Entwerfen Sie eine (kontextfreie) Grammatik …', 'Muster-Baukasten: Was muss paarweise zusammenpassen (gemeinsam in einer Regel erzeugen)? Was wiederholt sich? N, T, Startsymbol, Regeln angeben; mit Beispiel und Gegenbeispiel prüfen.'],
      ['Zeigen Sie zwei verschiedene Ableitungen. / Verändern Sie die Grammatik, sodass sie eindeutig ist.', 'Zwei Linksableitungen oder Bäume mit verschiedener Struktur. Eindeutig machen: Endmarke oder Nichtterminale für die erlaubte Zuordnung.'],
      ['Begründen Sie, dass es keine reguläre Grammatik gibt. / Beurteilen Sie, ob ein DEA genügt.', 'Über die **Sprache** argumentieren: unbeschränkt gezählt/verschachtelt? Ja: Schubfach-Argument (Abschnitt 4) mit Wörtern aus dem Sachkontext. Nein: DEA bzw. reguläre Grammatik skizzieren.'],
      ['Erläutern Sie, wie ein Kellerautomat … nutzt.', 'Was wird bei welchem Zeichen abgelegt/entfernt, was bedeutet der Kellerinhalt im Sachzusammenhang, wann wird akzeptiert?'],
    ], { widthsCm: [6.0, 11.4], size: 19, firstColBold: true }),
  ];
  const f = await D.save(D.doc({ kind: 'MB', niveau: 'eA', title: 'Kontextfreie Grammatiken & Chomsky-Hierarchie', titleSize: 30, subtitle: 'Merkblatt M10 · Level 13–14 · Muster, Mehrdeutigkeit, Kellerautomat, Sprachklassen', metaText: 'M10  ·  Welt C', code: 'M10 · Merkblatt Kontextfreie Grammatiken', body }), OUT + 'M10_Merkblatt_Kontextfreie-Grammatiken.docx');
  console.log(f);
})();
