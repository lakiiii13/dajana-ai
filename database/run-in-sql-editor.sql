-- ===========================================
-- Pokreni u Supabase SQL Editor (baza već postoji)
-- Jedan fajl – sve potrebne izmene za sigurnost.
-- ===========================================

-- 1) DELETE policy za user_notifications (ako već postoji, preskočiće se)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_notifications' AND policyname = 'Users can delete own notifications'
  ) THEN
    CREATE POLICY "Users can delete own notifications"
      ON user_notifications FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- 2) Storage RLS – video-sources
DROP POLICY IF EXISTS "video_sources_authenticated_insert" ON storage.objects;
CREATE POLICY "video_sources_authenticated_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'video-sources');

DROP POLICY IF EXISTS "video_sources_authenticated_select" ON storage.objects;
CREATE POLICY "video_sources_authenticated_select"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'video-sources');

-- 3) Storage RLS – user-videos
DROP POLICY IF EXISTS "user_videos_authenticated_insert" ON storage.objects;
CREATE POLICY "user_videos_authenticated_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'user-videos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "user_videos_authenticated_select" ON storage.objects;
CREATE POLICY "user_videos_authenticated_select"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'user-videos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "user_videos_authenticated_delete" ON storage.objects;
CREATE POLICY "user_videos_authenticated_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'user-videos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 4) Storage RLS – try-on-results
DROP POLICY IF EXISTS "tryon_authenticated_insert" ON storage.objects;
CREATE POLICY "tryon_authenticated_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'try-on-results'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "tryon_authenticated_select" ON storage.objects;
CREATE POLICY "tryon_authenticated_select"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'try-on-results'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "tryon_authenticated_delete" ON storage.objects;
CREATE POLICY "tryon_authenticated_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'try-on-results'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
