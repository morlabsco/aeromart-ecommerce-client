// Order details, SSR page (view single). Uses GET /order/:orderId.

import type { Metadata } from "next";
import { Suspense } from "react";
import { getOrderById } from "@/lib/services/order";
import { getSettings } from "@/lib/services/settings";
import { unwrapData } from "@/lib/services/api-client";
import { isErrorResult } from "@/lib/utils/result";
import { OrderDetails } from "@/components/dashboard/orders/order-details";
import { DetailError } from "@/components/dashboard/shared/detail-error";
import { dashboardMetadata } from "@/lib/metadata";
import { PageSkeleton } from "@/components/dashboard/v4/page-skeleton";
import { getSession } from "@/lib/get-session";
import { dashboardBaseFor } from "@/lib/utils/dashboard-base";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
    return dashboardMetadata("/dashboard/admin/orders/[id]");
  }

async function OrderDetailsContent({ orderId }: { orderId: string }) {
    const [result, settingsResult, session] = await Promise.all([
        getOrderById(orderId),
        getSettings(),
        getSession(),
    ]);
    // The page is shared with /dashboard/manager — the session role tells us
    // which base the Back/Update links must use.
    const base = dashboardBaseFor(session.user?.role);
    if (isErrorResult(result) || !result.data) {
        const message = isErrorResult(result) ? result.message : "Order not found!";
        return (
            <DetailError
                message={message}
                backHref={`${base}/orders/all-orders`}
            />
        );
    }
    const brandCurrency = unwrapData(settingsResult)?.brand?.currency ?? "usd";
    return (
        <OrderDetails
            order={result.data}
            brandCurrency={brandCurrency}
            base={base}
        />
    );
}

export default async function OrderDetailsPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    return (
        <Suspense fallback={<PageSkeleton variant="detail" />}>
            <OrderDetailsContent orderId={id} />
        </Suspense>
    );
}
