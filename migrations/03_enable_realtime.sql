-- Enable Realtime for live updates on tables
-- This allows the app to receive instant notifications when data changes

-- Enable realtime on orders table (for kitchen display)
-- Skip if already added
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE orders;
  END IF;
END $$;

-- Enable realtime on menu_items table (for customer menu auto-refresh)
-- Skip if already added
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'menu_items'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE menu_items;
  END IF;
END $$;

-- Verify realtime is enabled
SELECT tablename, schemaname
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;

COMMENT ON TABLE orders IS 'Realtime enabled - Kitchen display receives instant order updates';
COMMENT ON TABLE menu_items IS 'Realtime enabled - Customer menu auto-refreshes when admin makes changes';
