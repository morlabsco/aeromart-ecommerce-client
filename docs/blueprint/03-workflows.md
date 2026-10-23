# Workflows

## How Does a User Move Through the System?

## Customer Workflow
1. Customer opens the seller's (client's) website
2. Browses products from the products page
3. Views a product he wants
4. Adds the product to the cart
5. Modifies quantity, selects color, selects size
6. Proceeds to checkout
7. At checkout, customer chooses a payment option:
   - **Cash on Delivery (COD):** Customer does not pay online; pays upon receiving the delivery
   - **Online Payment:** Customer visits the payment page and pays online
8. Order is confirmed

## Admin Workflow
1. Admin logs in from the admin login panel
2. Admin is redirected to the admin dashboard
3. From the dashboard, admin can:
   - Manage inventory
   - Manage products
   - Manage orders
   - Manage customers (view all customers)
   - Manage staff (e.g., add managers, assign staff roles)
4. Settings page for admin (planned, not finalized):
   - Update website data (e.g., colors) directly from the dashboard - *not confirmed yet, may be added later*

*(Note: Customer also has their own dashboard to view orders, etc. Two workflows shared so far - more workflows to be added later.)*

---

## Suggestions (Not part of original input - for your consideration)
- **Customer registration/login workflow:** Step-by-step flow for sign-up, email/phone verification, and login (including forgot password flow).
- **Customer dashboard workflow:** Since you mentioned the customer has their own dashboard, a dedicated workflow for it - viewing order history, tracking order status, managing profile/addresses, cancelling/returning an order.
- **Order fulfillment workflow (Admin/Seller side):** From order received → order processing → packed → shipped → delivered, including status updates visible to the customer.
- **Payment workflow (detailed):** Specifically for the online payment path via SSLCommerz - payment initiation, success callback, failure/retry handling, refund flow.
- **Product review/rating workflow:** Customer leaving a review after receiving an order.
- **Staff/manager workflow:** Since admin can add staff/managers, a workflow describing what a staff member can access vs. full admin access (role-based permissions).
- **Cart abandonment / guest checkout workflow:** Whether guest checkout (without registration) is allowed, and what happens to an abandoned cart.
- **Notification workflow:** Email/SMS notifications triggered at key steps (order placed, payment confirmed, order shipped, order delivered).