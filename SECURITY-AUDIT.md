# DAJANA AI – Sigurnosni pregled i uputstvo

## 1. Kako korisnik koristi aplikaciju

### Tok podataka

| Akcija | Ulaz | Gde se čuva |
|--------|------|-------------|
| **Registracija** | Email, lozinka | `auth.users`, `profiles`, `user_credits` |
| **Try-On** | Lice + outfit slike | Edge Function → R2 (`try-on/{userId}/`) → `generations` |
| **Video** | Izvor slika → generisanje | R2 (`sources/`, `videos/{userId}/`) → `generations` |
| **AI savet** | Slika + poruka | Edge Function → `advice_chats` |
| **Outfiti** | Izbor iz kataloga | `outfits` (admin), `outfit_compositions` (korisnik) |
| **Kupovina** | Shop paket | `transactions`, `user_credits`, `subscriptions` |
| **Brisanje naloga** | Profil → Obriši | Edge Function briše sve korisničke podatke |

### Autentifikacija

- **Supabase Auth** (email/lozinka)
- JWT u `X-User-JWT` za Edge Functions
- Admin: poseban `admin_users` + HMAC sesija

---

## 2. Gde se sve čuva

| Lokacija | Sadržaj |
|----------|---------|
| **PostgreSQL (Supabase)** | `profiles`, `user_credits`, `subscriptions`, `outfits`, `generations`, `transactions`, `push_tokens`, `admin_users`, `outfit_compositions`, `saved_outfits`, `advice_chats`, `user_notifications` |
| **Cloudflare R2** | `try-on/`, `videos/`, `sources/`, `outfit-images/` |
| **Supabase Storage** | Bucketi `video-sources`, `user-videos`, `try-on-results`, `outfit-images`, `outfits` (fallback ili legacy) |
| **Klijent** | AsyncStorage (sesija) |

---

## 3. Sigurnosni pregled

### ✅ Urađeno

- **RLS** na svim korisničkim tabelama
- **Edge Functions** koriste `verifyAuth`, `checkRateLimit`, `checkCredits`
- **API ključevi** u Supabase Secrets, ne u `.env` aplikacije
- **R2 validacija** – `key` mora biti u opsegu korisnika (`try-on/{userId}/`, `videos/{userId}/`, `sources/`)
- **Admin** koristi `service_role`; `admin_users` ima RLS bez politika za obične klijente

### ⚠️ Kritično – zahteva pažnju

#### 1. `add_bonus_credits` – poziv sa klijenta

- **Lokacija:** `app/payment.tsx` linija 58
- **Problem:** Klijent direktno poziva `supabase.rpc('add_bonus_credits', { p_user_id: userId })` bez provere plaćanja.
- **Rizik:** Svaki autentifikovani korisnik može da doda bonus kredite sebi ili drugima.
- **Rešenje:** Pozivati `add_bonus_credits` samo iz backend-a (npr. Stripe webhook), nikad sa klijenta.

#### 2. Simulacija plaćanja

- **Lokacija:** `app/payment.tsx`
- **Problem:** Nema prave Stripe integracije; plaćanje je simulirano.
- **Rešenje:** Pre produkcije uvesti Stripe + webhook-e.

### ⚠️ Srednji prioritet

#### 3. Race condition kod kredita

- Edge Functions samo proveravaju kredite; odbitak se dešava u aplikaciji posle uspeha.
- Dva istovremena zahteva mogu proći proveru pre nego što bilo koji odbije kredit.
- **Rešenje:** Koristiti `check_and_use_credit` (ili sličnu atomsku operaciju) u Edge Functions.

#### 4. `delete-account` bez rate limiting-a

- Nema ograničenja broja poziva.
- **Rešenje:** Dodati rate limiting i koristiti zajedničke guards.

#### 5. CORS `Access-Control-Allow-Origin: *`

- Bilo koji origin može da poziva API.
- **Rešenje:** U produkciji ograničiti na poznate domene aplikacije.

### ✅ Popravljeno u ovom audit-u

- **R2 key validacija** – `get-r2-upload-url` i `upload-to-r2` proveravaju da `key` pripada autentifikovanom korisniku.
- **generations DELETE policy** – dodat patch `patch-generations-delete-policy.sql` (pokrenuti u Supabase SQL Editoru).

---

## 4. Moguće greške i edge case-ovi

| Oblast | Rizik | Status |
|--------|-------|--------|
| tryOnService | Timeout Edge Function | 180s AbortController |
| videoService | Polling / save fail | Retry; notifikacija na max attempts |
| r2Storage | Preopterećenost / 502/503 | Retry; `isOverloadError` |
| deleteTryOnImage | RLS blokira DELETE | **Popravljeno** – dodata DELETE policy |
| payment | recordTransaction fail | Samo log; krediti se i dalje mogu dodati |
| creditService | Reset greška | Samo log |

---

## 5. Šta uraditi odmah

1. **Pokrenuti SQL patch** u Supabase SQL Editoru:
   ```sql
   -- database/patch-generations-delete-policy.sql
   CREATE POLICY "Users can delete own generations"
     ON generations FOR DELETE
     USING (auth.uid() = user_id);
   ```

2. **Deploy Edge Functions** sa R2 validacijom:
   ```bash
   npx supabase functions deploy get-r2-upload-url
   npx supabase functions deploy upload-to-r2
   ```

3. **Plaćanje:** Ne koristiti `add_bonus_credits` sa klijenta. Uvesti Stripe webhook koji poziva RPC nakon uspešnog plaćanja.

---

## 6. Edge Functions – pregled

| Funkcija | Auth | Rate limit | Krediti | Validacija |
|----------|------|------------|---------|------------|
| chat | ✓ | 30/min | — | messages |
| generate-try-on | ✓ | 10/min | ✓ image | faceImageBase64, outfitImages |
| video-start | ✓ | 10/min | ✓ video | image, prompt, time |
| video-result | ✓ | 60/min | — | jobId |
| outfit-advice | ✓ | 15/min | ✓ analysis | systemPrompt, userText, imageBase64 |
| get-r2-upload-url | ✓ | 60/min | — | key + user scope ✓ |
| upload-to-r2 | ✓ | 30/min | — | key + user scope ✓ |
| delete-account | Custom JWT | ✗ | — | JWT |
