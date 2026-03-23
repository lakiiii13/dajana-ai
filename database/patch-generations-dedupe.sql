-- ============================================
-- Jednokratno brisanje duplikata u generations (type = 'image')
-- Za svakog user_id ostavlja po jedan red po normalizovanom output_url (bez ?...).
-- Ostaje noviji red (po completed_at, pa id).
-- Pokreni jednom u Supabase SQL Editoru.
-- ============================================

DELETE FROM generations
WHERE id IN (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY user_id, LOWER(TRIM(SPLIT_PART(output_url, '?', 1)))
             ORDER BY completed_at DESC NULLS LAST, id DESC
           ) AS rn
    FROM generations
    WHERE type = 'image'
      AND status = 'completed'
      AND output_url IS NOT NULL
  ) sub
  WHERE sub.rn > 1
);
