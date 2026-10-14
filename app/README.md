# AutomatenLab

Lern-Web-App zur Unterrichtseinheit „Maschinen, die Sprache verstehen“ (Informatik, Grund- und Leistungskurs, Automaten und formale Sprachen, KC Niedersachsen; was für welches Niveau ist: `#/themen?teil=niveaus`).
Plattform des Verbunds InfoLabs (Vertrag: https://github.com/frankjuchim/labs/blob/main/VERTRAG.md, Version 1.2). Die App läuft ohne Build-Schritt; ausgeliefert wird sie vom Server in `../src` (Node, Express). Keine externen Server, CDNs oder Tracker. Angemeldet wird nur über das Portal InfoLabs (Single Sign-on, Knopf „Anmelden“ oben rechts). Bis der Lernstand auf dem Server liegt (Phase 4), bleibt der Fortschritt im Browser des jeweiligen Geräts (`localStorage`).

## Deployment auf CapRover

Gebaut wird aus dem **Wurzelordner des Repositorys** (`captain-definition` → `Dockerfile`): ein Node-Container mit Server (`src/`) und dieser App. Jeder Push auf `main` startet per Webhook den Live-Build. Details: `docs/DEPLOYMENT.md`.

Der Server liefert die Dateien dieses Ordners unverändert aus – mit denselben Regeln wie früher `nginx.conf` (gzip, `index.html` ohne Cache, JS/CSS 1 h, Schriften/Graphviz 30 Tage, Content-Security-Policy nur für eigene Dateien). `nginx.conf` bleibt als Referenz liegen; Tests (`test/server.test.js`) prüfen die Regeln.

Lokal testen (im Wurzelordner):
```bash
npm install
npm run dev                           # Server + App unter http://localhost:8080/
npm test                              # App- und Server-Tests (Node ≥ 22)
docker build -t automatenlab . && docker run --rm -p 8080:80 automatenlab
```

## Routen für QR-Codes

`BASE_URL` = Adresse der CapRover-App, z. B. `https://automatenlab.example.de/`. Link = `BASE_URL` + Route.

| Route | Inhalt |
|---|---|
| `#/` | Übersicht: Level-Karte, alle Module, Fortschritt |
| `#/arena` | Akzeptor-Arena (Stufenauswahl) |
| `#/arena?stufe=1` · `?stufe=2` · `?stufe=3` | Arena mit vorgewählter Stufe |
| `#/arena?automat=<id>` | Runde nur mit einem Automaten: `kaffee`, `barcode`, `gerade-a`, `mind-zwei-b`, `lol`, `endet-ab`, `quersumme`, `kein-aa`, `konsole`, `anfang-ende`, `a-mod-3`, `binaer-3`, `tresor` |
| `…&ueben=1` | ohne Zeitlimit (z. B. `#/arena?stufe=1&ueben=1`) |
| `#/detektiv` | Sprach-Detektiv, Fallübersicht |
| `#/detektiv?fall=1` … `?fall=12` | einzelner Fall (1 Der Schlusspunkt, 2 Der erste Eindruck, 3 Der Pendler, 4 Die Spur, 5 Der Dreitakt, 6 Abstand halten, 7 Das Paar, 8 Spiegelbild?, 9 Gemischtes Doppel, 10 Der Begleitschutz, 11 Der Rechenkünstler, 12 Vier Ecken) |
| `#/baukasten` | Automaten-Baukasten, alle Challenges |
| `#/baukasten?stufe=1` · `2` · `3` | nur eine Stufe (Basis / Standard / Profi) |
| `#/baukasten?level=1` … `?level=18` | einzelne Challenge (siehe unten) |
| `#/baukasten?aufgabe=<id>` | Challenge über ihre ID (bleibt stabil, auch wenn die Reihenfolge sich ändert) |
| `#/baukasten?modus=frei` | Freier Modus (eigenes Σ, Export als JSON/DOT, Import) – für DS04-Stationen und Bug-Bounty |
| `#/minimierer` | Minimierer, Aufgabenübersicht |
| `#/minimierer?aufgabe=1` … `?aufgabe=7` | Markierungsverfahren (1 Smiley-Erkenner :-) / :) 6→5, 2 Doppelt gemoppelt: gerade Anzahl a 4→2, 3 Barcode 110 mit Ballast 7→5, 4 Binärzahl durch 3 teilbar (schon minimal), 5 Endet auf ab 5→3, 6 Kaffeeautomat 40 ct, 7 Prüfnummern Kriterium X über {1,2,3,-} – S3…S8 zusammenfassen, Abi 2025) |
| `#/minimierer?aufgabe=n&modus=unterscheide` · `#/minimierer?modus=unterscheide` | Spiel „Unterscheide!“ zu Aufgabe n bzw. gemischte Runde aus allen Aufgaben (Übung ohne Punkte) |
| `#/mealy` | Mealy-Maschine, Übersicht |
| `#/mealy?aufgabe=1` … `?aufgabe=7` | „Was kommt raus?“ (1 Süßigkeitenautomat M/H→B, 2 Kartoffelautomat 4 € mit Rückgeld, 3 Ziffernaddierer 0–3, 4 Lauflängen-Kompressor Frog hdddhhhhhdhh# → 1h3d3h2h1d2h# (Abi 2022), 5 Palindrom-Generator 011 → 01110, 6 Caesar-Verschiebung {A,B,C,D}, 7 wechselnde Verschiebung 1/2) |
| `#/mealy?aufgabe=n&modus=vorhersage` · `…&modus=bugjagd` · `…&modus=frei` | Ausgabe vorhersagen · Bug-Jagd (fehlerhafte Kantenausgaben finden und reparieren) · freie Simulation |
| `#/parallelwelten` | Parallelwelten (NEA), Übersicht |
| `#/parallelwelten?aufgabe=1` … `?aufgabe=6` (oder `?automat=<id>`) | 1 `lol` LOL-Suche, 2 `endet-ab` Endet auf ab, 3 `drittletztes` Drittletztes Zeichen ist 1 (4 → 8 Zustände), 4 `gratis` Spamfilter GRATIS, 5 `vorzeichen` optionales Vorzeichen (ε), 6 `abc` a…b…c… (ε-Kette) |
| `…&modus=sim` (`&wort=…`) · `…&modus=spiel` · `…&modus=teilmengen` | Simulation mit Spielfiguren · Rätsel „Wo stehen die Figuren?“ · Teilmengenkonstruktion (nicht bei 4) |
| `#/keller` | Keller-Labor, Übersicht |
| `#/keller?automat=<id>` | `anbn` aⁿbⁿ, `klammern` ( ), `klammern-x` [ x ], `klammern-gemischt` ( ) [ ], `anb2n` aⁿb²ⁿ, `gleich-ab` gleich viele a und b, `palindrom-c` w c wᴿ (DKA), `palindrom` w wᴿ (NKA, Mitte raten), `kriterium-y` Prüfnummern 32-12211 (Abi 2025), `code-ox` gleich viele O wie X, Ende E (Abi 2024) |
| `…&modus=sim` (`&wort=…`) · `…&modus=tabelle` (`&wort=…`) · `…&modus=rueckwaerts` | Schrittsimulator (Übergang wählen / automatisch) · Tabellen-Trainer im Abi-Format · Eingabewort aus Zustands-/Kellerfolge bestimmen (wie Abi 2022 C c) – z. B. `#/keller?automat=anbn&modus=tabelle&wort=aabb` |
| `#/ueberliste` | Überliste den Automaten, Stufenübersicht |
| `#/ueberliste?stufe=1` … `?stufe=5` · `?stufe=bonus` | Stufe (1 Der Zähler aⁿbⁿ k=5, 2 Der bessere Zähler aⁿbⁿ k=9, 3 Der Klammer-Prüfer k=4, 4 Der Türsteher gleich viele E/A k=7, 5 Der Riesen-Zähler aⁿbⁿ k=21) · Bonus: Multiple Choice „Warum hilft k+1 nicht?“ |
| `#/rallye` | Ableitungs-Rallye, Aufgabenübersicht |
| `#/rallye?aufgabe=1` … `?aufgabe=13` | 1 Glal I (le la lu), 2 aⁿbⁿ, 3 Glal II, 4 Mini-Deutsch „Die Maus trinkt Schokolade.“, 5 Klammern, 6 Palindrome, 7 Terme a+a*a, 8 Terme (a+a)*a, 9 Roboter-Befehle, 10 aⁿb²ⁿ, 11 Frosch-Sprache 2(h3(d)), 12 if-then-else (Baum-Modus), 13 mehrdeutige Terme (Baum-Modus) |
| `#/grammatik` | Grammatik-Tester, Übersicht (Challenges + freier Modus) |
| `#/grammatik?modus=frei` | Freier Modus: Regel-Check, Klassifikation, Wörter erzeugen/prüfen, Grammatik → NEA/DEA, Vergleich zweier Grammatiken |
| `#/grammatik?challenge=1` … `?challenge=11` | 1 aⁿbⁿ, 2 Palindrome, 3 gerade Anzahl a (rechtsregulär), 4 genau zwei b (rr), 5 System-Codes, 6 Klammerausdrücke, 7 Mini-Adressen 01.10 (rr), 8 endet auf ab (rr), 9 Glal-Sprache (rr), 10 aⁿb²ⁿ, 11 gleich viele a und b |
| `#/sortierer` | Chomsky-Sortierer (Startseite) · `?runde=1` startet sofort eine 10-Karten-Runde · `?alle=1` alle Karten |
| `#/turing` | Turing-Labor (Programm Binärzahl + 1) |
| `#/turing?programm=<id>` | `binaer-plus-1`, `anbncn`, `unaer-plus`, `biber-2`, `biber-3` |
| `#/turing?challenge=1` · `?challenge=2` | Übergangstabelle vervollständigen (1 Binärzahl + 1, 2 unärer Addierer) |
| `#/quiz` | Level-Quiz, Übersicht |
| `#/quiz?welt=A` … `?welt=D` | Quiz je Welt (8–10 Fragen) |
| `#/quiz?ds=1` … `?ds=16` | Mini-Exit-Ticket je Doppelstunde (3 Fragen) |
| `#/gast` | Ausprobieren ohne Anmeldung: je Modul eine Aufgabe (Gastmodus) – auch `BASE_URL/gast` |
| `#/quiz?demo=1` · `#/detektiv?demo=1` · `#/baukasten?demo=1` · `#/minimierer?demo=1` · `#/minimierer?demo=1&modus=unterscheide` · `#/mealy?demo=1` · `#/mealy?demo=1&modus=bugjagd` · `#/mealy?demo=1&modus=frei` · `#/ueberliste?demo=1` | Demo-Aufgaben des Gastmodus (eigene Aufgaben, im Browser geprüft, ohne Punkte) |
| `#/themen` | Themen der Einheit: Welten, Level, Module und je Level Arbeitsblatt, Folien, Merkblatt als PDF (öffentlich, ohne Lösungen; PDFs je Rolle, sonst 🔒) – auch `BASE_URL/themen` |
| `#/material` | Zusätzliches Material als PDF (Arbeitsblätter, Folien, Merkblätter; Lehrkräfte zusätzlich Lösungen und Klausuren, Admin die Originale) – ohne Anmeldung nur die Demo (Level 1: Schüler- und Lehrkraftfassung), zählt nicht für Punkte – auch `BASE_URL/material` |
| `#/themen?teil=niveaus` | Niveau-Übersicht: was ist für Grundkurs (gA), Leistungskurs (eA) und Zusatz (öffentlich) – auch `BASE_URL/niveaus` |
| `#/datenschutz` | Datenschutzhinweise der Plattform mit Link auf die zentrale Erklärung des Portals – auch `BASE_URL/datenschutz` |
| `#/lehrkraft` | Bereich für Lehrkräfte (im Aufbau) – auch `BASE_URL/lehrer` |

**Anmeldung:** Ohne Sitzung sind nur die Übersicht, `#/gast` mit den Demo-Aufgaben (Liste in `js/data/gast.js`), `#/themen` und `#/datenschutz` offen. Jede andere Route leitet still zur Anmeldung beim Portal InfoLabs und danach genau auf diese Route zurück – die QR-Codes bleiben gültig. Level-Quiz, Sprach-Detektiv und Automaten-Baukasten werden auf dem Server geprüft (Lösungen in `../inhalte/`, nie ausgeliefert).

Server-Pfade nach dem Vertrag des Verbunds (ergänzt, ändern keine Hash-Route): `/gast` (Gastmodus), `/themen`, `/niveaus` (Niveau-Übersicht), `/material`, `/lehrer`, `/datenschutz` leiten auf die Hash-Routen; Material-Dateien unter `/material/<schueler|lehrkraft|original>/<datei>` und `/material/zip/<akte>.zip` (Rechte nach Rolle); `/healthz` und `/api/plattform` (Manifest) für das Portal; Anmeldung über das Portal: `/sso/start?ziel=<pfad>` (z. B. `ziel=%2F%23%2Farena`), `/sso/ende` (Rücksprung des Portals), `/abmelden`, `/abmelden/ueberall`.

Baukasten-Challenges (`?level=n` / `?aufgabe=id`):

| n | id | Titel | Stufe |
|---|---|---|---|
| 1 | enthaelt-aa | Enthält „aa“ | Basis |
| 2 | endet-b | Endet auf b | Basis |
| 3 | beginnt-ab | Beginnt mit „ab“ | Basis |
| 4 | gerade-a | Gerade Anzahl a | Basis |
| 5 | mind-zwei-b | Mindestens zwei b | Basis |
| 6 | genau-drei-a | Genau drei a | Basis |
| 7 | barcode-110 | Barcode-Startzeichen 110 | Basis |
| 8 | a-mod-3 | Anzahl a durch 3 teilbar | Standard |
| 9 | endet-ab | Endet auf „ab“ | Standard |
| 10 | komplement-aa | Komplement: kein „aa“ | Standard |
| 11 | kaffee-40 | Kaffeeautomat 40 ct | Standard |
| 12 | anfang-ende | Anfang gleich Ende | Standard |
| 13 | lol | LOL-Erkenner | Standard |
| 14 | gerade-a-endet-b | Gerade Anzahl a UND endet auf b | Profi |
| 15 | konsole | Spielekonsolen-Code | Profi |
| 16 | trainer | Trainerentlassung | Profi |
| 17 | binaer-3 | Binärzahl durch 3 teilbar | Profi |
| 18 | pin-42x00 | PIN-Muster 42x00 | Profi |

Tipp für den Beamer: Knopf „A A“ oben rechts schaltet die Großansicht ein.

## Challenges und Inhalte ergänzen

Alle Inhalte stehen als kommentierte Daten in `js/data/`. **Ausnahme:** Module mit Prüfung auf dem Server (Level-Quiz,
Sprach-Detektiv, Automaten-Baukasten, Minimierer, Mealy-Maschine, Überliste) haben ihre Daten samt Lösungen in `../inhalte/` (nie ausgeliefert,
Format: `docs/AUFGABENFORMAT.md`); `minimierer.js` dort enthält die DEAs fürs Markierungsverfahren (`klassen` =
erwartete Zusammenfassung, `stufe`, `merke`, getestet in `tests/teil2.test.js`).

* `arena.js` – Automaten der Akzeptor-Arena (`id`, `titel`, `kontext`, `level` = Stufen, `automat`, `bedeutung`, `beispiele`).
* `detektiv.js` (in `inhalte/`) – Fälle (4 Optionen, **die erste ist richtig**, jede mit Prüffunktion `pruefe(w)`).
* `baukasten.js` (in `inhalte/`) – Challenges (`id`, `stufe`, `titel`, `aufgabe`, `referenz` = Musterlösung, `beispiele`, `tipp`, optional `pruefe`). Neue Challenges hinten anhängen, damit vorhandene `?level=n`-Links gleich bleiben – oder in QR-Codes `?aufgabe=<id>` verwenden.
* `ueberliste.js` (in `inhalte/`) – Stufen von „Überliste den Automaten“ (Sprache, Kapazität c, Bauplan `bau(c)`, Prädikat, Tipps).
* `rallye.js` – Rallye-Aufgaben (Grammatiktext in Abi-Notation, Zielwort, `modus: 'baum'` für Mehrdeutigkeit).
* `grammatik.js` – Grammatik-Challenges (Σ, Prädikat `pruefe`, `regulaer`, Musterlösung – im Test gegen das Prädikat geprüft). Geprüft wird die Sprache bis `maxLen`; auch Grammatiken mit vielen ε-Regeln werden vollständig ausgewertet (`tests/grammar-nullable.test.js`).
* `sortierer.js` – Sprachkarten (`typ` 3/2/0 + Begründung); `turing.js` – TM-Programme (Übergang `[Folgezustand, geschrieben, L|R|N]`) und Tabellen-Challenges; `quiz.js` – Quizfragen (mc/wf/zuordnung, erste Option richtig).
* `mealy.js` (in `inhalte/`) – Mealy-Automaten mit `beispiele`, `vorhersage`, Bug-Jagd-Fehlern `fehler: [{von, zeichen, ausgabe}]` und Prädikat `pruefe(w)` → Ausgabe; `parallelwelten.js` – NEAs (`raetsel`, `teilmengen`); `keller.js` – Kellerautomaten (Notation `'S0 -> S1 : (#, a) : A#'`, Prädikat, Wörter für Simulator/Tabelle/Rückwärts). Alle in `tests/teil2.test.js` gegen alle Wörter bis Länge 7–8 geprüft.
* `badges.js` – Abzeichen; `worlds.js` – Welten und Level.

Automaten-Format (DEA):
```js
{ alphabet: ['a', 'b'], start: 'S0', accepting: ['S2'], implicitError: true,
  delta: { S0: { a: 'S1', b: 'S0' }, S1: { a: 'S2' }, S2: { 'a, b': 'S2' } } }
```
`'a, b'` fasst Übergänge zusammen; fehlende Übergänge führen in den (nicht gezeichneten) Fehlerzustand. Mehrstellige Zeichen (z. B. Münzen `'10'`, `'20'`) sind erlaubt.

**Bequem:** Automat im freien Modus (`#/baukasten?modus=frei`) zusammenklicken → „Exportieren“ → JSON kopieren → als `referenz` bzw. `automat` einfügen.

Danach immer `npm test` ausführen: Die Tests prüfen alle Beispielwörter, die Detektiv-Optionen und die Referenz-DEAs automatisch.

Neue Module: siehe `ARCHITECTURE.md`.

## Lizenzen

* Schriften: Atkinson Hyperlegible Next/Mono (SIL Open Font License, `assets/fonts/OFL-AtkinsonHyperlegible.txt`).
* `vendor/viz.js`: Viz.js 3 (MIT) mit Graphviz (EPL) und Expat (MIT), unverändert.
