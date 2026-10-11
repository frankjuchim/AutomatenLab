const __MAT = require('path').resolve(__dirname, '../..'); // Wurzel: materials/
// DS13 – Level 13 „Klammern, Spiegel, Programme“ – Arbeitsblatt, Lehrkraft-Handreichung, Folien
const D = require((__MAT + '/lib/docstyle.js'));
const S = require((__MAT + '/lib/deckstyle.js'));
const W = require((__MAT + '/content/ds11/wc.js'));
const IMG = (__MAT + '/build/img/ds13/');
const OUT = (__MAT + '/out/');
const T = 'Klammern, Spiegel, Programme';
const SUB = 'Kontextfreie Grammatiken';
const KF = 'Wie beschreibt man Sprachen mit Verschachtelung und Symmetrie?';
const J = W.load(13);
const FILE = 'Klammern-Spiegel-Programme';
const ar = (a) => a.join(' ⇒ ');
const GTZ = W.abi(['S', 'P', 'B'], ['s', 'd', '2', '3', '(', ')', '#'], 'S', J.gtz_rules);
const GH = W.abi(['S', 'L', 'R', 'E', 'D', 'Z'], ['a, b, …, z', '0, 1, …, 9', '-', '.'], 'S', J.gh_rules);
const GW = W.abi(['S', 'V', 'B'], ['wenn', 'dann', 'sonst', 'h', 'k', 'an', 'aus'], 'S', J.gw_rules);
const BAUKASTEN = [
  ['Muster', 'Regel(n)', 'erzeugt'],
  ['Paare von außen nach innen', 'S → aSb | ab', 'aⁿbⁿ (n ≥ 1): ab, aabb, …'],
  ['Spiegel', 'S → 0S0 | 1S1 | 0 | 1 | ε', 'alle Palindrome über {0, 1}'],
  ['Verschachteln und Aneinanderreihen', 'S → (S)S | ε', 'korrekt geklammerte Ausdrücke'],
  ['Wiederholung', 'A → xA | ε', 'beliebig viele x'],
  ['Hintereinander', 'S → AB', 'erst ein A-Teil, dann ein B-Teil'],
];

// =====================================================================================  Arbeitsblatt
async function ab() {
  const body = [
    D.p('„Anna“, „Rentner“, „0110“ – Palindrome, Klammerausdrücke und verschachtelte Programmblöcke haben eines gemeinsam: Zu jedem Anfang gehört ein passendes Ende, egal wie tief verschachtelt. Endliche Automaten scheitern daran (Level 7). **Kontextfreie Grammatiken** schaffen es mit erstaunlich wenigen Regeln.'),
    D.info('Kontextfreie Grammatik – der Muster-Baukasten', [
      D.p('In einer **kontextfreien Grammatik** steht links in jeder Regel **genau ein Nichtterminal**, rechts eine beliebige Folge aus Terminalen und Nichtterminalen (auch ε). Im Abitur ist mit „Grammatik“ ohne Zusatz immer eine kontextfreie Grammatik gemeint. Jede rechtsreguläre Grammatik ist auch kontextfrei.', { size: 21 }),
      D.table(BAUKASTEN, { widthsCm: [4.8, 4.9, 5.6], size: 19, noSpacer: true }),
    ]),
    D.task({ nr: 1, title: 'Spiegel und Klammern', niveau: 'Basis', afb: 'I–III', body: [
      D.p('Gegeben sind **G**~P~:  S → 0S0 | 1S1 | 0 | 1 | ε   und   **G**~K~:  S → (S)S | ε   (jeweils Startsymbol S).'),
      W.side([D.sub('a', '**Zeige**, dass `0110` von G~P~ erzeugt wird, und **zeichne** den Ableitungsbaum (rechts).'), ...D.lines(1), D.sub('b', '**Zeige**, dass `(())()` von G~K~ erzeugt wird.'), ...D.lines(2)], D.drawBox(3.8, 'Ableitungsbaum zu a)', { widthCm: 6.0 }), 11.2),
      D.sub('c', '**Entwickle** eine Grammatik für L = {aⁿcbⁿ | n ≥ 0}, also c, acb, aacbb, …'),
      ...D.lines(1),
      D.sub('d', '**Begründe**, dass es für L keine reguläre Grammatik gibt.'),
      ...D.lines(3),
    ] }),
    D.task({ nr: 2, title: 'Der Tanz-Roboter', niveau: 'Standard', afb: 'I–III', body: [
      D.p('Ein Tanz-Roboter kennt die Befehle **s** (Schritt) und **d** (Drehung). Mit **2(…)** bzw. **3(…)** wird die Befehlsfolge in der Klammer zwei- bzw. dreimal ausgeführt; Wiederholungen dürfen beliebig tief verschachtelt sein. Ein Programm endet mit **#**.'),
      W.side(W.gram(GTZ, { widthCm: 6.6, caption: 'Abbildung 1: Grammatik G~R~' }), D.drawBox(4.6, 'Ableitungsbaum zu b)', { widthCm: 10.4 }), 6.9),
      D.sub('a', '**Gib** das Programm `2(s3(d))#` als Befehlsfolge ohne Wiederholungen und Klammern **an**.'),
      ...D.lines(1),
      D.sub('b', '**Zeige**, dass `3(s2(d))s#` von G~R~ erzeugt wird, und **zeichne** den Ableitungsbaum.'),
      ...D.lines(2),
      D.sub('c', '**Erläutere**, wie G~R~ sicherstellt, dass jede öffnende Klammer wieder geschlossen wird.'),
      ...D.lines(2),
      D.sub('d', '**Begründe**, dass es keine reguläre Grammatik gibt, die genau die Tanz-Programme erzeugt.'),
      ...D.lines(3),
    ] }),
    D.task({ nr: 3, title: 'Hostnamen', niveau: 'Standard', afb: 'I–III', body: [
      D.p('Die Grammatik G~H~ beschreibt vereinfachte Hostnamen wie `mpg-21.de` oder `www.lk-2.de`.'),
      ...W.gram(GH, { caption: 'Abbildung 2: Grammatik G~H~ für Hostnamen' }),
      D.sub('a', '**Stelle** mithilfe der Produktionsregeln **dar**, dass `lk-2.de` von G~H~ erzeugt wird.'),
      ...D.lines(2),
      D.sub('b', '**Beschreibe** die Struktur der Hostnamen, die mit G~H~ erzeugt werden können.'),
      ...D.lines(2),
      D.sub('c', 'Auch `mpg-.de` wird erzeugt. Bei echten Hostnamen darf vor einem Punkt aber kein Minuszeichen stehen. **Verändere** G~H~ entsprechend.'),
      ...D.lines(3),
      D.sub('d', '**Beurteile**, ob es für die Hostnamen aus c) auch eine reguläre Grammatik gibt.'),
      ...D.lines(2),
    ] }),
    D.task({ nr: 4, title: 'Wenn – dann – sonst: mehrdeutig!', niveau: 'Standard', afb: 'II–III', body: [
      D.p('Eine Smart-Home-Sprache steuert die Heizung: **h** = „jemand ist zu Hause“, **k** = „es ist kalt“, **an**/**aus** = Heizung an/aus.'),
      ...W.gram(GW, { caption: 'Abbildung 3: Grammatik G~W~ für Smart-Home-Regeln' }),
      D.sub('a', '**Zeige**, dass es für die Regel `wenn h dann wenn k dann an sonst aus` zwei verschiedene Ableitungsbäume gibt.'),
      W.side(D.drawBox(4.6, 'Ableitungsbaum 1', { widthCm: 8.5 }), D.drawBox(4.6, 'Ableitungsbaum 2', { widthCm: 8.5 }), 8.7),
      D.sub('b', '**Erläutere** die beiden Interpretationen: Was passiert jeweils, wenn niemand zu Hause ist?'),
      ...D.lines(2),
      D.sub('c', '**Verändere** G~W~ so, dass verschachtelte Verzweigungen eindeutig interpretierbar sind. Du darfst das Alphabet verändern.'),
      ...D.lines(3),
    ] }),
    D.task({ nr: 5, title: 'Kommentare im Kommentar', niveau: 'Profi', afb: 'II–III', body: [
      D.p('Im Quelltext der Sprache *KomCode* steht **z** für ein beliebiges Zeichen und **n** für einen Zeilenumbruch. **//** leitet einen Zeilenkommentar ein, der mit n endet; darin stehen nur Zeichen z. Blockkommentare stehen zwischen **(∗** und **∗)**; sie dürfen Zeichen, Zeilenumbrüche, Zeilenkommentare und **beliebig tief verschachtelte** Blockkommentare enthalten. Σ = {z, n, //, (∗, ∗)}.'),
      D.sub('a', '**Entwirf** eine kontextfreie Grammatik für KomCode.'),
      ...D.lines(3),
      D.sub('b', '**Zeige** an einem selbst gewählten Beispiel, dass sich mit deiner Grammatik ein Zeilenkommentar innerhalb eines Blockkommentars ableiten lässt.'),
      ...D.lines(2),
      D.sub('c', '**Erläutere**, wie ein Kellerautomat seinen Keller nutzen kann, um zu entscheiden, ob alle Blockkommentare korrekt geschlossen werden.'),
      ...D.lines(2),
    ] }),
    D.qr({ route: '#/rallye?aufgabe=12', title: 'Ableitungs-Rallye: Baum-Modus', text: 'Aufgabe 12 (if-then-else) und 13 (mehrdeutige Terme): Finde zwei verschiedene Ableitungsbäume. Aufgabe 11: Frosch-Sprache mit verschachtelten Wiederholungen.' }),
    D.qr({ route: '#/grammatik', title: 'Grammatik-Tester', text: 'Kontextfreie Challenges: 1 (aⁿbⁿ), 2 (Palindrome), 6 (Klammern), 10 (aⁿb²ⁿ), 11 (gleich viele a und b).' }),
    D.h3('Selbstcheck – Level 13 geschafft, wenn …'),
    ...D.checklist([
      'ich kontextfreie Grammatiken für Muster wie aⁿbⁿ, Palindrome und Klammern entwickeln kann.',
      'ich Ableitungsbäume zeichnen und Mehrdeutigkeit an zwei Bäumen zeigen kann.',
      'ich begründen kann, dass es für eine Sprache keine reguläre Grammatik gibt.',
      'ich erläutern kann, wie ein Kellerautomat Verschachtelung prüft.',
    ]),
  ];
  return D.save(D.doc({ kind: 'AB', ds: 13, title: T, subtitle: SUB, kernfrage: KF, body }), OUT + `DS13_AB_${FILE}.docx`);
}

// =====================================================================================  Lehrkraft
async function lk() {
  const kt = J.km_table.map((r) => [r[0], r[1], r[2] || '–', r[3] || '–']);
  const body = [
    D.h2('Überblick'),
    D.table([
      ['Aspekt', 'Inhalt'],
      ['Lernziele', 'Die SuS entwickeln kontextfreie Grammatiken für Sprachen mit Verschachtelung und Symmetrie, zeichnen Ableitungsbäume, zeigen Mehrdeutigkeit und lösen sie auf, begründen, dass es für eine Sprache keine reguläre Grammatik gibt, und erläutern den Zusammenhang zwischen kontextfreien Grammatiken und Kellerautomaten.'],
      ['KC-Bezug', 'Formale Sprachen (eA): kontextfreie Grammatiken entwerfen (F3), erzeugte Sprache beschreiben (F2); Grenzen endlicher Automaten (K5), Kellerautomat (K6). PK1.5, PK2.3, PK3.2, IK3.4'],
      ['Abi-Bezug', '**Originale zur Vertiefung:** Abi 2022 eA Aufgabe D, Teil c (Frog3/Frog4: verschachtelte Wiederholungen, „Begründen Sie, dass die Sprache Frog4 nicht regulär ist“ – Vorlage für Aufgabe 2); Abi 2021 eA Aufgabe E, Teile c und d (AbiCode2: geschachtelte Blockkommentare, kontextfreie Grammatik, DKA – Vorlage für Aufgabe 5); Abi 2023 eA Aufgabe D, Teile a und b (Hostnamen, IP-Adressen – Vorlage für Aufgabe 3); Abi 2023 eA Nachschreibtermin Aufgabe D, Teil b (if-then-else: zwei Ableitungssequenzen, eindeutige Grammatik – Vorlage für Aufgabe 4).'],
      ['Material', 'Folien DS13, AB13, Merkblatt M10, AutomatenLab „Ableitungs-Rallye“ (#/rallye?aufgabe=12, Aufgaben 11–13) und „Grammatik-Tester“ (#/grammatik, Challenges 1, 2, 6, 10, 11), Exit-Ticket #/quiz?ds=13'],
      ['Vorbereitung', 'Stoppuhr für den Palindrom-Wettbewerb; Tafel: zwei Spalten „Palindrome deutsch“ / „Palindrome über {0, 1}“.'],
    ], { widthsCm: [3.2, 14.2], firstColBold: true, firstColFill: true }),
    D.h2('Verlaufsplan (90 Minuten)'),
    D.table([
      ['Zeit', 'Phase', 'Unterrichtsgeschehen', 'Sozialform / Medien'],
      ['0–15', 'Einstieg', '„Spiegelkabinett“: Palindrom-Wettbewerb (3 min, Gruppen): längstes deutsches Palindrom („Reliefpfeiler“, „Rentner“ …). Dann: alle Palindrome über {0, 1} bis Länge 4 – und welche Regeln erzeugen genau diese? Hinweis aus Level 7/9: kein DEA, aber ein Kellerautomat.', 'GA, Tafel, Folien'],
      ['15–40', 'Erarbeitung', 'Kontextfreie Grammatik (Definition), Muster-Baukasten (aⁿbⁿ, Palindrome, Klammern, Wiederholung, Verkettung). Ableitungsbaum zu (())(). Terme mit Vorrang (E → E+T | T …). Mehrdeutigkeit an a+a*a. Zusammenhang kontextfrei ↔ Kellerautomat am Beispiel aⁿbⁿ. Schema „keine reguläre Grammatik“.', 'LV/UG, Folien, M10'],
      ['40–75', 'Übung', 'AB13 gestuft (1 Basis, 2–4 Standard, 5 Profi). App: Rallye 11–13 (Baum-Modus), Grammatik-Tester Challenges 1, 2, 6, 10, 11. Zwischensicherung zu Aufgabe 2d (Begründung nicht regulär).', 'EA/PA, AB13, iPads'],
      ['75–90', 'Sicherung', 'Aufgabe 4 im Plenum: zwei Bäume für die Smart-Home-Regel an die Tafel, Interpretationen durchspielen, Auflösung mit Endmarke. Merkblatt M10, Exit-Ticket #/quiz?ds=13, Hausaufgabe.', 'UG, M10'],
    ], { widthsCm: [1.6, 2.4, 10.2, 3.2], size: 19 }),
    D.h2('Lösungen AB13'),
    D.h3('Aufgabe 1 – Spiegel und Klammern'),
    W.side([...D.bullets([
      `a) ${ar(J.gp_deriv)}`,
      `b) ${ar(J.gk_deriv)}`,
      `c) S → aSb | c, z. B. ${ar(J.gc_deriv)}.`,
    ])], [...D.img(IMG + 'baum_0110.png', { widthCm: 3.4, caption: 'Baum zu 0110' })], 12.6),
    ...D.bullets([
      'd) Angenommen, es gäbe eine reguläre Grammatik. Dann gäbe es auch einen DEA mit k Zuständen für L. Er liest die k + 1 Präfixe ε, a, aa, …, aᵏ. Nach dem Schubfachprinzip landet er für zwei davon, aⁱ und aʲ mit i ≠ j, im selben Zustand. Dann verarbeitet er aⁱcbⁱ und aʲcbⁱ gleich – akzeptiert also beide oder keines. aⁱcbⁱ gehört zu L, aʲcbⁱ nicht. Widerspruch. (Kurz: Der Automat müsste sich die unbeschränkte Anzahl der a merken.)',
    ]),
    D.h3('Aufgabe 2 – Der Tanz-Roboter'),
    ...D.bullets([
      `a) 2(s3(d))# = ${J.tz_expand}  (s ddd, zweimal).`,
      `b) ${ar(J.tz_deriv)}`,
    ]),
    D.img(IMG + 'baum_tanz.png', { widthCm: 5.6, caption: 'Ableitungsbaum zu 3(s2(d))s#' }),
    ...D.bullets([
      'c) Klammern entstehen nur durch die Regeln B → 2(P) und B → 3(P). Diese erzeugen öffnende und schließende Klammer **gleichzeitig**; P wird dazwischen abgeleitet. Daher gehört zu jeder öffnenden Klammer genau eine schließende, und die Verschachtelung ist korrekt.',
      'd) Die Programme 2(2(…2(s)…))# mit n öffnenden und n schließenden Klammern gehören zur Sprache. Ein DEA (bzw. eine reguläre Grammatik mit endlich vielen Nichtterminalen) mit k Zuständen kommt bei den k + 1 Präfixen „2(“, „2(2(“, … nach dem Schubfachprinzip zweimal in denselben Zustand – für i ≠ j öffnende Klammern. Dann behandelt er „2(“ⁱ s )ⁱ# und „2(“ʲ s )ⁱ# gleich, obwohl nur das erste korrekt ist. Also gibt es keine reguläre Grammatik. Nur bei begrenzter Schachtelungstiefe wäre die Sprache regulär.',
    ]),
    D.h3('Aufgabe 3 – Hostnamen'),
    D.p('a) Darstellung (jeweils linkestes Nichtterminal ersetzt):', { after: 40 }),
    D.p(ar(J.gh_deriv), { size: 20, indent: 360 }),
    ...D.bullets([
      'b) Ein Hostname besteht aus einem oder mehreren **Labels**, jeweils gefolgt von einem Punkt, und endet mit einer **Endung aus genau zwei Buchstaben** (E → DD). Jedes Label beginnt mit einem Buchstaben (L → DR), danach folgen beliebig viele Buchstaben, Ziffern und Minuszeichen (R).',
      'c) Ein Label darf nicht mit „-“ enden. Eine mögliche Lösung (L, M ersetzen L, R):',
    ]),
    ...W.gram(J.gh2_rules, { size: 20 }),
    D.p(`Kontrolle: ${ar(J.gh2_deriv)}; mpg-.de ist nicht mehr ableitbar, weil M nie mit „-“ enden kann (alle Regeln für M enden mit M, D oder Z).`, { size: 20 }),
    ...D.bullets([
      'd) Ja. Es wird weder unbeschränkt gezählt noch verschachtelt: Ein Automat muss sich nur merken, ob er am Anfang eines Labels ist, ob das letzte Zeichen ein Minus war und ob nach dem letzten Punkt bisher genau ein bzw. zwei Buchstaben kamen – endlich viele Fälle. Eine rechtsreguläre Grammatik (b = Buchstabe, z = Ziffer; aus einem DEA übersetzt und vom Programm geprüft):',
    ]),
    ...W.gram(J.gh3_rules, { size: 20 }),
    D.p('Die kontextfreie Grammatik G~H~ ist also nur bequemer lesbar; die Sprache selbst ist regulär (vgl. „Grammatik nicht regulär ≠ Sprache nicht regulär“, Level 12).', { size: 20 }),
    D.h3('Aufgabe 4 – Wenn – dann – sonst'),
    D.p('a) Zwei verschiedene Linksableitungen (und damit Bäume):', { after: 40, keepNext: true }),
    ...D.bullets([`1: ${ar(J.gw_derivs[0])}`, `2: ${ar(J.gw_derivs[1])}`], { size: 19 }),
    W.side([...D.img(IMG + 'wenn_baum_1.png', { widthCm: 8.4, caption: 'Baum 1: sonst gehört zum inneren wenn' })], [...D.img(IMG + 'wenn_baum_2.png', { widthCm: 8.4, caption: 'Baum 2: sonst gehört zum äußeren wenn' })], 8.7),
    ...D.bullets([
      'b) **Interpretation 1** (Baum 1): Wenn jemand zu Hause ist: bei Kälte an, sonst aus. Ist niemand zu Hause, passiert nichts. **Interpretation 2** (Baum 2): Wenn jemand zu Hause ist und es kalt ist: an; ist jemand zu Hause und es nicht kalt, passiert nichts; ist **niemand zu Hause**, wird die Heizung **ausgeschaltet**. Dieselbe Regel hätte also unterschiedliche Wirkungen – für ein Programm inakzeptabel.',
      'c) Mit einer Endmarke „ende“ (Alphabet erweitert) – jede Verzweigung wird explizit abgeschlossen:',
    ]),
    ...W.gram(J.gw1_rules, { size: 20 }),
    D.p('Interpretation 1: `wenn h dann wenn k dann an sonst aus ende ende`, Interpretation 2: `wenn h dann wenn k dann an ende sonst aus ende`. Das Programm hat geprüft: Alle Programme bis Länge 14 haben genau einen Ableitungsbaum. **Alternative ohne neues Symbol** (sonst gehört immer zum nächsten wenn; M = vollständige, U = unvollständige Verzweigung; gleiche Sprache wie G~W~, eindeutig):', { size: 20 }),
    ...W.gram(J.gw2_rules, { size: 20 }),
    D.h3('Aufgabe 5 – Kommentare im Kommentar'),
    D.p('a) Mögliche Grammatik (N = {S, K, Z, L}, Startsymbol S; S: Quelltext, K: Blockkommentar, Z: Zeilenkommentar, L: Inhalt eines Zeilenkommentars):', { after: 40 }),
    ...W.gram(J.gkm_rules, { size: 20 }),
    D.p('Der Trick: Ein Blockkommentar enthält wieder einen vollständigen Quelltext S – damit sind Zeilenkommentare und beliebig tief verschachtelte Blockkommentare darin automatisch erlaubt.', { size: 20 }),
    D.p(`b) Beispiel (∗ z // z z n ∗): ${ar(J.gkm_deriv)}`, { size: 20 }),
    D.p('c) Kelleralphabet Γ = {#, K}. Bei jedem (∗ legt der Kellerautomat ein Zeichen K auf den Keller, bei jedem ∗) nimmt er ein K herunter; liegt dabei kein K oben (nur #), gibt es keinen passenden Übergang. Nach // wechselt er in einen Zustand, in dem er Kommentarzeichen ignoriert, bis n kommt. Die Eingabe wird akzeptiert, wenn am Ende wieder # oben liegt (alle Blockkommentare geschlossen) und er in den Endzustand wechseln kann. Ein möglicher NKA und die Verarbeitung von (∗ z (∗ n ∗) ∗):', { size: 20 }),
    W.side([...D.img(IMG + 'kommentar_nka.png', { widthCm: 7.6 })], D.table([['Zustand', 'Belegung Kellerspeicher', 'oberstes Kellersymbol', 'verarb. Eingabezeichen'], ...kt], { size: 17, widthsCm: [1.7, 2.6, 2.5, 2.6], center: [0, 1, 2, 3] }), 7.8),
    D.p('Eingabe wird akzeptiert: ja.', { size: 20 }),
    D.h2('Typische Schwierigkeiten'),
    ...D.warn('Darauf achten', [
      ...D.bullets([
        '**Klammern einzeln erzeugen** (S → (S | S) | ε): erzeugt auch „)(“. Öffnende und schließende Klammer müssen in **derselben** Regel entstehen.',
        '**ε vergessen oder zu viel:** Bei Palindromen fehlen sonst die Wörter gerader bzw. ungerader Länge; bei aⁿbⁿ (n ≥ 1) darf ε nicht erzeugt werden.',
        '**Mehrdeutigkeit mit zwei Ableitungsreihenfolgen verwechselt:** Entscheidend sind zwei verschiedene **Bäume** (bzw. zwei verschiedene Linksableitungen), nicht zwei Reihenfolgen beim Ersetzen.',
        '**„Nicht regulär“ ohne Schubfach-Argument:** „Man kann nicht zählen“ reicht im Abitur nicht – konkrete Wörter, Zustandsanzahl k, Widerspruch.',
        '**„Kontextfreie Grammatik gegeben, also ist die Sprache nicht regulär“?** Falsch (Hostnamen!). Begründung immer über die Sprache führen.',
      ]),
    ]),
    D.h2('Differenzierung'),
    ...D.bullets([
      '**Basis:** Aufgabe 1 (Muster-Baukasten benutzen) und 2a–c; Rallye-Aufgaben 2, 5, 6.',
      '**Standard:** Aufgaben 1–4.',
      '**Profi:** Aufgabe 5; Zusatz: Abi 2021 eA E d (Mealy-Grenze und DKA für AbiCode2) im Original; Grammatik für {aⁱbʲ | i ≠ j}.',
      'Für Schnelle: Grammatik-Tester Challenge 11 (gleich viele a und b) – anspruchsvoll!',
    ]),
    D.h2('Hausaufgabe'),
    D.p('AB13 Aufgabe 4 bzw. 5 fertigstellen, Ableitungs-Rallye Aufgaben 12 und 13 (Baum-Modus). Vorbereitung (Vertiefung Level 14 bzw. Abi-Training): Sortiere aⁿbⁿ, „endet auf ab“, Palindrome und aⁿbⁿcⁿ nach der Maschine, die man mindestens braucht.'),
  ];
  return D.save(D.doc({ kind: 'LK', ds: 13, title: T, subtitle: SUB, kernfrage: KF, body }), OUT + `DS13_Lehrkraft_${FILE}.docx`);
}

// =====================================================================================  Folien
/** Folie mit einer Zeile (Grammatik/Wort) und zwei Bäumen nebeneinander. */
function twoTrees(d, { title, line, l, r, phase, notes }) {
  const s = d.blank({ title, phase, notes });
  d.tb(s, line, { x: 0.6, y: 1.45, w: 12.1, h: 0.5, fontSize: 20, color: '0A4A3F', bold: true });
  [l, r].forEach(([head, img], i) => {
    const x = 0.6 + i * 6.25;
    d.tb(s, head, { x, y: 2.05, w: 5.9, h: 0.45, fontSize: 19, bold: true, color: i ? 'B26A0F' : '0E6455' });
    const f = d.fit(img, 5.95, 4.3);
    s.addImage({ path: img, x: x + (5.95 - f.w) / 2, y: 2.6 + (4.3 - f.h) / 2, w: f.w, h: f.h });
  });
  return s;
}
async function folien() {
  const d = S.deck({ ds: 13, title: T });
  d.title({ title: T, subtitle: SUB, kernfrage: KF, notes: 'Anknüpfung: Level 7 (Grenzen endlicher Automaten), Level 9/10 (Kellerautomaten), Level 11/12 (Grammatiken).' });
  d.section({ phase: 'Einstieg', title: 'Das Spiegelkabinett' });
  d.task({ title: 'Palindrom-Wettbewerb', phase: 'Einstieg', steps: [
    'Findet in 3 Minuten das **längste deutsche Palindrom** (vorwärts wie rückwärts gleich).',
    'Notiert dann **alle Palindrome über {0, 1}** bis zur Länge 4.',
    'Welche **Regeln** erzeugen genau diese Wörter – und keine anderen?',
  ], zeit: '10 min', sozialform: 'Gruppen', material: 'Stoppuhr, Tafel', notes: 'Beispiele: Rentner, Reliefpfeiler, Lagerregal. Über {0, 1} bis Länge 4: ε, 0, 1, 00, 11, 000, 010, 101, 111, 0000, 0110, 1001, 1111.' });
  d.question({ text: 'Welche Regeln erzeugen genau alle Palindrome über {0, 1}?', sub: 'Erinnerung: Kein DEA erkennt die Palindrome (Level 7) – ein Kellerautomat schon (er legt die erste Hälfte in den Keller und vergleicht rückwärts).', notes: 'Idee sammeln: von außen nach innen bauen – links und rechts dasselbe Zeichen.' });
  d.image({ title: 'Von außen nach innen: Palindrome', img: IMG + 'baum_10101.png', caption: `S → 0S0 | 1S1 | 0 | 1 | ε   –   Ableitung: ${ar(J.gp_deriv_10101)}`, maxH: 4.4, notes: 'Mitte: ε (gerade Länge) oder ein Zeichen (ungerade Länge). Ohne ε fehlen 0110 usw.' });
  d.section({ phase: 'Erarbeitung', title: 'Kontextfreie Grammatiken' });
  d.bullets({ title: 'Kontextfrei – was heißt das?', phase: 'Erarbeitung', items: [
    'Jede Regel hat die Form **A → w**: links **genau ein** Nichtterminal, rechts eine beliebige Folge (auch ε)',
    '„kontextfrei“: A darf **unabhängig von seiner Umgebung** ersetzt werden',
    'Im Abitur: „Grammatik“ ohne Zusatz = kontextfreie Grammatik',
    'Rechtsreguläre Grammatiken sind ein **Spezialfall**',
    'Neu möglich: Nichtterminal **in der Mitte** (S → aSb) – erzeugt Paare von außen nach innen',
  ], notes: 'Vergleich mit Level 12: Dort durfte rechts höchstens ein Terminal und dahinter ein Nichtterminal stehen.' });
  d.table({ title: 'Der Muster-Baukasten', phase: 'Erarbeitung', rows: BAUKASTEN, colW: [4.0, 4.0, 4.1], size: 20, notes: 'Die Muster lassen sich kombinieren: z. B. Tanz-Roboter = Wiederholung + Verschachtelung.' });
  d.image({ title: 'Klammerausdrücke als Baum', img: IMG + 'baum_klammern.png', caption: `S → (S)S | ε   –   ${ar(J.gk_deriv)}`, maxH: 4.3, notes: 'Erste Klammergruppe (S), danach der Rest S. Öffnende und schließende Klammer entstehen immer gemeinsam – deshalb passen sie.' });
  d.twoCol({ title: 'Terme mit „Punkt vor Strich“', left: { head: 'Grammatik mit Vorrang', items: ['`E → E+T | T`', '`T → T*F | F`', '`F → (E) | a`', 'E: Summe, T: Produkt, F: Faktor', 'Das Mal-Zeichen liegt **tiefer** im Baum → wird zuerst berechnet'] }, right: { head: 'Baum zu a+a*a', img: IMG + 'baum_term.png' }, notes: 'Rallye-Aufgaben 7 und 8. Die Struktur des Baumes legt die Rechenreihenfolge fest.' });
  twoTrees(d, { title: 'Mehrdeutig: Terme ohne Vorrang', line: 'Grammatik:  E → E+E | E*E | (E) | a      Wort:  a+a*a', l: ['Baum 1: a+(a*a)', IMG + 'term_mehrdeutig_1.png'], r: ['Baum 2: (a+a)*a', IMG + 'term_mehrdeutig_2.png'], notes: 'Eine Grammatik ist mehrdeutig, wenn es ein Wort mit zwei verschiedenen Ableitungsbäumen gibt. Für a = 2: Baum 1 ergibt 6, Baum 2 ergibt 8. Rallye-Aufgabe 13.' });
  d.twoCol({ title: 'Kontextfreie Grammatik und Kellerautomat', left: { head: 'Grammatik für aⁿbⁿ', items: ['`S → aSb | ab`', 'erzeugt aⁿbⁿ von außen nach innen', 'NKA (rechts): jedes a legt A ab, jedes b nimmt ein A weg', 'Zu jeder kontextfreien Grammatik gibt es einen **Kellerautomaten** (NKA) für dieselbe Sprache – und umgekehrt.'] }, right: { head: 'NKA aus Level 9', img: IMG + 'anbn_nka.png' }, notes: 'Satz: Kontextfreie Sprachen = Sprachen, die ein NKA erkennt. (Beweis nicht im KC.) Analog: reguläre Sprachen = Sprachen, die ein DEA erkennt.' });
  d.bullets({ title: 'Begründen: Es gibt keine reguläre Grammatik', phase: 'Erarbeitung', items: [
    '**Annahme:** Es gibt eine reguläre Grammatik – also auch einen DEA mit k Zuständen.',
    '**Präfixe wählen:** aⁱ für i = 1, …, k + 1 (k + 1 Stück)',
    '**Schubfachprinzip:** Zwei Präfixe aⁱ, aʲ (i ≠ j) enden im selben Zustand.',
    '**Fortsetzung:** Mit bⁱ: aⁱbⁱ gehört zur Sprache, aʲbⁱ nicht – der DEA behandelt beide gleich.',
    '**Widerspruch** → keine reguläre Grammatik (die Sprache ist nicht regulär).',
  ], notes: 'Gleiches Schema wie in Level 7 (M05). Bei verschachtelten Klammern: Präfixe „(“ⁱ, Fortsetzung „)“ⁱ.' });
  d.section({ phase: 'Übung', title: 'Arbeitsblatt Level 13' });
  d.task({ title: 'Auftrag: AB13', steps: [
    '**Aufgabe 1** (Basis): Spiegel und Klammern.',
    '**Aufgabe 2** (Standard): Der Tanz-Roboter – verschachtelte Wiederholungen.',
    '**Aufgaben 3 und 4** (Standard): Hostnamen; Wenn – dann – sonst.',
    'Profis: **Aufgabe 5** – Kommentare im Kommentar.',
    'Rallye-Baum-Modus (12, 13) und Grammatik-Tester (1, 2, 6, 10, 11).',
  ], zeit: '35 min', sozialform: 'Einzel → Partner', material: 'AB13, Merkblatt M10', app: '#/rallye?aufgabe=12', notes: 'Zwischensicherung zur Begründung in Aufgabe 2d (Schubfachprinzip).' });
  d.app({ title: 'Grammatik-Tester', route: '#/grammatik', text: 'Kontextfreie Challenges: **1** (aⁿbⁿ), **2** (Palindrome), **6** (Klammern), **10** (aⁿb²ⁿ), **11** (gleich viele a und b). Die App zeigt dir ein Gegenbeispiel, wenn deine Grammatik zu viel oder zu wenig erzeugt.', notes: 'Challenge 11 ist anspruchsvoll: S → aSbS | bSaS | ε.' });
  d.section({ phase: 'Sicherung', title: 'Zu welchem wenn gehört das sonst?' });
  twoTrees(d, { title: 'Zu welchem wenn gehört das sonst?', line: 'wenn h dann wenn k dann an sonst aus      (h: jemand zu Hause, k: kalt)', l: ['Baum 1: sonst zum inneren wenn', IMG + 'wenn_baum_1.png'], r: ['Baum 2: sonst zum äußeren wenn', IMG + 'wenn_baum_2.png'], phase: 'Sicherung', notes: 'Niemand zu Hause: Baum 1 – nichts passiert; Baum 2 – Heizung aus. Auflösung: Endmarke „ende“ oder Grammatik mit vollständigen/unvollständigen Verzweigungen (Lösung in der Handreichung).' });
  d.merke({ title: 'Merke: Kontextfreie Grammatiken', items: [
    'Regeln **A → w** mit genau einem Nichtterminal links; Muster: Paare (aSb), Spiegel, Verschachtelung ((S)S), Wiederholung, Verkettung.',
    '**Mehrdeutig**: ein Wort mit zwei verschiedenen Ableitungsbäumen – Auflösung durch Endmarken oder geschickte Nichtterminale.',
    'Kontextfreie Grammatiken und **Kellerautomaten** beschreiben dieselben Sprachen.',
    '**Keine reguläre Grammatik**: Schubfachprinzip wie bei DEA.',
  ], img: IMG + 'baum_0110.png', imgW: 3.0 });
  d.end({ items: ['Kontextfreie Grammatiken entwerfen (Muster-Baukasten)', 'Ableitungsbäume und Mehrdeutigkeit', 'Kontextfrei ↔ Kellerautomat', '„Keine reguläre Grammatik“ begründen'], hausaufgabe: 'AB13 Aufgabe 4 bzw. 5 fertigstellen, Rallye 12 und 13. Sortiere aⁿbⁿ, „endet auf ab“, Palindrome, aⁿbⁿcⁿ nach der Maschine, die man mindestens braucht.' });
  return d.save(OUT + `DS13_Folien_${FILE}.pptx`);
}

(async () => {
  const files = [await ab(), await lk(), await folien()];
  console.log(files.join('\n'));
})();
