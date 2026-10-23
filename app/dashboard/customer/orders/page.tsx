// Customer Orders, SSR page shell.
// My orders are not implemented in the backend yet (see docs/v8/01.md), so the
// orders index redirects to the my-orders placeholder.

import { redirect } from "next/navigation";
import { dashboardMetadata } from "@/lib/metadata";

export default function CustomerOrdersPage() {
    redirect("/dashboard/customer/orders/my-orders");
}
