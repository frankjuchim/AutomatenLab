# Deployment

> ⚠️ **`main` ist per Webhook direkt mit CapRover verbunden: Jeder Push auf `main` startet sofort den Live-Build.**
> Immer auf Feature-Branches arbeiten; nach `main` nur über einen geprüften Pull Request (Prüfung grün) und nicht
> während des Unterrichts. Danach die Live-Seite prüfen.

## Heute (Version 1.0): statische App auf CapRover

* CapRover-App `automatenlab`, Domain <https://automatenlab.frankjuchim.de>, Container-Port **80**.
* Build aus dem **Wurzelordner** des Repositorys: `captain-definition` → `./Dockerfile` (nginx, liefert nur `app/` ohne
  Tests aus, Konfiguration `app/nginx.conf`). Der Build-Kontext wird über `.dockerignore` auf `app/` beschränkt
  (Materialien, Doku, QA kommen nicht ins Image).
* CapRover: App → **Deployment** → „Method 3: Deploy from Github/Bitbucket/Gitlab“, Branch `main`; der Webhook ist bei
  GitHub hinterlegt. Ein Push auf `main` baut und startet die neue Version (ca. 1 min).
* Persistentes Verzeichnis ist in CapRover bereits angelegt: **`/app/data`** (wird erst ab Phase 2 genutzt).

Lokal wie auf CapRover bauen und prüfen:

```bash
docker build -t automatenlab . && docker run --rm -p 8080:80 automatenlab
node qa/qa-routes.mjs http://localhost:8080/      # alle Deep-Links
```

Notfall-Deploy ohne GitHub: CapRover-CLI im Wurzelordner `npx caprover deploy` oder Tarball aus dem Wurzelordner
(`git archive --format=tar -o AutomatenLab_CapRover.tar HEAD`) unter „Method 2: Tarball“ hochladen.

Bis 2026-10 lagen `captain-definition` und `Dockerfile` in `app/`. CapRover sucht beim Webhook-Build aber im
Wurzelordner – deshalb schlug der Build fehl und die Seite zeigte nur die CapRover-Platzhalterseite.

## GitHub-Prüfung

`.github/workflows/pruefung.yml` läuft bei jedem Push und Pull Request: App-Tests sowie Bau des Images und Aufruf aller
Deep-Links aus `app/README.md` (`qa/qa-routes.mjs`). Die Prüfung blockiert den Webhook-Build nicht – sie ist die
Freigabe-Voraussetzung für den Merge nach `main`.

## Mit Server und Portal-Anmeldung (ab Phase 2)

* Ein Container: Node-Server (API + statische App aus `app/`), wie Algo Quest. Persistentes Verzeichnis **`/app/data`**
  (bereits eingerichtet), SQLite-Datei `automatenlab.db`. Instanzanzahl 1 (SQLite).
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
