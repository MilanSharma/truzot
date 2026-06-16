-- Add discount columns to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS original_amount_cents INTEGER,
ADD COLUMN IF NOT EXISTS discount_amount_cents INTEGER,
ADD COLUMN IF NOT EXISTS discount_code TEXT;