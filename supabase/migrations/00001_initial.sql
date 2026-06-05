-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT,
  plan TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','training','generating','completed','failed')),
  zip_url TEXT,
  stripe_payment_intent TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create headshots table
CREATE TABLE IF NOT EXISTS headshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  style TEXT,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create trainings table
CREATE TABLE IF NOT EXISTS trainings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE headshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainings ENABLE ROW LEVEL SECURITY;

-- Orders policies
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role can manage all orders" ON orders
  FOR ALL USING (auth.role() = 'service_role');

-- Headshots policies
CREATE POLICY "Users can view own headshots" ON headshots
  FOR SELECT USING (order_id IN (SELECT id FROM orders WHERE user_id = auth.uid()));
CREATE POLICY "Service role can manage all headshots" ON headshots
  FOR ALL USING (auth.role() = 'service_role');

-- Trainings policies
CREATE POLICY "Users can view own trainings" ON trainings
  FOR SELECT USING (order_id IN (SELECT id FROM orders WHERE user_id = auth.uid()));
CREATE POLICY "Service role can manage all trainings" ON trainings
  FOR ALL USING (auth.role() = 'service_role');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_headshots_order_id ON headshots(order_id);
CREATE INDEX IF NOT EXISTS idx_trainings_order_id ON trainings(order_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE headshots;
