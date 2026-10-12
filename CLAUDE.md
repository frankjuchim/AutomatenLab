# CLAUDE.md – Arbeitsregeln für dieses Repository

Projekt: **AutomatenLab** – Unterrichtseinheit „Maschinen, die Sprache verstehen“ (Automaten und formale Sprachen, Informatik Sek II, Niedersachsen) mit Web-App, generiertem Unterrichtsmaterial und Erklärvideo-Reihe. Inhaber: Frank Juchim (Lehrkraft Mathematik/Informatik). Sprache im Projekt: **Deutsch** (UI-Texte, Doku, Commit-Nachrichten); Code-Bezeichner dürfen Englisch oder Deutsch sein, wie im jeweiligen Modul üblich.

## Orientierung
- `app/` – Web-App, Vanilla-JS-ES-Module, **kein Build-Schritt, keine Laufzeit-Abhängigkeiten aus dem Netz**. Architektur: `app/ARCHITECTURE.md`; Routen-Liste (verbindlich für QR-Codes): `app/README.md`.
- `src/` – Server (Node 22, Express 5, better-sqlite3, CommonJS; Muster Algo Quest/Portal), `test/` – Server-Tests (node:test + supertest), `scripts/vertrag_pruefen.js` – unveränderte Kopie aus `frankjuchim/labs`.
- `materials/` – Generator für Word/PowerPoint (Node + Python). Doku: `docs/MATERIALIEN.md`, Regeln: `docs/einheit/STYLEGUIDE.md`.
- `docs/einheit/PLAN.md` – Didaktik und **verbindliche Fachnotation (Abschnitt 1, Ergänzende Hinweise 2025)**.
- **Plattform-Verbund InfoLabs:** Login und Konten kommen aus dem Portal (https://labs.frankjuchim.de). **Verbindlich ist der Vertrag des Plattform-Verbunds: https://github.com/frankjuchim/labs/blob/main/VERTRAG.md (Version 1.2)**, Anschlussanleitung `docs/INTEGRATION.md` dort. Umsetzung hier: `docs/VERBUND.md`. Das Repo `frankjuchim/labs` wird von einer anderen Session gepflegt – **nur lesen, nie ändern**. Abweichungen nie still: Textvorschlag für `VERTRAG.md` (neue Version, Eintrag in §14) in `docs/VERBUND.md` §6 und an Frank.
- `docs/ROADMAP.md` – nächste Ausbaustufen. `docs/ENTSCHEIDUNGEN.md` – Architekturentscheidungen (fortschreiben!). `docs/LOGIN_KONZEPT.md` ist abgelöst (nur noch Sync/Dashboard-Teile gelten).
- Schwesterprojekt **AlgoQuest** (`frankjuchim/AlgoQuest`): Muster für Server, Sicherheit, Deployment, Tests und UI. **Zuerst dort nachsehen und angleichen.**

## Befehle
```bash
npm install && python3 -m pip install -r materials/requirements.txt   # einmalig (+ Graphviz)
npm test                       # App-Tests + Server-Tests (node --test)
npm run dev                    # Server mit App unter http://localhost:8080 (Daten in ./data)
npm run vertrag -- http://localhost:8080   # Vertragsprüfung (Manifest, Pflicht-URLs, /healthz)
node qa/qa-routes.mjs http://localhost:8080/   # alle Deep-Links im Browser prüfen (Playwright)
QA_PORTAL_KEY=<privater Testschlüssel> node qa/qa-routes.mjs <url>   # angemeldet (Server mit PORTAL_URL=http://portal.test + passendem PORTAL_PUBLIC_KEY)
QA_GAST=1 node qa/qa-routes.mjs <url>          # als Gast: nur Demo-Routen offen, alles andere → Anmeldung
npm run materials:build        # alle Materialien → materials/dist/Automaten_LK
npm run materials:pdf          # Downloads für die Plattform → materials/pdf (Schüler-/Lehrkraft-PDF, Originale; braucht LibreOffice) – nach jeder Material-Änderung committen
./materials/build_all.sh ds05  # einzelne Ordner
```

## Unverrückbare Regeln
1. **Deep-Links bleiben stabil.** Jede Route aus `app/README.md` steht als QR-Code auf gedruckten Blättern. Routen und Parameter nie umbenennen oder entfernen; neue nur ergänzen (und in der README dokumentieren). Ohne Sitzung führt eine Route über das Portal-Login genau zu dieser Aufgabe.
2. **Gastmodus = Demo-Aufgaben.** Ohne Anmeldung nur je Modul eine Demo-Aufgabe (`/gast`, im Browser geprüft, keine Punkte, Lernstand nur im Browser); Themenseite, Datenschutz und die Material-Demo (Level 1, `GAST_MATERIAL` in `app/js/data/gast.js`) sind öffentlich. Alles andere nach Anmeldung über das Portal (SSO).
3. **Fachliche Korrektheit vor allem.** Notation exakt nach `docs/einheit/PLAN.md` Abschnitt 1 (Zustände S0…, Fehlerzustand-Hinweis, Mealy „e / a“ mit ε, Kellerautomat „(oberstes Kellerzeichen, Eingabe) : Ablage“ mit Akzeptanz über Endzustand nach vollständiger Eingabe, Abi-Kellertabelle mit vier Spalten, Grammatik mit N, T, Startsymbol, Produktionsregeln). Jeder neue Automat / jede Grammatik wird gegen die Engine (`app/js/engine`, Tests in `app/tests`) bzw. `materials/lib/automata.py` (`check()`) geprüft.
4. **Datenschutz:** keine externen CDNs, Fonts, Analytics oder Tracker; keine Klarnamen/E-Mails von Schülerinnen und Schülern; Datensparsamkeit nach Vertrag §9/§10 (`docs/VERBUND.md`). Keine echten Personendaten in Tests, Seeds oder Commits.
5. **Keine Original-Abituraufgaben und keine fremden Buchauszüge ins Repository** (Urheberrecht). Eigene, angelehnte Varianten sind erlaubt.
6. **Barrierefreiheit:** Tastaturbedienung, Kontraste, Großansicht „A A“ erhalten; neue Oberflächen genauso.
7. Keine Secrets committen (`.env` ist ignoriert; Beispiel in `.env.example`). Tokens nie loggen.
8. **Kein eigenes Login**: keine Passwörter, persönlichen Codes oder Klarnamen auf der Plattform – nur `sub`, Anzeigename, Kurs-IDs und Lernstand (Vertrag §3, §9). `src/jwt.js` und `scripts/vertrag_pruefen.js` sind unveränderte Kopien aus `frankjuchim/labs`, `src/security.js` die Fassung des Portals (nur Cookie-Name `al_s` geändert) – nicht umbauen, sondern bei Änderungen im Portal nachziehen.
9. **Lösungen nur auf dem Server** (Vertrag §9): Lösungen, Referenzautomaten, Prüffunktionen, Tipps und Erklärungen nie in `app/` – sie liegen in `inhalte/`; Prüfung und Punkte nur serverseitig (`src/aufgaben`, `src/lernen.js`). Reine Prüflogik ohne Daten in `app/js/engine/pruefer.js` (gemeinsam für Server und Demo-Aufgaben). `test/loesungen.test.js` wacht darüber. Format und Ablauf zum Umstellen weiterer Module: `docs/AUFGABENFORMAT.md`.

## Arbeitsweise
- Vor größeren Änderungen kurz planen (Plan-Modus), bei offenen Produktentscheidungen Frank fragen – sonst sinnvoll entscheiden und in `docs/ENTSCHEIDUNGEN.md` festhalten.
- Kleine, thematische Commits auf Feature-Branches; PR mit Checkliste aus `.github/pull_request_template.md`.
- ⚠️ **`main` ist per Webhook mit CapRover verbunden: jeder Push auf `main` geht sofort live.** Nach `main` nur nach Franks Freigabe, mit grüner Prüfung, nicht während des Unterrichts; danach Live-Seite prüfen.
- **Fertig heißt:** Tests grün (`npm test`), bei UI-Änderungen `qa/qa-routes.mjs` ohne Fehler und Screenshots angesehen, bei Material-Änderungen Build ohne Fehler und Vorschau geprüft, Doku aktualisiert.
- App-Code: kleine Module, DOM über `h()` aus `app/js/core/dom.js`, Logik DOM-frei in `app/js/engine` (testbar mit `node --test`). Neue Module nach `app/ARCHITECTURE.md` Abschnitt 1.
- Materialien: nie Lösungen „von Hand“ ausdenken – aus den geprüften Python-Daten erzeugen.
- Server (ab Phase 2): Rechte für jede Route testen (jede Rolle), Migrationen statt Schema-Änderungen per Hand, Fehlertexte auf Deutsch, ohne Details zu verraten.
