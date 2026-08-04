-- Tracks additional lead-nurture touches beyond the original single
-- preview-followup email, so each new cron only ever sends once per lead.
alter table waitlist add column if not exists second_touch_sent_at timestamptz;
alter table waitlist add column if not exists cold_nudge_sent_at timestamptz;
