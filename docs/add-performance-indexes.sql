-- Performance Optimization: Database Indexes
-- Run these statements in your Supabase SQL editor

-- 1. Index on session_id for faster customer order lookups
-- This speeds up queries like: WHERE session_id = 'xxx'
CREATE INDEX IF NOT EXISTS idx_orders_session_id 
ON orders(session_id);

-- 2. Index on status for kitchen filtering
-- This speeds up queries like: WHERE status != 'COMPLETED'
CREATE INDEX IF NOT EXISTS idx_orders_status 
ON orders(status) 
WHERE status != 'COMPLETED';

-- 3. Index on created_at for sorting
-- This speeds up: ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_orders_created_at 
ON orders(created_at DESC);

-- 4. Composite index for common kitchen query
-- This optimizes: WHERE status != 'COMPLETED' ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_orders_status_created 
ON orders(status, created_at DESC);

-- 5. Index on order_items for faster order detail queries
CREATE INDEX IF NOT EXISTS idx_order_items_order_id 
ON order_items(order_id);

-- 6. Add updated_at auto-update trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to orders table
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at 
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Verify indexes were created
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('orders', 'order_items')
ORDER BY tablename, indexname;
