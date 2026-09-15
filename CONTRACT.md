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
