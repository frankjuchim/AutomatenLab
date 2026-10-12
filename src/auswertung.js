'use strict';
// Auswertungen: Kursübersicht für das Portal (Vertrag §6). Bis der Lernstand auf dem Server liegt (Phase 4), sind
// Punkte, gelöste Aufgaben und Anteile 0 – das Format ist schon das endgültige.

function createAuswertung(ctx, { konten, katalog }) {
  const iso = () => new Date(ctx.now()).toISOString();

  /** Kennzahlen eines Kurses: je Schüler Punkte, gelöste Aufgaben, Anteil, zuletzt aktiv; je Welt der Anteil. */
  function kursUebersicht(kurs) {
    return {
      kurs: kurs.id,
      stand: iso(),
      schueler: konten.mitglieder(kurs.id).map((m) => ({ sub: m.sub, punkte: 0, geloest: 0, anteil: 0, zuletzt: m.last_active_at })),
      welten: katalog.welten.map((w) => ({ nr: w.nr, kennung: w.kennung, titel: w.titel, anteil: 0 }))
    };
  }

  return { kursUebersicht };
}

module.exports = { createAuswertung };
