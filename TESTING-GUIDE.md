# Flow Testing Guide for Badshah's Kitchen

## 🧪 Testing Checklist

### 1. Initial Page Load
- [ ] Page loads at `http://localhost:3000`
- [ ] Menu items appear (fetched from Supabase)
- [ ] Category filter shows (All, Coffee, Tea, etc.)
- [ ] No errors in browser console (F12)
- [ ] Session ID is generated in localStorage

**Expected**: Menu displays with "All" category selected

---

### 2. Browse Menu
- [ ] Click different categories
- [ ] Menu items filter correctly
- [ ] Can see item names and prices
- [ ] "Add to Cart" button appears on each item

**Expected**: Only items from selected category show

---

### 3. Add Items to Cart
- [ ] Click "Add to Cart" on any item
- [ ] Cart footer appears at bottom
- [ ] Item appears in cart with quantity 1
- [ ] Click + to increase quantity
- [ ] Click - to decrease quantity
- [ ] Total price updates correctly

**Expected**: Cart shows items with correct math

---

### 4. Checkout Flow (First Time User)
- [ ] Click "Checkout" button in cart footer
- [ ] Redirects to `/checkout` page
- [ ] Cart items display correctly
- [ ] "Add Customer Information" button shows
- [ ] Click to add customer info
- [ ] Modal form appears
- [ ] Enter name and phone (10+ chars)
- [ ] Click "Continue"
- [ ] Customer info saves and displays

**Expected**: Customer info stored in localStorage

---

### 5. Place Order
- [ ] Customer info displays on checkout page
- [ ] Cart summary shows all items
- [ ] Total amount is correct
- [ ] Click "Place Order" button
- [ ] Success alert appears with Order ID
- [ ] Redirects to `/orders` page
- [ ] New order appears in list
- [ ] Cart is cleared

**Expected**: Order appears in database and order history

---

### 6. View Order History
- [ ] Go to `/orders` page (or click "Orders" in header)
- [ ] All orders for current session appear
- [ ] Each order shows:
  - Order ID
  - Customer name
  - Total amount
  - Status (PLACED)
  - Date/time
  - List of items

**Expected**: Only orders from this browser session show

---

### 7. Return and Order Again
- [ ] Click "Back to Menu"
- [ ] Menu loads normally
- [ ] Add different items to cart
- [ ] Click "Checkout"
- [ ] Customer info pre-filled (from previous order)
- [ ] Can edit customer info if needed
- [ ] Place second order
- [ ] Both orders appear in history

**Expected**: Customer info persists between orders

---

### 8. Logout Flow
- [ ] Click "Logout" in header (only shows if logged in)
- [ ] Confirmation dialog appears
- [ ] Confirm logout
- [ ] Cart is cleared
- [ ] Customer info is cleared
- [ ] Page reloads
- [ ] New session ID generated
- [ ] Previous order history NOT visible
- [ ] Logout button disappears

**Expected**: Complete session reset, fresh start

---

## 🐛 Common Issues & Solutions

### Issue: Page is blank
**Solution**: 
1. Check browser console for errors (F12)
2. Verify Supabase credentials in `.env.local`
3. Run: `node test-supabase-connection.js`
4. Check if menu_items table has data

### Issue: Can't add to cart
**Solution**:
1. Check if sessionId is initialized
2. Open DevTools → Application → Local Storage
3. Verify `session_id` exists

### Issue: Order submission fails
**Solution**:
1. Check browser console for errors
2. Verify RLS policies are enabled in Supabase
3. Check customer name/phone are filled
4. Verify cart is not empty

### Issue: Checkout page shows empty cart
**Solution**:
1. Check sessionStorage for `cart` key
2. Add items to cart on home page first
3. Verify cart saves to sessionStorage on change

### Issue: Order history is empty
**Solution**:
1. Verify orders exist in Supabase dashboard
2. Check if `session_id` in orders matches current session
3. Look for errors in browser console

---

## 🔍 Debugging Tools

### Check localStorage
```javascript
// In browser console (F12)
console.log('Session:', localStorage.getItem('session_id'));
console.log('Customer:', localStorage.getItem('customer_name'));
console.log('Phone:', localStorage.getItem('customer_phone'));
```

### Check sessionStorage
```javascript
// In browser console
console.log('Cart:', sessionStorage.getItem('cart'));
```

### Check Supabase Data
```javascript
// In browser console
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('YOUR_URL', 'YOUR_KEY');

// Check menu
const { data } = await supabase.from('menu_items').select('*');
console.log('Menu:', data);

// Check orders for current session
const sessionId = localStorage.getItem('session_id');
const { data: orders } = await supabase.from('orders').select('*').eq('session_id', sessionId);
console.log('Orders:', orders);
```

---

## ✅ Expected Behavior Summary

### User Flow 1: New Customer
1. Open app → See menu
2. Add items → Cart appears
3. Click Checkout → Redirect to /checkout
4. Add customer info → Form modal
5. Place order → Success + redirect to /orders
6. See order history → Order with details

### User Flow 2: Returning Customer (Same Session)
1. Open app → See menu
2. Add items → Cart appears
3. Click Checkout → Customer info pre-filled
4. Place order → Success
5. Orders page shows all orders from this session

### User Flow 3: Logout and Fresh Start
1. Click Logout → Confirm
2. Page reloads → New session
3. Old orders not visible
4. Cart cleared
5. Must re-enter customer info for new orders

---

## 🔧 Quick Fixes

### Reset Everything
```javascript
// In browser console
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### Manually Set Test Data
```javascript
// In browser console
localStorage.setItem('session_id', crypto.randomUUID());
localStorage.setItem('customer_name', 'Test User');
localStorage.setItem('customer_phone', '1234567890');
```

### View Current State
```javascript
// In browser console
console.table({
  sessionId: localStorage.getItem('session_id'),
  customerName: localStorage.getItem('customer_name'),
  customerPhone: localStorage.getItem('customer_phone'),
  cart: sessionStorage.getItem('cart')
});
```
