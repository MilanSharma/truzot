-- Add model_id to trainings (used by fal webhook, generate, retry routes)
ALTER TABLE trainings ADD COLUMN IF NOT EXISTS model_id TEXT;

-- Create profiles table for admin roles and user settings
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Service role can manage all profiles" ON profiles
  FOR ALL USING (auth.role() = 'service_role');

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Create download_tokens table for short-lived download authorization
CREATE TABLE IF NOT EXISTS download_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '5 minutes',
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE download_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create own download tokens" ON download_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage all download tokens" ON download_tokens
  FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_download_tokens_user_id ON download_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_download_tokens_expires_at ON download_tokens(expires_at);

-- Create headshot_flags table for user feedback / regen requests
CREATE TABLE IF NOT EXISTS headshot_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  reason TEXT NOT NULL DEFAULT 'regenerate',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE headshot_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own flags" ON headshot_flags
  FOR ALL USING (order_id IN (SELECT id FROM orders WHERE user_id = auth.uid()));
CREATE POLICY "Service role can manage all flags" ON headshot_flags
  FOR ALL USING (auth.role() = 'service_role');
CREATE INDEX IF NOT EXISTS idx_headshot_flags_order_id ON headshot_flags(order_id);

-- Create webhook_events table (used by webhook-store.ts)
CREATE TABLE IF NOT EXISTS webhook_events (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  source TEXT NOT NULL,
  event_id TEXT,
  type TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'received',
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage webhook_events" ON webhook_events
  FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_webhook_events_source ON webhook_events(source);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON webhook_events(created_at);

-- Create email_preferences table (used by unsubscribe API)
CREATE TABLE IF NOT EXISTS email_preferences (
  email TEXT PRIMARY KEY,
  unsubscribed BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE email_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage email_preferences" ON email_preferences
  FOR ALL USING (auth.role() = 'service_role');

-- Create delete_user_account RPC function (called by account settings page)
CREATE OR REPLACE FUNCTION delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
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
