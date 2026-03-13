# Pokretanje DAJANA AI servera

Kada uđeš u projekat, koristi ovo da pokreneš app i admin.

---

## 0. Fajl `.env` – gde su svi API ključevi

U folderu **dajana-ai-app** mora da postoji **`.env`** (kopiraj iz **`.env.example`** i popuni). **Nikad ne commituj `.env` na GitHub** – tu stoje tvoji ključevi; na novom klonu samo kopiraj `.env.example` u `.env` i unesi svoje vrednosti.

| Šta radi | Gde je ključ | Env u app-u |
|----------|----------------|--------------|
| **Chat** (Pitaj Dajanu) | Supabase Edge → Secrets: **OPENAI_API_KEY** | Samo `EXPO_PUBLIC_SUPABASE_URL` + anon key |
| **Analiza outfita** (Dajana na slici) | Supabase Edge → **GEMINI_API_KEY** (outfit-advice) | isto |
| **Slike** (Try-On) | Supabase Edge → Secrets: **GEMINI_API_KEY** | isto |
| **Video** (Kreiraj video) | Supabase Edge → Secrets: **VIDEO_API_KEY** | isto |
| Baza / auth | — | `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` |
| **Push notifikacije** | — | `EXPO_PUBLIC_EAS_PROJECT_ID` (vidi ispod) |

**Bezbednost:** Svi API ključevi (OpenAI, Gemini, Video) stoje **samo u Supabase** (Edge Function Secrets). U **.env** aplikacije **nema** tih ključeva – samo Supabase URL i anon key.

**Korak po korak:**

1. Otvori **dajana-ai-app/.env** (ako nema, kopiraj **.env.example** u **.env**).
2. Obavezno: `EXPO_PUBLIC_SUPABASE_URL` i `EXPO_PUBLIC_SUPABASE_ANON_KEY` (Supabase Dashboard → Project Settings → API).
3. Za **Chat, Try-On i Video** deploy-uj Edge Functions i u Supabase dodaj Secrets (vidi ispod).
4. Bez razmaka oko `=`, bez navodnika. Sačuvaj i restartuj Expo: `npx expo start`.

**Try-On (Gemini) – generisanje slika:** Edge Function `generate-try-on`. U Supabase: Secrets → **GEMINI_API_KEY** (ključ iz [aistudio.google.com](https://aistudio.google.com)).

**Chat (Pitaj Dajanu):** Edge Function `chat`. U Supabase: Secrets → **OPENAI_API_KEY** (ključ sa [platform.openai.com](https://platform.openai.com) → API keys).

**Video (Kreiraj video):** Edge Functions `video-start` i `video-result`. U Supabase: Secrets → **VIDEO_API_KEY** (ključ od TheNewBlack / AI video servisa). Deploy (moraš biti u folderu **dajana-ai-main**, gde je `supabase/`, ne u dajana-ai-app):
```bash
cd dajana-ai-main
npx supabase functions deploy video-start
npx supabase functions deploy video-result
npx supabase functions deploy chat
npx supabase functions deploy generate-try-on
npx supabase functions deploy outfit-advice
```
**Analiza outfita (Dajana na slici try-on):** Edge Function `outfit-advice`. Koristi **GEMINI_API_KEY** (isti kao Try-On). Bez nje, analiza slike bi išla preko OpenAI i mogla bi vratiti "I can't assist" na slikama sa ljudima.

**Push notifikacije (admin šalje na telefon):** Da bi app mogao da prima push, treba **EAS project ID**. U root folderu **dajana-ai-app** pokreni `npx eas init` (prvi put će tražiti Expo nalog). Zatim na [expo.dev](https://expo.dev) → tvoj projekat → **Settings** vidi **Project ID** (UUID). U **.env** dodaj: `EXPO_PUBLIC_EAS_PROJECT_ID=ovaj-uuid`. Restartuj Expo. Posle toga, kad si ulogovan u app, token će se upisati u bazu i u adminu ćeš videti „X uređaja”.

**Dozvole za notifikacije (Apple i Android):** Aplikacija traži dozvolu za slanje notifikacija (video spreman, obaveštenja itd.). **Apple i Android zahtevaju** da korisnik eksplicitno prihvati dozvolu. Ko prihvati – može da koristi app i da prima notifikacije. Ko odbije – i dalje može da koristi aplikaciju, ali **neće primati** push obaveštenja. Nema blokade app-a zbog odbijanja dozvole.

---

## 1. Mobilna aplikacija (Expo)

### Prvi put (ili posle `git pull`)

```bash
cd dajana-ai-main/dajana-ai-app
npm install

```

### Svaki sledeći put

```bash

```
```

**Za brata / bilo koga:** Otvori terminal u folderu `dajana-ai-main/dajana-ai-app`, uradi `npm install` ako nisi ranije, pa `npx expo start`. Na telefonu instaliraj **Expo Go** i skeniraj QR kod iz terminala.

---

## 2. Admin panel (Next.js)

### Prvi put (ili posle `git pull`)

```bash
cd dajana-ai-main/dajana-ai-admin
npm install
npm run dev
```

### Svaki sledeći put

```bash
cd dajana-ai-main/dajana-ai-admin

```

Admin se otvara u browseru (obično **http://localhost:3000**). Za produkciju: `npm run build` pa `npm start`.

---

## Kapsula / Ormar – slika i video

Stavi fajlove na ova mesta (ime tačno kako piše):

| Fajl | Putanja u projektu |
|------|---------------------|
| `slika_za_kapsulu.jpg` | `dajana-ai-main/dajana-ai-app/assets/images/slika_za_kapsulu.jpg` |
| `ulazak_u_ormar.mp4` | `dajana-ai-main/dajana-ai-app/assets/videos/ulazak_u_ormar.mp4` |

Slika se vidi na ekranu izbora (Ormar polovina) i kao pozadina u ormaru. Video se pusta kad korisnik uđe u ormar.

---

## Supabase – krediti (analize/slike/video se skidaju)

Ako ti se **krediti ne skidaju** (npr. ostane 2/2 analize posle korišćenja), u bazi nedostaje dozvola za **UPDATE** na tabeli `user_credits`. RLS (Row Level Security) dozvoljava samo čitanje; aplikacija mora moći da ažurira svoj red da bi smanjila `analysis_credits_used` (i slično).

**Šta uraditi:** u Supabase Dashboard otvori **SQL Editor** i pokreni:

```sql
DROP POLICY IF EXISTS "Users can update own credits" ON user_credits;
CREATE POLICY "Users can update own credits" ON user_credits FOR UPDATE USING (auth.uid() = user_id);
```

Posle toga će skidanje kredita (analize, slike, video) raditi.

---

## Video – Storage RLS i greška 502

**Upozorenje u logu:** `Bucket create warning: new row violates row-level security policy`  
Aplikacija uploaduje sliku u Supabase Storage bucket `video-sources` pre slanja zahteva za generisanje videa. Ako vidiš ovo upozorenje, u **Supabase Dashboard** → **Storage** → bucket **video-sources** (ili kreiraj ga ako ne postoji) dodaj RLS politike:

- **INSERT:** dozvoli za `auth.role() = 'authenticated'` (ili `anon` ako korisnici bez logovanja mogu da generišu video).
- **SELECT / public read:** za javni bucket dozvoli čitanje (public bucket automatski servira fajlove ako je bucket podešen kao public).

Ako bucket već postoji i upload prolazi (u logu se vidi `Public URL: https://...`), možeš ignorisati upozorenje o „bucket create”.

**Greška 502 / „Veza sa servisom nije uspela”**  
Edge Function `video-start` poziva spoljni Video API. 502 znači da je taj poziv pao (API nedostupan, pogrešan VIDEO_API_KEY, timeout). Proveri:

1. **Supabase** → **Edge Functions** → **video-start** → **Logs** – vidi tačan razlog (timeout, 4xx/5xx od API-ja).
2. **Secrets:** u Supabase **Project Settings** → **Edge Functions** → **Secrets** mora postojati **VIDEO_API_KEY** (vrednost koju ti daje TheNewBlack / video provider).
3. Da li je Video API (TheNewBlack ili drugi) aktivan i da li ti plan dozvoljava generisanje.

---

## Pretplata i plaćanje

**Cene (u kodu: `constants/subscription.ts`, `constants/credits.ts`):**
- **Mesečna pretplata:** 17€ (opseg 15–19€). Krediti: 50 slika, 2 videa, 2 AI analize – obnova svakih 31 dan.
- **Godišnja pretplata:** sa popustom (npr. 20% → ~163€/godišnje). Isti paket kredita.
- **Doplata za prekoračenje:** 5€ = +10 slika (kapsula), +1 video, +2 AI analize.

**Plaćanje:** Stripe (kartice, Apple Pay, Google Pay). PayPal nije uključen.

**Kad istekne pretplata:** Korisnica **vidi** sačuvane slike, videe i savete, ali **ne može** generisati novo (try-on, video, AI analizu) dok ne obnovi pretplatu ili kupi dopunu. Poruka u aplikaciji vodi u Shop (Profil → Krediti → Kupi dodatne kredite).

Integracija Stripe-a (Checkout / Payment Sheet) za sada nije uključena – u Shopu se prikazuje „uskoro dostupno”. Za produkciju treba dodati backend (Stripe webhook, kreiranje pretplate/kupovine) i u app-u poziv ka Stripe SDK ili Checkout URL.

---

## Gost (guest) i brisanje naloga

**Gost:** Korisnik može da uđe u app kao gost („Nastavi kao gost” na intro ekranu). Vidi samo **Početnu**. Kad klikne na Kapsula, Video, Dajana ili Profil – otvara se modal: „Samo registrovani korisnici mogu da otvore ovaj sadržaj” sa opcijama **Prijavi se** i **Registruj se**.

**Obriši nalog:** U **Profil** sekciji, na dnu, nalazi se **Obriši nalog**. Korisnik može trajno da obriše nalog iz baze i iz Auth. Potrebna je Edge Function `delete-account`, koja briše redove u tabelama: `push_tokens`, `generations`, `user_credits`, `subscriptions`, `saved_outfits`, `profiles`, pa zatim korisnika iz **Auth** (auth.users). **Moraš da deploy-uješ funkciju** inače dugme ne radi:

```bash
cd "c:\Users\kompl\OneDrive\Desktop\dajana aplikacija\dajana-ai-main"
npx supabase functions deploy delete-account
```

Ako i posle deploy-a ne radi: u Supabase Dashboard → **Edge Functions** → **delete-account** → **Logs** proveri greške; u **Authentication** → **Users** proveri da li korisnik zaista nestane posle brisanja.

cd "c:\Users\kompl\OneDrive\Desktop\dajana aplikacija\dajana-ai-main\dajana-ai-app"
npx expo start