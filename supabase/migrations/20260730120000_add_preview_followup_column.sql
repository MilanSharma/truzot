-- Tracks whether a free-preview lead has received the automated paid-product
-- follow-up email, so the cron job sends it exactly once per lead.
ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS preview_followup_sent_at TIMESTAMPTZ;
