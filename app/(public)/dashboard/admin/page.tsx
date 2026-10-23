// Dashboard Overview, SSR page.
// Uses the meta module (GET /meta) and the orders module (getAllOrders).
// Data is fetched server-side with tag-based caching and streamed via Suspense.

import type { Metadata } from "next";
import { Suspense } from "react";
import { getMeta } from "@/lib/services/meta";
import { getAllOrders } from "@/lib/services/order";
import { getSettings } from "@/lib/services/settings";
import { unwrapData, unwrapList } from "@/lib/services/api-client";
import { formatCurrency } from "@/lib/utils/currency";
import { DashboardOverview } from "@/components/dashboard/overview/overview";
import { OverviewSkeleton } from "@/components/dashboard/overview/overview-skeleton";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
    const settingsResult = await getSettings();
    const brand =
        unwrapData(settingsResult)?.brand?.name ?? null;
    return {
        title: brand ? `Admin Overview - ${brand}` : "Admin Overview",
        description: "Dashboard overview with key metrics and charts.",
        robots: { index: false, follow: false },
    };
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
        <DashboardOverview
            meta={meta}
            orders={orders}
            brandCurrency={brandCurrency}
        />
    );
}

export default function Page() {
    return (
        <Suspense fallback={<OverviewSkeleton />}>
            <OverviewContent />
        </Suspense>
    );
}
