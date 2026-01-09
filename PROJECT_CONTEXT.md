# PROJECT CONTEXT — Badshah's Kitchen App

## Project Overview

**App Name:** Badshah's Kitchen

**Type:** Restaurant POS/Ordering System (Web-based)

**Tech Stack:**

- Next.js 16.1.1 (React 19, TypeScript)
- Tailwind CSS v4 + PostCSS
- Supabase (PostgreSQL backend)
- Real-time subscriptions for live order updates

**Purpose:** A modern, mobile-friendly system to:

1. **Customers** view menu, add items to cart, and place orders
2. **Kitchen staff** see real-time pending orders and mark them complete
3. **Admin staff** manage menu items (add, remove, price updates, availability)

---

## Project Structure

```text
badshahs-kitchen/
├── app/
│   ├── layout.tsx              # Root layout (Geist fonts, metadata)
│   ├── page.tsx                # Home → redirects to /menu
│   ├── globals.css             # Global styles (Tailwind)
│   ├── favicon.ico
│   │
│   ├── menu/
│   │   └── page.tsx            # Customer menu page (client)
│   │
│   ├── cart/
│   │   └── page.tsx            # Cart + checkout form (client)
│   │
│   ├── admin/
│   │   └── menu/
│   │       └── page.tsx        # Admin menu management (client)
│   │
│   └── kitchen/
│       └── page.tsx            # Kitchen display (real-time orders)
│
├── lib/
│   └── supabase.ts             # Supabase client initialization
│
├── public/                      # Static assets
│
├── package.json                # Dependencies & scripts
├── tsconfig.json               # TypeScript config
├── next.config.ts              # Next.js config
├── tailwind.config.ts          # Tailwind CSS config
├── postcss.config.mjs          # PostCSS config
├── eslint.config.mjs           # ESLint rules
├── .env.local                  # Environment variables (local only)
└── README.md
```

---

## Pages & Routes

### 1. `/menu` — Customer Menu Page

**File:** `app/menu/page.tsx`

**Type:** Client Component

**Features:**

- Fetches menu items from Supabase `menu` table (only available items)
- Displays items grouped by category (tea, coffee, food, etc.)
- Shows item name, price, and category
- Add/remove items from cart (±1 button, quantity display)
- Saves cart to `localStorage` on change
- Fixed "Go to Cart" button at bottom (visible when cart has items)
- Navigates to `/cart` when clicked

**State:**

- `menu: MenuItem[]` — from Supabase
- `cart: any[]` — from localStorage, each item has `id, name, price, qty`

**Data Source:** Supabase `menu` table, ordered by category

---

### 2. `/cart` — Checkout Page

**File:** `app/cart/page.tsx`

**Type:** Client Component

**Features:**

- Displays items in cart with quantities and total price
- Form to collect customer details: **Name, Phone (10-digit), Table Number (1-15)**
- Validates:
  - Cart is not empty
  - Name is filled
  - Phone is exactly 10 digits
  - Table is selected
- "Place Order" button:
  1. Inserts a row into `orders` table
  2. Inserts rows into `order_items` table (one per cart item)
  3. Saves customer details to `localStorage` (name, phone, table)
  4. Clears cart from `localStorage`
  5. Redirects to `/menu` with success alert
- Loading state during submission
- Responsive mobile-first design

**State:**

- `cart: any[]` — from localStorage
- `name, phone, table: string` — form inputs
- `loading: boolean` — submission state

**Database Writes:**

- `orders` — one insert per order placement
- `order_items` — multiple inserts (one per cart item)

---

### 3. `/admin/menu` — Menu Management Page

**File:** `app/admin/menu/page.tsx`

**Type:** Client Component

**Features:**

- Displays all menu items (including unavailable ones)
- Add new items:
  - Input fields: Item name, Price (number), Category
  - Button inserts into `menu` table with `available: true`
- For each item:
  - Edit price (inline number input + blur to update)
  - Toggle availability ON/OFF (button)
  - Displays category and current price
- Ordered by category

**State:**

- `menu: MenuItem[]` — all menu items from Supabase
- `name, price, category: string` — form inputs for new item

**Database Operations:**

- `INSERT` — add new menu item
- `UPDATE` — change price
- `UPDATE` — toggle `available` boolean

---

### 4. `/kitchen` — Kitchen Display (Real-time Orders)

**File:** `app/kitchen/page.tsx`

**Type:** Client Component

**Features:**

- Displays all orders from the past 24 hours
- Orders listed in reverse chronological order (newest first)
- Each order card shows:
  - Customer name
  - Table number
  - Phone number
  - List of items (qty × item_name)
  - Status badge (color-coded)
  - "Complete" button (only if pending)
- Completed orders have grayed-out background; pending are green
- **Real-time updates** via Supabase Realtime:
  - Listens on `orders` table for INSERT/UPDATE/DELETE
  - Auto-refetch orders when changes detected
- Black background, white text (optimized for kitchen display)

**State:**

- `orders: Order[]` — with nested `order_items`

**Real-time Subscription:**

- Channel: `orders-realtime`
- Event: `postgres_changes` on `public.orders`
- Callback: refetch orders

---

### 5. `/` — Home Page

**File:** `app/page.tsx`

**Type:** Server Component

**Action:** Redirects to `/menu`

---

## Database Schema (Supabase PostgreSQL)

### Table: `menu`

```sql
CREATE TABLE menu (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  category VARCHAR(100),
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Fields:**

- `id` — unique identifier
- `name` — item name (e.g., "Chai", "Samosa")
- `price` — selling price
- `category` — grouping (e.g., "tea", "coffee", "food")
- `available` — soft delete; used to hide items
- `created_at, updated_at` — timestamps

---

### Table: `orders`

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name VARCHAR(255) NOT NULL,
  phone VARCHAR(10) NOT NULL,
  table_number INT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Fields:**

- `id` — unique order identifier
- `customer_name` — customer's name
- `phone` — customer's phone (10 digits)
- `table_number` — table number (1-15)
- `status` — order status (pending, completed)
- `created_at, updated_at` — timestamps

---

### Table: `order_items`

```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_name VARCHAR(255) NOT NULL,
  qty INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Fields:**

- `id` — unique item identifier
- `order_id` — foreign key to `orders.id`
- `item_name` — name of the item at time of order
- `qty` — quantity ordered
- `price` — price per unit at time of order
- `created_at` — timestamp

---

## Data Flow

### Customer Order Flow

1. User visits `/menu`
2. App fetches menu items from Supabase (category filtered, available only)
3. User adds items to cart (stored in `localStorage`)
4. User navigates to `/cart`
5. User fills name, phone, table number
6. On submit:
   - Validate inputs
   - Insert to `orders` table → get `order.id`
   - Map cart items and insert to `order_items` table
   - Clear `localStorage['cart']`
   - Redirect to `/menu`

### Kitchen Display Flow

1. Kitchen staff visits `/kitchen`
2. App fetches all orders from past 24 hours (with nested items)
3. Supabase Realtime subscription is active
4. When new order is placed:
   - Realtime event triggers
   - App refetches all orders
   - New order appears on screen
5. When "Complete" button clicked:
   - Update `orders.status` to 'completed'
   - Card background changes to gray
   - Button disappears

### Admin Menu Flow

1. Admin visits `/admin/menu`
2. App fetches all menu items
3. Admin can:
   - Add new items (name + price + category → insert)
   - Edit price (number input blur → update)
   - Toggle availability (button → update)
4. Changes are immediately visible

---

## Environment Variables

**File:** `.env.local` (git-ignored, local only)

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyxxxxx
```

**Notes:**

- Both are `NEXT_PUBLIC_*` (safe to expose in client code)
- Supabase provides these in project settings
- All client-side operations use the anon key
- Row-level security (RLS) policies must be configured in Supabase to secure data

---

## Key Dependencies

```json
{
  "next": "16.1.1",
  "react": "19.2.3",
  "react-dom": "19.2.3",
  "@supabase/supabase-js": "^2.90.1"
}
```

**Dev Dependencies:**

- `tailwindcss` v4
- `postcss`
- `typescript` v5
- `eslint` + `eslint-config-next`
- `@types/react`, `@types/node`, etc.

---

## Running the App

```bash
# Install dependencies
npm install

# Run development server
npm run dev
# Visit: http://localhost:3000

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

---

## Code Architecture Notes

### Client vs Server Components

- **Server Components (default):** `app/layout.tsx`, `app/page.tsx`
- **Client Components:** `app/menu/page.tsx`, `app/cart/page.tsx`, `app/admin/menu/page.tsx`, `app/kitchen/page.tsx`
  - Need `'use client'` at top because they use hooks (useState, useEffect, useRouter)

### State Management

- **localStorage:** Used for cart and customer data (persists across page reloads)
- **useState:** Component-level state (menu items, cart, form inputs)
- **Supabase queries:** Real-time data fetching and subscriptions

### Styling

- Tailwind CSS utility classes throughout
- Mobile-first responsive design
- Color scheme:
  - Green for action buttons (add, order, complete)
  - Gray for disabled/inactive states
  - Black for kitchen display
  - Stone/beige background for customer-facing pages

### Error Handling

- Basic alerts for validation errors and DB failures
- Console logging for debugging
- No custom error boundary yet

---

## Current Limitations & Future Enhancements

### Limitations

1. No authentication — anyone can access admin/kitchen pages
2. No order history for customers
3. No payment integration
4. No email/SMS notifications
5. No image support for menu items
6. Limited error messages (basic alerts)
7. No undo/redo for order corrections

### Suggested Enhancements

1. **Auth:** Add role-based access control (customer, admin, kitchen staff)
2. **Order History:** Add `/orders` page for customers to see past orders
3. **Payments:** Integrate Stripe or similar
4. **Notifications:** Real-time alerts to kitchen when new orders arrive
5. **Menu Images:** Add photo upload for items
6. **Statistics:** Dashboard with sales, popular items, peak hours
7. **QR Codes:** Table-based QR code for quick menu access
8. **Multi-language:** Support for Hindi/regional languages
9. **Printing:** Receipt generation and thermal printer support
10. **Search/Filter:** Advanced menu filtering by category, price, dietary needs

---

## How ChatGPT Should Guide You

### When asking for help

1. **Feature requests:** "Add [feature] to [page]"
   - I'll identify what data is needed, which table(s) to query, and provide working code

2. **Bug fixes:** "Fix [issue] on [page]"
   - I'll read the relevant file, diagnose, and provide a corrected version

3. **Database changes:** "Add [field] to [table]" or "Create [new table]"
   - I'll provide SQL migration commands and update affected pages

4. **Performance:** "Optimize [page] for [metric]"
   - I'll suggest caching strategies, query optimizations, or UI improvements

5. **Security:** "Secure [operation]"
   - I'll recommend RLS policies, input validation, and best practices

6. **Style changes:** "Make [page] look [description]"
   - I'll suggest Tailwind classes or refactor CSS

### Best Practices I Follow

- Keep all components TypeScript-compliant
- Use Supabase `lib/supabase.ts` client (no re-initialization)
- Preserve `localStorage` patterns for cart data
- Maintain mobile-first Tailwind design
- Include error handling and loading states
- Add console logs for debugging
- Update related pages if a table structure changes

### Examples of Detailed Requests

```text
"Add a 'View All Orders' page at /orders for admin to filter orders by date range and status"

"Implement search functionality on the menu page to filter items by name"

"Add a discount field to orders and calculate the final total after discount"

"Integrate Razorpay payment on the cart page and capture payment before inserting order"

"Add a 'Most Popular Items' section on the menu showing top 5 items ordered"
```

---

## Quick Debug Checklist

- [ ] `.env.local` has correct Supabase URL and anon key
- [ ] Supabase database tables exist with correct schema
- [ ] Supabase RLS policies allow public access (or configure auth)
- [ ] Realtime subscriptions are enabled in Supabase (settings > Realtime)
- [ ] No console errors — check browser DevTools
- [ ] Cart data is saving to localStorage — check DevTools Storage tab
- [ ] Menu items are fetching — check Network tab for Supabase API calls
- [ ] `npm run dev` is running on port 3000

---

**Last Updated:** January 9, 2026

**Status:** MVP ready for testing and feedback
