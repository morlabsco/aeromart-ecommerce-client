## Overview

This system is built for a product-first, editorial-but-approachable e-commerce experience - closer to Fabrilife's clean, warm, catalog-like feel than to a loud sport-brand billboard. The idea: let the product photography and typography carry the personality, and keep the chrome (nav, filters, cards, buttons) quiet, consistent, and almost invisible.

Where a brand like Nike burns 96px display type directly into campaign photography, this system keeps type restrained everywhere - a confident but human heading tier, clean body text, and a soft off-white canvas that photographs sit on like a lookbook page rather than a poster. The palette stays mostly neutral (`{colors.canvas}`, `{colors.soft-sand}`, `{colors.ink}`) with a single warm brand accent (`{colors.brand}`) doing all the "this matters" signaling - primary CTAs, active states, and price highlights.

The layout reads like a well-organized catalog: full-width hero banner, tight product grid, generous but disciplined spacing, soft-rounded cards instead of Nike's zero-radius flatness. Density stays comfortable rather than aggressive - this is a browsing experience, not a landing-page sales pitch.

**Key Characteristics:**
- Warm, neutral canvas (`{colors.canvas}`, `{colors.soft-sand}`) instead of stark white - gives the whole store a slightly "textile / catalog paper" feel appropriate for apparel and lifestyle goods
- A single confident brand accent (`{colors.brand}`) reserved for primary CTAs, active states, and sale/price highlights - everything else stays neutral
- Soft-rounded geometry throughout (`{rounded.md}` cards, `{rounded.full}` pills) - friendlier and less severe than a sharp-cornered sport aesthetic
- Product cards carry a light shadow and rounded corners (`{elevation.card}`) rather than sitting flat - gives the grid a gentle "products on a shelf" depth
- Typography built on a single modern grotesk family across all weights - no separate "display" font - so headings, body, and UI type feel like one unified voice
- Clear two-tier CTA system: `{component.button-primary}` (brand-colored fill) vs `{component.button-secondary}` (outline/ghost) - simple, predictable hierarchy
- Generous whitespace at section level, tight and efficient whitespace inside components - breathing room where it counts, density where it's useful (grids, filters)

## Colors

### Brand & Accent
- **Brand** (`{colors.brand}` - `#1c1c1c` primary / accent variant `#c9622a` warm terracotta): The system's signature color. Used as the primary CTA fill, active nav/filter state, and price-highlight accent. Keep this to one dominant hue - don't let a second accent compete with it.
- **Brand Deep** (`{colors.brand-deep}` - `#8f3f19`): Hover/pressed state for the accent variant, and dark-mode brand anchor.

### Surface
- **Canvas** (`{colors.canvas}` - `#ffffff`): Primary page background.
- **Soft Sand** (`{colors.soft-sand}` - `#f7f4ef`): The system's "catalog paper" tone - product card backgrounds, section alternation, filter sidebar background. Warmer than a cold gray, keeps the store feeling tactile.
- **Soft Cloud** (`{colors.soft-cloud}` - `#f0f0ee`): Secondary neutral surface for badges, secondary buttons, and input fields.
- **Hairline** (`{colors.hairline}` - `#e2ddd3`): 1px dividers between filter rows, footer columns, and card borders.

### Text
- **Ink** (`{colors.ink}` - `#1c1c1c`): Primary text - headings, product names, prices, nav.
- **Charcoal** (`{colors.charcoal}` - `#3d3a35`): Body copy, slightly softer than pure ink.
- **Mute** (`{colors.mute}` - `#7a756c`): Category subtitles, footer links, secondary metadata.
- **Stone** (`{colors.stone}` - `#a6a096`): Placeholder text, disabled labels, lowest-emphasis utility text.
- **On-Brand** (`{colors.on-brand}` - `#ffffff`): Text/icon color on top of `{colors.brand}` surfaces.

### Semantic
- **Sale** (`{colors.sale}` - `#c0392b`): Discounted price and "% off" copy.
- **Success** (`{colors.success}` - `#1f7a4d`): Order confirmation, in-stock indicators, applied-coupon confirmation.
- **Warning** (`{colors.warning}` - `#b8791a`): Low-stock notices, form field warnings.
- **Info** (`{colors.info}` - `#2856c9`): Informational banners, member/loyalty callouts.
- **Error** (`{colors.error}` - `#c0392b`): Form validation errors, failed payment states (shares hue family with Sale intentionally - both signal "pay attention to price/money").

### Category / Collection Accents
Used sparingly for seasonal collection tags or category chips - never for core UI chrome.
- **Accent Olive** (`{colors.accent-olive}` - `#6b7050`)
- **Accent Clay** (`{colors.accent-clay}` - `#a8664c`)
- **Accent Denim** (`{colors.accent-denim}` - `#3e5c76`)
- **Accent Blush** (`{colors.accent-blush}` - `#d9a893`)

## Typography

### Font Family
Fabrilife-style commerce doesn't need a separate "display" typeface - one well-cut grotesk carrying a wide weight range reads cleaner and more unified across a full catalog experience.

- **Primary (recommended): Satoshi** - a modern, slightly warm grotesk with excellent weight range (400–700), great for both large headings and small UI text. Free for commercial use.
- **Alternative: General Sans** or **Inter** - both are safe, widely supported substitutes with near-identical structure and weight coverage.
- **Fallback stack:** `Satoshi, "General Sans", Inter, -apple-system, "Segoe UI", sans-serif`
- No separate serif or script accent - keep the whole system in one typeface family to reinforce the "quiet chrome, loud product" philosophy.

### Hierarchy

| Token | Size | Weight | Line Height | Letter Spacing | Use |
|---|---|---|---|---|---|
| `{typography.display}` | 56px | 700 | 1.1 | -0.5% | Hero banner headline, homepage campaign lockup |
| `{typography.heading-xl}` | 36px | 600 | 1.2 | -0.25% | Section headers - "New Arrivals", "Best Sellers", collection page title |
| `{typography.heading-lg}` | 26px | 600 | 1.25 | 0 | PDP product title, subsection headers |
| `{typography.heading-md}` | 18px | 600 | 1.4 | 0 | Card title, filter group header, modal title |
| `{typography.body-lg}` | 17px | 400 | 1.6 | 0 | PDP description, long-form content |
| `{typography.body-md}` | 15px | 400 | 1.55 | 0 | Standard body copy, product description in cards |
| `{typography.body-strong}` | 15px | 600 | 1.5 | 0 | Product card name, nav link, filter row label |
| `{typography.button-md}` | 15px | 600 | 1.4 | 0 | Standard pill/button CTA label |
| `{typography.button-sm}` | 13px | 600 | 1.4 | 0 | Compact CTA, badge label, chip label |
| `{typography.caption-md}` | 13px | 500 | 1.5 | 0 | Product subtitle, size/color label, footer link |
| `{typography.caption-sm}` | 12px | 500 | 1.4 | 0.25% | Badge text, low-emphasis metadata, price strike-through |
| `{typography.utility-xs}` | 11px | 500 | 1.5 | 0.25% | Legal fine print, copyright row |

### Principles
Contrast between tiers is moderate, not extreme - the goal is a calm reading rhythm rather than Nike's "billboard vs. catalog" jump cut. Headings stay in the same family and just step up in weight and size, so a customer scanning the page never feels like they've hit a different brand voice. Slight negative letter-spacing on the largest headings keeps them feeling tight and confident without needing all-caps treatment.

## Layout

### Spacing System
- **Base unit:** 4px, primarily used in multiples of 4 and 8.
- **Tokens:** `{spacing.xxs}` (4px) · `{spacing.xs}` (8px) · `{spacing.sm}` (12px) · `{spacing.md}` (16px) · `{spacing.lg}` (24px) · `{spacing.xl}` (32px) · `{spacing.xxl}` (48px) · `{spacing.section}` (64–96px)
- **Section rhythm:** major homepage/PLP blocks (hero → new arrivals → featured collection → testimonials/trust → footer) are separated by `{spacing.section}` (64px desktop, scaling to 40px mobile).
- **Card internal padding:** product image full-bleed at the top of the card, `{spacing.md}` (16px) padding around the metadata block below (name, price, swatches).
- **Grid gutters:** `{spacing.md}` (16px) between product cards at desktop, `{spacing.sm}` (12px) at mobile.

### Grid & Container
- **Max width:** 1320px content container with responsive side gutters (24px mobile → 64px desktop).
- **Column patterns:** PLP grid at 4-up desktop, 3-up tablet, 2-up mobile. Homepage featured rows at 3-up or 4-up depending on content type (collection tiles vs. product cards).
- **Filter sidebar:** ~260px fixed-width left rail on desktop PLP, collapsing to a slide-over drawer triggered by a "Filters" button on tablet/mobile.

### Whitespace Philosophy
Unlike a flat sport-catalog aesthetic, this system lets whitespace do real work - cards have breathing room inside them, and sections are clearly separated rather than butted edge-to-edge. The "catalog paper" surface (`{colors.soft-sand}`) is used to visually group related content (a full PLP grid, a featured collection block) while `{colors.canvas}` resets between major sections, giving the page a gentle rhythm as the customer scrolls.

## Elevation & Depth

| Level | Treatment | Use |
|---|---|---|
| 0 - Flat | No shadow | Section backgrounds, footer, filter sidebar |
| 1 - Card | `box-shadow: 0 1px 3px rgba(28,28,28,0.06), 0 1px 2px rgba(28,28,28,0.04)` | Product cards, collection tiles - the default resting state for anything "clickable" |
| 2 - Raised | `box-shadow: 0 4px 12px rgba(28,28,28,0.10)` | Sticky add-to-cart bar, dropdowns, active filter panel |
| 3 - Overlay | `box-shadow: 0 12px 32px rgba(28,28,28,0.16)` | Modals, cart drawer, quick-view panel |

Unlike a flat sport-retail system, this one uses soft shadow as its primary depth cue instead of hairline dividers - it reinforces the "products sitting on a table/shelf" feeling appropriate to a warmer, lifestyle-driven catalog.

## Shapes

### Border Radius Scale

| Token | Value | Use |
|---|---|---|
| `{rounded.sm}` | 6px | Input fields, small tags, swatch square (if using square swatches) |
| `{rounded.md}` | 12px | Product cards, collection tiles, modals |
| `{rounded.lg}` | 16px | Hero banner container, large promo cards |
| `{rounded.full}` | 9999px | Primary/secondary CTA pills, badges, avatar, circular icon buttons, color swatch dots |

Soft-rounded geometry throughout signals "friendly and wearable" rather than Nike's zero-radius athletic severity - appropriate for a general lifestyle/apparel catalog.

### Photography Geometry
- **Product cards:** 4:5 portrait crop (apparel-friendly), full-bleed within the rounded card, sitting on `{colors.soft-sand}` if the product photo itself doesn't have a background.
- **Hero banner:** 21:9 or 16:9 wide crop, rounded `{rounded.lg}` container, headline and CTA anchored left or center depending on campaign.
- **PDP main image:** square or 4:5 primary image with a horizontal thumbnail strip below on mobile, vertical strip to the left on desktop.
- **Collection tiles:** 3:4 portrait, rounded `{rounded.md}`, with a text label overlay at the bottom using a subtle gradient scrim for legibility.

## Components

### Buttons

**`button-primary`**
- Background `{colors.brand}`, text `{colors.on-brand}`, type `{typography.button-md}`, padding `14px 28px`, height 48px, rounded `{rounded.full}`.
- Universal primary action: "Add to Cart", "Checkout", "Sign Up", homepage hero CTA.
- Pressed state (`button-primary-active`): background shifts to `{colors.brand-deep}`, no scale/opacity trick - a simple color shift keeps interactions feeling calmer than a sport-brand "tap collapse."

**`button-secondary`**
- Background transparent, 1.5px border `{colors.ink}`, text `{colors.ink}`, same padding/height/radius as primary.
- Used as the paired lower-emphasis action: "Add to Wishlist" next to "Add to Cart", "View Details" on collection tiles.

**`button-ghost`**
- Background transparent, no border, text `{colors.ink}`, type `{typography.button-md}`.
- Used for tertiary actions inside cards or toolbars: "Clear Filters", "Remove", "Edit".

**`button-icon-circular`**
- Background `{colors.soft-cloud}`, icon `{colors.ink}`, rounded `{rounded.full}`, size 40px.
- Wishlist heart, cart icon, search icon, carousel paddles.

**`filter-chip`** + **`filter-chip-active`**
- Default: background `{colors.canvas}`, 1px border `{colors.hairline}`, text `{colors.ink}`, type `{typography.button-sm}`, rounded `{rounded.full}`, padding `8px 16px`.
- Active: background `{colors.brand}`, border none, text `{colors.on-brand}`.

### Inputs & Forms

**`input-field`** + **`input-field-focused`**
- Default: background `{colors.soft-cloud}`, text `{colors.ink}`, type `{typography.body-md}`, rounded `{rounded.sm}`, padding `12px 16px`, height 48px, no border.
- Focused: 2px border `{colors.brand}`, background shifts to `{colors.canvas}`.
- Error state: 2px border `{colors.error}` with a small caption below in `{colors.error}`.

**`search-pill`**
- Background `{colors.soft-cloud}`, rounded `{rounded.full}`, height 44px, padding `10px 18px`, magnifier icon leading.

### Cards & Containers

**`product-card`**
- Container: background `{colors.canvas}`, rounded `{rounded.md}`, elevation level 1, overflow hidden.
- Image area: 4:5 crop, full-bleed to the card's rounded top corners.
- Metadata block (`{spacing.md}` padding): swatch dot row, product name `{typography.body-strong}`, category/variant subtitle `{typography.caption-md}` `{colors.mute}`, price row.
- Price row: regular price `{typography.body-strong}` `{colors.ink}`. On sale: `{colors.sale}` discounted price + strike-through original in `{colors.mute}` + "-20%" badge in `{colors.sale}`.
- Hover (desktop only): image cross-fades to a secondary product photo if available; card elevation steps up to level 2.

**`collection-tile`**
- Full-bleed photography, rounded `{rounded.md}`, gradient scrim at the bottom third, label `{typography.heading-md}` `{colors.on-brand}` overlaid bottom-left.

**`promo-banner`**
- Full-width, rounded `{rounded.lg}`, background either a photograph or `{colors.soft-sand}` flat fill for text-only promos, `{spacing.xl}` internal padding, `{component.button-primary}` or `{component.button-secondary}` anchored appropriately.

**`swatch-dot`** + **`swatch-dot-active`**
- 16px circle, rounded `{rounded.full}`, filled with the actual colorway.
- Active: 2px `{colors.ink}` outer ring with 2px white gap - same concentric-ring logic as the reference system, just slightly larger for a more tactile apparel context.

**`badge-promo`**
- Background `{colors.brand}`, text `{colors.on-brand}`, type `{typography.caption-sm}`, rounded `{rounded.full}`, padding `4px 10px`. Top-left of product card image: "New", "Sold Out" (in `{colors.mute}` variant), "Bestseller".

### Navigation

**`primary-nav`**
- Background `{colors.canvas}`, height 72px, rounded none.
- Layout: logo left, centered category nav (`{typography.body-strong}`), right cluster: search pill, wishlist icon, cart icon with item-count badge (`{colors.brand}` fill, `{colors.on-brand}` text).
- Active category gets a 2px bottom underline in `{colors.brand}`.

**`sub-nav / PLP toolbar`**
- Background `{colors.canvas}`, 1px bottom hairline.
- Left: breadcrumb `{typography.caption-md}` `{colors.mute}`. Right: "Filters" toggle + "Sort by" dropdown, both `{typography.button-sm}`.

**Mobile nav**
- Hamburger (left), logo (center), search + cart (right). Category nav collapses into a full-height left drawer; filter sidebar becomes a bottom slide-up sheet.

### Signature Components

**`pdp-accordion-row`**
- Stacked rows for "Details & Care", "Size Guide", "Shipping & Returns", "Reviews (n)" - `{spacing.lg}` vertical padding, 1px `{colors.hairline}` divider, label `{typography.body-strong}`, chevron `{colors.ink}` right-aligned.

**`cart-drawer`**
- Slides in from the right, elevation level 3, `{colors.canvas}` background, rounded `{rounded.lg}` on the leading edge only.
- Line items use the same metadata pattern as `product-card` at a condensed size, with quantity stepper and remove `{component.button-ghost}`.

**`footer`**
- Background `{colors.soft-sand}`, no top border needed (the surface shift itself is the divider).
- Four to five columns: Shop / Help / Company / Newsletter signup, each with `{typography.body-strong}` header and `{typography.caption-md}` `{colors.mute}` link list.
- Newsletter column includes an `{component.input-field}` + `{component.button-primary}` pair.
- Fine-print row at the very bottom: `{typography.utility-xs}` `{colors.mute}`.

## Do's and Don'ts

### Do
- Keep `{colors.brand}` reserved for primary actions, active states, and price emphasis - treat it as a spotlight, not a background fill.
- Let product photography breathe inside the rounded card - never crop tighter than the card's padding allows.
- Use `{elevation.card}` consistently on every clickable card so the whole grid reads as uniformly "tappable."
- Keep the whole system in one type family across all weights - resist the temptation to add a "display font" for the hero.
- Use `{colors.soft-sand}` to group related sections (a PLP grid, a footer) and `{colors.canvas}` to reset between major blocks.

### Don't
- Don't introduce a second bright accent color competing with `{colors.brand}` - category accents stay confined to tags/chips, never CTAs.
- Don't use sharp `{rounded.none}` corners anywhere in this system - it undercuts the warm, approachable positioning.
- Don't stack more than one `{component.button-primary}` in the same viewport/fold - pair it with `{component.button-secondary}` or `{component.button-ghost}` instead.
- Don't let product card metadata padding go to 0 - unlike a flat sport-catalog system, this one needs breathing room inside the card itself.
- Don't use the sale/error red (`{colors.sale}` / `{colors.error}`) for anything decorative - it's reserved for price and validation signaling only.

## Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
|---|---|---|
| desktop-large | 1440px+ | 4-up PLP grid, full nav, 260px filter sidebar |
| desktop | 1200–1439px | Same layout, gutters compress slightly |
| tablet | 768–1199px | PLP grid drops to 3-up; filter sidebar becomes a toggled drawer |
| mobile-landscape | 600–767px | PLP grid drops to 2-up; nav center cluster collapses to hamburger |
| mobile | 320–599px | 2-up grid retained (apparel catalogs read better at 2-up than 1-up on mobile); hero headline scales from 56px to 32px |

### Touch Targets
All interactive elements meet a 44×44px minimum. Primary/secondary buttons sit at 48px height. Icon-circular buttons sit at 40px with padding extending the tappable area to 44px+. Filter chips sit at 40px height.

### Collapsing Strategy
- **Filter sidebar:** 260px fixed → toggle drawer (tablet) → bottom sheet (mobile).
- **PLP grid:** 4-up → 3-up → 2-up, gutters step down from 16px to 12px to 8px.
- **Nav:** full center cluster → hamburger drawer at 768px.
- **Hero:** 56px headline → 40px (tablet) → 32px (mobile), image crop shifts from 21:9 to 4:5 on mobile to keep the subject centered.
- **Section spacing:** `{spacing.section}` 64px desktop → 48px tablet → 40px mobile.

## Iteration Guide

1. Treat this as a living draft - verify each token against real product photography before locking anything in; warm neutrals like `{colors.soft-sand}` can shift depending on your actual photo backgrounds.
2. Reference tokens directly in prompts and specs (`{colors.brand}`, `{component.button-primary}`, `{rounded.md}`) rather than describing colors/shapes in prose, so downstream AI-assisted implementation stays consistent.
3. If you swap the brand accent hue, re-check contrast on `{component.button-primary}` text (`{colors.on-brand}` on `{colors.brand}`) and on sale-price text against `{colors.canvas}`.
4. Add new component states (`-active`, `-disabled`, `-focused`) as their own entries rather than folding them into prose - keeps this file usable as a direct implementation reference.
5. Default body to `{typography.body-md}`; reserve `{typography.display}` strictly for the homepage hero and major campaign banners.
6. Before adding a new component, check whether it can be built from the existing card + pill + soft-shadow vocabulary - the system stays maintainable by resisting one-off components.

## Suggestions

A few things worth deciding on as you iterate, since I made judgment calls that are easy to change:

- **Brand accent color:** I used a warm terracotta (`#c9622a`) as a placeholder since Fabrilife itself doesn't lean on one signature accent hue - swap this for your actual brand color and I'll re-derive the deep/hover variants and re-check contrast.
- **Swatch shape:** I kept circular swatch dots (matches the reference system) - some apparel stores use small rounded squares instead since they read clothing colors more accurately (denim, heather gray, etc.) than a circle. Worth testing both.
- **Card hover behavior:** I specified an image cross-fade on hover (common in apparel commerce to show a second angle) - confirm whether you'll actually have multiple product photos per SKU at launch, since this needs a fallback if not.
- **Dark mode:** Not specified here since it wasn't in scope - if you want it, the neutral/brand token pairs are structured to make a dark variant straightforward to add later (swap canvas/soft-sand for dark equivalents, keep brand accent as-is).
- **Size guide / fit-finder component:** Apparel stores usually need a dedicated size-chart modal or fit quiz - not included yet since it depends on your product data model; flag if you want this specced out.
- Once you have real product photography, it's worth revisiting `{colors.soft-sand}` - if your photos are shot on pure white, a warm off-white card background can look muddy against them; may need to go closer to `#fafaf8` or even pure white with the warmth carried by typography/spacing instead.