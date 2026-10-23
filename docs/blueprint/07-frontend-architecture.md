# Frontend Architecture

## How Will the Frontend Be Organized?

## Folder Structure
- **Architecture:** Monorepo
- **Framework:** Next.js (latest, version 16), using the `app` folder system (no `src` folder)

Root-level folders:
- `app/` - routes (App Router)
- `components/` - reusable components
- `docs/` - documentation, including a `blueprint` folder containing the project's Markdown blueprint files, plus other documentation files
- `hooks/` - custom React hooks
- `lib/` - shared logic, config, and utilities
- `prisma/` - Prisma schema and related files
- `public/` - static assets
- `scripts/` - utility/build scripts, etc.

### Components Folder Structure
Inside `components/`:
- `auth/`
- `dashboard/`
- `home/`
- `layout/`
- `public/`
- `shared/`
  - `ui/` - shared UI components
- `unauthenticated/`
- `unauthorized/`

### Lib Folder Structure
Inside `lib/`:
- `authClient.ts`
- `auth.ts`
- `getSession.ts`
- `prisma.ts`
- `gameConfig.ts`
- `types.ts`
- `utils.ts`
- `data/` - data content
- `hooks/`
- `store/` - Zustand state management store

## Routing
- Standard/normal naming convention for routes
- Route groupings inside the `app` folder:
  - **`(auth)` group:** login, sign up, forgot password
  - **`(public)` group:** about, checkout, contact, docs pages
- `dashboard` - directly inside the `app` folder (not grouped)
- `unauthenticated` and `unauthorized` routes also present

## Components
- Using **ShadCN** as the component library
- Additional custom components, when needed, will be built and kept inside the `components/` folder

## State Management
- Using **Zustand** for state management
- Store defined inside `lib/store/`

## Data Fetching
- Using **Next.js API routes** with **Next.js server-side rendering** to communicate with **MongoDB** via **Prisma ORM**

## UI Rules
- UI should be responsive across all devices
- UI should be intuitive
- Color contrast should be great

---

## Suggestions (Not part of original input - for your consideration)
- **Folder structure clarification:** Consider clarifying whether `docs/blueprint` (containing these 11 Markdown files) is meant to be shipped with the repo for developer reference, or excluded from the deployed build.
- **`gameConfig.ts` naming:** This file name seems unusual for an e-commerce project (possibly a leftover name from a template/boilerplate) - worth double-checking if it should be renamed (e.g., `siteConfig.ts` or `appConfig.ts`).
- **Middleware:** Consider adding a `middleware.ts` at the root for route protection (redirecting unauthenticated/unauthorized users), tying into the `unauthenticated`/`unauthorized` routes mentioned.
- **API layer organization:** Since API routes also live inside `app/api/`, worth explicitly documenting that folder's structure here too (it overlaps with the API Specifications file).
- **Types organization:** A single `types.ts` may get large - consider splitting into `types/` folder (e.g., `types/product.ts`, `types/order.ts`) as the project grows.
- **Component naming/co-location convention:** Consider specifying whether components use PascalCase file naming, and whether component-specific styles/tests are co-located.
- **Accessibility (a11y):** Beyond color contrast, consider adding keyboard navigation support and ARIA labels as part of the UI rules, especially since ShadCN/Radix components support this well out of the box.
- **Loading/error states:** Consider specifying conventions for `loading.tsx` and `error.tsx` files (Next.js App Router feature) across route groups.
- **Image optimization:** Consider noting use of `next/image` for product images/thumbnails for performance.