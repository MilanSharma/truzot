-- Add columns missing from 00002's team_members definition
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS member_user_id UUID REFERENCES auth.users(id);
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS joined_at TIMESTAMPTZ;
ALTER TABLE team_members ALTER COLUMN team_owner_id SET NOT NULL;
ALTER TABLE team_members ADD CONSTRAINT team_members_role_check CHECK (role IN ('admin', 'member'));
ALTER TABLE team_members ADD CONSTRAINT team_members_status_check CHECK (status IN ('pending', 'accepted', 'declined'));

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team owner can manage members" ON team_members USING (auth.uid() = team_owner_id);
