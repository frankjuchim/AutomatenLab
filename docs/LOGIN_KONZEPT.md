# Login, Kurse und Fortschritt – Konzept (Stand: Entwurf v1)

> Ziel: Lehrkräfte legen Kurse an und sehen den Lernstand ihrer Schülerinnen und Schüler; Schülerinnen und Schüler behalten ihren Fortschritt geräteübergreifend. Die App bleibt **ohne Anmeldung voll nutzbar**.
>
> **Ausrichtung an AlgoQuest:** Das Repository `frankjuchim/AlgoQuest` hat bereits einen Login. Vor der Umsetzung wird dessen Lösung (Stack, Rollen, Datenmodell, Login-Oberfläche, Deployment) analysiert. Wo sie gleichwertig ist, wird sie **übernommen**, damit beide Apps gleich funktionieren und gleich gewartet werden. Die Vorgaben unten gelten, soweit AlgoQuest nichts Besseres vorgibt; Abweichungen werden in `docs/ENTSCHEIDUNGEN.md` begründet.

## 1. Rollen

| Rolle | Wer | Anmeldung | Darf |
|---|---|---|---|
| **Gast** | jede Person | keine | alles Fachliche wie heute; Fortschritt nur lokal (`localStorage`) |
| **Schüler:in** | Kursmitglied | Benutzername (Pseudonym) + Passwort/PIN | eigener Fortschritt wird gespeichert und synchronisiert; sieht Kursaufträge |
| **Lehrkraft** | eingeladene Lehrkraft | E-Mail + Passwort | Kurse anlegen, SuS-Zugänge erzeugen, Lernstand ansehen, Aufträge/Freischaltungen setzen |
| **Admin** | Frank | wie Lehrkraft | Lehrkräfte einladen/sperren, Systemeinstellungen, Datenexport/Löschung |

Keine offene Registrierung: Lehrkräfte kommen per Einladungslink (vom Admin), Schülerinnen und Schüler über die Lehrkraft.

## 2. Datensparsamkeit (Vorgabe)

* Für Schülerinnen und Schüler werden **keine Klarnamen und keine E-Mail-Adressen** gespeichert. Die Lehrkraft erzeugt Zugänge mit Pseudonymen (z. B. `fuchs-17`) und druckt Zugangskarten; die Zuordnung Pseudonym ↔ Person bleibt auf Papier/bei der Lehrkraft. Optional darf die Lehrkraft ein **Kürzel** (max. 12 Zeichen, z. B. „Platz 7“) als Notiz hinterlegen – Hinweis im Formular: keine vollständigen Namen.
* Gespeichert werden nur: Zugangsdaten (Passwort-Hash), Kurszugehörigkeit, Lernfortschritt (gelöste Aufgaben, Punkte, Abzeichen, Quiz-Ergebnisse, Bestwerte, Entwürfe, Einstellungen) mit Zeitstempel.
* Kein Tracking, keine externen Dienste/CDNs, keine Analyse-Tools. Nur technisch notwendiges Session-Cookie.
* **Löschkonzept:** Kurse haben ein Ablaufdatum (Standard: Ende des Schuljahres, max. 12 Monate). Danach werden Kurs, SuS-Zugänge und Fortschritt automatisch gelöscht (vorher Hinweis an die Lehrkraft). Lehrkraft kann jederzeit löschen; SuS können ihr Konto selbst löschen.
* Datenschutzhinweis-Seite in der App (`#/datenschutz`), Impressum (`#/impressum`). Text-Entwurf in `docs/DATENSCHUTZ.md` – rechtliche Prüfung durch die Schule/den Datenschutzbeauftragten ist Sache des Betreibers.

## 3. Architektur (Vorschlag, falls AlgoQuest nichts anderes nahelegt)

* **Ein Container** für App + API (CapRover-App bleibt `automatenlab`, gleiche Domain → keine CORS-Probleme, QR-Codes bleiben gültig).
* `server/`: Node.js ≥ 20, **Fastify** (oder Express wie in AlgoQuest), **SQLite** (`better-sqlite3`) mit Migrationen, Datei in persistentem Volume `/data/automatenlab.sqlite`.
* Auslieferung der statischen App weiterhin unverändert aus `app/` (Fastify-Static oder nginx davor); die App bleibt ohne Build-Schritt.
* Authentifizierung: Session-Cookie (`HttpOnly`, `Secure`, `SameSite=Lax`, 30 Tage gleitend für SuS, 12 h für Lehrkräfte), Sessions in SQLite. Passwort-Hash **argon2id** (alternativ bcrypt, Kosten ≥ 12).
* Schutz: Rate-Limit auf Login (z. B. 10 Versuche/10 min je Konto + IP), CSRF-Schutz (Origin-Prüfung + Token bei schreibenden Anfragen), Eingaben validieren (JSON-Schema), Sicherheits-Header/CSP wie heute in `app/nginx.conf`, keine Fehlermeldung, die verrät, ob ein Benutzername existiert.
* Konfiguration über Umgebungsvariablen (`.env.example`): `SESSION_SECRET`, `DATABASE_PATH`, `BASE_URL`, `ADMIN_EMAIL`, `ADMIN_INITIAL_PASSWORD` (nur beim ersten Start), optional `SMTP_*` (nur für Lehrkräfte: Passwort vergessen/Einladung – ohne SMTP: Einladungslink manuell kopieren).

## 4. Datenmodell (Minimum)

```
users(id, role['admin'|'teacher'|'student'], email NULL, username NULL, password_hash, display_hint NULL,
      must_change_password, created_at, last_login_at, disabled)
courses(id, teacher_id→users, name, join_code, school_year, expires_at, settings_json, created_at)
course_members(course_id, user_id, joined_at)
course_teachers(course_id, user_id)                  -- optional: Kurs mit mehreren Lehrkräften teilen
progress(user_id PK, state_json, version, updated_at)   -- gleicher Aufbau wie localStorage 'automatenlab.v1'
progress_events(id, user_id, kind['solve'|'badge'|'quiz'|'best'], modul, item, value, created_at)
assignments(id, course_id, title, routes_json, due_at, created_at)   -- „Aufträge“: Liste von App-Routen
invites(token_hash, role, email, expires_at, used_at)
sessions(id_hash, user_id, expires_at, created_at, user_agent_hint)
```

`progress.state_json` bleibt kompatibel zu `app/js/core/progress.js` (`{ v, points, solved, badges, best, drafts, prefs }`). `progress_events` ist die Grundlage für das Lehrkraft-Dashboard (wer hat wann was gelöst).

## 5. Synchronisation des Fortschritts

* `app/js/core/progress.js` bekommt einen **Speicher-Adapter**: `local` (heute) und `remote` (angemeldet). Die öffentliche API von `progress` bleibt **unverändert** – Module merken nichts vom Login.
* Beim Anmelden: lokalen Gast-Fortschritt **zusammenführen** (Vereinigung der gelösten Aufgaben, frühester Zeitstempel gewinnt; Abzeichen vereinigen; Bestwerte = Maximum; Punkte neu berechnen bzw. Maximum; Entwürfe: neuerer gewinnt) – vorher fragen: „Fortschritt dieses Geräts übernehmen?“
* Schreiben: optimistisch lokal, dann `PUT /api/progress` mit `version` (entprellt, z. B. 2 s; beim Verlassen der Seite `sendBeacon`). Konflikt (409) → Server-Stand holen, zusammenführen, erneut senden.
* Offline/Server weg: App arbeitet lokal weiter und synchronisiert später (Hinweis-Badge „nicht synchronisiert“).
* Abmelden: lokale Kopie des Kontos löschen (geteilte Schul-iPads!).

## 6. API (Vorschlag)

```
POST /api/auth/login            {username|email, password}            → {user}
POST /api/auth/logout
GET  /api/auth/me                                                     → {user, courses}
POST /api/auth/password         {old, new}
POST /api/invites/accept        {token, email, password}              (Lehrkraft-Registrierung)

GET  /api/progress                                                    → {state, version}
PUT  /api/progress              {state, version}                      → {version} | 409
POST /api/progress/events       [{kind, modul, item, value, at}]

GET  /api/courses                                                     (Lehrkraft: eigene Kurse)
POST /api/courses               {name, expiresAt}
POST /api/courses/:id/students  {count, prefix?}                      → [{username, initialPassword}]  (nur einmal sichtbar)
POST /api/courses/:id/students/:uid/reset-password                    → {initialPassword}
DELETE /api/courses/:id[/students/:uid]
GET  /api/courses/:id/overview                                        → Matrix SuS × Level/Module
GET  /api/courses/:id/export.csv
PUT  /api/courses/:id/settings  {freigeschaltet:[levelNr], hinweis}
POST /api/courses/:id/assignments {title, routes, dueAt}

POST /api/admin/invites         {email}                               → Einladungslink
GET  /api/admin/users | PATCH /api/admin/users/:id {disabled}
```

## 7. Oberfläche

* Kopfzeile: Knopf **„Anmelden“** (Gast) bzw. Pseudonym + Menü (Fortschritt, Passwort ändern, Abmelden).
* `#/login` – zwei Reiter: **Schüler:in** (Benutzername + Passwort) und **Lehrkraft** (E-Mail + Passwort). Großer Hinweis: „Du kannst auch ohne Anmeldung üben.“
* `#/lehrkraft` – Kurse; je Kurs:
  * **Lernstand**: Tabelle Pseudonym × Level 1–16 (gelöste Aufgaben/verfügbare, Farbskala), Klick → Details je Modul; Quiz-Ergebnisse je Welt; letzte Aktivität.
  * **Zugänge**: N Zugänge erzeugen → druckbare **Zugangskarten** (A4, 8 Karten, mit QR-Code zur Login-Seite); Passwort zurücksetzen; entfernen.
  * **Aufträge**: App-Routen auswählen (z. B. aus der Level-Karte), Fälligkeitsdatum → erscheinen bei den SuS auf der Startseite.
  * **Freischaltung** (optional): nur Pflicht-Level sichtbar / alles sichtbar; Vertiefung/Bonus zuschaltbar (passt zu `LEVEL_TYPE` in `app/js/data/worlds.js`).
  * **Export** CSV, **Kurs löschen**.
* `#/admin` – Lehrkräfte einladen, sperren; Speicherstatistik.
* Barrierefreiheit wie im Rest der App (Tastatur, Kontraste, Großansicht „A A“).

## 8. Abnahmekriterien

1. Alle Deep-Links aus `app/README.md` funktionieren ohne Anmeldung wie bisher (`qa/qa-routes.mjs` grün).
2. Gast-Fortschritt bleibt erhalten; nach Anmeldung wird er übernommen (mit Rückfrage).
3. Fortschritt erscheint nach Anmeldung auf einem zweiten Gerät (Playwright-Test mit zwei Kontexten).
4. Lehrkraft erzeugt 25 Zugänge, druckt Karten, sieht nach dem Lösen einer Arena-Runde den Eintrag im Dashboard.
5. SuS können keine Daten anderer SuS/Kurse lesen (API-Tests für jede Route mit falscher Rolle → 403/404).
6. Login-Rate-Limit greift; Passwörter nur als argon2id/bcrypt-Hash in der DB; Session-Cookie `HttpOnly; Secure; SameSite=Lax`.
7. Kurs-Ablauf löscht Daten automatisch (Test mit manipulierter Uhr).
8. Container startet mit leerem Volume, legt Schema + Admin an; Update-Deploy behält Daten (Migrationen).
9. `npm test` (App + Server) und CI grün; Dokumentation (`docs/DEPLOYMENT.md`, `docs/DATENSCHUTZ.md`) aktualisiert.

## 9. Offene Entscheidungen (vor Umsetzung mit Frank klären, falls AlgoQuest sie nicht schon beantwortet)

* Gemeinsame Benutzerkonten mit AlgoQuest (ein Login für beide Apps, z. B. eigener Auth-Dienst) oder getrennte Konten?
* SuS-Zugänge nur durch die Lehrkraft oder zusätzlich Selbst-Beitritt mit Kurscode + selbst gewähltem Pseudonym?
* Lehrkräfte anderer Schulen zulassen (Einladung) – ja/nein?
* SMTP vorhanden (Passwort-vergessen-Mail für Lehrkräfte)?
* IServ-Anbindung (OAuth/SSO) später gewünscht?
