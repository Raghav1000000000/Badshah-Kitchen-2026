-- Production-Level Authentication Setup for Kitchen Page
-- Run these commands in Supabase SQL Editor

-- ============================================================
-- STEP 1: Update RLS Policy for Authenticated Users
-- ============================================================

-- Drop the public UPDATE policy
DROP POLICY IF EXISTS "Allow update orders status" ON public.orders;

-- Create UPDATE policy for authenticated users only
CREATE POLICY "Allow authenticated kitchen staff to update orders"
  ON public.orders
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- STEP 2: Verify Policies
-- ============================================================

SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE tablename = 'orders'
ORDER BY policyname;

-- Expected output should show:
-- 1. "Allow public to insert orders" - INSERT - public
-- 2. "Allow read own orders" - SELECT - public  
-- 3. "Allow authenticated kitchen staff to update orders" - UPDATE - authenticated

-- ============================================================
-- STEP 3: Create Kitchen Staff User (Example)
-- ============================================================

-- Option A: Use Supabase Dashboard (RECOMMENDED)
-- Go to: Authentication → Users → Add User
-- Email: kitchen@badshahskitchen.com
-- Password: (generate secure password)
-- Confirm email: Yes (auto-confirm)

-- Option B: Using SQL (if you have service role access)
-- Note: This is for reference only, use Dashboard for production
/*
-- This would require service role key and admin API access
-- Better to use Supabase Dashboard UI for creating users
*/

-- ============================================================
-- STEP 4: Optional - Add User Metadata
-- ============================================================

-- You can add custom metadata to identify kitchen staff
-- This is done through the Supabase Dashboard:
-- Authentication → Users → Select User → User Metadata
-- Add: { "role": "kitchen_staff", "department": "kitchen" }

-- ============================================================
-- STEP 5: Optional - Restrict Updates to Specific Roles
-- ============================================================

-- If you want more granular control, update the policy:
/*
DROP POLICY IF EXISTS "Allow authenticated kitchen staff to update orders" ON public.orders;

CREATE POLICY "Allow kitchen staff to update orders"
  ON public.orders
  FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'kitchen_staff'
  )
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'kitchen_staff'
  );
*/

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================

-- Check if RLS is enabled on orders table
SELECT 
  tablename,
  rowsecurity 
FROM pg_tables 
WHERE tablename = 'orders';
-- Should return: rowsecurity = true

-- List all policies on orders table
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'orders';

-- ============================================================
-- SECURITY NOTES
-- ============================================================

/*
✅ Production Best Practices Implemented:

1. Authentication Required
   - Only authenticated users can update orders
   - Anonymous users can still place orders (INSERT)
   - Anonymous users can view their own orders (SELECT)

2. Separate Login Page
   - /kitchen/login for staff authentication
   - Secure password-based authentication via Supabase Auth
   - Auto-redirect if not authenticated

3. Session Management
   - JWT-based authentication
   - Automatic session refresh
   - Secure logout functionality

4. Protection Against:
   - Unauthorized order modifications
   - Direct API access without authentication
   - CSRF attacks (Supabase handles this)
   - Session hijacking (secure cookies)

5. Future Enhancements:
   - Add role-based access control (RBAC)
   - Implement audit logging for order changes
   - Add 2FA for kitchen staff accounts
   - Set up email notifications for failed login attempts
*/
