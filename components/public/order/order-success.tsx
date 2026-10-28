"use client"

import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/utils/currency"
import { paymentMethodLabel } from "@/lib/utils/format"
import { DownloadInvoiceButton } from "@/components/shared/download-invoice-button"
import { CheckCircle2, Copy, PackageSearch, Truck } from "lucide-react"
import { toast } from "sonner"
import type { OrderTracking } from "@/lib/types/backend"

/**
 * Post-checkout order success page body: an order summary card (items,
 * totals, delivery details) beside a confirmation card (success mark,
 * thank-you copy, the copyable order ID, status pills and the Track Order /
 * invoice actions) — one column on mobile (summary first, confirmation
 * under it), two columns from lg up with the confirmation on the right.
 * Everything renders from the public tracking lookup, so the page works for
 * guests, can be shared by the order ID and reloaded any time.
 */

/** Copies text to the clipboard with toast feedback. */
async function copyText(text: string, successMessage: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(successMessage)
  } catch {
    toast.error("Couldn't copy — please copy it manually.")
  }
}

export function OrderSuccess({
  order,
  currency,
}: {
  order: OrderTracking
  /** Live brand currency from settings — wins over the order's stamped one. */
  currency?: string
}) {
  const money = currency || order.currency

  const isCod = order.paymentMethod === "COD"
  const isPaid = order.paymentStatus === "Paid"

  return (
    <div className="grid gap-5 lg:grid-cols-5">
      {/* ── Summary card (left) ── */}
      <OrderSummaryCard order={order} currency={money} />

      {/* ── Confirmation card (right) ── */}
      <div className="animate-in fade-in slide-in-from-bottom-5 duration-500 rounded-[1.75rem] bg-card p-6 text-center shadow-sm sm:p-8 lg:col-span-2 lg:self-start [animation-delay:120ms]">
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-success/15">
          <CheckCircle2 className="size-8 text-success" strokeWidth={1.8} />
        </span>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">
          Order Placed Successfully!
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          {isCod
            ? `Thank you, ${order.recipientName.split(" ")[0]}! Pay ${formatCurrency(order.finalAmount, money)} when your order arrives.`
            : isPaid
              ? `Thank you, ${order.recipientName.split(" ")[0]}! Your payment is confirmed.`
              : `Thank you, ${order.recipientName.split(" ")[0]}! We will confirm your payment shortly and start processing.`}
        </p>

        {/* Order ID — big, copyable, shareable */}
        <div className="mx-auto mt-6 flex max-w-md items-center justify-between gap-3 rounded-xl border border-brand/30 bg-brand/5 px-4 py-3">
          <div className="min-w-0 text-left">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Order ID
            </p>
            <p className="text-lg font-extrabold tracking-wider tabular-nums text-foreground">
              {order.orderId}
            </p>
          </div>
          <button
            type="button"
            onClick={() => copyText(order.orderId, "Order ID copied")}
            aria-label="Copy order ID"
            className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:border-brand hover:text-brand"
          >
            <Copy className="size-4" />
          </button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Save or share this ID — this page reopens any time from the Track
          Order page.
        </p>

        {/* Status pills — payment state is what matters right after checkout,
            so only payment + method are shown here (journey status lives on
            the Track Order page). */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <span
            className={cn(
              "rounded-full px-3 py-1 text-xs font-bold",
              isPaid
                ? "bg-success/15 text-success"
                : "bg-warning/15 text-warning"
            )}
          >
            Payment: {order.paymentStatus}
          </span>
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
            {paymentMethodLabel(order.paymentMethod)}
          </span>
        </div>

        {/* Actions — stack in the narrow column, row on wide screens */}
        <div className="mt-7 flex flex-col justify-center gap-3 xl:flex-row">
          <Link
            href={`/track-order?orderId=${encodeURIComponent(order.orderId)}`}
            target="_blank"
            rel="noopener"
            className={cn(
              buttonVariants({ variant: "brand", size: "xl" }),
              "px-8"
            )}
          >
            <Truck className="size-4" />
            Track Order
          </Link>
          <DownloadInvoiceButton
            orderId={order.id}
            label="Download Invoice"
            className="h-11 border-[1.5px] px-8 font-bold"
          />
        </div>
        <Link
          href="/products"
          className="mt-4 inline-block text-sm font-semibold text-brand transition-transform duration-300 hover:translate-x-1"
        >
          Continue Shopping →
        </Link>
      </div>
    </div>
  )
}

/**
 * Items / totals / delivery summary card, shared by the order success page
 * and the payment result pages so all of them read identically.
 */
export function OrderSummaryCard({
  order,
  currency,
}: {
  order: OrderTracking
  currency?: string
}) {
  const money = currency || order.currency

  return (
    <div className="animate-in fade-in slide-in-from-bottom-5 rounded-[1.75rem] bg-card p-6 shadow-sm duration-500 sm:p-8 lg:col-span-3">
      <h2 className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
        Order Summary
      </h2>

      <ul className="mt-5 space-y-4">
        {order.products.map((item, i) => (
          <li key={`${item.productId}-${i}`} className="flex items-center gap-3">
            <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
              {item.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.image}
                  alt={item.name}
                  className="size-full object-contain"
                />
              ) : (
                <PackageSearch className="size-5 text-muted-foreground/60" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-bold text-foreground">
                {item.name}
              </p>
              {item.variant?.attributes && (
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {Object.entries(item.variant.attributes)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(" · ")}
                </p>
              )}
              <p className="mt-0.5 text-[13px] text-muted-foreground">
                {item.quantity} × {formatCurrency(item.unitPrice, money)}
              </p>
            </div>
            <span className="text-[15px] font-bold tabular-nums text-foreground">
              {formatCurrency(item.total, money)}
            </span>
          </li>
        ))}
      </ul>

      {/* Totals */}
      <div className="mt-6 space-y-2.5 border-t border-border pt-4 text-[15px]">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span className="tabular-nums">
            {formatCurrency(order.totalAmount, money)}
          </span>
        </div>
        {order.totalDiscount > 0 && (
          <div className="flex justify-between text-success">
            <span>Discount</span>
            <span className="tabular-nums">
              −{formatCurrency(order.totalDiscount, money)}
            </span>
          </div>
        )}
        <div className="flex justify-between text-muted-foreground">
          <span>Delivery</span>
          <span className="tabular-nums">
            {order.deliveryCharge === 0
              ? "Free"
              : formatCurrency(order.deliveryCharge, money)}
          </span>
        </div>
        <div className="flex justify-between border-t border-border pt-2.5 text-lg font-extrabold text-foreground">
          <span>Total</span>
          <span className="text-brand tabular-nums">
            {formatCurrency(order.finalAmount, money)}
          </span>
        </div>
      </div>

      {/* Delivery details */}
      <div className="mt-6 rounded-xl bg-muted/40 p-4 text-[15px]">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
          Delivering to
        </p>
        <p className="mt-1.5 font-bold text-foreground">
          {order.recipientName} · {order.phoneNo}
        </p>
        <p className="mt-0.5 leading-relaxed text-muted-foreground">
          {order.shippingAddress}
        </p>
        {order.notes && (
          <p className="mt-2 text-[13px] italic text-muted-foreground">
            Notes: {order.notes}
          </p>
        )}
      </div>
    </div>
  )
}
