const __MAT = require('path').resolve(__dirname, '../..'); // Wurzel: materials/
// DS15 – Level 15 „Sprachdesign-Studio“ (Mini-Projekt) – Projektauftrag, Lehrkraft-Handreichung, Folien
const D = require((__MAT + '/lib/docstyle.js'));
const S = require((__MAT + '/lib/deckstyle.js'));
const IMG = (__MAT + '/build/img/ds15/');
const OUT = (__MAT + '/out/');
const T = 'Sprachdesign-Studio';
const SUB = 'Mini-Projekt: eine eigene kleine Sprache mit Grammatik, Automat und Übersetzer';
const KF = 'Kannst du eine eigene kleine Sprache entwerfen – mit Grammatik, Automat und Übersetzer?';

const THEMEN = [
  ['Tanzschritte-Code', 'Eine Choreografie als Wort: Schritte (l, r, v, z), Drehung (d), Grundstellung (g), Pose (p). Regeln z. B.: beginnt mit g, endet mit p, eine Drehung nur nach einem Schritt.', 'glrvdp'],
  ['Drohnen-Steuerung', 'Flugprogramme aus Start, Bewegungen und Landung. Achtung: Das Beispielprojekt der Lehrkraft nutzt diese Idee – wer sie wählt, muss sie deutlich erweitern (z. B. Wiederholungsblöcke in Klammern).', 'shv(vd)l'],
  ['Emoji-Nachrichten', 'Nachrichten aus Emoji-Codes, z. B. Σ = {S (Smiley), T (traurig), H (Herz), !, ?}. Regeln z. B.: ein Herz nur direkt nach einem Smiley, jede Nachricht endet mit ! oder ?.', 'SH!'],
  ['Rezept-Sprache', 'Ein Rezept besteht aus Zutaten (z) und Arbeitsschritten (m mischen, k kochen, b backen, w warten). Regeln z. B.: erst Zutaten, dann Schritte; nach k oder b muss ein w folgen.', 'zzmkw'],
  ['Lego-Bauanleitung', 'Steine (r, g, b für Farben) werden zu Lagen gestapelt; Unterbaugruppen stehen in Klammern und werden als Ganzes gesetzt. Verschachtelte Klammern → kontextfrei.', 'r(gb)(r(gg))'],
  ['Schach-Zugnotation light', 'Ein Zug = Figur (K, D, T, L, S oder nichts für einen Bauern) + Feld (a–h, 1–8), optional x für „schlägt“ und + für „Schach“. Eine Partie ist eine Folge von Zügen, getrennt durch Leerzeichen oder Komma.', 'e4,Sf3,Lxc6+'],
  ['Eigene Idee', 'Nach Absprache mit der Lehrkraft. Bedingungen: endliches Alphabet, klare Regeln, mindestens fünf Beispielwörter – und die Sprache muss unendlich viele Wörter haben.', '–'],
];

const OPERATOREN = [
  ['Operator', 'Das ist gefordert', 'AFB'],
  ['nennen / angeben', 'Aufzählen ohne Begründung („Geben Sie zwei Wörter an, die …“).', 'I'],
  ['darstellen', 'Strukturiert wiedergeben: Zustandsfolge, Kellertabelle, Ableitung.', 'I'],
  ['beschreiben', 'In eigenen Worten mit Fachsprache (z. B. die Sprache einer Grammatik).', 'I–II'],
  ['erläutern', 'Verständlich machen mit Bezug zum Sachzusammenhang (Zustand, Keller).', 'II'],
  ['untersuchen / analysieren', 'Nach fachlichen Kriterien herausarbeiten (z. B. äquivalente Zustände).', 'II'],
  ['begründen / zeigen', 'Auf Gesetzmäßigkeiten zurückführen: Ableitung vorführen, „kein DEA“ beweisen.', 'II–III'],
  ['entwickeln / entwerfen', 'Selbstständig ein Modell planen: Automat, Grammatik, Mealy-Automat.', 'II–III'],
  ['ergänzen / erweitern / verändern', 'Ein gegebenes Modell nach Vorgaben anpassen.', 'II'],
  ['beurteilen', 'Ein begründetes Urteil mit Fachwissen fällen (z. B. Eignung eines Modells).', 'III'],
];

// =====================================================================================  Arbeitsblatt (Projektauftrag)
async function ab() {
  const body = [
    D.p('Willkommen im **Sprachdesign-Studio**! In den Levels 1 bis 14 hast du Automaten und Grammatiken untersucht, die andere entworfen haben. Jetzt dreht ihr den Spieß um: Euer Team entwirft eine **eigene kleine formale Sprache** – mit allem, was dazugehört: Grammatik, Automat zur Syntaxprüfung, Mealy-Übersetzer und einer Abi-artigen Aufgabe für ein anderes Team.'),
    D.info('Das Projekt in Kürze', [
      ...D.bullets([
        '**Team:** 3–4 Personen, ein Thema aus der Themenliste (oder eine eigene Idee).',
        '**Zeit:** diese Doppelstunde (90 min) + Fertigstellung als Hausaufgabe. Abgabe der Projektmappe und der Aufgabe für die **Aufgabenbörse** zu Beginn von Level 16.',
        '**Produkt:** Projektmappe (digital oder auf Papier) mit den fünf Bausteinen aus Abschnitt 2 – Notation wie im Abitur (siehe Merkblätter M01–M10).',
        '**Werkzeuge:** flaci.com und AutomatenLab (Grammatik-Tester, Baukasten im freien Modus, Keller-Labor).',
      ]),
    ]),
    D.h2('1  Thema wählen'),
    D.table([['Thema', 'Idee und mögliche Regeln', 'Beispielwort'], ...THEMEN], { widthsCm: [3.4, 11.2, 2.8], size: 18, firstColBold: true }),
    D.p('*Tipp:* Entscheidet früh, ob eure Sprache **regulär** sein soll (dann reicht ein DEA) oder ob ihr **Verschachtelungen** wollt (Klammern, Spiegelungen → kontextfrei, Kellerautomat). Beides ist erlaubt – kontextfrei ist anspruchsvoller.', { size: 20 }),
    D.h2('2  Lieferumfang – die fünf Bausteine'),
    ...D.numbered([
      '**Sprachbeschreibung:** Name und Zweck der Sprache, Alphabet Σ (endlich!), Regeln in Worten, **fünf Beispielwörter** und **drei Nicht-Wörter** mit Begründung, warum sie nicht dazugehören.',
      '**Grammatik G = (N, T, S, P):** Alle fünf Beispielwörter müssen ableitbar sein – führt für ein Wort die Ableitung mit ⇒ vor. **Begründet**, ob die Grammatik regulär (rechtsregulär: A → aB | a | ε) oder kontextfrei ist. Falls kontextfrei: Erklärt, warum eure Sprache mit einer regulären Grammatik nicht auskommt.',
      '**Automat zur Syntaxprüfung:** ein **DEA** (reguläre Sprache) oder ein **NKA** (kontextfreie Sprache), vollständig oder mit Fehlerzustand-Hinweis. In flaci.com oder im AutomatenLab gebaut und mit allen Beispiel- und Nicht-Wörtern **getestet** (Testprotokoll: Wort | erwartet | Ergebnis).',
      '**Mealy-Übersetzer für einen Teilaspekt:** z. B. eine Anzeige, ein beschränkter Zähler, eine Umcodierung in Steuersignale. Angabe von Σ, Ω und vollständigem Übergangsgraphen; ein Beispiel-Lauf Eingabe → Ausgabe.',
      '**Aufgabe für die Aufgabenbörse:** eine Abi-artige Aufgabe zu eurer Sprache (Sie-Form, Operatoren, BE, Material mit Abbildung) mit **Erwartungshorizont** – lösbar in 20 Minuten. Vorlage auf Seite 4. In Level 16 löst ein anderes Team eure Aufgabe!',
    ]),
    D.h2('3  Rollen im Team'),
    D.p('Alle arbeiten an allem mit – aber jede Person trägt die **Verantwortung** für einen Baustein (bei drei Personen übernimmt jemand zwei Rollen):', { size: 21 }),
    D.table([
      ['Rolle', 'Verantwortung'],
      ['Sprachchef/in', 'Sprachbeschreibung, Alphabet, Beispiel- und Nicht-Wörter; achtet darauf, dass alle Bausteine zu denselben Regeln passen.'],
      ['Grammatik-Profi', 'Grammatik, Ableitung, Klassifikation regulär / kontextfrei mit Begründung.'],
      ['Automatenbauer/in', 'DEA bzw. NKA in flaci.com / AutomatenLab, Testprotokoll, Mealy-Übersetzer.'],
      ['Aufgabensteller/in', 'Aufgabe für die Aufgabenbörse inkl. Erwartungshorizont; prüft Operatoren und Notation.'],
    ], { widthsCm: [3.6, 13.8], size: 19, firstColBold: true, firstColFill: true }),
    D.h2('4  Zeitplan'),
    D.table([
      ['Zeit', 'Was ihr schafft', 'Ergebnis'],
      ['0–10', 'Thema wählen, Rollen verteilen, Regeln der Sprache festlegen', 'Σ und Regeln auf einem Zettel'],
      ['10–30', 'Sprachbeschreibung, Beispiel- und Nicht-Wörter, Grammatik entwerfen', 'Baustein 1 und 2'],
      ['30–55', 'Automat bauen und testen (flaci / AutomatenLab)', 'Baustein 3 mit Testprotokoll'],
      ['55–70', 'Mealy-Übersetzer entwerfen', 'Baustein 4'],
      ['70–85', 'Aufgabe für die Aufgabenbörse skizzieren (Vorlage S. 4)', 'Entwurf Baustein 5'],
      ['85–90', 'Checkliste durchgehen, offene Punkte als Hausaufgabe verteilen', 'To-do-Liste'],
    ], { widthsCm: [1.6, 10.2, 5.6], size: 19 }),
    D.h2('5  Projekt-Checkliste'),
    ...D.checklist([
      'Σ ist endlich und jedes Beispielwort besteht nur aus Zeichen aus Σ.',
      'Die fünf Beispielwörter sind mit der Grammatik ableitbar; eine Ableitung ist aufgeschrieben.',
      'Die drei Nicht-Wörter werden vom Automaten abgelehnt (Testprotokoll).',
      'Der Automat ist vollständig oder trägt den Fehlerzustand-Hinweis.',
      'Die Klassifikation (regulär / kontextfrei) ist über die Regelform begründet.',
      'Der Mealy-Automat hat Σ, Ω, Startzustand, keine Endzustände, Kanten „Eingabe / Ausgabe“.',
      'Die Aufgabe für die Börse hat Operatoren aus der Liste, BE-Angaben und Erwartungshorizont.',
    ]),
    D.h2('6  Bewertungsraster'),
    D.table([
      ['Bereich', 'Darauf kommt es an', 'Punkte'],
      ['Prozess', 'Zusammenarbeit im Team, Einhalten des Zeitplans, systematisches Testen (Testprotokoll), Umgang mit Fehlern', '10'],
      ['Produkt', 'Sprachbeschreibung schlüssig (4); Grammatik korrekt und klassifiziert (8); Automat korrekt und getestet (8); Mealy-Übersetzer sinnvoll und korrekt (5)', '25'],
      ['Dokumentation', 'Notation wie im Abitur (Ergänzende Hinweise 2025), Vollständigkeit (Σ, Γ, Ω, N, T, S, P), Verständlichkeit, Abbildungen beschriftet', '10'],
      ['Aufgabe für die Börse', 'Operatoren korrekt, Mischung AFB I–III, BE-Angaben plausibel, Erwartungshorizont vollständig, Aufgabe in 20 min lösbar', '15'],
      ['Gesamt', '', '60'],
    ], { widthsCm: [3.4, 12.0, 2.0], size: 18, firstColBold: true, center: [2] }),
    D.qr({ route: '#/grammatik?modus=frei', title: 'Grammatik-Tester (freier Modus)', text: 'Eigene Grammatik eingeben: Regel-Check, Klassifikation regulär / kontextfrei, Wörter erzeugen und prüfen, Grammatik → NEA/DEA.' }),
    D.qr({ route: '#/baukasten?modus=frei', title: 'Automaten-Baukasten (freier Modus)', text: 'DEA mit eigenem Σ bauen, Testwörter prüfen, als JSON/DOT exportieren. Für kontextfreie Sprachen: Keller-Labor (#/keller) mit Vorlagen für Klammern und aⁿbⁿ sowie der Abi-Tabelle.' }),
    D.h3('Operatorenliste für die Aufgabenbörse (Auswahl aus der Abi-Liste Informatik)'),
    D.table(OPERATOREN, { widthsCm: [5.2, 10.6, 1.6], size: 17, firstColBold: true, center: [2], noSpacer: true }),
    new D.Paragraph({ children: [new D.TextRun({ text: 'Vorlage: Aufgabe für die Aufgabenbörse', font: D.FONT_HEAD, size: 27, bold: true, color: D.C.teal })], spacing: { before: 0, after: 100 }, keepNext: true, pageBreakBefore: true }),
    D.p('Formuliert wie im Zentralabitur: **Sie-Form**, Operatoren **fett**, BE in eckigen Klammern. Drei bis vier Teilaufgaben mit steigendem Anspruch (AFB I → II → III). Der Erwartungshorizont kommt auf ein eigenes Blatt.', { size: 20 }),
    D.p('**Titel der Aufgabe:**', { after: 60 }),
    ...D.lines(1),
    D.p('**Kontext** (3–5 Sätze: Worum geht es? Welche Regeln hat die Sprache? Welches Alphabet?):', { after: 60 }),
    ...D.lines(3),
    D.p('**Material** – Abbildung 1: Zustandsgraph / Grammatik (Σ bzw. N, T, S, P angeben; Fehlerzustand-Hinweis nicht vergessen):', { after: 60 }),
    ...D.drawBox(4.4, 'Platz für Abbildung 1'),
    D.p('**Teilaufgaben** (Operator, Gegenstand, BE):', { after: 60 }),
    D.p('a)  ……………………………………………………………………………………………………………………  [    BE]', { size: 21 }),
    D.p('b)  ……………………………………………………………………………………………………………………  [    BE]', { size: 21 }),
    D.p('c)  ……………………………………………………………………………………………………………………  [    BE]', { size: 21 }),
    D.p('d)  ……………………………………………………………………………………………………………………  [    BE]', { size: 21 }),
    D.h3('Erwartungshorizont (eigenes Blatt)'),
    D.fillTable(['Teilaufgabe', 'Erwartete Leistung (Lösung in Stichworten, mit Graph / Tabelle)', 'BE', 'AFB'], 4, { widthsCm: [2.2, 11.6, 1.6, 2.0], rowHeightCm: 1.3, size: 18 }),
    D.h3('Selbstcheck – Level 15 geschafft, wenn …'),
    ...D.checklist([
      'unser Team eine Sprache mit allen fünf Bausteinen dokumentiert hat.',
      'ich begründen kann, warum unsere Sprache regulär bzw. kontextfrei ist.',
      'ich eine Abi-artige Aufgabe mit passenden Operatoren und Erwartungshorizont formulieren kann.',
    ]),
  ];
  return D.save(D.doc({ kind: 'AB', ds: 15, title: T, subtitle: SUB, kernfrage: KF, body }), OUT + 'DS15_AB_Sprachdesign-Studio.docx');
}

// =====================================================================================  Lehrkraft
async function lk() {
  const kt = (rows, o) => D.table(rows, { size: 19, ...o });
  const body = [
    D.h2('Überblick'),
    D.table([
      ['Aspekt', 'Inhalt'],
      ['Lernziele', 'Die SuS entwerfen in Teams eine eigene formale Sprache, beschreiben sie durch Grammatik und Automat, begründen die Klassifikation (regulär / kontextfrei), entwickeln einen Mealy-Übersetzer und formulieren eine Abi-artige Aufgabe mit Erwartungshorizont (Synthese K1–K6, F1–F4; PK3.4 Teamarbeit; kreatives Schaffen).'],
      ['KC-Bezug', 'Automatenmodelle entwickeln und implementieren (K3, flaci/App), Grenzen (K5), Kellerautomat (K6); reguläre und kontextfreie Grammatiken entwerfen (F3), Zusammenhang Grammatik ↔ Automat (F4). Prozessbezogen: PK1.5, PK2.2, PK3.1, PK3.2.'],
      ['Abi-Bezug', 'Die SuS wechseln die Perspektive: Sie konstruieren Aufgaben im Abi-Format (Operatoren, BE, AFB, Erwartungshorizont). Vorlage für die Aufgabenbörse orientiert sich an Block 2 eA (z. B. Abi 2025 B: Analyse → Erweiterung → Keller → Grammatik). Vertiefung: Original Abi 2024 eA B (System-Codes) als Muster für „Sprache aus Regeln“.'],
      ['Material', 'AB15 (Projektauftrag mit Checkliste, Zeitplan, Bewertungsraster, Vorlage Aufgabenbörse), Folien DS15, Merkblätter M01–M10, iPads/Laptops mit flaci.com und AutomatenLab (#/grammatik?modus=frei, #/baukasten?modus=frei, #/keller).'],
      ['Vorbereitung', 'Teams (3–4) bilden lassen oder vorgeben; Themenkarten ggf. ausschneiden; Beispielprojekt „Drohnen-Sprache“ (unten) für die Demonstration auf den Folien 7–9; Abgabeweg für Projektmappen festlegen (z. B. Ordner in der Schulcloud).'],
    ], { widthsCm: [3.2, 14.2], firstColBold: true, firstColFill: true }),
    D.h2('Verlaufsplan (90 Minuten)'),
    D.table([
      ['Zeit', 'Phase', 'Unterrichtsgeschehen', 'Sozialform / Medien'],
      ['0–10', 'Einstieg', 'Folien 2–4: „Was haben Tanz, Drohne und Schach gemeinsam?“ – jede dieser Welten hat eine kleine Sprache mit Alphabet und Regeln. Projektidee vorstellen, Themenliste zeigen.', 'UG, Folien'],
      ['10–20', 'Erarbeitung', 'Projektauftrag (AB15, Abschnitt 2; Folie 6) besprechen; Beispielprojekt „Drohnen-Sprache“ in 5 Minuten durchlaufen (Folien 7–9): Regeln → DEA → Grammatik → Mealy. Entscheidungshilfe regulär / kontextfrei (Folie 10).', 'LV/UG, Folien, AB15'],
      ['20–75', 'Projekt', 'Teams arbeiten nach Zeitplan (AB15, Abschnitt 4). Lehrkraft berät rotierend: zuerst Alphabet und Regeln absegnen (10 min), dann Grammatik prüfen (Regelform!), Automaten-Tests einfordern. Zwischenruf nach 30 min: „Habt ihr drei Nicht-Wörter getestet?“', 'GA, flaci, AutomatenLab, AB15'],
      ['75–85', 'Übung', 'Aufgabe für die Aufgabenbörse skizzieren (Vorlage AB15 S. 4); Lehrkraft prüft stichprobenartig Operatoren und BE.', 'GA, AB15'],
      ['85–90', 'Sicherung', 'Checkliste (AB15, Abschnitt 5) im Team abhaken; To-dos für die Hausaufgabe verteilen; Abgabetermin: Beginn Level 16.', 'GA, UG'],
    ], { widthsCm: [1.6, 2.4, 10.2, 3.2], size: 19 }),
    D.h2('Die Themen aus Lehrkraftsicht'),
    kt([
      ['Thema', 'Typische Sprache', 'Stolpersteine / Beratungstipps'],
      ['Tanzschritte-Code', 'regulär (Reihenfolge-Regeln, „Drehung nur nach Schritt“ = Zustand merkt sich letztes Zeichen)', 'SuS wollen „genau so viele Schritte links wie rechts“ – das wäre nicht regulär; bewusst entscheiden lassen.'],
      ['Drohnen-Steuerung', 'regulär; mit Wiederholungsblöcken in Klammern kontextfrei', 'Beispielprojekt unten – Teams müssen eigene Erweiterung finden (z. B. Höhenlimit, Klammern, Pflichtreihenfolge).'],
      ['Emoji-Nachrichten', 'regulär („Herz nur nach Smiley“, „endet mit ! oder ?“)', 'Alphabet klein halten (max. 6 Zeichen); Mealy-Idee: Stimmungsanzeige (Zähler bis 3).'],
      ['Rezept-Sprache', 'regulär (zwei Phasen: Zutaten, dann Schritte)', 'Mealy-Idee: Zeitanzeige oder Warnung („nach k muss w folgen“). Gefahr: zu viele Regeln – auf drei beschränken.'],
      ['Lego-Bauanleitung', 'kontextfrei (Klammern = Unterbaugruppen)', 'NKA wie Klammer-Automat aus Level 9; Grammatik S → rS | gS | bS | (S)S | ε. Begründung „nicht regulär“ über Klammertiefe.'],
      ['Schach-Zugnotation light', 'regulär (Zug = Muster fester Länge, Partie = Folge)', 'Alphabet wird groß (a–h, 1–8) – Zeichenklassen erlauben (z. B. „b“ für Buchstabe, „z“ für Ziffer); x und + optional → mehrere Pfade.'],
      ['Eigene Idee', 'beides möglich', 'Prüfen: endliches Σ, unendliche Sprache, klare Zugehörigkeit (jedes Wort eindeutig drin oder nicht).'],
    ], { widthsCm: [3.4, 5.0, 9.0], firstColBold: true }),
    D.pageBreak(),
    D.h2('Beispielprojekt „Drohnen-Sprache“ (vollständig ausgearbeitet)'),
    D.p('Dieses Beispiel zeigt den erwarteten Umfang und die Notation. Es kann auf den Folien 7–9 demonstriert werden; die Grafiken liegen in `build/img/ds15/`.'),
    D.h3('Baustein 1 – Sprachbeschreibung'),
    ...D.bullets([
      '**Name und Zweck:** Die Drohnen-Sprache D beschreibt gültige Flugprogramme einer Spielzeugdrohne.',
      '**Alphabet:** Σ = {s, h, t, v, d, l} – s = starten, h = höher, t = tiefer, v = vorwärts, d = drehen, l = landen.',
      '**Regeln:** (1) Jedes Programm beginnt mit s und endet mit l. (2) Nach dem Start muss die Drohne zuerst steigen: Der erste Bewegungsbefehl ist h – oder es wird sofort gelandet. (3) Danach sind beliebig viele Bewegungsbefehle h, t, v, d erlaubt. (4) Nach l kommt nichts mehr.',
      '**Beispielwörter:** `sl`, `shl`, `shvdl`, `shhtl`, `shvvdtl`.   **Nicht-Wörter:** `stvl` (erster Bewegungsbefehl ist t), `hvl` (kein Start), `shvls` (nach l folgt noch ein Zeichen).',
    ]),
    D.h3('Baustein 2 – Grammatik'),
    D.p('G = (N, T, S, P) mit N = {S, A, B}, T = {s, h, t, v, d, l}, Startsymbol S und den Produktionsregeln'),
    D.p('S → sA        A → l | hB        B → hB | tB | vB | dB | l', { size: 22, indent: 400 }),
    ...D.bullets([
      'Ableitung: S ⇒ sA ⇒ shB ⇒ shvB ⇒ shvdB ⇒ shvdl;   S ⇒ sA ⇒ sl.',
      '**Klassifikation:** Alle Regeln haben die Form A → aB oder A → a – die Grammatik ist **rechtsregulär**, die Sprache also regulär. (Die Nichtterminale entsprechen genau den Zuständen des DEA: S ↔ S0, A ↔ S1, B ↔ S2; der Endzustand S3 wird durch die Regeln „… → l“ erreicht.)',
    ]),
    D.h3('Baustein 3 – DEA zur Syntaxprüfung'),
    D.img(IMG + 'drohne_dea.png', { widthCm: 12.5, caption: 'Abbildung 1: DEA für die Drohnen-Sprache, Σ = {s, h, t, v, d, l}. Alle nicht eingezeichneten Übergänge führen in einen Fehlerzustand.' }),
    kt([
      ['Wort', 'erwartet', 'Zustandsfolge', 'Ergebnis'],
      ['shvdl', 'akzeptiert', 'S0 –s→ S1 –h→ S2 –v→ S2 –d→ S2 –l→ S3', 'akzeptiert ✓'],
      ['sl', 'akzeptiert', 'S0 –s→ S1 –l→ S3', 'akzeptiert ✓'],
      ['shhtl', 'akzeptiert', 'S0 –s→ S1 –h→ S2 –h→ S2 –t→ S2 –l→ S3', 'akzeptiert ✓'],
      ['stvl', 'abgelehnt', 'S0 –s→ S1 –t→ Fehlerzustand', 'abgelehnt ✓'],
      ['hvl', 'abgelehnt', 'S0 –h→ Fehlerzustand', 'abgelehnt ✓'],
      ['shvls', 'abgelehnt', 'S0 –s→ S1 –h→ S2 –v→ S2 –l→ S3 –s→ Fehlerzustand', 'abgelehnt ✓'],
    ], { widthsCm: [1.8, 2.4, 10.4, 2.8], size: 18 }),
    D.small('Testprotokoll (mit flaci.com bzw. AutomatenLab-Baukasten erstellt). Bedeutung der Zustände: S0 – noch nichts gelesen; S1 – gestartet, noch am Boden; S2 – in der Luft (mindestens ein h gelesen); S3 – gelandet, Programm vollständig.'),
    D.h3('Baustein 4 – Mealy-Übersetzer „Höhenanzeige“'),
    D.p('Teilaspekt: Die Drohne hat drei Höhenstufen (0 = Boden, 1, 2 = Maximalhöhe). Der Mealy-Automat liest die Bewegungsbefehle und gibt nach jedem h oder t die neue Höhenstufe aus; am Anschlag (t am Boden, h auf Maximalhöhe) gibt er „!“ aus und ignoriert den Befehl. v und d ändern die Höhe nicht (Ausgabe ε). Σ = {h, t, v, d}, Ω = {0, 1, 2, !}.'),
    D.img(IMG + 'drohne_mealy.png', { widthCm: 11, caption: 'Abbildung 2: Mealy-Automat „Höhenanzeige“ (Zustand = aktuelle Höhenstufe; keine Endzustände)' }),
    D.p('Beispiel-Lauf: Eingabe `hhvth` → `H0 –h/1→ H1 –h/2→ H2 –v/ε→ H2 –t/1→ H1 –h/2→ H2`, Ausgabe `1212`.  Eingabe `thhhvtt` → Ausgabe `!12!10`.'),
    D.h3('Baustein 5 – Musteraufgabe für die Aufgabenbörse'),
    ...D.tip('Aufgabe „Drohnen-Sprache“ (Sie-Form, 12 BE)', [
      D.p('Eine Spielzeugdrohne wird mit Flugprogrammen über dem Eingabealphabet Σ = {s, h, t, v, d, l} gesteuert (s starten, h höher, t tiefer, v vorwärts, d drehen, l landen). Ein gültiges Programm beginnt mit s und endet mit l; nach dem Start muss die Drohne zuerst steigen (erster Bewegungsbefehl h) oder sofort landen. Der Automat A in Abbildung 1 prüft Flugprogramme. Alle nicht eingezeichneten Übergänge führen in einen Fehlerzustand.', { size: 20 }),
      D.p('a) **Stellen Sie** die Verarbeitung der Eingaben `shvdl` und `stvl` durch den Automaten A **dar**. [3 BE]', { size: 20 }),
      D.p('b) **Erläutern Sie** die Bedeutung des Zustands S2 in Bezug auf die Problemstellung. [2 BE]', { size: 20 }),
      D.p('c) **Entwickeln Sie** eine reguläre Grammatik, die genau die gültigen Flugprogramme erzeugt. [4 BE]', { size: 20 }),
      D.p('d) Die Drohne darf höchstens zwei Höhenstufen steigen. **Begründen Sie**, dass ein Mealy-Automat mit Ausgabe der aktuellen Höhenstufe möglich ist, und **beurteilen Sie**, ob das auch ohne Begrenzung der Höhenstufen gelingen würde. [3 BE]', { size: 20 }),
    ]),
    kt([
      ['Teil', 'Erwartete Leistung', 'BE', 'AFB'],
      ['a', 'shvdl: S0 –s→ S1 –h→ S2 –v→ S2 –d→ S2 –l→ S3, akzeptiert (S3 Endzustand). stvl: S0 –s→ S1 –t→ Fehlerzustand, abgelehnt.', '3', 'I'],
      ['b', 'S2: Die Drohne ist gestartet und mindestens einmal gestiegen – sie befindet sich in der Luft; beliebige Bewegungsbefehle sind nun erlaubt, mit l wird das Programm abgeschlossen.', '2', 'II'],
      ['c', 'N = {S, A, B}, T = Σ, Start S; S → sA, A → l | hB, B → hB | tB | vB | dB | l (oder gleichwertig). Alle Regeln rechtsregulär.', '4', 'II'],
      ['d', 'Mit drei Höhenstufen genügen drei Zustände H0, H1, H2 (Zustand = Höhenstufe), Ausgabe der neuen Stufe bei h/t, ε bei v/d, „!“ am Anschlag. Ohne Begrenzung müsste der Automat beliebig viele Höhen unterscheiden – mit endlich vielen Zuständen unmöglich (Grenzen endlicher Automaten).', '3', 'III'],
    ], { widthsCm: [1.2, 13.0, 1.2, 2.0], size: 18, center: [2, 3] }),
    D.h3('Erweiterung für starke Teams: Wiederholungsblöcke (kontextfrei)'),
    D.p('Erlaubt man Wiederholungsblöcke in Klammern, z. B. `sh(vd)(v(th))l`, wird die Sprache kontextfrei: Σ′ = {s, h, t, v, d, l, (, )}, Grammatik S → sl | shWl,  W → hW | tW | vW | dW | (W)W | ε. Die Regel W → (W)W ist nicht rechtsregulär; wegen der beliebig tiefen Klammerung gibt es auch keine reguläre Grammatik (Schubfachargument wie bei Klammerausdrücken, Level 7). Ableitung: S ⇒ shWl ⇒ sh(W)Wl ⇒ sh(vW)Wl ⇒ sh(vdW)Wl ⇒ sh(vd)Wl ⇒ sh(vd)l.'),
    D.img(IMG + 'drohne_nka.png', { widthCm: 15, caption: 'Abbildung 3: Kellerautomat für die erweiterte Drohnen-Sprache, Γ = {#, K}; K zählt offene Klammern.' }),
    kt([
      ['Zustand', 'Belegung Kellerspeicher', 'oberstes Kellersymbol', 'verarbeitetes Eingabezeichen'],
      ['S0', '#', '–', '–'], ['S1', '#', '#', 's'], ['S2', '#', '#', 'h'], ['S2', 'K#', '#', '('], ['S2', 'K#', 'K', 'v'], ['S2', 'KK#', 'K', '('],
      ['S2', 'KK#', 'K', 'd'], ['S2', 'K#', 'K', ')'], ['S2', '#', 'K', ')'], ['S3', '#', '#', 'l'],
    ], { widthsCm: [2.4, 4.6, 4.6, 5.8], size: 18, allCenter: true }),
    D.small('Verarbeitung von sh(v(d))l – Eingabe wird akzeptiert: ja (S3 ist Endzustand).'),
    D.h2('Typische Schwierigkeiten'),
    ...D.warn('Darauf achten', [
      ...D.bullets([
        '**Unendliches Alphabet:** „Alle Zahlen“ oder „alle Wörter“ als Zeichen – Σ muss endlich sein; Zeichenklassen (z = Ziffer) vorschlagen.',
        '**Grammatik passt nicht zum Automaten:** Teams bauen Automat und Grammatik unabhängig – Übersetzungsrezept M09 (Zustand ↔ Nichtterminal) nutzen.',
        '**Zu ehrgeizig:** Verschachtelung + Zählen + Reihenfolge gleichzeitig. Faustregel: drei Regeln, eine Besonderheit.',
        '**Mealy mit Endzuständen** oder fehlender ε-Ausgabe; vollständigen Übergangsgraphen einfordern.',
        '**Aufgaben ohne Operatoren** („Was macht der Automat?“) – Operatorenliste auf AB15 (vor der Vorlage) verwenden, Sie-Form, BE.',
      ]),
    ]),
    D.h2('Differenzierung'),
    ...D.bullets([
      '**Basis:** Thema mit regulärer Sprache (Emoji, Tanz, Rezept); Mealy-Übersetzer als einfache Umcodierung (jedes Zeichen → ein Signal); Aufgabe mit drei Teilaufgaben AFB I–II.',
      '**Standard:** reguläre Sprache mit Zählbedingung modulo (z. B. „gerade Anzahl Drehungen“), Mealy mit beschränktem Zähler.',
      '**Profi:** kontextfreie Sprache (Lego, Drohne mit Klammern) mit NKA und Abi-Tabelle; Aufgabe mit Teilaufgabe AFB III („Begründen Sie, dass kein DEA …“).',
    ]),
    D.h2('Hausaufgabe und Organisation der Aufgabenbörse'),
    ...D.bullets([
      'Projektmappe fertigstellen; Aufgabe + Erwartungshorizont getrennt abgeben (zwei Blätter), damit die Aufgabe ohne Lösung weitergegeben werden kann.',
      'Lehrkraft prüft die Aufgaben vor Level 16 kurz (Lösbarkeit, Operatoren, Notation) und ordnet die Teams rotierend zu (Team 1 → Aufgabe von Team 2 usw.).',
      'In Level 16 (20 min) lösen die Teams die Kurzversion (zwei bis drei Teilaufgaben) und geben dem Autorenteam Rückmeldung mit dem Erwartungshorizont.',
    ]),
  ];
  return D.save(D.doc({ kind: 'LK', ds: 15, title: T, subtitle: SUB, kernfrage: KF, body }), OUT + 'DS15_Lehrkraft_Sprachdesign-Studio.docx');
}

// =====================================================================================  Folien
async function folien() {
  const d = S.deck({ ds: 15, title: T });
  d.title({ title: T, subtitle: SUB, kernfrage: KF, notes: 'Einordnung: Welt D. Level 15 ist ein Mini-Projekt – die SuS wechseln von der Analyse zum Entwurf. Abgabe zu Beginn von Level 16, dort Aufgabenbörse.' });
  d.question({ text: 'Was haben Tanz, Drohne und Schach gemeinsam?', sub: 'Jede dieser Welten hat eine **kleine Sprache**: ein Alphabet, Regeln – und Wörter, die dazugehören oder nicht.', phase: 'Einstieg', notes: 'Ideen sammeln: Schachnotation e4, Sf3; Tanzschritte; Drohnenbefehle. Überleitung: Heute entwerft ihr so eine Sprache selbst.' });
  d.cards({ title: 'Themen zur Auswahl (1/2)', phase: 'Einstieg', cards: [
    { head: 'Tanzschritte-Code', text: 'Schritte l, r, v, z; Drehung d; Grundstellung g, Pose p', icon: 'LuMusic' },
    { head: 'Drohnen-Steuerung', text: 'Start, Bewegungen, Landung – als Erweiterung des Beispiels', icon: 'LuPlane' },
    { head: 'Emoji-Nachrichten', text: 'Smiley, Herz, ! und ? mit Regeln', icon: 'LuSmile' },
    { head: 'Rezept-Sprache', text: 'Zutaten, dann Schritte: mischen, kochen, backen, warten', icon: 'LuChefHat' },
  ], notes: 'Themenliste mit Details steht auf AB15, Abschnitt 1.' });
  d.cards({ title: 'Themen zur Auswahl (2/2)', phase: 'Einstieg', cards: [
    { head: 'Lego-Bauanleitung', text: 'Steine in Lagen, Unterbaugruppen in Klammern – kontextfrei!', icon: 'LuBlocks' },
    { head: 'Schach-Zugnotation light', text: 'Figur + Feld, optional x und +', icon: 'LuCrown' },
    { head: 'Eigene Idee', text: 'Endliches Alphabet, klare Regeln, unendlich viele Wörter – nach Absprache', icon: 'LuLightbulb' },
  ], notes: 'Eigene Ideen kurz mit der Lehrkraft absprechen (Alphabet endlich? Zugehörigkeit eindeutig?).' });
  d.section({ phase: 'Projekt', title: 'Der Projektauftrag' });
  d.table({ title: 'Lieferumfang: fünf Bausteine', phase: 'Projekt', size: 20, colW: [3.0, 9.1], rows: [
    ['Baustein', 'Das gehört dazu'],
    ['1  Sprache', 'Name, Zweck, Alphabet Σ, Regeln in Worten, 5 Beispielwörter, 3 Nicht-Wörter'],
    ['2  Grammatik', 'G = (N, T, S, P), Ableitung mit ⇒ vorführen, regulär oder kontextfrei begründen'],
    ['3  Automat', 'DEA oder NKA zur Syntaxprüfung, in flaci / AutomatenLab getestet (Testprotokoll)'],
    ['4  Mealy', 'Übersetzer für einen Teilaspekt: Σ, Ω, vollständiger Graph, Beispiel-Lauf'],
    ['5  Abi-Aufgabe', 'Sie-Form, Operatoren, BE, Abbildung – mit Erwartungshorizont für die Aufgabenbörse in Level 16'],
  ], notes: 'Jeder Baustein wird auf AB15 Abschnitt 2 genauer beschrieben. Notation wie im Abitur – Merkblätter nutzen. Rollen: Sprachchef/in, Grammatik-Profi, Automatenbauer/in, Aufgabensteller/in (AB15, Abschnitt 3).' });
  d.image({ title: 'Beispiel: die Drohnen-Sprache – Regeln und DEA', phase: 'Projekt', img: IMG + 'drohne_dea.png', sigma: 'Σ = {s, h, t, v, d, l} · beginnt mit s, endet mit l · nach s zuerst h (steigen) oder sofort l', caption: 'Nicht eingezeichnete Übergänge führen in einen Fehlerzustand. Beispiele: sl, shvdl, shhtl – keine Wörter: stvl, hvl', notes: 'Live demonstrieren: Testwörter im Baukasten (freier Modus) oder in flaci. Bedeutung der Zustände formulieren lassen: S2 = „in der Luft“.' });
  d.bullets({ title: 'Beispiel: Grammatik zum DEA', phase: 'Projekt', size: 24, items: [
    'N = {S, A, B}, T = {s, h, t, v, d, l}, Startsymbol S',
    '**S → sA**',
    '**A → l | hB**',
    '**B → hB | tB | vB | dB | l**',
    'S ⇒ sA ⇒ shB ⇒ shvB ⇒ shvdB ⇒ shvdl',
    'Nichtterminal ↔ Zustand: S ↔ S0, A ↔ S1, B ↔ S2',
    'Nur Regeln A → aB | a: **rechtsregulär**',
  ], notes: 'Übersetzungsrezept aus Level 12 (M09): Jeder Übergang Si –a→ Sj wird zur Regel, Übergänge in den Endzustand S3 zu Regeln „… → l“.' });
  d.image({ title: 'Beispiel: Mealy-Übersetzer „Höhenanzeige“', phase: 'Projekt', img: IMG + 'drohne_mealy.png', maxH: 4.3, sigma: 'Σ = {h, t, v, d}, Ω = {0, 1, 2, !} · Zustand = aktuelle Höhenstufe · am Anschlag Ausgabe „!“', caption: 'hhvth → 1212 · thhhvtt → !12!10 · Ohne Höhenlimit wäre kein endlicher Automat möglich.', notes: 'Mealy: keine Endzustände, ε bei v und d. Bezug zu Level 7 (Grenzen): unbeschränkte Höhe = unbeschränktes Zählen.' });
  d.cards({ title: 'Regulär oder kontextfrei? Entscheidungshilfe', phase: 'Projekt', cards: [
    { head: 'Regulär → DEA', text: ['Reihenfolge-Regeln („erst …, dann …“)', 'festes Muster, beschränktes Zählen', 'Grammatik: A → aB | a | ε'], icon: 'LuCircleCheck' },
    { head: 'Kontextfrei → NKA', text: ['Klammern / Verschachtelung', 'Spiegelungen, „gleich viele“', 'Grammatik mit S → (S)S, S → aSb'], icon: 'LuLayers' },
    { head: 'Beides prüfen', text: ['Grammatik-Tester: Regel-Check', 'Begründung immer über die **Regelform**', 'Nicht-Wörter testen!'], icon: 'LuSearchCheck' },
  ], size: 18, notes: 'Kontextfrei ist anspruchsvoller (NKA + Abi-Tabelle) – für starke Teams.' });
  d.task({ title: 'Arbeitsauftrag: Projektzeit', phase: 'Projekt', steps: [
    '**0–10 min:** Thema, Rollen, Σ und drei Regeln festlegen – Lehrkraft absegnen lassen.',
    '**10–30 min:** Sprachbeschreibung und Grammatik (Baustein 1 + 2).',
    '**30–55 min:** Automat bauen und mit allen Wörtern testen (Baustein 3).',
    '**55–70 min:** Mealy-Übersetzer (Baustein 4).',
    '**70–85 min:** Aufgabe für die Börse skizzieren (Vorlage AB15 S. 4).',
  ], zeit: '55 min + 15 min', sozialform: 'Teams (3–4)', material: 'AB15, Merkblätter, flaci / AutomatenLab', app: '#/grammatik?modus=frei', notes: 'Rotierend beraten. Nach 30 min Zwischenruf: „Drei Nicht-Wörter getestet?“' });
  d.app({ title: 'Werkzeuge im AutomatenLab', route: '#/baukasten?modus=frei', text: '**Baukasten (freier Modus):** DEA mit eigenem Σ bauen, Testwörter prüfen, exportieren.\n**Grammatik-Tester:** Regel-Check, Klassifikation, Wörter erzeugen.\n**Keller-Labor:** Vorlagen für Klammern und aⁿbⁿ.', phase: 'Projekt', notes: 'Alternativ flaci.com – dort Export als Bild für die Projektmappe.' });
  d.table({ title: 'So wird bewertet (60 Punkte)', phase: 'Projekt', rows: [
    ['Bereich', 'Darauf kommt es an', 'Punkte'],
    ['Prozess', 'Teamarbeit, Zeitplan, systematisches Testen', '10'],
    ['Produkt', 'Beschreibung (4), Grammatik (8), Automat (8), Mealy (5)', '25'],
    ['Dokumentation', 'Abi-Notation, Vollständigkeit, Verständlichkeit', '10'],
    ['Aufgabe für die Börse', 'Operatoren, AFB-Mix, BE, Erwartungshorizont, lösbar in 20 min', '15'],
  ], colW: [2.8, 7.8, 1.5], size: 20, notes: 'Bewertungsraster auch auf AB15, Abschnitt 6.' });
  d.section({ phase: 'Übung', title: 'Die Aufgabenbörse' });
  d.bullets({ title: 'Eine Aufgabe wie im Abitur schreiben', phase: 'Übung', items: [
    '**Sie-Form** und **Operatoren** aus der Operatorenliste (AB15): darstellen, erläutern, entwickeln, begründen …',
    'Kontext in 3–5 Sätzen, Material mit **Abbildung 1** (Σ angeben, Fehlerzustand-Hinweis!)',
    '3–4 Teilaufgaben mit steigendem Anspruch: **AFB I → II → III**',
    '**BE** in eckigen Klammern, insgesamt etwa 10–12 BE',
    '**Erwartungshorizont** auf einem eigenen Blatt – mit Graph, Tabelle oder Ableitung',
    'Test: Kann ein anderes Team sie in **20 Minuten** lösen?',
  ], size: 22, notes: 'Musterbeispiel in der Handreichung (Drohnen-Sprache, 12 BE). Operatoren-Definitionen gemeinsam durchgehen.' });
  d.merke({ title: 'Merke: Vom Entwurf zum Modell', phase: 'Sicherung', items: [
    'Eine formale Sprache braucht ein **endliches Alphabet** und **eindeutige Regeln**.',
    'Reguläre Sprachen ↔ DEA ↔ rechtsreguläre Grammatik; Verschachtelung ↔ NKA ↔ kontextfreie Grammatik.',
    'Zustand ↔ Nichtterminal: Automat und Grammatik passen zusammen (M09).',
    '**Testen** mit Beispiel- **und** Nicht-Wörtern deckt die meisten Fehler auf.',
  ], notes: 'Zur Sicherung die Checkliste im Team abhaken lassen.' });
  d.end({ items: ['Thema gewählt, Σ und Regeln festgelegt', 'Grammatik, Automat, Mealy begonnen', 'Aufgabe für die Börse skizziert'], hausaufgabe: 'Projektmappe fertigstellen (Bausteine 1–5). Aufgabe und Erwartungshorizont auf getrennten Blättern zu Beginn von Level 16 abgeben.' });
  return d.save(OUT + 'DS15_Folien_Sprachdesign-Studio.pptx');
}

(async () => {
  const files = [await ab(), await lk(), await folien()];
  console.log(files.join('\n'));
})();
