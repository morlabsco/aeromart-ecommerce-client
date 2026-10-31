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
const CUSTOMER_PREFIX = "/dashboard/customer";

// Admin-ONLY dashboard sections — managers share the rest of /dashboard/admin
// but never see user management, store settings or the newsletter list.
const ADMIN_ONLY_SECTIONS = [
    "/dashboard/admin/settings",
    "/dashboard/admin/users",
    "/dashboard/admin/newsletter",
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
    return role === "customer" ? "/dashboard/customer" : "/dashboard/admin";
}

/** Staff (admin + manager) share the admin dashboard. */
function isStaff(role: string | undefined): boolean {
    return role === "admin" || role === "manager";
}

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
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

    // Role enforcement: admin routes for staff (admin + manager), customer
    // routes for customers.
    if (pathname === ADMIN_PREFIX || pathname.startsWith(`${ADMIN_PREFIX}/`)) {
        if (!isStaff(role)) {
            return NextResponse.redirect(
                new URL(roleHome(role), request.url)
            );
        }
        // Manager locks: the admin-only sections bounce managers home.
        if (
            role !== "admin" &&
            ADMIN_ONLY_SECTIONS.some(
                (section) =>
                    pathname === section || pathname.startsWith(`${section}/`)
            )
        ) {
            return NextResponse.redirect(
                new URL("/dashboard/admin", request.url)
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
