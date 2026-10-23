// My Orders, SSR page using the customer my-orders endpoint (GET /order/my-orders).

import type { Metadata } from "next";
import { Suspense } from "react";
import { getMyOrders } from "@/lib/services/order";
import { getSettings } from "@/lib/services/settings";
import { unwrapData, unwrapList } from "@/lib/services/api-client";
import { isErrorResult } from "@/lib/utils/result";
import { MyOrdersTable } from "@/components/dashboard/customer/my-orders";
import { CustomerOrdersSkeleton } from "@/components/dashboard/customer/my-orders-skeleton";
import { DetailError } from "@/components/dashboard/shared/detail-error";
import { dashboardMetadata } from "@/lib/metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
    return dashboardMetadata("/dashboard/customer/orders/my-orders");
  }

async function MyOrdersContent() {
    const [result, settingsResult] = await Promise.all([
        getMyOrders({ limit: 20, sort: "-createdAt" }),
        getSettings(),
    ]);
    if (isErrorResult(result)) {
        return <DetailError message={result.message} backHref="/dashboard/customer" />;
    }
    const brandCurrency =
        unwrapData(settingsResult)?.brand?.currency ?? "usd";
    return (
        <MyOrdersTable
            orders={result.data}
            meta={result.meta}
            brandCurrency={brandCurrency}
        />
    );
}

export default function MyOrdersPage() {
    return (
        <Suspense fallback={<CustomerOrdersSkeleton />}>
            <MyOrdersContent />
        </Suspense>
    );
}
