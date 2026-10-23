# Requirements Document - Attor (E-commerce Demo)

**Project Type:** Outreach Demo Product
**Purpose:** A polished, dynamic-feeling e-commerce frontend used as a portfolio/demo asset to show prospective clients (clothing, eyewear, and similar retail niches) what Morlabs can build for them.
**Scope:** Frontend only (no real backend/payment processing - data can be mocked/local for now, but structured so a backend can be plugged in later without a rewrite).
**Build tool:** Command-line coding agent (DeepSeek V4 Flash model via CLI).
**Team:** 2 people (Morlabs)

---
## 1. Objective

Build one flexible, good-looking storefront + admin dashboard that can be **re-skinned per niche** (clothing, eyewear, and future verticals) by swapping data, colors, logo, and copy - not by rebuilding pages. The goal is speed of reuse across outreach demos, not a one-off perfect product.

**Success criteria:**
- A prospect can browse the full customer journey (home → product → checkout) and believe it's a real, live store.
- Morlabs can duplicate/re-theme this demo for a new niche in under a day.
- The dashboard convincingly demonstrates "we can also build your internal tools," supporting the upsell from website → business system (per our tiered offer strategy).

---

## 2. Tech Stack (Frontend Only)

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js (React) | SSR/SEO-friendly, matches our SEO service offering, good for demo performance |
| Styling | Tailwind CSS | Fast to theme per niche via config tokens |
| State | React Context / Zustand | Lightweight, no backend dependency needed |
| Data | Local JSON / mock API layer (e.g. `lib/data/*.json` + typed fetch functions) | Structured so it can be swapped for a real API/CMS later with minimal refactor |
| Images | Static/placeholder assets per niche (clothing/eyewear sets) | Stored in `/public/demo/<niche>/` |
| Icons | Lucide-react | Consistent, lightweight |
| Deployment | Vercel (or similar static/edge host) | Free tier sufficient for demo purposes |

> Note: Since this is a demo, all "admin" actions (creating a product, updating an order) should **persist only in local/session state or local JSON**, not a real database - but the UI/UX should feel fully functional to a prospect clicking through it live.

---

## 3. Site Map

```
/                     → Home Page
/products              → Products Page (listing, filter, search)
/products/[slug]        → Product Details Page
/checkout                → Checkout Page
/about                     → About Us
/contact                    → Contact Us
/dashboard                    → Admin Dashboard (Orders, Products, Customers)
```

---

## 4. Feature Requirements

### 4.1 Admin Dashboard

The dashboard exists to demonstrate Morlabs' "custom business software" capability, not just the storefront. Should feel like a real internal tool.

#### 4.1.1 Order Management
- List all orders in a table: Order ID, Customer, Date, Total, Status, Payment Status.
- Order status lifecycle (visual stepper or badge): `Pending → Confirmed → Processing → Shipped → Delivered` (+ `Cancelled` / `Refunded` as side states).
- Click into an order → detail view: items ordered, customer info, shipping address, status history/timeline.
- Ability to manually update order status (dropdown or stepper click) - updates reflected instantly in UI (mocked persistence).
- Basic filters: by status, date range, search by customer name/order ID.

#### 4.1.2 Product Management (CRUD)
- Table view of all products: thumbnail, title, price, category, status (active/inactive), stock (optional).
- **Create/Edit Product form:**
  - Image upload (or image URL for demo simplicity)
  - Title
  - Short description
  - Price (+ optional compare-at/original price for discount display)
  - Category
  - Is Active toggle
  - CTA button label (e.g. "Add to Cart", "Buy Now", "Notify Me" - configurable per product)
- Delete product (with confirm modal).
- **Offer Management** (subset of product, or a distinct "Offers" tab):
  - Feature a single product as a homepage offer/promo.
  - Fields: Image, Title, Short description, Price, Is Active, CTA button.
  - Toggle which product is currently "the" homepage offer.

#### 4.1.3 Customer Management
- Table view: Name, Email, Phone, Total Orders, Total Spent, Last Order Date.
- **Logic requirement:** When an order is placed (in the storefront checkout flow), the system checks if the customer already exists by **email or phone number**:
  - If exists → increment their order count / total spent, append to order history.
  - If not → create a new customer record.
- Click into a customer → see their order history and basic profile.
- Search/filter by name, email, or phone.

---

### 4.2 Home Page

| Section | Requirements |
|---|---|
| **Header** | Logo, nav links (Home, Products, About, Contact), cart icon w/ item count, sticky on scroll, mobile hamburger menu |
| **Banner** | Hero section - large image/lifestyle shot, headline, subtext, CTA button (e.g. "Shop Now") - should be easily swappable per niche |
| **Offer** | Single featured product promo pulled from Dashboard → Offer Management. Includes image, title, short description, price, active CTA |
| **Category** | Grid/carousel of category tiles (e.g. clothing: Men/Women/Accessories; eyewear: Sunglasses/Optical/Kids) linking to filtered product listings |
| **Featured Products** | Grid of 4–8 hand-picked or "active" products, each with image, title, price, quick "Add to Cart" |
| **Testimonials** | Carousel/grid of 3–5 customer quotes with name, photo/avatar, star rating - static demo content, styled to feel authentic |
| **Footer** | Logo/tagline, nav links, social icons, contact info, newsletter signup input (non-functional in demo), copyright |

---

### 4.3 Products Page
- Grid layout of all active products (image, title, price, quick-view or add-to-cart).
- Filter sidebar/bar: by category, price range, and (optional for v1) sort (price low-high, newest, popularity).
- Search bar.
- Pagination or infinite scroll (pick one - infinite scroll is simpler to demo).
- Empty state handling (e.g. no results for a filter).

### 4.4 Product Details Page
- Image gallery (main image + thumbnails, or simple carousel).
- Title, price (with compare-at price/discount badge if applicable), short + full description.
- Variant selectors if relevant to niche (e.g. size/color for clothing, frame color for eyewear) - can be simple UI even if not deeply functional.
- Quantity selector + Add to Cart / Buy Now CTA.
- Related/"You may also like" product carousel.
- Basic trust elements: shipping info, return policy blurb, reviews/ratings section (static for demo).

### 4.5 Checkout Page
- Cart summary (items, quantity, price, subtotal).
- Customer info form: Name, Email, Phone, Shipping Address.
- Payment method section - **mocked** (e.g. "Cash on Delivery" + a disabled/demo card field) since this is frontend-only.
- Order confirmation step/page on submit - this write action is what triggers the Customer Management logic (match-or-create by email/phone) and creates a new Order visible in the Dashboard.
- Basic form validation (required fields, email/phone format).

### 4.6 About Us
- Brand story section, mission/values, imagery - static content, easily editable per niche re-skin.

### 4.7 Contact Us
- Contact form (Name, Email, Message) - submit shows a success state (no real email sending needed for demo).
- Business info: address, phone, email, map embed (optional), social links.

---

## 5. Non-Functional Requirements

- **Responsiveness:** Fully responsive across mobile, tablet, desktop - this will be viewed live on client calls, often on a laptop screen-share, so desktop polish is priority #1, mobile is #2.
- **Performance:** Fast load times (demo credibility depends on this) - optimize images, lazy-load below-the-fold sections.
- **Theming/Re-skin support:** Colors, fonts, logo, and product data should be centralized (e.g. Tailwind config + a single `theme.ts`/`niche-config.json`) so switching from "clothing demo" to "eyewear demo" is a config + asset swap, not a code rewrite.
- **Realistic mock data:** Product names, prices, and images should look like a real niche store, not "Lorem Ipsum" placeholders - this is what sells the demo.
- **No auth required for dashboard in demo** (skip login for speed) - but structure the dashboard route separately so auth can be bolted on later for real client delivery.

---

## 6. Out of Scope (For This Demo Phase)

- Real payment gateway integration
- Real backend/database (Postgres, etc.) - mock data only for now
- Email/SMS notifications
- Multi-language/currency support
- Real user accounts/login (customer-facing)
- Inventory/stock deduction logic beyond basic display

*(These become part of the paid "core" or "premium" offer scope when a real client signs, not part of the demo.)*

---

## 7. Deliverable Structure (Suggested for CLI build)

```
/attor-demo
  /public/demo/clothing/...
  /public/demo/eyewear/...
  /app (or /pages)
    /dashboard
    /products
    /products/[slug]
    /checkout
    /about
    /contact
  /components
    /home (Header, Banner, Offer, Category, Featured, Testimonials, Footer)
    /dashboard (OrdersTable, ProductForm, CustomerTable, etc.)
    /shared (Button, Card, Modal, Badge, etc.)
  /lib
    /data (products.json, orders.json, customers.json)
    /store (cart state, mock persistence logic)
  theme.config.ts   ← single source of truth for niche re-skinning
```

---

## 8. Priority Build Order (for limited time)

Given the 2-person team's time constraints, build in this order so a shareable demo exists as early as possible:

1. Home Page (Header, Banner, Offer, Category, Featured, Footer) - this is what most prospects see first in a screen-share.
2. Products Page + Product Details Page
3. Checkout Page (mocked)
4. Dashboard: Product Management (CRUD) - most visually impressive for the "we build software too" pitch
5. Dashboard: Order Management
6. Dashboard: Customer Management (match-or-create logic)
7. About Us / Contact Us (lowest priority - simplest static pages, do last)
8. Theming pass to produce the second niche variant (eyewear) from the first (clothing)