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
1. Our goal is to first of all conver this generic design to a well established designed ecommerce store named "Nittonova" or https://nittonova.com/. We are trying to apply and learn the design completely and apply to our website including home pages, products pages, product single page, other public pages, dashboard pages, auth pages, and all other by the design theme, tone and accent.
    - To start first we'll pick colors, pick from their palatte. After full design completion we will set our custom color, but make sure all colors, shape radius, border colors, and all styling stuff is centrailzed to global.css so it's easy to update and tweak without hassel, use variables instead fixed value.
    - To start implementing the design, first grasp directly from their website and we will go step by step implementation.
        - First the Home Page, then Products Page, then single Product page, then other public pages, then Dashbaord all pages then auth pages.
        - For to work on page, don't build at once but step by step, section by section. For example in home page start with navigation or header then banner, then catalog, then featured products to till very end footer.
    - Follow rules strictly, ask for context if needed. And have accruacy about 95% or more, the design and functionality with animation, hover effects should be accruate and well working. Choose fonts, colors effectively. Make sure the design is responsive across all devices including mobile.
    - After completing this design transition we will implement new updates and fixes of functionalities, I will list them up later here as number points.
    - Progress (Nittonova transition):
        - ✅ Design tokens centralized in `app/globals.css` — full Nittonova palette (light + dark from their daisyUI theme), radius scale (btn 0.5rem / box 1rem / badge 1.9rem), brand accents (signature orange #f0512e, emerald #10b981, vivid pink, teal, success/warning/info). All colors/fonts/radii are CSS variables; components use tokens only. Note: the settings-driven ThemeProvider can still override these at runtime until the admin theme is aligned.
        - ✅ Typography — Jost (body, weight 500) + Oswald (display headings) loaded via next/font in `app/layout.tsx`, wired as `--font-sans` / `--font-display`.
        - ✅ Home Page → Header/navigation — Nittonova-style: utility top bar (original-products + delivery strip), main bar (logo, centered pill search submitting to /products?searchTerm=, account + cart actions with orange pill badge), uppercase Oswald nav row with animated underline hover, mobile panel with search. Verified: `tsc` clean, production `next build` passes, tokens present in compiled CSS.
        - ⬜ Home Page → Banner/hero
        - ⬜ Home Page → Features bar → categories → featured products → new arrivals → offer → brand story → testimonials → newsletter → footer
        - ⬜ Products Page → single Product page → other public pages → Dashboard pages → Auth pages
        - Reference assets: Nittonova compiled CSS/JS chunks cached in /tmp/nittonova/ for upcoming sections.

<!-- Later Works -->
<!-- 1. Review module (admin side) — Add a review section for admin: view all reviews, view a single review, and flag a review with a reason. (The customer side is done — see Completed, items 1 and 14.) -->


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
