# Summary for New Chat — AeroMart → Nittonova Design Transition

Read this fully before doing anything. Last updated: 28/10/2026.

## Context

Two repos under `/home/mahfuzzayn/Documents/Development/Company/AeroMart/`:
- `aeromart-ecommerce-client/` — Next.js **16.2** App Router, React 19, Tailwind **v4** (no config file), shadcn (`components/ui/`), framer-motion, embla, zustand, zod. Dev port 3000.
- `aeromart-ecommerce-server/` — Express + Mongoose. Dev port 5000 (`NEXT_PUBLIC_BASE_API`). API guide: `docs/project-tracking/backend-usage-guide.md` (READ FIRST — rule 1).

Goal: convert the generic storefront to the design of **nittonova.com** (ECS NOVA), section by section, 95%+ fidelity, then apply Nittonova-style design to ALL pages. Progress log + rules live in `docs/project-tracking/works.md` (keep it updated with ✅ entries per completed work — the user expects this).

**Design references**: `public/images/references/` — **read `readme.md` there first**; it maps every screenshot to its section and tracks ✅ DONE / ⬜ TODO status. Every storefront section is done; the remaining ⬜ rows are the two dashboard references (overview, profile — note the profile file has a doubled `.png.png` extension). Design ONLY from these cropped screenshots, never from the live site's HTML.

## Rules (user-enforced, follow strictly)

1. Read `backend-usage-guide.md` before touching data flows.
2. **No new packages** — suggest, user verifies.
3. Follow project code standards; readable, maintainable, reusable.
4. Keep reads token-efficient (codebase-memory-mcp if connected; otherwise targeted reads/Explore agents).
5. Mind edge cases, quality, reusability.
6. Verify every change: `npx tsc --noEmit` + `npm run build` (client) / `npx tsc --noEmit` (server). ESLint is broken in the checkout (missing eslint-config-next) — ignore it.
7. `AGENTS.md`: this Next.js version differs from training data — check `node_modules/next/dist/docs/` before using unfamiliar APIs.
8. **Build from scratch when redesigning** — replace the previous generic/AI design completely, don't blend. Design consistency + reusable components over copy-pasted markup; tokens only, never raw palette classes.

## Design system (all centralized in `app/globals.css`)

- Tokens (light+dark): shadcn names + Nittonova extras: `--brand` (#f0512e orange), `--header-nav` (charcoal #232323), `--hero-surface` (cream #FAF3E7), `--success/--warning/--info/--highlight/--teal`, on-dark pairs `--header-nav-foreground`/`--scrim`/`--scrim-foreground`/`--destructive-foreground` (static in both themes), `--radius: 0.5rem`, `--radius-box`, `--radius-badge` (pill). **Never hardcode colors** — the admin theme editor + presets can override tokens at runtime. A repo-wide grep for `-{red|zinc|green|amber|…}-{2,3-digit}` palette classes must stay at 0 hits.
- Fonts: **Jost** (body, weight 500) + **Oswald** (h1–h6 via `font-display`). No other fonts anywhere.
- Recurring patterns: bold heading + **orange underline dash**; charcoal icon squares (`bg-header-nav`) with white icons; uppercase micro-labels (`text-[10px] font-bold uppercase tracking-[0.25em]`); cream page surfaces (`bg-hero-surface`) with white rounded-2xl cards; light status pills (`bg-success/15 text-success` etc.); hover = lift `-translate-y` + shadow, links shift right (`translate-x-1`, NO underline) — links must be `inline-block` or transforms won't apply.
- **Form fields (single source)**: `components/ui/input.tsx` — `h-11 rounded-lg` (resolves to `var(--radius)`, dynamic-theme safe), `px-4`, brand-tinted focus, errors via `aria-invalid`. Textarea + SelectTrigger match. No per-page field classes.
- **Buttons (single source)**: `components/ui/button.tsx` — base `rounded-lg`, focus matches fields; storefront CTAs `<Button variant="brand" size="xl">` (orange, h-11 = field height); cards `variant="brandOutline"`; solid danger `variant="destructiveSolid"`; Links use `buttonVariants({...})`. No hand-rolled CTA markup.
- Shared components (reuse, don't recreate): `components/shared/` → `product-card.tsx` (THE Nittonova product card + `getProductPricing`), `use-add-to-cart.ts` (variant-aware hook used by card + list rows), `product-shelf.tsx`, `section-header.tsx`, `carousel-dots.tsx`, `chat-widget.tsx`, `star-rating.tsx` (brand stars; compact + five-star), `order-status-badge.tsx` (canonical status→variant, case-insensitive), `activity-badges.tsx`, `page-hero.tsx`, `auth-shell.tsx` (`authLabelClass`). Badge has status variants (`success/warning/info/highlight/teal/neutral`); Pagination is the numbered charcoal-chip style (used above AND below grids).

## Architecture decisions

- **Public chrome wraps everything**: `app/(public)/layout.tsx` renders Header, children, Footer, CartSidebar, ChatWidget. Auth pages AND `dashboard/` live inside `(public)` — dashboard between header/footer, protected by `proxy.ts` (unchanged URLs; role guards intact).
- Header nav = Home · Products · top-3 live categories · Track Order · Return & Refund Policy. Role links live in the Account hover dropdown / mobile drawer footer.
- Home order: Banner → Categories (plain centered row when tiles fit, else looping embla) → Trending → up to 10 category shelves → FeaturesBar → Testimonials → Newsletter. BrandStory/NewArrivals/OfferSection unused (files remain).
- **Products page** (`components/public/products/products.tsx`): URL params are the state — `?search=` (header search; `searchTerm` also accepted for old links), `?category=` accepts **slug OR name** (resolved against the categories list; everywhere in the app links by slug), `brand`, `sort`, `minPrice/maxPrice`, `inStock`, `page`. Grid + list views, mobile filter bottom-sheet, PageHero banner when a category is active.
- **Product details**: gallery = SKU images → product images fallback, index resets on SKU change; price = variant-aware while an offer is active (backend rule); reviews = customer-only + verified purchase; `contactPhone` prop (from settings) powers the WhatsApp/Call row.
- **Checkout**: two steps (editable cart review → details). Numbered section cards; ALL payment flows (COD/Stripe/SSLCommerz/bKash) and delivery options from `settings.brand.deliveryOptions` — preserve verbatim when restyling.
- Dashboard shell: sidebar themed via `--sidebar-*` tokens (orange active), cream page bg. Status pills everywhere must go through `OrderStatusBadge`/`activity-badges`.
- `settings.brand.logoOnly`: toggle lives in `brand-settings-content.tsx` under the Logo upload (disabled with an amber warning when no logo exists). Storefront shows ONLY the logo at natural aspect; brand name renders exactly as typed.
- **Auth OTP is 6 digits end-to-end**: server `generateOtp` + `/^\d{6}$/` validation; branded email template (`src/templates/forgotPassword.template.hbs`) uses theme colors, `FRONTEND_URL/images/logo.png`, `{{appUrl}}` links (dev/prod safe). Sender name "AeroMart".
- ThemeProvider injects the settings theme OVER globals.css at runtime — **deferred**: align DB theme/preset with Nittonova or it overrides the tokens (user knows; "get back later").

## Mistakes to avoid (hard-won)

- **Never design from the live site's HTML** — nittonova.com is Inertia/Vue; served HTML has no markup. Use the cropped references in `public/images/references/` (see readme.md manifest).
- Don't surface raw backend error strings — map to friendly copy.
- CSS transforms don't work on inline `<a>` — make them `inline-block`.
- Embla fights CSS centering — when content fits, don't render a carousel at all.
- Fast fetches need a ~900ms minimum loading duration so results animate in.
- Status UIs need plain-language labels + explainer text, not raw enums.
- Route groups don't change URLs — moving `dashboard` into `(public)` kept guards working; prefer that over layout duplication.
- next/image with remote/unknown-size logos: `width={0} height={0}` + `className="h-10 w-auto"`.
- Verify WHICH component a route renders before wiring UI into it (the logoOnly toggle once landed in dead code). `settings-manager.tsx` is fully unused — deletion still pending user approval.
- Buttons in forms match the field radius (`rounded-lg`); pill shapes are for badges/chips only.

## Completed (all verified: tsc + build)

**Storefront — full Nittonova rebuild done (25/10/2026):** home (banner, categories, Trending + shelves, features, testimonials, newsletter, footer, chat widget), header (white bar + charcoal nav + account menu + search overlay + drawer), auth (login/register/forgot-password, 6-digit OTP), about/contact/track-order/return-refund (PageHero v2), **products page** (Shop + filter sidebar + category/search params + grid/list + pagination + empty state), **product details** (gallery, buy box, description, reviews with bars, similar products), **cart drawer**, **checkout** (all payment flows kept).

**Systems:** app-wide form-field + button unification (single sources in `components/ui/`); token sweep (zero raw palette classes); reusable shared components (`product-card`, `star-rating`, `order-status-badge`, `activity-badges`, `use-add-to-cart`, `getProductPricing`); Badge status variants; numbered Pagination restyle; `keyFeatures` mapped through `toStorefrontProduct`; category slug-or-name param resolution; header search `?search=`; brand logoOnly toggle live; OTP 6-digit + AeroMart email template (server); footer brand block links home.

## Next (user's stated order, 28/10/2026)

1. **New updates on `/products` + single product** — refinements/fixes on top of the 25/10 rebuilds (get specifics from the user in chat).
2. **Dashboard — whole update** — full redesign of the remaining admin + customer pages in the Nittonova tone, from the two dashboard references (overview ✅ done earlier as a themed pass; profile per `nittonova-dashboard-page-large-device-profile.png.png`). Reuse: OrderStatusBadge, activity-badges, StarRating, ProductCard, Button variants, Badge variants, ui Input/Select — the dashboard already runs on these, so restyle shells around them.
3. **Small fixes** — the user will list them in the new chat.
4. Deferred/known: dynamic theme applying + ThemeProvider/DB alignment (user deferred); admin review module; server SSLCommerz v3→v4 fix; delete `settings-manager.tsx` (awaiting user verification).

When done with any work: update `works.md` (✅ + short description, keep the ✅/🚫 convention), flip the reference row in `public/images/references/readme.md` to `✅ DONE`, and keep this file current.
