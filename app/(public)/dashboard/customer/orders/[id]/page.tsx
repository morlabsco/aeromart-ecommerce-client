// Customer order details, SSR page (view single).
// Uses GET /order/:orderId (accessible to customer).

import type { Metadata } from "next";
import { Suspense } from "react";
import { getOrderById } from "@/lib/services/order";
import { getSettings } from "@/lib/services/settings";
import { unwrapData } from "@/lib/services/api-client";
import { isErrorResult } from "@/lib/utils/result";
import { CustomerOrderDetails } from "@/components/dashboard/customer/order-details";
import { DetailError } from "@/components/dashboard/shared/detail-error";
import { dashboardMetadata } from "@/lib/metadata";
import { PageSkeleton } from "@/components/dashboard/v4/page-skeleton";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
    return dashboardMetadata("/dashboard/customer/orders/[id]");
  }

async function CustomerOrderContent({ orderId }: { orderId: string }) {
    const [result, settingsResult] = await Promise.all([
        getOrderById(orderId),
        getSettings(),
    ]);
    if (isErrorResult(result) || !result.data) {
        const message = isErrorResult(result) ? result.message : "Order not found!";
        return <DetailError message={message} backHref="/dashboard/customer/orders/my-orders" />;
    }
    const brandCurrency = unwrapData(settingsResult)?.brand?.currency ?? "usd";
    return <CustomerOrderDetails order={result.data} brandCurrency={brandCurrency} />;
}

export default async function CustomerOrderPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    return (
        <Suspense fallback={<PageSkeleton variant="detail" />}>
            <CustomerOrderContent orderId={id} />
        </Suspense>
    );
}
