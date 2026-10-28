"use client";

import { useCallback, useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { toast } from "sonner";
import { InvoiceDocument } from "@/components/shared/invoice-document";
import { getOrderInvoice } from "@/lib/services/order";
import { getSettings } from "@/lib/services/settings";
import { unwrapData, isErrorResult } from "@/lib/utils/result";
import type { SettingsBrand } from "@/lib/types/backend";

/** Client-side hook: fetch an order's invoice JSON, render a PDF, download it. */
export function useInvoiceDownload() {
    const [downloadingId, setDownloadingId] = useState<string | null>(null);

    const downloadInvoice = useCallback(async (
        orderId: string,
        options?: { by?: "transactionId" }
    ) => {
        if (downloadingId) return;
        setDownloadingId(orderId);
        try {
            const [invoiceResult, settingsResult] = await Promise.all([
                getOrderInvoice(orderId, options),
                getSettings(),
            ]);

            if (isErrorResult(invoiceResult)) {
                toast.error(invoiceResult.message);
                return;
            }
            const invoice = invoiceResult.data;

            // Brand settings for the invoice header; fall back to a minimal brand.
            const settings = unwrapData(settingsResult);
            const brand: SettingsBrand =
                settings?.brand ?? {
                    name: "Attor",
                    tagline: "Premium Collection",
                    description: "",
                    niche: "",
                    nicheLabel: "",
                    logo: "",
                    favicon: "",
                };

            const blob = await pdf(
                <InvoiceDocument
                    invoice={invoice}
                    brand={brand}
                    currency={brand.currency}
                />
            ).toBlob();

            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `Invoice-${invoice.orderId || orderId}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast.success("Invoice downloaded successfully");
        } catch {
            toast.error("Failed to generate the invoice PDF. Please try again.");
        } finally {
            setDownloadingId(null);
        }
    }, [downloadingId]);

    return { downloadingId, downloadInvoice };
}
