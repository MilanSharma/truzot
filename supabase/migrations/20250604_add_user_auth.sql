-- Add user_id column to orders table for user accounts
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);

-- Update RLS policies for user-specific access
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
CREATE POLICY "Users can view their own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own headshots" ON headshots;
CREATE POLICY "Users can view their own headshots" ON headshots
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM orders WHERE orders.id = headshots.order_id AND orders.user_id = auth.uid()
  ));

-- Add category column to headshots table
ALTER TABLE headshots ADD COLUMN IF NOT EXISTS category TEXT;
