-- Enhanced Rumors / Lore Drops System
-- Migration: 019_add_rumors_table
-- Allows lore drops from ANY entity type with player targeting

-- ============================================
-- Rumors Table
-- ============================================
CREATE TABLE IF NOT EXISTS rumors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,

  -- Content
  content TEXT NOT NULL,
  title TEXT, -- Optional title like "Whispers about the Old War"

  -- Source tracking
  source_entity_id UUID REFERENCES entities(id) ON DELETE SET NULL,
  source_type TEXT, -- 'npc', 'location', 'item', 'event', 'faction', 'deity', 'manual'
  source_name TEXT, -- Store name in case entity is deleted

  -- Targeting: 'party' = whole party, 'player' = specific character
  target_type TEXT DEFAULT 'party' CHECK (target_type IN ('party', 'player')),
  target_player_id UUID REFERENCES entities(id) ON DELETE SET NULL, -- Player character entity ID

  -- Metadata
  is_visible BOOLEAN DEFAULT true,
  skill_check TEXT, -- Optional: "History", "Arcana", etc.
  dc INTEGER, -- Optional: DC if skill check required

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ============================================
-- Rumor Reads Table (track which players have seen which rumors)
-- ============================================
CREATE TABLE IF NOT EXISTS rumor_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rumor_id UUID NOT NULL REFERENCES rumors(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(rumor_id, user_id)
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_rumors_campaign ON rumors(campaign_id);
CREATE INDEX IF NOT EXISTS idx_rumors_target ON rumors(target_player_id);
CREATE INDEX IF NOT EXISTS idx_rumors_source ON rumors(source_entity_id);
CREATE INDEX IF NOT EXISTS idx_rumors_created ON rumors(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rumor_reads_user ON rumor_reads(user_id);
CREATE INDEX IF NOT EXISTS idx_rumor_reads_rumor ON rumor_reads(rumor_id);

-- ============================================
-- RLS for Rumors
-- ============================================
ALTER TABLE rumors ENABLE ROW LEVEL SECURITY;

-- DMs can manage all rumors in their campaigns
CREATE POLICY "DMs can manage rumors" ON rumors
  FOR ALL USING (
    campaign_id IN (SELECT id FROM campaigns WHERE user_id = auth.uid())
  );

-- Players can view party rumors OR rumors targeted to their character
CREATE POLICY "Players can view their rumors" ON rumors
  FOR SELECT USING (
    campaign_id IN (SELECT campaign_id FROM campaign_members WHERE user_id = auth.uid())
    AND is_visible = true
    AND (
      target_type = 'party'
      OR target_player_id IN (
        SELECT character_entity_id FROM campaign_members WHERE user_id = auth.uid()
      )
    )
  );

-- ============================================
-- RLS for Rumor Reads
-- ============================================
ALTER TABLE rumor_reads ENABLE ROW LEVEL SECURITY;

-- Users can manage their own read status
CREATE POLICY "Users can manage their own reads" ON rumor_reads
  FOR ALL USING (user_id = auth.uid());

-- DMs can view read status for their campaigns (for analytics)
CREATE POLICY "DMs can view read status" ON rumor_reads
  FOR SELECT USING (
    rumor_id IN (
      SELECT r.id FROM rumors r
      JOIN campaigns c ON r.campaign_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );
