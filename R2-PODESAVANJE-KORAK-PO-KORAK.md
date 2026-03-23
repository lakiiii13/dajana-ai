# R2 podešavanje – korak po korak

Da try-on i video rade na TestFlight-u, treba da podesiš Cloudflare R2.

---

## Korak 1: Cloudflare R2 bucket

1. Idi na [dash.cloudflare.com](https://dash.cloudflare.com) → **R2** → **Create bucket**
2. Ime bucketa: `dajana-media` (ili bilo koje)
3. **Settings** → **Public access** → **Allow Access** → zapiši **Public bucket URL** (npr. `https://pub-abc123xyz.r2.dev`)

---

## Korak 2: R2 API token

1. R2 → **Manage R2 API Tokens** → **Create API token**
2. Permissions: **Object Read & Write**
3. Bucket: izaberi tvoj bucket (npr. `dajana-media`)
4. Po kreiranju **sačuvaj odmah**:
   - **Access Key ID**
   - **Secret Access Key**  
   (Secret se prikaže samo jednom!)

---

## Korak 3: S3 endpoint

U Cloudflare Dashboard → R2 → tvoj bucket → **Settings** → **S3 API**:

- URL tipa: `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`
- Primer: `https://4df8db7a24ea348b7c55ba8d768855b4.r2.cloudflarestorage.com`

**Account ID** (desna strana Dashboard-a ili iz URL-a):

- `dash.cloudflare.com/<ACCOUNT_ID>/r2...`

---

## Korak 4: Supabase Edge Function secrets

**Supabase Dashboard** → **Project Settings** → **Edge Functions** → **Secrets**

Dodaj (ili ažuriraj):

| Secret | Vrednost |
|--------|----------|
| `R2_ACCESS_KEY_ID` | Access Key ID iz Koraka 2 |
| `R2_SECRET_ACCESS_KEY` | Secret Access Key iz Koraka 2 |
| `R2_BUCKET_NAME` | Ime bucketa (npr. `dajana-media`) |
| `R2_S3_ENDPOINT` | S3 URL (npr. `https://4df8db7a24ea348b7c55ba8d768855b4.r2.cloudflarestorage.com`) |
| `R2_PUBLIC_URL` | Public bucket URL (npr. `https://pub-abc123xyz.r2.dev`) |

**Alternativa – CLI skripta:**

```bash
cd dajana-ai-main
```

U `dajana-ai-admin/.env.local` dodaj:

```
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET_NAME=dajana-media
R2_S3_ENDPOINT=https://TVOJ_ACCOUNT_ID.r2.cloudflarestorage.com
R2_PUBLIC_URL=https://pub-xxx.r2.dev
```

Zatim:

```bash
node scripts/set-r2-secrets.js
```

---

## Korak 5: EAS production env (za TestFlight)

```bash
cd dajana-ai-main/dajana-ai-app
npx eas-cli env:create
```

- Environment: **production**
- Name: `EXPO_PUBLIC_R2_PUBLIC_URL`
- Value: isti URL kao `R2_PUBLIC_URL` (npr. `https://pub-abc123xyz.r2.dev`)

---

## Korak 6: Deploy Edge Functions

```bash
cd dajana-ai-main
npx supabase functions deploy get-r2-upload-url
npx supabase functions deploy upload-to-r2
```

---

## Korak 7: Novi build za TestFlight

```powershell
cd dajana-ai-main/dajana-ai-app
npx eas-cli build --platform ios --profile production --auto-submit
```

---

## Provera

- Lokalno: `EXPO_PUBLIC_R2_PUBLIC_URL` u `.env` ili EAS
- TestFlight: isti URL u EAS production env
- Supabase: svi R2_* secrets postavljeni
