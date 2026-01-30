# K6 Load Testing for Badshah's Kitchen

This directory contains k6 load tests for the café ordering application.

## Prerequisites

1. **Install k6**:
   ```bash
   # Windows (using Chocolatey)
   choco install k6

   # Or download from: https://k6.io/docs/getting-started/installation/
   ```

2. **Set Environment Variables**:
   Create a `.env` file or set these environment variables:
   ```bash
   $env:SUPABASE_URL="https://your-project.supabase.co"
   $env:SUPABASE_ANON_KEY="your-anon-key"
   ```

## Test Files

### 1. Menu Load Test (`menu-load-test.js`)
Tests the menu items endpoint with 100 concurrent users.

**What it tests:**
- Fetching menu items from Supabase
- Response times under load
- Error rates

**Load profile:**
- Ramps up to 100 concurrent users over 3.5 minutes
- Maintains 100 users for 2 minutes
- Ramps down over 30 seconds

**Run:**
```bash
k6 run menu-load-test.js
```

**Success criteria:**
- 95% of requests < 500ms
- 99% of requests < 1000ms
- Error rate < 5%

### 2. Order API Test (`order-api-test.js`)
Tests order submission with 50 concurrent users.

**What it tests:**
- Creating orders in the database
- Inserting order items
- End-to-end order flow
- Transaction integrity

**Load profile:**
- Ramps up to 50 concurrent users over 2 minutes
- Maintains 50 users for 2 minutes
- Ramps down over 30 seconds

**Run:**
```bash
k6 run order-api-test.js
```

**Success criteria:**
- 95% of requests < 2s
- 99% of requests < 5s
- Error rate < 10%

## Before Running Order API Test

**⚠️ IMPORTANT:** Update the `MENU_ITEM_IDS` array in `order-api-test.js` with real menu item IDs from your database:

```javascript
const MENU_ITEM_IDS = [
  'real-uuid-1',
  'real-uuid-2',
  'real-uuid-3',
  // Add more...
];
```

To get menu item IDs, run this SQL in Supabase:
```sql
SELECT id, name FROM menu_items WHERE is_available = true LIMIT 10;
```

## Running All Tests

To run both tests sequentially:

```bash
# Menu test (100 users)
k6 run menu-load-test.js

# Order test (50 users)
k6 run order-api-test.js
```

## Monitoring During Tests

### 1. Watch Database Logs in Supabase
1. Go to Supabase Dashboard
2. Navigate to **Logs** → **Database**
3. Filter by:
   - `menu_items` table queries
   - `orders` table inserts
   - `order_items` table inserts

### 2. Monitor Real-time Performance
During the test, k6 will output real-time metrics:
- Request rate (requests/second)
- Response time (avg, p95, p99)
- Error rate
- Active virtual users

### 3. Database Connection Pool
Watch for:
- Connection pool exhaustion
- Slow queries
- Lock contention on orders table

## Test Outputs

Each test generates:
- **Console output**: Real-time metrics
- **JSON summary**: `menu-load-test-summary.json` and `order-api-test-summary.json`

## Manual Testing Alongside K6

While k6 tests are running, you can:

1. **Open the kitchen screen** in a browser:
   ```
   http://localhost:3000/kitchen
   ```

2. **Spam order button** manually:
   - Open the main app: `http://localhost:3000`
   - Add items to cart
   - Click "Place Order" repeatedly
   - Observe real-time updates in kitchen screen

3. **Monitor both** to see how the system handles:
   - Concurrent API calls from k6
   - Real user interactions
   - Real-time updates via Supabase Realtime

## Troubleshooting

### High Error Rates
- Check Supabase connection limits
- Verify API keys are correct
- Check for rate limiting

### Slow Response Times
- Add database indexes (see `docs/add-performance-indexes.sql`)
- Check Supabase instance size
- Monitor database CPU/memory

### Failed Order Creations
- Verify menu item IDs exist
- Check foreign key constraints
- Look for database locks

## Best Practices

1. **Run tests during off-peak hours** to avoid affecting real users
2. **Start with smaller loads** and gradually increase
3. **Monitor database metrics** during tests
4. **Clean up test data** after running (orders with session_id starting with "k6-test-")

## Cleanup Test Data

After testing, remove test orders:

```sql
DELETE FROM order_items 
WHERE order_id IN (
  SELECT id FROM orders WHERE session_id LIKE 'k6-test-%'
);

DELETE FROM orders WHERE session_id LIKE 'k6-test-%';
```

## Next Steps

- Add performance indexes from `docs/add-performance-indexes.sql`
- Configure Supabase connection pooling
- Consider caching strategies for menu items
- Monitor long-term performance trends
