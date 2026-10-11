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

## Phase 1 – Analyse und Angleichung an AlgoQuest
- ✅ AlgoQuest analysieren: Stack, Login, Rollen, Datenmodell, UI-Muster, Deployment, Tests → `docs/ALGOQUEST_VERGLEICH.md`
- [ ] Entscheidungen dokumentieren (`docs/ENTSCHEIDUNGEN.md`): übernehmen / anpassen / bewusst anders
- [ ] Offene Fragen aus `docs/LOGIN_KONZEPT.md`, Abschnitt 9, mit Frank klären

## Phase 2 – Server-Grundgerüst
- [ ] `server/` mit Framework, SQLite, Migrationen, Konfiguration (`.env.example`), Logging
- [ ] Ein Container für App + API (Dockerfile im Wurzelordner zum Node-Container umbauen, persistentes Verzeichnis `/app/data`)
- [ ] Health-Endpoint, Sicherheits-Header/CSP wie bisher
- [ ] CI: Server-Tests

## Phase 3 – Anmeldung
- [ ] Admin-Bootstrap, Einladungen für Lehrkräfte, Login/Logout/Passwort ändern
- [ ] SuS-Zugänge durch Lehrkraft, Zugangskarten (Druckansicht)
- [ ] Rate-Limit, CSRF, Session-Verwaltung, Tests für Rechte (jede Route × jede Rolle)

## Phase 4 – Fortschritt synchronisieren
- [ ] Speicher-Adapter in `app/js/core/progress.js` (API unverändert), Zusammenführen Gast → Konto
- [ ] Offline-Fähigkeit, Konfliktbehandlung, Abmelden auf geteilten Geräten
- [ ] Ereignisse (`progress_events`) aus Modulen: gelöst, Quiz, Abzeichen

## Phase 5 – Lehrkraft-Dashboard
- [ ] Kursübersicht, Lernstand-Matrix (Level × SuS), Details je Modul, CSV-Export
- [ ] Aufträge (Routen + Fälligkeit) und Anzeige auf der SuS-Startseite
- [ ] Freischaltung Pflicht/Vertiefung/Bonus je Kurs
- [ ] Automatisches Löschen abgelaufener Kurse, Datenschutzseite, Impressum

## Phase 6 – Materialien ↔ Plattform
- [ ] Erklärvideos verlinken: „Erklärvideo“-Knopf in den Modulen, Video-QR-Codes auf Merkblättern (Links nach Upload)
- [ ] Release-Workflow baut das Materialpaket bei jedem Tag `v*` automatisch
- [ ] Optional: Materialien (PDF) für angemeldete Lehrkräfte direkt im Dashboard herunterladbar

## Ideen (später)
- IServ-SSO, gemeinsamer Login mit AlgoQuest
- Wettbewerbe/Klassen-Challenges (anonymisierte Bestenliste im Kurs)
- Lehrkraft-Editor für eigene Baukasten-Challenges und Quizfragen
