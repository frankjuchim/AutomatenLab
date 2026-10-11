const __MAT = require('path').resolve(__dirname, '../..'); // Wurzel: materials/
// DS14 – Level 14 „Die Landkarte der Sprachen“ – Arbeitsblatt (inkl. Karten-Set und Trainingszirkel), Lehrkraft-Handreichung, Folien
const D = require((__MAT + '/lib/docstyle.js'));
const S = require((__MAT + '/lib/deckstyle.js'));
const W = require((__MAT + '/content/ds11/wc.js'));
const IMG = (__MAT + '/build/img/ds14/');
const OUT = (__MAT + '/out/');
const T = 'Die Landkarte der Sprachen';
const SUB = 'Chomsky-Hierarchie, Begriffsnetz und Abi-Trainingszirkel';
const KF = 'Welche Maschine braucht man für welche Sprache – und wie hängt alles zusammen?';
const J = W.load(14);
const FILE = 'Landkarte-der-Sprachen';
const ar = (a) => a.join(' ⇒ ');
const FEHLER = 'Alle nicht eingezeichneten Übergänge führen in einen Fehlerzustand.';
const KELLER_H = ['Zustand', 'Belegung Kellerspeicher', 'oberstes Kellersymbol', 'verarbeitetes Eingabezeichen'];
const GL = W.abi(['S', 'F'], ['a', 'f', 'c'], 'S', J.gl_rules);
const HIER = [
  ['Typ', 'Sprachklasse', 'Grammatik', 'Maschine'],
  ['3', 'regulär', 'rechtsregulär: A → aB | a | ε', 'DEA / NEA'],
  ['2', 'kontextfrei', 'kontextfrei: A → w', 'Kellerautomat (NKA)'],
  ['1 / 0', 'kontextsensitiv / rekursiv aufzählbar', 'allgemeinere Regeln (Ausblick)', 'linear beschränkter Automat / Turingmaschine'],
];
const SPRACHEN = ['Wörter über {a, b} mit höchstens drei b', 'Programme aus beliebig tief verschachtelten begin … end-Blöcken', 'aⁿbⁿ mit 1 ≤ n ≤ 3', 'aⁿbⁿcⁿ (n ≥ 1)', 'Binärzahlen, die durch 3 teilbar sind', 'Palindrome über {0, 1}'];
const STATIONEN = [
  ['1', 'Analyse', 'untersuchen, beschreiben, begründen', '6'],
  ['2', 'Entwurf', 'entwickeln, zeigen', '7'],
  ['3', 'Begründung', 'begründen, angeben', '7'],
  ['4', 'Dokumentation', 'dokumentieren, erläutern', '6'],
];
const be = (n) => `  **[${n} BE]**`;

// =====================================================================================  Arbeitsblatt
async function ab() {
  const lt = J.lag_table.map((r) => [r[0], r[1], r[2] || '–', r[3] || '–']);
  const station = (nr, name, kids) => [D.h2(`Station ${nr} – ${name}`), ...kids];
  const body = [
    D.p('Level 14 ist der Blick von oben: DEA, NEA, Mealy, Kellerautomat, reguläre und kontextfreie Grammatiken – wie passt das alles zusammen? Die **Chomsky-Hierarchie** ordnet Sprachen nach der Maschine, die man **mindestens** braucht.'),
    D.info('Die Chomsky-Hierarchie', [
      W.side(D.table(HIER, { widthsCm: [1.1, 2.5, 3.5, 3.4], size: 18, noSpacer: true, center: [0] }), [...D.img(IMG + 'chomsky.png', { widthCm: 5.4 })], 10.7, 16.6),
      D.p('Die Klassen sind ineinander enthalten (Typ 3 ⊂ Typ 2 ⊂ Typ 1 ⊂ Typ 0). **Wähle immer die speziellste passende Grammatik bzw. Maschine:** Ist eine Sprache regulär, gibst du eine rechtsreguläre Grammatik oder einen DEA an – keinen Kellerautomaten.', { size: 20 }),
    ]),
    D.task({ nr: 1, title: 'Nach dem Chomsky-Sortierer', niveau: 'Basis', afb: 'I–II', body: [
      D.p('**Ordne** jede Sprache der möglichst speziellen Klasse zu und **begründe** in Stichworten („Begründungs-Joker“).'),
      D.table([['Sprache', 'Typ', 'Maschine', 'Begründung'], ...SPRACHEN.map((s) => [s, '', '', ''])], { widthsCm: [6.0, 1.3, 3.2, 6.9], size: 19, rowHeightCm: 1.2 }),
    ] }),
    D.pageBreak(),
    D.task({ nr: 2, title: 'Das Begriffsnetz', niveau: 'Standard', afb: 'II', body: [
      ...D.numbered([
        'Schneidet die Begriffs- und Verbindungskarten (Kopiervorlage) aus.',
        'Legt die Begriffskarten auf ein A3-Blatt und verbindet sie mit Pfeilen. Beschriftet jeden Pfeil mit einer Verbindungskarte oder einer eigenen Formulierung (z. B. „DEA – erkennt → reguläre Sprachen“).',
        'Ziel: mindestens **12 Verbindungen**; jede Begriffskarte ist mindestens einmal verbunden.',
        'Jede Gruppe **erläutert** zwei Verbindungen im Plenum – mit Beispiel aus dem Unterricht.',
      ], { ref: 'numbers2' }),
    ] }),
    D.task({ nr: 3, title: 'Abi-Trainingszirkel', niveau: 'Standard', afb: 'I–III', body: [
      D.p('Vier Stationen mit Aufgaben im Abitur-Format (Sie-Form, Bewertungseinheiten). Bearbeite jede Station ca. 10 Minuten auf einem separaten Blatt (Station 4 direkt in der Tabelle), kontrolliere dann mit der **Lösungskarte** und trage deine BE ein.'),
      D.table([['Station', 'Schwerpunkt', 'Operatoren', 'max. BE', 'meine BE'], ...STATIONEN.map((s) => [...s, ''])], { widthsCm: [1.8, 3.4, 6.4, 2.2, 3.6], size: 19, center: [0, 3, 4] }),
    ] }),
    D.qr({ route: '#/sortierer?runde=1', title: 'Chomsky-Sortierer', text: '10 Sprachkarten, drei Fächer: DEA reicht – Kellerautomat nötig – mehr nötig. Nach jeder Karte siehst du die Begründung.' }),
    D.qr({ route: '#/quiz?welt=C', title: 'Level-Quiz Welt C', text: 'Exit-Ticket für ganz Welt C: Grammatiken, reguläre und kontextfreie Sprachen, Chomsky-Hierarchie.' }),
    D.h3('Selbstcheck – Level 14 geschafft, wenn …'),
    ...D.checklist([
      'ich zu einer Sprache die möglichst spezielle Grammatik und Maschine angeben und begründen kann.',
      'ich die Zusammenhänge DEA – NEA – rechtsreguläre Grammatik und NKA – kontextfreie Grammatik erläutern kann.',
      'ich Abi-Aufgaben zu Grammatiken analysieren, entwerfen, begründen und dokumentieren kann.',
    ]),
    D.pageBreak(),
    D.h2('Kopiervorlage: Begriffskarten'),
    W.cards(J.karten, { cols: 4, size: 22, h: 1.5 }),
    D.h3('Verbindungskarten (mehrfach verwendbar – leere Karten selbst beschriften)'),
    W.cards([...J.verbindungen, 'erkennt', 'erzeugt', 'Beispiel für', 'Beispiel für', 'Spezialfall von', '', '', '', ''].slice(0, 20), { cols: 4, size: 19, h: 1.1 }),
    D.pageBreak(),
    ...station(1, 'Analyse', [
      D.p('Ein Lagerroboter protokolliert seine Aktionen: **a** = Kiste aufnehmen, **f** = ein Feld fahren, **c** = Kiste abgeben. Gültige Protokolle werden von der Grammatik G~L~ erzeugt.'),
      ...W.gram(GL, { widthCm: 7, caption: 'Abbildung S1: Grammatik G~L~' }),
      D.sub('a', `Untersuchen Sie, ob die Protokolle \`aaffcc\` und \`affcc\` von G~L~ erzeugt werden.${be(2)}`),
      D.sub('b', `Beschreiben Sie die Sprache L(G~L~) und die Bedeutung des Nichtterminals F im Sachzusammenhang.${be(3)}`),
      D.sub('c', `Begründen Sie, dass G~L~ keine reguläre Grammatik ist.${be(1)}`),
    ]),
    ...station(2, 'Entwurf', [
      D.p('Paketcodes bestehen aus den Zeichen Σ = {k, g, z, p}: Ein Code beginnt mit **k** (kleines Paket) oder **g** (großes Paket), danach folgen **mindestens zwei** Ziffern, die durch **z** dargestellt werden, am Ende steht genau ein Prüfzeichen **p**. Beispiel: `gzzzp`.'),
      D.sub('a', `Entwickeln Sie eine reguläre Grammatik, die genau die Paketcodes erzeugt.${be(3)}`),
      D.sub('b', `Zeigen Sie mit Ihrer Grammatik, dass \`kzzzp\` erzeugt wird.${be(1)}`),
      D.sub('c', `Entwickeln Sie aus Ihrer Grammatik den Zustandsgraphen eines DEA, der genau die Paketcodes akzeptiert. Auf die Darstellung des Fehlerzustands kann verzichtet werden.${be(3)}`),
    ]),
    D.pageBreak(),
    ...station(3, 'Begründung', [
      D.p('Betrachtet wird die Sprache L = {aⁿfᵐcⁿ | n ≥ 0, m ≥ 1} der Lagerroboter-Protokolle aus Station 1.'),
      D.sub('a', `Begründen Sie, dass L nicht regulär ist.${be(4)}`),
      D.sub('b', `Geben Sie für die folgenden Sprachen jeweils die möglichst spezielle Maschine an, die genau diese Sprache akzeptiert, und begründen Sie Ihre Angabe kurz: (1) die Paketcodes aus Station 2, (2) die Sprache L, (3) die Protokolle aⁿfⁿcⁿ (n ≥ 1), bei denen genauso oft gefahren wird, wie Kisten aufgenommen und abgegeben werden.${be(3)}`),
    ]),
    ...station(4, 'Dokumentation', [
      D.p('Der Kellerautomat in Abbildung S4 prüft Lagerroboter-Protokolle. Γ = {#, A}, # ist das Vorbelegungszeichen.'),
      D.img(IMG + 'lager_nka.png', { widthCm: 12.5, caption: 'Abbildung S4: Kellerautomat für Protokolle. ' + FEHLER }),
      D.sub('a', `Dokumentieren Sie die Verarbeitung der Eingabe \`aafcc\` durch den Kellerautomaten in einer Tabelle. Geben Sie an, ob die Eingabe akzeptiert wird.${be(4)}`),
      D.fillTable(KELLER_H, 7, { prefill: [['S0', '#', '–', '–']], widthsCm: [2.6, 4.8, 4.8, 5.2], size: 19, rowHeightCm: 0.65 }),
      D.p('Eingabe wird akzeptiert:   ☐ ja    ☐ nein', { size: 20 }),
      D.sub('b', `Erläutern Sie die Bedeutung des Kellerinhalts im Sachzusammenhang.${be(2)}`),
    ]),
    D.pageBreak(),
    D.h2('Lösungskarten zur Selbstkontrolle'),
    D.small('An den Stationen umgedreht auslegen oder an der gestrichelten Linie abknicken. Erst nach der Bearbeitung ansehen!'),
    ...D.tip('Lösung Station 1 – Analyse (6 BE)', [
      ...D.bullets([
        `a) aaffcc: ${ar(J.gl_deriv_aaffcc)} – wird erzeugt (1 BE). affcc: Jede Anwendung von S → aSc erzeugt genau ein a und ein c, also enthalten alle Wörter gleich viele a und c; affcc hat ein a, aber zwei c – wird nicht erzeugt (1 BE).`,
        'b) L(G~L~) = {aⁿfᵐcⁿ | n ≥ 0, m ≥ 1}: Erst werden n Kisten aufgenommen, dann fährt der Roboter mindestens ein Feld, dann gibt er genau so viele Kisten ab (2 BE). F erzeugt die Fahrstrecke aus mindestens einem f (1 BE).',
        'c) In S → aSc steht rechts vom Nichtterminal noch ein Terminal; zulässig wären nur A → aB, A → a, A → ε (1 BE).',
      ], { size: 19 }),
    ]),
    ...D.tip('Lösung Station 2 – Entwurf (7 BE)', [
      W.side([D.p('a) N = {S, A, B, C}, T = {k, g, z, p}, Startsymbol S (3 BE):', { size: 19 }), ...W.gram(J.gpk_rules, { size: 19, widthCm: 6 }),
        D.p(`b) ${ar(J.gpk_deriv)} (1 BE)`, { size: 19 })],
      [D.p('c) DEA nach dem Rezept, Zustände S0–S3 entsprechen S, A, B, C; S4 neu für C → p (3 BE):', { size: 19 }), ...D.img(IMG + 'paket_dea.png', { widthCm: 8.3, caption: FEHLER })], 7.6, 16.6),
    ]),
    ...D.tip('Lösung Station 3 – Begründung (7 BE)', [
      ...D.bullets([
        'a) Annahme: Ein DEA mit k Zuständen akzeptiert L (1 BE). Er liest die k + 1 Präfixe ε, a, aa, …, aᵏ; nach dem Schubfachprinzip endet er für zwei davon, aⁱ und aʲ mit i ≠ j, im selben Zustand (1 BE). Dann verhält er sich bei den Fortsetzungen gleich: aⁱfcⁱ gehört zu L, aʲfcⁱ nicht (1 BE) – Widerspruch, L ist nicht regulär (1 BE).',
        '(1) DEA – endliches Muster ohne unbeschränktes Zählen (1 BE). (2) Kellerautomat – L ist kontextfrei (Grammatik G~L~), aber nach a) nicht regulär; der Keller zählt die a (1 BE). (3) Weder DEA noch Kellerautomat: Es müssen zwei Anzahlen mit n verglichen werden, ein Keller kann nur einmal abgebaut werden – mehr als ein Kellerautomat nötig: linear beschränkter Automat bzw. Turingmaschine (Typ 1, Ausblick) (1 BE).',
      ], { size: 19 }),
    ]),
    ...D.tip('Lösung Station 4 – Dokumentation (6 BE)', [
      W.side(D.table([KELLER_H, ...lt], { size: 17, widthsCm: [1.8, 3.0, 2.8, 3.2], center: [0, 1, 2, 3], noSpacer: true }), [
        D.p('a) Tabelle links (je korrekter Abschnitt 1 BE, Akzeptanz 1 BE). Nach aafcc ist der Automat im Endzustand S3 – **Eingabe wird akzeptiert: ja.**', { size: 19 }),
        D.p('b) Jedes A im Keller steht für eine aufgenommene, aber noch nicht abgegebene Kiste (1 BE). Bei c wird ein A entfernt; nur wenn am Ende wieder # oben liegt – alle Kisten abgegeben –, ist der Übergang in den Endzustand S3 möglich (1 BE).', { size: 19 }),
      ], 11.0, 16.6),
    ]),
  ];
  return D.save(D.doc({ kind: 'AB', ds: 14, title: T, subtitle: SUB, kernfrage: KF, body }), OUT + `DS14_AB_${FILE}.docx`);
}

// =====================================================================================  Lehrkraft
async function lk() {
  const sol = [
    ['Wörter mit höchstens drei b', '3', 'DEA', 'Zählen bis zu einer festen Grenze: Zustände 0, 1, 2, 3 b (+ Fehlerzustand).'],
    ['verschachtelte begin … end-Blöcke', '2', 'Kellerautomat', 'Beliebig tiefe Verschachtelung: Keller merkt sich offene Blöcke; kein DEA (Schubfach).'],
    ['aⁿbⁿ mit 1 ≤ n ≤ 3', '3', 'DEA', 'Nur drei Wörter – jede endliche Sprache ist regulär.'],
    ['aⁿbⁿcⁿ', '1', 'linear beschränkter Automat (Turingmaschine)', 'Zwei Vergleiche mit derselben Anzahl – ein Keller reicht nicht; kontextsensitiv (Ausblick).'],
    ['Binärzahlen durch 3 teilbar', '3', 'DEA', 'Rest modulo 3 mit drei Zuständen mitführen.'],
    ['Palindrome über {0, 1}', '2', 'Kellerautomat (NKA)', 'Erste Hälfte auf den Keller, Mitte raten; kein DEA.'],
  ];
  const body = [
    D.h2('Überblick'),
    D.table([
      ['Aspekt', 'Inhalt'],
      ['Lernziele', 'Die SuS ordnen Sprachen der möglichst speziellen Sprachklasse und Maschine zu (Chomsky-Hierarchie), vernetzen die Begriffe der Einheit in einem Begriffsnetz und wenden ihr Wissen in Abi-artigen Aufgabenteilen zu Analyse, Entwurf, Begründung und Dokumentation an.'],
      ['KC-Bezug', 'Vernetzung K1–K6 und F1–F4; Ergänzung über den Kern: Chomsky-Hierarchie. PK1.5, PK2.3, PK3.1, PK3.2, IK4.3'],
      ['Abi-Bezug', 'Trainingszirkel im Abi-Format mit BE: Station 1 angelehnt an Abi 2022 eA D a (Wörter untersuchen, Bedeutung von Nichtterminalen, „Begründen Sie, dass G1 nicht regulär ist“); Station 2 an Abi 2024 eA B d und 2021 eA D b (reguläre Grammatik entwickeln, DEA entwickeln); Station 3 an Abi 2022 eA D c, 2024 eA B e (nicht regulär begründen); Station 4 an Abi 2023 eA Nachschreibtermin D c, 2024 eA B f (Verarbeitung im Kellerautomaten dokumentieren). **Originale zur Vertiefung:** die genannten Aufgabenteile; Boss-Level C als Abschluss der Welt.'],
      ['Material', 'Folien DS14, AB14 (mit Kopiervorlage Begriffskarten, Stationen 1–4 und Lösungskarten), Merkblatt M10, AutomatenLab „Chomsky-Sortierer“ (#/sortierer?runde=1), „Level-Quiz Welt C“ (#/quiz?welt=C), Boss-Level C mit Erwartungshorizont'],
      ['Vorbereitung', 'Karten-Sets (eine Seite pro Gruppe) kopieren, A3-Blätter und Klebestifte; Stationen 1–4 je 2× an Gruppentischen auslegen, Lösungskarten umgedreht daneben; Boss-Level C kopieren (Erwartungshorizont erst nach Abgabe).'],
    ], { widthsCm: [3.2, 14.2], firstColBold: true, firstColFill: true }),
    D.h2('Verlaufsplan (90 Minuten)'),
    D.table([
      ['Zeit', 'Phase', 'Unterrichtsgeschehen', 'Sozialform / Medien'],
      ['0–20', 'Einstieg', 'App-Spiel „Chomsky-Sortierer“ (eine 10-Karten-Runde, Begründungs-Joker). Auswertung: strittige Karten („aⁿbⁿ mit n ≤ 3“, „Palindrome mit höchstens 5 Zeichen“) → Prinzip „möglichst speziell“, endliche Sprachen sind regulär. Landkarte der Sprachen (Folie). AB-Aufgabe 1.', 'EA/PA, iPads, Folien'],
      ['20–45', 'Erarbeitung', 'Begriffsnetz in 3er-/4er-Gruppen mit dem Karten-Set (AB-Aufgabe 2). Zwei Gruppen präsentieren; Vergleich mit der Musterlösung (Folie). Lücken im Netz werden als „Baustellen“ notiert.', 'GA, A3, Karten'],
      ['45–85', 'Übung', 'Abi-Trainingszirkel: 4 Stationen à ca. 10 min, Selbstkontrolle mit Lösungskarte, BE auf dem Laufzettel (AB-Aufgabe 3). Lehrkraft berät an Station 3 (Begründungen).', 'EA/PA, Stationen'],
      ['85–90', 'Sicherung', 'Punktestand und Schwierigkeiten sammeln, Quiz Welt C als Exit (#/quiz?welt=C) oder zu Hause. Boss-Level C als Hausaufgabe ausgeben.', 'UG'],
    ], { widthsCm: [1.6, 2.4, 10.2, 3.2], size: 19 }),
    D.h2('Lösungen AB14'),
    D.h3('Aufgabe 1 – Nach dem Chomsky-Sortierer'),
    D.table([['Sprache', 'Typ', 'Maschine', 'Begründung'], ...sol], { widthsCm: [4.6, 1.2, 3.2, 8.4], size: 19 }),
    D.h3('Aufgabe 2 – Begriffsnetz (Musterlösung)'),
    D.img(IMG + 'begriffsnetz.png', { widthCm: 17.2, caption: 'Mögliches Begriffsnetz. Teal: Sprachklassen, Ocker: Grammatik-Begriffe. Die Karten Zustand, Endzustand, Keller, Nichtterminal, Startsymbol, Teilmengenkonstruktion werden als Bestandteile an DEA/NKA/Grammatik angehängt.' }),
    D.p('Bewertungskriterien für die Präsentation: fachlich korrekte Pfeilrichtung („DEA erkennt reguläre Sprachen“, nicht umgekehrt), Beispiel aus dem Unterricht, Unterscheidung zwischen **erzeugen** (Grammatik) und **erkennen/akzeptieren** (Automat).', { size: 20 }),
    D.h3('Aufgabe 3 – Trainingszirkel'),
    D.p('Die vollständigen Lösungen mit BE-Verteilung stehen auf den Lösungskarten am Ende des AB. Ergänzende Hinweise:', { size: 20 }),
    ...D.bullets([
      'Station 1b: Häufiger Fehler „gleich viele a, f und c“ – f ist unabhängig von n.',
      'Station 2c: Ein „direkter“ DEA ohne Rezept ist gleichwertig, wenn er dieselbe Sprache akzeptiert; die Zustände S0–S4 entsprechen den Nichtterminalen plus neuem Endzustand.',
      'Station 3a: Volle BE nur mit konkreten Wörtern (aⁱfcⁱ / aʲfcⁱ) und explizitem Schubfachprinzip.',
      'Station 4a: Erste Zeile S0 | # | – | –; der letzte Schritt ist ein ε-Übergang (#, ε) : # in den Endzustand S3. Variante zur Differenzierung: afcc (nicht akzeptiert – aus S2 gibt es mit # oben keinen c-Übergang).',
    ]),
    D.h2('Einsatz des Boss-Levels C'),
    ...D.bullets([
      '**Rahmen:** Hausaufgabe nach Level 14, Bearbeitungszeit ca. 70 Minuten, 25 BE, Hilfsmittel: Merkblätter M08–M10. Kontext „Lichtregie“ (Bühnenlicht-Skripte) – neu für die SuS.',
      '**Abdeckung:** a–d reguläre Grammatik und DEA (F3, F4, K3), e–g kontextfreie Grammatik, Grenzen endlicher Automaten, Mehrdeutigkeit (F2, F3, K5), h Chomsky-Hierarchie.',
      '**Selbstkontrolle:** Erwartungshorizont nach Abgabe austeilen; SuS korrigieren mit anderer Farbe und notieren BE. Orientierung am üblichen Notenschlüssel (Tabelle im Erwartungshorizont).',
      '**Nachbesprechung (10 min in Level 15):** häufigste Fehler sammeln, insbesondere Teil f (Begründung) und g (zwei *verschiedene* Bäume).',
    ]),
    D.h2('Typische Schwierigkeiten'),
    ...D.warn('Darauf achten', [
      ...D.bullets([
        '**„Grammatik“ und „Sprache“ verwechselt:** Eine kontextfreie Grammatik kann eine reguläre Sprache erzeugen – die Einordnung erfolgt nach der **Sprache** (möglichst speziell).',
        '**Endliche Sprachen** werden zu hoch eingeordnet („sieht aus wie aⁿbⁿ“).',
        '**Erkennen vs. erzeugen:** Automaten erkennen/akzeptieren, Grammatiken erzeugen.',
        '**Typ 1/0** ist Ausblick: Begründung „ein Keller reicht nicht“ genügt, kein Beweis erwartet.',
      ]),
    ]),
    D.h2('Differenzierung'),
    ...D.bullets([
      '**Basis:** Aufgabe 1 mit Merkblatt M10; im Zirkel Stationen 1 und 4 zuerst.',
      '**Standard:** alle Stationen.',
      '**Profi:** Station 3 ohne Merkblatt; Zusatz: Grammatik für aⁿfᵐcⁿ so verändern, dass m ≥ n gilt (Kellerautomat? Grammatik?).',
    ]),
    D.h2('Hausaufgabe'),
    D.p('Boss-Level C „Die Lichtregie“ (ca. 70 min) bearbeiten; Quiz Welt C (#/quiz?welt=C), falls nicht in der Stunde geschafft.'),
  ];
  return D.save(D.doc({ kind: 'LK', ds: 14, title: T, subtitle: SUB, kernfrage: KF, body }), OUT + `DS14_Lehrkraft_${FILE}.docx`);
}

// =====================================================================================  Folien
async function folien() {
  const d = S.deck({ ds: 14, title: T });
  d.title({ title: T, subtitle: SUB, kernfrage: KF, notes: 'Letztes Level von Welt C. Heute: Überblick, Vernetzung, Abi-Training. Hausaufgabe: Boss-Level C.' });
  d.section({ phase: 'Einstieg', title: 'Der Chomsky-Sortierer' });
  d.app({ title: 'Chomsky-Sortierer', phase: 'Einstieg', route: '#/sortierer?runde=1', text: '10 Sprachkarten, drei Fächer: **DEA reicht** – **Kellerautomat nötig** – **mehr nötig**. Setze bei unsicheren Karten den **Begründungs-Joker**: Notiere deine Begründung, bevor du einsortierst.', notes: 'Ca. 8 Minuten spielen, dann Auswertung. Strittige Karten an die Tafel.' });
  d.question({ text: 'Warum ist „aⁿbⁿ mit n ≤ 3“ regulär – aber aⁿbⁿ nicht?', sub: 'Und warum reicht für aⁿbⁿcⁿ nicht einmal ein Kellerautomat?', notes: 'aⁿbⁿ mit n ≤ 3: nur drei Wörter – endliche Sprachen sind immer regulär. aⁿbⁿcⁿ: Ein Keller kann nur einmal abgebaut werden; zwei Vergleiche gleichzeitig gehen nicht (Ausblick Level 16).' });
  d.image({ title: 'Die Landkarte der Sprachen', img: IMG + 'chomsky.png', caption: 'Typ 3 ⊂ Typ 2 ⊂ Typ 1 ⊂ Typ 0 – jede reguläre Sprache ist auch kontextfrei.', notes: 'Noam Chomsky (Linguist, 1956): Sprachklassen nach der Form der Grammatikregeln. Für uns entscheidend: Typ 3 und Typ 2.' });
  d.table({ title: 'Die Chomsky-Hierarchie', rows: HIER, colW: [1.2, 3.4, 3.8, 3.7], size: 20, notes: 'Typ 1 (kontextsensitiv) und Typ 0 nur als Ausblick (Ergänzung über den Kern).' });
  d.bullets({ title: 'Möglichst speziell wählen', items: [
    'Ist eine Sprache **regulär**, gib eine **rechtsreguläre Grammatik** bzw. einen **DEA** an.',
    'Nur wenn sie **nicht regulär** ist (Schubfachprinzip!), brauchst du Kellerautomat bzw. kontextfreie Grammatik.',
    'Einordnung immer nach der **Sprache**, nicht nach der zufällig gegebenen Grammatik (Hostnamen!).',
    '**Endliche** Sprachen sind immer regulär.',
    'Im Abitur: „Beurteilen Sie, ob ein DEA genügt …“ → über die Sprache argumentieren.',
  ], notes: 'Typische Abi-Falle: Eine kontextfreie Grammatik ist gegeben, die Sprache ist aber regulär (Abi 2025 Nachschreibtermin B b, Abi 2023 eA D).' });
  d.section({ phase: 'Erarbeitung', title: 'Das Begriffsnetz' });
  d.task({ title: 'Begriffsnetz in Gruppen', phase: 'Erarbeitung', steps: [
    'Schneidet die **Begriffs- und Verbindungskarten** aus.',
    'Legt sie auf A3 und verbindet sie mit beschrifteten **Pfeilen**.',
    'Mindestens **12 Verbindungen**, jede Karte mindestens einmal.',
    'Achtet auf **erzeugen** (Grammatik) vs. **erkennen** (Automat).',
    'Zwei Gruppen präsentieren, dann Vergleich mit der Musterlösung.',
  ], zeit: '25 min', sozialform: 'Gruppen à 3–4', material: 'Karten-Set, A3, Kleber', notes: 'Lehrkraft geht herum und fragt nach Beispielen: „Welche Sprache aus dem Unterricht passt hierhin?“' });
  d.image({ title: 'Ein mögliches Begriffsnetz', img: IMG + 'begriffsnetz.png', caption: 'Teal: Sprachklassen · Ocker: Grammatik-Begriffe', maxH: 5.0, notes: 'Musterlösung erst nach den Präsentationen zeigen. Fehlende Verbindungen der Gruppen ergänzen lassen.' });
  d.section({ phase: 'Übung', title: 'Abi-Trainingszirkel' });
  d.table({ title: 'Vier Stationen im Abi-Format', phase: 'Übung', rows: [['Station', 'Schwerpunkt', 'Operatoren', 'BE'], ...STATIONEN], colW: [1.8, 3.2, 5.6, 1.5], size: 22, notes: 'Je ca. 10 Minuten. Lösungskarten liegen umgedreht an den Stationen. Laufzettel: AB-Aufgabe 3.' });
  d.cards({ title: 'Operatoren-Check', phase: 'Übung', cards: [
    { head: 'Analyse', text: '**Untersuchen:** ableiten oder Stelle benennen, an der keine Regel passt. **Beschreiben:** Struktur + Bedeutung der Nichtterminale.', icon: 'LuSearch' },
    { head: 'Entwurf', text: '**Entwickeln:** erst überlegen, was man sich merken muss; Grammatik mit N, T, Startsymbol, Regeln; testen.', icon: 'LuPencilRuler' },
    { head: 'Begründung', text: '**Begründen:** Schubfachprinzip mit konkreten Wörtern; Einordnung über die Sprache.', icon: 'LuScale' },
    { head: 'Dokumentation', text: '**Dokumentieren:** Kellertabelle im Abi-Format, erste Zeile S0 | # | – | –, Akzeptanz angeben.', icon: 'LuTable' },
  ], size: 18, notes: 'Kurz vor dem Zirkel vorstellen; während des Zirkels sichtbar lassen.' });
  d.task({ title: 'Auftrag: Trainingszirkel', steps: [
    'Startet an der Station auf eurem Tisch, dann im Uhrzeigersinn.',
    'Bearbeitet die Aufgabe in **Sie-Form** wie im Abitur (ca. 10 min).',
    'Kontrolliert mit der **Lösungskarte** und tragt eure BE ein.',
    'Fehler markieren und in einem Satz notieren, was ihr beim nächsten Mal anders macht.',
  ], zeit: '40 min', sozialform: 'Einzel / Partner', material: 'AB14 (Stationen 1–4)', app: '#/quiz?welt=C', notes: 'Wer früher fertig ist: Level-Quiz Welt C.' });
  d.section({ phase: 'Sicherung', title: 'Welt C geschafft – fast!' });
  d.merke({ title: 'Merke: Die Landkarte der Sprachen', items: [
    '**Typ 3 regulär:** DEA/NEA ↔ rechtsreguläre Grammatik.',
    '**Typ 2 kontextfrei:** Kellerautomat ↔ kontextfreie Grammatik.',
    '**Typ 1/0:** Turingmaschine (Ausblick Level 16).',
    'Immer die **speziellste** passende Maschine bzw. Grammatik wählen – entschieden wird über die **Sprache**.',
  ], img: IMG + 'chomsky.png', imgW: 4.6 });
  d.end({ title: 'Boss-Level C wartet', items: ['Chomsky-Hierarchie und „möglichst speziell“', 'Begriffsnetz der Einheit', 'Abi-Training: Analyse, Entwurf, Begründung, Dokumentation'], hausaufgabe: 'Boss-Level C „Die Lichtregie“ (ca. 70 min, 25 BE) – Hilfsmittel: Merkblätter M08–M10. Selbstkontrolle mit dem Erwartungshorizont in der nächsten Stunde.' });
  return d.save(OUT + `DS14_Folien_${FILE}.pptx`);
}

// =====================================================================================  Boss-Level C
const B1 = W.abi(['S', 'A', 'B', 'C'], ['r', 'g', 'b', 'h', 'd', ';'], 'S', J.b1_rules);
const B2 = W.abi(['S', 'K', 'F', 'H'], ['r', 'g', 'b', 'h', 'd', ';', '[', ']'], 'S', J.b2_rules);
const TEILE = [
  ['a', 'Untersuchen Sie, ob die Skripte `rhd;bh;`, `gh;;` und `r;h;` von der Grammatik G1 erzeugt werden.', 3, 'I'],
  ['b', 'Erläutern Sie die Bedeutung der Nichtterminale B und C im Sachzusammenhang.', 2, 'II'],
  ['c', 'Entwickeln Sie den Zustandsgraphen eines deterministischen endlichen Automaten, der genau die von G1 erzeugten Skripte akzeptiert. Auf die Darstellung des Fehlerzustands kann verzichtet werden.', 4, 'II'],
  ['d', 'Aus technischen Gründen darf eine Szene höchstens drei Helligkeitsänderungen enthalten. Verändern Sie G1 so, dass genau die zulässigen Skripte erzeugt werden. Die Grammatik soll regulär bleiben.', 3, 'II'],
  ['e', 'Zeigen Sie, dass das Skript `[rh;[gd;]]bh;` von der Grammatik G2 erzeugt wird.', 3, 'I'],
  ['f', 'Begründen Sie, dass es keinen deterministischen endlichen Automaten gibt, der genau die LiSa2-Skripte akzeptiert.', 4, 'III'],
  ['g', 'Eine Kollegin schlägt vor, in G2 die Regel S → KS | K durch S → SS | K zu ersetzen. Zeigen Sie, dass die so entstehende Grammatik mehrdeutig ist, indem Sie für das Skript `rh;gh;bh;` zwei verschiedene Ableitungsbäume angeben.', 3, 'II'],
  ['h', 'Ordnen Sie die Sprachen LiSa und LiSa2 in die Chomsky-Hierarchie ein und geben Sie jeweils die möglichst spezielle Maschine an, mit der die Skripte geprüft werden können. Begründen Sie Ihre Zuordnung.', 3, 'II'],
];

async function boss() {
  const body = [
    D.p('**Hinweise:** Bearbeitungszeit ca. 70 Minuten, insgesamt 25 BE. Hilfsmittel: Merkblätter M08–M10. Bearbeiten Sie die Aufgabe wie im Abitur auf separatem Papier.', { size: 20 }),
    D.h2('Aufgabe: Die Lichtregie'),
    D.p('Die Bühnentechnik der Schulaula wird über die Steuersprache **LiSa** (Licht-Skript-Sprache) programmiert. Eine **Szene** beginnt mit der Wahl einer Farbe – **r** (rot), **g** (grün) oder **b** (blau). Danach folgt mindestens eine Helligkeitsänderung – **h** (heller) oder **d** (dunkler). Abgeschlossen wird die Szene mit einem Semikolon **;**. Ein **Skript** besteht aus mindestens einer Szene, z. B. `rhh;bd;`. Die Grammatik G1 in Abbildung 1 im Material erzeugt genau die LiSa-Skripte.'),
    ...TEILE.slice(0, 4).map(([l, t, n]) => D.sub(l, `${t}${be(n)}`)),
    D.p('In der neuen Version **LiSa2** können Szenen zu **Effekt-Blöcken** in eckigen Klammern zusammengefasst werden. Ein Effekt-Block enthält mindestens eine Szene oder einen weiteren Effekt-Block; Effekt-Blöcke dürfen beliebig tief verschachtelt werden, z. B. `[rh;[gd;]]bh;`. Die Grammatik G2 in Abbildung 2 erzeugt genau die LiSa2-Skripte.', { before: 120 }),
    ...TEILE.slice(4).map(([l, t, n]) => D.sub(l, `${t}${be(n)}`)),
    D.h2('Material'),
    W.side(W.gram(B1, { widthCm: 8.4, caption: 'Abbildung 1: Grammatik G1 der Sprache LiSa' }), W.gram(B2, { widthCm: 8.4, caption: 'Abbildung 2: Grammatik G2 der Sprache LiSa2' }), 8.7),
    D.small('Hinweis: Die Nichtterminale von G2 stehen für S – Skript, K – Szene oder Effekt-Block, F – Farbe, H – Folge von Helligkeitsänderungen.'),
  ];
  return D.save(D.doc({ kind: 'Boss-Level', title: 'Boss-Level C: Die Lichtregie', subtitle: 'Abi-artige Aufgabe · Formale Sprachen · 25 BE', metaText: 'Boss-Level C  ·  Welt C · Formale Sprachen', code: 'Boss-Level C · Formale Sprachen', body }), OUT + 'BossLevel_C_Formale-Sprachen.docx');
}

async function eh() {
  const row = (l, kids) => {
    const t = TEILE.find((x) => x[0] === l);
    return [[D.p(`**${l})**`, { size: 20, after: 0 })], [kids].flat(Infinity), String(t[2]), t[3]];
  };
  const P = (s) => D.p(s, { size: 19, after: 60 });
  const rows = [
    ['Teil', 'Erwartete Leistung', 'BE', 'AFB'],
    row('a', [P(`\`rhd;bh;\` wird erzeugt: ${ar(J.b1_deriv)} (1 BE).`), P('`gh;;` wird nicht erzeugt: Nach dem ersten ; befindet man sich in C; aus C entsteht nur eine neue Szene (r, g oder b) oder das Ende (ε), aber kein weiteres ; (1 BE).'), P('`r;h;` wird nicht erzeugt: Nach r folgt A, aus A entsteht nur h oder d, nicht ; – jede Szene braucht mindestens eine Helligkeitsänderung (1 BE).')]),
    row('b', [P('**B:** In der aktuellen Szene ist eine Farbe gewählt und mindestens eine Helligkeitsänderung erfolgt; es dürfen weitere Änderungen folgen oder die Szene wird mit ; abgeschlossen (1 BE).'), P('**C:** Die letzte Szene ist abgeschlossen; das Skript darf hier enden (C → ε) oder mit einer neuen Szene fortgesetzt werden (1 BE).')]),
    row('c', [P('DEA nach dem Übersetzungsrezept (S0 = S, S1 = A, S2 = B, S3 = C; S3 Endzustand wegen C → ε). Bewertung: Zustände mit Start- und Endzustand 1 BE, Übergänge 3 BE (je Zustand mit seinen ausgehenden Übergängen ca. 1 BE; der Fehlerzustand darf laut Aufgabenstellung fehlen).'), ...D.img(IMG + 'boss_dea.png', { widthCm: 9.5, caption: 'Σ = {r, g, b, h, d, ;}. ' + FEHLER })]),
    row('d', [P('Nichtterminale zählen die Helligkeitsänderungen der aktuellen Szene (B1, B2, B3 = eine, zwei, drei Änderungen); aus B3 ist nur noch ; möglich (Struktur 2 BE, Korrektheit 1 BE):'), ...W.gram(J.b1d_rules, { size: 19, widthCm: 8.5 })]),
    row('e', [P(`Ableitung (je Abschnitt Block – innerer Block – letzte Szene 1 BE; ein Ableitungsbaum ist gleichwertig):`), P(ar(J.b2_deriv))]),
    row('f', [P('Annahme: Ein DEA mit k Zuständen akzeptiert genau die LiSa2-Skripte (1 BE). Betrachtet werden die k + 1 Präfixe ε, [, [[, …, [ᵏ. Nach dem Schubfachprinzip endet der DEA bei zwei Präfixen [ⁱ und [ʲ mit i ≠ j im selben Zustand (1 BE).'), P('Hängt man an beide dieselbe Fortsetzung rh; ]ⁱ an, verhält sich der DEA gleich. [ⁱrh;]ⁱ ist ein gültiges Skript, [ʲrh;]ⁱ nicht, da die Anzahl der Klammern nicht übereinstimmt (1 BE). Widerspruch – es gibt keinen solchen DEA; ein endlicher Automat kann die beliebige Schachtelungstiefe nicht speichern (1 BE).')]),
    row('g', [P('Zwei verschiedene Linksableitungen bzw. Bäume (je Baum 1 BE, Begründung der Verschiedenheit 1 BE): Im ersten Baum wird zuerst „rh;gh;“ zu einem Teil zusammengefasst ((rh; gh;) bh;), im zweiten „gh;bh;“ (rh; (gh; bh;)).'),
      W.side([...D.img(IMG + 'boss_mehrdeutig_1.png', { widthCm: 5.8, caption: 'Baum 1: (rh; gh;) bh;' })], [...D.img(IMG + 'boss_mehrdeutig_2.png', { widthCm: 5.8, caption: 'Baum 2: rh; (gh; bh;)' })], 6.3, 12.8)]),
    row('h', [P('**LiSa: Typ 3 (regulär)** – G1 ist rechtsregulär bzw. es gibt den DEA aus c); möglichst spezielle Maschine: **DEA** (1 BE).'), P('**LiSa2: Typ 2 (kontextfrei)** – G2 ist kontextfrei, die Sprache ist nach f) nicht regulär; Maschine: **Kellerautomat**, der für jede öffnende Klammer ein Zeichen ablegt und bei jeder schließenden eines entfernt (2 BE).')]),
    ['', 'Summe', '25', ''],
  ];
  const body = [
    D.p('Erwartungshorizont zum Boss-Level C „Die Lichtregie“. Alle Grammatiken, Automaten und Ableitungen wurden bei der Erstellung automatisch geprüft (Sprachvergleich bis Wortlänge 7–8). Gleichwertige Lösungen sind entsprechend zu bewerten.', { size: 20 }),
    D.table(rows, { widthsCm: [1.2, 13.4, 1.3, 1.5], size: 19, center: [2, 3] }),
    D.h3('Verteilung der Anforderungsbereiche'),
    D.table([['AFB I', 'AFB II', 'AFB III', 'gesamt'], ['6 BE (24 %)', '15 BE (60 %)', '4 BE (16 %)', '25 BE']], { size: 19, allCenter: true }),
    D.h3('Orientierung: Notenpunkte'),
    D.table([
      ['BE', '≥ 24', '≥ 23', '≥ 22', '≥ 20', '≥ 19', '≥ 18', '≥ 17', '≥ 15'],
      ['Punkte', '15', '14', '13', '12', '11', '10', '9', '8'],
      ['BE', '≥ 14', '≥ 13', '≥ 12', '≥ 10', '≥ 9', '≥ 7', '≥ 5', '< 5'],
      ['Punkte', '7', '6', '5', '4', '3', '2', '1', '0'],
    ], { size: 18, allCenter: true, header: false, firstColBold: true, firstColFill: true }),
    D.small('Grundlage: 95 % → 15 Punkte, 90 % → 14, 85 % → 13, 80 % → 12, 75 % → 11, 70 % → 10, 65 % → 9, 60 % → 8, 55 % → 7, 50 % → 6, 45 % → 5, 40 % → 4, 33 % → 3, 27 % → 2, 20 % → 1 (aufgerundet auf ganze BE).'),
  ];
  return D.save(D.doc({ kind: 'Erwartungshorizont', title: 'Boss-Level C: Erwartungshorizont', subtitle: 'Die Lichtregie · Formale Sprachen · 25 BE', metaText: 'Boss-Level C  ·  Welt C · Formale Sprachen', code: 'Boss-Level C · Erwartungshorizont', body }), OUT + 'BossLevel_C_Erwartungshorizont.docx');
}

(async () => {
  const files = [await ab(), await lk(), await folien(), await boss(), await eh()];
  console.log(files.join('\n'));
})();
