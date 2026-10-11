# Architekturentscheidungen

Kurzformat: Datum · Entscheidung · Begründung · Alternativen. Neueste oben.

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

## vorgeschlagen · Login-Stack nach AlgoQuest
Express 5, better-sqlite3 (`/app/data/automatenlab.db`), helmet, qrcode (+ `compression` für gzip), scrypt, signierte zustandslose Cookies mit `session_gen`, Lehrkräfte per Anfrage + Freigabe, SuS mit Pseudonym + persönlichem Code. Abweichungen: ES-Module und Node 22, nummerierte Migrationen, Fortschritt als JSON-Stand mit serverseitig abgeleiteten Ereignissen. Begründung und Alternativen: `docs/ALGOQUEST_VERGLEICH.md`. Wird nach Franks OK zu einer Entscheidung.
