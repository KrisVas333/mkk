# MKK — Mokymosi Meistrų Klubas (v0.1.0)

⚠️ **Darbinis pavadinimas.** Prototipas, ne produktas. Nieko viešo — jokio repo, jokio deploy.

Mokymosi mokslo treniruoklis vaikams 4–14 m. **Trys minutės per dieną:** vienos minutės
podcast'as → dviejų minučių praktika → viena varnelė. Lietuviškai, telefonui, be serverio.

## Paleisti vietoje

```bash
cd ~/mkk
python3 bin/serve.py 8765          # no-store antraštės, kad QA nematytų seno failo
open http://localhost:8765/
```

Telefono formato QA (abu variantai greta, 390×844):

```
http://localhost:8765/qa/phone.html
```

## Artefakto bundle

```bash
python3 bin/bundle.py              # -> dist/artifact.html
```

`dist/artifact.html` yra **vienas savarankiškas fragmentas**: `<title>` → Google Fonts `<link>`
→ `<style>` → markup → `<script>`. Jame **nėra** `<!doctype>`, `<html>`, `<head>`, `<body>`
ir nėra service worker'io. Visas turinys įdėtas kaip `window.MKK_CONTENT`, todėl `fetch` nereikia.

**Garsas nėra įdėtas į bundle'ą.** Artefaktas rodo į santykinius kelius `audio/mkk-<band>.mp3`,
todėl publikuojant 7 mp3 failai turi keliauti kartu kaip supporting files tais pačiais keliais.

## Struktūra

| Failas | Kas tai |
|---|---|
| `index.html` | pilnas puslapis (GitHub Pages / PWA variantas) |
| `app.js` | visa logika, vienas IIFE, be modulių ir be framework'o |
| `styles.css` | ☀️ LIGHT numatytoji + 🌙 tamsi + akcento spalvos |
| `content/config.json` | pavadinimas · šūkis · **kainos** · planai · dovana · metodika · apie |
| `content/techniques.json` | 37 technikos + 8 mitai su A/B/C/✗ ženkleliais |
| `content/practices.json` | 14 dviejų minučių praktikų + 8 varnelės |
| `content/library.json` | knygos · dokumentika · podkastai · tyrimai · 8 būrelių sritys · namų įrankiai |
| `content/games.json` | 3 žaidimų tekstai ir žodžių bankai |
| `content/podcasts.json` + `audio/*.mp3` | **audio agento nuosavybė** — nekeisti (žr. `CONTRACT.md`) |
| `bin/bundle.py` | artefakto surinkėjas (tik stdlib) |
| `bin/serve.py` | vietinis serveris be kešo |
| `qa/phone.html` | telefono rėmelis QA |

Kainos, pavadinimas ir šūkis keičiami **vienoje vietoje** — `content/config.json`.

## Kas sąmoningai nėra padaryta

- **Mokėjimai** — mygtukas atidaro „Netrukus“ lapelį. Jokio Stripe, jokio backend'o.
- **Kodai** — `EXO…` ir `BUR…` atrakina MKK+ lokaliai (`localStorage`). Tikro tikrinimo nėra.
- **Analitika, slapukai, serveris** — nulis. Viskas lieka telefone.

## Nešališkumas

Šis įrankis **nereitinguoja ir nerekomenduoja būrelių.** Sritys rikiuojamos abėcėle,
technologijos niekada nėra pirma, o interesų konflikto eilutė stovi TEN PAT, kur dovanos kodas.
Būrelių skiltis ir mitai — nemokami visiems, nes būtent ten gyvena atskleidimas.

Prieš bet kokį viešą paleidimą — `bias` skill'as.
