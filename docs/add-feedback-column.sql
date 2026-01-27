-- Add feedback_given column to orders table
-- This tracks whether the customer has submitted feedback for this order

ALTER TABLE orders 
ADD COLUMN feedback_given BOOLEAN DEFAULT FALSE;

-- Add comment explaining the column
COMMENT ON COLUMN orders.feedback_given IS 'Tracks if customer has submitted feedback for this order';

-- Update existing orders to NULL (unknown feedback status)
-- You can also set to FALSE if you want to assume no feedback was given
UPDATE orders SET feedback_given = FALSE WHERE feedback_given IS NULL;
