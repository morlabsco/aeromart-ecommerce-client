"use client";

import { useMemo, useState } from "react";
import { formatCurrency } from "@/lib/utils/currency";
import { paymentMethodLabel } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import type { Order } from "@/lib/types/backend";

interface DashboardOverviewChartsProps {
    orders: Order[];
    brandCurrency?: string;
}

/* ---------------------------------------------------------------------------
 * Dashboard v4 — extra business charts (pure CSS/SVG, no chart library):
 *   1. Orders by status     , donut with legend counts + share
 *   2. Sales trend          , daily/weekly bars with a range (7/30 days) and
 *                              metric (revenue / orders) switch
 *   3. Payment methods      , horizontal share bars
 * All values derive from the same `orders` slice the overview already holds
 * (max ~200) — computed with useMemo so toggling a unit never re-fetches.
 * ------------------------------------------------------------------------- */

const DAY_MS = 24 * 60 * 60 * 1000;

type RangeKey = "7d" | "30d";
type MetricKey = "revenue" | "orders";

const RANGE_LABELS: Record<RangeKey, string> = { "7d": "7 days", "30d": "30 days" };
const METRIC_LABELS: Record<MetricKey, string> = {
    revenue: "Revenue",
    orders: "Orders",
};

/** Small pill toggle group (charcoal active chip, matches the v4 selects). */
function ChartToggle<T extends string>({
    value,
    options,
    onChange,
    ariaLabel,
}: {
    value: T;
    options: { key: T; label: string }[];
    onChange: (key: T) => void;
    ariaLabel: string;
}) {
    return (
        <div
            role="group"
            aria-label={ariaLabel}
            className="flex gap-1 rounded-lg bg-muted p-1"
        >
            {options.map((option) => (
                <button
                    key={option.key}
                    type="button"
                    onClick={() => onChange(option.key)}
                    aria-pressed={value === option.key}
                    className={cn(
                        "cursor-pointer rounded-md px-2.5 py-1 text-[11px] font-bold transition-colors",
                        value === option.key
                            ? "bg-header-nav text-header-nav-foreground"
                            : "text-muted-foreground hover:text-foreground",
                    )}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
}

/* ── 1. Orders by status donut ─────────────────────────────────────────── */

const STATUS_SLICES = [
    { status: "Pending", className: "text-warning", stroke: "stroke-warning" },
    { status: "Processing", className: "text-info", stroke: "stroke-info" },
    { status: "Shipped", className: "text-brand", stroke: "stroke-brand" },
    { status: "Completed", className: "text-success", stroke: "stroke-success" },
    { status: "Cancelled", className: "text-destructive", stroke: "stroke-destructive" },
];

function StatusDonut({ orders }: { orders: Order[] }) {
    const total = orders.length;
    const counts = STATUS_SLICES.map((slice) => ({
        ...slice,
        count: orders.filter((o) => o.status === slice.status).length,
    }));

    // Donut geometry: circumference fractions on a 42-radius ring.
    const R = 42;
    const CIRC = 2 * Math.PI * R;
    let offset = 0;

    return (
        <section className="flex flex-col rounded-xl border border-border/60 bg-card p-5 shadow-sm sm:p-6">
            <h2 className="text-base font-bold text-foreground">Orders by status</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
                Every order in the tracked window
            </p>

            <div className="mt-4 flex flex-col items-center gap-5 sm:flex-row sm:gap-6">
                <div className="relative shrink-0">
                    <svg viewBox="0 0 100 100" className="size-36 -rotate-90">
                        <circle
                            cx="50" cy="50" r={R}
                            fill="none" strokeWidth="12"
                            className="stroke-muted"
                        />
                        {total > 0 &&
                            counts.map((slice) => {
                                if (slice.count === 0) return null;
                                const fraction = slice.count / total;
                                const dash = fraction * CIRC;
                                const el = (
                                    <circle
                                        key={slice.status}
                                        cx="50" cy="50" r={R}
                                        fill="none"
                                        strokeWidth="12"
                                        strokeLinecap="butt"
                                        strokeDasharray={`${dash} ${CIRC - dash}`}
                                        strokeDashoffset={-offset}
                                        className={cn(slice.stroke, "transition-[stroke-dasharray] duration-500")}
                                    >
                                        <title>{`${slice.status}: ${slice.count}`}</title>
                                    </circle>
                                );
                                offset += dash;
                                return el;
                            })}
                    </svg>
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-extrabold tabular-nums text-foreground">
                            {total}
                        </span>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            orders
                        </span>
                    </div>
                </div>

                <ul className="w-full min-w-0 space-y-2">
                    {counts.map((slice) => (
                        <li
                            key={slice.status}
                            className="flex items-center gap-2 text-sm"
                        >
                            <span
                                aria-hidden="true"
                                className={cn("size-2.5 shrink-0 rounded-full bg-current", slice.className)}
                            />
                            <span className="min-w-0 flex-1 truncate text-foreground">
                                {slice.status}
                            </span>
                            <span className="shrink-0 font-semibold tabular-nums text-foreground">
                                {slice.count}
                            </span>
                            <span className="w-10 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                                {total > 0 ? Math.round((slice.count / total) * 100) : 0}%
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}

/* ── 2. Sales trend bars (range + metric switches) ─────────────────────── */

function SalesTrend({
    orders,
    brandCurrency,
}: {
    orders: Order[];
    brandCurrency: string;
}) {
    const [range, setRange] = useState<RangeKey>("7d");
    const [metric, setMetric] = useState<MetricKey>("revenue");

    const { labels, values, total } = useMemo(() => {
        const days = range === "7d" ? 7 : 30;
        const startOfDay = Math.floor(Date.now() / DAY_MS) * DAY_MS;
        const buckets = new Array(days).fill(0) as number[];

        for (const order of orders) {
            const createdAt = new Date(order.createdAt).getTime();
            const ageDays = Math.floor((Date.now() - createdAt) / DAY_MS);
            if (ageDays < 0 || ageDays >= days) continue;
            const bucket = days - 1 - ageDays;
            buckets[bucket] +=
                metric === "revenue"
                    ? order.paymentStatus === "Paid"
                        ? order.finalAmount ?? 0
                        : 0
                    : 1;
        }

        const labels = buckets.map((_, i) => {
            const date = new Date(startOfDay - (days - 1 - i) * DAY_MS);
            return date.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
            });
        });

        return {
            labels,
            values: buckets,
            total: buckets.reduce((sum, v) => sum + v, 0),
        };
    }, [orders, range, metric]);

    const max = Math.max(...values, 1);
    const barGap = range === "7d" ? "gap-2" : "gap-[2px]";

    return (
        <section className="flex flex-col rounded-xl border border-border/60 bg-card p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 className="text-base font-bold text-foreground">Sales trend</h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                        {metric === "revenue" ? "Paid revenue" : "Order count"} per day
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <ChartToggle
                        ariaLabel="Trend metric"
                        value={metric}
                        options={[
                            { key: "revenue", label: METRIC_LABELS.revenue },
                            { key: "orders", label: METRIC_LABELS.orders },
                        ]}
                        onChange={setMetric}
                    />
                    <ChartToggle
                        ariaLabel="Trend range"
                        value={range}
                        options={[
                            { key: "7d", label: RANGE_LABELS["7d"] },
                            { key: "30d", label: RANGE_LABELS["30d"] },
                        ]}
                        onChange={setRange}
                    />
                </div>
            </div>

            <p className="mt-3 text-sm font-bold text-brand">
                {metric === "revenue"
                    ? formatCurrency(total, brandCurrency)
                    : `${total} orders`}{" "}
                <span className="font-medium text-muted-foreground">
                    in the last {RANGE_LABELS[range].toLowerCase()}
                </span>
            </p>

            <div className={cn("mt-4 flex h-40 items-end", barGap)}>
                {values.map((value, i) => (
                    <div
                        key={i}
                        className="group relative flex h-full flex-1 items-end"
                        title={`${labels[i]}: ${
                            metric === "revenue"
                                ? formatCurrency(value, brandCurrency)
                                : `${value} orders`
                        }`}
                    >
                        <span
                            className={cn(
                                "w-full rounded-t-[3px] transition-colors",
                                value > 0
                                    ? "bg-brand group-hover:bg-brand/75"
                                    : "bg-muted",
                            )}
                            style={{
                                height: `${Math.min(100, (value / max) * 100)}%`,
                                minHeight: value > 0 ? 3 : 2,
                            }}
                        />
                    </div>
                ))}
            </div>
            <div className={cn("mt-1.5 flex text-[9px] font-medium text-muted-foreground/70", barGap)}>
                {values.map((_, i) => {
                    // 7d shows every label; 30d shows every 5th.
                    const show =
                        range === "7d" || i % 5 === 0 || i === values.length - 1;
                    return (
                        <span key={i} className="flex-1 truncate text-center">
                            {show ? labels[i] : ""}
                        </span>
                    );
                })}
            </div>
        </section>
    );
}

/* ── 3. Payment methods share ──────────────────────────────────────────── */

const METHOD_COLORS = [
    "bg-brand",
    "bg-success",
    "bg-info",
    "bg-highlight",
    "bg-teal",
    "bg-muted-foreground/40",
];

function PaymentBreakdown({ orders }: { orders: Order[] }) {
    const rows = useMemo(() => {
        const map = new Map<string, number>();
        for (const order of orders) {
            const label = paymentMethodLabel(order.paymentMethod);
            map.set(label, (map.get(label) ?? 0) + 1);
        }
        return [...map.entries()]
            .map(([label, count], i) => ({
                label,
                count,
                color: METHOD_COLORS[i % METHOD_COLORS.length],
            }))
            .sort((a, b) => b.count - a.count);
    }, [orders]);

    const total = orders.length || 1;

    return (
        <section className="flex flex-col rounded-xl border border-border/60 bg-card p-5 shadow-sm sm:p-6">
            <h2 className="text-base font-bold text-foreground">Payment methods</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
                How customers chose to pay
            </p>

            {rows.length === 0 ? (
                <p className="mt-6 text-sm text-muted-foreground">No orders yet.</p>
            ) : (
                <>
                    {/* Stacked share bar */}
                    <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full bg-muted">
                        {rows.map((row) => (
                            <span
                                key={row.label}
                                title={`${row.label}: ${row.count}`}
                                className={cn("h-full", row.color)}
                                style={{ width: `${(row.count / total) * 100}%` }}
                            />
                        ))}
                    </div>
                    <ul className="mt-4 space-y-2.5">
                        {rows.map((row) => (
                            <li key={row.label} className="flex items-center gap-2 text-sm">
                                <span
                                    aria-hidden="true"
                                    className={cn("size-2.5 shrink-0 rounded-full", row.color)}
                                />
                                <span className="min-w-0 flex-1 truncate text-foreground">
                                    {row.label}
                                </span>
                                <span className="shrink-0 font-semibold tabular-nums text-foreground">
                                    {row.count}
                                </span>
                                <span className="w-10 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                                    {Math.round((row.count / total) * 100)}%
                                </span>
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </section>
    );
}

export function DashboardOverviewCharts({
    orders,
    brandCurrency = "usd",
}: DashboardOverviewChartsProps) {
    return (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
            <StatusDonut orders={orders} />
            <SalesTrend orders={orders} brandCurrency={brandCurrency} />
            <PaymentBreakdown orders={orders} />
        </div>
    );
}
