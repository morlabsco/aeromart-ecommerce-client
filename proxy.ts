import { NextRequest, NextResponse } from "next/server";

const ACCESS_TOKEN_COOKIE = "accessToken";

// Auth routes, redirect to the role dashboard if already signed in.
const AUTH_ROUTES = [
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
];

const PROTECTED_DASHBOARD_PREFIX = "/dashboard";
const ADMIN_PREFIX = "/dashboard/admin";
const MANAGER_PREFIX = "/dashboard/manager";
const CUSTOMER_PREFIX = "/dashboard/customer";

// Sub-route leaves that live under a module folder (e.g. /dashboard/admin/
// orders/update-order/[id]). Old bookmarks or hand-typed URLs sometimes drop
// the module segment (/dashboard/admin/update-order/…) — map those to the
// canonical route instead of letting them 404.
const MODULE_LEAVES: Record<string, string> = {
    "all-orders": "orders",
    "create-order": "orders",
    "update-order": "orders",
    "all-products": "products",
    "create-product": "products",
    "update-product": "products",
    "offered-products": "products",
    "all-users": "users",
    "create-user": "users",
    "update-user": "users",
    "all-categories": "categories",
    "create-category": "categories",
    "update-category": "categories",
    "all-brands": "brands",
    "create-brand": "brands",
    "update-brand": "brands",
    "all-coupons": "coupons",
    "create-coupon": "coupons",
    "update-coupon": "coupons",
};

/** Canonical path for a legacy flat dashboard URL, or null when it's not one. */
function legacyDashboardRedirect(pathname: string): string | null {
    const match = pathname.match(
        /^\/dashboard\/(admin|manager)\/([^/]+)(\/.*)?$/
    );
    if (!match) return null;
    const [, role, leaf, rest = ""] = match;
    const module = MODULE_LEAVES[leaf];
    if (!module) return null;
    return `/dashboard/${role}/${module}/${leaf}${rest}`;
}

// Admin-ONLY dashboard sections (defense in depth — the proxy already keeps
// managers on /dashboard/manager entirely; these guard the admin prefix).
const ADMIN_ONLY_SECTIONS = [
    "/dashboard/admin/settings",
    "/dashboard/admin/users",
    "/dashboard/admin/newsletter",
    "/dashboard/admin/activities",
    "/dashboard/manager/settings",
    "/dashboard/manager/users",
    "/dashboard/manager/newsletter",
    "/dashboard/manager/activities",
];

interface DecodedJwt {
    role?: string;
    [key: string]: unknown;
}

function matchesAuthRoute(pathname: string): boolean {
    return AUTH_ROUTES.some(
        (route) => pathname === route || pathname.startsWith(`${route}/`)
    );
}

/** Edge-safe JWT payload decode (no signature verification). */
function decodeToken(token: string): DecodedJwt | null {
    try {
        const [, payload] = token.split(".");
        if (!payload) return null;
        const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
        const padded = base64.padEnd(
            base64.length + ((4 - (base64.length % 4)) % 4),
            "="
        );
        return JSON.parse(
            decodeURIComponent(
                atob(padded)
                    .split("")
                    .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                    .join("")
            )
        ) as DecodedJwt;
    } catch {
        return null;
    }
}

function roleHome(role: string | undefined): string {
    if (role === "customer") return "/dashboard/customer";
    // Managers have their OWN dashboard surface at /dashboard/manager.
    if (role === "manager") return "/dashboard/manager";
    return "/dashboard/admin";
}

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Legacy flat dashboard URLs → canonical module route (permanent, so
    // browsers rewrite stale bookmarks/history). Runs before auth so the
    // login callbackUrl also lands on the canonical path.
    const legacy = legacyDashboardRedirect(pathname);
    if (legacy) {
        const canonical = new URL(legacy, request.url);
        canonical.search = request.nextUrl.search;
        return NextResponse.redirect(canonical, 308);
    }

    const token = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
    const hasToken = !!token;
    const payload = token ? decodeToken(token) : null;
    const role = payload?.role;

    // Authenticated users hitting auth pages go to their role's dashboard.
    if (hasToken && matchesAuthRoute(pathname)) {
        return NextResponse.redirect(new URL(roleHome(role), request.url));
    }

    // Dashboard pages require a token.
    if (!hasToken && pathname.startsWith(PROTECTED_DASHBOARD_PREFIX)) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Role enforcement: /dashboard/admin is ADMIN-only (managers live at
    // /dashboard/manager, customers at /dashboard/customer).
    if (pathname === ADMIN_PREFIX || pathname.startsWith(`${ADMIN_PREFIX}/`)) {
        if (role !== "admin") {
            return NextResponse.redirect(
                new URL(roleHome(role), request.url)
            );
        }
        if (
            ADMIN_ONLY_SECTIONS.some(
                (section) =>
                    pathname === section || pathname.startsWith(`${section}/`)
            )
        ) {
            // An admin is allowed everywhere on the admin prefix — the
            // section list only ever bounces non-admins (kept for safety if
            // a route is ever shared across prefixes).
        }
    }
    if (
        pathname === MANAGER_PREFIX ||
        pathname.startsWith(`${MANAGER_PREFIX}/`)
    ) {
        if (role !== "manager") {
            return NextResponse.redirect(
                new URL(roleHome(role), request.url)
            );
        }
        // Manager-locked sections bounce home instead of 404ing (no alias
        // routes exist for them by design).
        const managerSection = (section: string) =>
            section.replace("/dashboard/admin", "/dashboard/manager");
        if (
            ADMIN_ONLY_SECTIONS.some(
                section =>
                    pathname === managerSection(section) ||
                    pathname.startsWith(`${managerSection(section)}/`),
            )
        ) {
            return NextResponse.redirect(
                new URL(MANAGER_PREFIX, request.url)
            );
        }
    }
    if (pathname === CUSTOMER_PREFIX || pathname.startsWith(`${CUSTOMER_PREFIX}/`)) {
        if (role !== "customer") {
            return NextResponse.redirect(
                new URL(roleHome(role), request.url)
            );
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!.+\\.[\\w]+$|_next|api).*)", "/"],
};
