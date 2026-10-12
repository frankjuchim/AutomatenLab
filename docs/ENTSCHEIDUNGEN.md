# Architekturentscheidungen

Kurzformat: Datum · Entscheidung · Begründung · Alternativen. Neueste oben.

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
