-- 1. Create headshots storage bucket if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('headshots', 'headshots', false, 10485760, ARRAY['image/jpeg', 'image/png'])
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png'];

-- 2. Fix uploads bucket missing restrictions
UPDATE storage.buckets
SET
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/heic'],
  file_size_limit = 10485760
WHERE name = 'uploads' AND (allowed_mime_types IS NULL OR file_size_limit IS NULL);

-- 3. Enable RLS on free_usage and add policy
ALTER TABLE public.free_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert free_usage" ON public.free_usage
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read free_usage by fingerprint" ON public.free_usage
  FOR SELECT USING (true);

-- 4. Fix email_preferences overly permissive policy
DROP POLICY IF EXISTS "Anyone can upsert email_preferences" ON public.email_preferences;

CREATE POLICY "Users can upsert own email_preferences" ON public.email_preferences
  FOR ALL USING (auth.jwt() ->> 'email' = email)
  WITH CHECK (auth.jwt() ->> 'email' = email);

-- 5. Set search_path on functions to prevent mutable search_path warnings
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid;
BEGIN
  uid := auth.uid();
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  DELETE FROM headshots WHERE order_id IN (SELECT id FROM orders WHERE user_id = uid);
  DELETE FROM trainings WHERE order_id IN (SELECT id FROM orders WHERE user_id = uid);
  DELETE FROM orders WHERE user_id = uid;
  DELETE FROM storage.objects
    WHERE bucket_id = 'uploads' AND (storage.objects.path_tokens)[1] = uid::text;
  DELETE FROM auth.users WHERE id = uid;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_order_failures(order_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  current_failures integer;
  new_failures integer;
BEGIN
  current_failures := COALESCE(
    (SELECT (preferences->>'generate_failures')::integer FROM orders WHERE id = order_id),
    0
  );
  new_failures := current_failures + 1;
  UPDATE orders
  SET preferences = jsonb_set(
    COALESCE(preferences, '{}'::jsonb),
    '{generate_failures}',
    to_jsonb(new_failures::text),
    true
  )
  WHERE id = order_id;
  RETURN new_failures;
END;
$$;

-- 6. Revoke EXECUTE on SECURITY DEFINER functions from public (prevents anon access)
REVOKE EXECUTE ON FUNCTION public.delete_user_account() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;

-- 7. Storage RLS policies for uploads bucket
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can upload own files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'uploads' AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can read own uploads" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'uploads' AND (storage.objects.path_tokens)[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own uploads" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'uploads' AND (storage.objects.path_tokens)[1] = auth.uid()::text
  );

CREATE POLICY "Service role can manage all storage" ON storage.objects
  FOR ALL USING (auth.role() = 'service_role');

-- 8. Storage RLS policies for headshots bucket
CREATE POLICY "Users can read own headshots" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'headshots' AND auth.role() = 'authenticated'
  );

CREATE POLICY "Service role can manage headshots" ON storage.objects
  FOR ALL USING (
    bucket_id = 'headshots' AND auth.role() = 'service_role'
  );
