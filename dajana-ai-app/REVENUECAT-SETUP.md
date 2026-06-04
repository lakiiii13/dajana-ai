# RevenueCat + Google Play – korak po korak

Klijent već ima RevenueCat nalog. Ovaj vodič objašnjava šta da podesiš u **RevenueCat**, **Google Play** i **Supabase** da Shop u aplikaciji stvarno naplaćuje.

**Brzi checklist (Play + Apple + cene):** vidi **`IAP-NAMESTANJE.md`** u istom folderu.

---

## Šta je već urađeno u kodu

- Shop koristi **RevenueCat SDK** (`react-native-purchases`) umesto Stripe simulacije
- Pri loginu: `Purchases.logIn(supabase_user_id)` – webhook zna kog korisnika da ažurira
- Supabase Edge Function: `revenuecat-webhook` – upisuje pretplatu, kredite i transakcije
- Product ID-jevi u kodu (`constants/subscription.ts`):
  - `dajana_monthly` – mesečna pretplata
  - `dajana_yearly` – godišnja pretplata
  - `dajana_topup_5` – doplata kredita (consumable)

**Package name (Android):** `com.zerocodeapps.dajana`  
**Bundle ID (iOS):** `com.osbcompany.dajanaai` (App Store Connect app; Android ostaje `com.zerocodeapps.dajana`)

---

## 1. RevenueCat dashboard (klijentov nalog)

### 1.1 Dodaj aplikacije

1. [app.revenuecat.com](https://app.revenuecat.com) → projekat klijenta
2. **Project settings → Apps → + New**
3. **Android app**
   - Package name: `com.zerocodeapps.dajana`
   - Poveži **Google Play** (service account JSON – vidi korak 2)
4. **iOS app** (kad bude App Store)
   - Bundle ID: `com.osbcompany.dajanaai`
   - Poveži App Store Connect

### 1.2 API ključevi (za app)

Project → **API keys** → kopiraj:

| Platforma | Env varijabla |
|-----------|---------------|
| Android | `EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID` |
| iOS | `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS` |

Dodaj u `dajana-ai-app/.env` i u **EAS Secrets** (production build):

```bash
eas secret:create --scope project --name EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID --value goog_XXXXX
eas secret:create --scope project --name EXPO_PUBLIC_REVENUECAT_API_KEY_IOS --value appl_XXXXX
```

### 1.3 Products (mora da se poklapa sa Play Store-om)

**Product catalog → Products** – dodaj 3 proizvoda sa **istim ID-jevima** kao u kodu:

| Product ID | Tip |
|------------|-----|
| `dajana_monthly` | Subscription |
| `dajana_yearly` | Subscription |
| `dajana_topup_5` | Consumable (one-time) |

### 1.4 Entitlement

**Entitlements → + New**

- Identifier: `premium` (kao u kodu)
- Attach products: `dajana_monthly`, `dajana_yearly`

(`dajana_topup_5` nije entitlement – to je jednokratna kupovina.)

### 1.5 Offering

**Offerings → default (ili kreiraj `default`)**

Dodaj pakete i mapiraj na product ID-jeve:

| Package | Product |
|---------|---------|
| Monthly | `dajana_monthly` |
| Annual | `dajana_yearly` |
| Custom / Lifetime / ili drugi slot | `dajana_topup_5` |

Offering mora biti **Current**.

### 1.6 Webhook ka Supabase

**Project → Integrations → Webhooks → + New**

- URL: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/revenuecat-webhook`
- Authorization header: `Bearer TVOJ_TAJNI_STRING`
- Event types: barem `INITIAL_PURCHASE`, `RENEWAL`, `NON_RENEWING_PURCHASE`, `EXPIRATION`, `CANCELLATION`

Tajni string stavi u Supabase:

```bash
npx supabase secrets set REVENUECAT_WEBHOOK_SECRET=TVOJ_TAJNI_STRING
```

Deploy funkcije:

```bash
npx supabase functions deploy revenuecat-webhook --no-verify-jwt
```

(`--no-verify-jwt` jer RevenueCat ne šalje Supabase JWT – koristimo Bearer secret.)

---

## 2. Google Play Console

### 2.1 Kreiraj app (ako nije)

- [play.google.com/console](https://play.google.com/console)
- Create app → Dajana AI
- Package: `com.zerocodeapps.dajana`

### 2.2 Monetization setup

- **Monetize → Monetization setup** – poveži merchant / bank nalog

### 2.3 Proizvodi (isti ID-jevi!)

**Monetize → Products → Subscriptions**

1. `dajana_monthly` – base plan, cena npr. 17 EUR/mesec
2. `dajana_yearly` – base plan, cena npr. 163 EUR/godina (20% popust)

**Monetize → Products → In-app products**

3. `dajana_topup_5` – **Consumable**, 5 EUR

Status mora biti **Active** pre testiranja.

### 2.4 Service account za RevenueCat

1. Play Console → **Setup → API access**
2. Link Google Cloud project
3. Create service account → grant **View financial data** + **Manage orders**
4. Download JSON key → upload u RevenueCat (Android app settings)

### 2.5 License testers

**Setup → License testing** – dodaj Gmail test naloge.

---

## 3. Build i test

IAP **ne radi u Expo Go** – mora EAS build:

```bash
cd dajana-ai-app
eas build --platform android --profile production
```

Upload u **Internal testing** track, dodaj testere, instaliraj sa Play Store linka (ne sideload APK).

Test kupovina:
1. Prijavi se u app
2. Shop → Pretplati se
3. Google Play dijalog → test kartica
4. Za par sekundi webhook ažurira kredite u Supabase

Proveri u Supabase: tabele `subscriptions`, `user_credits`, `transactions`.

---

## 4. Play Store produkcija (kratko)

1. Store listing (opis, screenshot-i, ikona 512, feature graphic)
2. Privacy policy URL (obavezno)
3. App content → Content rating, Data safety, Target audience
4. Release → Production → upload AAB (`eas submit --platform android`)
5. Google review (1–7 dana)

Detaljnije testiranje bez Play Store-a: vidi `TESTFLIGHT-I-TESTIRANJE.md` (Android APK preview ne podržava IAP).

---

## Checklist

- [ ] RevenueCat: Android app + service account
- [ ] RevenueCat: 3 products, entitlement `premium`, current Offering
- [ ] RevenueCat: webhook URL + secret
- [ ] Google Play: 2 subscriptions + 1 consumable (Active)
- [ ] `.env` / EAS: `EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID`
- [ ] Supabase secret: `REVENUECAT_WEBHOOK_SECRET`
- [ ] Deploy: `revenuecat-webhook`
- [ ] EAS production build → Internal testing
- [ ] Test kupovina sa license tester nalogom

---

## Ako product nije pronađen u app-u

Poruka: *Proizvod "dajana_monthly" nije pronađen u RevenueCat Offering-u*

Proveri redom:
1. Product ID u Play Console = ID u RevenueCat = ID u kodu
2. Offering je **Current** i sadrži sve 3 paketa
3. Play proizvod je **Active**
4. Novi EAS build posle dodavanja env ključa
5. App instalirana sa **Internal testing** track-a (ne APK sideload)
