-- ============================================
-- ADD SOUL AND MECHANICS COLUMNS
-- Campaign Ally Entity System
-- ============================================
--
-- This migration adds the missing `soul` and `mechanics` columns
-- needed for the full Brain/Soul/Voice/Mechanics architecture:
--
-- - NPCs: brain (core logic) + voice (speaking style)
-- - Items: brain (lore) + voice (if sentient) + mechanics (stats/abilities)
-- - Locations: brain (purpose/secrets) + soul (sensory atmosphere) + mechanics (hazards/encounters)
--

-- Add soul column (for location sensory details)
ALTER TABLE entities
ADD COLUMN IF NOT EXISTS soul JSONB DEFAULT '{}'::jsonb;

-- Add mechanics column (for items and locations)
ALTER TABLE entities
ADD COLUMN IF NOT EXISTS mechanics JSONB DEFAULT '{}'::jsonb;

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_entities_soul ON entities USING GIN (soul);
CREATE INDEX IF NOT EXISTS idx_entities_mechanics ON entities USING GIN (mechanics);

-- Add comment for documentation
COMMENT ON COLUMN entities.soul IS 'Sensory and atmospheric details for locations (sights, sounds, smells, textures)';
COMMENT ON COLUMN entities.mechanics IS 'Game mechanics for items (stats, abilities) and locations (hazards, encounters, resources)';
