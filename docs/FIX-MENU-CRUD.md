# Quick Fix: Menu Items CRUD Not Working

## Problem
Admin panel shows "Failed to update menu item" with empty error object `{}`.

## Root Cause
Supabase Row Level Security (RLS) policies are blocking INSERT, UPDATE, and DELETE operations on the `menu_items` table.

## Solution
Run the SQL script to add necessary RLS policies.

### Step 1: Open Supabase SQL Editor
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor" in the left sidebar
4. Click "New Query"

### Step 2: Run the SQL Script
Copy and paste the contents of `docs/add-menu-policies.sql` and execute it.

**Quick Copy:**
```sql
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
```

### Step 3: Verify Policies
Run this query to confirm policies were created:
```sql
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE tablename = 'menu_items'
ORDER BY policyname;
```

You should see 3 policies:
- `Allow public insert menu_items` (INSERT)
- `Allow public update menu_items` (UPDATE)
- `Allow public delete menu_items` (DELETE)

### Step 4: Test Admin Panel
1. Go back to http://localhost:3001/admin
2. Try to edit a menu item
3. Try to add a new menu item
4. Try to delete a menu item

All operations should now work successfully!

## Also Need to Run
If you haven't already, also run the UPDATE policy for orders table:
- `docs/add-update-policy.sql` - For kitchen page status updates

## Security Note
⚠️ These policies allow public access for development/testing. In production:
- Implement proper authentication
- Restrict policies to authenticated admin users only
- Add audit logging for changes
- Use Supabase Auth with role-based access control
