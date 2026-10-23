# Requirements Analysis

## What Should the System Do?

## Functional Requirements
- Customer can register
- Customer can login
- Customer can browse products
- Customer can add products to cart
- Customer can check out
- Admin can create products
- Admin can update products
- Admin can manage orders

*(Note: More functional requirements to be added later.)*

## Non-Functional Requirements
- The website should be responsive
- The website should be secure
- The website should be fast
- The website should be maintainable

---

## Suggestions (Not part of original input - for your consideration)
- **Customer-side functional requirements:** Consider adding - search/filter products, view order history, manage profile/addresses, wishlist, product reviews/ratings, cancel/return order.
- **Admin-side functional requirements:** Consider adding - manage users, manage categories, view revenue/analytics dashboard, manage discounts/coupons, manage inventory/stock levels.
- **Payment & Notifications:** Since SSLCommerz is your gateway, you may want a functional requirement around payment success/failure handling, and order confirmation notifications (email/SMS).
- **Non-functional additions:** Consider specifying measurable targets, e.g. page load time (e.g., under 2-3 seconds), uptime/availability target (e.g., 99.9%), scalability (expected concurrent users), and data backup/recovery expectations.
- **Security specifics:** Consider detailing what "secure" means - e.g., authentication method (JWT/session), password hashing, HTTPS, protection against common attacks (XSS, CSRF, SQL/NoSQL injection).
- **Roles clarification:** You mentioned Admin - consider clarifying if "Admin" here refers to the Seller (client) role from the Project Overview, or a separate platform-level admin role, since this may affect the ER diagram and API design later.