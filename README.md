# Badshah's Kitchen - Café Ordering App

A mobile-first café ordering application built with Next.js 15, App Router, and Tailwind CSS.

## Features

- **Browse Menu**: View café items organized by categories (Coffee, Pastries, Food, Beverages)
- **Filter by Category**: Quickly find what you're looking for
- **Shopping Cart**: Add items, adjust quantities, and view total (client-side only)
- **Simple Checkout**: Place orders with a single click
- **Session Tracking**: Persistent device session using localStorage (no auth required)
- **Mobile-First Design**: Optimized for mobile devices with responsive layout

## Cart Behavior

**Important:** The cart is intentionally ephemeral and client-side only:
- ✅ Lives in React component state (memory)
- ✅ Stores full menu item data for display (name, price, category)
- ✅ No database writes or persistence
- ✅ Automatically cleared after order placement
- ✅ Resets on page refresh
- ✅ Safe to clear at any time

**Order Submission Structure:**
When placing an order, cart data is transformed for database insertion:
- `orders` table: stores session_id, customer info, total_amount (calculated), status
- `order_items` table: stores only menu_item_id (from cart item.id) and quantity
- Cart's full MenuItem data (name, price, category) is NOT stored in order_items

This is a demo app. For production, you'd add localStorage persistence, API integration, and payment processing.

## Tech Stack

- **Next.js 15** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **React 19** for UI components
- **Supabase** for database (menu items and orders)

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Supabase

Create a `.env.local` file in the root directory:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Get these values from your Supabase project settings.

### 3. Run the development server

```bash
npm run dev
```

### 4. Open the app

Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
app/
├── layout.tsx      # Root layout with SessionProvider wrapper
├── page.tsx        # Main ordering page with menu and cart
└── globals.css     # Global styles and Tailwind imports
lib/
├── session.ts      # Session management helper (localStorage)
├── SessionContext.tsx  # React Context for session access
├── customerIdentity.ts # Customer name/phone storage (localStorage)
├── cartUtils.ts    # Cart calculation and validation utilities
├── orderUtils.ts   # Order preparation utilities
├── orderSubmission.ts # Order submission to database
└── supabase.ts     # Supabase client configuration
types/
└── cart.ts         # TypeScript types for cart functionality
components/
└── SessionExample.tsx  # Example usage of useSession hook
```

## Session Management

The app includes a simple React Context-based session system that makes `session_id` available to all client components:

**Files:**
- `lib/session.ts` - Low-level localStorage helper
- `lib/SessionContext.tsx` - React Context Provider & hook
- `lib/customerIdentity.ts` - Customer name/phone localStorage helper

**Setup (already done):**
```typescript
// app/layout.tsx wraps the app with SessionProvider
<SessionProvider>
  {children}
</SessionProvider>
```

### Usage in Any Component

```typescript
import { useSession } from "@/lib/SessionContext";

function MyComponent() {
  const { sessionId, isLoading, clearSession } = useSession();
  
  // Use sessionId anywhere!
  console.log("Current session:", sessionId);
  
  return <div>Session: {sessionId}</div>;
}
```

### API

**useSession() hook returns:**
- `sessionId` (string) - Current session UUID
- `isLoading` (boolean) - True during initial load
- `clearSession()` (function) - Clears and regenerates session

**Direct functions (if needed):**

**Direct functions (if needed):**
- `getSessionId()` - Get or create session_id from localStorage
- `getExistingSessionId()` - Get session_id only if exists (returns null if not found)
- `clearSession()` - Remove current session from localStorage (low-level)

### Customer Identity

Store customer name and phone for convenience (no authentication):

```typescript
import { 
  getCustomerIdentity, 
  setCustomerIdentity, 
  hasCustomerIdentity,
  clearCustomerIdentity 
} from "@/lib/customerIdentity";

// Check if stored
if (hasCustomerIdentity()) {
  const identity = getCustomerIdentity();
  console.log(identity?.name, identity?.phone);
}

// Save identity
setCustomerIdentity("John Doe", "555-0123");

// Clear identity
clearCustomerIdentity();
```

## Supabase Setup

The app uses Supabase for database operations (no authentication required).

**Client location:** `lib/supabase.ts`

**Usage:**
```typescript
import { supabase } from "@/lib/supabase";

// Example (queries not implemented yet)
const { data, error } = await supabase
  .from('menu_items')
  .select('*');
```

**Configuration:**
- Environment variables in `.env.local`
- Client is configured without auth persistence
- Uses anonymous key with Row Level Security (RLS)

**Planned usage:**
- Fetching menu items from database
- Inserting customer orders

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Design Philosophy

- **Simple & Clean**: No authentication required
- **Mobile-First**: Designed for touch interfaces
- **Fast**: Optimized for quick ordering experience
- **Accessible**: Clear labels and intuitive navigation
