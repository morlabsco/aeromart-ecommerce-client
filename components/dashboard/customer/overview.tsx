"use client";

import { useMemo } from "react";
import { Package, Clock, RefreshCcw, XCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/currency";
import type { Order, User } from "@/lib/types/backend";

interface CustomerOverviewProps {
    profile: User | null;
    orders: Order[];
    /** Fallback currency for money display (brand currency). */
    brandCurrency?: string;
}

/** Light status pills per the dashboard reference. */
const statusStyles: Record<string, string> = {
    Completed: "bg-success/15 text-success",
    Shipped: "bg-info/15 text-info",
    Processing: "bg-warning/20 text-warning-foreground",
    Pending: "bg-warning/20 text-warning-foreground",
    Cancelled: "bg-destructive/15 text-destructive",
};

/**
 * Customer dashboard overview, rebuilt from the cropped reference
 * (nittonova-dashboard-page-large-device-overview.png): a friendly welcome
 * bar, four white stat cards with charcoal icon squares, and a Recent
 * Orders card with a status-pill table and orange totals.
 */
export function CustomerOverview({ profile, orders, brandCurrency = "usd" }: CustomerOverviewProps) {
    const currency = brandCurrency;

    const stats = useMemo(() => {
        return [
            {
                label: "Total Orders",
                value: String(orders.length),
                icon: Package,
            },
            {
                label: "Pending Payment",
                value: String(
                    orders.filter((o) => o.paymentStatus === "Pending" && o.status !== "Cancelled")
                        .length
                ),
                icon: Clock,
            },
            {
                label: "In Progress",
                value: String(orders.filter((o) => o.status === "Processing" || o.status === "Shipped").length),
                icon: RefreshCcw,
            },
            {
                label: "Cancelled",
                value: String(orders.filter((o) => o.status === "Cancelled").length),
                icon: XCircle,
            },
        ];
    }, [orders]);

    const recentOrders = useMemo(() => orders.slice(0, 5), [orders]);

    return (
        <div className="space-y-6">
            {/* Welcome bar */}
            <div>
                <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                    Hello, {profile?.name?.split(" ")[0] ?? "there"} 👋
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Here&apos;s what&apos;s happening with your account and orders.
                </p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 sm:gap-4">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={stat.label}
                            className="rounded-2xl bg-card p-4 shadow-sm sm:p-5"
                        >
                            <span className="mb-3 flex size-10 items-center justify-center rounded-xl bg-header-nav text-white">
                                <Icon className="size-5" strokeWidth={1.75} />
                            </span>
                            <p className="text-2xl font-extrabold tabular-nums text-foreground sm:text-3xl">
                                {stat.value}
                            </p>
                            <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                {stat.label}
                            </p>
                        </div>
                    );
                })}
            </div>

            {/* Recent orders */}
            <div className="rounded-2xl bg-card shadow-sm">
                <div className="flex items-center justify-between border-b border-border/60 px-5 py-4 sm:px-6">
                    <h3 className="text-base font-bold text-foreground">Recent Orders</h3>
                    <Link
                        href="/dashboard/customer/orders"
                        className="text-sm font-semibold text-brand transition-colors hover:text-brand/80"
                    >
                        View All →
                    </Link>
                </div>

                {recentOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Package className="size-8 text-muted-foreground/50" />
                        <p className="mt-3 text-sm text-muted-foreground">
                            No orders yet. When you place an order, it will show up here.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                                    <th className="px-5 py-3 font-semibold sm:px-6">Order</th>
                                    <th className="hidden px-5 py-3 font-semibold sm:table-cell sm:px-6">
                                        Date
                                    </th>
                                    <th className="px-5 py-3 font-semibold sm:px-6">Status</th>
                                    <th className="px-5 py-3 text-right font-semibold sm:px-6">
                                        Total
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentOrders.map((order) => (
                                    <tr
                                        key={order._id}
                                        className="border-t border-border/50 transition-colors hover:bg-muted/40"
                                    >
                                        <td className="px-5 py-4 sm:px-6">
                                            <Link
                                                href={`/dashboard/customer/orders/${order._id}`}
                                                className="font-semibold text-foreground hover:text-brand"
                                            >
                                                {order.orderId || order._id.slice(-8)}
                                            </Link>
                                        </td>
                                        <td className="hidden px-5 py-4 text-muted-foreground sm:table-cell sm:px-6">
                                            {new Date(order.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-5 py-4 sm:px-6">
                                            <span
                                                className={cn(
                                                    "inline-block rounded-full px-2.5 py-1 text-xs font-semibold",
                                                    statusStyles[order.status] ??
                                                        "bg-muted text-muted-foreground"
                                                )}
                                            >
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-right font-semibold text-brand tabular-nums sm:px-6">
                                            {formatCurrency(
                                                order.finalAmount,
                                                order.currency ?? currency
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
