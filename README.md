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
| `content/i18n.json` | **visos UI eilutės lt + en** (`t('key')`); trūkstamas EN krenta į LT |
| `content/about.json` | **Apie autorių · Apie kūrėją · Kaip tai buvo padaryta · Mokslininkai · Privatumas · Beta** (lt + en) |
| `content/blog.json` | Tinklaraščio įrašai: vadovas · straipsniai · podcast'ai · vaizdo įrašai |
| `content/people.json` | „Ką sekti" — žmonės, kuriuos verta sekti (🇱🇹 pažymėti) |
| `content/sources-lt.json` | 🇱🇹 LT šaltinis po technikos ŠALTINIS eilute |
| `content/podcasts.json` + `audio/*.mp3` | 7 podcast'ai pagal amžiaus juostą |
| `bin/bundle.py` · `bin/serve.py` | artefakto surinkėjas · vietinis serveris (tik stdlib) |
| `404.html` | GitHub Pages → `./#/siandien` |

Kainos, pavadinimas ir šūkis keičiami **vienoje vietoje** — `content/config.json`.

### Skiltys (v0.3)

**Šiandien · Treniruotės · Žaidimai · Tinklaraštis · Aš.** Tinklaraštis sujungia naujus įrašus
(`blog.json`, pirmas — „Kaip naudotis MKK") ir „Ką sekti" (`people.json`) su senomis bibliotekos
sekcijomis. Senas `#/biblioteka` maršrutas vis dar veikia.

### Kalbos ir tema

- **🇱🇹 Lietuvių — pilna versija. 🇬🇧 English — beta** (ilgi tekstai: praktikos ir podcast'ų
  skriptai kol kas lietuviški, ir tai parašyta ekrane). Jungiklis — „Aš" ekrane; `<html lang>` seka.
- **☀️/🌙 mygtukas viršutinėje juostoje** — vienas paspaudimas apverčia temą; šviesi numatytoji.

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

Five sections: **Today · Training · Games · Blog · Me**. The interface ships in **Lithuanian
(complete) and English (beta)** — switch it in *Me*; long texts (practices, podcast scripts) are
still Lithuanian and say so. A **light/dark toggle sits in the top bar**; light is the default.
*Me* also carries the Miegu-style About: **About the author · About the creator · How this was
made · Scientists (invited, not yet named) · Privacy · Beta**.

Static HTML/CSS/JS — no framework, no build step, no server, no analytics, no cookies. Everything
stays in the browser's `localStorage`. Run it with `python3 bin/serve.py 8765`.

⚗️ Experimental prototype built with AI — it can be wrong; check anything important. Free.
Podcast voice is **Kraist, an AI version of Kris's voice**, disclosed in-app.
The tool ranks and recommends no after-school provider; the author's conflict of interest
(ExoClass co-founder, robotics club owner) is stated on the first screen.

**Kristijonas Vasiliauskas** — [krisvas.lt](https://krisvas.lt)

---

© 2026 Kristijonas Vasiliauskas. Kodas ir turinys matomi viešai — kuriama atvirai; licencija dar nepasirinkta, iki tol visos teisės saugomos. / Source is public for transparency; no licence chosen yet — all rights reserved until then.

---

## Store build (iOS · Android)

The web app above **is** the store app. [Capacitor](https://capacitorjs.com) wraps the same
static build in a native shell — no rewrite, no framework, no second codebase.

```bash
npm install                      # once
npx playwright test              # 5 e2e specs, must be 5/5
bash bin/build-store.sh          # sanity → tests → stage www/ → cap sync → next steps
npx cap open android             # needs Android Studio + SDK + Java
npx cap open ios                 # needs the full Xcode, not Command Line Tools
```

| | |
|---|---|
| App ID | `lt.krisvas.mkk` |
| App name | MKK |
| webDir | `www/` — a disposable mirror built by `bin/build-web.sh`. Capacitor rejects `"."`, and it would otherwise copy `node_modules/` onto the phone. **The repo root is untouched:** `python3 bin/serve.py` and GitHub Pages work exactly as before. |
| Native projects | `android/` (Gradle) · `ios/` (Xcode, Swift Package Manager — no CocoaPods) |
| Store art | `resources/icon.png` 1024² (no alpha) · `resources/splash.png` / `splash-dark.png` 2732², regenerate with `node resources/make-resources.mjs`, then `npx @capacitor/assets generate` for every size |
| Tests | `tests/*.spec.mjs`, `playwright.config.mjs`, CI in `.github/workflows/test.yml` (tests only — Pages deploy is unchanged and still branch-based) |

**Read before touching the stores:**

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — now → target, data model, what changes when accounts arrive
- [`docs/STORE-CHECKLIST.md`](docs/STORE-CHECKLIST.md) — accounts, costs, forms, Kids Category, LT+EN store copy, **% ready table**
- [`docs/TEST-AND-SAFETY.md`](docs/TEST-AND-SAFETY.md) — test runs, kids-safety audit, security audit, tools to learn

**Two open blockers before any store submission** (both in `app.js`/`index.html`):
Google Fonts is a third-party request that also breaks offline · four external links have no
parental gate. Details and fixes in `docs/TEST-AND-SAFETY.md` §3.

Nothing here publishes, uploads, or signs anything. `bin/build-store.sh` stops at
"open the IDE"; the store steps are Kris's, by design.
