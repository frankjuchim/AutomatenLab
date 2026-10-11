# Architekturentscheidungen

Kurzformat: Datum · Entscheidung · Begründung · Alternativen. Neueste oben.

## 2026-10-11 · Anschluss an den Verbund InfoLabs, kein eigenes Login
AutomatenLab wird Plattform des Verbunds InfoLabs (Portal https://labs.frankjuchim.de). Verbindlich ist der Vertrag https://github.com/frankjuchim/labs/blob/main/VERTRAG.md (Version 1.1). Konten und Kurse kommen aus dem Portal (SSO mit Ed25519-JWT, §5); AutomatenLab liefert Manifest (§7) und Verbund-API (§6) und startet mit `AUTH_MODUS=portal`. Begründung: Franks Entscheidung für einen gemeinsamen Login und eine übergeordnete Verwaltung aller Plattformen. Damit entfallen eigene Konten, Zugangskarten, Einladungen und die eigene Kurs-Ablauf-Löschung (`LOGIN_KONZEPT.md` ist abgelöst). Das Repository `frankjuchim/labs` wird nur gelesen; Abweichungen werden als Vorschlag für `VERTRAG.md` formuliert (`docs/VERBUND.md` §6). Details: `docs/VERBUND.md`.

## 2026-10-11 · Server in CommonJS unter `src/`, Node 22
Der Server liegt in `src/` (wie Algo Quest und Portal) und ist CommonJS. Begründung: `src/jwt.js` und `scripts/vertrag_pruefen.js` müssen unverändert kopiert werden, und ein späterer gemeinsamer Kern (`lab-kern`, Vertrag §13.3) soll ein reines Verschieben sein. Die ES-Module der App (`app/js/data`) liest der Server per `import()`. Node 22 statt 20 (Node 20 ohne Sicherheitsupdates seit April 2026). Verworfen: Server als ES-Module (Vorschlag aus `ALGOQUEST_VERGLEICH.md`).

## 2026-10-11 · Gastmodus: alle QR-Routen offen, Startseite als Vorschau
Alle Routen aus `app/README.md` bleiben ohne Anmeldung voll nutzbar; Gäste speichern nur im Browser. Die Startseite zeigt Gästen eine Vorschau (Welt A vollständig, B–D mit Hinweis auf die Anmeldung). Begründung: gedruckte QR-Codes; Inhalte liegen ohnehin im Browser, eine Sperre wäre nur kosmetisch. Verworfen: echte Sperre für Gäste (bräche QR-Codes und Abnahmekriterium 1).

## 2026-10 · Monorepo „AutomatenLab“
App, Material-Pipeline, Videoreihe und Doku liegen in einem Repository. Begründung: Materialien und App verweisen aufeinander (QR-Routen, gleiche Beispiele, gleiche Notation); Änderungen sollen gemeinsam geprüft werden. Erzeugte Dateien werden nicht versioniert, sondern als Release-ZIP verteilt.

## 2026-10 · App ohne Build-Schritt
Vanilla-JS-ES-Module, Graphviz als lokales WASM (`app/vendor/viz.js`). Begründung: läuft im Schulnetz ohne externe Server, lange wartbar, leicht für andere Lehrkräfte nachvollziehbar. Bei Einführung des Logins bleibt das so; der Server liefert die Dateien unverändert aus.

## 2026-10 · Fortschritt zunächst lokal
Version 1.0 speichert nur im Browser (`localStorage`, Schlüssel `automatenlab.v1`). Der Login (siehe `LOGIN_KONZEPT.md`) ergänzt einen Server-Speicher, ohne die API von `progress.js` zu ändern.

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
