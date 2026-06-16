-- Add used and used_at columns to waitlist table to prevent race conditions
ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS used BOOLEAN DEFAULT false;
ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS used_at TIMESTAMPTZ;
