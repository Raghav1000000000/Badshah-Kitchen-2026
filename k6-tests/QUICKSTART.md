# 🚀 Quick Start: Load Testing Checklist

## Before You Start

- [ ] Install k6: `choco install k6` (or download from https://k6.io)
- [ ] Set environment variables:
  ```powershell
  $env:SUPABASE_URL="https://your-project.supabase.co"
  $env:SUPABASE_ANON_KEY="your-anon-key"
  ```

## Setup Steps

### 1. Get Menu Item IDs
```powershell
# Run this SQL in Supabase SQL Editor (k6-tests/get-menu-ids.sql)
SELECT id, name FROM menu_items WHERE is_available = true LIMIT 10;
```

### 2. Update order-api-test.js
```javascript
// Replace this array with real IDs from step 1:
const MENU_ITEM_IDS = [
  'real-uuid-1',
  'real-uuid-2',
  'real-uuid-3',
  // etc...
];
```

## Run Tests

### Option 1: Interactive Script (Recommended)
```powershell
cd k6-tests
.\run-tests.ps1
```

### Option 2: Individual Tests
```powershell
cd k6-tests

# Menu load test (100 users)
k6 run menu-load-test.js

# Order API test (50 users)
k6 run order-api-test.js
```

## During Tests

### Open Multiple Windows

**Terminal 1: Run k6 test**
```powershell
cd k6-tests
.\run-tests.ps1
```

**Browser 1: Kitchen Screen**
```
http://localhost:3000/kitchen
```

**Browser 2: Order Placement**
```
http://localhost:3000
```
→ Add items to cart
→ Spam "Place Order" button while test runs

**Browser 3: Supabase Dashboard**
- Logs → Database (watch queries)
- Database → Performance (watch metrics)

## What to Watch For

### ✅ Good Signs
- Response times < 500ms (menu)
- Response times < 2s (orders)
- Error rate < 5%
- Smooth kitchen screen updates
- No connection errors

### ⚠️ Warning Signs
- Response times > 1s
- Error rate > 10%
- Connection pool exhaustion
- Kitchen screen lag
- Failed order submissions

## After Tests

### 1. Check Results
```powershell
# View summary files
cat menu-load-test-summary.json
cat order-api-test-summary.json
```

### 2. Clean Up Test Data
```sql
-- In Supabase SQL Editor
DELETE FROM order_items 
WHERE order_id IN (
  SELECT id FROM orders WHERE session_id LIKE 'k6-test-%'
);

DELETE FROM orders WHERE session_id LIKE 'k6-test-%';
```

### 3. Review Metrics
- Check Supabase Dashboard → Database → Performance
- Look for slow queries
- Check connection pool usage

## Next Steps

If you see issues:
1. Add indexes: See `docs/add-performance-indexes.sql`
2. Optimize queries: Check slow query logs
3. Tune connection pool: Adjust Supabase settings
4. Add caching: Consider Redis for menu items

## Full Documentation

- [README.md](README.md) - Detailed test information
- [MONITORING-GUIDE.md](MONITORING-GUIDE.md) - Database monitoring tips
- [get-menu-ids.sql](get-menu-ids.sql) - SQL to get menu IDs

## Quick Reference

```powershell
# Set environment variables
$env:SUPABASE_URL="https://xxx.supabase.co"
$env:SUPABASE_ANON_KEY="xxx"

# Run tests
cd k6-tests
.\run-tests.ps1

# Open kitchen (in another terminal)
cd ..
npm run dev
# Then open: http://localhost:3000/kitchen

# Clean up after
# Run cleanup SQL in Supabase
```

---

**Ready to start?** Run `.\run-tests.ps1` in the k6-tests directory! 🎯
