-- Allow zip uploads for photo packages, increase limit to 50MB
UPDATE storage.buckets
SET allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/heic', 'application/zip'],
    file_size_limit = 52428800
WHERE name = 'uploads';
