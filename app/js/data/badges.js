// Abzeichen. Vergeben werden sie von den Modulen per progress.award('<id>').
// Neues Abzeichen: hier eintragen und im Modul an passender Stelle award() aufrufen.
//   id     eindeutig, Präfix = Modul-Route
//   titel  kurzer Name (wird im Toast und auf der Übersicht gezeigt)
//   text   wofür es das Abzeichen gibt

export const BADGES = [
  { id: 'arena-erste-runde', titel: 'Erste Runde', text: 'Eine Runde in der Akzeptor-Arena gespielt.' },
  { id: 'arena-serie-10', titel: 'Zehnerserie', text: 'Zehn Entscheidungen in Folge richtig.' },
  { id: 'arena-100', titel: 'Hunderter', text: 'Mindestens 100 Punkte in einer Arena-Runde.' },
  { id: 'arena-profi', titel: 'Arena-Profi', text: 'Mindestens 120 Punkte in Stufe 3.' },
  { id: 'detektiv-erster-fall', titel: 'Fall gelöst', text: 'Den ersten Fall im Sprach-Detektiv gelöst.' },
  { id: 'detektiv-spuernase', titel: 'Spürnase', text: 'Fünf Fälle jeweils im ersten Versuch gelöst.' },
  { id: 'detektiv-alle', titel: 'Meisterdetektiv', text: 'Alle Fälle im Sprach-Detektiv gelöst.' },
  { id: 'baukasten-erster', titel: 'Erster Bauplan', text: 'Die erste Baukasten-Challenge gelöst.' },
  { id: 'baukasten-stufe-1', titel: 'Basis sicher', text: 'Alle Challenges der Stufe Basis gelöst.' },
  { id: 'baukasten-stufe-2', titel: 'Standard sicher', text: 'Alle Challenges der Stufe Standard gelöst.' },
  { id: 'baukasten-stufe-3', titel: 'Profi', text: 'Alle Challenges der Stufe Profi gelöst.' },
  { id: 'baukasten-volltreffer', titel: 'Volltreffer', text: 'Eine Profi-Challenge im ersten Versuch gelöst.' },
  // Teil 2: Minimierer, Mealy, Parallelwelten, Keller-Labor
  { id: 'minimierer-erste', titel: 'Weniger ist mehr', text: 'Den ersten Automaten mit dem Markierungsverfahren minimiert.' },
  { id: 'minimierer-alle', titel: 'Minimalist', text: 'Alle Minimierer-Aufgaben gelöst.' },
  { id: 'minimierer-unterscheider', titel: 'Unterscheider', text: 'Zehn Paare im Spiel „Unterscheide!“ richtig beurteilt.' },
  { id: 'mealy-hellseher', titel: 'Hellseher', text: 'Alle Ausgaben eines Mealy-Automaten richtig vorhergesagt.' },
  { id: 'mealy-bugjaeger', titel: 'Bug-Jäger', text: 'Einen fehlerhaften Mealy-Automaten repariert.' },
  { id: 'mealy-alle-bugs', titel: 'Kammerjäger', text: 'Alle fehlerhaften Mealy-Automaten repariert.' },
  { id: 'parallelwelten-figuren', titel: 'Figurenzähler', text: 'Fünf Rätsel „Wo stehen die Figuren?“ gelöst.' },
  { id: 'parallelwelten-teilmengen', titel: 'Teilmengen-Profi', text: 'Eine Teilmengenkonstruktion vollständig ausgefüllt.' },
  { id: 'keller-tabelle', titel: 'Protokollant', text: 'Die erste Verarbeitungstabelle im Abi-Format richtig ausgefüllt.' },
  { id: 'keller-rueckwaerts', titel: 'Spurenleser', text: 'Ein Eingabewort aus der Zustands- und Kellerfolge bestimmt.' },
  { id: 'keller-profi', titel: 'Keller-Profi', text: 'Zehn Tabellen- oder Rückwärts-Aufgaben im Keller-Labor gelöst.' },
  { id: 'ueberliste-erster', titel: 'Überlistet', text: 'Zum ersten Mal einen Automaten bei einem Fehler ertappt.' },
  { id: 'ueberliste-ohne-tipp', titel: 'Schubfach-Profi', text: 'Eine höhere Stufe von „Überliste den Automaten“ ohne Tipp geknackt.' },
  { id: 'ueberliste-alle', titel: 'Grenzgänger', text: 'Alle Automaten in „Überliste den Automaten“ überlistet.' },
  { id: 'rallye-erste', titel: 'Erste Ableitung', text: 'Die erste Ableitungs-Rallye ins Ziel gebracht.' },
  { id: 'rallye-mehrdeutig', titel: 'Doppelbaum', text: 'Die Mehrdeutigkeit einer Grammatik mit zwei Ableitungsbäumen gezeigt.' },
  { id: 'rallye-alle', titel: 'Rallye-Champion', text: 'Alle Aufgaben der Ableitungs-Rallye gelöst.' },
  { id: 'grammatik-erste', titel: 'Grammatik-Designer', text: 'Die erste Grammatik-Challenge gelöst.' },
  { id: 'grammatik-alle', titel: 'Sprachschöpfer', text: 'Alle Grammatik-Challenges gelöst.' },
  { id: 'sortierer-erste', titel: 'Kartograf', text: 'Eine Runde im Chomsky-Sortierer gespielt.' },
  { id: 'sortierer-perfekt', titel: 'Chomsky-Kenner', text: 'Zehn von zehn Sprachkarten richtig einsortiert.' },
  { id: 'turing-regel', titel: 'Maschinist', text: 'Eine Turingmaschine durch die fehlende Regel vervollständigt.' },
  { id: 'quiz-erstes', titel: 'Exit-Ticket', text: 'Das erste Level-Quiz abgeschlossen.' },
  { id: 'quiz-welt-perfekt', titel: 'Welt gemeistert', text: 'Ein Welt-Quiz mit 100 % abgeschlossen.' },
  // Boss-Kämpfe (PR 9): besiegt ab 50 % der möglichen Punkte
  { id: 'boss-A', titel: 'Wächter besiegt', text: 'Den Boss der Welt A (endliche Automaten) besiegt.' },
  { id: 'boss-B', titel: 'Golem besiegt', text: 'Den Boss der Welt B (Grenzen und Keller) besiegt.' },
  { id: 'boss-C', titel: 'Sphinx besiegt', text: 'Den Boss der Welt C (formale Sprachen) besiegt.' },
  { id: 'boss-makellos', titel: 'Makellos', text: 'Einen Boss-Kampf mit allen möglichen Punkten beendet.' },
  // Klassen-Challenges (PR 11): nach dem Ende vergeben, nur mit Wert > 0
  { id: 'challenge-sieg', titel: 'Challenge gewonnen', text: 'Platz 1 in einer Klassen-Challenge.' },
  { id: 'challenge-podium', titel: 'Auf dem Podest', text: 'Platz 2 oder 3 in einer Klassen-Challenge.' },
  { id: 'challenge-team', titel: 'Teamsieg', text: 'Mit deinem Team eine Klassen-Challenge gewonnen.' },
];
