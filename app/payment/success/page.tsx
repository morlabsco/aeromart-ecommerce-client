// Payment success, shown after a gateway redirects back on success.
// The backend redirects here with ?tran_id=<transactionId>.

import { Suspense } from "react";
import { PaymentResultPage } from "@/components/public/payment/payment-result";

export const dynamic = "force-dynamic";

export default function PaymentSuccessPage({
    searchParams,
}: {
    searchParams: Promise<{ tran_id?: string }>;
}) {
    return (
        <Suspense fallback={<div className="min-h-[60vh]" />}>
            <PaymentResultPage outcome="success" searchParams={searchParams} />
        </Suspense>
    );
}
