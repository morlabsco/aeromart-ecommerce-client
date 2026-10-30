import { Clock, PackageCheck, ShoppingBag, XCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";
import { paymentMethodLabel } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/shared/order-status-badge";
import type { Order, User } from "@/lib/types/backend";

/* ---------------------------------------------------------------------------
 * Dashboard v4 customer overview — the Nittonova dashboard design language
 * applied to the customer's home: a welcome bar, four stat cards (matching
 * the admin overview's card style) and a recent orders list card.
 * ------------------------------------------------------------------------- */

export function CustomerOverviewV4({
    profile,
    orders,
    brandCurrency = "usd",
}: {
    profile: User | null;
    orders: Order[];
    brandCurrency?: string;
}) {
    const pending = orders.filter(
        (o) => o.status === "Pending" && o.paymentStatus !== "Paid",
    ).length;
    const inProgress = orders.filter((o) => o.status === "Processing" || o.status === "Shipped").length;
    const cancelled = orders.filter((o) => o.status === "Cancelled").length;
    const spent = orders
        .filter((o) => o.status !== "Cancelled")
        .reduce((sum, o) => sum + (o.finalAmount ?? 0), 0);

    const firstName = (profile?.name ?? "there").split(" ")[0];

    const cards = [
        {
            label: "Total Orders",
            value: String(orders.length),
            icon: ShoppingBag,
            chip: { text: "all time", tone: "info" as const },
        },
        {
            label: "Pending Payment",
            value: String(pending),
            icon: Clock,
            chip: { text: "awaiting payment", tone: "warning" as const },
        },
        {
            label: "In Progress",
            value: String(inProgress),
            icon: PackageCheck,
            chip: { text: "on the way", tone: "success" as const },
        },
        {
            label: "Cancelled",
            value: String(cancelled),
            icon: XCircle,
            chip: { text: "closed", tone: "info" as const },
        },
    ];

    const recent = orders.slice(0, 6);

    return (
        <div className="space-y-6">
            {/* ── Welcome bar ── */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-card p-6 shadow-sm">
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-foreground">
                        Hello, {firstName} 👋
                    </h2>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        {orders.length > 0
                            ? `You have placed ${orders.length} order${orders.length === 1 ? "" : "s"} · ${formatCurrency(spent, brandCurrency)} in total.`
                            : "Your orders will appear here once you start shopping."}
                    </p>
                </div>
            </div>

            {/* ── Stat cards ── */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {cards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <div
                            key={card.label}
                            className="rounded-xl border border-border/60 bg-card p-5 shadow-sm"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <Icon className="size-7 text-brand" strokeWidth={1.8} />
                                <span
                                    className={cn(
                                        "rounded-full px-2 py-0.5 text-[11px] font-bold",
                                        card.chip.tone === "success" && "bg-success/15 text-success",
                                        card.chip.tone === "warning" && "bg-warning/15 text-warning-foreground",
                                        card.chip.tone === "info" && "bg-info/15 text-info",
                                    )}
                                >
                                    {card.chip.text}
                                </span>
                            </div>
                            <p className="mt-4 text-2xl font-extrabold tabular-nums tracking-tight text-foreground">
                                {card.value}
                            </p>
                            <p className="mt-0.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                {card.label}
                            </p>
                        </div>
                    );
                })}
            </div>

            {/* ── Recent orders ── */}
            <section className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
                <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
                    <h3 className="text-base font-bold text-foreground">
                        Recent Orders
                    </h3>
                </div>
                {recent.length === 0 ? (
                    <p className="px-5 py-10 text-center text-sm text-muted-foreground">
                        No orders yet — your first order will show up here.
                    </p>
                ) : (
                    <ul className="divide-y divide-border/40">
                        {recent.map((order) => (
                            <li
                                key={order._id}
                                className="flex flex-wrap items-center gap-3 px-5 py-4 transition-colors hover:bg-muted/40"
                            >
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-bold text-foreground">
                                        {order.orderId}
                                    </p>
                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                        {new Date(order.createdAt).toLocaleDateString("en-GB", {
                                            day: "numeric",
                                            month: "short",
                                            year: "numeric",
                                        })}{" "}
                                        · {paymentMethodLabel(order.paymentMethod)} ·{" "}
                                        {order.products?.length ?? 0} item
                                        {(order.products?.length ?? 0) === 1 ? "" : "s"}
                                    </p>
                                </div>
                                <OrderStatusBadge status={order.status} />
                                <span className="w-24 text-right text-sm font-extrabold tabular-nums text-brand">
                                    {formatCurrency(order.finalAmount, brandCurrency)}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}
