# API Specifications

## How Will the Frontend and Backend Communicate with Each Other?

Communication between frontend and backend happens via **Next.js API routes** (REST-style), following CRUD operations for each core resource: Products, Orders, Customers/Users, and supporting resources (Categories, Audit Logs).

*(Note: API routes are not fully finalized yet - this is a first-pass structure to be iterated on. Endpoints already built in the project are marked as "Existing"; the rest are proposed based on the data models and are marked as "Proposed.")*

---

## Existing API Routes (Already Built)

### Auth
- `**/api/auth/[...all]**` - Handled via **Better Auth** (covers login, register, session, etc.)

### Dashboard
- `**/api/dashboard/categories**` - Category management (existing)
- `**/api/dashboard/products**` - Product management (existing)
- `**/api/dashboard/products/[id]**` - Single product management by ID (existing)

---

## Proposed API Routes

### Products - `/api/products`
| Method | Route | Description |
|---|---|---|
| GET | `/api/products` | Get all products (supports filters: category, search, status, featured) |
| GET | `/api/products/[id]` | Get a single product by ID |
| POST | `/api/products` | Create a new product (Admin/Manager) |
| PUT | `/api/products/[id]` | Update an existing product (Admin/Manager) |
| DELETE | `/api/products/[id]` | Soft-delete a product (sets `isDeleted`) |

### Categories - `/api/categories`
| Method | Route | Description |
|---|---|---|
| GET | `/api/categories` | Get all categories (supports nested/parent-child structure) |
| GET | `/api/categories/[id]` | Get a single category by ID |
| POST | `/api/categories` | Create a new category (Admin/Manager) |
| PUT | `/api/categories/[id]` | Update a category (Admin/Manager) |
| DELETE | `/api/categories/[id]` | Soft-delete a category |

### Orders - `/api/orders`
| Method | Route | Description |
|---|---|---|
| GET | `/api/orders` | Get all orders (supports filters: status, paymentStatus, customer, date range) |
| GET | `/api/orders/[id]` | Get a single order by ID |
| POST | `/api/orders` | Create a new order (checkout) |
| PUT | `/api/orders/[id]` | Update order status/payment status (Admin/Manager) |
| DELETE | `/api/orders/[id]` | Cancel/remove an order |

### Customers - `/api/customers`
| Method | Route | Description |
|---|---|---|
| GET | `/api/customers` | Get all customers (Admin/Manager view) |
| GET | `/api/customers/[id]` | Get a single customer's details |
| POST | `/api/customers` | Register a new customer |
| PUT | `/api/customers/[id]` | Update customer details |
| DELETE | `/api/customers/[id]` | Ban/soft-delete a customer |

### Users (Admin/Staff/Manager accounts) - `/api/users`
| Method | Route | Description |
|---|---|---|
| GET | `/api/users` | Get all platform users (Admin, Manager, User roles) |
| GET | `/api/users/[id]` | Get a single user by ID |
| POST | `/api/users` | Create a new staff/manager user (Admin only) |
| PUT | `/api/users/[id]` | Update a user's details/role (Admin only) |
| DELETE | `/api/users/[id]` | Ban/remove a user (Admin only) |

### Audit Logs - `/api/audit-logs`
| Method | Route | Description |
|---|---|---|
| GET | `/api/audit-logs` | Get audit log entries (filterable by entityType, action, actor, date) |
| GET | `/api/audit-logs/[id]` | Get a single audit log entry |

*(Note: Audit logs are typically read-only via API - created internally by the system whenever a tracked action occurs, not created directly through a POST endpoint.)*

---

## Suggestions (Not part of original input - for your consideration)
- **Cart endpoints:** Since no Cart/CartItem model exists yet, endpoints like `/api/cart`, `/api/cart/items` will be needed once that model is added.
- **Payment endpoints:** For SSLCommerz integration, dedicated routes such as `/api/payment/initiate`, `/api/payment/callback` (success/fail/cancel webhooks), and `/api/payment/verify` will likely be needed.
- **Dashboard analytics endpoint:** A route like `/api/dashboard/stats` or `/api/dashboard/analytics` to power the seller's revenue/statistics view mentioned in the Project Overview.
- **Review endpoints:** `/api/products/[id]/reviews` for customers to post/view product reviews (ties to `averageRating` on the Product model).
- **Role-based access control:** Worth explicitly documenting which roles (Admin, Manager, User/Customer) can access which endpoints - partially noted above but should be formalized (e.g., via middleware).
- **Pagination & filtering conventions:** Consider standardizing query params across list endpoints (e.g., `?page=1&limit=20&sort=createdAt`) for consistency.
- **Response format standard:** Consider defining a consistent JSON response shape (e.g., `{ success, data, error, meta }`) across all endpoints for easier frontend consumption.
- **Versioning:** Consider whether routes should be prefixed with a version, e.g., `/api/v1/products`, in case of future breaking changes.