-- Inventory Instances Table
-- Entity-centric inventory system where each entity is an inventory bucket
-- This replaces the member-centric player_inventory approach

CREATE TABLE IF NOT EXISTS inventory_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,

  -- Item reference (one of these must be set)
  srd_item_id UUID REFERENCES srd_items(id) ON DELETE SET NULL,
  custom_entity_id UUID REFERENCES entities(id) ON DELETE SET NULL,

  -- Owner info
  owner_type TEXT NOT NULL CHECK (owner_type IN ('player', 'party', 'location', 'npc')),
  owner_id UUID NOT NULL, -- Entity ID of the owner

  -- Item state
  quantity INTEGER DEFAULT 1,
  is_equipped BOOLEAN DEFAULT false,
  is_attuned BOOLEAN DEFAULT false,
  is_identified BOOLEAN DEFAULT true,
  charges INTEGER,
  max_charges INTEGER,

  -- Metadata
  acquired_from TEXT,
  notes TEXT,
  sort_order INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure at least one item reference
  CONSTRAINT item_reference_check CHECK (
    srd_item_id IS NOT NULL OR custom_entity_id IS NOT NULL
  )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_inventory_instances_campaign ON inventory_instances(campaign_id);
CREATE INDEX IF NOT EXISTS idx_inventory_instances_owner ON inventory_instances(owner_type, owner_id);
CREATE INDEX IF NOT EXISTS idx_inventory_instances_srd_item ON inventory_instances(srd_item_id) WHERE srd_item_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_inventory_instances_custom ON inventory_instances(custom_entity_id) WHERE custom_entity_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_inventory_instances_sort ON inventory_instances(owner_id, sort_order);

-- Enable RLS
ALTER TABLE inventory_instances ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Campaign owners can manage all inventory" ON inventory_instances;
DROP POLICY IF EXISTS "Players can view own inventory" ON inventory_instances;
DROP POLICY IF EXISTS "Players can manage own inventory" ON inventory_instances;
DROP POLICY IF EXISTS "Members can view party inventory" ON inventory_instances;

-- Campaign owners (DMs) can manage all inventory in their campaigns
CREATE POLICY "Campaign owners can manage all inventory"
ON inventory_instances FOR ALL
USING (
  campaign_id IN (
    SELECT id FROM campaigns WHERE user_id = auth.uid()
  )
);

-- Players can view their own character's inventory
CREATE POLICY "Players can view own inventory"
ON inventory_instances FOR SELECT
USING (
  owner_type = 'player'
  AND owner_id IN (
    SELECT character_entity_id FROM campaign_members
    WHERE user_id = auth.uid() AND character_entity_id IS NOT NULL
  )
);

-- Players can manage their own character's inventory (insert, update, delete)
CREATE POLICY "Players can manage own inventory"
ON inventory_instances FOR ALL
USING (
  owner_type = 'player'
  AND owner_id IN (
    SELECT character_entity_id FROM campaign_members
    WHERE user_id = auth.uid() AND character_entity_id IS NOT NULL
  )
);

-- All campaign members can view party inventory
CREATE POLICY "Members can view party inventory"
ON inventory_instances FOR SELECT
USING (
  owner_type = 'party'
  AND campaign_id IN (
    SELECT campaign_id FROM campaign_members WHERE user_id = auth.uid()
  )
);

-- Update trigger
CREATE OR REPLACE FUNCTION update_inventory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_inventory_instances_updated_at ON inventory_instances;
CREATE TRIGGER update_inventory_instances_updated_at
  BEFORE UPDATE ON inventory_instances
  FOR EACH ROW EXECUTE FUNCTION update_inventory_updated_at();

-- Comments
COMMENT ON TABLE inventory_instances IS 'Inventory items owned by entities (players, party, locations, NPCs)';
COMMENT ON COLUMN inventory_instances.owner_type IS 'Type of owner: player, party, location, npc';
COMMENT ON COLUMN inventory_instances.owner_id IS 'Entity ID of the owner';
COMMENT ON COLUMN inventory_instances.srd_item_id IS 'Reference to SRD item if using standard item';
COMMENT ON COLUMN inventory_instances.custom_entity_id IS 'Reference to custom item entity if using homebrew item';
