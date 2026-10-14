# AutomatenLab – Architektur für Modul-Autoren

Single-Page-App ohne Build-Schritt: `index.html` + ES-Module (Vanilla JS) + ein Stylesheet. Ausgeliefert vom Server in `../src` (Express, Regeln wie `nginx.conf`); der Server liest `js/data/worlds.js` und `js/modules/manifest.js` für Manifest und Themenseite mit – diese Dateien bleiben DOM-frei.
Keine Laufzeit-Abhängigkeiten aus dem Netz (Schulnetz-Proxy, Datenschutz). Graphviz läuft lokal als WASM (`vendor/viz.js`).

```
app/
  index.html               lädt css/app.css und js/main.js
  css/app.css              Design-Tokens (:root) + Komponenten-/Modulstile; css/modules-teil3.css: Überliste, Rallye, Grammatik, Sortierer, Turing, Quiz; css/modules-teil2.css: Minimierer, Mealy, Parallelwelten, Keller
  js/main.js               Kopfzeile, Hash-Routing, Modul-Lebenszyklus, „bald verfügbar“, 404
  js/core/                 dom.js (h(), clear(), quote() …), router.js, progress.js (localStorage)
  js/engine/               reine Logik, DOM-frei, in Node testbar (tokenize, dfa, nfa, mealy, pda, grammar)
  js/components/           GraphView, WordTape, StackView, RunPlayer, MealyPlayer, DfaEditor, Dialog, Toast, graph-model (DOT)
  js/data/                 Inhalte (Automaten, Fälle, Challenges, Welten, Abzeichen) – kommentiert
  js/modules/              manifest.js (Register) + je Route eine Datei; home.js, komponenten.js (Galerie)
  tests/                   node --test: engine, data (alle Inhalte), graph (DOT + viz.js)
  vendor/viz.js            @viz-js/viz 3.x (ESM, WASM eingebettet)
```

## 1. Ein Modul ergänzen (z. B. `#/minimierer`)

1. Datei `js/modules/minimierer.js` anlegen:
   ```js
   import { h, clear } from '../core/dom.js';
   export default {
     title: 'Minimierer',
     mount(el, ctx) {              // el = Inhaltsbereich unter der Modulüberschrift
       ctx.setSubtitle('…');       // Zeile unter dem Titel
       clear(el, h('p', null, 'Hallo'));
       return () => { /* Aufräumen: Timer, window-Listener */ };
     },
   };
   ```
2. In `js/modules/manifest.js` beim Eintrag `load: () => import('./minimierer.js')` setzen. Fertig – Kachel, Level-Karte und Route aktualisieren sich automatisch.
3. Inhalte nach `js/data/<modul>.js` (mit Prüfung auf dem Server: `inhalte/<modul>.js`, siehe `docs/AUFGABENFORMAT.md`), Tests nach `tests/data.test.js` (Beispielwörter gegen die Engine prüfen!).

**Lebenszyklus:** Jede Änderung des Hashs (auch nur der Parameter) baut das Modul neu auf: vorherige Cleanup-Funktion → `mount` neu. Zustand, der einen Wechsel überleben soll, gehört in `progress.setDraft()`.

**`ctx`:** `params` (URLSearchParams), `route`, `meta` (Manifest-Eintrag), `link(route, params)` → `'#/route?…'`, `navigate(route, params, {replace})`, `toast(text, {type})`, `progress`, `setSubtitle(text)`.

**Deep-Links:** Parameter frei wählbar, aber Konvention: `?level=n` = n-te Challenge (1-basiert), `?stufe=1|2|3` = Schwierigkeitsstufe, `?fall=n`, `?modus=frei`. Ungültige Parameter → Übersicht des Moduls.

## 2. Engine-API (`js/engine/`, Sammel-Export `index.js`)

Alle Automaten werden als schlichte Objekte notiert und mit `dfa()/nfa()/mealy()/pda()` normalisiert (wirft verständliche deutsche Fehlermeldungen). Schlüssel wie `'a, b'` fassen Symbole zusammen. Wörter dürfen Text (`'10 20'`, `'abba'`, `'ε'`/`''`) oder Symbol-Arrays sein; Mehrzeichen-Symbole per Longest-Match.

| Datei | Wichtige Exporte |
|---|---|
| tokenize.js | `EPS`, `isEpsilon`, `tokenize(word, Σ)` → `{ok, tokens \| message}`, `wordToString(tokens, Σ)`, `enumerateWords(Σ, maxLen)` (Generator, kürzeste zuerst), `makeRng(seed)` (`.int/.pick/.shuffle`) |
| dfa.js | `dfa(spec)`, `runDFA(A, w)` → `{ok, accepted, tokens, path, steps, deadAt}` (`null` = Fehlerzustand), `runToText` („S0 –a→ S1“), `completeness`, `completeDFA`, `complementDFA`, `equivalent(A,B)` → `{equivalent, word, counterexample, acceptedByA, acceptedByB}` (Produkt-BFS, kürzestes Gegenbeispiel), `minimizeDFA(A)` → `{dfa, pairs, steps, rounds, classes, removedUnreachable, addedErrorState}` (Markierungsverfahren mit Protokoll), `randomWord(A, {length, wantAccept, rng})`, `shortestAccepted`, `fromTable`, `renameStates`, `minimalWithImplicitError`, `toJSON` |
| nfa.js | `nfa(spec)` (Ziele als Array, `'ε'`/`'eps'`-Kanten, optional `starts`), `epsilonClosure(N, set)`, `stepSet`, `moveSet` (ohne ε-Abschluss), `runNFA(N, w)` → `{accepted, sets}` (Menge aktiver Zustände je Schritt), `subsetConstruction(N)` → `{dfa, table}`, `setName` |
| mealy.js | `mealy({inputAlphabet, outputAlphabet, start, delta: {S0: {a: ['S1','A']}}})` (auch `'S1 / A'`), `runMealy` → `{output, steps, stuck}`, `outputLabel('')` = `'ε'`, `mealyCompleteness`, `mealyEquivalent(A, B)` → `{equivalent, word, outA, outB}` (kürzestes Unterscheidungswort) |
| pda.js | `pda({inputAlphabet, stackAlphabet, start, accepting, transitions: ['S0 -> S0 : (#, a) : A#', …]})`, `runPDA(P, w, {maxConfigs})` → `{accepted, run, table, exhausted, longest, longestTable}` (BFS mit Schranke; Tabelle im Abi-Format `{zustand, keller, oberstes, eingabe}`), `transitionLabel`, `successors`, `isDeterministic`, `initialConfig`, `searchFrom(P, tokens, config)` (BFS ab Zwischenkonfiguration), `matchesConfigSequence(P, tokens, [{state, stack}])` (Rückwärts-Aufgaben), `runToTable`; Eingabezeichen „)“ im Textformat erlaubt |
| markierung.js | Markierungsverfahren als Spiel: `markierungsTabelle(A)` (erreichbar + vervollständigt, Paare), `folgepaare`, `pruefeRunde(T, vorher, spieler, runde)` → `{ok, falsch, fehlend, vorgezogen, fertig}`, `loesung`, `laufAb`, `unterscheidendesWort` |
| grammar.js | `parseGrammar(text)` (`S → aSb \| ab`, `->`, `ε`/`eps`, Nichtterminale `A`, `A1`, `<Name>`, optional `N = {…}`, `T = {la, le}`) → `{ok, errors, rules, byLhs, start, terminals, nonterminals}`, `derive(g, w)` → `{member, derivation}` (Linksableitung mit Pruning über Terminale + nicht löschbare Nichtterminale; löschbare („nullable“) Nichtterminale per `nullableBudget(g, n)` beweisbar verlustfrei beschränkt; `null` = Knotenschranke), `derivationToString` („S ⇒ aSb ⇒ …“), `derivationToTree`, `shortestWords`, `randomWord`, `isRightRegular` → `{regular, violations}`, `rightRegularToNFA`, `languageUpTo(g, maxLen)` → `{words, complete}` (alle Wörter bis Länge n), `derive(g, w, {from})` (ab einer Satzform – Sackgassen-Erkennung) |
| turing.js | `tm(spec)` (`delta: {S0: {'0': ['S1','1','R']}}`, Blank `□`), `runTM(T, w, {maxSteps})` → `{run:[{config,t}], halted, accepted, output}`, `stepTM`, `tmToGraph` (Kanten „gelesen / geschrieben, Bewegung“), `tmTable`, `countOnes`, `tapeContent` |

Notation verbindlich nach PLAN.md Abschnitt 1 (Endzustände = `accepting`/F, Kellerautomat: rechtes Zeichen zuerst abgelegt, Akzeptanz über Endzustand nach vollständiger Eingabe).

## 3. Komponenten-API (`js/components/`)

* **GraphView** `new GraphView(container, {caption=true, label})` · `await gv.render(automat | graphModell, {label})` · `gv.highlight({active: 'S1' | ['S0','S1'], edge: ['S0','S1'] | [[…],[…]], visited: [...], error: bool})` · `gv.clearHighlight()`. Zeichnet DEA, NEA, Mealy („a / A“), NKA (mehrzeilig „(#, a) : A#“) im Abi-Stil (Startpfeil „Start“, Doppelkreis, `rankdir=LR`). Hinweis „Alle nicht eingezeichneten Übergänge …“ erscheint automatisch, wenn `implicitError` gesetzt ist UND Übergänge fehlen. Styling ausschließlich per CSS-Klassen (`.state`, `.is-accepting`, `.trans`, `.is-active`, `.is-visited`).
* **graph-model.js** (DOM-frei): `toGraph(A)`, `graphToDot(g, {prefix})`, `exportDot(g)` (sauberer DOT-Text zum Kopieren).
* **WordTape** `new WordTape(container, {size: 'm'|'l'})` · `set(tokens)` · `setHead(k)` (k gelesene Symbole; −1 = kein Kopf) · `setVerdict('accept'|'reject'|null)` · `flash('good'|'bad')`.
* **StackView** `new StackView(container)` · `set(['A','#'])` (Index 0 = oben; animiert Ablegen/Entfernen) · `.text` → `'A#'`.
* **MealyPlayer** (`mealy-player.js`) wie RunPlayer, zusätzlich Ausgabeband: `new MealyPlayer(container, {automat, graph?, meanings})` · `load(word)` · `play/pause/next/prev/goto/toEnd` · `setAutomat(M)`.
* **GraphView-Option `minScale`** (z. B. 0.75): dichte Graphen werden nicht unlesbar klein, sondern im Rahmen seitlich scrollbar.
* **RunPlayer** (DEA-Lauf als Animation) `new RunPlayer(container, {automat, meanings, graph?: GraphView, speed})` · `await rp.ready` · `rp.load(word)` · `play/pause/next/prev/goto/toEnd` · `setAutomat(A)`. Zeigt Band, Steuerung, Erklärsatz und Zustandsfolge „S0 –a→ S1“. Vorlage für NEA-/NKA-Player.
* **DerivationTree** `new DerivationTree(container)` · `set(root, {next})` zeichnet einen (auch unvollständigen) Ableitungsbaum als SVG; `svgClone()`. **TmTape** `new TmTape(container, {cells})` · `set(config)` Band-Ausschnitt um den Kopf (passt sich der Breite an).
* **DfaEditor** Übergangstabelle mit Dropdowns: `new DfaEditor(container, {alphabet, value, onChange})` · `toDFA()` · `toJSON()` · `load(json)` · `setAlphabet()` · `missing()`.
* **openDialog({title, body, onClose})** → `{el, close}` (natives `<dialog>`, Esc/Fokus zurück). **toast(text, {type: 'success'|'error'|'info'|'badge', title, timeout})**.
* **progress** (`js/core/progress.js`): `solve(modul, id, punkte)` → `{first}` (Punkte nur beim ersten Lösen), `isSolved`, `solvedIds`, `addPoints`, `best/setBest`, `award(badgeId)` (Abzeichen in `js/data/badges.js` eintragen), `getDraft/setDraft`, `pref/setPref`, `reset`, `subscribe`. Alles in `localStorage` unter `automatenlab.v1`, in try/catch – die App läuft auch ohne Speicher.
* Entwickler-Galerie: `#/komponenten` (nicht verlinkt) zeigt alle Komponenten mit Beispieldaten (NKA + Abi-Tabelle, Mealy, NEA).

## 4. Design-Tokens (`css/app.css`, `:root`)

| Token | Wert | Verwendung |
|---|---|---|
| `--teal` / `--teal-deep` / `--teal-soft` / `--teal-mist` | #0E6455 / #0A4B40 / #D9ECE6 / #EDF6F3 | Schulfarbe: Kopfzeile, Primärknöpfe, „akzeptiert“, besuchte Zustände |
| `--ocker` / `--ocker-fill` / `--ocker-soft` | #B26A0F / #EFAE4A / #FBEBD0 | aktiver Zustand, aktive Kante, Lesekopf, Rekorde (Schrift dunkel auf `--ocker-fill`) |
| `--reject` / `--reject-soft` | #A8322B / #F9E3E0 | „abgelehnt“, Fehler, Gegenbeispiele |
| `--ink` / `--ink-2` / `--line` | #15302B / #4B625D / #C3D4CF | Text, Graph-Linien / Nebentext / Rahmen |
| `--paper` / `--grid` / `--surface` | #F3F8F6 / #E0EBE8 / #FFF | Karopapier-Hintergrund / Karolinien / Flächen |
| `--welt-a … --welt-d`, `--welt` | #0E6455 / #B26A0F / #3D5A99 / #7A3E65 | Weltfarben (wie `WELT_FARBEN` in `src/inhalte.js`); `data-welt="A"` … setzt `--welt` für Kachel-Oberkante, Weltname, Gruppenpunkt |
| `--font` / `--mono` | Atkinson Hyperlegible Next / Mono (lokal) | Fließtext / Wörter, Symbole, Bänder |
| `--fs-s … --fs-hero`, `--gap`, `--pad`, `--r-s/m/l`, `--touch` (44 px), `--focus` | | Typo-Skala, Abstände, Radien, Mindest-Touchgröße, Fokusring |

Gestaltungsprinzipien: Karopapier als Grund, darauf gezeichnete Automaten; **Ocker heißt immer „hier ist der Automat gerade“**; gestrichelt = noch nicht gebaut (Level-Karte, „bald verfügbar“-Kacheln). Fertige Module haben eine Oberkante in ihrer Weltfarbe. Großansicht (Knopf „A A“, Klasse `html.is-gross`) für den Beamer. `prefers-reduced-motion` schaltet Animationen ab. Kleine Effekte erzählen immer „Automat“: animierter DEA im Kopf der Startseite (`components/hero-automat.js`, läuft dreimal, Knopf Anhalten/Nochmal), pulsierender Ring am gewählten Level, Doppelring-Puls bei „Richtig“ (`.notice-success`), aufspringender Doppelkreis in Abzeichen-Meldungen.

## 5. Konventionen

* Sprache: Deutsch, Du-Ansprache, Fachbegriffe nach KC/PLAN.md (Endzustand, Fehlerzustand, Eingabealphabet Σ, Zustandsfolge, Kellerspeicher, Ableitung ⇒). Keine Emojis in der UI.
* Zustandsnamen S0, S1, …; Fehlerzustand implizit mit Hinweis (nicht „E“ für Endzustände).
* Rückmeldungen konkret: Gegenbeispiel-Wort + was der Automat tut + was richtig wäre.
* Barrierefreiheit: echte `<button>`/`<a>`, `aria-live` für Rückmeldungen, sichtbarer Fokus, Touch ≥ 44 px, Tastaturkürzel nur ergänzend.
* Keine externen Requests, keine Cookies, keine Analytics. CSP in `nginx.conf` erzwingt das (`default-src 'self'`).
* Tests: `npm test` (Node ≥ 20). Neue Daten immer mit Beispielwörtern versehen – `tests/data.test.js` prüft sie gegen die Engine.
* Browser-Tests: `qa/qa.mjs` (im Repository-Wurzelordner) (Playwright; Routen, Interaktionen, Konsolenfehler, Screenshots in 3 Größen), `qa-routes.mjs` (alle Deep-Links aus der README, 1366×768 und 820×1180), `qa-final.mjs` (Grammatik-ε-Fall, Startseiten-Fortschritt).
* `tests/konsistenz.test.js` prüft Manifest ↔ PLAN.md (Level-Zuordnung) und README-Routen/IDs ↔ Daten.
