/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { revalidateTag } from "next/cache";
import { apiRequest, toServiceResult } from "./api-client";
import type {
  ServiceResult,
  Settings,
  SettingsBrand,
  SettingsSectionKey,
} from "@/lib/types/backend";

export const getSettings = async (): Promise<ServiceResult<Settings>> => {
  try {
    const result = await apiRequest<Settings>("/settings", {
      skipAuth: true,
      tags: ["SETTINGS"],
    });
    return result;
  } catch (error: any) {
    return toServiceResult(error);
  }
};

/**
 * PATCH /settings, update brand identity. Multipart with `data` (brand JSON)
 * plus optional `logo` and `favicon` files (png/svg for transparency).
 */
export const updateBrandSettings = async (
  brand: Partial<SettingsBrand>,
  files?: { logo?: File | null; favicon?: File | null }
): Promise<ServiceResult<Settings>> => {
  try {
    const formData = new FormData();
    formData.append("data", JSON.stringify({ brand }));
    if (files?.logo) formData.append("logo", files.logo);
    if (files?.favicon) formData.append("favicon", files.favicon);
    const result = await apiRequest<Settings>("/settings", {
      method: "PATCH",
      formData,
    });
    revalidateTag("SETTINGS", "max");
    return result;
  } catch (error: any) {
    return toServiceResult(error);
  }
};

/**
 * PATCH /settings/:section, update a single settings section.
 *
 * The backend expects multipart/form-data with the JSON payload under the
 * `data` key (plain JSON bodies are rejected with
 * "Please provide data in the body under data key"). Image-bearing sections
 * (hero/testimonials/about/limitedOffer) additionally accept positional
 * `images` files: `slides[i].image`, `items[i].avatar`, or `image = images[0]`.
 */
export const updateSettingsSection = async (
  sectionKey: SettingsSectionKey,
  payload: unknown,
  images?: (File | null)[]
): Promise<ServiceResult<Settings>> => {
  try {
    const formData = new FormData();
    formData.append("data", JSON.stringify(payload));

    if (images) {
      images.forEach((file, index) => {
        if (file) formData.append("images", file, file.name);
      });
    }

    const result = await apiRequest<Settings>(`/settings/${sectionKey}`, {
      method: "PATCH",
      formData,
    });
    revalidateTag("SETTINGS", "max");
    return result;
  } catch (error: any) {
    return toServiceResult(error);
  }
};

/**
 * PATCH /settings/preset/:niche, apply a niche's THEME only (colors light +
 * dark, fonts, radius, globalCss). Brand/hero/navbar/footer are untouched.
 */
export const applySettingsPreset = async (
  niche: string
): Promise<ServiceResult<Settings>> => {
  try {
    const result = await apiRequest<Settings>(`/settings/preset/${niche}`, {
      method: "PATCH",
    });
    revalidateTag("SETTINGS", "max");
    return result;
  } catch (error: any) {
    return toServiceResult(error);
  }
};

/**
 * PATCH /settings/reset/:niche, apply a full niche preset (theme + brand +
 * hero + navbar + footer + contact + about + testimonials + limitedOffer).
 * Store currency and delivery options are preserved by the backend.
 */
export const resetSettings = async (
  niche: string
): Promise<ServiceResult<Settings>> => {
  try {
    const result = await apiRequest<Settings>(`/settings/reset/${niche}`, {
      method: "PATCH",
    });
    revalidateTag("SETTINGS", "max");
    return result;
  } catch (error: any) {
    return toServiceResult(error);
  }
};

/**
 * PATCH /settings/reset/empty, clear all sections to empty defaults (no theme).
 * Keeps brand currency and delivery options. Only a reset, no theme applied.
 */
export const resetSettingsToEmpty = async (): Promise<ServiceResult<Settings>> => {
  try {
    const result = await apiRequest<Settings>(`/settings/reset/empty`, {
      method: "PATCH",
    });
    revalidateTag("SETTINGS", "max");
    return result;
  } catch (error: any) {
    return toServiceResult(error);
  }
};
