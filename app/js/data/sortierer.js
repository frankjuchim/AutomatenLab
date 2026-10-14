// Chomsky-Sortierer (#/sortierer): die drei Fächer (öffentlich). Die Sprachkarten mit Fach und Begründung liegen nur
// auf dem Server (inhalte/sortierer.js, Vertrag InfoLabs §9); der Server erzeugt die Runden (src/training.js).
// Fächer: 3 = regulär (DEA reicht), 2 = kontextfrei (Kellerautomat nötig), 0 = mehr nötig (Turingmaschine).

export const FAECHER = {
  3: { kurz: 'Typ 3', name: 'DEA reicht', text: 'regulär – endlicher Automat, rechtsreguläre Grammatik' },
  2: { kurz: 'Typ 2', name: 'Kellerautomat nötig', text: 'kontextfrei – NKA, kontextfreie Grammatik' },
  0: { kurz: 'Typ 0/1', name: 'Mehr nötig', text: 'Turingmaschine (bzw. linear beschränkter Automat)' },
};
