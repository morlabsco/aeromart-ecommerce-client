// Payment success — the gateway (Stripe / SSLCommerz / bKash) redirects here
// with ?tran_id=<transactionId> after a confirmed payment; ?orderId=DE… also
// resolves (public tracking lookup), so shared links work for guests.
// Rendered in the SAME design as /order/success: gradient hero + the shared
// OrderSuccess component, fed from the resolved order — a full, familiar
// receipt of what was just paid for.

import { Suspense } from "react";
import Link from "next/link";
import { PackageSearch } from "lucide-react";
import { PageHero } from "@/components/shared/page-hero";
import { OrderSuccess } from "@/components/public/order/order-success";
import { resolvePaymentOrder } from "@/components/public/payment/resolve-payment-order";
import { getSettings } from "@/lib/services/settings";
import { unwrapData } from "@/lib/services/api-client";
import { storefrontMetadata } from "@/lib/metadata";

export const dynamic = "force-dynamic";

export const generateMetadata = () =>
  storefrontMetadata({ title: "Payment Successful" });

async function PaymentSuccessContent({
  tranId,
  orderId,
  brandCurrency,
}: {
  tranId?: string;
  orderId?: string;
  brandCurrency?: string;
}) {
  // The backend marks the order Paid before redirecting here, so a resolved
  // order carries its real payment state. When nothing resolves (missing
  // ids, stale transaction) we fall back to a friendly standalone card.
  const order = await resolvePaymentOrder(tranId, orderId);

  if (!order) {
    return (
      <div className="mx-auto max-w-md rounded-[1.75rem] bg-card p-8 text-center shadow-sm sm:p-10">
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-success/15">
          <PackageSearch className="size-7 text-success" strokeWidth={1.5} />
        </span>
        <h1 className="mt-4 text-xl font-bold text-foreground">
          Payment received
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Your payment was processed, but we couldn&apos;t load the order
          details on this device. Your order is safe — track it with your
          order ID.
        </p>
        <Link
          href="/track-order"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-brand px-8 text-sm font-bold text-brand-foreground transition-colors hover:bg-brand/90"
        >
          Track Order
        </Link>
      </div>
    );
  }

  return <OrderSuccess order={order} currency={brandCurrency} />;
}

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ tran_id?: string; orderId?: string }>;
}) {
  const { tran_id: tranId, orderId } = await searchParams;
  const brandCurrency = unwrapData(await getSettings())?.brand?.currency;

  return (
    <div className="bg-hero-surface">
      <PageHero
        eyebrow="Payment confirmed"
        title="Thank you for your order!"
        subtitle="Your payment went through successfully — everything is confirmed below."
      />
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <Suspense
          fallback={<div className="h-96 animate-pulse rounded-[1.75rem] bg-card" />}
        >
          <PaymentSuccessContent
            tranId={tranId}
            orderId={orderId}
            brandCurrency={brandCurrency}
          />
        </Suspense>
      </section>
    </div>
  );
}
