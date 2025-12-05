/**
 * Query helper utilities for MongoDB operations.
 *
 * These utilities provide consistent patterns for building MongoDB queries
 * across the application, especially for common operations like date filtering.
 *
 * @module queryHelpers
 */

/**
 * Date range filter object compatible with MongoDB queries.
 */
export type DateRangeFilter = Record<string, unknown>;

/**
 * Build a date range filter for MongoDB queries.
 *
 * Creates a filter object that can be used in MongoDB queries to filter
 * documents within a date range. The end date is automatically adjusted
 * to include the entire day (23:59:59.999).
 *
 * @param startDate - ISO date string for range start, or null to skip filtering
 * @param endDate - ISO date string for range end, or null to skip filtering
 * @param field - MongoDB field name to filter on (default: 'createdAt')
 * @returns MongoDB filter object with date range, or empty object if dates not provided
 *
 * @example
 * ```typescript
 * // Basic usage
 * const filter = buildDateRangeFilter('2024-01-01', '2024-01-31');
 * // Returns: { createdAt: { $gte: Date, $lte: Date } }
 *
 * // With custom field
 * const filter = buildDateRangeFilter('2024-01-01', '2024-01-31', 'updatedAt');
 * // Returns: { updatedAt: { $gte: Date, $lte: Date } }
 *
 * // Use in aggregation pipeline
 * const pipeline = [
 *   ...(hasFilterConditions(filter) ? [{ $match: filter }] : []),
 *   // ... rest of pipeline
 * ];
 * ```
 */
export function buildDateRangeFilter(
  startDate: string | null,
  endDate: string | null,
  field: string = "createdAt"
): DateRangeFilter {
  const filter: DateRangeFilter = {};

  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    filter[field] = { $gte: start, $lte: end };
  }

  return filter;
}

/**
 * Check if a filter object has any conditions.
 *
 * Useful for conditionally adding match stages to aggregation pipelines.
 *
 * @param filter - MongoDB filter object to check
 * @returns True if the filter has at least one condition
 *
 * @example
 * ```typescript
 * const filter = buildDateRangeFilter(startDate, endDate);
 * if (hasFilterConditions(filter)) {
 *   pipeline.push({ $match: filter });
 * }
 * ```
 */
export function hasFilterConditions(filter: DateRangeFilter): boolean {
  return Object.keys(filter).length > 0;
}
