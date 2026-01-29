-- Migration: Add price_at_time to order_items and fix feedback table

-- 1. Add price_at_time column to order_items
-- This preserves historical prices even if menu prices change
ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS price_at_time INTEGER;

-- Add comment explaining the column
COMMENT ON COLUMN public.order_items.price_at_time IS 
  'Price in paise (cents) at the time the order was placed. Preserves historical pricing.';

-- 2. Ensure feedback table has correct structure
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster order lookups
CREATE INDEX IF NOT EXISTS idx_feedback_order_id ON public.feedback(order_id);

-- 3. Enable RLS on feedback table
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public insert feedback" ON public.feedback;
DROP POLICY IF EXISTS "Allow public read feedback" ON public.feedback;

-- Create policy to allow anyone to insert feedback
CREATE POLICY "Allow public insert feedback"
  ON public.feedback
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create policy to allow public to read feedback
CREATE POLICY "Allow public read feedback"
  ON public.feedback
  FOR SELECT
  TO public
  USING (true);

-- 4. Verify the changes
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'order_items' 
  AND column_name = 'price_at_time';

SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE tablename = 'feedback'
ORDER BY policyname;

-- Note: After running this migration:
-- 1. Update app/page.tsx to save price_at_time when creating orders
-- 2. Update app/bill/[orderId]/page.tsx to save feedback to feedback table
-- 3. Existing order_items without price_at_time will show NULL (handle in queries)
