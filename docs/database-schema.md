# Database Schema Reference

This file documents the Supabase database schema for reference.

## Tables

### menu_items
```sql
CREATE TABLE public.menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price integer NOT NULL,  -- Price in cents
  category text,
  is_available boolean DEFAULT true,
  is_special boolean DEFAULT false,
  created_at timestamp DEFAULT now()
);
```

### orders
```sql
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  customer_name text,
  customer_phone text,
  status order_status DEFAULT 'PLACED',
  total_amount integer,  -- Total in cents
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);
```

### order_items
```sql
CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id),
  menu_item_id uuid REFERENCES menu_items(id),
  quantity integer NOT NULL
);
```

### feedback
```sql
CREATE TABLE public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id),
  rating integer,
  comment text
);
```

## Notes

- All prices are stored as integers in **cents** (e.g., $3.50 = 350)
- UUIDs are used for all primary keys
- `order_status` is a custom enum type

## Row Level Security (RLS) Policies

### menu_items
**RLS: Enabled**

| Policy Name | Command | Applied To | Description |
|-------------|---------|------------|-------------|
| Public read menu items | SELECT | public | Allows anyone to read menu items |

### orders
**RLS: Enabled**

```sql
-- Enable RLS on orders table
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Policy: Allow INSERT for anyone (client provides session_id)
CREATE POLICY "Allow public to insert orders"
  ON public.orders
  FOR INSERT
  TO public
  WITH CHECK (session_id IS NOT NULL AND session_id != '');

-- Policy: Allow SELECT only for matching session_id
-- Note: Without authentication, this relies on client-side filtering
-- The policy allows reads but app should always filter: WHERE session_id = ?
CREATE POLICY "Allow read own orders"
  ON public.orders
  FOR SELECT
  TO public
  USING (true);
  -- In production with auth, this would be:
  -- USING (session_id = current_setting('request.headers')::json->>'session_id')

-- No UPDATE policy = UPDATE denied for everyone
-- No DELETE policy = DELETE denied for everyone
```

| Policy Name | Command | Applied To | Check/Using |
|-------------|---------|------------|-------------|
| Allow public to insert orders | INSERT | public | session_id IS NOT NULL |
| Allow read own orders | SELECT | public | true (app filters by session_id) |

**⚠️ Security Note:** Without Supabase Auth, RLS cannot enforce session_id matching at the database level. The application must filter queries by session_id in the WHERE clause.

### order_items
**RLS: Enabled**

```sql
-- Enable RLS on order_items table
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Policy: Allow INSERT for valid orders
CREATE POLICY "Allow insert order items for valid orders"
  ON public.order_items
  FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id
    )
    AND quantity > 0
  );

-- Policy: Allow SELECT for all
-- App must join with orders table and filter by session_id
CREATE POLICY "Allow read order items"
  ON public.order_items
  FOR SELECT
  TO public
  USING (true);

-- No UPDATE policy = UPDATE denied
-- No DELETE policy = DELETE denied
```

| Policy Name | Command | Applied To | Check/Using |
|-------------|---------|------------|-------------|
| Allow insert order items for valid orders | INSERT | public | order_id exists in orders AND quantity > 0 |
| Allow read order items | SELECT | public | true (app filters via orders join) |

**⚠️ Security Note:** The application must always query order_items with a join to orders and filter by session_id. Example:
```typescript
supabase.from('order_items')
  .select('*, orders!inner(session_id)')
  .eq('orders.session_id', sessionId)
```

### feedback
**RLS: Disabled**
- Table can be accessed by anyone via the Data API

## Security Recommendations

⚠️ **Important**: Currently most tables have RLS disabled, meaning they can be accessed by anyone.

**Recommended policies to add:**
1. **orders** - Enable RLS and add policies to:
   - Allow users to insert their own orders
   - Prevent reading/modifying other users' orders
   
2. **order_items** - Enable RLS and add policies to:
   - Allow insertion only when creating an order
   - Restrict access based on order ownership

3. **feedback** - Enable RLS and add policies to:
   - Allow users to submit feedback for their own orders
   - Prevent modifying other users' feedback
