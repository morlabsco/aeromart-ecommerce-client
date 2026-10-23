import type { ServiceFailure, ServiceResult } from "@/lib/types/backend";

/**
 * True when a service returned a failure envelope (not the API payload).
 * Client-safe: no next/headers dependency, safe to import from client
 * components. `ApiResponse<T>` never has an `ok` field, so checking for it
 * cleanly discriminates the union.
 */
export function isServiceFailure<T>(result: ServiceResult<T>): result is Extract<
  ServiceResult<T>,
  { ok: false }
> {
  return typeof result === "object" && result !== null && "ok" in result;
}

/**
 * Services return `ApiResponse<T> | ServiceFailure`. This unwraps the list
 * data and falls back to an empty array when the call failed, so pages can
 * render a table without error-handling noise.
 */
export function unwrapList<T>(
  result: ServiceResult<T>,
  fallback: T = [] as T
): T {
  return isServiceFailure(result) ? fallback : result.data;
}

/**
 * Unwraps a single-record response, returning `null` on failure.
 */
export function unwrapData<T>(result: ServiceResult<T>): T | null {
  return isServiceFailure(result) ? null : result.data;
}

/**
 * Robustly checks whether a server-action result is an error. Server Actions
 * serialize Error objects across the RSC boundary, so `instanceof Error` can
 * be false on the client even though the value is an error. This handles all
 * of the shapes a service can return on failure:
 *
 * - real `Error` instances
 * - `ServiceFailure` envelopes: `{ ok: false, message }` (from toServiceResult)
 * - backend error envelopes: `{ success: false, message }`
 * - any serialized `{ message }` object
 *
 * Lives in a client-safe module (no server-only imports) so client components
 * can import it without pulling next/headers into the browser bundle.
 */
export function isErrorResult(
  result: unknown
): result is Error | ServiceFailure {
  if (result instanceof Error) return true;
  if (
    typeof result === "object" &&
    result !== null &&
    // New service failure envelope.
    ((result as { ok?: unknown }).ok === false ||
      // Backend wraps successful responses in { success: true, message, data };
      // a non-true success flag with a message means an error envelope.
      (result as { success?: unknown }).success !== true) &&
    "message" in result &&
    typeof (result as { message: unknown }).message === "string"
  ) {
    return true;
  }
  return false;
}
