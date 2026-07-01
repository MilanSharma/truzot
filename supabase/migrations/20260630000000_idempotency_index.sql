-- Add unique index for idempotency keys to prevent TOCTOU race conditions
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_idempotency_key 
ON public.orders ((preferences->>'idempotency_key')) 
WHERE (preferences->>'idempotency_key') IS NOT NULL;
