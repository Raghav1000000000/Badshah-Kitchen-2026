/**
 * K6 Load Test: Order Submission API
 * Tests the order submission with 50 concurrent users
 * 
 * Run with: k6 run order-api-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Counter } from 'k6/metrics';
import { randomString, randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Custom metrics
const errorRate = new Rate('errors');
const ordersCreated = new Counter('orders_created');

// Test configuration
export const options = {
  stages: [
    { duration: '20s', target: 10 },   // Ramp up to 10 users
    { duration: '40s', target: 25 },   // Ramp up to 25 users
    { duration: '1m', target: 50 },    // Ramp up to 50 users
    { duration: '2m', target: 50 },    // Stay at 50 users for 2 minutes
    { duration: '30s', target: 0 },    // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000', 'p(99)<5000'], // 95% of requests should be below 2s
    http_req_failed: ['rate<0.1'],                    // Error rate should be below 10%
    errors: ['rate<0.1'],
  },
};

// Your Supabase configuration
const SUPABASE_URL = __ENV.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

// Sample menu item IDs (you'll need to update these with real IDs from your database)
const MENU_ITEM_IDS = [
  '7bb3a0c0-717c-410a-8633-3c47c29d4647', // Samosa (2 pcs)
  'c641de2b-5e5b-43c3-b613-e0d505678d9b', // Paneer Tikka
  '7753748b-6489-4722-a546-75538f47e0d8', // Chicken Tikka
  'dbcb6e6f-179f-4ba0-bc44-6f27f4fa0a8b', // Spring Roll (4 pcs)
  'b89cf3cd-7aef-4aa2-bc09-d1d591ab04a6', // Veg Pakora
  '56c80e1f-18ae-4199-b454-437d352f7d88', // Chicken Wings (6 pcs)
  '605b67ef-1ad3-42c2-a06c-3accd60887db', // Hara Bhara Kabab
  'b88389ad-68c5-4a45-8d88-025062dade86', // Paneer Butter Masala
  '77686d2f-d061-460b-b045-092748670950', // Butter Chicken
  '55b9cdf0-3c1b-4cc2-a01a-b7f9fe17313f', // Chicken Curry
];

// Helper function to generate a unique session ID
function generateSessionId() {
  return `k6-test-${randomString(16)}-${Date.now()}`;
}

// Helper function to generate random cart items
function generateCartItems() {
  const itemCount = randomIntBetween(1, 5);
  const items = [];
  
  for (let i = 0; i < itemCount; i++) {
    const menuItemId = MENU_ITEM_IDS[randomIntBetween(0, MENU_ITEM_IDS.length - 1)];
    items.push({
      menu_item_id: menuItemId,
      quantity: randomIntBetween(1, 3),
    });
  }
  
  return items;
}

export default function () {
  const params = {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
  };

  // Generate unique customer data for this order
  const sessionId = generateSessionId();
  const customerName = `TestUser_${randomString(8)}`;
  const customerPhone = `+1${randomIntBetween(2000000000, 9999999999)}`;

  // Step 1: Create order
  const orderPayload = {
    session_id: sessionId,
    customer_name: customerName,
    customer_phone: customerPhone,
    status: 'PLACED',
    total_amount: 0, // Will be updated after items are added
  };

  const orderUrl = `${SUPABASE_URL}/rest/v1/orders`;
  const orderResponse = http.post(orderUrl, JSON.stringify(orderPayload), params);

  let orderId = null;
  const orderCheck = check(orderResponse, {
    'order created (status 201)': (r) => r.status === 201,
    'order response has id': (r) => {
      try {
        const body = JSON.parse(r.body);
        orderId = Array.isArray(body) ? body[0]?.id : body?.id;
        return orderId !== null && orderId !== undefined;
      } catch (e) {
        return false;
      }
    },
  });

  if (!orderCheck || !orderId) {
    console.error(`Order creation failed: ${orderResponse.status} - ${orderResponse.body}`);
    errorRate.add(1);
    sleep(1);
    return;
  }

  // Step 2: Fetch menu item details (need name and price for order_items)
  const cartItems = generateCartItems();
  const menuItemIds = cartItems.map(item => item.menu_item_id).join(',');
  const menuFetchUrl = `${SUPABASE_URL}/rest/v1/menu_items?id=in.(${menuItemIds})&select=id,name,price`;
  
  const menuResponse = http.get(menuFetchUrl, params);
  let menuItemsMap = {};
  
  if (menuResponse.status === 200) {
    try {
      const menuItems = JSON.parse(menuResponse.body);
      menuItems.forEach(item => {
        menuItemsMap[item.id] = { name: item.name, price: item.price };
      });
    } catch (e) {
      console.error(`Failed to parse menu items: ${e}`);
    }
  }

  // Step 3: Add order items with item_name and item_price_at_order
  const orderItemsUrl = `${SUPABASE_URL}/rest/v1/order_items`;
  
  const orderItemsPayload = cartItems.map(item => ({
    order_id: orderId,
    menu_item_id: item.menu_item_id,
    quantity: item.quantity,
    item_name: menuItemsMap[item.menu_item_id]?.name || 'Unknown Item',
    item_price_at_order: menuItemsMap[item.menu_item_id]?.price || 0,
  }));

  const itemsResponse = http.post(orderItemsUrl, JSON.stringify(orderItemsPayload), params);

  const itemsCheck = check(itemsResponse, {
    'order items created (status 201)': (r) => r.status === 201,
  });

  if (!itemsCheck) {
    console.error(`Order items creation failed: ${itemsResponse.status} - ${itemsResponse.body}`);
    errorRate.add(1);
  } else {
    ordersCreated.add(1);
  }

  // Overall success check
  const overallSuccess = orderCheck && itemsCheck;
  errorRate.add(!overallSuccess);

  // Log timing information
  if (overallSuccess) {
    console.log(`✅ Order ${orderId} created in ${orderResponse.timings.duration + itemsResponse.timings.duration}ms`);
  }

  // Simulate time between orders (2-5 seconds)
  sleep(randomIntBetween(2, 5));
}

export function handleSummary(data) {
  return {
    'order-api-test-summary.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options) {
  const indent = options.indent || '';
  
  let summary = '\n';
  summary += `${indent}Order API Load Test Summary:\n`;
  summary += `${indent}================================\n`;
  
  if (data.metrics.http_reqs) {
    summary += `${indent}  Total Requests: ${data.metrics.http_reqs.values.count}\n`;
  }
  
  if (data.metrics.orders_created) {
    summary += `${indent}  Orders Created: ${data.metrics.orders_created.values.count}\n`;
  }
  
  if (data.metrics.checks && data.metrics.checks.values) {
    const checks = data.metrics.checks.values;
    const total = checks.passes + checks.fails;
    summary += `${indent}  Checks Passed: ${checks.passes}/${total} (${total > 0 ? ((checks.passes / total) * 100).toFixed(2) : 0}%)\n`;
  }
  
  if (data.metrics.http_req_duration && data.metrics.http_req_duration.values) {
    const duration = data.metrics.http_req_duration.values;
    summary += `${indent}  Request Duration (avg): ${duration.avg ? duration.avg.toFixed(2) : 'N/A'}ms\n`;
    summary += `${indent}  Request Duration (p95): ${duration['p(95)'] ? duration['p(95)'].toFixed(2) : 'N/A'}ms\n`;
    summary += `${indent}  Request Duration (p99): ${duration['p(99)'] ? duration['p(99)'].toFixed(2) : 'N/A'}ms\n`;
  }
  
  if (data.metrics.http_req_failed) {
    summary += `${indent}  Failed Requests: ${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%\n`;
  }
  
  if (data.metrics.errors) {
    summary += `${indent}  Error Rate: ${(data.metrics.errors.values.rate * 100).toFixed(2)}%\n`;
  }
  
  return summary;
}
