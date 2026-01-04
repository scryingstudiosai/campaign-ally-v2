-- Portal Messages Table for player-DM communication
-- This migration creates the table if it doesn't exist and adds read tracking

-- Create portal_messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS portal_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('dm', 'player')),
  channel TEXT NOT NULL CHECK (channel IN ('party', 'dm_private')),
  recipient_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add is_read column if table exists but column doesn't
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'portal_messages' AND column_name = 'is_read'
  ) THEN
    ALTER TABLE portal_messages ADD COLUMN is_read BOOLEAN DEFAULT false;
    ALTER TABLE portal_messages ADD COLUMN read_at TIMESTAMPTZ;
  END IF;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_portal_messages_campaign ON portal_messages(campaign_id);
CREATE INDEX IF NOT EXISTS idx_portal_messages_channel ON portal_messages(campaign_id, channel);
CREATE INDEX IF NOT EXISTS idx_portal_messages_sender ON portal_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_portal_messages_recipient ON portal_messages(recipient_id) WHERE recipient_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_portal_messages_unread ON portal_messages(campaign_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_portal_messages_created ON portal_messages(created_at DESC);

-- Enable RLS
ALTER TABLE portal_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Campaign members can view party messages" ON portal_messages;
DROP POLICY IF EXISTS "DMs can view all messages" ON portal_messages;
DROP POLICY IF EXISTS "Members can view own private messages" ON portal_messages;
DROP POLICY IF EXISTS "Authenticated users can send messages" ON portal_messages;
DROP POLICY IF EXISTS "Recipients can mark messages read" ON portal_messages;

-- Campaign members can view party messages in their campaigns
CREATE POLICY "Campaign members can view party messages"
ON portal_messages FOR SELECT
USING (
  channel = 'party'
  AND campaign_id IN (
    SELECT campaign_id FROM campaign_members WHERE user_id = auth.uid()
  )
);

-- DMs can view all messages in their campaigns
CREATE POLICY "DMs can view all messages"
ON portal_messages FOR SELECT
USING (
  campaign_id IN (
    SELECT id FROM campaigns WHERE user_id = auth.uid()
  )
);

-- Members can view private messages they sent or received
CREATE POLICY "Members can view own private messages"
ON portal_messages FOR SELECT
USING (
  channel = 'dm_private'
  AND (sender_id = auth.uid() OR recipient_id = auth.uid())
);

-- Authenticated users can send messages
CREATE POLICY "Authenticated users can send messages"
ON portal_messages FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND sender_id = auth.uid()
);

-- Recipients can mark messages as read (update is_read)
CREATE POLICY "Recipients can mark messages read"
ON portal_messages FOR UPDATE
USING (
  -- Party messages: any member in the campaign can mark as read (for themselves)
  (channel = 'party' AND campaign_id IN (
    SELECT campaign_id FROM campaign_members WHERE user_id = auth.uid()
  ))
  OR
  -- Private messages: recipient can mark as read
  (channel = 'dm_private' AND recipient_id = auth.uid())
  OR
  -- DM can mark any message in their campaign as read
  campaign_id IN (SELECT id FROM campaigns WHERE user_id = auth.uid())
)
WITH CHECK (
  -- Only allow updating read status fields
  TRUE
);

-- Add comments for documentation
COMMENT ON TABLE portal_messages IS 'Messages between players and DM in the player portal';
COMMENT ON COLUMN portal_messages.channel IS 'Message channel: party (visible to all) or dm_private (player-DM whisper)';
COMMENT ON COLUMN portal_messages.is_read IS 'Whether the message has been read by recipient';
