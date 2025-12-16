-- Campaign Ally Database Schema
-- Migration: 001_initial_schema
-- Run this in Supabase SQL Editor

-- ============================================
-- Table 1: profiles (extends auth.users)
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'legendary')),
  generations_used INTEGER DEFAULT 0,
  generations_reset_at TIMESTAMPTZ DEFAULT now(),
  onboarding_complete BOOLEAN DEFAULT false,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (new.id, new.raw_user_meta_data->>'display_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- Table 2: campaigns
-- ============================================
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  genre TEXT,
  game_system TEXT DEFAULT 'dnd5e',
  is_active BOOLEAN DEFAULT true,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX idx_campaigns_deleted_at ON campaigns(deleted_at);

-- RLS
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own campaigns" ON campaigns FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- Table 3: codex
-- ============================================
CREATE TABLE codex (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE UNIQUE NOT NULL,

  -- World Foundation
  world_name TEXT,
  tone TEXT[] DEFAULT '{}',
  magic_level TEXT DEFAULT 'medium',
  tech_level TEXT DEFAULT 'medieval',
  themes TEXT[] DEFAULT '{}',

  -- Style Settings
  narrative_voice TEXT,
  content_warnings TEXT[] DEFAULT '{}',
  safety_tools JSONB DEFAULT '{}',

  -- Naming & Culture
  naming_conventions JSONB DEFAULT '{}',
  languages TEXT[] DEFAULT '{}',

  -- Geography
  geography_notes TEXT,
  calendar_system TEXT,
  current_date TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index
CREATE INDEX idx_codex_campaign_id ON codex(campaign_id);

-- RLS
ALTER TABLE codex ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own codex" ON codex FOR ALL
  USING (campaign_id IN (SELECT id FROM campaigns WHERE user_id = auth.uid()));

-- ============================================
-- Table 4: entities
-- ============================================
CREATE TABLE entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,

  -- Core Identity
  entity_type TEXT NOT NULL,
  subtype TEXT,
  name TEXT NOT NULL,
  aliases TEXT[] DEFAULT '{}',

  -- Content
  summary TEXT,
  description TEXT,
  public_notes TEXT,
  dm_notes TEXT,

  -- Structured Data (type-specific)
  attributes JSONB DEFAULT '{}',

  -- Organization
  parent_id UUID REFERENCES entities(id) ON DELETE SET NULL,
  importance_tier TEXT DEFAULT 'minor' CHECK (importance_tier IN ('legendary', 'major', 'minor', 'background')),
  tags TEXT[] DEFAULT '{}',

  -- State & Visibility
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'deceased', 'destroyed', 'missing', 'archived')),
  visibility TEXT DEFAULT 'dm_only' CHECK (visibility IN ('public', 'dm_only', 'revealable')),
  forge_status TEXT DEFAULT 'complete' CHECK (forge_status IN ('stub', 'partial', 'complete')),

  -- Media
  image_url TEXT,

  -- V2: Semantic Search (nullable for now)
  -- vector_embedding VECTOR(1536),

  -- Metadata
  source_forge TEXT,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_entities_campaign_id ON entities(campaign_id);
CREATE INDEX idx_entities_entity_type ON entities(entity_type);
CREATE INDEX idx_entities_parent_id ON entities(parent_id);
CREATE INDEX idx_entities_deleted_at ON entities(deleted_at);
CREATE INDEX idx_entities_tags ON entities USING GIN(tags);

-- RLS
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own entities" ON entities FOR ALL
  USING (campaign_id IN (SELECT id FROM campaigns WHERE user_id = auth.uid()));

-- ============================================
-- Table 5: relationships
-- ============================================
CREATE TABLE relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,

  -- The Connection
  source_id UUID REFERENCES entities(id) ON DELETE CASCADE NOT NULL,
  target_id UUID REFERENCES entities(id) ON DELETE CASCADE NOT NULL,
  relationship_type TEXT NOT NULL,

  -- Details
  description TEXT,
  is_bidirectional BOOLEAN DEFAULT false,
  strength TEXT DEFAULT 'normal' CHECK (strength IN ('weak', 'normal', 'strong')),
  visibility TEXT DEFAULT 'dm_only' CHECK (visibility IN ('public', 'dm_only', 'revealable')),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_relationships_campaign_id ON relationships(campaign_id);
CREATE INDEX idx_relationships_source_id ON relationships(source_id);
CREATE INDEX idx_relationships_target_id ON relationships(target_id);

-- RLS
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own relationships" ON relationships FOR ALL
  USING (campaign_id IN (SELECT id FROM campaigns WHERE user_id = auth.uid()));

-- ============================================
-- Table 6: sessions
-- ============================================
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,

  -- Identity
  session_number INTEGER NOT NULL,
  title TEXT,

  -- Timing
  scheduled_date DATE,
  actual_date DATE,
  duration_minutes INTEGER,

  -- State
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed')),

  -- Content
  prep_notes TEXT,
  session_notes TEXT,
  summary TEXT,
  cliffhanger TEXT,

  -- Players
  players_present TEXT[] DEFAULT '{}',

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_sessions_campaign_id ON sessions(campaign_id);
CREATE INDEX idx_sessions_session_number ON sessions(campaign_id, session_number);

-- RLS
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own sessions" ON sessions FOR ALL
  USING (campaign_id IN (SELECT id FROM campaigns WHERE user_id = auth.uid()));

-- ============================================
-- Table 7: session_beats
-- ============================================
CREATE TABLE session_beats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,

  -- Order & Identity
  sort_order INTEGER NOT NULL,
  title TEXT,

  -- Content
  description TEXT,
  beat_type TEXT CHECK (beat_type IN ('scene', 'combat', 'roleplay', 'exploration', 'rest')),
  tone TEXT,
  estimated_minutes INTEGER,

  -- State
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'skipped')),
  actual_notes TEXT,

  -- Linked Entities
  linked_entity_ids UUID[] DEFAULT '{}',

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index
CREATE INDEX idx_session_beats_session_id ON session_beats(session_id);

-- RLS
ALTER TABLE session_beats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own session_beats" ON session_beats FOR ALL
  USING (session_id IN (
    SELECT s.id FROM sessions s
    JOIN campaigns c ON s.campaign_id = c.id
    WHERE c.user_id = auth.uid()
  ));

-- ============================================
-- Table 8: generations
-- ============================================
CREATE TABLE generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,

  -- What Was Generated
  forge_type TEXT NOT NULL,
  input_summary TEXT,
  tokens_used INTEGER,

  -- Result
  entity_id UUID REFERENCES entities(id) ON DELETE SET NULL,
  was_saved BOOLEAN DEFAULT false,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_generations_user_id ON generations(user_id);
CREATE INDEX idx_generations_created_at ON generations(created_at);

-- RLS
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own generations" ON generations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own generations" ON generations FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- Updated_at Trigger Function
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_codex_updated_at BEFORE UPDATE ON codex FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_entities_updated_at BEFORE UPDATE ON entities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_session_beats_updated_at BEFORE UPDATE ON session_beats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
