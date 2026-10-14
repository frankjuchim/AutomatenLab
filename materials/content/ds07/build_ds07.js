const __MAT = require('path').resolve(__dirname, '../..'); // Wurzel: materials/
// DS07 – Level 7 „Der Automat stößt an Grenzen“ – Arbeitsblatt, Lehrkraft-Handreichung, Folien
const D = require((__MAT + '/lib/docstyle.js'));
const S = require((__MAT + '/lib/deckstyle.js'));
const J = require((__MAT + '/content/ds07/ds07.json'));
const IMG = (__MAT + '/build/img/ds07/');
const OUT = (__MAT + '/out/');
const T = 'Der Automat stößt an Grenzen';
const SUB = 'Grenzen endlicher Automaten und das Schubfachprinzip';
const KF = 'Gibt es Probleme, die kein endlicher Automat lösen kann – und wie kann man das begründen?';
const FN = 'Der-Automat-stoesst-an-Grenzen';
const res = (ok) => (ok ? 'akzeptiert' : 'abgelehnt');

// Sprachen der Entscheidungstabelle (Aufgabe 3) – Lösung, Begründung (geprüft in automata_ds07.py)
const SPRACHEN = [
  ['L~1~ = {a^n^b^n^ | 1 ≤ n ≤ 3}', 'ja', 'Endliche Sprache (nur ab, aabb, aaabbb): Jede endliche Sprache ist regulär. Beschränktes Zählen bis 3 genügt (DEA mit 7 Zuständen + Fehlerzustand).'],
  ['L~2~ = {a^n^b^m^ | n ≥ 1, m ≥ 1}', 'ja', 'Anzahlen werden nicht verglichen: „erst mindestens ein a, dann mindestens ein b“ – 3 Zustände + Fehlerzustand.'],
  ['L~3~ = Wörter über {a, b} mit gleich vielen a wie b', 'nein', 'Unbeschränkter Vergleich. Präfixe a^i^ (i = 1 … k + 1), Fortsetzung b^i^: a^i^b^i^ ∈ L~3~, a^j^b^i^ ∉ L~3~.'],
  ['L~4~ = Wörter über {a, b}, bei denen (Anzahl a − Anzahl b) durch 3 teilbar ist', 'ja', 'Nur der Rest modulo 3 muss gemerkt werden (0, 1, 2) – 3 Zustände.'],
  ['L~5~ = Palindrome über {a, b} (z. B. abba, aba)', 'nein', 'Die erste Hälfte müsste vollständig gespeichert werden. Präfixe a^i^b, Fortsetzung a^i^: a^i^ba^i^ ist Palindrom, a^j^ba^i^ nicht.'],
  ['L~6~ = korrekte Klammerausdrücke über {(, )} mit Schachteltiefe höchstens 3', 'ja', 'Beschränktes Zählen: Tiefe 0, 1, 2, 3 merken (wie der Türsteher mit Kapazität 3) – 4 Zustände + Fehlerzustand.'],
  ['L~7~ = {a^n^b^m^ | n > m ≥ 0}', 'nein', 'Präfixe a^i^, Fortsetzung b^i^: a^i^b^i^ ∉ L~7~, aber a^j^b^i^ ∈ L~7~ für j > i.'],
  ['L~8~ = Wörter über {a, b}, in denen „ab“ genauso oft vorkommt wie „ba“', 'ja', 'Falle! Die Anzahlen unterscheiden sich nie um mehr als 1; sie sind genau dann gleich, wenn das Wort leer ist oder erstes und letztes Zeichen gleich sind – DEA mit 5 Zuständen.'],
];

// =====================================================================================  Arbeitsblatt
async function ab() {
  const body = [
    D.p('Willkommen in **Welt B**! Bisher konnte jeder DEA, den wir gebaut haben, seine Aufgabe lösen. Heute drehen wir den Spieß um: Wir suchen Aufgaben, an denen **jeder** endliche Automat scheitert – und lernen, wie man so etwas sauber **begründet**.'),
    D.task({ nr: 1, title: 'Der Türsteher', niveau: 'Basis', afb: 'I–II', body: [
      D.p('Vor einem kleinen Club steht ein Türsteher. Er notiert jede Bewegung: **E** = jemand kommt herein, **A** = jemand geht hinaus. Der Club fasst höchstens **3 Personen**. Wer hinaus will, obwohl niemand drin ist, oder wer bei vollem Club hinein will, löst Alarm aus. Der Automat soll erkennen, ob der Club am Ende **leer** ist und kein Alarm ausgelöst wurde. Σ = {E, A}.'),
      D.img(IMG + 'tuer3.png', { widthCm: 11, caption: 'Abbildung 1: Türsteher-Automat (Kapazität 3). Alle nicht eingezeichneten Übergänge führen in einen Fehlerzustand.' }),
      D.sub('a', '**Stelle** die Verarbeitung von `EEAA`, `EEEEAAAA` und `AEEA` als Zustandsfolge **dar** und **gib** jeweils **an**, ob die Eingabe akzeptiert wird.'),
      ...D.lines(3),
      D.sub('b', '**Erläutere** die Bedeutung der Zustände S0 bis S3 im Sachzusammenhang.'),
      ...D.lines(2),
      D.sub('c', '**Bestimme**, wie viele Zustände (einschließlich Fehlerzustand) ein entsprechender Automat für einen Club mit 50 Plätzen benötigt.'),
      ...D.lines(1),
      D.sub('d', 'Der Club zieht in eine riesige Halle – es gibt **keine Kapazitätsgrenze** mehr. Halte deine Vermutung fest: Gibt es dann noch einen DEA?'),
      ...D.lines(1),
    ] }),
    D.qr({ route: '#/ueberliste?stufe=1', title: 'Überliste den Automaten', text: 'Stufe 1 bis 5: Finde ein Wort, bei dem sich der Automat irrt. Tipps kosten Punkte – mit dem Schubfach-Trick brauchst du nur einen Versuch. Bonus: „Warum hilft k + 1 nicht?“' }),
    D.task({ nr: 2, title: 'Überliste den Automaten', niveau: 'Standard', afb: 'II', app: '#/ueberliste', body: [
      D.p('In der App behauptet ein Automat mit k Zuständen, genau die Sprache L = {a^n^b^n^ | n ≥ 1} zu erkennen (erst n-mal a, dann n-mal b) – in Stufe 3 ist L die Sprache der korrekt geklammerten Ausdrücke über {(, )}. Du kennst seine Zustände nicht – aber du kannst ihn mit einem einzigen Wort überführen.'),
      D.sub('a', 'Spiele die Stufen 1 bis 3 und **trage** deine Gewinner-Wörter **ein**.'),
      D.table([
        ['Stufe', 'k (Zustände)', 'Wort, bei dem sich der Automat irrt', 'Gehört das Wort zu L?', 'Antwort des Automaten'],
        ['1  Der Zähler', '5', '', '', ''],
        ['2  Der bessere Zähler', '9', '', '', ''],
        ['3  Der Klammer-Prüfer', '4', '', '', ''],
      ], { widthsCm: [3.6, 2.2, 5.6, 3.0, 3.0], size: 19, rowHeightCm: 0.9 }),
      D.sub('b', '**Beschreibe** deine Gewinnstrategie so, dass sie für **jeden** Automaten mit beliebig vielen (aber endlich vielen) Zuständen funktioniert.'),
      ...D.lines(3),
    ] }),
    ...D.info('Das Schubfach-Argument für L = {aⁿbⁿ | n ≥ 1} in 5 Schritten', [
      ...D.numbered([
        '**Annahme:** Es gibt einen DEA mit k Zuständen, der genau L erkennt.',
        '**Präfixe wählen:** Betrachte die k + 1 Wörter a, a^2^, a^3^, …, a^k+1^.',
        '**Schubfachprinzip:** k + 1 Wörter, aber nur k Zustände ⇒ zwei verschiedene Wörter a^i^ und a^j^ (i < j) führen in **denselben** Zustand.',
        '**Gleiche Fortsetzung:** Hänge an beide b^i^ an. Da der Automat deterministisch ist, endet er bei a^i^b^i^ und a^j^b^i^ im **selben** Zustand.',
        '**Widerspruch:** a^i^b^i^ ∈ L, aber a^j^b^i^ ∉ L. Ein Zustand kann nicht zugleich End- und Nicht-Endzustand sein. Also ist die Annahme falsch: **Kein DEA erkennt L.**',
      ], { ref: 'numbers' }),
    ]),
    D.task({ nr: 3, title: 'DEA möglich? – Achtung, Fallen!', niveau: 'Standard', afb: 'II–III', body: [
      D.p('**Entscheide** für jede Sprache, ob es einen DEA gibt, der sie erkennt, und **begründe** in Stichworten (DEA-Idee: „Was muss er sich merken?“ bzw. Schubfach-Argument: Präfixe und Fortsetzung). Nicht alles, was nach Zählen aussieht, ist unmöglich!'),
      D.table([
        ['Sprache', 'DEA?', 'Begründung (Stichworte)'],
        ...SPRACHEN.map(([l]) => [l, '', '']),
      ], { widthsCm: [7.4, 1.6, 8.4], size: 19, rowHeightCm: 1.15 }),
    ] }),
    D.task({ nr: 4, title: 'Begründen wie im Abitur', niveau: 'Standard', afb: 'III', body: [
      D.sub('a', '**Begründe**, dass kein DEA alle korrekt geklammerten Ausdrücke über Σ = {(, )} beliebiger Schachteltiefe erkennen kann (z. B. `(()())` korrekt, `(()` nicht korrekt).'),
      ...D.lines(3),
      D.sub('b', 'Prüfnummern über Σ = {1, 2, 3, -} bestehen aus zwei nichtleeren Ziffernfolgen, getrennt durch „-“. **Kriterium Q:** Die Quersumme der ersten Ziffernfolge ist gleich der Anzahl der Zeichen der zweiten Ziffernfolge. Beispiel: `21-322` erfüllt Q (2 + 1 = 3 Zeichen). **Begründe**, dass kein DEA genau die Prüfnummern mit Kriterium Q akzeptiert. **Gib** außerdem eine Zusatzregel **an**, mit der ein DEA genügen würde.'),
      ...D.lines(3),
      D.sub('c', 'Ein Türschloss wird über die Tasten O und X bedient, jede Eingabe wird mit E abgeschlossen. Ein Code ist gültig, wenn vor dem E **gleich viele O wie X** getippt wurden (z. B. `OXXOE`). **Entscheide begründet**, ob man die Gültigkeit auch mit einem endlichen Automaten überprüfen könnte.'),
      ...D.lines(3),
      D.sub('d', '(Profi) Der Hersteller ändert die Regel: Zusätzlich darf zu **keinem Zeitpunkt** die Anzahl der O die Anzahl der X um mehr als 2 übersteigen (und umgekehrt). **Entscheide begründet**, ob jetzt ein DEA genügt, und **entwickle** ggf. seinen Zustandsgraphen.'),
      ...D.drawBox(3.8),
    ] }),
    D.task({ nr: 5, title: 'Auch Mealy-Automaten haben Grenzen', niveau: 'Profi', afb: 'II–III', body: [
      D.p('Ein Kartoffelautomat verkauft einen Sack für **3 €**. Er nimmt 1-€- und 2-€-Münzen an (Σ = {1, 2}), gibt den Sack (K) und ggf. 1 € Rückgeld (1) aus: Ω = {K, 1}.'),
      D.img(IMG + 'kartoffel3.png', { widthCm: 8.5, caption: 'Abbildung 2: Mealy-Automat des Kartoffelautomaten (Preis 3 €)' }),
      D.sub('a', '**Bestimme** die Ausgabe für die Eingaben `2211` und `1221`.'),
      ...D.lines(1),
      D.sub('b', '**Analysiere**, wie die Anzahl der Zustände vom Preis p (in ganzen Euro) abhängt.'),
      ...D.lines(2),
      D.sub('c', 'Ein neues Modell soll für **jeden** Preis funktionieren: Der Händler stellt den Preis vorher ein, indem er n-mal die Taste P drückt (`PPPP` = 4 €), danach wird bezahlt. **Beurteile**, ob es einen Mealy-Automaten gibt, der dieses Modell vollständig umsetzt.'),
      ...D.lines(3),
    ] }),
    D.h3('Selbstcheck – Level 7 geschafft, wenn …'),
    ...D.checklist([
      'ich erklären kann, warum „beschränktes Zählen“ mit einem DEA geht und „unbeschränktes Zählen“ nicht.',
      'ich das Schubfach-Argument für a^n^b^n^ in 5 Schritten aufschreiben kann.',
      'ich für eine Sprache passende Präfixe und eine trennende Fortsetzung finde.',
      'ich typische Fallen erkenne: endliche Sprachen, Zählen modulo k, beschränkte Tiefe.',
    ]),
  ];
  return D.save(D.doc({ kind: 'AB', ds: 7, title: T, subtitle: SUB, kernfrage: KF, body }), OUT + `DS07_AB_${FN}.docx`);
}

// =====================================================================================  Lehrkraft
async function lk() {
  const t = J.tuer, z = J.zaehler, k3 = J.kartoffel3;
  const body = [
    D.h2('Überblick'),
    D.table([
      ['Aspekt', 'Inhalt'],
      ['Lernziele', 'Die SuS erläutern Grenzen endlicher Automaten, unterscheiden beschränktes (DEA möglich) und unbeschränktes Zählen (kein DEA), führen das Schubfach-Argument für L = {a^n^b^n^ | n ≥ 1} in 5 Schritten und übertragen es auf Klammerausdrücke, Prüfnummern und Codes. Sie analysieren die Zustandszahl eines Mealy-Automaten in Abhängigkeit von einem Parameter.'],
      ['KC-Bezug', 'Automatenmodelle: Grenzen endlicher Automaten erläutern (K5); Vorbereitung K6 (Kellerautomat als Erweiterung). PK1.5 (Argumentieren), PK2.3, IK4.3'],
      ['Abi-Bezug', 'Operatoren „begründen“, „entscheiden begründet“, „beurteilen“, „analysieren“. Vertiefung mit Originalen: Abi 2024 eA Aufgabe B, Teil h (Codes O/X – „ob man diese Eigenschaften auch mithilfe eines endlichen Automaten überprüfen könnte“); Abi 2025 eA Aufgabe B, Teil g (Verwendung eines Kellerautomaten bei Kriterium Y begründen); Abi 2022 eA Aufgabe C, Teil c (letzter Spiegelstrich: DEA statt Kellerautomat?); Abi 2021 Nachschreibtermin eA Aufgabe E, Teil a (Zustandszahl des Mealy-Kartoffelautomaten in Abhängigkeit vom Preis). Weitere Begründungsaufgaben: Abi 2023 eA D b, 2022 eA D c, 2021 eA E d, 2025 Nachschreibtermin eA B i.'],
      ['Material', 'Folien DS07, AB07, Merkblatt M05, AutomatenLab „Überliste den Automaten“ (#/ueberliste?stufe=1 … 5, Bonus), 4 Karten „E“ / „A“ für den Einstieg'],
      ['Vorbereitung', 'Wortkarten EEAA, EEEAAA, EEEEAAAA, AEEA groß ausdrucken; App-Link testen (Stufe 1 auf dem Beamer); Tafelbild „Schubfach“ (Folie 10) vorbereiten.'],
    ], { widthsCm: [3.2, 14.2], firstColBold: true, firstColFill: true }),
    ...D.tip('Hinweis: gA- und eA-Niveau', [D.p('Auf grundlegendem Niveau genügt meist eine anschauliche Begründung („Der Automat kann sich nicht beliebig viel merken“). Diese eA-Version verlangt zusätzlich das **formale Schubfach-Argument** (Annahme – Präfixe – Schubfach – Fortsetzung – Widerspruch) und das Erkennen von Fallen (endliche Sprachen, modulo, beschränkte Tiefe). Die anschauliche Kurzbegründung bleibt als Abi-Minimalform erhalten (siehe M05).', { size: 20 })]),
    D.h2('Verlaufsplan (90 Minuten)'),
    D.table([
      ['Zeit', 'Phase', 'Unterrichtsgeschehen', 'Sozialform / Medien'],
      ['0–15', 'Einstieg', '„Der Finger-Türsteher“: Eine Schülerin ist Türsteherin und darf sich die Personenzahl **nur mit den Fingern einer Hand** merken (höchstens 3 Finger = Kapazität 3). Die Klasse liest Wortkarten Zeichen für Zeichen vor (E/A). Danach: Türsteher-Automat (Folien 4–5), Verarbeitungen, Bedeutung der Zustände. Impuls: „Und ohne Kapazitätsgrenze?“ – Vermutungen sammeln.', 'Rollenspiel, UG, Folien'],
      ['15–35', 'Erarbeitung I', 'App „Überliste den Automaten“, Stufen 1–3 in Partnerarbeit (AB07, Aufgabe 2a). Wer gewinnt, notiert das Wort. Leitfrage: „Welche Wörter funktionieren immer – egal wie viele Zustände der Automat hat?“', 'PA, iPads, AB07'],
      ['35–50', 'Erarbeitung II', 'Gewinnstrategien vergleichen (2b) → Schubfach-Argument in 5 Schritten entwickeln (Folien 9–12), Musterformulierung gemeinsam an der Tafel. Abgrenzung: beschränkt vs. unbeschränkt zählen (Rückbezug Türsteher).', 'UG, Tafel, Folien'],
      ['50–80', 'Übung', 'AB07, Aufgaben 3–5 nach Niveau. Zwischensicherung nach ca. 15 min: Entscheidungstabelle (Fallen L~1~, L~4~, L~6~, L~8~) im Plenum. Schnelle SuS: App Stufe 4–5 und Bonus.', 'EA/PA, AB07, App'],
      ['80–90', 'Sicherung', 'Merkblatt M05 austeilen, Abi-Minimalform vs. Schubfach-Langform besprechen. Ausblick: „Was bräuchte der Türsteher ohne Grenze? – Einen Notizblock mit beliebig viel Platz.“ → Level 9: Kellerautomat.', 'UG, M05'],
    ], { widthsCm: [1.6, 2.4, 10.2, 3.2], size: 19 }),
    D.h2('Einstieg „Der Finger-Türsteher“'),
    ...D.bullets([
      'Die Türsteherin hält eine Hand hoch; Fingerzahl = Personen im Club. Bei „E“ kommt ein Finger dazu, bei „A“ geht einer weg. Würde ein vierter Finger nötig oder ein Finger unter null, ruft sie „Alarm!“ (Fehlerzustand).',
      'Wortkarten: `EEAA` (akzeptiert), `EEEAAA` (akzeptiert), `EEEEAAAA` (Alarm beim 4. E), `AEEA` (Alarm beim ersten A), `EEA` (Club nicht leer).',
      'Auflösung: Fingerstellungen 0–3 sind genau die Zustände S0–S3. Impuls: „Wie viele Finger bräuchte man ohne Grenze?“ – „Unendlich viele“ ist die Kernidee der Stunde.',
      'Hinweis zur App: Stufe 4 „Der Türsteher“ prüft nur, ob **insgesamt** gleich viele E wie A vorkommen (Reihenfolge egal) – eine leicht andere Sprache, gleiche Grenze.',
    ]),
    D.h2('Lösungen AB07'),
    D.h3('Aufgabe 1 – Der Türsteher'),
    D.table([
      ['Eingabe', 'Zustandsfolge', 'Ergebnis'],
      ...['EEAA', 'EEEEAAAA', 'AEEA'].map((w) => [w, t[w][1], res(t[w][0])]),
    ], { widthsCm: [2.6, 11.4, 3.4], size: 19 }),
    ...D.bullets([
      'b) Si bedeutet: „Im Club befinden sich gerade i Personen, bisher wurde kein Alarm ausgelöst.“ S0 ist Endzustand: Der Club ist leer.',
      'c) Für Kapazität c braucht man die Zustände S0 … Sc (c + 1 Stück) plus Fehlerzustand, also c + 2. Bei 50 Plätzen: **52 Zustände**.',
      'd) Ohne Grenze müsste der Automat beliebig viele Personenzahlen unterscheiden. Mit endlich vielen Zuständen ist das unmöglich (wird in der Stunde mit dem Schubfach-Argument begründet).',
    ]),
    D.h3('Aufgabe 2 – Überliste den Automaten'),
    D.p('Der Automat in Stufe 1 hat k = 5 Zustände und zählt nur bis 2 – danach „sättigt“ er. Er entspricht (bis auf die Zustandsnamen) diesem Graphen:', { size: 21 }),
    D.img(IMG + 'zaehler_hl.png', { widthCm: 11.5, caption: 'Stufe 1 „Der Zähler“: a^2^ und a^3^ führen beide nach S2.' }),
    ...D.bullets([
      `a) Stufe 1: z. B. \`aaabb\` – ${z.aaabb[1]} ⇒ akzeptiert, gehört aber nicht zu L. Oder \`aaabbb\` – gehört zu L, wird abgelehnt (${z.aaabbb[1]}). Stufe 2 (Kapazität 4): z. B. \`aaaaabbbb\` oder \`aaaaabbbbb\`. Stufe 3 (Klammer-Prüfer, Tiefe 3): z. B. \`(((())))\` wird abgelehnt oder \`(((()))\` akzeptiert.`,
      'b) Strategie: So viele a lesen, bis der Automat zwei verschiedene Präfixe nicht mehr unterscheiden kann (spätestens nach k + 1 a), dann mit derselben Fortsetzung b^i^ fortsetzen. Allgemein: a^k+1^b^k^ oder a^k+1^b^k+1^ – eines der beiden Wörter wird falsch beurteilt.',
    ]),
    D.h3('Aufgabe 3 – Entscheidungstabelle'),
    D.table([['Sprache', 'DEA?', 'Begründung'], ...SPRACHEN], { widthsCm: [5.6, 1.4, 10.4], size: 18, center: [1] }),
    D.p('Belegende Automaten (alle mit check() gegen die Sprachdefinition bis Wortlänge 10–12 geprüft):', { size: 20 }),
    D.table([
      [[...D.img(IMG + 'LA.png', { widthCm: 8.2 }), D.small('L~1~ (Fehlerzustand weggelassen)', { align: 'center' })], [...D.img(IMG + 'LB.png', { widthCm: 4.6 }), D.small('L~2~ (Fehlerzustand weggelassen)', { align: 'center' })]],
      [[...D.img(IMG + 'LD.png', { widthCm: 4.6 }), D.small('L~4~ (vollständig)', { align: 'center' })], [...D.img(IMG + 'LH.png', { widthCm: 5.2 }), D.small('L~8~ (vollständig)', { align: 'center' })]],
    ], { widthsCm: [8.7, 8.7], header: false }),
    D.h3('Aufgabe 4 – Begründen wie im Abitur'),
    ...D.bullets([
      'a) Annahme: DEA mit k Zuständen erkennt die korrekten Klammerausdrücke. Unter den k + 1 Präfixen (, ((, …, (^k+1^ führen zwei, (^i^ und (^j^ mit i < j, in denselben Zustand. Mit der Fortsetzung )^i^ endet der Automat bei (^i^)^i^ und (^j^)^i^ im selben Zustand. (^i^)^i^ ist korrekt, (^j^)^i^ nicht (j − i Klammern bleiben offen) – Widerspruch.',
      'b) Präfixe 1, 11, …, 1^k+1^ (Quersummen 1 … k + 1); zwei davon, 1^i^ und 1^j^, führen in denselben Zustand. Fortsetzung „-1^i^“: 1^i^-1^i^ erfüllt Q, 1^j^-1^i^ nicht – Widerspruch. Zusatzregel, mit der ein DEA genügt: z. B. „die erste Ziffernfolge hat höchstens 3 Ziffern“ (Quersumme ≤ 9, beschränktes Zählen) oder „die zweite Ziffernfolge hat höchstens 5 Zeichen“.',
      'c) Nein. Der Automat müsste sich die Differenz „Anzahl O − Anzahl X“ merken, die beliebig groß werden kann. Schubfach: Präfixe O^i^ (i = 1 … k + 1), Fortsetzung X^i^E: O^i^X^i^E gültig, O^j^X^i^E ungültig. (Im Abi genügt meist die Kurzform: endlich viele Zustände ⇒ nur endlich viele Differenzen unterscheidbar; ein Kellerautomat kann die Differenz im Keller speichern.)',
      'd) Ja: Die Differenz liegt immer zwischen −2 und 2, es gibt also nur 5 mögliche „Erinnerungen“ (beschränktes Zählen). DEA (Fehlerzustand weggelassen):',
    ]),
    D.img(IMG + 'code2.png', { widthCm: 7.2, caption: 'S0: Differenz 0, S1/S2: ein bzw. zwei O mehr, S3/S4: ein bzw. zwei X mehr, S5: gültiger Code' }),
    D.h3('Aufgabe 5 – Mealy-Grenze'),
    ...D.bullets([
      `a) \`2211\` ⇒ Ausgabe ${k3['2211']} (nach 2, 2 sind 4 € bezahlt: Sack + 1 € zurück; danach 1, 1 = 2 € ohne Ausgabe). \`1221\` ⇒ Ausgabe ${k3['1221']}.`,
      'b) Zustand = bereits bezahlter Betrag 0 … p − 1 € ⇒ **p Zustände**; die Anzahl wächst linear mit dem Preis (Preis 5 €: 5 Zustände, siehe unten). Vgl. Abi 2021 Nachschreibtermin eA E a.',
      'c) Nein. Der Automat müsste nach P^n^ den Preis n speichern – für beliebig große n. Schubfach: Unter P, PP, …, P^k+1^ führen zwei Präfixe P^i^, P^j^ (i < j) in denselben Zustand. Bei der anschließenden Eingabe 1^i^ müsste beim i-ten Euro einmal K ausgegeben werden (Preis i), einmal nicht (Preis j) – gleicher Zustand, gleiche Eingaben ⇒ gleiche Ausgabe. Widerspruch. Für jeden **festen** Höchstpreis gibt es dagegen einen Mealy-Automaten.',
    ]),
    D.img(IMG + 'kartoffel5.png', { widthCm: 12, caption: 'Kartoffelautomat für 5 € (5 Zustände)' }),
    D.h2('Typische Schwierigkeiten'),
    ...D.warn({ titel: 'Darauf achten', fallen: ['P6'] }, [
      ...D.bullets([
        '**„Der DEA bräuchte unendlich viele Zustände“** ist als Abi-Kurzbegründung oft ausreichend, aber nur mit Bezug zum Sachverhalt: **Was** müsste gezählt werden, und warum ist es **unbeschränkt**?',
        '**Fallen:** Endliche Sprachen (L~1~) sind immer regulär; Zählen **modulo** k (L~4~) und Zählen mit **Obergrenze** (L~6~, Aufgabe 4d) gehen mit einem DEA.',
        '**Falsche Fortsetzung:** Die Fortsetzung muss für beide Präfixe **dieselbe** sein (b^i^ an a^i^ und a^j^), sonst entsteht kein Widerspruch.',
        '**Beispiel statt Beweis:** „aaabbb wird von meinem DEA nicht erkannt“ zeigt nur, dass **dieser** Automat falsch ist – nicht, dass **jeder** scheitert.',
        '**Schubfach:** k + 1 Präfixe für k Zustände (nicht k).',
      ]),
    ]),
    D.h2('Differenzierung'),
    ...D.bullets([
      '**Basis:** Aufgabe 1, App Stufe 1–2, Aufgabe 3 (Zeilen L~1~–L~4~). Hilfe: Satzbausteine aus M05.',
      '**Standard:** Aufgaben 1–4c.',
      '**Profi:** Aufgabe 4d, Aufgabe 5, App Stufe 5 und Bonus. Zusatz: „Begründe, dass L~8~ regulär ist“.',
    ]),
    D.h2('Hausaufgabe'),
    D.p('Entscheidungstabelle (Aufgabe 3) vervollständigen und für **eine** nicht reguläre Sprache das Schubfach-Argument vollständig in 5 Schritten ausformulieren (M05 als Vorlage). Zusätzlich: Abi 2024 eA Aufgabe B, Teil h, bearbeiten (Original).'),
  ];
  return D.save(D.doc({ kind: 'LK', ds: 7, title: T, subtitle: SUB, kernfrage: KF, body }), OUT + `DS07_Lehrkraft_${FN}.docx`);
}

// =====================================================================================  Folien
async function folien() {
  const d = S.deck({ ds: 7, title: T });
  d.title({ title: T, subtitle: SUB, kernfrage: KF, notes: 'Start in Welt B „Grenzen & Keller“. Bisher: Für jedes Problem haben wir einen DEA gebaut. Heute: Gibt es Probleme, an denen jeder DEA scheitert?' });
  d.section({ phase: 'Einstieg', title: 'Der Türsteher' });
  d.question({ text: 'Ein Club fasst 3 Personen. Der Türsteher darf sich die Personenzahl nur mit den Fingern einer Hand merken. Ist der Club am Ende leer?', sub: 'E = jemand kommt herein, A = jemand geht hinaus. Karten: **EEAA**, **EEEAAA**, **EEEEAAAA**, **AEEA**, **EEA**', notes: 'Rollenspiel „Finger-Türsteher“: Fingerzahl = Personen im Club. Bei unmöglicher Bewegung ruft die Türsteherin „Alarm!“. Klasse liest Wortkarten Zeichen für Zeichen.' });
  d.image({ title: 'Der Türsteher als DEA', img: IMG + 'tuer3.png', sigma: 'Σ = {E, A}   ·   Si: „Es sind gerade i Personen im Club.“', caption: 'Alle nicht eingezeichneten Übergänge führen in einen Fehlerzustand (Alarm).', notes: 'Bedeutung der Zustände formulieren lassen. Frage: Wie viele Zustände bei 50 Plätzen? (52 inkl. Fehlerzustand)' });
  d.table({ title: 'Verarbeitungen', rows: [
    ['Eingabe', 'Zustandsfolge', 'Ergebnis'],
    ...['EEAA', 'EEEAAA', 'EEEEAAAA', 'AEEA'].map((w) => [w, J.tuer[w][1], res(J.tuer[w][0])]),
  ], colW: [2.0, 8.0, 2.1], size: 20, notes: '[NUR LEHRKRAFT] EEEEAAAA: Der vierte Gast ist einer zu viel – Fehlerzustand, obwohl der Club am Ende wieder leer wäre.' });
  d.question({ text: 'Und wenn der Club keine Kapazitätsgrenze mehr hat?', sub: 'Wie viele Finger – also Zustände – bräuchte der Türsteher dann?', notes: 'Vermutungen sammeln und an der Tafel festhalten („unendlich viele“). Noch nicht auflösen – erst nach dem App-Spiel.' });
  d.section({ phase: 'Erarbeitung', title: 'Überliste den Automaten' });
  d.app({ title: 'Überliste den Automaten', route: '#/ueberliste?stufe=1', phase: 'Erarbeitung', text: 'Ein Automat mit k Zuständen behauptet, **L = {aⁿbⁿ | n ≥ 1}** zu erkennen. Finde ein Wort, bei dem er sich irrt! Stufen 1–3, Ergebnisse in **AB07, Aufgabe 2** eintragen.', notes: 'Partnerarbeit, ca. 15 Minuten. Leitfrage auf die Tafel: Welche Wörter funktionieren IMMER, egal wie viele Zustände der Automat hat?' });
  d.image({ title: 'Wie hast du gewonnen?', img: IMG + 'zaehler_hl.png', caption: 'Stufe 1: Nach aa und nach aaa ist der Automat im selben Zustand S2 – mit bb dahinter akzeptiert er beide.', notes: `[NUR LEHRKRAFT] aabb: ${J.zaehler.aabb[1]}. aaabb: ${J.zaehler.aaabb[1]} – akzeptiert, obwohl nicht in L.` });
  d.twoCol({ title: 'Das Schubfachprinzip', left: { head: 'Idee', items: ['k + 1 Gegenstände in k Schubfächer ⇒ mindestens ein Fach enthält **zwei** Gegenstände', 'Gegenstände = Präfixe a, aa, aaa, …', 'Schubfächer = Zustände des DEA'] }, right: { head: 'Beispiel: k = 4', img: IMG + 'schubfach.png' }, phase: 'Erarbeitung', notes: 'aaa und aaaaa landen im selben Zustand. Ab jetzt kann der Automat die beiden Präfixe nie mehr unterscheiden – egal was folgt.' });
  d.bullets({ title: 'Kein DEA für aⁿbⁿ – in 5 Schritten', phase: 'Erarbeitung', size: 26, items: [
    '**1 Annahme:** Ein DEA mit k Zuständen erkennt L.',
    '**2 Präfixe:** a, a², …, aᵏ⁺¹ (k + 1 Wörter)',
    '**3 Schubfach:** Zwei davon, aⁱ und aʲ (i < j), enden im selben Zustand.',
    '**4 Fortsetzung:** An beide bⁱ anhängen ⇒ wieder derselbe Zustand.',
    '**5 Widerspruch:** aⁱbⁱ ∈ L, aʲbⁱ ∉ L – der Zustand müsste End- und Nicht-Endzustand sein. Also gibt es **keinen** DEA für L.',
  ], notes: 'Gemeinsam an der Tafel formulieren; Musterformulierung steht im Merkblatt M05. Betonen: Das Argument funktioniert für JEDES k – deshalb hilft auch ein Zustand mehr nicht (Bonusfrage in der App).' });
  d.twoCol({ title: 'Beschränkt vs. unbeschränkt zählen', left: { head: 'DEA möglich', items: ['Club mit höchstens 3 Personen', 'Klammertiefe höchstens 3', 'Anzahl a modulo 3', 'endliche Sprachen, z. B. aⁿbⁿ mit n ≤ 3'] }, right: { head: 'Kein DEA', items: ['Club ohne Kapazitätsgrenze', 'Klammern beliebiger Tiefe', 'gleich viele a wie b', 'aⁿbⁿ für alle n ≥ 1, Palindrome'] }, phase: 'Erarbeitung', notes: 'Merksatz: Ein DEA kann nur endlich viele verschiedene „Erinnerungen“ haben. Sobald eine Größe beliebig groß werden kann UND für die Entscheidung exakt gebraucht wird, scheitert er.' });
  d.section({ phase: 'Übung', title: 'Arbeitsblatt Level 7' });
  d.task({ title: 'Auftrag: AB07', steps: [
    '**Aufgabe 3**: Entscheidungstabelle – Vorsicht, Fallen!',
    '**Aufgabe 4**: Begründen wie im Abitur (Klammern, Prüfnummern, Codes).',
    'Profis: **Aufgabe 4d** und **Aufgabe 5** (Mealy-Grenze).',
    'Fertig? App-Stufen 4–5 und Bonus „Warum hilft k + 1 nicht?“',
  ], zeit: '30 min', sozialform: 'Einzel → Partner', material: 'AB07, Merkblatt M05', app: '#/ueberliste?stufe=4', notes: 'Zwischensicherung nach ca. 15 Minuten: Fallen L1 (endlich), L4 (modulo), L6 (Tiefe ≤ 3), L8 (ab = ba ist regulär!).' });
  d.cards({ title: 'Vier Fallen in der Entscheidungstabelle', phase: 'Übung', cards: [
    { head: 'Endlich', text: 'aⁿbⁿ mit n ≤ 3: nur drei Wörter – jede endliche Sprache hat einen DEA.', icon: 'LuListChecks' },
    { head: 'Modulo', text: '(Anzahl a − Anzahl b) durch 3 teilbar: nur den Rest 0, 1, 2 merken.', icon: 'LuRepeat' },
    { head: 'Obergrenze', text: 'Klammertiefe ≤ 3: wie der Türsteher mit 3 Plätzen.', icon: 'LuGauge' },
    { head: 'Täuschung', text: '„ab“ so oft wie „ba“: gleich genau dann, wenn erstes = letztes Zeichen.', icon: 'LuEyeOff' },
  ], notes: '[NUR LEHRKRAFT] Auflösung der Fallen nach der Zwischensicherung zeigen. L8 ist die Profi-Falle: Ausprobieren mit abab (ab 2×, ba 1×) und aba (je 1×).' });
  d.section({ phase: 'Sicherung', title: 'Was wir heute gelernt haben' });
  d.merke({ title: 'Merke: Grenzen endlicher Automaten', items: [
    'Ein DEA hat **endlich viele Zustände** – er kann nur endlich viele verschiedene Situationen unterscheiden.',
    '**Beschränktes** Zählen (bis zu einer festen Grenze, modulo k) geht – **unbeschränktes** Zählen und Vergleichen nicht.',
    'Begründung mit dem **Schubfach-Argument**: k + 1 Präfixe → zwei im selben Zustand → gleiche Fortsetzung → Widerspruch.',
    'Auch **Mealy-Automaten** haben diese Grenze: Die Zustandszahl wächst mit dem Preis.',
  ], img: IMG + 'schubfach.png', imgW: 3.6 });
  d.end({ items: ['Türsteher: beschränkt vs. unbeschränkt zählen', 'Schubfach-Argument in 5 Schritten', 'Fallen erkennen: endlich, modulo, Obergrenze', 'Ausblick Level 9: Ein Notizblock ohne Grenze – der Kellerautomat'], hausaufgabe: 'AB07, Aufgabe 3 vervollständigen; für eine nicht reguläre Sprache das Schubfach-Argument in 5 Schritten ausformulieren (M05 als Vorlage).' });
  return d.save(OUT + `DS07_Folien_${FN}.pptx`);
}

(async () => {
  const files = [await ab(), await lk(), await folien()];
  console.log(files.join('\n'));
})();
