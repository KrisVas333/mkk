#!/usr/bin/env bash
# MKK — one command from the repo to a native project ready to open.
#
#   bash bin/build-store.sh            # sanity + stage + sync both platforms
#   bash bin/build-store.sh android    # only android
#   bash bin/build-store.sh ios        # only ios
#
# It never builds a binary and never uploads anything — Xcode / Android Studio
# and Kris do that. It only guarantees the native projects hold the CURRENT app.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
TARGET="${1:-all}"

b() { printf '\n\033[1m%s\033[0m\n' "$*"; }
ok() { printf '  \033[32m✓\033[0m %s\n' "$*"; }
no() { printf '  \033[31m✗\033[0m %s\n' "$*"; }

b "MKK store build — $(date '+%Y-%m-%d %H:%M')"

# ---------------------------------------------------------------- 1. sanity
b "1/5  Sanity — bundler still parses every content file"
if python3 bin/bundle.py >/dev/null 2>&1; then
  ok "bin/bundle.py ran clean (dist/artifact.html regenerated)"
else
  no "bin/bundle.py FAILED — content or markers are broken. Fix before shipping."
  exit 1
fi

for f in index.html app.js styles.css sw.js manifest.webmanifest; do
  [ -f "$f" ] || { no "missing $f"; exit 1; }
done
python3 - <<'PY'
import glob, json, sys
bad = []
for p in sorted(glob.glob('content/*.json')):
    try:
        json.load(open(p, encoding='utf-8'))
    except Exception as e:
        bad.append('%s: %s' % (p, e))
if bad:
    print('\n'.join('  ✗ ' + b for b in bad)); sys.exit(1)
print('  ✓ %d content/*.json files parse' % len(glob.glob('content/*.json')))
PY

# ---------------------------------------------------------------- 2. tests
b "2/5  Tests"
if [ "${SKIP_TESTS:-}" = "1" ]; then
  echo "  – skipped (SKIP_TESTS=1)"
elif [ -d node_modules/@playwright/test ]; then
  if npx playwright test --reporter=line; then ok "e2e passed"
  else no "e2e FAILED — do not ship this build"; exit 1; fi
else
  echo "  – @playwright/test not installed, skipping (run: npm i)"
fi

# ---------------------------------------------------------------- 3. stage
b "3/5  Stage the web app into www/"
bash bin/build-web.sh

# ---------------------------------------------------------------- 4. sync
b "4/5  Capacitor sync"
case "$TARGET" in
  android) npx cap sync android ;;
  ios)     npx cap sync ios ;;
  *)       npx cap sync ;;
esac
ok "native projects now hold the current web build"

# ---------------------------------------------------------------- 5. next
b "5/5  What only Kris can do next"
cat <<'TXT'

  ▶️  ANDROID
      npx cap open android          (needs Android Studio + SDK + Java)
      → Build ▸ Generate Signed Bundle / APK ▸ Android App Bundle (.aab)
      → first time: create an upload keystore and SAVE IT IN 1PASSWORD.
        Lose it and the app can never be updated again.
      → Play Console ▸ Internal testing ▸ Create release ▸ upload the .aab

  🍏  IOS
      npx cap open ios              (needs the full Xcode, not Command Line Tools)
      → Signing & Capabilities ▸ tick "Automatically manage signing" ▸ pick Team
      → bump Build number (it must increase for EVERY TestFlight upload)
      → Product ▸ Archive ▸ Distribute App ▸ App Store Connect ▸ Upload
      → App Store Connect ▸ TestFlight ▸ add testers / enable the public link

  📋  BEFORE EITHER
      docs/STORE-CHECKLIST.md   — accounts, costs, forms, store copy, % ready
      docs/TEST-AND-SAFETY.md   — the two open kids-safety blockers
      run the `bias` skill      — mandatory gate: MKK carries a provider gift code

TXT
b "Done. Nothing was uploaded, published, or committed."
