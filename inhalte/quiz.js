// Level-Quiz (#/quiz): Exit-Tickets je Welt (A–D) und Mini-Exit-Tickets je Doppelstunde (DS01–DS16).
// Deep-Links: #/quiz?welt=A|B|C|D, #/quiz?ds=1…16
// Fachlich nach PLAN.md Abschnitt 1 (Notation 2025): F = Endzustände, ε kein Eingabezeichen, Mealy ohne Endzustände,
// NKA-Akzeptanz über Endzustand nach vollständiger Eingabe, Kellernotation (Kellerzeichen, Eingabe) : Ablage, rechts zuerst.
//
// Fragetypen:
//   mc         { typ:'mc', frage, optionen:[…] }           – die ERSTE Option ist richtig (wird gemischt), erklaerung optional
//   wf         { typ:'wf', aussage, wahr:true|false, begruendungen:[…] } – erste Begründung richtig (wird gemischt)
//   zuordnung  { typ:'zuordnung', frage, paare:[[links, rechts], …] } – rechts wird per Auswahl zugeordnet

const mc = (frage, optionen, erklaerung = null) => ({ typ: 'mc', frage, optionen, erklaerung });
const wf = (aussage, wahr, begruendungen) => ({ typ: 'wf', aussage, wahr, begruendungen });
const zu = (frage, paare) => ({ typ: 'zuordnung', frage, paare });

export const QUIZ_WELTEN = {
  A: {
    titel: 'Welt A: Endliche Automaten', levels: [1, 2, 3, 4, 5, 6],
    fragen: [
      mc('Wie lautet die formale Definition eines DEA?', [
        'A = (Q, Σ, δ, S0, F) mit F = Menge der Endzustände und δ: Q × Σ → Q',
        'A = (Q, Σ, δ, S0, E) mit E = Menge der Eingaben',
        'A = (Q, Σ, Γ, δ, S0, #, F) mit Kelleralphabet Γ',
        'A = (Σ, Ω, δ, S0) mit Ausgabealphabet Ω',
      ], 'F bezeichnet die Endzustände; δ ordnet jedem Paar (Zustand, Eingabezeichen) genau einen Folgezustand zu.'),
      wf('Das leere Wort ε gehört zum Eingabealphabet Σ.', false, [
        'ε ist das leere Wort (Länge 0), kein Zeichen – Σ enthält nur Zeichen.',
        'ε gehört dazu, weil jeder Automat das leere Wort lesen kann.',
        'ε gehört nur bei NEAs zum Eingabealphabet.',
      ]),
      mc('Ein DEA akzeptiert ein Wort genau dann, wenn …', [
        '… er sich nach dem Lesen des gesamten Wortes in einem Endzustand befindet.',
        '… er irgendwann während des Lesens einen Endzustand durchläuft.',
        '… er das Wort ohne Fehlerzustand zu Ende liest.',
        '… das Wort mindestens ein Zeichen aus Σ enthält.',
      ]),
      mc('Was bedeutet der Hinweis „Alle nicht eingezeichneten Übergänge führen in einen Fehlerzustand“?', [
        'Der Automat ist vollständig; der Fehlerzustand wurde nur zur Übersicht weggelassen. Von dort gibt es keinen Weg zurück.',
        'Der Automat ist unvollständig und deshalb kein DEA.',
        'Fehlende Übergänge bedeuten, dass das Wort akzeptiert wird.',
        'Der Automat bleibt bei fehlenden Übergängen einfach im aktuellen Zustand.',
      ]),
      mc('Ein DEA für „gerade Anzahl a UND endet auf b“ über {a, b}: Was muss sich der Automat gleichzeitig merken?', [
        'Parität der a-Anzahl und ob das letzte Zeichen ein b war – also Paare von Erinnerungen (Produkt).',
        'Nur die Anzahl der a, denn das b am Ende ergibt sich automatisch.',
        'Die gesamte bisherige Eingabe.',
        'Nur das letzte gelesene Zeichen.',
      ]),
      mc('Wann sind zwei Zustände eines DEA unterscheidbar?', [
        'Wenn es ein Wort gibt, das von dem einen in einen Endzustand und von dem anderen in einen Nicht-Endzustand führt.',
        'Wenn sie verschiedene Namen haben.',
        'Wenn sie im Graphen nicht benachbart sind.',
        'Wenn genau einer von beiden der Startzustand ist.',
      ]),
      mc('Im Markierungsverfahren werden im ersten Schritt alle Paare markiert, …', [
        '… bei denen genau ein Zustand ein Endzustand ist.',
        '… bei denen beide Zustände Endzustände sind.',
        '… die einen Übergang mit demselben Zeichen haben.',
        '… die den Startzustand enthalten.',
      ]),
      wf('Ein Mealy-Automat hat wie ein DEA Endzustände.', false, [
        'Mealy-Automaten haben nur einen Startzustand; sie erzeugen Ausgaben, statt Wörter zu akzeptieren.',
        'Mealy-Automaten haben Endzustände, aber keinen Startzustand.',
        'Nur vollständige Mealy-Automaten haben Endzustände.',
      ]),
      mc('Wie wird eine Kante eines Mealy-Automaten beschriftet?', [
        'Eingabezeichen / Ausgabe, z. B. „a / A“; leere Ausgabe als ε.',
        'Ausgabe / Eingabezeichen, z. B. „A / a“.',
        '(Kellerzeichen, Eingabezeichen) : Ablage',
        'Nur mit dem Eingabezeichen – die Ausgabe steht im Zustand.',
      ]),
      zu('Ordne die Bausteine der Automatenentwicklung zu.', [
        ['Teilwort „aa“ enthalten', 'Zustände für „wie viel vom Teilwort schon gesehen“, Endzustand bleibt'],
        ['Anzahl a durch 3 teilbar', 'Zustände für Rest 0, 1, 2 (zählen modulo 3)'],
        ['Komplement einer Sprache', 'End- und Nicht-Endzustände tauschen (vorher vervollständigen)'],
        ['Zwei Bedingungen gleichzeitig', 'Zustände als Paare von Erinnerungen (Produkt)'],
      ]),
    ],
  },
  B: {
    titel: 'Welt B: Grenzen & Keller', levels: [7, 8, 9, 10],
    fragen: [
      mc('Warum kann kein DEA die Sprache {aⁿbⁿ | n ≥ 1} erkennen?', [
        'Mit k Zuständen landen von den k + 1 Präfixen a, aa, …, aᵏ⁺¹ zwei im selben Zustand; nach derselben Fortsetzung bⁱ antwortet er gleich – Widerspruch.',
        'Weil ein DEA keine b lesen kann, nachdem er a gelesen hat.',
        'Weil die Sprache unendlich viele Wörter hat.',
        'Weil ein DEA nur Wörter bis zur Länge k lesen kann.',
      ]),
      wf('Ein endlicher Automat kann prüfen, ob ein Wort höchstens drei b enthält.', true, [
        'Beschränktes Zählen (bis 3) geht mit endlich vielen Zuständen – nur unbeschränktes Zählen nicht.',
        'Er kann es nicht, weil Zählen immer einen Keller braucht.',
        'Er kann es nur, wenn das Wort kürzer als 3 ist.',
      ]),
      mc('Wann akzeptiert ein NEA ein Wort?', [
        'Wenn es mindestens einen Weg durch den Graphen gibt, der nach dem Lesen des Wortes in einem Endzustand endet.',
        'Wenn alle möglichen Wege in einem Endzustand enden.',
        'Wenn der Automat nie in einem Zustand mit mehreren Möglichkeiten ist.',
        'Wenn das Wort mindestens einen ε-Übergang benutzt.',
      ]),
      wf('NEA und DEA erkennen dieselbe Klasse von Sprachen.', true, [
        'Die Teilmengenkonstruktion übersetzt jeden NEA in einen DEA – Nichtdeterminismus macht Automaten bequemer, aber nicht mächtiger.',
        'NEAs erkennen mehr Sprachen, weil sie raten dürfen.',
        'DEAs erkennen mehr Sprachen, weil sie eindeutig sind.',
      ]),
      mc('Was bedeutet die Kantenbeschriftung (#, a) : A# beim Kellerautomaten?', [
        'Oberstes Kellerzeichen # wird entfernt, Eingabezeichen a gelesen, danach # und darauf A abgelegt (A liegt oben).',
        'A wird entfernt, a gelesen, # abgelegt.',
        'Zuerst a auf den Keller legen, dann # und A lesen.',
        'Der Keller wird geleert und mit A# neu belegt.',
      ]),
      mc('Wann akzeptiert ein Kellerautomat (NKA) eine Eingabe?', [
        'Wenn es eine Möglichkeit gibt, dass er sich nach vollständiger Verarbeitung der Eingabe in einem Endzustand befindet.',
        'Genau dann, wenn der Keller am Ende leer ist.',
        'Wenn das Vorbelegungszeichen # irgendwann entfernt wurde.',
        'Wenn er die Eingabe liest, ohne ε-Übergänge zu benutzen.',
      ]),
      mc('Was bedeutet (A, b) : ε?', [
        'A wird vom Keller entfernt, b gelesen, nichts abgelegt.',
        'Das leere Wort wird auf den Keller gelegt.',
        'A bleibt liegen, b wird ignoriert.',
        'Der Übergang ist nur möglich, wenn der Keller leer ist.',
      ]),
      mc('In der Verarbeitungstabelle (Abi-Format) steht in der Spalte „Belegung Kellerspeicher“ …', [
        '… der gesamte Kellerinhalt, das oberste Zeichen links.',
        '… nur das oberste Kellerzeichen.',
        '… der gesamte Kellerinhalt, das oberste Zeichen rechts.',
        '… die Anzahl der Kellerzeichen.',
      ]),
      wf('Für Palindrome der Form w wᴿ braucht ein Kellerautomat Nichtdeterminismus.', true, [
        'Er muss die Mitte „raten“ (ε-Übergang), weil er sie beim Lesen nicht erkennen kann.',
        'Palindrome lassen sich gar nicht mit einem Kellerautomaten erkennen.',
        'Er braucht ihn nicht, weil er die Eingabe zweimal lesen darf.',
      ]),
      mc('Welche Sprache kann auch ein Kellerautomat nicht erkennen?', [
        'aⁿbⁿcⁿ – ein Keller kann nur einen Vergleich „abarbeiten“.',
        'aⁿbⁿ',
        'korrekt geklammerte Ausdrücke',
        'Wörter mit gleich vielen a wie b',
      ]),
    ],
  },
  C: {
    titel: 'Welt C: Formale Sprachen', levels: [11, 12, 13, 14],
    fragen: [
      mc('Woraus besteht eine Grammatik G = (N, T, S, P)?', [
        'Nichtterminale N, Terminale T, Startsymbol S, Produktionsregeln P',
        'Namen N, Text T, Sprache S, Programm P',
        'Zustände N, Übergänge T, Startzustand S, Endzustände P',
        'Nichtterminale N, Terminale T, Satz S, Punkt P',
      ]),
      mc('Welche Regelformen hat eine rechtsreguläre Grammatik?', [
        'A → aB, A → a und A → ε (a Terminal, B Nichtterminal)',
        'A → aBb und A → ε',
        'A → Ba und A → a',
        'A → AB und A → a',
      ]),
      mc('Welche Regel ist NICHT rechtsregulär?', [
        'S → aSb',
        'S → aS',
        'S → a',
        'S → ε',
      ], 'Bei S → aSb steht das Nichtterminal nicht ganz rechts – die Regel ist kontextfrei, aber nicht rechtsregulär.'),
      mc('Wie wird aus dem DEA-Übergang S1 –b→ S2 eine Grammatikregel?', [
        'S1 → bS2',
        'S2 → bS1',
        'S1 → S2b',
        'b → S1S2',
      ]),
      mc('Ein Endzustand S2 wird bei der Übersetzung DEA → Grammatik zu …', [
        'einer Regel S2 → ε.',
        'dem Startsymbol.',
        'einem Terminal.',
        'einer Regel S2 → S2.',
      ]),
      wf('Die Grammatik S → 1A, A → 0A | 1A | +1A | ε ist nicht rechtsregulär – also ist ihre Sprache nicht regulär.', false, [
        'Die Form der Grammatik sagt nichts über die Sprache: Hier ist die Sprache regulär (ein DEA existiert), die Grammatik nur nicht in rechtsregulärer Form.',
        'Richtig, weil jede nicht rechtsreguläre Grammatik eine kontextfreie, nicht reguläre Sprache erzeugt.',
        'Richtig, weil +1 ein mehrstelliges Terminal ist.',
      ]),
      mc('Wie wird eine Ableitung notiert?', [
        'S ⇒ aSb ⇒ aaSbb ⇒ aaabbb',
        'S → aSb → aaSbb → aaabbb',
        'S = aSb = aaSbb = aaabbb',
        'S ⊢ aSb ⊢ aaSbb ⊢ aaabbb',
      ], '→ steht in den Regeln, ⇒ für einen Ableitungsschritt.'),
      mc('Wann heißt eine Grammatik mehrdeutig?', [
        'Wenn es für ein Wort zwei verschiedene Ableitungsbäume gibt (z. B. dangling else).',
        'Wenn eine Regel mehrere Alternativen hat.',
        'Wenn sie ein Wort auf verschiedenen Wegen in verschiedenen Reihenfolgen ableitet.',
        'Wenn sie mehr als ein Nichtterminal hat.',
      ]),
      zu('Ordne Sprachtyp, Maschine und Grammatik zu.', [
        ['Typ 3 (regulär)', 'DEA/NEA – rechtsreguläre Grammatik'],
        ['Typ 2 (kontextfrei)', 'Kellerautomat – kontextfreie Grammatik'],
        ['Typ 0 (aufzählbar)', 'Turingmaschine'],
        ['endliche Sprache', 'immer regulär – DEA reicht'],
      ]),
      mc('Welcher Unterschied zwischen formalen und natürlichen Sprachen stimmt?', [
        'Formale Sprachen sind durch feste Regeln vollständig definiert; natürliche Sprachen haben Ausnahmen, Wandel und Mehrdeutigkeit.',
        'Natürliche Sprachen haben keine Syntax.',
        'Formale Sprachen haben immer unendlich viele Wörter, natürliche nicht.',
        'In formalen Sprachen gibt es keine Nichtterminale.',
      ]),
    ],
  },
  D: {
    titel: 'Welt D: Sprachdesign & Ausblick', levels: [15, 16],
    fragen: [
      mc('Woraus besteht ein Übergang einer Turingmaschine?', [
        '(Zustand, gelesenes Zeichen) → (Folgezustand, geschriebenes Zeichen, Bewegung L/R/N)',
        '(Zustand, Eingabezeichen) → Folgezustand',
        '(Kellerzeichen, Eingabezeichen) : Ablage',
        'Eingabezeichen / Ausgabezeichen',
      ]),
      mc('Was unterscheidet die Turingmaschine vom Kellerautomaten?', [
        'Sie darf auf ihrem unbegrenzten Band an jeder Stelle lesen UND schreiben und sich in beide Richtungen bewegen.',
        'Sie hat mehr Zustände.',
        'Sie liest die Eingabe mehrmals von vorn, ohne etwas zu verändern.',
        'Sie hat zwei Keller statt einem.',
      ]),
      wf('Eine Turingmaschine kann aⁿbⁿcⁿ erkennen.', true, [
        'Sie markiert in jeder Runde je ein a, b und c und läuft zurück – das Band ist ihr Gedächtnis.',
        'Nein, aⁿbⁿcⁿ kann keine Maschine erkennen.',
        'Nur, wenn n kleiner als die Anzahl der Zustände ist.',
      ]),
      mc('Was besagt die Church-Turing-These?', [
        'Alles, was überhaupt (mechanisch) berechenbar ist, kann eine Turingmaschine berechnen.',
        'Jede Turingmaschine hält nach endlich vielen Schritten.',
        'Turingmaschinen sind schneller als Computer.',
        'Jede Sprache ist von einer Turingmaschine entscheidbar.',
      ]),
      mc('Was sagt das Halteproblem?', [
        'Es gibt kein Programm, das für jedes Programm und jede Eingabe korrekt entscheidet, ob es anhält.',
        'Jedes Programm hält irgendwann an.',
        'Man kann für jedes Programm berechnen, wie lange es läuft.',
        'Turingmaschinen können nicht anhalten.',
      ]),
      mc('Beim Entwurf einer eigenen Sprache: Wann reicht eine rechtsreguläre Grammatik?', [
        'Wenn die Sprache ohne unbeschränktes Zählen oder Verschachteln beschrieben werden kann – dann gibt es auch einen DEA.',
        'Immer, denn jede Sprache ist regulär.',
        'Nur, wenn die Sprache endlich viele Wörter hat.',
        'Nie, denn Grammatiken sind immer kontextfrei.',
      ]),
      mc('Der Fleißige Biber mit 3 Zuständen …', [
        '… schreibt auf dem leeren Band maximal 6 Einsen und hält dann.',
        '… läuft unendlich lange.',
        '… erkennt die Sprache aⁿbⁿcⁿ.',
        '… ist der kleinste Automat für Binär + 1.',
      ]),
      zu('Welche Maschine passt zur Aufgabe?', [
        ['Syntaxprüfung einer regulären Befehlssprache', 'DEA'],
        ['Übersetzer, der Befehle in Ausgaben umwandelt', 'Mealy-Automat'],
        ['Prüfung verschachtelter Klammern', 'Kellerautomat'],
        ['Erkennen von aⁿbⁿcⁿ', 'Turingmaschine'],
      ]),
      wf('Im Abitur gilt: Kellerautomaten akzeptieren über den Endzustand – nicht über den leeren Keller.', true, [
        'Nach den Ergänzenden Hinweisen 2025 wird akzeptiert, wenn der Automat nach vollständiger Eingabe in einem Endzustand sein kann.',
        'Falsch, akzeptiert wird nur bei leerem Keller.',
        'Falsch, beide Bedingungen müssen gleichzeitig gelten.',
      ]),
    ],
  },
};

// Mini-Exit-Tickets je Doppelstunde (3 Fragen)
export const QUIZ_DS = {
  1: { titel: 'DS01 – Ein Automat hört zu', fragen: [
    mc('Welche Bestandteile hat ein DEA mindestens?', ['Zustände, Eingabealphabet, Übergänge, Startzustand, Endzustände', 'Zustände und Ausgaben', 'Band, Kopf, Programm', 'Keller, Zustände, Vorbelegungszeichen']),
    mc('Wie wird der Startzustand im Zustandsgraphen gekennzeichnet?', ['Mit einem Pfeil „Start“', 'Mit einem Doppelkreis', 'Mit einem Quadrat', 'Mit dem Buchstaben E']),
    wf('Der Automat „enthält LOL“ bleibt nach dem Erkennen von LOL im Endzustand, egal was noch kommt.', true, ['Hat das Wort LOL einmal enthalten, bleibt das so – der Endzustand hat Schleifen für alle Zeichen.', 'Nein, jedes weitere Zeichen führt in den Fehlerzustand.', 'Nein, er springt bei jedem L zurück zum Start.']),
  ] },
  2: { titel: 'DS02 – Was macht dieser Automat?', fragen: [
    mc('Was bedeutet ein Zustand im Sachzusammenhang?', ['Was der Automat sich über die bisher gelesene Eingabe „gemerkt“ hat', 'Welches Zeichen als Nächstes kommt', 'Wie viele Zeichen das Wort insgesamt hat', 'Ob das Wort akzeptiert wird']),
    mc('Σ* bezeichnet …', ['… die Menge aller Wörter über Σ, einschließlich ε.', '… die Menge aller akzeptierten Wörter.', '… das längste Wort über Σ.', '… die Menge der Endzustände.']),
    mc('In der Übergangstabelle eines DEA steht in Zeile S1, Spalte b …', ['… der Folgezustand δ(S1, b).', '… ob S1 ein Endzustand ist.', '… die Ausgabe bei b.', '… das Kellerzeichen.']),
  ] },
  3: { titel: 'DS03 – Bauplan gesucht', fragen: [
    mc('Erster Schritt beim Entwickeln eines DEA:', ['Überlegen, was sich der Automat merken muss (Erinnerungen → Zustände)', 'Alle Wörter der Sprache aufschreiben', 'Die Endzustände raten', 'Den Fehlerzustand zeichnen']),
    mc('Für „Anzahl a durch 3 teilbar“ braucht ein minimaler DEA …', ['3 Zustände (Rest 0, 1, 2)', '2 Zustände', '4 Zustände plus Fehlerzustand', 'unendlich viele Zustände']),
    mc('Welche Grenzfälle testest du immer?', ['Das leere Wort ε und sehr kurze Wörter', 'Nur sehr lange Wörter', 'Nur Wörter, die akzeptiert werden', 'Wörter mit Zeichen außerhalb von Σ']),
  ] },
  4: { titel: 'DS04 – Modellierungswerkstatt', fragen: [
    mc('Beim Bug-Bounty findest du ein Wort, das der Automat akzeptiert, obwohl es nicht zur Sprache gehört. Das ist …', ['… ein Gegenbeispiel, das einen Modellierungsfehler belegt.', '… ein Zeichen, dass die Sprache falsch ist.', '… normal bei nichtdeterministischen Automaten.', '… kein Fehler, solange der Automat vollständig ist.']),
    mc('Ein typischer Modellierungsfehler ist …', ['… ein fehlender Übergang ohne Hinweis auf den Fehlerzustand.', '… ein Automat mit mehr als fünf Zuständen.', '… ein Startzustand, der auch Endzustand ist.', '… eine Schleife am Endzustand.']),
    mc('Beim Mann–Wolf–Ziege–Kohlkopf-Automaten ist ein Zustand …', ['… eine Belegung der beiden Ufer.', '… eine Überfahrt.', '… die Anzahl der Überfahrten.', '… das Boot.']),
  ] },
  5: { titel: 'DS05 – Weniger ist mehr', fragen: [
    mc('Zwei Zustände können zusammengefasst werden, wenn …', ['… kein Wort sie unterscheidet (beide führen bei jedem Wort zum selben Ergebnis).', '… sie dieselben eingehenden Übergänge haben.', '… beide Endzustände sind.', '… sie im Graphen nebeneinander liegen.']),
    mc('„Begründen Sie, dass mindestens 3 Zustände nötig sind.“ Welche Argumentation passt?', ['Drei Präfixe angeben, die paarweise unterscheidbar sind (jeweils ein Wort, das sie trennt).', 'Den Automaten zeichnen und die Zustände zählen.', 'Zeigen, dass die Sprache unendlich ist.', 'Zeigen, dass der Automat vollständig ist.']),
    wf('Nach dem Markierungsverfahren bilden unmarkierte Paare äquivalente Zustände.', true, ['Unmarkiert heißt: Kein Wort unterscheidet sie – sie werden zu einem Zustand zusammengefasst.', 'Nein, unmarkierte Paare werden gelöscht.', 'Nein, markierte Paare werden zusammengefasst.']),
  ] },
  6: { titel: 'DS06 – Automaten, die antworten', fragen: [
    mc('Ein Mealy-Automat wird angegeben durch …', ['Eingabealphabet Σ, Ausgabealphabet Ω und einen vollständigen Übergangsgraphen mit Beschriftung „Eingabe / Ausgabe“.', 'Σ, Endzustände und Übergangstabelle.', 'Γ, # und Endzustände.', 'nur den Zustandsgraphen ohne Beschriftung.']),
    mc('Die Kantenbeschriftung „b / AB“ bedeutet:', ['Bei Eingabe b wird das Wort AB ausgegeben.', 'Bei Eingabe AB wird b ausgegeben.', 'b und AB sind beide Eingaben.', 'Die Kante ist nur mit Keller möglich.']),
    wf('Für jeden festen Preis lässt sich ein Getränkeautomat mit Rückgeld als Mealy-Automat modellieren.', true, ['Ja – die Zustandsanzahl wächst mit dem Preis (ein Zustand je bisher bezahltem Betrag); nur ein unbeschränkter Betrag geht nicht.', 'Nein, Mealy-Automaten können kein Rückgeld ausgeben.', 'Nein, dafür braucht man Endzustände.']),
  ] },
  7: { titel: 'DS07 – Der Automat stößt an Grenzen', fragen: [
    mc('Das Schubfachprinzip im Beweis besagt:', ['k + 1 Präfixe auf k Zustände – zwei landen im selben Zustand.', 'Jeder Zustand kann nur ein Wort speichern.', 'Ein DEA hat höchstens k Übergänge.', 'Zwei Wörter derselben Länge landen immer im selben Zustand.']),
    mc('Welche Sprache ist regulär?', ['Wörter mit höchstens zwei b', 'aⁿbⁿ (n ≥ 1)', 'korrekt geklammerte Ausdrücke', 'Wörter mit gleich vielen O wie X']),
    mc('Letzter Schritt des 5-Schritte-Arguments:', ['Widerspruch: Der Automat müsste aⁱbⁱ und aʲbⁱ gleich behandeln – eines gehört dazu, das andere nicht.', 'Der Automat wird minimiert.', 'Man fügt einen Zustand hinzu.', 'Man zeigt, dass ε akzeptiert wird.']),
  ] },
  8: { titel: 'DS08 – Raten erlaubt', fragen: [
    mc('Ein NEA darf im Unterschied zum DEA …', ['… für ein Zeichen mehrere (oder keine) Folgezustände haben und ε-Übergänge benutzen.', '… Zeichen überspringen, die nicht zu Σ gehören.', '… Endzustände weglassen.', '… Zeichen auf ein Band schreiben.']),
    wf('Ein ε-Übergang liest das Zeichen ε aus der Eingabe.', false, ['ε ist kein Eingabezeichen – ein ε-Übergang wechselt den Zustand, ohne etwas zu lesen.', 'Richtig, ε steht am Anfang jedes Wortes.', 'Richtig, aber nur bei DEAs.']),
    mc('Bei der Simulation eines NEA verfolgt man …', ['… die Menge aller gerade aktiven Zustände.', '… nur den zuerst gewählten Weg.', '… den Keller.', '… die Ausgaben.']),
  ] },
  9: { titel: 'DS09 – Der Automat bekommt ein Gedächtnis', fragen: [
    mc('Welche Bestandteile hat ein Kellerautomat zusätzlich zum DEA?', ['Kelleralphabet Γ, Vorbelegungszeichen # und einen Kellerspeicher (Stapel, LIFO).', 'Ausgabealphabet Ω.', 'Ein beidseitig unendliches Band.', 'Mehrere Startzustände.']),
    mc('Nach dem Übergang (#, a) : A# liegt oben auf dem Keller …', ['A (das rechts notierte Zeichen # wurde zuerst abgelegt).', '# (das rechts notierte Zeichen wird zuletzt abgelegt).', 'a.', 'nichts – der Keller ist leer.']),
    mc('Erste Zeile der Verarbeitungstabelle:', ['S0 | # | – | –', 'S0 | ε | # | a', 'S0 | – | – | #', '# | S0 | – | –']),
  ] },
  10: { titel: 'DS10 – Keller-Profis', fragen: [
    mc('Ein DKA (deterministischer Kellerautomat) …', ['… hat für jede Situation (Zustand, Kellerzeichen, Eingabe) höchstens eine Möglichkeit.', '… hat keinen Keller.', '… akzeptiert über den leeren Keller.', '… darf keine ε-Übergänge haben.']),
    mc('Was erläutert man bei „Bedeutung des Kellerspeichers im Sachzusammenhang“?', ['Was die Kellerzeichen inhaltlich zählen oder speichern (z. B. „jedes A steht für ein noch offenes a“).', 'Wie groß der Keller maximal wird.', 'Welche Zustände Endzustände sind.', 'Wie viele Übergänge der Automat hat.']),
    mc('Welche Sprache ist kontextfrei, aber nicht regulär?', ['Palindrome über {0, 1}', 'Wörter, die auf 01 enden', 'aⁿbⁿcⁿ', 'Binärzahlen durch 3 teilbar']),
  ] },
  11: { titel: 'DS11 – Sprache: natürlich oder formal?', fragen: [
    mc('Eine Grammatik erzeugt ein Wort, wenn …', ['… es sich vom Startsymbol durch Regelanwendungen ableiten lässt und nur aus Terminalen besteht.', '… es nur aus Nichtterminalen besteht.', '… es in der Regelliste vorkommt.', '… es kürzer als die längste Regel ist.']),
    mc('„Der Maus trinkt Nüsse.“ ist nach der Mini-Deutsch-Grammatik ableitbar, aber falsch. Das zeigt:', ['Die Grammatik erzeugt zu viel: „Der Maus“ verletzt die Genus-Kongruenz (Grammatik verfeinern), „trinkt Nüsse“ ist dagegen ein Bedeutungsproblem (Semantik).', 'Grammatiken funktionieren nicht für Deutsch.', 'Das Wort gehört nicht zu Σ*.', 'Die Grammatik ist mehrdeutig.']),
    mc('Nichtterminale werden notiert als …', ['Großbuchstaben (z. B. S, A), Terminale als Kleinbuchstaben, Ziffern, Sonderzeichen.', 'Kleinbuchstaben.', 'Zahlen.', 'Pfeile.']),
  ] },
  12: { titel: 'DS12 – Grammatik trifft Automat', fragen: [
    mc('Übersetzungsrezept DEA → rechtsreguläre Grammatik: Zustand entspricht …', ['… Nichtterminal; Startzustand = Startsymbol; Si –a→ Sj wird Si → aSj; Endzustand Si wird Si → ε.', '… Terminal.', '… Regel.', '… Alternative.']),
    mc('Welche Grammatik ist rechtsregulär?', ['S → aS | bA, A → b | ε', 'S → aSb | ε', 'S → SS | a', 'S → Sa | a']),
    wf('Jede reguläre Sprache lässt sich durch eine rechtsreguläre Grammatik erzeugen.', true, ['DEA und rechtsreguläre Grammatik lassen sich ineinander übersetzen.', 'Nein, nur endliche Sprachen.', 'Nein, reguläre Sprachen brauchen kontextfreie Grammatiken.']),
  ] },
  13: { titel: 'DS13 – Klammern, Spiegel, Programme', fragen: [
    mc('Welche Grammatik erzeugt genau {aⁿbⁿ | n ≥ 1}?', ['S → aSb | ab', 'S → aS | bS | ε', 'S → aSb | ε', 'S → ab | ba']),
    mc('Das dangling-else-Problem bedeutet:', ['Für if p then if q then a else b gibt es zwei Ableitungsbäume – die Grammatik ist mehrdeutig.', 'else darf nie ohne if stehen.', 'Die Grammatik ist nicht kontextfrei.', 'Das Programm hält nicht an.']),
    mc('Zu jeder kontextfreien Grammatik gibt es …', ['… einen Kellerautomaten, der dieselbe Sprache erkennt.', '… einen DEA, der dieselbe Sprache erkennt.', '… genau einen Ableitungsbaum pro Wort.', '… eine rechtsreguläre Grammatik.']),
  ] },
  14: { titel: 'DS14 – Die Landkarte der Sprachen', fragen: [
    zu('Ordne zu.', [['regulär', 'DEA / rechtsreguläre Grammatik'], ['kontextfrei', 'Kellerautomat / kontextfreie Grammatik'], ['aⁿbⁿcⁿ', 'Turingmaschine']]),
    wf('Jede reguläre Sprache ist auch kontextfrei.', true, ['Die Sprachklassen sind ineinander geschachtelt: Typ 3 ⊂ Typ 2 ⊂ Typ 1 ⊂ Typ 0.', 'Nein, regulär und kontextfrei schließen sich aus.', 'Nein, nur unendliche reguläre Sprachen sind kontextfrei.']),
    mc('„Wählen Sie eine möglichst spezielle Grammatik“ heißt:', ['Wenn die Sprache regulär ist, eine rechtsreguläre Grammatik angeben – nicht unnötig kontextfreie Regeln.', 'Möglichst wenige Regeln verwenden.', 'Immer eine kontextfreie Grammatik angeben.', 'Nur Terminale verwenden.']),
  ] },
  15: { titel: 'DS15 – Sprachdesign-Studio', fragen: [
    mc('Zum Lieferumfang eures Sprachprojekts gehört …', ['Beschreibung mit Beispielwörtern, Grammatik (begründet regulär/kontextfrei), Automat zur Syntaxprüfung, Mealy-Übersetzer und eine Abi-artige Aufgabe mit Erwartungshorizont.', 'nur ein Automat.', 'ein Programm in Python.', 'nur Beispielwörter.']),
    mc('Welchen Operator benutzt du für „Zeichnen Sie den Zustandsgraphen“?', ['zeichnen / grafisch darstellen', 'beurteilen', 'erörtern', 'abschätzen']),
    mc('Eure Sprache braucht verschachtelte Blöcke. Welcher Automat prüft die Syntax?', ['Kellerautomat (NKA/DKA)', 'DEA', 'Mealy-Automat', 'NEA ohne ε-Übergänge']),
  ] },
  16: { titel: 'DS16 – Ausblick: Die Turingmaschine', fragen: [
    mc('Eine Turingmaschine hat …', ['… ein unbegrenztes Band, einen Schreib-Lese-Kopf und Übergänge mit Schreiben und Bewegung.', '… einen Keller und ein Eingabeband.', '… nur ein Eingabeband zum Lesen.', '… Ausgabezeichen an den Kanten.']),
    mc('Die Church-Turing-These sagt:', ['Jede berechenbare Funktion ist von einer Turingmaschine berechenbar.', 'Jede Turingmaschine hält.', 'Alle Sprachen sind entscheidbar.', 'Turingmaschinen sind so schnell wie Computer.']),
    wf('Ein ausreichend cleveres Programm könnte für jedes Programm und jede Eingabe entscheiden, ob es anhält.', false, ['Das Halteproblem ist unentscheidbar: Kein Algorithmus schafft es für alle Programme – für einzelne Programme kann man es trotzdem oft sehen.', 'Richtig, man muss das Programm nur lange genug laufen lassen.', 'Richtig, nur bei Programmen mit Schleifen ist es unmöglich.']),
  ] },
};

/**
 * Fallen P1–P10 je Quizfrage (app/js/data/fallen.js, Liste freigegeben am 14.10.2026), in der Reihenfolge der Fragen.
 * Leer = die Frage übt keine der zehn Abitur-Fallen (z. B. Turingmaschine, Halteproblem, Begriffe).
 * Fließt ins Fallen-Profil der Lehrkraft ein: Eine im ersten Durchgang falsch beantwortete Frage zählt bei ihren Fallen.
 */
export const QUIZ_FALLEN = {
  welt: {
    A: [['P1'], [], ['P2'], ['P1'], ['P3'], ['P4'], ['P4'], ['P5'], ['P5'], ['P3']],
    B: [['P6'], ['P6'], ['P2'], [], ['P7'], ['P2'], ['P7'], ['P8'], ['P2'], ['P6']],
    C: [['P9'], ['P9'], ['P9'], ['P9'], ['P9'], ['P6'], ['P9'], ['P9'], ['P6'], []],
    D: [[], [], [], [], [], ['P6'], [], ['P6'], ['P2']],
  },
  ds: {
    1: [['P1'], [], ['P3']],
    2: [['P10'], [], []],
    3: [['P3'], [], ['P3']],
    4: [['P3'], ['P1'], ['P10']],
    5: [['P4'], ['P4'], ['P4']],
    6: [['P5', 'P1'], ['P5'], ['P6']],
    7: [['P6'], ['P6'], ['P6']],
    8: [[], ['P2'], ['P2']],
    9: [[], ['P7'], ['P8']],
    10: [[], ['P10'], ['P6']],
    11: [['P9'], ['P3'], ['P9']],
    12: [['P9'], ['P9'], []],
    13: [['P3'], ['P9'], []],
    14: [['P6'], ['P6'], ['P6']],
    15: [[], ['P10'], ['P6']],
    16: [[], [], []],
  },
};
