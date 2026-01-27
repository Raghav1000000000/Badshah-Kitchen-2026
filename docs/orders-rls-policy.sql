-- ============================================
-- Row Level Security Setup for Orders Table
-- ============================================
-- This SQL secures the orders table for a client-side app
-- without Supabase authentication.

-- Enable Row Level Security
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Policy 1: Allow INSERT for anyone
-- ============================================
-- Allows any client to insert orders as long as session_id is provided
-- The session_id must be non-null and non-empty
CREATE POLICY "Allow public to insert orders"
  ON public.orders
  FOR INSERT
  TO public
  WITH CHECK (
    session_id IS NOT NULL 
    AND session_id != ''
  );

-- ============================================
-- Policy 2: Allow SELECT for all
-- ============================================
-- Without authentication, we cannot enforce session_id matching at RLS level
-- The application MUST filter queries with: WHERE session_id = ?
-- This policy allows reads but relies on application-level filtering
CREATE POLICY "Allow read own orders"
  ON public.orders
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
-- 1. Without Supabase Auth, RLS cannot access "current user" context
-- 2. Application must ALWAYS filter SELECT queries by session_id:
--    Example: supabase.from('orders').select('*').eq('session_id', mySessionId)
-- 3. Never trust client to respect filtering - consider adding auth in production
-- 4. For true security, implement Supabase Auth or custom authentication

-- ============================================
-- To apply these policies:
-- ============================================
-- 1. Copy this SQL
-- 2. Go to Supabase Dashboard > SQL Editor
-- 3. Paste and run the SQL
-- 4. Verify in Table Editor > orders > RLS is enabled
