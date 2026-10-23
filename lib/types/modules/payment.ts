// Payment module types, docs/v7-backend-usage-guide.md §9.

export interface PaymentInitResponse {
  success: boolean;
  gatewayUrl: string;
  sessionId?: string;
  message: string;
}

export interface StripeInitPayload {
  amount?: number;
  currency?: string;
}

export interface SslCommerzInitPayload {
  total_amount: number;
  product_name?: string;
  product_category?: string;
  currency?: string;
  cus_name: string;
  cus_email: string;
  cus_phone: string;
  cus_add1: string;
  cus_city: string;
  cus_state: string;
  cus_postcode: string;
  cus_country: string;
  ship_name: string;
  ship_add1: string;
  ship_city: string;
  ship_state: string;
  ship_postcode: string;
  ship_country: string;
}

export interface BkashInitPayload {
  amount: number;
  customerNumber: string;
}

export interface BkashValidatePayload {
  paymentID: string;
}

export interface BkashValidateResponse {
  success: boolean;
  transactionId: string;
  status: string;
  message: string;
}
