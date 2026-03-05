# Gde naći API ključeve za DAJANA AI

Svi ključevi idu **u Supabase** (Edge Function Secrets), ne u `.env` aplikacije.

---

## 1. OpenAI (Chat – Pitaj Dajanu)

**Secret u Supabase:** `OPENAI_API_KEY`

**Gde uzeti:**
1. Otvori: **https://platform.openai.com**
2. Uloguj se (ili napravi nalog).
3. Levo meni: **API keys** (ili direktno: https://platform.openai.com/api-keys).
4. **Create new secret key** → ime npr. "Dajana" → kopiraj ključ (počinje sa `sk-proj-...`).
5. Jednom se prikaže – sačuvaj negde privremeno, pa ga nalepi u Supabase.

**Supabase:** Dashboard → **Edge Functions** → **Secrets** → Add secret:  
Name = `OPENAI_API_KEY`, Value = `sk-proj-...`

---

## 2. Google Gemini (Try-On – generisanje slika)

**Secret u Supabase:** `GEMINI_API_KEY`

**Gde uzeti:**
1. Otvori: **https://aistudio.google.com**
2. Uloguj se sa Google nalogom.
3. Levo ili gore: **Get API key** / **Create API key** (ili: https://aistudio.google.com/apikey).
4. Izaberi projekat ili kreiraj novi → kopiraj ključ.

**Supabase:** Dashboard → Edge Functions → Secrets → Add:  
Name = `GEMINI_API_KEY`, Value = (tvoj Gemini ključ)

---

## 3. Video (TheNewBlack – Kreiraj video)

**Secret u Supabase:** `VIDEO_API_KEY`

**Gde uzeti:**
- Ovaj servis je **TheNewBlack** (ili drugi AI video provider koji projekat koristi).
- Ključ obično dobijaš od njih (email, njihov dashboard, ugovor).
- Ako si ga ranije imao – traži u starim mailovima ili dokumentima projekta.
- Ako nemaš: kontaktiraj TheNewBlack / provajdera i zatraži API key za tvoj projekat.

**Supabase:** Dashboard → Edge Functions → Secrets → Add:  
Name = `VIDEO_API_KEY`, Value = (ključ koji dobiješ)

---

## Rezime – šta gde staviti

| Ključ            | Gde ga naći                    | Supabase Secret name |
|------------------|---------------------------------|----------------------|
| OpenAI           | https://platform.openai.com/api-keys | `OPENAI_API_KEY`     |
| Gemini           | https://aistudio.google.com/apikey   | `GEMINI_API_KEY`     |
| Video (TheNewBlack) | Od provajdera / stari mailovi   | `VIDEO_API_KEY`      |

Sve tri vrednosti unosiš u **Supabase Dashboard → Edge Functions → Secrets**. U **.env** aplikacije ne stavljaš ove ključeve – samo `EXPO_PUBLIC_SUPABASE_URL` i `EXPO_PUBLIC_SUPABASE_ANON_KEY`.

---

## Video ne radi – šta proveriti

Ako vidiš **"Servis za video je privremeno nedostupan"** ili drugu grešku pri kreiranju videa:

1. **Poruka u aplikaciji** – sada se prikazuje stvarna greška sa servera. Ako piše **"VIDEO_API_KEY not set in Supabase Edge Function secrets"**:
   - U Supabase: **Edge Functions → Secrets** dodaj/proveri secret **VIDEO_API_KEY** (tačan naziv).
   - Posle izmene Secrets, Edge funkcije automatski koriste nove vrednosti (nema potrebe za redeployom).

2. **Ako piše da API ključ nije validan** – proveri da li je TheNewBlack ključ ispravan i da imaš kredite na nalogu (TheNewBlack naplaćuje po kreditima). API ključ: TheNewBlack → profil → API.

3. **Logovi na Edge-u** – u Supabase: **Edge Functions → video-start → Logs**. Tamo vidiš tačan status (500, 502) i eventualni stack trace ili odgovor od TheNewBlack API-ja.
