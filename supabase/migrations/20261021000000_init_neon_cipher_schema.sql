-- Migration: 20261021000000_init_neon_cipher_schema.sql
-- Description: Complete Neon Cipher Postgres database schema with RLS, FK indexes, and user setup triggers.

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Helper function for updated_at timestamps
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  handle TEXT NOT NULL UNIQUE,
  avatar_url TEXT DEFAULT '/Character portraits/Player avatars.png',
  title TEXT DEFAULT 'Street Rat',
  rank INT DEFAULT 1,
  level INT DEFAULT 1,
  xp INT DEFAULT 0,
  xp_to_next_level INT DEFAULT 1000,
  credits INT DEFAULT 100,
  coins INT DEFAULT 0,
  career_earnings INT DEFAULT 0,
  win_rate NUMERIC(5,2) DEFAULT 0,
  breaches_attempted INT DEFAULT 0,
  breaches_succeeded INT DEFAULT 0,
  current_streak INT DEFAULT 0,
  highest_streak INT DEFAULT 0,
  skills JSONB DEFAULT '{}'::jsonb,
  skill_points INT DEFAULT 0,
  reputation INT DEFAULT 0,
  factions JSONB DEFAULT '{"syndicate": 0, "corpo": 0, "anarchist": 0}'::jsonb,
  active_faction TEXT DEFAULT 'unaffiliated',
  equipped_cosmetics JSONB DEFAULT '{"badge": null, "theme": "default", "title": "Street Rat"}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. User Settings Table
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  assist_mode TEXT DEFAULT 'rookie' CHECK (assist_mode IN ('rookie', 'pro')),
  sound_volume INT DEFAULT 80,
  music_volume INT DEFAULT 60,
  sfx_volume INT DEFAULT 80,
  master_mute BOOLEAN DEFAULT false,
  reduced_motion BOOLEAN DEFAULT false,
  colorblind_mode BOOLEAN DEFAULT false,
  daily_spend_limit INT DEFAULT 500,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Campaign Progress Table
CREATE TABLE IF NOT EXISTS public.campaign_progress (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  initial_debt INT DEFAULT 10000,
  current_debt INT DEFAULT 10000,
  paid_debt INT DEFAULT 0,
  active_chapter_id TEXT DEFAULT 'chapter-1',
  chapters JSONB DEFAULT '{"chapter-1": {"id": "chapter-1", "status": "available"}}'::jsonb,
  unlocks JSONB DEFAULT '{"blackMarket": false, "onlinePlay": false, "bridge": false}'::jsonb,
  tutorials JSONB DEFAULT '{"chapter-1": {"completed": false, "skipped": false}}'::jsonb,
  cracked_nodes JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Wallets Table
CREATE TABLE IF NOT EXISTS public.wallets (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  credits INT DEFAULT 100,
  coins INT DEFAULT 0,
  inventory JSONB DEFAULT '{"cryo_spike": 1, "static_injector": 1}'::jsonb,
  equipped_tools TEXT[] DEFAULT ARRAY['cryo_spike', 'static_injector'],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Transactions Ledger Table
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('breach_bounty', 'tool_purchase', 'debt_payment', 'trace_fine', 'duel_wager', 'duel_payout', 'daily_reward', 'system_adjustment')),
  amount INT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'credits' CHECK (currency IN ('credits', 'coins')),
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Rig Configurations Table
CREATE TABLE IF NOT EXISTS public.rig_configs (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  active_preset TEXT DEFAULT 'balanced',
  rail_slots JSONB DEFAULT '{"rail1": null, "rail2": null, "rail3": null}'::jsonb,
  installed_modules JSONB DEFAULT '[]'::jsonb,
  durability JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Safehouses Table
CREATE TABLE IF NOT EXISTS public.safehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  district TEXT NOT NULL DEFAULT 'slums',
  level INT NOT NULL DEFAULT 1,
  storage_capacity INT NOT NULL DEFAULT 10,
  defense_rating INT NOT NULL DEFAULT 100,
  passive_income_rate INT NOT NULL DEFAULT 5,
  last_income_collected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Node Defenses Table
CREATE TABLE IF NOT EXISTS public.node_defenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL,
  ice_type TEXT NOT NULL DEFAULT 'standard',
  traps JSONB DEFAULT '[]'::jsonb,
  bounty_stake INT NOT NULL DEFAULT 50,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'breached', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Game Sessions Table (solo cracking sessions)
CREATE TABLE IF NOT EXISTS public.game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'playing' CHECK (status IN ('playing', 'won', 'lost', 'abandoned')),
  tier INT NOT NULL DEFAULT 1,
  digits INT NOT NULL DEFAULT 3,
  allow_duplicates BOOLEAN NOT NULL DEFAULT false,
  max_attempts INT NOT NULL DEFAULT 6,
  attempts_left INT NOT NULL DEFAULT 6,
  timer_seconds INT NOT NULL DEFAULT 60,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  payout INT DEFAULT 0,
  fine INT DEFAULT 0,
  failure_reason TEXT,
  revealed_secret TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Game Secrets Table (SERVER-ONLY: secret codes are NEVER sent to the client while playing)
CREATE TABLE IF NOT EXISTS public.game_secrets (
  session_id UUID PRIMARY KEY REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  secret TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. Game Guesses Table
CREATE TABLE IF NOT EXISTS public.game_guesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  guess TEXT NOT NULL,
  pans INT NOT NULL DEFAULT 0,
  pots INT NOT NULL DEFAULT 0,
  turn_number INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. Duel Rooms Table
CREATE TABLE IF NOT EXISTS public.duel_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opponent_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  match_type TEXT NOT NULL DEFAULT 'standard' CHECK (match_type IN ('standard', 'ranked', 'high_roller')),
  wager INT NOT NULL DEFAULT 50,
  pot INT NOT NULL DEFAULT 100,
  rake INT NOT NULL DEFAULT 5,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'finished', 'cancelled')),
  winner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ
);

-- 13. Duel Secrets Table (SERVER-ONLY secrets for duels)
CREATE TABLE IF NOT EXISTS public.duel_secrets (
  room_id UUID PRIMARY KEY REFERENCES public.duel_rooms(id) ON DELETE CASCADE,
  secret_host TEXT NOT NULL,
  secret_opponent TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 14. Coop Sessions Table
CREATE TABLE IF NOT EXISTS public.coop_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_alpha_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  player_bravo_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  stage INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'failed')),
  score INT DEFAULT 0,
  telemetry JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ
);

-- 15. Replays Table
CREATE TABLE IF NOT EXISTS public.replays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL,
  outcome TEXT NOT NULL CHECK (outcome IN ('won', 'lost')),
  guesses JSONB NOT NULL DEFAULT '[]'::jsonb,
  secret TEXT NOT NULL,
  duration_seconds INT NOT NULL DEFAULT 0,
  analysis JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Triggers for updated_at
CREATE OR REPLACE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER set_user_settings_updated_at
BEFORE UPDATE ON public.user_settings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER set_campaign_progress_updated_at
BEFORE UPDATE ON public.campaign_progress
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER set_wallets_updated_at
BEFORE UPDATE ON public.wallets
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER set_rig_configs_updated_at
BEFORE UPDATE ON public.rig_configs
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER set_safehouses_updated_at
BEFORE UPDATE ON public.safehouses
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER set_node_defenses_updated_at
BEFORE UPDATE ON public.node_defenses
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Foreign Key Indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_safehouses_user_id ON public.safehouses(user_id);
CREATE INDEX IF NOT EXISTS idx_node_defenses_user_id ON public.node_defenses(user_id);
CREATE INDEX IF NOT EXISTS idx_node_defenses_node_id ON public.node_defenses(node_id);
CREATE INDEX IF NOT EXISTS idx_node_defenses_status ON public.node_defenses(status);
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id ON public.game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_node_id ON public.game_sessions(node_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_status ON public.game_sessions(status);
CREATE INDEX IF NOT EXISTS idx_game_guesses_session_id ON public.game_guesses(session_id);
CREATE INDEX IF NOT EXISTS idx_game_guesses_user_id ON public.game_guesses(user_id);
CREATE INDEX IF NOT EXISTS idx_duel_rooms_host_id ON public.duel_rooms(host_id);
CREATE INDEX IF NOT EXISTS idx_duel_rooms_opponent_id ON public.duel_rooms(opponent_id);
CREATE INDEX IF NOT EXISTS idx_duel_rooms_status ON public.duel_rooms(status);
CREATE INDEX IF NOT EXISTS idx_duel_rooms_winner_id ON public.duel_rooms(winner_id);
CREATE INDEX IF NOT EXISTS idx_coop_sessions_player_alpha ON public.coop_sessions(player_alpha_id);
CREATE INDEX IF NOT EXISTS idx_coop_sessions_player_bravo ON public.coop_sessions(player_bravo_id);
CREATE INDEX IF NOT EXISTS idx_coop_sessions_status ON public.coop_sessions(status);
CREATE INDEX IF NOT EXISTS idx_replays_user_id ON public.replays(user_id);
CREATE INDEX IF NOT EXISTS idx_replays_node_id ON public.replays(node_id);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rig_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.node_defenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_guesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duel_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duel_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coop_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.replays ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON public.profiles, public.duel_rooms, public.replays TO anon;

-- Strictly revoke access to secrets from client roles (server/service_role only)
REVOKE ALL ON public.game_secrets FROM anon, authenticated;
REVOKE ALL ON public.duel_secrets FROM anon, authenticated;

-- Policies: profiles
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "Users can insert own profile" ON public.profiles
FOR INSERT TO authenticated
WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE TO authenticated
USING ((select auth.uid()) = id)
WITH CHECK ((select auth.uid()) = id);

-- Policies: user_settings
CREATE POLICY "Users can view own settings" ON public.user_settings
FOR SELECT TO authenticated
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own settings" ON public.user_settings
FOR INSERT TO authenticated
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own settings" ON public.user_settings
FOR UPDATE TO authenticated
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

-- Policies: campaign_progress
CREATE POLICY "Users can view own campaign progress" ON public.campaign_progress
FOR SELECT TO authenticated
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own campaign progress" ON public.campaign_progress
FOR INSERT TO authenticated
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own campaign progress" ON public.campaign_progress
FOR UPDATE TO authenticated
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

-- Policies: wallets
CREATE POLICY "Users can view own wallet" ON public.wallets
FOR SELECT TO authenticated
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own wallet" ON public.wallets
FOR INSERT TO authenticated
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own wallet" ON public.wallets
FOR UPDATE TO authenticated
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

-- Policies: transactions
CREATE POLICY "Users can view own transactions" ON public.transactions
FOR SELECT TO authenticated
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own transactions" ON public.transactions
FOR INSERT TO authenticated
WITH CHECK ((select auth.uid()) = user_id);

-- Policies: rig_configs
CREATE POLICY "Users can view own rig config" ON public.rig_configs
FOR SELECT TO authenticated
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own rig config" ON public.rig_configs
FOR INSERT TO authenticated
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own rig config" ON public.rig_configs
FOR UPDATE TO authenticated
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

-- Policies: safehouses
CREATE POLICY "Users can view own safehouses" ON public.safehouses
FOR SELECT TO authenticated
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own safehouses" ON public.safehouses
FOR INSERT TO authenticated
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own safehouses" ON public.safehouses
FOR UPDATE TO authenticated
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

-- Policies: node_defenses
CREATE POLICY "Node defenses are viewable by authenticated users" ON public.node_defenses
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Users can insert own node defense" ON public.node_defenses
FOR INSERT TO authenticated
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own node defense" ON public.node_defenses
FOR UPDATE TO authenticated
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

-- Policies: game_sessions
CREATE POLICY "Users can view own game sessions" ON public.game_sessions
FOR SELECT TO authenticated
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own game sessions" ON public.game_sessions
FOR INSERT TO authenticated
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own game sessions" ON public.game_sessions
FOR UPDATE TO authenticated
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

-- Policies: secrets (service_role only)
CREATE POLICY "Service role manages game secrets" ON public.game_secrets
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role manages duel secrets" ON public.duel_secrets
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- Policies: game_guesses
CREATE POLICY "Users can view own guesses" ON public.game_guesses
FOR SELECT TO authenticated
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own guesses" ON public.game_guesses
FOR INSERT TO authenticated
WITH CHECK ((select auth.uid()) = user_id);

-- Policies: duel_rooms
CREATE POLICY "Duel rooms are viewable by authenticated users" ON public.duel_rooms
FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "Users can create duel rooms" ON public.duel_rooms
FOR INSERT TO authenticated
WITH CHECK ((select auth.uid()) = host_id);

CREATE POLICY "Participants can update duel rooms" ON public.duel_rooms
FOR UPDATE TO authenticated
USING ((select auth.uid()) = host_id OR (select auth.uid()) = opponent_id)
WITH CHECK ((select auth.uid()) = host_id OR (select auth.uid()) = opponent_id);

-- Policies: coop_sessions
CREATE POLICY "Participants can view coop sessions" ON public.coop_sessions
FOR SELECT TO authenticated
USING ((select auth.uid()) = player_alpha_id OR (select auth.uid()) = player_bravo_id);

CREATE POLICY "Alpha player can create coop session" ON public.coop_sessions
FOR INSERT TO authenticated
WITH CHECK ((select auth.uid()) = player_alpha_id);

CREATE POLICY "Participants can update coop sessions" ON public.coop_sessions
FOR UPDATE TO authenticated
USING ((select auth.uid()) = player_alpha_id OR (select auth.uid()) = player_bravo_id)
WITH CHECK ((select auth.uid()) = player_alpha_id OR (select auth.uid()) = player_bravo_id);

-- Policies: replays
CREATE POLICY "Replays are viewable by everyone" ON public.replays
FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "Users can insert own replays" ON public.replays
FOR INSERT TO authenticated
WITH CHECK ((select auth.uid()) = user_id);

-- Auth Trigger for new user setup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_handle TEXT;
BEGIN
  default_handle := COALESCE(
    NEW.raw_user_meta_data->>'handle',
    NEW.raw_user_meta_data->>'callsign',
    'DECKER_' || UPPER(SUBSTRING(NEW.id::text, 1, 6))
  );

  INSERT INTO public.profiles (id, handle, avatar_url)
  VALUES (
    NEW.id,
    default_handle,
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '/Character portraits/Player avatars.png')
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.campaign_progress (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.wallets (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.rig_configs (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.safehouses (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
