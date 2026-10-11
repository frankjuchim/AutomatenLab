const __MAT = require('path').resolve(__dirname, '../..'); // Wurzel: materials/
// 00_Einheitsplanung (Lehrkraft) und 00_Lernlandkarte (SuS)
const D = require((__MAT + '/lib/docstyle.js'));
const OUT = (__MAT + '/out/');

const LEVELS = [
  // nr, titel, schwerpunkt, spiel, app, merkblatt, abi
  [1, 'Ein Automat hört zu', 'DEA: Aufbau, Zustandsgraph, Zustandsfolge, Akzeptanz, Fehlerzustand', 'Rätsel Zahlenschloss; Rollenspiel „Menschlicher Automat“', 'Akzeptor-Arena', 'M01', '2024 B a; 2025 B b'],
  [2, 'Was macht dieser Automat?', 'Analyse, formale Definition (Q, Σ, δ, S0, F), Sprache L(A), Bedeutung von Zuständen', 'Sprach-Detektiv (Gruppenwettbewerb)', 'Sprach-Detektiv, Arena', 'M01', '2025 B a/b; 2022 C a; 2021 Nach D a'],
  [3, 'Bauplan gesucht', 'DEA entwickeln: Konstruktionsbausteine, Produktidee, Komplement, 5-Schritte-Vorgehen', 'Baukasten-Challenges mit Sofort-Feedback', 'Automaten-Baukasten', 'M02', '2024 B a–c'],
  [4, 'Modellierungswerkstatt', 'Kontexte modellieren, testen, dokumentieren', '6 Stationen + Bug-Bounty', 'Baukasten (frei)', 'M02', '2022 C b'],
  [5, 'Weniger ist mehr', 'Unterscheidbarkeit, Markierungsverfahren, Mindestzahl von Zuständen begründen', 'Spiel „Unterscheide!“', 'Minimierer', 'M03', '2025 B c/d; 2024 B c; 2022 C b'],
  [6, 'Automaten, die antworten', 'Mealy-Automaten: e / a, ε, Vergleich mit DEA, Fehler finden', 'Süßigkeitenautomat-Rollenspiel; Bug-Jagd · Boss-Level A', 'Mealy-Maschine', 'M04', '2022 D b; 2024 Nach a–c; 2021 Nach E a'],
  [7, 'Der Automat stößt an Grenzen', 'Grenzen endlicher Automaten, Schubfachprinzip-Argument', 'Türsteher-Problem; „Überliste den Automaten“', 'Überliste den Automaten', 'M05', '2024 B e/h; 2023 D b; 2022 D c; 2021 E d'],
  [8, 'Raten erlaubt', 'NEA, ε-Übergänge, Gleichmächtigkeit, Teilmengenkonstruktion', 'Unplugged „Parallelwelten“', 'Parallelwelten', 'M06', '(Brücke zum NKA)'],
  [9, 'Der Automat bekommt ein Gedächtnis', 'Kellerautomat: Stapel/LIFO, Notation, Akzeptanz, Abi-Tabelle', 'Klammer-Check mit Kartenstapel', 'Keller-Labor', 'M07', '2025 B g/h; 2024 B f/g; 2022 C c'],
  [10, 'Keller-Profis', 'NKA vs. DKA, Palindrome, Keller im Sachzusammenhang, rückwärts analysieren', 'Abi-Werkstatt „Prüfling & Korrektor“ · Boss-Level B', 'Keller-Labor', 'M07', '2022 C c; 2022 Nach C; 2021 Nach E b; 2025 Nach e–i'],
  [11, 'Sprache – natürlich oder formal?', 'Grammatik, Ableitung, Ableitungsbaum, formale vs. natürliche Sprache', 'Satz-Generator-Spiel', 'Ableitungs-Rallye', 'M08', '2023 Nach D a'],
  [12, 'Grammatik trifft Automat', 'Rechtsreguläre Grammatiken ↔ endliche Automaten', 'Übersetzer-Duell', 'Grammatik-Tester', 'M09', '2021 D a–c; 2021 Nach D b; 2024 B d/e; 2025 Nach b'],
  [13, 'Klammern, Spiegel, Programme', 'Kontextfreie Grammatiken, Mehrdeutigkeit, Bezug zum Kellerautomaten', 'Spiegelkabinett (Palindrom-Wettbewerb)', 'Rallye (Baum-Modus), Grammatik-Tester', 'M10', '2022 D c; 2021 E c; 2023 D a/b; 2023 Nach D b; 2024 Nach g/h'],
  [14, 'Die Landkarte der Sprachen', 'Chomsky-Hierarchie, Vernetzung, Abi-Training', 'Chomsky-Sortierer; Begriffsnetz · Boss-Level C', 'Chomsky-Sortierer, Quiz', 'M10, M12', 'Trainingszirkel'],
  [15, 'Sprachdesign-Studio', 'Mini-Projekt: eigene Sprache mit Grammatik, Automat, Mealy-Übersetzer', 'Projekt + Aufgabenbörse', 'Grammatik-Tester, Baukasten, Keller-Labor', 'alle', 'Aufgaben selbst im Abi-Format'],
  [16, 'Ausblick: Die Turingmaschine', 'Turingmaschine, Church-Turing-These, Halteproblem; Abschluss', 'Papierband-Unplugged; Fleißiger Biber', 'Turing-Labor, Level-Quiz', 'M11', '(Ergänzung über den Kern)'],
];

const TYP = { 1: 'P', 2: 'P', 3: 'P', 4: 'B', 5: 'V', 6: 'P', 7: 'P', 8: 'B', 9: 'P', 10: 'V', 11: 'P', 12: 'P', 13: 'P', 14: 'V', 15: 'B', 16: 'B' };
const TYP_NAME = { P: 'Pflicht', V: 'Vertiefung', B: 'Bonus' };
const PFLICHT = LEVELS.filter((l) => TYP[l[0]] === 'P');
const VERTIEFUNG = LEVELS.filter((l) => TYP[l[0]] === 'V');
const BONUS = LEVELS.filter((l) => TYP[l[0]] === 'B');

// Ablaufdaten je Doppelstunde (aus den Lehrkraft-Handreichungen verdichtet)
const ABLAUF = {
  1: { phasen: ['0–25 Einstieg: Rätsel „Zahlenschloss“, Rollenspiel „Menschlicher Automat“ (LOL-Erkenner)', '25–45 Erarbeitung: Zustandsgraph, Fachbegriffe, Kaffeeautomat, Fehlerzustand', '45–80 Übung: AB01 gestuft, Akzeptor-Arena', '80–90 Sicherung: Merkblatt M01, Exit-Frage'],
    kopie: 'AB01, M01; Kopiervorlage Regel- und Wortkarten (4 Schilder S0–S3)', app: '#/arena?stufe=1', ha: 'Drei Alltagsautomaten beschreiben, einen als Zustandsgraph' },
  2: { phasen: ['0–25 Einstieg: HA-Rückblick, Gruppenwettbewerb „Sprach-Detektiv“ (Fallkarten)', '25–45 Erarbeitung: formale Definition, Übergangstabelle, L(A), Bedeutung von Zuständen', '45–80 Übung: AB02 gestuft, Detektiv/Arena', '80–90 Sicherung: M01 Abschnitte 4–5, Abi-Check'],
    kopie: 'AB02 (inkl. Boss-Training), Fallkarten je Gruppe (Umschläge)', app: '#/detektiv, #/arena?stufe=2', ha: 'Boss-Training „Was macht er?“ (AB02, letzte Seite, ca. 30 min)' },
  3: { phasen: ['0–10 Einstieg: Denkfrage „gerade Anzahl a UND endet auf b“', '10–35 Erarbeitung: Konstruktionsbausteine, 5-Schritte-Vorgehen', '35–80 Übung: AB03 gestuft, Kontrolle im Automaten-Baukasten', '80–90 Sicherung: Abi-Check „verschiedene Zustände begründen“, M02'],
    kopie: 'AB03, M02 (beidseitig)', app: '#/baukasten', ha: 'Baukasten-Challenges a-mod-3, anfang-ende; eigene Challenge für den Nachbarn (Warm-up zu Beginn der nächsten Stunde)' },
  4: { phasen: ['0–5 Warm-up: Challenges aus der HA tauschen', '5–40 Phase 1: sechs Stationen modellieren (Sandbox/flaci.com, Plakat)', '40–65 Phase 2: Bug-Bounty – Fehler in fremden Automaten suchen', '65–90 Korrektur, Kurzpräsentationen, Fehlerkatalog'],
    kopie: 'Stationsheft AB04 für alle; Stationskarten zusätzlich vergrößert auf die Tische; A3-Papier', app: '#/baukasten?modus=frei', ha: 'Eigene Station sauber dokumentieren (Vorlage im Stationsheft)' },
  5: { phasen: ['0–12 Einstieg: zwei Smiley-Automaten – welcher ist besser?', '12–45 Erarbeitung: unterscheidbare Zustände, Markierungsverfahren an der Tafel', '45–80 Übung: AB05 gestuft, Minimierer', '80–90 Sicherung: Merkblatt M03'],
    kopie: 'AB05, M03; Tafelbild Dreieckstabelle (6 × 6)', app: '#/minimierer?aufgabe=5', ha: 'Minimierer Aufgabe 3 (erst im Heft, dann in der App)' },
  6: { phasen: ['0–15 Einstieg: Rollenspiel „Süßigkeitenautomat“', '15–35 Erarbeitung: Mealy-Notation e / a, ε, Kartoffelautomat, Vergleich mit DEA', '35–75 Übung: AB06 gestuft, Bug-Jagd in der App', '75–90 Sicherung: M04, Boss-Level A austeilen'],
    kopie: 'AB06, M04, ggf. Boss-Level A; Rollenspielkarten (S0/S1, Münz- und Hebelkarten), optional Bonbons', app: '#/mealy?aufgabe=4&modus=bugjagd', ha: 'Extra (freiwillig): Boss-Level A (ca. 75 min, Teil d nur nach Level 5) mit Erwartungshorizont' },
  7: { phasen: ['0–15 Einstieg: „Türsteher“ zählt mit den Fingern einer Hand', '15–50 Erarbeitung: App „Überliste den Automaten“, daraus Schubfach-Argument in 5 Schritten', '50–80 Übung: AB07 gestuft (Entscheidungstabelle, Begründungen)', '80–90 Sicherung: Merkblatt M05'],
    kopie: 'AB07, M05; Wortkarten EEAA, EEEAAA, EEEEAAAA, AEEA groß', app: '#/ueberliste?stufe=1', ha: 'Entscheidungstabelle fertig; ein Schubfach-Argument vollständig ausformulieren' },
  8: { phasen: ['0–10 Einstieg: LOL-Erkenner – „Rate, wo LOL beginnt“', '10–30 Erarbeitung: Unplugged „Parallelwelten“ mit Spielfiguren', '30–50 Erarbeitung: Akzeptanz, ε-Übergänge, Gleichmächtigkeit/Teilmengen', '50–90 Übung AB08, Sicherung M06'],
    kopie: 'AB08, M06; Spielplan (A3) je Vierergruppe; Münzen/Spielfiguren', app: '#/parallelwelten?aufgabe=1&modus=sim', ha: 'NEA für „beginnt mit 01 oder endet auf 10“, Zustandsmengen darstellen' },
  9: { phasen: ['0–15 Einstieg: Klammer-Check mit Kartenstapel', '15–50 Erarbeitung: Stapel/LIFO, Kellernotation, Kellerautomat für aⁿbⁿ, Abi-Tabelle', '50–80 Übung: AB09 gestuft, Tabellen-Trainer', '80–90 Sicherung: Merkblatt M07'],
    kopie: 'AB09, M07; Klammerkarten je Paar; Wortstreifen für die Tafel', app: '#/keller?automat=anbn&modus=tabelle&wort=aabb', ha: 'Abi-Tabellen für aaabbb und abb; Tabellen-Trainer „gleich viele a und b“' },
  10: { phasen: ['0–10 Einstieg: Rätsel „Spiegelwörter“ – wo ist die Mitte?', '10–30 Erarbeitung: DKA vs. NKA, „Mitte raten“', '30–85 Abi-Werkstatt im Tandem: Prüfling & Korrektor, zwei Runden mit Rollentausch', '85–90 Sicherung: Blitzlicht, Boss-Level B austeilen'],
    kopie: 'AB10, Korrektorkarten (je Fall 2–4×), Boss-Level B', app: '#/keller?automat=palindrom', ha: 'Restliche Werkstattfälle; Extra: Boss-Level B (ca. 60 min)' },
  11: { phasen: ['0–30 Einstieg: Spiel „Satz-Generator“ – Syntax vs. Semantik', '30–50 Erarbeitung: Grammatik (N, T, Startsymbol, Regeln), Ableitung, Ableitungsbaum', '50–80 Übung: AB11 gestuft, Ableitungs-Rallye', '80–90 Sicherung: Vergleich formal/natürlich, M08, Exit-Ticket'],
    kopie: 'AB11, M08; Wortkarten-Umschläge je Gruppe (4 Papierfarben)', app: '#/rallye', ha: 'Ableitungs-Rallye 1–4; mehrdeutigen deutschen Satz finden' },
  12: { phasen: ['0–25 Einstieg: „Übersetzer-Duell“ Automat gegen Grammatik', '25–45 Erarbeitung: rechtsreguläre Form, Übersetzungsrezept DEA ↔ Grammatik, NEA kurz erklärt (10 min)', '45–80 Übung: AB12 gestuft, Grammatik-Tester', '80–90 Sicherung: M09, Exit-Ticket'],
    kopie: 'AB12, M09; Duell-Karten A/B je Gruppenpaar', app: '#/grammatik', ha: 'AB12 Aufgabe 4; Grammatik-Challenges 5 und 8' },
  13: { phasen: ['0–15 Einstieg: „Spiegelkabinett“ – Palindrom-Wettbewerb', '15–40 Erarbeitung: kontextfreie Grammatiken, Muster, Mehrdeutigkeit, Bezug zum Kellerautomaten', '40–75 Übung: AB13 gestuft, Rallye (Baum-Modus)', '75–90 Sicherung: zwei Ableitungsbäume, M10, Exit-Ticket'],
    kopie: 'AB13, M10', app: '#/rallye?aufgabe=12', ha: 'AB13 Aufgabe 4/5; Rallye 12 und 13' },
  14: { phasen: ['0–20 Einstieg: App „Chomsky-Sortierer“', '20–45 Erarbeitung: Begriffsnetz in Gruppen', '45–85 Übung: Abi-Trainingszirkel mit 4 Stationen und Lösungskarten', '85–90 Sicherung: Quiz Welt C, Boss-Level C austeilen'],
    kopie: 'AB14 mit Begriffskarten (je Gruppe), Stationen 1–4 je 2×, Lösungskarten; Boss-Level C; A3-Papier, Kleber', app: '#/sortierer?runde=1', ha: 'Extra: Boss-Level C (ca. 70 min)' },
  15: { phasen: ['0–20 Einstieg: Projektidee, Beispielprojekt „Drohnen-Sprache“', '20–75 Projektarbeit im Team (Grammatik, Automat, Mealy-Übersetzer)', '75–85 Aufgabe für die Aufgabenbörse entwerfen', '85–90 Checkliste, Aufgabenverteilung'],
    kopie: 'AB15 (Projektauftrag, Zeitplan, Bewertungsraster, Vorlage Aufgabenbörse)', app: '#/grammatik?modus=frei', ha: 'Projekt fertigstellen; Aufgabe und Erwartungshorizont getrennt abgeben' },
  16: { phasen: ['0–20 Einstieg: Aufgabenbörse – Teams lösen fremde Aufgaben', '20–45 Erarbeitung: Grenzen des Kellers, Turingmaschine, Binärzahl + 1', '45–70 Übung: Papierband-Unplugged, Turing-Labor; Church-Turing, Halteproblem', '70–90 Abschluss: Quiz Welt D, Lernlandkarte, Feedback'],
    kopie: 'AB16, M11; Papierstreifen-Bänder, Zustands- und Regelkarten; Aufgaben der Teams', app: '#/turing?programm=binaer-plus-1', ha: 'Übungsklausur (135 min) mit Erwartungshorizont; M12 zur Vorbereitung' },
};

async function planung() {
  const ablaufBlock = (l) => {
    const a = ABLAUF[l[0]];
    return [D.box([
      new D.Paragraph({ keepNext: true, spacing: { before: 200, after: 60 }, children: [
        new D.TextRun({ text: ` Level ${l[0]} `, font: 'Cambria', bold: true, size: 22, color: 'FFFFFF', shading: { type: D.ShadingType.CLEAR, fill: D.C.teal, color: 'auto' } }),
        new D.TextRun({ text: `  ${l[1]}`, font: 'Cambria', bold: true, size: 24, color: D.C.teal }),
        new D.TextRun({ text: `   ${l[2]}`, font: 'Calibri', size: 18, color: D.C.muted }),
      ] }),
      D.table([
        ['Ablauf (Minuten)', a.phasen.join('\n')],
        ['Kopieren / vorbereiten', a.kopie],
        ['AutomatenLab', a.app],
        ['Hausaufgabe', a.ha],
      ].map((r) => r[1].includes('\n') ? [r[0], r[1].split('\n').map((x) => D.p(x, { size: 18, after: 20 }))] : r), { widthsCm: [3.3, 13.3], header: false, size: 18, firstColBold: true, firstColFill: true, noSpacer: true }),
    ], { fill: 'FFFFFF', border: 'FFFFFF', cantSplit: true }), D.spacer(60)];
  };

  const body = [
    D.h2('Schnellstart: In 10 Minuten startklar'),
    D.p('Diese Einheit ist vollständig ausgearbeitet und kann **ohne eigene Vorarbeit** übernommen werden. Der **Pflichtweg umfasst 9 Doppelstunden** (3 Wochen à 3 Doppelstunden) und deckt alle Kompetenzen des KC für das erhöhte Niveau ab. Bei 4 Wochen kommen **3 Vertiefungsstunden** dazu. Alles Weitere ist **Bonus- und Extra-Material** für Interessierte, zum Üben oder zur Differenzierung. Für jede Doppelstunde (à 90 min) gibt es ein Arbeitsblatt, einen Foliensatz und eine Lehrkraft-Handreichung mit Verlaufsplan und allen Lösungen.'),
    D.table([
      ['Frage', 'Antwort'],
      ['Für wen?', 'Informatik-Kurse auf erhöhtem Anforderungsniveau (eA) in der Qualifikationsphase, KC Niedersachsen. Für Kurse auf grundlegendem Niveau: siehe „Kürzen und anpassen“ beim Wochenplan.'],
      ['Wie lange?', '3 Wochen à 3 Doppelstunden (Pflichtweg) oder 4 Wochen à 3 Doppelstunden (mit Vertiefung), zuzüglich Klausur. Siehe Wochenplan.'],
      ['Was brauche ich?', 'Beamer mit PowerPoint (oder Keynote/LibreOffice), Kopierer, Endgeräte für die SuS (iPad, Laptop oder Handy – eines pro 1–2 SuS) mit Internetzugang. Optional: flaci.com zum Zeichnen von Automaten.'],
      ['Muss ich etwas installieren?', 'Nein. Die Web-App „AutomatenLab“ läuft im Browser, ohne Anmeldung und ohne Datenerhebung. Die QR-Codes auf den Arbeitsblättern führen direkt zur passenden Übung.'],
      ['Welche Vorkenntnisse brauchen die SuS?', 'Keine zum Thema. Hilfreich: Datenstruktur Stapel (wird in Level 9 kurz wiederholt).'],
      ['Ist das abiturtauglich?', 'Ja. Alle Aufgaben nutzen die Operatoren und die Notation der Ergänzenden Hinweise (Neufassung 2025, verbindlich ab Abitur 2027). Alle Automaten, Grammatiken und Lösungen sind per Programm nachgerechnet.'],
    ], { widthsCm: [4.0, 13.4], size: 19, firstColBold: true }),
    D.h3('So bereitest du eine Doppelstunde vor (ca. 20 Minuten)'),
    ...D.numbered([
      '**Lehrkraft-Handreichung** der Stunde lesen: Überblick, Verlaufsplan, typische Fehler. Die Lösungen stehen dort vollständig.',
      '**Folien** einmal durchklicken – die Sprechernotizen enthalten Impulse und Hinweise zum Ablauf.',
      '**Kopieren** laut Abschnitt „Ablaufplan auf einen Blick“: Arbeitsblatt, ggf. Merkblatt und Kopiervorlagen (Karten, Stationen).',
      '**App-Link** einmal auf dem Beamer bzw. einem Schülergerät öffnen (QR-Code auf AB und Folie).',
      'Die **Hausaufgabe der Vorstunde** einplanen (manche Stunden beginnen mit ihr).',
    ], { ref: 'numbers' }),
    D.h3('Einmalig vor Beginn der Einheit'),
    ...D.bullets([
      'AutomatenLab im Schulnetz auf einem Schülergerät testen (https://automatenlab.frankjuchim.de). Falls der Schulfilter die Seite blockiert, freischalten lassen.',
      'Lernlandkarte (00_Lernlandkarte) für alle kopieren und in Level 1 austeilen – die SuS haken nach jedem Level ab.',
      'Entscheiden: 3-Wochen-Variante (nur Pflicht) oder 4-Wochen-Variante (mit Vertiefung). Ordner 3_Bonus_und_Extra-Uebungen den SuS digital bereitstellen.',
      'Abschnitt „Notation 2025“ lesen: Einige Konventionen weichen von älteren Schulbüchern ab (z. B. Akzeptanz beim Kellerautomaten).',
    ]),
    D.h2('Wochenplan'),
    D.table([
      ['', '3 Wochen (Pflichtweg)', '4 Wochen (mit Vertiefung)'],
      ['Woche 1', 'L1 Ein Automat hört zu\nL2 Was macht dieser Automat?\nL3 Bauplan gesucht', 'L1 Ein Automat hört zu\nL2 Was macht dieser Automat?\nL3 Bauplan gesucht'],
      ['Woche 2', 'L6 Automaten, die antworten (Mealy)\nL7 Der Automat stößt an Grenzen\nL9 Der Automat bekommt ein Gedächtnis', 'L5 Weniger ist mehr (Vertiefung)\nL6 Automaten, die antworten (Mealy)\nL7 Der Automat stößt an Grenzen'],
      ['Woche 3', 'L11 Sprache – natürlich oder formal?\nL12 Grammatik trifft Automat\nL13 Klammern, Spiegel, Programme', 'L9 Der Automat bekommt ein Gedächtnis\nL10 Keller-Profis (Vertiefung)\nL11 Sprache – natürlich oder formal?'],
      ['Woche 4', '–', 'L12 Grammatik trifft Automat\nL13 Klammern, Spiegel, Programme\nL14 Die Landkarte der Sprachen (Vertiefung)'],
      ['jederzeit', 'Bonus & Extra: L4 Modellierungswerkstatt, L8 NEA, L15 Sprachdesign-Studio, L16 Turingmaschine; Boss-Level A–C; Übungsklausur; App-Challenges', ''],
    ].map((r) => r.map((c) => c.includes('\n') ? c.split('\n').map((x) => D.p(x, { size: 18, after: 20 })) : c)), { widthsCm: [2.2, 7.6, 7.6], size: 18, firstColBold: true }),
    D.small('Die Level-Nummern bleiben gleich (sie stehen auf allen Materialien und in der App). Übersprungene Level sind in der App als „Bonus“ bzw. „Vertiefung“ markiert – im Spielrahmen ganz natürlich: Bonus-Level sind freiwillig.'),
    D.h3('Kürzen und anpassen'),
    D.table([
      ['Situation', 'Empfehlung'],
      ['3 Wochen (9 Doppelstunden)', 'Pflichtweg: L1, L2, L3, L6, L7, L9, L11, L12, L13. Hinweis: Im Abitur 2024/2025 wurde nach dem Zusammenfassen von Zuständen gefragt (L5) – dafür mindestens M03 und Minimierer als Hausaufgabe anbieten.'],
      ['4 Wochen (12 Doppelstunden)', 'Pflichtweg + Vertiefung L5, L10, L14 (siehe Wochenplan).'],
      ['Kurs auf grundlegendem Niveau (gA)', 'Kellerautomaten und formale Sprachen sind nur auf eA prüfungsrelevant. L1, L2, L3, L6, L7 genügen (ca. 2 Wochen); L5 optional.'],
      ['Mehr Zeit / Projektphase', 'Bonus-Level in den Unterricht holen: L4 Werkstatt, L8 NEA, L16 Turingmaschine; L15 lässt sich zur Projektphase (KC: mind. drei Wochen) ausbauen. Boss-Levels können als Übungsstunden laufen.'],
      ['Ohne Endgeräte für SuS', 'Die App-Phasen sind Zusatzangebote: Die Arbeitsblätter funktionieren auch ohne. Für L7 („Überliste den Automaten“) die App am Beamer im Plenum spielen.'],
    ], { widthsCm: [4.4, 13.0], size: 19, firstColBold: true }),
    D.pageBreak(),
    D.h2('1  Leitidee'),
    D.p('Der rote Faden ist die Frage, *wie Maschinen Sprache verstehen* – vom einfachen Akzeptor über Automaten mit Ausgabe und Kellerspeicher bis zu Grammatiken und dem Ausblick auf die Turingmaschine. Als Rahmen dient das **AutomatenLab**: Die Doppelstunden sind **Level** in vier **Welten**. Am Ende der Welten A–C gibt es ein **Boss-Level** (Abi-artige Aufgabe mit Erwartungshorizont) als freiwilliges Extra-Training.'),
    D.table([
      ['Welt', 'Level', 'Inhalt', 'Abschluss'],
      ['A  Endliche Automaten', '1–6', 'DEA beschreiben, analysieren, entwickeln; Mealy-Automaten (Vertiefung: Minimierung; Bonus: Werkstatt)', 'Boss-Level A'],
      ['B  Grenzen & Keller', '7–10', 'Grenzen endlicher Automaten, Kellerautomaten (Vertiefung: Keller-Profis; Bonus: NEA)', 'Boss-Level B'],
      ['C  Formale Sprachen', '11–14', 'Grammatiken, reguläre Grammatiken und endliche Automaten, kontextfreie Grammatiken (Vertiefung: Chomsky-Hierarchie, Abi-Training)', 'Boss-Level C'],
      ['D  Bonus-Welt', '15–16', 'Mini-Projekt „Sprachdesign-Studio“, Turingmaschine', 'Übungsklausur'],
    ], { widthsCm: [4.4, 1.6, 8.6, 2.8], size: 19, firstColBold: true }),
    D.h3('Spielerische Elemente – immer mit Kompetenzbezug'),
    ...D.bullets([
      '**Unplugged:** Menschlicher Automat (L1), Süßigkeitenautomat (L6), Türsteher (L7), Parallelwelten mit Spielfiguren (L8), Klammer-Check mit Kartenstapel (L9), Satz-Generator (L11), Papierband-Turingmaschine (L16).',
      '**Wettbewerb & Kooperation:** Sprach-Detektiv (L2), Bug-Bounty (L4), Prüfling-&-Korrektor-Tandems (L10), Übersetzer-Duell (L12), Aufgabenbörse (L15/16).',
      '**App-Challenges:** Sofort-Feedback mit Gegenbeispielen (Baukasten), „Überliste den Automaten“ als Entdeckungsspiel zum Schubfachprinzip, Tabellen-Trainer im Abi-Format, Exit-Tickets je Stunde.',
      '**Sicherung:** Merkblätter M01–M11, Abi-Spickzettel M12, Selbstcheck auf jedem Arbeitsblatt, Lernlandkarte für die ganze Einheit.',
    ]),
    D.h2('2  Sequenzplan'),
    D.table([
      ['Level', 'Typ', 'Titel', 'Schwerpunkt', 'Spielerisches Element', 'App-Modul', 'Merk-blatt'],
      ...LEVELS.map((l) => [String(l[0]), TYP_NAME[TYP[l[0]]], l[1], l[2], l[3], l[4], l[5]]),
    ], { widthsCm: [1.1, 1.9, 2.8, 4.6, 3.3, 2.5, 1.2], size: 16, center: [0, 6] }),
    D.small('Pflicht = 9 Doppelstunden, deckt alle KC-Kompetenzen (eA) ab. Vertiefung = 4. Woche. Bonus = Extra-Material, z. B. für Projektphasen, Differenzierung oder interessierte SuS.'),
    D.pageBreak(),
    D.h2('3  Ablaufplan auf einen Blick'),
    D.p('Pro Doppelstunde: Phasen mit Minuten, was zu kopieren bzw. vorzubereiten ist, der App-Link für die Stunde und die Hausaufgabe. Details stehen in der jeweiligen Lehrkraft-Handreichung.', { size: 20 }),
    D.h3('Pflichtweg – 9 Doppelstunden'), ...PFLICHT.map(ablaufBlock),
    D.h3('Vertiefung – 3 Doppelstunden für die 4. Woche'), ...VERTIEFUNG.map(ablaufBlock),
    D.h3('Bonus und Extra-Übungen'),
    D.table([
      ['Material', 'Einsatzidee'],
      ['L4 Modellierungswerkstatt (Stationsheft)', 'Übungsheft zum Selbstarbeiten (eine Station = ca. 30 min) oder Werkstattstunde bei mehr Zeit; Lösungen in der Handreichung.'],
      ['L8 Raten erlaubt (NEA) + Merkblatt M06', 'Selbstlernmaterial; die NEA-Grundidee wird in L12 in 10 Minuten erklärt.'],
      ['L15 Sprachdesign-Studio', 'Projektphase (KC: mind. drei Wochen Projektarbeit in der Q-Phase) oder Langzeit-Hausaufgabe für Interessierte.'],
      ['L16 Ausblick: Turingmaschine', 'Ausblick nach der Klausur oder für Interessierte; Turing-Labor in der App.'],
      ['Boss-Level A, B, C (+ Erwartungshorizonte)', 'Freiwilliges Abi-Training zu Hause nach L6, L9/10 und L13/14; Boss-Level A Teil d setzt L5 voraus.'],
      ['Übungsklausur (+ Erwartungshorizont)', 'Klausurvorbereitung unter Abiturbedingungen.'],
      ['AutomatenLab', 'Alle Module stehen jederzeit offen; Exit-Tickets #/quiz?ds=1 … 16.'],
    ], { widthsCm: [5.4, 12.0], size: 18, firstColBold: true }),
    ...D.info('Abhängigkeiten zwischen den Stunden', [...D.bullets([
      'Die Hausaufgabe aus Level 3 (eigene Challenge) ist das Warm-up der folgenden Stunde.',
      'Level 12 braucht die NEA-Grundidee: Sie wird dort in 10 Minuten erklärt (Folie und Info-Kasten); ausführlich in Bonus-Level 8.',
      'Werden Level 15 und 16 eingesetzt, tauschen die Teams ihre Projektaufgaben zu Beginn von Level 16 (Aufgabenbörse).',
      'Boss-Level-Erwartungshorizonte erst nach der Bearbeitung ausgeben.',
    ], { size: 20 })]),
    D.pageBreak(),
    D.h2('4  Kompetenzen des Kerncurriculums'),
    D.p('Inhaltsbezogene Kompetenzen (KC 2017, Lernfeld „Automaten und Sprachen“, Q-Phase und Erweiterung eA). ● = Schwerpunkt, ○ = wird aufgegriffen.', { size: 20 }),
    D.table([
      ['Die SuS …', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16'],
      ['beschreiben Aufbau/Funktionsweise eines DEA', '●', '●', '○', '○', '○', '○', '', '○', '', '', '', '○', '', '○', '', ''],
      ['beschreiben Aufbau/Funktionsweise eines Mealy-Automaten', '', '', '', '', '', '●', '○', '', '', '', '', '', '', '', '○', ''],
      ['entwickeln und implementieren Automatenmodelle als Zustandsgraphen', '', '○', '●', '●', '○', '●', '', '○', '○', '○', '', '●', '', '', '●', ''],
      ['analysieren die Funktion eines gegebenen Automaten', '●', '●', '○', '○', '●', '●', '○', '○', '●', '●', '', '○', '', '●', '○', ''],
      ['erläutern die Grenzen endlicher Automaten', '', '', '', '', '○', '○', '●', '', '○', '○', '', '', '●', '●', '', '○'],
      ['beschreiben den Kellerautomaten als Erweiterung (eA)', '', '', '', '', '', '', '', '○', '●', '●', '', '', '●', '●', '○', '○'],
      ['nennen Eigenschaften formaler vs. natürlicher Sprachen (eA)', '', '', '', '', '', '', '', '', '', '', '●', '', '○', '○', '○', ''],
      ['beschreiben die von einer Grammatik erzeugte Sprache (eA)', '', '', '', '', '', '', '', '', '', '', '●', '●', '●', '●', '○', ''],
      ['entwerfen reguläre und kontextfreie Grammatiken (eA)', '', '', '', '', '', '', '', '', '', '', '○', '●', '●', '●', '●', ''],
      ['erläutern den Zusammenhang reguläre Grammatik – endlicher Automat (eA)', '', '', '', '', '', '', '', '○', '', '', '', '●', '○', '●', '○', ''],
      ['Ergänzungen: Chomsky-Hierarchie, Turingmaschine', '', '', '', '', '', '', '', '', '', '', '', '', '○', '●', '', '●'],
    ], { widthsCm: [5.2, ...Array(16).fill(0.75)], size: 15, center: Array.from({ length: 16 }, (_, i) => i + 1) }),
    D.p('**Alle inhaltsbezogenen Kompetenzen werden im Pflichtweg (L1, L2, L3, L6, L7, L9, L11, L12, L13) abgedeckt**; Vertiefung und Bonus festigen bzw. erweitern.', { size: 20 }),
    D.p('Prozessbezogen besonders gefördert: PK1.1/1.5 (strukturieren, Modelle entwickeln), PK2.2/2.3 (in ausführbare Prozesse umsetzen, analysieren – flaci.com und App), PK3.1/3.2 (Fachsprache, Dokumentation), PK3.4 und PK4 (Teamarbeit, kreatives Schaffen – L4, L15).', { size: 20 }),
    D.h2('5  Abiturbezug'),
    D.p('Die Einheit zielt auf Block 2 (eA) des Zentralabiturs. Auf den Arbeitsblättern stehen eigene, an die Abituraufgaben angelehnte Varianten. Die Original-Abituraufgaben (Niedersächsischer Bildungsserver) eignen sich als Vertiefung:'),
    D.table([
      ['Originalaufgabe', 'Thema', 'passt zu Level'],
      ['2021 eA D (Musik)', 'reguläre Grammatik, DEA, Grammatik vergleichen', '12'],
      ['2021 eA E (Kommentare)', 'DEA-Analyse, Mealy, kontextfreie Grammatik, Kellerautomat', '2, 6, 13'],
      ['2021 Nach D (Mars-Roboter)', 'DEA-Analyse, reguläre Grammatik', '2, 12'],
      ['2021 Nach E (Kartoffelautomat)', 'Mealy, Zustandszahl, Kellerautomat (Protokolle)', '6, 7, 10'],
      ['2022 eA C (Trainerentlassung)', 'DEA entwickeln, Unterscheidbarkeit, Kellerautomat', '4, 5, 10'],
      ['2022 eA D (Frog)', 'Grammatik, Mealy-Fehler, reguläre/verschachtelte Sprache', '6, 12, 13'],
      ['2022 Nach C (Spielfeld)', 'DEA entwickeln, Kellerautomaten analysieren', '4, 10'],
      ['2022 Nach D (Tresor)', 'reguläre und kontextfreie Grammatiken', '12, 13'],
      ['2023 eA D (Hostname/IP)', 'Grammatik, Kellerautomat, DEA-Beurteilung', '9, 13'],
      ['2023 Nach D (Sätze, if-then-else)', 'natürliche vs. formale Sprachen, Mehrdeutigkeit, Kellerautomat', '11, 13'],
      ['2024 eA B (Spielekonsole)', 'DEA ergänzen, Mindestzustände, reguläre Grammatik, Kellerautomat', '1, 3, 5, 9, 12'],
      ['2024 Nach B (Palindrome)', 'Mealy vs. DEA, Kellerautomat, Grammatik', '6, 10, 13'],
      ['2025 eA B (Prüfnummern)', 'DEA-Analyse, Zustände zusammenfassen, Kellerautomat, Grammatik', '2, 5, 9, 10'],
      ['2025 Nach B (Terme)', 'Grammatik nicht regulär/Sprache regulär, DEA, DKA', '9, 12, 13'],
    ], { widthsCm: [5.0, 9.4, 3.0], size: 18, firstColBold: true }),
    D.h2('6  Leistungsfeststellung und Hilfsmittel'),
    D.table([
      ['Element', 'Einsatz', 'Hilfsmittel'],
      ['Boss-Level A, B, C (je 25 BE)', 'Freiwilliges Extra-Training (oder Hausaufgabe) nach L6, L9/10, L13/14; Selbstkontrolle mit Erwartungshorizont. Lernsituation – Fehler sind ausdrücklich erwünscht.', 'Merkblätter der jeweiligen Welt (A: M01–M04, B: M05–M07, C: M08–M10)'],
      ['Übungsklausur (45 BE, 135 min)', 'Klausurvorbereitung unter Abiturbedingungen oder Vorlage für die Kursklausur.', 'wie im Abitur: Operatorenliste, keine Merkblätter'],
      ['Mini-Projekt (Bonus-Level 15)', 'Falls eingesetzt: fachpraktische Leistung mit Bewertungsraster (Prozess, Produkt, Dokumentation, Aufgabe für die Aufgabenbörse).', 'alle Materialien, App, flaci.com'],
      ['Mitarbeit', 'Sprach-Detektiv (L2), Übersetzer-Duell (L12), ggf. Tandem-Korrektur (L10), Exit-Tickets in der App.', '–'],
    ], { widthsCm: [4.2, 8.6, 4.6], size: 18, firstColBold: true }),
    D.p('Begründung: Die Boss-Levels sind Lernsituationen (KC Kap. 4: Lern- und Leistungssituationen trennen) – mit Merkblättern üben die SuS das Abi-Format, ohne an fehlenden Details zu scheitern. Die Übungsklausur simuliert dann die Prüfungssituation.', { size: 20 }),
    D.h2('7  AutomatenLab'),
    ...D.bullets([
      '**Adresse:** https://automatenlab.frankjuchim.de – Startseite mit Level-Karte, 13 Module, Exit-Tickets unter #/quiz?ds=1 … 16.',
      '**Datenschutz:** keine Anmeldung, keine Cookies, keine Server-Datenbank. Punkte und Fortschritt liegen nur lokal im Browser des Geräts (bei geteilten iPads also gerätebezogen).',
      '**Beamer:** Knopf „A A“ oben rechts schaltet die Großansicht ein.',
      '**Eigene Instanz (optional):** Das Paket AutomatenLab_CapRover.tar läuft auf jedem Docker-/CapRover-Server. Für eigene QR-Codes die Materialien mit dem Skript build_all.sh und der Variable AUTOMATENLAB_URL neu erzeugen (Quelltexte im Ordner).',
    ]),
    D.small('Alle verwendeten Deep-Links stehen in den QR-Kästen der Arbeitsblätter und Folien, die vollständige Liste (258 Links) in der README der App.'),
    D.h2('8  Notation 2025 – darauf achten'),
    D.p('Alle Materialien folgen den Ergänzenden Hinweisen zum KC (Neufassung Juni 2025, Abschnitte 12 und 13). Ältere Schulbücher und Materialien weichen teils ab:'),
    D.table([
      ['Thema', 'häufig in älteren Materialien', 'jetzt verbindlich'],
      ['Akzeptanz Kellerautomat', 'akzeptiert, wenn der Keller leer ist bzw. nur # enthält', 'akzeptiert, wenn es einen Lauf gibt, der nach vollständiger Eingabe in einem **Endzustand** ist (Kellerinhalt egal)'],
      ['Kantenbeschriftung Kellerautomat', 'Reihenfolge uneinheitlich', '(oberstes Kellerzeichen, Eingabezeichen) : Ablage; das rechte Zeichen der Ablage wird zuerst abgelegt; Kelleralphabet Γ, Vorbelegung #'],
      ['ε-Übergänge', '„ε ist Teil des Eingabealphabets“', 'ε ist **kein** Zeichen des Eingabealphabets, sondern kennzeichnet einen Übergang ohne Lesen'],
      ['Mealy-Automat', 'teils mit Endzuständen', 'Kanten „Eingabe / Ausgabe“, leere Ausgabe ε, keine Endzustände'],
      ['DEA', 'Endzustände mit E, Zustände q0 …', 'Endzustandsmenge F; Zustände S0, S1, … wie im Abitur; Automaten vollständig oder Hinweis „Alle nicht eingezeichneten Übergänge führen in einen Fehlerzustand.“'],
      ['Grammatik', 'G = (N, T, S, P) in verschiedenen Reihenfolgen', 'Nichtterminale N, Terminale T, Startsymbol, Produktionsregeln; reguläre Grammatiken rechtsregulär (A → aB | a | ε); „Grammatik“ ohne Zusatz = kontextfrei'],
    ], { widthsCm: [3.6, 5.6, 8.2], size: 18, firstColBold: true }),
    D.h2('9  Dateiübersicht'),
    D.h3('So ist jede Doppelstunde aufgebaut'),
    D.table([
      ['Datei', 'Inhalt', 'für'],
      ['DSxx_AB_…', 'Arbeitsblatt, Aufgaben gestuft (Basis / Standard / Profi), Operatoren fett, QR-Code zur App, Selbstcheck am Ende', 'SuS'],
      ['DSxx_Folien_…', 'Foliensatz mit Abschnitten Einstieg → Erarbeitung → Übung → Sicherung, Sprechernotizen', 'Beamer'],
      ['DSxx_Lehrkraft_…', 'Überblick (Lernziele, KC, Abi-Bezug, Material, Vorbereitung), Verlaufsplan, Kopiervorlagen, vollständige Lösungen, typische Fehler, Differenzierung, Hausaufgabe', 'Lehrkraft'],
    ], { widthsCm: [3.4, 12.0, 2.0], size: 18, firstColBold: true }),

    D.table([
      ['Ordner / Datei', 'Inhalt'],
      ['00_Einheitsplanung, 00_Lernlandkarte', 'dieses Dokument; Kompetenzraster „Ich kann …“ für die SuS'],
      ['1_Pflicht / 2_Vertiefung / 3_Bonus_und_Extra-Uebungen', 'je Doppelstunde ein Ordner mit Arbeitsblatt, Lehrkraft-Handreichung, Folien (Word/PowerPoint, frei bearbeitbar; Graphen als Bilder, Änderungen z. B. mit flaci.com). In 3_Bonus zusätzlich Boss-Level und Übungsklausur.'],
      ['Merkblaetter', 'M01 DEA · M02 DEA entwickeln · M03 Minimierung · M04 Mealy · M05 Grenzen · M06 NEA · M07 Kellerautomaten · M08 Grammatiken · M09 Reguläre Grammatik · M10 Kontextfreie Grammatiken & Chomsky · M11 Turingmaschine · M12 Abi-Spickzettel'],
      ['AutomatenLab_WebApp, Quelltexte', 'App-Paket für Docker/CapRover mit README; Erzeugungsskripte der Materialien (optional)'],
    ], { widthsCm: [5.4, 12.0], size: 18, firstColBold: true, noSpacer: true }),
  ];
  return D.save(D.doc({ kind: 'PL', title: 'Maschinen, die Sprache verstehen', subtitle: 'Einheitsplanung und Ablaufplan · Automaten und formale Sprachen · Informatik eA, Q-Phase · 9 + 3 Doppelstunden', metaText: 'Gesamtplanung der Einheit', code: '00 · Einheitsplanung', body }), OUT + '00_Einheitsplanung.docx');
}

async function lernlandkarte() {
  const sym = ['sicher', 'teilweise', 'noch nicht'];
  const hdr = ['Ich kann …', 'Level', 'Hilfe', ...sym];
  const W = [8.4, 1.3, 2.6, 1.5, 2.0, 1.6];
  const rows = (items) => D.table([hdr, ...items.map((i) => [i[0], i[1], i[2], '☐', '☐', '☐'])], { widthsCm: W, size: 18, center: [1, 3, 4, 5] });
  const body = [
    D.p('Diese Karte begleitet dich durch die Einheit. Kreuze nach jedem Level an, wie sicher du dich fühlst. Wo du „noch nicht“ ankreuzt, helfen dir das Merkblatt (M…) und das passende Modul im **AutomatenLab**.'),
    D.small('Level ohne Zusatz gehören zum Pflichtweg. **V** = Vertiefung (bei vier Wochen im Unterricht), **B** = Bonus (freiwillig, zum Üben und Weiterdenken).'),
    D.h2('Welt A – Endliche Automaten'),
    rows([
      ['den Aufbau eines DEA beschreiben (Σ, Zustände, Start-/Endzustände, Übergänge)', '1', 'M01, Arena'],
      ['die Verarbeitung eines Wortes als Zustandsfolge darstellen und über Akzeptanz entscheiden', '1–2', 'M01, Arena'],
      ['die Bedeutung eines Zustands im Sachzusammenhang erläutern', '2', 'M01, Detektiv'],
      ['einen DEA formal angeben (Q, Σ, δ, S0, F) und zwischen Tabelle und Graph wechseln', '2', 'M01'],
      ['die Sprache eines gegebenen DEA beschreiben', '2', 'Detektiv'],
      ['einen DEA zu einer Sprachbeschreibung systematisch entwickeln', '3', 'M02, Baukasten'],
      ['zwei Bedingungen in einem Automaten kombinieren und Komplemente bilden', '3', 'M02, Baukasten'],
      ['reale Abläufe als DEA modellieren und mit Testwörtern prüfen', '4 B', 'Baukasten'],
      ['mit unterscheidenden Wörtern begründen, dass Zustände verschieden sein müssen', '3, 5 V', 'M03, Minimierer'],
      ['einen DEA mit dem Markierungsverfahren minimieren', '5 V', 'M03, Minimierer'],
      ['einen Mealy-Automaten beschreiben, analysieren und entwickeln (e / a, ε)', '6', 'M04, Mealy'],
      ['DEA und Mealy-Automat vergleichen', '6', 'M04'],
    ]),
    D.h2('Welt B – Grenzen & Keller'),
    rows([
      ['erläutern, warum endliche Automaten nicht unbeschränkt zählen können', '7', 'M05, Überliste'],
      ['mit dem Schubfachprinzip begründen, dass es keinen DEA für eine Sprache gibt', '7', 'M05'],
      ['einen NEA simulieren (Menge aktiver Zustände, ε-Übergänge)', '8 B', 'M06, Parallelwelten'],
      ['einen NEA in einen DEA umwandeln (Teilmengenkonstruktion)', '12, 8 B', 'M06'],
      ['Aufbau und Arbeitsweise eines Kellerautomaten beschreiben', '9', 'M07, Keller-Labor'],
      ['die Verarbeitung durch einen Kellerautomaten tabellarisch dokumentieren', '9, 10 V', 'M07, Keller-Labor'],
      ['einen Kellerautomaten für eine Sprache entwickeln (z. B. Klammern, aⁿbⁿ)', '9, 10 V', 'M07'],
      ['die Bedeutung des Kellerspeichers im Sachzusammenhang erläutern', '9, 10 V', 'M07, M12'],
      ['begründen, wann ein Kellerautomat nötig ist und wann ein DEA genügt', '7, 9', 'M05, M07'],
    ]),
    D.h2('Welt C – Formale Sprachen'),
    rows([
      ['Eigenschaften formaler und natürlicher Sprachen vergleichen', '11', 'M08'],
      ['zeigen, dass ein Wort von einer Grammatik erzeugt wird (Ableitung, Ableitungsbaum)', '11', 'M08, Rallye'],
      ['die von einer Grammatik erzeugte Sprache beschreiben', '11–13', 'M08, Grammatik-Tester'],
      ['eine rechtsreguläre Grammatik erkennen und entwickeln', '12', 'M09, Grammatik-Tester'],
      ['einen DEA in eine reguläre Grammatik übersetzen und umgekehrt', '12', 'M09'],
      ['kontextfreie Grammatiken entwerfen (Klammern, Palindrome, aⁿbⁿ)', '13', 'M10, Grammatik-Tester'],
      ['Mehrdeutigkeit an zwei Ableitungsbäumen zeigen', '13', 'M10, Rallye'],
      ['Sprachen in die Chomsky-Hierarchie einordnen und passende Maschinen nennen', '13, 14 V', 'M10, Sortierer'],
    ]),
    D.h2('Bonus-Welt D und Abi-Training'),
    rows([
      ['eine eigene kleine Sprache mit Grammatik, Automat und Übersetzer entwerfen', '15 B', 'alle'],
      ['eine Aufgabe im Abi-Format mit Operatoren formulieren', '15 B', 'M12'],
      ['die Arbeitsweise einer Turingmaschine beschreiben', '16 B', 'M11, Turing-Labor'],
      ['Abi-Aufgaben zu Automaten und Sprachen sicher bearbeiten', '1–16', 'M12, Boss-Level, Quiz'],
    ]),
    D.qr({ route: '#/', title: 'Startseite & Level-Karte', text: 'Alle Module, dein Fortschritt und die Exit-Tickets (#/quiz?ds=1 … 16) auf einen Blick.' }),
  ];
  return D.save(D.doc({ kind: 'LL', title: 'Meine Lernlandkarte', subtitle: 'Automaten und formale Sprachen – Pflicht-, Vertiefungs- und Bonus-Level', metaText: 'Begleitet die ganze Einheit', code: '00 · Lernlandkarte', body }), OUT + '00_Lernlandkarte.docx');
}

(async () => { console.log(await planung()); console.log(await lernlandkarte()); })();
