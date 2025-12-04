import { FilterQuery } from "mongoose";

/**
 * Fluent query builder for MongoDB queries.
 * Reduces duplication in API route GET handlers.
 *
 * @example
 * const query = new QueryBuilder<IInstaller>()
 *   .search(['fullName', 'installerCode', 'cnic'], searchParam)
 *   .filter('city', cityParam, { regex: true })
 *   .filter('province', provinceParam, { regex: true })
 *   .boolean('certified', certifiedParam)
 *   .dateRange('createdAt', startDate, endDate)
 *   .build();
 */
export class QueryBuilder<T> {
  private query: FilterQuery<T> = {};

  /**
   * Add a text search across multiple fields using $or
   */
  search(fields: (keyof T)[], value?: string | null): this {
    if (value && value.trim()) {
      this.query.$or = fields.map((field) => ({
        [field]: { $regex: value.trim(), $options: "i" },
      })) as FilterQuery<T>["$or"];
    }
    return this;
  }

  /**
   * Add a single field filter
   * @param options.regex - Use regex matching (case-insensitive)
   * @param options.exact - Use exact matching
   */
  filter(
    field: keyof T,
    value?: string | null,
    options?: { regex?: boolean; exact?: boolean }
  ): this {
    if (value !== undefined && value !== null && value !== "") {
      if (options?.regex) {
        (this.query as Record<string, unknown>)[field as string] = {
          $regex: value,
          $options: "i",
        };
      } else {
        (this.query as Record<string, unknown>)[field as string] = value;
      }
    }
    return this;
  }

  /**
   * Add a boolean field filter
   */
  boolean(field: keyof T, value?: string | null): this {
    if (value !== undefined && value !== null && value !== "") {
      (this.query as Record<string, unknown>)[field as string] =
        value === "true";
    }
    return this;
  }

  /**
   * Add a date range filter
   */
  dateRange(field: keyof T, start?: string | null, end?: string | null): this {
    if (start || end) {
      const dateQuery: { $gte?: Date; $lte?: Date } = {};
      if (start) {
        dateQuery.$gte = new Date(start);
      }
      if (end) {
        dateQuery.$lte = new Date(end);
      }
      (this.query as Record<string, unknown>)[field as string] = dateQuery;
    }
    return this;
  }

  /**
   * Add an enum/status filter (ignores 'all' value)
   */
  enumFilter(field: keyof T, value?: string | null): this {
    if (value && value !== "all") {
      (this.query as Record<string, unknown>)[field as string] = value;
    }
    return this;
  }

  /**
   * Add an ObjectId reference filter
   */
  ref(field: keyof T, id?: string | null): this {
    if (id) {
      (this.query as Record<string, unknown>)[field as string] = id;
    }
    return this;
  }

  /**
   * Add an array of values filter ($in)
   */
  inArray(field: keyof T, values?: string[] | null): this {
    if (values && values.length > 0) {
      (this.query as Record<string, unknown>)[field as string] = {
        $in: values,
      };
    }
    return this;
  }

  /**
   * Add a raw query condition
   */
  raw(condition: FilterQuery<T>): this {
    Object.assign(this.query, condition);
    return this;
  }

  /**
   * Build and return the final query object
   */
  build(): FilterQuery<T> {
    return this.query;
  }
}

/**
 * Sorting options helper
 */
export interface SortOptions {
  field: string;
  order: 1 | -1;
}

/**
 * Parse sort parameters from URL search params
 */
export function parseSortParams(
  searchParams: URLSearchParams,
  defaultField = "createdAt",
  defaultOrder: "asc" | "desc" = "desc"
): SortOptions {
  const sortBy = searchParams.get("sortBy") || defaultField;
  const sortOrder = searchParams.get("sortOrder") || defaultOrder;

  return {
    field: sortBy,
    order: sortOrder === "asc" ? 1 : -1,
  };
}
