/**
 * Pagination utilities for API list endpoints.
 */

/**
 * Pagination parameters extracted from URL
 */
export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

/**
 * Pagination metadata for response
 */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Default pagination values
 */
const DEFAULTS = {
  page: 1,
  limit: 10,
  maxLimit: 100,
} as const;

/**
 * Documented hard ceiling for "fetch (almost) everything" list endpoints that
 * back client-side filtering (installers/rewards tables). Client-side filtering
 * is a deliberate UX choice at current scale — but it must be bounded so a
 * request for `?limit=999999` can't try to serialize the whole collection.
 *
 * This is a deferred scaling trigger (see CLAUDE.md): when the real dataset
 * approaches this number, switch those pages to true server-side pagination
 * instead of raising the ceiling.
 */
export const LIST_MAX_LIMIT = 20000;

/**
 * Extract pagination parameters from URL search params.
 * Applies reasonable defaults and limits.
 *
 * @example
 * const pagination = getPaginationParams(searchParams);
 * const items = await Model.find(query)
 *   .skip(pagination.skip)
 *   .limit(pagination.limit);
 */
export function getPaginationParams(
  searchParams: URLSearchParams,
  options?: { defaultLimit?: number; maxLimit?: number; strictMaxLimit?: boolean }
): PaginationParams {
  const defaultLimit = options?.defaultLimit ?? DEFAULTS.limit;
  const maxLimit = options?.maxLimit ?? DEFAULTS.maxLimit;

  const page = Math.max(
    DEFAULTS.page,
    parseInt(searchParams.get("page") || String(DEFAULTS.page), 10) ||
      DEFAULTS.page
  );

  const rawLimit = parseInt(
    searchParams.get("limit") || String(defaultLimit),
    10
  );
  let limit = Number.isNaN(rawLimit) ? defaultLimit : rawLimit;

  // strictMaxLimit: refuse (400) instead of silently clamping, so a caller
  // asking beyond the documented ceiling gets a loud error rather than a
  // silently truncated page it would mistake for the full dataset.
  if (options?.strictMaxLimit && limit > maxLimit) {
    throw Object.assign(
      new Error(`limit must not exceed ${maxLimit}`),
      { status: 400 }
    );
  }

  limit = Math.max(1, Math.min(limit, maxLimit));

  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

/**
 * Create pagination metadata for response.
 *
 * @example
 * return ApiResponse.success({
 *   items,
 *   pagination: createPaginationMeta(total, page, limit),
 * });
 */
export function createPaginationMeta(
  total: number,
  page: number,
  limit: number
): PaginationMeta {
  const pages = Math.ceil(total / limit);

  return {
    total,
    page,
    limit,
    pages,
    hasNext: page < pages,
    hasPrev: page > 1,
  };
}

/**
 * Paginated response helper that combines items with pagination metadata.
 *
 * @example
 * const [items, total] = await Promise.all([
 *   Model.find(query).skip(skip).limit(limit),
 *   Model.countDocuments(query),
 * ]);
 * return ApiResponse.success(
 *   paginatedResponse(items, total, page, limit)
 * );
 */
export function paginatedResponse<T>(
  items: T[],
  total: number,
  page: number,
  limit: number
): { items: T[]; pagination: PaginationMeta } {
  return {
    items,
    pagination: createPaginationMeta(total, page, limit),
  };
}
