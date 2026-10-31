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
import { updateOrder, updateOrderPayment } from "@/lib/services/order";
import { DownloadInvoiceButton } from "@/components/shared/download-invoice-button";
import { OrderStatusBadge } from "@/components/shared/order-status-badge";
import { isErrorResult } from "@/lib/utils/result";
import type { Order } from "@/lib/types/backend";
import { paymentMethodLabel } from "@/lib/utils/format";
import {
    serverErrorMessage,
    notifyInvalidFields,
} from "@/lib/utils/form-feedback";
import {
    PhoneInput,
    isValidFullPhone,
} from "@/components/shared/phone-input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

/** Methods a customer may switch their own order between. */
const CUSTOMER_METHODS = [
    { value: "COD", label: "Cash on Delivery" },
    { value: "bkash-manual", label: "bKash (Manual)" },
    { value: "bank-manual", label: "Bank Transfer (Manual)" },
] as const;

/** Note markers the checkout writes for manual payment references. */
const REF_PREFIXES = ["bKash (manual)", "Bank (manual)"];

const CANCELLABLE: string[] = ["Pending", "Processing", "Shipped"];

function orderLabel(order: Order): string {
  return order.orderId || order._id.slice(-8);
}

interface CustomerOrderDetailsProps {
    /** Live brand currency — prices render in it, the order's own (possibly
     * stale) stamp is only a fallback. */
    brandCurrency?: string;
    order: Order;
}

export function CustomerOrderDetails({ order, brandCurrency = "usd" }: CustomerOrderDetailsProps) {
    const currency = brandCurrency ?? order.currency;
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [confirmCancel, setConfirmCancel] = useState(false);

    // Manual-payment reference form (owner can switch method / attach refs).
    const [method, setMethod] = useState<string>(order.paymentMethod ?? "COD");
    const [bkashSender, setBkashSender] = useState("");
    const [bkashTrxId, setBkashTrxId] = useState("");
    const [bankRef, setBankRef] = useState("");
    const [paying, setPaying] = useState(false);

    const canCancel = CANCELLABLE.includes(order.status);
    // The owner may adjust payment while the order is open and unpaid.
    const canEditPayment =
        order.paymentStatus !== "Paid" &&
        !["Completed", "Cancelled"].includes(order.status);

    // Prefill any manual reference already attached to the order.
    const existingRefs = (() => {
        const notes = order.notes ?? "";
        const bkash = notes.match(
            /bKash \(manual\) — Sender: ([^,]+), TrxID: ([^\s|]+)/,
        );
        const bank = notes.match(/Bank \(manual\) — NPSB Ref: ([^\s|]+)/);
        return {
            bkashSender: bkash?.[1] ?? "",
            bkashTrxId: bkash?.[2] ?? "",
            bankRef: bank?.[1] ?? "",
        };
    })();
    if (bkashSender === "" && existingRefs.bkashSender) {
        setBkashSender(existingRefs.bkashSender);
        setBkashTrxId(existingRefs.bkashTrxId);
    }
    if (bankRef === "" && existingRefs.bankRef) {
        setBankRef(existingRefs.bankRef);
    }

    const savePayment = () => {
        const invalid: string[] = [];
        const labels: Record<string, string> = {
            bkashSender: "bKash Sender Number",
            bkashTrxId: "bKash Transaction ID",
            bankRef: "Bank Reference",
        };
        if (method === "bkash-manual") {
            if (!bkashSender.trim() || !isValidFullPhone(bkashSender))
                invalid.push("bkashSender");
            if (!bkashTrxId.trim()) invalid.push("bkashTrxId");
        }
        if (method === "bank-manual" && !bankRef.trim()) {
            invalid.push("bankRef");
        }
        if (invalid.length) {
            notifyInvalidFields(invalid, labels, "save the payment");
            return;
        }

        // Customer's own note survives; the reference block is rebuilt.
        const parts = (order.notes ?? "")
            .split(" | ")
            .filter(
                (part) =>
                    part.trim() && !REF_PREFIXES.some((p) => part.startsWith(p)),
            );
        if (method === "bkash-manual") {
            parts.push(
                `bKash (manual) — Sender: ${bkashSender.trim()}, TrxID: ${bkashTrxId.trim()}`,
            );
        }
        if (method === "bank-manual") {
            parts.push(`Bank (manual) — NPSB Ref: ${bankRef.trim()}`);
        }

        setPaying(true);
        startTransition(async () => {
            const result = await updateOrderPayment(order._id, {
                paymentMethod: method,
                notes: parts.join(" | "),
            });
            setPaying(false);
            if (isErrorResult(result)) {
                toast.error(serverErrorMessage(result));
                return;
            }
            toast.success(
                method === "COD"
                    ? "Payment method set to Cash on Delivery , pay the rider on delivery."
                    : "Reference submitted , our team will verify and confirm your payment.",
            );
            router.refresh();
        });
    };

    const handleCancel = () => {
        startTransition(async () => {
            const result = await updateOrder(order._id, { status: "Cancelled" });
            setConfirmCancel(false);
            if (isErrorResult(result)) {
                toast.error(serverErrorMessage(result));
                return;
            }
            toast.success(result.message ?? "Order cancelled successfully");
            router.refresh();
        });
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

            {canEditPayment ? (
                /* ── Payment method + manual reference (the gateways are
                 *    parked — customers switch between COD and the manual
                 *    methods and attach their transaction reference) ── */
                <Card>
                    <CardHeader>
                        <div className="flex flex-wrap items-center gap-2">
                            <CardTitle className="text-base">Payment</CardTitle>
                            <Badge variant="outline" className="text-xs">
                                <span className="mr-1 font-semibold text-muted-foreground">
                                    Payment:
                                </span>{" "}
                                {order.paymentStatus}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                                <span className="mr-1 font-semibold text-muted-foreground">
                                    Order:
                                </span>{" "}
                                {order.status}
                            </Badge>
                        </div>
                        <CardDescription>
                            Switch how you pay for{" "}
                            <span className="font-medium text-foreground">
                                {formatCurrency(order.finalAmount, currency)}
                            </span>{" "}
                            , manual payments are verified by our team once you
                            send the reference.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="max-w-sm space-y-1.5">
                            <Label className="text-xs">Payment Method</Label>
                            <Select
                                value={method}
                                onValueChange={(v) => setMethod(String(v ?? "COD"))}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Method">
                                        {(value) =>
                                            CUSTOMER_METHODS.find(
                                                (option) =>
                                                    option.value ===
                                                    String(value ?? ""),
                                            )?.label ??
                                            paymentMethodLabel(String(value ?? ""))
                                        }
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {CUSTOMER_METHODS.map((option) => (
                                        <SelectItem
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {method === "bkash-manual" && (
                            <div className="grid grid-cols-1 gap-4 rounded-lg border border-border/60 bg-muted/30 p-4 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label className="text-xs">
                                        Your bKash Number
                                    </Label>
                                    <PhoneInput
                                        value={bkashSender}
                                        onChange={setBkashSender}
                                        invalid={!bkashSender.trim()}
                                        aria-label="bKash sender number"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">
                                        Transaction ID
                                    </Label>
                                    <Input
                                        value={bkashTrxId}
                                        onChange={(e) =>
                                            setBkashTrxId(e.target.value)
                                        }
                                        placeholder="e.g. 9F7KD2LM1Q"
                                        aria-invalid={!bkashTrxId.trim()}
                                    />
                                </div>
                                <p className="text-[11px] text-muted-foreground sm:col-span-2">
                                    Required , we verify this reference before
                                    confirming your payment.
                                </p>
                            </div>
                        )}

                        {method === "bank-manual" && (
                            <div className="grid grid-cols-1 gap-4 rounded-lg border border-border/60 bg-muted/30 p-4 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label className="text-xs">
                                        Bank / NPSB Reference
                                    </Label>
                                    <Input
                                        value={bankRef}
                                        onChange={(e) =>
                                            setBankRef(e.target.value)
                                        }
                                        placeholder="NPSB reference number"
                                        aria-invalid={!bankRef.trim()}
                                    />
                                </div>
                                <p className="text-[11px] text-muted-foreground sm:col-span-2">
                                    Required , we verify this reference before
                                    confirming your payment.
                                </p>
                            </div>
                        )}

                        <div className="flex items-center justify-end">
                            <Button
                                type="button"
                                variant="brand"
                                onClick={savePayment}
                                disabled={paying || isPending}
                            >
                                {paying || isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    "Save Payment Details"
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                order.paymentStatus !== "Paid" && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Payment</CardTitle>
                            <CardDescription>
                                This order is {order.status.toLowerCase()} and
                                payment can no longer be changed here , contact
                                support if something looks wrong.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                )
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
                                    {item.product.slug ? (
                                        <Link
                                            href={`/products/${item.product.slug}`}
                                            className="text-sm font-medium underline-offset-4 transition-colors hover:text-brand hover:underline"
                                        >
                                            {item.product.name}
                                        </Link>
                                    ) : (
                                        <p className="text-sm font-medium">{item.product.name}</p>
                                    )}
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
                                    <p className="mt-0.5 flex flex-wrap items-baseline gap-1.5 text-xs text-muted-foreground">
                                        <span>
                                            {item.quantity} ×{" "}
                                            {(item.baseUnitPrice ?? item.unitPrice) >
                                            item.unitPrice ? (
                                                <>
                                                    <span className="mr-1 line-through decoration-muted-foreground/60">
                                                        {formatCurrency(item.baseUnitPrice ?? item.unitPrice, currency)}
                                                    </span>
                                                    <span className="font-semibold text-foreground">
                                                        {formatCurrency(item.unitPrice, currency)}
                                                    </span>
                                                </>
                                            ) : (
                                                formatCurrency(item.unitPrice, currency)
                                            )}
                                        </span>
                                    </p>
                                </div>
                                <p className="text-sm font-medium tabular-nums">
                                    {formatCurrency(item.quantity * item.unitPrice, currency)}
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
                                {paymentMethodLabel(order.paymentMethod)}
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
