/**
 * Type definitions for cart functionality
 * Based on Supabase schema
 */

export type MenuItem = {
  id: string; // UUID from database (menu_item_id for order_items)
  name: string;
  price: number; // Price in cents (integer in DB)
  category: string | null;
  is_available?: boolean;
  is_special?: boolean;
  created_at?: string;
};

/**
 * CartItem stores full menu item data for display purposes
 * When inserting to order_items table, only id and quantity are used
 */
export type CartItem = MenuItem & { 
  quantity: number;
};

/**
 * Structure for inserting into order_items table
 * Stores menu item details to preserve order history even if menu item is deleted
 */
export type OrderItemInsert = {
  order_id: string; // Set when creating the order
  menu_item_id: string; // From CartItem.id (reference to menu_items)
  quantity: number; // From CartItem.quantity
  price_at_time: number; // Price in paise at time of order (preserves historical pricing)
  item_name: string; // Menu item name at order time (preserved even if item deleted)
  item_price_at_order: number; // Price in paise (same as price_at_time, for order history)
};
