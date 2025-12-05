import { NextResponse } from "next/server";
import { ZodError } from "zod";

/**
 * Standardized API response utility class.
 *
 * Provides consistent response formatting across all API routes.
 * All methods return NextResponse objects with a standard structure:
 *
 * Success responses:
 * ```json
 * { "success": true, "message": "Success", "data": { ... } }
 * ```
 *
 * Error responses:
 * ```json
 * { "success": false, "message": "Error message", "errors": { ... } }
 * ```
 *
 * @example
 * ```typescript
 * // Success response with data
 * return ApiResponse.success({ user: userData }, "User created");
 *
 * // Error with field-level errors
 * return ApiResponse.badRequest("Validation failed", {
 *   email: ["Invalid email format"],
 * });
 *
 * // 404 Not Found
 * return ApiResponse.notFound("User not found");
 * ```
 */
export class ApiResponse {
  /**
   * Create a success response.
   * @param data - Response payload data
   * @param message - Optional success message (default: "Success")
   * @param status - HTTP status code (default: 200)
   */
  static success(data: unknown, message?: string, status = 200) {
    return NextResponse.json(
      {
        success: true,
        message: message || "Success",
        data,
      },
      { status }
    );
  }

  /**
   * Create a generic error response.
   * @param message - Error message
   * @param status - HTTP status code (default: 400)
   * @param errors - Optional field-level errors or additional error details
   */
  static error(
    message: string,
    status = 400,
    errors?: Record<string, string[]> | unknown
  ) {
    return NextResponse.json(
      {
        success: false,
        message,
        errors,
      },
      { status }
    );
  }

  /**
   * Create a validation error response (400) with field-level errors.
   * Automatically formats Zod validation errors into a field-error map.
   * @param errors - Array of validation issues or pre-formatted field errors
   * @param message - Optional error message (default: "Please check the form for errors")
   */
  static validationError(
    errors:
      | Array<{ path?: PropertyKey[]; message: string }>
      | Record<string, string[]>,
    message?: string
  ) {
    // Format Zod errors into field-level errors
    const formattedErrors: Record<string, string[]> = {};

    if (Array.isArray(errors)) {
      errors.forEach((error) => {
        // Filter path to only include strings and numbers
        const filteredPath =
          error.path
            ?.filter((p): p is string | number => typeof p !== "symbol")
            .join(".") || "general";

        if (!formattedErrors[filteredPath]) {
          formattedErrors[filteredPath] = [];
        }
        formattedErrors[filteredPath].push(error.message);
      });
    } else {
      return this.error(
        message || "Please check the form for errors",
        400,
        errors
      );
    }

    return this.error(
      message || "Please check the form for errors",
      400,
      formattedErrors
    );
  }

  /**
   * Create an unauthorized response (401).
   * Use when user is not authenticated.
   * @param message - Optional error message
   */
  static unauthorized(
    message = "You must be signed in to access this resource"
  ) {
    return this.error(message, 401);
  }

  /**
   * Create a forbidden response (403).
   * Use when user is authenticated but lacks permissions.
   * @param message - Optional error message
   */
  static forbidden(
    message = "You do not have permission to perform this action"
  ) {
    return this.error(message, 403);
  }

  /**
   * Create a not found response (404).
   * @param message - Optional error message
   */
  static notFound(message = "The requested resource was not found") {
    return this.error(message, 404);
  }

  /**
   * Create a conflict response (409).
   * Use for duplicate resource errors.
   * @param message - Optional error message
   */
  static conflict(message = "This resource already exists") {
    return this.error(message, 409);
  }

  /**
   * Create a server error response (500).
   * @param message - Optional error message
   */
  static serverError(
    message = "An unexpected error occurred. Please try again later."
  ) {
    return this.error(message, 500);
  }

  /**
   * Create a bad request response (400) with optional field errors.
   * @param message - Error message
   * @param fieldErrors - Optional field-level errors
   */
  static badRequest(message: string, fieldErrors?: Record<string, string[]>) {
    return this.error(message, 400, fieldErrors);
  }
}

// Format field name for display
function formatFieldName(field: string): string {
  return field
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .trim()
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}

interface MongoError {
  name?: string;
  code?: number;
  keyPattern?: Record<string, unknown>;
  keyValue?: Record<string, unknown>;
  errors?: Record<string, { message: string }>;
  message?: string;
  statusCode?: number;
  status?: number;
}

export function handleApiError(error: unknown) {
  console.error("API Error:", error);

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return ApiResponse.validationError(
      error.issues as Array<{ path?: PropertyKey[]; message: string }>
    );
  }

  const mongoError = error as MongoError;

  // Handle Mongoose validation errors
  if (mongoError.name === "ValidationError" && mongoError.errors) {
    const formattedErrors: Record<string, string[]> = {};
    Object.keys(mongoError.errors).forEach((field) => {
      formattedErrors[field] = [mongoError.errors![field].message];
    });
    return ApiResponse.validationError(
      formattedErrors,
      "Please check the form for errors"
    );
  }

  // Handle MongoDB duplicate key error (11000)
  if (
    mongoError.code === 11000 &&
    mongoError.keyPattern &&
    mongoError.keyValue
  ) {
    const field = Object.keys(mongoError.keyPattern)[0];
    const fieldName = formatFieldName(field);
    const value = mongoError.keyValue[field];

    let message = `${fieldName} "${value}" is already in use`;

    // Specific messages for common fields
    if (field === "email") {
      message = `An account with email "${value}" already exists`;
    } else if (field === "installerCode") {
      message = `Installer code "${value}" is already registered`;
    } else if (field === "cnic") {
      message = `CNIC "${value}" is already registered`;
    } else if (field === "serialNumber") {
      message = `Serial number "${value}" is already registered`;
    }

    return ApiResponse.conflict(message);
  }

  // Handle Cast errors (invalid MongoDB ObjectId)
  if (mongoError.name === "CastError") {
    return ApiResponse.badRequest("Invalid ID format provided");
  }

  // Handle network/connection errors
  if (
    mongoError.message?.includes("ECONNREFUSED") ||
    mongoError.message?.includes("ETIMEDOUT")
  ) {
    return ApiResponse.serverError(
      "Database connection failed. Please try again later."
    );
  }

  // Handle authentication errors
  if (
    mongoError.message?.includes("jwt") ||
    mongoError.message?.includes("token")
  ) {
    return ApiResponse.unauthorized(
      "Your session has expired. Please sign in again."
    );
  }

  // Generic error handler
  const message = mongoError.message || "An unexpected error occurred";
  const status = mongoError.statusCode || mongoError.status || 500;

  return ApiResponse.error(message, status);
}

// Helper to extract error message from various error formats
export function extractErrorMessage(error: unknown): string {
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const err = error as { message?: string; error?: unknown };
    if (err.message) return err.message;
    if (err.error) return extractErrorMessage(err.error);
  }
  return "An unexpected error occurred";
}

// Helper to extract field errors from API response
export function extractFieldErrors(
  error: unknown
): Record<string, string[]> | null {
  if (error && typeof error === "object" && "errors" in error) {
    const err = error as { errors: unknown };
    if (typeof err.errors === "object" && err.errors !== null) {
      return err.errors as Record<string, string[]>;
    }
  }
  return null;
}
