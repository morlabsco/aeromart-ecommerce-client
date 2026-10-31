"use client";

import { createContext, useContext } from "react";
import { usePathname } from "next/navigation";
import {
    MANAGER_BASE,
    ADMIN_BASE,
    dashboardBaseFor,
} from "@/lib/utils/dashboard-base";

/** The manager dashboard lives at /dashboard/manager (admins keep
 *  /dashboard/admin). Every internal dashboard link must be built on this
 *  base so the URL never leaks across roles. The constants + role helper
 *  live in the server-safe lib; re-exported here for existing client
 *  imports. */
export { MANAGER_BASE, ADMIN_BASE, dashboardBaseFor };

/* ---------------------------------------------------------------------------
 * Dashboard user context — the v4 shell already resolves the signed-in user
 * (session + profile photo); this exposes it to any client component in the
 * dashboard tree so features can gate on role (e.g. delete actions are
 * admin-only — managers create/update but never delete).
 * ------------------------------------------------------------------------- */

export interface DashboardUserValue {
    name: string;
    email: string;
    photoUrl?: string | null;
    role: string;
}

const DashboardUserContext = createContext<DashboardUserValue | null>(null);

export function DashboardUserProvider({
    user,
    children,
}: {
    user: DashboardUserValue | null;
    children: React.ReactNode;
}) {
    return (
        <DashboardUserContext.Provider value={user}>
            {children}
        </DashboardUserContext.Provider>
    );
}

export function useDashboardUser(): DashboardUserValue | null {
    return useContext(DashboardUserContext);
}

/** True when the current user may delete things (admin only). */
export function useCanDelete(): boolean {
    return useDashboardUser()?.role === "admin";
}

/** True for admin OR manager (staff share the dashboard surface). */
export function useIsStaff(): boolean {
    const role = useDashboardUser()?.role;
    return role === "admin" || role === "manager";
}

/**
 * Role-correct base for internal dashboard links, derived from the current
 * PATHNAME (the URL is the truth — not the session — so shared components
 * link correctly under both /dashboard/admin and /dashboard/manager).
 */
export function useDashboardBase(): string {
    const pathname = usePathname();
    return pathname.startsWith(MANAGER_BASE) ? MANAGER_BASE : ADMIN_BASE;
}

/** Plain helper for places that already know the role (server pages) —
 *  re-exported from the server-safe lib above. */
