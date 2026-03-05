# DAJANA AI - Plan Razvoja

> **Za novi chat:** Referencuj ovaj fajl sa `@PLAN.md` i reci koja faza je trenutna.
>
> **⚠️ PRAVILO:** Pri **svakoj** promeni koda ažuriraj ovaj PLAN.md (Trenutni Status, checkboxes u fazama, novi fajlovi). PLAN mora uvek odražavati stvarno stanje projekta.

---

## Trenutni Status

**Aktivna faza:** Faza 5 (AI Video) ✅ | Faza 8 (Push – video notifikacije) 🔄 Delimično  
**Dizajn status:** 💎 **PREMIUM UI** — Splash ✅ | Welcome ✅ | Auth, Onboarding ✅ | Tabs, Home ✅ | Profile ✅ | Light/Dark tema ✅ | AI Try-On ✅ | AI Video ✅ | AI Savetnik ✅  

**Šta smo dodali (UI dorada):**
- **Splash:** GIF logo u `SplashContent.tsx`, 5.5 s → Welcome. **Pozadina uvek bela:** `SplashContent` container i root wrapper u `_layout.tsx` imaju `backgroundColor: '#ffffff'` (nezavisno od teme); `app.json` splash već ima `#ffffff`.
- **Welcome:** DAJANA/AI (TG Valtica), **video u pozadini** (`welcome-dajana-wave.mp4`), LinearGradient overlay. Video: blagi **zoom + pomeranje ka gore** (`scale: 1.14`, `translateY: -32`) da se Runway logo u donjem desnom uglu odseče; `fullScreenOptions={{ allowsFullscreen: false }}` (umesto deprecated `allowsFullscreen`). **Pravilo hookova:** svi hookovi (useState, useRef, useCallback, useEffect, useVideoPlayer) na početku komponente, early return za ulogovanog/gosta **posle** hookova. Swipe traka "Započni", header SR/ENG desno gore.
- **Light/Dark tema:** `stores/themeStore.ts`, `contexts/ThemeContext.tsx`, `getColors(mode)` u `theme.ts`. Tema na Welcome i u **Profilu (Settings)**; **svi ekrani** prate izabranu temu (background, surface, text). **ThemeContext:** eksportovan `ThemeContextValue`, `useTheme(): ThemeContextValue` (da TypeScript prepozna `colors`).
- **Home (INDYX-inspired):** Hero centriran; levo notifikacije, desno kalendar + settings; padajući hero blok (krediti). **Outfit detail modal** (tap na outfit iz sekcije Outfit): fullscreen karusel kada ima više stavki (swipe levo/desno), krem pozadina; **desno dole** siva **animirana strelica** (chevron-right, Reanimated loop 0→8px→0) kao hint za swipe; brojač „1 / N”; zatvaranje X.
- **Navigacija:** Root Stack u `app/_layout.tsx` — (auth) Welcome/Intro/Login/Register/Forgot, (onboarding) mere/body-type/analiza/sezona/complete, (tabs) Home/Capsule/Videos/AI Savetnik/Profile, plus **calendar**, **edit-profile** (modal), **outfit/[id]**.
- **Tab bar:** **Wardrobe Rail** navigacija (`components/WardrobeRailTabBar.tsx`) — šipka, kukice, tilt/spring animacije; tabovi: Home, Capsule, Videos, AI Savetnik, Profile; Kapsula u sredini sa slikom `logo_za_kapsulu.png`. Tab layout u `app/(tabs)/_layout.tsx` sa custom tab barom i header stilom (tema).
- **Kalendar:** Stranica `app/calendar.tsx` — mesečni prikaz (grid 7×6), prev/next mesec, paleta belo/zlatno/krem; ulaz sa Home preko ikone kalendara (desno u heroju).
- **Profile:** Opcija **Tema** (ThemeToggle) u sekciji podešavanja + premium redesign (hero card, avatar ring, grupisani meni).
- **Onboarding (analiza boja / complete):** Ispravljena greška "colors doesn't exist" — u `complete.tsx` i `season.tsx` dodat `useTheme()` i fallback `bgColor = colors?.background ?? COLORS.background` za pozadinu; u `ThemeContext.tsx` eksportovan tip i povratna vrednost za `useTheme()`.
- **AI Savetnik (Atelier entry flow pre chata):** Novi 3-screen „Entering Dajana’s Atelier“ (Intro → Occasion → Preview → Chat), krem baza + brand green/gold, smooth fade/slide tranzicije i suptilan sheen na primarnim dugmićima.
- **Chat (ai-advice) – UX:** tab bar skriven na Dajana tabu + header back dugme za izlaz na Home; bubble radius 24, muted-green user bubble, input placeholder „Opiši kako želiš da izgledaš danas…“.

**GitHub:** https://github.com/lakarijeprvovencani/dajana-ai

**Poslednje izmene (PLAN):** Guest flow (Nastavi kao gost → Home, modal „Napravite profil“); AI Try-On više ekrana (welcome → upload → generating → result), fullscreen krem; Welcome video zoom (Runway logo odsečen); outfit modal swipe strelica (animirana); notifikacije bez upozorenja za gosta. Ranije: Atelier flow, Video Studio, Faza 5/8, Kapsula, cream paleta.

**Guest (Nastavi kao gost):**
- **Intro:** Na poslednjem slideu dugme „Nastavi kao gost“ → `setGuest(true)` + `router.replace('/(tabs)')` → Home.
- **Root layout:** Gost sme samo **(tabs)** ili **(auth)** — kada nije ni u tabovima ni na auth (npr. onboarding), redirect na `/(tabs)`. Kada je na (auth), nema redirecta, da može **nazad** sa Home da izađe (back → intro → welcome → zatvori app).
- **Zaštićeno:** Tab bar (Kapsula, Video, Dajana, Profil) i sve akcije sa Home (open Capsule, otvaranje videa, notifikacije, kalendar, krediti, edit-profile, kartica „Dopuni profil“) otvaraju **GuestBlockModal** — naslov „Napravite profil“, poruka da samo prijavljeni mogu da koriste sadržaj, dugmad Prijavi se / Registruj se.
- **Notifikacije:** Za gosta se ne prikazuje upozorenje; za neulogovanog (bez gost flag) samo `console.log` „Obavestenja će biti dostupna nakon prijave.“ (`lib/notificationService.ts` + `useAuthStore.getState().isGuest`).

**AI Try-On (Faza 4) — Implementacija:**
- **Flow:** Kapsula / Ormar → **try-on welcome** (`/try-on` index) → Upload slika lica → Generating → Result. Welcome: fullscreen krem, naslov „AI Try-On“, tekst „Slikajte lice za najbolji rezultat…“, dugme „Dalje“.
- **Navigacija:** `app/try-on/_layout.tsx` → **index** (welcome) → upload → generating → result (fullScreenModal). Ulaz iz Kapsule/Ormara: `router.push('/try-on')`.
- **Upload ekran:** ScrollView, eksplicitni safe area insets (`useSafeAreaInsets`), animacije (FadeInDown za header/garderoba, FadeIn za photo area, FadeInUp za dugmad). Visina zone za sliku: `Math.min(SCREEN_HEIGHT * 0.48, 420)`.
- **Generating:** Krem pozadina (#F8F4EF), zlatni progress/dots (#CF8F5A).
- **Slika (try-on) detail na Home:** Fullscreen modal, krem pozadina (HOME_CREAM), zatvaranje X i tag (datum) u krem/zlatnom stilu.
- **AI Engine, Store, Servis, Krediti:** kao ranije (Gemini, tryOnStore, tryOnService, creditService).
- **Dizajn:** Krem (#F8F4EF) na welcome, upload, generating, result; zlatni akcenti.

**Sezonske palete (client-materijal):**
- **`constants/seasonPalettes.ts`** — za svih 12 sezona: HEX boje (kompletna paleta iz PDF-a) + parovi „Ako korisnica kaže” → „AI odgovara” (uključujući Tamna zima – dva odgovora za „Ne sviđaju mi se boje”).
- **`constants/seasons.ts`** — `SEASONS[id].colors` se automatski puni iz `getSeasonPalette(id)` (palete dostupne svuda gde se koristi sezona).
- **`lib/aiAdvisorService.ts`** — `findAiResponseForSeason(season, userMessage)`: kada poruka korisnice odgovara triggeru (npr. „Crna mi je sigurna”, „Ne volim boje”), u system prompt se ubacuje preporučeni odgovor da Dajana koristi taj ton/savet.
- Eksportovane funkcije: `getSeasonPalette(season)`, `getAllSeasonPalettes()`, `findAiResponseForSeason(season, userMessage)`.

---

## 📋 Šta smo radili (sesija – od notifikacija nadalje)

Sve izmene: danas (video + push), ranije Kapsula, outfit flow, try-on result, chat i prva poseta.

### Danas: AI Video (Faza 5) + Push notifikacije (Faza 8) + UX

- **Video u pozadini:** Posle klika „Generiši Video“ korisnik ostaje na **punom loading ekranu** (tri prstena, progress bar, „~X min preostalo“) ili može da izađe dugmetom **„Nastavi u pozadini“** → prelaz na Videos tab; generisanje nastavlja, stiže notifikacija kada je gotovo.
- **GeneratingOverlay:** Pun overlay sa animacijom, progress barom (iz store-a), hintom „Možeš ostati ovde ili izaći“ i dugmetom „Nastavi u pozadini“ (zlatni outline).
- **Expo Notifications:** `expo-notifications`, `expo-task-manager`, `expo-background-fetch`; dozvole, Android kanali (Video spreman, DAJANA AI); token u Supabase `push_tokens`; EAS projectId u app.config.js; admin šalje push preko `/api/send-push`; ikona notifikacija = app icon (app.config.js).
- **Lokalne notifikacije:** „DAJANA AI – Tvoj video je spreman! Pogledaj sada.“; tap → otvara `/video-result` (deep link handler u `_layout`).
- **Globalni poller:** `VideoBackgroundPoller` u `_layout.tsx` – poll svakih 10 s dok postoji `backgroundJob`; kada je video spreman: download, save, notifikacija, navigacija na video-result; floating pill „Video se kreira ~X min“ na svim ekranima.
- **Videos tab:** Banner „Video se kreira ~X min“ (GeneratingBanner) kada je job aktivan.
- **Video Studio (videos.tsx) – redizajn iz chata:**
  - **Gore:** Box „Generisane slike“ (levo) → krivina → dugme **„Kreiraj video“** (manje, manji padding i font, pomereno desno: `btnLeft = boxW + curveW - 52`).
  - **Linija:** Jedna **vertikalna linija** od ispod dugmeta do horizontalne linije **„Kolekcija“** — tanka (`strokeWidth: 1.2`), blago skraćena od gore (14px razmak ispod dugmeta).
  - **Uklonjeno:** Donji box „Generisani videi“, horizontalna linija udesno od njega, modal za swipe kroz videe.
  - **Kolekcija:** Sekcija „Kolekcija“ (linija + naslov + linija) malo dignuta (`marginTop: SPACING.sm`), ispod nje FlatList sačuvanih videa (tap = otvori video, long press = obriši).
  - Cream pozadina (#F8F4EF), zlatni/linija akcenti, Playfair/Josefin fontovi.
- **Novi fajlovi:** `lib/notificationService.ts`, `lib/backgroundVideoTask.ts`; ažurirani `stores/videoStore.ts` (backgroundJob, bgPollAttempt, startBackgroundJob, completeBackgroundJob, clearBackgroundJob).
- **Ažurirani fajlovi:** `app/video-generate.tsx` (ostanak na overlay-u, GeneratingOverlay + dugme), `app/_layout.tsx` (NotificationSetup, VideoBackgroundPoller, FloatingVideoIndicator), `app/(tabs)/videos.tsx` (Video Studio: box slika + Kreiraj video + vertikalna linija do Kolekcije, galerija, GeneratingBanner), `app.json` (expo-notifications plugin).
- **PLAN.md:** Faza 5 označena ✅ DONE, Faza 8 🔄 Delimično (video notifikacije); tabela faza ažurirana.

### Ranije: Notifikacije i navigacija
- **Tab bar (Wardrobe Rail):** pozadina u **cream** (#F8F4EF) kao na Kapsuli i Home.
- **Home:** pozadina **cream** (#F8F4EF), usklađeno sa Kapsulom i navigacijom.

### Kapsula (Capsule) – kompletna redizajn
- **Pozadina:** cream #F8F4EF (cel ekran).
- **Header:** Playfair naslov "Kapsula", tagline "Tvoja garderoba", tanka zlatna linija; bez default tab bara (`headerShown: false`).
- **Tabovi:** pill stil (Browse | Saved) sa **klizajućim zlatnim indikatorom** (Reanimated, ~200 ms).
- **Kategorije:** horizontalni scroll uklonjen; **jedan dropdown** "Kategorija: [trenutna]" → modal sa listom kategorija.
- **Filter čipovi:** "Za mene" (body type), "Moja sezona" (season); cream/krem kartice, zlatni akcent.
- **Grid:** dva stupca, veći razmak (gap 14px), dodat padding.
- **Floating bar:** kad korisnik izabere outfit(e) – cream kartica (#FFFCF9), zlatno dugme **strelica** → vodi na **Outfit Preview**; fade-in animacija.

### Outfit kartica (OutfitCard)
- **Gradient + naslov:** `expo-linear-gradient` na dnu slike, naslov **beli preko gradijenta** (nije ispod slike).
- **Izgled:** border radius 20px, senka, pozadina kartice #FFFCF9.
- **Srce (save):** u poluprovidnom krugu u uglu.
- **Animacije:** scale 0.98 pri pritisku (Reanimated spring); **staggered fade-in** pri učitavanju (delay po indeksu).

### Outfit Preview (nova stranica)
- **Ruta:** `app/outfit-preview.tsx` (modal).
- **Sadržaj:** grid izabranih komada (slika + naslov, X za uklanjanje); ispod **"Šta želiš da napraviš?"** – dva kartona: **Slika** (AI Try-On) i **Video** (5s animacija).
- **Dizajn:** cream pozadina, zlatni akcenti, Playfair za naslove.

### Outfit Detail (outfit/[id].tsx)
- **"Dodaj" → "Napravi outfit":** dugme vodi na **Outfit Builder** (ne samo dodaje u store).
- **Dizajn:** cream pozadina, **kartica** za sadržaj (#FFFCF9, zaobljena, senka), Playfair naslov, tagovi u zlatnoj nijansi, donji bar cream sa zlatnim dugmićima.

### Outfit Builder (nova stranica – "Kombin Dene")
- **Ruta:** `app/outfit-builder.tsx` (modal).
- **Slotovi:** vertikalno 4 slota – Jakna (outerwear), Gornji deo (tops), Donji deo (bottoms), Obuća (accessories).
- **Prazan slot:** kružno dugme "+" (dashed zlatna ivica); klik otvara **bottom sheet** sa listom komada iz ormara (po tagu kategorije).
- **Popunjen slot:** slika komada, X za uklanjanje.
- **CTA:** "Isprobaj" na dnu → puni tryOnStore i vodi na **Outfit Preview** (Slika/Video).
- **Ulaz:** iz outfit detail ("Napravi outfit") ili sa Kapsule (strelica na floating baru ako ima izabranih).

### Try-On Result (try-on/result.tsx) – full-screen redizajn
- **Gornji bar uklonjen** – samo zatvaranje (X) i suptilan "DAJANA AI" branding.
- **Slika:** **cel ekran** (white bg, `resizeMode: contain`), bez okvira.
- **Desna strana:** floating kolona dugmića – Srce (sačuvaj), Video, D (Pitaj Dajanu), Podeli.
- **Dole:** manji red – Ponovo, Početna (cream/krem, zlatne ikone).
- **Dizajn:** bela pozadina, zlatni akcenti, elegantni fontovi.

### Chat (Pitaj Dajanu – ai-advice.tsx)
- **Pozadina i kartice:** ista **cream paleta** kao Kapsula – CHAT_CREAM, CHAT_CARD, CHAT_BORDER, CHAT_INPUT_BG; baloni, input traka, modal "Izaberi sliku" u toj paleti.
- **First-launch animacija (prva poseta chata):**
  - **Uslov:** AsyncStorage ključ **po korisniku** `dajana_chat_first_visit_${userId}` – ako nije `'false'`, prikazuje se animacija (novi nalog = nova prva poseta).
  - **Početak:** veliki avatar "D" u centru (cream pozadina, zlatni border), **typewriter** tekst: "Zdravo [ime]. Spremna sam da ti pomognem." (sporiji ispis ~95 ms/karakter, luksuzniji osećaj).
  - **Pauza:** 1,4 s nakon završenog teksta.
  - **Tranzicija (Reanimated):** avatar se smanjuje i pomera u header poziciju (~1,2 s); greeting fade out; chat (header + lista + input) fade in iz dna (~0,6 s); overlay fade out → AsyncStorage set `'false'` za tog usera.
  - **Tipografija:** Playfair, letter-spacing, centriran tekst u dva reda.
- **Entering Dajana’s Atelier (pre-chat):** 3 ekrana pre chata (Intro → Occasion → Preview) u `components/atelier/AtelierFlow.tsx`, integrisano u `app/(tabs)/ai-advice.tsx` (step state).
- **Navigacija (kada je tab bar sakriven):** header back dugme na chatu vodi na Home (`router.replace('/(tabs)')`).
- **Chat UI polish:** bubble radius 24, muted-green user bubble, input placeholder „Opiši kako želiš da izgledaš danas…“.

### Novi / ažurirani fajlovi (sesija)
- **Danas (video + notifikacije):** `lib/notificationService.ts`, `lib/backgroundVideoTask.ts`; `stores/videoStore.ts` (background job state); `app/video-generate.tsx` (GeneratingOverlay, „Nastavi u pozadini“); `app/_layout.tsx` (NotificationSetup, VideoBackgroundPoller, FloatingVideoIndicator); `app/(tabs)/videos.tsx` (GeneratingBanner); `app.json` (expo-notifications plugin).
- `app/outfit-preview.tsx` – preview izabranih + Slika/Video izbor.
- `app/outfit-builder.tsx` – slotovi, bottom sheet picker, CTA Isprobaj.
- `app/_layout.tsx` – rute `outfit-preview`, `outfit-builder`; + notifikacije i poller (danas).
- `app/(tabs)/capsule.tsx` – cream, header, pill tabs, dropdown kategorija, floating bar sa strelicom.
- `app/(tabs)/index.tsx` – cream pozadina; Home sekcija Video (danas).
- `app/(tabs)/ai-advice.tsx` – cream paleta, first-visit animacija, per-user AsyncStorage.
- `components/atelier/AtelierFlow.tsx` – **Entering Dajana’s Atelier** (3-screen flow pre chata, premium tranzicije i dugmad).
- `app/(tabs)/profile.tsx` – **premium fashion redesign** (hero card, avatar ring, grupisani settings).
- `app/(tabs)/videos.tsx` – Video Studio: box generisanih slika, krivina, dugme Kreiraj video, tanka vertikalna linija do Kolekcije, galerija videa (tap/long press), GeneratingBanner.
- `app/outfit/[id].tsx` – cream, kartica, "Napravi outfit" → builder.
- `app/try-on/result.tsx` – full-screen slika, desni dugmići, donji red.
- `components/OutfitCard.tsx` – gradient, naslov na slici, radius 20, animacije.
- `components/WardrobeRailTabBar.tsx` – cream pozadina (NAV_CREAM).

---

## 💎 PREMIUM DIZAJN PRINCIPI (OBAVEZNO ZA DALJI RAZVOJ)

Sve nove komponente i ekrani MORAJU pratiti ove smernice kako bi se zadržao "Luxury/Premium" osećaj:

### 1. Pozadina i Prostor
- **Boja:** Koristiti `COLORS.offWhite` (`#FDFCFB`) za sve glavne pozadine ekrana umesto čiste bele.
- **Whitespace:** Puno "belog prostora". Izbegavati zbijene elemente. Koristiti `SPACING.xl` i `SPACING.xxl` za marginu između velikih sekcija.

### 2. Premium Dugmad (Indyx Stil)
- **Oblik:** Asimetrična zakrivljenost.
  ```typescript
  borderRadius: 30,
  borderTopRightRadius: 30,
  borderBottomRightRadius: 2, // Oštar donji desni ugao
  ```
- **Stil:** `borderWidth: 0.5`, `borderColor: COLORS.secondary` (Zlatna).
- **Senka:** Veoma suptilna i meka (`shadowOpacity: 0.08`, `shadowRadius: 10`).
- **Sadržaj:** Koristiti `Feather` ikone (npr. `arrow-right`) umesto standardnih debljih ikona.

### 3. Tipografija (Hierarchy)
- **Naslovi:** `FONTS.heading.bold` (Playfair Display) sa `letterSpacing: 0.5` do `1`.
- **Logo stil:** Povećan `letterSpacing` (do `10`) za DAJANA logo.
- **Tagline:** `FONTS.script.regular` (Allura) za elegantne, rukom pisane akcente.
- **Label:** `FONTS.primary.semibold` (Josefin Sans) sa smanjenim opacity (`0.8`) za luksuzniji izgled.

### 4. Minimalistički Unos (Forms)
- **Inputi:** Izbegavati box-ove. Koristiti samo donju liniju (`borderBottomWidth: 1`).
- **Placeholder:** Boja `COLORS.gray[300]`, font regular.

### 5. Dekorativni Elementi
- **Zlatna linija:** Tanka horizontalna linija (`height: 1`, `backgroundColor: COLORS.secondary`, `opacity: 0.6`).
- **Zlatni dijamant:** Mali dekorativni dijamant na dnu ekrana ili između sekcija.

---

## Pregled Faza

| Faza | Naziv | Status |
|------|-------|--------|
| 1 | Foundation | ✅ DONE |
| 2 | Profil i Onboarding | ✅ DONE |
| 3 | Capsule Wardrobe | ✅ DONE |
| 4 | AI Try-On (Slike) | ✅ DONE |
| 5 | AI Video | ✅ DONE |
| 6 | AI Savetnik | ⏳ TODO |
| 7 | Payments (Stripe) | ⏳ TODO |
| 8 | Push Notifikacije | 🔄 Delimično (video notifikacije) |
| 9 | **DIZAJN POLISH** | 🔄 U TOKU (dorada UI, zatim dalje faze) |
| 10 | Deployment | ⏳ TODO |

---

## Faza 1: Foundation ✅ DONE

### Mobile App
- [x] Expo/React Native setup
- [x] Supabase integracija
- [x] Autentifikacija (login, register, logout)
- [x] i18n (srpski/engleski)
- [x] Language switcher
- [x] Osnovni tab navigation
- [x] Theme setup (boje, fontovi)

### Admin Panel
- [x] Next.js setup
- [x] Admin autentifikacija
- [x] Dashboard sa statistikom
- [x] Outfit CRUD (kreiranje, edit, brisanje)

### Database
- [x] Schema sa RLS
- [x] Credit system funkcije
- [x] Tabele: users, profiles, outfits, user_credits, itd.

---

## Faza 2: Profil i Onboarding ✅ DONE

### Onboarding Flow (OBAVEZAN)
- [x] Ekran 1: Unos mera (visina, težina, grudi, struk, kukovi)
- [x] Ekran 2: Prikaz izračunatog body type
- [x] Ekran 3: Izbor sezone (12 sezona)
- [x] Ekran 4: Završetak → Home

### Profile
- [x] Prikaz svih podataka
- [x] Edit profila
- [x] Realni krediti iz baze

### Credit System
- [x] Povezivanje sa user_credits tabelom
- [x] Prikaz preostalih kredita

### Kreirani fajlovi
- `app/(onboarding)/_layout.tsx` - Layout za onboarding
- `app/(onboarding)/measurements.tsx` - Ekran za mere
- `app/(onboarding)/body-type.tsx` - Rezultat body type
- `app/(onboarding)/season.tsx` - Izbor sezone
- `app/(onboarding)/complete.tsx` - Završni ekran
- `app/edit-profile.tsx` - Modal za edit profila

---

## Faza 3: Capsule Wardrobe ✅ DONE

- [x] Lista kategorija (Tops, Bottoms, Dresses, itd.)
- [x] Prikaz outfita po kategorijama
- [x] Filtriranje po sezoni i body type
- [x] Favorite/Save outfit
- [x] Outfit detail screen
- [x] Share outfit (sa slikom)
- [x] Admin panel - kategorije i redosled prikaza

### Kreirani fajlovi (Faza 3)
- `constants/categories.ts` - Kategorije outfita
- `components/OutfitCard.tsx` - Kartica za outfit
- `app/(tabs)/capsule.tsx` - Glavni Capsule ekran
- `app/outfit/[id].tsx` - Detail modal

---

## Faza 4: AI Try-On (Slike) ✅

- [x] Upload korisnikove slike (kamera + galerija, expo-image-picker, aspect 3:4)
- [x] Integracija sa AI API — **Gemini 3 Pro Image** (`gemini-3-pro-image-preview` / Nano Banana AI)
- [x] Generisanje slike sa outfit-om (prompt engineering za virtual try-on)
- [x] Result screen sa glass efektom (face thumbnail, AI chip badge, save/share)
- [x] Credit dedukcija (50/mesec iz `user_credits` tabele, mesečni reset)
- [x] Try-On store (Zustand) za state management između ekrana
- [x] Navigacija: Kapsula/Ormar → **try-on (welcome)** → try-on/upload → try-on/generating → try-on/result; welcome ekran (`app/try-on/index.tsx`): fullscreen krem, „Slikajte lice…“, Dalje; i18n `try_on.welcome_title`, `welcome_subtitle`, `welcome_next`
- [x] Upload: ScrollView, safe area insets, animacije; generating/result krem + zlatno; Slika detail modal na Home fullscreen krem
- [x] Error handling i retry mehanizam
- [ ] Galerija generisanih slika (prikaz na Home screen — sledeći korak)

---

## Faza 5: AI Video

- [x] **Video generisanje iz slike** – TheNewBlack AI Video API (start → poll), izvor: galerija / try-on rezultat / sačuvani outfit
- [x] **Integracija sa video API-jem** – TheNewBlack (umesto Kling); upload slike na Supabase `video-sources`, 5s/10s trajanje
- [x] **Video player** – `video-result.tsx`, expo-video, full-screen, save/share/download, „Novi“ / „Početna“
- [x] **Galerija videa** – Videos tab (Video Studio): box slika + Kreiraj video + vertikalna linija do Kolekcije, FlatList sačuvanih videa; Home sekcija „Video“; sačuvani videi u `meta.json` + FileSystem
- [x] **Video u pozadini + notifikacija** – globalni poller, lokalna notifikacija „Tvoj video je spreman!“, tap → video-result (videti Fazu 8)
- [x] **Loading ekran po izboru** – pun GeneratingOverlay (animacija, progress bar); opcija **ostati** ili **„Nastavi u pozadini“** (dugme → prelaz na Videos tab)
- [ ] Credit dedukcija za video (prikaz 10/20 kredita u UI, backend dedukcija po želji)

---

## Faza 6: AI Savetnik (Pitaj Dajanu)

### Opis
AI savetnik koji koristi OpenAI GPT-4o Vision za analizu generisanih try-on slika i davanje personalizovanih modnih saveta. Persona: Dajana — topla, ohrabrujuća, iskrena modna stručnjakinja.

### Implementirani fajlovi
- `lib/aiAdvisorService.ts` — OpenAI GPT-4o Vision servis sa Dajana personom; **findAiResponseForSeason** — kada poruka odgovara triggeru iz paleta, u system prompt ubacuje preporučeni odgovor
- `app/(tabs)/ai-advice.tsx` — Potpuni chat interfejs sa animacijama

### Funkcionalnosti
- [x] Chat interfejs (kompletna prerada ai-advice taba)
- [x] GPT-4o Vision integracija (OpenAI API)
- [x] Analiza generisanih try-on slika
- [x] Personalizovani saveti za stil (Dajana persona)
- [x] "Mišljenje od Dajane" dugme na Try-On result ekranu
- [x] Automatsko slanje slike i analiza prilikom navigacije sa result ekrana
- [x] Nastavak konverzacije (follow-up pitanja)
- [x] Typing indikator sa animacijom (tri tačke)
- [x] Empty state sa suggestion chips (Trendovi, Boje, Poslovni outfit, Aksesori)
- [x] Header sa Dajana avatarem i "Online" statusom
- [x] Input bar sa multiline tekstualnim poljem
- [x] Krem/bela tema usklađena sa ostatkom aplikacije
- [x] **First-launch animacija** — typewriter "Zdravo [ime]. Spremna sam da ti pomognem.", avatar se pomera u header, chat fade in; AsyncStorage po useru (`dajana_chat_first_visit_${userId}`)
- [x] Cream paleta (CHAT_CREAM, CHAT_CARD, CHAT_BORDER) za ceo chat i modal
- [x] **Sezonske palete (client-materijal)** — HEX boje i AI odgovori za svih 12 sezona u `constants/seasonPalettes.ts`; `SEASONS[id].colors` puni se iz paleta; savetnik koristi `findAiResponseForSeason()` da u system prompt ubaci preporučeni odgovor kada korisnica kaže nešto tipično (npr. „Crna mi je sigurna”, „Ne volim boje”).
- [ ] Credit dedukcija za analize (sledeći korak)

### Tok korisnika
1. Korisnik generiše try-on sliku (Faza 4)
2. Na result ekranu klikne "Mišljenje od Dajane"
3. Navigacija na AI Advice tab sa generisanom slikom
4. GPT-4o Vision automatski analizira sliku
5. Dajana daje komentar: šta joj se sviđa, kako stoji, predlozi za poboljšanje
6. Korisnik može postaviti dodatna pitanja u istoj konverzaciji

### Dajana persona
- Topla, ohrabrujuća, ali iskrena
- Koristi srpski jezik (latinicu)
- Analizira: siluetu, proporcije, boje, ton kože
- Predlaže: aksesoare, alternativne kombinacije
- Potpis: "— Dajana 💋"

### Navigacija
- Try-On Result → "Mišljenje od Dajane" → /(tabs)/ai-advice (sa params: fromTryOn, imageBase64, outfitTitle)
- Tab "Pitaj Dajanu" dostupan direktno iz tab bara

---

## Faza 7: Payments (Stripe)

- [ ] Stripe SDK integracija
- [ ] Subscription planovi
- [ ] Kupovina dodatnih kredita
- [ ] Payment history
- [ ] Webhook handling

---

## Faza 8: Push Notifikacije

- [x] **Expo Notifications setup** – expo-notifications, expo-task-manager, expo-background-fetch; dozvole, token u Supabase `push_tokens`, lokalne notifikacije (DAJANA AI, zlatna boja)
- [x] **Video u pozadini + notifikacija** – generisanje u pozadini, globalni poller, notifikacija „Tvoj video je spreman!“, tap → video-result
- [x] **Backend za slanje notifikacija** – Next.js API `POST /api/send-push`, expo-server-sdk, čitanje tokena iz Supabase (service role), slanje u chunkovima
- [x] **Admin panel za slanje** – stranica Notifikacije: form (naslov opciono, poruka obavezno), „Pošalji svima“, DAJANA stil (zeleno/zlatno), prikaz broja uređaja
- [x] **EAS projectId za push** – `app.config.js` (extra.eas.projectId), projekt @anonimni/dajana-ai-app; uputstvo u POKRETANJE-SERVERA.md
- [x] **Registracija tokena** – odložena registracija + ponovni pokušaj pri povratku u app (AppState), registracija i u (tabs) layout kad je korisnik ulogovan
- [x] **Ikona notifikacija** – expo-notifications plugin u app.config.js: `icon: ./assets/images/icon.png`, `color: #CF8F5A`; Android kanal `dajana-announcements` (DAJANA AI, zlatna). Na iOS ikona = app icon (vidljiva u dev/production buildu; u Expo Go ostaje ikona Expo Go)
- [x] **Gost:** Registracija tokena se ne poziva za gosta (layout `!isGuest`). U `savePushToken`: ako nema user i `isGuest`, bez loga; ako nema user a nije gost, samo `console.log` „Obavestenja će biti dostupna nakon prijave.“
- [ ] Notification preferences (korisnik uključi/isključi kategorije)

---

## Faza 9: DIZAJN POLISH 🎨

**Trenutno u toku: dorada UI-a. Uskoro prelazak na Faze 4–6 (AI Try-On, Video, Savetnik).**

### Mobile App
- [x] Splash screen dizajn (samo GIF logo u `components/SplashContent.tsx`, 5.5 s u `_layout.tsx` → Welcome; `assets/images/splash-logo.gif`); **pozadina uvek bela** (#ffffff u SplashContent, wrapper u _layout, app.json)
- [x] Welcome screen dizajn (DAJANA/AI TG Valtica; **slika** `welcome-dajana.png` u centru u **okviru** — zlatna obruba, senka; Allura headline; swipe "Započni" bez teksta "Prevuci da započneš"; **SR/ENG desno gore**, bez Theme toggle; `app/(auth)/index.tsx`)
- [x] **Light/Dark tema** — ThemeStore, ThemeContext, ThemeToggle na Welcome i u Profilu; svi ekrani prate temu (background/surface/text)
- [x] **Home (INDYX-inspired)** — hero centriran; levo notifikacije (bell + badge), desno kalendar + settings; jedan padajući hero blok (krediti) umesto tri kocke
- [x] **Navigacija** — root Stack: (auth), (onboarding), (tabs), calendar, edit-profile, outfit/[id]; tab layout sa WardrobeRailTabBar (Home, Capsule, Videos, AI Savetnik, Profile)
- [x] **Wardrobe Rail** tab bar — šipka, kukice, tilt/spring animacije, Kapsula u sredini sa `logo_za_kapsulu.png`
- [x] **Kalendar** — stranica `app/calendar.tsx` (mesečni grid, prev/next, belo/zlatno/krem); ulaz sa Home (ikona kalendara)
- [x] **Notifikacije badge** — u levom uglu heroja na Home (bell + zlatni badge)
- [x] **Cream paleta** — Home, Kapsula, navigacija, Chat, Outfit detail, Outfit preview u #F8F4EF / #FFFCF9
- [x] **Kapsula redizajn** — pill tabovi, dropdown kategorije, floating bar sa strelicom → outfit-preview
- [x] **Outfit Builder** — ekran sa slotovima (jakna/top/bottom/obuća), bottom sheet picker, "Isprobaj" → outfit-preview
- [x] **Try-On Result** — full-screen slika, desni floating dugmići, donji red (Ponovo, Početna)
- [x] **Chat first-launch** — typewriter "Zdravo [ime]. Spremna sam da ti pomognem.", avatar → header, chat fade in, per-user AsyncStorage
- [x] **Entering Dajana’s Atelier (pre-chat flow)** — 3 ekrana pre chata, smooth tranzicije, premium dugmad
- [x] **Profile premium fashion redesign** — hero card, avatar ring, premium cards + grouped settings
- [ ] App icon finalizacija
- [ ] Animacije i tranzicije (dodatne)
- [ ] Loading / empty / error statesR
- [ ] Typography fine-tuning, spacing konzistentnost
- [ ] Haptic feedback

### Admin Panel
- [x] **Dashboard vizualizacije** – stat kartice (Korisnici, Outfiti, Slike, Videi), brzi linkovi ka sekcijama
- [x] **Responsive dizajn** – main padding (p-4 sm:p-6 lg:p-8), min-w-0, grid kolone 1 / sm:2 / lg:4
- [x] **Loading indicators** – loading.tsx za dashboard, users, analytics (skeleton)
- [x] **Toast notifikacije** – ToastProvider + useToast(), toast na Notifikacije stranici (success/error)
- [x] **Logo u sidebaru** – slika iz public/logo.png (fallback na „DAJANA AI” tekst ako fajl nije tu)
- [x] **Korisnici stranica** – lista korisnika iz Supabase (profiles), tabela (email, ime, jezik, datum)
- [x] **Statistika stranica** – brojevi (korisnici, outfiti, slike, videi), bar vizualizacije po mesecu za generacije

### Slike i Assets
- [ ] Outfit placeholder slike
- [ ] Season ilustracije
- [ ] Body type ilustracije
- [ ] Onboarding ilustracije

---

## Faza 10: Deployment

- [ ] App Store priprema (iOS)
- [ ] Play Store priprema (Android)
- [ ] Admin panel deploy (Vercel)
- [ ] Environment variables production
- [ ] Email confirmation aktivacija
- [ ] Domain setup
- [ ] SSL certifikati
- [ ] Monitoring setup

---

## 🎨 DIZAJN PRAVILA (OBAVEZNO)

### Jezici - DVOJEZIČNA APLIKACIJA
| Jezik | Status | Kod |
|-------|--------|-----|
| **Srpski** | PRIMARNI (default) | `sr` |
| **Engleski** | Sekundarni | `en` |

**PRAVILA:**
- SVE tekstovi MORAJU biti u `lib/i18n.ts` fajlu
- NIKAD hardkodovati tekst direktno u komponentama
- Uvek koristiti `t('key')` funkciju za tekstove
- Jezik se čuva u profilu korisnika u bazi

### Boje - BRAND PALETTE
```
Primary (Tamno Zelena):   #0D4326
Secondary (Zlatna):       #CF8F5A
White:                    #FFFFFF
Black:                    #000000
Error (Crvena):          #EF4444
Warning (Narandžasta):   #F59E0B
Gray scale:              #F9FAFB → #111827
```

**Definisano u:** `constants/theme.ts` → `COLORS`

### Fontovi
| Tip | Font | Upotreba |
|-----|------|----------|
| Primary | **Josefin Sans** | Body text, labels, buttons |
| Heading | **Playfair Display** | Naslovi, logo |

**PRAVILA:**
- Uvek koristiti `FONTS.primary.regular`, `FONTS.heading.bold`, itd.
- NIKAD hardkodovati font name
- Fontovi se učitavaju preko `expo-google-fonts`

### Stil Aplikacije
- Feminine, elegantan, luksuzan
- Minimalistički dizajn
- Puno belog prostora
- Zaobljeni uglovi (borderRadius: 12-16)
- Suptilne senke

---

## 🚨 KRITIČNA PRAVILA ZA SVAKU FAZU

> **OBAVEZNO PROČITATI PRE SVAKE FAZE!**
>
> **Ažuriranje PLAN.md:** Pri svakoj promeni u projektu ažuriraj ovaj fajl (Trenutni Status, checkbox u odgovarajućoj fazi, lista kreiranih fajlova ako ima novih). PLAN.md treba da uvek odgovara trenutnom stanju koda.

### 1. DVOJEZIČNOST - SRPSKI I ENGLESKI

**SVAKI EKRAN MORA BITI PREVEDEN NA OBA JEZIKA!**

```typescript
// ✅ DOBRO - koristi t() funkciju
<Text>{t('profile.my_data')}</Text>
Alert.alert(t('error'), t('errors.network'));

// ❌ LOŠE - hardkodiran tekst
<Text>Moji podaci</Text>
Alert.alert('Greška', 'Nema internet konekcije');
```

**Procedura za novi ekran:**
1. Dodaj SVE tekstove u `lib/i18n.ts` (srpski I engleski)
2. Koristi `t('key')` u komponenti
3. Testiraj na OBA jezika pre commit-a

### 2. API SERVICE - ERROR HANDLING I RETRY

**SVE API pozive MORAJU ići kroz `lib/api.ts`!**

```typescript
// ✅ DOBRO - koristi API service
import { fetchOutfits, ApiError } from '@/lib/api';
try {
  const outfits = await fetchOutfits(filters);
} catch (error) {
  if (error instanceof ApiError) {
    Alert.alert(t('error'), error.message); // Već prevedena poruka!
  }
}

// ❌ LOŠE - direktan Supabase poziv bez error handling
const { data } = await supabase.from('outfits').select('*');
```

**API service ima:**
- Retry logiku (3 pokušaja sa exponential backoff)
- Prevedene error poruke (sr/en)
- Typed responses
- Network error detection

### 3. BOJE I FONTOVI

```typescript
// ✅ DOBRO
backgroundColor: COLORS.primary
fontFamily: FONTS.primary.semibold

// ❌ LOŠE
backgroundColor: '#0D4326'
fontFamily: 'JosefinSans-SemiBold'
```

### 4. CHECKLIST ZA SVAKI NOVI EKRAN

Pre commit-a proveri:
- [ ] Svi tekstovi koriste `t()` funkciju
- [ ] Prevodi dodati u `lib/i18n.ts` (SR + EN)
- [ ] Boje kroz `COLORS` konstantu
- [ ] Fontovi kroz `FONTS` konstantu
- [ ] API pozivi kroz `lib/api.ts`
- [ ] Error handling sa prevedenim porukama
- [ ] Testirano na oba jezika

---

## Tehnički Stack

### Mobile App
- React Native + Expo SDK 50+
- Expo Router v3
- NativeWind v4 (Tailwind)
- Zustand (state management)
- TanStack Query v5

### Admin Panel
- Next.js 14 (App Router)
- Tailwind CSS
- shadcn/ui

### Backend
- Supabase (Auth, Database, Edge Functions)
- Cloudflare R2 (Storage)
- Stripe (Payments)

### AI APIs
- Google Gemini (analiza boja)
- TheNewBlack (AI Video); Gemini (try-on)
- OpenAI GPT-4 Vision (savetnik)

---

## Važne Napomene

1. **Testiranje**: Svaka faza se testira pre prelaska na sledeću
2. **Git**: Commit nakon svake značajne promene
3. **Krediti**: Rollback ako AI API fail-uje
4. **Storage**: Privatni fajlovi sa signed URLs
5. **RLS**: Svi krediti se menjaju SAMO kroz SECURITY DEFINER funkcije
6. **🚨 i18n**: SVAKI ekran MORA biti preveden (SR + EN) - vidi sekciju "KRITIČNA PRAVILA"
7. **🚨 API**: SVE API pozive kroz `lib/api.ts` sa error handling - vidi sekciju "KRITIČNA PRAVILA"

---

## Fajlovi za Infrastrukturu

| Fajl | Opis |
|------|------|
| `app/_layout.tsx` | Root layout — Splash, Stack (+ **video-generate**, **video-result** fullScreenModal); **NotificationSetup**, **VideoBackgroundPoller** (foreground poller + floating pill) |
| `app/(tabs)/_layout.tsx` | Tab layout — WardrobeRailTabBar, tabovi Home/Capsule/Videos/AI Savetnik/Profile, header stil (tema) |
| `app/calendar.tsx` | Kalendar — mesečni prikaz (grid), prev/next, paleta belo/zlatno/krem; ulaz sa Home |
| `components/SplashContent.tsx` | Splash sadržaj (GIF logo), koristi se u `_layout.tsx` |
| `app/(auth)/index.tsx` | Welcome ekran — video pozadina (zoom + translateY da se odseče logo), swipe Započni, SR/ENG; svi hookovi pre early returna |
| `app/(tabs)/index.tsx` | Home (INDYX-inspired: hero centriran, notifikacije levo, kalendar desno, padajući hero blok) |
| `components/WardrobeRailTabBar.tsx` | Tab bar „Wardrobe Rail” — šipka, kukice, animacije, Kapsula u sredini |
| `components/ThemeToggle.tsx` | Prekidač svetla/tame (sunce/mesec, neumorfni stil) |
| `contexts/ThemeContext.tsx` | ThemeProvider i useTheme() za light/dark paletu |
| `stores/themeStore.ts` | Zustand store za tema (light/dark), persistencija u AsyncStorage |
| `assets/images/splash-logo.gif` | Logo GIF za splash |
| `assets/images/logo_za_kapsulu.png` | Ikona Kapsule za tab bar |
| `assets/images/welcome-dajana.png` | Slika Dajana na Welcome ekranu (u okviru) |
| `lib/i18n.ts` | Svi prevodi (SR + EN) |
| `lib/api.ts` | API service sa retry i error handling |
| `lib/supabase.ts` | Supabase client |
| `constants/theme.ts` | Boje (light + dark), getColors(mode), fontovi, spacing |
| `constants/bodyTypes.ts` | Tipovi građe + calculator |
| `constants/seasons.ts` | 12 sezona; **colors** (HEX) punjeni iz `seasonPalettes.ts` |
| `constants/seasonPalettes.ts` | Sezonske palete iz client-materijal: HEX boje + AI odgovori (trigger → response) za svih 12 sezona; `getSeasonPalette`, `getAllSeasonPalettes`, `findAiResponseForSeason` |
| `types/database.ts` | TypeScript tipovi za bazu |
| `stores/authStore.ts` | Zustand store za auth |
| `stores/tryOnStore.ts` | Zustand store za AI Try-On flow (outfit, face image, generated image, status) |
| `lib/tryOnService.ts` | Gemini 3 Pro Image API integracija — generateTryOn(), saveTryOnImage() |
| `lib/creditService.ts` | Credit servis — getUserCredits(), hasImageCredits(), deductImageCredit() |
| `app/try-on/_layout.tsx` | Try-On Stack layout (index → upload → generating → result) |
| `app/try-on/index.tsx` | Try-On welcome — fullscreen krem, „Slikajte lice…“, dugme Dalje → upload |
| `app/try-on/upload.tsx` | Upload ekran — ScrollView, safe area, kamera/galerija, animacije, krem |
| `app/try-on/generating.tsx` | Generating ekran — pulse animacije, AI poziv, credit check |
| `app/try-on/result.tsx` | Result ekran — full-screen slika, desni floating dugmići (save/video/Dajana/share), donji red (Ponovo, Početna) |
| `app/outfit-preview.tsx` | Modal — grid izabranih komada, izbor Slika / Video, cream paleta |
| `app/outfit-builder.tsx` | Modal — 4 slotovi (jakna/top/bottom/obuća), + dugme, bottom sheet picker, CTA Isprobaj |
| `app/video-generate.tsx` | Novi video — izvor slike, prompt, trajanje 5s/10s; GeneratingOverlay (animacija, progress) + dugme „Nastavi u pozadini“ |
| `app/video-result.tsx` | Full-screen video player (expo-video), save/share/download, Novi/Početna |
| `app/(tabs)/videos.tsx` | Video Studio — box generisanih slika, krivina, dugme Kreiraj video, tanka vertikalna linija do Kolekcije, galerija videa (tap/long press), GeneratingBanner kada job aktivan |
| `stores/videoStore.ts` | Zustand — generisanje + **backgroundJob**, bgPollAttempt, startBackgroundJob, completeBackgroundJob |
| `lib/videoService.ts` | TheNewBlack AI Video API (start, poll), Supabase upload slike, saveVideo/getSavedVideos |
| `lib/notificationService.ts` | Dozvole, Expo push token → Supabase push_tokens; za gosta bez upozorenja; za neulogovanog log „Obavestenja će biti dostupna nakon prijave.“; video spreman, kanal dajana-announcements |
| `app.config.js` | Expo config: extra.eas.projectId (push), plugins – expo-notifications sa icon (assets/images/icon.png) i color #CF8F5A |
| `dajana-ai-admin`: `src/app/api/send-push/route.ts` | GET (broj tokena), POST (šalje push svima preko expo-server-sdk) |
| `dajana-ai-admin`: `src/app/dashboard/notifications/page.tsx` | Form za naslov/poruku, „Pošalji svima“, DAJANA stil, prikaz broja uređaja |
| `lib/backgroundVideoTask.ts` | expo-task-manager + expo-background-fetch, saveBackgroundJob/getBackgroundJob, poll u pozadini kada app zatvoren |
| `assets/images/model.png` | Model slika za Welcome screen |
