-- Add UPDATE, INSERT, and DELETE policies for menu_items table
-- This allows admin panel to manage menu items

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public insert menu_items" ON public.menu_items;
DROP POLICY IF EXISTS "Allow public update menu_items" ON public.menu_items;
DROP POLICY IF EXISTS "Allow public delete menu_items" ON public.menu_items;

-- Create INSERT policy for adding new menu items
CREATE POLICY "Allow public insert menu_items"
  ON public.menu_items
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create UPDATE policy for editing menu items
CREATE POLICY "Allow public update menu_items"
  ON public.menu_items
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Create DELETE policy for removing menu items
CREATE POLICY "Allow public delete menu_items"
  ON public.menu_items
  FOR DELETE
  TO public
  USING (true);

-- Verify the policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'menu_items'
ORDER BY policyname;

-- Note: In production, you should:
-- 1. Create proper authentication for admin users
-- 2. Restrict these policies to authenticated admin users only
-- 3. Add audit logging for menu changes
-- 4. Consider using Supabase Auth with role-based access control
