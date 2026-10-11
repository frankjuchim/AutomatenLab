#!/usr/bin/env bash
# Baut alle Unterrichtsmaterialien neu (Grafiken → build/, Word/PowerPoint → out/) und stellt das Lehrkräfte-Paket
# in dist/Automaten_LK zusammen.
#   ./build_all.sh                 alles
#   ./build_all.sh ds05 video      nur einzelne Ordner (danach trotzdem Paket)
# QR-Codes zeigen auf AUTOMATENLAB_URL (Standard: https://automatenlab.frankjuchim.de/).
set -euo pipefail
cd "$(dirname "$0")"
export AUTOMATENLAB_URL="${AUTOMATENLAB_URL:-https://automatenlab.frankjuchim.de/}"
PY="${PYTHON:-python3}"
ALL=(ds01 ds02 ds03 ds04 ds05 ds06 ds07 ds08 ds09 ds10 ds11 ds12 ds13 ds14 ds15 ds16 abschluss planung video)
if [ $# -gt 0 ]; then DIRS=("$@"); else DIRS=("${ALL[@]}"); fi
mkdir -p out build
# Phase 1: alle Automaten/Grammatiken prüfen und Grafiken erzeugen (immer komplett – Materialien nutzen Grafiken anderer Level)
for d in "${ALL[@]}"; do
  echo "== Grafiken $d"
  ( cd "content/$d"; for f in automata_*.py; do if [ -e "$f" ]; then "$PY" "$f" > /dev/null; fi; done )
done
# Phase 2: Word/PowerPoint
for d in "${DIRS[@]}"; do
  [ -d "content/$d" ] || { echo "unbekannter Ordner: $d" >&2; exit 1; }
  echo "== Dokumente $d"
  ( cd "content/$d"
    if [ "$d" = video ]; then
      node build_video_decks.js > /dev/null
      node export_meta.js > /dev/null
      "$PY" make_overlays.py > /dev/null
      node build_videoplan.js > /dev/null
    else
      for f in build_*.js; do if [ -e "$f" ]; then node "$f" > /dev/null; fi; done
    fi )
done
node scripts/package_dist.js
