/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { revalidateTag } from "next/cache";
import { apiRequest, toServiceResult } from "./api-client";
import type { ListQuery, ServiceResult } from "@/lib/types/backend";
import type { NewsletterSubscriber } from "@/lib/types/modules/newsletter";

/** POST /newsletter — public subscribe (idempotent: re-subscribing returns
 *  `alreadySubscribed: true` instead of an error). */
export const subscribeToNewsletter = async (
  email: string
): Promise<ServiceResult<NewsletterSubscriber>> => {
  try {
    const result = await apiRequest<NewsletterSubscriber>("/newsletter", {
      method: "POST",
      body: { email },
    });
    return result;
  } catch (error: any) {
    return toServiceResult(error);
  }
};

/** GET /newsletter — admin list (paginated, `searchTerm` matches email). */
export const getAllSubscribers = async (
  query: ListQuery = {}
): Promise<ServiceResult<NewsletterSubscriber[]>> => {
  try {
    const params = new URLSearchParams(
      Object.entries(query)
        .filter(([, value]) => value !== undefined && value !== "")
        .map(([key, value]) => [key, String(value)])
    ).toString();

    const result = await apiRequest<NewsletterSubscriber[]>(
      `/newsletter${params ? `?${params}` : ""}`,
      { tags: ["NEWSLETTER"] }
    );
    return result;
  } catch (error: any) {
    return toServiceResult(error);
  }
};

/** DELETE /newsletter/:id — admin remove. */
export const deleteSubscriber = async (
  subscriberId: string
): Promise<ServiceResult<NewsletterSubscriber>> => {
  try {
    const result = await apiRequest<NewsletterSubscriber>(
      `/newsletter/${subscriberId}`,
      { method: "DELETE" }
    );
    revalidateTag("NEWSLETTER", "max");
    return result;
  } catch (error: any) {
    return toServiceResult(error);
  }
};
