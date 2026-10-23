/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { revalidateTag } from "next/cache";
import { apiRequest, toServiceResult } from "./api-client";
import type {
  CreateOrderPayload,
  ListQuery,
  Order,
  OrderInvoice,
  OrderStatus,
  OrderTracking,
  ServiceResult,
} from "@/lib/types/backend";

export const getAllOrders = async (
  query: ListQuery = {}
): Promise<ServiceResult<Order[]>> => {
  try {
    const params = new URLSearchParams(
      Object.entries(query)
        .filter(([, value]) => value !== undefined && value !== "")
        .map(([key, value]) => [key, String(value)])
    ).toString();

    const result = await apiRequest<Order[]>(
      `/order${params ? `?${params}` : ""}`,
      {
        tags: ["ORDER"],
      }
    );
    return result;
  } catch (error: any) {
    return toServiceResult(error);
  }
};

export const getMyOrders = async (
  query: ListQuery = {}
): Promise<ServiceResult<Order[]>> => {
  try {
    const params = new URLSearchParams(
      Object.entries(query)
        .filter(([, value]) => value !== undefined && value !== "")
        .map(([key, value]) => [key, String(value)])
    ).toString();

    const result = await apiRequest<Order[]>(
      `/order/my-orders${params ? `?${params}` : ""}`,
      {
        tags: ["ORDER"],
      }
    );
    return result;
  } catch (error: any) {
    return toServiceResult(error);
  }
};

export const getOrderById = async (
  orderId: string
): Promise<ServiceResult<Order>> => {
  try {
    const result = await apiRequest<Order>(`/order/${orderId}`, {
      tags: ["ORDER"],
    });
    return result;
  } catch (error: any) {
    return toServiceResult(error);
  }
};

/** GET /order/track-order/:orderId, public order tracking by friendly orderId or _id. */
export const trackOrder = async (
  orderId: string
): Promise<ServiceResult<OrderTracking>> => {
  try {
    const result = await apiRequest<OrderTracking>(
      `/order/track-order/${orderId}`,
      {
        skipAuth: true,
        tags: ["ORDER"],
      }
    );
    return result;
  } catch (error: any) {
    return toServiceResult(error);
  }
};

/** GET /order/:orderId/invoice, paid-only order invoice.
 *  Pass `{ by: "transactionId" }` to look up by the gateway tran_id
 *  (used on the payment success page); default is orderId/_id lookup. */
export const getOrderInvoice = async (
  orderId: string,
  options?: { by?: "transactionId" }
): Promise<ServiceResult<OrderInvoice>> => {
  try {
    const params = options?.by
      ? `?by=${encodeURIComponent(options.by)}`
      : "";
    const result = await apiRequest<OrderInvoice>(
      `/order/${orderId}/invoice${params}`,
      {
        tags: ["ORDER"],
      }
    );
    return result;
  } catch (error: any) {
    return toServiceResult(error);
  }
};

export const createOrder = async (
  payload: CreateOrderPayload
): Promise<ServiceResult<Order>> => {
  try {
    const result = await apiRequest<Order>("/order", {
      method: "POST",
      body: payload,
    });
    revalidateTag("ORDER", "max");
    return result;
  } catch (error: any) {
    return toServiceResult(error);
  }
};

export const updateOrder = async (
  orderId: string,
  payload: { status: OrderStatus }
): Promise<ServiceResult<Order>> => {
  try {
    const result = await apiRequest<Order>(`/order/${orderId}`, {
      method: "PATCH",
      body: payload,
    });
    revalidateTag("ORDER", "max");
    return result;
  } catch (error: any) {
    return toServiceResult(error);
  }
};

export const updateOrderStatus = async (
  orderId: string,
  status: OrderStatus
): Promise<ServiceResult<Order>> => {
  try {
    const result = await apiRequest<Order>(
      `/order/${orderId}/status`,
      {
        method: "PATCH",
        body: { status },
      }
    );
    revalidateTag("ORDER", "max");
    return result;
  } catch (error: any) {
    return toServiceResult(error);
  }
};
