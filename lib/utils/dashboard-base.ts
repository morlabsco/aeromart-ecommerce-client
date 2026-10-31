/* Role → dashboard URL base, in a module safe to import from BOTH server
 * and client components (dashboard-user.tsx re-exports it for client code).
 *
 * The manager dashboard lives at /dashboard/manager (admins keep
 * /dashboard/admin). Shared feature components render under BOTH prefixes,
 * so every internal dashboard href must be built on this base — relative
 * links like "../" are NOT safe: URL resolution strips the dynamic segment
 * AND its parent directory (an order details "../update-order/x" resolves
 * to the flat /dashboard/admin/update-order/x, and "../" lands on the role
 * overview instead of the module list). */

export const MANAGER_BASE = "/dashboard/manager";
export const ADMIN_BASE = "/dashboard/admin";

/** URL base for the given session role (defaults to admin). */
export function dashboardBaseFor(role?: string | null): string {
    return role === "manager" ? MANAGER_BASE : ADMIN_BASE;
}
