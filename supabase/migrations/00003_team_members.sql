-- Add columns missing from 00002's team_members definition
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS member_user_id UUID REFERENCES auth.users(id);
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS joined_at TIMESTAMPTZ;
ALTER TABLE team_members ALTER COLUMN team_owner_id SET NOT NULL;

-- Add constraints only if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'team_members_role_check') THEN
        ALTER TABLE team_members ADD CONSTRAINT team_members_role_check CHECK (role IN ('admin', 'member'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'team_members_status_check') THEN
        ALTER TABLE team_members ADD CONSTRAINT team_members_status_check CHECK (status IN ('pending', 'accepted', 'declined'));
    END IF;
END $$;

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Create policy only if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Team owner can manage members' AND tablename = 'team_members') THEN
        CREATE POLICY "Team owner can manage members" ON team_members USING (auth.uid() = team_owner_id);
    END IF;
END $$;
