const __MAT = require('path').resolve(__dirname, '../..'); // Wurzel: materials/
// DS04 – Level 4 „Modellierungswerkstatt“ – Stationsheft (AB), Lehrkraft-Handreichung, Folien
// Musterlösungen und Testwörter stammen aus automata_ds04.py (solutions.json) – vorher `python3 automata_ds04.py` ausführen.
const D = require((__MAT + '/lib/docstyle.js'));
const S = require((__MAT + '/lib/deckstyle.js'));
const H = require('../ds02/helpers.js');
const SOL = require('./solutions.json');
const IMG = (__MAT + '/build/img/ds04/');
const OUT = (__MAT + '/out/');
const T = 'Modellierungswerkstatt';
const SUB = 'Reale Systeme als DEA modellieren, testen und gegenseitig prüfen (Bug-Bounty)';
const KF = 'Wie modelliere ich reale Systeme als DEA – und wie teste ich, dass mein Modell stimmt?';
const FEHLER = 'Alle nicht eingezeichneten Übergänge führen in einen Fehlerzustand.';
const eps = (w) => (w === '' ? 'ε' : w);
const tt = (ws) => ws.map((w) => '`' + eps(w) + '`').join('  ·  ');

const STATIONEN = [
  { id: 'A', titel: 'PIN-Eingabe 42x00', niveau: 'Profi', app: '#/baukasten?aufgabe=pin-42x00',
    kontext: 'Ein neues, sicheres Eingabeverfahren versteckt die PIN 4200 in einer langen Ziffernfolge – Zuschauer sollen die PIN nicht erkennen.',
    regeln: ['Zuerst dürfen beliebig viele Ziffern eingegeben werden.', 'Dann folgen die PIN-Ziffern **4 2**, danach **genau eine beliebige Ziffer** und dann **0 0**.', 'Danach wird nichts mehr eingegeben.'],
    sigma: 'Σ = {0, 2, 4}', legende: 'vereinfacht: nur diese Ziffern',
    tipp: 'Wie beim Zahlenschloss: Was passt am Ende gerade vom Muster 42x00? Achtung – bei `424…` laufen zwei Anfänge gleichzeitig.' },
  { id: 'B', titel: 'XMail-Adresse', niveau: 'Basis',
    kontext: 'Das soziale Netzwerk XBook vergibt Adressen nach dem Muster **vorname.nachname@XB.xx**. Die Domain XB.xx ist fest.',
    regeln: ['Vorname und Nachname bestehen jeweils aus **mindestens zwei Kleinbuchstaben**.', 'Sonderzeichen und Ziffern sind nicht erlaubt.', 'Nach dem Nachnamen folgt genau „@XB.xx“.'],
    sigma: 'Σ = {a, P, @, X, B, x, S}', legende: 'a = Kleinbuchstabe im Namen, P = Punkt, S = Sonderzeichen oder Ziffer; X, B, x nur für die Domain',
    tipp: 'Plant zuerst die Abschnitte: Vorname – Punkt – Nachname – @ – Domain. Zusatz: Welcher Automatentyp könnte aus „Vorname Nachname“ die Adresse erzeugen?' },
  { id: 'C', titel: 'Smiley-Erkenner', niveau: 'Basis',
    kontext: 'Eine Chat-App ersetzt Smileys durch Bilder. Erkannt werden soll, ob eine Eingabe **genau ein** gültiger Smiley ist.',
    regeln: ['Ein Smiley beginnt mit Augen: **:** oder **;**', 'Danach darf eine Nase **-** folgen (muss aber nicht).', 'Zum Schluss kommt ein Mund: **)** oder **(** oder **D**. Der Automat muss mindestens vier verschiedene Smileys erkennen – besser alle.'],
    sigma: 'Σ = {:, ;, -, ), (, D}',
    tipp: 'Zählt zuerst alle erlaubten Smileys auf. Zusatz: Ergänzt einen eigenen Smiley-Typ (z. B. ein Herz <3) – was ändert sich am Graphen?' },
  { id: 'D', titel: 'Mann, Wolf, Ziege, Kohlkopf', niveau: 'Standard',
    kontext: 'Ein Mann will mit Wolf, Ziege und Kohlkopf über einen Fluss. Im Boot ist nur Platz für ihn und **einen** Begleiter. Unbewacht frisst der Wolf die Ziege und die Ziege den Kohlkopf.',
    regeln: ['Eingabe m: Der Mann fährt allein; w, z, k: Der Mann fährt mit Wolf, Ziege bzw. Kohlkopf.', 'Eine Fahrt ist verboten, wenn der Begleiter nicht am Ufer des Mannes steht oder danach etwas gefressen würde (→ Fehlerzustand).', 'Akzeptiert wird, wenn am Ende **alle am rechten Ufer** sind.'],
    sigma: 'Σ = {m, w, z, k}',
    tipp: 'Zustand = Wer steht am linken Ufer? Schreibt die Belegung in den Zustand, z. B. „MWZK | –“ am Start.' },
  { id: 'E', titel: 'Trainerentlassung', niveau: 'Standard', app: '#/baukasten?aufgabe=trainer',
    kontext: 'In einem Fußballmanager-Spiel liest ein Automat die Spielergebnisse eines Vereins: **3** = Sieg, **1** = Unentschieden, **0** = Niederlage.',
    regeln: ['Der Trainer wird entlassen, sobald der Verein in **drei aufeinanderfolgenden Spielen jeweils weniger als 3 Punkte** holt (also kein Sieg).', 'Einmal entlassen, bleibt er entlassen.', 'Akzeptiert werden die Ergebnisfolgen, nach denen der Trainer entlassen ist.'],
    sigma: 'Σ = {0, 1, 3}',
    tipp: 'Was setzt ein Sieg zurück? Zusatz: Begründet, dass sich der Automat nach „30“ und „03“ in verschiedenen Zuständen befinden muss.' },
  { id: 'F', titel: 'Fahrstuhl-Testprotokoll', niveau: 'Standard',
    kontext: 'Ein Fahrstuhl (EG, 1. OG, 2. OG) wird gewartet. Ein Testprotokoll listet alle Aktionen auf. Start: EG, Tür offen.',
    regeln: ['h / r: eine Etage hoch / runter – nur bei **geschlossener** Tür, nie unter das EG oder über das 2. OG.', 'o / s: Tür öffnen / schließen – nur, wenn sie gerade zu / offen ist.', 'Ein Protokoll ist gültig, wenn jede Aktion erlaubt war und der Fahrstuhl am Ende **im EG mit offener Tür** steht.'],
    sigma: 'Σ = {h, r, o, s}',
    tipp: 'Ein Zustand muss sich zwei Dinge merken: Etage und Tür. Wie viele Paare gibt es?' },
];

function karte(st) {
  const c = SOL.cards[st.id];
  const kids = [
    new D.Paragraph({ spacing: { after: 80 }, children: [
      new D.TextRun({ text: ` ${st.id} `, font: D.FONT_HEAD, bold: true, size: 30, color: D.C.white, shading: { type: D.ShadingType.CLEAR, fill: D.C.teal, color: 'auto' } }),
      new D.TextRun({ text: `  Station ${st.id}: ${st.titel}`, font: D.FONT_HEAD, bold: true, size: 26, color: D.C.tealDark }),
      new D.TextRun({ text: '   ' }),
      new D.TextRun({ text: ` ${st.niveau} `, font: D.FONT_BODY, bold: true, size: 16, color: D.C.white, shading: { type: D.ShadingType.CLEAR, fill: { Basis: D.C.basis, Standard: D.C.standard, Profi: D.C.profi }[st.niveau], color: 'auto' } }),
    ] }),
    D.p(st.kontext, { size: 20, after: 60 }),
    ...D.bullets(st.regeln, { size: 20 }),
    D.p('**' + st.sigma + '**' + (st.legende ? '  (' + st.legende + ')' : ''), { size: 20, before: 60, after: 60 }),
    D.table([['soll akzeptiert werden', 'soll abgelehnt werden'], [tt(c.ja), tt(c.nein)]], { widthsCm: [8.2, 8.2], size: 19, noSpacer: true }),
    D.p('*Tipp:* ' + st.tipp, { size: 19, color: D.C.muted, before: 80, after: 20 }),
  ];
  if (st.app) kids.push(D.p(`**Selbstkontrolle:** AutomatenLab \`${st.app}\``, { size: 19, color: D.C.teal, after: 0 }));
  return [D.box(kids, { fill: D.C.tealTint2, border: D.C.teal, borderSize: 6 }), D.spacer(200)];
}

// =====================================================================================  Arbeitsblatt (Stationsheft)
async function ab() {
  const body = [
    D.p('In der Modellierungswerkstatt werdet ihr zu Expertinnen und Experten für **ein** System aus dem Alltag. Ihr entwickelt dafür einen DEA, testet ihn gründlich – und versucht anschließend, in den Automaten der anderen Gruppen **Bugs** zu finden. Wer Fehler findet, bekommt Punkte. Wer keine Fehler hat, auch.'),
    D.table([
      ['Phase', 'Zeit', 'Was ihr tut'],
      ['1  Modellieren', '35 min', 'Station bearbeiten: Automat entwickeln, in der App-Sandbox oder auf flaci.com umsetzen, testen, dokumentieren.'],
      ['2  Bug-Bounty', '25 min', 'Zwei Runden: Ihr besucht andere Stationen und sucht mit Testwörtern Fehler. Eine Person bleibt als „Verteidiger“ an eurer Station.'],
      ['3  Korrektur', '20 min', 'Gefundene Bugs reparieren, Kurzpräsentation (2 min): Σ, Graph, Bedeutung der Zustände, schwierigster Testfall.'],
      ['4  Sicherung', '5 min', 'Gemeinsamer Fehlerkatalog „Typische Modellierungsfehler“.'],
    ], { widthsCm: [3.2, 1.8, 12.4], size: 19, firstColBold: true }),
    ...D.info('Das gebt ihr ab (Dokumentation Phase 1)', [...D.numbered([
      '**Eingabealphabet Σ** mit Erklärung jedes Zeichens.',
      '**Zustandsgraph** – vollständig oder mit dem Hinweis zum Fehlerzustand.',
      '**Bedeutung jedes Zustands** im Sachzusammenhang („Der Automat ist in Si, wenn …“).',
      '**Testprotokoll:** die Testwörter der Stationskarte plus mindestens vier eigene Grenzfälle (ε, sehr kurze Wörter, Wörter knapp neben der Regel) mit Zustandsfolge.',
    ], { ref: 'numbers', size: 20 })]),
    ...D.qr({ route: '#/baukasten?modus=frei', title: 'Baukasten · Freier Modus (Sandbox)', text: 'Eigenes Σ festlegen, Automat bauen, Wörter testen und als JSON/DOT exportieren. So können die anderen Gruppen euren Automaten in der Bug-Bounty-Phase direkt ausprobieren.' }),
    D.pageBreak(),
    D.h2('Stationskarten'),
    ...STATIONEN.flatMap((st, i) => (i === 2 ? [karte(st)[0], D.pageBreak()] : karte(st))),
    D.pageBreak(),
    D.h2('Dokumentation unserer Station'),
    D.small('Phase 1 im Unterricht, sauber fertigstellen als Hausaufgabe.'),
    D.p('Station: ……   Gruppe: ……………………………………………………………………', { after: 120 }),
    D.p('Σ = ……………………………………   Bedeutung der Zeichen: ………………………………………………………………………', { after: 120 }),
    ...D.drawBox(6.5, 'Zustandsgraph (Hinweis zum Fehlerzustand nicht vergessen!)'),
    ...D.fillTable(['Zustand', 'Bedeutung im Sachzusammenhang'], 6, { widthsCm: [2.4, 15.0], rowHeightCm: 0.7 }),
    ...D.fillTable(['Testwort', 'soll akzeptiert?', 'Zustandsfolge in unserem Automaten', 'ok?'], 6, { widthsCm: [2.8, 2.6, 10.0, 2.0], rowHeightCm: 0.7 }),
    D.h3('Selbstcheck – Level 4 geschafft, wenn …'),
    ...D.checklist([
      'ich ein reales System in Eingabezeichen, Zustände und Übergänge übersetzen kann.',
      'ich meinen Automaten systematisch mit Grenzfällen teste und das Testprotokoll führe.',
      'ich in fremden Automaten gezielt Fehler finde und mit einem Gegenbeispiel belege.',
      'ich die Bedeutung meiner Zustände im Sachzusammenhang dokumentiere.',
    ]),
    D.pageBreak(),
    D.h2('Bug-Bounty-Protokoll'),
    ...D.tip('Regeln der Jagd', [...D.bullets([
      'Ein **Bug** ist ein Testwort, bei dem der Automat anders entscheidet, als die Stationskarte verlangt. Der Verteidiger prüft es in der App/auf flaci und bestätigt mit Unterschrift.',
      '**Punkte:** bestätigter Bug **+3** für die Finder · Formfehler (fehlender Hinweis zum Fehlerzustand, zwei Pfeile mit gleichem Zeichen, Bedeutung fehlt) **+1** · Station ohne Bug nach beiden Runden: **+5** Bonus für die Gastgeber.',
      'Jeder Bug zählt nur einmal (wer zuerst kommt …). In Phase 3 gibt jeder reparierte Bug den Gastgebern **+1** zurück.',
    ], { size: 20 })]),
    D.p('Unsere Gruppe: ……………………………   besuchte Stationen: ……… und ………', { after: 120 }),
    ...D.fillTable(['Station', 'Testwort', 'soll', 'Automat sagt', 'Bug / Formfehler – Beschreibung', 'bestätigt', 'Punkte'], 8,
      { widthsCm: [1.6, 2.6, 1.5, 2.0, 5.6, 2.3, 1.8], rowHeightCm: 0.75, size: 18 }),
    D.p('Summe unserer Punkte: ………   Bugs an unserer Station: ………   davon repariert: ………', { before: 80 }),
    D.h2('Fehlerkatalog „Typische Modellierungsfehler“'),
    D.p('Tragt in der Sicherung Beispiele aus der Werkstatt ein.', { size: 20 }),
    D.table([
      ['Fehlertyp', 'Beispiel aus der Werkstatt', 'So vermeiden wir ihn'],
      ...['Neuanfang vergessen (falsche Rückkante)', 'Unvollständig ohne Hinweis zum Fehlerzustand', 'Endzustand falsch gewählt (oder ε vergessen)', 'Nichtdeterminismus (zwei Pfeile mit gleichem Zeichen)', 'Zustand ohne klare Bedeutung / doppelte Zustände', 'Zeichen außerhalb von Σ benutzt']
        .map((f) => [f, '', '']),
    ], { widthsCm: [5.4, 6.0, 6.0], size: 18, rowHeightCm: 0.95, firstColBold: true }),
  ];
  return D.save(D.doc({ kind: 'AB', ds: 4, title: T, subtitle: SUB, kernfrage: KF, body }), OUT + 'DS04_AB_Modellierungswerkstatt.docx');
}

// =====================================================================================  Lehrkraft
async function lk() {
  const qDesc = { q1: '„4“', q2: '„42“', q3: '„42x“', q4: '„42x0“', q5: '„42x00“' };
  const pinBed = Object.entries(SOL.pin_mean).map(([s, qs]) => {
    const act = qs.filter((q) => q !== 'q0').map((q) => qDesc[q]);
    return [s, act.length ? 'zuletzt gelesen: ' + act.join(' und zugleich ') : 'kein Anfang des Musters am Ende'];
  });
  const loesung = (st, img, w, extra) => [
    D.h3(`Station ${st.id} – ${st.titel}`),
    ...D.img(IMG + img, { widthCm: w }),
    ...extra,
  ];
  const tests = (obj) => D.table([['Testwort', 'Verarbeitung durch die Musterlösung'], ...Object.entries(obj).map(([w, p]) => [eps(w), p])], { widthsCm: [2.6, 14.8], size: 18 });
  const body = [
    D.h2('Überblick'),
    D.table([
      ['Aspekt', 'Inhalt'],
      ['Lernziele', 'Die SuS modellieren reale Systeme als DEA (Σ festlegen, Zustände mit Bedeutung, Übergänge), setzen ihr Modell in der App-Sandbox bzw. auf flaci.com um, testen es systematisch und prüfen die Modelle anderer Gruppen mit Gegenbeispielen (Bug-Bounty).'],
      ['KC-Bezug', 'K3 (Automaten als Zustandsgraphen entwickeln und implementieren), K4 (Funktion gegebener Automaten analysieren); PK1.5 (Modelle entwickeln), PK3.2 (Lösungen überprüfen und bewerten), PK3.4 (kooperativ arbeiten), IK3.4.'],
      ['Abi-Bezug', 'Modellieren im Sachkontext wie in allen Block-2-Aufgaben zu Automaten. Vertiefung: **Abi 2022 eA Aufgabe C, Teile a und b** (Trainerentlassung – Original mit Summenregel „insgesamt weniger als 3 Punkte“, Station E ist eine vereinfachte Variante), **Abi 2021 Nachschreibtermin eA Aufgabe D, Teil a** (RobProg: Syntax-Prüfung als DEA, ähnlich Station B), **Abi 2024 eA Aufgabe B, Teil a** (Graph vervollständigen). Die Kontexte A–D stammen aus der DEA-Aufgabensammlung (AB01 der Lehrkraft) und wurden an die Notation 2025 angepasst.'],
      ['Material', 'Folien DS04, Stationsheft AB04 (Stationskarten, Dokumentation, Bug-Bounty-Protokoll, Fehlerkatalog), Merkblätter M01/M02, iPads mit AutomatenLab `#/baukasten?modus=frei` (Sandbox) bzw. flaci.com; Selbstkontrolle `#/baukasten?aufgabe=pin-42x00` und `#/baukasten?aufgabe=trainer`; A3-Papier für Plakate.'],
      ['Vorbereitung', 'Stationsheft für alle kopieren; jede Stationskarte zusätzlich einmal auf A4 vergrößert an den Gruppentisch legen. Sechs Gruppen (3–4 SuS) nach Leistungsstand bilden (Station A für starke Gruppen, B/C für schwächere). Punktetabelle an der Tafel.'],
    ], { widthsCm: [3.2, 14.2], firstColBold: true, firstColFill: true }),
    D.h2('Verlaufsplan (90 Minuten)'),
    D.table([
      ['Zeit', 'Phase', 'Unterrichtsgeschehen', 'Sozialform / Medien'],
      ['0–5', 'Einstieg', 'Warm-up: Die HA-Challenges aus Level 3 tauschen (Sitznachbar löst die eigene Challenge des anderen). Überleitung: „Woran merkt man, dass ein Modell stimmt?“', 'PA, Folien 2–3'],
      ['5–40', 'Phase 1: Modellieren', 'Expertengruppen an sechs Stationen: Σ festlegen, Graph entwickeln, in Sandbox/flaci umsetzen, Testprotokoll führen, Bedeutungen dokumentieren, Plakat erstellen. Lehrkraft gibt gestufte Tipps (siehe unten).', 'GA, Stationsheft, iPads'],
      ['40–65', 'Phase 2: Bug-Bounty', 'Zwei Runden à ca. 11 min nach Rotationsplan. Ein Verteidiger bleibt an der Station, die anderen jagen Bugs und führen das Protokoll. Punkte werden an der Tafel gesammelt.', 'GA (rotierend), Protokoll'],
      ['65–85', 'Phase 3: Korrektur', 'Bugs reparieren (10 min), dann Kurzpräsentationen à 2 min: Σ, Graph, Bedeutung der Zustände, schwierigster Testfall. Siegerehrung.', 'GA, Präsentation'],
      ['85–90', 'Sicherung', 'Fehlerkatalog „Typische Modellierungsfehler“ gemeinsam füllen (Folie 15). HA erteilen.', 'UG, Stationsheft'],
    ], { widthsCm: [1.6, 2.6, 10.0, 3.2], size: 19 }),
    D.h2('Organisation der Bug-Bounty'),
    D.table([
      ['Gruppe von Station', 'A', 'B', 'C', 'D', 'E', 'F'],
      ['Runde 1 besucht', 'B', 'C', 'D', 'E', 'F', 'A'],
      ['Runde 2 besucht', 'D', 'E', 'F', 'A', 'B', 'C'],
    ], { widthsCm: [4.4, 2.15, 2.15, 2.15, 2.15, 2.15, 2.15], size: 19, allCenter: true, firstColBold: true }),
    D.table([
      ['Ereignis', 'Punkte'],
      ['Bestätigter Bug (Testwort, bei dem der Automat falsch entscheidet)', '+3 für die Finder'],
      ['Formfehler (Hinweis zum Fehlerzustand fehlt, Nichtdeterminismus, Bedeutung fehlt)', '+1 für die Finder'],
      ['Station übersteht beide Runden ohne Bug', '+5 für die Gastgeber'],
      ['Bug in Phase 3 repariert und vorgeführt', '+1 für die Gastgeber'],
    ], { widthsCm: [12.4, 5.0], size: 19 }),
    ...D.tip('Hinweise', [...D.bullets([
      'Der Verteidiger entscheidet nicht über die Regel, sondern prüft nur das Verhalten des Automaten. Strittige Fälle (Regel unklar?) entscheidet die Lehrkraft anhand der Stationskarte.',
      'Gute Bug-Jäger testen Grenzfälle: ε, sehr kurze Wörter, Überlappungen (Station A: `4242400` muss akzeptiert werden), Zeichen nach dem Ende (Station B: `…@XBPxxx`), verbotene Fahrten (Station D: `wmz`).',
      'Gestufte Tipps in Phase 1: (1) Hinweis aus der Stationskarte, (2) Bedeutung der ersten zwei Zustände vorgeben, (3) Musterlösung ohne Beschriftungen zeigen.',
    ], { size: 20 })]),

    D.h2('Musterlösungen der Stationen'),
    D.p('Alle Automaten wurden gegen die Regel der Stationskarte für sämtliche Wörter bis zur angegebenen Länge geprüft (Python, automata.py). Gleichwertige Lösungen mit anderer Zustandsnummerierung sind selbstverständlich richtig.', { size: 20 }),
    ...loesung(STATIONEN[0], 'pin.png', 11.5, [
      D.p(`Überlappung: ${SOL.pin_overlap}.`, { size: 20 }),
      D.p(`Vollständiger DEA mit **${SOL.pin_n} Zuständen** (kein Fehlerzustand nötig: Jede Eingabe kann noch zu einer gültigen werden). Er entsteht am einfachsten über einen NEA („rate, wo 42 beginnt“) und Teilmengenkonstruktion – das ist Stoff von Level 8; hier genügt systematisches Überlegen „was passt am Ende vom Muster?“.`, { size: 20 }),
      D.table([['Zustand', 'Bedeutung'], ...pinBed], { widthsCm: [2.2, 15.2], size: 18, center: [0] }),
      D.p(`Testwörter der Stationskarte (Simulation der Musterlösung): akzeptiert ${SOL.cards.A.ja.join(' · ')}; abgelehnt ${SOL.cards.A.nein.join(' · ')}.`, { size: 20 }),
    ]),
    ...loesung(STATIONEN[1], 'xmail.png', 13, [
      D.p(`${FEHLER} S2 und S5: Ab dem zweiten Buchstaben dürfen beliebig viele weitere folgen (Schleife). S6–S11 prüfen die feste Domain. Ein S (Sonderzeichen) führt immer in den Fehlerzustand.`, { size: 20 }),
      tests(SOL.xm_tests),
      D.p('Zusatz: Zum Erzeugen der Adresse aus „Vorname Nachname“ braucht man einen Automaten **mit Ausgabe** (Mealy-Automat, Level 6): Leerzeichen → Ausgabe „.“, Großbuchstaben → Kleinbuchstaben, am Ende Ausgabe „@XB.xx“.', { size: 20 }),
    ]),
    ...loesung(STATIONEN[2], 'smiley.png', 10, [
      D.p(`${FEHLER} Erkannt werden ${SOL.sm_akz.length} Smileys: ${SOL.sm_akz.join('  ·  ')}. S1 und S2 sind nicht zusammenfassbar: Aus S1 ist eine Nase noch erlaubt, aus S2 nicht (Wort „:--)“).`, { size: 20 }),
    ]),
    ...loesung(STATIONEN[3], 'mwzk.png', 17, [
      D.p(`${FEHLER} Zustand = Belegung „linkes Ufer | rechtes Ufer“. Es gibt ${Object.keys(SOL.mw_states).length} sichere, erreichbare Belegungen. Die kürzesten Lösungen haben 7 Fahrten: ${SOL.mw_loesungen.map((w) => '`' + w + '`').join(' und ')}. Beispiel: ${SOL.mw_path}.`, { size: 20 }),
    ]),
    ...loesung(STATIONEN[4], 'trainer.png', 11, [
      D.p('Bedeutung: S0 – letztes Spiel gewonnen (oder noch kein Spiel); S1 bzw. S2 – die letzten ein bzw. zwei Spiele ohne Sieg; S3 – Trainer entlassen (bleibt so).', { size: 20 }),
      tests(SOL.tr_tests),
      D.p(`Zusatz: Nach „30“ ist der Automat in S1 (ein Spiel ohne Sieg), nach „03“ in S0. Fortsetzung „${SOL.tr_30_03[0]}“: ${SOL.tr_30_03[1]}; ${SOL.tr_30_03[2]}. Im Original (Abi 2022 eA C b) gilt die strengere Summenregel „insgesamt weniger als 3 Punkte“; dort muss sich der Automat die letzten zwei Ergebnisse genauer merken (minimaler DEA mit ${SOL.tr_summe_n} Zuständen) – gute Vertiefung für starke Gruppen.`, { size: 20 }),
    ]),
    ...loesung(STATIONEN[5], 'fahrstuhl.png', 10, [
      D.p(`${FEHLER} Zustand = Paar (Etage, Tür): ` + Object.entries(SOL.lift_states).map(([q, [e, t]]) => `${q} = (${e}, ${t})`).join(', ') + '. S0 ist Start- und Endzustand, deshalb wird auch das leere Protokoll ε akzeptiert.', { size: 20 }),
      tests(SOL.lift_tests),
    ]),
    D.h2('Erwartungshorizont Fehlerkatalog'),
    D.table([
      ['Fehlertyp', 'typisches Beispiel', 'Gegenmittel'],
      ['Neuanfang vergessen', 'Station A: nach „424“ zurück nach S0 – dann wird `4242400` fälschlich abgelehnt.', 'Fragen: „Was passt am Ende gerade vom Muster?“'],
      ['Unvollständig ohne Hinweis', 'Station B/C/D: Fehlerzustand fehlt, kein Hinweis.', 'Hinweissatz immer unter den Graphen schreiben.'],
      ['Endzustand / ε falsch', 'Station F: S0 nicht als Endzustand markiert.', 'ε und kürzeste Wörter zuerst testen.'],
      ['Nichtdeterminismus', 'Station C: zwei Pfeile mit „)“ aus S1.', 'Pro Zustand Tabelle Zeichen → Folgezustand anlegen.'],
      ['Doppelte/unklare Zustände', 'Station E: getrennte Zustände für „0“ und „1“ nach einem Sieg.', 'Bedeutung jedes Zustands aufschreiben; gleiche Bedeutung ⇒ ein Zustand.'],
      ['Zeichen außerhalb von Σ', 'Station B: Ziffern direkt statt S.', 'Σ vor dem Zeichnen festlegen und erklären.'],
    ], { widthsCm: [3.6, 7.8, 6.0], size: 18, firstColBold: true }),
    D.h2('Differenzierung'),
    ...D.bullets([
      '**Basis:** Stationen B und C; Tipp-Stufen nutzen.',
      '**Standard:** Stationen D, E, F; Zusatzaufgaben auf den Karten.',
      '**Profi:** Station A (Selbstkontrolle über die Baukasten-Challenge), anschließend E mit der Original-Summenregel.',
    ]),
    D.p('**Hausaufgabe:** Die eigene Station sauber dokumentieren (Σ mit Erklärung, vollständiger Graph bzw. Hinweis, Bedeutung jedes Zustands, Testprotokoll) – Vorlage „Dokumentation unserer Station“ im Stationsheft. Die Plakate können bis DS05 im Raum hängen bleiben.'),
  ];
  return D.save(D.doc({ kind: 'LK', ds: 4, title: T, subtitle: SUB, kernfrage: KF, body }), OUT + 'DS04_Lehrkraft_Modellierungswerkstatt.docx');
}

// =====================================================================================  Folien
async function folien() {
  const d = S.deck({ ds: 4, title: T });
  d.title({ title: T, subtitle: SUB, kernfrage: KF, notes: 'Level 4: Heute modelliert ihr echte Systeme – und prüft die Modelle der anderen. Wer Fehler findet, punktet.' });
  d.section({ phase: 'Einstieg', title: 'Willkommen in der Werkstatt' });
  d.question({ text: 'Euer Automat besteht alle Testwörter der Aufgabe. Ist er damit richtig?', sub: 'Woran erkennt man ein **gutes** Modell – und wie findet man Fehler, die man selbst übersieht?', notes: 'Antworten sammeln: Testwörter decken nicht alles ab; Grenzfälle; fremde Augen finden mehr Fehler → Bug-Bounty. Vorher: HA-Challenges tauschen (5 min).' });
  d.table({ title: 'Sechs Stationen', phase: 'Einstieg', size: 20, colW: [1.0, 3.4, 5.8, 1.9], rows: [
    ['', 'Station', 'Kern der Modellierung', 'Niveau'],
    ...STATIONEN.map((st) => [st.id, st.titel, st.sigma + ({ A: ' · Muster am Ende mit Platzhalter', B: ' · lange feste Kette', C: ' · endliche Menge von Wörtern', D: ' · Zustand = Ufer-Belegung', E: ' · Zählen mit Zurücksetzen', F: ' · Paare (Etage, Tür)' }[st.id]), st.niveau]),
  ], notes: 'Gruppen einteilen: Station A für starke Gruppen, B/C für schwächere, D–F Standard.' });
  d.section({ phase: 'Werkstatt', title: 'Expertengruppen an die Arbeit' });
  d.task({ title: 'Phase 1: Modellieren', phase: 'Werkstatt', steps: [
    '**Σ festlegen** und jedes Zeichen erklären.',
    '**Erinnerungen** sammeln → Zustände mit Bedeutung.',
    'Automat in der **Sandbox** oder auf **flaci.com** bauen.',
    '**Testprotokoll:** Testwörter der Karte + mindestens vier eigene Grenzfälle.',
    '**Plakat:** Σ, Graph, Bedeutungen, Hinweis zum Fehlerzustand.',
  ], zeit: '35 min', sozialform: 'Expertengruppen', material: 'Stationsheft, iPad', app: '#/baukasten?modus=frei', notes: 'Gestufte Tipps: (1) Tipp der Karte, (2) Bedeutung der ersten zwei Zustände, (3) Musterlösung ohne Beschriftungen.' });
  d.app({ title: 'Sandbox: Baukasten im freien Modus', route: '#/baukasten?modus=frei', text: 'Eigenes Σ, Automat als Graph oder Tabelle, Wörter testen, Export als JSON/DOT. Selbstkontrolle für Station A und E: `#/baukasten?aufgabe=pin-42x00` und `#/baukasten?aufgabe=trainer`.', phase: 'Werkstatt', notes: 'Die Challenges prüfen die Sprache und zeigen ein Gegenbeispiel – für A und E ideal zur Selbstkontrolle, bevor die Bug-Bounty beginnt.' });
  d.section({ phase: 'Werkstatt', title: 'Auf Bug-Jagd' });
  d.task({ title: 'Phase 2: Bug-Bounty', phase: 'Werkstatt', steps: [
    'Eine Person bleibt als **Verteidiger** an eurer Station.',
    'Die anderen besuchen in zwei Runden je eine fremde Station (Rotationsplan).',
    'Sucht **Testwörter**, bei denen der Automat falsch entscheidet – Grenzfälle!',
    'Verteidiger prüft und bestätigt – ihr tragt alles ins **Protokoll** ein.',
  ], zeit: '2 × 11 min', sozialform: 'rotierend', material: 'Bug-Bounty-Protokoll', notes: 'Rotationsplan: Runde 1 jede Gruppe eine Station weiter (A→B …), Runde 2 drei Stationen weiter (A→D …).' });
  d.table({ title: 'Punkte und Rotation', phase: 'Werkstatt', size: 20, colW: [8.6, 3.5], rows: [
    ['Ereignis', 'Punkte'],
    ['Bestätigter Bug (falsche Entscheidung bei einem Testwort)', '+3 Finder'],
    ['Formfehler (Hinweis fehlt, Nichtdeterminismus, Bedeutung fehlt)', '+1 Finder'],
    ['Station ohne Bug nach beiden Runden', '+5 Gastgeber'],
    ['Bug in Phase 3 repariert', '+1 Gastgeber'],
    ['Rotation – Runde 1: A→B, B→C, C→D, D→E, E→F, F→A', ''],
    ['Rotation – Runde 2: A→D, B→E, C→F, D→A, E→B, F→C', ''],
  ], notes: 'Jeder Bug zählt nur einmal. Strittige Fälle entscheidet die Lehrkraft anhand der Stationskarte.' });
  d.cards({ title: 'Profi-Tipps für Bug-Jäger', phase: 'Werkstatt', cards: [
    { head: 'Grenzfälle', text: 'ε, ein einzelnes Zeichen, das kürzeste gültige Wort', icon: 'LuRuler' },
    { head: 'Überlappung', text: 'Station A: `4242400` muss akzeptiert werden.', icon: 'LuLayers' },
    { head: 'Zu viel am Ende', text: 'Station B: `aaPaa@XBPxxx` – nach dem Ende darf nichts mehr kommen.', icon: 'LuCircleSlash' },
    { head: 'Verbotene Züge', text: 'Station D: `wmz` – Ziege und Kohl bleiben allein.', icon: 'LuBan' },
  ], notes: 'Erst nach einigen Minuten Bug-Bounty einblenden, falls Gruppen keine Ideen haben.' });
  d.section({ phase: 'Werkstatt', title: 'Reparieren und präsentieren' });
  d.task({ title: 'Phase 3: Reparieren und vorstellen', phase: 'Werkstatt', steps: [
    'Gefundene Bugs **reparieren** und mit dem Bug-Wort erneut testen (10 min).',
    '**Kurzpräsentation** (2 min): Σ, Graph, Bedeutung der Zustände.',
    'Euer **schwierigster Testfall** – und warum er schwierig war.',
  ], zeit: '20 min', sozialform: 'Gruppen → Plenum', material: 'Plakat, iPad', notes: 'Reihenfolge der Präsentationen: B, C, F, D, E, A (vom Einfachen zum Schweren). Am Ende Punkte auszählen.' });
  d.section({ phase: 'Sicherung', title: 'Fehlerkatalog' });
  d.table({ title: 'Typische Modellierungsfehler', phase: 'Sicherung', size: 20, colW: [3.6, 4.6, 3.9], rows: [
    ['Fehlertyp', 'Beispiel', 'Gegenmittel'],
    ['Neuanfang vergessen', 'A: nach „424“ zurück nach S0', '„Was passt am Ende?“'],
    ['Unvollständig ohne Hinweis', 'B, C, D: Fehlerzustand fehlt', 'Hinweissatz notieren'],
    ['Endzustand / ε falsch', 'F: leeres Protokoll abgelehnt', 'ε zuerst testen'],
    ['Nichtdeterminismus', 'C: zwei „)“-Pfeile aus S1', 'Tabelle je Zustand'],
    ['Doppelte Zustände', 'E: „nach 0“ und „nach 1“ getrennt', 'Bedeutung aufschreiben'],
    ['Zeichen außerhalb Σ', 'B: Ziffern statt S', 'Σ zuerst festlegen'],
  ], notes: 'Zuerst die SuS-Beispiele aus den Protokollen sammeln; die Beispiele hier sind Vorschläge zum Aufdecken.' });
  d.merke({ title: 'Merke: Gut modelliert ist …', items: [
    '… ein Automat mit **klar erklärtem Σ** und **Bedeutung für jeden Zustand**.',
    '… **vollständig** oder mit dem **Hinweis** zum Fehlerzustand angegeben.',
    '… mit **Grenzfällen** getestet: ε, kurze Wörter, Überlappungen, Zeichen nach dem Ende.',
    '… von **anderen** geprüft – fremde Augen finden die meisten Bugs.',
  ] });
  d.end({ items: ['Reale Systeme als DEA modellieren', 'Modelle systematisch testen und dokumentieren', 'Fehler in fremden Automaten mit Gegenbeispielen nachweisen', 'Typische Modellierungsfehler kennen'], hausaufgabe: 'Eigene Station sauber dokumentieren: Σ mit Erklärung, vollständiger Graph bzw. Hinweis, Bedeutung jedes Zustands, Testprotokoll (Vorlage im Stationsheft).' });
  return d.save(OUT + 'DS04_Folien_Modellierungswerkstatt.pptx');
}

(async () => {
  const files = [await ab(), await lk(), await folien()];
  console.log(files.join('\n'));
})();
