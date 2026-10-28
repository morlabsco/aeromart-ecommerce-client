"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
    CheckCircle2,
    XCircle,
    Copy,
    Check,
    Home,
    ArrowRight,
    Download,
    Loader2,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useInvoiceDownload } from "@/hooks/use-invoice-download";

interface PaymentResultPageProps {
    outcome: "success" | "failed";
    searchParams: Promise<{ tran_id?: string }>;
}

/** Trims a long gateway transaction id to a readable form. */
function trimTransactionId(value: string, max = 20): string {
    if (value.length <= max) return value;
    return `${value.slice(0, max)}…${value.slice(-6)}`;
}

export function PaymentResultPage({ outcome, searchParams }: PaymentResultPageProps) {
    const [tranId, setTranId] = useState<string>("");
    const [copied, setCopied] = useState(false);
    const { downloadingId, downloadInvoice } = useInvoiceDownload();

    useEffect(() => {
        searchParams.then((params) => setTranId(params.tran_id ?? ""));
    }, [searchParams]);

    const isSuccess = outcome === "success";
    const showResult = isSuccess ? !!tranId : true;

    const copyTranId = async () => {
        if (!tranId) return;
        try {
            await navigator.clipboard.writeText(tranId);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback for browsers without the async clipboard API.
            const input = document.createElement("textarea");
            input.value = tranId;
            document.body.appendChild(input);
            input.select();
            document.execCommand("copy");
            document.body.removeChild(input);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    // Download on click through the shared hook , it calls getOrderInvoice,
    // verifies the result and renders the PDF via react-pdf exactly like the
    // dashboard. Uses ?by=transactionId so the backend resolves the tran_id
    // straight to the paid order's invoice. No fetch happens on page load.
    const handleInvoiceClick = useCallback(async () => {
        if (!tranId) return;
        await downloadInvoice(tranId, { by: "transactionId" });
    }, [tranId, downloadInvoice]);

    const invoiceLoading = downloadingId !== null;

    return (
        <div className="relative flex min-h-[80vh] w-full items-center justify-center overflow-hidden px-4 py-16">
            {/* Decorative background , theme-tinted */}
            <div
                className={cn(
                    "pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full blur-3xl",
                    isSuccess
                        ? "bg-primary/10 dark:bg-primary/15"
                        : "bg-destructive/10 dark:bg-destructive/15"
                )}
            />
            <div
                className={cn(
                    "pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full blur-3xl",
                    isSuccess
                        ? "bg-success/10"
                        : "bg-warning/10"
                )}
            />

            {!showResult ? (
                /* Guard rail: success without a tran_id */
                <div className="relative w-full max-w-lg rounded-2xl border bg-card p-10 text-center shadow-lg">
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                        <CheckCircle2 className="h-10 w-10 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                        Payment Received
                    </h1>
                    <p className="mx-auto mt-3 max-w-sm text-sm text-muted-foreground">
                        Your payment was processed, but we couldn't confirm the
                        transaction details. Your order is safe , check your
                        dashboard for the latest status.
                    </p>
                    <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                        <Link
                            href="/"
                            className={cn(
                                buttonVariants({ variant: "outline" }),
                                "inline-flex items-center gap-2"
                            )}
                        >
                            <Home className="h-4 w-4" />
                            Return Home
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="relative w-full max-w-lg">
                    {/* Gradient border , theme-aware */}
                    <div
                        className={cn(
                            "absolute -inset-px rounded-2xl bg-gradient-to-br",
                            isSuccess
                                ? "from-primary via-primary/70 to-success"
                                : "from-destructive via-destructive/70 to-warning"
                        )}
                    />
                    <div className="relative flex flex-col items-center rounded-2xl bg-card px-6 py-12 shadow-xl sm:px-10 sm:py-14">
                        {/* Icon */}
                        <div
                            className={cn(
                                "mb-6 flex h-24 w-24 items-center justify-center rounded-full sm:h-28 sm:w-28",
                                isSuccess ? "bg-primary/10" : "bg-destructive/10"
                            )}
                        >
                            {isSuccess ? (
                                <CheckCircle2 className="h-14 w-14 text-primary" />
                            ) : (
                                <XCircle className="h-14 w-14 text-destructive" />
                            )}
                        </div>

                        {/* Heading */}
                        <h1
                            className={cn(
                                "text-center text-3xl font-bold tracking-tight sm:text-4xl",
                                isSuccess ? "text-primary" : "text-destructive"
                            )}
                        >
                            {isSuccess ? "Payment Successful" : "Payment Failed"}
                        </h1>
                        <p className="mx-auto mt-3 max-w-sm text-center text-sm text-muted-foreground sm:text-base">
                            {isSuccess
                                ? "Thank you! Your payment was processed successfully."
                                : "We couldn't process your payment. Please try again or choose a different payment method."}
                        </p>

                        {/* Transaction id */}
                        {tranId && (
                            <div className="mt-6 flex w-full items-center justify-between gap-3 rounded-xl border bg-muted/50 px-4 py-3">
                                <div className="min-w-0 text-left">
                                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                        Transaction ID
                                    </p>
                                    <p
                                        className="truncate font-mono text-sm font-medium"
                                        title={tranId}
                                    >
                                        {trimTransactionId(tranId)}
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 shrink-0"
                                    onClick={copyTranId}
                                    aria-label="Copy transaction ID"
                                    title="Copy transaction ID"
                                >
                                    {copied ? (
                                        <Check className="h-4 w-4 text-primary" />
                                    ) : (
                                        <Copy className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="mt-8 flex w-full flex-col justify-center gap-3 sm:flex-row">
                            <Link
                                href="/"
                                className={cn(
                                    buttonVariants({ variant: "outline" }),
                                    "inline-flex items-center justify-center gap-2"
                                )}
                            >
                                <Home className="h-4 w-4" />
                                Continue Shopping
                            </Link>
                            {isSuccess && (
                                <Button
                                    type="button"
                                    onClick={handleInvoiceClick}
                                    disabled={invoiceLoading}
                                >
                                    {invoiceLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Preparing invoice...
                                        </>
                                    ) : (
                                        <>
                                            <Download className="mr-2 h-4 w-4" />
                                            Invoice
                                        </>
                                    )}
                                </Button>
                            )}
                            {!isSuccess && (
                                <Link
                                    href="/checkout"
                                    className={cn(
                                        buttonVariants(),
                                        "inline-flex items-center justify-center gap-2"
                                    )}
                                >
                                    <ArrowRight className="h-4 w-4" />
                                    Back to Checkout
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
