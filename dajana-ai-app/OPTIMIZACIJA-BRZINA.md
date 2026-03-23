# Optimizacija i brzina (Supabase, lazy loading)

Od prelaska na Supabase (ništa više iz lokala), sve se vuče sa mreže. Evo šta je urađeno da ekran brže reaguje i da se manje čeka.

---

## Šta je promenjeno

### 1. **Videos tab (Novi video sekcija)**
- **Prvo se učitavaju videi** – lista videa iz Supabase-a stiže prva, ekran prestaje da prikazuje loading.
- **Slike u box-u („generisane slike”)** učitavaju se **400 ms kasnije** u pozadini, tako da glavni sadržaj (dugme Kreiraj video + lista videa) bude vidljiv odmah.
- **Horizontalna traka slika** je zamenjena sa **FlatList** umesto ScrollView + map: učitava se prvo **3 slike** (`initialNumToRender={3}`), ostale dok korisnik skroluje.
- **Lista videa** koristi `initialNumToRender={6}`, `maxToRenderPerBatch={4}`, `removeClippedSubviews={true}` da se manje renderuje odjednom.

### 2. **Home**
- Pri ulasku na Home **odmah** se učitavaju samo **outfiti + krediti** (brz prvi prikaz).
- **Video i slike** (brojevi u segmentima i sadržaj) učitavaju se **350 ms kasnije** u pozadini, da ne blokiraju prvi prikaz.

---

## Kako da proveriš brzinu

1. **Videos tab**
   - Otvori **Video** tab (Novi video).
   - Očekivano: loading nestane relativno brzo (lista videa), box sa slikama može da se popuni malo kasnije.
   - Povuci nadole za refresh – i videi i slike se ponovo učitavaju.

2. **Home**
   - Otvori **Home**.
   - Očekivano: odmah se vidi segment Outfit i brojevi (ili 0); nakon kratkog trenutka ažuriraju se brojevi za Video i Slika ako ima podataka.

3. **Spora mreža**
   - U developer opcijama (ako koristiš) uključi **Network throttling** (npr. Slow 3G) i ponovi korake 1 i 2 – prvi prikaz bi i dalje trebalo da bude brži od prethodnog ponašanja.

---

## Ako je i dalje sporo

- **Supabase regija** – projekat u istoj regiji kao korisnici smanjuje latenciju.
- **Slike** – URL-ovi iz Storage-a su puna rezolucija; u budućnosti može da se doda Supabase **Image Transformation** (npr. `?width=300`) za thumbnails u listama.
- **Krediti / auth** – `fetchCredits()` i session provera idu preko mreže; već se ne čeka njihov kraj da bi se prikazao Videos tab (lazy za video/slike na Home-u).
