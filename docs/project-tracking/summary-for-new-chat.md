# Summary for New Chat — AeroMart → Nittonova Design Transition

Read this fully before doing anything. Last updated: 24/10/2026.

## Context

Two repos under `/home/mahfuzzayn/Documents/Development/Company/AeroMart/`:
- `aeromart-ecommerce-client/` — Next.js **16.2** App Router, React 19, Tailwind **v4** (no config file), shadcn (`components/ui/`), framer-motion, embla, zustand, zod. Dev port 3000.
- `aeromart-ecommerce-server/` — Express + Mongoose. Dev port 5000 (`NEXT_PUBLIC_BASE_API`). API guide: `docs/project-tracking/backend-usage-guide.md` (READ FIRST — rule 1).

Goal: convert the generic storefront to the design of **nittonova.com** (ECS NOVA), section by section, 95%+ fidelity, then apply Nittonova-style design to ALL pages. Progress log + rules live in `docs/project-tracking/works.md` (keep it updated with ✅ entries per completed work — the user expects this).

## Rules (user-enforced, follow strictly)

1. Read `backend-usage-guide.md` before touching data flows.
2. **No new packages** — suggest, user verifies.
3. Follow project code standards; readable, maintainable, reusable.
4. Keep reads token-efficient (codebase-memory-mcp if connected; otherwise targeted reads/Explore agents).
5. Mind edge cases, quality, reusability.
6. Verify every change: `npx tsc --noEmit` + `npm run build`. ESLint is broken in the checkout (missing eslint-config-next) — ignore it.
7. `AGENTS.md`: this Next.js version differs from training data — check `node_modules/next/dist/docs/` before using unfamiliar APIs.

## Design system (all centralized in `app/globals.css`)

- Tokens (light+dark): shadcn names + Nittonova extras: `--brand` (#f0512e orange), `--header-nav` (charcoal #232323), `--hero-surface` (cream #FAF3E7), `--success/--warning/--info/--highlight/--teal`, `--radius: 0.5rem`, `--radius-box`, `--radius-badge` (pill). Use utilities: `bg-brand`, `bg-header-nav`, `rounded-badge`, etc. **Never hardcode colors** — the admin theme editor + presets can override tokens at runtime.
- Fonts: **Jost** (body, weight 500) + **Oswald** (h1–h6 via `font-display`). No other fonts anywhere.
- Recurring patterns: bold heading + **orange underline dash**; charcoal icon squares (`bg-header-nav`) with white icons; uppercase micro-labels (`text-[10px] font-bold uppercase tracking-[0.25em]`); cream page surfaces (`bg-hero-surface`) with white rounded-2xl cards; light status pills (`bg-success/15 text-success` etc.); orange pill CTAs; hover = lift `-translate-y` + shadow, links shift right (`translate-x-1`, NO underline) — links must be `inline-block` or transforms won't apply.
- Shared components (reuse, don't recreate): `components/shared/` → `trending-card.tsx`, `product-shelf.tsx`, `section-header.tsx`, `carousel-dots.tsx`, `chat-widget.tsx`, `page-hero.tsx` (gradient banner: primary-led `from-primary via-primary/90 to-header-nav`, orange + violet glows; left/center variants, children slot).

## Architecture decisions

- **Public chrome wraps everything**: `app/(public)/layout.tsx` renders Header, children, Footer, CartSidebar, ChatWidget. Auth pages (`/login`, `/register`, `/forgot-password`) AND `dashboard/` live **inside** `(public)` — dashboard between header/footer, protected by `proxy.ts` (unchanged URLs; role guards intact).
- Header nav = Home · Products · top-3 live categories · Track Order · Return & Refund Policy. Role links are NOT in the nav — the "Account" hover dropdown (desktop) / drawer footer (mobile) holds Login/Register or Signed-in-as + RBAC links + red Logout (`/logout`).
- Auth pages use shared `components/auth/auth-shell.tsx` (tabs Login/Register via `/login` + `/register` — **there is no /signup**).
- Home order: Banner → Categories (centered flex row when tiles fit, else draggable looping embla carousel — measured, not guessed) → Trending → up to 10 category shelves (dynamic; skip empty) → FeaturesBar → Testimonials → Newsletter. BrandStory/NewArrivals/OfferSection are unused (files remain).
- Banner = composed artwork image (text baked in), inset/rounded on cream; dots only when >1 slide.
- Dashboard shell: sidebar themed via `--sidebar-*` tokens (orange active), cream page bg, transparent content inset; own SiteHeader removed.
- `settings.brand.logoOnly` (new, server+client): toggle in admin Settings → Brand ("Logo as brand name") — storefront shows ONLY the logo at natural aspect (height-capped, `w-auto`, never cropped). Brand name renders **exactly as typed** (no forced casing/uppercase).
- ThemeProvider (`components/theme-provider.tsx`) injects settings theme OVER globals.css at runtime — **deferred task**: align DB theme/preset with Nittonova or it overrides the new tokens (user knows; "get back later").

## Mistakes to avoid (hard-won)

- **Never design from the live site's HTML** — nittonova.com is Inertia/Vue, served HTML has no markup. Ask the user for **cropped screenshots per section** (`public/images/references/` has: header desktop/mobile, mobile nav open, hero, categories, featured, footer, footer-features, auth, dashboard overview/profile). Token extraction from their compiled CSS (cached in `/tmp/nittonova/`, may be gone) was valid; layout guesses were not.
- Don't surface raw backend error strings (e.g. "API Not Found !!") — map to friendly copy ("We couldn't find an order with that ID.").
- CSS transforms don't work on inline `<a>` — make them `inline-block`.
- Embla fights CSS centering — when content fits, don't render a carousel at all (see Categories).
- Fast fetches need a **minimum loading duration** (~900ms) so results animate in instead of flashing (see track-order).
- Status UIs need plain-language labels + explainer text (Placed/Processing/Shipped/Delivered + "Current status" card), not raw enum values.
- Route groups don't change URLs — moving `dashboard` into `(public)` kept proxy guards working; prefer that pattern over layout duplication.
- next/image with remote/unknown-size logos: `width={0} height={0}` + `className="h-10 w-auto"` keeps natural aspect.

## Completed (all verified: tsc + build)

Home (banner, categories carousel, Trending + shared card/shelf, features, testimonials dots, newsletter, footer, chat widget), header (3-row desktop/mobile white bar + charcoal nav + account hover menu + search overlay + drawer), auth (login/register/forgot-password with real OTP flow), about/contact/track-order (v2 editorial designs + PageHero), return-refund-policy page, `/register` rename, dashboard moved into public chrome + sidebar/overview themed, brand logoOnly (server schema + admin toggle + header/footer rendering), Google Maps links (contact + footer).

## Next (in the user's stated order)

1. **Products page** (`app/(public)/products/`) — restyle completely; reuse TrendingCard/ProductShelf/SectionHeader; keep filters (`searchTerm`, `category`, price) + pagination working.
2. **Product details** (`components/public/products/[slug]/product-details.tsx`) — variants, gallery, reviews (customer-only, verified purchase) already functional — redesign shell only.
3. **Cart** (cart sidebar) + **Checkout**.
4. **Dashboard full redesign** (remaining admin/customer pages; profile page per `nittonova-dashboard-page-large-device-profile.png.png`; overview ref done).
5. **Dynamic theme applying** + ThemeProvider/DB alignment (deferred with user).
6. Later (from works.md): admin review module; server-side SSLCommerz v3→v4 fix is a known backend issue.

When done with any work: update `works.md` (✅ + short description, keep the ✅/🚫 convention) and keep this file current.
