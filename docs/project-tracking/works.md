Started at: 15/08/2026
Updated at: 23/10/2026
Ended at: N/A

Rules
1. Read /docs/project-tracking/backend-usage-guide.md (for context)
2. Don't install new packages, suggest if needed I will verify then add.
3. Follow code standards of this project and code quality should be readable, maintainable.
4. Use codebase-memory-mcp server to read files, look for modules, don't use traditional file reading which consumes tokens.
5. Maintain edge-cases, code quality, readability, and reusability.
6. Follow the top 5 rules strictly.


## Works 1, Line 14: 139 (Now)

1. Review module (admin side) — Add a review section for admin: view all reviews, view a single review, and flag a review with a reason. (The customer side is done — see Completed, items 1 and 14.)


## Personal Marks

### Completed

1. ✅ **Customer reviews** — Customers can create and view their own reviews on the product page.
2. ✅ **Activities skeleton** — Updated the loading skeleton for the activities section.
3. ✅ **Cancel button color** — Fixed the cancel button color on the customer order page.
4. ✅ **Admin orders page** — Major update: variant display, order summary, and payment initiation for online orders.
5. ✅ **Clear cart button** — Added a clear-cart button inside the cart sidebar.
6. ✅ **My-orders table** — The orders table now shows the orderId instead of the Mongoose _id.
7. ✅ **Product card and detail page** — Updated product cards for the products page and the product detail page. On the detail page, selecting a variant updates the price only while an offer is active; the gallery shows variant images when the SKU has them, otherwise it falls back to product images.
8. ✅ **Checkout page variants** — Variants now load properly on the checkout page.
9. ✅ **Track order payment summary** — Updated to show a detailed payment breakdown, including discounts.
10. ✅ **Logout button on public pages** — Fixed; the button now logs the user out instead of navigating to a broken /logout page.
11. ✅ **Product server communication error** — Fixed the "An error occurred in the Server Components render" error. Cause: a server-side rendering digest error triggered from the client side. Fixed the service function calls and replaced thrown errors with user-friendly error messages. (Resolved by a server update.)
12. 🚫 **Track order status border fill** — Dropped; no longer needed.
13. ✅ **Dashboard profile date of birth input** — Made the calendar picker more robust; custom typed input is now allowed for easier date-of-birth entry.
14. ✅ **Verified-purchase-only reviews** — Reviews can only be added after a verified purchase.
15. ✅ **Theme colors in limit settings** — Added Primary, Secondary, Background, and Foreground color options.
