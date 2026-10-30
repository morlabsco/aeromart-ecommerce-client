// Orders module page, SSR + CSR.
// Uses the order module (getAllOrders). Data is fetched server-side with
// tag-based caching and streamed via Suspense.

import type { Metadata } from "next";
import { Suspense } from "react";
import { getAllOrders } from "@/lib/services/order";
import { unwrapList, unwrapData } from "@/lib/services/api-client";
import { getSettings } from "@/lib/services/settings";
import { isErrorResult } from "@/lib/utils/result";
import { OrdersTable } from "@/components/dashboard/orders/orders";
import { dashboardMetadata } from "@/lib/metadata";
import { PageSkeleton } from "@/components/dashboard/v4/page-skeleton";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
    return dashboardMetadata("/dashboard/admin/orders");
  }

async function OrdersContent() {
    const [result, settingsResult] = await Promise.all([
        getAllOrders({ limit: 200, sort: "-createdAt" }),
        getSettings(),
    ]);
    const orders = unwrapList(result);
    const meta = isErrorResult(result) ? undefined : result.meta;
    const brandCurrency = unwrapData(settingsResult)?.brand?.currency ?? "usd";

    return <OrdersTable orders={orders} meta={meta} brandCurrency={brandCurrency} />;
}

export default function OrdersPage() {
    return (
        <Suspense fallback={<PageSkeleton variant="table" />}>
            <OrdersContent />
        </Suspense>
    );
}
