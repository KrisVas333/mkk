# MKK → App Store + Google Play: žingsnis po žingsnio

**Atnaujinta:** 2026-09-15 · **Tikslas:** TestFlight beta + Google Play internal testing
**Bundle ID / Application ID:** `lt.krisvas.mkk` (jau įrašyta `capacitor.config.json`)
**App name:** MKK · **Primary language:** Lietuvių · **Antra lokalizacija:** English

> ⚠️ **Skaityk kaip planą, ne kaip faktą.** Kainos, ekrano nuotraukų dydžiai ir politikos
> tekstai čia surašyti iš žinomos praktikos, o **ne** patikrinti gyvai prieš rašant šį failą.
> Kiekvienas žingsnis, kurį atliekant matai kitokį skaičių — pataisyk čia pat.
> Tai pirmas Kris'o app'sas parduotuvėse: laikyk 2× laiko atsargą.

---

## 0. Ką reikia nuspręsti PRIEŠ pradedant (Kris, 20 min)

| Sprendimas | Variantai | Rekomendacija |
|---|---|---|
| **Apple paskyros tipas** | Individual vs Organization | **Individual.** Organization reikalauja D-U-N-S numerio (nemokamas, bet 5–14 d. laukimo) ir teisinio subjekto pavadinimo parduotuvėje. Individual = Kristijono vardas kaip leidėjas, paleidžia šiandien. Persikelti į Organization vėliau **galima, bet skausminga** (nauja paskyra + app transfer). |
| **Leidėjo vardas parduotuvėje** | „Kristijonas Vasiliauskas" vs įmonė | Individual → asmenvardis. Jei tai problema (nori „ExoClass" ar „BrAIn"), tada **reikia** Organization + D-U-N-S → +2 sav. |
| **Kids Category ar ne** | Taip / Ne | **Rekomendacija: NE.** Žr. §4 — Kids Category duoda matomumą, bet uždeda griežčiausią App Review režimą. Amžiaus reitingas 4+ be Kids Category dalies duoda 80 % naudos už 20 % skausmo. Kris sprendžia. |
| **Ar iOS iš viso šį mėnesį** | Taip / tik Android | Android kelias pigesnis (25 $ vienkartinis) ir neblokuojamas Xcode. Jei laikas spaudžia — **Android pirmas**. |

---

## 1. Paruošiamieji darbai kode (Neuron, jau padaryta / dar reikia)

| # | Žingsnis | Kas | Min | Kaina | Būsena / blokatorius |
|---|---|---|---|---|---|
| 1.1 | Capacitor scaffold (`package.json`, `capacitor.config.json`) | Neuron | — | 0 € | ✅ padaryta |
| 1.2 | `android/` native projektas | Neuron | — | 0 € | ✅ `npx cap add android` pavyko |
| 1.3 | `ios/` native projektas | Neuron | — | 0 € | ✅ `npx cap add ios` pavyko (Capacitor 8 naudoja SPM, CocoaPods nereikia) |
| 1.4 | App icon 1024² + splash 2732² | Neuron | — | 0 € | ✅ `resources/` |
| 1.5 | Visų dydžių ikonos/splash'ai | Neuron | 10 | 0 € | ⬜ `npm i -D @capacitor/assets && npx @capacitor/assets generate` |
| 1.6 | **Self-host'inti Google Fonts** | builder A | 30 | 0 € | 🔴 **BLOKATORIUS** — trečiosios šalies užklausa vaikų app'se |
| 1.7 | **Parental gate prieš išorines nuorodas** | builder A | 45 | 0 € | 🔴 **BLOKATORIUS** — Apple 1.3 / Kids reikalavimas |
| 1.8 | Privatumo politikos puslapis `#/privatumas` | builder A | 30 | 0 € | ⏳ vykdoma šią bangą |
| 1.9 | Local Notifications priminimui (18:00) | Neuron | 60 | 0 € | ⬜ nebūtina pirmam beta |
| 1.10 | `sw.js` versijos bump prie v0.3 | builder A | 2 | 0 € | ⬜ |

---

## 2. 🍏 Apple — nuo nulio iki TestFlight

### 2a. Paskyra ir įrankiai

| # | Žingsnis | Kas | Min | Kaina | Blokatorius |
|---|---|---|---|---|---|
| 2.1 | Apple ID su **dviejų veiksnių autentifikacija** | Kris | 10 | 0 € | — |
| 2.2 | Užsiregistruoti į **Apple Developer Program** (developer.apple.com/programs) | Kris | 20 | **~99 $ / 99 € per metus** | Reikia banko kortelės; patvirtinimas **24–48 val.**, kartais iki 7 d. |
| 2.3 | Priimti sutartis App Store Connect → Agreements, Tax, and Banking | Kris | 15 | 0 € | **Be to app'sas net nemokamas nebus pateikiamas** |
| 2.4 | **Įdiegti Xcode** (App Store, ~10 GB + ~40 GB vietos build'ams) | Kris | **60–120** | 0 € | 🔴 **DABAR YRA TIK Command Line Tools** — be Xcode iOS build'o nėra apskritai |
| 2.5 | Xcode → Settings → Accounts → prisijungti Apple ID | Kris | 5 | 0 € | po 2.2 |

### 2b. App Store Connect įrašas

| # | Žingsnis | Kas | Min | Kaina | Pastaba |
|---|---|---|---|---|---|
| 2.6 | Certificates, IDs & Profiles → **Identifiers** → naujas App ID `lt.krisvas.mkk` | Kris | 10 | 0 € | Capabilities: nieko nereikia (nei Push, nei Sign in with Apple) |
| 2.7 | App Store Connect → **My Apps → +** → New App | Kris | 10 | 0 € | Platform iOS · Name „MKK" · Primary Language **Lithuanian** · Bundle ID iš 2.6 · SKU `mkk-001` |
| 2.8 | Xcode → atidaryti `ios/App/App.xcworkspace` → Signing & Capabilities → **Automatically manage signing** + Team | Kris | 10 | 0 € | Xcode pats sukuria sertifikatą ir provisioning profilį — **nereikia rankomis daryti .p12** |
| 2.9 | Version 0.3.0, Build 1 | Neuron/Kris | 5 | 0 € | Kiekvienam TestFlight įkėlimui Build **privalo** didėti |
| 2.10 | Product → **Archive** → Distribute App → App Store Connect → Upload | Kris | 20 | 0 € | Pirmas kartas beveik visada duoda klaidą — žr. §6 |
| 2.11 | Palaukti „Processing" ir export compliance atsakymo | — | 15–60 | 0 € | Atsakymas apie šifravimą: **naudojame tik standartinį HTTPS → „No"** išimtis galioja |

### 2c. Metaduomenys (pildoma lygiagrečiai, reikia ir beta peržiūrai)

| # | Laukas | Limitas | Kas | Min |
|---|---|---|---|---|
| 2.12 | App name | 30 simb. | Kris | 5 |
| 2.13 | Subtitle | 30 simb. | Kris | 5 |
| 2.14 | Promotional text | 170 simb. | Kris | 5 |
| 2.15 | Description | 4000 simb. | Kris | 20 |
| 2.16 | Keywords | 100 simb. (kableliais, be tarpų) | Kris | 15 |
| 2.17 | **Support URL** + **Privacy Policy URL** | — | Kris | 5 |
| 2.18 | **App Privacy** („nutrition label") | — | Kris | 20 |
| 2.19 | **Age Rating** anketa | — | Kris | 10 |
| 2.20 | Ekrano nuotraukos | žr. §5 | Neuron | 45 |

**Privacy nutrition label — MKK atsakymai (šiandien, be paskyrų):**
> **Data Collection: No** — „We do not collect data from this app."
> Tai galima pasakyti **tik** įvykdžius 1.6 (Google Fonts). Su išoriniu šriftu tiesa nebe tokia švari.

**Age Rating anketa — visi atsakymai „None" / „No":** be smurto, be azarto, be naudotojų
turinio, be neribojamos interneto prieigos, be reklamos. → **4+**.

### 2d. TestFlight

| # | Žingsnis | Kas | Min | Pastaba |
|---|---|---|---|---|
| 2.21 | **Internal Testing** — iki 100 App Store Connect narių | Kris | 10 | **Peržiūros nereikia**, build'as pasiekiamas iškart |
| 2.22 | **External Testing** — grupė + **iki 10 000** testuotojų | Kris | 15 | Reikia **Beta App Review** (paprastai 24–48 val.) |
| 2.23 | „What to Test" tekstas kiekvienam build'ui | Kris | 5 | Privalomas external grupei |
| 2.24 | **Public Link** — vieša nuoroda, kurią galima dalinti FB/IG | Kris | 2 | Įjungiama grupės nustatymuose po 2.22; galima riboti testuotojų skaičių |
| 2.25 | Testuotojai įsidiegia TestFlight app'są ir paspaudžia nuorodą | testuotojai | 5 | Build'as galioja **90 dienų** |

---

## 3. ▶️ Google Play — nuo nulio iki internal testing

| # | Žingsnis | Kas | Min | Kaina | Blokatorius |
|---|---|---|---|---|---|
| 3.1 | Google Play Console paskyra | Kris | 20 | **25 $ vienkartinai** | Asmens tapatybės patvirtinimas — **1–3 dienos**, kartais ilgiau |
| 3.2 | **Įdiegti Android Studio** (~1 GB + SDK ~5 GB) | Kris | 45 | 0 € | 🔴 **DABAR NĖRA nei Android SDK, nei Java runtime** |
| 3.3 | `npx cap open android` → Gradle sync | Kris/Neuron | 20 | 0 € | Pirmas sync atsiunčia Gradle + SDK komponentus |
| 3.4 | Sukurti **upload keystore** (`keytool -genkey`) | Kris | 10 | 0 € | 🔴 **Pamesi — nebeatnaujinsi app'so.** Į 1Password + atsarginė kopija |
| 3.5 | Įjungti **Play App Signing** | Kris | 5 | 0 € | Google saugo pasirašymo raktą, tu — tik upload raktą |
| 3.6 | Build → Generate Signed Bundle → **AAB** | Kris | 15 | 0 € | Play nebepriima APK naujiems app'sams |
| 3.7 | Play Console → Create app: MKK · Lietuvių · App · **Free** | Kris | 10 | 0 € | „Free" sprendimas **negrįžtamas** |
| 3.8 | **Internal testing** track → įkelti AAB → pridėti testuotojų el. paštus | Kris | 15 | 0 € | **Peržiūros beveik nereikia**, pasiekiama per ~1 val. — greičiausias kelias į realų telefoną |
| 3.9 | **App content** anketos (žr. žemiau) | Kris | 60 | 0 € | Be jų nepereisi iš internal į closed/open |
| 3.10 | **Closed testing: 12 testuotojų × 14 dienų be pertrūkio** | Kris | — | 0 € | 🔴 **Asmeninėms (ne įmonės) paskyroms privaloma** prieš production. Realiai +3 sav. į kalendorių. Įmonės paskyrai netaikoma |
| 3.11 | Production access paraiška | Kris | 30 | 0 € | Po 3.10; Google klausia apie testavimo rezultatus |

### 3a. „App content" anketos (3.9 detaliai)

| Anketa | MKK atsakymas | Min |
|---|---|---|
| **Privacy policy** | `https://krisvas333.github.io/mkk/#/privatumas` | 2 |
| **Ads** | **Nėra reklamos** | 1 |
| **App access** | Visas turinys pasiekiamas be prisijungimo; MKK+ kodas `EXO2026` pridedamas kaip testavimo instrukcija | 5 |
| **Content ratings** (IARC anketa) | Viskas „No" → PEGI 3 / ESRB Everyone | 15 |
| **Target audience and content** | **Amžiaus grupės: iki 5, 6–8, 9–12, 13–15** → app'sas patenka į **Families** politiką | 10 |
| **Data safety** | **No data collected · No data shared** (galioja tik įvykdžius 1.6) | 15 |
| **Government apps / Financial / Health** | Ne | 2 |
| **Families policy** (auto, kai target audience < 13) | Reikia: tinkamas turinys · **jokių trečiųjų šalių reklamų** · **jokio duomenų rinkimo be tėvų sutikimo** · atitinkami SDK | 10 |

---

## 4. 👶 Kids Category — ką tai reiškia (Apple)

Kids Category yra **atskiras pasirinkimas** App Store Connect'e, ne tas pats, kas 4+ reitingas.
Įėjęs į jį, gauni matomumą Kids skiltyje, bet prisiimi **griežčiausią** režimą:

| Reikalavimas | MKK dabar | Ką daryti |
|---|---|---|
| **Jokių trečiųjų šalių analitikų** | ✅ nulis (patikrinta grep'u) | — |
| **Jokių trečiųjų šalių reklamų** | ✅ nėra | — |
| **Jokio asmens duomenų rinkimo be patikrinamo tėvų sutikimo** | ✅ nieko nerenkame | Nekeisti be DPIA |
| **Parental gate** prieš išorines nuorodas | 🔴 **NĖRA** — 4 `target="_blank"` nuorodos | 1.7 |
| **Parental gate** prieš pirkimus | ⚪ n/a | Būtina, kai atsiras MKK+ IAP |
| **Trečiųjų šalių užklausos apskritai** | 🔴 Google Fonts | 1.6 |
| Privatumo politika prieinama app'se | ⏳ builder A | 1.8 |
| Peržiūros laikas | — | Kids app'sai peržiūrimi **lėčiau ir atidžiau**; atmetimas pirmu bandymu yra norma |

**Parental gate standartas (ką Apple priima):** veiksmas, kurio 4 metų vaikas neatliks —
pvz. „Įvesk skaičių žodžiais: **keturiasdešimt septyni**" arba matematikos veiksmas su
skaičiais žodžiais. **Nepriimama:** paprastas „Ar tu tėvas? Taip/Ne" mygtukas.

**Verdiktas:** pirmam beta paleidimui — **4+ reitingas BE Kids Category**. Įvykdyti 1.6 ir 1.7
vis tiek (jie gerina app'są ir yra būtini Play Families politikai), bet nedėti savęs į
griežčiausią peržiūros eilę, kol app'sas nėra realiuose telefonuose.

---

## 5. 📸 Ekrano nuotraukos ir grafika

> ⚠️ Dydžius **patikrinti App Store Connect'e prieš gaminant** — Apple juos keičia.

| Parduotuvė | Kas reikia | Dydis | Kiek |
|---|---|---|---|
| App Store | iPhone 6.9" | **1290 × 2796** (arba 1320 × 2868) | 3–10, min 3 |
| App Store | iPad 13" | 2064 × 2752 | tik jei palaikomas iPad |
| App Store | App icon | 1024 × 1024, **be alfa kanalo** | ✅ `resources/icon.png` |
| Play | Telefonas | 16:9 arba 9:16, 320–3840 px kraštinė | **min 2**, iki 8 |
| Play | **Feature graphic** | **1024 × 500** | 1, **privalomas** |
| Play | App icon | **512 × 512** PNG | 1 |

**Kaip pagaminti (Neuron, ~45 min):** Playwright jau įdiegtas ir moka daryti bet kokio
dydžio ekrano nuotraukas — `resources/make-resources.mjs` yra veikiantis pavyzdys.
Scenarijus: onboarding · Šiandien kortelė · žaidimas · biblioteka · serija.

---

## 6. ✍️ Parduotuvių tekstai — juodraščiai

> Sąžiningumo taisyklė (rule 14): AI balsas įvardijamas, eksperimentinė būsena įvardijama,
> ExoClass interesų konfliktas įvardijamas **ten pat**, kur dovanos kodas.

### 🇱🇹 App Store

**Name (30):** `MKK — Išmok mokytis` *(19)*
**Subtitle (30):** `3 minutės per dieną` *(19)*
**Promotional text (170):**
`Eksperimentinė versija. Kasdien po vieną 3 minučių žingsnį: pasiklausyk, išbandyk, atsakyk. Veikia be interneto, be reklamų, be paskyros.`

**Description:**
```
MKK — Mokymosi Meistrų Klubas. Programėlė vaikams 4–14 m. ir jų tėvams apie
tai, KAIP mokytis: atmintis, dėmesys, susikaupimas, miegas, judėjimas.

KAS DIENĄ TRYS ŽINGSNIAI (apie 3 minutes):
1. Pasiklausyk trumpo įrašo pagal savo amžių
2. Išbandyk vieną praktiką
3. Atsakyk į vieną klausimą — diena užsidaro, serija auga

Yra ir ketvirtas, laisvai pasirenkamas žingsnis — skaitymo minutė.
Ji sąmoningai NEskaičiuojama į seriją: skaitymas neturi tapti spaudimu.

TAIP PAT:
· 3 žaidimai atminčiai, dėmesiui ir mokymui kitą
· Biblioteka: technikos su šaltiniais ir įrodymų lygiu
· Keli vaikai viename telefone
· Šviesus ir tamsus režimas

SĄŽININGAI:
· Programėlė yra EKSPERIMENTINĖ. Ji gali klysti.
· Įrašus skaito DIRBTINIO INTELEKTO balsas, ne žmogus.
· Ji NERENKA jokių duomenų. Viskas lieka tavo telefone.
· Ji NĖRA medicininis ar psichologinis vertinimas.
· Autorius Kristijonas Vasiliauskas yra ExoClass bendraįkūrėjas ir
  robotikos būrelio savininkas. MKK nereitinguoja ir nerekomenduoja
  būrelių. MKK+ kodus nemokamai gali gauti BET KURIS būrelis.

Nemokama. Be reklamų. Veikia be interneto.
Klausimai ir kritika: krisvas.lt
```

**Keywords (100):** `mokymasis,atmintis,dėmesys,vaikams,mokykla,technikos,susikaupimas,mokslas,tėvams,pratimai`

### 🇬🇧 App Store (EN)

**Name:** `MKK — Learn How to Learn` *(24)*
**Subtitle:** `Three minutes a day` *(19)*
**Description (santrauka):**
```
MKK is a small daily habit for kids aged 4–14 and their parents: three minutes,
three steps — listen, try one practice, answer one question. Memory, attention,
focus, sleep, movement — the science of learning, in plain words.

HONEST NOTES:
· This app is EXPERIMENTAL and can be wrong.
· The audio is read by an AI voice, not a human.
· It collects NO data. Everything stays on your device.
· It is not a medical or psychological assessment.
· The author co-founded ExoClass and owns a robotics club. MKK does not rank
  or recommend after-school clubs, and MKK+ codes are free for ANY provider.

Free. No ads. Works offline.
```

### ▶️ Google Play

**App name (30):** `MKK — Išmok mokytis`
**Short description (80):** `3 minutės per dieną: atmintis, dėmesys, susikaupimas. Be reklamų, be interneto.` *(78)*
**Full description (4000):** tas pats tekstas kaip App Store aukščiau.

---

## 7. Dažniausios klaidos, kurių tikėtis (kad nenustebtum)

1. **Xcode Archive → „No account for team"** → Xcode Settings → Accounts, pridėk Apple ID; palauk, kol 2.2 patvirtinta.
2. **„Invalid Bundle. Missing Info.plist key"** → Capacitor projekte trūksta `NSMicrophoneUsageDescription` ir pan. MKK nenaudoja jokių jautrių API, tad neturėtų kilti.
3. **Play: „Your app targets API level X"** → `android/variables.gradle` → `targetSdkVersion` turi atitikti tų metų reikalavimą.
4. **Play: AAB atmestas dėl `android:debuggable`** → naudok release build variantą.
5. **TestFlight build „Processing" >2 val.** → dažniausiai export compliance atsakymo laukimas.
6. **Atmetimas 5.1.4 (Kids) / 1.3** → tai bus dėl 1.6 arba 1.7. Padaryk juos iš anksto.

---

## 8. 📊 Kiek esame pasiruošę — sąžininga lentelė

| Sritis | Būsena | % | Įrodymas |
|---|---|---|---|
| **Web app veikia** | ✅ done | **100 %** | 5/5 Playwright testai · Lighthouse perf 97 / a11y 100 / BP 96 / SEO 100 |
| **Offline veikimas** | ✅ done | **100 %** | `tests/05-offline-shell.spec.mjs` praeina su `setOffline(true)` |
| **Capacitor konfigūracija** | ✅ done | **100 %** | `capacitor.config.json`, appId `lt.krisvas.mkk` |
| **Android native projektas** | ✅ done | **100 %** | `android/` sugeneruotas, `cap sync` pavyko |
| **iOS native projektas** | ✅ done | **100 %** | `ios/` sugeneruotas (SPM, be CocoaPods) |
| **Store ikona + splash (šaltiniai)** | ✅ done | **100 %** | `resources/icon.png` 1024² be alfa, `splash*.png` 2732² |
| **Visų dydžių ikonos** | 🟡 partial | **20 %** | Komanda žinoma (`@capacitor/assets`), nepaleista |
| **Automatiniai testai** | ✅ done | **100 %** | 5 e2e + CI workflow |
| **Saugumo / vaikų saugos auditas** | ✅ done | **90 %** | `docs/TEST-AND-SAFETY.md`; 2 radiniai atviri |
| **Privatumo politikos puslapis** | 🟡 partial | **50 %** | builder A kuria `#/privatumas` šią bangą |
| **Parental gate** | 🔴 not started | **0 %** | 4 nuorodos be vartų |
| **Šriftai self-hosted** | 🔴 not started | **0 %** | Google Fonts `index.html` |
| **Store tekstai LT + EN** | 🟡 partial | **70 %** | Juodraščiai §6; Kris netvirtino |
| **Ekrano nuotraukos** | 🔴 not started | **0 %** | Įrankis yra (Playwright), scenarijus nepaleistas |
| **Apple Developer paskyra** | 🔴 not started | **0 %** | 99 $/m, 24–48 val. |
| **Xcode įdiegtas** | 🔴 not started | **0 %** | Tik Command Line Tools |
| **Google Play Console paskyra** | 🔴 not started | **0 %** | 25 $, 1–3 d. tapatybės patikra |
| **Android Studio + SDK + Java** | 🔴 not started | **0 %** | Nei SDK, nei Java runtime |
| **Signing keystore** | 🔴 not started | **0 %** | Kris turi sukurti ir saugiai išsaugoti |
| **App Store Connect / Play įrašai** | 🔴 not started | **0 %** | Po paskyrų |
| **Data safety / privacy anketos** | 🔴 not started | **0 %** | Atsakymai paruošti §2c ir §3a — belieka suvesti |

### Suvestinė

| Kelias | Pasiruošimas | Kas liko |
|---|---|---|
| **🌐 Web / PWA** | **~95 %** | Tik 1.6 + 1.7 + privatumo puslapis |
| **▶️ Google Play (internal testing)** | **~45 %** | Techninė pusė padaryta; trūksta paskyros, SDK, keystore, anketų |
| **🍏 App Store (TestFlight)** | **~40 %** | Techninė pusė padaryta; trūksta paskyros, Xcode, metaduomenų, nuotraukų |

**Realus laikas iki pirmo beta testuotojo telefone:**
**Android ~5–8 darbo val. Kris'o laiko + 1–3 d. laukimo.**
**iOS ~8–12 val. + 1–2 d. laukimo (iš jų 1–2 val. vien Xcode atsisiuntimas).**
