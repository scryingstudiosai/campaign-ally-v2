-- Campaign Invites Table
-- Allows DMs to create shareable invite links/codes for players to join

CREATE TABLE IF NOT EXISTS campaign_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,

  -- Optional restrictions
  max_uses INTEGER, -- NULL = unlimited
  use_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ, -- NULL = never expires

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Optional note/label for the invite
  label TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_campaign_invites_code ON campaign_invites(code);
CREATE INDEX IF NOT EXISTS idx_campaign_invites_campaign_id ON campaign_invites(campaign_id);

-- Enable RLS
ALTER TABLE campaign_invites ENABLE ROW LEVEL SECURITY;

-- Campaign owners can manage their invites
CREATE POLICY "Campaign owners can manage invites"
ON campaign_invites FOR ALL
USING (campaign_id IN (SELECT id FROM campaigns WHERE user_id = auth.uid()));

-- Anyone can read active invites (needed for join page)
CREATE POLICY "Anyone can read active invites"
ON campaign_invites FOR SELECT
USING (is_active = true);

-- Function to generate invite code
CREATE OR REPLACE FUNCTION generate_invite_code()
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
    -- Generate 8 character code
    FOR i IN 1..8 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;

    -- Check if unique
    IF NOT EXISTS (SELECT 1 FROM campaign_invites WHERE code = result) THEN
      RETURN result;
    END IF;

    attempt := attempt + 1;
    IF attempt >= max_attempts THEN
      RAISE EXCEPTION 'Could not generate unique invite code after % attempts', max_attempts;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Automatically create an invite for each campaign that has a join_code
-- (Migration helper to maintain backwards compatibility)
INSERT INTO campaign_invites (campaign_id, code, created_by)
SELECT id, join_code, user_id
FROM campaigns
WHERE join_code IS NOT NULL
ON CONFLICT (code) DO NOTHING;
