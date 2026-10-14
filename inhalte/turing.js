// Turing-Labor – Challenges „Übergangstabelle vervollständigen“ (#/turing?challenge=n). Liegt in inhalte/ (nur Server,
// Vertrag InfoLabs §9): Welche Regel fehlt und mit welchen Eingaben geprüft wird, kennt nur der Server; die App bekommt
// die unvollständige Tabelle. Die Programme selbst (Simulator) stehen öffentlich in app/js/data/turing.js.
//   id, titel, programm (id aus TURING_PROGRAMME), fehlt { from, read }, aufgabe, tests, stufe (Punkte 10/20/30)

export const TURING_CHALLENGES = [
  {
    id: 'binaer-luecke', titel: 'Binärzahl + 1: die fehlende Regel', programm: 'binaer-plus-1',
    fehlt: { from: 'S1', read: '1' },
    aufgabe: 'In der Übergangstabelle von „Binärzahl + 1“ fehlt die Regel für S1, wenn eine 1 gelesen wird. Was muss die Maschine schreiben, wohin gehen, und in welchen Zustand wechseln? Denk an den Übertrag.',
    tests: ['1011', '111', '1', '1101'],
    stufe: 2,
  },
  {
    id: 'unaer-luecke', titel: 'Unärer Addierer: die fehlende Regel', programm: 'unaer-plus',
    fehlt: { from: 'S0', read: '+' },
    aufgabe: 'Beim unären Addierer fehlt die Regel für S0, wenn das + gelesen wird. Die Idee: Das + wird zur 1, danach läuft die Maschine ans Ende und löscht dort eine 1.',
    tests: ['111+11', '1+1', '+1'],
    stufe: 2,
  },
];
