# Abnahme – AutomatenLab im Plattform-Verbund (Phase 4 und 5)

Checkliste für Frank vor dem Einsatz im Unterricht. Jeder Punkt ist automatisch getestet (`npm test`, GitHub-Prüfung
mit allen Deep-Links angemeldet und als Gast); die Abnahme prüft, ob es sich im echten Verbund richtig anfühlt.
Dauer: etwa 30 Minuten mit einem Lehrkraft-Konto und einem Test-Schülerkonto im Portal.

## Vorbereitung
- [ ] Portal: Test-Kurs anlegen, AutomatenLab freischalten, ein Test-Schülerkonto (Fantasiename) in den Kurs aufnehmen.
- [ ] `https://automatenlab.frankjuchim.de/healthz` zeigt die erwartete Version; im Portal unter Plattformen „Jetzt prüfen“ ohne Fehler.

## Als Gast (abgemeldet)
- [ ] Startseite, `#/themen`, `#/datenschutz` und `#/gast` öffnen sich ohne Anmeldung.
- [ ] Je eine Demo-Aufgabe ausprobieren (z. B. Turing-Demo, Sortierer-Runde mit Demo-Karten) – Rückmeldung kommt, keine Punkte.
- [ ] Ein QR-Code von einem Arbeitsblatt (z. B. `#/baukasten?level=3`) führt zur Portal-Anmeldung und danach genau zu dieser Aufgabe.

## Als Schüler
- [ ] Aufgabe lösen (z. B. Baukasten Level 3): Punkte erscheinen, im Portal steigt die Kennzahl des Kurses.
- [ ] Falsch antworten, Tipp holen, „Lösung zeigen“: Punkte sinken wie angekündigt, nach „Lösung zeigen“ 0 Punkte.
- [ ] Training: Arena-Runde (Stufe 1) und Sortierer-Runde – Trainingspunkte, höchstens 30 am Tag.
- [ ] Startseite: Auftrag der Lehrkraft oben, Level-Karte mit den Einstellungen des Kurses (siehe unten).
- [ ] Anderes Gerät: Lernstand ist derselbe.

## Als Lehrkraft (`/lehrer`)
- [ ] Anmeldung über den Knopf auf der Startseite führt in den Lehrkraft-Bereich; die Startseite zeigt „Zum Lehrkraft-Bereich“.
- [ ] Navigation 📚 Kurse · 📖 Aufgaben · 📂 Materialien · 🗺️ Themen · ⌂ Portal wie in Algo Quest.
- [ ] Kurs öffnen: 👥 Schüler zeigt das Test-Konto mit Punkten; 🏆 Rangliste; 🔗 Beitritt verweist aufs Portal.
- [ ] 📊 Auswertung: Lernstand-Matrix, Aufgabenstatistik mit häufigen falschen Antworten, drei CSV-Exporte öffnen sich in Excel/LibreOffice.
- [ ] ⚙️ Einstellungen: Grundkurs wählen, einen Auftrag mit Level schreiben, ein Level auf „später“ setzen, speichern → beim Schüler sichtbar; QR-Link auf das „später“-Level funktioniert trotzdem.
- [ ] 📖 Aufgaben: „Vorschau mit Lösung“ bei drei Modulen öffnen (z. B. Turing, Keller, Quiz) – Lösung eingesetzt, „Ohne Lösung ausprobieren“ geht, der eigene Lernstand bleibt leer.
- [ ] 📂 Materialien: Lehrkraft-PDF einer Doppelstunde öffnet sich.

## Löschung (Verbund)
- [ ] Test-Schüler im Portal löschen → in AutomatenLab verschwindet er aus der Schülerliste (Lernstand gelöscht).
- [ ] Test-Kurs im Portal löschen → Kurs verschwindet aus „Meine Kurse“.

## Offen nach der Abnahme
- Erklärvideos aufnehmen und in `app/js/data/videos.js` verlinken (Bonus, später).
- Release v1.0 mit dem Materialpaket, sobald GitHub Actions wieder läuft (`.github/workflows/materialpaket.yml`).
