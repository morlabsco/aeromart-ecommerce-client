Started at: 31/07/2026
Updated at: 04/08/2026
Ended at: N/A

Rules
1. Read /docs/backend-usage-guide.md
2. Don't install new packages, suggest if needed I will verify then add.
3. Follow code standards of this project and code quality should be readable, maintainable.
4. Use codebase-memory-mcp server to read files, look for modules, don't use traditional file reading which consumes tokens.
5. Follow the top 4 rules strictly.

## Works 1, Line 5: 95 (Completed ✅)
## Implement the Dashboard routes first

#### Routes (Admin)
1. Overview -> /overview Overall Dashboard overview use meta module here, orders module getAllOrders
2. Products -> /products -> /products/all-products, /products/create-product
3. Orders -> /orders -> /orders/all-orders, /orders/create-order
4. Users -> /users -> /users/all-users, /users/create-user
5. Category -> /categories -> /categories/all-categories, /create-category
5. Brand -> /brands -> /brands/all-brands, /create-brand
5. Coupon -> /coupons -> /coupons/all-coupons, /create-coupon
5. Activity -> /activities (Site updating activity later will be implement, for now create pages, components)

#### Routes (Customer)
1. Overview -> /overview Overall Dashboard overview, Total Orders etc.
2. Orders -> /orders -> /orders/my-orders (Not implemented in backend, I will later worn in here)

Then connect corresponding module to each route.

Dashboard routes should be using SSR + CSR Combination. Must use Caching + Skeleton When data fetching it should should show necessary skeleton (Table) or Boxes where necessary.

#### Backend System

### For API Calling we would be using Mostly Services functions under /lib/services, It should modular architecture. Modules (Product, Order, Users, Brand, Category, Coupon, Review, User, Payment, Auth, Meta)

### Service functions will be calling our backend directly using NEXT_PUBLIC_BASE_API=https://localhost:5000/api/v1

#### Code format

```
/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { getValidToken } from "@/lib/verifyToken";

export const updateStudentProfile = async (tutorData: FormData) => {
    const token = await getValidToken();

    try {
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_BASE_API}/users/student/update-profile`,
            {
                method: "PATCH",
                headers: {
                    Authorization: token,
                },
                body: tutorData,
                next: {
                    tags: ["USER"],
                },
            }
        );

        const result = await res.json();

        return result;
    } catch (error: any) {
        return Error(error);
    }
};
```

#### NEXT JS Api Routes we will implement and work on where needed, but mostly focused on Services Functions (SSR) -> Directly calling our Custom Backend (Express, Mongoose, Mongodb)

#### Implementing Order (Must Follow)
Then I will test and verify
After each module completion and connected with frontend, Tell me, then I will test and approve for next implementation, otherwise we will fix first.

1. Auth + User Module (Completed ✅)

2. Brand Module (Completed ✅)

3. Category Module (Completed ✅)

3. Coupon Module (Completed ✅)

4. Product Module (Completed ✅)

5. Order Module (Completed ✅)

6. Review Module (Completed ✅)

7. Meta Module (Completed ✅)

7. Payment Module (Completed ✅)


## Works 2, Line 98: 139 (Completed ✅)

### User Management (Now)
The slider having the profile section the dropdown will have account (redirects to /dashboard/admin/profile) page and logout button.

Logout button will first take user to homepage then logout otherwise it takes to login page (bad).

The profile page will be having profile updating (image, password changing section - user must input old and new password and it should match.)

#### Settings page
First removal all features

Then we will be having
1. Theme: Full website details including, Brand Name, Logo, Image, Description and all similar to /lib/theme.config.ts, mainly we will convert to dynamically managing, though backend is not being implemented but your job is to go to /aeromart-ecommerce-server and create a dynamic module named Settings or Designs or Sections where we will be storing these informations such as theme, banner, sections with images, descriptions. 
Note: Categories, Featured Products, New Arrivals are dynamically rendered from fixed api call with filter.
So here your job build the needed modules for this in server and maintain code writing style.

#### Home Pages 

2. Website Sections Controlling Dynamically
1. Navbar
2. Hero Section
4. Offer
5. Testimonials
6. OurStory
7. Footer

Leftover: New arrivals renedered from our products by filtering, same as featured products, shop by categories

3. Connect Home Pages with Backend

1. Home Page Sections: Categories, Featured Products, New Arrivals connect with service functions dynamic rendering.

2. Products Page Renders from Service functions

3. Product Details Page Also

4. Cart is locally maintained and when ready it will try to create an order and clear the cart.
Then in checkout page there will be 4 options for payment (COD, Stripe, SSLCommerz, bKash). 
After selecting each corresponding option it will initiate.
Current COD will initate order and redirect user to home page after with successful toaster notifcation.
Other Stripe and SSLCommerz currently available but bKash (will be adding in feature just keep the button). Update the checkout page also. So stripe and SSLCommerz will redirect to the payment page after successful payment it will redirect to /success or /failed page, and also prepare and design the page beautifully.
