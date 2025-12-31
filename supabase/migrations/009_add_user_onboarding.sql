-- User Onboarding & Progress Tracking
-- Tracks first-time user experience, feature discovery, and campaign setup progress

CREATE TABLE IF NOT EXISTS user_onboarding (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  has_completed_wizard BOOLEAN DEFAULT false,
  wizard_completed_at TIMESTAMPTZ,
  checklist_progress JSONB DEFAULT '{
    "created_campaign": false,
    "added_first_npc": false,
    "added_first_location": false,
    "ran_first_session": false,
    "used_ai_generation": false,
    "explored_codex": false,
    "created_faction": false,
    "added_quest": false,
    "exported_campaign": false,
    "invited_player": false
  }'::jsonb,
  dismissed_hints TEXT[] DEFAULT '{}',
  tutorials_completed TEXT[] DEFAULT '{}',
  first_campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_onboarding ENABLE ROW LEVEL SECURITY;

-- Users can only access their own onboarding data
CREATE POLICY "Users can view own onboarding"
  ON user_onboarding FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own onboarding"
  ON user_onboarding FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own onboarding"
  ON user_onboarding FOR UPDATE
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_onboarding_user_id ON user_onboarding(user_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_onboarding_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_onboarding_updated_at
  BEFORE UPDATE ON user_onboarding
  FOR EACH ROW
  EXECUTE FUNCTION update_user_onboarding_updated_at();

-- Function to initialize onboarding for new users
CREATE OR REPLACE FUNCTION initialize_user_onboarding()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_onboarding (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create onboarding record when user signs up
-- Note: This requires the trigger to be on auth.users which may need superuser
-- Alternative: Create onboarding record on first app access
