"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { DashboardDataTable } from "@/components/dashboard/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, ShoppingCart, DollarSign, Eye, Pencil } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import type { ApiMeta, Order } from "@/lib/types/backend";
import { updateOrderStatus } from "@/lib/services/order";
import { InstantStatusSelect } from "@/components/dashboard/shared/instant-status-select";
import { DownloadInvoiceButton } from "@/components/shared/download-invoice-button";
import { formatCurrency } from "@/lib/utils/currency";

interface OrdersTableProps {
    orders: Order[];
    meta?: ApiMeta;
}

export function OrdersTable({ orders, meta }: OrdersTableProps) {
    const router = useRouter();
    const totalRevenue = orders.reduce((sum, o) => sum + o.finalAmount, 0);
    const pendingOrders = orders.filter((o) => o.status === "Pending").length;
    const paidOrders = orders.filter((o) => o.paymentStatus === "Paid").length;

    const stats = [
        {
            label: "Total Orders",
            value: meta?.total ?? orders.length,
            icon: ShoppingCart,
            trend: `${orders.filter((o) => o.status === "Completed").length} completed`,
            up: orders.filter((o) => o.status === "Completed").length / (orders.length || 1) > 0.3,
        },
        {
            label: "Revenue",
            value: formatCurrency(totalRevenue, orders[0]?.currency),
            icon: DollarSign,
            trend: `Avg ${formatCurrency(
                orders.length > 0 ? totalRevenue / orders.length : 0,
                orders[0]?.currency
            )}/order`,
            up: true,
        },
        {
            label: "Pending Orders",
            value: pendingOrders,
            icon: ShoppingCart,
            trend: `${((pendingOrders / (orders.length || 1)) * 100).toFixed(0)}% of total`,
            up: pendingOrders <= orders.length * 0.5,
        },
        {
            label: "Paid",
            value: paidOrders,
            icon: DollarSign,
            trend: `${((paidOrders / (orders.length || 1)) * 100).toFixed(0)}% paid`,
            up: paidOrders / (orders.length || 1) > 0.5,
        },
    ];

    const columns: ColumnDef<Order>[] = useMemo(
        () => [
            {
                accessorKey: "_id",
                header: "Order ID",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="font-mono text-sm font-medium">
                        {row.original.orderId || row.original._id.slice(-8)}
                    </span>
                ),
            },
            {
                accessorKey: "user",
                header: "Customer",
                enableSorting: true,
                cell: ({ row }) => (
                    <div>
                        <p className="text-sm font-medium">{row.original.user?.name ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">{row.original.user?.email}</p>
                    </div>
                ),
            },
            {
                accessorKey: "finalAmount",
                header: "Total",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="font-medium tabular-nums">
                        {formatCurrency(row.original.finalAmount, row.original.currency)}
                    </span>
                ),
            },
            {
                accessorKey: "status",
                header: "Status",
                enableSorting: true,
                cell: ({ row }) => (
                    <InstantStatusSelect
                        value={row.original.status}
                        options={[
                            { value: "Pending", label: "Pending" },
                            { value: "Processing", label: "Processing" },
                            { value: "Shipped", label: "Shipped" },
                            { value: "Completed", label: "Completed" },
                            { value: "Cancelled", label: "Cancelled" },
                        ]}
                        onUpdate={(status) => updateOrderStatus(row.original._id, status)}
                        onSuccess={() => router.refresh()}
                    />
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
                accessorKey: "paymentMethod",
                header: "Method",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="text-sm">{row.original.paymentMethod}</span>
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
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" aria-label={`View order ${row.original._id}`} render={<a href={`/dashboard/admin/orders/${row.original._id}`} />}>
                            <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" aria-label={`Update order ${row.original._id}`} render={<a href={`/dashboard/admin/orders/update-order/${row.original._id}`} />}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                    </div>
                ),
            },
        ],
        []
    );

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Orders</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage and track customer orders
                    </p>
                </div>
                <Button render={<a href="/dashboard/admin/orders/create-order" />}>
                    Create Order
                </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <Card key={stat.label}>
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="inline-flex p-1.5 rounded-lg bg-primary/10">
                                        <Icon className="h-4 w-4 text-primary" />
                                    </div>
                                    <Badge
                                        variant={stat.up ? "secondary" : "destructive"}
                                        className="gap-0.5 text-[10px]"
                                    >
                                        {stat.up ? (
                                            <TrendingUp className="h-2.5 w-2.5" />
                                        ) : (
                                            <TrendingDown className="h-2.5 w-2.5" />
                                        )}
                                        {stat.trend}
                                    </Badge>
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
                searchKey="user"
                searchPlaceholder="Search by customer..."
                pageSize={8}
            />
        </div>
    );
}
