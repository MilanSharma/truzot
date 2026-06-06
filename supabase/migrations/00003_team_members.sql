
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  member_email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team owner can manage members" ON team_members USING (auth.uid() = team_owner_id);
