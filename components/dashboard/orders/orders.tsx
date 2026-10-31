"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardDataTable } from "@/components/dashboard/data-table";
import { TableLink } from "@/components/dashboard/shared/table-link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TrendingUp, TrendingDown, ShoppingCart, DollarSign, Eye, Pencil, UserRound, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteOrder } from "@/lib/services/order";
import { isErrorResult } from "@/lib/utils/result";
import { serverErrorMessage } from "@/lib/utils/form-feedback";
import { useCanDelete } from "@/components/dashboard/v4/dashboard-user";
import type { ColumnDef } from "@tanstack/react-table";
import type { ApiMeta, Order } from "@/lib/types/backend";
import { updateOrderStatus } from "@/lib/services/order";
import { InstantStatusSelect } from "@/components/dashboard/shared/instant-status-select";
import { DownloadInvoiceButton } from "@/components/shared/download-invoice-button";
import { formatCurrency } from "@/lib/utils/currency";
import { paymentMethodLabel } from "@/lib/utils/format";

interface OrdersTableProps {
    orders: Order[];
    meta?: ApiMeta;
    /** Live brand currency — every price renders in it (stale order stamps
     * are only a fallback; the storefront follows the same rule). */
    brandCurrency?: string;
}

/** Customer cell — signed-in orders show the account (popover quick detail),
 * guest orders show the delivery recipient. */
function CustomerCell({ order }: { order: Order }) {
    const user = order.user;
    const name = user?.name || order.recipientName || "Guest";
    const sub = user?.email || order.phoneNo || "";
    const initials = (name || "G")
        .split(" ")
        .map((part) => part[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase();

    return (
        <Popover>
            <PopoverTrigger
                render={
                    <button
                        type="button"
                        className="flex min-w-0 max-w-[220px] cursor-pointer items-center gap-2 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/25"
                        aria-label={`Customer: ${name}`}
                    />
                }
            >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand/10 text-[10px] font-extrabold text-brand">
                    {user?.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={user.photoUrl} alt="" className="size-7 rounded-full object-cover" />
                    ) : (
                        initials
                    )}
                </span>
                <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{name}</span>
                    {sub && (
                        <span className="block truncate text-xs text-muted-foreground">
                            {sub}
                        </span>
                    )}
                </span>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-64 p-0">
                <div className="flex items-center gap-3 border-b border-border/60 p-3.5">
                    <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand/10 text-xs font-extrabold text-brand">
                        {user?.photoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={user.photoUrl} alt="" className="size-10 rounded-full object-cover" />
                        ) : (
                            initials
                        )}
                    </span>
                    <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-foreground">{name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                            {user ? (user.email || "No email") : "Guest checkout"}
                        </p>
                    </div>
                </div>
                <dl className="space-y-2 p-3.5 text-sm">
                    <div className="flex items-center justify-between gap-3">
                        <dt className="text-muted-foreground">Type</dt>
                        <dd>
                            <Badge variant="neutral">{user ? "Registered" : "Guest"}</Badge>
                        </dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                        <dt className="shrink-0 text-muted-foreground">Recipient</dt>
                        <dd className="min-w-0 truncate text-right font-medium">
                            {order.recipientName || "—"}
                        </dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                        <dt className="shrink-0 text-muted-foreground">Phone</dt>
                        <dd className="min-w-0 truncate text-right font-medium">
                            {order.phoneNo || "—"}
                        </dd>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                        <dt className="shrink-0 text-muted-foreground">Address</dt>
                        <dd className="min-w-0 text-right text-xs leading-relaxed text-muted-foreground">
                            {order.shippingAddress || "—"}
                        </dd>
                    </div>
                </dl>
                {user && (
                    <div className="border-t border-border/60 p-3.5">
                        <Button
                            variant="brandOutline"
                            size="sm"
                            className="w-full"
                            render={<Link href={`/dashboard/admin/users/${user._id}`} />}
                        >
                            View Customer Profile
                        </Button>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}

export function OrdersTable({ orders, meta, brandCurrency = "usd" }: OrdersTableProps) {
    const router = useRouter();
    // Deletes are admin-only — managers never delete orders.
    const canDelete = useCanDelete();
    const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
    const [deleting, setDeleting] = useState(false);

    const confirmDeleteOrder = () => {
        if (!orderToDelete) return;
        setDeleting(true);
        deleteOrder(orderToDelete._id).then((result) => {
            setDeleting(false);
            if (isErrorResult(result)) {
                toast.error(serverErrorMessage(result));
                return;
            }
            toast.success(result.message ?? "Order deleted");
            setOrderToDelete(null);
            router.refresh();
        });
    };
    const currency = brandCurrency;
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
            value: formatCurrency(totalRevenue, currency),
            icon: DollarSign,
            trend: `Avg ${formatCurrency(
                orders.length > 0 ? totalRevenue / orders.length : 0,
                currency
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
                    <TableLink href={`/dashboard/admin/orders/${row.original._id}`} mono>
                        {row.original.orderId || row.original._id.slice(-8)}
                    </TableLink>
                ),
            },
            {
                id: "customer",
                accessorFn: (row) =>
                    `${row.user?.name ?? ""} ${row.user?.email ?? ""} ${row.recipientName ?? ""}`.toLowerCase(),
                header: "Customer",
                enableSorting: true,
                cell: ({ row }) => <CustomerCell order={row.original} />,
            },
            {
                accessorKey: "finalAmount",
                header: "Total",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="font-medium tabular-nums">
                        {formatCurrency(row.original.finalAmount, currency)}
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
                    <span className="text-sm">{paymentMethodLabel(row.original.paymentMethod)}</span>
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
                        {canDelete && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => setOrderToDelete(row.original)}
                            aria-label={`Delete order ${row.original.orderId}`}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                        )}
                    </div>
                ),
            },
        ],
        [canDelete]
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
                searchKey="customer"
                searchPlaceholder="Search by customer, phone or recipient..."
                pageSize={8}
            />
        
            {/* ── Delete confirmation (admin only) ── */}
            <AlertDialog
                open={!!orderToDelete}
                onOpenChange={(open) => !open && setOrderToDelete(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Order</AlertDialogTitle>
                        <AlertDialogDescription>
                            Permanently delete{" "}
                            <span className="font-mono font-semibold">
                                {orderToDelete?.orderId}
                            </span>
                            ? Its reserved stock is returned to the catalog. This
                            cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                confirmDeleteOrder();
                            }}
                            disabled={deleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleting ? "Deleting..." : "Delete Order"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
</div>
    );
}
