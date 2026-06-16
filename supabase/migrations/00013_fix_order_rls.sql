-- 00013_fix_order_rls.sql
-- Fix Mass PII Leak: Remove insecure policy that allowed viewing all unclaimed orders
-- Reverts to strict ownership policy defined in 00001_initial.sql
DROP POLICY IF EXISTS "Users can view unclaimed orders by email" ON orders;
