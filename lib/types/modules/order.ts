// Order module types, docs/v7-backend-usage-guide.md §8.

export interface OrderProductItem {
  product: {
    _id: string;
    name: string;
    price: number;
  };
  quantity: number;
  unitPrice: number;
  /** Pre-offer unit price snapshot; legacy orders may lack it (→ unitPrice). */
  baseUnitPrice?: number;
  /** Present when the order line was placed with a specific product variant. */
  variant?: {
    sku: string;
    attributes?: Record<string, string>;
  };
}

export type OrderStatus =
  | "Pending"
  | "Processing"
  | "Shipped"
  | "Completed"
  | "Cancelled";

export type PaymentStatus = "Pending" | "Paid" | "Failed";

export type PaymentMethod =
  | "COD"
  | "Online"
  | "bkash-manual"
  | "bank-manual";

export type PaymentProvider = "stripe" | "sslcommerz" | "bkash" | null;

export interface Order {
  _id: string;
  orderId: string;
  user: {
    _id: string;
    name: string;
    email: string;
    /** Populated by the server (quick customer detail in tables). */
    photoUrl?: string | null;
  } | null;
  products: OrderProductItem[];
  coupon: string | null;
  /** Subtotal after product offers (unit prices already reflect active offerPrice). */
  totalAmount: number;
  /** Savings from active product offers vs base prices. */
  offerDiscount: number;
  /** Coupon savings only. */
  discount: number;
  /** offerDiscount + discount. */
  totalDiscount: number;
  deliveryCharge: number;
  finalAmount: number;
  currency: string;
  status: OrderStatus;
  shippingAddress: string;
  recipientName?: string;
  phoneNo?: string;
  notes?: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentProvider?: PaymentProvider;
  transactionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderPayload {
  /** When the product hasVariants, include `variant: { sku }` (guide §8.4). */
  products: { product: string; quantity: number; variant?: { sku: string } }[];
  coupon?: string;
  /** Delivery option name from brand settings; backend resolves the charge. */
  deliveryOptionName?: string;
  shippingAddress: string;
  recipientName: string;
  phoneNo: string;
  notes?: string;
  paymentMethod: PaymentMethod;
}

export interface OrderTrackingProduct {
  productId: string;
  name: string;
  image: string;
  quantity: number;
  /** Charged unit price — ALREADY offer-adjusted. */
  unitPrice: number;
  /** Pre-offer unit price snapshot (the struck-through "original"). Legacy
   *  orders fall back to unitPrice (no strike shown). */
  baseUnitPrice: number;
  total: number;
  /** Present when the order line was placed with a specific product variant. */
  variant?: {
    sku: string;
    attributes?: Record<string, string>;
  };
}

export interface OrderTrackingStatusHistory {
  status: OrderStatus;
  at: string;
}

export interface OrderTracking {
  orderId: string;
  id: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  paymentProvider: PaymentProvider;
  currency: string;
  /** Applied coupon code (null when none). */
  coupon: string | null;
  /** Subtotal BEFORE offer discounts (Σ base × qty) — the receipt's
   *  "Subtotal" row. totalAmount − offerDiscount − discount + delivery =
   *  finalAmount must always hold. */
  totalAmount: number;
  /** Subtotal AFTER offer discounts (what was actually charged for items). */
  postOfferSubtotal: number;
  /** Savings from active product offers vs base prices. */
  offerDiscount: number;
  /** Coupon savings only. */
  discount: number;
  /** offerDiscount + discount. */
  totalDiscount: number;
  deliveryCharge: number;
  finalAmount: number;
  recipientName: string;
  phoneNo: string;
  shippingAddress: string;
  notes: string;
  placedBy: string;
  products: OrderTrackingProduct[];
  statusHistory: OrderTrackingStatusHistory[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderInvoiceCustomer {
  name: string;
  email: string;
  phoneNo: string;
  address: string;
}

export interface OrderInvoiceRecipient {
  name: string;
  phoneNo: string;
  shippingAddress: string;
  notes: string;
}

export interface OrderInvoicePayment {
  method: PaymentMethod;
  provider: PaymentProvider;
  transactionId: string;
  /** Payment state at issue time — COD receipts are "Pending" until delivery. */
  status?: PaymentStatus;
}

export interface OrderInvoiceItem {
  productId: string;
  name: string;
  image: string;
  quantity: number;
  /** Charged unit price — ALREADY offer-adjusted. */
  unitPrice: number;
  /** Pre-offer unit price snapshot (legacy orders fall back to unitPrice). */
  baseUnitPrice: number;
  total: number;
  /** Present when the order line was placed with a specific product variant. */
  variant?: {
    sku: string;
    attributes?: Record<string, string>;
  };
}

export interface OrderInvoice {
  orderId: string;
  id: string;
  status: OrderStatus;
  currency: string;
  issuedAt: string;
  /** Applied coupon code (null when none). */
  coupon: string | null;
  customer: OrderInvoiceCustomer;
  recipient: OrderInvoiceRecipient;
  payment: OrderInvoicePayment;
  items: OrderInvoiceItem[];
  totals: {
    /** Subtotal BEFORE offer discounts (Σ base × qty). */
    subtotal: number;
    /** Savings from active product offers. */
    offerDiscount: number;
    /** Coupon savings only. */
    discount: number;
    /** offerDiscount + discount. */
    totalDiscount: number;
    deliveryCharge: number;
    finalAmount: number;
  };
}
