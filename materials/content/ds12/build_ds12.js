const __MAT = require('path').resolve(__dirname, '../..'); // Wurzel: materials/
// DS12 – Level 12 „Grammatik trifft Automat“ – Arbeitsblatt, Lehrkraft-Handreichung, Folien
const D = require((__MAT + '/lib/docstyle.js'));
const S = require((__MAT + '/lib/deckstyle.js'));
const W = require((__MAT + '/content/ds11/wc.js'));
const IMG = (__MAT + '/build/img/ds12/');
const OUT = (__MAT + '/out/');
const T = 'Grammatik trifft Automat';
const SUB = 'Reguläre Grammatiken und endliche Automaten';
const KF = 'Wie hängen reguläre Grammatiken und endliche Automaten zusammen?';
const J = W.load(12);
const FILE = 'Grammatik-trifft-Automat';
const FEHLER = 'Alle nicht eingezeichneten Übergänge führen in einen Fehlerzustand.';
const GM = W.abi(['S', 'C', 'B', 'A', 'T'], ['v', 'h', 'g', 't'], 'S', J.gm_rules);
const GT = W.abi(['S', 'A'], ['x', 'y', '+', '-'], 'S', J.gt_rules);
const ar = (a) => a.join(' ⇒ ');

const REZEPT = [
  ['Endlicher Automat', 'Rechtsreguläre Grammatik'],
  ['Zustand Si', 'Nichtterminal Si'],
  ['Startzustand', 'Startsymbol'],
  ['Übergang Si –a→ Sj', 'Regel Si → aSj'],
  ['Si ist Endzustand', 'Regel Si → ε'],
  ['Fehlerzustand', 'entfällt (keine Regel)'],
  ['neuer Endzustand Z mit A –a→ Z', 'Regel A → a'],
];

// =====================================================================================  Arbeitsblatt
async function ab() {
  const body = [
    D.p('Automaten **prüfen** Wörter, Grammatiken **erzeugen** sie. Beim Übersetzer-Duell hast du gesehen: Für manche Sprachen kann man beides ineinander übersetzen – fast mechanisch, wie mit einem Rezept.'),
    D.info('Rechtsreguläre Grammatik und Übersetzungsrezept', [
      D.p('Eine Grammatik heißt **rechtsregulär** (kurz: regulär), wenn **alle** Regeln eine dieser Formen haben:  **A → aB**,  **A → a**  oder  **A → ε**  (a Terminalsymbol, B Nichtterminal). Rechts steht also entweder ε oder **genau ein** Terminalsymbol, das von **höchstens einem** Nichtterminal gefolgt wird.', { size: 21 }),
      D.table([['Automat', 'Grammatik', 'Automat', 'Grammatik'], ...[1, 2, 3].map((i) => [...REZEPT[i], ...REZEPT[i + 3]])], { widthsCm: [3.4, 3.7, 4.4, 3.7], size: 19, noSpacer: true }),
    ]),
    D.task({ nr: 1, title: 'Der MähBot', niveau: 'Basis', afb: 'I–II', body: [
      D.p('Ein Rasenmäh-Roboter versteht drei Befehle: **v** (vorwärts fahren) und **d** (drehen) brauchen eine Zahl aus mindestens einer Ziffer, **m** (Mähwerk an/aus) braucht keine. Jeder Befehl endet mit **#**. Alle Ziffern werden durch **z** dargestellt: Σ = {v, d, m, z, #}. Ein Programm besteht aus mindestens einem Befehl, z. B. `vzz#dz#m#`.'),
      D.img(IMG + 'maehbot.png', { widthCm: 9.5, caption: 'Abbildung 1: DEA für MähBot-Programme. ' + FEHLER }),
      D.sub('a', '**Übersetze** den DEA mit dem Rezept in eine rechtsreguläre Grammatik. **Gib** N, T, Startsymbol und Produktionsregeln **an**.'),
      ...D.lines(4),
      D.sub('b', '**Zeige** durch Ableiten, dass `vzz#m#` erzeugt wird, und **stelle** die Zustandsfolge des DEA daneben **dar**. Was fällt dir auf?'),
      ...D.lines(2),
      D.sub('c', '**Erläutere**, warum für den Fehlerzustand keine Regel benötigt wird.'),
      ...D.lines(1),
      D.sub('d', '*(Profi)* Neu: Wiederholungen wie `wzz(vz#m#)` – nach w folgt die Anzahl (z …), in Klammern stehen Befehle; Wiederholungen sind nicht verschachtelt. **Erweitere** deine Grammatik; sie soll rechtsregulär bleiben. **Beurteile**, ob das auch für beliebig tief verschachtelte Wiederholungen möglich ist.'),
      ...D.lines(3),
    ] }),
    ...D.info('Kurz erklärt: nichtdeterministischer endlicher Automat (NEA)', [...D.bullets(['Ein **NEA** darf aus einem Zustand mit demselben Zeichen in **mehrere** Folgezustände wechseln (oder in keinen).', 'Ein Wort wird **akzeptiert**, wenn es **mindestens einen Weg** gibt, der nach dem letzten Zeichen in einem Endzustand endet.', '**Teilmengenkonstruktion:** Die Mengen der gleichzeitig möglichen Zustände werden die Zustände eines DEA. Ausführlich: Merkblatt M06 (Bonus-Level 8).'])]),
    D.task({ nr: 2, title: 'Takt für Takt', niveau: 'Standard', afb: 'II', body: [
      D.p('Melodien werden ohne Tonhöhen notiert: **v** = Viertelnote (1 Schlag), **h** = halbe Note (2 Schläge), **g** = ganze Note (4 Schläge), **t** = Taktstrich. Jeder Takt hat genau vier Schläge und endet mit t. Die Grammatik G~M~ erzeugt alle Melodien aus mindestens einem Takt.'),
      W.side(W.gram(GM, { widthCm: 6.4 }), [D.p('*Bedeutung der Nichtterminale* – im Takt sind noch … Schläge frei:', { size: 20, after: 40 }), D.table([['S', 'C', 'B', 'A', 'T'], ['4', '3', '2', '1', '0 (voll)']], { size: 19, allCenter: true, noSpacer: true, widthsCm: [1.9, 1.9, 1.9, 1.9, 2.4] }), D.p('Abbildung 2 (links): Grammatik G~M~', { size: 18, color: D.C.muted, before: 120 })], 6.7),
      D.sub('a', '**Gib** zwei Wörter **an**, in denen alle Terminalsymbole vorkommen.'),
      ...D.lines(1),
      D.sub('b', '**Erläutere** anhand der Grammatik, dass `vhht` kein Wort der Sprache ist.'),
      ...D.lines(2),
      D.sub('c', '**Begründe**, dass G~M~ rechtsregulär ist.'),
      ...D.lines(1),
      D.sub('d', '**Entwickle** mit dem Rezept einen Automaten zu G~M~. **Erläutere**, warum er nichtdeterministisch ist, und **entwickle** daraus einen DEA (der Fehlerzustand darf weggelassen werden).'),
      ...D.drawBox(5.0, 'Platz für NEA und DEA'),
      D.sub('e', '**Erläutere**, wie die Grammatik sicherstellt, dass jeder Takt genau vier Schläge hat.'),
      ...D.lines(2),
      D.sub('f', '*(Profi)* Neu ist die punktierte halbe Note **p** (3 Schläge). **Erweitere** G~M~ entsprechend.'),
      ...D.lines(1),
    ] }),
    D.task({ nr: 3, title: 'Gäste-WLAN-Codes', niveau: 'Standard', afb: 'II–III', body: [
      D.p('Ein Router erzeugt Zugangscodes über Σ = {a, b, 1, 2, #} mit einer regulären Grammatik. Es gilt: **(1)** Im Code kommen mindestens ein **a** und mindestens eine **2** vor (Reihenfolge egal). **(2)** Der Code endet mit **#**; # kommt sonst nicht vor. Gültig sind z. B. `a2#`, `b2a1#`, `2ba#`.'),
      D.sub('a', '**Entwickle** eine rechtsreguläre Grammatik für die Codes. *Tipp: Was muss sich die Grammatik merken – wie die Zustände eines DEA?*'),
      ...D.lines(4),
      D.sub('b', '**Zeige** mit deiner Grammatik, dass `b2a1#` erzeugt wird.'),
      ...D.lines(1),
      D.sub('c', '**Gib** eine zusätzliche Regel (4) **an**, sodass die Codes nicht mehr mit einer regulären Grammatik erzeugt werden können, und **begründe** kurz.'),
      ...D.lines(2),
    ] }),
    D.task({ nr: 4, title: 'Grammatik nicht regulär – Sprache aber schon?', niveau: 'Profi', afb: 'II–III', body: [
      W.side(W.gram(GT, { widthCm: 8.1, caption: 'Abbildung 3: Grammatik G~T~ für Terme' }), W.gram(['N = {S}', 'T = {a, b}', 'Startsymbol: S', 'Produktionsregeln:', 'S → Sa | b'], { widthCm: 8.1, caption: 'Abbildung 4: Grammatik G~L~' }), 8.4),
      D.sub('a', '**Untersuche**, ob `x+y-x` und `x+-y` von G~T~ erzeugt werden.'),
      ...D.lines(2),
      D.sub('b', '**Begründe**, dass G~T~ nicht regulär ist, die Sprache L(G~T~) aber regulär ist.'),
      ...D.lines(3),
      D.sub('c', '**Beschreibe** L(G~L~), **begründe**, dass G~L~ nicht rechtsregulär ist, und **gib** eine rechtsreguläre Grammatik für dieselbe Sprache **an**.'),
      ...D.lines(2),
      D.sub('d', '**Erläutere** am Beispiel von G~T~ und der Grammatik S → aSb | ab den Unterschied zwischen den Aussagen „Die Grammatik ist nicht regulär.“ und „Die Sprache ist nicht regulär.“'),
      ...D.lines(2),
    ] }),
    D.qr({ route: '#/grammatik?modus=frei', title: 'Grammatik-Tester (frei)', text: 'Gib deine Grammatik ein: Die App prüft, ob sie rechtsregulär ist, erzeugt Wörter und übersetzt sie in einen NEA/DEA. Ideal zur Kontrolle von Aufgabe 1a, 2d und 3a. Danach: rechtsreguläre Challenges 3, 4, 8 und 9 sowie Challenge 5 (System-Codes) in der Übersicht #/grammatik.' }),
    D.h3('Selbstcheck – Level 12 geschafft, wenn …'),
    ...D.checklist([
      'ich entscheiden kann, ob eine Grammatik rechtsregulär ist.',
      'ich einen DEA mit dem Rezept in eine rechtsreguläre Grammatik übersetzen kann – und umgekehrt eine Grammatik in einen NEA/DEA.',
      'ich die Bedeutung von Nichtterminalen wie die Bedeutung von Zuständen erläutern kann.',
      'ich „Grammatik nicht regulär“ und „Sprache nicht regulär“ unterscheiden kann.',
    ]),
  ];
  return D.save(D.doc({ kind: 'AB', ds: 12, title: T, subtitle: SUB, kernfrage: KF, body }), OUT + `DS12_AB_${FILE}.docx`);
}

// =====================================================================================  Lehrkraft
async function lk() {
  const body = [
    D.h2('Überblick'),
    D.table([
      ['Aspekt', 'Inhalt'],
      ['Lernziele', 'Die SuS erkennen rechtsreguläre Grammatiken, übersetzen DEA in rechtsreguläre Grammatiken und umgekehrt (über NEA und Teilmengenkonstruktion), entwickeln reguläre Grammatiken für Sachkontexte und unterscheiden „Grammatik nicht regulär“ von „Sprache nicht regulär“.'],
      ['KC-Bezug', 'Formale Sprachen (eA): reguläre Grammatiken entwerfen (F3), Zusammenhang zwischen regulären Grammatiken und endlichen Automaten erläutern (F4); Automaten entwickeln (K3). PK1.5, PK2.3, PK3.2, IK3.2'],
      ['Abi-Bezug', '**Originale zur Vertiefung:** Abi 2021 eA Aufgabe D, Teile a–c (Melodien MuL1: Grammatik → DEA, „Erläutern Sie, wie sichergestellt wird …“, reguläre Grammatik für MuL2 – Vorlage für AB-Aufgabe 2); Abi 2021 eA Nachschreibtermin Aufgabe D, Teil b (RobProg: reguläre Grammatik, Wiederholungen, Beurteilung verschachtelter Wiederholungen – Vorlage für Aufgabe 1); Abi 2024 eA Aufgabe B, Teile d und e (System-Codes: reguläre Grammatik, zusätzliche nicht-reguläre Regel – Vorlage für Aufgabe 3); Abi 2025 eA Nachschreibtermin Aufgabe B, Teile a und b („Begründen Sie, dass die Grammatik G nicht regulär, aber die Sprache L regulär ist“ – Vorlage für Aufgabe 4); Abi 2022 eA Aufgabe D, Teil a (Frog1: „Begründen Sie, dass G1 nicht regulär ist“).'],
      ['Material', 'Folien DS12, AB12, Merkblatt M09, Duell-Karten (Kopiervorlage unten), AutomatenLab „Grammatik-Tester“ (#/grammatik, #/grammatik?modus=frei), Exit-Ticket #/quiz?ds=12'],
      ['Vorbereitung', 'Duell-Karten A und B je Gruppenpaar kopieren; Wortliste für die Lehrkraft; Tafel zweigeteilt („Team Automat“ | „Team Grammatik“).'],
    ], { widthsCm: [3.2, 14.2], firstColBold: true, firstColFill: true }),
    D.h2('Verlaufsplan (90 Minuten)'),
    D.table([
      ['Zeit', 'Phase', 'Unterrichtsgeschehen', 'Sozialform / Medien'],
      ['0–15', 'Einstieg', '„Übersetzer-Duell“: Team A erhält nur den DEA, Team B nur die Grammatik (Karten unten). Die Lehrkraft ruft Wörter auf; Team A lässt den Automaten laufen, Team B versucht abzuleiten. Wer zuerst richtig „gehört dazu / gehört nicht dazu“ ruft, punktet.', 'GA (2 Teams je Tisch), Duell-Karten'],
      ['15–25', 'Einstieg', 'Auswertung: Beide Teams waren sich immer einig – Zufall? Teams legen DEA und Grammatik nebeneinander und finden die Entsprechungen (Zustand ↔ Nichtterminal, Übergang ↔ Regel, Endzustand ↔ ε-Regel).', 'UG, Folien'],
      ['25–45', 'Erarbeitung', 'Rechtsreguläre Form; Übersetzungsrezept DEA → Grammatik am MähBot (AB 1a gemeinsam beginnen). Ableitung = Lauf durch den Automaten. Rückweg Grammatik → NEA → DEA am Beispiel Musik-Takte (Nichtdeterminismus durch T → t | tS, Kurz erklärt in 10 min: NEA und Teilmengenkonstruktion, Info-Kasten im AB und Folie; ausführlich in Bonus-Level 8 und Merkblatt M06).', 'LV/UG, Folien, M09'],
      ['45–80', 'Übung', 'AB12 Aufgaben 1–4 (gestuft). Kontrolle der eigenen Grammatiken im Grammatik-Tester (freier Modus: Regel-Check, Wörter erzeugen, Grammatik → DEA). Schnelle SuS: Challenges 3, 4, 8, 9 (rechtsregulär verlangt) und 5 (System-Codes; die App prüft hier nur die Sprache – Rechtsregularität selbst kontrollieren).', 'EA/PA, AB12, iPads'],
      ['80–90', 'Sicherung', 'Merkblatt M09; Kernaussage: „Grammatik nicht regulär“ ≠ „Sprache nicht regulär“ (AB 4d). Exit-Ticket #/quiz?ds=12, Hausaufgabe.', 'UG, M09'],
    ], { widthsCm: [1.6, 2.4, 10.2, 3.2], size: 19 }),
    D.h2('Übersetzer-Duell'),
    D.p('Je zwei Teams (2–3 SuS) sitzen sich gegenüber. Team A hat Karte A (DEA), Team B Karte B (Grammatik) – sie wissen nicht, dass beide dieselbe Sprache beschreiben. Die Lehrkraft nennt nacheinander Wörter. Team A „lässt den Automaten laufen“, Team B leitet ab (oder begründet, warum es nicht geht). Beide notieren ihr Urteil verdeckt, dann wird aufgedeckt. Punkt für jedes richtige Urteil, Bonuspunkt für das schnellere Team.'),
    D.h3('Kopiervorlage: Duell-Karten'),
    D.table([
      [[D.p('**Karte A – Team Automat**', { size: 22, color: D.C.teal }), ...D.img(IMG + 'duell.png', { widthCm: 7.4 }), D.p('Σ = {a, b}. ' + FEHLER, { size: 18 }), D.p('Lasst den Automaten jedes genannte Wort lesen. Endet er in einem Endzustand, gehört das Wort dazu.', { size: 19 })],
        [D.p('**Karte B – Team Grammatik**', { size: 22, color: D.C.ocker }), ...W.gram(W.abi(['S0', 'S1', 'S2'], ['a', 'b'], 'S0', J.duell_rules), { widthCm: 7.4 }), D.p('Versucht, jedes genannte Wort vom Startsymbol S0 aus abzuleiten. Gelingt es, gehört das Wort dazu.', { size: 19 })]],
    ], { header: false, widthsCm: [8.7, 8.7] }),
    D.p('Wortliste für die Lehrkraft (Reihenfolge so lassen):', { after: 40 }),
    D.table([['Wort', ...Object.keys(J.duell_words)], ['gehört dazu?', ...Object.values(J.duell_words).map((v) => (v ? 'ja' : 'nein'))]], { size: 19, allCenter: true }),
    D.p(`Auflösung an der Tafel: Ableitung ${ar(J.duell_deriv_abab)} und Zustandsfolge ${J.duell_path_abab} – Schritt für Schritt identisch. Die Sprache: alle Wörter, die mit a beginnen und mit b enden.`, { size: 20 }),
    D.pageBreak(),
    D.h2('Lösungen AB12'),
    D.h3('Aufgabe 1 – MähBot'),
    D.p('a) N = {S0, S1, S2, S3, S4}, T = {v, d, m, z, #}, Startsymbol S0, Produktionsregeln:', { after: 40 }),
    ...W.gram(J.robo_rules, { size: 20 }),
    ...D.bullets([
      `b) Ableitung: ${ar(J.robo_deriv)}`,
      `   Zustandsfolge: ${J.robo_path}. Jeder Ableitungsschritt entspricht genau einem Übergang; das Nichtterminal am Ende der Satzform ist der aktuelle Zustand. Der letzte Schritt (S4 → ε) entspricht „S4 ist Endzustand“.`,
      'c) Aus dem Fehlerzustand gelangt man nie in einen Endzustand. Eine Satzform mit diesem Nichtterminal könnte nie zu einem Wort fertig abgeleitet werden – die Regeln wären nutzlos.',
      'd) Erweiterung: S0 → … | wW1 und S4 → … | wW1 sowie die folgenden Regeln (W1, W2: Anzahl; B0–B4: Befehle innerhalb der Klammer, analog zu S0–S4):',
    ]),
    ...W.gram(J.robo_w_rules, { size: 20 }),
    D.p(`Beispiel: ${ar(J.robo_w_deriv)}. **Beurteilung:** Bei beliebig tiefer Verschachtelung muss für jede geöffnete Klammer eine schließende folgen. Die Grammatik müsste sich die aktuelle Schachtelungstiefe merken; mit endlich vielen Nichtterminalen (wie mit endlich vielen Zuständen) geht das nur bis zu einer festen Tiefe. Die Sprache ist dann nicht regulär (Schubfachprinzip wie bei aⁿbⁿ) – Thema von Level 13.`, { size: 20 }),
    D.h3('Aufgabe 2 – Takt für Takt'),
    ...D.bullets([
      `a) z. B. hvvtgt (${ar(J.gm_deriv_ex1)}) oder vhvtgt.`,
      `b) S ⇒ vC ⇒ vhA. Für A gibt es nur die Regel A → vT, als nächstes Zeichen ist also nur v möglich, nicht h. Im Sachzusammenhang: Nach 1 + 2 = 3 Schlägen passt nur noch eine Viertelnote in den Takt.`,
      'c) Alle Regeln haben die Form A → aB (ein Terminal, dann ein Nichtterminal) bzw. A → a (T → t).',
      'd) NEA nach Rezept (Zustände = Nichtterminale, T → t wird zum Übergang in einen neuen Endzustand Z):',
    ]),
    D.img(IMG + 'takt_nea.png', { widthCm: 13.5 }),
    D.p('Nichtdeterministisch: Aus T führen zwei Übergänge mit t (nach S und nach Z). Teilmengenkonstruktion: Aus {T} wird mit t die Menge {S, Z} – ein neuer Endzustand S5, der sich wie S0 verhält:', { size: 20 }),
    D.img(IMG + 'takt_dea.png', { widthCm: 13.5, caption: `DEA zu G~M~ (S0 = {S}, S1 = {C}, S2 = {B}, S3 = {A}, S4 = {T}, S5 = {S, Z}). ${FEHLER}` }),
    ...D.bullets([
      'e) Jedes Nichtterminal steht für die Anzahl noch freier Schläge (S: 4, C: 3, B: 2, A: 1). Jede Note führt nur zu einem Nichtterminal mit entsprechend weniger freien Schlägen; Regeln, die mehr Schläge verbrauchen würden, gibt es nicht. Der Taktstrich t entsteht nur aus T (0 frei), danach beginnt mit S wieder ein voller Takt.',
      `f) S → vC | hB | gT | pA  und  C → vB | hA | pT  (übrige Regeln unverändert).`,
    ]),
    D.h3('Aufgabe 3 – Gäste-WLAN-Codes'),
    D.p('a) N = {S, A, Z, B}, T = {a, b, 1, 2, #}, Startsymbol S. Bedeutung: S – noch kein a und keine 2; A – a schon da, 2 fehlt; Z – 2 schon da, a fehlt; B – beides da.', { after: 40 }),
    ...W.gram(J.gc_rules, { size: 20 }),
    ...D.bullets([
      `b) ${ar(J.gc_deriv)}`,
      'c) z. B. „(4) Der Code enthält gleich viele Buchstaben wie Ziffern“ oder „(4) Auf die Buchstaben folgen genauso viele Ziffern, wie Buchstaben davorstehen“. Die Grammatik müsste unbeschränkt zählen; mit endlich vielen Nichtterminalen ist das nicht möglich (wie beim DEA: Schubfachprinzip).',
    ]),
    D.img(IMG + 'codes_nea.png', { widthCm: 10, caption: 'Zur Kontrolle: Automat zur Grammatik (Rezept); X ist der neue Endzustand aus B → #. ' + FEHLER }),
    D.h3('Aufgabe 4 – Grammatik nicht regulär – Sprache aber schon?'),
    ...D.bullets([
      `a) x+y-x wird erzeugt: ${ar(J.gt_deriv)}. x+-y wird nicht erzeugt: Jede Regel für A erzeugt ein Rechenzeichen immer zusammen mit einer Variablen dahinter (+x, -y …); zwei Rechenzeichen hintereinander sind unmöglich.`,
      'b) G~T~ ist nicht regulär, weil z. B. A → +xA rechts **zwei** Terminalsymbole vor dem Nichtterminal hat. Die Sprache ist trotzdem regulär, denn es gibt eine rechtsreguläre Grammatik dafür – mit einem Zwischen-Nichtterminal B („Rechenzeichen gelesen, Variable fehlt“):',
    ]),
    ...W.gram(J.gt2_rules, { size: 20 }),
    D.img(IMG + 'terme_dea.png', { widthCm: 8, caption: 'Zugehöriger DEA (S0 = {S}, S1 = {A}, S2 = {B}). ' + FEHLER }),
    ...D.bullets([
      `c) L(G~L~) = {b, ba, baa, …}: ein b, gefolgt von beliebig vielen a (${ar(J.gl_deriv)}). G~L~ ist nicht rechtsregulär, weil in S → Sa das Nichtterminal **links** vom Terminal steht (linksregulär). Rechtsregulär: S → bA,  A → aA | ε.`,
      'd) „Die Grammatik ist nicht regulär“ ist eine Aussage über **eine** konkrete Grammatik (ihre Regelform). „Die Sprache ist nicht regulär“ heißt: **Keine** Grammatik dieser Sprache ist regulär bzw. kein DEA erkennt sie. L(G~T~) ist regulär, obwohl G~T~ es nicht ist. Für {aⁿbⁿ | n ≥ 1} (S → aSb | ab) gibt es dagegen gar keine reguläre Grammatik (Level 7: kein DEA).',
    ]),
    D.h2('Typische Schwierigkeiten'),
    ...D.warn('Darauf achten', [
      ...D.bullets([
        '**ε-Regeln vergessen:** Endzustände werden zu Regeln Si → ε. Ohne sie gibt es kein fertiges Wort.',
        '**Regel A → a ohne neuen Endzustand:** Beim Rückweg Grammatik → Automat braucht A → a einen zusätzlichen Endzustand (Z).',
        '**„aB“ vs. „Ba“:** Regeln wie S → Sa sind *nicht* rechtsregulär (linksregulär). Im Abitur bedeutet „regulär“ immer rechtsregulär.',
        '**Zwei Terminale in einer Regel** (z. B. A → +xA): Grammatik nicht regulär, Sprache oft trotzdem – Zwischen-Nichtterminal einführen.',
        '**Nichtdeterminismus übersehen:** T → t | tS liefert zwei t-Übergänge aus T. Erst nach Teilmengenkonstruktion ist der Automat ein DEA.',
      ]),
    ]),
    D.h2('Differenzierung'),
    ...D.bullets([
      '**Basis:** Aufgabe 1a–c, 2a–c; Hilfe: Rezept-Tabelle aus dem Infokasten Zeile für Zeile abhaken.',
      '**Standard:** Aufgaben 1–3.',
      '**Profi:** Aufgabe 4, 1d und 2f; Zusatz: Abi 2021 eA D c (MuL2) im Original.',
      'App: Challenges 3 und 4 (Basis), 5 und 9 (Standard/Profi).',
    ]),
    D.h2('Hausaufgabe'),
    D.p('AB12 Aufgabe 4 (bzw. noch offene Teile) und Grammatik-Challenges 5 und 8. Vorbereitung auf Level 13: Notiere drei Wörter der Sprache {aⁿbⁿ | n ≥ 1} und überlege, warum dir das Übersetzungsrezept hier nicht hilft.'),
  ];
  return D.save(D.doc({ kind: 'LK', ds: 12, title: T, subtitle: SUB, kernfrage: KF, body }), OUT + `DS12_Lehrkraft_${FILE}.docx`);
}

// =====================================================================================  Folien
async function folien() {
  const d = S.deck({ ds: 12, title: T });
  d.title({ title: T, subtitle: SUB, kernfrage: KF, notes: 'Anknüpfung an Level 11 (Grammatiken) und Welt A (DEA).' });
  d.section({ phase: 'Einstieg', title: 'Das Übersetzer-Duell' });
  d.task({ title: 'Das Übersetzer-Duell', phase: 'Einstieg', steps: [
    '**Team A** bekommt einen Automaten, **Team B** eine Grammatik.',
    'Ich nenne ein Wort. Team A lässt den Automaten laufen, Team B leitet ab.',
    'Beide notieren verdeckt: **gehört dazu** oder **gehört nicht dazu**.',
    'Aufdecken: Punkt für jedes richtige Urteil, Bonus für das schnellere Team.',
  ], zeit: '15 min', sozialform: 'Team gegen Team', material: 'Duell-Karten A und B', notes: `Wörter in dieser Reihenfolge: ${Object.keys(J.duell_words).join(', ')}.` });
  d.twoCol({ title: 'Zwei Karten – eine Sprache?', left: { head: 'Team Automat', img: IMG + 'duell.png', items: ['Σ = {a, b}', FEHLER] }, right: { head: 'Team Grammatik', items: [...J.duell_rules.map((r) => '`' + r + '`'), 'Startsymbol S0'] }, notes: 'Erst nach dem Duell zeigen. Frage: Warum waren sich beide Teams immer einig?' });
  d.table({ title: 'Ableitung = Lauf durch den Automaten', phase: 'Einstieg', rows: [
    ['Schritt', 'Ableitung (Grammatik)', 'Zustandsfolge (Automat)'],
    ['Start', 'S0', 'S0'],
    ['a', '⇒ aS1', 'S0 –a→ S1'],
    ['b', '⇒ abS2', 'S1 –b→ S2'],
    ['a', '⇒ abaS1', 'S2 –a→ S1'],
    ['b', '⇒ ababS2', 'S1 –b→ S2'],
    ['Ende', '⇒ abab  (Regel S2 → ε)', 'S2 ist Endzustand'],
  ], colW: [1.6, 5.2, 5.3], size: 20, notes: 'Das Nichtterminal am Ende der Satzform ist immer der aktuelle Zustand. Das ist der Kern des Übersetzungsrezepts.' });
  d.section({ phase: 'Erarbeitung', title: 'Zustand = Nichtterminal' });
  d.bullets({ title: 'Rechtsreguläre Grammatiken', phase: 'Erarbeitung', items: [
    'Alle Regeln haben die Form **A → aB**, **A → a** oder **A → ε**',
    '  a: ein Terminalsymbol, B: ein Nichtterminal – rechts genau ein Terminal, ggf. gefolgt von genau einem Nichtterminal (oder ε)',
    'Rechtsregulär: S → aS | bA,  A → b | ε',
    'Nicht rechtsregulär: S → aSb (Nichtterminal in der Mitte), S → Sa (links), A → +xA (zwei Terminale)',
    'Im Abitur gilt: **reguläre Grammatik = rechtsreguläre Grammatik**',
  ], notes: 'Ergänzende Hinweise 2025: Reguläre Grammatiken werden rechtsregulär angegeben. Kurzer Check per Handzeichen zu den Beispielen.' });
  d.table({ title: 'Übersetzungsrezept', phase: 'Erarbeitung', rows: REZEPT, colW: [6.05, 6.05], size: 20, notes: 'Rezept in beide Richtungen lesen. Die letzte Zeile braucht man nur für den Rückweg Grammatik → Automat.' });
  d.image({ title: 'Beispiel: der MähBot', img: IMG + 'maehbot.png', sigma: 'Σ = {v, d, m, z, #}   –   v, d mit Zahl (z …), m ohne Zahl, jeder Befehl endet mit #', caption: FEHLER, maxH: 4.6, notes: `AB-Aufgabe 1a gemeinsam starten: S0 → vS1 | dS1 | mS3, S1 → zS2 … Lösung: ${J.robo_rules.join('; ')}` });
  W.sGram(d, S, { title: 'Rückweg: von der Grammatik zum Automaten', phase: 'Erarbeitung', lines: [...GM], size: 20, leftW: 5.6, items: ['v = 1 Schlag, h = 2, g = 4, t = Taktstrich', 'Jedes Nichtterminal = **Zustand**: S, C, B, A, T', '**A → aB**: Übergang A –a→ B', '**T → t**: Übergang in einen **neuen Endzustand** Z', '**T → tS**: zweiter t-Übergang aus T → nichtdeterministisch!'], notes: 'Bedeutung der Nichtterminale: noch freie Schläge im Takt (S: 4, C: 3, B: 2, A: 1, T: 0).' });
  d.bullets({ title: 'Kurz erklärt: der nichtdeterministische Automat (NEA)', phase: 'Erarbeitung', items: ['Ein **NEA** darf aus einem Zustand mit **demselben Zeichen** zu **mehreren** Folgezuständen gehen (oder zu keinem).', 'Ein Wort wird **akzeptiert**, wenn es **mindestens einen Weg** gibt, der nach dem letzten Zeichen in einem Endzustand endet.', 'Simulieren: Man merkt sich die **Menge aller aktiven Zustände**.', '**Teilmengenkonstruktion:** Jede erreichbare Zustandsmenge wird ein Zustand eines DEA – NEA und DEA erkennen dieselben Sprachen.', 'Ausführlich: Bonus-Level 8 und Merkblatt M06.'], notes: 'Kurzinput (ca. 10 Minuten), weil Level 8 im Pflichtweg übersprungen wird. Für die Übersetzung Grammatik → Automat reicht dieses Wissen.' });
  d.image({ title: 'Der NEA zur Takt-Grammatik', img: IMG + 'takt_nea.png', caption: 'Aus T führen zwei Übergänge mit t – nach S und nach Z.', notes: '[NUR LEHRKRAFT] NEA akzeptiert, wenn es mindestens einen Weg in einen Endzustand gibt (ausführlich: Bonus-Level 8, M06).' });
  d.image({ title: 'Teilmengenkonstruktion: der DEA', img: IMG + 'takt_dea.png', caption: 'S5 = {S, Z}: Endzustand, verhält sich wie S0.  ' + FEHLER, notes: '[NUR LEHRKRAFT] Teilmengen: S0 = {S}, S1 = {C}, S2 = {B}, S3 = {A}, S4 = {T}, S5 = {S, Z}. Warum darf man S0 nicht einfach zum Endzustand machen? (Dann würde das leere Wort akzeptiert.)' });
  d.twoCol({ title: 'Grammatik nicht regulär – Sprache trotzdem?', left: { head: 'Term-Grammatik', items: ['`S → xA | yA`', '`A → +xA | +yA | -xA | -yA | ε`', 'nicht rechtsregulär: **zwei** Terminale in A → +xA'] }, right: { head: 'Gleiche Sprache, regulär', items: ['`S → xA | yA`', '`A → +B | -B | ε`', '`B → xA | yA`'], img: IMG + 'terme_dea.png' }, notes: 'Merksatz: Eine Sprache ist regulär, wenn es IRGENDEINE reguläre Grammatik (bzw. einen DEA) für sie gibt. Vgl. Abi 2025 Nachschreibtermin B b.' });
  d.section({ phase: 'Übung', title: 'Arbeitsblatt Level 12' });
  d.task({ title: 'Auftrag: AB12', steps: [
    '**Aufgabe 1** (Basis): MähBot – DEA → Grammatik.',
    '**Aufgabe 2** (Standard): Takt für Takt – Grammatik → NEA → DEA.',
    '**Aufgabe 3** (Standard): Gäste-WLAN-Codes entwickeln.',
    'Profis: **Aufgabe 4** – Grammatik nicht regulär, Sprache aber schon?',
    'Kontrolliere deine Grammatiken im **Grammatik-Tester** (freier Modus).',
  ], zeit: '35 min', sozialform: 'Einzel → Partner', material: 'AB12, Merkblatt M09', app: '#/grammatik?modus=frei', notes: 'Der freie Modus zeigt „rechtsregulär ja/nein“ und baut aus der Grammatik einen NEA/DEA.' });
  d.app({ title: 'Grammatik-Tester', route: '#/grammatik', text: 'Entwirf Grammatiken mit **Sofort-Feedback**: Die App vergleicht deine Sprache mit der Zielsprache und zeigt ein Gegenbeispiel. Rechtsreguläre Challenges: **3, 4, 8, 9** – dazu **5** (System-Codes, Abi 2024).', notes: 'Challenge 5 entspricht der Abi-Aufgabe 2024 B d (System-Codes).' });
  d.section({ phase: 'Sicherung', title: 'Was wir heute gelernt haben' });
  d.merke({ title: 'Merke: Reguläre Grammatik und Automat', items: [
    '**Rechtsregulär:** nur Regeln A → aB, A → a, A → ε.',
    '**DEA → Grammatik:** Zustand = Nichtterminal, Si –a→ Sj wird Si → aSj, Endzustand Si wird Si → ε.',
    '**Grammatik → Automat:** A → a führt in einen neuen Endzustand; ggf. NEA → DEA per Teilmengenkonstruktion.',
    'Eine Sprache ist **regulär**, wenn es irgendeine reguläre Grammatik bzw. einen DEA für sie gibt.',
  ], img: IMG + 'duell.png', imgW: 4.4 });
  d.end({ items: ['Rechtsreguläre Form erkennen', 'Übersetzungsrezept in beide Richtungen', 'NEA → DEA bei Grammatik-Übersetzungen', '„Grammatik nicht regulär“ ≠ „Sprache nicht regulär“'], hausaufgabe: 'AB12 Aufgabe 4, Grammatik-Challenges 5 und 8. Überlege: Warum hilft das Rezept bei {aⁿbⁿ | n ≥ 1} nicht?' });
  return d.save(OUT + `DS12_Folien_${FILE}.pptx`);
}

(async () => {
  const files = [await ab(), await lk(), await folien()];
  console.log(files.join('\n'));
})();
