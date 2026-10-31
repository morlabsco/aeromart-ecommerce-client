/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { apiRequest, toServiceResult } from "./api-client";
import type {
  ListQuery,
  Review,
  ReviewPayload,
  ServiceResult,
} from "@/lib/types/backend";

export const getAllReviews = async (
  query: ListQuery = {}
): Promise<ServiceResult<Review[]>> => {
  try {
    const params = new URLSearchParams(
      Object.entries(query)
        .filter(([, value]) => value !== undefined && value !== "")
        .map(([key, value]) => [key, String(value)])
    ).toString();

    const result = await apiRequest<Review[]>(
      `/review${params ? `?${params}` : ""}`,
      {
        skipAuth: true,
        tags: ["REVIEW"],
      }
    );
    return result;
  } catch (error: any) {
    return toServiceResult(error);
  }
};

export const getReviewById = async (
  reviewId: string
): Promise<ServiceResult<Review>> => {
  try {
    const result = await apiRequest<Review>(
      `/review/${reviewId}`,
      {
        skipAuth: true,
        tags: ["REVIEW"],
      }
    );
    return result;
  } catch (error: any) {
    return toServiceResult(error);
  }
};

/** GET /review/my-reviews , the authenticated customer's own reviews. */
export const getMyReviews = async (
  query: ListQuery = {}
): Promise<ServiceResult<Review[]>> => {
  try {
    const params = new URLSearchParams(
      Object.entries(query)
        .filter(([, value]) => value !== undefined && value !== "")
        .map(([key, value]) => [key, String(value)])
    ).toString();

    const result = await apiRequest<Review[]>(
      `/review/my-reviews${params ? `?${params}` : ""}`,
      {
        tags: ["REVIEW"],
      }
    );
    return result;
  } catch (error: any) {
    return toServiceResult(error);
  }
};

export const createReview = async (
  payload: ReviewPayload
): Promise<ServiceResult<Review>> => {
  try {
    const result = await apiRequest<Review>("/review", {
      method: "POST",
      body: payload,
    });
    return result;
  } catch (error: any) {
    return toServiceResult(error);
  }
};

/** POST /review with optional photos — multipart so the backend can push the
 *  images through Cloudinary (photos key, max 3 files, validated client-side). */
export const createReviewWithPhotos = async (
  payload: { rating: number; description: string; product: string },
  photos: File[]
): Promise<ServiceResult<Review>> => {
  try {
    const formData = new FormData();
    formData.append("rating", String(payload.rating));
    formData.append("description", payload.description);
    formData.append("product", payload.product);
    photos.slice(0, 3).forEach((photo) => {
      formData.append("photos", photo, photo.name);
    });
    const result = await apiRequest<Review>("/review", {
      method: "POST",
      formData,
    });
    return result;
  } catch (error: any) {
    return toServiceResult(error);
  }
};

/** PATCH /review/:reviewId/status , toggle a review's flagged state (admin).
 *  `flaggedReason` is included when flagging so the backend can store it. */
export const toggleReviewFlag = async (
  reviewId: string,
  flaggedReason?: string
): Promise<ServiceResult<Review>> => {
  try {
    const result = await apiRequest<Review>(
      `/review/${reviewId}/status`,
      {
        method: "PATCH",
        body: flaggedReason ? { flaggedReason } : undefined,
      }
    );
    return result;
  } catch (error: any) {
    return toServiceResult(error);
  }
};

/** DELETE /review/:reviewId , delete a review (admin). */
export const deleteReview = async (
  reviewId: string
): Promise<ServiceResult<Review>> => {
  try {
    const result = await apiRequest<Review>(`/review/${reviewId}`, {
      method: "DELETE",
    });
    return result;
  } catch (error: any) {
    return toServiceResult(error);
  }
};
