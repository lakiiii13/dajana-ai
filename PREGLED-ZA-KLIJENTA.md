# DAJANA AI – Pregled u odnosu na Tehnički plan v2.0 i Specifikaciju

**Datum pregleda:** Februar 2026  
**Svrha:** Provera šta je ispunjeno, šta odstupa od plana i šta fali pre slanja klijentu.

---

## ✅ ŠTA JE U SKLADU SA PLANOM / ISPUNJENO

### 1. Arhitektura i osnova
- **Mobile App (Expo/RN)** + **Admin Panel (Next.js)** + **Supabase (Auth, PostgreSQL)** – postavljeno i u upotrebi.
- **Auth:** Email login/register, logout, zaštita ruta.
- **Baza:** Sve tabele iz plana postoje (`profiles`, `subscriptions`, `user_credits`, `outfits`, `generations`, `transactions`, `push_tokens`, `admin_users`), sa RLS politikama.
- **Kredit sistem:** Tabele i logika (mesečni + bonus), redosled trošenja (prvo mesečni, pa bonus). U bazi postoji i funkcija `check_and_use_credit` i `add_bonus_credits`.
- **Reset kredita:** U bazi je pripremljen SQL za pg_cron (1. u mesecu); u aplikaciji je trenutno **31 dan od poslednjeg reset-a** umesto strogo “1. u mesecu” (blago odstupanje, funkcionalno je).

### 2. Mobile App – funkcionalnosti
- **Onboarding:** Mere (visina, težina, grudi, struk, kukovi) → tip građe (kalkulator) → izbor sezone (12 sezona) → završetak.
- **Profil:** Prikaz i izmena podataka, jezik (sr/en), tema (light/dark).
- **Kapsula garderobe:** Kategorije, filtriranje po tipu građe i sezoni, favorite/save, outfit detail, Outfit Builder (slotovi), share.
- **AI Try-On (slike):** Upload lica (kamera/galerija), generisanje preko **Gemini** (Nano Banana), result screen (save/share), **odbitak kredita** (50/mesec, bonus prvi).
- **Video:** Generisanje videa iz slike (**TheNewBlack** API, ne Kling – videti Odstupanja), video player, galerija, generisanje u pozadini + notifikacija “Tvoj video je spreman”.
- **Pitaj Dajanu (AI Savetnik):** Chat sa **OpenAI GPT-4o Vision**, Dajana persona, analiza try-on slike, sezonske palete (12 sezona, HEX + AI odgovori), first-launch animacija, Atelier flow (3 ekrana pre chata). **Odbitak kredita za analizu** (2/mesec).
- **Krediti u UI:** Prikaz preostalih kredita (slike, video, analize); blokada generisanja kada nema kredita; poruke “Nemate aktivnu pretplatu / dovoljno kredita”.
- **Pretplata (logika u app-u):** Čitanje statusa iz tabele `subscriptions`; ako `status !== 'active'`, korisnica vidi sadržaj ali ne može generisati novo (u skladu sa specifikacijom).
- **Shop / Plaćanje:** Ekran Shop (mesečna/godišnja pretplata, doplata 5€), ekran Payment – **trenutno simulacija** (videti Šta fali).
- **Push notifikacije:** Expo Notifications, tokeni u `push_tokens`, admin šalje obavestenja preko Next.js API (`/api/send-push`), video “spreman” notifikacija.
- **Dizajn:** Boje (#0D4326, #CF8F5A), fontovi (Playfair, Josefin), cream paleta, premium UI (splash, welcome, home, kapsula, chat, profil), dvojezičnost (sr/en).

### 3. Admin panel
- **Dashboard:** Stat kartice (korisnici, outfiti, slike, videi), brzi linkovi, responsive, loading (skeleton), toast.
- **Outfiti:** CRUD, upload slike (Supabase Storage), body types + sezona + tagovi.
- **Korisnici:** Lista iz `profiles` (email, ime, jezik, datum).
- **Statistika:** Brojevi i bar-vizualizacije po mesecu (Recharts).
- **Notifikacije:** Slanje push obavestenja svima (naslov/poruka), DAJANA stil.
- **Auth:** Login (email + lozinka), zaštita dashboard ruta, logo (OSB) u sidebaru i na login stranici.

### 4. Specifikacija (klijentski zahtevi)
- Email login ✅ (Google/Apple nisu u MVP-u, kako u spec.).
- Mere + tip građe + sezona ✅.
- Sa analizom / bez analize (filtriranje outfita) ✅.
- Kapsula: 50 slika/mesec, reset ✅ (implementirano kao 31 dan).
- Video: 2/mesec ✅.
- Pitaj Dajanu: 2 analize/mesec ✅.
- Cene: mesečna/godišnja pretplata + doplata 5€ (u Shopu prikazano; realno plaćanje još nije).
- Kad istekne pretplata: vidi sadržaj, ne može generisati novo ✅ (logika u app-u).
- Admin: upload outfita, statistika, push notifikacije ✅.
- Dizajn: boje, fontovi, ženstveno/elegantno ✅.

---

## ⚠️ ODSTUPANJA OD TEHNIČKOG PLANA (bez obezbeđivanja klijenta)

Ovo su **tehničke** razlike u odnosu na plan; za klijenta je bitno samo ako eksplicitno pominju “tačno kako u planu”.

| Plan (v2.0) | Trenutno stanje |
|-------------|------------------|
| **Cloudflare R2** za storage (outfiti, lice, generacije) | **Supabase Storage** za outfite (admin upload); slike generacija/lice idu kroz app/Gemini bez R2. |
| **Supabase Edge Functions** za: generate-image, generate-video, ai-analysis, create-subscription, stripe-webhook | **Nema Edge Functions.** Try-On i analiza rade iz **aplikacije** (direktno Gemini/OpenAI); video preko eksternog API-ja; krediti se skidaju u app-u (Supabase update), ne preko SQL funkcije `check_and_use_credit`. |
| **Kling (fal.ai)** za video | **TheNewBlack** API za video (u PLAN.md i kodu). |
| Reset kredita: **1. u mesecu** (pg_cron) | U kodu: **31 dana od last_reset_date** (bez pg_cron). pg_cron u schema.sql je u komentaru – treba uključiti na Supabase ako želite tačno “1. u mesecu”. |

**Napomena:** Trenutna arhitektura (bez R2, bez Edge Functions) je konzistentna i radi; za MVP i predstavljanje klijentu nije nužno menjati. R2 i Edge Functions donose prednosti (skrivanje API ključeva, centralizovana logika, jeftiniji bandwidth), ali zahtevaju dodatni razvoj.

---

## ❌ ŠTA FALI (nedovršeno / nije urađeno)

### Kritično za “kompletan” projekat prema planu

1. **Stripe – pravo plaćanje**
   - Plan: Stripe subscription (mesečna/godišnja) + kupovina bonus paketa (5€), webhook za ažuriranje `subscriptions` i `transactions`.
   - Trenutno: **Samо simulacija** u `payment.tsx` (unos kartice, delay, “uspeh”). Nema Stripe SDK u app-u, nema Edge Function ili API za `create-subscription` / `stripe-webhook`. Klijent ne može naplatiti pretplatu kroz aplikaciju.

2. **Edge Functions (po planu)**
   - Nema `generate-image`, `generate-video`, `ai-analysis`, `create-subscription`, `stripe-webhook` u Supabase. Sav posao je u app-u ili Next.js API-ju. API ključevi (Gemini, OpenAI) su u app-u (.env) – za produkciju je bezbednije prebaciti na backend (Edge ili Next API).

3. **Cloudflare R2**
   - Nije korišćen. Outfiti su u Supabase Storage. Plan eksplicitno predviđa R2 (folderi outfits/, users/, generations/). Može ostati Supabase dok klijent ne zatraži R2.

4. **pg_cron – mesečni reset**
   - U `schema.sql` je u komentaru. Da bi reset bio tačno “1. u mesecu”, treba u Supabase uključiti pg_cron i pokrenuti taj SQL. Trenutna logika (31 dan u app-u) i dalje daje korisnicima obnovu kredita.

### Manje / opciono

5. **Galerija “Moje kombinacije”** na Home – u PLAN.md je označeno kao sledeći korak; trenutno postoji prikaz “Slika” / “Video” na Home, ali ne i centralizovana “Moje kombinacije” kao posebna galerija.
6. **Notification preferences** (uključi/isključi kategorije push) – u planu Faza 8, nije urađeno.
7. **Deployment:** App Store / Google Play, admin na Vercel, produkcijski env – nije urađeno (Faza 10).

---

## 📋 KAKO REĆI KLIJENTU (preporuka)

### Moguće poruke (kratko)

- **“Projekat je u fazi gde su sve glavne funkcije vidljive i upotrebljive: registracija, profil, kapsula, AI try-on, video, Pitaj Dajanu, krediti, admin (outfiti, korisnici, statistika, push). Dizajn i specifikacija (boje, fontovi, jezici, limiti) su po dogovoru. Ono što do kraja treba uvesti za punu naplatu je **Stripe** – trenutno je plaćanje u aplikaciji simulirano da biste mogli da vidite ceo tok; za pravi naplatu potrebna je integracija Stripe (pretplata + webhook).”**

- **“U odnosu na tehnički plan: baza, krediti, RLS i logika su po planu. Za skladištenje slika trenutno koristimo Supabase Storage (umesto R2 iz plana) – to je dovoljno za lansiranje; R2 može ući kasnije ako zatreba. Generisanje slike/video i AI analiza rade u aplikaciji; za produkciju možemo prebaciti pozive na backend (Edge Functions ili naš API) radi bezbednosti API ključeva.”**

### Šta naglasiti kao “gotovo”

- Onboarding, profil, kapsula, AI try-on, video, Pitaj Dajanu, krediti (limiti i reset), pretplata kao koncept (čitanje iz baze), Shop i Payment ekran (flow spreman, plaćanje simulirano), push (admin + video “spreman”), admin panel (outfiti, korisnici, statistika, notifikacije), dizajn i dvojezičnost.

### Šta naglasiti kao “sledeći korak”

- **Stripe integracija** (pretplata + doplata + webhook) da aplikacija stvarno naplaćuje.
- Po želji: premeštanje AI poziva na backend (Edge/API), uključivanje pg_cron za reset 1. u mesecu, R2 ako klijent insistira na planu.

---

## Rezime tabela

| Oblast | Status | Napomena |
|--------|--------|----------|
| Baza (tabele, RLS, funkcije) | ✅ | pg_cron u komentaru |
| Auth (email) | ✅ | |
| Onboarding + profil | ✅ | |
| Kapsula + outfiti + admin CRUD | ✅ | Storage: Supabase |
| AI Try-On (Gemini) | ✅ | U app-u, krediti skidaju |
| Video (TheNewBlack) | ✅ | Plan pominje Kling |
| Pitaj Dajanu (GPT-4o) | ✅ | U app-u, krediti skidaju |
| Krediti (logika + UI) | ✅ | 31-dan reset u app-u |
| Pretplata (čitanje, blokada) | ✅ | Stripe naplata nije |
| Shop + Payment ekran | 🔶 | Flow spreman, plaćanje simulirano |
| Stripe (pravo plaćanje) | ❌ | Nije urađeno |
| Edge Functions | ❌ | Nema |
| R2 | ❌ | Supabase Storage umesto |
| Push (admin + video) | ✅ | |
| Admin (dashboard, users, analytics, notif.) | ✅ | |
| Dizajn (boje, fontovi, sr/en) | ✅ | |
| Deployment (store, Vercel) | ❌ | Faza 10 |

---

*Ako želiš, mogu skratiti ovaj dokument na jednu stranicu “za klijenta” (bez tehničkih detalja o R2/Edge) ili dodati konkretne stavke u PLAN.md kao “pre handover-a”.*
