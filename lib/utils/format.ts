// Small display-formatting helpers shared across the storefront.

/** Backend short codes → customer-friendly labels (code kept for clarity).
 *  Manual methods are matched case-insensitively ("bkash-manual"). */
const PAYMENT_METHOD_LABELS: Record<string, string> = {
  COD: "Cash on Delivery (COD)",
  ONLINE: "Online Payment",
  "BKASH-MANUAL": "bKash (Manual)",
  "BANK-MANUAL": "Bank Transfer (Manual)",
}

/**
 * Renders a payment method in full words — the backend stores short codes
 * ("COD" / "Online") but customers and staff read "Cash on Delivery" far
 * more easily on invoices, receipts and order pages.
 */
export function paymentMethodLabel(method?: string | null): string {
  if (!method) return "—"
  return PAYMENT_METHOD_LABELS[method.toUpperCase()] ?? method
}
