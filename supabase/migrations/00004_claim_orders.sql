-- Allow authenticated users to claim orders by setting user_id

CREATE POLICY "Users can claim unclaimed orders" ON orders
  FOR UPDATE USING (user_id IS NULL)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to see orders they claimed (for the brief window before claim)
CREATE POLICY "Users can view unclaimed orders by email" ON orders
  FOR SELECT USING (
    user_id IS NULL OR auth.uid() = user_id
  );
