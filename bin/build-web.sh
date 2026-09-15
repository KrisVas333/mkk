#!/usr/bin/env bash
# MKK — stage the static web app into ./www for Capacitor.
# The repo root stays the live web app (GitHub Pages + `python3 bin/serve.py`);
# www/ is a disposable mirror, never committed. Capacitor refuses webDir ".".
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
rm -rf www && mkdir -p www
# every asset the app needs at runtime, nothing else
for f in index.html 404.html app.js styles.css sw.js manifest.webmanifest LICENSE; do
  [ -f "$f" ] && cp "$f" www/
done
for d in content audio img icons; do
  [ -d "$d" ] && cp -R "$d" www/
done
echo "www/ staged: $(du -sh www | cut -f1), $(find www -type f | wc -l | tr -d ' ') files"
