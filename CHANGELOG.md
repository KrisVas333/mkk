# CHANGELOG

## v0.3.0 — 2026-09-15 (šviesi/tamsi perjungimas · lietuvių+anglų · Tinklaraštis · Apie)

Kris'o žodžiai, pagal kuriuos statyta: *„Add a light theme so you can flip. Make sure that
everything has a Lithuanian version, Lithuanian names, and is based on Lithuanian sources too,
but we're also preparing the English version. … Home screen, the training, the games, the blog,
and me. Include About the Author, About the Creator, and how this was done, and make sure it's
more like that Miegu app."*

### ☀️/🌙 Temos perjungimas viršutinėje juostoje
- **Naujas mygtukas `#themeBtn`** dešinėje nuo serijos žetono: vienas paspaudimas — šviesi ⇄ tamsi.
  Išsaugoma (`S.theme`), veikia visuose ekranuose ir lapeliuose, turi `aria-label` + `aria-pressed`,
  ikona keičiasi ☀️/🌙. **Šviesi lieka numatytoji** (brand ☀️ LIGHT).
- `effTheme()` išsprendžia „Sistema" režimą per `prefers-color-scheme`, todėl perjungimas
  visada apverčia TAI, ką žmogus mato, o ne tai, kas įrašyta.
- Senasis 3 mygtukų pasirinkimas (Sistema · Šviesi · Tamsi) lieka „Aš" — tik nebėra vienintelis kelias.

### 🇱🇹/🇬🇧 i18n sluoksnis
- **`content/i18n.json`** — 130 UI raktų dviem kalbomis (skiltys, mygtukai, etiketės, onboarding,
  planai, tuščios būsenos, klaidos, lapeliai). `app.js` naudoja `t('key')`; trūkstamas EN raktas
  nukrenta į LT, niekada į tuščią vietą.
- **`LX(obj,'field')`** ima turinio `field_en`, jei toks yra, kitaip lietuvišką originalą.
  `_en` laukai pridėti: `config.json` (istorija, planai, amžiaus juostos, onboarding, skaitymo
  minutė, kursai, atskleidimai), `techniques.json` (7 kategorijos + 5 nemokamos technikos),
  `games.json` (visi 3 — vardas, paantraštė, taisyklė), `library.json` (sekcijų vardai, būrelių įžanga).
- **Kalbos jungiklis „Aš" ekrane**, LT numatytoji, EN pažymėta **„beta"**; `<html lang>` seka kalbą.
- **Sąžininga beta riba:** 2 min praktikų tekstai ir podcast'ų skriptai kol kas lietuviški —
  angliškame režime jie pažymėti „beta: practice text in LT for now" ir
  „🎙 English version coming". Lietuviški vardai (MKK, Kraist, Mokymosi Meistrų Klubas —
  „Learning Masters Club") lieka lietuviški abiem kalbom.

### 📚 Skiltis „Biblioteka" → **„Tinklaraštis"**
- Skiltys dabar: **Šiandien · Treniruotės · Žaidimai · Tinklaraštis · Aš**
  (EN: Today · Training · Games · Blog · Me). Senas `#/biblioteka` maršrutas vis dar veikia.
- Tinklaraštyje **pirma kortelė — „Kaip naudotis MKK"** (iš `content/blog.json`, o jei jo nėra —
  įrašytas 6 žingsnių vadovas LT+EN), toliau **Straipsniai · Podcast'ai · Vaizdo įrašai**
  (`content/blog.json`) ir **„Ką sekti"** (`content/people.json`), o po jų — visos senos
  bibliotekos sekcijos (knygos · dokumentika · podkastai · tyrimai · būreliai · namų įrankiai).
- Trūkstamas failas **niekada nėra klaida** — rodoma rami tuščia būsena.
- Markdown-lite (pastraipos · `- ` sąrašai · `**bold**`) tekstams iš `blog.json`.

### 👤 „Apie" — Miegu tipo sekcija (`content/about.json`, lt+en)
- **Apie autorių** — Kristijonas Vasiliauskas, *praktikas, ne mokslininkas*; kiekviena technika su
  šaltiniu; interesų konfliktas (ExoClass · BrAIn Club · robotikos būrelis) tais pačiais žodžiais
  kaip ir dovanos eilutėje. Niekur nėra „kaip tėtis".
- **Apie kūrėją** — kaip MKK daroma: Claude Code iš Kris'o antrųjų smegenų, iliustracijos
  Higgsfield (Recraft), balsas Kraist (ElevenLabs klonas), turinys vertinamas pagal mokymosi
  mokslo kurso kriterijus; „eksperimentinis, gali klysti, grįžtamasis ryšys: krisvas.lt".
- **Kaip tai buvo padaryta** — 6 žingsnių sąžininga chronologija (idėja 09-15 00:50 → tyrimas →
  statyba → taryba: bias · personas · critic → iliustracijos → viešai).
- **Mokslininkai** — „Kviestiniai mokslininkai — netrukus" su 3 vaidmenimis. **Nė vieno tikro vardo**,
  kol jo nėra turinyje.
- **Privatumas** — atskira kortelė: nulis duomenų išeina iš telefono, jokių paskyrų, jokios
  analitikos; garsas ir paveikslėliai iš tos pačios svetainės.
- **Beta** — „Nori tapti beta testuotoju?" su nuoroda į krisvas.lt (be formos).

### 🇱🇹 LT šaltiniai
- `content/sources-lt.json` renderinamas **po** esama ŠALTINIS eilute kaip „🇱🇹 LT šaltinis"
  (technikos, mitai, žaidimai, tyrimai, būreliai). Esami šaltiniai nepaliesti.

### Kita
- `bin/bundle.py` inline'ina ir `i18n` · `about` · `blog` · `people` · `sources-lt`
  (`sources-lt` → `C.sourcesLt`); riba pakelta iki 1,8 MB. Artefaktas: **228,7 KB**.
- Versija „Aš" apačioje: `v0.3.0 · 2026-09-15`.

## v0.2.0 — 2026-09-15 (dizainas · UX · UI — „kad atrodytų kaip veikianti programėlė")

Dizaino sistema užrašyta **prieš** kodą: [`DESIGN.md`](DESIGN.md).

### Dizaino sistema
- **Endel logika.** „Šiandien" ekranas dabar yra **viena dienos „režimo" kortelė** — dienos tema
  (rotuoja per 6 kategorijas pagal datą), tos temos iliustracija, didelis šriftas ir **vienas
  raudonas mygtukas**. Jokių skaitiklių ir dashboard'ų pirmame ekrane; savaitė, statistika ir
  istorija persikėlė į „Aš".
- **Temos kelias.** Kiekviena tema turi savo nuslopintą **toną** (iš `illustrations.json`, su
  atsargine lentele kode). Tonas naudojamas TIK penkiose vietose: iliustracija · sekcijos
  brūkšnys · ženklelio žiedas · savaitės taškai · praktikos kortelės riba.
  **Raudona `#D90429` lieka vienintelis veiksmo akcentas.**
  ⚙️ Iliustracijų tonai yra pasteliniai (o `hero` buvo *pati* prekės ženklo raudona), todėl
  `clampTone()` išsaugo atspalvį, bet įtempia šviesumą/sotumą į matomą juostą abiejose temose ir
  **atmeta viską, kas per arti veiksmo raudonos**. Pilka lieka pilka (nesugalvojame atspalvio).
- **Mažas dirgiklių lygis.** Judesys ≤ 200 ms, tik `opacity`/`transform`; jokio konfeti ir
  šokinėjimo; `prefers-reduced-motion` išjungia viską ir sustabdo neuronų drobę; ≥ 24 px oro;
  ne daugiau kaip 2 šriftų dydžiai kortelėje.
- **Tipografija:** pagrindinė antraštė (`.big`) sąmoningai lieka **Inter** — priežastis užrašyta
  `DESIGN.md` §4 (disleksija-pirma prieš mono raidę). Visas kitas chrome — JetBrains Mono.

### Veikiančios programėlės pojūtis
- **Onboarding, 3 ekranai:** Kas mokosi? (amžius + nebūtinas vardas) → Kada priminti? (laiko
  žetonai) → Pradedam.
- **Keli vaikai.** Profiliai `localStorage`; kiekvienas turi savo seriją, dienas ir žaidimų
  istoriją. Perjungiama per profilio žetoną viršutinėje juostoje ir „Aš". Senas `mkk.v1`
  įrašas **migruojamas** — serija nedingsta.
- **Savaitės progresas** (7 taškai Pr–Sk), **serija**, **iš viso treniruočių**, **skaitymo min.**
- **Istorija** — iki 30 dienų, po eilutę, su tos dienos žingsnių ženklais.
- **Skeleton loader'iai** kol krenta turinys · **tuščios būsenos** su iliustracija ·
  **offline juostelė** · **iOS „Pridėti į pradžios ekraną" lapelis** · **safe-area** įtraukos ·
  lipni viršutinė juosta su profilio žetonu · versija ir data „Aš" apačioje.
- **60 fps:** laikmačiai (dėmesio · išmokyk · skaitymo minutė) atnaujina tik skaičių ir juostos
  plotį — anksčiau kas sekundę perpiešdavo visą `innerHTML`. Neuronų drobė: 26 → 18 taškų,
  ~30 fps, DPR ribotas iki 1,5.

### Iliustracijos
- 22 `img/*.webp` lizduose: hero · kiekvienos technikų kategorijos antraštė · kiekvienas žaidimas ·
  kiekviena amžiaus kortelė (onboarding + Aš) · bibliotekos sekcijos.
- `<img loading="lazy" width height alt>` + fiksuotas 3:2 santykis → **nulis layout shift'o**.
- **Trūkstamas slug'as niekada nerodo sulūžusio paveiksliuko** — generuojamas ramus inline SVG
  (to paties tono apvalintas stačiakampis + neuronų taškai). Patikrinta ir be `img/`, ir su juo.
- `bin/bundle.py` įdeda `illustrations.json` į `window.MKK_CONTENT`, bet **kelius palieka
  santykinius** (`img/<slug>.webp`) ir tikrina, kad nė vienas nebūtų absoliutus.

### Kainos (Kris patvirtino rytą)
- Nuimta **„⚠️ tikslinama"**. MKK+ rodoma **3,99 €/mėn** kaip pagrindinė ir **6,99 €/mėn** kaip
  antras variantas, be aiškinimų ekrane.
- Dovana, interesų konfliktas ir atsakomybės eilutė — **nepakitę** nuo v0.1.1.
- „Planai" kortelė dabar rodo `✓ Aktyvus`, kai MKK+ įjungtas (v0.1.1 🟡15).

### Critic 🟠 uždaryta
- **🟠4 · 14 kortelių su ženkleliu, bet be šaltinio** — visos 8 būrelių sritys ir 6 tyrimai gavo
  `src` lauką, ir **kiekvienas ženklelis dabar renderina šaltinio eilutę** (technikos, mitai,
  praktikos, žaidimai, tyrimai, būreliai, namų įrankiai). Be šaltinio ženklelis automatiškai
  nukrenta į `C` su eilute „⚠️ tikslinamas" (`evOf()` + `srcLine()`).
- **🟠5 · Kurz 2025 / AASM 2016 / Holte & Ferraro** — ⚠️ critic'as juos paskelbė nerastais, bet
  jie **yra** `wiki/research/mkk-turinio-pagrindas-2026-09.md` su DOI/nuorodomis (eil. 31, 141,
  155, 210, 233). Todėl **ne pašalinti, o tiksliai įvardyti**: pridėti žurnalai ir imtys
  (Peiffer 2020 *Scientific Reports* · Kurz 2025 *J. Sleep Research* · AASM 2016 *JCSM* ·
  Holte & Ferraro 2020 *The Social Science Journal*, n=161 · ⚠️ Dekker & Baumgartner 2024).
- **🟠6 · „Ekranai ir mąstymas (8 metų kohorta)"** — buvo be citatos; dabar
  Jalanko ir kt. 2026, *Pediatric Exercise Science* (PANIC kohorta, n=260).
- **🟠7 · „Skatins skaitymą" — prašyta, nepadaryta** — atsirado **Skaitymo minutė**: 4-as žingsnis
  „Šiandien" ekrane (sąmoningai **nebūtinas** ir serijos neskaičiuoja) + **Savaitės knyga** iš
  bibliotekos. Sąžininga eilutė ekrane: kasdienis/bendras skaitymas turi stiprius įrodymus, bet
  „viena minutė" yra MŪSŲ formatas, ne tyrimo dydis.
- **🟠9 · antraštė Inter, ne mono** — sprendimas priimtas ir **užrašytas** `DESIGN.md` §4.
- **🟠10 · `bin/serve.py` iškreipia QA** — pridėta `charset=utf-8` ir **`Range` (206) palaikymas**,
  todėl garsas ir lietuviškos raidės vietiniame serveryje elgiasi kaip artefakte.
- **🟡14 · atskleidimas buvo mažiausias tekstas ekrane** — `.coi`/`.foot`/`.note` 12–12,5 px → 13,5 px.

### Personų panelės taisymai (n=40)
- **#1 (liečia 14/40):** interesų konfliktas + AI balsas + „dovana BET KURIAM būreliui" —
  vienoje eilutėje **iškart po pagrindiniu mygtuku**, be scroll'o.
- **#2:** dienos kortelė su serija ir rotuojančiu žaidimu matoma atidarius, ne po podcast'o.
- **#3:** „Pradėti · 3 min" — vienas paspaudimas nuo atidarymo iki grojančio podcast'o.

### Turinio tikslumas
- `pasakojimas` **A → B** (bendram skaitymui įrodymai stiprūs; pačiam pasakojimui atskiros
  meta-analizės nėra — pasakyta kortelėje).
- `sokis` **B → C** (judesys/vykdomoji kontrolė turi įrodymų; šokis atskirai netirtas).
- `sportas` gavo priešpriešinį radinį: ⚠️ Ciria ir kt. 2023 — efektas ties nuliu.

### PWA / GitHub Pages
- Visi keliai santykiniai (`./`) — veikia ir iš šaknies, ir iš `/mkk/`.
- `404.html` → `./#/siandien`. `manifest.webmanifest`: `start_url` `./#/siandien`, `id`, ikonos.
- `sw.js` → `mkk-v0.2.0`, network-first turiniui, cache-first iliustracijoms ir ikonoms.

### Žinomos spragos
- Priminimo laikas **užsirašo, bet pranešimų nesiunčia** — pasakyta ekrane ⚠️.
- Podcast'ų balsas (Kraist) — **ear-check vis dar nedarytas** ⚠️.
- Mokėjimai, kodų tikrinimas serveryje, sinchronizacija tarp įrenginių — nėra ir nebuvo plane.
- Iliustracijų `alt` tekstus rašė iliustracijų agentas — **neperskaityti garsiai su ekrano skaitytuvu** ⚠️.


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

## v0.2.1 — 2026-09-15 (critic v0.2 FIX-THEN-SHIP + personos v0.2 ONE FIX)
- `qa/` išimta iš viešo repo (.gitignore) — ekrano kopijos su senu kainos užrašu ir testiniais kodais nebeviešos.
- Onboarding: amžiaus miniatiūros ir hero iliustracija kraunamos `eager` — nebelieka tuščių langelių pirmame kadre.
- Pavadinimo žyma: „⚠️ darbinis pavadinimas" → „Mokymosi Meistrų Klubas" (Kris patvirtino MKK).
- Balso eilutė be vidinio QA žymeklio; podcast'o kortelėje lieka sąžininga LT eilutė apie ausies patikrą.
- „70 % mažesnė tikimybė mesti" gavo šaltinį (Thouin 2020) abiejose vietose.
- Klaidos pranešimas tėvams be `python3 …` komandos.
- LICENCE: viešai matoma, licencija dar nepasirinkta — iki tol visos teisės saugomos (README + LICENSE suderinti).

## v0.3.1 — 2026-09-15 13:05 (builder B saugumo radiniai + repo higiena)
- Šriftai savame serveryje (`fonts/`): jokių užklausų į Google Fonts — vaikų kategorija + offline pažadas. Inter → sistemos šriftas.
- **Tėvų vartai** prieš kiekvieną išorinę nuorodą (aritmetikos klausimas suaugusiajam) — Apple Kids Category 1.3 / Google Families.
- `sw.js` versija v0.3.1 + naujas turinys (i18n, about, blog, people, sources-lt, fonts) į shell cache.
- `www/` (Capacitor staging) išimtas iš repo; `.gitignore` papildytas builder B sąrašu.
