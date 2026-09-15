# MKK — Mokymosi Meistrų Klubas

**Išmok mokytis. Kasdien po 3 minutes.**
Mokymosi mokslo treniruoklis vaikams **4–14 m.** Lietuviškai, telefonui, be serverio.

> ⚗️ **Eksperimentinis prototipas, sukurtas su dirbtiniu intelektu.** Jis nuolat keičiasi, gali
> klysti, suklastoti detalę arba rodyti pasenusius duomenis — naudokite jį kaip pokalbio pradžią,
> ne kaip galutinę tiesą. **Nemokamas.** Radote klaidą, netikslumą ar nesąžiningumą — parašykite,
> taisau greitai: [krisvas.lt](https://krisvas.lt)
>
> ⚠️ **MKK — darbinis pavadinimas.** Versija `v0.2.0`.

---

## Kas tai

Viena diena MKK yra **trys žingsniai ir trys minutės**:

| # | Žingsnis | Trukmė |
|---|---|---|
| 1 | 🎙 Vienos minutės podcast'as (pagal amžiaus juostą) | ~1 min |
| 2 | 🎯 Dviejų minučių praktika | 2 min |
| 3 | ✅ Vienas varnelės klausimas | 10 s |
| 4 | 📖 **Skaitymo minutė** — nebūtina, serijos neskaičiuoja | 1 min |

Aplink tai — **37 technikos ir 8 mitai** (kiekvienas su A/B/C/✗ įrodymų ženkleliu **ir šaltiniu**),
**3 žaidimai**, biblioteka (knygos · dokumentika · podkastai · tyrimai · **8 būrelių sritys** ·
namų įrankiai) ir kasdienė serija.

**Balsas: Kraist — AI Kris'o balso versija.** Podcast'ai įgarsinti dirbtinio intelekto sukurtu
Kristijono balso klonu; tai pasakyta programėlėje ten pat, kur groja garsas.

## Nešališkumas

Šis įrankis **nereitinguoja ir nerekomenduoja būrelių.** Sritys rikiuojamos abėcėle,
technologijos niekada nėra pirma, o robotika — Kristijono paties sritis — nešioja griežčiausią
įvertinimą (`C`). Interesų konflikto eilutė stovi **pirmame ekrane**, ne paslėpta metodikoje:
Kristijonas yra ExoClass bendraįkūrėjas ir robotikos būrelio savininkas, o dovana „MKK+ nemokamai"
galioja **bet kurio** būrelio vaikams.

Kiekvienas įrodymų ženklelis atidaro metodikos lapelį „Kaip vertinam įrodymus". Neigiami radiniai
sakomi taip pat garsiai kaip teigiami.

## Autorius

**Kristijonas Vasiliauskas** — [krisvas.lt](https://krisvas.lt)

## Paleisti vietoje

```bash
cd ~/mkk
python3 bin/serve.py 8765     # no-store, utf-8, Range (garsui)
open http://localhost:8765/
```

Telefono formato QA (390×844): `http://localhost:8765/qa/phone.html`

## Sudėti artefaktą

```bash
python3 bin/bundle.py         # -> dist/artifact.html
```

`dist/artifact.html` — vienas savarankiškas fragmentas be `<!doctype>/<html>/<head>/<body>`
ir be service worker'io. Turinys įdėtas kaip `window.MKK_CONTENT`.
**Garsas ir iliustracijos neįdėti** — artefaktas rodo į santykinius kelius
`audio/mkk-<band>.mp3` ir `img/<slug>.webp`, todėl publikuojant jie turi keliauti kartu.

## Struktūra

| Failas | Kas tai |
|---|---|
| `index.html` | pilnas puslapis (GitHub Pages / PWA) |
| `app.js` | visa logika, vienas IIFE, be modulių ir be framework'o |
| `styles.css` | ☀️ LIGHT numatytoji + 🌙 tamsi + temų tonai |
| `DESIGN.md` | **dizaino sistema** — Endel logika, temos kelias, judesio biudžetas |
| `content/config.json` | pavadinimas · kainos · planai · dovana · metodika · onboarding · skaitymo minutė |
| `content/techniques.json` | 37 technikos + 8 mitai su A/B/C/✗ ir šaltiniais |
| `content/practices.json` | 14 praktikų + 8 varnelės |
| `content/library.json` | knygos · dokumentika · podkastai · tyrimai · būreliai · namų įrankiai |
| `content/games.json` | 3 žaidimų tekstai ir žodžių bankai |
| `content/illustrations.json` + `img/*.webp` | 22 iliustracijos (slug → failas · alt · tonas) |
| `content/podcasts.json` + `audio/*.mp3` | 7 podcast'ai pagal amžiaus juostą |
| `bin/bundle.py` · `bin/serve.py` | artefakto surinkėjas · vietinis serveris (tik stdlib) |
| `404.html` | GitHub Pages → `./#/siandien` |

Kainos, pavadinimas ir šūkis keičiami **vienoje vietoje** — `content/config.json`.

## Ko sąmoningai NĖRA

- **Mokėjimų** — mygtukas atidaro „Netrukus" lapelį. Jokio Stripe, jokio backend'o.
- **Tikro kodų tikrinimo** — `EXO…` / `BUR…` atrakina MKK+ tik `localStorage`.
- **Tikrų priminimų** — laikas užsirašo telefone, bet pranešimai dar nesiunčiami (pasakyta ekrane).
- **Analitikos, slapukų, serverio** — nulis. Viskas lieka telefone.

---

## English (short)

**MKK (Mokymosi Meistrų Klubas)** is a Lithuanian learn-to-learn trainer for children aged 4–14.
One day is three steps and three minutes: a one-minute podcast, a two-minute practice, one check —
plus an optional one-minute reading timer. Around it: 37 techniques and 8 myths, each carrying an
A/B/C/✗ evidence badge **and its source**, three honest games, and a library.

Static HTML/CSS/JS — no framework, no build step, no server, no analytics, no cookies. Everything
stays in the browser's `localStorage`. Run it with `python3 bin/serve.py 8765`.

⚗️ Experimental prototype built with AI — it can be wrong; check anything important. Free.
Podcast voice is **Kraist, an AI version of Kris's voice**, disclosed in-app.
The tool ranks and recommends no after-school provider; the author's conflict of interest
(ExoClass co-founder, robotics club owner) is stated on the first screen.

**Kristijonas Vasiliauskas** — [krisvas.lt](https://krisvas.lt)

---

© 2026 Kristijonas Vasiliauskas. Kodas ir turinys matomi viešai — kuriama atvirai; licencija dar nepasirinkta, iki tol visos teisės saugomos. / Source is public for transparency; no licence chosen yet — all rights reserved until then.
