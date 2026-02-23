# DAJANA AI

Mobilna aplikacija za stilsko savetovanje.

## Struktura Projekta

```
dajana-ai/
├── dajana-ai-app/      # Mobile App (Expo/React Native)
├── dajana-ai-admin/    # Admin Panel (Next.js)
└── database/           # SQL šeme i migracije
```

## Quick Start

### 1. Database Setup (Supabase)

1. Otvori Supabase Dashboard: https://supabase.com/dashboard/project/nepzlplasrbnpfgkemwr
2. Idi na **SQL Editor**
3. Kopiraj sadržaj `database/schema.sql`
4. Pokreni SQL

### 2. Mobile App

```bash
cd dajana-ai-app
npm install
npx expo start
```

### 3. Admin Panel

```bash
cd dajana-ai-admin
npm install
npm run dev
```

## Environment Variables

### Mobile App (.env)
- `EXPO_PUBLIC_SUPABASE_URL` - Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key (safe for frontend)
- `EXPO_PUBLIC_R2_PUBLIC_URL` - Cloudflare R2 public URL
- `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key

### Admin Panel (.env.local)
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - ⚠️ SECRET - Supabase service role key
- `CLOUDFLARE_*` - R2 credentials for upload

## Tehnologije

- **Mobile**: React Native, Expo SDK 50+, Expo Router
- **Admin**: Next.js 14, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (Auth, PostgreSQL, Edge Functions)
- **Storage**: Cloudflare R2
- **Payments**: Stripe
- **AI**: Google Gemini, Kling (fal.ai), OpenAI GPT-4
