# Datenschutz – Arbeitsgrundlage

> Kein Rechtsrat. Vor dem Einsatz mit Anmeldung im Unterricht mit Schulleitung und behördlichem Datenschutzbeauftragten abstimmen (Niedersachsen: Verarbeitung personenbezogener Daten von SuS nur im Rahmen von § 31 NSchG bzw. mit Einwilligung; Verzeichnis von Verarbeitungstätigkeiten der Schule).

## Heute (Gastmodus, Version 1.0)
* Keine Anmeldung, keine Cookies, keine Server-Speicherung, keine externen Dienste. Fortschritt nur im Browser (`localStorage`).
* Server-Logs (nginx) enthalten IP-Adressen – Aufbewahrung in CapRover kurz halten.

## Mit Login (Zielbild, siehe `LOGIN_KONZEPT.md`)
| Datenkategorie | Zweck | Personenbezug | Löschung |
|---|---|---|---|
| Pseudonym + Passwort-Hash (SuS) | Anmeldung | pseudonym (Zuordnung nur bei der Lehrkraft) | mit dem Kurs bzw. auf Wunsch sofort |
| E-Mail + Passwort-Hash (Lehrkraft) | Anmeldung, Einladung | ja | auf Wunsch / bei Sperrung nach 30 Tagen |
| Lernfortschritt mit Zeitstempeln | Üben, Rückmeldung für die Lehrkraft | pseudonym | mit dem Kurs (Ablaufdatum) |
| Session-Cookie | technisch notwendig | – | Abmeldung / Ablauf |

Grundsätze: Datensparsamkeit, Zweckbindung (keine Benotung aus Plattformdaten ohne Absprache), Speicherung nur auf dem eigenen Server in der EU, keine Weitergabe, keine Tracking- oder Analyse-Dienste, Transportverschlüsselung (HTTPS), Passwörter nur gehasht.

## Text-Entwurf für `#/datenschutz` (in der App)
„Das AutomatenLab kannst du ohne Anmeldung nutzen. Dann bleibt dein Fortschritt nur in diesem Browser. Wenn dir deine Lehrkraft einen Zugang gibt, speichern wir deinen Fortschritt (welche Aufgaben du gelöst hast, Punkte, Quiz-Ergebnisse) unter deinem Benutzernamen auf unserem Server, damit du auf jedem Gerät weiterüben kannst und deine Lehrkraft sieht, wo der Kurs steht. Wir speichern keinen Namen und keine E-Mail-Adresse von dir. Am Ende des Kurses werden alle Daten gelöscht. Es gibt keine Werbung, kein Tracking und keine Weitergabe an andere.“ – Verantwortliche Stelle, Kontakt und Datenschutzbeauftragte:r ergänzen.
