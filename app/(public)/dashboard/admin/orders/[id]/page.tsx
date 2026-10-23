// Order details, SSR page (view single). Uses GET /order/:orderId.

import type { Metadata } from "next";
import { Suspense } from "react";
import { getOrderById } from "@/lib/services/order";
import { isErrorResult } from "@/lib/utils/result";
import { OrderDetails } from "@/components/dashboard/orders/order-details";
import { OrderDetailsSkeleton } from "@/components/dashboard/orders/order-details-skeleton";
import { DetailError } from "@/components/dashboard/shared/detail-error";
import { dashboardMetadata } from "@/lib/metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
    return dashboardMetadata("/dashboard/admin/orders/[id]");
  }

async function OrderDetailsContent({ orderId }: { orderId: string }) {
    const result = await getOrderById(orderId);
    if (isErrorResult(result) || !result.data) {
        const message = isErrorResult(result) ? result.message : "Order not found!";
        return <DetailError message={message} backHref="/dashboard/admin/orders" />;
    }
    return <OrderDetails order={result.data} />;
}

export default async function OrderDetailsPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    return (
        <Suspense fallback={<OrderDetailsSkeleton />}>
            <OrderDetailsContent orderId={id} />
        </Suspense>
    );
}
