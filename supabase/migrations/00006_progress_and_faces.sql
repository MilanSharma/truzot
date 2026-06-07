-- Add progress column to trainings table
ALTER TABLE trainings ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0;

-- Free usage tracking
CREATE TABLE IF NOT EXISTS free_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fingerprint TEXT NOT NULL UNIQUE,
  remaining SMALLINT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
