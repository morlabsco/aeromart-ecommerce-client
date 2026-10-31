/**
 * Activity audit-log references — maps an activity's module + referenceId to
 * the record's dashboard detail page, so the log carries actionable PROOF
 * (jump straight to the order/product/user the entry talks about). Activities
 * are an admin-only panel, so links always use the admin base.
 */

const ENTITY_ROUTES: Record<string, (id: string) => string> = {
    Order: (id) => `/dashboard/admin/orders/${id}`,
    Product: (id) => `/dashboard/admin/products/${id}`,
    User: (id) => `/dashboard/admin/users/${id}`,
    Coupon: (id) => `/dashboard/admin/coupons/${id}`,
    Review: (id) => `/dashboard/admin/reviews/${id}`,
    Brand: (id) => `/dashboard/admin/brands/${id}`,
    Category: (id) => `/dashboard/admin/categories/${id}`,
    // Settings / Payment entries have no single-record page.
};

/** Detail-page href for an activity, or null when the module has no view. */
export function activityEntityHref(
    module: string,
    referenceId?: string | null,
): string | null {
    if (!referenceId) return null;
    const route = ENTITY_ROUTES[module];
    return route ? route(referenceId) : null;
}

/** Human label for a metadata key ("finalAmount" → "Final Amount"). */
export function activityMetaLabel(key: string): string {
    return key
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .replace(/^./, (c) => c.toUpperCase());
}

/** Render a metadata value for display (booleans/numbers/short arrays). */
export function activityMetaValue(value: unknown): string {
    if (value === null || value === undefined) return "—";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (typeof value === "number") return String(value);
    if (Array.isArray(value))
        return value.length > 0 ? value.map((v) => String(v)).join(", ") : "—";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
}
