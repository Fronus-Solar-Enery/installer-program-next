import { NextRequest, NextResponse } from "next/server";
import { ZodSchema, ZodError, z } from "zod";
import { ApiResponse } from "@/lib/apiResponse";

/**
 * Result type for validation functions
 */
type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; response: NextResponse };

/**
 * Validate and parse the request body against a Zod schema.
 * Returns either the validated data or an error response.
 *
 * @example
 * const result = await validateBody(request, registerInstallerSchema);
 * if (!result.success) return result.response;
 * const { data } = result;
 * // Use validated data...
 */
export async function validateBody<T extends ZodSchema>(
  request: NextRequest,
  schema: T
): Promise<ValidationResult<z.infer<T>>> {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    return { success: true, data };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        response: ApiResponse.validationError(
          error.issues as Array<{ path?: PropertyKey[]; message: string }>
        ),
      };
    }
    if (error instanceof SyntaxError) {
      return {
        success: false,
        response: ApiResponse.badRequest("Invalid JSON in request body"),
      };
    }
    return {
      success: false,
      response: ApiResponse.badRequest("Failed to parse request body"),
    };
  }
}

/**
 * Extract and validate a single parameter from URL params.
 *
 * @example
 * const { id } = await params;
 * const validated = validateParam(id, 'id', z.string().min(1));
 * if (!validated.success) return validated.response;
 */
export function validateParam<T extends ZodSchema>(
  value: unknown,
  paramName: string,
  schema: T
): ValidationResult<z.infer<T>> {
  try {
    const data = schema.parse(value);
    return { success: true, data };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        response: ApiResponse.badRequest(
          `Invalid ${paramName}: ${
            error.issues[0]?.message || "validation failed"
          }`
        ),
      };
    }
    return {
      success: false,
      response: ApiResponse.badRequest(`Invalid ${paramName}`),
    };
  }
}

/**
 * Get search params helper with type coercion
 */
export function getSearchParams(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  return {
    /**
     * Get string parameter (returns undefined if not present)
     */
    getString: (key: string): string | undefined => {
      const value = searchParams.get(key);
      return value || undefined;
    },

    /**
     * Get integer parameter with default value
     */
    getInt: (key: string, defaultValue: number): number => {
      const value = searchParams.get(key);
      if (!value) return defaultValue;
      const parsed = parseInt(value, 10);
      return isNaN(parsed) ? defaultValue : parsed;
    },

    /**
     * Get boolean parameter
     */
    getBool: (key: string): boolean | undefined => {
      const value = searchParams.get(key);
      if (value === null) return undefined;
      return value === "true";
    },

    /**
     * Get all parameters as an object
     */
    getAll: (): Record<string, string> => {
      const params: Record<string, string> = {};
      searchParams.forEach((value, key) => {
        params[key] = value;
      });
      return params;
    },

    /**
     * Raw access to URLSearchParams
     */
    raw: searchParams,
  };
}
