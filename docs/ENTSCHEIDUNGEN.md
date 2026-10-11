# Architekturentscheidungen

Kurzformat: Datum · Entscheidung · Begründung · Alternativen. Neueste oben.

## 2026-10 · Monorepo „AutomatenLab“
App, Material-Pipeline, Videoreihe und Doku liegen in einem Repository. Begründung: Materialien und App verweisen aufeinander (QR-Routen, gleiche Beispiele, gleiche Notation); Änderungen sollen gemeinsam geprüft werden. Erzeugte Dateien werden nicht versioniert, sondern als Release-ZIP verteilt.

## 2026-10 · App ohne Build-Schritt
Vanilla-JS-ES-Module, Graphviz als lokales WASM (`app/vendor/viz.js`). Begründung: läuft im Schulnetz ohne externe Server, lange wartbar, leicht für andere Lehrkräfte nachvollziehbar. Bei Einführung des Logins bleibt das so; der Server liefert die Dateien unverändert aus.

## 2026-10 · Fortschritt zunächst lokal
Version 1.0 speichert nur im Browser (`localStorage`, Schlüssel `automatenlab.v1`). Der Login (siehe `LOGIN_KONZEPT.md`) ergänzt einen Server-Speicher, ohne die API von `progress.js` zu ändern.

## offen · Login-Stack
Wird nach Analyse von AlgoQuest entschieden (Phase 1 der Roadmap).
