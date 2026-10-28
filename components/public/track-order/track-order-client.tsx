"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Copy, Loader2, MapPin, Package, Phone, Radar, Search, Truck, User, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { trackOrder } from "@/lib/services/order";
import { isErrorResult } from "@/lib/utils/result";
import { formatCurrency } from "@/lib/utils/currency";
import { PageHero } from "@/components/shared/page-hero";
import type { OrderTracking } from "@/lib/types/backend";

interface TrackOrderClientProps {
  searchParams?: Promise<{ orderId?: string }>;
}

/** Keep the loading state on screen at least this long so results ease in
 *  instead of flashing — the fetch is often faster than a blink. */
const MIN_LOADING_MS = 900;

const STEP_META: { status: string; label: string; title: string; description: string }[] = [
  {
    status: "Pending",
    label: "Placed",
    title: "Order placed",
    description: "We’ve received your order and are confirming the details.",
  },
  {
    status: "Processing",
    label: "Processing",
    title: "Being prepared",
    description: "Your items are being picked, packed and made ready to ship.",
  },
  {
    status: "Shipped",
    label: "Shipped",
    title: "On the way",
    description: "Your package has left our floor and is heading to you.",
  },
  {
    status: "Completed",
    label: "Delivered",
    title: "Delivered",
    description: "Enjoy your order! Reach out if anything isn’t right.",
  },
];

/**
 * Track order — gradient command hero with the search built in, a proper
 * animated loading experience (radar pulse + shimmer skeletons, minimum
 * duration so results ease in), a self-explanatory journey rail with step
 * titles and a current-stage explainer, then items, delivery and a
 * receipt-style summary. Public lookup by orderId; ?orderId= prefill and
 * copy-link share preserved.
 */
export function TrackOrderClient({ searchParams }: TrackOrderClientProps) {
  const [orderId, setOrderId] = useState("");
  const [result, setResult] = useState<OrderTracking | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchingId, setSearchingId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string) => {
    const id = query.trim();
    if (!id) {
      toast.info("Enter your order ID first (e.g. DEY2H7ULPD)");
      return;
    }
    const startedAt = Date.now();
    setLoading(true);
    setSearchingId(id);
    setError(null);

    let next: OrderTracking | null = null;
    let nextError: string | null = null;
    try {
      const response = await trackOrder(id);
      if (isErrorResult(response)) {
        // Never surface raw backend/API messages here — the only failure a
        // customer can act on is "not found".
        nextError = "We couldn't find an order with that ID.";
      } else if (response.data) {
        next = response.data;
      } else {
        nextError = "We couldn't find an order with that ID.";
      }
    } catch {
      nextError = "We couldn't find an order with that ID.";
    }

    // Ease-in: never flash the result faster than MIN_LOADING_MS.
    const elapsed = Date.now() - startedAt;
    if (elapsed < MIN_LOADING_MS) {
      await new Promise((resolve) => setTimeout(resolve, MIN_LOADING_MS - elapsed));
    }

    setResult(next);
    setError(nextError);
    setLoading(false);
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

  const isCancelled = result?.status === "Cancelled";
  const currentStep = result
    ? STEP_META.findIndex((s) => s.status === result.status)
    : -1;
  const activeMeta = currentStep >= 0 ? STEP_META[currentStep] : null;
  const dateFor = (status: string) =>
    result?.statusHistory.find((h) => h.status === status)?.at;

  const entrance = "animate-in fade-in slide-in-from-bottom-5 duration-500 fill-mode-both";

  return (
    <div className="bg-hero-surface">
      {/* ── Gradient command hero with inline search ──────────────── */}
      <PageHero
        eyebrow="Order tracking"
        title={<>Know exactly where<br className="sm:hidden" /> your order is</>}
        subtitle="Grab the order ID from your confirmation — it looks like DEY2H7ULPD."
      >
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex max-w-xl items-center gap-2 rounded-full bg-header-nav-foreground/5 p-1.5 ring-1 ring-header-nav-foreground/15 backdrop-blur"
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-header-nav-foreground/40" />
            <input
              value={orderId}
              onChange={(e) => setOrderId(e.target.value.toUpperCase())}
              placeholder="ENTER ORDER ID"
              aria-label="Order ID"
              className="h-11 w-full rounded-full border-0 bg-transparent pl-11 pr-4 text-sm font-bold tracking-widest text-header-nav-foreground placeholder:font-normal placeholder:tracking-normal placeholder:text-header-nav-foreground/40 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-full bg-brand px-6 text-sm font-bold text-brand-foreground transition-transform duration-300 hover:scale-[1.03] disabled:opacity-60"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
            {loading ? "Tracking…" : "Track"}
          </button>
        </form>
      </PageHero>

      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        {/* ── Empty state: guide the user before they search ──────── */}
        {!loading && !error && !result && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 rounded-[1.75rem] bg-card p-6 shadow-sm sm:p-9">
            <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
              <span className="flex size-13 shrink-0 items-center justify-center rounded-2xl bg-brand p-3.5 text-brand-foreground">
                <Search className="size-6" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  Enter your order ID to see live tracking
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  You&apos;ll see exactly where your package is, what happens next, and your
                  full payment receipt.
                </p>
              </div>
            </div>

            <div className="mt-8 space-y-5 border-t border-dashed border-border pt-7">
              {[
                {
                  title: "Find your order ID",
                  text: "It's in your order confirmation email or SMS, right next to your order summary.",
                  chip: "DEY2H7ULPD",
                },
                {
                  title: "Type it in the search above",
                  text: "Order IDs use capital letters and numbers — the box formats them for you.",
                },
                {
                  title: "Watch your order move",
                  text: "From Placed to Delivered, with dates, delivery details and the complete receipt.",
                },
              ].map((item, index) => (
                <div key={item.title} className="flex items-start gap-4">
                  <span className="text-2xl font-extrabold tabular-nums text-brand/40 sm:text-3xl">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="text-sm font-bold uppercase tracking-wide text-foreground">
                      {item.title}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
                    {item.chip && (
                      <span className="mt-2 inline-block rounded-lg bg-muted px-3 py-1.5 text-xs font-bold tracking-[0.2em] text-foreground">
                        {item.chip}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Loading: radar + shimmer, eased in ──────────────────── */}
        {loading && (
          <div className="space-y-5">
            <div className="rounded-[1.75rem] bg-card p-8 text-center shadow-sm">
              <span className="relative mx-auto flex size-14 items-center justify-center">
                <span aria-hidden="true" className="absolute inset-0 animate-ping rounded-full bg-brand/25" />
                <span aria-hidden="true" className="absolute inset-0 animate-pulse rounded-full bg-brand/15" />
                <span className="relative flex size-14 items-center justify-center rounded-full bg-brand text-brand-foreground">
                  <Radar className="size-6 animate-spin [animation-duration:2.5s]" />
                </span>
              </span>
              <p className="mt-5 text-sm font-bold uppercase tracking-widest text-foreground">
                Tracking {searchingId}
              </p>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Checking the latest status and delivery updates…
              </p>
              {/* indeterminate shimmer bar */}
              <span className="mx-auto mt-6 block h-1.5 w-48 overflow-hidden rounded-full bg-muted">
                <span className="block h-full w-1/2 animate-[shimmer-slide_1.2s_ease-in-out_infinite] rounded-full bg-brand" />
              </span>
            </div>
            <div className="h-28 animate-pulse rounded-[1.75rem] bg-card/70 [animation-delay:150ms]" />
            <div className="h-44 animate-pulse rounded-[1.75rem] bg-card/70 [animation-delay:300ms]" />
          </div>
        )}

        {/* ── Error ────────────────────────────────────────────────── */}
        {error && !loading && (
          <div className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-header-nav via-header-nav to-destructive/40 px-6 py-12 text-center">
            <span className="relative mx-auto flex size-12 items-center justify-center rounded-2xl bg-destructive/20 text-destructive">
              <X className="size-6" />
            </span>
            <p className="relative mt-5 text-base font-bold text-header-nav-foreground">{error}</p>
            <p className="relative mt-1.5 text-sm text-header-nav-foreground/50">
              It looks like DEY2H7ULPD — check your confirmation and try again.
            </p>
            <button
              onClick={() => search(orderId)}
              className="relative mt-7 cursor-pointer rounded-full bg-brand px-8 py-3 text-sm font-bold text-brand-foreground transition-transform duration-300 hover:scale-[1.03]"
            >
              Try again
            </button>
          </div>
        )}

        {/* ── Result ───────────────────────────────────────────────── */}
        {result && !loading && (
          <div className="space-y-5">
            {/* Order header */}
            <div
              className={cn(entrance, "rounded-[1.75rem] bg-card p-6 shadow-sm sm:p-8")}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
                    Order
                  </p>
                  <p className="mt-1 text-xl font-extrabold tracking-widest text-foreground">
                    {result.orderId}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "inline-block rounded-full px-3 py-1.5 text-xs font-bold",
                      isCancelled
                        ? "bg-destructive/15 text-destructive"
                        : "bg-success/15 text-success"
                    )}
                  >
                    {isCancelled ? "Cancelled" : activeMeta?.title}
                  </span>
                  <span
                    className={cn(
                      "inline-block rounded-full px-3 py-1.5 text-xs font-bold",
                      result.paymentStatus === "Paid" && "bg-success/15 text-success",
                      result.paymentStatus === "Pending" && "bg-warning/20 text-warning-foreground",
                      result.paymentStatus === "Failed" && "bg-destructive/15 text-destructive"
                    )}
                  >
                    Payment: {result.paymentStatus}
                  </span>
                  <button
                    onClick={copyShareLink}
                    className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border border-border px-3 text-xs font-semibold text-muted-foreground transition-colors hover:border-brand hover:text-brand"
                  >
                    <Copy className="size-3.5" /> Copy link
                  </button>
                </div>
              </div>
              <p className="mt-5 border-t border-dashed border-border pt-4 text-xs text-muted-foreground">
                Placed {new Date(result.createdAt).toLocaleString()} · by {result.placedBy || "Guest"} ·{" "}
                {result.paymentMethod}
                {result.paymentProvider ? ` via ${result.paymentProvider}` : ""}
              </p>
            </div>

            {/* Journey rail with explanatory titles */}
            <div
              className={cn(entrance, "rounded-[1.75rem] bg-card p-6 shadow-sm sm:p-8")}
              style={{ animationDelay: "90ms" }}
            >
              <h2 className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
                Delivery progress
              </h2>

              <div className="mt-7 overflow-x-auto pb-1">
                <ol className="flex min-w-[560px] items-start">
                  {STEP_META.map((step, index) => {
                    const isPast = currentStep >= 0 && index < currentStep;
                    const isCurrent = index === currentStep;
                    const stepDate = dateFor(step.status);
                    return (
                      <li key={step.status} className={cn("flex-1", index < STEP_META.length - 1 && "relative pr-2")}>
                        {index < STEP_META.length - 1 && (
                          <span
                            aria-hidden="true"
                            className={cn(
                              "absolute left-11 right-1 top-[22px] h-0.5 rounded-full",
                              isPast ? "bg-brand" : "bg-border"
                            )}
                          />
                        )}
                        <span
                          className={cn(
                            "relative z-10 flex size-11 items-center justify-center rounded-full border-2",
                            isPast && "border-brand bg-brand text-brand-foreground",
                            isCurrent && !isCancelled && "border-brand bg-card text-brand",
                            !isPast && !isCurrent && "border-border bg-card text-muted-foreground/40"
                          )}
                        >
                          {isPast ? (
                            <Check className="size-5" strokeWidth={3} />
                          ) : isCurrent && !isCancelled ? (
                            <Truck className="size-4.5" strokeWidth={2} />
                          ) : (
                            <span className="size-2.5 rounded-full bg-muted-foreground/25" />
                          )}
                          {isCurrent && !isCancelled && (
                            <span aria-hidden="true" className="absolute inset-0 animate-ping rounded-full border-2 border-brand/50" />
                          )}
                        </span>
                        <p
                          className={cn(
                            "mt-3 text-xs font-bold uppercase tracking-wide",
                            isCurrent && !isCancelled
                              ? "text-brand"
                              : isPast
                                ? "text-foreground"
                                : "text-muted-foreground/60"
                          )}
                        >
                          {step.label}
                        </p>
                        <p className="mt-0.5 text-[11px] tabular-nums text-muted-foreground">
                          {stepDate ? new Date(stepDate).toLocaleDateString() : "—"}
                        </p>
                      </li>
                    );
                  })}
                </ol>
              </div>

              {/* Current-stage explainer — answers "what does this status mean?" */}
              {isCancelled ? (
                <div className="mt-7 rounded-2xl border-l-4 border-destructive bg-destructive/5 p-5">
                  <p className="text-sm font-bold text-destructive">This order was cancelled</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    The order is no longer active
                    {dateFor("Cancelled") && `, cancelled on ${new Date(dateFor("Cancelled")!).toLocaleString()}`}.
                    If you believe this is a mistake, contact support with your order ID.
                  </p>
                </div>
              ) : (
                activeMeta && (
                  <div className="mt-7 rounded-2xl border-l-4 border-brand bg-brand/5 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-bold text-foreground">
                        Current status — {activeMeta.title}
                      </p>
                      {dateFor(activeMeta.status) && (
                        <p className="text-xs font-semibold tabular-nums text-muted-foreground">
                          since {new Date(dateFor(activeMeta.status)!).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {activeMeta.description}
                    </p>
                  </div>
                )
              )}
            </div>

            <div className="grid gap-5 lg:grid-cols-5">
              {/* Items + delivery */}
              <div className="space-y-5 lg:col-span-3">
                <div
                  className={cn(entrance, "rounded-[1.75rem] bg-card p-6 shadow-sm sm:p-8")}
                  style={{ animationDelay: "180ms" }}
                >
                  <h2 className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
                    Items · {result.products.length}
                  </h2>
                  <ul className="mt-5 space-y-5">
                    {result.products.map((product) => (
                      <li
                        key={`${product.productId}-${product.variant?.sku ?? ""}`}
                        className="flex items-center gap-3"
                      >
                        <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-muted">
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
                            <p className="mt-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                              {product.variant.sku}
                            </p>
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

                <div
                  className={cn(entrance, "rounded-[1.75rem] bg-card p-6 shadow-sm sm:p-8")}
                  style={{ animationDelay: "270ms" }}
                >
                  <h2 className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
                    Delivery
                  </h2>
                  <ul className="mt-5 space-y-4 text-sm">
                    <li className="flex items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <User className="size-4 text-foreground" strokeWidth={1.5} />
                      </span>
                      <span className="font-semibold text-foreground">{result.recipientName}</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <Phone className="size-4 text-foreground" strokeWidth={1.5} />
                      </span>
                      <span className="font-semibold text-foreground">{result.phoneNo}</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <MapPin className="size-4 text-foreground" strokeWidth={1.5} />
                      </span>
                      <span className="text-muted-foreground">{result.shippingAddress}</span>
                    </li>
                  </ul>
                  {result.notes && (
                    <p className="mt-4 rounded-xl bg-muted/60 p-3 text-xs italic text-muted-foreground">
                      “{result.notes}”
                    </p>
                  )}
                </div>
              </div>

              {/* Receipt */}
              <div className="lg:col-span-2">
                <div
                  className={cn(entrance, "relative rounded-[1.75rem] bg-card p-6 shadow-sm sm:p-8")}
                  style={{ animationDelay: "360ms" }}
                >
                  <div aria-hidden="true" className="absolute inset-x-8 top-0 h-px bg-border" />
                  <h2 className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
                    Receipt
                  </h2>
                  <dl className="mt-5 space-y-3.5 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Subtotal</dt>
                      <dd className="font-semibold tabular-nums text-foreground">
                        {formatCurrency(result.totalAmount, result.currency)}
                      </dd>
                    </div>
                    {result.offerDiscount > 0 && (
                      <div className="flex justify-between border-t border-dashed border-border pt-3.5">
                        <dt className="text-muted-foreground">Offer discount</dt>
                        <dd className="font-semibold tabular-nums text-success">
                          −{formatCurrency(result.offerDiscount, result.currency)}
                        </dd>
                      </div>
                    )}
                    {result.discount > 0 && (
                      <div className="flex justify-between border-t border-dashed border-border pt-3.5">
                        <dt className="text-muted-foreground">Coupon</dt>
                        <dd className="font-semibold tabular-nums text-success">
                          −{formatCurrency(result.discount, result.currency)}
                        </dd>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-dashed border-border pt-3.5">
                      <dt className="text-muted-foreground">Delivery</dt>
                      <dd className="font-semibold tabular-nums text-foreground">
                        {formatCurrency(result.deliveryCharge, result.currency)}
                      </dd>
                    </div>
                    <div className="flex items-baseline justify-between border-t-2 border-header-nav/20 pt-4">
                      <dt className="text-xs font-bold uppercase tracking-wide text-foreground">Total</dt>
                      <dd className="text-2xl font-extrabold tabular-nums text-brand">
                        {formatCurrency(result.finalAmount, result.currency)}
                      </dd>
                    </div>
                  </dl>
                  <p className="mt-5 rounded-xl bg-muted/60 px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {result.paymentStatus === "Paid"
                      ? "✓ Paid — thank you!"
                      : result.paymentStatus === "Failed"
                        ? "Payment failed"
                        : "Payment pending"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
