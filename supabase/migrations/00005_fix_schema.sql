
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending','paid','training','generating','completed','failed','refunded'));

ALTER TABLE headshots ADD CONSTRAINT headshots_order_image_unique
  UNIQUE (order_id, image_url);

INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', false)
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION increment_order_failures(order_id UUID)
RETURNS integer
LANGUAGE plpgsql
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
