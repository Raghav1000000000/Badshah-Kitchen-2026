/**
 * Order submission utilities
 * Prepares cart data for insertion into Supabase tables
 */

import { CartItem, OrderItemInsert } from "@/types/cart";

/**
 * Convert cart items to order_items format for database insertion
 * Only extracts menu_item_id and quantity as per schema requirements
 * 
 * @param cart - Current cart items with full menu data
 * @param orderId - UUID of the created order
 * @returns Array of order items ready for database insertion
 */
export function prepareOrderItems(cart: CartItem[], orderId: string): OrderItemInsert[] {
  return cart.map(item => ({
    order_id: orderId,
    menu_item_id: item.id, // Extract UUID from menu item
    quantity: item.quantity,
  }));
}

/**
 * Calculate total amount in cents for orders table
 * 
 * @param cart - Current cart items
 * @returns Total amount in cents
 */
export function calculateOrderTotal(cart: CartItem[]): number {
  return cart.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
}

/**
 * Validate cart before order submission
 * 
 * @param cart - Current cart items
 * @returns Object with validation result and optional error message
 */
export function validateOrderSubmission(cart: CartItem[]): {
  valid: boolean;
  error?: string;
} {
  if (cart.length === 0) {
    return { valid: false, error: "Cart is empty" };
  }

  // Verify all items have valid UUIDs
  for (const item of cart) {
    if (!item.id || typeof item.id !== 'string') {
      return { valid: false, error: "Invalid menu item ID" };
    }
    if (item.quantity <= 0) {
      return { valid: false, error: "Invalid quantity" };
    }
  }

  return { valid: true };
}
