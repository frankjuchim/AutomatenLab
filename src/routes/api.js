'use strict';
// API für die App im Browser: Sitzung und Lehrkraft-Bereich. Schreibende Anfragen nur mit gleicher Herkunft und als
// JSON (security.sameOriginCheck, wie Algo Quest und Portal).

const express = require('express');
const S = require('../security');

/** Rechte: Gast 401, falsche Rolle 403. */
const nurAngemeldet = (req, res, next) => (req.konto ? next() : res.status(401).json({ error: 'Bitte melde dich an.' }));
const nurLehrkraft = (req, res, next) => {
  if (!req.konto) return res.status(401).json({ error: 'Bitte melden Sie sich an.' });
  if (req.konto.rolle !== 'lehrkraft' && req.konto.rolle !== 'superadmin') return res.status(403).json({ error: 'Nur für Lehrkräfte.' });
  next();
};

/**
 * @param {import('express').Express} app
 * @param {object} h { svc, sso: {aktiv, portalUrl} }
 */
function apiRoutes(app, h) {
  const { svc, sso } = h;
  const api = express.Router();
  api.use(S.sameOriginCheck);
  api.use(express.json({ limit: '100kb' }));
  api.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });

  // Wer ist angemeldet? (öffentlich) – Grundlage für Kopfzeile und Gastmodus
  api.get('/sitzung', (req, res) => {
    res.json({ konto: svc.konten.ansicht(req.konto), anmeldung: sso.aktiv, portal: sso.portalUrl || null });
  });

  // Auf allen Geräten dieser Plattform abmelden
  api.post('/sitzung/beenden', nurAngemeldet, (req, res) => {
    svc.konten.sitzungenBeenden(req.konto.sub);
    S.clearCookie(req, res, S.COOKIE_SITZUNG);
    res.json({ ok: true });
  });

  // Lehrkraft: Kurse, in denen sie laut letztem Token Lehrkraft ist (Superadmin: alle Kurse dieser Plattform aus dem Token)
  api.get('/lehrer/kurse', nurLehrkraft, (req, res) => {
    const kurse = svc.konten.kurseVon(req.konto.sub).filter((k) => k.rolle === 'lehrkraft');
    res.json(kurse.map((k) => ({ id: k.id, name: k.name, schueler: svc.konten.mitglieder(k.id).length })));
  });

  app.use('/api', api);
}

module.exports = { apiRoutes, nurAngemeldet, nurLehrkraft };
