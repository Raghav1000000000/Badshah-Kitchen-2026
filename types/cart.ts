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
 * Extracted from CartItem when placing an order
 */
export type OrderItemInsert = {
  order_id: string; // Set when creating the order
  menu_item_id: string; // From CartItem.id
  quantity: number; // From CartItem.quantity
  price_at_time: number; // Price in paise at time of order (preserves historical pricing)
};
