# Architekturentscheidungen

Kurzformat: Datum · Entscheidung · Begründung · Alternativen. Neueste oben.

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
