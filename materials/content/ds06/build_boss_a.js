const __MAT = require('path').resolve(__dirname, '../..'); // Wurzel: materials/
// Boss-Level A „Pixel-Ninja“ (Welt A) – Aufgabe (SuS) + Erwartungshorizont
const D = require((__MAT + '/lib/docstyle.js'));
const DATA = require((__MAT + '/content/ds06/ds06_data.json'));
const IMG = (__MAT + '/build/img/ds06/');
const OUT = (__MAT + '/out/');
const W = DATA.W; const TT = DATA.T; const M = DATA.M; const M2 = DATA.M2;
const TITLE = 'Boss-Level A: Pixel-Ninja';
const SUB = 'Abi-artige Aufgabe zu DEA, Minimierung und Mealy-Automaten';
const HINT = 'Die Automaten in den Abbildungen 1 und 2 sind vollständig angegeben.';
const be = (n) => `  [${n} BE]`;

const PARTS = [
  ['a', 2, 'I', 'Verarbeitung darstellen'],
  ['b', 3, 'I–II', 'Bedeutung eines Zustands erläutern, Übergang begründen'],
  ['c', 3, 'II–III', 'Mindestzahl von Zuständen begründen'],
  ['d', 4, 'II', 'DEA entwickeln'],
  ['e', 5, 'II', 'Zustände zusammenfassen'],
  ['f', 5, 'I–II', 'Mealy-Automat analysieren, mit DEA vergleichen'],
  ['g', 3, 'II–III', 'Mealy-Automat verändern'],
];
const SUM = PARTS.reduce((s, p) => s + p[1], 0);
if (SUM !== 25) throw new Error('BE-Summe ' + SUM);

// =====================================================================================  Aufgabe
async function aufgabe() {
  const body = [
    ...D.info('Hinweise zur Bearbeitung', [D.p(`Bearbeitungszeit ca. 75 Minuten · ${SUM} BE · Hilfsmittel: Merkblätter M01–M04. Bearbeiten Sie die Aufgabe wie eine Abiturklausur und kontrollieren Sie sich anschließend mit dem Erwartungshorizont.`, { size: 20 })]),
    D.h2('Aufgabe'),
    D.p('Im Retro-Spiel „Pixel-Ninja“ wird eine Spielfigur über einen Controller gesteuert. Der Controller liefert drei Eingabezeichen: **u** (Stick nach unten), **v** (Stick nach vorn) und **A** (Angriffstaste). Die Eingaben werden von endlichen Automaten in der Reihenfolge verarbeitet, in der sie eingegeben werden.', { justify: true }),
    D.p('Die Spezialattacke „Wirbelwind“ wird ausgelöst, wenn die letzten drei Eingaben u, v, A lauten. In Abbildung 1 im Material ist der Zustandsgraph eines deterministischen endlichen Automaten W mit dem Eingabealphabet Σ = {u, v, A} dargestellt, der genau die Eingabefolgen akzeptiert, nach denen ein Wirbelwind ausgelöst wird.', { justify: true }),
    D.sub('a', 'Stellen Sie die Verarbeitung der Eingabefolgen uuvA und uvuA durch den Automaten W dar.' + be(2)),
    D.sub('b', 'Erläutern Sie die Bedeutung des Zustands S2 im Sachzusammenhang. Begründen Sie, dass der Übergang aus S2 mit der Eingabe u nach S1 und nicht nach S0 führen muss.' + be(3)),
    D.sub('c', 'Begründen Sie, dass jeder deterministische endliche Automat, der genau die Eingabefolgen akzeptiert, die auf uvA enden, mindestens vier Zustände besitzt.' + be(3)),
    D.p('In einer neuen Spielversion wird ein Wirbelwind zusätzlich durch die Eingabefolge v, v, A ausgelöst.', { before: 80 }),
    D.sub('d', 'Entwickeln Sie den Zustandsgraphen eines vollständigen deterministischen endlichen Automaten, der genau die Eingabefolgen akzeptiert, die auf uvA oder auf vvA enden.' + be(4)),
    D.p('Für den Trainingsmodus hat ein Entwickler den Automaten T (Abbildung 2) entworfen. Eine Trainingsrunde wird gewertet (die Eingabefolge wird akzeptiert), wenn die Angriffstaste mindestens zweimal gedrückt wurde und die letzte Eingabe ein Schritt nach vorn (v) ist.', { before: 80, justify: true }),
    D.sub('e', 'Untersuchen Sie, inwieweit Zustände des Automaten T zusammengefasst werden können, ohne seine Funktionalität einzuschränken. Geben Sie den Zustandsgraphen des vereinfachten Automaten an.' + be(5)),
    D.p('Der Controller-Treiber übersetzt die Eingaben mithilfe des Mealy-Automaten M (Abbildung 3) in Aktionen der Spielfigur. Das Ausgabealphabet ist Ω = {d, s, a, W} mit d = ducken, s = Schritt, a = einfacher Angriff, W = Wirbelwind.', { before: 80, justify: true }),
    D.sub('f', 'Geben Sie die Ausgabe von M für die Eingabefolge uvAvuvA an. Beschreiben Sie Gemeinsamkeiten und Unterschiede der Automaten W und M. Erläutern Sie, warum M mit drei Zuständen auskommt, während W vier Zustände benötigt.' + be(5)),
    D.p('Nach einem Wirbelwind braucht die Spielfigur eine Pause: Das nächste Drücken der Angriffstaste nach einem Wirbelwind bewirkt nichts (keine Ausgabe), Stickbewegungen werden weiterhin ausgeführt. Danach arbeitet der Treiber wie bisher.', { before: 80, justify: true }),
    D.sub('g', 'Verändern Sie den Mealy-Automaten M so, dass er diese Pause umsetzt.' + be(3)),
    D.pageBreak(),
    D.h2('Material'),
    D.p('Σ = {u, v, A}', { size: 21 }),
    D.img(IMG + 'boss_W.png', { widthCm: 13.5, caption: 'Abbildung 1: Zustandsgraph des Automaten W' }),
    D.img(IMG + 'boss_T.png', { widthCm: 12.5, caption: 'Abbildung 2: Zustandsgraph des Automaten T (Trainingsmodus)' }),
    D.small(HINT, { align: 'center', after: 200 }),
    D.p('Σ = {u, v, A},  Ω = {d, s, a, W}', { size: 21 }),
    D.img(IMG + 'boss_M.png', { widthCm: 11.5, caption: 'Abbildung 3: Mealy-Automat M (Controller-Treiber)' }),
  ];
  return D.save(D.doc({ kind: 'Boss-Level', niveau: 'alle', title: TITLE, subtitle: SUB, metaText: 'Welt A · Endliche Automaten', rightNote: `ca. 75 min · ${SUM} BE`, code: 'Boss-Level A · Aufgabe', body }), OUT + 'BossLevel_A_Endliche-Automaten.docx');
}

// =====================================================================================  Erwartungshorizont
async function eh() {
  const head = (k) => { const p = PARTS.find((x) => x[0] === k); return D.h3(`${p[0]})  ${p[3]}  –  ${p[1]} BE · AFB ${p[2]}`); };
  const pw = W.pairs;
  const body = [
    D.p('Der Erwartungshorizont beschreibt die erwartete Leistung. Gleichwertige, fachlich korrekte Lösungen (andere Zustandsnamen, andere unterscheidende Wörter, andere Darstellungsform) werden ebenso bewertet.', { size: 20 }),
    ...D.table([
      ['Teil', 'Anforderung', 'BE', 'AFB'],
      ...PARTS.map((p) => [p[0] + ')', p[3], String(p[1]), p[2]]),
      ['', '**Summe**', `**${SUM}**`, ''],
    ], { widthsCm: [1.4, 11.6, 1.8, 2.6], size: 19, center: [0, 2, 3] }),
    head('a'),
    ...D.bullets([
      `uuvA: ${W.paths.uuvA} ⇒ S3 ist Endzustand, die Eingabe wird akzeptiert (Wirbelwind). (1 BE)`,
      `uvuA: ${W.paths.uvuA} ⇒ S0 ist kein Endzustand, die Eingabe wird abgelehnt. (1 BE)`,
    ]),
    head('b'),
    ...D.bullets([
      'Der Automat ist genau dann in S2, wenn die letzten beiden Eingaben u und v waren (und noch kein Wirbelwind ausgelöst wurde): Zwei Drittel der Kombination sind eingegeben, ein A würde den Wirbelwind auslösen. (1 BE, AFB I)',
      'Ein u in S2 bricht die laufende Kombination ab, kann aber selbst der Beginn einer neuen Kombination u, v, A sein. Der Automat muss sich also „zuletzt u“ merken – das ist S1. (1 BE)',
      'Gegenbeispiel bei Übergang nach S0: Die Eingabe uvuvA würde abgelehnt (S0 –u→ S1 –v→ S2 –u→ S0 –v→ S0 –A→ S0), obwohl sie auf uvA endet. (1 BE, AFB II)',
    ]),
    head('c'),
    ...D.bullets([
      'Die Eingabefolgen ε, u, uv und uvA sind paarweise unterscheidbar. Daher muss sich jeder solche Automat nach ihnen in vier verschiedenen Zuständen befinden. (1 BE)',
      `Unterscheidende Wörter (je Paar): ε/u: \`${pw['|u']}\` · ε/uv: \`${pw['|uv']}\` · u/uv: \`${pw['u|uv']}\` · ε/uvA, u/uvA, uv/uvA: ε (uvA wird akzeptiert, die anderen nicht). Beispiel: u + A = uA wird abgelehnt, uv + A = uvA akzeptiert. (2 BE)`,
      'Hinweis: Ein Automat mit vier Zuständen (Abbildung 1) belegt nur, dass vier Zustände genügen – für „mindestens“ ist die Unterscheidbarkeit nötig.',
    ]),
    head('d'),
    D.img(IMG + 'boss_D.png', { widthCm: 12.5, caption: 'Möglicher Automat: S1 „zuletzt u oder v“, S2 „zuletzt uv oder vv“, S3 „Wirbelwind“' }),
    ...D.bullets([
      'Bewertung: Zustände mit sinnvoller Bedeutung (1 BE), korrekte Übergänge zum Endzustand (1 BE), korrekte Rücksprünge – insbesondere S2 –v→ S2 (vv bleibt „zwei passende Zeichen“) und S3 –u, v→ S1 (1 BE), Vollständigkeit / Start- und Endzustand (1 BE).',
      'Der Automat wurde gegen die Regel für alle Eingaben bis Länge 8 geprüft; er ist minimal (vier Zustände).',
    ]),
    head('e'),
    ...D.bullets([
      'S5 ist der einzige Endzustand und daher von allen anderen Zuständen unterscheidbar (Wort ε). (1 BE)',
      `S0 (noch kein A) ist von S1, S2 unterscheidbar durch \`${TT.dist['S0|S1']}\` und von S3, S4 durch \`${TT.dist['S0|S3']}\`. S1, S2 (genau ein A) sind von S3, S4 (mindestens zwei A) durch \`${TT.dist['S1|S3']}\` unterscheidbar. (1 BE)`,
      'S1 und S2 sind äquivalent: Beide bedeuten „genau ein A gedrückt“; ob die letzte Eingabe A oder ein Stick war, ist ohne Bedeutung, denn akzeptiert werden kann erst nach einem weiteren A. Beide gehen mit A nach S3, mit u und v nach S2. (1 BE)',
      'S3 und S4 sind äquivalent: Beide bedeuten „mindestens zwei A, letzte Eingabe nicht v“. Beide gehen mit A nach S3, mit u nach S4 und mit v nach S5. (1 BE)',
      'Alternativ: Markierungsverfahren (Dreieckstabelle unten). Vereinfachter Automat mit vier Zuständen (1 BE):',
    ]),
    D.img(IMG + 'boss_T_tabelle.png', { widthCm: 5.4, caption: 'Markierungsverfahren für T: frei bleiben (S1, S2) und (S3, S4)' }),
    D.img(IMG + 'boss_T_min.png', { widthCm: 11.5, caption: 'Vereinfachter Automat: {S1, S2} → S1, {S3, S4} → S3' }),
    head('f'),
    ...D.bullets([
      `Ausgabe: **${M.uvAvuvA.out}** (${M.uvAvuvA.steps}). (1 BE, AFB I)`,
      'Gemeinsamkeiten: gleiches Eingabealphabet, endlich viele Zustände, Startzustand S0, deterministisch, vollständig. Unterschiede: M hat ein Ausgabealphabet und liefert bei jedem Übergang eine Ausgabe; M hat keine Endzustände, W liefert nur „akzeptiert/abgelehnt“ am Ende. (2 BE)',
      'W muss den ausgelösten Wirbelwind als Zustand speichern (Endzustand S3), denn die Akzeptanz hängt vom Zustand nach dem letzten Zeichen ab. M gibt W direkt beim Übergang S2 –A / W→ aus. Danach verhält sich der Automat wie in S0 (in W hat S3 dieselben Übergänge wie S0, unterscheidet sich nur als Endzustand) – S3 und S0 fallen also bei M zusammen. (2 BE, AFB II)',
    ]),
    head('g'),
    D.img(IMG + 'boss_M2.png', { widthCm: 12.5, caption: 'Veränderter Mealy-Automat mit Pausenzustand S3' }),
    ...D.bullets([
      'Neuer Zustand S3 „Pause aktiv“: S2 –A / W→ S3 (statt nach S0). (1 BE)',
      'In S3: u / d und v / s (Stickbewegungen werden ausgeführt, Zustand bleibt S3); A / ε → S0 (Angriff wird ignoriert, Pause endet). (2 BE)',
      `Kontrolle (Code): \`uvAAA\` → \`${M2.uvAAA}\`; \`uvAuvAA\` → \`${M2.uvAuvAA}\` – auch ein während der Pause eingegebenes u, v, A löst keinen Wirbelwind aus, weil das A die Pause beendet.`,
    ]),
    D.h2('Selbsteinschätzung'),
    ...D.table([
      ['Erreichte BE', 'Einschätzung', 'Nächster Schritt'],
      ['21–25', 'Boss besiegt! Welt A sicher gemeistert.', 'Weiter in Welt B; als Extra: Original Abi 2024 eA B (Nachschreibtermin) a–c.'],
      ['14–20', 'Boss besiegt – mit Schrammen.', 'Teilaufgaben mit Punktverlust nachbearbeiten; passende Merkblätter (M01–M04) wiederholen.'],
      ['0–13', 'Der Boss war diesmal stärker.', 'Fehler mit dem Erwartungshorizont analysieren, App-Module Minimierer und Mealy-Maschine wiederholen, Fragen in Level 7 stellen.'],
    ], { widthsCm: [2.6, 6.0, 8.8], size: 19 }),
  ];
  return D.save(D.doc({ kind: 'Erwartungshorizont', niveau: 'alle', title: TITLE, subtitle: 'Erwartungshorizont mit BE und Anforderungsbereichen – zur Selbstkontrolle', metaText: 'Welt A · Endliche Automaten', rightNote: `${SUM} BE`, code: 'Boss-Level A · Erwartungshorizont', body }), OUT + 'BossLevel_A_Erwartungshorizont.docx');
}

(async () => {
  console.log(await aufgabe());
  console.log(await eh());
})();
