"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Ban, CreditCard, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { formatCurrency } from "@/lib/utils/currency";
import { updateOrder } from "@/lib/services/order";
import { stripeInit, sslCommerzInit, bkashInit } from "@/lib/services/payment";
import { DownloadInvoiceButton } from "@/components/shared/download-invoice-button";
import { OrderStatusBadge } from "@/components/shared/order-status-badge";
import { isErrorResult } from "@/lib/utils/result";
import type { Order } from "@/lib/types/backend";

type PaymentProviderOption = "stripe" | "sslcommerz" | "bkash";

const PAYMENT_PROVIDER_OPTIONS: {
    value: PaymentProviderOption;
    label: string;
    description: string;
    logo: string;
}[] = [
    { value: "stripe", label: "Stripe", description: "Pay securely with a card.", logo: "/images/stripe-pay-logo.png" },
    { value: "sslcommerz", label: "SSLCommerz", description: "Bangladesh online payment gateway.", logo: "/images/sslcommerz-pay-logo.png" },
    { value: "bkash", label: "bKash", description: "Bangladesh mobile wallet.", logo: "/images/bkash-pay-logo.png" },
];

const CANCELLABLE: string[] = ["Pending", "Processing", "Shipped"];

function orderLabel(order: Order): string {
  return order.orderId || order._id.slice(-8);
}

interface CustomerOrderDetailsProps {
    order: Order;
}

export function CustomerOrderDetails({ order }: CustomerOrderDetailsProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [confirmCancel, setConfirmCancel] = useState(false);
    const [paymentProvider, setPaymentProvider] =
        useState<PaymentProviderOption>("stripe");
    const [paying, setPaying] = useState(false);

    const canCancel = CANCELLABLE.includes(order.status);
    const canPay = order.paymentStatus !== "Paid" && order.status !== "Cancelled";

    const handleCancel = () => {
        startTransition(async () => {
            const result = await updateOrder(order._id, { status: "Cancelled" });
            setConfirmCancel(false);
            if (isErrorResult(result)) {
                toast.error(result.message);
                return;
            }
            toast.success(result.message ?? "Order cancelled successfully");
            router.refresh();
        });
    };

    const handlePayNow = async () => {
        if (paying) return;
        setPaying(true);
        try {
            const recipientName = order.recipientName ?? order.user?.name ?? "";
            const phoneNo = order.phoneNo ?? "";
            const address = order.shippingAddress || "";
            // Fallback segments for gateways that want separated address parts.
            const [addr1 = address, city = "", state = "", postcode = "", country = "Bangladesh"] =
                address.split(",").map((s) => s.trim());

            const email = order.user?.email ?? "";
            const amount = order.finalAmount;

            let gatewayUrl: string | null = null;

            if (paymentProvider === "stripe") {
                const res = await stripeInit(order._id, {
                    amount,
                    currency: order.currency || "usd",
                });
                if (isErrorResult(res)) {
                    toast.error(res.message);
                    return;
                }
                gatewayUrl = res.data.gatewayUrl;
            } else if (paymentProvider === "sslcommerz") {
                const res = await sslCommerzInit(order._id, {
                    total_amount: amount,
                    product_name: "Order",
                    product_category: "General",
                    currency: (order.currency || "usd").toUpperCase(),
                    cus_name: recipientName,
                    cus_email: email,
                    cus_phone: phoneNo,
                    cus_add1: addr1,
                    cus_city: city,
                    cus_state: state,
                    cus_postcode: postcode,
                    cus_country: country,
                    ship_name: recipientName,
                    ship_add1: addr1,
                    ship_city: city,
                    ship_state: state,
                    ship_postcode: postcode,
                    ship_country: country,
                });
                if (isErrorResult(res)) {
                    toast.error(res.message);
                    return;
                }
                gatewayUrl = res.data.gatewayUrl;
            } else {
                const res = await bkashInit(order._id, {
                    amount,
                    customerNumber: phoneNo,
                });
                if (isErrorResult(res)) {
                    toast.error(res.message);
                    return;
                }
                gatewayUrl = res.data.gatewayUrl;
            }

            if (gatewayUrl) {
                window.location.href = gatewayUrl;
            }
        } catch {
            toast.error("Failed to start payment. Please try again.");
        } finally {
            setPaying(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">
                        Order #{orderLabel(order)}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Order details
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" render={<Link href="/dashboard/customer/orders/my-orders" />} className="flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                    {order.paymentStatus === "Paid" && (
                        <DownloadInvoiceButton
                            orderId={order._id}
                            label="Invoice"
                        />
                    )}
                    {canCancel && (
                        <Button variant="destructive" onClick={() => setConfirmCancel(true)}>
                            <Ban className="mr-2 h-4 w-4" />
                            Cancel Order
                        </Button>
                    )}
                </div>
            </div>

            {canPay && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">
                            Complete Payment
                        </CardTitle>
                        <CardDescription>
                            This order hasn't been paid yet. Choose a payment
                            method and continue to the gateway to pay{" "}
                            <span className="font-medium text-foreground">
                                {formatCurrency(order.finalAmount, order.currency)}
                            </span>
                            .
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <RadioGroup
                            value={paymentProvider}
                            onValueChange={(value) =>
                                setPaymentProvider(
                                    value as PaymentProviderOption
                                )
                            }
                            className="grid grid-cols-1 sm:grid-cols-3 gap-3"
                        >
                            {PAYMENT_PROVIDER_OPTIONS.map((option) => (
                                <Label
                                    key={option.value}
                                    className="flex cursor-pointer items-center gap-3 rounded-lg border p-4 has-data-[state=checked]:border-primary"
                                >
                                    <RadioGroupItem value={option.value} />
                                    <Image
                                        src={option.logo}
                                        alt={option.label}
                                        width={0}
                                        height={0}
                                        sizes="100vw"
                                        className="h-6 w-auto object-contain"
                                    />
                                    <div>
                                        <p className="text-sm font-medium">
                                            {option.label}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {option.description}
                                        </p>
                                    </div>
                                </Label>
                            ))}
                        </RadioGroup>
                        <div className="flex items-center justify-end gap-2">
                            <Button
                                type="button"
                                onClick={handlePayNow}
                                disabled={paying}
                            >
                                {paying ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Redirecting to payment...
                                    </>
                                ) : (
                                    <>
                                        <CreditCard className="mr-2 h-4 w-4" />
                                        Pay Now
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

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
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span className="font-medium">{formatCurrency(order.totalAmount, order.currency)}</span>
                        </div>
                        {order.offerDiscount > 0 && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Offer discount</span>
                                <span className="font-medium text-success">
                                    -{formatCurrency(order.offerDiscount, order.currency)}
                                </span>
                            </div>
                        )}
                        {order.discount > 0 && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Coupon discount</span>
                                <span className="font-medium text-success">
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

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Order Information</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="rounded-lg border p-4">
                            <p className="text-xs text-muted-foreground">Status</p>
                            <OrderStatusBadge status={order.status} className="mt-1" />
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
                            <p className="text-xs text-muted-foreground">Shipping Address</p>
                            <p className="text-sm mt-1">{order.shippingAddress}</p>
                        </div>
                        <div className="rounded-lg border p-4">
                            <p className="text-xs text-muted-foreground">Coupon</p>
                            <p className="text-sm font-medium mt-1">{order.coupon ?? "—"}</p>
                        </div>
                        <div className="rounded-lg border p-4">
                            <p className="text-xs text-muted-foreground">Placed On</p>
                            <p className="text-sm font-medium mt-1">
                                {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <AlertDialog open={confirmCancel} onOpenChange={(open) => !open && setConfirmCancel(false)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cancel Order</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to cancel order #{orderLabel(order)}?
                            This action cannot be undone once the order is cancelled.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending}>Keep Order</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleCancel}
                            disabled={isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Cancelling...
                                </>
                            ) : (
                                "Yes, Cancel Order"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
