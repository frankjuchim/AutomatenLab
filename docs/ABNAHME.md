# Abnahme – AutomatenLab im Plattform-Verbund

Checkliste für Frank vor dem Einsatz im Unterricht. Jeder Punkt ist automatisch getestet (`npm test`, lokale Prüfung
mit allen Deep-Links angemeldet und als Gast); die Abnahme prüft, ob es sich im echten Verbund richtig anfühlt.
Dauer: etwa 45 Minuten mit einem Lehrkraft-Konto und einem Test-Schülerkonto im Portal.

**So sollte es aussehen:** Zu jedem Schritt gibt es einen Screenshot aus einem Beispielkurs mit Fantasie-Schülern
(Ordner [`docs/abnahme/`](abnahme/)). Erzeugt werden sie mit `qa/abnahme.mjs` gegen einen lokalen Testserver
(Aufruf im Kopf des Skripts) – nach Änderungen an der Oberfläche einfach neu erzeugen. Schüleransichten im
Smartphone-Format, Lehrkraft-Ansichten am Desktop.

## Vorbereitung
- [ ] Portal: Test-Kurs anlegen, AutomatenLab freischalten, ein Test-Schülerkonto (Fantasiename) in den Kurs aufnehmen.
- [ ] `https://automatenlab.frankjuchim.de/healthz` zeigt die erwartete Version; im Portal unter Plattformen „Jetzt prüfen“ ohne Fehler.

## Als Gast (abgemeldet)
- [ ] Startseite, `#/themen`, `#/datenschutz` und `#/gast` öffnen sich ohne Anmeldung.
  → [Startseite](abnahme/01-gast-startseite.png) · [Demo-Aufgaben](abnahme/02-gast-demo-aufgaben.png)
- [ ] Je eine Demo-Aufgabe ausprobieren (z. B. Turing-Demo, Sortierer-Runde mit Demo-Karten) – Rückmeldung kommt, keine Punkte.
  → [Turing-Demo](abnahme/03-gast-turing-demo.png)
- [ ] Ein QR-Code von einem Arbeitsblatt (z. B. `#/baukasten?level=3`) führt zur Portal-Anmeldung und danach genau zu dieser Aufgabe.

## Als Schüler
- [ ] Startseite: Auftrag der Lehrkraft oben, Hinweis auf die laufende Challenge, „Aufgaben deiner Lehrkraft“, Link zur Rangliste, Level-Karte mit den Einstellungen des Kurses.
  → [Startseite](abnahme/04-schueler-startseite.png) · [Aufgaben der Lehrkraft](abnahme/05-schueler-aufgaben-der-lehrkraft.png)
- [ ] Aufgabe lösen (z. B. Baukasten Level 3): Punkte erscheinen, im Portal steigt die Kennzahl des Kurses.
  → [Baukasten](abnahme/06-schueler-baukasten.png)
- [ ] Falsch antworten, Tipp holen, „Lösung zeigen“: Punkte sinken wie angekündigt, nach „Lösung zeigen“ 0 Punkte.
- [ ] Training: Arena-Runde (Stufe 1) und Sortierer-Runde – Trainingspunkte, höchstens 30 am Tag.
- [ ] 🏆 Rangliste (wenn eingeschaltet): eigener Eintrag markiert, Filter je Welt.
  → [Rangliste](abnahme/07-schueler-rangliste.png)
- [ ] 🎯 Challenge (Team): eigenes Team und eigener Beitrag, nur Team-Summen, keine fremden Namen.
  → [Team-Challenge](abnahme/08-schueler-challenge-team.png)
- [ ] ⚔️ Boss-Kampf (Einstellung „sofort offen“): Übersicht mit den Bossen A–D, Kampf starten, ein paar Aufgaben beantworten, Seite neu laden (Antworten bleiben), abgeben → Auswertung mit Lösungen, Punkte oben rechts steigen.
  → [Übersicht](abnahme/09-schueler-boss-uebersicht.png) · [Kampf mit Uhr](abnahme/10-schueler-boss-kampf.png) · [Auswertung](abnahme/11-schueler-boss-auswertung.png)
- [ ] Aufgaben der Lehrkraft lösen (Detektiv-Fall, Quiz, Grammatik): keine Punkte, aber „gelöst“.
  → [Detektiv-Fall](abnahme/12-schueler-detektiv-der-lehrkraft.png) · [Quiz](abnahme/13-schueler-quiz-der-lehrkraft.png)
- [ ] Anderes Gerät: Lernstand ist derselbe.

## Als Lehrkraft (`/lehrer`)
- [ ] Anmeldung über den Knopf auf der Startseite führt in den Lehrkraft-Bereich; die Startseite zeigt „Zum Lehrkraft-Bereich“.
- [ ] Navigation 📚 Kurse · 📖 Aufgaben · ✏️ Eigene Aufgaben · 📂 Materialien · 🗺️ Themen · ⌂ Portal wie in Algo Quest.
  → [Meine Kurse](abnahme/14-lehrkraft-kurse.png)
- [ ] Kurs öffnen: 👥 Schüler zeigt das Test-Konto mit Punkten; 🏆 Rangliste; 🔗 Beitritt verweist aufs Portal.
  → [Schüler](abnahme/15-lehrkraft-schueler.png) · [Rangliste](abnahme/19-lehrkraft-rangliste.png)
- [ ] 📊 Auswertung: Lernstand-Matrix, Boss-Ergebnisse (bester Versuch je Welt), Fallen-Profil, Aufgabenstatistik mit häufigen falschen Antworten, vier CSV-Exporte öffnen sich in Excel/LibreOffice.
  → [Matrix](abnahme/16-lehrkraft-auswertung.png) · [Boss-Ergebnisse](abnahme/17-lehrkraft-boss-ergebnisse.png) · [Fallen-Profil](abnahme/18-lehrkraft-fallen-profil.png)
- [ ] ⚙️ Einstellungen: Grundkurs wählen, einen Auftrag mit Level schreiben, ein Level auf „später“ setzen, Boss-Kämpfe, Rangliste und Beamer-Board einstellen, speichern → beim Schüler sichtbar; QR-Link auf das „später“-Level funktioniert trotzdem; der Board-Link öffnet sich ohne Anmeldung auf dem Beamer; „Neuen Link erzeugen“ sperrt den alten.
  → [Einstellungen](abnahme/22-lehrkraft-einstellungen.png) · [Beamer-Board](abnahme/31-beamer-board.png)
- [ ] 🎯 Challenges: eine Team-Challenge (Sortierer) und eine Einzel-Challenge (zwei Aufgaben) anlegen; Zwischenstand ansehen; auf dem Board erscheint die laufende Challenge; „Jetzt beenden“ → Abzeichen, Sieger-Urkunden drucken.
  → [Challenges](abnahme/20-lehrkraft-challenges.png) · [Zwischenstand](abnahme/21-lehrkraft-challenge-zwischenstand.png)
- [ ] 🏅 Urkunden: Vorschau prüfen, als PDF drucken (A4, eine Seite je Schüler).
  → [Urkunden](abnahme/23-lehrkraft-urkunden.png)
- [ ] 📖 Aufgaben: „Vorschau mit Lösung“ bei drei Modulen öffnen (z. B. Turing, Keller, Quiz) – Lösung eingesetzt, „Ohne Lösung ausprobieren“ geht, der eigene Lernstand bleibt leer. Boss-Pool einer Welt aufklappen (mit richtigen Antworten).
  → [Aufgaben](abnahme/24-lehrkraft-aufgaben.png) · [Boss-Pool](abnahme/25-lehrkraft-boss-pool.png) · [Vorschau Turing](abnahme/26-lehrkraft-vorschau-turing.png)
- [ ] ✏️ Eigene Aufgaben: je ein Quiz, eine Baukasten-Challenge, einen Detektiv-Fall und eine Grammatik-Challenge anlegen, freigeben → beim Schüler unter „Aufgaben deiner Lehrkraft“, lösen, in der Liste „gelöst“; eine Aufgabe in einen zweiten Kurs kopieren (kommt dort als Entwurf an).
  → [Liste](abnahme/27-lehrkraft-eigene-aufgaben.png) · [Quiz-Editor](abnahme/28-lehrkraft-editor-quiz.png) · [Detektiv-Editor](abnahme/29-lehrkraft-editor-detektiv.png)
- [ ] 📂 Materialien: Lehrkraft-PDF einer Doppelstunde öffnet sich.
  → [Materialien](abnahme/30-lehrkraft-materialien.png)

## Löschung (Verbund)
- [ ] Test-Schüler im Portal löschen → in AutomatenLab verschwindet er aus der Schülerliste (Lernstand, Boss-Kämpfe, Team-Zuordnungen gelöscht).
- [ ] Test-Kurs im Portal löschen → Kurs verschwindet aus „Meine Kurse“ (mit eigenen Aufgaben und Challenges).

## Offen nach der Abnahme
- Erklärvideos aufnehmen und in `app/js/data/videos.js` verlinken (Bonus, später).
- Release v1.0 mit dem Materialpaket, sobald GitHub Actions wieder läuft (`.github/workflows/materialpaket.yml`).
