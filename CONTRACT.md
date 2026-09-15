# MKK build contract (2026-09-15 night)
- builder owns everything EXCEPT content/podcasts.json and audio/*.mp3 (audio executor owns those).
- content/podcasts.json schema: [{"band":"4-5","title":"...","minutes":1.5,"script":"...","audio":"audio/mkk-4-5.mp3","status":"needs-ear-check"}]
- Bands: 4-5 · 6-7 · 8-9 · 10-11 · 12 · 13 · 14 (7 files: audio/mkk-<band>.mp3, e.g. mkk-4-5.mp3, mkk-12.mp3)
- App must render fine if a podcast has no audio yet (show script + "🎙 įrašoma").

# v0.2 contract (2026-09-15 morning) — illustrations
- image executor owns `img/*.webp` and `content/illustrations.json`; builder owns everything else.
- illustrations.json schema: {"<slug>": {"file":"img/<slug>.webp","alt":"LT alt text","tone":"#hex muted secondary for that topic"}}
- slugs (21): hero · brain-learns · top3 · memory · attention · focus · concentration · myths · sleep · movement · reading · phone-grayscale · game-recall · game-timer · game-teach · age-4-5 · age-6-7 · age-8-9 · age-10-11 · age-12 · age-13 · age-14
- builder must render a calm generated SVG placeholder (same tone) when a slug is missing, so the app never shows a broken image.

# v0.3 contract (2026-09-15, 09:50–11:20) — five agents, ONE repo, NOBODY commits (orchestrator commits)
- builder A (app): index.html · app.js · styles.css · sw.js · manifest · content/config.json · content/i18n.json (new) · content/techniques.json · content/library.json · content/games.json · content/about.json (new) · bin/bundle.py · CHANGELOG.md · DESIGN.md · README.md (app sections only)
- builder B (store): package.json · capacitor.config.* · ios/ · android/ · resources/ (icons/splash) · docs/** · tests/** · playwright.config.* · .github/workflows/** · bin/build-*.sh · README.md (only a "Store build" section appended at the END)
- executor (content): content/blog.json (new) · content/sources-lt.json (new) · content/people.json (new) — schema:
  blog.json = [{"id","type":"tutorial|article|podcast|video|people","title":{"lt","en"},"summary":{"lt","en"},"body":{"lt","en"} (markdown-lite, ≤1200 chars),"source":{"name","url","lang":"lt|en"},"grade":"A|B|C","age":"4-14","tone":"#hex","status":"published|draft"}]
  sources-lt.json = [{"technique_id":"<id from techniques.json>","name","url","lang":"lt","note"}]
  people.json = [{"name","role":{"lt","en"},"why":{"lt","en"},"links":[{"label","url"}],"lang":"lt|en","lt":true|false}]
- builder A renders blog.json/people.json/sources-lt.json IF present (check at the very end again); missing → calm empty state, never an error.
- Illustrations: reuse existing slugs; new content types map to existing tones. No new Higgsfield runs this wave.
