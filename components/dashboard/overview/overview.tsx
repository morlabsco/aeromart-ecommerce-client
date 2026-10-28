"use client";

import { lazy, Suspense } from "react";
import {
    Package,
    ShoppingCart,
    DollarSign,
    Users,
    Tags,
    Layers,
    Star,
    AlertTriangle,
} from "lucide-react";
import {
    Card,
    CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderStatusBadge } from "@/components/shared/order-status-badge";
import { formatCurrency } from "@/lib/utils/currency";
import type { MetaData, Order } from "@/lib/types/backend";

const RevenueTrendChart = lazy(() =>
    import("@/components/dashboard/overview/revenue-trend-chart").then((m) => ({
        default: m.RevenueTrendChart,
    }))
);
const OrderStatusChart = lazy(() =>
    import("@/components/dashboard/overview/order-status-chart").then((m) => ({
        default: m.OrderStatusChart,
    }))
);

interface OverviewProps {
    meta: MetaData | null;
    orders: Order[];
    /** Fallback currency for revenue display (brand currency). */
    brandCurrency?: string;
}

export function DashboardOverview({ meta, orders, brandCurrency = "usd" }: OverviewProps) {
    const currency = brandCurrency;
    const stats = [
        {
            label: "Total Products",
            value: meta?.totalProducts ?? 0,
            icon: Package,
            detail: `${meta?.lowStockProducts ?? 0} low on stock`,
        },
        {
            label: "Total Orders",
            value: meta?.totalOrders ?? 0,
            icon: ShoppingCart,
            detail: `${meta?.recentOrders ?? 0} in the last 7 days`,
        },
        {
            label: "Revenue",
            value: formatCurrency(meta?.totalRevenue ?? 0, currency, {
                minimumFractionDigits: 2,
            }),
            icon: DollarSign,
            detail: "From paid orders",
        },
        {
            label: "Total Users",
            value: meta?.totalUsers ?? 0,
            icon: Users,
            detail: "Registered accounts",
        },
        {
            label: "Categories",
            value: meta?.totalCategories ?? 0,
            icon: Layers,
            detail: "Active categories",
        },
        {
            label: "Brands",
            value: meta?.totalBrands ?? 0,
            icon: Tags,
            detail: "Active brands",
        },
        {
            label: "Reviews",
            value: meta?.totalReviews ?? 0,
            icon: Star,
            detail: "Across all products",
        },
        {
            label: "Low Stock",
            value: meta?.lowStockProducts ?? 0,
            icon: AlertTriangle,
            detail: "Products with stock < 5",
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">
                    Dashboard Overview
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                    Key metrics at a glance
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Suspense
                    fallback={
                        <Card>
                            <CardContent className="p-6">
                                <Skeleton className="h-5 w-40" />
                                <Skeleton className="h-4 w-56 mt-2" />
                                <Skeleton className="mt-6 h-64 w-full" />
                            </CardContent>
                        </Card>
                    }
                >
                    <RevenueTrendChart orders={orders} brandCurrency={currency} />
                </Suspense>
                <Suspense
                    fallback={
                        <Card>
                            <CardContent className="p-6">
                                <Skeleton className="h-5 w-32" />
                                <Skeleton className="h-4 w-48 mt-2" />
                                <Skeleton className="mt-6 h-64 w-full" />
                            </CardContent>
                        </Card>
                    }
                >
                    <OrderStatusChart orders={orders} />
                </Suspense>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <Card key={stat.label}>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="inline-flex p-2 rounded-lg bg-primary/10">
                                        <Icon className="h-5 w-5 text-primary" />
                                    </div>
                                    <Badge variant="secondary" className="text-[11px]">
                                        {stat.label}
                                    </Badge>
                                </div>
                                <p className="text-2xl font-bold tabular-nums">
                                    {stat.value}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {stat.detail}
                                </p>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-semibold mb-4">Recent Orders</h3>
                        <div className="space-y-3">
                            {orders.length === 0 ? (
                                <p className="text-sm text-muted-foreground py-6 text-center">
                                    No orders yet.
                                </p>
                            ) : (
                                orders.slice(0, 5).map((order) => (
                                    <div
                                        key={order._id}
                                        className="flex items-center justify-between py-2 border-b last:border-0"
                                    >
                                        <div>
                                            <p className="text-sm font-medium">
                                                {order.orderId ||
                                                    order.user?.name ||
                                                    "Guest"}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(
                                                    order.createdAt
                                                ).toLocaleDateString()}
                                                {" · "}
                                                {order.products.length} item
                                                {order.products.length !== 1
                                                    ? "s"
                                                    : ""}
                                                {order.user?.name
                                                    ? ` · ${order.user.name}`
                                                    : " · Guest"}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium tabular-nums">
                                                {formatCurrency(order.finalAmount, order.currency ?? currency)}
                                            </p>
                                            <OrderStatusBadge status={order.status} />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-semibold mb-4">
                            Order Status Breakdown
                        </h3>
                        <div className="space-y-3">
                            {[
                                "Pending",
                                "Processing",
                                "Shipped",
                                "Completed",
                                "Cancelled",
                            ].map((status) => {
                                const count = orders.filter(
                                    (o) => o.status === status
                                ).length;
                                const pct =
                                    orders.length > 0
                                        ? ((count / orders.length) * 100).toFixed(
                                              0
                                          )
                                        : "0";
                                return (
                                    <div
                                        key={status}
                                        className="flex items-center gap-3"
                                    >
                                        <span className="w-24 text-sm capitalize text-muted-foreground">
                                            {status}
                                        </span>
                                        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-primary transition-all"
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                        <span className="text-sm font-medium tabular-nums w-12 text-right">
                                            {count}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
