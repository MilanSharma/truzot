-- Add discount_code column to waitlist table
ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS discount_code TEXT;

-- Create index for discount code lookups
CREATE INDEX IF NOT EXISTS idx_waitlist_discount_code ON waitlist(discount_code);