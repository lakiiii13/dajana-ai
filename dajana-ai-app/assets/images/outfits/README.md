# Test outfiti – slike po obliku tijela + sezona

Stavi ovde svoje slike (10–12) u foldere **oblik + sezona**. Jedna slika u folderu = jedan outfit.

## Mapiranje tvojih foldera → naši folderi u projektu

Preimenuj svoje foldere (ili kopiraj slike) prema ovoj tabeli:

| Tvoje ime foldera | Folder u projektu (`assets/images/outfits/...`) |
|-------------------|--------------------------------------------------|
| Oblik pješčanog sata + PRAVA JESEN | `hourglass_warm_autumn` |
| Oblik pješčanog sata + PRAVA ZIMA | `hourglass_cool_winter` |
| Oblik pješčanog sata + PRAVO LJETO | `hourglass_cool_summer` |
| Oblik pješčanog sata + SJAJNA ZIMA | `hourglass_clear_winter` |
| Oblik tijela - kašika + MEKA JESEN | `pear_soft_autumn` |
| Oblik tijela - kašika + PRAVA JESEN | `pear_warm_autumn_kasika` |
| Oblik tijela kruška + PRAVA JESEN | `pear_warm_autumn` |
| Oblik tijela kruška + PRAVO PROLJEĆE | `pear_warm_spring` |
| Pravougani oblik tijela + PRAVO LJETO | `rectangle_cool_summer` |
| Pravougaoni oblik tijela + PRAVA JESEN | `rectangle_warm_autumn` |
| Pravougaoni oblik tijela + PRAVA ZIMA | `rectangle_cool_winter` |
| Pravougaoni oblik tijela + TAMNA JESEN | `rectangle_deep_autumn` |

**Napomena:** „Oblik tijela - kašika“ je u bazi mapiran na tip figure **pear** (kruška); u aplikaciji će se filtrirati kao pear. Ako kasnije dodaš poseban tip „kašika“, možeš promeniti to u manifestu.

## Šta uraditi

1. Otvori `assets/images/outfits/` u projektu.
2. U svaki od 12 foldera iz tabele stavi svoje slike – **imenovanje je proizvoljno** (npr. `outfit.jpg`, `IMG_1234.png`).
3. U korenu projekta pokreni: **`npm run seed:outfits:discover`**  
   Skripta skenira sve foldere i upisuje u `scripts/seed-outfits-manifest.json` stvarne putanje i imena slika, tako da ne moraš ništa da menjaš ručno.
4. Zatim pokreni upload: **`npm run seed:outfits`** (vidi ispod).

## Upload u Supabase (test outfiti u aplikaciji)

1. U `.env` dodaj (ako već nemaš):  
   `SUPABASE_SERVICE_ROLE_KEY=...`  
   Vrednost nađeš u Supabase Dashboard → Project Settings → API → service_role (secret).

2. Iz korena projekta pokreni:  
   `npm run seed:outfits`  
   ili:  
   `node scripts/seed-outfits-to-supabase.js`

Skripta učitava `scripts/seed-outfits-manifest.json`, za svaki entry uploaduje sliku u Storage bucket `outfits` i unosi red u tabelu `outfits`. Aplikacija onda prikazuje outfite preko postojećeg API-ja (Capsule, Outfit builder).

---

## Alternativa: samo sezona (stara struktura)

I dalje možeš koristiti foldere samo po sezoni: `light_spring`, `warm_autumn`, `cool_summer`, itd. U manifestu onda za svaku sliku ručno staviš `body_types` i `seasons`.
