# 🍽️ Badshah's Kitchen

Modern mobile-first café ordering system with real-time order management.

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)](https://supabase.com/)

## ✨ Features

### 👥 Customer Experience
- 📱 Mobile-first responsive design
- 🗂️ Browse menu by category
- 🛒 Real-time shopping cart
- 📊 Live order status tracking
- ⭐ Feedback and ratings system
- 🎨 Beautiful cafe theme (stone, amber, green)

### 🔪 Kitchen Dashboard
- 📋 Real-time order management
- 🔄 Status updates (Placed → Accepted → Preparing → Ready → Completed)
- 🔍 Filter orders by status
- 🔐 Password-protected access
- ⚡ WebSocket-based live updates

### 👨‍💼 Admin Panel
- 📝 Complete menu CRUD operations
- 🏷️ Custom category management
- 📊 Daily statistics dashboard
- 📈 Clickable stats with detailed views
- 💬 View all customer feedback
- 🔐 Password-protected access

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript 5 |
| **UI Library** | React 19 |
| **Styling** | Tailwind CSS |
| **Database** | Supabase (PostgreSQL) |
| **Real-time** | Supabase Realtime (WebSockets) |
| **Authentication** | Simple password-based |

## 🗄️ Database Architecture

```
┌──────────────┐
│   orders     │
├──────────────┤
│ id (UUID)    │◄─┐
│ order_number │  │
│ session_id   │  │
│ customer_name│  │
│ customer_phone  │
│ status       │  │
│ total_amount │  │
└──────────────┘  │
                  │
┌──────────────┐  │  ┌─────────────┐
│ order_items  │──┘  │ menu_items  │
├──────────────┤◄────├─────────────┤
│ id           │     │ id (UUID)   │
│ order_id (FK)│     │ name        │
│ menu_item_id │─────►│ category    │
│ quantity     │     │ price       │
│ price_at_time│     │ is_available│
└──────────────┘     │ is_special  │
                     └─────────────┘
┌──────────────┐
│  feedback    │
├──────────────┤
│ id           │
│ order_id (FK)│──┐
│ rating (1-5) │  │
│ comment      │  │
│ created_at   │  │
└──────────────┘  │
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Supabase account (free tier works)

### Installation

```bash
# Clone repository
git clone <your-repo-url>
cd badshahs-kitchen

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Edit .env.local with your credentials
# (See Environment Setup below)

# Run development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### Environment Setup

Create `.env.local` with:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Authentication Passwords (Change these!)
NEXT_PUBLIC_KITCHEN_PASSWORD=YourKitchenPassword123
NEXT_PUBLIC_ADMIN_PASSWORD=YourAdminPassword123
```

## 📁 Project Structure

```
badshahs-kitchen/
├── app/                      # Next.js App Router
│   ├── page.tsx             # Customer ordering page
│   ├── orders/              # Order tracking
│   ├── bill/[orderId]/      # Receipt & feedback
│   ├── kitchen/             # Kitchen dashboard
│   └── admin/               # Admin panel
├── components/              # React components
│   └── CustomerIdentityForm.tsx
├── lib/                     # Utilities & helpers
│   ├── supabase.ts         # Supabase client
│   ├── SessionContext.tsx   # Session management
│   ├── kitchenAuth.tsx     # Kitchen authentication
│   ├── adminAuth.tsx       # Admin authentication
│   ├── cartUtils.ts        # Cart calculations
│   ├── orderUtils.ts       # Order processing
│   └── dateUtils.ts        # Date formatting (Indian timezone)
├── types/                   # TypeScript type definitions
├── docs/                    # Documentation
│   ├── database-schema.md   # Database structure
│   ├── add-price-and-feedback.sql  # Main migration
│   └── add-performance-indexes.sql # Performance optimization
├── DEPLOYMENT-GUIDE.md      # Step-by-step deployment
└── MULTI-USER-LOAD-ANALYSIS.md  # Performance analysis
```

## 🗃️ Database Setup

### 1. Create Tables

Run the migrations in your Supabase SQL Editor:

```bash
# Required migration (creates tables & RLS policies)
docs/add-price-and-feedback.sql

# Optional performance boost
docs/add-performance-indexes.sql
```

### 2. Enable Realtime

In Supabase Dashboard:
1. Go to **Database** → **Replication**
2. Enable for tables:
   - ✅ `orders`
   - ✅ `menu_items`

### 3. Insert Sample Menu (Optional)

```sql
INSERT INTO menu_items (name, category, price, is_available, is_special) VALUES
  ('Paneer Tikka', 'Starters', 25000, true, false),
  ('Butter Chicken', 'Main Course', 35000, true, true),
  ('Garlic Naan', 'Breads', 5000, true, false),
  ('Gulab Jamun', 'Desserts', 8000, true, false);
```

*Prices are in paise (₹250.00 = 25000)*

## 🎯 Usage

### Customer Flow
1. Visit `/` - Browse menu
2. Add items to cart
3. Click "Place Order"
4. Enter name and phone
5. Track order at `/orders`
6. View bill and give feedback

### Kitchen Flow
1. Visit `/kitchen/login`
2. Enter kitchen password
3. View incoming orders
4. Update status: **Placed** → **Accepted** → **Preparing** → **Ready** → **Completed**

### Admin Flow
1. Visit `/admin/login`
2. Enter admin password
3. **Menu Tab**: Add/edit/delete menu items
4. **Stats Tab**: View daily metrics, click sections for details

## 🔐 Security

- **Customer Pages**: No authentication (session-based)
- **Kitchen Dashboard**: Password-protected
- **Admin Panel**: Password-protected
- **Database**: Row-Level Security (RLS) policies enabled
- **API**: Supabase Auth with anon key (read-only for customers)

## 🚀 Deployment

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Import your GitHub repository
2. Add environment variables in Vercel Dashboard
3. Deploy!

**See [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md) for detailed instructions**

### Environment Variables for Production

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_KITCHEN_PASSWORD=strong_password_here
NEXT_PUBLIC_ADMIN_PASSWORD=another_strong_password
```

⚠️ **Change default passwords before going live!**

## 📊 Performance

Expected capacity (see [MULTI-USER-LOAD-ANALYSIS.md](MULTI-USER-LOAD-ANALYSIS.md)):

| Concurrent Users | Response Time | Status |
|-----------------|---------------|---------|
| 1-50 | < 200ms | 🟢 Excellent |
| 50-100 | < 500ms | 🟢 Very Good |
| 100-500 | < 1s | 🟡 Good |
| 500+ | Upgrade needed | 🔴 Requires paid plans |

## 🎨 Theme

Custom cafe color palette:

```css
Stone Gray: #44403c (stone-700)
Warm Amber: #b45309 (amber-700)
Forest Green: #15803d (green-700)
Natural Beige: #f5f5f4 (stone-50)
```

## 🧪 Testing

```bash
# Build production bundle
npm run build

# Run production server
npm start

# Lint code
npm run lint
```

## 📚 Documentation

- **[DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md)** - Complete deployment walkthrough
- **[MULTI-USER-LOAD-ANALYSIS.md](MULTI-USER-LOAD-ANALYSIS.md)** - Performance & scaling analysis
- **[docs/database-schema.md](docs/database-schema.md)** - Detailed database documentation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Database by [Supabase](https://supabase.com/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Icons from [Heroicons](https://heroicons.com/)

---

**Made with ❤️ for Badshah's Kitchen**
