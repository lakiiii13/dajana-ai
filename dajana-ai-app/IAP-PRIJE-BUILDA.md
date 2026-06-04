# IAP – obavezno prije EAS builda

Pokreni:

```powershell
cd dajana-ai-app
npm run check:env:keys
```

Sve četiri linije moraju biti **SET**.

## Ako nešto fali u `.env`

| Ključ | Odakle |
|-------|--------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | isto |
| `EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID` | RevenueCat → API keys → Android (`goog_...`) |
| `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS` | RevenueCat → API keys → iOS (`appl_...`) |

## EAS production (obavezno isti ključevi u oblaku)

```powershell
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://....supabase.co"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "eyJ..."
eas secret:create --scope project --name EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID --value "goog_..."
eas secret:create --scope project --name EXPO_PUBLIC_REVENUECAT_API_KEY_IOS --value "appl_..."
```

## Supabase webhook (da kupovina upiše kredite)

```powershell
cd ..
npx supabase secrets set REVENUECAT_WEBHOOK_SECRET=tvoj_tajni_string
npx supabase functions deploy revenuecat-webhook --no-verify-jwt
```

U RevenueCat → Webhooks: isti `Bearer tvoj_tajni_string`.

## Build

```powershell
cd dajana-ai-app
eas build --platform ios --profile production
```

Detalji: `IAP-NAMESTANJE.md`.
