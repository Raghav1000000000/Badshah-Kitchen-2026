-- Clear existing menu and add fresh items for Badshah's Kitchen
-- Run this to reset the menu with new items

-- Step 1: Clear all existing menu items
TRUNCATE TABLE menu_items CASCADE;

-- Step 2: Insert fresh menu items
-- Prices are in paise (100 paise = ₹1)

-- STARTERS
INSERT INTO menu_items (name, category, price, is_available, is_special) VALUES
('Samosa (2 pcs)', 'Starters', 4000, true, false),
('Paneer Tikka', 'Starters', 18000, true, true),
('Chicken Tikka', 'Starters', 22000, true, true),
('Spring Roll (4 pcs)', 'Starters', 12000, true, false),
('Veg Pakora', 'Starters', 8000, true, false),
('Chicken Wings (6 pcs)', 'Starters', 20000, true, false),
('Hara Bhara Kabab', 'Starters', 15000, true, false);

-- MAIN COURSE
INSERT INTO menu_items (name, category, price, is_available, is_special) VALUES
('Paneer Butter Masala', 'Main Course', 22000, true, true),
('Butter Chicken', 'Main Course', 28000, true, true),
('Chicken Curry', 'Main Course', 24000, true, false),
('Dal Makhani', 'Main Course', 18000, true, false),
('Palak Paneer', 'Main Course', 20000, true, false),
('Kadai Chicken', 'Main Course', 26000, true, false),
('Egg Curry', 'Main Course', 16000, true, false),
('Mushroom Masala', 'Main Course', 19000, true, false),
('Fish Curry', 'Main Course', 28000, true, false);

-- BREADS
INSERT INTO menu_items (name, category, price, is_available, is_special) VALUES
('Butter Naan', 'Breads', 4000, true, false),
('Garlic Naan', 'Breads', 5000, true, false),
('Tandoori Roti', 'Breads', 3000, true, false),
('Laccha Paratha', 'Breads', 5000, true, false),
('Stuffed Kulcha', 'Breads', 6000, true, false),
('Plain Paratha', 'Breads', 4000, true, false);

-- RICE
INSERT INTO menu_items (name, category, price, is_available, is_special) VALUES
('Veg Biryani', 'Rice', 18000, true, false),
('Chicken Biryani', 'Rice', 24000, true, true),
('Egg Biryani', 'Rice', 16000, true, false),
('Jeera Rice', 'Rice', 12000, true, false),
('Plain Rice', 'Rice', 8000, true, false),
('Veg Pulao', 'Rice', 15000, true, false);

-- DESSERTS
INSERT INTO menu_items (name, category, price, is_available, is_special) VALUES
('Gulab Jamun (2 pcs)', 'Desserts', 6000, true, false),
('Rasmalai (2 pcs)', 'Desserts', 8000, true, true),
('Gajar Halwa', 'Desserts', 10000, true, false),
('Kulfi', 'Desserts', 7000, true, false),
('Ice Cream', 'Desserts', 5000, true, false);

-- BEVERAGES
INSERT INTO menu_items (name, category, price, is_available, is_special) VALUES
('Masala Chai', 'Beverages', 3000, true, false),
('Cold Coffee', 'Beverages', 8000, true, false),
('Fresh Lime Soda', 'Beverages', 5000, true, false),
('Mango Lassi', 'Beverages', 7000, true, false),
('Sweet Lassi', 'Beverages', 6000, true, false),
('Buttermilk', 'Beverages', 4000, true, false),
('Soft Drink', 'Beverages', 4000, true, false),
('Mineral Water', 'Beverages', 2000, true, false);

-- Verify the data
SELECT 
  category,
  COUNT(*) as item_count,
  MIN(price/100) as min_price_rupees,
  MAX(price/100) as max_price_rupees
FROM menu_items
GROUP BY category
ORDER BY category;

-- Show all items
SELECT 
  category,
  name,
  price/100 as price_rupees,
  CASE WHEN is_special THEN '⭐' ELSE '' END as special
FROM menu_items
ORDER BY category, name;
