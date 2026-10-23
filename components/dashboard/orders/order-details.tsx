import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/currency";
import { DownloadInvoiceButton } from "@/components/shared/download-invoice-button";
import { OrderPaymentActions } from "@/components/dashboard/orders/order-payment-actions";
import type { Order } from "@/lib/types/backend";

const statusStyles: Record<string, string> = {
    Completed:
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    Shipped:
        "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    Processing:
        "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    Pending:
        "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
    Cancelled:
        "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

interface OrderDetailsProps {
    order: Order;
}

export function OrderDetails({ order }: OrderDetailsProps) {
    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">
                        Order {order.orderId || order._id.slice(-8)}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Order details
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" render={<Link href="/dashboard/admin/orders" />} className="flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                    {order.paymentStatus === "Paid" && (
                        <DownloadInvoiceButton
                            orderId={order._id}
                            label="Invoice"
                        />
                    )}
                    <Button render={<Link href={`/dashboard/admin/orders/update-order/${order._id}`} />} className="flex items-center gap-2">
                        <Pencil className="h-4 w-4" />
                        Update
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-base">Items</CardTitle>
                        <CardDescription>Products in this order</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {order.products.map((item, i) => (
                            <div key={i} className="flex items-center justify-between rounded-lg border p-4">
                                <div>
                                    <p className="text-sm font-medium">{item.product.name}</p>
                                    {item.variant && (
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {Object.entries(
                                                item.variant.attributes ?? {}
                                            )
                                                .map(
                                                    ([key, value]) =>
                                                        `${key}: ${value}`
                                                )
                                                .join(" · ")}
                                            {item.variant.sku && (
                                                <span className="font-mono">
                                                    {" "}
                                                    · {item.variant.sku}
                                                </span>
                                            )}
                                        </p>
                                    )}
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {item.quantity} × {formatCurrency(item.unitPrice, order.currency)}
                                    </p>
                                </div>
                                <p className="text-sm font-medium tabular-nums">
                                    {formatCurrency(item.quantity * item.unitPrice, order.currency)}
                                </p>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Summary</CardTitle>
                        <CardDescription>Order totals</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span className="font-medium">{formatCurrency(order.totalAmount, order.currency)}</span>
                        </div>
                        {order.offerDiscount > 0 && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Offer discount</span>
                                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                                    -{formatCurrency(order.offerDiscount, order.currency)}
                                </span>
                            </div>
                        )}
                        {order.discount > 0 && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Coupon discount</span>
                                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                                    -{formatCurrency(order.discount, order.currency)}
                                </span>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Total discount</span>
                            <span className="font-medium">
                                {order.totalDiscount > 0 ? "-" : ""}
                                {formatCurrency(order.totalDiscount, order.currency)}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Delivery</span>
                            <span className="font-medium">{formatCurrency(order.deliveryCharge, order.currency)}</span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                            <span className="font-medium">Final</span>
                            <span className="font-bold">{formatCurrency(order.finalAmount, order.currency)}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <OrderPaymentActions order={order} />

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Order Information</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="rounded-lg border p-4">
                            <p className="text-xs text-muted-foreground">Order ID</p>
                            <p className="text-sm font-mono font-medium mt-1">
                                {order.orderId || order._id}
                            </p>
                        </div>
                        <div className="rounded-lg border p-4">
                            <p className="text-xs text-muted-foreground">Customer</p>
                            <p className="text-sm font-medium mt-1">
                                {order.user?.name ?? "Guest"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">{order.user?.email}</p>
                        </div>
                        <div className="rounded-lg border p-4">
                            <p className="text-xs text-muted-foreground">Recipient</p>
                            <p className="text-sm font-medium mt-1">
                                {order.recipientName ?? order.user?.name ?? "—"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {order.phoneNo ?? "—"}
                            </p>
                        </div>
                        <div className="rounded-lg border p-4">
                            <p className="text-xs text-muted-foreground">Status</p>
                            <span
                                className={cn(
                                    "inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium",
                                    statusStyles[order.status] ??
                                        "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                                )}
                            >
                                {order.status}
                            </span>
                        </div>
                        <div className="rounded-lg border p-4">
                            <p className="text-xs text-muted-foreground">Payment</p>
                            <Badge
                                variant={
                                    order.paymentStatus === "Paid"
                                        ? "secondary"
                                        : order.paymentStatus === "Pending"
                                        ? "outline"
                                        : "destructive"
                                }
                                className="mt-1 text-xs"
                            >
                                {order.paymentStatus}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                                {order.paymentMethod}
                            </p>
                        </div>
                        <div className="rounded-lg border p-4">
                            <p className="text-xs text-muted-foreground">Coupon</p>
                            <p className="text-sm font-medium mt-1">{order.coupon ?? "—"}</p>
                        </div>
                        <div className="rounded-lg border p-4">
                            <p className="text-xs text-muted-foreground">Shipping Address</p>
                            <p className="text-sm mt-1">{order.shippingAddress}</p>
                        </div>
                        <div className="rounded-lg border p-4">
                            <p className="text-xs text-muted-foreground">Created</p>
                            <p className="text-sm font-medium mt-1">
                                {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                        {order.notes && (
                            <div className="rounded-lg border p-4">
                                <p className="text-xs text-muted-foreground">Notes</p>
                                <p className="text-sm mt-1">{order.notes}</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
