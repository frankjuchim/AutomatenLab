# AutomatenLab – statische Auslieferung mit nginx.
# CapRover baut bei jedem Push auf main aus dem Wurzelordner (captain-definition → ./Dockerfile).
# Ab Phase 2 (Login) wird daraus ein Node-Container für App + API (siehe docs/ROADMAP.md).
FROM nginx:1.27-alpine
# Eigene Server-Konfiguration (gzip, Cache-Header, MIME für .wasm/.mjs, Sicherheits-Header)
COPY app/nginx.conf /etc/nginx/conf.d/default.conf
# Nur die Web-App kopieren (Tests, Materialien, Doku werden über .dockerignore ausgeschlossen)
COPY app/index.html /usr/share/nginx/html/
COPY app/css /usr/share/nginx/html/css
COPY app/js /usr/share/nginx/html/js
COPY app/assets /usr/share/nginx/html/assets
COPY app/vendor /usr/share/nginx/html/vendor
EXPOSE 80
HEALTHCHECK --interval=60s --timeout=5s CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1
