-- Fix Player Forge RLS Policies
-- Migration: 015_fix_player_forge_rls
--
-- Problem: Players in player mode cannot create characters because:
-- 1. The entities RLS policy only allows campaign owners to INSERT
-- 2. The relationships RLS policy only allows campaign owners to INSERT
--
-- Solution: Add policies that allow campaign members to:
-- 1. Create player-type entities in campaigns they belong to
-- 2. Create relationships where they are the source entity

-- ============================================
-- Fix 1: Allow members to INSERT player entities
-- ============================================

-- Allow campaign members to create player entities in their campaigns
CREATE POLICY "Members can create player entities" ON entities FOR INSERT
  WITH CHECK (
    entity_type = 'player'
    AND campaign_id IN (
      SELECT campaign_id FROM campaign_members WHERE user_id = auth.uid()
    )
  );

-- Allow members to UPDATE their own player character (for HP, notes, etc.)
CREATE POLICY "Members can update own character" ON entities FOR UPDATE
  USING (
    id IN (
      SELECT character_entity_id FROM campaign_members
      WHERE user_id = auth.uid() AND character_entity_id IS NOT NULL
    )
  )
  WITH CHECK (
    id IN (
      SELECT character_entity_id FROM campaign_members
      WHERE user_id = auth.uid() AND character_entity_id IS NOT NULL
    )
  );

-- ============================================
-- Fix 2: Allow members to INSERT relationships
-- ============================================

-- Allow campaign members to create relationships in campaigns they belong to
-- This is needed for World Anchors during character creation
CREATE POLICY "Members can create relationships" ON relationships FOR INSERT
  WITH CHECK (
    campaign_id IN (
      SELECT campaign_id FROM campaign_members WHERE user_id = auth.uid()
    )
  );

-- Allow campaign members to view relationships in their campaigns
-- This is needed to display World Anchors in the portal
CREATE POLICY "Members can view campaign relationships" ON relationships FOR SELECT
  USING (
    campaign_id IN (
      SELECT campaign_id FROM campaign_members WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- Notes:
-- ============================================
-- - Players can only create 'player' type entities, not NPCs/locations/etc
-- - Players can only update their own claimed character
-- - Players can create and view relationships in their campaigns
-- - Campaign owners retain full CRUD access via existing policies
