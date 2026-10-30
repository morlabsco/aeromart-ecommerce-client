"use client";

import { useMemo } from "react";
import Link from "next/link";
import { DashboardDataTable } from "@/components/dashboard/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart, Eye, DollarSign, Clock, CheckCircle2 } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import type { ApiMeta, Order } from "@/lib/types/backend";
import { formatCurrency } from "@/lib/utils/currency";
import { DownloadInvoiceButton } from "@/components/shared/download-invoice-button";
import { OrderStatusBadge } from "@/components/shared/order-status-badge";

interface MyOrdersTableProps {
    orders: Order[];
    meta?: ApiMeta;
    /** Fallback currency for legacy orders missing a currency code. */
    brandCurrency?: string;
}

export function MyOrdersTable({ orders, meta, brandCurrency = "usd" }: MyOrdersTableProps) {
    const currency = brandCurrency;
    const totalSpent = orders
        .filter((o) => o.paymentStatus === "Paid" && o.status !== "Cancelled")
        .reduce((sum, o) => sum + o.finalAmount, 0);
    const pendingOrders = orders.filter((o) => o.status === "Pending").length;
    const completedOrders = orders.filter((o) => o.status === "Completed").length;

    const stats = [
        {
            label: "Total Orders",
            value: meta?.total ?? orders.length,
            icon: ShoppingCart,
        },
        {
            label: "Total Spent",
            value: formatCurrency(totalSpent, currency, {
                minimumFractionDigits: 2,
            }),
            icon: DollarSign,
        },
        {
            label: "Pending",
            value: pendingOrders,
            icon: Clock,
        },
        {
            label: "Completed",
            value: completedOrders,
            icon: CheckCircle2,
        },
    ];

    const columns: ColumnDef<Order>[] = useMemo(
        () => [
            {
                accessorKey: "orderId",
                header: "Order ID",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="font-mono text-sm font-medium">
                        {row.original.orderId || `#${row.original._id.slice(-8)}`}
                    </span>
                ),
            },
            {
                accessorKey: "createdAt",
                header: "Date",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="text-sm text-muted-foreground">
                        {new Date(row.original.createdAt).toLocaleDateString()}
                    </span>
                ),
            },
            {
                accessorKey: "products",
                header: "Items",
                enableSorting: false,
                cell: ({ row }) => (
                    <span className="text-sm">
                        {row.original.products.reduce((n, p) => n + p.quantity, 0)}{" "}
                        item{row.original.products.reduce((n, p) => n + p.quantity, 0) === 1 ? "" : "s"}
                    </span>
                ),
            },
            {
                accessorKey: "finalAmount",
                header: "Total",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="font-medium tabular-nums">
                        {formatCurrency(row.original.finalAmount, currency ?? row.original.currency)}
                    </span>
                ),
            },
            {
                accessorKey: "status",
                header: "Status",
                enableSorting: true,
                cell: ({ row }) => (
                    <OrderStatusBadge status={row.original.status} />
                ),
            },
            {
                accessorKey: "paymentStatus",
                header: "Payment",
                enableSorting: true,
                cell: ({ row }) => (
                    <Badge
                        variant={
                            row.original.paymentStatus === "Paid"
                                ? "secondary"
                                : row.original.paymentStatus === "Pending"
                                ? "outline"
                                : "destructive"
                        }
                        className="text-xs"
                    >
                        {row.original.paymentStatus}
                    </Badge>
                ),
            },
            {
                id: "actions",
                header: "",
                cell: ({ row }) => (
                    <div className="flex items-center justify-end gap-1">
                        {row.original.paymentStatus === "Paid" && (
                            <DownloadInvoiceButton
                                orderId={row.original._id}
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            />
                        )}
                        <Button variant="ghost" size="sm" render={<Link href={`/dashboard/customer/orders/${row.original._id}`} />} className="h-8 gap-1 text-muted-foreground hover:text-foreground">
                            <Eye className="h-4 w-4" />
                            View
                        </Button>
                    </div>
                ),
            },
        ],
        []
    );

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">My Orders</h2>
                <p className="text-sm text-muted-foreground mt-1">
                    Your order history
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <Card key={stat.label}>
                            <CardContent className="p-5">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="inline-flex p-1.5 rounded-lg bg-primary/10">
                                        <Icon className="h-4 w-4 text-primary" />
                                    </div>
                                </div>
                                <p className="text-xl font-bold tabular-nums">{stat.value}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {stat.label}
                                </p>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <DashboardDataTable
                columns={columns}
                data={orders}
                pageSize={8}
            />
        </div>
    );
}