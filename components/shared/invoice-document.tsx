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
import { formatCurrency } from "@/lib/utils/currency";

interface InvoiceDocumentProps {
    invoice: OrderInvoice;
    brand: SettingsBrand;
}

function formatMoney(amount: number, currency: string): string {
    return formatCurrency(amount ?? 0, currency, {
        minimumFractionDigits: 2,
    });
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
        paddingBottom: 16,
        marginBottom: 20,
    },
    brandBlock: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    logo: {
        width: 44,
        height: 44,
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
    footer: {
        position: "absolute",
        bottom: 24,
        left: 36,
        right: 36,
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
 * (GET /order/:orderId/invoice) plus the shop brand settings.
 */
export function InvoiceDocument({ invoice, brand }: InvoiceDocumentProps) {
    const currency = invoice.currency;

    return (
        <Document
            title={`Invoice ${invoice.orderId}`}
            author={brand.name}
            subject={`Invoice for order ${invoice.orderId}`}
        >
            <Page size="A4" style={styles.page}>
                {/* Header: brand left, invoice meta right */}
                <View style={styles.header}>
                    <View style={styles.brandBlock}>
                        {brand.logo && (
                            <PdfImage src={brand.logo} style={styles.logo} />
                        )}
                        <View style={{ paddingVertical: 14 }}>
                            <Text style={styles.brandName}>{brand.name}</Text>
                            {brand.tagline && (
                                <Text style={styles.brandTagline}>
                                    {brand.tagline}
                                </Text>
                            )}
                        </View>
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

                {/* Billed to / Recipient / Payment */}
                <View style={styles.grid}>
                    <View style={styles.gridCol}>
                        <Text style={styles.blockTitle}>Billed To</Text>
                        <Text style={styles.blockText}>
                            {invoice.customer?.name ?? "—"}
                        </Text>
                        {invoice.customer?.email && (
                            <Text style={styles.blockMuted}>
                                {invoice.customer.email}
                            </Text>
                        )}
                        {invoice.customer?.phoneNo && (
                            <Text style={styles.blockMuted}>
                                {invoice.customer.phoneNo}
                            </Text>
                        )}
                        {invoice.customer?.address && (
                            <Text style={styles.blockMuted}>
                                {invoice.customer.address}
                            </Text>
                        )}
                    </View>
                    <View style={styles.gridCol}>
                        <Text style={styles.blockTitle}>Ship To</Text>
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
                            {invoice.payment?.method ?? "—"}
                        </Text>
                        {invoice.payment?.provider && (
                            <Text style={styles.blockMuted}>
                                {invoice.payment.provider}
                            </Text>
                        )}
                        {invoice.payment?.transactionId && (
                            <Text style={styles.blockMuted}>
                                TXN: {invoice.payment.transactionId}
                            </Text>
                        )}
                        <Text style={styles.blockMuted}>
                            Paid with {currency?.toUpperCase()}
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
                                    {formatMoney(item.unitPrice, currency)}
                                </Text>
                                <Text style={[styles.tdText, styles.colTotal]}>
                                    {formatMoney(item.total, currency)}
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
                            {formatMoney(
                                invoice.totals?.subtotal ?? 0,
                                currency,
                            )}
                        </Text>
                    </View>
                    {invoice.totals?.offerDiscount > 0 && (
                        <View style={[styles.totalRow, styles.totalRowMuted]}>
                            <Text>Offer Discount</Text>
                            <Text>
                                -
                                {formatMoney(
                                    invoice.totals.offerDiscount,
                                    currency,
                                )}
                            </Text>
                        </View>
                    )}
                    {invoice.totals?.discount > 0 && (
                        <View style={[styles.totalRow, styles.totalRowMuted]}>
                            <Text>Coupon Discount</Text>
                            <Text>
                                -
                                {formatMoney(
                                    invoice.totals.discount,
                                    currency,
                                )}
                            </Text>
                        </View>
                    )}
                    {invoice.totals?.totalDiscount > 0 && (
                        <View style={[styles.totalRow, styles.totalRowMuted]}>
                            <Text>Total Discount</Text>
                            <Text>
                                -
                                {formatMoney(
                                    invoice.totals.totalDiscount,
                                    currency,
                                )}
                            </Text>
                        </View>
                    )}
                    <View style={[styles.totalRow, styles.totalRowMuted]}>
                        <Text>Delivery Charge</Text>
                        <Text>
                            {formatMoney(
                                invoice.totals?.deliveryCharge ?? 0,
                                currency,
                            )}
                        </Text>
                    </View>
                    <View style={[styles.totalRow, styles.totalFinal]}>
                        <Text>Final Amount</Text>
                        <Text>
                            {formatMoney(
                                invoice.totals?.finalAmount ?? 0,
                                currency,
                            )}
                        </Text>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        {brand.name} , {brand.tagline}
                    </Text>
                    <Text style={styles.footerText}>
                        Thank you for your purchase!
                    </Text>
                </View>
            </Page>
        </Document>
    );
}
