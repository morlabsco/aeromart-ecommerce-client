"use client";

import Link from "next/link";
import { ArrowRight, Copy, Home, XCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button"
import { OrderSummaryCard } from "@/components/public/order/order-success"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import type { OrderTracking } from "@/lib/types/backend"

interface PaymentFailedProps {
  /** The order the failed payment belongs to, when it could be resolved. */
  order: OrderTracking | null
  /** Gateway transaction id (kept for reference, copyable when present). */
  tranId?: string
  /** Live brand currency from settings — wins over the order's stamped one. */
  currency?: string
}

/**
 * Payment failed body — the /order/success design with a destructive accent:
 * the order summary card (when the order could be resolved from the
 * transaction id) beside a failed-confirmation card with the copyable
 * transaction id and recovery actions. Standalone centered card when no
 * order data is available.
 */
export function PaymentFailed({ order, tranId, currency }: PaymentFailedProps) {
  const copyTranId = async () => {
    if (!tranId) return
    try {
      await navigator.clipboard.writeText(tranId)
      toast.success("Transaction ID copied")
    } catch {
      toast.error("Couldn't copy — please copy it manually.")
    }
  }

  const failedCard = (
    <div className="animate-in fade-in slide-in-from-bottom-5 duration-500 min-w-0 rounded-[1.75rem] bg-card p-6 text-center shadow-sm sm:p-8 lg:col-span-2 lg:self-start [animation-delay:120ms]">
      <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-destructive/10">
        <XCircle className="size-8 text-destructive" strokeWidth={1.8} />
      </span>
      <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">
        Payment Failed
      </h1>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        We couldn&apos;t process your payment
        {order ? ` for order ${order.orderId}` : ""}. No money was deducted —
        try again from checkout, or choose a different payment method.
      </p>

      {tranId && (
        <div className="mx-auto mt-6 flex max-w-md items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3">
          <div className="min-w-0 text-left">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Transaction ID
            </p>
            <p className="truncate font-mono text-sm font-medium text-foreground" title={tranId}>
              {tranId}
            </p>
          </div>
          <button
            type="button"
            onClick={copyTranId}
            aria-label="Copy transaction ID"
            className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:border-brand hover:text-brand"
          >
            <Copy className="size-4" />
          </button>
        </div>
      )}

      {/* Actions — stack in the narrow column, row on wide screens */}
      <div className="mt-7 flex flex-col justify-center gap-3 xl:flex-row">
        <Link
          href="/checkout"
          className={cn(buttonVariants({ variant: "brand", size: "xl" }), "px-8")}
        >
          <ArrowRight className="size-4" />
          Back to Checkout
        </Link>
        <Link
          href="/"
          className={cn(buttonVariants({ variant: "outline", size: "xl" }), "border-[1.5px] px-8 font-bold")}
        >
          <Home className="size-4" />
          Return Home
        </Link>
      </div>
      {order && (
        <Link
          href={`/track-order?orderId=${encodeURIComponent(order.orderId)}`}
          target="_blank"
          rel="noopener"
          className="mt-4 inline-block text-sm font-semibold text-brand transition-transform duration-300 hover:translate-x-1"
        >
          Track this order →
        </Link>
      )}
    </div>
  )

  // No resolvable order — standalone centered card.
  if (!order) {
    return <div className="mx-auto max-w-md">{failedCard}</div>
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
      {/* ── Summary card (left) ── */}
      <OrderSummaryCard order={order} currency={currency} />
      {/* ── Failed confirmation card (right) ── */}
      {failedCard}
    </div>
  )
}
