"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { updateOrderStatus } from "@/lib/services/order";
import { isErrorResult } from "@/lib/utils/result";
import type { Order, OrderStatus } from "@/lib/types/backend";

const STATUS_OPTIONS: OrderStatus[] = [
    "Pending",
    "Processing",
    "Shipped",
    "Completed",
    "Cancelled",
];

interface UpdateOrderFormProps {
    order: Order;
}

export function UpdateOrderForm({ order }: UpdateOrderFormProps) {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [status, setStatus] = useState<OrderStatus>(order.status);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const result = await updateOrderStatus(order._id, status);

            if (isErrorResult(result)) {
                toast.error(result.message);
                return;
            }

            toast.success(result.message ?? "Order status updated successfully");
            router.push(`/dashboard/admin/orders/${order._id}`);
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
                    Order {order.orderId || order._id.slice(-8)}, update status
                </p>
            </div>

            <Card className="max-w-xl">
                <CardHeader>
                    <CardTitle className="text-base">Order Status</CardTitle>
                    <CardDescription>
                        Completed and cancelled orders cannot be changed.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={onSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select
                                value={status}
                                onValueChange={(value) =>
                                    setStatus((value ?? "Pending") as OrderStatus)
                                }
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {STATUS_OPTIONS.map((option) => (
                                        <SelectItem key={option} value={option}>
                                            {option}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button type="submit" disabled={submitting}>
                                {submitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    <>
                                        <ShoppingCart className="mr-2 h-4 w-4" />
                                        Update Status
                                    </>
                                )}
                            </Button>
                            <Button type="button" variant="outline" onClick={() => router.back()}>
                                Cancel
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
