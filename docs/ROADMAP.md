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
- ✅ AlgoQuest analysieren → `docs/ALGOQUEST_VERGLEICH.md`
- ✅ Anschluss an den Verbund InfoLabs geplant (Vertrag v1.1) → `docs/VERBUND.md`; Entscheidungen in `docs/ENTSCHEIDUNGEN.md`
- ✅ Entscheidungen V1 (Prüfung auf dem Server), V2 (Gastmodus nur Demo-Aufgaben), V4 (Weltkennung), Farben
- [ ] V3: Fallen-Liste P1–P10 für Automaten und formale Sprachen (Entwurf → Freigabe durch Frank)

Je Meilenstein ein Pull Request; jeder PR: `npm test` grün, `qa/qa-routes.mjs` gegen den gebauten Container grün,
Doku nachgezogen. Merge nach `main` (= live) nur nach Freigabe, nicht während des Unterrichts.

## Phase 2 – Server-Grundgerüst und Manifest (PR 1)
- ✅ `src/` (CommonJS, Express 5, better-sqlite3, helmet, `compression`), Node 22; liefert `app/` mit den bisherigen Cache-/Sicherheits-Regeln aus
- ✅ SQLite `DATA_DIR/automatenlab.db` mit Migrationen (Verfahren wie im Portal); Konfiguration nach §8, `.env.example`
- ✅ `/healthz`, Manifest `/api/plattform` (`auth.modus: "lokal"`, `sso: false` bis Phase 3), `scripts/vertrag_pruefen.js` unverändert + Tests
- ✅ Pfade `/gast`, `/themen`, `/lehrer`, `/datenschutz`; Seiten `#/themen`, `#/datenschutz`, `#/lehrkraft` (Platzhalter)
- ✅ Dockerfile → Node-Container (`USER node`, `/app/data`), CI mit Server-Tests und Vertragsprüfung

## Phase 3 – Anmeldung über das Portal (PR 2)
- ✅ `src/jwt.js` unverändert; `/sso/start`, `/sso/ende`, Abmelden / „Überall abmelden“, eigene Sitzung (SuS ≤ 30 Tage, Lehrkräfte ≤ 8 h)
- ✅ Konten und Kurse nach `sub`/Kurs-ID (Upsert, Mitgliedschaften abgleichen, gesperrte Kurse), Rollen §4
- ✅ Verbund-API §6: `loeschen` (idempotent), Kursübersicht (Kennzahlen noch 0 bis Phase 4), Kursänderung
- ✅ Alle Testfälle aus `INTEGRATION.md` §5, Rechte-Matrix je Route × Rolle, CSRF
- ✅ Kopfzeile: „Anmelden“ bzw. Name + Menü, Link „⌂ Portal“; Lehrkraft-Bereich mit Kursliste; Manifest `auth.modus: "portal"`, `sso: true`
- [ ] Inbetriebnahme im Portal (`docs/VERBUND.md` §5) – nach dem Deploy durch den Superadmin (Hotfix 1.2.1: Schlüssel tolerant einlesen, Grund in `/healthz`)

## Phase 4 – Prüfung und Lernstand auf dem Server (V1) und Gastmodus (V2)
- ✅ PR 3 – Grundlage: Aufgabenkatalog mit stabilen IDs, `inhalte/` (Lösungen, nicht ausgeliefert), Lernstand-Tabellen, Punkteformel §9, API Aufgabe/Prüfen/Tipp/Lösung zeigen, `progress.js`-Adapter für Angemeldete; Gastmodus `#/gast` mit Demo-Aufgaben und Login-Hinweis für alle übrigen Routen; erste Module: Level-Quiz, Sprach-Detektiv, Automaten-Baukasten; `docs/AUFGABENFORMAT.md`; QA angemeldet und als Gast
- [ ] PR 4 – Welt A:
  - ✅ PR 4a – Minimierer: jede Runde des Markierungsverfahrens auf dem Server, Stufen 10/20/30, Demo-Aufgabe; „Unterscheide!“ vorerst Übung ohne Punkte
  - ✅ PR 4b – Mealy-Maschine: „Was kommt raus?“ wie ein Quiz, Bug-Jagd mit Test ohne Wertung und Reparatur auf dem Server, Demo-Automat
  - [ ] PR 4c – Training wie der Algo-Quest-Trainingsplatz: Akzeptor-Arena und „Unterscheide!“ (1 Punkt je Aufgabe, Tageshöchstwert), Abzeichen serverseitig
- [ ] PR 5 – Welten B–D: Parallelwelten, Keller-Labor, Überliste, Ableitungs-Rallye, Grammatik-Tester, Turing-Labor, Chomsky-Sortierer (Training); Test „keine Lösung in ausgelieferten Dateien“; Abzeichen serverseitig

## Grund- und Leistungskurs (Vertrag v1.2)
- ✅ Niveaus nach KC 2017 (gA + eA / nur eA / Zusatz) für Level, Boss-Level, Module, Merkblätter; Niveau-Übersicht `/niveaus` (= `#/themen?teil=niveaus`), Manifest v1.2 (`kurs`, `niveaus`, `urls.niveaus`), Etiketten in der App, Niveau im Kopf aller Materialien, Abschnitt in der Einheitsplanung
- [ ] Kurs-Einstellung „Kursart“ (Grundkurs/Leistungskurs) wie Algo Quest: eA-Level im Grundkurs als „freiwillig“, Kursübersicht für das Portal nur über die Level des Kurses (mit PR 7)
- ✅ Übungsklausur für den Grundkurs „Fahrradverleih“ (90 min, 30 BE, DEA/Mealy/Grenzen, alle Automaten geprüft)

## Phase 5 – Lehrkraft-Bereich
- [ ] PR 6: Lernstand-Matrix Level 1–16 × Schüler wie Algo Quest, Aufgabenstatistik, Fallen-Profil (nach V3), CSV, Aufgaben-Vorschau mit Lösungen; Kursübersicht für das Portal mit echten Kennzahlen
- [ ] PR 7: Kurs-Einstellungen (Freischaltung Pflicht/Vertiefung/Bonus, Aufträge auf der Startseite), Datenschutzhinweise der Plattform, Löschung über die Verbund-API vollständig getestet, Doku, Abnahme

## Phase 6 – Materialien ↔ Plattform
- [ ] Erklärvideos verlinken: „Erklärvideo“-Knopf in den Modulen, Video-QR-Codes auf Merkblättern (Links nach Upload)
- [ ] Release-Workflow baut das Materialpaket bei jedem Tag `v*` automatisch
- ✅ Materialien als Download (`#/material`): Schüler-PDF ohne Lösungen, Lehrkraft-PDF mit Lösungen/Notizen/Klausuren, Originale (docx/pptx, ZIP je Akte) nur für den Admin

## Ideen (später)
- IServ-SSO (Sache des Portals)
- Wettbewerbe/Klassen-Challenges (anonymisierte Bestenliste im Kurs)
- Lehrkraft-Editor für eigene Baukasten-Challenges und Quizfragen
