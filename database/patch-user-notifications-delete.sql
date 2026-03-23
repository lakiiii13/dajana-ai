-- ===========================================
-- PATCH: DELETE policy za user_notifications
-- ===========================================
-- Pokreni u Supabase SQL Editor ako već imaš bazu iz stare verzije schema.sql
-- (bez DELETE policy). Jednokratno.

CREATE POLICY "Users can delete own notifications"
  ON user_notifications FOR DELETE
  USING (auth.uid() = user_id);
