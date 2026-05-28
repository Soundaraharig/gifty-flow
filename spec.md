# Zero Gifts — Project Specification

> **Version:** 1.1  
> **Last Updated:** 2026-05-28  
> **Live URL:** https://zero-gif.lovable.app

---

## 1. Overview

**Zero Gifts** is a mobile-first premium gift shop web application specializing in custom artistic photo frames and handcrafted resin art products. 

Users browse dynamic product categories, select personalized editing styles via a rich media gallery, configure customized photo frames through an interactive multi-step wizard, add items to a persistent cart, and place orders via manual UPI/QR payment confirmation.

The system incorporates:
1. **Dynamic Collections**: Categories and editing styles are fetched directly from the database rather than hardcoded, enabling complete flexibility.
2. **AI Sales Assistant ("Concierge")**: A conversational bot powered by Google Gemini, designed specifically to recommend custom frames/resin arts and dynamically display live image previews based on specialized token outputs.
3. **VIP Subscriptions**: A paid tiers flow (₹29/month) where users submit proof of payment (UPI screenshots) to administrators, unlocking limited dashboard access for inventory and style curation.
4. **Role-Based Access Dashboard**: Tabbed administrative interface dynamically partitioned based on user roles (`admin` vs. `subscriber` vs. `user`).

---

## 2. Tech Stack

| Layer | Technology | Description |
|-------|------------|-------------|
| **Core Framework** | React 18 + TypeScript | Component-driven UI and strict type safety |
| **Build Tool** | Vite 5 | Fast development server and optimized bundler |
| **Styling** | Tailwind CSS 3 + shadcn/ui | Premium, fluid visual design with smooth transitions and glassmorphism |
| **State / Data** | TanStack React Query v5 | Managed server-state, query caching, and client-side database synchronization |
| **Routing** | React Router DOM v6 | Layout and guard-protected multi-page routes |
| **Backend Platform**| Supabase Cloud | PostgreSQL Database, GoTrue Auth, Storage bucket, and Edge Functions |
| **AI Integration** | Google Generative AI SDK (`@google/generative-ai`) | Client-side execution of `gemini-flash-latest` model for concierge |
| **Analytics/Charts**| Recharts | Dynamic interactive SVGs for order statistics inside the Admin dashboard |
| **Notifications** | Sonner + Radix Toasts | Toast-based micro-interactions and alerts |
| **Icons** | Lucide React | High-quality vector iconography |

---

## 3. Architecture

```
src/
├── assets/            # Static fallback images (styles, categories, logo)
├── components/
│   ├── ui/            # shadcn/ui primitives (button, card, dialog, accordion, select, etc.)
│   ├── configurator/  # Wizard-specific modular panels
│   │   ├── AddonsStep.tsx          # Step 4: Optional add-ons (gift wrap, delivery)
│   │   ├── CheckoutStep.tsx        # Step 5: Address, payment instructions, QR display
│   │   ├── EditingStyleStep.tsx    # Step 1: Choosing a digital art style
│   │   ├── FrameStep.tsx           # Step 3: Selecting color & material
│   │   ├── OrderSuccess.tsx        # Post-checkout order completion card
│   │   ├── PriceBar.tsx            # Sticky real-time checkout price breakdown
│   │   ├── SizeStep.tsx            # Step 2: Dimensions selector
│   │   ├── StepIndicator.tsx       # Progress visualizer
│   │   └── StyleGalleryModal.tsx   # Overlay gallery carousel for custom styles
│   ├── admin/         # Sub-panels for dashboard management
│   │   ├── AdminSubscriptions.tsx  # VIP billing verification (screenshots, logs)
│   │   └── AdminUsers.tsx          # User directory search list (admin only)
│   ├── Header.tsx     # Responsive main navbar with auth controls and cart indicators
│   ├── HeroSection.tsx # Landing visual hook with CTA
│   ├── HowItWorks.tsx # Visual guide for ordering custom frames
│   ├── Testimonials.tsx # Customer feedback slider
│   ├── CategoryGrid.tsx / CategoryCard.tsx # Collections catalog
│   ├── ProtectedRoute.tsx # Route shielding component
│   ├── BugReportButton.tsx # Client-side bug logger
│   ├── NavLink.tsx     # Custom active-state indicator links
│   └── StatsAndCTA.tsx # Key landing figures and secondary action trigger
├── hooks/
│   ├── useAuth.tsx    # Session, role synchronization, and Google OAuth
│   ├── useCart.tsx     # Client localStorage persistence, quantity edits
│   ├── useTheme.tsx   # Light/dark color toggles
│   ├── useProductData.tsx # Standard React Query wrappers for database tables
│   ├── use-toast.ts   # UI Toast controller hook
│   └── use-mobile.tsx # Viewport monitor for structural responsiveness
├── lib/
│   ├── productQueries.ts  # Supabase selectors & timeout handling for frames
│   ├── resinQueries.ts    # Supabase selectors for handcrafted resin products
│   ├── pricing.ts         # Basic configurations and local pricing formulas
│   └── utils.ts           # Visual style merger utilities
├── pages/
│   ├── Index.tsx              # Landing page
│   ├── AuthPage.tsx           # Google OAuth sign-in gateway
│   ├── CategoriesPage.tsx     # Main catalog categories selector
│   ├── ChatAssistantPage.tsx  # Gemini-powered concierge chat assistant
│   ├── ConfiguratorPage.tsx   # Step-by-step frame configurator wizard
│   ├── ResinConfiguratorPage.tsx # Resin art catalog and checkout configuration
│   ├── StyleCollectionPage.tsx   # Frame styles explorer with gallery and search
│   ├── StyleGalleryPage.tsx   # Dedicated gallery of editing styles
│   ├── CartPage.tsx           # Persistent shopping cart and address manager
│   ├── MyOrdersPage.tsx       # Secure user order history
│   ├── SubscriptionPage.tsx   # VIP payment upload & status flow
│   ├── AdminPage.tsx          # Multi-role administrative dashboard
│   └── NotFound.tsx           # Standard 404 page
├── integrations/
│   └── supabase/      # Auto-generated client APIs and Typescript typings
└── main.tsx
```

---

## 4. Database Schema

### Tables

#### 1. `gift_categories`
Stores the dynamic list of product categories displayed on the browsing page.
- `id`: `UUID` (Primary Key, Default: `gen_random_uuid()`)
- `slug`: `TEXT` (Unique, Not Null) - e.g., `'photo-frames'`, `'resin-art'`
- `title`: `TEXT` (Not Null)
- `description`: `TEXT`
- `image_url`: `TEXT`
- `is_active`: `BOOLEAN` (Default: `true`)
- `sort_order`: `INTEGER` (Default: `0`)
- `target_route`: `TEXT` (Not Null) - Route triggered on selection, e.g., `/configure/photo-frames/styles`
- `created_at`: `TIMESTAMPTZ` (Default: `now()`)

#### 2. `editing_styles`
Available digital design modes for frames.
- `id`: `UUID` (Primary Key, Default: `gen_random_uuid()`)
- `slug`: `TEXT` (Unique, Not Null) - e.g., `'oil-painting'`, `'watercolor'`
- `name`: `TEXT` (Not Null)
- `description`: `TEXT`
- `price`: `INTEGER` (Default: `0`, Cost added to base frame price)
- `image_url`: `TEXT`
- `sort_order`: `INTEGER` (Default: `0`)
- `is_active`: `BOOLEAN` (Default: `true`)
- `created_at` / `updated_at`: `TIMESTAMPTZ`

#### 3. `sizes`
Available frame sizes.
- `id`: `UUID` (Primary Key)
- `slug`: `TEXT` (Unique, Not Null) - e.g., `'a4'`, `'a3'`
- `name`: `TEXT` (Not Null) - e.g., `'A4'`, `'A3'`
- `dimensions`: `TEXT` - e.g., `'210 × 297 mm'`
- `price`: `INTEGER` (Default: `0`)
- `sort_order`: `INTEGER` (Default: `0`)
- `is_active`: `BOOLEAN` (Default: `true`)
- `created_at`: `TIMESTAMPTZ`

#### 4. `frame_materials`
Available structural materials for frames.
- `id`: `UUID` (Primary Key)
- `slug`: `TEXT` (Unique, Not Null)
- `name`: `TEXT` (Not Null) - e.g., `'Premium Acrylic'`, `'Teak Wood'`
- `price`: `INTEGER` (Default: `0`)
- `image_url`: `TEXT`
- `stock`: `INTEGER` (Default: `10`)
- `sort_order`: `INTEGER` (Default: `0`)
- `is_active`: `BOOLEAN` (Default: `true`)
- `created_at`: `TIMESTAMPTZ`

#### 5. `frame_colors`
Color overlay styles for frames.
- `id`: `UUID` (Primary Key)
- `slug`: `TEXT` (Unique, Not Null)
- `name`: `TEXT` (Not Null)
- `hex`: `TEXT` (Not Null) - Color value in hex format
- `sort_order`: `INTEGER` (Default: `0`)
- `is_active`: `BOOLEAN` (Default: `true`)
- `created_at`: `TIMESTAMPTZ`

#### 6. `addons`
Optional checkout enhancements.
- `id`: `UUID` (Primary Key)
- `slug`: `TEXT` (Unique, Not Null)
- `name`: `TEXT` (Not Null) - e.g., `'Gift Wrapping'`, `'Express Delivery'`
- `price`: `INTEGER` (Default: `0`)
- `emoji`: `TEXT` - e.g., `'🎁'`, `'🚀'`
- `sort_order`: `INTEGER` (Default: `0`)
- `is_active`: `BOOLEAN` (Default: `true`)
- `created_at`: `TIMESTAMPTZ`

#### 7. `resin_product_types`
Handcrafted resin items inventory.
- `id`: `UUID` (Primary Key)
- `name`: `TEXT` (Not Null) - e.g., `'Resin Wall Clock'`
- `slug`: `TEXT` (Not Null)
- `description`: `TEXT`
- `image_url`: `TEXT`
- `price`: `INTEGER` (Default: `0`)
- `sort_order`: `INTEGER` (Default: `0`)
- `is_active`: `BOOLEAN` (Default: `true`)
- `created_at`: `TIMESTAMPTZ`

#### 8. `style_gallery_images`
Rich showcase portfolio images attached to digital editing styles.
- `id`: `UUID` (Primary Key)
- `editing_style_id`: `UUID` (Foreign Key -> `editing_styles.id` on delete CASCADE)
- `image_url`: `TEXT` (Not Null)
- `title`: `TEXT`
- `sort_order`: `INTEGER` (Default: `0`)
- `is_active`: `BOOLEAN` (Default: `true`)
- `created_at`: `TIMESTAMPTZ`

#### 9. `orders`
Client order database records.
- `id`: `UUID` (Primary Key)
- `user_id`: `UUID` (Foreign Key -> `auth.users.id` on delete SET NULL)
- `customer_name`: `TEXT` (Not Null)
- `customer_phone`: `TEXT` (Not Null)
- `editing_style_id`: `UUID` (Foreign Key -> `editing_styles.id` null allowed for Resin products)
- `size_id`: `UUID` (Foreign Key -> `sizes.id` null allowed)
- `frame_material_id`: `UUID` (Foreign Key -> `frame_materials.id` null allowed)
- `frame_color_id`: `UUID` (Foreign Key -> `frame_colors.id` null allowed)
- `addon_ids`: `UUID[]` (Array of selected optional addons)
- `total_price`: `INTEGER` (Not Null)
- `status`: `TEXT` (Default: `'pending'`, states: `pending`, `confirmed`, `completed`, `cancelled`)
- `payment_method`: `TEXT` (Default: `'cod'`)
- `notes`: `TEXT`
- `created_at` / `updated_at`: `TIMESTAMPTZ`

#### 10. `customer_addresses`
Saved profile shipping details.
- `id`: `UUID` (Primary Key)
- `user_id`: `UUID` (Not Null)
- `customer_name`: `TEXT` (Not Null)
- `customer_phone`: `TEXT` (Not Null)
- `address`: `TEXT`
- `is_default`: `BOOLEAN` (Default: `false`)
- `created_at`: `TIMESTAMPTZ`

#### 11. `profiles`
User metadata mapped from GoTrue accounts.
- `id`: `UUID` (Primary Key)
- `user_id`: `UUID` (Foreign Key -> `auth.users.id` on delete CASCADE, Unique)
- `display_name`: `TEXT`
- `avatar_url`: `TEXT`
- `subscriber_phone`: `TEXT` (Optionally provided during VIP subscriber request verification)
- `created_at`: `TIMESTAMPTZ`

#### 12. `user_roles`
Mapping user roles for dashboard access levels.
- `id`: `UUID` (Primary Key)
- `user_id`: `UUID` (Foreign Key -> `auth.users.id` on delete CASCADE, Not Null)
- `role`: `app_role` (Not Null, Unique together with user_id)
- `created_at`: `TIMESTAMPTZ`

#### 13. `subscription_requests`
Pending subscription payments submitted by clients waiting for approval.
- `id`: `UUID` (Primary Key)
- `user_id`: `UUID` (Not Null)
- `screenshot_url`: `TEXT` (Not Null, points to payment proof in Supabase storage)
- `status`: `TEXT` (Default: `'pending'`, states: `pending`, `approved`, `rejected`)
- `created_at`: `TIMESTAMPTZ`
- `reviewed_at`: `TIMESTAMPTZ`
- `reviewed_by`: `UUID`

#### 14. `site_settings`
Global system variables.
- `key`: `TEXT` (Primary Key) - e.g., `'upi_id'`, `'upi_qr_image'`, `'admin_whatsapp'`
- `value`: `TEXT` (Not Null)
- `updated_at`: `TIMESTAMPTZ`

### Enums
- `app_role`: `'admin'` | `'subscriber'` | `'user'`

### Security Functions
To circumvent recursive policy triggers in RLS, the database uses a security definer check:
- `has_role(_user_id, _role)` - `SECURITY DEFINER` function executing check within public namespace.
- `has_role_any(_user_id, _roles[])` - Helper function validating if a user has any of the listed roles.
- `handle_new_user()` / `handle_new_user_profile()` - Event listeners on `auth.users` insert executing automatic profile instantiation and assigning first-time signups to `'admin'` tier, and subsequent signups to `'user'` tier.

---

## 5. User Roles & Access

| Role | Access Control Rules |
|------|----------------------|
| **Guest** | Blocked by global `ProtectedRoute`. Routed immediately to `/auth`. No anonymous sessions. |
| **User** | Browse category cards, select and customize photo frame/resin products, manage persistent cart, complete manual UPI checkouts, record addresses, view personal order history, and submit ₹29 VIP subscriptions screenshots. |
| **Subscriber (VIP)** | Extends all **User** capabilities. Grants limited access to the `/admin` dashboard. Displayed dashboard tabs are strictly limited to: `Editing Styles`, `Sizes`, `Frame Materials`, `Resin Types`, `Orders`, `Gallery`, and `Settings`. Access to `Users` directories and approval/rejection lists for billing are fully blocked. |
| **Admin** | Full system permissions. Complete CRUD on all databases. Full dashboard access, including `Users` directories, user role updates, manual deletion of client records, site key-value overrides, and manual approval/rejection/revocation of VIP subscription requests. |

---

## 6. Features

### 6.1 Authentication
- Exclusively supports Google OAuth sign-in.
- Secure fallback handles local hosts, preview urls, and target domains.
- Session persistence utilizes Supabase `sessionStorage` caching with automatic token refresh intervals.
- The `ProtectedRoute` wrapper intercepts unauthenticated requests and redirects to `/auth` seamlessly.

### 6.2 Landing Page (`/`)
- A premium visually engaging homepage detailing the handcrafted brand concept.
- Hero element with quick configurator triggers.
- Dynamic carousel highlighting curated customer testimonials.
- Dynamic key stats, interactive FAQ section, and direct CTA routing to categories page.

### 6.3 Product Categories (`/categories`)
- Renders product categories fetched dynamically from the database (`gift_categories`).
- Categories such as **Photo Frames**, **Resin Art**, and **Custom Gifts** are fully configured in the DB.
- Deactivated categories are excluded dynamically from display. Clicking an available category redirects the client to its respective config route.

### 6.4 Style Collection Explorer (`/configure/photo-frames/styles`)
- Dedicated catalog browsing page showcasing editing style options (Oil Painting, Mosaic Collage, Minimalist Retouch, Pencil Sketch, etc.).
- Complete with filtering by search strings and tags (e.g., "All Styles", "🔥 Popular").
- Cards dynamically display calculated "from" prices, complete with fake pricing slash-through discounts (representing a 20% mark-down).
- Hovering style cards gives a direct overlay to launch `/style-gallery/:styleId` or trigger `/configure/photo-frames?style=:styleId`.

### 6.5 Photo Frame Configurator (`/configure/photo-frames`)
A progressive, 5-step custom design wizard:
1. **Editing Style**: Selection panel showing art types with quick link modals for sample collections.
2. **Size**: Physical frame choices accompanied by visual dimension gauges (e.g., A5, A4, A3).
3. **Frame Details**: Select structural material and solid border color overlay options. Live validation keeps track of material inventory levels.
4. **Add-ons**: Toggle additional options such as "Gift Wrapping" or "Express Delivery".
5. **Checkout**: Review address and payment.

Features a sticky **PriceBar** displaying in real-time the price accumulation breakdown across all configuration choices. Supports saving configuration to the persistent cart or performing a direct quick-checkout.

### 6.6 Resin Art Configurator (`/configure/resin-art`)
- Catalog of resin pieces (Bookmarks, Coasters, Serving Trays, Clocks, Phone Grips) dynamically listed from the `resin_product_types` table.
- Detail panels explain standard product dimensions and material configurations.
- One-click triggers add configured resin pieces straight to the checkout cart.

### 6.7 AI Sales Concierge (`/assistant`)
- A fully conversational AI assistant interface running on the client via the Gemini API (`gemini-flash-latest`).
- Utilizes custom system parameters:
  - Guided strictly to conversation regarding Zero Gifts items.
  - Automatically deflects generic questions (math, weather, programming) back to product offerings.
  - **Dynamic Visuals**: When recommending categories or specific styles, the AI outputs specialized tokens like `[[IMG:style-oil-painting.jpg]]` or `[[IMG:category-resin-art.jpg]]`.
  - The UI intercepts these tokens and mounts real image elements linked to dynamic assets fetched in Vite's compiler, creating a rich visual chat experience.

### 6.8 Shopping Cart & UPI Checkout (`/cart`)
- Manages an offline persistent cart using a `localStorage` context.
- Allows modifications of quantities, dynamic product deletions, and real-time total updates.
- **Address Selector**: Users can easily choose from a list of previously saved addresses (`customer_addresses`) or input a new default checkout address.
- **UPI Integration**:
  - Displays administrative UPI ID with one-click copy buttons.
  - Renders the uploaded QR payment image (`site_settings.upi_qr_image`) with quick download actions.
  - Deep-links on mobile directly to UPI applications (GPay, PhonePe, Paytm) for quick payment transitions.
  - Supports order validation where users confirm payment by submitting confirmation details, prompting automatic WhatsApp alerts populated with dynamic order details targeted to the admin's phone.

### 6.9 VIP Subscription Flow (`/subscribe`)
- A micro-portal enabling users to upgrade to VIP Subscriber status for a ₹29 monthly payment.
- **Flow**:
  1. Pay ₹29 manually using the UPI deep-link or QR code.
  2. Take a screenshot of the transaction and upload it.
  3. Image uploads securely to `/subscriptions` bucket folders.
  4. Submit request; status changes to `pending` while waiting for admin action.
  5. Upon administrative approval, user role is upgraded to `'subscriber'` and the user is redirected to the Subscriber Dashboard.

### 6.10 Administrative Dashboard (`/admin`)
An advanced, reactive control console featuring a clean tabbed design:
- **Editing Styles**: CRUD interface for digital styles (edit prices, toggle active flags, upload base graphics).
- **Sizes & Materials**: Adjust dimensions, material prices, stock levels, and active flags.
- **Resin Types**: Curation catalog for resin pieces.
- **Orders**: View all submitted customer orders, search customer names, update order statuses, and delete records.
- **Gallery Manager**: Link and sort multiple sample files under individual editing styles.
- **Global Settings**: Administrative overrides for UPI IDs, QR Codes, and notification numbers.
- **Users (Admin Only)**: Search directory of all registered users, details, and roles.
- **Subscriptions (Admin Only)**: Interactive approval desk with zoom overlays of payment screenshots, validation controls, and option to revoke VIP access.

---

## 7. Payment Flow

```
User selects products → Cart/Configure → Enter/Select Address →
  → View Administrative UPI Details & QR Code → Manual payment via deep link or bank scan →
  → Confirm checkout in UI → Order database record created (status: pending) →
  → Automatic WhatsApp application launch with structured purchase overview redirected to admin
```

- Payment is manually verified. The admin references transaction timestamps against the order log.
- Settings for payment destinations reside securely within the `site_settings` table.

---

## 8. Pricing Model

Pricing calculations are securely resolved client-side or computed on load:

```
Total Custom Frame Cost = Base Editing Style Price 
                        + Chosen size markup 
                        + Selected frame material markup 
                        + Sum of chosen optional addons 
```

- Timeout guards of **12 seconds** are wrapper-bound around all Supabase connections (`withSupabaseTimeout` / `withTimeout`) to prevent hanging queries and ensure user experience integrity.

---

## 9. Theming & Design

- Complete system support for Light and Dark modes managed using tailwind CSS configurations.
- Visual parameters utilize premium Tailwind variables tailored via clean HSL color wheels.
- Key visuals:
  - Semantic system fonts.
  - Heavy glassmorphism features on navigation bars, dropdown menus, and cart drawers.
  - Subtle interactive state animations (scale, slide-in, rose-glow box shadows).

---

## 10. Storage Buckets

All media resides within the Supabase Storage bucket `'product-images'`:
- `/styles/*`: Base graphics for photo frames.
- `/materials/*`: Material reference textures.
- `/gallery/*`: Sample showcase galleries.
- `/subscriptions/*`: Client payment screenshots organized under secure subfolders (`/subscriptions/{user_id}/*`).
- `/categories/*`: Banner assets for dynamic category cards.
- `/qr/*`: Uploaded payment QR code files.

---

## 11. Edge Functions

- `send-order-email`: A TypeScript Edge function executed when orders are created, generating administrative email alerts for order dispatching.

---

## 12. Key Design Decisions

1. **OAuth Only**: Simplifies account security, prevents credential vulnerabilities, and enforces reliable email records.
2. **Offline Cart**: Minimizes database read/write cycles, ensuring high responsiveness prior to absolute checkout confirmation.
3. **Manual Payments**: Keeps operating costs at zero by avoiding complex API payment gateway configurations and merchant fee splits.
4. **Security Definer Functions**: Bypasses row recursive loops when checking roles, providing solid, clean execution of security policies.
5. **Database Categories & Resins**: Elevates simple hardcoded options to robust backend database models, empowering administrators to instantly pivot or adjust store offerings.

---

## 13. Routes

| Route Path | Associated Page | Auth Requirement | Access Control Role | Description |
|------------|-----------------|------------------|---------------------|-------------|
| `/auth` | `AuthPage` | Public | Open | Google login gateway |
| `/` | `Index` | Protected | `user` \| `subscriber` \| `admin` | Main Landing Page |
| `/categories` | `CategoriesPage` | Protected | `user` \| `subscriber` \| `admin` | Main categories grid catalog |
| `/configure/photo-frames/styles` | `StyleCollectionPage` | Protected | `user` \| `subscriber` \| `admin` | Browsing panel for editing styles |
| `/configure/photo-frames` | `ConfiguratorPage` | Protected | `user` \| `subscriber` \| `admin` | 5-step frame customization wizard |
| `/configure/resin-art` | `ResinConfiguratorPage` | Protected | `user` \| `subscriber` \| `admin` | Resin catalog selector |
| `/style-gallery/:styleId` | `StyleGalleryPage` | Protected | `user` \| `subscriber` \| `admin` | Full portfolio gallery per art style |
| `/cart` | `CartPage` | Protected | `user` \| `subscriber` \| `admin` | Shopping cart drawer and checkout portal |
| `/my-orders` | `MyOrdersPage` | Protected | `user` \| `subscriber` \| `admin` | Client personal order history logs |
| `/subscribe` | `SubscriptionPage` | Protected | `user` \| `subscriber` \| `admin` | VIP Subscriber registration portal |
| `/admin` | `AdminPage` | Protected | `subscriber` \| `admin` | Administrative dashboard console |
| `/assistant` | `ChatAssistantPage` | Public | Open | Conversational Sales AI Concierge |
| `*` | `NotFound` | Public | Open | Fallback 404 router page |

---

## 14. Future Considerations

1. **Automated Gateway Integrations**: Integration of Razorpay/Stripe API endpoints for instant order processing.
2. **Direct Image Submissions**: Implement frame order flow where clients upload raw images to a secure storage bucket directly from step 5 of the configurator.
3. **Push Notifications**: Hook up mobile web-push notifications to alert users instantly as order state fields transition in the database.
4. **Subscriber Commission Models**: Expand the subscriber structure to automatically calculate payout reports based on orders processed by active VIPs.
5. **Interactive 3D WebGL Configurator**: Introduce Three.js in Step 3 to model selected frame materials and colors dynamically under custom light vectors.
