-- A "headshots" bucket already existed (created 2026-06-08, private, for an
-- earlier unrelated purpose) before this session's migration tried to create
-- one. That migration used ON CONFLICT (id) DO NOTHING, so it silently no-oped
-- against the pre-existing private bucket. Uploads succeeded (server-side
-- writes bypass RLS) but every public URL 404'd with "Bucket not found" --
-- Supabase's deliberate response for public-URL requests against a private
-- bucket. Paths are unguessable ({orderId}/{uuid}.jpg), so public read is safe
-- — same trust model as the fal.media URLs this bucket replaces.
UPDATE storage.buckets SET public = true WHERE id = 'headshots';
