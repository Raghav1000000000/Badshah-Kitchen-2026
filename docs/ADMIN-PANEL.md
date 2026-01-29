# Admin Panel Documentation

## Overview
The Admin Panel provides comprehensive management capabilities for Badshah's Kitchen, including full menu CRUD operations and real-time daily statistics.

## Access
- **URL**: `/admin`
- **Login**: `/admin/login`
- **Authentication**: Simple password-based (no user accounts needed)
- **Password**: Set via `NEXT_PUBLIC_ADMIN_PASSWORD` environment variable
  - Default: `admin123` (⚠️ Change for production!)
  - Recommended: `Admin2026!Secure`

## Features

### 1. Menu Management

#### View Menu Items
- Complete list of all menu items in the database
- Organized by category (Starters, Main Course, Breads, Rice, Desserts, Beverages)
- Shows availability status for each item
- Displays name, category, price, description, and availability

#### Add New Menu Item
1. Click "Add Menu Item" button
2. Fill in the form:
   - **Name**: Item name (required)
   - **Category**: Select from dropdown (required)
   - **Price**: In rupees, stored as paise in DB (required)
   - **Image URL**: Optional external image link
   - **Description**: Optional text description
   - **Available**: Checkbox for availability status
3. Click "Add Item" to save

#### Edit Menu Item
1. Click "Edit" button on any menu item
2. Form auto-fills with current values
3. Modify any fields
4. Click "Update Item" to save changes
5. Click "Cancel" to discard changes

#### Delete Menu Item
1. Click "Delete" button on any menu item
2. Confirm deletion in popup dialog
3. Item is permanently removed from database

**Note**: Price input is in rupees (e.g., 299) but stored as paise in the database (29900)

### 2. Daily Statistics

#### Overview Cards
- **Total Orders**: Count of all orders placed today
- **Total Revenue**: Sum of all order amounts for today (in ₹)

#### Orders by Status
Shows distribution of today's orders across all statuses:
- PLACED
- ACCEPTED
- PREPARING
- READY
- COMPLETED

#### Top 5 Popular Items
Lists the most ordered items today with:
- Item name
- Number of orders
- Total revenue generated
- Ranked by order count

#### Data Refresh
- Click "Refresh" button to reload latest stats
- Stats are calculated based on current date (00:00:00 to 23:59:59)
- Includes orders in all statuses

## Technical Details

### Authentication Flow
1. User visits `/admin`
2. `useAdminAuth` hook checks localStorage for `admin_auth` key
3. If not authenticated, redirects to `/admin/login`
4. Login validates password against `NEXT_PUBLIC_ADMIN_PASSWORD`
5. On success, sets localStorage and redirects to `/admin`

### Database Operations

#### Menu CRUD
- **Table**: `menu_items`
- **Operations**: SELECT, INSERT, UPDATE, DELETE
- **Permissions**: Uses Supabase public access
- **Price Format**: Stored in paise (cents), displayed in rupees
  - Input: 299 → Database: 29900

#### Statistics Queries
- **Table**: `orders` with join to `order_items` and `menu_items`
- **Date Filter**: Today only (`created_at` >= start of day AND <= end of day)
- **Aggregations**:
  - Sum of `total_amount` for revenue
  - Count of orders for each status
  - Sum of `quantity` × `price` for item revenue

### State Management
- Local component state (useState)
- No global state management needed
- Real-time updates not implemented (manual refresh required)

### Security Considerations

⚠️ **Current Implementation**:
- Simple password stored in environment variable
- Password visible in client-side code
- No rate limiting on login attempts
- No session expiration
- localStorage can be inspected in browser DevTools

✅ **Suitable For**:
- Internal use only
- Trusted environment
- Shared device/tablet in kitchen/office

❌ **Not Suitable For**:
- Public internet access
- Multiple admin users with different permissions
- Sensitive operations requiring audit logs

### Production Recommendations

1. **Password Security**:
   ```bash
   # Use strong, unique password
   NEXT_PUBLIC_ADMIN_PASSWORD=YourVerySecurePassword123!@#
   ```

2. **Access Control**:
   - Restrict access via IP whitelist
   - Use VPN for remote access
   - Keep admin panel on internal network only

3. **Monitoring**:
   - Monitor for unusual activity
   - Regular password rotation
   - Backup database before bulk operations

4. **Upgrades** (for future):
   - Implement proper backend authentication
   - Add user roles and permissions
   - Session expiration and refresh tokens
   - Audit logs for menu changes
   - Rate limiting on login attempts

## Usage Guide

### Daily Operations

**Morning Setup**:
1. Login to admin panel
2. Check menu item availability
3. Mark items as unavailable if out of stock
4. Update prices if needed

**During Service**:
1. Monitor daily stats periodically
2. Identify popular items for restocking
3. Check order distribution by status

**End of Day**:
1. View final daily statistics
2. Note top-selling items
3. Plan inventory for next day

### Menu Management

**Adding Seasonal Items**:
1. Navigate to Menu Management tab
2. Click "Add Menu Item"
3. Fill in details with seasonal pricing
4. Mark as available
5. Add to appropriate category

**Updating Prices**:
1. Find item in menu list
2. Click "Edit"
3. Update price field
4. Click "Update Item"

**Managing Availability**:
1. Find item in menu list
2. Click "Edit"
3. Toggle "Available for ordering" checkbox
4. Click "Update Item"

## Troubleshooting

### Cannot Login
- Verify `NEXT_PUBLIC_ADMIN_PASSWORD` is set in `.env.local`
- Check for typos in password
- Clear browser localStorage and try again
- Restart development server after env changes

### Menu Items Not Loading
- Check Supabase connection
- Verify `menu_items` table exists
- Check browser console for errors
- Ensure Supabase RLS policies allow public read access

### Stats Not Displaying
- Click "Refresh" button
- Check if orders exist for today
- Verify `orders` and `order_items` tables have data
- Check browser console for errors

### Price Display Issues
- Ensure prices are entered as whole rupees (e.g., 299)
- Check database stores values in paise (e.g., 29900)
- Division by 100 happens in display logic

## API Reference

### Supabase Queries

**Fetch Menu Items**:
```typescript
const { data, error } = await supabase
  .from('menu_items')
  .select('*')
  .order('category', { ascending: true })
  .order('name', { ascending: true });
```

**Add Menu Item**:
```typescript
const { error } = await supabase
  .from('menu_items')
  .insert([{
    name: string,
    category: string,
    price: number, // in paise
    description: string | null,
    image_url: string | null,
    is_available: boolean
  }]);
```

**Update Menu Item**:
```typescript
const { error } = await supabase
  .from('menu_items')
  .update({ /* fields */ })
  .eq('id', itemId);
```

**Delete Menu Item**:
```typescript
const { error } = await supabase
  .from('menu_items')
  .delete()
  .eq('id', itemId);
```

**Fetch Daily Stats**:
```typescript
const today = new Date().toISOString().split('T')[0];
const { data: orders } = await supabase
  .from('orders')
  .select(`
    *,
    order_items (
      quantity,
      price,
      menu_items (name)
    )
  `)
  .gte('created_at', `${today}T00:00:00`)
  .lte('created_at', `${today}T23:59:59`);
```

## Future Enhancements

### Planned Features
- [ ] Real-time stats updates (Supabase Realtime)
- [ ] Date range selector for historical stats
- [ ] Export stats to CSV
- [ ] Bulk menu item operations
- [ ] Category management (add/edit/delete categories)
- [ ] Menu item images upload to Supabase Storage
- [ ] Order management (view/cancel/refund orders)
- [ ] Customer feedback viewing
- [ ] Staff management
- [ ] Multi-user roles and permissions

### Security Improvements
- [ ] Backend API authentication
- [ ] JWT tokens with expiration
- [ ] Password hashing
- [ ] Rate limiting
- [ ] Audit logs
- [ ] 2FA support
- [ ] Password reset flow
- [ ] Session management

## Related Documentation
- [Simple Password Authentication](./SIMPLE-PASSWORD-AUTH.md)
- [Real-time Setup](./REALTIME-SETUP.md)
- [Database Schema](./DATABASE-SCHEMA.md)
