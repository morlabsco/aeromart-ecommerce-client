// Payment failed, shown after a gateway redirects back on failure/cancel.

import { Suspense } from "react";
import { PaymentResultPage } from "@/components/public/payment/payment-result";

export const dynamic = "force-dynamic";

export default function PaymentFailedPage({
    searchParams,
}: {
    searchParams: Promise<{ tran_id?: string }>;
}) {
    return (
        <Suspense fallback={<div className="min-h-[60vh]" />}>
            <PaymentResultPage outcome="failed" searchParams={searchParams} />
        </Suspense>
    );
}
