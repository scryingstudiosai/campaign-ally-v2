-- Atlas: Interactive Map Markers
-- Migration: 008_add_map_markers
-- Allows placing pins on location maps that link to other entities

-- ============================================
-- Table: map_markers
-- ============================================
CREATE TABLE IF NOT EXISTS map_markers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  -- Parent location (the map this marker is on)
  parent_location_id UUID REFERENCES entities(id) ON DELETE CASCADE NOT NULL,

  -- Linked entity (optional - what this pin represents)
  linked_entity_id UUID REFERENCES entities(id) ON DELETE SET NULL,

  -- Custom label (when not linking to entity)
  label TEXT,
  description TEXT,

  -- Position as percentage (0-100) for responsive scaling
  x_percent NUMERIC(5,2) NOT NULL CHECK (x_percent >= 0 AND x_percent <= 100),
  y_percent NUMERIC(5,2) NOT NULL CHECK (y_percent >= 0 AND y_percent <= 100),

  -- Visual customization
  color TEXT DEFAULT 'teal' CHECK (color IN ('teal', 'red', 'amber', 'purple', 'blue', 'green', 'orange')),
  icon_type TEXT DEFAULT 'default' CHECK (icon_type IN ('default', 'star', 'skull', 'home', 'shop', 'tavern', 'temple', 'castle')),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_map_markers_campaign_id ON map_markers(campaign_id);
CREATE INDEX idx_map_markers_parent_location ON map_markers(parent_location_id);
CREATE INDEX idx_map_markers_linked_entity ON map_markers(linked_entity_id);

-- RLS
ALTER TABLE map_markers ENABLE ROW LEVEL SECURITY;

-- Policy: Users can manage their own markers
CREATE POLICY "Users can CRUD own map markers" ON map_markers FOR ALL
  USING (user_id = auth.uid());

-- Policy: Users can view markers in campaigns they have access to
CREATE POLICY "Users can view markers in their campaigns" ON map_markers FOR SELECT
  USING (campaign_id IN (SELECT id FROM campaigns WHERE user_id = auth.uid()));

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_map_markers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER map_markers_updated_at
  BEFORE UPDATE ON map_markers
  FOR EACH ROW
  EXECUTE FUNCTION update_map_markers_updated_at();
