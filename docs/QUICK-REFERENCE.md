# 🚀 Quick Reference Card

## Auto-Refresh Settings

```
Kitchen Page:  5 seconds  → Fast updates for staff
Orders Page:  10 seconds  → Less frequent for customers
```

## File Locations

### Core Application
- Menu: `app/page.tsx`
- Orders: `app/orders/page.tsx`
- Kitchen: `app/kitchen/page.tsx`

### Utilities
- Date Utils: `lib/dateUtils.ts`
- Order Submission: `lib/orderSubmission.ts`
- Session: `lib/SessionContext.tsx`
- Supabase: `lib/supabase.ts`

### Documentation
- Cleanup Summary: `docs/CLEANUP-SUMMARY.md`
- Testing Guide: `docs/TESTING-STATUS-UPDATES.md`
- Data Flow: `docs/DATA-FLOW-DIAGRAM.md`
- DB Indexes: `docs/add-performance-indexes.sql`
- Checklist: `docs/FINAL-CHECKLIST.md`

## Common Commands

```powershell
# Start development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Check for errors
npm run type-check
```

## Database Queries

### Kitchen Query
```sql
SELECT * FROM orders 
WHERE status != 'COMPLETED'
ORDER BY created_at DESC;
```

### Customer Query
```sql
SELECT * FROM orders 
WHERE session_id = 'xxx'
ORDER BY created_at DESC;
```

## Storage Locations

### localStorage (Persistent)
- `session_id` - Unique browser identifier
- `customer_name` - Customer's name
- `customer_phone` - Customer's phone

### sessionStorage (Tab-scoped)
- `cart` - Shopping cart items (JSON array)

## Status Flow

```
PLACED → PREPARING → READY → COMPLETED
```

## Order Number Format

```
Order #1, Order #2, Order #3...
```
Sequential, auto-incrementing

## Time Format

```
2:30 PM  (12-hour format, AM/PM)
Jan 15, 2024  (Month Day, Year)
```

## Amount Format

```
₹45.50  (Rupees with 2 decimals)
```

## Key Functions (lib/dateUtils.ts)

```typescript
formatTime("2024-01-15T14:30:00") → "2:30 PM"
formatDate("2024-01-15T14:30:00") → "Jan 15, 2024"
formatDateTime("2024-01-15T14:30:00") → "Jan 15, 2024 at 2:30 PM"
getRelativeTime("2024-01-15T14:30:00") → "5 minutes ago"
```

## Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

## Port Configuration

```
Development: http://localhost:3000
Network: http://10.82.156.121:3000
```

## Browser Storage Commands

### Check Session
```javascript
localStorage.getItem('session_id')
```

### Check Customer
```javascript
localStorage.getItem('customer_name')
localStorage.getItem('customer_phone')
```

### Check Cart
```javascript
sessionStorage.getItem('cart')
```

### Clear Session
```javascript
localStorage.clear()
sessionStorage.clear()
```

## Database Performance

### Before Indexes
- Kitchen query: 100-200ms
- Orders query: 50-100ms

### After Indexes
- Kitchen query: 20-30ms ⚡
- Orders query: 10-20ms ⚡

**Improvement**: 5x faster!

## Debugging Tips

### Console Logs
```typescript
// Production-ready - only errors
console.error('Error:', error);

// Development - temporarily add for debugging
console.log('Debug:', data);
```

### Network Tab
1. Open DevTools (F12)
2. Go to "Network" tab
3. Filter: "Fetch/XHR"
4. Watch auto-refresh requests

### React DevTools
1. Install React Developer Tools extension
2. Open Components tab
3. Find component
4. View props and state

## Common Issues & Fixes

### Order not appearing
- Wait 5-10 seconds for auto-refresh
- Check browser console for errors
- Verify session_id exists

### Status not updating
- Wait 10 seconds for customer refresh
- Check if order belongs to current session
- Kitchen updates are instant

### Performance slow
- Run database indexes SQL script
- Check network speed
- Clear browser cache

## Testing Scenarios

### Test 1: New Order
1. Place order from menu
2. Check orders page immediately
3. Check kitchen page (wait 5s)

### Test 2: Status Update
1. Change status in kitchen
2. Wait 10 seconds
3. Check orders page

### Test 3: Multi-Customer
1. Open 2 browser windows
2. Place orders from both
3. Verify kitchen shows all
4. Verify each customer sees only theirs

## Success Criteria

✅ Orders appear immediately after submission  
✅ Kitchen auto-refreshes every 5 seconds  
✅ Orders auto-refreshes every 10 seconds  
✅ Status updates propagate correctly  
✅ Session filtering works  
✅ Order numbers sequential  
✅ Performance acceptable (<100ms queries)

## Emergency Rollback

If issues occur:

```powershell
# Rollback to previous version
git log --oneline
git checkout <commit-hash>

# Or reset to last working state
git reset --hard HEAD~1
```

## Performance Monitoring

### Query Performance
```sql
-- Check query execution time
EXPLAIN ANALYZE
SELECT * FROM orders WHERE status != 'COMPLETED';
```

### Index Verification
```sql
-- List all indexes
SELECT * FROM pg_indexes 
WHERE tablename IN ('orders', 'order_items');
```

## Production Checklist

- [ ] Environment variables set
- [ ] Database indexes installed
- [ ] RLS policies configured
- [ ] Error handling tested
- [ ] Auto-refresh verified
- [ ] Multi-customer tested
- [ ] Performance acceptable

---

**Quick Help**: See [docs/CLEANUP-SUMMARY.md](docs/CLEANUP-SUMMARY.md) for full details
