// Shared API response shapes used across all modules.
// See docs/v7-backend-usage-guide.md §4 for the conventions.

export interface ApiMeta {
  page: number;
  limit: number;
  total: number;
  totalPage: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  meta?: ApiMeta;
  data: T;
}

export interface ApiErrorSource {
  path: string;
  message: string;
}

export interface ApiErrorResponse {
  success: boolean;
  message: string;
  errorSources?: ApiErrorSource[];
  err?: unknown;
  stack?: string | null;
}

/**
 * Safe serializable failure returned by service functions instead of an
 * `Error` instance. Next.js serializes Error objects across the RSC boundary,
 * which loses `instanceof Error` and can censor the message in production.
 * Plain objects survive serialization intact.
 */
export interface ServiceFailure {
  ok: false;
  message: string;
  status?: number;
  errorSources?: ApiErrorSource[];
}

/**
 * Return type of every service function: the full API envelope on success
 * (consumers read `.data` / `.message` directly), or a serializable failure
 * that survives server-action serialization. Detect with `isErrorResult`.
 */
export type ServiceResult<T> = ApiResponse<T> | ServiceFailure;

// Query params supported by every paginated list endpoint (QueryBuilder).
export interface ListQuery {
  searchTerm?: string;
  page?: number;
  limit?: number;
  sort?: string;
  fields?: string;
  [key: string]: string | number | boolean | undefined;
}
