## Worum geht es?

<!-- Kurz: Was ändert sich und warum? Bezug zu docs/ROADMAP.md (Phase/Meilenstein). -->

## Checkliste

- [ ] `npm test` grün
- [ ] Bei UI-/Routing-Änderungen: `node qa/qa-routes.mjs <url>` ohne Fehler, Screenshots angesehen
- [ ] Alle Routen aus `app/README.md` funktionieren unverändert und ohne Anmeldung
- [ ] Bei Server-Änderungen: Rechte-Tests für jede neue Route und jede Rolle
- [ ] Datenschutz: keine externen Dienste/CDNs, keine Klarnamen/E-Mails von SuS, keine echten Personendaten in Tests
- [ ] Fachnotation nach `docs/einheit/PLAN.md` Abschnitt 1 (falls Inhalte betroffen)
- [ ] Barrierefreiheit: Tastatur, Kontraste, Großansicht „A A“
- [ ] Doku aktualisiert (`docs/ENTSCHEIDUNGEN.md`, `docs/ROADMAP.md`, `docs/DEPLOYMENT.md`, `README.md`, ggf. `.env.example`)
- [ ] Bei Material-Änderungen: Build ohne Fehler, Vorschau geprüft
