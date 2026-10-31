// Manager route — thin re-export of the shared admin page so both
// /dashboard/admin/... (admin) and /dashboard/manager/... (manager)
// render the same feature. Keep role-specific links on useDashboardBase().
export { default, generateMetadata } from "../../../admin/coupons/all-coupons/page";

// Route-segment config is per-file — keep the aliases dynamic like the admin pages.
export const dynamic = "force-dynamic";
