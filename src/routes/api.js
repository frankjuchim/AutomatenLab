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
    res.json(kurse.map((k) => {
      const m = svc.konten.mitglieder(k.id);
      const zuletzt = m.map((x) => x.last_active_at).filter(Boolean).sort().pop() || null;
      return { id: k.id, name: k.name, schueler: m.length, zuletztAktiv: zuletzt, ...svc.auswertung.einstellungen(svc.konten.kurs(k.id)) };
    }));
  });

  // Schüler: Einstellungen der eigenen Kurse für die Startseite (Level-Art, Kursart, Auftrag der Lehrkraft)
  api.get('/meine-kurse', nurAngemeldet, (req, res) => res.json(svc.auswertung.meineKurse(req.konto.sub)));

  // Schüler: Rangliste der eigenen Kurse, in denen die Lehrkraft sie eingeschaltet hat (gesamt oder je Welt)
  api.get('/rangliste', nurAngemeldet, (req, res) => res.json(svc.auswertung.rangliste(req.konto.sub, req.query.welt ? String(req.query.welt) : null)));

  // Beamer-Board: öffentlich über den zufälligen Link aus den Kurs-Einstellungen, nur wenn eingeschaltet (sonst 404)
  const limitBoard = new S.Limiter({ max: 60, windowMs: 60 * 1000 });
  api.get('/board/:token', (req, res) => {
    res.set('X-Robots-Tag', 'noindex, nofollow');
    if (!limitBoard.take('b:' + (req.ip || ''))) return res.status(429).json({ error: 'Zu viele Anfragen. Bitte warte einen Moment.' });
    res.json(svc.auswertung.board(String(req.params.token)));
  });

  // Kurs der Lehrkraft (laut letztem Token) – sonst 404, damit fremde Kurse nicht erkennbar sind
  const meinKurs = (req, res, next) => {
    const id = String(req.params.id);
    const k = svc.konten.kurseVon(req.konto.sub).find((x) => x.id === id && x.rolle === 'lehrkraft');
    if (!k) return res.status(404).json({ error: 'Diesen Kurs gibt es nicht.' });
    req.kurs = svc.konten.kurs(id);
    next();
  };
  api.get('/lehrer/kurse/:id', nurLehrkraft, meinKurs, (req, res) => {
    res.json({ id: req.kurs.id, name: req.kurs.name, schueler: svc.konten.mitglieder(req.kurs.id).length, einstellungen: svc.auswertung.einstellungen(req.kurs) });
  });
  api.patch('/lehrer/kurse/:id', nurLehrkraft, meinKurs, (req, res) => {
    res.json({ einstellungen: svc.auswertung.einstellungenSetzen(req.kurs, (req.body || {}).einstellungen) });
  });
  api.get('/lehrer/kurse/:id/schueler', nurLehrkraft, meinKurs, (req, res) => res.json(svc.auswertung.schueler(req.kurs)));
  api.get('/lehrer/kurse/:id/auswertung', nurLehrkraft, meinKurs, (req, res) => res.json({
    ...svc.auswertung.kursAuswertung(req.kurs),
    ...(svc.boss ? { boss: svc.boss.kursErgebnisse(svc.konten.mitglieder(req.kurs.id)) } : {})
  }));
  api.get('/lehrer/kurse/:id/urkunden', nurLehrkraft, meinKurs, (req, res) => res.json(svc.auswertung.urkunden(req.kurs)));
  api.get('/lehrer/kurse/:id/export.csv', nurLehrkraft, meinKurs, (req, res) => {
    const art = String(req.query.art || 'uebersicht');
    const text = svc.auswertung.export(req.kurs, art);
    const datei = `automatenlab-${req.kurs.id.replace(':', '')}-${art}.csv`;
    res.set('Content-Type', 'text/csv; charset=utf-8').set('Content-Disposition', `attachment; filename="${datei}"`).send(text);
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

  // Eigene Aufgaben der Lehrkräfte (ID „eigen:<nr>“): nur für Mitglieder des Kurses (freigegeben) und dessen Lehrkräfte
  const eigenZugang = (req, res, next) => {
    const id = String(req.params.id);
    if (!id.startsWith('eigen:')) return next();
    if (!svc.eigene || !svc.eigene.darfLoesen(req.konto, id)) return res.status(404).json({ error: 'Aufgabe nicht gefunden.' });
    next();
  };

  // Öffentliche Aufgabenliste (Titel, Stufe, Punkte – keine Lösungen), z. B. für Übersichten
  api.get('/katalog', (req, res) => res.json({ aufgaben: svc.lernen.katalog(req.query.modul ? String(req.query.modul) : null) }));

  api.get('/lernstand', darfUeben, (req, res) => res.json(svc.lernen.lernstand(req.konto.sub)));
  api.get('/aufgaben/:id', darfUeben, eigenZugang, (req, res) => res.json(svc.lernen.abrufen(req.konto.sub, req.params.id)));
  // Aufgaben-Vorschau: prüfen, Tipps, Lösung – ohne Speichern (Stand kommt vom Browser, src/lernen.js vorschau)
  api.post('/lehrer/vorschau/:id/:aktion', nurLehrkraft, eigenZugang, begrenzt, (req, res) => {
    const aktion = String(req.params.aktion);
    if (!['abrufen', 'pruefen', 'tipp', 'aufdecken'].includes(aktion)) return res.status(404).json({ error: 'Diese Vorschau-Aktion gibt es nicht.' });
    res.json(svc.lernen.vorschau(req.params.id, aktion, req.body || {}));
  });
  api.post('/aufgaben/:id/pruefen', darfUeben, eigenZugang, begrenzt, (req, res) => res.json(svc.lernen.pruefen(req.konto.sub, req.params.id, (req.body || {}).antwort)));
  api.post('/aufgaben/:id/tipp', darfUeben, eigenZugang, begrenzt, (req, res) => res.json(svc.lernen.tipp(req.konto.sub, req.params.id)));
  api.post('/aufgaben/:id/aufdecken', darfUeben, eigenZugang, begrenzt, (req, res) => res.json(svc.lernen.aufdecken(req.konto.sub, req.params.id)));

  // Training (Arena, „Unterscheide!“): Runde vom Server, Antworten am Ende, 1 Punkt je richtiger Antwort, Tageshöchstwert
  api.get('/training', darfUeben, (req, res) => res.json(svc.training.info(req.konto.sub)));
  api.post('/training/:modul/neu', darfUeben, begrenzt, (req, res) => res.json(svc.training.neu(req.konto.sub, req.params.modul, req.body)));
  api.post('/training/runde/:id/antwort', darfUeben, begrenzt, (req, res) => res.json(svc.training.antwort(req.konto.sub, req.params.id, req.body)));
  api.post('/training/runde/:id/ende', darfUeben, begrenzt, (req, res) => res.json(svc.training.ende(req.konto.sub, req.params.id, req.body)));

  // Boss-Kämpfe (wie Algo Quest): Status, Start, Kampf ansehen, Antwort speichern (ohne Wertung), abgeben
  const ohneBoss = (req, res, next) => (svc.boss ? next() : res.status(404).json({ error: 'Boss-Kämpfe gibt es hier nicht.' }));
  const limitBoss = new S.Limiter({ max: 90, windowMs: 60 * 1000 });
  const bossBegrenzt = (req, res, next) => (limitBoss.take('b:' + req.konto.sub) ? next() : res.status(429).json({ error: 'Zu viele Anfragen. Bitte warte einen Moment.' }));
  api.get('/boss', darfUeben, ohneBoss, (req, res) => res.json(svc.boss.uebersicht(req.konto)));
  api.get('/boss/kampf/:id', darfUeben, ohneBoss, (req, res) => res.json(svc.boss.ansicht(req.konto, req.params.id)));
  api.put('/boss/kampf/:id/antwort', darfUeben, ohneBoss, bossBegrenzt, (req, res) => res.json(svc.boss.antworten(req.konto, req.params.id, req.body || {})));
  api.post('/boss/kampf/:id/beenden', darfUeben, ohneBoss, begrenzt, (req, res) => res.json(svc.boss.beenden(req.konto, req.params.id)));
  api.get('/boss/:welt', darfUeben, ohneBoss, (req, res) => res.json(svc.boss.status(req.konto, req.params.welt)));
  api.post('/boss/:welt/start', darfUeben, ohneBoss, begrenzt, (req, res) => res.status(201).json(svc.boss.starten(req.konto, req.params.welt)));
  // Lehrkraft: Pool eines Bosses mit richtigen Antworten (Vorschau wie Algo Quest)
  api.get('/lehrer/boss/:welt', nurLehrkraft, ohneBoss, (req, res) => res.json(svc.boss.pool(req.params.welt)));

  // Aufgaben-Editor (PR 10): eigene Aufgaben je Kurs anlegen, ändern, freigeben, löschen; Schüler sehen die freigegebenen
  const ohneEigene = (req, res, next) => (svc.eigene ? next() : res.status(404).json({ error: 'Eigene Aufgaben gibt es hier nicht.' }));
  api.get('/eigene', nurAngemeldet, ohneEigene, (req, res) => res.json(svc.eigene.fuerSchueler(req.konto.sub)));
  api.get('/lehrer/kurse/:id/eigene', nurLehrkraft, meinKurs, ohneEigene, (req, res) => res.json(svc.eigene.liste(req.kurs.id)));
  api.post('/lehrer/kurse/:id/eigene', nurLehrkraft, meinKurs, ohneEigene, begrenzt, (req, res) => res.status(201).json(svc.eigene.anlegen(req.konto, req.kurs.id, req.body || {})));
  api.get('/lehrer/eigene/:nr', nurLehrkraft, ohneEigene, (req, res) => res.json(svc.eigene.lesen(req.konto, req.params.nr)));
  api.patch('/lehrer/eigene/:nr', nurLehrkraft, ohneEigene, begrenzt, (req, res) => res.json(svc.eigene.aendern(req.konto, req.params.nr, req.body || {})));
  api.post('/lehrer/eigene/:nr/kopieren', nurLehrkraft, ohneEigene, begrenzt, (req, res) => res.status(201).json(svc.eigene.kopieren(req.konto, req.params.nr, (req.body || {}).kurs)));
  api.delete('/lehrer/eigene/:nr', nurLehrkraft, ohneEigene, (req, res) => res.json(svc.eigene.loeschen(req.konto, req.params.nr)));

  // Klassen-Challenges (PR 11): Lehrkraft legt je Kurs an; Schüler sehen die ihres Kurses
  const ohneChallenges = (req, res, next) => (svc.challenges ? next() : res.status(404).json({ error: 'Challenges gibt es hier nicht.' }));
  api.get('/challenges', nurAngemeldet, ohneChallenges, (req, res) => res.json(svc.challenges.fuerSchueler(req.konto.sub)));
  api.get('/challenges/:cid', nurAngemeldet, ohneChallenges, (req, res) => res.json(svc.challenges.schuelerDetail(req.konto, req.params.cid)));
  api.get('/lehrer/kurse/:id/challenges', nurLehrkraft, meinKurs, ohneChallenges, (req, res) => res.json(svc.challenges.liste(req.kurs.id)));
  api.post('/lehrer/kurse/:id/challenges', nurLehrkraft, meinKurs, ohneChallenges, begrenzt, (req, res) => res.status(201).json(svc.challenges.anlegen(req.konto, req.kurs.id, req.body || {})));
  api.get('/lehrer/challenges/:cid', nurLehrkraft, ohneChallenges, (req, res) => res.json(svc.challenges.lehrkraftDetail(req.konto, req.params.cid)));
  api.post('/lehrer/challenges/:cid/beenden', nurLehrkraft, ohneChallenges, (req, res) => res.json(svc.challenges.beenden(req.konto, req.params.cid)));
  api.delete('/lehrer/challenges/:cid', nurLehrkraft, ohneChallenges, (req, res) => res.json(svc.challenges.loeschen(req.konto, req.params.cid)));

  app.use('/api', api);
}

module.exports = { apiRoutes, nurAngemeldet, nurLehrkraft };
