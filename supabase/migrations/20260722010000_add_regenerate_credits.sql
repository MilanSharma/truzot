-- Regenerating a headshot spends real fal.ai credits, so it now needs to be
-- paid for. Customers pre-buy a batch of regenerate credits ($1 each) via
-- Stripe Checkout against their existing (already-completed) order, then
-- each regenerate click spends one credit instantly with no further payment
-- friction. Balance lives on the order row it was purchased for.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS regenerate_credits INTEGER NOT NULL DEFAULT 0;

-- Atomic top-up, called from the Stripe webhook after a credits purchase
-- completes. A single UPDATE is safe under concurrent webhook deliveries.
CREATE OR REPLACE FUNCTION increment_regenerate_credits(p_order_id UUID, p_amount INTEGER)
RETURNS INTEGER
LANGUAGE sql
AS $$
  UPDATE orders SET regenerate_credits = regenerate_credits + p_amount
  WHERE id = p_order_id
  RETURNING regenerate_credits;
$$;

-- Atomic conditional spend: only decrements (and returns the new balance) if
-- a credit is actually available, so two concurrent regenerate clicks can't
-- both succeed off a balance of 1. Returns no row (NULL in the client) when
-- the balance is already 0.
CREATE OR REPLACE FUNCTION spend_regenerate_credit(p_order_id UUID)
RETURNS INTEGER
LANGUAGE sql
AS $$
  UPDATE orders SET regenerate_credits = regenerate_credits - 1
  WHERE id = p_order_id AND regenerate_credits > 0
  RETURNING regenerate_credits;
$$;
