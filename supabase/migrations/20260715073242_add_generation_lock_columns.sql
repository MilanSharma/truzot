-- Reconstructed to match what's already applied on the remote project (recorded in
-- supabase_migrations.schema_migrations but never committed locally). Used by
-- app/api/generate/route.ts claimOrder()/releaseLock() to prevent concurrent batch runs.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS batch_lock_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS batch_lock_token TEXT;
