-- Fix Player Entity Access for World Anchors
-- Migration: 014_fix_player_entity_access
--
-- Problem: Players in player mode can't see campaign entities for World Anchors
-- because the default visibility is 'dm_only' and the existing RLS policy
-- "Members can view public entities" requires visibility = 'public'
--
-- Solution: Add a policy that allows campaign members to view entities
-- in campaigns they belong to. This is needed for character creation
-- where players select locations, factions, and NPCs as world anchors.

-- Drop the restrictive public-only policy
DROP POLICY IF EXISTS "Members can view public entities" ON entities;

-- Create a new policy that allows campaign members to view entities
-- in their campaigns (regardless of visibility setting)
-- This is appropriate because:
-- 1. Players need to see entities for character creation anchoring
-- 2. The portal already controls what players can see/interact with
-- 3. DMs still control entity creation and content
CREATE POLICY "Members can view campaign entities" ON entities FOR SELECT
  USING (
    campaign_id IN (
      SELECT campaign_id FROM campaign_members WHERE user_id = auth.uid()
    )
  );

-- Note: This is a SELECT-only policy. Players still cannot:
-- - Create entities (only owners can via "Campaign owners can CRUD entities")
-- - Update entities (only owners can)
-- - Delete entities (only owners can)
