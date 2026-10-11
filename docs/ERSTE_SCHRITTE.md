# Erste Schritte: Repository auf GitHub anlegen

Das Paket enthält bereits ein Git-Repository mit einem ersten Commit (Branch `main`).

```bash
unzip AutomatenLab_Repository.zip && cd AutomatenLab
git log --oneline                      # erster Commit vorhanden

# Repository anlegen und hochladen (GitHub CLI, angemeldet als frankjuchim)
gh repo create frankjuchim/AutomatenLab --private --source=. --remote=origin --push

# Materialpaket v1.0 als Release anhängen (die fertige ZIP-Datei mit allen Word-/PowerPoint-Dateien)
gh release create v1.0 /Pfad/zu/Automaten_LK.zip --title "Version 1.0" --notes "Unterrichtseinheit, Web-App und Videoreihe – erster Stand"
```

Ohne GitHub CLI: auf github.com ein leeres Repository `AutomatenLab` anlegen (ohne README/Lizenz), dann
`git remote add origin git@github.com:frankjuchim/AutomatenLab.git && git push -u origin main`.

Danach:
1. **Actions** prüfen: CI läuft beim Push automatisch (App-Tests, fachliche Prüfung, Deep-Links).
2. Für automatisches Deployment die drei Secrets aus `docs/DEPLOYMENT.md` setzen (optional – manuell geht weiterhin).
3. Lokal einrichten: `npm install`, `python3 -m pip install -r materials/requirements.txt`, `brew install graphviz` (für Vorschauen zusätzlich LibreOffice).
4. Claude Code starten und den Prompt aus `docs/UEBERGABE_CLAUDE_CODE.md` einfügen.

Hinweis: Zum Tag `v1.0` baut der Workflow „Materialpaket bauen“ das Paket zusätzlich selbst (ca. 5 min) und ersetzt die hochgeladene `Automaten_LK.zip` – der Inhalt ist identisch. Du kannst den Dateinamen im `gh release create` also auch weglassen und auf den Workflow warten.
