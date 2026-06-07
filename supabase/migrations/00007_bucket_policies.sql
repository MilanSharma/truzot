-- Restrict uploads bucket to image MIME types and 10MB max file size
UPDATE storage.buckets
SET allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/heic'],
    file_size_limit = 10485760
WHERE name = 'uploads';

-- Restrict headshots bucket similarly
UPDATE storage.buckets
SET allowed_mime_types = ARRAY['image/jpeg', 'image/png'],
    file_size_limit = 10485760
WHERE name = 'headshots';
