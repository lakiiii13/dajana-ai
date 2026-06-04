# IAP nameštanje – Play, Apple, RevenueCat, Supabase

App je **besplatna** za preuzimanje. Naplata ide samo preko **3 In-App Purchase** proizvoda.

**Android package:** `com.zerocodeapps.dajana` · **iOS bundle (ASC):** `com.osbcompany.dajanaai`

---

## Tabela – šta gde unosiš

| Product ID | Tip | Cena (preporuka) | Google Play | Apple | RevenueCat |
|------------|-----|------------------|-------------|-------|------------|
| `dajana_monthly` | Pretplata (mesečna) | **17,00 EUR** | Subscription | Auto-Renewable | Product + u Offering |
| `dajana_yearly` | Pretplata (godišnja) | **163,00 EUR** | Subscription | Auto-Renewable | Product + u Offering |
| `dajana_topup_5` | Jednokratno | **5,00 EUR** | In-app (consumable) | Consumable | Product + u Offering |

**Entitlement u RevenueCat:** `premium` → veži `dajana_monthly` i `dajana_yearly` (ne topup).

**Šta korisnica dobija:** vidi `constants/credits.ts` (50 slika, 2 videa, 2 analize / period; topup +10/+1/+2).

---

## Korak 0 – Lokalno (tvoj laptop)

**Brza provera:** `npm run check:env:keys` (vidi `IAP-PRIJE-BUILDA.md`).

### 0.1 App `.env`

U `dajana-ai-app/.env` (kopiraj iz `.env.example` ako nema):

```env
EXPO_PUBLIC_SUPABASE_URL=https://TVOJ_REF.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID=goog_...
EXPO_PUBLIC_REVENUECAT_API_KEY_IOS=appl_...
```

Provera:

```powershell
cd c:\Users\mik\Desktop\dajana-ai\dajana-ai-app
node scripts/check-env.js --iap
```

### 0.2 EAS Secrets (production build)

```powershell
cd c:\Users\mik\Desktop\dajana-ai\dajana-ai-app
eas secret:create --scope project --name EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID --value goog_XXXXX
eas secret:create --scope project --name EXPO_PUBLIC_REVENUECAT_API_KEY_IOS --value appl_XXXXX
```

Isti Supabase URL/anon key kao u `.env`.

---

## Korak 1 – Google Play Console

1. [play.google.com/console](https://play.google.com/console) → app **Dajana AI**  
   Package: `com.zerocodeapps.dajana`

2. **Monetize → Monetization setup** – poveži merchant / banku.

3. **Subscriptions** (Monetize → Products → Subscriptions):

   | Subscription ID | Base plan | Cena |
   |-----------------|-----------|------|
   | `dajana_monthly` | npr. `monthly` | 17,00 EUR / 1 month |
   | `dajana_yearly` | npr. `yearly` | 163,00 EUR / 1 year |

   Status: **Active** (može trebati da app bude u internal testing).

4. **In-app products** (consumable):

   | Product ID | Cena |
   |------------|------|
   | `dajana_topup_5` | 5,00 EUR |

5. **Setup → License testing** – dodaj Gmail test naloge.

6. **Setup → API access** – service account JSON za RevenueCat (View financial data + Manage orders).

---

## Korak 2 – App Store Connect (iOS)

1. App → Bundle ID `com.osbcompany.dajanaai`
2. **Agreements** – Paid Applications + banka.
3. **Subscriptions** – grupa (npr. `dajana_premium`):
   - `dajana_monthly` – npr. tier **17,99 EUR** (ili najbliži 17 €)
   - `dajana_yearly` – npr. **163,99 EUR** ili tier za ~163 €
4. **In-App Purchases → Consumable:** `dajana_topup_5` – **4,99 / 5,99 EUR** tier
5. Status **Ready to Submit** / povezano sa app verzijom.

---

## Korak 3 – RevenueCat

1. [app.revenuecat.com](https://app.revenuecat.com) → projekat klijenta.

2. **Apps:**
   - Android: package `com.zerocodeapps.dajana` + upload Play service account JSON
   - iOS: bundle `com.osbcompany.dajanaai` + In-App Purchase + App Store Connect API key

3. **Product catalog → Products** – dodaj 3 proizvoda sa **istim ID-jevima** kao u Play/Apple.

4. **Entitlements → `premium`** – attach `dajana_monthly`, `dajana_yearly`.

5. **Offerings → `default`** (mora biti **Current**):

   | Package tip | Product |
   |-------------|---------|
   | Monthly | `dajana_monthly` |
   | Annual | `dajana_yearly` |
   | Custom / Lifetime / drugi slot | `dajana_topup_5` |

6. **Integrations → Webhooks:**
   - URL: `https://TVOJ_REF.supabase.co/functions/v1/revenuecat-webhook`
   - Authorization: `Bearer TVOJ_TAJNI_STRING` (isti kao u Supabase secret ispod)
   - Events: `INITIAL_PURCHASE`, `RENEWAL`, `NON_RENEWING_PURCHASE`, `EXPIRATION`, `CANCELLATION`

7. **API keys** → kopiraj u `.env` / EAS (`goog_...`, `appl_...`).

---

## Korak 4 – Supabase (webhook)

Iz root-a repoa (gde je `supabase/`):

```powershell
cd c:\Users\mik\Desktop\dajana-ai
npx supabase login
npx supabase link --project-ref TVOJ_REF
npx supabase secrets set REVENUECAT_WEBHOOK_SECRET=TVOJ_TAJNI_STRING
npx supabase functions deploy revenuecat-webhook --no-verify-jwt
```

`TVOJ_TAJNI_STRING` = isti string kao u RevenueCat webhook Authorization (posle `Bearer `).

---

## Korak 5 – Build i test

IAP **ne radi u Expo Go**.

```powershell
cd c:\Users\mik\Desktop\dajana-ai\dajana-ai-app
eas build --platform android --profile production
```

- Upload AAB u **Internal testing**
- Instaliraj sa Play linka (ne sideload APK)
- Uloguj se u app → **Profil → Shop** → kupovina test nalogom

Provera u Supabase: `subscriptions`, `user_credits`, `transactions`.

---

## Checklist (štikliraj)

- [ ] Play: `dajana_monthly`, `dajana_yearly`, `dajana_topup_5` – Active + cene
- [ ] Apple: ista 3 ID-ja + cene
- [ ] RevenueCat: apps povezane, products, entitlement `premium`, offering **Current**
- [ ] RevenueCat webhook → Supabase
- [ ] `revenuecat-webhook` deploy + `REVENUECAT_WEBHOOK_SECRET`
- [ ] `.env` + EAS: RevenueCat API ključevi
- [ ] EAS production build + test kupovina

---

## Česte greške

| Poruka u app-u | Rešenje |
|----------------|---------|
| Proizvod nije pronađen u Offering-u | ID u Play = RC = kod; Offering Current; novi build |
| RevenueCat nije podešen | API ključ u `.env` / EAS Secrets |
| Kupovina ne menja kredite | Webhook URL, secret, deploy `revenuecat-webhook` |
| Dijalog se ne pojavi | Nisi na Internal testing track; ili Expo Go |

Detaljnije: `REVENUECAT-SETUP.md`.
