const __MAT = require('path').resolve(__dirname, '../..'); // Wurzel: materials/
// DS05 – Level 5 „Weniger ist mehr“ – Arbeitsblatt, Lehrkraft-Handreichung, Folien
const D = require((__MAT + '/lib/docstyle.js'));
const S = require((__MAT + '/lib/deckstyle.js'));
const { side } = require((__MAT + '/content/ds05/local.js'));
const DATA = require((__MAT + '/content/ds05/ds05_data.json'));
const IMG = (__MAT + '/build/img/ds05/');
const OUT = (__MAT + '/out/');
const T = 'Weniger ist mehr';
const SUB = 'Minimierung, Unterscheidbarkeit und die Mindestzahl von Zuständen';
const KF = 'Wann sind zwei Zustände „gleich“ – und wie viele Zustände braucht ein Automat mindestens?';
const FN = 'Weniger-ist-mehr';
const HINT = 'Alle nicht eingezeichneten Übergänge führen in einen Fehlerzustand.';

const w = (x) => (x === 'ε' ? 'ε' : '`' + x + '`');
const pairs = (lst) => lst.map((p) => `(${p[0]}, ${p[1]})`).join(', ');
const R = DATA.endet_ab.rounds;
const SM = DATA.smiley;

// =====================================================================================  Arbeitsblatt
async function ab() {
  const body = [
    D.p('Zwei Teams haben einen **Smiley-Erkenner** gebaut, der genau die Eingaben `:-)` und `:)` akzeptiert. Der Automat von Team A hat sechs Zustände, der von Team B nur fünf – und beide arbeiten fehlerfrei. In Level 5 findest du heraus, woran man überflüssige Zustände erkennt, wie man sie **systematisch** zusammenfasst und wie man **begründet**, dass es nicht mehr kleiner geht.'),
    ...D.info('Unterscheidbar oder äquivalent?', [
      ...D.bullets([
        'Zwei Zustände p und q heißen **unterscheidbar**, wenn es ein Wort w gibt, das von p aus in einen Endzustand führt, von q aus aber nicht (oder umgekehrt). Ein solches w heißt **unterscheidendes Wort**.',
        'Gibt es kein unterscheidendes Wort, sind p und q **äquivalent**: Der Automat verhält sich ab dort immer gleich – die Zustände können **zusammengefasst** werden.',
        'Ein Endzustand und ein Nicht-Endzustand sind immer unterscheidbar: Das leere Wort ε unterscheidet sie.',
      ]),
    ]),
    D.task({ nr: 1, title: 'Doppelt gemoppelt', niveau: 'Basis', afb: 'I–II', body: [
      ...side([D.img(IMG + 'gerade_a.png', { widthCm: 5.6, caption: 'Abbildung 1: Ein Automat, der sich mehr merkt als nötig' })], [
        D.p('Der Automat akzeptiert alle Wörter über Σ = {a, b}, die eine **gerade Anzahl a** enthalten.'),
        D.sub('a', '**Begründe**, dass die Zustände S0 und S1 unterscheidbar sind.'),
        D.sub('b', 'Verfolge von S0 **und** von S2 aus die Wörter `a`, `b`, `ab` und `ba`. **Beschreibe**, was dir auffällt.'),
        D.sub('c', '**Erläutere**, was sich der Automat in S0 und in S2 jeweils „merkt“, und **begründe**, dass S0 und S2 äquivalent sind. Welches weitere Paar ist äquivalent?'),
      ], [6.2, 11.2]),
      ...D.lines(4),
      D.sub('d', '**Zeichne** einen Automaten mit nur zwei Zuständen, der dieselbe Sprache akzeptiert.'),
      ...D.drawBox(2.4),
    ] }),
    D.task({ nr: 2, title: 'Das Markierungsverfahren Schritt für Schritt', niveau: 'Standard', afb: 'II', body: [
      D.p('Der Automat in Abbildung 2 akzeptiert alle Wörter über Σ = {a, b}, die auf **ab** enden. Er ist vollständig, hat aber zu viele Zustände.'),
      D.img(IMG + 'endet_ab.png', { widthCm: 9.5, caption: 'Abbildung 2: Endet auf ab – Entwurf mit fünf Zuständen' }),
      D.sub('a', '**Runde 0:** Markiere in der Dreieckstabelle (Abbildung 3) alle Paare aus einem End- und einem Nicht-Endzustand mit X~0~.'),
      D.sub('b', '**Runde 1, 2, …:** Bestimme für jedes noch freie Paar die Folgepaare mit a und mit b. Führt ein Zeichen in ein bereits markiertes Paar, wird das Paar mit X~Rundennummer~ markiert. Wiederhole, bis sich nichts mehr ändert.'),
      ...side([D.img(IMG + 'endet_ab_leer.png', { widthCm: 5.4, caption: 'Abbildung 3: Dreieckstabelle' })],
        [D.fillTable(['Paar', 'Folgepaar mit a', 'Folgepaar mit b', 'Runde'], 6, { widthsCm: [2.2, 3.3, 3.3, 2.0], size: 18, rowHeightCm: 0.62, noSpacer: true })], [6.0, 11.4]),
      D.sub('c', '**Gib an**, welche Zustände zusammengefasst werden können, und **zeichne** den minimalen Automaten.'),
      ...D.drawBox(2.4),
      D.sub('d', '**Erläutere** die Bedeutung des zusammengefassten Zustands im Sachzusammenhang.'),
      ...D.lines(1),
    ] }),
    D.qr({ route: '#/minimierer?aufgabe=5', title: 'Minimierer – Endet auf ab', text: 'Führe das Markierungsverfahren für Aufgabe 2 interaktiv durch: Felder antippen, Runde prüfen, Folgepaare ansehen. Danach im Modus „Unterscheide!“ unterscheidende Wörter finden (gemischte Runde: #/minimierer?modus=unterscheide).' }),
    D.task({ nr: 3, title: 'Coach-Wechsel im E-Sport', niveau: 'Standard', afb: 'II–III', body: [
      D.p('In einem E-Sport-Managerspiel liest ein DEA die Spielergebnisse eines Teams der Reihe nach ein: **2** = Sieg (2 Punkte), **1** = Unentschieden (1 Punkt), **0** = Niederlage (0 Punkte). Der Coach wird ausgewechselt (Eingabe akzeptiert), sobald das Team in **drei aufeinanderfolgenden Spielen insgesamt höchstens 1 Punkt** geholt hat; diese Entscheidung bleibt danach bestehen.'),
      D.sub('a', '**Begründe**, dass sich jeder solche Automat nach den Eingaben `20` und `02` in **verschiedenen** Zuständen befinden muss.'),
      ...D.lines(2),
      D.sub('b', '**Untersuche**, ob dies auch für die Eingaben `11` und `21` gilt.'),
      ...D.lines(2),
      D.sub('c', '*Profi-Zusatz:* **Entwickle** den Zustandsgraphen eines vollständigen DEA für diese Regel. (Tipp: Sieben Zustände reichen.)'),
    ] }),
    D.task({ nr: 4, title: 'Gutscheincodes prüfen', niveau: 'Standard', afb: 'I–III', body: [
      D.p('Gutscheincodes bestehen aus zwei Ziffernblöcken über {0, 1, 5}, getrennt durch #. Jeder Block enthält mindestens eine Ziffer. **Kriterium W:** Die Quersummen der beiden Blöcke sind **unterschiedlich** gerade bzw. ungerade (eine gerade, eine ungerade). Beispiel: `10#0` erfüllt W (Quersummen 1 und 0). Σ = {0, 1, 5, #}.'),
      D.img(IMG + 'gutschein.png', { widthCm: 9.0, caption: 'Abbildung 4: Prüfautomat für Kriterium W. ' + HINT }),
      D.sub('a', '**Stelle** die Verarbeitung von `05#51` **dar** und **gib an**, ob der Code Kriterium W erfüllt.'),
      ...D.lines(2),
      D.sub('b', '**Erläutere** die Bedeutung der Zustände S6 und S8 in Bezug auf die Problemstellung.'),
      ...D.lines(2),
      D.sub('c', '**Untersuche**, inwieweit die Zustände S3 bis S8 zusammengefasst werden können, ohne die Funktionalität des Automaten einzuschränken.'),
      ...D.lines(4),
    ] }),
    D.task({ nr: 5, title: 'Wie viele Zustände mindestens?', niveau: 'Profi', afb: 'III', body: [
      ...D.tip('Methode: paarweise unterscheidbare Präfixe', [D.p('Findest du n Eingaben (Präfixe), von denen **je zwei** durch ein Wort unterschieden werden, muss der Automat nach diesen Eingaben in n **verschiedenen** Zuständen sein. Also braucht er mindestens n Zustände.', { size: 20 })]),
      D.sub('a', '**Begründe**, dass jeder vollständige DEA, der genau die Wörter über {a, b} mit **genau drei a** akzeptiert, mindestens fünf Zustände hat.'),
      ...D.lines(3),
      D.sub('b', 'Ein Türschloss akzeptiert Codes über {A, B}, die auf **B** enden. Der minimale Automat dafür hat zwei Zustände. Neu soll ein Code zusätzlich **mindestens vier Zeichen** lang sein. **Begründe**, dass sich die Anzahl der Zustände dadurch um mindestens drei erhöht.'),
      ...D.lines(4),
    ] }),
    D.h3('Selbstcheck – Level 5 geschafft, wenn …'),
    ...D.checklist([
      'ich erklären kann, wann zwei Zustände unterscheidbar bzw. äquivalent sind, und unterscheidende Wörter finde.',
      'ich das Markierungsverfahren mit der Dreieckstabelle Runde für Runde durchführen kann.',
      'ich äquivalente Zustände zusammenfassen und den minimalen Automaten zeichnen kann.',
      'ich mit paarweise unterscheidbaren Eingaben begründen kann, dass ein Automat mindestens n Zustände braucht.',
    ]),
  ];
  return D.save(D.doc({ kind: 'AB', ds: 5, title: T, subtitle: SUB, kernfrage: KF, body }), OUT + `DS05_AB_${FN}.docx`);
}

// =====================================================================================  Lehrkraft
async function lk() {
  const G = DATA.gutschein; const C = DATA.coach;
  const followRows = DATA.endet_ab.follow.map(([p, fl, r]) => [`(${p[0]}, ${p[1]})`, fl[0], fl[1], r == null ? '– (bleibt frei)' : `Runde ${r}`]);
  const smRows = SM.follow.map(([p, fl, r]) => [`(${p[0]}, ${p[1]})`, ...fl, r == null ? '–' : `${r}`]);
  const body = [
    D.h2('Überblick'),
    ...D.table([
      ['Aspekt', 'Inhalt'],
      ['Lernziele', 'Die SuS erklären Unterscheidbarkeit und Äquivalenz von Zuständen, finden unterscheidende Wörter, führen das Markierungsverfahren (Dreieckstabelle) durch, fassen äquivalente Zustände zusammen und begründen Mindestzahlen von Zuständen über paarweise unterscheidbare Eingaben.'],
      ['KC-Bezug', 'Automatenmodelle: Funktion gegebener Automaten analysieren (vertieft), Automaten als Zustandsgraphen entwickeln. PK1.5 (Modelle bewerten/optimieren), PK2.3 (begründen), IK3.2'],
      ['Abi-Bezug', 'Abi 2022 eA Aufgabe C, Teil b („Begründen Sie, warum sich der Automat bei der Verarbeitung von 30 und 03 in unterschiedlichen Zuständen befinden muss …“) → AB-Aufgabe 3 (eigene Variante). Abi 2025 eA Aufgabe B, Teile c und d (Zustände S3–S8 zusammenfassen; keine weiteren Zustände nötig) → AB-Aufgabe 4. Abi 2024 eA Aufgabe B, Teil c (Zustandszahl erhöht sich um mindestens 5) → AB-Aufgabe 5. Originale als Vertiefung/Hausaufgabe nutzbar.'],
      ['Material', 'Folien DS05, AB05, Merkblatt M03, AutomatenLab „Minimierer“ (#/minimierer?aufgabe=5, #/minimierer?modus=unterscheide; Smiley-Einstieg: #/minimierer?aufgabe=1)'],
      ['Vorbereitung', 'Folien 3–5 (zwei Smiley-Automaten) bereitlegen; Dreieckstabelle des Smiley-Automaten als Tafelbild (6 × 6) vorbereiten; ggf. Abbildung 3 des AB als Folie zum Mitschreiben; App-Links prüfen.'],
    ], { widthsCm: [3.2, 14.2], firstColBold: true, firstColFill: true }),
    D.h2('Verlaufsplan (90 Minuten)'),
    ...D.table([
      ['Zeit', 'Phase', 'Unterrichtsgeschehen', 'Sozialform / Medien'],
      ['0–12', 'Einstieg', 'Zwei Smiley-Erkenner (Folien 3–5): Team A (6 Zustände) und Team B (5 Zustände) akzeptieren beide genau :-) und :). Welcher ist „besser“? Welche Zustände sind überflüssig? SuS testen Wörter von S3 und S4 aus. Ziel: „S3 und S4 verhalten sich für jede weitere Eingabe gleich.“', 'UG, Folien'],
      ['12–25', 'Erarbeitung I', 'Begriffe unterscheidbar / äquivalent / unterscheidendes Wort (Folien 7–8). Kurzübung: Paare des Smiley-Automaten mit unterscheidendem Wort belegen (Tabelle Folie 8). Merksatz: End- und Nicht-Endzustand werden durch ε unterschieden.', 'LV/UG, M03'],
      ['25–45', 'Erarbeitung II', 'Markierungsverfahren am Smiley-Automaten an der Tafel (Folien 9–14): Runde 0, Runde 1, Runde 2, Ende; Zusammenfassen von S3 und S4 ergibt den Automaten von Team B. Warum funktioniert das? Markierte Paare sind sicher unterscheidbar (das unterscheidende Wort lässt sich rückwärts ablesen).', 'Tafel, Folien'],
      ['45–80', 'Übung', 'AB05 nach Niveau. Aufgabe 2 mit App-Kontrolle (Minimierer, Aufgabe 5). Nach ca. 20 Minuten Zwischensicherung zu Aufgabe 3a (Begründungsmuster „unterscheidendes Wort angeben“). Schnelle: Aufgabe 5, „Unterscheide!“.', 'EA/PA, AB05, iPads'],
      ['80–90', 'Sicherung', 'Merkblatt M03: Vorgehen in 4 Schritten und Abi-Check (Operatoren „Begründen Sie, dass …“, „Untersuchen Sie, inwieweit …“). Hausaufgabe.', 'UG, M03'],
    ], { widthsCm: [1.6, 2.4, 10.2, 3.2], size: 19 }),
    D.h2('Tafelbild: Smiley-Automat minimieren'),
    D.p('Der vollständige Automat von Team A hat die Zustände S0 bis S4 und den Fehlerzustand F_err (Σ = {:, -, )}; Endzustände S3, S4). Folgepaare der nach Runde 0 noch freien Paare (aus `minimize_pairs` erzeugt):', { size: 21 }),
    ...D.table([['Paar', 'mit :', 'mit -', 'mit )', 'Runde'], ...smRows], { widthsCm: [3.0, 3.6, 3.6, 3.6, 1.8], size: 18, center: [4] }),
    D.p(`Runde 0: ${pairs(SM.rounds[0])}. Runde 1: ${pairs(SM.rounds[1])}. Runde 2: ${pairs(SM.rounds[2])}. Runde 3: keine neue Markierung ⇒ Ende. Unmarkiert bleibt nur (S3, S4) ⇒ zusammenfassen ⇒ Automat von Team B mit fünf Zuständen.`, { size: 20 }),
    D.img(IMG + 'smiley_runde3.png', { widthCm: 6.0, caption: 'Endstand der Dreieckstabelle: X mit Rundennummer, ≡ = äquivalent' }),
    D.pageBreak(),
    D.h2('Lösungen AB05'),
    D.h3('Aufgabe 1 – Doppelt gemoppelt'),
    ...D.bullets([
      'a) S0 ist Endzustand, S1 nicht: Das leere Wort ε unterscheidet sie (von S0 aus akzeptiert, von S1 aus nicht).',
      'b) S0: a → S1 (–), b → S2 (✓), ab → S3 (–), ba → S3 (–). S2: a → S3 (–), b → S0 (✓), ab → S1 (–), ba → S1 (–). Die Zielzustände sind verschieden, aber **Akzeptanz/Ablehnung stimmt jeweils überein**.',
      'c) S0 und S2: bisher gerade Anzahl a (sie unterscheiden sich nur in der Anzahl der b, die für die Sprache egal ist). Jedes Wort führt von beiden aus genau dann in einen Endzustand, wenn es eine gerade Anzahl a hat ⇒ äquivalent. Ebenso S1 und S3 (ungerade Anzahl a). Das Markierungsverfahren bestätigt: nur Runde 0, danach bleiben (S0, S2) und (S1, S3) frei.',
      'd) Minimaler Automat:',
    ]),
    D.img(IMG + 'gerade_a_min.png', { widthCm: 5.2 }),
    D.h3('Aufgabe 2 – Markierungsverfahren'),
    ...D.bullets([
      `a) Runde 0 (End-/Nicht-Endzustand): ${pairs(R[0])}.`,
      `b) Runde 1: ${pairs(R[1])} – jeweils mit b in das Paar (S0, S2), das in Runde 0 markiert wurde. Runde 2: keine neue Markierung ⇒ Verfahren beendet.`,
    ]),
    ...D.table([['Paar', 'Folgepaar mit a', 'Folgepaar mit b', 'markiert in Runde'], ...followRows], { widthsCm: [3.2, 4.6, 4.6, 5.0], size: 19 }),
    D.img(IMG + 'endet_ab_runde2.png', { widthCm: 5.6, caption: 'Endstand: (S1, S3), (S1, S4), (S3, S4) bleiben frei' }),
    ...D.bullets([
      'c) S1, S3 und S4 sind paarweise äquivalent und werden zu einem Zustand zusammengefasst (hier S1). Minimaler Automat mit drei Zuständen:',
    ]),
    D.img(IMG + 'endet_ab_min.png', { widthCm: 7.2 }),
    ...D.bullets(['d) Der zusammengefasste Zustand S1 bedeutet: „Das zuletzt gelesene Zeichen war ein a.“ Wie dieses a erreicht wurde (nach b, nach a, nach ab), ist für „endet auf ab“ unerheblich.']),
    D.h3('Aufgabe 3 – Coach-Wechsel (eigene Variante zu Abi 2022 eA C b)'),
    ...D.bullets([
      `a) Unterscheidendes Wort ${w(C['20_02'])}: Bei \`2000\` holt das Team in den letzten drei Spielen 0 + 0 + 0 = 0 Punkte ⇒ Wechsel (akzeptiert). Bei \`0200\` haben alle Dreierfenster (0, 2, 0) und (2, 0, 0) je 2 Punkte ⇒ kein Wechsel (abgelehnt). Wäre der Automat nach 20 und 02 im selben Zustand, müsste er beide Eingaben gleich behandeln – Widerspruch. Kern: Nach 20 liegt die Niederlage zuletzt und zählt noch für zwei weitere Fenster, nach 02 ist der Sieg das letzte Ergebnis.`,
      'b) Nein. Nach 11 und nach 21 ist das letzte Ergebnis 1. Jedes spätere Dreierfenster, das das vorletzte Spiel enthält, hat mindestens 1 + 1 = 2 Punkte, ein Wechsel ist dadurch in keinem Fall möglich; für alle anderen Fenster zählt nur das letzte Ergebnis 1 und die folgenden Spiele. Damit verhält sich der Automat für jede Fortsetzung gleich ⇒ beide Eingaben dürfen (und werden im minimalen Automaten) in denselben Zustand führen. (Mit dem Code für alle Fortsetzungen bis Länge 5 geprüft.)',
      `Hinweis: Anders als im Abitur-Original sind in dieser Variante auch 10 und 01 unterscheidbar (unterscheidendes Wort ${w(C['10_01'])}: \`1010\` enthält 0 + 1 + 0 = 1 Punkt).`,
      'c) Minimaler DEA (7 Zustände): S0 „keine Gefahr“ (Start oder zuletzt Sieg), S1 „zuletzt 0, davor Sieg oder nichts“, S2 „zuletzt 1, davor nicht 0“, S3 „zuletzt 0, 0“, S4 „zuletzt 0, 1“, S5 „zuletzt 1, 0“, S6 „Coach ausgewechselt“.',
    ]),
    D.img(IMG + 'coach_min.png', { widthCm: 9.5, caption: 'Zur Übersicht: Alle nicht eingezeichneten Übergänge (Eingabe 2) führen nach S0.' }),
    D.h3('Aufgabe 4 – Gutscheincodes (eigene Variante zu Abi 2025 eA B c)'),
    ...D.bullets([
      `a) ${G.paths['05#51']} ⇒ akzeptiert (Quersummen 5 und 6: ungerade/gerade ⇒ W erfüllt).`,
      'b) S6: erster Block mit gerader Quersumme abgeschlossen, im zweiten Block noch keine Ziffer gelesen. S8: erster Block gerade, zweiter Block bisher gerade (W noch nicht erfüllt, aber eine ungerade Ziffer würde es erfüllen).',
      'c) Unterscheidende Wörter (aus dem Code): S5/S7 sind Endzustände, alle anderen nicht (ε). S3 vs. S4, S6, S8: Wort `0` (von S3 aus nach S5 ✓, von S4/S6/S8 aus kein Endzustand). Äquivalent sind **S4, S6, S8** (jeweils: noch nicht erfüllt, eine ungerade Ziffer führt zur Erfüllung, eine gerade nicht) und **S5, S7** (W erfüllt; ungerade Ziffer ⇒ nicht mehr, gerade ⇒ weiterhin). S3 bleibt allein, da dort schon eine gerade Ziffer zum Erfolg führt. Ergebnis: aus S3–S8 werden drei Zustände.',
    ]),
    D.img(IMG + 'gutschein_min.png', { widthCm: 8.0, caption: 'Zusammengefasster Automat (S4 = {S4, S6, S8}, S5 = {S5, S7}). ' + HINT }),
    D.h3('Aufgabe 5 – Mindestzahl'),
    ...D.bullets([
      'a) Präfixe ε, a, aa, aaa, aaaa. Für i < j ≤ 3 unterscheidet a^3−i^ (z. B. ε/a: `aa`; aa/aaa: ε); aaaa wird von jedem Präfix mit höchstens drei a durch die passende Anzahl a unterschieden (aaaa ist nie mehr akzeptierbar). Je zwei der fünf Präfixe sind unterscheidbar ⇒ mindestens 5 Zustände.',
      'b) Präfixe ε, A, AA, AAA, AAAB sind paarweise unterscheidbar (z. B. ε/A: `AAB`, A/AA: `AB`, AA/AAA: `B`, AAA/AAAB: ε). ⇒ mindestens 5 Zustände, also mindestens 3 mehr als vorher. Ein Automat mit genau 5 Zuständen existiert (AAA und AAAA sind äquivalent: Beide brauchen nur noch ein abschließendes B).',
    ]),
    D.img(IMG + 'tuer.png', { widthCm: 11 }),
    D.h2('Typische Schwierigkeiten'),
    ...D.warn({ titel: 'Darauf achten', fallen: ['P4', 'P1'] }, [
      ...D.bullets([
        '**Gleiche Folgezustände verlangt:** SuS halten Zustände nur dann für äquivalent, wenn sie zu denselben Zuständen führen. Entscheidend ist gleiches **Akzeptanzverhalten** (Aufgabe 1b).',
        '**Fehlerzustand vergessen:** Das Verfahren braucht einen vollständigen Automaten. Bei weggelassenem Fehlerzustand muss er in die Tabelle (Smiley-Beispiel: F_err).',
        '**Zu früh aufgehört:** Nach einer Runde mit neuen Markierungen muss mindestens eine weitere Runde folgen.',
        '**Begründung ohne Wort:** „Die Zustände sind verschieden“ reicht nicht – im Abitur wird ein konkretes unterscheidendes Wort mit beiden Verarbeitungen erwartet.',
        '**Mindestzahl:** Ein konkreter Automat mit n Zuständen beweist nur „höchstens n“. „Mindestens n“ verlangt n paarweise unterscheidbare Eingaben.',
      ]),
    ]),
    D.h2('Differenzierung'),
    ...D.bullets([
      '**Basis:** Aufgabe 1 und 2 (Hilfe: Folgepaar-Tabelle ist vorgegeben; App zeigt Folgepaare beim Antippen).',
      '**Standard:** Aufgaben 1–4.',
      '**Profi:** Aufgabe 3c und 5; Original Abi 2025 eA B c/d und Abi 2024 eA B c als Zusatz.',
    ]),
    D.h2('Hausaufgabe'),
    D.p('Minimierer, Aufgabe 3 „Barcode 110 mit Ballast“ (#/minimierer?aufgabe=3): Markierungsverfahren zuerst im Heft mit Dreieckstabelle, dann in der App kontrollieren. Zusätzlich: Für das Gutschein-Beispiel (AB-Aufgabe 4) **begründen**, dass der zusammengefasste Automat nicht weiter verkleinert werden kann.'),
  ];
  return D.save(D.doc({ kind: 'LK', ds: 5, title: T, subtitle: SUB, kernfrage: KF, body }), OUT + `DS05_Lehrkraft_${FN}.docx`);
}

// =====================================================================================  Folien
async function folien() {
  const d = S.deck({ ds: 5, title: T });
  const dist = SM.dist;
  const H = S.H; const M = 0.6, W = 13.333;
  // Zwei Abbildungen nebeneinander mit Überschrift und kurzem Text
  const imgPair = ({ title, cols, notes, phase }) => {
    const s = d.blank({ title, notes, phase });
    const cw = (W - 2 * M - 0.5) / 2;
    cols.forEach((c, i) => {
      const x = M + i * (cw + 0.5);
      d.tb(s, c.head, { x, y: 1.5, w: cw, h: 0.5, fontSize: 22, bold: true, fontFace: 'Cambria', color: i ? H.ocker : H.teal });
      if (c.text) d.tb(s, d.rich(c.text, { fontSize: 18, color: H.muted }), { x, y: 2.0, w: cw, h: 0.5 });
      const f = d.fit(c.img, c.maxW || cw, c.maxH || 4.1);
      s.addImage({ path: c.img, x: x + (cw - f.w) / 2, y: 2.6 + (4.1 - f.h) / 2, w: f.w, h: f.h });
    });
    return s;
  };
  d.title({ title: T, subtitle: SUB, kernfrage: KF, notes: 'Level 5: Nach dem Entwickeln (Level 3–4) geht es jetzt ums Optimieren und Begründen. Im Abitur regelmäßig gefragt: Zustände zusammenfassen, Mindestzahl begründen.' });
  d.section({ phase: 'Einstieg', title: 'Zwei Smiley-Erkenner' });
  d.question({ text: 'Zwei Automaten erkennen genau :-) und :) – einer mit sechs, einer mit fünf Zuständen. Welcher ist besser?', sub: 'Und: Geht es vielleicht noch kleiner?', notes: 'Kurz sammeln: „besser“ = weniger Zustände bei gleicher Sprache (weniger Speicher, übersichtlicher). Dann die Automaten zeigen.' });
  imgPair({ title: 'Team A und Team B', cols: [
    { head: 'Team A: 6 Zustände', text: 'S3 nach `:-)`, S4 nach `:)`, F_err = Fehlerzustand', img: IMG + 'smileyA.png' },
    { head: 'Team B: 5 Zustände', text: 'Beide Smileys enden in S3', img: IMG + 'smileyB.png' },
  ], notes: 'Hier mit Fehlerzustand gezeichnet, damit die Zustandszahl sichtbar ist. Frage: Was passiert von S3 und von S4 aus mit jedem weiteren Zeichen? → beide in F_err.' });
  d.question({ text: 'Wann sind zwei Zustände „gleich“?', sub: 'Teste von S3 und S4 aus: ε, `)`, `:-)`, … – gibt es ein Wort, bei dem sie sich anders verhalten?', notes: 'Ziel: Kein Wort unterscheidet S3 und S4 → zusammenfassen. Dagegen S1 und S2: Wort -) führt von S1 aus nach S3 (✓), von S2 aus in den Fehlerzustand.' });
  d.section({ phase: 'Erarbeitung', title: 'Unterscheidbar oder äquivalent?' });
  d.merke({ title: 'Unterscheidbarkeit', phase: 'Erarbeitung', items: [
    'p und q sind **unterscheidbar**, wenn ein Wort w von p aus in einen Endzustand führt, von q aus aber nicht (oder umgekehrt).',
    'w heißt **unterscheidendes Wort**.',
    'Gibt es kein solches Wort, sind p und q **äquivalent** ⇒ zusammenfassen.',
    'End- und Nicht-Endzustand: immer unterscheidbar (Wort ε).',
  ], img: IMG + 'smileyA.png', imgW: 5.2, notes: 'Im Merkblatt M03 mitlesen lassen. Betonen: Es geht um das Akzeptanzverhalten, nicht um die konkreten Folgezustände.' });
  d.table({ title: 'Unterscheidende Wörter im Smiley-Automaten', rows: [
    ['Paar', 'kürzestes unterscheidendes Wort', 'Begründung'],
    ['(S3, S0)', 'ε', 'S3 ist Endzustand, S0 nicht'],
    ['(S0, S1)', dist['S0|S1'], 'S1 –)→ S4 ✓   ·   S0 –)→ F_err'],
    ['(S1, S2)', dist['S1|S2'], 'S1 –-→ S2 –)→ S3 ✓   ·   S2 –-→ F_err'],
    ['(S0, F_err)', dist['S0|F_err'], 'S0 –:→ S1 –)→ S4 ✓   ·   F_err bleibt F_err'],
    ['(S3, S4)', '– keins –', 'äquivalent: jedes Zeichen führt nach F_err'],
  ], colW: [2.0, 4.0, 6.1], size: 20, notes: 'Wörter wurden mit dem Code (Breitensuche) bestimmt. SuS zuerst selbst suchen lassen, dann aufdecken.' });
  d.cards({ title: 'Das Markierungsverfahren in vier Schritten', phase: 'Erarbeitung', size: 19, cards: [
    { head: '1  Tabelle', text: 'Alle Zustandspaare in eine Dreieckstabelle (Automat vollständig, ggf. mit Fehlerzustand).', icon: 'LuTable' },
    { head: '2  Runde 0', text: 'Markiere alle Paare aus End- und Nicht-Endzustand.', icon: 'LuX' },
    { head: '3  Folgepaare', text: 'Führt ein Zeichen ein freies Paar in ein markiertes Paar? Dann markieren. Wiederholen, bis sich nichts ändert.', icon: 'LuRepeat' },
    { head: '4  Verschmelzen', text: 'Freie Paare sind äquivalent: Zustände zusammenfassen.', icon: 'LuMerge' },
  ], notes: 'Begründung, warum das funktioniert: Jede Markierung trägt ein unterscheidendes Wort (Zeichen + Wort des Folgepaares). Was nie markiert wird, kann kein Wort unterscheiden.' });
  const roundSlide = (k, title, items, note) => d.twoCol({ title, size: 22, left: { head: `Runde ${k}`, items }, right: { img: IMG + `smiley_runde${k}.png` }, notes: note });
  roundSlide(0, 'Runde 0: End- gegen Nicht-Endzustand', ['Endzustände: S3, S4', 'Jedes Paar mit genau einem Endzustand: **X₀**', `${SM.rounds[0].length} Paare markiert`], 'Unterscheidendes Wort ist jeweils ε.');
  roundSlide(1, 'Runde 1: Folgepaare prüfen', ['(S0, S1) mit „)“ → (S4, F_err): markiert', '(S0, S2), (S1, F_err), (S2, F_err) ebenso mit „)“', '(S1, S2) mit „)“ → (S3, S4): **noch frei**'], 'Für jedes freie Paar jedes Zeichen prüfen. In Runde 1 zählen nur Markierungen aus Runde 0 (Ergebnis wie in der App).');
  roundSlide(2, 'Runde 2: weiter, bis nichts mehr passiert', ['(S1, S2) mit „-“ → (S2, F_err): markiert', '(S0, F_err) mit „:“ → (S1, F_err): markiert', 'Runde 3: keine neue Markierung ⇒ fertig'], 'Unterscheidende Wörter rückwärts lesen: (S1, S2) über - und dann ) ⇒ Wort -).');
  {
    const sl = d.blank({ title: 'Ergebnis: S3 und S4 zusammenfassen', notes: 'Der minimale DEA ist bis auf die Namen der Zustände eindeutig (Satz von Myhill-Nerode, nur als Ausblick).' });
    d.tb(sl, d.bulletRuns(['Nur **(S3, S4)** bleibt frei: S3 ≡ S4', 'Zu einem Zustand verschmelzen; Pfeile nach S4 zeigen jetzt auf S3', 'Ergebnis: Automat von Team B – **minimal**'], 22), { x: M, y: 1.55, w: 5.4, h: 2.6 });
    let f = d.fit(IMG + 'smiley_runde3.png', 3.6, 2.7); sl.addImage({ path: IMG + 'smiley_runde3.png', x: M + 0.6, y: 4.1, w: f.w, h: f.h });
    f = d.fit(IMG + 'smileyB.png', 6.6, 5.0); sl.addImage({ path: IMG + 'smileyB.png', x: W - M - f.w, y: 1.6 + (5.0 - f.h) / 2, w: f.w, h: f.h });
  }
  d.bullets({ title: 'Wie viele Zustände braucht man mindestens?', items: [
    'Ein Automat mit n Zuständen zeigt nur: **höchstens** n sind nötig',
    '**Mindestens** n: Finde n Eingaben, die **paarweise unterscheidbar** sind',
    'Dann muss der Automat nach ihnen in n verschiedenen Zuständen sein',
    'Smiley: ε, `:`, `:-`, `:)`, `::` sind paarweise unterscheidbar ⇒ mindestens 5',
  ], img: IMG + 'smileyB.png', imgW: 5.0, notes: 'Abi 2024 eA B c: „Begründen Sie, dass sich die Anzahl der Zustände … um mindestens 5 erhöht.“ Vorgehen: paarweise unterscheidbare Präfixe. Kontrolle: ε/: durch :), : und :- durch ), :) Endzustand, :: nie mehr akzeptierbar.' });
  d.section({ phase: 'Übung', title: 'Arbeitsblatt Level 5' });
  d.task({ title: 'Auftrag: AB05', steps: [
    '**Aufgabe 1** (Basis): unterscheidende Wörter und äquivalente Zustände.',
    '**Aufgabe 2**: Markierungsverfahren – kontrolliere in der App.',
    '**Aufgaben 3 und 4**: Abi-Transfer (Begründen, Zusammenfassen).',
    'Profis: **Aufgabe 5** (Mindestzahl) und „Unterscheide!“.',
  ], zeit: '35 min', sozialform: 'Einzel → Partner', material: 'AB05, Merkblatt M03', app: '#/minimierer?aufgabe=5', notes: 'Zwischensicherung zu 3a nach ca. 20 Minuten: Begründungsmuster mit unterscheidendem Wort.' });
  d.app({ title: 'Minimierer', route: '#/minimierer?aufgabe=5', text: 'Markierungsverfahren interaktiv: Felder antippen, **Runde prüfen**, Folgepaare ansehen. Im Modus **Unterscheide!** findest du unterscheidende Wörter.', notes: 'Weitere Aufgaben: ?aufgabe=1 (Smiley), ?aufgabe=7 (Prüfnummern, Abi 2025), Spiel: ?modus=unterscheide.' });
  d.section({ phase: 'Sicherung', title: 'Was wir heute gelernt haben' });
  d.table({ title: 'Abi-Check: So begründest du', phase: 'Sicherung', rows: [
    ['Operator / Frage', 'Antwortmuster'],
    ['Begründen Sie, dass sich der Automat nach u und v in verschiedenen Zuständen befinden muss.', 'Wort w angeben, für das uw akzeptiert und vw abgelehnt wird (beide Verarbeitungen kurz zeigen).'],
    ['Untersuchen Sie, inwieweit Zustände zusammengefasst werden können.', 'Äquivalente Zustände nennen und begründen (Bedeutung oder Markierungsverfahren); für die übrigen Paare unterscheidende Wörter.'],
    ['Begründen Sie, dass mindestens n Zustände nötig sind.', 'n paarweise unterscheidbare Eingaben angeben, je Paar ein unterscheidendes Wort.'],
  ], colW: [5.6, 6.5], size: 18, notes: 'Steht so auch im Merkblatt M03 (Abschnitt Abi-Check).' });
  d.end({ items: ['Unterscheidbar vs. äquivalent – unterscheidendes Wort', 'Markierungsverfahren mit der Dreieckstabelle', 'Äquivalente Zustände zusammenfassen', 'Mindestzahl mit paarweise unterscheidbaren Eingaben begründen'], hausaufgabe: 'Minimierer, Aufgabe 3 (Barcode mit Ballast): erst im Heft mit Dreieckstabelle, dann in der App prüfen. Gutschein-Automat: begründen, dass er nach dem Zusammenfassen minimal ist.' });
  return d.save(OUT + `DS05_Folien_${FN}.pptx`);
}

(async () => {
  const files = [await ab(), await lk(), await folien()];
  console.log(files.join('\n'));
})();
