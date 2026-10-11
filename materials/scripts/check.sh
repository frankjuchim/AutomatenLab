#!/usr/bin/env bash
# Prüft alle Automaten, Grammatiken und Lösungen der Materialien (nur Python-Phase, ohne Word/PowerPoint). Für CI.
set -euo pipefail
cd "$(dirname "$0")/../content"
PY="${PYTHON:-python3}"
for d in ds01 ds02 ds03 ds04 ds05 ds06 ds07 ds08 ds09 ds10 ds11 ds12 ds13 ds14 ds15 ds16 abschluss planung video; do
  ( cd "$d"; for f in automata_*.py; do if [ -e "$f" ]; then echo "== $d/$f"; "$PY" "$f" > /dev/null; fi; done )
done
echo "Alle fachlichen Prüfungen bestanden."
