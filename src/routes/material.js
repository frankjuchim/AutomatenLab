'use strict';
// Zusätzliche Materialien zum Herunterladen (src/material.js): Übersicht je Konto und Dateien mit Rechteprüfung.
//   GET /api/material                 Übersicht (angemeldet; Schüler nur mit freigeschaltetem Kurs)
//   GET /material/<stufe>/<datei>     schueler | lehrkraft | original – nur verzeichnete Dateien
//   GET /material/zip/<akte>.zip      Originale einer Akte als ZIP (nur Admin)

const TEXT = {
  401: 'Bitte melde dich über InfoLabs an.',
  403: 'Dafür fehlt die Berechtigung.',
  404: 'Nicht gefunden.'
};

function materialRoutes(app, h) {
  const { svc, material } = h;
  const kurse = (k) => (k ? svc.konten.kurseVon(k.sub).length : 0);

  app.get('/api/material', (req, res) => {
    res.set('Cache-Control', 'no-store');
    if (!req.konto) return res.status(401).json({ error: 'Bitte melde dich an.' });
    const u = material.uebersicht(req.konto, kurse(req.konto));
    if (!u.stufen.length) return res.status(403).json({ error: 'Deine Lehrkraft hat AutomatenLab für deinen Kurs (noch) nicht freigeschaltet.' });
    res.json(u);
  });

  const fehler = (res, status) => res.status(status).type('text').send(TEXT[status] || 'Fehler.');

  app.get('/material/zip/:datei', (req, res) => {
    res.set('Cache-Control', 'private, no-store');
    const id = String(req.params.datei).replace(/\.zip$/, '');
    const z = material.zipFuer(id, req.konto);
    if (z.status) return fehler(res, z.status);
    res.set('Content-Type', 'application/zip');
    res.attachment(z.name);
    res.send(z.daten);
  });

  app.get('/material/:stufe/:name', (req, res) => {
    res.set('Cache-Control', 'private, no-store');
    const rel = `${req.params.stufe}/${req.params.name}`;
    const d = material.dateiFuer(rel, req.konto, kurse(req.konto));
    if (d.status) return fehler(res, d.status);
    if (req.params.stufe === 'original') res.attachment(req.params.name);
    else res.set('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(req.params.name)}`);
    res.sendFile(d.abs);
  });
}

module.exports = { materialRoutes };
