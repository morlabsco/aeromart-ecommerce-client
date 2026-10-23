/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { revalidateTag } from "next/cache";
import { apiRequest, toServiceResult } from "./api-client";
import type {
  Category,
  CategoryPayload,
  ListQuery,
  ServiceResult,
} from "@/lib/types/backend";

export const getAllCategories = async (
  query: ListQuery = {}
): Promise<ServiceResult<Category[]>> => {
  try {
    const params = new URLSearchParams(
      Object.entries(query)
        .filter(([, value]) => value !== undefined && value !== "")
        .map(([key, value]) => [key, String(value)])
    ).toString();

    const result = await apiRequest<Category[]>(
      `/category${params ? `?${params}` : ""}`,
      {
        tags: ["CATEGORY"],
      }
    );
    return result;
  } catch (error: any) {
    return toServiceResult(error);
  }
};

export const createCategory = async (
  categoryData: FormData
): Promise<ServiceResult<Category>> => {
  try {
    const result = await apiRequest<Category>("/category", {
      method: "POST",
      formData: categoryData,
    });
    revalidateTag("CATEGORY", "max");
    return result;
  } catch (error: any) {
    return toServiceResult(error);
  }
};

export const updateCategory = async (
  categoryId: string,
  categoryData: FormData
): Promise<ServiceResult<Category>> => {
  try {
    const result = await apiRequest<Category>(
      `/category/${categoryId}`,
      {
        method: "PATCH",
        formData: categoryData,
      }
    );
    revalidateTag("CATEGORY", "max");
    return result;
  } catch (error: any) {
    return toServiceResult(error);
  }
};

export const toggleCategoryStatus = async (
  categoryId: string,
  isActive: boolean
): Promise<ServiceResult<Category>> => {
  try {
    const formData = new FormData();
    formData.append("data", JSON.stringify({ isActive }));
    const result = await apiRequest<Category>(`/category/${categoryId}`, {
      method: "PATCH",
      formData,
    });
    revalidateTag("CATEGORY", "max");
    return result;
  } catch (error: any) {
    return toServiceResult(error);
  }
};

export const deleteCategory = async (
  categoryId: string
): Promise<ServiceResult<Category>> => {
  try {
    const result = await apiRequest<Category>(
      `/category/${categoryId}`,
      {
        method: "DELETE",
      }
    );
    revalidateTag("CATEGORY", "max");
    return result;
  } catch (error: any) {
    return toServiceResult(error);
  }
};
