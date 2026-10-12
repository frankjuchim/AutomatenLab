# Aufgabenformat von AutomatenLab

Vertrag des Plattform-Verbunds (https://github.com/frankjuchim/labs/blob/main/VERTRAG.md, Version 1.1) §9: Lösungen,
Erklärungen und nicht abgerufene Tipps bleiben auf dem Server, geprüft wird nur dort, Punkte vergibt nur der Server.
AutomatenLab nutzt statt der Block-Aufgaben von Algo Quest **eigene Interaktionen** (Simulatoren, Automaten-Editor,
Abi-Tabellen). Sie werden hier beschrieben, wie §9 es für neue Interaktionen vorsieht.

## 1. Wo was liegt

| Ort | Inhalt | ausgeliefert? |
|---|---|---|
| `inhalte/<modul>.js` | Aufgaben **mit** Lösungen, Prüfprädikaten, Tipps, Erklärungen (ES-Module) | **nein** – nur der Server liest sie |
| `src/aufgaben/index.js` | Aufgabentypen: öffentlicher Teil, Prüfung, Lösungsteil, Abzeichen; Katalog mit IDs, Stufen, Punkten | nein |
| `src/lernen.js` | Lernstand: Prüfen, Tipp, „Lösung zeigen“, Punkteformel, Abzeichen | nein |
| `app/js/engine/pruefer.js` | reine Prüffunktionen ohne Daten (Quizfrage, Detektiv-Option, DEA-Vergleich) – vom Server und für die Demo-Aufgaben genutzt | ja (enthält keine Lösungen) |
| `app/js/data/demo.js` | eigene Demo-Aufgaben des Gastmodus (mit Lösung, ohne Punkte) | ja |
| `app/js/data/gast.js` | welche Routen Gäste öffnen dürfen | ja |

`test/loesungen.test.js` sucht alle Lösungs-, Tipp- und Erklärungstexte aus `inhalte/` in den Dateien unter `app/` –
findet er einen, schlägt die Prüfung fehl.

## 2. Aufgaben-IDs, Stufen, Punkte

* ID = `<modul>:<schlüssel>` und gleich dem bisherigen Fortschrittsschlüssel von `progress.js`
  (`baukasten:endet-b`, `detektiv:fall-3`, `quiz:ds-7`, `quiz:welt-B`). Deep-Links bleiben unverändert
  (`#/baukasten?level=2`, `?aufgabe=endet-b`, `#/detektiv?fall=3`, `#/quiz?ds=7`).
* Punkte nach §9: Standardpunkte **10/20/30 je Stufe**, beim ersten Lösen
  `round(punkte × max(0.25, 1 − 0.25·Fehlversuche − 0.2·Tipps))`, nach „Lösung zeigen“ 0 Punkte (danach selbst
  gelöst = „nachgelöst“, zählt als gelöst und für Stufen-Abzeichen, ohne Punkte).
* **Ausnahme Exit-Tickets (Quiz):** Ein Quiz ist eine Aufgabe; jede Frage wird einmal gewertet (richtig 1,
  teilweise ½, falsch 0), die Lösung der Frage erscheint sofort danach. Punkte = Anteil richtig im **ersten
  Durchgang** × Quizpunkte (Exit-Ticket je Level 10, Welt-Quiz 30). Wiederholen ist Übung ohne Wertung.

| Modul | Aufgaben | Stufe | bisher (Browser) |
|---|---|---|---|
| Automaten-Baukasten | 18 Challenges | Basis 1 / Standard 2 / Profi 3 → 10/20/30 | 20/30/40 |
| Sprach-Detektiv | 12 Fälle | Fall 1–4: 1, 5–8: 2, 9–12: 3 → 10/20/30 | 30/20/10 nach Versuchen |
| Level-Quiz | 16 Exit-Tickets + 4 Welt-Quizze | – | 10 bzw. 30 × Bestwert |

## 3. Interaktionen

### Quiz (`quiz`)
* Öffentlich: `fragen[]` mit `mc { frage, optionen:[{id,text}] }`, `wf { aussage, begruendungen:[{id,text}] }`,
  `zuordnung { frage, links[], rechts[] }`. Optionen werden bei jeder Anzeige gemischt; `id` ist ein HMAC-Wert –
  die Position in den Daten (dort ist die erste Option richtig) bleibt verborgen.
* Antwort: `{ frage, wahl }` · `{ frage, wahr, begruendung }` · `{ frage, zuordnung:[rechts je links] }`.
* Rückmeldung: `wert`, richtige Option bzw. Zuordnung, Erklärung.

### Sprach-Detektiv (`detektiv`)
* Öffentlich: der Automat (er ist Gegenstand der Aufgabe), Testwort-Vorschläge, vier Beschreibungen mit `id`.
  Testwörter simuliert der Browser selbst.
* Antwort: `{ wahl }`. Falsch → kürzestes Gegenbeispiel (Wort, akzeptiert ja/nein) und ein Fehlversuch.
* Lösungsteil: richtige Beschreibung, Bedeutung der Zustände.

### Automaten-Baukasten (`baukasten`)
* Öffentlich: Aufgabentext, Σ, Beispielwörter, Zahl der Tipps.
* Antwort: `{ automat }` im Engine-Format (wie `DfaEditor.toJSON()`, höchstens 40 Zustände, Σ der Aufgabe).
  Geprüft wird die **Sprache** (jeder äquivalente DEA ist richtig); falsch → kürzestes Gegenbeispiel.
* Tipps einzeln abrufbar (kosten Punkte). Lösungsteil: Musterlösung (DEA).

## 4. API (angemeldet; Schüler nur mit freigeschaltetem Kurs, Vertrag §4)

```
GET  /api/katalog[?modul=]            öffentliche Aufgabenliste (Titel, Stufe, Punkte – ohne Lösungen)
GET  /api/lernstand                   Lernstand im Format von progress.js (punkte, solved, best, badges)
GET  /api/aufgaben/:id                öffentlicher Teil + Zustand (+ Lösungsteil, wenn nicht mehr offen)
POST /api/aufgaben/:id/pruefen        { antwort } → { ok, fertig, rueckmeldung, zustand, geloest, nachgeloest, punkteErhalten, neueAbzeichen, loesung? }
POST /api/aufgaben/:id/tipp           nächster Tipp
POST /api/aufgaben/:id/aufdecken      „Lösung zeigen“ (0 Punkte; nicht beim Quiz)
```

Schreibende Anfragen nur mit gleicher Herkunft und als JSON; höchstens 120 Prüfungen pro Minute und Konto.

## 5. Neues Modul auf den Server holen (Phase 4, PR 4/5)

1. Daten von `app/js/data/<modul>.js` nach `inhalte/<modul>.js` verschieben (Importe auf `../app/js/engine/…`),
   Tests in `app/tests` auf den neuen Pfad umstellen.
2. Reine Prüflogik nach `app/js/engine/pruefer.js` (ohne Daten), Aufgabentyp in `src/aufgaben/index.js` ergänzen
   (`oeffentlich`, `pruefe`, `loesungsteil`, `abzeichen`), Stufen und Punkte nach §2.
3. Modul in `app/js/modules/<modul>.js` auf `ctx.quelle` umstellen (keine `progress.solve/award` mehr).
4. Eigene Demo-Aufgabe in `app/js/data/demo.js` (mit Test gegen die Engine) und Eintrag in `app/js/data/gast.js`.
5. Lösungstexte in `test/loesungen.test.js` aufnehmen, `test/lernen.test.js` um den Ablauf ergänzen.
