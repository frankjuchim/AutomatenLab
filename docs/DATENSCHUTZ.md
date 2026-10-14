# Datenschutz – Arbeitsgrundlage

> Kein Rechtsrat. Vor dem Einsatz mit Anmeldung im Unterricht mit Schulleitung und behördlichem Datenschutzbeauftragten abstimmen (Niedersachsen: Verarbeitung personenbezogener Daten von SuS nur im Rahmen von § 31 NSchG bzw. mit Einwilligung; Verzeichnis von Verarbeitungstätigkeiten der Schule).

Stand: 1.12.0 (Oktober 2026). Grundlage ist der Vertrag des Plattform-Verbunds InfoLabs (§9 gemeinsame Regeln, §10 Datenschutz), Umsetzung in `docs/VERBUND.md`. Die zentrale Datenschutzerklärung liegt beim Portal (https://labs.frankjuchim.de); die Seite `#/datenschutz` der App ergänzt sie um das, was nur AutomatenLab speichert. Das frühere eigene Login (`LOGIN_KONZEPT.md`) ist abgelöst – AutomatenLab kennt keine Passwörter, persönlichen Codes oder E-Mail-Adressen.

## Ohne Anmeldung (Gastmodus)
* Je Modul eine Demo-Aufgabe, im Browser geprüft; Fortschritt nur im Browser (`localStorage`). Keine Cookies, keine Server-Speicherung, keine externen Dienste.
* Server-Logs enthalten IP-Adressen – Aufbewahrung in CapRover kurz halten.

## Mit Anmeldung über das Portal (SSO)
| Datenkategorie | Zweck | Personenbezug | Löschung |
|---|---|---|---|
| `sub` (pseudonyme Kennung des Portals), Rolle, Anzeigename, Kurs-IDs und -Namen, letzte Aktivität | Anmeldung, Zuordnung zum Kurs | pseudonym; Anzeigename selbst gewählt | sobald das Portal Konto oder Kurs löscht (`/api/verbund/loeschen`) |
| Lernstand je Aufgabe (Status, Fehlversuche, Tipps, Punkte, Zwischenstand, Zeitpunkt), Abzeichen | Üben auf jedem Gerät, Rückmeldung für die Lehrkraft | pseudonym | mit dem Konto |
| Trainingsrunden (Arena, Unterscheide!, Sortierer) mit Ergebnis | Trainingspunkte, Tageshöchstwert, Rekorde | pseudonym | mit dem Konto |
| Falsche Antworten in Kurzform (Quiz-Option, Detektiv-Beschreibung, Turing-Regel, Mealy-Ausgabe – nie Freitext) | „Häufige falsche Antworten“ für die Lehrkraft (ohne Namen) | pseudonym | mit dem Konto |
| Kurs-Einstellungen (Kursart, Level-Art, Auftrag der Lehrkraft) | Anzeige auf der Startseite der Schüler | keiner (Text der Lehrkraft) | mit dem Kurs |
| Sitzungs-Cookie `al_s` (signiert) | technisch notwendig | – | Abmeldung / Ablauf (Schüler ≤ 30 Tage, Lehrkräfte ≤ 8 h) |

* **Wer sieht was:** Die Lehrkraft eines Kurses sieht Anzeigenamen und Lernstand ihrer Schülerinnen und Schüler (Lehrkraft-Bereich, CSV-Export) und die häufigsten falschen Antworten ohne Namen. Das Portal bekommt nur Kennzahlen ohne Namen (Punkte, gelöste Aufgaben, Anteil, Vertrag §6). Rangliste und Beamer-Board sind standardmäßig aus. Schaltet die Lehrkraft sie ein, sehen die Kursmitglieder (Rangliste) bzw. alle mit dem zufälligen Board-Link (Beamer, ohne Anmeldung, `noindex`) Anzeigename, Platz und Punkte; das Board zeigt nur die 15 Besten, den Kursdurchschnitt je Welt und die letzten Abzeichen, nie Konto- oder Kurs-IDs. Ausschalten oder „Neuen Link erzeugen“ sperrt den alten Link sofort. Urkunden druckt die Lehrkraft im Browser; eine handschriftliche Namenszeile wird nirgends gespeichert.
* **Löschung:** vollständig über die Verbund-API; ein Test (`test/lehrkraft.test.js`) findet jede Tabelle mit Konto-Bezug und prüft, dass nach der Löschung nichts übrig bleibt.
* **Grundsätze:** Datensparsamkeit, Zweckbindung (keine Benotung aus Plattformdaten ohne Absprache), Speicherung nur auf dem eigenen Server in der EU, keine Weitergabe, keine Tracking- oder Analyse-Dienste, keine externen Ressourcen (CDNs, Fonts), HTTPS.

## Text in der App
Die Seite `#/datenschutz` (`app/js/modules/datenschutz.js`) nennt diese Daten in Schülersprache und verweist auf die zentrale Erklärung des Portals. Verantwortliche Stelle, Kontakt und Datenschutzbeauftragte:r stehen dort – von der Schule zu ergänzen.
