"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
    PanelLeftClose,
    PanelLeftOpen,
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

/* ---------------------------------------------------------------------------
 * Dashboard v4 sidebar — Nittonova dashboard reference: charcoal column with
 * a nav-filtering search, grouped menu items (active item on a brand-orange
 * pill) and the user card pinned at the bottom.
 *
 * No brand block — the public header already identifies the store; here it
 * would be redundant. Instead the sidebar COLLAPSES to an icon rail on
 * desktop: icons link directly (tooltips carry the labels) and the search
 * icon expands the rail back, focusing the search box.
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
    /** Desktop icon-rail mode (the mobile drawer always renders expanded). */
    collapsed: boolean;
    onToggleCollapse: () => void;
}

export function DashboardSidebar({
    user,
    collapsed,
    onToggleCollapse,
}: DashboardSidebarProps) {
    const pathname = usePathname();
    const [query, setQuery] = useState("");
    const [loggingOut, setLoggingOut] = useState(false);
    const searchRef = useRef<HTMLInputElement>(null);
    const [focusSearchOnExpand, setFocusSearchOnExpand] = useState(false);

    // Expanding via the rail's search icon should land the caret in the box.
    useEffect(() => {
        if (!collapsed && focusSearchOnExpand) {
            searchRef.current?.focus();
            setFocusSearchOnExpand(false);
        }
    }, [collapsed, focusSearchOnExpand]);

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
            {/* ── Collapse toggle (desktop only — the mobile drawer has none) ── */}
            <div
                className={cn(
                    "hidden h-14 shrink-0 items-center border-b border-white/10 lg:flex",
                    collapsed ? "justify-center" : "justify-end px-4",
                )}
            >
                <button
                    type="button"
                    onClick={onToggleCollapse}
                    aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    className="flex size-9 cursor-pointer items-center justify-center rounded-lg text-white/50 transition-colors hover:bg-white/10 hover:text-header-nav-foreground"
                >
                    {collapsed ? (
                        <PanelLeftOpen className="size-4.5" />
                    ) : (
                        <PanelLeftClose className="size-4.5" />
                    )}
                </button>
            </div>

            {/* ── Search (icon in rail mode — expands + focuses the box) ── */}
            <div className={cn("py-4", collapsed ? "px-3" : "px-4")}>
                {collapsed ? (
                    <button
                        type="button"
                        onClick={() => {
                            setFocusSearchOnExpand(true);
                            onToggleCollapse();
                        }}
                        aria-label="Search menu (expand sidebar)"
                        title="Search"
                        className="flex h-9 w-full cursor-pointer items-center justify-center rounded-lg bg-white/10 text-brand transition-colors hover:bg-white/15"
                    >
                        <svg
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                            className="size-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                        >
                            <circle cx="11" cy="11" r="7" />
                            <path d="m20 20-3.5-3.5" />
                        </svg>
                    </button>
                ) : (
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
                            ref={searchRef}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search here..."
                            aria-label="Filter dashboard menu"
                            className="h-full min-w-0 flex-1 bg-transparent text-sm text-header-nav-foreground placeholder:text-white/40 focus:outline-none"
                        />
                    </div>
                )}
            </div>

            {/* ── Nav groups ── */}
            <nav
                aria-label="Dashboard navigation"
                className="flex-1 space-y-6 overflow-y-auto px-3 pb-4"
            >
                {filtered.map((group) => (
                    <div key={group.title}>
                        {!collapsed && (
                            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-white/35">
                                {group.title}
                            </p>
                        )}
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
                                                title={collapsed ? item.label : undefined}
                                                onClick={async () => {
                                                    setLoggingOut(true);
                                                    await logoutAction();
                                                }}
                                                className={cn(
                                                    "flex w-full cursor-pointer items-center overflow-hidden rounded-lg text-sm transition-colors hover:bg-white/5 hover:text-header-nav-foreground disabled:opacity-50",
                                                    collapsed
                                                        ? "justify-center px-0 py-2.5 text-white/60"
                                                        : "gap-3 px-3 py-2.5 font-medium text-white/60",
                                                )}
                                            >
                                                <Icon className="size-4.5 shrink-0" />
                                                {!collapsed && (
                                                    <span className="truncate">
                                                        {loggingOut
                                                            ? "Logging out…"
                                                            : item.label}
                                                    </span>
                                                )}
                                            </button>
                                        </li>
                                    );
                                }
                                return (
                                    <li key={item.href}>
                                        <Link
                                            href={item.href}
                                            aria-current={active ? "page" : undefined}
                                            title={collapsed ? item.label : undefined}
                                            className={cn(
                                                "flex items-center overflow-hidden rounded-lg text-sm transition-colors",
                                                collapsed
                                                    ? "justify-center px-0 py-2.5"
                                                    : "gap-3 px-3 py-2.5",
                                                active
                                                    ? "bg-brand font-bold text-brand-foreground"
                                                    : "font-medium text-white/60 hover:bg-white/5 hover:text-header-nav-foreground",
                                            )}
                                        >
                                            <Icon className="size-4.5 shrink-0" />
                                            {!collapsed && (
                                                <span className="truncate">
                                                    {item.label}
                                                </span>
                                            )}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
                {filtered.length === 0 && !collapsed && (
                    <p className="px-3 py-6 text-center text-xs text-white/40">
                        Nothing in the menu matches “{query}”.
                    </p>
                )}
            </nav>

            {/* ── User card (avatar only in rail mode) ── */}
            <Link
                href={profileHref}
                title={collapsed ? user?.name || "Profile" : undefined}
                className={cn(
                    "flex shrink-0 items-center border-t border-white/10 transition-colors hover:bg-white/5",
                    collapsed ? "justify-center px-0 py-4" : "gap-3 px-5 py-4",
                )}
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
                {!collapsed && (
                    <>
                        <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-bold">
                                {user?.name ?? "Guest"}
                            </span>
                            <span className="block truncate text-xs text-white/40">
                                {user?.email ?? ""}
                            </span>
                        </span>
                        <ChevronRight className="size-4 shrink-0 text-brand" />
                    </>
                )}
            </Link>
        </div>
    );
}
