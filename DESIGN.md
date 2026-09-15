# MKK — dizaino sistema v0.2.0

**Updated:** 2026-09-15 · Autorius: Kristijonas Vasiliauskas · ☀️ LIGHT (brand default)

## 5 prielaidos, su kuriomis dirbta
1. **Auditorija:** tėvas arba 8–14 m. vaikas telefone (390×844), lietuviškai, pirmas kartas — be instrukcijų.
2. **Rezultato forma:** veikianti programėlė `~/mkk` (statinis HTML/CSS/JS, be framework'o) + `dist/artifact.html`; ne dizaino makėtas.
3. **Skaičiai:** kainos 3,99 €/mėn ir 6,99 €/mėn (Kris patvirtino rytą) · įrodymų šaltiniai tik iš `wiki/research/mkk-turinio-pagrindas-2026-09.md`, `kursas-mokymosi-mokslas-2026-09.md`, `bureliai-science.md` — jokių naujų.
4. **Už rėmų:** mokėjimai, serveris, tikras kodų tikrinimas, tikri push priminimai, deploy į GitHub Pages (tik paruošimas), iliustracijų generavimas (kitas agentas).
5. **Baigtumo kriterijus:** 0 konsolės klaidų · pilna dienos kilpa iki 🔥1 · profilių perjungimas išlieka po perkrovimo · `dist/artifact.html` < 1,5 MB.

---

## 1. Endel logika — vienas sprendimas, tada iš kelio

Endel atidaromas ir klausia vieno dalyko: **kokia nuotaika**. Tada groja. MKK daro tą patį:

```
atidarai  →  VIENA dienos kortelė  →  VIENAS raudonas mygtukas
```

- **Šiandien = dienos „režimo" kortelė.** Dienos tema (rotuoja per 6 kategorijas pagal datą), tos temos iliustracija, didelis šriftas, vienas raudonas mygtukas „Pradėti · 3 min".
- **Jokių dashboard'ų pirmame ekrane.** Savaitės taškai, istorija, iš viso treniruočių — visa tai gyvena „Aš", ne „Šiandien".
- Trys žingsniai (podcast'as · praktika · varnelė) rodomi **po** kortele, tyliai, kaip sąrašas — ne kaip pirmas dalykas, kurį matai.
- Ketvirtas žingsnis — **Skaitymo minutė** — pažymėtas „nebūtina": jis nedalyvauja serijos skaičiavime.

## 2. Temos kelias (per-topic design path)

Kiekviena tema turi savo **nuslopintą toną**. Tonas ateina iš `content/illustrations.json` lauko `tone`; jei slug'o nėra — iš `TONE` atsarginės lentelės `app.js`.

| Tema | slug | tonas (atsarginis) |
|---|---|---|
| Kaip smegenys mokosi | `brain-learns` | `#5B6B8C` |
| Top 3 technikos | `top3` | `#7A6A9E` |
| Atmintis | `memory` | `#2F7A66` |
| Dėmesys | `attention` | `#A06A34` |
| Fokusas | `focus` | `#8C4F55` |
| Koncentracija | `concentration` | `#66754A` |
| Mitai | `myths` | `#6E6E6E` |
| Miegas | `sleep` | `#4A5585` |
| Judesys | `movement` | `#3E7F8C` |
| Skaitymas | `reading` | `#8A6440` |
| Pilkas ekranas | `phone-grayscale` | `#6E6E6E` |

**Kur tonas naudojamas (ir tik ten):**
1. iliustracija (ji pati nupiešta tuo tonu) arba SVG placeholder'is,
2. sekcijos antraštės **brūkšnys** (3 px kairėje),
3. įrodymų ženklelio **žiedas** (`box-shadow: 0 0 0 1px tone`),
4. savaitės **taškai**,
5. 2 min praktikos kortelės **kairė riba**.

**Tonas niekada nėra tekstas ir niekada nėra mygtukas.** Raudona `#D90429` lieka VIENINTELIS veiksmo akcentas — vienas raudonas mygtukas viename ekrane. Taip gaunam „kiekviena tema turi savo kelią" be chaoso: tas pats skeletas, kitas tonas + kita iliustracija.

Tonas įrašomas kaip `--tone` CSS kintamasis ant `.scr` arba `.topic` konteinerio — todėl visa sekcija persidažo viena eilute.

## 3. Mažas stimuliavimas (žemas dirgiklių lygis)

- **Jokio konfeti, jokio šokinėjimo, jokio blyksėjimo.** Serijos pakėlimas — tylus toast'as, ne animacija.
- Judesys tik `opacity` + `transform`, **≤ 200 ms**, `ease-out`. Perėjimai tarp ekranų 180 ms.
- `@media (prefers-reduced-motion: reduce)` išjungia VISAS animacijas ir sustabdo neuronų drobę (piešiamas vienas statinis kadras).
- Neuronų drobė: 18 taškų, ~30 fps, `opacity .05` šviesiame / `.07` tamsiame.
- **Ne daugiau kaip 2 šrifto dydžiai vienoje kortelėje** (etiketė mono 11 px + turinys).
- **≥ 24 px oro:** kortelės `padding: 24px`, tarpai tarp kortelių 16 px, sekcijų tarpai 32 px.
- Disleksijai: body 17 px, klausimai 21 px+, `line-height` 1.55, atskleidimo eilutės pakeltos iš 12 px į **13,5 px** (buvo mažiausias tekstas ekrane — v0.1.1 critic 🟡14).

## 4. Tipografija — kodėl pagrindinė antraštė lieka Inter

Brand kanonas sako „JetBrains Mono antraštėms + Inter body". MKK **`.big` (pagrindinė antraštė) palieka Inter** — sąmoningas sprendimas:

- Kanonas tame pačiame faile sako **„dyslexia-first tipografija"**, o mono šriftas 30 px ilgame lietuviškame sakinyje („Išmok mokytis. Kasdien po 3 minutes.") su `letter-spacing` kremta skaitomumą būtent disleksijai.
- Visas kitas chrome — logotipas, `.lbl`, `.h2`, mygtukai, skaičiai, laikmačiai, kainos, ženkleliai — **yra JetBrains Mono**, todėl prekės ženklo DNR matoma iš pirmo žvilgsnio.
- Taisyklė: **mono = UI ir skaičiai · Inter = žmogaus sakiniai.** Tai vienintelis nukrypimas nuo raidės ir jis užrašytas čia, kad nebūtų „tyliai".

## 5. Veikiančios programėlės pojūtis

| Elementas | Kaip padaryta |
|---|---|
| Onboarding | 3 ekranai: **Kas mokosi?** (amžius + nebūtinas vardas) → **Kada priminti?** (laiko žetonai, lokalūs, ⚠️ pranešimų dar nesiunčia) → **Pradedam** |
| Keli vaikai | Profiliai `localStorage`, perjungiami per profilio žetoną viršuje ir „Aš" · kiekvienas turi SAVO seriją, dienas, žaidimus |
| Savaitės progresas | 7 taškai (Pr–Sk), serija, „iš viso treniruočių" — „Aš" ekrane |
| Istorija | Atvirkštinė chronologija, po eilutę dienai, su tos dienos žingsnių ženklais |
| Skeleton | Pilkos juostos, kol krenta `content/*.json` (`fetch` kelias) |
| Tuščios būsenos | Iliustracija + viena rami eilutė + vienas veiksmas |
| Offline | Juostelė po antrašte („Neprisijungta. Viskas veikia — turinys jau telefone.") |
| iOS | „Pridėti į pradžios ekraną" lapelis su 3 žingsniais; rodomas tik iOS Safari, ne standalone |
| Safe-area | `env(safe-area-inset-*)` antraštėje, juostoje, lapeliuose ir `#view` šonuose |
| Viršutinė juosta | Lipni, su profilio žetonu (kairėje) ir serija (dešinėje) |
| Versija | `v0.2.0 · 2026-09-15` — „Aš" ekrano apačioje |
| 60 fps | Laikmačiai atnaujina TIK skaičių ir juostos plotį (buvo `innerHTML` kas sekundę); drobė 30 fps; jokio layout thrash |

## 6. Iliustracijos

- Lizdai: **hero** (dienos kortelė) · kiekvienos technikų kategorijos antraštė · kiekvienas žaidimas · kiekviena amžiaus kortelė (onboarding + Aš) · bibliotekos sekcijos.
- Renderinama `<img loading="lazy" width height alt>` iš `content/illustrations.json`.
- **Trūkstamas slug'as niekada nerodo sulūžusio paveiksliuko** — generuojamas ramus inline SVG (apvalintas stačiakampis to paties tono + neuronų taškai ir linijos).
- Fiksuotas santykis 3:2 + **`object-fit: contain`** ant balto padėklo → nieko neapkerpama
  (piešiniai yra linijinė grafika ant balto su daug oro; `cover` juostoje nukirpdavo patį veikėją).
  44 px mini ikonos — atvirkščiai, `cover` su `object-position: center 58%`, nes `contain` tokiame
  dydyje sumažina veikėją iki nematomumo.
- 🌙 Tamsioje temoje piešinio padėklas pritemdomas iki `opacity:.62` — tampa ramiu pilku skydeliu,
  o piešinys lieka **toks, koks nupieštas**. Alternatyva `filter:invert(1) hue-rotate(180deg)`
  atrodo gražiau ant juodo, bet **perspalvina vaikus** iliustracijose — tai Kris'o sprendimas,
  ne tylus numatytasis. Vienos eilutės perjungimas `styles.css`.

## 7. Nešališkumas ir sąžiningumas (nesikeičia, tik matomiau)

- Atskleidimo eilutė (interesų konfliktas + AI balsas + „dovana veikia BET KURIAM būreliui") — **pirmame ekrane, po mygtuku, be scroll'o** (personų panelės THE ONE FIX, liečia 14/40).
- Kiekviena technika, mitas, žaidimas, būrelių sritis ir tyrimas rodo **šaltinį**. Jei šaltinio nėra — ženklelis nukrenta į `C` ir po juo parašyta „šaltinis tikslinamas".
- Būrelių sritys — abėcėle, technologijos niekada ne pirmos, robotika su blogiausia žyma.
- `tool-disclaimer` eilutė (AI · eksperimentinis · gali klysti · nemokamas · laukiam grįžtamojo ryšio) — „Šiandien" apačioje ir „Aš" ekrane.
