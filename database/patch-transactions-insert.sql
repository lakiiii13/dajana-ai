-- Dozvoli korisnicima da upisuju svoje tranzakcije (simulacija plaćanja / Stripe).
-- Pokreni u Supabase: SQL Editor → New query → paste → Run.

DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;
CREATE POLICY "Users can insert own transactions"
  ON public.transactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
