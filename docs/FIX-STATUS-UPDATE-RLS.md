# 🔧 FIX: Kitchen Page Status Updates Not Persisting

## Problem Identified

**Symptom**: When kitchen staff updates order status, it appears to work, but on page refresh the status reverts back to PLACED.

**Root Cause**: ❌ **Missing RLS UPDATE Policy**

The `orders` table has RLS enabled with policies for:
- ✅ SELECT (read orders)
- ✅ INSERT (create orders)
- ❌ **UPDATE (update orders) - MISSING!**
- ❌ DELETE (delete orders) - Not needed

Without an UPDATE policy, Supabase RLS blocks ALL update operations by default.

## Evidence

1. **Database Schema** (docs/database-schema.md):
   ```sql
   -- No UPDATE policy = UPDATE denied for everyone
   -- No DELETE policy = DELETE denied for everyone
   ```

2. **Test Results**:
   - Automated test: "Update returned no data (RLS blocking)"
   - Kitchen page: Updates work locally but don't persist
   - On refresh: Status reverts to original value

3. **Supabase Behavior**:
   - UPDATE query returns empty array when blocked by RLS
   - No error thrown, but no rows affected
   - Local state updates, creating illusion of success

## Solution

### Step 1: Add UPDATE Policy to Database

**File**: [docs/add-update-policy.sql](docs/add-update-policy.sql)

Run this SQL in Supabase SQL Editor:

```sql
-- Create UPDATE policy to allow status updates
CREATE POLICY "Allow update orders status"
  ON public.orders
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);
```

**Instructions**:
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor" in left sidebar
4. Copy/paste the SQL from `add-update-policy.sql`
5. Click "Run"
6. Verify output shows "CREATE POLICY"

### Step 2: Updated Kitchen Page Code

**File**: [app/kitchen/page.tsx](app/kitchen/page.tsx)

Already updated to detect RLS blocking:

```typescript
const { data: updateData, error: updateError } = await supabase
  .from('orders')
  .update({ status: newStatus.toUpperCase() })
  .eq('id', orderId)
  .select('id, status');  // ← Request data back

// Check if update actually happened
if (!updateData || updateData.length === 0) {
  throw new Error('Update was blocked (likely by RLS policy)');
}
```

**Changes Made**:
- ✅ Added `.select('id, status')` to get updated data back
- ✅ Check if `updateData` is empty (indicates RLS block)
- ✅ Throw descriptive error if blocked
- ✅ User sees clear alert instead of silent failure

## Testing the Fix

### Before Fix
1. Kitchen page updates order status
2. UI shows new status immediately
3. Refresh page → **status reverts to PLACED** ❌
4. No error shown to user
5. Database unchanged

### After Fix
1. Run the SQL script in Supabase
2. Kitchen page updates order status
3. UI shows new status immediately
4. Refresh page → **status remains updated** ✅
5. Database persists the change
6. Orders page reflects new status within 10 seconds

### Quick Test Procedure
1. **Run SQL Script**: Execute `add-update-policy.sql` in Supabase
2. **Open Kitchen Page**: http://localhost:3000/kitchen
3. **Find Order**: Any order with status PLACED
4. **Update Status**: Change to ACCEPTED
5. **Hard Refresh**: Press Ctrl+Shift+R
6. **Verify**: Status should still be ACCEPTED ✅

## Security Considerations

### Current Policy
```sql
USING (true)
WITH CHECK (true)
```
- Allows **anyone** to update any order
- Suitable for internal kitchen staff use
- No authentication required

### Production Recommendations

If you add authentication later, consider restricting updates:

```sql
-- Option 1: Only allow status updates (not other fields)
CREATE POLICY "Allow update orders status only"
  ON public.orders
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (
    -- Only status can be changed
    (old.session_id = new.session_id) AND
    (old.customer_name = new.customer_name) AND
    (old.customer_phone = new.customer_phone) AND
    (old.total_amount = new.total_amount) AND
    (old.created_at = new.created_at)
  );

-- Option 2: Restrict to authenticated kitchen staff
CREATE POLICY "Allow kitchen staff to update orders"
  ON public.orders
  FOR UPDATE
  TO authenticated
  USING (auth.jwt()->>'role' = 'kitchen_staff');
```

## Impact Analysis

### What Changes
- ✅ Kitchen status updates now persist to database
- ✅ Page refreshes show correct status
- ✅ Orders page receives updated status
- ✅ Status validation still enforced (PLACED→ACCEPTED→PREPARING→READY→COMPLETED)

### What Stays Same
- Frontend validation logic unchanged
- Invalid transitions still blocked
- Auto-refresh timing unchanged (5s kitchen, 10s orders)
- Session filtering unchanged

## Rollback Plan

If you need to revert:

```sql
-- Remove the UPDATE policy
DROP POLICY IF EXISTS "Allow update orders status" ON public.orders;

-- Verify it's gone
SELECT policyname FROM pg_policies WHERE tablename = 'orders';
```

Note: This will break kitchen status updates again.

## Related Files

- **SQL Fix**: `docs/add-update-policy.sql`
- **Updated Code**: `app/kitchen/page.tsx`
- **Schema Docs**: `docs/database-schema.md`
- **Test Scripts**: 
  - `test-order-status-flow.js`
  - `test-kitchen-orders-integration.js`

## Verification Checklist

After applying the fix:

- [ ] SQL script executed successfully in Supabase
- [ ] Policy appears in Supabase → Database → Policies
- [ ] Kitchen page can update order status
- [ ] Status persists after page refresh
- [ ] Orders page shows updated status
- [ ] Invalid transitions still blocked with alert
- [ ] Console logs show success messages
- [ ] No RLS errors in Supabase logs

## Summary

**Problem**: Missing RLS UPDATE policy blocked all status updates  
**Solution**: Add UPDATE policy to allow kitchen staff to update orders  
**Impact**: Kitchen page status updates now work correctly and persist  
**Action Required**: Run `add-update-policy.sql` in Supabase SQL Editor  

**Status**: 🔧 Fix ready to deploy
