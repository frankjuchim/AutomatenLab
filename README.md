# AutomatenLab – Maschinen, die Sprache verstehen

Unterrichtseinheit **Automaten und formale Sprachen** (Informatik Sek II, KC Niedersachsen, Notation nach den Ergänzenden Hinweisen 2025) mit

* **Web-App „AutomatenLab“** – 13 interaktive Übungsmodule (Akzeptor-Arena, Baukasten, Keller-Labor, Ableitungs-Rallye, Turing-Labor …), live unter <https://automatenlab.frankjuchim.de>
* **Unterrichtsmaterial** – 16 Doppelstunden (Pflicht/Vertiefung/Bonus) mit Arbeitsblatt, Lehrkraft-Handreichung und Folien, 12 Merkblätter, Boss-Level, Übungsklausur
* **Erklärvideo-Reihe** – 9 Videos + 2 Extras: Folien, Ablaufpläne, OBS-Overlays, Thumbnails

Alle Materialien werden per Skript erzeugt; jeder Automat, jede Grammatik und jede Lösung wird dabei automatisch geprüft.

## Schnellstart

```bash
# Voraussetzungen: Node ≥ 22, Python ≥ 3.10, Graphviz (macOS: brew install graphviz)
npm install                              # Node-Pakete für Materialien + Playwright (QA)
python3 -m pip install -r materials/requirements.txt

npm run dev                              # Server + Web-App unter http://localhost:8080
npm test                                 # App- und Server-Tests
npm run materials:build                  # alle Word-/PowerPoint-Dateien → materials/dist/Automaten_LK (ca. 3–4 min)
```

Vorschaubilder (PDF/PNG) brauchen zusätzlich LibreOffice (`brew install --cask libreoffice`).

## Aufbau

| Ordner | Inhalt |
|---|---|
| `app/` | Web-App (Vanilla-JS-ES-Module, kein Build-Schritt), App-Tests. Details: `app/README.md`, `app/ARCHITECTURE.md` |
| `src/`, `test/`, `scripts/` | Server (Node 22, Express 5, SQLite) nach dem Muster von Algo Quest, Server-Tests, Vertragsprüfung des Verbunds |
| `materials/` | Material-Pipeline: `lib/` (automata.py, docstyle.js, deckstyle.js, videostyle.js), `content/dsXX/` je Doppelstunde, `content/video/`, `build_all.sh` |
| `qa/` | Playwright-Prüfskripte (alle Deep-Links, Konsolenfehler, Screenshots) |
| `docs/` | Planung der Einheit, Styleguide, Architektur, **Login-Konzept**, Roadmap, Deployment, Übergabe an Claude Code |
| `.github/` | GitHub-Prüfung (Tests + alle Deep-Links im Container), PR-Vorlage |
| `Dockerfile`, `captain-definition` | Deployment auf CapRover (Webhook: jeder Push auf `main` geht live, siehe `docs/DEPLOYMENT.md`) |

Erzeugte Dateien (`materials/build`, `materials/out`, `materials/dist`) sind nicht versioniert. Das fertige Lehrkräfte-Paket hängt als ZIP an den **GitHub-Releases**.

## Weiterentwicklung

Die Entwicklung läuft mit Claude Code. Einstieg: `CLAUDE.md` (Regeln für den Agenten). Nächster großer Schritt: **Anschluss an den Plattform-Verbund InfoLabs** – Anmeldung über das Portal https://labs.frankjuchim.de, Fortschritts-Synchronisation und Lehrkraft-Dashboard. Verbindlich ist der Vertrag des Plattform-Verbunds: https://github.com/frankjuchim/labs/blob/main/VERTRAG.md (Version 1.1). Umsetzung: `docs/VERBUND.md`, Plan: `docs/ROADMAP.md`.

Wichtig für alle Änderungen:

* Die App-Routen (`#/arena?…`) stehen als QR-Codes auf gedruckten Materialien – **sie dürfen nicht brechen**.
* Die App bleibt **ohne Anmeldung nutzbar** (Gastmodus); die Anmeldung läuft nur über das Portal InfoLabs und ist ein Zusatz.
* Fachliche Notation strikt nach `docs/einheit/PLAN.md`, Abschnitt 1.

## Lizenz

Noch festzulegen (Vorschlag: Code MIT, Unterrichtsmaterial CC BY-SA 4.0). Schriften in `materials/fonts/`: Caladea (Apache 2.0), Carlito (OFL 1.1); App-Schrift Atkinson Hyperlegible (OFL 1.1).
