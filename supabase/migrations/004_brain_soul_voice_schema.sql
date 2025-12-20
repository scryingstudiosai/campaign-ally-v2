-- ============================================
-- BRAIN/SOUL/VOICE SCHEMA MIGRATION
-- Campaign Ally Living Entity System
-- ============================================

-- STEP 1: Sessions Table (Minimal - enables temporal tracking)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  title TEXT,
  summary TEXT,
  session_date DATE,
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, order_index)
);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their campaign sessions"
ON sessions FOR ALL
USING (
  campaign_id IN (
    SELECT id FROM campaigns WHERE user_id = auth.uid()
  )
);


-- STEP 2: Facts Table (The Memory Engine)
CREATE TABLE IF NOT EXISTS facts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  category TEXT CHECK (category IN ('lore', 'plot', 'mechanical', 'secret', 'flavor', 'appearance', 'personality', 'backstory')),
  visibility TEXT DEFAULT 'dm_only' CHECK (visibility IN ('public', 'limited', 'dm_only')),
  known_by UUID[] DEFAULT '{}',
  is_current BOOLEAN DEFAULT true,
  established_at_session_id UUID REFERENCES sessions(id),
  established_at_text TEXT,
  superseded_at_session_id UUID REFERENCES sessions(id),
  superseded_by_fact_id UUID REFERENCES facts(id),
  source_type TEXT DEFAULT 'generated' CHECK (source_type IN ('generated', 'manual', 'session', 'import')),
  source_entity_id UUID REFERENCES entities(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_facts_active_entity ON facts(entity_id) WHERE is_current = true;
CREATE INDEX IF NOT EXISTS idx_facts_campaign_context ON facts(campaign_id, category) WHERE is_current = true;
CREATE INDEX IF NOT EXISTS idx_facts_visibility ON facts(campaign_id, visibility) WHERE is_current = true;

ALTER TABLE facts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage facts in their campaigns"
ON facts FOR ALL
USING (
  campaign_id IN (
    SELECT id FROM campaigns WHERE user_id = auth.uid()
  )
);


-- STEP 3: Update Relationships Table (Add Depth)
ALTER TABLE relationships
ADD COLUMN IF NOT EXISTS deep_truth TEXT,
ADD COLUMN IF NOT EXISTS deep_truth_visibility TEXT DEFAULT 'dm_only',
ADD COLUMN IF NOT EXISTS surface_description TEXT,
ADD COLUMN IF NOT EXISTS tension TEXT,
ADD COLUMN IF NOT EXISTS potential_reveal TEXT,
ADD COLUMN IF NOT EXISTS intensity TEXT DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS established_at_session_id UUID REFERENCES sessions(id),
ADD COLUMN IF NOT EXISTS ended_at_session_id UUID REFERENCES sessions(id),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add check constraints separately (safer for existing tables)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'relationships_deep_truth_visibility_check'
  ) THEN
    ALTER TABLE relationships
    ADD CONSTRAINT relationships_deep_truth_visibility_check
    CHECK (deep_truth_visibility IN ('public', 'limited', 'dm_only'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'relationships_intensity_check'
  ) THEN
    ALTER TABLE relationships
    ADD CONSTRAINT relationships_intensity_check
    CHECK (intensity IN ('low', 'medium', 'high'));
  END IF;
END $$;


-- STEP 4: Update Entities Table (Add Brain & Voice)
ALTER TABLE entities
ADD COLUMN IF NOT EXISTS brain JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS voice JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS read_aloud TEXT,
ADD COLUMN IF NOT EXISTS dm_slug TEXT,
ADD COLUMN IF NOT EXISTS sub_type TEXT;

CREATE INDEX IF NOT EXISTS idx_entities_brain ON entities USING GIN (brain);
CREATE INDEX IF NOT EXISTS idx_entities_sub_type ON entities(sub_type);
