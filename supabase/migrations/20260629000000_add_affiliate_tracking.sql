-- Affiliate tracking for PromoteKit integration
CREATE TABLE IF NOT EXISTS affiliate_referrals (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
affiliate_code TEXT NOT NULL,
order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
commission_cents INTEGER NOT NULL DEFAULT 0,
commission_rate DECIMAL(5,2) NOT NULL DEFAULT 40.00,
status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
paid_at TIMESTAMPTZ,
created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE affiliate_referrals ENABLE ROW LEVEL SECURITY;
-- Service role can manage all referrals
CREATE POLICY "Service role can manage affiliate_referrals" ON affiliate_referrals
FOR ALL USING (auth.role() = 'service_role');
-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_code ON affiliate_referrals(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_order ON affiliate_referrals(order_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_status ON affiliate_referrals(status);
-- Add affiliate_code to orders for tracking
ALTER TABLE orders ADD COLUMN IF NOT EXISTS affiliate_code TEXT;
CREATE INDEX IF NOT EXISTS idx_orders_affiliate_code ON orders(affiliate_code);
