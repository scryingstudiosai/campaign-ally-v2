-- Add Proper Noun Bank and Resolved Questions to Codex
-- Run this migration in your Supabase SQL Editor

-- Proper Nouns: Established names in the world (gods, cities, factions, NPCs)
-- The AI will use these instead of inventing new ones
ALTER TABLE codex
ADD COLUMN IF NOT EXISTS proper_nouns TEXT[] DEFAULT '{}';

-- Resolved Questions: Facts that have been established
-- These were previously open questions but are now canon
ALTER TABLE codex
ADD COLUMN IF NOT EXISTS resolved_questions TEXT[] DEFAULT '{}';

-- Add comments for documentation
COMMENT ON COLUMN codex.proper_nouns IS 'Key established names in the world - gods, cities, factions, important NPCs';
COMMENT ON COLUMN codex.resolved_questions IS 'Previously open questions that have been resolved and are now established facts';
