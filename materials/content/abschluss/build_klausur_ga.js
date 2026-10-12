const __MAT = require('path').resolve(__dirname, '../..'); // Wurzel: materials/
// Übungsklausur Grundkurs (gA) „Fahrradverleih“ + Erwartungshorizont – Kern des KC: DEA, Mealy, Grenzen endlicher Automaten.
// Alle Lösungen aus automata_klausur_ga.py (geprüft, build/klausur_ga.json).
const D = require((__MAT + '/lib/docstyle.js'));
const IMG = (__MAT + '/build/img/abschluss/');
const OUT = (__MAT + '/out/');
const L = require((__MAT + '/build/klausur_ga.json'));
const TITLE = 'Übungsklausur „Fahrradverleih“';
const SUB = 'Endliche Automaten · grundlegendes Anforderungsniveau (Grundkurs) · 90 Minuten · 30 BE';

const be = (n) => `[${n} BE]`;
const teil = (l, text, n) => new D.Paragraph({ children: [new D.TextRun({ text: `${l})  `, font: D.FONT_BODY, bold: true, size: 22, color: D.C.teal }), ...D.runs(text), new D.TextRun({ text: '  ' + be(n), font: D.FONT_BODY, size: 20, color: D.C.muted })], indent: { left: 360, hanging: 360 }, spacing: { after: 120, line: 276 } });
const ja = (w) => (L.a[w].akzeptiert ? 'akzeptiert' : 'abgelehnt');

// =====================================================================================  Klausur
async function klausur() {
  const body = [
    D.info('Hinweise', [
      ...D.bullets([
        'Bearbeitungszeit **90 Minuten**, insgesamt **30 BE**. Hilfsmittel: Operatorenliste.',
        'Notation wie im Zentralabitur: Zustände S0, S1, …; Startzustand mit Pfeil „Start“, Endzustände doppelt umrandet; Mealy-Kanten „Eingabe / Ausgabe“, leere Ausgabe ε.',
        'Entwickelte Automaten werden **vollständig** angegeben oder mit dem Hinweis „Alle nicht eingezeichneten Übergänge führen in einen Fehlerzustand.“ versehen.',
      ], { size: 20 }),
    ]),
    D.h2('Aufgabe: Fahrradverleih'),
    D.p('An den Stationen eines städtischen Fahrradverleihs wird ein Rad mit einem **Ausleihcode** entsperrt. Ein Ausleihcode beginnt mit der Radart – R (normales Rad) oder E (E-Bike) – und besteht danach aus **mindestens zwei Ziffern** 0 oder 1. Damit Tippfehler auffallen, muss die Ziffer 1 im Code **gerade oft** vorkommen. Beispiele für gültige Codes: `R00`, `E0110`, `R11`; keine gültigen Codes sind `E1`, `R` und `R010`.', { justify: true }),
    D.p('In Abbildung 1 im Material ist der Zustandsgraph eines endlichen Automaten A über dem Eingabealphabet Σ = {R, E, 0, 1} gegeben, der genau die gültigen Ausleihcodes akzeptiert.', { justify: true }),
    teil('a', '**Stellen Sie** die Verarbeitung der Eingaben `R0110` und `E1` durch den Automaten A **dar**, **entscheiden Sie** jeweils, ob die Eingabe akzeptiert wird, und **geben Sie** zwei weitere gültige Ausleihcodes der Länge 4 **an**.', 5),
    teil('b', '**Erläutern Sie** die Bedeutung der Zustände S2 und S3 in Bezug auf die vorliegende Problemstellung.', 3),
    teil('c', '**Begründen Sie**, dass der Automat A den Code `E101` akzeptiert, den Code `E1011` aber nicht, ohne die Zustandsfolge vollständig anzugeben.', 3),
    D.p('Für ein neues Codesystem gilt: Nach der Radart folgt **mindestens eine** Ziffer 0 oder 1. Codes für E-Bikes müssen zusätzlich **mit der Ziffer 1 enden**; für normale Räder gibt es keine weitere Bedingung.', { justify: true }),
    teil('d', '**Entwickeln Sie** den Zustandsgraphen eines endlichen Automaten über Σ = {R, E, 0, 1}, der genau die Codes des neuen Systems akzeptiert.', 5),
    D.p('Eine Ausleihe kostet **3 €**. Am Automaten der Station kann mit 1-€- und 2-€-Münzen bezahlt werden. Der Mealy-Automat M in Abbildung 2 beschreibt die Kasse: Die Eingabe 1 bzw. 2 steht für den Einwurf einer Münze, die Ausgabe F für die Freigabe eines Rades und die Ausgabe 1 für 1 € Rückgeld.', { justify: true }),
    teil('e', '**Geben Sie** die Ausgabe des Mealy-Automaten M für die Eingabe `2212` **an** und **erläutern Sie** die Bedeutung des Zustands P2 sowie der Ausgabe „F1“ im Sachzusammenhang.', 4),
    teil('f', 'Der Preis einer Ausleihe wird auf **4 €** erhöht. **Entwickeln Sie** den Zustandsgraphen eines Mealy-Automaten, der die Kasse für den neuen Preis beschreibt.', 4),
    D.p('Jede Station protokolliert am Tag die Folge der Ausleihen A und Rückgaben R. Ein **Tagesprotokoll** über Σ = {A, R} ist gültig, wenn nie mehr Räder zurückgegeben als ausgeliehen wurden und am Ende des Tages alle Räder wieder an der Station stehen. Beispiele: `AR`, `AARR`, `ARAR`; nicht gültig: `RA`, `AAR`.', { justify: true }),
    teil('g', 'Eine kleine Station hat nur **zwei** Räder. **Entwickeln Sie** den Zustandsgraphen eines endlichen Automaten, der genau die gültigen Tagesprotokolle dieser Station akzeptiert.', 3),
    teil('h', 'Für eine Station mit **beliebig vielen** Rädern soll ebenfalls ein Automat die gültigen Tagesprotokolle erkennen. **Begründen Sie**, dass es dafür keinen endlichen Automaten gibt.', 3),
    new D.Paragraph({ children: [new D.TextRun({ text: 'Material', font: D.FONT_HEAD, size: 30, bold: true, color: D.C.teal })], spacing: { before: 0, after: 120 }, keepNext: true, pageBreakBefore: true }),
    D.h3('zu den Aufgabenteilen a) bis c)'),
    D.p('Σ = {R, E, 0, 1}', { size: 21 }),
    D.img(IMG + 'klausur_ga_A.png', { widthCm: 16.5, caption: 'Abbildung 1: Zustandsgraph des Automaten A. Hinweis: Alle nicht eingezeichneten Übergänge führen in einen Fehlerzustand.' }),
    D.h3('zu den Aufgabenteilen e) und f)'),
    D.p('Σ = {1, 2},  Ω = {F, 1}', { size: 21 }),
    D.img(IMG + 'klausur_ga_M.png', { widthCm: 15, caption: 'Abbildung 2: Zustandsgraph des Mealy-Automaten M (Zustand Pi: bisher i € eingeworfen)' }),
  ];
  return D.save(D.doc({ kind: 'KL', niveau: 'alle', title: TITLE, subtitle: SUB, metaText: 'Abi-Training  ·  Welt A und Level 7', code: 'Übungsklausur gA · Fahrradverleih', titleSize: 34, body }), OUT + 'Uebungsklausur_Grundkurs_Endliche-Automaten.docx');
}

// =====================================================================================  Erwartungshorizont
async function eh() {
  const p = (t) => D.p(t, { size: 19 });
  const row = (l, items, n, afb) => [l, items, String(n), afb];
  const bsp = L.a_beispiele.filter((w) => w !== 'E101').slice(0, 4).map((w) => `\`${w}\``).join(', ');
  const tabF = [['Zustand', '1', '2'], ...L.f_tabelle];
  const rows = [
    ['Teil', 'Erwartete Leistung', 'BE', 'AFB'],
    row('a', [p(`\`R0110\`: ${L.a.R0110.folge} ⇒ ${ja('R0110')} (S4 ist Endzustand). (2 BE)`), p(`\`E1\`: ${L.a.E1.folge} ⇒ ${ja('E1')} (S3 ist kein Endzustand; nur eine Ziffer, Anzahl der 1 ungerade). (1 BE)`), p(`Zwei gültige Codes der Länge 4, z. B. ${bsp} (je 1 BE).`)], 5, 'I'),
    row('b', [p('**S2:** Die Radart und genau eine Ziffer, eine 0, wurden gelesen; die Anzahl der 1 ist gerade (null), aber es fehlt noch mindestens eine Ziffer. (1,5 BE)'), p('**S3:** Nach der Radart wurde mindestens eine Ziffer gelesen und die Ziffer 1 kam bisher **ungerade** oft vor; der Code ist (noch) ungültig, eine weitere 1 macht die Anzahl wieder gerade. (1,5 BE)')], 3, 'II'),
    row('c', [p(`\`E101\` enthält nach der Radart drei Ziffern (also mindestens zwei) mit zwei Einsen – eine gerade Anzahl; der Automat endet im Endzustand S4 (${L.a.E101.folge}). (1,5 BE)`), p(`\`E1011\` enthält drei Einsen – eine ungerade Anzahl. Der Automat steht nach der letzten 1 in S3 (${L.a.E1011.folge}), S3 ist kein Endzustand ⇒ abgelehnt. (1,5 BE)`)], 3, 'II'),
    row('d', [p('Der Automat muss sich merken, welche Radart gelesen wurde (zwei getrennte Zweige) und im E-Zweig, ob die zuletzt gelesene Ziffer eine 1 war. R-Zweig: S1 (R gelesen) –0, 1→ S2 (Endzustand, Schleife 0, 1). E-Zweig: S3 (E gelesen), S4 (letzte Ziffer 1, Endzustand), S5 (letzte Ziffer 0). (Zweige 2 BE, Übergänge 2 BE, Start-/Endzustände und Fehlerzustand-Hinweis 1 BE)'), ...D.img(IMG + 'klausur_ga_AD.png', { widthCm: 11, caption: 'Alle nicht eingezeichneten Übergänge führen in einen Fehlerzustand.' })], 5, 'III'),
    row('e', [p(`Ausgabe für \`2212\`: ${L.e.folge}, also **${L.e.ausgabe}**. (2 BE)`), p('**P2:** Es wurden bisher 2 € eingeworfen; es fehlt noch 1 €. **Ausgabe F1:** Mit einer 2-€-Münze in P2 sind 4 € eingeworfen – das Rad wird freigegeben (F) und 1 € Rückgeld ausgegeben (1); danach beginnt die Kasse wieder bei 0 € (P0). (2 BE)')], 4, 'I–II'),
    row('f', [p('Zustand = bisher eingeworfener Betrag: P0 bis P3. Münzen, die den Preis noch nicht erreichen, wechseln den Zustand mit Ausgabe ε; wird der Preis erreicht, Ausgabe F (bei 5 € Ausgabe F1) und zurück nach P0. Σ = {1, 2}, Ω = {F, 1}, keine Endzustände. (Zustände 1 BE, Übergänge mit Ausgaben 2 BE, Vollständigkeit 1 BE)'), D.table(tabF, { widthsCm: [2.2, 2.6, 2.6], widthCm: 7.4, size: 18, allCenter: true, firstColBold: true, align: 'center' }), ...D.img(IMG + 'klausur_ga_M4.png', { widthCm: 11, caption: 'Zustandsgraph (gleichwertig zur Tabelle)' })], 4, 'II'),
    row('g', [p('Zustand = Zahl der gerade ausgeliehenen Räder (0, 1 oder 2). S0 ist Start- und Endzustand (alle Räder an der Station). A erhöht, R verringert die Zahl; R in S0 (mehr Rückgaben als Ausleihen) und A in S2 (kein Rad mehr da) führen in den Fehlerzustand. (Zustandsidee 1 BE, Übergänge 1 BE, Endzustand und Fehlerzustand-Hinweis 1 BE)'), ...D.img(IMG + 'klausur_ga_P2.png', { widthCm: 8, caption: 'Alle nicht eingezeichneten Übergänge führen in einen Fehlerzustand.' })], 3, 'II'),
    row('h', [p('Der Automat müsste sich die Zahl der ausgeliehenen Räder merken, und diese ist nicht beschränkt. Annahme: Ein endlicher Automat mit k Zuständen erkennt genau die gültigen Protokolle. Von den k + 1 Eingaben A, AA, …, Aᵏ⁺¹ führen nach dem Schubfachprinzip zwei, Aⁱ und Aʲ mit i ≠ j, in denselben Zustand. Dann wird mit der Fortsetzung Rⁱ entweder beides akzeptiert oder beides abgelehnt – Aⁱ Rⁱ ist aber gültig, Aʲ Rⁱ nicht. Widerspruch. (Idee „unbeschränkt zählen“ 1 BE, Schubfachargument 2 BE)')], 3, 'III'),
  ];
  // Kontrolle: BE-Summe und AFB-Verteilung
  const BE_KLAUSUR = { a: 5, b: 3, c: 3, d: 5, e: 4, f: 4, g: 3, h: 3 };
  const afb = { I: 0, II: 0, III: 0 };
  rows.slice(1).forEach((r) => {
    if (Number(r[2]) !== BE_KLAUSUR[r[0]]) throw new Error(`BE-Abweichung Teil ${r[0]}`);
    if (r[3] === 'I–II') { afb.I += Number(r[2]) / 2; afb.II += Number(r[2]) / 2; } else afb[r[3]] += Number(r[2]);
  });
  const total = afb.I + afb.II + afb.III;
  if (total !== 30 || afb.I !== 7 || afb.II !== 15 || afb.III !== 8) throw new Error('BE/AFB-Summen: ' + JSON.stringify(afb));
  const body = [
    D.h2('Erwartete Leistungen'),
    D.table(rows, { widthsCm: [1.2, 13.4, 1.0, 1.8], size: 19, center: [0, 2, 3] }),
    D.h2('Bewertungstabelle'),
    D.table([
      ['Anforderungsbereich', 'Teilaufgaben', 'BE', 'Anteil'],
      ['AFB I', 'a (5), e teilweise (2)', '7', '23 %'],
      ['AFB II', 'b (3), c (3), e teilweise (2), f (4), g (3)', '15', '50 %'],
      ['AFB III', 'd (5), h (3)', '8', '27 %'],
      ['Gesamt', '', '30', '100 %'],
    ], { widthsCm: [3.6, 9.0, 1.8, 3.0], size: 19, firstColBold: true, center: [2, 3] }),
    D.table([
      ['Notenpunkte', '15', '14', '13', '12', '11', '10', '9', '8', '7', '6', '5', '4', '3', '2', '1', '0'],
      ['ab BE', '29', '27', '26', '24', '23', '21', '20', '18', '17', '15', '14', '12', '10', '9', '6', '0'],
    ], { widthsCm: [2.6, ...Array(16).fill(0.925)], size: 17, allCenter: true, firstColBold: true }),
    D.small('Zuordnung nach dem Prozentschema der EB-Bewertung (15 NP ab 95 %, 14 ab 90 %, … 5 ab 45 %, 4 ab 40 %, 3 ab 33 %, 2 ab 27 %, 1 ab 20 %), BE aufgerundet.'),
    ...D.tip('Hinweise zur Korrektur', [
      ...D.bullets([
        'Gleichwertige Lösungen (andere Zustandsnamen, zusätzliche Zustände mit korrektem Verhalten, Tabelle statt Graph) werden voll gewertet; fehlender Fehlerzustand-Hinweis bei entwickelten Automaten: 1 BE Abzug je Automat.',
        'Teil c: Eine vollständige Zustandsfolge statt der Begründung über die Anzahl der Einsen und die Zustände S3/S4: höchstens 2 BE.',
        'Teil h: Argumentation „der Automat müsste unendlich viele Räder zählen“ ohne Schubfachprinzip: höchstens 1 BE.',
      ], { size: 19 }),
    ]),
  ];
  return D.save(D.doc({ kind: 'LK', niveau: 'alle', title: 'Erwartungshorizont „Fahrradverleih“', subtitle: SUB, metaText: 'Abi-Training  ·  Welt A und Level 7', code: 'Übungsklausur gA · Erwartungshorizont', titleSize: 34, body }), OUT + 'Uebungsklausur_Grundkurs_Erwartungshorizont.docx');
}

(async () => {
  console.log(await klausur());
  console.log(await eh());
})();
