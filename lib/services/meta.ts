/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { apiRequest, toServiceResult } from "./api-client";
import type {
  MetaData,
  ServiceResult,
} from "@/lib/types/backend";

export const getMeta = async (): Promise<ServiceResult<MetaData>> => {
  try {
    const result = await apiRequest<MetaData>("/meta", {
      tags: ["META"],
    });
    return result;
  } catch (error: any) {
    return toServiceResult(error);
  }
};
