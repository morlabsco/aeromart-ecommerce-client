/* eslint-disable @typescript-eslint/no-explicit-any */
// Shared fetch client for the Demo eCommerce backend.
// See docs/v7-backend-usage-guide.md §4 (response formats) and §16 (integration notes).

import { getValidToken } from "./verify-token";
import type {
  ApiErrorResponse,
  ApiResponse,
  ServiceResult,
} from "@/lib/types/backend";

// Re-exported for backward compatibility — these live in the client-safe
// lib/utils/result.ts so client components can import them without pulling
// next/headers into the browser bundle.
export { unwrapData, unwrapList } from "@/lib/utils/result";

export const BASE_API = process.env.NEXT_PUBLIC_BASE_API as string;

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  /** Pass a FormData instance for multipart uploads (do NOT stringify). */
  formData?: FormData;
  /** Disable the automatic Authorization header. */
  skipAuth?: boolean;
  /** Cache tags for Next.js on-demand revalidation. */
  tags?: string[];
  /** Time-based revalidation in seconds. */
  revalidate?: number;
  /** Include credentials (cookies), needed for refresh-token. */
  credentials?: RequestCredentials;
}

export class ApiClientError extends Error {
  status: number;
  errorSources?: { path: string; message: string }[];
  raw?: any;

  constructor(
    message: string,
    status: number,
    errorSources?: { path: string; message: string }[],
    raw?: any
  ) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.errorSources = errorSources;
    this.raw = raw;
  }
}

/**
 * Converts a caught error into a safe, serializable ServiceFailure. Server
 * actions must NOT return `Error` instances — Next.js serializes them across
 * the RSC boundary, which loses `instanceof Error` on the client and can
 * censor the message in production. This returns a plain `{ ok: false,
 * message }` object that survives serialization, carrying the backend's real
 * message when available.
 */
export function toServiceResult<T>(error: unknown): ServiceResult<T> {
  if (error instanceof ApiClientError) {
    return {
      ok: false,
      message: error.message,
      status: error.status || undefined,
      errorSources: error.errorSources,
    };
  }
  if (error instanceof Error) {
    return { ok: false, message: error.message };
  }
  if (typeof error === "string") {
    return { ok: false, message: error };
  }
  return { ok: false, message: "Something went wrong. Please try again." };
}

/** @deprecated Use toServiceResult — Error instances are not serializable across server actions. */
export function toServiceError(error: unknown): Error {
  if (error instanceof Error) {
    return new Error(error.message);
  }
  if (typeof error === "string") {
    return new Error(error);
  }
  return new Error("Something went wrong. Please try again.");
}

/**
 * Throws when the backend returns a non-OK status or success: false.
 * Returns the full response envelope ({ success, message, meta?, data })
 * on success, so callers can read `.data` and `.meta` (pagination).
 */
export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const {
    method = "GET",
    body,
    formData,
    skipAuth = false,
    tags,
    revalidate,
    credentials = "include",
  } = options;

  let token: string | null = null;
  if (!skipAuth) {
    token = await getValidToken();
  }

  const headers: Record<string, string> = {};
  if (!formData && body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers["Authorization"] = token;
  }

  const url = `${BASE_API}${path}`;

  // Server-side diagnostics: visible in Vercel function logs. Never log the
  // Authorization header (it carries the JWT).
  console.log(`[api-client] → ${method} ${url}`, {
    hasBody: body !== undefined,
    formData: formData !== undefined,
    hasToken: !!token,
    credentials,
  });

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: formData ?? (body !== undefined ? JSON.stringify(body) : undefined),
      credentials,
      cache: revalidate !== undefined ? "force-cache" : "no-store",
      ...(revalidate !== undefined || tags?.length ? { next: { revalidate, tags } } : {}),
    });
  } catch (error) {
    console.error(`[api-client] ✗ ${method} ${url} — network error`, error);
    throw new ApiClientError("Network error. Please try again.", 0, undefined, error);
  }

  console.log(`[api-client] ← ${method} ${url} — status ${res.status} ${res.statusText}`);

  const contentType = res.headers.get("content-type") ?? "";
  const json = contentType.includes("application/json") ? await res.json() : null;

  if (!res.ok || json?.success === false) {
    const apiError = json as ApiErrorResponse | null;
    console.error(`[api-client] ✗ ${method} ${url} — non-OK response`, {
      status: res.status,
      message: apiError?.message,
      errorSources: apiError?.errorSources,
      body: json,
    });
    throw new ApiClientError(
      apiError?.message ?? `Request failed with status ${res.status}`,
      res.status,
      apiError?.errorSources,
      apiError
    );
  }

  console.log(`[api-client] ✓ ${method} ${url} — success`, {
    success: (json as ApiResponse<T> | null)?.success,
    message: (json as ApiResponse<T> | null)?.message,
  });

  return json as ApiResponse<T>;
}
