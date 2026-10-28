# Summary for New Chat — AeroMart Storefront (Nittonova design)

Read this fully before doing anything. Last updated: 29/10/2026.

## Context

Two repos under `/home/mahfuzzayn/Documents/Development/Company/AeroMart/`:
- `aeromart-ecommerce-client/` — Next.js **16.2** App Router, React 19, Tailwind **v4** (no config file), shadcn (`components/ui/` — NOTE: select is **base-ui**, not radix; `onValueChange` emits `string | null` → wrap with `String(value ?? "")`), framer-motion, embla, zustand, zod. Dev port 3000.
- `aeromart-ecommerce-server/` — Express + Mongoose (MongoDB Atlas), in-memory settings cache. Dev port 5000 (`NEXT_PUBLIC_BASE_API=http://localhost:5000/api/v1`), runs via `ts-node-dev --respawn` (touch `src/server.ts` to respawn + clear the settings cache). API guide: `docs/project-tracking/backend-usage-guide.md` (READ FIRST — rule 1).

Goal history: convert the generic storefront to nittonova.com design. **The storefront is now COMPLETE** (home, header/footer, auth, products, product details, cart, checkout, order success, track order, about/contact, payment pages) plus all systems below. **Next major work: the dashboard redesign** — user will bring more refinements first (new chat).

Progress log + rules: `docs/project-tracking/works.md` (keep ✅ entries updated per completed work — the user expects this, dated).

**Design references**: `public/images/references/` (+ its `readme.md` manifest). All storefront sections done; remaining reference rows are the two dashboard screenshots (overview, profile — profile has a doubled `.png.png` extension) and `nittonova-order-success-large-device.png` (added late; the user ultimately preferred a custom two-column design for that page instead — see 29/10 entries). Design ONLY from cropped screenshots, never the live site's HTML.

## Rules (user-enforced, follow strictly)

1. Read `backend-usage-guide.md` before touching data flows.
2. **No new packages** — suggest, user verifies.
3. Follow project code standards; readable, maintainable, reusable.
4. Token-efficient reads (targeted reads/greps; codebase-memory-mcp if connected).
5. Mind edge cases, quality, reusability.
6. Verify every change: `npx tsc --noEmit` + `npm run build` (client) / `npx tsc --noEmit` (server). ESLint is broken (missing eslint-config-next) — ignore it.
7. `AGENTS.md`: this Next.js differs from training data — check `node_modules/next/dist/docs/` before unfamiliar APIs.
8. Build from scratch when redesigning; tokens only, never raw palette classes (repo-wide grep for `-{red|zinc|green|amber|…}-{2,3-digit}` must stay 0).
9. After each work: update `works.md` (✅ + dated entry), keep this file current.

## Design system (all centralized in `app/globals.css`)

- Tokens: shadcn names + Nittonova extras — `--brand` (#f0512e orange), `--header-nav` (charcoal #232323), `--hero-surface` (cream #FAF3E7), `--success/--warning/--info/--highlight/--teal` (each WITH `-foreground`), `--scrim`/`--scrim-foreground`, `--header-nav-foreground`, `--destructive-foreground`, radii (`--radius` 0.5rem / `--radius-box` / `--radius-badge`).
- **Fonts (29/10)**: Jost (`--font-jost`) + **Hind Siliguri** (`--font-hind`, bengali subset) via next/font; every token stacks `var(--font-jost), var(--font-hind), sans-serif` so Latin=Jost, Bangla falls to Hind Siliguri. Oswald is gone. Local Bangla rich-text face **"Li Ador Noirrit"** (`/public/fonts/Li Ador Noirrit SemiBold.ttf`) via @font-face.
- Patterns: bold heading + orange dash; charcoal icon squares; uppercase micro-labels; cream surfaces + white rounded cards; light status pills; hover lift / link shift (`inline-block`!).
- Fields: `components/ui/input.tsx` single source (h-11 rounded-lg). Buttons: `components/ui/button.tsx` (`brand`, `brandOutline`, `destructiveSolid`, size `xl`). Status UI → `OrderStatusBadge` / `activity-badges`. Pagination = numbered chips + **Previous/Next text pills** (bottom only on /products).
- `--animate-wiggle` (2.2s loop: ~0.65s wiggle + rest) for Buy Now; `motion-reduce:animate-none`.
- **Sonner**: ALL toast styling lives in globals.css under `[data-sonner-toast]` rules (normal/success/info = primary bg, warning/error semantic, white close button). Do NOT style via `toastOptions.classNames` Tailwind classes — Sonner's inline styles beat them (that was a bug once).

## Shared components (reuse, don't recreate)

`components/shared/`: `product-card.tsx` (THE card + `getProductPricing`; Out-of-Stock chip + disabled button — plain products only), `brand-icons.tsx` (Facebook/Instagram/WhatsApp/Messenger single-color glyphs + `socialPlatformIcon(platform)` map — used by footer, contact, chat widget, product details), `use-add-to-cart`, `product-shelf`, `section-header`, `carousel-dots` (Carousel has `viewportClassName` prop for padding-inside-overflow tricks), `chat-widget`, `star-rating`, `order-status-badge`, `activity-badges`, `page-hero`, `auth-shell`, `download-invoice-button` (takes order `_id`; hook loads brand from settings for the PDF header + passes `brand.currency`), `not-found-page.tsx` (track-order-style 404 replica with Return-to-Home + Products buttons).
`components/public/order/order-success.tsx` exports BOTH `OrderSuccess` and `OrderSummaryCard` (the items/totals/delivery card — reused by /payment/failed); `components/public/payment/` has `payment-failed.tsx` + `invoice-to-tracking.ts` (invoice JSON → OrderTracking shape). `components/public/checkout/district-combobox.tsx` = searchable district select (base-ui Combobox "input inside popup"; the shared `ComboboxContent` forwards `collisionAvoidance` — pass `{ side: "shift", fallbackAxisSide: "none" }` to pin a popup below its trigger). `lib/utils/format.ts` → `paymentMethodLabel()` ("COD" → "Cash on Delivery (COD)") — use it everywhere a method is displayed.
`components/layout/search-box.tsx`: live search (debounce 350ms, min 2 chars, limit 6 + `fields` projection, AbortController, session cache, regex-metachar stripping — backend builds `$regex` from `searchTerm`).

## Architecture decisions

- **Currency (28/10)**: `bdt` → taka sign **৳**; the LIVE brand settings currency is the display truth everywhere — `toStorefrontProduct(p, brandCurrency)` prefers `brandCurrency` over the product's stamped currency; header cart total, CartSidebar (`currency` prop from layout), checkout, /order/success, /track-order, the payment pages and the PDF invoice all prefer `brandCurrency`.
- **Invoices (29/10)**: available for EVERY order (COD receipts too — the paid-only 400 was removed server-side; `payment.status` rides the payload). Default lookup accepts friendly orderId OR `_id` (the `_id` clause only runs for ObjectId-shaped params — a `$or` cast used to kill `DE…` lookups). PDF renders in brand currency, follows `logoOnly` (big 120pt mark), shows "Cash on Delivery (COD)" + payment status, Billed-to/Payment columns, PAYMENT INFORMATION box then the thank-you note pinned to the page bottom (flex spacer). **PDF money is glyph-safe**: Helvetica can't render ৳, so BDT prints as `Tk. 1,240.00` and the note reads `BDT (Tk.)` — never use the ৳ char inside react-pdf.
- **Payment result pages (29/10)**: live in `app/(public)/payment/…` (full site chrome; URLs unchanged). Both accept `?tran_id=` (invoice by-transactionId lookup) AND `?orderId=DE…` (public tracking) via `resolvePaymentOrder`. Success reuses `OrderSuccess`; failed shows `OrderSummaryCard` + a destructive card when the order resolves, standalone otherwise. PageHero + cream surface, same as /order/success.
- **PublicShell (29/10)**: `components/layout/public-shell.tsx` = the extracted (public) chrome (header/footer/cart/chat + nav fetches). The (public) layout is a thin wrapper, and the ROOT `app/not-found.tsx` wraps in it so unmatched URLs get the site frame.
- **Contact form (29/10)**: submits via Web3Forms (`https://api.web3forms.com/submit`) with `NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY` from `.env` (empty = graceful mailto fallback). Subject/from_name are brand-dynamic; fields labeled (Customer Name/Email/Subject/Message) + `botcheck` honeypot.
- **Checkout extras (29/10)**: PLACE ORDER wiggles (paused while placing); delivery radios are icon-less; district dropdown width matches the trigger exactly (`min-w-0` override on `ComboboxContent`); chat FAB has `ring-4 ring-white`.
- **About contrast (29/10)**: with the blue primary, hero subtitle is /90, masthead stat chips are WHITE pills (charcoal text), mission band type is white — nothing sits black-on-brand.
- **Search**: client-side fetch to `${process.env.NEXT_PUBLIC_BASE_API}/product?…` (server actions unsuitable for live search). Products page reads `?search=` (and legacy `?searchTerm=`), `?category=` slug-or-name.
- **/products page**: centered breadcrumb + "All Products (N)" (normal case), "SHOWING x–y OF N PRODUCTS" (uppercase), custom `SortMenu` (transparent primary-text trigger; Latest/Oldest/Price asc-desc/Name A-Z/ZA), Filters left trigger → left slide-in drawer (Categories/Brand/Colors/price Min-Max/In Stock + big charcoal Clear button; full-width on mobile). Colors filter = union of product `colorOptions` (`?color=`). Pagination bottom only.
- **Product details**: gallery = SKU images → product fallback; Buy Now wiggles; description renders admin rich-text HTML into token-styled `.rich-description` (Bangla face, all backgrounds/borders normalized away — stylesheet `!important` beats the editor's inline styles) or plain paragraphs; Out of Stock = destructive pill + disabled CTAs; verified-purchase gate notice = gray surface + foreground text.
- **Checkout (29/10)**: payments = **COD + Stripe (gateway) + bKash (Manual) + Bank (Manual)**. Manual panels show copyable destinations (`BKASH_NUMBER`, `BANK_DETAILS` constants from `docs/data/payment-info.md` via `CopyRow`) + required reference inputs (bKash sender + TrxID; NPSB ref). References + Special Notes are stored on the order's existing `notes` field (backend already had it — no migration). SSLCommerz/bKash GATEWAY radios are commented in place (init logic preserved). Form: Name/Mobile/optional Email + single Address ("Road No. / Apartment / House No. / Street / Area / Ward") + **64-district select** (`lib/data/bd-districts.ts`, local static, ascending) + Special Notes. Order Summary sticky: `top-20 md:top-[9.5rem] lg:top-[9.75rem]` (clears the sticky header).
- **/order/success?orderId=DE… (29/10)**: post-checkout landing for COD + manual payments (Stripe still returns via /payment/success). Public `trackOrder` lookup → guest-safe, reloadable, shareable. Two columns on lg (confirmation card w/ copyable order ID + Track Order + Download Invoice | order summary w/ items/totals/delivery+notes), one column mobile. Friendly not-found fallback.
- **Out of Stock semantics**: plain products → `!hasVariants && stock <= 0`; variant products flag only when a SKU is resolved.
- **Theme provider**: injects settings CSS vars over globals.css. `fontStackFor()` maps family "Jost" → `var(--font-jost), var(--font-hind), sans-serif` and appends the Bangla fallback to any family. `readableOn` in `lib/utils/color-theme.ts` = light text unless bg oklch L > 0.72 (the old contrast-race wrote near-black primaryForeground → fixed in DB 28/10).
- **Server one-off scripts** (`server/src/scripts/`): `fixThemeForeground.ts`, `fixThemeFont.ts` (family → "Jost"), `seedTestimonials.ts` (10 Bangla reviews, avatars EMPTY — owner will upload BD-region photos; initials fallback shows Bangla initials). Pattern: surgical `$set` on the settings singleton → `touch src/server.ts` to respawn (in-memory cache) → verify via curl.
- Home order: Banner → Categories → Trending → category shelves → FeaturesBar → Testimonials → Newsletter. Banner + Categories use max-w-7xl + standard gutters (aligned with header — was 1400px).

## Mistakes to avoid (hard-won)

- Never design from the live site's HTML; use the cropped references.
- Don't surface raw backend errors — map to friendly copy.
- CSS transforms don't apply to inline `<a>` — use `inline-block`.
- Embla viewport must stay `overflow-hidden`; give hover lifts room with `viewportClassName="py-4"` (clips at the padding edge).
- Fast fetches need ~900ms minimum loading so results animate in.
- **Styling Sonner via `toastOptions.classNames` fails** (inline styles win) — use globals.css `[data-sonner-toast]` with stylesheet `!important`.
- **base-ui `Select.onValueChange` emits `string | null`** — `String(value ?? "")`.
- JSX comment blocks `{/* … */}` must be CLOSED (map+`))}` then `*/}`) or the comment swallows the rest of the file.
- **When styling looks wrong sitewide, curl the live settings first** (`/api/v1/settings`) — the DB theme (fonts.family, colors) overrides globals.css. Direct DB writes need a server respawn to clear the settings cache.
- Route groups don't change URLs (dashboard lives in `(public)` with guards in `proxy.ts`).
- next/image remote/unknown-size logos: `width={0} height={0}` + `className="h-10 w-auto"`.
- Verify WHICH component a route renders before wiring UI into it (`settings-manager.tsx` is dead code; deletion still pending user approval).

## Completed (28–29/10 session; all verified tsc + build)

Categories hover/contain fixes; footer socials → shared brand icons + right-column regroup; chat widget icons; **live header search** (desktop inline + mobile dropdown panel); taka + live currency; /products rework (sort menu, filter drawer w/ colors, centered header, bottom pagination, skeleton); Bangla placeholders (Rahim Uddin / rahimuddin@example.com); **black-on-primary theme fix** (DB + derivation); **fonts → Jost + Hind Siliguri** (DB family too); contact socials → icons; product details fixes (icons, wiggle, rich description, notice colors, mobile gallery, skeleton); Sonner theming + close button; home skeleton; checkout sticky gap; Stripe restore + bKash/Bank manual payments; simplified checkout form + 64 districts; `/order/success`; Out of Stock states; home width alignment; track-order rail + input brightness; Bangla testimonials seeded.
**Task batch 2 (29/10)**: checkout district combobox (always-below, in-options search) + bKash/bank brand SVGs; /order/success rearranged (summary left, confirmation right, new-tab Track Order, bigger fonts, brand currency); track-order brighter input + copy-order-id + brand currency + full-width progress rail; invoice overhaul (pending/COD allowed server-side + friendly-id lookup fix, logoOnly, Billed-to rename, PAYMENT INFORMATION + thank-you quote, ৳/BDT); /payment/success + failed rebuilt on the /order/success design; 404 rebuilt as a track-order replica.
**Task batches 3–4 (29/10)**: Place Order wiggle + iconless delivery radios + district popup width-matched; track-order rail v2 (continuous track, Delivered circle terminates the bar, equal gaps); payment pages under (public) chrome w/ `?orderId=` support (`resolvePaymentOrder`); root 404 via shared `PublicShell`; contact → Web3Forms (env key pending); invoice v3 (120pt logoOnly mark, tighter header rule, PAYMENT INFO → thank-you order, `Tk.` PDF-safe BDT, "Cash on Delivery (COD)"); About contrast fixes (white stat chips, white mission-band type); /order/success payment-only pills; checkout terms checkbox gating PLACE ORDER; full Bangla Return & Refund Policy page (brand-dynamic, data-model ready for the dashboard rich-text editor).

## Next (user's stated plan)

1. **Dashboard — whole update** (the new chat's work) — Nittonova redesign of all admin + customer pages from the two dashboard references. Reuse the shared system (see above). The dashboard already runs on the tokens + shared components; restyle shells around them. ALSO queued by the user: connect the Return & Refund Policy page to a dashboard rich-text editor (see below).
2. **Return & Refund Policy (29/10, batch 4)**: rebuilt in full from `docs/data/return-&-refund-policy.md` (Bangla+English, 8 sections + contact panel, brand-dynamic name/tagline/phone/email from settings). The content lives in a typed `buildSections(brand)` data model inside the page — the planned dashboard rich-text editor should store the HTML/sections in the settings singleton and use this builder as the static fallback; the layout (intro card → numbered cards → contact panel) can stay untouched.
3. **Checkout terms gate (29/10, batch 4)**: the Details step gates PLACE ORDER behind an "I agree to the Terms, Privacy & Refund Policy" checkbox (`errors.terms` in the shared validation; brand link opens `/return-refund-policy` in a new tab).
4. Owner TODOs: fill `NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY` in `.env` (contact form falls back to mailto until then); test order `DE4KCY5JEA` sits in the dev DB (cancel/ignore).
5. Parked: dynamic theme full alignment; admin review module; SSLCommerz v3→v4; delete `settings-manager.tsx` (awaiting verification); SSLCommerz/bKash gateway re-enable (commented block in checkout).

When done with any work: update `works.md` (✅ + short dated description, keep the ✅/🚫 convention), flip the reference row in `public/images/references/readme.md` when a reference-based section is finished, and keep this file current.
