-- Get Menu Item IDs for K6 Testing
-- Run this query in your Supabase SQL Editor
-- Copy the IDs and paste them into order-api-test.js

SELECT 
  id,
  name,
  category,
  price
FROM menu_items 
WHERE is_available = true
ORDER BY category, name
LIMIT 10;

-- Expected output format:
-- Copy the 'id' column values and use them in order-api-test.js like this:
--
-- const MENU_ITEM_IDS = [
--   'uuid-from-row-1',
--   'uuid-from-row-2',
--   'uuid-from-row-3',
--   // ... etc
-- ];
