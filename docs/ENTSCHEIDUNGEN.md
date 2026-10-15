# Architekturentscheidungen

Kurzformat: Datum · Entscheidung · Begründung · Alternativen. Neueste oben.

## 2026-10-15 · Live-Runden (1.24.0, Fähigkeit „live“)
Frank wünscht „so etwas passend zum AutomatenLab“ zur Vertragsfähigkeit `live` (Vertrag v1.3 §7: Live-Runden im Kurs
über Server-Sent Events, ohne Auswirkung auf Lab-Punkte). Umsetzung als Klassen-Quiz: Die Lehrkraft startet im Reiter
📡 Live eine Runde (5/8/10 Fragen aus dem Level-Quiz einer Welt, der Akzeptor-Arena Stufe 1–3 oder dem
Chomsky-Sortierer; 15–60 s je Frage oder ohne Zeitlimit) und zeigt `#/live?kurs=…` auf dem Beamer; sie schaltet weiter
und deckt auf. Schüler antworten am Gerät (Startseite „📡 Live-Runde“). **Flüchtig im Arbeitsspeicher** (keine Tabelle,
keine Migration): Eine Live-Runde ist eine Unterrichtsminute, kein Lernstand; nach dem Schließen oder 3 h ohne Aktion
ist sie weg, Löschaufträge des Portals räumen sofort auf. Folge: Ein Neustart des Servers (Deploy) beendet laufende
Runden – Deploys nicht während des Unterrichts (gilt ohnehin). **Ohne Namen auf dem Beamer** (nur Verteilungen);
jede und jeder sieht das eigene Ergebnis und Rundenpunkte (100 je richtige Antwort + bis zu 50 für Schnelligkeit),
die nirgends gespeichert werden. Antwort-Kennungen werden erst nach dem Mischen vergeben, die richtige Antwort geht
erst beim Aufdecken an die Geräte (§9). Server-Sent Events statt Polling (wie im Vertrag genannt); `compression`
lässt `text/event-stream` aus, `X-Accel-Buffering: no` für den Proxy. Verworfen: Speicherung in SQLite (unnötige
Personendaten), Rangliste mit Namen auf dem Beamer (Bloßstellung; die Rangliste bleibt die freiwillige Kurs-Rangliste),
WebSockets (zusätzliche Abhängigkeit, Proxy-Konfiguration).

## 2026-10-15 · Verbund-Vertrag 1.3 (1.23.0)
AutomatenLab folgt Vertrag v1.3: `/sso/start` holt bei jedem Wechsel aus dem Portal ein frisches Token (neue Kurse sind
sofort bekannt), eine bestehende Sitzung wird erst nach vollständiger Prüfung ersetzt; `keine_berechtigung` zeigt den
rollenneutralen Text des Portals; Manifest `vertrag: "1.3"` mit `urls.ssoStart`. Die Fähigkeit `challenges` entfällt im
Manifest, weil §7 nur bekannte Namen vorsieht – Vorschlag zur Aufnahme in `docs/VERBUND.md` §7. Die §9-Sandbox-Regel
betrifft AutomatenLab nicht (keine Ausführung von Schüler-Code, nur Auswertung von Automaten als Daten mit Grenzen).
Verworfen: `challenges` als eigene, nicht gelistete Fähigkeit behalten (Vertrag erlaubt neue Namen nur als Nebenversion
des Vertrags).

## 2026-10-15 · Boss der Welt D, Editor-Ausbau, Abnahme-Hilfe (1.22.0)
**Boss D** (Bonus, eA): 15 eigene Aufgaben zu Sprachdesign und Turingmaschine; Turingmaschinen erscheinen als Graph
(`tmToGraph`), Bandinhalt, Akzeptanz und Einsen des Fleißigen Bibers werden gegen die Engine kontrolliert. Die
Boss-Level der Materialien (DS06, DS10, DS14) bleiben unverändert; für die App gibt es `APP_BOSS_NIVEAU` (A–D).
Das Manifest nennt jetzt `umfang.bosse = 4` (Bosse der App). **Editor:** zwei weitere Aufgabenarten –
**Detektiv-Fall** (Automat im Editor, vier Beschreibungen, die markierte ist richtig; ohne Prüfprädikat gibt es bei
falscher Wahl kein Gegenbeispiel) und **Grammatik-Challenge** (Mustergrammatik; geprüft wird die Sprache bis Länge 8
bei |Σ| = 2, 6 bei 3, sonst 5; optional „rechtsregulär verlangen“) – sowie **Kopieren** in einen anderen eigenen Kurs
(als Entwurf, ohne Ergebnisse). Migration 10 legt `eigene_aufgaben` mit erweitertem CHECK neu an, IDs bleiben.
**Abnahme-Hilfe:** `qa/abnahme.mjs` baut einen Beispielkurs mit Fantasie-Schülern auf und speichert 31 Screenshots nach
`docs/abnahme/` (verkleinert auf 256 Farben); `docs/ABNAHME.md` verlinkt sie je Schritt.

## 2026-10-14 · Klassen-Challenges (1.21.0)
Frank: „Beides wählbar, nur Challenge-Liste“. Die Lehrkraft legt im Kurs (Reiter 🎯 Challenges) eine Challenge an:
Titel, Zeitraum (höchstens 60 Tage), was zählt – **Training** (richtige Antworten in beendeten Runden von Arena,
Unterscheide! oder Sortierer) oder **ausgewählte Aufgaben** (im Zeitraum erstmals gelöst; Katalog und eigene
Aufgaben des Kurses) – und die Wertung: **Einzel** (Rangliste mit Anzeigenamen, gleiche Werte = gleicher Platz) oder
**Team** (2–6 zufällige, gleich große Teams; Neue kommen ins kleinste Team; Schüler sehen nur Team-Summen, Ø und den
eigenen Beitrag, die Lehrkraft auch die Zusammensetzung). Die Wertung steht **nur in der Challenge-Liste** und auf dem
Beamer-Board – keine zusätzlichen Punkte. Gezählt wird beim Abruf aus `training` bzw. `fortschritt` (keine doppelte
Buchführung). Nach dem Ende einmalig Abzeichen „Challenge gewonnen“, „Auf dem Podest“ bzw. „Teamsieg“ (nur mit Wert
> 0); die Lehrkraft kann vorzeitig beenden und Sieger-Urkunden drucken. Höchstens 10 laufende/geplante Challenges je
Kurs. Tabellen `challenges` (mit dem Kurs gelöscht) und `challenge_teams` (mit Challenge bzw. Konto gelöscht).

## 2026-10-14 · Aufgaben-Editor für Lehrkräfte (1.20.0)
Frank wünscht einen Editor. Lehrkräfte legen je Kurs eigene **Quizze** (1–12 Fragen: Multiple Choice mit 2–4
Antworten oder Wahr/Falsch mit 2–3 Begründungen, optionale Erklärung) und **Baukasten-Challenges** (Aufgabentext,
Stufe, Musterautomat als DEA in der Übergangstabelle, bis zu drei Tipps) an. Sie laufen in den vorhandenen Modulen
(`#/quiz?eigen=<nr>`, `#/baukasten?eigen=<nr>`) über dieselbe Prüf-API (ID `eigen:<nr>`); Lösungen liegen nur in der
Datenbank (Vertrag §9), Beispielwörter erzeugt der Server aus dem Musterautomaten, geprüft wird die Sprache.
Entscheidungen: (1) **Keine Punkte, keine Abzeichen** – Punkte gehören zum Konto, eine Kursaufgabe zählte sonst in
fremden Kursen und im Portal mit; die Lehrkraft sieht je Aufgabe „versucht/gelöst“. (2) Schüler sehen eine Aufgabe
erst nach **Freigabe** und nur im eigenen Kurs (sonst 404). (3) Ändert die Lehrkraft Fragen oder Automat, werden die
bisherigen Ergebnisse zurückgesetzt (der Titel allein nicht). (4) Löscht das Portal den Kurs, verschwinden Aufgaben
und Ergebnisse; löscht es das Konto der Lehrkraft, bleibt die Aufgabe beim Kurs, der Autor wird geleert.
(5) Höchstens 60 Aufgaben je Kurs, Texte mit Längengrenzen, Ausgabe nur als Textknoten. Nebenbei behoben: Der
Baukasten (und andere Tabellen) war auf dem Smartphone breiter als der Bildschirm.

## 2026-10-14 · Boss-Kämpfe der Welten A–C wie Algo Quest (1.19.0)
Übernommen aus Algo Quest: Kampf auf Zeit (A 20, B/C 25 Minuten), 8 Aufgaben nach Mix (3 Basis, 3 Standard, 2 Profi,
leichte zuerst), keine Rückmeldung während des Kampfes, Antworten werden gespeichert und erst am Ende gewertet
(30 s Kulanz), 12 Stunden Pause, bester Versuch zählt (zu den Punkten, in Ranglisten und Portal-Kennzahlen),
besiegt ab 50 %, Abzeichen je Boss und „Makellos“. Kurs-Einstellung `boss`: automatisch ab 60 % der Level-Punkte
der Welt im Kursumfang (Standard), offen oder gesperrt; bei mehreren Kursen gilt die günstigste. Abweichungen:
(1) Bosse nur für die Welten A–C – passend zu den Boss-Leveln der Materialien (DS06, DS10, DS14); Welt D hat zwei
Bonus-Level. (2) Aufgaben im **Format des Level-Quiz** (Multiple Choice, Wahr/Falsch mit Begründung, Zuordnung) mit
abgebildetem Automaten bzw. Grammatik – geprüft wird wie beim Quiz, Wahr/Falsch und Zuordnung auch zur Hälfte.
(3) Jede Aufgabe mit Automat oder Grammatik hat eine **Kontrolle gegen die Engine** (`test/boss-inhalte.test.js`):
richtige Option richtig, jede falsche falsch (der Test fand dabei einen Fehler im Entwurf: „gerade Anzahl a und
endet auf b“ braucht 3, nicht 4 Zustände). (4) Im Grundkurs werden nur Aufgaben „gA + eA“ gezogen, wenn genug da sind
(Welt A); die Bosse B und C sind eA und erscheinen im Grundkurs als „freiwillig“. (5) Lehrkräfte dürfen jederzeit
kämpfen und sehen den Pool mit Lösungen unter 📖 Aufgaben.

## 2026-10-14 · Rangliste, Beamer-Board und Urkunden wie Algo Quest (1.18.0)
Frank wünscht die Funktionen von Algo Quest. Übernommen: Rangliste für Schüler (gesamt oder je Welt, gleiche Punkte =
gleicher Platz, eigener Eintrag markiert, keine Konto-IDs), Beamer-Board (Top 15, Kursdurchschnitt je Welt, letzte 8
Abzeichen, lädt alle 20 s neu), Urkunden (eine A4-Seite je Schüler, im Browser gedruckt, Optionen wie Algo Quest).
Abweichungen: (1) **Beide Anzeigen standardmäßig aus** (Algo Quest: Rangliste an) – bisher galt hier „Schüler sehen
keine Rangliste“; die Lehrkraft entscheidet je Kurs. (2) Das Board hängt an einem **zufälligen Link**
(`/board/<16 Zeichen>`) statt am Kurscode, den die Plattform nicht kennt; „Neuen Link erzeugen“ macht den alten
ungültig. (3) **Erfolge** sind die Abzeichen aus der Tabelle `abzeichen` – keine neue Tabelle, Name immer aktuell.
(4) Ränge der Urkunde im Thema der Einheit: Startzustand · Zwischenzustand · Übergangsprofi · Endzustand in Sicht ·
Akzeptiert! (Schwellen 0/10/30/55/80 % der Level-Punkte im Kursumfang wie Algo Quest). Manifest: `faehigkeiten` um
`scoreboard`, `beamer`, `urkunden` und das schon vorhandene `fallen-profil` ergänzt.

## 2026-10-14 · Ziel nach der Anmeldung passt zur Rolle (1.17.1)
Angleichung an Algo Quest 2.8.3: Wer sich mit Ziel „/“ anmeldet (Knopf auf der Startseite) und Lehrkraft oder Admin
ist, landet im Lehrkraft-Bereich (`/#/lehrkraft`); Schüler, deren Ziel der Lehrkraft-Bereich wäre, landen auf der
Startseite. Alle anderen Ziele – vor allem die Deep-Links der QR-Codes – bleiben für jede Rolle unverändert
(Regel 1). Die Startseite zeigt angemeldeten Lehrkräften einen Hinweis mit „Zum Lehrkraft-Bereich“.

## 2026-10-14 · Lizenz: Code MIT, Material CC BY-SA 4.0 (1.17.0)
Frank hat entschieden: Programmcode unter MIT (`LICENSE`, `package.json`), Unterrichtsmaterial unter CC BY-SA 4.0
(`materials/LIZENZ.md`). Jedes erzeugte Dokument trägt „CC BY-SA 4.0 Frank Juchim“ in der Fußzeile, jede Folie rechts
unten „CC BY-SA 4.0 · Frank Juchim“, die Video-Folien am Ende der Fußzeile – wer ein PDF weitergibt, gibt die Lizenz
mit. Die Aufgabentexte, Tipps und Erklärungen in `inhalte/` zählen als Material. Ausgenommen: Schriften (eigene
Lizenzen) und die unveränderten Portal-Kopien (`src/jwt.js`, `src/security.js`, `scripts/vertrag_pruefen.js`). Das
Repository bleibt privat und wird nicht geteilt; die Lizenz regelt nur die Weitergabe einzelner Materialien. Alle
Materialien und PDFs wurden neu erzeugt. Verworfen: CC BY-NC-SA (das NC-Merkmal schließt Fortbildungen und
Schulbuch-Kooperationen unklar aus) und „alle Rechte vorbehalten“ (verhindert das Teilen unter Kolleginnen und Kollegen).

## 2026-10-14 · Fallen-Nummern in den Materialien (1.16.0)
Jeder Warnkasten („Darauf achten“, „Typische Fehler“) der Lehrkraft-Handreichungen DS01–DS15 und der Merkblätter
M02–M09 nennt am Ende die Fallen, die er behandelt („Abitur-Fallen: P2 Akzeptanz falsch entschieden · …“). Die
Zuordnung steht beim Aufruf im Build-Skript (`D.warn({ titel, fallen }, …)`), Titel und Texte kommen aus
`app/js/data/fallen.js` – dieselbe Quelle wie App und Fallen-Profil. Damit die Nummern für Schüler etwas bedeuten,
hat der Abi-Spickzettel M12 einen neuen Abschnitt „C Die zehn Abitur-Fallen“ (Nr., Falle, So vermeidest du sie).
Ohne Nummer bleiben der Warnkasten zur Turingmaschine (DS16, laut Liste keine Abitur-Falle) und die Dreh-Hinweise der
Videoplanung. Neu erzeugt wurden nur die betroffenen Dateien (Handreichungen, Merkblätter, M12); die übrigen PDFs sind
unverändert. Verworfen: Nummern an jedem einzelnen Spiegelstrich (unruhig, und ein Strich gehört oft zu zwei Fallen).

## 2026-10-14 · Fallen je Quizfrage (1.15.0)
Alle 87 Fragen des Level-Quiz (Welt A–D, Exit-Tickets DS01–DS16) haben eine Fallen-Liste (`QUIZ_FALLEN` in
`inhalte/quiz.js`, gleiche Reihenfolge wie die Fragen, Test prüft Länge und Nummern). Fragen ohne Bezug zu einer der zehn
Abitur-Fallen bleiben leer (Turingmaschine, Halteproblem, Church-Turing, Begriffe wie Σ*). Weil das Quiz keine
Fehlversuche kennt (gewertet wird der erste Durchgang), zählt im Fallen-Profil jede im ersten Durchgang nicht voll
richtig beantwortete Frage bei ihren Fallen („falsch im Quiz“); die Daten dafür speichert der Server ohnehin.
Die Liste der Fallen am Quiz (Katalog) ist die Vereinigung der Fragen. Zuordnung nach den Kurztexten der freigegebenen
Liste; Grenzfälle: formale DEA-Definition und „Bestandteile“ → P1 (vollständig angeben, wie in der Liste unter
„Verworfen“ als Unterpunkt vorgeschlagen), Bedeutung von Zustand oder Keller im Sachzusammenhang → P10.

## 2026-10-14 · Fallen-Profil und Videoreihe unter Materialien (1.14.0)
**Fallen-Profil:** Frank hat `docs/einheit/FALLEN.md` freigegeben. Die Fallen hängen am Aufgabentyp (Spalte „Module“
der Liste), nicht an jeder einzelnen Aufgabe – so bekommt jede neue Aufgabe ihre Fallen automatisch, und die Zuordnung
steht an einer Stelle (`FALLEN_JE_TYP` in `app/js/data/fallen.js`). Gezählt werden wie in Algo Quest die Fehlversuche
in Aufgaben mit dieser Falle, dazu „Lösung angesehen“; „betrifft“ = Schüler mit Fehlversuch oder angesehener Lösung.
Das Level-Quiz zählt keine Fehlversuche (erster Durchgang wird gewertet) und fließt erst ein, wenn jede Quizfrage
eigene Fallen hat. Die Turingmaschine hat bewusst keine Falle (siehe „Verworfen“ in der Liste).
**Videoreihe:** Aufnahmen gibt es noch nicht (weder im Repository noch im Google Drive). „Passend unter Materialien“
heißt deshalb jetzt: Die Folien jedes Videos liegen beim Level, zu dem das Video gehört (`app/js/data/videos.js`) –
Schülerfassung, Lehrkraftfassung mit Sprechertext (Notizseiten), Original. Level 1 ist die öffentliche Material-Demo,
deshalb gehört auch Video V1 dazu. Die Aufnahmen kommen an dieselbe Stelle, sobald es sie gibt.

## 2026-10-14 · Lokale Prüfung statt GitHub Actions (Übergang)
Seit dem 14.10. startet GitHub Actions für das private Repository keine Jobs mehr (vermutlich Minuten bzw. Ausgabenlimit).
Frank: „Wir warten darauf nicht mehr.“ Freigabe zum Merge ist dann `bash qa/pruefung_lokal.sh` mit demselben Ablauf wie
die CI (Tests, Image wie CapRover, Material-Rechte, Vertrag, alle Deep-Links angemeldet und als Gast) und „PRÜFUNG GRÜN“
für genau den Commit, der gemergt wird; das Ergebnis steht im Merge-Commit. Damit künftig weniger Minuten anfallen,
läuft die GitHub-Prüfung nur noch für Pull Requests und `main` (vorher zusätzlich bei jedem Push auf Feature-Branches,
also doppelt). Hinter dem Proxy einer Cloud-Sitzung gibt das Skript dem Docker-Build Proxy und CA nur für diesen Lauf mit.

## 2026-10-14 · Materialpaket als Release-Anhang, Erklärvideos nur verlinkt (Phase 6)
**Materialpaket:** Ein Tag `v*` (z. B. `v1.13.0`) startet `.github/workflows/materialpaket.yml`: Alle Materialien werden
aus den geprüften Daten neu gebaut (dabei prüft `build_all.sh` jeden Automaten und jede Grammatik), das
Lehrkräfte-Paket und die PDFs der Plattform hängen als ZIP am Release. Das Repository ist privat, die Lösungen sind
also nicht öffentlich. Die PDFs werden nicht im Workflow neu erzeugt (LibreOffice im Runner wäre langsam und
schriftabhängig), sondern wie committet gepackt – `npm run materials:pdf` bleibt Teil jeder Material-Änderung.
**Erklärvideos:** `app/js/data/videos.js` ordnet die Videos der Reihe (V1–V9, O1–O2) Modulen und Leveln zu; Knopf und
Link erscheinen erst mit eingetragener Adresse. Nur verlinkt (neuer Tab), nie eingebettet – ein eingebettetes Video
lüde Ressourcen eines fremden Dienstes (Regel 4). Offen: Wo die Videos liegen (eigener Server, Schulplattform oder ein
Videodienst) entscheidet Frank; danach Adressen eintragen und Video-QR-Codes auf die Merkblätter.

## 2026-10-14 · Kurs-Einstellungen: Level-Art und Auftrag statt Sperren (PR 7)
Algo Quest schaltet Welten je Kurs frei und sperrt den Rest. Im AutomatenLab stehen Aufgaben als QR-Codes auf
gedruckten Blättern (Regel 1: jeder Deep-Link führt genau zur Aufgabe). Deshalb **sperrt die Kurs-Einstellung nichts**:
Die Lehrkraft legt je Level fest, ob es Pflicht, Vertiefung, Bonus oder „später“ ist (Vorgabe aus `worlds.js`), und
kann einen kurzen Auftrag (≤ 400 Zeichen, bis zu vier Level hervorgehoben) auf die Startseite stellen. „Später“ graut
ein Level auf der Level-Karte aus. Im Grundkurs (Kursart gA) tragen eA-Level den Hinweis „freiwillig (eA)“. Wer in
mehreren Kursen ist, sieht je Level die verbindlichste Art und alle Aufträge. Gespeichert in `kurse.einstellungen`
(keine Migration nötig), für Schüler über `GET /api/meine-kurse`. Verworfen: echte Sperren (bräche QR-Codes und das
selbstständige Vorarbeiten), Aufträge mit Fälligkeit und Abgabe (das macht im Unterricht die Lehrkraft, nicht die App).

## 2026-10-14 · Aufgaben-Vorschau und häufige falsche Antworten (PR 6b)
**Vorschau:** Algo Quest zeigt Lehrkräften jede Aufgabe mit eingesetzter Lösung. AutomatenLab hat zwölf sehr
verschiedene Module; eine eigene Vorschau-Darstellung je Modul wäre doppelte Arbeit. Stattdessen öffnet die Vorschau
das echte Modul (`&vorschau=1`) mit einer eigenen Quelle (`vorschauQuelle`): Der Server rechnet wie sonst, speichert
aber nichts – den Stand hält der Browser. Die Aufgabe startet im Zustand „angesehen“, die Module setzen die Lösung ein
(Quiz-artige Aufgaben ohne „Lösung zeigen“ starten offen, dort kommt die Lösung mit jeder Antwort). `&vorschau=ohne`
zeigt die Aufgabe so, wie Schüler beginnen. Verworfen: Lehrkräfte probieren mit ihrem eigenen Lernstand (dann wäre
„Lösung zeigen“ endgültig und Tipps verbraucht).
**Falsche Antworten:** Wie Algo Quest zeigt die Aufgabenstatistik die drei häufigsten falschen Antworten – aber nur
dort, wo eine Kurzform aussagekräftig ist und keinen Freitext enthält: gewählte Quiz-Option bzw. wahr/falsch mit
Begründung, gewählte Detektiv-Beschreibung, eingegebene Turing-Regel, Mealy-Ausgabe (nur Zeichen aus Ω). Automaten,
Tabellen und Grammatiken lassen sich nicht sinnvoll auszählen. Tabelle `falsche_antworten` (Migration 6), gelöscht mit
dem Konto; Datenschutzhinweise ergänzt. **Fallen-Profil** (P1–P10) folgt nach Freigabe von `docs/einheit/FALLEN.md`.

## 2026-10-14 · Lehrkraft-Bereich im Aufbau wie Algo Quest (PR 6)
Wunsch von Frank: Lehrkräfte sollen sich in allen Labs gleich zurechtfinden. Übernommen wird der Aufbau des
Lehrkraft-Bereichs von Algo Quest (`public/static/js/lehrer.js`), nicht das Design: Navigation 📚 Kurse · 📖 Aufgaben ·
📂 Materialien · 🗺️ Themen · ⌂ Portal; „Meine Kurse“ als Tabelle mit „Öffnen“; Kursseite mit Brotkrumen und den
Reitern 👥 Schüler · 🔗 Beitritt · 📊 Auswertung · 🏆 Rangliste · ⚙️ Einstellungen in derselben Reihenfolge (Algo
Quest: „Beitritt & QR“, „Scoreboard“). Was das Portal verwaltet (Kurs anlegen/löschen, Kurscode, QR, Konten, Codes),
steht an derselben Stelle als Hinweis mit Link ins Portal – wie Algo Quest es bei Portal-Kursen tut.
Abweichungen: Die Rangliste sieht nur die Lehrkraft (kein Scoreboard für Schüler, kein Beamer-Board – das wäre eine
didaktische Entscheidung für später); kein Boss- und kein Fallen-Profil (gibt es im AutomatenLab nicht bzw. erst mit
V3); keine „häufigen falschen Antworten“ (bräuchte eine eigene Tabelle). Die Aufgaben-Seite listet die Aufgaben nach
Level mit Link ins Modul; eine Vorschau mit eingesetzter Lösung je Modul folgt (PR 6b). Einstellung zunächst nur die
Kursart (gA/eA, gespeichert in `kurse.einstellungen`); sie bestimmt den Kursumfang der Portal-Kennzahlen und die
Markierung in der Matrix. Jede Aufgabe zählt in der Matrix zu genau einem Level (erstes Level; Welt-Quiz beim letzten
Level der Welt). Neue Routen nur ergänzt: `#/lehrkraft?kurs=…&tab=…`, `#/lehrkraft?teil=aufgaben`.

## 2026-10-14 · Welten B–D auf dem Server (PR 5)
Überliste, Parallelwelten, Keller-Labor, Ableitungs-Rallye, Grammatik-Tester und Turing-Labor prüfen auf dem Server;
ihre Daten liegen in `inhalte/`, die Prüflogik ohne Daten in `app/js/engine/pruefer.js`. Punkte nach Stufe (10/20/30)
statt der bisherigen Einzelwerte (Rallye 10–25 → Stufen, kein Bonus mehr für die kürzeste Ableitung; Grammatik 30 →
Standard, sonst Profi). Puzzle-artige Teile (Wo stehen die Figuren?, Überliste-Bonusfrage) werden wie ein Quiz nach dem
ersten Versuch gewertet und haben kein „Lösung zeigen“. Bei Keller „Rückwärts“ zeigt der Server keine Beispielwörter,
weil das gesuchte Wort darunter sein könnte. Grenzen wie bei Mealy, bewusst hingenommen: Die Turing-Programme bleiben im
Simulator sichtbar (aus ihnen ließe sich die fehlende Regel ablesen), freie Modi bleiben im Browser ohne Punkte.
Jedes Modul hat eine eigene Demo-Aufgabe für Gäste.

**Chomsky-Sortierer als Training:** Anders als bei der Arena kommt die Begründung sofort nach jeder Karte – sie ist der
Lerninhalt. Deshalb geht jede Karte einzeln an den Server (`/antwort`), gezählt wird die erste Antwort je Karte; Fach
und Begründung erfährt die App erst danach. 1 Punkt je richtiger Karte im Rahmen des Tageshöchstwerts, Rekord nur für
Zehnerrunden; „Alle Karten“ bringt Punkte, aber keinen Rekord (bisher 40 Punkte bei höchstens zwei Fehlern im Browser).
Gäste spielen eine Zehnerrunde mit eigenen Demo-Karten. Die Tabelle `training` wird dafür in Migration 5 neu angelegt
(SQLite kann einen CHECK nicht ändern). Verworfen: Antworten am Ende gesammelt wie in der Arena – dann bräuchte die App
die Begründungen vorab, und damit die Lösungen.

## 2026-10-14 · Training: Arena und „Unterscheide!“ (PR 4c)
Wie der Trainingsplatz von Algo Quest: Der Server erzeugt die Runde, die App spielt sie und schickt die Antworten am
Ende gesammelt (keine Anfrage je Klick – die Arena ist ein Tempo-Spiel). 1 Punkt je richtiger Antwort, höchstens 30
Trainingspunkte je Tag (wie Algo Quest), damit Aufgaben mit Prüfung die Hauptquelle der Punkte bleiben. Der Rundenstand
der Arena (10 + Serienbonus) bleibt als Spielwertung und Rekord je Stufe; ein Rekord zählt nur, wenn die Zeitrunde
spätestens 90 s nach dem Start endet. Bisher gab es Arena-Punkte nur für Rekordverbesserungen im Browser. Gäste spielen
lokal ohne Punkte. Verworfen: Prüfung je Antwort auf dem Server (zu träge im Unterricht mit vielen iPads im WLAN).

## 2026-10-14 · Mealy-Maschine auf dem Server (PR 4b)
Zwei Aufgaben je Automat: „Was kommt raus?“ wird wie ein Exit-Ticket gewertet (erster Versuch je Wort, 10 Punkte ×
Anteil), die Bug-Jagd nach Stufe (Süßigkeiten, Kartoffel, Caesar 10; Addierer, Wechselnde Verschiebung 20; Frog,
Palindrom 30), falsche Reparaturen kosten Punkte. Das Finden des Bugs (Schritt 1) bringt keine eigenen Punkte mehr –
es ist Teil der Bug-Jagd; die Rückmeldung „Tipp für die Klausur“ bleibt. Die Fehlerliste ist das Geheimnis und liegt
in `inhalte/mealy.js`; die Referenz ist in der Vorhersage sichtbar (Gegenstand der Aufgabe) – bewusst hingenommen.
Gäste bekommen den eigenen Demo-Automaten „Paritäts-Melder“ für alle drei Modi.

## 2026-10-14 · Minimierer auf dem Server (PR 4a)
Jede Runde des Markierungsverfahrens prüft der Server; er hält den Stand (bestätigte Paare) und zählt jede falsch
geprüfte Runde als Fehlversuch. Punkte nach Stufe statt pauschal 30: Smiley und „gerade Anzahl a“ Basis (10), fünf
Aufgaben Standard (20), Prüfnummern (Abi 2025) Profi (30). „Unterscheide!“ bringt vorerst keine Punkte: Die Antworten
folgen aus dem sichtbaren Automaten, und 5 Punkte je Paar (über 100 Paare) hätten die Punkte verzerrt; es wird in PR 4c
zum Training (1 Punkt je Aufgabe, Tageshöchstwert, Vertrag-Umsetzung `docs/VERBUND.md` §6). Gäste bekommen eine eigene
Demo-Aufgabe („Endet auf a – doppelt gemerkt“) statt Aufgabe 1. Verworfen: Prüfung nur des Endergebnisses (Klassen) –
das Verfahren Runde für Runde ist der Lerninhalt und Abi-relevant.

## 2026-10-14 · Lösungsfolien markiert (Schüler-Handouts)
Alle 16 Foliensätze durchgesehen: Zusätzlich zu den vier per Titel erkannten Folien tragen 18 Folien den Vermerk
`[NUR LEHRKRAFT]`, weil sie Aufgaben des Arbeitsblatts lösen (z. B. AB09 1a/1b/2, AB07 1a/3, AB08 1, AB12 2, AB16 1b)
oder eine App-Aufgabe (Überliste, Stufe 1). Erklärende Beispiele der Erarbeitung (Markierungsverfahren am Smiley,
Muster-Baukasten, Ableitungen) bleiben im Handout – sie stehen ohnehin in den Merkblättern. Lehrkräfte sehen alle
Folien mit Notizen; im Notiztext steht der Vermerk sichtbar.

## 2026-10-12 · Arbeitsblätter je Welt auf der Startseite, Welten mit Thema vorn
Unter den Modulen jeder Welt klappt „Arbeitsblätter, Folien & Merkblätter zu Welt X (PDF)“ auf: alle Level der Welt und das Boss-Level, darunter die Klausuren bei „Für alle Welten“. Es sind dieselben Daten und Rechte wie auf der Themenseite (`GET /api/material`, `materialLinks`): Schüler sehen Schülerfassungen, Lehrkräfte zusätzlich ihre Fassungen, Gäste die Demo und 🔒. Aufklappbar, damit die Modul-Kacheln vorn bleiben.
Die Welt-Buchstaben A–D bleiben als Kurzname. Sie stehen im Manifest (`welten[].kennung`, Entscheidung V4), in den Boss-Leveln A–C, in den Kopfzeilen der gedruckten Materialien und im Quiz („Welt A“). Auf der Level-Karte steht aber das Thema groß („Endliche Automaten“) und „Welt A · Level 1–6“ klein darunter. Alternativen: Nummern 1–4, verworfen, weil sie sich mit den Level-Nummern verwechseln lassen; nur Themennamen, verworfen, weil die gedruckten Blätter und die Boss-Level die Buchstaben nutzen.

## 2026-10-12 · Arbeitsblätter in der Themenübersicht
Wie in Algo Quest stehen Arbeitsblatt, Folien und Merkblatt direkt bei jedem Level der Themenseite (Boss-Level beim Boss-Level, Klausuren und Einheit am Ende); die Seite `#/material` heißt jetzt „Arbeitsblätter & Material“. Grund: Frank fand das Material unter „Material“ zu versteckt. Gäste sehen Titel gesperrter Schülerfassungen mit 🔒 („nach Anmeldung“), aber keine Adressen; Lehrkraft-Dateien erscheinen für sie gar nicht.

## 2026-10-12 · Material-Demo im Gastmodus
Ohne Anmeldung gibt es nur eine Auswahl: Level 1 mit Arbeitsblatt, Folien-Handout und Merkblatt sowie als Beispiel die Lehrkraftfassungen (Handreichung mit Lösungen, Folien mit Notizen). Alles andere bekommt man erst nach Anmeldung in seiner Rolle (Schüler mit freigeschaltetem Kurs: Schülerfassungen; Lehrkräfte: zusätzlich Lehrkraftfassungen; Admin: Originale). Franks Entscheidung; passt zu V2 („einzelne Aufgaben zum Ausprobieren“). Festgelegt in `GAST_MATERIAL` (`app/js/data/gast.js`), als `demo` in `verzeichnis.json`, geprüft im Server. Schüler ohne freigeschalteten Kurs sehen ebenfalls die Demo.

## 2026-10-12 · Zusätzliches Material als Download (wie Algo Quest)
Arbeitsblätter, Folien, Merkblätter und Klausuren sind unter `#/material` erreichbar und zählen nicht für Punkte. Drei Stufen: **Schüler-PDF** (ohne Lösungen; Folien als Handout ohne Notizen und ohne Lösungsfolien) für Angemeldete – Schüler nur mit freigeschaltetem Kurs, wie bei den Aufgaben (Vertrag §4, Gastmodus V2: ohne Anmeldung kein Einblick); **Lehrkraft-PDF** (Handreichungen mit Lösungen, Folien mit Notizseiten, Erwartungshorizonte, Übungsklausuren, Einheitsplanung) für Lehrkräfte und Admin; **Originale** (docx/pptx, einzeln oder als ZIP je Akte) nur für den Admin. Der Server liefert nur Dateien aus `materials/pdf/verzeichnis.json` aus (Whitelist, §9 „Lehrkraft-Dateien nur mit Anmeldung und Whitelist“). Die erzeugten Dateien (~60 MB) sind eingecheckt wie in Algo Quest, weil das Image ohne LibreOffice gebaut wird. Verworfen: Schüler-PDFs öffentlich (wie Algo Quest) – passt nicht zu Franks Entscheidung V2; PDFs im Container erzeugen – zu schwer.

## 2026-10-12 · Grund- und Leistungskurs nach KC 2017 (Vertrag v1.2)
Drei Niveaus wie in Algo Quest: **gA + eA** (Kern: DEA, Mealy, Grenzen endlicher Automaten – Level 1–4, 6, 7, Boss A, Übungsklausur „Fahrradverleih“), **nur eA** (Spalte „Erweiterung eA“: Kellerautomat, formale Sprachen, Grammatiken – Level 9–15, Boss B und C, Übungsklausur „Smart-Home-Befehle“) und **Zusatz** (vom KC nur als Ergänzung genannt oder gar nicht: Minimierung Level 5, NEA Level 8, Turingmaschine Level 16; Chomsky-Hierarchie in Level 14). Von Frank so festgelegt (2026-10-12); NEA ist im LK eine gute Hinleitung zum Kellerautomaten. Eine Quelle für App und Server (`app/js/data/niveaus.js`), eine Kopie für die Materialien (`materials/lib/niveau.js`) mit Gleichstandstest. Niveau-Übersicht unter `/niveaus` statt `/themen#niveaus`, weil das Fragment bei der Weiterleitung auf die Hash-Route verloren ginge. Die bestehende Einteilung Pflicht/Vertiefung/Bonus bleibt (sie beschreibt den 16-DS-Plan des Leistungskurses); für den Grundkurs gibt es einen eigenen Weg (L1–L3, L6, L7, Vertiefung L4). In der LK-Übungsklausur „Smart-Home-Befehle“ ersetzt Teil c („Zustände zusammenfassen“, jetzt Zusatz) eine Begründungs- und Zählaufgabe zum Automaten A (gleiche BE und AFB). Verworfen: getrennte Apps oder Routen für gA/eA (QR-Codes bleiben für beide Kurse gleich).

## 2026-10-12 · Eigenes Erscheinungsbild mit Weltfarben und „Automaten-Effekten“
AutomatenLab behält sein eigenes Design (Karopapier, Teal/Ocker, Atkinson Hyperlegible) und ergänzt Weltfarben (A Teal, B Ocker, C Blau, D Aubergine) sowie wenige Effekte, die fachlich etwas zeigen: ein kleiner DEA liest im Kopf der Startseite „aab“ und akzeptiert, das gewählte Level pulsiert wie ein aktiver Zustand, „Richtig“ und Abzeichen erscheinen mit Doppelkreis (Endzustand). Begründung: Frank möchte, dass sich das Lab von den anderen abhebt. Barrierefreiheit: reine CSS-Animationen, endlich (dreimal) bzw. anhaltbar, aus bei `prefers-reduced-motion`, Text gibt es immer auch ohne Animation. Verworfen: Konfetti/Partikel (lenkt ab, ohne fachlichen Bezug).

## 2026-10-12 · Prüfung auf dem Server: Aufbau und Punkte (PR 3)
Lösungsdaten in `inhalte/` (ES-Module, nur vom Server geladen), reine Prüflogik in `app/js/engine/pruefer.js` (gemeinsam für Server und Demo-Aufgaben), Lernstand in `fortschritt`/`abzeichen` je `sub`. Antwortoptionen tragen HMAC-Kennungen statt Positionen. Punkte nach §9 (10/20/30, Formel); dadurch ändern sich die bisherigen Werte: Baukasten 20/30/40 → 10/20/30, Detektiv nach Fallnummer gestuft (1–4/5–8/9–12) statt 30/20/10 nach Versuchen, Quiz = Anteil im ersten Durchgang statt Bestwert. Begründung: Vergleichbarkeit im Portal und Schutz vor Manipulation (Entscheidung V1). Gast-Fortschritt im Browser wird nicht übernommen (Gäste sehen nur Demo-Aufgaben). Übergang: Module, die noch im Browser prüfen, speichern bis PR 4/5 weiter lokal; angemeldet zählen in der Kopfzeile nur die Server-Punkte.

## 2026-10-12 · Sitzungen und Daten aus dem Portal
Eine Sitzung je Browser (signiertes Cookie `al_s` mit `sub` und `session_gen`, zustandslos wie Algo Quest/Portal; Schüler 30 Tage, Lehrkräfte/Superadmin 8 h). Gespeichert werden nur `konten(sub, rolle, name, Zeitpunkte)`, `kurse(id, name, aktiv, einstellungen)` und `kurs_mitglieder` laut letztem Token. Ein Kurs im Token gilt als aktiv; `kurs-aendern` mit `aktiv:false` sperrt ihn (Mitglieder verlieren den Zugang, Daten bleiben). Lernstände hängen später an `sub` (ein Konto kann mehreren Kursen angehören); `loeschen {kurs}` entfernt Kurs, Einstellungen und Mitgliedschaften, `loeschen {sub}` alles des Kontos. `src/security.js` ist die Fassung des Portals (nur Cookie-Name geändert), `src/jwt.js` unverändert. Verworfen: Sessions-Tabelle (nicht nötig, Widerruf über `session_gen`).

## 2026-10-11 · Anschluss an den Verbund InfoLabs, kein eigenes Login
AutomatenLab wird Plattform des Verbunds InfoLabs (Portal https://labs.frankjuchim.de). Verbindlich ist der Vertrag https://github.com/frankjuchim/labs/blob/main/VERTRAG.md (Version 1.1). Konten und Kurse kommen aus dem Portal (SSO mit Ed25519-JWT, §5); AutomatenLab liefert Manifest (§7) und Verbund-API (§6) und startet mit `AUTH_MODUS=portal`. Begründung: Franks Entscheidung für einen gemeinsamen Login und eine übergeordnete Verwaltung aller Plattformen. Damit entfallen eigene Konten, Zugangskarten, Einladungen und die eigene Kurs-Ablauf-Löschung (`LOGIN_KONZEPT.md` ist abgelöst). Das Repository `frankjuchim/labs` wird nur gelesen; Abweichungen werden als Vorschlag für `VERTRAG.md` formuliert (`docs/VERBUND.md` §6). Details: `docs/VERBUND.md`.

## 2026-10-11 · Server in CommonJS unter `src/`, Node 22
Der Server liegt in `src/` (wie Algo Quest und Portal) und ist CommonJS. Begründung: `src/jwt.js` und `scripts/vertrag_pruefen.js` müssen unverändert kopiert werden, und ein späterer gemeinsamer Kern (`lab-kern`, Vertrag §13.3) soll ein reines Verschieben sein. Die ES-Module der App (`app/js/data`) liest der Server per `import()`. Node 22 statt 20 (Node 20 ohne Sicherheitsupdates seit April 2026). Verworfen: Server als ES-Module (Vorschlag aus `ALGOQUEST_VERGLEICH.md`).

## 2026-10-11 · Prüfung und Lernstand auf dem Server (Vertrag §9)
Lösungen, Tipps und Erklärungen verlassen den Server erst nach dem Lösen; geprüft und gepunktet wird nur serverseitig (Punkteformel und Standardpunkte nach §9). Die Engine (`app/js/engine`) bleibt gemeinsamer Code für Browser und Server; Lösungsdaten ziehen nach `inhalte/` (nicht ausgeliefert). Arena und Sortierer werden „Training“ wie der Algo-Quest-Trainingsplatz. Begründung: Frank will den Lernstand möglichst nicht manipulierbar und im Portal vergleichbar. Folge: Angemeldete brauchen zum Lösen eine Verbindung zum Server; das Offline-Üben bleibt nur für die Demo-Aufgaben. Verworfen: Prüfung im Browser mit Vertragsausnahme (Vorschlag V1).

## 2026-10-11 · Gastmodus nur mit Demo-Aufgaben, QR-Routen nach Anmeldung (ersetzt F1)
Ohne Anmeldung nur je Modul eine Demo-Aufgabe (`/gast`, Vertrag §4/§9). Alle Routen aus `app/README.md` bleiben gültig, führen ohne Sitzung aber über das Portal-Login (`ziel` = die Route) zur Aufgabe. Begründung: Franks Entscheidung (V2); passt zum Vertrag und zur Prüfung auf dem Server – Lösungen öffentlicher Aufgaben wären sonst einsehbar. Folge: CLAUDE.md Regel 2 und Abnahmekriterium 1 angepasst. Verworfen: alles offen (F1, zuerst beschlossen).

## 2026-10 · Deployment aus dem Wurzelordner
`captain-definition`, `Dockerfile` und `.dockerignore` liegen im Wurzelordner; das Image liefert weiterhin nur `app/` mit `app/nginx.conf` aus. Begründung: CapRover baut per Webhook bei jedem Push auf `main` aus dem Wurzelordner – mit der Datei in `app/` schlug der Build fehl. Ab Phase 2 wird dasselbe Dockerfile zum Node-Container. Alternative (Unterordner per `captain-definition`-Pfad): nicht möglich, CapRover erwartet die Datei im Wurzelordner des Repositorys.

## 2026-10 · GitHub-Prüfung baut das Image und ruft alle Deep-Links auf
`.github/workflows/pruefung.yml`: `npm test` und `qa/qa-routes.mjs` gegen den frisch gebauten Container. Begründung: Regel 1 (QR-Routen) wird so bei jedem Push/PR automatisch geprüft, nicht nur lokal. Sie blockiert den Webhook-Build nicht (wie bei AlgoQuest) – Freigabe nach `main` nur bei grüner Prüfung.

## 2026-10 · Deployment aus dem Wurzelordner
`captain-definition`, `Dockerfile` und `.dockerignore` liegen im Wurzelordner; das Image liefert weiterhin nur `app/` mit `app/nginx.conf` aus. Begründung: CapRover baut per Webhook bei jedem Push auf `main` aus dem Wurzelordner – mit der Datei in `app/` schlug der Build fehl. Ab Phase 2 wird dasselbe Dockerfile zum Node-Container. Alternative (Unterordner per `captain-definition`-Pfad): nicht möglich, CapRover erwartet die Datei im Wurzelordner des Repositorys.

## 2026-10 · GitHub-Prüfung baut das Image und ruft alle Deep-Links auf
`.github/workflows/pruefung.yml`: `npm test` und `qa/qa-routes.mjs` gegen den frisch gebauten Container. Begründung: Regel 1 (QR-Routen) wird so bei jedem Push/PR automatisch geprüft, nicht nur lokal. Sie blockiert den Webhook-Build nicht (wie bei AlgoQuest) – Freigabe nach `main` nur bei grüner Prüfung.

## vorgeschlagen · Login-Stack nach AlgoQuest
Express 5, better-sqlite3 (`/app/data/automatenlab.db`), helmet, qrcode (+ `compression` für gzip), scrypt, signierte zustandslose Cookies mit `session_gen`, Lehrkräfte per Anfrage + Freigabe, SuS mit Pseudonym + persönlichem Code. Abweichungen: ES-Module und Node 22, nummerierte Migrationen, Fortschritt als JSON-Stand mit serverseitig abgeleiteten Ereignissen. Begründung und Alternativen: `docs/ALGOQUEST_VERGLEICH.md`. Wird nach Franks OK zu einer Entscheidung.
