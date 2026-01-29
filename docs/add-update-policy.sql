-- Add UPDATE policy for orders table
-- This allows anyone to update order status (for kitchen staff)

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow update orders status" ON public.orders;

-- Create UPDATE policy to allow status updates
-- In production, you might want to restrict this further
CREATE POLICY "Allow update orders status"
  ON public.orders
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Verify the policy was created
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'orders'
ORDER BY policyname;
