/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { revalidateTag } from "next/cache";
import { apiRequest, toServiceResult } from "./api-client";
import type {
  Activity,
  ClearActivitiesPayload,
  ClearActivitiesResponse,
  ListQuery,
  ServiceResult,
} from "@/lib/types/backend";

export const getAllActivities = async (
  query: ListQuery = {}
): Promise<ServiceResult<Activity[]>> => {
  try {
    const params = new URLSearchParams(
      Object.entries(query)
        .filter(([, value]) => value !== undefined && value !== "")
        .map(([key, value]) => [key, String(value)])
    ).toString();

    const result = await apiRequest<Activity[]>(
      `/activity${params ? `?${params}` : ""}`,
      {
        tags: ["ACTIVITY"],
      }
    );
    return result;
  } catch (error: any) {
    return toServiceResult(error);
  }
};

export const getActivityById = async (
  activityId: string
): Promise<ServiceResult<Activity>> => {
  try {
    const result = await apiRequest<Activity>(`/activity/${activityId}`, {
      tags: ["ACTIVITY"],
    });
    return result;
  } catch (error: any) {
    return toServiceResult(error);
  }
};

export const clearSingleActivity = async (
  activityId: string
): Promise<ServiceResult<Activity>> => {
  try {
    const result = await apiRequest<Activity>(
      `/activity/${activityId}/clear`,
      {
        method: "PATCH",
      }
    );
    revalidateTag("ACTIVITY", "max");
    return result;
  } catch (error: any) {
    return toServiceResult(error);
  }
};

export const clearActivities = async (
  payload: ClearActivitiesPayload
): Promise<ServiceResult<ClearActivitiesResponse>> => {
  try {
    const result = await apiRequest<ClearActivitiesResponse>("/activity/clear", {
      method: "PATCH",
      body: payload,
    });
    revalidateTag("ACTIVITY", "max");
    return result;
  } catch (error: any) {
    return toServiceResult(error);
  }
};
