'use strict';
// Verbund-API (Vertrag §6): Aufrufe des Portals, serverseitig, mit Bearer-Token (Ed25519, sub „portal“, zweck,
// exp − iat ≤ 60 s, jti einmalig). Ohne gültiges Token (auch bei falschem zweck): 401 ohne Details.
// Keine Origin-Prüfung (kein Browser beteiligt), aber JSON und Rate-Limit.

const express = require('express');
const S = require('../security');
const { pruefe, JtiSpeicher } = require('../jwt');

/**
 * @param {import('express').Express} app
 * @param {object} h { svc, sso: {aktiv, portalUrl, plattformId, publicKey}, now, katalog }
 */
function verbundRoutes(app, h) {
  const { svc, sso } = h;
  const jti = new JtiSpeicher();
  const jetztSek = () => Math.floor(h.now() / 1000);
  const limit = new S.Limiter({ max: 600, windowMs: 60 * 1000 });
  const r = express.Router();
  r.use(express.json({ limit: '20kb' }));
  r.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    const key = 'ip:' + req.ip;
    if (!limit.take(key)) return res.status(429).json({ error: 'Zu viele Anfragen.' });
    next();
  });

  /** Middleware: Verbund-Token mit passendem zweck. */
  const token = (zweck) => (req, res, next) => {
    if (!sso.aktiv) return res.status(401).json({ error: 'Token ungültig.' });
    const m = /^Bearer ([A-Za-z0-9_.-]{20,8192})$/.exec(req.get('authorization') || '');
    const p = m ? pruefe(m[1], sso.publicKey, { iss: sso.portalUrl, aud: sso.plattformId, maxDauerSek: 60, jetztSek: jetztSek() }) : { ok: false };
    if (!p.ok || p.nutzlast.sub !== 'portal' || p.nutzlast.zweck !== zweck || !jti.merke(p.nutzlast.jti, p.nutzlast.exp, jetztSek())) {
      return res.status(401).json({ error: 'Token ungültig.' });
    }
    next();
  };

  /** Schreibende Aufrufe nur als JSON (nach der Token-Prüfung, damit Unbefugte nur 401 sehen). */
  const nurJson = (req, res, next) => (req.is('application/json') ? next() : res.status(415).json({ error: 'Nur JSON-Anfragen erlaubt.' }));

  // Alle Daten eines Kontos bzw. Kurses löschen – idempotent, innerhalb der Anfrage (§10)
  r.post('/loeschen', token('loeschen'), nurJson, (req, res) => {
    const b = req.body || {};
    // Live-Runden liegen nur im Arbeitsspeicher – dort ebenfalls sofort vergessen
    if (typeof b.sub === 'string' && svc.konten.SUB.test(b.sub)) {
      svc.live?.vergissKonto(b.sub);
      return res.json({ geloescht: svc.konten.loescheKonto(b.sub) });
    }
    if (typeof b.kurs === 'string' && svc.konten.KURS.test(b.kurs)) {
      svc.live?.vergissKurs(b.kurs);
      return res.json({ geloescht: svc.konten.loescheKurs(b.kurs) });
    }
    res.status(400).json({ error: 'sub oder kurs fehlt.' });
  });

  // Kennzahlen eines Kurses für das Portal – keine Antworten, Lösungen oder Freitexte
  r.get('/kurse/:kursId/uebersicht', token('kurs-uebersicht'), (req, res) => {
    const k = svc.konten.kurs(req.params.kursId);
    if (!k) return res.status(404).json({ error: 'Kurs unbekannt.' });
    res.json(svc.auswertung.kursUebersicht(k));
  });

  // Kurs umbenannt bzw. Plattform für den Kurs ab-/wieder eingeschaltet
  r.post('/kurse/:kursId', token('kurs-aendern'), nurJson, (req, res) => {
    if (!svc.konten.KURS.test(req.params.kursId)) return res.status(404).json({ error: 'Kurs unbekannt.' });
    const b = req.body || {};
    if (b.name !== undefined && (typeof b.name !== 'string' || !b.name.trim())) return res.status(400).json({ error: 'name ungültig.' });
    if (b.aktiv !== undefined && typeof b.aktiv !== 'boolean') return res.status(400).json({ error: 'aktiv ungültig.' });
    svc.konten.kursAendern(req.params.kursId, { name: b.name, aktiv: b.aktiv });
    res.json({ ok: true });
  });

  r.use((req, res) => res.status(404).json({ error: 'Unbekannte Verbund-Route.' }));
  app.use('/api/verbund', r);
}

module.exports = { verbundRoutes };
