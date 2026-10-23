# Command Code Session Summary , Demo E-Commerce Client

**Branch:** `feature/mahfuz`
**Repo:** `M:\Development\Agency\eCommerce Demo Projects\aeromart-ecommerce-client`
**Last commit:** `2def101 Updated Dashboard, Auth, Implemented Settings Dynamic Module v1`
**Date of last work:** 2026-08-08

---

## 1. What This Project Is

A Next.js (App Router) e-commerce storefront + dashboard frontend for a demo store called **Attor** (perfume/clothing niche). Backend is a separate repo (`aeromart-ecommerce-server`). The **single source of truth for the API** is:

- `docs/project-tracking/backend-usage-guide.md` (2263 lines, heavily updated , read it before touching API-adjacent code)

Stack notes:
- **UI:** Base UI (`@base-ui/react`), shadcn-style components under `components/ui/`, Tailwind v4.
- **State:** Zustand (`lib/store/app-store.ts`) with `persist` for the cart.
- **Forms:** react-hook-form + zod v4.
- **Animations:** framer-motion (installed this session).
- **Server actions:** services under `lib/services/*.ts` marked `"use server"`.
- **Auth:** JWT in an httpOnly `accessToken` cookie; `lib/get-session.ts` decodes it server-side; `proxy.ts` does edge routing + role guards.
- **IMPORTANT (from AGENTS.md):** This is a custom Next.js build , read `node_modules/next/dist/docs/` before writing Next code. Deprecations are real.

---

## 2. What Was Done This Session (in order)

### 2.1 Table link buttons fixed
- All dashboard table icon buttons (view/update on users, products, categories, brands, coupons, orders + "Create X" header buttons + detail-page Back/Update buttons + `detail-error.tsx` + unauthenticated page) had `<a>`/`<Link>` nested inside `<Button>` (only the icon was clickable).
- **Fix pattern:** Base UI `render` prop → `<Button render={<Link href=... />}>` renders the button AS the link (whole button clickable, no nested-anchor hydration errors).

### 2.2 Payment result page + invoice flow
- `/payment/success` & `/payment/failed` share `components/public/payment/payment-result.tsx`.
- Success page: guard rail when no `tran_id` (amber "Payment Received" card + Return Home), trimmed transaction id + copy button, "Invoice" button.
- **Invoice download flow (after many corrections , READ THIS):**
  - The shared flow = `useInvoiceDownload` hook (`hooks/use-invoice-download.tsx`) → `getOrderInvoice(orderId, { by? })` → verify result → `InvoiceDocument` react-pdf render → download.
  - The backend added `?by=transactionId` on `GET /order/:orderId/invoice` , the payment success page calls `downloadInvoice(tran_id, { by: "transactionId" })` directly.
  - **NO sessionStorage, NO getMyOrders, NO getOrderById, NO eager fetch on page load** , the user was emphatic. Fetch only on button click.
- Checkout no longer writes `pendingOrderId` to sessionStorage.

### 2.3 Theme colors for success/failed/error pages
- Success page = `text-primary` / `bg-primary/10` / gradient `from-primary via-primary/70 to-emerald-400`.
- Failed + error + not-found pages = `text-destructive` / `bg-destructive/10` / gradient `from-destructive via-destructive/70 to-amber-400`.
- All theme-aware (use CSS vars), consistent across `error-page.tsx`, `not-found-page.tsx`, `payment-result.tsx`.

### 2.4 Settings-driven dynamic navbar/footer/auth
- `app/(public)/layout.tsx` (server) fetches `getSettings()` + `getSession()` in parallel, passes brand + nav links + footer data to client `Header`/`Footer`.
- **Navbar rule (user-specified, strict):** `navbar.links` first, then role-based links , logged out → `groups.auth`; customer → `groups.customer`; admin → `groups.admin`. **`groups.public` is SKIPPED.** No hardcoded extra links (Track Order / Dashboard) in the header.
- **Footer:** dynamic brand (name/logo), `footer.description`, `footer.columns` (title+links), `footer.copyrightText`, `footer.socialLinks` (platform→icon mapping with lucide, e.g. twitter→AtSign, instagram→Camera, facebook→ThumbsUp, fallback Globe), payment logos (`bkash-pay-logo`, `sslcommerz-pay-types-logo`, `stripe-pay-logo`).
- **Auth pages:** login/signup pages are server components that fetch settings and pass `brand` to the client form components (logo + name in header).

### 2.5 Track-order public page (`/track-order`)
- `app/(public)/track-order/page.tsx` + `components/public/track-order/track-order-client.tsx`.
- Uses existing `trackOrder(orderId)` → `GET /order/track-order/:orderId`.
- Search card, animated loading, error state, result (status badges, 4-step progress tracker, delivery/payment cards, items, status history).
- Example shown: `DEY2H7ULPD` (new no-hyphen orderId format).

### 2.6 Framer-motion on all public pages (home, products, product detail, track-order, about, contact)
- `components/shared/reveal.tsx` , `Reveal` wrapper (whileInView, once), `fadeUp`, `staggerContainer`, `viewportOnce`.
- **Performance guardrails:** animate only `opacity` + `transform` (GPU-cheap), `once: true` so no re-trigger, keyed re-animation on filter/page change.
- Home: banner (slide content re-animates per slide), features-bar, categories, featured/new arrivals (per-card stagger), offer-section (image slides in), brand-story, testimonials, newsletter.
- Products page: header fade, sidebar slides from left, grid stagger keyed by `category-brand-page`.
- Product detail: gallery/info columns stagger on mount, reviews + related reveal on scroll.
- About/Contact: fully rebuilt with framer-motion + zod-validated contact form + settings-driven content.

### 2.7 Products page filtering
- Category filter now loads from `getAllCategories` (active only) with "All" option; brand filter from `getAllBrands` (active only) with "All".
- **Search lag fix:** local `searchDraft` state + 350ms debounce; only commits to URL params (`router.push`) after pause. Filters don't eat mobile space: mobile filters open as a **floating bottom-sheet** (fixed overlay, backdrop, "Show N results" button); desktop keeps inline sticky sidebar.
- Grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` (1 → 2 → 3).

### 2.8 Product card + detail
- **No-image fallback:** gradient background + product title centered (all 3 card variants route through `ProductImage`).
- Details button: label always visible, Eye icon hidden on mobile.
- Buy Now (adds to cart + redirects `/checkout`) + Add to Cart; taller tap target on mobile (`min-h-12 sm:min-h-11`).
- "You May Also Like": `grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4`.
- Skeleton loader on both product list & detail pages (server-side Suspense fallbacks).

### 2.9 Checkout
- Delivery Method radio options (Store Pickup / Inside Dhaka 90 / Outside Dhaka 150) , **now settings-driven**: fetch `getSettings()` in useEffect, build options from `brand.deliveryOptions` (active only), fallback to static defaults.
- Order create sends **`deliveryOptionName`** (NOT `deliveryCharge` , backend computes charge).
- Zero-charge option = pickup → no delivery address required ("Store Pickup" as shippingAddress).
- Review/Details steps are clickable pill buttons; quantity +/- per item (variant-aware); cart count live in navbar + sidebar; tax line REMOVED (tax is baked into product prices).

### 2.10 Cart
- zustand `persist` (localStorage `demo-ecomm-cart`) , survives reload.
- Variant-aware `updateItemQuantity` + variant-aware `removeItem`.
- `formatCurrency` everywhere (see 2.11).
- Cart count reactivity fixed by selecting `items` slice directly (not `itemCount()` function , stale "10 items" bug).

### 2.11 Currency
- `lib/utils/currency.ts` , `formatCurrency(amount, currency)`, `currencySymbol`, `getOfferPrice`, `hasActiveOffer`.
- Symbols: usd `$`, eur `€`, gbp `£`, inr `₹`, aed `AED `, aud `A$`, cad `C$`; **bdt renders as `1,250 BDT` (label after amount)**.
- Whole amounts render without `.00`; decimals only when there's a fractional part (user: "don't show floating value unless there is floating value").
- Product carries `currency` from backend; storefront `Product.currency` wired through adapter → cards, detail, cart, checkout.

### 2.12 Backend-guide-driven updates (THE BIG ONE)
The user pasted 7 API changes; "some were done already." What was implemented:
1. **Settings brand `currency[]` + `deliveryOptions[]`** , types added; brand settings editor now has a Store Currencies list (first = Active) + Delivery Options editor (name/charge/country/active).
2. **Product create no longer sends currency** (already true). Product now returns `offerPrice`, `colorOptions`, `variants` (with sku), `hasVariants`, and `imageUrls` as `{publicId, url, order}` objects (order:0 = cover). Storefront adapter picks cover by sorted `order`. **Product create/update forms got Color Options / Variants / Offer Price editors** (`components/dashboard/shared/product-pricing-editors.tsx`).
3. **Order create/update sends `deliveryOptionName`** , checkout + admin order form updated.
4. **User profile `photoUrl: ""` removes photo** , profile form got a "Remove photo" button.
5. **Order orderId now `DEY2H7ULPD` (no hyphen)** , track-order example updated; track endpoint only accepts that format.
6. **Review module** , `GET /review/my-reviews`; `isVerifiedPurchase` computed server-side from paid orders.
7. **`GET /order/:orderId/invoice?by=transactionId`** , payment success page already wired (see 2.2).

### 2.13 Review module (admin + customer)
- **Admin:** `/dashboard/admin/reviews` (list: product, customer, rating stars, verified/flagged badges, view) + `/dashboard/admin/reviews/[id]` (detail with **flag-with-reason** textarea → `PATCH /review/:id/status` with `{ flaggedReason }`, unflag, delete with confirm). Sidebar nav "Reviews".
- **Customer:** `/dashboard/customer/reviews` , `getMyReviews`, All/Verified filter tabs, empty state. Sidebar nav "My Reviews".
- **Public product page:** "Write a Review" form for logged-in customers (star rating 1–5 + description, zod-free manual validation, `createReview`, backend computes `isVerifiedPurchase`). `canReview` + `productId` passed from server component via `getSession()`.

---

## 3. Known Issues / Fixes Needed (the user said "needs some fixes")

These are **open / not yet verified end-to-end**:

1. **Dashboard 404 issue (RESOLVED but fragile):** `/dashboard/admin/*` and `/dashboard/customer/*` were 404ing because the `.next` dev cache was stale/corrupted (partial `app-paths-manifest.json`, corrupted `routes.d.ts`). Fixed by deleting `.next` and restarting dev. **Guardrail:** if routes 404 again after a big change, delete `.next` and restart the dev server , it regenerates the route manifest.
2. **`process` typecheck errors in `lib/services/api-client.ts` + `auth.ts`:** `process.env.NEXT_PUBLIC_BASE_API` errors `TS2580 Cannot find name 'process'`. Root cause: `next-env.d.ts` imports `./.next/dev/types/routes.d.ts` which only exists after dev/build runs. The errors are transient (vanish after dev server regenerates `.next`) , NOT a code bug. Do not "fix" by editing next-env.d.ts.
3. **Pre-existing deleted files:** `components/unauthorize/index.tsx` is deleted in the working tree, so `app/unauthorized`, `app/unauthorize`, `app/unauthenticated` pages still import it → typecheck errors. User confirmed these routes are not needed. **If typecheck shows `Cannot find module '@/components/unauthorize'`, either delete those page files or recreate the component** , decide with user before deleting the route pages.
4. **Review flag reason:** `toggleReviewFlag` sends `{ flaggedReason }` as a body on `PATCH /review/:id/status`. The backend guide documents the endpoint as **bodyless** (just toggles). If the backend strictly rejects a body, the flag-with-reason will 400 , needs a quick verify against the live server, then either remove the body or confirm the backend accepts it.
5. **Admin product create/update forms + brand settings new editors** (`colorOptions`, `variants`, `offerPrice`, currency list, delivery options) are built but **not verified against the live backend** , payload shapes should match the guide (e.g. variants `{sku, attributes, price?, stock}`, offerPrice `{type, value, startAt?, endAt?}`), but confirm field names with a real create/update.
6. **`formatCurrency` whole-number rule** changed behavior everywhere (e.g. `$1,250` not `$1,250.00`). Check totals screens (checkout summary, invoice, track-order, admin orders) still look right; if any spot needs forced decimals, pass `{ minimumFractionDigits: 2 }`.
7. **Variants on the storefront detail page:** the backend now returns real variants (`attributes/sku/price/stock`), but the storefront `Product.variants` is the old `{name, options}` shape and the adapter does NOT map backend variants yet , so variant selectors don't show for backend products. If the user asks, map `product.variants` through the adapter and render attribute selectors with price override.
8. **Admin order form** replaced the numeric Delivery Charge with a free-text Delivery Option name , ideally it should be a **Select populated from settings `brand.deliveryOptions`** rather than free text (user preference: dynamic options from settings).
9. **`ProductImageUploader`** existing-image reorder now reports `keepImages`; verify the drag/drop of existing images + remove → `removedImageIds` round-trips correctly on the live backend (imageUrls objects).

---

## 4. Rules & Guardrails (from the user, strictly enforced)

- **API truth = `docs/project-tracking/backend-usage-guide.md`.** Read it before touching anything API-adjacent.
- **`tran_id` invoice flow:** call `getOrderInvoice` → verify result → pass to react-pdf renderer, **reused/shared** like the dashboard. NO sessionStorage. NO eager fetch. NO custom lookup chains (getMyOrders/getOrderById) , resolve only what's needed, on click.
- **Navbar:** main links → role group (auth/customer/admin). Skip `groups.public`. Don't hardcode extra links.
- **Settings-driven content:** public pages (footer, navbar, auth brand, contact, about, checkout delivery options) read from settings with static fallback when unreachable.
- **Currency:** product `currency` drives display; BDT = `1,250 BDT`; no trailing `.00` on whole numbers.
- **Framer-motion:** only opacity/transform, `once: true`, no lag; dashboard untouched (user: "for now dashboard (don't implement)").
- **Tax:** not modeled , tax is included in product price. Don't add tax lines.
- **Payment logos:** footer uses `sslcommerz-pay-types-logo`; checkout + customer dashboard payment section use `sslcommerz-pay-logo` (plus bkash, stripe).
- **Edge cases matter:** user says "maintain all types of edge cases" , empty states, missing images, pickup vs delivery, min quantity 1, guest vs logged-in, empty carts, etc.
- **Icon/UI choices follow the codebase:** Base UI `render` prop for link buttons (never nested anchors), shadcn components over raw HTML, lucide icons.

---

## 5. Writing Style & Conventions

- **Responses:** direct, first-person, no preamble. Short final summaries with **bold** + bullet lists (no `###` headings in chat replies). Explain before/after tool calls.
- **Code:** follow existing patterns , 4-space indent in dashboard components, 2-space in home/public components (match the file you're editing); server actions in `lib/services`; modular types (`lib/types/modules/*`); shared UI editors under `components/dashboard/shared/`.
- **Typecheck command:** `npx tsc --noEmit 2>&1 | findstr /v "unauthenticated unauthorize .next" | findstr "error"` , filters known noise. Exit code 1 with no output = clean.
- **No git commits unless explicitly requested.** If committing, use HEREDOC with `Co-authored-by: CommandCodeBot <noreply@commandcode.ai>` trailer.
- **Kill background processes** (dev servers) when done.
- **Taste (learned preferences)** lives in `.commandcode/taste/` , read the relevant category file before working in a domain (styling, shadcn, code organization, data fetching/SSR, workflow, error handling, auth, dashboard).

---

## 6. Next Steps (suggested order)

1. Verify the 7 open fixes in section 3 against the live backend (esp. #4 flag-with-reason body, #5 new product editors payload, #9 image keep/remove).
2. Clean up the stale deleted-route imports (`app/unauthorized` etc.) with the user's sign-off.
3. If requested: map backend variants into the storefront detail page (section 3.7).
4. Consider converting the admin order-form delivery option to a settings-driven Select (3.8).
