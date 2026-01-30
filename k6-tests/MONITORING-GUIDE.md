# Database Monitoring Guide for Load Tests

## Supabase Dashboard Monitoring

### 1. Access Database Logs
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Logs** → **Database**

### 2. Key Metrics to Monitor

#### During Menu Load Test (100 users)
Watch for:
- **Query frequency** on `menu_items` table
- **Connection pool usage**
- **Query execution time**
- **Cache hit ratio**

Filter logs by:
```sql
-- Look for SELECT queries on menu_items
SELECT * FROM menu_items WHERE is_available = true
```

#### During Order API Test (50 users)
Watch for:
- **INSERT rate** on `orders` table
- **INSERT rate** on `order_items` table
- **Transaction duration**
- **Lock waits** (if any)
- **Foreign key constraint checks**

Filter logs by:
```sql
-- Look for INSERT operations
INSERT INTO orders
INSERT INTO order_items
```

### 3. Performance Monitoring

#### Real-time Metrics
Navigate to **Database** → **Performance** to see:
- Active connections
- Database CPU usage
- Memory usage
- Disk I/O
- Query throughput

#### Expected Behavior

**Menu Load Test:**
- High SELECT query rate (~100-200 queries/sec at peak)
- Low CPU usage (<30%)
- Fast query times (<50ms average)

**Order API Test:**
- Moderate INSERT rate (~50-100 inserts/sec at peak)
- Higher CPU usage (30-60%)
- Transaction times (<200ms average)

### 4. Warning Signs

🚨 **Watch out for:**
- Connection pool exhaustion
- Queries taking >1 second
- Lock wait timeouts
- Foreign key violations
- High error rates

### 5. Useful SQL Queries

Run these in **SQL Editor** during tests:

#### Active Connections
```sql
SELECT 
  count(*),
  state
FROM pg_stat_activity
GROUP BY state;
```

#### Recent Order Activity
```sql
SELECT 
  COUNT(*) as order_count,
  MIN(created_at) as first_order,
  MAX(created_at) as last_order
FROM orders
WHERE created_at > NOW() - INTERVAL '5 minutes';
```

#### Order Items per Order (Performance Check)
```sql
SELECT 
  o.id,
  o.created_at,
  COUNT(oi.id) as item_count
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE o.created_at > NOW() - INTERVAL '5 minutes'
GROUP BY o.id, o.created_at
ORDER BY o.created_at DESC
LIMIT 20;
```

#### Slow Query Detection
```sql
SELECT 
  query,
  calls,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### 6. Real-time Subscription Monitoring

Check **Realtime** logs for:
- WebSocket connection count
- Broadcast message rate
- Channel subscription count

Navigate to **Logs** → **Realtime** to monitor:
- Kitchen screen subscription activity
- Menu updates broadcast
- Order updates broadcast

### 7. After Test Analysis

#### Check for Test Data
```sql
-- Count test orders
SELECT COUNT(*) 
FROM orders 
WHERE session_id LIKE 'k6-test-%';

-- Check order distribution
SELECT 
  status,
  COUNT(*) as count,
  MIN(created_at) as first_order,
  MAX(created_at) as last_order
FROM orders
WHERE session_id LIKE 'k6-test-%'
GROUP BY status;
```

#### Performance Summary
```sql
-- Average order items per order (test data)
SELECT 
  AVG(item_count) as avg_items_per_order,
  MAX(item_count) as max_items_per_order
FROM (
  SELECT 
    o.id,
    COUNT(oi.id) as item_count
  FROM orders o
  LEFT JOIN order_items oi ON o.id = oi.order_id
  WHERE o.session_id LIKE 'k6-test-%'
  GROUP BY o.id
) subquery;
```

### 8. Cleanup Test Data

After reviewing, clean up test orders:

```sql
-- Delete test order items first (foreign key constraint)
DELETE FROM order_items 
WHERE order_id IN (
  SELECT id FROM orders WHERE session_id LIKE 'k6-test-%'
);

-- Then delete test orders
DELETE FROM orders WHERE session_id LIKE 'k6-test-%';

-- Verify cleanup
SELECT COUNT(*) FROM orders WHERE session_id LIKE 'k6-test-%';
-- Should return 0
```

## Tips for Effective Monitoring

1. **Open multiple tabs:**
   - Tab 1: Database Logs
   - Tab 2: Performance Metrics
   - Tab 3: SQL Editor (for live queries)
   - Tab 4: Realtime Logs

2. **Take screenshots** of key metrics during peak load

3. **Note timestamps** when issues occur

4. **Compare before/after** adding indexes (see `docs/add-performance-indexes.sql`)

## Next Steps After Testing

Based on monitoring results:
- Add missing indexes
- Tune connection pool size
- Optimize slow queries
- Adjust RLS policies if needed
- Consider caching strategies
