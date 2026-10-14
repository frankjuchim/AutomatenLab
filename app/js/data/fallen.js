// Fallen P1–P10 für Automaten und formale Sprachen (Vertrag InfoLabs §9, Schema wie Algo Quest: Nummer, Kurztitel,
// Erläuterung). Freigegeben von Frank am 14.10.2026; ausführlich mit Beispielen in docs/einheit/FALLEN.md.
// Öffentlich (keine Lösungen): Titel und Kurzfassung für das Fallen-Profil im Lehrkraft-Bereich.
// FALLEN_JE_TYP ordnet jedem Aufgabentyp die Fallen zu, die er übt (src/aufgaben/index.js setzt daraus `fallen`).

export const FALLEN = [
  { p: 'P1', titel: 'Automat unvollständig, Fehlerzustand-Hinweis fehlt', text: 'jeder Zustand für jedes Zeichen aus Σ einen Übergang oder Hinweissatz; vor Komplement/Minimierung vervollständigen; Mealy-Graph vollständig' },
  { p: 'P2', titel: 'Akzeptanz falsch entschieden', text: 'Zustand nach dem letzten Zeichen zählt; NEA/NKA: ein akzeptierender Lauf genügt; NKA: Endzustand nach vollständiger Eingabe, nicht „Keller leer“' },
  { p: 'P3', titel: 'Entwurf nicht an Grenzfällen getestet', text: 'Neuanfang bei „enthält/endet auf“, ε, kürzestes Wort, ein Zeichen zu viel; Grammatik erzeugt zu viel/zu wenig' },
  { p: 'P4', titel: 'Unterscheidbarkeit ohne konkretes Wort begründet', text: 'unterscheidendes Wort mit beiden Verarbeitungen; Äquivalenz über Folgezustände; „mindestens n“ = n paarweise unterscheidbare Präfixe' },
  { p: 'P5', titel: 'Mealy mit Endzuständen oder ohne ε', text: 'keine Endzustände, „e / a“ an der Kante, leere Ausgabe ε (nicht N/–), Σ und Ω, vollständiger Graph' },
  { p: 'P6', titel: 'Regularität ohne Schubfachargument beurteilt', text: 'für jeden DEA: k + 1 Präfixe, dieselbe Fortsetzung, Widerspruch; endlich/modulo/Obergrenze sind regulär; Grammatik nicht regulär ≠ Sprache nicht regulär' },
  { p: 'P7', titel: 'Kellerübergang falsch ausgeführt', text: '(oberstes Kellerzeichen, Eingabe) : Ablage; gelesenes Zeichen wird entfernt, rechtes Zeichen zuerst abgelegt, # wieder ablegen, ε = nichts' },
  { p: 'P8', titel: 'Verarbeitung nicht nach Konvention dokumentiert', text: 'Zustandsfolge S0 –a→ S1 mit Begründung; Kellertabelle mit vier Spalten, erste Zeile S0 | # | – | –, oberstes links, ε-Schritt eigene Zeile, „akzeptiert: ja/nein“' },
  { p: 'P9', titel: 'Grammatik oder Ableitung formal fehlerhaft', text: 'N, T, Startsymbol, P; → in Regeln, ⇒ in Ableitungen, je Schritt eine Regel, am Ende nur Terminale; rechtsregulär nur A → aB | a | ε; Mehrdeutigkeit = zwei Bäume' },
  { p: 'P10', titel: 'Operator verfehlt', text: '„erläutern“ ohne Sachzusammenhang, „begründen“ ohne Begründung, Sprache nicht präzise beschrieben (Bedingung + Menge), Fachbegriffe fehlen' },
];

/**
 * Fallen je Aufgabentyp (Schlüssel: Modul bzw. „modul:art“). Grundlage: Spalte „Module“ und „Üben/erkennen“ in
 * docs/einheit/FALLEN.md. Das Level-Quiz bekommt seine Fallen später je Frage; die Turingmaschine hat bewusst keine
 * Falle (Ergänzung über den KC-Kern hinaus, siehe „Verworfen“).
 */
export const FALLEN_JE_TYP = {
  baukasten: ['P1', 'P3'],
  detektiv: ['P3', 'P10'],
  minimierer: ['P4', 'P1'],
  'mealy:vorhersage': ['P5'],
  'mealy:bugjagd': ['P5', 'P1'],
  ueberliste: ['P6'],
  'ueberliste:bonus': ['P6'],
  'parallelwelten:raetsel': ['P2'],
  'parallelwelten:teilmengen': ['P2'],
  'keller:tabelle': ['P7', 'P8', 'P2'],
  'keller:rueckwaerts': ['P7', 'P8'],
  rallye: ['P9'],
  grammatik: ['P9', 'P3'],
};
