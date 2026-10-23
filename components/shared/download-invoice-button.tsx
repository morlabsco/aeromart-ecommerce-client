"use client";

import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useInvoiceDownload } from "@/hooks/use-invoice-download";

interface DownloadInvoiceButtonProps {
    /** Backend order _id (used to fetch the invoice JSON). */
    orderId: string;
    /** Button label; defaults to a compact icon button for tables. */
    label?: string;
    variant?: "outline" | "ghost";
    size?: "default" | "sm" | "icon";
    className?: string;
}

/**
 * Fetches the order's invoice JSON from the backend and downloads a
 * react-pdf generated PDF on the client.
 */
export function DownloadInvoiceButton({
    orderId,
    label,
    variant = "outline",
    size = "default",
    className,
}: DownloadInvoiceButtonProps) {
    const { downloadingId, downloadInvoice } = useInvoiceDownload();
    const loading = downloadingId === orderId;

    return (
        <Button
            type="button"
            variant={variant}
            size={size}
            className={className}
            onClick={() => downloadInvoice(orderId)}
            disabled={loading}
            aria-label={label ?? "Download invoice"}
        >
            {loading ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
                <Download className={label ? "mr-1.5 h-4 w-4" : "h-4 w-4"} />
            )}
            {label && (loading ? "Preparing..." : label)}
        </Button>
    );
}
