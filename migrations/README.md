# Database Migrations

## Running Migrations

These SQL migration files must be executed in Supabase SQL Editor in order:

1. **01_schema.sql** - Initial database schema
2. **02_rls_policies.sql** - Row Level Security policies  
3. **03_enable_realtime.sql** - ⚠️ **REQUIRED** - Enable Realtime for live updates
4. **04_decouple_orders_from_menu.sql** - ⚠️ **REQUIRED** - Decouple order history from menu items

## Migration 03: Enable Realtime

### Problem Solved
Without this migration, changes don't appear in real-time:
- ❌ Kitchen doesn't see new orders immediately
- ❌ Customers don't see menu updates without page refresh

### What It Does
Enables Supabase Realtime on:
- `orders` table - Kitchen display gets instant order notifications
- `menu_items` table - Customer menu auto-refreshes when admin makes changes

### How to Run
**Option 1: Supabase Dashboard (Recommended)**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor**
4. Copy contents of `03_enable_realtime.sql`
5. Paste and click **Run**

**Option 2: Alternative - Enable via Dashboard**
1. Go to Database → Replication
2. Enable Realtime for `orders` table
3. Enable Realtime for `menu_items` table

### Verification
```sql
-- Check if realtime is enabled
SELECT tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';
-- Should return: orders, menu_items
```

## Migration 04: Decouple Orders from Menu Items

### Problem Solved
Previously, menu items could not be deleted if they had been ordered (foreign key constraint error). This migration allows:
- ✅ Delete any menu item anytime
- ✅ Order history is preserved with item names and prices
- ✅ Orders show what was ordered even if the menu item no longer exists

### What It Does
1. Adds `item_name` and `item_price_at_order` columns to `order_items` table
2. Populates these columns from existing `menu_items` data
3. Changes foreign key constraint to `ON DELETE SET NULL`
4. Makes `menu_item_id` nullable (becomes an optional reference)

### How to Run

**Option 1: Supabase Dashboard (Recommended)**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor**
4. Click **New Query**
5. Copy contents of `04_decouple_orders_from_menu.sql`
6. Paste and click **Run**

**Option 2: Supabase CLI**
```bash
supabase db push --db-url "your-connection-string"
```

### After Running Migration

Your application code has already been updated to:
- Store `item_name` and `item_price_at_order` when creating orders
- Display order history using stored names (no JOIN to menu_items)
- Allow menu item deletion without errors

### Verification

After running the migration, test:
```sql
-- Check the new columns exist and are populated
SELECT id, item_name, item_price_at_order, menu_item_id 
FROM order_items 
LIMIT 5;

-- Try deleting a menu item that has orders
DELETE FROM menu_items WHERE id = 'some-uuid-here';
-- Should succeed! Order history will still show the item name.
```

### Rollback (if needed)

If you need to revert this migration:
```sql
-- WARNING: This will make menu items undeletable again if they have orders

-- Remove the new columns
ALTER TABLE order_items DROP COLUMN item_name;
ALTER TABLE order_items DROP COLUMN item_price_at_order;

-- Restore NOT NULL constraint
ALTER TABLE order_items ALTER COLUMN menu_item_id SET NOT NULL;

-- Restore original foreign key
ALTER TABLE order_items DROP CONSTRAINT order_items_menu_item_id_fkey;
ALTER TABLE order_items ADD CONSTRAINT order_items_menu_item_id_fkey 
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id);
```

## Migration Status

- ✅ 01_schema.sql - Core database structure
- ✅ 02_rls_policies.sql - Security policies
- ⏳ 03_enable_realtime.sql - **PENDING** (run this to enable live updates!)
- ⏳ 04_decouple_orders_from_menu.sql - **PENDING** (run this to allow menu item deletion)

## Important Notes

**You must run migration 03 (Enable Realtime) for the following features to work:**
- Kitchen display auto-refresh when new orders arrive
- Customer menu auto-refresh when admin edits items
- Real-time order status updates

**Run migration 04 to:**
- Delete menu items freely (even if they've been ordered)
- Preserve complete order history with item names and prices
