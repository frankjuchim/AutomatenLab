# Roadmap

Jeder Punkt eignet sich als GitHub-Issue. Reihenfolge = Vorschlag. ✅ = erledigt.

## Phase 0 – Repository (Version 1.0)
- ✅ Web-App, Material-Pipeline, Videoreihe, Dokumentation in einem Repository
- ✅ Material-Build ohne absolute Pfade (`materials/build_all.sh`), Ergebnis identisch zur ausgelieferten Version 1.0
- ✅ Repository anlegen, ersten Stand pushen
- [ ] Release **v1.0** mit `Automaten_LK.zip` (Materialpaket) erstellen
- ✅ Deployment per CapRover-Webhook aus dem Wurzelordner (`captain-definition`, `Dockerfile`), GitHub-Prüfung mit allen Deep-Links
- ✅ `.github`-Dateien: Release-Workflow für das Materialpaket, Issue-Vorlagen (Fehler, fachlicher Fehler), PR-Vorlage und Prüfung
- ✅ Lizenz festgelegt (1.17.0): Code MIT, Material CC BY-SA 4.0, Vermerk in jeder Fußzeile

## Phase 1 – Analyse und Angleichung
- ✅ AlgoQuest analysieren → `docs/ALGOQUEST_VERGLEICH.md`
- ✅ Anschluss an den Verbund InfoLabs geplant (Vertrag v1.1) → `docs/VERBUND.md`; Entscheidungen in `docs/ENTSCHEIDUNGEN.md`
- ✅ Entscheidungen V1 (Prüfung auf dem Server), V2 (Gastmodus nur Demo-Aufgaben), V4 (Weltkennung), Farben
- ✅ V3: Fallen-Liste P1–P10 für Automaten und formale Sprachen (freigegeben am 14.10.2026)

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
- ✅ Inbetriebnahme im Portal (`docs/VERBUND.md` §5): AutomatenLab steht im Portal ohne „vorläufig“, Anmeldung über das Portal läuft live
- ✅ Ziel nach der Anmeldung passt zur Rolle (1.17.1, wie Algo Quest 2.8.3): Lehrkräfte von der Startseite in den Lehrkraft-Bereich, Schüler nie dorthin; Startseite mit „Zum Lehrkraft-Bereich“

## Phase 4 – Prüfung und Lernstand auf dem Server (V1) und Gastmodus (V2)
- ✅ PR 3 – Grundlage: Aufgabenkatalog mit stabilen IDs, `inhalte/` (Lösungen, nicht ausgeliefert), Lernstand-Tabellen, Punkteformel §9, API Aufgabe/Prüfen/Tipp/Lösung zeigen, `progress.js`-Adapter für Angemeldete; Gastmodus `#/gast` mit Demo-Aufgaben und Login-Hinweis für alle übrigen Routen; erste Module: Level-Quiz, Sprach-Detektiv, Automaten-Baukasten; `docs/AUFGABENFORMAT.md`; QA angemeldet und als Gast
- ✅ PR 4 – Welt A:
  - ✅ PR 4a – Minimierer: jede Runde des Markierungsverfahrens auf dem Server, Stufen 10/20/30, Demo-Aufgabe; „Unterscheide!“ vorerst Übung ohne Punkte
  - ✅ PR 4b – Mealy-Maschine: „Was kommt raus?“ wie ein Quiz, Bug-Jagd mit Test ohne Wertung und Reparatur auf dem Server, Demo-Automat
  - ✅ PR 4c – Training wie der Algo-Quest-Trainingsplatz: Akzeptor-Arena und „Unterscheide!“ (1 Punkt je richtiger Antwort, höchstens 30 je Tag), Rekorde und Abzeichen serverseitig; Chomsky-Sortierer folgt mit PR 5
- ✅ PR 5 – Welten B–D (1.9.0): Überliste, Parallelwelten, Keller-Labor (5a), Ableitungs-Rallye, Grammatik-Tester, Turing-Labor, Chomsky-Sortierer als Training (5b); je Modul eine eigene Demo-Aufgabe; Test „keine Lösung in ausgelieferten Dateien“ für alle Module; Abzeichen serverseitig

## Grund- und Leistungskurs (Vertrag v1.2)
- ✅ Niveaus nach KC 2017 (gA + eA / nur eA / Zusatz) für Level, Boss-Level, Module, Merkblätter; Niveau-Übersicht `/niveaus` (= `#/themen?teil=niveaus`), Manifest v1.2 (`kurs`, `niveaus`, `urls.niveaus`), Etiketten in der App, Niveau im Kopf aller Materialien, Abschnitt in der Einheitsplanung
- ✅ Kurs-Einstellung „Kursart“ (Grundkurs/Leistungskurs) wie Algo Quest: Einstellung, Lernstand-Matrix und Kursübersicht für das Portal nur über die Level des Kurses (PR 6); eA-Level im Grundkurs für Schüler als „freiwillig“ (PR 7)
- ✅ Übungsklausur für den Grundkurs „Fahrradverleih“ (90 min, 30 BE, DEA/Mealy/Grenzen, alle Automaten geprüft)

## Phase 5 – Lehrkraft-Bereich
- ✅ PR 6 (1.10.0): Lehrkraft-Bereich im Aufbau wie Algo Quest – Navigation (Kurse · Aufgaben · Materialien · Themen · Portal), Meine Kurse, Kursseite mit Reitern Schüler · Beitritt · Auswertung (Lernstand-Matrix Level 1–16 × Schüler, Aufgabenstatistik, CSV) · Rangliste · Einstellungen (Kursart gA/eA); Aufgaben der Welten nach Level; Kursübersicht für das Portal mit echten Kennzahlen (Kursumfang je Kursart)
- ✅ PR 6b (1.11.0): Aufgaben-Vorschau für Lehrkräfte (`&vorschau=1` mit eingesetzter Lösung, `&vorschau=ohne` zum Ausprobieren – nichts wird gespeichert), häufige falsche Antworten in der Aufgabenstatistik (Migration 6, Kurzform bei Quiz, Detektiv, Turing, Mealy-Vorhersage)
- ✅ Fallen-Profil P1–P10 (1.14.0): Feld `fallen` je Aufgabentyp, Fallen-Profil des Kurses (Fehlversuche, Lösung angesehen, betroffene Schüler) wie Algo Quest, Spalte und CSV „Fallen“
- ✅ Fallen je Quizfrage (1.15.0): alle 87 Fragen zugeordnet (`QUIZ_FALLEN` in `inhalte/quiz.js`), im ersten Durchgang falsch beantwortete Fragen zählen im Fallen-Profil
- ✅ Fallen-Nummern in den Materialien (1.16.0): jeder Warnkasten der Lehrkraft-Handreichungen und Merkblätter nennt seine Fallen („Abitur-Fallen: P2 … · P7 …“), Merkblatt M12 mit der Übersicht „Die zehn Abitur-Fallen“
- ✅ PR 12 (1.22.0): Boss der Welt D (Sprachdesign, Turingmaschine), Editor mit Detektiv-Fällen, Grammatik-Challenges und Kopieren in andere Kurse, Abnahme-Hilfe mit Screenshots (`qa/abnahme.mjs`, `docs/abnahme/`)
- ✅ PR 11 (1.21.0): Klassen-Challenges – Einzel- oder Team-Wertung, Training oder Aufgaben-Auswahl, Zeitraum, nur Challenge-Liste, Beamer-Board, Abzeichen und Sieger-Urkunden
- ✅ PR 10 (1.20.0): Aufgaben-Editor – eigene Quizze und Baukasten-Challenges je Kurs, Freigabe, Ergebnisse je Aufgabe, Vorschau; ohne Punkte
- ✅ PR 9 (1.19.0): Boss-Kämpfe der Welten A–C wie Algo Quest – 45 eigene Aufgaben (gegen die Engine geprüft), Zeitlimit, Auswertung am Ende, 12-Stunden-Pause, bester Versuch zählt; Kurs-Einstellung automatisch/offen/gesperrt, Boss-Ergebnisse und Pool-Vorschau für Lehrkräfte
- ✅ PR 8 (1.18.0): Rangliste für Schüler (gesamt/je Welt), Beamer-Board über Zufallslink, Urkunden zum Drucken – wie Algo Quest, je Kurs einschaltbar
- ✅ PR 7 (1.12.0): Kurs-Einstellungen – Level-Art je Kurs (Pflicht/Vertiefung/Bonus/Später, nur Anzeige: Deep-Links bleiben offen), Auftrag der Lehrkraft auf der Startseite, Grundkurs: eA-Level „freiwillig“; Datenschutzhinweise (`docs/DATENSCHUTZ.md`, `#/datenschutz`) auf dem Stand des Verbunds; Löschung über die Verbund-API vollständig getestet (jede Tabelle mit Konto-Bezug); Abnahme-Checkliste `docs/ABNAHME.md`

## Phase 6 – Materialien ↔ Plattform
- ✅ Erklärvideos in der App (1.13.0): Knopf „▶ Erklärvideo“ auf der Modulseite und Link je Level auf der Themenseite – erscheinen, sobald in `app/js/data/videos.js` eine Adresse steht (nur verlinkt, nie eingebettet)
- ✅ Videoreihe unter Materialien (1.14.0): Folien jedes Erklärvideos (Schülerfassung, Lehrkraftfassung mit Sprechertext, Original) beim passenden Level auf der Material- und Themenseite
- [ ] Aufnahmen der Videos ablegen bzw. Adressen in `app/js/data/videos.js` eintragen, Video-QR-Codes auf die Merkblätter – wartet auf die Aufnahmen
- ✅ Release-Workflow (`.github/workflows/materialpaket.yml`): baut bei jedem Tag `v*` alle Materialien neu und hängt Lehrkräfte-Paket und PDFs als ZIP an das Release (Repo privat); manuell startbar als Artefakt
- ✅ Materialien als Download (`#/material`): Schüler-PDF ohne Lösungen, Lehrkraft-PDF mit Lösungen/Notizen/Klausuren, Originale (docx/pptx, ZIP je Akte) nur für den Admin

## Ideen (später)
- IServ-SSO: kommt später über das Portal, für AutomatenLab nichts zu tun
