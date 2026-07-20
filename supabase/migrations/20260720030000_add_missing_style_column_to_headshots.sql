-- Root-cause fix: the headshots table was missing the 'style' column that
-- app/api/generate/route.ts has always written on every insert (and that
-- 00001_initial.sql originally defined). Because the "truzot" Supabase project's
-- headshots table was created without it, every headshot insert failed with
-- "column style does not exist", was swallowed as a non-fatal error, and no
-- generated images were ever persisted for any order on this project.
ALTER TABLE headshots ADD COLUMN IF NOT EXISTS style TEXT;

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_headshots_style_trgm ON headshots USING gin (style gin_trgm_ops);
