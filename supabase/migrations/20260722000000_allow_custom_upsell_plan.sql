-- orders_plan_check never included 'custom_upsell', even though the
-- custom-pack upsell flow (app/api/upsell-custom, stripe webhook, fal-client)
-- has always inserted orders with plan = 'custom_upsell'. Every custom-pack
-- checkout attempt has been failing at the insert with "Failed to create
-- order" as a result.
ALTER TABLE orders DROP CONSTRAINT orders_plan_check;
ALTER TABLE orders ADD CONSTRAINT orders_plan_check
  CHECK (plan = ANY (ARRAY['basic'::text, 'pro'::text, 'executive'::text, 'custom_upsell'::text]));
