"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { DashboardSidebar } from "./sidebar";
import { DashboardTopbar } from "./topbar";
import { cn } from "@/lib/utils";
import type { SettingsBrand } from "@/lib/types/backend";

/* ---------------------------------------------------------------------------
 * Dashboard v4 shell — Nittonova dashboard reference (cropped):
 *
 *   [ big page padding around a centered container ]
 *     ┌────────────┐  ┌──────────────────────────────────┐
 *     │  charcoal  │  │  quick-view bar (white)          │
 *     │  sidebar   │  ├──────────────────────────────────┤
 *     │  (rounded) │  │  content canvas (light gray)     │
 *     └────────────┘  └──────────────────────────────────┘
 *
 * Two SEPARATE rounded panels with a gap between them; the quick-view bar
 * (breadcrumb + title + bell + avatar) sits on top of the RIGHT section
 * only. Below lg the sidebar becomes an off-canvas drawer behind the
 * quick-view bar's hamburger.
 * ------------------------------------------------------------------------- */

interface DashboardUser {
    name: string;
    email: string;
    photoUrl?: string | null;
    role: string;
}

interface DashboardShellProps {
    user: DashboardUser | null;
    brand: SettingsBrand | null;
    children: React.ReactNode;
}

export function DashboardShell({ user, brand, children }: DashboardShellProps) {
    const pathname = usePathname();
    const [drawerOpen, setDrawerOpen] = useState(false);

    // Close the drawer whenever the route changes (a nav tap closes it).
    useEffect(() => {
        setDrawerOpen(false);
    }, [pathname]);

    // Lock body scroll while the drawer is open.
    useEffect(() => {
        if (!drawerOpen) return;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "";
        };
    }, [drawerOpen]);

    const isCustomer = user?.role === "customer";
    const title = titleForPath(pathname, isCustomer);

    return (
        <div className="flex min-h-[640px] flex-col gap-5 lg:flex-row lg:gap-6">
            {/* ── Left: charcoal sidebar panel (static on lg, drawer below) ── */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] transition-transform duration-300 lg:static lg:z-auto lg:w-64 lg:max-w-none lg:translate-x-0",
                    drawerOpen ? "translate-x-0" : "-translate-x-full",
                )}
            >
                {/* rounded panel shell on lg; full-bleed drawer on mobile */}
                <div className="h-full overflow-hidden rounded-none shadow-xl lg:rounded-2xl">
                    <DashboardSidebar user={user} brand={brand} />
                </div>
            </aside>

            {/* Drawer scrim (below lg only) */}
            <div
                aria-hidden="true"
                onClick={() => setDrawerOpen(false)}
                className={cn(
                    "fixed inset-0 z-40 bg-scrim/50 transition-opacity duration-300 lg:hidden",
                    drawerOpen ? "opacity-100" : "pointer-events-none opacity-0",
                )}
            />

            {/* ── Right section: quick-view bar + content canvas ── */}
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
                <DashboardTopbar
                    title={title}
                    user={user}
                    onOpenSidebar={() => setDrawerOpen(true)}
                />
                <div className="flex-1 bg-muted/40 p-4 sm:p-5 lg:p-6">
                    {children}
                </div>
            </div>
        </div>
    );
}

/* Page titles for the quick-view bar — the active route in human words
 * (falls back to "Dashboard" / "My Account"). */
const TITLES: { prefix: string; label: string }[] = [
    { prefix: "/dashboard/admin/products/offered-products", label: "Offered Products" },
    { prefix: "/dashboard/admin/products", label: "Products" },
    { prefix: "/dashboard/admin/orders", label: "Orders" },
    { prefix: "/dashboard/admin/users", label: "Users" },
    { prefix: "/dashboard/admin/categories", label: "Categories" },
    { prefix: "/dashboard/admin/brands", label: "Brands" },
    { prefix: "/dashboard/admin/coupons", label: "Coupons" },
    { prefix: "/dashboard/admin/newsletter", label: "Newsletter" },
    { prefix: "/dashboard/admin/reviews", label: "Reviews" },
    { prefix: "/dashboard/admin/activities", label: "Activities" },
    { prefix: "/dashboard/admin/settings", label: "Settings" },
    { prefix: "/dashboard/admin/profile", label: "Profile" },
    { prefix: "/dashboard/customer/orders", label: "My Orders" },
    { prefix: "/dashboard/customer/reviews", label: "My Reviews" },
    { prefix: "/dashboard/customer/profile", label: "Profile" },
];

function titleForPath(pathname: string, isCustomer: boolean): string {
    for (const entry of TITLES) {
        if (pathname === entry.prefix || pathname.startsWith(`${entry.prefix}/`)) {
            return entry.label;
        }
    }
    return isCustomer ? "My Account" : "Dashboard";
}
