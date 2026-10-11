# Deployment

## Heute (Version 1.0): statische App auf CapRover

* CapRover-App `automatenlab`, Domain <https://automatenlab.frankjuchim.de>, Container-Port 80.
* Image: `app/Dockerfile` (nginx, nur statische Dateien), `app/captain-definition`.
* Manuell deployen: `cd app && npx caprover deploy` (CapRover-CLI) oder Tarball (Anleitung in `app/README.md`).

## Automatisch aus GitHub (Workflow `.github/workflows/deploy.yml`)

1. In CapRover: App → **Deployment** → **App Token** erzeugen (Method 1 / „Enable App Token“).
2. Im GitHub-Repository: **Settings → Secrets and variables → Actions**
   * `CAPROVER_SERVER` = `https://captain.<deine-domain>` (Adresse des CapRover-Dashboards)
   * `CAPROVER_APP` = `automatenlab`
   * `CAPROVER_APP_TOKEN` = der App-Token aus Schritt 1
3. Deploy läuft manuell (**Actions → Deploy → Run workflow**) oder bei jedem Release-Tag `v*`.

Solange die App statisch ist, wird der Ordner `app/` deployt. Sobald es einen Server gibt (Login), wird der Workflow auf den Wurzelordner umgestellt (eigenes `captain-definition` im Wurzelordner) – das ist Teil von Phase 2 der Roadmap.

## Mit Login (Zielbild)

* Ein Container: Node-Server (API + statische App). Persistentes Verzeichnis in CapRover: **App Configs → Persistent Directories**: `/data` → Label `automatenlab-data`. **Vor dem ersten Deploy mit Server einrichten**, sonst gehen Daten bei jedem Deploy verloren.
* Umgebungsvariablen (App Configs → Environmental Variables): siehe `server/.env.example` (`SESSION_SECRET` mit `openssl rand -hex 32` erzeugen).
* Backup: SQLite-Datei aus `/data` regelmäßig sichern (z. B. CapRover-Backup oder nächtlicher `sqlite3 .backup` per Cron im Container).
* Instanzanzahl 1 (SQLite).

## Materialpaket als Release

`.github/workflows/release-materials.yml` baut bei einem Tag `v*` alle Word-/PowerPoint-Dateien und hängt `Automaten_LK.zip` an das GitHub-Release. Erstes Release (v1.0): das vorhandene `Automaten_LK.zip` manuell hochladen.
