import Link from "next/link";
import {
    Activity as ActivityIcon,
    ArrowUpRight,
    Box,
    Package,
    ShoppingCart,
    Users,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";
import { paymentMethodLabel } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import type { MetaData, Order } from "@/lib/types/backend";
import { DashboardOverviewCharts } from "./overview-charts";

/* ---------------------------------------------------------------------------
 * Dashboard v4 overview — Nittonova dashboard reference: four stat cards with
 * icon tiles, honest trend chips and mini bar sparklines, the "Sales
 * overview" monthly bar chart and a "Recent activity" transaction list.
 * Everything is pure CSS/SVG — no chart library.
 * ------------------------------------------------------------------------- */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Sums finalAmount per calendar month of the CURRENT year. */
function monthlyTotals(orders: Order[]): number[] {
    const year = new Date().getFullYear();
    const totals = new Array(12).fill(0) as number[];
    for (const order of orders) {
        const date = new Date(order.createdAt);
        if (date.getFullYear() === year) {
            totals[date.getMonth()] += order.finalAmount ?? 0;
        }
    }
    return totals;
}

/** Counts orders per calendar month of the CURRENT year. */
function monthlyCounts(orders: Order[]): number[] {
    const year = new Date().getFullYear();
    const counts = new Array(12).fill(0) as number[];
    for (const order of orders) {
        const date = new Date(order.createdAt);
        if (date.getFullYear() === year) {
            counts[date.getMonth()] += 1;
        }
    }
    return counts;
}

/** Tiny bar sparkline (reference: mixed orange bars under each stat). */
function Sparkline({ values, className }: { values: number[]; className?: string }) {
    const max = Math.max(...values, 1);
    return (
        <div className={cn("flex h-8 items-end gap-1", className)} aria-hidden="true">
            {values.map((value, i) => (
                <span
                    key={i}
                    className={cn(
                        "w-full rounded-t-[2px]",
                        i === values.length - 1 ? "bg-brand" : "bg-brand/35",
                    )}
                    style={{ height: `${Math.max(12, (value / max) * 100)}%` }}
                />
            ))}
        </div>
    );
}

interface StatCardProps {
    label: string;
    value: string;
    icon: typeof Package;
    chip: { text: string; tone: "success" | "warning" | "info" };
    /** Real monthly series only — cards without derivable data show a
     * context line instead of a fabricated sparkline. */
    spark?: number[];
    note?: string;
}

function StatCard({ label, value, icon: Icon, chip, spark, note }: StatCardProps) {
    return (
        <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <Icon className="size-7 text-brand" strokeWidth={1.8} />
                <span
                    className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold",
                        chip.tone === "success" && "bg-success/15 text-success",
                        chip.tone === "warning" && "bg-warning/15 text-warning-foreground",
                        chip.tone === "info" && "bg-info/15 text-info",
                    )}
                >
                    {chip.tone === "success" && <ArrowUpRight className="size-3" />}
                    {chip.text}
                </span>
            </div>
            <p className="mt-4 text-2xl font-extrabold tabular-nums tracking-tight text-foreground">
                {value}
            </p>
            <p className="mt-0.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {label}
            </p>
            {spark ? (
                <Sparkline values={spark} className="mt-3" />
            ) : (
                note && (
                    <p className="mt-3 text-xs text-muted-foreground">{note}</p>
                )
            )}
        </div>
    );
}

export function DashboardOverviewV4({
    meta,
    orders,
    brandCurrency = "usd",
}: {
    meta: MetaData | null;
    orders: Order[];
    brandCurrency?: string;
}) {
    const months = monthlyTotals(orders);
    const maxMonth = Math.max(...months, 1);
    // "Nice" y-axis max (round up to a clean multiple of 4 steps).
    const step = niceStep(maxMonth / 4);
    const yMax = step * 4;

    const paidOrders = orders.filter((o) => o.paymentStatus === "Paid");
    const paidThisWeek = paidOrders.filter(
        (o) => Date.now() - new Date(o.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000,
    );

    const cards: StatCardProps[] = [
        {
            label: "Total Orders",
            value: String(meta?.totalOrders ?? orders.length),
            icon: ShoppingCart,
            chip: { text: `+${meta?.recentOrders ?? 0} this week`, tone: "success" },
            spark: monthlyCounts(orders),
        },
        {
            label: "Revenue (Paid)",
            value: formatCurrency(meta?.totalRevenue ?? 0, brandCurrency),
            icon: Box,
            chip: { text: `${paidThisWeek.length} paid this week`, tone: "success" },
            spark: monthlyTotals(paidOrders),
        },
        {
            label: "Products",
            value: String(meta?.totalProducts ?? 0),
            icon: Package,
            chip: {
                text: `${meta?.lowStockProducts ?? 0} low stock`,
                tone: (meta?.lowStockProducts ?? 0) > 0 ? "warning" : "info",
            },
            note: `${meta?.totalCategories ?? 0} categories · ${meta?.totalBrands ?? 0} brands`,
        },
        {
            label: "Customers",
            value: String(meta?.totalUsers ?? 0),
            icon: Users,
            chip: { text: `${meta?.totalReviews ?? 0} reviews`, tone: "info" },
            note: `${orders.length} recent orders tracked here`,
        },
    ];

    const recent = [...orders]
        .sort(
            (a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, 6);

    return (
        <div className="space-y-6">
            {/* ── Stat cards ── */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {cards.map((card) => (
                    <StatCard key={card.label} {...card} />
                ))}
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                {/* ── Sales overview chart ── */}
                <section className="rounded-xl border border-border/60 bg-card p-5 shadow-sm sm:p-6 xl:col-span-2">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-base font-bold text-foreground">
                                Sales overview
                            </h2>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                Order value per month · {new Date().getFullYear()}
                            </p>
                        </div>
                        <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-bold text-brand">
                            {formatCurrency(
                                months.reduce((sum, v) => sum + v, 0),
                                brandCurrency,
                            )}{" "}
                            this year
                        </span>
                    </div>

                    <div className="mt-6 flex h-56 gap-3 sm:h-64">
                        {/* y grid */}
                        <div className="flex w-14 shrink-0 flex-col justify-between pb-6 text-right text-[10px] font-medium tabular-nums text-muted-foreground/70">
                            {[4, 3, 2, 1, 0].map((n) => (
                                <span key={n}>{compactCurrency(n * step, brandCurrency)}</span>
                            ))}
                        </div>
                        <div className="relative flex-1">
                            {[4, 3, 2, 1, 0].map((n) => (
                                <span
                                    key={n}
                                    aria-hidden="true"
                                    className="absolute inset-x-0 border-t border-dashed border-border/70"
                                    style={{ top: `${(n / 4) * 100}%` }}
                                />
                            ))}
                            <div className="absolute inset-0 flex items-end gap-1.5 pb-6 sm:gap-2">
                                {months.map((value, i) => (
                                    <div
                                        key={i}
                                        className="group relative flex h-full flex-1 items-end"
                                        title={`${MONTHS[i]}: ${formatCurrency(value, brandCurrency)}`}
                                    >
                                        <span
                                            className={cn(
                                                "w-full rounded-t-md transition-colors",
                                                value > 0
                                                    ? "bg-brand group-hover:bg-brand/80"
                                                    : "bg-muted",
                                            )}
                                            style={{
                                                height: `${Math.min(100, (value / yMax) * 100)}%`,
                                                minHeight: value > 0 ? 4 : 2,
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                            {/* x labels */}
                            <div className="absolute inset-x-0 bottom-0 flex gap-1.5 sm:gap-2">
                                {MONTHS.map((m) => (
                                    <span
                                        key={m}
                                        className="flex-1 truncate text-center text-[10px] font-medium text-muted-foreground/70"
                                    >
                                        {m}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Recent activity ── */}
                <section className="flex flex-col rounded-xl border border-border/60 bg-card p-5 shadow-sm sm:p-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-base font-bold text-foreground">
                            Recent activity
                        </h2>
                        <Link
                            href="/dashboard/admin/orders/all-orders"
                            className="text-xs font-bold text-brand transition-colors hover:text-brand/80"
                        >
                            See all
                        </Link>
                    </div>
                    <ul className="mt-5 flex-1 space-y-4">
                        {recent.length === 0 && (
                            <li className="flex items-center gap-3 text-sm text-muted-foreground">
                                <ActivityIcon className="size-4" />
                                No orders yet.
                            </li>
                        )}
                        {recent.map((order) => {
                            const initials = (order.recipientName || "G")
                                .split(" ")
                                .map((p) => p[0])
                                .filter(Boolean)
                                .slice(0, 2)
                                .join("")
                                .toUpperCase();
                            return (
                                <li
                                    key={order._id}
                                    className="flex items-center gap-3"
                                >
                                    <span
                                        className={cn(
                                            "flex size-9 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold",
                                            order.paymentStatus === "Paid"
                                                ? "bg-success/15 text-success"
                                                : "bg-brand/10 text-brand",
                                        )}
                                    >
                                        {initials}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold text-foreground">
                                            {order.recipientName || "Guest"}
                                        </p>
                                        <p className="truncate text-xs text-muted-foreground">
                                            Order {order.orderId} ·{" "}
                                            {new Date(order.createdAt).toLocaleDateString(
                                                "en-GB",
                                                { day: "numeric", month: "short" },
                                            )}{" "}
                                            · {paymentMethodLabel(order.paymentMethod)}
                                        </p>
                                    </div>
                                    <span
                                        className={cn(
                                            "shrink-0 text-sm font-bold tabular-nums",
                                            order.paymentStatus === "Paid"
                                                ? "text-success"
                                                : "text-foreground",
                                        )}
                                    >
                                        {order.paymentStatus === "Paid" ? "+" : ""}
                                        {formatCurrency(order.finalAmount, brandCurrency)}
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                </section>
            </div>

            {/* ── Extra business charts (status donut · sales trend · payment
                methods) with range/metric switches ── */}
            <DashboardOverviewCharts orders={orders} brandCurrency={brandCurrency} />
        </div>
    );
}

/** Rounds a chart step to a clean 1/2/5×10^n value. */
function niceStep(raw: number): number {
    if (raw <= 0) return 1;
    const pow = Math.pow(10, Math.floor(Math.log10(raw)));
    for (const mult of [1, 2, 5, 10]) {
        if (mult * pow >= raw) return mult * pow;
    }
    return 10 * pow;
}

/** Compact axis labels: ৳1.2k / ৳12k / $1.2M. */
function compactCurrency(value: number, currency: string): string {
    if (value === 0) return "0";
    const symbol = currency === "bdt" ? "৳" : currency === "usd" ? "$" : "";
    if (value >= 1_000_000)
        return `${symbol}${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${symbol}${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1)}k`;
    return `${symbol}${value}`;
}
