# Cloudflare R2 – podešavanje

Sve generisane slike (try-on), videi i slike outfita mogu da se čuvaju na **Cloudflare R2** (bucket `dajana-media`). Ako R2 env varijable nisu podešene, aplikacija i dalje koristi Supabase Storage.

---

## 1. R2 pristup (S3‑kompatibilni API)

Iz **Cloudflare Dashboard** → **R2** → **Manage R2 API Tokens** kreiraj API token sa pravom za čitanje/pisanje nad bucketom.

Treba nam:

| Podatak | Gde naći | Primer |
|--------|----------|--------|
| **Account ID** | Dashboard → desna strana ili URL (domen `dash.cloudflare.com`) | `a1b2c3d4e5f6...` |
| **Access Key ID** | Nakon kreiranja R2 API tokena | `a1b2c3d4...` |
| **Secret Access Key** | Isti token (samo jednom se prikaže) | `secret...` |

Ove vrednosti će ući u env varijable (app, admin, eventualno Edge funkcije).

---

## 2. Bucket(i)

Trenutno u Supabase imamo:

- **try-on-results** – generisane try-on slike (PNG)
- **user-videos** – sačuvani videi (MP4)
- **video-sources** – privremene slike za video API (upload da bi imali public URL)
- **outfit-images** – slike outfita (admin upload)

**Opcije:**

- **A) Jedan R2 bucket**  
  Jedan bucket, a putanje po tipu, npr.:
  - `try-on/{userId}/tryon_xxx.png`
  - `videos/{userId}/vid_xxx.mp4`
  - `sources/src_xxx.png`
  - `outfit-images/outfit_xxx.jpg`  
  Jedan set kredencijala, jedna “baza” URL-a.

- **B) Više R2 bucketova**  
  Poseban bucket za try-on, videe, sources, outfit-images.  
  Potrebno je više imena bucketova i jasno koja env varijabla za koji bucket.

**Treba nam:**  
- Imena bucketa(ova) koje si kreirao u R2 (npr. `dajana-media` za jedan bucket).  
- Ako koristiš više bucketova: lista imena (npr. `dajana-tryon`, `dajana-videos`, …).

---

## 3. Javni URL za čitanje fajlova

R2 fajlove moraju korisnici (i app) da mogu da čitaju preko HTTP. Treba nam **bazni javni URL** za svaki bucket.

**Opcije u Cloudflare:**

- **R2 public bucket (R2 dev URL)**  
  U R2 → bucket → **Settings** → **Public access** → “Allow Access”.  
  Dobijaš URL tipa: `https://pub-<id>.r2.dev` (ili slično).  
  **Treba nam:** ta tačna bazna adresa (npr. `https://pub-xxxx.r2.dev`).

- **Custom domen**  
  Ako domen (npr. `media.tvojadomena.com`) pokazuje na R2 bucket, **treba nam:**  
  Bazni URL, npr. `https://media.tvojadomena.com` (bez trailing slash).

U kodu ćemo raditi: **public URL = baseUrl + "/" + key** (key = putanja u bucketu, npr. `try-on/user123/tryon_xxx.png`).

---

## 4. Rezime – šta tačno da pošalješ

Kada budeš spreman, pošalji (možeš u .env primeru, bez stvarnih tajni u chat):

1. **Account ID** (Cloudflare)
2. **Access Key ID** (R2 API token)
3. **Secret Access Key** (R2 API token) – u pravom .env nikad u repo
4. **Ime bucketa** – jedan (npr. `dajana-media`) ili lista (try-on, videos, sources, outfit-images)
5. **Bazni javni URL** za taj bucket (npr. `https://pub-xxxx.r2.dev` ili `https://media.tvojadomena.com`)

Opciono:

- Da li želiš **jedan bucket sa prefiksima** (try-on/, videos/, …) ili **više bucketova**?
- Da li će **admin** takođe koristiti R2 za upload (outfit slike)? (Plan je da da – isti R2.)

---

## 5. Šta ostaje u Supabase

- **Baza (PostgreSQL)** – i dalje u Supabase: tabele `generations`, `outfit_compositions`, itd.
- U poljima **`output_url`** / **`input_image_url`** / URL kolone će stajati **R2 URL** (npr. `https://pub-xxx.r2.dev/try-on/user123/tryon_xxx.png`) umesto Supabase Storage URL-a.
- **Autentifikacija** – i dalje Supabase Auth.
- **Edge funkcije** – ostaju na Supabase; one ne skladište fajlove, samo pozivaju video/rezultate. Ako neka Edge funkcija trenutno čita slike sa Supabase Storage, trebaće joj samo da koristi novi R2 URL iz baze.

---

## 6. Implementirano – env varijable i deploy

**Bucket:** `dajana-media`  
**S3 endpoint:** `https://4df8db7a24ea348b7c55ba8d768855b4.r2.cloudflarestorage.com`

### Supabase Secrets (za Edge Function `upload-to-r2`)

Kredencijali su već u **dajana-ai-admin/.env.local**. Nakon što zameniš `R2_PUBLIC_URL` stvarnim URL-om (vidi ispod), pokreni iz **dajana-ai-main** foldera:

```bash
cd dajana-ai-main
node scripts/set-r2-secrets.js
```

(Alternativa: ručno u Supabase Dashboard → Project Settings → Edge Functions → Secrets dodaj sve `R2_*` varijable.)

### Mobilna app (dajana-ai-app) – `.env` ili EAS

- `EXPO_PUBLIC_R2_PUBLIC_URL` – isti bazni URL kao gore (npr. `https://pub-xxxx.r2.dev`). Ako nije setovan, app koristi Supabase Storage.

### Admin (dajana-ai-admin) – `.env.local`

- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME` – `dajana-media`
- `R2_S3_ENDPOINT` – `https://4df8db7a24ea348b7c55ba8d768855b4.r2.cloudflarestorage.com`
- `R2_PUBLIC_URL` – isti bazni URL. Ako nije setovan, admin koristi Supabase Storage.

### Deploy Edge Function

```bash
cd supabase
supabase functions deploy upload-to-r2
```

### R2 Public URL

U Cloudflare: R2 → bucket **dajana-media** → **Settings** → **Public access** → uključi i zapiši tačan URL (tipa `https://pub-xxx.r2.dev`). Taj URL stavi u `R2_PUBLIC_URL` i `EXPO_PUBLIC_R2_PUBLIC_URL`.
