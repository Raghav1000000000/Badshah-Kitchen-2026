-- ============================================
-- Row Level Security Setup for Order Items Table
-- ============================================
-- This SQL secures the order_items table for a client-side app
-- without Supabase authentication.

-- Enable Row Level Security
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Policy 1: Allow INSERT for valid orders
-- ============================================
-- Allows inserting order items only if the order_id references an existing order
-- The application must ensure order_id belongs to the current session
CREATE POLICY "Allow insert order items for valid orders"
  ON public.order_items
  FOR INSERT
  TO public
  WITH CHECK (
    -- Verify order_id exists in orders table
    EXISTS (
      SELECT 1 
      FROM public.orders 
      WHERE orders.id = order_items.order_id
    )
    AND quantity > 0
  );

-- ============================================
-- Policy 2: Allow SELECT for all
-- ============================================
-- Without authentication, we cannot enforce session_id matching at RLS level
-- The application MUST join with orders and filter by session_id:
-- Example: 
--   supabase.from('order_items')
--     .select('*, orders!inner(session_id)')
--     .eq('orders.session_id', mySessionId)
CREATE POLICY "Allow read order items"
  ON public.order_items
  FOR SELECT
  TO public
  USING (true);

-- ============================================
-- UPDATE and DELETE: DENIED
-- ============================================
-- No UPDATE policy = UPDATE operations are completely blocked
-- No DELETE policy = DELETE operations are completely blocked

-- ============================================
-- IMPORTANT NOTES
-- ============================================
-- 1. Without Supabase Auth, RLS cannot access "current user" or session context
-- 2. Application must ALWAYS:
--    a) When inserting: Only insert order_items for orders owned by current session
--    b) When querying: Join with orders table and filter by session_id
-- 3. The INSERT policy validates FK relationship but cannot enforce session ownership
-- 4. For true security, implement Supabase Auth or custom authentication

-- ============================================
-- Example Query Pattern (Application Level)
-- ============================================
-- Always query order_items with session_id filter:
-- 
-- // Get order items for user's session
-- const { data, error } = await supabase
--   .from('order_items')
--   .select(`
--     *,
--     orders!inner(
--       id,
--       session_id,
--       status,
--       total_amount
--     )
--   `)
--   .eq('orders.session_id', sessionId);

-- ============================================
-- To apply these policies:
-- ============================================
-- 1. Copy this SQL
-- 2. Go to Supabase Dashboard > SQL Editor
-- 3. Paste and run the SQL
-- 4. Verify in Table Editor > order_items > RLS is enabled
