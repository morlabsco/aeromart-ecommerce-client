"use client";

import { useMemo, useState } from "react";
import { formatCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";
import type { Order } from "@/lib/types/backend";

/* ---------------------------------------------------------------------------
 * Sales overview — the big dashboard chart, now with a granularity switch:
 * Daily (last 14 days) / Weekly (last 12 weeks) / Monthly (12 months of the
 * current year). Paid revenue per bucket, "nice" y-axis steps, token-styled
 * pure CSS bars (no chart library). Extracted from the server overview so
 * the switch re-buckets locally — no refetch, no lag.
 * ------------------------------------------------------------------------- */

type Unit = "daily" | "weekly" | "monthly";

const UNIT_OPTIONS: { key: Unit; label: string }[] = [
    { key: "daily", label: "Daily" },
    { key: "weekly", label: "Weekly" },
    { key: "monthly", label: "Monthly" },
];

const MONTHS = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const DAY_MS = 24 * 60 * 60 * 1000;

interface Bucket {
    label: string;
    value: number;
}

function buildBuckets(orders: Order[], unit: Unit): Bucket[] {
    const paid = orders.filter((o) => o.paymentStatus === "Paid");
    const now = new Date();

    if (unit === "monthly") {
        const year = now.getFullYear();
        const totals = new Array(12).fill(0) as number[];
        for (const order of paid) {
            const date = new Date(order.createdAt);
            if (date.getFullYear() === year) {
                totals[date.getMonth()] += order.finalAmount ?? 0;
            }
        }
        return totals.map((value, i) => ({ label: MONTHS[i], value }));
    }

    if (unit === "weekly") {
        // Weeks start Monday; the last bucket is the current week.
        const buckets: Bucket[] = Array.from({ length: 12 }, (_, i) => ({
            label: `W${i + 1}`,
            value: 0,
        }));
        const startOfWeek = (d: Date) => {
            const date = new Date(d);
            const day = (date.getDay() + 6) % 7; // Mon = 0
            date.setHours(0, 0, 0, 0);
            return date.getTime() - day * DAY_MS;
        };
        const currentWeekStart = startOfWeek(now);
        for (const order of paid) {
            const createdAt = new Date(order.createdAt).getTime();
            const weeksAgo = Math.floor(
                (currentWeekStart - startOfWeek(new Date(createdAt))) /
                    (7 * DAY_MS),
            );
            if (weeksAgo >= 0 && weeksAgo < 12) {
                buckets[11 - weeksAgo].value += order.finalAmount ?? 0;
            }
        }
        return buckets;
    }

    // Daily — last 14 days.
    const startOfDay = Math.floor(now.getTime() / DAY_MS) * DAY_MS;
    const totals = new Array(14).fill(0) as number[];
    for (const order of paid) {
        const ageDays = Math.floor(
            (now.getTime() - new Date(order.createdAt).getTime()) / DAY_MS,
        );
        if (ageDays >= 0 && ageDays < 14) {
            totals[13 - ageDays] += order.finalAmount ?? 0;
        }
    }
    return totals.map((value, i) => {
        const date = new Date(startOfDay - (13 - i) * DAY_MS);
        return {
            label: date.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
            }),
            value,
        };
    });
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
    if (value >= 1_000)
        return `${symbol}${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1)}k`;
    return `${symbol}${value}`;
}

export function SalesOverviewChart({
    orders,
    brandCurrency = "usd",
}: {
    orders: Order[];
    brandCurrency?: string;
}) {
    const [unit, setUnit] = useState<Unit>("monthly");

    const buckets = useMemo(() => buildBuckets(orders, unit), [orders, unit]);
    const total = useMemo(
        () => buckets.reduce((sum, b) => sum + b.value, 0),
        [buckets],
    );

    const max = Math.max(...buckets.map((b) => b.value), 1);
    const step = niceStep(max / 4);
    const yMax = step * 4;

    // Label density: 12–14 buckets fit; daily labels rotate on small screens.
    const showEvery = buckets.length > 12 ? 2 : 1;

    return (
        <section className="rounded-xl border border-border/60 bg-card p-5 shadow-sm sm:p-6 xl:col-span-2">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 className="text-base font-bold text-foreground">
                        Sales overview
                    </h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                        Paid order value ·{" "}
                        {unit === "daily"
                            ? "last 14 days"
                            : unit === "weekly"
                              ? "last 12 weeks"
                              : new Date().getFullYear()}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-bold text-brand">
                        {formatCurrency(total, brandCurrency)}
                    </span>
                    <div
                        role="group"
                        aria-label="Chart granularity"
                        className="flex gap-1 rounded-lg bg-muted p-1"
                    >
                        {UNIT_OPTIONS.map((option) => (
                            <button
                                key={option.key}
                                type="button"
                                onClick={() => setUnit(option.key)}
                                aria-pressed={unit === option.key}
                                className={cn(
                                    "cursor-pointer rounded-md px-2.5 py-1 text-[11px] font-bold transition-colors",
                                    unit === option.key
                                        ? "bg-header-nav text-header-nav-foreground"
                                        : "text-muted-foreground hover:text-foreground",
                                )}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-6 flex h-56 gap-3 sm:h-64">
                {/* y grid */}
                <div className="flex w-14 shrink-0 flex-col justify-between pb-6 text-right text-[10px] font-medium tabular-nums text-muted-foreground/70">
                    {[4, 3, 2, 1, 0].map((n) => (
                        <span key={n}>
                            {compactCurrency(n * step, brandCurrency)}
                        </span>
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
                    <div className="absolute inset-0 flex items-end gap-1 pb-6 sm:gap-2">
                        {buckets.map((bucket) => (
                            <div
                                key={bucket.label}
                                className="group relative flex h-full min-w-0 flex-1 items-end"
                                title={`${bucket.label}: ${formatCurrency(bucket.value, brandCurrency)}`}
                            >
                                <span
                                    className={cn(
                                        "w-full rounded-t-md transition-colors",
                                        bucket.value > 0
                                            ? "bg-brand group-hover:bg-brand/80"
                                            : "bg-muted",
                                    )}
                                    style={{
                                        height: `${Math.min(100, (bucket.value / yMax) * 100)}%`,
                                        minHeight: bucket.value > 0 ? 4 : 2,
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                    {/* x labels — daily rotates, others truncate */}
                    <div className="absolute inset-x-0 bottom-0 flex gap-1 pb-0 sm:gap-2">
                        {buckets.map((bucket, i) => (
                            <span
                                key={`${bucket.label}-${i}`}
                                className={cn(
                                    "min-w-0 flex-1 text-center text-[10px] font-medium text-muted-foreground/70",
                                    unit === "daily"
                                        ? "truncate"
                                        : "truncate",
                                    i % showEvery !== 0 && "opacity-0",
                                )}
                            >
                                {bucket.label}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
