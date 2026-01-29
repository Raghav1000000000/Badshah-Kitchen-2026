# 🔑 Kitchen Password Setup - Quick Reference

## Current Password
```
Kitchen2026!Secure
```

## How to Login
1. Go to: http://localhost:3000/kitchen
2. Enter password: `Kitchen2026!Secure`
3. Click **Access Kitchen**

## How to Logout
- Click **Logout** button in kitchen header
- Confirms before logging out

## For Kitchen Staff
- **Login Page**: `/kitchen/login`
- **Kitchen Dashboard**: `/kitchen`
- Password is shared among all kitchen staff
- Stay logged in after refresh until logout

## For Developers

### Change Password
Edit `.env.local`:
```bash
NEXT_PUBLIC_KITCHEN_PASSWORD=YourNewPassword
```
Then restart server:
```bash
npm run dev
```

### Default Password
If `NEXT_PUBLIC_KITCHEN_PASSWORD` is not set: **`kitchen123`**

### Remove Password (open access)
Delete or comment out the line in `.env.local`:
```bash
# NEXT_PUBLIC_KITCHEN_PASSWORD=Kitchen2026!Secure
```
Default `kitchen123` will be used.

## Troubleshooting

### Can't Login?
1. Check password is correct (case-sensitive)
2. Server restarted after env change?
3. Clear localStorage: `localStorage.removeItem('kitchen_auth')`

### Stuck at Login?
- Check browser console for errors
- Try private/incognito window
- Clear cookies and try again

## Security Notes
- ⚠️ Password is visible in env file (don't commit `.env.local`)
- ⚠️ Frontend-only auth (not suitable for public internet)
- ✅ Perfect for internal kitchen tablet/terminal
- ✅ No database changes needed

## Files Changed
- [lib/kitchenAuth.tsx](lib/kitchenAuth.tsx) - Auth context
- [app/kitchen/login/page.tsx](app/kitchen/login/page.tsx) - Login form
- [app/kitchen/page.tsx](app/kitchen/page.tsx) - Protected page
- [.env.local](.env.local) - Password configuration

## Full Documentation
See [docs/SIMPLE-PASSWORD-AUTH.md](docs/SIMPLE-PASSWORD-AUTH.md)
