/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { revalidateTag } from "next/cache";
import { apiRequest, toServiceResult } from "./api-client";
import type {
  ListQuery,
  RegisterPayload,
  ServiceResult,
  User,
} from "@/lib/types/backend";

export const registerUser = async (
  payload: RegisterPayload
): Promise<ServiceResult<{ accessToken: string }>> => {
  try {
    const result = await apiRequest<{ accessToken: string }>(
      "/user/register",
      {
        method: "POST",
        body: payload,
        skipAuth: true,
      }
    );
    return result;
  } catch (error: any) {
    return toServiceResult(error);
  }
};

export const getAllUsers = async (
  query: ListQuery = {}
): Promise<ServiceResult<User[]>> => {
  try {
    const params = new URLSearchParams(
      Object.entries(query)
        .filter(([, value]) => value !== undefined && value !== "")
        .map(([key, value]) => [key, String(value)])
    ).toString();

    const result = await apiRequest<User[]>(
      `/user${params ? `?${params}` : ""}`,
      {
        tags: ["USER"],
      }
    );
    return result;
  } catch (error: any) {
    return toServiceResult(error);
  }
};

export const getMyProfile = async (): Promise<ServiceResult<User>> => {
  try {
    const result = await apiRequest<User>("/user/me");
    return result;
  } catch (error: any) {
    return toServiceResult(error);
  }
};

export const updateUserProfile = async (
  userData: FormData
): Promise<ServiceResult<User>> => {
  try {
    const result = await apiRequest<User>("/user/update-profile", {
      method: "PATCH",
      formData: userData,
    });
    return result;
  } catch (error: any) {
    return toServiceResult(error);
  }
};

export const toggleUserStatus = async (
  id: string
): Promise<ServiceResult<Partial<User>>> => {
  try {
    const result = await apiRequest<Partial<User>>(
      `/user/${id}/status`,
      {
        method: "PATCH",
      }
    );
    revalidateTag("USER", "max");
    return result;
  } catch (error: any) {
    return toServiceResult(error);
  }
};
