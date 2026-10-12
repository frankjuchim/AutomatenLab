# Deployment

> ⚠️ **`main` ist per Webhook direkt mit CapRover verbunden: Jeder Push auf `main` startet sofort den Live-Build.**
> Immer auf Feature-Branches arbeiten; nach `main` nur über einen geprüften Pull Request (Prüfung grün) und nicht
> während des Unterrichts. Danach die Live-Seite prüfen.

## Container auf CapRover (ab Version 1.1)

* CapRover-App `automatenlab`, Domain <https://automatenlab.frankjuchim.de>, Container-Port **80**.
* Build aus dem **Wurzelordner**: `captain-definition` → `./Dockerfile` – Node 22 (mehrstufig wie Algo Quest,
  läuft als Benutzer `node`), Server `src/` + Web-App `app/` (ohne Tests). `.dockerignore` hält Materialien, Doku, QA
  und Tests aus dem Image.
* Persistentes Verzeichnis **`/app/data`** (in CapRover angelegt): SQLite-Datei `automatenlab.db`. Instanzanzahl 1.
* Healthcheck `GET /healthz` (liefert die Version), Manifest `GET /api/plattform` (Vertrag §7).
* Webhook: Ein Push auf `main` baut und startet die neue Version (Node-Image: einige Minuten).

Lokal wie auf CapRover bauen und prüfen:

```bash
docker build -t automatenlab . && docker run --rm -p 8080:80 -v "$PWD/data:/app/data" automatenlab
node qa/qa-routes.mjs http://localhost:8080/        # alle Deep-Links
node scripts/vertrag_pruefen.js http://localhost:8080   # Vertragsprüfung
```

Notfall-Deploy ohne GitHub: CapRover-CLI im Wurzelordner `npx caprover deploy` oder Tarball
(`git archive --format=tar -o AutomatenLab_CapRover.tar HEAD`) unter „Method 2: Tarball“.

Bis 2026-10 lagen `captain-definition` und ein nginx-`Dockerfile` in `app/`. CapRover sucht beim Webhook-Build im
Wurzelordner – deshalb schlug der Build fehl. Version 1.0.x (nach dem Umzug) lieferte die App noch mit nginx aus,
ab 1.1 übernimmt der Node-Server.

## GitHub-Prüfung

`.github/workflows/pruefung.yml` läuft bei jedem Push und Pull Request: App- und Server-Tests sowie Bau des Images,
Vertragsprüfung und Aufruf aller Deep-Links aus `app/README.md` (`qa/qa-routes.mjs`) gegen den Container. Die Prüfung blockiert den Webhook-Build nicht – sie ist die
Freigabe-Voraussetzung für den Merge nach `main`.

## Konfiguration und Portal-Anmeldung

* Umgebungsvariablen (CapRover → App Configs → Environmental Variables) nach Vertrag §8 – Werte und Erklärung in
  `docs/VERBUND.md` §4, Vorlage `.env.example`:
  `PLATTFORM_ID`, `PLATTFORM_URL`, `PORTAL_URL`, `PORTAL_PUBLIC_KEY`, `AUTH_MODUS=portal`, `SESSION_SECRET`.
  Kein `ADMIN_EMAIL`/`ADMIN_PASSWORD` (der Superadmin kommt vom Portal).
* Nach dem Deploy mit SSO (Phase 3): Plattform im Portal eintragen (`docs/VERBUND.md` §5).
* Schlüsselwechsel im Portal: neuen öffentlichen Schlüssel zusätzlich in `PORTAL_PUBLIC_KEY` eintragen (mehrere
  PEM-Blöcke erlaubt), erst danach tauscht das Portal den privaten Schlüssel.
* Backup: SQLite-Datei aus `/app/data` regelmäßig sichern.

## Materialpaket als Release

Das Materialpaket (`Automaten_LK.zip`) wird lokal mit `npm run materials:build` und `npm run materials:package` erzeugt
und an ein GitHub-Release gehängt. Ein Release-Workflow (`.github/workflows/release-materials.yml`) war geplant, ist
aber beim ersten Upload nicht im Repository angekommen (siehe `docs/ROADMAP.md`, Phase 6).
