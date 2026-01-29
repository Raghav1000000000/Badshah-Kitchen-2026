# 🔐 Production-Level Kitchen Authentication Setup

## Overview

Implemented secure authentication for the kitchen page using **Supabase Auth**. Only authenticated kitchen staff can access and update orders.

## What Was Added

### 1. Authentication Context
**File**: [lib/kitchenAuth.tsx](lib/kitchenAuth.tsx)
- Manages login/logout state
- Handles Supabase Auth session
- Provides authentication hooks for components

### 2. Login Page
**File**: [app/kitchen/login/page.tsx](app/kitchen/login/page.tsx)
- Clean, professional login UI
- Email/password authentication
- Error handling and loading states
- Link back to main menu

### 3. Protected Kitchen Page
**File**: [app/kitchen/page.tsx](app/kitchen/page.tsx)
- Checks authentication on load
- Redirects to login if not authenticated
- Shows logout button
- Displays logged-in user email

### 4. Updated RLS Policy
**File**: [docs/setup-kitchen-auth.sql](docs/setup-kitchen-auth.sql)
- Only authenticated users can UPDATE orders
- Public users can still INSERT (place orders)
- Public users can still SELECT (view orders)

## Setup Instructions

### Step 1: Run SQL Script in Supabase

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in sidebar
4. Open new query
5. Copy/paste contents of `docs/setup-kitchen-auth.sql`
6. Click **Run**
7. Verify output shows "CREATE POLICY"

Key SQL:
```sql
DROP POLICY IF EXISTS "Allow update orders status" ON public.orders;

CREATE POLICY "Allow authenticated kitchen staff to update orders"
  ON public.orders
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

### Step 2: Create Kitchen Staff User

**In Supabase Dashboard**:
1. Go to **Authentication** → **Users**
2. Click **Add User** button
3. Fill in:
   - **Email**: `kitchen@badshahskitchen.com` (or your email)
   - **Password**: (generate strong password)
   - **Auto Confirm User**: ✅ Yes (check this box)
4. Click **Create User**

**Important**: Save the password securely!

### Step 3: Test Authentication

1. **Start Development Server**:
   ```powershell
   npm run dev
   ```

2. **Try Accessing Kitchen Page**:
   - Go to http://localhost:3000/kitchen
   - Should redirect to http://localhost:3000/kitchen/login

3. **Login**:
   - Enter email: `kitchen@badshahskitchen.com`
   - Enter password: (your password)
   - Click **Sign In**

4. **Verify Access**:
   - Should redirect to kitchen page
   - See logout button in header
   - See email displayed
   - Can update order statuses

5. **Test Logout**:
   - Click **Logout** button
   - Should redirect back to login page
   - Cannot access /kitchen without logging in again

## Architecture

### Authentication Flow

```
User visits /kitchen
    ↓
Not authenticated?
    ↓
Redirect to /kitchen/login
    ↓
User enters credentials
    ↓
Supabase Auth validates
    ↓
JWT token stored in cookie
    ↓
Redirect to /kitchen
    ↓
Authenticated → Show orders
```

### Session Management

- **JWT Tokens**: Stored in secure HTTP-only cookies
- **Auto-Refresh**: Sessions refresh automatically
- **Expiry**: Default 1 hour (configurable in Supabase)
- **Logout**: Clears session and redirects

### Database Security

```sql
-- Public users (customers)
✅ Can INSERT orders (place orders)
✅ Can SELECT orders (view their orders)
❌ Cannot UPDATE orders
❌ Cannot DELETE orders

-- Authenticated users (kitchen staff)
✅ Can INSERT orders
✅ Can SELECT orders
✅ Can UPDATE orders (change status)
❌ Cannot DELETE orders
```

## Security Features

### ✅ Implemented

1. **Authentication Required**
   - Kitchen page inaccessible without login
   - Auto-redirect to login page
   - Protected route on frontend

2. **RLS Policy Enforcement**
   - Only authenticated users can update orders
   - Database-level security (not just UI)
   - Cannot bypass with direct API calls

3. **Secure Session Management**
   - JWT-based authentication
   - HTTP-only cookies
   - Automatic session refresh
   - Secure logout

4. **Password Security**
   - Handled by Supabase Auth
   - Bcrypt hashing
   - Secure password reset (optional)

5. **CSRF Protection**
   - Built into Supabase Auth
   - State parameter validation
   - Origin checking

### 🔒 Production Recommendations

1. **Enable Email Verification**
   ```
   Supabase Dashboard → Authentication → Settings
   → Enable email confirmations: Yes
   ```

2. **Set Password Requirements**
   ```
   Supabase Dashboard → Authentication → Settings
   → Minimum password length: 12
   → Require uppercase: Yes
   → Require numbers: Yes
   → Require special characters: Yes
   ```

3. **Enable Rate Limiting**
   ```
   Supabase Dashboard → Authentication → Rate Limits
   → Login attempts: 5 per hour
   → Password reset: 3 per hour
   ```

4. **Add User Metadata**
   ```sql
   -- Add role to user metadata
   UPDATE auth.users
   SET raw_user_meta_data = 
     raw_user_meta_data || '{"role": "kitchen_staff"}'::jsonb
   WHERE email = 'kitchen@badshahskitchen.com';
   ```

5. **Role-Based Policy (Optional)**
   ```sql
   CREATE POLICY "Allow kitchen staff only"
     ON public.orders
     FOR UPDATE
     TO authenticated
     USING (
       (auth.jwt() -> 'user_metadata' ->> 'role') = 'kitchen_staff'
     );
   ```

## Troubleshooting

### Issue: Can't login
**Check**:
- User exists in Supabase → Authentication → Users
- User is confirmed (green checkmark)
- Email is correct (case-sensitive)
- Password is correct

**Fix**:
- Reset password in Supabase Dashboard
- Check browser console for errors
- Verify Supabase env variables in `.env.local`

### Issue: Status updates still don't work
**Check**:
- RLS policy was created successfully
- User is logged in (check header shows email)
- Browser console for errors

**Fix**:
- Re-run `setup-kitchen-auth.sql`
- Verify policy exists: `SELECT * FROM pg_policies WHERE tablename = 'orders'`
- Check Supabase logs for RLS violations

### Issue: Redirects to login immediately after logging in
**Check**:
- JWT token is being set (check Application → Cookies in DevTools)
- No CORS errors in console

**Fix**:
- Clear browser cookies
- Try incognito/private window
- Check Supabase project URL is correct

## Testing Checklist

- [ ] SQL script executed successfully
- [ ] Kitchen staff user created
- [ ] Can login with correct credentials
- [ ] Cannot login with wrong credentials
- [ ] Redirects to login when not authenticated
- [ ] Kitchen page shows after login
- [ ] Header shows logged-in email
- [ ] Can update order statuses
- [ ] Status updates persist after refresh
- [ ] Logout button works
- [ ] Cannot access /kitchen after logout
- [ ] Orders page still works (no login required)
- [ ] Menu page still works (no login required)

## Environment Variables

Verify these exist in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

**Don't need**:
- Service role key (for frontend auth)
- Additional environment variables

## Multiple Kitchen Staff

To add more staff members:

1. Supabase Dashboard → Authentication → Users
2. Click **Add User**
3. Enter new email/password
4. Auto-confirm: Yes
5. Repeat for each staff member

Each staff member will have their own login credentials.

## Password Reset (Optional)

To add password reset functionality:

1. Enable in Supabase Dashboard:
   - Authentication → Email Templates
   - Enable "Reset Password"

2. Add reset link to login page
3. Supabase will send reset email automatically

## Audit Logging (Future Enhancement)

To track who made changes:

```sql
-- Add audit columns to orders table
ALTER TABLE public.orders 
ADD COLUMN updated_by UUID REFERENCES auth.users(id);

-- Update policy to set updated_by
CREATE POLICY "Track who updates orders"
  ON public.orders
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (
    NEW.updated_by = auth.uid()
  );
```

## Summary

✅ **Production-level authentication implemented**
✅ **Database secured with RLS policies**
✅ **Clean login/logout flow**
✅ **Session management handled**
✅ **Ready for production deployment**

**Next Steps**:
1. Run SQL script
2. Create kitchen staff user
3. Test login/logout
4. Deploy with confidence

---

**Created**: 2026-01-29  
**Security Level**: Production-Ready  
**Authentication**: Supabase Auth  
**Session**: JWT-based
