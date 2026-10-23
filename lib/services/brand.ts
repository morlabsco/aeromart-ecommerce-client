/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { revalidateTag } from "next/cache";
import { apiRequest, toServiceResult } from "./api-client";
import type {
  Brand,
  ListQuery,
  ServiceResult,
} from "@/lib/types/backend";

export const getAllBrands = async (
  query: ListQuery = {}
): Promise<ServiceResult<Brand[]>> => {
  try {
    const params = new URLSearchParams(
      Object.entries(query)
        .filter(([, value]) => value !== undefined && value !== "")
        .map(([key, value]) => [key, String(value)])
    ).toString();

    const result = await apiRequest<Brand[]>(
      `/brand${params ? `?${params}` : ""}`,
      {
        tags: ["BRAND"],
      }
    );
    return result;
  } catch (error: any) {
    return toServiceResult(error);
  }
};

export const createBrand = async (
  brandData: FormData
): Promise<ServiceResult<Brand>> => {
  try {
    const result = await apiRequest<Brand>("/brand", {
      method: "POST",
      formData: brandData,
    });
    revalidateTag("BRAND", "max");
    return result;
  } catch (error: any) {
    return toServiceResult(error);
  }
};

export const updateBrand = async (
  brandId: string,
  brandData: FormData
): Promise<ServiceResult<Brand>> => {
  try {
    const result = await apiRequest<Brand>(`/brand/${brandId}`, {
      method: "PATCH",
      formData: brandData,
    });
    revalidateTag("BRAND", "max");
    return result;
  } catch (error: any) {
    return toServiceResult(error);
  }
};

export const toggleBrandStatus = async (
  brandId: string,
  isActive: boolean
): Promise<ServiceResult<Brand>> => {
  try {
    const formData = new FormData();
    formData.append("data", JSON.stringify({ isActive }));
    const result = await apiRequest<Brand>(`/brand/${brandId}`, {
      method: "PATCH",
      formData,
    });
    revalidateTag("BRAND", "max");
    return result;
  } catch (error: any) {
    return toServiceResult(error);
  }
};

export const deleteBrand = async (
  brandId: string
): Promise<ServiceResult<Brand>> => {
  try {
    const result = await apiRequest<Brand>(`/brand/${brandId}`, {
      method: "DELETE",
    });
    revalidateTag("BRAND", "max");
    return result;
  } catch (error: any) {
    return toServiceResult(error);
  }
};
