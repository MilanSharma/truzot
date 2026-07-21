-- Generated headshots were previously served straight from fal.media, whose
-- files expire after ~7 days — breaking the 30-day gallery/download promise.
-- This bucket holds our own copy of every delivered image. Public read (paths
-- are unguessable UUIDs, same model as fal.media URLs); writes go through the
-- service role only. The cleanup cron purges each order's folder at 30 days.
INSERT INTO storage.buckets (id, name, public)
VALUES ('headshots', 'headshots', true)
ON CONFLICT (id) DO NOTHING;
