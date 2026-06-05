-- Add model_id to trainings (used by fal webhook, generate, retry routes)
ALTER TABLE trainings ADD COLUMN IF NOT EXISTS model_id TEXT;

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
CREATE POLICY "Anyone can upsert email_preferences" ON email_preferences
  FOR ALL USING (true);

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
