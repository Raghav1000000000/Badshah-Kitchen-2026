-- Migration: Decouple order history from menu items
-- This allows menu items to be deleted while preserving order history

-- Step 1: Add columns to store menu item details at order time
ALTER TABLE order_items 
ADD COLUMN item_name TEXT,
ADD COLUMN item_price_at_order INTEGER;

-- Step 2: Populate new columns from existing menu_items data
UPDATE order_items oi
SET 
  item_name = mi.name,
  item_price_at_order = mi.price
FROM menu_items mi
WHERE oi.menu_item_id = mi.id;

-- Step 3: Make the new columns NOT NULL (after populating data)
ALTER TABLE order_items
ALTER COLUMN item_name SET NOT NULL,
ALTER COLUMN item_price_at_order SET NOT NULL;

-- Step 4: Drop the old foreign key constraint
ALTER TABLE order_items
DROP CONSTRAINT IF EXISTS order_items_menu_item_id_fkey;

-- Step 5: Make menu_item_id nullable (optional reference only)
ALTER TABLE order_items
ALTER COLUMN menu_item_id DROP NOT NULL;

-- Step 6: Add new foreign key with ON DELETE SET NULL
-- This means: when a menu item is deleted, set menu_item_id to NULL but keep the order
ALTER TABLE order_items
ADD CONSTRAINT order_items_menu_item_id_fkey 
FOREIGN KEY (menu_item_id) 
REFERENCES menu_items(id) 
ON DELETE SET NULL;

-- Step 7: Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_order_items_menu_item_id ON order_items(menu_item_id);

COMMENT ON COLUMN order_items.item_name IS 'Menu item name at time of order (preserved even if menu item is deleted)';
COMMENT ON COLUMN order_items.item_price_at_order IS 'Menu item price in paise at time of order (preserved even if menu item is deleted)';
COMMENT ON COLUMN order_items.menu_item_id IS 'Optional reference to current menu item (NULL if item was deleted)';
