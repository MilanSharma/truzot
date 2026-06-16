-- 00012_fix_profile_rls.sql
-- Fix Privilege Escalation: Prevent users from updating their own role to 'admin'
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = 'user');
