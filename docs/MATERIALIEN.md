# Material-Pipeline

Alle Arbeitsblätter, Handreichungen, Folien, Merkblätter, Boss-Level, die Übungsklausur, die Einheitsplanung und die Videoreihe werden aus Quelltexten erzeugt. Fachliche Inhalte (Automaten, Grammatiken, Läufe, Tabellen) werden dabei **automatisch geprüft** – so bleibt alles korrekt, wenn etwas geändert wird.

## Ablauf (`materials/build_all.sh`)

1. **Grafiken + Prüfung (Python):** `content/*/automata_*.py` definiert jeden Automaten/jede Grammatik mit `lib/automata.py`, prüft ihn mit `check()` gegen eine Beschreibung der Sprache (alle Wörter bis Länge n) und rendert Graphviz-Grafiken nach `build/img/<ordner>/`. Lösungen (Zustandsfolgen, Kellertabellen, Ableitungen, Minimierungsrunden) werden als JSON abgelegt.
2. **Dokumente (Node):** `content/*/build_*.js` setzt Word-Dateien mit `lib/docstyle.js` und Folien mit `lib/deckstyle.js` (Videofolien: `lib/videostyle.js`) zusammen → `out/`.
3. **Paket:** `scripts/package_dist.js` ordnet alles wie das ausgelieferte Paket → `dist/Automaten_LK/` (1_Pflicht, 2_Vertiefung, 3_Bonus_und_Extra-Uebungen, Merkblaetter, 4_Videoreihe, LIESMICH.txt).

```bash
./materials/build_all.sh              # alles (ca. 3–4 min)
./materials/build_all.sh ds05 video   # nur Dokumente dieser Ordner neu (Grafiken immer komplett)
AUTOMATENLAB_URL=https://… ./materials/build_all.sh   # QR-Codes auf andere Adresse
```

## Ordner

| Ordner | Inhalt |
|---|---|
| `content/ds01` … `ds16` | je Doppelstunde: `automata_dsXX.py`, `build_dsXX.js` (AB, Handreichung, Folien), ggf. `build_mXX.js` (Merkblatt), Boss-Level |
| `content/abschluss` | Übungsklausur + Erwartungshorizont, M12 |
| `content/planung` | Einheitsplanung, Lernlandkarte |
| `content/video` | Videoreihe: `videos.js`/`videos_b.js` (Ablaufpläne + Folien als Daten), Decks, OBS-Overlays, Thumbnails, Planung |
| `lib/` | Bibliotheken (Designsystem, Automaten-Engine), `pptx-theme.js` |
| `fonts/` | Caladea/Carlito für Overlays und Thumbnails |
| `templates/` | `LIESMICH.txt` des Pakets |

## Niveau im Kopf (Grund- und Leistungskurs)

Jedes Dokument und jeder Foliensatz nennt das Anforderungsniveau (KC 2017): „gA und eA“, „nur eA (Leistungskurs)“ oder
„Zusatz“. Es ergibt sich aus dem Level (`ds`) über `lib/niveau.js`; Dokumente ohne Level geben `niveau` an
(Merkblätter, Boss-Level A und C, Übungsklausur), sonst steht „gA und eA (Teile nur eA)“. Die Zuordnung ist dieselbe wie
in der App (`app/js/data/niveaus.js`, Test `app/tests/niveaus.test.js`).

## Downloads auf der Plattform (`materials/pdf`, `#/material`)

`npm run materials:pdf` (nach `build_all.sh`, braucht LibreOffice und `pypdf`) erzeugt aus `out/` die Fassungen, die der
Server unter `#/material` anbietet – sie zählen nicht für Punkte:

| Material | Schüler (PDF) | Lehrkräfte (PDF, nach Anmeldung) | Admin (Original) |
|---|---|---|---|
| Arbeitsblätter, Merkblätter, Lernlandkarte | Aufgabenfassung | dieselbe + Lehrkraft-Handreichung mit Lösungen | docx |
| Folien | Handout ohne Sprechernotizen und ohne Lösungsfolien | mit Notizseiten | pptx |
| Boss-Level | Aufgabe | zusätzlich Erwartungshorizont | docx |
| Einheitsplanung, Übungsklausuren mit Erwartungshorizont, Videoplanung | – | ✔ | docx |

* **Lösungsfolien:** `lib/deckstyle.js` merkt Folien mit Titel „Auflösung …“, „Lösung …“, „Ergebnis: …“, „Ein mögliches …“
  oder dem Vermerk `[NUR LEHRKRAFT]` in den Notizen und schreibt ihre Nummern in `out/*.folien.json`; das Handout lässt
  sie weg. **Markiert wird jede Folie, die eine Aufgabe des Arbeitsblatts, eine App-Aufgabe oder eine Wettbewerbs- bzw.
  Spielrunde löst** (z. B. ausgefüllte Abi-Tabellen zu AB-Aufgaben, Auflösungen, Musterlösungen). Erklärende
  Beispiele aus der Erarbeitung bleiben im Handout. Stand: 22 Folien in 13 Foliensätzen.
* **Whitelist:** `materials/pdf/verzeichnis.json` (Akten je Level, Boss-Level, Klausuren, Einheit). Der Server
  (`src/material.js`) liefert nur dort verzeichnete Dateien aus: Schüler-PDF für Angemeldete (Schüler nur mit
  freigeschaltetem Kurs), Lehrkraft-PDF für Lehrkräfte und Admin, Originale (einzeln oder als ZIP je Akte) nur für den
  Admin. Test: `test/material.test.js`.
* **Demo im Gastmodus:** Die Akten aus `GAST_MATERIAL` (`app/js/data/gast.js`, derzeit nur Level 1) bekommen in
  `verzeichnis.json` das Feld `demo` (Schüler- und Lehrkraftfassung); diese PDFs sind ohne Anmeldung offen, Originale nie.
* **Wo man sie findet:** auf `#/material` (alles), auf der Themenseite bei jedem Level und auf der Startseite
  aufklappbar je Welt unter den Modulen – überall dieselben Daten aus `GET /api/material`.
* `materials/pdf/` ist eingecheckt und kommt ins Image; nach Material-Änderungen neu erzeugen und committen.

## Typische Änderungen

* **Aufgabe auf einem AB ändern:** `content/dsXX/build_dsXX.js`; betrifft sie einen Automaten, zuerst `automata_dsXX.py` anpassen und `check()` laufen lassen; Lösung in der Handreichung aus den erzeugten Daten übernehmen (nicht von Hand schreiben).
* **Neue App-Route auf einem Blatt:** nur Routen aus `app/README.md` („Routen für QR-Codes“) verwenden.
* **Vorschau ansehen:** `D.preview(file)` / `S.preview(file)` erzeugen PNGs (LibreOffice nötig, Pfad über `SOFFICE` setzbar).
* Regeln für Inhalt, Notation und Qualität: `docs/einheit/STYLEGUIDE.md` und `docs/einheit/PLAN.md` (Abschnitt 1 = verbindliche Notation).

## Abhängigkeiten

Node ≥ 20 (`npm install` im Wurzelordner: docx, pptxgenjs, jszip, react, react-dom, react-icons, sharp), Python ≥ 3.10 (`segno`, `pillow`, `matplotlib`), Graphviz (`dot`), optional LibreOffice für Vorschauen.

## Materialpaket als Release
Ein Tag `v*` baut alle Materialien in GitHub Actions neu und hängt `Automaten_LK_<tag>.zip` (Lehrkräfte-Paket) und `Automaten_PDF_<tag>.zip` (PDFs der Plattform) an das Release (`.github/workflows/materialpaket.yml`). Ohne Tag: Actions → Materialpaket → Run workflow (Ergebnis als Artefakt, 7 Tage).

## Erklärvideos unter Materialien
`npm run materials:pdf` legt die Folien jedes Erklärvideos (V1–V9, Extra 1/2 aus `out/video`) beim passenden Level ab (Zuordnung `app/js/data/videos.js`, erstes Level): Schülerfassung, Lehrkraftfassung mit Sprechertext (Notizseiten) und Original. Neue Akten-Art `video`.
