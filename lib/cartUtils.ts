/**
 * Cart Utilities
 * 
 * IMPORTANT: Cart logic is intentionally client-side only
 * - No database persistence
 * - Lives only in React component state
 * - Cleared after each order placement
 * - Resets on page refresh
 * 
 * Cart Structure:
 * - Stores full MenuItem data for display (name, price, category)
 * - When placing order, only menu_item_id and quantity are inserted to order_items table
 * - Price is calculated from cart and stored in orders.total_amount
 * 
 * This is a simple ordering demo. For production, consider:
 * - localStorage for cart persistence across page refreshes
 * - API endpoints for order submission
 * - Payment gateway integration
 */

import { CartItem } from "@/types/cart";

/**
 * Calculate total price of cart items
 * Note: Prices are stored in cents in the database
 */
export function calculateCartTotal(cart: CartItem[]): number {
  return cart.reduce((total, item) => total + (item.price / 100) * item.quantity, 0);
}

/**
 * Calculate total number of items in cart
 */
export function calculateCartItemCount(cart: CartItem[]): number {
  return cart.reduce((total, item) => total + item.quantity, 0);
}

/**
 * Format cart for order summary
 */
export function formatOrderSummary(cart: CartItem[], sessionId: string): string {
  const total = calculateCartTotal(cart);
  const itemCount = calculateCartItemCount(cart);
  
  const itemsList = cart
    .map(item => `  ${item.quantity}x ${item.name} - ₹${((item.price / 100) * item.quantity).toFixed(2)}`)
    .join('\n');
  
  return (
    `Order Summary\n\n` +
    `${itemsList}\n\n` +
    `Total Items: ${itemCount}\n` +
    `Total Price: $${total.toFixed(2)}\n` +
    `Session: ${sessionId}\n\n` +
    `Note: This is a demo - no payment processed`
  );
}

/**
 * Validate cart before checkout
 */
export function validateCart(cart: CartItem[]): { valid: boolean; error?: string } {
  if (cart.length === 0) {
    return { valid: false, error: "Cart is empty" };
  }
  
  if (cart.some(item => item.quantity <= 0)) {
    return { valid: false, error: "Invalid item quantity" };
  }
  
  return { valid: true };
}
