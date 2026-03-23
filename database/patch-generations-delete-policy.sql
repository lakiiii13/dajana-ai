-- ============================================
-- Dodaj RLS DELETE policy za generations
-- Bez ove politike, deleteTryOnImage i deleteSavedVideo ne mogu da obrišu redove.
-- Pokreni u Supabase SQL Editoru.
-- ============================================

CREATE POLICY "Users can delete own generations"
  ON generations FOR DELETE
  USING (auth.uid() = user_id);
