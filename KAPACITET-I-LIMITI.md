# Kapacitet i limiti – šta se dešava pri većem broju korisnika

## Šta već štiti aplikaciju

### 1. Krediti (po korisniku)
- **Slike:** 50 / 31 dana (obnova od uplate)
- **Video:** 2 / 31 dana
- **AI analize:** 2 / 31 dana

Jedan korisnik **ne može** da šalje neograničene zahteve – mora imati kredite. Provera je i u aplikaciji i na backendu (Edge funkcije pozivaju `checkCredits`).

### 2. Rate limiting (zahtevi u minuti, po korisniku)
| Funkcija           | Limit      |
|--------------------|------------|
| video-start        | 10 / min   |
| video-result       | 60 / min   |
| generate-try-on    | 10 / min   |
| outfit-advice      | 15 / min   |
| chat               | 30 / min   |
| upload-to-r2       | 30 / min   |

Ako neko konstantno šalje zahteve, posle N zahteva u minuti dobija **429** i poruku „Previše zahteva. Sačekajte malo.“

### 3. R2 / Cloudflare
- Edge (upload-to-r2) ima limit memorije; pri preopterećenju vraća **WORKER_LIMIT**.
- Aplikacija: ne retry-uje na preopterećenost, prikazuje prijateljsku poruku; za video postoji fallback na Supabase ako R2 ne primi.

---

## Šta može da zakači pri „većim ljudima“

1. **Supabase plan** – broj istovremenih Edge poziva i timeout zavise od plana. Pri velikom broju korisnika odjednom može doći do više 5xx ili timeout-a ako se pređe limit.
2. **Spoljni API-ji** – TheNewBlack (video) i Gemini (try-on, saveti) imaju svoje kvote i rate limitove. Kad se prekorače, dobijate 429/503 i poruke tipa „servis prebukiran“.
3. **Trošak** – više korisnika = više poziva ka video i Gemini API-ju. Krediti ograničavaju trošak po korisniku, ali ukupan račun raste sa brojem aktivnih korisnika.
4. **Rate limit u memoriji** – trenutno je u RAM-u po Edge instance. Pri mnogo instanci jedan korisnik može teorijski da „prođe“ više puta u minuti ako zahtevi idu na različite instance. Za stvarno veliki promet trebalo bi centralno ograničenje (npr. Redis ili tabela u bazi).

---

## Da li će sve da podnese?

- **Jedan korisnik koji „konstantno šalje“** – da. Ograničen je kreditima i rate limitom; dobija 429 ili „nema kredita“ i ne može da sruši sistem.
- **Mnogo korisnika odjednom** – zavisi od:
  - Supabase plana (limiti Edge poziva),
  - kvota TheNewBlack i Gemini,
  - toga da li R2 često vraća WORKER_LIMIT (već imate fallback za čuvanje videa).

Preporuka: pratiti u Supabase Dashboard broj Edge invokacija i greške; ako raste promet, razmisliti o višem planu ili queue-u za video (npr. jedan video po korisniku u toku, ostalo u redu).
