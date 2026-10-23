// Order module types, docs/v7-backend-usage-guide.md §8.

export interface OrderProductItem {
  product: {
    _id: string;
    name: string;
    price: number;
  };
  quantity: number;
  unitPrice: number;
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

export type PaymentMethod = "COD" | "Online";

export type PaymentProvider = "stripe" | "sslcommerz" | "bkash" | null;

export interface Order {
  _id: string;
  orderId: string;
  user: {
    _id: string;
    name: string;
    email: string;
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
  unitPrice: number;
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
  totalAmount: number;
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
}

export interface OrderInvoiceItem {
  productId: string;
  name: string;
  image: string;
  quantity: number;
  unitPrice: number;
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
  customer: OrderInvoiceCustomer;
  recipient: OrderInvoiceRecipient;
  payment: OrderInvoicePayment;
  items: OrderInvoiceItem[];
  totals: {
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
