# Backend Architecture

## How Will Backend Logic Be Organized and Managed?

## Architecture Overview
- **Architecture:** Monorepo (backend lives inside the same Next.js repository as the frontend)
- **Backend Runtime:** Next.js API routes, using Next.js server-side rendering (SSR) features
- **Database:** MongoDB
- **ORM:** Prisma
- Backend-related files (API routes, Prisma schema, auth logic, utilities) live directly within the Next.js repository - there is no separate backend server/repo.

## API Layer
- All backend logic is exposed through **Next.js API routes** (inside `app/api/`)
- Each resource (Products, Orders, Customers, Users, Categories, Audit Logs) has its own route handlers, following the structure defined in the API Specifications file
- Route handlers are responsible for:
  - Validating incoming requests
  - Calling the appropriate business logic/database operations
  - Returning consistent JSON responses

## Database Layer
- **MongoDB** is the primary database
- **Prisma ORM** is used as the data access layer, defined in the `prisma/` folder (schema, models, enums)
- All database queries (CRUD operations) go through Prisma Client rather than raw MongoDB queries, for type safety and consistency

## Authentication & Authorization
- Authentication is handled via **Better Auth**, exposed through `/api/auth/[...all]`
- Related auth utilities live in `lib/` (`auth.ts`, `authClient.ts`, `getSession.ts`)
- **Role-based access control** is enforced using the `Role` enum (Admin, Manager, User) defined in the data model
- Protected routes/actions (e.g., product creation, order management, staff management) should validate the user's session and role before proceeding

## Business Logic Organization
- Core backend logic (data validation, calculations, permission checks) is organized within `lib/` alongside auth and utility files
- Shared logic (e.g., formatting, validation helpers) lives in `lib/utils.ts`
- Data-layer helpers/config live in `lib/data/`

## Audit Logging
- System actions (create, update, delete, restore, status change, login, permission change) are tracked via the **Audit Log** model
- Audit log entries are created internally by the backend whenever a tracked action occurs (not created directly by external API calls)

## Error Handling
*(Not explicitly defined by the user yet - included here as a placeholder structure based on standard practice, to be confirmed/adjusted.)*
- API routes should return consistent error responses with appropriate HTTP status codes
- Errors should be logged server-side for debugging

---

## Suggestions (Not part of original input - for your consideration)
- **Service/Repository layer:** Consider introducing a thin service layer (e.g., `lib/services/product.service.ts`) between API route handlers and Prisma Client, so business logic isn't written directly inside route files - this improves testability and reuse.
- **Input validation library:** Consider using a schema validation library (e.g., Zod) to validate request bodies/query params consistently across all API routes.
- **Centralized error handling:** Consider a shared error-handling utility/middleware to standardize error response shape across all API routes (ties into the "Response format standard" suggestion from the API Specifications file).
- **Rate limiting:** Consider rate limiting on sensitive routes (auth, checkout, payment) to prevent abuse.
- **Environment configuration:** Consider documenting how environment variables (MongoDB URI, SSLCommerz keys, auth secrets) are managed (e.g., `.env`, `.env.local`) and kept out of version control.
- **Background jobs/webhooks:** Since SSLCommerz will send payment callbacks, consider how webhook endpoints are secured (signature verification) and whether any background job handling (e.g., order status updates) is needed.
- **Logging & monitoring:** Beyond audit logs (business-level tracking), consider technical logging/monitoring (e.g., error tracking service) for production debugging.
- **Testing strategy:** No mention of backend testing yet - consider noting whether unit/integration tests (e.g., for API routes or Prisma queries) will be part of the workflow.