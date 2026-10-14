const __MAT = require('path').resolve(__dirname, '../..'); // Wurzel: materials/
// M06 – Merkblatt „NEA – Nichtdeterminismus“ (Level 8)
const D = require((__MAT + '/lib/docstyle.js'));
const J = require((__MAT + '/content/ds08/ds08.json'));
const IMG = (__MAT + '/build/img/ds08/');
const OUT = (__MAT + '/out/');

(async () => {
  const body = [
    D.h2('1  DEA und NEA im Vergleich'),
    D.table([
      ['', 'DEA (deterministisch)', 'NEA (nichtdeterministisch)'],
      ['Folgezustände', 'zu jedem Zustand und Zeichen **genau einer**', 'beliebig viele – auch **keiner**'],
      ['ε-Übergänge', 'nicht erlaubt', 'erlaubt: Zustandswechsel **ohne** Lesen eines Zeichens'],
      ['Verarbeitung', 'eine Zustandsfolge', 'viele mögliche Wege – Simulation mit der **Menge aktiver Zustände**'],
      ['Akzeptanz', 'Zustand nach dem letzten Zeichen ist Endzustand', 'es gibt **mindestens einen** Weg, der nach dem letzten Zeichen in einem Endzustand endet'],
      ['formal', 'δ: Q × Σ → Q', 'δ: Q × (Σ ∪ {ε}) → Teilmengen von Q'],
    ], { widthsCm: [3.2, 6.6, 7.6], size: 19, firstColBold: true }),
    ...D.warn({ titel: 'ε ist kein Eingabezeichen', fallen: ['P2'] }, [D.p('ε bezeichnet das **leere Wort**. Es gehört **nicht** zum Eingabealphabet Σ. Ein ε-Übergang wird ausgeführt, ohne dass ein Zeichen gelesen wird.', { size: 20 })]),
    D.h2('2  Verarbeitung darstellen (Menge aktiver Zustände)'),
    D.img(IMG + 'lol_nea.png', { widthCm: 9.5, caption: 'NEA „enthält LOL“, Σ = {L, O, X}: In S0 „rät“ der Automat bei L, ob hier LOL beginnt.' }),
    D.p(`**LLOL:**  \`${J.lol.LLOL[1]}\`  – S3 ist aktiv, also akzeptiert.`, { size: 20 }),
    D.p(`**LOOL:**  \`${J.lol.LOOL[1]}\`  – kein Endzustand aktiv, also abgelehnt.`, { size: 20 }),
    ...D.numbered([
      'Startmenge: Startzustand **plus** alle Zustände, die von dort über ε-Übergänge erreichbar sind (ε-Hülle).',
      'Für jedes Zeichen: von **jedem** aktiven Zustand **allen** passenden Pfeilen folgen; danach wieder die ε-Hülle bilden.',
      'Leere Menge ∅: Alle Wege sind gescheitert – das bleibt bis zum Ende so.',
      'Am Ende: Enthält die Menge einen Endzustand? Dann wird die Eingabe akzeptiert.',
    ], { ref: 'numbers', size: 20 }),
    D.h2('3  NEA und DEA sind gleich mächtig'),
    D.p('Zu jedem NEA gibt es einen DEA, der **dieselbe Sprache** erkennt (und umgekehrt: jeder DEA ist schon ein NEA). Ein NEA ist oft **kleiner** und **leichter zu entwerfen**, ein DEA leichter zu simulieren.', { size: 20 }),
    D.table([
      [[D.p('**Teilmengenkonstruktion**', { size: 20, color: D.C.teal }), ...D.numbered([
        'DEA-Startzustand = Startmenge (mit ε-Hülle).',
        'Für jede neue Menge und jedes Zeichen die Folgemenge bestimmen (Tabelle).',
        'Wiederholen, bis keine neue Menge entsteht.',
        'DEA-Endzustände = alle Mengen, die einen NEA-Endzustand enthalten.',
      ], { ref: 'numbers2', size: 19 })],
      [...D.img(IMG + 'endet_ab_dea.png', { widthCm: 6.6 }), D.small('Beispiel „endet auf ab“: NEA S0 –a→ S1 –b→ S2 (Schleife a, b in S0) wird zum DEA mit 3 Zuständen.', { align: 'center' })]],
    ], { widthsCm: [9.0, 8.4], header: false }),
    D.p('Preis: Aus n NEA-Zuständen können bis zu 2^n^ DEA-Zustände werden (z. B. „drittletztes Zeichen ist 1“: NEA 4, DEA 8 Zustände).', { size: 19, color: D.C.muted }),
    D.h2('4  Wozu brauchen wir das?'),
    ...D.bullets([
      '**Kellerautomaten (Level 9–10)** sind nichtdeterministisch: Abitur-Akzeptanzdefinition „Eine Eingabe wird genau dann akzeptiert, wenn es eine Möglichkeit gibt, dass sich der Automat nach vollständiger Verarbeitung der Eingabe in einem Endzustand befindet.“',
      '**Reguläre Grammatiken (Level 12)** lassen sich direkt in einen NEA übersetzen.',
      '**Entwurfstrick ODER:** Mit ε-Übergängen aus dem Start in zwei Teilautomaten entsteht ein Automat für „Bedingung 1 **oder** Bedingung 2“.',
    ], { size: 20 }),
    ...D.tip('Satzbausteine', [D.p('„Nach dem Lesen von … sind die Zustände {…} aktiv.“  ·  „Da nach dem letzten Zeichen mit S3 ein Endzustand aktiv ist, gibt es einen akzeptierenden Weg; die Eingabe wird akzeptiert.“  ·  „Der ε-Übergang ermöglicht, dass das Vorzeichen fehlen darf.“', { size: 20 })]),
  ];
  const f = await D.save(D.doc({ kind: 'MB', niveau: 'plus', title: 'NEA – Nichtdeterminismus', subtitle: 'Merkblatt M06 · Level 8 · Raten erlaubt', metaText: 'M06  ·  Welt B', code: 'M06 · Merkblatt NEA', body }), OUT + 'M06_Merkblatt_NEA.docx');
  console.log(f);
})();
