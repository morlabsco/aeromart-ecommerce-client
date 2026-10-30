// All orders list, SSR page using the order module (getAllOrders).

import type { Metadata } from "next";
import { Suspense } from "react";
import { getAllOrders } from "@/lib/services/order";
import { unwrapList } from "@/lib/services/api-client";
import { isErrorResult } from "@/lib/utils/result";
import { OrdersTable } from "@/components/dashboard/orders/orders";
import { dashboardMetadata } from "@/lib/metadata";
import { PageSkeleton } from "@/components/dashboard/v4/page-skeleton";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
    return dashboardMetadata("/dashboard/admin/orders/all-orders");
  }

async function AllOrdersContent() {
    const result = await getAllOrders({ limit: 10, sort: "-createdAt" });
    const orders = unwrapList(result);
    const meta = isErrorResult(result) ? undefined : result.meta;

    return <OrdersTable orders={orders} meta={meta} />;
}

export default function AllOrdersPage() {
    return (
        <Suspense fallback={<PageSkeleton variant="table" />}>
            <AllOrdersContent />
        </Suspense>
    );
}
