-- Add new columns to codex table for enhanced campaign settings
-- Run this in Supabase SQL Editor

-- Add premise field for campaign hook/conflict
ALTER TABLE codex
ADD COLUMN IF NOT EXISTS premise TEXT;

-- Add pillars field for campaign focus areas
ALTER TABLE codex
ADD COLUMN IF NOT EXISTS pillars TEXT[] DEFAULT '{}';

-- Add open questions field for undecided elements
ALTER TABLE codex
ADD COLUMN IF NOT EXISTS open_questions TEXT[] DEFAULT '{}';

-- Note: current_game_date column should already exist as per initial schema
-- If you have current_date instead (PostgreSQL reserved word), rename it:
-- ALTER TABLE codex RENAME COLUMN current_date TO current_game_date;
