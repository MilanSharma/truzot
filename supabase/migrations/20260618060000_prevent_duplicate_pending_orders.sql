-- Prevent multiple pending orders per user or email (guest checkout)
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_user_pending
ON public.orders (user_id)
WHERE status = 'pending';

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_email_pending
ON public.orders (email)
WHERE status = 'pending' AND user_id IS NULL;
