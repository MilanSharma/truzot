-- Enable extension for fast text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Index for the Dashboard "Project Library" to find active/failed/pending shoots instantly
CREATE INDEX IF NOT EXISTS idx_orders_user_status_created ON orders (user_id, status, created_at DESC);

-- Index for the Gallery tabs (Corporate, Casual, etc) to filter thousands of images in < 1ms
CREATE INDEX IF NOT EXISTS idx_headshots_order_category_created ON headshots (order_id, category, created_at DESC);

-- Fast style search for the search box
CREATE INDEX IF NOT EXISTS idx_headshots_style_search ON headshots USING gin (style gin_trgm_ops);

-- Performance tuning for the profile lookup
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles (id) WHERE role = 'admin';
