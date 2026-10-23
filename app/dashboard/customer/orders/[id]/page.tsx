// Customer order details, SSR page (view single).
// Uses GET /order/:orderId (accessible to customer).

import type { Metadata } from "next";
import { Suspense } from "react";
import { getOrderById } from "@/lib/services/order";
import { isErrorResult } from "@/lib/utils/result";
import { CustomerOrderDetails } from "@/components/dashboard/customer/order-details";
import { CustomerOrderDetailsSkeleton } from "@/components/dashboard/customer/order-details-skeleton";
import { DetailError } from "@/components/dashboard/shared/detail-error";
import { dashboardMetadata } from "@/lib/metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
    return dashboardMetadata("/dashboard/customer/orders/[id]");
  }

async function CustomerOrderContent({ orderId }: { orderId: string }) {
    const result = await getOrderById(orderId);
    if (isErrorResult(result) || !result.data) {
        const message = isErrorResult(result) ? result.message : "Order not found!";
        return <DetailError message={message} backHref="/dashboard/customer/orders/my-orders" />;
    }
    return <CustomerOrderDetails order={result.data} />;
}

export default async function CustomerOrderPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    return (
        <Suspense fallback={<CustomerOrderDetailsSkeleton />}>
            <CustomerOrderContent orderId={id} />
        </Suspense>
    );
}
