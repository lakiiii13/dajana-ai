-- ===========================================
-- DAJANA AI - Complete Database Schema
-- ===========================================
-- Run this in Supabase SQL Editor (in order)
-- ===========================================

-- =========================================
-- 1. EXTENSIONS
-- =========================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================
-- 2. CUSTOM TYPES (ENUMS)
-- =========================================

-- Body Types
CREATE TYPE body_type AS ENUM (
  'pear',
  'apple', 
  'hourglass',
  'rectangle',
  'inverted_triangle'
);

-- 12 Seasons
CREATE TYPE season_type AS ENUM (
  'light_spring',
  'warm_spring',
  'clear_spring',
  'light_summer',
  'cool_summer',
  'soft_summer',
  'soft_autumn',
  'warm_autumn',
  'deep_autumn',
  'deep_winter',
  'cool_winter',
  'clear_winter'
);

-- Credit Types
CREATE TYPE credit_type AS ENUM ('image', 'video', 'analysis');

-- Generation Types
CREATE TYPE generation_type AS ENUM ('image', 'video', 'analysis');

-- Generation Status
CREATE TYPE generation_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- Subscription Status
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'expired');

-- Plan Types
CREATE TYPE plan_type AS ENUM ('monthly', 'yearly');

-- Transaction Types
CREATE TYPE transaction_type AS ENUM ('subscription_payment', 'credit_purchase', 'refund');

-- Transaction Status
CREATE TYPE transaction_status AS ENUM ('pending', 'succeeded', 'failed');

-- =========================================
-- 3. TABLES
-- =========================================

-- PROFILES
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  -- Mere
  height_cm INTEGER CHECK (height_cm BETWEEN 100 AND 250),
  weight_kg DECIMAL(5,2),
  bust_cm INTEGER,
  waist_cm INTEGER,
  hips_cm INTEGER,
  -- Izračunato
  body_type body_type,
  -- Dajana analiza
  has_dajana_analysis BOOLEAN DEFAULT FALSE,
  season season_type,
  language TEXT DEFAULT 'sr',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- USER_CREDITS
CREATE TABLE user_credits (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  -- Mesečni (resetuju se 1. u mesecu)
  image_credits_used INTEGER DEFAULT 0,
  image_credits_limit INTEGER DEFAULT 50,
  video_credits_used INTEGER DEFAULT 0,
  video_credits_limit INTEGER DEFAULT 2,
  analysis_credits_used INTEGER DEFAULT 0,
  analysis_credits_limit INTEGER DEFAULT 2,
  -- Bonus (kupljeni, ne resetuju se)
  bonus_image_credits INTEGER DEFAULT 0,
  bonus_video_credits INTEGER DEFAULT 0,
  bonus_analysis_credits INTEGER DEFAULT 0,
  last_reset_date DATE DEFAULT CURRENT_DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SUBSCRIPTIONS
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  status subscription_status NOT NULL,
  plan_type plan_type NOT NULL,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- OUTFITS (Admin unosi)
CREATE TABLE outfits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  body_types body_type[] NOT NULL,
  seasons season_type[] NOT NULL,
  tags TEXT[],
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- GENERATIONS
CREATE TABLE generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type generation_type NOT NULL,
  outfit_id UUID REFERENCES outfits(id),
  input_image_url TEXT,
  output_url TEXT,
  ai_response TEXT,
  prompt TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  status generation_status DEFAULT 'pending',
  error_message TEXT,
  api_cost_cents INTEGER DEFAULT 0,
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- TRANSACTIONS
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  type transaction_type NOT NULL,
  stripe_payment_intent_id TEXT,
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'eur',
  status transaction_status NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PUSH_TOKENS
CREATE TABLE push_tokens (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ADMIN_USERS
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'admin',
  is_active BOOLEAN DEFAULT TRUE
);

-- OUTFIT_COMPOSITIONS (Kapsula outfit compositions created by users)
CREATE TABLE outfit_compositions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  try_on_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SAVED_OUTFITS (Favorites)
CREATE TABLE saved_outfits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  outfit_id UUID REFERENCES outfits(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, outfit_id)
);

-- ADVICE_CHATS (AI Savetnik razgovori, vezani za korisnika)
CREATE TABLE advice_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Novi razgovor',
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  conversation_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- USER_NOTIFICATIONS (Inbox za sekciju Notifikacije: video spreman, Dajana iz admina)
CREATE TABLE user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('video', 'advice', 'system', 'outfit')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- 4. INDEXES
-- =========================================

CREATE INDEX idx_outfits_body_types ON outfits USING GIN(body_types);
CREATE INDEX idx_outfits_seasons ON outfits USING GIN(seasons);
CREATE INDEX idx_generations_user_type ON generations(user_id, type);
CREATE INDEX idx_generations_status ON generations(status);
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_saved_outfits_user ON saved_outfits(user_id);
CREATE INDEX idx_outfit_compositions_user ON outfit_compositions(user_id, created_at DESC);
CREATE INDEX idx_advice_chats_user ON advice_chats(user_id, updated_at DESC);
CREATE INDEX idx_user_notifications_user_created ON user_notifications(user_id, created_at DESC);

-- =========================================
-- 5. ROW LEVEL SECURITY (RLS)
-- =========================================

-- PROFILES: Korisnik vidi/menja samo svoj
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- USER_CREDITS: Korisnik čita i menja samo svoje
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credits"
  ON user_credits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own credits"
  ON user_credits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own credits"
  ON user_credits FOR UPDATE
  USING (auth.uid() = user_id);

-- OUTFITS: Svi ulogovani vide aktivne
ALTER TABLE outfits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view active outfits"
  ON outfits FOR SELECT
  USING (is_active = TRUE AND auth.uid() IS NOT NULL);

-- GENERATIONS: Korisnik vidi svoje
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own generations"
  ON generations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own generations"
  ON generations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- SUBSCRIPTIONS: Korisnik čita, kreira i menja svoju pretplatu
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription"
  ON subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
  ON subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- TRANSACTIONS: Samo čitanje svog
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

-- PUSH_TOKENS: Korisnik upravlja svojim
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own push token"
  ON push_tokens FOR ALL
  USING (auth.uid() = user_id);

-- SAVED_OUTFITS: Korisnik upravlja svojim
ALTER TABLE saved_outfits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own saved outfits"
  ON saved_outfits FOR ALL
  USING (auth.uid() = user_id);

-- OUTFIT_COMPOSITIONS: Korisnik upravlja samo svojim kompozicijama
ALTER TABLE outfit_compositions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own outfit compositions"
  ON outfit_compositions FOR ALL
  USING (auth.uid() = user_id);

-- ADVICE_CHATS: Korisnik upravlja samo svojim razgovorima
ALTER TABLE advice_chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own advice chats"
  ON advice_chats FOR ALL
  USING (auth.uid() = user_id);

-- ADMIN_USERS: RLS uključen, ali bez policy-ja = potpuno blokirano za anon/authenticated klijente.
-- Admin panel koristi service_role ključ koji zaobilazi RLS.
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- USER_NOTIFICATIONS: Korisnik vidi i označava svoje; insert (app ili admin)
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON user_notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON user_notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications"
  ON user_notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =========================================
-- 6. FUNCTIONS - Credit System with Rollback
-- =========================================

-- Check and Use Credit (sa rezervacijom)
CREATE OR REPLACE FUNCTION check_and_use_credit(
  p_user_id UUID,
  p_credit_type credit_type
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_credits user_credits%ROWTYPE;
  v_used INT;
  v_limit INT;
  v_bonus INT;
  v_use_bonus BOOLEAN := FALSE;
  v_sub_active BOOLEAN;
BEGIN
  -- 1. Proveri aktivnu pretplatu
  SELECT EXISTS(
    SELECT 1 FROM subscriptions
    WHERE user_id = p_user_id AND status = 'active'
  ) INTO v_sub_active;

  IF NOT v_sub_active THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'no_subscription',
      'message', 'Nemate aktivnu pretplatu'
    );
  END IF;

  -- 2. Zaključaj row (FOR UPDATE sprečava race condition)
  SELECT * INTO v_credits
  FROM user_credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'no_credits_record',
      'message', 'Krediti nisu pronađeni'
    );
  END IF;

  -- 3. Odredi vrednosti prema tipu
  IF p_credit_type = 'image' THEN
    v_used := v_credits.image_credits_used;
    v_limit := v_credits.image_credits_limit;
    v_bonus := v_credits.bonus_image_credits;
  ELSIF p_credit_type = 'video' THEN
    v_used := v_credits.video_credits_used;
    v_limit := v_credits.video_credits_limit;
    v_bonus := v_credits.bonus_video_credits;
  ELSE -- analysis
    v_used := v_credits.analysis_credits_used;
    v_limit := v_credits.analysis_credits_limit;
    v_bonus := v_credits.bonus_analysis_credits;
  END IF;

  -- 4. Proveri dostupnost i odredi izvor
  IF v_used < v_limit THEN
    -- Koristi mesečni kredit
    v_use_bonus := FALSE;
  ELSIF v_bonus > 0 THEN
    -- Koristi bonus kredit
    v_use_bonus := TRUE;
  ELSE
    -- Nema kredita
    RETURN jsonb_build_object(
      'success', false,
      'error', 'no_credits',
      'message', 'Nemate dovoljno kredita'
    );
  END IF;

  -- 5. Oduzmi kredit
  IF p_credit_type = 'image' THEN
    IF v_use_bonus THEN
      UPDATE user_credits SET
        bonus_image_credits = bonus_image_credits - 1,
        updated_at = NOW()
      WHERE user_id = p_user_id;
    ELSE
      UPDATE user_credits SET
        image_credits_used = image_credits_used + 1,
        updated_at = NOW()
      WHERE user_id = p_user_id;
    END IF;
  ELSIF p_credit_type = 'video' THEN
    IF v_use_bonus THEN
      UPDATE user_credits SET
        bonus_video_credits = bonus_video_credits - 1,
        updated_at = NOW()
      WHERE user_id = p_user_id;
    ELSE
      UPDATE user_credits SET
        video_credits_used = video_credits_used + 1,
        updated_at = NOW()
      WHERE user_id = p_user_id;
    END IF;
  ELSE -- analysis
    IF v_use_bonus THEN
      UPDATE user_credits SET
        bonus_analysis_credits = bonus_analysis_credits - 1,
        updated_at = NOW()
      WHERE user_id = p_user_id;
    ELSE
      UPDATE user_credits SET
        analysis_credits_used = analysis_credits_used + 1,
        updated_at = NOW()
      WHERE user_id = p_user_id;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'used_bonus', v_use_bonus,
    'credit_type', p_credit_type
  );
END;
$$;

-- Rollback Credit (vraća kredit ako API fail)
CREATE OR REPLACE FUNCTION rollback_credit(
  p_user_id UUID,
  p_credit_type credit_type,
  p_used_bonus BOOLEAN
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_credit_type = 'image' THEN
    IF p_used_bonus THEN
      UPDATE user_credits SET
        bonus_image_credits = bonus_image_credits + 1,
        updated_at = NOW()
      WHERE user_id = p_user_id;
    ELSE
      UPDATE user_credits SET
        image_credits_used = GREATEST(0, image_credits_used - 1),
        updated_at = NOW()
      WHERE user_id = p_user_id;
    END IF;
  ELSIF p_credit_type = 'video' THEN
    IF p_used_bonus THEN
      UPDATE user_credits SET
        bonus_video_credits = bonus_video_credits + 1,
        updated_at = NOW()
      WHERE user_id = p_user_id;
    ELSE
      UPDATE user_credits SET
        video_credits_used = GREATEST(0, video_credits_used - 1),
        updated_at = NOW()
      WHERE user_id = p_user_id;
    END IF;
  ELSE -- analysis
    IF p_used_bonus THEN
      UPDATE user_credits SET
        bonus_analysis_credits = bonus_analysis_credits + 1,
        updated_at = NOW()
      WHERE user_id = p_user_id;
    ELSE
      UPDATE user_credits SET
        analysis_credits_used = GREATEST(0, analysis_credits_used - 1),
        updated_at = NOW()
      WHERE user_id = p_user_id;
    END IF;
  END IF;
END;
$$;

-- Add Bonus Credits (nakon kupovine paketa)
CREATE OR REPLACE FUNCTION add_bonus_credits(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE user_credits SET
    bonus_image_credits = bonus_image_credits + 10,
    bonus_video_credits = bonus_video_credits + 1,
    bonus_analysis_credits = bonus_analysis_credits + 2,
    updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$;

-- =========================================
-- 7. TRIGGERS
-- =========================================

-- Auto-create profile and credits after user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );

  -- Create credits record
  INSERT INTO user_credits (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =========================================
-- 8. MONTHLY CREDIT RESET (pg_cron)
-- =========================================
-- NOTE: Enable pg_cron extension in Supabase Dashboard first
-- Dashboard -> Database -> Extensions -> pg_cron

-- Uncomment after enabling pg_cron:
/*
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'reset-monthly-credits',
  '1 0 1 * *', -- Svakog 1. u mesecu u 00:01
  $$
  UPDATE user_credits SET
    image_credits_used = 0,
    video_credits_used = 0,
    analysis_credits_used = 0,
    last_reset_date = CURRENT_DATE,
    updated_at = NOW()
  WHERE last_reset_date < DATE_TRUNC('month', CURRENT_DATE);
  $$
);
*/

-- =========================================
-- 9. INITIAL ADMIN USER (OPTIONAL)
-- =========================================
-- Change email and password hash before running!
-- Password hash should be bcrypt hash of actual password

/*
INSERT INTO admin_users (email, password_hash, name, role)
VALUES (
  'admin@dajanaai.com',
  '$2a$10$...', -- bcrypt hash
  'Admin',
  'superadmin'
);
*/
