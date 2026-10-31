import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/currency";
import { OrderItemsCard } from "@/components/dashboard/shared/order-items-card";
import { DownloadInvoiceButton } from "@/components/shared/download-invoice-button";
import { OrderPaymentActions } from "@/components/dashboard/orders/order-payment-actions";
import { OrderStatusBadge } from "@/components/shared/order-status-badge";
import type { Order } from "@/lib/types/backend";
import { paymentMethodLabel } from "@/lib/utils/format";

interface OrderDetailsProps {
    /** Live brand currency — prices render in it, the order's own (possibly
     * stale) stamp is only a fallback. */
    brandCurrency?: string;
    order: Order;
    /** Dashboard URL base (/dashboard/admin or /dashboard/manager) — the
     * page derives it from the session role. Links are built explicitly on
     * it; relative "../" hrefs resolve against the URL directory and land on
     * the role overview instead of the orders list. */
    base?: string;
}

export function OrderDetails({
    order,
    brandCurrency = "usd",
    base = "/dashboard/admin",
}: OrderDetailsProps) {
    const currency = brandCurrency ?? order.currency;
    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                    <h2 className="text-2xl font-bold tracking-tight">
                        Order {order.orderId || order._id.slice(-8)}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Order details
                    </p>
                </div>
                {/* Stacked full-width on phones, inline on sm+ — the three
                    buttons used to squeeze onto one tight row. */}
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                    <Button
                        variant="outline"
                        render={<Link href={`${base}/orders/all-orders`} />}
                        className="flex w-full items-center justify-center gap-2 sm:w-auto"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                    {order.paymentStatus === "Paid" && (
                        <DownloadInvoiceButton
                            orderId={order._id}
                            label="Invoice"
                            className="w-full justify-center sm:w-auto"
                        />
                    )}
                    <Button
                        render={
                            <Link
                                href={`${base}/orders/update-order/${order._id}`}
                            />
                        }
                        className="flex w-full items-center justify-center gap-2 sm:w-auto"
                    >
                        <Pencil className="h-4 w-4" />
                        Update
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <OrderItemsCard products={order.products} currency={currency} />

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Summary</CardTitle>
                        <CardDescription>Order totals</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Subtotal</span>
                            {/* Base prices (before offers) — totalAmount is the
                                post-offer subtotal. */}
                            <span className="font-medium">
                                {formatCurrency(order.totalAmount + order.offerDiscount, currency)}
                            </span>
                        </div>
                        {order.offerDiscount > 0 && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Offer discount</span>
                                <span className="font-medium text-success">
                                    -{formatCurrency(order.offerDiscount, currency)}
                                </span>
                            </div>
                        )}
                        {order.discount > 0 && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Coupon discount</span>
                                <span className="font-medium text-success">
                                    -{formatCurrency(order.discount, currency)}
                                </span>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Delivery</span>
                            <span className="font-medium">{formatCurrency(order.deliveryCharge, currency)}</span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                            <span className="font-medium">Final</span>
                            <span className="font-bold">{formatCurrency(order.finalAmount, currency)}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <OrderPaymentActions order={order} brandCurrency={brandCurrency} />

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
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Order Status
                            </p>
                            <OrderStatusBadge status={order.status} className="mt-1" />
                        </div>
                        <div className="rounded-lg border p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Payment Status
                            </p>
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
                                {paymentMethodLabel(order.paymentMethod)}
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
