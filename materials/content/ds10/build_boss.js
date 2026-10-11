const __MAT = require('path').resolve(__dirname, '../..'); // Wurzel: materials/
// Boss-Level B „Tags im Web-Editor“ (Grenzen & Keller, 25 BE) + Erwartungshorizont
const D = require((__MAT + '/lib/docstyle.js'));
const K = require((__MAT + '/content/ds09/kt.js'));
const J = require((__MAT + '/content/ds10/ds10.json'));
const IMG = (__MAT + '/build/img/ds10/');
const OUT = (__MAT + '/out/');
const TITLE = 'Boss-Level B: Tags im Web-Editor';
const SUB = 'Abi-artige Aufgabe zu Welt B – Grenzen endlicher Automaten und Kellerautomaten';
const SCALE = [[15, 0.95], [14, 0.90], [13, 0.85], [12, 0.80], [11, 0.75], [10, 0.70], [9, 0.65], [8, 0.60], [7, 0.55], [6, 0.50], [5, 0.45], [4, 0.40]];
const HINT = 'Alle nicht eingezeichneten Übergänge führen in einen Fehlerzustand.';
const seq = J.boss_rw.seq;
const word = J.boss_rw.table.rows.slice(1).map((r) => r[3]);

function rwTable(solution) {
  const n = seq.length; const w = [3.0, ...Array(n).fill((17.4 - 3.0) / n)];
  return D.table([
    ['Zustand', ...seq.map((x) => x[0])],
    ['Kellerspeicher', ...seq.map((x) => x[1])],
    ['Eingabezeichen', '–', ...(solution || Array(n - 1).fill(''))],
  ], { widthsCm: w, size: 19, header: false, firstColBold: true, firstColFill: true, center: [...Array(n + 1).keys()].slice(1), rowHeightCm: 0.75 });
}

// =====================================================================================  Aufgabe (SuS)
async function aufgabe() {
  const body = [
    D.p('Ein Web-Editor speichert formatierten Text mithilfe von **Tags**. Ein Bereich in Fettschrift beginnt mit dem Tag `<b>` und endet mit `</b>`, ein kursiver Bereich beginnt mit `<i>` und endet mit `</i>`. Bereiche dürfen ineinander verschachtelt werden, zum Beispiel `<b>Achtung, <i>sehr</i> wichtig!</b>`.'),
    D.p('Zur Vereinfachung werden die Textzeichen entfernt und nur die Folge der Tags betrachtet. Dabei steht **b** für `<b>`, **/b** für `</b>`, **i** für `<i>` und **/i** für `</i>`. Das Eingabealphabet ist Σ = {b, /b, i, /i}. Eine Tagfolge ist **korrekt**, wenn jeder geöffnete Bereich wieder geschlossen wird und dabei immer der **zuletzt geöffnete** Bereich zuerst geschlossen wird.'),
    D.p('Beispiele: `b i /i /b` und `i /i b /b` sind korrekt; `b i /b /i` und `b /b /b` sind nicht korrekt.'),
    D.p('Der Kellerautomat in Abbildung 1 (Kelleralphabet Γ = {#, B, I}) akzeptiert genau die korrekten Tagfolgen.'),
    D.sub('a', '**Dokumentieren** Sie die Verarbeitung der Eingabe `b i /i b /b /b` durch den Kellerautomaten, indem Sie die Tabelle in Abbildung 2 vervollständigen.  [3 BE]'),
    D.sub('b', '**Erläutern** Sie die Bedeutung des Kellerspeichers im Sachzusammenhang sowie die Funktion des Übergangs von S1 nach S0.  [3 BE]'),
    D.sub('c', '**Bestimmen** Sie das Eingabewort für die in Abbildung 3 angegebene Folge von Zuständen und Kellerbelegungen.  [3 BE]'),
    D.p('Eine einfache Version des Editors kennt nur Fettschrift (Σ~1~ = {b, /b}) und erlaubt höchstens zwei ineinander verschachtelte Bereiche (z. B. `b b /b /b`, aber nicht `b b b /b /b /b`).', { before: 80 }),
    D.sub('d', '**Entwerfen** Sie den Zustandsgraphen eines deterministischen endlichen Automaten, der genau die korrekten Tagfolgen dieser einfachen Version akzeptiert.  [4 BE]'),
    D.sub('e', 'In einer weiteren Version (weiterhin nur Fettschrift) ist die Schachteltiefe **nicht** begrenzt. **Begründen** Sie, dass es keinen endlichen Automaten gibt, der genau die korrekten Tagfolgen dieser Version akzeptiert.  [4 BE]'),
    D.p('Der Editor aus Abbildung 1 wird erweitert: Zusätzlich gibt es unterstrichene Bereiche mit den Tags **u** (für `<u>`) und **/u** (für `</u>`), die wie b und i verschachtelt werden dürfen. Außerdem gibt es den Zeilenumbruch **br** (für `<br>`, kein schließender Tag). Ein br ist nur erlaubt, wenn der **zuletzt geöffnete, noch nicht geschlossene** Bereich ein fetter Bereich ist (z. B. `b br /b` und `i b br /b /i` korrekt, `br` und `b i br /i /b` nicht korrekt).', { before: 80 }),
    D.sub('f', '**Erweitern** Sie den Kellerautomaten aus Abbildung 1 entsprechend. **Geben** Sie das neue Kelleralphabet **an**.  [5 BE]'),
    D.sub('g', 'Eine Mitschülerin behauptet: „Wenn der Editor nur eine Schachteltiefe von höchstens 10 erlaubt, braucht man für b und i keinen Kellerautomaten mehr. Trotzdem ist der Kellerautomat hier die bessere Wahl.“ **Beurteilen** Sie diese Aussage.  [3 BE]'),
    D.h2('Material'),
    D.img(IMG + 'html.png', { widthCm: 9.5, caption: `Abbildung 1: Kellerautomat für korrekte Tagfolgen, Σ = {b, /b, i, /i}, Γ = {#, B, I}. ${HINT}` }),
    D.p('Abbildung 2: Tabelle zur Dokumentation der Verarbeitung der Eingabe b i /i b /b /b', { size: 18, color: D.C.muted, keepNext: true }),
    ...K.blank(9),
    D.p('Hinweis zur Notation: Die Belegung des Kellerspeichers wird so notiert, dass das oberste Zeichen links steht.', { size: 18, color: D.C.muted }),
    D.p('Abbildung 3: Folge von Zuständen und Kellerbelegungen', { size: 18, color: D.C.muted, keepNext: true }),
    ...rwTable(),
    ...D.tip('Hinweise', [D.p('Bearbeitungszeit ca. 60 Minuten. Hilfsmittel: Merkblätter M05–M07. Der Erwartungshorizont zur Selbstkontrolle wird nach der Abgabe ausgegeben.', { size: 20 })]),
  ];
  const doc = D.doc({ kind: 'Boss-Level', ds: 10, title: TITLE, subtitle: SUB, metaText: 'Welt B · Grenzen & Keller  ·  25 BE', rightNote: 'Hausaufgabe · ca. 60 min', code: 'Boss-Level B · Aufgabe', body });
  return D.save(doc, OUT + 'BossLevel_B_Grenzen-und-Keller.docx');
}

// =====================================================================================  Erwartungshorizont
async function eh() {
  const row = (t, text, be, afb) => [t, text, String(be), afb[0] ? String(afb[0]) : '', afb[1] ? String(afb[1]) : '', afb[2] ? String(afb[2]) : ''];
  const rows = [
    row('a', 'Tabelle siehe unten (je zwei korrekte Zeilen ca. 1 BE; Ankreuzen „ja“). Die Eingabe wird akzeptiert.', 3, [3, 0, 0]),
    row('b', 'Jedes Kellerzeichen steht für einen **geöffneten, noch nicht geschlossenen** Bereich: B für fett, I für kursiv; oben liegt der **zuletzt geöffnete** Bereich. Ein schließender Tag ist nur möglich, wenn das passende Zeichen oben liegt, und entfernt es. Der Übergang (#, ε) : # von S1 nach S0 wird ohne Lesen eines Zeichens ausgeführt, wenn # oben liegt, also **alle Bereiche geschlossen** sind; dann ist der Endzustand S0 erreicht (und es können neue Bereiche folgen).', 3, [0, 3, 0]),
    row('c', `Eingabewort: **${word.filter((x) => x !== 'ε').join(' ')}**. Begründung über die Belegungsänderungen: I# ⇒ i; BI# ⇒ b; I# ⇒ /b; # ⇒ /i; S1 → S0 bei unveränderter Belegung # ⇒ ε-Übergang; B# ⇒ b; # ⇒ /b; S1 → S0 ⇒ ε.`, 3, [1, 2, 0]),
    row('d', 'DEA mit S0 (Tiefe 0, Start- und Endzustand), S1 (Tiefe 1), S2 (Tiefe 2): S0 –b→ S1 –b→ S2, S2 –/b→ S1 –/b→ S0; Hinweis auf Fehlerzustand bzw. vollständiger Automat (z. B. S0 –/b→ Fehler, S2 –b→ Fehler). Graph siehe unten.', 4, [1, 3, 0]),
    row('e', 'Annahme: Ein DEA mit k Zuständen erkennt die Sprache. Unter den k + 1 Präfixen b, bb, …, b^k+1^ führen zwei, b^i^ und b^j^ (i < j), in denselben Zustand. Mit der Fortsetzung (/b)^i^ endet der Automat bei b^i^(/b)^i^ und b^j^(/b)^i^ im selben Zustand; das erste Wort ist korrekt, das zweite nicht (j − i Bereiche offen) – Widerspruch. Alternativ (mit Abzügen bei fehlender Präzision): Ein DEA kann sich nur endlich viele Schachteltiefen merken, die Tiefe ist aber unbeschränkt.', 4, [0, 2, 2]),
    row('f', 'Γ = {#, B, I, U}. Zusätzliche Übergänge: S0 → S1: (#, u) : U#; Schleife an S1: (B, u) : UB, (I, u) : UI, (U, b) : BU, (U, i) : IU, (U, u) : UU, (U, /u) : ε und **(B, br) : B** (br nur, wenn B oben liegt; Keller bleibt unverändert). Kein Übergang mit br bei I, U oder #. Graph siehe unten.', 5, [0, 3, 2]),
    row('g', `Erster Teil richtig: Bei begrenzter Tiefe gibt es nur endlich viele mögliche Kellerinhalte, also genügt ein DEA. Er muss sich aber die **Reihenfolge** der offenen Bereiche merken (nicht nur die Anzahl): bei Tiefe ≤ 10 und zwei Bereichsarten 1 + 2 + 4 + … + 2^10^ = ${J.boss_g} Zustände (plus Fehlerzustand). Zweiter Teil richtig: Der Kellerautomat ist viel kleiner, übersichtlicher und ohne Änderung für jede Tiefe nutzbar.`, 3, [0, 0, 3]),
  ];
  const sum = (i) => rows.reduce((x, r) => x + (Number(r[i]) || 0), 0);
  const body = [
    D.p('Erwartungshorizont zur Selbstkontrolle. Andere fachlich richtige Lösungen sind gleichwertig. Die Automaten sind mit dem Unterrichtswerkzeug automata.py gegen die Sprachdefinition geprüft (Kellerautomat Abbildung 1: alle Tagfolgen bis Länge 8; Erweiterung f: bis Länge 6 bzw. 8 über einem Teilalphabet; DEA d: bis Länge 10).', { size: 20 }),
    D.table([
      ['Teil', 'Erwartete Leistung', 'BE', 'I', 'II', 'III'],
      ...rows,
      ['', '**Summe**', String(sum(2)), String(sum(3)), String(sum(4)), String(sum(5))],
    ], { widthsCm: [1.1, 11.9, 1.1, 1.1, 1.1, 1.1], size: 18, center: [0, 2, 3, 4, 5] }),
    D.h3('Lösung a) – Tabelle'),
    ...K.solved(J.boss_doc, { size: 18 }),
    D.h3('Lösung c) – Abbildung 3 mit Eingabezeichen'),
    ...rwTable(word),
    D.h3('Lösung d) – DEA (Fehlerzustand weggelassen)'),
    D.img(IMG + 'boss_dea2.png', { widthCm: 7.5, caption: HINT }),
    D.h3('Lösung f) – erweiterter Kellerautomat'),
    D.img(IMG + 'html_ext.png', { widthCm: 11, caption: `Σ = {b, /b, i, /i, u, /u, br}, Γ = {#, B, I, U}. ${HINT}` }),
    D.h3('Bewertung'),
    D.p('Orientierung am üblichen Prozentschlüssel (15 Punkte ab 95 %, 5 Punkte ab 45 %); Mindestpunktzahl in BE, halbe BE möglich:', { size: 19, keepNext: true }),
    D.table([
      ['Notenpunkte', ...SCALE.map((x) => String(x[0]))],
      ['ab BE', ...SCALE.map((x) => String(Math.ceil(x[1] * 25 * 2 - 1e-9) / 2).replace('.', ','))],
    ], { size: 17, center: [...Array(SCALE.length + 1).keys()].slice(1), firstColBold: true }),
    ...D.tip('Nachtraining', [D.p('a/c unsicher: Keller-Labor, Modus „Tabelle“ und „Rückwärts“. d/e unsicher: Merkblatt M05 und „Überliste den Automaten“. f unsicher: Merkblatt M07, Keller-Labor „Runde und eckige Klammern“.', { size: 20 })]),
  ];
  const doc = D.doc({ kind: 'Boss-Level', ds: 10, title: 'Boss-Level B: Erwartungshorizont', subtitle: 'Tags im Web-Editor – 25 BE, Anforderungsbereiche I–III', metaText: 'Welt B · Grenzen & Keller', rightNote: 'zur Selbstkontrolle', code: 'Boss-Level B · Erwartungshorizont', body });
  return D.save(doc, OUT + 'BossLevel_B_Erwartungshorizont.docx');
}

(async () => {
  console.log(await aufgabe()); console.log(await eh());
})();
