# Sigurnost: RLS za bazu + Storage (checklist)

Cilj: maksimalna sigurnost – RLS na tabelama i na Storage bucketima.

---

## 1. Baza – user_notifications DELETE

Ako si već ranije pokrenuo `database/schema.sql` **bez** DELETE policy za notifikacije, dodaj je jednom:

**Fajl:** `database/patch-user-notifications-delete.sql`

U **Supabase Dashboard** → **SQL Editor** → New query → nalepi sadržaj tog fajla → Run.

(U novim instalacijama `schema.sql` već sadrži ovu policy, patch ti treba samo za stare baze.)

---

## 2. Storage – koji bucketi postoje

| Bucket           | Ko koristi        | Putanja / namena |
|------------------|-------------------|-------------------|
| **video-sources** | Mobilna app       | `src_<timestamp>.jpg` – slika za video API |
| **user-videos**   | Mobilna app       | `<user_id>/vid_<timestamp>.mp4` – sačuvani videi |
| **try-on-results**| Mobilna app       | `<user_id>/tryon_<outfitId>_<timestamp>.png` – try-on slike |
| **outfit-images** | Admin (Next.js)   | `outfit_<timestamp>.<ext>` – slike outfit-a (admin upload) |
| **outfits**       | Seed / admin      | Javni katalog outfit slika (public read) |

---

## 3. Storage RLS – uključivanje i politike

Po defaultu, bez politika, Storage može prijavljivati: *"new row violates row-level security policy"*.

### 3.1 Gde se podešava

- **Supabase Dashboard** → **Storage** → izaberi bucket → **Policies** (RLS za `storage.objects`).

Ili sve u jednom u **SQL Editor** (politike su na shemi `storage`, tabela `objects`).

### 3.2 Politike po bucketu (SQL)

Pokreni u **SQL Editor** (prilagodi nazive bucketa ako si ih menjao).

```sql
-- =========================================
-- STORAGE RLS – DAJANA AI
-- Pokreni jednom u Supabase SQL Editor.
-- =========================================

-- 1) video-sources: ulogovani korisnici mogu da uploaduju i čitaju (flat fajlovi, nema user foldera)
CREATE POLICY "video_sources_authenticated_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'video-sources');

CREATE POLICY "video_sources_authenticated_select"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'video-sources');

-- 2) user-videos: korisnik samo svoj folder (prvi segment putanje = user_id)
CREATE POLICY "user_videos_authenticated_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'user-videos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "user_videos_authenticated_select"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'user-videos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "user_videos_authenticated_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'user-videos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 3) try-on-results: korisnik samo svoj folder
CREATE POLICY "tryon_authenticated_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'try-on-results'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "tryon_authenticated_select"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'try-on-results'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "tryon_authenticated_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'try-on-results'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
```

**Napomena:**  
- **outfit-images** i **outfits** koristi admin (service_role) ili seed skripte sa service_role; service_role zaobilazi RLS. Ako anon/authenticated ne uploaduju u te buckete, ne moraš im dodavati INSERT/UPDATE/DELETE – dovoljno je da bucket bude public za čitanje ako treba, ili bez dodatnih politika ako pristup ide samo preko backend-a.

---

## 4. Checklist (brza provera)

- [ ] **Baza:** Na tabeli `user_notifications` postoji policy za **DELETE** (`auth.uid() = user_id`). Ako nema, pokreni `database/patch-user-notifications-delete.sql`.
- [ ] **Storage:** U Dashboardu → Storage za svaki od `video-sources`, `user-videos`, `try-on-results` imaš RLS politike (ili si pokrenuo gornji SQL).
- [ ] **video-sources:** Samo ulogovani (authenticated) mogu INSERT i SELECT.
- [ ] **user-videos:** Korisnik vidi/briše samo fajlove ispod svog `user_id` foldera.
- [ ] **try-on-results:** Isto – prvi segment putanje = `user_id`, samo taj korisnik.
- [ ] **Admin:** Koristi samo **service_role** na serveru (Next.js admin); anon key u mobilnoj app nikad ne koristi service_role.

Ako sve tačke prolaze, nivo sigurnosti za bazu i Storage je na visokom nivou.
