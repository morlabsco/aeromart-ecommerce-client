// Update order, SSR page. Fetches the order and renders a status update form.

import type { Metadata } from "next";
import { Suspense } from "react";
import { getOrderById } from "@/lib/services/order";
import { isErrorResult } from "@/lib/utils/result";
import { UpdateOrderForm } from "@/components/dashboard/orders/update-order-form";
import { DetailError } from "@/components/dashboard/shared/detail-error";
import { dashboardMetadata } from "@/lib/metadata";
import { PageSkeleton } from "@/components/dashboard/v4/page-skeleton";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
    return dashboardMetadata("/dashboard/admin/orders/update-order/[id]");
  }

async function UpdateOrderContent({ orderId }: { orderId: string }) {
    const result = await getOrderById(orderId);
    if (isErrorResult(result) || !result.data) {
        const message = isErrorResult(result) ? result.message : "Order not found!";
        return <DetailError message={message} backHref="/dashboard/admin/orders" />;
    }
    return <UpdateOrderForm order={result.data} />;
}

export default async function UpdateOrderPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    return (
        <Suspense fallback={<PageSkeleton variant="form" />}>
            <UpdateOrderContent orderId={id} />
        </Suspense>
    );
}
