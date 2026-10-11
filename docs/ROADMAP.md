# Roadmap

Jeder Punkt eignet sich als GitHub-Issue. Reihenfolge = Vorschlag. ✅ = erledigt.

## Phase 0 – Repository (Version 1.0)
- ✅ Web-App, Material-Pipeline, Videoreihe, Dokumentation in einem Repository
- ✅ Material-Build ohne absolute Pfade (`materials/build_all.sh`), Ergebnis identisch zur ausgelieferten Version 1.0
- ✅ Repository anlegen, ersten Stand pushen
- [ ] Release **v1.0** mit `Automaten_LK.zip` (Materialpaket) erstellen
- ✅ Deployment per CapRover-Webhook aus dem Wurzelordner (`captain-definition`, `Dockerfile`), GitHub-Prüfung mit allen Deep-Links
- [ ] `.github`-Dateien aus dem ersten Paket fehlen: Release-Workflow für das Materialpaket, Issue-Vorlagen (PR-Vorlage und Prüfung neu angelegt)
- [ ] Lizenz festlegen

## Phase 1 – Analyse und Angleichung
- ✅ AlgoQuest analysieren: Stack, Login, Rollen, Datenmodell, UI-Muster, Deployment, Tests → `docs/ALGOQUEST_VERGLEICH.md`
- ✅ Anschluss an den Verbund InfoLabs geplant (Vertrag v1.1) → `docs/VERBUND.md`; Entscheidungen in `docs/ENTSCHEIDUNGEN.md`
- ✅ Gastmodus entschieden (F1): alle QR-Routen offen, Startseite als Vorschau
- [ ] Vorschläge V1–V4 für `VERTRAG.md` (siehe `docs/VERBUND.md` §6) mit Frank klären und an das Portal-Repo übergeben

Je Meilenstein ein Branch + Pull Request; jeder PR: `npm test` grün, `qa/qa-routes.mjs` gegen den gebauten Container
grün, Doku nachgezogen. Merge nach `main` (= live) nur nach Freigabe, nicht während des Unterrichts.

## Phase 2 – Server-Grundgerüst und Manifest (PR 1)
- [ ] `src/` (CommonJS, Express 5, better-sqlite3, helmet, `compression`), Node 22; liefert `app/` unverändert mit den Cache-/Sicherheits-Headern aus `app/nginx.conf` aus
- [ ] SQLite `DATA_DIR/automatenlab.db` mit nummerierten Migrationen; Konfiguration nach Vertrag §8, `.env.example`
- [ ] `/healthz`, Manifest `/api/plattform` (§7, zunächst `auth.modus: "lokal"`, `sso: false`), `scripts/vertrag_pruefen.js` unverändert + Test
- [ ] Pfade `/gast`, `/themen`, `/lehrer`, `/datenschutz` (Weiterleitung auf Hash-Routen); Themenseite `#/themen`, Datenschutz-Ergänzung `#/datenschutz` mit Link auf das Portal
- [ ] Dockerfile → Node-Container nach Algo-Quest-Muster (`USER node`, `/app/data`), CI um Server-Tests ergänzen
- [ ] Abnahme: Container startet mit leerem Volume, Neustart behält Daten, alle Deep-Links unverändert, Vertragsprüfung grün

## Phase 3 – Anmeldung über das Portal (PR 2)
- [ ] `src/jwt.js` unverändert aus `frankjuchim/labs`; `/sso/start`, `/sso/ende`, Abmelden / „Überall abmelden“, eigene Sitzung (SuS ≤ 30 Tage, Lehrkräfte ≤ 8 h)
- [ ] Konten und Kurse nach `sub`/Kurs-ID (Upsert, Mitgliedschaften abgleichen), Rollen §4
- [ ] Verbund-API §6: `loeschen` (idempotent), Kursübersicht (vorläufige Kennzahlen), Kursänderung (umbenennen, sperren)
- [ ] Alle Testfälle aus `INTEGRATION.md` §5, Rechte-Matrix für jede Route × Rolle
- [ ] Kopfzeile: „Anmelden“ bzw. Name + Menü, Link „⌂ Portal“; Manifest `auth.modus: "portal"`, `sso: true`
- [ ] Inbetriebnahme im Portal (`docs/VERBUND.md` §5)

## Phase 4 – Fortschritt synchronisieren (PR 3)
- [ ] `app/js/core/merge.js` (DOM-frei, getestet, auch im Server), Speicher-Adapter in `progress.js` (API unverändert)
- [ ] `GET/PUT /api/fortschritt`, Beacon beim Verlassen, Version/409, Gast-Fortschritt mit Rückfrage übernehmen, offline weiterarbeiten, Abmelden löscht die Kontokopie
- [ ] Ereignisse serverseitig aus der Differenz der Stände; Playwright-Test mit zwei Geräten (`qa/qa-login.mjs`, Portal-Token aus Testschlüssel)

## Phase 5 – Lehrkraft-Bereich
- [ ] PR 4: Zuordnung Aufgabe → Level (`app/js/data/zuordnung.js`, Test auf Vollständigkeit), Lernstand-Matrix Level 1–16 × Schüler wie Algo Quest, Details je Modul, CSV; Kursübersicht für das Portal mit echten Kennzahlen
- [ ] PR 5: Kurs-Einstellungen: Freischaltung Pflicht/Vertiefung/Bonus (`LEVEL_TYPE`), Aufträge (Routen + Fälligkeit) auf der Startseite angemeldeter SuS; Startseiten-Vorschau für Gäste
- [ ] PR 6: Datenschutzhinweise der Plattform, Löschung vollständig über die Verbund-API (Test), Doku (`DATENSCHUTZ.md`, `DEPLOYMENT.md`, README), Abnahme

## Phase 6 – Materialien ↔ Plattform
- [ ] Erklärvideos verlinken: „Erklärvideo“-Knopf in den Modulen, Video-QR-Codes auf Merkblättern (Links nach Upload)
- [ ] Release-Workflow baut das Materialpaket bei jedem Tag `v*` automatisch
- [ ] Optional: Materialien (PDF) für angemeldete Lehrkräfte direkt im Dashboard herunterladbar

## Ideen (später)
- IServ-SSO (Sache des Portals)
- Wettbewerbe/Klassen-Challenges (anonymisierte Bestenliste im Kurs)
- Lehrkraft-Editor für eigene Baukasten-Challenges und Quizfragen
