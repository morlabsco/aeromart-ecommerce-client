"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { DistrictCombobox } from "@/components/public/checkout/district-combobox";
import { UpazilaCombobox } from "@/components/public/checkout/upazila-combobox";
import {
    PhoneInput,
    isValidFullPhone,
} from "@/components/shared/phone-input";
import { BD_UPAZILAS } from "@/lib/data/bd-upazilas";
import { BD_DISTRICTS } from "@/lib/data/bd-districts";
import { updateOrderStatus, updateOrderDetails } from "@/lib/services/order";
import { isErrorResult } from "@/lib/utils/result";
import type { Order, OrderStatus } from "@/lib/types/backend";
import { serverErrorMessage } from "@/lib/utils/form-feedback";
import { paymentMethodLabel } from "@/lib/utils/format";
import { useDashboardBase } from "@/components/dashboard/v4/dashboard-user";

/* ---------------------------------------------------------------------------
 * Update Order (staff) — status + payment AND the delivery details in one
 * place. The address pieces (address line, upazila, district) split the
 * stored "…, Upazila, District, Bangladesh" string apart for editing and
 * recompose it on save, with the same searchable, clearable district/upazila
 * pickers the checkout uses.
 * ------------------------------------------------------------------------- */

const STATUS_OPTIONS: OrderStatus[] = [
    "Pending",
    "Processing",
    "Shipped",
    "Completed",
    "Cancelled",
];

const PAYMENT_STATUS_OPTIONS = ["Pending", "Paid", "Failed"] as const;

interface UpdateOrderFormProps {
    order: Order;
}

/** Splits a stored shipping address back into its editable parts. */
function parseAddress(shippingAddress: string): {
    address: string;
    upazila: string;
    district: string;
} {
    const parts = (shippingAddress ?? "")
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);
    // Match from the END: "…, [upazila], district, Bangladesh" is the
    // composed shape; older orders may carry looser strings.
    let district = "";
    let upazila = "";
    const rest = [...parts];
    if (rest.length && rest[rest.length - 1] === "Bangladesh") rest.pop();
    if (rest.length) {
        const maybeDistrict = rest[rest.length - 1];
        if (BD_DISTRICTS.includes(maybeDistrict)) {
            district = maybeDistrict;
            rest.pop();
        }
    }
    if (rest.length && district) {
        const maybeUpazila = rest[rest.length - 1];
        if ((BD_UPAZILAS[district] ?? []).includes(maybeUpazila)) {
            upazila = maybeUpazila;
            rest.pop();
        }
    }
    return { address: rest.join(", "), upazila, district };
}

export function UpdateOrderForm({ order }: UpdateOrderFormProps) {
    const router = useRouter();
    const base = useDashboardBase();
    const [submitting, setSubmitting] = useState(false);

    // ── Status + payment ──
    const [status, setStatus] = useState<OrderStatus>(order.status);
    const [paymentStatus, setPaymentStatus] = useState<string>(
        order.paymentStatus ?? "Pending",
    );

    // ── Delivery details ──
    const parsed = useMemo(
        () => parseAddress(order.shippingAddress ?? ""),
        [order.shippingAddress],
    );
    const [recipientName, setRecipientName] = useState(
        order.recipientName ?? "",
    );
    const [phoneNo, setPhoneNo] = useState(order.phoneNo ?? "");
    const [address, setAddress] = useState(parsed.address);
    const [district, setDistrict] = useState(parsed.district);
    const [upazila, setUpazila] = useState(parsed.upazila);

    const paymentChanged = paymentStatus !== order.paymentStatus;
    const statusChanged = status !== order.status;
    const detailsChanged =
        recipientName !== (order.recipientName ?? "") ||
        phoneNo !== (order.phoneNo ?? "") ||
        [address, upazila, district].join(" | ") !==
            [parsed.address, parsed.upazila, parsed.district].join(" | ");
    // Final states are frozen server-side; payment status stays editable so a
    // late verification can still be recorded on a completed order.
    const statusLocked =
        order.status === "Completed" || order.status === "Cancelled";
    const detailsLocked = order.status === "Cancelled";

    const composedAddress = [
        address.trim(),
        upazila.trim(),
        district.trim(),
        "Bangladesh",
    ]
        .filter(Boolean)
        .join(", ");

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!statusChanged && !paymentChanged && !detailsChanged) {
            toast.info("Nothing to update , change something first.");
            return;
        }
        if (detailsChanged && !detailsLocked) {
            if (recipientName.trim().length < 2) {
                toast.error("Recipient name is required.");
                return;
            }
            if (!isValidFullPhone(phoneNo)) {
                toast.error("Enter a valid mobile number for the recipient.");
                return;
            }
            if (address.trim().length < 4) {
                toast.error("The address line is too short.");
                return;
            }
            if (!district.trim()) {
                toast.error("Select a district.");
                return;
            }
            if (!upazila.trim()) {
                toast.error("Select an upazila.");
                return;
            }
        }

        setSubmitting(true);
        try {
            if (statusChanged && !statusLocked) {
                const result = await updateOrderStatus(order._id, status);
                if (isErrorResult(result)) {
                    toast.error(serverErrorMessage(result));
                    return;
                }
            }

            // Payment + details ride the same PATCH (payment works on
            // completed orders too; the server guards the rest).
            const patch: Record<string, unknown> = {};
            if (paymentChanged) patch.paymentStatus = paymentStatus;
            if (detailsChanged && !detailsLocked) {
                patch.recipientName = recipientName.trim();
                patch.phoneNo = phoneNo;
                patch.shippingAddress = composedAddress;
            }
            if (Object.keys(patch).length > 0) {
                const result = await updateOrderDetails(order._id, patch);
                if (isErrorResult(result)) {
                    toast.error(serverErrorMessage(result));
                    return;
                }
            }

            toast.success("Order updated successfully");
            router.push(`${base}/orders/${order._id}`);
            router.refresh();
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Update Order</h2>
                <p className="text-sm text-muted-foreground mt-1">
                    Order {order.orderId || order._id.slice(-8)} , status,
                    payment and delivery details
                </p>
            </div>

            <Card className="max-w-xl">
                <CardHeader>
                    <CardTitle className="text-base">Status &amp; Payment</CardTitle>
                    <CardDescription>
                        Order status locks on completed/cancelled; payment status
                        stays editable for late verifications.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Order status</Label>
                        <Select
                            value={status}
                            onValueChange={(value) =>
                                setStatus((value ?? "Pending") as OrderStatus)
                            }
                            disabled={statusLocked}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue>
                                    {(value) => String(value ?? "Pending")}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {STATUS_OPTIONS.map((option) => (
                                    <SelectItem key={option} value={option}>
                                        {option}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {statusLocked && (
                            <p className="text-[11px] text-muted-foreground">
                                A {order.status.toLowerCase()} order can no
                                longer change status.
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>Payment status</Label>
                        <Select
                            value={paymentStatus}
                            onValueChange={(value) =>
                                setPaymentStatus(String(value ?? "Pending"))
                            }
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue>
                                    {(value) => String(value ?? "Pending")}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {PAYMENT_STATUS_OPTIONS.map((option) => (
                                    <SelectItem key={option} value={option}>
                                        {option}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-[11px] text-muted-foreground">
                            Currently {order.paymentStatus} ,{" "}
                            {paymentMethodLabel(order.paymentMethod)}.
                        </p>
                    </div>
                </CardContent>
            </Card>

            <Card className="max-w-xl">
                <CardHeader>
                    <CardTitle className="text-base">Delivery Details</CardTitle>
                    <CardDescription>
                        {detailsLocked
                            ? "Cancelled orders keep their recorded address."
                            : "Saved as “Road…, Upazila, District, Bangladesh”."}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="recipientName">Recipient name</Label>
                        <Input
                            id="recipientName"
                            value={recipientName}
                            onChange={(e) => setRecipientName(e.target.value)}
                            disabled={detailsLocked}
                            placeholder="Rahim Uddin"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Mobile number</Label>
                        <PhoneInput
                            value={phoneNo}
                            onChange={setPhoneNo}
                            lockCountry={detailsLocked}
                            aria-label="Recipient mobile number"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>District</Label>
                        <DistrictCombobox
                            value={district}
                            clearable={!detailsLocked}
                            onChange={(next) => {
                                setDistrict(next);
                                setUpazila("");
                            }}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Upazila</Label>
                        <UpazilaCombobox
                            district={district}
                            value={upazila}
                            clearable={!detailsLocked}
                            onChange={setUpazila}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="address">Address (road / house / area)</Label>
                        <Input
                            id="address"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            disabled={detailsLocked}
                            placeholder="Road No. 12, House 4, Ambarkhana"
                        />
                        {composedAddress && (
                            <p className="text-[11px] text-muted-foreground">
                                Will be saved as “{composedAddress}”.
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>

            <form onSubmit={onSubmit} className="max-w-xl">
                <div className="flex gap-2 pt-2">
                    <Button
                        type="submit"
                        disabled={
                            submitting ||
                            (!statusChanged && !paymentChanged && !detailsChanged)
                        }
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Updating...
                            </>
                        ) : (
                            <>
                                <ShoppingCart className="mr-2 h-4 w-4" />
                                Update Order
                            </>
                        )}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        Cancel
                    </Button>
                </div>
            </form>
        </div>
    );
}
