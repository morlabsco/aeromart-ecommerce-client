"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { DashboardSidebar } from "./sidebar";
import { DashboardTopbar } from "./topbar";
import { cn } from "@/lib/utils";

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
 * (title + bell + avatar) sits on top of the RIGHT section only. Below lg
 * the sidebar becomes an off-canvas drawer behind the quick-view bar's
 * hamburger. On desktop the sidebar collapses to an icon rail (state kept
 * in localStorage; the content pages title themselves, so the quick-view
 * bar carries a single static "Dashboard" title).
 * ------------------------------------------------------------------------- */

interface DashboardUser {
    name: string;
    email: string;
    photoUrl?: string | null;
    role: string;
}

interface DashboardShellProps {
    user: DashboardUser | null;
    children: React.ReactNode;
}

const COLLAPSE_STORAGE_KEY = "aeromart:dashboard-sidebar-collapsed";

/** lg-and-up (where the sidebar is a static panel, not the drawer). */
function useIsDesktop() {
    const [isDesktop, setIsDesktop] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia("(min-width: 1024px)");
        const update = () => setIsDesktop(mq.matches);
        update();
        mq.addEventListener("change", update);
        return () => mq.removeEventListener("change", update);
    }, []);
    return isDesktop;
}

export function DashboardShell({ user, children }: DashboardShellProps) {
    const pathname = usePathname();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const isDesktop = useIsDesktop();

    // Restore the collapse preference, then persist every change. The rail
    // only ever applies to the static desktop panel — the mobile drawer
    // always renders expanded.
    useEffect(() => {
        try {
            setCollapsed(
                window.localStorage.getItem(COLLAPSE_STORAGE_KEY) === "1",
            );
        } catch {
            // private mode etc. — collapse just isn't persisted
        }
    }, []);

    useEffect(() => {
        try {
            window.localStorage.setItem(
                COLLAPSE_STORAGE_KEY,
                collapsed ? "1" : "0",
            );
        } catch {
            // ignore
        }
    }, [collapsed]);

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
    const railMode = collapsed && isDesktop;

    return (
        <div className="flex min-h-[640px] flex-col gap-5 lg:flex-row lg:gap-6">
            {/* ── Left: charcoal sidebar panel (static on lg, drawer below) ── */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] transition-transform duration-300 lg:static lg:z-auto lg:max-w-none lg:translate-x-0 lg:transition-[width]",
                    railMode ? "lg:w-[4.75rem]" : "lg:w-64",
                    drawerOpen ? "translate-x-0" : "-translate-x-full",
                )}
            >
                {/* rounded panel shell on lg; full-bleed drawer on mobile */}
                <div className="h-full overflow-hidden rounded-none shadow-xl lg:rounded-2xl">
                    <DashboardSidebar
                        user={user}
                        collapsed={railMode}
                        onToggleCollapse={() => setCollapsed((c) => !c)}
                    />
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
                    title={isCustomer ? "My Account" : "Dashboard"}
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
