-- DM Notifications table for tracking unread messages and other alerts
-- This allows DMs to see when players have sent messages or need attention

CREATE TABLE IF NOT EXISTS dm_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'player_message', 'inventory_request', 'player_joined', 'character_created'
  title TEXT NOT NULL,
  message TEXT,
  source_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  source_entity_id UUID REFERENCES entities(id) ON DELETE SET NULL,
  reference_id UUID, -- ID of the related record (message_id, inventory_item_id, etc.)
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_dm_notifications_campaign ON dm_notifications(campaign_id);
CREATE INDEX idx_dm_notifications_unread ON dm_notifications(campaign_id, is_read) WHERE is_read = false;
CREATE INDEX idx_dm_notifications_created ON dm_notifications(created_at DESC);

-- Enable RLS
ALTER TABLE dm_notifications ENABLE ROW LEVEL SECURITY;

-- DMs can view notifications for their campaigns
CREATE POLICY "DMs can view own notifications"
ON dm_notifications FOR SELECT
USING (
  campaign_id IN (
    SELECT id FROM campaigns WHERE user_id = auth.uid()
  )
);

-- DMs can update (mark as read) their notifications
CREATE POLICY "DMs can update own notifications"
ON dm_notifications FOR UPDATE
USING (
  campaign_id IN (
    SELECT id FROM campaigns WHERE user_id = auth.uid()
  )
);

-- Allow inserts (for when players send messages)
CREATE POLICY "Authenticated users can create notifications"
ON dm_notifications FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Add comments for documentation
COMMENT ON TABLE dm_notifications IS 'Notifications for DMs about player activity (messages, requests, etc.)';
COMMENT ON COLUMN dm_notifications.type IS 'Type of notification: player_message, inventory_request, player_joined, character_created';
COMMENT ON COLUMN dm_notifications.reference_id IS 'ID of the related record (message_id, inventory_item_id, membership_id, etc.)';
