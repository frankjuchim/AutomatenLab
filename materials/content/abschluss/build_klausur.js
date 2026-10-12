const __MAT = require('path').resolve(__dirname, '../..'); // Wurzel: materials/
// Übungsklausur im Abi-Format (eA, Block 2) „Smart-Home-Befehle“ + Erwartungshorizont
const D = require((__MAT + '/lib/docstyle.js'));
const IMG = (__MAT + '/build/img/abschluss/');
const OUT = (__MAT + '/out/');
const TITLE = 'Übungsklausur „Smart-Home-Befehle“';
const SUB = 'Automaten und formale Sprachen · erhöhtes Anforderungsniveau · Block 2 · 135 Minuten · 45 BE';

const be = (n) => `[${n} BE]`;
const teil = (l, text, n) => new D.Paragraph({ children: [new D.TextRun({ text: `${l})  `, font: D.FONT_BODY, bold: true, size: 22, color: D.C.teal }), ...D.runs(text), new D.TextRun({ text: '  ' + be(n), font: D.FONT_BODY, size: 20, color: D.C.muted })], indent: { left: 360, hanging: 360 }, spacing: { after: 120, line: 276 } });
const KELLER_HEAD = ['Zustand', 'Belegung Kellerspeicher', 'oberstes Kellersymbol', 'verarbeitetes Eingabezeichen'];
const KELLER_W = [2.6, 5.0, 4.4, 5.4];

// Tabelle, deren Zeilen über Seiten umbrechen dürfen (für lange Erwartungshorizont-Zeilen)
function splitTable(rows, widthsCm, o = {}) {
  const widths = widthsCm.map(D.cm);
  const sum = widths.reduce((a, b) => a + b, 0);
  const thin = { style: D.BorderStyle.SINGLE, size: 4, color: D.C.line };
  const trs = rows.map((r, i) => new D.TableRow({ tableHeader: i === 0, cantSplit: false, children: r.map((c, j) => D.cell(c, {
    w: widths[j], fill: i === 0 ? D.C.teal : undefined, bold: i === 0, color: i === 0 ? D.C.white : undefined, size: o.size || 19,
    align: (o.center || []).includes(j) ? 'center' : undefined, valign: 'top', mt: 50, mb: 50 })) }));
  return [new D.Table({ rows: trs, width: { size: sum, type: D.WidthType.DXA }, columnWidths: widths, layout: require('docx').TableLayoutType.FIXED,
    borders: { top: thin, bottom: thin, left: thin, right: thin, insideHorizontal: thin, insideVertical: thin } }), D.spacer(140)];
}

// Lösungen (aus automata_klausur.py verifiziert)
const KELLER_ROWS = [['S0', '#', '–', '–'], ['S1', '#', '#', 'B'], ['S0', 'K#', '#', '('], ['S0', 'KK#', 'K', '('], ['S1', 'KK#', 'K', 'B'], ['S1', 'K#', 'K', ')'], ['S1', 'K#', 'K', 'B'], ['S1', '#', 'K', ')'], ['S2', '#', '#', 'ε']];
const MS_TABLE = [['Zustand', 'L', 'H', 'R', '+', '-'], ['M0', 'ML / ε', 'MH / ε', 'MR / ε', 'M0 / ε', 'M0 / ε'], ['ML', 'ML / ε', 'MH / ε', 'MR / ε', 'ML / e', 'ML / a'], ['MH', 'ML / ε', 'MH / ε', 'MR / ε', 'MH / w', 'MH / k'], ['MR', 'ML / ε', 'MH / ε', 'MR / ε', 'MR / o', 'MR / u']];

// =====================================================================================  Klausur
async function klausur() {
  const body = [
    D.info('Hinweise', [
      ...D.bullets([
        'Bearbeitungszeit **135 Minuten**, insgesamt **45 BE**. Hilfsmittel: Operatorenliste. Die Punktverteilung entspricht etwa 3 Minuten je BE.',
        'Notation wie im Zentralabitur: Zustände S0, S1, …; Startzustand mit Pfeil „Start“, Endzustände doppelt umrandet; Mealy-Kanten „Eingabe / Ausgabe“; Kellerautomaten „(Kellerzeichen, Eingabe) : Ablage“; Ableitungen mit ⇒.',
        'Entwickelte Automaten werden **vollständig** angegeben oder mit dem Hinweis „Alle nicht eingezeichneten Übergänge führen in einen Fehlerzustand.“ versehen.',
      ], { size: 20 }),
    ]),
    D.h2('Aufgabe: Smart-Home-Befehle'),
    D.p('Ein Smart-Home-System wird über Befehlsketten gesteuert. Ein **Befehl** besteht aus einer Gerätekennung – L (Licht), H (Heizung) oder R (Rollladen) – gefolgt von **mindestens einem** Aktionszeichen + oder -. Für das Licht bedeuten + und - „ein“ bzw. „aus“, für die Heizung „wärmer“ bzw. „kälter“, für den Rollladen „hoch“ bzw. „runter“. Eine **Befehlskette** besteht aus mindestens einem Befehl; die Befehle folgen ohne Trennzeichen direkt aufeinander. Beispiel: `L+R--H+` (Licht ein, Rollladen zweimal runter, Heizung wärmer).', { justify: true }),
    D.p('In Abbildung 1 im Material ist der Zustandsgraph eines endlichen Automaten A über dem Eingabealphabet Σ1 = {L, H, R, +, -} gegeben, der genau die Befehlsketten akzeptiert.', { justify: true }),
    teil('a', '**Stellen Sie** die Verarbeitung der Eingaben `L+R--` und `H+L` durch den Automaten A **dar** und **geben Sie** zwei weitere Befehlsketten der Länge 4 **an**, die vom Automaten A akzeptiert werden.', 4),
    teil('b', '**Erläutern Sie** die Bedeutung der Zustände S1 und S3 in Bezug auf die vorliegende Problemstellung.', 3),
    teil('c', '**Begründen Sie** anhand des Zustandsgraphen, dass jede vom Automaten A akzeptierte Befehlskette mit einem Aktionszeichen endet, und **bestimmen Sie** die Anzahl der Befehlsketten der Länge 3, die vom Automaten A akzeptiert werden.', 4),
    D.p('Die Heizung soll in einer Befehlskette **höchstens einmal** angesprochen werden.', { justify: true }),
    teil('d', '**Entwickeln Sie** den Zustandsgraphen eines endlichen Automaten, der genau die Befehlsketten akzeptiert, in denen die Gerätekennung H höchstens einmal vorkommt.', 5),
    D.p('Der Rollladen hat vier Positionen: 0 (ganz unten), 1, 2 und 3 (ganz oben). Zu Beginn ist er ganz oben. Der Mealy-Automat M in Abbildung 2 verarbeitet die Aktionszeichen eines Rollladen-Befehls (+ hoch, - runter) und gibt nach jedem Aktionszeichen die neue Position aus. Lässt sich der Rollladen nicht weiter bewegen, wird das Zeichen „!“ ausgegeben.', { justify: true }),
    teil('e', '**Geben Sie** die Ausgabe des Mealy-Automaten M für die Eingabe `--+---` **an** und **erläutern Sie** die Bedeutung des Zustands P1 sowie der Ausgabe „!“ im Sachzusammenhang.', 4),
    teil('f', '**Entwickeln Sie** den Zustandsgraphen eines Mealy-Automaten, der eine Befehlskette über Σ1 in Steuersignale übersetzt: Jedes Aktionszeichen wird abhängig von der zuletzt genannten Gerätekennung in eines der Signale e (Licht ein), a (Licht aus), w (wärmer), k (kälter), o (Rollladen hoch) oder u (Rollladen runter) übersetzt; Gerätekennungen erzeugen keine Ausgabe. Beispiel: Die Eingabe `L+H--R+` liefert die Ausgabe `ekko`.', 4),
    D.p('Befehle können zu **Szenen** zusammengefasst werden. Eine Szene besteht aus mindestens einem Element; ein Element ist entweder ein Befehl oder eine in runde Klammern eingeschlossene Szene (**Gruppe**). Gruppen können beliebig tief verschachtelt werden und sind nie leer. Zur Vereinfachung wird jeder Befehl durch das Zeichen B dargestellt, sodass Szenen Wörter über Σ3 = {B, (, )} sind. Beispiele für Szenen: `B`, `(BB)B`, `B((B)B)`. Keine Szenen sind `()`, `(B` und `B)(B`. In Abbildung 3 ist der Zustandsgraph eines Kellerautomaten K gegeben, der genau die Szenen akzeptiert.', { justify: true }),
    teil('g', '**Erläutern Sie** die Bedeutung des Kellerspeichers des Kellerautomaten K im Sachzusammenhang.', 3),
    teil('h', '**Dokumentieren Sie** in Abbildung 4 die Verarbeitung der Eingabe `B((B)B)` durch den Kellerautomaten K.', 4),
    teil('i', '**Begründen Sie**, dass es keinen endlichen Automaten gibt, der genau die Szenen akzeptiert.', 4),
    teil('j', '**Entwickeln Sie** eine reguläre Grammatik, die genau die Befehlsketten über Σ1 (siehe Einleitung) erzeugt.', 4),
    D.p('In Abbildung 5 ist eine Grammatik G gegeben, die genau die Szenen über Σ3 erzeugt.', { justify: true }),
    teil('k', '**Zeigen Sie**, dass sich die Szene `B((B)B)` von der Grammatik G erzeugen lässt.', 2),
    teil('l', '**Begründen Sie**, dass die Grammatik G nicht regulär ist.', 2),
    teil('m', '**Verändern Sie** die Grammatik G so, dass jede Gruppe mindestens zwei Elemente enthält.', 2),
    new D.Paragraph({ children: [new D.TextRun({ text: 'Material', font: D.FONT_HEAD, size: 30, bold: true, color: D.C.teal })], spacing: { before: 0, after: 120 }, keepNext: true, pageBreakBefore: true }),
    D.h3('zu den Aufgabenteilen a) bis d)'),
    D.p('Σ1 = {L, H, R, +, -}', { size: 21 }),
    D.img(IMG + 'klausur_A.png', { widthCm: 16.5, caption: 'Abbildung 1: Zustandsgraph des Automaten A. Hinweis: Alle nicht eingezeichneten Übergänge führen in einen Fehlerzustand.' }),
    D.h3('zu den Aufgabenteilen e) und f)'),
    D.p('Σ = {+, -},  Ω = {0, 1, 2, 3, !}', { size: 21 }),
    D.img(IMG + 'klausur_M.png', { widthCm: 15, caption: 'Abbildung 2: Zustandsgraph des Mealy-Automaten M (Zustand Pi: Rollladen in Position i)' }),
    new D.Paragraph({ children: [new D.TextRun({ text: 'zu den Aufgabenteilen g) bis i)', font: D.FONT_BODY, size: 23, bold: true, color: D.C.ocker })], spacing: { before: 0, after: 60 }, keepNext: true, pageBreakBefore: true }),
    D.p('Σ3 = {B, (, )},  Γ = {#, K}', { size: 21 }),
    D.img(IMG + 'klausur_K.png', { widthCm: 15, caption: 'Abbildung 3: Zustandsgraph des Kellerautomaten K' }),
    D.p('Abbildung 4: Folge von Eingabezeichen, Zuständen und Kellerbelegungen (zu Aufgabenteil h)', { size: 18, color: D.C.muted, italics: true, align: 'center', after: 60 }),
    D.fillTable(KELLER_HEAD, 10, { widthsCm: KELLER_W, rowHeightCm: 0.72, size: 19, prefill: [['S0', '#', '–', '–']] }),
    D.p('Eingabe wird akzeptiert:   ☐ ja     ☐ nein', { size: 21, indent: 400 }),
    D.h3('zu den Aufgabenteilen k) bis m)'),
    D.table([
      ['Terminalsymbole', 'T = {B, (, )}'],
      ['Nichtterminalsymbole', 'N = {S}'],
      ['Startsymbol', 'S'],
      ['Produktionsregeln', 'S → BS | B | (S)S | (S)'],
    ], { widthsCm: [4.4, 8.0], widthCm: 12.4, header: false, firstColBold: true, firstColFill: true, size: 21, align: 'center' }),
    D.p('Abbildung 5: Grammatik G', { size: 18, color: D.C.muted, italics: true, align: 'center' }),
  ];
  return D.save(D.doc({ kind: 'KL', niveau: 'eA', title: TITLE, subtitle: SUB, metaText: 'Abi-Training  ·  Welt A–C', code: 'Übungsklausur · Smart-Home-Befehle', titleSize: 34, body }), OUT + 'Uebungsklausur_Automaten-und-Sprachen.docx');
}

// =====================================================================================  Erwartungshorizont
async function eh() {
  const row = (l, items, be, afb) => [l, items, String(be), afb];
  const rows = [
    ['Teil', 'Erwartete Leistung', 'BE', 'AFB'],
    row('a', [D.p('`L+R--`: S0 –L→ S1 –+→ S3 –R→ S1 –-→ S3 –-→ S3 ⇒ akzeptiert (S3 ist Endzustand). (1 BE)', { size: 19 }), D.p('`H+L`: S0 –H→ S2 –+→ S4 –L→ S1 ⇒ abgelehnt (S1 ist kein Endzustand; die Befehlskette endet mit einer Gerätekennung ohne Aktionszeichen). (1 BE)', { size: 19 }), D.p('Zwei akzeptierte Befehlsketten der Länge 4, z. B. `L+R-`, `H+++`, `R---`, `L-H+` (je 1 BE).', { size: 19 })], 4, 'I'),
    row('b', [D.p('**S1:** Es wurde zuletzt die Gerätekennung L oder R gelesen; der Befehl ist noch unvollständig, es fehlt mindestens ein Aktionszeichen. (1,5 BE)', { size: 19 }), D.p('**S3:** Ein vollständiger Befehl für Licht oder Rollladen wurde gelesen (Gerät + mindestens ein Aktionszeichen); die Befehlskette ist gültig und kann mit weiteren Aktionszeichen oder einem neuen Befehl fortgesetzt werden. (1,5 BE)', { size: 19 })], 3, 'II'),
    row('c', [D.p('Endzustände sind nur S3 und S4. Alle Kanten, die in S3 oder S4 hineinführen, sind mit + oder - beschriftet (aus S1/S2 sowie die Schleifen in S3/S4); die Gerätekennungen L, H, R führen aus jedem Zustand nach S1 oder S2 bzw. in den Fehlerzustand – also kein Endzustand. Damit endet jede akzeptierte Eingabe mit einem Aktionszeichen. (2 BE)', { size: 19 }), D.p('Länge 3: Das erste Zeichen muss eine Gerätekennung sein (aus S0 führen nur L, H, R heraus), danach muss ein Aktionszeichen folgen; das dritte Zeichen muss nach der Begründung oben ebenfalls ein Aktionszeichen sein. Also 3 · 2 · 2 = **12** Befehlsketten (z. B. `L++`, `H+-`, `R--`). (2 BE)', { size: 19 })], 4, 'II'),
    row('d', [D.p('Der Automat muss sich zusätzlich merken, ob H bereits vorgekommen ist. Zustände: S0 Start; S1 Gerät L/R gelesen (H noch nicht benutzt); S2 vollständiger Befehl, H noch nicht benutzt (Endzustand); S3 Gerät gelesen, H benutzt; S4 vollständiger Befehl, H benutzt (Endzustand). Aus S4 führt H in den Fehlerzustand. (Zustandsidee 2 BE, Übergänge 2 BE, Start-/Endzustände und Fehlerzustand-Hinweis 1 BE)', { size: 19 }), ...D.img(IMG + 'klausur_AH.png', { widthCm: 11, caption: 'Alle nicht eingezeichneten Übergänge führen in einen Fehlerzustand.' })], 5, 'III'),
    row('e', [D.p('Ausgabe für `--+---`: P3 –-/2→ P2 –-/1→ P1 –+/2→ P2 –-/1→ P1 –-/0→ P0 –-/!→ P0, also **21210!**. (2 BE)', { size: 19 }), D.p('**P1:** Der Rollladen steht in Position 1 (eine Stufe über ganz unten). **Ausgabe !:** Der Befehl kann nicht ausgeführt werden, weil der Rollladen bereits am Anschlag steht (ganz oben bei +, ganz unten bei -); die Position bleibt unverändert. (2 BE)', { size: 19 })], 4, 'I–II'),
    row('f', [D.p('Zustand = zuletzt genannte Gerätekennung: M0 (noch kein Gerät), ML, MH, MR. Gerätekennungen wechseln den Zustand mit Ausgabe ε; Aktionszeichen bleiben im Zustand und geben das gerätespezifische Signal aus; in M0 werden Aktionszeichen ignoriert (Ausgabe ε). Σ = {L, H, R, +, -}, Ω = {e, a, w, k, o, u}, keine Endzustände. (Zustandsidee 1 BE, Übergänge mit Ausgaben 2 BE, Vollständigkeit inkl. M0 1 BE)', { size: 19 }), D.table(MS_TABLE, { widthsCm: [2.0, 2.0, 2.0, 2.0, 2.0, 2.0], widthCm: 12, size: 18, allCenter: true, firstColBold: true, align: 'center' }), ...D.img(IMG + 'klausur_MS.png', { widthCm: 9.5, caption: 'Zustandsgraph (gleichwertig zur Tabelle; keine Endzustände)' })], 4, 'II'),
    row('g', [D.p('Jedes Kellerzeichen K steht für eine **geöffnete, noch nicht geschlossene Gruppe** (eine offene Klammer). Die Kellerhöhe ist die aktuelle Verschachtelungstiefe. Mit „(“ wird ein K abgelegt, mit „)“ eines entfernt; liegt beim Lesen von „)“ kein K oben, fehlt eine öffnende Klammer. Nur wenn am Ende ausschließlich # im Keller liegt (alle Gruppen geschlossen), ist der Übergang nach S2 möglich. (3 BE)', { size: 19 })], 3, 'II'),
    row('h', [D.table([KELLER_HEAD, ...KELLER_ROWS], { widthsCm: [1.8, 3.4, 3.2, 3.8], size: 17, allCenter: true }), D.p('Eingabe wird akzeptiert: **ja** (S2 ist Endzustand, Eingabe vollständig gelesen). (Zeilen 3 BE, Abschluss mit ε-Übergang und Entscheidung 1 BE)', { size: 19 })], 4, 'I'),
    row('i', [D.p('Annahme: Es gibt einen endlichen Automaten mit k Zuständen, der genau die Szenen akzeptiert. Betrachtet werden die k + 1 Eingaben (, ((, …, (ᵏ⁺¹. Nach dem Schubfachprinzip führen zwei davon, (ⁱ und (ʲ mit i ≠ j, in denselben Zustand. Dann behandelt der Automat die Fortsetzung B)ⁱ in beiden Fällen gleich: (ⁱB)ⁱ ist eine Szene und wird akzeptiert, also wird auch (ʲB)ⁱ akzeptiert – das ist aber keine Szene (Klammern nicht ausgeglichen). Widerspruch; ein endlicher Automat kann die unbeschränkte Verschachtelungstiefe nicht zählen. (Annahme und Schubfachargument 2 BE, Fortsetzung und Widerspruch 2 BE)', { size: 19 })], 4, 'III'),
    row('j', [D.p('Zustand ↔ Nichtterminal, z. B. S = Gerät erwartet, A = Aktionszeichen erwartet, B = Befehl vollständig. N = {S, A, B}, T = {L, H, R, +, -}, Startsymbol S,', { size: 19 }), D.p('S → LA | HA | RA      A → +B | -B      B → +B | -B | LA | HA | RA | ε', { size: 20, indent: 300 }), D.p('(oder gleichwertig). Alle Regeln haben die Form X → aY, X → a oder X → ε. Prüfung: S ⇒ LA ⇒ L+B ⇒ L+RA ⇒ L+R-B ⇒ L+R--B ⇒ L+R--. (N, T, S 1 BE, Regeln 2 BE, rechtsreguläre Form 1 BE)', { size: 19 })], 4, 'II'),
    row('k', [D.p('S ⇒ BS ⇒ B(S) ⇒ B((S)S) ⇒ B((B)S) ⇒ B((B)B)   (Regeln: S → BS, S → (S), S → (S)S, S → B, S → B)', { size: 19 })], 2, 'I'),
    row('l', [D.p('Eine reguläre (rechtsreguläre) Grammatik erlaubt nur Regeln der Form A → aB, A → a oder A → ε. Die Regeln S → (S)S und S → (S) enthalten das Nichtterminal S zwischen bzw. vor Terminalsymbolen – damit ist G nicht regulär. (Alternativ: zwei Nichtterminale in einer rechten Seite.)', { size: 19 })], 2, 'I'),
    row('m', [D.p('Eine Gruppe muss nun mindestens zwei Elemente enthalten, z. B. mit einem Nichtterminal E für Elemente:', { size: 19 }), D.p('S → ES | E      E → B | (ES)', { size: 20, indent: 300 }), D.p('(ES) erzwingt mindestens ein Element E und eine weitere Szene S mit mindestens einem Element. Beispiele: (BB), B(B(BB)); nicht mehr erzeugbar: (B). Gleichwertige Lösungen (z. B. S → BS | B | (SS)S | (SS) mit S → … ) sind zulässig, wenn ( ) genau Szenen mit mindestens zwei Elementen umschließt.', { size: 19 })], 2, 'II'),
  ];
  // Kontrolle: BE-Summe und AFB-Verteilung (Teil e: je 2 BE AFB I und II) passen zur Bewertungstabelle
  const BE_KLAUSUR = { a: 4, b: 3, c: 4, d: 5, e: 4, f: 4, g: 3, h: 4, i: 4, j: 4, k: 2, l: 2, m: 2 };
  const afb = { I: 0, II: 0, III: 0 };
  rows.slice(1).forEach((r) => {
    if (Number(r[2]) !== BE_KLAUSUR[r[0]]) throw new Error(`BE-Abweichung Teil ${r[0]}`);
    if (r[3] === 'I–II') { afb.I += Number(r[2]) / 2; afb.II += Number(r[2]) / 2; } else afb[r[3]] += Number(r[2]);
  });
  const total = afb.I + afb.II + afb.III;
  if (total !== 45 || afb.I !== 14 || afb.II !== 22 || afb.III !== 9) throw new Error('BE/AFB-Summen: ' + JSON.stringify(afb));
  console.log('BE gesamt', total, 'AFB', afb, 'Anteile %', Object.values(afb).map((x) => Math.round((100 * x) / total)));
  const body = [
    D.h2('Erwartete Leistungen'),
    ...splitTable(rows, [1.2, 13.4, 1.0, 1.8], { size: 19, center: [0, 2, 3] }),
    D.h2('Bewertungstabelle'),
    D.table([
      ['Anforderungsbereich', 'Teilaufgaben', 'BE', 'Anteil'],
      ['AFB I', 'a (4), e teilweise (2), h (4), k (2), l (2)', '14', '31 %'],
      ['AFB II', 'b (3), c (4), e teilweise (2), f (4), g (3), j (4), m (2)', '22', '49 %'],
      ['AFB III', 'd (5), i (4)', '9', '20 %'],
      ['Gesamt', '', '45', '100 %'],
    ], { widthsCm: [3.6, 9.0, 1.8, 3.0], size: 19, firstColBold: true, center: [2, 3] }),
    D.table([
      ['Notenpunkte', '15', '14', '13', '12', '11', '10', '9', '8', '7', '6', '5', '4', '3', '2', '1', '0'],
      ['ab BE', '43', '41', '39', '36', '34', '32', '30', '27', '25', '23', '21', '18', '15', '13', '9', '0'],
    ], { widthsCm: [2.6, ...Array(16).fill(0.925)], size: 17, allCenter: true, firstColBold: true }),
    D.small('Zuordnung nach dem Prozentschema der EB-Bewertung (15 NP ab 95 %, 14 ab 90 %, … 5 ab 45 %, 4 ab 40 %, 3 ab 33 %, 2 ab 27 %, 1 ab 20 %), BE aufgerundet.'),
    ...D.tip('Hinweise zur Korrektur', [
      ...D.bullets([
        'Gleichwertige Lösungen (andere Zustandsnamen, andere Nichtterminale, zusätzliche Zustände mit korrektem Verhalten) werden voll gewertet; fehlender Fehlerzustand-Hinweis bei entwickelten Automaten: 1 BE Abzug je Automat.',
        'Teil c: Anzahl 12 ohne Begründung über die Struktur (Gerät, dann zwei Aktionszeichen): höchstens 1 BE; reines Aufzählen aller zwölf Wörter ist eine vollständige Lösung.',
        'Teil h: Ein Fehler in der Kellerbelegung, der konsequent weitergeführt wird, kostet nur 1 BE (Folgefehler).',
        'Teil i: Argumentation mit „der Automat müsste unendlich viele Klammern zählen“ ohne Schubfachprinzip: höchstens 2 BE.',
      ], { size: 19 }),
    ]),
  ];
  return D.save(D.doc({ kind: 'LK', niveau: 'eA', title: 'Erwartungshorizont „Smart-Home-Befehle“', subtitle: SUB, metaText: 'Abi-Training  ·  Welt A–C', code: 'Übungsklausur · Erwartungshorizont', titleSize: 34, body }), OUT + 'Uebungsklausur_Erwartungshorizont.docx');
}

(async () => {
  console.log(await klausur());
  console.log(await eh());
})();
