# AlgoQuest ↔ AutomatenLab – Vergleich und Empfehlungen für den Login

Stand: 2026-10-11 · Grundlage: `frankjuchim/AlgoQuest` (Commit `2d45fc2`, v2.3.0, README Teil A–G, `src/`, `test/`,
`Dockerfile`) und `docs/LOGIN_KONZEPT.md` (Entwurf v1).
Legende: **übernehmen** = wie AlgoQuest · **anpassen** = AlgoQuest-Lösung mit Änderung · **anders** = bewusst
abweichend (Begründung) · **Konzept** = Vorschlag aus `LOGIN_KONZEPT.md` gilt (AlgoQuest hat nichts Vergleichbares).

## 1. AlgoQuest in Kürze

| Bereich | AlgoQuest |
|---|---|
| Stack | Node 20, **Express 5**, **better-sqlite3**, **helmet**, **qrcode** – sonst keine Abhängigkeiten. CommonJS. Dev: `supertest`, `playwright-core`. |
| Frontend | Mehrseitig (`index.html`, `spiel.html`, `lehrer.html`, `board.html` …), Vanilla JS ohne Build, eigenes `h()`, Hash-Routing innerhalb der Seiten (`/lehrer#/kurs/3/auswertung`), CSP ohne Inline-Skripte/-Stile. |
| Aufbau Server | `src/app.js` (Express, Helmet, Sitzungen, statische Seiten) · `security.js` (Cookies, scrypt, Rate-Limiter, CSRF, Codes) · `validate.js` (Fehlerklassen, Eingabeprüfung) · `db.js` (Schema) · `routes/{schueler,lehrer,admin}.js` · `services/*` (Fachlogik, `createX(ctx)`-Fabriken mit injizierbarer Uhr `ctx.now`). |
| Rollen | Schüler · Lehrkraft · Superadmin (aus ENV). Getrennte Cookies `aql_s` / `aql_l`. |
| Schüler-Login | **Beitritt:** Kurscode + selbst gewählter Name → persönlicher Code `ABC-234` (kursübergreifend eindeutig). **Weiterspielen:** Name + Code. Lehrkraft kann umbenennen, neuen Code erzeugen, löschen. Beitritt pro Kurs abschaltbar. |
| Lehrkraft-Login | E-Mail + Passwort. **Registrierung auf Anfrage** (Name, E-Mail, Schule, Nachricht) → Status `wartet` → Freigabe/Ablehnung/Deaktivierung durch Superadmin. Passwort vergessen: Superadmin erzeugt **Einmal-Passwort** (muss beim Login geändert werden). Kein SMTP. |
| Superadmin | `ADMIN_EMAIL` + `ADMIN_PASSWORD` werden **bei jedem Start** gesetzt; ohne Passwort ist der Superadmin-Login gesperrt. Kann alles, was Lehrkräfte können (alle Kurse), plus Verwaltung, Backup/Restore (JSON). |
| Sitzungen | **Zustandslose, HMAC-SHA256-signierte Cookies** `{id, gen, exp}`; Abmelden aller Geräte über Zähler `session_gen` in der Benutzerzeile (Passwortwechsel, neuer Code, Deaktivierung). `httpOnly`, `SameSite=Lax`, `secure` hinter HTTPS. Schüler 30 Tage, Lehrkräfte 8 h. |
| Passwörter | `crypto.scrypt` (N = 2¹⁵, r = 8, p = 1, Salt 16 B), Format `scrypt$N$r$p$salt$hash`, Mindestlänge 10, Dummy-Rechnung bei unbekanntem Konto (gleiche Antwortzeit). Keine native Zusatzbibliothek. |
| Schutz | CSRF: schreibende API-Anfragen nur mit passender `Origin`/`Referer` **und** `Content-Type: application/json`. Rate-Limits im Speicher (Login je Konto und je IP, Beitritt, Registrierung, Prüfen). Fremde Kurse → 404. Fehlertexte deutsch, `Interner Fehler.` ohne Details. `X-Robots-Tag: noindex`. |
| Datenmodell | `lehrkraefte`, `kurse` (Code, `einstellungen` JSON), `schueler` (Name, Code, `session_gen`), Inhalte (`welten`, `aufgaben`), Lernstand **je Aufgabe** (`fortschritt`, `abzeichen`, `boss_versuche`, `training`, `leitner` …). Prüfung der Antworten **nur serverseitig**. |
| Schema/Upgrade | `CREATE TABLE IF NOT EXISTS` + `meta.schema_version`; keine nummerierten Migrationen (nur Erkennung/Sicherung der v1-Datenbank). |
| Lehrkraft-Ansichten | Kurse (Code, Beitritts-Link `/k/CODE`, QR als SVG), Schülerliste, Einstellungen (Welten, Boss, Scoreboard, Beamer, Anmeldung offen), **Auswertung: Matrix Schüler × Level**, Boss-Ergebnisse, Aufgabenstatistik, CSV (Semikolon, UTF-8-BOM), Urkunden, Aufgaben-Vorschau, Materialien-Downloads. |
| Datenschutz | Kein Klarname nötig (Empfehlung „Vorname + Initial“), IP nur im Arbeitsspeicher (≤ 60 min), keine externen Ressourcen, Löschfunktionen (Schüler, Kurs, Lehrkraft), Datenschutzseite als Entwurf. **Keine automatische Löschung** abgelaufener Kurse. |
| Tests | `node --test` + supertest gegen `createApp({dbFile: ':memory:'})`, Helfer `szenario()` (Admin + Lehrkraft + Kurs + Schüler), steuerbare Uhr, `rechte.test.js` (Kurs-Isolation, Rollen, CSRF, Header), Playwright-E2E durch alle Rollen. |
| Deployment | Mehrstufiges `Dockerfile` (`node:20-bookworm-slim`, `npm ci --omit=dev`, Port 80 ohne root via `setcap`, `USER node`), `VOLUME /app/data`, `HEALTHCHECK /healthz` (liefert Version), `captain-definition` im Wurzelordner, **Webhook: `main` = live**, GitHub-Prüfung blockiert nicht. |

## 2. Punkt für Punkt: Konzept ↔ AlgoQuest ↔ Empfehlung

### 2.1 Rollen und Zugänge (Konzept Abschnitt 1)

| Punkt | AlgoQuest | AutomatenLab-Konzept | Empfehlung |
|---|---|---|---|
| Gast | gibt es nicht für das Lab (nur `/themen` öffentlich) | alles Fachliche ohne Anmeldung, Fortschritt lokal | **Konzept** – QR-Codes auf gedruckten Blättern verlangen es (CLAUDE.md Regel 1/2). Umfang der „Vorschau“ ist **offene Frage F1** (§4). |
| Schüler:in – Anmeldung | Name + persönlicher Code (`ABC-234`) | Benutzername (Pseudonym) + Passwort/PIN, von der Lehrkraft erzeugt | **anpassen:** Login-Mechanik von AlgoQuest (Name + Code, Code kursübergreifend eindeutig, gleiche Toleranz bei der Eingabe, gleiche Texte „Weiterspielen“). Der „Name“ ist hier ein **Pseudonym**, das die Lehrkraft beim Erzeugen der Zugänge vergibt (`fuchs-17`) → druckbare **Zugangskarten**. Selbst-Beitritt mit Kurscode wie AlgoQuest als **optionaler Schalter je Kurs** (Standard: aus). Damit identische Login-Maske in beiden Apps, aber Datensparsamkeit des Konzepts. |
| Lehrkraft – Konto | Registrierung auf Anfrage + Freigabe durch Superadmin | Einladungslink vom Admin | **übernehmen** (Anfrage + Freigabe + Einmal-Passwort). Funktioniert ohne SMTP, ist erprobt, getestet und in beiden Apps gleich. Einladungslinks entfallen. |
| Admin | Superadmin aus ENV, bei jedem Start gesetzt | `ADMIN_INITIAL_PASSWORD` nur beim ersten Start | **übernehmen** (ENV bei jedem Start; ohne Passwort gesperrt). Passwort-Reset des Admins = ENV ändern, kein Sonderweg. |
| Keine offene Registrierung | Lehrkräfte: Anfrage, aber nicht automatisch aktiv | keine offene Registrierung | **übernehmen** – die Anfrage ist kein Zugang, erst die Freigabe. |

### 2.2 Datensparsamkeit und Löschung (Abschnitt 2)

| Punkt | AlgoQuest | Konzept | Empfehlung |
|---|---|---|---|
| SuS-Identität | selbst gewählter Name (Empfehlung Vorname + Initial) | Pseudonym, Zuordnung nur auf Papier | **Konzept** – sparsamer; passt zu den Zugangskarten. Bei Selbst-Beitritt (falls eingeschaltet) Hinweis wie AlgoQuest „keine vollständigen Namen“. |
| Notiz/Kürzel der Lehrkraft | – | optional ≤ 12 Zeichen | **Konzept** (z. B. „Platz 7“), mit Hinweis im Formular. |
| Lehrkraft-Daten | Name, E-Mail, Schule, Nachricht, Hash | E-Mail, Hash | **übernehmen** (Name + Schule braucht der Admin für die Freigabe). |
| IP-Adressen | nur im Arbeitsspeicher für Rate-Limits | – | **übernehmen**. |
| Kurs-Ablauf / automatische Löschung | **fehlt** | Ablaufdatum (Standard Schuljahresende, max. 12 Monate), Hinweis vorher, automatische Löschung | **Konzept** – neu bauen (täglicher Job im Server, steuerbare Uhr für den Test). Kandidat zum Rückportieren nach AlgoQuest. |
| SuS löschen eigenes Konto | – (nur Lehrkraft) | ja | **Konzept** (einfacher Knopf im Kontomenü, mit Bestätigung). |
| Datenschutzseite / Impressum | `/datenschutz` (Entwurf mit `[…]`) | `#/datenschutz`, `#/impressum` | **anpassen:** Text von AlgoQuest als Vorlage (gleiche Struktur, gleiche Platzhalter), Inhalte an AutomatenLab angepasst; als neue Hash-Routen (ergänzen, nicht umbenennen). |
| Tracking/CDNs | keine | keine | gleich. |

### 2.3 Architektur und Sicherheit (Abschnitt 3)

| Punkt | AlgoQuest | Konzept | Empfehlung |
|---|---|---|---|
| Container | ein Container (Node) | ein Container App + API | **übernehmen**. Dockerfile nach AlgoQuest-Muster (mehrstufig, `USER node`, `setcap` für Port 80, `HEALTHCHECK /healthz`). |
| Framework | Express 5 | Fastify oder Express | **übernehmen: Express 5** (Konzept lässt es ausdrücklich zu; gleiche Middleware-/Fehlerbehandlung in beiden Apps). |
| Modulformat | CommonJS | – | **anders: ES-Module** für `server/`. Die App (`app/js`) ist ESM; der Server muss `app/js/data/worlds.js`, `manifest.js` und eine neue Zuordnung Aufgabe → Level importieren (Lernstand-Matrix), ohne sie zu duplizieren. Portieren aus AlgoQuest ist mechanisch (`require` → `import`); Dateinamen und Funktionsnamen bleiben gleich, damit Diffs lesbar bleiben. |
| Node-Version | 20 | ≥ 20 | **anders: Node 22 LTS** – Node 20 ist seit April 2026 ohne Sicherheitsupdates. Empfehlung auch für AlgoQuest. |
| Datenbank | better-sqlite3, `/app/data/algoquest.db` | better-sqlite3, `/data/automatenlab.sqlite` | **anpassen:** better-sqlite3, Datei **`/app/data/automatenlab.db`** (persistentes Verzeichnis ist in CapRover bereits so angelegt), WAL, `foreign_keys`, `busy_timeout` wie AlgoQuest. |
| Schema-Änderungen | `CREATE IF NOT EXISTS` + `schema_version` | Migrationen | **anpassen:** kleiner Migrations-Läufer (`server/migrations/001_*.sql …`, Version in `meta`, jede Migration in einer Transaktion) – ca. 40 Zeilen, keine Bibliothek. CLAUDE.md verlangt Migrationen; Kandidat zum Rückportieren. |
| Statische App | Express-Static aus `public/` | unverändert aus `app/` | **anpassen:** Express liefert `app/` unverändert aus, mit denselben Cache-Regeln wie heute `app/nginx.conf` (index.html `no-cache`, JS/CSS 1 h, Schriften/WASM 30 Tage). Für gzip (Graphviz 1,2 MB → 470 KB im Schulnetz) **eine zusätzliche Abhängigkeit `compression`** – begründet. |
| Sitzungen | signierte zustandslose Cookies + `session_gen` | Sessions-Tabelle in SQLite | **übernehmen** (keine `sessions`-Tabelle). Gleiche Sicherheit für unseren Zweck (Widerruf über `session_gen`), weniger Schreibzugriffe, kein Aufräumen nötig. |
| Cookie-Laufzeit | SuS 30 Tage, Lehrkraft 8 h | SuS 30 Tage gleitend, Lehrkraft 12 h | **übernehmen** (8 h; nicht gleitend, wie AlgoQuest). Cookie-Namen eigen (`al_s` / `al_l`), damit sich die Apps nicht stören. |
| Passwort-Hash | scrypt (N = 2¹⁵) | argon2id (oder bcrypt ≥ 12) | **übernehmen: scrypt** aus `node:crypto` – entspricht den OWASP-Empfehlungen, keine native Abhängigkeit, identischer Code. Abnahmekriterium 6 entsprechend lesen („scrypt/argon2id/bcrypt“). |
| SuS-Geheimnis | persönlicher Code `ABC-234` (≈ 24³·8³ ≈ 7 Mio.) | Passwort/PIN | **übernehmen**, mit Rate-Limit je Name und je IP wie AlgoQuest. Code wird wie ein Passwort behandelt (Konstantzeit-Vergleich). |
| Rate-Limit | Limiter im Speicher (Schüler 8/15 min je Name + 100 je IP, Lehrkraft 8 je Konto + 20 je IP) | 10/10 min je Konto + IP | **übernehmen** (Werte von AlgoQuest). |
| CSRF | Origin/Referer + JSON-Pflicht | Origin + Token | **übernehmen** (ohne Token: mit `SameSite=Lax` und JSON-Pflicht ausreichend, getestet). Ausnahme: `sendBeacon` beim Verlassen der Seite sendet kein JSON-Content-Type → eigener, eng begrenzter Endpunkt mit `text/plain`-Body und Origin-Prüfung (siehe 2.5). |
| Validierung | `validate.js` (handgeschrieben, deutsche Fehler) | JSON-Schema | **übernehmen** (`validate.js` 1:1). Kein Schema-Paket. |
| Sicherheits-Header | helmet, CSP ohne `unsafe-inline` | wie `app/nginx.conf` | **anpassen:** helmet, aber CSP **wie heute in `app/nginx.conf`** (`'wasm-unsafe-eval'` für Graphviz, `style-src 'unsafe-inline'` wie bisher; ob es wie bei AlgoQuest entfallen kann, wird mit `qa/qa-routes.mjs` geprüft, nicht vorab geändert). `X-Robots-Tag: noindex` übernehmen. |
| Keine Existenz-Leaks | 401 „Name oder Code stimmen nicht“, fremde Kurse 404 | gefordert | **übernehmen**. |
| Konfiguration | `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `SESSION_SECRET`, `PORT`, `DATA_DIR`, `TRUST_PROXY` | `SESSION_SECRET`, `DATABASE_PATH`, `BASE_URL`, `ADMIN_EMAIL`, `ADMIN_INITIAL_PASSWORD`, `SMTP_*` | **übernehmen** (AlgoQuest-Namen) + `BASE_URL` (für QR auf Zugangskarten). Kein SMTP. `.env.example` im Wurzelordner. |

### 2.4 Datenmodell (Abschnitt 4)

| Tabelle (Konzept) | AlgoQuest | Empfehlung |
|---|---|---|
| `users` (eine Tabelle, Rolle) | getrennt: `lehrkraefte` / `schueler` | **übernehmen (getrennt)**: `lehrkraefte` (wie AlgoQuest) und `schueler` (Pseudonym, `name_key`, Code, `notiz`, `session_gen`, `kurs_id`). SuS gehören genau zu einem Kurs; Löschen per `ON DELETE CASCADE`. Gleiche Spaltennamen wie AlgoQuest. |
| `courses` | `kurse` (Code, `einstellungen` JSON) | **anpassen:** `kurse` + `ablauf_at` + `hinweis_gesendet_at`; `einstellungen` = `{freischaltung: {vertiefung, bonus}, selbstbeitritt, hinweis}`. |
| `course_members` | entfällt (Schüler hat `kurs_id`) | **übernehmen (entfällt)**. |
| `course_teachers` | – | **später** (nicht im ersten Wurf; YAGNI). |
| `progress(state_json, version)` | Lernstand je Aufgabe, serverseitig geprüft | **anders (Konzept):** `fortschritt(schueler_id PK, stand_json, version, updated_at)` – gleicher Aufbau wie `localStorage 'automatenlab.v1'`. Die App prüft alles im Browser (Engine); eine serverseitige Prüfung wie bei AlgoQuest wäre ein Neubau aller 13 Module. Folge: SuS könnten ihren Stand manipulieren – vertretbar, weil keine Noten daran hängen (in Datenschutz-/Lehrkrafttext erwähnen). |
| `progress_events` | (Matrix aus `fortschritt`) | **anpassen:** `ereignisse(schueler_id, art, modul, item, wert, at)` – **vom Server beim Speichern aus der Differenz alter/neuer Stand abgeleitet** (neue `solved`-Schlüssel, neue Abzeichen, neue Bestwerte). Damit kein eigener Events-Endpunkt und **keine Änderung an den Modulen** – die `progress`-API bleibt wirklich unverändert. |
| `assignments` | – | **Konzept**: `auftraege(kurs_id, titel, routen_json, faellig_at)`. Routen werden gegen die Routenliste geprüft. |
| `invites` | – (Anfrage + Freigabe) | **entfällt** (siehe 2.1). |
| `sessions` | – (zustandslose Cookies) | **entfällt** (siehe 2.3). |
| `meta` | `meta(key, value)` | **übernehmen** (Schema-Version, App-Kennung). |

### 2.5 Synchronisation (Abschnitt 5)

AlgoQuest hat keine Entsprechung (alles serverseitig, kein Offline). Empfehlung **Konzept**, mit Präzisierungen:

| Punkt | Empfehlung |
|---|---|
| Speicher-Adapter | `progress.js` bekommt intern `lokal` (heute) und `konto` (angemeldet: lokaler Spiegel unter eigenem Schlüssel `automatenlab.v1:konto:<id>` + Server). Öffentliche API unverändert. |
| Gast → Konto | beim ersten Anmelden auf einem Gerät mit Gast-Fortschritt: Rückfrage „Fortschritt dieses Geräts übernehmen?“, Zusammenführen nach Konzept (Vereinigung, frühester Zeitstempel, Maximum, neuerer Entwurf). Merge-Funktion DOM-frei in `app/js/core/merge.js`, mit `node --test` getestet und **vom Server mitbenutzt** (409-Fall serverseitig lösbar). |
| Schreiben | entprellt `PUT /api/fortschritt {stand, version}` (2 s); beim Verlassen `navigator.sendBeacon` auf `POST /api/fortschritt/beacon` (Origin-Prüfung, nur angemeldet). 409 → holen, zusammenführen, erneut senden. |
| Offline | weiterarbeiten, Kennzeichen „nicht synchronisiert“ in der Kopfzeile, später nachsenden. |
| Abmelden | lokale Kontokopie löschen (geteilte Schul-iPads); Gast-Stand bleibt unberührt. |
| Punkte | Punkte = Maximum aus beiden Ständen (Neuberechnung ist nicht möglich, weil die Arena Punkte ohne `solve` vergibt). |

### 2.6 API (Abschnitt 6)

**anpassen:** Struktur und Namen nach AlgoQuest (deutsch, getrennte Router `schueler.js`, `lehrer.js`, `admin.js`),
Endpunkte nach Bedarf des Konzepts:

```
GET  /healthz                                   (Version)
GET  /api/sitzung                               → {schueler|null, lehrkraft|null}
POST /api/schueler/anmelden {name, code} · /abmelden · DELETE /api/schueler/konto
POST /api/schueler/beitreten {kurscode, name}   (nur wenn im Kurs eingeschaltet)
GET|PUT /api/fortschritt · POST /api/fortschritt/beacon
GET  /api/auftraege                             (eigener Kurs)
POST /api/lehrer/registrieren · /anmelden · /abmelden · /passwort · GET /api/lehrer/ich
GET|POST /api/lehrer/kurse · GET|PATCH|DELETE /api/lehrer/kurse/:id
POST /api/lehrer/kurse/:id/zugaenge {anzahl, praefix?} → [{name, code}]   (einmal sichtbar, für Zugangskarten)
POST /api/lehrer/kurse/:id/schueler/:sid/neuer-code · PATCH (Notiz) · DELETE
GET  /api/lehrer/kurse/:id/auswertung · /export.csv · /qr.svg
GET|POST|DELETE /api/lehrer/kurse/:id/auftraege
GET  /api/admin/lehrkraefte · POST …/:id/status · …/:id/einmalpasswort · DELETE …/:id · GET /api/admin/backup · POST /api/admin/restore
```

### 2.7 Oberfläche (Abschnitt 7)

| Punkt | AlgoQuest | Empfehlung |
|---|---|---|
| Aufbau | getrennte HTML-Seiten (`/lehrer`, `/spiel`) | **anders:** neue **Hash-Routen** in der bestehenden SPA (`#/login`, `#/konto`, `#/lehrkraft…`, `#/admin…`, `#/datenschutz`, `#/impressum`) – passt zum vorhandenen Router/Modul-Lebenszyklus; alle alten Routen bleiben. |
| Login-Maske | Reiter „Kurs beitreten / Weiterspielen“, Lehrkraft separat | **anpassen:** `#/login` mit Reitern **Schüler:in** (Name + Code, Texte wie AlgoQuest) und **Lehrkraft** (E-Mail + Passwort, Link „Zugang anfragen“). Hinweis „Du kannst auch ohne Anmeldung üben.“ (je nach F1). |
| Kopfzeile | – | **Konzept:** „Anmelden“ bzw. Pseudonym + Menü; Sync-Kennzeichen; Footer-Text („nur auf diesem Gerät“) je nach Status. |
| Lernstand-Matrix | Schüler × Level, Anteil als Farbe | **übernehmen** (gleiche Darstellung/Farbskala/CSV-Format) – Level 1–16 × Pseudonym, Klick → Details je Modul; letzte Aktivität. Dazu neue DOM-freie Zuordnung „Aufgabe → Level“ (`app/js/data/zuordnung.js`) mit Test, dass jede lösbare Aufgabe genau zugeordnet ist. |
| Zugangskarten | – (QR des Beitritts-Links als SVG) | **Konzept** + AlgoQuest-QR: Druckansicht A4, 8 Karten (Pseudonym, Code, QR zu `#/login`), `qrcode` serverseitig als SVG. |
| Aufträge, Freischaltung, Export, Kurs löschen | Einstellungen (Welten frei), CSV, Löschen mit Namensbestätigung | **anpassen:** Freischaltung Pflicht/Vertiefung/Bonus nach `LEVEL_TYPE`; Aufträge (Konzept); CSV und „Kursnamen zur Bestätigung eintippen“ wie AlgoQuest. |
| Scoreboard, Beamer-Board, Urkunden, Boss | vorhanden | **nicht im ersten Wurf** (Konzept sieht keine Bestenliste vor) – offene Frage F7. |
| Admin | Tabs Lehrkräfte/Backup/… | **übernehmen** (Lehrkräfte, Einmal-Passwort, Backup/Restore, Speicherstatistik). |
| Barrierefreiheit | Touch ≥ 44 px, Tastatur, Screenreader | gleich; zusätzlich Großansicht „A A“ auf allen neuen Seiten. |

### 2.8 Tests, CI, Deployment, Konventionen

| Punkt | AlgoQuest | Empfehlung |
|---|---|---|
| Server-Tests | node:test + supertest, `createApp(':memory:')`, `szenario()`, `uhr()` | **übernehmen** (Helfer 1:1, `server/tests/`), dazu eine **Rechte-Matrix**: jede Route × {Gast, Schüler, Schüler fremder Kurs, Lehrkraft, fremde Lehrkraft, Admin} → erwarteter Status (Abnahmekriterium 5). |
| E2E | `test/e2e/e2e.js` (Playwright) | **anpassen:** `qa/qa-routes.mjs` bleibt Pflicht; neu `qa/qa-login.mjs` (zwei Browser-Kontexte: Sync auf zweitem Gerät, Lehrkraft sieht Arena-Runde). |
| CI | `pruefung.yml` bei jedem Push, blockiert Webhook nicht | **übernehmen** (eingerichtet: Tests + Deep-Links im gebauten Container). |
| `main` = live | Regel in README/CLAUDE.md | **übernehmen** (in `docs/DEPLOYMENT.md` aufgenommen). |
| Projektstruktur | Server im Wurzelordner (`src/`) | **anpassen:** `server/` neben `app/` und `materials/` (Monorepo); `package.json` im Wurzelordner bekommt die Server-Abhängigkeiten, Material-Abhängigkeiten werden `devDependencies` (nicht im Image). |

## 3. Gemeinsamer Code, gemeinsames Paket, gemeinsamer Login?

**Gemeinsames Paket (Auth, Kurse, Dashboard-Bausteine):** *jetzt nicht, später ja.*
* Wirklich themenunabhängig und fast identisch sind nur `security.js` (Cookies, scrypt, Limiter, CSRF, Codes),
  `validate.js`, `konten.js` (Lehrkräfte + Superadmin) und Teile von `kurse.js` – zusammen ca. 700 Zeilen. Lernstand,
  Matrix und Einstellungen unterscheiden sich grundlegend (serverseitig je Aufgabe vs. Zustand aus dem Browser).
* Ein Paket bedeutet Versionierung, ein drittes Repository und Zugriff aus dem CapRover-Build auf ein privates Paket
  (Token) – für einen Betreuer und zwei Apps mehr Aufwand als Nutzen.
* Vorgehen: Die Dateien werden **1:1 übernommen** (nur ESM-Syntax), mit Kopfkommentar „übernommen aus AlgoQuest
  `src/security.js` @ 2d45fc2“ und gleichen Funktionsnamen. So bleiben Fehlerbehebungen zwischen beiden Repos per
  Diff übertragbar. Sobald eine **dritte Plattform** (Blaupause Teil G) entsteht, wird daraus ein Paket
  `lab-kern` (eigenes Repo, per Git-Tag eingebunden).

**Gemeinsamer Login für beide Apps:** *nicht empfohlen (vorerst getrennte Konten).*
* SuS-Zugänge sind kurs- und schuljahresgebunden (Pseudonym + Code, automatische Löschung) – ein gemeinsames Konto
  brächte ihnen nichts und widerspräche der Datensparsamkeit (Verknüpfung zweier Lernstände).
* Nutzen hätten nur Lehrkräfte (ein Passwort statt zwei). Dafür bräuchte es einen eigenen Auth-Dienst (OIDC) oder
  ein Domain-Cookie auf `.frankjuchim.de` mit gemeinsamer Benutzerdatenbank – neue Kopplung: fällt der Dienst aus,
  sind beide Apps betroffen; Datenschutz-Dokumentation wird komplizierter.
* Stattdessen: **gleiches Verfahren, gleiche Oberfläche, gleiche Texte** in beiden Apps. Wenn später gewünscht, ist
  **IServ-SSO (OAuth2/OpenID Connect)** für Lehrkräfte der bessere „gemeinsame Login“ – dann für beide Apps zugleich.

## 4. Offene Fragen (für Frank)

| Nr. | Frage | Empfehlung |
|---|---|---|
| F1 | **Gastmodus:** Laut Auftrag „nur ein kleiner Preview, kein voller Zugriff“ – laut CLAUDE.md Regel 2 und Abnahmekriterium 1 „alles Fachliche ohne Anmeldung“. Was gilt? | **Alle Routen aus `app/README.md` bleiben ohne Anmeldung voll nutzbar** (gedruckte QR-Codes, Vertretungsstunden, Gerät ohne Konto). „Vorschau“ betrifft die **Startseite**: Gäste sehen Welt A vollständig und von den übrigen Welten die Modulkacheln mit Hinweis „Mit Anmeldung: Fortschritt auf allen Geräten, Aufträge deiner Lehrkraft“. Hinweis: Die Inhalte liegen ohnehin als JavaScript im Browser; eine „Sperre“ wäre nur kosmetisch. Eine echte Sperre würde CLAUDE.md und Abnahmekriterium 1 ändern. |
| F2 | Gemeinsame Konten mit AlgoQuest? | **Nein** (siehe §3); gleiches Verfahren, getrennte Konten; IServ-SSO später für beide. |
| F3 | SuS-Zugänge nur durch die Lehrkraft oder auch Selbst-Beitritt? | **Beides**, Standard: Lehrkraft erzeugt Zugangskarten (Pseudonym + Code). Selbst-Beitritt mit Kurscode wie AlgoQuest je Kurs zuschaltbar (Standard aus). |
| F4 | Lehrkräfte anderer Schulen zulassen? | **Ja, über Anfrage + Freigabe durch dich** (wie AlgoQuest). Hinweis: Für fremde Schulen wärst du Auftragsverarbeiter – erst freigeben, wenn das geklärt ist. |
| F5 | SMTP vorhanden? | **Kein SMTP** – Passwort vergessen über Einmal-Passwort durch den Admin (wie AlgoQuest). |
| F6 | IServ-Anbindung später? | **Später (Ideen-Liste)**, Server so bauen, dass ein zweites Anmeldeverfahren für Lehrkräfte ergänzt werden kann. |
| F7 | Scoreboard / Beamer-Board / Urkunden wie AlgoQuest? | **Nicht in Phase 2–5**; als Idee behalten (anonymisierte Kurs-Bestenliste). |
| F8 | Standard-Ablaufdatum eines Kurses? | **31. Juli des laufenden Schuljahres** (max. 12 Monate, verlängerbar), Hinweis an die Lehrkraft 14 Tage vorher im Dashboard. |
| F9 | Node 22 LTS und ES-Module im Server (Abweichung von AlgoQuest)? | **Ja** (siehe 2.3); AlgoQuest bei Gelegenheit ebenfalls auf Node 22 heben. |

## 5. Umsetzungsplan Phase 2–5 (je Meilenstein ein Branch + Pull Request)

Jeder PR: `npm test` (App + Server) grün, `qa/qa-routes.mjs` gegen den gebauten Container grün, Doku nachgezogen.
Merge nach `main` (= live) nur nach Franks Freigabe und außerhalb der Unterrichtszeit.

| PR | Meilenstein | Inhalt | fertig, wenn |
|---|---|---|---|
| 1 | **Server-Grundgerüst** (Phase 2) | `server/` (ESM, Express 5), Auslieferung von `app/` mit den Cache-/Sicherheits-Headern aus `nginx.conf` + gzip, `/healthz` (Version), SQLite in `/app/data` mit Migrations-Läufer, Konfiguration + `.env.example`, Logging; Dockerfile → Node 22 nach AlgoQuest-Muster; Server-Tests in der CI. | Container startet mit leerem Volume, legt Schema an; Neustart behält Daten; alle Deep-Links unverändert; Header-Test (CSP, noindex). |
| 2 | **Konten** (Phase 3a) | `security.js`, `validate.js`, `konten.js` aus AlgoQuest; Admin aus ENV; Lehrkraft-Anfrage → Freigabe → Login/Logout/Passwort/Einmal-Passwort; Rate-Limits, CSRF; Rechte-Matrix-Test. Oberfläche: Kopfzeile „Anmelden“, `#/login` (Reiter Lehrkraft), `#/admin` (Lehrkräfte). | Abnahmekriterien 5 (Teil Lehrkraft/Admin) und 6. |
| 3 | **Kurse und SuS-Zugänge** (Phase 3b) | Kurse (Ablaufdatum), Zugänge erzeugen (Pseudonym + Code, einmal sichtbar), Zugangskarten A4 mit QR, neuer Code, Notiz, Löschen; SuS-Login (Name + Code), optionaler Selbst-Beitritt, SuS löschen eigenes Konto. Oberfläche `#/lehrkraft` (Kurse, Zugänge), `#/login` (Reiter Schüler:in), `#/konto`. | 25 Zugänge erzeugen + Karten drucken; SuS sehen keine fremden Daten (Kriterium 5 vollständig). |
| 4 | **Fortschritt synchronisieren** (Phase 4) | `app/js/core/merge.js` (DOM-frei, getestet, auch im Server), Speicher-Adapter in `progress.js` (API unverändert), `GET/PUT /api/fortschritt`, Beacon, Version/409, Gast-Übernahme mit Rückfrage, Offline-Kennzeichen, Abmelden löscht Kontokopie; Ereignisse serverseitig aus der Differenz. `qa/qa-login.mjs` mit zwei Browser-Kontexten. | Kriterien 2 und 3. |
| 5 | **Lernstand-Dashboard** (Phase 5a) | `app/js/data/zuordnung.js` (Aufgabe → Level, Test: vollständig), Matrix Level 1–16 × Pseudonym wie AlgoQuest, Details je Modul, letzte Aktivität, CSV. | Kriterium 4 (Arena-Runde erscheint im Dashboard). |
| 6 | **Aufträge und Freischaltung** (Phase 5b) | Aufträge (Routen + Fälligkeit) anlegen, Anzeige auf der Startseite angemeldeter SuS; Freischaltung Pflicht/Vertiefung/Bonus je Kurs (Startseite/Level-Karte; Deep-Links bleiben erreichbar). | Auftrag erscheint bei den SuS; Freischaltung wirkt nur auf angemeldete SuS des Kurses. |
| 7 | **Löschkonzept, Datenschutz, Abnahme** (Phase 5c) | täglicher Lösch-Job (Hinweis 14 Tage vorher), Test mit gestellter Uhr; `#/datenschutz`, `#/impressum`; Backup/Restore (JSON) im Admin-Bereich; `docs/DATENSCHUTZ.md`, `docs/DEPLOYMENT.md`, README; Abnahme aller Kriterien aus `LOGIN_KONZEPT.md` §8. | Kriterien 7–9; Checkliste §8 abgehakt. |

Der Gastmodus (F1) betrifft PR 2 (Kopfzeile/Startseite) und PR 6 (Startseite). Bis zur Entscheidung bleibt alles wie heute.

## 6. Was AlgoQuest von AutomatenLab übernehmen könnte

Automatische Löschung abgelaufener Kurse · nummerierte Migrationen · Node 22 · Rechte-Matrix-Test über alle Routen.
