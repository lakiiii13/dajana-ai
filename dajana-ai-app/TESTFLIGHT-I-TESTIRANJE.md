# Kako poslati Dajana AI aplikaciju drugima na testiranje (TestFlight i Android)

## Šta ti treba

- **Za iPhone (TestFlight):** Apple Developer nalog ([developer.apple.com](https://developer.apple.com)) – **99 USD/godišnje**. Bez njega ne možeš koristiti TestFlight.
- **Za Android:** Google nalog. Za “internal testing” dovoljan je jedan put podešen Play Console (besplatno).

---

## 1. Priprema (jednom)

### Instalacija EAS CLI

U terminalu, u root-u projekta:

```bash
npm install -g eas-cli
```

### Uloguj se u Expo

```bash
eas login
```

(Ako nemaš nalog, napravi ga na [expo.dev](https://expo.dev).)

### Poveži projekat sa EAS (ako već nije)

```bash
eas init
```

Projekat već ima `projectId` u konfiguraciji, tako da će EAS reći da je projekat već povezan.

---

## 2. iOS – TestFlight (da drugi skine na iPhone)

### Korak A: Apple Developer i App Store Connect

1. Uplati **Apple Developer Program** i kreiraj **App ID** za aplikaciju (npr. `com.tvojabrand.dajana-ai-app` ili šta već koristiš).
2. U [App Store Connect](https://appstoreconnect.apple.com) kreiraj **novu aplikaciju** (npr. “Dajana AI”), izaberi taj Bundle ID.
3. U **App Store Connect → Aplikacija → TestFlight** kasnije dodaješ testere.

### Korak A2: Bundle ID u projektu (prvi put)

U `app.json` pod `expo.ios` dodaj **bundleIdentifier** koji odgovara App ID-u u Apple Developer:

```json
"ios": {
  "supportsTablet": true,
  "bundleIdentifier": "com.tvojabrand.dajana"
}
```

(Zameni `com.tvojabrand.dajana` stvarnim Bundle ID-om koji si kreirao u Apple Developer.)

### Korak B: Podešavanje credentials u EAS (prvi put)

U root-u projekta:

```bash
eas credentials
```

Izaberi **iOS** → **production** (ili prvi put “Set up new credentials”). EAS može da kreira **Distribution Certificate** i **Provisioning Profile** za tebe (izaberi “Let EAS handle it” ako nemaš svoje). Za TestFlight treba **App Store Connect API Key** ili prijava sa Apple ID-om kada budeš slao build.

### Korak C: Build za iOS (store build za TestFlight)

```bash
eas build --platform ios --profile production
```

Sačekaj da se build završi na Expo serverima (link ćeš dobiti u terminalu). Kada je gotov, dobijaš **.ipa** za slanje u App Store Connect.

### Korak D: Slanje builda na TestFlight

Kada je build uspešan:

```bash
eas submit --platform ios --profile production
```

EAS će ponuditi **poslednji uspešan iOS build**. Ako želiš drugi build, možeš izabrati po listi.

Prvi put ćeš morati da uneseš:

- **Apple ID** (email Apple naloga)
- **App-specific password** (napravi ga na [appleid.apple.com](https://appleid.apple.com) → Sign-In and Security → App-Specific Passwords)
- **Apple Team ID** (na [developer.apple.com](https://developer.apple.com) → Membership)
- **ASC App ID** – ID tvoje aplikacije u App Store Connect (npr. u URL-u: `.../app/1234567890` → broj je ASC App ID)

Ove vrednosti možeš uneti u **`eas.json`** u `submit.production.ios` da ne upisuješ svaki put:

```json
"submit": {
  "production": {
    "ios": {
      "appleId": "tvoj@email.com",
      "ascAppId": "1234567890",
      "appleTeamId": "XXXXXXXXXX"
    }
  }
}
```

**Ne commituj lozinke.** Za sigurnost koristi **App Store Connect API Key** (npr. u EAS Secrets) umesto app-specific password-a ako želiš.

### Korak E: Dodavanje testera u TestFlight

1. U [App Store Connect](https://appstoreconnect.apple.com) otvori svoju aplikaciju.
2. Idi na **TestFlight**.
3. Kada build prođe Apple reviziju (obično 10–30 min), u **Internal Testing** ili **External Testing**:
   - **Internal:** dodaj članove svog tima (Apple ID koji su u timu).
   - **External:** dodaj email adrese testera; Apple šalje im pozivnicu.
4. Testeri na iPhone-u treba da **skineju aplikaciju “TestFlight”** iz App Store-a, otvore mail sa pozivnicom i prihvate poziv – posle toga mogu da skidaju tvoju beta verziju.

---

## 3. Android – da drugi skine APK (bez Play Store-a)

Za brzo testiranje (bez Google Play):

```bash
eas build --platform android --profile preview
```

Profil **preview** pravi **APK** (ne AAB). Kada se build završi, EAS ti da **link za preuzimanje**. Taj link možeš poslati drugu osobi – ona otvori link na Androidu (ili na računaru pa prebaci APK), skine fajl i instalira (mora da dozvoli “Instalacija iz nepoznatih izvora” za browser ili fajl menadžer).

---

## 4. Rezime – “Hoću samo da drugarica skine na iPhone”

1. Imaš Apple Developer nalog ($99/god).
2. `eas build --platform ios --profile production`
3. Kad je gotovo: `eas submit --platform ios --profile production`
4. U App Store Connect → TestFlight dodaš njen email kao testera.
5. Ona na iPhone-u instalira **TestFlight** iz App Store-a, otvori mail sa pozivnicom i odatle skida tvoju aplikaciju.

Ako želiš i Android verziju za testiranje bez Play Store-a, koristi **preview** build za Android i pošalji link za preuzimanje APK-a.
