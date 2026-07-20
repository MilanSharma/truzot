-- Reconstructed to match what's already applied on the remote project (recorded in
-- supabase_migrations.schema_migrations but never committed locally). See commit
-- c235298 "Fix generation stuck after 10 images - database schema and QStash region".
ALTER TABLE headshots ADD COLUMN IF NOT EXISTS category TEXT;
