"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Activity,
    BadgePercent,
    ChevronRight,
    FolderTree,
    LayoutDashboard,
    LogOut,
    Mail,
    Package,
    Settings2,
    Shapes,
    ShoppingCart,
    Star,
    Store,
    Ticket,
    Users,
} from "lucide-react";
import { logoutAction } from "@/lib/services/auth";
import { cn } from "@/lib/utils";
import type { SettingsBrand } from "@/lib/types/backend";

/* ---------------------------------------------------------------------------
 * Dashboard v4 sidebar — Nittonova dashboard reference: charcoal column with
 * the brand block, a nav-filtering search, grouped menu items (active item on
 * a brand-orange pill) and the user card pinned at the bottom.
 *
 * v4 stage 1: the nav carries ONLY the pages rebuilt in the new design
 * (overview, newsletter, profile). The previous dashboard's feature pages
 * are parked out of the route tree under "_parked" folders and return
 * one by one — redesigned — after the design is verified.
 * ------------------------------------------------------------------------- */

interface NavItem {
    label: string;
    href: string;
    icon: typeof LayoutDashboard;
    action?: "logout";
}

interface NavGroup {
    title: string;
    items: NavItem[];
}

const ADMIN_NAV: NavGroup[] = [
    {
        title: "Main menu",
        items: [
            { label: "Dashboard", href: "/dashboard/admin", icon: LayoutDashboard },
            { label: "Orders", href: "/dashboard/admin/orders/all-orders", icon: ShoppingCart },
            { label: "Products", href: "/dashboard/admin/products/all-products", icon: Package },
            { label: "Offered Products", href: "/dashboard/admin/products/offered-products", icon: BadgePercent },
            { label: "Categories", href: "/dashboard/admin/categories/all-categories", icon: FolderTree },
            { label: "Brands", href: "/dashboard/admin/brands/all-brands", icon: Shapes },
            { label: "Coupons", href: "/dashboard/admin/coupons/all-coupons", icon: Ticket },
            { label: "Newsletter", href: "/dashboard/admin/newsletter", icon: Mail },
            { label: "Users", href: "/dashboard/admin/users/all-users", icon: Users },
            { label: "Reviews", href: "/dashboard/admin/reviews", icon: Star },
            { label: "Activities", href: "/dashboard/admin/activities", icon: Activity },
        ],
    },
    {
        title: "General",
        items: [
            { label: "Settings", href: "/dashboard/admin/settings/brand", icon: Settings2 },
            { label: "Visit Store", href: "/", icon: Store },
            { label: "Logout", href: "#logout", icon: LogOut, action: "logout" },
        ],
    },
];

const CUSTOMER_NAV: NavGroup[] = [
    {
        title: "Main menu",
        items: [
            { label: "Dashboard", href: "/dashboard/customer", icon: LayoutDashboard },
            { label: "My Orders", href: "/dashboard/customer/orders/my-orders", icon: ShoppingCart },
            { label: "My Reviews", href: "/dashboard/customer/reviews", icon: Star },
        ],
    },
    {
        title: "General",
        items: [
            { label: "Visit Store", href: "/", icon: Store },
            { label: "Logout", href: "#logout", icon: LogOut, action: "logout" },
        ],
    },
];

interface DashboardSidebarProps {
    user: {
        name: string;
        email: string;
        photoUrl?: string | null;
        role: string;
    } | null;
    brand: SettingsBrand | null;
}

export function DashboardSidebar({ user, brand }: DashboardSidebarProps) {
    const pathname = usePathname();
    const [query, setQuery] = useState("");
    const [loggingOut, setLoggingOut] = useState(false);

    const groups = user?.role === "customer" ? CUSTOMER_NAV : ADMIN_NAV;

    // The search box filters the menu itself — instant, offline and honest
    // (a global dashboard search can come later as a real feature).
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return groups;
        return groups
            .map((group) => ({
                ...group,
                items: group.items.filter((item) =>
                    item.label.toLowerCase().includes(q),
                ),
            }))
            .filter((group) => group.items.length > 0);
    }, [groups, query]);

    const isActive = (href: string) => {
        if (href === "#logout") return false;
        if (href === "/dashboard/admin" || href === "/dashboard/customer")
            return pathname === href;
        return pathname === href || pathname.startsWith(`${href}/`);
    };

    const initials = (user?.name || "U")
        .split(" ")
        .map((part) => part[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase();

    const profileHref =
        user?.role === "customer"
            ? "/dashboard/customer/profile"
            : "/dashboard/admin/profile";

    return (
        <div className="flex h-full flex-col bg-header-nav text-header-nav-foreground">
            {/* ── Brand block ── */}
            <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-white/10 px-5">
                {brand?.logo ? (
                    // White plate behind the logo — the charcoal sidebar
                    // otherwise eats dark/transparent logo artwork.
                    <span className="flex h-10 shrink-0 items-center justify-center rounded-lg bg-card px-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={brand.logo}
                            alt={brand.name || "Store"}
                            className="h-7 w-auto max-w-[140px] object-contain"
                        />
                    </span>
                ) : (
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand text-sm font-extrabold text-brand-foreground">
                        {(brand?.name || "A").charAt(0).toUpperCase()}
                    </span>
                )}
                {!brand?.logoOnly && (
                    <span className="truncate text-base font-extrabold tracking-tight">
                        {brand?.name || "AeroMart"}
                    </span>
                )}
            </div>

            {/* ── Search ── */}
            <div className="px-4 py-4">
                <div className="flex h-9 items-center gap-2 rounded-lg bg-white/10 px-3 transition-colors focus-within:bg-white/15">
                    <svg
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                        className="size-4 shrink-0 text-brand"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                    >
                        <circle cx="11" cy="11" r="7" />
                        <path d="m20 20-3.5-3.5" />
                    </svg>
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search here..."
                        aria-label="Filter dashboard menu"
                        className="h-full min-w-0 flex-1 bg-transparent text-sm text-header-nav-foreground placeholder:text-white/40 focus:outline-none"
                    />
                </div>
            </div>

            {/* ── Nav groups ── */}
            <nav
                aria-label="Dashboard navigation"
                className="flex-1 space-y-6 overflow-y-auto px-3 pb-4"
            >
                {filtered.map((group) => (
                    <div key={group.title}>
                        <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-white/35">
                            {group.title}
                        </p>
                        <ul className="space-y-1">
                            {group.items.map((item) => {
                                const Icon = item.icon;
                                const active = isActive(item.href);
                                if (item.action === "logout") {
                                    return (
                                        <li key={item.label}>
                                            <button
                                                type="button"
                                                disabled={loggingOut}
                                                onClick={async () => {
                                                    setLoggingOut(true);
                                                    await logoutAction();
                                                }}
                                                className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-header-nav-foreground disabled:opacity-50"
                                            >
                                                <Icon className="size-4.5 shrink-0" />
                                                {loggingOut
                                                    ? "Logging out…"
                                                    : item.label}
                                            </button>
                                        </li>
                                    );
                                }
                                return (
                                    <li key={item.href}>
                                        <Link
                                            href={item.href}
                                            aria-current={active ? "page" : undefined}
                                            className={cn(
                                                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                                                active
                                                    ? "bg-brand font-bold text-brand-foreground"
                                                    : "font-medium text-white/60 hover:bg-white/5 hover:text-header-nav-foreground",
                                            )}
                                        >
                                            <Icon className="size-4.5 shrink-0" />
                                            <span className="truncate">{item.label}</span>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
                {filtered.length === 0 && (
                    <p className="px-3 py-6 text-center text-xs text-white/40">
                        Nothing in the menu matches “{query}”.
                    </p>
                )}
            </nav>

            {/* ── User card ── */}
            <Link
                href={profileHref}
                className="flex shrink-0 items-center gap-3 border-t border-white/10 px-5 py-4 transition-colors hover:bg-white/5"
            >
                {user?.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={user.photoUrl}
                        alt={user.name}
                        className="size-9 shrink-0 rounded-full object-cover"
                    />
                ) : (
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-extrabold text-brand-foreground">
                        {initials}
                    </span>
                )}
                <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">
                        {user?.name ?? "Guest"}
                    </span>
                    <span className="block truncate text-xs text-white/40">
                        {user?.email ?? ""}
                    </span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-brand" />
            </Link>
        </div>
    );
}
