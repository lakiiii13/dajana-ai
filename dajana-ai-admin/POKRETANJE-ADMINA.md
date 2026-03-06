# Pokretanje Dajana AI Admina

## Putanja projekta

- **U workspace-u:** `dajana-ai-main\dajana-ai\dajana-ai-admin`
- **Ako koristiš ZIP:** prvo raspakuj `dajana-ai-main.zip`, pa koristi folder `dajana-ai-main\dajana-ai\dajana-ai-admin`

---

## 1. Prvi put (ili posle kloniranja / novog pull-a)

U terminalu (PowerShell ili CMD):

```powershell
cd "C:\Users\User\Desktop\lazarev posao\dajana-ai-main\dajana-ai\dajana-ai-admin"
npm install
```

Zatim kreiraj **`.env.local`** u istom folderu (ako već nemaš) sa Supabase podacima:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tvoj-projekat.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tvoj_anon_key
SUPABASE_SERVICE_ROLE_KEY=tvoj_service_role_key
```

*(Vrednosti: Supabase Dashboard → Project Settings → API.)*

Opciono, ako admin šalje notifikacije / video / chat preko API-ja:
```env
VIDEO_API_KEY=tvoj_video_api_key
OPENAI_API_KEY=tvoj_openai_key
```

---

## 2. Pokretanje (svaki put)

```powershell
cd "C:\Users\User\Desktop\lazarev posao\dajana-ai-main\dajana-ai\dajana-ai-admin"
npm run dev
```

Otvori u browseru: **http://localhost:3000**

---

## 3. Produkcija (build + start)

```powershell
cd "C:\Users\User\Desktop\lazarev posao\dajana-ai-main\dajana-ai\dajana-ai-admin"
npm run build
npm start
```

---

## Ukratko – samo komande

**Prvi put:**
```powershell
cd "C:\Users\User\Desktop\lazarev posao\dajana-ai-main\dajana-ai\dajana-ai-admin"
npm install
# dodaj .env.local (vidi iznad)
npm run dev
```

**Svaki sledeći put:**
```powershell
cd "C:\Users\User\Desktop\lazarev posao\dajana-ai-main\dajana-ai\dajana-ai-admin"
npm run dev
```
