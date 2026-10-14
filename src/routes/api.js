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

  /* ---------- Aufgaben mit Prüfung auf dem Server (Vertrag §9) ---------- */

  // Schüler dürfen nur üben, wenn mindestens einer ihrer Kurse AutomatenLab freigeschaltet hat (§4);
  // Lehrkräfte und Superadmin dürfen alle Aufgaben ausprobieren.
  const darfUeben = (req, res, next) => {
    if (!req.konto) return res.status(401).json({ error: 'Bitte melde dich an.' });
    if (req.konto.rolle === 'schueler' && svc.konten.kurseVon(req.konto.sub).length === 0) {
      return res.status(403).json({ error: 'Deine Lehrkraft hat AutomatenLab für deinen Kurs (noch) nicht freigeschaltet.' });
    }
    next();
  };
  const limitPruefen = new S.Limiter({ max: 120, windowMs: 60 * 1000 });
  const begrenzt = (req, res, next) => {
    const key = 'k:' + req.konto.sub;
    if (!limitPruefen.take(key)) return res.status(429).json({ error: 'Zu viele Versuche. Bitte warte einen Moment.' });
    next();
  };

  // Öffentliche Aufgabenliste (Titel, Stufe, Punkte – keine Lösungen), z. B. für Übersichten
  api.get('/katalog', (req, res) => res.json({ aufgaben: svc.lernen.katalog(req.query.modul ? String(req.query.modul) : null) }));

  api.get('/lernstand', darfUeben, (req, res) => res.json(svc.lernen.lernstand(req.konto.sub)));
  api.get('/aufgaben/:id', darfUeben, (req, res) => res.json(svc.lernen.abrufen(req.konto.sub, req.params.id)));
  api.post('/aufgaben/:id/pruefen', darfUeben, begrenzt, (req, res) => res.json(svc.lernen.pruefen(req.konto.sub, req.params.id, (req.body || {}).antwort)));
  api.post('/aufgaben/:id/tipp', darfUeben, begrenzt, (req, res) => res.json(svc.lernen.tipp(req.konto.sub, req.params.id)));
  api.post('/aufgaben/:id/aufdecken', darfUeben, begrenzt, (req, res) => res.json(svc.lernen.aufdecken(req.konto.sub, req.params.id)));

  // Training (Arena, „Unterscheide!“): Runde vom Server, Antworten am Ende, 1 Punkt je richtiger Antwort, Tageshöchstwert
  api.get('/training', darfUeben, (req, res) => res.json(svc.training.info(req.konto.sub)));
  api.post('/training/:modul/neu', darfUeben, begrenzt, (req, res) => res.json(svc.training.neu(req.konto.sub, req.params.modul, req.body)));
  api.post('/training/runde/:id/ende', darfUeben, begrenzt, (req, res) => res.json(svc.training.ende(req.konto.sub, req.params.id, req.body)));

  app.use('/api', api);
}

module.exports = { apiRoutes, nurAngemeldet, nurLehrkraft };
