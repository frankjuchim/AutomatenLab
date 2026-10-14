# AutomatenLab im Plattform-Verbund InfoLabs

**Verbindlich ist der Vertrag des Plattform-Verbunds:
https://github.com/frankjuchim/labs/blob/main/VERTRAG.md (Version 1.2).**
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
* **Bei AutomatenLab bleibt** (§3): Inhalte, Prüfung und Lernstand (auf dem Server, §6 unten), Kurs-Einstellungen
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
| `/gast` | Gastmodus mit Demo-Aufgaben (§4, Manifest `urls.gast`) | Weiterleitung auf `/#/gast` |
| `/themen` | Themenseite ohne Lösungen (`urls.themen`) | Weiterleitung auf `/#/themen` (neu: Welten, Level, Module, Arbeitsblatt-Bezug) |
| `/lehrer` | Lehrkraft-Bereich (`urls.lehrkraft`) | Weiterleitung auf `/#/lehrkraft` (ohne Sitzung → `/sso/start?ziel=/lehrer`) |
| `/datenschutz` | Besonderheiten der Plattform + Link auf `<PORTAL_URL>/datenschutz` (§3) | Weiterleitung auf `/#/datenschutz` |
| `/healthz`, `/api/plattform` | Vertrag §6/§7 | Server |
| `/sso/start`, `/sso/ende`, `/abmelden` | SSO §5 | Server |
| `/api/verbund/…` | Verbund-API §6 | Server |
| `/api/…` | Sitzung, Fortschritt, Lehrkraft-Auswertung, Aufträge | Server |

## 3. Gastmodus (Entscheidung V2, 2026-10-11 – ersetzt F1)

* Ohne Anmeldung gibt es nur **einzelne Demo-Aufgaben zum Ausprobieren** (`/gast`, Vertrag §4/§9): je Modul eine
  eigene Demo-Aufgabe, die im Browser geprüft wird, keine Punkte bringt und nicht zum Aufgabenkatalog gehört.
  Der Lernstand eines Gastes bleibt im Browser und erreicht nie den Server.
* Alle übrigen Routen aus `app/README.md` bleiben **unverändert gültig** (QR-Codes), verlangen aber eine Anmeldung:
  Ohne Sitzung zeigt die App einen kurzen Hinweis und leitet über `/sso/start?ziel=/%23/<route>` zum Portal; nach der
  Anmeldung landet man genau auf der verlinkten Aufgabe. Im Unterricht sind die SuS über das Portal angemeldet
  (Sitzung 30 Tage), der QR-Code führt also direkt zur Aufgabe.
* Schüler ohne freigeschalteten Kurs (§4, die Prüf-API antwortet 403) und ein Server ohne eingerichtete Anmeldung
  (`PORTAL_URL` leer) sehen ebenfalls nur die Demo-Aufgaben – die App fällt nie auf „alles offen“ zurück.
* Themenseite (`/themen`), Datenschutz und Übersicht sind öffentlich – ohne Lösungen. Unter `/material` gibt es ohne
  Anmeldung nur eine Material-Demo (Level 1, Schüler- und Lehrkraftfassung); alles Weitere nach Anmeldung je Rolle.

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

Voraussetzung: Die Variablen aus §4 sind gesetzt; die Startmeldung im CapRover-Log lautet „Anmeldung über das Portal: an“
und `node scripts/vertrag_pruefen.js https://automatenlab.frankjuchim.de` meldet „Anmeldung: portal“.


1. Superadmin im Portal → *Plattformen* → Basis-URL `https://automatenlab.frankjuchim.de` eintragen; die Ampel
   (Manifest + `/healthz`) muss grün sein.
2. Rücksprung-Adresse **`https://automatenlab.frankjuchim.de/sso/ende`** bestätigen.
3. *Lehrkräfte* → AutomatenLab für die Lehrkräfte freischalten; Kurs anlegen bzw. AutomatenLab für den Kurs wählen.
4. Ende-zu-Ende: als Schüler im Portal „Weiter zu AutomatenLab“ → angemeldet auf der Plattform; Kurs im Portal
   umbenennen → Name im AutomatenLab-Dashboard geändert.

## 6. Prüfung auf dem Server (Entscheidung V1, 2026-10-11)

AutomatenLab hält sich an §9 „Sicherheit“ und „Vergleichbarkeit“: Lösungen, Erklärungen und nicht abgerufene Tipps
bleiben auf dem Server, geprüft wird **nur serverseitig**, Punkte vergibt nur der Server nach der Formel
`round(punkte × max(0.25, 1 − 0.25·Fehlversuche − 0.2·Tipps))` mit Standardpunkten 10/20/30 je Stufe; „Lösung
zeigen“ bringt 0 Punkte. Rangschwellen 0/10/30/55/80 % der Level-Punkte der freigeschalteten Welten.

Bisher liegen alle Inhalte samt Lösungen als JavaScript in `app/js/data` und werden im Browser geprüft. Umbau:

* **Engine bleibt gemeinsam.** `app/js/engine` (DEA, NEA, Mealy, Keller, Grammatik, Turing) ist ein Simulator ohne
  Geheimnisse; Browser (Simulation, Anzeige) und Server (Prüfung) nutzen denselben Code.
* **Inhalte werden geteilt:** öffentliche Aufgabenteile (Text, Alphabet, Startautomat, Beispiele ohne Lösung) liefert
  der Server per API; Lösungen, Referenzautomaten, Prüffunktionen, Erklärungen und Tipps ziehen nach `inhalte/`
  (außerhalb von `app/`, nie ausgeliefert). Ein Test stellt sicher, dass keine ausgelieferte Datei Lösungsfelder enthält.
* **Lernstand auf dem Server** je `sub` und Aufgabe (wie Algo Quest: Status, Fehlversuche, Tipps, Punkte, Zeitpunkt).
  `progress.js` behält seine öffentliche API; für Angemeldete liest es den Stand vom Server, Lösen geht nur über die
  Prüf-API. Gäste nutzen weiter `localStorage` (nur Demo-Aufgaben).
* **Aufgabenformat:** AutomatenLab beschreibt seine Interaktionen (Automat bauen, Wort testen, Kellertabelle,
  Ableitung …) in einem eigenen `docs/AUFGABENFORMAT.md`, wie es §9 für neue Interaktionen vorsieht.

| Modul | heute im Browser | künftig auf dem Server |
|---|---|---|
| Level-Quiz | Antworten in `quiz.js` | Fragen ohne Lösung; Prüfung und Erklärung nach der Antwort |
| Sprach-Detektiv | geheimer Automat + Optionen | Testwörter werden auf dem Server simuliert; gewählte Option geprüft |
| Automaten-Baukasten | Referenz-DEA | eigener DEA an den Server: Äquivalenz und kürzestes Gegenbeispiel |
| Minimierer | erwartete Klassen | Markierung/Zusammenfassung an den Server |
| Mealy-Maschine | Ausgaben, Fehlerkanten | Vorhersage bzw. Reparatur an den Server |
| Parallelwelten | Rätsel-Lösungen, Teilmengen | Antwort an den Server |
| Keller-Labor | Tabellen aus der Engine | Tabelle bzw. Rückwärts-Eingabe an den Server |
| Überliste den Automaten | Prädikat | Wort an den Server |
| Ableitungs-Rallye | Zielwort, Prüfung der Schritte | Ableitung an den Server |
| Grammatik-Tester | Prüfprädikat | Grammatik an den Server, Sprachvergleich bis `maxLen` |
| Turing-Labor | Tabellen-Challenges | Tabelle an den Server |
| Akzeptor-Arena, Chomsky-Sortierer | Spielrunden | als **Training** wie der Algo-Quest-Trainingsplatz: Runde vom Server erzeugt, Antworten serverseitig gezählt (1 Punkt je Aufgabe, Tageshöchstwert) |

Freie Modi und Simulatoren (Baukasten frei, Grammatik frei, Turing-Programme, NEA-/Keller-Simulation ohne Aufgabe)
bringen keine Punkte und bleiben im Browser.

**Stand:** Level-Quiz, Sprach-Detektiv und Automaten-Baukasten prüfen auf dem Server (PR 3), der Minimierer seit
PR 4a (jede Runde des Markierungsverfahrens); Format, IDs, Punkte und API: `docs/AUFGABENFORMAT.md`. Die übrigen
Module folgen in PR 4b/4c und 5.

## 7. Weitere Vertragspunkte

* **v1.2 – Anforderungsniveaus (§7, §9):** umgesetzt. Manifest `vertrag: "1.2"`, `kurs: "Informatik eA und gA,
  Niedersachsen, Abitur ab 2027"`, `niveaus: ["eA", "gA"]`, `urls.niveaus: "/niveaus"`. Der Vertrag nennt als Beispiel
  `/themen#niveaus`; bei AutomatenLab leitet `/themen` auf die Hash-Route `/#/themen` um – ein Fragment `#niveaus`
  ginge dabei verloren. Deshalb der eigene Pfad `/niveaus` → `/#/themen?teil=niveaus` (vertragsgemäß: „Pfad, beginnend
  mit /“). Zuordnung nach KC 2017 in `app/js/data/niveaus.js` (Materialien: `materials/lib/niveau.js`, Test hält beide
  gleich). Nach dem Deploy im Portal unter Plattformen „Jetzt prüfen“, dann erscheint der Link auf der Karte.

* **V3 – Fallen-Liste P1–P10:** Entwurf in `docs/einheit/FALLEN.md` (zur Freigabe durch Frank),
  danach in Aufgaben (Feld `fallen`), Quiz, Material und Fallen-Profil verankert. Keine Vertragsänderung nötig.
* **V4 – Weltkennungen:** umgesetzt. Manifest und Kursübersicht führen `nr` 1–4 und das zusätzliche Feld
  `kennung` (`"A"` … `"D"`); neue Felder sind nach §7 erlaubt. Vorschlag zur Klarstellung in `VERTRAG.md` §7 (für die
  Portal-Session): „`welten[].kennung` (KANN): Anzeigekennung der Welt, falls sie von `nr` abweicht (z. B. `"A"`).“
* **„Lösung zeigen“ (§9 Sicherheit):** Wie in Algo Quest kann eine offene Aufgabe aufgegeben werden: Sie wird
  endgültig „angesehen“ (0 Punkte, auch nach späterem Selbstlösen – „nachgelöst“ zählt nur als gelöst), erst dann
  liefert der Server Lösung und Erklärung. Das lesen wir als „nach dem Lösen“ im Sinn von „nach Abschluss der
  Aufgabe“. Vorschlag zur Klarstellung in `VERTRAG.md` §9 (für die Portal-Session, Nebenversion): „Lösungen,
  Erklärungen und nicht abgerufene Tipps nur serverseitig und erst nach dem Lösen **oder Aufgeben („Lösung zeigen“,
  danach 0 Punkte für diese Aufgabe)**.“
* **Lehrkraft-Dateien (§9 Sicherheit):** `#/material` – Lehrkraft-PDFs und Originale nur nach Anmeldung und nur aus der
  Whitelist `materials/pdf/verzeichnis.json` (`src/material.js`, `test/material.test.js`); Manifest-Fähigkeit
  `lehrkraft-materialien` wie in Algo Quest.
* **Farben (§9 Oberfläche, SOLL):** AutomatenLab führt eigene Farben (Grün-Petrol `#0E6455`, Ocker `#B26A0F`, Schrift
  Atkinson Hyperlegible, Großansicht „A A“) – von Frank so entschieden. Plattformfarbe im Manifest `#0E6455`. Der Link
  „⌂ Portal“ kommt mit der Anmeldung in die Kopfzeile.
* **Gemeinsamer Kern (§13.3):** AutomatenLab ist die zweite Plattform; laut §13.3 SOLL jetzt ein Kern (`lab-kern`)
  ausgelagert werden. Das Repository gehört nicht in die Zuständigkeit dieser Session. Bis dahin: `src/jwt.js` und
  `scripts/vertrag_pruefen.js` unverändert kopiert, `src/security.js`/`src/validate.js` aus Algo Quest mit
  Herkunftsvermerk (gleiche Pfade, CommonJS), damit das Auslagern ein reines Verschieben ist.
