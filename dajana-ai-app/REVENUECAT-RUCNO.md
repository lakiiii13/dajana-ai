# RevenueCat — ručno podešavanje (Google Play)

Koristi ovo ako nemaš sync sa Play-a. **ID-jevi moraju biti identični** Play Console-u i kodu (`constants/subscription.ts`).

---

## Pre nego što kreneš

- Play Console: `dajana_monthly`, `dajana_yearly`, `dajana_topup_5` — **Active**
- RevenueCat app: **Dajana AI** → package `com.zerocodeapps.dajana`
- `.env`: `EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID=goog_...`

**Za pravu kupovinu na Play-u** i dalje treba kasnije: JSON upload + Play grant za `revenuecat-play@dajana-ai.iam.gserviceaccount.com`.

---

## 1. Proizvod: mesečna pretplata

1. [app.revenuecat.com](https://app.revenuecat.com) → projekat **Dajana AI**
2. **Product catalog** → **Products** → **+ New**
3. Popuni:
   - **Identifier:** `dajana_monthly`
   - **Type:** Subscription
   - **Store / App:** izaberi **Dajana AI (Google Play)** — **ne** Test Store
4. Save

---

## 2. Proizvod: godišnja pretplata

1. **+ New**
2. **Identifier:** `dajana_yearly`
3. **Type:** Subscription
4. **Store:** Dajana AI (Google Play)
5. Save

---

## 3. Proizvod: doplata (topup)

1. **+ New**
2. **Identifier:** `dajana_topup_5`
3. **Type:** Consumable ili One-time (šta RC ponudi za jednokratno)
4. **Store:** Dajana AI (Google Play)
5. Save

---

## 4. Entitlement `premium`

1. **Product catalog** → **Entitlements**
2. Otvori **`premium`** (ili **+ New** → identifier: `premium`)
3. **Attach products:**
   - `dajana_monthly`
   - `dajana_yearly`
4. **Ne** dodavaj `dajana_topup_5` na premium
5. Save

---

## 5. Offering `default` (obavezno Current)

1. **Product catalog** → **Offerings**
2. Otvori **default** (ili **+ New** → identifier: `default`)
3. Dodaj **Packages** (ako nema):

| Package type (RC) | Product identifier |
|-------------------|-------------------|
| Monthly | `dajana_monthly` |
| Annual | `dajana_yearly` |
| Custom ili Lifetime ili treći slot | `dajana_topup_5` |

4. **Save**
5. Na listi Offerings → meni pored `default` → **Make current** / označi kao **Current**

Bez **Current**, app javlja: *Proizvod nije pronađen u Offering-u*.

---

## 6. Android app — credentials (kad imaš)

1. **Project settings** → **Apps** → **Dajana AI** (Android)
2. **Service account credentials** → upload `.json` iz Google Cloud (`revenuecat-play@...`)
3. Save

Vlasnik Play: grant na `revenuecat-play@dajana-ai.iam.gserviceaccount.com` (Pregled finansijskih podataka).

---

## 7. Provera u RevenueCat

- [ ] 3 proizvoda pod **Google Play** (ne samo Test Store)
- [ ] Entitlement `premium` → monthly + yearly
- [ ] Offering `default` = **Current**, 3 paketa
- [ ] Android API key = `goog_HhgEUSgAFLTNdkryreUudfRSaje`

---

## 8. Provera u app-u (posle EAS builda)

```powershell
cd dajana-ai-app
node scripts/check-env-keys.js
npx eas-cli build --platform android --profile production
```

Instalacija sa **Internal testing** Play linka → login → **Shop** → cene iz store-a.

---

## Test Store (opciono)

Proizvodi na **Test Store** mogu ostati za sandbox. Za produkciju na Play-u offering mora koristiti proizvode vezane za **Google Play** app.

---

## Mapiranje (kod = Play = RC)

| Shop u app-u | Product ID |
|--------------|------------|
| Mesečna | `dajana_monthly` |
| Godišnja | `dajana_yearly` |
| Doplata 5€ | `dajana_topup_5` |

Entitlement u kodu: `premium` (`constants/subscription.ts`).
