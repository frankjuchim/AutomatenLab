# AutomatenLab – statische Auslieferung mit nginx (CapRover: captain-definition verweist hierauf)
FROM nginx:1.27-alpine
# Eigene Server-Konfiguration (gzip, Cache-Header, MIME für .wasm/.mjs, Sicherheits-Header)
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Nur die Web-App kopieren (Tests, Doku usw. werden über .dockerignore ausgeschlossen)
COPY index.html /usr/share/nginx/html/
COPY css /usr/share/nginx/html/css
COPY js /usr/share/nginx/html/js
COPY assets /usr/share/nginx/html/assets
COPY vendor /usr/share/nginx/html/vendor
EXPOSE 80
HEALTHCHECK --interval=60s --timeout=5s CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1
