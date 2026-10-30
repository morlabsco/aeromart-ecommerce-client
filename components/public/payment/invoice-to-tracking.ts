import type {
  OrderInvoice,
  OrderTracking,
  PaymentStatus,
} from "@/lib/types/backend";

/**
 * Reshapes the backend's invoice JSON into the OrderTracking form the
 * order-success UI renders from, so the /payment/result pages can reuse the
 * exact same layout. `paymentStatus` is supplied by the caller — the success
 * page knows the gateway confirmed ("Paid"); the failed page passes the
 * order's pending/failed state.
 */
export function invoiceToTracking(
  invoice: OrderInvoice,
  paymentStatus: PaymentStatus
): OrderTracking {
  return {
    orderId: invoice.orderId,
    id: invoice.id,
    status: invoice.status,
    paymentStatus,
    paymentMethod: invoice.payment.method,
    paymentProvider: invoice.payment.provider ?? null,
    currency: invoice.currency,
    coupon: invoice.coupon,
    // Both payloads expose the subtotal BEFORE offer discounts (receipts
    // show: subtotal − offer − coupon + delivery = total).
    totalAmount: invoice.totals.subtotal,
    postOfferSubtotal:
      invoice.totals.subtotal - invoice.totals.offerDiscount,
    offerDiscount: invoice.totals.offerDiscount,
    discount: invoice.totals.discount,
    totalDiscount: invoice.totals.totalDiscount,
    deliveryCharge: invoice.totals.deliveryCharge,
    finalAmount: invoice.totals.finalAmount,
    recipientName: invoice.recipient.name,
    phoneNo: invoice.recipient.phoneNo,
    shippingAddress: invoice.recipient.shippingAddress,
    notes: invoice.recipient.notes,
    placedBy: invoice.customer.name,
    products: invoice.items,
    statusHistory: [],
    createdAt: invoice.issuedAt,
    updatedAt: invoice.issuedAt,
  };
}
