-- Fix free_usage table: add user_id column and restrict RLS to service role
ALTER TABLE public.free_usage ADD COLUMN IF NOT EXISTS user_id UUID;

-- Migrate existing fingerprint-based entries to user_id (if we have a way to map)
-- For now, just add the column. The old fingerprint column can remain for backwards compat.

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Anyone can insert free_usage" ON public.free_usage;
DROP POLICY IF EXISTS "Anyone can read free_usage by fingerprint" ON public.free_usage;

-- Create service-role-only policies (server-side only access via supabaseAdmin)
CREATE POLICY "Service role can manage free_usage" ON public.free_usage
  FOR ALL USING (auth.role() = 'service_role');