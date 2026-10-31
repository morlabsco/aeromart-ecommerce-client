"use client";

import { createContext, useContext } from "react";

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

/** True for admin OR manager (staff share the admin dashboard). */
export function useIsStaff(): boolean {
    const role = useDashboardUser()?.role;
    return role === "admin" || role === "manager";
}
