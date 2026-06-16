-- Waitlist stats
SELECT 'waitlist' as table_name, count(*) as total_count FROM waitlist;
SELECT count(*) as total_count, count(discount_code) as with_discount FROM waitlist;

-- Orders stats
SELECT status, count(*) as count FROM orders GROUP BY status;

-- Recent orders
SELECT id, email, plan, status, amount_cents, created_at FROM orders ORDER BY created_at DESC LIMIT 20;

-- Profiles (users)
SELECT count(*) as total_users FROM auth.users;

-- Waitlist with discount codes
SELECT email, discount_code, source, created_at FROM waitlist ORDER BY created_at DESC LIMIT 20;