import type { Metadata } from "next";
import { getSettings } from "@/lib/services/settings";
import { unwrapData } from "@/lib/services/api-client";
import type { Settings } from "@/lib/types/backend";

const DASHBOARD_TITLES: Record<string, string> = {
    "/dashboard/admin": "Admin Overview",
    "/dashboard/admin/orders": "Orders",
    "/dashboard/admin/orders/all-orders": "All Orders",
    "/dashboard/admin/orders/create-order": "Create Order",
    "/dashboard/admin/orders/update-order/[id]": "Update Order",
    "/dashboard/admin/orders/[id]": "Order Details",
    "/dashboard/admin/products": "Products",
    "/dashboard/admin/products/all-products": "All Products",
    "/dashboard/admin/products/offered-products": "Offered Products",
    "/dashboard/admin/products/create-product": "Create Product",
    "/dashboard/admin/products/update-product/[id]": "Update Product",
    "/dashboard/admin/products/[id]": "Product Details",
    "/dashboard/admin/users": "Users",
    "/dashboard/admin/users/all-users": "All Users",
    "/dashboard/admin/users/create-user": "Create User",
    "/dashboard/admin/users/update-user/[id]": "Update User",
    "/dashboard/admin/users/[id]": "User Details",
    "/dashboard/admin/categories": "Categories",
    "/dashboard/admin/categories/all-categories": "All Categories",
    "/dashboard/admin/categories/create-category": "Create Category",
    "/dashboard/admin/categories/update-category/[id]": "Update Category",
    "/dashboard/admin/categories/[id]": "Category Details",
    "/dashboard/admin/brands": "Brands",
    "/dashboard/admin/brands/all-brands": "All Brands",
    "/dashboard/admin/brands/create-brand": "Create Brand",
    "/dashboard/admin/brands/update-brand/[id]": "Update Brand",
    "/dashboard/admin/brands/[id]": "Brand Details",
    "/dashboard/admin/coupons": "Coupons",
    "/dashboard/admin/coupons/all-coupons": "All Coupons",
    "/dashboard/admin/coupons/create-coupon": "Create Coupon",
    "/dashboard/admin/coupons/update-coupon/[id]": "Update Coupon",
    "/dashboard/admin/coupons/[id]": "Coupon Details",
    "/dashboard/admin/activities": "Activities",
    "/dashboard/admin/reviews": "Reviews",
    "/dashboard/admin/reviews/[id]": "Review Details",
    "/dashboard/admin/settings": "Settings",
    "/dashboard/admin/profile": "Profile",
    "/dashboard/customer": "My Account",
    "/dashboard/customer/orders": "My Orders",
    "/dashboard/customer/orders/my-orders": "My Orders",
    "/dashboard/customer/orders/[id]": "Order Details",
    "/dashboard/customer/reviews": "My Reviews",
    "/dashboard/customer/profile": "Profile",
};

/** Cache the resolved brand name across the request (per RSC render). */
let cachedBrand: string | null | undefined;

async function getBrandName(): Promise<string | null> {
    if (cachedBrand !== undefined) return cachedBrand;
    try {
        const result = await getSettings();
        cachedBrand = unwrapData(result)?.brand?.name ?? null;
    } catch {
        cachedBrand = null;
    }
    return cachedBrand;
}

/**
 * Returns metadata for a dashboard page given its route key (folder path).
 * Appends the brand name ("Page Title - Brand") when settings are available.
 * Falls back to a generic title when the key is unknown.
 */
export async function dashboardMetadata(
    routeKey: string,
    extra?: Metadata
): Promise<Metadata> {
    const base = DASHBOARD_TITLES[routeKey] ?? "Dashboard";
    const brand = await getBrandName();

    return {
        // absolute — dashboard titles never compose through the storefront
        // SEO titleTemplate.
        title: { absolute: brand ? `${base} - ${brand}` : base },
        robots: { index: false, follow: false },
        ...extra,
    };
}

const SETTINGS_SECTION_TITLES: Record<string, string> = {
    settings: "Settings",
    brand: "Brand",
    theme: "Theme",
    hero: "Hero",
    testimonials: "Testimonials",
    navbar: "Navbar",
    footer: "Footer",
    contact: "Contact",
    about: "About",
    "limited-offer": "Limited Offer",
    seo: "SEO",
};

/* ------------------------------------------------------------------ */
/* Storefront SEO (Settings → SEO section)                             */
/* ------------------------------------------------------------------ */

/**
 * Resolves the social share image with the auto fallback chain:
 * admin-uploaded SEO image → first hero slide that has artwork → brand logo.
 */
export function resolveSeoImage(
    settings: Settings | null | undefined,
): string | undefined {
    return (
        settings?.seo?.ogImage ||
        settings?.hero?.slides?.find((slide) => slide.image)?.image ||
        settings?.brand?.logo ||
        undefined
    );
}

/**
 * Builds the storefront Metadata from the Settings → SEO section with
 * graceful fallbacks (title → brand name, description → brand description,
 * image → hero slide → logo). Used by the root layout (home defaults) and
 * every public page via `storefrontMetadata({ title: "About Us" })` —
 * sub-page titles compose through the admin's titleTemplate ("%s | Brand").
 */
export function buildSeoMetadata(
    settings: Settings | null | undefined,
    overrides?: { title?: string; description?: string },
): Metadata {
    const brandName = settings?.brand?.name || "Attor";
    const seo = settings?.seo;

    // Home title is the plain brand name unless the admin set one; the
    // template only applies to sub-pages and must contain %s to be valid.
    const homeTitle = seo?.title?.trim() || brandName;
    const rawTemplate = seo?.titleTemplate?.trim() || "";
    const template = rawTemplate.includes("%s") ? rawTemplate : "%s";

    const description =
        overrides?.description?.trim() ||
        seo?.description?.trim() ||
        settings?.brand?.description ||
        "Discover curated products crafted for the modern individual.";

    const keywords = seo?.keywords
        ?.split(",")
        .map((k) => k.trim())
        .filter(Boolean);

    const image = resolveSeoImage(settings);
    const pageTitle = overrides?.title?.trim() || homeTitle;
    // A sub-page title composes through the template; the home/default
    // title stays exactly what the admin set (no suffixes added).
    const composedTitle = template.replace("%s", pageTitle);

    return {
        title: overrides?.title
            ? { absolute: composedTitle }
            : { default: homeTitle, template },
        description,
        ...(keywords?.length ? { keywords } : {}),
        openGraph: {
            title: overrides?.title ? composedTitle : homeTitle,
            description,
            ...(image ? { images: [image] } : {}),
            type: "website",
        },
        twitter: {
            card: image ? "summary_large_image" : "summary",
            title: overrides?.title ? composedTitle : homeTitle,
            description,
            ...(image ? { images: [image] } : {}),
        },
        ...(seo?.noindex ? { robots: { index: false, follow: false } } : {}),
    };
}

/**
 * Storefront page metadata — loads the settings singleton and applies the
 * SEO section. Pass a page title to brand it through the template
 * (e.g. storefrontMetadata({ title: "About Us" }) → "About Us | AeroMart").
 */
export async function storefrontMetadata(overrides?: {
    title?: string;
    description?: string;
}): Promise<Metadata> {
    let settings: Settings | null | undefined;
    try {
        settings = unwrapData(await getSettings());
    } catch {
        settings = null;
    }
    return buildSeoMetadata(settings, overrides);
}

/**
 * Returns metadata for a route-based Settings section page. Titles follow the
 * convention "Section Settings - Brand Name" (e.g. "Hero Settings - Attor"),
 * where the brand name comes from the settings singleton itself.
 */
export async function settingsSectionMetadata(
    section: string,
    extra?: Metadata
): Promise<Metadata> {
    const sectionName = SETTINGS_SECTION_TITLES[section] ?? "Settings";
    // The index route (redirects to Brand) should read "Settings - Brand".
    const base = section === "settings" ? "Settings" : `${sectionName} Settings`;
    const brand = await getBrandName();

    return {
        // absolute — never composed through the storefront titleTemplate.
        title: { absolute: brand ? `${base} - ${brand}` : base },
        robots: { index: false, follow: false },
        ...extra,
    };
}
