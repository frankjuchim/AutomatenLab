# Fallen P1–P10 – Automaten und formale Sprachen

Entwurf für AutomatenLab nach Vertrag §9 (Fallen-Liste P1–P10, gleiches Schema wie Algo Quest: Nummer, Kurztitel, Erläuterung).
Stand: 14.10.2026. **Von Frank freigegeben am 14.10.2026.** Umgesetzt (1.14.0): Konstante `FALLEN` und Zuordnung je Aufgabentyp in `app/js/data/fallen.js`, Feld `fallen` an jeder Aufgabe (Katalog), Fallen-Profil des Kurses und Spalte „Fallen“ in der Aufgabenstatistik (Lehrkraft-Bereich, CSV). Noch offen: Fallen je Quizfrage und in den Materialien.

- **Grundlage Notation:** `docs/einheit/PLAN.md` Abschnitt 1 (Ergänzende Hinweise 2025), `docs/einheit/STYLEGUIDE.md`.
- **Grundlage Fehlerbilder:** Quiz (`app/js/data/quiz.js`), Tipps in den Modul-Daten, Warnkästen „Darauf achten“ / „Typische Fehler“ in allen Lehrkraft-Handreichungen DS01–DS16 und Merkblättern M02–M12, Bewertungshinweise der Übungsklausur (`materials/content/abschluss/build_klausur.js`).
- **Geprüft:** Alle Automaten-, Keller- und Grammatik-Beispiele unten wurden mit der App-Engine (`app/js/engine`) nachgerechnet (Prüfskript im Scratchpad, nicht im Repo). Die Ergebnisse stehen jeweils dabei.
- **Beispiele:** Alle Beispiele sind eigene Beispiele. Es sind keine Original-Abituraufgaben und keine Buchauszüge darunter.
- **Hinweis zu Dateiorten:** Genannte Stellen wie `baukasten.js` oder `minimierer.js` meinen den heutigen Stand unter `app/js/data/`. Nach CLAUDE.md Regel 9 wandern Tipps, Erklärungen und Lösungen nach `inhalte/` (nur auf dem Server). Die Fundstellen ziehen dann mit um, Routen und IDs bleiben gleich.

---

## Übersicht

| Nr. | Kurztitel | Kern (Kurzfassung für `text`) | Level | Module |
|---|---|---|---|---|
| P1 | Automat unvollständig, Fehlerzustand-Hinweis fehlt | Jeder Zustand braucht für jedes Zeichen aus Σ einen Übergang, oder der Hinweissatz steht da. Vor Komplement und Minimierung vervollständigen. Mealy-Graph vollständig | 1, 3, 4, 5, 6 | baukasten, arena, minimierer, mealy |
| P2 | Akzeptanz falsch entschieden | Entscheidend ist der Zustand nach dem letzten Zeichen. NEA/NKA: Es reicht ein Lauf, der akzeptiert. NKA: Endzustand nach vollständiger Eingabe, nicht „Keller leer“ | 1, 2, 8, 9, 10 | arena, parallelwelten, keller |
| P3 | Entwurf nicht an Grenzfällen getestet | Neuanfang bei „enthält/endet auf“, ε, kürzestes Wort, ein Zeichen zu viel. Grammatik erzeugt zu viel oder zu wenig | 2, 3, 4, 11, 13 | baukasten, detektiv, grammatik |
| P4 | Unterscheidbarkeit ohne konkretes Wort begründet | Unterscheidbar heißt: Es gibt ein Wort, das trennt. Äquivalent: Begründung über die Folgezustände. „Mindestens n Zustände“ zeigst du mit n paarweise unterscheidbaren Präfixen | 5 | minimierer |
| P5 | Mealy mit Endzuständen oder ohne ε | Keine Endzustände, Beschriftung „e / a“ an der Kante, leere Ausgabe ε (nicht „N“ oder „–“), Σ und Ω angeben, Graph vollständig | 6, 15 | mealy |
| P6 | Regularität ohne Schubfachargument beurteilt | Für jeden DEA mit k Zuständen: k + 1 Präfixe, dieselbe Fortsetzung, Widerspruch. Endlich, modulo und Obergrenze bleiben regulär. Ist die Grammatik nicht regulär, folgt daraus nicht, dass die Sprache nicht regulär ist | 7, 10, 12, 13, 14 | ueberliste, sortierer, grammatik |
| P7 | Kellerübergang falsch ausgeführt | (oberstes Kellerzeichen, Eingabe) : Ablage. Das gelesene Zeichen wird entfernt, das rechte Zeichen wird zuerst abgelegt, # wieder ablegen, ε = nichts ablegen | 9, 10 | keller |
| P8 | Verarbeitung nicht nach Konvention dokumentiert | Zustandsfolge S0 –a→ S1 …; Kellertabelle mit vier Spalten, erste Zeile S0 \| # \| – \| –, oberstes Zeichen links, ε-Schritt in eigener Zeile, Schlusssatz „akzeptiert: ja/nein“ | 1, 2, 9, 10 | arena, keller |
| P9 | Grammatik oder Ableitung formal fehlerhaft | N, T, Startsymbol, P vollständig angeben. → in Regeln, ⇒ in Ableitungen, je Schritt eine Regel, am Ende nur Terminale. Rechtsregulär heißt nur A → aB \| a \| ε | 11, 12, 13 | rallye, grammatik |
| P10 | Operator verfehlt | „erläutern“ ohne Sachzusammenhang, „begründen“ ohne „da/weil“, „beschreiben“ ohne genaue Sprachangabe (Bedingung + Menge), Fachbegriffe fehlen | alle, bes. 2, 10, 14, 15 | quiz, detektiv, keller |

---

## Die Fallen im Einzelnen

### P1 – Automat unvollständig, Fehlerzustand-Hinweis fehlt

**Erläuterung:** Im Abitur werden Automaten **vollständig** angegeben. Jeder Zustand hat also für jedes Zeichen aus Σ genau einen Übergang. Den Fehlerzustand darfst du nur weglassen, wenn der Hinweis dasteht: „Alle nicht eingezeichneten Übergänge führen in einen Fehlerzustand.“ Fehlt beides, ist der DEA formal unvollständig. Das kostet Punkte, in unserer Übungsklausur 1 BE je Automat. Richtig teuer wird es als Folgefehler: Wenn du für das Komplement End- und Nicht-Endzustände tauschst, ohne vorher zu vervollständigen, oder wenn du einen unvollständigen Automaten minimierst, kommt ein falscher Automat heraus.

**Beispiel (eigenes, mit der Engine geprüft):** DEA für „beginnt mit ab“ über Σ = {a, b}: S0 –a→ S1 –b→ S2, Schleife an S2 mit a, b; Endzustand S2.
- ✗ So gezeichnet, ohne Hinweis. Für (S0, b) und (S1, a) gibt es keinen Übergang (die Engine meldet genau diese zwei Lücken).
- ✗ Komplement: S0 und S1 zu Endzuständen machen, S2 zum Nicht-Endzustand. Dann wird `b` abgelehnt (impliziter Fehlerzustand), obwohl `b` nicht mit ab beginnt.
- ✓ Hinweissatz ergänzen oder F_err einzeichnen. Für das Komplement F_err ausdrücklich einzeichnen, dann tauschen. F_err wird dabei zum Endzustand, und `b` wird akzeptiert.

**Üben/erkennen:** Level 1 (Fehlerzustand), Level 3 (Komplement), Level 4 (Bug-Bounty), Level 5 (Markierungsverfahren braucht F_err), Level 6 (Mealy vollständig).
`#/baukasten` (Challenge Komplement, Tipp „nur bei einem VOLLSTÄNDIGEN Automaten“), `#/arena`, `#/minimierer?aufgabe=1` (Smiley mit F_err), `#/mealy?aufgabe=n&modus=bugjagd`, `#/quiz?welt=A`, `#/quiz?ds=4`.

**Schon heute vorhanden:**
- Quiz Welt A: Frage zum Hinweissatz und Zuordnung „Komplement … (vorher vervollständigen)“.
- Quiz DS04, Frage 2: „fehlender Übergang ohne Hinweis“.
- `baukasten.js`: Tipp zur Komplement-Challenge.
- Warnkästen in M02 („Unvollständig“), DS01-LK („Fehlerzustand“), DS03-LK („Komplement“) und DS05-LK („Fehlerzustand vergessen“).
- Folie DS03: „Achtung: zwei typische Fallen“.
- Übungsklausur, Bewertungshinweis: 1 BE Abzug je Automat ohne Hinweis.

---

### P2 – Akzeptanz falsch entschieden

**Erläuterung:** Viele entscheiden „akzeptiert“, weil der Automat **irgendwann** in einem Endzustand war. Ein DEA akzeptiert aber nur, wenn er **nach dem letzten Zeichen** in einem Endzustand ist. Bei NEA und NKA reicht es nicht, einen einzigen Lauf zu probieren. Akzeptiert wird, wenn es **mindestens einen** akzeptierenden Lauf gibt. Ein falscher Rateversuch bedeutet also keine Ablehnung, und für eine Ablehnung müssen alle Läufe scheitern. Für den Kellerautomaten gilt verbindlich: akzeptiert genau dann, wenn er sich nach **vollständiger** Verarbeitung der Eingabe in einem Endzustand befinden kann. Ältere Materialien sagen „Keller leer“. Diese Begründung ist im Abitur falsch und kostet die Punkte für die Entscheidung.

**Beispiel (eigenes, geprüft):**
- DEA „endet auf ab“ (S0: a→S1, b→S0; S1: a→S1, b→S2; S2: a→S1, b→S0; F = {S2}), Wort `aba`.
  - ✗ „akzeptiert, weil S2 erreicht wurde“.
  - ✓ S0 –a→ S1 –b→ S2 –a→ S1 ⇒ abgelehnt, da S1 kein Endzustand ist.
- NKA für aⁿbⁿ (n ≥ 1), Wort `aab`.
  - ✗ „abgelehnt, weil der Keller nicht leer ist“.
  - ✓ Nach dem Lesen der ganzen Eingabe ist der Automat in S1 mit Belegung A#. S1 ist kein Endzustand, und für (A, ε) gibt es keinen Übergang ⇒ abgelehnt.
  - Der Kellerinhalt ist nicht das Kriterium.
- NKA für w wᴿ, Wort `abba`.
  - ✗ „Wenn er die Mitte zu früh rät, scheitert er, also abgelehnt.“
  - ✓ Es gibt einen Lauf, der die Mitte nach `ab` rät und im Endzustand endet ⇒ akzeptiert.

**Üben/erkennen:** Level 1–2 (DEA), Level 8 (NEA: Menge aktiver Zustände; ε-Übergänge schon vor dem ersten Zeichen; ε ist kein Eingabezeichen), Level 9–10 (NKA).
`#/arena?stufe=1&ueben=1`, `#/parallelwelten?aufgabe=5&modus=sim`, `#/keller?automat=anbn&modus=sim&wort=aab`, `#/keller?automat=palindrom&modus=sim`, `#/quiz?welt=B`.

**Schon heute vorhanden:**
- Quiz Welt A: „Ein DEA akzeptiert ein Wort genau dann, wenn …“, mit dem Distraktor „irgendwann während des Lesens“.
- Quiz Welt B: NEA- und NKA-Akzeptanz, Distraktor „Keller leer“.
- Quiz Welt D: Wahr/Falsch „Endzustand – nicht leerer Keller“.
- Quiz DS08, Frage 2: ε-Übergang.
- Warnkästen in DS01-LK („Akzeptanz zu früh“), DS08-LK, DS09-LK („Achtung: ältere Materialien“) und M07.
- Karte „Falsch geraten = abgelehnt“ auf den Folien DS10.

---

### P3 – Entwurf nicht an Grenzfällen getestet

**Erläuterung:** Ein entwickelter Automat oder eine entwickelte Grammatik ist oft fast richtig, versagt aber an einem Randfall. Die häufigsten: Bei „enthält …“ oder „endet auf …“ springt der Automat bei einem „falschen“ Zeichen blind nach S0, obwohl dieses Zeichen schon der Anfang eines neuen Treffers sein kann (Neuanfang/Überlappung). Das leere Wort ε wird nicht bedacht: Ist S0 Endzustand, wird ε akzeptiert. Eine Grammatik erzeugt zu viel oder zu wenig. Jedes Gegenbeispiel-Wort zeigt einen inhaltlichen Fehler im Entwurf, und genau dafür gibt es im Erwartungshorizont die meisten Punkte. Abhilfe: Schritt 5 „Testen“ aus M02 mit ε, dem kürzesten Wort, Überlappungswörtern und einem Zeichen zu viel.

**Beispiel (eigenes, geprüft):**
- DEA „endet auf aba“.
  - ✗ Aus S3 (aba gelesen) führt b nach S0. Dann läuft `ababa` so: S0 –a→ S1 –b→ S2 –a→ S3 –b→ S0 –a→ S1 ⇒ abgelehnt, obwohl `ababa` auf aba endet.
  - ✓ S3 –b→ S2, weil `ab` schon der Anfang eines neuen Treffers ist. Dann: S0 –a→ S1 –b→ S2 –a→ S3 –b→ S2 –a→ S3 ⇒ akzeptiert.
- Grammatik für L = {aⁿbⁿ | n ≥ 1}.
  - ✗ S → aSb | ε erzeugt auch ε.
  - ✓ S → aSb | ab.

**Üben/erkennen:** Level 2 (Vermutungen auch an Gegenbeispielen testen), Level 3–4 (Bausteine, Bug-Bounty), Level 11/13 (Grammatik-Entwurf: Klammern in derselben Regel erzeugen, ε bei Palindromen).
`#/baukasten?stufe=2` (das kürzeste Gegenbeispiel als Rückmeldung zeigt diese Falle direkt), `#/baukasten?modus=frei`, `#/detektiv`, `#/grammatik?challenge=1`, `#/grammatik?challenge=6`, `#/quiz?ds=3`.

**Schon heute vorhanden:**
- Quiz DS03, Frage 3: „Welche Grenzfälle testest du immer?“
- `baukasten.js`: Tipps „Teste besonders aab und abab“ und „Teste LLOL“.
- Warnkästen in M02 („Neuanfang vergessen“, „ε nicht bedacht“), DS02-LK („ε vergessen“, „Zu enge Vermutungen“), DS03-LK und DS13-LK („Klammern einzeln erzeugen“, „ε vergessen oder zu viel“).
- Videoplan: „Schritt 5: Testen – der häufigste Fehler“.

---

### P4 – Unterscheidbarkeit ohne konkretes Wort begründet

**Erläuterung:** Bei „Begründe, dass sich der Automat nach u und v in verschiedenen Zuständen befinden muss“, „Untersuche, inwieweit Zustände zusammengefasst werden können“ oder „Begründe, dass mindestens n Zustände nötig sind“ antworten viele mit Namen oder mit dem Bild: „S1 und S2 sind verschieden, weil …“ oder „mein Automat hat 3 Zustände“. Unterscheidbarkeit zeigst du immer mit einem **unterscheidenden Wort** und beiden Verarbeitungen. Äquivalenz begründest du über das gleiche Verhalten: beide End- oder beide Nicht-Endzustände, und für jedes Zeichen gleiche oder äquivalente Folgezustände. Ein Automat mit n Zuständen beweist nur „höchstens n“. Für „mindestens n“ brauchst du n paarweise unterscheidbare Präfixe.

**Beispiel (eigenes, geprüft; minimaler DEA hat 3 Zustände):** L = Wörter über {a, b}, die auf ab enden.
- ✗ „Man braucht 3 Zustände, weil mein Automat S0, S1, S2 hat.“
- ✓ Die Präfixe ε, a, ab sind paarweise unterscheidbar:
  - ε und a: Fortsetzung b. Es gilt b ∉ L, aber ab ∈ L.
  - ε und ab: Fortsetzung ε. Es gilt ε ∉ L, aber ab ∈ L.
  - a und ab: Fortsetzung ε. Es gilt a ∉ L, aber ab ∈ L.
  - Wären zwei dieser Zustände gleich, würde der Automat beide Wörter gleich behandeln. Das ist ein Widerspruch, also sind mindestens 3 Zustände nötig.

**Üben/erkennen:** Level 5 (Vertiefung, aber regelmäßig abiturrelevant), auch als Vorbereitung auf das Schubfachargument in Level 7.
`#/minimierer?aufgabe=5` (endet auf ab, 5 → 3), `#/minimierer?modus=unterscheide`, `#/minimierer?aufgabe=7`, `#/quiz?ds=5`.

**Schon heute vorhanden:**
- Quiz Welt A: Frage „Wann sind zwei Zustände unterscheidbar?“ (Distraktor „verschiedene Namen“).
- Quiz DS05: alle drei Fragen.
- M03: Warnkasten („keine Begründung … konkretes Wort“) und Achtung-Satz („müssen nicht in dieselben Zustände führen“).
- DS05-LK: Warnkasten („Begründung ohne Wort“, „Mindestzahl“).
- `minimierer.js`: Merke-Sätze.
- Übungsklausur Teil c: „ohne Begründung über die Folgezustände höchstens 2 BE“.

---

### P5 – Mealy mit Endzuständen oder ohne ε

**Erläuterung:** Der Mealy-Automat wird oft wie ein DEA gezeichnet: mit Doppelkreisen, mit der Ausgabe am Zustand statt an der Kante, mit „N“, „–“ oder einer leeren Stelle statt ε, oder mit fehlenden Kanten. Verbindlich ist: Angabe von Σ und Ω, vollständiger Übergangsgraph, Kantenbeschriftung **Eingabezeichen / Ausgabe** (die Ausgabe darf ein Wort über Ω sein), leere Ausgabe **ε**, **keine Endzustände**. Jeder dieser Verstöße kostet Darstellungspunkte, und eine Ausgabe am falschen Ort führt zusätzlich zu falschen Ausgabefolgen.

**Beispiel (Süßigkeitenautomat aus `mealy.js`, Σ = {M, H}, Ω = {B}):**
- ✗ S0 als Doppelkreis. Kante „S0 –M / –→ S1“. Kante S0 –H fehlt. „B“ steht im Zustand S1.
- ✓ S0 –M / ε→ S1, S0 –H / ε→ S0, S1 –M / ε→ S1, S1 –H / B→ S0. Keine Endzustände. Zur Eingabe MHMH gehört die Ausgabe BB.

**Üben/erkennen:** Level 6, Level 15 (Mealy-Übersetzer im Projekt).
`#/mealy?aufgabe=1&modus=vorhersage`, `#/mealy?aufgabe=4&modus=bugjagd`, `#/quiz?ds=6`.

**Schon heute vorhanden:**
- Quiz Welt A: Wahr/Falsch „Ein Mealy-Automat hat wie ein DEA Endzustände“ und die Frage zur Kantenbeschriftung.
- Quiz DS06, Fragen 1–2.
- Warnkästen in M04 („Typische Fehler“), DS06-LK und DS15-LK („Mealy mit Endzuständen oder fehlender ε-Ausgabe“).
- Videoplan Mealy: „ε bedeutet keine Ausgabe“.

---

### P6 – Regularität ohne Schubfachargument beurteilt

**Erläuterung:** Bei „Begründe, dass es keinen endlichen Automaten gibt, der …“ reichen weder ein Beispiel („mein DEA lehnt aaabbb ab“) noch Schlagworte („er kann nicht zählen“, „die Sprache ist unendlich“). Erwartet wird das Schubfachargument für **jeden** DEA:
- Annahme: Es gibt einen DEA mit k Zuständen.
- Betrachte k + 1 Präfixe (nicht k). Zwei davon enden im selben Zustand.
- Hänge an beide **dieselbe** Fortsetzung an. Ein Wort gehört zur Sprache, das andere nicht, der Automat antwortet aber gleich. Widerspruch.
- Sachbezug: Was müsste **unbeschränkt** gezählt werden?

Umgekehrt gibt es drei Fallen. Endliche Sprachen, Zählen modulo k und Zählen bis zu einer Obergrenze sind regulär. Aus „die gegebene Grammatik ist nicht rechtsregulär“ folgt nicht „die Sprache ist nicht regulär“. Bei der Chomsky-Einordnung zählt die **Sprache**, möglichst speziell.

**Beispiel (eigenes, geprüft):**
- L = {aⁿbⁿ | n ≥ 1}.
  - ✗ „Kein DEA, weil er sich unendlich viel merken müsste.“ Ohne Schubfachprinzip gibt es dafür höchstens Teilpunkte.
  - ✓ Annahme: DEA mit k Zuständen. Von den k + 1 Präfixen a¹, …, aᵏ⁺¹ enden zwei, aⁱ und aʲ mit i ≠ j, im selben Zustand. Mit derselben Fortsetzung bⁱ wird aⁱbⁱ ∈ L akzeptiert, also auch aʲbⁱ. Aber aʲbⁱ ∉ L. Widerspruch.
- Grammatik S → AB, A → aA | a, B → bB | b.
  - ✗ „nicht rechtsregulär, also ist die Sprache nicht regulär“.
  - ✓ Die Grammatik ist nicht rechtsregulär (S → AB). Sie erzeugt aber L = {aⁱbʲ | i, j ≥ 1}, und diese Sprache ist regulär (DEA mit 3 Zuständen plus Fehlerzustand). Die Engine bestätigt Regelverstoß und Sprache bis Länge 4.
- „Wörter mit höchstens drei b“.
  - ✗ „braucht einen Keller“.
  - ✓ Beschränktes Zählen geht mit einem DEA (Zustände für 0, 1, 2, 3 b und einen Fehlerzustand).

**Üben/erkennen:** Level 7 (Schubfach), Level 10 (DEA oder Keller?), Level 12 (Grammatik nicht regulär, Sprache regulär), Level 13 („nicht regulär“ begründen), Level 14 (Chomsky, möglichst speziell).
`#/ueberliste?stufe=1` … `?stufe=5`, `#/ueberliste?stufe=bonus` („Warum hilft k+1 nicht?“), `#/sortierer?runde=1`, `#/grammatik?modus=frei` (Klassifikation), `#/quiz?welt=B`, `#/quiz?ds=7`, `#/quiz?ds=14`.

**Schon heute vorhanden:**
- Quiz Welt B: Fragen 1–2 (aⁿbⁿ, höchstens drei b).
- Quiz DS07: alle drei Fragen.
- Quiz Welt C: Wahr/Falsch „S → 1A … nicht rechtsregulär – also ist ihre Sprache nicht regulär“ (falsch) und Zuordnung „endliche Sprache – immer regulär“.
- Quiz DS14, Frage 3: „möglichst speziell“.
- Warnkasten M05 („Mein DEA erkennt aaabbb nicht …“).
- DS07: AB-Aufgabe 3 „DEA möglich? – Achtung, Fallen!“ und Folie „Vier Fallen in der Entscheidungstabelle“.
- Warnkästen in DS13-LK und DS14-LK; Folie DS14 „Typische Abi-Falle“; Achtung-Satz in M10; Zeile in M12.
- Übungsklausur Teil i: „ohne Schubfachprinzip höchstens 2 BE“.
- `sortierer.js`: Hinweis „möglichst speziell“.

---

### P7 – Kellerübergang falsch ausgeführt

**Erläuterung:** Die Beschriftung lautet verbindlich **(oberstes Kellerzeichen, Eingabezeichen) : abzulegende Zeichen**. Drei Fehler kommen immer wieder vor:
- Das gelesene Kellerzeichen wird nicht entfernt. Richtig ist: (A, a) : A lässt den Keller **unverändert**.
- Die Ablage wird von links nach rechts gelesen. Richtig ist: Das **rechte** Zeichen wird zuerst abgelegt, bei „BA“ liegt danach B oben.
- Das # wird bei (#, a) : A# nicht wieder abgelegt.

Dazu kommt die Klammer in falscher Reihenfolge (Eingabe vor Kellerzeichen) beim eigenen Entwurf. Ein einziger falscher Schritt verfälscht alle folgenden Kellerbelegungen und oft auch die Akzeptanzentscheidung.

**Beispiel (eigenes, geprüft):** Belegung vorher A# (A oben), Übergang (A, a) : BA.
- ✗ ABA# (A nicht entfernt) oder AB# (falsche Reihenfolge).
- ✓ A wird entfernt (#), A wird abgelegt (A#), dann B ⇒ **BA#**, B liegt oben.
- (A, b) : ε entfernt A und legt nichts ab.

**Üben/erkennen:** Level 9 (Notation, Ablage), Level 10 (Rückwärts-Aufgaben: Eine unveränderte Belegung kann ein ε-Übergang oder ein Übergang wie (A, x) : A sein).
`#/keller?automat=anbn&modus=sim`, `#/keller?automat=klammern-gemischt&modus=sim`, `#/keller?automat=anbn&modus=rueckwaerts`, `#/quiz?ds=9`.

**Schon heute vorhanden:**
- Quiz Welt B: „Was bedeutet (#, a) : A#?“ und „Was bedeutet (A, b) : ε?“
- Quiz DS09, Frage 2: „Nach (#, a) : A# liegt oben …“
- Warnkasten M07 (alle drei Punkte); Warnkasten DS09-LK („Ablagereihenfolge“, „Gelesenes Kellerzeichen wird entfernt“, „# vergessen“).
- Sprechernotiz DS09: „Typischer Fehler: Ablage von links nach rechts“.
- Warnkasten DS10-LK zu den Rückwärts-Aufgaben.

---

### P8 – Verarbeitung nicht nach Konvention dokumentiert

**Erläuterung:** Bei „Stelle die Verarbeitung dar“ oder „Dokumentiere die Verarbeitung“ zählt das vereinbarte Format. Beim DEA ist das die Zustandsfolge mit gelesenen Zeichen (S0 –a→ S1 –b→ S2 …) und am Ende das Ergebnis **mit Begründung**. Beim Kellerautomaten ist es die Abi-Tabelle mit genau vier Spalten: **Zustand | Belegung Kellerspeicher | oberstes Kellersymbol | verarbeitetes Eingabezeichen**. Typische Abzüge:
- Die erste Zeile S0 | # | – | – fehlt.
- Das oberste Zeichen steht rechts statt links.
- In der Spalte „oberstes Kellersymbol“ steht das Zeichen nach dem Schritt statt davor.
- Der abschließende ε-Übergang hat keine eigene Zeile.
- Der Schlusssatz „Eingabe wird akzeptiert: ja/nein“ fehlt.

Abgrenzung zu P2: Ist die Entscheidung selbst falsch, ist es P2. Ist nur die Form falsch, ist es P8.

**Beispiel (eigenes, geprüft; NKA für aⁿbⁿ mit (#, a) : A#, (A, a) : AA, (A, b) : ε, (#, ε) : # in den Endzustand S2), Eingabe `aabb`:**
- ✗ Spalten Zustand | Keller | Eingabe, Keller als „#A“, „#AA“, …, ohne die letzte Zeile und ohne Schlusssatz.
- ✓ So sieht die Tabelle richtig aus:

| Zustand | Belegung Kellerspeicher | oberstes Kellersymbol | verarbeitetes Eingabezeichen |
|---|---|---|---|
| S0 | # | – | – |
| S0 | A# | # | a |
| S0 | AA# | A | a |
| S1 | A# | A | b |
| S1 | # | A | b |
| S2 | # | # | ε |

Eingabe wird akzeptiert: ja (S2 ist Endzustand, Eingabe vollständig gelesen).

**Üben/erkennen:** Level 1–2 (Zustandsfolge), Level 9–10 (Kellertabelle).
`#/arena?stufe=1&ueben=1` (Schritt-Animation), `#/keller?automat=anbn&modus=tabelle&wort=aabb`, `#/keller?automat=code-ox&modus=tabelle`, `#/quiz?ds=9`.

**Schon heute vorhanden:**
- Quiz Welt B: Frage zur Spalte „Belegung Kellerspeicher“ (Distraktor „oberstes Zeichen rechts“).
- Quiz DS09, Frage 3: erste Zeile.
- M12: Zeilen „Stellen Sie … dar“ und „Dokumentieren Sie …“.
- Warnkasten DS09-LK („Tabelle“).
- Videoplan: „Zustandsfolge in der Abi-Schreibweise“ und „Spalte oberstes Kellersymbol = vor dem Schritt“.
- Übungsklausur Teil h: Folgefehler kostet 1 BE.

---

### P9 – Grammatik oder Ableitung formal fehlerhaft

**Erläuterung:** Eine Grammatik gibst du vollständig an: Nichtterminale N, Terminale T, Startsymbol, Produktionsregeln P. Nichtterminale schreibst du groß, Terminale klein, als Ziffern oder Sonderzeichen. In Regeln steht →, in Ableitungen ⇒. Jeder Ableitungsschritt ist genau eine Regelanwendung. Die Ableitung ist erst fertig, wenn nur noch Terminale dastehen. „Regulär“ heißt im Abitur **rechtsregulär**: nur A → aB, A → a, A → ε. Regeln wie S → Sa oder A → +xA sind es nicht.

Bei der Übersetzung DEA → Grammatik werden die ε-Regeln für Endzustände oft vergessen. Bei der Mehrdeutigkeit werden zwei Ableitungsreihenfolgen mit zwei verschiedenen **Ableitungsbäumen** verwechselt. Jeder dieser Verstöße kostet Darstellungspunkte. Eine fehlende ε-Regel macht die Grammatik zudem inhaltlich falsch.

**Beispiel (eigenes, geprüft):**
- ✗ „S → aSb → aabb“ (Pfeil falsch, N und T fehlen).
- ✓ N = {S}, T = {a, b}, Startsymbol S, P: S → aSb | ab. Ableitung: S ⇒ aSb ⇒ aabb.
- DEA „endet auf ab“ (siehe P2) als rechtsreguläre Grammatik: S0 → aS1 | bS0, S1 → aS1 | bS2, S2 → aS1 | bS0 | ε.
  - ✗ Ohne S2 → ε wird kein einziges Wort erzeugt.

**Üben/erkennen:** Level 11 (Ableitung, Ableitungsbaum), Level 12 (rechtsregulär, Übersetzungsrezept), Level 13 (Mehrdeutigkeit: zwei Bäume).
`#/rallye?aufgabe=2`, `#/rallye?aufgabe=12` (if-then-else, Baum-Modus), `#/grammatik?challenge=3`, `#/grammatik?modus=frei` (Regel-Check, Grammatik → NEA/DEA), `#/quiz?welt=C`.

**Schon heute vorhanden:**
- Quiz Welt C: G = (N, T, S, P), Regelformen rechtsregulär, „Welche Regel ist NICHT rechtsregulär?“, DEA-Übergang → Regel, Endzustand → Si → ε, Ableitungsnotation ⇒ (mit Erklärung „→ steht in den Regeln“), Mehrdeutigkeit.
- Quiz DS11–DS13.
- Warnkasten M08 („→ und ⇒ verwechselt; mehrere Ersetzungen in einem Schritt; endet mit Nichtterminalen“).
- Warnkästen in DS11-LK, DS12-LK („ε-Regeln vergessen“, „aB vs. Ba“, „Zwei Terminale“), M09 und DS13-LK („Mehrdeutigkeit mit zwei Ableitungsreihenfolgen verwechselt“).
- Videoplan: „→ in Regeln, ⇒ in Ableitungen“.

---

### P10 – Operator verfehlt

**Erläuterung:** Die Antwort passt nicht zum Operator. Beispiele:
- „erläutern“ wird ohne Sachzusammenhang beantwortet, etwa „In S1 wurde a gelesen“ statt der Bedeutung für die Problemstellung. Das gilt auch für die Bedeutung des Kellerspeichers.
- „begründen“ wird ohne Argument beantwortet, also ohne „da/weil …“.
- „beschreiben“ der Sprache bleibt unpräzise: kein Bezug auf das ganze Wort, keine Menge, Grenzfälle wie ε oder n ≥ 1 offen.
- „nennen“ wird mit langen Erklärungen beantwortet (kostet Zeit, nicht Punkte).

Im Erwartungshorizont gibt es für reine Nennungen bei „erläutern/begründen“ nur einen Teil der BE. Merkhilfe aus M12: nennen = ohne Begründung, begründen = Argument, erläutern = erklären **plus** Sachzusammenhang, beurteilen = Urteil + Begründung.

**Beispiel (eigenes, geprüft; DEA „endet auf ab“ aus P2):**
- „Beschreibe die Sprache.“
  - ✗ „Wörter mit a und b, am Ende ab.“
  - ✓ „Akzeptiert werden genau die Wörter über {a, b}, die auf ab enden: L = {w ∈ {a, b}* | w endet auf ab}. Beispiele: aab ∈ L, ba ∉ L, ε ∉ L.“
- „Erläutere die Bedeutung von S1.“
  - ✗ „S1 wird mit a erreicht.“
  - ✓ „Der Automat ist genau dann in S1, wenn das bisher gelesene Wort auf a endet. Es fehlt noch ein b, damit akzeptiert wird.“
- „Begründe, dass S1 kein Endzustand sein darf.“
  - ✗ „S1 ist kein Endzustand.“
  - ✓ „… da sonst das Wort a akzeptiert würde (S0 –a→ S1), obwohl a nicht auf ab endet.“

**Üben/erkennen:** alle Level, besonders Level 2 (Bedeutung von Zuständen), Level 10 (Bedeutung des Kellers im Sachzusammenhang), Level 14 (Abi-Trainingszirkel), Level 15 (eigene Aufgabe mit Operatoren).
`#/detektiv`, `#/keller?automat=kriterium-y` (Bedeutung des Kellers), `#/quiz?ds=2`, `#/quiz?ds=10`, `#/quiz?ds=15`.

**Schon heute vorhanden:**
- Quiz DS02, Frage 1 (Bedeutung eines Zustands); Quiz DS10, Frage 2 (Bedeutung des Kellerspeichers); Quiz DS15, Frage 2 (Operator „zeichnen“).
- Warnkasten DS02-LK („Bedeutung = Wiederholung des Graphen“).
- DS10: Warnkasten in der LK und Folienkarte „Zu vage“.
- M08/DS11-LK: „Nicht ableitbar ohne Begründung“.
- DS15-LK: „Aufgaben ohne Operatoren“.
- M12: Faustregeln.

---

## Vorschlag für die Konstante (Format wie Algo Quest `src/domain.js`)

```js
const FALLEN = [
  { p: 'P1', titel: 'Automat unvollständig, Fehlerzustand-Hinweis fehlt', text: 'jeder Zustand für jedes Zeichen aus Σ einen Übergang oder Hinweissatz; vor Komplement/Minimierung vervollständigen; Mealy-Graph vollständig' },
  { p: 'P2', titel: 'Akzeptanz falsch entschieden', text: 'Zustand nach dem letzten Zeichen zählt; NEA/NKA: ein akzeptierender Lauf genügt; NKA: Endzustand nach vollständiger Eingabe, nicht „Keller leer“' },
  { p: 'P3', titel: 'Entwurf nicht an Grenzfällen getestet', text: 'Neuanfang bei „enthält/endet auf“, ε, kürzestes Wort, ein Zeichen zu viel; Grammatik erzeugt zu viel/zu wenig' },
  { p: 'P4', titel: 'Unterscheidbarkeit ohne konkretes Wort begründet', text: 'unterscheidendes Wort mit beiden Verarbeitungen; Äquivalenz über Folgezustände; „mindestens n“ = n paarweise unterscheidbare Präfixe' },
  { p: 'P5', titel: 'Mealy mit Endzuständen oder ohne ε', text: 'keine Endzustände, „e / a“ an der Kante, leere Ausgabe ε (nicht N/–), Σ und Ω, vollständiger Graph' },
  { p: 'P6', titel: 'Regularität ohne Schubfachargument beurteilt', text: 'für jeden DEA: k + 1 Präfixe, dieselbe Fortsetzung, Widerspruch; endlich/modulo/Obergrenze sind regulär; Grammatik nicht regulär ≠ Sprache nicht regulär' },
  { p: 'P7', titel: 'Kellerübergang falsch ausgeführt', text: '(oberstes Kellerzeichen, Eingabe) : Ablage; gelesenes Zeichen wird entfernt, rechtes Zeichen zuerst abgelegt, # wieder ablegen, ε = nichts' },
  { p: 'P8', titel: 'Verarbeitung nicht nach Konvention dokumentiert', text: 'Zustandsfolge S0 –a→ S1 mit Begründung; Kellertabelle mit vier Spalten, erste Zeile S0 | # | – | –, oberstes links, ε-Schritt eigene Zeile, „akzeptiert: ja/nein“' },
  { p: 'P9', titel: 'Grammatik oder Ableitung formal fehlerhaft', text: 'N, T, Startsymbol, P; → in Regeln, ⇒ in Ableitungen, je Schritt eine Regel, am Ende nur Terminale; rechtsregulär nur A → aB | a | ε; Mehrdeutigkeit = zwei Bäume' },
  { p: 'P10', titel: 'Operator verfehlt', text: '„erläutern“ ohne Sachzusammenhang, „begründen“ ohne Begründung, Sprache nicht präzise beschrieben (Bedingung + Menge), Fachbegriffe fehlen' }
];
```

---

## Begründung der Auswahl

**Kriterien:**
1. Die Falle tritt in den Abi-Aufgabentypen auf, die nach PLAN.md (Abi-Bezüge je DS) jedes Jahr wiederkehren: Verarbeitung darstellen, Bedeutung erläutern, DEA/Mealy entwickeln, Zustände zusammenfassen, Grenzen begründen, Kellertabelle, Bedeutung des Kellers, Grammatik entwickeln oder einordnen.
2. Die Falle steht schon heute mehrfach und unabhängig in Warnkästen der Handreichungen und Merkblätter, im Quiz oder in den Bewertungshinweisen der Übungsklausur.
3. Die Liste deckt die ganze Einheit ab: Welt A (P1–P5), Welt B (P2, P6–P8), Welt C (P6, P9), dazu der Operator übergreifend (P10).
4. Jede Falle lässt sich mindestens einem App-Modul zuordnen, sodass das Feld `fallen` in Lab-Aufgaben und das Fallen-Profil sinnvoll befüllt werden können.

**Parallele zu Algo Quest:** P8 (Dokumentation/Tabelle) und P10 (Operator verfehlt) entsprechen bewusst den gleichnamigen Algo-Quest-Fallen, damit das Portal sie vergleichen kann.

**Zusammengelegt (statt eigener Nummer):**
- Kellerakzeptanz „Keller leer“ → P2. So steht die Akzeptanz für DEA, NEA und NKA an einer Stelle; P7 bleibt rein mechanisch.
- Chomsky-Einordnung, „Grammatik nicht regulär ⇒ Sprache nicht regulär“ und endliche/beschränkte Sprachen → P6 (gemeinsames Thema: Regularität richtig beurteilen).
- Mehrdeutigkeit (zwei Bäume) und DEA → Grammatik (ε-Regeln) → P9.
- Bedeutung von Zustand/Keller im Sachzusammenhang und „Sprache nicht formal angegeben“ → P10. Beides ist ein „erläutern/beschreiben ohne Sachbezug bzw. ohne Präzision“, wie AQ-P10 „kein Bezug zum Material“.
- Rückwärts-Aufgabe (Eingabewort aus Kellerfolge) → P7/P8.

**Verworfen:**
- **Turingmaschine** (Kopfbewegung vergessen, Blank in Σ): Laut PLAN.md Abschnitt 2 eine Ergänzung über den KC-Kern hinaus (Ausblick DS16), nicht abiturrelevant.
- **Teilmengenkonstruktion / NEA als eigene Falle:** Level 8 ist Bonus. Die NEA-Akzeptanz steckt in P2, der Nichtdeterminismus nach der Übersetzung Grammatik → Automat in P9.
- **Formale DEA-Definition** (E statt F, F keine Menge, δ keine Funktion): kommt vor, bringt im Abitur aber nur selten eigene BE. Mögliche Nennung als Unterpunkt von P1 oder P9, falls Frank das möchte.
- **Syntax vs. Semantik (F1):** Das Missverständnis ist häufig, aber nur wenige BE wert (Nennen/Vergleichen).
- **Σ unendlich gewählt** (DS15) und **„zu ehrgeiziges“ Sprachdesign:** Das sind Projektfehler, keine Abiturfallen.

---

## Unsicherheiten bei der Fachnotation (bitte prüfen)

1. **Name des Fehlerzustands:** PLAN.md erlaubt „F_err oder „F“ nur wenn nicht mit Endzustand verwechselbar“. „F“ ist aber zugleich die Endzustandsmenge in A = (Q, Σ, δ, S0, F). Ich verwende in der Liste nur **F_err** (wie Engine und Minimierer). Vorschlag: „F“ als Zustandsname in PLAN.md ganz streichen.
2. **Mealy und Fehlerzustand-Hinweis:** PLAN.md verlangt für Mealy einen „vollständigen Übergangsgraphen“. Ob der Hinweissatz auch bei Mealy zulässig ist, steht dort nicht. In P1/P5 steht deshalb nur „vollständig“, ohne den Hinweis als Ausweg anzubieten.
3. **Linksableitung:** PLAN.md verlangt nur „Ableitung mit ⇒“. M12 schreibt „(Linksableitung)“, DS11-LK „pro Schritt ein Nichtterminal ersetzen“. In P9 steht deshalb nur „je Schritt eine Regelanwendung“. Eine Linksableitung empfehle ich, als Pflicht aus den Ergänzenden Hinweisen kann ich sie nicht belegen.
4. **Gewicht des Schubfachprinzips:** DS07-LK sagt, „der DEA bräuchte unendlich viele Zustände“ sei mit Sachbezug „oft ausreichend“. Die eigene Übungsklausur gibt ohne Schubfachprinzip höchstens 2 BE. Wie streng der offizielle Erwartungshorizont das wertet, ist hier nicht belegt. Den Begriff „Pumping-Lemma“ verwende ich bewusst nicht, weil PLAN.md nur das Schubfachargument vorsieht.
5. **Leerer Keller in der Tabelle:** PLAN.md legt nicht fest, wie ein ganz leerer Keller in der Spalte „Belegung Kellerspeicher“ notiert wird (die Engine schreibt ε). In den Beispielen kommt der Fall nicht vor.
6. **BE-Angaben** („1 BE Abzug“, „höchstens 2 BE“) stammen aus unserem eigenen Erwartungshorizont der Übungsklausur, nicht aus offiziellen Bewertungsvorgaben. In Materialien sollten sie so gekennzeichnet werden.

---

## Lücken, die beim Einbau auffallen

- Zu **P10** gibt es im Quiz keine Frage, die „beschreiben“, „begründen“ und „erläutern“ gegenüberstellt (bisher nur DS15 „zeichnen“). Eine Zuordnungsfrage in Welt D oder DS14 wäre naheliegend.
- Zu **P3** fehlt eine Quizfrage zum Neuanfang (z. B. „Wohin führt b aus S3 bei ‚endet auf aba‘?“).
- Zu **P8** fehlt eine Quizfrage zur Spalte „oberstes Kellersymbol“ (vor dem Schritt) und zur eigenen Zeile für den ε-Übergang.
- Die Quizfragen haben noch kein Feld `fallen`. Wenn es ergänzt wird, lässt sich das Fallen-Profil schon im Gastmodus aus den Quizfehlern ableiten.
