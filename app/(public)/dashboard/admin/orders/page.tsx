// Orders module page, SSR + CSR.
// Uses the order module (getAllOrders). Data is fetched server-side with
// tag-based caching and streamed via Suspense.

import type { Metadata } from "next";
import { Suspense } from "react";
import { getAllOrders } from "@/lib/services/order";
import { unwrapList } from "@/lib/services/api-client";
import { isErrorResult } from "@/lib/utils/result";
import { OrdersTable } from "@/components/dashboard/orders/orders";
import { OrdersSkeleton } from "@/components/dashboard/orders/orders-skeleton";
import { dashboardMetadata } from "@/lib/metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
    return dashboardMetadata("/dashboard/admin/orders");
  }

async function OrdersContent() {
    const result = await getAllOrders({ limit: 10, sort: "-createdAt" });
    const orders = unwrapList(result);
    const meta = isErrorResult(result) ? undefined : result.meta;

    return <OrdersTable orders={orders} meta={meta} />;
}

export default function OrdersPage() {
    return (
        <Suspense fallback={<OrdersSkeleton />}>
            <OrdersContent />
        </Suspense>
    );
}
