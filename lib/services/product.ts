/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { revalidateTag } from "next/cache";
import { apiRequest, toServiceResult } from "./api-client";
import type {
  ListQuery,
  Product,
  ProductOfferPrice,
  ProductPayload,
  ServiceResult,
} from "@/lib/types/backend";

export const getAllProducts = async (
  query: ListQuery = {}
): Promise<ServiceResult<Product[]>> => {
  try {
    const params = new URLSearchParams(
      Object.entries(query)
        .filter(([, value]) => value !== undefined && value !== "")
        .map(([key, value]) => [key, String(value)])
    ).toString();

    const result = await apiRequest<Product[]>(
      `/product${params ? `?${params}` : ""}`,
      {
        tags: ["PRODUCT"],
      }
    );
    return result;
  } catch (error: any) {
    return toServiceResult(error);
  }
};

export const getProductById = async (
  productId: string
): Promise<ServiceResult<Product>> => {
  try {
    const result = await apiRequest<Product>(
      `/product/${productId}`,
      {
        tags: ["PRODUCT"],
      }
    );
    return result;
  } catch (error: any) {
    return toServiceResult(error);
  }
};

export const createProduct = async (
  productData: FormData
): Promise<ServiceResult<Product>> => {
  try {
    const result = await apiRequest<Product>("/product", {
      method: "POST",
      formData: productData,
    });
    return result;
  } catch (error: any) {
    return toServiceResult(error);
  }
};

export const updateProduct = async (
  productId: string,
  productData: FormData
): Promise<ServiceResult<Product>> => {
  try {
    const result = await apiRequest<Product>(
      `/product/${productId}`,
      {
        method: "PATCH",
        formData: productData,
      }
    );
    revalidateTag("PRODUCT", "max");
    return result;
  } catch (error: any) {
    return toServiceResult(error);
  }
};

export const toggleProductStatus = async (
  productId: string,
  isActive: boolean
): Promise<ServiceResult<Product>> => {
  try {
    const formData = new FormData();
    formData.append("data", JSON.stringify({ isActive }));
    const result = await apiRequest<Product>(
      `/product/${productId}`,
      {
        method: "PATCH",
        formData,
      }
    );
    revalidateTag("PRODUCT", "max");
    return result;
  } catch (error: any) {
    return toServiceResult(error);
  }
};

/**
 * PATCH /product/currency , admin-only bulk restamp: every product's
 * `currency` follows the store's new brand currency (values unchanged).
 */
export const restampProductCurrency = async (
  currency: string
): Promise<ServiceResult<{ matched: number; modified: number }>> => {
  try {
    const result = await apiRequest<{ matched: number; modified: number }>(
      "/product/currency",
      {
        method: "PATCH",
        body: { currency },
      }
    );
    revalidateTag("PRODUCT", "max");
    return result;
  } catch (error: any) {
    return toServiceResult(error);
  }
};

export const deleteProduct = async (
  productId: string
): Promise<ServiceResult<Product>> => {
  try {
    const result = await apiRequest<Product>(
      `/product/${productId}`,
      {
        method: "DELETE",
      }
    );
    revalidateTag("PRODUCT", "max");
    return result;
  } catch (error: any) {
    return toServiceResult(error);
  }
};

/**
 * PATCH /product/:id with ONLY the offerPrice — the Offered Products
 * manager's targeted save, so offers are created/updated/removed without
 * round-tripping the whole product form. Pass null to remove the offer.
 */
export const updateProductOffer = async (
  productId: string,
  offer: ProductOfferPrice | null
): Promise<ServiceResult<Product>> => {
  try {
    const formData = new FormData();
    formData.append("data", JSON.stringify({ offerPrice: offer }));
    const result = await apiRequest<Product>(`/product/${productId}`, {
      method: "PATCH",
      formData,
    });
    revalidateTag("PRODUCT", "max");
    return result;
  } catch (error: any) {
    return toServiceResult(error);
  }
};
