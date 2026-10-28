"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
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
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { formatCurrency } from "@/lib/utils/currency";
import { stripeInit, sslCommerzInit, bkashInit } from "@/lib/services/payment";
import { isErrorResult } from "@/lib/utils/result";
import {
    CheckCircle2,
    Copy,
    ExternalLink,
    Loader2,
} from "lucide-react";
import type { Order } from "@/lib/types/backend";

const PROVIDERS = [
    {
        id: "stripe",
        label: "Stripe",
        description: "Pay securely with a card.",
        logo: "/images/stripe-pay-logo.png",
    },
    {
        id: "sslcommerz",
        label: "SSLCommerz",
        description: "Bangladesh online payment gateway.",
        logo: "/images/sslcommerz-pay-logo.png",
    },
    {
        id: "bkash",
        label: "bKash",
        description: "Bangladesh mobile wallet.",
        logo: "/images/bkash-pay-logo.png",
    },
] as const;

type ProviderId = (typeof PROVIDERS)[number]["id"];

interface OrderPaymentActionsProps {
    order: Order;
}

export function OrderPaymentActions({ order }: OrderPaymentActionsProps) {
    const [provider, setProvider] = useState<ProviderId>("stripe");
    const [isPending, startTransition] = useTransition();
    const [gatewayUrl, setGatewayUrl] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const online = order.paymentMethod === "Online";
    const paid = order.paymentStatus === "Paid";

    const initPayment = () => {
        startTransition(async () => {
            setGatewayUrl(null);
            try {
                let result: Awaited<ReturnType<typeof stripeInit>>;
                if (provider === "stripe") {
                    result = await stripeInit(order._id, {
                        amount: order.finalAmount,
                        currency: order.currency || "usd",
                    });
                } else if (provider === "sslcommerz") {
                    result = await sslCommerzInit(order._id, {
                        total_amount: order.finalAmount,
                        cus_name:
                            order.recipientName ?? order.user?.name ?? "",
                        cus_email: order.user?.email ?? "",
                        cus_phone: order.phoneNo ?? "",
                        cus_add1: order.shippingAddress || "",
                        cus_city: "",
                        cus_state: "",
                        cus_postcode: "",
                        cus_country: "Bangladesh",
                        ship_name:
                            order.recipientName ?? order.user?.name ?? "",
                        ship_add1: order.shippingAddress || "",
                        ship_city: "",
                        ship_state: "",
                        ship_postcode: "",
                        ship_country: "Bangladesh",
                    });
                } else {
                    // bKash requires the customer's number to send the payment request.
                    result = await bkashInit(order._id, {
                        amount: order.finalAmount,
                        customerNumber: order.phoneNo ?? "",
                    });
                }
                if (isErrorResult(result)) {
                    toast.error(result.message);
                    return;
                }
                const url = result.data?.gatewayUrl;
                if (!url) {
                    toast.error(result.data?.message ?? "No payment link returned");
                    return;
                }
                setGatewayUrl(url);
                toast.success("Payment link generated");
            } catch {
                toast.error("Failed to initiate payment. Please try again.");
            }
        });
    };

    const copyLink = async () => {
        if (!gatewayUrl) return;
        try {
            await navigator.clipboard.writeText(gatewayUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            const input = document.createElement("textarea");
            input.value = gatewayUrl;
            document.body.appendChild(input);
            input.select();
            document.execCommand("copy");
            document.body.removeChild(input);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (!online || paid) return null;

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <CardTitle className="text-base">Payment</CardTitle>
                    <Badge variant="outline" className="text-xs">
                        {order.paymentStatus}
                    </Badge>
                </div>
                <CardDescription>
                    This order hasn&apos;t been paid yet. Choose a gateway to
                    generate a payment link, then send it to the customer
                    manually.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <RadioGroup
                    value={provider}
                    onValueChange={(value) =>
                        setProvider(value as ProviderId)
                    }
                    className="grid grid-cols-1 sm:grid-cols-3 gap-3"
                >
                    {PROVIDERS.map((option) => (
                        <Label
                            key={option.id}
                            className="flex cursor-pointer items-center gap-3 rounded-lg border p-4 has-data-[state=checked]:border-primary"
                        >
                            <RadioGroupItem value={option.id} />
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
                    <span className="text-sm text-muted-foreground">
                        {formatCurrency(order.finalAmount, order.currency)}
                    </span>
                    <Button
                        type="button"
                        onClick={initPayment}
                        disabled={isPending}
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            "Generate Link"
                        )}
                    </Button>
                </div>

                {gatewayUrl && (
                    <div className="rounded-lg border p-4 space-y-3 bg-muted/30">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <CheckCircle2 className="h-4 w-4 text-success" />
                                Payment link ready
                            </div>
                            <span className="text-xs text-muted-foreground tabular-nums">
                                {formatCurrency(order.finalAmount, order.currency)}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 rounded-md border bg-background px-3 py-2 text-xs font-mono text-muted-foreground truncate">
                                {gatewayUrl}
                            </div>
                            <Button
                                variant="outline"
                                size="icon"
                                className="shrink-0"
                                onClick={copyLink}
                                aria-label="Copy payment link"
                                title="Copy payment link"
                            >
                                {copied ? (
                                    <CheckCircle2 className="h-4 w-4 text-success" />
                                ) : (
                                    <Copy className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5"
                            render={
                                <a
                                    href={gatewayUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                />
                            }
                        >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Open payment page
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
