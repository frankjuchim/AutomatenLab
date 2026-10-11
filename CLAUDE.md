# CLAUDE.md – Arbeitsregeln für dieses Repository

Projekt: **AutomatenLab** – Unterrichtseinheit „Maschinen, die Sprache verstehen“ (Automaten und formale Sprachen, Informatik Sek II, Niedersachsen) mit Web-App, generiertem Unterrichtsmaterial und Erklärvideo-Reihe. Inhaber: Frank Juchim (Lehrkraft Mathematik/Informatik). Sprache im Projekt: **Deutsch** (UI-Texte, Doku, Commit-Nachrichten); Code-Bezeichner dürfen Englisch oder Deutsch sein, wie im jeweiligen Modul üblich.

## Orientierung
- `app/` – statische Web-App, Vanilla-JS-ES-Module, **kein Build-Schritt, keine Laufzeit-Abhängigkeiten aus dem Netz**. Architektur: `app/ARCHITECTURE.md`; Routen-Liste (verbindlich für QR-Codes): `app/README.md`.
- `materials/` – Generator für Word/PowerPoint (Node + Python). Doku: `docs/MATERIALIEN.md`, Regeln: `docs/einheit/STYLEGUIDE.md`.
- `docs/einheit/PLAN.md` – Didaktik und **verbindliche Fachnotation (Abschnitt 1, Ergänzende Hinweise 2025)**.
- `docs/LOGIN_KONZEPT.md`, `docs/ROADMAP.md` – nächste Ausbaustufen. `docs/ENTSCHEIDUNGEN.md` – Architekturentscheidungen (fortschreiben!).
- Schwesterprojekt **AlgoQuest** (`frankjuchim/AlgoQuest`): hat bereits Login/Backend. Bei Login, Rollen, Server, Deployment und UI-Mustern **zuerst dort nachsehen und angleichen**.

## Befehle
```bash
npm install && python3 -m pip install -r materials/requirements.txt   # einmalig (+ Graphviz)
npm test                       # App-Tests (node --test), später auch Server-Tests
npm run app:serve              # http://localhost:8080
node qa/qa-routes.mjs http://localhost:8080/   # alle Deep-Links im Browser prüfen (Playwright)
npm run materials:build        # alle Materialien → materials/dist/Automaten_LK
./materials/build_all.sh ds05  # einzelne Ordner
```

## Unverrückbare Regeln
1. **Deep-Links bleiben stabil.** Jede Route aus `app/README.md` steht als QR-Code auf gedruckten Blättern. Routen und Parameter nie umbenennen oder entfernen; neue nur ergänzen (und in der README dokumentieren).
2. **Gastmodus bleibt.** Alles Fachliche funktioniert ohne Anmeldung; Login ist ein Zusatz (Synchronisation, Kurse, Dashboard).
3. **Fachliche Korrektheit vor allem.** Notation exakt nach `docs/einheit/PLAN.md` Abschnitt 1 (Zustände S0…, Fehlerzustand-Hinweis, Mealy „e / a“ mit ε, Kellerautomat „(oberstes Kellerzeichen, Eingabe) : Ablage“ mit Akzeptanz über Endzustand nach vollständiger Eingabe, Abi-Kellertabelle mit vier Spalten, Grammatik mit N, T, Startsymbol, Produktionsregeln). Jeder neue Automat / jede Grammatik wird gegen die Engine (`app/js/engine`, Tests in `app/tests`) bzw. `materials/lib/automata.py` (`check()`) geprüft.
4. **Datenschutz:** keine externen CDNs, Fonts, Analytics oder Tracker; keine Klarnamen/E-Mails von Schülerinnen und Schülern; Datensparsamkeit wie in `docs/LOGIN_KONZEPT.md`. Keine echten Personendaten in Tests, Seeds oder Commits.
5. **Keine Original-Abituraufgaben und keine fremden Buchauszüge ins Repository** (Urheberrecht). Eigene, angelehnte Varianten sind erlaubt.
6. **Barrierefreiheit:** Tastaturbedienung, Kontraste, Großansicht „A A“ erhalten; neue Oberflächen genauso.
7. Keine Secrets committen (`.env` ist ignoriert; Beispiel in `.env.example`).

## Arbeitsweise
- Vor größeren Änderungen kurz planen (Plan-Modus), bei offenen Produktentscheidungen Frank fragen – sonst sinnvoll entscheiden und in `docs/ENTSCHEIDUNGEN.md` festhalten.
- Kleine, thematische Commits auf Feature-Branches; PR mit Checkliste aus `.github/pull_request_template.md`.
- **Fertig heißt:** Tests grün (`npm test`), bei UI-Änderungen `qa/qa-routes.mjs` ohne Fehler und Screenshots angesehen, bei Material-Änderungen Build ohne Fehler und Vorschau geprüft, Doku aktualisiert.
- App-Code: kleine Module, DOM über `h()` aus `app/js/core/dom.js`, Logik DOM-frei in `app/js/engine` (testbar mit `node --test`). Neue Module nach `app/ARCHITECTURE.md` Abschnitt 1.
- Materialien: nie Lösungen „von Hand“ ausdenken – aus den geprüften Python-Daten erzeugen.
- Server (ab Phase 2): Rechte für jede Route testen (jede Rolle), Migrationen statt Schema-Änderungen per Hand, Fehlertexte auf Deutsch, ohne Details zu verraten.
