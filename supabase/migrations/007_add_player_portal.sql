-- Player Portal Migration
-- Migration: 007_add_player_portal
-- Adds join codes, campaign members, and campaign state

-- ============================================
-- Add columns to campaigns table
-- ============================================
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS join_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS current_state TEXT DEFAULT 'adventure'
  CHECK (current_state IN ('adventure', 'dungeon', 'long_rest', 'downtime'));

-- Index for join code lookups
CREATE INDEX IF NOT EXISTS idx_campaigns_join_code ON campaigns(join_code) WHERE join_code IS NOT NULL;

-- ============================================
-- Campaign Members Table
-- Links users to campaigns as players/spectators
-- ============================================
CREATE TABLE IF NOT EXISTS campaign_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  character_entity_id UUID REFERENCES entities(id) ON DELETE SET NULL,

  -- Role in the campaign
  role TEXT DEFAULT 'player' CHECK (role IN ('player', 'spectator', 'co_dm')),

  -- Permissions (for future use)
  can_view_dm_notes BOOLEAN DEFAULT false,
  can_edit_character BOOLEAN DEFAULT true,

  -- Metadata
  joined_at TIMESTAMPTZ DEFAULT now(),
  last_active_at TIMESTAMPTZ DEFAULT now(),

  -- Unique constraint: one user per campaign
  UNIQUE(campaign_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_campaign_members_campaign_id ON campaign_members(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_members_user_id ON campaign_members(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_members_character_id ON campaign_members(character_entity_id);

-- RLS
ALTER TABLE campaign_members ENABLE ROW LEVEL SECURITY;

-- Campaign owners can see all members
CREATE POLICY "Campaign owners can manage members" ON campaign_members FOR ALL
  USING (campaign_id IN (SELECT id FROM campaigns WHERE user_id = auth.uid()));

-- Members can view their own membership
CREATE POLICY "Members can view own membership" ON campaign_members FOR SELECT
  USING (user_id = auth.uid());

-- Members can update their own membership (limited)
CREATE POLICY "Members can update own membership" ON campaign_members FOR UPDATE
  USING (user_id = auth.uid());

-- Anyone can insert themselves as a member (join)
CREATE POLICY "Users can join campaigns" ON campaign_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- Join Code Generation Function
-- ============================================
CREATE OR REPLACE FUNCTION generate_join_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
  max_attempts INTEGER := 100;
  attempt INTEGER := 0;
BEGIN
  LOOP
    result := '';
    -- Generate 6 character code
    FOR i IN 1..6 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;

    -- Check if unique
    IF NOT EXISTS (SELECT 1 FROM campaigns WHERE join_code = result) THEN
      RETURN result;
    END IF;

    attempt := attempt + 1;
    IF attempt >= max_attempts THEN
      RAISE EXCEPTION 'Could not generate unique join code after % attempts', max_attempts;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Update entities RLS for player access
-- Players can view their own character and public entities
-- ============================================

-- Drop existing policy first
DROP POLICY IF EXISTS "Users can CRUD own entities" ON entities;

-- Campaign owners can manage all entities
CREATE POLICY "Campaign owners can CRUD entities" ON entities FOR ALL
  USING (campaign_id IN (SELECT id FROM campaigns WHERE user_id = auth.uid()));

-- Campaign members can view their claimed character
CREATE POLICY "Members can view own character" ON entities FOR SELECT
  USING (
    id IN (
      SELECT character_entity_id FROM campaign_members
      WHERE user_id = auth.uid() AND character_entity_id IS NOT NULL
    )
  );

-- Campaign members can view public entities in their campaigns
CREATE POLICY "Members can view public entities" ON entities FOR SELECT
  USING (
    visibility = 'public'
    AND campaign_id IN (
      SELECT campaign_id FROM campaign_members WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- Player Inventory Table (for Sprint 2)
-- ============================================
CREATE TABLE IF NOT EXISTS player_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES campaign_members(id) ON DELETE CASCADE NOT NULL,
  entity_id UUID REFERENCES entities(id) ON DELETE SET NULL,

  -- Item details (can be from SRD or custom)
  item_name TEXT NOT NULL,
  item_type TEXT,
  quantity INTEGER DEFAULT 1,
  is_equipped BOOLEAN DEFAULT false,
  notes TEXT,

  -- SRD reference (if applicable)
  srd_item_id UUID,

  -- Custom properties
  properties JSONB DEFAULT '{}',

  -- Metadata
  acquired_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_player_inventory_member_id ON player_inventory(member_id);

-- RLS
ALTER TABLE player_inventory ENABLE ROW LEVEL SECURITY;

-- Players can manage their own inventory
CREATE POLICY "Players can manage own inventory" ON player_inventory FOR ALL
  USING (member_id IN (SELECT id FROM campaign_members WHERE user_id = auth.uid()));

-- Campaign owners can view all inventory
CREATE POLICY "Campaign owners can view inventory" ON player_inventory FOR SELECT
  USING (member_id IN (
    SELECT cm.id FROM campaign_members cm
    JOIN campaigns c ON cm.campaign_id = c.id
    WHERE c.user_id = auth.uid()
  ));

-- Update trigger for player_inventory
CREATE TRIGGER update_player_inventory_updated_at
  BEFORE UPDATE ON player_inventory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
