// Payment failed — the gateway redirects here (with ?tran_id= when it has
// one; ?orderId=DE… also resolves through the public tracking lookup).
// Rendered in the SAME design as /order/success: gradient hero + summary and
// confirmation cards, so the customer sees exactly what is still pending.

import { PaymentFailed } from "@/components/public/payment/payment-failed";
import { resolvePaymentOrder } from "@/components/public/payment/resolve-payment-order";
import { PageHero } from "@/components/shared/page-hero";
import { getSettings } from "@/lib/services/settings";
import { unwrapData } from "@/lib/services/api-client";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Payment Failed",
};

export default async function PaymentFailedPage({
  searchParams,
}: {
  searchParams: Promise<{ tran_id?: string; orderId?: string }>;
}) {
  const { tran_id: tranId, orderId } = await searchParams;

  // Best effort — a cancelled Stripe checkout has no transaction on the
  // order yet, and lookups can fail; the page works standalone either way.
  const order = await resolvePaymentOrder(tranId, orderId);
  const brand = unwrapData(await getSettings())?.brand;

  return (
    <div className="bg-hero-surface">
      <PageHero
        eyebrow="Payment failed"
        title="Your payment could not be completed"
        subtitle="No money was deducted. You can safely try again from checkout."
      />
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <PaymentFailed
          order={order}
          tranId={tranId}
          currency={brand?.currency}
        />
      </section>
    </div>
  );
}
