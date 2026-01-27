/**
 * Order Submission Logic
 * Handles inserting orders and order_items into Supabase
 */

import { supabase } from "./supabase";
import { CartItem } from "@/types/cart";
import { prepareOrderItems, calculateOrderTotal } from "./orderUtils";

export type OrderSubmissionData = {
  session_id: string;
  customer_name: string;
  customer_phone: string;
};

export type OrderSubmissionResult = {
  success: boolean;
  order_id?: string;
  error?: string;
};

/**
 * Submit an order to the database
 * 
 * Process:
 * 1. Insert order into orders table
 * 2. Get the created order_id
 * 3. Insert all cart items into order_items table
 * 
 * @param cart - Current cart items
 * @param orderData - Customer information and session_id
 * @returns Result with success status and order_id or error message
 */
export async function submitOrder(
  cart: CartItem[],
  orderData: OrderSubmissionData
): Promise<OrderSubmissionResult> {
  
  // Validate inputs
  if (!orderData.session_id || orderData.session_id.trim() === '') {
    return { success: false, error: "Session ID is required" };
  }

  if (!orderData.customer_name || orderData.customer_name.trim() === '') {
    return { success: false, error: "Customer name is required" };
  }

  if (!orderData.customer_phone || orderData.customer_phone.trim() === '') {
    return { success: false, error: "Customer phone is required" };
  }

  if (cart.length === 0) {
    return { success: false, error: "Cart is empty" };
  }

  // Calculate total amount in cents
  const totalAmount = calculateOrderTotal(cart);

  try {
    // Step 1: Insert order into orders table
    console.log('🔄 Starting order submission...');
    console.log('📦 Cart items:', cart.length);
    console.log('💰 Total amount:', totalAmount, 'cents');
    console.log('👤 Customer:', orderData.customer_name, orderData.customer_phone);
    console.log('🆔 Session:', orderData.session_id);
    
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        session_id: orderData.session_id,
        customer_name: orderData.customer_name,
        customer_phone: orderData.customer_phone,
        status: 'PLACED',
        total_amount: totalAmount,
      })
      .select('id')
      .single();

    if (orderError) {
      // CRITICAL ERROR: Order insert failed
      console.error('❌ ==================== ORDER INSERT FAILED ====================');
      console.error('Error Code:', orderError.code);
      console.error('Error Message:', orderError.message);
      console.error('Error Details:', orderError.details);
      console.error('Error Hint:', orderError.hint);
      console.error('Attempted Data:', {
        session_id: orderData.session_id,
        customer_name: orderData.customer_name,
        customer_phone: orderData.customer_phone,
        status: 'PLACED',
        total_amount: totalAmount,
      });
      console.error('============================================================');
      
      return { 
        success: false, 
        error: `Failed to create order: ${orderError.message}` 
      };
    }

    if (!order || !order.id) {
      // CRITICAL ERROR: Order created but no ID returned
      console.error('❌ ==================== ORDER ID MISSING ====================');
      console.error('Order data received:', order);
      console.error('This should never happen - database constraint issue');
      console.error('============================================================');
      
      return { 
        success: false, 
        error: 'Order created but ID not returned' 
      };
    }

    const orderId = order.id;
    console.log('✅ Order created successfully');
    console.log('🆔 Order ID:', orderId);

    // Step 2: Prepare order items for insertion
    const orderItems = prepareOrderItems(cart, orderId);
    console.log('📝 Prepared order items:', orderItems.length);

    // Step 3: Insert order items into order_items table
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      // CRITICAL ERROR: Order created but items insert failed
      console.error('❌ ================ ORDER ITEMS INSERT FAILED ================');
      console.error('⚠️  WARNING: Order exists in database but has no items!');
      console.error('Order ID:', orderId);
      console.error('Error Code:', itemsError.code);
      console.error('Error Message:', itemsError.message);
      console.error('Error Details:', itemsError.details);
      console.error('Error Hint:', itemsError.hint);
      console.error('Items attempted:', orderItems.length);
      console.error('Items data:', JSON.stringify(orderItems, null, 2));
      console.error('============================================================');
      
      return {
        success: false,
        order_id: orderId,
        error: `Order created (${orderId}) but failed to add items: ${itemsError.message}`
      };
    }

    console.log('✅ Order items inserted successfully');
    console.log('📊 Items count:', orderItems.length);
    console.log('✅ ==================== ORDER COMPLETE ====================');

    // Success
    return {
      success: true,
      order_id: orderId
    };

  } catch (error) {
    // CRITICAL ERROR: Unexpected exception during order submission
    console.error('❌ ================ UNEXPECTED ERROR ================');
    console.error('Exception Type:', error instanceof Error ? 'Error' : typeof error);
    console.error('Exception Message:', error instanceof Error ? error.message : String(error));
    console.error('Exception Stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Cart Data:', JSON.stringify(cart, null, 2));
    console.error('Order Data:', JSON.stringify(orderData, null, 2));
    console.error('====================================================');
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}
