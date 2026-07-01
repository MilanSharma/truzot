-- Enable pg_trgm extension for trigram matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Optimize Dashboard loading (filtering by user and status)
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders(user_id, status);

-- Optimize Gallery loading (filtering by order and category)
CREATE INDEX IF NOT EXISTS idx_headshots_order_category ON headshots(order_id, category);

-- Optimize style search (GIST index for partial text matching)
CREATE INDEX IF NOT EXISTS idx_headshots_style_trgm ON headshots USING gin (style gin_trgm_ops);
