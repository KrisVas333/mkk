# MKK build contract (2026-09-15 night)
- builder owns everything EXCEPT content/podcasts.json and audio/*.mp3 (audio executor owns those).
- content/podcasts.json schema: [{"band":"4-5","title":"...","minutes":1.5,"script":"...","audio":"audio/mkk-4-5.mp3","status":"needs-ear-check"}]
- Bands: 4-5 · 6-7 · 8-9 · 10-11 · 12 · 13 · 14 (7 files: audio/mkk-<band>.mp3, e.g. mkk-4-5.mp3, mkk-12.mp3)
- App must render fine if a podcast has no audio yet (show script + "🎙 įrašoma").
