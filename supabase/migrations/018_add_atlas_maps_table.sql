-- Atlas Maps Table
-- Comprehensive map management for campaigns with AI generation, uploads, and external URLs
-- Migration: 018_add_atlas_maps_table

-- ============================================
-- Table: atlas_maps
-- ============================================
CREATE TABLE IF NOT EXISTS atlas_maps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,

  -- Basic info
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  thumbnail_url TEXT,

  -- Source tracking
  source_type TEXT NOT NULL CHECK (source_type IN ('ai_generated', 'uploaded', 'external_url')),

  -- Map categorization
  map_type TEXT NOT NULL CHECK (map_type IN ('world', 'region', 'city', 'dungeon', 'building', 'encounter', 'other')),
  style TEXT, -- 'parchment', 'satellite', 'artistic', 'hand-drawn', etc.

  -- Entity linking (optional - links map to a location/entity)
  linked_entity_id UUID REFERENCES entities(id) ON DELETE SET NULL,

  -- POI data stored as JSONB array
  -- Each POI: { id, x_percent, y_percent, label, description, linked_entity_id, color, icon }
  poi_data JSONB DEFAULT '[]'::jsonb,

  -- Additional metadata (generation prompts, dimensions, etc.)
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Flags
  is_primary BOOLEAN DEFAULT false, -- Primary map for linked entity
  is_public BOOLEAN DEFAULT false,  -- Visible to players

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_atlas_maps_campaign ON atlas_maps(campaign_id);
CREATE INDEX IF NOT EXISTS idx_atlas_maps_linked_entity ON atlas_maps(linked_entity_id) WHERE linked_entity_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_atlas_maps_type ON atlas_maps(campaign_id, map_type);
CREATE INDEX IF NOT EXISTS idx_atlas_maps_primary ON atlas_maps(linked_entity_id, is_primary) WHERE is_primary = true;

-- ============================================
-- Enable RLS
-- ============================================
ALTER TABLE atlas_maps ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "DMs can manage all maps in their campaigns" ON atlas_maps;
DROP POLICY IF EXISTS "Campaign members can view public maps" ON atlas_maps;

-- Policy: Campaign owners (DMs) can manage all maps in their campaigns
CREATE POLICY "DMs can manage all maps in their campaigns"
ON atlas_maps FOR ALL
USING (
  campaign_id IN (
    SELECT id FROM campaigns WHERE user_id = auth.uid()
  )
);

-- Policy: Campaign members can view public maps
CREATE POLICY "Campaign members can view public maps"
ON atlas_maps FOR SELECT
USING (
  is_public = true
  AND campaign_id IN (
    SELECT campaign_id FROM campaign_members WHERE user_id = auth.uid()
  )
);

-- ============================================
-- Update trigger for updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_atlas_maps_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS atlas_maps_updated_at ON atlas_maps;
CREATE TRIGGER atlas_maps_updated_at
  BEFORE UPDATE ON atlas_maps
  FOR EACH ROW
  EXECUTE FUNCTION update_atlas_maps_updated_at();

-- ============================================
-- Comments
-- ============================================
COMMENT ON TABLE atlas_maps IS 'Maps for campaigns - AI generated, uploaded, or external URLs with POI overlays';
COMMENT ON COLUMN atlas_maps.source_type IS 'How the map was created: ai_generated, uploaded, or external_url';
COMMENT ON COLUMN atlas_maps.map_type IS 'Scale/type of map: world, region, city, dungeon, building, encounter';
COMMENT ON COLUMN atlas_maps.style IS 'Visual style: parchment, satellite, artistic, hand-drawn, etc.';
COMMENT ON COLUMN atlas_maps.linked_entity_id IS 'Optional entity this map represents (e.g., a location)';
COMMENT ON COLUMN atlas_maps.poi_data IS 'JSONB array of points of interest with positions and metadata';
COMMENT ON COLUMN atlas_maps.metadata IS 'Additional data: AI prompts, image dimensions, generation settings';
COMMENT ON COLUMN atlas_maps.is_primary IS 'Whether this is the primary map for the linked entity';
COMMENT ON COLUMN atlas_maps.is_public IS 'Whether players can see this map';
