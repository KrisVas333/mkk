# CHANGELOG

## v0.1.0 — 2026-09-15 (naktinis build)

Pirmas veikiantis MKK prototipas. Vietinis, be jokio viešo paviršiaus.

### Pridėta
- 5 skiltys: **Šiandien · Treniruotės · Žaidimai · Biblioteka · Aš** (hash-router, apatinė juosta).
- Kasdienė 3 min treniruotė: podcast'as (7 amžiaus grupės, tikri mp3) → 2 min praktika
  (rotacija pagal datą) → viena varnelė. Serija (`streak`) su „vakar“ logika.
- **„Pradėti dabar“** — vienas paspaudimas: podcast'as pradeda groti ir baigiasi
  klausimu „Ką prisimeni? 1 · 2 · 3“.
- 37 technikos + 8 mitai, kiekvienas su **A/B/C/✗** ženkleliu ir šaltiniu.
- **Metodikos lapelis** „Kaip vertinam įrodymus“ — atsidaro paspaudus BET KURĮ ženklelį.
- 3 žaidimai: Atsimink ir pasakyk (su **vakarykščiu patikrinimu** kitą dieną) ·
  Dėmesio laikmatis (2/5/10 min + sąrašas + pilko ekrano iššūkis) · Išmokyk kitą (60 s + įsivertinimas).
- Biblioteka: 5 knygos · 3 dokumentiniai · 3 podkastai · 6 tyrimai · 8 būrelių sritys · 5 namų įrankiai.
- Temos (šviesi / tamsi / sistema), 6 akcento spalvos su didelio kontrasto variantu,
  fono garsas (Web Audio, generuojamas — jokių binauralinių pažadų).
- PWA: `manifest.webmanifest`, `sw.js`, ikonos (SVG + PNG 192/512), iOS meta.
- `bin/bundle.py` → `dist/artifact.html` (106 KB, riba 1,5 MB).

### Pataisyta statant
- **Service worker'is buvo cache-first visam shell'ui** → po atnaujinimo telefone liktų senas
  failas. Perdaryta į network-first turiniui (html/css/js/json/mp3) su kešu kaip atsarginiu
  variantu offline. Ikonos lieka cache-first.
- **Atminties žaidimo tinklelis persipiešdavo per kiekvieną paspaudimą** (mirgėjimas telefone,
  paspaustas mygtukas atsijungdavo nuo DOM). Dabar atnaujinama vietoje.
- `.step` antraštė ir paantraštė lipo į vieną eilutę (`display:inline`) → `display:block`.
- Numatytoji tema pakeista iš `auto` į **šviesią** — ☀️ LIGHT yra prekės ženklo standartas
  viskam, ką mato žmogus iš išorės.

### Nešališkumo taisymai (po `bias` audito — verdiktas TAISYTI)
1. Dovana galioja **bet kurio** būrelio vaikams, ne tik ExoClass. Kodai: `EXO…` **arba** `BUR…`.
   `config.giftForAllProviders: true` — grąžinama viena eilute.
2. Būrelių sritys: **8, abėcėlės tvarka** (dailė ir amatai · gamta ir mokslas · kalbos · muzika ·
   pasakojimas · sportas · šokis · technologijos) + „Kita — parašyk, pridėsim“.
3. **Technologijos** gavo tą patį sąžiningumą kaip muzika: robotika g≈0,49 STEM mokymuisi, bet
   skaičiavimo mąstymui efektas **nereikšmingas** (g=0,079) → ženklelis **C**, „neįrodyta“.
4. Metodikos ekranas pasiekiamas nuo kiekvieno ženklelio.
5. Interesų konflikto eilutė — **prie pat dovanos kodo lauko**, ne tik skiltyje „Apie“.
6. Trumpa atsakomybės eilutė matoma **be paspaudimo** Šiandien ekrano apačioje.
7. Nemokamas planas: kasdienė treniruotė + **VISI podcast'ai** + 5 technikos + 1 žaidimas.
8. **Būrelių skiltis atrakinta nemokamai** (rasta QA metu): ji nešioja interesų konflikto
   atskleidimą, todėl negali būti už mokamos sienos.

### Turinio taisymai (po evidence scout patikros)
- ⚠️ **Kris'o padiktuotas teiginys buvo per stiprus.** „Vaikai niekada nemokomi, KAIP mokytis“
  pakeista į: Bendrosiose programose (2022) mokėjimas mokytis **įvardytas**, bet silpniausiai
  mokoma dalis yra **refleksija ir savo mokymosi strategijų vertinimas** — MKK treniruoja būtent ją.
- „Telefonas kitame kambaryje“: **A → B** (Ward 2017 su suaugusiais; 2023 m. meta-analizė —
  efektas mažesnis ir nepastovesnis).
- Pilkas ekranas: **C** (~38 min/d mažiau viename tyrime; 2024 m. pakartojimas silpnesnis;
  su vaikais netirta).
- Miegas: **A** (Peiffer 2020 · Kurz 2025 · AASM normos).
- Judesys: šaltinis patikslintas į Hillman ir kt. 2014 FITKids RCT (n=221, 7–9 m.).

### Žinomos spragos
- Kaina **nenuspręsta** — rodomos abi (3,99 / 6,99) su „⚠️ tikslinama“.
- Podcast'ų balsas — Kraist (AI Kris'o balso versija), **ear-check dar nedarytas**.
- Mokėjimai, kodų tikrinimas serveryje, sinchronizacija tarp įrenginių — nėra ir nebuvo plane.

## v0.1.1 — 2026-09-15 02:05 (critic FIX-THEN-SHIP → 5 one-line fixes)
- config.json: curriculum claim hedged (⚠️ „dar tikrinu su šaltiniais") — its source was never opened; `coiLong` typo bendraįkūrėjis→bendraįkūrėjas.
- app.js: myth cards no longer double-quoted; internal `needs-ear-check` flag rendered as a human ⚠️ line; 5/5 in the memory game gets its own honest message (100 % ≠ 70–90 % zone).
