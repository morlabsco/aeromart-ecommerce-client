# Nittonova Product Data — Guide for LLM Tools

Source data scraped from https://nittonova.com on 2026-10-24 (Laravel Inertia `data-page` JSON, not HTML parsing). Use these files as read-only input for DB seeding/injection scripts and image downloads.

## Files

| File | Content |
|---|---|
| `docs/data/products.json` | JSON array, 37 product objects, 47 fields each, sorted by `id` |
| `docs/data/categories.json` | JSON array, 10 category objects (separate schema — see below) |

## Joining products ↔ categories — IMPORTANT

The two files use **different ID systems**. `product.category_id` is Nittonova's integer id (6, 10–18); `categories.json` ids are strings (`"cat_001"`…`"cat_010"`). They do **not** join on id.

- **Join key: `slug`** — `product.category.slug` ↔ `category.slug` (10/10 exact match).
- Do not join on `name`: source names have typos and inconsistencies (`"Kithcen Accessories"`, `"Rechargeable  Fan"` with double space vs `"Rechargeable Fan"` in categories.json).
- Each product also carries the full nested `category` object (Nittonova id, name, slug, image, icon, children).

## products.json — field reference

**Identity:** `id` (int, Nittonova PK), `name`, `slug` (unique key), `product_code` (e.g. `"SM202A"`), `category_id` (int, see join note), `brand_id` (all `null`), `brand` (all `null`), `product_tags` (string array)

**Content:** `short_description`, `description` (full **HTML** — keep as HTML or sanitize, not plain text), `specification` (array — empty `[]` for all 37 on source site), `feature_image` (URL), `gallery_images` (URL array, 138 total), `description_images` (all `null`), `youtube_video` / `upload_video` (all `null`)

**Pricing — strings, not numbers:** `price` (`"980.00"`), `previous_price` (`"1500.00"`), `unit_cost` (`"640.00"`, wholesale cost — internal source field, consider dropping or repurposing). Cast with `Decimal`/`float` on insert.

**Inventory/flags:** `stock` (int), `sold_stock` (int), `fake_sold_count` (int — inflated display counter, source field), `manual_stock_status` (bool), `type` (all `"simple"`), `status` (all `"Published"`), `is_daily_product` (int 0/1), `is_free_delivery` (bool), `is_pre_order` (bool), `view_count` (int), `order` (int), `remarks` (all `null`), `variations` (all `[]`), `campaigns` (all `[]`)

**SEO/meta:** `meta_title`, `meta_description`

**Timestamps:** `created_at`, `updated_at` (ISO 8601 UTC strings), `deleted_at` (all `null`)

**Ratings:** `avg_rating` (int), `reviews_count` (int), `reviews_avg_rating` (null when no reviews)

**Reviews (added from product detail pages):**
- `reviews`: array of `{ id, rating, comment, images: [url], created_at, time_ago, user: { name, initials } }`
  - `created_at` is a Carbon dump object — use `created_at.formatted` (`"2026-09-24 19:01:00"`, Asia/Dhaka) or `created_at.timestamp` (unix int) for inserts.
  - `user` has **display name only** — no id/email exists in the source. Create/attach reviewer users by name or map to a generic seed user.
  - 37 reviews across 8 products (product ids 9, 10, 23, 33, 35, 37, 38, 39). Verified complete: per-product count matches `review_stats.total_reviews`.
- `review_stats`: `{ total_reviews, average_rating, rating_distribution: {"5": n, "4": n, ...} }`

**Relations:** `related_product_slugs` (slug array — related products all exist as top-level records in the same file; re-link by slug or id after insert)

**Duplication quirk:** `feature_image_url` duplicates `feature_image`.

## Images — 183 URLs total, all absolute

| Field | Count | URL prefix |
|---|---|---|
| `feature_image` | 37 | `https://nittonova.com/storage/products/` |
| `gallery_images` | 138 | `https://nittonova.com/storage/products/gallery/` |
| review `images` | 8 | `https://nittonova.com/storage/reviews/` |

Categories add 10 more under `/storage/categories/`. All are publicly fetchable (no auth); be polite — throttle when bulk-downloading.

## Quick recipes

Count / filter / join:

```bash
jq 'length' docs/data/products.json                       # 37
jq '[.[] | select(.category.slug == "massager")] | length' docs/data/products.json
jq '.[] | {slug, price, stock}' docs/data/products.json
```

Category map for injection (slug → target id):

```python
import json
cat_by_slug = {c["slug"]: c["id"] for c in json.load(open("docs/data/categories.json"))}
for p in json.load(open("docs/data/products.json")):
    target_category = cat_by_slug[p["category"]["slug"]]
```
