# MKK — testai, vaikų sauga, saugumas

**Paleista:** 2026-09-15, ~10:20 EEST · **Mašina:** macOS 25.6, node 24.14.1, npm 11.11.0
**Kaip pakartoti:** `npx playwright test` (serveris pasileidžia pats)

---

## 1. ✅ Automatiniai e2e testai — PALEISTA, 5/5 PRAEINA

Playwright 1.x, Chromium headless, **Pixel 7 viewport**, `locale=lt-LT`,
`timezone=Europe/Vilnius`, prieš `http://localhost:8765` (`bin/serve.py` — tas pats serveris,
kurį naudojame rankiniam QA, su byte-range ir utf-8).

```
Running 5 tests using 1 worker

  ✓  1 tests/01-onboarding-streak.spec.mjs › a new user can onboard and close the day (8.3s)
  ✓  2 tests/02-games.spec.mjs            › every game opens and renders its board (3.9s)
  ✓  3 tests/03-gift-code.spec.mjs        › a valid code unlocks MKK+ and a bad one does not (5.2s)
  ✓  4 tests/04-theme-persist.spec.mjs    › theme choice persists across reloads (5.5s)
  ✓  5 tests/05-offline-shell.spec.mjs    › the app still works with the network offline (3.9s)

  5 passed (27.7s)
```

| # | Testas | Ką realiai įrodo |
|---|---|---|
| 01 | onboarding → serija | Švarus įdiegimas rodo onboarding'ą · profilis sukuriamas su teisinga amžiaus grupe · **trys** žingsniai (ne keturi) uždaro dieną · serija tampa 1 ir `localStorage`, ir antraštėje · išlieka po perkrovimo |
| 02 | žaidimai | Skaito `content/games.json` ir atidaro **kiekvieną** žaidimą (ne imtį) · lenta atsivaizduoja ir nėra tuščia · su MKK+ nelieka nė vienos 🔒 spynos |
| 03 | dovanos kodas | Blogas kodas **neatrakina** · `exo2026` mažosiomis normalizuojamas į `EXO2026` · išlieka po perkrovimo · išjungiamas atgal |
| 04 | tema | `data-theme` persijungia ir **išlieka** abiem kryptim (dark→light) |
| 05 | offline | Service worker užsiregistruoja · su `context.setOffline(true)` kevalas, tab'ai ir turinys vis dar veikia · naudotojui parodomas offline pranešimas, o ne klaida |

**Testų dizaino taisyklė:** selektoriai naudoja tik `data-act` ir stabilius `id` —
**jokio** lietuviško teksto tikrinimo, nes tekstą valdo builder A ir jis keisis.

**Ko testai NEpadengia (⚠️ sąžiningai):**
- Tikras iOS/Android WebView (tik Chromium)
- Garso atkūrimas (headless Chromium nepaleidžia mp3 patikimai)
- Skaitymo minutės ir žaidimų laikmačiai (60 s realaus laiko)
- Kelių profilių perjungimas
- Realus telefonas, realūs pirštai, realus vaikas

---

## 2. ✅ Lighthouse — PALEISTA (v13.4.1, desktop preset, headless)

| Kategorija | Balas |
|---|---|
| Performance | **97** |
| Accessibility | **100** |
| Best Practices | **96** |
| SEO | **100** |

| Metrika | Reikšmė |
|---|---|
| First Contentful Paint | 1.0 s |
| Largest Contentful Paint | 1.1 s |
| Total Blocking Time | **0 ms** |
| Cumulative Layout Shift | **0** |
| Speed Index | 1.0 s |

Praėję a11y auditai: `color-contrast` · `html-has-lang` · `image-alt` · `button-name` ·
`link-name` · `csp-xss`. Pilnas JSON: `docs/lighthouse.json` (necommit'inamas).

**Vienintelis nulis:** `errors-in-console` (96 vietoj 100) — trys 404 dėl `content/blog.json`,
`content/people.json`, `content/sources-lt.json`, kurių paleidimo metu dar nebuvo. **Failai
nuo tada atsirado ir klaidų nebėra** — pakartotinis patikrinimas: `CONSOLE ERRORS / 4xx: none`.
Perpaleidus Lighthouse Best Practices turėtų būti 100. ⚠️ Perpaleisti prieš pateikimą.

---

## 3. 👶 Vaikų saugos auditas — PALEISTA

Metodas: grep per `app.js`, `sw.js`, `index.html` + realus tinklo srauto stebėjimas
per Playwright (`page.on('request')`).

| Tikrinimas | Rezultatas | Įrodymas |
|---|---|---|
| Trečiųjų šalių analitika | ✅ **0** | `gtag` 0 · `analytics` 0 · `googletagmanager` 0 · `navigator.sendBeacon` 0 |
| Facebook / reklamos pikseliai | ✅ **0** | `facebook` 0 · `pixel` 0 |
| Reklama | ✅ **nėra** | Jokio ad SDK, jokio ad slot'o |
| Pokalbiai / žinutės | ✅ **nėra** | `WebSocket` 0 |
| Naudotojų turinys (UGC) | ✅ **nėra** | Vienintelis įvedimas — vaiko vardas ir dovanos kodas, abu lieka `localStorage` |
| Failų įkėlimas | ✅ **nėra** | Nėra `<input type=file>` |
| Slapukai | ✅ **0** | `document.cookie` 0 |
| `eval()` | ✅ **0** | — |
| Tinklo užklausos iš app'so | ✅ **1 tipas** | `fetch('./content/<n>.json')` — **savas origin** |
| Service worker | ✅ saugus | `if (url.origin !== location.origin) return;` — SW **atsisako** kešuoti svetimus origin'us |
| **Realiai kontaktuoti origin'ai** | 🔴 **3** | `localhost:8765` ✅ · **`fonts.googleapis.com`** 🔴 · **`fonts.gstatic.com`** 🔴 |
| Išorinės nuorodos | 🔴 **4 be tėvų vartų** | `app.js` 278 · 850 · 885 · 1080 (visos `target="_blank" rel="noopener"`) |

### 🔴 Radinys 1 — Google Fonts yra trečiosios šalies užklausa

`index.html` kviečia `fonts.googleapis.com`, kuris toliau traukia `fonts.gstatic.com`.
Kiekviena tokia užklausa perduoda Google **vaiko įrenginio IP adresą ir User-Agent**.

- **Kodėl svarbu:** griežtai kalbant, dėl to negalima sąžiningai pažymėti „Data Not Collected"
  Apple privatumo etiketėje ir „No data collected" Play Data safety anketoje.
- **Kodėl dar svarbiau:** Capacitor kevale šriftai vis tiek **neužsikraus offline** — o offline
  yra visas MKK pažadas. Dabar tai dar ir vizualinis bug'as telefone be ryšio.
- **Pataisymas (builder A, ~30 min):** atsisiųsti JetBrains Mono + Inter `.woff2` į `fonts/`,
  įrašyti `@font-face` į `styles.css`, pašalinti `<link>` iš `index.html`, pridėti failus
  į `sw.js` SHELL sąrašą. **Vienu ėjimu išsprendžia privatumą IR offline.**

### 🔴 Radinys 2 — išorinės nuorodos be parental gate

Keturios `target="_blank"` nuorodos (šaltiniai, knygos, žmonių profiliai, būrelio CTA)
išveda vaiką iš app'so tiesiai į naršyklę.

- **Kodėl svarbu:** Apple Kids Category to **neleidžia** — reikia parental gate. Google Play
  Families politika reikalauja to paties išoriniams saitams.
- **Pataisymas (builder A, ~45 min):** perimti paspaudimą → parodyti lapą su tėvų klausimu
  („Įvesk skaičių žodžiais: **keturiasdešimt septyni**") → atidaryti tik teisingai atsakius.
  Vienas bendras handler'is padengia visas keturias vietas.

### ⚪ Pastebėjimas — dovanos kodo logika

Kodas tikrinamas kliente: `/^(EXO|BUR)/.test(v) && v.length >= 4`. Jį trivialu apeiti.
**Tai sąmoninga ir teisinga** kol MKK+ nemokamas ir kol tikslas — kad kodus gautų
**bet kuris** būrelis. Kai atsiras realūs pinigai, tikrinimas turės persikelti į serverį.
(Nešališkumo pastaba: dovanos kortelėje interesų konfliktas įvardytas **ten pat** —
atitinka standing rule 14.)

---

## 4. 🔒 Saugumo auditas — PALEISTA

### `npm audit`

```
uuid  <11.1.1  — Missing buffer bounds check in v3/v5/v6 when buf is provided
  GHSA-w5hq-g745-h8pq  (moderate)
  node_modules/uuid → xcode → @capacitor/cli

3 moderate severity vulnerabilities
```

**Vertinimas: nerizikinga, netaisyti dabar.** Visos trys — ta pati `uuid` grandinė
**@capacitor/cli devDependency** viduje. Ji sukasi tik Kris'o mašinoje `cap sync` metu ir
**niekada nepatenka į telefoną** — į app'są keliauja tik `www/` statiniai failai.
`npm audit fix --force` pakeistų Capacitor 8.5 → 8.4 (breaking), t. y. **padarytų daugiau žalos
nei pataisytų**. Perkontroliuoti, kai Capacitor išleis pataisymą.
**Produkcijos priklausomybių: 0.** Pati aplikacija neturi nė vienos npm bibliotekos.

### Service worker scope

Registruojamas kaip `./sw.js` su `scope = /mkk/` (GitHub Pages) arba `/` (Capacitor).
`fetch` handler'is **anksti atmeta** svetimus origin'us, todėl SW negali tapti
trečiųjų šalių atsakymų kešu. ✅

⚠️ **Versijos neatitikimas:** `sw.js` deklaruoja `mkk-v0.2.0`, app'sas yra v0.3.
Nepabump'inus, grįžtantys naudotojai gaus seną cache. Vieno simbolio pataisymas, builder A.

### CSP rekomendacija

CSP dabar **nėra**. GitHub Pages neleidžia siųsti antraščių, todėl reikia `<meta>` varianto.
**Įdėti į `index.html` po 1.6 pataisymo** (su savais šriftais `font-src 'self'` užtenka):

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob:;
  media-src 'self';
  font-src 'self';
  connect-src 'self';
  frame-src 'none';
  object-src 'none';
  base-uri 'self';
  form-action 'none'">
```
⚠️ `'unsafe-inline'` skriptams kol kas **būtinas** — `index.html` turi inline SW registraciją,
o `app.js` generuoja HTML per `innerHTML`. Griežtesnė CSP yra atskiras refaktoringas.
**Prieš įjungiant — perleisti visus 5 e2e testus**, CSP tyliai laužo dalykus.

### Prieinamumas (a11y)

`axe-core` **neįdiegtas** — automatinio a11y skenavimo **nebuvo**. Lighthouse a11y = 100,
bet tai tik dalis tiesos. Rankiniu būdu patikrinta iš kodo:

| Patikra | Rezultatas |
|---|---|
| `<html lang="lt">` | ✅ |
| `aria-label` ant ikoninių mygtukų (profilis, serija, uždaryti) | ✅ |
| `role="dialog"` + `aria-modal` lape | ✅ |
| `role="status"` + `aria-live="polite"` toast'ui ir offline juostai | ✅ |
| `aria-pressed` perjungiamiems chip'ams | ✅ |
| `alt` tekstas iliustracijoms (`content/illustrations.json`) | ✅ |
| Dekoratyvinis canvas `aria-hidden="true"` | ✅ |
| `<main tabindex="-1">` fokusui po maršruto keitimo | ✅ |
| Kontrastas | ✅ Lighthouse |
| **Klaviatūros navigacija** | ⚠️ **nepatikrinta** |
| **Realus VoiceOver / TalkBack** | ⚠️ **nepatikrinta — reikia telefono** |
| **Disleksijai draugiškas tipografijos dydis realiame telefone** | ⚠️ **nepatikrinta** |

---

## 5. 🧰 Įrankiai ir įgūdžiai, kurių reikia — su mokymosi laiku

| Įrankis | Kam | Būsena | Kris'ui mokytis | Kaina |
|---|---|---|---|---|
| **Capacitor** | Web → native kevalas | ✅ įdiegta, veikia | 1 val. (užtenka 3 komandų) | 0 € |
| **Node 24 + npm** | Įrankiams | ✅ yra | 0 | 0 € |
| **Playwright** | e2e testai | ✅ įdiegta, 5/5 | 30 min (skaityti ataskaitą) | 0 € |
| **Lighthouse** | Našumas / a11y | ✅ veikia per npx | 15 min | 0 € |
| **Xcode** | iOS build + signing | 🔴 **NĖRA** (tik CLT) | **3–4 val.** pirmam archive | 0 €, ~50 GB disko |
| **Apple Developer Program** | TestFlight + App Store | 🔴 nėra | 1 val. | **~99 $/m** |
| **Android Studio + SDK** | Android build + AAB | 🔴 **NĖRA** | **2–3 val.** | 0 €, ~6 GB |
| **Java JDK** | Gradle | 🔴 **NĖRA runtime** | 15 min (ateina su Android Studio) | 0 € |
| **Google Play Console** | Play leidyba | 🔴 nėra | 2 val. (anketos) | **25 $ vienkartinai** |
| **`keytool` / keystore** | Android pasirašymas | 🔴 nėra | 30 min | 0 € |
| **@capacitor/assets** | Visų dydžių ikonos | ✅ paleista (118 Android + 13 iOS) | 10 min | 0 € |
| **RevenueCat** | Prenumeratos parduotuvėse | ⬜ vėliau | 4–6 val. | Nemokama iki ~2,5 k $/mėn |
| **Stripe** | MKK+ web'e | ⬜ vėliau | Kris jau moka | ~1,4 % + 0,25 € |
| **Fastlane** | Automatinis įkėlimas | ⬜ **nereikia dabar** | 4 val. | 0 € |
| **axe-core / @axe-core/playwright** | Automatinis a11y | ⬜ rekomenduoju | 30 min | 0 € |
| **Sentry ar pan.** | Klaidų sekimas | ⛔ **NEDĖTI** | — | — (vaikų kategorija) |

**Neuron'o skill'ai, kurie čia prisijungia:** `bias` (privalomi vartai prieš viešą paleidimą —
MKK turi būrelio dovanos kodą, todėl **privalo** praeiti) · `personas` (kainos ir onboarding'o
testas su LT tėvais) · `rate` (parduotuvių tekstai) · `critic` (patikrinimas prieš pateikimą) ·
`promo-video` (App Store peržiūros video, nebūtinas).

---

## 6. 🚦 Prieš kiekvieną store build'ą — kontrolinis sąrašas

```bash
npx playwright test              # turi būti 5/5
npm audit                        # nauji high/critical = stop
bash bin/build-store.sh          # sanity → stage → cap sync
```
Plius rankomis: ar `sw.js` versija pabump'inta · ar 1.6 ir 1.7 padaryti · ar `bias` skill'as
praleido · ar `docs/STORE-CHECKLIST.md` % lentelė atnaujinta.

---

## 7. Santrauka vienu žvilgsniu

| | |
|---|---|
| ✅ **Veikia ir patikrinta** | 5/5 e2e · Lighthouse 97/100/96/100 · offline · 0 analitikų · 0 reklamų · 0 slapukų · 0 produkcijos priklausomybių |
| 🔴 **Blokuoja store** | Google Fonts (trečioji šalis + laužo offline) · 4 išorinės nuorodos be parental gate |
| 🟡 **Reikėtų, bet neblokuoja** | CSP · `sw.js` versijos bump · axe-core · ekrano nuotraukos |
| ⚠️ **Netikrinta** | Realus iOS/Android WebView · garsas · laikmačiai · klaviatūra · VoiceOver/TalkBack · realus vaikas |

> CI: `docs/ci/test.yml` → nukopijuoti į `.github/workflows/test.yml` per GitHub UI (Neuron'o token'as be `workflow` scope; arba `gh auth refresh -s workflow`).
