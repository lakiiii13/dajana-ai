# Fontovi – klijent (Arquitecta, Canela)

Aplikacija koristi **Arquitecta** (primarni / body) i **Canela** (naslovi).  
Dok klijent ne dostavi `.ttf` / `.otf` fajlove, učitavaju se slični fontovi (Josefin Sans, Playfair Display) pod ovim imenima.

## Kad klijent dostavi fontove

1. Stavite fajlove u ovaj folder (`assets/fonts/`), npr.:
   - `Arquitecta-Thin.ttf`, `Arquitecta-Light.ttf`, `Arquitecta-Regular.ttf`, `Arquitecta-Medium.ttf`, `Arquitecta-SemiBold.ttf`, `Arquitecta-Bold.ttf`
   - `Canela-Regular.ttf`, `Canela-Medium.ttf`, `Canela-SemiBold.ttf`, `Canela-Bold.ttf`, `Canela-Italic.ttf` (ili ono što klijent pošalje)

2. U `app/_layout.tsx` u `useFonts({ ... })` zamenite alias redove sa:
   - `ArquitectaThin: require('@/assets/fonts/Arquitecta-Thin.ttf')`,
   - `ArquitectaRegular: require('@/assets/fonts/Arquitecta-Regular.ttf')`,
   - itd. za sve težine koje imate.
   - Isto za Canela: `CanelaRegular: require('@/assets/fonts/Canela-Regular.ttf')`, itd.

3. Ključevi u `_layout` moraju ostati: `ArquitectaThin`, `ArquitectaRegular`, `CanelaRegular`, `CanelaBold`, itd. – jer ih koristi `constants/theme.ts` (FONTS.primary.*, FONTS.heading.*).
