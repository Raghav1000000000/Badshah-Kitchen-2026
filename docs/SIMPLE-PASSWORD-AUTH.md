# 🔐 Simple Password-Only Kitchen Authentication

## Overview

Secure kitchen page access with a **single shared password** - no user accounts, no database needed. Perfect for small kitchen teams.

## How It Works

- **Single Password**: Everyone uses the same kitchen password
- **localStorage**: Auth state persisted in browser
- **No Supabase Auth**: Simple frontend-only authentication
- **No RLS Changes**: Database remains unchanged

## Setup (2 Minutes)

### Step 1: Add Password to Environment

1. Open or create `.env.local` in your project root:

```bash
NEXT_PUBLIC_KITCHEN_PASSWORD=your_secret_password_here
```

2. **Choose a strong password** (minimum 8 characters)
   - Example: `Kitchen2026!Secure`
   - Don't use: `123456`, `password`, `kitchen`

### Step 2: Restart Development Server

```powershell
# Stop current server (Ctrl+C)
# Start again
npm run dev
```

### Step 3: Test It

1. Go to http://localhost:3000/kitchen
2. Should redirect to http://localhost:3000/kitchen/login
3. Enter your password from `.env.local`
4. Click **Access Kitchen**
5. Should redirect to kitchen page

## Default Password

If you don't set `NEXT_PUBLIC_KITCHEN_PASSWORD`, the default is: **`kitchen123`**

**⚠️ Change this for production!**

## Authentication Features

### ✅ Implemented

1. **Password Protection**
   - Kitchen page inaccessible without correct password
   - Auto-redirect to login if not authenticated
   - Protected route on frontend

2. **Session Persistence**
   - Auth state stored in localStorage
   - Stays logged in after page refresh
   - Survives browser restart (until logout)

3. **Logout Functionality**
   - Logout button in kitchen header
   - Clears localStorage auth state
   - Redirects to login page

4. **Clean UX**
   - Single password field (no email)
   - Large input for easy typing
   - Auto-focus on password field
   - Loading states
   - Error messages for wrong password

## File Changes

### [lib/kitchenAuth.tsx](lib/kitchenAuth.tsx)
- Removed Supabase Auth dependency
- Simple password comparison
- localStorage for auth state
- No user object, just `isAuthenticated` boolean

### [app/kitchen/login/page.tsx](app/kitchen/login/page.tsx)
- Removed email field
- Single password input
- Checks against `NEXT_PUBLIC_KITCHEN_PASSWORD`
- Shows env variable name for admins

### [app/kitchen/page.tsx](app/kitchen/page.tsx)
- Uses `isAuthenticated` instead of `user`
- Shows "Kitchen Staff" instead of email
- Synchronous logout (no await needed)

## Security Considerations

### ✅ Good for:
- Small kitchen teams (2-5 people)
- Internal use only (not internet-facing)
- Quick setup without database users
- Shared terminal/tablet in kitchen

### ⚠️ Limitations:
- **Frontend only**: Password visible in browser DevTools
- **No audit trail**: Can't track who made changes
- **Shared password**: Everyone uses same credentials
- **No password reset**: Must update `.env.local`

### 🔒 Improving Security

**Option 1: Use HTTPS in Production**
```bash
# Vercel/Netlify automatically provides HTTPS
# Password sent encrypted over network
```

**Option 2: Add IP Restriction**
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const ip = request.ip || request.headers.get('x-forwarded-for')
  const allowedIPs = ['192.168.1.100'] // Kitchen tablet IP
  
  if (request.nextUrl.pathname.startsWith('/kitchen')) {
    if (!allowedIPs.includes(ip)) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }
}
```

**Option 3: Hash Password (Optional)**
```typescript
// lib/kitchenAuth.tsx
import { createHash } from 'crypto'

const KITCHEN_PASSWORD_HASH = process.env.NEXT_PUBLIC_KITCHEN_PASSWORD_HASH

const signIn = async (password: string) => {
  const hash = createHash('sha256').update(password).digest('hex')
  if (hash === KITCHEN_PASSWORD_HASH) {
    localStorage.setItem(AUTH_KEY, 'true')
    setIsAuthenticated(true)
    return { error: null }
  }
  return { error: 'Invalid password' }
}
```

## Troubleshooting

### Issue: Can't login with correct password

**Check**:
- `.env.local` file exists in project root
- `NEXT_PUBLIC_KITCHEN_PASSWORD` is set correctly
- Dev server was restarted after adding env variable
- No extra spaces in password

**Fix**:
```bash
# Check env variable is loaded
echo $env:NEXT_PUBLIC_KITCHEN_PASSWORD  # PowerShell
# OR
echo %NEXT_PUBLIC_KITCHEN_PASSWORD%      # CMD

# Restart dev server
npm run dev
```

### Issue: Stays logged in even after wrong password

**Fix**:
```javascript
// Open browser DevTools Console
localStorage.removeItem('kitchen_auth')
// Refresh page
```

### Issue: Redirects to login immediately after logging in

**Check**:
- Browser has localStorage enabled
- Not in private/incognito mode
- No browser extensions blocking localStorage

**Fix**:
```javascript
// Test localStorage
localStorage.setItem('test', 'works')
console.log(localStorage.getItem('test')) // Should print 'works'
```

## Changing Password

1. **Update `.env.local`**:
   ```bash
   NEXT_PUBLIC_KITCHEN_PASSWORD=NewPassword2026!
   ```

2. **Restart server**:
   ```bash
   npm run dev
   ```

3. **All kitchen staff logout and login again** with new password

## For Deployment

### Vercel/Netlify

1. Go to project settings → Environment Variables
2. Add `NEXT_PUBLIC_KITCHEN_PASSWORD` with your password
3. Redeploy

### Docker

```dockerfile
ENV NEXT_PUBLIC_KITCHEN_PASSWORD=your_secret_password
```

### Environment Variable

```bash
# .env.production
NEXT_PUBLIC_KITCHEN_PASSWORD=production_password_here
```

## Upgrading to User Accounts Later

If you need individual user accounts, you can upgrade to:

1. **Supabase Auth** (user accounts, email/password)
2. **NextAuth.js** (OAuth, magic links)
3. **Auth0** (enterprise SSO)

The authentication context structure is already set up to support this migration.

## Comparison

| Feature | Simple Password | Supabase Auth |
|---------|----------------|---------------|
| Setup Time | 2 minutes | 15 minutes |
| User Management | None | Full dashboard |
| Audit Trail | No | Yes (who/when) |
| Password Reset | Manual | Automated emails |
| Multi-user | Shared password | Individual accounts |
| Security | Frontend only | Database-backed |
| Cost | Free | Free tier available |

## Summary

✅ **Simple password authentication implemented**  
✅ **No database changes needed**  
✅ **2-minute setup**  
✅ **Perfect for small teams**

**Next Steps**:
1. Set `NEXT_PUBLIC_KITCHEN_PASSWORD` in `.env.local`
2. Restart dev server
3. Test login at http://localhost:3000/kitchen
4. Share password with kitchen staff

---

**Created**: 2026-01-29  
**Authentication**: Password-only (localStorage)  
**Database**: Unchanged (no RLS updates needed)  
**Security Level**: Basic (suitable for internal use)
