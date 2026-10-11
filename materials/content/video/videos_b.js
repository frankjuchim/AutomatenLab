// Erklärvideos V6–V9 und Extras O1, O2 (Datenformat wie videos.js)
const { J, V, I, FEHLER, HEAD, COLW } = require('./videos.js');
const sp = (s) => s.replace(/ (?=[a-z()])/g, '').replace(/⇒/g, ' ⇒ ').replace(/\s+/g, ' ');

// --------------------------------------------------------------------------------------------- V6
const schaf = J.v6.schaf_rules;
const v6 = {
  id: 'V6', file: 'V6_Grammatiken', title: 'Grammatiken: Wie man eine Sprache erzeugt', short: 'Grammatiken',
  level: 'Level 11', mb: 'M08', kurs: 'nur eA', einsatz: 'nach Level 11',
  ziel: 'Grammatik als 4-Tupel (N, T, Startsymbol, P) angeben, Ableitungen mit ⇒ und Ableitungsbäume erstellen, die erzeugte Sprache beschreiben.',
  material: 'Folien V6, AutomatenLab (Ableitungs-Rallye Aufgabe 1 „Glal“), Merkblatt M08',
  achtung: ['„→“ steht in Regeln, „⇒“ in Ableitungen – nicht verwechseln.', 'Ein Ableitungsschritt = genau eine Regelanwendung.'],
  frage: 'Wie legt man mit wenigen Regeln fest, welche Wörter zu einer Sprache gehören?',
  segs: [
    { s: 20, szene: 'F', kapitel: 'Einstieg', inhalt: 'Perspektivwechsel: Automaten prüfen, Grammatiken erzeugen (Programmiersprachen).',
      sprech: ['„Bisher haben Automaten Wörter geprüft. Jetzt drehen wir den Spieß um: Eine Grammatik erzeugt Wörter – wie die Grammatik einer Programmiersprache.“'],
      slides: [(d) => d.title({ title: v6.title, frage: v6.frage })] },
    { s: 60, szene: 'F', kapitel: 'Mini-Deutsch', inhalt: 'Regeln für einfache Sätze, Ableitung „Das Schaf frisst Möhren .“, Begriffe Nichtterminal/Terminal/Startsymbol/Regel.',
      sprech: ['„Großgeschriebene Platzhalter wie Subjekt werden ersetzt – das sind Nichtterminale. Die echten Wörter bleiben stehen – Terminale.“'],
      slides: [
        (d) => d.main({ title: 'Mini-Deutsch', items: ['Start → Subjekt Prädikat Objekt Punkt', 'Subjekt → Artikel Nomen', 'Artikel → Der | Die | Das', 'Nomen → Hund | Schaf | Ziege | …', 'Prädikat → frisst | trinkt | …', 'Objekt → Wasser | Möhren | …', 'Punkt → .'], size: 21, rail: { head: 'Begriffe', items: ['**Nichtterminal**: wird ersetzt', '**Terminal**: bleibt stehen', '**Startsymbol**: hier beginnt es', '**Regel** A → …'], size: 18 } }),
        (d) => d.main({ title: 'Eine Ableitung', items: schaf.map((r, i) => (i ? '⇒ ' : '') + r[0] + (r[1] ? `     *(${r[1]})*` : '')).map((x) => x), size: 19, rail: { head: 'So geht’s', lines: ['Mit dem Startsymbol beginnen.', 'Pro Schritt **eine** Regel anwenden.', 'Fertig, wenn nur noch Terminale dastehen.'], size: 18 } }),
      ] },
    { s: 50, szene: 'F', kapitel: 'Die formale Schreibweise', inhalt: 'G = (N, T, Startsymbol, P) am Beispiel Glal-Sprache; „|“ als „oder“.',
      sprech: ['„Im Abi gibst du immer alle vier Teile an.“'],
      slides: [(d) => d.main({ title: 'Formal: G = (N, T, S, P)', items: ['N = {S, A, B}   (Nichtterminale)', 'T = {la, le, lu}   (Terminale)', 'Startsymbol: S'], size: 24, below: { lines: ['**P** (Produktionsregeln):', 'S → laA  |  leA  |  luA', 'A → laB  |  leB  |  luB', 'B → lu'], size: 24, h: 2.3 }, rail: { head: 'Lies so', lines: ['„|“ heißt **oder**:', 'S → laA | leA steht für S → laA und S → leA.'] } })] },
    { s: 55, szene: 'F', kapitel: 'Ableitung und Ableitungsbaum', inhalt: 'Ableitung von lelalu mit ⇒; Ableitungsbaum lesen.',
      sprech: ['„Der Baum zeigt dieselbe Ableitung – nur ohne Reihenfolge. Die Blätter von links nach rechts ergeben das Wort.“'],
      slides: [(d) => d.two({ title: 'Ableitung und Ableitungsbaum', left: { head: 'Ableitung', lines: ['S', '⇒ leA', '⇒ lelaB', '⇒ lelalu', '', 'jeder Schritt: **eine** Regel', 'fertig: nur noch Terminale'] }, right: { head: 'Ableitungsbaum', img: I('ds11', 'baum_glal.png'), imgH: 4.6 }, size: 22, rail: { head: 'Baum lesen', lines: ['Wurzel: Startsymbol', 'innen: Nichtterminale', 'Blätter von links nach rechts = Wort'], size: 18 } })] },
    { s: 70, szene: 'L', kapitel: 'Live: Ableitungs-Rallye', inhalt: 'Rallye Aufgabe 1: Zielwort „le la lu“ mit möglichst wenigen Schritten ableiten.',
      sprech: ['Regeln anklicken, dabei laut „ich ersetze das linkeste Nichtterminal …“.', 'Bewusst einmal eine falsche Regel wählen und „Schritt zurück“ zeigen.'],
      lab: [{ route: '#/rallye?aufgabe=1', tun: 'le la lu in 3 Schritten ableiten' }],
      slides: [(d) => d.live({ route: '#/rallye?aufgabe=1', todo: ['Zielwort le la lu ableiten', 'Immer das linkeste Nichtterminal ersetzen', 'Geht es in 3 Schritten?'] })] },
    { s: 40, szene: 'F', kapitel: 'Die Sprache beschreiben', inhalt: 'Wörter sammeln, Muster, Menge angeben; Abi-Operatoren.',
      sprech: ['„Genau 3 · 3 = 9 Wörter – eine endliche Sprache.“'],
      slides: [(d) => d.main({ title: 'Die Sprache beschreiben', items: ['Kurze Wörter ableiten: lalalu, lelalu, lulelu …', 'Muster: **drei Silben**, die letzte ist **lu**', 'L = {xy lu | x, y ∈ {la, le, lu}} – genau 9 Wörter'], size: 23, rail: { head: 'Im Abi', lines: ['**Zeigen Sie**, dass w erzeugt wird → Ableitung', '**Beschreiben Sie** die Sprache → Muster + Menge'], size: 18 } })] },
    { s: 30, szene: 'F', kapitel: 'Jetzt du', inhalt: 'Pausenaufgabe: lalule und lulalu prüfen.', sprech: ['„Mit Ableitung begründen – oder sagen, welche Regel fehlt.“'],
      slides: [
        (d) => d.pause({ task: 'Gehören **lalule** und **lulalu** zur Glal-Sprache?', items: ['S → laA | leA | luA', 'A → laB | leB | luB', 'B → lu'] }),
        (d) => d.solution({ items: ['lalule: **nein** – die letzte Silbe kann nur lu sein (B → lu).', `lulalu: **ja** – ${J.v6_pause.replace(/(?<!⇒) (?!⇒)/g, '')}`] }),
      ] },
    { s: 25, szene: 'F', kapitel: 'Zusammenfassung', inhalt: 'Kernsätze, Weiter üben, M08.', sprech: ['Ausblick: Zusammenhang Grammatik ↔ Automat.'],
      slides: [(d) => d.end({ items: ['Grammatik G = (**N, T, Startsymbol, P**).', 'Ableitung mit **⇒**, jeder Schritt eine Regel.', '**Ableitungsbaum**: Blätter von links nach rechts = Wort.', 'Sprache = alle ableitbaren Wörter aus Terminalen.'], route: '#/rallye?aufgabe=4', routeText: 'Rallye: Mini-Deutsch', merkblatt: 'Merkblatt M08 – Grammatiken', next: 'Video 7: Reguläre Grammatik und Automat' })] },
  ],
};

// --------------------------------------------------------------------------------------------- V7
const v7 = {
  id: 'V7', file: 'V7_Regulaere-Grammatik', title: 'Reguläre Grammatik und endlicher Automat', short: 'Reguläre Grammatik',
  level: 'Level 12', mb: 'M09 (+ M06)', kurs: 'nur eA', einsatz: 'nach Level 12; ersetzt für Pflichtweg den Bonus-Level 8 (NEA) als Kurzfassung',
  ziel: 'Rechtsreguläre Regeln erkennen, DEA in reguläre Grammatik übersetzen und umgekehrt (über NEA), Ableitung als Lauf deuten, Teilmengenkonstruktion im Ergebnis verstehen.',
  material: 'Folien V7, AutomatenLab (Parallelwelten „Endet auf ab“: Simulation und Teilmengen), Merkblatt M09, ggf. M06',
  achtung: ['ε-Regeln für Endzustände nicht vergessen; Fehlerzustand bekommt keine Regeln.', '„Grammatik nicht regulär“ heißt nicht „Sprache nicht regulär“ (siehe Video 9).'],
  frage: 'Wie übersetzt man einen Automaten in eine Grammatik – und zurück?',
  segs: [
    { s: 20, szene: 'F', kapitel: 'Einstieg', inhalt: 'Grammatik und Automat sind ineinander übersetzbar – Abi-Standardaufgabe.', sprech: ['„Zwei Werkzeuge, die nichts miteinander zu tun haben – scheinbar. Heute übersetzen wir eins ins andere.“'],
      slides: [(d) => d.title({ title: v7.title, frage: v7.frage })] },
    { s: 40, szene: 'F', kapitel: 'Rechtsregulär – ja oder nein?', inhalt: 'Regelformen A → aB | a | ε; Gegenbeispiele.', sprech: ['Jede Zeile kurz: „Wo steht das Nichtterminal?“'],
      slides: [(d) => d.table({ title: 'Rechtsregulär – ja oder nein?', rows: [['Regel', 'regulär?', 'Grund'], ['S → aS  |  bA  |  ε', 'ja', 'ein Terminal, ggf. + ein Nichtterminal'], ['S → aSb', 'nein', 'Terminal rechts vom Nichtterminal'], ['S → Sa', 'nein', 'Nichtterminal links'], ['A → +xA', 'nein', 'zwei Terminale'], ['A → BC', 'nein', 'zwei Nichtterminale']], colW: [2.6, 1.3, 4.7], size: 20, rail: { head: 'Erlaubt', tone: 'ocker', lines: ['**A → aB**', '**A → a**', '**A → ε**'], size: 22 } })] },
    { s: 60, szene: 'F', kapitel: 'Vom DEA zur Grammatik', inhalt: 'Übersetzungsrezept am DEA „beginnt mit a, endet auf b“.', sprech: ['Pfeil für Pfeil eine Regel ansagen; Endzustand bekommt ε.'],
      slides: [(d) => d.main({ title: 'Vom DEA zur Grammatik', sigma: 'Σ = {a, b} · ' + FEHLER, img: V + 'duell.png', imgBox: { x: 0.6, y: 1.95, w: 8.6, h: 2.6 }, below: { lines: ['S0 → aS1     S1 → aS1 | bS2     S2 → aS1 | bS2 | ε', 'N = {S0, S1, S2},  T = {a, b},  Startsymbol S0'], h: 1.3 }, rail: { head: 'Rezept', lines: ['Zustand → Nichtterminal', 'Si –a→ Sj → **Si → aSj**', 'Endzustand → **Si → ε**', 'Fehlerzustand entfällt'], size: 18 } })] },
    { s: 35, szene: 'F', kapitel: 'Ableitung = Lauf', inhalt: 'Ableitung von abab parallel zum Lauf.', sprech: ['„Das Nichtterminal am Ende ist genau der Zustand, in dem der Automat gerade ist.“'],
      slides: [(d) => d.two({ title: 'Ableitung = Lauf', left: { head: 'Ableitung', lines: ['S0', '⇒ aS1', '⇒ abS2', '⇒ abaS1', '⇒ ababS2', '⇒ abab'] }, right: { head: 'Lauf im DEA', lines: ['S0', '–a→ S1', '–b→ S2', '–a→ S1', '–b→ S2', 'Endzustand ✓'] }, size: 24, rail: { head: 'Merke', lines: ['Nichtterminal am Ende der Satzform = **aktueller Zustand**.'] } })] },
    { s: 45, szene: 'F', kapitel: 'Grammatik → Automat', inhalt: 'Rückweg; Regel A → a mit neuem Endzustand; Ergebnis nichtdeterministisch.', sprech: ['„Aus S gehen zwei Pfeile mit a – das darf ein DEA nicht. Das ist ein NEA.“'],
      slides: [(d) => d.main({ title: 'Rückweg: von der Grammatik zum Automaten', sigma: 'S → aS | bS | aA      A → b', img: V + 'nea_endet_ab.png', imgBox: { x: 0.6, y: 2.0, w: 8.6, h: 2.6 }, below: { tone: 'ocker', lines: ['Aus S zwei Pfeile mit **a** ⇒ **nichtdeterministisch** (NEA)'], h: 0.9 }, rail: { head: 'Rezept', lines: ['Nichtterminal → Zustand', 'A → aB: Pfeil A –a→ B', 'A → a: Pfeil in **neuen Endzustand** Z', 'A → ε: A wird Endzustand'], size: 17 } })] },
    { s: 40, szene: 'F', kapitel: 'NEA in 40 Sekunden', inhalt: 'NEA: Raten erlaubt, akzeptiert bei mindestens einem Weg; Menge aktiver Zustände.', sprech: ['„Stell dir Spielfiguren vor: Bei jeder Wahl teilt sich die Figur.“'],
      slides: [(d) => d.main({ title: 'NEA: ein Automat, der raten darf', items: ['Mehrere Pfeile mit demselben Zeichen erlaubt', '**Akzeptiert**, wenn es **mindestens einen** Weg in einen Endzustand gibt', 'Vorstellung: Spielfiguren auf **allen** möglichen Zuständen', `aab: ${J.v7.nea_aab} ⇒ Z dabei ⇒ akzeptiert`], size: 22, rail: { head: 'Gut zu wissen', lines: ['NEA und DEA sind **gleich mächtig**.', 'ε ist **kein** Eingabezeichen.'], size: 18 } })] },
    { s: 60, szene: 'L', kapitel: 'Live: Parallelwelten', inhalt: 'NEA „Endet auf ab“: Spielfiguren beim Lesen von aab; Teilmengenkonstruktion kurz zeigen.', sprech: ['Figuren zählen lassen; dann Modus Teilmengen: „Jede Figurenmenge wird ein Zustand.“'],
      lab: [{ route: '#/parallelwelten?aufgabe=2&modus=sim&wort=aab', tun: 'Figuren beobachten' }, { route: '#/parallelwelten?aufgabe=2&modus=teilmengen', tun: 'Teilmengenkonstruktion' }],
      slides: [(d) => d.live({ route: '#/parallelwelten?aufgabe=2&modus=sim&wort=aab', todo: ['Spielfiguren beim Lesen von aab beobachten', 'Teilmengenkonstruktion: aus Mengen werden Zustände'] })] },
    { s: 30, szene: 'F', kapitel: 'Der fertige DEA', inhalt: 'Ergebnis der Teilmengenkonstruktion mit Zuordnung der Mengen.', sprech: ['„Jede Menge, die Z enthält, ist ein Endzustand.“'],
      slides: [(d) => d.main({ title: 'Teilmengenkonstruktion: der DEA', img: V + 'dea_endet_ab.png', rail: { head: 'Neue Zustände', lines: ['S0 = {S}', 'S1 = {S, A}', 'S2 = {S, Z} – enthält Z ⇒ Endzustand'] } })] },
    { s: 35, szene: 'F', kapitel: 'Jetzt du', inhalt: 'Pausenaufgabe: DEA „enthält bb“ in reguläre Grammatik übersetzen.', sprech: ['„Rezept anwenden – vergiss die ε-Regel nicht.“'],
      slides: [
        (d) => d.pause({ task: 'Übersetze den DEA in eine reguläre Grammatik.', img: V + 'bb.png', imgH: 2.4, items: ['Σ = {a, b}; akzeptiert alle Wörter, die bb enthalten'] }),
        (d) => d.solution({ items: ['N = {S0, S1, S2},  T = {a, b},  Startsymbol S0', 'S0 → aS0 | bS1', 'S1 → aS0 | bS2', 'S2 → aS2 | bS2 | ε'], size: 24 }),
      ] },
    { s: 25, szene: 'F', kapitel: 'Zusammenfassung', inhalt: 'Kernsätze, Weiter üben, M09.', sprech: ['Ausblick: Was ist mit Sprachen wie aⁿbⁿ? → kontextfreie Grammatiken.'],
      slides: [(d) => d.end({ items: ['Rechtsregulär: nur **A → aB | a | ε**.', 'DEA → Grammatik: Zustand = Nichtterminal, Pfeil = Regel, Endzustand = ε-Regel.', 'Grammatik → NEA → (Teilmengen) → DEA.', 'Ableitung entspricht einem Lauf.'], route: '#/grammatik?challenge=3', routeText: 'Grammatik-Tester: gerade Anzahl a', merkblatt: 'Merkblatt M09 – Reguläre Grammatik', next: 'Video 8: Kontextfreie Grammatiken' })] },
  ],
};

// --------------------------------------------------------------------------------------------- V8
const v8 = {
  id: 'V8', file: 'V8_Kontextfreie-Grammatiken', title: 'Kontextfreie Grammatiken und Mehrdeutigkeit', short: 'Kontextfreie Grammatiken',
  level: 'Level 13 (+ 14)', mb: 'M10', kurs: 'nur eA', einsatz: 'nach Level 13; Chomsky-Teil passt zu Level 14',
  ziel: 'Kontextfreie Grammatiken mit Bausteinen (Paare, Klammern, Spiegel, Folgen) entwickeln, Mehrdeutigkeit an zwei Ableitungsbäumen erkennen, Chomsky-Hierarchie einordnen.',
  material: 'Folien V8, AutomatenLab (Ableitungs-Rallye Aufgabe 13, Baum-Modus), Merkblatt M10',
  achtung: ['Mehrdeutig ist eine **Grammatik**, nicht die Sprache: Es gibt ein Wort mit zwei verschiedenen Ableitungsbäumen.', 'Rallye 13 vorher einmal im Baum-Modus ausprobieren.'],
  frage: 'Was können kontextfreie Grammatiken, was reguläre nicht können – und wo lauert die Falle?',
  segs: [
    { s: 20, szene: 'F', kapitel: 'Einstieg', inhalt: 'Compiler prüfen Klammern – reguläre Grammatiken können das nicht.', sprech: ['„Jeder Compiler prüft Klammern. Reguläre Grammatiken schaffen das nicht – kontextfreie schon.“'],
      slides: [(d) => d.title({ title: v8.title, frage: v8.frage })] },
    { s: 55, szene: 'F', kapitel: 'Paare erzeugen', inhalt: 'S → aSb | ab: Ableitung aaabbb und Baum; Definition kontextfrei.', sprech: ['„Das S in der Mitte erzeugt bei jedem Schritt ein a links und ein b rechts – genau das, was der DEA nicht konnte.“'],
      slides: [(d) => d.two({ title: 'Paare erzeugen', left: { head: 'Ableitung', lines: ['S → aSb | ab', '', 'S', '⇒ aSb', '⇒ aaSbb', '⇒ aaabbb', '', 'Jedes S erzeugt ein a **und** ein b.'] }, right: { head: 'Ableitungsbaum', img: I('ds13', 'baum_anbn.png'), imgH: 4.4 }, size: 23, rail: { head: 'Kontextfrei', lines: ['Links **genau ein** Nichtterminal', 'Rechts **beliebig**'] } })] },
    { s: 50, szene: 'F', kapitel: 'Der Bausteinkasten', inhalt: 'Paare, Klammern, Spiegel, Folgen; Ableitung von (())().', sprech: ['„Mit diesen vier Bausteinen löst du fast jede Abi-Aufgabe zu kontextfreien Grammatiken.“'],
      slides: [
        (d) => d.table({ title: 'Der Bausteinkasten', rows: [['Baustein', 'Regeln', 'erzeugt'], ['Paare', 'S → aSb | ab', 'a^n^b^n^ (n ≥ 1)'], ['Klammern', 'S → (S)S | ε', 'korrekte Klammerausdrücke'], ['Spiegel', 'S → 0S0 | 1S1 | 0 | 1 | ε', 'Palindrome über {0, 1}'], ['Folgen', 'A → aA | ε', 'beliebig viele a']], colW: [1.8, 3.6, 3.2], size: 21 }),
        (d) => d.main({ title: 'Klammern ableiten: (())()', items: J.v8.klammer.split(' ⇒ ').map((x, i) => (i ? '⇒ ' : '') + x), size: 21, rail: { head: 'Tipp', lines: ['Immer das **linkeste** Nichtterminal ersetzen (Linksableitung).'] } }),
      ] },
    { s: 70, szene: 'F', kapitel: 'Mehrdeutigkeit', inhalt: 'Zwei Ableitungsbäume für a+a*a; Bedeutung; eindeutige Grammatik mit Ebenen.', sprech: ['„Mit a = 2: einmal 6, einmal 8 – der Baum entscheidet, was gerechnet wird.“'],
      slides: [
        (d) => d.two({ title: 'Mehrdeutig: zwei Bäume für a+a*a', left: { head: 'a + (a ∗ a)', img: I('ds13', 'term_mehrdeutig_1.png'), imgH: 3.9 }, right: { head: '(a + a) ∗ a', img: I('ds13', 'term_mehrdeutig_2.png'), imgH: 3.9 }, rail: { head: 'Grammatik', lines: ['E → E+E | E∗E | (E) | a', 'Ein Wort, **zwei** Ableitungsbäume ⇒ **mehrdeutig**'], size: 18 } }),
        (d) => d.main({ title: 'Warum ist das ein Problem?', items: ['Baum = **Bedeutung**: Was wird zuerst gerechnet?', 'Mit a = 2: 2 + (2 · 2) = 6, aber (2 + 2) · 2 = 8', 'Compiler brauchen **eindeutige** Grammatiken', 'Lösung: Ebenen für den Vorrang'], below: { lines: ['E → E+T | T      T → T∗F | F      F → (E) | a'], h: 0.9 } }),
      ] },
    { s: 55, szene: 'L', kapitel: 'Live: zwei Bäume', inhalt: 'Rallye Aufgabe 13 im Baum-Modus: beide Bäume für a+a*a bauen.', sprech: ['Beim ersten Schritt einmal E+E, einmal E*E wählen – „hier trennen sich die Bäume“.'],
      lab: [{ route: '#/rallye?aufgabe=13', tun: 'beide Ableitungsbäume bauen' }],
      slides: [(d) => d.live({ route: '#/rallye?aufgabe=13', todo: ['Baum-Modus: zwei Bäume für a+a*a bauen', 'Wo unterscheiden sie sich?'] })] },
    { s: 40, szene: 'F', kapitel: 'Die Chomsky-Hierarchie', inhalt: 'Typ 3 ⊂ Typ 2 ⊂ Typ 1/0 mit passenden Automaten.', sprech: ['„Jede reguläre Sprache ist auch kontextfrei – aber nicht umgekehrt.“'],
      slides: [(d) => d.main({ title: 'Die Chomsky-Hierarchie', img: I('ds14', 'chomsky.png'), rail: { head: 'Zuordnung', lines: ['Typ 3: DEA / NEA', 'Typ 2: Kellerautomat (NKA)', 'Typ 1/0: Turingmaschine (Ausblick)'], size: 18 } })] },
    { s: 35, szene: 'F', kapitel: 'Jetzt du', inhalt: 'Pausenaufgabe: Grammatik für Palindrome über {0, 1}, regulär?', sprech: ['„Welcher Baustein passt?“'],
      slides: [
        (d) => d.pause({ task: 'Gib eine Grammatik für alle Palindrome über {0, 1} an. Ist sie regulär?', items: ['Palindrom: vorwärts wie rückwärts gleich, z. B. 0110, 101, ε'] }),
        (d) => d.solution({ items: ['S → 0S0 | 1S1 | 0 | 1 | ε', 'Nicht rechtsregulär: Terminal **rechts** vom Nichtterminal (0S0).', 'Auch die **Sprache** ist nicht regulär (Schubfach: Präfixe 0^i^1, Fortsetzung 0^i^).'] }),
      ] },
    { s: 25, szene: 'F', kapitel: 'Zusammenfassung', inhalt: 'Kernsätze, Weiter üben (Chomsky-Sortierer), M10.', sprech: ['Hinweis auf Video 9 (Abi-Check).'],
      slides: [(d) => d.end({ items: ['Kontextfrei: links genau **ein** Nichtterminal.', 'Bausteine: Paare, Klammern, Spiegel, Folgen.', '**Mehrdeutig**: ein Wort mit zwei Ableitungsbäumen.', 'Typ 3 ⊂ Typ 2: DEA ⊂ Kellerautomat.'], route: '#/sortierer?runde=1', routeText: 'Chomsky-Sortierer: 10 Karten', merkblatt: 'Merkblatt M10 – Kontextfreie Grammatiken', next: 'Video 9: Abi-Check' })] },
  ],
};

// --------------------------------------------------------------------------------------------- V9
const cmp = (title, task, A, B) => [(d) => d.compare({ title, task, A, B }), (d) => d.compare({ title, task, A, B, reveal: 'B' })];
const wrongTab = [HEAD, ['S0', '#', '–', '–'], ['S0', '#A', '#', 'a'], ['S0', '#AA', 'A', 'a'], ['S1', '#A', 'A', 'b'], ['S1', '#', 'A', 'b']];
const v9 = {
  id: 'V9', file: 'V9_Abi-Check', title: 'Abi-Check: Antworten, die volle Punkte bringen', short: 'Abi-Check',
  level: 'Level 14 / Abi-Vorbereitung', mb: 'M12', kurs: 'eA (Typ 1–3 auch gA)', einsatz: 'vor Boss-Level C bzw. vor der Übungsklausur',
  ziel: 'Operatoren unterscheiden und für fünf typische Aufgabentypen vollständige Antworten formulieren; häufige Punktverluste erkennen.',
  material: 'Folien V9, Merkblatt M12 (optional kurz einblenden), AutomatenLab Level-Quiz Welt C',
  achtung: ['Keine Original-Abituraufgaben einblenden (Rechte) – die Beispiele im Video sind eigene Varianten.', 'Bei den A/B-Folien zuerst ohne Auflösung zeigen und 2–3 Sekunden Denkpause lassen.'],
  frage: 'Was muss in einer Antwort stehen, damit sie vollständig ist?',
  segs: [
    { s: 25, szene: 'F', kapitel: 'Einstieg', inhalt: 'Punkte gehen durch unvollständige Antworten verloren; Format „Antwort A oder B?“.',
      sprech: ['„Viele verlieren Punkte nicht, weil sie den Automaten nicht verstehen – sondern weil die Antwort unvollständig ist. Bei jedem Typ darfst du zuerst urteilen: A oder B?“'],
      slides: [(d) => d.title({ title: v9.title, frage: v9.frage })] },
    { s: 35, szene: 'F', kapitel: 'Operatoren', inhalt: 'Was die Operatoren verlangen; Zeitfaustregel.', sprech: ['„Erläutern heißt immer: mit Bezug zur Situation.“'],
      slides: [(d) => d.table({ title: 'Operatoren – was wird verlangt?', rows: [['Operator', 'Du lieferst …'], ['nennen / angeben', 'das Ergebnis, **ohne** Begründung'], ['beschreiben', 'den Sachverhalt in eigenen Worten'], ['darstellen', 'Lauf, Tabelle oder Graph – strukturiert'], ['erläutern', 'Erklärung **+ Sachzusammenhang**'], ['begründen', 'ein Argument mit „da …“ / „weil …“'], ['entwickeln', 'eine eigene Lösung (Automat, Grammatik)']], colW: [2.6, 6.0], size: 20, rail: { head: 'Faustregel', lines: ['etwa **3 Minuten pro BE**'] } })] },
    { s: 45, szene: 'F', kapitel: 'Typ 1: Verarbeitung darstellen', inhalt: 'Zustandsfolge + Ergebnis + Begründung.', sprech: ['„A sagt nur das Ergebnis – darstellen verlangt den Lauf.“'],
      slides: cmp('Typ 1: Verarbeitung darstellen', '„Stellen Sie die Verarbeitung des Wortes LOOL durch den LOL-Erkenner dar.“', 'LOOL wird abgelehnt, weil LOL im Wort nicht vorkommt.', `${J.v1.LOOL.path}. Der Automat endet in S1; S1 ist kein Endzustand ⇒ LOOL wird **abgelehnt**.`) },
    { s: 50, szene: 'F', kapitel: 'Typ 2: Bedeutung erläutern', inhalt: 'Satzmuster „genau dann, wenn …“ im Sachzusammenhang.', sprech: ['„A nennt nur ein Beispielwort. B sagt, was der Zustand für die Situation bedeutet.“'],
      slides: cmp('Typ 2: Bedeutung eines Zustands erläutern', '„Erläutern Sie die Bedeutung des Zustands S3 des Kaffeeautomaten (40 ct; Münzen 10 ct und 20 ct).“', 'In S3 ist der Automat nach dem Lesen von 10 und 20.', 'Der Automat ist genau dann in S3, wenn bisher **genau 30 ct** eingeworfen wurden (z. B. 10 + 20, 20 + 10 oder 10 + 10 + 10). Es fehlen noch 10 ct, daher ist S3 kein Endzustand.') },
    { s: 50, szene: 'F', kapitel: 'Typ 3: Grenzen begründen', inhalt: 'Kurzform mit Sachbezug: was müsste unbeschränkt gezählt werden.', sprech: ['„‚Zu wenige Zustände‘ ist keine Begründung – mehr Zustände würden ja helfen, oder? Nein: Es geht um unbeschränkt.“'],
      slides: cmp('Typ 3: Grenzen begründen', '„Entscheiden Sie begründet, ob ein endlicher Automat prüfen kann, ob ein Ausdruck korrekt geklammert ist.“', 'Nein, weil der Automat dafür zu wenige Zustände hat.', 'Nein. Ein endlicher Automat hat nur endlich viele Zustände und kann sich nur endlich viele Werte merken. Er müsste sich die Anzahl der **noch offenen Klammern** merken, die **beliebig groß** werden kann. Ein Kellerautomat kann sie im Keller speichern.') },
    { s: 60, szene: 'F', kapitel: 'Typ 4: Kellertabelle', inhalt: 'Fehlersuche in einer Schülertabelle (aabb): oberstes Zeichen rechts, ε-Zeile fehlt, falsche Akzeptanzbegründung.',
      sprech: ['„Pausiere und finde drei Fehler.“', 'Auflösung Fehler für Fehler zeigen.'],
      slides: [
        (d) => d.table({ title: 'Typ 4: Finde die drei Fehler (aabb)', rows: wrongTab, colW: COLW, size: 19, after: { y: 4.75, lines: ['„akzeptiert, da der Keller leer ist“'], size: 21 }, rail: { head: 'Pausiere jetzt!', tone: 'ocker', lines: ['Kellerautomat für a^n^b^n^ aus Video 5.', 'Drei Fehler finden.'], size: 18 } }),
        (d) => d.table({ title: 'Auflösung: die richtige Tabelle', rows: [HEAD, ...J.v5.aabb.rows], colW: COLW, size: 18, hl: [2, 3, 4, 6], after: { y: 5.05, lines: ['**1** Oberstes Zeichen steht **links**: A#, AA# …', '**2** Der ε-Übergang nach S2 fehlte – eigene Zeile.', '**3** Akzeptiert, da die Eingabe vollständig gelesen und der **Endzustand** S2 erreicht ist.'], size: 19, h: 1.4 } }),
      ] },
    { s: 55, szene: 'F', kapitel: 'Typ 5: Grammatik oder Sprache?', inhalt: 'Grammatik nicht regulär ≠ Sprache nicht regulär; reguläre Ersatzgrammatik angeben.', sprech: ['„Eine bestimmte Grammatik ist nicht regulär – die Sprache kann trotzdem regulär sein, wenn es irgendeine reguläre Grammatik gibt.“'],
      slides: cmp('Typ 5: Grammatik oder Sprache?', '„G mit A → +xA | +yA | ε ist nicht regulär. Begründen Sie, dass L(G) trotzdem regulär ist.“', 'A → +xA hat zwei Terminale vor dem Nichtterminal. Also ist die Grammatik nicht regulär und damit auch die Sprache nicht.', 'A → +xA verletzt die Form A → aB. Die Sprache ist trotzdem regulär, denn diese reguläre Grammatik erzeugt sie: **A → +B | ε,  B → xA | yA**.') },
    { s: 30, szene: 'F', kapitel: 'Checkliste', inhalt: 'Fünf Prüffragen vor der Abgabe.', sprech: ['„Diese fünf Fragen kosten 30 Sekunden und retten Punkte.“'],
      slides: [(d) => d.main({ title: 'Checkliste vor der Abgabe', items: ['Notation: S0 …, **ε**, #, Σ, Γ', 'Hinweis zum **Fehlerzustand**, wenn Pfeile fehlen', 'Ergebnis **mit Begründung** („da …“)', '**Sachzusammenhang** genannt (ct, Klammern, Spiele …)', 'Grammatik: **N, T, Startsymbol, P** vollständig'], size: 24, rail: { head: 'Merkblatt M12', lines: ['Alle Aufgabentypen mit Antwortmuster.'] } })] },
    { s: 25, szene: 'F', kapitel: 'Zusammenfassung', inhalt: 'Kernsätze, Weiter üben (Quiz Welt C), M12, Übungsklausur.', sprech: ['Viel Erfolg wünschen; auf Übungsklausur verweisen.'],
      slides: [(d) => d.end({ items: ['**Darstellen**: Lauf + Ergebnis + Begründung.', '**Erläutern**: immer im Sachzusammenhang.', '**Begründen**: was unbeschränkt gezählt werden müsste.', '**Tabelle**: oberstes Zeichen links, ε-Zeile, Akzeptanzsatz.'], route: '#/quiz?welt=C', routeText: 'Level-Quiz Welt C', merkblatt: 'Merkblatt M12 – Abi-Spickzettel', next: 'Übungsklausur (Material der Einheit)' })] },
  ],
};

// --------------------------------------------------------------------------------------------- O1 Minimierung
const rd = (k) => I('ds05', `endet_ab_runde${k}.png`);
const o1 = {
  id: 'O1', file: 'Extra1_Minimierung', title: 'Minimierung: weniger Zustände, gleiche Sprache', short: 'Minimierung',
  level: 'Level 5 (Vertiefung)', mb: 'M03', kurs: 'eA (gA optional)', einsatz: 'zur Vertiefungswoche (Level 5)',
  ziel: 'Unterscheidbarkeit erklären, das Markierungsverfahren durchführen, äquivalente Zustände zusammenfassen und das Ergebnis im Abi-Stil begründen.',
  material: 'Folien Extra 1, AutomatenLab (Minimierer Aufgabe 5, Spiel „Unterscheide!“), Merkblatt M03',
  achtung: ['Markierte Paare werden nie wieder entmarkiert; man wiederholt Runden, bis sich nichts ändert.'],
  frage: 'Wie findet man systematisch heraus, welche Zustände überflüssig sind?',
  segs: [
    { s: 20, szene: 'F', kapitel: 'Einstieg', inhalt: 'Zwei Automaten, eine Sprache – 5 vs. 3 Zustände.', sprech: ['„Zwei Automaten erkennen dieselbe Sprache – einer braucht 5 Zustände, der andere 3. Welche sind überflüssig?“'],
      slides: [(d) => d.title({ kicker: 'Extra 1  ·  Maschinen, die Sprache verstehen', title: o1.title, frage: o1.frage })] },
    { s: 30, szene: 'F', kapitel: 'Ein Entwurf', inhalt: 'DEA „endet auf ab“ mit 5 Zuständen.', sprech: ['„S3 und S4 sehen verdächtig ähnlich aus wie S1.“'],
      slides: [(d) => d.main({ title: 'Ein Entwurf mit 5 Zuständen', sigma: 'Σ = {a, b} · akzeptiert alle Wörter, die auf ab enden', img: I('ds05', 'endet_ab.png'), rail: { head: 'Frage', lines: ['Welche Zustände „bedeuten“ dasselbe?'] } })] },
    { s: 50, szene: 'F', kapitel: 'Unterscheidbar oder äquivalent?', inhalt: 'Definition Unterscheidbarkeit; ε trennt End-/Nicht-Endzustand.', sprech: ['„Wenn ein Wort aus einem Zustand akzeptiert wird und aus dem anderen nicht, kann man sie nicht zusammenlegen.“'],
      slides: [(d) => d.main({ title: 'Unterscheidbar oder äquivalent?', items: ['Zwei Zustände sind **unterscheidbar**, wenn ein Wort w von einem in einen Endzustand und vom anderen in einen Nicht-Endzustand führt.', 'Sonst sind sie **äquivalent** ⇒ zusammenfassen.', 'Schon w = ε trennt **Endzustand** und **Nicht-Endzustand**.'], size: 22, rail: { head: 'Beispiel', lines: ['S0 und S1 mit w = b:', 'S0 –b→ S0 ✗', 'S1 –b→ S2 ✓'] } })] },
    { s: 95, szene: 'F', kapitel: 'Das Markierungsverfahren', inhalt: 'Dreieckstabelle: Runde 0 (End/Nicht-End), Runde 1, Runde 2 ohne Änderung.', sprech: ['„Runde 0: Jeder Endzustand gegen jeden Nicht-Endzustand.“', '„Ab Runde 1: Ein Paar wird markiert, wenn ein Zeichen in ein schon markiertes Paar führt.“'],
      slides: [
        (d) => d.main({ title: 'Markierungsverfahren: Runde 0', img: rd(0), rail: { head: 'Runde 0', lines: ['Alle Paare **Endzustand / Nicht-Endzustand** markieren:', '(S0,S2), (S1,S2), (S2,S3), (S2,S4)'], size: 18 } }),
        (d) => d.main({ title: 'Runde 1', img: rd(1), rail: { head: 'Runde 1', lines: ['Markieren, wenn ein Zeichen in ein **markiertes** Paar führt.', '(S0,S1): b → (S0,S2) ✓', '(S0,S3), (S0,S4) ebenso'], size: 18 } }),
        (d) => d.main({ title: 'Runde 2: nichts Neues', img: rd(2), rail: { head: 'Runde 2', lines: ['(S1,S3): a → (S3,S3), b → (S2,S2)', 'Keine neue Markierung ⇒ **fertig**', '≡: äquivalent'], size: 18 } }),
      ] },
    { s: 30, szene: 'F', kapitel: 'Das Ergebnis', inhalt: 'S1, S3, S4 zusammenfassen: Minimal-DEA mit 3 Zuständen.', sprech: ['„Bedeutung des neuen Zustands: zuletzt ein a.“'],
      slides: [(d) => d.main({ title: 'Ergebnis: 3 Zustände', img: I('ds05', 'endet_ab_min.png'), rail: { head: 'Zusammengefasst', lines: ['S1, S3, S4 → ein Zustand', 'Bedeutung: „zuletzt ein a“'] } })] },
    { s: 65, szene: 'L', kapitel: 'Live: Minimierer', inhalt: 'Minimierer Aufgabe 5 Runde für Runde; Spiel „Unterscheide!“.', sprech: ['Im Spiel ein trennendes Wort finden und laut begründen.'],
      lab: [{ route: '#/minimierer?aufgabe=5', tun: 'Paare markieren' }, { route: '#/minimierer?aufgabe=5&modus=unterscheide', tun: 'trennendes Wort finden' }],
      slides: [(d) => d.live({ route: '#/minimierer?aufgabe=5', todo: ['Paare markieren – Runde für Runde', 'Spiel „Unterscheide!“: trennendes Wort finden'] })] },
    { s: 40, szene: 'F', kapitel: 'So schreibst du es im Abi', inhalt: 'Musterantworten äquivalent/unterscheidbar.', sprech: ['Musterantworten vorlesen.'],
      slides: [(d) => d.main({ title: 'Abi: so formulierst du', items: ['„**Untersuchen Sie**, inwieweit Zustände zusammengefasst werden können.“', '„S3 und S4 sind äquivalent: Beide sind keine Endzustände und wechseln mit a nach S3 und mit b nach S2.“', '„S0 und S1 sind unterscheidbar: Mit b gelangt S1 in den Endzustand S2, S0 bleibt im Nicht-Endzustand S0.“'], size: 21 })] },
    { s: 25, szene: 'F', kapitel: 'Jetzt du', inhalt: 'Pausenfrage: S0 und S2 äquivalent?', sprech: ['Kurze Pause, dann Auflösung.'],
      slides: [
        (d) => d.pause({ task: 'Sind S0 und S2 äquivalent? Begründe.', img: I('ds05', 'endet_ab.png'), imgH: 3.4 }),
        (d) => d.solution({ items: ['**Nein.** S2 ist Endzustand, S0 nicht.', 'Schon das leere Wort ε unterscheidet sie.'] }),
      ] },
    { s: 25, szene: 'F', kapitel: 'Zusammenfassung', inhalt: 'Kernsätze, Weiter üben, M03.', sprech: [''],
      slides: [(d) => d.end({ items: ['**Unterscheidbar**: ein Wort trennt Akzeptieren und Ablehnen.', 'Runde 0: Endzustand gegen Nicht-Endzustand.', 'Weitere Runden: Zeichen führt in markiertes Paar.', 'Unmarkierte Paare **zusammenfassen**.'], route: '#/minimierer?aufgabe=2', routeText: 'Minimierer: gerade Anzahl a', merkblatt: 'Merkblatt M03 – Minimierung', next: 'Video 3: Mealy-Automaten' })] },
  ],
};

// --------------------------------------------------------------------------------------------- O2 Palindrome (NKA)
const o2 = {
  id: 'O2', file: 'Extra2_Keller-mit-Raten', title: 'Kellerautomat mit Raten: Palindrome', short: 'Keller mit Raten',
  level: 'Level 10 (Vertiefung)', mb: 'M07', kurs: 'nur eA', einsatz: 'zur Vertiefungswoche (Level 10)',
  ziel: 'Deterministische und nichtdeterministische Kellerautomaten unterscheiden, ε-Übergänge als „Raten“ deuten, einen akzeptierenden Lauf tabellarisch angeben.',
  material: 'Folien Extra 2, AutomatenLab (Keller-Labor „palindrom“, Simulator), Merkblatt M07',
  achtung: ['„Akzeptiert, wenn es mindestens einen akzeptierenden Lauf gibt“ – ein falscher Rateversuch zählt nicht als Ablehnung.'],
  frage: 'Wie prüft ein Kellerautomat, ob ein Wort vorwärts und rückwärts gleich ist – ohne zu wissen, wo die Mitte ist?',
  segs: [
    { s: 20, szene: 'F', kapitel: 'Einstieg', inhalt: 'Palindrome; Problem: Wo ist die Mitte?', sprech: ['„abba liest sich vorwärts wie rückwärts. Ein Kellerautomat kann das prüfen – wenn er raten darf.“'],
      slides: [(d) => d.title({ kicker: 'Extra 2  ·  Maschinen, die Sprache verstehen', title: o2.title, frage: o2.frage })] },
    { s: 50, szene: 'F', kapitel: 'Mit Mittelzeichen', inhalt: 'w c wᴿ: bis c ablegen, danach vergleichen (deterministisch).', sprech: ['„Das c sagt dem Automaten: Ab hier rückwärts vergleichen.“'],
      slides: [(d) => d.main({ title: 'Mit Mittelzeichen: w c w^R^', sigma: 'Σ = {a, b, c} · Γ = {#, A, B} · z. B. abcba, aabcbaa', img: V + 'palc.png', caption: FEHLER, rail: { head: 'Idee', lines: ['Bis c: jedes Zeichen ablegen (a → A, b → B)', 'Nach c: vergleichen und abbauen', 'Nur # übrig ⇒ S2'], size: 18 } })] },
    { s: 60, szene: 'F', kapitel: 'Ohne Mitte: raten', inhalt: 'NKA für w wᴿ: ε-Übergänge = Mitte raten; Akzeptanz bei mindestens einem Lauf.', sprech: ['„Die ε-Pfeile heißen: Ich rate, hier ist die Mitte.“'],
      slides: [(d) => d.main({ title: 'Ohne Mittelzeichen: raten!', img: V + 'pal_nka.png', imgBox: { x: 0.6, y: 1.45, w: 8.6, h: 3.6 }, below: { tone: 'ocker', lines: ['**Nichtdeterministisch** (NKA): akzeptiert, wenn **mindestens ein** Lauf akzeptiert.'], h: 0.9 }, rail: { head: 'ε-Übergänge', lines: ['(#, ε) : #, (A, ε) : A, (B, ε) : B', '= „Ich rate: Hier ist die Mitte.“'], size: 18 } })] },
    { s: 60, szene: 'F', kapitel: 'Der richtige Lauf', inhalt: 'Tabelle für abba mit ε-Zeile beim Raten.', sprech: ['„Geraten wird nach ab – danach passt alles.“'],
      slides: [(d) => d.table({ title: 'Ein akzeptierender Lauf für abba', rows: [HEAD, ...J.o2.abba.rows], colW: COLW, size: 19, hl: [4], after: { y: 5.65, lines: ['akzeptiert: **ja** – geraten nach ab; Eingabe vollständig gelesen, Endzustand S2.'] }, rail: { head: 'Wichtig', tone: 'ocker', lines: ['ε-Übergang = eigene Zeile', 'Im Abi: einen **akzeptierenden** Lauf angeben'], size: 18 } })] },
    { s: 65, szene: 'L', kapitel: 'Live: falsch und richtig raten', inhalt: 'Keller-Labor palindrom: zu früh raten (steckt fest), richtig raten (akzeptiert).', sprech: ['„Ein Fehlversuch heißt nicht ‚abgelehnt‘ – es reicht ein guter Lauf.“'],
      lab: [{ route: '#/keller?automat=palindrom&modus=sim&wort=abba', tun: 'Übergänge selbst wählen' }],
      slides: [(d) => d.live({ route: '#/keller?automat=palindrom&modus=sim&wort=abba', todo: ['Zu früh raten: nach a → steckt fest', 'Richtig raten: nach ab → akzeptiert', 'Ein guter Lauf genügt'] })] },
    { s: 40, szene: 'F', kapitel: 'DKA oder NKA?', inhalt: 'Begriffe, Mächtigkeit, Akzeptanz im Abi.', sprech: [''],
      slides: [(d) => d.main({ title: 'DKA oder NKA?', items: ['**DKA**: in jeder Situation höchstens ein Übergang (w c w^R^)', '**NKA**: Wahlmöglichkeiten, z. B. ε-Übergänge zum Raten (w w^R^)', 'Für w w^R^ gibt es **keinen** deterministischen Kellerautomaten (ohne Beweis)', 'Akzeptanz: **Endzustand** nach vollständiger Eingabe'], size: 22 })] },
    { s: 30, szene: 'F', kapitel: 'Jetzt du', inhalt: 'Pausenfrage: Wird abab akzeptiert?', sprech: [''],
      slides: [
        (d) => d.pause({ task: 'Wird **abab** akzeptiert? Begründe.', img: V + 'pal_nka.png', imgH: 2.4 }),
        (d) => d.solution({ items: ['**Nein.** abab ist kein Palindrom.', 'Egal, wo der Automat die Mitte rät: Kein Lauf liest das Wort vollständig und endet in S2.', 'Es gibt also **keinen** akzeptierenden Lauf.'] }),
      ] },
    { s: 25, szene: 'F', kapitel: 'Zusammenfassung', inhalt: 'Kernsätze, Weiter üben, M07.', sprech: [''],
      slides: [(d) => d.end({ items: ['ε-Übergänge erlauben **Raten**.', 'NKA akzeptiert, wenn **ein** Lauf passt.', 'Tabelle: einen akzeptierenden Lauf zeigen.', 'NKA können mehr als DKA.'], route: '#/keller?automat=palindrom-c&modus=tabelle', routeText: 'Tabellen-Trainer: w c wᴿ', merkblatt: 'Merkblatt M07 – Kellerautomaten', next: 'Video 6: Grammatiken' })] },
  ],
};

module.exports = { v6, v7, v8, v9, o1, o2 };
