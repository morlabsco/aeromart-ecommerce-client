import { Suspense } from "react"
import Link from "next/link"
import { PackageSearch } from "lucide-react"
import { PageHero } from "@/components/shared/page-hero"
import { OrderSuccess } from "@/components/public/order/order-success"
import { trackOrder } from "@/lib/services/order"
import { unwrapData } from "@/lib/services/api-client"
import { isErrorResult } from "@/lib/utils/result"
import type { Metadata } from "next"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Order Placed Successfully",
}

/**
 * Post-checkout landing: /order/success?orderId=DEXXXXXX. The order is
 * looked up through the PUBLIC tracking endpoint, so the page works for
 * guests, survives reloads and can be shared — the customer keeps, copies
 * or shares the order ID from here, jumps into tracking, or downloads the
 * invoice (owner/admin auth applies on the invoice API).
 */
async function OrderSuccessContent({
  orderId,
}: {
  orderId?: string
}) {
  let order = null
  if (orderId) {
    const result = await trackOrder(orderId)
    order = isErrorResult(result) ? null : unwrapData(result)
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-md rounded-[1.75rem] bg-card p-8 text-center shadow-sm sm:p-10">
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-muted">
          <PackageSearch className="size-7 text-muted-foreground" strokeWidth={1.5} />
        </span>
        <h1 className="mt-4 text-xl font-bold text-foreground">
          Order not found
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {orderId
            ? `We couldn't find an order with the ID "${orderId}". Double-check it and try tracking.`
            : "No order ID was provided. Enter your order ID on the tracking page to see its status."}
        </p>
        <Link
          href="/track-order"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-brand px-8 text-sm font-bold text-brand-foreground transition-colors hover:bg-brand/90"
        >
          Track Order
        </Link>
      </div>
    )
  }

  return <OrderSuccess order={order} />
}

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>
}) {
  const { orderId } = await searchParams

  return (
    <div className="bg-hero-surface">
      <PageHero
        eyebrow="Order confirmed"
        title="Thank you for your order!"
        subtitle="Your order has been received — keep the Order ID below to track it any time."
      />
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <Suspense fallback={<div className="h-96 animate-pulse rounded-[1.75rem] bg-card" />}>
          <OrderSuccessContent orderId={orderId} />
        </Suspense>
      </section>
    </div>
  )
}
