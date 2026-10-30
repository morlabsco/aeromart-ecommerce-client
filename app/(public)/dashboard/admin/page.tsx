// Dashboard Overview, SSR page.
// Uses the meta module (GET /meta) and the orders module (getAllOrders).
// Data is fetched server-side with tag-based caching and streamed via Suspense.

import type { Metadata } from "next";
import { Suspense } from "react";
import { getMeta } from "@/lib/services/meta";
import { getAllOrders } from "@/lib/services/order";
import { getSettings } from "@/lib/services/settings";
import { unwrapData, unwrapList } from "@/lib/services/api-client";
import { dashboardMetadata } from "@/lib/metadata";
import { DashboardOverviewV4 } from "@/components/dashboard/v4/overview";
import { PageSkeleton } from "@/components/dashboard/v4/page-skeleton";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
    return dashboardMetadata("/dashboard/admin");
}

async function OverviewContent() {
    const [metaResult, ordersResult, settingsResult] = await Promise.all([
        getMeta(),
        getAllOrders({ limit: 100, sort: "-createdAt" }),
        getSettings(),
    ]);

    const meta = unwrapData(metaResult);
    const orders = unwrapList(ordersResult);
    const brandCurrency =
        unwrapData(settingsResult)?.brand?.currency ?? "usd";

    return (
        <DashboardOverviewV4
            meta={meta}
            orders={orders}
            brandCurrency={brandCurrency}
        />
    );
}

export default function Page() {
    return (
        <Suspense fallback={<PageSkeleton variant="table" />}>
            <OverviewContent />
        </Suspense>
    );
}
