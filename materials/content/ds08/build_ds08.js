const __MAT = require('path').resolve(__dirname, '../..'); // Wurzel: materials/
// DS08 – Level 8 „Raten erlaubt“ (NEA als Brücke) – Arbeitsblatt, Lehrkraft-Handreichung, Folien
const D = require((__MAT + '/lib/docstyle.js'));
const S = require((__MAT + '/lib/deckstyle.js'));
const J = require((__MAT + '/content/ds08/ds08.json'));
const IMG = (__MAT + '/build/img/ds08/');
const OUT = (__MAT + '/out/');
const T = 'Raten erlaubt';
const SUB = 'Nichtdeterministische endliche Automaten (NEA) als Brücke';
const KF = 'Was ändert sich, wenn ein Automat mehrere Möglichkeiten hat?';
const FN = 'Raten-erlaubt';
const res = (ok) => (ok ? 'akzeptiert' : 'abgelehnt');
/** '{S0} –L→ {S0, S1} …' → [[Zeichen, Menge], …] (erste Zeile: Start) */
function steps(str) {
  const parts = str.split(/ –(.+?)→ /);
  const rows = [['Start', parts[0]]];
  for (let i = 1; i < parts.length; i += 2) rows.push([parts[i], parts[i + 1]]);
  return rows;
}
const transpose = (word, str) => { const r = steps(str); return [['gelesen', ...r.map((x) => x[0])], ['aktive Zustände', ...r.map((x) => x[1])]]; };

// =====================================================================================  Arbeitsblatt
async function ab() {
  const body = [
    D.p('Im Level 1 hat der LOL-Erkenner bei jedem Zeichen **genau einen** Folgezustand gewählt – auch mit Rücksprüngen, die man sich gut überlegen musste. Jetzt erlauben wir dem Automaten zu **raten**: Er darf mehrere Wege gleichzeitig verfolgen. Man spricht von einem **nichtdeterministischen endlichen Automaten (NEA)**.'),
    ...D.info('Spielregeln „Parallelwelten“ (so arbeitet ein NEA)', [
      ...D.bullets([
        'Zu Beginn steht **eine Spielfigur** auf dem Startzustand.',
        'Bei jedem Zeichen zieht **jede** Figur entlang **aller** passend beschrifteten Pfeile. Gibt es zwei passende Pfeile, **verdoppelt** sie sich. Gibt es keinen, **scheidet sie aus**.',
        'Ein Pfeil mit **ε** darf jederzeit **ohne Lesen eines Zeichens** benutzt werden (die Figur kopiert sich dorthin). ε ist **kein** Zeichen des Eingabealphabets.',
        'Die Eingabe wird **akzeptiert**, wenn nach dem letzten Zeichen **mindestens eine** Figur auf einem Endzustand steht – es also **mindestens einen** passenden Weg gibt.',
      ]),
    ]),
    D.task({ nr: 1, title: 'Parallelwelten: LOL-Suche', niveau: 'Basis', afb: 'I–II', body: [
      D.img(IMG + 'lol_nea.png', { widthCm: 10.5, caption: 'Abbildung 1: NEA „LOL-Suche“, Σ = {L, O, X}' }),
      D.sub('a', '**Stelle** für `LLOL` die Mengen der aktiven Zustände nach jedem Zeichen **dar**.'),
      ...D.fillTable(['gelesen', 'Start', 'L', 'L', 'O', 'L'], 1, { prefill: [['aktive Zustände', '{S0}', '', '', '', '']], widthsCm: [3.4, 2.8, 2.8, 2.8, 2.8, 2.8], size: 19, rowHeightCm: 0.9 }),
      D.sub('b', '**Stelle** ebenso die Verarbeitung von `LOOL` und `XLOLO` **dar** und **entscheide** jeweils über die Akzeptanz.'),
      ...D.lines(3),
      D.sub('c', 'Im Zustand S0 gibt es für L zwei Pfeile. **Erläutere**, was der NEA damit „rät“, und warum in S0 immer eine Figur übrig bleibt.'),
      ...D.lines(2),
      D.img(IMG + 'lol_dea.png', { widthCm: 7.5, caption: 'Abbildung 2: DEA „LOL-Erkenner“ aus Level 1' }),
      D.sub('d', '**Vergleiche** den NEA aus Abbildung 1 mit dem DEA aus Level 1 (Abbildung 2): Welche Pfeile fehlen im NEA – und warum braucht er sie nicht?'),
      ...D.lines(2),
    ] }),
    D.qr({ route: '#/parallelwelten?aufgabe=1&modus=sim', title: 'Parallelwelten', text: 'Gib ein Wort ein und beobachte die Spielfiguren. Im Modus „Rätsel“ sagst du voraus, wo die Figuren stehen. Aufgabe 4 = Spamfilter GRATIS, Aufgabe 5 = Vorzeichen (ε).' }),
    D.task({ nr: 2, title: 'Spamfilter „GRATIS“', niveau: 'Standard', afb: 'II–III', body: [
      D.p('Ein Spamfilter soll Nachrichten markieren, in denen das Wort **GRATIS** vorkommt. Vereinfachtes Alphabet: Σ = {G, R, A, T, I, S, X}, wobei X für jedes andere Zeichen steht.'),
      D.sub('a', '**Entwickle** einen NEA, der genau die Nachrichten akzeptiert, in denen GRATIS vorkommt. (Tipp: Orientiere dich an Abbildung 1.)'),
      ...D.drawBox(3.6),
      D.sub('b', '**Stelle** die Verarbeitung der Nachricht `GRAGRATIS` durch deinen NEA als Folge von Zustandsmengen **dar**.'),
      ...D.lines(2),
      D.sub('c', 'Ein DEA für dieselbe Aufgabe muss nach `GRAG` wieder in den Zustand „G gelesen“ springen. **Erläutere** an diesem Beispiel, warum das Entwerfen beim NEA einfacher ist.'),
      ...D.lines(2),
    ] }),
    D.task({ nr: 3, title: 'Sprünge ohne Zeichen: ε-Übergänge', niveau: 'Standard', afb: 'II', body: [
      D.p('Binärzahlen dürfen ein Vorzeichen haben – müssen aber nicht. Σ = {+, -, 0, 1}.', { keepNext: true }),
      D.img(IMG + 'vorzeichen.png', { widthCm: 8.0, caption: 'Abbildung 3: NEA mit ε-Übergang von S0 nach S1' }),
      D.sub('a', '**Untersuche**, welche der Eingaben `+101`, `10`, `-` und `+-1` akzeptiert werden. **Gib** dazu jeweils die Mengen aktiver Zustände **an** (Achtung: Schon vor dem ersten Zeichen ist S1 aktiv!).'),
      ...D.lines(3),
      D.sub('b', 'Lena schreibt: „Σ = {+, -, 0, 1, ε}“. **Beurteile** diese Angabe.'),
      ...D.lines(2),
      D.sub('c', '**Bestimme** die Sprache des folgenden NEA über Σ = {a, b} und **erläutere** die Rolle der beiden ε-Übergänge.'),
      D.img(IMG + 'oder.png', { widthCm: 6.4, caption: 'Abbildung 4: NEA mit zwei ε-Übergängen' }),
      ...D.lines(3),
    ] }),
    D.pageBreak(),
    D.task({ nr: 4, title: 'Vom NEA zum DEA: Teilmengenkonstruktion', niveau: 'Profi', afb: 'III', app: '#/parallelwelten?aufgabe=2&modus=teilmengen', body: [
      D.p('NEA und DEA sind **gleich mächtig**: Zu jedem NEA gibt es einen DEA, der dieselbe Sprache erkennt. Die Idee: **Ein DEA-Zustand = eine Menge aktiver NEA-Zustände.** Man startet mit der Startmenge und bestimmt für jedes Zeichen die Folgemenge, bis keine neue Menge mehr entsteht. Endzustände sind alle Mengen, die einen NEA-Endzustand enthalten.'),
      D.img(IMG + 'endet_ab_nea.png', { widthCm: 6.4, caption: 'Abbildung 5: NEA „endet auf ab“, Σ = {a, b}' }),
      D.sub('a', '**Vervollständige** die Tabelle und **zeichne** den entstehenden DEA.'),
      ...D.fillTable(['Menge (DEA-Zustand)', 'mit a', 'mit b', 'Endzustand?'], 3, { prefill: [['{S0}', '', '', '']], widthsCm: [5.0, 4.0, 4.0, 4.4], size: 19, rowHeightCm: 0.85 }),
      ...D.drawBox(3.2),
      D.sub('b', 'Der NEA „Das drittletzte Zeichen ist eine 1“ über Σ = {0, 1} hat 4 Zustände (App: Aufgabe 3). **Bestimme** mit der App, wie viele Zustände die Teilmengenkonstruktion liefert, und **erläutere**, was sich ein Zustand des DEA „merkt“.'),
      ...D.lines(2),
    ] }),
    D.h3('Selbstcheck – Level 8 geschafft, wenn …'),
    ...D.checklist([
      'ich die Verarbeitung eines Wortes durch einen NEA als Folge von Zustandsmengen darstellen kann.',
      'ich erklären kann, wann ein NEA ein Wort akzeptiert („es gibt mindestens einen Weg“).',
      'ich ε-Übergänge benutzen kann und weiß, dass ε kein Eingabezeichen ist.',
      'ich weiß, dass NEA und DEA gleich mächtig sind, und die Idee der Teilmengenkonstruktion erklären kann.',
    ]),
  ];
  return D.save(D.doc({ kind: 'AB', ds: 8, title: T, subtitle: SUB, kernfrage: KF, body }), OUT + `DS08_AB_${FN}.docx`);
}

// =====================================================================================  Lehrkraft
async function lk() {
  const L = J.lol, G = J.gratis, V = J.vz;
  const setTable = (w, str, ok) => {
    const t = transpose(w, str);
    // erste Zeile mit „Absatz mit nächstem zusammenhalten“, damit die zweizeilige Tabelle nicht umbricht
    t[0] = t[0].map((c, i) => D.p(c, { size: 18, bold: i === 0, keepNext: true, align: i ? 'center' : undefined, after: 40 }));
    return [D.p(`\`${w}\` – ${res(ok)}`, { size: 20, bold: true, after: 40, keepNext: true }), ...D.table(t, { size: 18, header: false, firstColBold: true, firstColFill: true, center: [...Array(t[0].length).keys()].slice(1) })];
  };
  const body = [
    D.h2('Überblick'),
    D.table([
      ['Aspekt', 'Inhalt'],
      ['Lernziele', 'Die SuS simulieren NEA mit Mengen aktiver Zustände, formulieren die Akzeptanzbedingung („es gibt mindestens einen Weg in einen Endzustand“), nutzen ε-Übergänge (ε ist kein Eingabezeichen), entwerfen einfache NEA und erläutern die Gleichmächtigkeit von NEA und DEA (Teilmengenkonstruktion als eA-Vertiefung).'],
      ['KC-Bezug', 'Brückenstunde: Nichtdeterminismus ist Voraussetzung für den Kellerautomaten (K6, NKA) und für die Übersetzung rechtsregulärer Grammatiken in Automaten (F4, Level 12). K3 (Automaten entwickeln), K4 (analysieren). PK1.1, PK2.2'],
      ['Abi-Bezug', 'NEA kommen im Zentralabitur nicht als eigener Aufgabentyp vor, wohl aber Nichtdeterminismus beim NKA: Die Akzeptanzdefinition der Ergänzenden Hinweise 2025 („wenn es eine Möglichkeit gibt …“) wird hier vorbereitet. Vertiefung: Abi 2025 eA Aufgabe B, Teil h (Dokumentation einer Kellerautomaten-Verarbeitung – dort genügt ein akzeptierender Lauf) und Abi 2022 eA Aufgabe C, Teil c.'],
      ['Material', 'Folien DS08, AB08, Merkblatt M06, Kopiervorlage „Parallelwelten“ (unten), Spielfiguren/Münzen (6 pro Gruppe), AutomatenLab „Parallelwelten“ (#/parallelwelten?aufgabe=1&modus=sim, Teilmengen-Modus zu Aufgabe 2)'],
      ['Vorbereitung', 'Spielplan (Graph LOL-NEA, A3) pro Vierergruppe kopieren, Münzen/Spielfiguren bereitlegen; Beamer: App Parallelwelten Aufgabe 1.'],
    ], { widthsCm: [3.2, 14.2], firstColBold: true, firstColFill: true }),
    D.h2('Verlaufsplan (90 Minuten)'),
    D.table([
      ['Zeit', 'Phase', 'Unterrichtsgeschehen', 'Sozialform / Medien'],
      ['0–10', 'Einstieg', 'LOL-Erkenner aus Level 1 (DEA) zeigen: „Welche Pfeile waren schwer zu finden?“ (Rücksprünge S1 –L→ S1, S2 –O→ S0). Gegenentwurf an der Tafel: „Rate, wo LOL beginnt“ – nur die Kette S0 –L→ S1 –O→ S2 –L→ S3 plus Schleifen. Konflikt: In S0 gibt es für L zwei Pfeile.', 'UG, Folien 3–4'],
      ['10–30', 'Erarbeitung I', 'Unplugged „Parallelwelten“ in Vierergruppen: Spielplan + Münzen, Wortkarten LLOL, LOOL, XLOLO, LOLOL. Eine Person liest vor, eine bewegt/verdoppelt Figuren, eine protokolliert die Zustandsmengen, eine prüft. Danach Vergleich im Plenum, App-Simulation zur Kontrolle.', 'GA, Spielplan, App'],
      ['30–50', 'Erarbeitung II', 'Begriffe sichern: Übergangsrelation (mehrere/keine Folgezustände), Akzeptanz „mindestens ein Weg“, ε-Übergänge (Vorzeichen-Beispiel), ε gehört nicht zu Σ. Gleichmächtigkeit: Mengen aktiver Zustände sind endlich viele ⇒ DEA (Teilmengenkonstruktion an „endet auf ab“).', 'LV/UG, Folien 7–12'],
      ['50–80', 'Übung', 'AB08 nach Niveau; Aufgabe 2 (GRATIS) als gemeinsamer Kern. Profis: Aufgabe 4 mit App-Modus „Teilmengen“.', 'EA/PA, AB08, App'],
      ['80–90', 'Sicherung', 'M06; Ausblick: „Im Level 9 bekommt der Automat einen Keller – und auch dort darf er raten (NKA).“', 'UG, M06'],
    ], { widthsCm: [1.6, 2.4, 10.2, 3.2], size: 19 }),
    D.h2('Unplugged „Parallelwelten“'),
    ...D.bullets([
      'Jede Gruppe erhält den Spielplan (LOL-NEA) und 6 Münzen. Start: eine Münze auf S0.',
      'Verdoppeln: Liest die Gruppe L, während eine Münze auf S0 liegt, bleibt diese liegen (Schleife) **und** eine neue Münze kommt auf S1.',
      'Ausscheiden: Hat eine Münze keinen passenden Pfeil (z. B. auf S1 bei L), wird sie entfernt. Liegen zwei Münzen auf demselben Zustand, genügt eine (Menge!).',
      'Akzeptiert: Nach der letzten Karte liegt mindestens eine Münze auf S3.',
      'Reflexion: „Wie viele Münzen braucht man höchstens?“ → höchstens eine pro Zustand ⇒ endlich viele mögliche Belegungen ⇒ Idee der Teilmengenkonstruktion.',
    ]),
    D.h3('Kopiervorlage: Spielplan (auf A3 vergrößern)'),
    D.img(IMG + 'lol_nea.png', { widthCm: 15 }),
    D.table([['LLOL', 'LOOL', 'XLOLO', 'LOLOL', 'OLLO']], { header: false, allCenter: true, size: 32, rowHeightCm: 1.5 }),
    D.p('Erwartung: akzeptiert LLOL, XLOLO, LOLOL; abgelehnt LOOL, OLLO.', { size: 19, color: D.C.muted }),
    D.h2('Lösungen AB08'),
    D.h3('Aufgabe 1 – Parallelwelten: LOL-Suche'),
    ...setTable('LLOL', L.LLOL[1], L.LLOL[0]),
    ...setTable('LOOL', L.LOOL[1], L.LOOL[0]),
    ...setTable('XLOLO', L.XLOLO[1], L.XLOLO[0]),
    ...D.bullets([
      'c) Bei L in S0 „rät“ der NEA: „Hier könnte LOL beginnen“ (Figur nach S1) – oder „noch nicht“ (Figur bleibt in S0). Wegen der Schleife L, O, X in S0 bleibt dort immer eine Figur, sodass jede spätere Stelle als Beginn von LOL geprüft werden kann.',
      'd) Im NEA fehlen alle Rücksprünge (S1 –L→ S1, S1 –X→ S0, S2 –O, X→ S0) und Übergänge aus S1/S2 für „falsche“ Zeichen. Der NEA braucht sie nicht, weil eine Figur, die falsch geraten hat, einfach ausscheidet – die Figur in S0 sorgt für den Neuanfang.',
    ]),
    D.h3('Aufgabe 2 – Spamfilter GRATIS'),
    D.img(IMG + 'gratis.png', { widthCm: 15, caption: 'a) NEA: In S0 bleibt immer eine Figur (Schleife), bei G startet zusätzlich ein Versuch.' }),
    ...setTable('GRAGRATIS', G.GRAGRATIS[1], G.GRAGRATIS[0]),
    ...D.bullets([
      'c) Beim DEA muss man für jeden Zustand überlegen, wohin ein „falsches“ Zeichen führt: Nach GRA folgt G – das ist zwar kein T, aber der Beginn eines neuen GRATIS, also Sprung nach „G gelesen“ (nicht nach S0). Beim NEA erledigt das die Figur in S0 automatisch. ' + `Die Teilmengenkonstruktion liefert hier einen DEA mit ${J.gratis_dea_states} Zuständen (minimiert ${J.gratis_min}) – mit vielen Rückkanten.`,
    ]),
    D.h3('Aufgabe 3 – ε-Übergänge'),
    D.table([
      ['Eingabe', 'Mengen aktiver Zustände', 'Ergebnis'],
      ...['+101', '10', '-', '+-1'].map((w) => [w, V[w][1].replace(/–-→/g, '– - →'), res(V[w][0])]),
    ], { widthsCm: [2.2, 11.6, 3.6], size: 19 }),
    ...D.bullets([
      'b) Falsch. ε ist das **leere Wort** und kein Zeichen, das gelesen werden kann. Σ = {+, -, 0, 1}. Ein ε-Übergang wird ausgeführt, ohne ein Zeichen zu lesen (frühere Folien enthielten hier einen Fehler).',
      `c) L = alle Wörter über {a, b} mit **gerader Anzahl a** (Zweig S1/S2) **oder** die auf **b enden** (Zweig S3/S4). Die ε-Übergänge teilen die Figur zu Beginn auf beide Zweige auf („ODER-Baustein“). Beispiele: aab ${res(J.oder.aab)}, aba ${res(J.oder.aba)}, ba ${res(J.oder.ba)}, aaa ${res(J.oder.aaa)}, ε ${res(J.oder['ε'])}.`,
    ]),
    D.h3('Aufgabe 4 – Teilmengenkonstruktion'),
    D.table([['Menge (DEA-Zustand)', 'mit a', 'mit b', 'Endzustand?'], ...J.eab_table], { widthsCm: [5.0, 4.0, 4.0, 4.4], size: 19, center: [1, 2, 3] }),
    D.img(IMG + 'endet_ab_dea.png', { widthCm: 8.5, caption: 'DEA aus der Teilmengenkonstruktion (vollständig, mit check() gegen „endet auf ab“ geprüft)' }),
    ...D.bullets([
      `b) Es entstehen **${J.d3_states} Zustände** (alle Teilmengen {S0} ∪ X mit X ⊆ {S1, S2, S3}); das Markierungsverfahren zeigt: keiner ist überflüssig. Ein DEA-Zustand merkt sich die **letzten drei Zeichen** (bzw. welche der letzten drei Positionen eine 1 waren) – 2^3^ = 8 Möglichkeiten. Allgemein: „n-letztes Zeichen ist 1“ braucht als DEA 2^n^ Zustände, als NEA nur n + 1.`,
    ]),
    D.h2('Typische Schwierigkeiten'),
    ...D.warn('Darauf achten', [
      ...D.bullets([
        '**Akzeptanz falsch verstanden:** „Eine Figur ist ausgeschieden, also abgelehnt.“ – Entscheidend ist, ob **mindestens eine** Figur am Ende im Endzustand steht.',
        '**ε als Zeichen:** ε gehört nicht zu Σ; ε-Übergänge werden **vor** dem ersten Zeichen und nach jedem Zeichen mitberücksichtigt (ε-Hülle).',
        '**Raten ≠ Zufall:** Ein NEA würfelt nicht – er verfolgt (gedanklich) **alle** Möglichkeiten gleichzeitig.',
        '**Leere Menge:** Sind alle Figuren ausgeschieden (∅), bleibt es bis zum Ende bei ∅ – die Eingabe wird abgelehnt.',
      ]),
    ]),
    D.h2('Differenzierung'),
    ...D.bullets([
      '**Basis:** Aufgabe 1 mit Spielplan und Münzen; App-Modus „Simulation“.',
      '**Standard:** Aufgaben 1–3.',
      '**Profi:** Aufgabe 4, App-Modus „Teilmengen“ (Aufgaben 1, 2, 5, 6), Zusatz: „Begründe, dass jeder DEA auch ein NEA ist.“',
    ]),
    D.h2('Hausaufgabe'),
    D.p('Entwirf einen NEA über Σ = {0, 1}, der alle Bitfolgen akzeptiert, die mit 01 beginnen **oder** auf 10 enden (Tipp: ODER-Baustein mit ε). Stelle die Verarbeitung von 0110 und 1010 als Folge von Zustandsmengen dar.'),
  ];
  return D.save(D.doc({ kind: 'LK', ds: 8, title: T, subtitle: SUB, kernfrage: KF, body }), OUT + `DS08_Lehrkraft_${FN}.docx`);
}

// =====================================================================================  Folien
async function folien() {
  const d = S.deck({ ds: 8, title: T });
  const L = J.lol;
  d.title({ title: T, subtitle: SUB, kernfrage: KF, notes: 'Level 8 ist eine Brücke: Nichtdeterminismus brauchen wir für den Kellerautomaten (Level 9/10) und für Grammatiken (Level 12).' });
  d.section({ phase: 'Einstieg', title: 'LOL – geht das einfacher?' });
  d.twoCol({ title: 'Zwei Automaten, eine Sprache: „enthält LOL“', left: { head: 'DEA aus Level 1', items: ['genau ein Folgezustand je Zeichen', 'Rücksprünge gut überlegen'], img: IMG + 'lol_dea.png' }, right: { head: 'Neuer Entwurf', items: ['nur die Kette L – O – L', 'plus Schleifen in S0 und S3'], img: IMG + 'lol_nea.png' }, notes: 'Frage: Funktioniert der rechte Entwurf? Was ist in S0 bei L „falsch“? → Es gibt zwei Pfeile mit L.' });
  d.question({ text: 'In S0 gibt es für L zwei Pfeile. Was soll der Automat tun?', sub: 'Idee: Er **rät**, ob hier LOL beginnt – oder verfolgt **beide** Möglichkeiten gleichzeitig.', notes: 'Vorschläge sammeln. Überleitung zum Spiel „Parallelwelten“.' });
  d.section({ phase: 'Erarbeitung', title: 'Parallelwelten' });
  d.task({ title: 'Spiel: Parallelwelten', phase: 'Erarbeitung', steps: [
    'Eine Münze startet auf **S0**.',
    'Bei jedem Zeichen zieht **jede** Münze entlang **aller** passenden Pfeile – bei zwei Pfeilen **verdoppelt** sie sich.',
    'Kein passender Pfeil? Die Münze **scheidet aus**.',
    'Am Ende: Liegt **mindestens eine** Münze auf S3? Dann **akzeptiert**.',
    'Protokolliert nach jedem Zeichen die **Menge** der belegten Zustände.',
  ], zeit: '20 min', sozialform: 'Vierergruppen', material: 'Spielplan, Münzen, Wortkarten', notes: 'Rollen: Vorleser, Spielzieher, Protokollant, Prüfer. Wortkarten: LLOL, LOOL, XLOLO, LOLOL, OLLO.' });
  const proto = (w, notes) => {
    const s = d.blank({ title: `Protokoll: ${w} – ${res(L[w][0])}`, phase: 'Erarbeitung', notes });
    const rows = transpose(w, L[w][1]);
    s.addTable(rows.map((r, i) => r.map((c, j) => ({ text: c, options: { fontSize: 22, bold: j === 0 || i === 0, color: i === 0 ? S.H.white : S.H.ink, fill: { color: i === 0 ? S.H.teal : (j === 0 ? S.H.tealTint2 : S.H.white) }, align: j ? 'center' : 'left', valign: 'middle', fontFace: 'Calibri' } }))),
      { x: 0.6, y: 1.6, w: 12.13, colW: [2.63, 1.9, 1.9, 1.9, 1.9, 1.9], rowH: 0.6, border: { type: 'solid', pt: 0.75, color: S.H.line } });
    const f = d.fit(IMG + 'lol_nea.png', 9, 3.4);
    s.addImage({ path: IMG + 'lol_nea.png', x: (13.333 - f.w) / 2, y: 3.2, w: f.w, h: f.h });
  };
  proto('LLOL', 'Nach dem letzten L liegt eine Münze auf S3 ⇒ akzeptiert. Die Mengen sind die Zustände, in denen der NEA „gleichzeitig“ ist.');
  proto('LOOL', 'Keine Münze auf S3 ⇒ abgelehnt. Beim zweiten O scheidet die Münze aus S2 aus; S0 bleibt immer belegt.');
  d.bullets({ title: 'Nichtdeterministischer endlicher Automat (NEA)', phase: 'Erarbeitung', items: [
    'Wie ein DEA: Σ, Zustände, Startzustand, Endzustände',
    'Aber: Zu einem Zustand und einem Zeichen gibt es **beliebig viele** Folgezustände (auch **keinen**)',
    'Zusätzlich erlaubt: **ε-Übergänge** (ohne Lesen eines Zeichens)',
    '**Akzeptanz:** Es gibt **mindestens einen** Weg, der nach dem letzten Zeichen in einem Endzustand endet',
    'Simulation: **Menge aktiver Zustände** nach jedem Zeichen',
  ], img: IMG + 'lol_nea.png', imgW: 5.4, size: 22, notes: 'Formal: δ: Q × (Σ ∪ {ε}) → Teilmengen von Q. Ein DEA ist ein Spezialfall eines NEA.' });
  d.image({ title: 'ε-Übergang: optionales Vorzeichen', img: IMG + 'vorzeichen.png', sigma: 'Σ = {+, -, 0, 1}   ·   ε ist KEIN Eingabezeichen', caption: 'Schon vor dem ersten Zeichen sind S0 und S1 aktiv: {S0, S1}.', notes: `+101: ${J.vz['+101'][1]} ⇒ akzeptiert. 10: ${J.vz['10'][1]} ⇒ akzeptiert. Häufiger Fehler aus alten Materialien: „ε ist Teil des Eingabealphabets“ – falsch.` });
  d.cards({ title: 'NEA und DEA sind gleich mächtig', phase: 'Erarbeitung', cards: [
    { head: 'Beobachtung', text: 'Es gibt nur endlich viele Mengen aktiver Zustände.', icon: 'LuLayers' },
    { head: 'Idee', text: 'Jede Menge wird ein Zustand des DEA.', icon: 'LuLightbulb' },
    { head: 'Verfahren', text: 'Startmenge → Folgemengen für jedes Zeichen → bis nichts Neues entsteht.', icon: 'LuListOrdered' },
    { head: 'Endzustände', text: 'Alle Mengen, die einen NEA-Endzustand enthalten.', icon: 'LuBadgeCheck' },
  ], notes: 'Teilmengenkonstruktion als eA-Vertiefung. Preis: Ein NEA mit n Zuständen kann einen DEA mit bis zu 2^n Zuständen ergeben (drittletztes Zeichen 1: 4 → 8).' });
  d.image({ title: 'Beispiel: „endet auf ab“', img: IMG + 'endet_ab_dea.png', caption: 'Aus dem NEA S0 –a→ S1 –b→ S2 (mit Schleife a, b in S0) entsteht dieser DEA mit 3 Zuständen.', notes: 'Tabelle gemeinsam: {S0}: a → {S0,S1}, b → {S0}; {S0,S1}: a → {S0,S1}, b → {S0,S2}; {S0,S2}: a → {S0,S1}, b → {S0}. Endzustand: {S0,S2}.' });
  d.section({ phase: 'Übung', title: 'Arbeitsblatt Level 8' });
  d.task({ title: 'Auftrag: AB08', steps: [
    '**Aufgabe 1**: Parallelwelten (Mengen aktiver Zustände).',
    '**Aufgabe 2**: Spamfilter „GRATIS“ entwerfen.',
    '**Aufgabe 3**: ε-Übergänge – Vorzeichen und ODER-Baustein.',
    'Profis: **Aufgabe 4** Teilmengenkonstruktion (App-Modus „Teilmengen“).',
  ], zeit: '30 min', sozialform: 'Einzel → Partner', material: 'AB08, Merkblatt M06', app: '#/parallelwelten?aufgabe=1&modus=sim', notes: 'Kern für alle: Aufgabe 2. Kontrolle der Entwürfe mit der App (Aufgabe 4 = GRATIS).' });
  d.app({ title: 'Parallelwelten', route: '#/parallelwelten?aufgabe=4&modus=sim', text: 'Teste deinen Spamfilter: Gib **GRAGRATIS** ein und beobachte die Spielfiguren. Im Modus **Rätsel** sagst du vorher, wo die Figuren stehen.', notes: 'Weitere Deep-Links: ?aufgabe=5 (Vorzeichen, ε), ?aufgabe=2&modus=teilmengen (Teilmengenkonstruktion).' });
  d.section({ phase: 'Sicherung', title: 'Was wir heute gelernt haben' });
  d.merke({ title: 'Merke: Nichtdeterminismus', items: [
    'Ein **NEA** darf für ein Zeichen mehrere (oder keine) Folgezustände haben und **ε-Übergänge** benutzen.',
    'Er **akzeptiert**, wenn es **mindestens einen** Weg in einen Endzustand gibt.',
    '**ε ist kein Eingabezeichen** – ε-Übergänge lesen nichts.',
    'NEA und DEA sind **gleich mächtig** (Teilmengenkonstruktion) – NEA sind oft kleiner und leichter zu entwerfen.',
    'Ausblick: Der **Kellerautomat** (Level 9) ist nichtdeterministisch – gleiche Akzeptanzidee.',
  ], img: IMG + 'oder.png', imgW: 3.8 });
  d.end({ items: ['Mengen aktiver Zustände darstellen', 'Akzeptanz: mindestens ein Weg', 'ε-Übergänge, ε ∉ Σ', 'Gleichmächtigkeit NEA – DEA'], hausaufgabe: 'NEA über {0, 1}: Bitfolgen, die mit 01 beginnen ODER auf 10 enden (ODER-Baustein mit ε). Verarbeitung von 0110 und 1010 als Mengenfolge darstellen.' });
  return d.save(OUT + `DS08_Folien_${FN}.pptx`);
}

(async () => {
  const files = [await ab(), await lk(), await folien()];
  console.log(files.join('\n'));
})();
