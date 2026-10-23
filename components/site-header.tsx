"use client";

import { usePathname } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

const routeTitles: Record<string, string> = {
    "/dashboard/admin": "Overview",
    "/dashboard/admin/orders": "Orders",
    "/dashboard/admin/orders/all-orders": "All Orders",
    "/dashboard/admin/orders/create-order": "Create Order",
    "/dashboard/admin/orders/update-order": "Update Order",
    "/dashboard/admin/orders/[id]": "Order Details",
    "/dashboard/admin/products": "Products",
    "/dashboard/admin/products/all-products": "All Products",
    "/dashboard/admin/products/create-product": "Create Product",
    "/dashboard/admin/products/update-product": "Update Product",
    "/dashboard/admin/products/[id]": "Product Details",
    "/dashboard/admin/users": "Users",
    "/dashboard/admin/users/all-users": "All Users",
    "/dashboard/admin/users/create-user": "Create User",
    "/dashboard/admin/users/update-user": "Update User",
    "/dashboard/admin/users/[id]": "User Details",
    "/dashboard/admin/categories": "Categories",
    "/dashboard/admin/categories/all-categories": "All Categories",
    "/dashboard/admin/categories/create-category": "Create Category",
    "/dashboard/admin/categories/update-category": "Update Category",
    "/dashboard/admin/categories/[id]": "Category Details",
    "/dashboard/admin/brands": "Brands",
    "/dashboard/admin/brands/all-brands": "All Brands",
    "/dashboard/admin/brands/create-brand": "Create Brand",
    "/dashboard/admin/brands/update-brand": "Update Brand",
    "/dashboard/admin/brands/[id]": "Brand Details",
    "/dashboard/admin/coupons": "Coupons",
    "/dashboard/admin/coupons/all-coupons": "All Coupons",
    "/dashboard/admin/coupons/create-coupon": "Create Coupon",
    "/dashboard/admin/coupons/update-coupon": "Update Coupon",
    "/dashboard/admin/coupons/[id]": "Coupon Details",
    "/dashboard/admin/activities": "Activities",
    "/dashboard/admin/settings": "Settings",
    "/dashboard/admin/profile": "Profile",
    "/dashboard/customer": "My Account",
    "/dashboard/customer/orders": "My Orders",
    "/dashboard/customer/orders/my-orders": "My Orders",
    "/dashboard/customer/orders/[id]": "Order Details",
    "/dashboard/customer/profile": "Profile",
};

export function SiteHeader() {
    const pathname = usePathname();
    const title =
        routeTitles[pathname] ??
        (Object.entries(routeTitles).find(([route]) =>
            pathname.startsWith(`${route}/`)
        )?.[1] ??
            "Dashboard");

    return (
        <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
            <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
                <SidebarTrigger className="-ml-1 cursor-pointer" />
                <Separator
                    orientation="vertical"
                    className="mx-2 h-4 data-vertical:self-auto"
                />
                <h1 className="text-base font-medium">{title}</h1>
            </div>
        </header>
    );
}
