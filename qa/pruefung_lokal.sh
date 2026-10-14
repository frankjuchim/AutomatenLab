#!/usr/bin/env bash
# Lokale Fassung der GitHub-Prüfung (.github/workflows/pruefung.yml) – für Zeiten, in denen GitHub Actions nicht läuft.
# Schritte wie in der CI: npm test; Image wie auf CapRover bauen und mit Test-Portal starten; Material-Rechte;
# Vertragsprüfung; alle Deep-Links angemeldet (Lehrkraft mit Kurs) und als Gast.
# Aufruf im Repo-Wurzelordner: bash qa/pruefung_lokal.sh   (braucht Docker und Chromium für Playwright)
# Ergebnis: letzte Zeile „PRÜFUNG GRÜN …“ bzw. Abbruch mit Fehlermeldung (Exit-Code ≠ 0).
set -euo pipefail
cd "$(dirname "$0")/.."
PORT="${PORT:-8080}"
NAME=automatenlab-pruefung
TMP="$(mktemp -d)"
aufraeumen() { docker rm -f "$NAME" >/dev/null 2>&1 || true; rm -rf "$TMP"; }
trap aufraeumen EXIT
schritt() { echo; echo "== $*"; }

schritt "npm test"
npm test > "$TMP/test.log" 2>&1 || { tail -40 "$TMP/test.log"; exit 1; }
grep -E '^# (pass|fail)' "$TMP/test.log"

schritt "Testschlüssel für die Portal-Anmeldung (nur für diese Prüfung)"
node -e "const c=require('crypto');const p=c.generateKeyPairSync('ed25519');const fs=require('fs');fs.writeFileSync('$TMP/priv.pem',p.privateKey.export({type:'pkcs8',format:'pem'}));fs.writeFileSync('$TMP/pub.pem',p.publicKey.export({type:'spki',format:'pem'}))"

schritt "Image wie auf CapRover bauen und mit Test-Portal starten"
# Hinter einem Proxy mit eigener CA (z. B. Cloud-Sitzung): Proxy und CA nur für diesen Build mitgeben – das
# Dockerfile des Projekts bleibt unverändert (die Kopie liegt im Temp-Ordner), TLS-Prüfung bleibt an. Nur HTTPS über
# den Proxy (npm); apt holt seine Pakete wie gewohnt direkt.
if [ -n "${HTTPS_PROXY:-}" ] && [ -f "${PRUEFUNG_CA:-/root/.ccr/ca-bundle.crt}" ]; then
  CA="${PRUEFUNG_CA:-/root/.ccr/ca-bundle.crt}"
  sed '/^FROM .* AS deps$/a COPY --from=proxyca ca.crt /etc/ssl/certs/proxy-ca.crt\nENV NODE_EXTRA_CA_CERTS=/etc/ssl/certs/proxy-ca.crt' Dockerfile > "$TMP/Dockerfile"
  mkdir -p "$TMP/ca" && cp "$CA" "$TMP/ca/ca.crt"
  docker build -q --network host --build-context proxyca="$TMP/ca" -f "$TMP/Dockerfile" \
    --build-arg HTTPS_PROXY="$HTTPS_PROXY" --build-arg https_proxy="$HTTPS_PROXY" \
    -t "$NAME" . > /dev/null
else
  docker build -q -t "$NAME" . > /dev/null
fi
docker rm -f "$NAME" > /dev/null 2>&1 || true
docker run -d -p "$PORT:80" --name "$NAME" \
  -e PLATTFORM_URL="http://localhost:$PORT" -e PORTAL_URL=http://portal.test -e AUTH_MODUS=portal \
  -e SESSION_SECRET=lokale-pruefung-geheimnis -e PORTAL_PUBLIC_KEY="$(cat "$TMP/pub.pem")" "$NAME" > /dev/null
B="http://localhost:$PORT"
for i in $(seq 1 60); do curl -fsS "$B/healthz" > /dev/null 2>&1 && break; sleep 1; done
curl -fsS "$B/healthz" | grep -q '"anmeldung":"portal"' || { docker logs "$NAME" || true; exit 1; }
curl -fsS "$B/healthz"; echo
curl -fsS "$B/api/plattform" | grep -q 'lehrkraft-materialien' || { echo 'materials/pdf fehlt im Image'; exit 1; }
code() { curl -s -o /dev/null -w '%{http_code}' "$B$1"; }
test "$(code /material/lehrkraft/DS02_Lehrkraft_Was-macht-dieser-Automat.pdf)" = 401
test "$(code /material/lehrkraft/DS01_Lehrkraft_Ein-Automat-hoert-zu.pdf)" = 200
test "$(code /material/original/DS01_AB_Ein-Automat-hoert-zu.docx)" = 401
echo "Material-Rechte ok"

schritt "Vertragsprüfung"
node scripts/vertrag_pruefen.js "$B"

schritt "Alle Deep-Links angemeldet (Lehrkraft mit Kurs, Test-Token)"
QA_PORTAL_KEY="$TMP/priv.pem" node qa/qa-routes.mjs "$B/" | tail -3

schritt "Alle Deep-Links als Gast"
QA_GAST=1 node qa/qa-routes.mjs "$B/" | tail -3

echo
echo "PRÜFUNG GRÜN – $(git rev-parse --short HEAD) $(node -p "require('./package.json').version")"
