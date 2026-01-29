-- Add order_number column to orders table
-- This creates a sequential order number for each order

-- Step 1: Add the order_number column (nullable initially)
ALTER TABLE orders 
ADD COLUMN order_number SERIAL;

-- Step 2: Create a sequence for order numbers if not exists
CREATE SEQUENCE IF NOT EXISTS orders_order_number_seq;

-- Step 3: Set the sequence to start from the next available number
SELECT setval('orders_order_number_seq', COALESCE((SELECT MAX(order_number) FROM orders), 0) + 1, false);

-- Step 4: Assign order numbers to existing orders based on created_at
WITH numbered_orders AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY created_at ASC) as new_order_number
  FROM orders
  WHERE order_number IS NULL
)
UPDATE orders
SET order_number = numbered_orders.new_order_number
FROM numbered_orders
WHERE orders.id = numbered_orders.id;

-- Step 5: Make order_number NOT NULL and set default for future inserts
ALTER TABLE orders 
ALTER COLUMN order_number SET NOT NULL,
ALTER COLUMN order_number SET DEFAULT nextval('orders_order_number_seq');

-- Step 6: Verify the update
SELECT id, order_number, status, created_at 
FROM orders 
ORDER BY order_number ASC;
