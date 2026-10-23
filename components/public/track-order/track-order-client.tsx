"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
    PackageSearch,
    Search,
    Loader2,
    MapPin,
    Package,
    CreditCard,
    Truck,
    CheckCircle2,
    User,
    Clock,
    FileText,
    Copy,
    Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trackOrder } from "@/lib/services/order";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/currency";
import type { OrderTracking, OrderStatus } from "@/lib/types/backend";
import { isErrorResult } from "@/lib/utils/result";

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
};

const STATUS_META: Record<
    OrderStatus,
    { color: string; step: number; label: string }
> = {
    Pending: { color: "bg-zinc-400", step: 0, label: "Pending" },
    Processing: { color: "bg-amber-400", step: 1, label: "Processing" },
    Shipped: { color: "bg-blue-400", step: 2, label: "Shipped" },
    Completed: { color: "bg-green-500", step: 3, label: "Completed" },
    Cancelled: { color: "bg-red-400", step: -1, label: "Cancelled" },
};

function formatDate(value: string): string {
    const d = new Date(value);
    return Number.isNaN(d.getTime())
        ? value
        : d.toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
          });
}

function statusBadge(status: OrderStatus) {
    const meta = STATUS_META[status] ?? STATUS_META.Pending;
    return (
        <Badge
            className={cn(
                "text-xs",
                status === "Completed" &&
                    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                status === "Shipped" &&
                    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                status === "Processing" &&
                    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                status === "Pending" &&
                    "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
                status === "Cancelled" &&
                    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
            )}
        >
            {meta.label}
        </Badge>
    );
}

interface TrackOrderClientProps {
    searchParams?: Promise<{ orderId?: string }>;
}

export function TrackOrderClient({ searchParams }: TrackOrderClientProps) {
    const [orderId, setOrderId] = useState("");
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<OrderTracking | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const loadedFromParam = useRef(false);

    // When arriving with ?orderId=..., prefill the input and search once.
    useEffect(() => {
        if (!searchParams || loadedFromParam.current) return;
        searchParams.then((params) => {
            const id = params.orderId?.trim();
            if (!id) return;
            loadedFromParam.current = true;
            setOrderId(id);
            void search(id);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    const search = async (id: string) => {
        const query = id.trim();
        if (!query) {
            toast.error("Please enter your order ID.");
            return;
        }
        setLoading(true);
        setError(null);
        setData(null);
        try {
            const result = await trackOrder(query);
            if (isErrorResult(result)) {
                setError(result.message);
                return;
            }
            setData(result.data);
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        await search(orderId);
    };

    const copyTrackLink = async () => {
        const url = `${window.location.origin}/track-order?orderId=${encodeURIComponent(
            orderId.trim()
        )}`;
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback for browsers without the async clipboard API.
            const input = document.createElement("textarea");
            input.value = url;
            document.body.appendChild(input);
            input.select();
            document.execCommand("copy");
            document.body.removeChild(input);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
            <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="show"
                className="text-center mb-10"
            >
                <div className="inline-flex rounded-full bg-primary/10 p-4 mb-4">
                    <PackageSearch className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                    Track Your Order
                </h1>
                <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
                    Enter your order ID (e.g.{" "}
                    <span className="font-mono text-sm">DEY2H7ULPD</span>) to
                    see the latest status and delivery updates.
                </p>
            </motion.div>

            {/* Search card */}
            <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="show"
                transition={{ delay: 0.1 }}
            >
                <Card className="max-w-xl mx-auto">
                    <CardContent className="p-4 sm:p-6">
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <div className="relative flex-1">
                                <PackageSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={orderId}
                                    onChange={(e) => setOrderId(e.target.value)}
                                    placeholder="Enter order ID"
                                    className="pl-9"
                                    aria-label="Order ID"
                                />
                            </div>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="shrink-0"
                            >
                                {loading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Search className="mr-2 h-4 w-4" />
                                )}
                                {loading ? "Tracking..." : "Track"}
                            </Button>
                        </form>
                        {orderId.trim() && (
                            <div className="mt-3 flex justify-end">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={copyTrackLink}
                                    className="shrink-0"
                                >
                                    {copied ? (
                                        <Check className="mr-1.5 h-3.5 w-3.5" />
                                    ) : (
                                        <Copy className="mr-1.5 h-3.5 w-3.5" />
                                    )}
                                    {copied ? "Copied!" : "Copy link"}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            <AnimatePresence mode="wait">
                {/* Loading state */}
                {loading && (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.35 }}
                        className="mt-10 flex flex-col items-center justify-center gap-4 py-12"
                    >
                        <div className="relative">
                            <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
                            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                                <Truck className="h-7 w-7 text-primary" />
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground animate-pulse">
                            Tracking your order...
                        </p>
                    </motion.div>
                )}

                {/* Error state */}
                {error && !loading && (
                    <motion.div
                        key="error"
                        variants={fadeUp}
                        initial="hidden"
                        animate="show"
                        className="mx-auto mt-10 max-w-xl rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center"
                    >
                        <PackageSearch className="mx-auto h-8 w-8 text-destructive" />
                        <h3 className="mt-3 font-semibold">Order not found</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{error}</p>
                        <p className="mt-2 text-xs text-muted-foreground/70">
                            Double-check the order ID and try again.
                        </p>
                    </motion.div>
                )}

                {/* Result */}
                {data && !loading && (
                    <motion.div
                        key="result"
                        variants={fadeUp}
                        initial="hidden"
                        animate="show"
                        className="mt-10 space-y-6"
                    >
                    {/* Header card */}
                    <Card>
                        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
                            <div>
                                <p className="text-xs text-muted-foreground">
                                    Order
                                </p>
                                <p className="font-mono text-lg font-bold">
                                    #{data.orderId}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Placed {formatDate(data.createdAt)}
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                {statusBadge(data.status)}
                                <Badge
                                    variant={
                                        data.paymentStatus === "Paid"
                                            ? "secondary"
                                            : "outline"
                                    }
                                    className="text-xs"
                                >
                                    {data.paymentStatus}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Progress steps */}
                    <Card>
                        <CardContent className="p-5 sm:p-6">
                            {data.status === "Cancelled" ? (
                                <div className="flex items-center justify-center gap-2 rounded-xl bg-destructive/10 p-4 text-destructive">
                                    <Package className="h-5 w-5" />
                                    <span className="font-medium">
                                        This order was cancelled.
                                    </span>
                                </div>
                            ) : (
                                <div className="relative flex items-center">
                                    {/* Connector line behind the steps */}
                                    <div className="absolute left-0 right-0 top-5 h-0.5 -translate-y-1/2 bg-border" />
                                    {[
                                        { label: "Placed", step: 0, icon: CheckCircle2 },
                                        { label: "Processing", step: 1, icon: Clock },
                                        { label: "Shipped", step: 2, icon: Truck },
                                        { label: "Completed", step: 3, icon: Package },
                                    ].map((s) => {
                                        const current = STATUS_META[data.status].step;
                                        const done = current >= s.step;
                                        const Icon = s.icon;
                                        return (
                                            <div
                                                key={s.label}
                                                className="relative z-10 flex flex-1 flex-col items-center"
                                            >
                                                <div
                                                    className={cn(
                                                        "flex h-10 w-10 items-center justify-center rounded-full border-2 bg-card transition-colors",
                                                        done
                                                            ? "border-primary bg-primary text-primary-foreground"
                                                            : "border-border bg-muted text-muted-foreground"
                                                    )}
                                                >
                                                    <Icon className="h-4 w-4" />
                                                </div>
                                                <p
                                                    className={cn(
                                                        "mt-2 text-xs font-medium",
                                                        done
                                                            ? "text-foreground"
                                                            : "text-muted-foreground"
                                                    )}
                                                >
                                                    {s.label}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Delivery + payment info */}
                    <div className="grid gap-6 sm:grid-cols-2">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <MapPin className="h-4 w-4 text-primary" />
                                    Delivery Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <span>
                                        {data.recipientName || data.placedBy || "—"}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span>{data.phoneNo || "—"}</span>
                                </div>
                                <p className="text-muted-foreground pt-1">
                                    {data.shippingAddress}
                                </p>
                                {data.notes && (
                                    <p className="text-xs text-muted-foreground pt-1">
                                        Notes: {data.notes}
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <CreditCard className="h-4 w-4 text-primary" />
                                    Payment Summary
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                        Subtotal
                                    </span>
                                    <span>
                                        {formatCurrency(data.totalAmount, data.currency)}
                                    </span>
                                </div>
                                {data.offerDiscount > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">
                                            Offer discount
                                        </span>
                                        <span className="font-medium text-emerald-600 dark:text-emerald-400">
                                            -{formatCurrency(data.offerDiscount, data.currency)}
                                        </span>
                                    </div>
                                )}
                                {data.discount > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">
                                            Coupon discount
                                        </span>
                                        <span className="font-medium text-emerald-600 dark:text-emerald-400">
                                            -{formatCurrency(data.discount, data.currency)}
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                        Total discount
                                    </span>
                                    <span>
                                        {data.totalDiscount > 0 ? "-" : ""}
                                        {formatCurrency(data.totalDiscount, data.currency)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                        Delivery
                                    </span>
                                    <span>{formatCurrency(data.deliveryCharge, data.currency)}</span>
                                </div>
                                <div className="flex justify-between border-t pt-2 font-semibold">
                                    <span>Total</span>
                                    <span>{formatCurrency(data.finalAmount, data.currency)}</span>
                                </div>
                                <p className="text-xs text-muted-foreground pt-1">
                                    Payment: {data.paymentMethod}
                                    {data.paymentProvider
                                        ? ` (${data.paymentProvider})`
                                        : ""}
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Items */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Package className="h-4 w-4 text-primary" />
                                Items
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {data.products.map((item, i) => (
                                <div
                                    key={i}
                                    className="flex items-center justify-between rounded-lg border p-3"
                                >
                                    <div className="flex items-center gap-3">
                                        {item.image ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                className="h-10 w-10 rounded object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                                                <FileText className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-sm font-medium">
                                                {item.name}
                                            </p>
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
                                            <p className="text-xs text-muted-foreground">
                                                {item.quantity} ×{" "}
                                                {formatCurrency(item.unitPrice, data.currency)}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-sm font-medium tabular-nums">
                                        {formatCurrency(item.total, data.currency)}
                                    </p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Status history */}
                    {data.statusHistory.length > 0 && (
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">
                                    Status History
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {data.statusHistory.map((h, i) => (
                                    <div
                                        key={i}
                                        className="flex items-start gap-3"
                                    >
                                        <div className="flex flex-col items-center">
                                            <div
                                                className={cn(
                                                    "mt-1 h-3 w-3 rounded-full",
                                                    STATUS_META[h.status]
                                                        ?.color ?? "bg-muted"
                                                )}
                                            />
                                            {i < data.statusHistory.length - 1 && (
                                                <div className="h-full w-0.5 bg-border" />
                                            )}
                                        </div>
                                        <div className="pb-4">
                                            <p className="text-sm font-medium">
                                                {h.status}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatDate(h.at)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
