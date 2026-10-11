# Übergabe an Claude Code

So startest du: Repository klonen, im Ordner `claude` starten, in den Plan-Modus wechseln (Shift+Tab) und den Prompt unten einfügen. Claude Code arbeitet dann Phase 1 ab und meldet sich mit der Analyse und den offenen Fragen, bevor es Code für den Login schreibt.

```bash
gh repo clone frankjuchim/AutomatenLab && cd AutomatenLab
gh repo clone frankjuchim/AlgoQuest ../AlgoQuest      # Vergleichsprojekt daneben ablegen
claude
```

---

## Prompt

Du übernimmst die Weiterentwicklung von **AutomatenLab** (dieses Repository). Es enthält eine fertige, im Unterricht eingesetzte Lern-Web-App zu Automaten und formalen Sprachen (`app/`, live unter https://automatenlab.frankjuchim.de, statisch auf CapRover), einen Generator für das komplette Unterrichtsmaterial (`materials/`, Word/PowerPoint) und die Planung einer Erklärvideo-Reihe. Ich bin Frank, Informatiklehrer (Niedersachsen, Sek II); ich entscheide fachlich und didaktisch, du technisch – Produktfragen klärst du mit mir.

**Ziel:** Die App bekommt – wie mein Schwesterprojekt **AlgoQuest** (`frankjuchim/AlgoQuest`, liegt unter `../AlgoQuest`; sonst `gh repo clone frankjuchim/AlgoQuest ../AlgoQuest`) – ein **Login mit Lehrkraft-/Schülerrollen, Kursen, geräteübergreifendem Fortschritt und einem Lehrkraft-Dashboard**. Beide Projekte sollen sich gleich anfühlen und gleich gewartet werden.

**Lies zuerst vollständig:** `CLAUDE.md` (verbindliche Regeln), `README.md`, `docs/LOGIN_KONZEPT.md`, `docs/ROADMAP.md`, `docs/ENTSCHEIDUNGEN.md`, `app/ARCHITECTURE.md`, `app/README.md` (Routen-Liste), `app/js/core/progress.js`, `app/js/main.js`, `app/js/modules/manifest.js`, `docs/DEPLOYMENT.md`, `docs/DATENSCHUTZ.md`. Für Materialfragen zusätzlich `docs/MATERIALIEN.md` und `docs/einheit/PLAN.md` (Abschnitt 1 = verbindliche Fachnotation).

**Phase 1 – Analyse (jetzt, ohne Code-Änderungen an der App):**
1. Prüfe, dass alles läuft: `npm install`, `python3 -m pip install -r materials/requirements.txt` (Graphviz nötig), `npm test`, `bash materials/scripts/check.sh`, App starten (`npm run app:serve`) und `node qa/qa-routes.mjs http://localhost:8080/`. Melde Abweichungen.
2. Analysiere AlgoQuest gründlich: Tech-Stack (Frontend/Backend/Datenbank), Authentifizierung (Ablauf, Sessions/Tokens, Passwort-Hashing, Rollen), Datenmodell (Kurse/Klassen, Fortschritt), Lehrkraft-Ansichten, Login-Oberfläche, Datenschutz-Lösungen, Tests, Deployment (Dockerfile, CapRover, GitHub Actions), Projektstruktur und Konventionen.
3. Schreibe `docs/ALGOQUEST_VERGLEICH.md`: Tabelle „AlgoQuest – AutomatenLab-Konzept – Empfehlung“ für jeden Punkt aus `docs/LOGIN_KONZEPT.md` (übernehmen / anpassen / bewusst anders, jeweils mit Begründung). Prüfe insbesondere, ob sich Code oder ein gemeinsames Paket (Auth, Kursverwaltung, Dashboard-Bausteine) teilen lässt und ob ein **gemeinsamer Login für beide Apps** sinnvoll ist.
4. Lege mir dann – knapp – vor: empfohlene Architektur, Abweichungen vom Konzept, die offenen Fragen aus `docs/LOGIN_KONZEPT.md` Abschnitt 9 (mit deiner Empfehlung je Frage) und einen Umsetzungsplan für Phase 2–5 mit Meilensteinen, die je in einem Pull Request abgeschlossen werden. **Warte auf mein OK**, bevor du mit Phase 2 beginnst.

**Danach (Phase 2–5, je Meilenstein ein Branch + PR):** Server-Grundgerüst und ein gemeinsamer Container (App + API, SQLite im persistenten Volume `/data` oder was AlgoQuest nutzt) → Anmeldung (Admin-Bootstrap, Einladungen für Lehrkräfte, SuS-Zugänge mit Pseudonymen und druckbaren Zugangskarten, Rate-Limit, CSRF, Sessions) → Fortschritts-Synchronisation über einen Speicher-Adapter in `progress.js` (öffentliche API unverändert, Gast-Fortschritt beim Anmelden übernehmen, offline weiterarbeiten) → Lehrkraft-Dashboard (Lernstand-Matrix Level × SuS, Aufträge, Freischaltung Pflicht/Vertiefung/Bonus, CSV-Export, automatische Löschung abgelaufener Kurse, Datenschutzseite). Abnahmekriterien: `docs/LOGIN_KONZEPT.md` Abschnitt 8.

**Harte Regeln (Details in `CLAUDE.md`):**
- Alle bestehenden Routen/Deep-Links aus `app/README.md` funktionieren unverändert und **ohne Anmeldung** – sie stehen als QR-Codes auf gedruckten Blättern. `qa/qa-routes.mjs` muss nach jedem Meilenstein grün sein.
- Gastmodus bleibt vollwertig; Login ist ein Zusatz.
- Datensparsamkeit: keine Klarnamen/E-Mails von SuS, keine externen Dienste/CDNs/Tracker, Löschkonzept umsetzen. Keine echten Personendaten in Tests oder Seeds.
- Die App bleibt ohne Build-Schritt (Vanilla-ES-Module); neue Server-Abhängigkeiten sparsam und begründet.
- Jede API-Route bekommt Rechte-Tests für alle Rollen. Secrets nur über Umgebungsvariablen (`.env.example` pflegen).
- Deutsch in UI, Doku und Commit-Nachrichten. Barrierefreiheit (Tastatur, Kontraste, Großansicht) wie im Rest der App.
- Pflege `docs/ENTSCHEIDUNGEN.md`, `docs/ROADMAP.md` (Häkchen), `docs/DEPLOYMENT.md` und `README.md` laufend mit.
- Vor dem ersten Deploy mit Server: schriftliche Schritt-für-Schritt-Anleitung für mich (CapRover: persistentes Verzeichnis, Umgebungsvariablen, Backup), denn Datenverlust im laufenden Schuljahr wäre schlimm.

Fang mit Phase 1 an.
