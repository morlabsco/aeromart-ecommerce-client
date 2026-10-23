/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { apiRequest, toServiceResult } from "./api-client";
import type {
  BkashInitPayload,
  BkashValidatePayload,
  BkashValidateResponse,
  PaymentInitResponse,
  ServiceResult,
  SslCommerzInitPayload,
  StripeInitPayload,
} from "@/lib/types/backend";

export const stripeInit = async (
  orderId: string,
  payload: StripeInitPayload
): Promise<ServiceResult<PaymentInitResponse>> => {
  try {
    const result = await apiRequest<PaymentInitResponse>(
      `/payment/${orderId}/stripe/init`,
      {
        method: "POST",
        body: payload,
      }
    );
    return result;
  } catch (error: any) {
    return toServiceResult(error);
  }
};

export const sslCommerzInit = async (
  orderId: string,
  payload: SslCommerzInitPayload
): Promise<ServiceResult<PaymentInitResponse>> => {
  try {
    const result = await apiRequest<PaymentInitResponse>(
      `/payment/${orderId}/sslcommerz/init`,
      {
        method: "POST",
        body: payload,
      }
    );
    return result;
  } catch (error: any) {
    return toServiceResult(error);
  }
};

export const bkashInit = async (
  orderId: string,
  payload: BkashInitPayload
): Promise<ServiceResult<PaymentInitResponse>> => {
  try {
    const result = await apiRequest<PaymentInitResponse>(
      `/payment/${orderId}/bkash/init`,
      {
        method: "POST",
        body: payload,
      }
    );
    return result;
  } catch (error: any) {
    return toServiceResult(error);
  }
};

export const bkashValidate = async (
  payload: BkashValidatePayload
): Promise<ServiceResult<BkashValidateResponse>> => {
  try {
    const result = await apiRequest<BkashValidateResponse>(
      "/payment/bkash/validate",
      {
        method: "POST",
        body: payload,
      }
    );
    return result;
  } catch (error: any) {
    return toServiceResult(error);
  }
};
