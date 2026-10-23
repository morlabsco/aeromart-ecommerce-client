/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { revalidateTag } from "next/cache";
import { apiRequest, toServiceResult } from "./api-client";
import type {
  Coupon,
  CouponPayload,
  ListQuery,
  ServiceResult,
} from "@/lib/types/backend";

export const getAllCoupons = async (
  query: ListQuery = {}
): Promise<ServiceResult<Coupon[]>> => {
  try {
    const params = new URLSearchParams(
      Object.entries(query)
        .filter(([, value]) => value !== undefined && value !== "")
        .map(([key, value]) => [key, String(value)])
    ).toString();

    const result = await apiRequest<Coupon[]>(
      `/coupon${params ? `?${params}` : ""}`,
      {
        tags: ["COUPON"],
      }
    );
    return result;
  } catch (error: any) {
    return toServiceResult(error);
  }
};

export const getCouponById = async (
  couponId: string
): Promise<ServiceResult<Coupon>> => {
  try {
    const result = await apiRequest<Coupon>(`/coupon/${couponId}`, {
      tags: ["COUPON"],
    });
    return result;
  } catch (error: any) {
    return toServiceResult(error);
  }
};

export const getCouponByCode = async (
  couponCode: string
): Promise<ServiceResult<Coupon>> => {
  try {
    const result = await apiRequest<Coupon>(
      `/coupon/by-code/${couponCode}`,
      {
        skipAuth: true,
        tags: ["COUPON"],
      }
    );
    return result;
  } catch (error: any) {
    return toServiceResult(error);
  }
};

export const createCoupon = async (
  payload: CouponPayload
): Promise<ServiceResult<Coupon>> => {
  try {
    const result = await apiRequest<Coupon>("/coupon", {
      method: "POST",
      body: payload,
    });
    revalidateTag("COUPON", "max");
    return result;
  } catch (error: any) {
    return toServiceResult(error);
  }
};

export const updateCoupon = async (
  couponId: string,
  payload: Partial<CouponPayload>
): Promise<ServiceResult<Coupon>> => {
  try {
    const result = await apiRequest<Coupon>(
      `/coupon/${couponId}`,
      {
        method: "PATCH",
        body: payload,
      }
    );
    revalidateTag("COUPON", "max");
    return result;
  } catch (error: any) {
    return toServiceResult(error);
  }
};

export const deleteCoupon = async (
  couponId: string
): Promise<ServiceResult<Coupon>> => {
  try {
    const result = await apiRequest<Coupon>(`/coupon/${couponId}`, {
      method: "DELETE",
    });
    revalidateTag("COUPON", "max");
    return result;
  } catch (error: any) {
    return toServiceResult(error);
  }
};
