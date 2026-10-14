# Styleguide & Arbeitsanleitung für Material-Agenten

Du erstellst (bzw. änderst) Unterrichtsmaterialien für die Einheit „Maschinen, die Sprache verstehen“ (Informatik LK, Niedersachsen).
**Pflichtlektüre vor dem Start:**
1. `docs/einheit/PLAN.md` – Sequenzplan, verbindliche Notation (Abschnitt 1!), KC, App-Module.
2. Referenzstunde DS01 (Qualitätsmaßstab!):
   - Quelltexte: `materials/content/ds01/automata_ds01.py`, `build_ds01.js`, `build_m01.js`
   - Ergebnisse: `materials/out/DS01_*.docx|pptx`, `materials/out/M01_Merkblatt_DEA.docx`
   - Vorschaubilder: `materials/build/prev/ab_sheet.png`, `lk_sheet.png`, `ds01_folien.jpg`, `m01_sheet.png` (ansehen!)
3. Bibliotheken (NICHT verändern; bei Bedarf eigene Hilfsfunktionen lokal in deinem content-Ordner):
   - `materials/lib/automata.py` – DFA, NFA, Mealy, PDA (Kellerautomat), Grammar, check(), render(), to_dot() (Optionen: error_state, chain, ranks, edge_style, highlight, label_override, rankdir …)
   - `materials/lib/docstyle.js` – Word-Bausteine: doc, h2, h3, p (Inline: **fett**, *kursiv*, `code`, ^hoch^, ~tief~), bullets, numbered (ref 'numbers'…'numbers6'), checklist, table, fillTable, info, merke, tip, warn, task, sub, lines, drawBox, img, qr, pageBreak, save, preview
   - `materials/lib/deckstyle.js` – Folien: deck().title/section/question/bullets/image/cards/twoCol/task/merke/table/app/end/blank, preview, contactSheet
4. App-Routen für QR-Codes: `app/README.md`, Abschnitt „Routen für QR-Codes“ (nur dort aufgeführte Routen/IDs verwenden!). Sieh dir das jeweilige Modul kurz an (js/data/*.js), damit Aufgabe und App zusammenpassen.
5. Quellenmaterial der Lehrkraft (Abituraufgaben, KC, alte Folien) liegt im claude.ai-Projekt; die relevanten Inhalte sind in PLAN.md zusammengefasst. Abi-Aufgaben NICHT wörtlich übernehmen, sondern „angelehnt an Abi 20xx …“ eigene Varianten bauen (in der Lehrkraft-Handreichung die Original-Aufgabe als Vertiefung nennen, z. B. „Original: Abi 2022 eA Aufgabe C, Teil b“).

## Ordner & Dateinamen
- Quelltexte: `materials/content/dsXX/` (XX zweistellig), Grafiken: `materials/build/img/dsXX/`, Vorschau: `materials/build/prev/`
- Ausgabe: `materials/out/`
  - `DSXX_AB_<Kurztitel>.docx`, `DSXX_Lehrkraft_<Kurztitel>.docx`, `DSXX_Folien_<Kurztitel>.pptx`
  - `MXX_Merkblatt_<Thema>.docx`
  - ggf. `BossLevel_<Welt>_<Thema>.docx` (SuS) + `BossLevel_<Welt>_Erwartungshorizont.docx`
  - Kurztitel ohne Umlaute/Leerzeichen (ae, oe, ue, ss; Bindestriche).

## Fachliche Sorgfalt (oberste Priorität)
- **Jeder** Automat und jede Grammatik wird in Python mit `automata.py` definiert und mit `check()` gegen ein Prädikat (alle Wörter bis Länge ≥ 6, wenn sinnvoll) bzw. Beispiel-/Gegenbeispiellisten verifiziert, **bevor** er gerendert wird. Lösungen (Zustandsfolgen, Kellertabellen, Ableitungen, Minimierungsrunden) werden aus dem Code erzeugt (path_str, PDA.search, Grammar.derivation_str, minimize_pairs) – nicht von Hand ausgedacht.
- Notation exakt nach PLAN.md Abschnitt 1 (Ergänzende Hinweise 2025): Zustände S0, S1 …; Fehlerzustand weglassen nur mit Hinweis; Mealy „e / a“, ε für leere Ausgabe, keine Endzustände; Kellerautomat „(Kellerzeichen, Eingabe) : Ablage“, rechtes Zeichen zuerst abgelegt, Γ, #, Akzeptanz über Endzustand; Kellertabelle mit Spalten „Zustand | Belegung Kellerspeicher | oberstes Kellersymbol | verarbeitetes Eingabezeichen“ (oberstes Zeichen links); Grammatik mit N, T, Startsymbol, Produktionsregeln, rechtsregulär A → aB | a | ε; Ableitung mit ⇒.
- Graphen lesbar halten: `chain=[...]` für Hauptketten, `rankdir`, ggf. `ranks`; Ergebnis-PNG immer ansehen (Read) und Layout verbessern, bis es klar ist.

## Didaktische Anforderungen
- **Arbeitsblatt (AB)**: 2–4 Seiten. Kurzer motivierender Einstieg/Kontext, ggf. Info-Kasten, 3–5 Aufgaben gestuft (`niveau: 'Basis' | 'Standard' | 'Profi'`, `afb`), Operatoren **fett** (Du-Form auf ABs: „Stelle … dar“, „Begründe …“). Mindestens ein `D.qr({...})`-Kasten zum passenden App-Modul (Deep-Link). Schreibflächen (`lines`, `drawBox`) dort, wo geschrieben/gezeichnet wird. Am Ende Selbstcheck (`checklist`, „Ich kann …“). Spielerische Elemente (Rätsel, Challenges, Wettbewerb, Rollenspiel, Bug-Bounty …) wie in PLAN.md vorgesehen – aber jede Aufgabe zahlt auf KC/Abi ein.
- **Abi-artige Aufgaben** (Boss-Level, Abi-Training, Übungsklausur): Sie-Form und Operatoren wie im Zentralabitur, BE-Angaben, Materialteil mit Abbildungen („Abbildung 1: …“), Hinweis zum Fehlerzustand wo nötig.
- **Lehrkraft-Handreichung (LK)**: Überblick-Tabelle (Lernziele, KC-Bezug, Abi-Bezug inkl. Original-Abiaufgaben zur Vertiefung, Material, Vorbereitung), Verlaufsplan 90 min als Tabelle (Zeit | Phase | Unterrichtsgeschehen | Sozialform/Medien), ggf. Kopiervorlagen (Karten, Stationskarten), **vollständige Lösungen** zu allen AB-Aufgaben (mit Grafiken), typische Fehler (`warn({ titel, fallen: ['P…'] }, …)` – jeder Warnkasten nennt die Abitur-Fallen P1–P10, die er behandelt, Liste in `app/js/data/fallen.js`), Differenzierung, Hausaufgabe. Bei DS mit Boss-Level: Hinweise zum Einsatz.
- **Folien (PPTX)**: 12–20 Folien, Ablauf Einstieg → Erarbeitung → Übung → Sicherung (Abschnittsfolien `section`), abwechslungsreiche Layouts (question, cards, image, twoCol, task, app, merke, table, end), Sprechernotizen (`notes`) mit Hinweisen für die Lehrkraft, Fließtext ≥ 18 pt, keine Textwüsten. Letzte Folie `end` mit Hausaufgabe.
- **Merkblatt**: 1–2 Seiten, Sicherungscharakter (Definitionen, Notation, Vorgehen in Schritten, Mini-Beispiel mit Grafik, „Abi-Check“ mit Operatoren und Antwortmustern, typischer Fehler). Kopf wie M01: `D.doc({kind:'MB', title, subtitle:'Merkblatt MXX · Level … · …', metaText:'MXX  ·  Welt …', code:'MXX · Merkblatt …', body})`.
- Sprache: Deutsch, korrekte Fachsprache, deutsche Anführungszeichen „…“, Gedankenstrich –, Symbole Σ, Γ, ε, ⇒, →. Keine Emojis.

## Qualitätssicherung (Pflicht, vor Abschluss)
1. Build-Skripte laufen fehlerfrei; alle `check()`-Aufrufe grün.
2. Folien in PowerPoint/LibreOffice öffnen lassen (keine Reparatur-Meldung); optional `python3 -m zipfile -t <deck>.pptx`.
3. Vorschau rendern (`D.preview`, `S.preview` + `S.contactSheet`) und **alle Seiten/Folien ansehen**: kein Textüberlauf, keine abgeschnittenen Grafiken, keine leeren Platzhalter, sinnvolle Seitenumbrüche (Aufgabenkopf nicht allein am Seitenende), Grafiken groß genug, aber nicht seitenfüllend.
4. Lösungen in der Lehrkraft-Handreichung stimmen mit dem Arbeitsblatt überein (gleiche Wörter, gleiche Zustandsnamen, gleiche Abbildungsnummern).
5. Kurzer Bericht (max. 25 Zeilen): erstellte Dateien, verwendete App-Routen, Abi-Bezüge, Auffälligkeiten/offene Punkte.
