"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { NotificationsPopover } from "./notifications-popover";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------
 * Dashboard v4 topbar — Nittonova dashboard reference: white bar with the
 * page title, the notification bell (orange presence dot) and the user
 * avatar; a hamburger opens the sidebar drawer below lg.
 * ------------------------------------------------------------------------- */

export function DashboardTopbar({
    title,
    user,
    onOpenSidebar,
}: {
    title: string;
    user: {
        name: string;
        photoUrl?: string | null;
        role: string;
    } | null;
    onOpenSidebar: () => void;
}) {
    const profileHref =
        user?.role === "customer"
            ? "/dashboard/customer/profile"
            : "/dashboard/admin/profile";

    const initials = (user?.name || "U")
        .split(" ")
        .map((part) => part[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase();

    return (
        <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border/60 bg-card px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
                <button
                    type="button"
                    onClick={onOpenSidebar}
                    aria-label="Open menu"
                    className="flex size-9 cursor-pointer items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted lg:hidden"
                >
                    <Menu className="size-5" />
                </button>
                {/* One static shell title — each content section titles
                 * itself, so repeating the page name here is redundant. */}
                <h1 className="min-w-0 truncate text-lg font-bold tracking-tight text-foreground sm:text-xl">
                    {title}
                </h1>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                {/* Notifications quick view — recent activity in a popover
                    (customers skip it — no activities module on their side). */}
                {user?.role !== "customer" && <NotificationsPopover />}
                <Link
                    href={profileHref}
                    aria-label="Your profile"
                    className="flex items-center"
                >
                    {user?.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={user.photoUrl}
                            alt={user.name}
                            className="size-9 rounded-full object-cover"
                        />
                    ) : (
                        <span className="flex size-9 items-center justify-center rounded-full bg-header-nav text-xs font-extrabold text-header-nav-foreground">
                            {initials}
                        </span>
                    )}
                </Link>
            </div>
        </header>
    );
}
