# UI Design References — Nittonova

Screenshots of https://nittonova.com used as the design source for AeroMart's UI.
Build each section from its **cropped** reference — full-page shots are for context only (too tall, details get lost).

**Status tags** — replace `⬜ TODO` with `✅ DONE` when a section is applied to our UI (add a note/date if useful, e.g. `✅ DONE — 2026-10-24`). AI tools: any row not marked `✅ DONE` is still to be built.

## Header

| File | Section | Status |
|---|---|---|
| `nittonova-home-page-large-device-only-header.png` | Desktop header: top bar, logo, search, nav (home `app/(public)/layout.tsx`) | ✅ DONE |
| `nittonova-home-page-mobile-device-only-header.png` | Mobile header (collapsed) | ✅ DONE |
| `nittonova-header-mobile-nav-open.png` | Mobile header with slide-out nav menu open | ✅ DONE |

## Home page (`app/(public)/page.tsx`)

| File | Section | Status |
|---|---|---|
| `nittonova-home-page-large-device-hero-section.png` | Hero banner + slider | ✅ DONE |
| `nittonova-home-page-large-device-categories.png` | Category strip/grid | ✅ DONE |
| `nittonova-home-page-large-device-featured-products.png` | Featured product cards section | ✅ DONE |
| `nittonova-home-page-large-device-footer-features.png` | Feature badges bar above footer (delivery/warranty icons) | ✅ DONE |
| `nittonova-home-page-large-device-footer.png` | Footer: links, contact, payment icons | ✅ DONE |
| `nittonova-home-page-large-device.png` | Full desktop home page — context only | ✅ DONE |
| `nittonova-home-page-mobile-device.png` | Full mobile home page — context only | ✅ DONE |

## Products listing (`app/(public)/products/`)

| File | Section | Status |
|---|---|---|
| `nittonova-products-page-large-device.png` | Products grid, populated state | ✅ DONE — 2026-10-25 |
| `nittonova-products-page-large-device-empty.png` | Products page, empty state | ✅ DONE — 2026-10-25 |
| `nittonova-products-large-device-filter-section.png` | Filter sidebar/panel (category, price, attributes) | ✅ DONE — 2026-10-25 |
| `nittonova-products-large-device-category.png` | Category landing view (`products-category/{slug}`) | ✅ DONE — 2026-10-25 |

## Product details (`app/(public)/products/[slug]/`)

| File | Section | Status |
|---|---|---|
| `nittonova-product-details-large-device.png` | Full details page: gallery, price/offer, buy box, description HTML, reviews | ✅ DONE — 2026-10-25 |

## Cart & checkout

| File | Section | Status |
|---|---|---|
| `nittonova-cart-section-large-device-empty.png` | Cart page/drawer, empty state | ✅ DONE — 2026-10-25 |
| `nittonova-cart-section-large-device-with-items.png` | Cart with items: rows, qty steppers, totals | ✅ DONE — 2026-10-25 |
| `nittonova-checkout-page-large-device.png` | Checkout: address form, order summary, payment | ✅ DONE — 2026-10-25 |

## Account (`app/(public)/dashboard/`)

| File | Section | Status |
|---|---|---|
| `nittonova-dashboard-page-large-device-overview.png` | Customer dashboard overview | ⬜ TODO |
| `nittonova-dashboard-page-large-device-profile.png.png` | Customer dashboard profile page (note: file has a doubled `.png` extension) | ⬜ TODO |

## Auth & policy

| File | Section | Status |
|---|---|---|
| `nittonova-auth-page-large-device.png` | Login/register page (`app/(public)/login/`) | ✅ DONE |
| `nittonova-refund-policy-large-device.png` | Return/refund policy page (`app/(public)/return-refund-policy/`) | ✅ DONE |
