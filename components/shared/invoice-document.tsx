"use client";

import {
    Document,
    Image as PdfImage,
    Page,
    StyleSheet,
    Text,
    View,
} from "@react-pdf/renderer";
import type { OrderInvoice, SettingsBrand } from "@/lib/types/backend";
import { currencySymbol } from "@/lib/utils/currency";
import { paymentMethodLabel } from "@/lib/utils/format";

interface InvoiceDocumentProps {
    invoice: OrderInvoice;
    brand: SettingsBrand;
    /**
     * Live brand currency from settings — wins over the order's stamped
     * currency so every amount (and the currency note) matches the store.
     */
    currency?: string;
}

/**
 * PDF-safe currency rendering. react-pdf's built-in Helvetica cannot render
 * every glyph the browser can (the taka sign "৳" comes out broken), so the
 * invoice writes BDT as the character form "Tk." — other currencies keep
 * their regular symbol.
 */
const PDF_CURRENCY_SYMBOLS: Record<string, string> = {
    bdt: "Tk.",
};

/** The PDF-safe symbol for a currency code, e.g. "bdt" → "Tk.". */
function pdfSymbolFor(currency: string): string {
    return (
        PDF_CURRENCY_SYMBOLS[currency?.toLowerCase()] ??
        currencySymbol(currency)
    );
}

/** Money formatted for the PDF — "Tk. 1,240.00" for BDT, "$49.99" for USD. */
function formatPdfMoney(amount: number, currency: string): string {
    const symbol = pdfSymbolFor(currency);
    const number = (amount ?? 0).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    return symbol.endsWith(".")
        ? `${symbol} ${number}`
        : `${symbol}${number}`;
}

function formatDate(value: string): string {
    if (!value) return "—";
    const d = new Date(value);
    return Number.isNaN(d.getTime())
        ? value
        : d.toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
          });
}

/** Joins a variant's attribute pairs into a single line, e.g. "Color: Black · Size: M". */
function formatVariantAttributes(
    attributes?: Record<string, string>
): string {
    return Object.entries(attributes ?? {})
        .map(([k, v]) => `${k}: ${v}`)
        .join("  ·  ");
}

const styles = StyleSheet.create({
    page: {
        fontFamily: "Helvetica",
        fontSize: 10,
        color: "#18181b",
        padding: 36,
        lineHeight: 1.4,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        borderBottomWidth: 2,
        borderBottomColor: "#e4e4e7",
        paddingBottom: 6,
        marginBottom: 20,
    },
    brandBlock: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    logo: {
        width: 48,
        height: 48,
        objectFit: "contain",
    },
    logoOnly: {
        width: 120,
        height: 120,
        objectFit: "contain",
    },
    brandName: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#18181b",
    },
    brandTagline: {
        fontSize: 9,
        color: "#71717a",
        marginTop: 4,
    },
    invoiceTitle: {
        // Small breathing room under the page top — the Order # block reads
        // better slightly set into the header, next to the tall brand mark.
        marginTop: 8,
        textAlign: "right",
    },
    invoiceLabel: {
        fontSize: 20,
        fontWeight: "bold",
        textTransform: "uppercase",
        color: "#18181b",
    },
    invoiceMeta: {
        fontSize: 9,
        color: "#71717a",
        marginTop: 5,
    },
    grid: {
        flexDirection: "row",
        gap: 20,
        marginBottom: 20,
    },
    gridCol: {
        flex: 1,
    },
    blockTitle: {
        fontSize: 8,
        textTransform: "uppercase",
        letterSpacing: 0.6,
        color: "#71717a",
        marginBottom: 4,
        fontWeight: "bold",
    },
    blockText: {
        fontSize: 10,
        color: "#18181b",
    },
    blockMuted: {
        fontSize: 9,
        color: "#71717a",
    },
    table: {
        marginTop: 8,
        marginBottom: 16,
    },
    tableHead: {
        flexDirection: "row",
        backgroundColor: "#f4f4f5",
        paddingVertical: 8,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: "#d4d4d8",
    },
    tableRow: {
        flexDirection: "row",
        paddingVertical: 8,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: "#e4e4e7",
    },
    colName: { flex: 4 },
    colQty: { flex: 1, textAlign: "right" },
    colPrice: { flex: 2, textAlign: "right" },
    colTotal: { flex: 2, textAlign: "right" },
    thText: {
        fontSize: 8,
        textTransform: "uppercase",
        color: "#71717a",
        fontWeight: "bold",
    },
    tdText: {
        fontSize: 9.5,
    },
    tdName: {
        fontSize: 9.5,
        fontWeight: "bold",
    },
    tdVariant: {
        fontSize: 8,
        color: "#71717a",
        marginTop: 2,
        fontWeight: "normal",
    },
    totals: {
        marginTop: 8,
        marginLeft: "auto",
        width: "55%",
    },
    totalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 4,
        paddingHorizontal: 8,
        fontSize: 10,
    },
    totalRowMuted: {
        color: "#71717a",
    },
    totalFinal: {
        borderTopWidth: 2,
        borderTopColor: "#18181b",
        marginTop: 4,
        paddingTop: 8,
        fontWeight: "bold",
        fontSize: 12,
    },
    quote: {
        alignItems: "center",
        marginTop: 12,
    },
    quoteText: {
        fontSize: 11,
        fontStyle: "italic",
        color: "#52525b",
        textAlign: "center",
    },
    paymentInfo: {
        marginTop: 14,
        borderWidth: 1,
        borderColor: "#e4e4e7",
        borderRadius: 6,
        padding: 12,
        backgroundColor: "#fafafa",
    },
    paymentInfoTitle: {
        fontSize: 8,
        textTransform: "uppercase",
        letterSpacing: 0.8,
        fontWeight: "bold",
        color: "#71717a",
        marginBottom: 4,
    },
    paymentInfoText: {
        fontSize: 9,
        color: "#52525b",
    },
    footer: {
        marginTop: 14,
        borderTopWidth: 1,
        borderTopColor: "#e4e4e7",
        paddingTop: 8,
        flexDirection: "row",
        justifyContent: "space-between",
    },
    footerText: {
        fontSize: 8,
        color: "#a1a1aa",
    },
});

/**
 * React-pdf invoice document rendered from the backend's invoice JSON
 * (GET /order/:orderId/invoice) plus the shop brand settings. Money renders
 * in the LIVE brand currency (৳ for bdt), the brand block follows the
 * settings' logo-only mode, and the payment column spells methods out in
 * full ("Cash on Delivery") so customers and staff read it at a glance.
 */
export function InvoiceDocument({ invoice, brand, currency }: InvoiceDocumentProps) {
    const money = currency || invoice.currency;
    const isCod = invoice.payment.method === "COD";
    const isPaid = invoice.payment.status === "Paid";
    const logoOnly = brand.logoOnly && !!brand.logo;

    return (
        <Document
            title={`Invoice ${invoice.orderId}`}
            author={brand.name}
            subject={`Invoice for order ${invoice.orderId}`}
        >
            <Page size="A4" style={styles.page}>
                {/* Header: brand left (logo-only mode renders just the mark),
                    invoice meta right */}
                <View style={styles.header}>
                    <View style={styles.brandBlock}>
                        {brand.logo && (
                            <PdfImage
                                src={brand.logo}
                                style={logoOnly ? styles.logoOnly : styles.logo}
                            />
                        )}
                        {!logoOnly && (
                            <View style={{ paddingVertical: 14 }}>
                                <Text style={styles.brandName}>{brand.name}</Text>
                                {brand.tagline && (
                                    <Text style={styles.brandTagline}>
                                        {brand.tagline}
                                    </Text>
                                )}
                            </View>
                        )}
                    </View>
                    <View style={styles.invoiceTitle}>
                        <Text style={styles.invoiceLabel}>Invoice</Text>
                        <Text style={styles.invoiceMeta}>
                            Order #{invoice.orderId}
                        </Text>
                        <Text style={styles.invoiceMeta}>
                            Issued {formatDate(invoice.issuedAt)}
                        </Text>
                    </View>
                </View>

                {/* Billed to (recipient) / Payment */}
                <View style={styles.grid}>
                    <View style={styles.gridCol}>
                        <Text style={styles.blockTitle}>Billed to</Text>
                        <Text style={styles.blockText}>
                            {invoice.recipient?.name ?? "—"}
                        </Text>
                        {invoice.recipient?.phoneNo && (
                            <Text style={styles.blockMuted}>
                                {invoice.recipient.phoneNo}
                            </Text>
                        )}
                        {invoice.recipient?.shippingAddress && (
                            <Text style={styles.blockMuted}>
                                {invoice.recipient.shippingAddress}
                            </Text>
                        )}
                        {invoice.recipient?.notes && (
                            <Text style={styles.blockMuted}>
                                Notes: {invoice.recipient.notes}
                            </Text>
                        )}
                    </View>
                    <View style={styles.gridCol}>
                        <Text style={styles.blockTitle}>Payment</Text>
                        <Text style={styles.blockText}>
                            {paymentMethodLabel(invoice.payment?.method)}
                        </Text>
                        {invoice.payment?.provider && (
                            <Text style={styles.blockMuted}>
                                via {invoice.payment.provider}
                            </Text>
                        )}
                        {invoice.payment?.transactionId && (
                            <Text style={styles.blockMuted}>
                                TXN: {invoice.payment.transactionId}
                            </Text>
                        )}
                        <Text style={styles.blockMuted}>
                            Currency: {money.toUpperCase()} ({pdfSymbolFor(money)})
                        </Text>
                        <Text style={styles.blockMuted}>
                            {isPaid
                                ? "Payment: Paid"
                                : isCod
                                  ? "Payment: Due on delivery"
                                  : "Payment: Pending"}
                        </Text>
                    </View>
                </View>

                {/* Items table */}
                <View style={styles.table}>
                    <View style={styles.tableHead}>
                        <Text style={[styles.thText, styles.colName]}>
                            Product
                        </Text>
                        <Text style={[styles.thText, styles.colQty]}>Qty</Text>
                        <Text style={[styles.thText, styles.colPrice]}>
                            Unit Price
                        </Text>
                        <Text style={[styles.thText, styles.colTotal]}>
                            Total
                        </Text>
                    </View>
                    {(invoice.items ?? []).map((item, i) => {
                        const variantAttrs = item.variant
                            ? formatVariantAttributes(item.variant.attributes)
                            : "";
                        return (
                            <View
                                key={item.productId ?? i}
                                style={styles.tableRow}
                            >
                                <View style={[styles.colName]}>
                                    <Text style={styles.tdName}>{item.name}</Text>
                                    {item.variant && variantAttrs && (
                                        <Text style={styles.tdVariant}>
                                            {variantAttrs}
                                        </Text>
                                    )}
                                    {item.variant && (
                                        <Text style={styles.tdVariant}>
                                            SKU {item.variant.sku}
                                        </Text>
                                    )}
                                </View>
                                <Text style={[styles.tdText, styles.colQty]}>
                                    {item.quantity}
                                </Text>
                                <Text style={[styles.tdText, styles.colPrice]}>
                                    {formatPdfMoney(item.unitPrice, money)}
                                </Text>
                                <Text style={[styles.tdText, styles.colTotal]}>
                                    {formatPdfMoney(item.total, money)}
                                </Text>
                            </View>
                        );
                    })}
                </View>

                {/* Totals */}
                <View style={styles.totals}>
                    <View style={[styles.totalRow, styles.totalRowMuted]}>
                        <Text>Subtotal</Text>
                        <Text>
                            {formatPdfMoney(
                                invoice.totals?.subtotal ?? 0,
                                money,
                            )}
                        </Text>
                    </View>
                    {invoice.totals?.offerDiscount > 0 && (
                        <View style={[styles.totalRow, styles.totalRowMuted]}>
                            <Text>Offer Discount</Text>
                            <Text>
                                -
                                {formatPdfMoney(
                                    invoice.totals.offerDiscount,
                                    money,
                                )}
                            </Text>
                        </View>
                    )}
                    {invoice.totals?.discount > 0 && (
                        <View style={[styles.totalRow, styles.totalRowMuted]}>
                            <Text>Coupon Discount</Text>
                            <Text>
                                -
                                {formatPdfMoney(
                                    invoice.totals.discount,
                                    money,
                                )}
                            </Text>
                        </View>
                    )}
                    {invoice.totals?.totalDiscount > 0 && (
                        <View style={[styles.totalRow, styles.totalRowMuted]}>
                            <Text>Total Discount</Text>
                            <Text>
                                -
                                {formatPdfMoney(
                                    invoice.totals.totalDiscount,
                                    money,
                                )}
                            </Text>
                        </View>
                    )}
                    <View style={[styles.totalRow, styles.totalRowMuted]}>
                        <Text>Delivery Charge</Text>
                        <Text>
                            {formatPdfMoney(
                                invoice.totals?.deliveryCharge ?? 0,
                                money,
                            )}
                        </Text>
                    </View>
                    <View style={[styles.totalRow, styles.totalFinal]}>
                        <Text>Final Amount</Text>
                        <Text>
                            {formatPdfMoney(
                                invoice.totals?.finalAmount ?? 0,
                                money,
                            )}
                        </Text>
                    </View>
                </View>

                {/* Spacer — grows to push the closing sections to the very
                    bottom of the page (yoga flex within the fixed A4 page);
                    collapses naturally when the content itself is long. */}
                <View style={{ flexGrow: 1, minHeight: 16 }} />

                {/* Payment information */}
                <View style={styles.paymentInfo}>
                    <Text style={styles.paymentInfoTitle}>
                        Payment Information
                    </Text>
                    <Text style={styles.paymentInfoText}>
                        Please retain this invoice copy for your records.
                    </Text>
                    <Text style={styles.paymentInfoText}>
                        For order inquiries, contact our customer service.
                    </Text>
                </View>

                {/* Thank-you note — the very last line of the invoice */}
                <View style={styles.quote}>
                    <Text style={styles.quoteText}>
                        Thank you for shopping with us &mdash; your trust means
                        everything. We hope to serve you again soon!
                    </Text>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        {brand.name}
                        {brand.tagline ? ` , ${brand.tagline}` : ""}
                    </Text>
                    <Text style={styles.footerText}>
                        Invoice #{invoice.orderId}
                    </Text>
                </View>
            </Page>
        </Document>
    );
}
