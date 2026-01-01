-- Add player settings column to codex table
-- This allows DMs to configure what players can access and edit in the player portal

ALTER TABLE codex ADD COLUMN IF NOT EXISTS player_settings JSONB DEFAULT '{
  "character_editing": {
    "backstory": true,
    "personality": true,
    "notes": true,
    "appearance": false
  },
  "inventory": {
    "can_add_items": false,
    "requires_approval": true,
    "can_see_party_stash": true
  },
  "visibility": {
    "can_see_quests": true,
    "can_see_world_map": true,
    "can_see_party_members": true,
    "can_see_revealed_lore": true
  },
  "communication": {
    "can_message_dm": true,
    "can_message_party": true
  }
}'::jsonb;

COMMENT ON COLUMN codex.player_settings IS 'DM-configurable settings for what players can access and edit in the player portal';
