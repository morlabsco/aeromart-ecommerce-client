"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { updateOrderPayment, updateOrderStatus } from "@/lib/services/order";
import { isErrorResult } from "@/lib/utils/result";
import { serverErrorMessage, notifyInvalidFields } from "@/lib/utils/form-feedback";
import { Loader2, Save } from "lucide-react";
import type { Order } from "@/lib/types/backend";

/* ---------------------------------------------------------------------------
 * Staff payment & status controls.
 *
 * The gateway payment-initiate feature (Stripe / SSLCommerz / bKash hosted
 * checkout link generation) is PARKED — the store currently runs COD +
 * manual bKash/Bank only. The original implementation is preserved in git
 * history and in the commented block at the bottom of this file; re-enable
 * by restoring the gateway radios + initPayment handler.
 *
 * What staff can do here (full independence over a customer-placed order):
 *   , switch the payment method between COD / bKash (Manual) / Bank (Manual)
 *   , attach/replace the manual payment reference (validated inputs)
 *   , set the payment status (Pending / Paid / Failed)
 *   , set the order status (Pending → … → Completed / Cancelled)
 * ------------------------------------------------------------------------- */

const PAYMENT_METHODS = [
    { value: "COD", label: "Cash on Delivery" },
    { value: "bkash-manual", label: "bKash (Manual)" },
    { value: "bank-manual", label: "Bank Transfer (Manual)" },
    // Gateway methods stay available for orders placed through them.
    { value: "Online", label: "Online (gateway)" },
] as const;

const PAYMENT_STATUSES = ["Pending", "Paid", "Failed"] as const;
const ORDER_STATUSES = [
    "Pending",
    "Processing",
    "Shipped",
    "Completed",
    "Cancelled",
] as const;

/** Note markers the checkout writes for manual payment references. */
const REF_PREFIXES = ["bKash (manual)", "Bank (manual)"];

interface OrderPaymentActionsProps {
    /** Live brand currency for amount display. */
    brandCurrency?: string;
    order: Order;
}

export function OrderPaymentActions({
    order,
    brandCurrency = "usd",
}: OrderPaymentActionsProps) {
    void brandCurrency; // amount display dropped with the parked gateway UI
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const [method, setMethod] = useState<string>(order.paymentMethod ?? "COD");
    const [paymentStatus, setPaymentStatus] = useState<string>(
        order.paymentStatus ?? "Pending",
    );
    const [status, setStatus] = useState<string>(order.status ?? "Pending");
    const [bkashSender, setBkashSender] = useState("");
    const [bkashTrxId, setBkashTrxId] = useState("");
    const [bankRef, setBankRef] = useState("");

    // Prefill any manual reference the customer attached at checkout so the
    // admin verifies what was submitted instead of re-typing it.
    const existingRefs = useMemo(() => {
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
    }, [order.notes]);
    if (bkashSender === "" && existingRefs.bkashSender) {
        setBkashSender(existingRefs.bkashSender);
        setBkashTrxId(existingRefs.bkashTrxId);
    }
    if (bankRef === "" && existingRefs.bankRef) {
        setBankRef(existingRefs.bankRef);
    }

    // A Completed/Cancelled order is frozen server-side — reflect that.
    const statusLocked =
        order.status === "Completed" || order.status === "Cancelled";

    /** Customer notes with any previous manual-reference lines stripped, so
     *  re-saving never duplicates the reference block. */
    const baseNotes = useMemo(() => {
        const parts = (order.notes ?? "")
            .split(" | ")
            .filter(
                (part) =>
                    part.trim() && !REF_PREFIXES.some((p) => part.startsWith(p)),
            );
        return parts;
    }, [order.notes]);

    const save = () => {
        // Manual methods need their verification reference — validate first.
        const invalid: string[] = [];
        const labels: Record<string, string> = {
            bkashSender: "bKash Sender Number",
            bkashTrxId: "bKash Transaction ID",
            bankRef: "Bank Reference",
        };
        if (method === "bkash-manual") {
            if (!bkashSender.trim()) invalid.push("bkashSender");
            if (!bkashTrxId.trim()) invalid.push("bkashTrxId");
        }
        if (method === "bank-manual" && !bankRef.trim()) {
            invalid.push("bankRef");
        }
        if (invalid.length) {
            notifyInvalidFields(invalid, labels, "save the payment");
            return;
        }

        // Rebuild the notes: customer's own note first, then the reference.
        const parts = [...baseNotes];
        if (method === "bkash-manual") {
            parts.push(
                `bKash (manual) — Sender: ${bkashSender.trim()}, TrxID: ${bkashTrxId.trim()}`,
            );
        }
        if (method === "bank-manual") {
            parts.push(`Bank (manual) — NPSB Ref: ${bankRef.trim()}`);
        }

        startTransition(async () => {
            const result = await updateOrderPayment(order._id, {
                paymentMethod: method,
                paymentStatus,
                notes: parts.join(" | "),
            });
            if (isErrorResult(result)) {
                toast.error(serverErrorMessage(result));
                return;
            }
            toast.success("Payment details updated");

            // Status change runs through its own endpoint (also validates the
            // frozen-state rules server-side).
            if (!statusLocked && status !== order.status) {
                const statusResult = await updateOrderStatus(order._id, status as never);
                if (isErrorResult(statusResult)) {
                    toast.error(serverErrorMessage(statusResult));
                    router.refresh();
                    return;
                }
                toast.success(`Order status , ${status}`);
            }
            router.refresh();
        });
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-base">Payment &amp; Status</CardTitle>
                    <Badge variant="outline" className="text-xs">
                        {order.paymentStatus}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                        {order.status}
                    </Badge>
                </div>
                <CardDescription>
                    Switch the payment method (COD / manual bKash / manual bank),
                    attach the transaction reference for manual methods, and set
                    the payment + order status by hand.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="space-y-1.5">
                        <Label className="text-xs">Payment Method</Label>
                        <Select
                            value={method}
                            onValueChange={(v) => setMethod(String(v ?? "COD"))}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Method" />
                            </SelectTrigger>
                            <SelectContent>
                                {PAYMENT_METHODS.map((option) => (
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

                    <div className="space-y-1.5">
                        <Label className="text-xs">Payment Status</Label>
                        <Select
                            value={paymentStatus}
                            onValueChange={(v) =>
                                setPaymentStatus(String(v ?? "Pending"))
                            }
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                {PAYMENT_STATUSES.map((option) => (
                                    <SelectItem key={option} value={option}>
                                        {option}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs">Order Status</Label>
                        <Select
                            value={status}
                            onValueChange={(v) => setStatus(String(v ?? "Pending"))}
                            disabled={statusLocked}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Order status" />
                            </SelectTrigger>
                            <SelectContent>
                                {ORDER_STATUSES.map((option) => (
                                    <SelectItem key={option} value={option}>
                                        {option}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {statusLocked && (
                            <p className="text-[11px] text-muted-foreground">
                                A {order.status.toLowerCase()} order can no longer
                                change status.
                            </p>
                        )}
                    </div>
                </div>

                {/* Manual reference inputs — shown for the matching method. */}
                {method === "bkash-manual" && (
                    <div className="grid grid-cols-1 gap-4 rounded-lg border border-border/60 bg-muted/30 p-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label className="text-xs">bKash Sender Number</Label>
                            <Input
                                value={bkashSender}
                                onChange={(e) => setBkashSender(e.target.value)}
                                placeholder="01XXXXXXXXX"
                                inputMode="tel"
                                aria-invalid={!bkashSender.trim()}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">bKash Transaction ID</Label>
                            <Input
                                value={bkashTrxId}
                                onChange={(e) => setBkashTrxId(e.target.value)}
                                placeholder="e.g. 9F7KD2LM1Q"
                                aria-invalid={!bkashTrxId.trim()}
                            />
                        </div>
                        <p className="text-[11px] text-muted-foreground sm:col-span-2">
                            Required , the reference is stored on the order notes
                            for verification.
                        </p>
                    </div>
                )}

                {method === "bank-manual" && (
                    <div className="grid grid-cols-1 gap-4 rounded-lg border border-border/60 bg-muted/30 p-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label className="text-xs">Bank / NPSB Reference</Label>
                            <Input
                                value={bankRef}
                                onChange={(e) => setBankRef(e.target.value)}
                                placeholder="NPSB reference number"
                                aria-invalid={!bankRef.trim()}
                            />
                        </div>
                        <p className="text-[11px] text-muted-foreground sm:col-span-2">
                            Required , the reference is stored on the order notes
                            for verification.
                        </p>
                    </div>
                )}

                <div className="flex items-center justify-end gap-2">
                    <Button
                        type="button"
                        onClick={save}
                        disabled={isPending}
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Save Changes
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

/* ── PARKED gateway payment-initiate UI (Stripe / SSLCommerz / bKash) ──────
 * Re-enable when the gateways come back:
 *   , import { stripeInit, sslCommerzInit, bkashInit } from "@/lib/services/payment";
 *   , render the gateway RadioGroup (logos in /images/*-pay-logo.png) and a
 *     "Generate Link" button calling the matching init service with
 *     order.finalAmount + the customer fields, then copy/open result.data.gatewayUrl.
 * The card above intentionally renders for EVERY order now — the old version
 * hid itself once paymentStatus === "Paid".
 * ────────────────────────────────────────────────────────────────────────── */
