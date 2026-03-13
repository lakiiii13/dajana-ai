# Push na GitHub i pokretanje na laptopu

Projekat ima **dve strane**: mobilna app (`dajana-ai-app`) i admin (`dajana-ai-admin`). Baza i API su na **Supabase** – na laptopu ti treba samo kod + env fajlovi sa ključevima.

---

## Deo 1: Na trenutnom kompu – push na GitHub

### 1.1 Otvori folder projekta

U PowerShell-u:

```powershell
cd "c:\Users\kompl\OneDrive\Desktop\dajana aplikacija\dajana-ai-main"
```

*(Koren repozitorijuma mora biti `dajana-ai-main` – unutra su `dajana-ai-app` i `dajana-ai-admin`.)*

### 1.2 Inicijalizuj Git (samo ako još nemaš repozitorijum)

Proveri da li postoji `.git`:

```powershell
dir .git
```

Ako **ne postoji** `.git`:

```powershell
git init
```

Ako **postoji** – preskoči ovaj korak.

### 1.3 Proveri da li su .env fajlovi ignorisani

U repou **ne smeju** da budu:

- `dajana-ai-app/.env`
- `dajana-ai-admin/.env.local`

Oba su već u `.gitignore`. Provera:

```powershell
git status
```

U listi **ne bi trebalo** da vidiš `.env` ni `.env.local`. Ako ih vidiš, ne dodavaj ih u commit.

### 1.4 Dodaj sve fajlove i uradi prvi commit

```powershell
git add .
git status
git commit -m "Initial commit: Dajana AI app + admin"
```

*Ako već imaš ranije commite, umesto "Initial commit" napiši npr. "Sync za laptop".*

### 1.5 Kreiraj repozitorijum na GitHubu

1. Otvori [github.com](https://github.com) i uloguj se.
2. **New repository** (zeleno dugme).
3. Ime: npr. `dajana-ai` (ili `dajana12` – kako hoćeš).
4. **Public** ili **Private** – po želji.
5. **Ne** čekiraj "Add a README" (već imaš kod).
6. Klikni **Create repository**.

### 1.6 Poveži lokalni projekat sa GitHubom i push

Zameni `TVOJ_USER` i `IME_REPO` svojim podacima (npr. `lmalesevic` i `dajana-ai`):

```powershell
git remote add origin https://github.com/TVOJ_USER/IME_REPO.git
git branch -M main
git push -u origin main
```

Ako te pita za nalog – GitHub username i **Personal Access Token** (lozinka ne prolazi; token: GitHub → Settings → Developer settings → Personal access tokens).

---

## Deo 2: Na laptopu – kloniranje i pokretanje

### 2.1 Kloniranje

Na laptopu otvori PowerShell (ili Git Bash) i npr.:

```powershell
cd C:\Users\TvojUser\Desktop
git clone https://github.com/TVOJ_USER/IME_REPO.git dajana-ai-main
cd dajana-ai-main
```

*(Zameni putanju i URL repoa ako drugačije zoveš.)*

### 2.2 Mobilna app (Expo) – da sve radi (API, baza)

1. **Instalacija zavisnosti**

```powershell
cd dajana-ai-app
npm install
```

2. **Env fajl (obavezno)**  
Bez ovoga app ne može da priča sa Supabase-om.

- Kopiraj primer: u folderu `dajana-ai-app` treba da postoji `.env.example`.
- Kreiraj fajl `.env` (u istom folderu) i nalepi isto što imaš na trenutnom kompu u `dajana-ai-app/.env`.

   Na trenutnom kompu možeš da otvoriš `dajana-ai-app\.env`, kopiraš ceo sadržaj i na laptopu u `dajana-ai-app\.env` to nalepiš.  
   Ili ručno napraviš `.env` sa:

```env
EXPO_PUBLIC_SUPABASE_URL=https://TvojProjekat.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

   (Vrednosti iz **Supabase Dashboard → Project Settings → API**.)

3. **Pokretanje**

```powershell
npx expo start
```

Onda skeniraj QR kod (Expo Go) ili otvori u emulatoru. Baza i auth rade preko Supabase – sve što app koristi (API, baza) radi jer su ključevi u `.env`.

### 2.3 Admin – da sve radi (baza, Stripe, itd.)

1. **Instalacija**

```powershell
cd dajana-ai-main\dajana-ai-admin
npm install
```

2. **Env fajl (obavezno)**  
Bez ovoga admin ne može ni bazu ni Stripe.

- U folderu `dajana-ai-admin` treba da postoji `.env.example`.
- Kreiraj **`.env.local`** i u njega stavi isto što na trenutnom kompu imaš u `dajana-ai-admin\.env.local`.

   Ili ručno napraviš `.env.local` sa (vrednosti iz Supabase Dashboard → API i Stripe Dashboard):

```env
NEXT_PUBLIC_SUPABASE_URL=https://TvojProjekat.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

   Ako koristiš chat/video iz admina, dodaj i:

```env
OPENAI_API_KEY=sk-proj-...
VIDEO_API_KEY=...
```

3. **Pokretanje**

```powershell
npm run dev
```

Otvori u browseru: **http://localhost:3000**

---

## Ukratko – šta ti treba da “sve radi”

| Šta            | Gde živi        | Na laptopu šta da uradiš                                      |
|----------------|-----------------|---------------------------------------------------------------|
| **Kod**        | GitHub          | `git clone` u `dajana-ai-main`                               |
| **Baza / API** | Supabase (cloud)| Isti Supabase projekat – u app `.env` i admin `.env.local` stavi iste URL i ključeve kao na kompu. |
| **Plaćanja**   | Stripe (cloud)  | Isti Stripe – u admin `.env.local` stavi isti `STRIPE_SECRET_KEY` i `STRIPE_WEBHOOK_SECRET`. |
| **App env**    | Lokalno         | `dajana-ai-app/.env` – kopija sa kompa ili iz Supabase/Stripe. |
| **Admin env**  | Lokalno         | `dajana-ai-admin/.env.local` – kopija sa kompa.               |

Nikad ne commituj `.env` ili `.env.local` – oni ostaju samo na tvom kompu i laptopu.

---

## Ako kasnije na kompu nešto promeniš

Na kompu:

```powershell
cd "c:\Users\kompl\OneDrive\Desktop\dajana aplikacija\dajana-ai-main"
git add .
git commit -m "Opis izmene"
git push
```

Na laptopu:

```powershell
cd C:\Users\TvojUser\Desktop\dajana-ai-main
git pull
```

Zatim u oba foldera (`dajana-ai-app` i `dajana-ai-admin`) ako dodaješ nove npm pakete, na laptopu ponovo:

```powershell
npm install
```
