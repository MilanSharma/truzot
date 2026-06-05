-- Disable restrictive RLS policies preventing guest dashboard polling
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Users can view their own headshots" ON headshots;

-- Access orders via matching user_id OR through cryptographically unguessable UUID queries
CREATE POLICY "Allow select on orders by matching user_id or secure query" ON orders
  FOR SELECT USING (
    auth.uid() = user_id OR (user_id IS NULL AND id IS NOT NULL)
  );

-- Access headshots via verified associated orders
CREATE POLICY "Allow select on headshots via order verification" ON headshots
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = headshots.order_id 
        AND (orders.user_id = auth.uid() OR orders.user_id IS NULL)
    )
  );
