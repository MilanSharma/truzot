-- Team brand style ("locked style" for the team) is per-owner, and there's no
-- separate teams table — team_owner_id on team_members already stands in for
-- team identity, so this lives on the owner's own profile row.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS brand_style TEXT;
