import { getOrderInvoice, trackOrder } from "@/lib/services/order";
import { unwrapData } from "@/lib/services/api-client";
import { invoiceToTracking } from "./invoice-to-tracking";
import type { OrderTracking, PaymentStatus } from "@/lib/types/backend";

/**
 * Resolves the order a payment-result page is about, server-side. Both keys
 * are supported and checked in order of authority:
 *
 *  - `tranId` — the gateway transaction id the backend redirected with
 *    (`?tran_id=`), resolved through the invoice endpoint's `?by=
 *    transactionId` lookup.
 *  - `orderId` — the friendly order id (`?orderId=`), resolved through the
 *    PUBLIC tracking endpoint, so shared links work for guests too.
 *
 * Returns null when neither resolves — pages render their standalone
 * fallback. Server-only: imports the "use server" services.
 */
export async function resolvePaymentOrder(
  tranId?: string,
  orderId?: string
): Promise<OrderTracking | null> {
  if (tranId) {
    const invoice = unwrapData(
      await getOrderInvoice(tranId, { by: "transactionId" })
    );
    if (invoice) {
      const status: PaymentStatus =
        invoice.payment.status === "Paid"
          ? "Paid"
          : invoice.payment.status === "Failed"
            ? "Failed"
            : "Pending";
      return invoiceToTracking(invoice, status);
    }
  }

  if (orderId) {
    const order = unwrapData(await trackOrder(orderId));
    if (order) return order;
  }

  return null;
}
