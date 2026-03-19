# Zero Gifts — Project Specification

> **Version:** 1.0  
> **Last Updated:** 2026-03-19  
> **Live URL:** https://zero-gif.lovable.app

---

## 1. Overview

**Zero Gifts** is a mobile-first gift shop web application specializing in custom photo frames and resin art products. Users browse categories, configure products through a multi-step wizard with real-time pricing, add items to a persistent cart, and place orders via UPI payment. Admins and VIP subscribers manage products, orders, and settings through a built-in dashboard.

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Build Tool | Vite 5 |
| Styling | Tailwind CSS 3 + shadcn/ui components |
| State / Data | TanStack React Query v5 |
| Routing | React Router DOM v6 |
| Backend | Lovable Cloud (Supabase) — Postgres DB, Auth, Storage, Edge Functions |
| Auth | Google OAuth (via Supabase Auth) |
| Notifications | Sonner toasts |
| Icons | Lucide React |

---

## 3. Architecture

```
src/
├── assets/            # Static images (styles, categories, logo)
├── components/
│   ├── ui/            # shadcn/ui primitives (button, card, dialog, etc.)
│   ├── configurator/  # Multi-step product configurator components
│   ├── admin/         # Admin dashboard sub-components
│   ├── Header.tsx     # Global nav with auth, cart, theme toggle
│   ├── HeroSection.tsx
│   ├── HowItWorks.tsx
│   ├── Testimonials.tsx
│   ├── CategoryGrid.tsx / CategoryCard.tsx
│   ├── ProtectedRoute.tsx
│   └── BugReportButton.tsx
├── hooks/
│   ├── useAuth.tsx    # Auth context (user, roles, Google sign-in)
│   ├── useCart.tsx     # Cart context (localStorage-persisted)
│   ├── useTheme.tsx   # Light/dark theme toggle
│   ├── useProductData.tsx  # React Query hooks for product tables
│   └── use-mobile.tsx
├── lib/
│   ├── productQueries.ts  # Supabase queries for photo frame products
│   ├── resinQueries.ts    # Supabase queries for resin products
│   ├── pricing.ts
│   └── utils.ts
├── pages/
│   ├── Index.tsx              # Landing page
│   ├── AuthPage.tsx           # Google OAuth login
│   ├── CategoriesPage.tsx     # Product category grid
│   ├── ConfiguratorPage.tsx   # Photo frame configurator (5-step wizard)
│   ├── ResinConfiguratorPage.tsx  # Resin art product selector
│   ├── StyleGalleryPage.tsx   # Gallery images per editing style
│   ├── CartPage.tsx           # Cart, address selection, UPI checkout
│   ├── MyOrdersPage.tsx       # User order history
│   ├── SubscriptionPage.tsx   # VIP subscription purchase flow
│   ├── AdminPage.tsx          # Admin/subscriber dashboard
│   └── NotFound.tsx
├── integrations/
│   └── supabase/      # Auto-generated client & types
└── main.tsx
```

---

## 4. Database Schema

### Tables

| Table | Purpose |
|-------|---------|
| `editing_styles` | Photo editing style options (oil painting, watercolor, etc.) with name, slug, price, image, sort order, active flag |
| `sizes` | Frame size options with dimensions and pricing |
| `frame_materials` | Frame material options (wood, acrylic, etc.) with pricing, stock, images |
| `frame_colors` | Frame color options with hex values |
| `addons` | Optional add-ons (emoji, name, price) |
| `resin_product_types` | Resin art product catalog (coasters, keychains, trays, etc.) |
| `style_gallery_images` | Gallery images linked to editing styles |
| `orders` | Customer orders with full configuration, pricing, status tracking |
| `customer_addresses` | Saved customer shipping addresses |
| `profiles` | User profile data (display name, avatar, phone) |
| `user_roles` | Role-based access control (`admin`, `subscriber`, `user`) |
| `subscription_requests` | VIP subscription payment verification requests |
| `site_settings` | Key-value config store (UPI ID, QR code image URL, etc.) |

### Enums

- `app_role`: `admin` | `subscriber` | `user`

### Security Functions

- `has_role(_user_id, _role)` — SECURITY DEFINER function for RLS policy checks
- `has_role_any(_user_id, _roles[])` — Check multiple roles

---

## 5. User Roles & Access

| Role | Capabilities |
|------|-------------|
| **Guest** | Redirected to `/auth` (no anonymous access) |
| **User** | Browse, configure products, cart, checkout, view own orders, request VIP subscription |
| **Subscriber** | All user capabilities + access admin dashboard (limited tabs: styles, sizes, materials, resin, orders, gallery, settings) |
| **Admin** | Full dashboard access including user management, subscription approvals, all settings |

---

## 6. Features

### 6.1 Authentication
- Google OAuth sign-in (supports both Lovable preview and custom domains)
- All routes except `/auth` are protected via `ProtectedRoute`
- Session persistence with auto-refresh tokens

### 6.2 Landing Page (`/`)
- Hero section with CTA
- "How It Works" steps
- Customer testimonials
- Stats and call-to-action

### 6.3 Product Categories (`/categories`)
- Grid of product categories: Photo Frames, Resin Art, Custom Gifts
- Each category links to its respective configurator

### 6.4 Photo Frame Configurator (`/configure/photo-frames`)
Multi-step wizard with live price bar:

1. **Editing Style** — Select art style (oil painting, watercolor, pop art, etc.) with gallery preview
2. **Size** — Choose frame dimensions
3. **Frame Material** — Select material with stock availability
4. **Add-ons** — Optional extras
5. **Checkout** — Review, enter details, pay via UPI

- Real-time price calculation at each step
- "Add to Cart" option to continue shopping
- Direct "Place Order" flow with UPI payment

### 6.5 Resin Art Configurator (`/configure/resin-art`)
- Product type selection (bookmarks, coasters, keychains, phone grips, trays, wall clocks)
- Add to cart functionality

### 6.6 Style Gallery (`/style-gallery/:styleId`)
- Full gallery of example images per editing style
- Accessible from configurator style preview click

### 6.7 Shopping Cart (`/cart`)
- Persistent cart (localStorage)
- Quantity adjustment, item removal
- Saved address selection or new address entry
- UPI payment integration:
  - Display admin-configured UPI ID with copy button
  - QR code image (admin-uploaded) with download option
  - Deep link to UPI apps
  - "I've paid" confirmation flow
- Order placement with WhatsApp notification to admin

### 6.8 My Orders (`/my-orders`)
- Order history with status badges (pending, confirmed, completed, cancelled)
- Order details: style, size, material, price

### 6.9 VIP Subscription (`/subscribe`)
- ₹29/month subscription for product management access
- Payment flow: UPI payment → screenshot upload → admin verification
- States: payment form, pending verification, approved (redirect to dashboard)

### 6.10 Admin Dashboard (`/admin`)
Tabbed interface with the following sections:

| Tab | Description |
|-----|-------------|
| **Editing Styles** | CRUD for photo editing styles with image upload |
| **Sizes** | Manage frame size options and pricing |
| **Frame Materials** | Manage materials with stock and images |
| **Resin Types** | Manage resin product catalog |
| **Orders** | View/update all customer orders |
| **Gallery** | Manage style gallery images |
| **Settings** | Configure UPI ID, QR code image, site settings |
| **Users** | View all users with search functionality (admin only) |
| **Subscriptions** | Review/approve/reject/revoke subscription requests with search and delete (admin only) |

---

## 7. Payment Flow

```
User selects products → Cart → Enter address →
  → View UPI ID + QR code → Pay externally →
  → Confirm payment in app → Order created (status: pending) →
  → Admin notified via WhatsApp redirect
```

- **UPI ID**: Configured in admin settings (`site_settings.upi_id`)
- **QR Code**: Admin uploads image (`site_settings.upi_qr_image`), displayed in all payment sections
- No payment gateway integration — manual UPI verification

---

## 8. Pricing Model

Price is computed server-side by summing:

```
Total = Editing Style Price
      + Size Price
      + Frame Material Price
      + Σ(Addon Prices)
```

Fetched via `fetchCheckoutTotal()` / `fetchCheckoutSummary()` in `productQueries.ts` with 12-second timeout per query.

---

## 9. Theming

- Light/dark mode toggle via `useTheme` hook
- CSS custom properties defined in `index.css` using HSL
- Semantic tokens: `--background`, `--foreground`, `--primary`, `--muted`, `--accent`, `--border`, etc.
- Glass-card effect for header and floating elements
- Font system: display font + body font

---

## 10. Storage

- **Product Images**: Supabase Storage bucket `product-images`
  - Editing style images
  - Frame material images
  - Style gallery images
  - Subscription payment screenshots
  - UPI QR code image
- **Cart**: localStorage (`zero_gifts_cart` key)

---

## 11. Edge Functions

| Function | Purpose |
|----------|---------|
| `send-order-email` | Email notification on new orders |

---

## 12. Key Design Decisions

1. **No anonymous sign-up** — Google OAuth only for simplified onboarding
2. **Manual UPI payments** — No payment gateway; admin verifies screenshots
3. **Role-based access via separate table** — `user_roles` table with `has_role()` SECURITY DEFINER function prevents privilege escalation
4. **Client-side cart** — localStorage persistence avoids unnecessary DB writes for cart state
5. **Subscriber tier** — Paid users get product management access without full admin privileges
6. **Query timeouts** — 12-second timeout wrapper on all Supabase queries prevents hanging UI

---

## 13. Routes

| Path | Component | Auth | Description |
|------|-----------|------|-------------|
| `/auth` | AuthPage | Public | Google sign-in |
| `/` | Index | Protected | Landing page |
| `/categories` | CategoriesPage | Protected | Product categories |
| `/configure/photo-frames` | ConfiguratorPage | Protected | Frame configurator wizard |
| `/configure/resin-art` | ResinConfiguratorPage | Protected | Resin product selector |
| `/style-gallery/:styleId` | StyleGalleryPage | Protected | Style example gallery |
| `/cart` | CartPage | Protected | Shopping cart & checkout |
| `/my-orders` | MyOrdersPage | Protected | User order history |
| `/subscribe` | SubscriptionPage | Protected | VIP subscription flow |
| `/admin` | AdminPage | Protected + Role check | Admin/subscriber dashboard |
| `*` | NotFound | Public | 404 page |

---

## 14. Future Considerations

- Payment gateway integration (Razorpay/Stripe) for automated verification
- Order status push notifications
- Image upload for custom photo frame orders
- Inventory/stock management automation
- Analytics dashboard for sales tracking
- Multi-language support (Hindi/English)
