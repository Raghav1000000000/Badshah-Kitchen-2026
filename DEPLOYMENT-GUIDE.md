# 🚀 Phase 1 Deployment Guide - Vercel

## ✅ Pre-Deployment Checklist

### 1. Code Status
- ✅ Build successful (`npm run build` passes)
- ✅ No TypeScript errors
- ✅ All ESLint issues resolved
- ✅ Latest code pushed to GitHub

### 2. Database Status
- ⚠️ **IMPORTANT**: Run SQL migrations before deployment
- Required migration: `docs/add-price-and-feedback.sql`

### 3. Features Included in Phase 1
- ✅ Customer ordering page (mobile-first)
- ✅ Menu browsing by category
- ✅ Shopping cart with localStorage
- ✅ Order placement
- ✅ Order tracking page
- ✅ Bill/receipt page with feedback
- ✅ Kitchen dashboard with order management
- ✅ Admin panel with menu CRUD
- ✅ Admin dashboard with stats and clickable details
- ✅ Real-time order updates
- ✅ Simple password authentication (Kitchen + Admin)
- ✅ Cafe theme (stone, amber, green colors)

---

## 📋 Step-by-Step Deployment

### Step 1: Run Database Migration (CRITICAL)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to: **SQL Editor**
3. Copy and paste the SQL from `docs/add-price-and-feedback.sql`
4. Click **Run** to execute the migration
5. Verify the output shows successful execution

**What this migration does:**
- Creates `feedback` table with `created_at` column
- Adds RLS policies for feedback
- Adds `price_at_time` column to `order_items`

### Step 2: Enable Realtime (if not already done)

1. In Supabase Dashboard, go to: **Database** → **Replication**
2. Enable replication for these tables:
   - ✅ `orders`
   - ✅ `menu_items`
3. Save changes

### Step 3: Deploy to Vercel

#### Option A: Using Vercel CLI (Recommended)

```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
cd "c:\Users\ragha\OneDrive\Desktop\WEB agency\Badshahs Kitchen"
vercel
```

Follow the prompts:
- **Set up and deploy?** → Yes
- **Which scope?** → Your account
- **Link to existing project?** → No (first time) / Yes (subsequent deployments)
- **Project name?** → `badshahs-kitchen` (or your preferred name)
- **Directory?** → `./` (current directory)
- **Override settings?** → No

#### Option B: Using Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click **Add New** → **Project**
3. Import your GitHub repository: `Raghav1000000000/Badshah-Kitchen-2026`
4. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

### Step 4: Add Environment Variables in Vercel

In Vercel Dashboard → **Settings** → **Environment Variables**, add:

```env
NEXT_PUBLIC_SUPABASE_URL=https://aazusnehgxgoztqbkdhn.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhenVzbmVoZ3hnb3p0cWJrZGhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzNTA2NTYsImV4cCI6MjA4NDkyNjY1Nn0.yb1j8nb29DG5hkElugVGFieYY6ZPCvZGBMqCGUOkNc4

NEXT_PUBLIC_KITCHEN_PASSWORD=Kitchen2026!Secure

NEXT_PUBLIC_ADMIN_PASSWORD=Admin2026!Secure
```

**⚠️ SECURITY**: Change the default passwords to stronger ones for production!

### Step 5: Deploy

Click **Deploy** button in Vercel Dashboard.

Wait for deployment to complete (usually 2-3 minutes).

---

## 🧪 Post-Deployment Testing

### 1. Customer Flow
1. Visit your Vercel URL (e.g., `https://badshahs-kitchen.vercel.app`)
2. Enter customer details (name, phone)
3. Browse menu items
4. Add items to cart
5. Place order
6. Check order status in "My Orders"
7. View bill and submit feedback

### 2. Kitchen Flow
1. Go to `/kitchen`
2. Login with: `Kitchen2026!Secure` (or your custom password)
3. Verify orders appear
4. Test status updates: PLACED → ACCEPTED → PREPARING → READY → COMPLETED
5. Check real-time updates (open in two tabs)

### 3. Admin Flow
1. Go to `/admin`
2. Login with: `Admin2026!Secure` (or your custom password)
3. Test menu CRUD:
   - Add new item
   - Edit existing item
   - Delete item
4. View statistics tab
5. Click on feedback section → verify modal appears
6. Click on order status → verify orders appear

---

## 🔍 Common Issues & Solutions

### Issue 1: "column feedback.created_at does not exist"
**Solution**: Run the SQL migration in Step 1

### Issue 2: Orders not updating in real-time
**Solution**: Enable Realtime replication in Supabase (Step 2)

### Issue 3: 401 Unauthorized errors
**Solution**: Check environment variables are set correctly in Vercel

### Issue 4: Kitchen/Admin login not working
**Solution**: Verify `NEXT_PUBLIC_KITCHEN_PASSWORD` and `NEXT_PUBLIC_ADMIN_PASSWORD` are set

### Issue 5: Menu items not loading
**Solution**: Check RLS policies in Supabase are enabled for `menu_items` table

---

## 📱 URLs to Test

After deployment, you'll have these pages:

- **Customer App**: `https://your-app.vercel.app/`
- **Order Tracking**: `https://your-app.vercel.app/orders`
- **Kitchen Dashboard**: `https://your-app.vercel.app/kitchen`
- **Admin Panel**: `https://your-app.vercel.app/admin`

---

## 🔐 Security Recommendations

### Before Going Live:

1. **Change default passwords** in Vercel environment variables
2. **Review RLS policies** in Supabase for all tables
3. **Enable API rate limiting** in Supabase if available
4. **Add custom domain** in Vercel (optional but recommended)
5. **Test thoroughly** with real devices (mobile phones, tablets)

### Recommended Password Changes:

```env
# Generate strong passwords (16+ characters)
NEXT_PUBLIC_KITCHEN_PASSWORD=YourStrongKitchenPassword123!@#
NEXT_PUBLIC_ADMIN_PASSWORD=YourStrongAdminPassword456!@#
```

---

## 📊 What's Working in Phase 1

### Customer Features
- ✅ Browse menu by category
- ✅ Add items to cart
- ✅ Place orders with contact info
- ✅ Track order status (real-time)
- ✅ View order history
- ✅ Submit feedback with ratings

### Kitchen Features
- ✅ View active orders
- ✅ Filter by status (All, Placed, Accepted, Preparing, Ready, Completed)
- ✅ Update order status
- ✅ Reject orders
- ✅ Real-time order updates

### Admin Features
- ✅ Menu management (CRUD operations)
- ✅ Custom categories
- ✅ Daily statistics dashboard
- ✅ Clickable stats sections:
  - View all feedback details
  - View orders by status
- ✅ Real-time metrics

### Technical Features
- ✅ Mobile-first responsive design
- ✅ Cafe theme colors (stone, amber, green)
- ✅ Real-time database subscriptions
- ✅ Simple password authentication
- ✅ localStorage for cart and session
- ✅ Indian timezone support
- ✅ Smooth animations

---

## 🚀 Quick Deploy Command

```bash
# One-command deployment (after completing Steps 1-2)
cd "c:\Users\ragha\OneDrive\Desktop\WEB agency\Badshahs Kitchen"
git add .
git commit -m "Ready for Phase 1 deployment"
git push
vercel --prod
```

---

## 📝 Post-Deployment Checklist

After deployment completes:

- [ ] Visit customer page and place a test order
- [ ] Check kitchen dashboard shows the order
- [ ] Update order status through all stages
- [ ] Verify order status updates in customer view
- [ ] Submit feedback on completed order
- [ ] Check admin panel statistics
- [ ] Click feedback section in admin stats
- [ ] Test menu CRUD in admin panel
- [ ] Test on mobile device
- [ ] Test on tablet
- [ ] Share URLs with stakeholders

---

## 🎉 You're Live!

Once all tests pass, your Badshah's Kitchen app is live and ready to accept real orders!

**Next Phase Ideas:**
- Payment integration
- Order history analytics
- Customer accounts
- SMS/Email notifications
- Kitchen printer integration
- Multi-location support

---

## 📞 Support

If you encounter issues during deployment:
1. Check the error logs in Vercel Dashboard → **Deployments** → **View Function Logs**
2. Check Supabase logs in Dashboard → **Logs**
3. Review this guide's "Common Issues & Solutions" section
