# Pokretanje DAJANA AI servera

Kada uđeš u projekat, koristi ovo da pokreneš app i admin.

---

## 1. Mobilna aplikacija (Expo)

### Prvi put (ili posle `git pull`)

```bash
cd dajana-ai-main/dajana-ai-app
npm install
npx expo start
```

### Svaki sledeći put

```bash
cd dajana-ai-main/dajana-ai-app
npx expo start
```

**Za brata / bilo koga:** Otvori terminal u folderu `dajana-ai-main/dajana-ai-app`, uradi `npm install` ako nisi ranije, pa `npx expo start`. Na telefonu instaliraj **Expo Go** i skeniraj QR kod iz terminala.

---

## 2. Admin panel (Next.js)

### Prvi put (ili posle `git pull`)

```bash
cd dajana-ai-main/dajana-ai-admin
npm install
npm run dev
```

### Svaki sledeći put

```bash
cd dajana-ai-main/dajana-ai-admin
npm run dev
```

Admin se otvara u browseru (obično **http://localhost:3000**). Za produkciju: `npm run build` pa `npm start`.

---

## Kapsula / Ormar – slika i video

Stavi fajlove na ova mesta (ime tačno kako piše):

| Fajl | Putanja u projektu |
|------|---------------------|
| `slika_za_kapsulu.jpg` | `dajana-ai-main/dajana-ai-app/assets/images/slika_za_kapsulu.jpg` |
| `ulazak_u_ormar.mp4` | `dajana-ai-main/dajana-ai-app/assets/videos/ulazak_u_ormar.mp4` |

Slika se vidi na ekranu izbora (Ormar polovina) i kao pozadina u ormaru. Video se pusta kad korisnik uđe u ormar.
