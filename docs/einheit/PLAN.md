# Unterrichtseinheit „Maschinen, die Sprache verstehen“
## Automaten und formale Sprachen – Informatik LK (eA), Q-Phase, Niedersachsen

> **Grund- und Leistungskurs:** Der Plan beschreibt den Leistungskurs. Für den Grundkurs (gA) gilt der Kern des KC (Welt A ohne Level 5, dazu Level 7); Level 9–15 sind nur eA, Level 5, 8 und 16 Zusatz (NEA im LK als Hinleitung zum Kellerautomaten). Übungsklausur gA: „Fahrradverleih“ (`materials/content/abschluss/automata_klausur_ga.py`). Zuordnung: `app/js/data/niveaus.js`, öffentlich unter `/niveaus`, Begründung in `docs/ENTSCHEIDUNGEN.md` (2026-10-12).
Lehrkraft: Frank Juchim, Max-Planck-Gymnasium Delmenhorst · Umfang: 16 Doppelstunden (DS) à 90 min

Dieses Dokument ist die verbindliche Planungsgrundlage für ALLE Materialien (Arbeitsblätter, Lehrkraft-Handreichungen, Folien, Merkblätter, Web-App). Alle Materialien sind auf **Deutsch**, Fachsprache gemäß KC Niedersachsen und den **Ergänzenden Hinweisen 2025 (verbindlich ab Abitur 2027)**.

---------------------------------------------------------------------------------------------------
## 0. Leitidee & Rahmen

* **Rahmenerzählung „AutomatenLab“**: Die SuS durchlaufen die Einheit wie ein Spiel in **16 Levels** (Level = Doppelstunde) in 4 **Welten**:
  * Welt A „Endliche Automaten“ (Level 1–6)
  * Welt B „Grenzen & Keller“ (Level 7–10)
  * Welt C „Formale Sprachen“ (Level 11–14)
  * Welt D „Sprachdesign & Ausblick“ (Level 15–16)
  Am Ende jeder Welt steht ein **Boss-Level** (Abi-artige Aufgabe als Hausaufgabe/Übung). Die Web-App „AutomatenLab“ (CapRover) enthält Minispiele/Simulatoren, die per QR-Code auf den Blättern verlinkt sind.
* Spielerisch heißt hier: Unplugged-Rollenspiele, Rätsel, Challenges mit Sofort-Feedback, Bug-Bounty (Fehler in Automaten anderer Gruppen finden), Wettbewerbe – aber jede Phase zahlt auf die KC-Kompetenzen und das Abitur (eA, Block 2) ein.
* Kein Programmieren/Implementieren durch SuS (Entscheidung der Lehrkraft). „Implementieren“ (KC) wird durch Umsetzung in **flaci.com** und in der App (Baukasten/Simulatoren) abgedeckt.

---------------------------------------------------------------------------------------------------
## 1. Notationskonventionen (VERBINDLICH, aus Ergänzenden Hinweisen 2025, Abschnitt 12/13)

**DEA**
* Angabe: Eingabealphabet Σ + Zustandsgraph. Startzustand mit Pfeil „Start“, Endzustände als Doppelkreis.
* Automaten werden **vollständig** angegeben, wenn nicht anders vermerkt. Fehlerzustand darf weggelassen werden, wenn dies durch einen Hinweis kenntlich gemacht ist: „Alle nicht eingezeichneten Übergänge führen in einen Fehlerzustand.“
* Zustandsbezeichner: S0, S1, … (wie im Abitur) – q0, q1 … nur, wo Bezug auf alte Folien nötig. Fehlerzustand: F_err oder „F“ nur wenn nicht mit Endzustand verwechselbar → wir verwenden **„E“ NICHT** für Endzustände. Formale Definition: A = (Q, Σ, δ, S0, F) mit F = Menge der Endzustände, δ: Q × Σ → Q.
* Zustandsfolge darstellen: S0 –a→ S1 –b→ S2 … bzw. Tabelle.

**Mealy-Automat**
* Angabe: Eingabealphabet Σ, Ausgabealphabet Ω, vollständiger Übergangsgraph.
* Kantenbeschriftung **Eingabezeichen / Ausgabezeichen** (z. B. „a / A“), Ausgabe darf ein Wort über Ω sein („b / AB“), leere Ausgabe = **ε**.
* Mealy-Automaten haben **keine Endzustände** (nur Startzustand).

**Nichtdeterministischer Kellerautomat (NKA)**
* Kantenbeschriftung **(oberstes Kellerzeichen, Eingabezeichen) : abzulegende Zeichen**, z. B. (#, a) : A#.
  * Das gelesene oberste Kellerzeichen wird entfernt. Hinter dem Doppelpunkt steht, was abgelegt wird; mehrere Zeichen möglich – **das am weitesten rechts notierte Zeichen wird zuerst abgelegt** (bei „A#“ liegt danach A oben).
  * (A, b) : ε bedeutet: A wird entfernt, nichts abgelegt.
* Kelleralphabet heißt **Γ** (z. B. Γ = {#, A, B}); Vorbelegungszeichen **#**. ε-Übergänge sind möglich, z. B. (#, ε) : #.
* **Akzeptanz: Eine Eingabe wird genau dann akzeptiert, wenn es eine Möglichkeit gibt, dass sich der Automat nach vollständiger Verarbeitung der Eingabe in einem Endzustand befindet.** (Akzeptanz über Endzustand – NICHT „Keller leer“! Die alte Folie P14 enthielt eine andere Definition → korrigiert.)
* Dokumentation einer Verarbeitung als Tabelle (Abi-Format, oberstes Kellerzeichen steht links):
  | Zustand | Belegung Kellerspeicher | oberstes Kellersymbol | verarbeitetes Eingabezeichen |
  Erste Zeile: S0 | # | – | –; dann pro Schritt: welches Kellersymbol gelesen wurde, welches Eingabezeichen (oder ε), neuer Zustand, neue Belegung. Am Ende „Eingabe wird akzeptiert: ja/nein“.
* DKA = deterministischer Kellerautomat (in Nachschreibterminen verwendet).

**Grammatiken**
* Angabe: Nichtterminalsymbole N, Terminalsymbole T, Startsymbol S, Produktionsregeln P. Nichtterminale Großbuchstaben, Terminale Kleinbuchstaben/Ziffern/Sonderzeichen. ε zulässig.
* „Grammatik“ ohne Zusatz = kontextfreie Grammatik. Reguläre Grammatiken **rechtsregulär**: Regeln der Form A → aB, A → a, A → ε (a Terminal, B Nichtterminal).
* Ableitung mit ⇒ : S ⇒ aSb ⇒ aaSbb ⇒ aaabbb. Ableitungsbaum optional.
* Mehrere Alternativen mit |.

**Weitere Korrekturen gegenüber alten Materialien**
* ε ist **kein** Zeichen des Eingabealphabets (alte NEA-Folie: „ε ist Teil des Eingabealphabets“ → falsch).
* L = {aⁿbⁿ | n ≥ 1} (alte Folie: „n > 1“, enthielt aber ab).
* Formale DEA-Definition einheitlich: F für Endzustände (alte Folie: E).
* Kellerautomat: Reihenfolge in der Klammer: zuerst Kellerzeichen, dann Eingabezeichen (alte Folie beschriftete das uneinheitlich).

**Operatoren** (Abi-Liste, Stand 2024): abschätzen, analysieren/untersuchen, anwenden, begründen/zeigen, berechnen, beschreiben, bestimmen, beurteilen, darstellen, erörtern, entwerfen/entwickeln, ergänzen/erweitern/verändern, erläutern, erstellen, implementieren, nennen/angeben, vergleichen, zeichnen/grafisch darstellen. Aufgaben auf Arbeitsblättern verwenden diese Operatoren **fett** und wo sinnvoll Anforderungsbereiche (AFB I–III).

---------------------------------------------------------------------------------------------------
## 2. KC-Kompetenzen (eA) – müssen alle abgedeckt sein

Automatenmodelle: (K1) Aufbau/Funktionsweise DEA beschreiben · (K2) Mealy beschreiben · (K3) Automatenmodelle als Zustandsgraphen entwickeln und implementieren · (K4) Funktion gegebener Automaten analysieren · (K5) Grenzen endlicher Automaten erläutern · (K6, eA) Kellerautomat als Erweiterung beschreiben.
Formale Sprachen (eA): (F1) Eigenschaften formaler vs. natürlicher Sprachen nennen · (F2) von Grammatik erzeugte Sprache beschreiben · (F3) reguläre und kontextfreie Grammatiken entwerfen · (F4) Zusammenhang reguläre Grammatik ↔ endlicher Automat erläutern.
Prozessbezogen: PK1.1, PK1.5, PK2.2, PK2.3, PK3.1, PK3.2; IK3.1, IK3.2, IK3.4, IK4.3. Ergänzungen über den Kern: Turingmaschine, Chomsky-Hierarchie (Ausblick DS16, DS14).

---------------------------------------------------------------------------------------------------
## 3. Sequenzplan (16 DS)

Format pro DS: Titel · Kernfrage · Lernziele · Ablauf (E = Einstieg, Er = Erarbeitung, Ü = Übung, S = Sicherung) · Material · App-Modul · Abi-Bezug · Hausaufgabe (HA)

### WELT A – Endliche Automaten

**DS01 – Level 1 „Ein Automat hört zu“ (Einstieg DEA)**
* Kernfrage: Wie kann eine Maschine erkennen, ob eine Eingabe „richtig“ ist – ohne sich alles zu merken?
* Lernziele: K1; SuS beschreiben Zustände, Übergänge, Start-/Endzustand, Eingabealphabet; stellen Zustandsfolgen dar.
* E (15'): Rätsel „Das Zahlenschloss“ (Tresor öffnet nur bei Eingabe, die auf 4-2-0-0 endet – wie „weiß“ es das?). Dann Unplugged-Rollenspiel „Menschlicher Automat“: 4 SuS sind S0–S3 (Schilder), jede/r hat eine Regelkarte („Wenn du L bekommst, gib die Wortkarte an S1 weiter“). Wortkarten (z. B. „LOLA“, „OLLO“, „LOOL“, „XLOL“) wandern durch die Klasse; wer am Ende die Karte hält, ruft „akzeptiert/abgelehnt“. Automat: „enthält LOL“ über Σ = {L, O, X} (X = alle anderen Zeichen).
* Er (30'): Folien – vom Rollenspiel zum Zustandsgraphen; Fachbegriffe; Kaffeeautomat (40 ct, 10/20-ct-Münzen, passend) als zweites Modell; Vollständigkeit/Fehlerzustand.
* Ü (35'): AB01 – Zustandsfolgen darstellen, Akzeptanz untersuchen, Automat ergänzen; App „Akzeptor-Arena“.
* S (10'): Merkblatt M01; Exit-Frage.
* HA: drei Alltagsautomaten mit Zuständen beschreiben (Drehkreuz, Ampel, Waschmaschine …).

**DS02 – Level 2 „Was macht dieser Automat?“ (Analyse & formale Definition)**
* Kernfrage: Wie finde ich heraus, welche Sprache ein Automat erkennt – und was seine Zustände „bedeuten“?
* Lernziele: K1, K4; formale Definition A = (Q, Σ, δ, S0, F), Übergangstabelle ↔ Graph, Begriffe Wort, leeres Wort ε, Σ*, Sprache L(A); Bedeutung von Zuständen im Sachzusammenhang erläutern.
* E: „Sprach-Detektiv“: 4 Mystery-Automaten (z. B. gerade Anzahl a; endet auf b; beginnt und endet mit gleichem Zeichen; enthält kein „aa“) – Gruppen ermitteln die Sprache, Wettbewerb.
* Er: formale Definition, Übergangstabelle, „Zustand = Gedächtnis“: Was hat der Automat bisher gelesen, wenn er in Si ist?
* Ü: AB02 – Barcode-Startzeichen 110 analysieren (Bedeutung der Zustände), Quersummen-Paritäts-Automat (angelehnt Abi 2025: gerade/ungerade Quersumme), Tabelle ↔ Graph übersetzen. App: „Sprach-Detektiv“.
* S: Ergänzung M01 (formale Definition) + „Abi-Check: Bedeutung von Zuständen erläutern“ (Satzbausteine).
* Abi: 2025 eA B a,b; 2021 Nach D a; 2022 C a.
* HA: Boss-Training „Was macht er?“ (zwei Automaten analysieren).

**DS03 – Level 3 „Bauplan gesucht“ (DEA entwickeln – Strategien)**
* Kernfrage: Wie entwickle ich systematisch einen Automaten für eine gegebene Sprache?
* Lernziele: K3; Konstruktionsbausteine anwenden: festes Wort/Präfix, Teilwort enthalten, endet auf, zählen (genau/mindestens n), zählen modulo k, Kombination zweier Bedingungen („Produkt“: Zustände = Paare von Erinnerungen), Komplement (End-/Nichtendzustände tauschen).
* E: „Was muss sich der Automat merken?“ – Denkfrage: gerade Anzahl a UND endet auf b.
* Er: Bausteine-Galerie (Folien), Vorgehen in 5 Schritten (Erinnerungen sammeln → Zustände → Übergänge → Endzustände → Testen mit Grenzfällen ε, kurze Wörter).
* Ü: AB03 gestuft (🟢 Basis / 🔵 Standard / 🟣 Profi) – inkl. Spielekonsolen-Code (Regeln: A oder X kommt vor, blau und rot je mindestens einmal, endet mit E; angelehnt Abi 2024); App „Automaten-Baukasten“ (Challenges mit Sofort-Feedback: Gegenbeispiel-Wort).
* S: Merkblatt M02 „DEA entwickeln – Bausteine & Vorgehen“.
* HA: 2 Baukasten-Challenges + eine eigene Challenge für den Sitznachbarn ausdenken.

**DS04 – Level 4 „Modellierungswerkstatt“ (Kontexte, kooperativ, Bug-Bounty)**
* Kernfrage: Wie modelliere ich reale Systeme als DEA – und wie teste ich, dass mein Modell stimmt?
* Lernziele: K3, K4, PK1.5, PK3.2; Modelle entwickeln, testen, dokumentieren, gegenseitig prüfen.
* Ablauf: Expertengruppen (6 Stationen) – (A) PIN-Eingabe 42x00 (beliebige Ziffern davor, genau eine beliebige Ziffer zwischen 42 und 00, nichts danach), (B) XMail-Adresse vorname.nachname@XB.xx, (C) Smiley-Erkenner (mind. 4 Smileys), (D) Mann–Wolf–Ziege–Kohlkopf (Zustand = Belegung der Ufer; Ziel: alle drüben), (E) Trainerentlassung: Ergebnisse 3/1/0, entlassen, wenn in drei aufeinanderfolgenden Spielen < 3 Punkte (angelehnt Abi 2022 C b), (F) Getränkeautomat-Bedienfolge / Fahrstuhl.
  Phase 1 (35') Modellieren in flaci.com oder App-Sandbox; Phase 2 (25') **Bug-Bounty**: Gruppen wandern, versuchen mit Testwörtern Fehler im Automaten der anderen zu finden (Punkte!); Phase 3 (20') Korrektur + Kurzpräsentation; S (10') Fehlerkatalog „Typische Modellierungsfehler“.
* Material: Stationskarten (AB04 als Stationsheft), Bug-Bounty-Protokoll.
* HA: eigene Station sauber dokumentieren (Σ, Graph, Bedeutung der Zustände).

**DS05 – Level 5 „Weniger ist mehr“ (Minimierung & Unterscheidbarkeit)**
* Kernfrage: Wann sind zwei Zustände „gleich“ – und wie viele Zustände braucht ein Automat mindestens?
* Lernziele: K4 vertieft; äquivalente Zustände, unterscheidende Wörter, Markierungsverfahren (Tabellenverfahren: Paare, Endzustand/Nicht-Endzustand markieren, Folgepaare prüfen, wiederholen, zusammenfassen); Begründungen zur Mindestzahl von Zuständen.
* E: Zwei Automaten für „:-)“ und „:)“ – einer mit 6, einer mit 5 Zuständen: Welcher ist besser? Gibt es überflüssige Zustände?
* Er: Unterscheidbarkeit („Zwei Zustände sind unterscheidbar, wenn es ein Wort gibt, das von dem einen in einen End-, von dem anderen in einen Nicht-Endzustand führt“), Markierungsverfahren Schritt für Schritt.
* Ü: AB05 – Minimierung, Abi-Transfer: „Begründen Sie, dass sich der Automat nach 30 und 03 in verschiedenen Zuständen befinden muss“ (Trainer-Kontext), „Untersuchen Sie, inwieweit Zustände zusammengefasst werden können“ (2025), „Begründen Sie, dass mindestens n Zustände nötig sind“ (paarweise unterscheidbare Präfixe). App „Minimierer“.
* S: Merkblatt M03 „Minimierung & Zustandsanzahl begründen“.
* Abi: 2025 B c,d; 2024 B c; 2022 C b.

**DS06 – Level 6 „Automaten, die antworten“ (Mealy) + Boss-Level A**
* Kernfrage: Wie modelliert man Automaten, die nicht nur prüfen, sondern übersetzen/reagieren?
* Lernziele: K2, K3; Mealy-Automat (Σ, Ω, Übergänge e/a, ε), Vergleich DEA–Mealy, Mealy entwickeln und analysieren (Fehler finden).
* E: Süßigkeitenautomat (Münze M, Hebel H; Ausgabe B=Bonbon / ε) als Rollenspiel; „Was fehlt dem DEA?“
* Er: Notation, Beispiel Kartoffelautomat (4 € mit 1-€/2-€-Münzen, Ausgabe K und Rückgeld 1), Vergleichstabelle DEA vs. Mealy.
* Ü: AB06 – Kartoffelautomat analysieren, Ziffernaddierer (zwei Ziffern 0–3 addieren), Lauflängen-Kompressor (bis zu drei gleiche Befehle h/d zusammenfassen – fehlerhaften Mealy korrigieren, angelehnt Abi 2022 D b), Palindrom-Generator (3 Bit → 5-stelliges Palindrom, angelehnt Abi 2024 Nach). App „Mealy-Maschine“.
* S: Merkblatt M04 „Mealy-Automaten“. **Boss-Level A** (Abi-artige Aufgabe zu DEA+Mealy, ca. 20 BE) als HA mit Erwartungshorizont zur Selbstkontrolle.

### WELT B – Grenzen & Keller

**DS07 – Level 7 „Der Automat stößt an Grenzen“**
* Kernfrage: Gibt es Probleme, die kein endlicher Automat lösen kann – und wie kann man das begründen?
* Lernziele: K5; Grenzen endlicher Automaten erläutern; Schubfachprinzip-Argument für L = {aⁿbⁿ | n ≥ 1}, korrekt geklammerte Ausdrücke, Palindrome; Unterschied „beschränkt zählen“ (geht) vs. „unbeschränkt zählen“ (geht nicht).
* E: „Der Türsteher“: Club, E = jemand kommt rein, A = jemand geht raus. Ist der Club nach der Eingabe leer? Mit Kapazität 3 → DEA mit 5 Zuständen (inkl. Fehler); ohne Kapazitätsgrenze → ???
* Er: App-Spiel „Überliste den Automaten“: Ein Automat mit k (geheimen) Zuständen behauptet, aⁿbⁿ zu erkennen – die SuS finden ein Wort, bei dem er sich irrt. Aus der Gewinnstrategie wird das Schubfachargument abgeleitet (Argumentationsschema in 5 Schritten).
* Ü: AB07 – Entscheidungstabelle (DEA möglich? begründet), Begründungsaufgaben im Abi-Stil (Klammern, Kriterium „Quersumme der ersten Ziffernfolge = Anzahl Zeichen der zweiten“, Codes mit gleich vielen O wie X), Mealy-Grenze (Zustandsanzahl wächst mit dem Preis; unbeschränkt unmöglich).
* S: Merkblatt M05 „Grenzen endlicher Automaten – so begründest du“.
* Abi: 2024 B e,h; 2023 D b (Beurteilen); 2022 D c; 2021 E d; 2025 Nach i.

**DS08 – Level 8 „Raten erlaubt“ (NEA als Brücke)**
* Kernfrage: Was ändert sich, wenn ein Automat mehrere Möglichkeiten hat?
* Lernziele: Nichtdeterminismus verstehen (Übergangsrelation, akzeptiert, wenn es mindestens einen Weg gibt; ε-Übergänge – ε ist kein Eingabezeichen), NEA und DEA sind gleich mächtig (Idee der Teilmengenkonstruktion als eA-Vertiefung). Bedeutung: Grundlage für NKA (Abi!) und für die Übersetzung regulärer Grammatiken.
* E: Teilwort „LOL“ finden – DEA (kompliziert) vs. NEA („Rate, wo LOL beginnt“). Unplugged: „Parallelwelten“ – mehrere Spielfiguren gleichzeitig auf dem an die Tafel projizierten Graphen.
* Ü: AB08 – NEA simulieren (Menge aktiver Zustände), NEA entwerfen (Spam-Filter „VIAGRA“ → neutraler: „GRATIS“), Vertiefung: Teilmengenkonstruktion für kleinen NEA. App „Parallelwelten“.
* S: Merkblatt M06 „NEA – Nichtdeterminismus“.

**DS09 – Level 9 „Der Automat bekommt ein Gedächtnis“ (Kellerautomat I)**
* Kernfrage: Wie muss man den endlichen Automaten erweitern, damit er unbeschränkt zählen kann?
* Lernziele: K6; Keller (Stapel, LIFO, push/pop/top – Bezug zur Datenstruktur Stapel), Notation (Kellerzeichen, Eingabe) : Ablage, Vorbelegung #, Akzeptanz über Endzustand, Verarbeitung tabellarisch dokumentieren (Abi-Format).
* E: Klammer-Check mit Spielkarten-Stapel (unplugged): „( [ ( ) ] )“ – jede öffnende Klammer auf den Stapel, jede schließende muss passen.
* Er: Kellerautomat für aⁿbⁿ (n ≥ 1) Schritt für Schritt, formale Bestandteile (Q, Σ, Γ, δ, S0, #, F).
* Ü: AB09 – Verarbeitung dokumentieren (Tabellen im Abi-Format), Kellerautomaten für Klammerausdrücke, aⁿb²ⁿ, Wörter mit gleich vielen a und b. App „Keller-Labor“ (Schrittsimulator + Tabellentrainer).
* S: Merkblatt M07 „Kellerautomaten“.
* Abi: 2025 B g,h; 2024 B f,g; 2023 D b; 2022 C c.

**DS10 – Level 10 „Keller-Profis“ (Nichtdeterminismus im Keller, Analyse im Sachzusammenhang) + Boss-Level B**
* Kernfrage: Wann muss ein Kellerautomat „raten“ – und wie analysiere ich Kellerautomaten in Abi-Aufgaben?
* Lernziele: K6 vertieft; Palindrome w wᴿ bzw. mit Mittelzeichen (ε-Übergang „Mitte raten“), DKA vs. NKA, Bedeutung des Kellers im Sachzusammenhang erläutern, Eingabewort aus Zustands-/Kellerfolge bestimmen, Grenzen: aⁿbⁿcⁿ (Ausblick).
* Ü: Abi-Werkstatt im Tandem („Prüfling & Korrektor“ mit Erwartungshorizont, Rollentausch): Kontexte Trainerentlassung-Keller, Prüfnummern Kriterium Y, Spielfeld-Generator (Seen \ /), Kartoffel-Vorgangsprotokolle (eigene Varianten, angelehnt). App „Keller-Labor“ Challenges.
* S: **Boss-Level B** (Abi-artige Aufgabe Grenzen + Keller, ca. 25 BE) mit Erwartungshorizont.

### WELT C – Formale Sprachen

**DS11 – Level 11 „Sprache – natürlich oder formal?“ (Grammatiken)**
* Kernfrage: Wie kann man mit endlich vielen Regeln unendlich viele Wörter/Sätze beschreiben?
* Lernziele: F1, F2; Alphabet, Wort, Sprache; Grammatik G = (N, T, S, P), Ableitung, Ableitungsbaum; formale vs. natürliche Sprachen (Syntax/Semantik, Eindeutigkeit, Mehrdeutigkeit, feste Regeln vs. Wandel/Ausnahmen).
* E: „Satz-Generator“-Spiel: Umschläge mit Wortkarten (Artikel, Nomen, Verb, Objekt) → Zufallssätze („Das Nilpferd knabbert Schokolade.“, „Der Maus trinkt Nüsse.“) → grammatikalisch korrekt? sinnvoll? → Syntax vs. Semantik.
* Er: Grammatik G1 für Mini-Deutsch (angelehnt Abi 2023 Nach a), Glal-Sprache (Silben la/le/lu, Wort endet auf lu, Länge 3), Ableitung & Ableitungsbaum.
* Ü: AB11 – Ableitungen zeigen, Sprache einer Grammatik beschreiben, Grammatik so verändern, dass nur korrekte Sätze entstehen (Genus-Kongruenz!), Vergleich formal/natürlich. App „Ableitungs-Rallye“.
* S: Merkblatt M08 „Grammatiken & Ableitungen“.

**DS12 – Level 12 „Grammatik trifft Automat“ (reguläre Grammatiken)**
* Kernfrage: Wie hängen reguläre Grammatiken und endliche Automaten zusammen?
* Lernziele: F3 (regulär), F4; rechtsreguläre Form erkennen; Übersetzung DEA → rechtsreguläre Grammatik (Zustand ↔ Nichtterminal, Übergang Si –a→ Sj ↔ Regel Si → aSj, Endzustand ↔ Si → ε) und Grammatik → NEA/DEA; „Grammatik nicht regulär, Sprache aber regulär“ unterscheiden.
* E: „Übersetzer-Duell“: Gruppe A hat nur den Automaten, Gruppe B nur die Grammatik – erzeugen beide dieselben Wörter? (Lautes Ableiten vs. Durchlaufen.)
* Ü: AB12 – Musik-Takte (Noten der Länge 1/2/4, Takt = 4 Schläge, Taktstrich t; angelehnt Abi 2021 D), Roboter-Befehlssprache (f/d/b/s mit Ziffern z und #; angelehnt 2021 Nach D), System-Codes (A und X kommen vor, endet auf E, mind. 3 Zeichen; angelehnt 2024 B d), Grammatik der Form S → 1A, A → 0A | 1A | +1A | *1A | ε (nicht rechtsregulär, Sprache regulär – angelehnt 2025 Nach). App „Grammatik-Tester“.
* S: Merkblatt M09 „Reguläre Grammatik ↔ Automat (Übersetzungsrezept)“.

**DS13 – Level 13 „Klammern, Spiegel, Programme“ (kontextfreie Grammatiken)**
* Kernfrage: Wie beschreibt man Sprachen mit Verschachtelung und Symmetrie?
* Lernziele: F3 (kontextfrei), F2; Muster: aⁿbⁿ (S → aSb | ab), Klammern (S → (S)S | ε), Palindrome, Terme, verschachtelte Wiederholungen; Mehrdeutigkeit (dangling else: zwei Ableitungsbäume) und Auflösung; Zusammenhang kontextfrei ↔ Kellerautomat; „Begründen Sie, dass die Sprache nicht regulär ist“.
* E: „Spiegelkabinett“: Palindrom-Wettbewerb + Frage: Welche Regel erzeugt genau alle Palindrome über {0,1}?
* Ü: AB13 – Grammatiken entwerfen (Hostnamen-ähnlich, IP-artig, Frosch-Sprache mit verschachtelten Wiederholungen n(…) – angelehnt 2022 D c, Kommentar-Schachtelung angelehnt 2021 E c), if-then-else-Mehrdeutigkeit (angelehnt 2023 Nach b). App „Ableitungs-Rallye“ (Baum-Modus) + „Grammatik-Tester“.
* S: Merkblatt M10 „Kontextfreie Grammatiken & Chomsky-Hierarchie“.

**DS14 – Level 14 „Die Landkarte der Sprachen“ (Chomsky-Hierarchie, Vernetzung) + Boss-Level C**
* Kernfrage: Welche Maschine braucht man für welche Sprache – und wie hängt alles zusammen?
* Lernziele: Vernetzung K1–K6, F1–F4; Chomsky-Hierarchie (Typ 3 regulär – DEA/NEA – rechtsreguläre Grammatik; Typ 2 kontextfrei – NKA – kontextfreie Grammatik; Typ 1/0 – Ausblick: linear beschränkter Automat / Turingmaschine); „immer möglichst spezielle Grammatik/Maschine wählen“.
* E (20'): App-Spiel „Chomsky-Sortierer“ (Sprachkarten den Maschinen zuordnen, mit Begründungs-Joker).
* Er (25'): Begriffsnetz/Concept-Map in Gruppen (Karten-Set), Präsentation einer Musterlösung.
* Ü (45'): Abi-Trainingszirkel – 4 Stationen mit Aufgaben-Teilen im Abi-Format (Analyse, Entwurf, Begründung, Dokumentation), Selbstkontrolle mit Erwartungshorizont.
* HA: **Boss-Level C** (Abi-artige Aufgabe Grammatiken, ca. 25 BE).

### WELT D – Sprachdesign & Ausblick

**DS15 – Level 15 „Sprachdesign-Studio“ (Mini-Projekt)**
* Kernfrage: Kannst du eine eigene kleine Sprache entwerfen – mit Grammatik, Automat und Übersetzer?
* Lernziele: PK4 (kreatives Schaffen), Synthese aller Kompetenzen; PK3.4 Teamarbeit.
* Ablauf: Gruppen (3–4) wählen ein Thema (Tanzschritte-Code, Drohnen-Steuerung, Emoji-Nachrichten, Rezept-Sprache, Lego-Bauanleitung, Schach-Zugnotation light, eigene Idee). Lieferumfang (Projektauftrag + Checkliste + Bewertungsraster): (1) Beschreibung + Beispielwörter, (2) Grammatik (begründet regulär oder kontextfrei), (3) Automat zur Syntaxprüfung (DEA oder NKA) in flaci/App getestet, (4) ein Mealy-Übersetzer für einen Teilaspekt, (5) **eine Abi-artige Aufgabe mit Erwartungshorizont für eine andere Gruppe** (Aufgabenbörse, Operatoren korrekt!).
* HA: Projekt fertigstellen, Aufgabe für Aufgabenbörse abgeben.

**DS16 – Level 16 „Ausblick: Die Turingmaschine“ + Abschluss**
* Kernfrage: Was kann eine Maschine, die auf ihr Band schreiben darf – und gibt es Grenzen, die keine Maschine überwindet?
* Ablauf: E (20') Aufgabenbörse: Gruppen lösen die Aufgabe einer anderen Gruppe (Kurzversion). Er (45') Warum scheitert der Kellerautomat an aⁿbⁿcⁿ? → Turingmaschine: Band, Schreib-Lese-Kopf, Übergänge (Zustand, gelesen) → (Zustand, geschrieben, Bewegung L/R/N). Unplugged: Papierstreifen-Band, SuS als Kopf, TM „Binärzahl + 1“. App „Turing-Labor“ (Binär+1, aⁿbⁿcⁿ, Fleißiger Biber). Church-Turing-These, Halteproblem als Geschichte (5'). S (25') Abschluss-Quiz (App), Lernlandkarte-Selbstcheck, Feedback.
* Material: AB16, Merkblatt M11 „Turingmaschine (Ausblick)“.

### Zusatz
* M12 „Abi-Spickzettel: Operatoren & Antwortmuster Automaten/Sprachen“ (wie beantworte ich „Dokumentieren Sie…“, „Begründen Sie, dass kein DEA…“, „Erläutern Sie die Bedeutung des Kellerspeichers im Sachzusammenhang“ …).
* Übungsklausur im Abi-Format (eA, ca. 45 BE, 135 min) mit Erwartungshorizont (BE, AFB).
* Lernlandkarte (Kompetenzraster „Ich kann …“) für SuS.

---------------------------------------------------------------------------------------------------
## 4. Web-App „AutomatenLab“ – Module & Deep-Links (Hash-Routing)
BASE_URL wird von der Lehrkraft nachgeliefert (CapRover). Links auf Materialien: BASE_URL + Route.

| Route | Modul | DS |
|---|---|---|
| #/arena | Akzeptor-Arena (Wort + DEA → akzeptiert? schnell entscheiden, Punkte/Streak, Schritt-Animation zur Erklärung) | 1–2 |
| #/detektiv | Sprach-Detektiv (welche Sprache erkennt der Automat? Multiple Choice + Testwörter ausprobieren) | 2 |
| #/baukasten | Automaten-Baukasten (DEA in Tabelle/Graph bauen, Prüfen gegen Zielsprache mit Gegenbeispiel; Challenges + freier Modus) | 3–4, 12 |
| #/minimierer | Minimierer (Markierungsverfahren interaktiv + „Unterscheide!“-Spiel) | 5 |
| #/mealy | Mealy-Maschine (Simulation mit Ein-/Ausgabeband, Challenges „Bug finden“) | 6 |
| #/ueberliste | Überliste den Automaten (Grenzen, Schubfachprinzip) | 7 |
| #/parallelwelten | NEA-Simulator mit Menge aktiver Zustände | 8 |
| #/keller | Keller-Labor (NKA-Schrittsimulator mit Stapel-Animation, Abi-Tabellentrainer, Challenges) | 9–10 |
| #/rallye | Ableitungs-Rallye (Ableiten mit Regelwahl, Ableitungsbaum) | 11, 13 |
| #/grammatik | Grammatik-Tester (eigene Grammatik eingeben, Wörter erzeugen, Wort prüfen) | 12–13, 15 |
| #/sortierer | Chomsky-Sortierer | 14 |
| #/turing | Turing-Labor | 16 |
| #/quiz | Level-Quiz (Exit-Tickets je Welt) | alle |

---------------------------------------------------------------------------------------------------
## 5. Dateien / Lieferumfang (Ordner „Automaten_LK“)
* 00_Einheitsplanung.docx (Lehrkraft) · 00_Lernlandkarte.docx (SuS)
* Pro DS: `DSxx_AB_<Kurztitel>.docx` (SuS), `DSxx_Lehrkraft_<Kurztitel>.docx` (Verlaufsplan, Lösungen, Hinweise, typische Fehler, Differenzierung), `DSxx_Folien_<Kurztitel>.pptx`
* Merkblätter `Mxx_Merkblatt_<Thema>.docx` (je 1 Seite, max. 2)
* `Uebungsklausur_Automaten_Sprachen.docx` + Erwartungshorizont
* `AutomatenLab/` (Web-App-Quelltext, Dockerfile, captain-definition, README)
