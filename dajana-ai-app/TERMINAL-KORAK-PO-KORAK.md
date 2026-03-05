# Terminal – korak po korak

Sve komande pokrećeš iz **roota projekta** (folder gde je i `dajana-ai-app` i `supabase`).  
Na primer: `c:\Users\kompl\OneDrive\Desktop\dajana aplikacija\dajana-ai-main`

---

## Korak 1: Otvori terminal u rootu projekta

```bash
cd dajana-ai-main
```

(Ako si već u `dajana-ai-main`, preskoči ovaj korak.)

---

## Korak 2: Supabase (prvi put) – login i link

Samo ako još nisi povezao projekat sa Supabase:

```bash
npx supabase login
```

(Otvorice se browser, uloguj se na Supabase.)

Zatim:

```bash
npx supabase link
```

Izaberi projekat (ili unesi Project ID iz Supabase Dashboarda). Posle ovoga možeš deploy-ovati funkcije.

---

## Korak 3: Deploy Edge Functions

Jednu po jednu (ili sve u nizu):

```bash
npx supabase functions deploy generate-try-on
```

```bash
npx supabase functions deploy chat
```

```bash
npx supabase functions deploy video-start
```

```bash
npx supabase functions deploy video-result
```

```bash
npx supabase functions deploy delete-account
```

Ako sve prođe, na kraju vidiš poruku tipa “Deployed function …”.

---

## Korak 4: Pokretanje aplikacije (Expo)

```bash
cd dajana-ai-app
```

```bash
npm install
```

(Samo prvi put ili posle `git pull` kada ima novih paketa.)

```bash
npx expo start
```

Ostani u ovom terminalu dok koristiš app. Na telefonu otvori **Expo Go** i skeniraj QR kod.

---

## Korak 5 (opciono): Admin panel

Otvori **novi** terminal (Expo neka ostane da radi), isto u rootu projekta:

```bash
cd dajana-ai-main
cd dajana-ai-admin
npm install
npm run dev
```

Admin panel: u browseru otvori **http://localhost:3000**.

---

## Rezime – redosled za prvi put

1. `cd dajana-ai-main`
2. `npx supabase login` → `npx supabase link`
3. `npx supabase functions deploy generate-try-on`
4. `npx supabase functions deploy chat`
5. `npx supabase functions deploy video-start`
6. `npx supabase functions deploy video-result`
7. `npx supabase functions deploy delete-account`
8. `cd dajana-ai-app` → `npm install` → `npx expo start`

Posle toga svaki put dovoljno je: `cd dajana-ai-main/dajana-ai-app` pa `npx expo start`.
