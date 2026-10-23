"use client";

import { useCallback, useEffect, useState } from "react";
import { Copy, Loader2, MapPin, Package, Phone, Search, User } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { trackOrder } from "@/lib/services/order";
import { isErrorResult } from "@/lib/utils/result";
import { formatCurrency } from "@/lib/utils/currency";
import type { OrderTracking } from "@/lib/types/backend";

interface TrackOrderClientProps {
  searchParams?: Promise<{ orderId?: string }>;
}

/** Light status pills matching the dashboard overview. */
const STATUS_STYLES: Record<string, string> = {
  Completed: "bg-success/15 text-success",
  Shipped: "bg-info/15 text-info",
  Processing: "bg-warning/20 text-warning-foreground",
  Pending: "bg-warning/20 text-warning-foreground",
  Cancelled: "bg-destructive/15 text-destructive",
};

const PAYMENT_STYLES: Record<string, string> = {
  Paid: "bg-success/15 text-success",
  Pending: "bg-warning/20 text-warning-foreground",
  Failed: "bg-destructive/15 text-destructive",
};

function StatusPill({ label, styles }: { label: string; styles: Record<string, string> }) {
  return (
    <span
      className={cn(
        "inline-block rounded-full px-2.5 py-1 text-xs font-semibold",
        styles[label] ?? "bg-muted text-muted-foreground"
      )}
    >
      {label}
    </span>
  );
}

/**
 * Track order page in the Nittonova tone: cream surface, a pill search card,
 * and — once an order is found — a status timeline, payment summary with
 * discounts, items list, and delivery details in white rounded cards.
 * Public: looks up the human-friendly orderId (e.g. DEY2H7ULPD).
 */
export function TrackOrderClient({ searchParams }: TrackOrderClientProps) {
  const [orderId, setOrderId] = useState("");
  const [result, setResult] = useState<OrderTracking | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string) => {
    const id = query.trim();
    if (!id) {
      toast.info("Enter your order ID first (e.g. DEY2H7ULPD)");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await trackOrder(id);
      if (isErrorResult(response)) {
        setResult(null);
        setError(response.message || "Order not found. Check the ID and try again.");
      } else if (response.data) {
        setResult(response.data);
      } else {
        setResult(null);
        setError("Order not found. Check the ID and try again.");
      }
    } catch {
      setResult(null);
      setError("Something went wrong while tracking. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  // When arriving with ?orderId=..., prefill the input and search once.
  useEffect(() => {
    if (!searchParams) return;
    searchParams.then((params) => {
      const id = params.orderId?.trim();
      if (id) {
        setOrderId(id);
        search(id);
      }
    });
  }, [searchParams, search]);

  function copyShareLink() {
    if (!result) return;
    const url = `${window.location.origin}/track-order?orderId=${encodeURIComponent(result.orderId)}`;
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success("Tracking link copied"))
      .catch(() => toast.error("Could not copy the link"));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    search(orderId);
  }

  return (
    <div className="bg-hero-surface">
      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        {/* Heading */}
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">Track Order</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Where&apos;s my order?
          </h1>
          <span className="mx-auto mt-4 block h-1 w-14 rounded-full bg-brand" aria-hidden="true" />
          <p className="mx-auto mt-5 max-w-md text-[15px] text-muted-foreground">
            Enter the order ID from your confirmation (e.g. DEY2H7ULPD) to see the latest status
            and delivery updates.
          </p>
        </div>

        {/* Search card */}
        <form onSubmit={handleSubmit} className="mt-8 flex items-center gap-2 rounded-2xl bg-card p-2.5 shadow-sm sm:p-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={orderId}
              onChange={(e) => setOrderId(e.target.value.toUpperCase())}
              placeholder="Enter order ID"
              aria-label="Order ID"
              className="h-11 w-full rounded-xl border-0 bg-muted pl-11 pr-4 text-sm font-semibold tracking-wide text-foreground placeholder:font-normal placeholder:tracking-normal placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring/25"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-xl bg-brand px-5 text-sm font-bold text-brand-foreground transition-colors hover:bg-brand/90 disabled:opacity-60 sm:px-7"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
            <span className="hidden sm:inline">{loading ? "Tracking…" : "Track"}</span>
          </button>
        </form>

        {/* Loading */}
        {loading && (
          <div className="mt-6 space-y-4">
            <div className="h-28 animate-pulse rounded-2xl bg-card/70" />
            <div className="h-44 animate-pulse rounded-2xl bg-card/70" />
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center">
            <p className="text-sm font-semibold text-destructive">{error}</p>
            <button
              onClick={() => search(orderId)}
              className="mt-4 cursor-pointer rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-brand-foreground transition-colors hover:bg-brand/90"
            >
              Try again
            </button>
          </div>
        )}

        {/* Result */}
        {result && !loading && (
          <div className="mt-6 space-y-5">
            {/* Summary header */}
            <div className="rounded-2xl bg-card p-5 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Order
                  </p>
                  <p className="text-lg font-extrabold tracking-wide text-foreground">
                    {result.orderId}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Placed {new Date(result.createdAt).toLocaleString()} · by {result.placedBy || "Guest"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill label={result.status} styles={STATUS_STYLES} />
                  <StatusPill label={result.paymentStatus} styles={PAYMENT_STYLES} />
                  <button
                    onClick={copyShareLink}
                    className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border border-border px-3 text-xs font-semibold text-muted-foreground transition-colors hover:border-brand hover:text-brand"
                  >
                    <Copy className="size-3.5" /> Copy link
                  </button>
                </div>
              </div>
            </div>

            {/* Status timeline */}
            <div className="rounded-2xl bg-card p-5 shadow-sm sm:p-6">
              <h2 className="text-sm font-bold uppercase tracking-widest text-foreground">Progress</h2>
              <ol className="mt-5 space-y-0">
                {[...result.statusHistory].reverse().map((entry, index) => {
                  const isLatest = index === 0;
                  return (
                    <li key={`${entry.status}-${entry.at}`} className="relative flex gap-4 pb-6 last:pb-0">
                      {index !== result.statusHistory.length - 1 && (
                        <span
                          aria-hidden="true"
                          className={cn(
                            "absolute left-[7px] top-5 h-full w-0.5",
                            isLatest ? "bg-border" : "bg-border/60"
                          )}
                        />
                      )}
                      <span
                        className={cn(
                          "relative z-10 mt-1 size-4 shrink-0 rounded-full border-2",
                          isLatest
                            ? "border-brand bg-brand"
                            : "border-border bg-card"
                        )}
                      />
                      <div className="min-w-0">
                        <p
                          className={cn(
                            "text-sm font-bold",
                            isLatest ? "text-foreground" : "text-muted-foreground"
                          )}
                        >
                          {entry.status}
                          {isLatest && (
                            <span className="ml-2 rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand">
                              Latest
                            </span>
                          )}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {new Date(entry.at).toLocaleString()}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>

            {/* Payment summary */}
            <div className="rounded-2xl bg-card p-5 shadow-sm sm:p-6">
              <h2 className="text-sm font-bold uppercase tracking-widest text-foreground">Payment Summary</h2>
              <dl className="mt-4 space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd className="font-semibold tabular-nums text-foreground">
                    {formatCurrency(result.totalAmount, result.currency)}
                  </dd>
                </div>
                {result.offerDiscount > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Offer discount</dt>
                    <dd className="font-semibold tabular-nums text-success">
                      −{formatCurrency(result.offerDiscount, result.currency)}
                    </dd>
                  </div>
                )}
                {result.discount > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Coupon discount</dt>
                    <dd className="font-semibold tabular-nums text-success">
                      −{formatCurrency(result.discount, result.currency)}
                    </dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Delivery charge</dt>
                  <dd className="font-semibold tabular-nums text-foreground">
                    {formatCurrency(result.deliveryCharge, result.currency)}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-border/60 pt-3">
                  <dt className="font-bold text-foreground">Total ({result.paymentMethod})</dt>
                  <dd className="text-lg font-extrabold tabular-nums text-brand">
                    {formatCurrency(result.finalAmount, result.currency)}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Items */}
            <div className="rounded-2xl bg-card p-5 shadow-sm sm:p-6">
              <h2 className="text-sm font-bold uppercase tracking-widest text-foreground">
                Items ({result.products.length})
              </h2>
              <ul className="mt-4 space-y-4">
                {result.products.map((product) => (
                  <li key={`${product.productId}-${product.variant?.sku ?? ""}`} className="flex items-center gap-3">
                    <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted">
                      {product.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={product.image} alt={product.name} className="size-full object-contain" />
                      ) : (
                        <Package className="size-5 text-muted-foreground/50" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-foreground">{product.name}</p>
                      {product.variant?.sku && (
                        <p className="mt-0.5 text-xs text-muted-foreground">SKU: {product.variant.sku}</p>
                      )}
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {product.quantity} × {formatCurrency(product.unitPrice, result.currency)}
                      </p>
                    </div>
                    <p className="text-sm font-semibold tabular-nums text-foreground">
                      {formatCurrency(product.total, result.currency)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            {/* Delivery */}
            <div className="rounded-2xl bg-card p-5 shadow-sm sm:p-6">
              <h2 className="text-sm font-bold uppercase tracking-widest text-foreground">Delivery</h2>
              <ul className="mt-4 space-y-4 text-sm">
                <li className="flex items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <User className="size-4 text-foreground" strokeWidth={1.5} />
                  </span>
                  <span className="font-semibold text-foreground">{result.recipientName}</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Phone className="size-4 text-foreground" strokeWidth={1.5} />
                  </span>
                  <span className="font-semibold text-foreground">{result.phoneNo}</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <MapPin className="size-4 text-foreground" strokeWidth={1.5} />
                  </span>
                  <span className="text-muted-foreground">{result.shippingAddress}</span>
                </li>
              </ul>
              {result.notes && (
                <p className="mt-4 rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">
                  Note: {result.notes}
                </p>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
