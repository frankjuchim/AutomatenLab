const __MAT = require('path').resolve(__dirname, '../..'); // Wurzel: materials/
// Inhalte der Erklärvideo-Reihe: je Video Steckbrief + Segmente (Ablaufplan) + Folien.
// Segment: { s: Sekunden, szene: 'F' (Folien + Kamera) | 'L' (AutomatenLab + Seitenleiste), kapitel, inhalt, sprech: [...], slides: [d => …], lab: [{ route, tun }] }
// Alle Automaten/Grammatiken/Läufe sind in automata_video.py verifiziert (video_data.json).
const J = require((__MAT + '/build/img/video/video_data.json'));
const V = (__MAT + '/build/img/video/');
const I = (ds, f) => `${__MAT}/build/img/${ds}/${f}`;
const FEHLER = 'Alle nicht eingezeichneten Übergänge führen in einen Fehlerzustand.';
const mealySteps = (st) => 'S0 ' + st.map(([p, a, o, q]) => `–${a}/${o}→ ${q}`).join(' ');
const pdaRows = (w) => J.v5[w].rows;
const HEAD = ['Zustand', 'Belegung Kellerspeicher', 'oberstes Kellersymbol', 'verarbeitetes Eingabezeichen'];
const COLW = [1.45, 2.55, 2.2, 2.4];

// --------------------------------------------------------------------------------------------- V1
const v1 = {
  id: 'V1', file: 'V1_DEA-lesen', title: 'Wie ein Automat ein Wort prüft', short: 'DEA lesen',
  level: 'Level 1–2', mb: 'M01', kurs: 'gA + eA', einsatz: 'nach Level 1 (Nacharbeit) oder vor Level 2',
  ziel: 'Bestandteile eines DEA benennen, Zustandsfolgen darstellen, Akzeptanz begründen, Fehlerzustand-Hinweis kennen, Sprache beschreiben.',
  material: 'Folien V1, AutomatenLab (Akzeptor-Arena „LOL“, Sprach-Detektiv Fall 1), Merkblatt M01',
  achtung: ['Akzeptanz immer mit Begründung: „…, da S3 ein Endzustand ist.“', 'Zustandsfolge in der Abi-Schreibweise S0 –L→ S1 … (nicht nur die Zustände aufzählen).', 'Bei der Arena „Ohne Zeitlimit üben“ anhaken – sonst wird es hektisch.'],
  frage: 'Wie entscheidet eine Maschine mit nur vier „Erinnerungen“, ob in einem Chat LOL vorkommt?',
  segs: [
    { s: 25, szene: 'F', kapitel: 'Einstieg', inhalt: 'Hook: Alltagsautomaten prüfen Eingaben Zeichen für Zeichen. Ziel des Videos nennen.',
      sprech: ['„Passwortprüfung, Barcode-Scanner, Getränkeautomat – alle prüfen Eingaben Zeichen für Zeichen und merken sich dabei erstaunlich wenig.“', '„In sechs Minuten kannst du jeden DEA lesen – und für jedes Wort sagen: akzeptiert oder nicht, und warum.“'],
      slides: [(d) => d.title({ title: v1.title, frage: v1.frage })] },
    { s: 60, szene: 'F', kapitel: 'Bausteine eines DEA', inhalt: 'LOL-Erkenner: Σ, Zustände, Start-/Endzustand, Übergänge. Zustände als Erinnerungen deuten.',
      sprech: ['Mauszeiger/Laserpointer: Start-Pfeil, Doppelkreis, ein Übergang zeigen.', '„Jeder Zustand ist eine Erinnerung: S1 heißt ‚zuletzt habe ich ein L gesehen‘.“', 'Deterministisch: aus jedem Zustand für jedes Zeichen genau ein Pfeil.'],
      slides: [
        (d) => d.main({ title: 'Der LOL-Erkenner', sigma: 'Σ = {L, O, X}', img: V + 'lol.png', caption: 'Akzeptiert alle Wörter, in denen LOL vorkommt.', rail: { head: 'Bausteine', items: ['**Σ** Eingabealphabet', '**Zustände** S0 … S3', '**Start**: Pfeil „Start“', '**Endzustand**: Doppelkreis', '**Übergang**: Pfeil mit Zeichen'], size: 18 } }),
        (d) => d.table({ title: 'Jeder Zustand ist eine Erinnerung', rows: [['Zustand', 'Der Automat weiß …'], ['S0', 'noch kein Anfang von LOL'], ['S1', 'zuletzt ein L gelesen'], ['S2', 'zuletzt LO gelesen'], ['S3', 'LOL kommt vor – das bleibt so']], colW: [1.6, 7.0], size: 22, rail: { head: 'Merke', lines: ['Ein DEA merkt sich **nicht** das ganze Wort – nur das, was für die Entscheidung wichtig ist.'] } }),
      ] },
    { s: 80, szene: 'F', kapitel: 'Ein Wort verarbeiten', inhalt: 'XLOL Schritt für Schritt (Folienwechsel = Animation), dann Gegenbeispiel LOOL; Akzeptanzregel.',
      sprech: ['Pro Folie ein Zeichen: „Ich lese X – aus S0 gibt es einen X-Pfeil zurück nach S0.“', '„Nach dem letzten Zeichen bin ich in S3 – ein Endzustand – also akzeptiert.“', 'LOOL: „Das zweite O zerstört den Anfang – zurück nach S0.“'],
      slides: [
        ...['S0', 'S0', 'S1', 'S2', 'S3'].map((q, k) => (d) => d.main({ title: k === 0 ? 'Wir lesen XLOL' : `Zeichen ${k}: ${'XLOL'[k - 1]}`, img: V + `lol_xlol_${k}.png`, rail: { head: 'Eingabe', word: ['X', 'L', 'O', 'L'], pos: k - 1, lines: [`Zustand: **${q}**`, k === 4 ? '**S3 ist Endzustand ⇒ akzeptiert**' : k === 0 ? 'Start in S0' : ''] } })),
        (d) => d.main({ title: 'Akzeptiert oder abgelehnt?', items: [`**XLOL:** ${J.v1.XLOL.path} ⇒ **akzeptiert**, da S3 ein Endzustand ist.`, `**LOOL:** ${J.v1.LOOL.path} ⇒ **abgelehnt**, da S1 kein Endzustand ist.`], size: 23, rail: { head: 'Merke', tone: 'ocker', lines: ['**Akzeptiert** ⇔ nach dem **letzten** Zeichen in einem **Endzustand**.'] } }),
      ] },
    { s: 50, szene: 'F', kapitel: 'Der Fehlerzustand', inhalt: 'Kaffeeautomat 40 ct: fehlende Pfeile führen in den Fehlerzustand; Hinweis-Satz aus dem Abitur.',
      sprech: ['„20 + 10 + 20 wären 50 ct – aus S3 gibt es keinen 20-Pfeil.“', '„Im Abi steht dann: Alle nicht eingezeichneten Übergänge führen in einen Fehlerzustand. Wenn du ihn weglässt, schreib diesen Satz dazu.“'],
      slides: [
        (d) => d.main({ title: 'Und wenn ein Pfeil fehlt?', sigma: 'Kaffee 40 ct · Münzen 10 ct und 20 ct · nur passend', img: V + 'kaffee.png', imgBox: { x: 0.6, y: 1.95, w: 8.6, h: 3.0 }, below: { lines: ['20 10 20:  S0 –20→ S2 –10→ S3 –20→ **?**   (kein Pfeil mit 20 aus S3)'], h: 0.9 }, rail: { head: 'Kaffeeautomat', lines: ['S0 … S4 = 0, 10, 20, 30, 40 ct', 'S4: genau 40 ct ⇒ Endzustand'], size: 18 } }),
        (d) => d.main({ title: 'Vollständig: mit Fehlerzustand', img: V + 'kaffee_komplett.png', imgBox: { x: 0.6, y: 1.5, w: 8.6, h: 3.6 }, below: { lines: ['Fehlende Pfeile führen in den **Fehlerzustand** – dort bleibt der Automat ⇒ **abgelehnt**.'], h: 0.9 }, rail: { head: 'Abi-Hinweis', tone: 'ocker', lines: ['„' + FEHLER + '“', 'Diesen Satz brauchst du, wenn du den Fehlerzustand weglässt.'], size: 18 } }),
      ] },
    { s: 70, szene: 'L', kapitel: 'Live im AutomatenLab', inhalt: 'Akzeptor-Arena (LOL) 3–4 Wörter laut entscheiden; Sprach-Detektiv Fall 1: Sprache durch Testwörter finden.',
      sprech: ['Arena: „Ohne Zeitlimit üben“ anhaken, Runde starten, laut mitdenken.', 'Detektiv: b, ab, ba, abb testen → Vermutung „endet auf b“ → Antwort wählen.'],
      lab: [{ route: '#/arena?automat=lol', tun: 'Runde starten, Wörter laut entscheiden' }, { route: '#/detektiv?fall=1', tun: 'Testwörter eingeben, Sprache bestimmen' }],
      slides: [(d) => d.live({ route: '#/arena?automat=lol', todo: ['Akzeptor-Arena: Wörter blitzschnell entscheiden', 'Sprach-Detektiv: Welche Sprache erkennt ein unbekannter Automat?'] })] },
    { s: 45, szene: 'F', kapitel: 'Die Sprache beschreiben', inhalt: 'Vorgehen in drei Schritten und Antwortsatz „genau die Wörter, die …“.',
      sprech: ['„Das Wort ‚genau‘ ist wichtig: alle diese Wörter – und keine anderen.“'],
      slides: [(d) => d.main({ title: 'Die Sprache beschreiben', items: ['**1** Kurze Wörter testen: ε, einzelne Zeichen, …', '**2** Muster vermuten', '**3** Mit Beispiel und Gegenbeispiel absichern', 'Antwortsatz: „Der Automat akzeptiert **genau** die Wörter über Σ = {L, O, X}, in denen LOL vorkommt.“'], rail: { head: 'Im Abi', lines: ['„**Beschreiben Sie** die Sprache …“', '„**Untersuchen Sie**, welche Eingaben akzeptiert werden.“'], size: 18 } })] },
    { s: 30, szene: 'F', kapitel: 'Jetzt du', inhalt: 'Pausenaufgabe: drei Wörter entscheiden, danach Auflösung mit Zustandsfolgen.',
      sprech: ['„Halte das Video an und entscheide für jedes Wort – mit Zustandsfolge.“'],
      slides: [
        (d) => d.pause({ task: 'Welche Wörter akzeptiert der LOL-Erkenner?', img: V + 'lol.png', imgH: 2.1, items: ['LOLO', 'LLOXL', 'OLOL'] }),
        (d) => d.solution({ items: ['LOLO', 'LLOXL', 'OLOL'].map((w) => `**${w}:** ${J.v1[w].path} ⇒ ${J.v1[w].acc ? '**akzeptiert**' : '**abgelehnt**'}`), size: 21 }),
      ] },
    { s: 25, szene: 'F', kapitel: 'Zusammenfassung', inhalt: 'Vier Kernsätze, Weiter üben (QR), Merkblatt, nächstes Video.',
      sprech: ['Auf Merkblatt M01 und die Arena verweisen; Ausblick: selbst einen Automaten bauen.'],
      slides: [(d) => d.end({ items: ['Ein DEA liest **Zeichen für Zeichen** und wechselt dabei den Zustand.', 'Jeder Zustand ist eine **Erinnerung**.', '**Akzeptiert**, wenn er nach dem letzten Zeichen in einem Endzustand ist.', 'Fehlende Pfeile ⇒ **Fehlerzustand** (Hinweis-Satz!).'], route: '#/arena?stufe=1', routeText: 'Stufe 1: Wörter entscheiden', merkblatt: 'Merkblatt M01 – Deterministische endliche Automaten', next: 'Video 2: DEA entwickeln in 5 Schritten' })] },
  ],
};

function testSlide(d) {
  const s = d.blank({ title: 'Schritt 5: Testen – der häufigste Fehler' });
  [['Falsch: Neuanfang vergessen', V + 'eab_falsch.png', `aab: ${J.v2.aab_falsch} ⇒ **abgelehnt** ✗`, 'A83232'], ['Richtig', V + 'eab_komplett.png', `aab: ${J.v2.aab_richtig} ⇒ **akzeptiert** ✓`, d.H.teal]].forEach(([head, img, txt, col], i) => {
    const y = 1.45 + i * 2.75;
    d.tb(s, head, { x: d.MAIN.x, y, w: 3.2, h: 0.85, fontSize: 21, bold: true, fontFace: 'Cambria', color: col });
    d.image(s, img, { x: d.MAIN.x + 3.3, y, w: 5.3, h: 2.05 });
    d.tb(s, d.rich(txt, { fontSize: 19 }), { x: d.MAIN.x, y: y + 0.95, w: 3.2, h: 1.6 });
  });
  d.rail(s, { head: 'Testwörter', tone: 'ocker', lines: ['ε und einzelne Zeichen', 'Beispiel + Gegenbeispiel', '**Überlappungen**: aab, abab'] });
  return s;
}
// --------------------------------------------------------------------------------------------- V2
const v2 = {
  id: 'V2', file: 'V2_DEA-entwickeln', title: 'DEA entwickeln in 5 Schritten', short: 'DEA entwickeln',
  level: 'Level 3', mb: 'M02', kurs: 'gA + eA', einsatz: 'vor oder nach Level 3',
  ziel: 'Einen DEA mit dem 5-Schritte-Rezept entwickeln, Zustandsbedeutungen angeben, systematisch testen, den Fehler „Neuanfang vergessen“ vermeiden.',
  material: 'Folien V2, AutomatenLab (Baukasten „Endet auf ab“), Merkblatt M02',
  achtung: ['Live-Demo vorher einmal durchklicken (Übergangstabelle, Start/Endzustand setzen).', 'Die Lösung der Baukasten-Challenge wird im Video gezeigt – in der Stunde eine andere Challenge verwenden.'],
  frage: 'Wie baue ich einen Automaten, der genau die richtigen Wörter akzeptiert – und keinen Fall übersieht?',
  segs: [
    { s: 20, szene: 'F', kapitel: 'Einstieg', inhalt: 'Lesen vs. bauen; Versprechen: Rezept + häufigster Fehler.',
      sprech: ['„Einen Automaten lesen ist das eine – einen selbst bauen das andere. Mit fünf Schritten klappt es fast immer.“'],
      slides: [(d) => d.title({ title: v2.title, frage: v2.frage })] },
    { s: 30, szene: 'F', kapitel: 'Der Auftrag', inhalt: 'Sprache „endet auf ab“ mit Beispielen und Gegenbeispielen; Rezept im Überblick.',
      sprech: ['Beispiele vorlesen; „ε gehört nicht dazu – das leere Wort endet nicht auf ab.“'],
      slides: [(d) => d.main({ title: 'Der Auftrag', items: ['**Entwickle** einen DEA über Σ = {a, b}, der genau die Wörter akzeptiert, die auf **ab** enden.', 'gehören dazu: ab, aab, bab, abab', 'gehören nicht dazu: ε, ba, abb, aba'], rail: { head: 'Das Rezept', lines: ['**1** Erinnerungen sammeln', '**2** Zustände festlegen', '**3** Übergänge eintragen', '**4** Start und Ende', '**5** Testen'] } })] },
    { s: 50, szene: 'F', kapitel: 'Schritt 1 und 2: Erinnerungen', inhalt: 'Was muss sich der Automat merken? Drei Erinnerungen = drei Zustände mit Bedeutung.',
      sprech: ['„Muss ich mir das ganze Wort merken? Nein – nur, wie viel von ab gerade am Ende steht.“', 'Bedeutung jedes Zustands laut formulieren.'],
      slides: [(d) => d.main({ title: 'Schritt 1 + 2: Was muss sich der Automat merken?', img: V + 'eab_schritt2.png', below: { lines: ['**S0**: kein passender Anfang   ·   **S1**: zuletzt a   ·   **S2**: zuletzt ab'], h: 0.9 }, rail: { head: 'Leitfrage', lines: ['Was muss ich über das bisher Gelesene wissen?', '**So wenig wie möglich!**'] } })] },
    { s: 70, szene: 'F', kapitel: 'Schritt 3 und 4: Übergänge, Start und Ende', inhalt: 'Erst Hauptweg, dann jeder Zustand × jedes Zeichen; Start = nichts gelesen, Endzustand = Ziel-Erinnerung.',
      sprech: ['Systematisch fragen: „Ich bin in S1, also zuletzt a. Jetzt kommt noch ein a – was weiß ich dann? Zuletzt a! Also bleibe ich in S1.“', '„Aus S2 mit a: wieder ein möglicher Anfang → S1.“'],
      slides: [
        (d) => d.main({ title: 'Schritt 3: zuerst der Hauptweg', img: V + 'eab_schritt3a.png', rail: { head: 'Hauptweg', lines: ['S0 –a→ S1: jetzt „zuletzt a“', 'S1 –b→ S2: jetzt „zuletzt ab“'] } }),
        (d) => d.main({ title: 'Schritt 3: jeder Zustand, jedes Zeichen', img: V + 'eab_komplett.png', below: { lines: ['**Schritt 4:** Start = „noch nichts gelesen“ = S0   ·   Endzustand = „zuletzt ab“ = S2'], h: 0.9 }, rail: { head: 'Für jeden Pfeil fragen', lines: ['S0 –b→ S0: b ist kein Anfang', 'S1 –a→ **S1**: das neue a ist wieder ein Anfang!', 'S2 –a→ S1,  S2 –b→ S0'], size: 18 } }),
      ] },
    { s: 45, szene: 'F', kapitel: 'Schritt 5: Testen', inhalt: 'Typischer Fehler „Neuanfang vergessen“ am Wort aab; gute Testwörter.',
      sprech: ['„Viele schicken jedes unpassende Zeichen zurück nach S0. Testen wir aab …“', '„Überlappungen sind die besten Testwörter.“'],
      slides: [testSlide] },
    { s: 75, szene: 'L', kapitel: 'Live im Baukasten', inhalt: 'Challenge „Endet auf ab“ im Automaten-Baukasten bauen und testen.',
      sprech: ['Zustände anlegen und Bedeutung sagen, Übergangstabelle füllen, Start/Endzustand setzen.', 'Bewusst erst den Fehler einbauen, mit aab testen, korrigieren.'],
      lab: [{ route: '#/baukasten?aufgabe=endet-ab', tun: 'DEA bauen, mit aab testen' }],
      slides: [(d) => d.live({ route: '#/baukasten?aufgabe=endet-ab', todo: ['Zustände anlegen – Bedeutung nennen', 'Übergangstabelle ausfüllen', 'Start- und Endzustand setzen', 'Testen – auch mit aab!'] })] },
    { s: 40, szene: 'F', kapitel: 'Bausteine für typische Sprachen', inhalt: 'Überblick: Präfix, Teilwort, Endung, Zählen, modulo, Kombination (M02).',
      sprech: ['„Fast jede Abi-Sprache setzt sich aus diesen Bausteinen zusammen.“'],
      slides: [(d) => d.table({ title: 'Bausteine für typische Sprachen', rows: [['Baustein', 'Der Automat merkt sich …', 'Beispiel'], ['Präfix', 'wie viel vom Anfang passt', 'beginnt mit ab'], ['Teilwort', 'wie viel vom Muster passt', 'enthält ab'], ['Endung', 'wie viel vom Muster am Ende steht', 'endet auf ab'], ['Zählen', 'die Anzahl bis n', 'genau zwei a'], ['modulo k', 'den Rest', 'Anzahl a durch 3 teilbar'], ['Kombination', 'ein Paar von Erinnerungen', 'gerade Anzahl a und endet auf b']], colW: [1.9, 3.6, 3.1], size: 19, rail: { head: 'Merkblatt M02', lines: ['Alle Bausteine mit Graph und Beispiel.'] } })] },
    { s: 30, szene: 'F', kapitel: 'Jetzt du', inhalt: 'Pausenaufgabe „enthält bb“, Auflösung mit Graph.',
      sprech: ['„Welche Erinnerungen brauchst du? Tipp: Es sind wieder drei.“'],
      slides: [
        (d) => d.pause({ task: 'Entwickle einen DEA über Σ = {a, b} für alle Wörter, die **bb** enthalten.', items: ['Welche Erinnerungen braucht der Automat?', 'Teste mit abba, bab, abbab.'] }),
        (d) => d.solution({ img: V + 'bb.png', imgH: 2.6, items: ['**S0**: kein b am Ende  ·  **S1**: zuletzt ein b  ·  **S2**: bb gefunden', 'abba ✓   ·   bab ✗   ·   abbab ✓'], rail: { head: 'Baustein', lines: ['Teilwort enthalten: gefunden bleibt gefunden'] } }),
      ] },
    { s: 25, szene: 'F', kapitel: 'Zusammenfassung', inhalt: 'Kernsätze, Weiter üben, Merkblatt M02.', sprech: ['Auf Baukasten Stufe 1 verweisen.'],
      slides: [(d) => d.end({ items: ['Erst **Erinnerungen**, dann Zustände.', 'Für **jeden** Zustand und **jedes** Zeichen genau ein Pfeil.', '**Testen** mit Überlappungen (aab, abab).', 'Unpassendes Zeichen ≠ automatisch zurück nach S0.'], route: '#/baukasten?stufe=1', routeText: 'Baukasten Stufe 1 (Basis)', merkblatt: 'Merkblatt M02 – DEA entwickeln', next: 'Video 3: Mealy-Automaten' })] },
  ],
};

// --------------------------------------------------------------------------------------------- V3
const kartRail = (k) => {
  const st = J.v3['212'].steps.slice(0, k);
  const q = k ? st[k - 1][3] : 'S0';
  const out = st.map((x) => x[2]).filter((o) => o !== 'ε').join('') || 'ε';
  return { head: 'Eingabe', word: ['2', '1', '2'], pos: k - 1, lines: [`Zustand: **${q}**`, `Ausgabe bisher: **${out}**`, k === 3 ? 'Kartoffeln + 1 € zurück' : ''], size: 18 };
};
const v3 = {
  id: 'V3', file: 'V3_Mealy-Automaten', title: 'Mealy-Automaten: Automaten, die antworten', short: 'Mealy-Automaten',
  level: 'Level 6', mb: 'M04', kurs: 'gA + eA', einsatz: 'vor oder nach Level 6',
  ziel: 'Mealy-Notation „e / a“ lesen, Ausgaben bestimmen, DEA und Mealy-Automat vergleichen, typische Fehler (Endzustände) vermeiden.',
  material: 'Folien V3, AutomatenLab (Mealy-Maschine Aufgabe 2, Vorhersage), Merkblatt M04',
  achtung: ['ε bedeutet „keine Ausgabe“ – nicht „leeres Zeichen wird ausgegeben“.', 'Kante S3 → S0 trägt zwei Beschriftungen (1 / K und 2 / K1) – beim Zeigen deutlich machen, welche benutzt wird.'],
  frage: 'Wie wird aus einem Automaten, der nur „ja“ oder „nein“ sagt, eine Maschine mit Ausgabe?',
  segs: [
    { s: 20, szene: 'F', kapitel: 'Einstieg', inhalt: 'Akzeptor sagt nur ja/nein – ein Fahrkartenautomat muss antworten.', sprech: ['„Ein Fahrkartenautomat sagt nicht nur ‚ok‘ – er gibt ein Ticket und Rückgeld aus.“'],
      slides: [(d) => d.title({ title: v3.title, frage: v3.frage })] },
    { s: 55, szene: 'F', kapitel: 'Der Kartoffelautomat', inhalt: 'Σ, Ω, Beschriftung e / a, ε, keine Endzustände; Zustände = bezahlter Betrag.',
      sprech: ['„Links vom Schrägstrich steht, was reinkommt, rechts, was rauskommt.“', '„Es gibt keine Endzustände – das Ergebnis ist die Ausgabe.“'],
      slides: [
        (d) => d.main({ title: 'Der Kartoffelautomat', sigma: 'Σ = {1, 2}  ·  Ω = {1, K}', img: V + 'kart.png', below: { lines: ['Beschriftung **e / a** = Eingabe / Ausgabe  ·  **ε** = keine Ausgabe  ·  **keine Endzustände**'], h: 0.85 }, rail: { head: 'Situation', lines: ['Ein Sack Kartoffeln kostet **4 €**.', 'Münzen: 1 € und 2 €.', '**K** = Kartoffeln, **1** = 1 € zurück'], size: 18 } }),
        (d) => d.table({ title: 'Zustände = bisher bezahlter Betrag', rows: [['Zustand', 'Bedeutung'], ['S0', '0 € – neuer Kunde'], ['S1', '1 € bezahlt'], ['S2', '2 € bezahlt'], ['S3', '3 € bezahlt']], colW: [1.6, 7.0], size: 22, rail: { head: 'Merke', lines: ['Der Zustand speichert, was für die **nächste Ausgabe** wichtig ist.'] } }),
      ] },
    { s: 70, szene: 'F', kapitel: 'Ein Lauf mit Ausgabe', inhalt: 'Eingabe 2 1 2 Schritt für Schritt; Ausgabe K1.',
      sprech: ['„2 € – noch nichts zu tun, Ausgabe ε.“', '„Jetzt sind es 5 €: Kartoffeln und 1 € zurück – Ausgabe K1.“'],
      slides: [0, 1, 2, 3].map((k) => (d) => d.main({ title: k === 0 ? 'Eingabe: 2 1 2' : `Zeichen ${k}: ${'212'[k - 1]}`, img: V + `kart_212_${k}.png`, rail: kartRail(k) })) },
    { s: 40, szene: 'F', kapitel: 'DEA oder Mealy?', inhalt: 'Vergleichstabelle Akzeptor vs. Mealy-Automat.', sprech: ['Zeile für Zeile vergleichen.'],
      slides: [(d) => d.table({ title: 'DEA oder Mealy-Automat?', rows: [['', 'DEA (Akzeptor)', 'Mealy-Automat'], ['Aufgabe', 'entscheidet: gehört das Wort dazu?', 'übersetzt Eingabe in Ausgabe'], ['Beschriftung', 'Zeichen, z. B. a', 'e / a, z. B. 2 / K1'], ['Alphabete', 'Σ', 'Σ und Ω'], ['Endzustände', 'ja (Doppelkreis)', 'keine'], ['Ergebnis', 'akzeptiert / abgelehnt', 'Ausgabewort']], colW: [2.0, 3.3, 3.3], size: 20 })] },
    { s: 75, szene: 'L', kapitel: 'Live: Was kommt raus?', inhalt: 'Mealy-Maschine Aufgabe 2 (Kartoffelautomat): Ausgaben vorhersagen; kurz Bug-Jagd zeigen.',
      sprech: ['Erst vorhersagen, dann prüfen lassen; bei Fehler den Lauf ansehen.'],
      lab: [{ route: '#/mealy?aufgabe=2&modus=vorhersage', tun: 'Ausgaben vorhersagen' }, { route: '#/mealy?aufgabe=2&modus=bugjagd', tun: 'kurz: falsche Kante finden' }],
      slides: [(d) => d.live({ route: '#/mealy?aufgabe=2&modus=vorhersage', todo: ['Ausgabe vorhersagen – dann prüfen', 'Bug-Jagd: fehlerhafte Ausgaben finden'] })] },
    { s: 40, szene: 'F', kapitel: 'Abi-Check', inhalt: 'Operatoren „Ausgabe angeben“ und „Mealy-Automat entwickeln“, typische Fehler.',
      sprech: ['„Im Abi wird oft nach der Ausgabe gefragt – notiere den Lauf mit e / a.“'],
      slides: [(d) => d.main({ title: 'Abi-Check: Mealy-Automaten', items: ['**Geben Sie die Ausgabe an:** Lauf mit e / a notieren, Ausgabe zusammensetzen.', '**Entwickeln Sie einen Mealy-Automaten:** Σ und Ω angeben, **keine Endzustände**, für jedes Eingabezeichen ein Übergang.', '**Typischer Fehler:** Endzustand einzeichnen oder Ausgabe an den Zustand schreiben.'], size: 22, rail: { head: 'Beispiel 1212', lines: [mealySteps(J.v3['1212'].steps), `Ausgabe: **${J.v3['1212'].out}**`], size: 17 } })] },
    { s: 30, szene: 'F', kapitel: 'Jetzt du', inhalt: 'Pausenaufgabe: Ausgaben zu 11111 und 2222.', sprech: ['„Halte an und bestimme beide Ausgaben.“'],
      slides: [
        (d) => d.pause({ task: 'Welche Ausgabe erzeugt der Kartoffelautomat?', img: V + 'kart.png', imgH: 2.1, items: ['1 1 1 1 1', '2 2 2 2'] }),
        (d) => d.solution({ items: ['11111', '2222'].map((w) => `**${w}:** ${mealySteps(J.v3[w].steps)} ⇒ Ausgabe **${J.v3[w].out}**`), size: 21 }),
      ] },
    { s: 25, szene: 'F', kapitel: 'Zusammenfassung', inhalt: 'Kernsätze, Weiter üben, M04.', sprech: ['Ausblick: Was können Automaten nicht?'],
      slides: [(d) => d.end({ items: ['Mealy-Automat = Automat **mit Ausgabe** an jedem Übergang.', 'Beschriftung **e / a**, ε = keine Ausgabe.', '**Keine Endzustände** – das Ergebnis ist das Ausgabewort.', 'Zustand = Erinnerung für die nächste Ausgabe.'], route: '#/mealy?aufgabe=1&modus=vorhersage', routeText: 'Was kommt raus? Aufgabe 1', merkblatt: 'Merkblatt M04 – Mealy-Automaten', next: 'Video 4: Grenzen endlicher Automaten' })] },
  ],
};

// --------------------------------------------------------------------------------------------- V4
const v4 = {
  id: 'V4', file: 'V4_Grenzen', title: 'Grenzen: Was ein endlicher Automat nicht kann', short: 'Grenzen endlicher Automaten',
  level: 'Level 7', mb: 'M05', kurs: 'gA + eA', einsatz: 'nach Level 7 (Sicherung des Schubfach-Arguments)',
  ziel: 'Begründen, warum aⁿbⁿ von keinem DEA erkannt wird (Schubfachprinzip), Kurz- und Langform der Abi-Begründung kennen, entscheiden, wann ein DEA möglich ist.',
  material: 'Folien V4, AutomatenLab (Überliste den Automaten, Stufe 1 und 5), Merkblatt M05',
  achtung: ['„Mein Automat schafft es nicht“ ist kein Beweis – das Argument muss für **jeden** DEA gelten (beliebiges k).', 'Im Lab „Zustand nach jedem Präfix zeigen“ anhaken, damit die Sättigung sichtbar wird.'],
  frage: 'Gibt es Sprachen, für die man **keinen** DEA bauen kann – egal wie viele Zustände er hat?',
  segs: [
    { s: 20, szene: 'F', kapitel: 'Einstieg', inhalt: 'Frage: Gibt es für jede Sprache einen DEA? Ankündigung Beweis mit „Sockenschublade“.',
      sprech: ['„Heute beweisen wir, dass es Sprachen gibt, die kein endlicher Automat erkennt – mit einem Argument aus der Sockenschublade.“'],
      slides: [(d) => d.title({ title: v4.title, frage: v4.frage })] },
    { s: 40, szene: 'F', kapitel: 'Die Sprache aⁿbⁿ', inhalt: 'aⁿbⁿ mit Beispielen; Bezug zu Klammern/HTML.', sprech: ['„Der Automat müsste sich die Anzahl der a merken – und die kann beliebig groß werden.“'],
      slides: [(d) => d.main({ title: 'Die Sprache a^n^b^n^', items: ['L = {a^n^b^n^ | n ≥ 1}: erst n-mal a, dann **genauso oft** b', 'gehören dazu: ab, aabb, aaabbb', 'gehören nicht dazu: aab, abab, ba', 'Steckt überall: Klammern, HTML-Tags, „gleich viele rein wie raus“'], rail: { head: 'Frage', lines: ['Was müsste sich ein Automat merken?', '→ die **Anzahl** der a'] } })] },
    { s: 55, szene: 'F', kapitel: 'Versuch: ein Zähler', inhalt: 'DEA mit 5 Zuständen zählt bis 2; Fehlentscheidungen bei aaabb und aaabbb.',
      sprech: ['„A2 heißt: mindestens zwei a – ab dem dritten a vergisst er mitzuzählen.“', '„Mehr Zustände verschieben das Problem nur.“'],
      slides: [(d) => d.main({ title: 'Versuch: ein Zähler mit 5 Zuständen', img: V + 'zaehler5.png', imgBox: { x: 0.6, y: 1.5, w: 8.6, h: 2.3 }, caption: FEHLER, below: { tone: 'ocker', lines: [`aaabb: ${J.v4.aaabb} ⇒ **akzeptiert**, obwohl aaabb ∉ L`, 'aaabbb: … B0 –b→ Fehlerzustand ⇒ **abgelehnt**, obwohl aaabbb ∈ L'], size: 19, h: 1.4 }, rail: { head: 'Er zählt bis 2', lines: ['A1, A2: ein a bzw. mindestens zwei a', 'B1: noch ein b nötig', 'B0: fertig'], size: 18 } })] },
    { s: 70, szene: 'L', kapitel: 'Live: Überliste den Automaten', inhalt: 'Stufe 1: Präfixe a, aa, aaa beobachten, mit aaabb überlisten; Stufe 5 (21 Zustände) mit einem Wort.',
      sprech: ['„Zustand nach jedem Präfix zeigen“ an; „Ab aa bleibt er in A2 – zwei Präfixe, ein Zustand.“', 'Stufe 5: aaaaaaaaaaabbbbbbbbbb (11 a, 10 b) eingeben.'],
      lab: [{ route: '#/ueberliste?stufe=1', tun: 'Präfixe testen, mit aaabb überlisten' }, { route: '#/ueberliste?stufe=5', tun: 'mit a¹¹b¹⁰ in einem Versuch gewinnen' }],
      slides: [(d) => d.live({ route: '#/ueberliste?stufe=1', todo: ['„Zustand nach jedem Präfix zeigen“ einschalten', 'a, aa, aaa … – wann bleibt der Zustand gleich?', 'Den Automaten mit einem Wort überlisten', 'Stufe 5: 21 Zustände – ein Wort genügt'] })] },
    { s: 80, szene: 'F', kapitel: 'Das Schubfachprinzip', inhalt: 'k Zustände, k + 1 Präfixe ⇒ zwei Präfixe im selben Zustand; Beweis in 5 Schritten.',
      sprech: ['„5 Socken in 4 Schubladen – mindestens eine Schublade hat zwei.“', 'Tabelle Zeile für Zeile; betonen: dieselbe Fortsetzung an beide Präfixe.'],
      slides: [
        (d) => d.two({ title: 'Das Schubfachprinzip', left: { img: I('ds07', 'schubfach.png'), imgH: 4.8 }, right: { items: ['5 Socken, 4 Schubladen ⇒ eine Schublade hat zwei', 'k Zustände, aber **k + 1** Präfixe a, a^2^, …, a^k+1^', '⇒ zwei Präfixe a^i^ und a^j^ (i < j) enden im **selben Zustand**'] }, size: 22 }),
        (d) => d.table({ title: 'Der Beweis in 5 Schritten', rows: [['Schritt', 'Was du tust', 'für a^n^b^n^'], ['1 Annahme', 'DEA mit k Zuständen erkennt L', 'DEA A mit k Zuständen'], ['2 Präfixe', 'k + 1 Präfixe wählen', 'a, a^2^, …, a^k+1^'], ['3 Schubfach', 'zwei Präfixe im selben Zustand', 'a^i^ und a^j^ (i < j)'], ['4 Fortsetzung', 'an beide dieselbe anhängen', 'a^i^b^i^ und a^j^b^i^'], ['5 Widerspruch', 'eins in L, eins nicht – gleiche Antwort', 'a^i^b^i^ ∈ L, a^j^b^i^ ∉ L']], colW: [2.0, 3.6, 3.0], size: 21 }),
      ] },
    { s: 45, szene: 'F', kapitel: 'So schreibst du es im Abi', inhalt: 'Kurzform mit Sachbezug vs. Langform (Musterformulierung M05).',
      sprech: ['„Bei ‚Entscheiden Sie begründet‘ mit wenigen BE reicht die Kurzform – aber immer mit Sachbezug.“'],
      slides: [(d) => d.two({ title: 'Abi: Kurzform oder Langform?', left: { head: 'Kurzform', lines: ['„Ein endlicher Automat hat nur endlich viele Zustände und kann sich nur endlich viele Werte merken. Er müsste sich die Anzahl der a merken, die **beliebig groß** werden kann. Also gibt es keinen DEA.“'] }, right: { head: 'Langform', lines: ['„Begründen Sie, dass kein endlicher Automat …“', '→ Schubfach-Argument: k Zustände, k + 1 Präfixe, gleiche Fortsetzung, Widerspruch.', 'Musterformulierung: M05'] }, size: 19, rail: { head: 'Immer', tone: 'ocker', lines: ['Den **Sachzusammenhang** nennen: Was müsste unbeschränkt gezählt werden?'] } })] },
    { s: 25, szene: 'F', kapitel: 'Was geht – was nicht?', inhalt: 'Tabelle beschränkt vs. unbeschränkt.', sprech: ['„Modulo und Obergrenzen sind kein Problem.“'],
      slides: [(d) => d.table({ title: 'DEA möglich oder nicht?', rows: [['DEA möglich (beschränkt)', 'Kein DEA (unbeschränkt)'], ['Zählen bis zu einer festen Grenze', 'Zählen ohne Grenze'], ['Zählen modulo k (gerade Anzahl a)', 'zwei Anzahlen vergleichen (a^n^b^n^)'], ['endliche Sprachen', 'Palindrome, Klammern beliebiger Tiefe']], colW: [4.3, 4.3], size: 21 })] },
    { s: 30, szene: 'F', kapitel: 'Jetzt du', inhalt: 'Pausenaufgabe: vier Sprachen – DEA ja/nein?', sprech: ['„Kurz begründen: beschränkt oder unbeschränkt?“'],
      slides: [
        (d) => d.pause({ task: 'DEA möglich – ja oder nein?', items: ['Anzahl der a ist gerade', 'gleich viele a wie b', 'höchstens drei a', 'korrekt geklammerte Ausdrücke'] }),
        (d) => d.solution({ items: ['gerade Anzahl a: **ja** (modulo 2, zwei Zustände)', 'gleich viele a wie b: **nein** (Differenz unbeschränkt)', 'höchstens drei a: **ja** (Zählen bis 3, dann Fehlerzustand)', 'Klammern: **nein** (Tiefe unbeschränkt)'] }),
      ] },
    { s: 25, szene: 'F', kapitel: 'Zusammenfassung', inhalt: 'Kernsätze; Ausblick Kellerautomat.', sprech: ['„Was fehlt, ist Gedächtnis – das bekommt der Automat im nächsten Video.“'],
      slides: [(d) => d.end({ items: ['Ein DEA hat **endlich viele** Zustände = endlich viele Erinnerungen.', 'Unbeschränkt zählen oder vergleichen ⇒ **kein DEA**.', 'Beweis: **Schubfachprinzip** (k + 1 Präfixe, k Zustände).', 'Ausweg: mehr Gedächtnis → **Kellerautomat**.'], route: '#/ueberliste?stufe=3', routeText: 'Stufe 3: Der Klammer-Prüfer', merkblatt: 'Merkblatt M05 – Grenzen endlicher Automaten', next: 'Video 5: Kellerautomaten' })] },
  ],
};

// --------------------------------------------------------------------------------------------- V5
function stackOps(d) {
  const s = d.blank({ title: 'Vorher – nachher' });
  const ops = [['(#, a) : A#', '#', 'A#'], ['(A, a) : AA', 'A#', 'AA#'], ['(A, b) : ε', 'AA#', 'A#']];
  const gw = d.MAIN.w / 3;
  ops.forEach(([lab, before, after], i) => {
    const x = d.MAIN.x + i * gw;
    d.card(s, x + 0.08, 1.5, gw - 0.16, 4.5, i % 2 ? 'FFFFFF' : d.H.tealTint2, d.H.tealTint);
    d.tb(s, lab, { x: x + 0.1, y: 1.65, w: gw - 0.2, h: 0.5, align: 'center', fontSize: 22, bold: true, fontFace: 'Consolas', color: d.H.tealDark });
    d.stack(s, before, x + 0.35, 4.6, { w: 0.75, h: 0.55, label: 'vorher', hl: true });
    s.addShape(d.pres.shapes.LINE, { x: x + 1.2, y: 3.75, w: 0.45, h: 0, line: { color: d.H.ocker, width: 2.5, endArrowType: 'triangle' } });
    d.stack(s, after, x + 1.75, 4.6, { w: 0.75, h: 0.55, label: 'nachher' });
    d.tb(s, ['Oben liegt A.', 'Ein A mehr.', 'Ein A weniger.'][i], { x: x + 0.1, y: 5.35, w: gw - 0.2, h: 0.45, align: 'center', fontSize: 19, color: d.H.muted });
  });
  return s;
}
const v5 = {
  id: 'V5', file: 'V5_Kellerautomaten', title: 'Kellerautomaten: Notation und Abi-Tabelle', short: 'Kellerautomaten',
  level: 'Level 9', mb: 'M07', kurs: 'nur eA', einsatz: 'nach Level 9; vor Level 10 wiederholen',
  ziel: 'Kellerautomaten in der Notation der Ergänzenden Hinweise 2025 lesen, die Verarbeitung in der Abi-Tabelle dokumentieren, Akzeptanz über Endzustand begründen.',
  material: 'Folien V5, AutomatenLab (Keller-Labor aⁿbⁿ: Simulator und Tabellen-Trainer), Merkblatt M07',
  achtung: ['Akzeptanz über **Endzustand nach vollständiger Eingabe** – nicht „Keller leer“ (ältere Videos/Unterlagen).', 'Spalte „oberstes Kellersymbol“ = das Zeichen, das der Übergang oben vorfindet (vor dem Schritt).', 'Ablage: rechtes Zeichen zuerst – das linke liegt oben; in der Tabelle steht das oberste Zeichen links.'],
  frage: 'Wie erkennt eine Maschine a^n^b^n^ – und wie dokumentiere ich das im Abi?',
  segs: [
    { s: 20, szene: 'F', kapitel: 'Einstieg', inhalt: 'Rückblick: DEA scheitert an aⁿbⁿ; jetzt mit Stapel als Gedächtnis; Notation 2025.',
      sprech: ['„Im letzten Video ist der DEA an aⁿbⁿ gescheitert. Heute bekommt er einen Stapel als Gedächtnis – in der Notation, die im Abi verlangt wird.“'],
      slides: [(d) => d.title({ title: v5.title, frage: v5.frage })] },
    { s: 40, szene: 'F', kapitel: 'Der Keller', inhalt: 'Stapelprinzip, # als Vorbelegung, Kelleralphabet Γ.', sprech: ['„Wie ein Tellerstapel: Du kommst nur an den obersten Teller.“'],
      slides: [(d) => { const s = d.main({ title: 'Ein Stapel als Gedächtnis', items: ['**Kellerspeicher**: Zugriff nur auf das **oberste** Zeichen', '**#** liegt am Anfang im Keller (Vorbelegung)', '**Γ** = Kelleralphabet, z. B. Γ = {#, A}', 'Pro Schritt: oberstes Zeichen entfernen und eine Zeichenkette ablegen'], size: 22, rail: { head: 'Keller', lines: [''] } }); d.stack(s, 'AA#', d.RAIL.x + 1.3, 4.35, { w: 0.9, h: 0.6, hl: true }); d.tb(s, '← oben', { x: d.RAIL.x + 2.3, y: 2.6, w: 1.1, h: 0.4, fontSize: 16, color: d.H.ocker, bold: true }); return s; }] },
    { s: 70, szene: 'F', kapitel: 'Die Beschriftung', inhalt: '(oberstes Kellerzeichen, Eingabe) : Ablage; Ablage von rechts; push/pop/ε-Übergang mit Vorher-nachher-Bildern.',
      sprech: ['„Ein Übergang fragt zwei Dinge: Was liegt oben? Was lese ich?“', '„Die Ablage A# wird von rechts abgelegt: erst #, dann A – also liegt A oben.“'],
      slides: [
        (d) => d.main({ title: '(oberstes Kellerzeichen, Eingabe) : Ablage', items: ['**(#, a) : A#** – # entfernen, A# ablegen ⇒ A liegt oben', '**(A, a) : AA** – ein weiteres A', '**(A, b) : ε** – A entfernen, nichts ablegen', '**(#, ε) : #** – ohne ein Zeichen zu lesen (ε-Übergang)'], size: 22, rail: { head: 'Ablageregel', tone: 'ocker', lines: ['Die Ablage wird **von rechts** abgelegt.', 'Das **linke** Zeichen liegt danach **oben**.'] } }),
        stackOps,
      ] },
    { s: 35, szene: 'F', kapitel: 'Der Kellerautomat für aⁿbⁿ', inhalt: 'Graph, Σ, Γ, Idee: je a ein A, je b ein A weg, nur # ⇒ S2.', sprech: ['Graph einmal komplett vorlesen.'],
      slides: [(d) => d.main({ title: 'Der Kellerautomat für a^n^b^n^', sigma: 'Σ = {a, b}  ·  Γ = {#, A}  ·  Startzustand S0  ·  Endzustand S2', img: V + 'anbn_pda.png', caption: FEHLER, rail: { head: 'Idee', lines: ['je **a**: ein A ablegen', 'je **b**: ein A entfernen', 'nur noch # ⇒ S2'] } })] },
    { s: 60, szene: 'L', kapitel: 'Live: Simulator', inhalt: 'Keller-Labor aⁿbⁿ, Wort aabb Schritt für Schritt; Keller beobachten.',
      sprech: ['Bei jedem Schritt: Übergang vorlesen, Keller kommentieren.', 'Kurz aab laden: „Wo bleibt er stehen?“'],
      lab: [{ route: '#/keller?automat=anbn&modus=sim&wort=aabb', tun: 'aabb schrittweise simulieren' }],
      slides: [(d) => d.live({ route: '#/keller?automat=anbn&modus=sim&wort=aabb', todo: ['aabb Schritt für Schritt', 'Keller beobachten: A rauf, A runter', 'Was passiert bei aab?'] })] },
    { s: 75, szene: 'F', kapitel: 'Die Abi-Tabelle', inhalt: 'Tabelle für aabb Zeile für Zeile; Regeln: erste Zeile, oberstes links, ε-Zeile, Akzeptanzsatz.',
      sprech: ['„Erste Zeile: S0, nur #, noch nichts gelesen – Striche.“', '„Spalte drei: das Zeichen, das der Übergang oben vorgefunden hat.“', '„Der ε-Übergang bekommt eine eigene Zeile – mit ε als Eingabezeichen.“'],
      slides: [
        (d) => d.table({ title: 'Die Abi-Tabelle: aabb', rows: [HEAD, ...pdaRows('aabb').map((r, i) => (i < 3 ? r : ['', '', '', '']))], colW: COLW, size: 19, hl: [3], rail: { head: 'Regeln', tone: 'ocker', lines: ['Start: S0 | # | – | –', 'Oberstes Zeichen **links**', 'ε-Übergang = eigene Zeile'], size: 18 } }),
        (d) => d.table({ title: 'Die Abi-Tabelle: aabb', rows: [HEAD, ...pdaRows('aabb')], colW: COLW, size: 19, hl: [6], after: { y: 5.75, lines: ['akzeptiert: **ja** – Eingabe vollständig gelesen und Endzustand S2 erreicht.'] }, rail: { head: 'Regeln', tone: 'ocker', lines: ['Start: S0 | # | – | –', 'Oberstes Zeichen **links**', 'ε-Übergang = eigene Zeile'], size: 18 } }),
      ] },
    { s: 30, szene: 'L', kapitel: 'Live: Tabellen-Trainer', inhalt: 'Tabellen-Trainer im Abi-Format, zwei Zeilen selbst ausfüllen.', sprech: ['„Genau dieses Format übst du hier – mit sofortiger Rückmeldung.“'],
      lab: [{ route: '#/keller?automat=anbn&modus=tabelle&wort=aabb', tun: 'zwei Zeilen ausfüllen' }], slides: [] },
    { s: 45, szene: 'F', kapitel: 'Jetzt du: aab', inhalt: 'Pausenaufgabe: Tabelle für aab; Auflösung mit Ablehnungsbegründung.',
      sprech: ['„Achte auf den Schluss: Warum genau wird aab abgelehnt?“'],
      slides: [
        (d) => d.pause({ task: 'Wird **aab** akzeptiert? Erstelle die Tabelle.', img: V + 'anbn_pda.png', imgH: 2.0, items: ['Spalten: Zustand | Belegung Kellerspeicher | oberstes Kellersymbol | verarbeitetes Eingabezeichen'] }),
        (d) => d.table({ title: 'Auflösung: aab', rows: [HEAD, ...pdaRows('aab')], colW: COLW, size: 19, after: { y: 4.4, lines: ['akzeptiert: **nein** – die Eingabe ist gelesen, aber S1 ist kein Endzustand und für (A, ε) gibt es keinen Übergang.'], h: 1.2 }, rail: { head: 'Achtung', tone: 'ocker', lines: ['Akzeptanz über **Endzustand** nach vollständiger Eingabe.', 'Nicht: „Keller leer“.'], size: 18 } }),
      ] },
    { s: 25, szene: 'F', kapitel: 'Zusammenfassung', inhalt: 'Kernsätze, Weiter üben (Tabellen-Trainer Klammern), M07.', sprech: ['Ausblick: Grammatiken – die andere Seite der Sprachen.'],
      slides: [(d) => d.end({ items: ['Übergang: **(oberstes Kellerzeichen, Eingabe) : Ablage**.', 'Ablage von rechts: das **linke** Zeichen liegt oben.', 'Tabelle: Zustand | Belegung | oberstes Kellersymbol | Eingabezeichen.', '**Akzeptiert**: Eingabe ganz gelesen **und** Endzustand.'], route: '#/keller?automat=klammern&modus=tabelle', routeText: 'Tabellen-Trainer: Klammern', merkblatt: 'Merkblatt M07 – Kellerautomaten', next: 'Video 6: Grammatiken' })] },
  ],
};

module.exports = { v1, v2, v3, v4, v5, J, V, I, FEHLER, HEAD, COLW };
