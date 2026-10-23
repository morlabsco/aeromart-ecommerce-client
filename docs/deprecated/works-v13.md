Started at: 06/08/2026
Updated at: 08/08/2026
Ended at: N/A

Rules
1. Read /docs/v7-backend-usage-guide.md
2. Don't install new packages, suggest if needed I will verify then add.
3. Follow code standards of this project and code quality should be readable, maintainable.
4. Use codebase-memory-mcp server to read files, look for modules, don't use traditional file reading which consumes tokens.
5. Maintain edge-cases, code quality, readability, and reusability.
6. Follow the top 5 rules strictly.


## Works 1, Line 14: 139 (Completed)
1. Auth Layer (Fixed)
#### Login and Register Pages 
- When logged in toaster provides red alert meaning an issue, but not traced.
- Then doesn't auto redirects user to its dashboard.
- Same as the Register Page

2. Dashboard Admin and Customer All feature cross check, edge cases (Now)
#### Dashboard (Completed)
Admin
- Overview
- Products (All routes)
- Orders (All routes)
- Users (All routes)
- Categories (All routes)
- Brands (All routes)
- Coupons (All routes)
- Activities (Will be implemented later)
- Settings (Connect the setting module features)
    - Remove current features implemented and implement fresh so no conflict creating
    - Load the whole document and show in section wise beautiful
    - Admin should be able to manage all types of features mentioned
    - when creating module maintain the code writing style, folder structure

Customers
- Cross check routes
- Render my orders
    - User should be able manage order in table and as single order page with managing features (canceling or future download invoice option)
- The profile manage for customers not implemented, implement it.
Make sure user input fields are zod validates so important details are filled correctly and images, numbers etc.
- Remove create order feature from customer.



## Works 2, Line 48: 139 (Now)

1. Handle big size image input error (Done)
2. Error page make for dashboard page & home page, total 2 types (Done)
3. Invoice download button for admin & customer, invoice download button with tran id feature  on success page (Done)
4. track order page (Done)
5. Add payment provider logos (Done)
6. Update navbar with dynamic data rendering (Done)
7. Footer dynamic data render (Done)
8. Products (public) page category load fix, search bar lag fix. (Done)
9. Cart update, render dynamically, persistant storage (Done)
10. Checkout page update, fields, delivery charge option (Done)
11. contact page improve (Done)
12. about page ui improve (Done)
13. /products routes mobile screen filter fix, image should not no image, instead beautiful section title or good way (Done)

14. Review module make both admin and customer, and add option for customer only to make review on the product page by validating if the use has bought the product or not. 

15. Add clear cart button inside cart sidebar
16. Cancel button order page customer button color fix.
17. Activities skeleton needs update
18. User my-orders page table needs update
19. invoice download not working fix that.

New issues
20. Product is not creating on dashboard fix that.

 Now we need review section in both admin, customer,
Admin - can view all reviews, single review, flagg a review with reason.
Customer can create and view his reviews
