# AutomatenLab im Plattform-Verbund InfoLabs

**Verbindlich ist der Vertrag des Plattform-Verbunds:
https://github.com/frankjuchim/labs/blob/main/VERTRAG.md (Version 1.1).**
Anschlussanleitung mit allen Testfällen: https://github.com/frankjuchim/labs/blob/main/docs/INTEGRATION.md.
Das Repository `frankjuchim/labs` (Portal InfoLabs, https://labs.frankjuchim.de) wird von einer anderen Session
gepflegt – aus diesem Repository heraus wird es **nur gelesen**, nie geändert. Abweichungen vom Vertrag werden nie
still gemacht, sondern als Textvorschlag für `VERTRAG.md` formuliert (§6 unten).

## 1. Was das für AutomatenLab heißt

* **Kein eigenes Login.** Konten (Superadmin, Lehrkräfte, Schüler), Passwörter, persönliche Codes, Kurse, Kurscodes,
  Mitgliedschaften, Mitlehrkräfte und Ablaufdaten liegen im Portal (§3). AutomatenLab startet direkt mit
  **`AUTH_MODUS=portal`** (§13: neue Plattformen bauen kein eigenes Login). Es gibt keine lokalen Konten, also auch
  keine Datenübernahme (§11 Phase 2 entfällt).
* **Anmeldung per Single Sign-on** (§5): `/sso/start` → Portal → `/sso/ende?token=…` (Ed25519-JWT, geprüft mit
  `src/jwt.js`, unverändert aus `frankjuchim/labs`). AutomatenLab legt Konten nach `sub` an (nur Anzeigename, Rolle,
  Kurs-IDs) und setzt eine eigene Sitzung (Schüler ≤ 30 Tage, Lehrkräfte ≤ 8 h).
* **Manifest** `GET /api/plattform` (§7) und **`/healthz`** (§6), geprüft mit `scripts/vertrag_pruefen.js`
  (unverändert aus `frankjuchim/labs`) in den Tests.
* **Verbund-API** (§6): `POST /api/verbund/loeschen`, `GET /api/verbund/kurse/:kursId/uebersicht`,
  `POST /api/verbund/kurse/:kursId`.
* **Bei AutomatenLab bleibt** (§3): Inhalte, Lernstand (Fortschritt aus `progress.js`, synchronisiert), Kurs-Einstellungen
  (Freischaltung Pflicht/Vertiefung/Bonus, Aufträge), Lehrkraft-Auswertung (Lernstand-Matrix, CSV), Gastmodus,
  Themenseite, ergänzende Datenschutzhinweise.
* **Entfällt gegenüber `docs/LOGIN_KONZEPT.md`:** eigene Konten, Einladungen, SuS-Zugänge und Zugangskarten
  (macht das Portal), Passwort-Hashing, Login-Rate-Limits, Admin-Bootstrap, eigene Kurs-Ablauf-Löschung
  (das Portal löscht und ruft `/api/verbund/loeschen` auf, §10).

## 2. Pfade und Routen

Alle bisherigen Hash-Routen aus `app/README.md` bleiben unverändert und ohne Anmeldung nutzbar (QR-Codes).
Neu kommen Server-Pfade (Vertrag) und Hash-Routen (Oberfläche) hinzu:

| Pfad | Zweck | Umsetzung |
|---|---|---|
| `/` | Start (bisherige App) | `app/index.html` |
| `/gast` | Gastmodus (§4, Manifest `urls.gast`) | Weiterleitung auf `/#/` (Startseite im Gastmodus, siehe §3) |
| `/themen` | Themenseite ohne Lösungen (`urls.themen`) | Weiterleitung auf `/#/themen` (neu: Welten, Level, Module, Arbeitsblatt-Bezug) |
| `/lehrer` | Lehrkraft-Bereich (`urls.lehrkraft`) | Weiterleitung auf `/#/lehrkraft` (ohne Sitzung → `/sso/start?ziel=/lehrer`) |
| `/datenschutz` | Besonderheiten der Plattform + Link auf `<PORTAL_URL>/datenschutz` (§3) | Weiterleitung auf `/#/datenschutz` |
| `/healthz`, `/api/plattform` | Vertrag §6/§7 | Server |
| `/sso/start`, `/sso/ende`, `/abmelden` | SSO §5 | Server |
| `/api/verbund/…` | Verbund-API §6 | Server |
| `/api/…` | Sitzung, Fortschritt, Lehrkraft-Auswertung, Aufträge | Server |

## 3. Gastmodus (Entscheidung F1, 2026-10-11)

* Alle Routen aus `app/README.md` bleiben **ohne Anmeldung voll nutzbar** (gedruckte QR-Codes). Der Fortschritt eines
  Gastes bleibt nur im Browser (`localStorage`) und geht nie an den Server – der Gastmodus „nutzt nie echte Daten“ (§4).
* Die **Startseite** zeigt Gästen eine Vorschau: Welt A vollständig, die Welten B–D mit ihren Modulkacheln und dem
  Hinweis „Mit Anmeldung über InfoLabs: Fortschritt auf allen Geräten, Aufträge deiner Lehrkraft“. Ein Deep-Link
  in Welt B–D funktioniert trotzdem.
* Bei der ersten Anmeldung auf einem Gerät mit Gast-Fortschritt fragt die App, ob er ins Konto übernommen werden soll.

## 4. Konfiguration (§8)

| Variable | Wert für AutomatenLab | Bemerkung |
|---|---|---|
| `PLATTFORM_ID` | `automatenlab` | = Subdomain, ändert sich nie (auch Standard im Code) |
| `PLATTFORM_URL` | `https://automatenlab.frankjuchim.de` | ohne Schrägstrich am Ende |
| `PORTAL_URL` | `https://labs.frankjuchim.de` | = erwartetes `iss`; leer = Plattform läuft allein (nur Gastmodus) |
| `PORTAL_PUBLIC_KEY` | Inhalt von `https://labs.frankjuchim.de/sso/schluessel.pem` | einzeilig mit `\n` (Portal → Plattformen → „Einzeilig kopieren“); fest konfiguriert, nie zur Laufzeit geholt |
| `AUTH_MODUS` | `portal` | neue Plattform ohne eigene Konten |
| `SESSION_SECRET` | Zufallswert, `openssl rand -hex 32` | signiert die Sitzungs- und State-Cookies |
| `DATA_DIR` | `/app/data` (Standard) | persistentes Verzeichnis in CapRover, Datei `automatenlab.db` |
| `PORT`, `TRUST_PROXY` | `80`, `1` (Standard) | nur setzen, wenn abweichend |

`ADMIN_EMAIL`/`ADMIN_PASSWORD` werden **nicht** gebraucht (in `portal` kommt der Superadmin vom Portal).
Vorlage: `.env.example` im Wurzelordner. Die Variablen wirken erst, wenn der Node-Server läuft (PR 1); bis dahin
ignoriert der nginx-Container sie.

## 5. Inbetriebnahme im Portal (nach dem Deploy von PR 2)

1. Superadmin im Portal → *Plattformen* → Basis-URL `https://automatenlab.frankjuchim.de` eintragen; die Ampel
   (Manifest + `/healthz`) muss grün sein.
2. Rücksprung-Adresse **`https://automatenlab.frankjuchim.de/sso/ende`** bestätigen.
3. *Lehrkräfte* → AutomatenLab für die Lehrkräfte freischalten; Kurs anlegen bzw. AutomatenLab für den Kurs wählen.
4. Ende-zu-Ende: als Schüler im Portal „Weiter zu AutomatenLab“ → angemeldet auf der Plattform; Kurs im Portal
   umbenennen → Name im AutomatenLab-Dashboard geändert.

## 6. Abweichungen vom Vertrag und Änderungsvorschläge für `VERTRAG.md`

AutomatenLab ist anders gebaut als Algo Quest: Die Fachlogik (Automaten-Simulation, Prüfung) läuft als Engine
**im Browser**, damit Simulatoren interaktiv sind, die App ohne Anmeldung und offline funktioniert und gedruckte
QR-Codes direkt auf Aufgaben zeigen. Daraus ergeben sich Abweichungen von §9 (MUSS). Sie werden hier als
Vorschlag für eine **Vertragsversion 1.2** formuliert; bis zur Entscheidung durch Frank (und Übernahme in
`frankjuchim/labs` durch die dortige Session) gelten sie als offen.

### Vorschlag V1 – Prüfung im Browser (§9 „Sicherheit“, „Vergleichbarkeit“, „Inhaltsformat“)

Neuer Absatz in §9 nach „Inhaltsformat“:

> **Plattformen mit Prüfung im Browser:** Eine Plattform, deren Aufgaben von einer Simulations-Engine im Browser
> geprüft werden (z. B. AutomatenLab), DARF Lösungen, Prüfung und Punktevergabe im Browser durchführen; der Lernstand
> wird dann vom Browser an die Plattform gemeldet und ist nicht manipulationssicher. Sie MUSS das im README und in
> ihren Datenschutzhinweisen angeben; ihre Kennzahlen dürfen nicht für Noten verwendet werden. Für solche Plattformen
> gelten Punkteformel, Standardpunkte und Aufgabenformat (Algo Quest) als SOLL; `anteil` in der Kursübersicht (§6)
> ist dann der Anteil gelöster Aufgaben der freigeschalteten Level. Das Manifest nennt in `faehigkeiten` den Wert
> `"pruefung-im-browser"`.

### Vorschlag V2 – Gastmodus mit vollem Inhalt (§4, §9 „Didaktik“)

Ergänzung in §9 nach „Gastmodus `/gast` mit eigenen Demo-Aufgaben“:

> … oder – wenn gedruckte Materialien per QR-Code direkt auf Aufgaben verlinken – mit dem vollständigen Inhalt; der
> Lernstand eines Gastes bleibt dann ausschließlich im Browser und erreicht nie den Server.

### Vorschlag V3 – Fallen-Liste, Bosse, Warm-up als SOLL (§9 „Didaktik“)

AutomatenLab hat Welten A–D mit 16 Leveln und Boss-Leveln (6, 10, 14), aber (noch) keine Fallen-Liste P1–P10 und
keinen Warm-up-Trainer. Vorschlag: In §9 „Fallen-Liste P1–P10 des Themas“ von MUSS auf **SOLL** stufen
(„Plattformen ohne Fallen-Liste nennen das im README“). Alternative ohne Vertragsänderung: Frank legt eine
Fallen-Liste für Automaten und formale Sprachen fest (Inhaltsarbeit, z. B. Fehlerzustand vergessen, Kellerbelegung
falsch notiert, ε-Übergänge …), sie wird in Quiz und Material verankert.

### Vorschlag V4 – Weltkennungen (§7, Nebenversion)

AutomatenLab bezeichnet Welten mit Buchstaben A–D. Im Manifest und in der Kursübersicht steht `nr` als Zahl 1–4,
zusätzlich das neue optionale Feld `kennung` (`"A"` … `"D"`). Neue Felder sind laut §7 erlaubt; Vorschlag für §7:
„`welten[].kennung` (KANN): Anzeigekennung der Welt, falls sie von `nr` abweicht.“

### Hinweis H1 – gemeinsamer Kern (§13.3)

AutomatenLab ist die **zweite** Plattform; laut §13.3 SOLL spätestens jetzt ein gemeinsamer Kern (`lab-kern`)
ausgelagert werden. Das Repository dafür gehört nicht in die Zuständigkeit dieser Session. Bis dahin übernimmt
AutomatenLab `src/jwt.js` und `scripts/vertrag_pruefen.js` unverändert und `src/security.js`/`src/validate.js` aus
Algo Quest mit Herkunftsvermerk (gleiche Pfade, gleiche Funktionsnamen, CommonJS), damit das spätere Auslagern ein
reines Verschieben ist.

### Begründete SOLL-Abweichungen (nur README, keine Vertragsänderung)

* **Hausfarben (§9 Oberfläche, SOLL):** AutomatenLab behält sein eingeführtes Erscheinungsbild (Grün-Petrol,
  Schrift Atkinson Hyperlegible, Großansicht „A A“), weil SuS und gedruckte Materialien es seit Version 1.0
  verwenden. Plattformfarbe im Manifest: `#0E6455`. Der Link „⌂ Portal“ kommt in die Kopfzeile.
* **Kursübersicht (§6, SOLL):** wird umgesetzt; `anteil` nach Vorschlag V1.
