// Chomsky-Sortierer (#/sortierer): Sprachkarten den Fächern zuordnen (DS14). Liegt in inhalte/ (nur Server, Vertrag
// InfoLabs §9): Fach und Begründung einer Karte erfährt die App erst nach der Antwort (POST /api/training/runde/:id/antwort).
// Die Fächer (öffentliche Beschriftung) stehen in app/js/data/sortierer.js.
//   typ   3 = regulär (DEA reicht; rechtsreguläre Grammatik)
//         2 = kontextfrei, aber nicht regulär (Kellerautomat nötig)
//         0 = weder regulär noch kontextfrei (mehr nötig: Turingmaschine bzw. linear beschränkter Automat)
//   warum eine Zeile Begründung (fachlich korrekt, wird nach der Antwort gezeigt)
// Hinweis: „möglichst speziell“ – eine endliche Sprache ist immer regulär, auch wenn sie wie aⁿbⁿ aussieht.

export const SORTIERER_KARTEN = [
  // ── Typ 3: regulär ──
  { id: 'endet-ab', text: 'Wörter über {a, b}, die auf „ab“ enden', typ: 3, warum: 'Der Automat merkt sich nur die letzten zwei Zeichen – endlich viele Zustände reichen.' },
  { id: 'gerade-a', text: 'Wörter über {a, b} mit gerader Anzahl a', typ: 3, warum: 'Zählen modulo 2: zwei Zustände (gerade/ungerade) genügen.' },
  { id: 'lol', text: 'Wörter, die das Teilwort „LOL“ enthalten', typ: 3, warum: 'Teilwort-Erkennung braucht nur Zustände für „wie viel von LOL habe ich schon gesehen“.' },
  { id: 'binaer-3', text: 'Binärzahlen, die durch 3 teilbar sind', typ: 3, warum: 'Rest modulo 3 lässt sich mit drei Zuständen mitführen (Rest · 2 + Ziffer).' },
  { id: 'code-4', text: 'Codes mit genau 4 Zeichen über {a, b, c}', typ: 3, warum: 'Endliche Sprache – jede endliche Sprache ist regulär (einfach alle Wörter abzählen).' },
  { id: 'hostname', text: 'Hostnamen nach festen Regeln: Buchstaben, dann Punkt, dann genau „de“ oder „eu“', typ: 3, warum: 'Feste Reihenfolge von Mustern ohne Zählen oder Verschachtelung – ein DEA reicht.' },
  { id: 'anbm', text: 'aⁿbᵐ (n, m ≥ 0): erst beliebig viele a, dann beliebig viele b', typ: 3, warum: 'Es wird nicht verglichen, nur die Reihenfolge geprüft: a* b* ist regulär.' },
  { id: 'pin', text: 'PIN-Muster: beliebige Ziffern, dann 42, eine Ziffer, dann 00 am Ende', typ: 3, warum: 'Muster-Erkennung am Wortende, kein unbeschränktes Zählen – regulär.' },
  { id: 'kaffee', text: 'Münzfolgen aus 10 und 20 ct, die genau 40 ct ergeben', typ: 3, warum: 'Der Betrag ist nach oben beschränkt (40 ct) – beschränktes Zählen schafft ein DEA.' },
  { id: 'hoechstens-drei-b', text: 'Wörter über {a, b} mit höchstens drei b', typ: 3, warum: 'Zählen bis zu einer festen Grenze: Zustände für 0, 1, 2, 3 b und einen Fehlerzustand.' },
  { id: 'gerade-laenge', text: 'Wörter gerader Länge', typ: 3, warum: 'Länge modulo 2 – zwei Zustände.' },
  { id: 'palindrom-5', text: 'Palindrome über {0, 1} mit höchstens 5 Zeichen', typ: 3, warum: 'Endlich viele Wörter – eine endliche Sprache ist immer regulär, auch wenn sie „spiegelt“.' },
  { id: 'anbn-3', text: 'aⁿbⁿ mit 1 ≤ n ≤ 3', typ: 3, warum: 'Nur drei Wörter (ab, aabb, aaabbb) – endlich, also regulär. Der Vergleich ist beschränkt.' },
  { id: 'durch-5', text: 'Dezimalzahlen, die durch 5 teilbar sind', typ: 3, warum: 'Letzte Ziffer 0 oder 5 – nur das Ende zählt.' },
  { id: 'email', text: 'Adressen der Form vorname.nachname@XB.xx (Namen aus Kleinbuchstaben)', typ: 3, warum: 'Feste Bausteine in fester Reihenfolge, nichts wird verglichen oder gezählt – regulär.' },
  { id: 'smiley', text: 'Texte mit mindestens vier Smileys „:)“', typ: 3, warum: 'Zählen bis 4 reicht, danach „genug“ – beschränktes Zählen.' },
  // ── Typ 2: kontextfrei, nicht regulär ──
  { id: 'anbn', text: 'aⁿbⁿ (n ≥ 1)', typ: 2, warum: 'Unbeschränktes Zählen: a auf den Keller, b entfernt sie. Kein DEA (Schubfachprinzip).' },
  { id: 'klammern', text: 'Korrekt geklammerte Terme', typ: 2, warum: 'Beliebige Verschachtelungstiefe – der Keller merkt sich offene Klammern. Kein DEA.' },
  { id: 'palindrome', text: 'Alle Palindrome über {0, 1}', typ: 2, warum: 'Erste Hälfte auf den Keller, zweite Hälfte vergleichen (NKA rät die Mitte). Nicht regulär: Ein DEA müsste sich die beliebig lange erste Hälfte merken (Schubfachprinzip).' },
  { id: 'gleich-viele', text: 'Wörter über {a, b} mit gleich vielen a wie b', typ: 2, warum: 'Die Bilanz kann beliebig groß werden – ein Keller zählt sie, ein DEA nicht.' },
  { id: 'anb2n', text: 'aⁿb²ⁿ (n ≥ 1)', typ: 2, warum: 'Pro a werden zwei Kellerzeichen abgelegt, jedes b entfernt eines – unbeschränkt, also Keller nötig.' },
  { id: 'wcwr', text: 'w c wᴿ: ein Wort, ein c, dann das Wort rückwärts', typ: 2, warum: 'Deterministischer Kellerautomat: w ablegen, bei c umschalten, wᴿ vergleichen. Nicht regulär.' },
  { id: 'kommentare', text: 'Korrekt verschachtelte Kommentare /* … /* … */ … */', typ: 2, warum: 'Verschachtelung beliebiger Tiefe – wie Klammern: kontextfrei, nicht regulär.' },
  { id: 'terme', text: 'Arithmetische Terme mit +, * und beliebig tief geklammerten Teiltermen', typ: 2, warum: 'Klammern müssen passen – Verschachtelung braucht den Keller.' },
  { id: 'begin-end', text: 'Programme aus verschachtelten begin … end-Blöcken', typ: 2, warum: 'Jedes begin braucht sein end – beliebig tief verschachtelt: kontextfrei.' },
  { id: 'frosch', text: 'Frosch-Befehle mit verschachtelten Wiederholungen n(…)', typ: 2, warum: 'Die Klammern der Wiederholungen können beliebig tief verschachtelt sein – Keller nötig.' },
  { id: 'aibj-ungleich', text: 'aⁱbʲ mit i ≠ j', typ: 2, warum: 'Ein NKA rät, ob i < j oder i > j, und zählt mit dem Keller. Nicht regulär (sonst wäre auch aⁿbⁿ regulär).' },
  // ── Typ 0/1: mehr nötig ──
  { id: 'anbncn', text: 'aⁿbⁿcⁿ (n ≥ 1)', typ: 0, warum: 'Ein Keller kann nur einmal „abgearbeitet“ werden – zwei Vergleiche gleichzeitig schafft er nicht. Eine Turingmaschine markiert je ein a, b, c.' },
  { id: 'ww', text: 'ww: ein Wort, direkt gefolgt von sich selbst (z. B. abab)', typ: 0, warum: 'Der Keller gibt das Wort nur rückwärts heraus (w wᴿ ginge) – ww braucht beliebigen Zugriff: Turingmaschine.' },
  { id: 'anbncndn', text: 'aⁿbⁿcⁿdⁿ', typ: 0, warum: 'Vier Blöcke gleicher Länge – mehr Vergleiche, als ein einzelner Keller leisten kann.' },
  { id: 'quadrat', text: 'aⁿ², also Wörter aus a, deren Länge eine Quadratzahl ist', typ: 0, warum: 'Quadratzahlen lassen sich weder mit endlich vielen Zuständen noch mit einem Keller erkennen – Turingmaschine.' },
  { id: 'primzahl', text: 'aᵖ für Primzahlen p', typ: 0, warum: 'Primzahltest braucht Rechnen auf dem Band – weder regulär noch kontextfrei.' },
  { id: 'anbmcndm', text: 'aⁿbᵐcⁿdᵐ: zwei gekreuzte Vergleiche', typ: 0, warum: 'Die Vergleiche kreuzen sich (n … n und m … m dazwischen) – ein Keller kann nur verschachtelt vergleichen.' },
  { id: 'zweierpotenz', text: 'Wörter aus a, deren Länge eine Zweierpotenz ist', typ: 0, warum: 'Wiederholtes Halbieren braucht ein beschreibbares Band – Turingmaschine.' },
];
