-- ===========================================
-- DAJANA AI - Idempotent Database Schema
-- ===========================================
-- Možeš ga pokretati više puta bez greške (tip/tabela već postoji = preskoči).
-- Supabase SQL Editor: paste ceo fajl i Run.
-- ===========================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================
-- 2. CUSTOM TYPES (preskoči ako već postoje)
-- =========================================

DO $$ BEGIN
  CREATE TYPE body_type AS ENUM ('pear', 'apple', 'hourglass', 'rectangle', 'inverted_triangle');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE season_type AS ENUM (
    'light_spring', 'warm_spring', 'clear_spring', 'light_summer', 'cool_summer', 'soft_summer',
    'soft_autumn', 'warm_autumn', 'deep_autumn', 'deep_winter', 'cool_winter', 'clear_winter'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE credit_type AS ENUM ('image', 'video', 'analysis');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE generation_type AS ENUM ('image', 'video', 'analysis');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE generation_status AS ENUM ('pending', 'processing', 'completed', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE plan_type AS ENUM ('monthly', 'yearly');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE transaction_type AS ENUM ('subscription_payment', 'credit_purchase', 'refund');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE transaction_status AS ENUM ('pending', 'succeeded', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =========================================
-- 3. TABLES (IF NOT EXISTS)
-- =========================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  height_cm INTEGER CHECK (height_cm BETWEEN 100 AND 250),
  weight_kg DECIMAL(5,2),
  bust_cm INTEGER,
  waist_cm INTEGER,
  hips_cm INTEGER,
  body_type body_type,
  has_dajana_analysis BOOLEAN DEFAULT FALSE,
  season season_type,
  language TEXT DEFAULT 'sr',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_credits (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  image_credits_used INTEGER DEFAULT 0,
  image_credits_limit INTEGER DEFAULT 50,
  video_credits_used INTEGER DEFAULT 0,
  video_credits_limit INTEGER DEFAULT 2,
  analysis_credits_used INTEGER DEFAULT 0,
  analysis_credits_limit INTEGER DEFAULT 2,
  bonus_image_credits INTEGER DEFAULT 0,
  bonus_video_credits INTEGER DEFAULT 0,
  bonus_analysis_credits INTEGER DEFAULT 0,
  last_reset_date DATE DEFAULT CURRENT_DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscriptions (
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

CREATE TABLE IF NOT EXISTS outfits (
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

CREATE TABLE IF NOT EXISTS generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type generation_type NOT NULL,
  outfit_id UUID REFERENCES outfits(id),
  input_image_url TEXT,
  output_url TEXT,
  ai_response TEXT,
  prompt TEXT,
  status generation_status DEFAULT 'pending',
  error_message TEXT,
  api_cost_cents INTEGER DEFAULT 0,
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  type transaction_type NOT NULL,
  stripe_payment_intent_id TEXT,
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'eur',
  status transaction_status NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS push_tokens (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'admin',
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS saved_outfits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  outfit_id UUID REFERENCES outfits(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, outfit_id)
);

-- =========================================
-- 4. INDEXES (IF NOT EXISTS)
-- =========================================

CREATE INDEX IF NOT EXISTS idx_outfits_body_types ON outfits USING GIN(body_types);
CREATE INDEX IF NOT EXISTS idx_outfits_seasons ON outfits USING GIN(seasons);
CREATE INDEX IF NOT EXISTS idx_generations_user_type ON generations(user_id, type);
CREATE INDEX IF NOT EXISTS idx_generations_status ON generations(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_outfits_user ON saved_outfits(user_id);

-- =========================================
-- 5. ROW LEVEL SECURITY
-- =========================================

DO $$ BEGIN ALTER TABLE profiles ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

DO $$ BEGIN ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DROP POLICY IF EXISTS "Users can view own credits" ON user_credits;
CREATE POLICY "Users can view own credits" ON user_credits FOR SELECT USING (auth.uid() = user_id);

DO $$ BEGIN ALTER TABLE outfits ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DROP POLICY IF EXISTS "Authenticated users can view active outfits" ON outfits;
CREATE POLICY "Authenticated users can view active outfits" ON outfits FOR SELECT USING (is_active = TRUE AND auth.uid() IS NOT NULL);

DO $$ BEGIN ALTER TABLE generations ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DROP POLICY IF EXISTS "Users can view own generations" ON generations;
CREATE POLICY "Users can view own generations" ON generations FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own generations" ON generations;
CREATE POLICY "Users can insert own generations" ON generations FOR INSERT WITH CHECK (auth.uid() = user_id);

DO $$ BEGIN ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DROP POLICY IF EXISTS "Users can view own subscription" ON subscriptions;
CREATE POLICY "Users can view own subscription" ON subscriptions FOR SELECT USING (auth.uid() = user_id);

DO $$ BEGIN ALTER TABLE transactions ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);

DO $$ BEGIN ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DROP POLICY IF EXISTS "Users can manage own push token" ON push_tokens;
CREATE POLICY "Users can manage own push token" ON push_tokens FOR ALL USING (auth.uid() = user_id);

DO $$ BEGIN ALTER TABLE saved_outfits ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DROP POLICY IF EXISTS "Users can manage own saved outfits" ON saved_outfits;
CREATE POLICY "Users can manage own saved outfits" ON saved_outfits FOR ALL USING (auth.uid() = user_id);

-- =========================================
-- 6. FUNCTIONS (CREATE OR REPLACE = idempotent)
-- =========================================

CREATE OR REPLACE FUNCTION check_and_use_credit(p_user_id UUID, p_credit_type credit_type)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_credits user_credits%ROWTYPE;
  v_used INT; v_limit INT; v_bonus INT; v_use_bonus BOOLEAN := FALSE;
  v_sub_active BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM subscriptions WHERE user_id = p_user_id AND status = 'active') INTO v_sub_active;
  IF NOT v_sub_active THEN
    RETURN jsonb_build_object('success', false, 'error', 'no_subscription', 'message', 'Nemate aktivnu pretplatu');
  END IF;
  SELECT * INTO v_credits FROM user_credits WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'no_credits_record', 'message', 'Krediti nisu pronađeni');
  END IF;
  IF p_credit_type = 'image' THEN v_used := v_credits.image_credits_used; v_limit := v_credits.image_credits_limit; v_bonus := v_credits.bonus_image_credits;
  ELSIF p_credit_type = 'video' THEN v_used := v_credits.video_credits_used; v_limit := v_credits.video_credits_limit; v_bonus := v_credits.bonus_video_credits;
  ELSE v_used := v_credits.analysis_credits_used; v_limit := v_credits.analysis_credits_limit; v_bonus := v_credits.bonus_analysis_credits;
  END IF;
  IF v_used < v_limit THEN v_use_bonus := FALSE;
  ELSIF v_bonus > 0 THEN v_use_bonus := TRUE;
  ELSE RETURN jsonb_build_object('success', false, 'error', 'no_credits', 'message', 'Nemate dovoljno kredita');
  END IF;
  IF p_credit_type = 'image' THEN
    IF v_use_bonus THEN UPDATE user_credits SET bonus_image_credits = bonus_image_credits - 1, updated_at = NOW() WHERE user_id = p_user_id;
    ELSE UPDATE user_credits SET image_credits_used = image_credits_used + 1, updated_at = NOW() WHERE user_id = p_user_id; END IF;
  ELSIF p_credit_type = 'video' THEN
    IF v_use_bonus THEN UPDATE user_credits SET bonus_video_credits = bonus_video_credits - 1, updated_at = NOW() WHERE user_id = p_user_id;
    ELSE UPDATE user_credits SET video_credits_used = video_credits_used + 1, updated_at = NOW() WHERE user_id = p_user_id; END IF;
  ELSE
    IF v_use_bonus THEN UPDATE user_credits SET bonus_analysis_credits = bonus_analysis_credits - 1, updated_at = NOW() WHERE user_id = p_user_id;
    ELSE UPDATE user_credits SET analysis_credits_used = analysis_credits_used + 1, updated_at = NOW() WHERE user_id = p_user_id; END IF;
  END IF;
  RETURN jsonb_build_object('success', true, 'used_bonus', v_use_bonus, 'credit_type', p_credit_type);
END; $$;

CREATE OR REPLACE FUNCTION rollback_credit(p_user_id UUID, p_credit_type credit_type, p_used_bonus BOOLEAN)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_credit_type = 'image' THEN
    IF p_used_bonus THEN UPDATE user_credits SET bonus_image_credits = bonus_image_credits + 1, updated_at = NOW() WHERE user_id = p_user_id;
    ELSE UPDATE user_credits SET image_credits_used = GREATEST(0, image_credits_used - 1), updated_at = NOW() WHERE user_id = p_user_id; END IF;
  ELSIF p_credit_type = 'video' THEN
    IF p_used_bonus THEN UPDATE user_credits SET bonus_video_credits = bonus_video_credits + 1, updated_at = NOW() WHERE user_id = p_user_id;
    ELSE UPDATE user_credits SET video_credits_used = GREATEST(0, video_credits_used - 1), updated_at = NOW() WHERE user_id = p_user_id; END IF;
  ELSE
    IF p_used_bonus THEN UPDATE user_credits SET bonus_analysis_credits = bonus_analysis_credits + 1, updated_at = NOW() WHERE user_id = p_user_id;
    ELSE UPDATE user_credits SET analysis_credits_used = GREATEST(0, analysis_credits_used - 1), updated_at = NOW() WHERE user_id = p_user_id; END IF;
  END IF;
END; $$;

CREATE OR REPLACE FUNCTION add_bonus_credits(p_user_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE user_credits SET bonus_image_credits = bonus_image_credits + 10, bonus_video_credits = bonus_video_credits + 1, bonus_analysis_credits = bonus_analysis_credits + 2, updated_at = NOW() WHERE user_id = p_user_id;
END; $$;

-- =========================================
-- 7. TRIGGERS
-- =========================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name) VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  INSERT INTO user_credits (user_id) VALUES (NEW.id);
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
