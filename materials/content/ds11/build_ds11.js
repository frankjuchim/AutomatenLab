const __MAT = require('path').resolve(__dirname, '../..'); // Wurzel: materials/
// DS11 – Level 11 „Sprache – natürlich oder formal?“ – Arbeitsblatt, Lehrkraft-Handreichung, Folien
const D = require((__MAT + '/lib/docstyle.js'));
const S = require((__MAT + '/lib/deckstyle.js'));
const W = require((__MAT + '/content/ds11/wc.js'));
const IMG = (__MAT + '/build/img/ds11/');
const OUT = (__MAT + '/out/');
const T = 'Sprache – natürlich oder formal?';
const SUB = 'Grammatiken, Ableitungen und Ableitungsbäume';
const KF = 'Wie kann man mit endlich vielen Regeln unendlich viele Wörter oder Sätze beschreiben?';
const J = W.load(11);
const FILE = 'Sprache-natuerlich-oder-formal';

const T1 = ['Der', 'Die', 'Das', 'Hund', 'Igel', 'Katze', 'Ziege', 'Pferd', 'Schaf', 'frisst', 'knabbert', 'trinkt', 'liest', 'Wasser', 'Möhren', 'Äpfel', 'Zeitung', '.'];
const G1 = W.abi(['Start', 'Subjekt', 'Prädikat', 'Objekt', 'Punkt', 'Artikel', 'Nomen'], T1, 'Start', J.g1_rules);
const G2 = W.abi(['S', 'A', 'B'], ['la', 'le', 'lu'], 'S', J.g2_rules);
const SAETZE = ['Das Pferd frisst Äpfel.', 'Die Igel knabbert Möhren.', 'Die Ziege liest Zeitung.', 'Der Katze trinkt.', 'Das Schaf Möhren frisst.', 'Möhren frisst das Schaf.'];

// =====================================================================================  Arbeitsblatt
async function ab() {
  const body = [
    D.p('Willkommen in **Welt C**! Bisher haben Automaten Wörter *geprüft*. Jetzt drehen wir den Spieß um: Eine **Grammatik** ist eine Bauanleitung, mit der man die Wörter (oder Sätze) einer Sprache *erzeugt*.'),
    D.info('Grammatik – die Bauanleitung einer Sprache', [
      ...D.bullets([
        '**Terminalsymbole T** (das **Alphabet**): Zeichen bzw. Wörter, aus denen die fertigen Wörter bestehen.',
        '**Nichtterminalsymbole N**: Platzhalter, die noch ersetzt werden; das **Startsymbol** ist der Anfang.',
        '**Produktionsregeln** A → …: Wodurch darf A ersetzt werden? Alternativen werden mit | getrennt.',
        '**Ableitung** (⇒): In jedem Schritt wird **ein** Nichtterminal ersetzt, bis nur Terminalsymbole übrig sind.',
        '**Sprache L(G)**: alle Wörter aus Terminalsymbolen, die sich vom Startsymbol aus ableiten lassen.',
      ]),
    ]),
    D.task({ nr: 1, title: 'Formal oder natürlich?', niveau: 'Basis', afb: 'I–II', body: [
      D.p('Beim **Satz-Generator** sind diese Sätze entstanden (der letzte wurde von einer Gruppe umgestellt).'),
      D.table([['Satz', 'grammatisch korrekt?  (Syntax)', 'sinnvoll?  (Semantik)'], ...SAETZE.map((s) => [`„${s}“`, '☐ ja    ☐ nein', '☐ ja    ☐ nein'])], { widthsCm: [7.4, 5.0, 5.0], size: 20, center: [1, 2] }),
      D.sub('a', '**Beurteile** jeden Satz: Ist er grammatisch korrekt? Ist er sinnvoll? Kreuze an.'),
      D.sub('b', '**Erläutere** den Unterschied zwischen **Syntax** und **Semantik** an einem Satz aus der Tabelle.'),
      ...D.lines(2),
      D.sub('c', '**Vergleiche** formale Sprachen (z. B. Python) und natürliche Sprachen (z. B. Deutsch) anhand von zwei Aspekten. Wähle in der letzten Zeile einen eigenen Aspekt.'),
      D.fillTable(['Aspekt', 'formale Sprache', 'natürliche Sprache'], 3, { widthsCm: [3.6, 6.9, 6.9], prefill: [['Regeln', '', ''], ['Eindeutigkeit', '', '']], rowHeightCm: 0.95, size: 20 }),
    ] }),
    D.task({ nr: 2, title: 'Mini-Deutsch: Sätze ableiten', niveau: 'Basis', afb: 'I–II', body: [
      D.p('Die Grammatik G1 beschreibt einen kleinen Ausschnitt der deutschen Sprache. Die Terminalsymbole sind hier ganze Wörter.'),
      ...W.gram(G1, { caption: 'Abbildung 1: Grammatik G1 („Mini-Deutsch“)' }),
      D.sub('a', '**Zeige**, dass sich der Satz „Die Ziege trinkt Wasser.“ mit G1 erzeugen lässt. Du darfst die Nichtterminale mit ihren ersten beiden Buchstaben abkürzen (St, Su, Pr, Ob, Pu, Ar, No).'),
      ...D.lines(3),
      D.sub('b', '**Zeichne** den Ableitungsbaum zu diesem Satz: Das Startsymbol steht oben, jede Regelanwendung erzeugt Kinder, die Terminalsymbole bilden – von links nach rechts gelesen – den Satz.'),
      ...D.drawBox(4.4, 'Platz für deinen Ableitungsbaum'),
      D.sub('c', '**Bestimme**, wie viele verschiedene Sätze G1 erzeugt.'),
      ...D.lines(1),
      D.sub('d', '**Nenne** zwei Sätze, die G1 erzeugt, die aber nicht den Regeln der deutschen Grammatik entsprechen. Verwende in den beiden Sätzen – abgesehen vom Punkt – vollständig unterschiedliche Terminalsymbole.'),
      ...D.lines(2),
    ] }),
    D.task({ nr: 3, title: 'Grammatik-Reparatur', niveau: 'Standard', afb: 'II–III', body: [
      D.sub('a', '**Erläutere**, welche Regel der deutschen Sprache von G1 nicht berücksichtigt wird.'),
      ...D.lines(2),
      D.sub('b', '**Verändere** die Produktionsregeln von G1 so, dass ausschließlich grammatisch korrekte Sätze ableitbar sind. Die Terminalsymbole dürfen nicht verändert oder ergänzt werden.'),
      ...D.lines(5),
      D.sub('c', 'Auch mit deiner neuen Grammatik ist „Die Ziege liest Zeitung.“ ableitbar. **Beurteile**, ob man das mit der Grammatik verhindern sollte.'),
      ...D.lines(2),
    ] }),
    D.task({ nr: 4, title: 'Die Glal-Sprache', niveau: 'Standard', afb: 'I–II', body: [
      D.p('Auf dem Planeten Glal besteht jedes Wort aus genau drei Silben. Die Grammatik G2 erzeugt alle Glal-Wörter.'),
      W.side(W.gram(G2, { widthCm: 7.6 }), D.drawBox(3.9, 'Platz für deinen Ableitungsbaum zu b)', { widthCm: 9.4 }), 7.9),
      D.p('Abbildung 2: Grammatik G2 der Glal-Sprache (links)', { size: 18, color: D.C.muted, after: 100 }),
      D.sub('a', '**Gib** alle Wörter der Glal-Sprache **an**.'),
      ...D.lines(2),
      D.sub('b', '**Zeige** durch eine Ableitung, dass „lulelu“ zur Glal-Sprache gehört, und **zeichne** den Ableitungsbaum.'),
      ...D.lines(1),
      D.sub('c', '**Untersuche**, ob die Wörter „lulalu“, „lalule“ und „lalalalu“ zur Glal-Sprache gehören.'),
      ...D.lines(2),
      D.sub('d', 'Die Glal-Bewohner wollen auch längere Wörter: beliebig viele Silben (mindestens eine), das Wort endet immer auf lu. **Entwickle** dafür eine Grammatik mit nur einem Nichtterminal.'),
      ...D.lines(2),
    ] }),
    D.task({ nr: 5, title: 'Grammatik-Detektiv', niveau: 'Profi', afb: 'II–III', body: [
      D.p('Gegeben sind zwei Grammatiken mit N = {S}, T = {a, b} und dem Startsymbol S:'),
      D.p('**G4:**  S → aS | bS | b                  **G5:**  S → aSa | b', { align: 'center', size: 23 }),
      D.sub('a', '**Beschreibe** die Sprachen L(G4) und L(G5) in Worten und **gib** jeweils drei Wörter **an**.'),
      ...D.lines(3),
      D.sub('b', '**Erläutere** am Beispiel von G5, wie eine Grammatik mit endlich vielen Regeln unendlich viele Wörter erzeugen kann.'),
      ...D.lines(2),
      D.sub('c', '**Entwickle** eine Grammatik für die Sprache aller Wörter über {a, b} mit gerader Länge (einschließlich ε).'),
      ...D.lines(2),
    ] }),
    D.qr({ route: '#/rallye', title: 'Ableitungs-Rallye', text: 'Wähle in jedem Schritt die passende Regel für das linkeste Nichtterminal – bis das Zielwort dasteht. Heute: Aufgabe 1 (Glal I), 3 (Glal II) und 4 (Mini-Deutsch).' }),
    D.h3('Selbstcheck – Level 11 geschafft, wenn …'),
    ...D.checklist([
      'ich Syntax und Semantik unterscheiden und formale mit natürlichen Sprachen vergleichen kann.',
      'ich die Bestandteile einer Grammatik (N, T, Startsymbol, Produktionsregeln) benennen kann.',
      'ich zeigen kann, dass ein Wort erzeugt wird (Ableitung mit ⇒, Ableitungsbaum) – oder begründen, warum nicht.',
      'ich die Sprache einer kleinen Grammatik in Worten beschreiben kann.',
    ]),
  ];
  return D.save(D.doc({ kind: 'AB', ds: 11, title: T, subtitle: SUB, kernfrage: KF, body }), OUT + `DS11_AB_${FILE}.docx`);
}

// =====================================================================================  Lehrkraft
async function lk() {
  const umschlag = (nr, name, karten, farbe) => [D.h3(`Umschlag ${nr}: ${name}`), W.cards(karten, { cols: 4, size: 32, h: 1.6 })];
  const body = [
    D.h2('Überblick'),
    D.table([
      ['Aspekt', 'Inhalt'],
      ['Lernziele', 'Die SuS unterscheiden Syntax und Semantik, vergleichen formale und natürliche Sprachen, benennen die Bestandteile einer Grammatik (N, T, Startsymbol, Produktionsregeln), zeigen durch Ableitungen und Ableitungsbäume, dass Wörter erzeugt werden, und beschreiben die von einer Grammatik erzeugte Sprache.'],
      ['KC-Bezug', 'Formale Sprachen (eA): Eigenschaften formaler und natürlicher Sprachen nennen (F1); die von einer Grammatik erzeugte Sprache beschreiben (F2). PK1.1, PK2.2, PK3.1, IK3.1'],
      ['Abi-Bezug', 'Operatoren „zeigen“ (Ableitung), „nennen“, „verändern“, „vergleichen“, „untersuchen“, „beschreiben“. Notation nach Ergänzenden Hinweisen 2025 (N, T, Startsymbol, Produktionsregeln; Ableitung mit ⇒). **Originale zur Vertiefung:** Abi 2023 eA Nachschreibtermin Aufgabe D, Teil a (Mini-Deutsch-Grammatik, Genus-Problem, Vergleich formal/natürlich – Vorlage für AB-Aufgaben 1–3); Abi 2021 eA Aufgabe D, Teil a („Erläutern Sie anhand der Grammatik, dass … kein Wort der Sprache ist“); Abi 2023 eA Aufgabe D, Teil a („Stellen Sie mithilfe der Produktionsregeln dar …“, „Beschreiben Sie die Struktur …“).'],
      ['Material', 'Folien DS11, AB11, Merkblatt M08, Satz-Generator-Umschläge (Kopiervorlage unten), AutomatenLab „Ableitungs-Rallye“ (#/rallye, Aufgaben 1, 3, 4), Exit-Ticket #/quiz?ds=11'],
      ['Vorbereitung', 'Wortkarten für 6–8 Gruppen kopieren (am besten vier Papierfarben, eine je Umschlag), schneiden, in Umschläge stecken. Tafel: Strichliste „Syntax ja/nein × Semantik ja/nein“ vorbereiten.'],
    ], { widthsCm: [3.2, 14.2], firstColBold: true, firstColFill: true }),
    D.h2('Verlaufsplan (90 Minuten)'),
    D.table([
      ['Zeit', 'Phase', 'Unterrichtsgeschehen', 'Sozialform / Medien'],
      ['0–5', 'Einstieg', 'Start in Welt C: Überblick über die Level 11–13 (Pflicht), Level 14 (Vertiefung) und das Boss-Level C (Extra-Training). Perspektivwechsel: Automaten **prüfen** Wörter, Grammatiken **erzeugen** sie.', 'LV, Folien'],
      ['5–20', 'Einstieg', 'Spiel „Satz-Generator“: Jede Gruppe zieht aus jedem Umschlag eine Karte, legt den Satz und liest ihn vor. Die Klasse entscheidet per Handzeichen: grammatisch korrekt? sinnvoll? Strichliste an der Tafel. 3–4 Runden.', 'GA (4er), Umschläge, Tafel'],
      ['20–30', 'Einstieg', 'Auswertung: Vier Felder der Strichliste → Begriffe **Syntax** (Form) und **Semantik** (Bedeutung). AB-Aufgabe 1a gemeinsam. Frage: „Nach welchen Regeln habt ihr die Karten gelegt?“ → Satzbauplan Artikel – Nomen – Verb – Objekt – Punkt.', 'UG, Folien, AB11'],
      ['30–50', 'Erarbeitung', 'Vom Satzbauplan zur Grammatik G1: N, T, Startsymbol, Produktionsregeln. Ableitung von „Das Schaf frisst Möhren.“ Schritt für Schritt (Tabelle mit angewandter Regel), Ableitungsbaum. Glal-Sprache als formales Beispiel; Begriffe Alphabet, Wort, Sprache L(G).', 'LV/UG, Folien, M08'],
      ['50–80', 'Übung', 'AB11 Aufgaben 2–5 (gestuft). Schnelle SuS: Ableitungs-Rallye Aufgaben 1, 3, 4. Zwischensicherung nach ca. 15 min: Aufgabe 2d/3b (Genus-Problem) im Plenum – verschiedene Reparaturen vergleichen.', 'EA/PA, AB11, iPads'],
      ['80–90', 'Sicherung', 'Vergleich formale/natürliche Sprache (AB 1c) im Plenum, Merkblatt M08, Exit-Ticket #/quiz?ds=11. Hausaufgabe erteilen.', 'UG, M08, iPads'],
    ], { widthsCm: [1.6, 2.4, 10.2, 3.2], size: 19 }),
    D.h2('Spiel „Satz-Generator“'),
    D.p('Gruppen à 4 SuS erhalten vier Umschläge. Reihum zieht jede Person blind eine Karte aus „ihrem“ Umschlag; die Karten werden in der Reihenfolge Artikel – Nomen – Verb – Objekt nebeneinandergelegt, der Punkt kommt ans Ende. Die Gruppe liest den Satz laut vor, die Klasse stimmt ab (zwei Daumen: links = grammatisch korrekt, rechts = sinnvoll). Die Lehrkraft führt die Strichliste.'),
    ...D.bullets([
      'Erwartbar sind viele Genus-Fehler („Der Ziege …“) – zwei Drittel aller Kombinationen –, aber auch grammatisch korrekte Unsinnssätze („Die Ziege liest Zeitung.“). Damit sind beide Achsen der Strichliste besetzt.',
      'Impuls nach Runde 2: „Kann ein Satz grammatisch korrekt, aber unsinnig sein? Und umgekehrt?“ → „Der Katze trinkt.“ ist verständlich, aber falsch.',
      'Variante: Eine Gruppe darf die Karten umstellen. „Möhren frisst das Schaf.“ ist korrektes Deutsch – natürliche Sprachen sind flexibel, die Grammatik G1 kann diese Wortstellung aber nicht erzeugen.',
      'Überleitung: Die Kartenregel „erst Artikel, dann Nomen …“ ist bereits eine Grammatik. Wir schreiben sie formal auf.',
    ]),
    D.pageBreak(),
    D.h3('Kopiervorlage: Wortkarten (pro Gruppe ein Satz Umschläge)'),
    ...umschlag(1, 'Artikel', ['Der', 'Die', 'Das', 'Der', 'Die', 'Das', 'Der', 'Die']),
    ...umschlag(2, 'Nomen', ['Hund', 'Igel', 'Katze', 'Ziege', 'Pferd', 'Schaf', 'Hund', 'Katze']),
    ...umschlag(3, 'Verb', ['frisst', 'knabbert', 'trinkt', 'liest']),
    ...umschlag(4, 'Objekt  (Karte „–“ = kein Objekt)', ['Wasser', 'Möhren', 'Äpfel', 'Zeitung', '–', '.', '.', '.']),
    D.small('Die Punkt-Karten („.“) aus Umschlag 4 vorher heraussortieren und jeder Gruppe einzeln geben. Tafel: Strichliste mit den Feldern „Syntax ja/nein“ × „Semantik ja/nein“.'),
    D.pageBreak(),
    D.h2('Lösungen AB11'),
    D.h3('Aufgabe 1 – Formal oder natürlich?'),
    D.table([
      ['Satz', 'Syntax', 'Semantik', 'Kommentar'],
      ['„Das Pferd frisst Äpfel.“', 'ja', 'ja', 'korrekter, sinnvoller Satz'],
      ['„Die Igel knabbert Möhren.“', 'nein', 'ja', 'Genus: *der* Igel'],
      ['„Die Ziege liest Zeitung.“', 'ja', 'nein', 'Form korrekt, Bedeutung absurd (außer im Märchen)'],
      ['„Der Katze trinkt.“', 'nein', 'ja', 'Genus: *die* Katze'],
      ['„Das Schaf Möhren frisst.“', 'nein', 'ja', 'Wortstellung: Im Hauptsatz steht das Verb an zweiter Stelle.'],
      ['„Möhren frisst das Schaf.“', 'ja', 'ja', 'korrekt (Objekt betont), aber mit G1 nicht ableitbar'],
    ], { widthsCm: [5.4, 1.8, 2.0, 8.2], size: 19, center: [1, 2] }),
    ...D.bullets([
      'b) **Syntax** = Regeln für die Form (welche Zeichen/Wörter in welcher Reihenfolge stehen dürfen); **Semantik** = Bedeutung. „Die Ziege liest Zeitung.“ ist syntaktisch korrekt, semantisch aber unsinnig.',
    ]),
    D.p('c) Mögliche Aspekte (zwei genügen):', { after: 60 }),
    D.table([
      ['Aspekt', 'formale Sprache', 'natürliche Sprache'],
      ['Regeln', 'vollständig und fest definiert (Grammatik), keine Ausnahmen', 'historisch gewachsen, viele Ausnahmen, Regeln ändern sich (Sprachwandel)'],
      ['Eindeutigkeit', 'in der Regel eindeutig (Programme müssen eindeutig interpretierbar sein)', 'oft mehrdeutig: „Ich sah den Mann mit dem Fernglas.“'],
      ['Bedeutung', 'exakt festgelegt, unabhängig vom Kontext', 'kontextabhängig (Ironie, Betonung, Situation)'],
      ['Wortschatz', 'endliches, festgelegtes Alphabet', 'offen, ständig neue Wörter („googeln“)'],
      ['Fehlertoleranz', 'schon ein Syntaxfehler verhindert die Übersetzung', 'Verständigung trotz Fehlern möglich'],
    ], { widthsCm: [3.0, 7.2, 7.2], size: 19, firstColBold: true }),
    D.h3('Aufgabe 2 – Mini-Deutsch'),
    D.p('a) Ableitung (in jedem Schritt wird das linkeste Nichtterminal ersetzt):', { after: 40 }),
    ...W.deriv(J.g1_deriv, { block: true }),
    D.p('b) Ableitungsbaum:', { before: 80, keepNext: true }),
    D.img(IMG + 'baum_ziege.png', { widthCm: 8.5 }),
    ...D.bullets([
      `c) Mit Objekt: 3 · 6 · 4 · 4 = 288 Sätze, ohne Objekt: 3 · 6 · 4 = 72 Sätze, zusammen **${J.g1_counts.alle} Sätze**. Davon sind nur ${J.g1_counts.richtig} genus-korrekt.`,
      'd) z. B. „Die Hund frisst Wasser.“ und „Das Igel trinkt Möhren.“ (Genus von Artikel und Nomen passt nicht). Weitere: „Der Katze liest Zeitung.“, „Die Pferd knabbert.“',
    ]),
    D.h3('Aufgabe 3 – Grammatik-Reparatur'),
    ...D.bullets([
      'a) Der Artikel muss im **Genus** (grammatischen Geschlecht) mit dem Nomen übereinstimmen: der Hund/Igel, die Katze/Ziege, das Pferd/Schaf. G1 wählt Artikel und Nomen unabhängig voneinander.',
      'b) Eine mögliche Lösung (Terminalsymbole unverändert, Regel für Artikel entfällt):',
    ]),
    ...W.gram(J.g1k_rules, { size: 20 }),
    D.p('Alternative: Subjekt → ArtikelM NomenM | ArtikelF NomenF | ArtikelN NomenN mit ArtikelM → Der usw. Das Programm zur Materialerstellung hat geprüft: Die veränderte Grammatik erzeugt genau die ' + J.g1_counts.richtig + ' genus-korrekten Sätze. Ableitung zum Vergleich:', { size: 20 }),
    W.deriv(J.g1k_deriv, { size: 20 }),
    ...D.bullets([
      'c) „Die Ziege liest Zeitung.“ ist ein **Semantik**-Problem, kein Syntax-Problem. Für diese kleine Welt könnte man Verben und Objekte koppeln (trinkt → Wasser, liest → Zeitung …), allgemein lässt sich „Sinn“ aber nicht durch Grammatikregeln erfassen (Kontext, Weltwissen, Märchen, Ironie). Grammatiken legen die **Syntax** fest – die Bedeutung wird getrennt definiert.',
    ]),
    D.h3('Aufgabe 4 – Glal-Sprache'),
    ...D.bullets([
      `a) Die ${J.g2_words.length} Wörter: ${J.g2_words.join(', ')}.`,
    ]),
    D.p(`b) ${J.g2_deriv_lulelu.join(' ⇒ ')}`, { keepNext: true, indent: 400 }),
    D.img(IMG + 'baum_glal_lulelu.png', { widthCm: 3.2 }),
    ...D.bullets([
      `c) „lulalu“ gehört dazu: ${J.g2_deriv_lulalu.join(' ⇒ ')}. „lalule“ gehört nicht dazu: Die dritte Silbe entsteht nur mit B → lu, sie ist also immer lu. „lalalalu“ gehört nicht dazu: Nach der Regel B → lu ist kein Nichtterminal mehr vorhanden; jede Ableitung hat genau drei Schritte und erzeugt genau drei Silben.`,
      `d) S → laS | leS | luS | lu, z. B. ${J.g2u_deriv.join(' ⇒ ')}.`,
    ]),
    D.h3('Aufgabe 5 – Grammatik-Detektiv'),
    ...D.bullets([
      `a) L(G4): alle Wörter über {a, b}, die auf b enden (z. B. b, ab, abab: ${J.g4_deriv.join(' ⇒ ')}). L(G5) = {aⁿbaⁿ | n ≥ 0}: ein b in der Mitte, links und rechts gleich viele a (z. B. b, aba, aabaa: ${J.g5_deriv.join(' ⇒ ')}).`,
      'b) Die Regel S → aSa enthält auf der rechten Seite wieder S (**Rekursion**). Sie kann beliebig oft angewendet werden; jede Anwendung verlängert das Wort um zwei a. Die Regel S → b beendet die Ableitung. So entstehen aus zwei Regeln unendlich viele Wörter.',
      `c) z. B. S → aT | bT | ε,  T → aS | bS  (S: bisher gerade Länge, T: ungerade). Ableitung: ${J.g6_deriv.join(' ⇒ ')}. Alternative: S → aaS | abS | baS | bbS | ε.`,
    ]),
    D.img(IMG + 'baum_g5.png', { widthCm: 4.2, caption: 'Ableitungsbaum zu aabaa (G5): Die Rekursion ist als „Schachtelung“ sichtbar.' }),
    D.h2('Typische Schwierigkeiten'),
    ...D.warn('Darauf achten', [
      ...D.bullets([
        '**→ und ⇒ verwechselt:** → steht in Regeln, ⇒ verbindet Satzformen in einer Ableitung.',
        '**Mehrere Ersetzungen in einem Schritt:** Im Abitur wird pro Schritt ein Nichtterminal ersetzt. Ableitungen „abkürzen“ führt zu Punktverlust.',
        '**Ableitung bricht zu früh ab:** Eine Ableitung ist erst fertig, wenn nur noch Terminalsymbole übrig sind („Die Ziege trinkt Wasser Punkt“ ist kein Wort der Sprache).',
        '**„Nicht ableitbar“ ohne Begründung:** Beim Untersuchen muss gezeigt werden, *welche* Regel fehlt bzw. warum keine Ableitung existiert (Aufgabe 4c).',
        '**Syntax vs. Semantik:** SuS wollen „unsinnige“ Sätze per Grammatik verbieten – Grammatiken regeln die Form, nicht die Bedeutung.',
      ]),
    ]),
    D.h2('Differenzierung'),
    ...D.bullets([
      '**Basis:** Aufgaben 1 und 2; Hilfe: Satzbauplan auf den Wortkarten vorlegen und jede Karte einem Nichtterminal zuordnen.',
      '**Standard:** Aufgaben 1–4.',
      '**Profi:** Aufgabe 5; Zusatz: Grammatik G1 so erweitern, dass auch „Möhren frisst das Schaf.“ entsteht (Problem: Großschreibung am Satzanfang – Terminalalphabet erweitern).',
      'Für Schnelle: Ableitungs-Rallye Aufgaben 1–4, dann Aufgabe 2 (aⁿbⁿ) als Vorgriff auf Level 13.',
    ]),
    D.h2('Hausaufgabe'),
    D.p('AB11 Aufgabe 5 (falls noch nicht bearbeitet) und Ableitungs-Rallye Aufgaben 1–4. Zusätzlich: Finde einen mehrdeutigen deutschen Satz (z. B. aus Werbung oder Schlagzeilen) und erläutere seine zwei Bedeutungen.'),
  ];
  return D.save(D.doc({ kind: 'LK', ds: 11, title: T, subtitle: SUB, kernfrage: KF, body }), OUT + `DS11_Lehrkraft_${FILE}.docx`);
}

// =====================================================================================  Folien
async function folien() {
  const d = S.deck({ ds: 11, title: T });
  d.title({ title: T, subtitle: SUB, kernfrage: KF, notes: 'Start in Welt C. Bisher: Automaten prüfen Wörter. Jetzt: Grammatiken erzeugen Wörter.' });
  d.cards({ title: 'Welt C: Formale Sprachen', phase: 'Einstieg', cards: [
    { head: 'Level 11', text: 'Sprache – natürlich oder formal? Grammatiken und Ableitungen', icon: 'LuLanguages' },
    { head: 'Level 12', text: 'Grammatik trifft Automat: reguläre Grammatiken', icon: 'LuArrowLeftRight' },
    { head: 'Level 13', text: 'Klammern, Spiegel, Programme: kontextfreie Grammatiken', icon: 'LuBraces' },
    { head: 'Level 14 (Vertiefung)', text: 'Die Landkarte der Sprachen; Boss-Level C als Extra-Training', icon: 'LuMap' },
  ], notes: 'Kurzer Überblick. Level 14 ist Vertiefung (4-Wochen-Variante); Boss-Level C ist ein freiwilliges Abi-Training.' });
  d.section({ phase: 'Einstieg', title: 'Der Satz-Generator' });
  d.task({ title: 'Spiel: Der Satz-Generator', phase: 'Einstieg', steps: [
    'Jede Gruppe hat vier Umschläge: **Artikel**, **Nomen**, **Verb**, **Objekt**.',
    'Zieht blind je eine Karte und legt sie in dieser Reihenfolge. Der Punkt kommt ans Ende.',
    'Lest euren Satz laut vor.',
    'Die Klasse stimmt ab: **grammatisch korrekt?** und **sinnvoll?**',
    'Wir führen eine Strichliste – 3 bis 4 Runden.',
  ], zeit: '15 min', sozialform: 'Gruppen à 4', material: 'Umschläge mit Wortkarten', notes: 'Strichliste an der Tafel: 2×2-Feld Syntax ja/nein × Semantik ja/nein. Erwartbar: viele Genus-Fehler, einige Unsinnssätze.' });
  d.question({ text: '„Die Ziege liest Zeitung.“ – Ist dieser Satz richtig?', sub: 'Und was ist mit „Der Katze trinkt.“?', notes: 'Ziel: Zwei Bedeutungen von „richtig“ trennen. Der erste Satz ist grammatisch korrekt, aber unsinnig; der zweite ist verständlich, aber grammatisch falsch.' });
  d.twoCol({ title: 'Syntax oder Semantik?', left: { head: 'Syntax = Form', items: ['Welche Wörter/Zeichen dürfen in welcher Reihenfolge stehen?', '„Der Katze trinkt.“ – Syntaxfehler (Genus)', 'Programmiersprachen: `print(5` – Syntaxfehler'] }, right: { head: 'Semantik = Bedeutung', items: ['Was bedeutet ein (korrekt gebildeter) Satz?', '„Die Ziege liest Zeitung.“ – syntaktisch korrekt, semantisch unsinnig', 'Programmiersprachen: `x = 1 / 0` – korrekt geschrieben, aber sinnlos'] }, notes: 'AB-Aufgabe 1a jetzt gemeinsam bearbeiten. Grammatiken beschreiben die Syntax – nicht die Bedeutung.' });
  d.section({ phase: 'Erarbeitung', title: 'Grammatiken – Bauanleitungen für Sprachen' });
  W.sGram(d, S, { title: 'Der Satzbauplan als Grammatik G1', phase: 'Erarbeitung', lines: [...J.g1_rules], size: 19, leftW: 7.6, items: ['**Startsymbol:** Start', '**Nichtterminale N:** Start, Subjekt, Prädikat, Objekt, Punkt, Artikel, Nomen', '**Terminale T:** Der, Die, Das, Hund, …, Zeitung, .', '**Produktionsregeln:** links ein Nichtterminal, rechts der Ersatz; Alternativen mit |'], notes: 'Aus den Umschlägen wird die Grammatik: Jeder Umschlag ist ein Nichtterminal, jede Karte ein Terminalsymbol. Notation wie im Abitur (Ergänzende Hinweise 2025).' });
  d.table({ title: 'Ableitung: „Das Schaf frisst Möhren.“', phase: 'Erarbeitung', rows: [['Satzform', 'angewandte Regel'], ...J.g1_folie_rules.map((r, i) => [(i ? '⇒ ' : '') + r[0], r[1]])], colW: [6.8, 5.3], size: 18, notes: 'In jedem Schritt wird genau EIN Nichtterminal ersetzt – wir ersetzen immer das linkeste (Linksableitung, wie in der App). Fertig, wenn nur noch Terminale dastehen.' });
  d.image({ title: 'Der Ableitungsbaum', img: IMG + 'baum_schaf.png', caption: 'Wurzel = Startsymbol, innere Knoten = Nichtterminale, Blätter (von links nach rechts) = der Satz', notes: 'Der Baum zeigt die Struktur, unabhängig von der Reihenfolge der Ersetzungen. In Level 13 brauchen wir Bäume, um Mehrdeutigkeit zu zeigen.' });
  W.sGram(d, S, { title: 'Ein formales Beispiel: die Glal-Sprache', phase: 'Erarbeitung', lines: [...W.abi(['S', 'A', 'B'], ['la', 'le', 'lu'], 'S', J.g2_rules), '', 'S ⇒ leA ⇒ lelaB ⇒ lelalu'], size: 20, leftW: 7.0, img: IMG + 'baum_glal.png', imgW: 3.6, notes: 'Jedes Wort hat drei Silben und endet auf lu. Frage: Wie viele Wörter gibt es? (9) Gehört lalule dazu? (Nein – die dritte Silbe ist immer lu.)' });
  d.bullets({ title: 'Fachbegriffe', phase: 'Erarbeitung', items: [
    '**Alphabet**: endliche Menge von Zeichen – bei Grammatiken die Terminalsymbole T',
    '**Wort**: endliche Folge von Zeichen des Alphabets (auch das leere Wort ε)',
    '**Sprache**: Menge von Wörtern; **L(G)** = alle Wörter, die G erzeugt',
    '**Grammatik** G = (N, T, S, P): Nichtterminale, Terminale, Startsymbol, Produktionsregeln',
    '**Ableitung** S ⇒ … ⇒ w: schrittweises Ersetzen von Nichtterminalen',
    '**Ableitungsbaum**: grafische Darstellung einer Ableitung',
  ], notes: 'Parallel im Merkblatt M08 markieren. Abi-Notation: Startsymbol muss angegeben werden, ε ist als rechte Seite zulässig.' });
  d.table({ title: 'Formale und natürliche Sprachen im Vergleich', phase: 'Erarbeitung', rows: [
    ['Aspekt', 'formale Sprache (z. B. Python)', 'natürliche Sprache (z. B. Deutsch)'],
    ['Regeln', 'vollständig festgelegt, keine Ausnahmen', 'gewachsen, viele Ausnahmen, Sprachwandel'],
    ['Eindeutigkeit', 'eindeutig interpretierbar', 'oft mehrdeutig: „Ich sah den Mann mit dem Fernglas.“'],
    ['Bedeutung', 'exakt definiert', 'abhängig von Kontext, Betonung, Ironie'],
    ['Wortschatz', 'festes, endliches Alphabet', 'offen – neue Wörter entstehen'],
  ], colW: [2.6, 4.8, 4.7], size: 18, notes: 'Erst nach der Übungsphase aufdecken (AB 1c). Im Abitur: „Vergleichen Sie anhand zweier Aspekte …“ (Abi 2023 Nachschreibtermin D a).' });
  d.section({ phase: 'Übung', title: 'Arbeitsblatt Level 11' });
  d.task({ title: 'Auftrag: AB11', steps: [
    '**Aufgabe 2** (Basis): Mini-Deutsch ableiten und Baum zeichnen.',
    '**Aufgabe 3** (Standard): Repariere G1 – nur noch korrekte Sätze!',
    '**Aufgabe 4** (Standard): Die Glal-Sprache.',
    'Profis: **Aufgabe 5** – Grammatik-Detektiv.',
    'Fertig? Ableitungs-Rallye: Aufgaben 1, 3 und 4.',
  ], zeit: '30 min', sozialform: 'Einzel → Partner', material: 'AB11, Merkblatt M08', app: '#/rallye', notes: 'Zwischensicherung nach ca. 15 Minuten: Reparaturvorschläge für G1 vergleichen (mit/ohne Artikel-Regeln).' });
  d.app({ title: 'Ableitungs-Rallye', route: '#/rallye', text: 'Wähle für das **linkeste Nichtterminal** eine Regel – Schritt für Schritt bis zum Zielwort. Sackgassen erkennen, Punkte sammeln! Heute: Aufgaben **1**, **3** und **4**.', notes: 'Die App erzwingt Linksableitungen und zeigt den Ableitungsbaum mit. Aufgabe 3 (Glal II) enthält eine Sackgasse.' });
  d.section({ phase: 'Sicherung', title: 'Was wir heute gelernt haben' });
  d.merke({ title: 'Merke: Grammatiken', items: [
    'Eine **Grammatik** G = (N, T, S, P) erzeugt eine Sprache: Nichtterminale, Terminale, Startsymbol, Produktionsregeln.',
    'Ein Wort gehört zu **L(G)**, wenn es sich vom Startsymbol **ableiten** lässt und nur aus Terminalen besteht.',
    'Mit **rekursiven** Regeln (S → aSa) erzeugen endlich viele Regeln unendlich viele Wörter.',
    'Grammatiken legen die **Syntax** fest, nicht die **Semantik**.',
  ], img: IMG + 'baum_glal.png', imgW: 2.6 });
  d.end({ items: ['Syntax und Semantik', 'Grammatik: N, T, Startsymbol, Produktionsregeln', 'Ableitung mit ⇒ und Ableitungsbaum', 'Formale und natürliche Sprachen vergleichen'], hausaufgabe: 'AB11 Aufgabe 5, Ableitungs-Rallye Aufgaben 1–4. Finde einen mehrdeutigen deutschen Satz und erläutere seine zwei Bedeutungen.' });
  return d.save(OUT + `DS11_Folien_${FILE}.pptx`);
}

(async () => {
  const files = [await ab(), await lk(), await folien()];
  console.log(files.join('\n'));
})();
